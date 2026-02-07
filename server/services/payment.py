import os
import json
import asyncio
from models import Order
from logger import setup_logger

logger = setup_logger("payment_service")

class PaymentService:
    @staticmethod
    async def create_stripe_session(order: Order):
        """
        Generates a Stripe Checkout Session.
        (Mocked for initial Phase 3 implementation)
        """
        logger.info(f"Generating Stripe payment link for Order {order.id} | Amount: {order.total_amount} {order.currency}")
        
        # Simulate API Latency
        await asyncio.sleep(0.8)
        
        # In a real implementation:
        # import stripe
        # stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
        # items = json.loads(order.items_json)
        # line_items = [{
        #     'price_data': {
        #         'currency': order.currency.lower(),
        #         'product_data': {'name': item['name']},
        #         'unit_amount': item['price'],
        #     },
        #     'quantity': item['quantity'],
        # } for item in items]
        
        session_id = f"cs_test_{os.urandom(8).hex()}"
        # Using a documentation example URL
        payment_url = f"https://checkout.stripe.com/c/pay/{session_id}#fidkdWxOYHwnPyd1blpxYHZxWjA0T1ZpbmBhS2JDPVJXYE9pQ3N3XzVXN21VfXNHN0B9V0p0d2xhbm9pPScpJ2N3OGDxPydkbmB3YGBKdWBoYGF3YGZqa3B0ZmxuYitid2p3eGsnKSknZ3dAbD9DZnY5YV9pY2E3YitmanYneCknZ2R8ZVY5YFp0Z2A3eHAnKSdpZHxqcHFRfHVfS2p0Z2AxYEBXfGt9YWB3YGN3YGZqa3B0ZmxuYitid2p3eGsnKSknd2R2YGFhYV80ZDBiNGZkPScpJ3V3YGBhYV9mZHdmYWB3YGN3YGZqa3B0ZmxuYitid2p3eGsnKSknbmB3YGBhYV80ZDBiNGZkPScpJ2J3cEAn"
        
        return {
            "id": session_id,
            "url": payment_url
        }

    @staticmethod
    async def create_mercadopago_preference(order: Order):
        """
        Generates a MercadoPago Preference link.
        (Mocked for initial Phase 3 implementation)
        """
        logger.info(f"Generating MercadoPago payment link for Order {order.id} | Amount: {order.total_amount} {order.currency}")
        
        await asyncio.sleep(0.8)
        
        # In a real implementation:
        # import mercadopago
        # sdk = mercadopago.SDK(os.getenv("MP_ACCESS_TOKEN"))
        
        pref_id = f"mp_pref_{os.urandom(8).hex()}"
        payment_url = f"https://www.mercadopago.com.cr/checkout/v1/redirect?pref_id={pref_id}"
        
        return {
            "id": pref_id,
            "url": payment_url
        }
