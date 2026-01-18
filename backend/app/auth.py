from datetime import datetime,timedelta,timezone
from jose import jwt,JWTError
from passlib.context import CryptContext
import os


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
REFRESH_SECRET_KEY = os.getenv("REFRESH_SECRET_KEY", SECRET_KEY)
REFRESH_ALGORITHM = os.getenv("REFRESH_ALGORITHM", ALGORITHM)


def create_access_token(data:dict,expires_delta:timedelta | None=None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp":expire})
    return jwt.encode(to_encode,SECRET_KEY,algorithm=ALGORITHM)

def decode_token(token:str):
    try:
        payload = jwt.decode(token,SECRET_KEY,algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def create_refresh_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(days=7))
    to_encode.update({"exp": expire, "typ": "refresh"})
    return jwt.encode(to_encode, REFRESH_SECRET_KEY, algorithm=REFRESH_ALGORITHM)

def decode_refresh_token(token: str):
    try:
        payload = jwt.decode(token, REFRESH_SECRET_KEY, algorithms=[REFRESH_ALGORITHM])
        if payload.get("typ") != "refresh":
            return None
        return payload
    except JWTError:
        return None


pwd_context = CryptContext(schemes=["bcrypt"],deprecated="auto")

def hash_password(password:str)->str:
    return pwd_context.hash(password)

def verify_password(plain:str,hashed:str) -> bool:
    return pwd_context.verify(plain,hashed)
