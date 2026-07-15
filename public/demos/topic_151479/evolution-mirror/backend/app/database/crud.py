"""
数据库 CRUD 操作模块
提供 Note、Folder、Tag 的增删改查操作
"""

import logging
import re
from typing import Optional

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.database.models import Note, Folder, Tag, NoteTag, NoteLink

logger = logging.getLogger(__name__)


# ==================== 双链工具函数 ====================


WIKI_LINK_PATTERN = re.compile(r'\[\[(.*?)\]\]')


def extract_wiki_links(content: str) -> list[str]:
    """
    从 Markdown 内容中提取 [[标题]] 格式的双链

    Args:
        content: 笔记内容

    Returns:
        链接文本列表（去重、去空白）
    """
    if not content:
        return []
    matches = WIKI_LINK_PATTERN.findall(content)
    seen = set()
    result = []
    for m in matches:
        text = m.strip()
        if text and text not in seen:
            seen.add(text)
            result.append(text)
    return result


def update_note_links(db: Session, note_id: str, content: str) -> None:
    """
    更新笔记的出站链接
    解析内容中的 [[标题]]，查找匹配的笔记，建立链接关系

    Args:
        db: 数据库会话
        note_id: 源笔记 ID
        content: 笔记内容
    """
    try:
        # 删除该笔记的所有旧出站链接
        db.query(NoteLink).filter(NoteLink.source_note_id == note_id).delete()

        link_texts = extract_wiki_links(content)
        if not link_texts:
            db.commit()
            return

        # 查找匹配的笔记（按标题精确匹配）
        for text in link_texts:
            target = db.query(Note).filter(
                Note.title == text,
                Note.is_trashed == False  # noqa: E712
            ).first()
            if target and target.id != note_id:
                link = NoteLink(
                    source_note_id=note_id,
                    target_note_id=target.id,
                    link_text=text,
                )
                db.add(link)

        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"更新笔记链接失败: {e}")
        raise


def get_backlinks(db: Session, note_id: str) -> list[dict]:
    """
    获取指向指定笔记的反向链接

    Args:
        db: 数据库会话
        note_id: 目标笔记 ID

    Returns:
        反向链接列表，每项包含 source_note_id、source_title、link_text
    """
    try:
        links = (
            db.query(NoteLink, Note.title)
            .join(Note, NoteLink.source_note_id == Note.id)
            .filter(
                NoteLink.target_note_id == note_id,
                Note.is_trashed == False,  # noqa: E712
            )
            .order_by(NoteLink.created_at.desc())
            .all()
        )
        return [
            {
                "source_note_id": link.source_note_id,
                "source_title": title or "无标题",
                "link_text": link.link_text,
            }
            for link, title in links
        ]
    except Exception as e:
        logger.error(f"获取反向链接失败: {e}")
        return []


def delete_note_links(db: Session, note_id: str) -> None:
    """
    删除笔记的所有链接关系（出站和入站）

    Args:
        db: 数据库会话
        note_id: 笔记 ID
    """
    try:
        db.query(NoteLink).filter(
            or_(
                NoteLink.source_note_id == note_id,
                NoteLink.target_note_id == note_id,
            )
        ).delete(synchronize_session="fetch")
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"删除笔记链接失败: {e}")
        raise


# ==================== 笔记 CRUD ====================


def create_note(
    db: Session,
    title: str = "",
    content: str = "",
    folder_id: Optional[str] = None,
    note_type: str = "note",
) -> Note:
    """
    创建笔记

    Args:
        db: 数据库会话
        title: 笔记标题
        content: 笔记内容
        folder_id: 所属文件夹 ID
        note_type: 笔记类型

    Returns:
        创建的笔记对象
    """
    try:
        note = Note(
            title=title,
            content=content,
            folder_id=folder_id,
            note_type=note_type,
        )
        db.add(note)
        db.commit()
        db.refresh(note)
        # 解析内容中的双链并建立链接关系
        update_note_links(db, note.id, note.content)
        return note
    except Exception as e:
        db.rollback()
        logger.error(f"创建笔记失败: {e}")
        raise


def get_note(db: Session, note_id: str) -> Note | None:
    """
    获取单个笔记

    Args:
        db: 数据库会话
        note_id: 笔记 ID

    Returns:
        笔记对象，不存在则返回 None
    """
    try:
        return db.query(Note).filter(Note.id == note_id).first()
    except Exception as e:
        logger.error(f"获取笔记失败: {e}")
        return None


