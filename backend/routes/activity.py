from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import or_

from database.connection import engine
from models.activity_log import ActivityLog
from auth_utils import verify_access_token


router = APIRouter()

security = HTTPBearer()


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
# GET USER ACTIVITY
# =========================================================

@router.get("/activity")
def get_activity(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):

    # Prevent extremely large requests
    if limit < 1:
        limit = 1

    if limit > 100:
        limit = 100

    db = Session(bind=engine)

    try:

        activities = db.query(ActivityLog).filter(
            or_(
                ActivityLog.user_id == current_user["user_id"],
                ActivityLog.user_email == current_user["email"]
            )
        ).order_by(
            ActivityLog.created_at.desc()
        ).limit(limit).all()

        return {
            "count": len(activities),
            "activities": [
                {
                    "id": activity.id,
                    "user_id": activity.user_id,
                    "user_email": activity.user_email,
                    "action": activity.action,
                    "filename": activity.filename,
                    "details": activity.details,
                    "ip_address": activity.ip_address,
                    "created_at": activity.created_at
                }
                for activity in activities
            ]
        }

    finally:
        db.close()