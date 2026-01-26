import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), "sql_app.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Running migration v6: SaaS Observability & Security Audits...")

    try:
        # 1. Update AIConfig
        cursor.execute("PRAGMA table_info(ai_configs)")
        config_cols = [row[1] for row in cursor.fetchall()]

        if "preferred_model" not in config_cols:
            cursor.execute("ALTER TABLE ai_configs ADD COLUMN preferred_model TEXT DEFAULT 'gpt-4-turbo'")
            print("Added column preferred_model to ai_configs")

        # 2. Update AIConfigSnapshot
        cursor.execute("PRAGMA table_info(ai_config_snapshots)")
        snapshot_cols = [row[1] for row in cursor.fetchall()]

        if "preferred_model" not in snapshot_cols:
            cursor.execute("ALTER TABLE ai_config_snapshots ADD COLUMN preferred_model TEXT DEFAULT 'gpt-4-turbo'")
            print("Added column preferred_model to ai_config_snapshots")

        # 3. Create SecurityAudit table (if create_all failed or wasn't run)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS security_audits (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                client_id TEXT,
                input_message TEXT,
                output_message TEXT,
                domain TEXT,
                intent TEXT,
                confidence INTEGER,
                latency_ms INTEGER,
                model_name TEXT,
                tokens_used INTEGER,
                status TEXT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                reasoning TEXT,
                triggered_keywords TEXT
            )
        """)
        print("Verified security_audits table existence.")

        conn.commit()
        print("Migration v6 completed successfully.")

    except Exception as e:
        print(f"Error during migration v6: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
