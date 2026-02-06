from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import whatsapp, websocket, conversations, admin, auth, system
from database import engine, Base
from prometheus_client import make_asgi_app
from logger import setup_logger

import os

logger = setup_logger("main")

# CORS Configurations
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

# Create tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created successfully")
except Exception as e:
    logger.critical(f"Database initialization failed: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start worker tasks
    import asyncio
    from services.maintenance import cleanup_stale_messages
    from routers.websocket import start_heartbeat
    
    # Run tasks in background
    cleanup_task = asyncio.create_task(cleanup_stale_messages())
    heartbeat_task = asyncio.create_task(start_heartbeat())
    
    logger.info("Lifespan: Maintenance and Heartbeat tasks started")
    
    yield
    
    # Shutdown: Clean up if needed
    cleanup_task.cancel()
    heartbeat_task.cancel()
    logger.info("Lifespan: Worker tasks stopped")

app = FastAPI(title="WhatsApp AI Dashboard", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(whatsapp.router)
app.include_router(websocket.router)
app.include_router(conversations.router)
app.include_router(admin.router)
app.include_router(system.router)

# Prometheus Metrics
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

@app.get("/")
def root():
    logger.debug("Health check endpoint accessed")
    return {"status": "ok", "message": "Backend is running"}
