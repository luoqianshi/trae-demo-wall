from __future__ import annotations

import asyncio
import contextlib
import re
from collections import deque
from dataclasses import dataclass, field
from time import time
from typing import Any

from config import Settings
from modules.deepseek_client import DeepSeekClient
from modules.tencent_realtime_asr import TencentRealtimeAsrSession


DRAFT_WORKER_COUNT = 5
FINAL_WORKER_COUNT = 2
MAX_RECENT_SENTENCES = 6
MAX_PENDING_DRAFT_SENTENCES = 24
ASCII_FRAGMENT_PATTERN = re.compile(r"^[\"'`’.-]*[a-z]{1,3}[\"'`’.-]*$")


def _timestamp() -> int:
    return int(time() * 1000)


@dataclass(slots=True)
class SentenceContext:
    sentence_id: str
    sentence_index: int
    source_text: str = ""
    source_final: str = ""
    draft_translation: str = ""
    final_translation: str = ""
    source_revision: int = 0
    translation_revision: int = 0
    is_final: bool = False
    last_draft_request_text: str = ""
    last_final_request_text: str = ""
    last_draft_request_at: float = 0.0
    first_seen_at: int = 0
    last_updated_at: int = 0
    finalized_at: int = 0


@dataclass(slots=True)
class SourceEvent:
    session_token: int
    sentence_id: str
    text: str
    is_final: bool
    slice_type: int | None = None
    fallback_text: str | None = None


@dataclass(slots=True)
class TranslationJob:
    session_token: int
    sentence_id: str
    revision: int
    final_pass: bool
    fallback_text: str | None = None


@dataclass(slots=True)
class RealtimeSegment:
    raw_sentence_id: str
    text: str = ""
    is_final: bool = False
    start_time: int = 0
    end_time: int = 0


