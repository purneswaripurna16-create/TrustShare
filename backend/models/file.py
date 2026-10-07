from sqlalchemy import Column, Integer, String
from database.connection import Base


class File(Base):
    __tablename__ = "files"
    __table_args__ = {"schema": "public"}

    id = Column(Integer, primary_key=True, index=True)

    filename = Column(String, nullable=False)

    owner_id = Column(Integer, nullable=False)