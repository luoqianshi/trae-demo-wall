#!/usr/bin/env python3
import http.server
import os
import sys
import webbrowser
import threading
import time

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    server = http.server.HTTPServer(('0.0.0.0', PORT), MyHTTPRequestHandler)
    url = f'http://localhost:{PORT}/html/index.html'
    
    def open_browser():
        time.sleep(1)
        webbrowser.open(url)
    
    print(f"\n🚀 CodeArchaeology Server Starting...")
    print(f"📡 Server address: {url}")
    print(f"📂 Serving directory: {os.getcwd()}")
    print(f"⏎ Press Ctrl+C to stop the server\n")
    
    threading.Thread(target=open_browser, daemon=True).start()
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n✅ Server stopped gracefully")
        server.server_close()

if __name__ == '__main__':
    main()