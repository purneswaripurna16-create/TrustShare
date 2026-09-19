from cryptography.hazmat.primitives.ciphers.aead import AESGCM
import os
import base64
from pathlib import Path


def generate_key():
    """
    Generate a unique 256-bit AES key.
    AES-256 requires a 32-byte key.
    """
    return AESGCM.generate_key(bit_length=256)


def encrypt_file(input_data: bytes, key: bytes):
    """
    Encrypt file data using AES-256-GCM.
    """

    # AES-GCM requires a unique 12-byte nonce
    nonce = os.urandom(12)

    aesgcm = AESGCM(key)

    # Encrypt the file
    encrypted_data = aesgcm.encrypt(
        nonce,
        input_data,
        None
    )

    return nonce, encrypted_data


def decrypt_file(encrypted_data: bytes, key: bytes, nonce: bytes):
    """
    Decrypt AES-256-GCM encrypted file data.
    """

    aesgcm = AESGCM(key)

    decrypted_data = aesgcm.decrypt(
        nonce,
        encrypted_data,
        None
    )

    return decrypted_data


def encode_key(key: bytes):
    """
    Convert binary key to Base64 so it can be stored safely.
    """
    return base64.urlsafe_b64encode(key).decode("utf-8")


def decode_key(encoded_key: str):
    """
    Convert Base64 key back to bytes.
    """
    return base64.urlsafe_b64decode(encoded_key.encode("utf-8"))

def save_key(filename: str, key: bytes):
    filename = safe_filename(filename)

    keys_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "keys"
    )

    os.makedirs(keys_dir, exist_ok=True)

    try:
        os.chmod(keys_dir, 0o700)
    except OSError:
        pass

    key_file = os.path.join(
        keys_dir,
        filename + ".key"
    )

    with open(key_file, "wb") as f:
        f.write(key)

    try:
        os.chmod(key_file, 0o600)
    except OSError:
        pass

    return key_file

def load_key(filename: str):
    filename = safe_filename(filename)

    keys_dir = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "keys"
    )

    key_file = os.path.join(
        keys_dir,
        filename + ".key"
    )

    if not os.path.isfile(key_file):
        raise FileNotFoundError("Encryption key not found")

    with open(key_file, "rb") as f:
        return f.read()
def safe_filename(filename: str) -> str:
    """
    Allow only the filename itself.
    Remove any directory/path components.
    """
    filename = Path(filename).name

    if not filename or filename in [".", ".."]:
        raise ValueError("Invalid filename")

    return filename