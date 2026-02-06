import logging
import sys
import json
import os
from datetime import datetime

class JsonFormatter(logging.Formatter):
    """Custom formatter to output logs in JSON format."""
    def format(self, record):
        log_record = {
            "timestamp": datetime.fromtimestamp(record.created).isoformat(),
            "level": record.levelname,
            "name": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "funcName": record.funcName,
            "line": record.lineno,
        }
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        return json.dumps(log_record)

def setup_logger(name: str):
    logger = logging.getLogger(name)
    
    # Allow logging level to be configured via env
    log_level = os.getenv("LOG_LEVEL", "DEBUG").upper()
    logger.setLevel(getattr(logging, log_level, logging.DEBUG))

    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(getattr(logging, log_level, logging.DEBUG))
        
        log_format = os.getenv("LOG_FORMAT", "TEXT").upper()
        
        if log_format == "JSON":
            formatter = JsonFormatter()
        else:
            # Standard Text Format: Time | Level | Logger Name | Message
            formatter = logging.Formatter(
                '%(asctime)s | %(levelname)-8s | %(name)-15s | %(message)s',
                datefmt='%Y-%m-%d %H:%M:%S'
            )
            
        handler.setFormatter(formatter)
        logger.addHandler(handler)
    
    return logger
