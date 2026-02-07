import requests
import json
import os

# Configuration
BASE_URL = "http://localhost:8000"
USERNAME = "admin"
PASSWORD = "admin_password" # Need to verify this credential or use a token

def login():
    url = f"{BASE_URL}/auth/token"
    # Assuming standard OAuth2 password flow or similar from auth.py
    # I need to check auth.py to be sure about the endpoint and params.
    # But usually it's /auth/token with username/password form data.
    
    # Let's try to get a token first.
    # If auth is required for ecommerce, we need a token.
    # Inspecting ecommerce.py: depends on get_enterprise_plan -> likely requires auth.
    pass

def test_create_product():
    print("Testing Product Creation...")
    
    # 1. Login to get token (Skipping for now, assuming I can use a test token or disable auth if needed, 
    # but better to do it right. I'll check auth.py in next step if this fails).
    # Actually, I'll try to hit the endpoint directly first to see if it's reachable.
    
    url = f"{BASE_URL}/ecommerce/products"
    payload = {
        "name": "Test Product from Script",
        "description": "Created via python script",
        "price": 1000, # 10.00
        "currency": "USD",
        "stock_quantity": 10,
        "is_active": True
    }
    
    try:
        # Note: This will likely fail 401 Unauthorized without a token.
        # But if it returns 404, then the path is wrong.
        res = requests.post(url, json=payload)
        print(f"Status Code: {res.status_code}")
        print(f"Response: {res.text}")
    except Exception as e:
        print(f"Request failed: {e}")

if __name__ == "__main__":
    test_create_product()
