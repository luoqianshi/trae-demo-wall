import sys
sys.path.insert(0, '.')

from rapidocr_onnxruntime import RapidOCR
import cv2
import numpy as np
import io
from PIL import Image

print("Testing single patch...", flush=True)

ocr = RapidOCR()
print("OCR init OK", flush=True)

with open("../test_shelf_biaozhu.jpg", "rb") as f:
    img_bytes = f.read()

nparr = np.frombuffer(img_bytes, np.uint8)
img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
print(f"Image: {img.shape}", flush=True)

patch = img[512:1536, 512:1536]
print(f"Patch: {patch.shape}", flush=True)

success, encoded = cv2.imencode('.jpg', patch)
patch_bytes = encoded.tobytes()

image = Image.open(io.BytesIO(patch_bytes))
result, _ = ocr(image)

print(f"Results: {len(result)}", flush=True)
for r in result:
    print(f"  '{r[1]}'", flush=True)
