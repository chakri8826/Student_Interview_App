from fastapi import APIRouter, HTTPException, Depends
from typing import Annotated, List
from sqlalchemy.orm import Session
from app.dependencies import SessionDep, get_curr_user
from app.models.user_model import User
from app.models.transaction_model import Transaction
from app.models.screening_model import Screening
from app.models.interview_model import Interview
from app.models.user_role_selection_model import UserRoleSelection
from app.models.cv_model import CV

router = APIRouter()

@router.get("/activities")
def get_recent_activities(current_user: Annotated[User, Depends(get_curr_user)], session: SessionDep, limit: int = 20):
    try:
        items = []
        # Transactions
        for t in session.query(Transaction).filter(Transaction.user_id == current_user.id).all():
            items.append({
                "type": f"transaction_{t.type}",
                "message": f"{t.type.capitalize()} {t.credits} credits",
                "created_at": t.created_at,
            })
        # Screenings
        for s in session.query(Screening).filter(Screening.user_id == current_user.id).all():
            items.append({
                "type": "screening",
                "message": f"CV screening {s.status}",
                "created_at": s.created_at,
            })
        # Interviews
        for iv in session.query(Interview).filter(Interview.user_id == current_user.id).all():
            items.append({
                "type": "interview",
                "message": f"Interview {iv.status}",
                "created_at": iv.created_at,
            })
        # Role selections
        for rs in session.query(UserRoleSelection).filter(UserRoleSelection.user_id == current_user.id).all():
            items.append({
                "type": "role_selection",
                "message": "Updated role selection",
                "created_at": rs.created_at,
            })
        # CV uploads
        for cv in session.query(CV).filter(CV.user_id == current_user.id).all():
            items.append({
                "type": "cv_upload",
                "message": f"Uploaded CV {cv.filename}",
                "created_at": cv.created_at,
            })

        # Sort by created_at desc and cap limit
        items.sort(key=lambda x: x["created_at"] or 0, reverse=True)
        return {"activities": items[:limit]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get activities: {str(e)}")
