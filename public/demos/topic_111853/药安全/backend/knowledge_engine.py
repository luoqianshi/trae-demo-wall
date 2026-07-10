"""
药管家 知识库引擎
封装精确文本匹配、语义相似度匹配和知识库查询逻辑
采用分级置信度决策体系：
- 高置信度(>0.92)：自动复用历史回答
- 中等置信度(0.75-0.92)：需管理员确认后复用
- 低置信度(<0.75)：视为新问题，创建待回复记录
"""
import sqlite3
import os
import difflib
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), 'medicine.db')

HIGH_CONFIDENCE_THRESHOLD = 0.92
MEDIUM_CONFIDENCE_THRESHOLD = 0.75

# 同义词映射：将口语化表达归一化为标准术语
SYNONYM_MAP = {
    '吃': '服用', '吃了': '服用', '服药': '服用', '用药': '服用',
    '副作用': '不良反应', '反应': '不良反应',
    '治什么': '适应症', '治疗什么': '适应症', '治啥': '适应症', '能治': '适应症',
    '怎么吃': '用法用量', '怎么用': '用法用量', '用量': '用法用量',
    '过期': '有效期', '保质期': '有效期',
    '不能吃': '禁忌', '禁忌什么': '禁忌', '不能和什么一起': '禁忌',
    '啥': '什么', '咋': '怎么', '嘛': '什么',
    '药片': '药品', '药丸': '药品',
    '怀孕': '孕妇', '哺乳': '孕妇',
    '小孩': '儿童', '孩子': '儿童', '宝宝': '儿童',
    '什么时候': '时间', '几点': '时间',
}

# 停用词：在关键词提取时过滤掉的无意义词
STOP_WORDS = {'的', '了', '是', '在', '有', '和', '与', '及', '或', '也', '都', '这', '那', '我', '你', '他', '她', '它', '们', '一', '个', '些', '下', '上', '里', '中', '吗', '呢', '吧', '啊', '呀', '哦', '嗯', '这个', '那个', '可以', '能够', '应该', '需要'}


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def _normalize_text(text: str) -> str:
    """归一化文本：小写、去空格、替换同义词"""
    text = text.strip().lower().replace(' ', '')
    for src, dst in SYNONYM_MAP.items():
        text = text.replace(src.lower().replace(' ', ''), dst.lower().replace(' ', ''))
    return text


def _extract_keywords(text: str) -> set:
    """
    从文本中提取关键词集合
    1. 归一化文本（含同义词替换）
    2. 过滤停用词
    3. 生成 2-gram 字符序列作为关键词
    """
    normalized = _normalize_text(text)
    if not normalized:
        return set()

    # 生成 2-gram 字符序列
    keywords = set()
    for i in range(len(normalized) - 1):
        bigram = normalized[i:i+2]
        # 过滤纯停用词的 bigram
        if bigram not in STOP_WORDS and not all(c in STOP_WORDS for c in bigram):
            keywords.add(bigram)

    # 同时加入完整词的归一化形式作为关键词
    # 简单按常见标点切分
    import re
    words = re.split(r'[，。？！,.?\s、；;：:（）()【】\[\]"]+', text.strip().lower().replace(' ', ''))
    for w in words:
        if not w or w in STOP_WORDS:
            continue
        # 归一化后的词也作为关键词
        norm_w = _normalize_text(w)
        if norm_w and norm_w not in STOP_WORDS and len(norm_w) >= 2:
            keywords.add(norm_w)

    return keywords


def _compute_similarity(str1: str, str2: str) -> float:
    """
    计算两个字符串的语义相似度（综合相似度）
    策略：字符序列相似度（权重 0.6）+ 关键词重叠度（权重 0.4）
    返回 0-1 之间的相似度分数
    """
    if not str1.strip() or not str2.strip():
        return 0.0

    # 1. 字符序列相似度（保留原始 difflib 行为，但使用归一化文本）
    str1_clean = _normalize_text(str1)
    str2_clean = _normalize_text(str2)

    if not str1_clean or not str2_clean:
        return 0.0

    matcher = difflib.SequenceMatcher(None, str1_clean, str2_clean)
    char_similarity = matcher.ratio()

    # 2. 关键词重叠度（Jaccard 相似度）
    kw1 = _extract_keywords(str1)
    kw2 = _extract_keywords(str2)

    if not kw1 or not kw2:
        # 关键词提取失败时仅用字符相似度
        return char_similarity

    intersection = kw1 & kw2
    union = kw1 | kw2
    keyword_similarity = len(intersection) / len(union) if union else 0.0

    # 综合相似度
    return 0.6 * char_similarity + 0.4 * keyword_similarity


