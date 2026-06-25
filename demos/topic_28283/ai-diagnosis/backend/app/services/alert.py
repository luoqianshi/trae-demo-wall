from datetime import datetime
from app.models import Alert, SeverityLevel
from typing import Optional


# 告警存储
_alerts: list[Alert] = []
_alert_id_counter = 0


def _init_default_alerts():
    global _alert_id_counter
    defaults = [
        Alert(
            id="alert-init-1",
            severity=SeverityLevel.CRITICAL,
            title="压缩机K-201振动超限",
            description="振动值 8.7mm/s 超过阈值 6.0mm/s，持续上升中",
            device_id="K-201",
            timestamp=datetime.now(),
        ),
        Alert(
            id="alert-init-2",
            severity=SeverityLevel.WARNING,
            title="常压塔T-101回流比偏高",
            description="回流比 4.8 偏离设定值 3.5，产品分离度下降",
            device_id="T-101-R",
            timestamp=datetime.now(),
        ),
        Alert(
            id="alert-init-3",
            severity=SeverityLevel.INFO,
            title="反应器R-301温度微升",
            description="温度 498°C 较设定值高 3°C，趋势平稳",
            device_id="R-301",
            timestamp=datetime.now(),
        ),
    ]
    _alerts.extend(defaults)
    _alert_id_counter = 3


_init_default_alerts()


def get_alerts(severity: Optional[SeverityLevel] = None, limit: int = 50) -> list[Alert]:
    result = _alerts
    if severity:
        result = [a for a in result if a.severity == severity]
    return sorted(result, key=lambda a: a.timestamp, reverse=True)[:limit]


def add_alert(alert: Alert) -> Alert:
    global _alert_id_counter
    _alert_id_counter += 1
    alert.id = f"alert-{_alert_id_counter}"
    _alerts.append(alert)
    return alert


def acknowledge_alert(alert_id: str) -> Optional[Alert]:
    for a in _alerts:
        if a.id == alert_id:
            a.acknowledged = True
            return a
    return None


def get_active_count() -> int:
    return len([a for a in _alerts if not a.acknowledged])
