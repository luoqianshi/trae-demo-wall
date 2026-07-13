from sqlalchemy.orm import Session
from app.models.models import IdentifyRecord
from app.schemas.schemas import IdentifyResult
from app.core.storage import storage_service
from app.ai.preprocessor import preprocessor
from app.ai.predictor import predictor
from typing import Optional
import json


class IdentifyService:
    """鉴别服务"""
    
    async def create_identify(
        self,
        db: Session,
        user_id: Optional[int],
        image_bytes: bytes,
        filename: str,
        jade_type: str,
        light_mode: str
    ) -> IdentifyRecord:
        """创建鉴别记录"""
        # 1. 验证图像
        is_valid, message = await preprocessor.validate_image(image_bytes)
        if not is_valid:
            raise ValueError(message)
        
        # 2. 上传图像
        image_url = await storage_service.upload_image(
            file=__import__("io").BytesIO(image_bytes),
            filename=filename
        )
        
        # 3. 创建记录
        record = IdentifyRecord(
            user_id=user_id,
            image_url=image_url,
            jade_type=jade_type,
            light_mode=light_mode,
            status="processing"
        )
        db.add(record)
        db.commit()
        db.refresh(record)
        
        # 4. 预处理图像
        processed_bytes = await preprocessor.preprocess(image_bytes)
        
        # 5. AI 推理
        try:
            result = await predictor.predict(processed_bytes, jade_type, light_mode)
            
            record.is_authentic = result["is_authentic"]
            record.confidence = result["confidence"]
            record.features = result["features"]
            record.suggestion = result["suggestion"]
            record.status = "completed"
        except Exception as e:
            record.status = "failed"
            record.suggestion = f"AI 分析失败: {str(e)}"
        
        db.commit()
        db.refresh(record)
        
        return record
    
    async def get_identify(self, db: Session, record_id: int) -> Optional[IdentifyRecord]:
        """获取鉴别记录"""
        return db.query(IdentifyRecord).filter(IdentifyRecord.id == record_id).first()
    
    async def get_user_identifies(
        self,
        db: Session,
        user_id: int,
        skip: int = 0,
        limit: int = 20
    ) -> list:
        """获取用户的鉴别记录列表"""
        return db.query(IdentifyRecord)\
            .filter(IdentifyRecord.user_id == user_id)\
            .order_by(IdentifyRecord.created_at.desc())\
            .offset(skip)\
            .limit(limit)\
            .all()


identify_service = IdentifyService()
