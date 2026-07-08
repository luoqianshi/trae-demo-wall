"""
邻里智联 - 认证工具函数
包含JWT token生成、验证码生成、密码哈希等
"""

import hashlib
import hmac
import secrets
import time
from functools import wraps
from flask import request, jsonify, current_app


# 简单的token存储（生产环境应使用Redis）
token_store = {}

# 验证码存储（生产环境应使用Redis）
verification_codes = {}


def hash_password(password: str) -> str:
    """对密码进行哈希处理"""
    salt = secrets.token_hex(16)
    pwd_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex()
    return f"{salt}${pwd_hash}"


def verify_password(password: str, password_hash: str) -> bool:
    """验证密码"""
    try:
        salt, pwd_hash = password_hash.split('$')
        new_hash = hashlib.pbkdf2_hmac('sha256', password.encode(), salt.encode(), 100000).hex()
        return hmac.compare_digest(new_hash, pwd_hash)
    except:
        return False


def generate_token(user_id: int, role: str) -> str:
    """生成JWT风格的token"""
    timestamp = int(time.time())
    random_str = secrets.token_hex(8)
    payload = f"{user_id}.{role}.{timestamp}.{random_str}"
    
    # 简单的签名（生产环境应使用PyJWT）
    secret = current_app.config.get('SECRET_KEY', 'neighbor-smart-community-secret')
    signature = hashlib.sha256(f"{payload}.{secret}".encode()).hexdigest()[:16]
    
    token = f"{payload}.{signature}"
    
    # 存储token，设置24小时过期
    token_store[token] = {
        'user_id': user_id,
        'role': role,
        'expire_time': timestamp + 86400
    }
    
    return token


def verify_token(token: str) -> dict:
    """验证token并返回用户信息"""
    try:
        parts = token.split('.')
        if len(parts) != 5:
            return None
        
        user_id, role, timestamp, random_str, signature = parts
        
        # 验证签名
        payload = f"{user_id}.{role}.{timestamp}.{random_str}"
        secret = current_app.config.get('SECRET_KEY', 'neighbor-smart-community-secret')
        expected_signature = hashlib.sha256(f"{payload}.{secret}".encode()).hexdigest()[:16]
        
        if not hmac.compare_digest(signature, expected_signature):
            return None
        
        # 检查过期
        if int(time.time()) > int(timestamp) + 86400:
            return None
        
        return {
            'user_id': int(user_id),
            'role': role
        }
    except:
        return None


def generate_verification_code(length: int = 6) -> str:
    """生成随机验证码"""
    return ''.join(secrets.choice('0123456789') for _ in range(length))


def store_verification_code(phone: str, code: str, expire_minutes: int = 5):
    """存储验证码"""
    verification_codes[phone] = {
        'code': code,
        'expire_time': int(time.time()) + expire_minutes * 60
    }


def verify_verification_code(phone: str, code: str) -> bool:
    """验证验证码"""
    if phone not in verification_codes:
        return False
    
    record = verification_codes[phone]
    if int(time.time()) > record['expire_time']:
        del verification_codes[phone]
        return False
    
    if hmac.compare_digest(record['code'], code):
        del verification_codes[phone]
        return True
    
    return False


def admin_required(f):
    """管理员权限装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'code': 401, 'msg': '未登录'}), 401
        
        user_info = verify_token(token)
        if not user_info:
            return jsonify({'code': 401, 'msg': '登录已过期'}), 401
        
        if user_info['role'] not in ['admin', 'grid_admin']:
            return jsonify({'code': 403, 'msg': '权限不足'}), 403
        
        return f(*args, **kwargs)
    return decorated


def login_required(f):
    """登录权限装饰器"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'code': 401, 'msg': '未登录'}), 401

        user_info = verify_token(token)
        if not user_info:
            return jsonify({'code': 401, 'msg': '登录已过期'}), 401

        return f(*args, **kwargs)
    return decorated


def get_current_user():
    """从请求中获取当前登录用户"""
    from models import User
    token = request.headers.get('Authorization', '').replace('Bearer ', '')
    if not token:
        return None
    user_info = verify_token(token)
    if not user_info:
        return None
    return User.query.get(user_info['user_id'])
