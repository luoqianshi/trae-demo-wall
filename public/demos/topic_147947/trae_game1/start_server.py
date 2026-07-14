#!/usr/bin/env python3
"""图幻 3D - 本地开发服务器

由于浏览器安全策略，直接双击打开 HTML 可能无法加载本地 .wasm/.onnx 模型。
建议通过本服务器访问项目：

    python start_server.py

然后浏览器打开：http://localhost:8000
"""
import http.server
import socketserver
import os

PORT = 8000
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header("Cross-Origin-Opener-Policy", "same-origin")
        self.send_header("Cross-Origin-Embedder-Policy", "require-corp")
        super().end_headers()

if __name__ == "__main__":
    print(f"\n✅ 图幻 3D 本地服务器已启动")
    print(f"   访问地址：http://localhost:{PORT}\n")
    print("   按 Ctrl+C 停止服务器\n")
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")
