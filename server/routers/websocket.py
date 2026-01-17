from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: str):
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
