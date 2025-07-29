import asyncio
from logging.config import fileConfig
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import pool
from alembic import context
from dotenv import load_dotenv
import os

# Charger les variables d'environnement (.env)
load_dotenv()

# Configuration Alembic
config = context.config

# Lecture du fichier de config (alembic.ini)
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# URL de la base de données (doit commencer par postgresql+asyncpg)
DATABASE_URL = os.getenv("DATABASE_URL")
config.set_main_option("sqlalchemy.url", DATABASE_URL)

# Importer les modèles SQLAlchemy
from app.db.base import Base
from app.db.models.user import User
from app.db.models.car import Car
from app.db.models.user_code import UserCode

# Cible des métadonnées pour Alembic (autogenerate)
target_metadata = Base.metadata

# --- MIGRATIONS OFFLINE ---
def run_migrations_offline():
    """Exécuter les migrations en mode offline (sans DB réelle)."""
    context.configure(
        url=DATABASE_URL,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()

# --- MIGRATIONS ONLINE (ASYNC) ---
async def run_migrations_online():
    """Exécuter les migrations en mode online (asyncpg)."""
    connectable = create_async_engine(
        DATABASE_URL,
    
        
    )

    async with connectable.connect() as connection:
        await connection.run_sync(
            lambda sync_conn: context.configure(
                connection=sync_conn,
                target_metadata=target_metadata,
                compare_type=True,  # détecter les changements de types
            )
        )
        await connection.run_sync(lambda conn: context.run_migrations())

    await connectable.dispose()

# Lancer le bon mode
if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
