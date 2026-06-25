"""
数据接入 API
- CSV/Excel/JSON 文件上传（训练+测试双文件）
- 一键生成模拟股票数据
- 连接本地结构化数据库（MySQL/SQLite/PostgreSQL）
- 表结构浏览、SQL 查询
- 列聚合统计（平均值/最大值/最小值/求和/计数/标准差）
"""
import os
from flask import Blueprint, request, jsonify, current_app, session
from services.data_service import DataService
from utils.data_generator import generate_mock_stock

data_bp = Blueprint("data", __name__)


def _allowed_file(filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in current_app.config["ALLOWED_EXTENSIONS"]


def _get_conn_cfg(payload):
    """从请求中提取数据库连接配置"""
    cfg = payload.get("connection") or {}
    # 兼容直接平铺的参数
    if not cfg:
        cfg = {
            "db_type": payload.get("db_type", "sqlite"),
            "host": payload.get("host", "127.0.0.1"),
            "port": payload.get("port", 3306),
            "user": payload.get("user", "root"),
            "password": payload.get("password", ""),
            "database": payload.get("database", ""),
        }
    return cfg


# ============ 文件上传 ============
@data_bp.route("/upload", methods=["POST"])
def upload_files():
    """上传训练/测试数据文件（CSV/Excel/JSON）"""
    files = request.files
    result = {"train": None, "test": None}

    for role in ("train", "test"):
        f = files.get(role)
        if f and _allowed_file(f.filename):
            path = DataService.save_upload(f, role)
            preview = DataService.load_preview(path)
            result[role] = {"path": path, **preview}

    if not any(result.values()):
        return jsonify({"code": 400, "msg": "未上传有效文件"}), 400
    return jsonify({"code": 0, "msg": "上传成功", "data": result})


@data_bp.route("/generate", methods=["POST"])
def generate_data():
    """一键生成模拟股票数据"""
    params = request.get_json(silent=True) or {}
    days = params.get("days", 365)
    volatility = params.get("volatility", 0.02)
    seed = params.get("seed", 42)

    df = generate_mock_stock(days=days, volatility=volatility, seed=seed)
    train_path, test_path = DataService.split_and_save(df)
    return jsonify({
        "code": 0,
        "msg": "模拟数据生成成功",
        "data": {
            "train": DataService.load_preview(train_path),
            "test": DataService.load_preview(test_path),
        },
    })


@data_bp.route("/preview", methods=["GET"])
def preview_data():
    """预览指定数据文件"""
    path = request.args.get("path", "")
    if not os.path.exists(path):
        return jsonify({"code": 404, "msg": "文件不存在"}), 404
    return jsonify({"code": 0, "data": DataService.load_preview(path)})


# ============ 数据库连接 ============
@data_bp.route("/db/connect", methods=["POST"])
def db_connect():
    """测试数据库连接并返回表列表"""
    payload = request.get_json(silent=True) or {}
    cfg = _get_conn_cfg(payload)
    ok, msg = DataService.test_db_connection(cfg)
    if not ok:
        return jsonify({"code": 500, "msg": f"连接失败: {msg}"}), 500
    try:
        tables = DataService.list_tables(cfg)
        return jsonify({"code": 0, "msg": "连接成功", "data": {"tables": tables}})
    except Exception as e:
        return jsonify({"code": 500, "msg": f"获取表列表失败: {str(e)}"}), 500


@data_bp.route("/db/tables", methods=["POST"])
def db_tables():
    """列出数据库中的所有表"""
    payload = request.get_json(silent=True) or {}
    cfg = _get_conn_cfg(payload)
    try:
        tables = DataService.list_tables(cfg)
        return jsonify({"code": 0, "data": {"tables": tables}})
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e)}), 500


@data_bp.route("/db/schema", methods=["POST"])
def db_schema():
    """获取指定表的结构（字段名、类型、主键）"""
    payload = request.get_json(silent=True) or {}
    cfg = _get_conn_cfg(payload)
    table = payload.get("table", "")
    if not table:
        return jsonify({"code": 400, "msg": "缺少表名"}), 400
    try:
        columns = DataService.get_table_schema(table, cfg)
        return jsonify({"code": 0, "data": {"table": table, "columns": columns}})
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e)}), 500


@data_bp.route("/db/query", methods=["POST"])
def query_db():
    """执行 SQL 查询并返回结果"""
    payload = request.get_json(silent=True) or {}
    sql = payload.get("sql", "")
    if not sql:
        return jsonify({"code": 400, "msg": "缺少 SQL 语句"}), 400
    cfg = _get_conn_cfg(payload)
    try:
        rows, columns = DataService.query_database(sql, cfg)
        return jsonify({"code": 0, "data": {"columns": columns, "rows": rows}})
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e)}), 500


@data_bp.route("/db/preview", methods=["POST"])
def db_preview():
    """预览指定表前 N 行数据"""
    payload = request.get_json(silent=True) or {}
    cfg = _get_conn_cfg(payload)
    table = payload.get("table", "")
    limit = int(payload.get("limit", 10))
    if not table:
        return jsonify({"code": 400, "msg": "缺少表名"}), 400
    try:
        sql = f'SELECT * FROM "{table}" LIMIT {limit}'
        rows, columns = DataService.query_database(sql, cfg)
        return jsonify({"code": 0, "data": {"columns": columns, "rows": rows, "total": len(rows)}})
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e)}), 500


# ============ 列聚合统计 ============
@data_bp.route("/db/aggregate", methods=["POST"])
def db_aggregate():
    """
    对数据库表的指定列执行聚合统计
    请求体:
    {
        "connection": {...},
        "table": "stock_daily",
        "columns": ["close", "volume"],
        "agg_funcs": ["avg", "max", "min", "sum", "count", "std"]
    }
    """
    payload = request.get_json(silent=True) or {}
    cfg = _get_conn_cfg(payload)
    table = payload.get("table", "")
    columns = payload.get("columns", [])
    agg_funcs = payload.get("agg_funcs", ["avg", "max", "min"])

    if not table or not columns:
        return jsonify({"code": 400, "msg": "缺少表名或列名"}), 400

    try:
        result = DataService.aggregate_columns(table, columns, agg_funcs, cfg)
        return jsonify({"code": 0, "data": {"table": table, "stats": result}})
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e)}), 500


@data_bp.route("/aggregate/file", methods=["POST"])
def file_aggregate():
    """
    对上传文件的指定列执行聚合统计
    请求体:
    {
        "path": "/path/to/file.csv",
        "columns": ["close", "volume"],
        "agg_funcs": ["avg", "max", "min", "sum", "count", "std"]
    }
    """
    payload = request.get_json(silent=True) or {}
    path = payload.get("path", "")
    columns = payload.get("columns", [])
    agg_funcs = payload.get("agg_funcs", ["avg", "max", "min"])

    if not path or not os.path.exists(path):
        return jsonify({"code": 404, "msg": "文件不存在"}), 404
    if not columns:
        return jsonify({"code": 400, "msg": "缺少列名"}), 400

    try:
        result = DataService.aggregate_file(path, columns, agg_funcs)
        return jsonify({"code": 0, "data": {"path": path, "stats": result}})
    except Exception as e:
        return jsonify({"code": 500, "msg": str(e)}), 500
