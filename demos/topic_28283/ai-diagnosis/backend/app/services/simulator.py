import random
import math
from datetime import datetime, timedelta
from app.models import GaugeData, Alert, SeverityLevel


# 装置参数配置
DEVICE_CONFIGS = {
    "R-301": {
        "label": "反应器温度",
        "unit": "°C",
        "base": 495,
        "noise": 3,
        "trend": 0.05,  # 微升趋势
        "warning": 500,
        "critical": 510,
        "min_val": 470,
        "max_val": 530,
    },
    "T-101": {
        "label": "塔顶压力",
        "unit": "MPa",
        "base": 1.82,
        "noise": 0.03,
        "trend": 0.0,
        "warning": 2.0,
        "critical": 2.2,
        "min_val": 1.5,
        "max_val": 2.5,
    },
    "F-201": {
        "label": "进料流量",
        "unit": "t/h",
        "base": 128,
        "noise": 2,
        "trend": 0.0,
        "warning": 145,
        "critical": 155,
        "min_val": 100,
        "max_val": 160,
    },
    "T-101-R": {
        "label": "回流比",
        "unit": "",
        "base": 4.8,
        "noise": 0.15,
        "trend": 0.01,
        "warning": 4.5,
        "critical": 5.5,
        "min_val": 2.0,
        "max_val": 6.0,
    },
    "K-201": {
        "label": "压缩机振动",
        "unit": "mm/s",
        "base": 8.7,
        "noise": 0.3,
        "trend": 0.02,  # 持续上升趋势
        "warning": 6.0,
        "critical": 8.0,
        "min_val": 0,
        "max_val": 12,
    },
}

# 模拟趋势数据缓存
_trend_history: dict[str, list[tuple[datetime, float]]] = {}
_trend_initialized = False


def _init_trend_history():
    global _trend_initialized
    if _trend_initialized:
        return
    now = datetime.now()
    for device_id, cfg in DEVICE_CONFIGS.items():
        points = []
        val = cfg["base"] - cfg["trend"] * 60  # 60步之前
        for i in range(60):
            t = now - timedelta(seconds=(60 - i) * 2)
            val = val + cfg["trend"] + random.gauss(0, cfg["noise"] * 0.5)
            val = max(cfg["min_val"], min(cfg["max_val"], val))
            points.append((t, round(val, 2)))
        _trend_history[device_id] = points
    _trend_initialized = True


def get_gauge_data() -> list[GaugeData]:
    """获取当前所有仪表数据"""
    result = []
    for device_id, cfg in DEVICE_CONFIGS.items():
        history = _trend_history.get(device_id, [])
        if history:
            last_val = history[-1][1]
        else:
            last_val = cfg["base"]

        # 生成新值
        new_val = last_val + cfg["trend"] + random.gauss(0, cfg["noise"])
        new_val = max(cfg["min_val"], min(cfg["max_val"], new_val))
        new_val = round(new_val, 2)

        # 追加到历史
        _trend_history.setdefault(device_id, []).append((datetime.now(), new_val))
        if len(_trend_history[device_id]) > 120:
            _trend_history[device_id] = _trend_history[device_id][-120:]

        # 判断状态
        if new_val >= cfg["critical"]:
            status = "critical"
        elif new_val >= cfg["warning"]:
            status = "warning"
        else:
            status = "normal"

        # 回流比特殊逻辑：偏高即告警
        if device_id == "T-101-R":
            if new_val >= cfg["critical"]:
                status = "critical"
            elif new_val >= cfg["warning"]:
                status = "warning"
            else:
                status = "normal"

        result.append(GaugeData(
            id=device_id,
            label=cfg["label"],
            value=new_val,
            unit=cfg["unit"],
            status=status,
            threshold_warning=cfg["warning"],
            threshold_critical=cfg["critical"],
            min_val=cfg["min_val"],
            max_val=cfg["max_val"],
        ))
    return result


def get_trend_data(points: int = 60) -> dict:
    """获取趋势数据"""
    _init_trend_history()
    result = {"labels": [], "series": {}}
    for device_id in DEVICE_CONFIGS:
        result["series"][device_id] = []

    # 对齐时间轴
    ref_history = list(_trend_history.values())[0]
    start = max(0, len(ref_history) - points)
    labels = []

    for i in range(start, len(ref_history)):
        ts, _ = ref_history[i]
        labels.append(ts.strftime("%H:%M:%S"))

    result["labels"] = labels

    for device_id in DEVICE_CONFIGS:
        history = _trend_history.get(device_id, [])
        s = max(0, len(history) - points)
        result["series"][device_id] = [v for _, v in history[s:]]

    return result


def check_alerts(gauges: list[GaugeData]) -> list[Alert]:
    """根据仪表数据生成告警"""
    alerts = []
    now = datetime.now()

    for g in gauges:
        if g.status == "critical":
            alerts.append(Alert(
                id=f"alert-{g.id}-{int(now.timestamp())}",
                severity=SeverityLevel.CRITICAL,
                title=f"{g.label}({g.id})严重超标",
                description=f"当前值 {g.value}{g.unit} 超过临界阈值 {g.threshold_critical}{g.unit}",
                device_id=g.id,
                timestamp=now,
            ))
        elif g.status == "warning":
            alerts.append(Alert(
                id=f"alert-{g.id}-{int(now.timestamp())}",
                severity=SeverityLevel.WARNING,
                title=f"{g.label}({g.id})偏高",
                description=f"当前值 {g.value}{g.unit} 超过预警阈值 {g.threshold_warning}{g.unit}",
                device_id=g.id,
                timestamp=now,
            ))

    return alerts


_init_trend_history()
