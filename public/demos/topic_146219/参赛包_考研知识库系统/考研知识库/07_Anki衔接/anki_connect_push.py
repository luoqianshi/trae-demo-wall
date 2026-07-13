#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
anki_connect_push.py
====================
路线B（自动推送）脚本草案 —— 把 AI 助手 整理好的卡片直接写进电脑 Anki。

工作原理：Anki 桌面端装「AnkiConnect」插件后，会在本机开一个 HTTP 接口
（默认 http://localhost:8765）。本脚本通过它调用 addNote，把卡片推入指定牌组。
推入后 Anki 自身通过 AnkiWeb 把卡片同步到你的手机。

⚠️ 待启用：本脚本现在不能跑，需要你先准备好环境（见 启用清单.md）：
  1) 电脑装好 Anki 桌面端
  2) Anki 里装 AnkiConnect 插件（插件号 2055492155）
  3) 在本机（不是 sandbox）运行本脚本，且 Anki 处于打开状态

调用示例：
  python anki_connect_push.py --deck "考研::管综" --front "p→q 且 ¬q 推出？" \
      --back "¬p（逆否）" --tags "管综/逻辑/假言推理"

或用 --file 批量从 TSV（示例卡片_管综逻辑.txt）导入：
  python anki_connect_push.py --deck "考研::管综" --file 示例卡片_管综逻辑.txt
"""

import argparse
import json
import urllib.request

ANKI_CONNECT_URL = "http://localhost:8765"


def _invoke(action, **params):
    """调用 AnkiConnect 本地接口。"""
    payload = json.dumps({"action": action, "version": 6, "params": params}).encode("utf-8")
    req = urllib.request.Request(ANKI_CONNECT_URL, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode("utf-8"))


def add_note(deck, front, back, tags):
    """在指定牌组新增一张基本问答卡。"""
    note = {
        "deckName": deck,
        "modelName": "Basic",
        "fields": {"Front": front, "Back": back},
        "tags": tags,
        "options": {"allowDuplicate": False},
    }
    result = _invoke("addNote", note=note)
    if result.get("error"):
        print(f"[跳过] {front[:20]}... 错误：{result['error']}")
    else:
        print(f"[已推送] {front[:30]}")
    return result


def push_from_tsv(deck, path):
    """从制表符分隔的 TSV（正面\\t背面\\t标签）批量推送。"""
    with open(path, encoding="utf-8") as f:
        for line in f:
            line = line.rstrip("\n")
            if not line.strip():
                continue
            parts = line.split("\t")
            if len(parts) < 2:
                continue
            front, back = parts[0], parts[1]
            tags = parts[2].split() if len(parts) >= 3 else []
            add_note(deck, front, back, tags)


def main():
    p = argparse.ArgumentParser(description="AI 助手 → Anki 自动推送（需 AnkiConnect）")
    p.add_argument("--deck", default="考研", help="目标牌组，如 考研::管综")
    p.add_argument("--front", help="单卡正面")
    p.add_argument("--back", help="单卡背面")
    p.add_argument("--tags", default="", help="空格分隔的标签")
    p.add_argument("--file", help="批量导入 TSV 路径")
    args = p.parse_args()

    # 先确认 AnkiConnect 在线
    try:
        _invoke("version")
    except Exception as e:
        print("连不上 AnkiConnect，请确认：Anki 已打开 + 已装 AnkiConnect 插件。", e)
        return

    if args.file:
        push_from_tsv(args.deck, args.file)
    elif args.front and args.back:
        add_note(args.deck, args.front, args.back, args.tags.split())
    else:
        print("用法见文件顶部注释。")


if __name__ == "__main__":
    main()
