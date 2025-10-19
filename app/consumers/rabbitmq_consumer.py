import asyncio
import json
import logging
import aio_pika
from app.db.database import async_session 
from app.services.trip_service import update_available_seats
import os
from dotenv import load_dotenv

load_dotenv()
RABBITMQ_URL = os.getenv("RABBITMQ_URL")
QUEUE_NAME = os.getenv("TRIP_QUEUE_NAME", "trip_update_queue")

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
            action = data.get("action")
            trip_id = data.get("trip_id")
            number_of_seats = int(data.get("number_of_seats", 0))

            if not trip_id or number_of_seats <= 0:
                logging.warning(f"Message invalide : {data}")
                return

            logging.info(f"📩 Message reçu : {data}")

            async with async_session() as db:
                if action == "decrease_available_seats":
                    await update_available_seats(db, trip_id, -number_of_seats)
                elif action == "increase_available_seats":
                    await update_available_seats(db, trip_id, number_of_seats)
                else:
                    logging.warning(f"Action inconnue : {action}")

        except Exception as e:
            logging.error(f"❌ Erreur lors du traitement du message : {e}")

async def start_rabbitmq_consumer():
    """🎧 Écoute en continu la file RabbitMQ"""
    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    channel = await connection.channel()
    queue = await channel.declare_queue(QUEUE_NAME, durable=True)

    logging.info(f"🟢 [Trip Service] En écoute sur RabbitMQ ({QUEUE_NAME})...")
    await queue.consume(process_message)
    await asyncio.Future()  # garde la boucle active
