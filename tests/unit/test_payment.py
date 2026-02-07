import pytest
import os
import sys
import asyncio

# Add server directory to path
sys.path.append(os.path.join(os.getcwd(), "server"))

from services.payment import PaymentService

@pytest.mark.asyncio
async def test_payment_links():
    from models import Order
    # Mock order
    mock_order = Order(id=1, total_amount=5000, currency="CRC")
    
    # Test Stripe
    res = await PaymentService.create_stripe_session(mock_order)
    assert res["id"].startswith("cs_test_")
    assert "stripe.com" in res["url"]

    # Test MP
    res_mp = await PaymentService.create_mercadopago_preference(mock_order)
    assert res_mp["id"].startswith("mp_pref_")
    assert "mercadopago.com" in res_mp["url"]
