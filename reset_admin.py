from sqlalchemy import create_engine, text
import bcrypt
import os

# Database config
DATABASE_URL = "sqlite:///server/sql_app.db"
engine = create_engine(DATABASE_URL)

def get_password_hash(password):
    return bcrypt.hashpw(
        password.encode('utf-8'), 
        bcrypt.gensalt()
    ).decode('utf-8')

def reset_admin():
    new_password = "admin_password"
    hashed = get_password_hash(new_password)
    
    with engine.connect() as conn:
        # Check if admin exists
        result = conn.execute(text("SELECT id, username FROM users WHERE username = 'admin'"))
        admin = result.fetchone()
        
        if admin:
            print(f"User 'admin' found (ID: {admin[0]}). Updating password...")
            conn.execute(
                text("UPDATE users SET hashed_password = :pwd WHERE username = 'admin'"),
                {"pwd": hashed}
            )
            print("✅ Password updated to 'admin_password'")
        else:
            print("User 'admin' not found. Creating...")
            conn.execute(
                text("INSERT INTO users (username, hashed_password, role, is_active) VALUES ('admin', :pwd, 'admin', 1)"),
                {"pwd": hashed}
            )
            print("✅ Created user 'admin' with password 'admin_password'")
        
        conn.commit()

if __name__ == "__main__":
    reset_admin()
