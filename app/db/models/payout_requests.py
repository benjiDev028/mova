# app/db/models/payout_request.py
from sqlalchemy import Column, String, Numeric, DateTime, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.db.base import Base

class PayoutStatus(str, enum.Enum):
    REQUESTED = "requested"       # Demandé par le chauffeur
    APPROVED = "approved"         # Approuvé par admin (avant virement)
    PROCESSING = "processing"     # Virement en cours
    PAID = "paid"                 # Versé
    FAILED = "failed"             # Échec
    CANCELLED = "cancelled"       # Annulé

class PayoutRequest(Base):
    __tablename__ = "payout_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    driver_id = Column(UUID(as_uuid=True), nullable=False, index=True)
    
    # Montants
    total_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="CAD")
    
    # Statut
    status = Column(SQLEnum(PayoutStatus), default=PayoutStatus.REQUESTED, nullable=False, index=True)
    
    # Infos bancaires (optionnel si tu les stockes ailleurs)
    bank_account_last4 = Column(String(4), nullable=True)
    
    # Référence de transfert (Interac/RBC)
    transfer_reference = Column(String(50), nullable=True)
    
    # Timestamps
    requested_at = Column(DateTime, default=datetime.utcnow)
    approved_at = Column(DateTime, nullable=True)
    paid_at = Column(DateTime, nullable=True)
    eta_date = Column(DateTime, nullable=True)  # Date estimée de réception
    
    # Notes admin
    admin_notes = Column(Text, nullable=True)
    failure_reason = Column(Text, nullable=True)
    
    # Relations
    earnings = relationship("DriverEarning", backref="payout_request")