import pytest
import os
import sys

# Add server directory to path
sys.path.append(os.path.join(os.getcwd(), "server"))

from services.auth_service import AuthService
from database import SessionLocal
from models import User

def test_password_hashing():
    password = "test_password"
    hashed = AuthService.get_password_hash(password)
    assert hashed != password
    assert AuthService.verify_password(password, hashed) is True
    assert AuthService.verify_password("wrong", hashed) is False

def test_token_creation():
    data = {"sub": "Jostin"}
    token = AuthService.create_access_token(data)
    assert token is not None
    assert isinstance(token, str)

@pytest.mark.asyncio
async def test_authenticate_user():
    # We need a mock DB or test DB for this
    # For now, let's just test the logic that doesn't hit DB if possible
    pass
