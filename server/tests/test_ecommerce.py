import pytest
import os
import sys
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Add server to path
sys.path.append(os.path.join(os.path.dirname(__file__), '../'))
os.environ["TESTING"] = "true"

from main import app
from database import Base, get_async_db
from models import User, AIConfig, Product, Order
from services.auth_service import AuthService
from generate_license import generate_license

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite+aiosqlite:///:memory:"
engine = create_async_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False
)

async def override_get_async_db():
    async with TestingSessionLocal() as session:
        yield session

app.dependency_overrides[get_async_db] = override_get_async_db

client = TestClient(app)

async def init_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    
    async with TestingSessionLocal() as session:
        # 1. Create Admin User
        admin_user = User(
            username="admin",
            hashed_password=AuthService.get_password_hash("password"),
            role="admin"
        )
        session.add(admin_user)
        
        # 2. Create Enterprise License
        from generate_license import generate_license
        test_license_data = {
            "business_name": "Test Shop",
            "plan": "enterprise",
            "features": ["whatsapp", "ecommerce"],
            "max_seats": 10
        }
        test_key = generate_license(test_license_data)
        
        config = AIConfig(
            business_name="Test Shop",
            is_active=True,
            license_key=test_key
        )
        session.add(config)
        
        # 3. Create a Product
        product = Product(
            id=1,
            name="Test Widget",
            price=1000,
            stock_quantity=50
        )
        session.add(product)
        
        await session.commit()

def test_ecommerce_flow():
    # 1. Initialize DB
    asyncio.run(init_test_db())
    
    # 2. Login
    response = client.post("/auth/login", data={"username": "admin", "password": "password"})
    assert response.status_code == 200
    token = response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. List Products (Should work because we have Enterprise license in DB)
    response = client.get("/ecommerce/products")
    assert response.status_code == 200
    assert len(response.json()) >= 1
    assert response.json()[0]["name"] == "Test Widget"
    
    # 4. Create Order
    order_data = {
        "client_id": 1, # Assume client 1 exists or foreign key allows it in sqlite if not enforced
        "items": [
            {"product_id": 1, "quantity": 2}
        ]
    }
    response = client.post("/ecommerce/orders", json=order_data, headers=headers)
    assert response.status_code == 200
    order = response.json()
    assert order["total_amount"] == 2000
    assert "Test Widget" in order["items_json"]
    
    # 5. Test Plan Restriction (Downgrade license to 'starter')
    asyncio.run(downgrade_license("starter"))
    response = client.get("/ecommerce/products")
    assert response.status_code == 403
    assert "enterprise" in response.json()["detail"].lower()

async def downgrade_license(plan: str):
    async with TestingSessionLocal() as session:
        from generate_license import generate_license
        test_license_data = {
            "business_name": "Test Shop",
            "plan": plan,
            "features": ["whatsapp"],
            "max_seats": 10
        }
        test_key = generate_license(test_license_data)
        from sqlalchemy import update
        await session.execute(update(AIConfig).where(AIConfig.is_active == True).values(license_key=test_key))
        await session.commit()
