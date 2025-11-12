# app/api/payment_route.py
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.database import get_db
from app.db.schemas.payment import PaymentCreate
from app.services.payment_service import (
    handle_payment_succeeded,
    handle_payment_failed,
    handle_payment_refunded
)
from app.db.models.payment import Payment, PaymentStatus
from app.core.config import settings
import stripe
import uuid
from datetime import datetime

router = APIRouter()
stripe.api_key = settings.STRIPE_SECRET_KEY


@router.post("/create-intent")
async def create_payment_intent(payload: PaymentCreate, db: AsyncSession = Depends(get_db)):
    """
    ✅ Crée un PaymentIntent Stripe avec TOUTES les infos nécessaires stockées localement
    Plus besoin d'appels HTTP dans le webhook !
    """
    try:
        # 1️⃣ Validation : si virement, driver_payable doit être > 0
        if payload.chauffeur_payment_method == "virement" and payload.driver_payable <= 0:
            raise HTTPException(
                status_code=400, 
                detail="driver_payable doit être > 0 pour un paiement par virement"
            )
        
        # 2️⃣ Création PaymentIntent côté Stripe
        intent = stripe.PaymentIntent.create(
            amount=int(payload.amount * 100),  # Stripe demande les montants en CENTS
            currency=payload.currency.lower(),
            metadata={
                "user_id": str(payload.user_id),
                "trip_id": str(payload.trip_id),
                "booking_id": str(payload.booking_id),
                "chauffeur_payment_method": payload.chauffeur_payment_method,
            },
            description=f"Trajet {payload.trip_departure_city or '?'} → {payload.trip_destination_city or '?'}",
            automatic_payment_methods={"enabled": True},
        )

        # 3️⃣ Enregistrement local AVEC TOUTES LES INFOS DÉNORMALISÉES
        payment = Payment(
            id=uuid.uuid4(),
            user_id=payload.user_id,
            driver_id=payload.driver_id,
            trip_id=payload.trip_id,
            booking_id=payload.booking_id,
            amount=payload.amount,
            currency=payload.currency,
            fee=payload.fee,
            tax_rate=payload.tax_rate,
            tax_region=payload.tax_region,
            status=PaymentStatus.PENDING,
            payment_method=payload.payment_method,
            stripe_payment_intent_id=intent.id,
            
            # 🆕 DÉNORMALISATION : Infos du booking
            chauffeur_payment_method=payload.chauffeur_payment_method,
            driver_payable=payload.driver_payable,
            
            # 🆕 DÉNORMALISATION : Infos du trip
            trip_departure_city=payload.trip_departure_city,
            trip_destination_city=payload.trip_destination_city,
            trip_departure_date=payload.trip_departure_date,
            
            # 🆕 DÉNORMALISATION : Info passager
            passenger_name=payload.passenger_name,
        )
        
        db.add(payment)
        await db.commit()
        await db.refresh(payment)

        # 4️⃣ Retourne le client_secret pour initier la PaymentSheet
        return {
            "client_secret": intent.client_secret,
            "payment_id": str(payment.id)
        }

    except stripe.error.StripeError as e:
        print(f"❌ Erreur Stripe: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur Stripe: {str(e)}")
    
    except Exception as e:
        print(f"❌ Erreur création paiement: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# @router.post("/webhook")
# async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
#     """
#     Reçoit les événements envoyés par Stripe (paiement réussi, échec, remboursement…)
#     et met à jour le statut du paiement dans la base.
#     """
#     payload = await request.body()
#     sig_header = request.headers.get("stripe-signature")

#     try:
#         event = stripe.Webhook.construct_event(
#             payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
#         )
#     except stripe.error.SignatureVerificationError:
#         raise HTTPException(status_code=400, detail="Signature Stripe invalide")

#     # Gestion des événements selon leur type
#     event_type = event["type"]
#     data = event["data"]["object"]

#     if event_type == "payment_intent.succeeded":
#         await handle_payment_succeeded(data, db)

#     elif event_type == "payment_intent.payment_failed":
#         await handle_payment_failed(data, db)

#     elif event_type == "charge.refunded":
#         await handle_payment_refunded(data, db)

#     return {"status": "success"}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    🔔 Webhook Stripe : reçoit les événements officiels Stripe
    """
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    print("\n==============================")
    print("📩 Webhook Stripe reçu")
    print("==============================")
    print("Payload brut :", payload.decode("utf-8")[:300])  # affiche les 300 premiers caractères
    print("==============================\n")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
        )
        print("✅ Signature Stripe vérifiée.")
    except stripe.error.SignatureVerificationError:
        print("❌ Signature Stripe invalide — clé webhook incorrecte.")
        raise HTTPException(status_code=400, detail="Signature Stripe invalide")

    event_type = event["type"]
    data = event["data"]["object"]

    print(f"🎯 Type d'événement : {event_type}")

    # Gestion selon le type d'événement Stripe
    if event_type == "payment_intent.succeeded":
        print("💰 Paiement réussi détecté !")
        await handle_payment_succeeded(data, db)

    elif event_type == "payment_intent.payment_failed":
        print("❌ Paiement échoué détecté.")
        await handle_payment_failed(data, db)

    elif event_type == "charge.refunded":
        print("💸 Paiement remboursé détecté.")
        await handle_payment_refunded(data, db)

    else:
        print(f"⚠️ Événement ignoré : {event_type}")

    print("✅ Fin du traitement webhook.\n")
    return {"status": "success"}



