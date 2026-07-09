from sqlalchemy.orm import Session
from app.models.operation import OperationPlan, Competitor, CompetitorData
from app.schemas.operation import OperationPlanCreateRequest, GenerateCopyRequest, MenuOptimizeRequest
from app.ai.deepseek import deepseek_client
import uuid

class OperationService:
    @staticmethod
    def create_plan(db: Session, merchant_id: str, request: OperationPlanCreateRequest):
        plan = OperationPlan(
            id=uuid.uuid4(),
            merchant_id=merchant_id,
            title=request.title,
            type=request.type,
            content=request.content,
            ai_suggestion=request.ai_suggestion
        )
        
        db.add(plan)
        db.commit()
        db.refresh(plan)
        return plan
    
    @staticmethod
    def get_plans(db: Session, merchant_id: str):
        return db.query(OperationPlan).filter(
            OperationPlan.merchant_id == merchant_id
        ).order_by(OperationPlan.created_at.desc()).all()
    
    @staticmethod
    def get_plan(db: Session, plan_id: str, merchant_id: str):
        plan = db.query(OperationPlan).filter(
            OperationPlan.id == uuid.UUID(plan_id),
            OperationPlan.merchant_id == merchant_id
        ).first()
        if not plan:
            raise ValueError("方案不存在")
        return plan
    
    @staticmethod
    def update_plan(db: Session, plan_id: str, merchant_id: str, data: dict):
        plan = db.query(OperationPlan).filter(
            OperationPlan.id == uuid.UUID(plan_id),
            OperationPlan.merchant_id == merchant_id
        ).first()
        if not plan:
            raise ValueError("方案不存在")
        
        for key, value in data.items():
            if hasattr(plan, key):
                setattr(plan, key, value)
        
        db.commit()
        db.refresh(plan)
        return plan
    
    @staticmethod
    def delete_plan(db: Session, plan_id: str, merchant_id: str):
        plan = db.query(OperationPlan).filter(
            OperationPlan.id == uuid.UUID(plan_id),
            OperationPlan.merchant_id == merchant_id
        ).first()
        if not plan:
            raise ValueError("方案不存在")
        
        db.delete(plan)
        db.commit()
        return True
    
    @staticmethod
    async def generate_copy(request: GenerateCopyRequest):
        copy_text = await deepseek_client.generate_marketing_copy(
            request.dish_name,
            request.features,
            request.target_audience
        )
        return {"copy_text": copy_text, "platform": request.platform}
    
    @staticmethod
    async def optimize_menu(request: MenuOptimizeRequest):
        ai_response = await deepseek_client.optimize_menu(
            request.current_menu,
            request.sales_data
        )
        return {"suggestions": [], "optimized_menu": [], "ai_advice": ai_response}
    
    @staticmethod
    def add_competitor(db: Session, merchant_id: str, data: dict):
        competitor = Competitor(
            id=uuid.uuid4(),
            merchant_id=merchant_id,
            name=data.get("name"),
            type=data.get("type"),
            region=data.get("region"),
            platform=data.get("platform"),
            url=data.get("url")
        )
        
        db.add(competitor)
        db.commit()
        db.refresh(competitor)
        return competitor
    
    @staticmethod
    def get_competitors(db: Session, merchant_id: str):
        return db.query(Competitor).filter(Competitor.merchant_id == merchant_id).all()
    
    @staticmethod
    def add_competitor_data(db: Session, competitor_id: str, data_type: str, content: dict):
        competitor_data = CompetitorData(
            id=uuid.uuid4(),
            competitor_id=uuid.UUID(competitor_id),
            data_type=data_type,
            content=content
        )
        
        db.add(competitor_data)
        db.commit()
        db.refresh(competitor_data)
        return competitor_data
