#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
持久化 Python 执行内核。

由 Node 后端通过子进程方式启动，使用 stdin / stdout 进行通信：
- 输入：每行一条 JSON 请求 {"id": "...", "code_b64": "<base64(utf-8 code)>"}
- 输出：每行一条以 SENTINEL 开头的 JSON 响应，包含执行结果

特点：
- 维护一个持久化的全局命名空间，跨多次 run_code 调用保留变量状态，
  让大模型可以循序渐进地分析数据。
- 捕获 stdout / stderr 与异常 traceback。
- 对单次执行做软超时与输出长度截断保护。
"""

import sys
import io
import json
import base64
import traceback
import threading
import contextlib

# Windows 默认代码页为 GBK/CP936，强制 UTF-8 以保证中文正确传输
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace", line_buffering=True)
    sys.stdin  = io.TextIOWrapper(sys.stdin.buffer,  encoding="utf-8", errors="replace")

SENTINEL = "@@RUNCODE_RESULT@@"
MAX_OUTPUT_CHARS = 12000
DEFAULT_TIMEOUT = 60  # 秒

# 持久化命名空间：所有 run_code 调用共享，从而保留中间变量
GLOBAL_NS = {"__name__": "__runcode__"}


def _preamble():
    """预导入常用库，并提供数据文件路径等上下文。"""
    code = (
        "import os, sys, json, math\n"
        "import pandas as pd\n"
        "import numpy as np\n"
        "pd.set_option('display.max_columns', 200)\n"
        "pd.set_option('display.width', 200)\n"
        "pd.set_option('display.max_colwidth', 80)\n"
    )
    try:
        exec(code, GLOBAL_NS)
    except Exception:
        traceback.print_exc()


def _truncate(text: str) -> str:
    if text is None:
        return ""
    if len(text) > MAX_OUTPUT_CHARS:
        head = text[: MAX_OUTPUT_CHARS]
        return head + f"\n...[输出过长，已截断，共 {len(text)} 字符]"
    return text


def _run_one(code: str) -> dict:
    """在持久化命名空间中执行一段代码，返回结果字典。"""
    stdout_buf = io.StringIO()
    stderr_buf = io.StringIO()
    result = {"ok": True, "stdout": "", "stderr": "", "error": None}

    def target():
        with contextlib.redirect_stdout(stdout_buf), contextlib.redirect_stderr(stderr_buf):
            try:
                exec(code, GLOBAL_NS)
            except Exception:
                result["ok"] = False
                result["error"] = traceback.format_exc()

    t = threading.Thread(target=target, daemon=True)
    t.start()
    t.join(DEFAULT_TIMEOUT)

    if t.is_alive():
        result["ok"] = False
        result["error"] = f"执行超时（>{DEFAULT_TIMEOUT}s），代码可能存在死循环或耗时操作。"

    result["stdout"] = _truncate(stdout_buf.getvalue())
    result["stderr"] = _truncate(stderr_buf.getvalue())
    if result["error"]:
        result["error"] = _truncate(result["error"])
    return result


def _send(obj: dict):
    line = SENTINEL + json.dumps(obj, ensure_ascii=True)
    sys.stdout.write(line + "\n")
    sys.stdout.flush()


def main():
    _preamble()
    _send({"id": "__ready__", "ok": True, "stdout": "", "stderr": "", "error": None})

    for raw in sys.stdin:
        raw = raw.strip()
        if not raw:
            continue
        try:
            req = json.loads(raw)
        except Exception:
            continue

        req_id = req.get("id", "")

        if req.get("cmd") == "set_context":
            file_path = req.get("file_path", "")
            GLOBAL_NS["DATA_FILE"] = file_path
            _send({"id": req_id, "ok": True, "stdout": "", "stderr": "", "error": None})
            continue

        code_b64 = req.get("code_b64", "")
        try:
            code = base64.b64decode(code_b64).decode("utf-8")
        except Exception:
            _send({"id": req_id, "ok": False, "stdout": "", "stderr": "", "error": "代码解码失败"})
            continue

        res = _run_one(code)
        res["id"] = req_id
        _send(res)


if __name__ == "__main__":
    main()