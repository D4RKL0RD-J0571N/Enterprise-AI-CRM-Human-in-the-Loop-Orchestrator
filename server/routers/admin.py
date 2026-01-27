from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import AIConfig, AIDataset, AIConfigSnapshot, Message, SecurityAudit
from pydantic import BaseModel
from typing import List
import json
from logger import setup_logger
from services.ai_agent import AIAgent
try:
    import zoneinfo
except ImportError:
    from backports import zoneinfo # Fallback for older python if needed, but 3.9+ has it

router = APIRouter(prefix="/admin", tags=["Admin"])
logger = setup_logger("admin")
ai_agent = AIAgent()

from typing import List, Optional

class AIConfigRequest(BaseModel):
    business_name: str
    business_description: str
    tone: str
    rules: List[str]
    auto_respond_threshold: int
    review_threshold: int
    forbidden_topics: List[str]
    language_code: str = "es-CR"
    translate_messages: bool = False
    identity_prompt: Optional[str] = None
    grounding_template: Optional[str] = None
    intent_rules: List[dict] = []
    fallback_message: str = "I am currently having trouble processing your request."
    preferred_model: str = "gpt-4-turbo"
    logo_url: Optional[str] = None
    primary_color: str = "#2563eb"
    ui_density: str = "comfortable"
    # Secrets
    openai_api_key: Optional[str] = None
    openai_api_base: Optional[str] = "http://localhost:1234/v1"
    whatsapp_api_token: Optional[str] = None
    whatsapp_api_token: Optional[str] = None
    whatsapp_verify_token: Optional[str] = None
    whatsapp_verify_token: Optional[str] = None
    timezone: str = "UTC"
    workspace_config: str = "{}"

@router.get("/config")
def get_ai_config(db: Session = Depends(get_db)):
    config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
    if not config:
        raise HTTPException(status_code=404, detail="AI Configuration not found. Please create one.")
    
    
    return {
        "business_name": config.business_name,
        "business_description": config.business_description,
        "tone": config.tone,
        "rules": json.loads(config.rules_json),
        "auto_respond_threshold": config.auto_respond_threshold,
        "review_threshold": config.review_threshold,
        "forbidden_topics": json.loads(config.forbidden_topics_json),
        "language_code": config.language_code,
        "translate_messages": config.translate_messages,
        "identity_prompt": config.identity_prompt,
        "grounding_template": config.grounding_template,
        "intent_rules": json.loads(config.intent_rules_json),
        "fallback_message": config.fallback_message,
        "preferred_model": getattr(config, 'preferred_model', 'gpt-4-turbo'),
        "logo_url": getattr(config, 'logo_url', None),
        "primary_color": getattr(config, 'primary_color', '#2563eb'),
        "ui_density": getattr(config, 'ui_density', 'comfortable'),
        # Secrets (Masked for security in real app, but explicit here for admin)
        "openai_api_base": getattr(config, 'openai_api_base', 'http://localhost:1234/v1'),
        "has_openai_key": bool(getattr(config, 'openai_api_key', None)),
        "has_whatsapp_token": bool(getattr(config, 'whatsapp_api_token', None)),
        "has_openai_key": bool(getattr(config, 'openai_api_key', None)),
        "has_whatsapp_token": bool(getattr(config, 'whatsapp_api_token', None)),
        "timezone": getattr(config, 'timezone', 'UTC'),
        "workspace_config": getattr(config, 'workspace_config', '{}')
    }

