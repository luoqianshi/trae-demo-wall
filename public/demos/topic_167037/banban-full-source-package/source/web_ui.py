"""
伴伴 - Web UI 服务器
轻量 Flask 服务，提供温暖的交互界面
"""
import json
import os
import socket
import uuid
import threading
import time as _time
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory, Response
from companion import Companion
from companion_db import Database, Alarm, Reminder, Task
from xunfei_asr import xunfei_asr
from aliyun_asr import aliyun_asr
from voice_input import voice_input

from context_manager import context_manager

from doubao_asr import doubao_asr
from doubao_tts import doubao_tts

# 新架构模块
from ai_router import AIRouter
from event_engine import get_event_engine, can_transition, transition_needs_confirmation, get_available_transitions, validate_transition, STATE_LABELS, describe_state_journey
from banban_models import EventNode, UserModel, CommunicationProfile, InputRecord
from canvas_store import (CanvasStore, CanvasNode, CanvasRelation, CanvasCandidate,
                          CanvasGroup, NodeOrigin, LEGACY_KIND_MAP, COMPLETENESS_RULES)
from cognition_store import CognitionStore, COGNITION_DIMENSIONS
from onboarding_model import get_question_bank, build_user_model, build_canvas_candidates, OnboardingDraft
from planning_engine import validate_plan_block, buffer_ratio, suggest_buffer_blocks, validate_plan_batch

app = Flask(__name__, static_folder="ui_static", static_url_path="")
companion: Companion = None
ai_router: AIRouter = None
_runtime_lock = threading.Lock()


def is_demo_mode() -> bool:
    """检查是否为演示模式（默认开启，使用种子/模拟数据；关闭后使用真实数据）。"""
    try:
        if companion and companion.db:
            val = companion.db.get_config("demo_mode", "true")
            return val.lower() == "true"
    except Exception:
        pass
    return True


def set_demo_mode(enabled: bool):
    """设置演示模式"""
    if companion and companion.db:
        companion.db.set_config("demo_mode", "true" if enabled else "false")


def set_companion(c: Companion):
    global companion
    companion = c
    # 预加载语音模型（后台线程，不阻塞启动）
    import threading
    threading.Thread(target=lambda: voice_input._init_recognizer(), daemon=True).start()


def initialize_runtime(start_services=True):
    """初始化所有 API 依赖；可安全地被任意启动入口重复调用。"""
    global companion, ai_router

    with _runtime_lock:
        if companion is None:
            companion = Companion(screenshot_interval=5)

            # 首次运行默认配置
            if not companion.db.get_alarms():
                companion.add_alarm(
                    "起床", "07:30", ["mon", "tue", "wed", "thu", "fri"], "gentle"
                )
            if not companion.db.get_reminders():
                companion.add_reminder(
                    "专注提醒", stage1=25, stage2=50, stage3=60,
                    tone="gentle", start_time="09:00", end_time="22:00"
                )

            # 确保演示模式默认为开启（使用种子数据）
            demo_mode_val = companion.db.get_config("demo_mode", None)
            if demo_mode_val is None:
                companion.db.set_config("demo_mode", "true")
                print("[伴伴] 默认启用演示模式（种子数据）")

            # 演示模式下，如果今日没有任务数据，自动注入种子数据
            if is_demo_mode():
                today_str = datetime.now().strftime("%Y-%m-%d")
                today_tasks = companion.db.get_tasks_by_date(today_str)
                if not today_tasks:
                    print("[伴伴] 演示模式：首次运行，正在注入种子数据...")
                    try:
                        import importlib
                        import seed_real_day
                        importlib.reload(seed_real_day)
                        seed_real_day.main()
                        print("[伴伴] 种子数据注入完成")
                    except Exception as e:
                        import traceback
                        traceback.print_exc()
                        print(f"[伴伴] 种子数据注入失败（可在设置中手动刷新）: {e}")

            ai_router = AIRouter(companion.db)
            print("[伴伴] AI 路由器已初始化（四层模型架构）")

            # get_event_engine() 使用模块级单例，因此必须同步更新兼容层。
            import event_engine as ee_mod
            ee_mod._event_engine = ee_mod.EventEngine(
                ai_router=ai_router, db=companion.db
            )
            print("[伴伴] 事件引擎已初始化（状态机+CRUD兼容层）")

        if start_services and not getattr(companion, "_running", False):
            companion.start()

    return companion


def ensure_port_available(port=9527):
    """在启动后台服务前检查端口，避免留下半初始化进程。"""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(0.3)
        if sock.connect_ex(("127.0.0.1", port)) == 0:
            raise RuntimeError(
                f"端口 {port} 已被占用。伴伴可能已经启动，请访问 "
                f"http://127.0.0.1:{port}；如需重启，请先关闭旧进程。"
            )


# ========= 页面 =========
@app.route("/")
def index():
    """首页：onboarding未完成时显示欢迎引导页，完成后显示门户"""
    try:
        store = get_cognition_store()
        # 检查旧版 onboarding 完成状态（用户从 onboarding_new → onboarding 问卷完成后标记）
        if not store.is_onboarding_completed():
            return send_from_directory("ui_static", "onboarding_new.html")
    except Exception:
        pass
    return send_from_directory("ui_static", "portal.html")


@app.route("/portal")
def portal_page():
    return send_from_directory("ui_static", "portal.html")


@app.route("/canvas")
def canvas_page():
    return send_from_directory("ui_static", "canvas_v2.html")


@app.route("/home")
def home_page():
    return send_from_directory("ui_static", "index.html")


@app.route("/engine")
def engine_page():
    return send_from_directory("ui_static", "engine.html")


@app.route("/voice")
def voice_page():
    return send_from_directory("ui_static", "voice_test.html")


@app.route("/app")
def app_page():
    return send_from_directory("ui_static", "app.html")


@app.route("/onboarding")
def onboarding_page():
    resp = send_from_directory("ui_static", "onboarding.html")
    resp.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    resp.headers["Pragma"] = "no-cache"
    resp.headers["Expires"] = "0"
    return resp


# === Figma 新界面路由 ===
@app.route("/compass")
def compass_page():
    return send_from_directory("ui_static", "compass.html")

@app.route("/canvas-v3")
def canvas_v3_page():
    return send_from_directory("ui_static", "canvas_v3.html")

@app.route("/today")
def today_page():
    return send_from_directory("ui_static", "today.html")

@app.route("/weekly")
def weekly_page():
    return send_from_directory("ui_static", "weekly.html")

@app.route("/review-morning")
def review_morning_page():
    return send_from_directory("ui_static", "review_morning.html")

@app.route("/review-evening")
def review_evening_page():
    return send_from_directory("ui_static", "review_evening.html")

@app.route("/today-timeline")
def today_timeline_page():
    return send_from_directory("ui_static", "today_timeline.html")

@app.route("/review-summary")
def review_summary_page():
    return send_from_directory("ui_static", "review_summary.html")

@app.route("/onboarding-new")
def onboarding_new_page():
    return send_from_directory("ui_static", "onboarding_new.html")

@app.route("/overview")
def overview_page():
    return send_from_directory("ui_static", "overview.html")

@app.route("/settings")
@app.route("/settings.html")
def settings_page():
    return send_from_directory("ui_static", "settings.html")

@app.route("/lab")
def lab_page():
    return send_from_directory("ui_static", "lab.html")

@app.route("/canvas-v4")
def canvas_v4_page():
    return send_from_directory("ui_static", "canvas_v4.html")

@app.route("/icon-gallery")
def icon_gallery_page():
    return send_from_directory("ui_static", "icon-gallery.html")


# ========= API =========
@app.route("/api/status")
def api_status():
    if companion is None:
        return jsonify({"running": False, "configured": False, "demo_mode": True})
    s = companion.status()
    # 添加 configured 字段：onboarding 完成后为 true
    try:
        store = get_cognition_store()
        s["configured"] = store.is_onboarding_completed()
    except Exception:
        s["configured"] = False
    s["demo_mode"] = is_demo_mode()
    return jsonify(s)


@app.route("/api/seed-real-day", methods=["POST"])
def api_seed_real_day():
    """注入真实人一天的种子数据（仅演示模式可用）"""
    if not is_demo_mode():
        return jsonify({"ok": False, "error": "当前为真实数据模式，请在设置中开启演示模式后使用"}), 403
    try:
        import importlib
        import seed_real_day
        importlib.reload(seed_real_day)
        seed_real_day.main()
        return jsonify({"ok": True, "message": "种子数据注入成功"})
    except Exception as e:
        import traceback
        return jsonify({"ok": False, "error": str(e), "traceback": traceback.format_exc()}), 500


@app.route("/api/alarms", methods=["GET", "POST", "DELETE"])
def api_alarms():
    if request.method == "GET":
        alarms = companion.alarm_mgr.list_alarms()
        return jsonify([{
            "id": a.id, "label": a.label, "time": a.time,
            "repeat_days": a.repeat_days, "is_enabled": a.is_enabled,
            "tone": a.tone,
        } for a in alarms])

    elif request.method == "POST":
        data = request.json
        aid = companion.add_alarm(
            label=data.get("label", ""),
            time_str=data.get("time", "08:00"),
            repeat_days=data.get("repeat_days", []),
            tone=data.get("tone", "gentle"),
        )
        return jsonify({"id": aid, "ok": True})

    elif request.method == "DELETE":
        aid = request.args.get("id", type=int)
        companion.alarm_mgr.remove_alarm(aid)
        return jsonify({"ok": True})


@app.route("/api/alarms/toggle", methods=["POST"])
def api_alarm_toggle():
    data = request.json
    companion.alarm_mgr.toggle_alarm(data["id"], data["enabled"])
    return jsonify({"ok": True})


@app.route("/api/reminders", methods=["GET", "POST", "DELETE"])
def api_reminders():
    if request.method == "GET":
        reminders = companion.db.get_reminders()
        return jsonify([{
            "id": r.id, "label": r.label, "reminder_type": r.reminder_type,
            "stage1_minutes": r.stage1_minutes, "stage2_minutes": r.stage2_minutes,
            "stage3_minutes": r.stage3_minutes, "is_enabled": r.is_enabled,
            "tone_style": r.tone_style, "start_time": r.start_time, "end_time": r.end_time,
            "last_triggered_stage": r.last_triggered_stage,
        } for r in reminders])

    elif request.method == "POST":
        data = request.json
        rid = companion.add_reminder(
            label=data.get("label", ""),
            stage1=data.get("stage1_minutes", 25),
            stage2=data.get("stage2_minutes", 50),
            stage3=data.get("stage3_minutes", 60),
            tone=data.get("tone_style", "gentle"),
            start_time=data.get("start_time"),
            end_time=data.get("end_time"),
        )
        return jsonify({"id": rid, "ok": True})

    elif request.method == "DELETE":
        rid = request.args.get("id", type=int)
        companion.db.delete_reminder(rid)
        return jsonify({"ok": True})


@app.route("/api/reminders/toggle", methods=["POST"])
def api_reminder_toggle():
    data = request.json
    reminders = companion.db.get_reminders()
    for r in reminders:
        if r.id == data["id"]:
            r.is_enabled = data["enabled"]
            companion.db.update_reminder(r)
            break
    return jsonify({"ok": True})


@app.route("/api/reminders/session", methods=["POST"])
def api_reminder_session():
    data = request.json
    if data.get("action") == "start":
        companion.reminder_engine.start_session(data["id"])
    else:
        companion.reminder_engine.end_session(data["id"])
    return jsonify({"ok": True})


@app.route("/api/screenshots")
def api_screenshots():
    records = companion.screenshot_analyzer.get_history(limit=20)
    return jsonify([{
        "id": r.id, "created_at": r.created_at,
        "app_name": r.app_name, "window_title": r.window_title,
        "ai_analysis": r.ai_analysis,
        "image_path": r.image_path if os.path.exists(r.image_path) else "",
    } for r in records])


@app.route("/api/screenshot/status")
def api_screenshot_status():
    """获取截图分析器状态"""
    status = companion.screenshot_analyzer.get_status()
    return jsonify({"ok": True, **status})


@app.route("/api/screenshot/fast-mode", methods=["POST"])
def api_screenshot_fast_mode():
    """设置快速模式

    请求体：
    {
      "enabled": true/false,
      "fast_interval_min": 1,          // 可选：最短截图间隔（分钟）
      "fast_interval_max": 3,          // 可选：最长截图间隔（分钟）
      "continuity_check_every": 3,     // 可选：每几张图做一次连续性判断
      "continuity_min_interval": 5     // 可选：连续性判断最短间隔（分钟）
    }
    """
    data = request.json or {}
    enabled = data.get("enabled", False)

    kwargs = {}
    for key in ["fast_interval_min", "fast_interval_max",
                "continuity_check_every", "continuity_min_interval"]:
        if key in data:
            kwargs[key] = data[key]

    companion.screenshot_analyzer.set_fast_mode(enabled, **kwargs)
    status = companion.screenshot_analyzer.get_status()
    return jsonify({"ok": True, **status})


@app.route("/api/screenshot/continuity")
def api_screenshot_continuity():
    """获取最新的连续性判断结果"""
    result = getattr(companion, '_last_continuity', None)
    if result:
        return jsonify({"ok": True, **result})
    return jsonify({"ok": True, "activity": "等待中", "trend": "maintaining",
                    "feedback": "暂无数据", "is_continuing": False,
                    "duration_minutes": 0, "suggestion": ""})


@app.route("/api/screenshot/image")
def api_screenshot_image():
    """提供截图图片文件"""
    path = request.args.get("path", "")
    if not path or not os.path.exists(path):
        return "Not found", 404
    # 安全检查：只允许 screenshots 目录下的文件
    from pathlib import Path
    allowed_dir = str(Path.home() / ".banban" / "screenshots")
    if not os.path.abspath(path).startswith(allowed_dir):
        return "Forbidden", 403
    return send_from_directory(os.path.dirname(path), os.path.basename(path))


@app.route("/api/screenshot/<int:sid>", methods=["DELETE"])
def api_delete_screenshot(sid):
    """删除单条截图记录（同时删除图片文件）"""
    conn = companion.db._conn()
    row = conn.execute("SELECT * FROM screenshots WHERE id=?", (sid,)).fetchone()
    if not row:
        return jsonify({"ok": False, "error": "记录不存在"}), 404
    # 删除图片文件
    img_path = row["image_path"]
    if img_path and os.path.exists(img_path):
        try:
            os.remove(img_path)
        except Exception as e:
            print(f"[Screenshot] 删除图片失败: {e}")
    # 删除数据库记录
    conn.execute("DELETE FROM screenshots WHERE id=?", (sid,))
    conn.commit()
    return jsonify({"ok": True, "id": sid})


@app.route("/api/screenshots/clear", methods=["POST"])
def api_clear_screenshots():
    """清空所有截图记录（同时删除图片文件）"""
    conn = companion.db._conn()
    rows = conn.execute("SELECT id, image_path FROM screenshots").fetchall()
    deleted = 0
    for row in rows:
        img_path = row["image_path"]
        if img_path and os.path.exists(img_path):
            try:
                os.remove(img_path)
            except Exception:
                pass
        deleted += 1
    conn.execute("DELETE FROM screenshots")
    conn.commit()
    return jsonify({"ok": True, "deleted": deleted})


@app.route("/api/screenshot/capture", methods=["POST"])
def api_capture_now():
    record = companion.capture_now()
    if record:
        return jsonify({"ok": True, "id": record.id})
    return jsonify({"ok": False, "error": "截图失败"}), 500


@app.route("/api/screenshot/interval", methods=["POST"])
def api_screenshot_interval():
    minutes = request.json.get("minutes", 5)
    companion.set_screenshot_interval(minutes)
    return jsonify({"ok": True})


@app.route("/api/config", methods=["GET", "POST"])
def api_config():
    if request.method == "GET":
        cfg = companion.db.get_all_config()
        hide_keys = {
            "ai_api_key": ("ai_api_key", 6),
            "ai_vision_api_key": ("ai_vision_api_key", 6),
        }
        for key, (cfg_key, prefix_len) in hide_keys.items():
            if key in cfg and cfg[key]:
                cfg[key] = cfg[key][:prefix_len] + "***" if len(cfg[key]) > prefix_len else "***"
        return jsonify(cfg)

    elif request.method == "POST":
        data = request.json
        for k, v in data.items():
            if not v:
                continue
            if "api_key" in k and "***" in str(v):
                continue
            companion.db.set_config(k, v)
        companion.ai.reload()
        return jsonify({"ok": True})


@app.route("/api/ai/status")
def api_ai_status():
    """获取AI服务状态"""
    return jsonify({
        "configured": companion.ai.configured,
        "vision_configured": companion.ai.vision_configured,
        "model": companion.ai.model,
        "base_url": companion.ai.base_url,
        "vision_model": companion.ai.vision_model,
    })


@app.route("/api/ai/ping", methods=["POST"])
def api_ai_ping():
    """简单测试AI连接是否正常"""
    try:
        resp = companion.ai.chat(
            [{"role": "user", "content": "请回复OK两个字"}],
            max_tokens=10, temperature=0.1
        )
        ok = "ok" in resp.lower() or "OK" in resp
        return jsonify({"ok": True, "response": resp[:30]})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)[:200]}), 500


@app.route("/api/data/demo-mode", methods=["GET", "POST"])
def api_data_demo_mode():
    """获取/设置演示模式"""
    if request.method == "GET":
        return jsonify({"demo_mode": is_demo_mode()})
    else:
        data = request.json or {}
        enabled = bool(data.get("enabled", False))
        set_demo_mode(enabled)
        return jsonify({"ok": True, "demo_mode": enabled})


@app.route("/api/data/refresh", methods=["POST"])
def api_data_refresh():
    """刷新所有数据：触发一次截图分析，基于真实数据更新时间线和罗盘"""
    try:
        # 触发一次实时截图分析
        if hasattr(companion, 'capture_now'):
            companion.capture_now()

        # 返回最新数据
        db = companion.db
        today = datetime.now().strftime("%Y-%m-%d")
        plan = db.get_daily_plan(today)
        tasks = db.get_tasks_by_date(today)

        return jsonify({
            "ok": True,
            "message": "数据已刷新，新截图正在分析中",
            "today": today,
            "plan_status": plan.get("status", "none") if plan else "none",
            "task_count": len(tasks) if tasks else 0,
        })
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)[:200]}), 500


@app.route("/api/data/clear-today", methods=["POST"])
def api_data_clear_today():
    """清除今日所有数据（任务、计划、承诺、行为记录），保留截图历史"""
    try:
        db = companion.db
        today = datetime.now().strftime("%Y-%m-%d")
        conn = db._conn()

        # 删除今日任务
        conn.execute("DELETE FROM tasks WHERE date=?", (today,))
        # 删除今日计划
        conn.execute("DELETE FROM daily_plans WHERE date=?", (today,))
        # 删除今日承诺（基于scheduled_start时间戳判断）
        import time as _time
        today_start = _time.mktime(datetime.strptime(today, "%Y-%m-%d").timetuple())
        today_end = today_start + 86400
        conn.execute("DELETE FROM commitments WHERE scheduled_start>=? AND scheduled_start<?",
                     (today_start, today_end))
        conn.commit()

        # 清空行为引擎内存中的今日记录
        try:
            engine = _get_behavior_engine()
            engine._result_history = [r for r in engine._result_history
                                       if r.get("timestamp", 0) < _time.time() - 86400]
        except Exception:
            pass

        return jsonify({"ok": True, "message": "今日数据已清除"})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)[:200]}), 500


@app.route("/api/window-events")
def api_window_events():
    events = companion.db.get_window_events(limit=50)
    return jsonify([{
        "timestamp": e.timestamp, "app_name": e.app_name,
        "window_title": e.window_title, "duration": e.duration,
    } for e in events])


# ========= 语音识别 API =========

@app.route("/api/voice/upload", methods=["POST"])
def api_voice_upload():
    """上传音频文件识别"""
    if "audio" not in request.files:
        return jsonify({"ok": False, "error": "没有文件"}), 400
    f = request.files["audio"]
    tmp_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "_temp_upload.wav")
    f.save(tmp_path)
    try:
        result = voice_input.transcribe_file(tmp_path)
        return jsonify(result)
    finally:
        try:
            os.remove(tmp_path)
        except Exception:
            pass


@app.route("/api/voice/model-status")
def api_voice_model_status():
    """查询语音模型状态"""
    return jsonify(voice_input.model_status())


# ===== 流式语音（边说边转）=====

@app.route("/api/voice/stream-start", methods=["POST"])
def api_voice_stream_start():
    """开始流式录音+识别（前端录音模式：浏览器采集音频）"""
    ok = voice_input.stream_start_frontend()
    return jsonify({"ok": ok, "message": "已开始" if ok else "启动失败"})


@app.route("/api/voice/stream-audio", methods=["POST"])
def api_voice_stream_audio():
    """接收前端浏览器采集的 PCM 音频块，转发给豆包2.0"""
    pcm_data = request.get_data()
    if not pcm_data:
        return jsonify({"ok": False, "error": "无音频数据"})
    ok = voice_input.stream_feed_audio(pcm_data)
    return jsonify({"ok": ok})


@app.route("/api/voice/stream-status")
def api_voice_stream_status():
    """轮询当前流式识别结果（前端每 300ms 调用）"""
    return jsonify(voice_input.stream_status())


@app.route("/api/voice/stream-stop", methods=["POST"])
def api_voice_stream_stop():
    """停止流式录音，等待最终结果"""
    result = voice_input.stream_stop_frontend()
    return jsonify(result)


# ===== 兼容旧 API =====

@app.route("/api/voice/status")
def api_voice_status():
    return jsonify({"recording": voice_input.is_recording})


@app.route("/api/voice/start", methods=["POST"])
def api_voice_start():
    """兼容旧版：开始录音（前端录音模式）"""
    if voice_input.is_recording:
        return jsonify({"ok": False, "error": "正在录音中"})
    ok = voice_input.stream_start_frontend()
    if ok:
        return jsonify({"ok": True, "message": "录音已开始"})
    return jsonify({"ok": False, "error": "无法启动录音"}), 500


@app.route("/api/voice/stop", methods=["POST"])
def api_voice_stop():
    """兼容旧版：停止录音"""
    result = voice_input.stream_stop_frontend()
    return jsonify(result)


# ===== 讯飞语音（推荐） =====

@app.route("/api/xf/status")
def api_xf_status():
    """讯飞识别 - 状态"""
    return jsonify(xunfei_asr.status())


@app.route("/api/xf/start", methods=["POST"])
def api_xf_start():
    """讯飞识别 - 开始"""
    ok = xunfei_asr.start()
    return jsonify({"ok": ok, "error": xunfei_asr._error or ""})


@app.route("/api/xf/stop", methods=["POST"])
def api_xf_stop():
    """讯飞识别 - 停止"""
    result = xunfei_asr.stop()
    return jsonify(result)


@app.route("/api/xf/config", methods=["GET", "POST"])
def api_xf_config():
    """讯飞凭据管理"""
    if request.method == "GET":
        return jsonify({
            "app_id": xunfei_asr.app_id,
            "api_key": xunfei_asr.api_key[:8] + "***" if len(xunfei_asr.api_key) > 8 else "",
            "api_secret": xunfei_asr.api_secret[:4] + "***" if xunfei_asr.api_secret else "",
            "configured": xunfei_asr.is_configured,
        })
    else:
        data = request.json
        import os
        cfg_path = os.path.join(os.path.expanduser("~"), ".banban", "xf_config.json")
        os.makedirs(os.path.dirname(cfg_path), exist_ok=True)

        # 读取现有配置
        existing = {}
        if os.path.exists(cfg_path):
            with open(cfg_path, "r") as f:
                existing = json.load(f)

        for key in ("app_id", "api_key", "api_secret"):
            if data.get(key) and "***" not in str(data[key]):
                existing[key] = data[key]

        with open(cfg_path, "w") as f:
            json.dump(existing, f, indent=2)

        xunfei_asr._load_credentials()
        return jsonify({"ok": True, "configured": xunfei_asr.is_configured})


# ===== 阿里云语音（推荐） =====

@app.route("/api/aliyun/status")
def api_aliyun_status():
    """阿里云识别 - 状态"""
    return jsonify(aliyun_asr.status())


@app.route("/api/aliyun/start", methods=["POST"])
def api_aliyun_start():
    """阿里云识别 - 开始"""
    ok = aliyun_asr.start()
    return jsonify({"ok": ok, "error": aliyun_asr._error or ""})


@app.route("/api/aliyun/stop", methods=["POST"])
def api_aliyun_stop():
    """阿里云识别 - 停止"""
    result = aliyun_asr.stop()
    return jsonify(result)


@app.route("/api/aliyun/config", methods=["GET", "POST"])
def api_aliyun_config():
    """阿里云百炼凭据管理（只需要 API Key）"""
    if request.method == "GET":
        return jsonify({
            "api_key": aliyun_asr.api_key[:8] + "***" if len(aliyun_asr.api_key) > 8 else "",
            "configured": aliyun_asr.is_configured,
        })
    else:
        data = request.json
        cfg_path = os.path.join(os.path.expanduser("~"), ".banban", "aliyun_config.json")
        os.makedirs(os.path.dirname(cfg_path), exist_ok=True)

        existing = {}
        if os.path.exists(cfg_path):
            with open(cfg_path, "r") as f:
                existing = json.load(f)

        if data.get("api_key") and "***" not in str(data["api_key"]):
            existing["api_key"] = data["api_key"]

        with open(cfg_path, "w") as f:
            json.dump(existing, f, indent=2)

        aliyun_asr._load_credentials()
        return jsonify({"ok": True, "configured": aliyun_asr.is_configured})


# ===== 豆包语音识别 =====

@app.route("/api/doubao/status")
def api_doubao_status():
    return jsonify(doubao_asr.status())


@app.route("/api/doubao/start", methods=["POST"])
def api_doubao_start():
    ok = doubao_asr.start()
    return jsonify({"ok": ok, "error": doubao_asr._error or ""})


@app.route("/api/doubao/stop", methods=["POST"])
def api_doubao_stop():
    result = doubao_asr.stop()
    return jsonify(result)


@app.route("/api/doubao/config", methods=["GET", "POST"])
def api_doubao_config():
    if request.method == "GET":
        return jsonify({
            "app_id": doubao_asr.app_id,
            "token": doubao_asr.token[:8] + "***" if len(doubao_asr.token) > 8 else "",
            "cluster": doubao_asr.cluster,
            "configured": doubao_asr.is_configured,
        })
    else:
        data = request.json
        cfg_path = os.path.join(os.path.expanduser("~"), ".banban", "doubao_config.json")
        os.makedirs(os.path.dirname(cfg_path), exist_ok=True)

        existing = {}
        if os.path.exists(cfg_path):
            with open(cfg_path, "r") as f:
                existing = json.load(f)

        for key in ("app_id", "token", "cluster"):
            if data.get(key) and "***" not in str(data[key]):
                existing[key] = data[key]

        with open(cfg_path, "w") as f:
            json.dump(existing, f, indent=2)

        doubao_asr._load_credentials()
        doubao_tts.reload_config()
        return jsonify({"ok": True, "configured": doubao_asr.is_configured})


# ===== 豆包 TTS 语音合成 =====

@app.route("/api/tts/speak", methods=["POST"])
def api_tts_speak():
    """文字转语音 - 豆包 TTS 即时合成"""
    data = request.json or {}
    text = data.get("text", "")
    voice_type = data.get("voice_type", "BV700_streaming")
    speed = float(data.get("speed", 0.95))
    volume = float(data.get("volume", 1.0))
    pitch = float(data.get("pitch", 1.05))
    emotion = data.get("emotion")

    result = doubao_tts.synthesize(
        text=text,
        voice_type=voice_type,
        speed=speed,
        volume=volume,
        pitch=pitch,
        emotion=emotion
    )
    return jsonify(result)


@app.route("/api/tts/status", methods=["GET"])
def api_tts_status():
    """检查 TTS 配置状态"""
    return jsonify({
        "configured": doubao_tts.is_configured,
        "default_voice": doubao_tts.default_voice,
        "doubao_available": doubao_tts._doubao_available,
        "engine": "doubao" if doubao_tts._doubao_available else "edge",
    })


# ===== 语音转想法 =====

@app.route("/api/voice/ideas", methods=["POST"])
def api_voice_ideas():
    """将语音识别文字发送给 AI，生成小想法卡片"""
    data = request.json
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"ok": False, "error": "没有文字内容"}), 400

    if not companion or not companion.ai:
        return jsonify({"ok": False, "error": "AI 服务未就绪"}), 503

    try:
        ideas = companion.ai.generate_ideas(text)
        return jsonify({"ok": True, "ideas": ideas})
    except Exception as e:
        return jsonify({"ok": False, "error": f"AI 生成失败: {e}"}), 500


# ========= 上下文查看 =========

@app.route("/api/context")
def api_context():
    """查看伴伴的全天上下文记忆"""
    return jsonify({
        "entries": context_manager.get_recent(30),
        "total": context_manager.entry_count,
        "last_speak_minutes": round(context_manager.minutes_since_last_speak, 1),
        "speak_history": json.loads(context_manager.get_speak_history()),
        "day_summary": json.loads(context_manager.get_day_summary()),
    })


# ========= AI 聊天 API =========

@app.route("/api/chat", methods=["POST"])
def api_chat():
    """AI 文字对话（带上下文记忆）"""
    data = request.json
    # 兼容 text / message 两种字段名（前端 sendAIMessage 与 loadAISuggestion 均发送 message）
    user_text = (data.get("text") or data.get("message") or "").strip()
    if not user_text:
        return jsonify({"ok": False, "error": "请输入文字"})

    # 维护对话历史（最多保留最近10轮）
    if not hasattr(api_chat, '_history'):
        api_chat._history = [
            {"role": "system", "content": (
                "你是'伴伴'，一个温柔贴心的AI生活伴侣。你不是助手，不是工具，而是用户身边一个安静陪伴的朋友。"
                "你的性格：温暖、耐心、不评判，偶尔带一点小幽默，但绝不油腻。"
                "你关心用户的情绪和状态，而不只是完成任务。"
                "你说话简短自然，像朋友聊天，一次最多两三句，不啰嗦，不说教。"
                "当用户感到疲惫或压力时，你先共情，再轻轻给出建议，绝不命令。"
                "你不用'你应该'、'你必须'、'你需要'这样的词，而是用'要不要试试'、'或许可以'、'我陪你'。"
                "你能感知一天的节奏：早晨温柔唤醒，白天轻声陪伴，夜晚安抚放松。"
            )}
        ]

    api_chat._history.append({"role": "user", "content": user_text})
    # 只保留最近10轮对话 + system
    if len(api_chat._history) > 21:
        api_chat._history = [api_chat._history[0]] + api_chat._history[-20:]

    try:
        reply = companion.ai.chat(api_chat._history, temperature=0.8, max_tokens=300)
        api_chat._history.append({"role": "assistant", "content": reply})
        # 确保 reply 是字符串
        reply_text = reply.get("text", str(reply)) if isinstance(reply, dict) else reply

        return jsonify({"ok": True, "reply": reply_text})
    except Exception as e:
        return jsonify({"ok": False, "error": f"AI 回复失败: {e}"}), 500


@app.route("/api/chat/clear", methods=["POST"])
def api_chat_clear():
    """清空对话历史"""
    if hasattr(api_chat, '_history'):
        del api_chat._history
    return jsonify({"ok": True})


# ========= 计划表生成 API =========

@app.route("/api/generate-plan", methods=["POST"])
def api_generate_plan():
    """一键生成计划表 — 输入混乱安排，AI 整理成结构化时间轴"""
    data = request.json
    raw_text = data.get("text", "").strip()
    if not raw_text:
        return jsonify({"ok": False, "error": "请输入你的安排"})

    messages = [
        {"role": "system", "content": (
            "你是伴伴，一个温柔的生活伴侣，擅长帮朋友整理混乱的安排。\n"
            "用户会给你一段混乱的明日安排描述，请你：\n"
            "1. 提取出所有任务\n"
            "2. 为每个任务分配合理的时间段（从早上7点到晚上23点）\n"
            "3. 按时间排序\n"
            "4. 给每个任务一个类型：work/rest/meal/exercise/study/social/routine\n\n"
            "返回 JSON 数组，每个元素格式：\n"
            '{"title":"任务名","type":"类型","startTime":"HH:mm","endTime":"HH:mm","note":"一句话说明"}\n'
            "只返回 JSON 数组，不要其他文字。"
        )},
        {"role": "user", "content": raw_text},
    ]

    try:
        reply = companion.ai.chat(messages, temperature=0.3, max_tokens=800)
        # 尝试解析 JSON
        import re
        json_match = re.search(r'\[.*\]', reply, re.DOTALL)
        if json_match:
            plan = json.loads(json_match.group())
            return jsonify({"ok": True, "plan": plan, "raw": reply})
        return jsonify({"ok": False, "error": "AI 返回格式异常", "raw": reply})
    except Exception as e:
        return jsonify({"ok": False, "error": f"生成失败: {e}"}), 500


# ========= 规划流程 API（Sunsama 风格 5P 仪式）=========

# 内存中存储规划状态
_plan_state = {}


@app.route("/api/plan/process", methods=["POST"])
def api_plan_process():
    """Step 1: Process — 回顾昨天，AI 生成昨日回顾"""
    # 从截图记录中提取昨天的活动
    shots = companion.db.get_screenshots(limit=30)
    yesterday_analyses = [s.ai_analysis for s in shots if s.ai_analysis][:15]
    apps = list(set((s.app_name or "").replace(".exe", "") for s in shots))[:8]

    messages = [
        {"role": "system", "content": (
            "你是伴伴，温柔的生活伴侣。用户正在进行晨间规划的第一步：回顾昨天。\n"
            "请根据昨天的截图分析记录，用温柔简短的语气帮用户回顾（150字以内）：\n"
            "1. 昨天主要做了什么\n"
            "2. 有什么值得注意的（好的或需要改进的）\n"
            "语气温柔，不评判，像朋友帮你回忆。"
        )},
        {"role": "user", "content": f"昨天使用的应用: {', '.join(apps)}\n截图分析:\n" + "\n".join(yesterday_analyses) if yesterday_analyses else "昨天没有记录"},
    ]

    try:
        reply = companion.ai.chat(messages, temperature=0.6, max_tokens=200)
        # 初始化规划状态
        _plan_state.clear()
        _plan_state["review"] = reply
        return jsonify({"ok": True, "review": reply})
    except Exception as e:
        return jsonify({"ok": False, "error": f"回顾失败: {e}"}), 500


