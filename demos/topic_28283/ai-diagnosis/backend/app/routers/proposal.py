from fastapi import APIRouter
from app.models import ProposalRequest, Proposal
from app.services.diagnosis import generate_proposal

router = APIRouter(prefix="/api/proposal", tags=["proposal"])


@router.post("", response_model=Proposal)
async def create_proposal(body: ProposalRequest):
    """生成技改方案"""
    return await generate_proposal(body)
