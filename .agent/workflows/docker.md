---
description: how to run the project using Docker
---

# Docker Workflow

This workflow describes how to build and run the entire project (Backend, Frontend, and Redis) using Docker Compose.

// turbo-all
## 🚀 Running the Project

1. Ensure the Docker daemon is running on your system.
2. Build and start the containers in detached mode:
   ```powershell
   docker compose up -d --build
   ```
3. Verify that the services are running:
   ```powershell
   docker compose ps
   ```

## 🛑 Stopping the Project

1. Stop and remove the containers:
   ```powershell
   docker compose down
   ```

## 🔍 Viewing Logs

1. View logs for all services:
   ```powershell
   docker compose logs -f
   ```
2. View logs for a specific service (e.g., backend):
   ```powershell
   docker compose logs -f backend
   ```

## 📂 Accessing Services

- **Frontend**: [http://localhost:5173](http://localhost:5173)
- **Backend API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
