from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

import os

from database.connection import engine, Base
from models.user import User
from models.file import File as FileModel
from models.file_share import FileShare


from routes.test_route import router
from routes.auth import router as auth_router
from routes.share import router as share_router

from auth_utils import verify_access_token


# =========================
# CREATE APP
# =========================

app = FastAPI()


# =========================
# DATABASE
# =========================

Base.metadata.create_all(bind=engine)


# =========================
# CORS
# =========================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================
# ROUTERS
# =========================

app.include_router(router)
app.include_router(auth_router)
app.include_router(share_router)


# =========================
# SECURITY
# =========================

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


# =========================
# ROOT
# =========================

@app.get("/")
def root():
    return {
        "message": "TrustShare Backend is running"
    }


# =========================
# UPLOAD FILE
# =========================
@app.post("/upload")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    upload_folder = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "uploads"
    )

    os.makedirs(upload_folder, exist_ok=True)

    filename = os.path.basename(file.filename)

    file_path = os.path.join(
        upload_folder,
        filename
    )

    # Save the physical file
    with open(file_path, "wb") as buffer:
        buffer.write(await file.read())

    # Save file ownership in database
    db = Session(bind=engine)

    existing_file = db.query(FileModel).filter(
    FileModel.filename == filename
    ).first()

    if existing_file:
        existing_file.owner_id = current_user["user_id"]
    else:
        new_file = FileModel(
        filename=filename,
        owner_id=current_user["user_id"]
        )  

        db.add(new_file)

    db.commit()
    db.close()

    return {
        "message": "File uploaded successfully",
        "filename": filename,
        "uploaded_by": current_user["email"]
    }

# =========================
# GET FILES
# =========================

@app.get("/files")
def get_files(
    current_user: dict = Depends(get_current_user)
):
    db = Session(bind=engine)

    files = db.query(FileModel).filter(
        FileModel.owner_id == current_user["user_id"]
    ).all()

    db.close()

    return {
        "files": [
            file.filename
            for file in files
        ]
    }

# =========================
# DOWNLOAD FILE
# =========================

@app.get("/download/{filename}")
def download_file(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    db = Session(bind=engine)

    file_record = db.query(FileModel).filter(
        FileModel.filename == filename,
        FileModel.owner_id == current_user["user_id"]
    ).first()

    db.close()

    if not file_record:
        raise HTTPException(
            status_code=404,
            detail="File not found or you do not have permission"
        )

    upload_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "uploads"
    )

    file_path = os.path.join(
        upload_dir,
        filename
    )

    if not os.path.isfile(file_path):
        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/pdf"
    )

# =========================
# DELETE FILE
# =========================

@app.delete("/delete/{filename}")
def delete_file(
    filename: str,
    current_user: dict = Depends(get_current_user)
):
    db = Session(bind=engine)

    file_record = db.query(FileModel).filter(
        FileModel.filename == filename,
        FileModel.owner_id == current_user["user_id"]
    ).first()

    if not file_record:
        db.close()

        raise HTTPException(
            status_code=404,
            detail="File not found or you do not have permission"
        )

    upload_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "uploads"
    )

    file_path = os.path.join(
        upload_dir,
        filename
    )

    if not os.path.isfile(file_path):
        db.close()

        raise HTTPException(
            status_code=404,
            detail="File not found"
        )

    os.remove(file_path)

    db.delete(file_record)
    db.commit()
    db.close()

    return {
        "message": "File deleted successfully",
        "filename": filename
    }