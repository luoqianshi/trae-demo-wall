from fastapi import APIRouter
from app.api.auth import router as auth_router
from app.api.merchant import router as merchant_router
from app.api.dashboard import router as dashboard_router
from app.api.ai import router as ai_router
from app.api.operation import router as operation_router
from app.api.member import router as member_router
from app.api.dish import router as dish_router
from app.api.category import router as category_router
from app.api.data_input import router as data_input_router
from app.api.employee import router as employee_router
from app.api.table import router as table_router
from app.api.pos import router as pos_router
from app.api.payment import router as payment_router, reconciliation_router
from app.api.advanced import router as advanced_router

router = APIRouter()

router.include_router(auth_router)
router.include_router(merchant_router)
router.include_router(dashboard_router)
router.include_router(ai_router)
router.include_router(operation_router)
router.include_router(member_router)
router.include_router(dish_router)
router.include_router(category_router)
router.include_router(data_input_router)
router.include_router(employee_router)
router.include_router(table_router)
router.include_router(pos_router)
router.include_router(payment_router)
router.include_router(reconciliation_router)
router.include_router(advanced_router)
