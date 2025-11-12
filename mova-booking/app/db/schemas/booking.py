# app/db/schemas/booking.py
from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal, List
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class BookingCreate(BaseModel):
    # clés
    id_user: UUID
    id_trip: UUID
    id_stop: Optional[UUID] = None
    id_driver: UUID

    # quantités & prix unitaires
    number_of_seats: int = Field(gt=0)
    price_per_seat: Decimal = Field(gt=Decimal("0"))
    reservation_fee_per_seat: Decimal = Field(ge=Decimal("0"))

    # taxes & devise (snapshots)
    currency: str = Field(default="CAD", min_length=3, max_length=3)
    tax_rate: Decimal = Field(default=Decimal("0.15"))      # ex: 0.15
    tax_region: str = Field(default="HST-NB")

    # modes
    chauffeur_payment_method: Literal["cash", "virement"]
    payment_method_used: str = Field(default="card")

    # politique d'annulation (snapshot)
    free_cancellation_until: datetime

class BookingResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    id_user: UUID
    id_trip: UUID
    id_stop: Optional[UUID]
    id_driver: UUID

    number_of_seats: int
    price_per_seat: Decimal
    reservation_fee_per_seat: Decimal

    currency: str
    tax_rate: Decimal
    tax_region: str

    base_total: Decimal
    fee_total: Decimal
    tax_total: Decimal
    charged_now_total: Decimal

    chauffeur_payment_method: Literal["cash", "virement"]
    payment_method_used: str

    # payout helpers
    driver_payable: Decimal
    driver_collected_cash: Decimal

    free_cancellation_until: datetime
    status: str
    created_at: datetime
    updated_at: Optional[datetime]
class BookingCancelRequest(BaseModel):
    cancelled_at: datetime
    reason: Optional[str] = None

class BookingCancelResponse(BaseModel):
    booking: BookingResponse
    refund_amount: Decimal
    seats_to_give_back: int
    before_cutoff: bool

class CompleteByTripRequest(BaseModel):
    completed_at: datetime

class CompleteByTripResponse(BaseModel):
    updated: int

