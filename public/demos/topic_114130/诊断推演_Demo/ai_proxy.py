# -*- coding: utf-8 -*-
"""
======================================================
  AI代理脚本 — 诊断推演Demo
  文件路径: d:\Trae\Trae挑战赛文件\医学模拟推演\ai_proxy.py
  功能: 作为智谱AI GLM-4.7-Flash的CORS代理，解决浏览器跨域限制
  使用: python ai_proxy.py
  依赖: 仅需Python标准库，无需安装第三方包
======================================================
"""

# ==================== 配置区域（方便修改）====================
# 智谱AI API端点
API_ENDPOINT = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
# 智谱AI API密钥
API_KEY = "用户自己的APIkey"
# 使用的模型名称（GLM-4.7-Flash免费模型）
MODEL_NAME = "glm-4.7-flash"
# 代理服务监听端口
PROXY_PORT = 8899
# ==================== 配置区域结束 ==========================

import json
import time
import urllib.request
import urllib.error
from http.server import HTTPServer, BaseHTTPRequestHandler


class AIProxyHandler(BaseHTTPRequestHandler):
    """
    AI代理请求处理器
    处理前端发来的AI对话请求，转发到智谱API，并解决CORS跨域问题
    """

    def do_OPTIONS(self):
        """
        处理CORS预检请求（OPTIONS方法）
        浏览器在发送跨域POST请求前会先发送OPTIONS请求
        """
        self.send_response(200)
        self._set_cors_headers()
        self.end_headers()

    def do_GET(self):
        """
        处理GET请求
        目前仅支持 /health 健康检查端点
        前端通过访问 http://localhost:8899/health 检测代理是否在线
        """
        if self.path == '/health':
            # 健康检查：返回在线状态
            self.send_response(200)
            self._set_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            response = json.dumps({
                "status": "ok",
                "model": MODEL_NAME,
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S")
            }, ensure_ascii=False).encode('utf-8')
            self.wfile.write(response)
        else:
            # 其他GET请求返回404
            self.send_response(404)
            self._set_cors_headers()
            self.end_headers()

    def do_POST(self):
        """
        处理POST请求
        接收前端发来的对话请求，转发到智谱AI API
        请求体格式: {"messages": [{"role": "system", "content": "..."}, ...], "temperature": 0.7}
        响应体格式: {"reply": "AI回复内容", "usage": {...}} 或 {"error": "错误信息"}
        """
        if self.path == '/chat':
            self._handle_chat()
        else:
            self.send_response(404)
            self._set_cors_headers()
            self.end_headers()

    def _handle_chat(self):
        """
        处理聊天请求的核心方法
        1. 读取前端发来的messages数组
        2. 构建智谱API请求
        3. 发送请求并获取AI回复
        4. 返回回复给前端
        """
        request_start = time.time()

        try:
            # 读取请求体
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)

            # 获取前端发来的messages和可选参数
            messages = data.get('messages', [])
            temperature = data.get('temperature', 0.7)
            max_tokens = data.get('max_tokens', 1024)

            # 构建智谱API请求体
            api_body = json.dumps({
                "model": MODEL_NAME,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens
            }, ensure_ascii=False).encode('utf-8')

            # 创建API请求
            req = urllib.request.Request(
                API_ENDPOINT,
                data=api_body,
                headers={
                    'Content-Type': 'application/json; charset=utf-8',
                    'Authorization': f'Bearer {API_KEY}'
                },
                method='POST'
            )

            # 发送请求并获取响应（设置15秒超时）
            elapsed_ms = 0
            try:
                with urllib.request.urlopen(req, timeout=15) as response:
                    api_response = json.loads(response.read().decode('utf-8'))
                    # 提取AI回复内容
                    reply = api_response.get('choices', [{}])[0].get('message', {}).get('content', '')
                    usage = api_response.get('usage', {})
                    elapsed_ms = int((time.time() - request_start) * 1000)

                    # 打印日志
                    print(f"[{time.strftime('%H:%M:%S')}] ✅ 请求成功 | 耗时: {elapsed_ms}ms | "
                          f"Token: {usage.get('total_tokens', '?')} | "
                          f"回复长度: {len(reply)}字")

                    # 返回成功响应
                    self.send_response(200)
                    self._set_cors_headers()
                    self.send_header('Content-Type', 'application/json; charset=utf-8')
                    self.end_headers()
                    response_body = json.dumps({
                        "reply": reply,
                        "usage": usage,
                        "elapsed_ms": elapsed_ms
                    }, ensure_ascii=False).encode('utf-8')
                    self.wfile.write(response_body)

            except urllib.error.HTTPError as e:
                # API返回错误
                error_body = e.read().decode('utf-8', errors='replace')
                elapsed_ms = int((time.time() - request_start) * 1000)
                print(f"[{time.strftime('%H:%M:%S')}] ❌ API错误 | HTTP {e.code} | 耗时: {elapsed_ms}ms")
                print(f"  错误详情: {error_body[:200]}")

                self.send_response(e.code)
                self._set_cors_headers()
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                error_response = json.dumps({
                    "error": f"API错误(HTTP {e.code}): {error_body[:500]}",
                    "elapsed_ms": elapsed_ms
                }, ensure_ascii=False).encode('utf-8')
                self.wfile.write(error_response)

            except urllib.error.URLError as e:
                # 网络错误
                elapsed_ms = int((time.time() - request_start) * 1000)
                print(f"[{time.strftime('%H:%M:%S')}] ❌ 网络错误 | {str(e.reason)} | 耗时: {elapsed_ms}ms")

                self.send_response(502)
                self._set_cors_headers()
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                error_response = json.dumps({
                    "error": f"网络错误: {str(e.reason)}",
                    "elapsed_ms": elapsed_ms
                }, ensure_ascii=False).encode('utf-8')
                self.wfile.write(error_response)

        except Exception as e:
            # 其他异常
            elapsed_ms = int((time.time() - request_start) * 1000)
            print(f"[{time.strftime('%H:%M:%S')}] ❌ 服务器错误 | {str(e)} | 耗时: {elapsed_ms}ms")

            self.send_response(500)
            self._set_cors_headers()
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            error_response = json.dumps({
                "error": f"服务器内部错误: {str(e)}",
                "elapsed_ms": elapsed_ms
            }, ensure_ascii=False).encode('utf-8')
            self.wfile.write(error_response)

    def _set_cors_headers(self):
        """
        设置CORS响应头
        允许任意域名的跨域请求
        """
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    def log_message(self, format, *args):
        """
        覆盖默认的日志输出（避免HTTP访问日志刷屏）
        """
        pass  # 静默处理，日志在_handle_chat中按需打印


def main():
    """
    主函数：启动AI代理服务器
    """
    print("=" * 60)
    print("  🤖 诊断推演 — AI代理服务器")
    print("=" * 60)
    print(f"  📡 监听地址: http://localhost:{PROXY_PORT}")
    print(f"  🧠 AI模型:   {MODEL_NAME}")
    print(f"  🔗 API端点:  {API_ENDPOINT}")
    print(f"  ⏱  超时设置: 15秒")
    print("-" * 60)
    print("  使用方法:")
    print("    1. 保持此窗口运行")
    print("    2. 在浏览器中打开 诊断推演_Demo.html")
    print("    3. 问诊界面将自动检测代理状态（🟢在线/🟡离线）")
    print("-" * 60)
    print("  等待请求中...")
    print("=" * 60)

    try:
        server = HTTPServer(('localhost', PROXY_PORT), AIProxyHandler)
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n\n  👋 代理服务器已停止")
    except Exception as e:
        print(f"\n  ❌ 启动失败: {e}")
        print(f"  提示: 端口 {PROXY_PORT} 可能被占用，请修改脚本中的 PROXY_PORT")


if __name__ == '__main__':
    main()
