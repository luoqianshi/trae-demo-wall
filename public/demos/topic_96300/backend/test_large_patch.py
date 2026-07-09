import sys
sys.path.insert(0, '.')

from rapidocr_onnxruntime import RapidOCR
import cv2
import numpy as np
import io
from PIL import Image

print("Testing large image with patches...", flush=True)

try:
    ocr = RapidOCR()
    print("OCR init OK", flush=True)
    
    with open("../test_shelf_biaozhu.jpg", "rb") as f:
        img_bytes = f.read()
    print(f"Image size: {len(img_bytes)}", flush=True)
    
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    print(f"Original: {img.shape}", flush=True)
    
    patch_size = 1024
    step = 512
    height, width = img.shape[:2]
    
    all_texts = []
    
    for y in range(0, height - patch_size, step):
        for x in range(0, width - patch_size, step):
            print(f"  Processing patch ({x},{y})...", flush=True)
            patch = img[y:y+patch_size, x:x+patch_size]
            success, encoded = cv2.imencode('.jpg', patch)
            if success:
                patch_bytes = encoded.tobytes()
                image = Image.open(io.BytesIO(patch_bytes))
                try:
                    result, _ = ocr(image)
                    for r in result:
                        text = r[1]
                        if text.strip() and len(text.strip()) >= 3:
                            all_texts.append(text)
                            print(f"    Found: '{text}'", flush=True)
                except Exception as e:
                    print(f"    Error: {e}", flush=True)
    
    print(f"\nTotal texts: {len(all_texts)}", flush=True)
    
    target_codes = ["0786", "3695", "0895", "6375", "7530", "4293", "2226", "0892", "4285"]
    
    print("\n=== Found codes ===")
    for code in target_codes:
        found = any(code in t or t in code for t in all_texts)
        print(f"{code}: {'FOUND' if found else 'NOT FOUND'}")
        
except Exception as e:
    print(f"Error: {e}", flush=True)
    import traceback
    traceback.print_exc()
