"""
弱点改进系统路由
提供弱点记录、改进计划、微行动、复盘等完整功能
"""

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.database import crud
from app.services.ai_service import ai_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/weakness", tags=["弱点改进"])


# ===== 请求模型 =====

class CreateWeaknessRequest(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="")
    category: str = Field(default="other")
    severity: int = Field(default=3, ge=1, le=5)
    frequency: str = Field(default="occasional")
    trigger_context: str = Field(default="")
    impact: str = Field(default="")
    tried_solutions: str = Field(default="")


class UpdateWeaknessRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    severity: Optional[int] = Field(default=None, ge=1, le=5)
    frequency: Optional[str] = None
    trigger_context: Optional[str] = None
    impact: Optional[str] = None
    tried_solutions: Optional[str] = None
    status: Optional[str] = None


class CreatePlanRequest(BaseModel):
    weakness_id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="")
    strategy: str = Field(default="")
    duration_days: int = Field(default=30, ge=1, le=365)


class UpdatePlanRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    strategy: Optional[str] = None
    duration_days: Optional[int] = None
    status: Optional[str] = None
    start_date: Optional[str] = None


class CreateActionRequest(BaseModel):
    plan_id: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="")
    frequency: str = Field(default="daily")
    scheduled_time: Optional[str] = None
    estimated_minutes: int = Field(default=5, ge=1, le=120)


class UpdateActionRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    frequency: Optional[str] = None
    scheduled_time: Optional[str] = None
    estimated_minutes: Optional[int] = None
    is_active: Optional[bool] = None


class LogActionRequest(BaseModel):
    completed: bool = Field(default=False)
    notes: str = Field(default="")
    mood: Optional[int] = Field(default=None, ge=1, le=5)
    difficulty: Optional[int] = Field(default=None, ge=1, le=5)


class CreateReviewRequest(BaseModel):
    weakness_id: str = Field(..., min_length=1)
    review_type: str = Field(default="weekly")
    content: str = Field(default="")
    progress_score: int = Field(default=0, ge=0, le=100)
    insights: str = Field(default="")


class AiAnalyzeWeaknessRequest(BaseModel):
    weakness_id: str = Field(..., min_length=1)


# ===== 响应辅助函数 =====

def _weakness_to_dict(w):
    return {
        "id": w.id,
        "title": w.title,
        "description": w.description,
        "category": w.category,
        "severity": w.severity,
        "frequency": w.frequency,
        "trigger_context": w.trigger_context,
        "impact": w.impact,
        "tried_solutions": w.tried_solutions,
        "status": w.status,
        "created_at": w.created_at.isoformat() if w.created_at else None,
        "updated_at": w.updated_at.isoformat() if w.updated_at else None,
    }


def _plan_to_dict(p):
    return {
        "id": p.id,
        "weakness_id": p.weakness_id,
        "title": p.title,
        "description": p.description,
        "strategy": p.strategy,
        "duration_days": p.duration_days,
        "start_date": p.start_date.isoformat() if p.start_date else None,
        "status": p.status,
        "created_at": p.created_at.isoformat() if p.created_at else None,
    }


def _action_to_dict(a):
    return {
        "id": a.id,
        "plan_id": a.plan_id,
        "title": a.title,
        "description": a.description,
        "frequency": a.frequency,
        "scheduled_time": a.scheduled_time,
        "estimated_minutes": a.estimated_minutes,
        "sort_order": a.sort_order,
        "is_active": a.is_active,
        "created_at": a.created_at.isoformat() if a.created_at else None,
    }


def _review_to_dict(r):
    return {
        "id": r.id,
        "weakness_id": r.weakness_id,
        "review_type": r.review_type,
        "content": r.content,
        "progress_score": r.progress_score,
        "insights": r.insights,
        "created_at": r.created_at.isoformat() if r.created_at else None,
    }


# ===== Weakness 路由 =====

