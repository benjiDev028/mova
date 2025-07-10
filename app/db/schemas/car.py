from pydantic import BaseModel, EmailStr, Field
from datetime import datetime,date 
from uuid import UUID
from typing import Optional
from enum import Enum


# Schéma de base pour l'utilisateur (les champs communs à tous les utilisateurs)
class CarBase(BaseModel):
    id: Optional[UUID] = Field(default=None, description="Identifiant unique de la voiture")
    user_id: UUID = Field(..., description="Identifiant de l'utilisateur propriétaire de la voiture")
    brand: str = Field(..., description="Marque de la voiture") 
    model: str = Field(..., description="Modèle de la voiture")
    color: str = Field(..., description="Couleur de la voiture")
    license_plate: str = Field(..., description="Plaque d'immatriculation de la voiture")
    seats: int = Field(..., description="Nombre de sièges dans la voiture")
    date_of_car: int = Field(..., description="Date de la voiture")
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
   

    class Config:
        orm_mode = True  # Permet de manipuler des objets ORM directement


# Schéma pour la création d'une voiture
class CarCreate(CarBase):

    pass

# Schéma pour la mise à jour d'une voiture
class CarUpdate(CarBase):
    id: Optional[UUID] = Field(default=None, description="Identifiant unique de la voiture (peut être omis lors de la mise à jour)")


# Schéma pour la réponse de la voiture
class CarResponse(CarBase):
    id: UUID = Field(..., description="Identifiant unique de la voiture")
    user_id: UUID = Field(..., description="Identifiant de l'utilisateur propriétaire de la voiture")
    brand: str = Field(..., description="Marque de la voiture") 
    model: str = Field(..., description="Modèle de la voiture")
    color: str = Field(..., description="Couleur de la voiture")
    license_plate: str = Field(..., description="Plaque d'immatriculation de la voiture")
    seats: int = Field(..., description="Nombre de sièges dans la voiture")
    date_of_car: int = Field(..., description="Date de la voiture")
    created_at: datetime = Field(default_factory=lambda: datetime.now().replace(microsecond=0), description="Date de création de l'enregistrement")
    updated_at: datetime = Field(default_factory=lambda: datetime.now().replace(microsecond=0), description="Date de la dernière mise à jour de l'enregistrement")