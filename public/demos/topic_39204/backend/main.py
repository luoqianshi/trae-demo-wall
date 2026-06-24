from __future__ import annotations

import asyncio
import base64
import json
from contextlib import suppress
from dataclasses import dataclass
from typing import Any

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from config import settings
from modules.deepseek_client import DeepSeekClient
from modules.pipeline import MockTranslationPipeline


@dataclass(slots=True)
class RuntimeSecrets:
    deepseek_api_key: str = settings.deepseek_api_key
    deepseek_base_url: str = settings.deepseek_base_url
    deepseek_model: str = settings.deepseek_model


class ControlPayload(BaseModel):
    action: str
    sourceLang: str | None = None
    targetLang: str | None = None
    ttsEnabled: bool | None = None
    recordEnabled: bool | None = None
    glossary: list[str] | None = None
    sceneTemplateId: str | None = None
    sourceText: str | None = None
    isFinal: bool | None = None
    useMock: bool | None = None


class DeepSeekConfigPayload(BaseModel):
    apiKey: str = Field(default="", max_length=512)
    baseUrl: str | None = Field(default=None, max_length=512)
    model: str | None = Field(default=None, max_length=128)


class AudioRecognitionPayload(BaseModel):
    sourceLang: str
    targetLang: str
    audioBase64: str = Field(min_length=16)
    ttsEnabled: bool | None = None
    recordEnabled: bool | None = None


class RealtimeStartPayload(BaseModel):
    sourceLang: str
    targetLang: str
    ttsEnabled: bool | None = None
    recordEnabled: bool | None = None
    glossary: list[str] | None = None
    sceneTemplateId: str | None = None


class RealtimeChunkPayload(BaseModel):
    audioBase64: str = Field(min_length=8)


class SessionSummaryPayload(BaseModel):
    sourceLang: str
    targetLang: str
    sceneTemplateId: str | None = None
    glossary: list[str] | None = None
    transcript: list[dict[str, Any]] = Field(default_factory=list)


class PipelineHub:
    def __init__(self) -> None:
        self.pipeline = MockTranslationPipeline(settings=settings)
        self.subscribers: set[asyncio.Queue[dict[str, Any]]] = set()
        self._fanout_task: asyncio.Task[None] | None = None
        self._lock = asyncio.Lock()

    async def start(self) -> None:
        await self.pipeline.bootstrap()
        self._fanout_task = asyncio.create_task(self._fanout_loop())

    async def shutdown(self) -> None:
        if self._fanout_task:
            self._fanout_task.cancel()
            with suppress(asyncio.CancelledError):
                await self._fanout_task
        await self.pipeline.shutdown()

    async def publish_command(self, payload: dict[str, Any]) -> None:
        async with self._lock:
            await self.pipeline.apply_command(payload)

    async def subscribe(self) -> asyncio.Queue[dict[str, Any]]:
        queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
        self.subscribers.add(queue)
        await queue.put(self.pipeline.snapshot_status())
        return queue

    def unsubscribe(self, queue: asyncio.Queue[dict[str, Any]]) -> None:
        self.subscribers.discard(queue)

    async def _fanout_loop(self) -> None:
        while True:
            event = await self.pipeline.next_event()
            stale: list[asyncio.Queue[dict[str, Any]]] = []
            for queue in self.subscribers:
                try:
                    queue.put_nowait(event)
                except asyncio.QueueFull:
                    stale.append(queue)
            for queue in stale:
                self.subscribers.discard(queue)


