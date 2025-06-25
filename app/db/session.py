import asyncpg
from fastapi import FastAPI
from typing import Callable
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

load_dotenv() 
DATABASE_URL= os.getenv("DATABASE_URL")



engine = create_engine(DATABASE_URL)
async def connect_to_db():
    return await asyncpg.connect(DATABASE_URL)

async def close_db_connection(connection):
    await connection.close()

def get_db() -> Callable:
    return connect_to_db
