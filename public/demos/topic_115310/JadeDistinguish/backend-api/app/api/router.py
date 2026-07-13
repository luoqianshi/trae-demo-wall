from fastapi import APIRouter
from .v1 import identify, auth, admin

router = APIRouter(prefix="/api/v1")

router.include_router(identify.router)
router.include_router(auth.router)
router.include_router(admin.router)
