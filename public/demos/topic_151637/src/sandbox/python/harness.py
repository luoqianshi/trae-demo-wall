"""DataPilot Python 沙箱 — JSON-RPC over stdio.

命名空间约定：
  - `result` 变量 = 结构化返回值（自动序列化为 JSON）
  - `figures` 列表 = Plotly figure 对象（自动 to_dict + bdata 解码）

支持方法：
  - ping: 心跳检测（不依赖重型库，立即响应）
  - execute(code): 执行 Python 代码，返回 {stdout, stderr, result, figures}
  - load_data(source, format): 加载数据到命名空间
  - query(sql): 用 duckdb 对 DataFrame 执行 SQL
  - describe(handle): 返回 schema + head + describe 统计
  - list_variables(): 列出当前命名空间中的变量
  - reset(): 清空命名空间
"""
from __future__ import annotations

import base64
import io
import json
import math
import struct
import sys
import traceback
from typing import Any

# === 懒加载重型库 ===
# 首次导入 pandas 等库可能很慢（首次需编译字节码，可达数十秒），
# 因此采用懒加载策略：
#   1. ping 请求不依赖任何重型库，立即响应（解决 sandbox 启动超时）
#   2. 首次 execute/load_data 等操作时同步导入（约 8 秒，在 120 秒超时内）
#   3. _ensure_imports() 保证幂等，后续调用立即返回

pd = None
np = None
ak = None
px = None
go = None
duckdb = None
stats = None
openpyxl = None

_imports_done = False


def _ensure_imports() -> None:
    """懒加载所有重型库（幂等）。

    首次调用时阻塞直到所有库导入完成；后续调用立即返回。
    """
    global pd, np, ak, px, go, duckdb, stats, openpyxl, _imports_done
    if _imports_done:
        return
    import pandas as _pd
    import numpy as _np
    pd = _pd
    np = _np

    try:
        import akshare as _ak
        ak = _ak
    except ImportError:
        ak = None

    try:
        import plotly.express as _px
        import plotly.graph_objects as _go
        px = _px
        go = _go
    except ImportError:
        px = None
        go = None

    try:
        import duckdb as _duckdb
        duckdb = _duckdb
    except ImportError:
        duckdb = None

    try:
        import scipy.stats as _stats
        stats = _stats
    except ImportError:
        stats = None

    try:
        import openpyxl as _openpyxl
        openpyxl = _openpyxl
    except ImportError:
        openpyxl = None

    _imports_done = True


# === 命名空间 ===

def _create_namespace() -> dict[str, Any]:
    _ensure_imports()
    ns: dict[str, Any] = {
        "__builtins__": __builtins__,
        "pd": pd,
        "np": np,
        "ak": ak,
        "px": px,
        "go": go,
        "duckdb": duckdb,
        "stats": stats,
        "result": None,
        "figures": [],
    }
    return ns


# 延迟初始化命名空间，避免模块加载时触发重型库导入
_namespace: dict[str, Any] | None = None


def _get_namespace() -> dict[str, Any]:
    """获取命名空间，首次调用时延迟初始化。"""
    global _namespace
    if _namespace is None:
        _namespace = _create_namespace()
    return _namespace


# === Figure 序列化 ===

_DTYPE_SIZE = {"f8": 8, "f4": 4, "i8": 8, "i4": 4, "u8": 8, "u4": 4}
_DTYPE_FMT = {"f8": "d", "f4": "f", "i8": "q", "i4": "i", "u8": "Q", "u4": "I"}


def _decode_bdata(val: dict) -> list:
    """解码 Plotly 6.x 的 bdata 二进制编码为 Python list。"""
    dtype = val.get("dtype", "f8")
    elem_size = _DTYPE_SIZE.get(dtype, 8)
    fmt_char = _DTYPE_FMT.get(dtype, "d")
    try:
        raw = base64.b64decode(val["bdata"])
        n = len(raw) // elem_size
        return list(struct.unpack("<" + str(n) + fmt_char, raw))
    except Exception:
        return []


def _serialize_figure(fig: Any) -> dict:
    """把 Plotly figure 序列化为纯 Python dict（bdata 解码为 list）。"""
    try:
        if hasattr(fig, "to_dict"):
            fig_dict = fig.to_dict()
        elif isinstance(fig, dict):
            fig_dict = fig
        else:
            return {}

        for trace in fig_dict.get("data", []):
            if not isinstance(trace, dict):
                continue
            for key in ("x", "y", "z", "values", "customdata", "r", "theta"):
                val = trace.get(key)
                if val is None:
                    continue
                if isinstance(val, dict) and "bdata" in val and "dtype" in val:
                    trace[key] = _decode_bdata(val)
                elif isinstance(val, str) or not hasattr(val, "__iter__"):
                    continue
                else:
                    try:
                        trace[key] = list(val)
                    except TypeError:
                        pass

        # layout 中也可能有 bdata
        layout = fig_dict.get("layout", {})
        if isinstance(layout, dict):
            for key in ("annotations", "shapes"):
                items = layout.get(key, [])
                if isinstance(items, list):
                    for item in items:
                        if isinstance(item, dict):
                            for k, v in list(item.items()):
                                if isinstance(v, dict) and "bdata" in v and "dtype" in v:
                                    item[k] = _decode_bdata(v)

        return fig_dict
    except Exception:
        return {}


