from pydantic import BaseModel, EmailStr
from datetime import datetime
from uuid import UUID



class UserLogin(BaseModel):
    email: EmailStr
    password: str
class RefreshToken(BaseModel):
    refresh_token : str