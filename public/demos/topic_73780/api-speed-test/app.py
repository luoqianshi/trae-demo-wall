"""
Flask 后端 — API 模型测速台
- 提供静态文件服务
- 转发 /api/chat 请求到目标 API，解决 CORS 问题
- URL 由前端拼接后传入，后端直接使用
- SQLite 持久化历史记录
"""

import json
import urllib.request
import urllib.error
import ssl
import os
import sqlite3
import threading

from flask import Flask, request, Response, send_from_directory, jsonify

app = Flask(__name__, static_folder=None)

STATIC_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(STATIC_DIR, "history.db")
_LOCK = threading.Lock()

# 全局开关：True 时 /api/history 读写 seed_history 表，False 时读写 history 表
# 可通过 POST /api/seed_mode 动态切换
SEED_MODE = False


# ============ 数据库初始化 ============


def _create_history_table(conn: sqlite3.Connection, table_name: str):
    """创建历史记录表（通用，用于 history 和 seed_history）"""
    conn.execute(
        f"""
        CREATE TABLE IF NOT EXISTS {table_name} (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp   REAL    NOT NULL,
            model       TEXT    NOT NULL,
            base_url    TEXT    NOT NULL,
            api_path    TEXT    NOT NULL DEFAULT '/chat/completions',
            api_key     TEXT    NOT NULL DEFAULT '',
            prompt      TEXT    NOT NULL,
            ttft        REAL,
            tps         REAL,
            total_time  REAL,
            avg_tokens  REAL,
            success_rate REAL,
            error_dist  TEXT
        )
    """
    )
    # 迁移：为已有表添加 api_key 列（若不存在）
    try:
        conn.execute(
            f"ALTER TABLE {table_name} ADD COLUMN api_key TEXT NOT NULL DEFAULT ''"
        )
    except Exception:
        pass  # 列已存在


def init_db():
    with _LOCK:
        conn = sqlite3.connect(DB_PATH)
        _create_history_table(conn, "history")
        _create_history_table(conn, "seed_history")
        conn.commit()
        conn.close()
    # 清空 seed_history 表并重新插入模拟数据，保证每次启动数据一致
    _reseed()


def _reseed():
    """清空 seed_history 表并重新插入模拟数据"""
    conn = sqlite3.connect(DB_PATH)
    conn.execute("DELETE FROM seed_history")
    conn.commit()
    conn.close()
    from seed_data import seed
    seed()


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


# ============ 历史记录 API ============


def _history_table() -> str:
    """根据 SEED_MODE 返回当前使用的表名"""
    return "seed_history" if SEED_MODE else "history"


@app.route("/api/seed_mode", methods=["GET", "POST"])
def handle_seed_mode():
    """获取或切换模拟数据模式"""
    if request.method == "POST":
        global SEED_MODE
        data = request.get_json(silent=True) or {}
        if "seed_mode" in data:
            SEED_MODE = bool(data["seed_mode"])
        else:
            SEED_MODE = not SEED_MODE
        return {"seed_mode": SEED_MODE}
    return {"seed_mode": SEED_MODE}


@app.route("/api/history", methods=["GET"])
def list_history():
    limit = request.args.get("limit", 50, type=int)
    model = request.args.get("model", "")
    base_url = request.args.get("base_url", "")
    start = request.args.get("start", type=float)
    end = request.args.get("end", type=float)
    table = _history_table()

    query = f"SELECT * FROM {table} WHERE 1=1"
    params = []

    if model:
        query += " AND model LIKE ?"
        params.append(f"%{model}%")
    if base_url:
        query += " AND base_url LIKE ?"
        params.append(f"%{base_url}%")
    if start is not None:
        query += " AND timestamp >= ?"
        params.append(start)
    if end is not None:
        query += " AND timestamp <= ?"
        params.append(end)

    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)

    conn = get_db()
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/history/<int:record_id>", methods=["GET"])
def get_history(record_id):
    table = _history_table()
    conn = get_db()
    row = conn.execute(f"SELECT * FROM {table} WHERE id = ?", (record_id,)).fetchone()
    conn.close()
    if row is None:
        return {"error": "Record not found"}, 404
    # 不返回 api_key 到列表查询，但单条查询返回完整信息
    return jsonify(dict(row))


