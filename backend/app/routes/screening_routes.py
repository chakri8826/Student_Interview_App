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
from openai import OpenAI

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

        ai_api_key = os.getenv('API_KEY')
        ai_provider = os.getenv('AI_PROVIDER', 'google').lower()
        ai_model = os.getenv('AI_MODEL', 'gemini-1.5-flash')

        analysis = None
        if ai_api_key:
            try:
                prompt = (
                    "You are an expert CV screener. Given the resume text below, "
                    "identify the most relevant job roles (3-5), summarize key skills, "
                    "and suggest improvements. Return a JSON with these fields: "
                    "roles (array of strings), skills (array of strings), summary (string), "
                    "and improvements (array of strings)."
                )

                if ai_provider == 'google':
                    url = f"https://generativelanguage.googleapis.com/v1/models/{ai_model}:generateContent?key={ai_api_key}"


                    prompt_text = (
                        f"{prompt}\n\nHere is the resume text:\n{text_content[:15000]}"
                    )

                    payload = {
                        "contents": [{"parts": [{"text": prompt_text}]}],
                        "generationConfig": {"temperature": 0.2}
                    }

                    r = requests.post(url, json=payload, timeout=60)
                    r.raise_for_status()
                    data = r.json()

                    analysis = (
                        data.get("candidates", [{}])[0]
                        .get("content", {})
                        .get("parts", [{}])[0]
                        .get("text", "")
                    )

                    try:
                        analysis_json = json.loads(analysis)
                        analysis = analysis_json
                    except Exception:
                        pass

                else:
                    client = OpenAI(api_key=ai_api_key)
                    completion = client.chat.completions.create(
                        model=ai_model or 'gpt-4o-mini',
                        messages=[
                            {"role": "system", "content": prompt},
                            {"role": "user", "content": text_content[:15000]},
                        ],
                        temperature=0.2,
                    )
                    analysis = completion.choices[0].message.content

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


