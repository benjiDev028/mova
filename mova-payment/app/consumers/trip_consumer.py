# app/consumers/trip_consumer.py
import asyncio
import json
import logging
import aio_pika
import os
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import async_session
from app.services.driver_earning_service import mark_trip_earnings_payable

logger = logging.getLogger(__name__)

RABBITMQ_URL = os.getenv("RABBITMQ_URL")
QUEUE_NAME_TRIP_COMPLETED = "trip_completed_queue"


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    handlers=[logging.FileHandler("trip_consumer.log"), logging.StreamHandler()]
)

async def process_message(message: aio_pika.IncomingMessage):
    """
    🔁 Fonction appelée à chaque message reçu de RabbitMQ
    """
    async with message.process():
        try:
            data = json.loads(message.body.decode())
            event = data.get("event")
            trip_id = data.get("trip_id")
            

            if not trip_id:
                logging.warning(f"Message invalide : {data}")
                return

            logging.info(f"📩 Message reçu : {data}")

            async with async_session() as db:
                if event == "trip.completed":
                    await mark_trip_earnings_payable(db, trip_id)
                
                else:
                    logging.warning(f"Action inconnue : {event}")

        except Exception as e:
            logging.error(f"❌ Erreur lors du traitement du message : {e}")

async def start_rabbitmq_consumer():
    """🎧 Écoute en continu la file RabbitMQ"""
    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    channel = await connection.channel()
    queue = await channel.declare_queue(QUEUE_NAME_TRIP_COMPLETED, durable=True)

    logging.info(f"🟢 [PAYMENT Service] En écoute sur RabbitMQ ({QUEUE_NAME_TRIP_COMPLETED})...")
    await queue.consume(process_message)
    await asyncio.Future()  # garde la boucle active
