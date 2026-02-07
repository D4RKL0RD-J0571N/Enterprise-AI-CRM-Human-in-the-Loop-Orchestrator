from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_async_db
from models import Product, Order, User, Client
from pydantic import BaseModel
from typing import List, Optional
from routers.auth import get_admin_user, get_current_user
from services.security_decorators import require_enterprise_plan
import json
from datetime import datetime

router = APIRouter(prefix="/ecommerce", tags=["E-commerce"], dependencies=[Depends(require_enterprise_plan)])

class ProductRequest(BaseModel):
    name: str
    description: Optional[str] = None
    price: int # In cents
    currency: str = "CRC"
    stock_quantity: int = 0
    is_active: bool = True

class OrderItem(BaseModel):
    product_id: int
    quantity: int
    price: Optional[int] = None # Price at purchase

class OrderRequest(BaseModel):
    client_id: int
    items: List[OrderItem]
    currency: str = "CRC"

@router.get("/products")
async def list_products(db: AsyncSession = Depends(get_async_db)):
    result = await db.execute(select(Product).filter(Product.is_active == True))
    return result.scalars().all()

@router.post("/products")
async def create_product(req: ProductRequest, db: AsyncSession = Depends(get_async_db), admin: User = Depends(get_admin_user)):
    product = Product(**req.dict())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product

@router.delete("/products/{id}")
async def delete_product(id: int, db: AsyncSession = Depends(get_async_db), admin: User = Depends(get_admin_user)):
    await db.execute(delete(Product).where(Product.id == id))
    await db.commit()
    return {"status": "deleted"}

@router.get("/orders")
async def list_orders(db: AsyncSession = Depends(get_async_db), user: User = Depends(get_current_user)):
    result = await db.execute(select(Order).order_by(Order.created_at.desc()))
    return result.scalars().all()

@router.post("/orders")
async def create_order(req: OrderRequest, db: AsyncSession = Depends(get_async_db), user: User = Depends(get_current_user)):
    # 1. Fetch products to get prices and verify stock
    total_amount = 0
    processed_items = []
    
    for item in req.items:
        prod_result = await db.execute(select(Product).filter(Product.id == item.product_id))
        product = prod_result.scalars().first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        
        price = item.price if item.price is not None else product.price
        total_amount += price * item.quantity
        processed_items.append({
            "product_id": product.id,
            "name": product.name,
            "quantity": item.quantity,
            "price": price
        })

    order = Order(
        client_id=req.client_id,
        total_amount=total_amount,
        currency=req.currency,
        items_json=json.dumps(processed_items),
        status="pending"
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return order

@router.post("/orders/{id}/payment-link")
async def generate_payment_link(id: int, provider: str = "stripe", db: AsyncSession = Depends(get_async_db), user: User = Depends(get_current_user)):
    # 1. Fetch Order
    result = await db.execute(select(Order).filter(Order.id == id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
        
    # 2. Call Payment Service
    from services.payment import PaymentService
    
    try:
        if provider == "stripe":
            link = await PaymentService.create_stripe_session(order)
        elif provider == "mercadopago":
            link = await PaymentService.create_mercadopago_preference(order)
        else:
            raise HTTPException(status_code=400, detail="Invalid provider")
            
        # 3. Update Order with external_id
        order.external_id = link["id"]
        order.payment_method = provider
        await db.commit()
        
        return {"url": link["url"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
