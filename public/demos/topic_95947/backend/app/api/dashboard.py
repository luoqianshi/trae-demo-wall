from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.schemas.dashboard import DashboardResponse, SalesSummary, RevenueTrend
from app.services.dashboard_service import DashboardService
from app.core.database import get_db
from app.core.security import decode_merchant_id
from fastapi.security import OAuth2PasswordBearer
from typing import List
import uuid

router = APIRouter(prefix="/dashboard", tags=["仪表盘"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def get_current_merchant_id(token: str = Depends(oauth2_scheme)) -> uuid.UUID:
    return decode_merchant_id(token)

@router.get("/", response_model=DashboardResponse)
def get_dashboard(merchant_id: uuid.UUID = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    return DashboardService.get_dashboard_data(db, merchant_id)

@router.get("/sales-summary", response_model=SalesSummary)
def get_sales_summary(merchant_id: uuid.UUID = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    return DashboardService.get_sales_summary(db, merchant_id)

@router.get("/revenue-trend", response_model=List[RevenueTrend])
def get_revenue_trend(days: int = 7, merchant_id: uuid.UUID = Depends(get_current_merchant_id), db: Session = Depends(get_db)):
    return DashboardService.get_revenue_trend(db, merchant_id, days)