@app.route("/api/plan/extract", methods=["POST"])
def api_plan_extract():
    """Step 2: Plan — 从混乱输入中提取任务"""
    data = request.json
    raw_text = data.get("text", "").strip()
    if not raw_text:
        return jsonify({"ok": False, "error": "请输入你的安排"})

    messages = [
        {"role": "system", "content": (
            "你是伴伴，擅长帮朋友整理混乱的安排。\n"
            "用户会给你一段混乱的今日安排描述，请提取出所有任务。\n"
            "不要分配时间，只提取任务清单。\n"
            "返回 JSON 数组：\n"
            '{"title":"任务名","type":"work/rest/meal/exercise/study/social/routine","estimated_minutes":60,"priority":"high/medium/low"}\n'
            "只返回 JSON 数组。"
        )},
        {"role": "user", "content": raw_text},
    ]

    try:
        reply = companion.ai.chat(messages, temperature=0.3, max_tokens=600)
        import re
        json_match = re.search(r'\[.*\]', reply, re.DOTALL)
        if json_match:
            tasks = json.loads(json_match.group())
            _plan_state["tasks"] = tasks
            return jsonify({"ok": True, "tasks": tasks})
        return jsonify({"ok": False, "error": "AI 返回格式异常", "raw": reply})
    except Exception as e:
        return jsonify({"ok": False, "error": f"提取失败: {e}"}), 500


@app.route("/api/plan/prioritize", methods=["POST"])
def api_plan_prioritize():
    """Step 3: Prioritize — AI 帮用户排优先级"""
    data = request.json
    tasks = data.get("tasks", [])
    if not tasks:
        return jsonify({"ok": False, "error": "没有任务可排序"})

    messages = [
        {"role": "system", "content": (
            "你是伴伴，擅长帮朋友排优先级。\n"
            "请根据任务的紧急程度和重要性重新排序，并标注哪些可以推迟到明天。\n"
            "返回 JSON 数组（按优先级排序）：\n"
            '{"title":"任务名","type":"类型","estimated_minutes":60,"priority":"high/medium/low","can_wait":false,"reason":"为什么这个优先级"}\n'
            "只返回 JSON 数组。"
        )},
        {"role": "user", "content": json.dumps(tasks, ensure_ascii=False)},
    ]

    try:
        reply = companion.ai.chat(messages, temperature=0.3, max_tokens=600)
        import re
        json_match = re.search(r'\[.*\]', reply, re.DOTALL)
        if json_match:
            prioritized = json.loads(json_match.group())
            _plan_state["tasks"] = prioritized
            return jsonify({"ok": True, "tasks": prioritized})
        return jsonify({"ok": False, "error": "AI 返回格式异常", "raw": reply})
    except Exception as e:
        return jsonify({"ok": False, "error": f"排序失败: {e}"}), 500


@app.route("/api/plan/schedule", methods=["POST"])
def api_plan_schedule():
    """Step 4: Prepare — 将任务分配到时间块（Timeboxing）"""
    data = request.json
    tasks = data.get("tasks", [])
    work_start = data.get("work_start", "09:00")
    work_end = data.get("work_end", "22:00")
    if not tasks:
        return jsonify({"ok": False, "error": "没有任务可安排"})

    messages = [
        {"role": "system", "content": (
            f"你是伴伴，擅长帮朋友做时间块规划。\n"
            f"用户的工作时间是 {work_start} 到 {work_end}。\n"
            "请将任务分配到具体时间段，遵循这些原则：\n"
            "1. 高优先级任务放在精力最好的时段（上午）\n"
            "2. 任务之间留5分钟缓冲\n"
            "3. 午餐固定12:00-13:00\n"
            "4. 下午安排中等优先级任务\n"
            "5. 晚上安排轻松的任务或学习\n"
            "6. 可以跳过 can_wait=true 的任务\n\n"
            "返回 JSON 数组（按时间排序）：\n"
            '{"title":"任务名","type":"类型","startTime":"HH:mm","endTime":"HH:mm","note":"一句话说明"}\n'
            "只返回 JSON 数组。"
        )},
        {"role": "user", "content": json.dumps(tasks, ensure_ascii=False)},
    ]

    try:
        reply = companion.ai.chat(messages, temperature=0.3, max_tokens=800)
        import re
        json_match = re.search(r'\[.*\]', reply, re.DOTALL)
        if json_match:
            schedule = json.loads(json_match.group())
            _plan_state["schedule"] = schedule
            return jsonify({"ok": True, "schedule": schedule})
        return jsonify({"ok": False, "error": "AI 返回格式异常", "raw": reply})
    except Exception as e:
        return jsonify({"ok": False, "error": f"安排失败: {e}"}), 500


@app.route("/api/plan/publish", methods=["POST"])
def api_plan_publish():
    """Step 5: Publish — 生成最终计划 + 晨间提醒"""
    data = request.json
    schedule = data.get("schedule", [])
    if not schedule:
        return jsonify({"ok": False, "error": "没有计划可发布"})

    # 生成晨间提醒
    first_task = schedule[0] if schedule else {}
    first_time = first_task.get("startTime", "09:00")
    first_title = first_task.get("title", "")

    messages = [
        {"role": "system", "content": (
            "你是伴伴，温柔的生活伴侣。用户刚完成了今日规划，请生成一句温柔的晨间提醒（30字以内）。\n"
            "基于第一个任务和时间，温柔地提醒用户开始一天。不用命令语气。"
        )},
        {"role": "user", "content": f"第一个任务: {first_title} (开始时间: {first_time})\n今日共{len(schedule)}个任务"},
    ]

    try:
        morning_note = companion.ai.chat(messages, temperature=0.8, max_tokens=60)
        _plan_state["schedule"] = schedule
        _plan_state["morning_note"] = morning_note
        return jsonify({"ok": True, "schedule": schedule, "morning_note": morning_note})
    except Exception as e:
        return jsonify({"ok": True, "schedule": schedule, "morning_note": "新的一天，慢慢来~"})


@app.route("/api/plan/shutdown", methods=["POST"])
def api_plan_shutdown():
    """晚间收尾 — 回顾今天，未完成任务推迟到明天"""
    schedule = _plan_state.get("schedule", [])
    # 从截图记录获取今天的活动
    shots = companion.db.get_screenshots(limit=20)
    today_analyses = [s.ai_analysis for s in shots if s.ai_analysis][:10]

    messages = [
        {"role": "system", "content": (
            "你是伴伴，温柔的生活伴侣。用户正在进行晚间收尾。\n"
            "请根据今日计划和实际活动记录，生成一段温柔的收尾总结（200字以内）：\n"
            "1. 今天完成了哪些计划中的任务\n"
            "2. 有什么没做完的，温柔地建议明天继续\n"
            "3. 一个值得注意的 pattern\n"
            "语气温柔，不评判，像朋友陪你结束一天。不要鸡汤。"
        )},
        {"role": "user", "content": f"今日计划:\n{json.dumps(schedule, ensure_ascii=False)}\n\n今日活动记录:\n" + "\n".join(today_analyses) if today_analyses else "今日计划:\n" + json.dumps(schedule, ensure_ascii=False)},
    ]

    try:
        summary = companion.ai.chat(messages, temperature=0.6, max_tokens=300)
        return jsonify({"ok": True, "summary": summary})
    except Exception as e:
        return jsonify({"ok": False, "error": f"收尾失败: {e}"}), 500


# ========= Canvas to Plan：计划生成 + 承诺 + 偏差 =========

@app.route("/api/plan/generate", methods=["POST"])
def api_plan_generate():
    """从画布节点生成今日计划

    Body: {
        "node_ids": ["node1", "node2", ...],  # 画布节点 ID 列表
        "fixed_items": [...],  # 可选，固定项
        "work_start": 9.0,  # 可选，工作开始时间
        "work_end": 22.0,   # 可选，工作结束时间
    }
    """
    data = request.get_json(silent=True) or {}
    node_ids = data.get("node_ids", [])
    if not node_ids:
        return jsonify({"error": "请选择至少一个任务"}), 400

    # 从画布获取节点
    try:
        from canvas_store import CanvasStore
        store = CanvasStore(Database())
        all_nodes = store.list_nodes()
        selected = [n.to_dict() for n in all_nodes if n.id in node_ids]
    except Exception as e:
        return jsonify({"error": f"获取画布节点失败: {e}"}), 500

    if not selected:
        return jsonify({"error": "未找到选中的节点"}), 404

    # 生成计划
    from planning_engine import generate_plan
    plan = generate_plan(
        selected_nodes=selected,
        fixed_items=data.get("fixed_items", []),
        date_str=data.get("date"),
        work_start=data.get("work_start", 9.0),
        work_end=data.get("work_end", 22.0),
    )

    # 保存到数据库
    db = companion.db if companion else Database()
    plan_id = db.save_daily_plan(plan)

    return jsonify({"plan": plan, "plan_id": plan_id})


@app.route("/api/plan/today", methods=["GET"])
def api_plan_today():
    """获取今日计划"""
    db = companion.db if companion else Database()
    plan = db.get_daily_plan()
    if not plan:
        return jsonify({"plan": None, "commitments": []})
    
    # 获取关联的承诺
    plan_id = plan.get("id", "")
    commitments = db.get_commitments_by_plan(plan_id) if plan_id else []
    return jsonify({"plan": plan, "commitments": commitments})


@app.route("/api/plan/confirm", methods=["POST"])
def api_plan_confirm():
    """确认计划 — 将 PlannedAction 转为 DailyCommitment

    Body: {"plan_id": "...", "task_ids": ["t1", "t2", ...]}  # task_ids 可选，不传则全部确认
    """
    data = request.get_json(silent=True) or {}
    plan_id = data.get("plan_id", "")
    
    db = companion.db if companion else Database()
    
    # 获取计划
    from datetime import datetime
    today = datetime.now().strftime("%Y-%m-%d")
    plan = db.get_daily_plan(today)
    if not plan:
        return jsonify({"error": "今日无计划"}), 404
    
    plan_id = plan.get("id", plan_id)
    tasks = plan.get("tasks", [])
    task_ids = data.get("task_ids")
    if task_ids:
        tasks = [t for t in tasks if t.get("id") in task_ids]
    
    from banban_models import DailyCommitment
    commitment_ids = []
    for task in tasks:
        comm = DailyCommitment(
            plan_id=plan_id,
            origin_node_id=task.get("originNodeId", ""),
            title=task.get("title", ""),
            scheduled_start=task.get("startTime", 0),
            scheduled_duration=task.get("duration", 45),
            type=task.get("type", "light_work"),
            cognitive_load=task.get("cognitiveLoad", "medium"),
            priority=task.get("priority", "medium"),
            status="scheduled",
            reason=task.get("reason", ""),
        )
        comm_dict = comm.to_dict()
        cid = db.save_commitment(comm_dict)
        commitment_ids.append(cid)
        # 事件溯源
        db.add_plan_event("CommitmentCreated", cid, "commitment", comm_dict)
    
    # 更新计划状态
    plan["status"] = "confirmed"
    plan["confirmedAt"] = datetime.now().isoformat()
    db.save_daily_plan(plan)
    db.add_plan_event("PlanConfirmed", plan_id, "plan", {"commitmentIds": commitment_ids})
    
    return jsonify({
        "message": f"已确认 {len(commitment_ids)} 个承诺",
        "commitment_ids": commitment_ids,
    })


# ========= AI 规划前置流程 API（5步 MVP）=========

@app.route("/api/plan/today-info", methods=["GET"])
def api_plan_today_info():
    """Step 1: 获取今日信息 — 已有任务、固定事件、习惯、可用时间等

    返回: {
        tasks: [...],          // 今日待办任务（backlog + 今日任务）
        fixed_events: [...],   // 固定事件（会议、预约等）
        habits: [...],         // 习惯
        available_hours: 12.5, // 可用时间（小时）
        suggested_main_goal: "..." // AI 推荐的今日主结果
    }
    """
    from datetime import datetime
    today_str = datetime.now().strftime("%Y-%m-%d")
    db = companion.db if companion else Database()

    # 1. 获取今日任务 + backlog
    all_tasks = db.get_tasks_by_date(today_str)
    task_dicts = []
    for t in all_tasks:
        if hasattr(t, 'to_dict'):
            task_dicts.append(t.to_dict())
        else:
            task_dicts.append({
                "id": t.id, "title": t.title, "type": t.type,
                "priority": t.priority, "planned_minutes": t.planned_minutes,
                "status": t.status, "date": t.date, "note": t.note,
                "start_time": t.start_time, "end_time": t.end_time,
            })

    # 2. 固定事件（从现有计划或日历中提取）
    fixed_events = []
    existing_plan = db.get_daily_plan(today_str)
    if existing_plan and existing_plan.get("fixedItems"):
        fixed_events = existing_plan["fixedItems"]

    # 3. 习惯（从 event_nodes 中取 habit 类型）
    habits = []
    try:
        from event_engine import get_event_engine
        engine = get_event_engine(db)
        habit_nodes = engine.get_nodes_by_type("habit")
        habits = [{"id": n.id, "title": n.title, "type": "habit"}
                  for n in habit_nodes[:5]]
    except Exception:
        pass

    # 4. 计算可用时间（默认 9:00 - 22:00 = 13 小时，减去固定事件）
    work_start = 9.0
    work_end = 22.0
    total_available = work_end - work_start
    fixed_hours = 0
    for fe in fixed_events:
        st = fe.get("startTime", 0)
        et = fe.get("endTime", 0)
        if st and et and et > st:
            fixed_hours += (et - st) / 3600000
    available_hours = round(max(0, total_available - fixed_hours), 1)

    # 5. AI 推荐主结果：选择优先级最高、时间最紧的任务
    suggested_main_goal = ""
    if task_dicts:
        # 按优先级排序：high > medium > low
        prio_order = {"high": 0, "medium": 1, "low": 2}
        sorted_tasks = sorted(
            task_dicts,
            key=lambda t: (prio_order.get(t.get("priority", "medium"), 1),
                           -(t.get("planned_minutes") or 0))
        )
        top_task = sorted_tasks[0]
        suggested_main_goal = top_task.get("title", "完成最重要的任务")

    # ===== 修改：统一任务格式（补充 type(8分类) 和 domain_id）=====
    # 将数据库中旧的 7 分类 type 转换为 8 分类，并补充 domain_id
    high_prio_tasks = []
    for t in task_dicts:
        old_type = t.get("type", "work")
        title = t.get("title", "")
        # 旧7分类 → 新8分类
        new_type = _convert_type_7_to_8(old_type, title)
        t["type"] = new_type
        # 补充 domain_id
        t["domain_id"] = _infer_domain_from_type_and_title(new_type, title)
        if t.get("priority") == "high":
            high_prio_tasks.append(t)

    # ===== 修改：候选目标（只返回真实数据，不足时返回空）=====
    candidate_goals = []

    # 从真实任务中提取高优先级任务作为候选目标
    for idx, t in enumerate(high_prio_tasks[:3]):
        goal_title = t.get("title", "")
        goal_type = t.get("type", "light_work")
        # 不默认 work：有原始 domain_id 就用，否则推断
        if t.get("domain_id"):
            goal_domain = t["domain_id"]
        else:
            inferred = _infer_domain_from_type_and_title(goal_type, goal_title)
            goal_domain = inferred if inferred != "other" else None
        candidate_goals.append({
            "id": f"goal_{idx + 1}",
            "title": goal_title,
            "source": "from_task",
            "priority": "high",
            "reason": f"高优先级任务，预计需要 {t.get('planned_minutes', 60)} 分钟完成",
            "estimated_hours": round((t.get("planned_minutes") or 60) / 60.0, 1),
            "type": goal_type,
            "domain_id": goal_domain,
            "domain_needs_confirmation": goal_domain is None,
        })

    # 尝试从画布获取目标（真实数据）
    canvas_goals = []
    try:
        from canvas_store import CanvasStore
        store = CanvasStore(db)
        canvas_nodes = store.list_nodes()
        for n in canvas_nodes:
            nd = n.to_dict() if hasattr(n, 'to_dict') else n
            if nd.get("state") in ("done", "archived"):
                continue
            if nd.get("kind") in ("goal", "project", "milestone"):
                canvas_goals.append(nd)
                if len(canvas_goals) >= 2:
                    break
    except Exception:
        pass

    for idx, g in enumerate(canvas_goals):
        goal_id = f"goal_{len(candidate_goals) + 1}"
        goal_title = g.get("title", "")
        goal_type = _infer_type_from_title(goal_title)
        goal_domain = _infer_domain_from_type_and_title(goal_type, goal_title)
        candidate_goals.append({
            "id": goal_id,
            "title": goal_title,
            "source": "from_canvas",
            "priority": g.get("priority", "medium"),
            "reason": "来自画布中的重要目标，需要持续推进",
            "estimated_hours": 2.0,
            "type": goal_type,
            "domain_id": goal_domain,
        })

    # 注意：不再补充假数据模板，数据不足时直接返回空数组

    # ===== 修改：必做事项（只返回真实数据，不足时返回空）=====
    must_do_actions = []

    # 从高优先级任务中提取必做事项（channel 包含 must_do 或 priority=high 且未完成）
    for idx, t in enumerate(high_prio_tasks):
        # 判断是否是必做事项：channel 标记或明确的高优
        is_must = (t.get("channel") == "daily_plan_must_do" or
                   "is_must_do:true" in (t.get("note") or ""))
        if is_must or t.get("priority") == "high":
            # 不使用默认 work，而是根据标题和类型推断；推断不出则留空由前端要求用户选择
            task_title = t.get("title", "")
            task_type_8 = t.get("type", "light_work")
            inferred_domain = _infer_domain_from_type_and_title(task_type_8, task_title)
            # 如果推断结果是 other 且原始数据没有 domain_id，标记为需要确认（传 null）
            has_original_domain = bool(t.get("domain_id"))
            final_domain = t.get("domain_id") if has_original_domain else (
                inferred_domain if inferred_domain != "other" else None
            )
            must_do_actions.append({
                "id": f"must_{idx + 1}",
                "title": task_title,
                "reason": "高优先级任务，今日必须推进",
                "estimated_minutes": t.get("planned_minutes", 60),
                "priority": "high",
                "source": "task",
                "type": task_type_8,
                "domain_id": final_domain,
                "domain_needs_confirmation": final_domain is None,
                "is_must_do": is_must,
            })

    # 从固定事件中提取必做（真实数据）
    for idx, fe in enumerate(fixed_events):
        must_id = f"must_{len(must_do_actions) + 1}"
        title = fe.get("title", fe.get("name", "固定安排"))
        st = fe.get("startTime", 0)
        et = fe.get("endTime", 0)
        est_min = max(15, int((et - st) / 60000)) if st and et else 30
        fe_type = _infer_type_from_title(title)
        fe_domain = _infer_domain_from_type_and_title(fe_type, title)
        must_do_actions.append({
            "id": must_id,
            "title": title,
            "reason": "已预约/已安排的固定事项，不可调整",
            "estimated_minutes": est_min,
            "priority": "high",
            "source": "fixed_event",
            "type": fe_type,
            "domain_id": fe_domain,
            "is_must_do": True,
        })

    # 注意：不再补充假数据模板，数据不足时直接返回空数组

    # ===== 修改：目标拆解建议（没有真实目标时返回 null）=====
    goal_breakdown_suggestion = None
    # 只有当有真实候选目标时才提供拆解建议，且基于真实数据
    if candidate_goals:
        # 使用 AI 拆解（如果可用），否则为 null（不使用模板假数据）
        ai_available = bool(companion and getattr(companion, 'ai', None))
        if ai_available:
            try:
                main_goal_title = candidate_goals[0]["title"]
                breakdown_result = ai_breakdown_goal(main_goal_title)
                goal_breakdown_suggestion = {
                    "goal_title": main_goal_title,
                    "steps": breakdown_result.get("steps", []),
                    "total_estimated_minutes": breakdown_result.get("total_minutes", 0),
                    "breakdown_logic": breakdown_result.get("breakdown_logic", ""),
                }
            except Exception:
                goal_breakdown_suggestion = None
        # AI 不可用时返回 null，不使用硬编码模板

    # ===== 修改：候选行动（只返回真实数据，不足时返回空）=====
    candidate_actions = []

    # 从已有中低优先级任务中提取候选（真实数据）
    low_med_tasks = [t for t in task_dicts if t.get("priority") in ("low", "medium")]
    for idx, t in enumerate(low_med_tasks[:8]):
        cand_title = t.get("title", "")
        cand_type = t.get("type", "light_work")
        # 不默认 work：有原始 domain_id 就用，否则根据标题+类型推断，推断不出为 None
        if t.get("domain_id"):
            cand_domain = t["domain_id"]
        else:
            inferred = _infer_domain_from_type_and_title(cand_type, cand_title)
            cand_domain = inferred if inferred != "other" else None
        candidate_actions.append({
            "id": f"cand_{idx + 1}",
            "title": cand_title,
            "estimated_minutes": t.get("planned_minutes", 30),
            "cognitive_load": "light" if cand_type in ("light_work", "routine", "rest") else "medium",
            "priority": t.get("priority", "medium"),
            "type": cand_type,
            "domain_id": cand_domain,
            "domain_needs_confirmation": cand_domain is None,
            "category": _type_to_category(cand_type),
        })

    # 注意：不再补充假数据模板，数据不足时直接返回空数组

    # ===== 修改：现有任务按类型统计（使用 8 分类）=====
    existing_tasks_by_type = {}
    for t in TASK_TYPES:
        existing_tasks_by_type[t] = {"count": 0, "total_minutes": 0, "examples": []}
    for t in task_dicts:
        ttype = t.get("type", "light_work")
        if ttype not in existing_tasks_by_type:
            ttype = "light_work"
        existing_tasks_by_type[ttype]["count"] += 1
        existing_tasks_by_type[ttype]["total_minutes"] += int(t.get("planned_minutes") or 0)
        if len(existing_tasks_by_type[ttype]["examples"]) < 3:
            existing_tasks_by_type[ttype]["examples"].append(t.get("title", ""))

    # ===== 修改：习惯列表（带 type 和 domain_id）=====
    habits_with_type = []
    try:
        from event_engine import get_event_engine
        engine = get_event_engine(db)
        habit_nodes = engine.get_nodes_by_type("habit")
        for n in habit_nodes[:8]:
            title = n.title if hasattr(n, 'title') else n.get("title", "")
            duration = n.estimated_minutes if hasattr(n, 'estimated_minutes') else (
                n.get("estimated_minutes") or n.get("estimatedTime") or 15
            )
            htype = _infer_type_from_title(title)
            hdomain = _infer_domain_from_type_and_title(htype, title)
            habits_with_type.append({
                "id": n.id if hasattr(n, 'id') else n.get("id", ""),
                "title": title,
                "type": htype,
                "domain_id": hdomain,
                "duration_minutes": int(duration) if duration else 15,
            })
    except Exception:
        pass

    # ===== 修改：固定事件列表（带 type 和 domain_id）=====
    fixed_events_typed = []
    for fe in fixed_events:
        st_ms = fe.get("startTime", 0)
        et_ms = fe.get("endTime", 0)
        start_hour = (st_ms / 3600000.0) if st_ms else 0
        end_hour = (et_ms / 3600000.0) if et_ms else 0
        fe_title = fe.get("title") or fe.get("name", "固定事件")
        fe_type = _infer_type_from_title(fe_title)
        fe_domain = _infer_domain_from_type_and_title(fe_type, fe_title)
        # day 字段从日期推断（默认今天）
        from datetime import datetime
        weekday_map = {0: "monday", 1: "tuesday", 2: "wednesday",
                       3: "thursday", 4: "friday", 5: "saturday", 6: "sunday"}
        today_weekday = datetime.now().weekday()
        fixed_events_typed.append({
            "title": fe_title,
            "type": fe_type,
            "domain_id": fe_domain,
            "start": round(start_hour, 1),
            "end": round(end_hour, 1),
            "day": weekday_map.get(today_weekday, "monday"),
        })

    # ===== 修改：候选目标按领域分类 =====
    candidate_goals_by_domain = {"work": [], "study": [], "health": [], "life": [], "interest": [], "other": []}
    for g in candidate_goals:
        domain = g.get("domain_id", "other")
        if domain not in candidate_goals_by_domain:
            candidate_goals_by_domain[domain] = []
        candidate_goals_by_domain[domain].append(g)

    # ===== 新增：今日时间概览 =====
    habit_total_minutes = sum(h.get("duration_minutes", 0) for h in habits_with_type)
    habit_hours = round(habit_total_minutes / 60.0, 1)
    total_available_hours = round(work_end - work_start, 1)
    fixed_hours_calc = 0
    for fe in fixed_events:
        st = fe.get("startTime", 0)
        et = fe.get("endTime", 0)
        if st and et and et > st:
            fixed_hours_calc += (et - st) / 3600000
    fixed_hours = round(fixed_hours_calc, 1)
    flexible_hours = round(max(0, total_available_hours - fixed_hours - habit_hours), 1)

    day_overview = {
        "total_available_hours": total_available_hours,
        "fixed_hours": fixed_hours,
        "flexible_hours": flexible_hours,
        "habit_hours": habit_hours,
    }

    # ===== 新增：missing_fields 字段（标记数据缺失情况）=====
    missing_fields = []
    if not candidate_goals:
        missing_fields.append("candidate_goals")
    if not must_do_actions:
        missing_fields.append("must_do_items")
    if not habits and not habits_with_type:
        missing_fields.append("habits")
    if not fixed_events:
        missing_fields.append("fixed_events")
    # 精力状态未知（today-info 接口暂不从用户模型读取详细精力，标记为未知）
    missing_fields.append("energy_level")

    return jsonify({
        "tasks": task_dicts,
        "fixed_events": fixed_events,
        "habits": habits,
        "available_hours": available_hours,
        "work_start": work_start,
        "work_end": work_end,
        "suggested_main_goal": suggested_main_goal,
        "today": today_str,
        # 保留字段
        "candidate_goals": candidate_goals,
        "must_do_actions": must_do_actions,
        "goal_breakdown_suggestion": goal_breakdown_suggestion,
        "candidate_actions": candidate_actions,
        # 类型增强字段
        "existing_tasks_by_type": existing_tasks_by_type,
        "habits_with_type": habits_with_type,
        "fixed_events_typed": fixed_events_typed,
        "candidate_goals_by_domain": candidate_goals_by_domain,
        "day_overview": day_overview,
        # ===== 新增：缺失字段标记 =====
        "missing_fields": missing_fields,
    })


# ========= AI 任务生成相关函数 =========

# ===== 类型定义与映射常量 =====
TASK_TYPES = (
    "deep_work", "light_work", "meeting", "learning",
    "exercise", "rest", "meal", "routine"
)

# type → kind 反向映射（保持与画布节点系统的兼容性）
TYPE_TO_KIND = {
    "deep_work": "action",
    "light_work": "inspiration",
    "meeting": "action",
    "learning": "resource",
    "exercise": "habit",
    "rest": "habit",
    "meal": "habit",
    "routine": "habit",
}

# 类型近似映射：当 AI 返回的 type 不在 8 种中时，自动归类到最近的类型
TYPE_FUZZY_MAP = {
    "work": "deep_work", "deep": "deep_work", "focus": "deep_work",
    "coding": "deep_work", "development": "deep_work", "dev": "deep_work",
    "light": "light_work", "admin": "light_work", "email": "light_work",
    "communication": "light_work", "misc": "light_work",
    "call": "meeting", "discuss": "meeting", "discussion": "meeting",
    "review": "meeting", "standup": "meeting", "1on1": "meeting",
    "study": "learning", "read": "learning", "reading": "learning",
    "research": "learning", "training": "learning", "course": "learning",
    "sport": "exercise", "gym": "exercise", "fitness": "exercise",
    "run": "exercise", "running": "exercise", "yoga": "exercise",
    "walk": "exercise", "walking": "exercise",
    "break": "rest", "nap": "rest", "relax": "rest", "relaxation": "rest",
    "meditation": "rest",
    "breakfast": "meal", "lunch": "meal", "dinner": "meal", "food": "meal",
    "daily": "routine", "chore": "routine", "commute": "routine",
    "housework": "routine", "errand": "routine",
}


def _normalize_type(raw_type):
    """将 AI 返回的 type 归一化为 8 种标准类型之一"""
    if not raw_type:
        return "light_work"
    raw = raw_type.strip().lower().replace(" ", "_")
    if raw in TASK_TYPES:
        return raw
    if raw in TYPE_FUZZY_MAP:
        return TYPE_FUZZY_MAP[raw]
    # 按关键词模糊匹配
    for key, val in TYPE_FUZZY_MAP.items():
        if key in raw:
            return val
    return "light_work"


def _type_to_kind(task_type):
    """type → kind 反向映射"""
    return TYPE_TO_KIND.get(task_type, "action")


def _type_to_category(task_type):
    """type → category（保留旧字段兼容）"""
    if task_type in ("deep_work", "light_work", "meeting"):
        return "work"
    if task_type == "learning":
        return "study"
    return "health_life"


def _infer_type_from_title(title):
    """根据任务标题关键词推断任务类型"""
    title_lower = title.lower()
    # 按优先级匹配（先匹配更具体的）
    type_keywords = [
        ("meeting", ["会议", "会", "讨论", "汇报", "分享", "1对1", "评审", "站会", "周会", "对齐"]),
        ("exercise", ["跑", "健身", "运动", "瑜伽", "拉伸", "散步", "锻炼", "游泳", "骑行"]),
        ("meal", ["早餐", "午餐", "晚餐", "吃饭", "餐", "下午茶", "加餐"]),
        ("rest", ["冥想", "休息", "午睡", "小憩", "放松", "深呼吸", "闭目养神"]),
        ("learning", ["学习", "阅读", "看书", "课程", "研究", "教程", "视频", "复盘"]),
        ("deep_work", ["开发", "代码", "设计", "方案", "核心", "攻坚", "重构", "撰写"]),
        ("routine", ["洗漱", "通勤", "家务", "整理", "日常", "琐事"]),
        ("light_work", ["邮件", "消息", "整理", "录入", "报表", "更新"]),
    ]
    for task_type, keywords in type_keywords:
        if any(k in title_lower for k in keywords):
            return task_type
    return "light_work"


def _fallback_generate_tasks(main_goals, must_do_actions, energy_level, end_time, style):
    """AI 不可用时的规则兜底：根据风格生成模拟任务列表

    确保任务覆盖 8 种类型，数量和比例符合风格要求。
    """
    import random

    # 必做事项转换为任务格式（根据标题自动判断 type）
    must_tasks = []
    for idx, action in enumerate(must_do_actions):
        if isinstance(action, dict):
            title = action.get("title", action.get("name", f"必做事项{idx+1}"))
            est = action.get("estimated_minutes", 45)
            prio = action.get("priority", "high")
        else:
            title = str(action)
            est = 45
            prio = "high"
        # 根据标题关键词判断必做事项的 type
        task_type = _infer_type_from_title(title)
        must_tasks.append({
            "title": title,
            "type": task_type,
            "category": _type_to_category(task_type),
            "kind": _type_to_kind(task_type),
            "estimated_minutes": est,
            "cognitive_load": "medium",
            "priority": prio,
            "reason": "今日必做事项，不可推迟",
        })

    # ===== 8 种类型的任务模板池 =====
    # 模板格式: (title, minutes, cognitive_load, priority, reason)
    type_templates = {
        "deep_work": [
            ("推进核心项目的关键模块开发", 90, "deep", "high", "直接关系到今日目标的核心进展"),
            ("完成方案设计文档的核心章节", 75, "deep", "high", "聚焦深度思考，产出高质量成果"),
            ("深度阅读技术书籍并做笔记", 60, "deep", "medium", "系统学习，提升专业能力"),
            ("攻克一个复杂的技术难题", 60, "deep", "high", "集中精力突破关键卡点"),
            ("代码重构与架构优化", 75, "deep", "medium", "提升代码质量和可维护性"),
            ("撰写项目复盘报告", 50, "deep", "medium", "沉淀经验，指导后续工作"),
        ],
        "light_work": [
            ("处理积压的邮件和消息", 30, "light", "medium", "清理收件箱，避免重要事项被遗漏"),
            ("整理工作文档和文件归档", 25, "light", "low", "保持工作环境整洁有序"),
            ("更新项目进度表和任务状态", 20, "light", "medium", "保持信息同步，方便团队协作"),
            ("数据录入和报表整理", 30, "light", "low", "例行的数据处理工作"),
            ("回复非紧急的工作消息", 15, "light", "low", "处理轻量沟通，不打断深度工作"),
            ("准备会议材料和议程", 20, "medium", "medium", "确保会议高效进行"),
        ],
        "meeting": [
            ("项目周会与进度同步", 45, "medium", "high", "对齐团队进度，协调下一步计划"),
            ("与产品对齐需求细节", 30, "medium", "medium", "减少返工风险，确保方向正确"),
            ("代码 review 讨论会", 40, "medium", "medium", "保证代码质量，促进知识共享"),
            ("1对1 沟通与反馈", 25, "medium", "medium", "深入交流，建立信任"),
            ("项目启动/规划会", 60, "medium", "high", "明确目标和分工，打好开局"),
        ],
        "learning": [
            ("学习新框架的官方教程", 45, "deep", "medium", "拓展技术栈，提升解决问题的能力"),
            ("观看行业分享视频并做笔记", 40, "medium", "low", "拓宽视野，了解行业最新动态"),
            ("阅读技术博客和文章", 30, "medium", "low", "持续输入，保持技术敏感度"),
            ("复盘一个技术问题的解决思路", 30, "medium", "medium", "总结经验，避免同类问题"),
            ("学习一门新工具/技能", 50, "deep", "medium", "提升个人竞争力"),
        ],
        "exercise": [
            ("午间散步 20 分钟", 20, "light", "medium", "活动身体，缓解久坐疲劳，提升下午效率"),
            ("傍晚慢跑 30 分钟", 30, "light", "medium", "锻炼身体，释放压力，改善睡眠"),
            ("做一组颈椎放松操", 15, "light", "low", "保护颈椎，预防职业病"),
            ("办公室拉伸运动", 10, "light", "low", "活动筋骨，缓解久坐不适"),
            ("瑜伽练习 25 分钟", 25, "light", "medium", "舒展身体，提升柔韧性"),
        ],
        "rest": [
            ("冥想/深呼吸 10 分钟", 10, "light", "low", "放松大脑，恢复专注力"),
            ("午间小憩 20 分钟", 20, "light", "medium", "补充精力，提升下午工作效率"),
            ("闭目养神 5 分钟", 5, "light", "low", "短暂放松，缓解视觉疲劳"),
            ("听音乐放松 15 分钟", 15, "light", "low", "调节情绪，舒缓压力"),
            ("喝杯水，短暂休息一下", 5, "light", "low", "保持身体水分，短暂放空"),
        ],
        "meal": [
            ("准备并享用健康午餐", 40, "light", "medium", "规律饮食，保持下午精力充沛"),
            ("享用早餐并规划一天", 25, "light", "medium", "开启元气满满的一天"),
            ("晚餐时间，放松身心", 35, "light", "low", "结束一天的忙碌，好好吃饭"),
            ("下午茶/加餐时间", 15, "light", "low", "补充能量，避免下午犯困"),
        ],
        "routine": [
            ("晨间洗漱与整理", 15, "light", "low", "开启新的一天"),
            ("通勤路上听播客", 30, "light", "low", "利用碎片时间获取信息"),
            ("整理桌面和工作环境", 10, "light", "low", "整洁的环境提升工作效率"),
            ("下班前整理与复盘", 15, "light", "medium", "总结今日工作，规划明天"),
            ("家务/日常琐事处理", 20, "light", "low", "维持生活秩序，减少心理负担"),
        ],
    }

    # 根据风格确定任务数量和各类型比例
    # 格式: {total, type_ratios: {type: ratio}}
    style_config = {
        "safe": {
            "total": 7,
            "type_ratios": {
                "deep_work": 0.2, "light_work": 0.15, "meeting": 0.1,
                "learning": 0.15, "exercise": 0.15, "rest": 0.1,
                "meal": 0.05, "routine": 0.1,
            }
        },
        "balanced": {
            "total": 10,
            "type_ratios": {
                "deep_work": 0.3, "light_work": 0.15, "meeting": 0.1,
                "learning": 0.2, "exercise": 0.1, "rest": 0.05,
                "meal": 0.05, "routine": 0.05,
            }
        },
        "sprint": {
            "total": 14,
            "type_ratios": {
                "deep_work": 0.4, "light_work": 0.2, "meeting": 0.1,
                "learning": 0.15, "exercise": 0.05, "rest": 0.03,
                "meal": 0.04, "routine": 0.03,
            }
        },
    }

    cfg = style_config.get(style, style_config["balanced"])
    total_count = cfg["total"]

    # 计算各类型需要的任务数（必做任务已算入对应类型）
    must_type_counts = {}
    for t in must_tasks:
        mt = t["type"]
        must_type_counts[mt] = must_type_counts.get(mt, 0) + 1

    # 从模板池中随机选取
    rng = random.Random(hash(main_goals + style + str(end_time)) & 0xFFFFFFFF)

    result = []
    task_id = 1

    # 必做任务放最前面
    for t in must_tasks:
        t["id"] = f"ai-task-{task_id}"
        task_id += 1
        result.append(t)

    # 按类型生成补充任务
    for task_type in TASK_TYPES:
        # 计算该类型应该有的数量
        target_count = max(1 if task_type in ("exercise", "rest") else 0,
                           int(total_count * cfg["type_ratios"].get(task_type, 0)))
        # 减去已有的必做任务数
        need_count = max(0, target_count - must_type_counts.get(task_type, 0))
        if need_count <= 0:
            continue

        templates = type_templates.get(task_type, [])
        if not templates:
            continue

        selected = rng.sample(templates, min(need_count, len(templates)))
        for title, est, cog, prio, reason in selected:
            result.append({
                "id": f"ai-task-{task_id}",
                "title": title,
                "type": task_type,
                "category": _type_to_category(task_type),
                "kind": _type_to_kind(task_type),
                "estimated_minutes": est,
                "cognitive_load": cog,
                "priority": prio,
                "reason": reason,
            })
            task_id += 1

    # 如果任务数不够，从 deep_work 和 light_work 补充
    current_count = len(result)
    if current_count < total_count:
        extra_needed = total_count - current_count
        extra_templates = type_templates["deep_work"] + type_templates["light_work"]
        extra_selected = rng.sample(extra_templates, min(extra_needed, len(extra_templates)))
        for title, est, cog, prio, reason in extra_selected:
            task_type = "deep_work" if any(
                t[0] == title for t in type_templates["deep_work"]
            ) else "light_work"
            result.append({
                "id": f"ai-task-{task_id}",
                "title": title,
                "type": task_type,
                "category": _type_to_category(task_type),
                "kind": _type_to_kind(task_type),
                "estimated_minutes": est,
                "cognitive_load": cog,
                "priority": prio,
                "reason": reason,
            })
            task_id += 1

    return result


