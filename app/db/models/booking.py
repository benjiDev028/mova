from sqlalchemy import (
    Column, String, Integer, DateTime, Enum as SAEnum, Index
)
from sqlalchemy.dialects.postgresql import UUID, NUMERIC
from sqlalchemy.sql import func
from datetime import datetime
import uuid
from enum import Enum
from app.db.base import Base

# États minimalistes
class BookingStatus(str, Enum):
    pending = "pending"     # initial
    confirmed = "confirmed"   # créé après paiement OK
    cancelled = "cancelled"
    completed = "completed"
    failed    = "failed"      # (rare) si tu veux marquer un échec technique

# Mode de paiement côté chauffeur
class ModeOfPayment(str, Enum):
    cash     = "cash"
    virement = "virement"     # = transfer

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)

    # Contexte / clés
    id_user   = Column(UUID(as_uuid=True), nullable=False)
    id_trip   = Column(UUID(as_uuid=True), nullable=False)
    id_stop   = Column(UUID(as_uuid=True), nullable=True)
    id_driver = Column(UUID(as_uuid=True), nullable=False)   # snapshot simple du chauffeur

    # Quantités & prix (snapshot)
    number_of_seats = Column(Integer, nullable=False)
    price_per_seat = Column(NUMERIC(10, 2), nullable=False)               # ex: 25.00
    reservation_fee_per_seat = Column(NUMERIC(10, 2), nullable=False)     # ex: 3.50

    currency   = Column(String(3), nullable=False, default="CAD")         # ex: CAD
    tax_rate   = Column(NUMERIC(5, 4), nullable=False)                    # ex: 0.1500
    tax_region = Column(String(16), nullable=False)                       # ex: HST-NB

    # Totaux (snapshot, toujours stockés)
    base_total        = Column(NUMERIC(12, 2), nullable=False)            # seats * price_per_seat
    fee_total         = Column(NUMERIC(12, 2), nullable=False)            # seats * reservation_fee_per_seat
    tax_total         = Column(NUMERIC(12, 2), nullable=False)            # taxes sur ce qui a été capturé
    charged_now_total = Column(NUMERIC(12, 2), nullable=False)            # montant capturé à la création

    # Logique payout / cash chauffeur
    driver_payable        = Column(NUMERIC(12, 2), nullable=False, default=0)  # dû au chauffeur si virement
    driver_collected_cash = Column(NUMERIC(12, 2), nullable=False, default=0)  # mémo: si cash

    # Politique d'annulation (snapshot)
    free_cancellation_until = Column(DateTime(timezone=True), nullable=False)

    # Modes
    chauffeur_payment_method = Column(SAEnum(ModeOfPayment), nullable=False)  # cash|virement
    payment_method_used      = Column(String(32), nullable=False)             # card|interac|...

    # Statut & audit
    status     = Column(SAEnum(BookingStatus), nullable=False, default=BookingStatus.pending)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    __table_args__ = (
        Index("idx_bookings_user", "id_user"),
        Index("idx_bookings_trip", "id_trip"),
        Index("idx_bookings_driver", "id_driver"),
        Index("idx_bookings_status", "status"),
    )
