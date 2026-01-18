from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Index
from sqlalchemy.sql import func
from app.database import Base

class Transaction(Base):
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    type = Column(String(50), nullable=False)
    credits = Column(Integer, nullable=False)
    amount_inr = Column(Numeric(10, 2), nullable=True)
    currency = Column(String(10), nullable=True)
    payment_gateway = Column(String(50), nullable=True)
    external_ref = Column(String(255), nullable=True)
    status = Column(String(50), nullable=False)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Transaction(id={self.id}, user_id={self.user_id}, type='{self.type}', credits={self.credits}, status='{self.status}')>"

__table_args__ = (
    Index('ix_transactions_user_id_created_at', 'user_id', 'created_at'),
)
