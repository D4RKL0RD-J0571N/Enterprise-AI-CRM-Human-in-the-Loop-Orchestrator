import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), "sql_app.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    tables = ["clients", "ai_configs", "ai_datasets", "users", "security_audits", "audit_logs", "conversations", "messages", "ai_config_snapshots"]

    print("Running migration v15: Multi-Tenant Data Isolation...")

    try:
        for table in tables:
            # Check if column exists
            cursor.execute(f"PRAGMA table_info({table})")
            cols = [row[1] for row in cursor.fetchall()]
            if "tenant_id" not in cols:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN tenant_id TEXT DEFAULT 'default'")
                print(f"Added tenant_id to {table}")
            else:
                print(f"tenant_id already exists in {table}")

        conn.commit()
        print("Migration v15 completed successfully.")
    except Exception as e:
        print(f"Migration v15 failed: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
