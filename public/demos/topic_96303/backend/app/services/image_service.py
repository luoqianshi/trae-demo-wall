import cv2
import numpy as np
from typing import List
from app.services.ocr_service import OCRResult


class ImageService:
    RED_COLOR = (0, 0, 255)
    BOX_THICKNESS = 8
    HIGHLIGHT_COLOR = (0, 255, 255)
    HIGHLIGHT_ALPHA = 0.3
    MAX_DIMENSION = 1024

    @classmethod
    def resize_if_large(cls, image_bytes: bytes) -> bytes:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes

        height, width = img.shape[:2]
        if width <= cls.MAX_DIMENSION and height <= cls.MAX_DIMENSION:
            return image_bytes

        ratio = min(cls.MAX_DIMENSION / width, cls.MAX_DIMENSION / height)
        new_width = int(width * ratio)
        new_height = int(height * ratio)
        resized = cv2.resize(img, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)

        success, encoded = cv2.imencode('.jpg', resized)
        return encoded.tobytes() if success else image_bytes

    @classmethod
    def preprocess_for_ocr(cls, image_bytes: bytes) -> bytes:
        return cls._preprocess_clahe_sharpen(image_bytes)
    
    @classmethod
    def _preprocess_clahe_sharpen(cls, image_bytes: bytes) -> bytes:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(16, 16))
        enhanced = clahe.apply(gray)
        kernel_sharpen = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
        sharpened = cv2.filter2D(enhanced, -1, kernel_sharpen)

        success, encoded = cv2.imencode('.jpg', sharpened)
        return encoded.tobytes() if success else image_bytes
    
    @classmethod
    def _preprocess_high_contrast(cls, image_bytes: bytes) -> bytes:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=4.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        
        kernel = np.array([[0, -2, 0], [-2, 9, -2], [0, -2, 0]])
        sharpened = cv2.filter2D(enhanced, -1, kernel)

        success, encoded = cv2.imencode('.jpg', sharpened)
        return encoded.tobytes() if success else image_bytes
    
    @classmethod
    def _preprocess_adaptive(cls, image_bytes: bytes) -> bytes:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(16, 16))
        enhanced = clahe.apply(gray)
        
        adaptive = cv2.adaptiveThreshold(
            enhanced, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 15, 3
        )

        success, encoded = cv2.imencode('.jpg', adaptive)
        return encoded.tobytes() if success else image_bytes
    
    @classmethod
    def _preprocess_upscale(cls, image_bytes: bytes) -> bytes:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes

        upscaled = cv2.resize(img, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
        gray = cv2.cvtColor(upscaled, cv2.COLOR_BGR2GRAY)
        
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(16, 16))
        enhanced = clahe.apply(gray)
        
        kernel_sharpen = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
        sharpened = cv2.filter2D(enhanced, -1, kernel_sharpen)

        success, encoded = cv2.imencode('.jpg', sharpened)
        return encoded.tobytes() if success else image_bytes

    @classmethod
    def _preprocess_median_denoise(cls, image_bytes: bytes) -> bytes:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        denoised = cv2.medianBlur(gray, 3)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(16, 16))
        enhanced = clahe.apply(denoised)

        success, encoded = cv2.imencode('.jpg', enhanced)
        return encoded.tobytes() if success else image_bytes

    @classmethod
    def _preprocess_gamma_correction(cls, image_bytes: bytes) -> bytes:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        gamma = 1.5
        inv_gamma = 1.0 / gamma
        table = np.array([((i / 255.0) ** inv_gamma) * 255 for i in np.arange(0, 256)]).astype("uint8")
        corrected = cv2.LUT(gray, table)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(16, 16))
        enhanced = clahe.apply(corrected)

        success, encoded = cv2.imencode('.jpg', enhanced)
        return encoded.tobytes() if success else image_bytes

    @classmethod
    def _preprocess_unsharp_masking(cls, image_bytes: bytes) -> bytes:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 1.0)
        unsharp = cv2.addWeighted(gray, 1.5, blurred, -0.5, 0)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(16, 16))
        enhanced = clahe.apply(unsharp)

        success, encoded = cv2.imencode('.jpg', enhanced)
        return encoded.tobytes() if success else image_bytes

    @classmethod
    def _preprocess_morphological(cls, image_bytes: bytes) -> bytes:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(16, 16))
        enhanced = clahe.apply(gray)
        
        kernel = np.ones((2, 2), np.uint8)
        morph = cv2.morphologyEx(enhanced, cv2.MORPH_CLOSE, kernel)
        morph = cv2.morphologyEx(morph, cv2.MORPH_OPEN, kernel)

        success, encoded = cv2.imencode('.jpg', morph)
        return encoded.tobytes() if success else image_bytes

    @classmethod
    def _preprocess_lab_enhance(cls, image_bytes: bytes) -> bytes:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes

        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l_channel, a_channel, b_channel = cv2.split(lab)
        
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(16, 16))
        enhanced_l = clahe.apply(l_channel)
        
        merged = cv2.merge((enhanced_l, a_channel, b_channel))
        result = cv2.cvtColor(merged, cv2.COLOR_LAB2BGR)
        gray = cv2.cvtColor(result, cv2.COLOR_BGR2GRAY)

        success, encoded = cv2.imencode('.jpg', gray)
        return encoded.tobytes() if success else image_bytes

    @classmethod
    def _preprocess_comprehensive(cls, image_bytes: bytes) -> bytes:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if img is None:
            return image_bytes

        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        denoised = cv2.medianBlur(gray, 3)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(16, 16))
        enhanced = clahe.apply(denoised)
        
        blurred = cv2.GaussianBlur(enhanced, (5, 5), 1.0)
        unsharp = cv2.addWeighted(enhanced, 1.5, blurred, -0.5, 0)
        
        kernel = np.ones((2, 2), np.uint8)
        morph = cv2.morphologyEx(unsharp, cv2.MORPH_CLOSE, kernel)

        success, encoded = cv2.imencode('.jpg', morph)
        return encoded.tobytes() if success else image_bytes

    @classmethod
    def draw_bbox(cls, image_bytes: bytes, ocr_results: List[OCRResult], target_code: str = "") -> bytes:
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if img is None:
            raise ValueError("无法解码图片")

        for result in ocr_results:
            bbox = result.bbox
            text = result.text
            if len(bbox) >= 8:
                x1, y1 = bbox[0], bbox[1]
                x2, y2 = bbox[2], bbox[3]
                x3, y3 = bbox[4], bbox[5]
                x4, y4 = bbox[6], bbox[7]

                min_x = min(x1, x2, x3, x4)
                min_y = min(y1, y2, y3, y4)
                max_x = max(x1, x2, x3, x4)
                max_y = max(y1, y2, y3, y4)

                box_width = max_x - min_x
                box_height = max_y - min_y

                draw_min_x, draw_max_x = min_x, max_x

                if target_code and len(target_code) == 4:
                    import re
                    words = re.findall(r'[a-zA-Z0-9]+', text)
                    for word in words:
                        if len(word) >= 4:
                            for i in range(len(word) - 3):
                                substring = word[i:i+4]
                                from app.services.code_extractor import CodeExtractor
                                if CodeExtractor._fuzzy_match(substring, target_code) or substring == target_code:
                                    char_ratio = i / len(word)
                                    sub_width_ratio = 4 / len(word)
                                    draw_min_x = int(min_x + box_width * char_ratio)
                                    draw_max_x = int(min_x + box_width * (char_ratio + sub_width_ratio))
                                    break

                padding = 10
                draw_min_x = max(0, draw_min_x - padding)
                draw_max_x = min(img.shape[1], draw_max_x + padding)
                draw_min_y = max(0, min_y - padding)
                draw_max_y = min(img.shape[0], max_y + padding)

                overlay = img.copy()
                cv2.rectangle(overlay, (draw_min_x, draw_min_y), (draw_max_x, draw_max_y), cls.HIGHLIGHT_COLOR, -1)
                cv2.addWeighted(overlay, cls.HIGHLIGHT_ALPHA, img, 1 - cls.HIGHLIGHT_ALPHA, 0, img)

                red = (0, 0, 255)
                yellow = (0, 255, 255)
                layers = [
                    {"offset": 0, "thickness": 20, "color": red},
                    {"offset": 160, "thickness": 40, "color": yellow},
                    {"offset": 240, "thickness": 40, "color": red},
                ]
                for layer in layers:
                    cv2.rectangle(img, 
                                  (draw_min_x - layer["offset"], draw_min_y - layer["offset"]), 
                                  (draw_max_x + layer["offset"], draw_max_y + layer["offset"]), 
                                  layer["color"], layer["thickness"])

                if target_code:
                    text_bg_y = max(0, draw_min_y - 40)
                    text_bg_height = 40
                    cv2.rectangle(img, (draw_min_x, text_bg_y), (draw_max_x, text_bg_y + text_bg_height), (0, 0, 255), -1)

                    font_scale = max(1.0, box_height / 30)
                    font_thickness = max(2, int(font_scale * 2))
                    text_size, _ = cv2.getTextSize(target_code, cv2.FONT_HERSHEY_SIMPLEX, font_scale, font_thickness)
                    text_x = draw_min_x + (draw_max_x - draw_min_x - text_size[0]) // 2
                    text_y = text_bg_y + (text_bg_height + text_size[1]) // 2
                    cv2.putText(img, target_code, (text_x, text_y), cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), font_thickness)

        success, encoded = cv2.imencode('.jpg', img)
        if not success:
            raise ValueError("图片编码失败")

        return encoded.tobytes()

    @classmethod
    def is_valid_image(cls, image_bytes: bytes) -> bool:
        if len(image_bytes) == 0:
            return False

        try:
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            return img is not None
        except Exception:
            return False