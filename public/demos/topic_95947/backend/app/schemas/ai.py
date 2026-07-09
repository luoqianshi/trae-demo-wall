from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class AIChatRequest(BaseModel):
    session_id: Optional[str] = None
    message: str = Field(..., min_length=1)
    topic: Optional[str] = None
    agent_type: Optional[str] = "operations"
    file: Optional[dict] = None

class AIChatResponse(BaseModel):
    session_id: str
    message: str
    topic: Optional[str]
    timestamp: datetime

class AIGeneratePlanRequest(BaseModel):
    plan_type: str = Field(..., max_length=50)
    title: str = Field(..., max_length=200)
    merchant_info: Optional[dict] = None
    target_audience: Optional[str] = None

class AIGeneratePlanResponse(BaseModel):
    plan_id: str
    title: str
    content: dict
    ai_suggestion: str

class AI分析Request(BaseModel):
    analysis_type: str = Field(..., max_length=50)
    data: dict = Field(...)

class AI分析Response(BaseModel):
    analysis_type: str
    result: dict
    summary: str

class AIMessageResponse(BaseModel):
    id: str
    role: str
    content: str
    created_at: datetime

class AIEvidenceItem(BaseModel):
    metric: str
    value: Any
    compare_to: Optional[str] = None
    change: Optional[str] = None
    insight: Optional[str] = None

class AIActionItem(BaseModel):
    title: str
    priority: str = Field(..., pattern="^(high|medium|low)$")
    expected_impact: str
    steps: List[str] = Field(default_factory=list)
    tool_hint: Optional[str] = None

class AIStructuredDiagnosisRequest(BaseModel):
    question: Optional[str] = None
    time_range: str = Field(default="today", max_length=20)
    include_actions: bool = True

class AIStructuredDiagnosisResponse(BaseModel):
    summary: str
    evidence: List[AIEvidenceItem] = Field(default_factory=list)
    actions: List[AIActionItem] = Field(default_factory=list)
    confidence: str = Field(..., pattern="^(high|medium|low)$")
    data_range: str
    next_steps: List[str] = Field(default_factory=list)
    risks: List[str] = Field(default_factory=list)
    opportunities: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class AIActionCardCreateRequest(BaseModel):
    title: str = Field(..., max_length=200)
    problem: Optional[str] = None
    evidence: List[AIEvidenceItem] = Field(default_factory=list)
    suggested_action: AIActionItem
    priority: str = Field(default="medium", pattern="^(high|medium|low)$")
    data_range: Optional[str] = None
    expected_impact: Optional[str] = None
    source: str = Field(default="structured_diagnosis", max_length=80)
    assignee: Optional[str] = Field(default=None, max_length=100)
    due_date: Optional[str] = Field(default=None, max_length=30)
    confirmed: bool = False

class AIActionCardResponse(BaseModel):
    id: str
    title: str
    problem: Optional[str] = None
    evidence: List[Dict[str, Any]] = Field(default_factory=list)
    suggested_action: Dict[str, Any] = Field(default_factory=dict)
    priority: str
    status: str
    data_range: Optional[str] = None
    expected_impact: Optional[str] = None
    source: Optional[str] = None
    assignee: Optional[str] = None
    due_date: Optional[str] = None
    material: Dict[str, Any] = Field(default_factory=dict)
    review_result: Dict[str, Any] = Field(default_factory=dict)
    completed_at: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

class AIActionCardStatusUpdate(BaseModel):
    status: str = Field(..., pattern="^(draft|todo|doing|done|reviewed|ignored|revoked|rejected)$")
    reason: Optional[str] = Field(default=None, max_length=500)
    review_result: Optional[Dict[str, Any]] = None
    audit: Optional[Dict[str, Any]] = None

class AIActionCardUpdateRequest(BaseModel):
    assignee: Optional[str] = Field(default=None, max_length=100)
    due_date: Optional[str] = Field(default=None, max_length=30)
    status: Optional[str] = Field(default=None, pattern="^(draft|todo|doing|done|reviewed|ignored|revoked|rejected)$")
    reason: Optional[str] = Field(default=None, max_length=500)
    review_result: Optional[Dict[str, Any]] = None
    audit: Optional[Dict[str, Any]] = None

class AIMaterialGenerateRequest(BaseModel):
    material_type: str = Field(default="marketing_copy", pattern="^(marketing_copy|member_sms|staff_script|short_video_script)$")

class AIReviewResponse(BaseModel):
    action_card_id: str
    result_metrics: Dict[str, Any] = Field(default_factory=dict)
    analysis: str
    next_steps: List[str] = Field(default_factory=list)
    before_data: Dict[str, Any] = Field(default_factory=dict)
    after_data: Dict[str, Any] = Field(default_factory=dict)

class AIMemoryResponse(BaseModel):
    id: str
    memory_type: str
    key: str
    value: Dict[str, Any] = Field(default_factory=dict)
    source: Optional[str] = None
    created_at: Optional[datetime] = None

class AIQualityCaseCreateRequest(BaseModel):
    name: str = Field(..., max_length=160)
    prompt: str = Field(..., min_length=1)
    expected_checks: Dict[str, Any] = Field(default_factory=dict)

class AIQualityCaseResponse(BaseModel):
    id: str
    name: str
    prompt: str
    expected_checks: Dict[str, Any] = Field(default_factory=dict)
    last_result: Dict[str, Any] = Field(default_factory=dict)
    status: str


class AIAgentConfigRequest(BaseModel):
    agent_type: Optional[str] = Field(default=None, max_length=50)
    name: str = Field(..., max_length=120)
    description: Optional[str] = None
    icon: str = Field(default="fas fa-robot", max_length=80)
    color: str = Field(default="#3b82f6", max_length=30)
    system_prompt: str = Field(..., min_length=10)
    enabled: bool = True


class AIAgentConfigResponse(BaseModel):
    id: str
    agent_type: str
    name: str
    description: Optional[str] = None
    icon: str
    color: str
    system_prompt: str
    enabled: bool
    is_builtin: bool = False