class KnowledgeEngine:
    """知识库查询引擎 —— 精确匹配 + 语义相似度匹配"""

    def exact_match(self, question_text: str, family_id: int):
        """
        精确文本匹配：在知识库中查找与 question_text 完全一致的记录
        返回匹配到的知识条目，或 None
        """
        conn = get_db()
        try:
            row = conn.execute(
                "SELECT * FROM knowledge_base WHERE family_id = ? AND question_text = ?",
                (family_id, question_text.strip())
            ).fetchone()
            if row:
                conn.execute(
                    "UPDATE knowledge_base SET use_count = use_count + 1, updated_at = datetime('now','localtime') WHERE id = ?",
                    (row['id'],)
                )
                conn.commit()
                return dict(row)
            return None
        finally:
            conn.close()

    def semantic_match(self, question_text: str, family_id: int):
        """
        语义相似度匹配：在知识库中查找与 question_text 语义相似的记录
        返回匹配结果列表，按相似度降序排列
        """
        conn = get_db()
        try:
            rows = conn.execute(
                "SELECT * FROM knowledge_base WHERE family_id = ? AND answer_type != 'pending'",
                (family_id,)
            ).fetchall()

            matches = []
            for row in rows:
                similarity = _compute_similarity(question_text, row['question_text'])
                if similarity >= MEDIUM_CONFIDENCE_THRESHOLD:
                    matches.append({
                        'row': dict(row),
                        'similarity': similarity,
                    })

            matches.sort(key=lambda x: x['similarity'], reverse=True)
            return matches
        finally:
            conn.close()

    def ask_question(self, question_text: str, family_id: int, elderly_id: int):
        """
        老人提问主流程（分级置信度决策体系）：
        
        1. 精确文本匹配知识库 → 命中直接返回（高置信度）
        2. 语义相似度匹配 → 根据置信度分级处理：
           - >0.92（高置信度）：自动复用历史回答，无需确认
           - 0.75-0.92（中等置信度）：返回建议答案，需管理员确认后正式存入
           - <0.75（低置信度）：视为新问题，创建待回复记录
        """
        question_text = question_text.strip()
        if not question_text:
            return {
                "found": False,
                "source": "invalid",
                "data": {"error": "问题不能为空"}
            }

        matched = self.exact_match(question_text, family_id)
        if matched:
            return {
                "found": True,
                "source": "exact_match",
                "confidence": "high",
                "data": {
                    "id": matched["id"],
                    "question": matched["question_text"],
                    "answer": matched["answer_text"],
                    "answer_audio_url": matched["answer_audio_url"],
                    "answer_image_url": matched["answer_image_url"],
                    "answer_type": matched["answer_type"],
                    "use_count": matched["use_count"] + 1,
                }
            }

        semantic_matches = self.semantic_match(question_text, family_id)
        
        if semantic_matches:
            best_match = semantic_matches[0]
            similarity = best_match['similarity']
            matched_row = best_match['row']

            if similarity > HIGH_CONFIDENCE_THRESHOLD:
                conn = get_db()
                try:
                    conn.execute(
                        "UPDATE knowledge_base SET use_count = use_count + 1, updated_at = datetime('now','localtime') WHERE id = ?",
                        (matched_row['id'],)
                    )
                    conn.commit()
                finally:
                    conn.close()

                return {
                    "found": True,
                    "source": "semantic_match_high",
                    "confidence": "high",
                    "similarity": round(similarity, 4),
                    "data": {
                        "id": matched_row["id"],
                        "question": matched_row["question_text"],
                        "answer": matched_row["answer_text"],
                        "answer_audio_url": matched_row["answer_audio_url"],
                        "answer_image_url": matched_row["answer_image_url"],
                        "answer_type": matched_row["answer_type"],
                        "use_count": matched_row["use_count"] + 1,
                    }
                }

            elif similarity >= MEDIUM_CONFIDENCE_THRESHOLD:
                # 关键修复：中等置信度也必须创建 pending 记录，防止老人点"不是"后问题丢失
                # 若老人点"是"→调用 confirm_semantic_match 创建确认记录；
                # 若老人点"不是"→此 pending 记录等待管理员回复
                conn = get_db()
                try:
                    conn.execute(
                        """INSERT INTO knowledge_base
                           (family_id, elderly_id, question_text, answer_text, answer_type, use_count)
                           VALUES (?, ?, ?, '', 'pending', 0)""",
                        (family_id, elderly_id, question_text)
                    )
                    conn.commit()
                    pending_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
                finally:
                    conn.close()

                return {
                    "found": True,
                    "source": "semantic_match_medium",
                    "confidence": "medium",
                    "similarity": round(similarity, 4),
                    "data": {
                        "id": pending_id,
                        "suggested_id": matched_row["id"],
                        "suggested_question": matched_row["question_text"],
                        "suggested_answer": matched_row["answer_text"],
                        "answer": matched_row["answer_text"],  # 兼容前端对 answer 字段的读取
                        "new_question": question_text,
                        "needs_confirmation": True,
                    }
                }

        conn = get_db()
        try:
            conn.execute(
                """INSERT INTO knowledge_base 
                   (family_id, elderly_id, question_text, answer_text, answer_type, use_count)
                   VALUES (?, ?, ?, '', 'pending', 0)""",
                (family_id, elderly_id, question_text)
            )
            conn.commit()
            new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        finally:
            conn.close()

        return {
            "found": False,
            "source": "pending",
            "confidence": "low",
            "data": {"id": new_id, "question": question_text, "status": "pending"}
        }

    def confirm_semantic_match(self, new_question: str, family_id: int, elderly_id: int, suggested_id: int):
        """
        确认中等置信度的语义匹配结果
        将新问题与历史回答关联，并存入知识库
        """
        conn = get_db()
        try:
            suggested_row = conn.execute(
                "SELECT * FROM knowledge_base WHERE id = ? AND family_id = ?",
                (suggested_id, family_id)
            ).fetchone()

            if not suggested_row:
                return {"success": False, "error": "建议的回答不存在"}

            conn.execute(
                """INSERT INTO knowledge_base 
                   (family_id, elderly_id, question_text, answer_text, 
                    answer_audio_url, answer_image_url, answer_type, use_count)
                   VALUES (?, ?, ?, ?, ?, ?, ?, 0)""",
                (family_id, elderly_id, new_question, suggested_row['answer_text'],
                 suggested_row['answer_audio_url'], suggested_row['answer_image_url'],
                 suggested_row['answer_type'])
            )
            conn.commit()
            new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

            return {
                "success": True,
                "data": {
                    "id": new_id,
                    "question": new_question,
                    "answer": suggested_row['answer_text'],
                    "answer_type": suggested_row['answer_type'],
                    "source": "confirmed_semantic_match",
                }
            }
        finally:
            conn.close()

    def reply_question(self, kb_id: int, family_id: int, answer_text: str = "",
                       answer_audio_url: str = "", answer_image_url: str = "",
                       answer_type: str = "text"):
        """
        管理员回复问题 → 更新知识库记录
        answer_type: text / audio / image / mixed
        """
        conn = get_db()
        try:
            row = conn.execute(
                "SELECT * FROM knowledge_base WHERE id = ? AND family_id = ?",
                (kb_id, family_id)
            ).fetchone()
            if not row:
                return False

            conn.execute(
                """UPDATE knowledge_base 
                   SET answer_text = ?, answer_audio_url = ?, answer_image_url = ?,
                       answer_type = ?, updated_at = datetime('now','localtime')
                   WHERE id = ? AND family_id = ?""",
                (answer_text, answer_audio_url, answer_image_url, answer_type, kb_id, family_id)
            )
            conn.commit()
            return True
        finally:
            conn.close()

    def get_pending_questions(self, family_id: int):
        """获取待回复的问题列表（answer_type = 'pending'）"""
        conn = get_db()
        try:
            rows = conn.execute(
                """SELECT kb.*, u.username as elderly_username, u.elderly_name
                   FROM knowledge_base kb
                   LEFT JOIN users u ON kb.elderly_id = u.id
                   WHERE kb.family_id = ? AND kb.answer_type = 'pending'
                   ORDER BY kb.created_at DESC""",
                (family_id,)
            ).fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    def get_all_knowledge(self, family_id: int, elderly_id: int = None):
        """获取知识库列表，可按老人筛选"""
        conn = get_db()
        try:
            query = """SELECT kb.*, u.username as elderly_username, u.elderly_name
                       FROM knowledge_base kb
                       LEFT JOIN users u ON kb.elderly_id = u.id
                       WHERE kb.family_id = ? AND kb.answer_type != 'pending'"""
            params = [family_id]

            if elderly_id:
                query += " AND kb.elderly_id = ?"
                params.append(elderly_id)

            query += " ORDER BY kb.use_count DESC, kb.updated_at DESC"
            rows = conn.execute(query, params).fetchall()
            return [dict(r) for r in rows]
        finally:
            conn.close()

    def update_knowledge(self, kb_id: int, family_id: int, **kwargs):
        """更新知识库条目（编辑问题、回答等）"""
        allowed_fields = ['question_text', 'answer_text', 'answer_audio_url',
                          'answer_image_url', 'answer_type']
        updates = []
        params = []
        for field in allowed_fields:
            if field in kwargs:
                updates.append(f"{field} = ?")
                params.append(kwargs[field])

        if not updates:
            return False

        updates.append("updated_at = datetime('now','localtime')")
        params.extend([kb_id, family_id])

        conn = get_db()
        try:
            conn.execute(
                f"UPDATE knowledge_base SET {', '.join(updates)} WHERE id = ? AND family_id = ?",
                params
            )
            conn.commit()
            return True
        finally:
            conn.close()

    def delete_knowledge(self, kb_id: int, family_id: int):
        """删除知识库条目"""
        conn = get_db()
        try:
            conn.execute(
                "DELETE FROM knowledge_base WHERE id = ? AND family_id = ?",
                (kb_id, family_id)
            )
            conn.commit()
            return True
        finally:
            conn.close()


knowledge_engine = KnowledgeEngine()