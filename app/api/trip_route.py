from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session,joinedload
from app.db.database import get_db
from app.db.schemas.trip import TripResponse, TripUpdate

from fastapi import APIRouter, Depends, Query
from typing import List
from app.db.models.trip import Trip
from app.db.models.stop import Stop
from app.db.schemas.trip import TripCreate,StatusTripUpdate,TripReserveSeat,TripCancelSeat
from app.services.trip_service import get_trip_by_id_service, create_trip_service, get_all_trips_service,get_trip_by_status_service, get_trip_by_driver_id_service, get_trips_with_stop_service,update_trip_status_service,get_upcoming_trips_by_driver_service,get_trips_by_stop_city_service,get_today_trips_service,get_driver_trip_history_service,reserve_seat_service,cancel_seat_reservation_service

from fastapi import FastAPI, HTTPException, Depends, Request
from starlette.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
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


from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from typing import List, Optional
from uuid import UUID
from datetime import date
import logging
import os
from dotenv import load_dotenv

from app.db.database import get_db
from app.db.models.trip import Trip
from app.db.models.stop import Stop
from app.db.schemas.trip import (
    TripCreate, TripResponse, StatusTripUpdate,
    TripReserveSeat, TripCancelSeat
)
from app.services.trip_service import (
    create_trip_service, get_trip_by_id_service, get_all_trips_service,
    get_trip_by_status_service, get_trip_by_driver_id_service,
    get_trips_with_stop_service, update_trip_status_service,
    get_upcoming_trips_by_driver_service, get_trips_by_stop_city_service,
    get_today_trips_service, get_driver_trip_history_service,
    reserve_seat_service, cancel_seat_reservation_service
)

# ------------------------------------------------------------
# CONFIGURATION
# ------------------------------------------------------------
router = APIRouter()
load_dotenv()
RABBITMQ_URL = os.getenv("RABBITMQ_URL")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("trip_router")

# ------------------------------------------------------------
# ROUTES DE BASE
# ------------------------------------------------------------

@router.post("/create_trip", response_model=TripResponse)
async def create_trip_endpoint(trip_data: TripCreate, db: AsyncSession = Depends(get_db)):
    trip = await create_trip_service(db, trip_data)
    logger.info(f"Voyage créé avec succès : {trip.id}")
    return trip


@router.get("/get_trip_by_id/{trip_id}", response_model=TripResponse)
async def get_trip_by_id_endpoint(trip_id: UUID, db: AsyncSession = Depends(get_db)):
    trip = await get_trip_by_id_service(db, trip_id)
    return trip


@router.get("/get_all_trips", response_model=List[TripResponse])
async def get_all_trips_endpoint(db: AsyncSession = Depends(get_db)):
    trips = await get_all_trips_service(db)
    return trips


@router.get("/get_trip_by_status/{status}", response_model=List[TripResponse])
async def get_trip_by_status_endpoint(status: str, db: AsyncSession = Depends(get_db)):
    trips = await get_trip_by_status_service(db, status)
    return trips


