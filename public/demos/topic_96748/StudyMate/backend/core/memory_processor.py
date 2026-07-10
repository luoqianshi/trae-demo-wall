"""
MemoryProcessor v2.0 - 并行记忆处理器
核心功能:
  1. 实时调用大模型整理对话为专业记叙文
  2. 新增记忆时并行查询关联主题，决定续写还是新建
  3. 提供进度回调机制，供GUI显示状态
"""

import threading
import time
import json
import re
from typing import Optional, Dict, List, Callable, Any
from dataclasses import dataclass, field

from .memory_bank import MemoryBank, Session


@dataclass
class ProcessingResult:
    success: bool = False
    session_id: str = ""
    action: str = ""
    title: str = ""
    topic: str = ""
    keywords: List[str] = field(default_factory=list)
    narrative_summary: str = ""
    body_content: str = ""
    body_segments: List[str] = field(default_factory=list)
    importance: float = 0.5
    related_session_ids: List[str] = field(default_factory=list)
    error_message: str = ""
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict:
        return {
            "success": self.success,
            "session_id": self.session_id,
            "action": self.action,
            "title": self.title,
            "topic": self.topic,
            "keywords": self.keywords,
            "narrative_summary": self.narrative_summary,
            "importance": self.importance,
            "related_session_ids": self.related_session_ids,
            "error_message": self.error_message,
            "timestamp": self.timestamp
        }


NARRATIVE_SUMMARIZE_PROMPT = """你是一个严肃严谨的学习记录员。请根据以下学习对话内容，生成一份专业的记叙文摘要和整理后的学习笔记正文，并提取关键信息。

对话内容：
{conversation_text}

请以JSON格式返回以下字段：
{{
    "title": "简短而准确的学习主题标题，不超过20字",
    "topic": "核心主题标签，如'数学'/'编程'/'英语'等",
    "keywords": ["关键词1", "关键词2", "关键词3", "关键词4", "关键词5"],
    "narrative_summary": "专业的记叙文风格摘要，用自然语言描述学习过程。包括学习的起因、主要内容、难点和收获。长度200-500字。",
    "body_content": "整理后的完整学习笔记正文，采用严肃正式的书面语风格，按照时间顺序记录全部内容。请将用户与AI助手的对话转换为规范的学习笔记格式。包含背景、知识点、分析过程、结论建议等完整内容。语言须正式、严谨、逻辑清晰。正文内容应详实完整，字数不限。",
    "importance": 0.7
}}

重要要求：
1. importance 是0-1之间的浮点数，表示这段学习内容的重要性（1.0为最高）
2. narrative_summary 必须是完整的中文记叙文，包含时间感和逻辑顺序（200-500字）
3. body_content 必须是严肃正式的学习笔记，采用第三人称书面语风格，内容完整逻辑清晰
4. keywords 提取3-8个最重要的关键词
5. title 要简洁准确，能一眼看出学习的主题
6. 只返回严格的JSON格式，不要有其他说明文字
"""

RELATION_CHECK_PROMPT = """你是一个专业的学习内容关联分析员。请判断以下新学习内容与已有学习记录之间的关联程度。

新学习内容：
{new_conversation}

已有学习记录：
{existing_sessions_text}

请以JSON格式返回以下字段：
{{
    "is_related": true/false,
    "most_related_session_index": 0,
    "relation_score": 0.8,
    "relation_reason": "简要说明为什么相关或不相关",
    "should_continue": true/false
}}

重要要求：
1. is_related: 新学习内容是否与任何已有学习记录存在明显的主题关联
2. most_related_session_index: 最相关学习记录的索引（从0开始），如果不相关填-1
3. relation_score: 0-1的关联度分数
4. should_continue: 是否应该将新学习内容续写/追加到最相关的学习记录中
5. 只返回严格的JSON格式，不要有其他说明文字
"""


