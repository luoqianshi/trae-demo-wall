from __future__ import annotations

import asyncio
import json
from dataclasses import dataclass
from typing import Protocol
from urllib.error import HTTPError, URLError
from urllib.parse import urljoin
from urllib.request import Request, urlopen


@dataclass(slots=True)
class TranslationConfig:
    provider: str = "mock"
    model: str = "deepseek-chat"
    api_key: str = ""
    base_url: str = "https://api.deepseek.com"
    timeout: float = 12

    @property
    def api_key_configured(self) -> bool:
        return bool(self.api_key.strip())


@dataclass(slots=True)
class TranslationOutput:
    text: str
    provider: str
    model: str
    fallback: bool = False
    message: str = ""


class TranslationEngine(Protocol):
    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        history: list[str],
    ) -> TranslationOutput:
        ...


class MockTranslationEngine:
    def __init__(self, config: TranslationConfig) -> None:
        self.config = config

    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        history: list[str],
    ) -> TranslationOutput:
        return TranslationOutput(
            text=text,
            provider="mock",
            model="mock-script",
        )


class DeepSeekTranslationEngine:
    def __init__(self, config: TranslationConfig) -> None:
        self.config = config

    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        history: list[str],
    ) -> TranslationOutput:
        if not self.config.api_key_configured:
            return TranslationOutput(
                text=text,
                provider="mock",
                model="mock-script",
                fallback=True,
                message="DeepSeek API key is not configured; mock fallback is active.",
            )

        try:
            translated = await asyncio.to_thread(
                self._request_translation,
                text,
                source_lang,
                target_lang,
                history,
            )
        except (HTTPError, URLError, TimeoutError, OSError, ValueError) as error:
            return TranslationOutput(
                text=text,
                provider="mock",
                model="mock-script",
                fallback=True,
                message=f"DeepSeek request failed; mock fallback is active. {error}",
            )

        return TranslationOutput(
            text=translated,
            provider="deepseek",
            model=self.config.model,
        )

    def _request_translation(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        history: list[str],
    ) -> str:
        endpoint = urljoin(self.config.base_url.rstrip("/") + "/", "chat/completions")
        payload = {
            "model": self.config.model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are a professional live interpreter. Translate the current "
                        "utterance into the target language. Return only the translated text."
                    ),
                },
                {
                    "role": "user",
                    "content": (
                        f"Source language: {source_lang}\n"
                        f"Target language: {target_lang}\n"
                        f"Recent context: {' | '.join(history[-5:])}\n"
                        f"Current text: {text}"
                    ),
                },
            ],
            "temperature": 0.2,
            "stream": False,
        }
        request = Request(
            endpoint,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.config.api_key.strip()}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urlopen(request, timeout=self.config.timeout) as response:
            body = json.loads(response.read().decode("utf-8"))

        translated = body["choices"][0]["message"]["content"].strip()
        if not translated:
            raise ValueError("DeepSeek returned an empty translation.")
        return translated


def create_translation_engine(config: TranslationConfig) -> TranslationEngine:
    provider = config.provider.strip().lower() or "mock"
    if provider == "deepseek":
        return DeepSeekTranslationEngine(config)
    return MockTranslationEngine(config)
