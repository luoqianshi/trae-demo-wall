import http.server
import json
import os
import sys
import webbrowser
import threading

# 兼容 PyInstaller 打包：打包后资源在 exe 同级目录
if getattr(sys, 'frozen', False):
    SCRIPT_DIR = os.path.dirname(sys.executable)
else:
    SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

CONFIG_FILE = os.path.join(SCRIPT_DIR, "playlist_config.json")
PORT = 8765

class RoseHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=SCRIPT_DIR, **kwargs)

    def end_headers(self):
        # 禁用缓存，确保每次请求都返回最新文件
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

    def do_GET(self):
        # 静默忽略 favicon 请求
        if self.path == '/favicon.ico':
            self.send_response(204)
            self.end_headers()
            return
        # API: 读取配置文件
        if self.path == '/api/config':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            config = {}
            if os.path.exists(CONFIG_FILE):
                with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                    config = json.load(f)
            self.wfile.write(json.dumps(config, ensure_ascii=False).encode('utf-8'))
            return
        # 其他请求走默认文件服务
        super().do_GET()

    def do_POST(self):
        # API: 保存配置文件
        if self.path == '/api/config':
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            try:
                data = json.loads(body.decode('utf-8'))
                # 播放列表去重
                if 'playlist' in data and isinstance(data['playlist'], list):
                    seen = set()
                    unique = []
                    for item in data['playlist']:
                        fname = item.get('filename', '')
                        if fname and fname not in seen:
                            seen.add(fname)
                            unique.append(item)
                    data['playlist'] = unique
                with open(CONFIG_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(b'{"ok":true}')
            except Exception as e:
                self.send_response(500)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(json.dumps({"ok": False, "error": str(e)}).encode('utf-8'))
            return
        self.send_response(404)
        self.end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def log_message(self, format, *args):
        # 静默日志，只打印 API 请求
        try:
            msg = format % args if args else format
            if '/api/' in str(msg):
                print(f"[API] {msg}")
        except:
            pass

def open_browser():
    webbrowser.open(f'http://localhost:{PORT}/rose_bloom.html')

if __name__ == '__main__':
    server = http.server.HTTPServer(('127.0.0.1', PORT), RoseHandler)
    print(f"Rose Bloom Server running at http://localhost:{PORT}/")
    print(f"Config file: {CONFIG_FILE}")
    # 延迟打开浏览器
    threading.Timer(0.5, open_browser).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped.")
        server.server_close()
