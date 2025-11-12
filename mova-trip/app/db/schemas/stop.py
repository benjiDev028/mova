from pydantic import BaseModel, Field
from uuid import UUID
from typing import Optional


class StopBase(BaseModel):
    destination_city: str = Field(..., max_length=100)
    price: float
    stop_order: Optional[int] = 1

    class Config:
        orm_mode = True


class StopCreate(StopBase):
    pass


class StopUpdate(StopBase):
    id: UUID


class StopResponse(BaseModel):
    id: UUID
    destination_city: str = Field(..., max_length=100)
    price: float

    class Config:
        orm_mode = True