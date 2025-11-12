# app/db/models/driver_earning.py
from sqlalchemy import Column, String, Numeric, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

from app.db.base import Base

class EarningStatus(str, enum.Enum):
    PENDING_TRIP = "pending_trip"      # Trip pas encore complété
    PAYABLE = "payable"                 # Trip complété, peut être encaissé
    REQUESTED = "requested"             # Inclus dans une demande de paiement
    PROCESSING = "processing"           # Virement en cours
    PAID = "paid"                       # Versé au chauffeur
    FAILED = "failed"                   # Échec du virement

class DriverEarning(Base):
    __tablename__ = "driver_earnings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    driver_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    booking_id = Column(UUID(as_uuid=True), nullable=False)
    trip_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    # Montants
    amount = Column(Numeric(10, 2), nullable=False)  # driver_payable du booking
    currency = Column(String(3), default="CAD")
    
    # Statut et tracking
    status = Column(SQLEnum(EarningStatus), default=EarningStatus.PENDING_TRIP, nullable=False, index=True)
    
    # Timestamps
    trip_date = Column(DateTime, nullable=False)     # Date du trajet
    created_at = Column(DateTime, default=datetime.utcnow)
    payable_at = Column(DateTime, nullable=True)     # Quand trip complété
    requested_at = Column(DateTime, nullable=True)   # Quand demande payout
    paid_at = Column(DateTime, nullable=True)        # Quand versé
    
    # Lien vers le payout (si demandé)
    payout_request_id = Column(UUID(as_uuid=True), ForeignKey("payout_requests.id"), nullable=True)
    
    # Métadonnées
    passenger_name = Column(String(100), nullable=True)
    route = Column(String(200), nullable=True)  # "Montréal → Ottawa"