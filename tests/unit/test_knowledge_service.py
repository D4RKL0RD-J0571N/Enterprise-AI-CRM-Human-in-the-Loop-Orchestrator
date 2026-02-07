import pytest
import os
import sys

# Add server directory to path
sys.path.append(os.path.join(os.getcwd(), "server"))

from services.knowledge_service import KnowledgeService

def test_csv_ingestion():
    csv_data = "question,answer\nHow are you?,I am good.\nWhat is AI?,Artificial Intelligence."
    processed = KnowledgeService.ground_knowledge("csv", csv_data.encode('utf-8'))
    assert "How are you?" in processed
    assert "Artificial Intelligence" in processed

def test_json_ingestion():
    json_data = '[{"q": "Hi", "a": "Hello"}]'
    processed = KnowledgeService.ground_knowledge("json", json_data.encode('utf-8'))
    assert "Hi" in processed
    assert "Hello" in processed
