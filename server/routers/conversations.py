from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from database import get_db
from models import Client, Conversation, Message
from pydantic import BaseModel
from logger import setup_logger
import datetime

router = APIRouter(prefix="/conversations", tags=["Conversations"])
logger = setup_logger("conversations")

# Pydantic models for response
class MessageResponse(BaseModel):
    id: int
    sender: str
    content: str
    timestamp: datetime.datetime
    status: str
    is_ai_generated: bool
    confidence: Optional[int] = 0
    metadata_json: Optional[str] = "{}"
    
    class Config:
        orm_mode = True

class ConversationSummary(BaseModel):
    id: int
    client_id: int
    client_name: str
    client_phone: str
    last_message: Optional[str]
    last_message_time: Optional[datetime.datetime]
    is_active: bool
    is_archived: bool = False
    is_pinned: bool = False

    class Config:
        orm_mode = True

class MessageUpdate(BaseModel):
    content: str

@router.get("/", response_model=List[ConversationSummary])
def get_conversations(db: Session = Depends(get_db)):
    """
    Get all conversations with their latest status for the sidebar.
    """
    # Query all clients that have conversations
    # For simplicity, we assume one active conversation per client for now, 
    # or we just list the clients.
    
    results = []
    
    # Get all clients
    clients = db.query(Client).all()
    
    for client in clients:
        # Get latest conversation
        conv = db.query(Conversation).filter(
            Conversation.client_id == client.id
        ).order_by(Conversation.started_at.desc()).first()
        
        if conv:
            # Get latest message
            last_msg = db.query(Message).filter(
                Message.conversation_id == conv.id
            ).order_by(Message.timestamp.desc()).first()
            
            results.append({
                "id": conv.id,
                "client_id": client.id,
                "client_name": client.name,
                "client_phone": client.phone_number,
                "last_message": last_msg.content if last_msg else "No messages",
                "last_message_time": last_msg.timestamp if last_msg else conv.started_at,
                "is_active": conv.is_active,
                "is_archived": conv.is_archived,
                "is_pinned": conv.is_pinned
            })
            
    # Sort by pinned first, then time desc
    results.sort(key=lambda x: (x["is_pinned"], x["last_message_time"]), reverse=True)
    return results

@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
def get_conversation_messages(conversation_id: int, db: Session = Depends(get_db)):
    """
    Get full message history for a conversation.
    """
    messages = db.query(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.timestamp.asc()).all()
    
    return messages

from routers.websocket import manager
import json

@router.post("/messages/{message_id}/approve")
async def approve_message(message_id: int, db: Session = Depends(get_db)):
    """
    Approve a pending AI message to be sent.
    """
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    msg.status = "sent"
    db.commit()
    logger.info(f"Message {message_id} APPROVED and marked as sent")
    
    # Broadcast update
    client_phone = msg.conversation.client.phone_number
    await manager.broadcast(json.dumps({
        "id": msg.id,
        "sender": "agent",
        "content": msg.content,
        "phone": client_phone,
        "timestamp": msg.timestamp.isoformat(),
        "status": "sent",
        "is_ai_generated": True
    }))
    
    return {"status": "approved"}

@router.post("/messages/{message_id}/reject")
async def reject_message(message_id: int, db: Session = Depends(get_db)):
    """
    Reject (delete) a pending AI message.
    """
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    db.delete(msg)
    db.commit()
    logger.info(f"Message {message_id} REJECTED and deleted")
    
    # Broadcast deletion so UI updates? 
    # Or just returning success is enough if frontend optimistically removes it.
    # But other clients might need to know.
    # We can send a special "delete" event or just rely on re-fetch.
    # For now, let's just return success.
    
    return {"status": "rejected"}

@router.put("/messages/{message_id}")
async def edit_message(message_id: int, update: MessageUpdate, db: Session = Depends(get_db)):
    """
    Edit a pending message content.
    """
    msg = db.query(Message).filter(Message.id == message_id).first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    msg.content = update.content
    db.commit()
    logger.info(f"Message {message_id} EDITED by operator")
    
    return {"status": "updated", "content": msg.content}

@router.post("/{conversation_id}/archive")
async def archive_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv.is_archived = True
    db.commit()
    logger.info(f"Conversation {conversation_id} ARCHIVED")
    return {"status": "archived"}

@router.post("/{conversation_id}/unarchive")
async def unarchive_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv.is_archived = False
    db.commit()
    return {"status": "unarchived"}

@router.post("/{conversation_id}/pin")
async def pin_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv.is_pinned = True
    db.commit()
    logger.info(f"Conversation {conversation_id} PINNED")
    return {"status": "pinned"}

@router.post("/{conversation_id}/unpin")
async def unpin_conversation(conversation_id: int, db: Session = Depends(get_db)):
    conv = db.query(Conversation).filter(Conversation.id == conversation_id).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv.is_pinned = False
    db.commit()
    return {"status": "unpinned"}
