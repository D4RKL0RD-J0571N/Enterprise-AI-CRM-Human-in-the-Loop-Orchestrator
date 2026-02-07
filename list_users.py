from sqlalchemy import create_engine, select
import os
import sys

sys.path.append('/app')
from models import User

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///database/app.db")
engine = create_engine(DATABASE_URL)

with engine.connect() as conn:
    from sqlalchemy import text
    res = conn.execute(text("SELECT username FROM users"))
    users = [r[0] for r in res]
    print(f"USERS IN DB: {users}")
