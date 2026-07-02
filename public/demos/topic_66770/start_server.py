import http.server
import socketserver
import os
import webbrowser
import sys

PORT = 8080

os.chdir(os.path.dirname(os.path.abspath(__file__)))

Handler = http.server.SimpleHTTPRequestHandler

try:
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"守护天使服务器已启动，端口: {PORT}")
        print(f"访问地址: http://localhost:{PORT}/index.html")
        print("按 Ctrl+C 停止服务器")
        webbrowser.open(f"http://localhost:{PORT}/index.html")
        httpd.serve_forever()
except KeyboardInterrupt:
    print("\n服务器已停止")
    sys.exit(0)