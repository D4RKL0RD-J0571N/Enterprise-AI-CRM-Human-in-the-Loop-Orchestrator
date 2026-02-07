from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete, update, func
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_async_db
from models import Client, Conversation, User
from pydantic import BaseModel
from typing import List, Optional
from routers.auth import get_admin_user, get_current_user
from services.security_decorators import require_enterprise_plan
from datetime import datetime

router = APIRouter(prefix="/clients", tags=["Clients"], dependencies=[Depends(require_enterprise_plan)])

class ClientUpdate(BaseModel):
    name: Optional[str] = None
    phone_number: Optional[str] = None

@router.get("/")
async def list_clients(db: AsyncSession = Depends(get_async_db), user: User = Depends(get_current_user)):
    # Get clients with their conversation counts using a subquery for performance
    subq = select(Conversation.client_id, func.count(Conversation.id).label('count')).group_by(Conversation.client_id).subquery()
    
    result = await db.execute(
        select(Client, func.coalesce(subq.c.count, 0).label('conversation_count'))
        .outerjoin(subq, Client.id == subq.c.client_id)
        .order_by(Client.created_at.desc())
    )
    
    rows = result.all()
    clients_data = []
    for client, count in rows:
        client_dict = {
            "id": client.id,
            "name": client.name,
            "phone_number": client.phone_number,
            "created_at": client.created_at,
            "conversation_count": count,
            "tenant_id": client.tenant_id
        }
        clients_data.append(client_dict)
    
    return clients_data

@router.get("/{id}")
async def get_client(id: int, db: AsyncSession = Depends(get_async_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Client).filter(Client.id == id))
    client = result.scalars().first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    # Get conversation count
    conv_count_res = await db.execute(select(func.count(Conversation.id)).filter(Conversation.client_id == id))
    conv_count = conv_count_res.scalar()
    
    return {
        "id": client.id,
        "name": client.name,
        "phone_number": client.phone_number,
        "created_at": client.created_at,
        "conversation_count": conv_count
    }

@router.put("/{id}")
async def update_client(id: int, req: ClientUpdate, db: AsyncSession = Depends(get_async_db), admin: User = Depends(get_admin_user)):
    result = await db.execute(select(Client).filter(Client.id == id))
    client = result.scalars().first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    if req.name is not None:
        client.name = req.name
    if req.phone_number is not None:
        client.phone_number = req.phone_number
        
    await db.commit()
    await db.refresh(client)
    return client

@router.delete("/{id}")
async def delete_client(id: int, db: AsyncSession = Depends(get_async_db), admin: User = Depends(get_admin_user)):
    # Check if client exists
    result = await db.execute(select(Client).filter(Client.id == id))
    client = result.scalars().first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
        
    await db.execute(delete(Client).where(Client.id == id))
    await db.commit()
    return {"status": "deleted"}
