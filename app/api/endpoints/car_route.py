from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession


from app.db.database import get_db
from app.db.schemas.user import UserResponse, UserResponseFind, UserUpdate, UsersType
from typing import List
from app.db.models.user import User
from app.services.car_service import create_car_service,get_car_by_id_service,update_car_service
from app.db.schemas.car import CarCreate  ,CarResponse  ,CarUpdate


from fastapi import FastAPI, HTTPException, Depends, Request
from starlette.responses import JSONResponse
from uuid import UUID
import logging
from dotenv import load_dotenv
import os


# Charger les variables d'environnement
load_dotenv()
RABBITMQ_URL = os.getenv("RABBITMQ_URL")

router = APIRouter()
app = FastAPI()

# Configurer le logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@router.post("/create_cars", response_model=CarResponse, status_code=201)
async def create_car(user_id: UUID, data_car: CarCreate, db: AsyncSession = Depends(get_db)):
    """
    Ajoute une voiture à un utilisateur donné (user_id dans query params).
    """
    car = await create_car_service(db, user_id=user_id, car_data=data_car)
    return car

@router.get("/get_car_by_id/{car_id}",response_model=CarResponse)
async def get_car_by_id(car_id:UUID,db:AsyncSession=Depends(get_db)):
    car =await get_car_by_id_service(db,car_id)
    return car

@router.put("/update_car",response_model=CarResponse) 
async def update_car_endpoint(data:CarUpdate, db:AsyncSession=Depends(get_db)):
    car = await update_car_service(db,data)
    return car