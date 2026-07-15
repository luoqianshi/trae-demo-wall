"""多目标跟踪模块：使用 BoxMOT 的 BoT-SORT 给球员分配唯一 ID"""
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


class MultiObjectTracker:
    """多目标跟踪器，基于 BoxMOT 的 BoT-SORT"""

    def __init__(self):
        """初始化 BoT-SORT 跟踪器"""
        if BOXMOT_AVAILABLE:
            # 使用默认参数创建 BoT-SORT 跟踪器
            self.tracker = BoTSort()
        else:
            # 如果 boxmot 不可用，使用简易跟踪器作为后备
            self.tracker = None
            self._next_id = 1
            self._tracks = {}  # track_id -> last_bbox

    def update(self, detections: List[Detection], frame: np.ndarray) -> List[TrackedObject]:
        """更新跟踪器并返回当前帧的跟踪结果

        Args:
            detections: 当前帧的检测结果
            frame: 当前视频帧

        Returns:
            跟踪对象列表
        """
        if not detections:
            if self.tracker is not None:
                # 即使没有检测，也要更新跟踪器以处理丢失的目标
                empty_dets = np.empty((0, 6))
                self.tracker.update(empty_dets, frame)
            return []

        if self.tracker is not None:
            return self._update_with_boxmot(detections, frame)
        else:
            return self._update_simple(detections, frame)

    def _update_with_boxmot(self, detections: List[Detection], frame: np.ndarray) -> List[TrackedObject]:
        """使用 BoxMOT 进行跟踪"""
        # 将检测结果转换为 BoxMOT 需要的格式：[x1, y1, x2, y2, conf, class_id]
        det_array = []
        for det in detections:
            x1, y1, x2, y2 = det.bbox
            # player -> class 0, ball -> class 1
            class_id = 0 if det.class_name == "player" else 1
            det_array.append([x1, y1, x2, y2, det.confidence, class_id])

        dets = np.array(det_array)
        tracks = self.tracker.update(dets, frame)

        # tracks 格式：[x1, y1, x2, y2, track_id, class_id, conf]
        result = []
        for track in tracks:
            x1, y1, x2, y2, track_id, class_id, conf = track
            class_name = "player" if int(class_id) == 0 else "ball"
            result.append(
                TrackedObject(
                    bbox=(float(x1), float(y1), float(x2), float(y2)),
                    track_id=int(track_id),
                    class_name=class_name,
                    confidence=float(conf),
                )
            )

        return result

    def _update_simple(self, detections: List[Detection], frame: np.ndarray) -> List[TrackedObject]:
        """简易跟踪器（基于质心匹配的后备方案，当 boxmot 不可用时使用）"""
        result = []
        used_track_ids = set()

        for det in detections:
            x1, y1, x2, y2 = det.bbox
            cx = (x1 + x2) / 2
            cy = (y1 + y2) / 2

            # 查找最近的现有轨迹
            best_id = None
            best_dist = float("inf")
            for track_id, last_bbox in self._tracks.items():
                if track_id in used_track_ids:
                    continue
                lx1, ly1, lx2, ly2 = last_bbox
                lcx = (lx1 + lx2) / 2
                lcy = (ly1 + ly2) / 2
                dist = ((cx - lcx) ** 2 + (cy - lcy) ** 2) ** 0.5
                if dist < best_dist and dist < 100:  # 最大匹配距离
                    best_dist = dist
                    best_id = track_id

            if best_id is None:
                best_id = self._next_id
                self._next_id += 1

            self._tracks[best_id] = det.bbox
            used_track_ids.add(best_id)

            result.append(
                TrackedObject(
                    bbox=det.bbox,
                    track_id=best_id,
                    class_name=det.class_name,
                    confidence=det.confidence,
                )
            )

        return result

    def reset(self):
        """重置跟踪器"""
        if self.tracker is not None:
            self.tracker = BoTSort()
        else:
            self._tracks = {}
            self._next_id = 1
