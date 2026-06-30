"""智能错题本 - Flask 后端 + AI 拍照识别 / 解答 / 举一反三"""
import json
import os
import re
import sys
import hmac
import socket
import base64
import uuid
import time
import hashlib
import threading
import tempfile
import webbrowser
import urllib.request
import urllib.error
from pathlib import Path
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory, render_template, abort
from openai import OpenAI
import httpx as _httpx
from werkzeug.utils import secure_filename

app = Flask(__name__, template_folder="templates")
app.config["MAX_CONTENT_LENGTH"] = 64 * 1024 * 1024

# ========== 并发锁（修复问题8：JSON读写竞态） ==========
_data_lock = threading.RLock()

# ========== 调试模式（控制错误信息是否暴露） ==========
DEBUG_MODE = os.environ.get("SEB_DEBUG", "0") == "1"

ALLOWED_IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "bmp"}
ALLOWED_IMAGE_MAGIC = {
    b"\xff\xd8\xff": "jpg",
    b"\x89PNG\r\n\x1a\n": "png",
    b"GIF87a": "gif",
    b"GIF89a": "gif",
    b"RIFF": "webp",
    b"BM": "bmp",
}


def _safe_error(message, detail=None, code=500):
    if DEBUG_MODE and detail is not None:
        return jsonify({"error": f"{message}: {detail}"}), code
    return jsonify({"error": message}), code


# ========== 安全：CORS 限制（默认只允许同源） ==========
@app.after_request
def add_security_headers(resp):
    resp.headers["X-Content-Type-Options"] = "nosniff"
    resp.headers["X-Frame-Options"] = "SAMEORIGIN"
    resp.headers["Referrer-Policy"] = "same-origin"
    resp.headers["X-XSS-Protection"] = "1; mode=block"
    origin = request.headers.get("Origin", "")
    if origin and _is_allowed_origin(origin):
        resp.headers["Access-Control-Allow-Origin"] = origin
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, X-Sync-Token"
    return resp


def _is_allowed_origin(origin):
    cfg = load_config()
    port = cfg.get("port", 5000)
    allowed = {
        "http://localhost", "https://localhost",
        "http://127.0.0.1", "https://127.0.0.1",
        f"http://localhost:{port}", f"https://localhost:{port}",
        f"http://127.0.0.1:{port}", f"https://127.0.0.1:{port}",
    }
    remote = (cfg.get("remote_url") or "").rstrip("/")
    if remote:
        allowed.add(remote)
    if origin.rstrip("/") in allowed:
        return True
    host = request.host.split(":")[0]
    if origin.startswith(f"http://{host}") or origin.startswith(f"https://{host}"):
        return True
    return False


# ========== 加密工具（改进版：基于 PBKDF2 扩展密钥流的安全 XOR） ==========
SENSITIVE_FIELDS = {"api_key", "remote_token"}


def _get_machine_key():
    try:
        host = socket.gethostname()
    except Exception:
        host = "unknown"
    try:
        user = os.getlogin()
    except Exception:
        user = os.environ.get("USERNAME") or os.environ.get("USER") or "user"
    try:
        mac = uuid.getnode()
    except Exception:
        mac = 0
    raw = f"smart-error-book::{host}::{user}::{mac}".encode("utf-8")
    return hashlib.pbkdf2_hmac("sha256", raw, b"seb-salt-v2", 200000, dklen=64)


def _derive_keystream(key, iv, length):
    stream = b""
    counter = 0
    while len(stream) < length:
        block = hashlib.pbkdf2_hmac(
            "sha256",
            key + counter.to_bytes(8, "little"),
            iv,
            1,
            dklen=min(64, length - len(stream)),
        )
        stream += block
        counter += 1
    return stream[:length]


def _encrypt_str(plaintext, key):
    if not plaintext:
        return ""
    iv = os.urandom(16)
    data = plaintext.encode("utf-8")
    keystream = _derive_keystream(key, iv, len(data))
    encrypted = bytes(b ^ keystream[i] for i, b in enumerate(data))
    payload = iv + encrypted
    return "enc:" + base64.urlsafe_b64encode(payload).decode("ascii")


def _decrypt_str(ciphertext, key):
    if not ciphertext:
        return ""
    if not ciphertext.startswith("enc:"):
        return ciphertext
    try:
        payload = base64.urlsafe_b64decode(ciphertext[4:])
        iv = payload[:16]
        data = payload[16:]
        keystream = _derive_keystream(key, iv, len(data))
        decrypted = bytes(b ^ keystream[i] for i, b in enumerate(data))
        return decrypted.decode("utf-8")
    except Exception:
        return ""


def _encrypt_config(cfg, key):
    result = {}
    for k, v in cfg.items():
        if k in SENSITIVE_FIELDS and isinstance(v, str) and v:
            result[k] = _encrypt_str(v, key)
        else:
            result[k] = v
    result["_enc"] = True
    result["_enc_ver"] = 2
    return result


def _decrypt_config(cfg, key):
    ver = cfg.get("_enc_ver", 1)
    if not cfg.get("_enc"):
        return cfg
    result = {}
    for k, v in cfg.items():
        if k in ("_enc", "_enc_ver"):
            continue
        if k in SENSITIVE_FIELDS and isinstance(v, str) and v.startswith("enc:"):
            result[k] = _decrypt_str(v, key)
        else:
            result[k] = v
    return result


# ========== 配置 ==========
BASE_DIR = Path(__file__).parent
CONFIG_FILE = BASE_DIR / "config.json"

DEFAULT_CONFIG = {
    "api_key": "",
    "base_url": "",
    "text_model": "",
    "vision_model": "",
    "port": 5000,
    "remote_url": "",
    "remote_token": "",
    "skip_ssl_verify": False,
}

_config = None
_client = None
_cached_machine_key = None


def _machine_key():
    global _cached_machine_key
    if _cached_machine_key is None:
        _cached_machine_key = _get_machine_key()
    return _cached_machine_key


def load_config():
    global _config
    if _config is not None:
        return _config
    key = _machine_key()
    if CONFIG_FILE.exists():
        try:
            with open(CONFIG_FILE, "r", encoding="utf-8") as f:
                raw = json.load(f)
            _config = _decrypt_config(raw, key)
        except Exception:
            _config = DEFAULT_CONFIG.copy()
    else:
        _config = DEFAULT_CONFIG.copy()
    for k, v in DEFAULT_CONFIG.items():
        if k not in _config:
            _config[k] = v
    return _config


def _atomic_save(filepath, data):
    dirpath = os.path.dirname(filepath) or "."
    fd, tmp_path = tempfile.mkstemp(dir=dirpath, prefix=".tmp_", suffix=".json")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        os.replace(tmp_path, filepath)
    except Exception:
        try:
            os.unlink(tmp_path)
        except Exception:
            pass
        raise


def save_config(cfg):
    global _config, _client
    for k, v in DEFAULT_CONFIG.items():
        if k not in cfg:
            cfg[k] = v
    _config = cfg
    _client = None
    key = _machine_key()
    encrypted = _encrypt_config(cfg, key)
    with _data_lock:
        _atomic_save(str(CONFIG_FILE), encrypted)
    try:
        os.chmod(CONFIG_FILE, 0o600)
    except Exception:
        pass


