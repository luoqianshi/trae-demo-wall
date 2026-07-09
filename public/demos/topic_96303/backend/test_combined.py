import sys
import os
sys.path.insert(0, '.')

result_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'combined_result.txt')

from rapidocr_onnxruntime import RapidOCR
import cv2
import numpy as np
import io
from PIL import Image

try:
    ocr = RapidOCR()
    
    image_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'test_shelf_biaozhu.jpg')
    with open(image_path, "rb") as f:
        img_bytes = f.read()
    
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    max_dim = 1024
    height, width = img.shape[:2]
    if width > max_dim or height > max_dim:
        ratio = min(max_dim / width, max_dim / height)
        img_resized = cv2.resize(img, (int(width * ratio), int(height * ratio)), interpolation=cv2.INTER_LANCZOS4)
    else:
        img_resized = img
    
    success, encoded = cv2.imencode('.jpg', img_resized)
    resized_bytes = encoded.tobytes()
    
    image = Image.open(io.BytesIO(resized_bytes))
    result, _ = ocr(image)
    
    with open(result_path, "w", encoding="utf-8") as f:
        f.write(f"Image: {img.shape}\n")
        f.write(f"Resized: {img_resized.shape}\n")
        f.write(f"Results: {len(result)}\n")
        for r in result:
            f.write(f"  '{r[1]}'\n")
    
    print("Done!")
except Exception as e:
    with open(result_path, "w", encoding="utf-8") as f:
        f.write(f"Error: {e}\n")
    print(f"Error: {e}")
