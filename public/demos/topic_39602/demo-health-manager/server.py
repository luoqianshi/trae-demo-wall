#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI 家庭健康管家 - 简单后端服务
提供数据同步API
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import os
import uuid
from datetime import datetime

DATA_DIR = os.path.join(os.getcwd(), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

class HealthDataHandler(BaseHTTPRequestHandler):
    def _set_headers(self, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_OPTIONS(self):
        self._set_headers()

    def _get_file_path(self, family_id):
        return os.path.join(DATA_DIR, f'{family_id}.json')

    def _load_data(self, family_id):
        filepath = self._get_file_path(family_id)
        if os.path.exists(filepath):
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {
            'family_id': family_id,
            'family_name': '',
            'members': [],
            'medicines': [],
            'health_records': {},
            'checkups': {},
            'reports': [],
            'notifications': [],
            'vaccine_records': {},
            'custom_medicine_db': {},
            'last_sync': None
        }

    def _save_data(self, family_id, data):
        filepath = self._get_file_path(family_id)
        data['last_sync'] = datetime.now().isoformat()
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

    def do_GET(self):
        path = self.path
        
        if path.startswith('/api/data/'):
            family_id = path.split('/')[-1]
            data = self._load_data(family_id)
            self._set_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode())
        elif path == '/api/health':
            self._set_headers()
            self.wfile.write(json.dumps({'status': 'ok'}).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'Not found'}).encode())

    def do_POST(self):
        path = self.path
        content_length = int(self.headers.get('Content-Length', 0))
        body = self.rfile.read(content_length).decode('utf-8')
        
        try:
            payload = json.loads(body) if body else {}
        except:
            payload = {}

        if path.startswith('/api/sync/'):
            family_id = path.split('/')[-1]
            data = self._load_data(family_id)
            
            # 合并数据
            if 'family_name' in payload:
                data['family_name'] = payload['family_name']
            if 'members' in payload:
                data['members'] = payload['members']
            if 'medicines' in payload:
                data['medicines'] = payload['medicines']
            if 'health_records' in payload:
                data['health_records'] = payload['health_records']
            if 'checkups' in payload:
                data['checkups'] = payload['checkups']
            if 'reports' in payload:
                data['reports'] = payload['reports']
            if 'notifications' in payload:
                data['notifications'] = payload['notifications']
            if 'vaccine_records' in payload:
                data['vaccine_records'] = payload['vaccine_records']
            if 'custom_medicine_db' in payload:
                data['custom_medicine_db'] = payload['custom_medicine_db']
            
            self._save_data(family_id, data)
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'last_sync': data['last_sync']
            }).encode())
        elif path == '/api/family/create':
            family_id = str(uuid.uuid4())[:8]
            family_name = payload.get('family_name', '我的家庭')
            data = self._load_data(family_id)
            data['family_name'] = family_name
            self._save_data(family_id, data)
            self._set_headers()
            self.wfile.write(json.dumps({
                'success': True,
                'family_id': family_id,
                'family_name': family_name
            }).encode())
        else:
            self._set_headers(404)
            self.wfile.write(json.dumps({'error': 'Not found'}).encode())

    def log_message(self, format, *args):
        # 简化日志输出
        pass

if __name__ == '__main__':
    PORT = 8081
    server = HTTPServer(('0.0.0.0', PORT), HealthDataHandler)
    print(f'Server running on http://localhost:{PORT}')
    server.serve_forever()