@router.post("", summary="创建弱点记录")
def create_weakness(req: CreateWeaknessRequest, db: Session = Depends(get_db)):
    try:
        w = crud.create_weakness(
            db,
            title=req.title,
            description=req.description,
            category=req.category,
            severity=req.severity,
            frequency=req.frequency,
            trigger_context=req.trigger_context,
            impact=req.impact,
            tried_solutions=req.tried_solutions,
        )
        return _weakness_to_dict(w)
    except Exception as e:
        logger.error(f"创建弱点失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("", summary="获取弱点列表")
def get_weaknesses(
    status: Optional[str] = Query(default=None),
    category: Optional[str] = Query(default=None),
    keyword: Optional[str] = Query(default=None),
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    items = crud.get_weaknesses(db, status=status, category=category, keyword=keyword, limit=limit, offset=offset)
    return [_weakness_to_dict(w) for w in items]


@router.get("/{weakness_id}", summary="获取单个弱点")
def get_weakness(weakness_id: str, db: Session = Depends(get_db)):
    w = crud.get_weakness(db, weakness_id)
    if not w:
        raise HTTPException(status_code=404, detail="弱点不存在")
    data = _weakness_to_dict(w)
    data["plans"] = [_plan_to_dict(p) for p in w.plans]
    data["reviews"] = [_review_to_dict(r) for r in w.reviews]
    return data


@router.put("/{weakness_id}", summary="更新弱点")
def update_weakness(weakness_id: str, req: UpdateWeaknessRequest, db: Session = Depends(get_db)):
    w = crud.update_weakness(db, weakness_id, **req.model_dump(exclude_unset=True))
    if not w:
        raise HTTPException(status_code=404, detail="弱点不存在")
    return _weakness_to_dict(w)


@router.delete("/{weakness_id}", summary="删除弱点")
def delete_weakness(weakness_id: str, db: Session = Depends(get_db)):
    if not crud.delete_weakness(db, weakness_id):
        raise HTTPException(status_code=404, detail="弱点不存在")
    return {"message": "已删除"}


# ===== Plan 路由 =====

@router.post("/plans", summary="创建改进计划")
def create_plan(req: CreatePlanRequest, db: Session = Depends(get_db)):
    # 检查弱点是否存在
    if not crud.get_weakness(db, req.weakness_id):
        raise HTTPException(status_code=404, detail="弱点不存在")
    try:
        p = crud.create_plan(
            db,
            weakness_id=req.weakness_id,
            title=req.title,
            description=req.description,
            strategy=req.strategy,
            duration_days=req.duration_days,
        )
        return _plan_to_dict(p)
    except Exception as e:
        logger.error(f"创建计划失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/plans/all", summary="获取所有改进计划")
def get_all_plans(status: Optional[str] = Query(default=None), db: Session = Depends(get_db)):
    items = crud.get_all_plans(db, status=status)
    return [_plan_to_dict(p) for p in items]


@router.get("/{weakness_id}/plans", summary="获取弱点的改进计划")
def get_plans_by_weakness(weakness_id: str, db: Session = Depends(get_db)):
    if not crud.get_weakness(db, weakness_id):
        raise HTTPException(status_code=404, detail="弱点不存在")
    items = crud.get_plans_by_weakness(db, weakness_id)
    return [_plan_to_dict(p) for p in items]


@router.put("/plans/{plan_id}", summary="更新改进计划")
def update_plan(plan_id: str, req: UpdatePlanRequest, db: Session = Depends(get_db)):
    p = crud.update_plan(db, plan_id, **req.model_dump(exclude_unset=True))
    if not p:
        raise HTTPException(status_code=404, detail="计划不存在")
    return _plan_to_dict(p)


@router.delete("/plans/{plan_id}", summary="删除改进计划")
def delete_plan(plan_id: str, db: Session = Depends(get_db)):
    if not crud.delete_plan(db, plan_id):
        raise HTTPException(status_code=404, detail="计划不存在")
    return {"message": "已删除"}


# ===== Action 路由 =====

@router.post("/actions", summary="创建微行动")
def create_action(req: CreateActionRequest, db: Session = Depends(get_db)):
    if not crud.get_plan(db, req.plan_id):
        raise HTTPException(status_code=404, detail="计划不存在")
    try:
        a = crud.create_action(
            db,
            plan_id=req.plan_id,
            title=req.title,
            description=req.description,
            frequency=req.frequency,
            scheduled_time=req.scheduled_time,
            estimated_minutes=req.estimated_minutes,
        )
        return _action_to_dict(a)
    except Exception as e:
        logger.error(f"创建微行动失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/plans/{plan_id}/actions", summary="获取计划的微行动")
def get_actions_by_plan(plan_id: str, db: Session = Depends(get_db)):
    if not crud.get_plan(db, plan_id):
        raise HTTPException(status_code=404, detail="计划不存在")
    items = crud.get_actions_by_plan(db, plan_id)
    return [_action_to_dict(a) for a in items]


@router.get("/actions/active", summary="获取所有活跃微行动")
def get_active_actions(db: Session = Depends(get_db)):
    items = crud.get_active_actions(db)
    return [_action_to_dict(a) for a in items]


@router.put("/actions/{action_id}", summary="更新微行动")
def update_action(action_id: str, req: UpdateActionRequest, db: Session = Depends(get_db)):
    a = crud.update_action(db, action_id, **req.model_dump(exclude_unset=True))
    if not a:
        raise HTTPException(status_code=404, detail="微行动不存在")
    return _action_to_dict(a)


@router.delete("/actions/{action_id}", summary="删除微行动")
def delete_action(action_id: str, db: Session = Depends(get_db)):
    if not crud.delete_action(db, action_id):
        raise HTTPException(status_code=404, detail="微行动不存在")
    return {"message": "已删除"}


# ===== Action Log 路由 =====

@router.post("/actions/{action_id}/log", summary="记录行动执行情况")
def log_action(action_id: str, req: LogActionRequest, db: Session = Depends(get_db)):
    if not crud.get_action(db, action_id):
        raise HTTPException(status_code=404, detail="微行动不存在")
    try:
        log = crud.create_action_log(
            db,
            action_id=action_id,
            completed=req.completed,
            notes=req.notes,
            mood=req.mood,
            difficulty=req.difficulty,
        )
        return {
            "id": log.id,
            "action_id": log.action_id,
            "completed": log.completed,
            "notes": log.notes,
            "mood": log.mood,
            "difficulty": log.difficulty,
            "log_date": log.log_date.isoformat() if log.log_date else None,
        }
    except Exception as e:
        logger.error(f"记录行动失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/actions/{action_id}/logs", summary="获取行动历史记录")
def get_action_logs(action_id: str, limit: int = Query(default=30, ge=1, le=100), db: Session = Depends(get_db)):
    if not crud.get_action(db, action_id):
        raise HTTPException(status_code=404, detail="微行动不存在")
    logs = crud.get_logs_by_action(db, action_id, limit=limit)
    return [
        {
            "id": l.id,
            "completed": l.completed,
            "notes": l.notes,
            "mood": l.mood,
            "difficulty": l.difficulty,
            "log_date": l.log_date.isoformat() if l.log_date else None,
        }
        for l in logs
    ]


@router.get("/actions/{action_id}/stats", summary="获取行动完成统计")
def get_action_stats(action_id: str, db: Session = Depends(get_db)):
    if not crud.get_action(db, action_id):
        raise HTTPException(status_code=404, detail="微行动不存在")
    return crud.get_action_stats(db, action_id)


# ===== Review 路由 =====

@router.post("/reviews", summary="创建复盘记录")
def create_review(req: CreateReviewRequest, db: Session = Depends(get_db)):
    if not crud.get_weakness(db, req.weakness_id):
        raise HTTPException(status_code=404, detail="弱点不存在")
    try:
        r = crud.create_review(
            db,
            weakness_id=req.weakness_id,
            review_type=req.review_type,
            content=req.content,
            progress_score=req.progress_score,
            insights=req.insights,
        )
        return _review_to_dict(r)
    except Exception as e:
        logger.error(f"创建复盘失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{weakness_id}/reviews", summary="获取弱点的复盘记录")
def get_reviews(weakness_id: str, review_type: Optional[str] = Query(default=None), db: Session = Depends(get_db)):
    if not crud.get_weakness(db, weakness_id):
        raise HTTPException(status_code=404, detail="弱点不存在")
    items = crud.get_reviews_by_weakness(db, weakness_id, review_type=review_type)
    return [_review_to_dict(r) for r in items]


@router.delete("/reviews/{review_id}", summary="删除复盘记录")
def delete_review(review_id: str, db: Session = Depends(get_db)):
    if not crud.delete_review(db, review_id):
        raise HTTPException(status_code=404, detail="复盘记录不存在")
    return {"message": "已删除"}


# ===== AI 分析路由 =====

@router.post("/ai/analyze", summary="AI 深度分析弱点")
async def ai_analyze_weakness(req: AiAnalyzeWeaknessRequest, db: Session = Depends(get_db)):
    """
    AI 基于弱点信息和用户的所有笔记内容，进行深度分析：
    - 找出弱点背后的根因模式
    - 关联笔记中相关的场景和事件
    - 生成改进策略和微行动建议
    """
    if not ai_service.is_configured:
        raise HTTPException(status_code=503, detail="AI 服务未配置")

    w = crud.get_weakness(db, req.weakness_id)
    if not w:
        raise HTTPException(status_code=404, detail="弱点不存在")

    try:
        # 搜索相关笔记
        keyword = w.title + " " + w.description[:100]
        notes = crud.get_notes(db, keyword=keyword, limit=10)

        context_parts = []
        for i, note in enumerate(notes):
            context_parts.append(
                f"[笔记 {i+1}] {note.title or '无标题'}:\n{note.content[:400]}"
            )
        notes_context = "\n\n".join(context_parts) if context_parts else "（暂无相关笔记）"

        system_prompt = """你是一位专业的心理学和行为改进顾问。
请基于用户提供的弱点描述和相关笔记内容，进行深入分析。

你需要输出以下内容（使用 Markdown 格式）：

## 1. 根因分析
分析这个弱点背后可能的深层原因（如思维模式、情绪模式、习惯模式等）。

## 2. 触发模式识别
识别在什么场景、什么情绪状态下最容易触发这个弱点。

## 3. 关联影响
这个弱点对用户的生活/工作/人际关系产生了哪些连锁影响。

## 4. 改进策略建议
提供 3-5 个具体可行的改进策略，遵循"无痛原则"（行动小到几乎不需要意志力）。

## 5. 微行动清单
将改进策略拆解为每日可执行的微小行动（每个不超过 10 分钟）。

请用温和、鼓励的语气，避免批评和指责。"""

        user_prompt = f"""弱点信息：
- 标题：{w.title}
- 描述：{w.description}
- 类别：{w.category}
- 严重程度（1-5）：{w.severity}
- 发生频率：{w.frequency}
- 触发场景：{w.trigger_context}
- 影响：{w.impact}
- 已尝试的解决方法：{w.tried_solutions}

相关笔记内容：
{notes_context}"""

        analysis = await ai_service.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.6,
            max_tokens=3000,
        )

        return {
            "weakness_id": w.id,
            "analysis": analysis,
            "related_notes_count": len(notes),
        }

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"AI 分析弱点异常: {e}")
        raise HTTPException(status_code=500, detail=f"分析失败: {e}")


