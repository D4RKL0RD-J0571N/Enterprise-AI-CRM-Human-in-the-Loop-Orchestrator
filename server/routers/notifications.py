from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update, delete, desc
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_async_db
from models import Notification
from routers.auth import get_current_user
from typing import List
from pydantic import BaseModel
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["Notifications"])

class NotificationResponse(BaseModel):
    id: int
    type: str
    severity: str
    title: str
    description: str
    is_read: bool
    timestamp: datetime
    metadata_json: str

    class Config:
        from_attributes = True

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    limit: int = 20,
    db: AsyncSession = Depends(get_async_db),
    user=Depends(get_current_user)
):
    result = await db.execute(
        select(Notification)
        .order_by(desc(Notification.timestamp))
        .limit(limit)
    )
    return result.scalars().all()

@router.post("/{notification_id}/read")
async def mark_notification_as_read(
    notification_id: int,
    db: AsyncSession = Depends(get_async_db),
    user=Depends(get_current_user)
):
    await db.execute(
        update(Notification)
        .where(Notification.id == notification_id)
        .values(is_read=True)
    )
    await db.commit()
    return {"status": "success"}

@router.post("/read-all")
async def mark_all_notifications_as_read(
    db: AsyncSession = Depends(get_async_db),
    user=Depends(get_current_user)
):
    await db.execute(
        update(Notification)
        .where(Notification.is_read == False)
        .values(is_read=True)
    )
    await db.commit()
    return {"status": "success"}

@router.delete("/{notification_id}")
async def delete_notification(
    notification_id: int,
    db: AsyncSession = Depends(get_async_db),
    user=Depends(get_current_user)
):
    await db.execute(
        delete(Notification)
        .where(Notification.id == notification_id)
    )
    await db.commit()
    return {"status": "success"}
