"""公式库 CRUD API 路由

使用 JSON 文件作为持久化存储（无需数据库依赖）
数据文件: data/formulas.json
"""
import json
import os
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

router = APIRouter(prefix="/api/v1/formulas", tags=["公式库"])

# 数据文件路径
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DATA_FILE = DATA_DIR / "formulas.json"


# ============================================================
# 数据持久化层
# ============================================================

def _load_formulas() -> list[dict]:
    """从 JSON 文件加载所有公式"""
    if not DATA_FILE.exists():
        return []
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, Exception):
        return []


def _save_formulas(formulas: list[dict]) -> None:
    """将公式列表保存到 JSON 文件"""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(formulas, f, ensure_ascii=False, indent=2)


def _next_id() -> str:
    """生成唯一 ID"""
    return str(uuid.uuid4())


def _now() -> str:
    """当前 UTC 时间 ISO 格式"""
    return datetime.now(timezone.utc).isoformat()


# ============================================================
# Pydantic 模型
# ============================================================

class FormulaCreate(BaseModel):
    latex_code: str
    source_paper_title: Optional[str] = None
    source_paper_url: Optional[str] = None
    tags: list[str] = []
    category: Optional[str] = None
    notes: Optional[str] = None


class FormulaUpdate(BaseModel):
    latex_code: Optional[str] = None
    source_paper_title: Optional[str] = None
    source_paper_url: Optional[str] = None
    tags: Optional[list[str]] = None
    category: Optional[str] = None
    notes: Optional[str] = None


class FormulaResponse(BaseModel):
    id: str
    latex_code: str
    source_paper_title: Optional[str]
    source_paper_url: Optional[str]
    tags: list[str]
    category: Optional[str]
    notes: Optional[str]
    created_at: str
    updated_at: str


class FormulaBatchCreate(BaseModel):
    formulas: list[FormulaCreate]
    source_paper_title: Optional[str] = None
    tags: list[str] = []
    category: Optional[str] = None


def _formula_to_response(f: dict) -> dict:
    """将内部字典转为响应格式"""
    return {
        "id": f["id"],
        "latex_code": f["latex_code"],
        "source_paper_title": f.get("source_paper_title"),
        "source_paper_url": f.get("source_paper_url"),
        "tags": f.get("tags", []),
        "category": f.get("category"),
        "notes": f.get("notes"),
        "created_at": f["created_at"],
        "updated_at": f["updated_at"],
    }


# ============================================================
# API 端点
# ============================================================

@router.get("", response_model=list[FormulaResponse])
async def list_formulas(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    tag: Optional[str] = None,
    category: Optional[str] = None,
    search: Optional[str] = None,
):
    """查询公式列表（分页 + 筛选 + 搜索）"""
    formulas = _load_formulas()

    # 按标签筛选
    if tag:
        formulas = [f for f in formulas if tag in f.get("tags", [])]

    # 按分类筛选
    if category:
        formulas = [f for f in formulas if f.get("category") == category]

    # 关键词搜索（搜索 LaTeX 代码和来源标题）
    if search:
        s = search.lower()
        formulas = [
            f for f in formulas
            if s in f["latex_code"].lower()
            or (f.get("source_paper_title") and s in f["source_paper_title"].lower())
            or (f.get("notes") and s in f["notes"].lower())
        ]

    # 按创建时间倒序
    formulas.sort(key=lambda x: x["created_at"], reverse=True)

    # 分页
    start = (page - 1) * page_size
    end = start + page_size
    paged = formulas[start:end]

    return [_formula_to_response(f) for f in paged]


@router.get("/{formula_id}", response_model=FormulaResponse)
async def get_formula(formula_id: str):
    """获取单个公式详情"""
    formulas = _load_formulas()
    for f in formulas:
        if f["id"] == formula_id:
            return _formula_to_response(f)
    raise HTTPException(404, "公式不存在")


@router.post("", response_model=FormulaResponse, status_code=201)
async def create_formula(data: FormulaCreate):
    """保存单个公式到公式库"""
    formulas = _load_formulas()
    now = _now()
    new_formula = {
        "id": _next_id(),
        "latex_code": data.latex_code,
        "source_paper_title": data.source_paper_title,
        "source_paper_url": data.source_paper_url,
        "tags": data.tags,
        "category": data.category,
        "notes": data.notes,
        "created_at": now,
        "updated_at": now,
    }
    formulas.append(new_formula)
    _save_formulas(formulas)
    return _formula_to_response(new_formula)


@router.post("/batch", status_code=201)
async def create_formulas_batch(data: FormulaBatchCreate):
    """批量保存公式到公式库"""
    formulas = _load_formulas()
    now = _now()
    count = 0

    for formula_data in data.formulas:
        new_formula = {
            "id": _next_id(),
            "latex_code": formula_data.latex_code,
            "source_paper_title": (
                formula_data.source_paper_title or data.source_paper_title
            ),
            "source_paper_url": formula_data.source_paper_url,
            "tags": formula_data.tags if formula_data.tags else list(data.tags),
            "category": formula_data.category or data.category,
            "notes": formula_data.notes,
            "created_at": now,
            "updated_at": now,
        }
        formulas.append(new_formula)
        count += 1

    _save_formulas(formulas)
    return {"count": count, "created_at": now}


@router.put("/{formula_id}", response_model=FormulaResponse)
async def update_formula(formula_id: str, data: FormulaUpdate):
    """更新公式"""
    formulas = _load_formulas()
    for i, f in enumerate(formulas):
        if f["id"] == formula_id:
            updated = {**f}
            if data.latex_code is not None:
                updated["latex_code"] = data.latex_code
            if data.source_paper_title is not None:
                updated["source_paper_title"] = data.source_paper_title
            if data.source_paper_url is not None:
                updated["source_paper_url"] = data.source_paper_url
            if data.tags is not None:
                updated["tags"] = data.tags
            if data.category is not None:
                updated["category"] = data.category
            if data.notes is not None:
                updated["notes"] = data.notes
            updated["updated_at"] = _now()
            formulas[i] = updated
            _save_formulas(formulas)
            return _formula_to_response(updated)

    raise HTTPException(404, "公式不存在")


@router.delete("/{formula_id}", status_code=204)
async def delete_formula(formula_id: str):
    """删除公式"""
    formulas = _load_formulas()
    original_len = len(formulas)
    formulas = [f for f in formulas if f["id"] != formula_id]

    if len(formulas) == original_len:
        raise HTTPException(404, "公式不存在")

    _save_formulas(formulas)
