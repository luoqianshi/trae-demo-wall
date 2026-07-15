"""
文件夹路由模块
提供文件夹的增删改查接口
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database import crud

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/folders", tags=["文件夹"])


# ==================== Pydantic 请求/响应 Schema ====================


class FolderCreateRequest(BaseModel):
    """创建文件夹请求"""
    name: str = Field(..., min_length=1, max_length=100, description="文件夹名称")
    parent_id: Optional[str] = Field(default=None, description="父文件夹 ID")


class FolderUpdateRequest(BaseModel):
    """更新文件夹请求"""
    name: str = Field(..., min_length=1, max_length=100, description="文件夹名称")


class FolderResponse(BaseModel):
    """文件夹响应"""
    id: str
    name: str
    parent_id: Optional[str]
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


# ==================== 文件夹接口 ====================


@router.post("/", response_model=FolderResponse, summary="创建文件夹")
def create_folder(request: FolderCreateRequest, db: Session = Depends(get_db)):
    """
    创建一个新文件夹，可指定父文件夹
    """
    try:
        folder = crud.create_folder(
            db=db,
            name=request.name,
            parent_id=request.parent_id,
        )
        return _folder_to_response(folder)
    except Exception as e:
        logger.error(f"创建文件夹接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"创建文件夹失败: {str(e)}")


@router.get("/", response_model=list[FolderResponse], summary="获取文件夹列表")
def get_folders(
    parent_id: Optional[str] = Query(default=None, description="按父文件夹过滤"),
    db: Session = Depends(get_db),
):
    """
    获取文件夹列表，可按父文件夹过滤
    """
    try:
        folders = crud.get_folders(db=db, parent_id=parent_id)
        return [_folder_to_response(f) for f in folders]
    except Exception as e:
        logger.error(f"获取文件夹列表接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"获取文件夹列表失败: {str(e)}")


@router.put("/{folder_id}", response_model=FolderResponse, summary="更新文件夹")
def update_folder(
    folder_id: str, request: FolderUpdateRequest, db: Session = Depends(get_db)
):
    """
    更新文件夹名称
    """
    try:
        folder = crud.update_folder(db=db, folder_id=folder_id, name=request.name)
        if folder is None:
            raise HTTPException(status_code=404, detail="文件夹不存在")
        return _folder_to_response(folder)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新文件夹接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"更新文件夹失败: {str(e)}")


@router.delete("/{folder_id}", summary="删除文件夹")
def delete_folder(folder_id: str, db: Session = Depends(get_db)):
    """
    删除文件夹，其下的笔记会移到根目录，子文件夹会变为顶级文件夹
    """
    try:
        success = crud.delete_folder(db, folder_id)
        if not success:
            raise HTTPException(status_code=404, detail="文件夹不存在")
        return {"message": "删除成功，其下笔记已移到根目录"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除文件夹接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"删除文件夹失败: {str(e)}")


# ==================== 工具函数 ====================


def _folder_to_response(folder) -> FolderResponse:
    """
    将 ORM 对象转换为响应 Schema

    Args:
        folder: Folder ORM 对象

    Returns:
        FolderResponse 对象
    """
    return FolderResponse(
        id=folder.id,
        name=folder.name,
        parent_id=folder.parent_id,
        created_at=folder.created_at.isoformat() if folder.created_at else "",
        updated_at=folder.updated_at.isoformat() if folder.updated_at else "",
    )