"""
模拟测速数据生成脚本
向 history.db 插入多条模拟记录，用于测试对比图表和筛选功能
"""

import json
import sqlite3
import random
import os
import time

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "history.db")

MODELS = [
    {"model": "gpt-4o", "base_url": "https://api.openai.com/v1"},
    {"model": "claude-3-opus", "base_url": "https://api.anthropic.com/v1"},
    {
        "model": "ark-code-latest",
        "base_url": "https://ark.cn-beijing.volces.com/api/plan/v3",
    },
    {"model": "deepseek-chat", "base_url": "https://api.deepseek.com/v1"},
    {
        "model": "qwen-max",
        "base_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
    },
]

PROMPTS = [
    "用 Python 实现一个快速排序算法",
    "解释量子计算的基本原理",
    "写一首关于秋天的诗",
    "总结机器学习的主要类型",
    "用 Rust 实现一个简单的 HTTP 服务器",
]


def generate_record(model_info: dict, days_ago: int) -> dict:
    """生成一条模拟测速记录"""
    ttft = round(random.uniform(0.3, 2.0), 3)
    tps = round(random.uniform(30, 80), 2)
    total_time = round(random.uniform(2.0, 15.0), 3)
    avg_tokens = random.randint(100, 500)
    success_rate = round(random.uniform(0.8, 1.0), 2)
    # 确保 success_rate 不超过 1.0
    success_rate = min(success_rate, 1.0)

    # 错误分布
    total_count = 5  # 并发数
    success_count = max(1, int(total_count * success_rate))
    fail_count = total_count - success_count
    error_dist = {
        "timeout": 0,
        "rate_limit": 0,
        "auth_error": 0,
        "other": 0,
        "aborted": 0,
    }
    if fail_count > 0:
        error_types = ["timeout", "rate_limit", "other"]
        weights = [0.5, 0.3, 0.2]
        for _ in range(fail_count):
            t = random.choices(error_types, weights=weights, k=1)[0]
            error_dist[t] += 1

    # 时间戳：days_ago 天前，加上随机小时偏移
    now = time.time()
    ts = now - days_ago * 86400 - random.uniform(0, 86400)

    return {
        "timestamp": round(ts, 3),
        "model": model_info["model"],
        "base_url": model_info["base_url"],
        "api_path": "/chat/completions",
        "api_key": "sk-mock-key-" + model_info["model"],
        "prompt": random.choice(PROMPTS),
        "ttft": ttft,
        "tps": tps,
        "total_time": total_time,
        "avg_tokens": avg_tokens,
        "success_rate": success_rate,
        "error_dist": error_dist,
    }


TABLE_NAME = "seed_history"


def seed():
    conn = sqlite3.connect(DB_PATH)
    # 确保 seed_history 表存在
    conn.execute(
        f"""
        CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
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
    try:
        conn.execute(
            f"ALTER TABLE {TABLE_NAME} ADD COLUMN api_key TEXT NOT NULL DEFAULT ''"
        )
    except Exception:
        pass
    # 清空 seed_history 表（不影响实际 history 表）
    conn.execute(f"DELETE FROM {TABLE_NAME}")
    print(f"已清空 {TABLE_NAME} 表")

    total = 0
    for model_info in MODELS:
        # 每个模型只生成 1 条记录（去重逻辑：同一 model+base_url 只保留最新一条）
        days_ago = random.randint(0, 7)
        rec = generate_record(model_info, days_ago)
        conn.execute(
            f"""INSERT INTO {TABLE_NAME}
               (timestamp, model, base_url, api_path, api_key, prompt,
                ttft, tps, total_time, avg_tokens, success_rate, error_dist)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)""",
            (
                rec["timestamp"],
                rec["model"],
                rec["base_url"],
                rec["api_path"],
                rec["api_key"],
                rec["prompt"],
                rec["ttft"],
                rec["tps"],
                rec["total_time"],
                rec["avg_tokens"],
                rec["success_rate"],
                json.dumps(rec["error_dist"], ensure_ascii=False),
            ),
        )
        total += 1

    conn.commit()
    conn.close()
    print(f"已插入 {total} 条模拟数据到 {TABLE_NAME} 表（每个 model+base_url 仅 1 条）")


if __name__ == "__main__":
    seed()
