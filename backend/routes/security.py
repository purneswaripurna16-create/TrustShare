from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import or_
from datetime import datetime, timedelta

from database.connection import engine
from models.activity_log import ActivityLog
from models.notification import Notification
from auth_utils import verify_access_token
from notification_logger import create_notification


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
# SECURITY CHECK
# =========================================================

@router.get("/security/check")
def check_suspicious_activity(
    current_user: dict = Depends(get_current_user)
):

    db = Session(bind=engine)

    try:

        # Check failed logins from the last 15 minutes
        time_limit = datetime.utcnow() - timedelta(minutes=15)

        failed_logins = db.query(ActivityLog).filter(
            ActivityLog.action == "LOGIN_FAILED",
            ActivityLog.created_at >= time_limit,
            or_(
                ActivityLog.user_id == current_user["user_id"],
                ActivityLog.user_email == current_user["email"]
            )
        ).order_by(
            ActivityLog.created_at.desc()
        ).all()

        failed_count = len(failed_logins)

        suspicious = failed_count >= 3

        if suspicious:
                message = (
                    "Suspicious activity detected: multiple failed login "
                    "attempts in the last 15 minutes."
                )

                existing_alert = db.query(Notification).filter(
                    Notification.user_id == current_user["user_id"],
                    Notification.title == "Security Alert",
                    Notification.notification_type == "SECURITY_ALERT",
                    Notification.created_at >= time_limit
                ).first()

                if not existing_alert:
                    create_notification(
                        user_id=current_user["user_id"],
                        title="Security Alert",
                        message=message,
                        notification_type="SECURITY_ALERT"
                    )

        else:
            message = "No suspicious activity detected."
        return {
            "suspicious": suspicious,
            "failed_login_count": failed_count,
            "time_window_minutes": 15,
            "message": message,
            "recent_failed_logins": [
                {
                    "id": log.id,
                    "user_email": log.user_email,
                    "created_at": log.created_at,
                    "details": log.details
                }
                for log in failed_logins
            ]
        }

    finally:
        db.close()