from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from enum import Enum


class SeverityLevel(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"


class DeviceType(str, Enum):
    REACTOR = "reactor"
    DISTILLATION = "distillation"
    COMPRESSOR = "compressor"
    HEAT_EXCHANGER = "heat_exchanger"
    PUMP = "pump"


# ===== 监控数据 =====
class GaugeData(BaseModel):
    id: str
    label: str
    value: float
    unit: str
    status: str = "normal"  # normal / warning / critical
    threshold_warning: float
    threshold_critical: float
    min_val: float
    max_val: float


class MonitorSnapshot(BaseModel):
    timestamp: datetime
    gauges: list[GaugeData]


class TrendPoint(BaseModel):
    timestamp: datetime
    values: dict[str, float]


class TrendData(BaseModel):
    labels: list[str]
    series: dict[str, list[float]]


# ===== 告警 =====
class Alert(BaseModel):
    id: str
    severity: SeverityLevel
    title: str
    description: str
    device_id: str
    timestamp: datetime
    acknowledged: bool = False


class AlertCreate(BaseModel):
    severity: SeverityLevel
    title: str
    description: str
    device_id: str


# ===== AI诊断 =====
class DiagnosisRequest(BaseModel):
    message: str
    device_id: Optional[str] = None
    context: Optional[dict] = None


class DiagnosisResponse(BaseModel):
    reply: str
    matched_cases: list[dict] = []
    suggestions: list[str] = []


# ===== 历史案例 =====
class HistoricalCase(BaseModel):
    id: str
    title: str
    date: str
    plant: str
    device_id: str
    description: str
    root_cause: str
    solution: str
    outcome: str
    tags: list[str]
    similarity: Optional[float] = None


class CaseMatchRequest(BaseModel):
    device_id: str
    symptoms: list[str]
    top_k: int = 3


class CaseMatchResponse(BaseModel):
    cases: list[HistoricalCase]


# ===== 技改方案 =====
class ProposalRequest(BaseModel):
    device_id: str
    problem_description: str
    constraints: Optional[list[str]] = None


class ProposalStep(BaseModel):
    step: int
    title: str
    description: str


class Proposal(BaseModel):
    id: str
    device_id: str
    problem_diagnosis: str
    short_term_action: str
    reform_plan: str
    expected_outcome: str
    steps: list[ProposalStep]
    created_at: datetime
