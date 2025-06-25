from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db

from app.services.user_service import get_user_by_email, get_user_by_id
from app.services.auth_service import login_user
from fastapi import FastAPI, HTTPException, Depends


import logging

from fastapi import APIRouter, HTTPException, Depends, status

from jose import JWTError, jwt

import os
from dotenv import load_dotenv
from app.db.schemas.auth import UserLogin, RefreshToken
from app.core.security import create_access_token
import asyncpg


# Charger les variables d'environnement
load_dotenv()


SECRET_KEY = os.getenv("JWT_SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30


router = APIRouter()
app = FastAPI()

# Configurer le logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@router.post("/login", status_code=status.HTTP_200_OK)
async def login_endpoint(user: UserLogin, db: Session = Depends(get_db)):
    """
    Connecter un utilisateur existant.
    """
    try:
        email = user.email
        password = user.password
        logger.info(f"Tentative de connexion pour l'email: {email}")
        
        token, refresh_token = await login_user(db, email, password)
        if token == "Information Invalide":
            logger.warning("Informations invalides pour l'utilisateur")
            return "Information Invalide"
        if not token:
            logger.error("Email ou mot de passe invalide")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        user = await get_user_by_email(db, email)
        
        
        logger.info(f"Connexion réussie pour l'utilisateur: {email}")
        return {
            "access_token": token,
            "user_id": str(user.id),
            "email": user.email,
            "token_type": "bearer",
            "refresh_token": refresh_token,
         
        }
    except Exception as e:
        logger.exception("Erreur lors de la tentative de connexion")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Information Invalide"
        )


@router.post("/refresh-token", status_code=status.HTTP_200_OK)
async def refresh_access_token(refresh_token: RefreshToken, db: asyncpg.Connection = Depends(get_db)):
    """
    Renouvelle l'access token en utilisant un refresh token valide.
    """
    try:
        logger.info("Tentative de rafraîchissement du token")
        payload = jwt.decode(refresh_token.refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        
        if payload.get("type") != "refresh":
            logger.warning("Type de token invalide")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )
        
        user = await get_user_by_id(db, payload["user_id"])
        token_data = {
            "sub": user["email"],
            "user_id": str(user["id"]),
            "role": user["role"]
        }
        
        new_access_token = create_access_token(data=token_data)
        logger.info(f"Access token renouvelé pour l'utilisateur ID: {user['id']}")
        return {"access_token": new_access_token, "token_type": "bearer"}
    except JWTError:
        logger.error("Refresh token invalide ou expiré")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    except Exception as e:
        logger.exception("Erreur lors du renouvellement de l'access token")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while refreshing the token"
        )

# @router.post("/login", status_code=status.HTTP_200_OK)
# async def login_endpoint(user: UserLogin, db: Session = Depends(get_db)):
#     """
#     Connecter un utilisateur existant.
#     """

#     email = user.email
#     password = user.password
#     logger.info(f"Tentative de connexion pour l'email: {email}")
        
#     token, refresh_token = await login_user(db, email, password)
        
#     user = await get_user_by_email(db, email)
        
        
#     logger.info(f"Connexion réussie pour l'utilisateur: {email}")
#     return {
#             "access_token": token,
#             "token_type": "bearer",
#             "refresh_token": refresh_token,
         
#     }
