# app/db/schemas/payment.py
from pydantic import BaseModel, UUID4
from datetime import datetime
from decimal import Decimal
from typing import Optional

class PaymentCreate(BaseModel):
    user_id: UUID4
    driver_id: UUID4
    trip_id: UUID4
    booking_id: UUID4
    amount: Decimal
    currency: str = "CAD"
    fee: Decimal
    tax_rate: Decimal
    tax_region: str
    payment_method: str = "card"
    
    # 🆕 NOUVEAUX CHAMPS (dénormalisation)
    chauffeur_payment_method: str  # "virement" | "cash"
    driver_payable: Decimal = Decimal("0.00")
    trip_departure_city: Optional[str] = None
    trip_destination_city: Optional[str] = None
    trip_departure_date: Optional[datetime] = None
    passenger_name: Optional[str] = None

class PaymentResponse(BaseModel):
    id: UUID4
    user_id: UUID4
    driver_id: UUID4
    trip_id: UUID4
    booking_id: UUID4
    amount: Decimal
    currency: str
    status: str
    stripe_payment_intent_id: str
    stripe_receipt_url: Optional[str]
    created_at: datetime
    
    # 🆕 Champs dénormalisés
    chauffeur_payment_method: Optional[str]
    driver_payable: Optional[Decimal]
    trip_departure_city: Optional[str]
    trip_destination_city: Optional[str]
    
    class Config:
        from_attributes = True