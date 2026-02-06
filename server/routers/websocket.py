from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import time
import asyncio
import json
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
            if self.msg_count % 10 == 0:
                 logger.warning(f"Rate limit exceeded ({self.msg_count}/{self.RATE_LIMIT}). Dropping message.")
            return

        for connection in self.active_connections[:]:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error sending broadcast: {e}")
                self.disconnect(connection)

    async def heartbeat(self):
        """Send a PING to all clients and remove inactive ones."""
        if not self.active_connections:
            return
            
        ping = json.dumps({"type": "ping", "timestamp": time.time()})
        logger.debug(f"Sending heartbeat to {len(self.active_connections)} clients")
        
        for connection in self.active_connections[:]:
            try:
                await connection.send_text(ping)
            except Exception:
                # If send fails, assume client is gone
                self.disconnect(connection)

    async def broadcast_security_alert(self, phone: str, reason: str):
        import json
        alert = {
            "type": "security_alert",
            "phone": phone,
            "reason": reason,
            "timestamp": time.time()
        }
        await self.broadcast(json.dumps(alert))

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
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        manager.disconnect(websocket)

async def start_heartbeat():
    """Background task to run heartbeat every 30 seconds."""
    while True:
        await asyncio.sleep(30)
        await manager.heartbeat()

# Heartbeat is now managed by the app lifespan in main.py
