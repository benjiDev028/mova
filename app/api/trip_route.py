from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.schemas.trip import TripResponse, TripUpdate

from fastapi import APIRouter, Depends, Query
from typing import List
from app.db.models.trip import Trip
from app.db.schemas.trip import TripCreate
from app.services.trip_service import get_trip_by_id_service, create_trip_service, get_all_trips_service,get_trip_by_status_service, search_trips_service, get_trip_by_driver_id_service, get_trips_with_stop_service,update_trip_status_service,get_upcoming_trips_by_driver_service,get_trips_by_stop_city_service,get_today_trips_service,get_driver_trip_history_service

from fastapi import FastAPI, HTTPException, Depends, Request
from starlette.responses import JSONResponse
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
async def search_trips_endpoint(
    departure_city: Optional[str] = Query(None),
    destination_city: Optional[str] = Query(None),
    date: Optional[date] = Query(None),
    status: Optional[str] = Query(None),
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Endpoint pour rechercher des trajets avec filtres + pagination.
    """
    return await search_trips_service(
        db=db,
        departure_city=departure_city,
        destination_city=destination_city,
        date=date,
        status=status,
        skip=skip,
        limit=limit
    )

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