from fastapi import APIRouter
from app.api.endpoints import extract_code, locate_code

router = APIRouter()

router.include_router(extract_code.router, prefix="/api", tags=["取件码"])
router.include_router(locate_code.router, prefix="/api", tags=["定位"])