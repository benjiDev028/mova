from datetime import datetime
import logging
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
from fastapi import HTTPException
from app.db.models.user import User
from app.core.security import get_password_hash, hash_password
import aio_pika
import json
from sqlalchemy.orm import selectinload
import uuid
import os
from typing import List
import bcrypt
from passlib.context import CryptContext
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.schemas.user import UserResponse, UserCreate
from app.services.user_service import get_user_by_email, get_user_by_id, get_users
from sqlalchemy import select


from app.db.schemas.car import CarResponse, CarCreate
from app.db.models.car import Car
from app.db.schemas.password import UpdatePasswordRequest


# Configuration du logger
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[
        logging.FileHandler("user_logs.log"),  # Nom du fichier de log
        logging.StreamHandler()  # Envoie également les logs à la console
    ])


load_dotenv()

# URL de RabbitMQ
RABBITMQ_URL = os.getenv("RABBITMQ_URL")
QUEUE_NAME = "activate_email_queue"
QUEUE_NAME_VERIFICATION = "id_verification_queue"





async def create_car_service(db: AsyncSession, user_id: uuid.UUID, car_data: CarCreate) -> CarResponse:
    """
    Crée un nouveau véhicule pour un utilisateur.
    """
    try:
        # Vérifier si l'utilisateur existe
        user = await get_user_by_id(db, user_id)
        if not user:
            logging.error(f"Utilisateur introuvable avec l'id {user_id}")
            raise HTTPException(status_code=404, detail="Utilisateur introuvable.")

        # Vérifier si le véhicule existe déjà pour l'utilisateur (plaque unique par user)
        result = await db.execute(
            select(Car).where(Car.user_id == user_id, Car.license_plate == car_data.license_plate)
        )
        existing_car = result.scalar_one_or_none()
        if existing_car:
            logging.warning(f"Le véhicule existe déjà pour cet utilisateur.")
            raise HTTPException(status_code=400, detail="Ce véhicule existe déjà pour cet utilisateur.")

        # Créer le nouveau véhicule
        new_car = Car(
            user_id=user_id,  # 🔴 important
            brand=car_data.brand,
            model=car_data.model,
            color=car_data.color,
            license_plate=car_data.license_plate,
            seats=car_data.seats,
            date_of_car=car_data.date_of_car,
            created_at=datetime.utcnow(),
            
            
        )

        db.add(new_car)
        await db.commit()
        await db.refresh(new_car)

        return new_car  # 🔵 On retourne bien le véhicule créé

    except HTTPException:
        raise  # relancer les erreurs HTTP telles quelles
    except Exception as e:
        logging.error(f"Erreur lors de la création du véhicule : {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la création du véhicule.")
    

async def get_car_by_id_service(db:AsyncSession,car_id:uuid.UUID)-> CarResponse :
    try:

        result = await db.execute(select(Car).where(Car.id==car_id))
        car_selected =  result.scalar_one_or_none()
        
        if not car_selected:
            logging.error(f"car introuvable avec l'id {car_id}")
            raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
        return car_selected
    except Exception as e:
        logging.error(f"Erreur lors de la recherche du vehicule : {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la recherche de vehicule")
    