def get_safe_config():
    cfg = load_config()
    return {
        "api_key": ("***" + cfg["api_key"][-4:]) if cfg.get("api_key") and len(cfg["api_key"]) > 4 else ("已配置" if cfg.get("api_key") else ""),
        "api_key_set": bool(cfg.get("api_key")),
        "base_url": cfg.get("base_url", DEFAULT_CONFIG["base_url"]),
        "text_model": cfg.get("text_model", DEFAULT_CONFIG["text_model"]),
        "vision_model": cfg.get("vision_model", DEFAULT_CONFIG["vision_model"]),
        "port": cfg.get("port", DEFAULT_CONFIG["port"]),
        "remote_url": cfg.get("remote_url", ""),
        "remote_token_set": bool(cfg.get("remote_token")),
        "skip_ssl_verify": bool(cfg.get("skip_ssl_verify", False)),
    }


def get_client():
    global _client
    if _client is not None:
        return _client
    cfg = load_config()
    if not cfg.get("api_key"):
        return None
    try:
        skip_verify = bool(cfg.get("skip_ssl_verify", False))
        _http_client = _httpx.Client(verify=not skip_verify)
        _client = OpenAI(
            api_key=cfg["api_key"],
            base_url=cfg["base_url"],
            http_client=_http_client,
        )
    except Exception:
        return None
    return _client


def is_configured():
    cfg = load_config()
    return bool(cfg.get("api_key"))


def get_text_model():
    return load_config().get("text_model", DEFAULT_CONFIG["text_model"])


def get_vision_model():
    return load_config().get("vision_model", DEFAULT_CONFIG["vision_model"])


def require_ai():
    cli = get_client()
    return cli


# ========== 数据文件 ==========
QUESTIONS_FILE = BASE_DIR / "questions.json"
CATEGORIES_FILE = BASE_DIR / "categories.json"
NOTES_FILE = BASE_DIR / "notes.json"
UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(exist_ok=True)


# ========== 数据读写（线程安全 + 原子写） ==========
def load_json(filepath, default=None):
    with _data_lock:
        if filepath.exists():
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception:
                pass
        return default if default is not None else {}


def save_json(filepath, data):
    with _data_lock:
        _atomic_save(str(filepath), data)


def load_questions():
    return load_json(QUESTIONS_FILE, [])


def save_questions(data):
    save_json(QUESTIONS_FILE, data)


def load_categories():
    data = load_json(CATEGORIES_FILE, None)
    if data is None or not isinstance(data, list):
        data = [
            {"id": "cat_1", "name": "未分类", "icon": "📁", "parent": None, "sort": 0},
        ]
        save_categories(data)
    return data


def save_categories(data):
    save_json(CATEGORIES_FILE, data)


def load_notes():
    data = load_json(NOTES_FILE, None)
    if data is None or not isinstance(data, list):
        data = []
        save_notes(data)
    return data


def save_notes(data):
    save_json(NOTES_FILE, data)


def _next_int_id(items):
    existing = [it["id"] for it in items if isinstance(it.get("id"), int)]
    return (max(existing) + 1) if existing else 1


def merge_list(old, new, key="id", replace=False):
    if replace:
        return list(new)
    existing = {item.get(key): item for item in old if item.get(key) is not None}
    for item in new:
        k = item.get(key)
        if k is not None and k in existing:
            # 比较时间戳，保留较新的一条，避免静默覆盖
            old_ts = existing[k].get("updated_at", "")
            new_ts = item.get("updated_at", "")
            if new_ts >= old_ts:
                existing[k] = item
        elif k is not None:
            existing[k] = item
        else:
            old.append(item)
    return list(existing.values())


# ========== 路由 ==========