def _jsonify(obj: Any) -> Any:
    """递归把 numpy/pandas 类型转为 Python 原生类型，NaN/Inf 转 None。"""
    if isinstance(obj, dict):
        return {k: _jsonify(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_jsonify(v) for v in obj]
    if isinstance(obj, tuple):
        return [_jsonify(v) for v in obj]
    # pandas DataFrame / Series 直接转 dict/list
    if pd is not None:
        if isinstance(obj, pd.DataFrame):
            return _jsonify(obj.to_dict(orient="records"))
        if isinstance(obj, pd.Series):
            return _jsonify(obj.to_dict())
    if np is not None:
        if isinstance(obj, (np.integer,)):
            return int(obj)
        if isinstance(obj, (np.floating,)):
            val = float(obj)
            if math.isnan(val) or math.isinf(val):
                return None
            return val
        if isinstance(obj, (np.bool_,)):
            return bool(obj)
        if isinstance(obj, np.ndarray):
            return _jsonify(obj.tolist())
    if isinstance(obj, float):
        if math.isnan(obj) or math.isinf(obj):
            return None
        return obj
    if hasattr(obj, "isoformat"):
        return obj.isoformat()
    return obj


# === 方法实现 ===

def _sanitize_text(s: str) -> str:
    """清洗字符串中的 lone surrogate 字符。

    LLM 偶发返回的代码片段在 UTF-8 编解码时可能出现 \udc80 等孤立代理对，
    exec() 编译或 StringIO 写入时触发 UnicodeEncodeError。
    用 errors='replace' 将其替换为 U+FFFD，避免整个执行失败。
    """
    if not isinstance(s, str):
        return s
    try:
        # 尝试直接编码；失败则替换
        s.encode("utf-8")
        return s
    except UnicodeEncodeError:
        return s.encode("utf-8", errors="replace").decode("utf-8", errors="replace")


def _execute(code: str) -> dict:
    """执行 Python 代码，捕获 stdout/stderr/result/figures。"""
    _ensure_imports()
    ns = _get_namespace()

    # 清洗代码中的 lone surrogate，避免 exec() 编码失败
    safe_code = _sanitize_text(code)

    old_stdout = sys.stdout
    old_stderr = sys.stderr
    # 用 errors='replace' 的写入器，避免 StringIO 写入时遇到 surrogate 报错
    sys.stdout = io.StringIO()
    sys.stderr = io.StringIO()

    try:
        exec(safe_code, ns)
    except Exception:
        traceback.print_exc()
    finally:
        try:
            stdout_val = sys.stdout.getvalue()
        except Exception:
            stdout_val = ""
        try:
            stderr_val = sys.stderr.getvalue()
        except Exception:
            stderr_val = ""
        sys.stdout = old_stdout
        sys.stderr = old_stderr

    # 二次清洗：exec 过程中 print 的内容可能也包含 surrogate
    stdout_val = _sanitize_text(stdout_val)
    stderr_val = _sanitize_text(stderr_val)

    result = _jsonify(ns.get("result"))
    figures = []
    raw_figures = ns.get("figures", [])
    if isinstance(raw_figures, list):
        for fig in raw_figures:
            figures.append(_serialize_figure(fig))
    # 执行后清空 figures 列表，避免重复返回
    ns["figures"] = []

    return {
        "stdout": stdout_val,
        "stderr": stderr_val,
        "result": result,
        "figures": figures,
    }


def _load_data(source: str, fmt: str = "csv") -> dict:
    """加载数据文件到命名空间 df 变量。"""
    _ensure_imports()
    fmt = fmt.lower()
    if fmt == "csv":
        df = pd.read_csv(source)
    elif fmt == "excel" or fmt == "xlsx":
        df = pd.read_excel(source)
    elif fmt == "parquet":
        df = pd.read_parquet(source)
    elif fmt == "json":
        df = pd.read_json(source)
    else:
        raise ValueError(f"Unsupported format: {fmt}")

    ns = _get_namespace()
    ns["df"] = df
    return _describe_df(df)


def _query(sql: str) -> dict:
    """用 duckdb 对 DataFrame 执行 SQL。"""
    _ensure_imports()
    if duckdb is None:
        raise RuntimeError("duckdb not available")
    ns = _get_namespace()
    if "df" not in ns:
        raise RuntimeError("No DataFrame loaded. Call load_data first.")
    df = ns["df"]
    # 注册 DataFrame 让 duckdb 能在 SQL 中引用
    duckdb.register("df", df)
    result_df = duckdb.query(sql).to_df()
    duckdb.unregister("df")
    return {
        "columns": result_df.columns.tolist(),
        "rows": _jsonify(result_df.values.tolist()),
        "shape": list(result_df.shape),
    }


def _describe_df(df: Any) -> dict:
    """返回 DataFrame 的 schema + head + describe。"""
    dtypes = {col: str(dtype) for col, dtype in df.dtypes.items()}
    head = df.head(10).to_dict(orient="records")
    try:
        desc = df.describe(include="all").to_dict()
    except Exception:
        desc = {}
    return {
        "columns": df.columns.tolist(),
        "dtypes": dtypes,
        "head": _jsonify(head),
        "describe": _jsonify(desc),
        "shape": list(df.shape),
    }


def _describe(handle: str = "df") -> dict:
    """返回指定变量的 schema + head + describe。"""
    _ensure_imports()
    ns = _get_namespace()
    if handle not in ns:
        raise KeyError(f"Variable '{handle}' not found")
    obj = ns[handle]
    if isinstance(obj, pd.DataFrame):
        return _describe_df(obj)
    raise TypeError(f"Variable '{handle}' is not a DataFrame")


def _list_variables() -> list[str]:
    """列出命名空间中的用户变量。"""
    ns = _get_namespace()
    skip = {"__builtins__", "pd", "np", "ak", "px", "go", "duckdb", "stats", "result", "figures", "openpyxl"}
    return [k for k in ns.keys() if k not in skip]


def _reset() -> str:
    """清空命名空间。"""
    global _namespace
    _namespace = _create_namespace()
    return "ok"


# === JSON-RPC 主循环 ===

def _safe_print(obj: dict) -> None:
    """安全打印 JSON 响应，捕获序列化异常避免进程崩溃。"""
    try:
        line = json.dumps(obj, ensure_ascii=False, default=str)
        print(line, flush=True)
    except Exception:
        # 回退：用 repr 兜底，确保进程不会因序列化失败而崩溃
        try:
            print(
                json.dumps(
                    {
                        "jsonrpc": "2.0",
                        "id": obj.get("id"),
                        "error": {
                            "code": -32603,
                            "message": "JSON serialization failed",
                        },
                    },
                    ensure_ascii=False,
                ),
                flush=True,
            )
        except Exception:
            pass


def _handle_request(req: dict) -> dict:
    method = req.get("method", "")
    params = req.get("params", {})
    req_id = req.get("id")

    handlers = {
        "ping": lambda p: "pong",
        "execute": lambda p: _execute(p.get("code", "")),
        "load_data": lambda p: _load_data(p.get("source", ""), p.get("format", "csv")),
        "query": lambda p: _query(p.get("sql", "")),
        "describe": lambda p: _describe(p.get("handle", "df")),
        "list_variables": lambda p: _list_variables(),
        "reset": lambda p: _reset(),
    }

    handler = handlers.get(method)
    if handler is None:
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {"code": -32601, "message": f"Method not found: {method}"},
        }

    try:
        result = handler(params)
        return {"jsonrpc": "2.0", "id": req_id, "result": _jsonify(result)}
    except Exception as e:
        tb = traceback.format_exc()
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "error": {
                "code": -32603,
                "message": str(e),
                "traceback": tb,
            },
        }


