# -*- coding: utf-8 -*-
"""
yolo_detector.py
智能安检 YOLO 检测器封装

职责：
1. 加载 YOLO 模型（优先 yolo11n.pt，首次使用会自动下载）
2. 接入视频源（摄像头 / 视频文件）
3. 逐帧推理，返回带检测框的画面与结构化检测结果
4. 当 torch / ultralytics 不可用，或视频源无法打开时，自动降级为「模拟模式」，
   生成合成安检画面与模拟检测数据，保证前端演示效果不中断

安全告警类别取自 COCO 80 类中的违禁/可疑物品（刀具、剪刀、瓶装液体等）。
"""

import cv2
import numpy as np
import time
import threading
import random


# COCO 类别名称（YOLO 默认输出索引对应此列表）
COCO_NAMES = [
    "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train",
    "truck", "boat", "traffic light", "fire hydrant", "stop sign",
    "parking meter", "bench", "bird", "cat", "dog", "horse", "sheep",
    "cow", "elephant", "bear", "zebra", "giraffe", "backpack", "umbrella",
    "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard",
    "sports ball", "kite", "baseball bat", "baseball glove", "skateboard",
    "surfboard", "tennis racket", "bottle", "wine glass", "cup", "fork",
    "knife", "spoon", "bowl", "banana", "apple", "sandwich", "orange",
    "broccoli", "carrot", "hot dog", "pizza", "donut", "cake", "chair",
    "couch", "potted plant", "bed", "dining table", "toilet", "tv",
    "laptop", "mouse", "remote", "keyboard", "cell phone", "microwave",
    "oven", "toaster", "sink", "refrigerator", "book", "clock", "vase",
    "scissors", "teddy bear", "hair drier", "toothbrush",
]

# 安检场景的告警类别（检测到即视为违禁/可疑物品）
ALERT_CLASS_NAMES = {
    "knife": "刀具",
    "scissors": "剪刀",
    "bottle": "瓶装液体",
    "wine glass": "玻璃容器",
    "fork": "餐具(叉)",
    "baseball bat": "棍棒物",
    "sports ball": "球状物",
    "backpack": "可疑背包",
    "handbag": "可疑手提包",
    "suitcase": "行李箱",
}

# 告警类别对应的渲染颜色 (B, G, R)
ALERT_COLORS = {
    "knife": (0, 0, 255),        # 红
    "scissors": (0, 102, 255),   # 橙
    "bottle": (255, 102, 0),     # 蓝青
    "wine glass": (255, 102, 0),
    "fork": (0, 165, 255),       # 橙黄
    "baseball bat": (0, 0, 255),
    "sports ball": (0, 215, 255),
    "backpack": (128, 0, 128),
    "handbag": (128, 0, 128),
    "suitcase": (128, 0, 128),
}

# 普通通过类别的渲染色
NORMAL_COLOR = (0, 240, 255)   # 青色（与前端主题一致）
PERSON_COLOR = (34, 197, 94)    # 绿色


class Detection:
    """单条检测结果"""

    __slots__ = ("cls_name", "confidence", "box", "is_alert", "label_cn")

    def __init__(self, cls_name, confidence, box, is_alert, label_cn):
        self.cls_name = cls_name
        self.confidence = confidence
        self.box = box  # (x1, y1, x2, y2)
        self.is_alert = is_alert
        self.label_cn = label_cn

    def to_dict(self):
        return {
            "class": self.cls_name,
            "label": self.label_cn,
            "confidence": round(self.confidence, 3),
            "box": [int(v) for v in self.box],
            "is_alert": self.is_alert,
        }


