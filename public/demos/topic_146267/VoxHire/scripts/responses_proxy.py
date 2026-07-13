"""Expose OpenAI Responses API over a Chat Completions-only provider."""

from __future__ import annotations

from urllib.parse import urlparse

import httpx
from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel


def chat_url(base_url: str) -> str:
    base = base_url.rstrip("/")
    return base if base.endswith("/chat/completions") else f"{base}/chat/completions"


def to_chat_messages(items: list[dict]) -> list[dict[str, str]]:
    messages: list[dict[str, str]] = []
    for item in items:
        content = item.get("content", [])
        if isinstance(content, str):
            text = content
        else:
            text = "".join(part.get("text", "") for part in content if isinstance(part, dict))
        if text:
            messages.append({"role": item.get("role", "user"), "content": text})
    return messages or [{"role": "user", "content": "你好"}]


class GatewayConfig(BaseModel):
    base_url: str
    api_key: str
    model: str


def create_proxy(target_base_url: str | None = None, api_key: str | None = None, model: str | None = None) -> FastAPI:
    app = FastAPI()
    config: GatewayConfig | None = (
        GatewayConfig(base_url=target_base_url, api_key=api_key, model=model or "configured") if target_base_url and api_key else None
    )

    @app.put("/v1/config")
    async def configure(next_config: GatewayConfig) -> dict[str, bool]:
        nonlocal config
        config = next_config
        return {"configured": True}

    @app.post("/v1/responses")
    async def responses(payload: dict, request: Request) -> dict:
        if config is None:
            # Lets the upstream handler warm up before the browser provides its transient key.
            content = "本地语音网关已就绪，请先在网页中测试并同步 LLM 配置。"
            return {"id": "resp_pending_config", "object": "response", "created_at": 0, "status": "completed", "model": payload["model"], "output": [{"id": "msg_pending_config", "type": "message", "status": "completed", "role": "assistant", "content": [{"type": "output_text", "text": content, "annotations": []}]}], "usage": {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}}
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                upstream = await client.post(
                    chat_url(config.base_url),
                    headers={"Authorization": request.headers.get("Authorization", f"Bearer {config.api_key}")},
                    json={"model": config.model, "messages": to_chat_messages(payload.get("input", [])), "stream": False},
                )
            upstream.raise_for_status()
            content = upstream.json()["choices"][0]["message"]["content"]
        except (httpx.HTTPError, KeyError, IndexError, TypeError) as exc:
            raise HTTPException(status_code=502, detail=f"Chat Completions upstream failed: {exc}") from exc
        return {"id": "resp_voxhire", "object": "response", "created_at": 0, "status": "completed", "model": payload["model"], "output": [{"id": "msg_voxhire", "type": "message", "status": "completed", "role": "assistant", "content": [{"type": "output_text", "text": content, "annotations": []}]}], "usage": {"input_tokens": 0, "output_tokens": 0, "total_tokens": 0}}

    return app
