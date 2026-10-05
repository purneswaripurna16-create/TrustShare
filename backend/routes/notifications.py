from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from database.connection import engine
from models.notification import Notification
from auth_utils import verify_access_token


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


# ---------------------------------------------------------
# GET NOTIFICATIONS
# ---------------------------------------------------------

@router.get("/notifications")
def get_notifications(
    limit: int = 50,
    current_user=Depends(get_current_user)
):
    if limit < 1:
        limit = 1

    if limit > 100:
        limit = 100

    db = Session(bind=engine)

    try:
        notifications = (
            db.query(Notification)
            .filter(
                Notification.user_id == current_user["user_id"]
            )
            .order_by(
                Notification.created_at.desc()
            )
            .limit(limit)
            .all()
        )

        return {
            "count": len(notifications),
            "notifications": [
                {
                    "id": notification.id,
                    "user_id": notification.user_id,
                    "title": notification.title,
                    "message": notification.message,
                    "notification_type": notification.notification_type,
                    "is_read": notification.is_read,
                    "created_at": notification.created_at
                }
                for notification in notifications
            ]
        }

    finally:
        db.close()


# ---------------------------------------------------------
# MARK ONE NOTIFICATION AS READ
# ---------------------------------------------------------

@router.put("/notifications/{notification_id}/read")
def mark_notification_as_read(
    notification_id: int,
    current_user=Depends(get_current_user)
):
    db = Session(bind=engine)

    try:
        notification = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.user_id == current_user["user_id"]
            )
            .first()
        )

        if not notification:
            raise HTTPException(
                status_code=404,
                detail="Notification not found"
            )

        notification.is_read = True

        db.commit()

        return {
            "message": "Notification marked as read"
        }

    finally:
        db.close()


# ---------------------------------------------------------
# MARK ALL NOTIFICATIONS AS READ
# ---------------------------------------------------------

@router.put("/notifications/read-all")
def mark_all_notifications_as_read(
    current_user=Depends(get_current_user)
):
    db = Session(bind=engine)

    try:
        notifications = (
            db.query(Notification)
            .filter(
                Notification.user_id == current_user["user_id"],
                Notification.is_read == False
            )
            .all()
        )

        for notification in notifications:
            notification.is_read = True

        db.commit()

        return {
            "message": "All notifications marked as read",
            "updated_count": len(notifications)
        }

    finally:
        db.close()