class MemoryProcessor:

    def __init__(self, memory_bank: MemoryBank, llm_client: Any = None):
        self.memory_bank = memory_bank
        self.llm_client = llm_client
        self.status_callback: Optional[Callable[[str, Dict], None]] = None
        self.result_callback: Optional[Callable[[ProcessingResult], None]] = None
        self._processing_thread: Optional[threading.Thread] = None
        self._message_buffer: List[Dict] = []
        self._buffer_lock = threading.Lock()
        self._min_messages_for_processing = 2
        self._processing_cooldown = 3.0
        self._last_processing_time: float = 0
        self._current_session_id: Optional[str] = None

    def set_status_callback(self, callback: Callable[[str, Dict], None]):
        self.status_callback = callback

    def set_result_callback(self, callback: Callable[[ProcessingResult], None]):
        self.result_callback = callback

    def _notify_status(self, message: str, details: Dict = None):
        if self.status_callback:
            try:
                self.status_callback(message, details or {})
            except Exception as e:
                print(f"[MemoryProcessor] 状态回调异常: {e}")

    def _notify_result(self, result: ProcessingResult):
        if self.result_callback:
            try:
                self.result_callback(result)
            except Exception as e:
                print(f"[MemoryProcessor] 结果回调异常: {e}")

    def add_message_for_processing(self, role: str, content: str, session_id: str = None):
        if session_id:
            self._current_session_id = session_id

        with self._buffer_lock:
            self._message_buffer.append({
                "role": role,
                "content": content,
                "timestamp": time.time()
            })

        self._notify_status(
            "已记录学习对话消息",
            {"message_count": len(self._message_buffer)}
        )

        time_since_last = time.time() - self._last_processing_time
        should_process = (
            len(self._message_buffer) >= self._min_messages_for_processing
            and time_since_last >= self._processing_cooldown
        )

        if should_process:
            self._trigger_processing()

    def force_process_now(self):
        with self._buffer_lock:
            if self._message_buffer:
                self._trigger_processing()

    def _trigger_processing(self):
        if self._processing_thread and self._processing_thread.is_alive():
            return

        with self._buffer_lock:
            messages_to_process = list(self._message_buffer)
            self._message_buffer = []

        if not messages_to_process:
            return

        self._processing_thread = threading.Thread(
            target=self._process_messages,
            args=(messages_to_process,),
            daemon=True
        )
        self._processing_thread.start()

    def _process_messages(self, messages: List[Dict]):
        try:
            self._last_processing_time = time.time()
            self._notify_status("正在分析学习内容...", {"messages": len(messages)})

            conversation_text = self._format_conversation(messages)

            self._notify_status("正在查询相关记忆...", {})
            related_sessions = self.memory_bank.find_related_sessions(
                conversation_text,
                top_k=5,
                min_threshold=0.2
            )

            self._notify_status("正在整理学习笔记...", {})
            structured_result = self._summarize_with_llm(conversation_text)

            if not structured_result:
                self._notify_status("使用本地简单记录", {})
                structured_result = self._fallback_summarize(conversation_text)

            action = "new_session"
            target_session_id = self._current_session_id
            related_ids = []

            if related_sessions:
                try:
                    relation_decision = self._check_relationship_with_llm(
                        conversation_text,
                        related_sessions
                    )

                    if relation_decision.get("is_related", False) and relation_decision.get("should_continue", False):
                        idx = relation_decision.get("most_related_session_index", 0)
                        if 0 <= idx < len(related_sessions):
                            target_session_id = related_sessions[idx][0].session_id
                            action = "continue_session"
                            related_ids = [s[0].session_id for s in related_sessions[:3]]
                            self._notify_status(
                                "发现相关主题，将续写至已有学习记录",
                                {"related_title": related_sessions[idx][0].title}
                            )
                except Exception as e:
                    print(f"[MemoryProcessor] 关联判断失败: {e}")

            raw_body = structured_result.get("body_content", "")
            if not raw_body:
                raw_body = structured_result.get("narrative_summary", "")

            temp_segments = []
            if raw_body:
                if len(raw_body) <= 5000:
                    temp_segments = [raw_body]
                else:
                    remaining = raw_body
                    while len(remaining) > 5000:
                        cut_pos = 5000
                        for i in range(min(5000, len(remaining) - 1), max(1, 5000 - 200), -1):
                            if remaining[i] in ["\n", "。", "；", ";", "!", "！", "?", "？"]:
                                cut_pos = i + 1
                                break
                        temp_segments.append(remaining[:cut_pos].strip())
                        remaining = remaining[cut_pos:].strip()
                    if remaining:
                        temp_segments.append(remaining)

            self._notify_status(
                "学习笔记整理完成",
                {"segment_count": len(temp_segments), "total_chars": len(raw_body)}
            )

            if target_session_id and target_session_id in self.memory_bank.sessions:
                for msg in messages:
                    self.memory_bank.add_message_to_session(
                        target_session_id,
                        msg["role"],
                        msg["content"]
                    )
                self.memory_bank.update_session(
                    target_session_id,
                    narrative_summary=structured_result.get("narrative_summary", ""),
                    body_content=raw_body,
                    body_segments=temp_segments,
                    title=structured_result.get("title", self.memory_bank.sessions[target_session_id].title),
                    topic=structured_result.get("topic", self.memory_bank.sessions[target_session_id].topic),
                    keywords=structured_result.get("keywords", []),
                    importance=structured_result.get("importance", 0.5)
                )
                for rel_id in related_ids:
                    if rel_id != target_session_id:
                        self.memory_bank.relate_sessions(target_session_id, rel_id)
            else:
                new_session = self.memory_bank.create_session(
                    title=structured_result.get("title", "新学习"),
                    topic=structured_result.get("topic", "")
                )
                for msg in messages:
                    self.memory_bank.add_message_to_session(
                        new_session.session_id,
                        msg["role"],
                        msg["content"]
                    )
                self.memory_bank.update_session(
                    new_session.session_id,
                    narrative_summary=structured_result.get("narrative_summary", ""),
                    body_content=raw_body,
                    body_segments=temp_segments,
                    keywords=structured_result.get("keywords", []),
                    importance=structured_result.get("importance", 0.5)
                )
                target_session_id = new_session.session_id
                for rel_id in related_ids:
                    if rel_id != target_session_id:
                        self.memory_bank.relate_sessions(target_session_id, rel_id)

            self._current_session_id = target_session_id

            result = ProcessingResult(
                success=True,
                session_id=target_session_id,
                action=action,
                title=structured_result.get("title", ""),
                topic=structured_result.get("topic", ""),
                keywords=structured_result.get("keywords", []),
                narrative_summary=structured_result.get("narrative_summary", ""),
                body_content=raw_body,
                body_segments=temp_segments,
                importance=structured_result.get("importance", 0.5),
                related_session_ids=related_ids
            )

            self._notify_status(
                f"学习记忆处理完成: {action}",
                {"title": result.title, "topic": result.topic}
            )
            self._notify_result(result)

        except Exception as e:
            print(f"[MemoryProcessor] 处理异常: {e}")
            import traceback
            traceback.print_exc()
            error_result = ProcessingResult(
                success=False,
                error_message=str(e)
            )
            self._notify_status(f"学习记忆处理失败: {e}", {})
            self._notify_result(error_result)

    def _format_conversation(self, messages: List[Dict]) -> str:
        lines = []
        for msg in messages:
            role_text = "用户" if msg["role"] == "user" else "AI助手"
            lines.append(f"{role_text}: {msg['content']}")
        return "\n\n".join(lines)

    def _summarize_with_llm(self, conversation_text: str) -> Dict:
        if not self.llm_client or not hasattr(self.llm_client, "chat"):
            return self._fallback_summarize(conversation_text)

        try:
            prompt = NARRATIVE_SUMMARIZE_PROMPT.format(conversation_text=conversation_text[:3000])
            messages_for_llm = [{"role": "user", "content": prompt}]

            raw_response = self.llm_client.chat(messages_for_llm)

            if not raw_response:
                return self._fallback_summarize(conversation_text)

            parsed = self._parse_json_response(raw_response)
            if parsed:
                return self._validate_structured_result(parsed)

            return self._fallback_summarize(conversation_text)

        except Exception as e:
            print(f"[MemoryProcessor] 大模型摘要调用失败: {e}")
            return self._fallback_summarize(conversation_text)

    def _check_relationship_with_llm(self, conversation_text: str, related_sessions: List) -> Dict:
        if not self.llm_client or not hasattr(self.llm_client, "chat"):
            if related_sessions and related_sessions[0][1] > 0.4:
                return {
                    "is_related": True,
                    "most_related_session_index": 0,
                    "relation_score": related_sessions[0][1],
                    "relation_reason": "关键词相似度较高",
                    "should_continue": True
                }
            return {
                "is_related": False,
                "most_related_session_index": -1,
                "relation_score": 0.0,
                "relation_reason": "无明显关联",
                "should_continue": False
            }

        try:
            existing_sessions_text = ""
            for idx, (session, score) in enumerate(related_sessions[:5]):
                created_str = time.strftime("%Y-%m-%d %H:%M", time.localtime(session.created_at))
                existing_sessions_text += f"""
学习记录 [{idx}]:
标题: {session.title}
主题: {session.topic}
关键词: {', '.join(session.keywords)}
摘要: {session.narrative_summary[:200]}
创建时间: {created_str}
关联分数: {score:.2f}
---
"""

            prompt = RELATION_CHECK_PROMPT.format(
                new_conversation=conversation_text[:2000],
                existing_sessions_text=existing_sessions_text
            )
            messages_for_llm = [{"role": "user", "content": prompt}]

            raw_response = self.llm_client.chat(messages_for_llm)
            if not raw_response:
                return {"is_related": False, "should_continue": False}

            parsed = self._parse_json_response(raw_response)
            if parsed:
                return parsed

            return {"is_related": False, "should_continue": False}

        except Exception as e:
            print(f"[MemoryProcessor] 关联判断调用失败: {e}")
            return {"is_related": False, "should_continue": False}

    def _parse_json_response(self, response: str) -> Optional[Dict]:
        if not response:
            return None

        try:
            return json.loads(response)
        except:
            pass

        try:
            start = response.find("{")
            end = response.rfind("}")
            if start != -1 and end != -1 and end > start:
                json_str = response[start:end + 1]
                return json.loads(json_str)
        except:
            pass

        try:
            cleaned = response.replace("```json", "").replace("```", "").strip()
            return json.loads(cleaned)
        except:
            pass

        return None

    def _validate_structured_result(self, result: Dict) -> Dict:
        validated = {
            "title": str(result.get("title", "新学习"))[:50],
            "topic": str(result.get("topic", ""))[:30],
            "keywords": [],
            "narrative_summary": str(result.get("narrative_summary", ""))[:1000],
            "body_content": str(result.get("body_content", "")),
            "importance": 0.5
        }

        keywords = result.get("keywords", [])
        if isinstance(keywords, list):
            validated["keywords"] = [str(k)[:20] for k in keywords[:10]]
        elif isinstance(keywords, str):
            validated["keywords"] = [k.strip() for k in keywords.split(",")[:10]]

        try:
            imp = result.get("importance", 0.5)
            validated["importance"] = max(0.0, min(1.0, float(imp)))
        except:
            validated["importance"] = 0.5

        return validated

    def _fallback_summarize(self, conversation_text: str) -> Dict:
        first_line = conversation_text.split("\n")[0] if conversation_text else ""
        title = first_line[:40] if len(first_line) > 1 else "学习记录"

        words = re.findall(r'[\w\u4e00-\u9fa5]{2,10}', conversation_text)
        from collections import Counter
        word_counts = Counter(words)
        keywords = [w for w, _ in word_counts.most_common(8) if len(w) >= 2]

        summary = f"本次学习共包含 {len(conversation_text.split('用户:')) - 1} 轮交互。主要内容涉及: {', '.join(keywords[:5])}。"

        body_lines = []
        body_lines.append("=" * 40)
        body_lines.append(f"学习主题：{title}")
        body_lines.append(f"学习时间：{time.strftime('%Y-%m-%d %H:%M:%S', time.localtime())}")
        body_lines.append(f"核心关键词：{ '、'.join(keywords) if keywords else '无' }")
        body_lines.append("=" * 40)
        body_lines.append("")
        body_lines.append("一、学习背景")
        body_lines.append("    本次学习围绕上述主题展开，记录学习内容与交流意见。")
        body_lines.append("")
        body_lines.append("二、学习要点及记录")
        for line in conversation_text.split("\n"):
            line = line.strip()
            if line:
                if line.startswith("用户"):
                    body_lines.append(f"    ■ 学习者提问：{line[3:].strip()}")
                elif line.startswith("AI"):
                    body_lines.append(f"    □ 讲解回复：{line[3:].strip()}")
                else:
                    body_lines.append(f"    {line}")
        body_lines.append("")
        body_lines.append("三、学习收获与建议")
        body_lines.append("    本次学习内容已完整记录，相关结论请参见上方学习要点。")
        body_lines.append("=" * 40)
        body_content = "\n".join(body_lines)

        return {
            "title": title,
            "topic": keywords[0] if keywords else "",
            "keywords": keywords,
            "narrative_summary": summary,
            "body_content": body_content,
            "importance": 0.5
        }

    def get_candidate_sessions_for_query(self, query_text: str, top_k: int = 5, min_threshold: float = 0.25) -> List[Session]:
        related = self.memory_bank.find_related_sessions(query_text, top_k=top_k, min_threshold=min_threshold)
        return [s for s, score in related]

    def build_context_from_sessions(self, session_ids: List[str], max_chars_per_session: int = 500) -> str:
        context_parts = []
        for sid in session_ids:
            session = self.memory_bank.get_session(sid)
            if not session:
                continue

            created_str = time.strftime("%Y-%m-%d %H:%M", time.localtime(session.created_at))
            msg_text = "\n".join([
                f"{'用户' if m.role == 'user' else 'AI'}: {m.content[:200]}"
                for m in session.messages[-10:]
            ])

            part = f"""
--- 相关学习记录: {session.title} ({created_str}) ---
主题: {session.topic}
关键词: {', '.join(session.keywords)}
摘要: {session.narrative_summary[:max_chars_per_session]}
最近对话:
{msg_text}
"""
            context_parts.append(part)

        return "\n".join(context_parts)


if __name__ == "__main__":
    print("=== MemoryProcessor v2.0 测试 ===")

    from memory_bank import MemoryBank

    mb = MemoryBank(user_id="test_user")
    processor = MemoryProcessor(memory_bank=mb)

    test_conv = "用户: 我想学习Python数据结构\n\nAI助手: 好的，Python的数据结构主要包括列表、字典、集合和元组。"
    result = processor._fallback_summarize(test_conv)
    print(f"本地摘要测试: {result}")

    processor.add_message_for_processing("user", "我想学习Python数据结构")
    processor.add_message_for_processing("assistant", "好的，Python的数据结构主要包括列表、字典、集合和元组。")

    print(f"\n当前会话ID: {processor._current_session_id}")
    print(f"缓冲区消息: {len(processor._message_buffer)}")
    print("\n✓ MemoryProcessor v2.0 基本功能测试完成")
