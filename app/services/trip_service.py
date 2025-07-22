import logging
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
from fastapi import HTTPException
from app.db.models.trip import Trip
from app.db.models.preference import Preference
from app.db.models.stop import Stop
import aio_pika
import json
import uuid
from sqlalchemy.orm import joinedload
from sqlalchemy import or_
from typing import List
from datetime import datetime, time, date
from app.db.schemas.trip import TripCreate, TripResponse,StatusTripUpdate
from app.db.schemas.preference import PreferenceResponse
from app.db.schemas.stop import StopResponse
from typing import Optional 


# Configuration du logger
logging.basicConfig(
    level=logging.INFO, 
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("trip_logs.log"),
        logging.StreamHandler()
    ]
)

load_dotenv()

# URL de RabbitMQ
RABBITMQ_URL = os.getenv("RABBITMQ_URL")
QUEUE_NAME = os.getenv("QUEUE_NAME", "trip_notifications")
QUEUE_NAME_VERIFICATION = os.getenv("QUEUE_NAME_VERIFICATION", "trip_verification")


async def send_trip_creation_notification(trip_data: dict) -> None:
    """Envoi d'un message structuré à RabbitMQ pour la création d'un voyage."""
    try:
        # Connexion à RabbitMQ
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        async with connection:
            channel = await connection.channel()
            queue = await channel.declare_queue(QUEUE_NAME, durable=True)

            # Sérialiser le message en JSON
            message_json = json.dumps(trip_data, default=str)  # default=str pour les UUID/datetime
            
            # Création du message RabbitMQ
            message = aio_pika.Message(
                body=message_json.encode(),
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT  # Message persistant
            )

            # Envoi du message à RabbitMQ
            await channel.default_exchange.publish(message, routing_key=queue.name)
            logging.info(f"Message envoyé à RabbitMQ pour la création du voyage ID: {trip_data.get('id')}")

    except Exception as e:
        logging.error(f"Erreur lors de l'envoi du message RabbitMQ : {str(e)}")
        # Ne pas lever l'exception pour éviter d'interrompre la création du voyage
        # si le service de notification est indisponible

async def create_trip_service(db: Session, trip_data: TripCreate) -> TripResponse:
    # Création du voyage
    trip_id = uuid.uuid4()
    trip = Trip(
        id=trip_id,
        car_id = trip_data.car_id,
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
        created_at=datetime.now().replace(microsecond=0),
        updated_at=datetime.now().replace(microsecond=0),
    )

    try:
        db.add(trip)
        db.flush()  # Important pour obtenir l'ID

        # Création des préférences
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

        # Création des arrêts
        stops = []
        if trip_data.stops:
            for stop_data in trip_data.stops:
                stop = Stop(
                    id=uuid.uuid4(),
                    trip_id=trip_id,
                    destination_city=stop_data.destination_city,
                    price=stop_data.price,
                    # Ajoutez ici les autres champs nécessaires
                )
                db.add(stop)
                stops.append(stop)

        db.commit()

        # Notification
        try:
            await send_trip_creation_notification({
                "id": str(trip.id),
                "driver_id": str(trip.driver_id),
                "departure_city": trip.departure_city,
                "destination_city": trip.destination_city,
                "departure_date": trip.departure_date.isoformat(),
                "departure_time": trip.departure_time.isoformat(),
                "created_at": trip.created_at.isoformat()
            })
        except Exception as e:
            logging.warning(f"Échec de la notification: {str(e)}")

        # Construction de la réponse
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
                mode_payment=preferences.mode_payment
            ),
            stops=[StopResponse(
                id=s.id,
                trip_id=s.trip_id,
                destination_city=s.destination_city,
                price=s.price
            ) for s in stops]
        )

    except Exception as e:
        db.rollback()
        logging.error(f"Erreur création trajet: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Erreur lors de la création du trajet: {str(e)}"
        )

# Service corrigé pour get_trip_by_id_service
async def get_trip_by_id_service(db: Session, trip_id: uuid) -> TripResponse:
    # Utiliser joinedload au lieu de join explicite
    trip = db.query(Trip).options(
        joinedload(Trip.preferences),
        joinedload(Trip.stops)
    ).filter(Trip.id == trip_id).first()
    
    if not trip:
        logging.error(f"Voyage avec l'ID {trip_id} non trouvé.")
        raise HTTPException(status_code=404, detail="Voyage non trouvé.")
    
    # Construction de la réponse
    return trip

