from fastapi import APIRouter, Depends
from sqlalchemy import select, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_async_db
from models import AuditLog, Order, Client, Message
from routers.auth import get_current_user
from typing import List

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(db: AsyncSession = Depends(get_async_db), user=Depends(get_current_user)):
    """
    Get aggregated stats for the dashboard counters.
    """
    # 1. Total Clients
    client_count_res = await db.execute(select(func.count(Client.id)))
    client_count = client_count_res.scalar()

    # 2. Total Orders (Paid)
    paid_orders_res = await db.execute(select(func.count(Order.id)).filter(Order.status == 'paid'))
    paid_orders = paid_orders_res.scalar()

    # 3. Total Conversations
    message_count_res = await db.execute(select(func.count(Message.id)))
    message_count = message_count_res.scalar()

    # 4. Growth placeholders (could be calculated from last 30 days)
    return {
        "clients": {"total": client_count, "growth": "+12%"},
        "sales": {"total": paid_orders, "growth": "+5%"},
        "interactions": {"total": message_count, "growth": "+25%"},
        "ai_efficiency": {"value": "94%", "growth": "+2%"}
    }

@router.get("/recent-orders")
async def get_recent_orders(db: AsyncSession = Depends(get_async_db), user=Depends(get_current_user)):
    """
    Get the 5 most recent pending/paid orders.
    """
    result = await db.execute(
        select(Order, Client.name.label('client_name'))
        .join(Client, Order.client_id == Client.id)
        .order_by(Order.created_at.desc())
        .limit(5)
    )
    rows = result.all()
    return [{"id": o.id, "external_id": o.external_id, "amount": o.total_amount, "status": o.status, "client_name": client_name, "time": o.created_at} for o, client_name in rows]

@router.get("/activity")
async def get_recent_activity(db: AsyncSession = Depends(get_async_db), user=Depends(get_current_user)):
    """
    Get the 10 most recent audit logs for the activity feed.
    """
    result = await db.execute(
        select(AuditLog)
        .order_by(desc(AuditLog.timestamp))
        .limit(10)
    )
    logs = result.scalars().all()
    return logs
