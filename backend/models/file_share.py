from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime

from database.connection import Base


class FileShare(Base):
    __tablename__ = "file_shares"

    id = Column(Integer, primary_key=True, index=True)

    filename = Column(String, nullable=False)

    sender_id = Column(Integer, nullable=False)

    recipient_email = Column(String, nullable=False)

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )