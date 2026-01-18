from fastapi import APIRouter, HTTPException, Depends, Request
from typing import Annotated, Optional
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
import requests
from requests import HTTPError

from app.dependencies import SessionDep, get_curr_user
from app.models.user_model import User
from app.models.wallet_model import Wallet
from app.models.transaction_model import Transaction
from app.models.interview_model import Interview
from app.models.role_model import Role
from app.models.user_role_selection_model import UserRoleSelection

router = APIRouter()

TAVUS_API_KEY = os.getenv("TAVUS_API_KEY")
TAVUS_BASE_URL = os.getenv("TAVUS_BASE_URL", "https://tavusapi.com")
WEBHOOK_BASE_URL = os.getenv("WEBHOOK_BASE_URL")

TAVUS_REPLICA_DEFAULT = os.getenv("TAVUS_REPLICA_DEFAULT")
TAVUS_PERSONA_DEFAULT = os.getenv("TAVUS_PERSONA_DEFAULT")

TAVUS_REPLICA_SOFTWARE = os.getenv("TAVUS_REPLICA_SOFTWARE")
TAVUS_PERSONA_SOFTWARE = os.getenv("TAVUS_PERSONA_SOFTWARE")
TAVUS_REPLICA_DATA = os.getenv("TAVUS_REPLICA_DATA")
TAVUS_PERSONA_DATA = os.getenv("TAVUS_PERSONA_DATA")
TAVUS_REPLICA_SECURITY = os.getenv("TAVUS_REPLICA_SECURITY")
TAVUS_PERSONA_SECURITY = os.getenv("TAVUS_PERSONA_SECURITY")

class StartInterviewRequest(BaseModel):
    role_id: int
    cv_id: Optional[int] = None

class StartInterviewResponse(BaseModel):
    id: int
    join_url: Optional[str] = None


def resolve_tavus_profile_for_role(session: Session, role_id: int) -> tuple[str, str]:
    role = session.query(Role).filter(Role.id == role_id).first()
    role_name = (getattr(role, 'title', None) or '').lower()
    if "software" in role_name or "engineer" in role_name:
        replica = TAVUS_REPLICA_SOFTWARE or TAVUS_REPLICA_DEFAULT
        persona = TAVUS_PERSONA_SOFTWARE or TAVUS_PERSONA_DEFAULT
    elif "data" in role_name or "analyst" in role_name:
        replica = TAVUS_REPLICA_DATA or TAVUS_REPLICA_DEFAULT
        persona = TAVUS_PERSONA_DATA or TAVUS_PERSONA_DEFAULT
    elif "security" in role_name or "cyber" in role_name:
        replica = TAVUS_REPLICA_SECURITY or TAVUS_REPLICA_DEFAULT
        persona = TAVUS_PERSONA_SECURITY or TAVUS_PERSONA_DEFAULT
    else:
        replica = TAVUS_REPLICA_DEFAULT
        persona = TAVUS_PERSONA_DEFAULT
    if not replica or not persona:
        raise HTTPException(status_code=500, detail="Tavus replica/persona not configured. Set TAVUS_REPLICA_DEFAULT and TAVUS_PERSONA_DEFAULT in .env")
    return replica, persona

