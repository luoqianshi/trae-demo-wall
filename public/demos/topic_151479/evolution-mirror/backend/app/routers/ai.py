"""
AI 功能路由
提供笔记分析、智能标签生成、知识问答、笔记关联推荐等 AI 功能
"""

import logging
import re

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database import crud
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/ai", tags=["AI"])


class AnalyzeRequest(BaseModel):
    """分析请求"""
    note_id: str = Field(..., description="笔记 ID")


class GenerateTagsRequest(BaseModel):
    """生成标签请求"""
    note_id: str = Field(..., description="笔记 ID")


class QueryRequest(BaseModel):
    """知识问答请求"""
    question: str = Field(..., min_length=1, max_length=2000, description="用户问题")
    limit: int = Field(default=5, ge=1, le=20, description="搜索相关笔记数量")


@router.post("/query", summary="知识问答")
async def ai_query(req: QueryRequest, db: Session = Depends(get_db)):
    """
    基于用户所有笔记内容进行知识问答
    1. 搜索相关笔记
    2. 将笔记内容作为上下文发送给 AI
    3. AI 基于上下文回答问题
    """
    if not ai_service.is_configured:
        raise HTTPException(status_code=503, detail="AI 服务未配置，请先在设置中填入 API Key")

    if not req.question.strip():
        raise HTTPException(status_code=400, detail="问题不能为空")

    try:
        # 1. 搜索相关笔记 — 先用 FTS 全文搜索，回退到 LIKE
        has_cjk = any(ord(c) > 127 for c in req.question)
        notes = []
        if not has_cjk:
            fts_notes, _ = crud.search_notes_fulltext(
                db, keyword=req.question, limit=req.limit
            )
            notes = fts_notes
        if not notes:
            notes = crud.get_notes(
                db, keyword=req.question, limit=req.limit
            )

        # 2. 构建上下文
        context_parts = []
        for i, note in enumerate(notes):
            title = note.title or "无标题"
            content = (note.content or "")[:500]  # 截断减少 token
            context_parts.append(f"[笔记 {i+1}]\n标题：{title}\n内容：{content}")

        context = "\n\n".join(context_parts) if context_parts else "（未找到相关笔记）"

        # 3. 发送给 AI
        system_prompt = """你是一个知识助手，基于用户提供的笔记内容回答用户的问题。

规则：
1. 仅基于上面提供的笔记内容回答，不要编造信息
2. 如果笔记内容不足以回答问题，请如实说明
3. 回答时标注引用来源，如 [笔记1]、[笔记2]
4. 回答简洁有用，使用与问题相同的语言
5. 如果没有任何相关笔记，请告知用户"""

        user_prompt = f"以下是用户的笔记内容：\n\n{context}\n\n---\n\n用户问题：{req.question}"

        answer = await ai_service.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.5,
            max_tokens=2000,
        )

        related = []
        for note in notes[:req.limit]:
            related.append({
                "id": note.id,
                "title": note.title or "无标题",
                "preview": (note.content or "")[:120],
            })

        return {
            "answer": answer,
            "related_notes": related,
            "notes_count": len(notes),
        }

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"知识问答异常: {e}")
        raise HTTPException(status_code=500, detail=f"问答失败: {e}")


@router.get("/related/{note_id}", summary="笔记关联推荐")
async def get_related_notes(
    note_id: str,
    limit: int = Query(default=5, ge=1, le=20, description="推荐数量"),
    db: Session = Depends(get_db),
):
    """
    基于当前笔记内容，推荐内容相关的其他笔记
    使用关键词提取 + 搜索的方式，不依赖 AI 配置
    """
    try:
        note = crud.get_note(db, note_id)
        if note is None:
            raise HTTPException(status_code=404, detail="笔记不存在")

        # 提取关键词：取标题和内容中的有意义的词
        text = f"{note.title or ''} {note.content or ''}"
        if not text.strip():
            return {"notes": [], "count": 0}

        # 提取关键词：取中文/英文单词，去重，取前 10 个
        words = re.findall(r'[\w\u4e00-\u9fff]+', text.lower())
        # 过滤掉太短的词和常见停用词
        stop_words = {'的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上',
                      '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这',
                      '他', '她', '它', '们', '那', '什么', '怎么', '如何', '为什么', 'the', 'a', 'an', 'is',
                      'are', 'was', 'to', 'for', 'of', 'in', 'it', 'that', 'this', 'and', 'or', 'but'}
        keywords = [w for w in words if len(w) > 1 and w not in stop_words]
        keywords = list(set(keywords))[:10]

        if not keywords:
            return {"notes": [], "count": 0}

        # 用关键词搜索相关笔记（排除当前笔记）
        all_related = []
        seen_ids = {note_id}

        for kw in keywords:
            # 先尝试 FTS
            has_cjk = any(ord(c) > 127 for c in kw)
            candidates = []
            if not has_cjk:
                fts_results, _ = crud.search_notes_fulltext(db, keyword=kw, limit=5)
                candidates = fts_results
            if not candidates:
                candidates = crud.get_notes(db, keyword=kw, limit=5)

            for n in candidates:
                if n.id not in seen_ids and not n.is_trashed:
                    seen_ids.add(n.id)
                    all_related.append({
                        "id": n.id,
                        "title": n.title or "无标题",
                        "preview": (n.content or "")[:120],
                        "match_keyword": kw,
                    })

        # 按关键词匹配数量排序（降序）
        all_related.sort(key=lambda x: -sum(1 for kw in keywords if kw.lower() in (x.get('title', '') + x.get('preview', '')).lower()))

        result = all_related[:limit]

        return {
            "notes": result,
            "count": len(result),
            "keywords": keywords,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"关联推荐异常: {e}")
        raise HTTPException(status_code=500, detail=f"推荐失败: {e}")


@router.post("/analyze", summary="AI 分析笔记")
async def analyze_note(req: AnalyzeRequest, db: Session = Depends(get_db)):
    """使用 AI 分析笔记内容，提取待办、日程、主题"""
    note = crud.get_note(db, req.note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="笔记不存在")

    if not note.content and not note.title:
        raise HTTPException(status_code=400, detail="笔记内容为空，无法分析")

    try:
        result = await ai_service.analyze_note(
            title=note.title or "",
            content=note.content,
        )
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"AI 分析异常: {e}")
        raise HTTPException(status_code=500, detail=f"分析失败: {e}")


@router.post("/generate-tags", summary="AI 生成标签建议")
async def generate_tags(req: GenerateTagsRequest, db: Session = Depends(get_db)):
    """使用 AI 为笔记生成标签建议"""
    note = crud.get_note(db, req.note_id)
    if note is None:
        raise HTTPException(status_code=404, detail="笔记不存在")

    if not note.content and not note.title:
        raise HTTPException(status_code=400, detail="笔记内容为空")

    try:
        tags = await ai_service.generate_tags(
            title=note.title or "",
            content=note.content,
        )
        return {"tags": tags}
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"生成标签异常: {e}")
        raise HTTPException(status_code=500, detail=f"生成标签失败: {e}")


@router.get("/status", summary="AI 服务状态")
def ai_status():
    """检查 AI 服务是否已配置"""
    return {
        "configured": ai_service.is_configured,
        "provider": ai_service._provider if ai_service._enabled else None,
        "model": ai_service._model if ai_service._enabled else None,
    }