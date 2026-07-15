"""
笔记路由模块
提供笔记的增删改查、标签管理、回收站、统计等接口
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database import crud
from app.database.models import NoteTag

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/notes", tags=["笔记"])


# ==================== Pydantic 请求/响应 Schema ====================


class NoteCreateRequest(BaseModel):
    """创建笔记请求"""
    title: str = Field(default="", description="笔记标题")
    content: str = Field(default="", description="笔记内容")
    folder_id: Optional[str] = Field(default=None, description="所属文件夹 ID")
    note_type: str = Field(default="note", description="笔记类型: note/voice_memo/inspiration/schedule")


class NoteUpdateRequest(BaseModel):
    """更新笔记请求"""
    title: Optional[str] = Field(default=None, description="笔记标题")
    content: Optional[str] = Field(default=None, description="笔记内容")
    folder_id: Optional[str] = Field(default=None, description="所属文件夹 ID")
    is_pinned: Optional[bool] = Field(default=None, description="是否置顶")
    is_trashed: Optional[bool] = Field(default=None, description="是否在回收站")


class NoteResponse(BaseModel):
    """笔记响应"""
    id: str
    title: str
    content: str
    folder_id: Optional[str]
    is_pinned: bool
    is_trashed: bool
    note_type: str
    created_at: str
    updated_at: str

    model_config = {"from_attributes": True}


class NoteTagRequest(BaseModel):
    """给笔记添加标签请求"""
    tag_id: str = Field(..., description="标签 ID")


class NoteStatsResponse(BaseModel):
    """笔记统计响应"""
    total: int = 0
    by_type: dict = Field(default_factory=dict)


# ==================== 笔记接口 ====================


@router.post("/", response_model=NoteResponse, summary="创建笔记")
def create_note(request: NoteCreateRequest, db: Session = Depends(get_db)):
    """
    创建一条新笔记
    """
    try:
        note = crud.create_note(
            db=db,
            title=request.title,
            content=request.content,
            folder_id=request.folder_id,
            note_type=request.note_type,
        )
        return _note_to_response(note)
    except Exception as e:
        logger.error(f"创建笔记接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"创建笔记失败: {str(e)}")


@router.get("/", summary="获取笔记列表")
def get_notes(
    folder_id: Optional[str] = Query(default=None, description="按文件夹过滤"),
    tag_id: Optional[str] = Query(default=None, description="按标签过滤"),
    is_trashed: Optional[bool] = Query(default=None, description="按回收站状态过滤"),
    keyword: Optional[str] = Query(default=None, description="关键词搜索"),
    search_mode: str = Query(default="like", description="搜索模式: like(模糊匹配) 或 fts(全文搜索)"),
    offset: int = Query(default=0, ge=0, description="分页偏移量"),
    limit: int = Query(default=50, ge=1, le=200, description="每页数量"),
    db: Session = Depends(get_db),
):
    """
    获取笔记列表，支持分页、搜索、多条件过滤
    search_mode=fts 时使用 SQLite FTS5 全文搜索（对英文更准确）
    中文关键词会自动 fallback 到 LIKE 模糊匹配
    """
    try:
        # 判断关键词是否包含非 ASCII 字符（如中文）
        has_cjk = False
        if keyword:
            for ch in keyword:
                if ord(ch) > 127:
                    has_cjk = True
                    break

        # 当启用 FTS 全文搜索、有关键词、且不含中文时
        if search_mode == "fts" and keyword and not has_cjk:
            notes, total = crud.search_notes_fulltext(
                db=db,
                keyword=keyword,
                folder_id=folder_id,
                tag_id=tag_id,
                is_trashed=is_trashed if is_trashed is not None else False,
                limit=limit,
                offset=offset,
            )
            return {"items": [_note_to_response(n) for n in notes], "total": total}

        # 默认使用 LIKE 模糊匹配（支持中文）
        notes = crud.get_notes(
            db=db,
            folder_id=folder_id,
            tag_id=tag_id,
            is_trashed=is_trashed,
            keyword=keyword,
            offset=offset,
            limit=limit,
        )
        return {"items": [_note_to_response(n) for n in notes], "total": len(notes)}
    except Exception as e:
        logger.error(f"获取笔记列表接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"获取笔记列表失败: {str(e)}")


@router.get("/stats/overview", response_model=NoteStatsResponse, summary="获取笔记统计")
def get_note_stats(db: Session = Depends(get_db)):
    """
    获取笔记按类型分组的统计信息
    """
    try:
        by_type = crud.get_note_count_by_type(db)
        total = sum(by_type.values())
        return NoteStatsResponse(total=total, by_type=by_type)
    except Exception as e:
        logger.error(f"获取笔记统计接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"获取统计失败: {str(e)}")


@router.get("/graph/data", summary="获取知识图谱数据")
def get_graph(db: Session = Depends(get_db)):
    """
    获取所有笔记节点和双链关系边，用于知识图谱可视化
    """
    try:
        data = crud.get_graph_data(db)
        return data
    except Exception as e:
        logger.error(f"获取图谱数据接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"获取图谱数据失败: {str(e)}")


@router.get("/{note_id}", response_model=NoteResponse, summary="获取单个笔记")
def get_note(note_id: str, db: Session = Depends(get_db)):
    """
    根据 ID 获取单个笔记详情
    """
    try:
        note = crud.get_note(db, note_id)
        if note is None:
            raise HTTPException(status_code=404, detail="笔记不存在")
        return _note_to_response(note)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取笔记接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"获取笔记失败: {str(e)}")


@router.put("/{note_id}", response_model=NoteResponse, summary="更新笔记")
def update_note(
    note_id: str, request: NoteUpdateRequest, db: Session = Depends(get_db)
):
    """
    更新笔记的标题、内容、文件夹、置顶状态或回收站状态
    """
    try:
        note = crud.update_note(
            db=db,
            note_id=note_id,
            title=request.title,
            content=request.content,
            folder_id=request.folder_id,
            is_pinned=request.is_pinned,
            is_trashed=request.is_trashed,
        )
        if note is None:
            raise HTTPException(status_code=404, detail="笔记不存在")
        return _note_to_response(note)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"更新笔记接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"更新笔记失败: {str(e)}")


@router.delete("/{note_id}", summary="删除笔记")
def delete_note(note_id: str, db: Session = Depends(get_db)):
    """
    硬删除笔记（同时移除关联标签）
    """
    try:
        success = crud.delete_note(db, note_id)
        if not success:
            raise HTTPException(status_code=404, detail="笔记不存在")
        return {"message": "删除成功"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"删除笔记接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"删除笔记失败: {str(e)}")


@router.post("/{note_id}/tags", summary="给笔记添加标签")
def add_tag_to_note(
    note_id: str, request: NoteTagRequest, db: Session = Depends(get_db)
):
    """
    为指定笔记添加一个标签
    """
    try:
        # 检查笔记是否存在
        note = crud.get_note(db, note_id)
        if note is None:
            raise HTTPException(status_code=404, detail="笔记不存在")

        # 检查是否已存在该关联
        existing = (
            db.query(NoteTag)
            .filter(NoteTag.note_id == note_id, NoteTag.tag_id == request.tag_id)
            .first()
        )
        if existing:
            return {"message": "该标签已关联到此笔记"}

        # 创建关联
        note_tag = NoteTag(note_id=note_id, tag_id=request.tag_id)
        db.add(note_tag)
        db.commit()

        return {"message": "标签添加成功"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"添加标签接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"添加标签失败: {str(e)}")


@router.delete("/{note_id}/tags/{tag_id}", summary="移除笔记的标签")
def remove_tag_from_note(
    note_id: str, tag_id: str, db: Session = Depends(get_db)
):
    """
    移除指定笔记上的某个标签
    """
    try:
        relation = (
            db.query(NoteTag)
            .filter(NoteTag.note_id == note_id, NoteTag.tag_id == tag_id)
            .first()
        )
        if relation is None:
            raise HTTPException(status_code=404, detail="该标签关联不存在")

        db.delete(relation)
        db.commit()
        return {"message": "标签移除成功"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"移除标签接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"移除标签失败: {str(e)}")


@router.post("/empty-trash", summary="清空回收站")
def empty_trash(db: Session = Depends(get_db)):
    """
    清空回收站，硬删除所有标记为回收站的笔记
    """
    try:
        count = crud.empty_trash(db)
        return {"message": f"已清空回收站，删除了 {count} 条笔记", "deleted_count": count}
    except Exception as e:
        logger.error(f"清空回收站接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"清空回收站失败: {str(e)}")


@router.get("/{note_id}/backlinks", summary="获取笔记的反向链接")
def get_note_backlinks(note_id: str, db: Session = Depends(get_db)):
    """
    获取指向指定笔记的所有反向链接
    """
    try:
        # 先检查笔记是否存在
        note = crud.get_note(db, note_id)
        if note is None:
            raise HTTPException(status_code=404, detail="笔记不存在")

        backlinks = crud.get_backlinks(db, note_id)
        return {"items": backlinks, "total": len(backlinks)}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"获取反向链接接口异常: {e}")
        raise HTTPException(status_code=500, detail=f"获取反向链接失败: {str(e)}")


# ==================== 工具函数 ====================


def _note_to_response(note) -> NoteResponse:
    """
    将 ORM 对象转换为响应 Schema

    Args:
        note: Note ORM 对象

    Returns:
        NoteResponse 对象
    """
    return NoteResponse(
        id=note.id,
        title=note.title,
        content=note.content,
        folder_id=note.folder_id,
        is_pinned=note.is_pinned,
        is_trashed=note.is_trashed,
        note_type=note.note_type,
        created_at=note.created_at.isoformat() if note.created_at else "",
        updated_at=note.updated_at.isoformat() if note.updated_at else "",
    )