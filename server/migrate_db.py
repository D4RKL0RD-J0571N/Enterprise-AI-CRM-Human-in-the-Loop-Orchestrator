import sqlite3

def migrate():
    conn = sqlite3.connect('sql_app.db')
    cursor = conn.cursor()
    
    try:
        print("Migrating 'messages' table...")
        
        # Add status column
        try:
            cursor.execute("ALTER TABLE messages ADD COLUMN status VARCHAR DEFAULT 'sent'")
            print("Added 'status' column.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("'status' column already exists.")
            else:
                raise e

        # Add is_ai_generated column
        try:
            cursor.execute("ALTER TABLE messages ADD COLUMN is_ai_generated BOOLEAN DEFAULT 0")
            print("Added 'is_ai_generated' column.")
        except sqlite3.OperationalError as e:
             if "duplicate column name" in str(e):
                print("'is_ai_generated' column already exists.")
             else:
                raise e
                
        conn.commit()
        print("Migration successful!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
