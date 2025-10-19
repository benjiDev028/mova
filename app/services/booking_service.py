# app/services/booking_service.py
import os, json, logging, traceback, uuid
from decimal import Decimal, ROUND_HALF_UP
from datetime import datetime, timezone
from typing import List

from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

import aio_pika
import httpx
from dotenv import load_dotenv

from app.db.models.booking import Booking, BookingStatus
from app.db.schemas.booking import BookingCreate, BookingResponse

load_dotenv()

RABBITMQ_URL = os.getenv("RABBITMQ_URL")
TRIP_SERVICE_URL = os.getenv("TRIP_SERVICE_URL", "").rstrip("/")
QUEUE_NAME = os.getenv("TRIP_QUEUE_NAME", "trip_update_queue")

logger = logging.getLogger(__name__)

# ---------- helpers ----------

def _q(v: Decimal) -> Decimal:
    """Quantize to cents with bankers rounding compatible with accounting."""
    return (v if isinstance(v, Decimal) else Decimal(str(v))).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)

def _compute_amounts(
    seats: int,
    price_per_seat: Decimal,
    fee_per_seat: Decimal,
    tax_rate: Decimal,
    chauffeur_payment_method: str,
) -> dict:
    base = _q(Decimal(seats) * price_per_seat)
    fee  = _q(Decimal(seats) * fee_per_seat)

    if chauffeur_payment_method == "cash":
        charged_pretax = fee
        driver_payable = Decimal("0.00")
        driver_cash    = base
    else:  # virement
        charged_pretax = base + fee
        driver_payable = base
        driver_cash    = Decimal("0.00")

    tax   = _q(charged_pretax * tax_rate)
    total = _q(charged_pretax + tax)

    return {
        "base_total": base,
        "fee_total": fee,
        "tax_total": tax,
        "charged_now_total": total,
        "driver_payable": driver_payable,
        "driver_collected_cash": driver_cash,
    }

async def _notify_trip_reduce_seats(trip_id: str, booking_id: str, number_of_seats: int):
    if not RABBITMQ_URL:
        logger.warning("RABBITMQ_URL non défini, skip publish.")
        return
    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    async with connection:
        channel = await channel_with_queue(connection)
        message_body = {
            "action": "decrease_available_seats",
            "trip_id": trip_id,
            "booking_id": booking_id,
            "number_of_seats": number_of_seats,
        }
        msg = aio_pika.Message(
            body=json.dumps(message_body).encode("utf-8"),
            content_type="application/json",
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        )
        await channel.default_exchange.publish(msg, routing_key=QUEUE_NAME)
        logger.info(f"[RabbitMQ] published {message_body}")

async def channel_with_queue(connection):
    channel = await connection.channel()
    await channel.declare_queue(QUEUE_NAME, durable=True)
    return channel

async def _get_trip_details(trip_id: str) -> dict:
    if not TRIP_SERVICE_URL:
        raise HTTPException(status_code=500, detail="TRIP_SERVICE_URL manquant.")
    url = f"{TRIP_SERVICE_URL}/tp/get_trip_by_id/{trip_id}"
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url)
        if resp.status_code != 200:
            raise HTTPException(status_code=404, detail="Trajet introuvable.")
        return resp.json()

# ---------- services ----------

