import sqlite3
import os

db_path = "server/sql_app.db"
if os.path.exists(db_path):
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    cursor.execute("SELECT license_key FROM ai_configs WHERE is_active=1;")
    row = cursor.fetchone()
    if row:
        print(f"Current License Key: {row[0]}")
    else:
        print("No active config found")
    conn.close()
else:
    print(f"Database not found at {db_path}")
