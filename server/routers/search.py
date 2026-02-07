from fastapi import APIRouter, Depends
from sqlalchemy import select, or_, desc
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_async_db
from models import Client, Conversation, Order, Product
from routers.auth import get_current_user
from typing import List, Dict

router = APIRouter(prefix="/search", tags=["Search"])

@router.get("/")
async def global_search(
    q: str, 
    db: AsyncSession = Depends(get_async_db), 
    user=Depends(get_current_user)
):
    """
    Search across clients, conversations, and orders.
    """
    if not q or len(q) < 2:
        return {"clients": [], "orders": [], "products": []}

    search_term = f"%{q}%"
    
    # 1. Search Clients
    clients_res = await db.execute(
        select(Client)
        .filter(or_(Client.name.ilike(search_term), Client.phone_number.ilike(search_term)))
        .limit(5)
    )
    clients = clients_res.scalars().all()

    # 2. Search Orders
    orders_res = await db.execute(
        select(Order)
        .filter(Order.external_id.ilike(search_term))
        .limit(5)
    )
    orders = orders_res.scalars().all()

    # 3. Search Products
    products_res = await db.execute(
        select(Product)
        .filter(or_(Product.name.ilike(search_term), Product.description.ilike(search_term)))
        .limit(5)
    )
    products = products_res.scalars().all()

    return {
        "clients": [{"id": c.id, "name": c.name, "phone": c.phone_number} for c in clients],
        "orders": [{"id": o.id, "external_id": o.external_id, "status": o.status} for o in orders],
        "products": [{"id": p.id, "name": p.name, "price": p.price} for p in products]
    }
