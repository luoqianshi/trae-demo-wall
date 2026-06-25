#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
声脉APP 后端服务 (本地开发版)
基于 Python 标准库实现，无需安装第三方依赖。

功能：
  1. 提供RESTful API，从 mock/backend-mock.json 读取数据返回给前端
  2. 提供静态文件服务（HTML/JS/CSS/JSON 等）
  3. 支持 CORS 跨域
  4. 统一响应格式与错误处理
  5. Mock 数据热更新（文件修改后自动重新加载）

启动：python backend.py
访问：http://localhost:8080/声脉APP.html
"""

import http.server
import json
import os
import sys
import time
from http import HTTPStatus
from urllib.parse import urlparse

# ============ 配置 ============
PORT = 8000
HOST = "0.0.0.0"  # 允许局域网访问
ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
MOCK_FILE = os.path.join(ROOT_DIR, "mock", "backend-mock.json")

# ============ Mock 数据加载（支持热更新）============
_mock_data = None
_mock_mtime = 0


def get_mock_data():
    """加载并缓存 mock 数据，文件修改后自动重新加载"""
    global _mock_data, _mock_mtime
    try:
        mtime = os.path.getmtime(MOCK_FILE)
        if _mock_data is None or mtime != _mock_mtime:
            with open(MOCK_FILE, "r", encoding="utf-8") as f:
                _mock_data = json.load(f)
            _mock_mtime = mtime
            print(f"[backend] Mock 数据已加载 ({len(_mock_data)} 个顶层键)")
        return _mock_data
    except FileNotFoundError:
        print(f"[backend] 错误: Mock 文件不存在: {MOCK_FILE}", file=sys.stderr)
        return None
    except json.JSONDecodeError as e:
        print(f"[backend] 错误: Mock 文件 JSON 格式错误: {e}", file=sys.stderr)
        return None


# ============ API 路由定义 ============
# 格式: { 路由路径: (mock数据顶层key, 子key或None) }
API_ROUTES = {
    "/api/family-members":         ("familyMembers", None),
    "/api/ai/models":              ("ai", "models"),
    "/api/ai/chat-history":        ("ai", "chatHistory"),
    "/api/ai/recent-summaries":    ("ai", "recentSummaries"),
    "/api/ai/replies":             ("ai", "replies"),
    "/api/stories":                ("stories", None),
    "/api/user/profile":           ("user", "profile"),
    "/api/user/security":          ("user", "security"),
    "/api/user/phone":             ("user", "phone"),
    "/api/user/privacy":           ("user", "privacy"),
    "/api/user/recording-quality": ("user", "recordingQuality"),
    "/api/search/hot-words":       ("search", "hotWords"),
    "/api/stats/home":             ("stats", "home"),
}


# ============ 统一响应格式 ============
def make_response(code, message, data=None):
    """构造统一响应体"""
    return {
        "code": code,       # 0=成功, 非0=失败
        "message": message,  # 描述信息
        "data": data,        # 业务数据
        "timestamp": int(time.time() * 1000),
    }


# ============ 请求处理器 ============
class BackendHandler(http.server.SimpleHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        # 设置静态文件根目录
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    # ---- 路由入口 ----
    def do_GET(self):
        """处理 GET 请求：API 请求走 API 逻辑，其他走静态文件"""
        parsed = urlparse(self.path)
        path = parsed.path

        # 健康检查
        if path == "/api/health":
            self.handle_health()
            return

        # API 列表
        if path == "/api":
            self.handle_api_list()
            return

        # API 路由
        if path in API_ROUTES:
            self.handle_api(path)
            return

        # 静态文件
        super().do_GET()

    def do_OPTIONS(self):
        """处理 CORS 预检请求"""
        self.send_response(HTTPStatus.NO_CONTENT)
        self.end_headers()

    # ---- API 处理 ----
    def handle_health(self):
        """健康检查端点"""
        self.send_json_response(0, "ok", {
            "service": "声脉APP后端",
            "status": "running",
            "port": PORT,
            "mockLoaded": _mock_data is not None,
            "apiCount": len(API_ROUTES),
        })

    def handle_api_list(self):
        """返回所有可用 API 列表"""
        apis = [{"method": "GET", "path": p} for p in sorted(API_ROUTES.keys())]
        apis.insert(0, {"method": "GET", "path": "/api/health"})
        apis.insert(0, {"method": "GET", "path": "/api"})
        self.send_json_response(0, "ok", apis)

    def handle_api(self, path):
        """处理 API 请求，从 mock 数据中读取并返回"""
        try:
            data = get_mock_data()
            if data is None:
                self.send_json_response(5001, "Mock 数据加载失败，请检查 backend-mock.json", None, status=500)
                return

            top_key, sub_key = API_ROUTES[path]

            if top_key not in data:
                self.send_json_response(4004, f"数据不存在: {top_key}", None, status=404)
                return

            result = data[top_key]
            if sub_key:
                if isinstance(result, dict) and sub_key in result:
                    result = result[sub_key]
                else:
                    self.send_json_response(4004, f"数据不存在: {top_key}.{sub_key}", None, status=404)
                    return

            self.send_json_response(0, "success", result)

        except Exception as e:
            print(f"[backend] API 处理异常 {path}: {e}", file=sys.stderr)
            self.send_json_response(5000, f"服务器内部错误: {e}", None, status=500)

    # ---- 响应工具 ----
    def send_json_response(self, code, message, data, status=200):
        """发送统一格式的 JSON 响应"""
        body = make_response(code, message, data)
        body_bytes = json.dumps(body, ensure_ascii=False).encode("utf-8")

        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body_bytes)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body_bytes)

    def end_headers(self):
        """为所有响应添加 CORS 头"""
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        super().end_headers()

    def log_message(self, format, *args):
        """自定义日志格式"""
        # 静态文件请求用灰色，API 请求用高亮
        path = self.path if isinstance(self.path, str) else str(self.path)
        if "/api/" in path:
            print(f"[{self.log_date_time_string()}] \033[36m{format % args}\033[0m")
        else:
            print(f"[{self.log_date_time_string()}] \033[90m{format % args}\033[0m")


# ============ 多线程服务器 ============
class ThreadingHTTPServer(http.server.ThreadingHTTPServer):
    daemon_threads = True
    allow_reuse_address = True


# ============ 启动入口 ============
def print_banner():
    print("\n" + "=" * 64)
    print("  声脉APP 后端服务 (本地开发版)  —  Python 标准库实现")
    print("=" * 64)
    print(f"  监听地址      : http://{HOST}:{PORT}")
    print(f"  静态文件根目录: {ROOT_DIR}")
    print(f"  Mock 数据文件 : {MOCK_FILE}")
    print(f"  前端访问地址  : http://localhost:{PORT}/声脉APP.html")
    print("-" * 64)
    print("  可用 API 端点:")
    print(f"    GET  /api/health            健康检查")
    print(f"    GET  /api                   API 列表")
    for route in sorted(API_ROUTES.keys()):
        top_key, sub_key = API_ROUTES[route]
        desc = f"{top_key}.{sub_key}" if sub_key else top_key
        print(f"    GET  {route:<28} ← {desc}")
    print("-" * 64)
    print("  按 Ctrl+C 停止服务")
    print("=" * 64 + "\n")


def main():
    # 启动时预加载 mock 数据
    mock = get_mock_data()
    if mock is None:
        print("[backend] 警告: Mock 数据为空，请检查 mock/backend-mock.json")

    print_banner()

    server = ThreadingHTTPServer((HOST, PORT), BackendHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[backend] 服务已停止")
        server.shutdown()
        server.server_close()


if __name__ == "__main__":
    main()