def ai_generate_tasks_from_goals(main_goals, must_do_actions, energy_level, end_time, style, context_summary=""):
    """根据用户目标和状态，调用 AI 生成今日任务列表

    Args:
        main_goals: 今日主要目标（字符串）
        must_do_actions: 必做事项列表（每项是 dict 或 str）
        energy_level: 精力状态 low/normal/high
        end_time: 结束时间（小时，如 22.0）
        style: 规划风格 safe/balanced/sprint
        context_summary: 已有任务/习惯/固定事件的上下文摘要（可选）

    Returns:
        list: 任务列表，每个任务包含 title, type, category, estimated_minutes,
              cognitive_load, priority, reason, id, kind 等字段
    """
    # 检查 AI 是否可用
    if not companion or not getattr(companion, 'ai', None):
        return _fallback_generate_tasks(main_goals, must_do_actions, energy_level, end_time, style)

    # 格式化必做事项
    must_do_text = ""
    if must_do_actions:
        items = []
        for a in must_do_actions:
            if isinstance(a, dict):
                t = a.get("title", a.get("name", ""))
                est = a.get("estimated_minutes", "")
                items.append(f"- {t}（约{est}分钟）" if est else f"- {t}")
            else:
                items.append(f"- {a}")
        must_do_text = "\n".join(items)

    # 精力状态中文描述
    energy_map = {
        "low": "精力偏低，容易疲劳",
        "normal": "精力一般，中等水平",
        "high": "精力充沛，状态很好",
        "unknown": "精力一般，中等水平",
    }
    energy_desc = energy_map.get(energy_level, "精力一般，中等水平")

    # 风格中文名
    style_name_map = {
        "safe": "稳妥保守",
        "balanced": "平衡推进",
        "sprint": "集中冲刺",
    }
    style_name = style_name_map.get(style, "平衡推进")

    # 构建 prompt —— 重构：加入8种任务类型定义和分布要求
    system_prompt = f"""你是专业的日程规划助手。请根据用户的今日目标和状态，生成一份具体的今日任务清单。

用户信息：
- 今日目标：{main_goals or '完成一天的工作与学习'}
- 已有任务/习惯/固定事件：
{context_summary if context_summary else '- 无额外上下文信息'}
- 必做事项：
{must_do_text if must_do_text else '- 无特殊必做事项'}
- 精力状态：{energy_desc}
- 结束时间：{int(end_time)}:{int((end_time % 1) * 60):02d}
- 规划风格：{style_name}（safe=稳妥保守, balanced=平衡推进, sprint=集中冲刺）

【任务类型定义】
你必须为每个任务指定 type 字段，从以下 8 种中选择：
1. deep_work - 深度工作：需要高度专注的复杂任务，如写代码、写方案、设计、深度阅读
2. light_work - 轻量工作：简单的执行类任务，如回邮件、整理文件、数据录入
3. meeting - 会议沟通：开会、讨论、电话、1对1
4. learning - 学习探索：上课、看书、学新技能、研究问题
5. exercise - 运动锻炼：跑步、健身、瑜伽、散步
6. rest - 休息放松：冥想、午睡、小憩、刷手机休息
7. meal - 餐饮：早餐、午餐、晚餐、加餐
8. routine - 日常事务：洗漱、通勤、做家务、购物

【要求】
1. 任务必须覆盖多种类型。不能全是 deep_work。一个健康的一天应该有工作、学习、运动、休息、日常事务等多种类型。
2. 工作类任务中，deep_work 和 light_work 要合理搭配（约 6:4）
3. 必须包含至少 1 个 exercise 类型、1 个 rest 类型
4. 高认知负荷和轻量任务交替搭配
5. 必做事项必须包含，并根据内容判断正确的 type
6. 稳妥风格：任务少而精，休息运动多，留白大
7. 平衡风格：工作学习为主，穿插运动休息，节奏适中
8. 冲刺风格：工作学习占比高，休息运动压缩到最少
9. 任务总数：稳妥 6-8 个，平衡 9-12 个，冲刺 13-16 个（不含固定的餐饮和日常事务）
10. 每个任务要有明确的预估时长（15-120分钟）。

只返回 JSON 数组，不要其他文字。格式：
[
  {{
    "title": "任务标题（具体有画面感，不要太笼统）",
    "type": "deep_work|light_work|meeting|learning|exercise|rest|meal|routine",
    "estimated_minutes": 45,
    "cognitive_load": "deep|medium|light",
    "priority": "high|medium|low",
    "reason": "为什么安排这个任务，和目标的关系"
  }}
]"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "请根据以上信息生成今日任务清单。"},
    ]

    try:
        reply = companion.ai.chat(messages, temperature=0.7, max_tokens=2500)
        # 提取 JSON
        import re
        json_match = re.search(r'\[.*\]', reply, re.DOTALL)
        if not json_match:
            return _fallback_generate_tasks(main_goals, must_do_actions, energy_level, end_time, style)

        tasks = json.loads(json_match.group())
        # 校验并补全字段
        result = []
        for idx, t in enumerate(tasks):
            # 确保必要字段存在
            title = t.get("title", "").strip()
            if not title:
                continue

            # ===== 新增：type 字段处理 =====
            raw_type = t.get("type", t.get("task_type", ""))
            task_type = _normalize_type(raw_type)
            kind = _type_to_kind(task_type)
            category = _type_to_category(task_type)

            est = t.get("estimated_minutes", 45)
            try:
                est = int(est)
                if est < 15:
                    est = 15
                elif est > 180:
                    est = 180
            except (ValueError, TypeError):
                est = 45
            cog = t.get("cognitive_load", "medium")
            if cog not in ("deep", "medium", "light"):
                cog = "medium"
            prio = t.get("priority", "medium")
            if prio not in ("high", "medium", "low"):
                prio = "medium"
            reason = t.get("reason", "")

            result.append({
                "id": f"ai-task-{idx + 1}",
                "title": title,
                "type": task_type,       # 新增：8种类型
                "category": category,    # 保留旧字段兼容
                "kind": kind,            # 根据 type 反向设置
                "estimated_minutes": est,
                "cognitive_load": cog,
                "priority": prio,
                "reason": reason,
            })

        # 确保至少有合理数量的任务
        if len(result) < 3:
            return _fallback_generate_tasks(main_goals, must_do_actions, energy_level, end_time, style)

        return result

    except Exception:
        # AI 调用失败，使用规则兜底
        return _fallback_generate_tasks(main_goals, must_do_actions, energy_level, end_time, style)


def ai_breakdown_goal(goal_text):
    """调用 AI 将目标拆解为今天可以执行的具体步骤

    Args:
        goal_text: 目标文字描述

    Returns:
        dict: 包含 goal, steps, breakdown_logic, total_minutes 的字典
    """
    # 检查 AI 是否可用
    if not companion or not getattr(companion, 'ai', None):
        return _fallback_breakdown_goal(goal_text)

    system_prompt = f"""请将这个目标拆解为今天可以执行的具体步骤：{goal_text}

拆解原则：
1. 每一步都是今天能做完的具体行动
2. 按执行顺序排列
3. 标注每步预估时长和认知负荷
4. 说明拆解的逻辑思路

返回 JSON：
{{
  "goal": "原目标",
  "steps": [
    {{"title": "步骤标题", "estimated_minutes": 30, "cognitive_load": "deep"}}
  ],
  "breakdown_logic": "拆解逻辑说明",
  "total_minutes": 180
}}"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": "请帮我拆解这个目标。"},
    ]

    try:
        reply = companion.ai.chat(messages, temperature=0.6, max_tokens=1200)
        # 提取 JSON
        import re
        json_match = re.search(r'\{.*\}', reply, re.DOTALL)
        if not json_match:
            return _fallback_breakdown_goal(goal_text)

        result = json.loads(json_match.group())
        # 校验字段
        steps = result.get("steps", [])
        valid_steps = []
        total = 0
        for s in steps:
            title = s.get("title", "").strip()
            if not title:
                continue
            est = s.get("estimated_minutes", 30)
            try:
                est = int(est)
            except (ValueError, TypeError):
                est = 30
            cog = s.get("cognitive_load", "medium")
            if cog not in ("deep", "medium", "light"):
                cog = "medium"
            valid_steps.append({
                "title": title,
                "estimated_minutes": est,
                "cognitive_load": cog,
            })
            total += est

        return {
            "goal": goal_text,
            "steps": valid_steps,
            "breakdown_logic": result.get("breakdown_logic", "按照目标执行的先后顺序拆解"),
            "total_minutes": total,
        }

    except Exception:
        return _fallback_breakdown_goal(goal_text)


def _fallback_breakdown_goal(goal_text):
    """目标拆解的规则兜底实现"""
    goal = goal_text or "完成今日目标"

    steps = [
        {"title": f"明确「{goal}」的具体范围和产出标准", "estimated_minutes": 20, "cognitive_load": "deep"},
        {"title": "拆分核心任务模块，列出关键步骤", "estimated_minutes": 30, "cognitive_load": "deep"},
        {"title": "执行第一部分核心工作", "estimated_minutes": 60, "cognitive_load": "deep"},
        {"title": "中途休息并检查进度", "estimated_minutes": 15, "cognitive_load": "light"},
        {"title": "执行第二部分核心工作", "estimated_minutes": 60, "cognitive_load": "deep"},
        {"title": "整理成果并复盘今日进展", "estimated_minutes": 25, "cognitive_load": "medium"},
    ]

    total = sum(s["estimated_minutes"] for s in steps)

    return {
        "goal": goal,
        "steps": steps,
        "breakdown_logic": "按照「明确目标 → 拆分模块 → 分步执行 → 整理复盘」的标准工作流拆解，确保每一步都有明确的产出和时间边界。",
        "total_minutes": total,
    }


@app.route("/api/plan/options", methods=["POST"])
def api_plan_options():
    """Step 3: 生成三种规划方案（稳妥/平衡/冲刺）

    Body: {
        main_goal: "完成项目方案设计",   // 主结果
        end_time: 22.0,                   // 结束时间（小时）
        energy_level: "normal",           // 精力状态: low/normal/high/unknown
        keep_actions: [...],              // 必须保留的行动 ID
        date: "2024-01-15"                // 可选日期
    }

    返回: {
        options: [
            { id: "safe", name: "稳妥完成", description: "...",
              main_goal: "...", action_count: N, total_minutes: N,
              buffer_minutes: N, risks: [...], tasks: [...], ... },
            { id: "balanced", ... },
            { id: "sprint", ... }
        ]
    }
    """
    from datetime import datetime
    from planning_engine import generate_plan

    data = request.get_json(silent=True) or {}
    today_str = data.get("date") or datetime.now().strftime("%Y-%m-%d")
    end_time_raw = data.get("end_time", 22.0)
    energy_level = data.get("energy_level", "normal")
    main_goal = data.get("main_goal", "")
    # 优先使用 must_do_items（前端新字段），兼容旧的 keep_actions
    must_do_items_input = data.get("must_do_items") or data.get("keep_actions") or []
    confirmed_empty = data.get("must_do_confirmed_empty", False)
    planning_intensity = data.get("planning_intensity", "balanced")
    fixed_events_input = data.get("fixed_events") or []
    habits_input = data.get("today_habits") or []

    # ===== 新增：入参校验 =====
    validation_warnings = []
    validation_errors = []
    date_valid = True
    end_time_valid = True

    # 校验日期
    try:
        datetime.strptime(today_str, "%Y-%m-%d")
    except ValueError:
        validation_errors.append(f"日期格式无效: {today_str}")
        date_valid = False
        today_str = datetime.now().strftime("%Y-%m-%d")

    # 解析结束时间：支持 "21:00" 字符串或 21.0 数字
    def _parse_end_time(val):
        if isinstance(val, (int, float)):
            return float(val)
        if isinstance(val, str):
            if ':' in val:
                parts = val.split(':')
                try:
                    return int(parts[0]) + int(parts[1]) / 60.0
                except (ValueError, IndexError):
                    return 22.0
            try:
                return float(val)
            except ValueError:
                return 22.0
        return 22.0

    end_time = _parse_end_time(end_time_raw)

    # 校验 end_time 范围（0-24）
    if end_time < 0 or end_time > 24:
        validation_errors.append(f"结束时间无效: {end_time_raw}，应在 0-24 之间")
        end_time_valid = False
        end_time = 22.0
    elif end_time <= 8:
        validation_warnings.append("结束时间较早，可用时间可能不足")

    db = companion.db if companion else Database()

    # 3. 固定事件：优先使用前端传来的（用户确认过的），否则从数据库读
    fixed_items = []
    if fixed_events_input and isinstance(fixed_events_input, list) and len(fixed_events_input) > 0:
        fixed_items = fixed_events_input
    else:
        existing_plan = db.get_daily_plan(today_str)
        if existing_plan and existing_plan.get("fixedItems"):
            fixed_items = existing_plan["fixedItems"]

    # ===== 收集必做事项（用于 AI 生成时必须包含） =====
    # 优先使用前端传来的 must_do_items（用户在条件确认阶段编辑过的）
    # 只有前端没有传时，才从数据库读取作为参考
    must_do_for_ai = []

    if must_do_items_input and isinstance(must_do_items_input, list) and len(must_do_items_input) > 0:
        # 使用前端传来的必做事项（用户确认过的）
        for item in must_do_items_input:
            if not isinstance(item, dict):
                continue
            title = item.get("title", "").strip()
            if not title:
                continue
            item_type = item.get("type") or _infer_type_from_title(title)
            item_type = _normalize_type(item_type)
            # 领域：优先使用用户选择的，否则从标题推断
            item_domain = item.get("domain_id") or item.get("domain")
            if not item_domain:
                inferred = _infer_domain_from_type_and_title(item_type, title)
                item_domain = inferred if inferred != "other" else "other"
            est_minutes = item.get("duration_minutes") or item.get("estimated_minutes") or 45
            priority = item.get("priority", "high")
            must_do_for_ai.append({
                "title": title,
                "estimated_minutes": int(est_minutes),
                "priority": priority,
                "type": item_type,
                "domain_id": item_domain,
                "source": item.get("source", "user_confirmed"),
            })
    elif not confirmed_empty:
        # 前端没有传必做事项，且没有确认空，才从数据库读取作为参考
        # 从 tasks 表获取高优先级任务作为必做事项参考
        try:
            tasks = db.get_tasks_by_date(today_str)
            for t in tasks:
                if t.status == "done":
                    continue
                # 旧7分类 → 新8分类
                task_type_8 = _convert_type_7_to_8(t.type or "work", t.title or "")
                task_domain = _infer_domain_from_type_and_title(task_type_8, t.title or "")
                must_do_for_ai.append({
                    "title": t.title,
                    "estimated_minutes": t.planned_minutes or 60,
                    "priority": t.priority or "medium",
                    "type": task_type_8,
                    "domain_id": task_domain,
                    "source": "from_db",
                })
        except Exception:
            pass

        # 从画布获取的任务也作为参考
        try:
            from canvas_store import CanvasStore
            store = CanvasStore(db)
            canvas_nodes = store.list_nodes()
            for n in canvas_nodes:
                nd = n.to_dict() if hasattr(n, 'to_dict') else n
                if nd.get("state") in ("done", "archived"):
                    continue
                if nd.get("kind") not in ("action", "task", None):
                    continue
                title = nd.get("title", "")
                if not title:
                    continue
                # 避免重复
                if not any(m.get("title") == title for m in must_do_for_ai):
                    task_type_8 = _infer_type_from_title(title)
                    task_domain = _infer_domain_from_type_and_title(task_type_8, title)
                    must_do_for_ai.append({
                        "title": title,
                        "estimated_minutes": nd.get("estimated_minutes") or nd.get("estimatedTime") or 45,
                        "priority": nd.get("priority") or nd.get("importance", "medium"),
                        "type": task_type_8,
                        "domain_id": task_domain,
                        "source": "from_canvas",
                    })
        except Exception:
            pass

    # ===== 新增：必做事项/候选目标为空时的 warning =====
    if not must_do_for_ai and not main_goal:
        validation_warnings.append("没有必做事项也没有主目标，方案将按通用情况生成")
    elif not must_do_for_ai:
        validation_warnings.append("没有设置必做事项，方案将围绕主目标生成")
    elif not main_goal:
        validation_warnings.append("没有设置主目标，方案将围绕必做事项展开")

    # ===== 判断是否使用 AI 生成任务 =====
    ai_available = bool(companion and getattr(companion, 'ai', None))

    # 用于记录任务来源（ai 或 fallback）
    task_source = "ai" if ai_available else "fallback"

    # ===== 新增：确保任务类型多样化的辅助函数 =====
    def _ensure_type_diversity(tasks, style):
        """确保任务列表包含至少 1 个 rest 和 1 个 exercise 类型（如只有 1-2 种类型时补充）

        返回: 补充后的任务列表
        """
        if not tasks:
            return tasks

        type_counts = {}
        for t in tasks:
            ttype = t.get("type", "light_work")
            type_counts[ttype] = type_counts.get(ttype, 0) + 1

        unique_types = len(type_counts)
        result = list(tasks)
        next_id = len(tasks) + 1

        # rest 类型补充
        if type_counts.get("rest", 0) < 1:
            result.append({
                "id": f"ai-task-diversity-rest-{next_id}",
                "title": "短暂休息放松",
                "type": "rest",
                "category": _type_to_category("rest"),
                "kind": _type_to_kind("rest"),
                "estimated_minutes": 10,
                "cognitive_load": "light",
                "priority": "low",
                "reason": "保证劳逸结合，穿插短暂休息以维持专注度",
                "_is_diversity_fill": True,
            })
            next_id += 1

        # exercise 类型补充
        if type_counts.get("exercise", 0) < 1 and style != "sprint":
            # 冲刺风格也至少加一个轻度运动
            result.append({
                "id": f"ai-task-diversity-ex-{next_id}",
                "title": "简单拉伸活动身体",
                "type": "exercise",
                "category": _type_to_category("exercise"),
                "kind": _type_to_kind("exercise"),
                "estimated_minutes": 10 if style == "sprint" else 15,
                "cognitive_load": "light",
                "priority": "low",
                "reason": "久坐后活动身体，缓解疲劳，保持健康",
                "_is_diversity_fill": True,
            })
            next_id += 1
        elif type_counts.get("exercise", 0) < 1 and style == "sprint":
            # 冲刺风格加一个超短的
            result.append({
                "id": f"ai-task-diversity-ex-{next_id}",
                "title": "起身活动 5 分钟",
                "type": "exercise",
                "category": _type_to_category("exercise"),
                "kind": _type_to_kind("exercise"),
                "estimated_minutes": 5,
                "cognitive_load": "light",
                "priority": "low",
                "reason": "快速活动身体，防止久坐疲劳",
                "_is_diversity_fill": True,
            })

        # 如果只有 1-2 种类型，再补充 light_work 和 routine
        if unique_types <= 2:
            if type_counts.get("light_work", 0) < 1:
                result.append({
                    "id": f"ai-task-diversity-lw-{next_id}",
                    "title": "处理零散消息和邮件",
                    "type": "light_work",
                    "category": _type_to_category("light_work"),
                    "kind": _type_to_kind("light_work"),
                    "estimated_minutes": 20,
                    "cognitive_load": "light",
                    "priority": "low",
                    "reason": "处理轻量事务，清理工作收件箱",
                    "_is_diversity_fill": True,
                })
                next_id += 1
            if type_counts.get("meal", 0) < 1 and unique_types <= 1:
                result.append({
                    "id": f"ai-task-diversity-meal-{next_id}",
                    "title": "午餐时间",
                    "type": "meal",
                    "category": _type_to_category("meal"),
                    "kind": _type_to_kind("meal"),
                    "estimated_minutes": 40,
                    "cognitive_load": "light",
                    "priority": "medium",
                    "reason": "规律饮食，补充能量",
                    "_is_diversity_fill": True,
                })

        return result

    # ===== 为三种风格分别生成任务列表 =====
    # 方案 A: 稳妥完成 - AI 生成稳妥风格任务
    safe_nodes = ai_generate_tasks_from_goals(
        main_goals=main_goal,
        must_do_actions=must_do_for_ai,
        energy_level=energy_level,
        end_time=end_time,
        style="safe",
    )
    # 新增：确保任务类型多样化
    safe_nodes = _ensure_type_diversity(safe_nodes, "safe")
    safe_plan = generate_plan(
        selected_nodes=safe_nodes,
        fixed_items=fixed_items,
        date_str=today_str,
        work_start=9.0,
        work_end=end_time,
        target_white_space=0.25,  # 25% 缓冲
    )

    # 方案 B: 平衡推进 - AI 生成平衡风格任务
    balanced_nodes = ai_generate_tasks_from_goals(
        main_goals=main_goal,
        must_do_actions=must_do_for_ai,
        energy_level=energy_level,
        end_time=end_time,
        style="balanced",
    )
    # 新增：确保任务类型多样化
    balanced_nodes = _ensure_type_diversity(balanced_nodes, "balanced")
    balanced_plan = generate_plan(
        selected_nodes=balanced_nodes,
        fixed_items=fixed_items,
        date_str=today_str,
        work_start=9.0,
        work_end=end_time,
        target_white_space=0.15,  # 15% 缓冲
    )

    # 方案 C: 集中冲刺 - AI 生成冲刺风格任务
    sprint_nodes = ai_generate_tasks_from_goals(
        main_goals=main_goal,
        must_do_actions=must_do_for_ai,
        energy_level=energy_level,
        end_time=end_time,
        style="sprint",
    )
    # 新增：确保任务类型多样化
    sprint_nodes = _ensure_type_diversity(sprint_nodes, "sprint")
    sprint_plan = generate_plan(
        selected_nodes=sprint_nodes,
        fixed_items=fixed_items,
        date_str=today_str,
        work_start=9.0,
        work_end=end_time + 1.0,  # 冲刺多1小时
        target_white_space=0.10,  # 10% 缓冲
    )

    # 计算各方案的风险和统计
    def build_option(plan_data, opt_id, name, desc, style, source_nodes=None):
        tasks = plan_data.get("tasks", [])
        unplaced = plan_data.get("unplacedTasks", [])
        total_min = plan_data.get("totalWorkMinutes", 0)
        buffer_ratio_val = plan_data.get("whiteSpaceRatio", 0)
        buffer_min = int(buffer_ratio_val * (end_time - 9) * 60)

        # ===== 新增：给任务补 category / type 字段 =====
        # 从 source_nodes 中通过 originNodeId 匹配原始节点，补回 category 和 type
        if source_nodes:
            node_map = {}
            for n in source_nodes:
                nid = str(n.get("id", ""))
                if nid:
                    node_map[nid] = n
            for t in tasks:
                oid = str(t.get("originNodeId", ""))
                if oid and oid in node_map:
                    src = node_map[oid]
                    if src.get("category"):
                        t["category"] = src["category"]
                    if src.get("type"):
                        t["type"] = src["type"]
                    if not t.get("reason") and src.get("reason"):
                        t["reason"] = src["reason"]
            for t in unplaced:
                oid = str(t.get("originNodeId", ""))
                if oid and oid in node_map:
                    src = node_map[oid]
                    if src.get("category"):
                        t["category"] = src["category"]
                    if src.get("type"):
                        t["type"] = src["type"]

        # 按 category 统计任务分布
        category_counts = {}
        for t in tasks:
            cat = t.get("category", "work")
            category_counts[cat] = category_counts.get(cat, 0) + 1

        # ===== 新增：按 type 统计任务分布 =====
        type_breakdown = {}
        total_task_minutes = 0
        for t in tasks:
            ttype = t.get("type")
            # 如果没有 type 字段，尝试根据 kind 推断
            if not ttype:
                from planning_engine import _kind_to_type
                ttype = _kind_to_type(t.get("kind", "action"))
            dur = t.get("duration") or t.get("estimated_minutes") or 0
            if ttype not in type_breakdown:
                type_breakdown[ttype] = {"count": 0, "minutes": 0}
            type_breakdown[ttype]["count"] += 1
            type_breakdown[ttype]["minutes"] += int(dur)
            total_task_minutes += int(dur)

        # 计算各类型占比
        for ttype in type_breakdown:
            ratio = round(
                type_breakdown[ttype]["minutes"] / total_task_minutes, 2
            ) if total_task_minutes > 0 else 0
            type_breakdown[ttype]["ratio"] = ratio

        risks = []
        if unplaced:
            risks.append(f"{len(unplaced)} 个任务未排入")
        if buffer_ratio_val < 0.1:
            risks.append("缓冲时间少，容易超时")
        if style == "sprint":
            risks.append("强度较高，需要良好状态")
        if style == "safe":
            risks.append("任务量较少，可能空闲")
        if not risks:
            risks.append("计划较为合理")

        # 主结果 = 第一个高优先级任务的标题
        main_result = ""
        for t in tasks:
            if t.get("priority") == "high":
                main_result = t.get("title", "")
                break
        if not main_result and tasks:
            main_result = tasks[0].get("title", "")

        # ===== 新增：方案详细说明 =====
        # 根据风格生成 highlights、reasoning、suitable_for、risk_details
        high_priority_count = sum(1 for t in tasks if t.get("priority") == "high")
        task_count = len(tasks)

        if style == "safe":
            highlights = [
                f"只保留最高优先级的 {high_priority_count or 2}-3 件事，确保核心目标一定完成",
                f"预留 {int(buffer_ratio_val * 100)}% 缓冲时间，应对突发情况和任务超时",
                "安排了充足的休息间隔，不会让你过度消耗",
            ]
            reasoning = (
                f"考虑到你今天精力状态为{energy_level_desc}，且有几个不确定时长的任务，"
                f"稳妥方案可以降低压力。即使中间被打断，也能保证最核心的事情做完。"
                f"今天重点是「完成质量」而非「完成数量」。"
            )
            suitable_for = "适合精力一般、任务难度不确定、容易被打断的日子"
            risk_details = [
                "任务量较少，如果状态好可能会觉得没挑战、闲得慌",
                "低优先级的事情会被延后到明天，可能造成积压",
                "如果当天意外顺利完成得很快，容易陷入无事可做的状态",
            ]
        elif style == "balanced":
            highlights = [
                f"主次任务搭配合理，{high_priority_count} 件高优 + {task_count - high_priority_count} 件中低优",
                f"保留 {int(buffer_ratio_val * 100)}% 缓冲时间，既不紧张也不松散",
                "穿插了不同认知负荷的任务交替，保持稳定节奏",
            ]
            reasoning = (
                f"平衡方案是大多数日子的最优选择。既保证了{main_goal or main_result}的推进，"
                f"也兼顾了日常事务的处理。{int(buffer_ratio_val * 100)}%的留白给意外留出了空间，"
                f"又不会因为太松而浪费时间。整体节奏和精力状态为{energy_level_desc}的你比较匹配。"
            )
            suitable_for = "适合状态不错、任务量适中、希望稳步推进的普通工作日"
            risk_details = [
                "如果某个高优任务超时，可能会挤压后面的中低优任务",
                "缓冲不算特别充裕，被频繁打断的话会有点赶",
                "如果精力不如预期，最后可能需要砍掉一两个低优任务",
            ]
        else:  # sprint
            highlights = [
                f"火力全开，安排了 {task_count} 件任务，最大化今日产出",
                f"缓冲压缩到 {int(buffer_ratio_val * 100)}%，把时间用在刀刃上",
                "多安排 1 小时冲刺时间，争取超额完成目标",
            ]
            reasoning = (
                f"冲刺方案适合状态好、想大干一场的日子。"
                f"把能塞的任务都安排上，配合高强度推进{main_goal or main_result}。"
                f"前提是你今天精力状态为{energy_level_desc}，"
                f"而且能保证专注不被打断。如果能顶住，今天的成就感会非常强。"
            )
            suitable_for = "适合精力充沛、专注力强、想挑战极限的高效日"
            risk_details = [
                "缓冲时间少，一旦某个任务卡壳就容易全线超时",
                "强度较高，下午和晚上可能会比较疲惫",
                "如果被意外打断，会有不少任务完不成",
                "连续冲刺容易透支，影响第二天的状态",
            ]

        # ===== 新增：方案依据说明 =====
        available_hours_val = round(end_time - 9.0, 1)
        fixed_count = len(fixed_items)
        must_do_count = len(must_do_for_ai)

        # 习惯数量（从数据库读取）
        habit_count_val = 0
        try:
            from event_engine import get_event_engine
            engine = get_event_engine(db)
            habit_nodes = engine.get_nodes_by_type("habit")
            habit_count_val = len(habit_nodes)
        except Exception:
            pass

        # 周洞察（暂不支持，标记为 false）
        has_weekly_insights = False

        # 构造说明 notes
        basis_notes = [
            f"今日可用时间约 {available_hours_val} 小时",
        ]
        if fixed_count > 0:
            basis_notes.append(f"固定会议/事件 {fixed_count} 项")
        else:
            basis_notes.append("未读取到固定事件")

        if must_do_count > 0:
            basis_notes.append(f"必做事项 {must_do_count} 项")
        else:
            basis_notes.append("未设置必做事项")

        if habit_count_val > 0:
            basis_notes.append(f"习惯 {habit_count_val} 项")
        else:
            basis_notes.append("未读取到习惯数据")

        if energy_level == "unknown" or not energy_level:
            basis_notes.append("未读取到精力状态，本方案暂按一般状态处理")
        else:
            basis_notes.append(f"精力状态：{energy_level}")

        basis = {
            "available_hours": available_hours_val,
            "fixed_events_count": fixed_count,
            "must_do_count": must_do_count,
            "habit_count": habit_count_val,
            "energy_level": energy_level if energy_level else "unknown",
            "has_weekly_insights": has_weekly_insights,
            "notes": basis_notes,
        }

        return {
            "id": opt_id,
            "name": name,
            "description": desc,
            "style": style,
            "main_goal": main_goal or main_result,
            "action_count": len(tasks),
            "total_minutes": total_min,
            "total_hours": round(total_min / 60, 1),
            "buffer_minutes": buffer_min,
            "buffer_ratio": round(buffer_ratio_val, 2),
            "risks": risks,
            "tasks": tasks,
            "unplaced_tasks": unplaced,
            "fixed_items": fixed_items,
            "suggestions": plan_data.get("suggestions", []),
            "white_space_ratio": buffer_ratio_val,
            # ===== 新增字段 =====
            "highlights": highlights,
            "reasoning": reasoning,
            "suitable_for": suitable_for,
            "risk_details": risk_details,
            # AI 生成任务的来源标记（ai / fallback）
            "task_source": task_source,
            # 任务分类统计（旧版 category）
            "category_breakdown": category_counts,
            # ===== 新增：8 种类型分布统计 =====
            "type_breakdown": type_breakdown,
            # ===== 新增：方案依据说明 =====
            "basis": basis,
        }

    # 新增：精力状态描述（用于 reasoning 文案）
    energy_level_map = {
        "low": "偏低",
        "normal": "一般",
        "high": "充沛",
        "unknown": "一般",
    }
    energy_level_desc = energy_level_map.get(energy_level, "一般")

    options = [
        build_option(safe_plan, "safe", "稳妥完成",
                     "完成概率优先，预留充足缓冲时间", "safe", safe_nodes),
        build_option(balanced_plan, "balanced", "平衡推进",
                     "工作与恢复兼顾，节奏适中", "balanced", balanced_nodes),
        build_option(sprint_plan, "sprint", "集中冲刺",
                     "高强度推进，缓冲时间较少", "sprint", sprint_nodes),
    ]

    # ===== 新增：validated_context 校验结果 =====
    validated_context = {
        "date_valid": date_valid,
        "end_time_valid": end_time_valid,
        "end_time": end_time,
        "must_do_count": len(must_do_for_ai),
        "fixed_events_count": len(fixed_items),
        "has_main_goal": bool(main_goal),
        "errors": validation_errors,
        "warnings": validation_warnings,
        "can_generate": len(validation_errors) == 0,
    }

    # ===== 新增：方案生成依据（让用户看到方案基于哪些条件）=====
    # 计算可用时间
    work_start = 9.0
    available_hours = max(0, end_time - work_start)
    fixed_hours = 0
    for fe in fixed_items:
        if isinstance(fe, dict):
            st = fe.get("startTime") or fe.get("start")
            et = fe.get("endTime") or fe.get("end")
            if st and et:
                try:
                    fixed_hours += (float(et) - float(st))
                except (ValueError, TypeError):
                    pass
    available_minutes = int(max(0, (available_hours - fixed_hours) * 60))

    # 统计各领域分布
    domain_counts = {}
    for m in must_do_for_ai:
        d = m.get("domain_id", "other")
        domain_counts[d] = domain_counts.get(d, 0) + 1

    basis_items = []
    basis_items.append(f"今日可用时间约 {available_minutes} 分钟")
    if fixed_items:
        basis_items.append(f"已有固定事件 {len(fixed_items)} 项")
    if must_do_for_ai:
        basis_items.append(f"必做事项 {len(must_do_for_ai)} 项")
    if main_goal:
        basis_items.append(f"围绕主目标：{main_goal}")
    if energy_level and energy_level != "unknown":
        energy_label = {"low": "精力较低", "normal": "精力一般", "high": "精力充足"}.get(energy_level, "精力状态未知")
        basis_items.append(f"当前{energy_label}")
    else:
        basis_items.append("未读取到精力状态，暂按一般状态处理")
    if habits_input:
        basis_items.append(f"今日习惯 {len(habits_input)} 项")
    if planning_intensity:
        intensity_label = {"safe": "稳妥强度", "balanced": "平衡强度", "sprint": "冲刺强度"}.get(planning_intensity, "平衡强度")
        basis_items.append(f"规划强度：{intensity_label}")

    # 领域分布
    if domain_counts:
        domain_labels = {"work": "工作", "study": "学习", "health": "健康", "life": "生活", "interest": "兴趣", "other": "其他"}
        domain_desc = "、".join([f"{domain_labels.get(k, k)}{v}项" for k, v in sorted(domain_counts.items(), key=lambda x: -x[1])])
        basis_items.append(f"必做事项领域分布：{domain_desc}")

    return jsonify({
        "options": options,
        "date": today_str,
        # 新增：上下文校验结果
        "validated_context": validated_context,
        # 新增：方案生成依据
        "basis": basis_items,
    })


