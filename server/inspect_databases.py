import sqlite3
import os

def inspect_db(db_name):
    print(f"\n--- Inspecting {db_name} ---")
    if not os.path.exists(db_name):
        print(f"File {db_name} not found.")
        return
    
    conn = sqlite3.connect(db_name)
    cursor = conn.cursor()
    
    cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
    tables = [r[0] for r in cursor.fetchall() if not r[0].startswith('sqlite_')]
    
    for t in tables:
        try:
            cursor.execute(f"SELECT COUNT(*) FROM {t}")
            count = cursor.fetchone()[0]
            print(f"Table {t}: {count} records")
            
            if t == 'ai_configs' and count > 0:
                cursor.execute("SELECT business_name, preferred_model FROM ai_configs")
                configs = cursor.fetchall()
                for c in configs:
                    print(f"  Config: {c[0]} (Model: {c[1]})")
        except Exception as e:
            print(f"  Error reading {t}: {e}")
            
    conn.close()

if __name__ == "__main__":
    inspect_db("sql_app.db")
    inspect_db("whatsapp_ai.db")
    # Also check if there is an app.db if we are in a volume (unlikely to be here)
    if os.path.exists("database/app.db"):
        inspect_db("database/app.db")
