from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import whatsapp, websocket, conversations
from database import engine, Base
from logger import setup_logger

logger = setup_logger("main")

# Create tables
try:
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables verified/created successfully")
except Exception as e:
    logger.critical(f"Database initialization failed: {e}")

app = FastAPI(title="WhatsApp AI Dashboard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(whatsapp.router)
app.include_router(websocket.router)
app.include_router(conversations.router)

@app.get("/")
def root():
    logger.debug("Health check endpoint accessed")
    return {"status": "ok", "message": "Backend is running"}