# Service function version (if you prefer separation of concerns)
async def search_trips_service(
    db: Session,
    departure_city: Optional[str],
    destination_city: Optional[str],
    departure_date: date,
    status: str = "pending",  # Default value
    skip: int = 0,
    limit: int = 100
) -> List[TripResponse]:
    """
    Service function for searching trips.
    Can be called from multiple endpoints.
    """
    query = db.query(Trip).options(
        joinedload(Trip.preferences),
        joinedload(Trip.stops)
    )
    
    # Required filters
    query = query.filter(
        Trip.status == status,
        Trip.departure_date == departure_date
    )
    
    # Optional filters
    if departure_city:
        query = query.filter(Trip.departure_city.ilike(f"%{departure_city}%"))
    

    
    trips = query.offset(skip).limit(limit).all()
    
    if not trips:
        logging.info(f"🔎 Aucun trajet trouvé avec les filtres : departure_city={departure_city}, destination_city={destination_city}, departure_date={departure_date}")
    else:
        logging.info(f"✅ {len(trips)} trajet(s) trouvé(s)")
    
    return trips

async def search_trips_advanced_service(
    db: Session,
    departure_city: Optional[str],
    destination_city: Optional[str],
    departure_date: date,
    status: str = "pending",  # Default value
    skip: int = 0,
    limit: int = 100
) -> List[TripResponse]:
    """
    Service function for searching trips.
    Can be called from multiple endpoints.
    """
    query = db.query(Trip).options(
        joinedload(Trip.preferences),
        joinedload(Trip.stops)
    )
    
    # Required filters
    query = query.filter(
        Trip.status == status,
        Trip.departure_date == departure_date
    )
    
    # Optional filters
    if departure_city:
        query = query.filter(Trip.departure_city.ilike(f"%{departure_city}%"))
    
    if destination_city:
        query = query.filter(
            or_(
                Trip.destination_city.ilike(f"%{destination_city}%"),
                Trip.stops.any(Stop.destination_city.ilike(f"%{destination_city}%"))
            )
        )
    
    trips = query.offset(skip).limit(limit).all()
    
    if not trips:
        logging.info(f"🔎 Aucun trajet trouvé avec les filtres : departure_city={departure_city}, destination_city={destination_city}, departure_date={departure_date}")
    else:
        logging.info(f"✅ {len(trips)} trajet(s) trouvé(s)")
    
    return trips

async def get_all_trips_service(db: Session) -> List[TripResponse]:
    trips = db.query(Trip).options(
        joinedload(Trip.preferences),
        joinedload(Trip.stops)
    ).all()
    
    if not trips:
        logging.info("Aucun voyage trouvé.")
        return []
    
    # Construction de la réponse
    return trips

async def get_trip_by_status_service(db: Session, status: str) -> List[TripResponse]:

    # Vérification du statut
    valid_statuses = ["pending", "ongoing", "completed", "cancelled"]
    if status not in valid_statuses:
        logging.error(f"Statut invalide: {status}. Statuts valides: {valid_statuses}")
        raise HTTPException(status_code=400, detail=f"Statut invalide. Statuts valides: {valid_statuses}")
    
    # Utiliser joinedload pour charger les relations
    trips = db.query(Trip).options(
        joinedload(Trip.preferences),
        joinedload(Trip.stops)
    ).filter(Trip.status == status).all()
    
    if not trips:
        logging.info(f"Aucun voyage trouvé avec le statut {status}.")
        return []
    
    # Construction de la réponse
    return trips

async def search_trips_service(
    db: Session,
    departure_city: Optional[str],
    destination_city: Optional[str],
    departure_date: date,
    status: str,  # Plus optionnel, valeur par défaut gérée dans l'endpoint
    skip: int,
    limit: int
) -> List[TripResponse]:
    query = db.query(Trip).options(
        joinedload(Trip.preferences),
        joinedload(Trip.stops)
    )

    # Filtrage obligatoire par statut
    query = query.filter(Trip.status == status, Trip.departure_date == departure_date)

    if departure_city:
        query = query.filter(Trip.departure_city.ilike(f"%{departure_city}%"))
    if destination_city:
        query = query.filter(Trip.destination_city.ilike(f"%{destination_city}%"))
    if date:
        query = query.filter(Trip.departure_date == date)

    trips = query.offset(skip).limit(limit).all()

    if not trips:
        logging.info(f"🔎 Aucun trajet trouvé avec les filtres : {departure_city=}, {destination_city=}, {date=}")

    return trips

