import sys
import os
sys.path.insert(0, '.')

result_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'full_sliding_fixed_result.txt')

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
    
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    with open(result_path, "a", encoding="utf-8") as f:
        f.write(f"Image: {img.shape}\n")
        f.flush()
    
    patch_size = 1024
    step = 512
    height, width = img.shape[:2]
    
    all_texts = []
    
    with open(result_path, "a", encoding="utf-8") as f:
        f.write(f"Patch size: {patch_size}, step: {step}\n")
        f.flush()
    
    for y in range(0, height - patch_size + 1, step):
        for x in range(0, width - patch_size + 1, step):
            with open(result_path, "a", encoding="utf-8") as f:
                f.write(f"Processing ({x},{y})...\n")
                f.flush()
            
            patch = img[y:y+patch_size, x:x+patch_size]
            success, encoded = cv2.imencode('.jpg', patch)
            
            if success:
                patch_bytes = encoded.tobytes()
                image = Image.open(io.BytesIO(patch_bytes))
                
                try:
                    result, _ = ocr(image)
                    
                    if result is None:
                        with open(result_path, "a", encoding="utf-8") as f:
                            f.write("  No results (None)\n")
                            f.flush()
                    else:
                        for r in result:
                            text = r[1]
                            all_texts.append(text)
                            with open(result_path, "a", encoding="utf-8") as f:
                                f.write(f"  Found: '{text}'\n")
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
        f.write(f"\nTotal texts: {len(all_texts)}\n")
        f.flush()
        
        target_codes = ["0786", "3695", "0895", "6375", "7530", "4293", "2226", "0892", "4285"]
        f.write("\n=== Found codes ===\n")
        for code in target_codes:
            found = any(code in t or t in code for t in all_texts)
            f.write(f"{code}: {'FOUND' if found else 'NOT FOUND'}\n")
        f.flush()
    
    print("Done!")
except Exception as e:
    with open(result_path, "w", encoding="utf-8") as f:
        f.write(f"Error: {e}\n")
    print(f"Error: {e}")
