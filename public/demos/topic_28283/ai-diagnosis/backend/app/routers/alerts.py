from fastapi import APIRouter, HTTPException
from app.models import Alert, AlertCreate, SeverityLevel
from app.services.alert import get_alerts, add_alert, acknowledge_alert, get_active_count
from app.services.simulator import get_gauge_data, check_alerts
from datetime import datetime

router = APIRouter(prefix="/api/alerts", tags=["alerts"])


@router.get("")
async def list_alerts(severity: SeverityLevel | None = None, limit: int = 50):
    """获取告警列表"""
    alerts = get_alerts(severity=severity, limit=limit)
    return [a.model_dump(mode="json") for a in alerts]


@router.get("/active-count")
async def active_alert_count():
    """获取活跃告警数量"""
    return {"count": get_active_count()}


@router.post("")
async def create_alert(body: AlertCreate):
    """创建告警"""
    alert = Alert(
        id="",
        severity=body.severity,
        title=body.title,
        description=body.description,
        device_id=body.device_id,
        timestamp=datetime.now(),
    )
    result = add_alert(alert)
    return result.model_dump(mode="json")


@router.put("/{alert_id}/acknowledge")
async def ack_alert(alert_id: str):
    """确认告警"""
    result = acknowledge_alert(alert_id)
    if not result:
        raise HTTPException(status_code=404, detail="告警不存在")
    return result.model_dump(mode="json")


@router.post("/check")
async def check_new_alerts():
    """基于当前仪表数据检查新告警"""
    gauges = get_gauge_data()
    new_alerts = check_alerts(gauges)
    added = []
    for a in new_alerts:
        added.append(add_alert(a))
    return [a.model_dump(mode="json") for a in added]