@app.after_request
def add_header(response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    return response


# ---------- 配置 API ----------

@app.route("/api/config", methods=["GET"])
def get_config():
    return jsonify(get_safe_config())


@app.route("/api/config", methods=["POST"])
def update_config():
    data = request.get_json(silent=True) or {}
    cfg = load_config()

    if "api_key" in data and data["api_key"]:
        v = data["api_key"].strip()
        if v and not v.startswith("***") and not v.startswith("已配置"):
            cfg["api_key"] = v
    if "base_url" in data:
        cfg["base_url"] = data["base_url"].strip() or DEFAULT_CONFIG["base_url"]
    if "text_model" in data:
        cfg["text_model"] = data["text_model"].strip() or DEFAULT_CONFIG["text_model"]
    if "vision_model" in data:
        cfg["vision_model"] = data["vision_model"].strip() or DEFAULT_CONFIG["vision_model"]
    if "port" in data:
        try:
            cfg["port"] = int(data["port"])
        except (ValueError, TypeError):
            pass
    if "remote_url" in data:
        cfg["remote_url"] = data["remote_url"].strip().rstrip("/")
        if not cfg["remote_url"]:
            cfg["remote_token"] = ""
    if "remote_token" in data and data["remote_token"]:
        cfg["remote_token"] = data["remote_token"].strip()
    if "skip_ssl_verify" in data:
        cfg["skip_ssl_verify"] = bool(data["skip_ssl_verify"])

    save_config(cfg)
    return jsonify({"ok": True, "configured": bool(cfg.get("api_key"))})


@app.route("/api/status", methods=["GET"])
def api_status():
    cfg = load_config()
    return jsonify({
        "configured": bool(cfg.get("api_key")),
        "base_url": cfg.get("base_url", DEFAULT_CONFIG["base_url"]),
        "text_model": cfg.get("text_model", DEFAULT_CONFIG["text_model"]),
        "vision_model": cfg.get("vision_model", DEFAULT_CONFIG["vision_model"]),
        "remote_url": cfg.get("remote_url", ""),
        "remote_connected": bool(cfg.get("remote_url")),
        "skip_ssl_verify": bool(cfg.get("skip_ssl_verify", False)),
    })


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/architecture")
def architecture():
    with open(BASE_DIR / "architecture.html", "r", encoding="utf-8") as f:
        return f.read()


# ---------- 题目 API ----------

@app.route("/api/questions")
def get_questions():
    questions = load_questions()
    category = request.args.get("category") or request.args.get("category_id")
    q_type = request.args.get("type")
    difficulty = request.args.get("difficulty")
    keyword = request.args.get("keyword", "")
    wrong_only = request.args.get("wrong_only") == "true"
    mastered_only = request.args.get("mastered_only") == "true"

    filtered = questions
    if category:
        filtered = [q for q in filtered if q.get("category_id") == category]
    if q_type:
        filtered = [q for q in filtered if q.get("type") == q_type]
    if difficulty:
        filtered = [q for q in filtered if q.get("difficulty") == difficulty]
    if keyword:
        kw = keyword.lower()
        filtered = [q for q in filtered if kw in q.get("question", "").lower() or kw in q.get("answer", "").lower() or kw in " ".join(q.get("tags", []))]
    if wrong_only:
        filtered = [q for q in filtered if q.get("wrong_count", 0) > 0]
    if mastered_only:
        filtered = [q for q in filtered if q.get("mastered", False)]

    return jsonify(filtered)


@app.route("/api/questions", methods=["POST"])
def add_question():
    data = request.json
    with _data_lock:
        questions = load_questions()
        new_id = _next_int_id(questions)
        question = {
            "id": new_id,
            "question": data.get("question", ""),
            "type": data.get("type", "未知题型"),
            "options": data.get("options", []),
            "answer": data.get("answer", ""),
            "analysis": data.get("analysis", ""),
            "category_id": data.get("category_id") or "cat_1",
            "difficulty": data.get("difficulty", "medium"),
            "tags": data.get("tags", []),
            "source_image": data.get("source_image", ""),
            "wrong_count": 0,
            "mastered": False,
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }
        questions.append(question)
        save_questions(questions)
    return jsonify(question)


@app.route("/api/questions/<int:qid>", methods=["PUT"])
def update_question(qid):
    data = request.json
    with _data_lock:
        questions = load_questions()
        for q in questions:
            if q["id"] == qid:
                for key in ["question", "type", "options", "answer", "analysis", "category_id", "difficulty", "tags", "mastered"]:
                    if key in data:
                        q[key] = data[key]
                q["updated_at"] = datetime.now().isoformat()
                save_questions(questions)
                return jsonify(q)
    return jsonify({"error": "题目不存在"}), 404


@app.route("/api/questions/<int:qid>", methods=["DELETE"])
def delete_question(qid):
    with _data_lock:
        questions = load_questions()
        questions = [q for q in questions if q["id"] != qid]
        save_questions(questions)
        # 级联删除关联笔记，避免孤儿笔记残留
        notes = load_notes()
        notes = [n for n in notes if str(n.get("question_id", "")) != str(qid)]
        save_notes(notes)
    return jsonify({"ok": True})


@app.route("/api/questions/<int:qid>/wrong", methods=["POST"])
def mark_wrong(qid):
    with _data_lock:
        questions = load_questions()
        for q in questions:
            if q["id"] == qid:
                q["wrong_count"] = q.get("wrong_count", 0) + 1
                q["mastered"] = False
                q["updated_at"] = datetime.now().isoformat()
                save_questions(questions)
                return jsonify(q)
    return jsonify({"error": "题目不存在"}), 404


@app.route("/api/questions/<int:qid>/master", methods=["POST"])
def mark_mastered(qid):
    with _data_lock:
        questions = load_questions()
        for q in questions:
            if q["id"] == qid:
                q["mastered"] = True
                q["updated_at"] = datetime.now().isoformat()
                save_questions(questions)
                return jsonify(q)
    return jsonify({"error": "题目不存在"}), 404


@app.route("/api/questions/<int:qid>/answer", methods=["POST"])
def record_answer(qid):
    data = request.json or {}
    correct = bool(data.get("correct", False))
    with _data_lock:
        questions = load_questions()
        for q in questions:
            if q["id"] == qid:
                if not correct:
                    q["wrong_count"] = q.get("wrong_count", 0) + 1
                    q["mastered"] = False
                q["updated_at"] = datetime.now().isoformat()
                save_questions(questions)
                return jsonify({"ok": True, "wrong_count": q.get("wrong_count", 0), "mastered": q.get("mastered", False)})
    return jsonify({"error": "题目不存在"}), 404


@app.route("/api/stats")
def get_stats():
    questions = load_questions()
    notes = load_notes()
    total = len(questions)
    mastered = len([q for q in questions if q.get("mastered", False)])
    wrong = len([q for q in questions if q.get("wrong_count", 0) > 0 and not q.get("mastered", False)])
    unanswered = total - wrong - mastered
    types = {}
    for q in questions:
        t = q.get("type", "未知")
        types[t] = types.get(t, 0) + 1
    return jsonify({
        "total_questions": total,
        "wrong_questions": wrong,
        "mastered_questions": mastered,
        "unanswered": unanswered,
        "total_notes": len(notes),
        "types": types,
    })


# ---------- 分类 API ----------

@app.route("/api/categories")
def get_categories():
    return jsonify(load_categories())


@app.route("/api/categories", methods=["POST"])
def add_category():
    data = request.json
    with _data_lock:
        categories = load_categories()
        new_id = "cat_" + uuid.uuid4().hex[:8]
        cat = {
            "id": new_id,
            "name": data.get("name", "新分类"),
            "icon": data.get("icon", "📁"),
            "parent": data.get("parent", None),
            "sort": len(categories),
        }
        categories.append(cat)
        save_categories(categories)
    return jsonify(cat)


@app.route("/api/categories/<cat_id>", methods=["PUT"])
def update_category(cat_id):
    data = request.json
    with _data_lock:
        categories = load_categories()
        for c in categories:
            if c["id"] == cat_id:
                if "name" in data:
                    c["name"] = data["name"]
                if "icon" in data:
                    c["icon"] = data["icon"]
                if "parent" in data:
                    c["parent"] = data["parent"]
                save_categories(categories)
                return jsonify(c)
    return jsonify({"error": "分类不存在"}), 404


@app.route("/api/categories/<cat_id>", methods=["DELETE"])
def delete_category(cat_id):
    with _data_lock:
        categories = load_categories()
        categories = [c for c in categories if c["id"] != cat_id]
        questions = load_questions()
        for q in questions:
            if q.get("category_id") == cat_id:
                q["category_id"] = "cat_1"
        save_categories(categories)
        save_questions(questions)
    return jsonify({"ok": True})


# ---------- 笔记 API ----------

@app.route("/api/notes")
def get_notes():
    notes = load_notes()
    keyword = request.args.get("keyword", "")
    question_id = request.args.get("question_id")
    if question_id:
        notes = [n for n in notes if str(n.get("question_id")) == str(question_id)]
    if keyword:
        kw = keyword.lower()
        notes = [n for n in notes if kw in n.get("content", "").lower() or kw in " ".join(n.get("tags", []))]
    return jsonify(notes)


@app.route("/api/notes", methods=["POST"])
def add_note():
    data = request.json
    with _data_lock:
        notes = load_notes()
        new_id = _next_int_id(notes)
        note = {
            "id": new_id,
            "question_id": data.get("question_id"),
            "content": data.get("content", ""),
            "tags": data.get("tags", []),
            "created_at": datetime.now().isoformat(),
            "updated_at": datetime.now().isoformat(),
        }
        notes.append(note)
        save_notes(notes)
    return jsonify(note)


@app.route("/api/notes/<int:nid>", methods=["PUT"])
def update_note(nid):
    data = request.json
    with _data_lock:
        notes = load_notes()
        for n in notes:
            if n["id"] == nid:
                for key in ["content", "tags", "question_id"]:
                    if key in data:
                        n[key] = data[key]
                n["updated_at"] = datetime.now().isoformat()
                save_notes(notes)
                return jsonify(n)
    return jsonify({"error": "笔记不存在"}), 404


@app.route("/api/notes/<int:nid>", methods=["DELETE"])
def delete_note(nid):
    with _data_lock:
        notes = load_notes()
        notes = [n for n in notes if n["id"] != nid]
        save_notes(notes)
    return jsonify({"ok": True})


# ---------- 知识点 API ----------

KNOWLEDGE_FILE = BASE_DIR / "knowledge.json"


def load_knowledge():
    data = load_json(KNOWLEDGE_FILE, None)
    if data is None or not isinstance(data, list):
        data = []
        save_knowledge(data)
    return data


def save_knowledge(data):
    save_json(KNOWLEDGE_FILE, data)


@app.route("/api/knowledge")
def get_knowledge():
    return jsonify(load_knowledge())


@app.route("/api/knowledge", methods=["POST"])
def add_knowledge():
    data = request.json
    with _data_lock:
        knowledge = load_knowledge()
        new_id = _next_int_id(knowledge)
        item = {
            "id": new_id,
            "name": data.get("name", ""),
            "created_at": datetime.now().isoformat(),
        }
        knowledge.append(item)
        save_knowledge(knowledge)
    return jsonify(item)


@app.route("/api/knowledge/<int:kid>", methods=["DELETE"])
def delete_knowledge(kid):
    with _data_lock:
        knowledge = load_knowledge()
        knowledge = [k for k in knowledge if k["id"] != kid]
        save_knowledge(knowledge)
    return jsonify({"ok": True})


# ---------- 远端同步鉴权（修复问题2：设置Token后不再信任Origin/Referer） ----------

def _check_sync_token():
    cfg = load_config()
    token = cfg.get("remote_token", "")
    if not token:
        return True
    provided = request.headers.get("X-Sync-Token", "")
    if provided and hmac.compare_digest(provided, token):
        return True
    return False


# ---------- 数据备份/恢复（用于本地↔服务器同步） ----------

@app.route("/api/backup")
def export_backup():
    if not _check_sync_token():
        return _safe_error("鉴权失败：Token 不匹配"), 403

    questions = load_questions()
    categories = load_categories()
    notes = load_notes()
    knowledge = load_knowledge()

    upload_files = []
    if UPLOAD_DIR.exists():
        for f in UPLOAD_DIR.iterdir():
            if f.is_file():
                try:
                    with open(f, "rb") as fp:
                        upload_files.append({
                            "name": f.name,
                            "data": base64.b64encode(fp.read()).decode("ascii"),
                        })
                except Exception:
                    pass

    backup = {
        "version": 2,
        "exported_at": datetime.now().isoformat(),
        "questions": questions,
        "categories": categories,
        "notes": notes,
        "knowledge": knowledge,
        "uploads": upload_files,
    }
    return jsonify(backup)


@app.route("/api/backup", methods=["POST"])
def import_backup():
    if not _check_sync_token():
        return _safe_error("鉴权失败：Token 不匹配"), 403

    try:
        data = request.get_json(force=True)
    except Exception:
        return _safe_error("无效的 JSON 数据"), 400

    mode = data.get("mode", "merge")
    do_replace = (mode == "replace")

    with _data_lock:
        if "questions" in data:
            old_q = load_questions()
            new_q = merge_list(old_q, data["questions"], replace=do_replace)
            seen_ids = set()
            for q in new_q:
                qid = q.get("id")
                if qid is None or qid in seen_ids or not isinstance(qid, int):
                    q["id"] = _next_int_id([x for x in new_q if x is not q])
                seen_ids.add(q["id"])
            save_questions(new_q)

        if "categories" in data:
            save_categories(merge_list(load_categories(), data["categories"], replace=do_replace))
        if "notes" in data:
            save_notes(merge_list(load_notes(), data["notes"], replace=do_replace))
        if "knowledge" in data:
            save_knowledge(merge_list(load_knowledge(), data["knowledge"], replace=do_replace))

        if "uploads" in data and isinstance(data["uploads"], list):
            UPLOAD_DIR.mkdir(exist_ok=True)
            for uf in data["uploads"]:
                try:
                    fname = secure_filename(uf.get("name", ""))
                    if not fname:
                        continue
                    fpath = UPLOAD_DIR / fname
                    if fpath.exists() and not do_replace:
                        continue
                    with open(fpath, "wb") as fp:
                        fp.write(base64.b64decode(uf.get("data", "")))
                except Exception:
                    pass

    return jsonify({
        "ok": True,
        "mode": mode,
        "counts": {
            "questions": len(load_questions()),
            "categories": len(load_categories()),
            "notes": len(load_notes()),
            "knowledge": len(load_knowledge()),
        }
    })


# ---------- 远端同步 API ----------

@app.route("/api/sync/receive", methods=["POST", "OPTIONS"])
def sync_receive():
    if request.method == "OPTIONS":
        return ("", 200)
    if not _check_sync_token():
        return _safe_error("鉴权失败：Token 不匹配"), 403
    try:
        data = request.get_json(force=True)
    except Exception:
        return _safe_error("无效的 JSON 数据"), 400

    mode = data.get("mode", "replace")
    do_replace = (mode == "replace")

    with _data_lock:
        if "questions" in data:
            old_q = load_questions()
            new_q = merge_list(old_q, data["questions"], replace=do_replace)
            for q in new_q:
                qid = q.get("id")
                if qid is None or not isinstance(qid, int):
                    q["id"] = _next_int_id(new_q)
            save_questions(new_q)
        if "categories" in data:
            save_categories(merge_list(load_categories(), data["categories"], replace=do_replace))
        if "notes" in data:
            save_notes(merge_list(load_notes(), data["notes"], replace=do_replace))
        if "knowledge" in data:
            save_knowledge(merge_list(load_knowledge(), data["knowledge"], replace=do_replace))
        if "uploads" in data and isinstance(data["uploads"], list):
            UPLOAD_DIR.mkdir(exist_ok=True)
            for uf in data["uploads"]:
                try:
                    fname = secure_filename(uf.get("name", ""))
                    if not fname:
                        continue
                    fpath = UPLOAD_DIR / fname
                    if fpath.exists() and not do_replace:
                        continue
                    with open(fpath, "wb") as fp:
                        fp.write(base64.b64decode(uf.get("data", "")))
                except Exception:
                    pass

    return jsonify({
        "ok": True,
        "mode": mode,
        "counts": {
            "questions": len(load_questions()),
            "notes": len(load_notes()),
            "knowledge": len(load_knowledge()),
        }
    })


@app.route("/api/sync/push", methods=["POST"])
def sync_push():
    cfg = load_config()
    remote_url = (cfg.get("remote_url") or "").rstrip("/")
    if not remote_url:
        return jsonify({"ok": False, "error": "未配置远端服务器地址，请先在设置中填写"}), 400

    mode = (request.get_json(silent=True) or {}).get("mode", "replace")
    token = cfg.get("remote_token", "")

    questions = load_questions()
    categories = load_categories()
    notes = load_notes()
    knowledge = load_knowledge()
    upload_files = []
    if UPLOAD_DIR.exists():
        for f in UPLOAD_DIR.iterdir():
            if f.is_file():
                try:
                    with open(f, "rb") as fp:
                        upload_files.append({
                            "name": f.name,
                            "data": base64.b64encode(fp.read()).decode("ascii"),
                        })
                except Exception:
                    pass

    payload = {
        "version": 2,
        "mode": mode,
        "questions": questions,
        "categories": categories,
        "notes": notes,
        "knowledge": knowledge,
        "uploads": upload_files,
    }
    data_bytes = json.dumps(payload, ensure_ascii=False).encode("utf-8")

    skip_ssl = bool(cfg.get("skip_ssl_verify", False))
    ctx = None
    if skip_ssl:
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(
        remote_url + "/api/sync/receive",
        data=data_bytes,
        headers={
            "Content-Type": "application/json",
            "X-Sync-Token": token,
        },
        method="POST",
    )
    try:
        kwargs = {"timeout": 60}
        if ctx is not None:
            kwargs["context"] = ctx
        with urllib.request.urlopen(req, **kwargs) as resp:
            body = resp.read().decode("utf-8")
            return jsonify(json.loads(body))
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            err = json.loads(body)
            return jsonify({"ok": False, "error": err.get("error", f"HTTP {e.code}")}), e.code
        except Exception:
            return _safe_error(f"HTTP {e.code}", body[:200] if DEBUG_MODE else None, e.code)
    except Exception as e:
        return _safe_error("连接失败", str(e) if DEBUG_MODE else None, 502)


@app.route("/api/sync/pull", methods=["POST"])
def sync_pull():
    cfg = load_config()
    remote_url = (cfg.get("remote_url") or "").rstrip("/")
    if not remote_url:
        return jsonify({"ok": False, "error": "未配置远端服务器地址"}), 400

    mode = (request.get_json(silent=True) or {}).get("mode", "replace")
    token = cfg.get("remote_token", "")

    skip_ssl = bool(cfg.get("skip_ssl_verify", False))
    ctx = None
    if skip_ssl:
        import ssl
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

    req = urllib.request.Request(
        remote_url + "/api/backup",
        headers={"X-Sync-Token": token},
        method="GET",
    )
    try:
        kwargs = {"timeout": 60}
        if ctx is not None:
            kwargs["context"] = ctx
        with urllib.request.urlopen(req, **kwargs) as resp:
            body = resp.read().decode("utf-8")
            data = json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="replace")
        try:
            err = json.loads(body)
            return jsonify({"ok": False, "error": err.get("error", f"HTTP {e.code}")}), e.code
        except Exception:
            return _safe_error(f"HTTP {e.code}", body[:200] if DEBUG_MODE else None, e.code)
    except Exception as e:
        return _safe_error("连接失败", str(e) if DEBUG_MODE else None, 502)

    do_replace = (mode == "replace")
    with _data_lock:
        if "questions" in data:
            old_q = load_questions()
            new_q = merge_list(old_q, data["questions"], replace=do_replace)
            for q in new_q:
                qid = q.get("id")
                if qid is None or not isinstance(qid, int):
                    q["id"] = _next_int_id(new_q)
            save_questions(new_q)
        if "categories" in data:
            save_categories(merge_list(load_categories(), data["categories"], replace=do_replace))
        if "notes" in data:
            save_notes(merge_list(load_notes(), data["notes"], replace=do_replace))
        if "knowledge" in data:
            save_knowledge(merge_list(load_knowledge(), data["knowledge"], replace=do_replace))
        if "uploads" in data and isinstance(data["uploads"], list):
            UPLOAD_DIR.mkdir(exist_ok=True)
            for uf in data["uploads"]:
                try:
                    fname = secure_filename(uf.get("name", ""))
                    if not fname:
                        continue
                    fpath = UPLOAD_DIR / fname
                    if fpath.exists() and not do_replace:
                        continue
                    with open(fpath, "wb") as fp:
                        fp.write(base64.b64decode(uf.get("data", "")))
                except Exception:
                    pass

    return jsonify({
        "ok": True,
        "mode": mode,
        "counts": {
            "questions": len(load_questions()),
            "notes": len(load_notes()),
            "knowledge": len(load_knowledge()),
        }
    })


