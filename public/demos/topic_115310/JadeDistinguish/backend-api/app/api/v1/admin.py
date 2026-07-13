from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.core.database import get_db
from app.models.models import IdentifyRecord, User
from app.schemas.schemas import IdentifyResponse, StatsResponse

router = APIRouter(prefix="/admin", tags=["管理端"])


@router.get("/records", response_model=list[IdentifyResponse])
async def list_records(
    skip: int = 0,
    limit: int = 20,
    user_id: int = None,
    jade_type: str = None,
    status: str = None,
    db: Session = Depends(get_db)
):
    """获取鉴别记录列表（管理端）"""
    query = db.query(IdentifyRecord)
    
    if user_id:
        query = query.filter(IdentifyRecord.user_id == user_id)
    if jade_type:
        query = query.filter(IdentifyRecord.jade_type == jade_type)
    if status:
        query = query.filter(IdentifyRecord.status == status)
    
    records = query.order_by(IdentifyRecord.created_at.desc()).offset(skip).limit(limit).all()
    return records


@router.get("/stats", response_model=StatsResponse)
async def get_stats(db: Session = Depends(get_db)):
    """获取统计数据"""
    # 总鉴别数
    total_identifies = db.query(IdentifyRecord).count()
    
    # 今日鉴别数
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    today_identifies = db.query(IdentifyRecord).filter(
        IdentifyRecord.created_at >= today_start
    ).count()
    
    # 总用户数
    total_users = db.query(User).count()
    
    # AI 准确率（模拟数据，实际需要标注数据计算）
    ai_accuracy = 0.85
    
    return StatsResponse(
        total_identifies=total_identifies,
        today_identifies=today_identifies,
        total_users=total_users,
        ai_accuracy=ai_accuracy
    )
