# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.payment_route import router as payment_router
from app.api.driver_earning_route import router as driver_earning_router

import asyncio
import logging

from app.db.base import Base 
from app.db.database import engine
from app.consumers.trip_consumer import  start_rabbitmq_consumer

app = FastAPI(title="Payment Service", version="1.0.0")

async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    await init_models()
    logging.info("🚀 Démarrage du consumer RabbitMQ...")
    asyncio.create_task(start_rabbitmq_consumer())
    logging.info("✅ Consumer RabbitMQ démarré avec succès.")


@app.get("/")
async def root():
    return {"message": "Payment Service en ligne ✅"}

app.include_router(payment_router, prefix="/payments", tags=["Payments"])
app.include_router(driver_earning_router, tags=["Driver Earnings"])
