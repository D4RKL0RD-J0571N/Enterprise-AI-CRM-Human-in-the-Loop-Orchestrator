import jwt
import sqlite3

db_path = "server/sql_app.db"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()
cursor.execute("SELECT license_key FROM ai_configs WHERE is_active=1;")
row = cursor.fetchone()
if row:
    key = row[0]
    # Decode without verification to inspect claims
    payload = jwt.decode(key, options={"verify_signature": False})
    print(f"Payload: {payload}")
else:
    print("No key")
conn.close()
