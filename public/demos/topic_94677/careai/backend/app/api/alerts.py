from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.schemas import AlertRuleOut
from app.models.models import AlertRule

router = APIRouter(prefix="/alerts", tags=["alerts"])


@router.get("/rules", response_model=List[AlertRuleOut])
def list_rules(db: Session = Depends(get_db)):
    return db.query(AlertRule).all()


@router.put("/rules/{rule_id}")
def update_rule(rule_id: int, updates: dict, db: Session = Depends(get_db)):
    rule = db.query(AlertRule).filter(AlertRule.id == rule_id).first()
    if not rule:
        return {"error": "not found"}
    for k, v in updates.items():
        setattr(rule, k, v)
    db.commit()
    db.refresh(rule)
    return rule
