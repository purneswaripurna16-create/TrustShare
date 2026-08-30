from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import engine
from models.file_share import FileShare
from auth_utils import verify_access_token


router = APIRouter()

security = HTTPBearer()


# =========================
# SHARE REQUEST
# =========================

class ShareRequest(BaseModel):
    filename: str
    recipient_email: str


# =========================
# SHARE FILE
# =========================

@router.post("/share")
def share_file(
    request: ShareRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    # Get JWT token
    token = credentials.credentials

    # Verify token
    payload = verify_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    sender_id = payload.get("user_id")

    if not sender_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid user token"
        )

    # Check that file exists
    import os

    upload_dir = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "uploads"
    )

    file_path = os.path.join(
        upload_dir,
        request.filename
    )

    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    # Save sharing information
    db = Session(bind=engine)

    new_share = FileShare(
        filename=request.filename,
        sender_id=sender_id,
        recipient_email=request.recipient_email
    )

    db.add(new_share)
    db.commit()
    db.refresh(new_share)

    db.close()

    return {
        "message": "File shared successfully",
        "filename": request.filename,
        "recipient_email": request.recipient_email
    }


# =========================
# GET SHARED FILES
# =========================

@router.get("/shared-files")
def get_shared_files(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    # Get JWT token
    token = credentials.credentials

    # Verify token
    payload = verify_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    email = payload.get("email")

    if not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid user token"
        )

    db = Session(bind=engine)

    shares = db.query(FileShare).filter(
        FileShare.recipient_email == email
    ).all()

    files = [
        share.filename
        for share in shares
    ]

    db.close()

    return {
        "files": files
    }