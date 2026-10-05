from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File
)

from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

from pydantic import BaseModel
from sqlalchemy.orm import Session

from database.connection import engine
from models.file_share import FileShare
from models.file import File as FileModel
from models.user import User
from auth_utils import verify_access_token
from activity_logger import log_activity
from notification_logger import create_notification

from storage import (
    download_encrypted_file,
    upload_encrypted_file
)

from encryption import (
    encrypt_file,
    load_key,
    safe_filename
)


router = APIRouter()

security = HTTPBearer()


class ShareRequest(BaseModel):
    filename: str
    recipient_email: str
    permission: str = "read"


class PermissionUpdateRequest(BaseModel):
    permission: str


# =========================================================
# GET CURRENT USER
# =========================================================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    payload = verify_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user_id = payload.get("user_id")
    email = payload.get("email")

    if not user_id or not email:
        raise HTTPException(
            status_code=401,
            detail="Invalid user token"
        )

    return {
        "user_id": user_id,
        "email": email
    }


# =========================================================
# SHARE FILE
# =========================================================

@router.post("/share")
def share_file(
    request: ShareRequest,
    current_user: dict = Depends(get_current_user)
):

    if request.permission not in [
        "read",
        "write",
        "read_write"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid permission. Use read, write, or read_write"
        )

    db = Session(bind=engine)

    try:

        file_record = db.query(FileModel).filter(
            FileModel.filename == request.filename,
            FileModel.owner_id == current_user["user_id"]
        ).first()

        if not file_record:
            raise HTTPException(
                status_code=404,
                detail="File not found or you do not own this file"
            )

        # Check encrypted file exists in Supabase
        storage_path = safe_filename(request.filename) + ".enc"

        try:
            download_encrypted_file(storage_path)

        except Exception:
            raise HTTPException(
                status_code=404,
                detail="Encrypted file not found in secure storage"
            )

        # Check recipient account
        recipient = db.query(User).filter(
            User.email == request.recipient_email
        ).first()

        if not recipient:
            raise HTTPException(
                status_code=404,
                detail="No TrustShare account found with this email"
            )

        # Prevent self-sharing
        if request.recipient_email == current_user["email"]:
            raise HTTPException(
                status_code=400,
                detail="You cannot share a file with yourself"
            )

        # Check existing share
        existing_share = db.query(FileShare).filter(
            FileShare.filename == request.filename,
            FileShare.sender_id == current_user["user_id"],
            FileShare.recipient_email == request.recipient_email
        ).first()

        if existing_share:
            # If the same permission is requested, keep the duplicate protection
            if existing_share.permission == request.permission:
                raise HTTPException(
                    status_code=400,
                    detail="This file has already been shared with this user"
                )

            # If permission is different, update the existing share
            old_permission = existing_share.permission
            existing_share.permission = request.permission

            db.commit()
            db.refresh(existing_share)

            create_notification(
                user_id=recipient.id,
                title="File Permission Updated",
                message=(
                    f"{current_user['email']} changed the permission "
                    f"for {request.filename} from {old_permission} "
                    f"to {request.permission}"
                )
            )

            return {
                "message": "File permission updated successfully",
                "share_id": existing_share.id,
                "permission": existing_share.permission
            }

        # Create share
        new_share = FileShare(
            filename=request.filename,
            sender_id=current_user["user_id"],
            recipient_email=request.recipient_email,
            permission=request.permission
        )

        db.add(new_share)
        db.commit()
        db.refresh(new_share)
        

        create_notification(
            user_id=recipient.id,
            title="File Shared With You",
            message=(
                f"{current_user['email']} shared "
                f"'{request.filename}' with you "
                f"with {request.permission} permission."
            ),
            notification_type="FILE_SHARED"
        )

        log_activity(
            action="FILE_SHARED",
            user_id=current_user["user_id"],
            user_email=current_user["email"],
            filename=request.filename,
            details=(
                f"File shared with {request.recipient_email} "
                f"with {request.permission} permission"
            )
        )

        return {
            "message": "File shared successfully",
            "share_id": new_share.id,
            "filename": request.filename,
            "recipient_email": request.recipient_email,
            "permission": request.permission
        }

    finally:
        db.close()


