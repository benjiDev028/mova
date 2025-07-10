from fastapi import FastAPI
from app.db.database import Base, engine
from app.api.endpoints.register_route import router as register_router
from app.api.endpoints.user_routes import router as user_router
from app.api.endpoints.password_route import router as password_router
from app.api.endpoints.auth_route import router as auth_router
from app.api.endpoints.car_route import router as car_router



from fastapi.middleware.cors import CORSMiddleware

# Création des tables dans la base de données


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
app.include_router(register_router, prefix="/identity", tags=["Register"])
app.include_router(user_router, prefix="/identity", tags=["Users"])
app.include_router(password_router, prefix="/identity", tags=["Password"])
app.include_router(auth_router, prefix="/identity", tags=["Auth"])
app.include_router(car_router, prefix="/identity", tags=["Car"])

