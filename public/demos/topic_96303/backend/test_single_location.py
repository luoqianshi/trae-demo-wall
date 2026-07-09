import sys
import os
sys.path.insert(0, '.')

result_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'single_location_result.txt')

from rapidocr_onnxruntime import RapidOCR
import cv2
import numpy as np
import io
from PIL import Image

try:
    ocr = RapidOCR()
    with open(result_path, "w", encoding="utf-8") as f:
        f.write("OCR init OK\n")
    
    image_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'test_shelf_biaozhu.jpg')
    with open(image_path, "rb") as f:
        img_bytes = f.read()
    
    with open(result_path, "a", encoding="utf-8") as f:
        f.write(f"Image loaded: {len(img_bytes)} bytes\n")
    
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    with open(result_path, "a", encoding="utf-8") as f:
        f.write(f"Image shape: {img.shape}\n")
    
    patch = img[512:1536, 512:1536]
    
    with open(result_path, "a", encoding="utf-8") as f:
        f.write(f"Patch shape: {patch.shape}\n")
    
    success, encoded = cv2.imencode('.jpg', patch)
    patch_bytes = encoded.tobytes()
    
    with open(result_path, "a", encoding="utf-8") as f:
        f.write(f"Patch bytes: {len(patch_bytes)}\n")
    
    image = Image.open(io.BytesIO(patch_bytes))
    
    with open(result_path, "a", encoding="utf-8") as f:
        f.write("Image opened\n")
    
    result, _ = ocr(image)
    
    with open(result_path, "a", encoding="utf-8") as f:
        f.write(f"Results: {len(result)}\n")
        for r in result:
            f.write(f"  '{r[1]}'\n")
    
    print("Done!")
except Exception as e:
    with open(result_path, "w", encoding="utf-8") as f:
        f.write(f"Error: {e}\n")
    print(f"Error: {e}")