@router.post("/config")
def update_ai_config(req: AIConfigRequest, db: Session = Depends(get_db)):
    config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
    if not config:
        config = AIConfig()
        db.add(config)
    
    config.business_name = req.business_name
    config.business_description = req.business_description
    config.tone = req.tone
    config.rules_json = json.dumps(req.rules)
    config.auto_respond_threshold = req.auto_respond_threshold
    config.review_threshold = req.review_threshold
    config.forbidden_topics_json = json.dumps(req.forbidden_topics)
    config.language_code = req.language_code
    config.translate_messages = req.translate_messages
    config.identity_prompt = req.identity_prompt
    config.grounding_template = req.grounding_template
    config.intent_rules_json = json.dumps(req.intent_rules)
    config.fallback_message = req.fallback_message
    config.preferred_model = req.preferred_model
    config.logo_url = req.logo_url
    config.primary_color = req.primary_color
    config.ui_density = req.ui_density
    
    # Secrets Update (Only if provided, to avoid clearing on empty)
    if req.openai_api_key:
        config.openai_api_key = req.openai_api_key
    if req.openai_api_base:
        config.openai_api_base = req.openai_api_base
    if req.whatsapp_api_token:
        config.whatsapp_api_token = req.whatsapp_api_token
    if req.whatsapp_api_token:
        config.whatsapp_api_token = req.whatsapp_api_token
    if req.whatsapp_verify_token:
        config.whatsapp_verify_token = req.whatsapp_verify_token
        
    config.timezone = req.timezone
    config.workspace_config = req.workspace_config
    
    db.commit()
    
    # --- AUTOMATIC SNAPSHOT ---
    snapshot = AIConfigSnapshot(
        config_id=config.id,
        business_name=config.business_name,
        business_description=config.business_description,
        tone=config.tone,
        rules_json=config.rules_json,
        auto_respond_threshold=config.auto_respond_threshold,
        review_threshold=config.review_threshold,
        auto_send_delay=config.auto_send_delay or 30,
        keywords_json=config.keywords_json or "[]",
        forbidden_topics_json=config.forbidden_topics_json,
        language_code=config.language_code,
        translate_messages=config.translate_messages,
        identity_prompt=config.identity_prompt,
        grounding_template=config.grounding_template,
        intent_rules_json=config.intent_rules_json,
        fallback_message=config.fallback_message,
        preferred_model=config.preferred_model,
        logo_url=config.logo_url,
        primary_color=config.primary_color,
        version_name=f"Standard v{config.updated_at.strftime('%m%d.%H%M')}",
        version_label=f"Auto-saved version {config.updated_at.strftime('%Y-%m-%d %H:%M:%S')}"
    )
    db.add(snapshot)
    db.commit()
    # ---------------------------

    logger.info("AI Configuration updated and snapshot created")
    return {"status": "success", "message": "Configuration updated and snapshot created"}

@router.get("/snapshots")
def list_snapshots(db: Session = Depends(get_db)):
    """List all saved configuration snapshots."""
    snapshots = db.query(AIConfigSnapshot).order_by(AIConfigSnapshot.created_at.desc()).limit(20).all()
    return snapshots

