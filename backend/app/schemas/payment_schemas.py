from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from decimal import Decimal

class WalletResponse(BaseModel):
    balance_credits: int
    last_transactions: List['TransactionResponse']

class TransactionResponse(BaseModel):
    id: int
    user_id: int
    type: str
    credits: int
    amount_inr: Optional[Decimal]
    currency: str
    payment_gateway: Optional[str]
    external_ref: Optional[str]
    status: str
    created_at: datetime

class PaymentOrderRequest(BaseModel):
    pack_id: int

class PaymentOrderResponse(BaseModel):
    order_id: str
    amount: Decimal

class CreditPackResponse(BaseModel):
    id: int
    credits: int
    amount_inr: Decimal
    description: str
    is_active: bool

class TransactionListResponse(BaseModel):
    transactions: List[TransactionResponse]
    total: int





