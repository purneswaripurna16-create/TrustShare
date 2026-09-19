from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from database.connection import engine
from models.user import User
from passlib.context import CryptContext
from auth_utils import create_access_token, verify_access_token
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig
from pydantic_settings import BaseSettings

import secrets
from datetime import datetime, timedelta


router = APIRouter()

security = HTTPBearer()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# =========================================================
# EMAIL CONFIGURATION
# =========================================================

class MailSettings(BaseSettings):
    MAIL_USERNAME: str
    MAIL_PASSWORD: str
    MAIL_FROM: str

    class Config:
        env_file = ".env"
        extra = "ignore"


mail_settings = MailSettings()


print("======================================")
print("MAIL_USERNAME:", mail_settings.MAIL_USERNAME)
print("MAIL_FROM:", mail_settings.MAIL_FROM)
print("MAIL_PASSWORD loaded:", bool(mail_settings.MAIL_PASSWORD))
print("======================================")


conf = ConnectionConfig(
    MAIL_USERNAME=mail_settings.MAIL_USERNAME,
    MAIL_PASSWORD=mail_settings.MAIL_PASSWORD,
    MAIL_FROM=mail_settings.MAIL_FROM,
    MAIL_PORT=587,
    MAIL_SERVER="smtp.gmail.com",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)


# =========================================================
# PASSWORD RESET TOKENS
# =========================================================

reset_tokens = {}


# =========================================================
# REGISTER
# =========================================================

class RegisterRequest(BaseModel):
    username: str
    email: str
    password: str


@router.post("/register")
def register(user: RegisterRequest):

    db = Session(bind=engine)

    existing_email = db.query(User).filter(
        User.email == user.email
    ).first()

    if existing_email:
        db.close()
        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    existing_username = db.query(User).filter(
        User.username == user.username
    ).first()

    if existing_username:
        db.close()
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )

    hashed_password = pwd_context.hash(user.password)

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


# =========================================================
# LOGIN
# =========================================================

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


# =========================================================
# CURRENT USER
# =========================================================

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


# =========================================================
# FORGOT PASSWORD
# =========================================================

class ForgotPasswordRequest(BaseModel):
    email: str


@router.post("/forgot-password")
async def forgot_password(
    request: ForgotPasswordRequest
):

    print("--------------------------------------")
    print("Password reset requested for:", request.email)

    db = Session(bind=engine)

    user = db.query(User).filter(
        User.email == request.email
    ).first()

    db.close()

    # Don't reveal whether account exists
    if not user:
        print("No account found for this email")

        return {
            "message": (
                "If an account exists with this email, "
                "a password reset link has been sent."
            )
        }

    print("User found:", user.username)

    # -----------------------------------------------------
    # Generate secure reset token
    # -----------------------------------------------------

    token = secrets.token_urlsafe(32)

    expires_at = datetime.utcnow() + timedelta(minutes=15)

    reset_tokens[token] = {
        "user_id": user.id,
        "email": user.email,
        "expires_at": expires_at
    }

    # -----------------------------------------------------
    # Reset URL
    # -----------------------------------------------------

    reset_link = (
        f"http://localhost:5173/reset-password?token={token}"
    )

    print("Reset link generated:")
    print(reset_link)

    # -----------------------------------------------------
    # Email
    # -----------------------------------------------------

    message = MessageSchema(
        subject="TrustShare - Reset Your Password",
        recipients=[user.email],
        body=f"""
Hello {user.username},

We received a request to reset your TrustShare password.

Click the link below to create a new password:

{reset_link}

This link will expire in 15 minutes.

If you did not request a password reset, you can safely ignore this email.

For your security, do not share this link with anyone.

Regards,
TrustShare Security Team
""",
        subtype="plain"
    )

    try:

        print("Connecting to Gmail SMTP...")
        print("Sending password reset email...")

        fm = FastMail(conf)

        await fm.send_message(message)

        print("EMAIL SENT SUCCESSFULLY")
        print("--------------------------------------")

    except Exception as e:

        print("======================================")
        print("EMAIL SENDING FAILED")
        print("ERROR TYPE:", type(e).__name__)
        print("ERROR:", str(e))
        print("======================================")

        # Remove token because email was not sent
        reset_tokens.pop(token, None)

        raise HTTPException(
            status_code=500,
            detail="Unable to send password reset email"
        )

    return {
        "message": (
            "If an account exists with this email, "
            "a password reset link has been sent."
        )
    }


# =========================================================
# RESET PASSWORD
# =========================================================

class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest
):

    reset_data = reset_tokens.get(request.token)

    if not reset_data:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset link"
        )

    # -----------------------------------------------------
    # Check expiration
    # -----------------------------------------------------

    if datetime.utcnow() > reset_data["expires_at"]:

        del reset_tokens[request.token]

        raise HTTPException(
            status_code=400,
            detail="Reset link has expired"
        )

    # -----------------------------------------------------
    # Validate password
    # -----------------------------------------------------

    if len(request.new_password) < 6:

        raise HTTPException(
            status_code=400,
            detail="Password must contain at least 6 characters"
        )

    # -----------------------------------------------------
    # Find user
    # -----------------------------------------------------

    db = Session(bind=engine)

    user = db.query(User).filter(
        User.id == reset_data["user_id"]
    ).first()

    if not user:

        db.close()

        reset_tokens.pop(request.token, None)

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # -----------------------------------------------------
    # Update password
    # -----------------------------------------------------

    user.password = pwd_context.hash(
        request.new_password
    )

    db.commit()
    db.close()

    # -----------------------------------------------------
    # Prevent token reuse
    # -----------------------------------------------------

    del reset_tokens[request.token]

    return {
        "message": (
            "Password reset successfully. "
            "You can now sign in."
        )
    }