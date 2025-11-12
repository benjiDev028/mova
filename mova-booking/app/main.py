from fastapi import FastAPI
from app.db.database import Base, engine
from app.api.booking_route import router as booking_router



from fastapi.middleware.cors import CORSMiddleware

# Création des tables dans la base de données

async def init_models():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Base de données initialisée avec succès.")

# Initialisation de l'application FastAPI
app = FastAPI(title="booking System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permet l'accès depuis toutes les origines
    allow_credentials=True,
    allow_methods=["*"],  # Permet toutes les méthodes HTTP (GET, POST, etc.)
    allow_headers=["*"],  # Permet tous les headers
)

# Enregistrement des routes
app.include_router(booking_router, prefix="/bk", tags=["bookings"])

