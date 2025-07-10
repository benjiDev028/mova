from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

DATABASE_URL = settings.DATABASE_URL

# ✅ Créer un moteur async avec pool étendu
engine = create_async_engine(
    DATABASE_URL,
    pool_size=20,        # ← augmente le nombre de connexions simultanées
    max_overflow=50,     # ← tolérance temporaire supplémentaire
    pool_timeout=30,     # ← temps max pour attendre une connexion
    echo=False           # ← mets à True pour debug SQL
)

# ✅ Créer une session async
async_session = sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
    autocommit=False,
)

# ✅ Base des modèles
Base = declarative_base()

# ✅ Dépendance pour FastAPI (async)
async def get_db():
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()





# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker
# from sqlalchemy import create_engine
# from app.core.config import settings


# engine = create_engine(settings.DATABASE_URL,pool_size=10,
#     max_overflow=20)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
# Base = declarative_base()

# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()