# ---------- 图片上传（修复问题6：白名单校验） ----------

def _validate_image(file_stream):
    header = file_stream.read(16)
    file_stream.seek(0)
    for magic, ext in ALLOWED_IMAGE_MAGIC.items():
        if header.startswith(magic):
            if ext == "webp" and header[8:12] != b"WEBP":
                continue
            return ext
    return None


@app.route("/api/upload", methods=["POST"])
def upload_image():
    if "file" not in request.files:
        return jsonify({"error": "没有文件"}), 400
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "文件名为空"}), 400

    ext_from_name = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if ext_from_name not in ALLOWED_IMAGE_EXTENSIONS:
        return jsonify({"error": "只允许上传图片文件（jpg/png/gif/webp/bmp）"}), 400

    detected_ext = _validate_image(file.stream)
    if detected_ext is None:
        return jsonify({"error": "文件内容不是有效的图片"}), 400

    filename = f"{uuid.uuid4().hex[:12]}.{detected_ext}"
    filepath = UPLOAD_DIR / filename
    file.save(str(filepath))
    return jsonify({"filename": filename, "url": f"/api/upload/{filename}"})


@app.route("/api/upload/<filename>")
def serve_upload(filename):
    safe_name = secure_filename(filename)
    if safe_name != filename:
        abort(404)
    return send_from_directory(str(UPLOAD_DIR), filename)


