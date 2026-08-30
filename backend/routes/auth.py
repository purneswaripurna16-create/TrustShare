from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.connection import engine
from models.user import User
from passlib.context import CryptContext
from auth_utils import create_access_token, verify_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials


router = APIRouter()

security = HTTPBearer()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# =========================
# REGISTER
# =========================

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


@router.post("/register")
def register(user: RegisterRequest):

    db = Session(bind=engine)

    # Check whether email already exists
    existing_email = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_email:
        db.close()

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    # Check whether username already exists
    existing_username = db.query(User).filter(
        User.username == user.username
    ).first()

    if existing_username:
        db.close()

        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )

    # Hash password
    hashed_password = pwd_context.hash(
        user.password
    )

    # Create user
    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    db.close()

    return {
        "message": "User registered successfully",
        "username": new_user.username,
        "email": new_user.email
    }


# =========================
# LOGIN
# =========================

class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(user: LoginRequest):

    db = Session(bind=engine)

    existing_user = db.query(User).filter(
        User.email == user.email
    ).first()

    if not existing_user:
        db.close()

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    password_correct = pwd_context.verify(
        user.password,
        existing_user.password
    )

    if not password_correct:
        db.close()

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    access_token = create_access_token({
        "user_id": existing_user.id,
        "email": existing_user.email
    })

    db.close()

    return {
        "message": "Login successful",
        "access_token": access_token,
        "username": existing_user.username,
        "email": existing_user.email
    }


# =========================
# CURRENT USER
# =========================

@router.get("/me")
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

    return {
        "message": "Authenticated user",
        "user_id": payload.get("user_id"),
        "email": payload.get("email")
    }