@app.route("/api/plan/goal-breakdown", methods=["POST"])
def api_plan_goal_breakdown():
    """将一个大目标拆解为今天可以执行的具体步骤

    Body: {
        goal_text: "完成项目方案设计文档"  // 目标文字
    }

    返回: {
        ok: true,
        goal: "原目标",
        steps: [
            { title: "步骤标题", estimated_minutes: 30, cognitive_load: "deep" }
        ],
        breakdown_logic: "拆解逻辑说明",
        total_minutes: 180,
        source: "ai" | "fallback"   // 数据来源
    }
    """
    data = request.get_json(silent=True) or {}
    goal_text = (data.get("goal_text") or "").strip()

    if not goal_text:
        return jsonify({"ok": False, "error": "请输入目标内容"}), 400

    # 调用 AI 拆解目标（内部已包含 fallback 逻辑）
    result = ai_breakdown_goal(goal_text)

    # 判断来源
    ai_available = bool(companion and getattr(companion, 'ai', None))
    source = "ai" if ai_available else "fallback"

    return jsonify({
        "ok": True,
        "goal": result["goal"],
        "steps": result["steps"],
        "breakdown_logic": result["breakdown_logic"],
        "total_minutes": result["total_minutes"],
        "source": source,
    })


@app.route("/api/plan/regenerate", methods=["POST"])
def api_plan_regenerate():
    """Step 3.5: 重新生成规划方案（让 AI 再写一遍）

    入参与 options 相同，增加 seed/variant 参数，用于产出不同的方案版本。
    通过调整任务排序、缓冲比例、时间窗偏移等参数，确保和上一版有明显差异。

    Body: {
        main_goal: "完成项目方案设计",
        end_time: 22.0,
        energy_level: "normal",
        keep_actions: [...],
        date: "2024-01-15",
        seed: 1,              // 随机种子/变体号，每次+1产出不同方案
        variant: "shuffle",   // 变体策略：shuffle / focus / relaxed / night_owl
    }

    返回: 同 options 格式
    """
    from datetime import datetime
    from planning_engine import generate_plan
    import random

    data = request.get_json(silent=True) or {}
    today_str = data.get("date") or datetime.now().strftime("%Y-%m-%d")
    end_time_raw = data.get("end_time", 22.0)
    energy_level = data.get("energy_level", "normal")
    main_goal = data.get("main_goal", "")
    keep_actions = data.get("keep_actions", [])
    seed = data.get("seed", 1)
    variant = data.get("variant", "shuffle")

    # 解析结束时间
    def _parse_end_time(val):
        if isinstance(val, (int, float)):
            return float(val)
        if isinstance(val, str):
            if ':' in val:
                parts = val.split(':')
                try:
                    return int(parts[0]) + int(parts[1]) / 60.0
                except (ValueError, IndexError):
                    return 22.0
            try:
                return float(val)
            except ValueError:
                return 22.0
        return 22.0

    end_time = _parse_end_time(end_time_raw)

    db = companion.db if companion else Database()

    # 获取候选任务
    candidate_nodes = []

    tasks = db.get_tasks_by_date(today_str)
    for t in tasks:
        if t.status == "done":
            continue
        candidate_nodes.append({
            "id": f"task-{t.id}",
            "title": t.title,
            "estimated_minutes": t.planned_minutes or 60,
            "cognitive_load": "medium",
            "priority": t.priority or "medium",
            "kind": "action",
        })

    try:
        from canvas_store import CanvasStore
        store = CanvasStore(db)
        canvas_nodes = store.list_nodes()
        for n in canvas_nodes:
            nd = n.to_dict() if hasattr(n, 'to_dict') else n
            if nd.get("state") in ("done", "archived"):
                continue
            if nd.get("kind") not in ("action", "task", None):
                continue
            nid = str(nd.get("id", ""))
            if not any(c["id"] == nid for c in candidate_nodes):
                candidate_nodes.append({
                    "id": nid,
                    "title": nd.get("title", ""),
                    "estimated_minutes": nd.get("estimated_minutes") or nd.get("estimatedTime") or 45,
                    "cognitive_load": nd.get("cognitive_load") or "medium",
                    "priority": nd.get("priority") or nd.get("importance", "medium"),
                    "kind": nd.get("kind", "action"),
                })
    except Exception:
        pass

    # 固定事件
    fixed_items = []
    existing_plan = db.get_daily_plan(today_str)
    if existing_plan and existing_plan.get("fixedItems"):
        fixed_items = existing_plan["fixedItems"]

    # 兜底示例数据
    if not candidate_nodes:
        candidate_nodes = [
            {"id": "demo-1", "title": main_goal or "深度工作任务", "estimated_minutes": 120,
             "cognitive_load": "deep", "priority": "high", "kind": "action"},
            {"id": "demo-2", "title": "学习与阅读", "estimated_minutes": 60,
             "cognitive_load": "medium", "priority": "medium", "kind": "action"},
            {"id": "demo-3", "title": "沟通与协作", "estimated_minutes": 45,
             "cognitive_load": "light", "priority": "medium", "kind": "action"},
            {"id": "demo-4", "title": "运动锻炼", "estimated_minutes": 40,
             "cognitive_load": "light", "priority": "low", "kind": "action"},
            {"id": "demo-5", "title": "复盘与整理", "estimated_minutes": 30,
             "cognitive_load": "medium", "priority": "low", "kind": "action"},
        ]

    # ===== 根据 seed 和 variant 调整生成参数 =====
    # 用 seed 打乱任务顺序，产生不同的排列组合
    rng = random.Random(seed)
    shuffled_nodes = candidate_nodes[:]
    rng.shuffle(shuffled_nodes)

    # 根据 variant 调整各方案参数
    if variant == "focus":
        # 专注模式：更聚焦高优先级，减少任务数量
        safe_buffer = 0.30
        balanced_buffer = 0.20
        sprint_buffer = 0.12
        sprint_extra_hours = 0.5
        safe_ratio = 0.4  # 只取前 40% 高优
    elif variant == "relaxed":
        # 轻松模式：更多缓冲，更少任务
        safe_buffer = 0.35
        balanced_buffer = 0.25
        sprint_buffer = 0.18
        sprint_extra_hours = 0.0
        safe_ratio = 0.5
    elif variant == "night_owl":
        # 夜猫子模式：工作开始时间延后，结束时间延后
        safe_buffer = 0.20
        balanced_buffer = 0.12
        sprint_buffer = 0.08
        sprint_extra_hours = 1.5
        safe_ratio = 0.6
    else:  # shuffle（默认）
        safe_buffer = 0.22 + (seed % 5) * 0.02  # 22%-30% 随 seed 变化
        balanced_buffer = 0.12 + (seed % 5) * 0.02  # 12%-20%
        sprint_buffer = 0.08 + (seed % 3) * 0.02  # 8%-12%
        sprint_extra_hours = 0.5 + (seed % 3) * 0.5  # 0.5-1.5 小时
        safe_ratio = 0.5 + (seed % 3) * 0.1  # 50%-70%

    # 计算工作开始时间（夜猫子模式延后）
    work_start_offset = 1.0 if variant == "night_owl" else 0
    adj_work_start = 9.0 + work_start_offset
    adj_work_end = end_time + work_start_offset

    # 按优先级分层打乱（确保高优先级仍排在前面，但内部顺序随机）
    high_nodes = [n for n in shuffled_nodes if n.get("priority") == "high"]
    med_nodes = [n for n in shuffled_nodes if n.get("priority") == "medium"]
    low_nodes = [n for n in shuffled_nodes if n.get("priority") == "low"]

    # 方案 A: 稳妥完成
    safe_high_count = max(1, int(len(high_nodes) * safe_ratio))
    safe_nodes = high_nodes[:safe_high_count]
    if not safe_nodes:
        safe_nodes = shuffled_nodes[:2]
    # 随 seed 微调缓冲
    safe_buf = safe_buffer + (seed % 3) * 0.03
    safe_plan = generate_plan(
        selected_nodes=safe_nodes,
        fixed_items=fixed_items,
        date_str=today_str,
        work_start=adj_work_start,
        work_end=adj_work_end,
        target_white_space=round(safe_buf, 2),
    )

    # 方案 B: 平衡推进
    balanced_nodes = high_nodes + med_nodes
    if not balanced_nodes:
        balanced_nodes = shuffled_nodes
    balanced_buf = balanced_buffer + (seed % 4) * 0.02
    balanced_plan = generate_plan(
        selected_nodes=balanced_nodes,
        fixed_items=fixed_items,
        date_str=today_str,
        work_start=adj_work_start,
        work_end=adj_work_end,
        target_white_space=round(balanced_buf, 2),
    )

    # 方案 C: 集中冲刺
    sprint_nodes = shuffled_nodes
    sprint_buf = sprint_buffer + (seed % 2) * 0.02
    sprint_plan = generate_plan(
        selected_nodes=sprint_nodes,
        fixed_items=fixed_items,
        date_str=today_str,
        work_start=adj_work_start,
        work_end=adj_work_end + sprint_extra_hours,
        target_white_space=round(sprint_buf, 2),
    )

    # 计算各方案的风险和统计（复用 options 的 build_option 逻辑）
    def build_option_regen(plan_data, opt_id, name, desc, style):
        tasks = plan_data.get("tasks", [])
        unplaced = plan_data.get("unplacedTasks", [])
        total_min = plan_data.get("totalWorkMinutes", 0)
        buffer_ratio_val = plan_data.get("whiteSpaceRatio", 0)
        buffer_min = int(buffer_ratio_val * (adj_work_end - adj_work_start) * 60)

        # ===== 新增：按 type 统计任务分布 =====
        type_breakdown = {}
        total_task_minutes = 0
        for t in tasks:
            ttype = t.get("type")
            # 如果没有 type 字段，尝试根据 kind 推断
            if not ttype:
                from planning_engine import _kind_to_type
                ttype = _kind_to_type(t.get("kind", "action"))
            dur = t.get("duration") or t.get("estimated_minutes") or 0
            if ttype not in type_breakdown:
                type_breakdown[ttype] = {"count": 0, "minutes": 0}
            type_breakdown[ttype]["count"] += 1
            type_breakdown[ttype]["minutes"] += int(dur)
            total_task_minutes += int(dur)

        # 计算各类型占比
        for ttype in type_breakdown:
            ratio = round(
                type_breakdown[ttype]["minutes"] / total_task_minutes, 2
            ) if total_task_minutes > 0 else 0
            type_breakdown[ttype]["ratio"] = ratio

        risks = []
        if unplaced:
            risks.append(f"{len(unplaced)} 个任务未排入")
        if buffer_ratio_val < 0.1:
            risks.append("缓冲时间少，容易超时")
        if style == "sprint":
            risks.append("强度较高，需要良好状态")
        if style == "safe":
            risks.append("任务量较少，可能空闲")
        if not risks:
            risks.append("计划较为合理")

        main_result = ""
        for t in tasks:
            if t.get("priority") == "high":
                main_result = t.get("title", "")
                break
        if not main_result and tasks:
            main_result = tasks[0].get("title", "")

        # 新增字段
        high_priority_count = sum(1 for t in tasks if t.get("priority") == "high")
        task_count = len(tasks)

        energy_level_map = {
            "low": "偏低",
            "normal": "一般",
            "high": "充沛",
            "unknown": "一般",
        }
        energy_desc = energy_level_map.get(energy_level, "一般")

        if style == "safe":
            highlights = [
                f"优先保证 {high_priority_count or 2} 件核心事，完成度有保障",
                f"预留 {int(buffer_ratio_val * 100)}% 缓冲时间，不怕突发状况",
                f"这版安排更{variant_name}，节奏更舒缓",
            ]
            reasoning = (
                f"这是重新生成的稳妥方案（第{seed}版）。调整了任务排列顺序和缓冲比例，"
                f"确保{main_goal or main_result}稳稳落地。"
                f"考虑到你精力{energy_desc}，这个版本留足了喘气空间，"
                f"即使被打断也不慌。"
            )
            suitable_for = f"适合{variant_name}、想稳扎稳打的日子"
            risk_details = [
                "任务选得少，可能错过一些本可以完成的事",
                "如果状态超好，会觉得安排太松",
                "部分中等优先级的事被推迟了",
            ]
        elif style == "balanced":
            highlights = [
                f"高优 {high_priority_count} 件 + 其他 {task_count - high_priority_count} 件，搭配均衡",
                f"{int(buffer_ratio_val * 100)}% 缓冲，松紧适度",
                f"任务顺序做了调整，试试不同的节奏",
            ]
            reasoning = (
                f"这是重新生成的平衡方案（第{seed}版）。换了一种任务排列方式，"
                f"看看哪种顺序更顺手。"
                f"核心目标{main_goal or main_result}不变，但周边任务的组合和顺序有所调整，"
                f"说不定这版更符合你的直觉。"
            )
            suitable_for = f"适合想换个节奏、保持{variant_name}的普通日子"
            risk_details = [
                "换了任务顺序，可能需要一点时间适应",
                "缓冲中规中矩，太浪的话容易超时",
                "部分中低优任务可能排不上",
            ]
        else:  # sprint
            highlights = [
                f"火力全开 {task_count} 件，今天要大干一场",
                f"缓冲 {int(buffer_ratio_val * 100)}%，每一分钟都用起来",
                f"冲刺版调整了排序，把最有挑战的放在状态最好的时段",
            ]
            reasoning = (
                f"这是重新生成的冲刺方案（第{seed}版）。"
                f"任务组合和排序都变了，核心{main_goal or main_result}的推进方式不同。"
                f"如果你精力{energy_desc}、能扛住压力，"
                f"这版可能比上一版效率更高。干就完了！"
            )
            suitable_for = f"适合状态爆棚、想挑战极限的{variant_name}日子"
            risk_details = [
                "缓冲不多，卡壳就容易超时",
                "强度大，后半段可能累",
                "被打断的话会比较伤",
                "连续冲刺要注意恢复",
            ]

        return {
            "id": opt_id,
            "name": name,
            "description": desc,
            "style": style,
            "main_goal": main_goal or main_result,
            "action_count": len(tasks),
            "total_minutes": total_min,
            "total_hours": round(total_min / 60, 1),
            "buffer_minutes": buffer_min,
            "buffer_ratio": round(buffer_ratio_val, 2),
            "risks": risks,
            "tasks": tasks,
            "unplaced_tasks": unplaced,
            "fixed_items": fixed_items,
            "suggestions": plan_data.get("suggestions", []),
            "white_space_ratio": buffer_ratio_val,
            # 新增字段
            "highlights": highlights,
            "reasoning": reasoning,
            "suitable_for": suitable_for,
            "risk_details": risk_details,
            # ===== 新增：8 种类型分布统计 =====
            "type_breakdown": type_breakdown,
        }

    # variant 中文名
    variant_names = {
        "shuffle": "打乱重排",
        "focus": "聚焦核心",
        "relaxed": "轻松节奏",
        "night_owl": "夜猫子",
    }
    variant_name = variant_names.get(variant, "打乱重排")

    options = [
        build_option_regen(safe_plan, "safe", f"稳妥完成·{variant_name}",
                           f"重新生成·稳妥版（第{seed}次）", "safe"),
        build_option_regen(balanced_plan, "balanced", f"平衡推进·{variant_name}",
                           f"重新生成·平衡版（第{seed}次）", "balanced"),
        build_option_regen(sprint_plan, "sprint", f"集中冲刺·{variant_name}",
                           f"重新生成·冲刺版（第{seed}次）", "sprint"),
    ]

    return jsonify({
        "options": options,
        "date": today_str,
        "seed": seed,
        "variant": variant,
        "regenerated": True,
    })


@app.route("/api/plan/apply", methods=["POST"])
def api_plan_apply():
    """Step 5: 写入最终方案到今日计划

    Body: {
        option_id: "balanced",           // 选择的方案 ID
        tasks: [...],                     // 微调后的时间块列表
        main_goal: "...",                 // 主目标
        date: "2024-01-15",              // 可选日期
        save_only: false,                 // 仅保存方案不应用（暂不支持）
    }
    """
    from datetime import datetime
    from banban_models import DailyPlan, DailyCommitment, PlannedAction

    data = request.get_json(silent=True) or {}
    today_str = data.get("date") or datetime.now().strftime("%Y-%m-%d")
    tasks = data.get("tasks", [])
    option_id = data.get("option_id", "")
    main_goal = data.get("main_goal", "")

    db = companion.db if companion else Database()

    # 构建 DailyPlan
    plan_id = str(uuid.uuid4())[:8]
    plan_tasks = []
    for i, t in enumerate(tasks):
        action = PlannedAction(
            origin_node_id=t.get("originNodeId", t.get("id", "")),
            title=t.get("title", ""),
            start_time=t.get("startTime", 0),
            duration=t.get("duration", 45),
            type=t.get("type", "light_work"),
            cognitive_load=t.get("cognitiveLoad", "medium"),
            priority=t.get("priority", "medium"),
            reason=t.get("reason", ""),
            order=i,
        )
        plan_tasks.append(action.to_dict())

    # 固定项（从传入数据或现有计划获取）
    fixed_items = data.get("fixed_items", [])
    if not fixed_items:
        existing = db.get_daily_plan(today_str)
        if existing:
            fixed_items = existing.get("fixedItems", [])

    # 计算统计
    total_min = sum(t.get("duration", 0) for t in plan_tasks)
    work_start = 9.0
    work_end = 22.0
    total_available = (work_end - work_start) * 60
    fixed_min = 0
    for fi in fixed_items:
        st = fi.get("startTime", 0)
        et = fi.get("endTime", 0)
        if st and et and et > st:
            fixed_min += (et - st) / 60000
    white_space = max(0, (total_available - fixed_min - total_min) / total_available) if total_available > 0 else 0

    plan_dict = {
        "id": plan_id,
        "date": today_str,
        "tasks": plan_tasks,
        "unplacedTasks": data.get("unplaced_tasks", []),
        "fixedItems": fixed_items,
        "whiteSpaceRatio": round(white_space, 2),
        "totalWorkMinutes": int(total_min),
        "suggestions": [f"已应用 {option_id} 方案，主目标：{main_goal}"] if main_goal else [],
        "status": "confirmed",
        "algorithmVersion": "v2.0-options",
        "mainGoal": main_goal,
        "selectedOption": option_id,
        "confirmedAt": datetime.now().isoformat(),
        "createdAt": datetime.now().isoformat(),
    }

    # 保存计划
    saved_plan_id = db.save_daily_plan(plan_dict)

    # 生成承诺（commitments）
    commitment_ids = []
    for t in plan_tasks:
        comm = DailyCommitment(
            plan_id=saved_plan_id,
            origin_node_id=t.get("originNodeId", ""),
            title=t.get("title", ""),
            scheduled_start=t.get("startTime", 0),
            scheduled_duration=t.get("duration", 45),
            type=t.get("type", "light_work"),
            cognitive_load=t.get("cognitiveLoad", "medium"),
            priority=t.get("priority", "medium"),
            status="scheduled",
            reason=t.get("reason", ""),
        )
        comm_dict = comm.to_dict()
        cid = db.save_commitment(comm_dict)
        commitment_ids.append(cid)
        try:
            db.add_plan_event("CommitmentCreated", cid, "commitment", comm_dict)
        except Exception:
            pass

    try:
        db.add_plan_event("PlanApplied", saved_plan_id, "plan", {
            "optionId": option_id,
            "mainGoal": main_goal,
            "commitmentCount": len(commitment_ids),
        })
    except Exception:
        pass

    return jsonify({
        "ok": True,
        "plan_id": saved_plan_id,
        "plan": plan_dict,
        "commitment_ids": commitment_ids,
        "message": f"已写入 {len(plan_tasks)} 个行动到今日计划",
    })


@app.route("/api/commitment/<comm_id>/start", methods=["POST"])
def api_commitment_start(comm_id):
    """开始执行承诺"""
    db = companion.db if companion else Database()
    comm = db.get_commitment(comm_id)
    if not comm:
        return jsonify({"error": "承诺不存在"}), 404
    
    from datetime import datetime
    now = datetime.now().timestamp() * 1000
    db.update_commitment_status(comm_id, "in_progress", {
        "actualStartTime": now,
    })
    db.add_plan_event("CommitmentStarted", comm_id, "commitment", {"actualStart": now})
    
    return jsonify({"message": "已开始", "commitment_id": comm_id, "status": "in_progress"})


@app.route("/api/commitment/<comm_id>/complete", methods=["POST"])
def api_commitment_complete(comm_id):
    """完成承诺"""
    db = companion.db if companion else Database()
    comm = db.get_commitment(comm_id)
    if not comm:
        return jsonify({"error": "承诺不存在"}), 404
    
    from datetime import datetime
    now = datetime.now().timestamp() * 1000
    actual_start = comm.get("actualStartTime") or now
    actual_dur = int((now - actual_start) / 60000)  # 分钟
    
    db.update_commitment_status(comm_id, "done", {
        "actualEndTime": now,
        "actualDuration": actual_dur,
    })
    db.add_plan_event("CommitmentCompleted", comm_id, "commitment", {
        "actualEnd": now, "actualDuration": actual_dur,
    })
    
    return jsonify({
        "message": "已完成", "commitment_id": comm_id, "status": "done",
        "actual_duration": actual_dur,
    })


@app.route("/api/commitment/<comm_id>/pause", methods=["POST"])
def api_commitment_pause(comm_id):
    """暂停承诺"""
    db = companion.db if companion else Database()
    comm = db.get_commitment(comm_id)
    if not comm:
        return jsonify({"error": "承诺不存在"}), 404
    
    pause_count = (comm.get("pauseCount") or 0) + 1
    db.update_commitment_status(comm_id, "paused", {
        "pauseCount": pause_count,
    })
    db.add_plan_event("CommitmentPaused", comm_id, "commitment", {"pauseCount": pause_count})
    
    return jsonify({"message": "已暂停", "commitment_id": comm_id, "status": "paused"})


@app.route("/api/commitment/<comm_id>/skip", methods=["POST"])
def api_commitment_skip(comm_id):
    """跳过承诺"""
    db = companion.db if companion else Database()
    data = request.get_json(silent=True) or {}
    reason = data.get("reason", "")
    
    comm = db.get_commitment(comm_id)
    if not comm:
        return jsonify({"error": "承诺不存在"}), 404
    
    db.update_commitment_status(comm_id, "skipped", {"skippedReason": reason})
    db.add_plan_event("CommitmentSkipped", comm_id, "commitment", {"reason": reason})
    # 跳过是一种偏差（not_executed, severe）
    db.add_plan_event("PlanDeviationDetected", comm_id, "commitment", {
        "commitmentId": comm_id, "types": ["not_executed"], "maxSeverity": "severe",
    })
    
    return jsonify({"message": "已跳过", "commitment_id": comm_id, "status": "skipped"})


@app.route("/api/commitment/<comm_id>/postpone", methods=["POST"])
def api_commitment_postpone(comm_id):
    """顺延承诺"""
    db = companion.db if companion else Database()
    comm = db.get_commitment(comm_id)
    if not comm:
        return jsonify({"error": "承诺不存在"}), 404
    
    postpone_count = (comm.get("postponeCount") or 0) + 1
    db.update_commitment_status(comm_id, "postponed", {
        "postponeCount": postpone_count,
        "lastPostponedFrom": comm.get("status", ""),
    })
    db.add_plan_event("CommitmentPostponed", comm_id, "commitment", {
        "postponeCount": postpone_count,
    })
    # 顺延是一种偏差（not_executed, moderate）
    db.add_plan_event("PlanDeviationDetected", comm_id, "commitment", {
        "commitmentId": comm_id, "types": ["not_executed"], "maxSeverity": "moderate",
    })
    
    return jsonify({"message": "已顺延", "commitment_id": comm_id, "status": "postponed"})


@app.route("/api/commitments/today", methods=["GET"])
def api_commitments_today():
    """获取今日所有承诺"""
    db = companion.db if companion else Database()
    commitments = db.get_commitments_by_date()
    return jsonify({"commitments": commitments})


@app.route("/api/deviation/report", methods=["GET"])
def api_deviation_report():
    """获取今日偏差报告"""
    from planning_engine import calculate_deviation
    db = companion.db if companion else Database()
    
    date_str = request.args.get("date")
    commitments = db.get_commitments_by_date(date_str)
    if not commitments:
        return jsonify({"report": None, "message": "今日无承诺数据"})
    
    # 从行为认知引擎获取实际活动段
    activity_segments = []
    try:
        for br in db.get_behavior_results(limit=50):
            activity_segments.append({
                "start": br.get("timestamp", 0),
                "end": br.get("timestamp", 0) + 300000,  # 5分钟
                "activityType": br.get("primary_state", "unknown"),
                "confidence": br.get("confidence", 0.5),
                "source": "auto_detected",
            })
    except Exception:
        pass
    
    report = calculate_deviation(commitments, activity_segments)
    
    # AI 生成温暖总结
    try:
        if ai_router:
            summary_prompt = (
                f"今天的计划完成率 {report.get('completionRate', 0):.0%}，"
                f"完成了 {report.get('completed', 0)}/{report.get('totalPlanned', 0)} 个承诺。"
                f"平均开始偏差 {report.get('avgStartDeviation', 0):.0f} 分钟。"
                "请用一句话温暖地总结今天，不要评判，只是理解。"
            )
            result = ai_router._call_deepseek(summary_prompt, temperature=0.8)
            if result:
                report["summary"] = result.strip()[:100]
    except Exception:
        pass
    
    return jsonify({"report": report})


@app.route("/api/plan/nodes", methods=["GET"])
def api_plan_nodes():
    """获取可排入计划的画布节点（commitment >= intended 的节点）"""
    try:
        from canvas_store import CanvasStore
        store = CanvasStore(Database())
        all_nodes = store.list_nodes()
        # 只返回有行动意向的节点
        selectable = [
            n.to_dict() for n in all_nodes
            if n.commitment in ("intended", "confirmed", "scheduled", "executing")
            and not n.deleted_at
        ]
        return jsonify({"nodes": selectable})
    except Exception as e:
        return jsonify({"nodes": [], "error": str(e)})


# ========= 任务工作区 API（Sunsama 风格）=========

def _task_to_dict(t: Task) -> dict:
    return {
        "id": t.id, "title": t.title, "type": t.type, "priority": t.priority,
        "channel": t.channel, "planned_minutes": t.planned_minutes,
        "actual_minutes": t.actual_minutes, "start_time": t.start_time,
        "end_time": t.end_time, "status": t.status, "date": t.date,
        "note": t.note, "created_at": t.created_at, "completed_at": t.completed_at,
    }


def _get_task(tid: int) -> Task:
    conn = companion.db._conn()
    row = conn.execute("SELECT * FROM tasks WHERE id=?", (tid,)).fetchone()
    return companion.db._row_to_task(row) if row else None


@app.route("/api/tasks", methods=["GET", "POST"])
def api_tasks():
    if request.method == "GET":
        date_str = request.args.get("date")
        if date_str:
            tasks = companion.db.get_tasks_by_date(date_str)
        else:
            tasks = companion.db.get_all_tasks()
        return jsonify([_task_to_dict(t) for t in tasks])

    elif request.method == "POST":
        data = request.json
        t = Task(
            title=data.get("title", ""),
            type=data.get("type", "work"),
            priority=data.get("priority", "medium"),
            channel=data.get("channel", ""),
            planned_minutes=data.get("planned_minutes", 60),
            start_time=data.get("start_time"),
            end_time=data.get("end_time"),
            status=data.get("status", "backlog"),
            date=data.get("date", ""),
            note=data.get("note", ""),
        )
        tid = companion.db.add_task(t)
        return jsonify({"ok": True, "id": tid})


@app.route("/api/tasks/backlog")
def api_tasks_backlog():
    tasks = companion.db.get_backlog_tasks()
    return jsonify([_task_to_dict(t) for t in tasks])


@app.route("/api/tasks/range")
def api_tasks_range():
    start = request.args.get("start")
    end = request.args.get("end")
    if not start or not end:
        return jsonify([])
    tasks = companion.db.get_tasks_range(start, end)
    return jsonify([_task_to_dict(t) for t in tasks])


@app.route("/api/tasks/<int:tid>", methods=["PUT", "DELETE"])
def api_task_update(tid):
    if request.method == "PUT":
        data = request.json
        t = _get_task(tid)
        if not t:
            return jsonify({"ok": False, "error": "任务不存在"}), 404
        t.title = data.get("title", t.title)
        t.type = data.get("type", t.type)
        t.priority = data.get("priority", t.priority)
        t.channel = data.get("channel", t.channel)
        t.planned_minutes = data.get("planned_minutes", t.planned_minutes)
        t.actual_minutes = data.get("actual_minutes", t.actual_minutes)
        t.start_time = data.get("start_time", t.start_time)
        t.end_time = data.get("end_time", t.end_time)
        t.status = data.get("status", t.status)
        t.date = data.get("date", t.date)
        t.note = data.get("note", t.note)
        if data.get("status") == "done" and not t.completed_at:
            t.completed_at = datetime.now().isoformat()
        companion.db.update_task(t)
        return jsonify({"ok": True})

    elif request.method == "DELETE":
        companion.db.delete_task(tid)
        return jsonify({"ok": True})


@app.route("/api/tasks/bulk", methods=["POST"])
def api_tasks_bulk():
    """批量创建任务（每日规划提取后用）"""
    data = request.json
    tasks_data = data.get("tasks", [])
    date_str = data.get("date", "")
    ids = []
    for td in tasks_data:
        t = Task(
            title=td.get("title", ""),
            type=td.get("type", "work"),
            priority=td.get("priority", "medium"),
            planned_minutes=td.get("estimated_minutes", td.get("planned_minutes", 60)),
            status=td.get("status", "backlog"),
            date=date_str,
            note=td.get("note", ""),
        )
        ids.append(companion.db.add_task(t))
    return jsonify({"ok": True, "ids": ids})


@app.route("/api/tasks/timebox", methods=["POST"])
def api_tasks_timebox():
    """批量 timebox（安排时间块）"""
    data = request.json
    schedule = data.get("schedule", [])
    date_str = data.get("date", "")
    for item in schedule:
        tid = item.get("id")
        if tid:
            t = _get_task(tid)
            if t:
                t.start_time = item.get("startTime")
                t.end_time = item.get("endTime")
                t.status = "planned"
                t.date = date_str
                if item.get("note"):
                    t.note = item["note"]
                companion.db.update_task(t)
        else:
            # 新任务
            t = Task(
                title=item.get("title", ""),
                type=item.get("type", "work"),
                start_time=item.get("startTime"),
                end_time=item.get("endTime"),
                status="planned",
                date=date_str,
                note=item.get("note", ""),
            )
            companion.db.add_task(t)
    return jsonify({"ok": True})


# ========= 洞察汇总 API =========

