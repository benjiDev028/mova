from sqlalchemy import (
    Column,
    Integer,
    String,
   
    DateTime,
    
    Boolean,

   
)
from enum import Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import sessionmaker,relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine, inspect
import uuid
from datetime import datetime

from app.db.base import Base
from dotenv import load_dotenv


import os

# Charger les variables d'environnement
load_dotenv()

# Base de SQLAlchemy


# Configurer le moteur de base de données
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL doit être défini dans le fichier .env")

engine = create_engine(DATABASE_URL)

# Configurer la session
Session = sessionmaker(bind=engine)

class UserRole(Enum):
    passenger = "passenger"
    driver = "driver"
    both = "both"

# Modèle utilisateur
class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    town = Column(String, nullable=True)
    email = Column(String, unique=True, nullable=False)
    phone_number = Column(String, nullable=True)
    password_hash = Column(String, nullable=False)
    user_role = Column(String, default=UserRole.passenger)
    is_active = Column(String, default=False)  
    date_of_birth = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.now().replace(microsecond=0).strftime("%Y-%m-%d %H:%M"))
    updated_at = Column(DateTime, default=datetime.now().replace(microsecond=0).strftime("%Y-%m-%d %H:%M"))

    # Relations
   
    cars = relationship("Car", back_populates="user", cascade="all, delete-orphan")

