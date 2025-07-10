from pydantic import BaseModel, Field, validator
from datetime import datetime, date, time
from uuid import UUID
from typing import Optional, List, Literal
from app.db.schemas.preference import PreferenceResponse,PreferenceCreate
from app.db.schemas.stop import StopResponse, StopCreate
from enum import Enum



class TripStatus(str, Enum):
    pending = "pending"
    ongoing = "ongoing"
    completed = "completed"
    cancelled = "cancelled"


class TripBase(BaseModel):
    driver_id: UUID
    car_id:UUID
    departure_city: str = Field(..., max_length=100)
    destination_city: str = Field(..., max_length=100)
    departure_place: str = Field(..., max_length=100)
    destination_place: str = Field(..., max_length=100)
    departure_time: time
    departure_date: date
    total_price: float
    available_seats: int
    message: Optional[str] = None
    status: TripStatus = TripStatus.pending

    class Config:
        orm_mode = True


class TripCreate(TripBase):
    
    preferences: PreferenceCreate
    stops: Optional[List[StopCreate]] = None


class TripUpdate(TripBase):
    id: UUID


class TripResponse(TripBase):
    id: UUID
    car_id:UUID
    created_at: datetime
    updated_at: datetime
    preferences: Optional[PreferenceResponse]     
    stops: Optional[List[StopResponse]] 
