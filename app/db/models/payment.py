# app/db/models/payment.py
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.db.base import Base

class PaymentStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"
    CANCELLED = "cancelled"

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    driver_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    trip_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    booking_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Montants
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="CAD")
    fee = Column(Numeric(10, 2), nullable=True)
    tax_rate = Column(Numeric(5, 4), nullable=True)
    tax_region = Column(String(50), nullable=True)
    
    # Stripe
    stripe_payment_intent_id = Column(String(100), unique=True, nullable=False)
    stripe_receipt_url = Column(String(500), nullable=True)
    
    # Statut
    status = Column(SQLEnum(PaymentStatus), default=PaymentStatus.PENDING, nullable=False, index=True)
    payment_method = Column(String(50), nullable=True)
    
    # 🆕 DÉNORMALISATION : Infos du booking (pour éviter appels HTTP)
    chauffeur_payment_method = Column(String(20), nullable=True)  # "virement" | "cash"
    driver_payable = Column(Numeric(10, 2), nullable=True, default=0)
    
    # 🆕 DÉNORMALISATION : Infos du trip (pour créer l'earning)
    trip_departure_city = Column(String(100), nullable=True)
    trip_destination_city = Column(String(100), nullable=True)
    trip_departure_date = Column(DateTime, nullable=True)
    
    # 🆕 DÉNORMALISATION : Info passager (optionnel)
    passenger_name = Column(String(100), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)