"""
Scrapling 网页正文提取微服务

为 Java 后端的 L3 提取器提供 HTTP 接口。利用 Scrapling 的 StealthyFetcher
绕过 Cloudflare 等反爬，提取网页正文并转换为 Markdown。

接口约定：
  POST /extract   body: {"url": "..."}
  resp: {"title": "...", "markdown": "...", "html": "..."}

启动：
  pip install -r requirements.txt
  scrapling install          # 安装浏览器内核（首次）
  uvicorn app:app --host 0.0.0.0 --port 8200
"""
from typing import Optional

from fastapi import FastAPI
from pydantic import BaseModel

try:
    from readability import Document as ReadabilityDocument  # readability-lxml
except ImportError:  # pragma: no cover
    ReadabilityDocument = None

from markdownify import markdownify as md

from scrapling.fetchers import StealthyFetcher

app = FastAPI(title="Scrapling Extract Service", version="1.0")

StealthyFetcher.adaptive = True


class ExtractRequest(BaseModel):
    url: str


class ExtractResponse(BaseModel):
    title: Optional[str] = None
    markdown: Optional[str] = None
    html: Optional[str] = None


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/extract", response_model=ExtractResponse)
def extract(req: ExtractRequest):
    page = StealthyFetcher.fetch(req.url, headless=True, network_idle=True)
    html = getattr(page, "html_content", None) or getattr(page, "body", None) or str(page)

    title = None
    content_html = html
    if ReadabilityDocument is not None:
        try:
            doc = ReadabilityDocument(html)
            title = doc.short_title()
            content_html = doc.summary(html_partial=True)
        except Exception:
            content_html = html

    markdown = md(content_html, heading_style="ATX") if content_html else ""

    return ExtractResponse(title=title, markdown=markdown, html=content_html)
