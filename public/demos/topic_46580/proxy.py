"""
本地CORS代理服务器（多线程版）
用于代理前端跨域请求，解决外部CORS代理不稳定的问题
用法：python proxy.py  (默认监听 8081 端口)
"""

import http.server
import socketserver
import urllib.request
import json
import sys
import socket
from urllib.parse import urlparse, parse_qs

PORT = 8081

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)

        if parsed.path == '/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode())
            return

        if parsed.path == '/fetch':
            url = parse_qs(parsed.query).get('url', [''])[0]
            if not url:
                self._send_json(400, {'error': '缺少url参数'})
                return

            try:
                req = urllib.request.Request(
                    url,
                    headers={
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
                        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
                        'Accept-Encoding': 'identity',
                        'Referer': url,
                        'Connection': 'keep-alive',
                        'Upgrade-Insecure-Requests': '1',
                        'Sec-Fetch-Dest': 'document',
                        'Sec-Fetch-Mode': 'navigate',
                        'Sec-Fetch-Site': 'none',
                        'Sec-Fetch-User': '?1',
                        'Cache-Control': 'max-age=0',
                    }
                )
                with urllib.request.urlopen(req, timeout=20) as resp:
                    raw = resp.read()
                    # 处理 gzip 压缩（部分站点强制 gzip）
                    encoding = resp.headers.get('Content-Encoding', '')
                    if encoding == 'gzip':
                        import gzip
                        raw = gzip.decompress(raw)
                    elif encoding == 'deflate':
                        import zlib
                        raw = zlib.decompress(raw)
                    html = raw.decode('utf-8', errors='ignore')
                    # 检测反爬验证页
                    anti_crawl_hits = 0
                    for kw in ['安全验证', '请稍后重试', '百度安全验证', '人机验证', '验证码', '访问验证', 'protect=']:
                        if kw in html:
                            anti_crawl_hits += 1
                    if anti_crawl_hits >= 2:
                        self._send_json(200, {'html': html, 'antiCrawl': True, 'warning': '检测到反爬验证页面，抓取到的内容可能不是文章正文'})
                    else:
                        self._send_json(200, {'html': html})
            except Exception as e:
                self._send_json(502, {'error': str(e)})
        else:
            self._send_json(404, {'error': '未知路径'})

    def _send_json(self, code, data):
        self.send_response(code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode())

    def log_message(self, format, *args):
        print(f'[Proxy] {args[0]}')


class ThreadedHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    server = ThreadedHTTPServer(('127.0.0.1', port), ProxyHandler)
    print(f'本地CORS代理已启动: http://127.0.0.1:{port}')
    print(f'前端将通过此代理转发URL请求')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n代理已停止')
        server.server_close()
