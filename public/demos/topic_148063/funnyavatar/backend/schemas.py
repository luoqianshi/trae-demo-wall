"""请求 / 响应数据模型（Pydantic v2）。"""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ============ 请求模型 ============

class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)


class GenerateRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    size: str = Field("512x512", pattern=r"^\d+x\d+$")
    style: str = Field("avatar")


class DCGANGenerateRequest(BaseModel):
    """DCGAN 专用生成请求。"""
    text: str = Field(..., min_length=1, max_length=500)
    size: str = Field("512x512", pattern=r"^\d+x\d+$")
    regenerate: bool = False
    transparent: bool = False


class SearchRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    limit: int = Field(8, ge=1, le=20)


class RecommendRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=500)
    generate: bool = True
    search: bool = True
    # 生成 Provider：auto（按 .env 配置）/ local / external / dcgan-celeba-local
    # 默认 auto：未显式指定时读后端 .env 的 IMAGE_PROVIDER，避免前端覆盖配置
    provider: str = Field("auto")
    limit: int = Field(6, ge=1, le=20)
    # 换一张：DCGAN 时加入随机扰动生成不同 seed
    regenerate: bool = False


# ============ 响应模型 ============

class HealthResponse(BaseModel):
    status: str
    service: str
    image_provider: str
    external_search_enabled: bool


class Analysis(BaseModel):
    styles: list[str] = []
    colors: list[str] = []
    subjects: list[str] = []
    usages: list[str] = []
    directions: list[str] = []
    negative_keywords: list[str] = []


class GeneratedImage(BaseModel):
    image_url: str
    prompt: str
    negative_prompt: str = ""
    provider: str
    seed: Optional[int] = None
    metadata: dict = {}


class MatchItem(BaseModel):
    title: str
    thumbnail_url: str
    source_url: str = ""
    license: str
    license_url: str = ""
    source: str
    match_score: float = 0.0
    match_reason: str = ""
    tags: list[str] = []
    safe_to_use: bool = False


class SearchResponse(BaseModel):
    query: str
    results: list[MatchItem]


class RecommendResponse(BaseModel):
    analysis: Analysis
    generated: Optional[GeneratedImage] = None
    matches: list[MatchItem] = []
    # 生成失败时的可读错误（如 DCGAN 权重缺失），方便前端展示
    generation_error: Optional[str] = None


class ErrorResponse(BaseModel):
    error: str
    detail: str = ""
