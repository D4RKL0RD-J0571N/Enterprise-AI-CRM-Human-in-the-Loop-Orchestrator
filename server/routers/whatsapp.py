from fastapi import APIRouter, Request, Depends, BackgroundTasks
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_async_db, AsyncSessionLocal
from models import Message, Conversation, Client
from routers.websocket import manager
from logger import setup_logger
from services.ai_agent import AIAgent
import datetime
import json
import asyncio

router = APIRouter(prefix="/whatsapp", tags=["WhatsApp"])
logger = setup_logger("whatsapp")
ai_agent = AIAgent()

async def delayed_auto_send(msg_id: int, delay_minutes: int):
    """
    Background Task: Wait for delay_minutes, then auto-send if still pending.
    """
    if delay_minutes <= 0:
        return
    
    logger.info(f"Scheduled auto-send for Message {msg_id} in {delay_minutes} minutes.")
    await asyncio.sleep(delay_minutes * 60)
    
    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(Message).filter(Message.id == msg_id))
            msg = result.scalars().first()
            if msg and msg.status == "pending":
                logger.info(f"Auto-send delay reached for Message {msg_id}. Sending now.")
                msg.status = "sent"
                await db.commit()
                
                # Broadcast update
                await manager.broadcast(json.dumps({
                    "type": "message_update",
                    "id": msg.id,
                    "status": "sent"
                }))
        finally:
            await db.close()

