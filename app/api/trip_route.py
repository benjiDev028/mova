from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session,joinedload
from app.db.database import get_db
from app.db.schemas.trip import TripResponse, TripUpdate

from fastapi import APIRouter, Depends, Query
from typing import List
from app.db.models.trip import Trip
from app.db.models.stop import Stop
from app.db.schemas.trip import TripCreate,StatusTripUpdate
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


# Backend Search - Version corrigée avec tous les filtres



@router.get("/search_trips", response_model=List[TripResponse])
async def search_trips_service(
    departure_date: date,
    status: str,
    departure_city: Optional[str] = None,
    destination_city: Optional[str] = None,
    # Nouveaux filtres ajoutés
    passenger_count: Optional[int] = Query(None, ge=1, le=5),
    price_limit: Optional[float] = Query(None, ge=0),
    verified_only: Optional[bool] = False,
    favorites_only: Optional[bool] = False,
    max_two_stops: Optional[bool] = False,
    smoking_allowed: Optional[bool] = None,
    pets_allowed: Optional[bool] = None,
    ac_available: Optional[bool] = None,
    bike_space: Optional[bool] = None,
    ski_space: Optional[bool] = None,
    payment_method: Optional[str] = None,
    vehicle_size: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[TripResponse]:
    """
    Recherche de trajets avec filtres complets
    """
    try:
        # Log des filtres reçus
        logging.info(f"Filtres de recherche reçus: departure_city={departure_city}, "
                    f"destination_city={destination_city}, date={departure_date}, "
                    f"passenger_count={passenger_count}, price_limit={price_limit}")
        
        # Construction de la requête de base
        query = db.query(Trip).options(
            joinedload(Trip.preferences),
            joinedload(Trip.stops)
        )

        # Filtres obligatoires
        query = query.filter(
            Trip.status == status,
            Trip.departure_date == departure_date
        )

        # Filtres optionnels de base
        if departure_city:
            query = query.filter(Trip.departure_city.ilike(f"%{departure_city}%"))
        
        if destination_city:
            query = query.filter(
                or_(
                    Trip.destination_city.ilike(f"%{destination_city}%"),
                    Trip.stops.any(Stop.destination_city.ilike(f"%{destination_city}%"))
                )
            )

        # Filtre par nombre de places disponibles
        if passenger_count:
            query = query.filter(Trip.available_seats >= passenger_count)
            logging.info(f"Filtrage par nombre de places: {passenger_count}")

        # Filtre par prix maximum
        if price_limit and price_limit > 0:
            query = query.filter(Trip.total_price <= price_limit)
            logging.info(f"Filtrage par prix maximum: {price_limit}")

        # Filtre par nombre maximum d'arrêts
        if max_two_stops:
            # Sous-requête pour compter les arrêts
            from sqlalchemy import func
            stops_count = db.query(func.count(Stop.id)).filter(Stop.trip_id == Trip.id).scalar_subquery()
            query = query.filter(stops_count <= 2)
            logging.info("Filtrage par maximum 2 arrêts")

        # Filtres sur les préférences
        if smoking_allowed is not None:
            TripPreferences = query.join(Trip.preferences).filter(
                TripPreferences.smoking_allowed == smoking_allowed
            )
            logging.info(f"Filtrage par fumeur: {smoking_allowed}")

        if pets_allowed is not None:
            query = query.join(Trip.preferences).filter(
                TripPreferences.pets_allowed == pets_allowed
            )
            logging.info(f"Filtrage par animaux: {pets_allowed}")

        if ac_available is not None:
            query = query.join(Trip.preferences).filter(
                TripPreferences.air_conditioning == ac_available
            )
            logging.info(f"Filtrage par climatisation: {ac_available}")

        if bike_space is not None:
            query = query.join(Trip.preferences).filter(
                TripPreferences.bike_support == bike_space
            )
            logging.info(f"Filtrage par support vélo: {bike_space}")

        if ski_space is not None:
            query = query.join(Trip.preferences).filter(
                TripPreferences.ski_support == ski_space
            )
            logging.info(f"Filtrage par support ski: {ski_space}")

        if payment_method:
            query = query.join(Trip.preferences).filter(
                Trip.Preferences.mode_payment == payment_method
            )
            logging.info(f"Filtrage par méthode de paiement: {payment_method}")

        # TODO: Ajouter les filtres pour verified_only, favorites_only, vehicle_size
        # Ces filtres nécessitent probablement des relations avec d'autres tables

        # Exécution de la requête
        trips = query.offset(skip).limit(limit).all()

        if not trips:
            logging.info(f"🔎 Aucun trajet trouvé avec les filtres appliqués")
        else:
            logging.info(f"✅ {len(trips)} trajet(s) trouvé(s)")
            # Log des détails pour le debug
            for trip in trips:
                stops_cities = [stop.destination_city for stop in trip.stops] if trip.stops else []
                logging.info(f"  - Trajet {trip.id}: {trip.departure_city} → {trip.destination_city}, "
                           f"prix: {trip.total_price}$, places: {trip.available_seats}, "
                           f"arrêts: {stops_cities}")

        return trips

    except Exception as e:
        logging.error(f"Erreur lors de la recherche de trajets: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la recherche: {str(e)}")


@router.get("/search_trips_av", response_model=List[TripResponse])
async def search_trips_advanced_service(
    departure_date: date,
    status: str,
    departure_city: Optional[str] = None,
    destination_city: Optional[str] = None,
    passenger_count: Optional[int] = Query(None, ge=1, le=5),
    price_limit: Optional[float] = Query(None, ge=0),
    verified_only: Optional[bool] = False,
    favorites_only: Optional[bool] = False,
    max_two_stops: Optional[bool] = False,
    smoking_allowed: Optional[bool] = None,
    pets_allowed: Optional[bool] = None,
    ac_available: Optional[bool] = None,
    bike_space: Optional[bool] = None,
    ski_space: Optional[bool] = None,
    payment_method: Optional[str] = None,
    vehicle_size: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
) -> List[TripResponse]:
    """
    Version avancée avec filtrage côté application pour les cas complexes
    """
    try:
        # Requête de base avec les filtres essentiels
        query = db.query(Trip).options(
            joinedload(Trip.preferences),
            joinedload(Trip.stops)
        )

        # Filtres obligatoires
        query = query.filter(
            Trip.status == status,
            Trip.departure_date == departure_date
        )

        # Filtres de base
        if departure_city:
            query = query.filter(Trip.departure_city.ilike(f"%{departure_city}%"))
        
        if destination_city:
            query = query.filter(
                or_(
                    Trip.destination_city.ilike(f"%{destination_city}%"),
                    Trip.stops.any(Stop.destination_city.ilike(f"%{destination_city}%"))
                )
            )

        # Récupération des résultats
        trips = query.all()
        
        # Filtrage côté application
        filtered_trips = []
        for trip in trips:
            # Filtre par nombre de places
            if passenger_count and trip.available_seats < passenger_count:
                continue
                
            # Filtre par prix
            if price_limit and price_limit > 0 and trip.total_price > price_limit:
                continue
                
            # Filtre par nombre d'arrêts
            if max_two_stops and len(trip.stops) > 2:
                continue
                
            # Filtres sur les préférences
            if trip.preferences:
                if smoking_allowed is not None and trip.preferences.smoking_allowed != smoking_allowed:
                    continue
                if pets_allowed is not None and trip.preferences.pets_allowed != pets_allowed:
                    continue
                if ac_available is not None and trip.preferences.air_conditioning != ac_available:
                    continue
                if bike_space is not None and trip.preferences.bike_support != bike_space:
                    continue
                if ski_space is not None and trip.preferences.ski_support != ski_space:
                    continue
                if payment_method and trip.preferences.mode_payment != payment_method:
                    continue
            
            filtered_trips.append(trip)

        # Pagination
        start = skip
        end = skip + limit
        paginated_trips = filtered_trips[start:end]

        logging.info(f"✅ {len(paginated_trips)} trajet(s) trouvé(s) après filtrage avancé")
        
        return paginated_trips

    except Exception as e:
        logging.error(f"Erreur lors de la recherche avancée: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erreur lors de la recherche avancée: {str(e)}")


# Fonction utilitaire pour appliquer les filtres
def apply_filters(trips: List[Trip], filters: dict) -> List[Trip]:
    """
    Applique les filtres côté application
    """
    filtered_trips = []
    
    for trip in trips:
        # Vérifier chaque filtre
        if not passes_filters(trip, filters):
            continue
        filtered_trips.append(trip)
    
    return filtered_trips


def passes_filters(trip: Trip, filters: dict) -> bool:
    """
    Vérifie si un trajet passe tous les filtres
    """
    # Filtre par nombre de places
    if filters.get('passenger_count') and trip.available_seats < filters['passenger_count']:
        return False
        
    # Filtre par prix
    if filters.get('price_limit') and filters['price_limit'] > 0:
        if trip.total_price > filters['price_limit']:
            return False
            
    # Filtre par nombre d'arrêts
    if filters.get('max_two_stops') and len(trip.stops) > 2:
        return False
        
    # Filtres sur les préférences
    if trip.preferences:
        prefs = trip.preferences
        
        if filters.get('smoking_allowed') is not None:
            if prefs.smoking_allowed != filters['smoking_allowed']:
                return False
                
        if filters.get('pets_allowed') is not None:
            if prefs.pets_allowed != filters['pets_allowed']:
                return False
                
        if filters.get('ac_available') is not None:
            if prefs.air_conditioning != filters['ac_available']:
                return False
                
        if filters.get('bike_space') is not None:
            if prefs.bike_support != filters['bike_space']:
                return False
                
        if filters.get('ski_space') is not None:
            if prefs.ski_support != filters['ski_space']:
                return False
                
        if filters.get('payment_method'):
            if prefs.mode_payment != filters['payment_method']:
                return False
    
    return True


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
async def update_trip_status_endpoint(trip_id: UUID, data: StatusTripUpdate, db: Session = Depends(get_db)):
    return await update_trip_status_service(db, trip_id, data.new_status)

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