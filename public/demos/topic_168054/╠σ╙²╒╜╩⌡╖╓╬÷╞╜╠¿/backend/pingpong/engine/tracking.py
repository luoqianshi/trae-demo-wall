"""多目标跟踪模块：分别跟踪球员和球"""
from dataclasses import dataclass
from typing import List
import numpy as np

try:
    from boxmot import BoTSort
    BOXMOT_AVAILABLE = True
except ImportError:
    BOXMOT_AVAILABLE = False

from engine.detection import Detection


@dataclass
class TrackedObject:
    """跟踪结果数据类"""
    bbox: tuple  # (x1, y1, x2, y2)
    track_id: int
    class_name: str  # "player" 或 "ball"
    confidence: float = 1.0
    ball_pixel_size: float = 0.0  # 球的像素直径（仅球有值）


class PingPongTracker:
    """乒乓球多目标跟踪器"""

    def __init__(self):
        """初始化跟踪器

        使用 BoxMOT 的 BoT-SORT 进行跟踪；
        如果 BoxMOT 不可用，回退到简易质心跟踪
        """
        if BOXMOT_AVAILABLE:
            self.player_tracker = BoTSort()
            self.ball_tracker = BoTSort()
        else:
            self.player_tracker = None
            self.ball_tracker = None
            self._next_player_id = 1
            self._next_ball_id = 1
            self._player_tracks = {}  # track_id -> last_bbox
            self._ball_tracks = {}

    def update(self, detections: List[Detection], frame: np.ndarray) -> List[TrackedObject]:
        """更新跟踪器并返回当前帧的跟踪结果

        分别对球员和球进行跟踪

        Args:
            detections: 当前帧的检测结果
            frame: 当前视频帧

        Returns:
            跟踪对象列表
        """
        # 按类别分组检测结果
        player_dets = [d for d in detections if d.class_name == "player"]
        ball_dets = [d for d in detections if d.class_name == "ball"]
        # table 不参与跟踪

        if self.player_tracker is not None:
            tracked_players = self._update_with_boxmot(self.player_tracker, player_dets, frame, "player")
            tracked_balls = self._update_with_boxmot(self.ball_tracker, ball_dets, frame, "ball")
        else:
            tracked_players = self._update_simple(player_dets, "player")
            tracked_balls = self._update_simple(ball_dets, "ball")

        return tracked_players + tracked_balls

    def _update_with_boxmot(self, tracker, detections: List[Detection], frame: np.ndarray, class_name: str) -> List[TrackedObject]:
        """使用 BoxMOT 进行跟踪"""
        if not detections:
            empty_dets = np.empty((0, 6))
            tracker.update(empty_dets, frame)
            return []

        # 转换为 BoxMOT 格式：[x1, y1, x2, y2, conf, class_id]
        det_array = []
        for det in detections:
            x1, y1, x2, y2 = det.bbox
            class_id = 0  # 单类跟踪
            det_array.append([x1, y1, x2, y2, det.confidence, class_id])

        dets = np.array(det_array)
        tracks = tracker.update(dets, frame)

        # tracks 格式：[x1, y1, x2, y2, track_id, class_id, conf]
        result = []
        for track in tracks:
            x1, y1, x2, y2, track_id, class_id, conf = track
            # 查找对应的检测以获取 ball_pixel_size
            ball_pixel_size = 0.0
            if class_name == "ball":
                best_match = None
                best_iou = 0
                for det in detections:
                    iou = self._calculate_iou((float(x1), float(y1), float(x2), float(y2)), det.bbox)
                    if iou > best_iou:
                        best_iou = iou
                        best_match = det
                if best_match and best_match.ball_pixel_size is not None:
                    ball_pixel_size = best_match.ball_pixel_size

            result.append(
                TrackedObject(
                    bbox=(float(x1), float(y1), float(x2), float(y2)),
                    track_id=int(track_id),
                    class_name=class_name,
                    confidence=float(conf),
                    ball_pixel_size=ball_pixel_size,
                )
            )

        return result

    def _update_simple(self, detections: List[Detection], class_name: str) -> List[TrackedObject]:
        """简易质心跟踪（BoxMOT 不可用时的后备方案）"""
        if class_name == "player":
            tracks_dict = self._player_tracks
            next_id = self._next_player_id
        else:
            tracks_dict = self._ball_tracks
            next_id = self._next_ball_id

        result = []
        used_track_ids = set()

        for det in detections:
            x1, y1, x2, y2 = det.bbox
            cx = (x1 + x2) / 2
            cy = (y1 + y2) / 2

            # 查找最近的现有轨迹
            best_id = None
            best_dist = float("inf")
            for track_id, last_bbox in tracks_dict.items():
                if track_id in used_track_ids:
                    continue
                lx1, ly1, lx2, ly2 = last_bbox
                lcx = (lx1 + lx2) / 2
                lcy = (ly1 + ly2) / 2
                dist = ((cx - lcx) ** 2 + (cy - lcy) ** 2) ** 0.5
                # 球的匹配距离更大（球速快）
                max_dist = 150 if class_name == "ball" else 80
                if dist < best_dist and dist < max_dist:
                    best_dist = dist
                    best_id = track_id

            if best_id is None:
                best_id = next_id
                next_id += 1

            tracks_dict[best_id] = det.bbox
            used_track_ids.add(best_id)

            result.append(
                TrackedObject(
                    bbox=det.bbox,
                    track_id=best_id,
                    class_name=class_name,
                    confidence=det.confidence,
                    ball_pixel_size=det.ball_pixel_size or 0.0,
                )
            )

        # 更新 ID 计数器
        if class_name == "player":
            self._next_player_id = next_id
        else:
            self._next_ball_id = next_id

        return result

    def _calculate_iou(self, box1: tuple, box2: tuple) -> float:
        """计算两个边界框的 IoU"""
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])

        if x2 < x1 or y2 < y1:
            return 0.0

        intersection = (x2 - x1) * (y2 - y1)
        area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
        area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
        union = area1 + area2 - intersection

        return intersection / union if union > 0 else 0.0

    def reset(self):
        """重置跟踪器"""
        if self.player_tracker is not None:
            self.player_tracker = BoTSort()
            self.ball_tracker = BoTSort()
        else:
            self._player_tracks = {}
            self._ball_tracks = {}
            self._next_player_id = 1
            self._next_ball_id = 1
