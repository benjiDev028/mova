from sqlalchemy import Column, Integer, String, ForeignKey, Float, Date, Time, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, sessionmaker
from datetime import date, time
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv
from datetime import datetime
import uuid
import os
from app.db.base import Base
from enum import Enum
load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("DATABASE_URL doit être défini dans le fichier .env")
engine = create_engine(DATABASE_URL)

Session = sessionmaker(bind=engine)

class Car(Base) :
    __tablename__ = "cars"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    brand = Column(String, nullable=False)
    model = Column(String, nullable=False)
    color = Column(String, nullable=False)
    license_plate = Column(String, nullable=False, unique=True)
    seats = Column(Integer, nullable=False)
    date_of_Car = Column(Date, nullable=False)
    created_at = Column(DateTime, default=datetime.now().replace(microsecond=0).strftime("%Y-%m-%d %H:%M"))
    updated_at = Column(DateTime, default=datetime.now().replace(microsecond=0).strftime("%Y-%m-%d %H:%M"))




    user = relationship("User", back_populates="cars")