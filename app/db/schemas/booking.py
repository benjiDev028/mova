from pydantic import BaseModel, Field
from typing import Optional, Literal
from uuid import UUID
from datetime import datetime
from enum import Enum

class ModeOfPayment(str, Enum):
    cash = "cash"
    virement = "virement"


class BookingBase(BaseModel):
    id_user : UUID
    id_user : UUID
    id_trip : UUID
    id_stop : UUID
    number_of_seats : int 
    price_per_seat :float       # toujours fixe
    total_trip_price :float           # 15 x 2 = 30$
    total_reservation_fee : float      # 3.5 x 2 = 7$
    reservation_fee_per_seat:float
    total_to_pay : float                # dépend du mode de paiement chauffeur
    status : str
    chauffeur_payment_method :str  # cash ou virement
    payment_method_used :str        # méthode utilisée par le client
    


class BookingCreate(BookingBase):
    id_user: UUID
    id_trip: UUID
    id_stop: Optional[UUID] = None
    number_of_seats: int 
    payment_method_used: str # méthode choisie par le client
  

    class Config:
       orm_mode =True
       from_attributes=True





class BookingResponse(BaseModel):
    id: UUID
    id_user: UUID
    id_trip: UUID
    id_stop: Optional[UUID]
    number_of_seats: int

    price_per_seat: float
    reservation_fee_per_seat: float
    total_trip_price: float
    total_reservation_fee: float
    total_to_pay: float

    chauffeur_payment_method: Literal["cash", "virement"]
    payment_method_used: str
    status: str
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes=True
      