import logging
from typing import List, Tuple, Optional

logger = logging.getLogger(__name__)


class OCRResult:
    def __init__(self, text: str, bbox: List[int], engine: str):
        self.text = text
        self.bbox = bbox
        self.engine = engine


class RapidOCREngine:
    def __init__(self):
        self.ocr = None
        self._initialized = False

    def _init_engine(self):
        try:
            from rapidocr_onnxruntime import RapidOCR
            self.ocr = RapidOCR()
            self._initialized = True
            logger.info("RapidOCR initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize RapidOCR: {e}")
            raise

    def recognize(self, image_bytes: bytes) -> List[OCRResult]:
        if not self._initialized:
            self._init_engine()

        try:
            import io
            from PIL import Image
            image = Image.open(io.BytesIO(image_bytes))
            result, _ = self.ocr(image)
            ocr_results = []
            if result:
                for line in result:
                    text = line[1]
                    bbox = line[0]
                    bbox_flat = []
                    for point in bbox:
                        bbox_flat.extend([int(point[0]), int(point[1])])
                    ocr_results.append(OCRResult(text=text, bbox=bbox_flat, engine="rapidocr"))
            return ocr_results
        except Exception as e:
            logger.error(f"RapidOCR recognition failed: {e}")
            raise

    def recognize_with_sliding_window(self, image_bytes: bytes, patch_size: int = 1024, step: int = 512) -> List[OCRResult]:
        if not self._initialized:
            self._init_engine()

        try:
            import cv2
            import numpy as np
            import io
            from PIL import Image

            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            if img is None:
                return []

            height, width = img.shape[:2]
            all_results = []

            for y in range(0, height - patch_size + 1, step):
                for x in range(0, width - patch_size + 1, step):
                    patch = img[y:y+patch_size, x:x+patch_size]
                    success, encoded = cv2.imencode('.jpg', patch)
                    if not success:
                        continue

                    patch_bytes = encoded.tobytes()
                    image = Image.open(io.BytesIO(patch_bytes))

                    try:
                        result, _ = self.ocr(image)
                        if result is None:
                            continue
                        for line in result:
                            text = line[1]
                            bbox = line[0]
                            bbox_flat = []
                            for point in bbox:
                                bbox_flat.extend([int(point[0]) + x, int(point[1]) + y])
                            all_results.append(OCRResult(text=text, bbox=bbox_flat, engine="rapidocr"))
                    except Exception:
                        continue

            return self._deduplicate_results(all_results)
        except Exception as e:
            logger.error(f"Sliding window recognition failed: {e}")
            return []

    def _deduplicate_results(self, results: List[OCRResult]) -> List[OCRResult]:
        if len(results) <= 1:
            return results

        deduped = []
        for result in results:
            is_duplicate = False
            for existing in deduped:
                if result.text == existing.text:
                    bbox1 = result.bbox
                    bbox2 = existing.bbox
                    iou = self._calculate_iou(bbox1, bbox2)
                    if iou > 0.5:
                        is_duplicate = True
                        break
            if not is_duplicate:
                deduped.append(result)

        return deduped

    def _calculate_iou(self, bbox1: List[int], bbox2: List[int]) -> float:
        x1_min, y1_min = min(bbox1[0], bbox1[2], bbox1[4], bbox1[6]), min(bbox1[1], bbox1[3], bbox1[5], bbox1[7])
        x1_max, y1_max = max(bbox1[0], bbox1[2], bbox1[4], bbox1[6]), max(bbox1[1], bbox1[3], bbox1[5], bbox1[7])
        x2_min, y2_min = min(bbox2[0], bbox2[2], bbox2[4], bbox2[6]), min(bbox2[1], bbox2[3], bbox2[5], bbox2[7])
        x2_max, y2_max = max(bbox2[0], bbox2[2], bbox2[4], bbox2[6]), max(bbox2[1], bbox2[3], bbox2[5], bbox2[7])

        inter_x_min = max(x1_min, x2_min)
        inter_y_min = max(y1_min, y2_min)
        inter_x_max = min(x1_max, x2_max)
        inter_y_max = min(y1_max, y2_max)

        inter_area = max(0, inter_x_max - inter_x_min) * max(0, inter_y_max - inter_y_min)
        area1 = (x1_max - x1_min) * (y1_max - y1_min)
        area2 = (x2_max - x2_min) * (y2_max - y2_min)
        union_area = area1 + area2 - inter_area

        return inter_area / union_area if union_area > 0 else 0.0


class OCRService:
    def __init__(self):
        self.rapid_engine = RapidOCREngine()

    def recognize(self, image_bytes: bytes) -> Tuple[List[OCRResult], str]:
        from app.services.image_service import ImageService
        resized_bytes = ImageService.resize_if_large(image_bytes)
        try:
            results = self.rapid_engine.recognize(resized_bytes)
            return results, "rapidocr"
        except Exception as rapid_err:
            logger.error(f"RapidOCR failed: {rapid_err}")
            raise

    def recognize_with_sliding_window(self, image_bytes: bytes) -> Tuple[List[OCRResult], str]:
        try:
            results = self.rapid_engine.recognize_with_sliding_window(image_bytes)
            return results, "rapidocr_sliding"
        except Exception as e:
            logger.error(f"Sliding window OCR failed: {e}")
            raise

    def recognize_with_preprocessing(self, image_bytes: bytes) -> Tuple[List[OCRResult], str]:
        from app.services.image_service import ImageService
        resized_bytes = ImageService.resize_if_large(image_bytes)
        processed_image = ImageService.preprocess_for_ocr(resized_bytes)
        
        return self.recognize(processed_image)