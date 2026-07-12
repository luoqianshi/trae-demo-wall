from __future__ import annotations

from dataclasses import dataclass

import httpx


LANGUAGE_NAMES = {
    "zh": "简体中文",
    "en": "English",
    "ja": "日本語",
    "ar": "العربية",
}


@dataclass(slots=True)
class DeepSeekClient:
    api_key: str
    base_url: str
    model: str
    timeout: float = 30.0
    _client: httpx.AsyncClient | None = None

    async def close(self) -> None:
        if self._client:
            await self._client.aclose()
            self._client = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(
                base_url=self.base_url.rstrip("/"),
                timeout=self.timeout,
            )
        return self._client

    async def translate(
        self,
        text: str,
        source_lang: str,
        target_lang: str,
        recent_context: list[dict[str, str]] | None = None,
        final_pass: bool = False,
        glossary: list[str] | None = None,
        scene_template_id: str | None = None,
        context_strategy: str | None = None,
        terminology_memory: list[dict[str, str]] | None = None,
    ) -> str:
        if not self.api_key:
            raise RuntimeError("DeepSeek API key is not configured")

        source_name = LANGUAGE_NAMES.get(source_lang, source_lang)
        target_name = LANGUAGE_NAMES.get(target_lang, target_lang)
        context_block = ""
        if recent_context:
            lines = [
                f"- {item['source']} => {item['target']}"
                for item in recent_context
                if item.get("source") and item.get("target")
            ]
            if lines:
                context_block = "Recent confirmed context:\n" + "\n".join(lines) + "\n\n"
        terminology_block = ""
        if terminology_memory:
            lines = [
                f"- {item['source']} => {item['target']}"
                for item in terminology_memory
                if item.get("source") and item.get("target")
            ]
            if lines:
                terminology_block = (
                    "Terminology consistency memory. Reuse these mappings when still contextually valid:\n"
                    + "\n".join(lines)
                    + "\n\n"
                )
        glossary_block = ""
        if glossary:
            glossary_lines = [f"- {item}" for item in glossary if item]
            if glossary_lines:
                glossary_block = "Preferred glossary and named entities:\n" + "\n".join(glossary_lines) + "\n\n"
        pass_hint = (
            "This is the final correction pass. Prefer a polished final translation."
            if final_pass
            else "This is a draft streaming pass. Prefer low-latency, concise translation and keep revisable wording."
        )
        context_hint = (
            "Use only lightweight local context and avoid overcommitting to uncertain references."
            if not final_pass
            else "Use broader recent context to keep terminology, references, and tone consistent across adjacent sentences."
        )
        prompt = (
            f"Translate the following text from {source_name} to {target_name}. "
            "Return only the translated text without explanation.\n\n"
            f"Scene template: {scene_template_id or 'general'}.\n\n"
            f"Context strategy: {context_strategy or ('final-consistency' if final_pass else 'draft-fast')}.\n\n"
            f"{pass_hint}\n\n"
            f"{context_hint}\n\n"
            f"{context_block}"
            f"{terminology_block}"
            f"{glossary_block}"
            f"Text:\n{text}"
        )

        client = self._get_client()
        response = await client.post(
            "/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You are a professional simultaneous interpreter.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
                "stream": False,
            },
        )
        response.raise_for_status()
        payload = response.json()
        return (
            payload.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )

    async def summarize_session(
        self,
        *,
        source_lang: str,
        target_lang: str,
        scene_template_id: str,
        glossary: list[str] | None,
        transcript: list[dict[str, object]],
    ) -> dict[str, object]:
        if not self.api_key:
            raise RuntimeError("DeepSeek API key is not configured")

        source_name = LANGUAGE_NAMES.get(source_lang, source_lang)
        target_name = LANGUAGE_NAMES.get(target_lang, target_lang)
        glossary_block = ""
        if glossary:
            glossary_lines = [f"- {item}" for item in glossary if item]
            if glossary_lines:
                glossary_block = "Preferred glossary and named entities:\n" + "\n".join(glossary_lines) + "\n\n"

        transcript_lines = []
        for item in transcript[-24:]:
            sentence_index = int(item.get("sentenceIndex", 0)) + 1
            source_text = str(item.get("sourceText", "")).strip()
            final_text = str(item.get("finalText") or item.get("displayText") or "").strip()
            confidence = item.get("confidenceScore", "")
            transcript_lines.append(
                f"#{sentence_index} | confidence={confidence}\nsource: {source_text}\nfinal: {final_text}"
            )

        prompt = (
            "You are helping generate a reliable post-session recap for a real-time interpretation tool. "
            "Return valid JSON only with keys summary, topics, todo. "
            "summary must be an array of 2-4 concise Chinese strings. "
            "topics must be an array of 3-8 short terms. "
            "todo must be an array of 1-6 concise Chinese follow-up items.\n\n"
            f"Scene template: {scene_template_id or 'general'}\n"
            f"Language direction: {source_name} -> {target_name}\n\n"
            f"{glossary_block}"
            "Transcript:\n"
            + "\n\n".join(transcript_lines)
        )

        client = self._get_client()
        response = await client.post(
            "/chat/completions",
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json={
                "model": self.model,
                "messages": [
                    {
                        "role": "system",
                        "content": "You generate structured JSON recaps for bilingual interpretation sessions.",
                    },
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
                "stream": False,
                "response_format": {"type": "json_object"},
            },
        )
        response.raise_for_status()
        payload = response.json()
        content = (
            payload.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )
        return httpx.Response(200, text=content).json()