# ---------- AI 拍照识别 ----------

@app.route("/api/ocr", methods=["POST"])
def ocr_question():
    data = request.json
    image_data = data.get("image", "")
    image_url = data.get("image_url", "")
    subject = data.get("subject", "通用")

    if not image_data and not image_url:
        return jsonify({"error": "请提供图片"}), 400

    if image_data:
        if image_data.startswith("data:"):
            image_content = {"type": "image_url", "image_url": {"url": image_data}}
        else:
            image_content = {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_data}"}}
    else:
        image_content = {"type": "image_url", "image_url": {"url": image_url}}

    prompt = f"""你是一位{subject}学科的资深教师。请仔细识别这张图片中的题目，将其转化为结构化的文本格式。

要求：
1. 准确识别题目文本（包括数学公式用文字描述）
2. 如果有选项，列出所有选项
3. 识别题目类型（单选题/多选题/判断题/填空题/计算题/主观题）
4. 如果能判断答案，给出答案
5. 提取关键标签（知识点）

请严格按以下JSON格式返回，不要包含其他文字：
```json
{{
  "question": "题目文本",
  "type": "单选题",
  "options": [
    {{"letter": "A", "text": "选项内容"}},
    {{"letter": "B", "text": "选项内容"}},
    {{"letter": "C", "text": "选项内容"}},
    {{"letter": "D", "text": "选项内容"}}
  ],
  "answer": "C",
  "tags": ["知识点1", "知识点2"],
  "difficulty": "medium"
}}
```
如果没有选项（填空题/计算题等），options为空数组，answer为答案文本。
difficulty取值：easy / medium / hard
如果无法确定答案，answer留空。"""

    ai_client = require_ai()
    if ai_client is None:
        return jsonify({"error": "请先配置 API Key"}), 403

    try:
        resp = ai_client.chat.completions.create(
            model=get_vision_model(),
            messages=[
                {"role": "user", "content": [
                    image_content,
                    {"type": "text", "text": prompt}
                ]}
            ],
            temperature=0.1,
            max_tokens=2000,
        )
        text = resp.choices[0].message.content.strip()
        match = re.search(r"```json\s*([\s\S]*?)```", text)
        if match:
            result = json.loads(match.group(1))
        else:
            result = json.loads(text)
        return jsonify(result)
    except json.JSONDecodeError:
        return _safe_error("AI返回格式异常", text[:500] if DEBUG_MODE else None, 500)
    except Exception as e:
        return _safe_error("AI识别失败", str(e) if DEBUG_MODE else None, 500)


# ---------- AI 解答 ----------

