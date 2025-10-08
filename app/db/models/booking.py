# models/booking.py
from sqlalchemy import (
    Column, ForeignKey, Integer, String, Float,
    DateTime
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
from app.db.base import Base
from enum import Enum

class BookingStatus(str, Enum):
   
    cancelled  = "cancelled"
    completed  = "completed"
    failed ="failed"
    pending = "pending"

class ModeOfPayment(str, Enum):
    cash = "cash"
    virement = "virement"

class Booking(Base):
    __tablename__ = "bookings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, nullable=False)
    id_user = Column(UUID, nullable=False)
    id_trip = Column(UUID, nullable=False)
    id_stop = Column(UUID, nullable=True)
    number_of_seats = Column(Integer, nullable=False)
    price_per_seat = Column(Float, nullable=False)         # ex: 15$
    reservation_fee_per_seat = Column(Float,nullable=False)       # toujours fixe
    total_trip_price = Column(Float, nullable=False)             # 15 x 2 = 30$
    total_reservation_fee = Column(Float, nullable=False)        # 3.5 x 2 = 7$
    total_to_pay = Column(Float, nullable=False)                 # dépend du mode de paiement chauffeur
    status = Column(String, default="pending")   # completed / failed
    chauffeur_payment_method = Column(String, nullable=False)    # cash ou virement
    payment_method_used = Column(String, nullable=False)         # méthode utilisée par le client
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

