#!/usr/bin/env python3
import http.server
import socketserver
import os
import sys

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()
    
    def guess_type(self, path):
        mtype = super().guess_type(path)
        if mtype.startswith('text/'):
            mtype += '; charset=UTF-8'
        return mtype

if __name__ == "__main__":
    os.chdir(os.path.dirname(os.path.abspath(sys.argv[0])))
    
    with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
        print(f"? ????????????????????: http://localhost:{PORT}")
        print(f"? ?????: {os.getcwd()}")
        print("?? Ctrl+C ????????")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n? ??????????")
            httpd.server_close()
