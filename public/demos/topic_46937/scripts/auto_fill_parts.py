# -*- coding: utf-8 -*-
"""Fail-closed compatibility entry for the removed deterministic auto filler.

商品手册内容必须由当前商品证据与 AI 推理共同生成。历史版本在这里写入固定
商品文案和参数，会让任意 SKU 继承错误成分、尺码和资质，因此该入口只保留
兼容提示，不再修改 parts。
"""
import json
import os
import sys
from datetime import datetime


def safe_print(message):
    try:
        print(str(message))
    except Exception:
        pass


def fill_parts(product_dir):
    target_dir = os.path.abspath(product_dir)
    report_dir = os.path.join(target_dir, ".scratch", "reports")
    os.makedirs(report_dir, exist_ok=True)
    report_path = os.path.join(report_dir, "auto_fill_blocked.json")
    report = {
        "status": "blocked",
        "reason": "deterministic_auto_fill_removed",
        "message": "固定模板自动填充会跨 SKU 注入错误事实，必须由 AI 基于 content_brief 与证据清单精修 parts。",
        "parts_modified": False,
        "generated_at": datetime.now().astimezone().isoformat(timespec="seconds"),
        "next_action": [
            "读取 .scratch/content_brief.json 与 .scratch/evidence_conflicts.json",
            "仅使用未冲突证据填充 .scratch/parts",
            "运行 validate-parts、assemble、validate 和 validate-content-quality",
        ],
    }
    with open(report_path, "w", encoding="utf-8") as handle:
        json.dump(report, handle, ensure_ascii=False, indent=2)
    safe_print("[BLOCKED] auto-fill 已安全停用：固定模板无法保证跨商品事实一致性。")
    safe_print(f"[*] 报告: {report_path}")
    return 2


if __name__ == "__main__":
    if len(sys.argv) < 2:
        safe_print("Usage: python auto_fill_parts.py <target_dir>")
        sys.exit(2)
    sys.exit(fill_parts(sys.argv[1]))
