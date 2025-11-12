# app/services/driver_earning_service.py
import logging
from decimal import Decimal
from datetime import datetime, timedelta
from uuid import UUID
from typing import List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, extract
from fastapi import HTTPException

from app.db.models.driver_earning import DriverEarning, EarningStatus
from app.db.models.payout_requests import PayoutRequest, PayoutStatus
from app.db.schemas.driver_earning import DriverEarningResponse
from app.db.schemas.payout_requests import (
    PayoutRequestCreate, PayoutRequestResponse,
    PayoutApproveRequest, PayoutMarkPaidRequest
)

logger = logging.getLogger(__name__)

# ========== CRÉATION D'UN EARNING ==========
async def create_earning_after_payment(
    db: AsyncSession,
    driver_id: UUID,
    booking_id: UUID,
    trip_id: UUID,
    amount: Decimal,
    trip_date: datetime,
    passenger_name: str,
    route: str
) -> DriverEarning:
    """
    Créé quand le paiement Stripe SUCCEEDED et booking confirmé.
    Statut initial: PENDING_TRIP (en attente de completion du trajet)
    """
    earning = DriverEarning(
        driver_id=driver_id,
        booking_id=booking_id,
        trip_id=trip_id,
        amount=amount,
        trip_date=trip_date,
        passenger_name=passenger_name,
        route=route,
        status=EarningStatus.PENDING_TRIP
    )
    
    db.add(earning)
    await db.commit()
    await db.refresh(earning)
    
    logger.info(f"✅ Earning créé: {earning.id} pour driver {driver_id}, montant {amount}")
    return earning

# ========== MARQUER PAYABLE QUAND TRIP COMPLÉTÉ ==========
async def mark_trip_earnings_payable(db: AsyncSession, trip_id: UUID):
    """
    Appelé quand trip passe à COMPLETED.
    Tous les earnings PENDING_TRIP de ce trip → PAYABLE
    """
    now = datetime.utcnow()
    
    result = await db.execute(
        select(DriverEarning).where(
            and_(
                DriverEarning.trip_id == trip_id,
                DriverEarning.status == EarningStatus.PENDING_TRIP
            )
        )
    )
    earnings = result.scalars().all()
    
    for earning in earnings:
        earning.status = EarningStatus.PAYABLE
        earning.payable_at = now
    
    await db.commit()
    
    logger.info(f"✅ {len(earnings)} earning(s) marqués PAYABLE pour trip {trip_id}")
    return len(earnings)

# ========== RÉCUPÉRER LES EARNINGS D'UN CHAUFFEUR ==========
async def get_driver_earnings_summary(db: AsyncSession, driver_id: UUID):
    """
    Retourne les agrégats pour l'écran d'encaissement
    """
    # Mois en cours
    now = datetime.utcnow()
    current_month = now.month
    current_year = now.year
    
    # Total du mois (tous statuts)
    result = await db.execute(
        select(DriverEarning).where(
            and_(
                DriverEarning.driver_id == driver_id,
                extract('month', DriverEarning.trip_date) == current_month,
                extract('year', DriverEarning.trip_date) == current_year
            )
        )
    )
    month_earnings = result.scalars().all()
    total_month = sum(e.amount for e in month_earnings)
    
    # À encaisser (PAYABLE)
    result = await db.execute(
        select(DriverEarning).where(
            and_(
                DriverEarning.driver_id == driver_id,
                DriverEarning.status == EarningStatus.PAYABLE
            )
        )
    )
    payable = result.scalars().all()
    amount_payable = sum(e.amount for e in payable)
    
    # En transfert (REQUESTED + PROCESSING)
    result = await db.execute(
        select(DriverEarning).where(
            and_(
                DriverEarning.driver_id == driver_id,
                DriverEarning.status.in_([EarningStatus.REQUESTED, EarningStatus.PROCESSING])
            )
        )
    )
    processing = result.scalars().all()
    amount_processing = sum(e.amount for e in processing)
    
    # Total payé (PAID)
    result = await db.execute(
        select(DriverEarning).where(
            and_(
                DriverEarning.driver_id == driver_id,
                DriverEarning.status == EarningStatus.PAID
            )
        )
    )
    paid = result.scalars().all()
    amount_paid = sum(e.amount for e in paid)
    
    return {
        "total_month": float(total_month),
        "amount_payable": float(amount_payable),
        "count_payable": len(payable),
        "amount_processing": float(amount_processing),
        "count_processing": len(processing),
        "amount_paid_total": float(amount_paid),
        "payable_earnings": [DriverEarningResponse.model_validate(e) for e in payable],
        "processing_earnings": [DriverEarningResponse.model_validate(e) for e in processing],
    }

