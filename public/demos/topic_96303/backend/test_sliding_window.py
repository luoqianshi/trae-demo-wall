import sys
sys.path.insert(0, '.')

from app.services.ocr_service import OCRService
from app.services.image_service import ImageService
import cv2
import numpy as np

print("Loading image...", flush=True)
with open("../test_shelf_biaozhu.jpg", "rb") as f:
    image_bytes = f.read()

nparr = np.frombuffer(image_bytes, np.uint8)
img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
print(f"Original size: {img.shape}", flush=True)

max_dim = 1024
height, width = img.shape[:2]
if width > max_dim or height > max_dim:
    ratio = min(max_dim / width, max_dim / height)
    img = cv2.resize(img, (int(width * ratio), int(height * ratio)), interpolation=cv2.INTER_LANCZOS4)
print(f"Resized size: {img.shape}", flush=True)

ocr_service = OCRService()

patch_size = 300
step = 200
height, width = img.shape[:2]

all_texts = []

for y in range(0, height - patch_size, step):
    for x in range(0, width - patch_size, step):
        patch = img[y:y+patch_size, x:x+patch_size]
        success, encoded = cv2.imencode('.jpg', patch)
        if success:
            patch_bytes = encoded.tobytes()
            try:
                results, engine = ocr_service.recognize(patch_bytes)
                for r in results:
                    text = r.text
                    if text.strip() and len(text.strip()) >= 3:
                        all_texts.append(text)
                        print(f"  Found: '{text}' at ({x},{y})", flush=True)
            except Exception:
                pass

print(f"\nTotal texts found: {len(all_texts)}", flush=True)

target_codes = ["0786", "3695", "0895", "6375", "7530", "4293", "2226", "0892", "4285"]

print("\n=== Found codes ===")
for code in target_codes:
    found = any(code in t or t in code for t in all_texts)
    print(f"{code}: {'FOUND' if found else 'NOT FOUND'}")
