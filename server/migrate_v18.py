from sqlalchemy import create_engine, text
import os

# Database URL
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")

def migrate():
    engine = create_engine(DATABASE_URL)
    with engine.connect() as conn:
        print("Running migration v18: Add Multi-Channel Integration columns...")
        
        # 1. Update ai_configs table
        try:
            result = conn.execute(text("PRAGMA table_info(ai_configs)"))
            columns = [row[1] for row in result.fetchall()]
            
            new_columns = [
                ("email_smtp_server", "VARCHAR"),
                ("email_smtp_port", "INTEGER DEFAULT 587"),
                ("email_user", "VARCHAR"),
                ("email_password", "VARCHAR"),
                ("email_from_name", "VARCHAR"),
                ("email_driver", "VARCHAR DEFAULT 'mock'"),
                ("facebook_api_token", "VARCHAR"),
                ("facebook_page_id", "VARCHAR"),
                ("instagram_business_id", "VARCHAR"),
                ("meta_driver", "VARCHAR DEFAULT 'mock'")
            ]
            
            for col_name, col_type in new_columns:
                if col_name not in columns:
                    print(f"Adding {col_name} column to ai_configs...")
                    conn.execute(text(f"ALTER TABLE ai_configs ADD COLUMN {col_name} {col_type}"))
            
            conn.commit()
            print("AIConfig table migration successful.")
        except Exception as e:
            print(f"Failed to migrate ai_configs: {e}")

        # 2. Update ai_config_snapshots table
        try:
            result = conn.execute(text("PRAGMA table_info(ai_config_snapshots)"))
            columns = [row[1] for row in result.fetchall()]
            
            snapshot_columns = [
                ("whatsapp_driver", "VARCHAR DEFAULT 'mock'"),
                ("email_driver", "VARCHAR DEFAULT 'mock'"),
                ("meta_driver", "VARCHAR DEFAULT 'mock'")
            ]
            
            for col_name, col_type in snapshot_columns:
                if col_name not in columns:
                    print(f"Adding {col_name} column to ai_config_snapshots...")
                    conn.execute(text(f"ALTER TABLE ai_config_snapshots ADD COLUMN {col_name} {col_type}"))
            
            conn.commit()
            print("AIConfigSnapshot table migration successful.")
        except Exception as e:
            print(f"Failed to migrate ai_config_snapshots: {e}")

if __name__ == "__main__":
    migrate()
