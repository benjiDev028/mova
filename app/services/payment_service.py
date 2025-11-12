import stripe
from app.core.config import settings
from app.db.models.payment import Payment, PaymentStatus
from app.db.schemas.payment import PaymentCreate, PaymentResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from app.db.models.payment import Payment, PaymentStatus
from decimal import Decimal
from datetime import datetime
import logging
logger = logging.getLogger(__name__)



stripe.api_key = settings.STRIPE_SECRET_KEY  # Clé secrète Stripe

async def create_payment_intent_service(data: PaymentCreate, db: AsyncSession):
    """
    1️⃣ Crée une intention de paiement Stripe (PaymentIntent)
    2️⃣ Enregistre la transaction dans la base
    3️⃣ Retourne l'objet Payment (statut pending)
    """

    # 1️⃣ Étape : création du PaymentIntent Stripe
    try:
        intent = stripe.PaymentIntent.create(
            amount=int(data.amount * 100),   # Stripe utilise des CENTS (ex: 1000 = 10.00 CAD)
            currency=data.currency.lower(),
            metadata={
                "user_id": str(data.user_id),
                "trip_id": str(data.trip_id),
                "booking_id": str(data.booking_id),
            },
            automatic_payment_methods={"enabled": True}
        )
    except stripe.error.StripeError as e:
        raise Exception(f"Erreur Stripe : {e.user_message or str(e)}")

    # 2️⃣ Étape : créer une entrée dans la table Payment
    payment = Payment(
        user_id=data.user_id,
        driver_id=data.driver_id,
        trip_id=data.trip_id,
        booking_id=data.booking_id,
        amount=data.amount,
        currency=data.currency,
        fee=data.fee,
        tax_rate=data.tax_rate,
        tax_region=data.tax_region,
        status=PaymentStatus.PENDING,
        payment_method=data.payment_method,
        stripe_payment_intent_id=intent.id
    )

    db.add(payment)
    await db.commit()
    await db.refresh(payment)

    # 3️⃣ Étape : Retour de la réponse formatée
    return PaymentResponse.from_orm(payment)

# async def handle_payment_succeeded(data, db):
#     """
#     Met à jour un paiement en SUCCEEDED après confirmation Stripe
#     """
#     intent_id = data.get("id")
#     receipt_url = data.get("charges", {}).get("data", [{}])[0].get("receipt_url")

#     query = select(Payment).where(Payment.stripe_payment_intent_id == intent_id)
#     result = await db.execute(query)
#     payment = result.scalars().first()

#     if payment:
#         payment.status = PaymentStatus.SUCCEEDED
#         payment.stripe_receipt_url = receipt_url
#         await db.commit()
#         await db.refresh(payment)
#         print(f"✅ Paiement {intent_id} confirmé pour user {payment.user_id}")
#     else:
#         print(f"⚠️ Aucun paiement trouvé pour {intent_id}")