async def get_trip_by_driver_id_service(db: Session, driver_id: uuid) -> List[TripResponse]:

    trips = db.query(Trip).options(
        joinedload(Trip.preferences),
        joinedload(Trip.stops)
    ).filter(Trip.driver_id == driver_id).all()
    
    if not trips:
        logging.info(f"Aucun voyage trouvé pour le conducteur avec l'ID {driver_id}.")
        return []
    
    # Construction de la réponse
    return trips

async def get_trips_with_stop_service(db: Session, city: str) -> List[Trip]:
    trips = db.query(Trip).options(
        joinedload(Trip.preferences),
        joinedload(Trip.stops)
    ).join(Trip.stops).filter(
        Trip.stops.any(destination_city=city)
    ).all()

    if not trips:
        logging.info(f"Aucun trajet trouvé passant par la ville : {city}")
    return trips

from enum import Enum
from datetime import datetime
from fastapi import HTTPException
from sqlalchemy.orm import Session
import uuid

class TripStatus(str, Enum):
    PENDING = "pending"
    ONGOING = "ongoing"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

async def update_trip_status_service(db: Session, trip_id: uuid.UUID, new_status: TripStatus) -> Trip:
    # Récupérer le trajet
    trip = db.query(Trip).filter(Trip.id == trip_id).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trajet non trouvé")
    
    # Valider la transition d'état
    if not is_valid_transition(trip.status, new_status):
        raise HTTPException(
            status_code=400,
            detail=f"Transition non autorisée de {trip.status} à {new_status}"
        )
    
    # Mettre à jour le statut
    trip.status = new_status
    trip.updated_at = datetime.now().replace(microsecond=0)
    
    db.commit()
    db.refresh(trip)
    return trip

def is_valid_transition(current_status: TripStatus, new_status: TripStatus) -> bool:
    """
    Définit les transitions d'état autorisées
    """
    transitions = {
        TripStatus.PENDING: [TripStatus.ONGOING, TripStatus.CANCELLED],
        TripStatus.ONGOING: [TripStatus.COMPLETED],
        TripStatus.COMPLETED: [],  # Aucun changement après complétion
        TripStatus.CANCELLED: []   # Aucun changement après annulation
    }
    
    return new_status in transitions.get(current_status, [])


async def get_upcoming_trips_by_driver_service(db: Session, driver_id: uuid) -> List[Trip]:
    today = date.today()
    return db.query(Trip).options(
        joinedload(Trip.preferences),
        joinedload(Trip.stops)
    ).filter(
        Trip.driver_id == driver_id,
        Trip.departure_date >= today
    ).order_by(Trip.departure_date.asc(), Trip.departure_time.asc()).all()

async def get_trips_by_stop_city_service(db: Session, stop_city: str) -> List[TripResponse]:
    trips = db.query(Trip).join(Stop).options(
        joinedload(Trip.preferences),
        joinedload(Trip.stops)
    ).filter(
        Stop.destination_city.ilike(f"%{stop_city}%"),
        Trip.status == "pending"  # uniquement les trajets à venir
    ).all()

    if not trips:
        logging.info(f"Aucun trajet trouvé avec un arrêt à {stop_city}.")
        return []

    return trips

async def get_today_trips_service(db: Session) -> List[TripResponse]:
    today = date.today()
    trips = db.query(Trip).options(
        joinedload(Trip.preferences),
        joinedload(Trip.stops)
    ).filter(Trip.departure_date == today).all()

    if not trips:
        logging.info("Aucun trajet trouvé pour aujourd'hui.")
        return []

    return trips


# services/trip_service.py

async def get_driver_trip_history_service(db: Session, driver_id: uuid) -> List[TripResponse]:
    trips = db.query(Trip).options(
        joinedload(Trip.preferences),
        joinedload(Trip.stops)
    ).filter(
        Trip.driver_id == driver_id,
        Trip.status.in_(["completed", "cancelled"])
    ).all()

    if not trips:
        logging.info(f"Aucun historique trouvé pour le conducteur {driver_id}")
        return []

    return trips