@app.route("/api/history", methods=["POST"])
def save_history():
    data = request.get_json(silent=True)
    if not data:
        return {"error": "Invalid JSON body"}, 400
    table = _history_table()

    with _LOCK:
        conn = get_db()
        model = data.get("model", "")
        base_url = data.get("baseUrl", "")
        # 对同一 model+base_url 只保留最新一条
        conn.execute(
            f"DELETE FROM {table} WHERE model = ? AND base_url = ?",
            (model, base_url),
        )
        conn.execute(
            f"""INSERT INTO {table}
               (timestamp, model, base_url, api_path, api_key, prompt,
                ttft, tps, total_time, avg_tokens, success_rate, error_dist)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                data.get("timestamp", 0),
                model,
                base_url,
                data.get("apiPath", "/chat/completions"),
                data.get("apiKey", ""),
                data.get("prompt", ""),
                data.get("ttft"),
                data.get("tps"),
                data.get("totalTime"),
                data.get("avgTokens"),
                data.get("successRate"),
                json.dumps(data.get("errorDist", {}), ensure_ascii=False),
            ),
        )
        conn.commit()
        row_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.close()
    return {"id": row_id}, 201


@app.route("/api/history", methods=["DELETE"])
def delete_history():
    """按筛选条件删除历史记录（与 GET 使用相同的筛选参数）"""
    model = request.args.get("model", "")
    base_url = request.args.get("base_url", "")
    start = request.args.get("start", type=float)
    end = request.args.get("end", type=float)
    table = _history_table()

    query = f"DELETE FROM {table} WHERE 1=1"
    params = []

    if model:
        query += " AND model LIKE ?"
        params.append(f"%{model}%")
    if base_url:
        query += " AND base_url LIKE ?"
        params.append(f"%{base_url}%")
    if start is not None:
        query += " AND timestamp >= ?"
        params.append(start)
    if end is not None:
        query += " AND timestamp <= ?"
        params.append(end)

    with _LOCK:
        conn = get_db()
        conn.execute(query, params)
        conn.commit()
        deleted = conn.total_changes
        conn.close()
    return {"status": "ok", "deleted": deleted}, 200


# ============ 模拟数据 API（seed_history 表） ============

_SEED_TABLE = "seed_history"


@app.route("/api/seed_history", methods=["GET"])
def list_seed_history():
    limit = request.args.get("limit", 50, type=int)
    model = request.args.get("model", "")
    base_url = request.args.get("base_url", "")
    start = request.args.get("start", type=float)
    end = request.args.get("end", type=float)

    query = f"SELECT * FROM {_SEED_TABLE} WHERE 1=1"
    params = []

    if model:
        query += " AND model LIKE ?"
        params.append(f"%{model}%")
    if base_url:
        query += " AND base_url LIKE ?"
        params.append(f"%{base_url}%")
    if start is not None:
        query += " AND timestamp >= ?"
        params.append(start)
    if end is not None:
        query += " AND timestamp <= ?"
        params.append(end)

    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)

    conn = get_db()
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/seed_history/<int:record_id>", methods=["GET"])
def get_seed_history(record_id):
    conn = get_db()
    row = conn.execute(
        f"SELECT * FROM {_SEED_TABLE} WHERE id = ?", (record_id,)
    ).fetchone()
    conn.close()
    if row is None:
        return {"error": "Record not found"}, 404
    return jsonify(dict(row))


@app.route("/api/seed_history", methods=["POST"])
def save_seed_history():
    data = request.get_json(silent=True)
    if not data:
        return {"error": "Invalid JSON body"}, 400

    with _LOCK:
        conn = get_db()
        model = data.get("model", "")
        base_url = data.get("baseUrl", "")
        conn.execute(
            f"DELETE FROM {_SEED_TABLE} WHERE model = ? AND base_url = ?",
            (model, base_url),
        )
        conn.execute(
            f"""INSERT INTO {_SEED_TABLE}
               (timestamp, model, base_url, api_path, api_key, prompt,
                ttft, tps, total_time, avg_tokens, success_rate, error_dist)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                data.get("timestamp", 0),
                model,
                base_url,
                data.get("apiPath", "/chat/completions"),
                data.get("apiKey", ""),
                data.get("prompt", ""),
                data.get("ttft"),
                data.get("tps"),
                data.get("totalTime"),
                data.get("avgTokens"),
                data.get("successRate"),
                json.dumps(data.get("errorDist", {}), ensure_ascii=False),
            ),
        )
        conn.commit()
        row_id = conn.execute("SELECT last_insert_rowid()").fetchone()[0]
        conn.close()
    return {"id": row_id}, 201


