#!/usr/bin/env python3
"""静态文件服务器 + LLM CORS 代理（仅用于本地开发）。"""

from __future__ import annotations

import gzip
import json
import os
import sys
import urllib.error
import urllib.request
import zlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

PORT = int(os.environ.get("PORT", "8080"))
ROOT = os.path.dirname(os.path.abspath(__file__))

ALLOWED_SCHEMES = {"http", "https"}
HOP_BY_HOP = {
    "connection",
    "keep-alive",
    "proxy-authenticate",
    "proxy-authorization",
    "te",
    "trailers",
    "transfer-encoding",
    "upgrade",
    "host",
    "content-length",
    "content-encoding",
    "x-proxy-target",
    "accept-encoding",
}


def decode_content(body: bytes, content_encoding: str | None) -> bytes:
    if not body or not content_encoding:
        return body
    encoding = content_encoding.lower().strip()
    try:
        if encoding == "gzip":
            return gzip.decompress(body)
        if encoding == "deflate":
            try:
                return zlib.decompress(body)
            except zlib.error:
                return zlib.decompress(body, -zlib.MAX_WBITS)
        if encoding == "br":
            try:
                import brotli  # type: ignore
                return brotli.decompress(body)
            except Exception:
                sys.stderr.write("[proxy] 收到 br 压缩但未安装 brotli，可能出现乱码\n")
                return body
    except Exception as e:
        sys.stderr.write(f"[proxy] 解压失败 ({encoding}): {e}\n")
        return body
    return body


def normalize_content_type(content_type: str | None) -> str:
    if not content_type:
        return "application/json; charset=utf-8"
    ct = content_type
    if "charset=" not in ct.lower() and (
        "json" in ct.lower() or "text/" in ct.lower() or "event-stream" in ct.lower()
    ):
        ct = f"{ct}; charset=utf-8"
    return ct


def is_event_stream(content_type: str | None) -> bool:
    return bool(content_type and "event-stream" in content_type.lower())


class ManhuaHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        super().end_headers()

    def do_OPTIONS(self):
        if self.path == "/__proxy" or self.path.startswith("/__proxy?"):
            self.send_response(204)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
            self.send_header(
                "Access-Control-Allow-Headers",
                "Content-Type, Authorization, x-api-key, anthropic-version, X-Proxy-Target",
            )
            self.send_header("Access-Control-Max-Age", "86400")
            self.end_headers()
            return
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        if self.path == "/__proxy" or self.path.startswith("/__proxy?"):
            self._proxy()
            return
        self.send_error(404, "Not Found")

    def do_GET(self):
        if self.path == "/__proxy" or self.path.startswith("/__proxy?"):
            self.send_error(405, "Use POST for /__proxy")
            return
        return super().do_GET()

    def _proxy(self):
        target = self.headers.get("X-Proxy-Target", "").strip()
        if not target:
            self._json_error(400, "缺少 X-Proxy-Target 请求头")
            return

        parsed = urlparse(target)
        if parsed.scheme not in ALLOWED_SCHEMES or not parsed.netloc:
            self._json_error(400, f"非法目标地址: {target}")
            return

        length = int(self.headers.get("Content-Length", "0") or 0)
        body = self.rfile.read(length) if length > 0 else None

        out_headers = {}
        for key, value in self.headers.items():
            if key.lower() in HOP_BY_HOP:
                continue
            out_headers[key] = value
        out_headers["Accept-Encoding"] = "identity"

        req = urllib.request.Request(
            target,
            data=body,
            headers=out_headers,
            method="POST",
        )

        try:
            with urllib.request.urlopen(req, timeout=300) as resp:
                content_type = normalize_content_type(resp.headers.get("Content-Type"))
                encoding = resp.headers.get("Content-Encoding")

                # SSE：边收边转，避免推理模型长时间无输出
                if is_event_stream(content_type) and not encoding:
                    self.send_response(resp.status)
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.send_header("Content-Type", content_type)
                    self.send_header("Cache-Control", "no-cache")
                    self.send_header("X-Accel-Buffering", "no")
                    self.end_headers()
                    while True:
                        chunk = resp.read(4096)
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                        try:
                            self.wfile.flush()
                        except Exception:
                            break
                    return

                raw = resp.read()
                resp_body = decode_content(raw, encoding)
                self.send_response(resp.status)
                self.send_header("Access-Control-Allow-Origin", "*")
                for key, value in resp.headers.items():
                    if key.lower() in HOP_BY_HOP:
                        continue
                    if key.lower() in {"content-encoding", "content-length"}:
                        continue
                    if key.lower() == "content-type":
                        value = normalize_content_type(value)
                    self.send_header(key, value)
                if not any(k.lower() == "content-type" for k in resp.headers.keys()):
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                self.send_header("Content-Length", str(len(resp_body)))
                self.end_headers()
                self.wfile.write(resp_body)
        except urllib.error.HTTPError as e:
            raw = e.read() if e.fp else b""
            encoding = e.headers.get("Content-Encoding") if e.headers else None
            err_body = decode_content(raw, encoding)
            self.send_response(e.code)
            self.send_header("Access-Control-Allow-Origin", "*")
            content_type = normalize_content_type(
                e.headers.get("Content-Type") if e.headers else None
            )
            self.send_header("Content-Type", content_type)
            self.send_header("Content-Length", str(len(err_body)))
            self.end_headers()
            self.wfile.write(err_body)
        except Exception as e:
            self._json_error(502, f"代理请求失败: {e}")

    def _json_error(self, code, message):
        payload = json.dumps({"error": {"message": message}}, ensure_ascii=False).encode(
            "utf-8"
        )
        self.send_response(code)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def main():
    os.chdir(ROOT)
    server = ThreadingHTTPServer(("0.0.0.0", PORT), ManhuaHandler)
    print("🚀 漫剧制作陪跑 本地服务")
    print(f"📂 目录: {ROOT}")
    print(f"🔗 地址: http://localhost:{PORT}")
    print("🔀 LLM 代理: POST /__proxy (X-Proxy-Target) · SSE 流式转发")
    print("💡 按 Ctrl+C 停止")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 已停止")
        server.server_close()


if __name__ == "__main__":
    main()