@app.route("/api/ai/solve", methods=["POST"])
def ai_solve():
    data = request.json
    question_text = data.get("question", "")
    q_type = data.get("type", "")
    options = data.get("options", [])
    image_url = data.get("image_url", "")
    detail_level = data.get("detail_level", "detailed")

    opt_text = ""
    if options:
        opt_text = "\n".join([f"{o.get('letter', '')}. {o.get('text', '')}" for o in options])

    level_hint = "请给出简洁的解题思路和答案。" if detail_level == "brief" else "请给出详细的解题步骤、知识点分析和易错点提醒。"

    messages = []
    if image_url:
        messages.append({
            "role": "user",
            "content": [
                {"type": "image_url", "image_url": {"url": image_url}},
                {"type": "text", "text": f"请解答这道题目。\n\n{level_hint}"}
            ]
        })
    else:
        prompt = f"""你是一位耐心细致的学科教师，正在帮助学生解答题目。

题型：{q_type}
题目：{question_text}
{f'选项：{opt_text}' if opt_text else ''}

{level_hint}

请按以下格式回答：
## 解题思路
（思路分析）

## 详细解答
（逐步解答过程）

## 知识点总结
（涉及的知识点）

## 易错提醒
（容易出错的地方）"""
        messages = [{"role": "user", "content": prompt}]

    ai_client = require_ai()
    if ai_client is None:
        return jsonify({"error": "请先配置 API Key"}), 403

    try:
        model = get_vision_model() if image_url else get_text_model()
        resp = ai_client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=0.3,
            max_tokens=3000,
        )
        return jsonify({"answer": resp.choices[0].message.content})
    except Exception as e:
        return _safe_error("AI解答失败", str(e) if DEBUG_MODE else None, 500)


# ---------- AI 举一反三 ----------

@app.route("/api/ai/similar", methods=["POST"])
def ai_similar():
    data = request.json
    question_text = data.get("question", "")
    q_type = data.get("type", "单选题")
    options = data.get("options", [])
    tags = data.get("tags", [])
    count = min(data.get("count", 3), 5)

    opt_text = ""
    if options:
        opt_text = "\n".join([f"{o.get('letter', '')}. {o.get('text', '')}" for o in options])

    prompt = f"""你是一位资深的学科教师。请根据以下题目，生成 {count} 道相似的练习题，用于举一反三训练。

原题：
题型：{q_type}
题目：{question_text}
{f'选项：{opt_text}' if opt_text else ''}
知识点标签：{"、".join(tags) if tags else "未标注"}

要求：
1. 题型与原题一致
2. 考察相同的知识点，但换个角度或情境
3. 难度与原题相当或略有变化
4. 如果是选择题，每个选项都要合理，干扰项要有迷惑性
5. 给出每题的正确答案和简要解析

请严格按以下JSON格式返回，不要包含其他文字：
```json
[
  {{
    "question": "相似题目文本",
    "type": "{q_type}",
    "options": [
      {{"letter": "A", "text": "选项内容"}},
      {{"letter": "B", "text": "选项内容"}},
      {{"letter": "C", "text": "选项内容"}},
      {{"letter": "D", "text": "选项内容"}}
    ],
    "answer": "B",
    "analysis": "简要解析",
    "difficulty": "medium"
  }}
]
```"""

    ai_client = require_ai()
    if ai_client is None:
        return jsonify({"error": "请先配置 API Key"}), 403

    try:
        resp = ai_client.chat.completions.create(
            model=get_text_model(),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
            max_tokens=4000,
        )
        text = resp.choices[0].message.content.strip()
        match = re.search(r"```json\s*([\s\S]*?)```", text)
        if match:
            result = json.loads(match.group(1))
        else:
            result = json.loads(text)
        return jsonify(result)
    except json.JSONDecodeError:
        return _safe_error("AI返回格式异常", text[:500] if DEBUG_MODE else None, 500)
    except Exception as e:
        return _safe_error("AI生成失败", str(e) if DEBUG_MODE else None, 500)


# ---------- AI 生成分类建议 ----------

@app.route("/api/ai/categorize", methods=["POST"])
def ai_categorize():
    data = request.json
    question_text = data.get("question", "")
    categories = load_categories()
    cat_list = [f"{c['name']}" for c in categories]

    prompt = f"""你是一位学科分类专家。请根据以下题目内容，推荐最合适的分类。

题目：{question_text}

现有分类：{"、".join(cat_list) if cat_list else "暂无分类"}

请返回JSON格式：
```json
{{
  "suggested_category": "推荐的分类名",
  "suggested_tags": ["标签1", "标签2", "标签3"],
  "difficulty": "easy/medium/hard"
}}
```"""

    ai_client = require_ai()
    if ai_client is None:
        return jsonify({"error": "请先配置 API Key"}), 403

    try:
        resp = ai_client.chat.completions.create(
            model=get_text_model(),
            messages=[{"role": "user", "content": prompt}],
            temperature=0.2,
            max_tokens=500,
        )
        text = resp.choices[0].message.content.strip()
        match = re.search(r"```json\s*([\s\S]*?)```", text)
        if match:
            result = json.loads(match.group(1))
        else:
            result = json.loads(text)
        return jsonify(result)
    except Exception as e:
        return _safe_error("AI分类失败", str(e) if DEBUG_MODE else None, 500)


# ========== 通用文本导入 ==========

IMPORT_PROMPT = """你是一个专业的题库解析助手。请将以下纯文本内容解析为结构化题目。

规则：
1. 自动识别题型：单选题、多选题、判断题、填空题、计算题、主观题
2. 自动判断学科/科目，填入 tags 标签
3. 提取每道题的：题目文本、选项（如有）、正确答案
4. 判断题的答案必须是"对"或"错"
5. 多选题答案如"ABD"，按字母排序
6. 填空题和计算题如果没有选项，options 留空数组
7. 如果文本中有多道题，全部提取
8. 如果某道题无法识别答案，answer 留空字符串
9. 不要遗漏任何一道题

请严格返回JSON数组，每个元素格式：
{
  "question": "题目文本",
  "type": "题型",
  "options": [{"letter": "A", "text": "选项文字"}, ...],
  "answer": "正确答案",
  "tags": ["学科/知识点标签"],
  "difficulty": "easy/medium/hard"
}

只返回JSON数组，不要任何其他文字。"""


