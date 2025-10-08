import os
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context
from dotenv import load_dotenv

# 🧱 Import des modèles
from app.db.base import Base
from app.db.models.booking import Booking

# 🔄 Charger les variables d'environnement
load_dotenv()

# Charger la configuration Alembic
config = context.config

# 🧠 Lire l'URL asynchrone (celle utilisée par ton backend)
ASYNC_DATABASE_URL = os.getenv("DATABASE_URL")

if not ASYNC_DATABASE_URL:
    raise ValueError("❌ La variable DATABASE_URL n'est pas définie dans ton .env")

# ⚙️ Convertir l'URL async → sync pour Alembic
SYNC_DATABASE_URL = ASYNC_DATABASE_URL.replace("asyncpg", "psycopg2")

# Injecter l'URL dans Alembic (obligatoire)
config.set_main_option("sqlalchemy.url", SYNC_DATABASE_URL)

# Configurer le logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Métadonnées de tes modèles (pour la détection automatique)
target_metadata = Base.metadata


# -------------------------------------------------
# MODE OFFLINE
# -------------------------------------------------
def run_migrations_offline() -> None:
    """Exécute les migrations sans connexion DB (génère juste le SQL)."""
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )

    with context.begin_transaction():
        context.run_migrations()


# -------------------------------------------------
# MODE ONLINE
# -------------------------------------------------
def run_migrations_online() -> None:
    """Exécute les migrations avec connexion réelle (mode normal)."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)

        with context.begin_transaction():
            context.run_migrations()


# -------------------------------------------------
# Lancer la migration selon le mode
# -------------------------------------------------
if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
