from __future__ import annotations

from urllib.parse import urlparse

import httpx

from .models import LlmConnectionRequest, LlmConnectionResult


def chat_completion_url(base_url: str) -> str:
    normalized = base_url.rstrip("/")
    if normalized.endswith("/chat/completions"):
        return normalized
    if not normalized.endswith("/v1"):
        normalized = f"{normalized}/v1"
    return f"{normalized}/chat/completions"


async def test_openai_compatible_connection(config: LlmConnectionRequest) -> LlmConnectionResult:
    parsed = urlparse(config.base_url)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        return LlmConnectionResult(ok=False, message="请输入完整的 HTTP(S) API 地址。", model=config.model)

    try:
        async with httpx.AsyncClient(timeout=20.0) as client:
            response = await client.post(
                chat_completion_url(config.base_url),
                headers={"Authorization": f"Bearer {config.api_key}"},
                json={
                    "model": config.model,
                    "messages": [{"role": "user", "content": "仅回复 OK"}],
                    "max_tokens": 4,
                    "temperature": 0,
                },
            )
        if response.is_success:
            return LlmConnectionResult(ok=True, message="连接成功，可使用该模型。", model=config.model)
        detail = response.text[:180].replace("\n", " ")
        return LlmConnectionResult(ok=False, message=f"请求失败（HTTP {response.status_code}）：{detail}", model=config.model)
    except httpx.TimeoutException:
        return LlmConnectionResult(ok=False, message="连接超时，请检查地址、网络或模型服务状态。", model=config.model)
    except httpx.HTTPError as exc:
        return LlmConnectionResult(ok=False, message=f"无法连接 API：{str(exc)[:160]}", model=config.model)
