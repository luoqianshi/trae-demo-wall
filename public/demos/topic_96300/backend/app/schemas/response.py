from pydantic import BaseModel
from typing import List, Optional


class CandidateCode(BaseModel):
    full_code: str
    short_code: str


class ExtractCodeResponse(BaseModel):
    candidates: List[CandidateCode]
    ocr_engine: str
    fallback_used: bool
    message: Optional[str] = None


class LocateCodeNotFoundResponse(BaseModel):
    found: bool = False
    target_code: str
    message: str
    suggestions: List[str]
    ocr_engine: str
    fallback_used: bool