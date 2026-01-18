from fastapi import  Depends, HTTPException, APIRouter, Request
from typing import Annotated, List
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from app.models.user_model import User
from app.models.user_profiles_model import UserProfile
from app.models.wallet_model import Wallet
from app.models.activity_model import Activity
from app.models.role_model import Role
from app.models.user_role_selection_model import UserRoleSelection
from app.models.transaction_model import Transaction
from app.auth import create_access_token, create_refresh_token, decode_refresh_token, hash_password, verify_password
from app.schemas import (
    CreateUser, Token, WalletResponse, RefreshRequest
)
from fastapi.responses import Response
import json
from app.dependencies import SessionDep, get_curr_user
from datetime import timedelta
from google.auth.transport import requests as google_requests
from authlib.integrations.starlette_client import OAuth
import os
import httpx
import secrets
import string

router = APIRouter()

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET")
GOOGLE_REDIRECT_URI = os.getenv("GOOGLE_REDIRECT_URI")

LINKEDIN_CLIENT_ID = os.getenv("LINKEDIN_CLIENT_ID")
LINKEDIN_CLIENT_SECRET = os.getenv("LINKEDIN_CLIENT_SECRET")
LINKEDIN_REDIRECT_URI = os.getenv("LINKEDIN_REDIRECT_URI")

MICROSOFT_CLIENT_ID = os.getenv("MICROSOFT_CLIENT_ID")
MICROSOFT_CLIENT_SECRET = os.getenv("MICROSOFT_CLIENT_SECRET")
MICROSOFT_REDIRECT_URI = os.getenv("MICROSOFT_REDIRECT_URI")
MICROSOFT_TENANT_ID = os.getenv("MICROSOFT_TENANT_ID", "common") 

ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 30))
FRONTEND_URL = os.getenv("FRONTEND_URL")

oauth = OAuth()

oauth.register(
    name='google',
    client_id=GOOGLE_CLIENT_ID,
    client_secret=GOOGLE_CLIENT_SECRET,
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration',
    client_kwargs={'scope': 'openid email profile'}
)

oauth.register(
    name='linkedin',
    client_id=os.getenv('LINKEDIN_CLIENT_ID'),
    client_secret=os.getenv('LINKEDIN_CLIENT_SECRET'),
    access_token_url='https://www.linkedin.com/oauth/v2/accessToken',
    authorize_url='https://www.linkedin.com/oauth/v2/authorization',
    api_base_url='https://api.linkedin.com/v2/',
    client_kwargs={
        'scope': 'openid profile email',
        'token_endpoint_auth_method': 'client_secret_post'
    }
)

oauth.register(
    name='microsoft',
    client_id=MICROSOFT_CLIENT_ID,
    client_secret=MICROSOFT_CLIENT_SECRET,
    access_token_url=f'https://login.microsoftonline.com/{MICROSOFT_TENANT_ID}/oauth2/v2.0/token',
    authorize_url=f'https://login.microsoftonline.com/{MICROSOFT_TENANT_ID}/oauth2/v2.0/authorize',
    api_base_url='https://graph.microsoft.com/v1.0/',
    client_kwargs={
        'scope': 'openid email profile User.Read',
        'response_type': 'code'
    }
)

def create_complete_user_setup(session: Session, user: User) -> None:
    try:
        user_profile = UserProfile(
            user_id=user.id,
            full_name=user.name,
            phone=user.phone,
            city=user.city
        )
        session.add(user_profile)
        wallet = Wallet(user_id=user.id, balance_credits=0)
        session.add(wallet)
        activity = Activity(
            user_id=user.id,
            kind="profile_update",
            ref_id=f"user_registration_{user.id}"
        )
        session.add(activity)
        session.commit()
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create user setup: {str(e)}")


def _issue_tokens_response(session: Session, user: User) -> Response:
    expire = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access = create_access_token(data={"sub": user.email}, expires_delta=expire)
    refresh = create_refresh_token(data={"sub": user.email})
     
    user.refresh_token = refresh
    session.add(user)
    session.commit()

    response_data = {"access_token": access, "token_type": "bearer"}
    response = Response(content=json.dumps(response_data), media_type="application/json")
    response.set_cookie(
        key="refresh_token",
        value=refresh,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=7 * 24 * 60 * 60,
        path="/api/v1/auth/refresh"
    )
    return response

def _issue_tokens_data(session: Session, user: User) -> dict:
    """Helper function to get token data for OAuth redirects"""
    expire = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access = create_access_token(data={"sub": user.email}, expires_delta=expire)
    refresh = create_refresh_token(data={"sub": user.email})
    
    user.refresh_token = refresh
    session.add(user)
    session.commit()
    return {"access_token": access, "token_type": "bearer"}

@router.get("/google")
async def login_google(request: Request):
    return await oauth.google.authorize_redirect(request, redirect_uri=GOOGLE_REDIRECT_URI)

