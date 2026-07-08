"""
System configuration API.

Provides endpoints to read and update global system settings such as
auto-blur, blur intensity, privacy labels, auto inference, and alert
notifications. All config values are stored as strings in the
``system_configs`` table.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Dict

from app.core.database import get_db
from app.models.models import SystemConfig

router = APIRouter(prefix="/config", tags=["config"])

# Default system configuration values.
# These are inserted into the database on initialization (see database.init_db)
# if they do not already exist.
DEFAULT_CONFIGS = {
    "auto_blur": "true",
    "blur_intensity": "51",
    "privacy_labels": '["上身裸露","下身裸露","更衣中"]',
    "auto_inference": "false",
    "alert_notification": "true",
}


@router.get("/")
def get_configs(db: Session = Depends(get_db)):
    """Get all system configurations.

    Returns a JSON object mapping every config key to its string value.
    Default values are filled in for any keys that are missing from the
    database so the frontend always receives a complete config set.
    """
    configs = db.query(SystemConfig).all()
    result = {c.key: c.value for c in configs}
    # Ensure all default keys are present (in case some are missing from DB)
    for k, v in DEFAULT_CONFIGS.items():
        if k not in result:
            result[k] = v
    return result


@router.put("/")
def update_configs(configs: Dict[str, str], db: Session = Depends(get_db)):
    """Update system configurations.

    Accepts a JSON object of key-value pairs. Existing keys are updated;
    new keys are created. All values are stored as strings.
    """
    for key, value in configs.items():
        existing = db.query(SystemConfig).filter(SystemConfig.key == key).first()
        if existing:
            existing.value = str(value)
        else:
            db.add(SystemConfig(key=key, value=str(value)))
    db.commit()
    return {"ok": True, "updated": configs}