async def handle_payment_succeeded(data, db):
    """
    ✅ SIMPLIFIÉ : Toutes les infos sont déjà dans la table payments
    Plus besoin d'appels HTTP aux autres microservices !
    """
    from app.services.driver_earning_service import create_earning_after_payment
    
    intent_id = data.get("id")
    receipt_url = data.get("charges", {}).get("data", [{}])[0].get("receipt_url")

    # 1️⃣ Récupérer le paiement local
    query = select(Payment).where(Payment.stripe_payment_intent_id == intent_id)
    result = await db.execute(query)
    payment = result.scalars().first()

    if not payment:
        logger.warning(f"⚠️ Aucun paiement trouvé pour intent {intent_id}")
        return

    # 2️⃣ Mettre à jour le statut
    payment.status = PaymentStatus.SUCCEEDED
    payment.stripe_receipt_url = receipt_url
    payment.updated_at = datetime.utcnow()
    
    logger.info(f"✅ Paiement {intent_id} marqué SUCCEEDED")
    
    # 3️⃣ CONDITION : Créer earning seulement si virement
    if payment.chauffeur_payment_method == "virement" and payment.driver_payable and payment.driver_payable > 0:
        
        # Construire la route
        route = "Trajet"
        if payment.trip_departure_city and payment.trip_destination_city:
            route = f"{payment.trip_departure_city} → {payment.trip_destination_city}"
        
        # Date du trip (ou date actuelle si manquante)
        trip_date = payment.trip_departure_date or datetime.utcnow()
        
        # Nom du passager (ou fallback)
        passenger_name = payment.passenger_name or f"User {payment.user_id}"
        
        # ✅ CRÉER L'EARNING (aucun appel HTTP nécessaire !)
        try:
            await create_earning_after_payment(
                db=db,
                driver_id=payment.driver_id,
                booking_id=payment.booking_id,
                trip_id=payment.trip_id,
                amount=Decimal(str(payment.driver_payable)),
                trip_date=trip_date,
                passenger_name=passenger_name,
                route=route
            )
            logger.info(f"💰 Earning créé : {payment.driver_payable} CAD pour driver {payment.driver_id}")
        
        except Exception as e:
            logger.error(f"❌ Erreur création earning: {e}")
            # On continue quand même pour commit le payment
    
    elif payment.chauffeur_payment_method == "cash":
        logger.info(f"💵 Paiement cash détecté - pas d'earning créé (chauffeur reçoit directement)")
    
    else:
        logger.warning(f"⚠️ Pas de driver_payable ou méthode inconnue pour payment {payment.id}")
    
    # 4️⃣ Commit final
    await db.commit()
    await db.refresh(payment)
    
    logger.info(f"✅ Traitement webhook terminé pour {intent_id}")

# async def handle_payment_failed(data, db):
#     """
#     Marque un paiement comme échoué
#     """
#     intent_id = data.get("id")

#     query = select(Payment).where(Payment.stripe_payment_intent_id == intent_id)
#     result = await db.execute(query)
#     payment = result.scalars().first()

#     if payment:
#         payment.status = PaymentStatus.FAILED
#         await db.commit()
#         print(f"❌ Paiement échoué {intent_id}")
#     else:
#         print(f"⚠️ Aucun paiement trouvé pour {intent_id}")

async def handle_payment_failed(data, db):
    """
    Marque un paiement comme échoué
    """
    intent_id = data.get("id")

    query = select(Payment).where(Payment.stripe_payment_intent_id == intent_id)
    result = await db.execute(query)
    payment = result.scalars().first()

    if payment:
        payment.status = PaymentStatus.FAILED
        payment.updated_at = datetime.utcnow()
        await db.commit()
        logger.warning(f"❌ Paiement échoué {intent_id}")
    else:
        logger.warning(f"⚠️ Aucun paiement trouvé pour {intent_id}")


async def handle_payment_refunded(data, db):
    """
    Gère un remboursement (Stripe → refund)
    """
    charge_id = data.get("id")
    
    # Note: charge_id != payment_intent_id, il faut chercher par payment_intent
    payment_intent_id = data.get("payment_intent")
    
    if not payment_intent_id:
        logger.error(f"❌ Pas de payment_intent_id dans l'event refund")
        return
    
    query = select(Payment).where(Payment.stripe_payment_intent_id == payment_intent_id)
    result = await db.execute(query)
    payment = result.scalars().first()

    if payment:
        payment.status = PaymentStatus.REFUNDED
        payment.updated_at = datetime.utcnow()
        await db.commit()
        logger.info(f"💸 Paiement remboursé {payment_intent_id}")
        
        # TODO: Gérer l'earning associé (le marquer comme refunded aussi)
    else:
        logger.warning(f"⚠️ Aucun paiement trouvé pour {payment_intent_id}")

async def handle_payment_refunded(data, db):
    """
    Gère un remboursement (Stripe → refund)
    """
    charge_id = data.get("id")
    query = select(Payment).where(Payment.stripe_payment_intent_id == charge_id)
    result = await db.execute(query)
    payment = result.scalars().first()

    if payment:
        payment.status = PaymentStatus.REFUNDED
        await db.commit()
        print(f"💸 Paiement remboursé {charge_id}")
