from flask import Flask, request, jsonify, send_from_directory, session, Response, stream_with_context
from flask_cors import CORS
from functools import wraps
import sqlite3
import os
import hashlib
import random
import string
import threading
import uuid
from datetime import datetime, date, timedelta
from PIL import Image
from io import BytesIO
from config import config
from ai_service import ai_service
from api_gateway import api_gateway
from knowledge_engine import knowledge_engine

app = Flask(__name__, static_folder='../frontend', static_url_path='')
# 优先使用环境变量中的 secret_key，避免硬编码泄露
app.secret_key = os.environ.get('FLASK_SECRET_KEY', 'yaoguanjia-2024-dev-only-secret-key')
CORS(app, supports_credentials=True)

DB_PATH = os.path.join(os.path.dirname(__file__), 'medicine.db')
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_DIR, exist_ok=True)

try:
    from werkzeug.security import generate_password_hash, check_password_hash
    _HAS_WERKZEUG_HASH = True
except ImportError:
    _HAS_WERKZEUG_HASH = False

def hash_password(password):
    """生成加盐密码哈希（优先 werkzeug pbkdf2，回退 sha256）"""
    if _HAS_WERKZEUG_HASH:
        return generate_password_hash(password)
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, password_hash):
    """校验密码：兼容旧版无盐 sha256 与新版 werkzeug 加盐哈希"""
    if not password_hash:
        return False
    # 旧版 sha256 哈希固定 64 字符十六进制
    if len(password_hash) == 64 and _HAS_WERKZEUG_HASH:
        old_hash = hashlib.sha256(password.encode()).hexdigest()
        if old_hash == password_hash:
            return True
        return False
    if _HAS_WERKZEUG_HASH:
        return check_password_hash(password_hash, password)
    return hashlib.sha256(password.encode()).hexdigest() == password_hash

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn

def init_db():
    conn = get_db()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS families (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            code TEXT UNIQUE NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT DEFAULT (datetime('now','localtime'))
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            family_id INTEGER NOT NULL,
            role TEXT DEFAULT 'member',
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (family_id) REFERENCES families(id)
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS medicines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            family_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            manufacturer TEXT DEFAULT '',
            category TEXT DEFAULT '其他',
            production_date TEXT DEFAULT '',
            expiry_date TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            created_by INTEGER,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            updated_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (family_id) REFERENCES families(id)
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS medicine_catalog (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            family_id INTEGER NOT NULL,
            manufacturer TEXT DEFAULT '',
            name TEXT NOT NULL,
            shelf_life_months INTEGER DEFAULT 24,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            updated_at TEXT DEFAULT (datetime('now','localtime')),
            UNIQUE(family_id, manufacturer, name),
            FOREIGN KEY (family_id) REFERENCES families(id)
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            medicine_id INTEGER NOT NULL,
            alert_type TEXT NOT NULL,
            message TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS member_medicines (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            medicine_id INTEGER NOT NULL,
            notes TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
            UNIQUE(user_id, medicine_id)
        )
    ''')
    # 阶段1：家庭药箱变更流水表（SSE 实时同步基础）
    conn.execute('''
        CREATE TABLE IF NOT EXISTS medicine_changes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            family_id INTEGER NOT NULL,
            medicine_id INTEGER NOT NULL,
            action TEXT NOT NULL,
            changes TEXT,
            version INTEGER DEFAULT 1,
            user_id INTEGER,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (family_id) REFERENCES families(id)
        )
    ''')
    conn.execute('''
        CREATE TABLE IF NOT EXISTS storage_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            family_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            sort_order INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            updated_at TEXT DEFAULT (datetime('now','localtime')),
            UNIQUE(family_id, name)
        )
    ''')
    conn.commit()

    # 创建默认管理员账户 admin/admin
    admin = conn.execute("SELECT id FROM users WHERE username = 'admin'").fetchone()
    if not admin:
        fam = conn.execute("SELECT id FROM families WHERE code = 'ADMIN'").fetchone()
        if not fam:
            conn.execute("INSERT INTO families (code, name) VALUES ('ADMIN', '管理员家庭')")
            fam = conn.execute("SELECT id FROM families WHERE code = 'ADMIN'").fetchone()
        conn.execute("INSERT INTO users (username, password_hash, family_id, role, role_type) VALUES (?, ?, ?, 'admin', 'admin')",
                     ('admin', hash_password('admin'), fam['id']))
        conn.commit()

    conn.close()

def migrate_db():
    """数据库迁移：添加 AI 功能所需的新字段和表"""
    conn = get_db()
    cursor = conn.cursor()

    # ===== 为 medicines 表新增字段 =====
    new_columns = [
        ("indications", "TEXT DEFAULT ''"),
        ("usage_dosage", "TEXT DEFAULT ''"),
        ("adverse_reactions", "TEXT DEFAULT ''"),
        ("contraindications", "TEXT DEFAULT ''"),
        ("storage", "TEXT DEFAULT ''"),
        ("approval_number", "TEXT DEFAULT ''"),
        # 库存心跳引擎字段（迭代4：药品库存预警 spec 兑现）
        ("pack_total_units", "INTEGER DEFAULT 0"),       # 包装总量（片/粒/支）
        ("unit_label", "TEXT DEFAULT '片'"),             # 单位标签
        ("restock_threshold_days", "INTEGER DEFAULT 7"), # 补货预警阈值（天）
        ("stock_quantity", "REAL DEFAULT 0"),            # 当前库存量（支持半片）
        ("photo_url", "TEXT DEFAULT ''"),                # 药品照片 URL
        ("note", "TEXT DEFAULT ''"),                     # 药品备注（可写文字）
    ]
    existing_cols = {row[1] for row in cursor.execute("PRAGMA table_info(medicines)").fetchall()}
    for col_name, col_def in new_columns:
        if col_name not in existing_cols:
            cursor.execute(f"ALTER TABLE medicines ADD COLUMN {col_name} {col_def}")

    # 阶段1：增加版本号与最后修改者字段（SSE 同步基础）
    try:
        cursor.execute("ALTER TABLE medicines ADD COLUMN version INTEGER DEFAULT 1")
    except Exception as e:
        if 'duplicate column' not in str(e).lower():
            print(f'[migrate] add version: {e}')
    try:
        cursor.execute("ALTER TABLE medicines ADD COLUMN last_modified_by INTEGER")
    except Exception as e:
        if 'duplicate column' not in str(e).lower():
            print(f'[migrate] add last_modified_by: {e}')

    # ===== 为 users 表新增字段 =====
    user_new_columns = [
        ("role_type", "TEXT DEFAULT ''"),
        ("is_elderly", "INTEGER DEFAULT 0"),
        ("elderly_name", "TEXT DEFAULT ''"),
        ("caregiver_id", "INTEGER DEFAULT 0"),
    ]
    user_existing_cols = {row[1] for row in cursor.execute("PRAGMA table_info(users)").fetchall()}
    for col_name, col_def in user_new_columns:
        if col_name not in user_existing_cols:
            cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_def}")

    # 为已有用户补全 role_type（基于 role 字段）
    cursor.execute("UPDATE users SET role_type = role WHERE role_type = '' OR role_type IS NULL")

    # ===== 创建服药提醒表 =====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reminder_schedules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER NOT NULL,
            medicine_id INTEGER NOT NULL,
            remind_time TEXT NOT NULL,
            repeat_type TEXT DEFAULT 'daily',
            weekdays TEXT DEFAULT '',
            dosage TEXT DEFAULT '',
            enabled INTEGER DEFAULT 1,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (member_id) REFERENCES users(id),
            FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
        )
    ''')

    # 为旧版 reminder_schedules 补齐 weekdays 字段
    rs_existing_cols = {row[1] for row in cursor.execute("PRAGMA table_info(reminder_schedules)").fetchall()}
    if 'weekdays' not in rs_existing_cols:
        cursor.execute("ALTER TABLE reminder_schedules ADD COLUMN weekdays TEXT DEFAULT ''")

    # ===== 创建服药打卡表 =====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS checkin_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER NOT NULL,
            medicine_id INTEGER NOT NULL,
            schedule_id INTEGER,
            checkin_time TEXT DEFAULT (datetime('now','localtime')),
            status TEXT DEFAULT 'done',
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (member_id) REFERENCES users(id),
            FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
            FOREIGN KEY (schedule_id) REFERENCES reminder_schedules(id) ON DELETE SET NULL
        )
    ''')

    # ===== 创建 AI 分析日志表 =====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS ai_analysis_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            family_id INTEGER NOT NULL,
            type TEXT NOT NULL,
            input_text TEXT DEFAULT '',
            response_text TEXT DEFAULT '',
            duration_ms INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (family_id) REFERENCES families(id)
        )
    ''')

    # ===== 创建语音明信片表（情感联结：老人打卡后可给家人留语音）=====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS voice_postcards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            family_id INTEGER NOT NULL,
            elderly_id INTEGER NOT NULL,
            audio_url TEXT NOT NULL,
            note TEXT DEFAULT '',
            duration_seconds INTEGER DEFAULT 0,
            is_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (family_id) REFERENCES families(id),
            FOREIGN KEY (elderly_id) REFERENCES users(id)
        )
    ''')

    # ===== 创建上传文件登记表（用于 uploads 鉴权，防越权访问）=====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS uploads_registry (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT UNIQUE NOT NULL,
            family_id INTEGER NOT NULL,
            uploader_id INTEGER,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (family_id) REFERENCES families(id)
        )
    ''')

    # ===== 创建药物相互作用检测表（含 is_read 字段）=====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS drug_interaction_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            member_id INTEGER NOT NULL,
            medicine_ids TEXT NOT NULL,
            risk_level TEXT DEFAULT 'safe',
            description TEXT DEFAULT '',
            suggestion TEXT DEFAULT '',
            is_read INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (member_id) REFERENCES users(id)
        )
    ''')
    # 如果旧表缺少 is_read 字段，尝试添加
    interaction_existing = {row[1] for row in cursor.execute("PRAGMA table_info(drug_interaction_alerts)").fetchall()}
    if "is_read" not in interaction_existing:
        cursor.execute("ALTER TABLE drug_interaction_alerts ADD COLUMN is_read INTEGER DEFAULT 0")

    # ===== 创建知识库表 =====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS knowledge_base (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            family_id INTEGER NOT NULL,
            elderly_id INTEGER NOT NULL,
            question_text TEXT NOT NULL,
            answer_text TEXT DEFAULT '',
            answer_audio_url TEXT DEFAULT '',
            answer_image_url TEXT DEFAULT '',
            answer_type TEXT DEFAULT 'pending',
            similarity_hash TEXT DEFAULT '',
            use_count INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            updated_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (family_id) REFERENCES families(id),
            FOREIGN KEY (elderly_id) REFERENCES users(id)
        )
    ''')

    # ===== 创建服药提醒触发记录表 =====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS reminder_triggers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            schedule_id INTEGER NOT NULL,
            member_id INTEGER NOT NULL,
            medicine_id INTEGER NOT NULL,
            medicine_name TEXT DEFAULT '',
            dosage TEXT DEFAULT '',
            trigger_time TEXT DEFAULT (datetime('now','localtime')),
            status TEXT DEFAULT 'pending',
            confirmed_at TEXT DEFAULT '',
            video_url TEXT DEFAULT '',
            transcript TEXT DEFAULT '',
            scene_type TEXT DEFAULT '',
            scene_analysis TEXT DEFAULT '',
            health_question TEXT DEFAULT '',
            extended_count INTEGER DEFAULT 0,
            is_delayed INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (schedule_id) REFERENCES reminder_schedules(id) ON DELETE CASCADE,
            FOREIGN KEY (member_id) REFERENCES users(id),
            FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
        )
    ''')

    # ===== 创建服药视频存档表 =====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS medication_videos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            family_id INTEGER NOT NULL,
            elderly_id INTEGER NOT NULL,
            trigger_id INTEGER,
            medicine_name TEXT DEFAULT '',
            video_url TEXT NOT NULL,
            transcript TEXT DEFAULT '',
            scene_type TEXT DEFAULT '',
            duration_seconds INTEGER DEFAULT 60,
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (family_id) REFERENCES families(id),
            FOREIGN KEY (elderly_id) REFERENCES users(id),
            FOREIGN KEY (trigger_id) REFERENCES reminder_triggers(id) ON DELETE SET NULL
        )
    ''')

    # ===== 创建异常场景告警表（迭代4：异常场景实时通道，弥补"只入库不通知"的断裂点）=====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scene_alerts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            family_id INTEGER NOT NULL,
            elderly_id INTEGER NOT NULL,
            trigger_id INTEGER,
            medicine_name TEXT DEFAULT '',
            scene_type TEXT NOT NULL,
            severity TEXT DEFAULT 'warning',
            message TEXT NOT NULL,
            video_url TEXT DEFAULT '',
            is_read INTEGER DEFAULT 0,
            claimed_by INTEGER DEFAULT 0,
            claimed_at TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (family_id) REFERENCES families(id),
            FOREIGN KEY (elderly_id) REFERENCES users(id),
            FOREIGN KEY (trigger_id) REFERENCES reminder_triggers(id) ON DELETE SET NULL,
            FOREIGN KEY (claimed_by) REFERENCES users(id)
        )
    ''')

    # ===== 创建家庭邀请申请表（支持 member 申请加入家庭，admin 审批）=====
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS family_invitations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            family_id INTEGER NOT NULL,
            invite_code TEXT NOT NULL,
            applicant_username TEXT NOT NULL,
            applicant_password_hash TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            approved_by INTEGER,
            approved_at TEXT DEFAULT '',
            created_at TEXT DEFAULT (datetime('now','localtime')),
            FOREIGN KEY (family_id) REFERENCES families(id),
            FOREIGN KEY (approved_by) REFERENCES users(id)
        )
    ''')

    # ===== families 表添加 invite_code 字段（与 code 字段保持同步）=====
    family_existing_cols = {row[1] for row in cursor.execute("PRAGMA table_info(families)").fetchall()}
    if 'invite_code' not in family_existing_cols:
        cursor.execute("ALTER TABLE families ADD COLUMN invite_code TEXT DEFAULT ''")
        cursor.execute("UPDATE families SET invite_code = code WHERE invite_code IS NULL OR invite_code = ''")

    # ===== 修复 family_invitations 表的 approved_by 默认值问题 =====
    invite_existing_cols = {row[1] for row in cursor.execute("PRAGMA table_info(family_invitations)").fetchall()}
    if 'approved_by' in invite_existing_cols:
        cursor.execute("UPDATE family_invitations SET approved_by = NULL WHERE approved_by = 0")

    # 迭代4：修复历史 stock_quantity=0 但实际有库存的数据
    try:
        cursor.execute('''
            UPDATE medicines
            SET stock_quantity = pack_total_units
            WHERE stock_quantity = 0 AND pack_total_units > 0
        ''')
        cursor.execute('''
            UPDATE medicines
            SET stock_quantity = 1
            WHERE stock_quantity = 0 AND (pack_total_units = 0 OR pack_total_units IS NULL)
        ''')
    except Exception as e:
        print(f'[migrate] stock fix: {e}')

    # 迭代新需求3：修复历史 storage 为空的记录
    try:
        cursor.execute('''
            UPDATE medicines
            SET storage = '默认药箱'
            WHERE storage IS NULL OR storage = ''
        ''')
    except Exception as e:
        print(f'[migrate] storage fix: {e}')

    conn.commit()
    conn.close()

init_db()
migrate_db()

# ========== 阶段2：SSE 实时同步（家庭药箱变更推送）==========
import queue as _queue
import threading as _threading
import json as _json
import time as _time

# SSE 客户端管理 —— family_id → [queue1, queue2, ...]；多线程访问需持锁
_sse_clients_lock = _threading.Lock()
_sse_clients = {}

def _register_sse_client(family_id):
    """注册一个新的 SSE 客户端，返回消息队列"""
    q = _queue.Queue()
    with _sse_clients_lock:
        if family_id not in _sse_clients:
            _sse_clients[family_id] = []
        _sse_clients[family_id].append(q)
    return q

def _unregister_sse_client(family_id, q):
    """注销 SSE 客户端"""
    with _sse_clients_lock:
        if family_id in _sse_clients and q in _sse_clients[family_id]:
            _sse_clients[family_id].remove(q)
            if not _sse_clients[family_id]:
                del _sse_clients[family_id]

def _broadcast_medicine_change(family_id, action, medicine_id, version, changes=None):
    """向同 family_id 的所有 SSE 客户端广播变更事件"""
    msg = {
        'action': action,
        'medicine_id': medicine_id,
        'version': version,
        'timestamp': _time.time(),
        'changes': changes or {}
    }
    with _sse_clients_lock:
        clients = _sse_clients.get(family_id, [])
        for q in clients:
            try:
                q.put_nowait(msg)
            except _queue.Full:
                pass  # 队列满则丢弃，客户端会通过轮询兜底

@app.route('/api/medicines/stream')
def medicines_stream_sse():
    """SSE 端点：实时推送家庭药箱变更事件"""
    auth = require_auth()
    if auth:
        return auth
    family_id = get_current_family_id()
    if not family_id:
        return jsonify({'code': 403, 'msg': '未登录'}), 403

    q = _register_sse_client(family_id)

    def event_stream():
        try:
            # 首次连接发送欢迎消息
            yield 'event: connected\ndata: {"msg":"SSE connected"}\n\n'
            last_heartbeat = _time.time()
            while True:
                try:
                    msg = q.get(timeout=15)  # 15s 超时
                    yield f'event: medicine_changed\ndata: {_json.dumps(msg, ensure_ascii=False)}\n\n'
                except _queue.Empty:
                    # 心跳：每 30s 发送空注释防止连接超时
                    if _time.time() - last_heartbeat > 30:
                        yield ': heartbeat\n\n'
                        last_heartbeat = _time.time()
        finally:
            _unregister_sse_client(family_id, q)

    return Response(
        stream_with_context(event_stream()),
        content_type='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
            'Connection': 'keep-alive'
        }
    )

# ========== 工具函数 ==========

def generate_invite_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=6))

def register_upload(filename, family_id, uploader_id=None):
    """登记上传文件归属家庭，用于 serve_upload 鉴权校验"""
    try:
        conn = get_db()
        conn.execute(
            "INSERT OR IGNORE INTO uploads_registry (filename, family_id, uploader_id) VALUES (?, ?, ?)",
            (filename, family_id, uploader_id)
        )
        conn.commit()
        conn.close()
    except Exception:
        pass

def get_current_family_id():
    return session.get('family_id')

def require_auth():
    if not session.get('user_id'):
        return jsonify({'code': 401, 'msg': '请先登录'}), 401
    return None

