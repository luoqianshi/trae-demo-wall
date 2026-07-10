#!/usr/bin/env python3
"""白名单路由层：用户输入 → 命中模板 / 半命中 / 不支持。

三层路由：
  full_hit  — 完全命中白名单，可直接生成
  half_hit  — 半命中，需用户补充信息
  miss      — 不支持，当前白名单未覆盖

用法:
  python router.py "解方程 x+3=7"
  python router.py "温度从-2度上升了6度"
"""

from __future__ import annotations

import json
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path
from typing import Any

TEMPLATES_DIR = Path(__file__).parent / "templates"

# 阈值：可通过 demo 验证调整
FULL_HIT_MIN_SCORE = 0.30   # 得分 >= 此值 且 命中 >= 2 → full_hit
FULL_HIT_MIN_MATCH = 2      # 至少命中2个关键词
HALF_HIT_MIN_MATCH = 1      # 至少命中1个关键词 → half_hit
SCORE_DIVISOR_CAP = 6       # 得分分母上限，避免关键词多的模板被稀释


@dataclass
class RouteResult:
    route: str  # "full_hit" | "half_hit" | "miss"
    template_id: str | None = None
    template_name: str | None = None
    confidence: float = 0.0
    matched_keywords: list[str] = field(default_factory=list)
    suggestion: str = ""
    all_scores: list[dict[str, Any]] = field(default_factory=list)

    def to_dict(self) -> dict[str, Any]:
        return {
            "route": self.route,
            "template_id": self.template_id,
            "template_name": self.template_name,
            "confidence": round(self.confidence, 3),
            "matched_keywords": self.matched_keywords,
            "suggestion": self.suggestion,
            "all_scores": self.all_scores,
        }


def load_templates(templates_dir: Path = TEMPLATES_DIR) -> list[dict[str, Any]]:
    """加载所有白名单模板。"""
    templates = []
    for p in sorted(templates_dir.glob("*.json")):
        try:
            templates.append(json.loads(p.read_text(encoding="utf-8")))
        except (json.JSONDecodeError, OSError) as e:
            print(f"[WARN] 跳过 {p.name}: {e}", file=sys.stderr)
    return templates


def normalize(text: str) -> str:
    """预处理：去标点、统一小写、全角转半角。"""
    # 全角转半角
    text = text.translate(str.maketrans(
        "０１２３４５６７８９ａｂｃｄｅｆｇｈｉｊｋｌｍｎｏｐｑｒｓｔｕｖｗｘｙｚＡＢＣＤＥＦＧＨＩＪＫＬＭＮＯＰＱＲＳＴＵＶＷＸＹＺ",
        "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    ))
    text = text.lower()
    text = re.sub(r"[，。！？、；：""''（）【】《》\s,\.!?;:\"'()\[\]<>]", " ", text)
    return text


def score_template(user_input: str, template: dict[str, Any]) -> tuple[float, list[str]]:
    """计算用户输入对某模板的匹配得分和命中的关键词。"""
    normalized = normalize(user_input)
    keywords = template.get("keywords", [])
    matched = []
    for kw in keywords:
        if normalize(kw) in normalized:
            matched.append(kw)
    score = len(matched) / min(max(len(keywords), 1), SCORE_DIVISOR_CAP)
    return score, matched


def route(user_input: str, templates: list[dict[str, Any]] | None = None) -> RouteResult:
    """路由主函数：用户输入 → RouteResult。"""
    if templates is None:
        templates = load_templates()

    all_scores = []
    best = None
    best_score = 0.0
    best_matched: list[str] = []

    for tpl in templates:
        score, matched = score_template(user_input, tpl)
        entry = {
            "template_id": tpl["id"],
            "template_name": tpl.get("knowledge_point", tpl["id"]),
            "score": round(score, 3),
            "matched_count": len(matched),
            "matched_keywords": matched,
        }
        all_scores.append(entry)
        if score > best_score or (score == best_score and len(matched) > len(best_matched)):
            best = tpl
            best_score = score
            best_matched = matched

    all_scores.sort(key=lambda x: x["score"], reverse=True)

    # 判定路由层级
    if best is None or len(best_matched) < HALF_HIT_MIN_MATCH:
        # miss
        covered = "、".join(t.get("knowledge_point", t["id"]) for t in templates)
        return RouteResult(
            route="miss",
            suggestion=f"暂不支持此知识点。当前白名单覆盖：{covered}",
            all_scores=all_scores,
        )

    if best_score >= FULL_HIT_MIN_SCORE and len(best_matched) >= FULL_HIT_MIN_MATCH:
        # full_hit
        required = best.get("user_must_provide", {}).get("required", [])
        return RouteResult(
            route="full_hit",
            template_id=best["id"],
            template_name=best.get("knowledge_point", best["id"]),
            confidence=best_score,
            matched_keywords=best_matched,
            suggestion=f"命中模板「{best.get('knowledge_point', best['id'])}」，可直接生成。用户需提供：{ '、'.join(required) if required else '无' }",
            all_scores=all_scores,
        )

    # half_hit
    required = best.get("user_must_provide", {}).get("required", [])
    return RouteResult(
        route="half_hit",
        template_id=best["id"],
        template_name=best.get("knowledge_point", best["id"]),
        confidence=best_score,
        matched_keywords=best_matched,
        suggestion=f"可能匹配「{best.get('knowledge_point', best['id'])}」。请补充：{ '、'.join(required) if required else '更多信息' }",
        all_scores=all_scores,
    )


def main() -> None:
    if len(sys.argv) < 2:
        print("用法: python router.py <用户输入>")
        print("示例: python router.py '解方程 x+3=7'")
        sys.exit(1)

    user_input = " ".join(sys.argv[1:])
    result = route(user_input)
    print(json.dumps(result.to_dict(), ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
