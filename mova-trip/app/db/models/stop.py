from sqlalchemy import Column, Integer, String, ForeignKey,Float,Date,Time
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship,sessionmaker
from sqlalchemy.ext.declarative import declarative_base 
from sqlalchemy import create_engine, inspect
from dotenv import load_dotenv
from datetime import datetime
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

class Stop(Base):
    __tablename__ = "stops"
    id = Column(UUID(as_uuid=True), primary_key=True)
    trip_id = Column(UUID(as_uuid=True), ForeignKey("trips.id", ondelete="CASCADE"), nullable=False)
    destination_city = Column(String, nullable=False)
    price = Column(Float, nullable=False)

    trip = relationship("Trip", back_populates="stops")




    
# Supprimer et recréer uniquement la table "users" si elle existe
if __name__ == "__main__":
    print("Vérification et suppression de la table 'stops' si elle existe...")

    inspector = inspect(engine)
    
    # Vérifier si la table existe
    if "users" in inspector.get_table_names():
        print("Table 'stops' existante trouvée. Suppression en cours...")
        Stop.__table__.drop(engine)  # Supprimer la table 'users'

    
    # Créer la table
    print("Création de la table 'stops'...")
    Base.metadata.create_all(engine)
    print("Table 'stops' créée avec succès.")

    
   


 