@dataclass(slots=True)
class MockTranslationPipeline:
    settings: Settings
    state: str = "idle"
    source_lang: str = "en"
    target_lang: str = "zh"
    tts_enabled: bool = False
    record_enabled: bool = False
    glossary: list[str] = field(default_factory=list)
    scene_template_id: str = "classroom"
    _queue: asyncio.Queue[dict[str, Any]] = field(default_factory=asyncio.Queue)
    _producer_task: asyncio.Task[None] | None = None
    _translator: DeepSeekClient | None = None
    _realtime_session: TencentRealtimeAsrSession | None = None
    _sentence_index: int = 0
    _sentence_numbers: dict[str, int] = field(default_factory=dict)
    _sentence_contexts: dict[str, SentenceContext] = field(default_factory=dict)
    _recent_sentence_ids: deque[str] = field(
        default_factory=lambda: deque(maxlen=MAX_RECENT_SENTENCES)
    )
    _source_queue: asyncio.Queue[SourceEvent] = field(default_factory=asyncio.Queue)
    _draft_queue: asyncio.Queue[str] = field(default_factory=asyncio.Queue)
    _final_queue: asyncio.Queue[str] = field(default_factory=asyncio.Queue)
    _source_worker_task: asyncio.Task[None] | None = None
    _draft_worker_tasks: list[asyncio.Task[None]] = field(default_factory=list)
    _final_worker_tasks: list[asyncio.Task[None]] = field(default_factory=list)
    _pending_draft_jobs: dict[str, TranslationJob] = field(default_factory=dict)
    _pending_final_jobs: dict[str, TranslationJob] = field(default_factory=dict)
    _draft_ready_sentences: set[str] = field(default_factory=set)
    _final_ready_sentences: set[str] = field(default_factory=set)
    _draft_inflight_sentences: set[str] = field(default_factory=set)
    _final_inflight_sentences: set[str] = field(default_factory=set)
    _realtime_sentence_serial: int = 0
    _active_realtime_sentence_id: str | None = None
    _active_realtime_segments: list[RealtimeSegment] = field(default_factory=list)
    _active_realtime_flush_task: asyncio.Task[None] | None = None
    _active_preview_task: asyncio.Task[None] | None = None
    _last_preview_request_text: str = ""
    _last_preview_request_at: float = 0.0
    _preview_revision: int = 0
    _line_index: int = 0
    _session_token: int = 0

    def _ensure_timestamps(self, context: SentenceContext) -> int:
        now = _timestamp()
        if not context.first_seen_at:
            context.first_seen_at = now
        context.last_updated_at = now
        if context.is_final:
            context.finalized_at = now
        return now

    def _count_glossary_hits(self, context: SentenceContext) -> int:
        text = " ".join(
            [
                context.source_text,
                context.source_final,
                context.draft_translation,
                context.final_translation,
            ]
        )
        return sum(1 for item in self.glossary if item and item in text)

    def _build_confidence(self, context: SentenceContext) -> dict[str, Any]:
        score = 100
        factors: list[str] = []
        settle_delay_ms = (
            max(0, context.finalized_at - context.first_seen_at)
            if context.first_seen_at and context.finalized_at
            else 0
        )
        high_volatility = (
            context.translation_revision >= 3
            or context.source_revision >= 4
            or settle_delay_ms >= 5000
        )

        if not context.final_translation:
            score -= 38
            factors.append("未完成定稿")

        if context.translation_revision >= 3:
            score -= 18
            factors.append("翻译修订较多")
        elif context.translation_revision >= 2:
            score -= 10
            factors.append("发生过明显修订")

        if context.source_revision >= 4:
            score -= 14
            factors.append("源语波动明显")

        if settle_delay_ms >= 6000:
            score -= 18
            factors.append("定稿时延较长")
        elif settle_delay_ms >= 3000:
            score -= 10
            factors.append("定稿时延偏长")

        if high_volatility:
            score -= 12
            factors.append("命中高波动规则")

        glossary_hits = self._count_glossary_hits(context)
        if glossary_hits > 0:
            score += min(8, glossary_hits * 2)
            factors.append(f"术语命中 {glossary_hits}")

        normalized = max(0, min(100, round(score)))
        level = (
            "高可信"
            if normalized >= 85
            else "可引用"
            if normalized >= 70
            else "需确认"
            if normalized >= 50
            else "高风险"
        )
        return {
            "confidenceScore": normalized,
            "confidenceLevel": level,
            "confidenceFactors": factors,
            "highVolatility": high_volatility,
            "settleDelayMs": settle_delay_ms or None,
        }

    @staticmethod
    def _extract_term_candidates(
        source_text: str,
        target_text: str,
    ) -> list[dict[str, str]]:
        source_tokens = [token.strip(" ,.;:!?()[]{}") for token in source_text.split()]
        target_tokens = [token.strip(" ,.;:!?()[]{}") for token in target_text.split()]
        pairs: list[dict[str, str]] = []
        for source_token, target_token in zip(source_tokens, target_tokens):
            if len(source_token) < 3 or len(target_token) < 2:
                continue
            if not any(char.isupper() for char in source_token) and not any(
                char.isdigit() for char in source_token
            ):
                continue
            pairs.append({"source": source_token, "target": target_token})
        return pairs[:4]

    async def bootstrap(self) -> None:
        self.refresh_translator()
        self._ensure_workers()
        await self._queue.put(self._status_event())

    async def shutdown(self) -> None:
        self.state = "stopped"
        if self._producer_task:
            self._producer_task.cancel()
            with contextlib.suppress(asyncio.CancelledError):
                await self._producer_task
            self._producer_task = None

        await self.close_realtime_session(abort=True)
        if self._translator:
            await self._translator.close()
        await self._cancel_worker_tasks()

    async def apply_command(self, payload: dict[str, Any]) -> None:
        action = payload.get("action")
        source_lang = payload.get("sourceLang", self.source_lang)
        target_lang = payload.get("targetLang", self.target_lang)

        if action != "stop" and not self._is_supported_pair(source_lang, target_lang):
            await self._queue.put(
                {
                    "type": "error",
                    "message": f"暂不支持 {source_lang} -> {target_lang} 的互译组合。",
                    "timestamp": _timestamp(),
                }
            )
            return

        if action == "start":
            self.source_lang = source_lang
            self.target_lang = target_lang
            self.record_enabled = bool(payload.get("recordEnabled", self.record_enabled))
            self.tts_enabled = bool(payload.get("ttsEnabled", self.tts_enabled))
            self.glossary = [
                str(item).strip()
                for item in payload.get("glossary", self.glossary)
                if str(item).strip()
            ]
            self.scene_template_id = str(
                payload.get("sceneTemplateId", self.scene_template_id)
            )
            if bool(payload.get("useMock", False)):
                self._begin_new_session()
            self.state = "listening"
            await self._queue.put(self._status_event("listening"))
            if bool(payload.get("useMock", False)):
                self._ensure_producer()
            return

        if action == "pause":
            self.state = "paused"
            await self._queue.put(self._status_event("paused"))
            return

        if action == "stop":
            await self.close_realtime_session(abort=False)
            self.state = "stopped"
            await self._queue.put(self._status_event("stopped"))
            return

        if action == "config":
            self.source_lang = source_lang
            self.target_lang = target_lang
            self.tts_enabled = bool(payload.get("ttsEnabled", self.tts_enabled))
            self.record_enabled = bool(payload.get("recordEnabled", self.record_enabled))
            self.glossary = [
                str(item).strip()
                for item in payload.get("glossary", self.glossary)
                if str(item).strip()
            ]
            self.scene_template_id = str(
                payload.get("sceneTemplateId", self.scene_template_id)
            )
            await self._queue.put(
                {
                    "type": "status",
                    "state": self.state,
                    "sourceLang": self.source_lang,
                    "targetLang": self.target_lang,
                    "ttsEnabled": self.tts_enabled,
                    "recordEnabled": self.record_enabled,
                    "glossary": self.glossary,
                    "sceneTemplateId": self.scene_template_id,
                    "timestamp": _timestamp(),
                    "message": "配置已更新",
                }
            )
            return

        if action == "speech":
            source_text = str(payload.get("sourceText", "")).strip()
            if not source_text:
                return
            sentence_id = str(payload.get("sentenceId", f"manual:{self._sentence_index}"))
            await self._enqueue_source_event(
                SourceEvent(
                    session_token=self._session_token,
                    sentence_id=sentence_id,
                    text=source_text,
                    is_final=bool(payload.get("isFinal", False)),
                )
            )
            return

        await self._queue.put(
            {
                "type": "error",
                "message": f"Unsupported action: {action!r}",
                "timestamp": _timestamp(),
            }
        )

    async def open_realtime_session(self) -> None:
        await self.close_realtime_session(abort=True)
        self._begin_new_session()
        self._realtime_session = TencentRealtimeAsrSession(
            app_id=self.settings.tencent_app_id,
            secret_id=self.settings.tencent_secret_id,
            secret_key=self.settings.tencent_secret_key,
            source_lang=self.source_lang,
            on_result=self._handle_realtime_result,
            on_error=self._handle_realtime_error,
        )
        await self._realtime_session.start()
        self.state = "listening"
        await self._queue.put(
            {
                **self._status_event("listening"),
                "voiceId": self._realtime_session.voice_id,
            }
        )

    async def push_realtime_audio(self, audio_bytes: bytes) -> bool:
        if not self._realtime_session:
            if self.state in {"idle", "paused", "stopped"}:
                return False
            raise RuntimeError("Realtime ASR session is not ready")
        try:
            await self._realtime_session.send_audio(audio_bytes)
        except RuntimeError:
            if self.state in {"idle", "paused", "stopped"}:
                return False
            raise
        return True

    async def close_realtime_session(self, abort: bool = False) -> None:
        session = self._realtime_session
        self._realtime_session = None
        if not session:
            return
        if abort:
            await session.abort()
            self._reset_realtime_aggregation()
        else:
            await session.finish()
            await self._flush_active_realtime_sentence()

    async def next_event(self) -> dict[str, Any]:
        return await self._queue.get()

    def snapshot_status(self) -> dict[str, Any]:
        return self._status_event()

    def refresh_translator(self) -> None:
        self._translator = DeepSeekClient(
            api_key=self.settings.deepseek_api_key,
            base_url=self.settings.deepseek_base_url,
            model=self.settings.deepseek_model,
            timeout=self.settings.deepseek_timeout,
        )

    def _ensure_workers(self) -> None:
        if not self._source_worker_task or self._source_worker_task.done():
            self._source_worker_task = asyncio.create_task(self._source_worker_loop())

        self._draft_worker_tasks = [
            task for task in self._draft_worker_tasks if not task.done()
        ]
        while len(self._draft_worker_tasks) < DRAFT_WORKER_COUNT:
            worker_id = len(self._draft_worker_tasks) + 1
            self._draft_worker_tasks.append(
                asyncio.create_task(
                    self._translation_worker_loop(
                        final_pass=False,
                        worker_name=f"draft-{worker_id}",
                    )
                )
            )

        self._final_worker_tasks = [
            task for task in self._final_worker_tasks if not task.done()
        ]
        while len(self._final_worker_tasks) < FINAL_WORKER_COUNT:
            worker_id = len(self._final_worker_tasks) + 1
            self._final_worker_tasks.append(
                asyncio.create_task(
                    self._translation_worker_loop(
                        final_pass=True,
                        worker_name=f"final-{worker_id}",
                    )
                )
            )

    async def _cancel_worker_tasks(self) -> None:
        tasks = [
            task
            for task in [
                self._source_worker_task,
                *self._draft_worker_tasks,
                *self._final_worker_tasks,
            ]
            if task
        ]
        for task in tasks:
            task.cancel()
        for task in tasks:
            with contextlib.suppress(asyncio.CancelledError):
                await task

        self._source_worker_task = None
        self._draft_worker_tasks.clear()
        self._final_worker_tasks.clear()

    def _ensure_producer(self) -> None:
        if self._producer_task and not self._producer_task.done():
            return
        self._producer_task = asyncio.create_task(self._produce_mock_messages())

    async def _produce_mock_messages(self) -> None:
        while True:
            if self.state not in {"listening", "processing"}:
                await asyncio.sleep(0.1)
                continue

            scripts = self.settings.mock_scripts[self._pair_key(self.source_lang, self.target_lang)]
            script_item = scripts[self._line_index % len(scripts)]
            sentence_id = f"mock:{self._sentence_index}"
            await self._enqueue_source_event(
                SourceEvent(
                    session_token=self._session_token,
                    sentence_id=sentence_id,
                    text=script_item["source"],
                    is_final=False,
                    fallback_text=script_item["target"],
                )
            )
            await asyncio.sleep(self.settings.mock_chunk_interval)
            await self._enqueue_source_event(
                SourceEvent(
                    session_token=self._session_token,
                    sentence_id=sentence_id,
                    text=script_item["source"],
                    is_final=True,
                    fallback_text=script_item["target"],
                )
            )
            self._line_index += 1
            await asyncio.sleep(self.settings.mock_interval)

    async def _handle_realtime_result(self, payload: dict[str, object]) -> None:
        source_text = str(payload.get("text") or "").strip()
        is_final = bool(payload.get("isFinal", False))
        if not source_text and not is_final:
            return

        await self._ingest_realtime_segment(
            raw_sentence_id=str(payload["sentenceId"]),
            text=source_text,
            is_final=is_final,
            slice_type=int(payload.get("sliceType", 1) or 1),
            start_time=int(payload.get("startTime", 0) or 0),
            end_time=int(payload.get("endTime", 0) or 0),
        )

    async def _handle_realtime_error(self, message: str) -> None:
        self.state = "paused"
        await self._queue.put(
            {
                "type": "error",
                "message": f"实时识别失败: {message}",
                "timestamp": _timestamp(),
            }
        )
        await self._queue.put(self._status_event("paused"))

    async def _enqueue_source_event(self, event: SourceEvent) -> None:
        self._ensure_workers()
        await self._source_queue.put(event)

    async def _ingest_realtime_segment(
        self,
        *,
        raw_sentence_id: str,
        text: str,
        is_final: bool,
        slice_type: int,
        start_time: int,
        end_time: int,
    ) -> None:
        if self._should_ignore_realtime_fragment(text):
            return

        active_segment = self._find_active_realtime_segment(raw_sentence_id)
        if active_segment is None and self._active_realtime_segments and self._should_rotate_realtime_sentence(
            next_text=text,
            next_start_time=start_time,
        ):
            await self._flush_active_realtime_sentence()

        if not self._active_realtime_sentence_id:
            self._active_realtime_sentence_id = self._next_realtime_sentence_id()

        segment = self._find_active_realtime_segment(raw_sentence_id)
        if segment is None:
            segment = RealtimeSegment(raw_sentence_id=raw_sentence_id)
            self._active_realtime_segments.append(segment)

        segment.text = text or segment.text
        segment.is_final = is_final
        segment.start_time = start_time or segment.start_time
        segment.end_time = end_time or segment.end_time

        aggregate = self._compose_realtime_sentence_text()
        self._reschedule_realtime_flush(aggregate)
        await self._maybe_schedule_preview_translation(aggregate)

    async def _flush_active_realtime_sentence(self) -> None:
        self._cancel_realtime_flush_task()
        if not self._active_realtime_sentence_id or not self._active_realtime_segments:
            self._reset_realtime_aggregation()
            return

        aggregated_text = self._compose_realtime_sentence_text()
        if aggregated_text:
            await self._enqueue_source_event(
                SourceEvent(
                    session_token=self._session_token,
                    sentence_id=self._active_realtime_sentence_id,
                    text=aggregated_text,
                    is_final=True,
                    slice_type=2,
                )
            )

        self._reset_realtime_aggregation()

    def _reset_realtime_aggregation(self) -> None:
        self._cancel_realtime_flush_task()
        self._cancel_preview_task()
        self._active_realtime_sentence_id = None
        self._active_realtime_segments.clear()
        self._last_preview_request_text = ""
        self._last_preview_request_at = 0.0
        self._preview_revision = 0

    def _cancel_realtime_flush_task(self) -> None:
        if self._active_realtime_flush_task and not self._active_realtime_flush_task.done():
            self._active_realtime_flush_task.cancel()
        self._active_realtime_flush_task = None

    def _cancel_preview_task(self) -> None:
        if self._active_preview_task and not self._active_preview_task.done():
            self._active_preview_task.cancel()
        self._active_preview_task = None

    def _reschedule_realtime_flush(self, aggregate: str) -> None:
        self._cancel_realtime_flush_task()
        if not self._should_auto_flush_active_sentence(aggregate):
            return
        delay = 0.36 if aggregate.endswith((".", "!", "?", "。", "！", "？")) else 0.62
        sentence_id = self._active_realtime_sentence_id
        self._active_realtime_flush_task = asyncio.create_task(
            self._flush_realtime_sentence_after_delay(
                session_token=self._session_token,
                sentence_id=sentence_id,
                expected_text=aggregate,
                delay=delay,
            )
        )

    async def _flush_realtime_sentence_after_delay(
        self,
        *,
        session_token: int,
        sentence_id: str | None,
        expected_text: str,
        delay: float,
    ) -> None:
        try:
            await asyncio.sleep(delay)
            if session_token != self._session_token:
                return
            if not sentence_id or sentence_id != self._active_realtime_sentence_id:
                return
            if self._compose_realtime_sentence_text() != expected_text:
                return
            if not self._should_auto_flush_active_sentence(expected_text):
                return
            await self._flush_active_realtime_sentence()
        except asyncio.CancelledError:
            raise

    def _should_auto_flush_active_sentence(self, aggregate: str) -> bool:
        if not aggregate or not self._active_realtime_segments:
            return False
        last_segment = self._active_realtime_segments[-1]
        if not last_segment.is_final:
            return False
        return self._looks_like_complete_sentence(aggregate)

    async def _maybe_schedule_preview_translation(self, aggregate: str) -> None:
        if not self._active_realtime_sentence_id or not aggregate:
            return
        if not self._looks_like_preview_candidate(aggregate):
            return
        if aggregate == self._last_preview_request_text:
            return
        if self._last_preview_request_text and not self._is_substantial_update(
            self._last_preview_request_text,
            aggregate,
        ):
            if (time() - self._last_preview_request_at) < 0.55:
                return

        self._last_preview_request_text = aggregate
        self._last_preview_request_at = time()
        self._preview_revision += 1
        preview_revision = self._preview_revision
        sentence_id = self._active_realtime_sentence_id
        session_token = self._session_token
        source_text = aggregate

        self._active_preview_task = asyncio.create_task(
            self._run_preview_translation(
                session_token=session_token,
                sentence_id=sentence_id,
                source_text=source_text,
                revision=preview_revision,
            )
        )

    async def _run_preview_translation(
        self,
        *,
        session_token: int,
        sentence_id: str,
        source_text: str,
        revision: int,
    ) -> None:
        target_text = await self._translate_or_fallback(
            source_text,
            source_text,
            recent_context=self._build_recent_context(sentence_id, final_pass=False),
            terminology_memory=self._build_terminology_memory(
                sentence_id,
                final_pass=False,
            ),
            final_pass=False,
        )

        if session_token != self._session_token:
            return
        if sentence_id != self._active_realtime_sentence_id:
            return
        if self._compose_realtime_sentence_text() != source_text:
            return

        await self._queue.put(
            {
                "type": "preview_update",
                "sentenceId": sentence_id,
                "sentenceIndex": self._sentence_index,
                "sourceText": source_text,
                "draftText": target_text,
                "displayText": target_text,
                "text": target_text,
                "sourceLang": self.source_lang,
                "targetLang": self.target_lang,
                "isFinal": False,
                "revision": revision,
                "timestamp": _timestamp(),
                "isPreview": True,
            }
        )

    def _next_realtime_sentence_id(self) -> str:
        sentence_id = f"rt:{self._session_token}:{self._realtime_sentence_serial}"
        self._realtime_sentence_serial += 1
        return sentence_id

    def _find_active_realtime_segment(self, raw_sentence_id: str) -> RealtimeSegment | None:
        for segment in self._active_realtime_segments:
            if segment.raw_sentence_id == raw_sentence_id:
                return segment
        return None

    def _compose_realtime_sentence_text(self) -> str:
        text = ""
        for segment in self._active_realtime_segments:
            piece = (segment.text or "").strip()
            if not piece:
                continue
            if not text:
                text = piece
                continue
            if self._should_join_without_space(text, piece):
                text = f"{text}{piece}"
            else:
                text = f"{text} {piece}"
        return text.strip()

    def _should_rotate_realtime_sentence(
        self,
        *,
        next_text: str,
        next_start_time: int,
    ) -> bool:
        if not self._active_realtime_segments:
            return False

        last_segment = self._active_realtime_segments[-1]
        if not last_segment.is_final:
            return False

        aggregate = self._compose_realtime_sentence_text()
        if not aggregate:
            return False

        gap_ms = max(0, next_start_time - last_segment.end_time) if next_start_time and last_segment.end_time else 0
        if gap_ms >= 1200:
            return True

        if not self._looks_like_complete_sentence(aggregate):
            return False

        if gap_ms >= 450:
            return True

        return self._looks_like_sentence_start(next_text)

    @staticmethod
    def _looks_like_sentence_start(text: str) -> bool:
        normalized = text.strip()
        if not normalized:
            return False
        first_char = normalized[0]
        return first_char.isupper() or "\u4e00" <= first_char <= "\u9fff"

    @staticmethod
    def _looks_like_complete_sentence(text: str) -> bool:
        normalized = text.strip()
        if not normalized:
            return False

        word_count = len(normalized.split())
        cjk_count = sum(1 for char in normalized if "\u4e00" <= char <= "\u9fff")
        has_terminal_punctuation = normalized.endswith((".", "!", "?", "。", "！", "？"))
        if has_terminal_punctuation and (word_count >= 4 or cjk_count >= 6 or len(normalized) >= 18):
            return True
        return word_count >= 7 or cjk_count >= 10 or len(normalized) >= 32

    @staticmethod
    def _looks_like_preview_candidate(text: str) -> bool:
        normalized = text.strip()
        if not normalized:
            return False
        word_count = len(normalized.split())
        cjk_count = sum(1 for char in normalized if "\u4e00" <= char <= "\u9fff")
        return (
            normalized.endswith((",", ".", "!", "?", "，", "。", "！", "？", ";", "；", ":"))
            or word_count >= 4
            or cjk_count >= 6
            or len(normalized) >= 18
        )

    @staticmethod
    def _should_join_without_space(previous_text: str, next_text: str) -> bool:
        if not previous_text or not next_text:
            return True

        if previous_text[-1].isspace() or next_text[0].isspace():
            return True

        if next_text[0] in ",.;:!?%)]}，。！？；：、）】":
            return True

        if previous_text[-1] in "([{（【":
            return True

        if any("\u4e00" <= char <= "\u9fff" for char in previous_text[-2:] + next_text[:2]):
            return True

        return False

    @staticmethod
    def _should_ignore_realtime_fragment(text: str) -> bool:
        normalized = (text or "").replace("’", "'").strip()
        if not normalized:
            return True
        return normalized in {"'s", "'re", "'ve", "'ll", "'d", "'m"}

    async def _source_worker_loop(self) -> None:
        while True:
            event = await self._source_queue.get()
            try:
                if event.session_token != self._session_token:
                    continue
                await self._apply_source_event(event)
            finally:
                self._source_queue.task_done()

    async def _apply_source_event(self, event: SourceEvent) -> None:
        if self._should_ignore_noise_fragment(event):
            return

        context = self._ensure_sentence_context(event.sentence_id)
        context.source_text = event.text or context.source_text
        context.source_revision += 1
        context.is_final = event.is_final
        if event.is_final and event.text:
            context.source_final = event.text
        self._ensure_timestamps(context)

        await self._publish_source_event(
            context,
            extra=(
                {"sliceType": event.slice_type}
                if event.slice_type is not None
                else None
            ),
        )

        if context.source_text:
            self.state = "processing"
            await self._queue.put(self._status_event("processing"))
            await self._schedule_translation(
                context,
                final_pass=context.is_final,
                fallback_text=event.fallback_text,
            )

    async def _schedule_translation(
        self,
        context: SentenceContext,
        *,
        final_pass: bool,
        fallback_text: str | None = None,
    ) -> None:
        if not self._should_schedule_translation(context, final_pass=final_pass):
            return

        request_text = (
            context.source_final if final_pass and context.source_final else context.source_text
        )
        now = time()
        if final_pass:
            context.last_final_request_text = request_text
        else:
            context.last_draft_request_text = request_text
            context.last_draft_request_at = now

        job = TranslationJob(
            session_token=self._session_token,
            sentence_id=context.sentence_id,
            revision=context.source_revision,
            final_pass=final_pass,
            fallback_text=fallback_text,
        )

        if final_pass:
            self._pending_final_jobs[context.sentence_id] = job
            await self._mark_sentence_ready(context.sentence_id, final_pass=True)
            return

        if (
            self._draft_load() >= MAX_PENDING_DRAFT_SENTENCES
            and context.sentence_id not in self._draft_ready_sentences
            and context.sentence_id not in self._draft_inflight_sentences
        ):
            return

        self._pending_draft_jobs[context.sentence_id] = job
        await self._mark_sentence_ready(context.sentence_id, final_pass=False)

    async def _mark_sentence_ready(self, sentence_id: str, *, final_pass: bool) -> None:
        queue = self._final_queue if final_pass else self._draft_queue
        ready_set = self._final_ready_sentences if final_pass else self._draft_ready_sentences
        inflight_set = (
            self._final_inflight_sentences if final_pass else self._draft_inflight_sentences
        )
        if sentence_id in ready_set or sentence_id in inflight_set:
            return
        ready_set.add(sentence_id)
        await queue.put(sentence_id)

    async def _translation_worker_loop(
        self,
        *,
        final_pass: bool,
        worker_name: str,
    ) -> None:
        del worker_name
        queue = self._final_queue if final_pass else self._draft_queue
        ready_set = self._final_ready_sentences if final_pass else self._draft_ready_sentences
        inflight_set = (
            self._final_inflight_sentences if final_pass else self._draft_inflight_sentences
        )
        pending_jobs = self._pending_final_jobs if final_pass else self._pending_draft_jobs

        while True:
            sentence_id = await queue.get()
            try:
                ready_set.discard(sentence_id)
                inflight_set.add(sentence_id)
                await self._process_translation_job(
                    sentence_id,
                    final_pass=final_pass,
                    pending_jobs=pending_jobs,
                )
            finally:
                inflight_set.discard(sentence_id)
                latest = pending_jobs.get(sentence_id)
                if latest and latest.session_token == self._session_token:
                    if sentence_id not in ready_set:
                        ready_set.add(sentence_id)
                        await queue.put(sentence_id)
                queue.task_done()

    async def _process_translation_job(
        self,
        sentence_id: str,
        *,
        final_pass: bool,
        pending_jobs: dict[str, TranslationJob],
    ) -> None:
        job = pending_jobs.get(sentence_id)
        if not job or job.session_token != self._session_token:
            pending_jobs.pop(sentence_id, None)
            return

        await self._translate_sentence(
            sentence_id,
            revision=job.revision,
            final_pass=final_pass,
            fallback_text=job.fallback_text,
        )

        latest = pending_jobs.get(sentence_id)
        if not latest:
            return
        if latest.session_token != self._session_token:
            pending_jobs.pop(sentence_id, None)
            return
        if latest.revision == job.revision:
            pending_jobs.pop(sentence_id, None)

    async def _translate_sentence(
        self,
        sentence_id: str,
        *,
        revision: int,
        final_pass: bool,
        fallback_text: str | None,
    ) -> None:
        context = self._sentence_contexts.get(sentence_id)
        if not context:
            return

        source_text = (
            context.source_final if final_pass and context.source_final else context.source_text
        )
        if not source_text:
            return

        target_text = await self._translate_or_fallback(
            source_text,
            fallback_text or source_text,
            recent_context=self._build_recent_context(sentence_id, final_pass=final_pass),
            terminology_memory=self._build_terminology_memory(
                sentence_id,
                final_pass=final_pass,
            ),
            final_pass=final_pass,
        )

        current = self._sentence_contexts.get(sentence_id)
        if not current or current.source_revision != revision:
            return

        current.translation_revision += 1
        if final_pass:
            current.final_translation = target_text
        else:
            current.draft_translation = target_text
        self._ensure_timestamps(current)

        await self._publish_translation_event(current, text=target_text, is_final=final_pass)

        if final_pass:
            await self._maybe_publish_listening_status()

    async def _translate_or_fallback(
        self,
        source_text: str,
        fallback_text: str,
        *,
        recent_context: list[dict[str, str]],
        terminology_memory: list[dict[str, str]],
        final_pass: bool,
    ) -> str:
        if not self._translator:
            return fallback_text

        try:
            translated = await self._translator.translate(
                source_text,
                source_lang=self.source_lang,
                target_lang=self.target_lang,
                recent_context=recent_context,
                final_pass=final_pass,
                glossary=self.glossary,
                scene_template_id=self.scene_template_id,
                context_strategy="final-consistency" if final_pass else "draft-fast",
                terminology_memory=terminology_memory,
            )
            return translated or fallback_text
        except Exception:
            return fallback_text

    async def _maybe_publish_listening_status(self) -> None:
        if self.state in {"idle", "paused", "stopped"}:
            return
        if self._has_pending_translation_work():
            return
        self.state = "listening"
        await self._queue.put(self._status_event("listening"))

    def _has_pending_translation_work(self) -> bool:
        return bool(
            self._pending_draft_jobs
            or self._pending_final_jobs
            or self._draft_ready_sentences
            or self._final_ready_sentences
            or self._draft_inflight_sentences
            or self._final_inflight_sentences
        )

    def _draft_load(self) -> int:
        return len(self._draft_ready_sentences) + len(self._draft_inflight_sentences)

    def _should_schedule_translation(
        self,
        context: SentenceContext,
        *,
        final_pass: bool,
    ) -> bool:
        source_text = (
            context.source_final if final_pass and context.source_final else context.source_text
        ).strip()
        if not source_text:
            return False

        if final_pass:
            return source_text != context.last_final_request_text

        if len(source_text) < 2:
            return False

        if source_text == context.last_draft_request_text:
            return False

        if self._is_substantial_update(context.last_draft_request_text, source_text):
            return True

        return (time() - context.last_draft_request_at) >= 0.85

    async def _publish_source_event(
        self,
        context: SentenceContext,
        extra: dict[str, Any] | None = None,
    ) -> None:
        confidence = self._build_confidence(context)
        await self._queue.put(
            {
                "type": "source_update",
                "sentenceId": context.sentence_id,
                "sentenceIndex": context.sentence_index,
                "text": context.source_text,
                "sourceText": context.source_text,
                "sourceLang": self.source_lang,
                "targetLang": self.target_lang,
                "isFinal": context.is_final,
                "revision": context.source_revision,
                "timestamp": context.last_updated_at or _timestamp(),
                "firstSeenAt": context.first_seen_at or None,
                "lastUpdatedAt": context.last_updated_at or None,
                "finalizedAt": context.finalized_at or None,
                "sourceRevisionCount": context.source_revision,
                **confidence,
                **(extra or {}),
            }
        )

    async def _publish_translation_event(
        self,
        context: SentenceContext,
        *,
        text: str,
        is_final: bool,
    ) -> None:
        confidence = self._build_confidence(context)
        await self._queue.put(
            {
                "type": "subtitle_update",
                "sentenceId": context.sentence_id,
                "sentenceIndex": context.sentence_index,
                "sourceText": context.source_final or context.source_text,
                "draftText": text if not is_final else context.draft_translation,
                "finalText": text if is_final else context.final_translation,
                "displayText": text,
                "text": text,
                "sourceLang": self.source_lang,
                "targetLang": self.target_lang,
                "isFinal": is_final,
                "revision": context.translation_revision,
                "timestamp": context.last_updated_at or _timestamp(),
                "firstSeenAt": context.first_seen_at or None,
                "lastUpdatedAt": context.last_updated_at or None,
                "finalizedAt": context.finalized_at or None,
                "sourceRevisionCount": context.source_revision,
                "contextWindowSize": 5 if is_final else 2,
                **confidence,
            }
        )

    def _ensure_sentence_context(self, sentence_id: str) -> SentenceContext:
        context = self._sentence_contexts.get(sentence_id)
        if context:
            return context

        sentence_index = self._get_sentence_index(sentence_id)
        context = SentenceContext(sentence_id=sentence_id, sentence_index=sentence_index)
        self._sentence_contexts[sentence_id] = context
        self._recent_sentence_ids.append(sentence_id)
        return context

    def _build_recent_context(
        self,
        current_sentence_id: str,
        *,
        final_pass: bool,
    ) -> list[dict[str, str]]:
        result: list[dict[str, str]] = []
        for sentence_id in self._recent_sentence_ids:
            if sentence_id == current_sentence_id:
                continue
            context = self._sentence_contexts.get(sentence_id)
            if not context:
                continue
            source_text = context.source_final or context.source_text
            target_text = context.final_translation or context.draft_translation
            if not source_text or not target_text:
                continue
            result.append({"source": source_text, "target": target_text})
        return result[-5:] if final_pass else result[-2:]

    def _build_terminology_memory(
        self,
        current_sentence_id: str,
        *,
        final_pass: bool,
    ) -> list[dict[str, str]]:
        memory: list[dict[str, str]] = []
        seen_pairs: set[tuple[str, str]] = set()
        for sentence_id in reversed(self._recent_sentence_ids):
            if sentence_id == current_sentence_id:
                continue
            context = self._sentence_contexts.get(sentence_id)
            if not context or not context.final_translation:
                continue
            pairs = self._extract_term_candidates(
                context.source_final or context.source_text,
                context.final_translation,
            )
            for pair in pairs:
                key = (pair["source"], pair["target"])
                if key in seen_pairs:
                    continue
                seen_pairs.add(key)
                memory.append(pair)
                if len(memory) >= (8 if final_pass else 3):
                    return memory
        return memory

    @staticmethod
    def _is_substantial_update(previous_text: str, next_text: str) -> bool:
        previous = previous_text.strip()
        current = next_text.strip()
        if not previous:
            return len(current) >= 4

        if current.endswith((".", "!", "?", "。", "！", "？")) and current != previous:
            return True

        growth = abs(len(current) - len(previous))
        if growth >= 6:
            return True

        previous_words = len(previous.split())
        current_words = len(current.split())
        return abs(current_words - previous_words) >= 2

    def _should_ignore_noise_fragment(self, event: SourceEvent) -> bool:
        text = (event.text or "").strip()
        existing = self._sentence_contexts.get(event.sentence_id)
        if not text:
            return not existing or not existing.source_text

        if existing and existing.source_text:
            return False

        normalized = text.replace("’", "'").strip()
        if normalized in {"'s", "'re", "'ve", "'ll", "'d", "'m"}:
            return True

        if len(normalized) <= 3 and ASCII_FRAGMENT_PATTERN.fullmatch(normalized):
            return True

        return False

    def _status_event(self, state: str | None = None) -> dict[str, Any]:
        return {
            "type": "status",
            "state": state or self.state,
            "sourceLang": self.source_lang,
            "targetLang": self.target_lang,
            "ttsEnabled": self.tts_enabled,
            "recordEnabled": self.record_enabled,
            "glossary": self.glossary,
            "sceneTemplateId": self.scene_template_id,
            "draftBacklog": len(self._draft_ready_sentences) + len(self._draft_inflight_sentences),
            "finalBacklog": len(self._final_ready_sentences) + len(self._final_inflight_sentences),
            "timestamp": _timestamp(),
        }

    def _get_sentence_index(self, sentence_id: str) -> int:
        if sentence_id not in self._sentence_numbers:
            self._sentence_numbers[sentence_id] = self._sentence_index
            self._sentence_index += 1
        return self._sentence_numbers[sentence_id]

    def _is_supported_pair(self, source_lang: str, target_lang: str) -> bool:
        return (source_lang, target_lang) in self.settings.supported_pairs

    @staticmethod
    def _pair_key(source_lang: str, target_lang: str) -> str:
        return f"{source_lang}|{target_lang}"

    def _begin_new_session(self) -> None:
        self._session_token += 1
        self._sentence_index = 0
        self._sentence_numbers.clear()
        self._sentence_contexts.clear()
        self._recent_sentence_ids.clear()
        self._realtime_sentence_serial = 0
        self._reset_realtime_aggregation()
        self._line_index = 0
        self._pending_draft_jobs.clear()
        self._pending_final_jobs.clear()
        self._draft_ready_sentences.clear()
        self._final_ready_sentences.clear()
        self._draft_inflight_sentences.clear()
        self._final_inflight_sentences.clear()
        self._drain_queue(self._source_queue)
        self._drain_queue(self._draft_queue)
        self._drain_queue(self._final_queue)

    @staticmethod
    def _drain_queue(queue: asyncio.Queue[Any]) -> None:
        while True:
            try:
                queue.get_nowait()
                queue.task_done()
            except asyncio.QueueEmpty:
                break
