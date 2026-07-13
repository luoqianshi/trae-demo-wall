from __future__ import annotations

from enum import Enum
from typing import Literal

from pydantic import BaseModel, Field


class SessionStage(str, Enum):
    SETUP = "setup"
    INTERVIEW = "interview"
    REPORT = "report"


class SessionCreate(BaseModel):
    role: str = Field(min_length=2, max_length=100)
    experience_years: int = Field(ge=0, le=40)
    skills: list[str] = Field(min_length=1, max_length=12)
    resume_text: str = Field(default="", max_length=12000)
    job_description: str = Field(default="", max_length=12000)


class LlmConnectionRequest(BaseModel):
    base_url: str = Field(min_length=8, max_length=500)
    api_key: str = Field(min_length=1, max_length=500)
    model: str = Field(min_length=1, max_length=200)


class LlmConnectionResult(BaseModel):
    ok: bool
    message: str
    model: str


class SessionCreated(BaseModel):
    session_id: str
    gateway_instructions: str
    questions: list[str]
    stage: SessionStage


class TranscriptEntry(BaseModel):
    role: Literal["user", "assistant"]
    text: str = Field(min_length=1, max_length=6000)


class TranscriptBatch(BaseModel):
    entries: list[TranscriptEntry] = Field(min_length=1, max_length=50)


class DimensionScore(BaseModel):
    key: str
    label: str
    score: int = Field(ge=1, le=10)
    evidence: str
    suggestion: str


class InterviewReport(BaseModel):
    session_id: str
    overall_score: int = Field(ge=10, le=100)
    recommendation: str
    summary: str
    dimensions: list[DimensionScore] = Field(min_length=7, max_length=7)


DIMENSIONS = [
    ("technical_accuracy", "技术准确性"),
    ("project_depth", "项目深度"),
    ("problem_analysis", "问题分析"),
    ("system_design", "系统设计"),
    ("communication_clarity", "表达清晰度"),
    ("collaboration", "沟通协作"),
    ("improvement", "改进建议"),
]
