from fastapi import Depends, HTTPException, APIRouter
from typing import Annotated, List
from sqlalchemy.orm import Session
from app.models.user_model import User
from app.models.cv_model import CV
from app.models.role_model import Role
from app.schemas import (
    CVPresignRequest, CVPresignResponse, CVConfirmRequest, 
    CVResponse, CVListResponse, CVDownloadResponse
)
from app.dependencies import SessionDep, get_curr_user
import os
import boto3
from botocore.exceptions import ClientError
import uuid

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

@router.post("/presign", response_model=CVPresignResponse)
def presign_cv_upload(
    presign_data: CVPresignRequest,
    current_user: Annotated[User, Depends(get_curr_user)],
    session: SessionDep
):
    """
    Step 1: Generate presigned URL for CV upload
    
    This endpoint:
    1. Validates file type and role
    2. Generates a unique filename
    3. Creates a presigned URL for direct upload to MinIO
    4. Returns the URL and metadata for frontend to use
    """
    try:
       
        if presign_data.role_id:
            role = session.query(Role).filter(
                Role.id == presign_data.role_id, 
                Role.is_active == True
            ).first()
            if not role:
                raise HTTPException(status_code=404, detail="Role not found or inactive")

         
        allowed_types = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
        if presign_data.mime_type not in allowed_types:
            raise HTTPException(status_code=400, detail="Invalid file type. Only PDF, DOC, and DOCX are allowed")

         
        file_extension = presign_data.filename.split('.')[-1]
        unique_filename = f"{current_user.id}/{uuid.uuid4()}.{file_extension}"


        presigned_url = s3_client.generate_presigned_url(
            'put_object',
            Params={
                'Bucket': STORAGE_BUCKET,
                'Key': unique_filename,
                'ContentType': presign_data.mime_type
            },
            ExpiresIn=3600  # 1 hour expiry
        )

        return CVPresignResponse(
            url=presigned_url,
            fields={
                "filename": unique_filename,
                "mime_type": presign_data.mime_type,
                "role_id": presign_data.role_id
            }
        )

    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Storage service error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate presigned URL: {str(e)}")

 

@router.post("/confirm", response_model=CVResponse)
def confirm_cv_upload(
    confirm_data: CVConfirmRequest,
    current_user: Annotated[User, Depends(get_curr_user)],
    session: SessionDep
):
    """
    Confirm CV upload and create CV record
    """
    try:
       
        if confirm_data.role_id:
            role = session.query(Role).filter(
                Role.id == confirm_data.role_id, 
                Role.is_active == True
            ).first()
            if not role:
                raise HTTPException(status_code=404, detail="Role not found or inactive")

         
        max_size = 10 * 1024 * 1024  # 10MB in bytes
        if confirm_data.size_bytes > max_size:
            raise HTTPException(status_code=400, detail="File size exceeds 10MB limit")

         
        storage_url = f"{STORAGE_ENDPOINT}/{STORAGE_BUCKET}/{confirm_data.storage_filename}"

         
        cv = CV(
            user_id=current_user.id,
            role_id=confirm_data.role_id,
            filename=confirm_data.filename,
            mime_type=confirm_data.filename.split('.')[-1],
            size_bytes=confirm_data.size_bytes,
            storage_url=storage_url,
            status="uploaded"
        )
        
        session.add(cv)
        session.commit()
        session.refresh(cv)

        return CVResponse(
            id=cv.id,
            user_id=cv.user_id,
            role_id=cv.role_id,
            filename=cv.filename,
            mime_type=cv.mime_type,
            size_bytes=cv.size_bytes,
            storage_url=cv.storage_url,
            status=cv.status,
            created_at=cv.created_at
        )

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to confirm CV upload: {str(e)}")

@router.get("/", response_model=CVListResponse)
def get_user_cvs(
    current_user: Annotated[User, Depends(get_curr_user)],
    session: SessionDep,
    skip: int = 0,
    limit: int = 10
):
    """
    Get list of user's CVs with pagination
    """
    try:
         
        total = session.query(CV).filter(CV.user_id == current_user.id).count()
        
         
        cvs = session.query(CV).filter(
            CV.user_id == current_user.id
        ).offset(skip).limit(limit).all()

        cv_responses = [
            CVResponse(
                id=cv.id,
                user_id=cv.user_id,
                role_id=cv.role_id,
                filename=cv.filename,
                mime_type=cv.mime_type,
                size_bytes=cv.size_bytes,
                storage_url=cv.storage_url,
                status=cv.status,
                created_at=cv.created_at
            )
            for cv in cvs
        ]

        return CVListResponse(cvs=cv_responses, total=total)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get CVs: {str(e)}")

@router.delete("/{cv_id}")
def delete_cv(
    cv_id: int,
    current_user: Annotated[User, Depends(get_curr_user)],
    session: SessionDep
):
    """
     
    """
    try:
         
        cv = session.query(CV).filter(
            CV.id == cv_id,
            CV.user_id == current_user.id
        ).first()
        
        if not cv:
            raise HTTPException(status_code=404, detail="CV not found")

         
        minio_deleted = False
        try:
             
            storage_url_parts = cv.storage_url.split(f"{STORAGE_BUCKET}/")
            if len(storage_url_parts) == 2:
                key = storage_url_parts[1]
                s3_client.delete_object(Bucket=STORAGE_BUCKET, Key=key)
                minio_deleted = True
        except Exception as e:
             
            print(f"MinIO deletion failed for CV {cv_id}: {str(e)}")
            minio_deleted = False

         
        session.delete(cv)
        session.commit()


        if minio_deleted:
            return {"message": "CV deleted successfully from database and storage"}
        else:
            return {
                "message": "CV deleted from database successfully",
                "note": "Storage cleanup was skipped (MinIO may not be running)"
            }

    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete CV: {str(e)}")


@router.get("/{cv_id}/download", response_model=CVDownloadResponse)
def get_cv_download_url(
    cv_id: int,
    current_user: Annotated[User, Depends(get_curr_user)],
    session: SessionDep
):
    """
    Get a temporary presigned download URL for a CV file
    
    This endpoint:
    1. Verifies the user owns the CV
    2. Generates a temporary presigned URL for downloading
    3. Returns the URL with expiry information
    
    The URL can be used to download/view the file directly from MinIO
    """
    try:
        cv = session.query(CV).filter(
            CV.id == cv_id,
            CV.user_id == current_user.id
        ).first()
        
        if not cv:
            raise HTTPException(status_code=404, detail="CV not found")

        storage_url_parts = cv.storage_url.split(f"{STORAGE_BUCKET}/")
        if len(storage_url_parts) != 2:
            raise HTTPException(status_code=500, detail="Invalid storage URL format")
        
        key = storage_url_parts[1]

        presigned_url = s3_client.generate_presigned_url(
            'get_object',
            Params={
                'Bucket': STORAGE_BUCKET,
                'Key': key
            },
            ExpiresIn=900  
        )

        return CVDownloadResponse(
            download_url=presigned_url,
            expires_in=900
        )

    except HTTPException:
        raise
    except ClientError as e:
        raise HTTPException(status_code=500, detail=f"Storage service error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate download URL: {str(e)}")