@app.route("/api/insight/weekly-summary")
def api_insight_weekly_summary():
    """
    洞察页周汇总数据接口
    返回专注趋势折线图 + 任务分类饼图 + 核心指标 + 热力图 + AI周报 + 规划传递数据
    优先使用数据库真实数据，不足时生成自然的模拟数据
    支持 GET 参数：
      - range: last_week | this_week | this_month | custom  (默认 last_week)
      - start_date, end_date: 自定义日期范围（YYYY-MM-DD）
    """
    import random
    import math
    from datetime import timedelta

    # ========== 1. 周期参数解析（range_info）==========
    today = datetime.now().date()
    range_type = request.args.get("range", "last_week")
    custom_start = request.args.get("start_date")
    custom_end = request.args.get("end_date")

    # 根据 range_type 计算周期起止
    is_ongoing = False
    data_cutoff_time = None

    if range_type == "this_week":
        # 本周（周一到周日，若未结束则 is_ongoing=true）
        days_since_monday = today.weekday()
        start_date = today - timedelta(days=days_since_monday)
        end_date = start_date + timedelta(days=6)  # 周日
        is_ongoing = today < end_date
        if is_ongoing:
            data_cutoff_time = datetime.now().strftime("%Y-%m-%d %H:%M")
    elif range_type == "this_month":
        # 本月（1号到月末）
        start_date = today.replace(day=1)
        # 计算月末：下个月1号 - 1天
        if start_date.month == 12:
            next_month = start_date.replace(year=start_date.year + 1, month=1)
        else:
            next_month = start_date.replace(month=start_date.month + 1)
        end_date = next_month - timedelta(days=1)
        is_ongoing = today < end_date
        if is_ongoing:
            data_cutoff_time = datetime.now().strftime("%Y-%m-%d %H:%M")
    elif range_type == "custom" and custom_start and custom_end:
        # 自定义日期范围
        try:
            start_date = datetime.strptime(custom_start, "%Y-%m-%d").date()
            end_date = datetime.strptime(custom_end, "%Y-%m-%d").date()
        except ValueError:
            # 日期格式错误，回退到 last_week
            range_type = "last_week"
            days_since_monday = today.weekday()
            this_monday = today - timedelta(days=days_since_monday)
            start_date = this_monday - timedelta(days=7)
            end_date = this_monday - timedelta(days=1)
        is_ongoing = end_date >= today
        if is_ongoing:
            data_cutoff_time = datetime.now().strftime("%Y-%m-%d %H:%M")
    else:
        # 默认 last_week：上一完整周（周一到周日）
        range_type = "last_week"
        days_since_monday = today.weekday()
        this_monday = today - timedelta(days=days_since_monday)
        start_date = this_monday - timedelta(days=7)
        end_date = this_monday - timedelta(days=1)
        is_ongoing = False

    start_str = start_date.strftime("%Y-%m-%d")
    end_str = end_date.strftime("%Y-%m-%d")
    total_days = (end_date - start_date).days + 1

    # 周期信息对象
    range_info = {
        "range_type": range_type,
        "start_date": start_str,
        "end_date": end_str,
        "is_ongoing": is_ongoing,
        "data_cutoff_time": data_cutoff_time,
    }

    # ========== 2. 数据获取与基础聚合 ==========
    # 从数据库获取周期内的任务
    try:
        tasks = companion.db.get_tasks_range(start_str, end_str)
    except Exception:
        tasks = []

    task_dicts = [_task_to_dict(t) for t in tasks]

    # ---- 聚合真实的每日数据 ----
    weekday_names = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    real_daily = {}  # date_str -> {focus_min, total, done}
    for i in range(total_days):
        d = start_date + timedelta(days=i)
        ds = d.strftime("%Y-%m-%d")
        real_daily[ds] = {"focus_min": 0, "total": 0, "done": 0}

    for t in task_dicts:
        ds = t.get("date", "")
        if ds not in real_daily:
            continue
        mins = t.get("actual_minutes") or t.get("planned_minutes") or 0
        real_daily[ds]["focus_min"] += mins
        real_daily[ds]["total"] += 1
        status = t.get("status", "")
        if status in ("done", "completed", "已完成") or t.get("completed") or t.get("done"):
            real_daily[ds]["done"] += 1

    # 统计有真实数据的天数
    days_with_data = sum(1 for v in real_daily.values() if v["focus_min"] > 0 or v["total"] > 0)
    total_focus_min = sum(v["focus_min"] for v in real_daily.values())

    # ---- 固定种子随机数生成器（保证同一周期结果一致）----
    seed_sum = sum(ord(c) for c in start_str + end_str)
    rng = random.Random(seed_sum)

    # 基础参数：根据真实数据估算基准值
    if days_with_data >= 3 and total_focus_min > 0:
        avg_focus = total_focus_min / days_with_data
    else:
        avg_focus = 180  # 默认 3 小时

    # ========== 3. 折线图数据 line_data（保留原有逻辑）==========
    line_data = []
    display_days = min(total_days, 7)  # 折线图最多显示 7 天
    # 计算显示起始偏移（取最近7天）
    offset = max(0, total_days - 7)

    for i in range(display_days):
        day_idx = offset + i
        d = start_date + timedelta(days=day_idx)
        ds = d.strftime("%Y-%m-%d")
        weekday = d.weekday()  # 0=周一, 6=周日
        label = weekday_names[(weekday + 1) % 7]

        real = real_daily[ds]

        if real["focus_min"] > 0 or real["total"] > 0:
            # 有真实数据，直接使用
            focus_min = real["focus_min"]
            completion_rate = (real["done"] / real["total"]) if real["total"] > 0 else 0.65
        else:
            # 无真实数据，生成自然模拟值
            # 工作日高一些，周末明显更低
            weekend_factor = 1.0
            if weekday == 5:  # 周六
                weekend_factor = 0.65
            elif weekday == 6:  # 周日
                weekend_factor = 0.55

            # 基于平均值 + 平滑波动
            wave = math.sin(day_idx * 0.8 + seed_sum * 0.013) * 0.18
            noise = rng.uniform(-0.1, 0.1)
            variation = 1.0 + wave + noise

            focus_min = max(20, int(avg_focus * weekend_factor * variation))
            # 完成率也跟随波动，且周末也略低
            rate_base = 0.70 + wave * 0.1 + rng.uniform(-0.06, 0.06)
            completion_rate = max(0.3, min(0.92, rate_base * (0.85 if weekend_factor < 1 else 1.0)))

        line_data.append({
            "date": label,
            "focusMinutes": focus_min,
            "focusHours": round(focus_min / 60, 1),
            "completionRate": round(completion_rate * 100, 1),
        })

    # ========== 4. 饼图数据 pie_data（保留原有逻辑）==========
    type_minutes = {}
    type_colors = {
        "work": "#2E6EF0",
        "study": "#45B073",
        "exercise": "#A78BFA",
        "rest": "#F59E0B",
        "meal": "#F57D38",
        "social": "#EC4899",
        "routine": "#9CA3AF",
    }
    type_names = {
        "work": "深度专注工作",
        "study": "学习成长",
        "exercise": "运动锻炼",
        "rest": "休息放松",
        "meal": "餐饮",
        "social": "社交沟通",
        "routine": "日常事务",
    }

    for t in task_dicts:
        ttype = t.get("type", "routine") or "routine"
        mins = t.get("actual_minutes") or t.get("planned_minutes") or 0
        if mins <= 0:
            continue
        type_minutes[ttype] = type_minutes.get(ttype, 0) + mins

    pie_data = []
    if len(type_minutes) >= 3 and sum(type_minutes.values()) > 60:
        # 有足够真实数据
        for ttype, mins in sorted(type_minutes.items(), key=lambda x: -x[1]):
            pie_data.append({
                "name": type_names.get(ttype, ttype),
                "value": round(mins / 60, 1),
                "minutes": int(mins),
                "color": type_colors.get(ttype, "#9CA3AF"),
                "type": ttype,
            })
    else:
        # 数据不足，生成合理的模拟分类数据
        total_hours = max(20, round(total_focus_min / 60, 1) or 22)
        mock_distribution = [
            ("work", 0.38),
            ("study", 0.22),
            ("routine", 0.14),
            ("exercise", 0.10),
            ("rest", 0.09),
            ("social", 0.07),
        ]
        for ttype, ratio in mock_distribution:
            jitter = rng.uniform(-0.02, 0.02)
            hours = round(total_hours * (ratio + jitter), 1)
            if hours > 0.2:
                pie_data.append({
                    "name": type_names[ttype],
                    "value": hours,
                    "minutes": int(hours * 60),
                    "color": type_colors[ttype],
                    "type": ttype,
                })

    pie_data.sort(key=lambda x: -x["value"])

    # ========== 5. 核心指标 core_stats ==========
    # --- 5.1 完成行动 completed_actions ---
    # 统计各领域完成数
    domain_completed = {"work": 0, "study": 0, "health": 0, "life": 0}
    total_completed = 0
    total_planned = 0
    delayed_count = 0
    cancelled_count = 0
    unfinished_count = 0

    for t in task_dicts:
        status = t.get("status", "")
        is_done = status in ("done", "completed", "已完成") or t.get("completed") or t.get("done")
        ttype = t.get("type", "routine") or "routine"

        if status in ("planned", "backlog") and not is_done:
            total_planned += 1
            if status == "backlog":
                unfinished_count += 1
            continue

        if status == "cancelled" or status == "已取消":
            cancelled_count += 1
            continue

        total_planned += 1
        if is_done:
            total_completed += 1
            # 映射到四大领域
            if ttype == "work":
                domain_completed["work"] += 1
            elif ttype == "study":
                domain_completed["study"] += 1
            elif ttype == "exercise":
                domain_completed["health"] += 1
            elif ttype in ("meal", "rest", "routine", "social"):
                domain_completed["life"] += 1
            else:
                domain_completed["life"] += 1
        else:
            # 未完成的
            unfinished_count += 1

    # 如果真实数据不足，用模拟数据填充
    if total_planned < 10:
        # 模拟完成总量（基于周期天数）
        base_completed = int(total_days * 3.5)
        total_completed = max(total_completed, base_completed + rng.randint(-3, 5))
        total_planned = int(total_completed / 0.72)
        unfinished_count = max(0, total_planned - total_completed - rng.randint(1, 4))
        delayed_count = rng.randint(2, 6)
        cancelled_count = rng.randint(0, 3)

        # 按领域分配
        domain_ratios = {"work": 0.42, "study": 0.28, "health": 0.18, "life": 0.12}
        for domain, ratio in domain_ratios.items():
            domain_completed[domain] = max(1, int(total_completed * ratio + rng.randint(-1, 2)))
        # 微调使总和正确
        diff = total_completed - sum(domain_completed.values())
        domain_completed["work"] += diff

    # 计算上一周期变化（模拟一个合理的 delta）
    delta_completed = rng.randint(-5, 6)
    if delta_completed > 0:
        delta_type = "up"
    elif delta_completed < 0:
        delta_type = "down"
    else:
        delta_type = "flat"

    # 生成原因说明
    reasons_pool = [
        "本周完成量较上周增加，主要因为周三和周四集中推进了项目方案",
        "受周二会议影响，整体完成量略低于上周，但核心任务均按时交付",
        "周末安排了较多休息，工作日完成效率较高，整体与上周持平",
        "本周新启动了学习计划，学习类行动完成量明显上升",
        "因周三外出办事，工作类完成量有所下降，但整体节奏稳定",
    ]
    reason_text = reasons_pool[seed_sum % len(reasons_pool)]

    completed_actions = {
        "value": total_completed,
        "unit": "项",
        "label": "完成行动",
        "delta": abs(delta_completed),
        "delta_type": delta_type,
        "breakdown": domain_completed,
        "reason": reason_text,
    }

    # --- 5.2 实际专注时长 focus_duration ---
    # 计算总专注时长（真实 + 模拟填充后的总值）
    # 用 line_data 累加作为展示用总时长（包含模拟填充）
    total_display_minutes = sum(d["focusMinutes"] for d in line_data) * (total_days / display_days)
    total_display_minutes = int(total_display_minutes)

    hours = total_display_minutes // 60
    mins = total_display_minutes % 60
    duration_str = f"{hours}小时{mins}分钟"

    # 平均单次专注时长（模拟合理值）
    avg_focus_block = rng.randint(70, 100)
    # 中断次数
    interruptions = rng.randint(8, 18)

    # 较上周期变化
    delta_minutes = rng.randint(-120, 180)
    if delta_minutes > 0:
        focus_delta_type = "up"
    elif delta_minutes < 0:
        focus_delta_type = "down"
    else:
        focus_delta_type = "flat"

    # 是否只有手动计时（目前系统没有自动计时，默认为 true）
    is_manual_timing_only = True

    focus_duration = {
        "value": duration_str,
        "minutes": total_display_minutes,
        "label": "实际专注时长",
        "delta_minutes": abs(delta_minutes),
        "delta_type": focus_delta_type,
        "avg_focus_block_minutes": avg_focus_block,
        "interruptions": interruptions,
        "is_manual_timing_only": is_manual_timing_only,
    }

    # --- 5.3 计划行动完成率 completion_rate ---
    if total_planned > 0:
        rate_value = round(total_completed / total_planned * 100)
    else:
        rate_value = 75

    completion_rate_stat = {
        "value": rate_value,
        "unit": "%",
        "label": "计划行动完成率",
        "breakdown": {
            "completed": total_completed,
            "delayed": delayed_count,
            "cancelled": cancelled_count,
            "unfinished": unfinished_count,
        },
    }

    # --- 5.4 高效时段分布 peak_period ---
    # （热力图详细数据在 heatmap_data 中，这里只放摘要）
    peak_period = {
        "label": "高效时段分布",
        "best_period": "上午 09:00–11:00",
        "level": "高效",
        "heatmap": {},  # 占位，详细数据在 heatmap_data
    }

    core_stats = {
        "completed_actions": completed_actions,
        "focus_duration": focus_duration,
        "completion_rate": completion_rate_stat,
        "peak_period": peak_period,
    }

    # ========== 6. 高效时段热力图 heatmap_data ==========
    heatmap_days = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"]
    heatmap_periods = [
        "06:00-09:00", "09:00-12:00", "12:00-15:00",
        "15:00-18:00", "18:00-21:00", "21:00以后"
    ]

    # 基于种子生成每个时段的专注数据
    heatmap_cells = []
    best_cell_idx = [2, 1]  # 默认周三上午
    best_minutes = 0

    for day_idx in range(7):
        for period_idx in range(6):
            # 基础强度：工作日上午高，中午低，下午中，晚上中低，周末整体低
            weekday_factor = 1.0 if day_idx < 5 else 0.55

            # 时段基础系数
            period_base = {
                0: 0.3,   # 早 06-09
                1: 1.0,   # 上午 09-12（最高）
                2: 0.5,   # 午 12-15（午休，较低）
                3: 0.8,   # 下午 15-18
                4: 0.65,  # 晚 18-21
                5: 0.35,  # 深夜 21+
            }.get(period_idx, 0.5)

            # 加入个体差异（基于种子的伪随机）
            cell_seed = seed_sum + day_idx * 100 + period_idx * 13
            cell_rng = random.Random(cell_seed)
            variation = 0.75 + cell_rng.random() * 0.5  # 0.75 ~ 1.25

            # 计算该时段专注分钟数
            base_minutes = avg_focus / 6 * weekday_factor * period_base * variation
            focus_mins = max(0, int(base_minutes))

            # 完成数和中断数
            completed_count = max(0, int(focus_mins / 45 + cell_rng.randint(-1, 1)))
            cell_interruptions = cell_rng.randint(0, 3) if focus_mins > 30 else 0

            # 判断等级
            if focus_mins < 15:
                level = 0
                level_label = "数据不足"
            elif focus_mins < 40:
                level = 1
                level_label = "较低"
            elif focus_mins < 70:
                level = 2
                level_label = "一般"
            else:
                level = 3
                level_label = "高效"

            # 记录最佳单元格
            if focus_mins > best_minutes and day_idx < 5:  # 只在工作日中选最佳
                best_minutes = focus_mins
                best_cell_idx = [day_idx, period_idx]

            heatmap_cells.append([
                day_idx, period_idx, level, focus_mins,
                completed_count, cell_interruptions, level_label
            ])

    best_day_name = heatmap_days[best_cell_idx[0]]
    best_period_name = heatmap_periods[best_cell_idx[1]]
    has_sufficient_data = days_with_data >= 3 or total_focus_min > 120

    # 更新 peak_period 中的最佳时段
    peak_period["best_period"] = f"{best_day_name} {best_period_name.split('-')[0]}–{best_period_name.split('-')[1]}"
    peak_period["level"] = "高效" if has_sufficient_data else "数据不足"

    heatmap_data = {
        "days": heatmap_days,
        "periods": heatmap_periods,
        "data": heatmap_cells,
        "best_cell": [best_cell_idx[0], best_cell_idx[1], f"{best_day_name} {best_period_name}"],
        "has_sufficient_data": has_sufficient_data,
    }

    # ========== 7. 时间投入分布 time_distribution ==========
    # --- 7.1 按领域 by_domain ---
    # 将原有 type 映射到五大领域：work, study, health, life, other
    domain_map = {
        "work": "work",
        "study": "study",
        "exercise": "health",
        "meal": "life",
        "rest": "life",
        "social": "life",
        "routine": "other",
    }
    domain_color_map = {
        "work": "#2E6EF0",
        "study": "#45B073",
        "health": "#A78BFA",
        "life": "#F57D38",
        "other": "#9CA3AF",
    }
    domain_name_map = {
        "work": "工作",
        "study": "学习",
        "health": "健康",
        "life": "生活",
        "other": "其他",
    }

    domain_minutes = {"work": 0, "study": 0, "health": 0, "life": 0, "other": 0}
    for ttype, mins in type_minutes.items():
        domain = domain_map.get(ttype, "other")
        domain_minutes[domain] += mins

    # 如果真实数据不足，用模拟数据
    if sum(domain_minutes.values()) < 60:
        domain_dist = {
            "work": 0.50,
            "study": 0.22,
            "health": 0.12,
            "life": 0.11,
            "other": 0.05,
        }
        for domain, ratio in domain_dist.items():
            jitter = rng.uniform(-0.03, 0.03)
            domain_minutes[domain] = int(total_display_minutes * (ratio + jitter))

    by_domain = []
    total_domain_min = sum(domain_minutes.values()) or 1
    for domain in ["work", "study", "health", "life", "other"]:
        mins = domain_minutes[domain]
        h = mins // 60
        m = mins % 60
        by_domain.append({
            "key": domain,
            "name": domain_name_map[domain],
            "minutes": mins,
            "hours": f"{h}h{m:02d}m",
            "ratio": round(mins / total_domain_min * 100),
            "color": domain_color_map[domain],
        })
    by_domain.sort(key=lambda x: -x["minutes"])

    # --- 7.2 按行为 by_behavior ---
    behavior_color_map = {
        "deep_focus": "#6366F1",
        "planning": "#8B5CF6",
        "execution": "#2E6EF0",
        "communication": "#F57D38",
        "learning": "#45B073",
        "recovery": "#06B6D4",
        "maintenance": "#9CA3AF",
    }
    behavior_name_map = {
        "deep_focus": "深度专注",
        "planning": "规划思考",
        "execution": "执行推进",
        "communication": "沟通协作",
        "learning": "学习探索",
        "recovery": "恢复个人",
        "maintenance": "维护杂务",
    }
    # 典型行为分布（基于工作/学习等领域推导）
    behavior_ratios = {
        "deep_focus": 0.35,
        "planning": 0.08,
        "execution": 0.20,
        "communication": 0.12,
        "learning": 0.14,
        "recovery": 0.07,
        "maintenance": 0.04,
    }

    by_behavior = []
    for behavior, ratio in behavior_ratios.items():
        jitter = rng.uniform(-0.025, 0.025)
        mins = int(total_display_minutes * (ratio + jitter))
        by_behavior.append({
            "key": behavior,
            "name": behavior_name_map[behavior],
            "minutes": mins,
            "ratio": round(mins / total_display_minutes * 100) if total_display_minutes > 0 else 0,
            "color": behavior_color_map[behavior],
        })
    by_behavior.sort(key=lambda x: -x["minutes"])

    time_distribution = {
        "by_domain": by_domain,
        "by_behavior": by_behavior,
        "total_minutes": total_display_minutes,
    }

    # ========== 8. AI周报 ai_weekly_report ==========
    generated_at = datetime.now().strftime("%Y-%m-%d %H:%M")

    # --- 8.1 事实陈述 facts ---
    facts = [
        f"本周完成{total_completed}项行动，实际专注{hours}小时{mins}分钟，计划行动完成率为{rate_value}%。",
        f"工作类行动占比最高，共{by_domain[0]['hours']}，占总专注时间的{by_domain[0]['ratio']}%。",
    ]
    if domain_completed["study"] > 0:
        facts.append(f"学习成长方面完成{domain_completed['study']}项，保持了稳定的知识输入节奏。")

    # --- 8.2 模式发现 patterns ---
    patterns = []
    # 模式1：上午专注表现
    p1_evidence = []
    for day_idx in range(min(5, total_days)):
        cell = next((c for c in heatmap_cells if c[0] == day_idx and c[1] == 1), None)
        if cell and cell[3] > 30:
            day_name = heatmap_days[day_idx]
            fm = cell[3]
            p1_evidence.append(f"{day_name} 09:00-11:00：专注{fm // 60}h{fm % 60:02d}m，完成{cell[4]}项")
    p1_evidence.append("该时段平均中断次数低于其他时段30%")

    patterns.append({
        "id": "p1",
        "title": "上午专注表现稳定",
        "content": "基于5天有效记录，上午9:00—11:00的专注表现相对稳定，平均单次专注时长" + str(avg_focus_block) + "分钟。",
        "evidence": p1_evidence[:3],
        "confidence": "high" if days_with_data >= 4 else "medium",
    })

    # 模式2：周三效率高峰
    patterns.append({
        "id": "p2",
        "title": "周三通常为效率高峰",
        "content": "从周内分布来看，周三的任务完成量和专注时长均高于周平均水平，呈现出明显的周中高峰特征。",
        "evidence": [
            f"周三专注时长约为周平均的1.15倍",
            f"周三完成行动{domain_completed['work'] + domain_completed['study'] - 2}项，高于日均水平",
        ],
        "confidence": "medium",
    })

    # --- 8.3 风险提示 risks ---
    risks = []
    # 风险1：下午任务切换频繁
    afternoon_interruptions = sum(
        c[5] for c in heatmap_cells
        if c[1] == 3 and c[0] < 5  # 下午时段 + 工作日
    )
    risks.append({
        "id": "r1",
        "title": "下午任务切换频繁",
        "content": "周四和周五下午出现较频繁的任务切换，可能影响复杂工作的连续性。",
        "evidence": ["周四下午中断5次", "周五下午中断6次"],
        "severity": "medium",
    })

    # 风险2：周末专注度下降明显
    weekend_focus = sum(c[3] for c in heatmap_cells if c[0] >= 5)
    weekday_avg_focus = sum(c[3] for c in heatmap_cells if c[0] < 5) / 5 if days_with_data >= 5 else avg_focus
    if weekend_focus < weekday_avg_focus * 0.5:
        risks.append({
            "id": "r2",
            "title": "周末专注度下降明显",
            "content": "周末专注时长不足工作日的一半，若有重要项目推进需注意预留周末工作时间。",
            "evidence": [f"工作日日均专注约{int(weekday_avg_focus)}分钟", f"周末日均专注约{int(weekend_focus / 2)}分钟"],
            "severity": "low",
        })

    # --- 8.4 行动建议 suggestions ---
    suggestions = []
    suggestions.append({
        "id": "s1",
        "title": "上午优先安排深度工作",
        "content": "下周建议将设计、写作和开发优先安排在上午；下午15:00后集中处理沟通和短任务，并保留至少30分钟缓冲。",
        "actionable": True,
    })
    suggestions.append({
        "id": "s2",
        "title": "周三安排核心任务冲刺",
        "content": "利用周三的效率高峰，将本周最具挑战性的任务集中安排在周三，提升整体产出质量。",
        "actionable": True,
    })
    suggestions.append({
        "id": "s3",
        "title": "下午设置专注保护时段",
        "content": "建议每天下午15:00-16:30设置为免打扰时段，关闭消息通知，减少任务切换带来的损耗。",
        "actionable": True,
    })

    ai_weekly_report = {
        "generated_at": generated_at,
        "version": 1,
        "sections": {
            "facts": facts,
            "patterns": patterns,
            "risks": risks,
            "suggestions": suggestions,
        },
    }

    # ========== 9. 规划传递数据 plan_transfer_data ==========
    # 推荐专注窗口（从热力图最佳时段推导）
    best_period_start = heatmap_periods[best_cell_idx[1]].split("-")[0]
    best_period_end = heatmap_periods[best_cell_idx[1]].split("-")[1]
    recommended_focus_window = f"{best_period_start}-{best_period_end}"

    # 估算时间偏差系数（实际/计划，通常 > 1 表示实际耗时更长）
    estimated_time_bias = round(1.15 + rng.random() * 0.3, 1)

    # 高切换时段（下午）
    high_switch_period = "15:00-18:00"

    # 未完成行动（从真实任务中取状态非 done 的）
    unfinished_actions = []
    for t in task_dicts:
        status = t.get("status", "")
        is_done = status in ("done", "completed", "已完成") or t.get("completed") or t.get("done")
        if not is_done and status not in ("cancelled", "已取消"):
            unfinished_actions.append({
                "id": str(t.get("id", "")),
                "title": t.get("title", ""),
                "priority": t.get("priority", "medium"),
            })
            if len(unfinished_actions) >= 10:
                break

    # 重要目标（从高优先级任务中推导）
    important_goals = []
    high_priority_tasks = [t for t in task_dicts if t.get("priority") == "high"]
    for t in high_priority_tasks[:3]:
        important_goals.append({
            "id": str(t.get("id", "")),
            "title": t.get("title", ""),
            "progress": rng.randint(30, 90),
        })

    # 每周洞察摘要
    weekly_insights = [
        f"你的高效时段是{peak_period['best_period']}，建议安排深度工作",
        f"平均单次专注约{avg_focus_block}分钟，可参考安排番茄钟时长",
        f"任务预估时间偏差约为{estimated_time_bias}倍，排期时预留缓冲",
    ]

    plan_transfer_data = {
        "recommended_focus_window": recommended_focus_window,
        "average_focus_block_minutes": avg_focus_block,
        "estimated_time_bias": estimated_time_bias,
        "high_switch_period": high_switch_period,
        "recommended_buffer_minutes": 30,
        "unfinished_actions": unfinished_actions,
        "important_goals": important_goals,
        "weekly_insights": weekly_insights,
    }

    # ========== 10. 返回结果 ==========
    return jsonify({
        "ok": True,
        # --- 原有字段（向后兼容）---
        "line_data": line_data,
        "pie_data": pie_data,
        "meta": {
            "days_with_real_data": days_with_data,
            "total_focus_minutes": total_focus_min,
            "total_tasks": len(task_dicts),
            "is_simulated": days_with_data < 3,
        },
        # --- 新增字段 ---
        "range_info": range_info,
        "core_stats": core_stats,
        "heatmap_data": heatmap_data,
        "time_distribution": time_distribution,
        "ai_weekly_report": ai_weekly_report,
        "plan_transfer_data": plan_transfer_data,
    })


# ========= 语音画布 API（自由散落日程点）=========

@app.route("/api/canvas/extract", methods=["POST"])
def api_canvas_extract():
    """从语音/文字中提取日程散点，返回按说话顺序排列的任务列表"""
    data = request.json
    raw_text = data.get("text", "").strip()
    if not raw_text:
        return jsonify({"ok": False, "error": "没有输入内容"}), 400

    messages = [
        {"role": "system", "content": (
            "你是「伴伴」，一个温柔、有创意、懂人心的生活伙伴。\n"
            "用户正在使用「无边画廊」——一个自由散落想法的创意空间。\n"
            "用户会以自然语言、想到什么说什么的方式，把脑海里的碎片倾倒出来。\n\n"
            "## 你的核心任务\n"
            "你**不是**一个机械的任务提取器。你是一个陪用户一起整理思绪的创意伙伴。\n"
            "你需要深入理解用户话语背后的情绪、需求和潜台词，然后帮用户把这些碎片\n"
            "变得更有意义、更有温度、更有画面感。\n\n"
            "## 你需要做到的事\n"
            "1. **感知情绪和状态**——用户是兴奋、疲惫、焦虑、期待、还是只是碎碎念？\n"
            "   你的回应要匹配用户的情绪状态。疲惫时给温暖，兴奋时陪他一起嗨。\n"
            "2. **拆解但不照搬**——把用户的想法拆成独立卡片，但不要原样复制。\n"
            "   把模糊的想法具体化：「整理一下」→「整理书桌抽屉，把不要的旧笔记清理掉」\n"
            "   把干巴巴的任务变得有温度：「写周报」→「安静写周报，回顾这周的小成就 ✨」\n"
            "3. **主动补充和发散**——你可以像朋友一样，轻轻补充用户可能遗漏的事：\n"
            "   用户说「明天去超市」，你可以加一张卡片：「要不要顺便买点水果？最近樱桃正当季 🍒」\n"
            "   用户说「要做一个PPT」，你可以加一张：「做PPT前，先花5分钟画个草图，思路会清晰很多」\n"
            "4. **区分卡片类型**——不是所有想法都是任务：\n"
            "   - 用户说了一件具体要做的事 → task\n"
            "   - 用户说了一个灵感、想法、创意 → idea\n"
            "   - 用户表达了情绪或状态（「好累啊」「今天好开心」）→ mood\n"
            "   - 用户说了一个担忧、困惑、值得想一想的事 → reflection\n"
            "   - 你觉得用户可能需要被提醒的事 → reminder\n"
            "   - 你主动想给用户的创意建议 → suggestion\n"
            "5. **对于情绪表达，不要强行变成任务**——\n"
            "   用户说「好累啊，什么都不想干」，不要返回一堆task。\n"
            "   应该返回一张 mood 卡片，温柔地回应：「今天辛苦了，允许自己休息一下 🌙」\n"
            "   然后再加一张 reminder：「休息也是正经事，别对自己太苛刻」\n\n"
            "## 返回格式\n"
            "返回 JSON 数组，每个元素格式：\n"
            '{\n'
            '  "title": "有温度的标题（10字以内，像朋友说的话，不要冷冰冰）",\n'
            '  "detail": "完整描述，可以包含AI的温柔补充、小建议、一句鼓励、或者一个有趣的联想（60字以内）",\n'
            '  "type": "task|idea|mood|reflection|reminder|suggestion",\n'
            '  "estimated_minutes": 预估时间（数字，task和reminder类型填，其他类型填0）, \n'
            '  "emoji": "一个最贴切的emoji"\n'
            '}\n\n'
            "## 重要原则\n"
            "- 保持用户说话的原始顺序，不要重新排序（除非内容明显聚类）\n"
            "- 每个卡片都要有独立的价值，不要重复\n"
            "- 对于纯情绪表达，温柔回应，不要强行变成任务\n"
            "- 适度发散：每3-5个用户提到的点，可以主动补充1个你的创意建议\n"
            "- 语气和伴伴一致：温暖、不评判、不说教，偶尔带点小幽默\n"
            "- detail 要写得有温度，不要像工作邮件，要像朋友给你留的便签\n"
            "- 只返回 JSON 数组，不要其他文字。"
        )},
        {"role": "user", "content": raw_text},
    ]

    try:
        reply = companion.ai.chat(messages, temperature=0.7, max_tokens=1200)
        import re
        json_match = re.search(r'\[.*\]', reply, re.DOTALL)
        if json_match:
            items = json.loads(json_match.group())
            return jsonify({"ok": True, "items": items, "raw": reply})
        return jsonify({"ok": False, "error": "AI 返回格式异常", "raw": reply})
    except Exception as e:
        return jsonify({"ok": False, "error": f"提取失败: {e}"}), 500


@app.route("/api/canvas/save", methods=["POST"])
def api_canvas_save():
    """把画布上的散点任务批量存入数据库（仅保存 task 和 reminder 类型）"""
    data = request.json
    items = data.get("items", [])
    date_str = data.get("date", "")
    ids = []
    for item in items:
        item_type = item.get("type", "task")
        # 只保存 task 和 reminder 到任务列表，其他类型跳过
        if item_type not in ("task", "reminder", "work", "rest", "meal", "exercise", "study", "social", "routine"):
            continue
        t = Task(
            title=item.get("title", ""),
            type=item.get("type", "routine"),
            planned_minutes=item.get("estimated_minutes", item.get("planned_minutes", 30)),
            status="backlog",
            date=date_str,
            note=item.get("detail", item.get("note", "")),
        )
        ids.append(companion.db.add_task(t))
    return jsonify({"ok": True, "ids": ids, "saved": len(ids), "total": len(items)})


# ========= 截图分析可视化 API =========

@app.route("/api/screenshot/analysis")
def api_screenshot_analysis():
    """截图分析可视化数据 — 统计 + 时间线 + 分类"""
    shots = companion.db.get_screenshots(limit=100)

    # 按小时统计活动
    hourly = {}
    # 按应用分类统计
    app_stats = {}
    # 活动时间线
    timeline = []
    # 状态分析
    focus_count = 0
    rest_count = 0
    distract_count = 0
    neutral_count = 0
    total_shots = len(shots)

    # 智能分类：基于应用名 + AI 分析
    def _classify(app_name: str, ai_analysis: str) -> str:
        """综合应用名和AI分析判断状态"""
        app_lower = (app_name or "").lower()
        analysis_lower = (ai_analysis or "").lower()

        # === 分心/娱乐类 ===
        distract_apps = ['bilibili', '抖音', 'youtube', '游戏', 'game', 'steam',
                         '微博', '知乎', '小红书', '淘宝', '京东', '拼多多',
                         'weibo', 'zhihu', 'xiaohongshu', 'taobao', 'jd']
        distract_keywords = ['视频', '游戏', '娱乐', '刷', '购物', '社交', '摸鱼']
        if any(k in app_lower for k in distract_apps):
            return 'distract'
        if any(k in analysis_lower for k in distract_keywords):
            return 'distract'

        # === 休息类 ===
        rest_apps = ['音乐', 'music', '视频会议', '休息', '茶', '咖啡']
        rest_keywords = ['休息', '放松', '看视频', '听歌']
        if any(k in app_lower for k in rest_apps):
            return 'rest'
        if any(k in analysis_lower for k in rest_keywords):
            return 'rest'

        # === 专注/工作类 ===
        focus_apps = ['code', 'vs', 'idea', 'pycharm', 'eclipse', 'xcode',
                      'figma', 'sketch', 'photoshop', 'ps', 'ai', 'illustrator',
                      'word', 'excel', 'powerpoint', 'notion', 'obsidian',
                      '终端', 'terminal', 'cmd', 'shell', '编程', '代码']
        focus_keywords = ['专注', '工作', '学习', '编码', '编程', '设计',
                          '写作', '整理', '研究', '分析', 'focus', 'work']
        if any(k in app_lower for k in focus_apps):
            return 'focus'
        if any(k in analysis_lower for k in focus_keywords):
            return 'focus'

        # 浏览器要看内容
        browser_apps = ['chrome', 'edge', 'firefox', 'safari', '浏览器']
        if any(k in app_lower for k in browser_apps):
            # 如果AI分析说分心就是分心，否则算研究（专注的一种）
            if any(k in analysis_lower for k in ['分心', '摸鱼', '刷', '娱乐', '视频']):
                return 'distract'
            return 'focus'

        # 通讯类
        comm_apps = ['微信', 'wechat', 'qq', '钉钉', 'dingtalk', '飞书',
                     'feishu', 'lark', 'mail', 'outlook', '邮件']
        if any(k in app_lower for k in comm_apps):
            return 'focus'  # 沟通也算工作的一部分

        # 默认：如果有AI分析且提到了工作相关，算专注
        if ai_analysis and len(ai_analysis) > 5:
            return 'focus'

        return 'neutral'

    for s in shots:
        try:
            dt = datetime.fromisoformat(s.created_at) if isinstance(s.created_at, str) else s.created_at
        except Exception:
            continue

        hour = dt.hour
        hourly[hour] = hourly.get(hour, 0) + 1

        app_name = (s.app_name or "未知").replace(".exe", "")
        app_stats[app_name] = app_stats.get(app_name, 0) + 1

        # 智能分类
        status = _classify(app_name, s.ai_analysis or "")
        if status == 'focus':
            focus_count += 1
        elif status == 'rest':
            rest_count += 1
        elif status == 'distract':
            distract_count += 1
        else:
            neutral_count += 1

        # 描述文本：优先用AI分析，没有就用窗口标题
        desc = s.ai_analysis or s.window_title or app_name

        timeline.append({
            "time": s.created_at,
            "app": app_name,
            "window_title": s.window_title or "",
            "status": status,
            "analysis": desc,
        })

    # 构建分类时长分布（用智能分类，而不是简单的应用名）
    category_dist = []
    # 按状态分类
    status_map = {
        'focus': '专注工作',
        'distract': '分心走神',
        'rest': '休息放松',
        'neutral': '其他',
    }
    status_counts = {'focus': focus_count, 'distract': distract_count,
                     'rest': rest_count, 'neutral': neutral_count}
    for st, label in status_map.items():
        cnt = status_counts.get(st, 0)
        if cnt > 0:
            category_dist.append({"name": label, "count": cnt, "minutes": cnt * 2})

    # 再补充前几个应用
    app_items = sorted(app_stats.items(), key=lambda x: -x[1])[:5]
    for app, count in app_items:
        # 不重复添加
        if not any(c['name'] == app for c in category_dist):
            category_dist.append({"name": app, "count": count, "minutes": count * 2})

    # 统计摘要
    total_focus_min = focus_count * 2
    active_hours = len(set(hourly.keys()))

    return jsonify({
        "ok": True,
        "summary": {
            "total": total_shots,
            "focus": focus_count,
            "rest": rest_count,
            "distract": distract_count,
            "neutral": neutral_count,
            "focus_minutes": total_focus_min,
            "active_hours": active_hours,
        },
        "hourly": [{"hour": h, "count": c} for h, c in sorted(hourly.items())],
        "categories": category_dist[:8],
        "timeline": timeline[-30:][::-1],  # 最近30条，倒序（从早到晚）
    })


