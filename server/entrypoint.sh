#!/bin/sh

# Ensure directory for SQLite exists if using volumes
mkdir -p /app/database

echo "Running migrations..."
# Run specific migration for License Key
python migrate_v16.py

echo "Starting Uvicorn..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
