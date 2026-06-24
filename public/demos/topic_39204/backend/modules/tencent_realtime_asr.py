from __future__ import annotations

import asyncio
import base64
import hashlib
import hmac
import json
import random
from contextlib import suppress
from dataclasses import dataclass, field
from time import monotonic, time
from typing import Awaitable, Callable
from urllib.parse import quote, urlencode
from uuid import uuid4

import websockets


ENGINE_BY_LANGUAGE = {
    "zh": "16k_zh",
    "en": "16k_en",
    "ja": "16k_ja",
    "ar": "16k_ar",
}
PCM_SAMPLE_RATE = 16000
PCM_BYTES_PER_SAMPLE = 2
PCM_BYTES_PER_SECOND = PCM_SAMPLE_RATE * PCM_BYTES_PER_SAMPLE
SEND_SLICE_MS = 120
SEND_SLICE_BYTES = PCM_BYTES_PER_SECOND * SEND_SLICE_MS // 1000
MAX_AUDIO_SPEED = 1.15

AsrResultHandler = Callable[[dict[str, object]], Awaitable[None]]
AsrErrorHandler = Callable[[str], Awaitable[None]]


@dataclass(slots=True)
class TencentRealtimeAsrSession:
    app_id: str
    secret_id: str
    secret_key: str
    source_lang: str
    on_result: AsrResultHandler
    on_error: AsrErrorHandler
    voice_id: str = field(default_factory=lambda: uuid4().hex)
    _websocket: websockets.ClientConnection | None = field(default=None, init=False)
    _receiver_task: asyncio.Task[None] | None = field(default=None, init=False)
    _closed: bool = field(default=False, init=False)
    _send_lock: asyncio.Lock = field(default_factory=asyncio.Lock, init=False)
    _next_send_at: float = field(default=0.0, init=False)

    async def start(self) -> None:
        if not self.app_id or not self.secret_id or not self.secret_key:
            raise RuntimeError("Tencent realtime ASR credentials are not fully configured")

        engine = ENGINE_BY_LANGUAGE.get(self.source_lang)
        if not engine:
            raise RuntimeError(f"Unsupported realtime ASR language: {self.source_lang}")

        connection = await websockets.connect(
            self._build_url(engine),
            max_size=4 * 1024 * 1024,
            ping_interval=20,
            ping_timeout=20,
        )
        self._websocket = connection

        handshake_message = await asyncio.wait_for(connection.recv(), timeout=8)
        payload = self._decode_payload(handshake_message)
        code = int(payload.get("code", 0) or 0)
        if code != 0:
            await connection.close()
            raise RuntimeError(payload.get("message", "Tencent realtime ASR handshake failed"))

        self.voice_id = str(payload.get("voice_id") or self.voice_id)
        self._receiver_task = asyncio.create_task(self._receiver_loop())

    async def send_audio(self, audio_bytes: bytes) -> None:
        if not audio_bytes:
            return
        if self._closed or not self._websocket:
            raise RuntimeError("Realtime ASR session is not connected")

        async with self._send_lock:
            for offset in range(0, len(audio_bytes), SEND_SLICE_BYTES):
                frame = audio_bytes[offset : offset + SEND_SLICE_BYTES]
                await self._wait_for_send_budget(len(frame))
                await self._websocket.send(frame)

    async def finish(self) -> None:
        if self._closed:
            return

        self._closed = True
        if self._websocket:
            with suppress(Exception):
                await self._websocket.send(json.dumps({"type": "end"}, ensure_ascii=False))
        if self._receiver_task:
            with suppress(asyncio.TimeoutError, Exception):
                await asyncio.wait_for(self._receiver_task, timeout=10)
        if self._websocket:
            with suppress(Exception):
                await self._websocket.close()

    async def abort(self) -> None:
        self._closed = True
        if self._receiver_task:
            self._receiver_task.cancel()
            with suppress(asyncio.CancelledError):
                await self._receiver_task
        if self._websocket:
            with suppress(Exception):
                await self._websocket.close()

    async def _wait_for_send_budget(self, frame_size: int) -> None:
        now = monotonic()
        if self._next_send_at <= 0:
            self._next_send_at = now
        elif self._next_send_at > now:
            await asyncio.sleep(self._next_send_at - now)

        frame_duration = frame_size / PCM_BYTES_PER_SECOND
        self._next_send_at = max(monotonic(), self._next_send_at) + frame_duration / MAX_AUDIO_SPEED

    def _build_url(self, engine_model_type: str) -> str:
        timestamp = int(time())
        params = {
            "convert_num_mode": 1,
            "engine_model_type": engine_model_type,
            "expired": timestamp + 60 * 60,
            "filter_dirty": 0,
            "filter_empty_result": 0,
            "filter_modal": 0,
            "filter_punc": 0,
            "needvad": 1,
            "nonce": random.randint(1, 2_000_000_000),
            "secretid": self.secret_id,
            "timestamp": timestamp,
            "voice_format": 1,
            "voice_id": self.voice_id,
            "word_info": 0,
        }
        canonical_query = urlencode(sorted(params.items()))
        sign_source = f"asr.cloud.tencent.com/asr/v2/{self.app_id}?{canonical_query}"
        digest = hmac.new(
            self.secret_key.encode("utf-8"),
            sign_source.encode("utf-8"),
            hashlib.sha1,
        ).digest()
        signature = quote(base64.b64encode(digest).decode("ascii"), safe="")
        return (
            f"wss://asr.cloud.tencent.com/asr/v2/{self.app_id}"
            f"?{canonical_query}&signature={signature}"
        )

    async def _receiver_loop(self) -> None:
        try:
            assert self._websocket is not None
            async for raw_message in self._websocket:
                payload = self._decode_payload(raw_message)
                code = int(payload.get("code", 0) or 0)
                if code != 0:
                    await self.on_error(str(payload.get("message") or f"ASR error {code}"))
                    return

                result = payload.get("result")
                if isinstance(result, dict):
                    text = str(result.get("voice_text_str") or "").strip()
                    slice_type = int(result.get("slice_type", 1) or 1)
                    index = int(result.get("index", 0) or 0)
                    if text or slice_type == 2:
                        await self.on_result(
                            {
                                "sentenceId": f"{self.voice_id}:{index}",
                                "sliceType": slice_type,
                                "index": index,
                                "text": text,
                                "isFinal": slice_type == 2,
                                "startTime": int(result.get("start_time", 0) or 0),
                                "endTime": int(result.get("end_time", 0) or 0),
                            }
                        )

                if int(payload.get("final", 0) or 0) == 1:
                    return
        except asyncio.CancelledError:
            raise
        except Exception as exc:
            if not self._closed:
                await self.on_error(str(exc))
        finally:
            self._closed = True

    @staticmethod
    def _decode_payload(raw_message: str | bytes) -> dict[str, object]:
        if isinstance(raw_message, bytes):
            return json.loads(raw_message.decode("utf-8"))
        return json.loads(raw_message)
