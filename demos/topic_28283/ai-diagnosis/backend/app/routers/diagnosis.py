from fastapi import APIRouter
from app.models import DiagnosisRequest, DiagnosisResponse
from app.services.diagnosis import diagnose

router = APIRouter(prefix="/api/diagnosis", tags=["diagnosis"])


@router.post("", response_model=DiagnosisResponse)
async def diagnose_request(body: DiagnosisRequest):
    """AI诊断接口"""
    return await diagnose(body)
