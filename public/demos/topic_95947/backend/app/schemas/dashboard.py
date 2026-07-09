from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class SalesSummary(BaseModel):
    today_sales: float
    week_sales: float
    month_sales: float
    today_orders: int
    week_orders: int
    month_orders: int
    avg_order_value: float
    conversion_rate: float

class RevenueTrend(BaseModel):
    date: str
    sales: float
    orders: int

class CustomerAnalysis(BaseModel):
    new_customers: int
    returning_customers: int
    customer_retention_rate: float
    avg_visit_frequency: float

class PeakHourData(BaseModel):
    hour: str
    count: int

class DashboardResponse(BaseModel):
    sales_summary: SalesSummary
    revenue_trend: List[RevenueTrend]
    customer_analysis: CustomerAnalysis
    peak_hours: List[PeakHourData]
