import sqlite3
import os

def migrate():
    db_paths = [
        "server/sql_app.db",
        "sql_app.db",
        "server/whatsapp_ai.db",
        "server/data/app.db",
        "server/database/app.db",
        "whatsapp_ai.db"
    ]
    
    migrated_any = False
    for db_path in db_paths:
        if not os.path.exists(db_path):
            continue
            
        migrated_any = True
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        print(f"Migrating database: {db_path}")

        # AI CONFIG COLUMNS
        cols_to_add = [
            ("whatsapp_phone_id", "TEXT"),
            ("whatsapp_driver", "TEXT DEFAULT 'mock'")
        ]

        for col_name, col_type in cols_to_add:
            try:
                cursor.execute(f"ALTER TABLE ai_configs ADD COLUMN {col_name} {col_type}")
                print(f" -> Column {col_name} added to 'ai_configs' in {db_path}.")
            except sqlite3.OperationalError as e:
                print(f" -> Skipping {col_name} in {db_path}: {e}")

        # SNAPSHOT COLUMNS
        for col_name, col_type in cols_to_add:
            try:
                cursor.execute(f"ALTER TABLE ai_config_snapshots ADD COLUMN {col_name} {col_type}")
                print(f" -> Column {col_name} added to 'ai_config_snapshots' in {db_path}.")
            except sqlite3.OperationalError as e:
                print(f" -> Skipping {col_name} in snapshots {db_path}: {e}")

        conn.commit()
        conn.close()
        
    if not migrated_any:
        print(f"Error: No database files found in any of {db_paths}")
        return

    print("Migration V12 completed successfully for all active databases.")

if __name__ == "__main__":
    migrate()
