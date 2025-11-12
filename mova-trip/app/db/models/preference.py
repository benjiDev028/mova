from sqlalchemy import Column, Integer, String, ForeignKey,Float,Date,Time,Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship,sessionmaker
from sqlalchemy.ext.declarative import declarative_base 
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv
from datetime import datetime
from enum import Enum
from app.db.base import Base
import os

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL doit être défini dans le fichier .env")
engine = create_engine(DATABASE_URL)
# Configurer la session
Session = sessionmaker(bind=engine)

class ModePayment(Enum):
    cash = "cash"
    virement = "virement"
    


class Preference(Base):
    __tablename__ = "preferences"
    id = Column(UUID(as_uuid=True), primary_key=True)
    trip_id = Column(UUID, ForeignKey("trips.id", ondelete="CASCADE"), unique=True, nullable=False)
    baggage = Column(Boolean, default=True)
    pets_allowed = Column(Boolean, default=False)
    smoking_allowed = Column(Boolean, default=False)
    air_conditioning = Column(Boolean, default=False)
    bike_support = Column(Boolean, default=False)
    ski_support = Column(Boolean, default=False)
    mode_payment = Column(String, default=ModePayment.cash)  # "cash", "card", 



    # Relation
    trip = relationship("Trip", back_populates="preferences")
  

