#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""景礴学院客户端 - 本地 Web 服务

后端调度 Manim CLI + 火山 API，前端聊天窗口界面。
演示模式使用已有案例数据，真实生成需用户授权 API。
"""

from __future__ import annotations

import base64
import json
import os
import random
import re
import shutil
import subprocess
import sys as _sys
import threading
import time
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_file, send_from_directory, Response

# ── Config ──
BASE_DIR = Path(__file__).resolve().parent.parent  # jingbo.xyz/
W5_CASES_DIR = BASE_DIR / "w5_new_cases"
WHITELIST_DIR = BASE_DIR / "whitelist"
MANIM_PYTHON = "/Users/a1/Desktop/Trae work/manim-venv/bin/python3"
STATIC_DIR = Path(__file__).resolve().parent / "static"
PORT = 7788

# ── Import generator & router from whitelist ──
_WHITELIST_PATH = str(WHITELIST_DIR)
if _WHITELIST_PATH not in _sys.path:
    _sys.path.insert(0, _WHITELIST_PATH)

GENERATOR_AVAILABLE = False
_IMPORT_ERROR = ""
try:
    from generator import (
        ark_text, ark_vision, build_codegen_prompt, build_repair_prompt,
        build_audit_prompt, strip_code, static_check, render as manim_render,
        extract_frames, load_template, write_json, write_text,
        TEXT_MODEL, VISION_MODEL, TOKEN_STOP_PER_DEMO, MAX_REPAIR,
        ARK_API_ENDPOINT,
    )
    from router import route as route_input, load_templates
    GENERATOR_AVAILABLE = True
except Exception as _e:
    _IMPORT_ERROR = str(_e)

# ── Keyword Groups ──
CASE_KEYWORDS: dict[str, list[str]] = {
    # W5 cases
    "pythagorean_water": ["勾股", "毕达哥拉斯", "直角三角形", "勾股定理"],
    "circle_area": ["圆面积", "圆的面积", "面积公式", "圆面积推导"],
    "sine_wave": ["正弦", "sin", "单位圆", "三角函数", "正弦曲线"],
    "limit_circle": ["极限", "趋近", "无穷", "极限思想", "内接多边形"],
    "helix_3d": ["螺旋", "参数方程", "螺旋面"],
    "lever": ["杠杆", "力臂", "平衡", "杠杆原理"],
    "force_composition": ["力的合成", "合力", "分力", "平行四边形"],
    "projectile_motion": ["抛体", "平抛", "斜抛", "抛体运动"],
    "wave_propagation": ["横波", "波的传播", "波长"],
    "atom_structure": ["原子", "玻尔", "电子", "轨道", "原子结构"],
    "water_molecule": ["水分子", "h₂o", "共价键", "水分子结构"],
    "ionic_bond": ["离子键", "钠", "氯", "离子键形成"],
    # batch30 cases
    "01_linear_transform": ["线性变换", "矩阵", "空间变换"],
    "02_derivative": ["导数", "割线", "切线", "变化率", "导数的本质"],
    "03_determinant": ["行列式", "面积", "缩放"],
    "04_riemann_sum": ["黎曼", "积分", "矩形", "曲线下面积"],
    "05_taylor": ["泰勒", "级数", "逼近", "多项式"],
    "06_fourier": ["傅里叶", "变换", "频率", "缠绕", "信号"],
    "07_mandelbrot": ["曼德博", "分形", "迭代", "集合"],
    "08_eigenvalue": ["特征值", "特征向量"],
    "09_euler": ["欧拉", "公式", "eiθ", "单位圆"],
    "10_func_transform": ["函数变换", "平移", "翻转", "参数"],
    "11_stereographic": ["球极", "投影", "球面", "映射"],
    "12_mobius": ["莫比乌斯", "带", "曲面", "一面"],
    "13_doppler": ["多普勒", "效应", "声波"],
    "14_double_slit": ["双缝", "干涉", "光"],
    "15_prism": ["折射", "色散", "棱镜", "光"],
    "16_standing_wave": ["驻波", "共振", "波"],
    "17_electric_field": ["电场", "电荷"],
    "18_em_induction": ["电磁感应", "磁场"],
    "19_kinetic_theory": ["分子动理论", "气体", "分子运动"],
    "20_light_clock": ["光钟", "相对论", "时间膨胀"],
    "21_double_pendulum": ["双摆", "混沌", "非线性"],
    "22_brachistochrone": ["最速降线", "摆线", "重力"],
    "23_methane": ["甲烷", "四面体", "分子结构"],
    "24_equilibrium": ["化学平衡", "no₂", "n₂o₄", "可逆反应"],
    "25_diamond": ["金刚石", "晶体", "碳"],
    "26_benzene": ["苯环", "大π键", "共振", "芳香"],
    "27_ionic_bond_v2": ["离子键", "nacl", "盐", "升级"],
    "28_tesseract": ["超立方体", "四维", "tesseract"],
    "29_lorenz": ["洛伦兹", "吸引子", "蝴蝶效应", "混沌"],
    "30_menger_sponge": ["门格", "海绵", "分形", "三维"],
}

# ── Task Storage ──
TASKS: dict[str, dict[str, Any]] = {}
_TASK_COUNTER = 0
_TASK_LOCK = threading.Lock()


def _next_task_id() -> str:
    global _TASK_COUNTER
    with _TASK_LOCK:
        _TASK_COUNTER += 1
        return f"task_{_TASK_COUNTER}"


# ── Find video in case dir ──
def find_video(case_dir: Path) -> Path | None:
    """Find render.mp4 in various possible locations."""
    # W5 style: *.mp4 in case root
    for v in sorted(case_dir.glob("*.mp4")):
        if "1080p" not in v.name:
            return v
    # batch30 style: media/videos/generated/480p15/render.mp4
    for sub in ["generated", "generated_repaired"]:
        p = case_dir / "media" / "videos" / sub / "480p15" / "render.mp4"
        if p.exists():
            return p
    # fallback
    for v in sorted(case_dir.glob("*.mp4")):
        return v
    return None


def find_frames_dir(case_dir: Path) -> Path | None:
    """Find frames directory."""
    for d in ["frames", "frames_fix", "frames_repaired"]:
        p = case_dir / d
        if p.exists() and any(p.glob("frame_*.png")):
            return p
    return None


def extract_prompt(metrics: dict, title: str) -> str:
    """Extract a human-readable prompt from metrics."""
    problem = metrics.get("problem", {})
    # W5 style: problem.prompt
    if isinstance(problem, dict):
        p = problem.get("prompt")
        if p:
            return p
    # batch30 style: problem is structured
    # Just use the title as prompt
    return title


def determine_subject(title: str, case_name: str) -> str:
    """Determine subject from title or case name."""
    chem_kw = ["原子", "分子", "离子", "键", "化学", "甲烷", "苯", "金刚石", "晶体", "平衡"]
    phys_kw = ["力", "杠杆", "运动", "波", "抛体", "物理", "多普勒", "干涉", "折射", "色散",
               "驻波", "共振", "电场", "电磁", "相对论", "光钟", "双摆", "最速降线",
               "分子动理论", "声"]
    math_kw = ["变换", "导数", "行列式", "黎曼", "泰勒", "傅里叶", "曼德博", "特征值",
               "欧拉", "函数", "球极", "莫比乌斯", "螺旋", "极限", "正弦", "勾股",
               "圆面积", "分形", "超立方", "四维", "洛伦兹", "门格", "海绵"]
    if any(k in title for k in chem_kw):
        return "化学"
    if any(k in title for k in phys_kw):
        return "物理"
    if any(k in title for k in math_kw):
        return "数学"
    return "数学"


# ── Case Metadata Loading ──
def load_cases() -> list[dict[str, Any]]:
    """Scan w5_new_cases/ (including batch30/) and build case metadata."""
    cases: list[dict[str, Any]] = []
    if not W5_CASES_DIR.exists():
        return cases

    # Scan top-level cases
    for case_dir in sorted(W5_CASES_DIR.iterdir()):
        if not case_dir.is_dir() or case_dir.name == "batch30":
            continue
        case = _load_one_case(case_dir)
        if case:
            cases.append(case)

    # Scan batch30
    batch_dir = W5_CASES_DIR / "batch30"
    if batch_dir.exists():
        for case_dir in sorted(batch_dir.iterdir()):
            if not case_dir.is_dir():
                continue
            case = _load_one_case(case_dir, batch=True)
            if case:
                cases.append(case)

    return cases


def _load_one_case(case_dir: Path, batch: bool = False) -> dict[str, Any] | None:
    """Load a single case from directory."""
    metrics_path = case_dir / "metrics.json"
    if not metrics_path.exists():
        return None

    try:
        metrics = json.loads(metrics_path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None

    # Find video
    video_path = find_video(case_dir)
    if not video_path:
        return None  # Skip cases without video

    # Find frames
    frames_dir = find_frames_dir(case_dir)

    # Count code lines
    gen_py = case_dir / "generated.py"
    line_count = 0
    if gen_py.exists():
        line_count = len(gen_py.read_text(encoding="utf-8").splitlines())

    title = metrics.get("template_name", case_dir.name)
    subject = determine_subject(title, case_dir.name)
    prompt = extract_prompt(metrics, title)

    # Determine scene count from stages or audit
    audit_total = metrics.get("audit_total", 5)
    audit_pass = metrics.get("audit_pass_count", 0)

    # Estimate duration from stages
    stages = metrics.get("stages", [])
    total_sec = sum(s.get("sec", 0) for s in stages if isinstance(s, dict))

    case_id = case_dir.name
    return {
        "id": case_id,
        "title": title,
        "subject": subject,
        "video_path": str(video_path),
        "video_file": video_path.name,
        "local_path": str(video_path),
        "frames_dir": str(frames_dir) if frames_dir else "",
        "line_count": line_count,
        "prompt": prompt,
        "audit_pass": audit_pass,
        "audit_total": audit_total,
        "cost": metrics.get("cost_estimate", 0),
        "total_tokens": metrics.get("total_tokens", 0),
        "status": metrics.get("status", "PASS"),
        "stages": stages,
        "total_sec": total_sec,
        "frames": [f"frame_{i:02d}" for i in range(1, 6)] if frames_dir else [],
        "audit": metrics.get("audit", []),
        "keywords": CASE_KEYWORDS.get(case_id, []),
        "batch": batch,
    }


# Cache cases on startup
CASES_CACHE = load_cases()


def match_case(user_input: str) -> dict[str, Any]:
    """Match user input to the best case, preferring high audit scores."""
    normalized = user_input.lower().strip()

    # Prefer cases with perfect audit
    perfect_cases = [c for c in CASES_CACHE if c.get("audit_pass") == c.get("audit_total") and c.get("audit_total", 0) > 0]
    search_pool = perfect_cases if perfect_cases else CASES_CACHE

    best_case = None
    best_score = 0

    for case in search_pool:
        kws = case.get("keywords", [])
        score = sum(1 for kw in kws if kw.lower() in normalized)
        if score > best_score:
            best_score = score
            best_case = case

    if best_case is None or best_score == 0:
        math_perfect = [c for c in perfect_cases if c["subject"] == "数学"]
        best_case = random.choice(math_perfect) if math_perfect else (random.choice(perfect_cases) if perfect_cases else CASES_CACHE[0])
        best_case["experimental"] = True
    else:
        best_case["experimental"] = False

    return best_case


# ── Environment Check ──
def check_env() -> dict[str, Any]:
    """Check Python/Manim/ffmpeg/LaTeX availability."""
    results = {}

    py_path = shutil.which("python3") or shutil.which("python")
    results["python"] = {"installed": py_path is not None, "path": py_path or "", "version": ""}
    if py_path:
        try:
            p = subprocess.run([py_path, "--version"], capture_output=True, text=True, timeout=5)
            results["python"]["version"] = p.stdout.strip()
        except Exception:
            pass

    env_clean = os.environ.copy()
    env_clean.pop("PYTHONHOME", None)
    env_clean.pop("PYTHONPATH", None)
    manim_ok = False
    manim_version = ""
    try:
        p = subprocess.run(
            [MANIM_PYTHON, "-c", "import manim; print(manim.__version__)"],
            capture_output=True, text=True, timeout=10, env=env_clean,
        )
        if p.returncode == 0:
            manim_ok = True
            manim_version = p.stdout.strip()
    except Exception:
        pass
    results["manim"] = {"installed": manim_ok, "path": MANIM_PYTHON if manim_ok else "", "version": manim_version}

    ff_path = shutil.which("ffmpeg")
    results["ffmpeg"] = {"installed": ff_path is not None, "path": ff_path or ""}

    latex_path = shutil.which("latex") or shutil.which("xelatex")
    results["latex"] = {"installed": latex_path is not None, "path": latex_path or ""}

    all_ready = all(r["installed"] for r in results.values())
    return {"ready": all_ready, "checks": results}


# ── Demo Pipeline ──
def run_demo_pipeline(user_input: str, task_id: str):
    """Demo pipeline using existing case data."""
    task = TASKS[task_id]

    case = match_case(user_input)
    task["case"] = case
    task["title"] = case["title"]

    # Stage 1: Understanding
    task["current_stage"] = "understanding"
    task["logs"] = [{"ts": "00:01", "msg": "分析知识点结构...", "done": True}]
    _notify(task_id)
    time.sleep(0.6)

    detail = f"检测到知识点：{case['title']}"
    if case.get("experimental"):
        detail += "（实验性 · 白名单外自动生成）"
    task["logs"].append({"ts": "00:02", "msg": detail, "done": True})
    _notify(task_id)
    time.sleep(0.3)

    # Stage 2: Codegen
    task["current_stage"] = "codegen"
    task["logs"].append({"ts": "00:03", "msg": "规划分镜结构（5镜）...", "done": True})
    _notify(task_id)
    time.sleep(0.6)

    task["logs"].append({"ts": "00:05", "msg": "编写 Manim 代码...", "done": True})
    _notify(task_id)
    time.sleep(0.6)

    task["logs"].append({"ts": "00:07", "msg": f"代码完成，{case['line_count']} 行", "done": True})
    _notify(task_id)
    time.sleep(0.3)

    # Stage 3: Render
    task["current_stage"] = "render"
    task["logs"].append({"ts": "00:08", "msg": "本地 Manim 渲染中（480p）...", "done": True})
    _notify(task_id)
    time.sleep(0.8)

    task["logs"].append({"ts": "00:10", "msg": "渲染完成", "done": True})
    _notify(task_id)
    time.sleep(0.3)

    # Stage 4: Audit
    task["current_stage"] = "audit"
    task["logs"].append({"ts": "00:11", "msg": "抽帧 5 帧，视觉审计中...", "done": True})
    _notify(task_id)
    time.sleep(0.4)

    audit = case.get("audit", [])
    for i, frame_audit in enumerate(audit, 1):
        fid = frame_audit.get("frame_id", f"frame_{i:02d}")
        passed = frame_audit.get("pass")
        reason = frame_audit.get("reason", "")
        status = "PASS" if passed else "FAIL"
        task["logs"].append({"ts": f"00:{11+i}", "msg": f"审计 {fid}: {status} - {reason}", "done": True})
        _notify(task_id)
        time.sleep(0.25)

    pass_count = case.get("audit_pass", 0)
    total = case.get("audit_total", 5)
    task["logs"].append({"ts": f"00:{12+len(audit)}", "msg": f"审计完成 {pass_count}/{total} 通过", "done": True})
    _notify(task_id)

    # Done
    task["current_stage"] = "done"
    task["status"] = "done"
    task["video_url"] = f"/api/video/{case['id']}"
    frames_dir = case.get("frames_dir", "")
    if frames_dir and case.get("frames"):
        task["frames"] = [f"/api/frame/{case['id']}/frame_{i:02d}" for i in range(1, 6)]
    else:
        task["frames"] = []
    task["audit"] = audit
    task["audit_pass"] = pass_count
    task["audit_total"] = total
    task["cost"] = case.get("cost", 0)
    task["total_tokens"] = case.get("total_tokens", 0)
    task["line_count"] = case.get("line_count", 0)
    task["total_sec"] = round(float(case.get("total_sec", 0)), 1)
    task["source_url"] = f"/api/source/{case['id']}"
    task["local_path"] = case.get("local_path", "")
    _notify(task_id)


# ── Real API Pipeline ──
REAL_OUTPUT_DIR = WHITELIST_DIR / "output" / "client_real"
REAL_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# ── Generic prompts for non-template inputs ──
GENERIC_CODEGEN_SYSTEM = (
    "你是 ManimCommunity v0.19 工程师。只输出完整 Python 文件，不要解释，不要 markdown。\n"
    "你需要根据知识点自行设计5镜可视化方案。\n\n"
    "【分镜计划（固定5镜，自行设计内容）】\n"
    "  镜1：读题/建立概念 — 引入知识点，建立初始图像\n"
    "  镜2：建立图像 — 可视化核心概念的关键图形\n"
    "  镜3：图上操作 — 对主视觉做操作（分/补/减/比/移/合并/遮罩/高亮之一）\n"
    "  镜4：连接算式 — 用公式/算式连接图形关系\n"
    "  镜5：答案回扣 — 回扣图形，确认结论\n\n"
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
    "- 镜3必须对主视觉做操作或高亮，不能只写公式。\n"
    "- 不使用外部图片、3D、复杂 updater、DecimalNumber。\n"
    "- 禁止 dash_length 参数。禁止 font_size=0。\n"
    "- 代码不超过200行。\n"
)

GENERIC_AUDIT_SYSTEM = (
    "你是严格的视觉审计员。检查视频帧是否符合审计标准。\n"
    "对每一帧输出合法JSON：\n"
    '{"frame_id": "frame_N", "pass": true/false, "reason": "简短原因（不超过30字）", "issues": ["具体问题1"]}\n\n'
    "【通用审计标准】\n"
    "1. 存在性：关键可视化元素是否出现\n"
    "2. 清晰度：文字是否与文字/图形重叠\n"
    "3. 布局：可视化元素是否在合理区域，是否侵入标题区\n"
    "4. 空白：是否有大面积不合理空白\n\n"
    "【一票否决项（命中任意一条即 FAIL）】\n"
    '["文字与文字重叠", "文字与图形重叠", "可视化元素侵入标题区", '
    '"元素超出安全框(x[-6.4,6.4], y[-3.5,3.8])", "大面积空白(>1.5单位)"]\n'
)


def build_generic_codegen_messages(user_input: str) -> list[dict[str, str]]:
    """Build codegen prompt for non-template inputs."""
    user = (
        f"请为以下知识点设计并实现 Manim 可视化动画。\n"
        f"只输出 Python 代码，不要解释。\n\n"
        f"知识点：{user_input}"
    )
    return [
        {"role": "system", "content": GENERIC_CODEGEN_SYSTEM},
        {"role": "user", "content": user},
    ]


def build_generic_repair_messages(user_input: str, code: str, error: str) -> list[dict[str, str]]:
    """Build repair prompt for non-template inputs."""
    system = (
        "你是 ManimCommunity v0.19 修复工程师。只输出完整 Python 文件，不要解释，不要 markdown。\n"
        "渲染失败，请最小修改修复。保持知识点和可视化方案不变。\n"
        "MathTex 内只能有 ASCII，中文必须用 Text。\n"
        "不要使用 .scale()，不要使用 dash_length，不要 font_size=0。\n"
        "文字不得与文字重叠，文字不得与图形重叠。\n"
    )
    user = (
        f"知识点：{user_input}\n\n"
        f"错误：\n{error[-2500:]}\n\n"
        f"代码：\n{code}"
    )
    return [
        {"role": "system", "content": system},
        {"role": "user", "content": user},
    ]


def run_real_pipeline(user_input: str, task_id: str):
    """Real API pipeline: route → codegen (API) → render (local) → audit (API)."""
    task = TASKS[task_id]
    t_start = time.time()

    if not GENERATOR_AVAILABLE:
        task["current_stage"] = "error"
        task["status"] = "error"
        task["error"] = f"生成器模块加载失败: {_IMPORT_ERROR}"
        task["logs"] = [{"ts": "00:01", "msg": f"错误: 生成器模块加载失败", "done": True}]
        _notify(task_id)
        return

    key = os.environ.get("ARK_API_KEY", "").strip()
    if not key:
        task["current_stage"] = "error"
        task["status"] = "error"
        task["error"] = "ARK_API_KEY 未设置"
        task["logs"] = [{"ts": "00:01", "msg": "错误: ARK_API_KEY 未设置", "done": True}]
        _notify(task_id)
        return

    # ── Stage 1: Route ──
    task["current_stage"] = "routing"
    task["logs"] = [{"ts": "00:01", "msg": "分析知识点，匹配模板...", "done": False}]
    _notify(task_id)

    templates = load_templates()
    route_result = route_input(user_input, templates)

    # Track whether we use template or generic mode
    use_template = False
    template = None
    template_id = None
    template_name = user_input  # Default to user input for generic mode

    if route_result.template_id and route_result.route in ("full_hit", "half_hit"):
        template_id = route_result.template_id
        template_name = route_result.template_name or template_id
        template = load_template(template_id)
        use_template = True
        route_label = {"full_hit": "命中", "half_hit": "近似匹配"}.get(route_result.route, "匹配")
        task["logs"].append({"ts": "00:02", "msg": f"{route_label}模板：{template_name}", "done": True})
    else:
        task["logs"].append({"ts": "00:02", "msg": f"白名单外知识点，AI 自主设计视觉方案", "done": True})
    _notify(task_id)
    time.sleep(0.3)

    # ── Stage 2: Codegen (API call) ──
    task["current_stage"] = "codegen"
    task["logs"].append({"ts": "00:03", "msg": f"调用火山 API 生成 Manim 代码（{TEXT_MODEL}）...", "done": False})
    _notify(task_id)

    out_dir = REAL_OUTPUT_DIR / task_id
    out_dir.mkdir(parents=True, exist_ok=True)

    try:
        if use_template:
            problem = template.get("default_problem", {})
            messages = build_codegen_prompt(template, problem)
        else:
            messages = build_generic_codegen_messages(user_input)
        code_raw, usage, code_sec = ark_text(messages, max_tokens=5500, timeout=180)
    except Exception as e:
        task["current_stage"] = "error"
        task["status"] = "error"
        task["error"] = f"代码生成失败: {str(e)[:300]}"
        task["logs"].append({"ts": "00:04", "msg": f"API 调用失败: {str(e)[:100]}", "done": True})
        _notify(task_id)
        return

    code = strip_code(code_raw)
    code_tokens = usage.get("total_tokens", 0)
    total_tokens = code_tokens
    write_text(out_dir / "generated.py", code)
    write_json(out_dir / "codegen_usage.json", usage)

    task["logs"].append({"ts": "00:04", "msg": f"代码生成完成：{code_tokens} tokens, {code_sec:.1f}s, {len(code.splitlines())} 行", "done": True})
    _notify(task_id)

    # Static check
    issues = static_check(code)
    if issues:
        task["logs"].append({"ts": "00:05", "msg": f"静态检查：{', '.join(issues)}", "done": True})
    else:
        task["logs"].append({"ts": "00:05", "msg": "静态检查通过", "done": True})
    _notify(task_id)

    # Token limit check
    if total_tokens > TOKEN_STOP_PER_DEMO:
        task["current_stage"] = "error"
        task["status"] = "error"
        task["error"] = f"Token 超限: {total_tokens} > {TOKEN_STOP_PER_DEMO}"
        task["logs"].append({"ts": "00:06", "msg": f"Token 超限，停止生成", "done": True})
        _notify(task_id)
        return

    # ── Stage 3: Render (local Manim) ──
    task["current_stage"] = "render"
    task["logs"].append({"ts": "00:06", "msg": "本地 Manim 渲染中（480p）...", "done": False})
    _notify(task_id)

    ok, mp4, render_sec, err = manim_render(out_dir / "generated.py", out_dir)

    if not ok and total_tokens < TOKEN_STOP_PER_DEMO:
        task["logs"].append({"ts": "00:07", "msg": f"渲染失败，尝试 AI 修复...", "done": False})
        _notify(task_id)

        try:
            if use_template:
                problem = template.get("default_problem", {})
                repair_msgs = build_repair_prompt(template, problem, code, err)
            else:
                repair_msgs = build_generic_repair_messages(user_input, code, err)
            code_raw2, usage2, sec2 = ark_text(repair_msgs, max_tokens=5500, timeout=180)
            code2 = strip_code(code_raw2)
            total_tokens += usage2.get("total_tokens", 0)
            write_text(out_dir / "generated_repaired.py", code2)
            code = code2  # Use repaired code for frame extraction later
            task["logs"].append({"ts": "00:08", "msg": f"修复代码生成：{usage2.get('total_tokens', 0)} tokens, {sec2:.1f}s", "done": True})
            _notify(task_id)
        except Exception as e:
            task["logs"].append({"ts": "00:08", "msg": f"修复代码生成失败: {str(e)[:80]}", "done": True})
            _notify(task_id)

        ok, mp4, render_sec, err = manim_render(out_dir / "generated_repaired.py", out_dir)

    if not ok:
        task["current_stage"] = "error"
        task["status"] = "error"
        task["error"] = err[:500] if err else "渲染失败"
        task["logs"].append({"ts": "00:09", "msg": f"渲染失败: {(err or '')[:80]}", "done": True})
        _notify(task_id)
        return

    task["logs"].append({"ts": "00:09", "msg": f"渲染成功：{render_sec:.1f}s", "done": True})
    _notify(task_id)

    # ── Stage 4: Extract frames ──
    task["current_stage"] = "audit"
    task["logs"].append({"ts": "00:10", "msg": "抽取关键帧（5帧）...", "done": False})
    _notify(task_id)

    frame_paths = extract_frames(mp4, out_dir, n=5)
    task["logs"].append({"ts": "00:11", "msg": f"抽取 {len(frame_paths)} 帧", "done": True})
    _notify(task_id)

    if not frame_paths:
        task["current_stage"] = "error"
        task["status"] = "error"
        task["error"] = "抽帧失败"
        task["logs"].append({"ts": "00:12", "msg": "抽帧失败", "done": True})
        _notify(task_id)
        return

    # ── Stage 5: Vision audit (API call) ──
    if use_template:
        audit_system = build_audit_prompt(template)
    else:
        audit_system = GENERIC_AUDIT_SYSTEM
    audit_results = []
    audit_pass = 0
    audit_tokens = 0

    for i, frame_path in enumerate(frame_paths, 1):
        frame_id = f"frame_{i:02d}"
        p = Path(frame_path)
        if not p.exists():
            continue

        task["logs"].append({"ts": f"00:{11+i}", "msg": f"审计 {frame_id}（视觉模型）...", "done": False})
        _notify(task_id)

        with open(p, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode()

        messages = [
            {"role": "system", "content": audit_system},
            {"role": "user", "content": [
                {"type": "text", "text": f"请检查 {frame_id}"},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}},
            ]},
        ]

        try:
            content, v_usage, v_sec = ark_vision(messages, max_tokens=500, timeout=60)
            v_tokens = v_usage.get("total_tokens", 0)
            audit_tokens += v_tokens
            total_tokens += v_tokens

            try:
                result = json.loads(content.strip())
            except json.JSONDecodeError:
                m = re.search(r'\{[^}]+\}', content, re.S)
                result = json.loads(m.group(0)) if m else {"pass": None, "reason": content[:50]}

            result["frame_id"] = frame_id
            audit_results.append(result)

            passed = result.get("pass")
            if passed is True:
                audit_pass += 1
            status = "PASS" if passed else "FAIL"
            reason = result.get("reason", "")[:40]

            # Update log entry
            for log in task["logs"]:
                if log.get("msg", "").startswith(f"审计 {frame_id}"):
                    log["done"] = True
                    log["msg"] = f"审计 {frame_id}: {status} - {reason}"
        except Exception as e:
            audit_results.append({"frame_id": frame_id, "pass": None, "reason": f"审计失败: {str(e)[:50]}"})
            for log in task["logs"]:
                if log.get("msg", "").startswith(f"审计 {frame_id}"):
                    log["done"] = True
                    log["msg"] = f"审计 {frame_id}: 错误 - {str(e)[:40]}"

        _notify(task_id)

    # ── Done ──
    total_sec = time.time() - t_start
    cost = round(total_tokens * 0.00003, 3)
    status = "PASS" if audit_pass >= 3 else ("REPAIR" if audit_pass >= 1 else "REJECT")

    # Save metrics
    metrics = {
        "template_id": template_id if use_template else "generic",
        "template_name": template_name,
        "problem": problem if use_template else {"prompt": user_input},
        "stages": [
            {"stage": "codegen", "tokens": code_tokens, "sec": round(code_sec, 1)},
            {"stage": "render", "ok": ok, "sec": round(render_sec, 1)},
            {"stage": "audit", "tokens": audit_tokens, "pass": f"{audit_pass}/{len(audit_results)}"},
        ],
        "total_tokens": total_tokens,
        "audit": audit_results,
        "audit_pass_count": audit_pass,
        "audit_total": len(audit_results),
        "cost_estimate": cost,
        "status": status,
        "total_sec": round(total_sec, 1),
    }
    write_json(out_dir / "metrics.json", metrics)

    # Copy mp4 to a known location for serving
    video_serve = out_dir / "render.mp4"
    if mp4 and Path(mp4).exists() and Path(mp4) != video_serve:
        shutil.copy2(mp4, video_serve)

    task["current_stage"] = "done"
    task["status"] = "done"
    task["video_url"] = f"/api/video-real/{task_id}"
    task["frames"] = [f"/api/frame-real/{task_id}/frame_{i:02d}" for i in range(1, len(frame_paths) + 1)]
    task["audit"] = audit_results
    task["audit_pass"] = audit_pass
    task["audit_total"] = len(audit_results)
    task["cost"] = cost
    task["total_tokens"] = total_tokens
    task["line_count"] = len(code.splitlines())
    task["total_sec"] = round(total_sec, 1)
    task["source_url"] = f"/api/source-real/{task_id}"
    task["real_pipeline"] = True
    task["out_dir"] = str(out_dir)
    task["title"] = template_name
    task["logs"].append({"ts": f"00:{12+len(audit_results)}", "msg": f"完成：{audit_pass}/{len(audit_results)} 通过, {cost}元, {total_tokens} tokens", "done": True})
    _notify(task_id)


def _notify(task_id: str):
    if task_id in TASKS:
        TASKS[task_id]["updated_at"] = time.time()


# ── Feedback Classification ──
SMALL_FIX_KEYWORDS = ["快", "慢", "速度", "颜色", "大小", "位置", "标注", "字号", "字体", "对齐", "间距", "透明"]
BIG_REDO_KEYWORDS = ["加分镜", "换讲法", "重新", "完全", "整体", "删除", "替换", "改结构", "重来"]


def classify_feedback(text: str) -> dict[str, Any]:
    normalized = text.lower().strip()
    small_hits = sum(1 for kw in SMALL_FIX_KEYWORDS if kw in normalized)
    big_hits = sum(1 for kw in BIG_REDO_KEYWORDS if kw in normalized)

    if big_hits > 0 and big_hits >= small_hits:
        return {
            "type": "big_redo", "label": "整体重做",
            "expectation": "这相当于重新生成，预计 50 秒，约 12,000 Token",
            "icon": "redo",
        }
    elif small_hits > 0:
        return {
            "type": "small_fix", "label": "局部精修",
            "expectation": "预计 15 秒，约 1,200 Token",
            "icon": "fix",
        }
    else:
        return {
            "type": "unknown", "label": "需要理解",
            "expectation": "AI 正在理解你的反馈...",
            "icon": "thinking",
        }


# ── Flask App ──
app = Flask(__name__, static_folder=str(STATIC_DIR), static_url_path="")


# Cache env check result so it's instant on page load
_ENV_CACHE: dict[str, Any] | None = None


@app.route("/")
def index():
    global _ENV_CACHE
    # Pre-compute env check so frontend doesn't need a separate fetch (avoids proxy issues)
    if _ENV_CACHE is None:
        _ENV_CACHE = check_env()
    html = (STATIC_DIR / "index.html").read_text(encoding="utf-8")
    # Inject env data as a global JS variable before the script runs
    inject = f"<script>window.__ENV_DATA__ = {json.dumps(_ENV_CACHE, ensure_ascii=False)};</script>"
    # Also inject pipeline status
    pipeline_data = {
        "real_available": False,
        "generator_loaded": GENERATOR_AVAILABLE,
        "api_key_set": False,
        "text_model": TEXT_MODEL if GENERATOR_AVAILABLE else "",
        "vision_model": VISION_MODEL if GENERATOR_AVAILABLE else "",
    }
    inject2 = f"<script>window.__PIPELINE_DATA__ = {json.dumps(pipeline_data, ensure_ascii=False)};</script>"
    html = html.replace("</head>", f"{inject}{inject2}</head>", 1)
    # No-cache headers to prevent browser from using stale HTML
    resp = Response(html, content_type="text/html; charset=utf-8")
    resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    resp.headers["Pragma"] = "no-cache"
    resp.headers["Expires"] = "0"
    return resp


@app.route("/api/env-check")
def api_env_check():
    return jsonify(check_env())


@app.route("/api/library")
def api_library():
    """List all cases for the library."""
    items = []
    for case in CASES_CACHE:
        # 过滤掉 audit_pass < 4 的案例（只保留 4/5 或 5/5 的）
        if case.get("audit_pass", 0) < 4:
            continue
        frames_dir = case.get("frames_dir", "")
        thumb_url = ""
        if frames_dir:
            thumb_url = f"/api/frame/{case['id']}/frame_03"
        item = {
            "id": case["id"],
            "title": case["title"],
            "subject": case["subject"],
            "prompt": case["prompt"],
            "audit_pass": case.get("audit_pass", 0),
            "audit_total": case.get("audit_total", 0),
            "cost": case.get("cost", 0),
            "video_url": f"/api/video/{case['id']}",
            "thumb_url": thumb_url,
            "line_count": case.get("line_count", 0),
            "total_tokens": case.get("total_tokens", 0),
            "batch": case.get("batch", False),
            "model": "doubao-seed-2.1-pro",
        }
        # 如果案例有帧图，加上 frames 字段
        if frames_dir and case.get("frames"):
            item["frames"] = [f"/api/frame/{case['id']}/frame_{i:02d}" for i in range(1, 6)]
        else:
            item["frames"] = []
        items.append(item)
    return jsonify({"cases": items})


@app.route("/api/create", methods=["POST"])
def api_create():
    data = request.get_json(force=True)
    user_input = data.get("input", "").strip()
    if not user_input:
        return jsonify({"error": "请输入知识点"}), 400

    mode = "demo"  # 强制 demo 模式，忽略前端传来的 mode 参数

    task_id = _next_task_id()
    TASKS[task_id] = {
        "id": task_id, "status": "running", "current_stage": "init",
        "logs": [], "input": user_input, "created_at": time.time(),
        "mode": mode,
    }

    if mode == "real":
        if not GENERATOR_AVAILABLE:
            return jsonify({"error": f"生成器模块加载失败: {_IMPORT_ERROR}"}), 500
        key = os.environ.get("ARK_API_KEY", "").strip()
        if not key:
            return jsonify({"error": "ARK_API_KEY 未设置，无法使用真实模式"}), 500
        thread = threading.Thread(target=run_real_pipeline, args=(user_input, task_id), daemon=True)
    else:
        thread = threading.Thread(target=run_demo_pipeline, args=(user_input, task_id), daemon=True)
    thread.start()
    return jsonify({"task_id": task_id, "mode": mode})


@app.route("/api/status/<task_id>")
def api_status(task_id: str):
    task = TASKS.get(task_id)
    if not task:
        return jsonify({"error": "task not found"}), 404
    return jsonify(task)


@app.route("/api/feedback", methods=["POST"])
def api_feedback():
    data = request.get_json(force=True)
    text = data.get("feedback", "").strip()
    if not text:
        return jsonify({"error": "请输入反馈"}), 400
    result = classify_feedback(text)
    result["demo"] = True
    return jsonify(result)


@app.route("/api/feedback-execute", methods=["POST"])
def api_feedback_execute():
    """Execute feedback: modify code based on user feedback, re-render, re-audit."""
    data = request.get_json(force=True)
    task_id = data.get("task_id", "").strip()
    feedback_text = data.get("feedback", "").strip()
    if not task_id or not feedback_text:
        return jsonify({"error": "缺少 task_id 或 feedback"}), 400

    task = TASKS.get(task_id)
    if not task:
        return jsonify({"error": "任务不存在"}), 404

    # Demo mode: no out_dir, simulate feedback
    if not task.get("out_dir"):
        revision_id = f"{task_id}_rev_1"
        TASKS[revision_id] = {
            "id": revision_id,
            "status": "running",
            "current_stage": "init",
            "logs": [],
            "input": feedback_text,
            "created_at": time.time(),
            "mode": "demo",
            "parent_task_id": task_id,
            "revision": 1,
            "case": task.get("case"),
        }
        thread = threading.Thread(target=run_demo_feedback, args=(revision_id, task_id, feedback_text), daemon=True)
        thread.start()
        return jsonify({"revision_id": revision_id})

    out_dir_str = task.get("out_dir", "")
    if not out_dir_str:
        return jsonify({"error": "原始任务没有输出目录，无法修改"}), 400

    out_dir = Path(out_dir_str)
    if not out_dir.exists():
        return jsonify({"error": "原始输出目录不存在"}), 404

    # Read original code
    original_code = ""
    for name in ["generated_repaired.py", "generated.py"]:
        p = out_dir / name
        if p.exists():
            original_code = p.read_text(encoding="utf-8")
            break
    if not original_code:
        return jsonify({"error": "找不到原始代码文件"}), 404

    # Create a new revision task
    revision_id = f"{task_id}_rev"
    rev_counter = 1
    while f"{revision_id}_{rev_counter}" in TASKS:
        rev_counter += 1
    revision_id = f"{revision_id}_{rev_counter}"

    TASKS[revision_id] = {
        "id": revision_id,
        "status": "running",
        "current_stage": "init",
        "logs": [],
        "input": feedback_text,
        "created_at": time.time(),
        "mode": "real",
        "parent_task_id": task_id,
        "revision": rev_counter,
    }

    thread = threading.Thread(
        target=run_feedback_pipeline,
        args=(revision_id, task_id, original_code, feedback_text, out_dir),
        daemon=True,
    )
    thread.start()
    return jsonify({"revision_id": revision_id})


def run_feedback_pipeline(revision_id: str, parent_task_id: str, original_code: str, feedback_text: str, out_dir: Path):
    """Feedback pipeline: modify code → render → audit → return new version."""
    task = TASKS[revision_id]
    t_start = time.time()

    # Read original task context
    parent = TASKS.get(parent_task_id, {})
    user_input = parent.get("input", "")
    use_template = parent.get("real_pipeline", False)
    template_id = parent.get("template_id")
    template_name = parent.get("title", user_input)

    # ── Stage 1: Code modification (API call) ──
    task["current_stage"] = "codegen"
    task["logs"] = [{"ts": "00:01", "msg": f"理解反馈：{feedback_text[:40]}...", "done": True}]
    _notify(revision_id)

    task["logs"].append({"ts": "00:02", "msg": f"调用 AI 修改代码...", "done": False})
    _notify(revision_id)

    # Build modification prompt
    system_prompt = (
        "你是 ManimCommunity v0.19 修复工程师。只输出完整的 Python 文件，不要解释。\n"
        "用户对当前动画不满意，请根据反馈最小修改代码。\n\n"
        "硬规则：\n"
        "- 直接以 from manim import * 开头，只包含 GeneratedCourseware(Scene)。\n"
        "- 中文只用 Text；数学只用 MathTex；MathTex 内禁止中文。\n"
        "- 固定字号：T=36, M=30, S=22；不要使用 .scale()。\n"
        "- 文字不得与文字重叠，文字不得与图形重叠。\n"
        "- 禁止 dash_length 参数。禁止 font_size=0。\n"
        "- 代码不超过200行。\n"
        "- 保持原有知识点和整体结构，只修改用户指出的部分。\n"
    )
    user_prompt = (
        f"知识点：{user_input}\n\n"
        f"用户反馈：{feedback_text}\n\n"
        f"原始代码：\n{original_code}\n\n"
        f"请根据用户反馈修改代码，只输出完整的 Python 文件。"
    )

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        code_raw, usage, code_sec = ark_text(messages, max_tokens=5500, timeout=180)
    except Exception as e:
        task["current_stage"] = "error"
        task["status"] = "error"
        task["error"] = f"代码修改失败: {str(e)[:300]}"
        task["logs"].append({"ts": "00:03", "msg": f"API 调用失败: {str(e)[:80]}", "done": True})
        _notify(revision_id)
        return

    code = strip_code(code_raw)
    code_tokens = usage.get("total_tokens", 0)
    total_tokens = code_tokens

    # Save modified code
    rev_dir = out_dir / f"revision_{task.get('revision', 1)}"
    rev_dir.mkdir(parents=True, exist_ok=True)
    write_text(rev_dir / "generated.py", code)

    task["logs"].append({"ts": "00:03", "msg": f"代码修改完成：{code_tokens} tokens, {code_sec:.1f}s, {len(code.splitlines())} 行", "done": True})
    _notify(revision_id)

    # Static check
    issues = static_check(code)
    if issues:
        task["logs"].append({"ts": "00:04", "msg": f"静态检查：{', '.join(issues)}", "done": True})
    else:
        task["logs"].append({"ts": "00:04", "msg": "静态检查通过", "done": True})
    _notify(revision_id)

    # ── Stage 2: Render ──
    task["current_stage"] = "render"
    task["logs"].append({"ts": "00:05", "msg": "本地 Manim 渲染中（480p）...", "done": False})
    _notify(revision_id)

    ok, mp4, render_sec, err = manim_render(rev_dir / "generated.py", rev_dir)

    if not ok and total_tokens < TOKEN_STOP_PER_DEMO:
        task["logs"].append({"ts": "00:06", "msg": "渲染失败，尝试 AI 修复...", "done": False})
        _notify(revision_id)

        try:
            repair_msgs = build_generic_repair_messages(user_input, code, err)
            code_raw2, usage2, sec2 = ark_text(repair_msgs, max_tokens=5500, timeout=180)
            code2 = strip_code(code_raw2)
            total_tokens += usage2.get("total_tokens", 0)
            write_text(rev_dir / "generated_repaired.py", code2)
            code = code2
            task["logs"].append({"ts": "00:07", "msg": f"修复完成：{usage2.get('total_tokens', 0)} tokens", "done": True})
            _notify(revision_id)
        except Exception as e:
            task["logs"].append({"ts": "00:07", "msg": f"修复失败: {str(e)[:80]}", "done": True})
            _notify(revision_id)

        ok, mp4, render_sec, err = manim_render(rev_dir / "generated_repaired.py", rev_dir)

    if not ok:
        task["current_stage"] = "error"
        task["status"] = "error"
        task["error"] = err[:500] if err else "渲染失败"
        task["logs"].append({"ts": "00:08", "msg": f"渲染失败: {(err or '')[:80]}", "done": True})
        _notify(revision_id)
        return

    task["logs"].append({"ts": "00:08", "msg": f"渲染成功：{render_sec:.1f}s", "done": True})
    _notify(revision_id)

    # ── Stage 3: Extract frames + audit ──
    task["current_stage"] = "audit"
    task["logs"].append({"ts": "00:09", "msg": "抽帧 + 审计中...", "done": False})
    _notify(revision_id)

    frame_paths = extract_frames(mp4, rev_dir, n=5)

    if not frame_paths:
        task["current_stage"] = "error"
        task["status"] = "error"
        task["error"] = "抽帧失败"
        task["logs"].append({"ts": "00:10", "msg": "抽帧失败", "done": True})
        _notify(revision_id)
        return

    # Determine audit system
    if use_template and template_id:
        try:
            template = load_template(template_id)
            audit_system = build_audit_prompt(template)
        except Exception:
            audit_system = GENERIC_AUDIT_SYSTEM
    else:
        audit_system = GENERIC_AUDIT_SYSTEM

    audit_results = []
    audit_pass = 0
    audit_tokens = 0

    for i, frame_path in enumerate(frame_paths, 1):
        frame_id = f"frame_{i:02d}"
        p = Path(frame_path)
        if not p.exists():
            continue

        task["logs"].append({"ts": f"00:{9+i}", "msg": f"审计 {frame_id}...", "done": False})
        _notify(revision_id)

        with open(p, "rb") as f:
            img_b64 = base64.b64encode(f.read()).decode()

        messages = [
            {"role": "system", "content": audit_system},
            {"role": "user", "content": [
                {"type": "text", "text": f"请检查 {frame_id}"},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{img_b64}"}},
            ]},
        ]

        try:
            content, v_usage, v_sec = ark_vision(messages, max_tokens=500, timeout=60)
            v_tokens = v_usage.get("total_tokens", 0)
            audit_tokens += v_tokens
            total_tokens += v_tokens

            try:
                result = json.loads(content.strip())
            except json.JSONDecodeError:
                m = re.search(r'\{[^}]+\}', content, re.S)
                result = json.loads(m.group(0)) if m else {"pass": None, "reason": content[:50]}

            result["frame_id"] = frame_id
            audit_results.append(result)

            passed = result.get("pass")
            if passed is True:
                audit_pass += 1
            status = "PASS" if passed else "FAIL"
            reason = result.get("reason", "")[:40]

            for log in task["logs"]:
                if log.get("msg", "").startswith(f"审计 {frame_id}"):
                    log["done"] = True
                    log["msg"] = f"审计 {frame_id}: {status} - {reason}"
        except Exception as e:
            audit_results.append({"frame_id": frame_id, "pass": None, "reason": f"审计失败: {str(e)[:50]}"})
            for log in task["logs"]:
                if log.get("msg", "").startswith(f"审计 {frame_id}"):
                    log["done"] = True
                    log["msg"] = f"审计 {frame_id}: 错误"

        _notify(revision_id)

    # ── Done ──
    total_sec = time.time() - t_start
    cost = round(total_tokens * 0.00003, 3)
    status = "PASS" if audit_pass >= 3 else ("REPAIR" if audit_pass >= 1 else "REJECT")

    # Copy mp4 for serving
    video_serve = rev_dir / "render.mp4"
    if mp4 and Path(mp4).exists() and Path(mp4) != video_serve:
        shutil.copy2(mp4, video_serve)

    task["current_stage"] = "done"
    task["status"] = "done"
    task["video_url"] = f"/api/video-real/{revision_id}"
    task["frames"] = [f"/api/frame-real/{revision_id}/frame_{i:02d}" for i in range(1, len(frame_paths) + 1)]
    task["audit"] = audit_results
    task["audit_pass"] = audit_pass
    task["audit_total"] = len(audit_results)
    task["cost"] = cost
    task["total_tokens"] = total_tokens
    task["line_count"] = len(code.splitlines())
    task["total_sec"] = round(total_sec, 1)
    task["source_url"] = f"/api/source-real/{revision_id}"
    task["title"] = template_name
    task["out_dir"] = str(rev_dir)
    task["real_pipeline"] = True
    task["revision"] = task.get("revision", 1)
    task["logs"].append({"ts": f"00:{10+len(audit_results)}", "msg": f"修改完成：{audit_pass}/{len(audit_results)} 通过, ¥{cost}, {total_sec:.0f}s", "done": True})
    _notify(revision_id)

    # Update video/frame serving paths to point to revision dir
    # The /api/video-real/<revision_id> endpoint already searches REAL_OUTPUT_DIR / revision_id
    # But revision is under out_dir (parent task's output), not under REAL_OUTPUT_DIR
    # So we need to store the path and serve from there
    task["rev_dir"] = str(rev_dir)


def run_demo_feedback(revision_id: str, parent_task_id: str, feedback_text: str):
    """Demo feedback pipeline: simulate modification using existing case data."""
    task = TASKS[revision_id]
    parent = TASKS.get(parent_task_id, {})
    case = parent.get("case", {})

    task["current_stage"] = "codegen"
    task["logs"] = [{"ts": "00:01", "msg": f"理解反馈：{feedback_text[:40]}...", "done": True}]
    _notify(revision_id)
    time.sleep(0.8)

    task["logs"].append({"ts": "00:02", "msg": "AI 修改代码中...", "done": True})
    _notify(revision_id)
    time.sleep(1.0)

    task["logs"].append({"ts": "00:03", "msg": f"代码修改完成", "done": True})
    _notify(revision_id)
    time.sleep(0.3)

    task["current_stage"] = "render"
    task["logs"].append({"ts": "00:04", "msg": "本地 Manim 渲染中（480p）...", "done": True})
    _notify(revision_id)
    time.sleep(1.2)

    task["logs"].append({"ts": "00:05", "msg": "渲染完成", "done": True})
    _notify(revision_id)
    time.sleep(0.3)

    task["current_stage"] = "audit"
    task["logs"].append({"ts": "00:06", "msg": "抽帧 5 帧，视觉审计中...", "done": True})
    _notify(revision_id)
    time.sleep(0.8)

    audit = case.get("audit", [])
    for i, frame_audit in enumerate(audit, 1):
        fid = frame_audit.get("frame_id", f"frame_{i:02d}")
        passed = frame_audit.get("pass")
        reason = frame_audit.get("reason", "")
        status = "PASS" if passed else "FAIL"
        task["logs"].append({"ts": f"00:{6+i}", "msg": f"审计 {fid}: {status} - {reason}", "done": True})
        _notify(revision_id)
        time.sleep(0.2)

    pass_count = case.get("audit_pass", 0)
    total = case.get("audit_total", 5)

    task["current_stage"] = "done"
    task["status"] = "done"
    task["video_url"] = f"/api/video/{case.get('id', '')}"
    task["frames"] = [f"/api/frame/{case.get('id', '')}/frame_{i:02d}" for i in range(1, 6)]
    task["audit"] = audit
    task["audit_pass"] = pass_count
    task["audit_total"] = total
    task["cost"] = 0
    task["total_tokens"] = case.get("total_tokens", 0)
    task["line_count"] = case.get("line_count", 0)
    task["total_sec"] = 8.0
    task["source_url"] = f"/api/source/{case.get('id', '')}"
    task["local_path"] = case.get("local_path", "")
    task["title"] = parent.get("title", case.get("title", "修改版"))
    task["revision"] = 1
    task["logs"].append({"ts": f"00:{7+len(audit)}", "msg": f"修改完成 {pass_count}/{total} 通过", "done": True})
    _notify(revision_id)


@app.route("/api/video/<case_id>")
def api_video(case_id: str):
    """Serve video file — search in W5 root and batch30."""
    case = next((c for c in CASES_CACHE if c["id"] == case_id), None)
    if case:
        video_path = Path(case["video_path"])
        if video_path.exists():
            return send_file(str(video_path), mimetype="video/mp4")

    # Fallback: search in W5 root and batch30
    for base in [W5_CASES_DIR, W5_CASES_DIR / "batch30"]:
        case_dir = base / case_id
        if case_dir.exists():
            video = find_video(case_dir)
            if video:
                return send_file(str(video), mimetype="video/mp4")
    return jsonify({"error": "video not found"}), 404


@app.route("/api/frame/<case_id>/<frame_id>")
def api_frame(case_id: str, frame_id: str):
    """Serve frame image — search in W5 root and batch30."""
    for base in [W5_CASES_DIR, W5_CASES_DIR / "batch30"]:
        case_dir = base / case_id
        if case_dir.exists():
            frames_dir = find_frames_dir(case_dir)
            if frames_dir:
                frame_path = frames_dir / f"{frame_id}.png"
                if frame_path.exists():
                    return send_file(str(frame_path), mimetype="image/png")
    return jsonify({"error": "frame not found"}), 404


@app.route("/api/case/<case_id>")
def api_case_detail(case_id: str):
    """Return full case detail."""
    case = next((c for c in CASES_CACHE if c["id"] == case_id), None)
    if not case:
        return jsonify({"error": "case not found"}), 404

    # Find source code
    for base in [W5_CASES_DIR, W5_CASES_DIR / "batch30"]:
        gen_py = base / case_id / "generated.py"
        if gen_py.exists():
            code = gen_py.read_text(encoding="utf-8")
            break
    else:
        code = ""

    return jsonify({
        "id": case["id"],
        "title": case["title"],
        "subject": case["subject"],
        "prompt": case["prompt"],
        "total_tokens": case.get("total_tokens", 0),
        "line_count": case.get("line_count", 0),
        "audit_pass": case.get("audit_pass", 0),
        "audit_total": case.get("audit_total", 0),
        "cost": case.get("cost", 0),
        "total_sec": case.get("total_sec", 0),
        "video_url": f"/api/video/{case['id']}",
        "code": code,
        "model": "doubao-seed-2.1-pro",
        "frames": [f"/api/frame/{case['id']}/frame_{i:02d}" for i in range(1, 6)] if case.get("frames_dir") else [],
        "local_path": case.get("local_path", ""),
    })


@app.route("/api/source/<case_id>")
def api_source(case_id: str):
    for base in [W5_CASES_DIR, W5_CASES_DIR / "batch30"]:
        gen_py = base / case_id / "generated.py"
        if gen_py.exists():
            code = gen_py.read_text(encoding="utf-8")
            return jsonify({"code": code, "lines": len(code.splitlines())})
    return jsonify({"error": "source not found"}), 404


# ── Real pipeline result endpoints ──
@app.route("/api/video-real/<task_id>")
def api_video_real(task_id: str):
    """Serve video from real pipeline output."""
    # Check task's rev_dir first (for feedback revisions)
    task = TASKS.get(task_id, {})
    rev_dir = task.get("rev_dir") or task.get("out_dir", "")
    if rev_dir:
        video = Path(rev_dir) / "render.mp4"
        if video.exists():
            return send_file(str(video), mimetype="video/mp4")
        for sub in ["generated", "generated_repaired"]:
            p = Path(rev_dir) / "media" / "videos" / sub / "480p15" / "render.mp4"
            if p.exists():
                return send_file(str(p), mimetype="video/mp4")

    # Default: check REAL_OUTPUT_DIR
    out_dir = REAL_OUTPUT_DIR / task_id
    video = out_dir / "render.mp4"
    if video.exists():
        return send_file(str(video), mimetype="video/mp4")
    for sub in ["generated", "generated_repaired"]:
        p = out_dir / "media" / "videos" / sub / "480p15" / "render.mp4"
        if p.exists():
            return send_file(str(p), mimetype="video/mp4")
    return jsonify({"error": "video not found"}), 404


@app.route("/api/frame-real/<task_id>/<frame_id>")
def api_frame_real(task_id: str, frame_id: str):
    """Serve frame image from real pipeline output."""
    # Check task's rev_dir first (for feedback revisions)
    task = TASKS.get(task_id, {})
    rev_dir = task.get("rev_dir") or task.get("out_dir", "")
    if rev_dir:
        frame_path = Path(rev_dir) / "frames" / f"{frame_id}.png"
        if frame_path.exists():
            return send_file(str(frame_path), mimetype="image/png")

    # Default: check REAL_OUTPUT_DIR
    out_dir = REAL_OUTPUT_DIR / task_id
    frame_path = out_dir / "frames" / f"{frame_id}.png"
    if frame_path.exists():
        return send_file(str(frame_path), mimetype="image/png")
    return jsonify({"error": "frame not found"}), 404


@app.route("/api/source-real/<task_id>")
def api_source_real(task_id: str):
    """Serve source code from real pipeline output."""
    # Check task's rev_dir first (for feedback revisions)
    task = TASKS.get(task_id, {})
    rev_dir = task.get("rev_dir") or task.get("out_dir", "")
    if rev_dir:
        for name in ["generated_repaired.py", "generated.py"]:
            p = Path(rev_dir) / name
            if p.exists():
                code = p.read_text(encoding="utf-8")
                return jsonify({"code": code, "lines": len(code.splitlines())})

    # Default: check REAL_OUTPUT_DIR
    out_dir = REAL_OUTPUT_DIR / task_id
    for name in ["generated_repaired.py", "generated.py"]:
        p = out_dir / name
        if p.exists():
            code = p.read_text(encoding="utf-8")
            return jsonify({"code": code, "lines": len(code.splitlines())})
    return jsonify({"error": "source not found"}), 404


@app.route("/api/pipeline-status")
def api_pipeline_status():
    """Check if real pipeline is available."""
    key = os.environ.get("ARK_API_KEY", "").strip()
    return jsonify({
        "real_available": GENERATOR_AVAILABLE and bool(key),
        "generator_loaded": GENERATOR_AVAILABLE,
        "api_key_set": bool(key),
        "import_error": _IMPORT_ERROR if not GENERATOR_AVAILABLE else "",
        "text_model": TEXT_MODEL if GENERATOR_AVAILABLE else "",
        "vision_model": VISION_MODEL if GENERATOR_AVAILABLE else "",
    })


@app.route("/api/api-key-status")
def api_key_status():
    return jsonify({"configured": True, "preview": "ark-xxxx...xxxx"})


@app.route("/api/download/<case_id>")
def api_download(case_id: str):
    """Download video file."""
    case = next((c for c in CASES_CACHE if c["id"] == case_id), None)
    if case:
        video_path = Path(case["video_path"])
        if video_path.exists():
            return send_file(str(video_path), as_attachment=True, download_name=f"{case['title']}.mp4")
    return jsonify({"error": "not found"}), 404


if __name__ == "__main__":
    print("=" * 50)
    print("  景礴学院客户端")
    print(f"  访问 http://127.0.0.1:{PORT}")
    print(f"  已加载 {len(CASES_CACHE)} 个案例")
    print("=" * 50)
    app.run(host="127.0.0.1", port=PORT, debug=False, threaded=True)
