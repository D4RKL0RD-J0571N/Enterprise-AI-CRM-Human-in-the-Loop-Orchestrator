import requests
import os

def test_ai_connectivity():
    # Attempt to hit LM Studio via the gateway
    url = "http://host.docker.internal:1234/v1/models"
    print(f"Testing AI Connectivity to: {url}")
    
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            print("✅ AI Connection Successful (LM Studio is up)")
            print(f"Models available: {response.json()}")
        else:
            print(f"❌ AI Connection Failed: {response.status_code}")
    except Exception as e:
        print(f"❌ AI Connection Error: {e}")

if __name__ == "__main__":
    test_ai_connectivity()
