import sys
import os
sys.path.insert(0, '.')

result_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'two_patches_result.txt')

from rapidocr_onnxruntime import RapidOCR
import cv2
import numpy as np
import io
from PIL import Image

try:
    ocr = RapidOCR()
    
    with open(result_path, "w", encoding="utf-8") as f:
        f.write("OCR init OK\n")
        f.flush()
    
    image_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'test_shelf_biaozhu.jpg')
    with open(image_path, "rb") as f:
        img_bytes = f.read()
    
    with open(result_path, "a", encoding="utf-8") as f:
        f.write(f"Image loaded: {len(img_bytes)} bytes\n")
        f.flush()
    
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    with open(result_path, "a", encoding="utf-8") as f:
        f.write(f"Image shape: {img.shape}\n")
        f.flush()
    
    patches = [
        (0, 0),
        (512, 512),
    ]
    
    with open(result_path, "a", encoding="utf-8") as f:
        f.write("Processing patches...\n")
        f.flush()
    
    for x, y in patches:
        with open(result_path, "a", encoding="utf-8") as f:
            f.write(f"Patch ({x},{y})...\n")
            f.flush()
        
        patch = img[y:y+1024, x:x+1024]
        success, encoded = cv2.imencode('.jpg', patch)
        
        if success:
            patch_bytes = encoded.tobytes()
            image = Image.open(io.BytesIO(patch_bytes))
            
            try:
                result, _ = ocr(image)
                
                with open(result_path, "a", encoding="utf-8") as f:
                    f.write(f"  Results: {len(result)}\n")
                    for r in result:
                        f.write(f"    '{r[1]}'\n")
                    f.flush()
                    
            except Exception as e:
                with open(result_path, "a", encoding="utf-8") as f:
                    f.write(f"  Error: {e}\n")
                    f.flush()
        else:
            with open(result_path, "a", encoding="utf-8") as f:
                f.write("  Encode failed\n")
                f.flush()
    
    with open(result_path, "a", encoding="utf-8") as f:
        f.write("Done!\n")
    
    print("Done!")
except Exception as e:
    with open(result_path, "w", encoding="utf-8") as f:
        f.write(f"Error: {e}\n")
    print(f"Error: {e}")