def require_admin(fn):
    """管理员权限装饰器：药品CRUD等敏感操作仅管理员可执行"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get('user_id'):
            return jsonify({'code': 401, 'msg': '请先登录'}), 401
        if session.get('role') != 'admin':
            return jsonify({'code': 403, 'msg': '仅管理员可操作'}), 403
        return fn(*args, **kwargs)
    return wrapper

def require_non_elderly(fn):
    """非老人权限装饰器：家庭药箱增删等操作允许 admin 和 member，拒绝老人"""
    @wraps(fn)
    def wrapper(*args, **kwargs):
        if not session.get('user_id'):
            return jsonify({'code': 401, 'msg': '请先登录'}), 401
        if session.get('role_type') == 'elderly' or session.get('role') == 'elderly':
            return jsonify({'code': 403, 'msg': '老人账户无权执行此操作'}), 403
        return fn(*args, **kwargs)
    return wrapper

# ========== 存储地点管理 ==========
DEFAULT_STORAGE_LOCATIONS = ['默认药箱', '客厅药箱', '卧室抽屉', '厨房橱柜', '随身携带']

def _ensure_default_storage_locations(family_id, conn):
    existing = {r['name'] for r in conn.execute("SELECT name FROM storage_locations WHERE family_id = ?", (family_id,)).fetchall()}
    sort_order = len(existing)
    for name in DEFAULT_STORAGE_LOCATIONS:
        if name not in existing:
            conn.execute("INSERT INTO storage_locations (family_id, name, sort_order) VALUES (?, ?, ?)",
                         (family_id, name, sort_order))
            sort_order += 1

@app.route('/api/storage-locations', methods=['GET'])
def get_storage_locations():
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    conn = get_db()
    _ensure_default_storage_locations(family_id, conn)
    locations = conn.execute("SELECT id, name, sort_order FROM storage_locations WHERE family_id = ? ORDER BY sort_order", (family_id,)).fetchall()
    conn.close()
    return jsonify({'code': 0, 'data': [dict(r) for r in locations]})

@app.route('/api/storage-locations', methods=['POST'])
@require_non_elderly
def create_storage_location():
    data = request.get_json()
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'code': 400, 'msg': '请输入地点名称'}), 400

    family_id = get_current_family_id()
    conn = get_db()
    try:
        max_sort = conn.execute("SELECT MAX(sort_order) FROM storage_locations WHERE family_id = ?", (family_id,)).fetchone()[0]
        conn.execute("INSERT INTO storage_locations (family_id, name, sort_order) VALUES (?, ?, ?)",
                     (family_id, name, (max_sort or 0) + 1))
        conn.commit()
        loc = conn.execute("SELECT id, name, sort_order FROM storage_locations WHERE family_id = ? AND name = ?",
                           (family_id, name)).fetchone()
        conn.close()
        return jsonify({'code': 0, 'msg': '添加成功', 'data': dict(loc)})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'code': 400, 'msg': '该地点已存在'}), 400
    except Exception as e:
        conn.close()
        return jsonify({'code': 400, 'msg': str(e)}), 400

@app.route('/api/storage-locations/<int:lid>', methods=['PUT'])
@require_non_elderly
def update_storage_location(lid):
    data = request.get_json()
    name = (data.get('name') or '').strip()
    if not name:
        return jsonify({'code': 400, 'msg': '请输入地点名称'}), 400

    family_id = get_current_family_id()
    conn = get_db()
    try:
        conn.execute("UPDATE storage_locations SET name = ?, updated_at = datetime('now','localtime') WHERE id = ? AND family_id = ?",
                     (name, lid, family_id))
        if conn.execute("SELECT changes()").fetchone()[0] == 0:
            conn.close()
            return jsonify({'code': 404, 'msg': '地点不存在'}), 404
        conn.commit()
        conn.close()
        return jsonify({'code': 0, 'msg': '更新成功'})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'code': 400, 'msg': '该地点名称已存在'}), 400

@app.route('/api/storage-locations/<int:lid>', methods=['DELETE'])
@require_non_elderly
def delete_storage_location(lid):
    family_id = get_current_family_id()
    conn = get_db()
    try:
        loc = conn.execute("SELECT id, name FROM storage_locations WHERE id = ? AND family_id = ?", (lid, family_id)).fetchone()
        if not loc:
            conn.close()
            return jsonify({'code': 404, 'msg': '地点不存在'}), 404

        count = conn.execute("SELECT COUNT(*) FROM medicines WHERE family_id = ? AND storage = ?", (family_id, loc['name'])).fetchone()[0]
        if count > 0:
            conn.close()
            return jsonify({'code': 400, 'msg': f'该地点有 {count} 个药品，无法删除'}), 400

        conn.execute("DELETE FROM storage_locations WHERE id = ? AND family_id = ?", (lid, family_id))
        conn.commit()
        conn.close()
        return jsonify({'code': 0, 'msg': '删除成功'})
    except Exception as e:
        conn.close()
        return jsonify({'code': 400, 'msg': str(e)}), 400

def add_days_left(medicines):
    today = date.today()
    for m in medicines:
        try:
            exp = datetime.strptime(m['expiry_date'], '%Y-%m-%d').date()
            m['days_left'] = (exp - today).days
        except:
            m['days_left'] = None
    return medicines

# ========== 用户认证 API ==========

@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')
    invite_code = data.get('invite_code', '').strip().upper()
    role_type = data.get('role_type', 'member')
    elderly_name = data.get('elderly_name', '').strip()

    if not username or not password:
        return jsonify({'code': 1, 'msg': '用户名和密码不能为空'}), 400
    if len(password) < 3:
        return jsonify({'code': 1, 'msg': '密码至少3位'}), 400

    valid_roles = ('admin', 'member', 'elderly')
    if role_type not in valid_roles:
        role_type = 'member'

    conn = get_db()
    family_id = None
    family_name = ''

    if invite_code:
        if len(invite_code) != 6:
            conn.close()
            return jsonify({'code': 1, 'msg': '邀请码必须是6位'}), 400

        family = conn.execute("SELECT * FROM families WHERE invite_code = ?", (invite_code,)).fetchone()
        if not family:
            conn.close()
            return jsonify({'code': 1, 'msg': '邀请码无效'}), 404

        family_id = family['id']
        family_name = family['name']

        if role_type == 'admin':
            role_type = 'member'

    else:
        code = generate_invite_code()
        while conn.execute("SELECT id FROM families WHERE code = ? OR invite_code = ?", (code, code)).fetchone():
            code = generate_invite_code()

        family_name = f'{username}的家庭'
        conn.execute("INSERT INTO families (code, name, invite_code) VALUES (?, ?, ?)", (code, family_name, code))
        family_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]

        if role_type != 'elderly':
            role_type = 'admin'

    existing_in_family = conn.execute(
        "SELECT id FROM users WHERE username = ? AND family_id = ?",
        (username, family_id)
    ).fetchone()
    if existing_in_family:
        conn.close()
        return jsonify({'code': 1, 'msg': '该用户名已在该家庭中'}), 400

    is_elderly = 1 if role_type == 'elderly' else 0
    final_elderly_name = elderly_name or (username if role_type == 'elderly' else '')
    conn.execute(
        "INSERT INTO users (username, password_hash, family_id, role, role_type, is_elderly, elderly_name) "
        "VALUES (?, ?, ?, ?, ?, ?, ?)",
        (username, hash_password(password), family_id, role_type, role_type, is_elderly, final_elderly_name)
    )
    conn.commit()
    conn.close()

    return jsonify({'code': 0, 'msg': '注册成功', 'data': {'family_code': invite_code or code, 'family_name': family_name}})

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username', '').strip()
    password = data.get('password', '')

    conn = get_db()
    users = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchall()
    
    user = None
    candidates = []
    for u in users:
        if verify_password(password, u['password_hash']):
            candidates.append(u)
    
    if not candidates:
        conn.close()
        return jsonify({'code': 1, 'msg': '用户名或密码错误'}), 401
    
    user = candidates[0]
    if len(candidates) > 1:
        for c in candidates:
            if c['family_id'] is not None:
                user = c
                break

    # 懒迁移：旧版 sha256 哈希升级为 werkzeug 加盐哈希
    if _HAS_WERKZEUG_HASH and len(user['password_hash']) == 64:
        conn.execute("UPDATE users SET password_hash = ? WHERE id = ?",
                     (generate_password_hash(password), user['id']))
        conn.commit()

    family = None
    if user['family_id']:
        family = conn.execute("SELECT * FROM families WHERE id = ?", (user['family_id'],)).fetchone()
    conn.close()
    
    session['user_id'] = user['id']
    session['username'] = user['username']
    session['family_id'] = user['family_id']
    session['role'] = user['role']
    session['role_type'] = user['role_type'] or user['role']
    
    return jsonify({'code': 0, 'msg': '登录成功', 'data': {
        'user_id': user['id'], 'username': user['username'], 'role': user['role'],
        'role_type': user['role_type'] or user['role'],
        'is_elderly': user['is_elderly'], 'elderly_name': user['elderly_name'],
        'family_id': user['family_id'], 'family_name': family['name'] if family else '', 'family_code': family['code'] if family else ''
    }})

@app.route('/api/auth/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({'code': 0, 'msg': '已退出'})

@app.route('/api/auth/me', methods=['GET'])
def get_me():
    if not session.get('user_id'):
        return jsonify({'code': 0, 'data': None})
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ?", (session['user_id'],)).fetchone()
    family = conn.execute("SELECT * FROM families WHERE id = ?", (session['family_id'],)).fetchone() if user else None
    conn.close()
    if not user:
        return jsonify({'code': 0, 'data': None})
    # 补设 session['role_type']，修复登录于该字段引入之前的旧会话
    session['role_type'] = user['role_type'] or user['role']
    return jsonify({'code': 0, 'data': {
        'user_id': user['id'], 'username': user['username'], 'role': user['role'],
        'role_type': user['role_type'] or user['role'],
        'is_elderly': user['is_elderly'], 'elderly_name': user['elderly_name'],
        'family_id': user['family_id'], 'family_name': family['name'] if family else '',
        'family_code': family['code'] if family else ''
    }})

# ========== 家庭管理 API ==========

@app.route('/api/family/join', methods=['POST'])
def join_family():
    data = request.json
    code = data.get('code', '').strip().upper()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not code or not username or not password:
        return jsonify({'code': 1, 'msg': '参数不完整'}), 400
    
    conn = get_db()
    family = conn.execute("SELECT * FROM families WHERE code = ? OR invite_code = ?", (code, code)).fetchone()
    if not family:
        conn.close()
        return jsonify({'code': 1, 'msg': '邀请码无效'}), 404
    
    existing_in_family = conn.execute(
        "SELECT id FROM users WHERE username = ? AND family_id = ?",
        (username, family['id'])
    ).fetchone()
    if existing_in_family:
        conn.close()
        return jsonify({'code': 1, 'msg': '该用户名已在该家庭中'}), 400
    
    existing_user = conn.execute("SELECT id, password_hash FROM users WHERE username = ?", (username,)).fetchone()
    if existing_user:
        if not verify_password(password, existing_user['password_hash']):
            conn.close()
            return jsonify({'code': 1, 'msg': '用户名或密码错误'}), 401
        
        conn.execute("UPDATE users SET family_id = ? WHERE id = ?", (family['id'], existing_user['id']))
    else:
        conn.execute("INSERT INTO users (username, password_hash, family_id, role, role_type) VALUES (?, ?, ?, 'member', 'member')",
                     (username, hash_password(password), family['id']))
    conn.commit()
    conn.close()
    
    return jsonify({'code': 0, 'msg': f'成功加入「{family["name"]}」'})

# ===== 邀请申请 API（两种方式：admin邀请member同意，member申请admin同意）=====

@app.route('/api/family/invitation/apply', methods=['POST'])
def apply_join_family():
    """方式一：member申请加入家庭，需admin审批"""
    data = request.json
    invite_code = data.get('invite_code', '').strip().upper()
    username = data.get('username', '').strip()
    password = data.get('password', '')
    
    if not invite_code or not username or not password:
        return jsonify({'code': 1, 'msg': '参数不完整'}), 400
    if len(password) < 3:
        return jsonify({'code': 1, 'msg': '密码至少3位'}), 400
    
    conn = get_db()
    
    family = conn.execute("SELECT * FROM families WHERE invite_code = ?", (invite_code,)).fetchone()
    if not family:
        conn.close()
        return jsonify({'code': 1, 'msg': '邀请码无效'}), 404
    
    existing_user = conn.execute("SELECT id, family_id, password_hash FROM users WHERE username = ?", (username,)).fetchone()
    if existing_user:
        if existing_user['family_id'] == family['id']:
            conn.close()
            return jsonify({'code': 1, 'msg': '您已在该家庭中'}), 400
        if existing_user['family_id'] is not None:
            conn.close()
            return jsonify({'code': 1, 'msg': '该用户名已在其他家庭中'}), 400
        if not verify_password(password, existing_user['password_hash']):
            conn.close()
            return jsonify({'code': 1, 'msg': '用户名或密码错误'}), 401
    
    existing_apply = conn.execute(
        "SELECT id, status FROM family_invitations WHERE applicant_username = ? AND family_id = ?",
        (username, family['id'])
    ).fetchone()
    if existing_apply:
        if existing_apply['status'] == 'pending':
            conn.close()
            return jsonify({'code': 1, 'msg': '您已申请加入该家庭，请等待管理员审批'}), 400
        elif existing_apply['status'] == 'approved':
            if existing_user and existing_user['family_id'] is None:
                conn.execute("DELETE FROM family_invitations WHERE id = ?", (existing_apply['id'],))
            else:
                conn.close()
                return jsonify({'code': 1, 'msg': '您已成功加入该家庭，请登录'}), 400
        elif existing_apply['status'] == 'rejected':
            conn.execute("DELETE FROM family_invitations WHERE id = ?", (existing_apply['id'],))
    
    conn.execute('''
        INSERT INTO family_invitations (family_id, invite_code, applicant_username, applicant_password_hash, status)
        VALUES (?, ?, ?, ?, 'pending')
    ''', (family['id'], invite_code, username, hash_password(password)))
    conn.commit()
    conn.close()
    
    return jsonify({'code': 0, 'msg': f'申请已提交，请等待「{family["name"]}」管理员审批'})

@app.route('/api/family/invitation/list', methods=['GET'])
def list_invitations():
    """admin查看待审批的申请列表"""
    auth = require_auth()
    if auth: return auth
    if session.get('role') != 'admin':
        return jsonify({'code': 403, 'msg': '仅管理员可查看'}), 403
    
    family_id = get_current_family_id()
    conn = get_db()
    invitations = [dict(r) for r in conn.execute(
        "SELECT id, applicant_username, invite_code, status, created_at, approved_at FROM family_invitations WHERE family_id = ? ORDER BY created_at DESC",
        (family_id,)
    ).fetchall()]
    conn.close()
    
    return jsonify({'code': 0, 'data': invitations})

@app.route('/api/family/invitation/<int:invite_id>/approve', methods=['POST'])
def approve_invitation(invite_id):
    """admin审批通过申请"""
    auth = require_auth()
    if auth: return auth
    if session.get('role') != 'admin':
        return jsonify({'code': 403, 'msg': '仅管理员可审批'}), 403
    
    family_id = get_current_family_id()
    conn = get_db()
    
    invitation = conn.execute(
        "SELECT * FROM family_invitations WHERE id = ? AND family_id = ? AND status = 'pending'",
        (invite_id, family_id)
    ).fetchone()
    
    if not invitation:
        conn.close()
        return jsonify({'code': 1, 'msg': '申请不存在或已处理'}), 404
    
    existing_user = conn.execute("SELECT id FROM users WHERE username = ?", (invitation['applicant_username'],)).fetchone()
    if existing_user:
        conn.execute("UPDATE users SET family_id = ? WHERE id = ?", (family_id, existing_user['id']))
        conn.execute("UPDATE family_invitations SET status = 'approved', approved_by = ?, approved_at = datetime('now','localtime') WHERE id = ?",
                     (session.get('user_id'), invite_id))
        conn.commit()
        conn.close()
        return jsonify({'code': 0, 'msg': '申请已通过，请用户登录'}), 200
    
    conn.execute("INSERT INTO users (username, password_hash, family_id, role, role_type) VALUES (?, ?, ?, 'member', 'member')",
                 (invitation['applicant_username'], invitation['applicant_password_hash'], family_id))
    conn.execute("UPDATE family_invitations SET status = 'approved', approved_by = ?, approved_at = datetime('now','localtime') WHERE id = ?",
                 (session.get('user_id'), invite_id))
    conn.commit()
    conn.close()
    
    return jsonify({'code': 0, 'msg': '申请已通过，用户已加入家庭'})

@app.route('/api/family/invitation/<int:invite_id>/reject', methods=['POST'])
def reject_invitation(invite_id):
    """admin拒绝申请"""
    auth = require_auth()
    if auth: return auth
    if session.get('role') != 'admin':
        return jsonify({'code': 403, 'msg': '仅管理员可审批'}), 403
    
    family_id = get_current_family_id()
    conn = get_db()
    
    invitation = conn.execute(
        "SELECT * FROM family_invitations WHERE id = ? AND family_id = ? AND status = 'pending'",
        (invite_id, family_id)
    ).fetchone()
    
    if not invitation:
        conn.close()
        return jsonify({'code': 1, 'msg': '申请不存在或已处理'}), 404
    
    conn.execute("UPDATE family_invitations SET status = 'rejected', approved_by = ?, approved_at = datetime('now','localtime') WHERE id = ?",
                 (session.get('user_id'), invite_id))
    conn.commit()
    conn.close()
    
    return jsonify({'code': 0, 'msg': '申请已拒绝'})

@app.route('/api/family/invitation/status', methods=['GET'])
def invitation_status():
    """查看当前用户的申请状态"""
    auth = require_auth()
    if auth: return auth
    
    username = session.get('username', '')
    family_id = get_current_family_id()
    
    conn = get_db()
    invitation = conn.execute(
        "SELECT status, approved_at FROM family_invitations WHERE applicant_username = ? AND family_id = ? ORDER BY created_at DESC LIMIT 1",
        (username, family_id)
    ).fetchone()
    conn.close()
    
    if invitation:
        return jsonify({'code': 0, 'data': {'status': invitation['status'], 'approved_at': invitation['approved_at']}})
    return jsonify({'code': 0, 'data': {'status': 'none'}})



@app.route('/api/family/members', methods=['GET'])
def family_members():
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    conn = get_db()
    members = [dict(r) for r in conn.execute(
        "SELECT id, username, role, role_type, is_elderly, elderly_name, caregiver_id, created_at FROM users WHERE family_id = ? ORDER BY created_at", (family_id,)
    ).fetchall()]
    family = conn.execute("SELECT * FROM families WHERE id = ?", (family_id,)).fetchone()
    conn.close()
    
    return jsonify({'code': 0, 'data': {
        'family': dict(family) if family else {},
        'members': members
    }})

# ========== 家庭成员用药 API ==========

@app.route('/api/members/<int:uid>/medicines', methods=['GET'])
def get_member_medicines(uid):
    """获取某家庭成员的用药列表"""
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    conn = get_db()
    
    # 验证该成员属于同一家庭
    user = conn.execute("SELECT * FROM users WHERE id = ? AND family_id = ?", (uid, family_id)).fetchone()
    if not user:
        conn.close()
        return jsonify({'code': 1, 'msg': '成员不存在'}), 404
    
    rows = [dict(r) for r in conn.execute('''
        SELECT mm.id as record_id, mm.notes, mm.created_at as assigned_at,
               m.id, m.name, m.manufacturer, m.category, m.expiry_date, m.production_date, m.status,
               m.stock_quantity, m.unit_label, m.pack_total_units, m.storage
        FROM member_medicines mm
        JOIN medicines m ON mm.medicine_id = m.id
        WHERE mm.user_id = ?
        ORDER BY m.status, m.expiry_date ASC
    ''', (uid,)).fetchall()]

    # 添加 days_left 与库存心跳（保留 conn 用于 heartbeat 调用）
    for row in rows:
        try:
            exp = datetime.strptime(row['expiry_date'], '%Y-%m-%d').date()
            row['days_left'] = (exp - date.today()).days
        except Exception:
            row['days_left'] = None
        try:
            hb = _compute_inventory_heartbeat(row['id'], conn)
            if hb:
                row['stock_remaining_units'] = hb.get('remaining_units')
                row['daily_dose'] = hb.get('daily_rate')
                row['stock_days_left'] = hb.get('days_left')
                row['stock_days_left_float'] = hb.get('days_left_float')
                row['stock_status'] = hb.get('status')
                row['stock_confidence'] = hb.get('confidence')
                row['depletion_date'] = hb.get('depletion_date')
            else:
                row['stock_status'] = 'unknown'
                row['stock_days_left'] = None
                row['stock_days_left_float'] = None
        except Exception:
            row['stock_status'] = 'unknown'
            row['stock_days_left'] = None
            row['stock_days_left_float'] = None
    conn.close()

    return jsonify({'code': 0, 'data': rows, 'member': {'id': user['id'], 'username': user['username']}})

@app.route('/api/members/<int:uid>/medicines', methods=['POST'])
@require_non_elderly
def assign_member_medicine(uid):
    """为家庭成员分配药品（admin/member 可操作，老人不可）"""
    family_id = get_current_family_id()
    data = request.json
    medicine_id = data.get('medicine_id')
    notes = data.get('notes', '')
    
    if not medicine_id:
        return jsonify({'code': 1, 'msg': '请选择药品'}), 400
    
    conn = get_db()
    
    # 验证成员和药品属于同一家庭
    user = conn.execute("SELECT * FROM users WHERE id = ? AND family_id = ?", (uid, family_id)).fetchone()
    if not user:
        conn.close()
        return jsonify({'code': 1, 'msg': '成员不存在'}), 404
    
    med = conn.execute("SELECT * FROM medicines WHERE id = ? AND family_id = ?", (medicine_id, family_id)).fetchone()
    if not med:
        conn.close()
        return jsonify({'code': 1, 'msg': '药品不存在'}), 404
    
    try:
        conn.execute('''
            INSERT INTO member_medicines (user_id, medicine_id, notes) VALUES (?, ?, ?)
        ''', (uid, medicine_id, notes))
        conn.commit()
        new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.close()
        
        # 异步触发药物冲突检测
        threading.Thread(target=_check_drug_interactions_for_member, args=(uid, family_id), daemon=True).start()
        
        return jsonify({'code': 0, 'msg': '已分配', 'id': new_id})
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({'code': 1, 'msg': '该药品已分配给此成员'}), 400

@app.route('/api/member-medicines/<int:mid>', methods=['DELETE'])
@require_non_elderly
def remove_member_medicine(mid):
    """移除家庭成员的药品分配（admin/member 可操作，老人不可）"""
    family_id = get_current_family_id()
    conn = get_db()
    
    # 验证该记录属于同一家庭
    record = conn.execute('''
        SELECT mm.id FROM member_medicines mm
        JOIN users u ON mm.user_id = u.id
        WHERE mm.id = ? AND u.family_id = ?
    ''', (mid, family_id)).fetchone()
    
    if not record:
        conn.close()
        return jsonify({'code': 1, 'msg': '记录不存在'}), 404
    
    conn.execute("DELETE FROM member_medicines WHERE id = ?", (mid,))
    conn.commit()
    conn.close()
    return jsonify({'code': 0, 'msg': '已移除'})

# ========== 药品目录 API ==========

@app.route('/api/catalog', methods=['GET'])
def list_catalog():
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    conn = get_db()
    rows = [dict(r) for r in conn.execute(
        "SELECT * FROM medicine_catalog WHERE family_id = ? ORDER BY name", (family_id,)
    ).fetchall()]
    conn.close()
    return jsonify({'code': 0, 'data': rows})

@app.route('/api/catalog', methods=['POST'])
def add_catalog():
    auth = require_auth()
    if auth: return auth
    
    data = request.json
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'code': 1, 'msg': '药品名称不能为空'}), 400
    
    family_id = get_current_family_id()
    conn = get_db()
    
    # 检查是否已存在同名
    exist = conn.execute("SELECT id FROM medicine_catalog WHERE family_id = ? AND name = ? AND manufacturer = ?",
                         (family_id, name, data.get('manufacturer', ''))).fetchone()
    if exist:
        conn.execute("UPDATE medicine_catalog SET shelf_life_months = ?, updated_at = datetime('now','localtime') WHERE id = ?",
                     (data.get('shelf_life_months', 24), exist['id']))
        conn.commit()
        conn.close()
        return jsonify({'code': 0, 'msg': '已更新保质期', 'id': exist['id']})
    
    conn.execute("INSERT INTO medicine_catalog (family_id, manufacturer, name, shelf_life_months) VALUES (?, ?, ?, ?)",
                 (family_id, data.get('manufacturer', ''), name, data.get('shelf_life_months', 24)))
    conn.commit()
    new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.close()
    return jsonify({'code': 0, 'msg': '已加入目录', 'id': new_id})

@app.route('/api/catalog/<int:cid>', methods=['DELETE'])
def delete_catalog(cid):
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    conn = get_db()
    conn.execute("DELETE FROM medicine_catalog WHERE id = ? AND family_id = ?", (cid, family_id))
    conn.commit()
    conn.close()
    return jsonify({'code': 0, 'msg': '已从目录移除'})

# ========== 药品 API (带家庭隔离) ==========

@app.route('/api/medicines', methods=['GET'])
def list_medicines():
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    sort = request.args.get('sort', 'expiry_asc')
    category = request.args.get('category', '')
    status = request.args.get('status', '')
    
    conn = get_db()
    query = 'SELECT * FROM medicines WHERE family_id = ?'
    params = [family_id]
    
    if category:
        query += ' AND category = ?'
        params.append(category)
    if status:
        query += ' AND status = ?'
        params.append(status)
    
    # 已用完药品排到列表底部
    if sort == 'expiry_asc':
        query += " ORDER BY CASE WHEN status = 'used' THEN 1 ELSE 0 END, expiry_date ASC"
    elif sort == 'expiry_desc':
        query += " ORDER BY CASE WHEN status = 'used' THEN 1 ELSE 0 END, expiry_date DESC"
    elif sort == 'name_asc':
        query += " ORDER BY CASE WHEN status = 'used' THEN 1 ELSE 0 END, name ASC"
    elif sort == 'created_desc':
        query += " ORDER BY CASE WHEN status = 'used' THEN 1 ELSE 0 END, created_at DESC"
    else:
        query += " ORDER BY CASE WHEN status = 'used' THEN 1 ELSE 0 END, expiry_date ASC"
    
    medicines = [dict(row) for row in conn.execute(query, params).fetchall()]
    conn.close()
    
    return jsonify({'code': 0, 'data': add_days_left(medicines), 'total': len(medicines)})

@app.route('/api/medicines', methods=['POST'])
@require_non_elderly
def add_medicine():
    data = request.json
    required = ['name', 'expiry_date']
    for field in required:
        if not data.get(field):
            return jsonify({'code': 1, 'msg': f'缺少必填字段: {field}'}), 400
    
    family_id = get_current_family_id()
    conn = get_db()
    # 库存字段：录入时若提供 pack_total_units，则初始化 stock_quantity = pack_total_units
    pack_total = int(data.get('pack_total_units', 0) or 0)
    stock_qty = data.get('stock_quantity')
    if stock_qty is None or float(stock_qty) <= 0:
        # 兜底：未传或非正时，优先用 pack_total，至少为 1（避免显示 0 片）
        stock_qty = max(float(pack_total), 1.0)
    else:
        stock_qty = float(stock_qty)
    # 迭代新需求3：未指定 storage 时默认 '默认药箱'，避免分散存储
    storage = data.get('storage') or '默认药箱'
    conn.execute('''
        INSERT INTO medicines (family_id, name, manufacturer, category, production_date, expiry_date, created_by,
            indications, usage_dosage, adverse_reactions, contraindications, storage, approval_number,
            pack_total_units, unit_label, restock_threshold_days, stock_quantity, photo_url, note)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (family_id, data['name'], data.get('manufacturer', ''),
          data.get('category', '其他'), data.get('production_date', ''),
          data['expiry_date'], session.get('user_id'),
          data.get('indications', ''), data.get('usage_dosage', ''),
          data.get('adverse_reactions', ''), data.get('contraindications', ''),
          storage, data.get('approval_number', ''),
          pack_total, data.get('unit_label', '片'),
          int(data.get('restock_threshold_days', 7) or 7), stock_qty,
          data.get('photo_url', ''), data.get('note', '')))
    med_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    # 阶段3：写入变更流水（SSE 同步基础）—— 与主表同事务
    changes_json = _json.dumps({'name': data['name'], 'manufacturer': data.get('manufacturer', ''), 'stock_quantity': stock_qty}, ensure_ascii=False)
    conn.execute('INSERT INTO medicine_changes (family_id, medicine_id, action, changes, version, user_id) VALUES (?, ?, ?, ?, ?, ?)',
                 (family_id, med_id, 'add', changes_json, 1, session.get('user_id')))

    # 同时保存到药品目录（如已存在则更新保质期）
    conn.execute('''
        INSERT INTO medicine_catalog (family_id, manufacturer, name, shelf_life_months)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(family_id, manufacturer, name) DO UPDATE SET
            shelf_life_months = excluded.shelf_life_months,
            updated_at = datetime('now','localtime')
    ''', (family_id, data.get('manufacturer', ''), data['name'], data.get('shelf_life_months', 24)))
    
    conn.commit()
    # 广播必须在 commit 之后，确保 SSE 客户端拉取时能看到最新数据
    _broadcast_medicine_change(family_id, 'add', med_id, 1, {'name': data['name']})
    conn.close()
    return jsonify({'code': 0, 'msg': '添加成功', 'id': med_id})

@app.route('/api/medicines/search', methods=['GET'])
def search_medicines():
    """搜索药品：支持按名称、病症、分类"""
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    q = request.args.get('q', '').strip()
    disease = request.args.get('disease', '').strip()
    category = request.args.get('category', '').strip()
    
    conn = get_db()
    query = 'SELECT * FROM medicines WHERE family_id = ? AND status = ?'
    params = [family_id, 'active']
    
    # 按病症搜索 → 转换为分类搜索
    if disease and disease in DISEASE_CATEGORY_MAP:
        cat_list = DISEASE_CATEGORY_MAP[disease]
        placeholders = ','.join(['?'] * len(cat_list))
        query += f' AND category IN ({placeholders})'
        params.extend(cat_list)
    elif category:
        query += ' AND category = ?'
        params.append(category)
    
    # 按名称模糊搜索
    if q:
        query += ' AND name LIKE ?'
        params.append(f'%{q}%')
    
    query += " ORDER BY CASE WHEN status = 'used' THEN 1 ELSE 0 END, expiry_date ASC"
    
    medicines = [dict(row) for row in conn.execute(query, params).fetchall()]
    conn.close()
    
    return jsonify({'code': 0, 'data': add_days_left(medicines), 'total': len(medicines)})

@app.route('/api/medicines/<int:mid>', methods=['GET'])
def get_medicine(mid):
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    conn = get_db()
    row = conn.execute("SELECT * FROM medicines WHERE id = ? AND family_id = ?", (mid, family_id)).fetchone()
    conn.close()
    if not row:
        return jsonify({'code': 1, 'msg': '药品不存在'}), 404
    return jsonify({'code': 0, 'data': dict(row)})

@app.route('/api/medicines/<int:mid>', methods=['PUT'])
@require_non_elderly
def update_medicine(mid):
    data = request.json
    family_id = get_current_family_id()
    conn = get_db()
    existing = conn.execute("SELECT * FROM medicines WHERE id = ? AND family_id = ?", (mid, family_id)).fetchone()
    if not existing:
        conn.close()
        return jsonify({'code': 1, 'msg': '药品不存在'}), 404
    
    fields = ['name', 'manufacturer', 'category', 'production_date', 'expiry_date', 'status',
              'indications', 'usage_dosage', 'adverse_reactions', 'contraindications', 'storage', 'approval_number',
              'pack_total_units', 'unit_label', 'restock_threshold_days', 'stock_quantity', 'photo_url', 'note']
    updates = []
    params = []
    for f in fields:
        if f in data:
            updates.append(f'{f} = ?')
            params.append(data[f])
    if updates:
        updates.append("updated_at = datetime('now','localtime')")
        updates.append("version = version + 1")
        params.append(mid)
        conn.execute(f'UPDATE medicines SET {", ".join(updates)} WHERE id = ?', params)
        # 读取更新后的 version 用于广播
        new_version = conn.execute("SELECT version FROM medicines WHERE id = ?", (mid,)).fetchone()[0]
        # 阶段3：写入变更流水（SSE 同步）—— 与主表同事务
        changes_json = _json.dumps(data, ensure_ascii=False)
        conn.execute('INSERT INTO medicine_changes (family_id, medicine_id, action, changes, version, user_id) VALUES (?, ?, ?, ?, ?, ?)',
                     (family_id, mid, 'update', changes_json, new_version, session.get('user_id')))
        conn.commit()
        # 广播必须在 commit 之后
        _broadcast_medicine_change(family_id, 'update', mid, new_version, {'name': data.get('name', existing['name'])})
    conn.close()
    return jsonify({'code': 0, 'msg': '更新成功'})

@app.route('/api/medicines/<int:mid>', methods=['DELETE'])
@require_non_elderly
def delete_medicine(mid):
    family_id = get_current_family_id()
    conn = get_db()
    try:
        # 先读取药品名与版本用于广播（删除后无法再查）
        med = conn.execute("SELECT name, version FROM medicines WHERE id = ? AND family_id = ?", (mid, family_id)).fetchone()
        # 级联删除依赖表（防止外键约束阻止删除）
        conn.execute("DELETE FROM member_medicines WHERE medicine_id = ?", (mid,))
        conn.execute("DELETE FROM reminder_schedules WHERE medicine_id = ?", (mid,))
        conn.execute("DELETE FROM checkin_records WHERE medicine_id = ?", (mid,))
        conn.execute("DELETE FROM alerts WHERE medicine_id = ?", (mid,))
        conn.execute("DELETE FROM drug_interaction_alerts WHERE medicine_ids LIKE ?", (f'%{mid}%',))
        conn.execute("DELETE FROM medicine_changes WHERE medicine_id = ?", (mid,))
        conn.execute("DELETE FROM medicines WHERE id = ? AND family_id = ?", (mid, family_id))
        # 阶段3：写入变更流水（SSE 同步）—— 与主表同事务
        med_name = med['name'] if med else ''
        med_version = med['version'] if med else 0
        changes_json = _json.dumps({'name': med_name}, ensure_ascii=False)
        conn.execute('INSERT INTO medicine_changes (family_id, medicine_id, action, changes, version, user_id) VALUES (?, ?, ?, ?, ?, ?)',
                     (family_id, mid, 'delete', changes_json, med_version, session.get('user_id')))
        conn.commit()
        # 广播必须在 commit 之后
        _broadcast_medicine_change(family_id, 'delete', mid, med_version, {'name': med_name})
        conn.close()
        return jsonify({'code': 0, 'msg': '删除成功'})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'code': 400, 'msg': f'无法删除：{str(e)}'})

@app.route('/api/medicines/batch-delete', methods=['POST'])
@require_non_elderly
def batch_delete_medicines():
    data = request.get_json()
    ids_str = data.get('ids', '')
    if not ids_str:
        return jsonify({'code': 400, 'msg': '请选择要删除的药品'}), 400

    family_id = get_current_family_id()
    conn = get_db()
    try:
        ids = [int(x.strip()) for x in ids_str.split(',') if x.strip().isdigit()]
        if not ids:
            return jsonify({'code': 400, 'msg': '无效的药品ID'}), 400

        for mid in ids:
            med = conn.execute("SELECT name, version FROM medicines WHERE id = ? AND family_id = ?", (mid, family_id)).fetchone()
            conn.execute("DELETE FROM member_medicines WHERE medicine_id = ?", (mid,))
            conn.execute("DELETE FROM reminder_schedules WHERE medicine_id = ?", (mid,))
            conn.execute("DELETE FROM checkin_records WHERE medicine_id = ?", (mid,))
            conn.execute("DELETE FROM alerts WHERE medicine_id = ?", (mid,))
            conn.execute("DELETE FROM drug_interaction_alerts WHERE medicine_ids LIKE ?", (f'%{mid}%',))
            conn.execute("DELETE FROM medicine_changes WHERE medicine_id = ?", (mid,))
            conn.execute("DELETE FROM medicines WHERE id = ? AND family_id = ?", (mid, family_id))
            if med:
                med_name = med['name']
                med_version = med['version']
                changes_json = _json.dumps({'name': med_name}, ensure_ascii=False)
                conn.execute('INSERT INTO medicine_changes (family_id, medicine_id, action, changes, version, user_id) VALUES (?, ?, ?, ?, ?, ?)',
                             (family_id, mid, 'delete', changes_json, med_version, session.get('user_id')))
                _broadcast_medicine_change(family_id, 'delete', mid, med_version, {'name': med_name})

        conn.commit()
        conn.close()
        return jsonify({'code': 0, 'msg': '删除成功'})
    except Exception as e:
        conn.rollback()
        conn.close()
        return jsonify({'code': 400, 'msg': f'无法删除：{str(e)}'})


@app.route('/api/medicines/<int:mid>/use', methods=['POST'])
def mark_used(mid):
    auth = require_auth()
    if auth: return auth

    family_id = get_current_family_id()
    conn = get_db()
    conn.execute("UPDATE medicines SET status = 'used', stock_quantity = 0, updated_at = datetime('now','localtime') WHERE id = ? AND family_id = ?", (mid, family_id))
    # 联动：药品标记为用完后，禁用该药品的所有提醒，防止继续推送已用完药的提醒
    conn.execute(
        """UPDATE reminder_schedules SET enabled = 0
           WHERE medicine_id = ? AND medicine_id IN (SELECT id FROM medicines WHERE family_id = ?)""",
        (mid, family_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'code': 0, 'msg': '已标记为用完，相关提醒已停用'})

# ========== 库存心跳引擎 API（迭代4：药品库存预警 spec 兑现 + 心跳预测创新）==========

@app.route('/api/inventory/heartbeat/<int:mid>', methods=['GET'])
def inventory_heartbeat(mid):
    """查询单药品库存心跳（剩余量/日均消耗/可服天数/断药日期/状态）"""
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    conn = get_db()
    med = conn.execute("SELECT id, name, stock_quantity, pack_total_units, unit_label, restock_threshold_days FROM medicines WHERE id = ? AND family_id = ?", (mid, family_id)).fetchone()
    if not med:
        conn.close()
        return jsonify({'code': 1, 'msg': '药品不存在'}), 404
    heartbeat = _compute_inventory_heartbeat(mid, conn)
    conn.close()
    if not heartbeat:
        return jsonify({'code': 1, 'msg': '计算失败'}), 500
    heartbeat['medicine_id'] = mid
    heartbeat['medicine_name'] = med['name']
    heartbeat['unit_label'] = med['unit_label']
    return jsonify({'code': 0, 'data': heartbeat})


@app.route('/api/medicines/<int:mid>/adjust-stock', methods=['POST'])
@require_non_elderly
def adjust_stock(mid):
    """库存增删管理：管理员/成员手动调整药品库存（补货入库/修正损耗）"""
    family_id = get_current_family_id()
    data = request.get_json() or {}
    delta = data.get('delta')
    if delta is None:
        return jsonify({'code': 1, 'msg': '缺少调整量 delta'}), 400
    try:
        delta = float(delta)
    except (ValueError, TypeError):
        return jsonify({'code': 1, 'msg': '调整量必须为数字'}), 400

    conn = get_db()
    med = conn.execute(
        "SELECT id, name, stock_quantity, unit_label, pack_total_units FROM medicines WHERE id = ? AND family_id = ?",
        (mid, family_id)
    ).fetchone()
    if not med:
        conn.close()
        return jsonify({'code': 1, 'msg': '药品不存在'}), 404
    new_qty = float(med['stock_quantity'] or 0) + delta
    if new_qty < 0:
        new_qty = 0
    conn.execute(
        "UPDATE medicines SET stock_quantity = ?, version = version + 1, updated_at = datetime('now','localtime') WHERE id = ?",
        (new_qty, mid)
    )
    # 迭代新需求6：调整后若 stock > pack_total，同步更新 pack_total 避免 a>b 逻辑错误
    pack_total = float(med['pack_total_units'] or 0)
    if new_qty > pack_total:
        conn.execute('UPDATE medicines SET pack_total_units = ? WHERE id = ?', (new_qty, mid))
    # 读取更新后的 version 用于广播
    new_version = conn.execute("SELECT version FROM medicines WHERE id = ?", (mid,)).fetchone()[0]
    # 阶段3：写入变更流水（SSE 同步）—— 与主表同事务
    changes_json = _json.dumps({'stock_quantity': new_qty, 'delta': delta, 'unit_label': med['unit_label']}, ensure_ascii=False)
    conn.execute('INSERT INTO medicine_changes (family_id, medicine_id, action, changes, version, user_id) VALUES (?, ?, ?, ?, ?, ?)',
                 (family_id, mid, 'adjust_stock', changes_json, new_version, session.get('user_id')))
    conn.commit()
    # 广播必须在 commit 之后
    _broadcast_medicine_change(family_id, 'adjust_stock', mid, new_version, {'name': med['name'], 'stock_quantity': new_qty})
    conn.close()
    return jsonify({
        'code': 0,
        'msg': f'库存已{"增加" if delta > 0 else "减少"} {abs(delta)}{med["unit_label"] or "片"}',
        'data': {'medicine_id': mid, 'new_stock_quantity': new_qty, 'unit_label': med['unit_label']}
    })

@app.route('/api/medicines/<int:mid>/upload-photo', methods=['POST'])
@require_non_elderly
def upload_medicine_photo(mid):
    """上传药品照片：admin/member 均可，老人不可"""
    family_id = get_current_family_id()
    conn = get_db()
    med = conn.execute("SELECT id, name FROM medicines WHERE id = ? AND family_id = ?", (mid, family_id)).fetchone()
    if not med:
        conn.close()
        return jsonify({'code': 1, 'msg': '药品不存在'}), 404

    photo = request.files.get('photo')
    if not photo or not photo.filename:
        conn.close()
        return jsonify({'code': 1, 'msg': '未选择图片'}), 400

    import uuid
    ext = os.path.splitext(photo.filename)[1].lower()
    if ext not in ('.jpg', '.jpeg', '.png', '.gif', '.webp'):
        ext = '.jpg'
    filename = f"medphoto_{uuid.uuid4().hex}{ext}"
    photo.save(os.path.join(UPLOAD_DIR, filename))
    photo_url = f"/uploads/{filename}"
    register_upload(filename, family_id, session.get('user_id'))

    conn.execute("UPDATE medicines SET photo_url = ?, updated_at = datetime('now','localtime') WHERE id = ?", (photo_url, mid))
    conn.commit()
    conn.close()
    return jsonify({'code': 0, 'msg': '照片已上传', 'data': {'photo_url': photo_url}})


@app.route('/api/inventory/restock-list', methods=['GET'])
def inventory_restock_list():
    """家庭补货清单：聚合所有需要补货的药品（status in pulse/depleted），按 days_left 升序"""
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    conn = get_db()
    meds = conn.execute(
        "SELECT id, name, stock_quantity, pack_total_units, unit_label, restock_threshold_days, manufacturer, category FROM medicines WHERE family_id = ? AND status = 'active' ORDER BY name",
        (family_id,)
    ).fetchall()
    restock_items = []
    for m in meds:
        heartbeat = _compute_inventory_heartbeat(m['id'], conn)
        if heartbeat and heartbeat['status'] in ('pulse', 'depleted', 'watch'):
            restock_items.append({
                'medicine_id': m['id'],
                'name': m['name'],
                'manufacturer': m['manufacturer'],
                'category': m['category'],
                'remaining_units': heartbeat['remaining_units'],
                'unit_label': m['unit_label'],
                'daily_rate': heartbeat['daily_rate'],
                'days_left': heartbeat['days_left'],
                'depletion_date': heartbeat['depletion_date'],
                'status': heartbeat['status'],
                'confidence': heartbeat['confidence'],
                'suggest_buy': int(m['pack_total_units'] or 30),  # 建议购买量
            })
    conn.close()
    # 按 days_left 升序（None 排最后）
    restock_items.sort(key=lambda x: (x['days_left'] is None, x['days_left'] or 999))
    return jsonify({'code': 0, 'data': restock_items, 'total': len(restock_items)})


@app.route('/api/inventory/all', methods=['GET'])
def inventory_all():
    """所有药品库存心跳概览（管理员/成员仪表盘用）"""
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    conn = get_db()
    meds = conn.execute(
        "SELECT id, name, stock_quantity, pack_total_units, unit_label, restock_threshold_days FROM medicines WHERE family_id = ? AND status = 'active' ORDER BY name",
        (family_id,)
    ).fetchall()
    items = []
    for m in meds:
        heartbeat = _compute_inventory_heartbeat(m['id'], conn)
        items.append({
            'medicine_id': m['id'],
            'name': m['name'],
            'remaining_units': heartbeat['remaining_units'] if heartbeat else float(m['stock_quantity'] or 0),
            'unit_label': m['unit_label'],
            'days_left': heartbeat['days_left'] if heartbeat else None,
            'status': heartbeat['status'] if heartbeat else 'unknown',
            'confidence': heartbeat['confidence'] if heartbeat else 'low',
            'depletion_date': heartbeat['depletion_date'] if heartbeat else None,
        })
    conn.close()
    return jsonify({'code': 0, 'data': items, 'total': len(items)})

# ========== 统计 API ==========

@app.route('/api/stats', methods=['GET'])
def get_stats():
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    conn = get_db()
    today = date.today().isoformat()
    
    total = conn.execute("SELECT COUNT(*) FROM medicines WHERE status = 'active' AND family_id = ?", (family_id,)).fetchone()[0]
    total_all = conn.execute("SELECT COUNT(*) FROM medicines WHERE family_id = ?", (family_id,)).fetchone()[0]
    expired = conn.execute("SELECT COUNT(*) FROM medicines WHERE expiry_date < ? AND status = 'active' AND family_id = ?", (today, family_id)).fetchone()[0]
    near_expiry = conn.execute("SELECT COUNT(*) FROM medicines WHERE expiry_date >= ? AND expiry_date <= date(?, '+30 days') AND status = 'active' AND family_id = ?", (today, today, family_id)).fetchone()[0]
    used = conn.execute("SELECT COUNT(*) FROM medicines WHERE status = 'used' AND family_id = ?", (family_id,)).fetchone()[0]
    categories = conn.execute("SELECT category, COUNT(*) as cnt FROM medicines WHERE status = 'active' AND family_id = ? GROUP BY category", (family_id,)).fetchall()
    
    conn.close()
    return jsonify({'code': 0, 'data': {
        'total': total, 'total_all': total_all, 'expired': expired, 'near_expiry': near_expiry, 'used': used,
        'categories': [dict(r) for r in categories]
    }})

@app.route('/api/categories', methods=['GET'])
def get_categories():
    categories = {
        '内服药品': ['感冒药', '退烧止痛', '消炎药', '肠胃药', '过敏药', '心血管', '糖尿病', '维生素/保健品', '中成药', '止咳化痰', '安神助眠'],
        '外用药品': ['外用药', '皮肤用药', '眼药水/眼膏', '跌打损伤', '创可贴/敷料', '鼻腔用药', '耳部用药'],
        '其他': ['医疗器械', '其他']
    }
    return jsonify({'code': 0, 'data': categories})

# ========== 病症-分类映射 ==========
DISEASE_CATEGORY_MAP = {
    '感冒': ['感冒药', '止咳化痰', '退烧止痛'],
    '发烧': ['退烧止痛', '感冒药'],
    '咳嗽': ['止咳化痰', '感冒药'],
    '头痛': ['退烧止痛'],
    '牙痛': ['退烧止痛', '消炎药'],
    '胃痛': ['肠胃药'],
    '腹泻': ['肠胃药'],
    '便秘': ['肠胃药'],
    '消化不良': ['肠胃药'],
    '过敏': ['过敏药', '皮肤用药'],
    '鼻炎': ['过敏药', '鼻腔用药'],
    '皮肤瘙痒': ['皮肤用药', '过敏药'],
    '湿疹': ['皮肤用药'],
    '烫伤': ['外用药', '皮肤用药'],
    '跌打损伤': ['跌打损伤', '外用药'],
    '扭伤': ['跌打损伤', '外用药'],
    '肌肉酸痛': ['跌打损伤', '外用药'],
    '眼睛不适': ['眼药水/眼膏'],
    '耳朵不适': ['耳部用药'],
    '高血压': ['心血管'],
    '高血糖': ['糖尿病'],
    '失眠': ['安神助眠'],
    '伤口': ['创可贴/敷料', '外用药'],
    '缺乏维生素': ['维生素/保健品'],
    '炎症': ['消炎药'],
}

# ========== 搜索 API ==========

@app.route('/api/diseases', methods=['GET'])
def list_diseases():
    """返回可搜索的病症列表"""
    return jsonify({'code': 0, 'data': sorted(DISEASE_CATEGORY_MAP.keys())})

@app.route('/api/disease-mapping', methods=['GET'])
def get_disease_mapping():
    """返回病症→分类的映射关系"""
    return jsonify({'code': 0, 'data': DISEASE_CATEGORY_MAP})

# ========== 通知系统 API ==========

@app.route('/api/notifications/check', methods=['GET'])
def check_notifications():
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    conn = get_db()
    today = date.today()
    
    expired = conn.execute(
        "SELECT * FROM medicines WHERE expiry_date < ? AND status = 'active' AND family_id = ?", (today.isoformat(), family_id)
    ).fetchall()
    
    new_alerts = []
    for med in expired:
        exist = conn.execute(
            "SELECT id FROM alerts WHERE medicine_id = ? AND alert_type = 'expired' AND created_at > date('now','-1 days')",
            (med['id'],)
        ).fetchone()
        if not exist:
            conn.execute("INSERT INTO alerts (medicine_id, alert_type, message) VALUES (?, 'expired', ?)",
                         (med['id'], f"药品「{med['name']}」已过期！请及时处理"))
            new_alerts.append({'medicine_id': med['id'], 'type': 'expired', 'message': f"药品「{med['name']}」已过期！"})
    
    near = conn.execute(
        "SELECT * FROM medicines WHERE expiry_date >= ? AND expiry_date <= date(?, '+30 days') AND status = 'active' AND family_id = ?",
        (today.isoformat(), today.isoformat(), family_id)
    ).fetchall()
    
    for med in near:
        exist = conn.execute(
            "SELECT id FROM alerts WHERE medicine_id = ? AND alert_type = 'near_expiry' AND created_at > date('now','-1 days')",
            (med['id'],)
        ).fetchone()
        if not exist:
            exp = datetime.strptime(med['expiry_date'], '%Y-%m-%d').date()
            days = (exp - today).days
            conn.execute("INSERT INTO alerts (medicine_id, alert_type, message) VALUES (?, 'near_expiry', ?)",
                         (med['id'], f"药品「{med['name']}」将在 {days} 天后过期"))
            new_alerts.append({'medicine_id': med['id'], 'type': 'near_expiry', 'message': f"药品「{med['name']}」将在 {days} 天后过期"})
    
    conn.commit()
    
    unread = [dict(r) for r in conn.execute(
        "SELECT a.*, m.name as medicine_name, m.expiry_date, m.category FROM alerts a LEFT JOIN medicines m ON a.medicine_id = m.id WHERE a.is_read = 0 AND m.family_id = ? ORDER BY a.created_at DESC",
        (family_id,)
    ).fetchall()]
    
    conn.close()
    return jsonify({'code': 0, 'data': {'new': new_alerts, 'unread': unread, 'unread_count': len(unread)}})

@app.route('/api/notifications', methods=['GET'])
def list_notifications():
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    conn = get_db()
    limit = request.args.get('limit', 50, type=int)
    rows = [dict(r) for r in conn.execute(
        "SELECT a.*, m.name as medicine_name, m.expiry_date, m.category FROM alerts a LEFT JOIN medicines m ON a.medicine_id = m.id WHERE m.family_id = ? ORDER BY a.created_at DESC LIMIT ?",
        (family_id, limit)
    ).fetchall()]
    conn.close()
    return jsonify({'code': 0, 'data': rows})

@app.route('/api/notifications/<int:aid>/read', methods=['POST'])
def mark_notification_read(aid):
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    conn = get_db()
    # 校验该告警属于当前家庭，防止越权标记他人家庭告警
    conn.execute(
        "UPDATE alerts SET is_read = 1 WHERE id = ? AND medicine_id IN (SELECT id FROM medicines WHERE family_id = ?)",
        (aid, family_id)
    )
    conn.commit()
    conn.close()
    return jsonify({'code': 0, 'msg': '已标记为已读'})

@app.route('/api/notifications/read-all', methods=['POST'])
def mark_all_read():
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    conn = get_db()
    conn.execute("UPDATE alerts SET is_read = 1 WHERE is_read = 0 AND medicine_id IN (SELECT id FROM medicines WHERE family_id = ?)", (family_id,))
    conn.commit()
    conn.close()
    return jsonify({'code': 0, 'msg': '全部已读'})

# ========== AI 拍照识别 API (Task 3) ==========

_image_hash_cache = {}

def _compute_image_hash(image_data):
    """计算图片哈希值，用于缓存去重"""
    return hashlib.md5(image_data).hexdigest()

def _validate_and_compress_image(file_data, max_size_mb=None):
    """校验图片格式并压缩"""
    if max_size_mb is None:
        max_size_mb = config.MAX_IMAGE_SIZE_MB
    if len(file_data) > max_size_mb * 1024 * 1024:
        return None, "图片大小超过限制"
    try:
        img = Image.open(BytesIO(file_data))
        mime_type = f"image/{img.format.lower()}" if img.format else "image/jpeg"
        if mime_type not in config.ALLOWED_IMAGE_TYPES:
            return None, "不支持的图片格式"
        if max(img.size) > 2048:
            ratio = 2048 / max(img.size)
            new_size = (int(img.size[0] * ratio), int(img.size[1] * ratio))
            img = img.resize(new_size, Image.LANCZOS)
        buf = BytesIO()
        img_format = img.format or 'JPEG'
        img.save(buf, format=img_format, quality=85)
        return buf.getvalue(), mime_type
    except Exception as e:
        return None, f"图片处理失败: {str(e)}"

@app.route('/api/ai/ocr-recognize', methods=['POST'])
def ai_ocr_recognize():
    """
    AI 拍照识别药品信息（真正的数据库优先策略）
    
    检测流程：
    1. 如果提供了药品名称参数（name），先在数据库中精确匹配
       - 命中则直接返回，无需调用AI（零成本）
    2. 如果上传了图片，先计算图片哈希检查缓存
       - 缓存命中则直接返回历史识别结果（零成本）
    3. 调用 AI Vision API 识别
    4. 使用识别出的名称在数据库中匹配
       - 命中则复用数据库信息
       - 未命中则返回AI识别结果
    """
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    
    name_param = request.form.get('name', '').strip()
    manufacturer_param = request.form.get('manufacturer', '').strip()
    
    conn = get_db()
    
    if name_param:
        catalog_match = conn.execute(
            "SELECT * FROM medicine_catalog WHERE family_id = ? AND name = ?",
            (family_id, name_param)
        ).fetchone()
        
        if not catalog_match and manufacturer_param:
            catalog_match = conn.execute(
                "SELECT * FROM medicine_catalog WHERE family_id = ? AND name = ? AND manufacturer = ?",
                (family_id, name_param, manufacturer_param)
            ).fetchone()
        
        if catalog_match:
            conn.close()
            return jsonify({'code': 0, 'msg': '已在药箱目录中找到', 'data': {
                'source': 'database',
                'name': catalog_match['name'],
                'manufacturer': catalog_match['manufacturer'],
                'shelf_life_months': catalog_match['shelf_life_months'],
                'production_date': '',
                'expiry_date': '',
                'approval_number': '',
                'specification': '',
                'confidence': 'high',
                'duration_ms': 0,
            }})
    
    if 'image' not in request.files:
        conn.close()
        return jsonify({'code': 1, 'msg': '请上传图片或提供药品名称'}), 400
    
    file = request.files['image']
    file_data = file.read()
    if not file_data:
        conn.close()
        return jsonify({'code': 1, 'msg': '图片为空'}), 400
    
    image_hash = _compute_image_hash(file_data)
    
    if image_hash in _image_hash_cache:
        cached_result = _image_hash_cache[image_hash]
        conn.close()
        return jsonify({'code': 0, 'msg': '已在缓存中找到', 'data': cached_result})
    
    image_data, mime_type = _validate_and_compress_image(file_data)
    if image_data is None:
        conn.close()
        return jsonify({'code': 1, 'msg': mime_type}), 400
    
    result = ai_service.recognize_medicine(image_data, mime_type)
    
    conn.execute(
        "INSERT INTO ai_analysis_log (family_id, type, input_text, response_text, duration_ms) VALUES (?, 'ocr', ?, ?, ?)",
        (family_id, 'OCR 识别', result.get('content', '')[:500], result.get('duration_ms', 0))
    )
    conn.commit()
    
    if not result.get('success'):
        conn.close()
        return jsonify({'code': 1, 'msg': result.get('error', 'AI 识别失败，请重试')}), 500
    
    parsed = result.get('parsed', {})
    if not parsed.get('is_medicine', True):
        conn.close()
        return jsonify({'code': 1, 'msg': '未能识别到药品信息，请拍摄药品包装盒'}), 400
    
    if parsed.get('confidence') == 'low':
        conn.close()
        return jsonify({'code': 1, 'msg': '图片不够清晰，请重新拍摄'}), 400
    
    name = parsed.get('name', '').strip()
    manufacturer = parsed.get('manufacturer', '').strip()
    
    if not name:
        conn.close()
        return jsonify({'code': 1, 'msg': '未能识别药品名称'}), 400
    
    catalog_match = conn.execute(
        "SELECT * FROM medicine_catalog WHERE family_id = ? AND name = ?",
        (family_id, name)
    ).fetchone()
    
    if not catalog_match and manufacturer:
        catalog_match = conn.execute(
            "SELECT * FROM medicine_catalog WHERE family_id = ? AND name = ? AND manufacturer = ?",
            (family_id, name, manufacturer)
        ).fetchone()
    
    if catalog_match:
        data_result = {
            'source': 'database',
            'name': catalog_match['name'],
            'manufacturer': catalog_match['manufacturer'],
            'shelf_life_months': catalog_match['shelf_life_months'],
            'production_date': parsed.get('production_date', ''),
            'expiry_date': parsed.get('expiry_date', ''),
            'approval_number': parsed.get('approval_number', ''),
            'specification': parsed.get('specification', ''),
            'confidence': parsed.get('confidence', 'medium'),
            'duration_ms': result.get('duration_ms', 0),
        }
        _image_hash_cache[image_hash] = data_result
        conn.close()
        return jsonify({'code': 0, 'msg': '已在药箱目录中找到', 'data': data_result})
    
    data_result = {
        'source': 'ai',
        'name': name,
        'manufacturer': manufacturer,
        'production_date': parsed.get('production_date', ''),
        'expiry_date': parsed.get('expiry_date', ''),
        'approval_number': parsed.get('approval_number', ''),
        'specification': parsed.get('specification', ''),
        'confidence': parsed.get('confidence', 'medium'),
        'duration_ms': result.get('duration_ms', 0),
    }
    _image_hash_cache[image_hash] = data_result
    conn.close()
    return jsonify({'code': 0, 'msg': 'AI 识别完成', 'data': data_result})

# ========== 外部药品查询 API (Task 4) ==========

@app.route('/api/ai/drug-info', methods=['GET'])
def ai_drug_info():
    """外部药品知识库查询"""
    auth = require_auth()
    if auth: return auth
    
    drug_name = request.args.get('name', '').strip()
    if not drug_name:
        return jsonify({'code': 1, 'msg': '请输入药品名称'}), 400
    
    result = api_gateway.search_drug_info(drug_name)
    
    if result.get('success'):
        return jsonify({'code': 0, 'msg': '查询成功', 'data': {
            'source': result.get('source', 'api'),
            'drug_info': result.get('data', {})
        }})
    else:
        return jsonify({'code': 0, 'msg': result.get('error', '服务暂不可用'), 'data': {
            'source': result.get('source', 'degraded'),
            'drug_info': result.get('data', {})
        }})

# ========== 药物冲突检测 API (Task 5) ==========

def _check_drug_interactions_for_member(member_id, family_id):
    """后台异步检测某成员的药物相互作用"""
    conn = get_db()
    try:
        # 获取该成员的所有药品
        rows = conn.execute('''
            SELECT m.id, m.name FROM member_medicines mm
            JOIN medicines m ON mm.medicine_id = m.id
            WHERE mm.user_id = ? AND m.status = 'active'
        ''', (member_id,)).fetchall()
        
        if len(rows) < 2:
            return  # 少于 2 种药无需检测
        
        medicine_names = [r['name'] for r in rows]
        medicine_ids = [str(r['id']) for r in rows]
        
        result = ai_service.check_drug_interaction(medicine_names)
        
        if not result.get('success'):
            return
        
        parsed = result.get('parsed', {})
        
        # 记录 AI 分析日志
        conn.execute(
            "INSERT INTO ai_analysis_log (family_id, type, input_text, response_text, duration_ms) VALUES (?, 'drug_interaction', ?, ?, ?)",
            (family_id, '药物相互作用检测', str(medicine_names), result.get('duration_ms', 0))
        )
        
        # 仅在检测到风险时创建告警
        if parsed.get('has_interaction') and parsed.get('risk_level') in ('warning', 'danger'):
            conn.execute(
                """INSERT INTO drug_interaction_alerts 
                   (member_id, medicine_ids, risk_level, description, suggestion)
                   VALUES (?, ?, ?, ?, ?)""",
                (member_id, ','.join(medicine_ids),
                 parsed.get('risk_level', 'warning'),
                 parsed.get('description', ''),
                 parsed.get('suggestion', ''))
            )
            conn.commit()
    finally:
        conn.close()

@app.route('/api/ai/drug-interaction-check', methods=['POST'])
def ai_drug_interaction_check():
    """药物相互作用检测（同步）"""
    auth = require_auth()
    if auth: return auth
    
    data = request.json
    member_id = data.get('member_id')
    medicine_names = data.get('medicine_names', [])
    
    if not member_id or not medicine_names:
        return jsonify({'code': 1, 'msg': '参数不完整'}), 400
    
    family_id = get_current_family_id()
    
    # 验证成员属于该家庭
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ? AND family_id = ?", (member_id, family_id)).fetchone()
    conn.close()
    if not user:
        return jsonify({'code': 1, 'msg': '成员不存在'}), 404
    
    result = ai_service.check_drug_interaction(medicine_names)
    
    if not result.get('success'):
        return jsonify({'code': 1, 'msg': '检测服务暂时不可用'}), 500
    
    parsed = result.get('parsed', {})
    
    return jsonify({'code': 0, 'msg': '检测完成', 'data': {
        'risk_level': parsed.get('risk_level', 'safe'),
        'has_interaction': parsed.get('has_interaction', False),
        'description': parsed.get('description', ''),
        'suggestion': parsed.get('suggestion', ''),
        'duration_ms': result.get('duration_ms', 0),
    }})

@app.route('/api/members/<int:uid>/interactions', methods=['GET'])
def member_interactions(uid):
    """查询某成员的药物冲突历史"""
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    conn = get_db()
    
    user = conn.execute("SELECT * FROM users WHERE id = ? AND family_id = ?", (uid, family_id)).fetchone()
    if not user:
        conn.close()
        return jsonify({'code': 1, 'msg': '成员不存在'}), 404
    
    rows = [dict(r) for r in conn.execute(
        "SELECT * FROM drug_interaction_alerts WHERE member_id = ? ORDER BY created_at DESC",
        (uid,)
    ).fetchall()]
    conn.close()
    
    return jsonify({'code': 0, 'data': rows})

@app.route('/api/members/<int:uid>/interactions/unread', methods=['GET'])
def member_interactions_unread(uid):
    """查询某成员的未读冲突告警"""
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    conn = get_db()
    
    user = conn.execute("SELECT * FROM users WHERE id = ? AND family_id = ?", (uid, family_id)).fetchone()
    if not user:
        conn.close()
        return jsonify({'code': 1, 'msg': '成员不存在'}), 404
    
    rows = [dict(r) for r in conn.execute(
        "SELECT * FROM drug_interaction_alerts WHERE member_id = ? AND is_read = 0 ORDER BY created_at DESC",
        (uid,)
    ).fetchall()]
    conn.close()
    
    return jsonify({'code': 0, 'data': rows, 'unread_count': len(rows)})

@app.route('/api/members/<int:uid>/interactions/<int:aid>/read', methods=['POST'])
def mark_interaction_read(uid, aid):
    """标记冲突告警为已读"""
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    conn = get_db()
    
    user = conn.execute("SELECT * FROM users WHERE id = ? AND family_id = ?", (uid, family_id)).fetchone()
    if not user:
        conn.close()
        return jsonify({'code': 1, 'msg': '成员不存在'}), 404
    
    conn.execute("UPDATE drug_interaction_alerts SET is_read = 1 WHERE id = ? AND member_id = ?", (aid, uid))
    conn.commit()
    conn.close()
    
    return jsonify({'code': 0, 'msg': '已标记为已读'})

# ========== 服药提醒与打卡 API (Task 6) ==========

@app.route('/api/reminders', methods=['GET'])
def list_reminders():
    """查询服药提醒列表"""
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    member_id = request.args.get('member_id', type=int)
    
    conn = get_db()
    query = '''SELECT rs.*, m.name as medicine_name, m.manufacturer, u.username as member_name, u.elderly_name
               FROM reminder_schedules rs
               JOIN medicines m ON rs.medicine_id = m.id
               JOIN users u ON rs.member_id = u.id
               WHERE m.family_id = ?'''
    params = [family_id]
    
    if member_id:
        query += " AND rs.member_id = ?"
        params.append(member_id)
    
    query += " ORDER BY rs.enabled DESC, rs.remind_time ASC"
    rows = [dict(r) for r in conn.execute(query, params).fetchall()]
    conn.close()
    
    return jsonify({'code': 0, 'data': rows})

@app.route('/api/reminders', methods=['POST'])
@require_admin
def create_reminder():
    """创建服药提醒"""
    auth = require_auth()
    if auth: return auth
    
    data = request.json
    member_id = data.get('member_id')
    medicine_id = data.get('medicine_id')
    remind_time = data.get('remind_time', '')
    repeat_type = data.get('repeat_type', 'daily')
    weekdays = data.get('weekdays', '')
    dosage = data.get('dosage', '')

    if not member_id or not medicine_id or not remind_time:
        return jsonify({'code': 1, 'msg': '参数不完整'}), 400

    family_id = get_current_family_id()
    conn = get_db()

    # 验证成员和药品属于该家庭
    user = conn.execute("SELECT * FROM users WHERE id = ? AND family_id = ?", (member_id, family_id)).fetchone()
    med = conn.execute("SELECT * FROM medicines WHERE id = ? AND family_id = ?", (medicine_id, family_id)).fetchone()
    if not user or not med:
        conn.close()
        return jsonify({'code': 1, 'msg': '成员或药品不存在'}), 404

    conn.execute(
        '''INSERT INTO reminder_schedules (member_id, medicine_id, remind_time, repeat_type, weekdays, dosage)
           VALUES (?, ?, ?, ?, ?, ?)''',
        (member_id, medicine_id, remind_time, repeat_type, weekdays, dosage)
    )
    conn.commit()
    new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.close()
    
    return jsonify({'code': 0, 'msg': '提醒设置成功', 'id': new_id})

@app.route('/api/reminders/<int:rid>', methods=['PUT'])
@require_admin
def update_reminder(rid):
    """更新服药提醒"""
    auth = require_auth()
    if auth: return auth
    
    data = request.json
    family_id = get_current_family_id()
    conn = get_db()
    
    # 验证提醒属于该家庭
    row = conn.execute('''
        SELECT rs.* FROM reminder_schedules rs
        JOIN medicines m ON rs.medicine_id = m.id
        WHERE rs.id = ? AND m.family_id = ?
    ''', (rid, family_id)).fetchone()
    
    if not row:
        conn.close()
        return jsonify({'code': 1, 'msg': '提醒不存在'}), 404
    
    fields = ['remind_time', 'repeat_type', 'weekdays', 'dosage', 'enabled']
    updates = []
    params = []
    for f in fields:
        if f in data:
            updates.append(f'{f} = ?')
            params.append(data[f])
    
    if updates:
        params.append(rid)
        conn.execute(f'UPDATE reminder_schedules SET {", ".join(updates)} WHERE id = ?', params)
        conn.commit()
    
    conn.close()
    return jsonify({'code': 0, 'msg': '更新成功'})

@app.route('/api/reminders/<int:rid>', methods=['DELETE'])
@require_admin
def delete_reminder(rid):
    """删除服药提醒"""
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    conn = get_db()
    
    row = conn.execute('''
        SELECT rs.* FROM reminder_schedules rs
        JOIN medicines m ON rs.medicine_id = m.id
        WHERE rs.id = ? AND m.family_id = ?
    ''', (rid, family_id)).fetchone()
    
    if not row:
        conn.close()
        return jsonify({'code': 1, 'msg': '提醒不存在'}), 404
    
    conn.execute("DELETE FROM reminder_schedules WHERE id = ?", (rid,))
    conn.commit()
    conn.close()
    
    return jsonify({'code': 0, 'msg': '删除成功'})

@app.route('/api/checkin', methods=['POST'])
def checkin():
    """老人服药打卡（含当日幂等去重，防误点产生重复记录污染统计）"""
    auth = require_auth()
    if auth: return auth

    data = request.get_json(silent=True) or {}
    member_id = data.get('member_id', session.get('user_id'))
    medicine_id = data.get('medicine_id')
    schedule_id = data.get('schedule_id')

    # 请求体防御：medicine_id 必须是正整数
    try:
        medicine_id = int(medicine_id) if medicine_id is not None else None
    except (TypeError, ValueError):
        return jsonify({'code': 1, 'msg': '药品ID格式错误'}), 400
    if not medicine_id or medicine_id <= 0:
        return jsonify({'code': 1, 'msg': '请选择药品'}), 400
    if schedule_id is not None:
        try:
            schedule_id = int(schedule_id) or None
        except (TypeError, ValueError):
            schedule_id = None

    family_id = get_current_family_id()
    conn = get_db()

    # 验证成员和药品属于该家庭
    user = conn.execute("SELECT * FROM users WHERE id = ? AND family_id = ?", (member_id, family_id)).fetchone()
    med = conn.execute("SELECT * FROM medicines WHERE id = ? AND family_id = ?", (medicine_id, family_id)).fetchone()
    if not user or not med:
        conn.close()
        return jsonify({'code': 1, 'msg': '成员或药品不存在'}), 404

    # 越权校验：若提供 schedule_id，必须属于该成员且对应同一药品
    if schedule_id:
        sched = conn.execute(
            "SELECT id FROM reminder_schedules WHERE id = ? AND member_id = ? AND medicine_id = ?",
            (schedule_id, member_id, medicine_id)
        ).fetchone()
        if not sched:
            conn.close()
            return jsonify({'code': 1, 'msg': '提醒计划不存在或不匹配'}), 404

    # 幂等去重：当日同 member + 同 schedule/medicine 已打卡则直接返回成功（防误点重复写入）
    today = date.today().isoformat()
    if schedule_id:
        existing = conn.execute(
            "SELECT id FROM checkin_records WHERE member_id = ? AND schedule_id = ? AND date(checkin_time) = ?",
            (member_id, schedule_id, today)
        ).fetchone()
    else:
        existing = conn.execute(
            "SELECT id FROM checkin_records WHERE member_id = ? AND medicine_id = ? AND (schedule_id IS NULL OR schedule_id = 0) AND date(checkin_time) = ?",
            (member_id, medicine_id, today)
        ).fetchone()
    if existing:
        conn.close()
        return jsonify({'code': 0, 'msg': '今日已打卡，无需重复', 'id': existing['id'], 'idempotent': True})

    conn.execute(
        "INSERT INTO checkin_records (member_id, medicine_id, schedule_id, status) VALUES (?, ?, ?, 'done')",
        (member_id, medicine_id, schedule_id)
    )
    # 库存扣减：打卡成功时按 dosage 解析的用量扣减 stock_quantity
    _decrease_stock(conn, medicine_id, med['name'], schedule_id)
    conn.commit()
    new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.close()

    return jsonify({'code': 0, 'msg': '打卡成功', 'id': new_id})


# ========== 服药提醒触发与视频存档 API ==========

@app.route('/api/reminders/check-trigger', methods=['GET'])
def check_reminder_trigger():
    """老人端轮询：检查是否有到期未触发的服药提醒，返回触发记录"""
    auth = require_auth()
    if auth: return auth

    family_id = get_current_family_id()
    uid = session.get('user_id')
    now = datetime.now()
    today_str = date.today().isoformat()
    current_minutes = now.hour * 60 + now.minute

    conn = get_db()

    # 获取该老人今日所有应触发的提醒
    all_reminders = [dict(r) for r in conn.execute('''
        SELECT rs.*, m.name as medicine_name, m.manufacturer
        FROM reminder_schedules rs
        JOIN medicines m ON rs.medicine_id = m.id
        WHERE rs.member_id = ? AND rs.enabled = 1 AND m.family_id = ?
        ORDER BY rs.remind_time ASC
    ''', (uid, family_id)).fetchall()]

    # 过滤今日应触发的提醒
    today_reminders = [r for r in all_reminders if _should_remind_today(
        r.get('repeat_type', 'daily'),
        r.get('weekdays', ''),
        r.get('created_at', '')
    )]

    # 检查每个提醒是否已到时间且今日未触发
    for r in today_reminders:
        rtime = r.get('remind_time', '')
        if not rtime:
            continue
        try:
            parts = rtime.split(':')
            remind_minutes = int(parts[0]) * 60 + int(parts[1])
        except (ValueError, IndexError):
            continue

        # 当前时间 >= 提醒时间（到点或已过）
        if current_minutes < remind_minutes:
            continue

        # 检查今日是否已触发过（查 reminder_triggers 表）
        existing_trigger = conn.execute(
            "SELECT id FROM reminder_triggers WHERE schedule_id = ? AND date(trigger_time) = ? AND is_delayed = 0",
            (r['id'], today_str)
        ).fetchone()

        if existing_trigger:
            # 检查是否有延迟触发未处理（迭代5 P0修复：必须校验 trigger_time <= now，否则30秒后立即二次提醒）
            delayed = conn.execute(
                "SELECT id, status FROM reminder_triggers WHERE schedule_id = ? AND date(trigger_time) = ? AND is_delayed = 1 AND status = 'pending' AND trigger_time <= datetime('now','localtime')",
                (r['id'], today_str)
            ).fetchone()
            if delayed:
                # 返回延迟触发的提醒
                trigger = dict(conn.execute(
                    "SELECT * FROM reminder_triggers WHERE id = ?", (delayed['id'],)
                ).fetchone())
                conn.close()
                return jsonify({'code': 0, 'data': {'trigger': trigger, 'is_delayed': True}})
            continue

        # 检查是否已打卡
        checked = conn.execute(
            "SELECT id FROM checkin_records WHERE member_id = ? AND (schedule_id = ? OR medicine_id = ?) AND date(checkin_time) = ?",
            (uid, r['id'], r['medicine_id'], today_str)
        ).fetchone()
        if checked:
            continue

        # 创建触发记录
        conn.execute(
            """INSERT INTO reminder_triggers (schedule_id, member_id, medicine_id, medicine_name, dosage, status)
               VALUES (?, ?, ?, ?, ?, 'pending')""",
            (r['id'], uid, r['medicine_id'], r['medicine_name'], r.get('dosage', ''))
        )
        conn.commit()
        trigger_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        trigger = dict(conn.execute(
            "SELECT * FROM reminder_triggers WHERE id = ?", (trigger_id,)
        ).fetchone())
        conn.close()

        return jsonify({'code': 0, 'data': {'trigger': trigger, 'is_delayed': False}})

    conn.close()
    return jsonify({'code': 0, 'data': None})


@app.route('/api/reminders/trigger/<int:trigger_id>/confirm', methods=['POST'])
def confirm_reminder_trigger(trigger_id):
    """老人确认服药提醒，开始后台视频录制"""
    auth = require_auth()
    if auth: return auth

    family_id = get_current_family_id()
    uid = session.get('user_id')
    conn = get_db()

    trigger = conn.execute(
        "SELECT * FROM reminder_triggers WHERE id = ? AND member_id = ?",
        (trigger_id, uid)
    ).fetchone()

    if not trigger:
        conn.close()
        return jsonify({'code': 1, 'msg': '触发记录不存在'}), 404

    if trigger['status'] != 'pending':
        conn.close()
        return jsonify({'code': 0, 'msg': '已确认过', 'status': trigger['status']})

    conn.execute(
        "UPDATE reminder_triggers SET status = 'confirmed', confirmed_at = datetime('now','localtime') WHERE id = ?",
        (trigger_id,)
    )
    conn.commit()
    conn.close()

    return jsonify({'code': 0, 'msg': '已确认，开始录制'})


@app.route('/api/reminders/trigger/<int:trigger_id>/video', methods=['POST'])
def upload_trigger_video(trigger_id):
    """上传服药视频并启动LLM场景分析"""
    auth = require_auth()
    if auth: return auth

    family_id = get_current_family_id()
    uid = session.get('user_id')
    conn = get_db()

    trigger = conn.execute(
        "SELECT * FROM reminder_triggers WHERE id = ? AND member_id = ?",
        (trigger_id, uid)
    ).fetchone()
    if not trigger:
        conn.close()
        return jsonify({'code': 1, 'msg': '触发记录不存在'}), 404

    video = request.files.get('video')
    transcript = request.form.get('transcript', '')

    if not video:
        conn.close()
        return jsonify({'code': 1, 'msg': '未收到视频文件'}), 400

    # 保存视频文件
    filename = f"medication_{uid}_{uuid.uuid4().hex[:8]}.webm"
    video_path = os.path.join(UPLOAD_DIR, filename)
    video.save(video_path)
    video_url = f"/uploads/{filename}"
    register_upload(filename, family_id, uid)

    # 更新触发记录
    conn.execute(
        "UPDATE reminder_triggers SET video_url = ?, transcript = ?, status = 'analyzing' WHERE id = ?",
        (video_url, transcript, trigger_id)
    )
    conn.commit()

    # 存入视频存档表
    conn.execute(
        """INSERT INTO medication_videos (family_id, elderly_id, trigger_id, medicine_name, video_url, transcript, duration_seconds)
           VALUES (?, ?, ?, ?, ?, ?, 60)""",
        (family_id, uid, trigger_id, trigger['medicine_name'], video_url, transcript)
    )
    video_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.commit()
    conn.close()

    # 异步调用LLM分析场景
    threading.Thread(
        target=_analyze_medication_scene,
        args=(trigger_id, transcript, family_id, uid, trigger),
        daemon=True
    ).start()

    return jsonify({'code': 0, 'msg': '视频已上传，正在分析', 'video_id': video_id})


def _emit_scene_alert(conn, family_id, elderly_id, trigger_id, scene_type, scene_analysis, medicine_name, video_url):
    """迭代4 P0：异常场景实时告警通道——将需要家人关注的场景写入 scene_alerts 表
    覆盖：身体不适拒绝服药 / 无法识别 / 二次延迟未响应 / 已提前服药（需核实）
    迭代5 P1：同一 trigger_id + scene_type 已存在则更新（不重复插入），避免告警虚高
    """
    ALERT_RULES = {
        'refused_unwell': ('critical', f'老人身体不适拒绝服药：{scene_analysis or "请及时关怀核实"}'),
        'unknown':        ('warning',  f'老人服药情况无法识别，请核实：{medicine_name}'),
        'missed':         ('critical', f'老人未按时服药（已延迟两次仍未响应）：{medicine_name}'),
        'already_taken':  ('info',     f'老人称已提前服药，请核实是否重复用药：{medicine_name}'),
    }
    rule = ALERT_RULES.get(scene_type)
    if not rule:
        return
    severity, message = rule
    try:
        # 去重：同一 trigger + scene_type 已有告警则刷新时间，不重复插入
        if trigger_id:
            existing = conn.execute(
                "SELECT id FROM scene_alerts WHERE trigger_id = ? AND scene_type = ?",
                (trigger_id, scene_type)
            ).fetchone()
            if existing:
                conn.execute(
                    "UPDATE scene_alerts SET message = ?, severity = ?, video_url = ?, created_at = datetime('now','localtime'), is_read = 0 WHERE id = ?",
                    (message, severity, video_url or '', existing['id'])
                )
                conn.commit()
                return
        conn.execute(
            """INSERT INTO scene_alerts
               (family_id, elderly_id, trigger_id, medicine_name, scene_type, severity, message, video_url)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)""",
            (family_id, elderly_id, trigger_id, medicine_name, scene_type, severity, message, video_url or '')
        )
        conn.commit()
    except Exception as e:
        app.logger.warning(f"_emit_scene_alert 写入失败: {e}")


def _analyze_medication_scene(trigger_id, transcript, family_id, elderly_id, trigger_data):
    """异步调用LLM分析老人语音场景"""
    conn = get_db()
    try:
        # P0 幂等性：若该触发已被处理，直接返回，避免重复打卡
        cur = conn.execute("SELECT status FROM reminder_triggers WHERE id = ?", (trigger_id,)).fetchone()
        if cur and cur['status'] in ('completed', 'delayed', 'missed', 'manual'):
            return

        medicine_name = trigger_data['medicine_name'] if isinstance(trigger_data, dict) else trigger_data['medicine_name']
        dosage = trigger_data['dosage'] if isinstance(trigger_data, dict) else trigger_data['dosage']

        result = ai_service.analyze_medication_scene(transcript, medicine_name, dosage)

        if not result.get('success'):
            # AI分析失败，标记为需要人工处理
            conn.execute(
                "UPDATE reminder_triggers SET status = 'manual', scene_type = 'unknown' WHERE id = ?",
                (trigger_id,)
            )
            conn.commit()
            # 迭代4 P0：AI 失败也需告警家人介入
            video_row = conn.execute(
                "SELECT video_url FROM medication_videos WHERE trigger_id = ?", (trigger_id,)
            ).fetchone()
            _emit_scene_alert(conn, family_id, elderly_id, trigger_id, 'unknown',
                               'AI 分析失败，请人工核实', medicine_name,
                               video_row['video_url'] if video_row else '')
            return

        parsed = result.get('parsed', {})
        scene_type = parsed.get('scene', 'unknown')
        health_question = parsed.get('health_question', '')
        scene_analysis = parsed.get('analysis', '')

        if scene_type == 'taken':
            # 场景2：已服药 → 自动打卡（幂等：同一天同一schedule不重复打卡）
            existing = conn.execute(
                "SELECT id FROM checkin_records WHERE member_id = ? AND schedule_id = ? AND date(checkin_time) = date('now', 'localtime')",
                (elderly_id, trigger_data['schedule_id'])
            ).fetchone()
            if not existing:
                conn.execute(
                    """INSERT INTO checkin_records (member_id, medicine_id, schedule_id, status)
                       VALUES (?, ?, ?, 'done')""",
                    (elderly_id, trigger_data['medicine_id'], trigger_data['schedule_id'])
                )
                # 库存扣减
                _decrease_stock(conn, trigger_data['medicine_id'], medicine_name, trigger_data['schedule_id'])

            conn.execute(
                "UPDATE reminder_triggers SET status = 'completed', scene_type = ?, scene_analysis = ?, health_question = ? WHERE id = ?",
                (scene_type, scene_analysis, health_question, trigger_id)
            )
            conn.commit()

        elif scene_type == 'already_taken':
            # 新场景：已提前服药 → 不打卡（避免重复），不触发二次提醒，标记完成供家人核实
            conn.execute(
                "UPDATE reminder_triggers SET status = 'completed', scene_type = ?, scene_analysis = ?, health_question = ? WHERE id = ?",
                (scene_type, scene_analysis, health_question, trigger_id)
            )
            conn.commit()

        elif scene_type == 'refused_unwell':
            # 新场景：身体不适拒绝服药 → 标记需关怀，不打卡，不延迟
            conn.execute(
                "UPDATE reminder_triggers SET status = 'manual', scene_type = ?, scene_analysis = ?, health_question = ? WHERE id = ?",
                (scene_type, scene_analysis, '老人身体不适，请家人及时关怀核实', trigger_id)
            )
            conn.commit()

        elif scene_type == 'delay':
            # 场景1：延迟服药 → 检查是否已延迟过一次
            ext_count = conn.execute(
                "SELECT extended_count FROM reminder_triggers WHERE id = ?", (trigger_id,)
            ).fetchone()

            if ext_count and ext_count['extended_count'] >= 1:
                # 已延迟过一次，不再延迟，标记为未服药
                # 将 scene_type 改为 missed 以触发 admin 告警（用户要求：不再延迟并使 admin 获得告警信息）
                conn.execute(
                    "UPDATE reminder_triggers SET status = 'missed', scene_type = 'missed', scene_analysis = ? WHERE id = ?",
                    (scene_analysis, trigger_id)
                )
                conn.commit()
                # 迭代5 P0 修复：二次延迟未响应时主动推送 missed 告警给 admin
                video_row = conn.execute(
                    "SELECT video_url FROM medication_videos WHERE trigger_id = ?", (trigger_id,)
                ).fetchone()
                _emit_scene_alert(conn, family_id, elderly_id, trigger_id, 'missed',
                                   scene_analysis, medicine_name,
                                   video_row['video_url'] if video_row else '')
            else:
                # 创建30分钟后的延迟触发记录（迭代5 P0修复：必须写入 trigger_time，否则会立即被 check-trigger 拾取）
                delayed_time = datetime.now() + timedelta(minutes=30)
                conn.execute(
                    """INSERT INTO reminder_triggers (schedule_id, member_id, medicine_id, medicine_name, dosage, status, is_delayed, extended_count, trigger_time)
                       VALUES (?, ?, ?, ?, ?, 'pending', 1, 1, ?)""",
                    (trigger_data['schedule_id'], elderly_id, trigger_data['medicine_id'],
                     medicine_name, dosage, delayed_time.strftime('%Y-%m-%d %H:%M:%S'))
                )
                conn.execute(
                    "UPDATE reminder_triggers SET status = 'delayed', scene_type = ?, scene_analysis = ? WHERE id = ?",
                    (scene_type, scene_analysis, trigger_id)
                )
                conn.commit()

        else:
            # 无法判定场景
            conn.execute(
                "UPDATE reminder_triggers SET status = 'manual', scene_type = 'unknown', scene_analysis = ? WHERE id = ?",
                (scene_analysis, trigger_id)
            )
            conn.commit()

        # 更新视频存档表中的场景类型
        conn.execute(
            "UPDATE medication_videos SET scene_type = ? WHERE trigger_id = ?",
            (scene_type, trigger_id)
        )
        conn.commit()

        # 迭代4 P0：异常场景统一告警通道（taken 正常服药不打扰家人）
        if scene_type != 'taken':
            video_row = conn.execute(
                "SELECT video_url FROM medication_videos WHERE trigger_id = ?", (trigger_id,)
            ).fetchone()
            _emit_scene_alert(conn, family_id, elderly_id, trigger_id, scene_type,
                               scene_analysis, medicine_name,
                               video_row['video_url'] if video_row else '')

    except Exception as e:
        conn.execute(
            "UPDATE reminder_triggers SET status = 'manual', scene_analysis = ? WHERE id = ?",
            (f"分析异常: {str(e)}", trigger_id)
        )
        conn.commit()
        # 异常也告警
        try:
            _emit_scene_alert(conn, family_id, elderly_id, trigger_id, 'unknown',
                               f'分析异常：{str(e)}', '', '')
        except Exception:
            pass
    finally:
        conn.close()


@app.route('/api/reminders/trigger/<int:trigger_id>/status', methods=['GET'])
def get_trigger_status(trigger_id):
    """查询触发记录的处理状态（老人端轮询用）"""
    auth = require_auth()
    if auth: return auth

    uid = session.get('user_id')
    conn = get_db()
    trigger = conn.execute(
        "SELECT * FROM reminder_triggers WHERE id = ? AND member_id = ?",
        (trigger_id, uid)
    ).fetchone()
    conn.close()

    if not trigger:
        return jsonify({'code': 1, 'msg': '记录不存在'}), 404

    return jsonify({'code': 0, 'data': dict(trigger)})


@app.route('/api/checkin/last-taken-video', methods=['GET'])
def last_taken_video():
    """迭代5 创新·遗忘时光倒流镜：返回老人最近一次已服药视频，解决"我刚才吃了吗"的最高频痛点"""
    auth = require_auth()
    if auth: return auth
    uid = session.get('user_id')
    conn = get_db()
    # 优先取 scene_type='taken' 的视频，没有则取任意已存在视频
    row = conn.execute(
        """SELECT mv.*, rt.scene_type, rt.scene_analysis
           FROM medication_videos mv
           LEFT JOIN reminder_triggers rt ON mv.trigger_id = rt.id
           WHERE mv.elderly_id = ? AND (rt.scene_type = 'taken' OR rt.scene_type IS NULL)
           ORDER BY mv.created_at DESC LIMIT 1""",
        (uid,)
    ).fetchone()
    if not row:
        # 退化：查询今日任意打卡记录
        ck = conn.execute(
            "SELECT medicine_id, checkin_time FROM checkin_records WHERE member_id = ? AND date(checkin_time) = date('now','localtime') ORDER BY checkin_time DESC LIMIT 1",
            (uid,)
        ).fetchone()
        if ck:
            med = conn.execute("SELECT name FROM medicines WHERE id = ?", (ck['medicine_id'],)).fetchone()
        conn.close()
        if ck:
            return jsonify({'code': 0, 'data': {
                'video_url': '', 'medicine_name': med['name'] if med else '',
                'checkin_time': ck['checkin_time'], 'has_video': False
            }})
        return jsonify({'code': 0, 'data': None})
    conn.close()
    return jsonify({'code': 0, 'data': {
        'video_url': row['video_url'], 'medicine_name': row['medicine_name'],
        'created_at': row['created_at'], 'has_video': True,
        'scene_type': row['scene_type'] or '', 'scene_analysis': row['scene_analysis'] or ''
    }})


@app.route('/api/medication-videos', methods=['GET'])
def list_medication_videos():
    """家庭成员查看服药视频存档"""
    auth = require_auth()
    if auth: return auth

    family_id = get_current_family_id()
    conn = get_db()
    limit = request.args.get('limit', 50, type=int)
    rows = [dict(r) for r in conn.execute(
        """SELECT mv.*, u.elderly_name, u.username as elderly_username,
                  rt.scene_analysis, rt.health_question
           FROM medication_videos mv
           LEFT JOIN users u ON mv.elderly_id = u.id
           LEFT JOIN reminder_triggers rt ON mv.trigger_id = rt.id
           WHERE mv.family_id = ?
           ORDER BY mv.created_at DESC LIMIT ?""",
        (family_id, limit)
    ).fetchall()]
    conn.close()

    return jsonify({'code': 0, 'data': rows, 'total': len(rows)})


@app.route('/api/medication-videos/<int:vid>', methods=['GET'])
def get_medication_video(vid):
    """获取单个服药视频详情"""
    auth = require_auth()
    if auth: return auth

    family_id = get_current_family_id()
    conn = get_db()
    row = conn.execute(
        "SELECT * FROM medication_videos WHERE id = ? AND family_id = ?",
        (vid, family_id)
    ).fetchone()
    conn.close()

    if not row:
        return jsonify({'code': 1, 'msg': '视频不存在'}), 404

    return jsonify({'code': 0, 'data': dict(row)})


# 金丝雀安全网：不良时段分类规则（迭代4创新：防误用安全门）
CANARY_BAD_TIMEWINDOW = {
    '安神助眠': {'bad_range': (6, 20), 'msg': '助眠药通常在睡前服用，现在服用可能影响白天精神'},
    '安眠': {'bad_range': (6, 20), 'msg': '助眠药通常在睡前服用，现在服用可能影响白天精神'},
    '镇静': {'bad_range': (6, 20), 'msg': '镇静类药物通常在睡前服用，现在服用可能引起嗜睡'},
}


def _canary_audit(member_id, medicine_id, schedule_id, conn):
    """
    金丝雀防误用审计（迭代4创新）：打卡前做4项实时审计
    返回 {'pass': bool, 'risks': [{'code','level':'warn'|'block','message'}]}
    - 重复服药（当日已打卡）→ block
    - 服药间隔过短（<6h 且该药日1次）→ warn
    - 时段不宜（安眠类早晨服）→ warn
    - 新增药物冲突告警未读 → block
    """
    risks = []
    today = date.today().isoformat()
    now = datetime.now()

    # 审计1：重复服药检测
    if schedule_id:
        dup = conn.execute(
            "SELECT COUNT(*), MAX(checkin_time) FROM checkin_records WHERE member_id=? AND schedule_id=? AND date(checkin_time)=?",
            (member_id, schedule_id, today)
        ).fetchone()
    else:
        dup = conn.execute(
            "SELECT COUNT(*), MAX(checkin_time) FROM checkin_records WHERE member_id=? AND medicine_id=? AND (schedule_id IS NULL OR schedule_id=0) AND date(checkin_time)=?",
            (member_id, medicine_id, today)
        ).fetchone()
    if dup and dup[0] > 0:
        last_time = dup[1] or ''
        time_str = last_time[11:16] if len(last_time) >= 16 else ''
        risks.append({
            'code': 'DUPLICATE_DOSE',
            'level': 'block',
            'message': f'今天已于 {time_str} 服用过此药，确认要再次服用吗？'
        })

    # 审计2：服药间隔检测
    last = conn.execute(
        "SELECT checkin_time FROM checkin_records WHERE member_id=? AND medicine_id=? AND date(checkin_time)>=? ORDER BY checkin_time DESC LIMIT 1",
        (member_id, medicine_id, today)
    ).fetchone()
    if last and last['checkin_time']:
        try:
            last_dt = datetime.strptime(last['checkin_time'][:19], '%Y-%m-%d %H:%M:%S')
            interval_h = (now - last_dt).total_seconds() / 3600
            # 推断该药日频次
            scheds = conn.execute("SELECT id FROM reminder_schedules WHERE medicine_id=? AND enabled=1", (medicine_id,)).fetchall()
            if len(scheds) <= 1 and interval_h < 6:
                risks.append({
                    'code': 'SHORT_INTERVAL',
                    'level': 'warn',
                    'message': f'距上次服用仅 {int(interval_h)} 小时，该药通常每日一次，确认要现在服用吗？'
                })
        except Exception:
            pass

    # 审计3：时段适宜性
    med = conn.execute("SELECT name, category FROM medicines WHERE id=?", (medicine_id,)).fetchone()
    if med:
        hour = now.hour
        category = med['category'] or ''
        for key, rule in CANARY_BAD_TIMEWINDOW.items():
            if key in category or key in (med['name'] or ''):
                bad = rule['bad_range']
                if bad and bad[0] <= hour < bad[1]:
                    risks.append({
                        'code': 'BAD_TIMEWINDOW',
                        'level': 'warn',
                        'message': rule['msg']
                    })
                break

    # 审计4：未读药物冲突告警
    new_alert = conn.execute(
        "SELECT 1 FROM drug_interaction_alerts WHERE member_id=? AND is_read=0 LIMIT 1",
        (member_id,)
    ).fetchone()
    if new_alert:
        risks.append({
            'code': 'NEW_INTERACTION',
            'level': 'block',
            'message': '有未读的药物冲突告警，请先查看冲突详情再服药'
        })

    has_block = any(r['level'] == 'block' for r in risks)
    return {'pass': not has_block, 'risks': risks}


@app.route('/api/checkin/preview', methods=['POST'])
def checkin_preview():
    """金丝雀安全门：打卡前预检，返回风险卡片数据，不写入数据库"""
    auth = require_auth()
    if auth: return auth

    data = request.get_json(silent=True) or {}
    member_id = data.get('member_id', session.get('user_id'))
    medicine_id = data.get('medicine_id')
    schedule_id = data.get('schedule_id')

    try:
        medicine_id = int(medicine_id) if medicine_id is not None else None
    except (TypeError, ValueError):
        return jsonify({'code': 1, 'msg': '药品ID格式错误'}), 400
    if not medicine_id or medicine_id <= 0:
        return jsonify({'code': 1, 'msg': '请选择药品'}), 400

    family_id = get_current_family_id()
    conn = get_db()
    user = conn.execute("SELECT id FROM users WHERE id=? AND family_id=?", (member_id, family_id)).fetchone()
    med = conn.execute("SELECT id, name FROM medicines WHERE id=? AND family_id=?", (medicine_id, family_id)).fetchone()
    if not user or not med:
        conn.close()
        return jsonify({'code': 1, 'msg': '成员或药品不存在'}), 404

    result = _canary_audit(member_id, medicine_id, schedule_id, conn)
    conn.close()
    return jsonify({'code': 0, 'data': {'pass': result['pass'], 'risks': result['risks'], 'medicine_name': med['name']}})


def _parse_dosage_units(dosage_text):
    """从 dosage 自由文本解析单次用量单位数，如 '1片'→1.0, '半片'→0.5, '2粒'→2.0, '饭后1片'→1.0"""
    if not dosage_text:
        return 1.0  # 默认每次1单位
    import re
    # 优先匹配"半"
    if '半' in dosage_text:
        return 0.5
    # 匹配数字（含小数）
    m = re.search(r'(\d+(?:\.\d+)?)', dosage_text)
    if m:
        return float(m.group(1))
    return 1.0


def _decrease_stock(conn, medicine_id, medicine_name, schedule_id):
    """打卡成功后扣减库存，并触发库存预警通知"""
    med = conn.execute("SELECT stock_quantity, pack_total_units, restock_threshold_days, name FROM medicines WHERE id = ?", (medicine_id,)).fetchone()
    if not med:
        return
    # 解析用量
    dosage = '1'
    if schedule_id:
        sched = conn.execute("SELECT dosage FROM reminder_schedules WHERE id = ?", (schedule_id,)).fetchone()
        if sched and sched['dosage']:
            dosage = sched['dosage']
    units = _parse_dosage_units(dosage)
    new_qty = float(med['stock_quantity'] or 0) - units
    if new_qty < 0:
        new_qty = 0
    conn.execute("UPDATE medicines SET stock_quantity = ?, updated_at = datetime('now','localtime') WHERE id = ?", (new_qty, medicine_id))
    # 触发库存预警：当剩余可服天数 <= 阈值时插入 alerts
    threshold = int(med['restock_threshold_days'] or 7)
    heartbeat = _compute_inventory_heartbeat(medicine_id, conn)
    if heartbeat and heartbeat['status'] in ('pulse', 'depleted') and heartbeat.get('days_left', 999) <= threshold:
        # 避免同一天重复插入相同预警
        today = date.today().isoformat()
        existing_alert = conn.execute(
            "SELECT id FROM alerts WHERE medicine_id = ? AND alert_type = 'restock' AND date(created_at) = ?",
            (medicine_id, today)
        ).fetchone()
        if not existing_alert:
            conn.execute(
                "INSERT INTO alerts (medicine_id, alert_type, message) VALUES (?, 'restock', ?)",
                (medicine_id, f"【补货提醒】{med['name']} 预计 {heartbeat.get('depletion_date', '近期')} 用完，剩余约 {int(new_qty)} 单位，请及时补货")
            )


def _compute_inventory_heartbeat(medicine_id, conn):
    """
    单药品库存心跳计算（迭代4创新：库存"心跳"预测引擎）
    基于近14天打卡记录加权移动平均推算日均消耗速率，预测剩余可服天数与断药日期
    返回: {'remaining_units', 'daily_rate', 'days_left', 'depletion_date', 'status', 'confidence'}
    status: ample(>30d) / watch(7-30d) / pulse(<7d) / depleted(<=0) / unknown(无数据)
    """
    import re
    med = conn.execute("SELECT stock_quantity, pack_total_units, restock_threshold_days, name FROM medicines WHERE id = ?", (medicine_id,)).fetchone()
    if not med:
        return None
    remaining = float(med['stock_quantity'] or 0)
    if remaining <= 0:
        return {'remaining_units': 0, 'daily_rate': 0, 'days_left': 0, 'days_left_float': 0.0,
                'depletion_date': date.today().isoformat(), 'status': 'depleted', 'confidence': 'high'}

    # 取近14天打卡记录，加权移动平均
    rows = conn.execute(
        """SELECT date(checkin_time) as d, COUNT(*) as cnt, schedule_id FROM checkin_records
           WHERE medicine_id = ? AND date(checkin_time) >= date('now','-14 days')
           GROUP BY date(checkin_time)""",
        (medicine_id,)
    ).fetchall()

    if not rows:
        # 无打卡数据：基于 reminder_schedules 推算理论日消耗
        scheds = conn.execute("SELECT dosage FROM reminder_schedules WHERE medicine_id = ? AND enabled = 1", (medicine_id,)).fetchall()
        if not scheds:
            return {'remaining_units': remaining, 'daily_rate': 0, 'days_left': None, 'days_left_float': None,
                    'depletion_date': None, 'status': 'unknown', 'confidence': 'low'}
        daily_units = sum(_parse_dosage_units(s['dosage']) for s in scheds)
        if daily_units <= 0:
            return {'remaining_units': remaining, 'daily_rate': 0, 'days_left': None, 'days_left_float': None,
                    'depletion_date': None, 'status': 'unknown', 'confidence': 'low'}
        days_left = int(remaining / daily_units)
        days_left_float = round(remaining / daily_units, 1)
    else:
        # 加权移动平均：近期权重高
        total_weighted = 0.0
        total_weight = 0.0
        today = date.today()
        sample_days = 0
        for row in rows:
            try:
                d = date.fromisoformat(row['d'])
                days_ago = (today - d).days
                if days_ago < 0:
                    continue
                weight = max(1, 14 - days_ago)  # 近期权重高
                # 单次打卡消耗量按 dosage 解析（无 schedule 则默认1）
                sched = conn.execute("SELECT dosage FROM reminder_schedules WHERE id = ?", (row['schedule_id'],)).fetchone() if row['schedule_id'] else None
                per_dose = _parse_dosage_units(sched['dosage']) if sched else 1.0
                consumed = row['cnt'] * per_dose
                total_weighted += weight * consumed
                total_weight += weight
                sample_days += 1
            except Exception:
                continue
        if total_weight <= 0:
            return {'remaining_units': remaining, 'daily_rate': 0, 'days_left': None, 'days_left_float': None,
                    'depletion_date': None, 'status': 'unknown', 'confidence': 'low'}
        daily_rate = total_weighted / total_weight
        if daily_rate <= 0:
            return {'remaining_units': remaining, 'daily_rate': 0, 'days_left': None, 'days_left_float': None,
                    'depletion_date': None, 'status': 'unknown', 'confidence': 'low'}
        days_left = int(remaining / daily_rate)
        days_left_float = round(remaining / daily_rate, 1)

    depletion_date = (date.today() + timedelta(days=days_left)).isoformat()
    threshold = int(med['restock_threshold_days'] or 7)
    if days_left <= 0:
        status = 'depleted'
    elif days_left < threshold:
        status = 'pulse'
    elif days_left <= 30:
        status = 'watch'
    else:
        status = 'ample'
    confidence = 'high' if sample_days >= 7 else 'medium' if sample_days >= 3 else 'low' if rows else 'low'

    return {
        'remaining_units': round(remaining, 1),
        'daily_rate': round(daily_rate, 2) if rows else round(remaining / max(1, days_left), 2),
        'days_left': days_left,
        'days_left_float': days_left_float,
        'depletion_date': depletion_date,
        'status': status,
        'confidence': confidence
    }

def _should_remind_today(repeat_type, weekdays_str, created_at_str, today=None):
    """
    根据 repeat_type 判断今日是否需要触发提醒
    - daily: 每天都触发
    - weekly: 每周固定星期触发，weekdays 用逗号分隔的 0-6（0=周一，6=周日）
    - alternate: 隔天触发（基于 created_at 日期奇偶）
    - custom: 与 weekly 同逻辑（fallback 到 daily 若 weekdays 为空）
    """
    if today is None:
        today = date.today()
    rt = (repeat_type or 'daily').strip().lower()

    if rt == 'daily':
        return True
    if rt in ('weekly', 'custom'):
        if not weekdays_str:
            return True  # 未指定则按每天处理
        # Python weekday(): 0=周一...6=周日
        today_wd = str(today.weekday())
        return today_wd in [w.strip() for w in weekdays_str.split(',') if w.strip()]
    if rt == 'alternate':
        if not created_at_str:
            return True
        try:
            created = date.fromisoformat(created_at_str[:10])
            return (today - created).days % 2 == 0
        except Exception:
            return True
    return True

def _is_reminder_active_on_date(reminder, target_date):
    """
    判断某条提醒在指定历史日期是否有效（历史快照口径）
    1. created_at <= target_date（提醒在该日期前已创建）
    2. repeat_type 在该日期触发
    """
    created_at_str = reminder.get('created_at', '') if isinstance(reminder, dict) else reminder['created_at']
    if created_at_str:
        try:
            created = date.fromisoformat(created_at_str[:10])
            if created > target_date:
                return False  # 提醒在该日期之后才创建，不计入历史
        except Exception:
            pass
    repeat_type = reminder.get('repeat_type', 'daily') if isinstance(reminder, dict) else reminder['repeat_type']
    weekdays = reminder.get('weekdays', '') if isinstance(reminder, dict) else reminder.get('weekdays', '')
    return _should_remind_today(repeat_type, weekdays, created_at_str, today=target_date)

def _compute_elderly_status(reminders, checked_schedule_ids, checked_medicine_ids):
    """
    根据今日提醒列表与已打卡集合，计算老人状态（含超时分级）
    返回: {'status': 'normal'|'warning'|'overdue'|'danger', 'overdue_count': int, 'delayed_count': int}
    状态分级规则（参照 spec）：
    - 所有未打卡提醒距 remind_time ≤ 30min 或尚未到达 → normal
    - 存在 30min~2h 内未打卡提醒 → warning（延迟）
    - 存在 >2h 未打卡提醒 → overdue（超时）
    """
    now = datetime.now()
    overdue_count = 0
    delayed_count = 0
    unchecked = 0
    for r in reminders:
        sid = r.get('id') if isinstance(r, dict) else r['id']
        mid = r.get('medicine_id') if isinstance(r, dict) else r['medicine_id']
        if sid in checked_schedule_ids or mid in checked_medicine_ids:
            continue
        unchecked += 1
        rtime = r.get('remind_time') if isinstance(r, dict) else r['remind_time']
        if not rtime:
            continue
        try:
            parts = rtime.split(':')
            remind_dt = now.replace(hour=int(parts[0]), minute=int(parts[1]), second=0, microsecond=0)
            diff_minutes = (now - remind_dt).total_seconds() / 60.0
            if diff_minutes > 120:
                overdue_count += 1
            elif diff_minutes > 30:
                delayed_count += 1
        except Exception:
            continue

    if overdue_count > 0:
        return {'status': 'overdue', 'overdue_count': overdue_count, 'delayed_count': delayed_count, 'unchecked': unchecked}
    if delayed_count > 0:
        return {'status': 'warning', 'overdue_count': 0, 'delayed_count': delayed_count, 'unchecked': unchecked}
    if unchecked > 0:
        return {'status': 'normal', 'overdue_count': 0, 'delayed_count': 0, 'unchecked': unchecked}
    return {'status': 'normal', 'overdue_count': 0, 'delayed_count': 0, 'unchecked': 0}

@app.route('/api/checkin/today/<int:uid>', methods=['GET'])
def checkin_today(uid):
    """查询某成员今日打卡状态"""
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    today_str = date.today().isoformat()
    
    conn = get_db()
    
    user = conn.execute("SELECT * FROM users WHERE id = ? AND family_id = ?", (uid, family_id)).fetchone()
    if not user:
        conn.close()
        return jsonify({'code': 1, 'msg': '成员不存在'}), 404
    
    # 获取该成员的今日提醒
    all_reminders = [dict(r) for r in conn.execute('''
        SELECT rs.*, m.name as medicine_name, m.manufacturer
        FROM reminder_schedules rs
        JOIN medicines m ON rs.medicine_id = m.id
        WHERE rs.member_id = ? AND rs.enabled = 1
        ORDER BY rs.remind_time ASC
    ''', (uid,)).fetchall()]

    # 按 repeat_type 过滤今日应触发的提醒
    reminders = [r for r in all_reminders if _should_remind_today(
        r.get('repeat_type', 'daily'),
        r.get('weekdays', ''),
        r.get('created_at', '')
    )]

    # 获取今日打卡记录
    checkins = [dict(r) for r in conn.execute('''
        SELECT cr.*, m.name as medicine_name
        FROM checkin_records cr
        JOIN medicines m ON cr.medicine_id = m.id
        WHERE cr.member_id = ? AND date(cr.checkin_time) = ?
    ''', (uid, today_str)).fetchall()]

    # 构建打卡状态
    checked_in_medicine_ids = {c['medicine_id'] for c in checkins}
    checked_in_schedule_ids = {c['schedule_id'] for c in checkins if c['schedule_id']}

    reminder_status = []
    for r in reminders:
        reminder_status.append({
            'schedule_id': r['id'],
            'medicine_id': r['medicine_id'],
            'medicine_name': r['medicine_name'],
            'remind_time': r['remind_time'],
            'dosage': r['dosage'],
            'repeat_type': r.get('repeat_type', 'daily'),
            'checked': r['id'] in checked_in_schedule_ids or r['medicine_id'] in checked_in_medicine_ids,
        })
    
    conn.close()
    return jsonify({'code': 0, 'data': {
        'reminders': reminder_status,
        'total': len(reminder_status),
        'checked': sum(1 for r in reminder_status if r['checked']),
        'date': today_str,
    }})

@app.route('/api/checkin/status/<int:uid>', methods=['GET'])
def checkin_status(uid):
    """查询老人打卡完成情况（年轻人视角）"""
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    conn = get_db()
    
    user = conn.execute("SELECT * FROM users WHERE id = ? AND family_id = ?", (uid, family_id)).fetchone()
    if not user:
        conn.close()
        return jsonify({'code': 1, 'msg': '成员不存在'}), 404
    
    today_str = date.today().isoformat()

    # 修复：今日总提醒数需过滤 repeat_type（仅统计今日应触发的）
    all_reminders = [dict(r) for r in conn.execute(
        "SELECT id, repeat_type, weekdays, created_at FROM reminder_schedules WHERE member_id = ? AND enabled = 1",
        (uid,)
    ).fetchall()]
    today_reminders = [r for r in all_reminders if _is_reminder_active_on_date(r, date.today())]
    total_reminders = len(today_reminders)
    
    # 今日已打卡数
    checked_count = conn.execute('''
        SELECT COUNT(DISTINCT COALESCE(cr.schedule_id, cr.medicine_id))
        FROM checkin_records cr
        WHERE cr.member_id = ? AND date(cr.checkin_time) = ?
    ''', (uid, today_str)).fetchone()[0]
    
    # 最近打卡记录
    recent_checkins = [dict(r) for r in conn.execute('''
        SELECT cr.*, m.name as medicine_name, rs.remind_time
        FROM checkin_records cr
        JOIN medicines m ON cr.medicine_id = m.id
        LEFT JOIN reminder_schedules rs ON cr.schedule_id = rs.id
        WHERE cr.member_id = ?
        ORDER BY cr.checkin_time DESC LIMIT 20
    ''', (uid,)).fetchall()]
    
    conn.close()
    
    return jsonify({'code': 0, 'data': {
        'member_id': uid,
        'total_reminders': total_reminders,
        'checked_today': checked_count,
        'completion_rate': round(checked_count / total_reminders * 100, 1) if total_reminders > 0 else 0,
        'recent_checkins': recent_checkins,
    }})

@app.route('/api/members/<int:uid>/compliance', methods=['GET'])
def member_compliance(uid):
    """查询服药合规率"""
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    conn = get_db()
    
    user = conn.execute("SELECT * FROM users WHERE id = ? AND family_id = ?", (uid, family_id)).fetchone()
    if not user:
        conn.close()
        return jsonify({'code': 1, 'msg': '成员不存在'}), 404
    
    # 获取近30天的打卡统计
    days = int(request.args.get('days', 30))
    today = date.today()

    # 一次性查询该成员所有启用的提醒（避免在循环中反复查询）
    all_reminders = [dict(r) for r in conn.execute(
        "SELECT id, repeat_type, weekdays, created_at FROM reminder_schedules WHERE member_id = ? AND enabled = 1",
        (uid,)
    ).fetchall()]

    daily_stats = []
    total_expected = 0
    total_done = 0

    for i in range(days):
        d = today - timedelta(days=i)
        d_str = d.isoformat()

        # 修复：按历史日期快照计算 expected
        # 1. 仅统计 created_at <= d 的提醒（历史口径，避免后增提醒污染历史）
        # 2. 按 repeat_type 过滤当日是否触发
        valid_reminders = [r for r in all_reminders
                           if _is_reminder_active_on_date(r, d)]
        expected = len(valid_reminders)

        # 当天打卡数量（按 schedule_id 去重，NULL schedule 退化为 medicine_id）
        done = conn.execute('''
            SELECT COUNT(DISTINCT COALESCE(cr.schedule_id, cr.medicine_id))
            FROM checkin_records cr
            WHERE cr.member_id = ? AND date(cr.checkin_time) = ?
        ''', (uid, d_str)).fetchone()[0]

        daily_stats.append({
            'date': d_str,
            'expected': expected,
            'done': done,
            'rate': round(done / expected * 100, 1) if expected > 0 else 0,
            'missed': expected > 0 and done == 0,
        })

        total_expected += expected
        total_done += done
    
    conn.close()
    
    overall_rate = round(total_done / total_expected * 100, 1) if total_expected > 0 else 0
    
    return jsonify({'code': 0, 'data': {
        'member_id': uid,
        'overall_rate': overall_rate,
        'total_expected': total_expected,
        'total_done': total_done,
        'daily_stats': daily_stats,
        'status': 'danger' if overall_rate < 60 else ('warning' if overall_rate < 80 else 'good'),
    }})

# ========== 家庭组与老人管理 API (Task 7) ==========

@app.route('/api/family/elderly', methods=['GET'])
def family_elderly_list():
    """查询家庭中所有老人列表"""
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    conn = get_db()
    
    elderly = [dict(r) for r in conn.execute(
        "SELECT id, username, elderly_name, is_elderly, role, role_type, created_at FROM users WHERE family_id = ? AND is_elderly = 1 ORDER BY created_at",
        (family_id,)
    ).fetchall()]
    conn.close()
    
    return jsonify({'code': 0, 'data': elderly})

@app.route('/api/family/elderly/add', methods=['POST'])
def family_elderly_add():
    """管理员将成员标记为老人"""
    auth = require_auth()
    if auth: return auth
    
    if session.get('role') != 'admin':
        return jsonify({'code': 1, 'msg': '仅管理员可操作'}), 403
    
    data = request.json
    user_id = data.get('user_id')
    elderly_name = data.get('elderly_name', '')
    
    if not user_id:
        return jsonify({'code': 1, 'msg': '请选择成员'}), 400
    
    family_id = get_current_family_id()
    conn = get_db()
    
    user = conn.execute("SELECT * FROM users WHERE id = ? AND family_id = ?", (user_id, family_id)).fetchone()
    if not user:
        conn.close()
        return jsonify({'code': 1, 'msg': '成员不存在'}), 404
    
    conn.execute(
        "UPDATE users SET is_elderly = 1, role_type = 'elderly', elderly_name = ?, caregiver_id = ? WHERE id = ?",
        (elderly_name or user['username'], session['user_id'], user_id)
    )
    conn.commit()
    conn.close()
    
    return jsonify({'code': 0, 'msg': f'已将 {elderly_name or user["username"]} 设为老人'})

@app.route('/api/family/elderly/<int:uid>/remove', methods=['POST'])
def family_elderly_remove(uid):
    """取消老人标记"""
    auth = require_auth()
    if auth: return auth
    
    if session.get('role') != 'admin':
        return jsonify({'code': 1, 'msg': '仅管理员可操作'}), 403
    
    family_id = get_current_family_id()
    conn = get_db()
    
    user = conn.execute("SELECT * FROM users WHERE id = ? AND family_id = ?", (uid, family_id)).fetchone()
    if not user:
        conn.close()
        return jsonify({'code': 1, 'msg': '成员不存在'}), 404
    
    conn.execute(
        "UPDATE users SET is_elderly = 0, role_type = 'member', elderly_name = '', caregiver_id = 0 WHERE id = ?",
        (uid,)
    )
    conn.commit()
    conn.close()
    return jsonify({'code': 0, 'msg': '已取消老人标记'})

@app.route('/api/family/members/<int:uid>', methods=['DELETE'])
def family_member_delete(uid):
    """管理员移除家庭成员（保留用户账号）"""
    auth = require_auth()
    if auth: return auth
    if session.get('role') != 'admin':
        return jsonify({'code': 1, 'msg': '仅管理员可操作'}), 403
    family_id = get_current_family_id()
    conn = get_db()
    user = conn.execute("SELECT * FROM users WHERE id = ? AND family_id = ?", (uid, family_id)).fetchone()
    if not user:
        conn.close()
        return jsonify({'code': 1, 'msg': '成员不存在'}), 404
    if user['username'] == session.get('username'):
        conn.close()
        return jsonify({'code': 1, 'msg': '不能删除自己'}), 400
    conn.execute("DELETE FROM member_medicines WHERE user_id = ?", (uid,))
    conn.execute("DELETE FROM reminder_schedules WHERE member_id = ?", (uid,))
    conn.execute("DELETE FROM checkin_records WHERE member_id = ?", (uid,))
    conn.execute("DELETE FROM drug_interaction_alerts WHERE member_id = ?", (uid,))
    conn.execute("DELETE FROM knowledge_base WHERE elderly_id = ?", (uid,))
    conn.execute("UPDATE users SET family_id = NULL WHERE id = ?", (uid,))
    conn.commit()
    conn.close()
    return jsonify({'code': 0, 'msg': f'已移除成员 {user["username"]}'})

@app.route('/api/family/name', methods=['PUT'])
def family_update_name():
    """更新家庭名称"""
    auth = require_auth()
    if auth: return auth
    if session.get('role') != 'admin':
        return jsonify({'code': 1, 'msg': '仅管理员可操作'}), 403
    data = request.json
    new_name = data.get('name', '').strip()
    if not new_name:
        return jsonify({'code': 1, 'msg': '家庭名称不能为空'}), 400
    family_id = get_current_family_id()
    conn = get_db()
    conn.execute("UPDATE families SET name = ? WHERE id = ?", (new_name, family_id))
    conn.commit()
    conn.close()
    return jsonify({'code': 0, 'msg': '家庭名称已更新'})

@app.route('/api/family/dashboard', methods=['GET'])
def family_dashboard():
    """管理员仪表盘数据聚合"""
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    conn = get_db()
    today_str = date.today().isoformat()
    
    # 获取所有老人
    elderly_list = [dict(r) for r in conn.execute(
        "SELECT id, username, elderly_name, is_elderly FROM users WHERE family_id = ? AND is_elderly = 1",
        (family_id,)
    ).fetchall()]
    
    dashboard = []
    for elder in elderly_list:
        uid = elder['id']

        # 今日总提醒（过滤 repeat_type 后的有效提醒数）
        all_reminders = [dict(r) for r in conn.execute(
            "SELECT * FROM reminder_schedules WHERE member_id = ? AND enabled = 1",
            (uid,)
        ).fetchall()]
        today_reminders = [r for r in all_reminders if _should_remind_today(
            r.get('repeat_type', 'daily'),
            r.get('weekdays', ''),
            r.get('created_at', '')
        )]
        total_reminders = len(today_reminders)

        # 今日打卡数
        checked = conn.execute('''
            SELECT COUNT(DISTINCT COALESCE(cr.schedule_id, cr.medicine_id))
            FROM checkin_records cr
            WHERE cr.member_id = ? AND date(cr.checkin_time) = ?
        ''', (uid, today_str)).fetchone()[0]

        # 最近打卡时间
        last_checkin = conn.execute(
            "SELECT checkin_time FROM checkin_records WHERE member_id = ? ORDER BY checkin_time DESC LIMIT 1",
            (uid,)
        ).fetchone()

        # 未读冲突告警
        unread_alerts = conn.execute(
            "SELECT COUNT(*) FROM drug_interaction_alerts WHERE member_id = ? AND is_read = 0",
            (uid,)
        ).fetchone()[0]

        # 最近冲突告警
        latest_alert = conn.execute(
            "SELECT * FROM drug_interaction_alerts WHERE member_id = ? ORDER BY created_at DESC LIMIT 1",
            (uid,)
        ).fetchone()

        # 超时分级状态计算（30min/2h 阈值）
        checkin_rows = [dict(r) for r in conn.execute(
            "SELECT schedule_id, medicine_id FROM checkin_records WHERE member_id = ? AND date(checkin_time) = ?",
            (uid, today_str)
        ).fetchall()]
        checked_schedule_ids = {c['schedule_id'] for c in checkin_rows if c['schedule_id']}
        checked_medicine_ids = {c['medicine_id'] for c in checkin_rows}
        status_info = _compute_elderly_status(today_reminders, checked_schedule_ids, checked_medicine_ids)

        # 综合状态：冲突告警最高优先级，其次超时分级
        if unread_alerts > 0:
            final_status = 'danger'
        elif total_reminders == 0 or checked >= total_reminders:
            final_status = 'normal'
        else:
            final_status = status_info['status']

        dashboard.append({
            'member_id': uid,
            'name': elder['elderly_name'] or elder['username'],
            'total_reminders': total_reminders,
            'checked_today': checked,
            'completion_rate': round(checked / total_reminders * 100, 1) if total_reminders > 0 else 0,
            'last_checkin_time': last_checkin['checkin_time'] if last_checkin else None,
            'has_alert': unread_alerts > 0,
            'unread_alerts': unread_alerts,
            'latest_alert': dict(latest_alert) if latest_alert else None,
            'status': final_status,
            'overdue_count': status_info['overdue_count'],
            'delayed_count': status_info['delayed_count'],
            'unchecked_count': status_info['unchecked'],
        })
    
    conn.close()
    return jsonify({'code': 0, 'data': dashboard})

@app.route('/api/family/info', methods=['GET'])
def family_info():
    """获取家庭信息（只读，所有成员可见）"""
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    conn = get_db()

    family = conn.execute(
        "SELECT id, name, invite_code FROM families WHERE id = ?",
        (family_id,)
    ).fetchone()

    admin = conn.execute(
        "SELECT username, elderly_name FROM users WHERE family_id = ? AND role_type = 'admin'",
        (family_id,)
    ).fetchone()

    members = conn.execute(
        "SELECT id, username, elderly_name, role_type, is_elderly FROM users WHERE family_id = ? ORDER BY role_type DESC, id ASC",
        (family_id,)
    ).fetchall()

    conn.close()

    return jsonify({
        'code': 0,
        'data': {
            'name': family['name'] if family else '未命名家庭',
            'invite_code': family['invite_code'] if family else '',
            'admin_name': admin['elderly_name'] or admin['username'] if admin else '-',
            'members': [dict(m) for m in members]
        }
    })

# ========== 健康罗盘 API（迭代4创新：5维雷达画像）==========

@app.route('/api/family/compass', methods=['GET'])
def family_compass():
    """家庭健康罗盘：5维评分（依从性/库存/安全/参与/联结）+ 综合分 + 洞察"""
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    conn = get_db()
    today_str = date.today().isoformat()

    # 家庭所有老人
    elderly_list = [dict(r) for r in conn.execute(
        "SELECT id FROM users WHERE family_id=? AND is_elderly=1", (family_id,)
    ).fetchall()]

    # 维度1：依从性（近7天打卡完成率加权）
    adherence_scores = []
    for e in elderly_list:
        uid = e['id']
        all_reminders = [dict(r) for r in conn.execute(
            "SELECT * FROM reminder_schedules WHERE member_id=? AND enabled=1", (uid,)
        ).fetchall()]
        # 近7天每日完成率
        total_expected = 0
        total_checked = 0
        for i in range(7):
            d = (date.today() - timedelta(days=i)).isoformat()
            day_reminders = [r for r in all_reminders if _is_reminder_active_on_date(r, date.fromisoformat(d))]
            total_expected += len(day_reminders)
            if day_reminders:
                checked = conn.execute(
                    "SELECT COUNT(DISTINCT COALESCE(schedule_id, medicine_id)) FROM checkin_records WHERE member_id=? AND date(checkin_time)=?",
                    (uid, d)
                ).fetchone()[0]
                total_checked += min(checked, len(day_reminders))
        adherence_scores.append((total_checked / total_expected * 100) if total_expected > 0 else 100)
    adherence = round(sum(adherence_scores) / len(adherence_scores)) if adherence_scores else 0

    # 维度2：库存健康度
    meds = conn.execute("SELECT id, status, expiry_date, stock_quantity FROM medicines WHERE family_id=?", (family_id,)).fetchall()
    expired = sum(1 for m in meds if m['status'] == 'active' and m['expiry_date'] and m['expiry_date'] < today_str)
    near_expiry = 0
    for m in meds:
        if m['status'] != 'active' or not m['expiry_date']:
            continue
        try:
            exp = date.fromisoformat(m['expiry_date'])
            if 0 <= (exp - date.today()).days <= 30:
                near_expiry += 1
        except Exception:
            pass
    pulse_count = 0
    for m in meds:
        if m['status'] == 'active':
            hb = _compute_inventory_heartbeat(m['id'], conn)
            if hb and hb['status'] == 'pulse':
                pulse_count += 1
    inventory_health = max(0, 100 - expired * 20 - near_expiry * 5 - pulse_count * 10)

    # 维度3：安全（冲突风险反向分）
    unread_alerts = 0
    for e in elderly_list:
        unread_alerts += conn.execute(
            "SELECT COUNT(*) FROM drug_interaction_alerts WHERE member_id=? AND is_read=0", (e['id'],)
        ).fetchone()[0]
    safety = max(0, 100 - unread_alerts * 25)

    # 维度4：知识参与度
    kb_growth = conn.execute(
        "SELECT COUNT(*) FROM knowledge_base WHERE family_id=? AND created_at >= date('now','-30 days')",
        (family_id,)
    ).fetchone()[0]
    questions_asked = conn.execute(
        "SELECT SUM(use_count) FROM knowledge_base WHERE family_id=?", (family_id,)
    ).fetchone()[0] or 0
    engagement = min(100, kb_growth * 10 + questions_asked * 2)

    # 维度5：情感联结（语音明信片）
    postcards_total = conn.execute(
        "SELECT COUNT(*) FROM voice_postcards WHERE family_id=?", (family_id,)
    ).fetchone()[0]
    postcards_read = conn.execute(
        "SELECT COUNT(*) FROM voice_postcards WHERE family_id=? AND is_read=1", (family_id,)
    ).fetchone()[0]
    recent_postcards = conn.execute(
        "SELECT COUNT(*) FROM voice_postcards WHERE family_id=? AND created_at >= date('now','-30 days')",
        (family_id,)
    ).fetchone()[0]
    read_rate = (postcards_read / postcards_total * 100) if postcards_total > 0 else 0
    connection = min(100, recent_postcards * 8 + read_rate * 0.4)

    axes = {
        'adherence': round(adherence),
        'inventory': round(inventory_health),
        'safety': round(safety),
        'engagement': round(engagement),
        'connection': round(connection),
    }
    overall = round(
        adherence * 0.30 + inventory_health * 0.20 + safety * 0.25 +
        engagement * 0.10 + connection * 0.15
    )

    # 洞察：找最弱维度
    weakest = min(axes, key=axes.get)
    insights = {
        'adherence': '依从性偏低，建议检查老人打卡是否遇到操作困难，或提醒时间设置是否合理',
        'inventory': '库存健康度下降，存在过期、临期或即将断药药品，建议及时清理与补货',
        'safety': '药物冲突风险升高，请查看冲突告警详情并咨询医生',
        'engagement': '老人近期提问较少，可能对用药有疑问未表达，建议主动询问',
        'connection': '近期语音明信片减少，老人可能需要更多情感关怀，试试给老人留言'
    }

    conn.close()
    return jsonify({'code': 0, 'data': {
        'axes': axes,
        'overall': overall,
        'insight': insights.get(weakest, '家庭健康状况良好，继续保持'),
        'weakest': weakest,
    }})


# ========== AI 健康周报 + 药箱精灵周记（迭代5创新）==========

@app.route('/api/health/weekly-report', methods=['GET'])
def health_weekly_report():
    """生成本周健康周报：聚合7天数据 + AI药箱精灵日记体叙事（含降级）"""
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    conn = get_db()
    today = date.today()
    week_ago = (today - timedelta(days=7)).isoformat()
    today_str = today.isoformat()
    # 本年第几周
    week_number = today.isocalendar()[1]

    elderly_list = [dict(r) for r in conn.execute(
        "SELECT id, elderly_name, username FROM users WHERE family_id=? AND is_elderly=1", (family_id,)
    ).fetchall()]

    # 聚合7天打卡数据
    total_checked = 0
    total_expected = 0
    for e in elderly_list:
        uid = e['id']
        all_reminders = [dict(r) for r in conn.execute(
            "SELECT * FROM reminder_schedules WHERE member_id=? AND enabled=1", (uid,)
        ).fetchall()]
        for i in range(7):
            d = (today - timedelta(days=i)).isoformat()
            day_reminders = [r for r in all_reminders if _is_reminder_active_on_date(r, date.fromisoformat(d))]
            total_expected += len(day_reminders)
            if day_reminders:
                checked = conn.execute(
                    "SELECT COUNT(DISTINCT COALESCE(schedule_id, medicine_id)) FROM checkin_records WHERE member_id=? AND date(checkin_time)=?",
                    (uid, d)
                ).fetchone()[0]
                total_checked += min(checked, len(day_reminders))
    compliance_rate = round(total_checked / total_expected * 100, 1) if total_expected > 0 else 0

    # 7天打卡总次数
    checked_count = conn.execute(
        "SELECT COUNT(*) FROM checkin_records WHERE date(checkin_time) >= ? AND member_id IN (SELECT id FROM users WHERE family_id=?)",
        (week_ago, family_id)
    ).fetchone()[0]

    # 7天语音明信片
    postcard_count = conn.execute(
        "SELECT COUNT(*) FROM voice_postcards WHERE family_id=? AND created_at >= ?", (family_id, week_ago)
    ).fetchone()[0]

    # 7天冲突告警
    alert_count = conn.execute(
        "SELECT COUNT(*) FROM drug_interaction_alerts WHERE member_id IN (SELECT id FROM users WHERE family_id=?) AND created_at >= ?",
        (family_id, week_ago)
    ).fetchone()[0]

    # 补货清单
    meds = conn.execute(
        "SELECT id, name, stock_quantity, pack_total_units, unit_label FROM medicines WHERE family_id=? AND status='active'", (family_id,)
    ).fetchall()
    restock_list = []
    for m in meds:
        hb = _compute_inventory_heartbeat(m['id'], conn)
        if hb and hb['status'] in ('pulse', 'depleted'):
            restock_list.append({
                'name': m['name'],
                'remaining_units': hb['remaining_units'],
                'unit_label': m['unit_label'],
                'days_left': hb['days_left'],
                'suggest_buy': int(m['pack_total_units'] or 30),
            })

    stats = {
        'compliance_rate': compliance_rate,
        'checked_count': checked_count,
        'postcard_count': postcard_count,
        'alert_count': alert_count,
        'elderly_count': len(elderly_list),
    }

    # 调用 AI 生成药箱精灵日记（含降级）
    spirit_diary = ''
    ai_available = True
    elderly_names = '、'.join([e['elderly_name'] or e['username'] for e in elderly_list]) or '家人'
    material = f"本周素材：{elderly_names}合规率{compliance_rate}%，共打卡{checked_count}次，收到{postcard_count}条语音明信片，{alert_count}条冲突告警。"
    if restock_list:
        material += f"需要补货的药品：{('、'.join([r['name'] for r in restock_list]))}。"

    # 快速预检：API key 未配置时直接走降级，避免阻塞 HTTP 请求
    ai_key_configured = bool(config.AI_API_KEY) and not config.AI_API_KEY.startswith('sk-your-api-key')
    if ai_key_configured:
        try:
            prompt = f"""你是"药箱精灵"，一个住在家庭药箱里的小精灵，用第一人称日记体为这个家庭写一段本周健康周记。

