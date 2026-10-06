from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os
import base64
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client


load_dotenv()


# =========================================================
# SUPABASE CONFIGURATION
# =========================================================

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SECRET_KEY = os.getenv("SUPABASE_SECRET_KEY")
SUPABASE_BUCKET = os.getenv(
    "SUPABASE_BUCKET",
    "trustshare-files"
)

KEY_ENCRYPTION_SECRET = os.getenv(
    "KEY_ENCRYPTION_SECRET"
)

if not SUPABASE_URL:
    raise RuntimeError("SUPABASE_URL is missing from .env")

if not SUPABASE_SECRET_KEY:
    raise RuntimeError(
        "SUPABASE_SECRET_KEY is missing from .env"
    )

if not KEY_ENCRYPTION_SECRET:
    raise RuntimeError(
        "KEY_ENCRYPTION_SECRET is missing from .env"
    )


supabase = create_client(
    SUPABASE_URL,
    SUPABASE_SECRET_KEY
)


# =========================================================
# MASTER KEY
# =========================================================

def get_master_key():
    """
    Get the 256-bit master key used to protect
    individual AES-256 file encryption keys.
    """

    try:
        master_key = base64.urlsafe_b64decode(
            KEY_ENCRYPTION_SECRET.encode("utf-8")
        )
    except Exception:
        raise RuntimeError(
            "KEY_ENCRYPTION_SECRET is not valid Base64"
        )

    if len(master_key) != 32:
        raise RuntimeError(
            "KEY_ENCRYPTION_SECRET must decode to 32 bytes"
        )

    return master_key


# =========================================================
# AES-256 FILE ENCRYPTION
# =========================================================

def generate_key():
    """
    Generate a unique 256-bit AES key.
    """
    return AESGCM.generate_key(
        bit_length=256
    )


def encrypt_file(
    input_data: bytes,
    key: bytes
):
    """
    Encrypt file data using AES-256-GCM.
    """

    nonce = os.urandom(12)

    aesgcm = AESGCM(key)

    encrypted_data = aesgcm.encrypt(
        nonce,
        input_data,
        None
    )

    return nonce, encrypted_data


def decrypt_file(
    encrypted_data: bytes,
    key: bytes,
    nonce: bytes
):
    """
    Decrypt file data using AES-256-GCM.
    """

    aesgcm = AESGCM(key)

    decrypted_data = aesgcm.decrypt(
        nonce,
        encrypted_data,
        None
    )

    return decrypted_data


# =========================================================
# KEY ENCODING
# =========================================================

def encode_key(key: bytes):
    return base64.urlsafe_b64encode(
        key
    ).decode("utf-8")


def decode_key(encoded_key: str):
    return base64.urlsafe_b64decode(
        encoded_key.encode("utf-8")
    )


# =========================================================
# ENCRYPTION KEY STORAGE
# =========================================================

def save_key(
    filename: str,
    key: bytes
):
    """
    Encrypt the file's AES key using the master key
    and store the protected key in Supabase Storage.
    """

    filename = safe_filename(filename)

    master_key = get_master_key()

    # Encrypt the individual file key
    nonce = os.urandom(12)

    aesgcm = AESGCM(master_key)

    encrypted_key = aesgcm.encrypt(
        nonce,
        key,
        None
    )

    # Store nonce + encrypted key
    protected_key_data = (
        nonce +
        encrypted_key
    )

    storage_path = (
        f"keys/{filename}.key.enc"
    )

    try:
        supabase.storage.from_(
            SUPABASE_BUCKET
        ).upload(
            storage_path,
            protected_key_data,
            {
                "content-type":
                    "application/octet-stream",
                "upsert": "true"
            }
        )

    except Exception as e:
        print(
            "Supabase key upload error:",
            e
        )

        raise RuntimeError(
            "Unable to securely store encryption key"
        )

    return storage_path


def load_key(filename: str):
    """
    Download the protected file key from Supabase,
    decrypt it using the master key,
    and return the original AES key.
    """

    filename = safe_filename(filename)

    master_key = get_master_key()

    storage_path = (
        f"keys/{filename}.key.enc"
    )

    try:
        protected_key_data = (
            supabase.storage
            .from_(SUPABASE_BUCKET)
            .download(storage_path)
        )

    except Exception as e:
        print(
            "Supabase key download error:",
            e
        )

        raise FileNotFoundError(
            "Encryption key not found"
        )

    # 12-byte nonce + encrypted key
    if len(protected_key_data) < 13:
        raise RuntimeError(
            "Invalid protected encryption key"
        )

    nonce = protected_key_data[:12]

    encrypted_key = (
        protected_key_data[12:]
    )

    try:
        aesgcm = AESGCM(master_key)

        key = aesgcm.decrypt(
            nonce,
            encrypted_key,
            None
        )

    except Exception as e:
        print(
            "Encryption key decryption error:",
            e
        )

        raise RuntimeError(
            "Unable to decrypt encryption key"
        )

    return key


# =========================================================
# SAFE FILENAME
# =========================================================

def safe_filename(filename: str) -> str:
    """
    Allow only the filename itself.
    Remove directory/path components.
    """

    filename = Path(filename).name

    if not filename or filename in [
        ".",
        ".."
    ]:
        raise ValueError(
            "Invalid filename"
        )

    return filename