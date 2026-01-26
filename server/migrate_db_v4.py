from database import SessionLocal, engine
from models import Base
import logging
from logger import setup_logger

logger = setup_logger("migration_v4")

def migrate():
    logger.info("Running Migration v4: Creating AI Config and Dataset tables...")
    try:
        # This will create any new tables that don't exist yet
        # Since we use metadata.create_all, it's safer for new tables
        Base.metadata.create_all(bind=engine)
        logger.info("Migration v4 successful! AI Config tables are ready.")
    except Exception as e:
        logger.error(f"Migration v4 failed: {e}")

if __name__ == "__main__":
    migrate()