# =========================================================
# UPDATE EXISTING SHARE PERMISSION
# =========================================================
#
# OWNER CAN CHANGE:
#
# read       -> write
# read       -> read_write
# write      -> read
# write      -> read_write
# read_write -> read
# read_write -> write
#
# =========================================================

@router.put("/shared-by-me/{share_id}/permission")
def update_share_permission(
    share_id: int,
    request: PermissionUpdateRequest,
    current_user: dict = Depends(get_current_user)
):

    if request.permission not in [
        "read",
        "write",
        "read_write"
    ]:
        raise HTTPException(
            status_code=400,
            detail="Invalid permission. Use read, write, or read_write"
        )

    db = Session(bind=engine)

    try:

        # Only the OWNER can change the permission
        share = db.query(FileShare).filter(
            FileShare.id == share_id,
            FileShare.sender_id == current_user["user_id"]
        ).first()

        if not share:
            raise HTTPException(
                status_code=404,
                detail="Shared file not found"
            )

        old_permission = share.permission

        share.permission = request.permission

        db.commit()
        db.refresh(share)

        log_activity(
            action="PERMISSION_CHANGED",
            user_id=current_user["user_id"],
            user_email=current_user["email"],
            filename=share.filename,
            details=(
                f"Permission changed for {share.recipient_email}: "
                f"{old_permission} -> {share.permission}"
            )
        )

        return {
            "message": "Share permission updated successfully",
            "share_id": share.id,
            "filename": share.filename,
            "recipient_email": share.recipient_email,
            "old_permission": old_permission,
            "permission": share.permission
        }

    finally:
        db.close()


# =========================================================
# GET SHARED WITH ME
# =========================================================

@router.get("/shared-files")
def get_shared_files(
    current_user: dict = Depends(get_current_user)
):

    db = Session(bind=engine)

    try:

        shares = db.query(FileShare).filter(
            FileShare.recipient_email == current_user["email"]
        ).all()

        files = [
            {
                "id": share.id,
                "filename": share.filename,
                "sender_id": share.sender_id,
                "permission": share.permission,
                "expires_at": share.expires_at,
                "created_at": share.created_at
            }
            for share in shares
        ]

        return {
            "count": len(files),
            "files": files
        }

    finally:
        db.close()


# =========================================================
# GET SHARED BY ME
# =========================================================

@router.get("/shared-by-me")
def get_shared_by_me(
    current_user: dict = Depends(get_current_user)
):

    db = Session(bind=engine)

    try:

        shares = db.query(FileShare).filter(
            FileShare.sender_id == current_user["user_id"]
        ).all()

        files = [
            {
                "id": share.id,
                "filename": share.filename,
                "recipient_email": share.recipient_email,
                "permission": share.permission,
                "expires_at": share.expires_at,
                "created_at": share.created_at
            }
            for share in shares
        ]

        return {
            "count": len(files),
            "files": files
        }

    finally:
        db.close()


# =========================================================
# UPDATE SHARED FILE
# =========================================================
#
# READ:
#     denied
#
# WRITE:
#     allowed
#
# READ_WRITE:
#     allowed
#
# The new version is encrypted using the existing
# AES-256 key and a fresh nonce.
#
# =========================================================

