import sqlite3
import shutil
import os
import subprocess

# 1. Configuration
OLD_DB = "sql_app.db"
LICENSE_KEY = "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJidXNpbmVzc19uYW1lIjoiSm9zdGluIEVudGVycHJpc2VzIiwicGxhbiI6ImVudGVycHJpc2UiLCJmZWF0dXJlcyI6WyJ3aGF0c2FwcCIsImhpdGxfcmV2aWV3IiwiYW5hbHl0aWNzIiwiYnJhbmRpbmciXSwibWF4X3NlYXRzIjoxMCwiZXhwaXJlc19hdCI6IjIwMjctMDItMDZUMDk6MjE6NTYuMzMwMjE1WiJ9.OBFmmA-rCjs4-Xavr0mHjm7LRWPn5zVyey4E_x4RX9bMqy2Wsx3x-iBEnA5gecnLQScL2TWG5rbNpu3TjQB8DQ"
CONTAINER_NAME = "vacant-universe-backend-1"
TARGET_PATH = "/app/database/app.db"

def restore():
    print(f"Injecting license into {OLD_DB}...")
    conn = sqlite3.connect(OLD_DB)
    cursor = conn.cursor()
    
    # Ensure current config is active and has the license
    cursor.execute("UPDATE ai_configs SET license_key = ?, is_active = 1 WHERE business_name = 'CarBlockCR'", (LICENSE_KEY,))
    if cursor.rowcount == 0:
        print("Warning: Could not find business 'CarBlockCR', updating first available record.")
        cursor.execute("UPDATE ai_configs SET license_key = ?, is_active = 1 LIMIT 1", (LICENSE_KEY,))
    
    conn.commit()
    conn.close()
    print("License injected.")

    print(f"Copying {OLD_DB} to container {CONTAINER_NAME}...")
    try:
        # Use docker cp to overwrite the database file in the volume
        subprocess.run(["docker", "cp", OLD_DB, f"{CONTAINER_NAME}:{TARGET_PATH}"], check=True)
        print("Database successfully restored to Docker volume.")
        
        # Restart the container to ensure it picks up the new file
        print("Restarting backend...")
        subprocess.run(["docker", "restart", CONTAINER_NAME], check=True)
        print("Backend restarted.")
        
    except Exception as e:
        print(f"Error during restoration: {e}")

if __name__ == "__main__":
    restore()