@router.post("/webhook")
async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks, db: AsyncSession = Depends(get_async_db)):
    raw_data = await request.json()
    
    # 1. Detect Payload Type (Meta Production vs Simulator)
    is_meta = raw_data.get("object") == "whatsapp_business_account"
    
    if is_meta:
        # Process Meta Production Payload
        try:
            value = raw_data["entry"][0]["changes"][0]["value"]
            
            # 1.1 Handle Status Updates (Read/Delivered)
            if "statuses" in value:
                status_data = value["statuses"][0]
                wamid = status_data["id"]
                new_status = status_data["status"] # "delivered", "read", "sent", "failed"
                
                logger.info(f"META STATUS UPDATE: {wamid} -> {new_status}")
                
                result = await db.execute(select(Message).filter(Message.external_id == wamid))
                msg = result.scalars().first()
                if msg:
                    msg.status = new_status
                    await db.commit()
                    
                    # Broadcast status update to dashboard
                    await manager.broadcast(json.dumps({
                        "type": "message_status_update",
                        "id": msg.id,
                        "status": new_status,
                        "phone": msg.conversation.client.phone_number
                    }))
                return {"status": "ok"}

            # 1.2 Handle Incoming Messages
            if "messages" in value:
                msg_data = value["messages"][0]
                sender_phone = msg_data["from"]
                message_content = msg_data.get("text", {}).get("body", "")
                external_id = msg_data["id"]
                media_url = None
                media_type = None
                
                # Extract profile name if available
                profile_name = value.get("contacts", [{}])[0].get("profile", {}).get("name")
                
                # Check for media (Simplified)
                if msg_data["type"] != "text":
                    media_type = msg_data["type"]
                    # Meta requires a separate API call to get the media URL from the media ID
                    # For now, we'll store the media_id in media_url as a placeholder
                    media_url = msg_data.get(media_type, {}).get("id")
                    message_content = f"[{media_type.upper()} ATTACHMENT]"
            else:
                return {"status": "ok", "detail": "not a message or status"}
        except (KeyError, IndexError):
            # Fallback for simulator if it sends object="whatsapp_business_account" but flat structure
            message_content = raw_data.get("message", "")
            sender_phone = raw_data.get("sender", "unknown")
            external_id = raw_data.get("id")
            media_url = raw_data.get("media_url")
            media_type = raw_data.get("media_type")
            profile_name = None
    else:
        # Process Simulator/Mock Payload (Backward Compatibility)
        message_content = raw_data.get("message", "")
        sender_phone = raw_data.get("sender", "unknown")
        external_id = raw_data.get("id") # Optional wamid for testing
        media_url = raw_data.get("media_url")
        media_type = raw_data.get("media_type")
        profile_name = None

    logger.info(f"Processing message from {sender_phone}: {message_content[:50]}...")
    
    # 2. Find or create Client
    result = await db.execute(select(Client).filter(Client.phone_number == sender_phone))
    client = result.scalars().first()
    if not client:
        name = profile_name if profile_name else f"User {sender_phone}"
        client = Client(phone_number=sender_phone, name=name)
        db.add(client)
        await db.commit()
        await db.refresh(client)
    elif profile_name and client.name.startswith("User "):
         # Update name if we just got a real one from Meta
         client.name = profile_name
         await db.commit()

    # 3. Find or create Active Conversation
    result = await db.execute(select(Conversation).filter(
        Conversation.client_id == client.id, 
        Conversation.is_active == True
    ))
    conversation = result.scalars().first()
    
    if not conversation:
        conversation = Conversation(client_id=client.id)
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)

    # 4. Save User Message
    user_msg = Message(
        conversation_id=conversation.id,
        sender="user",
        content=message_content,
        media_url=media_url,
        media_type=media_type,
        external_id=external_id
    )
    db.add(user_msg)
    await db.commit()
    await db.refresh(user_msg)

    # Broadcast User Message
    await manager.broadcast(json.dumps({
        "type": "new_message",
        "id": user_msg.id,
        "sender": "user",
        "content": message_content,
        "phone": sender_phone,
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "media_url": user_msg.media_url,
        "media_type": user_msg.media_type
    }))

    # 4. Generate AI Response
    logger.debug(f"Triggering AI response generation for {sender_phone}")
    
    # 4.1 Sentinel Shield: Absolute Blocking
    from guardrail.engine import GuardrailEngine
    from models import AIConfig
    
    result = await db.execute(select(AIConfig).filter(AIConfig.is_active == True))
    config = result.scalars().first()
    forbidden_topics = json.loads(config.forbidden_topics_json) if config else []
    
    guardrail_result = GuardrailEngine.prescan_message(message_content, forbidden_topics)
    
    if guardrail_result.classification in ["security_violation", "legal_violation", "medical_violation"]:
        logger.warning(f"SENTINEL: Blocking {guardrail_result.classification} from {sender_phone}")
        
        # 1. Save user message with violation flag (Already saved as user_msg above, but let's update it)
        user_msg.is_violation = True
        user_msg.metadata_json = json.dumps({
            "reason": f"Sentinel Block: {guardrail_result.classification}",
            "keywords": guardrail_result.triggered_keywords
        })
        await db.commit()
        
        # 2. Notify Dashboard via WS (Red Alert)
        await manager.broadcast_security_alert(sender_phone, f"Violation: {guardrail_result.classification}")
        
        # 3. TERMINATE: No AI response
        return {"status": "blocked", "reason": "sentinel_violation"}

    # 4.2 Manual AI Override (HITL Manual Force Mode)
    if not conversation.auto_ai_enabled:
        logger.info(f"AI Response DISABLED for conversation {conversation.id} (Manual Force Mode)")
        return {"status": "skipped", "reason": "manual_force_mode"}

    ai_result = await ai_agent.generate_response(sender_phone, message_content, db=db)
    
    ai_response_text = ai_result["content"]
    confidence = ai_result["confidence"]
    metadata = ai_result["metadata"]
    intent = metadata.get("intent", "General")

    # 5. Decision Engine: Check Thresholds for Auto-Response
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
    await db.commit()
    await db.refresh(ai_msg) # Get ID

    # 7. Schedule Background Delay Task if needed
    if should_delay_send and config and config.auto_send_delay > 0:
        background_tasks.add_task(
            delayed_auto_send, 
            ai_msg.id, 
            config.auto_send_delay
        )

    # Broadcast AI Message
    await manager.broadcast(json.dumps({
        "type": "new_message",
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
