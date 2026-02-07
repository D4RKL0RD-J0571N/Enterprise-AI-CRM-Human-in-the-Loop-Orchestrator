#!/bin/sh

# Ensure directory for SQLite exists if using volumes
mkdir -p /app/database

echo "Running migrations..."
# Run specific migration for License Key
python migrate_v16.py
# Run migration for E-commerce Models
python migrate_v17.py
# Run migration for Multi-Channel Integrations
python migrate_v18.py
# Run migration for Notifications Support
python migrate_v19.py

echo "Starting Uvicorn..."
exec uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1
