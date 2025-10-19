import asyncio
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import Base, engine
from app.api.trip_route import router as trip_router
from app.consumers.rabbitmq_consumer import start_rabbitmq_consumer

# Création tables (sync)
async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

app = FastAPI(title="MoVa Trip Service", version="1.0.0")

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
    return {"message": "Trip service en ligne ✅"}

app.include_router(trip_router, prefix="/tp", tags=["trips"])
