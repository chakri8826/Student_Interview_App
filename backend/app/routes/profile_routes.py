from fastapi import  Depends, HTTPException, APIRouter
from typing import Annotated
from sqlalchemy.orm import Session
from app.models.user_model import User
from app.models.user_profiles_model import UserProfile
from app.models.activity_model import Activity
from app.schemas import (
    UserProfileUpdate, UserWithProfile
)
from app.dependencies import SessionDep, get_curr_user

router = APIRouter()

@router.get("/me", response_model=UserWithProfile)
def get_user_profile(current_user: Annotated[User, Depends(get_curr_user)], session: SessionDep):
    try:
        user_profile = session.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        wallet_balance = 0
        from app.models.wallet_model import Wallet
        wallet = session.query(Wallet).filter(Wallet.user_id == current_user.id).first()
        wallet_balance = wallet.balance_credits if wallet else 0
        user_data = {
            "id": current_user.id,
            "name": current_user.name,
            "email": current_user.email,
            "phone": current_user.phone,
            "city": current_user.city
        }
        profile_data = None
        if user_profile:
            profile_data = {
                "user_id": user_profile.user_id,
                "full_name": user_profile.full_name,
                "phone": user_profile.phone,
                "city": user_profile.city,
                "persona_id": user_profile.persona_id,
                "created_at": user_profile.created_at,
                "updated_at": user_profile.updated_at
            }
        return {"user": user_data, "profile": profile_data, "wallet_balance": wallet_balance}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get user profile: {str(e)}")

@router.put("/me/profile")
def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: Annotated[User, Depends(get_curr_user)],
    session: SessionDep
):
    try:
        user_profile = session.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
        if not user_profile:
            raise HTTPException(status_code=404, detail="User profile not found")
        if profile_data.full_name is not None:
            user_profile.full_name = profile_data.full_name
        if profile_data.phone is not None:
            user_profile.phone = profile_data.phone

            current_user.phone = profile_data.phone
        if profile_data.city is not None:
            user_profile.city = profile_data.city
             
            current_user.city = profile_data.city
        activity = Activity(user_id=current_user.id, kind="profile_update", ref_id=f"profile_update_{current_user.id}")
        session.add(activity)
        session.commit()
        return {"message": "Profile updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")