async def create_booking(db: AsyncSession, data: BookingCreate) -> BookingResponse:
    try:
        # 1) valider le trip
        trip = await _get_trip_details(str(data.id_trip))

        # a) statut du trip
        if str(trip.get("status")) not in {"pending", "active", "published"}:
            raise HTTPException(status_code=400, detail="Ce trajet n'est pas disponible à la réservation.")

        # b) le conducteur ne peut pas réserver
        if str(trip.get("driver_id")) == str(data.id_user):
            raise HTTPException(status_code=400, detail="Le conducteur ne peut pas réserver son propre trajet.")

        # c) date non passée
        dep_date_str = trip.get("departure_date")  # "YYYY-MM-DD"
        if dep_date_str:
            departure_date = datetime.strptime(dep_date_str, "%Y-%m-%d").date()
            if departure_date < datetime.utcnow().date():
                raise HTTPException(status_code=400, detail="Ce trajet est déjà passé.")

        # d) disponibilité sièges
        available_seats = int(trip.get("available_seats", 0))
        if available_seats < int(data.number_of_seats):
            raise HTTPException(status_code=400, detail="Nombre de places insuffisant.")

        # e) éviter double réservation utilisateur pour ce trip (confirmed|completed)
        q = select(Booking).where(
            Booking.id_user == data.id_user,
            Booking.id_trip == data.id_trip,
            Booking.status.in_([BookingStatus.confirmed, BookingStatus.completed]),
        )
        if (await db.execute(q)).scalars().first():
            raise HTTPException(status_code=409, detail="L'utilisateur a déjà une réservation valide sur ce trajet.")

        # 2) calculs snapshot
        amounts = _compute_amounts(
            seats=data.number_of_seats,
            price_per_seat=Decimal(data.price_per_seat),
            fee_per_seat=Decimal(data.reservation_fee_per_seat),
            tax_rate=Decimal(data.tax_rate),
            chauffeur_payment_method=data.chauffeur_payment_method,
        )

        # 3) création booking
        booking = Booking(
            id_user=data.id_user,
            id_trip=data.id_trip,
            id_stop=data.id_stop,
            id_driver=data.id_driver,

            number_of_seats=data.number_of_seats,
            price_per_seat=Decimal(data.price_per_seat),
            reservation_fee_per_seat=Decimal(data.reservation_fee_per_seat),

            currency=data.currency,
            tax_rate=Decimal(data.tax_rate),
            tax_region=data.tax_region,

            base_total=amounts["base_total"],
            fee_total=amounts["fee_total"],
            tax_total=amounts["tax_total"],
            charged_now_total=amounts["charged_now_total"],

            chauffeur_payment_method=data.chauffeur_payment_method,
            payment_method_used=data.payment_method_used,

            driver_payable=amounts["driver_payable"],
            driver_collected_cash=amounts["driver_collected_cash"],

            free_cancellation_until=data.free_cancellation_until,
            status=BookingStatus.confirmed,
        )

        db.add(booking)
        await db.commit()
        await db.refresh(booking)

        # 4) notifier seats--
        try:
            await _notify_trip_reduce_seats(
                trip_id=str(data.id_trip),
                booking_id=str(booking.id),
                number_of_seats=int(data.number_of_seats),
            )
        except Exception as e:
            logger.error(f"[RabbitMQ] erreur publish: {e}")

        return BookingResponse.model_validate(booking)

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logger.error(f"create_booking error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Erreur interne lors de la création de la réservation.")

async def get_booking_by_user(db: AsyncSession, id_user: uuid.UUID) -> List[BookingResponse]:
    try:
        res = await db.execute(
            select(Booking).where(Booking.id_user == id_user).order_by(Booking.created_at.desc())
        )
        rows = res.scalars().all()
        return [BookingResponse.model_validate(b) for b in rows]
    except Exception as e:
        logger.error(f"get_booking_by_user error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Erreur interne lors de la récupération des réservations utilisateur.")

async def get_passengers_by_trip(db: AsyncSession, trip_id: uuid.UUID) -> List[BookingResponse]:
    try:
        res = await db.execute(
            select(Booking).where(Booking.id_trip == trip_id).order_by(Booking.created_at.desc())
        )
        rows = res.scalars().all()
        return [BookingResponse.model_validate(b) for b in rows]
    except Exception as e:
        logger.error(f"get_passengers_by_trip error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Erreur interne lors de la récupération des passagers du trajet.")
# ... imports déjà présents
from app.db.models.booking import Booking, BookingStatus
from app.db.schemas.booking import (
    BookingCreate, BookingResponse,
    BookingCancelRequest, BookingCancelResponse,
    CompleteByTripRequest, CompleteByTripResponse,
)

# ---------- RabbitMQ helpers (ajoute ce publish pour +seats) ----------

async def _notify_trip_increase_seats(trip_id: str, booking_id: str, number_of_seats: int):
    if not RABBITMQ_URL:
        logger.warning("RABBITMQ_URL non défini, skip publish (+seats).")
        return
    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    async with connection:
        channel = await channel_with_queue(connection)
        message_body = {
            "action": "increase_available_seats",
            "trip_id": trip_id,
            "booking_id": booking_id,
            "number_of_seats": number_of_seats,
        }
        msg = aio_pika.Message(
            body=json.dumps(message_body).encode("utf-8"),
            content_type="application/json",
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
        )
        await channel.default_exchange.publish(msg, routing_key=QUEUE_NAME)
        logger.info(f"[RabbitMQ] published {message_body}")

# ---------- Reads ----------

