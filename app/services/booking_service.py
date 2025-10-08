import logging
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from fastapi import HTTPException, status
from app.db.models.booking import Booking
from app.db.schemas.booking import BookingCreate, BookingResponse
from sqlalchemy.exc import SQLAlchemyError
import aio_pika, json, os, httpx
from dotenv import load_dotenv

load_dotenv()

RABBITMQ_URL = os.getenv("RABBITMQ_URL")
TRIP_SERVICE_URL = os.getenv("TRIP_SERVICE_URL")  # ex: http://trip-service:8000
QUEUE_NAME = "trip_update_queue"

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.FileHandler("booking_logs.log"), logging.StreamHandler()]
)


async def notify_trip_service_reduce_seats(trip_id: str, booking_id: str, number_of_seats: int):
    """📩 Envoie un message RabbitMQ pour réduire les places disponibles du trajet"""
    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    async with connection:
        channel = await connection.channel()
        await channel.declare_queue(QUEUE_NAME, durable=True)

        message_body = {
            "action": "decrease_available_seats",
            "trip_id": trip_id,
            "booking_id": booking_id,
            "number_of_seats": number_of_seats
        }

        message = aio_pika.Message(
            body=json.dumps(message_body).encode(),
            content_type="application/json",
            delivery_mode=aio_pika.DeliveryMode.PERSISTENT
        )

        await channel.default_exchange.publish(message, routing_key=QUEUE_NAME)
        logging.info(f"[RabbitMQ] Message envoyé: {message_body}")


async def get_trip_details(trip_id: str):
    """🌐 Vérifie le trajet via le microservice Trip"""
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(f"{TRIP_SERVICE_URL}tp/get_trip_by_id/{trip_id}")
        if response.status_code != 200:
            raise HTTPException(status_code=404, detail="Trajet introuvable.")
        return response.json()


async def create_booking(db: AsyncSession, data: BookingCreate) -> BookingResponse:
    """
    🎟️ Crée une réservation avec toutes les validations métier nécessaires.
    """

    try:
        # 1️⃣ Vérifier que le trajet existe et est "active/published"
        trip_data = await get_trip_details(data.id_trip)
        if trip_data["status"] not in ["pending"]:
            raise HTTPException(status_code=400, detail="Ce trajet n'est pas disponible à la réservation.")

        # 2️⃣ Vérifier que le chauffeur n’essaie pas de réserver son propre trajet
        if str(trip_data["driver_id"]) == str(data.id_user):
            raise HTTPException(status_code=400, detail="Le conducteur ne peut pas réserver son propre trajet.")

        # 3️⃣ Vérifier que la date du trajet n’est pas déjà passée
        departure_date = datetime.strptime(trip_data["departure_date"], "%Y-%m-%d").date()
        if departure_date < datetime.utcnow().date():
            raise HTTPException(status_code=400, detail="Ce trajet est déjà passé.")

        # 4️⃣ Vérifier qu’il reste assez de places disponibles
        available_seats = trip_data.get("available_seats", 0)
        if available_seats < data.number_of_seats:
            raise HTTPException(status_code=400, detail="Nombre de places insuffisant.")

        # 5️⃣ Vérifier que le passager n’a pas déjà réservé ce trajet
        query = select(Booking).where(
            Booking.id_user == data.id_user,
            Booking.id_trip == data.id_trip,
            Booking.status.in_(["pending", "completed"])
        )
        existing = await db.execute(query)
        if existing.scalars().first():
            raise HTTPException(status_code=409, detail="L'utilisateur a déjà réservé ce trajet.")

        # 6️⃣ Créer la réservation
        booking = Booking(
            id_user=data.id_user,
            id_trip=data.id_trip,
            id_stop=data.id_stop,
            number_of_seats=data.number_of_seats,
            price_per_seat=data.price_per_seat,
            reservation_fee_per_seat=data.reservation_fee_per_seat,
            total_trip_price=data.total_trip_price,
            total_reservation_fee=data.total_reservation_fee,
            total_to_pay=data.total_to_pay,
            chauffeur_payment_method=data.chauffeur_payment_method,
            payment_method_used=data.payment_method_used,
            status="pending",
           
            created_at=datetime.utcnow()
        )

        db.add(booking)
        await db.commit()
        await db.refresh(booking)

        # 7️⃣ Envoi du message RabbitMQ
        try:
            await notify_trip_service_reduce_seats(
                trip_id=str(data.id_trip),
                booking_id=str(booking.id),
                number_of_seats=data.number_of_seats
            )
            booking.payment_status = "completed"
        except Exception as e:
            logging.error(f"[RabbitMQ] Erreur lors de l'envoi du message : {e}")
            booking.payment_status = "failed"

        # 8️⃣ Validation finale
        await db.commit()
        await db.refresh(booking)

        logging.info(f"✅ Réservation créée avec succès pour l'utilisateur {data.id_user}")
        return BookingResponse.from_orm(booking)

    except HTTPException:
        raise  # ne pas masquer les erreurs métier
    except SQLAlchemyError as e:
        await db.rollback()
        logging.error(f"❌ Erreur SQLAlchemy : {e}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la création de la réservation.")
    except Exception as e:
        await db.rollback()
        logging.error(f"❌ Erreur inattendue : {e}")
        raise HTTPException(status_code=500, detail="Erreur inattendue du serveur Booking.")