def get_notes(
    db: Session,
    folder_id: Optional[str] = None,
    tag_id: Optional[str] = None,
    is_trashed: Optional[bool] = None,
    keyword: Optional[str] = None,
    note_type: Optional[str] = None,
    offset: int = 0,
    limit: int = 50,
) -> list[Note]:
    """
    获取笔记列表，支持分页、搜索、过滤

    Args:
        db: 数据库会话
        folder_id: 按文件夹过滤
        tag_id: 按标签过滤
        is_trashed: 按回收站状态过滤
        keyword: 关键词搜索（标题和内容）
        offset: 分页偏移量
        limit: 每页数量

    Returns:
        笔记列表
    """
    try:
        query = db.query(Note).distinct()

        # 按文件夹过滤
        if folder_id is not None:
            query = query.filter(Note.folder_id == folder_id)

        # 按标签过滤（需要联表查询）
        if tag_id is not None:
            query = query.join(
                NoteTag, Note.id == NoteTag.note_id
            ).filter(NoteTag.tag_id == tag_id)

        # 按回收站状态过滤
        if is_trashed is not None:
            query = query.filter(Note.is_trashed == is_trashed)

        # 按笔记类型过滤
        if note_type is not None:
            query = query.filter(Note.note_type == note_type)

        # 关键词搜索
        if keyword:
            like_pattern = f"%{keyword}%"
            query = query.filter(
                or_(
                    Note.title.like(like_pattern),
                    Note.content.like(like_pattern),
                )
            )

        # 默认排序：置顶优先，然后按更新时间降序
        query = query.order_by(Note.is_pinned.desc(), Note.updated_at.desc())

        # 分页
        return query.offset(offset).limit(limit).all()
    except Exception as e:
        logger.error(f"获取笔记列表失败: {e}")
        return []


def update_note(
    db: Session,
    note_id: str,
    title: Optional[str] = None,
    content: Optional[str] = None,
    folder_id: Optional[str] = None,
    is_pinned: Optional[bool] = None,
    is_trashed: Optional[bool] = None,
) -> Note | None:
    """
    更新笔记

    Args:
        db: 数据库会话
        note_id: 笔记 ID
        title: 新标题
        content: 新内容
        folder_id: 新文件夹 ID
        is_pinned: 是否置顶
        is_trashed: 是否在回收站

    Returns:
        更新后的笔记对象，不存在则返回 None
    """
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if note is None:
            return None

        # 只更新非 None 的字段
        if title is not None:
            note.title = title
        if content is not None:
            note.content = content
        if folder_id is not None:
            note.folder_id = folder_id
        if is_pinned is not None:
            note.is_pinned = is_pinned
        if is_trashed is not None:
            note.is_trashed = is_trashed

        db.commit()
        db.refresh(note)
        # 如果内容有变化，重新解析双链
        if content is not None:
            update_note_links(db, note.id, note.content)
        return note
    except Exception as e:
        db.rollback()
        logger.error(f"更新笔记失败: {e}")
        raise


def delete_note(db: Session, note_id: str) -> bool:
    """
    硬删除笔记（同时删除关联的标签关系和链接关系）

    Args:
        db: 数据库会话
        note_id: 笔记 ID

    Returns:
        是否删除成功
    """
    try:
        note = db.query(Note).filter(Note.id == note_id).first()
        if note is None:
            return False

        # 先删除关联的标签关系
        db.query(NoteTag).filter(NoteTag.note_id == note_id).delete()

        # 删除关联的链接关系
        delete_note_links(db, note_id)

        # 删除笔记
        db.delete(note)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"删除笔记失败: {e}")
        raise


def empty_trash(db: Session) -> int:
    """
    清空回收站：删除所有标记为回收站中的笔记

    Args:
        db: 数据库会话

    Returns:
        删除的笔记数量
    """
    try:
        # 查找所有在回收站中的笔记 ID
        trashed_ids = (
            db.query(Note.id)
            .filter(Note.is_trashed == True)  # noqa: E712
            .all()
        )
        trashed_id_list = [item[0] for item in trashed_ids]

        if not trashed_id_list:
            return 0

        # 删除关联的标签关系
        db.query(NoteTag).filter(
            NoteTag.note_id.in_(trashed_id_list)
        ).delete(synchronize_session="fetch")

        # 删除笔记
        count = (
            db.query(Note)
            .filter(Note.is_trashed == True)  # noqa: E712
            .delete(synchronize_session="fetch")
        )

        db.commit()
        return count
    except Exception as e:
        db.rollback()
        logger.error(f"清空回收站失败: {e}")
        raise


