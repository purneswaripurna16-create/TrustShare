import json
import urllib.request
import urllib.error

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from auth_utils import verify_access_token
from database.connection import engine
from models.activity_log import ActivityLog


router = APIRouter()

security = HTTPBearer()

OLLAMA_URL = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "gemma3:4b"


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
# CALL LOCAL OLLAMA / GEMMA
# =========================================================

def ask_gemma(prompt: str):
    request_data = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False
    }

    request_body = json.dumps(
        request_data
    ).encode("utf-8")

    request = urllib.request.Request(
        OLLAMA_URL,
        data=request_body,
        headers={
            "Content-Type": "application/json"
        },
        method="POST"
    )

    try:
        with urllib.request.urlopen(
            request,
            timeout=120
        ) as response:

            response_data = json.loads(
                response.read().decode("utf-8")
            )

            return response_data.get(
                "response",
                ""
            )

    except urllib.error.URLError as error:
        raise HTTPException(
            status_code=503,
            detail=(
                "Ollama is not available. "
                "Please make sure Ollama is running."
            )
        ) from error

    except Exception as error:
        raise HTTPException(
            status_code=500,
            detail=f"Gemma AI analysis failed: {str(error)}"
        ) from error


# =========================================================
# AI SECURITY ANALYZER
# =========================================================

@router.post("/ai/security-analyze")
def analyze_security(
    current_user: dict = Depends(get_current_user)
):
    db = Session(bind=engine)

    try:
        activities = (
            db.query(ActivityLog)
            .filter(
                ActivityLog.user_id ==
                current_user["user_id"]
            )
            .order_by(
                ActivityLog.created_at.desc()
            )
            .limit(50)
            .all()
        )

        activity_data = []

        for activity in activities:
            activity_data.append({
                "action": activity.action,
                "filename": activity.filename,
                "details": activity.details,
                "created_at": str(
                    activity.created_at
                ),
                "ip_address": activity.ip_address
            })

    finally:
        db.close()

    prompt = f"""
You are the AI Security Analyzer for TrustShare,
a secure file-sharing application.

Analyze the following recent activity for the current user.

Activity:
{json.dumps(activity_data, indent=2)}

Give a concise security assessment.

Return exactly these sections:

Risk Level:
Risk Score:
Reason:
Recommendation:

Rules:

1. Risk Level must be LOW, MEDIUM, HIGH, or CRITICAL.
2. Risk Score must be a number from 0 to 100.
3. Consider repeated failed logins.
4. Consider successful logins.
5. Consider file uploads.
6. Consider file downloads.
7. Consider file sharing.
8. Consider permission changes.
9. Consider temporary links.
10. Consider other security-related activity.
11. Do not claim that an account is blocked or locked.
12. Keep the response concise and easy to understand.
"""

    analysis = ask_gemma(prompt)

    return {
        "success": True,
        "model": OLLAMA_MODEL,
        "analysis": analysis
    }
# =========================================================
# AI SECURITY INSIGHTS
# =========================================================

@router.post("/ai/security-insights")
def generate_security_insights(
    current_user: dict = Depends(get_current_user)
):
    db = Session(bind=engine)

    try:
        activities = (
            db.query(ActivityLog)
            .filter(
                ActivityLog.user_id ==
                current_user["user_id"]
            )
            .order_by(
                ActivityLog.created_at.desc()
            )
            .limit(100)
            .all()
        )

        activity_data = []

        for activity in activities:
            activity_data.append({
                "action": activity.action,
                "filename": activity.filename,
                "details": activity.details,
                "created_at": str(
                    activity.created_at
                )
            })

    finally:
        db.close()

    prompt = f"""
You are the AI Security Insights assistant
for TrustShare, a secure file-sharing application.

Analyze the following recent activity data.

Activity:
{json.dumps(activity_data, indent=2)}

Provide a concise summary of the user's
security and file-usage patterns.

Return exactly these sections:

Security Summary:
Activity Insights:
Storage and File Usage:
Suspicious Patterns:
Recommendations:

Rules:

1. Mention important login/security patterns.
2. Mention upload, download, and sharing activity.
3. Mention temporary links or permission changes if present.
4. Identify repeated or unusual security-related patterns.
5. Do not claim that an account is blocked or locked.
6. Do not invent activity that is not present in the data.
7. Keep each section concise and easy to understand.
"""

    insights = ask_gemma(prompt)

    return {
        "success": True,
        "model": OLLAMA_MODEL,
        "insights": insights
    }