# app/api/driver_earning_route.py
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from uuid import UUID
from typing import Optional,List

from app.db.database import get_db
from app.db.schemas.driver_earning import DriverEarningResponse
from app.db.schemas.payout_requests import (
    PayoutRequestCreate, PayoutRequestResponse,
    PayoutApproveRequest, PayoutMarkPaidRequest
)
from app.services.driver_earning_service import (
    get_driver_earnings_summary,
    create_payout_request,
    approve_payout_request,
    mark_payout_as_paid,
    list_payout_requests
)
from app.db.models.payout_requests import PayoutStatus

router = APIRouter()

# ========== CHAUFFEUR ==========
@router.get("/driver/{driver_id}/summary")
async def get_earnings_summary(
    driver_id: UUID,
    db: AsyncSession = Depends(get_db)
):
    """
    📊 Résumé pour l'écran d'encaissement du chauffeur
    """
    return await get_driver_earnings_summary(db, driver_id)

@router.post("/payout-request", response_model=PayoutRequestResponse)
async def request_payout(
    data: PayoutRequestCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    💰 Le chauffeur demande l'encaissement
    """
    return await create_payout_request(db, data)

# ========== ADMIN ==========
@router.get("/admin/payout-requests", response_model=List[PayoutRequestResponse])
async def list_all_payouts(
    status: Optional[PayoutStatus] = Query(None),
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db)
):
    """
    📋 Liste toutes les demandes de payout (admin web)
    """
    return await list_payout_requests(db, status, skip, limit)

@router.post("/admin/payout/{payout_id}/approve", response_model=PayoutRequestResponse)
async def approve_payout(
    payout_id: UUID,
    data: PayoutApproveRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    ✅ Admin approuve et enregistre la référence de virement
    """
    return await approve_payout_request(db, payout_id, data)

@router.post("/admin/payout/{payout_id}/mark-paid", response_model=PayoutRequestResponse)
async def mark_paid(
    payout_id: UUID,
    data: PayoutMarkPaidRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    💵 Admin confirme que le virement est reçu
    """
    return await mark_payout_as_paid(db, payout_id, data)