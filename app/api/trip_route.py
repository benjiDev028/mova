from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session,joinedload
from app.db.database import get_db
from app.db.schemas.trip import TripResponse, TripUpdate

from fastapi import APIRouter, Depends, Query
from typing import List
from app.db.models.trip import Trip
from app.db.models.stop import Stop
from app.db.schemas.trip import TripCreate
from app.services.trip_service import get_trip_by_id_service, create_trip_service, get_all_trips_service,get_trip_by_status_service, search_trips_service, get_trip_by_driver_id_service, get_trips_with_stop_service,update_trip_status_service,get_upcoming_trips_by_driver_service,get_trips_by_stop_city_service,get_today_trips_service,get_driver_trip_history_service

from fastapi import FastAPI, HTTPException, Depends, Request
from starlette.responses import JSONResponse
from sqlalchemy import or_, func
from uuid import UUID
import logging
from dotenv import load_dotenv
from datetime import date
from typing import Optional
import os

# Charger les variables d'environnement
load_dotenv()
RABBITMQ_URL = os.getenv("RABBITMQ_URL")

router = APIRouter()
app = FastAPI()

# Configurer le logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)




@router.post("/create_trip", response_model=TripResponse)
async def create_trip_endpoint(trip_data: TripCreate, db: Session = Depends(get_db)):
    """
    Endpoint pour créer un voyage.
    """
   
    trip = await create_trip_service (db,trip_data)
    logger.info(f"Voyage créé avec succès : ")
    return trip
    

@router.get("/get_trip_by_id/{trip_id}", response_model=TripResponse)
async def get_trip_endpoint(trip_id: UUID, db: Session = Depends(get_db)):
    """
    Endpoint pour récupérer un voyage par son ID.
    """
    trip = await get_trip_by_id_service(db, trip_id)
    return trip


@router.get("/get_all_trips", response_model=List[TripResponse])
async def get_all_trips_endpoint(db: Session = Depends(get_db)):
    """
    Endpoint pour récupérer tous les voyages.
    """
    trips = await get_all_trips_service(db)
    return trips


@router.get("/get_trip_by_status/{status}", response_model=List[TripResponse])
async def get_trip_by_status_endpoint(status: str, db: Session = Depends(get_db)):
    """
    Endpoint pour récupérer les voyages par statut.
    """
   
    trips =await get_trip_by_status_service(db, status=status)
    return 


@router.get("/search_trips", response_model=List[TripResponse])
async def search_trips_service(
    departure_date: date,  # Required (no default)
    status: str,          # Required (no default)
    departure_city: Optional[str] = None,  # Optional (has default)
    destination_city: Optional[str] = None,  # Optional (has default)
    skip: int = 0,        # Optional (has default)
    limit: int = 100,     # Optional (has default)
    db: Session = Depends(get_db)  # Dependency (always last)
) -> List[TripResponse]:
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
        logging.info(f"🔎 Aucun trajet trouvé : départ={departure_city}, destination={destination_city}, date={departure_date}")

    return trips

# Alternative implementation with more explicit subquery (if needed)
@router.get("/search_trips_advanced", response_model=List[TripResponse])
async def search_trips_advanced(
    departure_date: date,
    status: str,
    departure_city: Optional[str] = None,
    destination_city: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[TripResponse]:
    """
    Advanced search with explicit subquery for stops.
    Use this if the simple approach doesn't work with your SQLAlchemy setup.
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
    
    # Optional departure city filter
    if departure_city:
        query = query.filter(Trip.departure_city.ilike(f"%{departure_city}%"))
   
    # Optional destination city filter (main destination OR stops)
    if destination_city:
        # Create subquery for stops
        stops_subquery = db.query(Stop.trip_id).filter(
            Stop.destination_city.ilike(f"%{destination_city}%")
        ).subquery()
        
        query = query.filter(
            or_(
                # Main destination
                Trip.destination_city.ilike(f"%{destination_city}%"),
                # Trip has stops matching the destination
                Trip.id.in_(stops_subquery)
            )
        )
    
    trips = query.offset(skip).limit(limit).all()
    
    if not trips:
        logging.info(f"🔎 Aucun trajet trouvé : départ={departure_city}, destination={destination_city}, date={departure_date}")
    else:
        logging.info(f"✅ {len(trips)} trajet(s) trouvé(s)")
        # Log some details for debugging
        for trip in trips:
            stops_cities = [stop.destination_city for stop in trip.stops]
            logging.info(f"  - Trajet {trip.id}: {trip.departure_city} → {trip.destination_city}, arrêts: {stops_cities}")
    
    return trips


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

@router.get("/get_trip_by_driver_id/{driver_id}", response_model=List[TripResponse])
async def get_trip_by_driver_id_endpoint(driver_id: UUID, db: Session = Depends(get_db)):
    """
    Endpoint pour récupérer les voyages par ID de conducteur.
    """
    trips = await get_trip_by_driver_id_service(db, driver_id)
    return trips


@router.get("/trips/with_stops/{city}", response_model=List[TripResponse])
async def get_trips_with_stop_endpoint(city: str, db: Session = Depends(get_db)):
    """
    Endpoint pour récupérer tous les trajets qui passent par une ville (multi-arrêts).
    """
    return await get_trips_with_stop_service(db, city)


@router.put("/trip/{trip_id}/status", response_model=TripResponse)
async def update_trip_status_endpoint(trip_id: UUID, new_status: str, db: Session = Depends(get_db)):
    return await update_trip_status_service(db, trip_id, new_status)

@router.get("/trips/upcoming/driver/{driver_id}", response_model=List[TripResponse])
async def get_upcoming_trips_by_driver_endpoint(driver_id: UUID, db: Session = Depends(get_db)):
    return await get_upcoming_trips_by_driver_service(db, driver_id)

@router.get("/trips/passenger-access/{stop_city}", response_model=List[TripResponse])
async def get_trips_by_stop_city_endpoint(stop_city: str, db: Session = Depends(get_db)):
    return await get_trips_by_stop_city_service(db, stop_city)


@router.get("/trips/today", response_model=List[TripResponse])
async def get_today_trips_endpoint(db: Session = Depends(get_db)):
    return await get_today_trips_service(db)


@router.get("/trips/history/driver/{driver_id}", response_model=List[TripResponse])
async def get_driver_trip_history_endpoint(driver_id: UUID, db: Session = Depends(get_db)):
    return await get_driver_trip_history_service(db, driver_id)