from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import time
from logger import setup_logger

logger = setup_logger("websocket")

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.msg_count = 0
        self.last_reset = time.time()
        self.RATE_LIMIT = 100 # msgs per second

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
        # Rolling window rate limiter
        now = time.time()
        if now - self.last_reset > 1.0:
            self.msg_count = 0
            self.last_reset = now
            
        self.msg_count += 1
        
        if self.msg_count > self.RATE_LIMIT:
            # Shed load - drop message if rate exceeded to protect UI
            # In a real system we might buffer or prioritize critical alerts
            if self.msg_count % 10 == 0: # Log every 10th dropped message to avoid spamming logs
                 logger.warning(f"Rate limit exceeded ({self.msg_count}/{self.RATE_LIMIT}). Dropping message.")
            return

        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()
router = APIRouter(prefix="/ws", tags=["WebSocket"])

@router.websocket("/chat")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # We keep the connection open.
            # If the client sends data, we can handle it here, 
            # but mostly we use this channel to PUSH data to client.
            data = await websocket.receive_text()
            # echo or ignore
            pass
    except WebSocketDisconnect:
        manager.disconnect(websocket)
