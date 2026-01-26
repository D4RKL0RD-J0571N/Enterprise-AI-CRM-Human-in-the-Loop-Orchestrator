import sqlite3
import os

def migrate():
    db_path = os.path.join(os.path.dirname(__file__), "sql_app.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Running migration v5: Add Multilingual Support to AIConfig...")

    try:
        # Check if columns already exist
        cursor.execute("PRAGMA table_info(ai_configs)")
        columns = [row[1] for row in cursor.fetchall()]

        if "language_code" not in columns:
            cursor.execute("ALTER TABLE ai_configs ADD COLUMN language_code TEXT DEFAULT 'es-CR'")
            print("Added column: language_code")
        
        if "translate_messages" not in columns:
            cursor.execute("ALTER TABLE ai_configs ADD COLUMN translate_messages BOOLEAN DEFAULT 0")
            print("Added column: translate_messages")

        conn.commit()
        print("Migration v5 completed successfully.")

    except Exception as e:
        print(f"Error during migration v5: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
