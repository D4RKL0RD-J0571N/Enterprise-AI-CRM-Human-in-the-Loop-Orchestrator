from fastapi import HTTPException, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_async_db
from models import AIConfig
from services.licensing import LicensingService
from logger import setup_logger

logger = setup_logger("security_decorators")

class PlanGuard:
    @staticmethod
    async def require_pro(db: AsyncSession = Depends(get_async_db)):
        """Verification dependency for Pro plan features."""
        return await PlanGuard._check_plan(db, "pro")

    @staticmethod
    async def require_enterprise(db: AsyncSession = Depends(get_async_db)):
        """Verification dependency for Enterprise plan features."""
        return await PlanGuard._check_plan(db, "enterprise")

    @staticmethod
    async def _check_plan(db: AsyncSession, required_plan: str):
        # 0. Bypass if DEV_MODE is active - but try to get real identity if DB exists
        import os
        dev_mode = os.getenv("DEV_MODE") == "true"

        result = await db.execute(select(AIConfig).filter(AIConfig.is_active == True))
        config = result.scalars().first()

        if dev_mode:
            return {
                "plan": "enterprise", 
                "business_name": config.business_name if config else "Dev Mode", 
                "dev": True
            }

        if not config or not config.license_key:
            logger.warning(f"Access denied: No active license for {required_plan} feature.")
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="No active license found. Please activate your product."
            )
            
        try:
            payload = LicensingService.verify_license(config.license_key)
            current_plan = payload.get("plan", "starter")
            
            plan_hierarchy = {"starter": 0, "pro": 1, "enterprise": 2}
            if plan_hierarchy.get(current_plan, 0) < plan_hierarchy.get(required_plan, 0):
                logger.warning(f"Plan mismatch: Required {required_plan}, found {current_plan}")
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"This feature requires a '{required_plan}' plan. Your current plan is '{current_plan}'."
                )
            
            return payload
        except HTTPException:
            # Re-raise explicit HTTP exceptions (like plan mismatch 403)
            raise
        except Exception as e:
            logger.error(f"License verification failed during security check: {e}")
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail=f"Invalid or expired license: {str(e)}"
            )

# Shorthand for use in Depends()
require_pro_plan = PlanGuard.require_pro
require_enterprise_plan = PlanGuard.require_enterprise
