import hashlib
import socket
import uuid
import re
import json
from datetime import datetime


def get_host_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "127.0.0.1"


def get_mac_address():
    mac = uuid.getnode()
    return ":".join(("%012X" % mac)[i:i+2] for i in range(0, 12, 2))


def hash_password(password):
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def hash_code(content):
    return hashlib.sha256(content.encode("utf-8")).hexdigest()


def get_now():
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def parse_json_request(handler):
    content_length = int(handler.headers.get("Content-Length", 0))
    if content_length == 0:
        return {}
    body = handler.rfile.read(content_length)
    return json.loads(body.decode("utf-8"))


def send_json_response(handler, status_code, data):
    response = json.dumps(data, ensure_ascii=False).encode("utf-8")
    handler.send_response(status_code)
    handler.send_header("Content-Type", "application/json; charset=utf-8")
    handler.send_header("Access-Control-Allow-Origin", "*")
    handler.send_header("Content-Length", len(response))
    handler.end_headers()
    handler.wfile.write(response)


def validate_username(username):
    if not username or len(username) < 2 or len(username) > 20:
        return False
    return bool(re.match(r"^[a-zA-Z0-9_\u4e00-\u9fa5]+$", username))
