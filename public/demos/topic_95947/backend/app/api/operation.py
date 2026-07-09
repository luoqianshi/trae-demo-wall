from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.operation import OperationPlanCreateRequest, OperationPlanResponse, GenerateCopyRequest, GenerateCopyResponse, MenuOptimizeRequest, MenuOptimizeResponse
from app.services.operation_service import OperationService
from app.core.database import get_db
from app.core.security import decode_merchant_id
from fastapi.security import OAuth2PasswordBearer
from typing import List
import uuid

router = APIRouter(prefix="/operations", tags=["运营管理"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_merchant_id(token: str = Depends(oauth2_scheme)) -> uuid.UUID:
    return decode_merchant_id(token)

@router.post("/plans", response_model=OperationPlanResponse)
def create_plan(request: OperationPlanCreateRequest, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        plan = OperationService.create_plan(db, merchant_id, request)
        return OperationPlanResponse(
            id=str(plan.id),
            merchant_id=str(plan.merchant_id),
            title=plan.title,
            type=plan.type,
            content=plan.content,
            ai_suggestion=plan.ai_suggestion,
            status=plan.status,
            effect_score=plan.effect_score,
            created_at=plan.created_at,
            updated_at=plan.updated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/plans", response_model=List[OperationPlanResponse])
def get_plans(merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    plans = OperationService.get_plans(db, merchant_id)
    return [OperationPlanResponse(
        id=str(p.id),
        merchant_id=str(p.merchant_id),
        title=p.title,
        type=p.type,
        content=p.content,
        ai_suggestion=p.ai_suggestion,
        status=p.status,
        effect_score=p.effect_score,
        created_at=p.created_at,
        updated_at=p.updated_at
    ) for p in plans]

@router.get("/plans/{plan_id}", response_model=OperationPlanResponse)
def get_plan(plan_id: str, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        plan = OperationService.get_plan(db, plan_id, merchant_id)
        return OperationPlanResponse(
            id=str(plan.id),
            merchant_id=str(plan.merchant_id),
            title=plan.title,
            type=plan.type,
            content=plan.content,
            ai_suggestion=plan.ai_suggestion,
            status=plan.status,
            effect_score=plan.effect_score,
            created_at=plan.created_at,
            updated_at=plan.updated_at
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.put("/plans/{plan_id}")
def update_plan(plan_id: str, data: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        OperationService.update_plan(db, plan_id, merchant_id, data)
        return {"message": "更新成功"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.delete("/plans/{plan_id}")
def delete_plan(plan_id: str, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        OperationService.delete_plan(db, plan_id, merchant_id)
        return {"message": "删除成功"}
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/generate-copy", response_model=GenerateCopyResponse)
async def generate_copy(request: GenerateCopyRequest):
    try:
        result = await OperationService.generate_copy(request)
        return GenerateCopyResponse(
            copy_text=result["copy_text"],
            platform=result["platform"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/menu-optimize", response_model=MenuOptimizeResponse)
async def menu_optimize(request: MenuOptimizeRequest):
    try:
        result = await OperationService.optimize_menu(request)
        return MenuOptimizeResponse(
            suggestions=result["suggestions"],
            optimized_menu=result["optimized_menu"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/competitors")
def add_competitor(data: dict, merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    try:
        competitor = OperationService.add_competitor(db, merchant_id, data)
        return {
            "id": str(competitor.id),
            "name": competitor.name,
            "type": competitor.type,
            "region": competitor.region,
            "platform": competitor.platform,
            "url": competitor.url
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/competitors")
def get_competitors(merchant_id: str = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    competitors = OperationService.get_competitors(db, merchant_id)
    return [{
        "id": str(c.id),
        "name": c.name,
        "type": c.type,
        "region": c.region,
        "platform": c.platform,
        "url": c.url
    } for c in competitors]