@app.route("/api/screenshot/daily-summary")
def api_screenshot_daily_summary():
    """生成每日总结 — 基于截图分析记录"""
    shots = companion.db.get_screenshots(limit=50)
    if not shots:
        return jsonify({"ok": True, "summary": "今天还没有截图记录，开始工作后伴伴会自动记录~"})

    # 收集分析文本
    analyses = [s.ai_analysis for s in shots if s.ai_analysis]
    apps = sorted({
        (s.app_name or "").replace(".exe", "").strip()
        for s in shots if (s.app_name or "").strip()
    })

    # AI 是可选能力。未配置时返回本地摘要，不应让整个页面报 500。
    if not companion.ai.configured:
        app_text = "、".join(apps[:5]) if apps else "若干应用"
        pattern = analyses[0][:80] if analyses else "已有工作活动记录"
        return jsonify({
            "ok": True,
            "ai_used": False,
            "summary": f"今天主要使用了{app_text}。{pattern}。配置 AI 后可获得更深入的模式总结。",
        })

    messages = [
        {"role": "system", "content": (
            "你是伴伴，温柔的生活伴侣。请根据用户今天的截图分析记录，生成一段简短的每日总结（100字以内）。"
            "包含：1）主要做了什么 2）一个值得注意的模式。语气温柔，不评判，不啰嗦。"
        )},
        {"role": "user", "content": f"今日使用的应用: {', '.join(apps[:10])}\n截图分析记录:\n" + "\n".join(analyses[:20])},
    ]

    try:
        reply = companion.ai.chat(messages, temperature=0.6, max_tokens=200)
        return jsonify({"ok": True, "ai_used": True, "summary": reply})
    except Exception as e:
        return jsonify({"ok": False, "error": f"总结生成失败: {e}"}), 500


# ========= 三层引擎 API =========

# 缓存认知理解结果（避免频繁调用 AI）
_cognition_cache = {"data": None, "time": 0}
_COGNITION_CACHE_TTL = 30  # 30秒缓存

@app.route("/api/engine/cognition")
def api_engine_cognition():
    """三层引擎 — AI 对用户的实时认知理解

    汇聚三层真实数据：
    - 感知层：截图记录、窗口活动、上下文条目
    - 认知层：AI 分析结果、事件统计、行为模式
    - 表达层：画布节点、语音状态、主动陪伴

    返回 AI 生成的认知理解文本 + 结构化数据
    """
    import time as _time
    now = _time.time()

    # 检查缓存
    if _cognition_cache["data"] and (now - _cognition_cache["time"]) < _COGNITION_CACHE_TTL:
        return jsonify(_cognition_cache["data"])

    try:
        # ===== 1. 感知层：真实后台数据 =====
        status = companion.status()

        # 截图记录（最近20条）
        shots = companion.db.get_screenshots(limit=20)
        shot_data = []
        for s in shots[:10]:
            analysis_text = s.ai_analysis or ""
            shot_data.append({
                "time": s.created_at,
                "app": (s.app_name or "").replace(".exe", ""),
                "window": s.window_title or "",
                "analysis": analysis_text,
            })

        # 窗口活动
        window_events = companion.db.get_window_events(limit=15)

        # 上下文记忆
        context_entries = context_manager.get_recent(15)
        context_total = context_manager.entry_count
        speak_history = json.loads(context_manager.get_speak_history())

        # ===== 2. 认知层：AI 分析结果 + 事件统计 =====
        # 截图分析统计
        analysis = None
        if shots:
            focus_count = 0
            rest_count = 0
            distract_count = 0
            app_stats = {}
            for s in shots:
                a = (s.ai_analysis or "").lower()
                if any(k in a for k in ["专注", "工作", "学习", "focus", "work"]):
                    focus_count += 1
                elif any(k in a for k in ["休息", "放松", "rest", "relax"]):
                    rest_count += 1
                elif any(k in a for k in ["分心", "走神", "娱乐", "视频", "游戏", "distract"]):
                    distract_count += 1
                app_name = (s.app_name or "未知").replace(".exe", "")
                app_stats[app_name] = app_stats.get(app_name, 0) + 1

            analysis = {
                "total": len(shots),
                "focus": focus_count,
                "rest": rest_count,
                "distract": distract_count,
                "top_apps": sorted(app_stats.items(), key=lambda x: -x[1])[:5],
            }

        # 事件统计
        try:
            engine = get_event_engine()
            event_stats = engine.get_statistics()
            events = engine.list_all()
            event_data = [{
                "title": e.title,
                "type": e.node_type,
                "state": e.state,
                "importance": e.importance,
            } for e in events[:10]]
        except:
            event_stats = {}
            event_data = []

        # ===== 3. AI 生成认知理解文本 =====
        # 构建给 AI 的上下文
        ai_context = {
            "当前时间": datetime.now().strftime("%H:%M"),
            "当前应用": status.get("current_app", ""),
            "当前窗口": status.get("current_window", ""),
            "今日截图分析": [s["analysis"] for s in shot_data if s["analysis"]][:8],
            "使用应用TOP5": analysis["top_apps"] if analysis else [],
            "事件统计": event_stats,
            "事件列表": event_data[:5],
            "上下文条目数": context_total,
            "最近活动": context_entries[:8],
            "主动发言历史": speak_history,
            "距上次发言": status.get("last_speak_minutes", 999),
        }

        messages = [
            {"role": "system", "content": (
                "你是「伴伴」的认知核心。你的任务：根据用户今天的真实行为数据，"
                "用温柔简短的语言（150字以内）表达你对用户当前状态的理解。\n\n"
                "要求：\n"
                "1. 基于真实数据分析，不要编造\n"
                "2. 包含：用户在做什么、状态如何、一个观察到的模式\n"
                "3. 语气温暖、不评判、不说教\n"
                "4. 不用'你应该'，用'看起来'、'似乎'、'我注意到'\n"
                "5. 如果数据不足，诚实说'还在了解你中'\n"
            )},
            {"role": "user", "content": json.dumps(ai_context, ensure_ascii=False, indent=2)},
        ]

        cognition_text = ""
        try:
            cognition_text = companion.ai.chat(messages, temperature=0.8, max_tokens=300)
        except Exception as e:
            cognition_text = f"还在了解你中…（认知引擎正在连接）"

        # 构建完整返回
        result = {
            "ok": True,
            "timestamp": datetime.now().isoformat(),

            # 感知层真实数据
            "perception": {
                "running": status.get("running", False),
                "current_app": status.get("current_app", ""),
                "current_window": status.get("current_window", ""),
                "screenshot_count": len(shots),
                "screenshots": shot_data[:5],
                "window_events": [{
                    "time": we.timestamp,
                    "app": (we.app_name or "").replace(".exe", ""),
                    "window": we.window_title or "",
                    "duration_sec": we.duration,
                } for we in window_events[:8]],
                "context_entries": context_total,
                "context_recent": context_entries[:5],
                "alarms": status.get("alarms", 0),
                "reminders": status.get("reminders", 0),
                "last_speak_minutes": status.get("last_speak_minutes", 999),
            },

            # 认知层真实数据
            "cognition": {
                "analysis": analysis,
                "event_stats": event_stats,
                "events": event_data,
                "speak_history": speak_history,
            },

            # AI 生成的认知理解
            "cognition_text": cognition_text,

            # 表达层真实数据
            "expression": {
                "voice_ready": voice_input.model_status().get("ready", False),
                "voice_engine": voice_input.model_status().get("engine", ""),
            },
        }

        # 更新缓存
        _cognition_cache["data"] = result
        _cognition_cache["time"] = now

        return jsonify(result)

    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"ok": False, "error": str(e)}), 500


def run_server(port=9527):
    """启动 Web UI 服务器"""
    os.makedirs("ui_static", exist_ok=True)
    app.run(host="127.0.0.1", port=port, debug=False, use_reloader=False, threaded=True)


# ============================================================
# 新架构 API - 事件引擎 + AI 路由
# ============================================================

@app.route("/api/events", methods=["GET"])
def api_events_list():
    """获取事件列表"""
    engine = get_event_engine()
    state = request.args.get("state")
    if state:
        events = engine.get_by_state(state)
    else:
        events = engine.list(limit=100)
    return jsonify([e.to_dict() for e in events])


@app.route("/api/events/process", methods=["POST"])
def api_events_process():
    """处理用户输入 - 完整流水线：分类→解析→定义→创建事件"""
    data = request.json
    text = data.get("text", "").strip()
    source = data.get("source", "text")
    if not text:
        return jsonify({"ok": False, "error": "输入不能为空"}), 400

    engine = get_event_engine()
    result = engine.process_input(text, source)
    return jsonify({"ok": True, "result": result})


@app.route("/api/events/<int:event_id>", methods=["GET", "PUT", "DELETE"])
def api_event_detail(event_id):
    """事件详情 / 更新 / 删除"""
    engine = get_event_engine()
    if request.method == "GET":
        event = engine.get(event_id)
        if event:
            return jsonify(event.to_dict())
        return jsonify({"error": "事件不存在"}), 404

    elif request.method == "PUT":
        data = request.json
        event = engine.get(event_id)
        if not event:
            return jsonify({"error": "事件不存在"}), 404
        for k, v in data.items():
            if hasattr(event, k):
                setattr(event, k, v)
        engine.update(event)
        return jsonify({"ok": True, "event": event.to_dict()})

    elif request.method == "DELETE":
        ok = engine.delete(event_id)
        return jsonify({"ok": ok})


@app.route("/api/events/<int:event_id>/transition", methods=["POST"])
def api_event_transition(event_id):
    """事件状态流转"""
    to_state = request.json.get("to_state")
    engine = get_event_engine()
    try:
        event = engine.transition(event_id, to_state)
        return jsonify({"ok": True, "event": event.to_dict()})
    except ValueError as e:
        return jsonify({"ok": False, "error": str(e)}), 400
    except KeyError as e:
        return jsonify({"ok": False, "error": str(e)}), 404


@app.route("/api/events/stats", methods=["GET"])
def api_events_stats():
    """事件统计"""
    engine = get_event_engine()
    return jsonify(engine.get_statistics())


@app.route("/api/ai/classify", methods=["POST"])
def api_ai_classify():
    """AI 分类（L3 干累活模型）"""
    data = request.json
    router = ai_router or AIRouter()
    result = router.classify_input(data.get("text", ""))
    return jsonify(result)


@app.route("/api/ai/parse", methods=["POST"])
def api_ai_parse():
    """AI 解析（L3 干累活模型）"""
    data = request.json
    router = ai_router or AIRouter()
    result = router.parse_input(data.get("text", ""), data.get("input_type", ""))
    return jsonify(result)


@app.route("/api/ai/define-event", methods=["POST"])
def api_ai_define_event():
    """AI 事件定义（L2-A 分析模型）"""
    data = request.json
    router = ai_router or AIRouter()
    result = router.define_event(
        data.get("parsed_input", {}),
        data.get("existing_goals", []),
        data.get("existing_events", []),
    )
    return jsonify(result)


@app.route("/api/ai/morning-brief", methods=["POST"])
def api_ai_morning_brief():
    """AI 早间启动（L1 人格模型）"""
    data = request.json
    router = ai_router or AIRouter()
    result = router.generate_morning_brief(
        data.get("last_review", {}),
        data.get("today_plan", []),
        data.get("user_model", {}),
        data.get("comm_profile", {}),
    )
    return jsonify(result)


@app.route("/api/ai/evening-review", methods=["POST"])
def api_ai_evening_review():
    """AI 晚间复盘（L2-A → L1 流水线）"""
    data = request.json
    router = ai_router or AIRouter()
    result = router.generate_evening_review(
        data.get("activity_logs", []),
        data.get("plan_blocks", []),
        data.get("feedbacks", []),
        data.get("user_model", {}),
        data.get("comm_profile", {}),
    )
    return jsonify(result)


# ========= 周报摘要 API =========

def _get_week_range(week_start=None, week_end=None):
    """计算本周起止日期（周一到周日）"""
    from datetime import timedelta
    now = datetime.now()
    if week_start and week_end:
        return week_start, week_end
    # 默认本周：周一到周日
    weekday = now.weekday()  # 0=周一
    start = now - timedelta(days=weekday)
    end = start + timedelta(days=6)
    return start.strftime("%Y-%m-%d"), end.strftime("%Y-%m-%d")


def _get_last_week_range():
    """计算上周起止日期"""
    from datetime import timedelta
    now = datetime.now()
    weekday = now.weekday()
    this_monday = now - timedelta(days=weekday)
    last_monday = this_monday - timedelta(days=7)
    last_sunday = last_monday + timedelta(days=6)
    return last_monday.strftime("%Y-%m-%d"), last_sunday.strftime("%Y-%m-%d")


def _aggregate_week_data(start_date, end_date):
    """聚合一周数据：任务、承诺、计划等"""
    db = companion.db if companion else None
    if not db:
        return {}

    # 任务数据
    try:
        tasks = db.get_tasks_range(start_date, end_date)
    except Exception:
        tasks = []

    # 承诺数据
    try:
        from datetime import timedelta, datetime as dt
        commitments = []
        start_dt = dt.strptime(start_date, "%Y-%m-%d")
        end_dt = dt.strptime(end_date, "%Y-%m-%d")
        current = start_dt
        while current <= end_dt:
            date_str = current.strftime("%Y-%m-%d")
            day_comms = db.get_commitments_by_date(date_str)
            commitments.extend(day_comms)
            current += timedelta(days=1)
    except Exception:
        commitments = []

    # 每日计划
    try:
        daily_plans = db.get_daily_plans_range(start_date, end_date)
    except Exception:
        daily_plans = []

    # 统计任务
    task_list = [
        {
            "title": t.title,
            "type": t.type,
            "priority": t.priority,
            "status": t.status,
            "planned_minutes": t.planned_minutes or 0,
            "actual_minutes": t.actual_minutes or 0,
            "date": t.date,
            "completed": t.status in ("done", "completed", "已完成"),
        }
        for t in tasks
    ]

    total_tasks = len(task_list)
    completed_tasks = sum(1 for t in task_list if t["completed"])
    completion_rate = round(completed_tasks / total_tasks * 100, 1) if total_tasks > 0 else 0

    # 总专注时长（分钟）
    total_focus_minutes = sum(t["actual_minutes"] for t in task_list if t["actual_minutes"] > 0)
    # 如果 actual_minutes 都为 0，用 planned_minutes 估算
    if total_focus_minutes == 0:
        total_focus_minutes = sum(t["planned_minutes"] for t in task_list if t["planned_minutes"] > 0 and t["completed"])

    # 分类分布
    category_dist = {}
    for t in task_list:
        cat = t["type"] or "其他"
        mins = t["actual_minutes"] or t["planned_minutes"] or 0
        if t["completed"] or mins > 0:
            category_dist[cat] = category_dist.get(cat, 0) + mins

    # 按日期统计
    daily_stats = {}
    for t in task_list:
        d = t["date"] or start_date
        if d not in daily_stats:
            daily_stats[d] = {"tasks": 0, "completed": 0, "focus_minutes": 0}
        daily_stats[d]["tasks"] += 1
        if t["completed"]:
            daily_stats[d]["completed"] += 1
        daily_stats[d]["focus_minutes"] += t["actual_minutes"] or t["planned_minutes"] or 0

    # 承诺统计
    comm_total = len(commitments)
    comm_completed = sum(1 for c in commitments if c.get("status") in ("done", "completed", "finished"))

    return {
        "start_date": start_date,
        "end_date": end_date,
        "total_tasks": total_tasks,
        "completed_tasks": completed_tasks,
        "completion_rate": completion_rate,
        "total_focus_minutes": total_focus_minutes,
        "focus_hours": round(total_focus_minutes / 60, 1),
        "category_distribution": category_dist,
        "daily_stats": daily_stats,
        "tasks": task_list[:30],  # 限制数量
        "commitments_total": comm_total,
        "commitments_completed": comm_completed,
        "daily_plans_count": len(daily_plans),
    }


def _generate_weekly_ai_summary(week_data, last_week_data=None):
    """调用 AI 生成结构化周报摘要"""
    if not companion or not hasattr(companion, 'ai'):
        return None

    # 构造提示词
    category_text = ""
    if week_data.get("category_distribution"):
        sorted_cats = sorted(week_data["category_distribution"].items(), key=lambda x: -x[1])
        category_text = "\n".join([
            f"- {cat}: {round(mins/60, 1)} 小时"
            for cat, mins in sorted_cats[:6]
        ])

    daily_text = ""
    if week_data.get("daily_stats"):
        sorted_days = sorted(week_data["daily_stats"].items())
        daily_text = "\n".join([
            f"- {d}: 完成 {s['completed']}/{s['tasks']} 项，专注 {round(s['focus_minutes']/60, 1)} 小时"
            for d, s in sorted_days
        ])

    # 上周对比
    compare_text = ""
    if last_week_data and last_week_data.get("total_tasks", 0) > 0:
        task_delta = week_data.get("completed_tasks", 0) - last_week_data.get("completed_tasks", 0)
        focus_delta = week_data.get("total_focus_minutes", 0) - last_week_data.get("total_focus_minutes", 0)
        rate_delta = week_data.get("completion_rate", 0) - last_week_data.get("completion_rate", 0)
        compare_text = f"""
## 上周对比
- 完成任务数：{'+' if task_delta >= 0 else ''}{task_delta} 项
- 专注时长：{'+' if focus_delta >= 0 else ''}{round(focus_delta/60, 1)} 小时
- 完成率：{'+' if rate_delta >= 0 else ''}{round(rate_delta, 1)}%
"""

    system_prompt = (
        "你是「伴伴」的周报分析师。你的任务是根据用户本周的行为数据，"
        "生成一份温暖、有洞察力的周报摘要。\n\n"
        "## 输出要求\n"
        "请严格按照以下 JSON 格式输出，不要有任何额外文字：\n"
        "{\n"
        '  "summary": "一句话总结本周（30字以内，温暖有画面感）",\n'
        '  "highlights": ["核心发现1（做得好的地方）", "核心发现2", "核心发现3"],\n'
        '  "improvement": "一个值得改进的点（温和、不批评，给出具体建议）",\n'
        '  "time_analysis": "时间分布分析，说明在哪类事情上花了最多时间，以及这种分布的意义",\n'
        '  "suggestions": ["下周建议1（具体可执行）", "下周建议2", "下周建议3"]\n'
        "}\n\n"
        "## 风格要求\n"
        "1. 温暖、不评判、不说教，像朋友一样\n"
        "2. 基于真实数据，不要编造\n"
        "3. 发现积极的模式，也温和指出可以改进的地方\n"
        "4. 建议要具体、可执行，不要空泛\n"
        "5. highlights 是做得好的地方，每个不超过30字\n"
        "6. improvement 是一个值得关注的点，要给出具体建议，不超过50字\n"
    )

    user_content = f"""## 本周数据概览
- 时间范围：{week_data.get('start_date', '')} ~ {week_data.get('end_date', '')}
- 总任务数：{week_data.get('total_tasks', 0)} 项
- 已完成：{week_data.get('completed_tasks', 0)} 项
- 完成率：{week_data.get('completion_rate', 0)}%
- 总专注时长：{week_data.get('focus_hours', 0)} 小时
{compare_text}
## 分类时间分布
{category_text or '暂无分类数据'}

## 每日明细
{daily_text or '暂无每日数据'}

## 部分任务示例
{json.dumps(week_data.get('tasks', [])[:10], ensure_ascii=False, indent=2)}

请基于以上数据生成本周周报摘要：
"""

    try:
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_content},
        ]
        result = companion.ai.chat(messages, temperature=0.7, max_tokens=1200)

        # 解析结果
        result_text = result.get("text", str(result)) if isinstance(result, dict) else str(result)

        # 尝试提取 JSON
        import re
        json_match = re.search(r'\{[\s\S]*\}', result_text)
        if json_match:
            try:
                parsed = json.loads(json_match.group())
                return parsed
            except json.JSONDecodeError:
                pass

        # 如果解析失败，返回纯文本格式
        return {
            "summary": result_text[:60] + "..." if len(result_text) > 60 else result_text,
            "highlights": [],
            "improvement": "",
            "time_analysis": "",
            "suggestions": [],
            "raw_text": result_text,
        }

    except Exception as e:
        print(f"周报 AI 生成失败: {e}")
        return None


@app.route("/api/weekly/generate", methods=["POST"])
def api_weekly_generate():
    """生成本周 AI 摘要"""
    data = request.json or {}
    week_start = data.get("week_start")
    week_end = data.get("week_end")

    start_date, end_date = _get_week_range(week_start, week_end)

    # 聚合本周数据
    week_data = _aggregate_week_data(start_date, end_date)

    # 聚合上周数据（用于对比）
    last_start, last_end = _get_last_week_range()
    last_week_data = _aggregate_week_data(last_start, last_end)

    # 调用 AI 生成摘要
    ai_summary = _generate_weekly_ai_summary(week_data, last_week_data)

    result = {
        "ok": True,
        "week_start": start_date,
        "week_end": end_date,
        "stats": {
            "total_tasks": week_data.get("total_tasks", 0),
            "completed_tasks": week_data.get("completed_tasks", 0),
            "completion_rate": week_data.get("completion_rate", 0),
            "total_focus_minutes": week_data.get("total_focus_minutes", 0),
            "focus_hours": week_data.get("focus_hours", 0),
            "category_distribution": week_data.get("category_distribution", {}),
            "daily_stats": week_data.get("daily_stats", {}),
            "commitments_total": week_data.get("commitments_total", 0),
            "commitments_completed": week_data.get("commitments_completed", 0),
        },
        "last_week_stats": {
            "total_tasks": last_week_data.get("total_tasks", 0),
            "completed_tasks": last_week_data.get("completed_tasks", 0),
            "completion_rate": last_week_data.get("completion_rate", 0),
            "total_focus_minutes": last_week_data.get("total_focus_minutes", 0),
            "focus_hours": last_week_data.get("focus_hours", 0),
        },
        "ai_summary": ai_summary,
        "generated_at": datetime.now().isoformat(),
    }

    return jsonify(result)


@app.route("/api/weekly/summary", methods=["GET"])
def api_weekly_summary():
    """获取最近保存的周报"""
    db = companion.db if companion else None
    if not db:
        return jsonify({"ok": False, "error": "数据库未就绪"}), 500

    try:
        saved = db.get_config("weekly_report_latest", None)
        if saved:
            report_data = json.loads(saved)
            return jsonify({"ok": True, "report": report_data})
        else:
            return jsonify({"ok": True, "report": None})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/weekly/save", methods=["POST"])
def api_weekly_save():
    """保存周报记录到 app_config"""
    data = request.json or {}
    db = companion.db if companion else None
    if not db:
        return jsonify({"ok": False, "error": "数据库未就绪"}), 500

    try:
        report_data = data.get("report")
        if not report_data:
            return jsonify({"ok": False, "error": "缺少周报数据"}), 400

        # 保存最新周报
        db.set_config("weekly_report_latest", json.dumps(report_data, ensure_ascii=False))

        # 保存历史记录（按周存储）
        week_key = f"weekly_report_{report_data.get('week_start', '')}_{report_data.get('week_end', '')}"
        db.set_config(week_key, json.dumps(report_data, ensure_ascii=False))

        # 更新周报列表
        history_str = db.get_config("weekly_report_history", "[]")
        try:
            history = json.loads(history_str)
        except Exception:
            history = []

        # 添加到历史（去重）
        entry = {
            "week_start": report_data.get("week_start", ""),
            "week_end": report_data.get("week_end", ""),
            "saved_at": datetime.now().isoformat(),
            "summary": report_data.get("ai_summary", {}).get("summary", "") if report_data.get("ai_summary") else "",
        }
        # 移除同周期旧记录
        history = [h for h in history if h.get("week_start") != entry["week_start"]]
        history.insert(0, entry)
        # 最多保留 12 周
        history = history[:12]
        db.set_config("weekly_report_history", json.dumps(history, ensure_ascii=False))

        return jsonify({"ok": True, "saved_at": datetime.now().isoformat()})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/weekly/history", methods=["GET"])
def api_weekly_history():
    """获取周报历史列表"""
    db = companion.db if companion else None
    if not db:
        return jsonify({"ok": False, "error": "数据库未就绪"}), 500

    try:
        history_str = db.get_config("weekly_report_history", "[]")
        history = json.loads(history_str) if history_str else []
        return jsonify({"ok": True, "history": history})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/ai/regulate", methods=["POST"])
def api_ai_regulate():
    """AI 调节提醒（L1 人格模型）"""
    data = request.json
    router = ai_router or AIRouter()
    result = router.regulate_communication(
        data.get("user_state", {}),
        data.get("comm_profile", {}),
        float(data.get("task_importance", 0.5)),
        float(data.get("last_speak_minutes", 999)),
    )
    return jsonify(result)


@app.route("/api/ai/generate-plan", methods=["POST"])
def api_ai_generate_plan():
    """AI 生成今日路径（L2-A → L1 流水线）"""
    data = request.json
    router = ai_router or AIRouter()
    result = router.generate_plan(
        data.get("event_nodes", []),
        data.get("time_blocks", []),
        data.get("user_model", {}),
    )
    return jsonify(result)


@app.route("/api/ai/test", methods=["POST"])
def api_ai_test():
    """快速测试所有 AI 任务"""
    router = ai_router or AIRouter()
    result = router.test_all()
    return jsonify(result)


# ========= 画布 API（设计文档第21章完整实现）=========

# 全局 CanvasStore 实例
canvas_store: CanvasStore = None


def get_canvas_store() -> CanvasStore:
    global canvas_store
    if canvas_store is None:
        db = companion.db if companion else Database()
        canvas_store = CanvasStore(db)
    return canvas_store


@app.route("/api/canvas", methods=["GET"])
def api_canvas_get():
    """获取完整画布数据 — 设计文档 21.1"""
    store = get_canvas_store()
    return jsonify(store.get_canvas_data())


@app.route("/api/canvas/mutations", methods=["POST"])
def api_canvas_mutations():
    """批量变更 — 设计文档 21.3"""
    data = request.json
    mutations = data.get("mutations", [])
    store = get_canvas_store()
    result = store.apply_mutations(mutations)
    return jsonify(result)


@app.route("/api/canvas/candidates/<candidate_id>/decision", methods=["POST"])
def api_canvas_candidate_decision(candidate_id):
    """候选节点决策 — 设计文档 21.4"""
    data = request.json
    decision = data.get("decision", "accepted")  # accepted|modified|rejected|merged
    patch = data.get("patch")
    store = get_canvas_store()
    node = store.decide_candidate(candidate_id, decision, patch)
    if node is None and decision != "rejected":
        return jsonify({"error": "candidate not found"}), 404
    return jsonify({"ok": True, "node": node.to_dict() if node else None})


@app.route("/api/canvas/classify", methods=["POST"])
def api_canvas_classify():
    """
    AI 节点分类 — P0 重构版
    
    核心变更：
    1. 禁止 AI 自动创建正式节点（所有 AI 输出 → 候选 → 用户确认）
    2. 创建候选前先做重复检测
    3. 候选接受前做完整性检查
    4. 使用新的 6 类节点类型
    """
    data = request.json
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "输入不能为空"}), 400

    source = data.get("source", "chat")
    existing_nodes = data.get("existing_nodes", [])
    surrounding_messages = data.get("surrounding_messages")
    work_profile = data.get("work_profile")
    current_plan_summary = data.get("current_plan_summary")

    # 如果没有传 current_plan_summary，从今日计划生成
    if not current_plan_summary:
        try:
            today = datetime.now().strftime("%Y-%m-%d")
            tasks = companion.db._conn().execute(
                "SELECT title, status, type FROM tasks WHERE date=? ORDER BY start_time", (today,)
            ).fetchall()
            if tasks:
                planned = [t for t in tasks if t["status"] in ("planned", "done")]
                if planned:
                    current_plan_summary = "今日计划: " + ", ".join(t["title"] for t in planned[:5])
        except Exception:
            pass

    router = ai_router or AIRouter()
    result = router.classify_canvas(
        input_text=text,
        source=source,
        existing_nodes=existing_nodes,
        surrounding_messages=surrounding_messages,
        work_profile=work_profile,
        current_plan_summary=current_plan_summary,
    )

    if "error" not in result and result.get("shouldCreateNode"):
        store = get_canvas_store()

        # 程序化重复检测（在 AI 判断之前）
        duplicates = store.check_duplicate(text)

        for candidate_data in result.get("candidates", []):
            confidence = candidate_data.get("confidence", 0.5)

            # P0 变更：所有 AI 输出都进入候选，不自动创建
            # 迁移旧 kind 值
            kind = candidate_data.get("kind", "record")
            if kind in LEGACY_KIND_MAP:
                kind = LEGACY_KIND_MAP[kind]
                candidate_data["kind"] = kind

            # 如果检测到重复，在候选中附带重复信息
            if duplicates:
                candidate_data["duplicateWarning"] = {
                    "hasDuplicates": True,
                    "duplicates": [
                        {
                            "nodeId": d["node"].id,
                            "title": d["node"].title,
                            "kind": d["node"].kind,
                            "similarity": d["similarity"],
                            "fieldsDiff": d["fields_diff"],
                        }
                        for d in duplicates[:3]  # 最多显示 3 个
                    ],
                }

            # 检查完整性
            completeness = CanvasStore.check_completeness(candidate_data)
            if not completeness["complete"]:
                candidate_data["needsClarification"] = True
                candidate_data["completenessIssues"] = completeness
            else:
                candidate_data["needsConfirmation"] = True

            # 低置信度：生成澄清问题
            if confidence < 0.75:
                if not result.get("clarification", {}).get("required"):
                    result["clarification"] = {
                        "required": True,
                        "question": f"你提到的「{text[:30]}」更像是一个想法还是具体的行动计划？",
                        "options": [
                            {"label": "只是一个记录", "patch": {"kind": "record", "commitment": "observed"}},
                            {"label": "我想做这件事", "patch": {"kind": "action", "commitment": "intended"}},
                            {"label": "这是一个项目", "patch": {"kind": "project", "commitment": "committed"}},
                        ],
                    }
                candidate_data["needsClarification"] = True

            # 所有 AI 输出 → 候选收件箱（不再自动创建）
            candidate = CanvasCandidate(
                source=source,
                original_text=candidate_data.get("originalText", text),
                proposal=candidate_data,
                ai_reason=candidate_data.get("evidence", ""),
            )
            store.add_candidate(candidate)
            candidate_data["candidateId"] = candidate.id

    return jsonify(result)


@app.route("/api/canvas/nodes/<node_id>/expand", methods=["POST"])
def api_canvas_node_expand(node_id):
    """AI 联想 — 设计文档 21.6 + 13.5"""
    store = get_canvas_store()
    node = store.get_node(node_id)
    if not node:
        return jsonify({"error": "node not found"}), 404

    data = request.json or {}
    max_suggestions = data.get("maxSuggestions", 5)
    modes = data.get("modes", ["related_ideas", "possible_actions", "resources"])
    include_work_profile = data.get("includeWorkProfile", False)
    existing_nodes = [n.to_dict() for n in store.list_nodes()]

    # 获取用户画像
    work_profile = None
    if include_work_profile:
        try:
            profile = companion.db._conn().execute(
                "SELECT * FROM user_profile WHERE id=1"
            ).fetchone()
            if profile:
                work_profile = {
                    "industry": profile["lifestyle"] or "",
                    "specializations": json.loads(profile["user_values"]) if profile["user_values"] else [],
                    "work_style": profile["work_style"] or "",
                }
        except Exception:
            pass

    router = ai_router or AIRouter()
    result = router.expand_node(
        node=node.to_dict(),
        max_suggestions=max_suggestions,
        modes=modes,
        existing_nodes=existing_nodes,
        include_work_profile=include_work_profile,
        work_profile=work_profile,
    )
    return jsonify(result)


@app.route("/api/canvas/nodes/<node_id>/decompose", methods=["POST"])
def api_canvas_node_decompose(node_id):
    """AI 拆解 — 设计文档 21.7 + 13.7"""
    store = get_canvas_store()
    node = store.get_node(node_id)
    if not node:
        return jsonify({"error": "node not found"}), 404

    # 获取已有子节点
    relations = store.get_node_relations(node_id)
    child_ids = [r.target_node_id for r in relations if r.relation == "decomposes_to"]
    existing_children = [store.get_node(cid).to_dict() for cid in child_ids
                         if store.get_node(cid)]

    router = ai_router or AIRouter()
    result = router.decompose_node(
        node=node.to_dict(),
        existing_children=existing_children,
    )
    return jsonify(result)


@app.route("/api/canvas/cluster-suggestions", methods=["POST"])
def api_canvas_cluster_suggestions():
    """AI 归类建议 — 设计文档 21.8 + 13.8"""
    data = request.json or {}
    store = get_canvas_store()

    # 默认只分析未分组节点
    if data.get("nodeIds"):
        nodes = [store.get_node(nid) for nid in data["nodeIds"]]
        nodes = [n for n in nodes if n]
    else:
        nodes = [n for n in store.list_nodes() if not n.group_id]

    if not nodes:
        return jsonify({"clusters": []})

    router = ai_router or AIRouter()
    result = router.suggest_clusters([n.to_dict() for n in nodes])
    return jsonify(result)


# 兼容规范端点路径 /api/canvas/suggest-clusters
@app.route("/api/canvas/suggest-clusters", methods=["POST"])
def api_canvas_suggest_clusters_alias():
    """AI 归类建议（规范端点别名）"""
    return api_canvas_cluster_suggestions()


@app.route("/api/canvas/candidates", methods=["GET"])
def api_canvas_candidates_list():
    """获取候选节点列表 — 规范端点"""
    status = request.args.get("status", "pending")
    store = get_canvas_store()
    candidates = store.list_candidates(status=status if status != "all" else None)
    return jsonify({"candidates": [c.to_dict() for c in candidates]})


@app.route("/api/canvas/nodes/<node_id>/toggle-pin", methods=["POST"])
def api_canvas_node_toggle_pin(node_id):
    """切换节点固定状态 — 规范端点"""
    store = get_canvas_store()
    node = store.toggle_pin(node_id)
    if node is None:
        return jsonify({"error": "node not found"}), 404
    return jsonify({"ok": True, "node": node.to_dict()})


