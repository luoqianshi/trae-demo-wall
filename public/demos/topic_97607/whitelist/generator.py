#!/usr/bin/env python3
"""白名单生成层：模板 + 用户题目 → Manim代码 → 渲染 → 审计。

核心区别（vs 之前的纯自然语言路线）：
  模板把"视觉决策"从模型转移到人类。
  模型只做"代码实现"——按照模板的 scene_plan 写 Manim 代码。

流程:
  1. 加载白名单模板
  2. 从模板构造 codegen prompt（注入 insight_image / visual_metaphor / scene_plan / constraints）
  3. 调用 doubao-seed-2-1-pro-260628 生成 Manim 代码
  4. 静态检查（MathTex非ASCII / .scale() / font_size=0 / dash_length）
  5. 渲染（manim -ql）
  6. 抽帧（5帧，按场景中段）
  7. 视觉审计（视觉模型检查是否符合模板 audit_criteria）

成本预估（单次 demo）:
  - codegen API: ~5000-8000 tokens (doubao-seed-2-1-pro, ~0.15-0.24元)
  - 修复 API: ~5000 tokens (如需, ~0.15元)
  - 审计 API: ~5帧 × 1000 tokens (视觉模型, ~0.05-0.10元)
  - 合计: ~0.20-0.50元/视频（目标 ≤0.5元）

用法:
  python generator.py --template negative_number_addition --problem "(-3)+(+5)=?"
  python generator.py --template negative_number_addition  # 用默认题
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

import requests

# -- Config --
TEMPLATES_DIR = Path(__file__).parent / "templates"
OUTPUT_DIR = Path(__file__).parent / "output"
ARK_API_ENDPOINT = "https://ark.cn-beijing.volces.com/api/v3/chat/completions"
TEXT_MODEL = "doubao-seed-2-1-pro-260628"
# 视觉模型（审计用，需用户确认模型ID）
VISION_MODEL = "doubao-seed-1-6-vision-250815"  # 1.6-vision，审计更快
MANIM_PYTHON = "/Users/a1/Desktop/Trae work/manim-venv/bin/python3"
MANIM_PYTHONHOME = ""  # manim-venv 自带环境，不需要额外 PYTHONHOME

# 成本控制
TOKEN_STOP_PER_DEMO = 20_000   # 单次demo token上限
MAX_REPAIR = 1                 # 最多修复1次


# -- 工具函数 --
def write_json(path: Path, data: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8")


def load_template(template_id: str) -> dict[str, Any]:
    p = TEMPLATES_DIR / f"{template_id}.json"
    if not p.exists():
        raise FileNotFoundError(f"模板不存在: {p}")
    return json.loads(p.read_text(encoding="utf-8"))


# -- API 调用 --
def ark_text(messages: list[dict[str, str]], *, max_tokens: int, json_mode: bool = False, timeout: int = 120) -> tuple[str, dict[str, Any], float]:
    """调用文本模型。返回 (content, usage, elapsed_sec)。"""
    key = os.environ.get("ARK_API_KEY", "").strip()
    if not key:
        raise RuntimeError("ARK_API_KEY 未设置")
    payload: dict[str, Any] = {
        "model": TEXT_MODEL,
        "stream": False,
        "messages": messages,
        "temperature": 0.0,
        "max_tokens": max_tokens,
        "thinking": {"type": "disabled"},
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}
    s = requests.Session()
    s.trust_env = False
    t0 = time.time()
    r = s.post(ARK_API_ENDPOINT, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}, json=payload, timeout=timeout)
    sec = time.time() - t0
    r.encoding = "utf-8"
    data = r.json()
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code}: {json.dumps(data.get('error', data), ensure_ascii=False)[:800]}")
    content = data["choices"][0].get("message", {}).get("content", "")
    if isinstance(content, list):
        content = "".join(seg.get("text", "") for seg in content if isinstance(seg, dict))
    if not isinstance(content, str) or not content.strip():
        raise RuntimeError("API 返回空内容")
    return content, data.get("usage", {}) or {}, sec


def ark_vision(messages: list[dict[str, Any]], *, max_tokens: int = 500, timeout: int = 60) -> tuple[str, dict[str, Any], float]:
    """调用视觉模型（审计用）。messages 含 image_url。"""
    key = os.environ.get("ARK_API_KEY", "").strip()
    if not key:
        raise RuntimeError("ARK_API_KEY 未设置")
    payload: dict[str, Any] = {
        "model": VISION_MODEL,
        "stream": False,
        "messages": messages,
        "temperature": 0.0,
        "max_tokens": max_tokens,
    }
    s = requests.Session()
    s.trust_env = False
    t0 = time.time()
    r = s.post(ARK_API_ENDPOINT, headers={"Authorization": f"Bearer {key}", "Content-Type": "application/json"}, json=payload, timeout=timeout)
    sec = time.time() - t0
    r.encoding = "utf-8"
    data = r.json()
    if r.status_code != 200:
        raise RuntimeError(f"HTTP {r.status_code}: {json.dumps(data.get('error', data), ensure_ascii=False)[:800]}")
    content = data["choices"][0].get("message", {}).get("content", "")
    if isinstance(content, list):
        content = "".join(seg.get("text", "") for seg in content if isinstance(seg, dict))
    return content, data.get("usage", {}) or {}, sec


# -- Prompt 构造（核心：从模板注入视觉决策）--
def build_codegen_prompt(template: dict[str, Any], problem: dict[str, Any]) -> list[dict[str, str]]:
    """从白名单模板构造 codegen prompt。

    核心区别：模板的 insight_image / visual_metaphor / scene_plan / constraints
    全部注入 prompt。模型不需要自己设计视觉方案，只做代码实现。
    """
    system = (
        "你是 ManimCommunity v0.19 工程师。只输出完整 Python 文件，不要解释，不要 markdown。\n"
        "你只能实现以下视觉模板，不能重新设计讲法。\n\n"
        f"【视觉洞察】\n{template['insight_image']}\n\n"
        f"【视觉隐喻】\n概念：{template['visual_metaphor']['concept']}\n"
        f"隐喻：{template['visual_metaphor']['metaphor']}\n"
        f"映射：{json.dumps(template['visual_metaphor']['mapping'], ensure_ascii=False, indent=2)}\n\n"
        f"【布局】\n{json.dumps(template['layout'], ensure_ascii=False, indent=2)}\n\n"
        f"【操作类型】\n{', '.join(template['operations'])}\n"
        f"{json.dumps(template['operation_detail'], ensure_ascii=False, indent=2)}\n\n"
        f"【分镜计划（固定5镜，严格按此执行）】\n{json.dumps(template['scene_plan'], ensure_ascii=False, indent=2)}\n\n"
        f"【符号到视觉映射】\n{json.dumps(template['symbol_to_visual'], ensure_ascii=False, indent=2)}\n\n"
        f"【Manim约束】\n{json.dumps(template['manim_constraints'], ensure_ascii=False, indent=2)}\n\n"
        "硬规则：\n"
        "- 直接以 from manim import * 开头，只包含 GeneratedCourseware(Scene)。\n"
        "- 中文只用 Text；数学只用 MathTex；MathTex 内禁止中文、中文标点和 $。\n"
        "- 所有 MathTex 字符串必须只含 ASCII 字符。\n"
        "- 固定字号：T=36, M=30, S=22；不要使用 .scale()。\n"
        "- 每镜一个总 VGroup，镜尾 FadeOut 清场。\n\n"
        "【布局硬规则（一票否决，违反则代码不合格）】\n"
        "- 标题: to_edge(UP, buff=0.15), y范围[3.2,3.8], font_size=36\n"
        "- 题目(如有): to_edge(UP, buff=0.85), y范围[2.5,3.1], font_size=22\n"
        "- 主可视化: 居中于 y≈0.7, y范围[-0.8,2.3], 占画面46%\n"
        "- 操作标注(方向箭头/段标签): 必须在主可视化区内(y<2.3), 绝不能放到标题区\n"
        "- 公式: to_edge(DOWN, buff=1.2), y范围[-2.2,-0.9], font_size=30\n"
        "- 答案: to_edge(DOWN, buff=0.3), y范围[-3.5,-2.4], font_size=30\n"
        "- 所有元素必须在 x[-6.4,6.4], y[-3.5,3.8] 内\n"
        "- 文字不得与文字重叠，文字不得与图形重叠\n"
        "- 主可视化区与推理区之间不得有超过1.5单位的空白\n\n"
        "【动态布局规则（当可视化需要大面积时）】\n"
        "- 如果模板标注 visual_expansion=true，则：\n"
        "  镜1: 标题正常显示在顶部 to_edge(UP, buff=0.15), font_size=36\n"
        "  镜2开始: 标题缩小到 font_size=22 并移到左上角 to_corner(UL, buff=0.3)，释放顶部空间给可视化\n"
        "  可视化区域可扩展到 y=[-1.0, 3.2]（原标题区让出）\n"
        "  镜5: 标题可恢复到顶部或保持左上角小字\n"
        "- 如果 visual_expansion 不为 true，标题始终在顶部不移动\n\n"
        "- 镜3必须对主视觉做操作或高亮，不能只写公式。\n"
        "- 最终答案必须与输入答案完全一致。\n"
        "- 不使用外部图片、3D、复杂 updater、DecimalNumber。\n"
        "- 禁止 dash_length 参数。禁止 font_size=0。\n"
    )
    user = (
        "根据以上视觉模板，为以下题目生成 Manim 代码。\n"
        "只输出 Python 代码，不要解释。\n\n"
        + json.dumps(problem, ensure_ascii=False, indent=2)
    )
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


def build_repair_prompt(template: dict[str, Any], problem: dict[str, Any], code: str, error: str) -> list[dict[str, str]]:
    """构造修复 prompt。"""
    system = (
        "你是 ManimCommunity v0.19 修复工程师。只输出完整 Python 文件，不要解释，不要 markdown。\n"
        "渲染失败，请最小修改修复。保持题目、答案、可视化模型不变。\n"
        "MathTex 内只能有 ASCII，中文必须用 Text。\n"
        "不要使用 .scale()，不要使用 dash_length，不要 font_size=0。\n\n"
        f"【视觉模板约束】\n{json.dumps(template['manim_constraints'], ensure_ascii=False, indent=2)}"
    )
    user = (
        f"问题：\n{json.dumps(problem, ensure_ascii=False, indent=2)}\n\n"
        f"错误：\n{error[-2500:]}\n\n"
        f"代码：\n{code}"
    )
    return [{"role": "system", "content": system}, {"role": "user", "content": user}]


def build_audit_prompt(template: dict[str, Any]) -> str:
    """构造审计系统提示词。"""
    return (
        "你是视觉审计员。检查视频帧是否符合以下审计标准。\n"
        "对每一帧输出合法JSON：\n"
        '{"frame_id": "frame_N", "pass": true/false, "reason": "简短原因（不超过30字）"}\n\n'
        f"【审计标准】\n{json.dumps(template['audit_criteria'], ensure_ascii=False, indent=2)}\n\n"
        f"【一票否决项】\n{json.dumps(template['audit_criteria'].get('veto', []), ensure_ascii=False, indent=2)}"
    )


# -- 代码处理 --
def strip_code(raw: str) -> str:
    text = raw.strip()
    m = re.search(r"```(?:python)?\s*(.*?)\s*```", text, re.S | re.I)
    if m:
        text = m.group(1).strip()
    start = text.find("from manim import")
    if start > 0:
        text = text[start:]
    return text.strip() + "\n"


def has_non_ascii_mathtex(code: str) -> bool:
    for m in re.finditer(r"MathTex\((?P<q>['\"])(?P<s>.*?)(?P=q)", code, re.S):
        if any(ord(ch) > 127 for ch in m.group("s")):
            return True
    return False


def static_check(code: str) -> list[str]:
    issues = []
    if has_non_ascii_mathtex(code):
        issues.append("MathTex_non_ascii")
    if re.search(r"\.scale\(", code):
        issues.append("uses_scale")
    if "font_size=0" in code:
        issues.append("font_size_zero")
    if "dash_length" in code:
        issues.append("dash_length")
    return issues


# -- 渲染 --
def render(scene_file: Path, out_dir: Path) -> tuple[bool, str, float, str]:
    media_dir = out_dir / "media"
    env = os.environ.copy()
    if MANIM_PYTHONHOME:
        env["PYTHONHOME"] = MANIM_PYTHONHOME
    else:
        env.pop("PYTHONHOME", None)
    env.pop("PYTHONPATH", None)  # 清除可能干扰的 PYTHONPATH
    cmd = [
        MANIM_PYTHON, "-m", "manim", "-ql", "--disable_caching", "--silent",
        str(scene_file), "GeneratedCourseware", "-o", "render.mp4",
        "--media_dir", str(media_dir),
    ]
    # 用文件重定向代替 capture_output，避免管道死锁
    log_file = out_dir / "render_log.txt"
    err_file = out_dir / "render_err.txt"
    t0 = time.time()
    try:
        with open(log_file, "w") as lf, open(err_file, "w") as ef:
            p = subprocess.run(cmd, stdout=lf, stderr=ef, timeout=120, env=env)
        sec = time.time() - t0
    except subprocess.TimeoutExpired:
        sec = time.time() - t0
        err_text = err_file.read_text() if err_file.exists() else "timeout"
        return False, "", sec, f"渲染超时({sec:.0f}s): {err_text[-500:]}"
    mp4s = sorted(media_dir.glob("videos/**/render.mp4"))
    mp4 = str(mp4s[0]) if mp4s else ""
    if p.returncode != 0:
        err_text = ""
        if err_file.exists():
            err_text = err_file.read_text()
        if not err_text and log_file.exists():
            err_text = log_file.read_text()
        return False, mp4, sec, err_text[-4000:]
    if not mp4:
        return False, "", sec, "渲染成功但无mp4"
    return True, mp4, sec, ""


# -- 抽帧 --
def get_duration(mp4: str) -> float:
    p = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp4],
        capture_output=True, text=True, timeout=20,
    )
    try:
        return float(p.stdout.strip())
    except Exception:
        return 0.0


def extract_frames(mp4: str, out_dir: Path, n: int = 5) -> list[str]:
    """抽n帧，按场景等分取中段（避免过渡帧）。"""
    d = get_duration(mp4)
    if d <= 0:
        return []
    # 等分取中段：第k帧在 [k/n, (k+1)/n] 的中点
    times = [d * (k + 0.5) / n for k in range(n)]
    frames_dir = out_dir / "frames"
    frames_dir.mkdir(parents=True, exist_ok=True)
    paths = []
    for i, t in enumerate(times, 1):
        out = frames_dir / f"frame_{i:02d}.png"
        p = subprocess.run(
            ["ffmpeg", "-y", "-v", "error", "-ss", f"{t:.2f}", "-i", mp4, "-frames:v", "1", str(out)],
            timeout=30,
        )
        if p.returncode == 0 and out.exists():
            paths.append(str(out))
    return paths


# -- 主流程 --
def run(template_id: str, problem: dict[str, Any] | None = None, out_dir: Path | None = None) -> dict[str, Any]:
    """白名单生成主流程：模板 → 代码 → 渲染 → 审计。"""
    template = load_template(template_id)
    if problem is None:
        problem = template.get("default_problem", {})
    if out_dir is None:
        out_dir = OUTPUT_DIR / template_id
    out_dir.mkdir(parents=True, exist_ok=True)

    metrics: dict[str, Any] = {
        "template_id": template_id,
        "template_name": template.get("knowledge_point", template_id),
        "problem": problem,
        "stages": [],
        "total_tokens": 0,
    }

    # Stage 1: Codegen
    print(f"[1/4] 生成代码（模板: {template_id}）...")
    messages = build_codegen_prompt(template, problem)
    code_raw, usage, sec = ark_text(messages, max_tokens=5500, timeout=180)
    code = strip_code(code_raw)
    total_tokens = usage.get("total_tokens", 0)
    metrics["stages"].append({"stage": "codegen", "tokens": total_tokens, "sec": round(sec, 1)})
    metrics["total_tokens"] += total_tokens
    write_text(out_dir / "generated.py", code)
    write_json(out_dir / "codegen_usage.json", usage)
    print(f"  完成: {total_tokens} tokens, {sec:.1f}s, {len(code.splitlines())} 行")

    # 静态检查
    issues = static_check(code)
    if issues:
        print(f"  静态检查发现问题: {issues}")

    # Token 上限检查
    if metrics["total_tokens"] > TOKEN_STOP_PER_DEMO:
        metrics["status"] = "REJECT_COST"
        write_json(out_dir / "metrics.json", metrics)
        return metrics

    # Stage 2: 渲染
    print("[2/4] 渲染...")
    scene_file = out_dir / "generated.py"
    ok, mp4, render_sec, err = render(scene_file, out_dir)
    metrics["stages"].append({"stage": "render_1", "ok": ok, "sec": round(render_sec, 1)})
    print(f"  {'成功' if ok else '失败'}: {render_sec:.1f}s")

    # Stage 2b: 修复（如需）
    if not ok and metrics["total_tokens"] < TOKEN_STOP_PER_DEMO:
        print("[2b/4] 修复渲染...")
        repair_msgs = build_repair_prompt(template, problem, code, err)
        code_raw2, usage2, sec2 = ark_text(repair_msgs, max_tokens=5500, timeout=180)
        code2 = strip_code(code_raw2)
        repair_tokens = usage2.get("total_tokens", 0)
        metrics["total_tokens"] += repair_tokens
        metrics["stages"].append({"stage": "repair_api", "tokens": repair_tokens, "sec": round(sec2, 1)})
        write_text(out_dir / "generated_repaired.py", code2)

        ok2, mp4, render_sec2, err2 = render(out_dir / "generated_repaired.py", out_dir)
        metrics["stages"].append({"stage": "render_2", "ok": ok2, "sec": round(render_sec2, 1)})
        print(f"  修复后: {'成功' if ok2 else '失败'}: {render_sec2:.1f}s")
        ok = ok2

    if not ok:
        metrics["status"] = "REJECT_RENDER"
        write_json(out_dir / "metrics.json", metrics)
        return metrics

    # Stage 3: 抽帧
    print("[3/4] 抽帧...")
    frames = extract_frames(mp4, out_dir, n=5)
    metrics["frames"] = frames
    print(f"  抽取 {len(frames)} 帧")

    # Stage 4: 审计（需视觉模型，标注成本）
    print("[4/4] 视觉审计...")
    audit_results = []
    audit_system = build_audit_prompt(template)
    for i, frame_path in enumerate(frames, 1):
        # 视觉模型调用：图片以 base64 或 URL 形式传入
        import base64
        with open(frame_path, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode()
        messages = [
            {"role": "system", "content": audit_system},
            {"role": "user", "content": [
                {"type": "text", "text": f"请检查 frame_{i:02d}"},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}},
            ]},
        ]
        try:
            result_text, vision_usage, vision_sec = ark_vision(messages, max_tokens=300, timeout=60)
            metrics["total_tokens"] += vision_usage.get("total_tokens", 0)
            # 尝试解析 JSON
            try:
                result_json = json.loads(result_text.strip())
            except json.JSONDecodeError:
                # 尝试提取 JSON
                m = re.search(r'\{[^}]+\}', result_text, re.S)
                result_json = json.loads(m.group(0)) if m else {"frame_id": f"frame_{i:02d}", "pass": None, "reason": result_text[:50]}
            audit_results.append(result_json)
            print(f"  frame_{i:02d}: {'PASS' if result_json.get('pass') else 'FAIL'} - {result_json.get('reason', '')}")
        except Exception as e:
            audit_results.append({"frame_id": f"frame_{i:02d}", "pass": None, "reason": f"审计失败: {e}"})
            print(f"  frame_{i:02d}: 审计失败 - {e}")

    metrics["audit"] = audit_results
    passed = sum(1 for r in audit_results if r.get("pass") is True)
    metrics["audit_pass_count"] = passed
    metrics["audit_total"] = len(audit_results)
    metrics["status"] = "PASS" if passed >= 4 else ("REPAIR" if passed >= 2 else "REJECT")

    # 成本估算
    metrics["cost_estimate"] = round(metrics["total_tokens"] * 0.00003, 3)  # 粗估

    write_json(out_dir / "metrics.json", metrics)
    print(f"\n结果: {metrics['status']} ({passed}/{len(audit_results)} 帧通过)")
    print(f"总 tokens: {metrics['total_tokens']}, 预估成本: ~{metrics['cost_estimate']}元")
    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="白名单生成层")
    parser.add_argument("--template", required=True, help="模板ID（如 negative_number_addition）")
    parser.add_argument("--problem", default=None, help="题目JSON（不传则用模板默认题）")
    parser.add_argument("--out", default=None, help="输出目录")
    args = parser.parse_args()

    problem = json.loads(args.problem) if args.problem else None
    out_dir = Path(args.out) if args.out else None
    run(args.template, problem, out_dir)


if __name__ == "__main__":
    main()