@router.post("/ai/generate-plan", summary="AI 生成改进计划")
async def ai_generate_plan(req: AiAnalyzeWeaknessRequest, db: Session = Depends(get_db)):
    """
    AI 基于弱点分析，自动生成改进计划和微行动
    """
    if not ai_service.is_configured:
        raise HTTPException(status_code=503, detail="AI 服务未配置")

    w = crud.get_weakness(db, req.weakness_id)
    if not w:
        raise HTTPException(status_code=404, detail="弱点不存在")

    try:
        system_prompt = """你是一位行为改进教练。请基于用户描述的弱点，生成一个完整的改进计划。

请输出 JSON 格式：
{
  "title": "计划标题",
  "description": "计划描述",
  "strategy": "整体改进策略",
  "duration_days": 30,
  "actions": [
    {
      "title": "微行动标题",
      "description": "微行动描述",
      "frequency": "daily",
      "scheduled_time": "09:00",
      "estimated_minutes": 5
    }
  ]
}

要求：
- 微行动要极小，不超过 10 分钟
- 遵循"无痛原则"，降低意志力消耗
- 频率建议 daily 为主
- 策略要具体可执行"""

        user_prompt = f"""弱点：{w.title}
描述：{w.description}
触发场景：{w.trigger_context}
影响：{w.impact}
已尝试的方法：{w.tried_solutions}"""

        import json
        response = await ai_service.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.5,
            max_tokens=3000,
        )

        # 尝试解析 JSON
        try:
            plan_data = json.loads(response)
        except json.JSONDecodeError:
            # 如果 AI 返回的不是纯 JSON，尝试提取 JSON 部分
            import re
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                plan_data = json.loads(json_match.group())
            else:
                raise ValueError("AI 返回格式错误")

        # 创建计划
        plan = crud.create_plan(
            db,
            weakness_id=w.id,
            title=plan_data.get("title", f"{w.title} 改进计划"),
            description=plan_data.get("description", ""),
            strategy=plan_data.get("strategy", ""),
            duration_days=plan_data.get("duration_days", 30),
        )

        # 创建微行动
        actions = plan_data.get("actions", [])
        for i, action_data in enumerate(actions):
            crud.create_action(
                db,
                plan_id=plan.id,
                title=action_data.get("title", f"行动 {i+1}"),
                description=action_data.get("description", ""),
                frequency=action_data.get("frequency", "daily"),
                scheduled_time=action_data.get("scheduled_time"),
                estimated_minutes=action_data.get("estimated_minutes", 5),
                sort_order=i,
            )

        return {
            "plan": _plan_to_dict(plan),
            "actions_count": len(actions),
            "message": "改进计划已生成",
        }

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"AI 生成计划异常: {e}")
        raise HTTPException(status_code=500, detail=f"生成计划失败: {e}")


