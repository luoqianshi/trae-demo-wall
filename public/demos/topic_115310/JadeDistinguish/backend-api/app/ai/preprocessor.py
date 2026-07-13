import cv2
import numpy as np
from typing import Tuple
from PIL import Image
import io


class ImagePreprocessor:
    """图像预处理服务"""
    
    @staticmethod
    async def validate_image(image_bytes: bytes) -> Tuple[bool, str]:
        """验证图像质量"""
        try:
            image = Image.open(io.BytesIO(image_bytes))
            width, height = image.size
            
            # 检查分辨率
            if width < 500 or height < 500:
                return False, "图像分辨率过低，请使用更高清的图片"
            
            # 检查文件大小
            if len(image_bytes) > 10 * 1024 * 1024:
                return False, "图像文件过大，请压缩后重试"
            
            return True, "图像质量合格"
        except Exception as e:
            return False, f"图像解析失败: {str(e)}"
    
    @staticmethod
    async def preprocess(image_bytes: bytes) -> bytes:
        """图像预处理：光照归一化、ROI 裁剪"""
        # 转换为 OpenCV 格式
        nparr = np.frombuffer(image_bytes, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if img is None:
            raise ValueError("无法解析图像")
        
        # 光照归一化（CLAHE 自适应直方图均衡化）
        lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
        l, a, b = cv2.split(lab)
        
        clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
        l = clahe.apply(l)
        
        normalized = cv2.merge([l, a, b])
        normalized = cv2.cvtColor(normalized, cv2.COLOR_LAB2BGR)
        
        # 编码为 JPEG
        _, buffer = cv2.imencode('.jpg', normalized, [cv2.IMWRITE_JPEG_QUALITY, 90])
        return buffer.tobytes()


preprocessor = ImagePreprocessor()