# ========== DEMANDE D'ENCAISSEMENT ==========
async def create_payout_request(
    db: AsyncSession,
    data: PayoutRequestCreate
) -> PayoutRequestResponse:
    """
    Le chauffeur demande l'encaissement de earnings PAYABLE
    """
    # Vérifier que tous les earnings sont PAYABLE et appartiennent au driver
    result = await db.execute(
        select(DriverEarning).where(
            and_(
                DriverEarning.id.in_(data.earning_ids),
                DriverEarning.driver_id == data.driver_id,
                DriverEarning.status == EarningStatus.PAYABLE
            )
        )
    )
    earnings = result.scalars().all()
    
    if len(earnings) != len(data.earning_ids):
        raise HTTPException(
            status_code=400,
            detail="Certains earnings sont invalides ou déjà encaissés"
        )
    
    total = sum(e.amount for e in earnings)
    
    # Créer la demande
    payout = PayoutRequest(
        driver_id=data.driver_id,
        total_amount=total,
        status=PayoutStatus.REQUESTED
    )
    
    db.add(payout)
    await db.flush()
    
    # Lier les earnings et changer leur statut
    for earning in earnings:
        earning.status = EarningStatus.REQUESTED
        earning.requested_at = datetime.utcnow()
        earning.payout_request_id = payout.id
    
    await db.commit()
    await db.refresh(payout)
    
    logger.info(f"✅ Payout request créé: {payout.id}, montant: {total}")
    return PayoutRequestResponse.model_validate(payout)

# ========== ADMIN: APPROUVER ET EFFECTUER LE VIREMENT ==========
async def approve_payout_request(
    db: AsyncSession,
    payout_id: UUID,
    data: PayoutApproveRequest
) -> PayoutRequestResponse:
    """
    Admin approuve et enregistre la référence de virement
    """
    result = await db.execute(
        select(PayoutRequest).where(PayoutRequest.id == payout_id)
    )
    payout = result.scalar_one_or_none()
    
    if not payout:
        raise HTTPException(status_code=404, detail="Payout introuvable")
    
    if payout.status != PayoutStatus.REQUESTED:
        raise HTTPException(
            status_code=400,
            detail=f"Payout déjà {payout.status}"
        )
    
    now = datetime.utcnow()
    eta = now + timedelta(days=data.eta_days)
    
    payout.status = PayoutStatus.PROCESSING
    payout.approved_at = now
    payout.transfer_reference = data.transfer_reference
    payout.admin_notes = data.admin_notes
    payout.eta_date = eta
    
    # Mettre à jour les earnings liés
    result = await db.execute(
        select(DriverEarning).where(
            DriverEarning.payout_request_id == payout_id
        )
    )
    earnings = result.scalars().all()
    
    for earning in earnings:
        earning.status = EarningStatus.PROCESSING
    
    await db.commit()
    await db.refresh(payout)
    
    logger.info(f"✅ Payout {payout_id} approuvé, réf: {data.transfer_reference}")
    return PayoutRequestResponse.model_validate(payout)

# ========== ADMIN: MARQUER COMME PAYÉ ==========
async def mark_payout_as_paid(
    db: AsyncSession,
    payout_id: UUID,
    data: PayoutMarkPaidRequest
) -> PayoutRequestResponse:
    """
    Admin confirme que le virement est reçu
    """
    result = await db.execute(
        select(PayoutRequest).where(PayoutRequest.id == payout_id)
    )
    payout = result.scalar_one_or_none()
    
    if not payout:
        raise HTTPException(status_code=404, detail="Payout introuvable")
    
    if payout.status not in [PayoutStatus.PROCESSING, PayoutStatus.APPROVED]:
        raise HTTPException(
            status_code=400,
            detail=f"Impossible de marquer comme payé depuis {payout.status}"
        )
    
    paid_at = data.paid_at or datetime.utcnow()
    
    payout.status = PayoutStatus.PAID
    payout.paid_at = paid_at
    
    # Mettre à jour les earnings
    result = await db.execute(
        select(DriverEarning).where(
            DriverEarning.payout_request_id == payout_id
        )
    )
    earnings = result.scalars().all()
    
    for earning in earnings:
        earning.status = EarningStatus.PAID
        earning.paid_at = paid_at
    
    await db.commit()
    await db.refresh(payout)
    
    logger.info(f"✅ Payout {payout_id} marqué PAID")
    return PayoutRequestResponse.model_validate(payout)

# ========== LISTER LES DEMANDES (ADMIN) ==========
async def list_payout_requests(
    db: AsyncSession,
    status: PayoutStatus = None,
    skip: int = 0,
    limit: int = 100
) -> List[PayoutRequestResponse]:
    """
    Liste toutes les demandes de payout (pour admin web)
    """
    query = select(PayoutRequest)
    
    if status:
        query = query.where(PayoutRequest.status == status)
    
    query = query.order_by(PayoutRequest.requested_at.desc()).offset(skip).limit(limit)
    
    result = await db.execute(query)
    payouts = result.scalars().all()
    
    return [PayoutRequestResponse.model_validate(p) for p in payouts]