# -*- coding: utf-8 -*-
"""
app.py
智能安检监控系统 - Flask 后端

将 YOLO 实时目标检测与前端 HTML 仪表盘打通：
  - /             渲染主界面（templates/index.html）
  - /video_feed    MJPEG 实时视频流（带 YOLO 检测框）
  - /api/stats     JSON 实时统计（检测/告警/通过率/通道状态）
  - /api/alerts    SSE 告警事件推送（检测到违禁品即时下发）
  - /api/detect    POST 单张图片检测（可选扩展）

启动：
    python app.py
    python app.py --source 0            # 第0路摄像头
    python app.py --source video.mp4    # 视频文件
    python app.py --mode force_sim      # 强制模拟模式（无需torch/摄像头）

默认 http://127.0.0.1:5000
"""

import argparse
import json
import os
import time
import threading

from flask import Flask, render_template, Response, jsonify, stream_with_context
from flask_cors import CORS

from yolo_detector import SecurityDetector, get_detector


def create_app(detector: SecurityDetector) -> Flask:
    app = Flask(
        __name__,
        template_folder="templates",
        static_folder=".",           # 静态资源就在项目根目录
        static_url_path="",
    )
    CORS(app)

    # 把检测器注入全局，便于路由内取用
    import yolo_detector as yd
    yd.DETECTOR = detector

    # --------------------------------------------------------------- #
    #  页面路由
    # --------------------------------------------------------------- #
    @app.route("/")
    def index():
        return render_template("index.html")

    # --------------------------------------------------------------- #
    #  MJPEG 视频流
    # --------------------------------------------------------------- #
    @app.route("/video_feed")
    def video_feed():
        det = get_detector()
        return Response(
            det.stream_jpeg(),
            mimetype="multipart/x-mixed-replace; boundary=frame",
        )

    # --------------------------------------------------------------- #
    #  实时统计 JSON
    # --------------------------------------------------------------- #
    @app.route("/api/stats")
    def api_stats():
        det = get_detector()
        dto = det.get_snapshot_dto()
        # 计算派生指标
        scanned = dto["stats"]["total_scanned"]
        passed = dto["stats"]["passed"]
        alerts = dto["stats"]["total_alerts"]
        intercepted = dto["stats"]["intercepted"]
        pass_rate = (passed / scanned * 100) if scanned > 0 else 100.0

        return jsonify({
            "mode": dto["mode"],
            "fps": dto["stats"]["fps"],
            "queue": dto["stats"]["queue"],
            "summary": {
                "total_scanned": scanned,
                "passed": passed,
                "intercepted": intercepted,
                "total_alerts": alerts,
                "pass_rate": round(pass_rate, 1),
            },
            "current_detections": dto["detections"],
            "current_alert_count": dto["alert_count"],
            "channels": dto["channels"],
            "timestamp": int(time.time()),
        })

    # --------------------------------------------------------------- #
    #  SSE 告警推送
    # --------------------------------------------------------------- #
    @app.route("/api/alerts")
    def api_alerts():
        det = get_detector()

        def event_stream():
            # 首次连接先推一条 hello，便于前端确认链路
            yield "event: hello\ndata: {\"msg\":\"SSE connected\"}\n\n"
            while True:
                alerts = det.pop_alerts()
                if alerts:
                    for a in alerts:
                        payload = json.dumps(a, ensure_ascii=False)
                        yield f"event: alert\ndata: {payload}\n\n"
                time.sleep(0.5)

        return Response(
            stream_with_context(event_stream()),
            mimetype="text/event-stream",
            headers={
                "Cache-Control": "no-cache",
                "X-Accel-Buffering": "no",
                "Connection": "keep-alive",
            },
        )

    # --------------------------------------------------------------- #
    #  健康检查
    # --------------------------------------------------------------- #
    @app.route("/api/health")
    def health():
        det = get_detector()
        return jsonify({
            "status": "ok",
            "mode": "simulation" if det.simulation else "live",
            "model": det.model_name,
            "source": det.source,
        })

    return app


def main():
    parser = argparse.ArgumentParser(description="智能安检监控系统后端")
    parser.add_argument("--model", default="yolo11n.pt",
                        help="YOLO 权重文件名 (默认 yolo11n.pt，首次自动下载)")
    parser.add_argument("--source", default="0",
                        help="视频源: 摄像头序号(0) 或 视频文件路径")
    parser.add_argument("--conf", type=float, default=0.4,
                        help="检测置信度阈值 (默认 0.4)")
    parser.add_argument("--mode", default="auto",
                        choices=["auto", "force_sim"],
                        help="auto=真实优先/失败降级; force_sim=强制模拟")
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=5000)
    args = parser.parse_args()

    # source 数字化
    source = args.source
    if source.isdigit():
        source = int(source)

    print("=" * 60)
    print("  SecureGate Pro - 智能安检监控系统")
    print("=" * 60)
    print(f"  模型    : {args.model}")
    print(f"  视频源  : {source}")
    print(f"  置信度  : {args.conf}")
    print(f"  模式    : {args.mode}")
    print("-" * 60)

    detector = SecurityDetector(
        model_name=args.model,
        source=source,
        conf=args.conf,
        mode=args.mode,
    )

    app = create_app(detector)

    print("-" * 60)
    print(f"  服务地址 : http://127.0.0.1:{args.port}")
    print(f"  推理模式 : {'模拟' if detector.simulation else '真实 YOLO'}")
    print("=" * 60)
    print("按 Ctrl+C 退出\n")

    # threaded=True 让 MJPEG 流与其它 API 并发
    app.run(host=args.host, port=args.port,
            threaded=True, debug=False, use_reloader=False)


if __name__ == "__main__":
    main()
