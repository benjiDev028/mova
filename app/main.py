from fastapi import FastAPI
from app.db.database import Base, engine
from app.api.trip_route import router as trip_router



from fastapi.middleware.cors import CORSMiddleware

# Création des tables dans la base de données
Base.metadata.create_all(bind=engine)

# Initialisation de l'application FastAPI
app = FastAPI(title="register System API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permet l'accès depuis toutes les origines
    allow_credentials=True,
    allow_methods=["*"],  # Permet toutes les méthodes HTTP (GET, POST, etc.)
    allow_headers=["*"],  # Permet tous les headers
)

# Enregistrement des routes
app.include_router(trip_router, prefix="/tp", tags=["trips"])

