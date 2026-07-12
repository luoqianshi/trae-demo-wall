#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
StudyAgent Local Backend Server
Serves static frontend files and proxies API requests to LLMs.
Uses only Python standard library (no pip install required for basic use).
"""

import http.server
import socketserver
import json
import os
import sys
import signal
import urllib.request
import urllib.error
import threading
import time

# ─── Configuration ───────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIR = os.path.dirname(BASE_DIR)  # parent dir contains index.html
PID_FILE = os.path.join(BASE_DIR, 'server.pid')
CONFIG_FILE = os.path.join(BASE_DIR, 'config.json')
EXAMPLE_CONFIG_FILE = os.path.join(BASE_DIR, 'config.example.json')
LOG_FILE = os.path.join(BASE_DIR, 'server.log')

DEFAULT_PORT = 8765
MAX_PORT_ATTEMPTS = 10

# ─── Logger ──────────────────────────────────────────────────
def log(msg):
    ts = time.strftime('%Y-%m-%d %H:%M:%S')
    line = f'[{ts}] {msg}'
    print(line, flush=True)
    try:
        with open(LOG_FILE, 'a', encoding='utf-8') as f:
            f.write(line + '\n')
    except Exception:
        pass

# ─── Config Loading ──────────────────────────────────────────
def load_config():
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            log(f'Warning: failed to load config.json: {e}')
    return {}

def save_pid(port):
    try:
        with open(PID_FILE, 'w') as f:
            f.write(str(os.getpid()))
    except Exception as e:
        log(f'Warning: failed to write PID file: {e}')

def remove_pid():
    try:
        if os.path.exists(PID_FILE):
            os.remove(PID_FILE)
    except Exception:
        pass

# ─── LLM API Caller ──────────────────────────────────────────
def call_llm(config, messages, temperature=0.7, max_tokens=4096):
    """Call the configured LLM API and return the response text."""
    provider = config.get('provider', 'mock')
    if provider == 'mock':
        return None  # signal frontend to use mock

    api_key = config.get('api_key', '')
    base_url = config.get('base_url', '').rstrip('/')
    model = config.get('model', '')
    temp = config.get('temperature', temperature)
    max_tok = config.get('max_tokens', max_tokens)

    if not api_key:
        return {'error': 'API Key 未配置，请在 config.json 中设置或使用 Mock 模式'}

    headers = {'Content-Type': 'application/json'}
    body = {}

    if provider in ('openai-compatible', 'deepseek', 'ollama', 'custom'):
        url = f'{base_url}/chat/completions'
        headers['Authorization'] = f'Bearer {api_key}'
        body = {
            'model': model,
            'messages': messages,
            'temperature': temp,
            'max_tokens': max_tok,
        }
    elif provider == 'gemini':
        url = f'{base_url}/chat/completions'
        headers['Authorization'] = f'Bearer {api_key}'
        body = {
            'model': model,
            'messages': messages,
            'temperature': temp,
            'max_tokens': max_tok,
        }
    elif provider == 'claude':
        # Anthropic uses a different API format, convert messages
        url = 'https://api.anthropic.com/v1/messages'
        headers['x-api-key'] = api_key
        headers['anthropic-version'] = '2023-06-01'
        # Convert OpenAI-format messages to Anthropic format
        system_msg = ''
        user_msgs = []
        for m in messages:
            if m['role'] == 'system':
                system_msg += m['content']
            else:
                user_msgs.append({'role': m['role'], 'content': m['content']})
        body = {
            'model': model,
            'max_tokens': max_tok,
            'messages': user_msgs,
        }
        if system_msg:
            body['system'] = system_msg
    else:
        return {'error': f'不支持的 Provider: {provider}'}

    data = json.dumps(body).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=headers, method='POST')

    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            resp_data = json.loads(resp.read().decode('utf-8'))
            if provider == 'claude':
                content = resp_data.get('content', [{}])
                text = content[0].get('text', '') if content else ''
            else:
                text = resp_data.get('choices', [{}])[0].get('message', {}).get('content', '')
            return {'content': text, 'model': resp_data.get('model', model), 'provider': provider}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='replace')
        log(f'LLM API HTTP error {e.code}: {err_body[:500]}')
        try:
            err_json = json.loads(err_body)
            err_msg = err_json.get('error', {}).get('message', err_body[:200])
        except Exception:
            err_msg = err_body[:200]
        return {'error': f'API 错误 ({e.code}): {err_msg}'}
    except urllib.error.URLError as e:
        log(f'LLM API connection error: {e}')
        return {'error': f'连接失败: {e.reason}'}
    except Exception as e:
        log(f'LLM API unexpected error: {e}')
        return {'error': f'请求失败: {str(e)}'}

# ─── HTTP Request Handler ────────────────────────────────────
MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.pdf': 'application/pdf',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
}

class StudyAgentHandler(http.server.SimpleHTTPRequestHandler):
    # Override directory to serve frontend files
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=FRONTEND_DIR, **kwargs)

    def log_message(self, format, *args):
        log(f'{self.address_string()} - {format % args}')

    def guess_type(self, path):
        ext = os.path.splitext(path)[1].lower()
        return MIME_TYPES.get(ext, 'application/octet-stream')

    def end_headers(self):
        # No CORS needed since same origin serves both static and API
        self.send_header('Cache-Control', 'no-cache')
        super().end_headers()

    # ── API routes ──────────────────────────────────────────
    def do_GET(self):
        if self.path == '/api/health':
            self._send_json({'status': 'ok', 'service': 'StudyAgent Local Backend'})
            return
        if self.path == '/api/config':
            self._handle_get_config()
            return
        if self.path == '/' or self.path == '':
            self.path = '/index.html'
        super().do_GET()

    def do_POST(self):
        if self.path == '/api/agent':
            self._handle_agent_request()
            return
        if self.path == '/api/test-connection':
            self._handle_test_connection()
            return
        self.send_error(404, 'Not Found')

    def _read_json_body(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length)
            return json.loads(body.decode('utf-8'))
        except json.JSONDecodeError:
            return None
        except Exception:
            return None

    def _send_json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))

    def _handle_agent_request(self):
        body = self._read_json_body()
        if body is None:
            self._send_json({'error': '无效的 JSON 请求体'}, 400)
            return

        config = load_config()
        use_mock = body.get('useMock', True) or config.get('provider', 'mock') == 'mock'

        if use_mock:
            # Signal frontend to use its built-in mock engine
            self._send_json({
                'mode': 'mock',
                'message': '请使用前端 Mock 引擎处理',
            })
            return

        messages = body.get('messages', [])
        temperature = body.get('temperature', 0.7)
        max_tokens = body.get('max_tokens', 4096)

        # Merge frontend-provided key (if any, for temporary use)
        runtime_config = dict(config)
        if body.get('apiKey'):
            runtime_config['api_key'] = body['apiKey']
        if body.get('baseUrl'):
            runtime_config['base_url'] = body['baseUrl']
        if body.get('model'):
            runtime_config['model'] = body['model']
        if body.get('provider'):
            runtime_config['provider'] = body['provider']

        result = call_llm(runtime_config, messages, temperature, max_tokens)
        if result is None:
            self._send_json({'mode': 'mock', 'message': '配置为 Mock 模式'})
        elif 'error' in result:
            self._send_json({'mode': 'error', 'error': result['error']}, 500)
        else:
            self._send_json({'mode': 'real', 'response': result})

    def _handle_test_connection(self):
        body = self._read_json_body() or {}
        config = load_config()
        runtime_config = dict(config)
        if body.get('apiKey'):
            runtime_config['api_key'] = body['apiKey']
        if body.get('baseUrl'):
            runtime_config['base_url'] = body['baseUrl']
        if body.get('model'):
            runtime_config['model'] = body['model']
        if body.get('provider'):
            runtime_config['provider'] = body['provider']

        if runtime_config.get('provider', 'mock') == 'mock':
            self._send_json({'ok': True, 'message': 'Mock 模式无需连接外部 API'})
            return

        # Send a minimal test message
        test_messages = [
            {'role': 'user', 'content': 'Hi, reply with "OK" if you can read this.'}
        ]
        result = call_llm(runtime_config, test_messages, temperature=0, max_tokens=10)
        if 'error' in result:
            self._send_json({'ok': False, 'error': result['error']}, 500)
        else:
            self._send_json({'ok': True, 'message': '连接成功！', 'model': result.get('model', '')})

    def _handle_get_config(self):
        config = load_config()
        # Never return the API key to frontend
        safe_config = {
            'provider': config.get('provider', 'mock'),
            'baseUrl': config.get('base_url', ''),
            'model': config.get('model', ''),
            'hasApiKey': bool(config.get('api_key', '')),
        }
        self._send_json(safe_config)

# ─── Port Finding ────────────────────────────────────────────
def find_available_port(start_port, max_attempts=MAX_PORT_ATTEMPTS):
    import socket
    for offset in range(max_attempts):
        port = start_port + offset
        try:
            with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
                s.bind(('127.0.0.1', port))
                return port
        except OSError:
            continue
    return None

# ─── Main ────────────────────────────────────────────────────
def main():
    # Check if already running via PID file
    if os.path.exists(PID_FILE):
        try:
            with open(PID_FILE, 'r') as f:
                old_pid = int(f.read().strip())
            # Check if process is alive (cross-platform lightweight check)
            if sys.platform == 'win32':
                import ctypes
                PROCESS_QUERY_LIMITED_INFORMATION = 0x1000
                handle = ctypes.windll.kernel32.OpenProcess(PROCESS_QUERY_LIMITED_INFORMATION, False, old_pid)
                if handle:
                    ctypes.windll.kernel32.CloseHandle(handle)
                    log(f'Server already running (PID {old_pid}), exiting.')
                    print(f'ALREADY_RUNNING:{old_pid}', flush=True)
                    sys.exit(0)
            else:
                os.kill(old_pid, 0)
                log(f'Server already running (PID {old_pid}), exiting.')
                print(f'ALREADY_RUNNING:{old_pid}', flush=True)
                sys.exit(0)
        except (OSError, ValueError, ProcessLookupError):
            remove_pid()

    port = find_available_port(DEFAULT_PORT)
    if port is None:
        log(f'No available port found in range {DEFAULT_PORT}-{DEFAULT_PORT + MAX_PORT_ATTEMPTS - 1}')
        print('NO_PORT', flush=True)
        sys.exit(1)

    # Allow address reuse
    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.TCPServer(('127.0.0.1', port), StudyAgentHandler) as httpd:
        actual_port = httpd.server_address[1]
        save_pid(actual_port)
        log(f'StudyAgent Local Backend starting on http://127.0.0.1:{actual_port}')
        log(f'Frontend directory: {FRONTEND_DIR}')
        log(f'PID: {os.getpid()}')
        print(f'SERVER_READY:{actual_port}', flush=True)

        def shutdown_handler(signum, frame):
            log('Shutting down...')
            remove_pid()
            httpd.shutdown()
            sys.exit(0)

        signal.signal(signal.SIGINT, shutdown_handler)
        signal.signal(signal.SIGTERM, shutdown_handler)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
        finally:
            remove_pid()
            log('Server stopped.')

if __name__ == '__main__':
    main()
