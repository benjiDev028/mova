from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.schemas.user import UserResponse, UserCreate
from app.services.user_service import create_user


from fastapi import FastAPI, HTTPException, Depends, Request
from starlette.responses import JSONResponse
from uuid import UUID
import logging
from dotenv import load_dotenv
import os

# Charger les variables d'environnement
load_dotenv()
RABBITMQ_URL = os.getenv("RABBITMQ_URL")
REWARD_THRESHOLD = 50000

router = APIRouter()
app = FastAPI()

# Configurer le logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



@router.post("/register", response_model=UserResponse)
async def earn_points(data: UserCreate, db: Session = Depends(get_db)):
    """
    Crée un nouvel utilisateur dans la base de données et lui attribue des points.
    """
    # Créer un nouvel utilisateur
    new_user = await create_user(db, data)   
    db.commit()
    
    return new_user
    