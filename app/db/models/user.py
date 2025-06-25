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
from dotenv import load_dotenv


import os

# Charger les variables d'environnement
load_dotenv()

# Base de SQLAlchemy
Base = declarative_base()

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


class UserCode(Base):
    __tablename__ = 'user_codes'

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    code = Column(Integer)
    created_at = Column(DateTime, default=datetime.now().replace(microsecond=0).strftime("%Y-%m-%d %H:%M"))
 

    def __repr__(self):
        return f"<UserCode(email={self.email}, code={self.code}, created_at={self.created_at})>"


# Supprimer et recréer uniquement la table "users" si elle existe
if __name__ == "__main__":
    print("Vérification et suppression de la table 'users' si elle existe...")

    inspector = inspect(engine)
    
    # Vérifier si la table existe
    if "users" in inspector.get_table_names():
        print("Table 'users' existante trouvée. Suppression en cours...")
        User.__table__.drop(engine)  # Supprimer la table 'users'

    
    # Créer la table
    print("Création de la table 'users'...")
    Base.metadata.create_all(engine)
    print("Table 'users' créée avec succès.")
