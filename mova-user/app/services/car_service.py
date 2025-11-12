from datetime import datetime
import logging
import os
from dotenv import load_dotenv
from fastapi import HTTPException
from app.db.models.user import User
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.schemas.car import CarResponse, CarCreate,CarUpdate
from app.db.models.car import Car
import traceback

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
        result = await db.execute(select(User).where(User.id ==user_id))
        user = result.scalar_one_or_none()
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
            type_of_car =car_data.type_of_car,
            date_of_car=car_data.date_of_car,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow(),
            
            
        )

        db.add(new_car)
        await db.commit()
        await db.refresh(new_car)

        return new_car  # 🔵 On retourne bien le véhicule créé

   
    except Exception as e:
    
        logging.error("Traceback complet:\n" + traceback.format_exc())
        logging.error(f"Erreur lors de la création du véhicule : {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la création du véhicule.")
    


async def update_car_service(db: AsyncSession, data: CarUpdate) -> CarResponse:
    """
    🔧 Met à jour une voiture existante dans la base.
    """
    try:
        # 1️⃣ Vérifie si la voiture existe
        result = await db.execute(select(Car).where(Car.id == data.id))
        car = result.scalar_one_or_none()

        if not car:
            logging.error(f"[CarService] ❌ Voiture inexistante ID: {data.id}")
            raise HTTPException(status_code=404, detail=f"Voiture inexistante ID: {data.id}")

        # 2️⃣ Met à jour seulement les champs fournis
        update_data = data.dict(exclude_unset=True)
        for key, value in update_data.items():
            setattr(car, key, value)

        car.updated_at = datetime.utcnow()

        # 3️⃣ Enregistre les modifications
        await db.commit()
        await db.refresh(car)

        logging.info(f"[CarService] ✅ Voiture mise à jour : {car.id}")
        return CarResponse.from_orm(car)

    except HTTPException:
        raise  # Laisse FastAPI gérer les erreurs HTTP
    except Exception as e:
        await db.rollback()
        logging.error(f"[CarService] ❌ Erreur interne : {e}")
        raise HTTPException(status_code=500, detail=f"Erreur interne : {e}")
    
    
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
    

async def del_car_by_id(db:AsyncSession,car_id:uuid.UUID):
    try:

        res = await db.execute(select(Car).where(Car.id==car_id))
        query = res.scalar_one_or_none()
        if not query:
                logging.warning(f"Le véhicule existe pas .")
                raise HTTPException(status_code=400, detail="Ce véhicule n existe pas.")
        await db.delete()
        await db.flush()
        await db.refresh()
    except Exception as e :

        
        logging.error(f"Erreur lors de la suppression du vehicule : {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la suppresion de vehicule")
    


