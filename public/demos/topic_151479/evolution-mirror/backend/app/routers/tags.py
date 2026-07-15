"""
标签路由模块
提供标签的增删改查接口
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database import crud

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/tags", tags=["标签"])


# ==================== Pydantic 请求/响应 Schema ====================


class TagCreateRequest(BaseModel):
    """创建标签请求"""
    name: str = Field(..., min_length=1, max_length=50, description="标签名称")
    color: str = Field(default="#0D7377", pattern=r"^#[0-9A-Fa-f]{6}$", description="标签颜色（十六进制）")


class TagUpdateRequest(BaseModel):
    """更新标签请求"""
    name: Optional[str] = Field(default=None, min_length=1, max_length=50, description="标签名称")
    color: Optional[str] = Field(default=None, pattern=r"^#[0-9A-Fa-f]{6}$", description="标签颜色（十六进制）")


class TagResponse(BaseModel):
    """标签响应"""
    id: str
    name: str
    color: str
    created_at: str

    model_config = {"from_attributes": True}


class TagWithCountResponse(BaseModel):
    """标签（含笔记数量）响应"""
    id: str
    name: str
    color: str
    created_at: Optional[str]
    note_count: int = 0


# ==================== 标签接口 ====================


@router.post("/", response_model=TagResponse, summary="创建标签")
def create_tag(request: TagCreateRequest, db: Session = Depends(get_db)):
    """
    创建一个新标签
    """
    try:
        tag = crud.create_tag(db=db, name=request.name, color=request.color)
        return _tag_to_response(tag)
    except Exception as e:
        logger.error(f"创建标签接口异常: {e}")
        # 检查是否是唯一约束冲突（标签名重复）
        if "UNIQUE constraint" in str(e):
            raise HTTPException(status_code=409, detail="标签名称已存在")
        raise HTTPException(status_code=500, detail=f"创建标签失败: {str(e)}")


@router.get("/", response_model=list[TagWithCountResponse], summary="获取所有标签")
def get_tags(db: Session = Depends(get_db)):
    """
    获取所有标签，每个标签包含关联的笔记数量
    """
    try:
        tags = crud.get_tag_with_count(db)
        return tags
    except Exception as e:
        logger.error(f"获取标签列表接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"获取标签列表失败: {str(e)}")


@router.put("/{tag_id}", response_model=TagResponse, summary="更新标签")
def update_tag(
    tag_id: str, request: TagUpdateRequest, db: Session = Depends(get_db)
):
    """
    更新标签的名称或颜色
    """
    try:
        tag = crud.update_tag(
            db=db,
            tag_id=tag_id,
            name=request.name,
            color=request.color,
        )
        if tag is None:
            raise HTTPException(status_code=404, detail="标签不存在")
        return _tag_to_response(tag)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新标签接口异常: {e}")
        if "UNIQUE constraint" in str(e):
            raise HTTPException(status_code=409, detail="标签名称已存在")
        raise HTTPException(status_code=500, detail=f"更新标签失败: {str(e)}")


@router.delete("/{tag_id}", summary="删除标签")
def delete_tag(tag_id: str, db: Session = Depends(get_db)):
    """
    删除标签，同时移除所有笔记与该标签的关联
    """
    try:
        success = crud.delete_tag(db, tag_id)
        if not success:
            raise HTTPException(status_code=404, detail="标签不存在")
        return {"message": "删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除标签接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"删除标签失败: {str(e)}")


# ==================== 工具函数 ====================


def _tag_to_response(tag) -> TagResponse:
    """
    将 ORM 对象转换为响应 Schema

    Args:
        tag: Tag ORM 对象

    Returns:
        TagResponse 对象
    """
    return TagResponse(
        id=tag.id,
        name=tag.name,
        color=tag.color,
        created_at=tag.created_at.isoformat() if tag.created_at else "",
    )