# ------------------------------------------------------------
# RECHERCHE DE TRAJETS
# ------------------------------------------------------------
@router.get("/search_trips", response_model=List[TripResponse])
async def search_trips_endpoint(
    departure_date: date,
    status: str,
    departure_city: Optional[str] = None,
    destination_city: Optional[str] = None,
    passenger_count: Optional[int] = Query(None, ge=1, le=5),
    price_limit: Optional[float] = Query(None, ge=0),
    max_two_stops: Optional[bool] = False,
    smoking_allowed: Optional[bool] = None,
    pets_allowed: Optional[bool] = None,
    ac_available: Optional[bool] = None,
    bike_space: Optional[bool] = None,
    ski_space: Optional[bool] = None,
    payment_method: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """Recherche de trajets avec filtres"""
    try:
        from sqlalchemy.orm import joinedload

        # ✅ Charger relations proprement
        query = (
            select(Trip)
            .options(joinedload(Trip.preferences), joinedload(Trip.stops))
            .filter(Trip.status == status, Trip.departure_date == departure_date)
        )

        if departure_city:
            query = query.filter(Trip.departure_city.ilike(f"%{departure_city}%"))

        if destination_city:
            # ✅ Corrigé : utiliser "Trip.stops.any(Stop.destination_city.ilike(...))" sans annotation
            query = query.filter(
                or_(
                    Trip.destination_city.ilike(f"%{destination_city}%"),
                    Trip.id.in_(
                        select(Stop.trip_id).where(Stop.destination_city.ilike(f"%{destination_city}%"))
                    )
                )
            )

        result = await db.execute(query.offset(skip).limit(limit))
        trips = result.scalars().unique().all()

        # Filtres mémoire
        filtered = []
        for trip in trips:
            if passenger_count and trip.available_seats < passenger_count:
                continue
            if price_limit and trip.total_price > price_limit:
                continue
            if max_two_stops and len(trip.stops or []) > 2:
                continue

            prefs = trip.preferences
            if prefs:
                if smoking_allowed is not None and prefs.smoking_allowed != smoking_allowed:
                    continue
                if pets_allowed is not None and prefs.pets_allowed != pets_allowed:
                    continue
                if ac_available is not None and prefs.air_conditioning != ac_available:
                    continue
                if bike_space is not None and prefs.bike_support != bike_space:
                    continue
                if ski_space is not None and prefs.ski_support != ski_space:
                    continue
                if payment_method and prefs.mode_payment != payment_method:
                    continue

            filtered.append(trip)

        logger.info(f"✅ {len(filtered)} trajets trouvés.")
        return filtered

    except Exception as e:
        logger.error(f"Erreur recherche trajets : {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ------------------------------------------------------------
# RÉSERVATION / ANNULATION
# ------------------------------------------------------------
@router.post("/reserve_seat")
async def reserve_seat_endpoint(data: TripReserveSeat, db: AsyncSession = Depends(get_db)):
    trip = await reserve_seat_service(db, data)
    logger.info(f"Réservation : {data.seats} place(s) sur trajet {data.trip_id}")
    return {"message": "Réservation réussie", "trip": trip}


@router.post("/cancel_reservation")
async def cancel_reservation_endpoint(data: TripCancelSeat, db: AsyncSession = Depends(get_db)):
    trip = await cancel_seat_reservation_service(db, data)
    logger.info(f"Annulation : {data.seats} place(s) sur trajet {data.trip_id}")
    return {"message": "Annulation réussie", "trip": trip}


# ------------------------------------------------------------
# AUTRES ROUTES MÉTIERS
# ------------------------------------------------------------
@router.get("/get_trip_by_driver_id/{driver_id}", response_model=List[TripResponse])
async def get_trip_by_driver_id_endpoint(driver_id: UUID, db: AsyncSession = Depends(get_db)):
    trips = await get_trip_by_driver_id_service(db, driver_id)
    return trips


@router.get("/trips/with_stops/{city}", response_model=List[TripResponse])
async def get_trips_with_stop_endpoint(city: str, db: AsyncSession = Depends(get_db)):
    trips = await get_trips_with_stop_service(db, city)
    return trips


@router.put("/trip/{trip_id}/status", response_model=TripResponse)
async def update_trip_status_endpoint(trip_id: UUID, data: StatusTripUpdate, db: AsyncSession = Depends(get_db)):
    trip = await update_trip_status_service(db, trip_id, data.new_status)
    return trip


@router.get("/trips/upcoming/driver/{driver_id}", response_model=List[TripResponse])
async def get_upcoming_trips_by_driver_endpoint(driver_id: UUID, db: AsyncSession = Depends(get_db)):
    trips = await get_upcoming_trips_by_driver_service(db, driver_id)
    return trips


@router.get("/trips/passenger-access/{stop_city}", response_model=List[TripResponse])
async def get_trips_by_stop_city_endpoint(stop_city: str, db: AsyncSession = Depends(get_db)):
    trips = await get_trips_by_stop_city_service(db, stop_city)
    return trips


@router.get("/trips/today", response_model=List[TripResponse])
async def get_today_trips_endpoint(db: AsyncSession = Depends(get_db)):
    trips = await get_today_trips_service(db)
    return trips


@router.get("/trips/history/driver/{driver_id}", response_model=List[TripResponse])
async def get_driver_trip_history_endpoint(driver_id: UUID, db: AsyncSession = Depends(get_db)):
    trips = await get_driver_trip_history_service(db, driver_id)
    return trips
