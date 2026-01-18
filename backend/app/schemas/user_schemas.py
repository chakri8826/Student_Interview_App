from pydantic import BaseModel, EmailStr, constr
from typing import Optional, List
from datetime import datetime

class CreateUser(BaseModel):
    name: constr(min_length=3, max_length=50)
    email: EmailStr
    password: constr(min_length=8, max_length=128)
    city: Optional[constr(max_length=50)] = None
    phone: Optional[constr(max_length=20)] = None
 
class LoginUser(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class RefreshRequest(BaseModel):
    pass

class UserProfileUpdate(BaseModel):
    full_name: Optional[constr(min_length=2, max_length=255)] = None
    phone: Optional[constr(max_length=20)] = None
    city: Optional[constr(max_length=100)] = None

class UserProfileResponse(BaseModel):
    user_id: int
    full_name: str
    phone: Optional[str]
    city: Optional[str]
    persona_id: Optional[int]
    created_at: datetime
    updated_at: datetime

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    phone: Optional[str]
    city: Optional[str]

class UserWithProfile(BaseModel):
    user: UserResponse
    profile: Optional[UserProfileResponse]
    wallet_balance: int


            
class TransactionResponse(BaseModel):
    id: int
    type: str
    credits: int
    amount_inr: Optional[float]
    currency: Optional[str]
    payment_gateway: Optional[str]
    status: str
    created_at: datetime

class WalletResponse(BaseModel):
    balance_credits: int
    last_transactions: List[TransactionResponse]
    updated_at: datetime
