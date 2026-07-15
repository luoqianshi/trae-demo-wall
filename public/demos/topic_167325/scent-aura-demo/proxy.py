"""
气味aura - DeepSeek API 本地代理
解决浏览器 CORS 跨域限制

使用方法：
1. 确保已安装 Python 3
2. 运行：python proxy.py
3. 代理地址：http://localhost:5678
4. 不要关闭此窗口，保持代理运行
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import json
import ssl

DEEPSEEK_BASE = "https://api.deepseek.com"
PORT = 5678

class ProxyHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        # CORS 预检请求
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Max-Age", "86400")
        self.end_headers()

    def do_POST(self):
        # 读取请求体
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        # 构建转发请求
        target_url = DEEPSEEK_BASE + self.path
        req = urllib.request.Request(
            target_url,
            data=body,
            headers={
                "Content-Type": "application/json",
                "Authorization": self.headers.get("Authorization", "")
            },
            method="POST"
        )

        try:
            ctx = ssl.create_default_context()
            with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                resp_data = resp.read()

                self.send_response(resp.status)
                self.send_header("Content-Type", "application/json")
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(resp_data)
        except urllib.error.HTTPError as e:
            self.send_response(e.code)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            error_msg = json.dumps({"error": {"message": str(e)}})
            self.wfile.write(error_msg.encode())
        except Exception as e:
            self.send_response(502)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            error_msg = json.dumps({"error": {"message": f"Proxy error: {str(e)}"}})
            self.wfile.write(error_msg.encode())

    def do_GET(self):
        # 支持 GET 请求转发
        target_url = DEEPSEEK_BASE + self.path
        if self.headers.get("Authorization"):
            req = urllib.request.Request(
                target_url,
                headers={
                    "Authorization": self.headers.get("Authorization", "")
                }
            )
            try:
                ctx = ssl.create_default_context()
                with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
                    resp_data = resp.read()
                    self.send_response(resp.status)
                    self.send_header("Content-Type", resp.headers.get("Content-Type", "application/json"))
                    self.send_header("Access-Control-Allow-Origin", "*")
                    self.end_headers()
                    self.wfile.write(resp_data)
            except Exception as e:
                self.send_response(502)
                self.send_header("Access-Control-Allow-Origin", "*")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
        else:
            self.send_response(400)
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()

    def log_message(self, format, *args):
        # 简化日志输出
        print(f"[Proxy] {args[0]}")

if __name__ == "__main__":
    server = HTTPServer(("127.0.0.1", PORT), ProxyHandler)
    print(f"=" * 50)
    print(f"  气味aura DeepSeek 代理已启动")
    print(f"  地址: http://localhost:{PORT}")
    print(f"  转发到: {DEEPSEEK_BASE}")
    print(f"  保持此窗口运行，不要关闭")
    print(f"=" * 50)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n代理已停止")
        server.server_close()
