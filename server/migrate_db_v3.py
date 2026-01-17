from database import SessionLocal, engine
from sqlalchemy import text
import sys

def migrate():
    print("Migrating 'conversations' table (v3)...")
    db = SessionLocal()
    try:
        # Check if column exists is hard in generic SQL, so we just try/except the add column
        try:
            db.execute(text("ALTER TABLE conversations ADD COLUMN is_archived BOOLEAN DEFAULT 0"))
            print("Added 'is_archived' column.")
        except Exception as e:
            print(f"Skipped 'is_archived' (might exist): {e}")

        try:
            db.execute(text("ALTER TABLE conversations ADD COLUMN is_pinned BOOLEAN DEFAULT 0"))
            print("Added 'is_pinned' column.")
        except Exception as e:
            print(f"Skipped 'is_pinned' (might exist): {e}")

        db.commit()
        print("Migration v3 successful!")
    except Exception as e:
        print(f"Migration failed: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
