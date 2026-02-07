import os
import sys
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Add server directory to path for imports
sys.path.append('/app')
from models import User, Base

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///database/app.db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_password_hash(password):
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def reset_admin():
    db = SessionLocal()
    print(f"Connecting to: {DATABASE_URL}")
    
    # Check if admin exists
    user = db.query(User).filter(User.username == "Jostin").first()
    if not user:
        print("User 'Jostin' not found. Creating...")
        hashed_pw = get_password_hash("admin")
        new_user = User(
            username="Jostin",
            hashed_password=hashed_pw,
            role="admin",
            is_active=True
        )
        db.add(new_user)
        db.commit()
        print("✅ Created user 'Jostin' with password 'admin'")
    else:
        # Reset password ensuring it matches
        user.hashed_password = get_password_hash("admin")
        db.commit()
        print("✅ User 'Jostin' exists. Password reset to 'admin'.")
    db.close()

if __name__ == "__main__":
    reset_admin()
