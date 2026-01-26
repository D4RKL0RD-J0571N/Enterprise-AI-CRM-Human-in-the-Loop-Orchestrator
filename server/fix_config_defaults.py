import sqlite3
import os

def fix_existing_config():
    db_path = os.path.join(os.path.dirname(__file__), "sql_app.db")
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print("Fixing existing AIConfig record with default values...")

    try:
        # Update any NULL values in the new columns
        cursor.execute("""
            UPDATE ai_configs 
            SET 
                preferred_model = COALESCE(preferred_model, 'gpt-4-turbo'),
                logo_url = COALESCE(logo_url, NULL),
                primary_color = COALESCE(primary_color, '#2563eb'),
                ui_density = COALESCE(ui_density, 'comfortable')
            WHERE id = 1
        """)
        
        conn.commit()
        print("✅ AIConfig record updated successfully")
        
        # Verify
        cursor.execute("SELECT preferred_model, logo_url, primary_color, ui_density FROM ai_configs WHERE id = 1")
        result = cursor.fetchone()
        print(f"Current values: preferred_model={result[0]}, logo_url={result[1]}, primary_color={result[2]}, ui_density={result[3]}")
        
    except Exception as e:
        print(f"Error: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    fix_existing_config()
