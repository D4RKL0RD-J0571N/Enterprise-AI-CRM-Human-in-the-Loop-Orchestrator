import pytest
import os
import sys

# Add server directory to path
sys.path.append(os.path.join(os.getcwd(), "server"))

from services.ai_agent import AIAgent

@pytest.mark.asyncio
async def test_ai_unconfigured_response():
    agent = AIAgent()
    # Test with no DB (unconfigured state)
    res = await agent.generate_response("test_client", "Hello")
    assert "not configured yet" in res["content"]
    assert res["metadata"]["intent"] == "unconfigured"

def test_intent_mapping_logic():
    agent = AIAgent()
    rules = [{"intent": "Price", "keywords": ["cost", "price"]}]
    context = agent._build_intent_mapping_context(rules)
    assert "Intent 'Price'" in context
    assert "cost, price" in context
