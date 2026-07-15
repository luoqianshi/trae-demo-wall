import http.server
import socketserver
import urllib.request
import urllib.error
import os

PORT = 8080

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def do_GET(self):
        # 瓦片代理: /tiles/https://a.tile.openstreetmap.org/15/26299/13060.png
        if self.path.startswith('/tiles/'):
            tile_url = 'https://' + self.path[7:]
            try:
                req = urllib.request.Request(tile_url, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                })
                with urllib.request.urlopen(req, timeout=15) as response:
                    self.send_response(response.status)
                    content_type = response.headers.get('Content-Type', 'image/png')
                    self.send_header('Content-Type', content_type)
                    self.send_header('Cache-Control', 'public, max-age=86400')
                    self.end_headers()
                    self.wfile.write(response.read())
            except Exception as e:
                # 返回1x1透明PNG作为fallback
                self.send_response(200)
                self.send_header('Content-Type', 'image/png')
                self.end_headers()
                # 1x1 transparent PNG
                self.wfile.write(bytes([
                    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,
                    0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,
                    0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
                    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,
                    0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,
                    0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
                    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,
                    0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,
                    0x42, 0x60, 0x82
                ]))
            return

        # 静态文件服务
        super().do_GET()

os.chdir(os.path.dirname(os.path.abspath(__file__)))
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"代理服务器运行中: http://localhost:{PORT}")
    print(f"瓦片代理路径: /tiles/<原始瓦片URL>")
    httpd.serve_forever()