async def get_booking_by_id(db: AsyncSession, booking_id:uuid. UUID) -> BookingResponse:
    res = await db.execute(select(Booking).where(Booking.id == booking_id))
    bk = res.scalar_one_or_none()
    if not bk:
        raise HTTPException(status_code=404, detail="Réservation introuvable.")
    return BookingResponse.model_validate(bk)

async def list_bookings_by_driver(db: AsyncSession, driver_id: uuid.UUID) -> List[BookingResponse]:
    res = await db.execute(
        select(Booking).where(Booking.id_driver == driver_id).order_by(Booking.created_at.desc())
    )
    rows = res.scalars().all()
    return [BookingResponse.model_validate(b) for b in rows]

# ---------- Cancel ----------

async def cancel_booking(
    db: AsyncSession,
    booking_id:uuid.UUID,
    body: BookingCancelRequest,
) -> BookingCancelResponse:
    res = await db.execute(select(Booking).where(Booking.id == booking_id))
    bk: Booking | None = res.scalar_one_or_none()
    if not bk:
        raise HTTPException(status_code=404, detail="Réservation introuvable.")

    if bk.status != BookingStatus.confirmed:
        raise HTTPException(status_code=409, detail=f"Impossible d'annuler depuis l'état {bk.status}.")

    now_utc = body.cancelled_at.astimezone(timezone.utc)
    cutoff_utc = bk.free_cancellation_until.astimezone(timezone.utc)
    before_cutoff = now_utc <= cutoff_utc

    seats_to_give_back = 0
    refund_amount = Decimal("0.00")

    # Politique MVP :
    # - cash :
    #    avant cutoff  : refund tout ce qui a été capturé (frais + taxe sur frais) => charged_now_total
    #    après cutoff  : refund 0
    # - virement :
    #    avant cutoff  : refund total captured (base + fee + tax) => charged_now_total, seats++
    #    après cutoff  : garder (fee + tax_on_fee), refund le reste => charged_now_total - (fee + fee*tax_rate)
    if bk.chauffeur_payment_method.value == "cash":
        if before_cutoff:
            refund_amount = Decimal(bk.charged_now_total)
            seats_to_give_back = int(bk.number_of_seats)
        else:
            refund_amount = Decimal("0.00")
            seats_to_give_back = 0
        # driver_payable reste 0 en cash
    else:  # virement
        if before_cutoff:
            refund_amount = Decimal(bk.charged_now_total)
            seats_to_give_back = int(bk.number_of_seats)
            bk.driver_payable = Decimal("0.00")
        else:
            fee = Decimal(bk.fee_total)
            tax_rate = Decimal(bk.tax_rate)
            fee_tax = _q(fee * tax_rate)
            keep = _q(fee + fee_tax)
            refund_amount = _q(Decimal(bk.charged_now_total) - keep)
            seats_to_give_back = 0
            # driver_payable reste tel quel (policy MVP), tu peux l'ajuster si besoin.

    # Passe en cancelled
    bk.status = BookingStatus.cancelled
    await db.commit()
    await db.refresh(bk)

    # Notifier +seats si applicable
    if seats_to_give_back > 0:
        try:
            await _notify_trip_increase_seats(
                trip_id=str(bk.id_trip),
                booking_id=str(bk.id),
                number_of_seats=seats_to_give_back,
            )
        except Exception as e:
            logger.error(f"[RabbitMQ] erreur publish (+seats): {e}")

    # TODO: appeler payment_service pour exécuter le refund (quand prêt)

    return BookingCancelResponse(
        booking=BookingResponse.model_validate(bk),
        refund_amount=_q(refund_amount),
        seats_to_give_back=seats_to_give_back,
        before_cutoff=before_cutoff,
    )

# ---------- Complete by trip ----------

async def complete_by_trip(
    db: AsyncSession,
    trip_id: uuid.UUID,
    body: CompleteByTripRequest,
) -> CompleteByTripResponse:
    res = await db.execute(
        select(Booking).where(
            Booking.id_trip == trip_id,
            Booking.status == BookingStatus.confirmed,
        )
    )
    rows: list[Booking] = list(res.scalars().all())
    for bk in rows:
        bk.status = BookingStatus.completed
        # Ici, si chauffeur_payment_method == virement :
        #   -> créer une entrée payout côté payouts_service (quand il sera en place)
    await db.commit()
    return CompleteByTripResponse(updated=len(rows))
