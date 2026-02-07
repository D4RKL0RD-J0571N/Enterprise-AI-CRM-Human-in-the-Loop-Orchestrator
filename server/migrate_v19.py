from sqlalchemy import create_engine, text
import os

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Running migration v19: Create notifications table...")
        
        try:
            # Create notifications table if it doesn't exist
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS notifications (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    type VARCHAR,
                    severity VARCHAR,
                    title VARCHAR,
                    description TEXT,
                    is_read BOOLEAN DEFAULT 0,
                    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
                    tenant_id VARCHAR DEFAULT 'default',
                    metadata_json TEXT DEFAULT '{}'
                )
            """))
            
            # Index for performance
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_notifications_id ON notifications (id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_notifications_tenant_id ON notifications (tenant_id)"))
            
            conn.commit()
            print("Notifications table created successfully.")
        except Exception as e:
            print(f"Failed to create notifications table: {e}")

if __name__ == "__main__":
    migrate()