class SecurityDetector:
    """
    安检 YOLO 检测器（线程安全的单例式封装）

    用法：
        det = SecurityDetector(model_name="yolo11n.pt", source=0)
        for frame, detections in det.stream():
            ...

    模式：
        - auto(默认): 尝试真实 YOLO + 视频源，失败自动降级 simulation
        - force_sim : 强制模拟模式（不依赖 torch/摄像头）
    """

    _instance = None
    _instance_lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            with cls._instance_lock:
                if cls._instance is None:
                    cls._instance = super().__new__(cls)
        return cls._instance

    def __init__(self, model_name="yolo11n.pt", source=0, conf=0.4,
                 mode="auto", target_size=640):
        # 单例只初始化一次
        if getattr(self, "_initialized", False):
            return
        self._initialized = True

        self.model_name = model_name
        self.source = source
        self.conf = conf
        self.target_size = target_size
        self.mode = mode

        self.model = None
        self.cap = None
        self.device = "cpu"
        self.simulation = False
        self._frame_lock = threading.Lock()
        self._last_frame = None        # 最近一帧带框画面（供 /api/snapshot 使用）
        self._last_detections = []      # 最近一帧检测结果
        self._last_alerts = []          # 最近一帧的告警子集

        # 累计统计
        self.stats = {
            "total_scanned": 0,   # 累计检测帧数（近似「人次」）
            "total_alerts": 0,   # 累计告警事件数
            "passed": 0,         # 累计放行数
            "intercepted": 0,    # 累计拦截数
            "queue": 0,          # 当前排队（模拟波动）
            "fps": 0.0,
        }

        # 告警事件队列（供 SSE 推送消费）
        self._alert_queue = []
        self._alert_queue_lock = threading.Lock()

        # 模拟模式内部状态
        self._sim_t0 = time.time()
        self._sim_frame_idx = 0
        self._last_next_t = 0.0   # 上次 next_frame 调用时间（用于估算真实 fps）

        self._connect()

    # ------------------------------------------------------------------ #
    #  连接 / 初始化
    # ------------------------------------------------------------------ #
    def _connect(self):
        # 1) 尝试加载 YOLO
        if self.mode != "force_sim":
            try:
                from ultralytics import YOLO
                import torch
                self.model = YOLO(self.model_name)
                self.device = "cuda" if torch.cuda.is_available() else "cpu"
                print(f"[YOLO] 模型加载成功: {self.model_name} (device={self.device})")
            except Exception as e:
                print(f"[YOLO] 加载失败，将使用模拟模式: {e}")
                self.model = None

        # 2) 尝试打开视频源（仅当模型可用时）
        if self.model is not None and self.mode != "force_sim":
            self.cap = cv2.VideoCapture(self.source)
            if self.cap.isOpened():
                print(f"[视频源] 已打开: {self.source}")
            else:
                print(f"[视频源] 无法打开 {self.source}，回退模拟模式")
                self.cap = None

        # 3) 最终判定是否模拟
        self.simulation = (self.model is None) or (self.cap is None)

        if self.simulation:
            print("[模式] 启用模拟推理（生成合成安检画面 + 模拟检测数据）")
        else:
            print("[模式] 启用真实 YOLO 推理")

    # ------------------------------------------------------------------ #
    #  帧生成
    # ------------------------------------------------------------------ #
    def _read_real_frame(self):
        """读取一帧真实视频，失败则循环重置"""
        ret, frame = self.cap.read()
        if not ret:
            # 视频文件播放完毕则重头开始
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            ret, frame = self.cap.read()
            if not ret:
                return None
        return frame

    def _gen_simulation_frame(self):
        """
        生成一帧合成「X光安检」风格画面 + 模拟检测框
        保证在没有摄像头/模型时界面依然鲜活
        """
        W, H = 960, 540
        frame = np.full((H, W, 3), 12, dtype=np.uint8)  # 深色底

        # 背景网格
        for x in range(0, W, 40):
            cv2.line(frame, (x, 0), (x, H), (20, 30, 45), 1)
        for y in range(0, H, 40):
            cv2.line(frame, (0, y), (W, y), (20, 30, 45), 1)

        t = time.time() - self._sim_t0
        idx = self._sim_frame_idx

        # 扫描线
        scan_y = int((t * 180) % H)
        cv2.line(frame, (0, scan_y), (W, scan_y), (0, 240, 255), 2)
        cv2.line(frame, (0, scan_y + 1), (W, scan_y + 1),
                 (0, 240, 255, 80), 1)

        # 四角标记
        for (cx, cy) in [(20, 20), (W - 20, 20), (20, H - 20), (W - 20, H - 20)]:
            cv2.drawMarker(frame, (cx, cy), (0, 240, 255),
                           cv2.MARKER_CROSS, 16, 1)

        # 模拟检测目标（移动的框）
        sim_targets = []
        # 刀具（告警，约 18% 帧出现，贴近真实拦截率）
        if idx % 80 < 12:
            x1 = 200 + int(80 * np.sin(t * 0.8))
            y1 = 180 + int(40 * np.cos(t * 0.6))
            sim_targets.append(("knife", 0.88, (x1, y1, x1 + 90, y1 + 40), True, "刀具"))
        # 行李箱（告警，约 14% 帧出现）
        if idx % 100 < 12:
            x1 = 500 + int(60 * np.sin(t * 0.5))
            y1 = 300 + int(30 * np.cos(t * 0.4))
            sim_targets.append(("suitcase", 0.76, (x1, y1, x1 + 110, y1 + 80), True, "行李箱"))
        # 瓶装液体（告警，约 16% 帧出现）
        if 40 < idx % 150 < 65:
            x1 = 720 + int(50 * np.cos(t * 0.7))
            y1 = 150 + int(30 * np.sin(t * 0.9))
            sim_targets.append(("bottle", 0.82, (x1, y1, x1 + 50, y1 + 110), True, "瓶装液体"))
        # 普通物品（放行，每帧都有）
        x1 = 350 + int(70 * np.sin(t * 0.3))
        y1 = 260 + int(50 * np.cos(t * 0.35))
        sim_targets.append(("laptop", 0.91, (x1, y1, x1 + 100, y1 + 70), False, "笔记本电脑"))
        # 人（放行，每帧都有）
        x1 = 80 + int(40 * np.sin(t * 0.2))
        y1 = 100 + int(20 * np.cos(t * 0.25))
        sim_targets.append(("person", 0.95, (x1, y1, x1 + 60, y1 + 140), False, "人员"))

        # 画框 + 标签
        for cls_name, conf, box, is_alert, label_cn in sim_targets:
            x1, y1, x2, y2 = [int(v) for v in box]
            color = ALERT_COLORS.get(cls_name, NORMAL_COLOR) if is_alert else (
                PERSON_COLOR if cls_name == "person" else NORMAL_COLOR)
            thickness = 3 if is_alert else 2
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)

            # 角标式框
            L = 14
            for (px, py, ax, ay) in [
                (x1, y1, 1, 1), (x2, y1, -1, 1),
                (x1, y2, 1, -1), (x2, y2, -1, -1)]:
                cv2.line(frame, (px, py), (px + ax * L, py), color, 2)
                cv2.line(frame, (px, py), (px, py + ay * L), color, 2)

            label = f"{label_cn} {conf:.2f}"
            (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
            ly = y1 - 6 if y1 - 6 > th else y1 + th + 6
            cv2.rectangle(frame, (x1, ly - th - 4), (x1 + tw + 8, ly + 2),
                          color, -1)
            cv2.putText(frame, label, (x1 + 4, ly),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5,
                        (10, 14, 26), 1, cv2.LINE_AA)

        # HUD 文字
        hud_lines = [
            f"SIM MODE  |  FRAME {idx}",
            f"TIME {t:6.1f}s",
        ]
        for i, line in enumerate(hud_lines):
            cv2.putText(frame, line, (20, 30 + i * 22),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.55,
                        (0, 240, 255), 1, cv2.LINE_AA)

        detections = [
            Detection(c, conf, box, alert, lbl)
            for (c, conf, box, alert, lbl) in sim_targets
        ]
        return frame, detections

    # ------------------------------------------------------------------ #
    #  推理
    # ------------------------------------------------------------------ #
    def _detect_real(self, frame):
        """真实 YOLO 推理并绘制检测框"""
        results = self.model.predict(
            frame, conf=self.conf, imgsz=self.target_size,
            device=self.device, verbose=False
        )
        res = results[0]
        detections = []
        annotated = frame.copy()

        if res.boxes is not None and len(res.boxes) > 0:
            for box in res.boxes:
                cls_idx = int(box.cls[0].item())
                conf = float(box.conf[0].item())
                cls_name = COCO_NAMES[cls_idx] if 0 <= cls_idx < len(COCO_NAMES) else "unknown"
                x1, y1, x2, y2 = [float(v) for v in box.xyxy[0].tolist()]
                is_alert = cls_name in ALERT_CLASS_NAMES
                label_cn = ALERT_CLASS_NAMES.get(cls_name, cls_name)
                det = Detection(cls_name, conf, (x1, y1, x2, y2),
                                is_alert, label_cn)
                detections.append(det)

                color = (ALERT_COLORS.get(cls_name, (0, 0, 255))
                         if is_alert else
                         (PERSON_COLOR if cls_name == "person" else NORMAL_COLOR))
                thickness = 3 if is_alert else 2
                cv2.rectangle(annotated, (int(x1), int(y1)),
                              (int(x2), int(y2)), color, thickness)

                label = f"{label_cn} {conf:.2f}"
                (tw, th), _ = cv2.getTextSize(
                    label, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
                ly = int(y1) - 8 if int(y1) - 8 > th else int(y1) + th + 8
                cv2.rectangle(annotated,
                              (int(x1), ly - th - 6),
                              (int(x1) + tw + 10, ly + 4),
                              color, -1)
                cv2.putText(annotated, label, (int(x1) + 5, ly),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.6,
                            (10, 14, 26), 2, cv2.LINE_AA)

        return annotated, detections

    # ------------------------------------------------------------------ #
    #  统计更新
    # ------------------------------------------------------------------ #
    def _update_stats(self, detections, interval):
        alerts = [d for d in detections if d.is_alert]
        self.stats["total_scanned"] += 1
        if alerts:
            self.stats["total_alerts"] += 1
            self.stats["intercepted"] += 1
            # 把告警事件放入队列（供 SSE 消费），去重避免刷屏
            for a in alerts:
                self._push_alert(a)
        else:
            self.stats["passed"] += 1

        # 排队人数模拟波动（真实模式也叠加一点随机，贴近实际）
        q = 18 + int(8 * np.sin(time.time() * 0.1)) + random.randint(-2, 2)
        self.stats["queue"] = max(0, q)

        # fps 用两次调用的真实间隔估算（模拟模式固定 30，更合理）
        if self.simulation:
            self.stats["fps"] = 30.0
        elif interval > 0:
            instant_fps = 1.0 / interval
            self.stats["fps"] = round(
                (self.stats["fps"] or instant_fps) * 0.8 + instant_fps * 0.2, 1)

    def _push_alert(self, det):
        """把一条告警事件塞入队列（供 SSE 推送）"""
        event = {
            "ts": time.time(),
            "class": det.cls_name,
            "label": det.label_cn,
            "confidence": round(det.confidence, 3),
            "box": [int(v) for v in det.box],
            "level": "critical" if det.cls_name in ("knife", "scissors",
                                                    "baseball bat") else "warning",
        }
        with self._alert_queue_lock:
            self._alert_queue.append(event)
            # 控制队列长度
            if len(self._alert_queue) > 200:
                self._alert_queue = self._alert_queue[-100:]

    def pop_alerts(self):
        """取出并清空告警队列（供 SSE 端点调用）"""
        with self._alert_queue_lock:
            alerts = self._alert_queue[:]
            self._alert_queue.clear()
        return alerts

    # ------------------------------------------------------------------ #
    #  对外接口
    # ------------------------------------------------------------------ #
    def next_frame(self):
        """
        读取并推理下一帧

        返回: (frame_bgr, detections_list)
            frame_bgr   : 带检测框的 BGR 画面（用于 MJPEG 编码）
            detections  : List[Detection]
        """
        now = time.time()
        interval = now - self._last_next_t if self._last_next_t > 0 else 0.0
        self._last_next_t = now
        t0 = now
        with self._frame_lock:
            if self.simulation:
                frame, detections = self._gen_simulation_frame()
                # 模拟一点推理耗时
                time.sleep(0.02)
            else:
                frame = self._read_real_frame()
                if frame is None:
                    # 视频彻底读不到，临时回退模拟
                    frame, detections = self._gen_simulation_frame()
                else:
                    frame, detections = self._detect_real(frame)

            self._last_frame = frame
            self._last_detections = detections
            self._last_alerts = [d for d in detections if d.is_alert]
            self._sim_frame_idx += 1
            self._update_stats(detections, interval)

        return frame, detections

    def stream_jpeg(self):
        """
        生成器：持续产出 MJPEG 边界帧（用于 /video_feed）

        每帧间隔约 33ms（~30fps）
        """
        while True:
            frame, _ = self.next_frame()
            ret, buffer = cv2.imencode(
                ".jpg", frame,
                [int(cv2.IMWRITE_JPEG_QUALITY), 82])
            if not ret:
                continue
            frame_bytes = buffer.tobytes()
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" +
                   frame_bytes + b"\r\n")
            time.sleep(0.033)

    def get_snapshot_dto(self):
        """
        返回当前快照的 DTO（供 /api/stats 等 JSON 接口）
        """
        dets = [d.to_dict() for d in self._last_detections] if self._last_detections else []
        return {
            "mode": "simulation" if self.simulation else "live",
            "stats": dict(self.stats),
            "detections": dets,
            "alert_count": len([d for d in (self._last_detections or []) if d.is_alert]),
            "channels": self._channel_status(),
        }

    def _channel_status(self):
        """模拟安检通道状态（A-E）"""
        base = [
            ("A通道 - 入口大厅", "X-RAY + MMW", 847, "online"),
            ("B通道 - 行李检查", "X-RAY DUAL", 723, "online"),
            ("C通道 - VIP通道", "MMW + AI", 312, "standby"),
            ("D通道 - 货运安检", "CT SCAN", 198, "online"),
            ("E通道 - 临时关闭", "OFFLINE", 0, "offline"),
        ]
        out = []
        for name, equip, passed, status in base:
            # 在线通道的通过数随时间增长
            live_passed = passed + (
                int(self.stats["total_scanned"] * 0.3)
                if status == "online" else 0
            )
            out.append({
                "name": name, "equipment": equip,
                "passed": live_passed, "status": status,
            })
        return out


# 全局单例（懒加载，由 app.py 创建后赋值）
DETECTOR: SecurityDetector = None


def get_detector():
    return DETECTOR
