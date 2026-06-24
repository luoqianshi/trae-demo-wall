# -*- coding: utf-8 -*-
"""
TimeForge X - 认证模块
JWT令牌管理、密码哈希、用户认证中间件
"""
import hashlib
import hmac
import json
import base64
import time
import re
import random
import string
from functools import wraps
from datetime import datetime, timedelta

from flask import request, jsonify, g

from config import Config
from database import get_db, dict_from_row

# =============================================
# 密码哈希
# =============================================
def hash_password(password):
    salt = "timeforge_x_salt_2024"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()


def verify_password(password, password_hash):
    return hash_password(password) == password_hash


# =============================================
# JWT 简易实现
# =============================================
def base64url_encode(data):
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode('utf-8')


def base64url_decode(data):
    padding = 4 - len(data) % 4
    if padding != 4:
        data += '=' * padding
    return base64.urlsafe_b64decode(data)


def create_jwt(payload, expires_hours=None):
    if expires_hours is None:
        expires_hours = Config.JWT_EXPIRATION_HOURS
    header = {"alg": "HS256", "typ": "JWT"}
    payload["exp"] = int(time.time()) + expires_hours * 3600
    payload["iat"] = int(time.time())

    header_b64 = base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    payload_b64 = base64url_encode(json.dumps(payload, separators=(',', ':')).encode('utf-8'))

    signing_input = f"{header_b64}.{payload_b64}"
    signature = hmac.new(
        Config.SECRET_KEY.encode('utf-8'),
        signing_input.encode('utf-8'),
        hashlib.sha256
    ).digest()
    signature_b64 = base64url_encode(signature)

    return f"{signing_input}.{signature_b64}"


def decode_jwt(token):
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None

        header_b64, payload_b64, signature_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}"

        expected_signature = hmac.new(
            Config.SECRET_KEY.encode('utf-8'),
            signing_input.encode('utf-8'),
            hashlib.sha256
        ).digest()
        expected_b64 = base64url_encode(expected_signature)

        if not hmac.compare_digest(signature_b64, expected_b64):
            return None

        payload = json.loads(base64url_decode(payload_b64))
        if payload.get("exp", 0) < time.time():
            return None

        return payload
    except Exception:
        return None


# =============================================
# 认证装饰器
# =============================================
def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]

        if not token:
            return jsonify({"success": False, "message": "请先登录"}), 401

        payload = decode_jwt(token)
        if not payload:
            return jsonify({"success": False, "message": "登录已过期，请重新登录"}), 401

        conn = get_db()
        user = dict_from_row(conn.execute(
            "SELECT * FROM users WHERE id = ?", (payload["user_id"],)
        ).fetchone())
        conn.close()

        if not user:
            return jsonify({"success": False, "message": "用户不存在"}), 401

        g.current_user = user
        return f(*args, **kwargs)
    return decorated


def optional_login(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization', '')
        if auth_header.startswith('Bearer '):
            token = auth_header[7:]

        if token:
            payload = decode_jwt(token)
            if payload:
                conn = get_db()
                user = dict_from_row(conn.execute(
                    "SELECT * FROM users WHERE id = ?", (payload["user_id"],)
                ).fetchone())
                conn.close()
                g.current_user = user
                return f(*args, **kwargs)

        g.current_user = None
        return f(*args, **kwargs)
    return decorated


# =============================================
# 验证码生成
# =============================================
def generate_verification_code(length=6):
    return ''.join(random.choices(string.digits, k=length))


def generate_reset_token():
    return ''.join(random.choices(string.ascii_letters + string.digits, k=64))


# =============================================
# 输入验证
# =============================================
def validate_email(email):
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None


def validate_phone(phone):
    pattern = r'^1[3-9]\d{9}$'
    return re.match(pattern, phone) is not None


def validate_username(username):
    if len(username) < 3 or len(username) > 20:
        return False
    return re.match(r'^[a-zA-Z0-9_\u4e00-\u9fff]+$', username) is not None


def validate_password(password):
    return len(password) >= 6


# =============================================
# 用户等级计算
# =============================================
def calculate_level_info(experience):
    level = 1
    exp_needed = 500
    remaining_exp = experience

    while remaining_exp >= exp_needed:
        remaining_exp -= exp_needed
        level += 1
        exp_needed = level * 500

    return {
        "level": level,
        "current_exp": remaining_exp,
        "next_level_exp": level * 500,
        "exp_percentage": round((remaining_exp / (level * 500)) * 100, 1),
        "level_name": get_level_name(level),
    }


def get_level_name(level):
    if level <= 5:
        return "青铜"
    elif level <= 10:
        return "白银"
    elif level <= 15:
        return "黄金"
    elif level <= 20:
        return "铂金"
    elif level <= 25:
        return "钻石"
    elif level <= 30:
        return "大师"
    else:
        return "王者"


def add_experience(conn, user_id, amount):
    conn.execute("UPDATE users SET experience = experience + ? WHERE id = ?", (amount, user_id))
    user = dict_from_row(conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone())
    level_info = calculate_level_info(user["experience"])
    conn.execute("UPDATE users SET level = ? WHERE id = ?", (level_info["level"], user_id))
    conn.commit()
    return level_info