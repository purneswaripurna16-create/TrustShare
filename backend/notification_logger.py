from database.connection import SessionLocal
from models.notification import Notification


def create_notification(
    user_id,
    title,
    message,
    notification_type="info"
):
    db = SessionLocal()

    try:
        notification = Notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            is_read=False
        )

        db.add(notification)
        db.commit()
        db.refresh(notification)

        return notification

    finally:
        db.close()