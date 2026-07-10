"""
MemoryBank v2.0 - 层次化大模型记忆存储系统
核心特性:
  1. Session（会话/会议）- 按主题组织的完整对话记录
  2. MemoryEntry（记忆条目）- 每个会话下的记忆片段
  3. 支持关联查询与续写机制
"""

import json
import os
import time
import uuid
import math
import re
from datetime import datetime
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum
from pathlib import Path


class MemoryType(Enum):
    EPISODIC = "episodic"
    SEMANTIC = "semantic"
    PROCEDURAL = "procedural"
    EMOTIONAL = "emotional"


@dataclass
class ConversationMessage:
    role: str
    content: str
    timestamp: float = field(default_factory=time.time)

    def to_dict(self) -> Dict:
        return {"role": self.role, "content": self.content, "timestamp": self.timestamp}

    @classmethod
    def from_dict(cls, data: Dict) -> "ConversationMessage":
        return cls(role=data.get("role", ""), content=data.get("content", ""), timestamp=data.get("timestamp", time.time()))


@dataclass
class Session:
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    title: str = ""
    created_at: float = field(default_factory=time.time)
    updated_at: float = field(default_factory=time.time)
    status: str = "active"
    narrative_summary: str = ""
    body_content: str = ""
    body_segments: List[str] = field(default_factory=list)
    messages: List[ConversationMessage] = field(default_factory=list)
    keywords: List[str] = field(default_factory=list)
    importance: float = 0.5
    strength: float = 1.0
    topic: str = ""
    related_session_ids: List[str] = field(default_factory=list)
    last_accessed: float = field(default_factory=time.time)
    access_count: int = 0
    is_forgotten: bool = False
    forget_reason: str = ""

    FORGET_HALF_LIFE_DAYS: float = 7.0
    MIN_STRENGTH_BEFORE_FORGET: float = 0.1

    def apply_decay(self):
        if self.is_forgotten:
            return

        now = time.time()
        days_since_access = (now - self.last_accessed) / (60 * 60 * 24)

        if days_since_access <= 0.01:
            return

        decay_speed = 2.0 - self.importance
        decay_factor = (0.5 ** (days_since_access / self.FORGET_HALF_LIFE_DAYS)) ** decay_speed

        access_bonus = min(0.2, self.access_count * 0.02)

        old_strength = self.strength
        self.strength = min(1.0, max(0.0, self.strength * decay_factor + access_bonus * (1 - decay_factor)))

        if self.strength < self.MIN_STRENGTH_BEFORE_FORGET and self.importance < 0.4:
            self.is_forgotten = True
            self.forget_reason = f"记忆自然衰减（强度 {self.strength:.3f} → 低于 {self.MIN_STRENGTH_BEFORE_FORGET}）"
            self.strength = 0.0

        self.last_accessed = now

    def on_access(self):
        self.access_count += 1
        self.last_accessed = time.time()
        if not self.is_forgotten:
            self.strength = min(1.0, self.strength + 0.03)
        else:
            self.is_forgotten = False
            self.forget_reason = ""
            self.strength = 0.3

    def is_active(self) -> bool:
        return not self.is_forgotten and self.status == "active"

    def split_body_if_needed(self, max_chars: int = 5000):
        if not self.body_content:
            self.body_segments = []
            return
        if len(self.body_content) <= max_chars:
            self.body_segments = [self.body_content]
            return
        segments = []
        remaining = self.body_content
        while len(remaining) > max_chars:
            cut_pos = max_chars
            for i in range(min(max_chars, len(remaining) - 1), max(1, max_chars - 200), -1):
                if remaining[i] in ["\n", "。", "；", ";", "!", "！", "?", "？"]:
                    cut_pos = i + 1
                    break
            segments.append(remaining[:cut_pos].strip())
            remaining = remaining[cut_pos:].strip()
        if remaining:
            segments.append(remaining)
        self.body_segments = segments

    def to_dict(self) -> Dict:
        return {
            "session_id": self.session_id,
            "title": self.title,
            "created_at": self.created_at,
            "updated_at": self.updated_at,
            "status": self.status,
            "narrative_summary": self.narrative_summary,
            "body_content": self.body_content,
            "body_segments": self.body_segments,
            "messages": [m.to_dict() for m in self.messages],
            "keywords": self.keywords,
            "importance": self.importance,
            "strength": self.strength,
            "topic": self.topic,
            "related_session_ids": self.related_session_ids,
            "last_accessed": self.last_accessed,
            "access_count": self.access_count,
            "is_forgotten": self.is_forgotten,
            "forget_reason": self.forget_reason
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "Session":
        messages = [ConversationMessage.from_dict(m) for m in data.get("messages", [])]
        session = cls(
            session_id=data.get("session_id", str(uuid.uuid4())),
            title=data.get("title", ""),
            created_at=data.get("created_at", time.time()),
            updated_at=data.get("updated_at", time.time()),
            status=data.get("status", "active"),
            narrative_summary=data.get("narrative_summary", ""),
            body_content=data.get("body_content", ""),
            body_segments=data.get("body_segments", []),
            messages=messages,
            keywords=data.get("keywords", []),
            importance=data.get("importance", 0.5),
            strength=data.get("strength", 1.0),
            topic=data.get("topic", ""),
            related_session_ids=data.get("related_session_ids", []),
            last_accessed=data.get("last_accessed", time.time()),
            access_count=data.get("access_count", 0),
            is_forgotten=data.get("is_forgotten", False),
            forget_reason=data.get("forget_reason", "")
        )
        if session.body_content and not session.body_segments:
            session.split_body_if_needed()
        return session

    def add_message(self, role: str, content: str):
        self.messages.append(ConversationMessage(role=role, content=content, timestamp=time.time()))
        self.updated_at = time.time()

    def update_strength(self):
        self.updated_at = time.time()
        self.strength = min(1.0, self.strength + 0.05)


@dataclass
class MemoryChunk:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    content: str = ""
    memory_type: MemoryType = MemoryType.EPISODIC
    importance: float = 0.5
    strength: float = 1.0
    embedding: Optional[List[float]] = None
    tags: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    timestamps: Dict[str, float] = field(default_factory=lambda: {"created_at": time.time(), "updated_at": time.time(), "accessed_at": time.time()})

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "content": self.content,
            "memory_type": self.memory_type.value,
            "importance": self.importance,
            "strength": self.strength,
            "embedding": self.embedding,
            "tags": self.tags,
            "metadata": self.metadata,
            "timestamps": self.timestamps
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "MemoryChunk":
        return cls(
            id=data.get("id", str(uuid.uuid4())),
            content=data.get("content", ""),
            memory_type=MemoryType(data.get("memory_type", "episodic")),
            importance=data.get("importance", 0.5),
            strength=data.get("strength", 1.0),
            embedding=data.get("embedding"),
            tags=data.get("tags", []),
            metadata=data.get("metadata", {}),
            timestamps=data.get("timestamps", {})
        )

    def update_access(self):
        self.timestamps["accessed_at"] = time.time()
        self.strength = min(1.0, self.strength + 0.1)


@dataclass
class MemoryPage:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    chunks: List[MemoryChunk] = field(default_factory=list)
    title: str = ""
    description: str = ""
    max_chunks: int = 100

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "chunks": [c.to_dict() for c in self.chunks],
            "title": self.title,
            "description": self.description,
            "max_chunks": self.max_chunks
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "MemoryPage":
        page = cls(
            id=data.get("id", str(uuid.uuid4())),
            title=data.get("title", ""),
            description=data.get("description", ""),
            max_chunks=data.get("max_chunks", 100)
        )
        page.chunks = [MemoryChunk.from_dict(c) for c in data.get("chunks", [])]
        return page

    def add_chunk(self, chunk: MemoryChunk) -> bool:
        if len(self.chunks) >= self.max_chunks:
            return False
        self.chunks.append(chunk)
        return True


@dataclass
class MemorySegment:
    id: str = field(default_factory=lambda: str(uuid.uuid4()))
    pages: List[MemoryPage] = field(default_factory=list)
    name: str = ""
    segment_type: str = "general"
    max_pages: int = 50

    def to_dict(self) -> Dict:
        return {
            "id": self.id,
            "pages": [p.to_dict() for p in self.pages],
            "name": self.name,
            "segment_type": self.segment_type,
            "max_pages": self.max_pages
        }

    @classmethod
    def from_dict(cls, data: Dict) -> "MemorySegment":
        segment = cls(
            id=data.get("id", str(uuid.uuid4())),
            name=data.get("name", ""),
            segment_type=data.get("segment_type", "general"),
            max_pages=data.get("max_pages", 50)
        )
        segment.pages = [MemoryPage.from_dict(p) for p in data.get("pages", [])]
        return segment

    def add_page(self, page: MemoryPage) -> bool:
        if len(self.pages) >= self.max_pages:
            return False
        self.pages.append(page)
        return True


class MemoryBank:

    def __init__(self, storage_path: str = "memory_store", user_id: str = "default"):
        self.storage_path = Path(storage_path)
        self.user_id = user_id
        self.sessions: Dict[str, Session] = {}
        self.segments: Dict[str, MemorySegment] = {}
        self.config: Dict[str, Any] = {}

        self.storage_path.mkdir(parents=True, exist_ok=True)
        (self.storage_path / "sessions").mkdir(exist_ok=True)
        (self.storage_path / "segments").mkdir(exist_ok=True)

        self._load_config()
        self._load_sessions()
        self._load_segments()

    def _load_config(self):
        config_file = self.storage_path / "config.json"
        if config_file.exists():
            with open(config_file, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
        else:
            self.config = {"user_id": self.user_id, "created_at": time.time()}
            self._save_config()

    def _save_config(self):
        with open(self.storage_path / "config.json", 'w', encoding='utf-8') as f:
            json.dump(self.config, f, indent=2, ensure_ascii=False)

    def _load_sessions(self):
        sessions_dir = self.storage_path / "sessions"
        for sess_file in sessions_dir.glob("*.json"):
            try:
                with open(sess_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                session = Session.from_dict(data)
                session.apply_decay()
                self.sessions[session.session_id] = session
                if session.strength < 1.0 or session.is_forgotten:
                    self._save_session(session)
            except Exception as e:
                print(f"加载会话失败 {sess_file}: {e}")

    def _save_session(self, session: Session):
        sess_file = self.storage_path / "sessions" / f"{session.session_id}.json"
        with open(sess_file, 'w', encoding='utf-8') as f:
            json.dump(session.to_dict(), f, indent=2, ensure_ascii=False)

    def _delete_session_file(self, session_id: str):
        sess_file = self.storage_path / "sessions" / f"{session_id}.json"
        if sess_file.exists():
            sess_file.unlink()

    def _load_segments(self):
        segments_dir = self.storage_path / "segments"
        for seg_file in segments_dir.glob("*.json"):
            try:
                with open(seg_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                segment = MemorySegment.from_dict(data)
                self.segments[segment.id] = segment
            except Exception as e:
                print(f"加载分段失败 {seg_file}: {e}")

    def _save_segment(self, segment: MemorySegment):
        seg_file = self.storage_path / "segments" / f"{segment.id}.json"
        with open(seg_file, 'w', encoding='utf-8') as f:
            json.dump(segment.to_dict(), f, indent=2, ensure_ascii=False)

    def create_session(self, title: str, topic: str = "") -> Session:
        session = Session(title=title, topic=topic)
        self.sessions[session.session_id] = session
        self._save_session(session)
        return session

    def get_active_session(self) -> Optional[Session]:
        active = [s for s in self.sessions.values() if s.status == "active" and not s.is_forgotten]
        if not active:
            return None
        active.sort(key=lambda s: s.updated_at, reverse=True)
        for s in active[:3]:
            s.on_access()
            self._save_session(s)
        return active[0]

    def get_or_create_active_session(self, title: str = "默认对话") -> Session:
        session = self.get_active_session()
        if session:
            return session
        return self.create_session(title=title)

    def close_session(self, session_id: str):
        if session_id in self.sessions:
            self.sessions[session_id].status = "closed"
            self._save_session(self.sessions[session_id])

    def add_message_to_session(self, session_id: str, role: str, content: str):
        if session_id in self.sessions:
            self.sessions[session_id].add_message(role, content)
            self._save_session(self.sessions[session_id])

    def update_session(self, session_id: str, **kwargs):
        if session_id in self.sessions:
            session = self.sessions[session_id]
            for key, value in kwargs.items():
                if hasattr(session, key):
                    setattr(session, key, value)
            session.updated_at = time.time()
            self._save_session(session)

    def get_session(self, session_id: str) -> Optional[Session]:
        session = self.sessions.get(session_id)
        if session:
            session.on_access()
            self._save_session(session)
        return session

    def get_all_sessions(self) -> List[Session]:
        sessions_list = list(self.sessions.values())
        sessions_list.sort(key=lambda s: s.created_at, reverse=True)
        return sessions_list

    def get_active_sessions(self) -> List[Session]:
        active = [s for s in self.sessions.values() if not s.is_forgotten]
        active.sort(key=lambda s: s.updated_at, reverse=True)
        return active

    def get_forgotten_sessions(self) -> List[Session]:
        return [s for s in self.sessions.values() if s.is_forgotten]

    def apply_decay_to_all(self):
        for session in self.sessions.values():
            old_strength = session.strength
            old_forgot = session.is_forgotten
            session.apply_decay()
            if session.strength != old_strength or session.is_forgotten != old_forgot:
                self._save_session(session)

    def get_recent_sessions_for_recall(self, top_k: int = 5, max_days: int = 30) -> List[Session]:
        now = time.time()
        max_age_seconds = max_days * 24 * 60 * 60

        candidates = []
        for session in self.sessions.values():
            if session.is_forgotten:
                continue
            age = now - session.updated_at
            if age > max_age_seconds:
                continue
            if not session.narrative_summary and len(session.messages) == 0:
                continue
            time_factor = max(0.2, 1.0 - (age / max_age_seconds))
            overall_score = session.strength * session.importance * time_factor
            candidates.append((session, overall_score))

        candidates.sort(key=lambda x: x[1], reverse=True)
        return [s for s, _ in candidates[:top_k]]

    def restore_forgotten_session(self, session_id: str):
        if session_id in self.sessions:
            session = self.sessions[session_id]
            if session.is_forgotten:
                session.is_forgotten = False
                session.forget_reason = ""
                session.strength = 0.3
                session.last_accessed = time.time()
                self._save_session(session)

    def delete_session(self, session_id: str) -> bool:
        if session_id not in self.sessions:
            return False
        del self.sessions[session_id]
        self._delete_session_file(session_id)
        return True

    def cleanup_forgotten_sessions(self, max_days_forgotten: int = 30) -> int:
        now = time.time()
        to_delete = []
        for session in self.sessions.values():
            if session.is_forgotten:
                last_update_age = now - session.updated_at
                if last_update_age > max_days_forgotten * 24 * 60 * 60:
                    to_delete.append(session.session_id)

        for sid in to_delete:
            del self.sessions[sid]
            self._delete_session_file(sid)

        return len(to_delete)

    def find_related_sessions(self, content: str, top_k: int = 5, min_threshold: float = 0.3) -> List[Tuple[Session, float]]:
        if not content or not self.sessions:
            return []

        content_lower = content.lower()
        content_words = set(re.findall(r'[\w\u4e00-\u9fa5]+', content_lower))

        results = []
        for session in self.sessions.values():
            if session.is_forgotten:
                continue

            score = 0.0

            session_text = f"{session.title} {session.narrative_summary} {' '.join(session.keywords)} {' '.join(session.keywords or [])}"
            session_lower = session_text.lower()
            session_words = set(re.findall(r'[\w\u4e00-\u9fa5]+', session_lower))

            if content_words and session_words:
                overlap = len(content_words & session_words) / max(len(content_words), 1)
                score += overlap * 0.4

            if session.topic and session.topic.lower() in content_lower:
                score += 0.3

            if session.title and any(word in content_lower for word in session.title.lower().split()):
                score += 0.2

            for msg in session.messages[-10:]:
                if any(word in msg.content.lower() for word in content_words):
                    score += 0.1
                    break

            score *= session.importance * max(0.1, session.strength)

            if score >= min_threshold:
                results.append((session, score))

        results.sort(key=lambda x: x[1], reverse=True)
        top_results = results[:top_k]
        for session, _ in top_results:
            session.on_access()
            self._save_session(session)
        return top_results

    def relate_sessions(self, session_id_1: str, session_id_2: str):
        if session_id_1 in self.sessions and session_id_2 in self.sessions:
            s1 = self.sessions[session_id_1]
            s2 = self.sessions[session_id_2]

            if session_id_2 not in s1.related_session_ids:
                s1.related_session_ids.append(session_id_2)
            if session_id_1 not in s2.related_session_ids:
                s2.related_session_ids.append(session_id_1)

            self._save_session(s1)
            self._save_session(s2)

    def add_memory(self, content: str, memory_type: MemoryType = MemoryType.EPISODIC,
                   importance: float = 0.5, tags: List[str] = None,
                   segment_type: str = "general") -> MemoryChunk:
        segment = None
        for seg in self.segments.values():
            if seg.segment_type == segment_type:
                segment = seg
                break
        if not segment:
            segment = MemorySegment(name=f"{segment_type}_segment", segment_type=segment_type)
            self.segments[segment.id] = segment

        if not segment.pages or all(len(p.chunks) >= p.max_chunks for p in segment.pages):
            page = MemoryPage(title=f"Page_{len(segment.pages) + 1}")
            segment.add_page(page)

        for page in segment.pages:
            if len(page.chunks) < page.max_chunks:
                chunk = MemoryChunk(
                    content=content,
                    memory_type=memory_type,
                    importance=importance,
                    tags=tags or []
                )
                if page.add_chunk(chunk):
                    self._save_segment(segment)
                    return chunk
        raise Exception("No space in any page")

    def retrieve_memories(self, query: str = None, top_k: int = 5,
                          min_importance: float = 0.0) -> List[MemoryChunk]:
        candidates = []
        for segment in self.segments.values():
            for page in segment.pages:
                for chunk in page.chunks:
                    if chunk.importance < min_importance:
                        continue
                    score = chunk.strength * 0.4 + chunk.importance * 0.4
                    candidates.append((chunk, score))
        candidates.sort(key=lambda x: x[1], reverse=True)
        result_chunks = []
        for chunk, _ in candidates[:top_k]:
            chunk.update_access()
            result_chunks.append(chunk)
        return result_chunks

    def get_user_profile(self) -> Dict:
        profile_segment = None
        for seg in self.segments.values():
            if seg.segment_type == "user_profile":
                profile_segment = seg
                break
        if not profile_segment or not profile_segment.pages:
            return {}
        for page in profile_segment.pages:
            for chunk in page.chunks:
                if "user_profile" in chunk.tags:
                    try:
                        return json.loads(chunk.content)
                    except:
                        pass
        return {}

    def update_user_profile(self, profile_data: Dict):
        profile_segment = None
        for seg in self.segments.values():
            if seg.segment_type == "user_profile":
                profile_segment = seg
                break
        if not profile_segment:
            profile_segment = MemorySegment(name="user_profile_segment", segment_type="user_profile")
            self.segments[profile_segment.id] = profile_segment

        if not profile_segment.pages:
            profile_segment.add_page(MemoryPage(title="User_Profile"))

        profile_chunk = MemoryChunk(
            content=json.dumps(profile_data, ensure_ascii=False),
            memory_type=MemoryType.SEMANTIC,
            importance=0.9,
            tags=["user_profile"]
        )
        profile_segment.pages[0].chunks = [profile_chunk]
        self._save_segment(profile_segment)

    def cleanup_weak_memories(self, threshold: float = 0.1) -> int:
        cleaned = 0
        for segment in list(self.segments.values()):
            for page in list(segment.pages):
                for chunk in list(page.chunks):
                    if chunk.strength < threshold and chunk.importance < 0.3:
                        page.chunks.remove(chunk)
                        cleaned += 1
                if not page.chunks and page.title != "User_Profile":
                    segment.pages.remove(page)
            if not segment.pages and segment.segment_type != "user_profile":
                del self.segments[segment.id]
                seg_file = self.storage_path / "segments" / f"{segment.id}.json"
                if seg_file.exists():
                    seg_file.unlink()
        if cleaned > 0:
            for segment in self.segments.values():
                self._save_segment(segment)
        return cleaned

    def export_memories(self, output_path: str):
        export_data = {
            "user_id": self.user_id,
            "exported_at": time.time(),
            "sessions": [s.to_dict() for s in self.sessions.values()],
            "segments": [s.to_dict() for s in self.segments.values()]
        }
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(export_data, f, indent=2, ensure_ascii=False)

    def compute_session_time_factor(self, session: Session, now: Optional[float] = None,
                                    max_days: float = 30.0) -> float:
        if now is None:
            now = time.time()
        age = now - session.updated_at
        max_age_seconds = max_days * 24 * 3600
        return max(0.2, 1.0 - (age / max_age_seconds))

    def compute_session_overall_score(self, session: Session, now: Optional[float] = None,
                                      max_days: float = 30.0) -> float:
        if session.is_forgotten:
            return 0.0
        time_factor = self.compute_session_time_factor(session, now=now, max_days=max_days)
        return session.strength * session.importance * time_factor

    def simulate_decay_curve(self, session: Session, days: int = 30,
                             half_life_days: float = 7.0) -> List[Dict[str, float]]:
        original = {
            "strength": session.strength,
            "importance": session.importance,
            "last_accessed": session.last_accessed,
            "is_forgotten": session.is_forgotten,
        }
        results = []
        temp_strength = session.strength
        temp_last = session.last_accessed
        base = time.time()

        for d in range(days + 1):
            if d == 0:
                results.append({"day": 0, "strength": round(temp_strength, 4),
                                "is_forgotten": session.is_forgotten})
                continue
            delta_s = 24 * 3600
            days_since_access = (base + d * 24 * 3600 - temp_last) / (24 * 3600)
            decay_speed = 2.0 - session.importance
            decay_factor = (0.5 ** (days_since_access / half_life_days)) ** decay_speed
            access_bonus = min(0.2, 0.0)
            new_strength = min(1.0, max(0.0, temp_strength * decay_factor + access_bonus * (1 - decay_factor)))
            temp_strength = new_strength
            forgotten = (temp_strength < session.MIN_STRENGTH_BEFORE_FORGET and session.importance < 0.4)
            results.append({"day": d, "strength": round(temp_strength, 4),
                            "is_forgotten": forgotten})

        return results

    def param_sensitivity_analysis(self, half_life_options: Optional[List[float]] = None,
                                   top_k: int = 5) -> Dict[str, Any]:
        if half_life_options is None:
            half_life_options = [3.0, 7.0, 14.0, 21.0]
        now = time.time()

        analysis = {}
        for hl in half_life_options:
            scored = []
            forgotten_count = 0
            for s in self.sessions.values():
                age_days = (now - s.last_accessed) / (24 * 3600)
                decay_speed = 2.0 - s.importance
                factor = (0.5 ** (age_days / hl)) ** decay_speed
                virtual_strength = min(1.0, s.strength * factor)
                is_forgotten_virtual = (virtual_strength < s.MIN_STRENGTH_BEFORE_FORGET
                                        and s.importance < 0.4)
                if is_forgotten_virtual:
                    forgotten_count += 1
                    continue
                time_factor = self.compute_session_time_factor(s, now=now)
                score = virtual_strength * s.importance * time_factor
                scored.append((s, score))
            scored.sort(key=lambda x: x[1], reverse=True)
            top = scored[:top_k]
            est_tokens = 0
            for s, _ in top:
                if s.narrative_summary:
                    est_tokens += int(len(s.narrative_summary) / 1.5)
                else:
                    est_tokens += 120
            analysis[f"T_half_{hl}d"] = {
                "half_life_days": hl,
                "recalled_count": len(top),
                "estimated_tokens": est_tokens,
                "forgotten_count": forgotten_count,
                "top_scores": [round(sc, 4) for _, sc in top],
            }
        return analysis

    def get_detailed_stats(self) -> Dict[str, Any]:
        basic = self.get_stats()
        now = time.time()

        importance_bins = {"low(<0.3)": 0, "mid(0.3-0.7)": 0, "high(>0.7)": 0}
        strength_bins = {"weak(<0.3)": 0, "mid(0.3-0.7)": 0, "strong(>0.7)": 0}
        forgotten_count = 0
        total_kw_count = 0
        total_summary_chars = 0
        total_body_chars = 0
        topic_counts: Dict[str, int] = {}

        for s in self.sessions.values():
            if s.importance < 0.3:
                importance_bins["low(<0.3)"] += 1
            elif s.importance <= 0.7:
                importance_bins["mid(0.3-0.7)"] += 1
            else:
                importance_bins["high(>0.7)"] += 1
            if s.strength < 0.3:
                strength_bins["weak(<0.3)"] += 1
            elif s.strength <= 0.7:
                strength_bins["mid(0.3-0.7)"] += 1
            else:
                strength_bins["strong(>0.7)"] += 1
            if s.is_forgotten:
                forgotten_count += 1
            total_kw_count += len(s.keywords)
            total_summary_chars += len(s.narrative_summary or "")
            total_body_chars += len(s.body_content or "")
            topic = (s.topic or "未分类").strip() or "未分类"
            topic_counts[topic] = topic_counts.get(topic, 0) + 1

        month_distribution: Dict[str, int] = {}
        for s in self.sessions.values():
            month_key = time.strftime("%Y-%m", time.localtime(s.created_at))
            month_distribution[month_key] = month_distribution.get(month_key, 0) + 1

        return {
            **basic,
            "forgotten_count": forgotten_count,
            "active_count": basic.get("session_count", 0) - forgotten_count,
            "importance_distribution": importance_bins,
            "strength_distribution": strength_bins,
            "avg_keywords_per_session": round(total_kw_count / max(1, basic["session_count"]), 2),
            "avg_summary_chars": round(total_summary_chars / max(1, basic["session_count"]), 2),
            "avg_body_chars": round(total_body_chars / max(1, basic["session_count"]), 2),
            "topic_distribution": dict(sorted(topic_counts.items(), key=lambda x: -x[1])[:20]),
            "month_distribution": dict(sorted(month_distribution.items())),
            "analysis_time": now,
        }

    def get_stats(self) -> Dict:
        session_count = len(self.sessions)
        active_session_count = sum(1 for s in self.sessions.values() if s.status == "active")
        total_messages = sum(len(s.messages) for s in self.sessions.values())
        total_chunks = sum(
            len(page.chunks)
            for segment in self.segments.values()
            for page in segment.pages
        )
        return {
            "session_count": session_count,
            "active_session_count": active_session_count,
            "total_messages": total_messages,
            "total_chunks": total_chunks,
            "segment_count": len(self.segments)
        }

    def export_experiment_data(self, output_dir: str, label: str = "experiment") -> Dict[str, str]:
        import os
        import csv

        os.makedirs(output_dir, exist_ok=True)
        files: Dict[str, str] = {}

        csv_path = os.path.join(output_dir, f"{label}_sessions.csv")
        files["sessions_csv"] = csv_path
        headers = [
            "session_id", "title", "topic", "created_at", "updated_at",
            "status", "importance", "strength", "is_forgotten",
            "message_count", "keyword_count", "keywords",
            "last_accessed", "access_count",
        ]
        with open(csv_path, "w", encoding="utf-8-sig", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(headers)
            for s in self.sessions.values():
                writer.writerow([
                    s.session_id,
                    s.title or "",
                    s.topic or "",
                    time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(s.created_at)),
                    time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(s.updated_at)),
                    s.status,
                    s.importance,
                    s.strength,
                    int(s.is_forgotten),
                    len(s.messages),
                    len(s.keywords),
                    ",".join(s.keywords),
                    time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(s.last_accessed)),
                    s.access_count,
                ])

        raw_path = os.path.join(output_dir, f"{label}_sessions_raw.json")
        files["sessions_json"] = raw_path
        with open(raw_path, "w", encoding="utf-8") as f:
            json.dump([s.to_dict() for s in self.sessions.values()], f, ensure_ascii=False, indent=2)

        stats_path = os.path.join(output_dir, f"{label}_stats.json")
        files["stats_json"] = stats_path
        with open(stats_path, "w", encoding="utf-8") as f:
            json.dump(self.get_detailed_stats(), f, ensure_ascii=False, indent=2)

        sens_path = os.path.join(output_dir, f"{label}_sensitivity.json")
        files["sensitivity_json"] = sens_path
        with open(sens_path, "w", encoding="utf-8") as f:
            json.dump(self.param_sensitivity_analysis(), f, ensure_ascii=False, indent=2)

        curves_path = os.path.join(output_dir, f"{label}_decay_curves.json")
        files["decay_curves_json"] = curves_path
        curves = {}
        for s in self.sessions.values():
            curves[s.session_id] = {
                "title": s.title,
                "importance": s.importance,
                "initial_strength": s.strength,
                "curve_30d": self.simulate_decay_curve(s, days=30),
            }
        with open(curves_path, "w", encoding="utf-8") as f:
            json.dump(curves, f, ensure_ascii=False, indent=2)

        return files


if __name__ == "__main__":
    print("=== MemoryBank v2.0 测试 ===")
    mb = MemoryBank(user_id="test_user")
    print(f"初始化完成: {mb.get_stats()}")

    session1 = mb.create_session(title="产品需求讨论", topic="产品设计")
    mb.add_message_to_session(session1.session_id, "user", "我想设计一个新的产品")
    mb.add_message_to_session(session1.session_id, "assistant", "好的，请问您的产品主要功能是什么？")

    mb.update_session(
        session1.session_id,
        narrative_summary="本次对话讨论了新产品的设计方向。用户表达了对新产品的初步想法，AI助手引导用户进一步明确产品核心功能。",
        keywords=["产品", "设计", "新产品"],
        importance=0.7
    )

    related = mb.find_related_sessions("产品设计方案", top_k=3)
    print(f"\n找到 {len(related)} 条相关会话")

    stats = mb.get_stats()
    print(f"\n统计: {stats}")
    print("\n✓ MemoryBank v2.0 基本功能测试完成")