def main():
    # 强制 stdout/stderr 为 UTF-8（Windows 下 reconfigure 可能静默失败）
    # 用 TextIOWrapper 包裹底层二进制流，确保输出字节为 UTF-8
    try:
        sys.stdout = io.TextIOWrapper(
            sys.stdout.buffer, encoding='utf-8', errors='replace', line_buffering=True
        )
        sys.stderr = io.TextIOWrapper(
            sys.stderr.buffer, encoding='utf-8', errors='replace', line_buffering=True
        )
    except Exception:
        pass
    # stdin 同样强绑 UTF-8
    try:
        sys.stdin = io.TextIOWrapper(
            sys.stdin.buffer, encoding='utf-8', errors='replace'
        )
    except Exception:
        pass

    # 重型库（pandas 等）在首次 execute/load_data 时懒加载，
    # ping 请求不依赖任何重型库，立即响应
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        try:
            req = json.loads(line)
        except json.JSONDecodeError as e:
            resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": f"Parse error: {e}"},
            }
            _safe_print(resp)
            continue

        try:
            resp = _handle_request(req)
        except Exception as e:
            tb = traceback.format_exc()
            resp = {
                "jsonrpc": "2.0",
                "id": req.get("id"),
                "error": {
                    "code": -32603,
                    "message": f"Internal error: {e}",
                    "traceback": tb,
                },
            }
        _safe_print(resp)


if __name__ == "__main__":
    main()
