from sqlalchemy import create_engine, inspect
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///database/app.db")
print(f"Connecting to: {DATABASE_URL}")

try:
    engine = create_engine(DATABASE_URL)
    inspector = inspect(engine)
    tables = inspector.get_table_names()
    print("Tables found:", tables)
    
    if "ai_configs" in tables:
        print("ai_configs columns:", [c['name'] for c in inspector.get_columns("ai_configs")])
except Exception as e:
    print(f"Error: {e}")
