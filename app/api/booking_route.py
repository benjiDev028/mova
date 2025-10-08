from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db

from fastapi import FastAPI, HTTPException, Depends, Request
from starlette.responses import JSONResponse
from sqlalchemy import or_, func
from uuid import UUID
import logging
from dotenv import load_dotenv
from datetime import date
from typing import Optional
from app.db.schemas.booking import BookingCreate, BookingResponse
from app.services.booking_service import create_booking
import os





# Charger les variables d'environnement
load_dotenv()
RABBITMQ_URL = os.getenv("RABBITMQ_URL")

router = APIRouter()
app = FastAPI()

# Configurer le logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)



@router.post("/create_booking", response_model=BookingResponse)
async def create_booking_endpoint(data: BookingCreate, db: AsyncSession = Depends(get_db)):
    booking = await create_booking(db, data)
    return booking