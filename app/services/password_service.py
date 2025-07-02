from datetime import datetime
import logging
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
from fastapi import HTTPException
from app.db.models.user import User
from app.db.models.user_code import UserCode
from app.core.security import get_password_hash
from app.db.schemas.password import UpdatePasswordRequest
import aio_pika
import json
import random
from datetime import datetime, timedelta

import uuid
import os
from typing import List

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
RABBITMQ_URL = os.getenv("RABBITMQ_URL")
QUEUE_NAME = "activate_email_queue"

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


async def send_reset_code_to_user(db: Session, email: str):
    """
    Envoie le code à l'utilisateur via mail et sauvegarde
    """
    reset_code =str(random.randint(100000, 999999))

    try:
        connection = await aio_pika.connect_robust(RABBITMQ_URL)
        async with connection:
            # Création d'un canal
            channel = await connection.channel()

            # Déclarer la queue
            await channel.declare_queue(QUEUE_NAME, durable=True)

            # Publier le message
            message = aio_pika.Message(
                body=json.dumps({"email": email, "reset_code": reset_code}).encode(),
                content_type="application/json",
                delivery_mode=aio_pika.DeliveryMode.PERSISTENT,
            )
            await channel.default_exchange.publish(message, routing_key=QUEUE_NAME)

            logging.info(f"Code de réinitialisation envoyé à {email} : {reset_code}")
    except Exception as e:
        logging.error(f"Erreur lors de l'envoi du message RabbitMQ pour {email}: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de l'envoi du code.")

    try:
        # Sauvegarder le code une fois envoyé
        db_user = db.query(UserCode).filter(UserCode.email == email).first()
        if db_user:
            db_user.code = reset_code  # Assure-toi que tu modifies le champ correct, ici `code`
            db_user.created_at = datetime.utcnow()  # Mise à jour de la date
            db.commit()
            db.refresh(db_user)
        else:
            db_user = UserCode(email=email, code=reset_code, created_at=datetime.utcnow())
            db.add(db_user)
            db.commit()
            db.refresh(db_user)

        logging.info(f"Code {reset_code} sauvegardé pour {email}")
    except Exception as e:
        logging.error(f"Erreur lors de la sauvegarde du code pour {email}: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la sauvegarde du code.")

    return {"message": "Code envoyé avec succès."}

async def verify_code(db: Session, email: str, code: str):
    """
    Vérifie le code de confirmation, qu'il est valide et qu'il a été généré
    il y a moins de 5 minutes.
    """
    try:
        
        query = db.query(UserCode).filter(UserCode.email == email).first()
        

        if not query:
            raise HTTPException(status_code=404, detail="Code non trouvé.")

        stored_code, created_at = query.code, query.created_at
        if not stored_code or str(stored_code) != str(code):
            raise HTTPException(status_code=400, detail="Code invalide.")

        # Vérifiez que le code n'a pas expiré (5 minutes maximum)
        if datetime.now() - created_at > timedelta(minutes=5):
            raise HTTPException(status_code=400, detail="Code expiré.")

        # Supprimer le code une fois validé
        
        delete_query = db.query(UserCode).filter(UserCode.email == email).first()
        db.delete(delete_query)
        db.commit()
        

        logging.info(f"Code validé avec succès pour {email}")
        return {"message": "Code validé avec succès."}

    except HTTPException as e:
        logging.warning(f"Vérification du code pour {email} échouée: {e.detail}")
        raise
    except Exception as e:
        logging.error(f"Erreur lors de la vérification du code pour {email}: {e}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la vérification du code.")


async def get_code_by_email(db: Session, email: str) :
    """
    Récupère un code par son email.
    """
    try:
        return db.query(UserCode).filter(UserCode.email == email).first()
    except Exception as e:  
        logging.error(f"Erreur lors de la recherche du code : {str(e)}")
        raise HTTPException(status_code=500, detail="Erreur interne lors de la recherche du code")

async def create_user_code(db:Session , email:str, code:int):

    """
    Crée un code pour un utilisateur
    """
    try:
        new_code = UserCode(email=email, code=code)
        db.add(new_code)
        db.commit()
    except Exception as e:
        logging.error(f"Erreur lors de la création du code : {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erreur interne lors de la création du code")
    
async def update_user_code(db:Session , email:str, code:int):
    """
    Met à jour le code pour un utilisateur
    """
   
    
    try:
        result = db.query(UserCode).filter(UserCode.email == email).first()
        user_code = result.scalars().first()
        db.refresh(user_code)
        
        if user_code :

            user_code.code = code,
            user_code.created_at = datetime.now().replace(microsecond=0).strftime("%Y-%m-%d %H:%M")

            await db.commit()
            await db.refresh(user_code)
        else :
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
        
    except Exception as e:
        logging.error(f"Erreur lors de la mise à jour du code : {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erreur interne lors de la mise à jour du code")
    
async def delete_user_code(db:Session , email:str): 
    
    """
    Supprime un code pour un utilisateur
    """
    try:
        user_code = db.query(UserCode).filter(UserCode.email == email).first()
        if user_code:
            db.delete(user_code)
            db.commit()
        else:
            raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    except Exception as e:
        logging.error(f"Erreur lors de la suppression du code : {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail="Erreur interne lors de la suppression du code")
    

async def update_user_password(db: Session, email: str, new_password: str):
    """
    Fonction pour mettre à jour le mot de passe d'un utilisateur.
    """
    try:
        user = db.query(User).filter(User.email == email).first()
        if not user:
            logging.warning("Password update failed for user ID: %s", email)
            raise RuntimeError("User not found.")
        
        # Mise à jour du mot de passe
        user.password_hash = pwd_context.hash(new_password)
        
        # Commit et refresh
        db.commit()
        db.refresh(user)  # Rafraîchir l'objet utilisateur
        
        logging.info("Password updated successfully for user ID: %s", email)
        return {"id": str(user.id)}
        
    except Exception as e:
        logging.error("Error updating password for user ID %s: %s", email, str(e))
        db.rollback()
        raise RuntimeError(f"Error updating password: {e}")