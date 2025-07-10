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
from sqlalchemy import select



from app.db.schemas.user import UserCreate, UserResponse,UserResponseFind,UserUpdate, UsersType
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



async def send_activation_email(user_dict: dict) -> None:
    """Envoi d'un message structuré à RabbitMQ pour activer le compte utilisateur."""
    try:
        # Connexion à RabbitMQ
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        channel = await connection.channel()  
        queue = await channel.declare_queue(QUEUE_NAME, durable=True)

        # Sérialiser le message en JSON
        message_json = json.dumps(user_dict)
        
        # Création du message RabbitMQ
        message = aio_pika.Message(body=message_json.encode())

        # Envoi du message à RabbitMQ
        await channel.default_exchange.publish(message, routing_key=queue.name)
        logging.info(f"Message envoyé à RabbitMQ pour activer l'email : {user_dict['email']}")

    except Exception as e:
        logging.error(f"Erreur lors de l'envoi du message RabbitMQ : {str(e)}")

async def send_id_verfication(user_dict: dict) -> None:
    """Envoi d'un message structuré à RabbitMQ pour passer id  dans le microservice de 
     verification ."""
    try:
        # Connexion à RabbitMQ
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        channel = await connection.channel()  
        queue = await channel.declare_queue(QUEUE_NAME, durable=True)

        # Sérialiser le message en JSON
        message_json = json.dumps(user_dict)
        
        # Création du message RabbitMQ
        message = aio_pika.Message(body=message_json.encode())

        # Envoi du message à RabbitMQ
        await channel.default_exchange.publish(message, routing_key=queue.name)
        logging.info(f"Message envoyé à RabbitMQ pour PASSER ID   : {user_dict['email']}")

    except Exception as e:
        logging.error(f"Erreur lors de l'envoi du message RabbitMQ : {str(e)}")


from sqlalchemy.orm import selectinload
from sqlalchemy import select

async def create_user(db: AsyncSession, user: UserCreate) -> UserResponse:
    result = await db.execute(select(User).where(User.email == user.email))
    existing_user = result.scalar_one_or_none()
    if existing_user:
        raise HTTPException(status_code=400, detail="Un utilisateur avec cet email existe déjà.")

    hashed_password = hash_password(user.password)

    new_user = User(
        first_name=user.first_name,
        last_name=user.last_name,
        email=user.email,
        town=user.town,
        user_role="passenger",
        phone_number=user.phone_number,
        date_of_birth=user.date_of_birth,
        password_hash=hashed_password,
        is_active="pending",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    try:
        db.add(new_user)
        await db.commit()
        await db.refresh(new_user)

        user_dict = {
            "email": new_user.email,
            "id": str(new_user.id),
        }

        await send_activation_email(user_dict)
        await send_id_verfication(user_dict)

        # ⚠️ Recharge AVEC `cars` préchargés (sinon boom avec Pydantic)
        result = await db.execute(
            select(User).options(selectinload(User.cars)).where(User.id == new_user.id)
        )
        user_with_cars = result.scalar_one()

        return UserResponse.model_validate(user_with_cars)

    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail="Erreur interne lors de la création de l'utilisateur.")

