from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.schemas import EventOut
from app.models.models import Event

router = APIRouter(prefix="/events", tags=["events"])


@router.get("/", response_model=List[EventOut])
def list_events(
    risk_level: Optional[str] = None,
    days: int = 7,
    db: Session = Depends(get_db)
):
    query = db.query(Event)
    if risk_level:
        query = query.filter(Event.risk_level == risk_level)
    since = datetime.now() - timedelta(days=days)
    query = query.filter(Event.created_at >= since)
    return query.order_by(Event.created_at.desc()).all()


@router.get("/stats")
def event_stats(db: Session = Depends(get_db)):
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_count = db.query(Event).filter(Event.created_at >= today).count()
    total = db.query(Event).count()
    return {"today_events": today_count, "total_events": total}