app = FastAPI(title="QN Live Interpretation Backend", version="0.3.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

hub = PipelineHub()
runtime_secrets = RuntimeSecrets()


def _build_fallback_summary(payload: SessionSummaryPayload) -> dict[str, object]:
    transcript = payload.transcript[-24:]
    final_lines = [
        str(item.get("finalText") or item.get("displayText") or "").strip()
        for item in transcript
        if str(item.get("finalText") or item.get("displayText") or "").strip()
    ]
    risky_items = [
        item
        for item in transcript
        if int(item.get("confidenceScore", 0)) < 50 or bool(item.get("highVolatility"))
    ]
    glossary = [item for item in (payload.glossary or []) if item][:8]
    summary = final_lines[-3:] or ["当前会话尚未形成足够的定稿内容。"]
    todo = (
        [
            f"复核句子 #{int(item.get('sentenceIndex', 0)) + 1}"
            for item in risky_items[:5]
        ]
        or ["当前没有明显高风险句子。"]
    )
    topics = glossary or [
        str(item.get("finalText") or item.get("displayText") or "")[:12]
        for item in transcript[-5:]
        if str(item.get("finalText") or item.get("displayText") or "").strip()
    ]
    return {
        "summary": summary[:4],
        "topics": topics[:8],
        "todo": todo[:6],
        "provider": "fallback",
    }


def _require_admin_token(admin_token: str | None) -> None:
    expected = settings.admin_token.strip()
    if not expected:
        raise HTTPException(status_code=503, detail="Admin token is not configured")
    if not admin_token or admin_token.strip() != expected:
        raise HTTPException(status_code=401, detail="Invalid admin token")


@app.on_event("startup")
async def startup_event() -> None:
    await hub.start()


@app.on_event("shutdown")
async def shutdown_event() -> None:
    await hub.shutdown()


@app.get("/api/health")
async def health_check() -> dict[str, str]:
    return {"status": "ok", "service": "qn-backend"}


@app.get("/api/demo")
async def demo_payload() -> dict[str, object]:
    return {
        "status": "ok",
        "supportedPairs": settings.supported_pairs,
        "messages": settings.mock_scripts["en|zh"],
        "sourceLang": "en",
        "targetLang": "zh",
        "mode": "translation-display-sse-asr",
    }


@app.get("/api/deepseek/config")
async def deepseek_config() -> dict[str, object]:
    return {
        "status": "ok",
        "configured": bool(runtime_secrets.deepseek_api_key),
        "baseUrl": runtime_secrets.deepseek_base_url,
        "model": runtime_secrets.deepseek_model,
        "apiKeyPreview": (
            f"{runtime_secrets.deepseek_api_key[:6]}..."
            if runtime_secrets.deepseek_api_key
            else ""
        ),
    }


@app.post("/api/deepseek/config")
async def update_deepseek_config(
    payload: DeepSeekConfigPayload,
    admin_token: str | None = Header(default=None, alias="x-admin-token"),
) -> dict[str, object]:
    _require_admin_token(admin_token)
    runtime_secrets.deepseek_api_key = payload.apiKey.strip()
    if payload.baseUrl:
        runtime_secrets.deepseek_base_url = payload.baseUrl.strip()
    if payload.model:
        runtime_secrets.deepseek_model = payload.model.strip()

    settings.deepseek_api_key = runtime_secrets.deepseek_api_key
    settings.deepseek_base_url = runtime_secrets.deepseek_base_url
    settings.deepseek_model = runtime_secrets.deepseek_model
    hub.pipeline.refresh_translator()

    return {
        "status": "ok",
        "configured": bool(runtime_secrets.deepseek_api_key),
        "baseUrl": runtime_secrets.deepseek_base_url,
        "model": runtime_secrets.deepseek_model,
    }


@app.post("/api/control")
async def control_pipeline(payload: ControlPayload) -> dict[str, object]:
    if payload.action not in {"start", "pause", "stop", "config", "speech"}:
        raise HTTPException(status_code=400, detail="Unsupported action")

    await hub.publish_command(
        {
            key: value
            for key, value in payload.model_dump().items()
            if value is not None
        }
    )
    return {"status": "ok", "action": payload.action}


@app.post("/api/recognize")
async def recognize_audio(payload: AudioRecognitionPayload) -> dict[str, object]:
    raise HTTPException(
        status_code=410,
        detail="Legacy sentence recognition has been replaced by realtime streaming ASR.",
    )


@app.post("/api/realtime/start")
async def start_realtime_session(payload: RealtimeStartPayload) -> dict[str, object]:
    has_asr_creds = all(
        [
            settings.tencent_app_id.strip(),
            settings.tencent_secret_id.strip(),
            settings.tencent_secret_key.strip(),
        ]
    )
    use_mock = not has_asr_creds

    await hub.publish_command(
        {
            "action": "start",
            "sourceLang": payload.sourceLang,
            "targetLang": payload.targetLang,
            "ttsEnabled": payload.ttsEnabled,
            "recordEnabled": payload.recordEnabled,
            "glossary": payload.glossary,
            "sceneTemplateId": payload.sceneTemplateId,
            "useMock": use_mock,
        }
    )

    if use_mock:
        return {"status": "ok", "state": "listening", "mode": "mock"}

    await hub.pipeline.open_realtime_session()
    return {"status": "ok", "state": "listening", "mode": "asr"}


@app.post("/api/realtime/chunk")
async def send_realtime_chunk(payload: RealtimeChunkPayload) -> dict[str, object]:
    try:
        audio_bytes = base64.b64decode(payload.audioBase64)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid audio payload") from exc

    if not audio_bytes:
        raise HTTPException(status_code=400, detail="Empty audio payload")

    accepted = await hub.pipeline.push_realtime_audio(audio_bytes)
    if not accepted:
        return {"status": "ignored", "bytes": len(audio_bytes)}
    return {"status": "ok", "bytes": len(audio_bytes)}


@app.post("/api/realtime/finish")
async def finish_realtime_session() -> dict[str, object]:
    await hub.publish_command({"action": "pause"})
    await hub.pipeline.close_realtime_session(abort=False)
    await hub.publish_command({"action": "stop"})
    return {"status": "ok", "state": "stopped"}


@app.post("/api/realtime/pause")
async def pause_realtime_session() -> dict[str, object]:
    await hub.publish_command({"action": "pause"})
    await hub.pipeline.close_realtime_session(abort=False)
    return {"status": "ok", "state": "paused"}


@app.post("/api/session/summary")
async def build_session_summary(payload: SessionSummaryPayload) -> dict[str, object]:
    transcript = payload.transcript[-24:]
    if not transcript:
      return {
          "summary": ["当前没有可整理的会话内容。"],
          "topics": payload.glossary or [],
          "todo": ["先完成一段同传会话，再生成整理摘要。"],
          "provider": "fallback",
      }

    client = DeepSeekClient(
        api_key=runtime_secrets.deepseek_api_key,
        base_url=runtime_secrets.deepseek_base_url,
        model=runtime_secrets.deepseek_model,
        timeout=settings.deepseek_timeout,
    )
    try:
        result = await client.summarize_session(
            source_lang=payload.sourceLang,
            target_lang=payload.targetLang,
            scene_template_id=payload.sceneTemplateId or "general",
            glossary=payload.glossary,
            transcript=transcript,
        )
        summary = result.get("summary")
        topics = result.get("topics")
        todo = result.get("todo")
        if not isinstance(summary, list) or not isinstance(topics, list) or not isinstance(todo, list):
            raise ValueError("invalid summary format")
        return {
            "summary": [str(item) for item in summary[:4]],
            "topics": [str(item) for item in topics[:8]],
            "todo": [str(item) for item in todo[:6]],
            "provider": "deepseek",
        }
    except Exception:
        return _build_fallback_summary(payload)


@app.get("/api/stream")
async def stream_events(request: Request) -> StreamingResponse:
    queue = await hub.subscribe()

    async def event_generator():
        try:
            while True:
                if await request.is_disconnected():
                    break

                try:
                    event = await asyncio.wait_for(
                        queue.get(), timeout=settings.heartbeat_interval
                    )
                    yield _to_sse("message", event)
                except asyncio.TimeoutError:
                    yield _to_sse(
                        "heartbeat",
                        {"timestamp": int(asyncio.get_running_loop().time() * 1000)},
                    )
        finally:
            hub.unsubscribe(queue)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


def _to_sse(event_name: str, payload: dict[str, Any]) -> str:
    return f"event: {event_name}\ndata: {json.dumps(payload, ensure_ascii=False)}\n\n"


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=False,
    )
