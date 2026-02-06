import asyncio
import datetime
from database import AsyncSessionLocal
from models import Message
from logger import setup_logger

logger = setup_logger("maintenance")

async def cleanup_stale_messages():
    """
    Background worker that runs every hour to mark 'pending' messages 
    older than 24 hours as 'expired'.
    """
    logger.info("Starting stale message cleanup worker")
    while True:
        try:
            # Run cleanup logic
            async with AsyncSessionLocal() as db:
                try:
                    # Calculate the cutoff time (24 hours ago)
                    cutoff = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(hours=24)
                    
                    # Find pending messages older than cutoff
                    # In SQLAlchemy 2.0 async, use update() with execute()
                    from sqlalchemy import update
                    result = await db.execute(
                        update(Message)
                        .filter(Message.status == "pending", Message.timestamp < cutoff)
                        .values(status="expired")
                    )
                    stale_count = result.rowcount
                    
                    if stale_count > 0:
                        await db.commit()
                        logger.info(f"Cleanup: Marked {stale_count} stale pending messages as 'expired'")
                    else:
                        logger.debug("Cleanup: No stale messages found")
                except Exception as e:
                    logger.error(f"Cleanup error: {e}")
                    await db.rollback()
                
            # Wait for 1 hour before next run
            await asyncio.sleep(3600)
            
        except Exception as e:
            logger.error(f"Maintenance worker encountered an error: {e}")
            await asyncio.sleep(60) # Wait a bit before retrying on error
