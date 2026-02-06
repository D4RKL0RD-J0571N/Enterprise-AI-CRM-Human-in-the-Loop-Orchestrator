import os
from cryptography.fernet import Fernet
from logger import setup_logger

logger = setup_logger("encryption")

# Load master key from environment
# In production, this MUST be a 32-byte base64-encoded string.
# generated via Fernet.generate_key().decode()
MASTER_KEY = os.getenv("MASTER_ENCRYPTION_KEY")

if not MASTER_KEY:
    # Development fallback - NOT FOR PRODUCTION
    # This is a fixed key for dev consistency, but in prod it should fail if missing.
    MASTER_KEY = "7K_AvYE7oOoeKVawub33koSNoLRQK9VQfYbT58kDx5w=" 

try:
    cipher_suite = Fernet(MASTER_KEY.encode())
except Exception as e:
    logger.error(f"Failed to initialize encryption suite: {e}")
    # In a real system, we might want to halt if the key is invalid
    cipher_suite = None

def encrypt_string(plain_text: str) -> str:
    """Encrypt a string and return the base64-encoded ciphertext."""
    if not plain_text or not cipher_suite:
        return plain_text
    
    try:
        cipher_text = cipher_suite.encrypt(plain_text.encode())
        return cipher_text.decode()
    except Exception as e:
        logger.error(f"Encryption failed: {e}")
        return plain_text

def decrypt_string(cipher_text: str) -> str:
    """Decrypt a base64-encoded ciphertext and return the plaintext."""
    if not cipher_text or not cipher_suite:
        return cipher_text
    
    # If the text doesn't look like base64 or Fernet, it might already be plaintext
    # (e.g. during migration or if encryption was disabled)
    try:
        decrypted_text = cipher_suite.decrypt(cipher_text.encode())
        return decrypted_text.decode()
    except Exception:
        # If decryption fails, it might be because it's already plaintext
        # or the key changed. For transition safety, return original.
        return cipher_text
