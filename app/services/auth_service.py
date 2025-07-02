from app.core.security import  verify_password, create_access_token , create_refresh_token

from sqlalchemy.orm import Session
from app.db.models.user import User
import uuid
from datetime import datetime
from app.core.security import verify_password, create_access_token, create_refresh_token
from app.services.user_service import get_user_by_email
import logging
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
from fastapi import HTTPException
from app.db.models.user import User
from app.db.models.user_code import UserCode
from app.core.security import get_password_hash
import aio_pika
import json
import random
from datetime import datetime, timedelta

from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Exemple d'authentification après réinitialisation
async def login_user(db: Session, email: str, password: str):
    user = db.query(User).filter(User.email == email).one_or_none()
    if not user:
        raise HTTPException(status_code=400, detail="Mot de passe ou Identifiant incorrect.")
    
    # # Vérification du mot de passe
    # if not verify_password(password, user.password_hash, user.password_salt):
    #     raise HTTPException(status_code=400, detail="Mot de passe incorrect.")
    if not pwd_context.verify(password, user.password_hash):
        raise HTTPException(status_code=400, detail="Mot de passe ou Identifiant incorrect.")
    
    # Génération du token après la validation
    token = create_access_token({
    "sub": email,
    "user_id": str(user.id),
    "userRole": user.user_role
})
    refresh_token = create_refresh_token(data={"sub": email})
    
    return token, refresh_token
