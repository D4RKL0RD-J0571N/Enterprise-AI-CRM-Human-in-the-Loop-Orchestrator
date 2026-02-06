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

        try:
            # Add columns to messages
            cursor.execute("ALTER TABLE messages ADD COLUMN media_url TEXT")
            cursor.execute("ALTER TABLE messages ADD COLUMN media_type TEXT")
            print(f" -> Columns media_url and media_type added to 'messages' in {db_path}.")
        except sqlite3.OperationalError as e:
            print(f" -> Skipping messages columns in {db_path}: {e}")

        try:
            # Add column to ai_configs
            cursor.execute("ALTER TABLE ai_configs ADD COLUMN suggestions_json TEXT DEFAULT '[]'")
            print(f" -> Column suggestions_json added to 'ai_configs' in {db_path}.")
        except sqlite3.OperationalError as e:
            print(f" -> Skipping ai_configs columns in {db_path}: {e}")

        conn.commit()
        conn.close()
        
    if not migrated_any:
        print(f"Error: No database files found in any of {db_paths}")
        return

    print("Migration V11 completed successfully for all active databases.")
    print("Migration V11 completed successfully.")

if __name__ == "__main__":
    migrate()
