from fastapi import APIRouter, Request, Depends
from sqlalchemy.orm import Session
from services.ai_agent import AIAgent
from database import get_db
from models import Message, Conversation, Client
from routers.websocket import manager
from logger import setup_logger
from fastapi import BackgroundTasks
import datetime
import json
import asyncio

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])
logger = setup_logger("whatsapp")
ai_agent = AIAgent()

async def delayed_auto_send(msg_id: int, delay_minutes: int, manager, db_factory):
    """
    Background Task: Wait for delay_minutes, then auto-send if still pending.
    """
    if delay_minutes <= 0:
        return
    
    logger.info(f"Scheduled auto-send for Message {msg_id} in {delay_minutes} minutes.")
    await asyncio.sleep(delay_minutes * 60)
    
    # Get a new DB session for the background task
    db = db_factory()
    try:
        msg = db.query(Message).filter(Message.id == msg_id).first()
        if msg and msg.status == "pending":
            logger.info(f"Auto-send delay reached for Message {msg_id}. Sending now.")
            msg.status = "sent"
            db.commit()
            
            # Broadcast update
            await manager.broadcast(json.dumps({
                "type": "message_update",
                "id": msg.id,
                "status": "sent"
            }))
    finally:
        db.close()

@router.post("/webhook")
async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
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
    ai_result = ai_agent.generate_response(sender_phone, message_content, db=db)
    
    ai_response_text = ai_result["content"]
    confidence = ai_result["confidence"]
    metadata = ai_result["metadata"]
    intent = metadata.get("intent", "General")

    # 5. Decision Engine: Check Thresholds for Auto-Response
    from models import AIConfig
    config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
    
    # Defaults
    auto_threshold = 90
    if config:
        auto_threshold = config.auto_respond_threshold

    # Determine status
    msg_status = "pending"
    should_delay_send = False
    
    if intent == "out_of_scope":
        msg_status = "pending" # Always escalate forbidden topics
        logger.info(f"Escalating out-of-scope query from {sender_phone} to human operator.")
    elif confidence >= auto_threshold:
        msg_status = "sent"
        logger.info(f"Auto-responding to {sender_phone} (Confidence: {confidence}% >= Threshold: {auto_threshold}%)")
    elif config and confidence >= config.review_threshold:
        msg_status = "pending"
        should_delay_send = True
        logger.info(f"Queuing for DELAYED auto-send (Confidence: {confidence}% >= Review Threshold: {config.review_threshold}%)")
    else:
        logger.info(f"Queuing response to {sender_phone} for human review (Confidence: {confidence}% < Threshold: {auto_threshold}%)")

    # 6. Save AI Message
    ai_msg = Message(
        conversation_id=conversation.id,
        sender="agent",
        content=ai_response_text,
        status=msg_status,
        is_ai_generated=True,
        confidence=confidence,
        metadata_json=json.dumps(metadata)
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg) # Get ID

    # 7. Schedule Background Delay Task if needed
    if should_delay_send and config and config.auto_send_delay > 0:
        from database import SessionLocal
        background_tasks.add_task(
            delayed_auto_send, 
            ai_msg.id, 
            config.auto_send_delay, 
            manager, 
            SessionLocal
        )

    # Broadcast AI Message
    await manager.broadcast(json.dumps({
        "id": ai_msg.id,
        "sender": "agent",
        "content": ai_response_text,
        "phone": sender_phone,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "status": msg_status,
        "is_ai_generated": True,
        "confidence": confidence,
        "metadata": metadata
    }))

    return {"reply": ai_response_text}
