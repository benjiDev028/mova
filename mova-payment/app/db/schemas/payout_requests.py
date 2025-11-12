# app/db/schemas/driver_earning.py
from pydantic import BaseModel, UUID4
from datetime import datetime
from decimal import Decimal
from typing import Optional, List


# app/db/schemas/payout_request.py
class PayoutRequestCreate(BaseModel):
    driver_id: UUID4
    earning_ids: List[UUID4]  # IDs des earnings à encaisser

class PayoutRequestResponse(BaseModel):
    id: UUID4
    driver_id: UUID4
    total_amount: Decimal
    currency: str
    status: str
    requested_at: datetime
    approved_at: Optional[datetime]
    paid_at: Optional[datetime]
    transfer_reference: Optional[str]
    eta_date: Optional[datetime]
    
    class Config:
        from_attributes = True

class PayoutApproveRequest(BaseModel):
    transfer_reference: str
    admin_notes: Optional[str] = None
    eta_days: int = 3  # Jours ouvrables estimés

class PayoutMarkPaidRequest(BaseModel):
    paid_at: Optional[datetime] = None