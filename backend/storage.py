import os
from dotenv import load_dotenv
from supabase import create_client

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")
SUPABASE_BUCKET = os.getenv("SUPABASE_BUCKET", "trustshare-files")

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is missing from .env")

if not SUPABASE_SECRET_KEY:
    raise RuntimeError("SUPABASE_SECRET_KEY is missing from .env")

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
)


def upload_encrypted_file(
    storage_path: str,
    encrypted_data: bytes
):
    return supabase.storage.from_(
        SUPABASE_BUCKET
    ).upload(
        storage_path,
        encrypted_data,
        {
            "content-type": "application/octet-stream",
            "upsert": "true"
        }
    )


def download_encrypted_file(
    storage_path: str
):
    return supabase.storage.from_(
        SUPABASE_BUCKET
    ).download(storage_path)


def delete_encrypted_file(
    storage_path: str
):
    return supabase.storage.from_(
        SUPABASE_BUCKET
    ).remove([storage_path])