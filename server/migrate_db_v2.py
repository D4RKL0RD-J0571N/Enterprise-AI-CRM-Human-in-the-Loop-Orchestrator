import sqlite3

def migrate():
    conn = sqlite3.connect('sql_app.db')
    cursor = conn.cursor()
    
    try:
        print("Migrating 'messages' table (v2)...")
        
        # Add confidence column
        try:
            cursor.execute("ALTER TABLE messages ADD COLUMN confidence INTEGER DEFAULT 0")
            print("Added 'confidence' column.")
        except sqlite3.OperationalError as e:
            if "duplicate column name" in str(e):
                print("'confidence' column already exists.")
            else:
                raise e

        # Add metadata_json column
        try:
            cursor.execute("ALTER TABLE messages ADD COLUMN metadata_json TEXT DEFAULT '{}'")
            print("Added 'metadata_json' column.")
        except sqlite3.OperationalError as e:
             if "duplicate column name" in str(e):
                print("'metadata_json' column already exists.")
             else:
                raise e
                
        conn.commit()
        print("Migration v2 successful!")
        
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    migrate()
