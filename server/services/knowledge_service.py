import csv
import json
import io
from typing import List, Dict, Any
from logger import setup_logger
from models import AIDataset

logger = setup_logger("knowledge_service")

class KnowledgeService:
    @staticmethod
    def parse_csv(content: bytes) -> str:
        """Parse CSV bytes into a structured text format for LLM consumption."""
        try:
            decoded = content.decode("utf-8")
            reader = csv.DictReader(io.StringIO(decoded))
            rows = list(reader)
            
            if not rows:
                return ""
            
            # Convert to a readable text representation
            lines = []
            for row in rows:
                row_str = " | ".join([f"{k}: {v}" for k, v in row.items()])
                lines.append(row_str)
            
            return "\n".join(lines)
        except Exception as e:
            logger.error(f"Failed to parse CSV: {e}")
            raise ValueError(f"Invalid CSV format: {e}")

    @staticmethod
    def parse_json(content: bytes) -> str:
        """Parse JSON bytes into a structured text format for LLM consumption."""
        try:
            data = json.loads(content)
            
            if isinstance(data, list):
                # If it's a list of objects, flatten them
                lines = []
                for item in data:
                    if isinstance(item, dict):
                        lines.append(json.dumps(item, ensure_ascii=False))
                    else:
                        lines.append(str(item))
                return "\n".join(lines)
            elif isinstance(data, dict):
                return json.dumps(data, indent=2, ensure_ascii=False)
            else:
                return str(data)
        except Exception as e:
            logger.error(f"Failed to parse JSON: {e}")
            raise ValueError(f"Invalid JSON format: {e}")

    @staticmethod
    def ground_knowledge(ds_type: str, content: bytes) -> str:
        """Router for different knowledge formats."""
        if ds_type.lower() == "csv":
            return KnowledgeService.parse_csv(content)
        elif ds_type.lower() == "json":
            return KnowledgeService.parse_json(content)
        else:
            return content.decode("utf-8")
