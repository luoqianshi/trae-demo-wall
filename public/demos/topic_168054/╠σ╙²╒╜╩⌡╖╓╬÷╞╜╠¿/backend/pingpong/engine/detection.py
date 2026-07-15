"""乒乓球检测模块：使用 YOLOv8 检测球员和球，用颜色+轮廓检测球桌"""
from dataclasses import dataclass, field
from typing import List, Optional
import numpy as np

from config import YOLO_MODEL_PATH, DEVICE


@dataclass
class Detection:
    """检测结果数据类"""
    bbox: tuple  # (x1, y1, x2, y2)
    confidence: float
    class_name: str  # "player", "ball", "table", "net", "paddle"
    ball_pixel_size: Optional[float] = None  # 球的像素直径（仅球检测时有值）


class PingPongDetector:
    """乒乓球检测器"""

    # COCO 数据集中 person 的类别 ID
    PERSON_CLASS_ID = 0
    # COCO 数据集中 sports ball 的类别 ID
    SPORTS_BALL_CLASS_ID = 32

    def __init__(self, model_path: str = YOLO_MODEL_PATH):
        """加载 YOLOv8 模型"""
        from ultralytics import YOLO
        self.model = YOLO(model_path)
        self.device = DEVICE

    def detect(self, frame: np.ndarray, conf_threshold: float = 0.3) -> List[Detection]:
        """检测帧中的所有目标：球员、球、球桌

        Args:
            frame: 视频帧（BGR 格式）
            conf_threshold: 置信度阈值

        Returns:
            检测结果列表
        """
        # 使用 YOLO 检测 person 和 sports ball
        player_detections = self._detect_persons(frame, conf_threshold)
        ball_detections = self._detect_balls(frame, conf_threshold)
        table_detections = self._detect_table(frame)

        return player_detections + ball_detections + table_detections

    def _detect_persons(self, frame: np.ndarray, conf_threshold: float) -> List[Detection]:
        """检测球员（COCO person 类别）"""
        results = self.model.predict(
            frame,
            conf=conf_threshold,
            classes=[self.PERSON_CLASS_ID],
            device=self.device,
            verbose=False,
        )

        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                confidence = float(box.conf[0].cpu().numpy())
                detections.append(
                    Detection(
                        bbox=(float(x1), float(y1), float(x2), float(y2)),
                        confidence=confidence,
                        class_name="player",
                    )
                )

        return detections

    def _detect_balls(self, frame: np.ndarray, conf_threshold: float) -> List[Detection]:
        """检测乒乓球

        优先使用 YOLO 的 sports ball 类别检测；
        如果检测不到，回退到颜色+轮廓检测（白色/橙色小球）
        """
        import cv2

        detections = []

        # 方法1：YOLO 检测 sports ball
        results = self.model.predict(
            frame,
            conf=conf_threshold,
            classes=[self.SPORTS_BALL_CLASS_ID],
            device=self.device,
            verbose=False,
        )

        for result in results:
            boxes = result.boxes
            for box in boxes:
                x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                confidence = float(box.conf[0].cpu().numpy())
                # 计算球的像素直径（取边界框的较小边）
                width = float(x2 - x1)
                height = float(y2 - y1)
                ball_pixel_size = min(width, height)
                detections.append(
                    Detection(
                        bbox=(float(x1), float(y1), float(x2), float(y2)),
                        confidence=confidence,
                        class_name="ball",
                        ball_pixel_size=ball_pixel_size,
                    )
                )

        # 方法2：如果 YOLO 没检测到球，用颜色+轮廓回退检测
        if not detections:
            detections = self._detect_ball_by_color(frame)

        return detections

    def _detect_ball_by_color(self, frame: np.ndarray) -> List[Detection]:
        """通过颜色和轮廓检测乒乓球（回退方案）

        乒乓球通常为白色或橙色，体积小，接近圆形
        """
        import cv2

        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # 白色乒乓球的 HSV 范围
        lower_white = np.array([0, 0, 180])
        upper_white = np.array([180, 50, 255])
        mask_white = cv2.inRange(hsv, lower_white, upper_white)

        # 橙色乒乓球的 HSV 范围
        lower_orange = np.array([10, 100, 150])
        upper_orange = np.array([25, 255, 255])
        mask_orange = cv2.inRange(hsv, lower_orange, upper_orange)

        # 合并掩码
        mask = cv2.bitwise_or(mask_white, mask_orange)

        # 形态学操作去噪
        kernel = np.ones((3, 3), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

        # 查找轮廓
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        detections = []
        frame_area = frame.shape[0] * frame.shape[1]

        for contour in contours:
            area = cv2.contourArea(contour)
            # 乒乓球面积过滤：不能太小也不能太大
            if area < frame_area * 0.00001 or area > frame_area * 0.002:
                continue

            x, y, w, h = cv2.boundingRect(contour)

            # 圆形度判定
            perimeter = cv2.arcLength(contour, True)
            if perimeter == 0:
                continue
            circularity = 4 * np.pi * area / (perimeter * perimeter)
            if circularity < 0.5:
                continue

            # 长宽比应接近 1
            aspect_ratio = float(w) / h if h > 0 else 0
            if aspect_ratio < 0.6 or aspect_ratio > 1.4:
                continue

            ball_pixel_size = float(min(w, h))
            detections.append(
                Detection(
                    bbox=(float(x), float(y), float(x + w), float(y + h)),
                    confidence=float(circularity),
                    class_name="ball",
                    ball_pixel_size=ball_pixel_size,
                )
            )

        return detections

    def _detect_table(self, frame: np.ndarray) -> List[Detection]:
        """检测球桌

        使用颜色过滤（蓝色/绿色球桌）+ 矩形轮廓检测
        """
        import cv2

        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # 蓝色球桌的 HSV 范围
        lower_blue = np.array([90, 50, 50])
        upper_blue = np.array([130, 255, 255])
        mask_blue = cv2.inRange(hsv, lower_blue, upper_blue)

        # 绿色球桌的 HSV 范围
        lower_green = np.array([35, 50, 50])
        upper_green = np.array([85, 255, 255])
        mask_green = cv2.inRange(hsv, lower_green, upper_green)

        # 合并掩码
        mask = cv2.bitwise_or(mask_blue, mask_green)

        # 形态学操作
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

        # 查找轮廓
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        detections = []
        frame_area = frame.shape[0] * frame.shape[1]

        for contour in contours:
            area = cv2.contourArea(contour)
            # 球桌面积应较大
            if area < frame_area * 0.05:
                continue

            # 获取最小外接矩形
            rect = cv2.minAreaRect(contour)
            box = cv2.boxPoints(rect)
            box = np.int0(box)

            # 计算边界框
            x1 = float(np.min(box[:, 0]))
            y1 = float(np.min(box[:, 1]))
            x2 = float(np.max(box[:, 0]))
            y2 = float(np.max(box[:, 1]))

            detections.append(
                Detection(
                    bbox=(x1, y1, x2, y2),
                    confidence=float(area / frame_area),
                    class_name="table",
                )
            )

        # 只返回最大的球桌区域（通常只有一个球桌）
        if detections:
            detections.sort(key=lambda d: (d.bbox[2] - d.bbox[0]) * (d.bbox[3] - d.bbox[1]), reverse=True)
            return [detections[0]]

        return detections
