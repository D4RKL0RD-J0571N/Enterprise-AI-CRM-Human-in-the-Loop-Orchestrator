from celery_app import celery_app
import asyncio
from logger import setup_logger
from database import AsyncSessionLocal
from models import Message
from sqlalchemy import select
import json

logger = setup_logger("tasks")

@celery_app.task(name="tasks.delayed_auto_send_task")
def delayed_auto_send_task(msg_id: int):
    """
    Celery task to handle delayed message sending.
    Note: Celery tasks are usually synchronous wrappers around async code 
    if the rest of the app is async.
    """
    logger.info(f"CELERY: Processing delayed auto-send for Message {msg_id}")
    
    # Run async logic in a sync wrapper for Celery
    return asyncio.run(_send_message_async_task(msg_id))

async def _send_message_async_task(msg_id: int):
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Message).filter(Message.id == msg_id))
        msg = result.scalars().first()
        
        if msg and msg.status == "pending":
            logger.info(f"CELERY: Auto-sending Message {msg_id}")
            msg.status = "sent"
            await db.commit()
            
            # Note: Broadcasters (WebSockets) might not work directly from a separate 
            # Celery worker process unless using a Redis Pub/Sub for the manager.
            # This is a modernization step that would require Redis integration for WebSockets too.
            return True
    return False
