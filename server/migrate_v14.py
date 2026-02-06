import sqlite3
import os

def migrate():
    db_path = "server/sql_app.db"
    if not os.path.exists(db_path):
        db_path = "sql_app.db"
    
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    columns_to_add = [
        ("messages", "is_violation", "BOOLEAN DEFAULT 0"),
        ("messages", "external_id", "VARCHAR(255)"),
        ("conversations", "auto_ai_enabled", "BOOLEAN DEFAULT 1")
    ]

    try:
        print("Migrating database...")
        for table, col, col_type in columns_to_add:
            try:
                cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
                print(f"Added column '{col}' to table '{table}'.")
            except sqlite3.OperationalError as e:
                if "duplicate column name" in str(e).lower():
                    print(f"Column '{col}' in '{table}' already exists.")
                else:
                    print(f"Failed to add '{col}' to '{table}': {e}")

        conn.commit()
        print("Migration successful.")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
