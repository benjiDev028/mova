import logging
import os
import uuid
import json
from datetime import datetime, date
from enum import Enum
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import HTTPException
from sqlalchemy import select, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
import aio_pika

# 🧩 Imports internes
from app.db.models.trip import Trip
from app.db.models.preference import Preference
from app.db.models.stop import Stop
from app.db.schemas.trip import (
    TripCreate,
    TripResponse,
    TripReserveSeat,
    TripCancelSeat,
)
from app.db.schemas.preference import PreferenceResponse
from app.db.schemas.stop import StopResponse

# ==============================
# LOGGING CONFIGURATION
# ==============================
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("trip_logs.log"), logging.StreamHandler()],
)

load_dotenv()

RABBITMQ_URL = os.getenv("RABBITMQ_URL")
QUEUE_NAME = os.getenv("QUEUE_NAME", "trip_notifications")

async def publish_trip_completed(trip_id: str):
    """
    Publie un événement quand un trip est complété
    Pour notifier payment_service de mettre les earnings en PAYABLE
    """
    RABBITMQ_URL = os.getenv("RABBITMQ_URL")
    QUEUE_NAME = "trip_completed_queue"
    
    if not RABBITMQ_URL:
        logging.warning("RABBITMQ_URL non défini, skip publish trip_completed")
        return
    
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        async with connection:
            channel = await connection.channel()
            queue = await channel.declare_queue(QUEUE_NAME, durable=True)
            
            message_body = {
                "event": "trip.completed",
                "trip_id": trip_id,
                "completed_at": datetime.utcnow().isoformat()
            }
            
            message = aio_pika.Message(
                body=json.dumps(message_body).encode("utf-8"),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            )
            
            await channel.default_exchange.publish(message, routing_key=QUEUE_NAME)
            logging.info(f"✅ Événement trip.completed publié pour trip {trip_id}")
    
    except Exception as e:
        logging.error(f"❌ Erreur publication trip.completed: {e}")


# =========================================================
# 🔧 MISE À JOUR DU NOMBRE DE PLACES DISPONIBLES
# =========================================================
async def update_available_seats(db: AsyncSession, trip_id: str, delta: int):
    """
    🔁 Met à jour de manière sécurisée le nombre de places disponibles pour un trajet.
    delta peut être positif (+) ou négatif (-).
    """
    try:
        query = select(Trip).where(Trip.id == trip_id)
        result = await db.execute(query)
        trip = result.scalars().first()

        if not trip:
            logging.error(f"[TripService] ❌ Trajet {trip_id} introuvable.")
            raise HTTPException(status_code=404, detail="Trajet introuvable")

        new_value = trip.available_seats + delta

        if new_value < 0:
            logging.warning(
                f"[TripService] ⚠️ Tentative de retirer trop de places : {trip.available_seats} dispo, delta={delta}"
            )
            raise HTTPException(status_code=400, detail="Pas assez de places disponibles")

        if hasattr(trip, "max_seats"):
            new_value = min(new_value, trip.max_seats)

        trip.available_seats = new_value
        trip.updated_at = datetime.utcnow()

        await db.commit()
        await db.refresh(trip)

        logging.info(
            f"[TripService] ✅ Trajet {trip_id}: places modifiées ({delta:+d}), "
            f"nouvelles disponibles: {trip.available_seats}"
        )

        return trip

    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        logging.error(f"[TripService] ❌ Erreur lors de la mise à jour des places: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la mise à jour du trajet")


# =========================================================
# 📩 ENVOI NOTIFICATION CRÉATION TRAJET
# =========================================================
async def send_trip_creation_notification(trip_data: dict) -> None:
    """Envoi d'un message structuré à RabbitMQ pour la création d'un voyage."""
    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        async with connection:
            channel = await connection.channel()
            queue = await channel.declare_queue(QUEUE_NAME, durable=True)

            message_json = json.dumps(trip_data, default=str)
            message = aio_pika.Message(
                body=message_json.encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            )

            await channel.default_exchange.publish(message, routing_key=queue.name)
            logging.info(f"📤 Message envoyé à RabbitMQ pour le voyage ID: {trip_data.get('id')}")

    except Exception as e:
        logging.error(f"Erreur lors de l'envoi du message RabbitMQ : {str(e)}")