@router.post("/snapshots/{snapshot_id}/rollback")
def rollback_to_snapshot(snapshot_id: int, db: Session = Depends(get_db)):
    """Rollback the active configuration to a specific snapshot."""
    snapshot = db.query(AIConfigSnapshot).filter(AIConfigSnapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
    if not config:
        config = AIConfig()
        db.add(config)
    
    # Restore all fields from snapshot
    config.business_name = snapshot.business_name
    config.business_description = snapshot.business_description
    config.tone = snapshot.tone
    config.rules_json = snapshot.rules_json
    config.auto_respond_threshold = snapshot.auto_respond_threshold
    config.review_threshold = snapshot.review_threshold
    config.auto_send_delay = snapshot.auto_send_delay
    config.keywords_json = snapshot.keywords_json
    config.forbidden_topics_json = snapshot.forbidden_topics_json
    config.language_code = snapshot.language_code
    config.translate_messages = snapshot.translate_messages
    config.identity_prompt = snapshot.identity_prompt
    config.grounding_template = snapshot.grounding_template
    config.intent_rules_json = snapshot.intent_rules_json
    config.fallback_message = snapshot.fallback_message
    config.preferred_model = snapshot.preferred_model
    config.logo_url = snapshot.logo_url
    config.primary_color = snapshot.primary_color
    
    db.commit()
    logger.info(f"AI Configuration rolled back to snapshot {snapshot_id}")
    return {"status": "success", "message": f"Rolled back to {snapshot.version_name or snapshot.version_label or snapshot.created_at}"}

@router.delete("/snapshots/{snapshot_id}")
def delete_snapshot(snapshot_id: int, db: Session = Depends(get_db)):
    """Delete a configuration snapshot if it's not locked."""
    snapshot = db.query(AIConfigSnapshot).filter(AIConfigSnapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    if snapshot.is_locked:
        raise HTTPException(status_code=400, detail="Cannot delete a locked snapshot")
    
    db.delete(snapshot)
    db.commit()
    logger.info(f"Snapshot {snapshot_id} deleted")
    return {"status": "success", "message": "Snapshot deleted"}

class SnapshotRenameRequest(BaseModel):
    name: str

@router.put("/snapshots/{snapshot_id}/name")
def rename_snapshot(snapshot_id: int, req: SnapshotRenameRequest, db: Session = Depends(get_db)):
    """Rename a configuration snapshot."""
    snapshot = db.query(AIConfigSnapshot).filter(AIConfigSnapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    snapshot.version_name = req.name
    db.commit()
    return {"status": "success", "message": "Snapshot renamed", "new_name": req.name}

@router.post("/snapshots/{snapshot_id}/toggle-lock")
def toggle_snapshot_lock(snapshot_id: int, db: Session = Depends(get_db)):
    """Toggle the lock status of a snapshot to prevent accidental deletion."""
    snapshot = db.query(AIConfigSnapshot).filter(AIConfigSnapshot.id == snapshot_id).first()
    if not snapshot:
        raise HTTPException(status_code=404, detail="Snapshot not found")
    
    snapshot.is_locked = not getattr(snapshot, "is_locked", False)
    db.commit()
    snapshot.is_locked = not getattr(snapshot, "is_locked", False)
    db.commit()
    return {"status": "success", "is_locked": snapshot.is_locked}

class WorkspaceConfigRequest(BaseModel):
    config: str

@router.post("/workspace")
def save_workspace_config(req: WorkspaceConfigRequest, db: Session = Depends(get_db)):
    """Save persistent UI layout preferences."""
    config = db.query(AIConfig).filter(AIConfig.is_active == True).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
        
    config.workspace_config = req.config
    db.commit()
    return {"status": "success"}

class AITestRequest(BaseModel):
    message: str

@router.post("/test")
async def test_ai_response(req: AITestRequest, db: Session = Depends(get_db)):
    """
    Test how the AI responds to a message given the current global config.
    """
    logger.info(f"Admin running AI Sandbox test: {req.message[:50]}...")
    
    # We use a dummy client_id for testing
    result = ai_agent.generate_response("admin_test_user", req.message, db=db)
    
    return result

class AIDatasetRequest(BaseModel):
    name: str
    data_type: str
    content: str

@router.get("/datasets")
async def list_datasets(db: Session = Depends(get_db)):
    datasets = db.query(AIDataset).all()
    return datasets

@router.post("/datasets")
async def create_dataset(req: AIDatasetRequest, db: Session = Depends(get_db)):
    logger.info(f"Adding new dataset: {req.name}")
    new_ds = AIDataset(
        name=req.name,
        data_type=req.data_type,
        content=req.content
    )
    db.add(new_ds)
    db.commit()
    db.refresh(new_ds)
    return new_ds

@router.post("/datasets/{ds_id}/toggle")
async def toggle_dataset(ds_id: int, db: Session = Depends(get_db)):
    ds = db.query(AIDataset).filter(AIDataset.id == ds_id).first()
    if ds:
        ds.is_active = not ds.is_active
        db.commit()
        return {"status": "success", "is_active": ds.is_active}
    return {"status": "error", "message": "Dataset not found"}

@router.put("/datasets/{ds_id}")
async def update_dataset(ds_id: int, req: AIDatasetRequest, db: Session = Depends(get_db)):
    ds = db.query(AIDataset).filter(AIDataset.id == ds_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    ds.name = req.name
    ds.data_type = req.data_type
    ds.content = req.content
    db.commit()
    logger.info(f"Dataset {ds_id} updated")
    return {"status": "success", "message": "Dataset updated"}

@router.delete("/datasets/{ds_id}")
async def delete_dataset(ds_id: int, db: Session = Depends(get_db)):
    ds = db.query(AIDataset).filter(AIDataset.id == ds_id).first()
    if not ds:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    db.delete(ds)
    db.commit()
    logger.info(f"Dataset {ds_id} deleted")
    return {"status": "success", "message": "Dataset deleted"}

@router.get("/analytics/intents")
def get_intent_analytics(db: Session = Depends(get_db)):
    """Analyze intent frequencies from message metadata."""
    # Fetch all AI generated messages to analyze metadata
    messages = db.query(Message).filter(Message.is_ai_generated == True).all()
    
    stats = {}
    # Normalization mapping
    NORMALIZATION = {
        "greeting": "Saludo",
        "saludo": "Saludo"
    }

    for msg in messages:
        try:
            meta = json.loads(msg.metadata_json or "{}")
            intent = meta.get("intent", "General")
            # Normalize
            normalized = NORMALIZATION.get(intent.lower(), intent)
            stats[normalized] = stats.get(normalized, 0) + 1
        except:
            continue
            
    # Format for chart consumption
    formatted_stats = [{"intent": k, "count": v} for k, v in stats.items()]
    return sorted(formatted_stats, key=lambda x: x["count"], reverse=True)
@router.get("/audits", response_model=List[dict])
def list_security_audits(db: Session = Depends(get_db)):
    """Fetch security and performance audit logs."""
    audits = db.query(SecurityAudit).order_by(SecurityAudit.timestamp.desc()).limit(100).all()
    # Normalize triggered_keywords if it's a JSON string
    result = []
    for a in audits:
        obj = {c.name: getattr(a, c.name) for c in a.__table__.columns}
        try:
            obj["triggered_keywords"] = json.loads(a.triggered_keywords or "[]")
        except:
            obj["triggered_keywords"] = []
        result.append(obj)
    return result

@router.get("/timezones")
def list_timezones():
    """Fetch all available IANA timezones from the system."""
    try:
        return sorted(list(zoneinfo.available_timezones()))
    except Exception as e:
        logger.error(f"Error fetching timezones: {e}")
        return ["UTC", "America/New_York", "Europe/London"] # Fallback