# ===== 仪表盘统计 =====

@router.get("/dashboard/stats", summary="获取改进仪表盘统计")
def get_dashboard_stats(db: Session = Depends(get_db)):
    """获取弱点改进系统的整体统计数据"""
    try:
        all_weaknesses = crud.get_weaknesses(db)
        active_weaknesses = [w for w in all_weaknesses if w.status in ("active", "improving")]
        resolved = [w for w in all_weaknesses if w.status == "resolved"]

        all_plans = crud.get_all_plans(db)
        active_plans = [p for p in all_plans if p.status == "active"]

        actions = crud.get_active_actions(db)
        action_ids = [a.id for a in actions]

        # 计算今日完成率
        from datetime import date
        today = date.today()
        today_logs = crud.get_today_logs(db)
        today_completed = sum(1 for l in today_logs if l.completed)

        return {
            "weaknesses": {
                "total": len(all_weaknesses),
                "active": len(active_weaknesses),
                "resolved": len(resolved),
            },
            "plans": {
                "total": len(all_plans),
                "active": len(active_plans),
            },
            "actions": {
                "total": len(actions),
                "today_completed": today_completed,
                "today_total": len(today_logs),
            },
        }
    except Exception as e:
        logger.error(f"获取仪表盘统计失败: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ai/personal-report", summary="AI 个人综合分析报告")
