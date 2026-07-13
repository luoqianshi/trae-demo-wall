from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.identify_service import identify_service
from app.schemas.schemas import IdentifyResponse
from app.config import settings
from typing import Optional

router = APIRouter(prefix="/identify", tags=["鉴别"])


@router.post("", response_model=IdentifyResponse)
async def create_identify(
    file: UploadFile = File(...),
    jade_type: str = Form(default="和田玉"),
    light_mode: str = Form(default="side_45"),
    user_id: Optional[int] = Form(default=None),
    db: Session = Depends(get_db)
):
    """
    创建鉴别记录
    - 上传玉石图像
    - AI 分析真伪
    - 返回鉴别结果
    """
    # 验证文件类型
    if file.content_type not in settings.ALLOWED_IMAGE_TYPES:
        raise HTTPException(status_code=400, detail="不支持的图片格式，仅支持 JPEG/PNG/WebP")
    
    # 读取文件
    image_bytes = await file.read()
    
    # 验证文件大小
    if len(image_bytes) > settings.MAX_IMAGE_SIZE:
        raise HTTPException(status_code=400, detail="图片大小超过限制（最大 10MB）")
    
    try:
        record = await identify_service.create_identify(
            db=db,
            user_id=user_id,
            image_bytes=image_bytes,
            filename=file.filename or "image.jpg",
            jade_type=jade_type,
            light_mode=light_mode
        )
        return record
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"鉴别失败: {str(e)}")


@router.get("/{record_id}", response_model=IdentifyResponse)
async def get_identify(
    record_id: int,
    db: Session = Depends(get_db)
):
    """获取鉴别记录详情"""
    record = await identify_service.get_identify(db, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="记录不存在")
    return record


@router.get("", response_model=list[IdentifyResponse])
async def list_identifies(
    user_id: int,
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db)
):
    """获取用户的鉴别记录列表"""
    records = await identify_service.get_user_identifies(db, user_id, skip, limit)
    return records