def get_note_count_by_type(db: Session) -> dict:
    """
    按笔记类型分组统计数量

    Args:
        db: 数据库会话

    Returns:
        字典，键为笔记类型，值为对应数量
    """
    try:
        results = (
            db.query(Note.note_type, func.count(Note.id))
            .group_by(Note.note_type)
            .all()
        )
        return {item[0]: item[1] for item in results}
    except Exception as e:
        logger.error(f"统计笔记类型数量失败: {e}")
        return {}


# ==================== 全文搜索 (FTS5) ====================


def search_notes_fulltext(
    db: Session,
    keyword: str,
    folder_id: Optional[str] = None,
    tag_id: Optional[str] = None,
    note_type: Optional[str] = None,
    is_trashed: bool = False,
    limit: int = 50,
    offset: int = 0,
) -> tuple[list[Note], int]:
    """
    使用 SQLite FTS5 进行全文搜索

    Args:
        db: 数据库会话
        keyword: 搜索关键词
        folder_id: 文件夹筛选
        tag_id: 标签筛选
        note_type: 笔记类型筛选
        is_trashed: 是否只搜索回收站
        limit: 返回数量上限
        offset: 分页偏移

    Returns:
        (笔记列表, 总数)
    """
    from sqlalchemy import text

    try:
        # 构建基础 FTS 查询
        # FTS5 MATCH 支持 AND/OR/NOT 和短语搜索
        # 自动为关键词添加引号以支持中文
        escaped = keyword.replace('"', '""')
        fts_query = f'"{escaped}"'

        # 先获取匹配的 note_id 列表（带排名）
        fts_sql = text(
            "SELECT note_id FROM notes_fts WHERE notes_fts MATCH :query ORDER BY rank LIMIT :limit OFFSET :offset"
        )
        fts_results = db.execute(fts_sql, {
            "query": fts_query,
            "limit": limit,
            "offset": offset,
        }).fetchall()

        note_ids = [row[0] for row in fts_results]
        if not note_ids:
            return [], 0

        # 再获取总数
        count_sql = text(
            "SELECT COUNT(*) FROM notes_fts WHERE notes_fts MATCH :query"
        )
        total = db.execute(count_sql, {"query": fts_query}).scalar() or 0

        # 根据 note_ids 查询完整笔记数据，同时应用额外筛选
        query = db.query(Note).filter(Note.id.in_(note_ids))

        if folder_id is not None:
            query = query.filter(Note.folder_id == folder_id)
        if note_type is not None:
            query = query.filter(Note.note_type == note_type)
        if is_trashed:
            query = query.filter(Note.is_trashed == True)  # noqa: E712
        else:
            query = query.filter(Note.is_trashed == False)  # noqa: E712

        # 标签筛选
        if tag_id is not None:
            query = query.join(NoteTag).filter(NoteTag.tag_id == tag_id)

        notes = query.order_by(Note.updated_at.desc()).all()

        # 保持 FTS 返回的顺序
        note_map = {n.id: n for n in notes}
        ordered = [note_map[nid] for nid in note_ids if nid in note_map]

        return ordered, total
    except Exception as e:
        logger.error(f"全文搜索失败: {e}")
        return [], 0


# ==================== 知识图谱 ====================


def get_graph_data(db: Session) -> dict:
    """
    获取知识图谱数据：节点（笔记）和边（链接关系）

    Returns:
        {"nodes": [...], "edges": [...]}
    """
    try:
        # 获取所有非删除笔记作为节点
        notes = (
            db.query(Note.id, Note.title, Note.note_type)
            .filter(Note.is_trashed == False)  # noqa: E712
            .all()
        )
        nodes = [
            {
                "id": n.id,
                "label": n.title or "无标题",
                "type": n.note_type,
            }
            for n in notes
        ]

        # 获取所有链接关系作为边
        links = (
            db.query(NoteLink.source_note_id, NoteLink.target_note_id)
            .all()
        )
        edges = [
            {"from": l.source_note_id, "to": l.target_note_id}
            for l in links
        ]

        return {"nodes": nodes, "edges": edges}
    except Exception as e:
        logger.error(f"获取图谱数据失败: {e}")
        return {"nodes": [], "edges": []}


