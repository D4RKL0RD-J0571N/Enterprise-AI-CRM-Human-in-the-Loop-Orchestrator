# Server Restart Required

## Issue
After running database migrations (v6 and v7), the FastAPI server needs to be restarted to reload the SQLAlchemy model definitions.

## Why?
SQLAlchemy caches the model schema when the server starts. New columns added via migrations won't be recognized until the server restarts.

## Solution
**Restart the FastAPI server:**

```bash
# Stop the current server (Ctrl+C in the terminal where it's running)
# Then restart it:
cd server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## What We Fixed
1. ✅ Ran `migrate_db_v6.py` - Added `preferred_model` column
2. ✅ Ran `migrate_db_v7.py` - Added branding columns (`logo_url`, `primary_color`, `ui_density`)
3. ✅ Ran `fix_config_defaults.py` - Set default values for existing record
4. ✅ Added defensive `getattr()` in `admin.py` - Handles stale cache gracefully

## After Restart
The error `AttributeError: 'AIConfig' object has no attribute 'preferred_model'` will be resolved.

## Verification
After restarting, test the endpoint:
```bash
curl http://localhost:8000/admin/config
```

You should see the new fields:
- `preferred_model`: "gpt-4-turbo"
- `logo_url`: null
- `primary_color`: "#2563eb"
- `ui_density`: "comfortable"
