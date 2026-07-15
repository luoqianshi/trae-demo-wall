"""球员和足球检测模块：使用 YOLOv8 检测每帧中的球员和足球"""
from dataclasses import dataclass
from typing import List
import numpy as np
from ultralytics import YOLO
from config import YOLO_MODEL_PATH, DEVICE


@dataclass
class Detection:
    """检测结果数据类"""
    bbox: tuple  # (x1, y1, x2, y2)
    confidence: float
    class_name: str  # "player" 或 "ball"


class PlayerBallDetector:
    """球员和足球检测器"""

    # COCO 数据集中 person 的类别 ID
    PERSON_CLASS_ID = 0

    def __init__(self, model_path: str = YOLO_MODEL_PATH):
        """加载 YOLOv8 模型"""
        self.model = YOLO(model_path)
        self.device = DEVICE

    def detect(self, frame: np.ndarray, conf_threshold: float = 0.3) -> List[Detection]:
        """检测帧中的球员（person）

        Args:
            frame: 视频帧（BGR 格式）
            conf_threshold: 置信度阈值

        Returns:
            检测结果列表
        """
        results = self.model.predict(
            frame,
            conf=conf_threshold,
            classes=[self.PERSON_CLASS_ID],  # 只检测 person
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

    def detect_ball(self, frame: np.ndarray, conf_threshold: float = 0.25) -> List[Detection]:
        """检测帧中的足球

        使用基于颜色和轮廓的简单方法检测足球：
        足球通常为白色圆形物体，在绿色草地上较易识别

        Args:
            frame: 视频帧（BGR 格式）
            conf_threshold: 置信度阈值（此处用作面积/圆形度过滤阈值）

        Returns:
            足球检测结果列表
        """
        import cv2

        # 将 BGR 转为 HSV 色彩空间
        hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

        # 白色足球的 HSV 范围（亮度较高、饱和度较低）
        lower_white = np.array([0, 0, 180])
        upper_white = np.array([180, 50, 255])
        mask = cv2.inRange(hsv, lower_white, upper_white)

        # 形态学操作去噪
        kernel = np.ones((5, 5), np.uint8)
        mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)

        # 查找轮廓
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        detections = []
        frame_area = frame.shape[0] * frame.shape[1]

        for contour in contours:
            area = cv2.contourArea(contour)
            # 足球面积过滤：不能太小也不能太大
            if area < frame_area * 0.00005 or area > frame_area * 0.005:
                continue

            # 计算轮廓的包围矩形
            x, y, w, h = cv2.boundingRect(contour)

            # 圆形度判定（足球应该是接近圆形的）
            perimeter = cv2.arcLength(contour, True)
            if perimeter == 0:
                continue
            circularity = 4 * np.pi * area / (perimeter * perimeter)
            if circularity < 0.5:  # 圆形度阈值
                continue

            # 长宽比应该接近 1
            aspect_ratio = float(w) / h if h > 0 else 0
            if aspect_ratio < 0.6 or aspect_ratio > 1.4:
                continue

            detections.append(
                Detection(
                    bbox=(float(x), float(y), float(x + w), float(y + h)),
                    confidence=float(circularity),  # 用圆形度作为置信度
                    class_name="ball",
                )
            )

        return detections

    def detect_all(self, frame: np.ndarray, conf_threshold: float = 0.3) -> List[Detection]:
        """同时检测球员和足球

        Args:
            frame: 视频帧
            conf_threshold: 置信度阈值

        Returns:
            所有检测结果（球员 + 足球）
        """
        player_detections = self.detect(frame, conf_threshold)
        ball_detections = self.detect_ball(frame, conf_threshold)
        return player_detections + ball_detections
