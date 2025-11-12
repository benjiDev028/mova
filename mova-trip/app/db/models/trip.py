from sqlalchemy import Column, Integer, String, ForeignKey,Float,Date,Time,DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship,sessionmaker
from datetime import date, time
from sqlalchemy.ext.declarative import declarative_base 
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv
from datetime import datetime
import uuid
from app.db.base import Base
from enum import Enum
import os




load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")


if not DATABASE_URL:
    raise ValueError("DATABASE_URL doit être défini dans le fichier .env")

engine = create_engine(DATABASE_URL)

# Configurer la session
Session = sessionmaker(bind=engine)

class Status(Enum):
    pending = "pending"
    ongoing = "ongoing"
    completed = "completed"
    cancelled = "cancelled"


class Trip(Base):
    __tablename__ = "trips"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    driver_id = Column(UUID, nullable=False, index=True)
    car_id =Column(UUID, nullable=True, index=True)
    departure_city = Column(String, nullable=False, index=True)
    destination_city = Column(String, nullable=False, index=True)
    departure_place = Column(String, nullable=False)
    destination_place = Column(String, nullable=False)
    departure_time = Column(Time, nullable=False)
    departure_date = Column(Date, nullable=False, index=True)
    total_price = Column(Float, nullable=False)
    available_seats = Column(Integer, nullable=False)
    message = Column(String, nullable=True)
    status = Column(String, default="pending")  # pending, ongoing, completed, cancelled
    created_at = Column(DateTime, default=datetime.now().replace(microsecond=0).strftime("%Y-%m-%d %H:%M"))
    updated_at = Column(DateTime, default=datetime.now().replace(microsecond=0).strftime("%Y-%m-%d %H:%M"))

     # Relations
    preferences = relationship("Preference", back_populates="trip", uselist=False, cascade="all, delete-orphan")
    stops = relationship("Stop", back_populates="trip", cascade="all, delete-orphan")



    
# Supprimer et recréer uniquement la table "users" si elle existe
if __name__ == "__main__":
    print("Vérification et suppression de la table 'trips' si elle existe...")

    inspector = inspect(engine)
    
    # Vérifier si la table existe
    if "users" in inspector.get_table_names():
        print("Table 'trips' existante trouvée. Suppression en cours...")
        Trip.__table__.drop(engine)  # Supprimer la table 'users'

    
    # Créer la table
    print("Création de la table 'trips'...")
    Base.metadata.create_all(engine)
    print("Table 'trips' créée avec succès.")

    
   