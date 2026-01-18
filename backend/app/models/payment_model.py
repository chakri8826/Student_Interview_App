from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, JSON
from sqlalchemy.sql import func
from app.database import Base

class Payment(Base):
    __tablename__ = "payments"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(String(255), nullable=False)
    amount_inr = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(10), nullable=False)
    status = Column(String(50), nullable=False)
    method = Column(String(50), nullable=False)
    payload_json = Column(JSON, nullable=True)
    signature = Column(String(500), nullable=True)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    def __repr__(self):
        return f"<Payment(id={self.id}, user_id={self.user_id}, order_id='{self.order_id}', amount_inr={self.amount_inr}, status='{self.status}')>"