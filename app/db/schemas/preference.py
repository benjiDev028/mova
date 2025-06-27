from pydantic import BaseModel
from uuid import UUID
from typing import Literal


class PreferenceBase(BaseModel):
    baggage: bool = True
    pets_allowed: bool = False
    smoking_allowed: bool = False
    air_conditioning: bool = False
    bike_support: bool = False
    ski_support: bool = False
    mode_payment: Literal["cash", "virement"] = "cash"

    class Config:
        orm_mode = True


class PreferenceCreate(PreferenceBase):
    pass


class PreferenceUpdate(PreferenceBase):
    id: UUID


class PreferenceResponse(PreferenceBase):
    id: UUID

    class Config:
        orm_mode = True
