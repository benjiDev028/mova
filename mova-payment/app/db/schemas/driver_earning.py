# app/db/schemas/driver_earning.py
from pydantic import BaseModel, UUID4
from datetime import datetime
from decimal import Decimal
from typing import Optional

class DriverEarningResponse(BaseModel):
    id: UUID4
    driver_id: UUID4
    booking_id: UUID4
    trip_id: UUID4
    amount: Decimal
    currency: str
    status: str
    trip_date: datetime
    payable_at: Optional[datetime]
    passenger_name: Optional[str]
    route: Optional[str]
    
    class Config:
        from_attributes = True
class DriverEarningCreate(BaseModel):
    driver_id: UUID4
    booking_id: UUID4
    trip_id: UUID4
    amount: Decimal
    currency: Optional[str] = "CAD"
    trip_date: datetime
    passenger_name: Optional[str]
    route: Optional[str]