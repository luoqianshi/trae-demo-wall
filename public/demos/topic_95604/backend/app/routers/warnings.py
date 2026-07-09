from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from ..database import get_db
from ..models.warning import Warning, WarningLevel, WarningType, WarningStatus
from ..schemas.warning import (
    WarningCreate, WarningUpdate, WarningResponse, 
    WarningStatistics, WarningListResponse
)

router = APIRouter(prefix="/warnings", tags=["预警管理"])

@router.get("/", response_model=WarningListResponse)
def get_warnings(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    level: Optional[str] = None,
    warning_type: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Warning)
    
    if level:
        query = query.filter(Warning.level == level)
    if warning_type:
        query = query.filter(Warning.warning_type == warning_type)
    if status:
        query = query.filter(Warning.status == status)
    if search:
        query = query.filter(
            (Warning.title.contains(search)) | 
            (Warning.code.contains(search)) |
            (Warning.location.contains(search))
        )
    
    total = query.count()
    items = query.order_by(Warning.created_at.desc())\
                  .offset((page - 1) * page_size)\
                  .limit(page_size)\
                  .all()
    
    return WarningListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size
    )

@router.get("/statistics", response_model=WarningStatistics)
def get_warning_statistics(db: Session = Depends(get_db)):
    total = db.query(Warning).count()
    
    by_level = {}
    for level in WarningLevel:
        count = db.query(Warning).filter(Warning.level == level).count()
        by_level[level.value] = count
    
    by_type = {}
    for wtype in WarningType:
        count = db.query(Warning).filter(Warning.warning_type == wtype).count()
        by_type[wtype.value] = count
    
    by_status = {}
    for status in WarningStatus:
        count = db.query(Warning).filter(Warning.status == status).count()
        by_status[status.value] = count
    
    return WarningStatistics(
        total=total,
        by_level=by_level,
        by_type=by_type,
        by_status=by_status
    )

@router.get("/{warning_id}", response_model=WarningResponse)
def get_warning(warning_id: int, db: Session = Depends(get_db)):
    warning = db.query(Warning).filter(Warning.id == warning_id).first()
    if not warning:
        raise HTTPException(status_code=404, detail="预警不存在")
    return warning

@router.post("/", response_model=WarningResponse)
def create_warning(warning_data: WarningCreate, db: Session = Depends(get_db)):
    # 生成预警编号
    today = datetime.now().strftime("%Y%m%d")
    count = db.query(Warning).filter(
        Warning.code.contains(today)
    ).count() + 1
    code = f"W{today}{str(count).zfill(4)}"
    
    db_warning = Warning(
        code=code,
        title=warning_data.title,
        description=warning_data.description,
        level=warning_data.level,
        warning_type=warning_data.warning_type,
        latitude=warning_data.latitude,
        longitude=warning_data.longitude,
        location=warning_data.location,
        measures=warning_data.measures,
        status=WarningStatus.ACTIVE
    )
    db.add(db_warning)
    db.commit()
    db.refresh(db_warning)
    return db_warning

@router.put("/{warning_id}", response_model=WarningResponse)
def update_warning(
    warning_id: int, 
    warning_data: WarningUpdate, 
    db: Session = Depends(get_db)
):
    warning = db.query(Warning).filter(Warning.id == warning_id).first()
    if not warning:
        raise HTTPException(status_code=404, detail="预警不存在")
    
    update_data = warning_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(warning, key, value)
    
    if warning_data.status == WarningStatus.HANDLED and not warning.handled_at:
        warning.handled_at = datetime.now()
    
    db.commit()
    db.refresh(warning)
    return warning

@router.delete("/{warning_id}")
def delete_warning(warning_id: int, db: Session = Depends(get_db)):
    warning = db.query(Warning).filter(Warning.id == warning_id).first()
    if not warning:
        raise HTTPException(status_code=404, detail="预警不存在")
    
    db.delete(warning)
    db.commit()
    return {"message": "预警删除成功"}

@router.post("/{warning_id}/handle", response_model=WarningResponse)
def handle_warning(warning_id: int, db: Session = Depends(get_db)):
    warning = db.query(Warning).filter(Warning.id == warning_id).first()
    if not warning:
        raise HTTPException(status_code=404, detail="预警不存在")
    
    warning.status = WarningStatus.HANDLED
    warning.handled_at = datetime.now()
    db.commit()
    db.refresh(warning)
    return warning

@router.post("/{warning_id}/resolve", response_model=WarningResponse)
def resolve_warning(warning_id: int, db: Session = Depends(get_db)):
    warning = db.query(Warning).filter(Warning.id == warning_id).first()
    if not warning:
        raise HTTPException(status_code=404, detail="预警不存在")
    
    warning.status = WarningStatus.RESOLVED
    db.commit()
    db.refresh(warning)
    return warning