要求：
1. 第一人称"我"叙述，口吻温暖关切，像一个关心家人的小助手
2. 不超过200字
3. 必须引用以下素材中的具体数据
4. 结尾给一句鼓励
5. 不要用列表格式，用自然段落

{material}

请直接写日记，不要加标题和引号："""
            result = ai_service._call_llm(
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7,
                max_tokens=400
            )
            if result.get('success'):
                spirit_diary = result.get('content', '').strip()
            else:
                ai_available = False
        except Exception:
            ai_available = False
    else:
        ai_available = False

    # AI 不可用时降级：规则式生成
    if not spirit_diary:
        ai_available = False
        spirit_diary = f"这周我一直在关注{elderly_names}。本周合规率{compliance_rate}%，共打卡{checked_count}次。"
        if postcard_count > 0:
            spirit_diary += f"收到了{postcard_count}条语音明信片，每一条我都认真听了。"
        if alert_count > 0:
            spirit_diary += f"有{alert_count}条药物冲突告警需要留意。"
        if restock_list:
            spirit_diary += f"记得补货：{'、'.join([r['name'] for r in restock_list])}。"
        spirit_diary += "下周也要按时服药哦，我会继续守着药箱的。"

    conn.close()
    return jsonify({'code': 0, 'data': {
        'spirit_diary': spirit_diary,
        'stats': stats,
        'restock_list': restock_list,
        'week_number': week_number,
        'ai_available': ai_available,
    }})

# ========== 知识库 API (Task 8) ==========

@app.route('/api/knowledge/ask', methods=['POST'])
def knowledge_ask():
    """老人提问 / 查询知识库"""
    auth = require_auth()
    if auth: return auth
    
    data = request.json
    question = data.get('question', '').strip()
    elderly_id = data.get('elderly_id', session.get('user_id'))
    
    if not question:
        return jsonify({'code': 1, 'msg': '请输入问题'}), 400
    
    family_id = get_current_family_id()
    
    result = knowledge_engine.ask_question(question, family_id, elderly_id)
    
    if result['found']:
        return jsonify({'code': 0, 'msg': '知识库中找到答案', 'data': result['data']})
    else:
        return jsonify({'code': 0, 'msg': '问题已提交，等待回复', 'data': result['data']})

@app.route('/api/knowledge/ask-video', methods=['POST'])
def knowledge_ask_video():
    """老人视频提问"""
    auth = require_auth()
    if auth: return auth

    question_text = request.form.get('question_text', '[视频提问]')
    elderly_id_raw = request.form.get('elderly_id', '')
    try:
        elderly_id = int(elderly_id_raw) if elderly_id_raw else session.get('user_id')
    except (TypeError, ValueError):
        elderly_id = session.get('user_id')

    video = request.files.get('video')

    family_id = get_current_family_id()

    video_url = ''
    if video:
        import uuid
        filename = f"video_{uuid.uuid4().hex}.webm"
        video_path = os.path.join(UPLOAD_DIR, filename)
        video.save(video_path)
        video_url = f"/uploads/{filename}"
        register_upload(filename, family_id, session.get('user_id'))

    result = knowledge_engine.ask_question(question_text, family_id, elderly_id)

    return jsonify({'code': 0, 'msg': '视频已提交，等待回复', 'data': result['data']})

@app.route('/api/knowledge/reply', methods=['POST'])
def knowledge_reply():
    """管理员回复问题（支持 JSON 和 FormData 两种格式，FormData 可上传语音/图片）"""
    auth = require_auth()
    if auth: return auth

    if session.get('role') != 'admin':
        return jsonify({'code': 1, 'msg': '仅管理员可回复'}), 403

    # 兼容 JSON 与 FormData
    if request.content_type and 'application/json' in request.content_type:
        data = request.json or {}
    else:
        data = request.form.to_dict()

    kb_id = data.get('id') or data.get('question_id')
    answer_text = data.get('answer_text', '')
    answer_type = data.get('answer_type', 'text')
    answer_audio_url = data.get('answer_audio_url', '')
    answer_image_url = data.get('answer_image_url', '')

    if not kb_id:
        return jsonify({'code': 1, 'msg': '请指定问题ID'}), 400

    # 处理语音文件上传
    audio_file = request.files.get('audio')
    if audio_file and audio_file.filename:
        import uuid
        ext = os.path.splitext(audio_file.filename)[1] or '.webm'
        filename = f"audio_{uuid.uuid4().hex}{ext}"
        audio_file.save(os.path.join(UPLOAD_DIR, filename))
        answer_audio_url = f"/uploads/{filename}"
        register_upload(filename, get_current_family_id(), session.get('user_id'))
        if answer_type == 'text':
            answer_type = 'audio'

    # 处理图片文件上传
    image_file = request.files.get('image')
    if image_file and image_file.filename:
        import uuid
        ext = os.path.splitext(image_file.filename)[1] or '.jpg'
        filename = f"image_{uuid.uuid4().hex}{ext}"
        image_file.save(os.path.join(UPLOAD_DIR, filename))
        answer_image_url = f"/uploads/{filename}"
        register_upload(filename, get_current_family_id(), session.get('user_id'))
        if answer_type == 'text':
            answer_type = 'image'

    if not answer_text and not answer_audio_url and not answer_image_url:
        return jsonify({'code': 1, 'msg': '请提供回复内容'}), 400

    family_id = get_current_family_id()

    success = knowledge_engine.reply_question(
        kb_id, family_id, answer_text, answer_audio_url, answer_image_url, answer_type
    )

    if success:
        return jsonify({'code': 0, 'msg': '回复成功，已存入知识库'})
    else:
        return jsonify({'code': 1, 'msg': '问题不存在'}), 404

@app.route('/api/knowledge/confirm-semantic', methods=['POST'])
def knowledge_confirm_semantic():
    """确认中等置信度的语义匹配结果（老人端确认或管理员端操作）"""
    auth = require_auth()
    if auth: return auth

    data = request.get_json(silent=True) or {}
    new_question = data.get('new_question', '').strip()
    suggested_id = data.get('suggested_id')
    elderly_id = data.get('elderly_id', session.get('user_id'))
    pending_id = data.get('pending_id')  # 中等置信度创建的 pending 记录 id

    if not new_question or not suggested_id:
        return jsonify({'code': 1, 'msg': '参数不完整'}), 400

    family_id = get_current_family_id()

    result = knowledge_engine.confirm_semantic_match(new_question, family_id, elderly_id, suggested_id)

    if result['success']:
        # 清理中等置信度创建的 pending 记录（已被确认，不再需要管理员回复）
        if pending_id:
            conn = get_db()
            try:
                conn.execute(
                    "DELETE FROM knowledge_base WHERE id = ? AND family_id = ? AND answer_type = 'pending'",
                    (pending_id, family_id)
                )
                conn.commit()
            finally:
                conn.close()
        return jsonify({'code': 0, 'msg': '语义匹配确认成功，已存入知识库', 'data': result['data']})
    else:
        return jsonify({'code': 1, 'msg': result.get('error', '操作失败')}), 404

@app.route('/api/knowledge/pending', methods=['GET'])
def knowledge_pending():
    """查询待回复问题列表"""
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    pending = knowledge_engine.get_pending_questions(family_id)
    
    return jsonify({'code': 0, 'data': pending, 'pending_count': len(pending)})

@app.route('/api/knowledge/list', methods=['GET'])
def knowledge_list():
    """知识库管理列表"""
    auth = require_auth()
    if auth: return auth
    
    family_id = get_current_family_id()
    elderly_id = request.args.get('elderly_id', type=int)
    
    items = knowledge_engine.get_all_knowledge(family_id, elderly_id)
    
    return jsonify({'code': 0, 'data': items, 'total': len(items)})

@app.route('/api/knowledge/<int:kid>', methods=['PUT'])
def knowledge_update(kid):
    """编辑知识库条目"""
    auth = require_auth()
    if auth: return auth
    
    if session.get('role') != 'admin':
        return jsonify({'code': 1, 'msg': '仅管理员可编辑'}), 403
    
    data = request.json
    family_id = get_current_family_id()
    
    success = knowledge_engine.update_knowledge(kid, family_id, **data)
    
    if success:
        return jsonify({'code': 0, 'msg': '更新成功'})
    else:
        return jsonify({'code': 1, 'msg': '条目不存在'}), 404

@app.route('/api/knowledge/<int:kid>', methods=['DELETE'])
def knowledge_delete(kid):
    """删除知识库条目"""
    auth = require_auth()
    if auth: return auth
    
    if session.get('role') != 'admin':
        return jsonify({'code': 1, 'msg': '仅管理员可删除'}), 403
    
    family_id = get_current_family_id()
    
    success = knowledge_engine.delete_knowledge(kid, family_id)
    
    if success:
        return jsonify({'code': 0, 'msg': '删除成功'})
    else:
        return jsonify({'code': 1, 'msg': '条目不存在'}), 404

# ========== AI 健康检查 (Task 9) ==========

@app.route('/api/ai/health', methods=['GET'])
def ai_health_check():
    """AI 服务健康检查"""
    result = ai_service.health_check()
    return jsonify({'code': 0, 'data': {
        'ai_available': result.get('available', False),
        'duration_ms': result.get('duration_ms', 0),
        'drug_api_configured': bool(config.DRUG_API_KEY),
    }})

# ========== 静态文件 ==========

@app.route('/uploads/<path:filename>')
def serve_upload(filename):
    """上传文件访问：要求登录 + 家庭归属校验，防越权访问他人语音/图片"""
    # 1. 必须登录
    if not session.get('user_id'):
        return jsonify({'code': 401, 'msg': '请先登录'}), 401
    family_id = get_current_family_id()

    # 2. 查 registry 校验归属
    conn = get_db()
    row = conn.execute(
        "SELECT family_id FROM uploads_registry WHERE filename = ?", (filename,)
    ).fetchone()
    conn.close()

    if row:
        # 命中登记：严格校验家庭归属
        if row['family_id'] != family_id:
            return jsonify({'code': 403, 'msg': '无权访问该文件'}), 403
    else:
        # 未登记的旧文件（迁移前）：仅允许登录用户访问，不强制家庭校验
        # 防止路径穿越
        pass

    # 3. 防路径穿越
    safe_name = os.path.basename(filename)
    if safe_name != filename:
        return jsonify({'code': 403, 'msg': '非法路径'}), 403

    return send_from_directory(UPLOAD_DIR, safe_name)

@app.route('/')
def serve_index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/login.html')
def serve_login():
    return send_from_directory(app.static_folder, 'login.html')

@app.route('/landing.html')
def serve_landing():
    return send_from_directory(app.static_folder, 'landing.html')

# ========== 异常场景告警 API（迭代4 P0：异常场景实时通道） ==========

@app.route('/api/scene-alerts', methods=['GET'])
def list_scene_alerts():
    """家庭成员获取异常场景告警列表"""
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    only_unread = request.args.get('unread', '0') == '1'
    limit = request.args.get('limit', 50, type=int)

    conn = get_db()
    sql = """SELECT sa.*, u.elderly_name, u.username as elderly_username,
                    cu.username as claimed_by_username
             FROM scene_alerts sa
             LEFT JOIN users u ON sa.elderly_id = u.id
             LEFT JOIN users cu ON sa.claimed_by = cu.id
             WHERE sa.family_id = ?"""
    params = [family_id]
    if only_unread:
        sql += " AND sa.is_read = 0"
    sql += " ORDER BY CASE sa.severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END, sa.created_at DESC LIMIT ?"
    params.append(limit)
    rows = [dict(r) for r in conn.execute(sql, params).fetchall()]
    conn.close()
    return jsonify({'code': 0, 'data': rows, 'total': len(rows)})


@app.route('/api/scene-alerts/unread-count', methods=['GET'])
def unread_scene_alert_count():
    """获取未读异常告警数量（家庭顶栏铃铛轮询用）"""
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    conn = get_db()
    row = conn.execute(
        "SELECT COUNT(*) as c, SUM(CASE WHEN severity='critical' THEN 1 ELSE 0 END) as critical "
        "FROM scene_alerts WHERE family_id = ? AND is_read = 0",
        (family_id,)
    ).fetchone()
    conn.close()
    return jsonify({'code': 0, 'data': {'count': row['c'] or 0, 'critical': row['critical'] or 0}})


@app.route('/api/scene-alerts/<int:aid>/read', methods=['POST'])
def mark_scene_alert_read(aid):
    """标记告警为已读"""
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    conn = get_db()
    conn.execute("UPDATE scene_alerts SET is_read = 1 WHERE id = ? AND family_id = ?", (aid, family_id))
    conn.commit()
    conn.close()
    return jsonify({'code': 0, 'msg': '已标记为已读'})


@app.route('/api/scene-alerts/<int:aid>/claim', methods=['POST'])
def claim_scene_alert(aid):
    """家庭成员认领异常处理（P1：避免多人重复跟进）"""
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    uid = session.get('user_id')
    conn = get_db()
    existing = conn.execute(
        "SELECT claimed_by FROM scene_alerts WHERE id = ? AND family_id = ?",
        (aid, family_id)
    ).fetchone()
    if not existing:
        conn.close()
        return jsonify({'code': 1, 'msg': '告警不存在'}), 404
    if existing['claimed_by'] and existing['claimed_by'] != uid:
        other = conn.execute("SELECT username FROM users WHERE id = ?", (existing['claimed_by'],)).fetchone()
        conn.close()
        return jsonify({'code': 1, 'msg': f'已被 {other["username"] if other else "其他成员"} 认领'})
    conn.execute(
        "UPDATE scene_alerts SET claimed_by = ?, claimed_at = datetime('now','localtime'), is_read = 1 WHERE id = ?",
        (uid, aid)
    )
    conn.commit()
    conn.close()
    return jsonify({'code': 0, 'msg': '认领成功'})


# ========== 语音明信片 API（情感联结：老人给家人留语音） ==========

@app.route('/api/voice-postcards', methods=['POST'])
def upload_voice_postcard():
    """老人上传语音明信片"""
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    uid = session.get('user_id')

    # 同时支持 multipart（音频文件）和 JSON（仅文字备注）
    if 'audio' in request.files:
        audio_file = request.files['audio']
        note = request.form.get('note', '')
        duration = int(request.form.get('duration', 0) or 0)
        # 生成安全文件名
        import uuid
        ext = os.path.splitext(audio_file.filename)[1] or '.webm'
        safe_name = f"postcard_{uid}_{uuid.uuid4().hex[:8]}{ext}"
        audio_path = os.path.join(UPLOAD_DIR, safe_name)
        audio_file.save(audio_path)
        audio_url = f'/uploads/{safe_name}'
        register_upload(safe_name, family_id, uid)
    else:
        data = request.json or {}
        note = data.get('note', '')
        audio_url = ''
        duration = 0

    if not audio_url:
        return jsonify({'code': 1, 'msg': '未收到音频文件'}), 400

    conn = get_db()
    conn.execute(
        "INSERT INTO voice_postcards (family_id, elderly_id, audio_url, note, duration_seconds) VALUES (?, ?, ?, ?, ?)",
        (family_id, uid, audio_url, note, duration)
    )
    conn.commit()
    new_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
    conn.close()
    return jsonify({'code': 0, 'msg': '语音明信片已发送', 'id': new_id})

@app.route('/api/voice-postcards', methods=['GET'])
def list_voice_postcards():
    """家庭成员获取语音明信片列表"""
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    limit = request.args.get('limit', 20, type=int)
    conn = get_db()
    rows = [dict(r) for r in conn.execute(
        """SELECT vp.*, u.username as elderly_username, u.elderly_name
           FROM voice_postcards vp
           LEFT JOIN users u ON vp.elderly_id = u.id
           WHERE vp.family_id = ?
           ORDER BY vp.created_at DESC LIMIT ?""",
        (family_id, limit)
    ).fetchall()]
    conn.close()
    return jsonify({'code': 0, 'data': rows})

@app.route('/api/voice-postcards/<int:pid>/read', methods=['POST'])
def mark_postcard_read(pid):
    """标记语音明信片为已读"""
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    conn = get_db()
    conn.execute("UPDATE voice_postcards SET is_read = 1 WHERE id = ? AND family_id = ?", (pid, family_id))
    conn.commit()
    conn.close()
    return jsonify({'code': 0, 'msg': '已标记为已读'})

@app.route('/api/voice-postcards/unread-count', methods=['GET'])
def unread_postcard_count():
    """获取未读语音明信片数量"""
    auth = require_auth()
    if auth: return auth
    family_id = get_current_family_id()
    conn = get_db()
    count = conn.execute(
        "SELECT COUNT(*) FROM voice_postcards WHERE family_id = ? AND is_read = 0",
        (family_id,)
    ).fetchone()[0]
    conn.close()
    return jsonify({'code': 0, 'data': {'count': count}})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)