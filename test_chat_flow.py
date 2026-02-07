import requests
import json
import time

# Configuration
BASE_URL = "http://127.0.0.1:8000"
PHONE_NUMBER = "+15550009999"

def test_chat_flow():
    print("\n--- CHAT FLOW TEST ---")
    
    # 1. Send Webhook (User Message)
    webhook_url = f"{BASE_URL}/whatsapp/webhook"
    
    # Using the "Mock" payload format supported by whatsapp.py
    payload = {
        "sender": PHONE_NUMBER,
        "message": "Hello, are you an AI?",
        "id": f"wamid.test.{int(time.time())}"
    }
    
    print(f"Sending message from {PHONE_NUMBER}...")
    start_time = time.time()
    try:
        res = requests.post(webhook_url, json=payload)
        latency = time.time() - start_time
        
        if res.status_code == 200:
            data = res.json()
            print(f"✅ Webhook accepted in {latency:.2f}s")
            
            # Check response structure
            if "reply" in data:
                print(f"🤖 AI Response: {data['reply']}")
                # If reply is present, it means it was auto-responded (high confidence)
                # or just returned as part of the synchronous processing in dev mode.
            elif "status" in data:
                 print(f"ℹ️ Status: {data['status']} (Reason: {data.get('reason')})")
        else:
            print(f"❌ Webhook failed: {res.status_code} {res.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

    # 2. Verify Conversation persistence (via Admin API or just implication)
    # We can try to authenticate and check messages if we want strictly E2E verify.
    # For now, the webhook response is a good enough integration test of the AI pipeline.

if __name__ == "__main__":
    test_chat_flow()
