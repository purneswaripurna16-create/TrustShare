from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import func, or_

from database.connection import engine
from models.activity_log import ActivityLog
from auth_utils import verify_access_token
from storage import supabase, SUPABASE_BUCKET



router = APIRouter()
security = HTTPBearer()


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


@router.get("/analytics")
def get_analytics(
    current_user=Depends(get_current_user)
):
    db = Session(bind=engine)

    try:
        user_filter = or_(
            ActivityLog.user_id == current_user["user_id"],
            ActivityLog.user_email == current_user["email"]
        )

        total_uploads = db.query(ActivityLog).filter(
            user_filter,
            ActivityLog.action == "FILE_UPLOADED"
        ).count()

        total_downloads = db.query(ActivityLog).filter(
            user_filter,
            ActivityLog.action == "FILE_DOWNLOADED"
        ).count()

        total_shares = db.query(ActivityLog).filter(
            user_filter,
            ActivityLog.action == "FILE_SHARED"
        ).count()

        total_deletes = db.query(ActivityLog).filter(
            user_filter,
            ActivityLog.action == "FILE_DELETED"
        ).count()

        total_activities = db.query(ActivityLog).filter(
            user_filter
        ).count()
                # =========================
        # STORAGE USAGE
        # =========================

        storage_used_bytes = 0
        stored_file_count = 0

        try:
            stored_files = supabase.storage.from_(
                SUPABASE_BUCKET
            ).list()
            print("SUPABASE STORAGE FILES:", stored_files)

            for stored_file in stored_files:
                file_name = stored_file.get("name", "")

                # Only count encrypted TrustShare files
                if not file_name.endswith(".enc"):
                    continue

                metadata = stored_file.get("metadata") or {}

                file_size = metadata.get("size", 0)

                try:
                    storage_used_bytes += int(file_size)
                    stored_file_count += 1
                except (TypeError, ValueError):
                    pass

        except Exception as e:
            print("Storage analytics error:", e)

        return {
            "total_uploads": total_uploads,
            "total_downloads": total_downloads,
            "total_shares": total_shares,
            "total_deletes": total_deletes,
            "total_activities": total_activities,
            "storage_used_bytes": storage_used_bytes,
            "stored_file_count": stored_file_count
        }

    finally:
        db.close()