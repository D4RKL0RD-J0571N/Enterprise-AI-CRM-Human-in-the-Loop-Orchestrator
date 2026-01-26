import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), "sql_app.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Running migration v7: B2B Multi-Tenancy & Dynamic Branding...")

    try:
        # 1. Update AIConfig
        cursor.execute("PRAGMA table_info(ai_configs)")
        config_cols = [row[1] for row in cursor.fetchall()]

        if "logo_url" not in config_cols:
            cursor.execute("ALTER TABLE ai_configs ADD COLUMN logo_url TEXT")
            print("Added column logo_url to ai_configs")
        
        if "primary_color" not in config_cols:
            cursor.execute("ALTER TABLE ai_configs ADD COLUMN primary_color TEXT DEFAULT '#2563eb'")
            print("Added column primary_color to ai_configs")

        if "ui_density" not in config_cols:
            cursor.execute("ALTER TABLE ai_configs ADD COLUMN ui_density TEXT DEFAULT 'comfortable'")
            print("Added column ui_density to ai_configs")

        # 2. Update AIConfigSnapshot
        cursor.execute("PRAGMA table_info(ai_config_snapshots)")
        snapshot_cols = [row[1] for row in cursor.fetchall()]

        if "logo_url" not in snapshot_cols:
            cursor.execute("ALTER TABLE ai_config_snapshots ADD COLUMN logo_url TEXT")
            print("Added column logo_url to ai_config_snapshots")

        if "primary_color" not in snapshot_cols:
            cursor.execute("ALTER TABLE ai_config_snapshots ADD COLUMN primary_color TEXT DEFAULT '#2563eb'")
            print("Added column primary_color to ai_config_snapshots")

        if "version_name" not in snapshot_cols:
            cursor.execute("ALTER TABLE ai_config_snapshots ADD COLUMN version_name TEXT")
            print("Added column version_name to ai_config_snapshots")

        if "is_locked" not in snapshot_cols:
            cursor.execute("ALTER TABLE ai_config_snapshots ADD COLUMN is_locked BOOLEAN DEFAULT 0")
            print("Added column is_locked to ai_config_snapshots")

        conn.commit()
        print("Migration v7 completed successfully.")

    except Exception as e:
        print(f"Error during migration v7: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