@router.put("/shared-files/{share_id}/update")
async def update_shared_file(
    share_id: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):

    db = Session(bind=engine)

    try:

        # -------------------------------------------------
        # FIND SHARE
        # -------------------------------------------------

        share = db.query(FileShare).filter(
            FileShare.id == share_id,
            FileShare.recipient_email == current_user["email"]
        ).first()

        if not share:
            raise HTTPException(
                status_code=404,
                detail="Shared file not found"
            )

        # -------------------------------------------------
        # CHECK WRITE PERMISSION
        # -------------------------------------------------

        if share.permission not in [
            "write",
            "read_write"
        ]:
            raise HTTPException(
                status_code=403,
                detail="You do not have write permission for this file"
            )

        # -------------------------------------------------
        # VALIDATE FILENAME
        # -------------------------------------------------

        try:
            filename = safe_filename(share.filename)

        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid filename"
            )

        # -------------------------------------------------
        # MAKE SURE UPLOADED FILE HAS SAME NAME
        # -------------------------------------------------

        uploaded_filename = file.filename

        try:
            uploaded_filename = safe_filename(uploaded_filename)

        except ValueError:
            raise HTTPException(
                status_code=400,
                detail="Invalid uploaded filename"
            )

        if uploaded_filename != filename:
            raise HTTPException(
                status_code=400,
                detail=f"Please upload a file named '{filename}'"
            )

        # -------------------------------------------------
        # READ NEW FILE CONTENT
        # -------------------------------------------------

        content = await file.read()

        if not content:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file is empty"
            )

        # -------------------------------------------------
        # LOAD EXISTING AES-256 KEY
        # -------------------------------------------------

        try:
            key = load_key(filename)

        except FileNotFoundError:
            raise HTTPException(
                status_code=404,
                detail="Encryption key not found"
            )

        # -------------------------------------------------
        # ENCRYPT NEW VERSION
        # -------------------------------------------------

        nonce, encrypted_data = encrypt_file(
            content,
            key
        )

        encrypted_storage_data = (
            nonce + encrypted_data
        )

        # -------------------------------------------------
        # REPLACE ENCRYPTED FILE IN SUPABASE
        # -------------------------------------------------

        storage_path = filename + ".enc"

        try:

            upload_encrypted_file(
                storage_path,
                encrypted_storage_data
            )

        except Exception as e:

            print(
                "Supabase update upload error:",
                e
            )

            raise HTTPException(
                status_code=500,
                detail="Failed to update encrypted file in secure storage"
            )

        # -------------------------------------------------
        # SUCCESS
        # -------------------------------------------------
        log_activity(
            action="SHARED_FILE_UPDATED",
            user_id=current_user["user_id"],
            user_email=current_user["email"],
            filename=filename,
            details="Shared file content updated successfully"
        )

        return {
            "message": "Shared file updated successfully",
            "filename": filename,
            "permission": share.permission
        }

        

    finally:
        db.close()


# =========================================================
# DELETE FROM SHARED WITH ME
# =========================================================

@router.delete("/shared-files/{share_id}")
def delete_shared_with_me_file(
    share_id: int,
    current_user: dict = Depends(get_current_user)
):

    db = Session(bind=engine)

    try:

        share = db.query(FileShare).filter(
            FileShare.id == share_id,
            FileShare.recipient_email == current_user["email"]
        ).first()

        if not share:
            raise HTTPException(
                status_code=404,
                detail="Shared file not found"
            )

        filename = share.filename

        db.delete(share)
        db.commit()

        log_activity(
            action="SHARED_FILE_REMOVED",
            user_id=current_user["user_id"],
            user_email=current_user["email"],
            filename=filename,
            details="Recipient removed the shared file from their account"
        )

        return {
            "message": "File removed successfully",
            "filename": filename
        }

    finally:
        db.close()


# =========================================================
# DELETE FROM SHARED BY ME
# =========================================================

@router.delete("/shared-by-me/{share_id}")
def delete_shared_by_me_file(
    share_id: int,
    current_user: dict = Depends(get_current_user)
):

    db = Session(bind=engine)

    try:

        share = db.query(FileShare).filter(
            FileShare.id == share_id,
            FileShare.sender_id == current_user["user_id"]
        ).first()

        if not share:
            raise HTTPException(
                status_code=404,
                detail="Shared file not found"
            )

        filename = share.filename
        recipient_email = share.recipient_email

        db.delete(share)
        db.commit()

        log_activity(
            action="SHARE_REVOKED",
            user_id=current_user["user_id"],
            user_email=current_user["email"],
            filename=filename,
            details=f"Sharing revoked for {recipient_email}"
        )

        return {
            "message": "Sharing revoked successfully",
            "filename": filename
        }
    finally:
        db.close()