# =========================================================
# 🚗 CRÉATION DE TRAJET
# =========================================================
async def create_trip_service(db: AsyncSession, trip_data: TripCreate) -> TripResponse:
    trip_id = uuid.uuid4()
    trip = Trip(
        id=trip_id,
        car_id=trip_data.car_id,
        driver_id=trip_data.driver_id,
        departure_city=trip_data.departure_city,
        destination_city=trip_data.destination_city,
        departure_place=trip_data.departure_place,
        destination_place=trip_data.destination_place,
        departure_time=trip_data.departure_time,
        departure_date=trip_data.departure_date,
        total_price=trip_data.total_price,
        available_seats=trip_data.available_seats,
        message=trip_data.message,
        status=trip_data.status,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    try:
        db.add(trip)
        await db.flush()

        preferences = Preference(
            id=uuid.uuid4(),
            trip_id=trip_id,
            baggage=trip_data.preferences.baggage,
            ski_support=trip_data.preferences.ski_support,
            bike_support=trip_data.preferences.bike_support,
            air_conditioning=trip_data.preferences.air_conditioning,
            pets_allowed=trip_data.preferences.pets_allowed,
            smoking_allowed=trip_data.preferences.smoking_allowed,
            mode_payment=trip_data.preferences.mode_payment,
        )
        db.add(preferences)

        stops = []
        if trip_data.stops:
            for stop_data in trip_data.stops:
                stop = Stop(
                    id=uuid.uuid4(),
                    trip_id=trip_id,
                    destination_city=stop_data.destination_city,
                    price=stop_data.price,
                )
                db.add(stop)
                stops.append(stop)

        await db.commit()

        try:
            await send_trip_creation_notification({
                "id": str(trip.id),
                "driver_id": str(trip.driver_id),
                "departure_city": trip.departure_city,
                "destination_city": trip.destination_city,
                "departure_date": trip.departure_date.isoformat(),
                "departure_time": trip.departure_time.isoformat(),
                "created_at": trip.created_at.isoformat(),
            })
        except Exception as e:
            logging.warning(f"Échec notification RabbitMQ: {e}")

        return TripResponse(
            id=trip.id,
            driver_id=trip.driver_id,
            car_id=trip.car_id,
            departure_city=trip.departure_city,
            destination_city=trip.destination_city,
            departure_place=trip.departure_place,
            destination_place=trip.destination_place,
            departure_time=trip.departure_time,
            departure_date=trip.departure_date,
            total_price=trip.total_price,
            available_seats=trip.available_seats,
            message=trip.message,
            status=trip.status,
            created_at=trip.created_at,
            updated_at=trip.updated_at,
            preferences=PreferenceResponse(
                id=preferences.id,
                trip_id=preferences.trip_id,
                baggage=preferences.baggage,
                pets_allowed=preferences.pets_allowed,
                smoking_allowed=preferences.smoking_allowed,
                air_conditioning=preferences.air_conditioning,
                bike_support=preferences.bike_support,
                ski_support=preferences.ski_support,
                mode_payment=preferences.mode_payment,
            ),
            stops=[
                StopResponse(
                    id=s.id,
                    trip_id=s.trip_id,
                    destination_city=s.destination_city,
                    price=s.price,
                )
                for s in stops
            ],
        )

    except Exception as e:
        await db.rollback()
        logging.error(f"Erreur création trajet: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la création du trajet: {e}")


# =========================================================
# 🔎 RECHERCHE ET CONSULTATION DE TRAJETS
# =========================================================
async def get_trip_by_id_service(db: AsyncSession, trip_id: uuid.UUID) -> TripResponse:
    query = (
        select(Trip)
        .options(joinedload(Trip.preferences), joinedload(Trip.stops))
        .where(Trip.id == trip_id)
    )
    result = await db.execute(query)
    trip = result.scalars().first()

    if not trip:
        logging.error(f"Voyage {trip_id} non trouvé.")
        raise HTTPException(status_code=404, detail="Voyage non trouvé.")
    return trip


async def search_trips_service(
    db: AsyncSession,
    departure_city: Optional[str],
    destination_city: Optional[str],
    departure_date: date,
    status: str = "pending",
    skip: int = 0,
    limit: int = 100,
) -> List[TripResponse]:
    query = (
        select(Trip)
        .options(joinedload(Trip.preferences), joinedload(Trip.stops))
        .filter(Trip.status == status, Trip.departure_date == departure_date)
    )

    if departure_city:
        query = query.filter(Trip.departure_city.ilike(f"%{departure_city}%"))
    if destination_city:
        query = query.filter(Trip.destination_city.ilike(f"%{destination_city}%"))

    result = await db.execute(query.offset(skip).limit(limit))
    trips = result.scalars().unique().all()

    logging.info(f"🔍 {len(trips)} trajet(s) trouvé(s)")
    return trips


async def search_trips_advanced_service(
    db: AsyncSession,
    departure_city: Optional[str],
    destination_city: Optional[str],
    departure_date: date,
    status: str = "pending",
    skip: int = 0,
    limit: int = 100,
) -> List[TripResponse]:
    query = (
        select(Trip)
        .options(joinedload(Trip.preferences), joinedload(Trip.stops))
        .filter(Trip.status == status, Trip.departure_date == departure_date)
    )

    if departure_city:
        query = query.filter(Trip.departure_city.ilike(f"%{departure_city}%"))
    if destination_city:
        query = query.filter(
            or_(
                Trip.destination_city.ilike(f"%{destination_city}%"),
                Trip.stops.any(Stop.destination_city.ilike(f"%{destination_city}%")),
            )
        )

    result = await db.execute(query.offset(skip).limit(limit))
    trips = result.scalars().unique().all()
    logging.info(f"🔍 {len(trips)} trajet(s) trouvé(s)")
    return trips


async def get_all_trips_service(db: AsyncSession) -> List[TripResponse]:
    result = await db.execute(
        select(Trip).options(joinedload(Trip.preferences), joinedload(Trip.stops))
    )
    trips = result.scalars().unique().all()
    return trips


async def get_trip_by_status_service(db: AsyncSession, status: str) -> List[TripResponse]:
    valid_statuses = ["pending", "ongoing", "completed", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Statut invalide: {status}")

    result = await db.execute(
        select(Trip)
        .options(joinedload(Trip.preferences), joinedload(Trip.stops))
        .where(Trip.status == status)
    )
    trips = result.scalars().unique().all()
    return trips


async def get_trip_by_driver_id_service(db: AsyncSession, driver_id: uuid.UUID) -> List[TripResponse]:
    result = await db.execute(
        select(Trip)
        .options(joinedload(Trip.preferences), joinedload(Trip.stops))
        .where(Trip.driver_id == driver_id)
    )
    return result.scalars().unique().all()


# =========================================================
# 🎟️ RÉSERVATION / ANNULATION DE PLACES
# =========================================================
async def reserve_seat_service(db: AsyncSession, data: TripReserveSeat) -> Trip:
    query = select(Trip).where(Trip.id == data.trip_id)
    result = await db.execute(query)
    trip = result.scalars().first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trajet non trouvé")

    if trip.available_seats <= 0 or trip.available_seats < data.seats:
        raise HTTPException(status_code=400, detail="Aucune place disponible")

    trip.available_seats -= data.seats
    trip.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(trip)
    return trip


async def cancel_seat_reservation_service(db: AsyncSession, data: TripCancelSeat) -> Trip:
    query = select(Trip).where(Trip.id == data.trip_id)
    result = await db.execute(query)
    trip = result.scalars().first()

    if not trip:
        raise HTTPException(status_code=404, detail="Trajet non trouvé")

    trip.available_seats += data.seats
    trip.updated_at = datetime.utcnow()

    await db.commit()
    await db.refresh(trip)
    return trip


# =========================================================
# 🧭 RECHERCHES AVANCÉES
# =========================================================
async def get_trips_with_stop_service(db: AsyncSession, city: str) -> List[Trip]:
    query = (
        select(Trip)
        .options(joinedload(Trip.preferences), joinedload(Trip.stops))
        .filter(Trip.stops.any(destination_city=city))
    )
    result = await db.execute(query)
    return result.scalars().unique().all()


# =========================================================
# 🔄 MISE À JOUR DU STATUT D’UN TRAJET
# =========================================================
class TripStatus(str, Enum):
    PENDING = "pending"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


def is_valid_transition(current_status: TripStatus, new_status: TripStatus) -> bool:
    transitions = {
        TripStatus.PENDING: [TripStatus.ONGOING, TripStatus.CANCELLED],
        TripStatus.ONGOING: [TripStatus.COMPLETED],
        TripStatus.COMPLETED: [],
        TripStatus.CANCELLED: [],
    }
    return new_status in transitions.get(current_status, [])


from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.db.schemas.trip import TripResponse, PreferenceResponse, StopResponse
import uuid
from fastapi import HTTPException

async def update_trip_status_service(db: AsyncSession, trip_id: uuid.UUID, new_status: TripStatus) -> TripResponse:
    # 1) lire le trip sans lazy
    res = await db.execute(
        select(Trip)
        .options(selectinload(Trip.preferences), selectinload(Trip.stops))
        .where(Trip.id == trip_id)
    )
    trip = res.scalars().first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trajet non trouvé")

    if not is_valid_transition(trip.status, new_status):
        raise HTTPException(status_code=400, detail=f"Transition non autorisée de {trip.status} à {new_status}")

    # 2) update + commit
    trip.status = new_status
    trip.updated_at = datetime.utcnow()
    await db.commit()

        # 🆕 Si le trip passe en COMPLETED, publier événement
    if new_status == TripStatus.COMPLETED:
        await publish_trip_completed(str(trip_id))

    # 3) re-read avec selectinload pour sérialisation safe
    res = await db.execute(
        select(Trip)
        .options(selectinload(Trip.preferences), selectinload(Trip.stops))
        .where(Trip.id == trip_id)
    )
    trip = res.scalars().first()

    # 4) map -> TripResponse (pas d’accès lazy ici)
    return TripResponse(
        id=trip.id,
        driver_id=trip.driver_id,
        car_id=trip.car_id,
        departure_city=trip.departure_city,
        destination_city=trip.destination_city,
        departure_place=trip.departure_place,
        destination_place=trip.destination_place,
        departure_time=trip.departure_time,
        departure_date=trip.departure_date,
        total_price=trip.total_price,
        available_seats=trip.available_seats,
        message=trip.message,
        status=trip.status,
        created_at=trip.created_at,
        updated_at=trip.updated_at,
        preferences=PreferenceResponse(
            id=trip.preferences.id,
            trip_id=trip.preferences.trip_id,
            baggage=trip.preferences.baggage,
            pets_allowed=trip.preferences.pets_allowed,
            smoking_allowed=trip.preferences.smoking_allowed,
            air_conditioning=trip.preferences.air_conditioning,
            bike_support=trip.preferences.bike_support,
            ski_support=trip.preferences.ski_support,
            mode_payment=trip.preferences.mode_payment,
        ) if trip.preferences else None,
        stops=[
            StopResponse(
                id=s.id,
                trip_id=s.trip_id,
                destination_city=s.destination_city,
                price=s.price,
            ) for s in trip.stops or []
        ],
    )

# =========================================================
# 📅 TRAJETS PAR DATE OU CONDUCTEUR
# =========================================================
async def get_upcoming_trips_by_driver_service(db: AsyncSession, driver_id: uuid.UUID) -> List[Trip]:
    today = date.today()
    result = await db.execute(
        select(Trip)
        .options(joinedload(Trip.preferences), joinedload(Trip.stops))
        .where(Trip.driver_id == driver_id, Trip.departure_date >= today)
        .order_by(Trip.departure_date.asc(), Trip.departure_time.asc())
    )
    return result.scalars().unique().all()


async def get_trips_by_stop_city_service(db: AsyncSession, stop_city: str) -> List[TripResponse]:
    result = await db.execute(
        select(Trip)
        .join(Stop)
        .options(joinedload(Trip.preferences), joinedload(Trip.stops))
        .where(
            Stop.destination_city.ilike(f"%{stop_city}%"),
            Trip.status == "pending",
        )
    )
    return result.scalars().unique().all()


async def get_today_trips_service(db: AsyncSession) -> List[TripResponse]:
    today = date.today()
    result = await db.execute(
        select(Trip)
        .options(joinedload(Trip.preferences), joinedload(Trip.stops))
        .where(Trip.departure_date == today)
    )
    return result.scalars().unique().all()


# =========================================================
# 📜 HISTORIQUE DES TRAJETS
# =========================================================
async def get_driver_trip_history_service(db: AsyncSession, driver_id: uuid.UUID) -> List[TripResponse]:
    result = await db.execute(
        select(Trip)
        .options(joinedload(Trip.preferences), joinedload(Trip.stops))
        .where(
            Trip.driver_id == driver_id,
            Trip.status.in_(["completed", "cancelled"]),
        )
    )
    return result.scalars().unique().all()