@app.route("/api/import_text", methods=["POST"])
def import_text():
    data = request.json
    raw_text = data.get("text", "").strip()
    if not raw_text:
        return jsonify({"error": "没有提供文本内容"}), 400

    ai_client = require_ai()
    if ai_client is None:
        return jsonify({"error": "请先配置 API Key"}), 403

    if len(raw_text) > 50000:
        raw_text = raw_text[:50000]

    try:
        resp = ai_client.chat.completions.create(
            model=get_text_model(),
            messages=[
                {"role": "system", "content": IMPORT_PROMPT},
                {"role": "user", "content": raw_text},
            ],
            max_tokens=4000,
            temperature=0.1,
        )
        result_text = resp.choices[0].message.content
        clean = result_text.strip()
        clean = re.sub(r'^```(?:json)?\s*\n?', '', clean)
        clean = re.sub(r'\n?```\s*$', '', clean)
        clean = clean.strip()

        imported = json.loads(clean)
        if not isinstance(imported, list):
            return jsonify({"error": "AI 返回格式错误"}), 500

        with _data_lock:
            questions = load_questions()
            existing_max_id = _next_int_id(questions) - 1

            new_questions = []
            for item in imported:
                if not isinstance(item, dict) or not item.get("question"):
                    continue

                normalized_options = []
                raw_options = item.get("options", [])
                if isinstance(raw_options, list):
                    for opt in raw_options:
                        if isinstance(opt, dict):
                            letter = opt.get("letter", "")
                            text = opt.get("text", "")
                            if not letter and not text:
                                continue
                            if not letter and len(text) <= 2:
                                letter = text
                                text = ""
                            normalized_options.append({"letter": letter, "text": text})
                        elif isinstance(opt, str):
                            m = re.match(r'^([A-Za-z])[\.\、\s]\s*(.*)$', opt)
                            if m:
                                normalized_options.append({"letter": m.group(1).upper(), "text": m.group(2)})
                            else:
                                normalized_options.append({"letter": "", "text": opt})
                elif isinstance(raw_options, dict):
                    for k, v in raw_options.items():
                        normalized_options.append({"letter": str(k).upper(), "text": str(v)})

                answer = str(item.get("answer", "")).strip()
                if item.get("type") == "判断题":
                    if answer in ("正确", "是", "√", "T", "True", "true", "对"):
                        answer = "对"
                    elif answer in ("错误", "否", "×", "F", "False", "false", "错"):
                        answer = "错"

                q = {
                    "id": existing_max_id + len(new_questions) + 1,
                    "question": item.get("question", ""),
                    "type": item.get("type", "未知题型"),
                    "options": normalized_options,
                    "answer": answer,
                    "analysis": "",
                    "category_id": "cat_1",
                    "difficulty": item.get("difficulty", "medium"),
                    "tags": item.get("tags", []),
                    "source_image": "",
                    "wrong_count": 0,
                    "mastered": False,
                    "created_at": datetime.now().isoformat(),
                    "updated_at": datetime.now().isoformat(),
                }
                new_questions.append(q)

            questions.extend(new_questions)
            save_questions(questions)

        return jsonify({
            "ok": True,
            "imported": len(new_questions),
            "total": len(questions),
            "questions": new_questions,
        })

    except json.JSONDecodeError as e:
        return _safe_error("AI 返回的 JSON 解析失败", str(e) if DEBUG_MODE else None, 500)
    except Exception as e:
        return _safe_error("AI导入失败", str(e) if DEBUG_MODE else None, 500)


@app.route("/api/import_text_direct", methods=["POST"])
def import_text_direct():
    data = request.json or {}
    raw_text = (data.get("text") or "").strip()
    category_id = (data.get("category_id") or "cat_1").strip()
    if not raw_text:
        return jsonify({"error": "没有提供文本内容"}), 400

    with _data_lock:
        questions = load_questions()
        existing_max_id = _next_int_id(questions) - 1
        new_questions = []

        def normalize_answer(ans, qtype):
            ans = ans.strip().rstrip("。.")
            if qtype == "判断题":
                if ans in ("正确", "是", "√", "T", "True", "true", "对", "✓", "Y"):
                    return "对"
                if ans in ("错误", "否", "×", "F", "False", "false", "错", "✗", "N"):
                    return "错"
                return ans
            ans = re.sub(r"[、,\s，]+", "", ans).upper()
            return ans

        def parse_options_from_line(line):
            opts = []
            pattern = re.compile(r'([A-Ha-h])[\.、\．\)\]\s:：]+(.*?)(?=\s+[A-Ha-h][\.、\．\)\]\s:：]|$)')
            for m in pattern.finditer(line):
                letter = m.group(1).upper()
                text = m.group(2).strip()
                if text:
                    opts.append({"letter": letter, "text": text})
            return opts

        def split_questions(text):
            lines = text.split("\n")
            blocks = []
            current = []
            for line in lines:
                stripped = line.strip()
                if not stripped:
                    if current:
                        current.append("")
                    continue
                if re.match(r"^(\d+)[\.、\．\)\]]\s", stripped) or re.match(r"^\(\d+\)\s", stripped):
                    if current:
                        blocks.append("\n".join(current).strip())
                    current = [stripped]
                else:
                    current.append(stripped)
            if current:
                blocks.append("\n".join(current).strip())
            return blocks

        blocks = split_questions(raw_text)

        for block in blocks:
            lines = [l.strip() for l in block.split("\n") if l.strip()]
            if not lines:
                continue

            answer = ""
            answer_idx = -1
            answer_match = re.compile(r"^(?:'|\"|)?\s*(?:答案|解答|Answer|answer|ans|Ans)\s*[:：]\s*(.+?)\s*$")
            tail_ans_match = re.compile(r"[（\(]\s*([A-Ha-h对对错错正确错误是否√×✓✗]{1,4})\s*[）\)]\s*$")

            for i, line in enumerate(lines):
                m = answer_match.match(line)
                if m:
                    answer = m.group(1).strip()
                    answer_idx = i
                    break
                if i == 0:
                    tm = tail_ans_match.search(line)
                    if tm:
                        answer = tm.group(1)

            if answer_idx >= 0:
                lines = lines[:answer_idx] + lines[answer_idx+1:]
            elif answer:
                lines[0] = tail_ans_match.sub("", lines[0]).strip()

            qline = lines[0] if lines else ""
            qline = re.sub(r"^(\d+)[\.、\．\)\]]\s*", "", qline)
            qline = re.sub(r"^\(\d+\)\s*", "", qline)
            qline = qline.strip()
            if not qline:
                continue

            option_lines = []
            content_lines = []
            for line in lines[1:]:
                if re.match(r"^[A-Ha-h][\.、\．\)\]\s:：]", line):
                    option_lines.append(line)
                else:
                    content_lines.append(line)

            options_source = " ".join(option_lines) if option_lines else " ".join(lines[1:])
            opts = parse_options_from_line(options_source)

            if not opts and len(option_lines) >= 2:
                opts = []
                for ol in option_lines:
                    m = re.match(r"^([A-Ha-h])[\.、\．\)\]\s:：]+(.*)$", ol)
                    if m:
                        opts.append({"letter": m.group(1).upper(), "text": m.group(2).strip()})

            qtype = "未知题型"
            if not opts and answer in ("对", "错"):
                qtype = "判断题"
            elif opts:
                if len(opts) == 2 and set(o["letter"] for o in opts) <= {"A", "B"}:
                    if re.search(r"[是对错]|正确|错误", qline) and answer in ("对", "错", "A", "B"):
                        qtype = "判断题"
                        if answer == "A" and opts[0]["letter"] == "A":
                            t = opts[0]["text"]
                            if re.search(r"对|正确|是|√", t):
                                answer = "对"
                            elif re.search(r"错|错误|否|×", t):
                                answer = "错"
                        elif answer == "B" and opts[1]["letter"] == "B":
                            t = opts[1]["text"]
                            if re.search(r"对|正确|是|√", t):
                                answer = "对"
                            elif re.search(r"错|错误|否|×", t):
                                answer = "错"
                        opts = []
                    else:
                        qtype = "单选题"
                else:
                    if len(re.sub(r"[、,\s，]", "", answer)) > 1 and answer not in ("对", "错"):
                        qtype = "多选题"
                    else:
                        qtype = "单选题"
            elif answer:
                qtype = "简答题"

            if qtype == "判断题":
                answer = normalize_answer(answer, "判断题")
            elif qtype in ("单选题", "多选题"):
                answer = normalize_answer(answer, qtype)

            analysis = ""
            for cl in content_lines:
                am = re.match(r"^(?:解析|分析|解答|详解)[:：]\s*(.*)$", cl)
                if am:
                    analysis = am.group(1).strip()

            q = {
                "id": existing_max_id + len(new_questions) + 1,
                "question": qline,
                "type": qtype,
                "options": opts,
                "answer": answer,
                "analysis": analysis,
                "category_id": category_id,
                "difficulty": "medium",
                "tags": [],
                "source_image": "",
                "wrong_count": 0,
                "mastered": False,
                "created_at": datetime.now().isoformat(),
                "updated_at": datetime.now().isoformat(),
            }
            new_questions.append(q)

        questions.extend(new_questions)
        save_questions(questions)

    return jsonify({
        "ok": True,
        "imported": len(new_questions),
        "total": len(questions),
        "questions": new_questions,
    })


