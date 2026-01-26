import sqlite3
import os
import datetime
import json

def migrate():
    db_path = os.path.join("server", "sql_app.db")
    if not os.path.exists(db_path):
        print(f"Database not found at {db_path}.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    # 1. Add missing columns with defaults
    new_columns = [
        ("auto_send_delay", "INTEGER DEFAULT 30"),
        ("translate_messages", "BOOLEAN DEFAULT 0"),
        ("identity_prompt", "TEXT"),
        ("grounding_template", "TEXT"),
        ("intent_rules_json", "TEXT DEFAULT '[]'"),
        ("fallback_message", "TEXT DEFAULT 'I am currently having trouble processing your request.'"),
        ("updated_at", "DATETIME")
    ]

    cursor.execute("PRAGMA table_info(ai_configs)")
    existing_columns = {row[1]: row for row in cursor.fetchall()}

    for col_name, col_type in new_columns:
        if col_name not in existing_columns:
            print(f"Adding column {col_name} to ai_configs...")
            try:
                cursor.execute(f"ALTER TABLE ai_configs ADD COLUMN {col_name} {col_type}")
            except Exception as e:
                print(f"Error adding {col_name}: {e}")
        else:
            print(f"Column {col_name} already exists.")

    # 2. Fix NULLs in existing rows and inject new behavioral rules
    print("Fixing NULL values and updating rules...")
    cursor.execute("SELECT id, rules_json FROM ai_configs WHERE is_active = 1 LIMIT 1")
    row = cursor.fetchone()
    if row:
        config_id, rules_json = row
        rules = json.loads(rules_json or "[]")
        
        new_behavioral_rules = [
            "Do not use more than 1 or 2 emojis per message. Avoid using them in every sentence.",
            "If a user asks about something unrelated to our business (like other restaurants, politics, etc.), politely steer them back to our products and do NOT offer an order CTA.",
            "Only end with '¿Le gustaría hacer su pedido? 😊' if the user specifically asked for a product, price, or purchase details. DO NOT use this phrase for greetings, system errors, or off-topic questions (like restaurants, politics, etc.)."
        ]
        
        updated = False
        for nr in new_behavioral_rules:
            if nr not in rules:
                rules.append(nr)
                updated = True
        
        if updated:
            cursor.execute("UPDATE ai_configs SET rules_json = ? WHERE id = ?", (json.dumps(rules), config_id))
            print("Successfully injected new behavioral rules into existing config.")

    cursor.execute("""
        UPDATE ai_configs SET 
        intent_rules_json = COALESCE(intent_rules_json, '[]'),
        rules_json = COALESCE(rules_json, '[]'),
        forbidden_topics_json = COALESCE(forbidden_topics_json, '[]'),
        keywords_json = COALESCE(keywords_json, '[]'),
        fallback_message = COALESCE(fallback_message, 'I am currently having trouble processing your request.'),
        auto_send_delay = COALESCE(auto_send_delay, 30),
        translate_messages = COALESCE(translate_messages, 0),
        updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
    """)

    # 3. Ensure snapshots table
    print("Ensuring snapshots table...")
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS ai_config_snapshots (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        config_id INTEGER REFERENCES ai_configs(id),
        business_name TEXT,
        business_description TEXT,
        tone TEXT,
        rules_json TEXT,
        auto_respond_threshold INTEGER,
        review_threshold INTEGER,
        auto_send_delay INTEGER,
        keywords_json TEXT,
        forbidden_topics_json TEXT,
        language_code TEXT,
        translate_messages BOOLEAN,
        identity_prompt TEXT,
        grounding_template TEXT,
        intent_rules_json TEXT,
        fallback_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        version_label TEXT
    )
    """)

    conn.commit()
    conn.close()
    print("Migration and data fix complete.")

if __name__ == "__main__":
    migrate()