async def get_user_by_email(db: AsyncSession, email: str) -> UserResponseFind:
    """
    Récupère un utilisateur par son email.
    """
    try:
        
        result = await db.execute(select(User).options(selectinload(User.cars)).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            logging.error(f"Utilisateur introuvable avec l'email {email}")
            raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
    except Exception as e:
        logging.error(f"Erreur lors de la recherche de l'utilisateur : {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la recherche de l utilisateur")
                            
    
    return user


async def get_user_by_id(db: AsyncSession, user_id: uuid) -> UserResponse:
    try:
        result = await db.execute(select(User).options(selectinload(User.cars)).where(User.id == user_id))
        user = result.scalar_one_or_none()
        
        
        if not user:
            logging.error(f"Utilisateur introuvable avec l'id {user_id}")
            raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
        return user
    except Exception as e:
        logging.error(f"Erreur lors de la recherche de l'utilisateur : {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la recherche de l'utilisateur")
   

async def get_users_by_user_type(db: Session, user_type: UsersType) -> List[UserResponseFind]:
    """
    Récupère tous les utilisateurs d'un type spécifique.
    """
    try:
        users = db.query(User).filter(User.user_type == user_type.value).all()
        if not users:
            logging.warning(f"Aucun utilisateur trouvé avec le type {user_type.value}.")
            raise HTTPException(status_code=404, detail="Aucun utilisateur trouvé.")
        return users
    except Exception as e:
        logging.error(f"Erreur lors de la recherche des utilisateurs : {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la recherche des utilisateurs.")

async def get_users(db: Session) -> List[UserResponseFind]:
    """
    Récupère tous les utilisateurs.
    """
    try:
        users = db.query(User).all()
        if not users:
            logging.error("Aucun utilisateur trouvé.")
            raise HTTPException(status_code=404, detail="Aucun utilisateur trouvé.")
        
        # Convert SQLAlchemy models to Pydantic models
        return [UserResponseFind.from_orm(user) for user in users]
    except Exception as e:
        logging.error(f"Erreur lors de la recherche des utilisateurs : {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la recherche des utilisateurs.")


async def update_user(db: Session, user_id: uuid, user: UserUpdate) -> UserResponse:
    """
    Met à jour les informations d'un utilisateur.
    """
    try:
        # On récupère l'utilisateur existant via user_id
        existing_user = db.query(User).filter(User.id == user_id).first()
        if not existing_user:
            logging.error(f"Utilisateur introuvable avec l'id {user_id}")
            raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
        
        # Vérification si l'email ou le numéro de téléphone a changé
        email_changed = existing_user.email != user.email and user.email is not None
        phone_changed = existing_user.phone_number != user.phone_number and user.phone_number is not None

        # Mise à jour des informations générales
        existing_user.first_name = user.first_name
        existing_user.last_name = user.last_name       
        existing_user.phone_number = user.phone_number
        existing_user.date_of_birth = user.date_of_birth
        existing_user.updated_at = datetime.utcnow()

        # Mise à jour de l'email uniquement s'il a changé
        if email_changed:
            existing_user.email = user.email
            existing_user.is_email_verified = False
            await send_activation_email({"email": existing_user.email, "id": str(existing_user.id)})

        # Mise à jour du téléphone si changé
        if phone_changed:
            existing_user.is_phone_verified = False
            # TODO: Ajouter l'envoi de vérification téléphone via RabbitMQ

       

        # Enregistrement des modifications
        db.commit()
        db.refresh(existing_user)

        logging.info(f"Utilisateur mis à jour avec succès : {existing_user.email}")

        return existing_user  # Doit correspondre au modèle `UserResponse`

    except Exception as e:
        db.rollback()
        logging.error(f"Erreur lors de la mise à jour de l'utilisateur : {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la mise à jour de l'utilisateur.")

async def delete_user(db: Session, user_id: uuid) -> None:
    """
    Supprime un utilisateur de la base de données.
    """
    try:
        # On récupère l'utilisateur existant via user_id
        existing_user = db.query(User).filter(User.id == user_id).first()
        if not existing_user:
            logging.error(f"Utilisateur introuvable avec l'id {user_id}")
            raise HTTPException(status_code=404, detail="Utilisateur introuvable.")
        
        # Suppression de l'utilisateur
        db.delete(existing_user)
        db.commit()
        logging.info(f"Utilisateur supprimé avec succès : {existing_user.email}")
        return True

    except Exception as e:
        db.rollback()
        logging.error(f"Erreur lors de la suppression de l'utilisateur : {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la suppression de l utisateur.")
    
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def update_user_password(db: Session, user_email: str, new_password: str):
    try:
        user = db.query(User).filter(User.email == user_email).one_or_none()
        if not user:
            logging.warning("Password update failed: User with email %s not found", user_email)
            raise RuntimeError("User not found.")

        # Génération d'un nouveau salt et hachage du mot de passe
        salt = bcrypt.gensalt().decode()  
        hashed_password = pwd_context.hash(new_password + salt)

        # Mise à jour du mot de passe et du salt
        user.password_hash = hashed_password
        user.password_salt = salt  

        db.commit()
        db.refresh(user)

        logging.info("Password updated successfully for user email: %s", user_email)
        return {"email": user.email}

    except Exception as e:
        db.rollback()
        logging.error("Database error while updating password for %s: %s", user_email, str(e))
        raise RuntimeError(f"Database error: {e}")

    except Exception as e:
        logging.error("Unexpected error updating password for %s: %s", user_email, str(e))
        raise RuntimeError(f"Error updating password: {e}")

def reset_password_request(db: Session, user: UpdatePasswordRequest):
    try:
        user_record = db.query(User).filter(User.email == user.email).first()
        if not user_record:
            logging.warning("User not found for password reset: %s", user.email)
            raise HTTPException(status_code=404, detail="User not found")

        hashed_password, salt_password = get_password_hash(user.new_password)
        return update_user_password(db, user_id=user_record.id, new_password=hashed_password, salt=salt_password)

    except HTTPException as http_error:
        logging.error("HTTP error during password reset request: %s", http_error.detail)
        raise
    except Exception as e:
        logging.error("Unexpected error during password reset request: %s", str(e))
        raise RuntimeError(f"Error during password reset request: {e}")