async def ai_personal_report(db: Session = Depends(get_db)):
    """
    AI 基于用户的所有笔记、聊天记录、通话记录、弱点记录，
    生成个人综合分析报告：缺点分析 + 改进建议 + 待办清单
    """
    if not ai_service.is_configured:
        raise HTTPException(status_code=503, detail="AI 服务未配置")

    try:
        # 收集所有信息
        notes = crud.get_notes(db, limit=15)
        weaknesses = crud.get_weaknesses(db)
        plans = crud.get_all_plans(db)

        # 构建用户画像上下文
        notes_context = []
        for i, note in enumerate(notes[:8]):
            notes_context.append(
                f"[{note.note_type or 'note'}] {note.title or '无标题'}:\n{note.content[:150]}"
            )
        notes_text = "\n\n".join(notes_context) if notes_context else "（暂无笔记）"

        weaknesses_context = []
        for w in weaknesses[:10]:
            weaknesses_context.append(
                f"- {w.title}（{w.category}，严重程度{w.severity}）: {w.description[:100]}"
            )
        weaknesses_text = "\n".join(weaknesses_context) if weaknesses_context else "（暂无弱点记录）"

        system_prompt = """你是一位专业的心理学和行为改进顾问。请基于用户提供的所有信息，生成一份个人综合分析报告。

报告格式（使用 Markdown）：

## 一、整体印象
简要总结用户的整体情况。

## 二、发现的缺点/弱点
列出你发现的缺点，按优先级排序。每个缺点包含：
- 缺点描述
- 具体表现（基于笔记中的实例）
- 可能的影响

## 三、根因分析
分析这些缺点背后可能的共同根因。

## 四、改进建议
针对每个缺点提供具体可执行的改进建议，遵循"无痛原则"。

## 五、待办清单
生成一个优先级排序的待办清单，帮助用户开始改进。

语气要求：温和、鼓励、建设性，避免批评和指责。"""

        user_prompt = f"""用户的笔记记录：
{notes_text}

用户记录的弱点：
{weaknesses_text}

请生成个人综合分析报告。"""

        report = await ai_service.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.6,
            max_tokens=2000,
        )

        return {
            "report": report,
            "data_summary": {
                "notes_analyzed": len(notes),
                "weaknesses_recorded": len(weaknesses),
                "plans_active": len([p for p in plans if p.status == "active"]),
            },
        }

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"个人分析报告异常: {e}")
        raise HTTPException(status_code=500, detail=f"生成报告失败: {e}")