@router.post("/start", response_model=StartInterviewResponse)
def start_interview(
    body: StartInterviewRequest,
    current_user: Annotated[User, Depends(get_curr_user)],
    session: SessionDep
):
    try:
        wallet = session.query(Wallet).filter(Wallet.user_id == current_user.id).first()
        if not wallet or wallet.balance_credits < 5:
            raise HTTPException(status_code=400, detail="Insufficient credits")

        wallet.balance_credits -= 5
        session.add(wallet)

        interview = Interview(
            user_id=current_user.id,
            role_id=body.role_id,
            cv_id=body.cv_id,
            status="in_progress",
            credits_used=5,
        )
        session.add(interview)
        session.commit()
        session.refresh(interview)

        transaction = Transaction(
            user_id=current_user.id,
            type="purchase",
            credits=5,
            amount_inr=None,
            currency="INR",
            payment_gateway="tavus",
            external_ref=str(interview.id),
            status="success",
        )
        session.add(transaction)
        session.commit()

        join_url: Optional[str] = None
        try:
            if not TAVUS_API_KEY:
                raise Exception("TAVUS_API_KEY not configured")

            replica_id, persona_id = resolve_tavus_profile_for_role(session, body.role_id)

            selections = (
                session.query(UserRoleSelection, Role)
                .join(Role, UserRoleSelection.role_id == Role.id)
                .filter(UserRoleSelection.user_id == current_user.id)
                .all()
            )
            selected_role_titles = [r.title for _, r in selections]
            roles_context = ", ".join(selected_role_titles) if selected_role_titles else None

            headers = {
                "x-api-key": TAVUS_API_KEY,
                "Content-Type": "application/json",
            }

            payload = {
                "replica_id": replica_id,
                "persona_id": persona_id,
            }
            if roles_context:
                payload_with_instructions = dict(payload)
                payload_with_instructions["instructions"] = (
                    f"The candidate has selected the following roles for interview practice: {roles_context}. "
                    f"Ask questions tailored to these roles, prioritizing the selected CV context if provided."
                )
            else:
                payload_with_instructions = payload

            def create_conv(p):
                resp_local = requests.post(
                    f"{TAVUS_BASE_URL.rstrip('/')}/v2/conversations",
                    json=p,
                    headers=headers,
                    timeout=30,
                )
                try:
                    resp_local.raise_for_status()
                except HTTPError:
                    detail = None
                    try:
                        detail = resp_local.json()
                    except Exception:
                        detail = resp_local.text
                    raise HTTPException(status_code=502, detail=f"Tavus error: {detail}")
                return resp_local.json()

            try:
                data = create_conv(payload_with_instructions)
            except HTTPException as he:
                msg = str(he.detail)
                if "Unknown field" in msg or "unknown field" in msg or "Unrecognized" in msg:
                    data = create_conv(payload)
                else:
                    raise

            join_url = data.get("conversation_url") or data.get("url")
            conv_id = data.get("id") or data.get("conversation_id")
            if not join_url:
                raise HTTPException(status_code=502, detail=f"Tavus response missing conversation_url: {data}")

            if conv_id and roles_context:
                try:
                    seed_body = {
                        "role": "user",
                        "content": (
                            "I want to practice interviews for these roles: "
                            + roles_context + ". Please conduct a structured interview with increasingly challenging, domain-specific questions. "
                            "Ask one question at a time and wait for my response. Start now."
                        ),
                    }
                    requests.post(
                        f"{TAVUS_BASE_URL.rstrip('/')}/v2/conversations/{conv_id}/messages",
                        json=seed_body,
                        headers=headers,
                        timeout=20,
                    )
                except Exception as _:
                    pass
        except HTTPException:
            raise
        except Exception as e:
            print(f"Tavus conversation creation failed: {e}")
            raise HTTPException(status_code=502, detail=f"Tavus conversation creation failed: {str(e)}")

        return StartInterviewResponse(id=interview.id, join_url=join_url)

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")


@router.post("/webhook")
async def tavus_webhook(request: Request, session: SessionDep):
    try:
        payload = await request.json()
        interview_ref = payload.get("external_ref") or payload.get("room_name") or payload.get("room_id")
        status = payload.get("status") or payload.get("event")

        if not interview_ref:
            return {"ok": True}

        interview = None
        if isinstance(interview_ref, str) and interview_ref.startswith("interview_"):
            try:
                interview_id = int(interview_ref.split("_", 1)[1])
                interview = session.query(Interview).filter(Interview.id == interview_id).first()
            except Exception:
                interview = None

        if interview:
            if status in ("completed", "ended", "finished", "done"):
                interview.status = "done"
            elif status in ("failed", "canceled", "cancelled"):
                interview.status = "failed"
            session.commit()

        return {"ok": True}
    except Exception as e:
        print(f"Webhook error: {e}")
        return {"ok": False}
