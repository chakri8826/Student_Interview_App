from fastapi import APIRouter, HTTPException, Depends
from typing import Annotated
from pydantic import BaseModel
from sqlalchemy.orm import Session
import os
import io
import json
import requests
import boto3
from botocore.exceptions import ClientError
from PyPDF2 import PdfReader
from docx import Document

from app.dependencies import SessionDep, get_curr_user
from app.models.user_model import User
from app.models.wallet_model import Wallet
from app.models.screening_model import Screening

router = APIRouter()

STORAGE_ENDPOINT = os.getenv("STORAGE_ENDPOINT", "http://127.0.0.1:9000")
STORAGE_BUCKET = os.getenv("STORAGE_BUCKET", "cvs")
STORAGE_ACCESS_KEY = os.getenv("STORAGE_ACCESS_KEY")
STORAGE_SECRET_KEY = os.getenv("STORAGE_SECRET_KEY")

s3_client = boto3.client(
    's3',
    endpoint_url=STORAGE_ENDPOINT,
    aws_access_key_id=STORAGE_ACCESS_KEY,
    aws_secret_access_key=STORAGE_SECRET_KEY,
    region_name='us-east-1'
)


class RunScreeningRequest(BaseModel):
    cv_id: int

@router.post("/run")
def run_screening(
    body: RunScreeningRequest,
    current_user: Annotated[User, Depends(get_curr_user)],
    session: SessionDep,
):
    try:
        wallet = session.query(Wallet).filter(Wallet.user_id == current_user.id).first()
        if not wallet or wallet.balance_credits < 1:
            raise HTTPException(status_code=400, detail="Insufficient credits")

        wallet.balance_credits -= 1

        from app.models.cv_model import CV
        cv = session.query(CV).filter(CV.id == body.cv_id, CV.user_id == current_user.id).first()
        if not cv:
            raise HTTPException(status_code=404, detail="CV not found")

        text_content = ""
        try:
            storage_url_parts = cv.storage_url.split(f"{STORAGE_BUCKET}/")
            if len(storage_url_parts) != 2:
                raise HTTPException(status_code=500, detail="Invalid storage URL format")
            
            key = storage_url_parts[1]
            
            file_obj = io.BytesIO()
            s3_client.download_fileobj(STORAGE_BUCKET, key, file_obj)
            file_obj.seek(0)
            file_bytes = file_obj.read()

            if cv.filename.lower().endswith('.pdf'):
                pdf = PdfReader(io.BytesIO(file_bytes))
                text_content = "\n".join(page.extract_text() or "" for page in pdf.pages)
            elif cv.filename.lower().endswith('.docx'):
                doc = Document(io.BytesIO(file_bytes))
                text_content = "\n".join(p.text for p in doc.paragraphs)
            else:
                text_content = file_bytes.decode('utf-8', errors='ignore')
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"Failed to read CV file from storage: {str(e)}")
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to read CV file: {str(e)}")

        github_token = os.getenv("GITHUB_TOKEN")
        if not github_token:
            raise HTTPException(status_code=500, detail="GITHUB_TOKEN is not configured for GitHub Models")

        ai_model = os.getenv("AI_MODEL", "openai/gpt-4.1")

        analysis = None
        try:
            prompt = (
                "You are an expert CV screener. Given the resume text below, "
                "identify the most relevant job roles (3-5), summarize key skills, "
                "and suggest improvements. Return a JSON with these fields: "
                "roles (array of strings), skills (array of strings), summary (string), "
                "and improvements (array of strings)."
            )

            # Match the working call pattern from your other project:
            # base "https://models.github.ai/inference" or full "https://models.github.ai/inference/chat/completions"
            endpoint = os.getenv(
                "GITHUB_MODELS_ENDPOINT",
                "https://models.github.ai/inference/chat/completions",
            )
            url = endpoint if endpoint.rstrip("/").endswith("chat/completions") else f"{endpoint.rstrip('/')}/chat/completions"

            payload = {
                "model": ai_model or "openai/gpt-4.1",
                "messages": [
                    {"role": "system", "content": prompt},
                    {"role": "user", "content": text_content[:15000]},
                ],
                "temperature": 1,
                "top_p": 1,
            }

            # Use minimal headers like the GitHub Models quickstart
            headers = {
                "Authorization": f"Bearer {github_token}",
                "Content-Type": "application/json",
            }

            r = requests.post(url, headers=headers, json=payload, timeout=120)
            r.raise_for_status()
            data = r.json()

            analysis = (
                data.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
            )

        except Exception as e:
            analysis = f"AI analysis failed: {str(e)}"

        screening = Screening(
            user_id=current_user.id,
            cv_id=body.cv_id,
            status="done",
            credits_used=1,
        )
        session.add(screening)
        session.commit()
        session.refresh(screening)

        return {
            "id": screening.id,
            "status": screening.status,
            "analysis": analysis,
        }

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to run screening: {str(e)}")


@router.get("/{screening_id}")
def get_screening(screening_id: int, current_user: Annotated[User, Depends(get_curr_user)], session: SessionDep):
    screening = (
        session.query(Screening)
        .filter(Screening.id == screening_id, Screening.user_id == current_user.id)
        .first()
    )
    if not screening:
        raise HTTPException(status_code=404, detail="Screening not found")
    return {
        "id": screening.id,
        "cv_id": screening.cv_id,
        "status": screening.status,
        "credits_used": screening.credits_used,
        "created_at": screening.created_at,
    }