# ========== 批量知识点目录 ==========

BATCH_CATALOG_PROMPT = """你是一个学科知识体系分析专家。我会给你一批题目，请你：

1. 判断这些题目属于什么学科
2. 分析每道题考查的核心知识点
3. 将知识点归纳为层次化的知识目录

请严格返回JSON对象，格式：
{
  "subject": "学科名称",
  "catalog": [
    {
      "chapter": "章节名/大知识点",
      "knowledge_points": [
        {
          "name": "具体知识点名称",
          "question_ids": [题目序号列表],
          "brief": "一句话说明这个知识点考什么"
        }
      ]
    }
  ],
  "question_tags": {
    "1": ["知识点标签1", "知识点标签2"],
    "2": ["知识点标签1"]
  }
}

question_tags 的 key 是题目序号（字符串），value 是该题的知识点标签数组。
只返回JSON对象，不要任何其他文字。"""


@app.route("/api/batch_catalog_stream", methods=["POST"])
def batch_catalog_stream():
    from flask import Response, stream_with_context

    ai_client = require_ai()
    if ai_client is None:
        def err_gen():
            yield f"data: {json.dumps({'event': 'fatal_error', 'error': '请先配置 API Key'})}\n\n"
        return Response(
            stream_with_context(err_gen()),
            mimetype="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    questions = load_questions()
    if not questions:
        def err_gen():
            yield f"data: {json.dumps({'event': 'fatal_error', 'error': '题库为空'})}\n\n"
        return Response(
            stream_with_context(err_gen()),
            mimetype="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    batch_size = 15
    all_question_tags = {}
    subject = ""
    catalog = []
    total = len(questions)

    def generate():
        nonlocal subject, catalog, all_question_tags
        processed = 0
        total_batches = (total + batch_size - 1) // batch_size

        for batch_idx in range(0, total, batch_size):
            batch = questions[batch_idx:batch_idx + batch_size]
            lines = []
            for q in batch:
                opt_str = ""
                if q.get("options"):
                    opt_str = " | ".join(
                        f"{o.get('letter', '')}. {o.get('text', '')}" for o in q["options"] if o.get("text")
                    )
                line = f"[{q['id']}]({q.get('type', '')}) {q.get('question', '')}"
                if opt_str:
                    line += f"\n选项: {opt_str}"
                if q.get("answer"):
                    line += f"\n答案: {q['answer']}"
                if q.get("tags"):
                    line += f"\n已有标签: {', '.join(q['tags'])}"
                lines.append(line)

            user_content = "\n\n".join(lines)
            batch_num = batch_idx // batch_size + 1

            yield f"data: {json.dumps({'event': 'progress', 'processed': processed, 'total': total, 'batch': batch_num, 'total_batches': total_batches})}\n\n"

            try:
                resp = ai_client.chat.completions.create(
                    model=get_text_model(),
                    messages=[
                        {"role": "system", "content": BATCH_CATALOG_PROMPT},
                        {"role": "user", "content": user_content},
                    ],
                    max_tokens=4000,
                    temperature=0.2,
                )
                result_text = resp.choices[0].message.content
                clean = result_text.strip()
                clean = re.sub(r'^```(?:json)?\s*\n?', '', clean)
                clean = re.sub(r'\n?```\s*$', '', clean)
                clean = clean.strip()

                result = json.loads(clean)

                if not subject and result.get("subject"):
                    subject = result["subject"]

                if result.get("catalog"):
                    for ch in result["catalog"]:
                        existing_ch = next((c for c in catalog if c["chapter"] == ch["chapter"]), None)
                        if existing_ch:
                            for kp in ch.get("knowledge_points", []):
                                existing_kp = next(
                                    (k for k in existing_ch["knowledge_points"] if k["name"] == kp["name"]),
                                    None,
                                )
                                if existing_kp:
                                    seen_ids = set(existing_kp.get("question_ids", []))
                                    for qid in kp.get("question_ids", []):
                                        if qid not in seen_ids:
                                            existing_kp["question_ids"].append(qid)
                                            seen_ids.add(qid)
                                else:
                                    kp["question_ids"] = list(set(kp.get("question_ids", [])))
                                    existing_ch["knowledge_points"].append(kp)
                        else:
                            for kp in ch.get("knowledge_points", []):
                                kp["question_ids"] = list(set(kp.get("question_ids", [])))
                            catalog.append(ch)

                if result.get("question_tags"):
                    all_question_tags.update(result["question_tags"])

                yield f"data: {json.dumps({'event': 'batch_done', 'batch': batch_num, 'kp_count': sum(len(c.get('knowledge_points',[])) for c in catalog)})}\n\n"

            except Exception as e:
                err_msg = str(e) if DEBUG_MODE else "AI处理出错"
                yield f"data: {json.dumps({'event': 'batch_error', 'batch': batch_num, 'error': err_msg})}\n\n"

            processed += len(batch)

        with _data_lock:
            q_list = load_questions()
            for q in q_list:
                qid = str(q["id"])
                if qid in all_question_tags:
                    existing_tags = set(q.get("tags", []))
                    new_tags = all_question_tags[qid]
                    if isinstance(new_tags, list):
                        existing_tags.update(new_tags)
                    q["tags"] = list(existing_tags)
                    q["updated_at"] = datetime.now().isoformat()
            save_questions(q_list)

        for ch in catalog:
            for kp in ch.get("knowledge_points", []):
                kp["question_ids"] = sorted(set(kp.get("question_ids", [])))

        yield f"data: {json.dumps({'event': 'done', 'subject': subject, 'catalog': catalog, 'total': total})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


if __name__ == "__main__":
    cfg = load_config()
    port = int(sys.argv[1]) if len(sys.argv) > 1 else int(cfg.get("port", 5000))

    def is_port_available(p):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("0.0.0.0", p))
                return True
            except OSError:
                return False

    while not is_port_available(port):
        print(f"⚠️  端口 {port} 已被占用，尝试端口 {port + 1}...")
        port += 1

    url = f"http://localhost:{port}"

    def open_browser():
        time.sleep(1.2)
        try:
            webbrowser.open(url)
        except Exception:
            pass

    print(f"\n🚀 智能错题本启动中...")
    print(f"📍 访问地址: {url}")
    print(f"💾 数据目录: {BASE_DIR}")
    print(f"⏹️  按 Ctrl+C 停止服务\n")
    if DEBUG_MODE:
        print("⚠️  调试模式已开启：错误信息将包含详细堆栈\n")

    threading.Thread(target=open_browser, daemon=True).start()

    debug_mode = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(debug=debug_mode, host="0.0.0.0", port=port, use_reloader=False)
