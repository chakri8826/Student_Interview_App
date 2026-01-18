from fastapi import Depends, HTTPException, APIRouter
from typing import Annotated
from sqlalchemy.orm import Session
from app.models.user_model import User
from app.models.wallet_model import Wallet
from app.models.transaction_model import Transaction
from app.models.payment_model import Payment
from app.schemas import (
    PaymentWalletResponse, PaymentTransactionResponse, PaymentOrderRequest,
    PaymentOrderResponse, TransactionListResponse
)
from app.dependencies import SessionDep, get_curr_user
from decimal import Decimal

router = APIRouter()

CREDIT_PACKS = {
    1: {"credits": 10, "amount_inr": Decimal("100.00"), "description": "10 Credits Pack"},
    2: {"credits": 25, "amount_inr": Decimal("225.00"), "description": "25 Credits Pack"},
    3: {"credits": 50, "amount_inr": Decimal("400.00"), "description": "50 Credits Pack"},
    4: {"credits": 100, "amount_inr": Decimal("750.00"), "description": "100 Credits Pack"},
}

def get_or_create_wallet(user_id: int, session: Session) -> Wallet:
    wallet = session.query(Wallet).filter(Wallet.user_id == user_id).first()
    if not wallet:
        wallet = Wallet(user_id=user_id, balance_credits=0)
        session.add(wallet)
        session.commit()
        session.refresh(wallet)
    return wallet

@router.get("/wallet", response_model=PaymentWalletResponse)
def get_wallet(
    current_user: Annotated[User, Depends(get_curr_user)],
    session: SessionDep
):
    try:
        wallet = get_or_create_wallet(current_user.id, session)
        
        transactions = session.query(Transaction).filter(
            Transaction.user_id == current_user.id
        ).order_by(Transaction.created_at.desc()).limit(5).all()
        
        transaction_responses = [
            PaymentTransactionResponse(
                id=t.id,
                user_id=t.user_id,
                type=t.type,
                credits=t.credits,
                amount_inr=t.amount_inr,
                currency=t.currency,
                payment_gateway=t.payment_gateway,
                external_ref=t.external_ref,
                status=t.status,
                created_at=t.created_at
            )
            for t in transactions
        ]
        
        return PaymentWalletResponse(
            balance_credits=wallet.balance_credits,
            last_transactions=transaction_responses
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get wallet: {str(e)}")

@router.post("/payments/order", response_model=PaymentOrderResponse)
def create_payment_order(
    order_data: PaymentOrderRequest,
    current_user: Annotated[User, Depends(get_curr_user)],
    session: SessionDep
):
    try:
        if order_data.pack_id not in CREDIT_PACKS:
            raise HTTPException(status_code=400, detail="Invalid credit pack")
        pack = CREDIT_PACKS[order_data.pack_id]
        import uuid
        order_id = f"order_{uuid.uuid4().hex[:16]}"
        payment = Payment(
            user_id=current_user.id,
            order_id=order_id,
            amount_inr=pack["amount_inr"],
            currency="INR",
            status="created",
            method="direct",
            payload_json={"pack_id": order_data.pack_id, "credits": pack["credits"]}
        )
        session.add(payment)
        session.commit()
        session.refresh(payment)
        wallet = get_or_create_wallet(current_user.id, session)
        wallet.balance_credits += int(pack["credits"])
        session.add(wallet)
        from app.models.transaction_model import Transaction
        transaction = Transaction(
            user_id=current_user.id,
            type="purchase",
            credits=int(pack["credits"]),
            amount_inr=pack["amount_inr"],
            currency="INR",
            payment_gateway="credit_pack",
            external_ref=order_id,
            status="success"
        )
        session.add(transaction)
        payment.status = "success"
        session.commit()
        print(f"DEBUG WALLET: user={wallet.user_id} credits={wallet.balance_credits}")
        return PaymentOrderResponse(
            order_id=order_id,
            amount=pack["amount_inr"]
        )
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create payment order: {str(e)}")

@router.get("/transactions", response_model=TransactionListResponse)
def get_transactions(
    current_user: Annotated[User, Depends(get_curr_user)],
    session: SessionDep,
    skip: int = 0,
    limit: int = 10
):
    try:
        total = session.query(Transaction).filter(
            Transaction.user_id == current_user.id
        ).count()
        
        transactions = session.query(Transaction).filter(
            Transaction.user_id == current_user.id
        ).order_by(Transaction.created_at.desc()).offset(skip).limit(limit).all()
        
        transaction_responses = [
            PaymentTransactionResponse(
                id=t.id,
                user_id=t.user_id,
                type=t.type,
                credits=t.credits,
                amount_inr=t.amount_inr,
                currency=t.currency,
                payment_gateway=t.payment_gateway,
                external_ref=t.external_ref,
                status=t.status,
                created_at=t.created_at
            )
            for t in transactions
        ]
        
        return TransactionListResponse(
            transactions=transaction_responses,
            total=total
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get transactions: {str(e)}")