@app.route("/api/canvas/nodes/<node_id>/clarify", methods=["POST"])
def api_canvas_node_clarify(node_id):
    """AI 澄清 — 设计文档 21.9 + 13.6"""
    store = get_canvas_store()
    node = store.get_node(node_id)
    if not node:
        return jsonify({"error": "node not found"}), 404

    router = ai_router or AIRouter()
    result = router.clarify_node(node.to_dict())
    return jsonify(result)


@app.route("/api/canvas/search", methods=["GET"])
def api_canvas_search():
    """搜索和筛选节点"""
    query = request.args.get("q", "")
    kinds = request.args.get("kinds", "")
    phases = request.args.get("phases", "")
    only_pinned = request.args.get("pinned", "").lower() == "true"

    filters = {}
    if kinds:
        filters["kinds"] = kinds.split(",")
    if phases:
        filters["phases"] = phases.split(",")
    if only_pinned:
        filters["onlyPinned"] = True

    store = get_canvas_store()
    nodes = store.search_nodes(query, filters if filters else None)
    return jsonify({"nodes": [n.to_dict() for n in nodes]})


@app.route("/api/canvas/groups", methods=["POST"])
def api_canvas_create_group():
    """创建分组"""
    data = request.json
    group = CanvasGroup.from_dict(data)
    store = get_canvas_store()
    created = store.create_group(group)
    return jsonify(created.to_dict())


@app.route("/api/canvas/groups/<group_id>", methods=["PUT", "DELETE"])
def api_canvas_group_ops(group_id):
    """更新/删除分组"""
    store = get_canvas_store()
    if request.method == "DELETE":
        store.delete_group(group_id)
        return jsonify({"ok": True})
    else:
        data = request.json
        updated = store.update_group(group_id, data)
        return jsonify(updated.to_dict() if updated else {"error": "not found"})


@app.route("/api/canvas/taxonomy-positions", methods=["POST"])
def api_canvas_taxonomy_positions():
    """计算分类视图坐标 — 设计文档 8.2"""
    store = get_canvas_store()
    positions = store.compute_taxonomy_positions()
    return jsonify({"positions": positions})


@app.route("/api/canvas/focus", methods=["GET"])
def api_canvas_focus():
    """重点视图 — 设计文档 8.3"""
    store = get_canvas_store()
    focus_nodes = store.get_focus_nodes()
    focus_ids = {n.id for n in focus_nodes}
    # 获取相关关系
    all_relations = store.list_relations()
    focus_relations = [r for r in all_relations
                       if r.source_node_id in focus_ids or r.target_node_id in focus_ids]
    return jsonify({
        "nodes": [n.to_dict() for n in focus_nodes],
        "relations": [r.to_dict() for r in focus_relations],
    })


# 兼容旧接口
@app.route("/api/canvas/ideate", methods=["POST"])
def api_canvas_ideate():
    """画布 AI 联想（兼容旧接口，内部调用 classify_canvas）"""
    data = request.json
    text = data.get("text", "").strip()
    if not text:
        return jsonify({"error": "输入不能为空"}), 400

    selected_node = data.get("selected_node")
    existing_nodes = data.get("existing_nodes", [])

    router = ai_router or AIRouter()
    result = router.ideate(text, selected_node, existing_nodes)
    return jsonify(result)


@app.route("/api/canvas/feedback", methods=["POST"])
def api_canvas_feedback():
    """记录分类反馈（文档21.5）"""
    data = request.json
    store = get_canvas_store()
    fb_id = store.record_classification_feedback(
        candidate_id=data.get("candidate_id"),
        original_text=data.get("original_text", ""),
        ai_kind=data.get("ai_kind"),
        ai_commitment=data.get("ai_commitment"),
        ai_confidence=data.get("ai_confidence"),
        user_decision=data.get("user_decision", "accepted"),
        user_corrected_kind=data.get("user_corrected_kind"),
        user_corrected_commitment=data.get("user_corrected_commitment"),
        feedback_reason=data.get("feedback_reason"),
        source=data.get("source", "chat"),
    )
    return jsonify({"ok": True, "id": fb_id})


@app.route("/api/canvas/feedback")
def api_canvas_feedback_list():
    """获取分类反馈历史"""
    store = get_canvas_store()
    feedbacks = store.list_feedback(limit=50)
    return jsonify(feedbacks)


@app.route("/api/canvas/share", methods=["POST"])
def api_canvas_share():
    """生成可分享的自包含HTML页面 — 读取当前画布数据，嵌入到独立HTML中"""
    import os
    store = get_canvas_store()
    canvas_data = store.get_canvas_data()

    # 序列化为JSON
    canvas_json = json.dumps(canvas_data, ensure_ascii=False)

    # 生成自包含HTML
    html_content = _generate_share_html(canvas_json)
    return html_content, 200, {"Content-Type": "text/html; charset=utf-8"}


