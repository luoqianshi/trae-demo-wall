"""Pydantic 请求模型定义

输入字段按「必填三件套 + 选填增强」拆分：
- 必填三件套（决定方案能否成立）：出发地 city + 人数构成 group + 时间预算 depart_time/return_time/days
- 选填增强（决定方案是否个性化）：兴趣 interests / 心情 mood / 体力 energy / 预算上限 budget_ceiling / 交通方式 transport
"""
from typing import Any, Dict, List, Optional

from pydantic import BaseModel


class MatchCityRequest(BaseModel):
    input: str = ''


class GeneratePlanRequest(BaseModel):
    # ===== 必填三件套 =====
    city: str                       # 出发地
    group: str                      # 人数构成：独行/情侣/带长辈/带小孩/朋友结伴
    days: int = 1                   # 行程天数
    depart_time: str = '09:00'      # 可出发时间
    return_time: str = '21:00'      # 必须返回时间

    # ===== 选填增强 =====
    interests: List[str] = []       # 兴趣偏好
    mood: Optional[str] = None      # 心情
    energy: Optional[str] = None    # 体力状态
    budget_ceiling: Optional[int] = None  # 预算上限（元/人）
    transport: Optional[str] = None       # 交通方式：自驾/公交/步行


class SavePlanRequest(BaseModel):
    # ===== 必填三件套 =====
    city: str
    group: str
    days: int
    depart_time: Optional[str] = '09:00'
    return_time: Optional[str] = '21:00'
    # ===== 选填增强 =====
    interests: List[str] = []
    mood: Optional[str] = None
    energy: Optional[str] = None
    budget_ceiling: Optional[int] = None
    transport: Optional[str] = None
    # ===== 方案数据 =====
    plan_data: Dict[str, Any]
