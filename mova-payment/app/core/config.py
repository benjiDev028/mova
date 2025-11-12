from pydantic_settings import BaseSettings

from dotenv import load_dotenv
import os

load_dotenv()

class Settings(BaseSettings):
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    STRIPE_SECRET_KEY: str = os.getenv("STRIPE_SECRET_KEY")
    STRIPE_WEBHOOK_SECRET: str = os.getenv("STRIPE_WEBHOOK_SECRET")
    RABBITMQ_URL: str = os.getenv("RABBITMQ_URL")   
    
    

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
