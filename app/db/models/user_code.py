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
from datetime import datetime,date
from sqlalchemy.sql import func
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


class UserCode(Base):
    __tablename__ = 'user_codes'

    id = Column(Integer, primary_key=True)
    email = Column(String, index=True)
    code = Column(Integer)
    created_at = Column(DateTime, default=datetime.now().replace(microsecond=0).strftime("%Y-%m-%d %H:%M"))
 

    def __repr__(self):
        return f"<UserCode(email={self.email}, code={self.code}, created_at={self.created_at})>"

    