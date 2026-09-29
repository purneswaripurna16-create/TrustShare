from database.connection import SessionLocal
from models.activity_log import ActivityLog


def log_activity(
    action,
    user_id=None,
    user_email=None,
    filename=None,
    details=None,
    ip_address=None
):
    db = SessionLocal()

    try:
        activity = ActivityLog(
            user_id=user_id,
            user_email=user_email,
            action=action,
            filename=filename,
            details=details,
            ip_address=ip_address
        )

        db.add(activity)
        db.commit()

    finally:
        db.close()
