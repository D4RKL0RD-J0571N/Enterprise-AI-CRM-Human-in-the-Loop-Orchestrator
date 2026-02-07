from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import joinedload
from database import get_async_db
from models import Client, Conversation, Message, AIConfig, User, AuditLog
from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from logger import setup_logger
from services.messaging_hub import MessagingHubService
from routers.auth import get_current_user
import datetime
import json
from services.metrics import MESSAGE_APPROVALS_TOTAL, MESSAGE_REJECTIONS_TOTAL, HUMAN_MESSAGES_TOTAL

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
    is_violation: Optional[bool] = False
    metadata_json: Optional[str] = "{}"
    
    model_config = ConfigDict(from_attributes=True)

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
    auto_ai_enabled: bool = True
    has_pending: bool = False
    channel: str = "whatsapp"

    model_config = ConfigDict(from_attributes=True)

class MessageUpdate(BaseModel):
    content: str

class MessageCreate(BaseModel):
    content: str

class BulkActionRequest(BaseModel):
    conversation_ids: List[int]
    action: str  # "archive", "delete"

class BulkMessageActionRequest(BaseModel):
    message_ids: List[int]
    action: str  # "delete"

class ClientInit(BaseModel):
    phone_number: str
    name: Optional[str] = None
    channel: Optional[str] = "whatsapp"

@router.post("/initiate")
async def initiate_conversation(init: ClientInit, db: AsyncSession = Depends(get_async_db)):
    """
    Get or create a conversation for a phone number.
    """
    result = await db.execute(select(Client).filter(Client.phone_number == init.phone_number))
    client = result.scalars().first()
    if not client:
        client = Client(phone_number=init.phone_number, name=init.name or f"User {init.phone_number}")
        db.add(client)
        await db.commit()
    
    result = await db.execute(select(Conversation).filter(
        Conversation.client_id == client.id, 
        Conversation.is_active == True
    ))
    conv = result.scalars().first()
    
    if not conv:
        conv = Conversation(client_id=client.id, is_active=True, channel=init.channel or "whatsapp")
        db.add(conv)
        await db.commit()
        await db.refresh(conv)
        
    return {"id": conv.id, "client_name": client.name, "client_phone": client.phone_number}

@router.get("/", response_model=List[ConversationSummary])
async def get_conversations(db: AsyncSession = Depends(get_async_db)):
    """
    Get all conversations with their latest status for the sidebar.
    """
    results = []
    
    # Get all clients
    result = await db.execute(select(Client))
    clients = result.scalars().all()
    
    for client in clients:
        # Get latest conversation
        conv_result = await db.execute(select(Conversation).filter(
            Conversation.client_id == client.id
        ).order_by(Conversation.started_at.desc()).limit(1))
        conv = conv_result.scalars().first()
        
        if conv:
            # Get latest message
            msg_result = await db.execute(select(Message).filter(
                Message.conversation_id == conv.id
            ).order_by(Message.timestamp.desc()).limit(1))
            last_msg = msg_result.scalars().first()
            
            # Check for pending messages
            pending_result = await db.execute(select(Message).filter(
                Message.conversation_id == conv.id,
                Message.status == "pending"
            ))
            has_pending = pending_result.scalars().first() is not None

            results.append({
                "id": conv.id,
                "client_id": client.id,
                "client_name": client.name,
                "client_phone": client.phone_number,
                "last_message": last_msg.content if last_msg else "No messages",
                "last_message_time": last_msg.timestamp if last_msg else conv.started_at,
                "is_active": conv.is_active,
                "is_archived": conv.is_archived,
                "is_pinned": conv.is_pinned,
                "auto_ai_enabled": conv.auto_ai_enabled,
                "has_pending": has_pending,
                "channel": conv.channel or "whatsapp"
            })
            
    # Sort by pinned first, then time desc
    results.sort(key=lambda x: (x["is_pinned"], x["last_message_time"]), reverse=True)
    return results

