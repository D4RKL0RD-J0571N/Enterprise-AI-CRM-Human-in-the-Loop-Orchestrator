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

        print(f"Migrating database: {db_path} to V13 (Auth & Audit)")

        # Create Users table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE,
                hashed_password TEXT,
                role TEXT DEFAULT 'operator',
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        """)
        print(f" -> Table 'users' verified/created in {db_path}.")

        # Create Audit Logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS audit_logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                user_id INTEGER,
                action TEXT,
                resource TEXT,
                details TEXT,
                FOREIGN KEY (user_id) REFERENCES users(id)
            )
        """)
        print(f" -> Table 'audit_logs' verified/created in {db_path}.")

        conn.commit()
        conn.close()
        
    if not migrated_any:
        print(f"Error: No database files found in any of {db_paths}")
        return

    print("Migration V13 completed successfully for all active databases.")

if __name__ == "__main__":
    migrate()
