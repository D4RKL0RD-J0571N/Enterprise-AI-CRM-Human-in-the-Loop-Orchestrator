from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_async_db
from models import AIConfig
from routers.auth import get_current_user

router = APIRouter(prefix="/system", tags=["System"])

@router.get("/health")
async def get_system_health(db: AsyncSession = Depends(get_async_db), user=Depends(get_current_user)):
    result = await db.execute(select(AIConfig).filter(AIConfig.is_active == True))
    config = result.scalars().first()
    driver = config.whatsapp_driver if config else "mock"
    
    return {
        "status": "online",
        "whatsapp_driver": driver,
        "is_production": driver == "meta",
        "db_connected": True
    }