@router.post("/ai/extract-promises", summary="AI 提取承诺事项")
async def ai_extract_promises(db: Session = Depends(get_db)):
    """
    从聊天记录和通话记录中提取用户对别人的承诺事项，
    生成承诺提醒清单，防止遗忘。
    """
    if not ai_service.is_configured:
        raise HTTPException(status_code=503, detail="AI 服务未配置")

    try:
        # 获取聊天记录和通话记录
        chat_notes = crud.get_notes(db, note_type="chat_history", limit=10)
        call_notes = crud.get_notes(db, note_type="call_log", limit=10)
        all_comm = chat_notes + call_notes

        if not all_comm:
            return {"promises": [], "message": "暂无聊天记录或通话记录"}

        # 构建上下文
        comm_context = []
        for i, note in enumerate(all_comm[:10]):
            comm_context.append(
                f"[记录 {i+1}] {note.title or '无标题'}:\n{note.content[:200]}"
            )
        comm_text = "\n\n".join(comm_context)

        system_prompt = """你是一位细心的助理，负责从用户的聊天记录和通话记录中提取承诺事项。

请仔细阅读记录，提取用户对他人做出的承诺（如"我明天发给你"、"周末请你吃饭"、"下周给你答复"等）。

输出 JSON 数组格式：
[
  {
    "content": "承诺内容",
    "to_whom": "承诺对象",
    "deadline": "截止时间（如'明天'、'本周五'、'下周'）",
    "source_note_title": "来源记录标题",
    "priority": "high/medium/low"
  }
]

如果没有发现承诺，返回空数组 []。
只提取明确的承诺，不要推测。"""

        user_prompt = f"以下是从用户的聊天记录和通话记录中提取的内容：\n\n{comm_text}\n\n请提取所有承诺事项。"

        import json
        import re

        response = await ai_service.chat(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.3,
            max_tokens=3000,
        )

        # 解析 JSON
        try:
            promises = json.loads(response)
        except json.JSONDecodeError:
            json_match = re.search(r'\[.*\]', response, re.DOTALL)
            if json_match:
                promises = json.loads(json_match.group())
            else:
                promises = []

        # 验证格式
        if not isinstance(promises, list):
            promises = []

        return {
            "promises": promises,
            "records_analyzed": len(all_comm),
        }

    except HTTPException:
        raise
    except RuntimeError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        logger.error(f"提取承诺异常: {e}")
        raise HTTPException(status_code=500, detail=f"提取失败: {e}")
