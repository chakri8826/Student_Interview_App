from sqlalchemy import Column, Integer, String, Index
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(128), nullable=False)
    phone = Column(String(20), nullable=True)
    city = Column(String(50), nullable=True)
    
    def __repr__(self):
        return f"<User(id={self.id}, name='{self.name}', email='{self.email}')>"

__table_args__ = (
    Index('ix_users_email', 'email'),
)