@app.route("/api/seed_history", methods=["DELETE"])
def delete_seed_history():
    model = request.args.get("model", "")
    base_url = request.args.get("base_url", "")
    start = request.args.get("start", type=float)
    end = request.args.get("end", type=float)

    query = f"DELETE FROM {_SEED_TABLE} WHERE 1=1"
    params = []

    if model:
        query += " AND model LIKE ?"
        params.append(f"%{model}%")
    if base_url:
        query += " AND base_url LIKE ?"
        params.append(f"%{base_url}%")
    if start is not None:
        query += " AND timestamp >= ?"
        params.append(start)
    if end is not None:
        query += " AND timestamp <= ?"
        params.append(end)

    with _LOCK:
        conn = get_db()
        conn.execute(query, params)
        conn.commit()
        deleted = conn.total_changes
        conn.close()
    return {"status": "ok", "deleted": deleted}, 200


# ============ CORS ============


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, X-API-Key"
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS, GET, DELETE"
    return response


# ============ 测速代理 ============


@app.route("/api/chat", methods=["POST", "OPTIONS"])
def proxy_chat():
    """接收前端请求，转发到目标 API"""
    if request.method == "OPTIONS":
        return Response(status=204)

    data = request.get_json(silent=True)
    if not data:
        return {"error": "Invalid JSON body"}, 400

    # 提取目标 URL（前端已拼接好完整路径）
    target_url = data.get("_target_url")
    if not target_url:
        return {"error": "Missing _target_url"}, 400

    # 构造转发请求体（不含 _target_url）
    forward_data = {k: v for k, v in data.items() if k != "_target_url"}

    # 获取 API Key
    api_key = request.headers.get("X-API-Key", "") or request.headers.get(
        "Authorization", ""
    )
    if api_key and not api_key.startswith("Bearer "):
        api_key = f"Bearer {api_key}"

    proxy_req = urllib.request.Request(
        target_url,
        data=json.dumps(forward_data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": api_key,
        },
        method="POST",
    )

    try:
        ctx = ssl.create_default_context()
        ctx.check_hostname = False
        ctx.verify_mode = ssl.CERT_NONE

        resp = urllib.request.urlopen(proxy_req, context=ctx, timeout=120)

        # 流式转发
        content_type = resp.headers.get("Content-Type", "")
        if "text/event-stream" in content_type:

            def generate():
                while True:
                    chunk = resp.read(4096)
                    if not chunk:
                        break
                    yield chunk

            return Response(generate(), status=resp.status, content_type=content_type)
        else:
            return Response(resp.read(), status=resp.status, content_type=content_type)

    except urllib.error.HTTPError as e:
        return Response(e.read(), status=e.code, content_type="application/json")
    except Exception as e:
        return {"error": str(e)}, 502


@app.route("/")
def index():
    return send_from_directory(STATIC_DIR, "index.html")


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", 8080))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    print(f"Flask server running at http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=debug)