@router.get("/google-login")
async def google_login(request: Request, session: SessionDep):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not found")
    try:
        token_url = "https://oauth2.googleapis.com/token"
        token_data = {
            "client_id": os.getenv("GOOGLE_CLIENT_ID"),
            "client_secret": os.getenv("GOOGLE_CLIENT_SECRET"),
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": os.getenv("GOOGLE_REDIRECT_URI")
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=token_data)
            tokens = response.json()
        if "access_token" not in tokens:
            raise HTTPException(status_code=400, detail="Failed to get access token")
        user_info_url = "https://www.googleapis.com/oauth2/v2/userinfo"
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        async with httpx.AsyncClient() as client:
            user_response = await client.get(user_info_url, headers=headers)
            user_data = user_response.json()
        existing_user = session.query(User).filter(User.email == user_data["email"]).first()
        if existing_user:
            tokens = _issue_tokens_data(session, existing_user)
             
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            return RedirectResponse(
                url=f"{frontend_url}/auth/callback?token={tokens['access_token']}&name={user_data.get('name', 'User')}"
            )
        else:
            random_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
            hashed_password = hash_password(random_password)
            new_user = User(
                name=user_data.get("name", "Google User"),
                email=user_data["email"],
                password=hashed_password,
                city=None
            )
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
            create_complete_user_setup(session, new_user)
            tokens = _issue_tokens_data(session, new_user)
             
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            return RedirectResponse(
                url=f"{frontend_url}/auth/callback?token={tokens['access_token']}&name={user_data.get('name', 'User')}"
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Login failed: {str(e)}")

@router.get("/linkedin")
async def login_linkedin(request: Request):
    return await oauth.linkedin.authorize_redirect(request, redirect_uri=LINKEDIN_REDIRECT_URI)

@router.get("/linkedin-login")
async def linkedin_login(request: Request, session: SessionDep):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not found")
    try:
        token_url = "https://www.linkedin.com/oauth/v2/accessToken"
        token_data = {
            "grant_type": "authorization_code",
            "code": code,
            "client_id": os.getenv("LINKEDIN_CLIENT_ID"),
            "client_secret": os.getenv("LINKEDIN_CLIENT_SECRET"),
            "redirect_uri": os.getenv("LINKEDIN_REDIRECT_URI")
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=token_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Token exchange failed: {response.text}")
            tokens = response.json()
        if "access_token" not in tokens:
            error_desc = tokens.get("error_description", "Unknown error")
            raise HTTPException(status_code=400, detail=f"Failed to get access token: {error_desc}")
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        user_data = None
        async with httpx.AsyncClient() as client:
            user_response = await client.get("https://api.linkedin.com/v2/userinfo", headers=headers)
            if user_response.status_code == 200:
                user_data = user_response.json()
            else:
                profile_response = await client.get("https://api.linkedin.com/v2/people/~?projection=(id,firstName,lastName)", headers=headers)
                email_response = await client.get("https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))", headers=headers)
                if profile_response.status_code != 200:
                    raise HTTPException(status_code=400, detail=f"Failed to get user profile: {profile_response.text}")
                profile_data = profile_response.json()
                user_email = None
                if email_response.status_code == 200:
                    email_data = email_response.json()
                    elements = email_data.get("elements", [])
                    if elements:
                        user_email = elements[0].get("handle~", {}).get("emailAddress")
                if not user_email:
                    raise HTTPException(status_code=400, detail="Could not retrieve email from LinkedIn")
                first_name_data = profile_data.get("firstName", {}).get("localized", {})
                last_name_data = profile_data.get("lastName", {}).get("localized", {})
                first_name = list(first_name_data.values())[0] if first_name_data else ""
                last_name = list(last_name_data.values())[0] if last_name_data else ""
                full_name = f"{first_name} {last_name}".strip()
                user_data = {"email": user_email, "name": full_name, "given_name": first_name, "family_name": last_name}
        if not user_data or not user_data.get("email"):
            raise HTTPException(status_code=400, detail="Could not retrieve user data from LinkedIn")
        existing_user = session.query(User).filter(User.email == user_data["email"]).first()
        if existing_user:
            tokens = _issue_tokens_data(session, existing_user)
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            return RedirectResponse(
                url=f"{frontend_url}/auth/callback?token={tokens['access_token']}&name={user_data.get('name', 'User')}"
            )
        else:
            random_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
            hashed_password = hash_password(random_password)
            user_name = user_data.get("name") or f"{user_data.get('given_name', '')} {user_data.get('family_name', '')}".strip()
            if not user_name:
                user_name = "LinkedIn User"
            new_user = User(name=user_name, email=user_data["email"], password=hashed_password, city=None)
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
            create_complete_user_setup(session, new_user)
            tokens = _issue_tokens_data(session, new_user)
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            return RedirectResponse(
                url=f"{frontend_url}/auth/callback?token={tokens['access_token']}&name={user_name}"
            )
    except HTTPException:
        raise  
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Login failed: {str(e)}")

@router.get("/microsoft")
async def login_microsoft(request: Request):
    return await oauth.microsoft.authorize_redirect(request, redirect_uri=MICROSOFT_REDIRECT_URI)

@router.get("/microsoft-login")
async def microsoft_login(request: Request, session: SessionDep):
    code = request.query_params.get("code")
    if not code:
        raise HTTPException(status_code=400, detail="Authorization code not found")
    try:
        token_url = f"https://login.microsoftonline.com/{MICROSOFT_TENANT_ID}/oauth2/v2.0/token"
        token_data = {
            "client_id": MICROSOFT_CLIENT_ID,
            "client_secret": MICROSOFT_CLIENT_SECRET,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": MICROSOFT_REDIRECT_URI,
            "scope": "https://graph.microsoft.com/User.Read"
        }
        async with httpx.AsyncClient() as client:
            response = await client.post(token_url, data=token_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
            if response.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Token exchange failed: {response.text}")
            tokens = response.json()
        if "access_token" not in tokens:
            error_desc = tokens.get("error_description", "Unknown error")
            raise HTTPException(status_code=400, detail=f"Failed to get access token: {error_desc}")
        user_info_url = "https://graph.microsoft.com/v1.0/me"
        headers = {"Authorization": f"Bearer {tokens['access_token']}"}
        async with httpx.AsyncClient() as client:
            user_response = await client.get(user_info_url, headers=headers)
            if user_response.status_code != 200:
                raise HTTPException(status_code=400, detail=f"Failed to get user info: {user_response.text}")
            user_data = user_response.json()
        if not user_data.get("mail") and not user_data.get("userPrincipalName"):
            raise HTTPException(status_code=400, detail="Could not retrieve email from Microsoft")
        user_email = user_data.get("mail") or user_data.get("userPrincipalName")
        user_name = user_data.get("displayName", "Microsoft User")
        existing_user = session.query(User).filter(User.email == user_email).first()
        if existing_user:
            tokens = _issue_tokens_data(session, existing_user)
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            return RedirectResponse(
                url=f"{frontend_url}/auth/callback?token={tokens['access_token']}&name={user_name}"
            )
        else:
            random_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
            hashed_password = hash_password(random_password)
            new_user = User(name=user_name, email=user_email, password=hashed_password, city=None)
            session.add(new_user)
            session.commit()
            session.refresh(new_user)
            create_complete_user_setup(session, new_user)
            tokens = _issue_tokens_data(session, new_user)
            frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
            return RedirectResponse(
                url=f"{frontend_url}/auth/callback?token={tokens['access_token']}&name={user_name}"
            )
    except HTTPException:
        raise  
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Login failed: {str(e)}")

@router.post("/register")
def register(session: SessionDep, user_data: CreateUser):  
    if session.query(User).filter(User.email == user_data.email).first():     
        raise HTTPException(status_code=400, detail="Email is already registered")
    hash_pwd = hash_password(user_data.password)
    user = User(name=user_data.name, email=user_data.email, password=hash_pwd, phone=user_data.phone, city=user_data.city)
    session.add(user)
    session.commit()
    session.refresh(user)
    create_complete_user_setup(session, user)
    return _issue_tokens_response(session, user)

@router.post("/login", response_model=Token)
def login(session: SessionDep, form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = session.query(User).filter(User.email == form_data.username).first()
    if not user:
        raise HTTPException(status_code=404, detail="Invalid Credentials")
    pwd = verify_password(form_data.password, user.password)
    if not pwd:
        raise HTTPException(status_code=404, detail="Invalid Credentials")
    return _issue_tokens_response(session, user)

@router.post("/refresh", response_model=Token)
def refresh_token(request: Request, session: SessionDep):
    refresh_token_cookie = request.cookies.get("refresh_token")
    if not refresh_token_cookie:
        raise HTTPException(status_code=401, detail="Refresh token not found")
    decoded = decode_refresh_token(refresh_token_cookie)
    if not decoded or not decoded.get("sub"):
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    user = session.query(User).filter(User.email == decoded["sub"]).first()
    if not user or not user.refresh_token:
        raise HTTPException(status_code=403, detail="Refresh token invalid or revoked")
    if user.refresh_token != refresh_token_cookie:
        raise HTTPException(status_code=403, detail="Refresh token mismatch")
    return _issue_tokens_response(session, user)

@router.post("/logout")
def logout(request: Request, session: SessionDep):
    refresh_token_cookie = request.cookies.get("refresh_token")
    user = None
    if refresh_token_cookie:
        decoded = decode_refresh_token(refresh_token_cookie)
        if decoded and decoded.get("sub"):
            user = session.query(User).filter(User.email == decoded["sub"]).first()
    if user:
        user.refresh_token = None
        session.add(user)
        session.commit()
    response = Response(content=json.dumps({"message": "Logged out"}), media_type="application/json")
    response.delete_cookie(
        key="refresh_token",
        path="/api/v1/auth/refresh"
    )
    return response
