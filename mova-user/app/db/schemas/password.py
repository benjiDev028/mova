from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel

class ResetPasswordRequest(BaseModel):
    email: str  # L'email de l'utilisateur qui souhaite réinitialiser son mot de passe

class CodeResetPasswordRequest(BaseModel):
    code : str 
    email : str

class UpdatePasswordRequest(BaseModel):
    email: str  # Le token de réinitialisation envoyé par email
    new_password: str  # Le nouveau mot de passe

class PasswordUpdate(BaseModel):
    email: EmailStr
    old_password: str
    new_password: str

class PasswordResetRequest(BaseModel):
    email: str
 