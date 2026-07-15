# AI 代理服务器 —— 保护 DeepSeek API Key 不暴露给前端
# 启动方式：python server.py
# 需要先设置环境变量：DEEPSEEK_API_KEY=sk-xxxx
# 或直接修改下方 API_KEY 变量

import json
import os
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.request import Request, urlopen
from urllib.error import URLError

PORT = 3000
# 在此处填入你的 DeepSeek API Key，或设置环境变量
API_KEY = os.environ.get('DEEPSEEK_API_KEY', 'sk-此处替换为你的DeepSeek API Key')
DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'


class AIProxyHandler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(204)
        self._send_cors_headers()
        self.end_headers()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')

        try:
            request_data = json.loads(body)
        except json.JSONDecodeError:
            self._send_json(400, {'error': '请求格式错误'})
            return

        # 构造 DeepSeek 请求
        payload = {
            'model': request_data.get('model', 'deepseek-chat'),
            'messages': request_data.get('messages', []),
            'temperature': request_data.get('temperature', 0.7),
            'max_tokens': request_data.get('max_tokens', 2000),
            'response_format': request_data.get('response_format', {'type': 'json_object'})
        }

        try:
            req = Request(
                DEEPSEEK_URL,
                data=json.dumps(payload).encode('utf-8'),
                headers={
                    'Content-Type': 'application/json',
                    'Authorization': f'Bearer {API_KEY}'
                },
                method='POST'
            )
            with urlopen(req, timeout=30) as resp:
                result = resp.read().decode('utf-8')
                self._send_json(200, json.loads(result))
        except URLError as e:
            self._send_json(502, {'error': f'DeepSeek API 请求失败: {str(e)}'})
        except Exception as e:
            self._send_json(500, {'error': f'代理服务器错误: {str(e)}'})

    def _send_json(self, status, data):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self._send_cors_headers()
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def _send_cors_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def log_message(self, format, *args):
        # 简化日志输出
        print(f'[{self.log_date_time_string()}] {args[0]}')


if __name__ == '__main__':
    server = HTTPServer(('127.0.0.1', PORT), AIProxyHandler)
    print(f'AI 代理服务器已启动: http://localhost:{PORT}')
    print('等待前端调用...')
    print()
    print('提示：如果 API Key 未配置，请编辑 server.py 中的 API_KEY 变量')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n服务器已停止')
        server.server_close()
