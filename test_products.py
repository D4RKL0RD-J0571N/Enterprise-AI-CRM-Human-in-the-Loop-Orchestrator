import requests
import json
import os
import sys

# Configuration
BASE_URL = "http://127.0.0.1:8000"
USERNAME = "Jostin"
PASSWORD = "admin"

def get_token():
    print(f"Authenticating as {USERNAME} on {BASE_URL}...")
    url = f"{BASE_URL}/auth/login"
    data = {"username": USERNAME, "password": PASSWORD}
    try:
        res = requests.post(url, data=data)
        if res.status_code == 200:
            token = res.json().get("access_token")
            print("✅ Authentication successful.")
            return token
        else:
            print(f"❌ Authentication failed: {res.status_code} {res.text}")
            return None
    except Exception as e:
        print(f"❌ Auth request failed: {e}")
        return None

def test_create_product(token):
    print("\n[TEST] Product Creation")
    url = f"{BASE_URL}/ecommerce/products"
    import time
    name = f"Deep Test Item {int(time.time())}"
    payload = {"name": name, "description": "Deep test", "price": 1000, "stock_quantity": 50}
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.post(url, json=payload, headers=headers)
    if res.status_code == 200:
        print(f"✅ Created: {res.json()['id']}")
        return res.json()['id']
    else:
        print(f"❌ Failed: {res.status_code}")
    return None

if __name__ == "__main__":
    token = get_token()
    if token:
        pid = test_create_product(token)
        if pid:
            requests.delete(f"{BASE_URL}/ecommerce/products/{pid}", headers={"Authorization": f"Bearer {token}"})
            print("✅ Cleaned up.")
    else:
        sys.exit(1)
