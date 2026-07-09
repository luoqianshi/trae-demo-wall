import sys
import io
import cv2
import numpy as np
from PIL import Image

try:
    from rapidocr_onnxruntime import RapidOCR
    ocr = RapidOCR()
    
    f = open('../test_shelf_biaozhu.jpg', 'rb')
    img_bytes = f.read()
    f.close()
    
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    processed = cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2RGB), (3, 3), 0)
    pil_img = Image.fromarray(processed)
    result, _ = ocr(pil_img)
    
    print(f"Gaussian Blur Results: {len(result)}")
    for box, text, score in result:
        if len(text) >= 3 and text.replace('-', '').replace('/', '').isalnum():
            print(f"  '{text}'")
    
except Exception as e:
    print(f"Error: {e}")
