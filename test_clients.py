import requests
import os
import sys

# Configuration
BASE_URL = "http://127.0.0.1:8000"
USERNAME = "Jostin"
PASSWORD = "admin"

def get_token():
    url = f"{BASE_URL}/auth/login"
    data = {"username": USERNAME, "password": PASSWORD}
    try:
        res = requests.post(url, data=data)
        if res.status_code == 200:
            return res.json().get("access_token")
    except: pass
    return None

def test_clients():
    token = get_token()
    if not token:
        print("❌ Auth failed")
        return
    print("\n--- CLIENTS TEST ---")
    headers = {"Authorization": f"Bearer {token}"}
    res = requests.get(f"{BASE_URL}/clients", headers=headers)
    if res.status_code == 200:
        print(f"✅ Listed {len(res.json())} clients")
    else:
        print(f"❌ List failed: {res.status_code}")

if __name__ == "__main__":
    test_clients()
