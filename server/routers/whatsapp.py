from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from services.ai_agent import AIAgent
from database import get_db
from models import Message, Conversation, Client
from routers.websocket import manager
from logger import setup_logger
import datetime
import json

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])
logger = setup_logger("whatsapp")
ai_agent = AIAgent()

@router.post("/webhook")
async def whatsapp_webhook(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    message_content = data.get("message", "")
    sender_phone = data.get("sender", "unknown")
    
    logger.info(f"Incoming message from {sender_phone}: {message_content[:50]}...")
    
    # 1. Find or create Client
    client = db.query(Client).filter(Client.phone_number == sender_phone).first()
    if not client:
        logger.info(f"Creating new client for phone: {sender_phone}")
        client = Client(phone_number=sender_phone, name=f"User {sender_phone}")
        db.add(client)
        db.commit()
        db.refresh(client)

    # 2. Find or create Active Conversation
    conversation = db.query(Conversation).filter(
        Conversation.client_id == client.id, 
        Conversation.is_active == True
    ).first()
    
    if not conversation:
        logger.info(f"Starting new conversation for client: {client.id}")
        conversation = Conversation(client_id=client.id)
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # 3. Save User Message
    user_msg = Message(
        conversation_id=conversation.id,
        sender="user",
        content=message_content
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # Broadcast User Message
    await manager.broadcast(json.dumps({
        "id": user_msg.id,
        "sender": "user",
        "content": message_content,
        "phone": sender_phone,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }))

    # 4. Generate AI Response
    logger.debug(f"Triggering AI response generation for {sender_phone}")
    ai_result = ai_agent.generate_response(sender_phone, message_content)
    
    # Handle legacy string return just in case, though we updated it
    if isinstance(ai_result, str):
        ai_response_text = ai_result
        confidence = 0
        metadata = {}
    else:
        ai_response_text = ai_result["content"]
        confidence = ai_result["confidence"]
        metadata = ai_result["metadata"]

    # 5. Save AI Message
    ai_msg = Message(
        conversation_id=conversation.id,
        sender="agent",
        content=ai_response_text,
        status="pending",
        is_ai_generated=True,
        confidence=confidence,
        metadata_json=json.dumps(metadata)
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg) # Get ID

    # Broadcast AI Message (Pending)
    await manager.broadcast(json.dumps({
        "id": ai_msg.id,
        "sender": "agent",
        "content": ai_response_text,
        "phone": sender_phone,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "status": "pending",
        "is_ai_generated": True,
        "confidence": confidence,
        "metadata": metadata
    }))

    return {"reply": ai_response_text}
