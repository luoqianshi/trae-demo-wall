from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from collections import Counter
import json

from app.core.database import get_db
from app.models.models import Event, Annotation, Camera, ModelVersion, Frame

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats")
def get_stats(db: Session = Depends(get_db)):
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_events = db.query(Event).filter(Event.created_at >= today).count()
    total_annotations = db.query(Annotation).count()
    total_cameras = db.query(Camera).count()
    online_cameras = db.query(Camera).filter(Camera.status == "online").count()
    active_model = db.query(ModelVersion).filter(ModelVersion.is_active == True).first()
    accuracy = active_model.accuracy if active_model else 0.0

    return {
        "today_events": today_events,
        "model_accuracy": round(accuracy * 100, 1) if accuracy else 0.0,
        "annotated_samples": total_annotations,
        "online_cameras": f"{online_cameras}/{total_cameras}"
    }


@router.get("/training-analysis")
def training_analysis(db: Session = Depends(get_db)):
    """Analyze annotation data and return adaptive suggestions for improving accuracy."""
    anns = db.query(Annotation).all()
    total = len(anns)

    if total == 0:
        return {
            "total_samples": 0,
            "num_labels": 0,
            "label_distribution": [],
            "suggestions": [
                {"level": "error", "title": "无标注数据", "desc": "请先处理视频并标注图片，再开始训练。"}
            ]
        }

    # Parse all individual labels (comma-separated)
    label_counter = Counter()
    for a in anns:
        tags = [t.strip() for t in a.label.split(",") if t.strip()]
        for t in tags:
            label_counter[t] += 1

    num_labels = len(label_counter)
    label_dist = label_counter.most_common()
    max_count = label_dist[0][1] if label_dist else 0
    min_count = label_dist[-1][1] if label_dist else 0
    avg_count = total / max(num_labels, 1)

    suggestions = []

    # Suggestion 1: Sample count
    if total < 100:
        suggestions.append({
            "level": "error",
            "title": f"样本量严重不足（{total} 张）",
            "desc": f"当前仅 {total} 张标注样本，建议至少 300-500 张。样本太少模型无法学习有效特征。"
        })
    elif total < 300:
        suggestions.append({
            "level": "warning",
            "title": f"样本量偏少（{total} 张）",
            "desc": f"当前 {total} 张样本，建议增加到 300-500 张以提升泛化能力。"
        })
    else:
        suggestions.append({
            "level": "ok",
            "title": f"样本量充足（{total} 张）",
            "desc": f"当前 {total} 张标注样本，样本量达标。"
        })

    # Suggestion 2: Label balance
    if num_labels > 0:
        imbalance_ratio = max_count / max(min_count, 1)
        rare_labels = [(l, c) for l, c in label_dist if c < 5]
        if imbalance_ratio > 10:
            suggestions.append({
                "level": "error",
                "title": f"标签严重不均衡（最多 {max_count} vs 最少 {min_count}）",
                "desc": f"\"{label_dist[0][0]}\" 有 {max_count} 张，而 \"{label_dist[-1][0]}\" 只有 {min_count} 张，模型会严重偏向高频标签。"
                       + (f" 以下标签样本不足 5 张: {', '.join([l for l, c in rare_labels])}" if rare_labels else "")
            })
        elif imbalance_ratio > 5:
            suggestions.append({
                "level": "warning",
                "title": f"标签不够均衡（最多 {max_count} vs 最少 {min_count}）",
                "desc": f"部分标签样本偏少，建议补充: {', '.join([l for l, c in rare_labels])}" if rare_labels
                       else f"\"{label_dist[0][0]}\" 有 {max_count} 张，而 \"{label_dist[-1][0]}\" 只有 {min_count} 张。"
            })
        else:
            suggestions.append({
                "level": "ok",
                "title": "标签分布均衡",
                "desc": f"各标签样本量差异不大（{min_count}-{max_count} 张），分布合理。"
            })

    # Suggestion 3: Rare labels warning
    rare = [(l, c) for l, c in label_dist if c < 3]
    if rare:
        suggestions.append({
            "level": "warning",
            "title": f"{len(rare)} 个标签样本不足 3 张",
            "desc": "这些标签模型几乎学不到，建议补充样本或暂时移除: " + ", ".join([f"{l}({c}张)" for l, c in rare])
        })

    # Suggestion 4: Epoch recommendation based on sample count
    if total < 100:
        rec_epochs = "80-100"
        reason = "样本少时需要更多轮次让模型收敛"
    elif total < 300:
        rec_epochs = "60-80"
        reason = "中等样本量，适中轮数即可"
    else:
        rec_epochs = "30-50"
        reason = "样本充足时较少轮数即可收敛，过多会过拟合"
    suggestions.append({
        "level": "info",
        "title": f"建议训练轮数: {rec_epochs}",
        "desc": f"基于当前 {total} 张样本，{reason}。注意观察验证准确率是否开始下降（过拟合信号）。"
    })

    return {
        "total_samples": total,
        "num_labels": num_labels,
        "label_distribution": [{"label": l, "count": c} for l, c in label_dist],
        "suggestions": suggestions
    }


@router.get("/recent-events")
def recent_events(limit: int = 5, db: Session = Depends(get_db)):
    return db.query(Event).order_by(Event.created_at.desc()).limit(limit).all()
