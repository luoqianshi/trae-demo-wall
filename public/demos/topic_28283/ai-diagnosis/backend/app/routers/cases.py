from fastapi import APIRouter
from app.models import CaseMatchRequest, CaseMatchResponse
from app.services.case_matcher import match_cases, get_all_cases

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.get("")
async def list_cases():
    """获取所有历史案例"""
    cases = get_all_cases()
    return [c.model_dump() for c in cases]


@router.post("/match", response_model=CaseMatchResponse)
async def match_historical_cases(body: CaseMatchRequest):
    """匹配历史案例"""
    return match_cases(body)
