from sqlalchemy import create_engine, text
import os

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Running migration v17: Create Products and Orders tables...")
        
        try:
            # 1. Create Products Table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name VARCHAR,
                    description TEXT,
                    price INTEGER,
                    currency VARCHAR DEFAULT 'CRC',
                    stock_quantity INTEGER DEFAULT 0,
                    is_active BOOLEAN DEFAULT 1,
                    tenant_id VARCHAR DEFAULT 'default',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                );
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_products_id ON products (id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_products_name ON products (name)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_products_tenant_id ON products (tenant_id)"))
            
            # 2. Create Orders Table
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS orders (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    client_id INTEGER,
                    total_amount INTEGER,
                    currency VARCHAR DEFAULT 'CRC',
                    status VARCHAR DEFAULT 'pending',
                    items_json TEXT,
                    external_id VARCHAR,
                    payment_method VARCHAR,
                    tenant_id VARCHAR DEFAULT 'default',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(client_id) REFERENCES clients(id)
                );
            """))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_orders_id ON orders (id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_orders_tenant_id ON orders (tenant_id)"))
            conn.execute(text("CREATE INDEX IF NOT EXISTS ix_orders_external_id ON orders (external_id)"))
            
            conn.commit()
            print("Migration v17 completed successfully.")
            
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    migrate()