# ==================== 弱点改进系统 CRUD ====================

from app.database.models import Weakness, ImprovementPlan, MicroAction, ActionLog, Review


# ===== Weakness CRUD =====

def create_weakness(
    db: Session,
    title: str,
    description: str = "",
    category: str = "other",
    severity: int = 3,
    frequency: str = "occasional",
    trigger_context: str = "",
    impact: str = "",
    tried_solutions: str = "",
) -> Weakness:
    w = Weakness(
        title=title,
        description=description,
        category=category,
        severity=severity,
        frequency=frequency,
        trigger_context=trigger_context,
        impact=impact,
        tried_solutions=tried_solutions,
    )
    db.add(w)
    db.commit()
    db.refresh(w)
    return w


def get_weakness(db: Session, weakness_id: str) -> Weakness | None:
    return db.query(Weakness).filter(Weakness.id == weakness_id).first()


def get_weaknesses(
    db: Session,
    status: str | None = None,
    category: str | None = None,
    keyword: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[Weakness]:
    q = db.query(Weakness)
    if status:
        q = q.filter(Weakness.status == status)
    if category:
        q = q.filter(Weakness.category == category)
    if keyword:
        kw = f"%{keyword}%"
        q = q.filter(
            (Weakness.title.like(kw)) | (Weakness.description.like(kw))
        )
    return q.order_by(Weakness.severity.desc(), Weakness.created_at.desc()).offset(offset).limit(limit).all()


def update_weakness(db: Session, weakness_id: str, **kwargs) -> Weakness | None:
    w = get_weakness(db, weakness_id)
    if not w:
        return None
    for k, v in kwargs.items():
        if hasattr(w, k) and v is not None:
            setattr(w, k, v)
    db.commit()
    db.refresh(w)
    return w


def delete_weakness(db: Session, weakness_id: str) -> bool:
    w = get_weakness(db, weakness_id)
    if not w:
        return False
    db.delete(w)
    db.commit()
    return True


# ===== Improvement Plan CRUD =====

def create_plan(
    db: Session,
    weakness_id: str,
    title: str,
    description: str = "",
    strategy: str = "",
    duration_days: int = 30,
) -> ImprovementPlan:
    p = ImprovementPlan(
        weakness_id=weakness_id,
        title=title,
        description=description,
        strategy=strategy,
        duration_days=duration_days,
    )
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


def get_plan(db: Session, plan_id: str) -> ImprovementPlan | None:
    return db.query(ImprovementPlan).filter(ImprovementPlan.id == plan_id).first()


def get_plans_by_weakness(db: Session, weakness_id: str) -> list[ImprovementPlan]:
    return (
        db.query(ImprovementPlan)
        .filter(ImprovementPlan.weakness_id == weakness_id)
        .order_by(ImprovementPlan.created_at.desc())
        .all()
    )


def get_all_plans(db: Session, status: str | None = None) -> list[ImprovementPlan]:
    q = db.query(ImprovementPlan)
    if status:
        q = q.filter(ImprovementPlan.status == status)
    return q.order_by(ImprovementPlan.created_at.desc()).all()


def update_plan(db: Session, plan_id: str, **kwargs) -> ImprovementPlan | None:
    p = get_plan(db, plan_id)
    if not p:
        return None
    for k, v in kwargs.items():
        if hasattr(p, k) and v is not None:
            setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


def delete_plan(db: Session, plan_id: str) -> bool:
    p = get_plan(db, plan_id)
    if not p:
        return False
    db.delete(p)
    db.commit()
    return True


# ===== Micro Action CRUD =====

def create_action(
    db: Session,
    plan_id: str,
    title: str,
    description: str = "",
    frequency: str = "daily",
    scheduled_time: str | None = None,
    estimated_minutes: int = 5,
    sort_order: int = 0,
) -> MicroAction:
    a = MicroAction(
        plan_id=plan_id,
        title=title,
        description=description,
        frequency=frequency,
        scheduled_time=scheduled_time,
        estimated_minutes=estimated_minutes,
        sort_order=sort_order,
    )
    db.add(a)
    db.commit()
    db.refresh(a)
    return a


def get_action(db: Session, action_id: str) -> MicroAction | None:
    return db.query(MicroAction).filter(MicroAction.id == action_id).first()


def get_actions_by_plan(db: Session, plan_id: str) -> list[MicroAction]:
    return (
        db.query(MicroAction)
        .filter(MicroAction.plan_id == plan_id)
        .order_by(MicroAction.sort_order)
        .all()
    )


def get_active_actions(db: Session) -> list[MicroAction]:
    return (
        db.query(MicroAction)
        .filter(MicroAction.is_active == True)
        .order_by(MicroAction.sort_order)
        .all()
    )


def update_action(db: Session, action_id: str, **kwargs) -> MicroAction | None:
    a = get_action(db, action_id)
    if not a:
        return None
    for k, v in kwargs.items():
        if hasattr(a, k) and v is not None:
            setattr(a, k, v)
    db.commit()
    db.refresh(a)
    return a


def delete_action(db: Session, action_id: str) -> bool:
    a = get_action(db, action_id)
    if not a:
        return False
    db.delete(a)
    db.commit()
    return True


# ===== Action Log CRUD =====

def create_action_log(
    db: Session,
    action_id: str,
    completed: bool = False,
    notes: str = "",
    mood: int | None = None,
    difficulty: int | None = None,
) -> ActionLog:
    log = ActionLog(
        action_id=action_id,
        completed=completed,
        notes=notes,
        mood=mood,
        difficulty=difficulty,
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def get_logs_by_action(db: Session, action_id: str, limit: int = 30) -> list[ActionLog]:
    return (
        db.query(ActionLog)
        .filter(ActionLog.action_id == action_id)
        .order_by(ActionLog.log_date.desc())
        .limit(limit)
        .all()
    )


def get_today_logs(db: Session) -> list[ActionLog]:
    from datetime import date
    today = date.today()
    return (
        db.query(ActionLog)
        .filter(
            ActionLog.log_date >= today,
        )
        .all()
    )


def get_action_stats(db: Session, action_id: str) -> dict:
    """获取某个行动的完成统计"""
    logs = db.query(ActionLog).filter(ActionLog.action_id == action_id).all()
    total = len(logs)
    completed = sum(1 for l in logs if l.completed)
    completion_rate = round(completed / total * 100, 1) if total > 0 else 0
    return {
        "total_days": total,
        "completed_days": completed,
        "completion_rate": completion_rate,
    }


# ===== Review CRUD =====

def create_review(
    db: Session,
    weakness_id: str,
    review_type: str = "weekly",
    content: str = "",
    progress_score: int = 0,
    insights: str = "",
) -> Review:
    r = Review(
        weakness_id=weakness_id,
        review_type=review_type,
        content=content,
        progress_score=progress_score,
        insights=insights,
    )
    db.add(r)
    db.commit()
    db.refresh(r)
    return r


def get_reviews_by_weakness(
    db: Session, weakness_id: str, review_type: str | None = None
) -> list[Review]:
    q = db.query(Review).filter(Review.weakness_id == weakness_id)
    if review_type:
        q = q.filter(Review.review_type == review_type)
    return q.order_by(Review.created_at.desc()).all()


def get_latest_review(db: Session, weakness_id: str) -> Review | None:
    return (
        db.query(Review)
        .filter(Review.weakness_id == weakness_id)
        .order_by(Review.created_at.desc())
        .first()
    )


def delete_review(db: Session, review_id: str) -> bool:
    r = db.query(Review).filter(Review.id == review_id).first()
    if not r:
        return False
    db.delete(r)
    db.commit()
    return True


# ==================== 文件夹 CRUD ====================


def create_folder(
    db: Session,
    name: str,
    parent_id: Optional[str] = None,
) -> Folder:
    """
    创建文件夹

    Args:
        db: 数据库会话
        name: 文件夹名称
        parent_id: 父文件夹 ID

    Returns:
        创建的文件夹对象
    """
    try:
        folder = Folder(name=name, parent_id=parent_id)
        db.add(folder)
        db.commit()
        db.refresh(folder)
        return folder
    except Exception as e:
        db.rollback()
        logger.error(f"创建文件夹失败: {e}")
        raise


def get_folders(
    db: Session,
    parent_id: Optional[str] = None,
) -> list[Folder]:
    """
    获取文件夹列表

    Args:
        db: 数据库会话
        parent_id: 按父文件夹过滤，None 表示获取所有

    Returns:
        文件夹列表
    """
    try:
        query = db.query(Folder)
        if parent_id is not None:
            query = query.filter(Folder.parent_id == parent_id)
        return query.order_by(Folder.updated_at.desc()).all()
    except Exception as e:
        logger.error(f"获取文件夹列表失败: {e}")
        return []


def update_folder(
    db: Session,
    folder_id: str,
    name: str,
) -> Folder | None:
    """
    更新文件夹名称

    Args:
        db: 数据库会话
        folder_id: 文件夹 ID
        name: 新名称

    Returns:
        更新后的文件夹对象，不存在则返回 None
    """
    try:
        folder = db.query(Folder).filter(Folder.id == folder_id).first()
        if folder is None:
            return None

        folder.name = name
        db.commit()
        db.refresh(folder)
        return folder
    except Exception as e:
        db.rollback()
        logger.error(f"更新文件夹失败: {e}")
        raise


def delete_folder(db: Session, folder_id: str) -> bool:
    """
    删除文件夹
    如果文件夹下有笔记，将笔记的 folder_id 设为 None（移到根目录）

    Args:
        db: 数据库会话
        folder_id: 文件夹 ID

    Returns:
        是否删除成功
    """
    try:
        folder = db.query(Folder).filter(Folder.id == folder_id).first()
        if folder is None:
            return False

        # 将该文件夹下的笔记移到根目录（folder_id 设为 None）
        db.query(Note).filter(Note.folder_id == folder_id).update(
            {Note.folder_id: None}, synchronize_session="fetch"
        )

        # 将子文件夹的 parent_id 设为 None
        db.query(Folder).filter(Folder.parent_id == folder_id).update(
            {Folder.parent_id: None}, synchronize_session="fetch"
        )

        # 删除文件夹
        db.delete(folder)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"删除文件夹失败: {e}")
        raise


# ==================== 标签 CRUD ====================


def create_tag(
    db: Session,
    name: str,
    color: str = "#0D7377",
) -> Tag:
    """
    创建标签

    Args:
        db: 数据库会话
        name: 标签名称
        color: 标签颜色

    Returns:
        创建的标签对象
    """
    try:
        tag = Tag(name=name, color=color)
        db.add(tag)
        db.commit()
        db.refresh(tag)
        return tag
    except Exception as e:
        db.rollback()
        logger.error(f"创建标签失败: {e}")
        raise


def get_tags(db: Session) -> list[Tag]:
    """
    获取所有标签

    Args:
        db: 数据库会话

    Returns:
        标签列表
    """
    try:
        return db.query(Tag).order_by(Tag.created_at.desc()).all()
    except Exception as e:
        logger.error(f"获取标签列表失败: {e}")
        return []


def update_tag(
    db: Session,
    tag_id: str,
    name: Optional[str] = None,
    color: Optional[str] = None,
) -> Tag | None:
    """
    更新标签

    Args:
        db: 数据库会话
        tag_id: 标签 ID
        name: 新名称
        color: 新颜色

    Returns:
        更新后的标签对象，不存在则返回 None
    """
    try:
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if tag is None:
            return None

        if name is not None:
            tag.name = name
        if color is not None:
            tag.color = color

        db.commit()
        db.refresh(tag)
        return tag
    except Exception as e:
        db.rollback()
        logger.error(f"更新标签失败: {e}")
        raise


def delete_tag(db: Session, tag_id: str) -> bool:
    """
    删除标签（同时删除关联关系）

    Args:
        db: 数据库会话
        tag_id: 标签 ID

    Returns:
        是否删除成功
    """
    try:
        tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if tag is None:
            return False

        # 先删除关联关系
        db.query(NoteTag).filter(NoteTag.tag_id == tag_id).delete()

        # 删除标签
        db.delete(tag)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        logger.error(f"删除标签失败: {e}")
        raise


def get_tag_with_count(db: Session) -> list[dict]:
    """
    获取所有标签及其关联的笔记数量

    Args:
        db: 数据库会话

    Returns:
        列表，每项包含 tag 对象和 note_count 数量
    """
    try:
        results = (
            db.query(
                Tag,
                func.count(NoteTag.note_id).label("note_count"),
            )
            .outerjoin(NoteTag, Tag.id == NoteTag.tag_id)
            .group_by(Tag.id)
            .order_by(Tag.created_at.desc())
            .all()
        )
        return [
            {
                "id": tag.id,
                "name": tag.name,
                "color": tag.color,
                "created_at": tag.created_at.isoformat() if tag.created_at else None,
                "note_count": count,
            }
            for tag, count in results
        ]
    except Exception as e:
        logger.error(f"获取标签统计失败: {e}")
        return []