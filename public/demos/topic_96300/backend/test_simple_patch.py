import sys
import os
sys.path.insert(0, '.')

from rapidocr_onnxruntime import RapidOCR
import cv2
import numpy as np
import io
from PIL import Image

result_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'simple_patch_result.txt')

try:
    ocr = RapidOCR()
    
    image_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'test_shelf_biaozhu.jpg')
    with open(image_path, "rb") as f:
        img_bytes = f.read()
    
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    patch = img[512:1536, 512:1536]
    success, encoded = cv2.imencode('.jpg', patch)
    patch_bytes = encoded.tobytes()
    
    image = Image.open(io.BytesIO(patch_bytes))
    result, _ = ocr(image)
    
    with open(result_path, "w", encoding="utf-8") as f:
        f.write(f"Results: {len(result)}\n")
        for r in result:
            f.write(f"  '{r[1]}'\n")
    
    print("Done!")
except Exception as e:
    with open(result_path, "w", encoding="utf-8") as f:
        f.write(f"Error: {e}\n")
    print(f"Error: {e}")