@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
async def get_conversation_messages(conversation_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    Get full message history for a conversation.
    """
    result = await db.execute(select(Message).filter(
        Message.conversation_id == conversation_id
    ).order_by(Message.timestamp.asc()))
    messages = result.scalars().all()
    
    return messages

from routers.websocket import manager
import json

@router.post("/messages/{message_id}/approve")
async def approve_message(message_id: int, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    """
    Approve a pending AI message to be sent.
    """
    result = await db.execute(
        select(Message)
        .options(joinedload(Message.conversation).joinedload(Conversation.client))
        .filter(Message.id == message_id)
    )
    msg = result.scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    msg.status = "sent"
    
    # --- AUTO-ORDER CREATION ---
    metadata = json.loads(msg.metadata_json or "{}")
    if metadata.get("requires_order_creation"):
        try:
            from models import Order, Product
            order_items = metadata.get("order_details", [])
            if order_items:
                total_amount = 0
                processed_items = []
                for item in order_items:
                    # Verify product and price
                    pid = item.get("product_id")
                    res = await db.execute(select(Product).filter(Product.id == pid))
                    product = res.scalars().first()
                    if product:
                        qty = item.get("quantity", 1)
                        price = product.price # Use actual DB price
                        total_amount += price * qty
                        processed_items.append({
                            "product_id": product.id,
                            "name": product.name,
                            "quantity": qty,
                            "price": price
                        })
                
                if processed_items:
                    new_order = Order(
                        client_id=msg.conversation.client_id,
                        total_amount=total_amount,
                        currency="CRC", # Default for now
                        items_json=json.dumps(processed_items),
                        status="pending"
                    )
                    db.add(new_order)
                    logger.info(f"AUTO-ORDER: Created Order for Client {msg.conversation.client_id} from Message {message_id}")
        except Exception as e:
            logger.error(f"Failed to auto-create order from message {message_id}: {e}")
    # ---------------------------

    await db.commit()
    MESSAGE_APPROVALS_TOTAL.inc()
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
    
    # --- OUTBOUND DELIVERY ---
    result = await db.execute(select(AIConfig).filter(AIConfig.is_active == True))
    config = result.scalars().first()
    if config:
        config_dict = {
            "whatsapp_driver": config.whatsapp_driver,
            "whatsapp_api_token": config.whatsapp_api_token,
            "whatsapp_phone_id": config.whatsapp_phone_id,
            "email_driver": config.email_driver,
            "meta_driver": config.meta_driver,
            "email_smtp_server": config.email_smtp_server,
            "facebook_api_token": config.facebook_api_token
        }
        # Use MessagingHub to detect channel and send
        adapter = MessagingHubService.get_adapter(msg.conversation.channel, config_dict)
        external_id = await adapter.send_message(to=client_phone, text=msg.content)
        
        if isinstance(external_id, str):
            msg.external_id = external_id
            await db.commit()
    # -------------------------

    # --- AUDIT LOG ---
    audit = AuditLog(
        user_id=current_user.id,
        action="APPROVE_MESSAGE",
        resource=f"Message {message_id}",
        details=f"Approved AI suggestion for {client_phone}"
    )
    db.add(audit)
    await db.commit()
    # -----------------
    
    return {"status": "approved"}

@router.post("/messages/{message_id}/reject")
async def reject_message(message_id: int, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    """
    Reject (delete) a pending AI message.
    """
    result = await db.execute(select(Message).filter(Message.id == message_id))
    msg = result.scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    await db.delete(msg)
    await db.commit()
    MESSAGE_REJECTIONS_TOTAL.inc()
    logger.info(f"Message {message_id} REJECTED and deleted by {current_user.username}")
    
    # --- AUDIT LOG ---
    audit = AuditLog(
        user_id=current_user.id,
        action="REJECT_MESSAGE",
        resource=f"Message {message_id}",
        details=f"Rejected AI suggestion"
    )
    db.add(audit)
    await db.commit()
    # -----------------
    
    return {"status": "rejected"}

@router.put("/messages/{message_id}")
async def edit_message(message_id: int, update: MessageUpdate, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    """
    Edit a pending message content.
    """
    result = await db.execute(select(Message).filter(Message.id == message_id))
    msg = result.scalars().first()
    if not msg:
        raise HTTPException(status_code=404, detail="Message not found")
        
    old_content = msg.content
    msg.content = update.content
    await db.commit()
    logger.info(f"Message {message_id} EDITED by {current_user.username}")
    
    # --- AUDIT LOG ---
    audit = AuditLog(
        user_id=current_user.id,
        action="EDIT_MESSAGE",
        resource=f"Message {message_id}",
        details=f"Modified AI suggestion. Original: {old_content[:50]}..."
    )
    db.add(audit)
    await db.commit()
    # -----------------
    
    return {"status": "updated", "content": msg.content}

@router.post("/{conversation_id}/archive")
async def archive_conversation(conversation_id: int, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(Conversation).filter(Conversation.id == conversation_id))
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv.is_archived = True
    await db.commit()
    logger.info(f"Conversation {conversation_id} ARCHIVED")
    return {"status": "archived"}

@router.post("/{conversation_id}/unarchive")
async def unarchive_conversation(conversation_id: int, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(Conversation).filter(Conversation.id == conversation_id))
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv.is_archived = False
    await db.commit()
    return {"status": "unarchived"}

@router.post("/{conversation_id}/pin")
async def pin_conversation(conversation_id: int, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(Conversation).filter(Conversation.id == conversation_id))
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv.is_pinned = True
    await db.commit()
    logger.info(f"Conversation {conversation_id} PINNED")
    return {"status": "pinned"}

@router.post("/{conversation_id}/unpin")
async def unpin_conversation(conversation_id: int, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(Conversation).filter(Conversation.id == conversation_id))
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv.is_pinned = False
    await db.commit()
    return {"status": "unpinned"}

@router.post("/{conversation_id}/toggle-auto-ai")
async def toggle_auto_ai(conversation_id: int, db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(Conversation).filter(Conversation.id == conversation_id))
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv.auto_ai_enabled = not conv.auto_ai_enabled
    await db.commit()
    logger.info(f"Conversation {conversation_id} AI set to {conv.auto_ai_enabled}")
    return {"status": "updated", "auto_ai_enabled": conv.auto_ai_enabled}

@router.delete("/{conversation_id}")
async def delete_conversation(conversation_id: int, db: AsyncSession = Depends(get_async_db)):
    """
    Delete a conversation and all its messages.
    """
    result = await db.execute(select(Conversation).filter(Conversation.id == conversation_id))
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    
    # Cascade delete messages manually if not handled by DB FK
    await db.execute(delete(Message).filter(Message.conversation_id == conversation_id))
    await db.delete(conv)
    await db.commit()
    
    logger.info(f"Conversation {conversation_id} and its messages DELETED")
    return {"status": "deleted"}

@router.post("/bulk-action")
async def bulk_conversation_action(req: BulkActionRequest, db: AsyncSession = Depends(get_async_db)):
    """
    Perform bulk actions on multiple conversations.
    """
    if not req.conversation_ids:
        return {"status": "no_op", "count": 0}

    logger.info(f"Processing bulk action '{req.action}' for {len(req.conversation_ids)} conversations")
    
    if req.action == "archive":
        await db.execute(update(Conversation).filter(Conversation.id.in_(req.conversation_ids)).values(is_archived=True))
        await db.commit()
        return {"status": "success", "action": "archive", "count": len(req.conversation_ids)}
        
    elif req.action == "delete":
        # Delete messages first
        await db.execute(delete(Message).filter(Message.conversation_id.in_(req.conversation_ids)))
        # Delete conversations
        await db.execute(delete(Conversation).filter(Conversation.id.in_(req.conversation_ids)))
        await db.commit()
        return {"status": "success", "action": "delete", "count": len(req.conversation_ids)}
        
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

@router.post("/messages/bulk-action")
async def bulk_message_action(req: BulkMessageActionRequest, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    """
    Perform bulk actions on multiple messages.
    """
    if not req.message_ids:
        return {"status": "no_op", "count": 0}
    
    logger.info(f"Processing bulk message action '{req.action}' for {len(req.message_ids)} messages by {current_user.username}")
    
    if req.action == "delete":
        await db.execute(delete(Message).filter(Message.id.in_(req.message_ids)))
        await db.commit()
        return {"status": "success", "action": "delete", "count": len(req.message_ids)}
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

@router.post("/{conversation_id}/messages")
async def send_human_message(conversation_id: int, req: MessageCreate, db: AsyncSession = Depends(get_async_db), current_user: User = Depends(get_current_user)):
    """
    Send a message from the human operator.
    """
    result = await db.execute(
        select(Conversation)
        .options(joinedload(Conversation.client))
        .filter(Conversation.id == conversation_id)
    )
    conv = result.scalars().first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
        
    msg = Message(
        conversation_id=conversation_id,
        sender="agent",
        content=req.content,
        status="sent",
        is_ai_generated=False
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    HUMAN_MESSAGES_TOTAL.inc()
    
    # Broadcast to sync all dashboard instances
    client_phone = conv.client.phone_number
    await manager.broadcast(json.dumps({
        "id": msg.id,
        "sender": "agent",
        "content": msg.content,
        "phone": client_phone,
        "timestamp": msg.timestamp.isoformat(),
        "status": "sent",
        "is_ai_generated": False
    }))
    
    # --- OUTBOUND DELIVERY ---
    result = await db.execute(select(AIConfig).filter(AIConfig.is_active == True))
    config = result.scalars().first()
    if config:
        config_dict = {
            "whatsapp_driver": config.whatsapp_driver,
            "whatsapp_api_token": config.whatsapp_api_token,
            "whatsapp_phone_id": config.whatsapp_phone_id,
            "email_driver": config.email_driver,
            "meta_driver": config.meta_driver,
            "email_smtp_server": config.email_smtp_server,
            "facebook_api_token": config.facebook_api_token
        }
        # Use MessagingHub to detect channel and send
        adapter = MessagingHubService.get_adapter(conv.channel, config_dict)
        external_id = await adapter.send_message(to=client_phone, text=msg.content)
        
        if isinstance(external_id, str):
            msg.external_id = external_id
            await db.commit()
    # -------------------------
    
    return {"status": "sent", "id": msg.id}
