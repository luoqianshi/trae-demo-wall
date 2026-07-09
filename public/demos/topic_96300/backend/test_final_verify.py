import sys
import os
sys.path.insert(0, '.')

result_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'final_verify_result.txt')

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
    
    patch_size = 1024
    step = 512
    height, width = img.shape[:2]
    
    all_texts = []
    
    for y in range(0, height - patch_size + 1, step):
        for x in range(0, width - patch_size + 1, step):
            patch = img[y:y+patch_size, x:x+patch_size]
            success, encoded = cv2.imencode('.jpg', patch)
            if success:
                patch_bytes = encoded.tobytes()
                image = Image.open(io.BytesIO(patch_bytes))
                try:
                    result, _ = ocr(image)
                    if result is not None:
                        for r in result:
                            text = r[1]
                            all_texts.append(text)
                except Exception:
                    continue
    
    target_codes = ["0786", "3695", "0895", "6375", "7530", "4293", "2226", "0892", "4285"]
    
    with open(result_path, "w", encoding="utf-8") as f:
        f.write(f"Total texts found: {len(all_texts)}\n\n")
        
        f.write("=== Target codes search ===\n")
        found_count = 0
        for code in target_codes:
            found = any(code in t or t in code for t in all_texts)
            if found:
                found_count += 1
                f.write(f"✓ {code}: FOUND\n")
            else:
                f.write(f"✗ {code}: NOT FOUND\n")
        
        f.write(f"\n=== Summary ===\n")
        f.write(f"Found {found_count}/{len(target_codes)} target codes\n")
        if found_count == len(target_codes):
            f.write("SUCCESS: All target codes identified!\n")
        else:
            f.write("FAILED: Some codes not found\n")
    
    print(f"Found {found_count}/{len(target_codes)} codes")
except Exception as e:
    with open(result_path, "w", encoding="utf-8") as f:
        f.write(f"Error: {e}\n")
    print(f"Error: {e}")
