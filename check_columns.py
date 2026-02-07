from sqlalchemy import create_engine, inspect
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///database/app.db")

try:
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    cols = [c['name'] for c in inspector.get_columns("ai_configs")]
    
    if 'license_key' in cols:
        print("✅ license_key column EXISTS")
    else:
        print("❌ license_key column MISSING")
        
except Exception as e:
    print(f"Error: {e}")
