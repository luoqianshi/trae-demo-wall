from sqlalchemy.orm import Session
from app.models.models import AlertRule, ModelVersion, Camera, Event
from app.core.labels import LABEL_CATEGORIES, RISK_MAP, PRIVACY_LABELS


def seed_data(db: Session):
    # NOTE: The default administrator is now created by `init_db` in
    # app/core/database.py (with a properly hashed password). Do not seed a
    # User here to avoid overwriting or conflicting with it.

    # Seed alert rules from unified label system
    if db.query(AlertRule).count() == 0:
        # Define trigger conditions per risk level
        trigger_map = {
            "P0": "检测到即触发",
            "P1": "检测到即触发",
            "P2": "持续 >= 3 分钟",
            "P3": "仅记录",
        }
        notify_map = {
            "P0": "微信+短信",
            "P1": "微信",
            "P2": "微信",
            "P3": "仅记录",
        }
        target_map = {
            "P0": "全部人员",
            "P1": "全部人员",
            "P2": "管理员+护工",
            "P3": "-",
        }

        rules = []
        for cat in LABEL_CATEGORIES:
            risk = cat["group"].split(" ")[0]  # "P0 生命危险" -> "P0"
            for label in cat["items"]:
                # Skip non-alert labels and privacy labels
                # (privacy labels are not alert-worthy events)
                if label in ("模糊/无法判断",) or label in PRIVACY_LABELS:
                    continue
                rules.append(AlertRule(
                    state_name=label,
                    risk_level=risk,
                    trigger_condition=trigger_map.get(risk, "仅记录"),
                    notify_method=notify_map.get(risk, "仅记录"),
                    notify_targets=target_map.get(risk, "-"),
                ))

        for r in rules:
            db.add(r)
        db.commit()

    # Seed cameras (real configuration)
    if db.query(Camera).count() == 0:
        cam = Camera(name="卧室-东", rtsp_url="rtsp://192.168.1.105/stream1", resolution="1920x1080", sample_interval=2, status="offline")
        db.add(cam)
        cam2 = Camera(name="客厅", rtsp_url="rtsp://192.168.1.106/stream1", resolution="1280x720", sample_interval=3, status="offline")
        db.add(cam2)
        db.commit()

    # NOTE: No fake model versions or fake events seeded here.
    # Model versions should only be created after real training.
    # Events should only be created by the real inference pipeline.
