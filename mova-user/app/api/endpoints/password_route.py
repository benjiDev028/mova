from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.schemas.user import UserResponse, UserResponseFind, UserUpdate
from typing import List
from app.db.models.user import User
from app.db.schemas.password import CodeResetPasswordRequest, UpdatePasswordRequest, ResetPasswordRequest
from app.services.user_service import get_user_by_email, get_user_by_id,get_users, update_user, delete_user
from app.services.password_service import send_reset_code_to_user,verify_code,update_user_code,update_user_password
from fastapi import FastAPI, HTTPException, Depends, Request
from starlette.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import verify_password
from uuid import UUID
import logging
from dotenv import load_dotenv
import os

router = APIRouter()
app = FastAPI()

# Configurer le logger
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)







@router.put("/reset-password-step1")
async def reset_password_step1(request :ResetPasswordRequest, db: AsyncSession = Depends(get_db)):
    """
    Envoie un code de réinitialisation de mot de passe à l'utilisateur.
    """
    user = await get_user_by_email(db,request.email)
    await send_reset_code_to_user(db,request.email)
    return JSONResponse(content={"message": "Code de réinitialisation envoyé avec succès."})

@router.put("/reset-password-step2")
async def reset_password_endpoint(
    user: CodeResetPasswordRequest, db: AsyncSession = Depends(get_db)
):
    """
    EndPoint pour Verifier le code 
    """
    
    db_user = await get_user_by_email(db, email=user.email)
    result = await verify_code(db, user.email, user.code)
    logger.info(f"Code de réinitialisation vérifié avec succès pour: {user.email}")
    return result

@router.put("/reset-password-step3")
async def reset_password_endpoint(
    user: UpdatePasswordRequest, db: AsyncSession = Depends(get_db)
):
    """
    EndPoint pour Reset le nouveau passé 
    """
    
    db_user = await get_user_by_email(db,user.email)

    result = await update_user_password(db, db_user.email, user.new_password)
        
    # result =  ResetPasswordRequest(email =user.email)
    logger.info(f"Mot de passe réinitialisé avec succès pour: {user.email}")
    return result
    