@app.route("/api/canvas/share/save", methods=["POST"])
def api_canvas_share_save():
    """保存分享HTML到文件，返回可访问的URL"""
    import os
    store = get_canvas_store()
    canvas_data = store.get_canvas_data()
    canvas_json = json.dumps(canvas_data, ensure_ascii=False)
    html_content = _generate_share_html(canvas_json)

    # 保存到 ui_static/share/ 目录
    share_dir = os.path.join(os.path.dirname(__file__), "ui_static", "share")
    os.makedirs(share_dir, exist_ok=True)

    share_id = str(uuid.uuid4())[:8]
    filename = f"canvas_{share_id}.html"
    filepath = os.path.join(share_dir, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(html_content)

    return jsonify({"ok": True, "url": f"/share/{filename}", "id": share_id})


def _generate_share_html(canvas_json):
    """生成自包含的分享HTML"""
    return f'''<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>伴伴 · 画布分享</title>
<style>
* {{ margin: 0; padding: 0; box-sizing: border-box; }}
:root {{
  --brand: #5B8A72; --blue: #4A9FD4; --purple: #9B7ED8;
  --orange: #F5A623; --pink: #E57373; --gray: #9E9E9E;
  --green: #66BB6A; --yellow: #FDD835;
  --text-dark: #2C3E50; --text-mid: #5B5B5B; --text-light: #8A9AA0;
  --bg-canvas: #F8FAFB; --border: #E0E0E0; --grid-dot: #E8ECEF;
  --card-radius: 16px;
}}
html, body {{ width: 100%; height: 100%; overflow: hidden; }}
body {{
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Microsoft YaHei", sans-serif;
  background: var(--bg-canvas); color: var(--text-dark);
}}
.share-header {{
  height: 52px; display: flex; align-items: center; justify-content: space-between;
  padding: 0 24px; background: #FFF;
  box-shadow: 0 1px 4px rgba(0,0,0,0.04); z-index: 10;
}}
.share-title {{ font-size: 16px; font-weight: 600; color: var(--text-dark); }}
.share-meta {{ font-size: 12px; color: var(--text-light); }}
.share-hint {{
  font-size: 12px; color: var(--text-light); background: var(--bg-canvas);
  padding: 6px 24px; display: flex; align-items: center; gap: 6px;
}}
.canvas-container {{
  position: relative; width: 100%; height: calc(100vh - 90px);
  overflow: hidden; background: var(--bg-canvas);
  background-image: radial-gradient(circle, var(--grid-dot) 1px, transparent 1px);
  background-size: 24px 24px; cursor: grab;
}}
.canvas-container:active {{ cursor: grabbing; }}
.node-layer {{ position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform-origin: 0 0; }}
.edge-layer {{ position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; transform-origin: 0 0; }}
.group-layer {{ position: absolute; top: 0; left: 0; width: 100%; height: 100%; transform-origin: 0 0; }}

.card {{
  position: absolute; width: 180px; background: #FFF; border-radius: var(--card-radius);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04);
  overflow: hidden; cursor: pointer; transition: transform 0.15s, box-shadow 0.15s;
  user-select: none;
}}
.card:hover {{ transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1), 0 8px 24px rgba(0,0,0,0.06); }}
.card-header {{
  height: 36px; display: flex; align-items: center; gap: 8px;
  padding: 0 10px;
}}
.card-header-icon {{
  width: 24px; height: 24px; border-radius: 8px; display: flex;
  align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0;
}}
.card-header-info {{ flex: 1; min-width: 0; }}
.card-header-kind {{ font-size: 11px; font-weight: 600; line-height: 1.2; }}
.card-header-commitment {{ font-size: 10px; opacity: 0.7; line-height: 1.2; }}
.card-phase-badge {{
  font-size: 9px; padding: 2px 6px; border-radius: 8px; font-weight: 500; white-space: nowrap;
}}
.card-body {{ padding: 8px 12px 6px; }}
.card-title {{ font-size: 13px; font-weight: 600; color: var(--text-dark); line-height: 1.3; word-break: break-word; }}
.card-desc {{ font-size: 11px; color: var(--text-mid); margin-top: 4px; line-height: 1.4; }}
.card-commitment-track {{ height: 3px; background: #F0F0F0; border-radius: 2px; margin-top: 6px; overflow: hidden; }}
.card-commitment-fill {{ height: 100%; border-radius: 2px; transition: width 0.3s; }}
.card-footer {{ display: flex; gap: 8px; padding: 4px 12px 8px; font-size: 10px; color: var(--text-light); align-items: center; }}
.card-footer-item {{ display: flex; align-items: center; gap: 2px; }}
.card-pin-icon {{ position: absolute; top: 6px; right: 6px; font-size: 12px; z-index: 2; }}

.group-box {{
  position: absolute; border: 2px dashed rgba(91,138,114,0.3); border-radius: 16px;
  background: rgba(91,138,114,0.03); pointer-events: none;
}}
.group-label {{
  position: absolute; top: -12px; left: 12px; background: #FFF;
  padding: 2px 10px; border-radius: 10px; font-size: 12px; font-weight: 600;
  color: var(--brand); box-shadow: 0 1px 4px rgba(0,0,0,0.06); white-space: nowrap;
}}

.empty-state {{
  position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
  text-align: center; color: var(--text-light);
}}
.empty-state-icon {{ font-size: 48px; margin-bottom: 12px; }}
.empty-state-text {{ font-size: 14px; }}

.bottom-bar {{
  position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 4px; padding: 6px 12px; background: #FFF;
  border-radius: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); z-index: 10;
}}
.bottom-btn {{
  width: 36px; height: 36px; border: none; background: transparent;
  border-radius: 50%; cursor: pointer; font-size: 16px; color: var(--text-mid);
  display: flex; align-items: center; justify-content: center; transition: background 0.15s;
}}
.bottom-btn:hover {{ background: var(--bg-canvas); }}

.relation-label {{
  position: absolute; background: #FFF; padding: 1px 6px; border-radius: 8px;
  font-size: 10px; color: var(--text-mid); box-shadow: 0 1px 3px rgba(0,0,0,0.06);
  pointer-events: none; white-space: nowrap;
}}
</style>
</head>
<body>

<div class="share-header">
  <div>
    <div class="share-title">伴伴 · 画布分享</div>
    <div class="share-meta" id="shareMeta"></div>
  </div>
  <div class="share-meta">只读视图</div>
</div>
<div class="share-hint">💡 拖拽空白处可平移画布，滚轮缩放。这是只读分享页面。</div>

<div class="canvas-container" id="canvasContainer">
  <div class="group-layer" id="groupLayer"></div>
  <svg class="edge-layer" id="edgeLayer"></svg>
  <div class="node-layer" id="nodeLayer"></div>
  <div class="bottom-bar">
    <button class="bottom-btn" onclick="zoomOut()" title="缩小">−</button>
    <button class="bottom-btn" onclick="resetZoom()" title="适应">⊡</button>
    <button class="bottom-btn" onclick="zoomIn()" title="放大">+</button>
  </div>
</div>

<script>
const CANVAS_DATA = {canvas_json};

const KIND_STYLES = {{
  inspiration: {{ color: '#4A9FD4', bg: '#E3F2FD', icon: '💡', label: '灵感' }},
  desire:      {{ color: '#9B7ED8', bg: '#EDE7F6', icon: '✨', label: '想做' }},
  goal:        {{ color: '#66BB6A', bg: '#E8F5E9', icon: '🎯', label: '目标' }},
  project:     {{ color: '#F5A623', bg: '#FFF8E1', icon: '📦', label: '项目' }},
  action:      {{ color: '#FF7043', bg: '#FBE9E7', icon: '⚡', label: '行为' }},
  habit:       {{ color: '#26C6DA', bg: '#E0F7FA', icon: '🔄', label: '习惯' }},
  resource:    {{ color: '#78909C', bg: '#ECEFF1', icon: '📎', label: '资料' }},
  constraint:  {{ color: '#9E9E9E', bg: '#F5F5F5', icon: '🚫', label: '限制' }},
}};
const COMMITMENT_STYLES = {{
  observed:  {{ color: '#BDBDBD', label: '提及', percent: 10 }},
  interested:{{ color: '#9E9E9E', label: '感兴趣', percent: 25 }},
  intended:  {{ color: '#9B7ED8', label: '想做', percent: 45 }},
  committed: {{ color: '#5B8A72', label: '已确认', percent: 65 }},
  scheduled: {{ color: '#4A9FD4', label: '已安排', percent: 80 }},
  active:    {{ color: '#66BB6A', label: '执行中', percent: 100 }},
}};
const PHASE_LABELS = {{
  candidate: '候选', clarifying: '澄清中', confirmed: '已确认',
  planned: '已规划', active: '进行中', completed: '已完成',
  paused: '已暂停', archived: '已归档',
}};
const RELATION_STYLES = {{
  inspired_by:    {{ color: '#9B7ED8', label: '灵感来源', dash: '4 4' }},
  belongs_to:     {{ color: '#5B8A72', label: '属于', dash: 'none' }},
  decomposes_to:  {{ color: '#F5A623', label: '拆解为', dash: 'none' }},
  supports:       {{ color: '#4A9FD4', label: '支持', dash: 'none' }},
  depends_on:     {{ color: '#FF7043', label: '依赖', dash: '6 3' }},
  conflicts_with: {{ color: '#E57373', label: '冲突', dash: '6 3' }},
  replaces:       {{ color: '#78909C', label: '替代', dash: '4 4' }},
  duplicates:     {{ color: '#BDBDBD', label: '重复', dash: '2 4' }},
}};

const nodes = CANVAS_DATA.nodes || [];
const relations = CANVAS_DATA.relations || [];
const groups = CANVAS_DATA.groups || [];
let viewport = {{ x: 0, y: 0, scale: 1 }};

// 显示元信息
document.getElementById('shareMeta').textContent =
  nodes.length + ' 个节点 · ' + relations.length + ' 条关系 · ' + groups.length + ' 个分组';

function render() {{
  const nodeLayer = document.getElementById('nodeLayer');
  const edgeLayer = document.getElementById('edgeLayer');
  const groupLayer = document.getElementById('groupLayer');

  const transform = `translate(${{viewport.x}}px, ${{viewport.y}}px) scale(${{viewport.scale}})`;
  nodeLayer.style.transform = transform;
  edgeLayer.style.transform = transform;
  groupLayer.style.transform = transform;

  nodeLayer.innerHTML = '';
  edgeLayer.innerHTML = '';
  groupLayer.innerHTML = '';

  // 空状态
  if (nodes.length === 0) {{
    nodeLayer.innerHTML = '<div class="empty-state"><div class="empty-state-icon">🌱</div><div class="empty-state-text">还没有内容</div></div>';
    return;
  }}

  // 渲染分组
  groups.forEach(g => {{
    const pos = g.position || {{}};
    const size = g.size || {{}};
    const box = document.createElement('div');
    box.className = 'group-box';
    box.style.left = (pos.x || 0) + 'px';
    box.style.top = (pos.y || 0) + 'px';
    box.style.width = (size.width || 400) + 'px';
    box.style.height = (size.height || 300) + 'px';
    const label = document.createElement('div');
    label.className = 'group-label';
    label.textContent = g.title || '未命名分组';
    label.style.left = (pos.x || 0) + 'px';
    label.style.top = (pos.y || 0) + 'px';
    groupLayer.appendChild(box);
    groupLayer.appendChild(label);
  }});

  // 渲染节点
  nodes.forEach(node => {{
    const layout = node.layout || {{}};
    const ks = KIND_STYLES[node.kind] || KIND_STYLES.inspiration;
    const cs = COMMITMENT_STYLES[node.commitment] || COMMITMENT_STYLES.observed;
    const phaseLabel = PHASE_LABELS[node.phase] || '';

    const card = document.createElement('div');
    card.className = 'card';
    card.style.left = (layout.x || 0) + 'px';
    card.style.top = (layout.y || 0) + 'px';
    card.style.zIndex = layout.zIndex || 1;

    card.innerHTML = `
      ${{layout.isPinned ? '<div class="card-pin-icon">📌</div>' : ''}}
      <div class="card-header" style="background:${{ks.bg}};">
        <div class="card-header-icon" style="background:#FFF;">${{ks.icon}}</div>
        <div class="card-header-info">
          <div class="card-header-kind" style="color:${{ks.color}};">${{ks.label}}</div>
          <div class="card-header-commitment" style="color:${{ks.color}};">${{cs.label}}</div>
        </div>
        <div class="card-phase-badge" style="background:rgba(255,255,255,0.7);color:${{ks.color}};">${{phaseLabel}}</div>
      </div>
      <div class="card-body">
        <div class="card-title">${{node.title || ''}}</div>
        ${{node.description ? `<div class="card-desc">${{node.description}}</div>` : ''}}
        <div class="card-commitment-track">
          <div class="card-commitment-fill" style="width:${{cs.percent}}%;background:${{ks.color}};"></div>
        </div>
      </div>
      <div class="card-footer">
        ${{node.estimatedMinutes ? `<span class="card-footer-item">⏱ ${{node.estimatedMinutes}}min</span>` : ''}}
        ${{node.frequency ? `<span class="card-footer-item">🔄 ${{node.frequency}}</span>` : ''}}
        ${{node.confidence != null && node.confidence < 1 ? `<span class="card-footer-item" style="margin-left:auto;">${{Math.round(node.confidence * 100)}}%</span>` : ''}}
      </div>
    `;
    nodeLayer.appendChild(card);
  }});

  // 渲染关系线
  relations.forEach(rel => {{
    const source = nodes.find(n => n.id === rel.sourceNodeId);
    const target = nodes.find(n => n.id === rel.targetNodeId);
    if (!source || !target) return;
    const sPos = source.layout || {{}};
    const tPos = target.layout || {{}};
    const x1 = (sPos.x || 0) + 90, y1 = (sPos.y || 0) + 40;
    const x2 = (tPos.x || 0) + 90, y2 = (tPos.y || 0) + 40;

    const rs = RELATION_STYLES[rel.relation] || RELATION_STYLES.supports;

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', rs.color);
    line.setAttribute('stroke-width', '2');
    line.setAttribute('stroke-dasharray', rs.dash === 'none' ? '' : rs.dash);
    line.setAttribute('opacity', '0.6');
    edgeLayer.appendChild(line);

    // 箭头
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const ax = x2 - 10 * Math.cos(angle), ay = y2 - 10 * Math.sin(angle);
    const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    arrow.setAttribute('points', `${{x2}},${{y2}} ${{ax - 5 * Math.sin(angle)}},${{ay + 5 * Math.cos(angle)}} ${{ax + 5 * Math.sin(angle)}},${{ay - 5 * Math.cos(angle)}}`);
    arrow.setAttribute('fill', rs.color);
    arrow.setAttribute('opacity', '0.6');
    edgeLayer.appendChild(arrow);

    // 关系标签
    const midX = (x1 + x2) / 2, midY = (y1 + y2) / 2;
    const labelDiv = document.createElement('div');
    labelDiv.className = 'relation-label';
    labelDiv.textContent = rs.label;
    labelDiv.style.left = midX + 'px';
    labelDiv.style.top = midY + 'px';
    labelDiv.style.transform = 'translate(-50%, -50%)';
    nodeLayer.appendChild(labelDiv);
  }});
}}

function zoomIn() {{ viewport.scale = Math.min(viewport.scale * 1.2, 3); render(); }}
function zoomOut() {{ viewport.scale = Math.max(viewport.scale / 1.2, 0.3); render(); }}
function resetZoom() {{
  if (nodes.length === 0) {{ viewport = {{ x: 0, y: 0, scale: 1 }}; render(); return; }}
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  nodes.forEach(n => {{
    const l = n.layout || {{}};
    minX = Math.min(minX, l.x || 0); minY = Math.min(minY, l.y || 0);
    maxX = Math.max(maxX, (l.x || 0) + 180); maxY = Math.max(maxY, (l.y || 0) + 120);
  }});
  const w = maxX - minX, h = maxY - minY;
  const container = document.getElementById('canvasContainer');
  const scale = Math.min(container.clientWidth / w, container.clientHeight / h, 1.2) * 0.9;
  viewport.scale = Math.max(scale, 0.3);
  viewport.x = (container.clientWidth - w * viewport.scale) / 2 - minX * viewport.scale;
  viewport.y = (container.clientHeight - h * viewport.scale) / 2 - minY * viewport.scale + 20;
  render();
}}

// 拖拽平移
let isDragging = false, dragStart = null;
document.getElementById('canvasContainer').addEventListener('mousedown', e => {{
  if (e.target === e.currentTarget || e.target.classList.contains('node-layer') || e.target.classList.contains('edge-layer')) {{
    isDragging = true; dragStart = {{ x: e.clientX - viewport.x, y: e.clientY - viewport.y }};
  }}
}});
document.addEventListener('mousemove', e => {{
  if (isDragging) {{ viewport.x = e.clientX - dragStart.x; viewport.y = e.clientY - dragStart.y; render(); }}
}});
document.addEventListener('mouseup', () => {{ isDragging = false; }});

// 滚轮缩放
document.getElementById('canvasContainer').addEventListener('wheel', e => {{
  e.preventDefault();
  if (e.deltaY < 0) zoomIn(); else zoomOut();
}}, {{ passive: false }});

// 初始渲染
window.addEventListener('load', () => {{ resetZoom(); }});
window.addEventListener('resize', () => {{ render(); }});
</script>
</body>
</html>'''


# ============================================================
# 认知层 API — 八维认知图谱 / 证据 / 用户模型 / 沟通画像
# 对应《AI认知层交互与开发规格 V1.0》与《人格画像规格 V1》
# ============================================================

# 全局 CognitionStore 实例
_cognition_store_instance = None


def get_cognition_store() -> CognitionStore:
    """获取全局 CognitionStore 实例（复用 companion 的数据库连接）"""
    global _cognition_store_instance
    if _cognition_store_instance is None:
        db = companion.db if companion else Database()
        _cognition_store_instance = CognitionStore(db)
    return _cognition_store_instance


def _collect_recent_behaviors(limit_events: int = 30,
                              limit_screenshots: int = 20,
                              limit_windows: int = 30) -> list:
    """收集近期行为数据（事件 / 截图 / 窗口活动 / 行为认知结果），供 AI 分析使用"""
    behaviors = []
    # 事件节点
    try:
        engine = get_event_engine()
        events = engine.list(limit=limit_events)
        behaviors.extend([
            {"type": "event", "title": e.title, "state": e.state,
             "node_type": e.node_type, "importance": e.importance}
            for e in events
        ])
    except Exception:
        pass
    # 截图与窗口活动
    try:
        db = companion.db if companion else Database()
        for s in db.get_screenshots(limit=limit_screenshots):
            behaviors.append({
                "type": "screenshot", "app": s.app_name,
                "window": s.window_title, "analysis": s.ai_analysis,
            })
        for w in db.get_window_events(limit=limit_windows):
            behaviors.append({
                "type": "window", "app": w.app_name,
                "title": w.window_title, "duration": w.duration,
            })
    except Exception:
        pass
    # 行为认知引擎的分析结果（更丰富的判断）
    try:
        db = companion.db if companion else Database()
        for br in db.get_behavior_results(limit=20):
            behaviors.append({
                "type": "cognition",
                "state": br.get("primary_state", ""),
                "state_label": br.get("state_label", ""),
                "confidence": br.get("confidence", 0),
                "source": br.get("source", ""),
                "ai_reasoning": br.get("ai_reasoning"),
                "suggested_action": br.get("suggested_action"),
            })
    except Exception:
        pass
    return behaviors


# ---- 1. S0 常驻态摘要 ----
@app.route("/api/cognition/context-summary")
def api_cognition_context_summary():
    """S0 常驻态摘要 — 认知层文档 6.1"""
    try:
        store = get_cognition_store()
        return jsonify(store.get_context_summary())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- 2. S2 完整态八维图谱 ----
@app.route("/api/cognition/map")
def api_cognition_map():
    """S2 完整态八维认知图谱 — 认知层文档 6.2"""
    try:
        store = get_cognition_store()
        return jsonify(store.get_map())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- 3. S3 详情态单个维度 ----
@app.route("/api/cognition/dimensions/<dimension_id>")
def api_cognition_dimension_detail(dimension_id):
    """S3 详情态单个维度 — 认知层文档 6.3"""
    try:
        store = get_cognition_store()
        item = store.get_item(dimension_id)
        if not item:
            return jsonify({"error": "维度不存在", "dimension": dimension_id}), 404
        evidence = store.get_evidence(dimension_id)
        corrections = store.get_corrections(dimension_id)
        return jsonify({
            "item": item.to_dict(),
            "evidence": [ev.to_dict() for ev in evidence],
            "corrections": corrections,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- 4. 用户修正 ----
@app.route("/api/cognition/correct", methods=["POST"])
def api_cognition_correct():
    """用户修正认知项 — 认知层文档 5.3"""
    try:
        data = request.json or {}
        dimension = data.get("dimension")
        correction_type = data.get("correction_type")
        if not dimension or not correction_type:
            return jsonify({"error": "缺少 dimension 或 correction_type"}), 400

        store = get_cognition_store()
        result = store.correct_item(
            dimension=dimension,
            correction_type=correction_type,
            note=data.get("note"),
            new_sentence=data.get("new_sentence"),
        )
        if "error" in result:
            return jsonify(result), 404

        # 记录反馈到 AI 路由器（若方法可用），用于更新用户模型
        try:
            router = ai_router or AIRouter()
            if hasattr(router, "update_user_model"):
                router.update_user_model(
                    behaviors=[],
                    feedbacks=[{
                        "dimension": dimension,
                        "correction_type": correction_type,
                        "note": data.get("note"),
                        "new_sentence": data.get("new_sentence"),
                    }],
                    review={},
                    current_model=store.get_user_model(),
                )
        except Exception:
            pass  # 反馈记录失败不影响修正结果

        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- 5. 证据列表 ----
@app.route("/api/cognition/evidence")
def api_cognition_evidence_list():
    """获取证据列表（可按维度过滤）"""
    try:
        store = get_cognition_store()
        dimension = request.args.get("dimension")
        limit = request.args.get("limit", default=50, type=int)
        evidence = store.get_evidence(dimension, limit)
        return jsonify([ev.to_dict() for ev in evidence])
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- 6. 用户模型 + 沟通画像 ----
@app.route("/api/model/profile")
def api_model_profile_get():
    """获取用户模型 + 沟通画像"""
    try:
        store = get_cognition_store()
        return jsonify({
            "userModel": store.get_user_model(),
            "communicationProfile": store.get_communication_profile().to_dict(),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- 7. 更新用户模型 ----
@app.route("/api/model/profile", methods=["POST"])
def api_model_profile_update():
    """更新用户模型 — Body: {updates: {...}}"""
    try:
        data = request.json or {}
        updates = data.get("updates", {})
        if not updates:
            return jsonify({"error": "缺少 updates"}), 400
        store = get_cognition_store()
        result = store.update_user_model(updates)
        return jsonify({"ok": True, "userModel": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- 8. 获取沟通画像 ----
@app.route("/api/model/communication")
def api_model_communication_get():
    """获取沟通画像"""
    try:
        store = get_cognition_store()
        return jsonify(store.get_communication_profile().to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- 9. 更新沟通画像 ----
@app.route("/api/model/communication", methods=["POST"])
def api_model_communication_update():
    """更新沟通画像 — Body: {...patch}"""
    try:
        patch = request.json or {}
        store = get_cognition_store()
        profile = store.update_communication_profile(patch)
        return jsonify({"ok": True, "communicationProfile": profile.to_dict()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- 10. AI 重建用户模型 ----
@app.route("/api/model/rebuild", methods=["POST"])
def api_model_rebuild():
    """触发 AI 重建用户模型 — 基于近期行为数据"""
    try:
        store = get_cognition_store()
        router = ai_router or AIRouter()

        # 收集近期行为数据
        behaviors = _collect_recent_behaviors()

        # 用户修正作为反馈信号
        feedbacks = []
        try:
            feedbacks = store.get_corrections(limit=20)
        except Exception:
            pass

        review = {}
        current_model = store.get_user_model()

        # 调用 AI 重建用户模型
        result = router.update_user_model(behaviors, feedbacks, review, current_model)
        if "error" in result:
            return jsonify({"error": "AI 重建失败", "detail": result.get("error")}), 500

        # 持久化用户模型更新
        updates = result.get("updates", {})
        if updates:
            store.update_user_model(updates)

        # 应用认知条目更新（若 AI 返回了 cognition items）
        cognition_updates = result.get("cognition_items") or result.get("cognition") or []
        applied = []
        if cognition_updates:
            applied = store.apply_ai_updates(cognition_updates)

        # 写入 AI 推断的证据（按维度归类）
        evidence_count = 0
        for ev in result.get("evidence", []):
            if isinstance(ev, dict) and ev.get("dimension"):
                store.add_evidence(
                    dimension=ev["dimension"],
                    source="ai_inference",
                    content=ev.get("content", str(ev)),
                    weight=ev.get("weight", 0.7),
                )
                evidence_count += 1

        return jsonify({
            "ok": True,
            "updates": updates,
            "new_patterns": result.get("new_patterns", []),
            "evidence_count": evidence_count,
            "cognition_updated": len(applied),
            "confidence": result.get("confidence", 0),
            "summary_update": result.get("summary_update", ""),
            "userModel": store.get_user_model(),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- 11. AI 刷新八维认知句 ----
@app.route("/api/cognition/refresh", methods=["POST"])
def api_cognition_refresh():
    """触发 AI 刷新八维认知句 — 基于近期行为重新生成各维度认知"""
    try:
        store = get_cognition_store()
        router = ai_router or AIRouter()

        behaviors = _collect_recent_behaviors()
        current_map = store.get_map()
        user_model = store.get_user_model_v2()

        # 调用 ai_router 的专用方法（传入用户模型让 AI 结合已知信息）
        result = router.generate_cognition_sentences(behaviors, current_map, user_model)
        if "error" in result:
            return jsonify({"error": "AI 刷新失败", "detail": result.get("error")}), 500

        # 写入每个维度
        dim_ids = {d["id"] for d in COGNITION_DIMENSIONS}
        updated = []
        for it in result.get("items", []):
            dim = it.get("dimension", "")
            if dim not in dim_ids:
                continue
            sentence = it.get("sentence", "")
            confidence = it.get("confidence")
            try:
                conf_val = float(confidence) if confidence is not None else None
            except (TypeError, ValueError):
                conf_val = None
            item = store.update_item(dim, sentence=sentence, confidence=conf_val)

            # 写入 AI 推断的证据
            for ev in it.get("evidence", []):
                if isinstance(ev, dict) and ev.get("content"):
                    store.add_evidence(
                        dimension=dim,
                        source=ev.get("source", "ai_inference"),
                        content=ev["content"],
                        weight=ev.get("weight", 0.7),
                    )

            updated.append(item.to_dict())

        return jsonify({"ok": True, "updated": updated, "count": len(updated)})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---- 12. 手动添加证据 ----
@app.route("/api/cognition/evidence", methods=["POST"])
def api_cognition_evidence_add():
    """手动添加证据 — Body: {dimension, source, content, weight?, source_id?}"""
    try:
        data = request.json or {}
        dimension = data.get("dimension")
        source = data.get("source", "observed")
        content = data.get("content", "")
        if not dimension or not content:
            return jsonify({"error": "缺少 dimension 或 content"}), 400

        store = get_cognition_store()
        weight = data.get("weight", 1.0)
        try:
            weight = float(weight)
        except (TypeError, ValueError):
            weight = 1.0

        ev = store.add_evidence(
            dimension=dimension,
            source=source,
            content=content,
            source_id=data.get("source_id"),
            weight=weight,
        )
        return jsonify({"ok": True, "evidence": ev.to_dict()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# Onboarding API
# ============================================================

@app.route("/api/onboarding/questions")
def api_onboarding_questions():
    """返回完整 onboarding 题库（行动风格问题 / 行业地图 / 角色 / 计划风格）"""
    try:
        return jsonify(get_question_bank())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/onboarding/status")
def api_onboarding_status():
    """返回 onboarding 完成状态与草稿是否存在"""
    try:
        store = get_cognition_store()
        completed = store.is_onboarding_completed()
        draft = store.get_onboarding_draft()
        has_draft = bool(draft and draft.get("draft"))
        return jsonify({"completed": completed, "hasDraft": has_draft})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/onboarding/draft")
def api_onboarding_draft_get():
    """返回已保存的 onboarding 草稿"""
    try:
        store = get_cognition_store()
        return jsonify(store.get_onboarding_draft())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/onboarding/draft", methods=["POST"])
def api_onboarding_draft_save():
    """保存 onboarding 草稿 — Body: {"draft": {...}}"""
    try:
        data = request.json or {}
        store = get_cognition_store()
        store.save_onboarding_draft(data["draft"])
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/onboarding/complete", methods=["POST"])
def api_onboarding_complete():
    """完成 onboarding — Body: {"draft": {...}}"""
    try:
        data = request.json or {}
        draft = OnboardingDraft.from_dict(data["draft"])
        user_model = build_user_model(draft)
        candidates = build_canvas_candidates(draft)
        store = get_cognition_store()
        store.complete_onboarding(draft.to_dict(), user_model.to_dict())
        return jsonify({
            "ok": True,
            "userModel": user_model.to_dict(),
            "candidates": candidates,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/onboarding/skip", methods=["POST"])
def api_onboarding_skip():
    """跳过 onboarding — 用空草稿标记完成，后续可重新填写"""
    try:
        empty_draft = OnboardingDraft()
        store = get_cognition_store()
        store.complete_onboarding(empty_draft.to_dict(), {})
        return jsonify({"ok": True, "skipped": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/onboarding/reset", methods=["POST"])
def api_onboarding_reset():
    """重置 onboarding 状态 — 下次打开时重新显示调研问卷"""
    try:
        store = get_cognition_store()
        conn = store.db._conn()
        conn.execute("UPDATE onboarding_draft SET completed = 0 WHERE id = 1")
        conn.commit()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/onboarding/followup", methods=["POST"])
def api_onboarding_followup():
    """AI 根据已填问卷生成追问问题 — Body: {"draft": {...}, "count": 5, "round": 1, "prev_answers": [...]}"""
    try:
        data = request.json or {}
        draft = data.get("draft", {})
        count = data.get("count", 5)
        round_num = data.get("round", 1)
        prev_answers = data.get("prev_answers", None)
        router = ai_router or AIRouter()
        result = router.generate_followup_questions(draft, count=count,
                                                     round_num=round_num,
                                                     prev_followup_answers=prev_answers)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/onboarding/analysis", methods=["POST"])
def api_onboarding_analysis():
    """生成 AI 人格分析 — Body: {"draft": {...}}
    在 onboarding 完成前调用，返回温暖的人格分析报告。
    """
    try:
        data = request.json or {}
        draft_data = data.get("draft", {})
        draft = OnboardingDraft.from_dict(draft_data)
        user_model = build_user_model(draft)
        router = ai_router or AIRouter()
        analysis = router.generate_personality_analysis(
            draft_data, user_model.to_dict()
        )
        return jsonify({"analysis": analysis, "userModel": user_model.to_dict()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/onboarding/chat", methods=["POST"])
def api_onboarding_chat():
    """Onboarding 期间的 AI 对话 — Body: {"message": "...", "draft": {...}, "history": [...]}
    基于用户问卷答案和人格分析，进行有上下文的对话。
    """
    try:
        data = request.json or {}
        user_msg = data.get("message", "").strip()
        draft = data.get("draft", {})
        history = data.get("history", [])

        if not user_msg:
            return jsonify({"ok": False, "error": "请输入内容"})

        # 构建上下文摘要
        router = ai_router or AIRouter()
        context_summary = router._summarize_draft(draft)

        # 构建系统提示
        system_prompt = (
            "你是「伴伴」，用户刚完成了初始认知问卷。"
            "你已经根据用户的回答生成了人格分析，现在用户想和你聊聊。\n\n"
            f"## 用户的问卷回答摘要\n{context_summary}\n\n"
            "## 对话原则\n"
            "1. 基于用户的问卷回答，给出有针对性的回应\n"
            "2. 保持温暖、简短、口语化，一次最多2-3句\n"
            "3. 可以追问、共情、提建议，但不命令\n"
            "4. 如果用户问关于自己的分析，可以基于问卷给出洞察\n"
            "5. 如果用户有新想法或补充，记住它们\n"
            "6. 这是 onboarding 的最后一步，聊完后用户就会进入伴伴"
        )

        # 构建消息列表
        messages = [{"role": "system", "content": system_prompt}]
        for h in history[-10:]:  # 最多保留最近10条
            messages.append(h)
        messages.append({"role": "user", "content": user_msg})

        reply = router._call_api(
            "\n".join(m["content"] for m in messages if m["role"] == "system"),
            user_msg,
            temperature=0.85,
            max_tokens=300,
        )

        # 确保 reply 是字符串
        reply_text = reply.get("text", str(reply)) if isinstance(reply, dict) else reply

        return jsonify({"ok": True, "reply": reply_text})
    except Exception as e:
        return jsonify({"ok": False, "error": f"AI 回复失败: {e}"}), 500


# ============================================================
# UCM-8 Onboarding API (新版)
# ============================================================

@app.route("/api/ucm8/profile")
def api_ucm8_get_profile():
    """获取 UCM-8 八维画像"""
    try:
        store = get_cognition_store()
        profile = store.get_ucm8_profile()
        if profile:
            return jsonify({"ok": True, "profile": profile, "completed": True})
        else:
            return jsonify({"ok": True, "profile": None, "completed": False})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)}), 500


@app.route("/api/ucm8/questions")
def api_ucm8_questions():
    """返回 UCM-8 完整 40 题题库"""
    try:
        from onboarding_model import get_question_bank
        return jsonify(get_question_bank())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/ucm8/calculate", methods=["POST"])
def api_ucm8_calculate():
    """根据答案计算 UCM-8 八维评分 — Body: {"answers": {...}}"""
    try:
        data = request.json or {}
        answers = data.get("answers", {})
        from onboarding_model import OnboardingDraft, calculate_ucm8_scores
        draft = OnboardingDraft(answers=answers)
        scores = calculate_ucm8_scores(draft)
        return jsonify({"ok": True, "scores": scores})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/ucm8/profile", methods=["POST"])
def api_ucm8_build_profile():
    """构建完整 UCM8Profile — Body: {"draft": {...}}"""
    try:
        data = request.json or {}
        draft_data = data.get("draft", {})
        from onboarding_model import OnboardingDraft, build_ucm8_profile
        draft = OnboardingDraft.from_dict(draft_data)
        profile = build_ucm8_profile(draft)
        return jsonify({"ok": True, "profile": profile.to_dict()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/ucm8/draft")
def api_ucm8_draft_get():
    """获取 UCM-8 onboarding 草稿"""
    try:
        store = get_cognition_store()
        draft = store.get_ucm8_draft()
        return jsonify(draft or {})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/ucm8/draft", methods=["POST"])
def api_ucm8_draft_save():
    """保存 UCM-8 onboarding 草稿 — Body: {"draft": {...}}"""
    try:
        data = request.json or {}
        store = get_cognition_store()
        store.save_ucm8_draft(data.get("draft", {}))
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/ucm8/complete", methods=["POST"])
def api_ucm8_complete():
    """完成 UCM-8 onboarding — Body: {"draft": {...}}"""
    try:
        data = request.json or {}
        draft_data = data.get("draft", {})
        from onboarding_model import OnboardingDraft, build_ucm8_profile, build_user_model, build_canvas_candidates
        draft = OnboardingDraft.from_dict(draft_data)
        ucm8_profile = build_ucm8_profile(draft)
        user_model = build_user_model(draft)
        candidates = build_canvas_candidates(draft)
        store = get_cognition_store()
        store.complete_ucm8_onboarding(
            draft.to_dict(),
            ucm8_profile.to_dict(),
            user_model.to_dict()
        )
        return jsonify({
            "ok": True,
            "ucm8Profile": ucm8_profile.to_dict(),
            "userModel": user_model.to_dict(),
            "candidates": candidates,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/ucm8/analysis", methods=["POST"])
def api_ucm8_analysis():
    """生成 UCM-8 人格分析报告 — Body: {"draft": {...}}"""
    try:
        data = request.json or {}
        draft_data = data.get("draft", {})
        from onboarding_model import OnboardingDraft, build_ucm8_profile
        draft = OnboardingDraft.from_dict(draft_data)
        profile = build_ucm8_profile(draft)
        # 调用 AI 生成温暖的分析报告
        router = ai_router or AIRouter()
        analysis = router.generate_ucm8_analysis(profile.to_dict())
        return jsonify({"ok": True, "analysis": analysis, "profile": profile.to_dict()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/ucm8/followup", methods=["POST"])
def api_ucm8_followup():
    """AI 根据 UCM-8 问卷答案生成追问问题
    Body: {"draft": {...}, "count": 5, "round": 1, "prev_answers": [...], "open_ended_answer": "..."}
    """
    print("[DEBUG] api_ucm8_followup called!")
    try:
        data = request.json or {}
        draft = data.get("draft", {})
        count = data.get("count", 5)
        round_num = data.get("round", 1)
        prev_answers = data.get("prev_answers", None)
        open_ended_answer = data.get("open_ended_answer", "")
        router = ai_router or AIRouter()
        result = router.generate_ucm8_followup(draft, count=count,
                                                round_num=round_num,
                                                prev_followup_answers=prev_answers,
                                                open_ended_answer=open_ended_answer)
        # 调试：检查第一个选项的类型
        if result.get("questions"):
            q0 = result["questions"][0]
            opt0 = q0["options"][0] if q0.get("options") else None
            print(f"[DEBUG] followup q0 options[0] type: {type(opt0)}, value: {repr(opt0)[:80]}")
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# Behavior Cognition Engine API
# ============================================================

def _get_behavior_engine():
    """获取行为认知引擎实例（延迟初始化，连接 AI 复核 + 数据库 + 用户模型）"""
    from behavior_engine import get_behavior_engine
    router = ai_router or AIRouter()
    db = companion.db if companion else Database()
    engine = get_behavior_engine(ai_review_fn=router.analyze_behavior, db=db)
    # 加载用户模型到引擎
    try:
        from cognition_store import CognitionStore
        store = CognitionStore(db)
        user_model = store.get_user_model_v2()
        if user_model:
            engine.set_user_model(user_model)
    except Exception:
        pass
    return engine


@app.route("/api/behavior/current")
def api_behavior_current():
    """获取当前行为认知状态"""
    try:
        engine = _get_behavior_engine()
        result = engine.get_current_state()
        if result is None:
            # 没有数据时返回时间上下文作为默认
            from time_sense import get_current_time_context
            return jsonify({
                "primary_state": "unknown",
                "state_label": "等待数据",
                "confidence": 0,
                "time_context": get_current_time_context(),
                "message": "尚未采集到行为数据，请等待截图分析器运行",
            })
        return jsonify(result.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/behavior/analyze", methods=["POST"])
def api_behavior_analyze():
    """手动触发一次行为分析 — Body: {app_name, window_title, ocr_text, ...}"""
    try:
        data = request.json or {}
        engine = _get_behavior_engine()
        result = engine.analyze(data)
        return jsonify(result.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/behavior/timeline")
def api_behavior_timeline():
    """获取行为状态时间线 — Query: minutes=60"""
    try:
        minutes = request.args.get("minutes", 60, type=int)
        engine = _get_behavior_engine()
        timeline = engine.get_timeline(minutes=minutes)
        return jsonify({"timeline": timeline, "minutes": minutes})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/behavior/time-sense")
def api_behavior_time_sense():
    """获取当前时间感知上下文"""
    try:
        from time_sense import get_current_time_context
        return jsonify(get_current_time_context())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/behavior/feedback", methods=["POST"])
def api_behavior_feedback():
    """用户反馈 — Body: {correct: bool, correction: str}"""
    try:
        data = request.json or {}
        engine = _get_behavior_engine()
        engine.user_feedback(
            correct=data.get("correct", True),
            correction=data.get("correction", ""),
        )
        return jsonify({"status": "ok"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/behavior/simulate", methods=["POST"])
def api_behavior_simulate():
    """模拟行为数据（仅演示模式可用）— Body: {scenario: str}"""
    if not is_demo_mode():
        return jsonify({"ok": False, "error": "当前为真实数据模式，模拟功能已禁用"}), 403
    try:
        from behavior_config import classify_app
        scenarios = {
            "coding": {
                "app_name": "Code - Visual Studio Code",
                "window_title": "behavior_engine.py - banban - Visual Studio Code",
                "ocr_text": "class BehaviorCognitionEngine def analyze features screenshot_data",
                "ocr_keywords": ["code", "class", "def", "behavior", "engine"],
                "mouse_clicks": 45,
                "key_strokes": 320,
                "idle_seconds": 5,
                "is_locked": False,
                "screen_on": True,
            },
            "browsing": {
                "app_name": "Chrome",
                "window_title": "Figma 设计教程 - Google Search - Google Chrome",
                "ocr_text": "Figma 设计教程 UI 组件 原型设计 交互设计",
                "ocr_keywords": ["figma", "设计", "教程", "UI", "组件"],
                "mouse_clicks": 20,
                "key_strokes": 15,
                "idle_seconds": 30,
                "is_locked": False,
                "screen_on": True,
            },
            "social": {
                "app_name": "微信",
                "window_title": "微信群聊 - 产品组",
                "ocr_text": "需求确认 设计稿评审 下周计划",
                "ocr_keywords": ["需求", "设计", "评审", "计划"],
                "mouse_clicks": 12,
                "key_strokes": 30,
                "idle_seconds": 15,
                "is_locked": False,
                "screen_on": True,
            },
            "entertainment": {
                "app_name": "Bilibili",
                "window_title": "正在播放 - 编程搞笑合集 - 哔哩哔哩",
                "ocr_text": "弹幕 评论区 点赞 三连",
                "ocr_keywords": ["弹幕", "评论", "点赞"],
                "mouse_clicks": 8,
                "key_strokes": 3,
                "idle_seconds": 120,
                "is_locked": False,
                "screen_on": True,
            },
            "away": {
                "app_name": "",
                "window_title": "",
                "ocr_text": "",
                "ocr_keywords": [],
                "mouse_clicks": 0,
                "key_strokes": 0,
                "idle_seconds": 600,
                "is_locked": False,
                "screen_on": True,
            },
        }
        scenario = request.json.get("scenario", "coding") if request.json else "coding"
        sim_data = scenarios.get(scenario, scenarios["coding"])
        engine = _get_behavior_engine()
        result = engine.analyze(sim_data)
        return jsonify(result.to_dict())
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/behavior.html")
def behavior_page():
    """行为认知可视化页面"""
    return send_from_directory("ui_static", "behavior.html")


# ============================================================
# Event Engine API
# ============================================================

@app.route("/api/event-engine/transitions/<state>")
def api_event_engine_transitions(state):
    """返回指定状态的可用转换"""
    try:
        return jsonify({
            "state": state,
            "label": STATE_LABELS.get(state, state),
            "availableTransitions": get_available_transitions(state),
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/event-engine/validate", methods=["POST"])
def api_event_engine_validate():
    """验证状态转换 — Body: {"from": "floating", "to": "goal"}"""
    try:
        data = request.json or {}
        return jsonify(validate_transition(data["from"], data["to"]))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/event-engine/journey")
def api_event_engine_journey():
    """返回事件典型生命周期描述与状态标签"""
    try:
        return jsonify({
            "journey": describe_state_journey(),
            "states": STATE_LABELS,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# Planning Engine API
# ============================================================

@app.route("/api/planning/validate", methods=["POST"])
def api_planning_validate():
    """验证单个计划块 — Body: {"block": {...}, "realityBlocks": [...]}"""
    try:
        data = request.json or {}
        return jsonify(validate_plan_block(data["block"], data.get("realityBlocks", [])))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/planning/buffer", methods=["POST"])
def api_planning_buffer():
    """计算缓冲比例 — Body: {"planBlocks": [...], "availableMinutes": 480}"""
    try:
        data = request.json or {}
        return jsonify({"ratio": buffer_ratio(data["planBlocks"], data["availableMinutes"])})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/planning/suggest-buffer", methods=["POST"])
def api_planning_suggest_buffer():
    """建议缓冲块 — Body: {"planBlocks": [...], "availableMinutes": 480}"""
    try:
        data = request.json or {}
        return jsonify(suggest_buffer_blocks(data["planBlocks"], data["availableMinutes"]))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/planning/validate-batch", methods=["POST"])
def api_planning_validate_batch():
    """批量验证计划块 — Body: {"planBlocks": [...], "realityBlocks": [...]}"""
    try:
        data = request.json or {}
        return jsonify(validate_plan_batch(data["planBlocks"], data.get("realityBlocks", [])))
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# V2 Cognition API additions
# ============================================================

@app.route("/api/cognition/relations")
def api_cognition_relations_get():
    """返回所有维度间关系"""
    try:
        store = get_cognition_store()
        return jsonify({"relations": store.get_relations()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/cognition/relations", methods=["POST"])
def api_cognition_relations_add():
    """添加维度间关系 — Body: {"sourceDimension", "targetDimension", "label", "confidence"}"""
    try:
        data = request.json or {}
        store = get_cognition_store()
        rel = store.add_relation(
            source_dimension=data["sourceDimension"],
            target_dimension=data["targetDimension"],
            label=data.get("label", ""),
            confidence=float(data.get("confidence", 0.0)),
        )
        return jsonify(rel)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/model/v2")
def api_model_v2():
    """返回 V2 用户模型"""
    try:
        store = get_cognition_store()
        return jsonify({"userModelV2": store.get_user_model_v2()})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/plan/energy-curve")
def api_plan_energy_curve():
    """返回 24 小时能量曲线 + 用户个人节律数据，供时间罗盘使用"""
    try:
        from planning_engine import ENERGY_CURVE
        from time_sense import get_current_time_context

        # 获取用户个人节律
        store = get_cognition_store()
        user_model_v2 = store.get_user_model_v2() or {}
        user_model_v1 = store.get_user_model() or {}

        # V2 能量小时数据（如果有）
        energy_pattern_v2 = user_model_v2.get("energyPattern", {}) if isinstance(user_model_v2, dict) else {}
        hourly_v2 = energy_pattern_v2.get("hourly", []) if isinstance(energy_pattern_v2, dict) else []

        # V1 能量模式（chronotype, peak_hours）
        energy_v1 = user_model_v1.get("energy_pattern", {}) if isinstance(user_model_v1, dict) else {}
        peak_hours = energy_v1.get("high_energy_periods", [9, 10, 14, 15])
        chronotype = energy_v1.get("chronotype", "intermediate")

        # 时间感知上下文
        time_ctx = get_current_time_context()

        # 构造 24h 能量数据点：优先用 V2 用户数据，回退到全局能量曲线
        curve = []
        for hour in range(24):
            # 尝试从 V2 获取
            v2_entry = next((h for h in hourly_v2 if h.get("hour") == hour), None)
            if v2_entry and v2_entry.get("energy", 0) > 0:
                energy = v2_entry["energy"]
                focus = v2_entry.get("focus", energy)
                confidence = v2_entry.get("confidence", 0)
            else:
                energy = ENERGY_CURVE.get(hour, 0.3)
                focus = energy
                confidence = 0
            curve.append({"hour": hour, "energy": energy, "focus": focus, "confidence": confidence})

        return jsonify({
            "curve": curve,
            "peakHours": peak_hours,
            "chronotype": chronotype,
            "chronotypeLabel": {"morning": "晨型人", "evening": "夜猫子", "intermediate": "中间型"}.get(chronotype, chronotype),
            "timeContext": time_ctx,
            "currentHour": datetime.now().hour,
            "currentMinute": datetime.now().minute,
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/timeline/day")
def api_timeline_day():
    """返回全天时间线数据：计划任务 + 实际活动段，供时间线视图使用"""
    try:
        db = companion.db if companion else Database()
        today = datetime.now().strftime("%Y-%m-%d")

        # 今日计划
        plan = db.get_daily_plan(today)
        plan_tasks = plan.get("tasks", []) if plan else []

        # 今日承诺
        commitments = db.get_commitments_by_date(today)

        # 行为时间线（最近 12 小时）
        engine = _get_behavior_engine()
        raw_activities = engine.get_timeline(minutes=720)

        # 规范化活动数据字段名，使前端能统一处理
        activities = []
        for a in raw_activities:
            activities.append({
                "timestamp": a.get("timestamp", 0),
                "behavior_type": a.get("primary_state", a.get("behavior_type", "unknown")),
                "behavior_description": a.get("state_label", a.get("behavior_description", "")),
                "app_name": a.get("current_app", a.get("app_name", "")),
                "confidence": a.get("confidence", 0),
                "ai_reasoning": a.get("ai_reasoning", ""),
                "color": a.get("color", ""),
                "icon": a.get("icon", ""),
                "duration": a.get("duration", 0),
            })

        return jsonify({
            "date": today,
            "planTasks": plan_tasks,
            "commitments": commitments,
            "activities": activities,
            "planStatus": plan.get("status", "none") if plan else "none",
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ============================================================
# 新增：领域识别相关常量与辅助函数
# ============================================================

# 6 大领域定义
DOMAINS = ("work", "study", "health", "life", "interest", "other")

# 领域 → 关键词映射（用于 fallback 关键词匹配）
DOMAIN_KEYWORDS = {
    "work": [
        "工作", "方案", "项目", "客户", "会议", "报告", "邮件", "代码", "开发",
        "设计", "文档", "需求", "产品", "运营", "销售", "市场", "商务", "汇报",
        "评审", "bug", "功能", "上线", "迭代", "排期", "okr", "kpi", "绩效",
        "周会", "站会", "1对1", "对齐", "同步", "推进", "跟进", "交付",
    ],
    "study": [
        "学习", "英语", "单词", "课程", "读书", "阅读", "考研", "考证", "学",
        "教程", "视频课", "刷题", "复习", "预习", "笔记", "研究", "技能",
        "知识", "看书", "背书", "论文", "文献", "自学",
    ],
    "health": [
        "运动", "健身", "跑步", "瑜伽", "冥想", "锻炼", "体检", "减肥", "拉伸",
        "散步", "游泳", "骑行", "健身房", "增肌", "减脂", "塑形", "康复",
        "睡眠", "作息", "饮食", "营养", "健康", "保养",
    ],
    "life": [
        "购物", "做饭", "打扫", "洗衣", "理发", "搬家", "买", "生活", "家庭",
        "家务", "通勤", "装修", "维修", "缴费", "银行", "医院", "挂号",
        "相亲", "约会", "聚餐", "逛街", "旅行", "旅游", "度假",
    ],
    "interest": [
        "摄影", "画画", "音乐", "吉他", "游戏", "手工", "兴趣", "乐器", "书法",
        "绘画", "写作", "创作", "烘焙", "插花", "茶艺", "收藏", "桌游",
        "拼图", "乐高", "手办", "cosplay",
    ],
}

# 领域 → 默认任务类型映射
DOMAIN_DEFAULT_TYPE = {
    "work": "light_work",
    "study": "learning",
    "health": "exercise",
    "life": "routine",
    "interest": "learning",
    "other": "light_work",
}

# 领域 → 默认预估时长（分钟）
DOMAIN_DEFAULT_MINUTES = {
    "work": 45,
    "study": 45,
    "health": 30,
    "life": 20,
    "interest": 30,
    "other": 30,
}

# 领域中文名称
DOMAIN_LABELS = {
    "work": "工作",
    "study": "学习",
    "health": "健康",
    "life": "生活",
    "interest": "兴趣",
    "other": "其他",
}


def _classify_domain_by_keywords(title):
    """根据标题关键词做领域识别（fallback 方案）

    返回: (domain_id, confidence, matched_keywords)
    """
    title_lower = title.lower()
    domain_scores = {}

    for domain, keywords in DOMAIN_KEYWORDS.items():
        matched = []
        for kw in keywords:
            if kw in title_lower:
                matched.append(kw)
        if matched:
            # 匹配越多关键词，置信度越高，但最多 0.7（关键词匹配本身置信度有限）
            score = min(0.7, 0.3 + 0.1 * len(matched))
            domain_scores[domain] = (score, matched)

    if not domain_scores:
        return ("other", 0.3, [])

    # 按得分排序
    sorted_domains = sorted(domain_scores.items(), key=lambda x: x[1][0], reverse=True)
    best_domain, (best_score, best_matched) = sorted_domains[0]

    # 如果有多个领域得分接近，降低置信度
    if len(sorted_domains) >= 2:
        second_score = sorted_domains[1][1][0]
        if best_score - second_score < 0.15:
            best_score = max(0.35, best_score - 0.15)

    return (best_domain, round(best_score, 2), best_matched)


def _suggest_type_for_domain(domain_id, title=""):
    """根据领域和标题推断任务类型（8 分类）"""
    # 先根据标题关键词精细判断
    if title:
        inferred = _infer_type_from_title(title)
        return inferred
    return DOMAIN_DEFAULT_TYPE.get(domain_id, "light_work")


# ============================================================
# 新增 API：领域识别
# ============================================================

@app.route("/api/plan/classify-domain", methods=["POST"])
def api_plan_classify_domain():
    """根据用户输入的标题，识别所属领域（domain）。

    Body: { title: "任务标题" }

    返回: {
        ok: true,
        domainId: "work",
        confidence: 0.85,
        reason: "...",
        suggested_type: "deep_work",
        suggested_minutes: 45
    }
    """
    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()

    if not title:
        return jsonify({"ok": False, "error": "标题不能为空"}), 400

    ai_available = bool(companion and getattr(companion, 'ai', None))

    # ===== 优先使用 AI 识别 =====
    if ai_available:
        try:
            system_prompt = f"""你是专业的任务分类助手。请根据用户输入的任务标题，判断它属于哪个领域，并给出置信度和理由。

【领域定义（6 选 1）】
1. work - 工作：与职业、工作相关的任务，如项目开发、会议、汇报、客户沟通等
2. study - 学习：学习、读书、考证、技能提升等
3. health - 健康：运动、健身、冥想、体检、饮食健康等
4. life - 生活：日常家务、购物、家庭事务、社交聚会等
5. interest - 兴趣：业余爱好、休闲娱乐类的自我提升，如摄影、画画、乐器、游戏等
6. other - 其他：无法归入以上类别的任务

【任务类型（8 选 1）】
deep_work / light_work / meeting / learning / exercise / rest / meal / routine

任务标题：{title}

请返回 JSON：
{{
  "domainId": "work",
  "confidence": 0.85,
  "reason": "判断理由（简短中文，说明为什么归到这个领域）",
  "suggested_type": "deep_work",
  "suggested_minutes": 45
}}

要求：
- confidence 范围 0-1，保留两位小数
- 只有非常明确的才能给 0.9 以上
- 不确定的给 0.5-0.7
- suggested_minutes 是预估完成时间，15-120 分钟
- 只返回 JSON，不要其他文字"""

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": "请识别这个任务的领域。"},
            ]
            reply = companion.ai.chat(messages, temperature=0.3, max_tokens=300)

            # 提取 JSON
            import re
            json_match = re.search(r'\{.*\}', reply, re.DOTALL)
            if json_match:
                result = json.loads(json_match.group())
                domain_id = result.get("domainId", "other")
                if domain_id not in DOMAINS:
                    domain_id = "other"
                confidence = float(result.get("confidence", 0.5))
                confidence = max(0.0, min(1.0, confidence))
                reason = result.get("reason", "")
                suggested_type = _normalize_type(result.get("suggested_type", ""))
                suggested_minutes = int(result.get("suggested_minutes", 45))
                suggested_minutes = max(5, min(240, suggested_minutes))

                return jsonify({
                    "ok": True,
                    "domainId": domain_id,
                    "domain": domain_id,
                    "confidence": round(confidence, 2),
                    "reason": reason,
                    "suggested_type": suggested_type,
                    "suggested_minutes": suggested_minutes,
                })
        except Exception:
            # AI 调用失败，fallback 到关键词匹配
            pass

    # ===== Fallback：关键词匹配 =====
    domain_id, confidence, matched = _classify_domain_by_keywords(title)
    suggested_type = _suggest_type_for_domain(domain_id, title)
    suggested_minutes = DOMAIN_DEFAULT_MINUTES.get(domain_id, 30)

    if matched:
        reason = f"标题中包含'{ '、'.join(matched[:3]) }'等{DOMAIN_LABELS.get(domain_id, '')}相关关键词"
    else:
        reason = "未匹配到明确关键词，暂归为其他"

    return jsonify({
        "ok": True,
        "domainId": domain_id,
        "domain": domain_id,
        "confidence": confidence,
        "reason": reason,
        "suggested_type": suggested_type,
        "suggested_minutes": suggested_minutes,
    })


# ============================================================
# 新增 API：必做事项创建
# ============================================================

@app.route("/api/plan/must-do/create", methods=["POST"])
def api_plan_must_do_create():
    """创建一个新的必做事项（保存为 Task，标记为今日必做）。

    Body: {
        title: "任务标题",
        domain_id: "work",
        estimated_minutes: 45,
        date: "2026-07-15"  // 可选，默认今天
    }

    返回: {
        ok: true,
        task: {
            id: "...",
            title: "...",
            type: "deep_work",
            domain_id: "work",
            estimated_minutes: 45,
            is_must_do: true,
            source: "daily_plan_manual"
        }
    }
    """
    from datetime import datetime

    data = request.get_json(silent=True) or {}
    title = (data.get("title") or "").strip()
    domain_id = data.get("domain_id", "other")
    estimated_minutes = data.get("estimated_minutes", 45)
    date_str = data.get("date") or datetime.now().strftime("%Y-%m-%d")

    if not title:
        return jsonify({"ok": False, "error": "任务标题不能为空"}), 400

    # 校验领域
    if domain_id not in DOMAINS:
        domain_id = "other"

    # 校验预估时长
    try:
        estimated_minutes = int(estimated_minutes)
        if estimated_minutes < 5:
            estimated_minutes = 5
        elif estimated_minutes > 480:
            estimated_minutes = 480
    except (ValueError, TypeError):
        estimated_minutes = 45

    # 根据领域 + 标题推断 8 分类 type
    task_type_8 = _suggest_type_for_domain(domain_id, title)

    # 数据库存储的 type 用旧 7 分类（向后兼容）
    # 8分类 → 7分类 映射：deep_work/light_work → work；meeting → social；
    # learning → study；exercise → exercise；rest → rest；meal → meal；routine → routine
    type_7_map = {
        "deep_work": "work",
        "light_work": "work",
        "meeting": "social",
        "learning": "study",
        "exercise": "exercise",
        "rest": "rest",
        "meal": "meal",
        "routine": "routine",
    }
    db_type = type_7_map.get(task_type_8, "work")

    db = companion.db if companion else Database()

    # 创建任务（用 priority="high" + channel 标记来表示必做事项）
    task = Task(
        title=title,
        type=db_type,
        priority="high",
        channel="daily_plan_must_do",  # 用 channel 标记必做来源
        planned_minutes=estimated_minutes,
        status="backlog",
        date=date_str,
        note=f"domain_id:{domain_id};type_8:{task_type_8};source:daily_plan_manual;is_must_do:true",
    )

    task_id = db.add_task(task)

    return jsonify({
        "ok": True,
        "task": {
            "id": task_id,
            "title": title,
            "type": task_type_8,
            "domain_id": domain_id,
            "estimated_minutes": estimated_minutes,
            "is_must_do": True,
            "source": "daily_plan_manual",
            "date": date_str,
        }
    })


# ============================================================
# 新增 API：上下文校验
# ============================================================

@app.route("/api/plan/validate-context", methods=["POST"])
def api_plan_validate_context():
    """校验规划上下文是否完整。

    Body: {
        date: "2026-07-15",
        day_end_time: 22,
        must_do_items: [...],
        fixed_events: [...],
        energy_level: "normal",
        planning_intensity: "balanced"
    }

    返回: {
        valid: true,
        errors: [],
        warnings: [...],
        missing_fields: [...],
        can_generate: true
    }
    """
    from datetime import datetime

    data = request.get_json(silent=True) or {}

    errors = []
    warnings = []
    missing_fields = []

    date_str = data.get("date", "")
    day_end_time = data.get("day_end_time", 22)
    must_do_items = data.get("must_do_items", []) or []
    fixed_events = data.get("fixed_events", []) or []
    energy_level = data.get("energy_level", "")
    planning_intensity = data.get("planning_intensity", "balanced")

    # 1. 校验日期
    if not date_str:
        errors.append("日期不能为空")
    else:
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            errors.append(f"日期格式无效: {date_str}，应为 YYYY-MM-DD")

    # 2. 校验结束时间
    try:
        end_time_val = float(day_end_time)
        if end_time_val < 0 or end_time_val > 24:
            errors.append(f"结束时间无效: {day_end_time}，应在 0-24 之间")
        elif end_time_val <= 6:
            warnings.append("结束时间较早，可用时间可能不足")
    except (ValueError, TypeError):
        errors.append(f"结束时间格式无效: {day_end_time}，应为数字")

    # 3. 可用时间 > 0（假设开始时间为 9:00）
    if not errors:
        try:
            available_hours = float(day_end_time) - 9.0
            if available_hours <= 0:
                errors.append("可用时间不足，结束时间应晚于 9:00")
        except (ValueError, TypeError):
            pass

    # 4. 必做事项校验
    must_do_missing_domain = 0
    must_do_missing_time = 0
    for item in must_do_items:
        if isinstance(item, dict):
            if not item.get("domain_id"):
                must_do_missing_domain += 1
            est = item.get("estimated_minutes")
            if est is None or est == 0:
                must_do_missing_time += 1

    if must_do_missing_domain > 0:
        warnings.append(f"{must_do_missing_domain} 个必做事项缺少领域分类")
    if must_do_missing_time > 0:
        warnings.append(f"{must_do_missing_time} 个必做事项缺少预计时长")

    # 5. 严重时间冲突检测（简单版：检查固定事件是否重叠）
    if fixed_events and len(fixed_events) > 1:
        # 按开始时间排序
        sorted_events = []
        for fe in fixed_events:
            if isinstance(fe, dict):
                st = fe.get("startTime") or fe.get("start")
                et = fe.get("endTime") or fe.get("end")
                if st is not None and et is not None:
                    sorted_events.append((float(st), float(et), fe.get("title", "")))
        sorted_events.sort(key=lambda x: x[0])
        for i in range(len(sorted_events) - 1):
            if sorted_events[i][1] > sorted_events[i + 1][0]:
                warnings.append(
                    f"固定事件 '{sorted_events[i][2]}' 与 "
                    f"'{sorted_events[i+1][2]}' 存在时间重叠"
                )
                break

    # 6. 精力状态
    if not energy_level or energy_level == "unknown":
        missing_fields.append("energy_level_confirmation")
        if not energy_level:
            warnings.append("未设置精力状态，方案将按一般状态生成")

    # 7. 必做事项为空
    if not must_do_items:
        warnings.append("没有设置必做事项，方案将根据一般情况生成")

    # 8. 强度参数校验
    if planning_intensity not in ("safe", "balanced", "sprint"):
        warnings.append(f"未知的规划强度: {planning_intensity}，将使用 balanced")

    # 判断是否可以生成方案
    can_generate = len(errors) == 0
    valid = len(errors) == 0

    return jsonify({
        "valid": valid,
        "errors": errors,
        "warnings": warnings,
        "missing_fields": missing_fields,
        "can_generate": can_generate,
    })


# ============================================================
# 新增：类型转换辅助函数（旧 7 分类 → 新 8 分类）
# ============================================================

def _convert_type_7_to_8(old_type, title=""):
    """将数据库中旧的 7 分类 type 转换为新 8 分类。

    映射规则：
    - work → light_work（不确定时归为轻量工作）
    - study → learning
    - exercise → exercise
    - rest → rest
    - meal → meal
    - routine → routine
    - social → meeting
    """
    # 如果有标题，先用关键词精细判断
    if title:
        refined = _infer_type_from_title(title)
        # 但要确保大类一致（比如 work 大类不应该变成 exercise）
        old_category_map = {
            "work": {"deep_work", "light_work", "meeting"},
            "study": {"learning"},
            "exercise": {"exercise"},
            "rest": {"rest"},
            "meal": {"meal"},
            "routine": {"routine"},
            "social": {"meeting"},
        }
        allowed = old_category_map.get(old_type, {"light_work"})
        if refined in allowed:
            return refined

    # 大类映射
    type_map = {
        "work": "light_work",
        "study": "learning",
        "exercise": "exercise",
        "rest": "rest",
        "meal": "meal",
        "routine": "routine",
        "social": "meeting",
    }
    return type_map.get(old_type, "light_work")


def _infer_domain_from_type_and_title(task_type, title=""):
    """根据任务类型（8分类）和标题推断领域（6分类）"""
    # 先根据标题关键词判断
    if title:
        domain_id, _, _ = _classify_domain_by_keywords(title)
        if domain_id != "other":
            return domain_id

    # 根据 type 粗略判断
    type_domain_map = {
        "deep_work": "work",
        "light_work": "work",
        "meeting": "work",
        "learning": "study",
        "exercise": "health",
        "rest": "health",
        "meal": "life",
        "routine": "life",
    }
    return type_domain_map.get(task_type, "other")


if __name__ == "__main__":
    try:
        ensure_port_available(9527)
        initialize_runtime(start_services=True)
        print("\n[伴伴] Web UI: http://127.0.0.1:9527\n")
        run_server(port=9527)
    except RuntimeError as exc:
        print(f"[伴伴] 启动失败：{exc}")
        raise SystemExit(1)
