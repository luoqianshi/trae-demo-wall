#!/usr/bin/env python3
# CosLens 本地服务：静态托管 + AI 代理（解决浏览器 CORS，且 Key 只留在服务端）
#
# 运行：  python server.py           （默认端口 8123）
# 依赖：  仅 Python 标准库，无需 pip
#
# Key 读取优先级：环境变量 COSLENS_API_KEY  >  同目录 api-key.txt
# 前端 POST /api/analyze -> 本服务注入 Authorization 后转发到 aliyun。

import json
import os
import sys
import urllib.request
import urllib.error
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from functools import partial

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("COSLENS_PORT", "8123"))
UPSTREAM = os.environ.get(
    "COSLENS_BASE_URL",
    "https://ws-1da64h9gkcgugzf4.cn-beijing.maas.aliyuncs.com/compatible-mode/v1",
).rstrip("/")


def load_key():
    k = os.environ.get("COSLENS_API_KEY", "").strip()
    if k:
        return k
    p = os.path.join(HERE, "api-key.txt")
    if os.path.exists(p):
        with open(p, "r", encoding="utf-8") as f:
            return f.read().strip()
    return ""


API_KEY = load_key()


class Handler(SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path.rstrip("/") == "/api/analyze":
            self.handle_proxy()
        else:
            self.send_error(404, "Not Found")

    def handle_proxy(self):
        if not API_KEY:
            return self._json(500, {"error": "服务端未配置 API Key（api-key.txt 或环境变量 COSLENS_API_KEY）"})
        try:
            length = int(self.headers.get("Content-Length", "0"))
            body = self.rfile.read(length)
            req = urllib.request.Request(
                UPSTREAM + "/chat/completions",
                data=body,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + API_KEY,
                },
                method="POST",
            )
            with urllib.request.urlopen(req, timeout=60) as resp:
                data = resp.read()
                self._raw(resp.status, data)
        except urllib.error.HTTPError as e:
            self._raw(e.code, e.read())
        except Exception as e:
            self._json(502, {"error": "代理转发失败: " + str(e)})

    def _json(self, status, obj):
        self._raw(status, json.dumps(obj, ensure_ascii=False).encode("utf-8"))

    def _raw(self, status, data):
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        sys.stderr.write("[coslens] " + (fmt % args) + "\n")


def main():
    handler = partial(Handler, directory=HERE)
    httpd = ThreadingHTTPServer(("127.0.0.1", PORT), handler)
    key_state = "已加载" if API_KEY else "未配置(!)"
    print(f"CosLens 服务已启动: http://127.0.0.1:{PORT}")
    print(f"  静态目录: {HERE}")
    print(f"  上游 API: {UPSTREAM}")
    print(f"  API Key : {key_state}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止")


if __name__ == "__main__":
    main()
