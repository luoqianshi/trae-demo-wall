import sys
sys.path.insert(0, '.')

from rapidocr_onnxruntime import RapidOCR
import cv2
import numpy as np
import io
from PIL import Image

output = open("../patch_test_result.txt", "w", encoding="utf-8")

output.write("Testing single patch...\n")

ocr = RapidOCR()
output.write("OCR init OK\n")

with open("../test_shelf_biaozhu.jpg", "rb") as f:
    img_bytes = f.read()

nparr = np.frombuffer(img_bytes, np.uint8)
img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
output.write(f"Image: {img.shape}\n")

patch = img[512:1536, 512:1536]
output.write(f"Patch: {patch.shape}\n")

success, encoded = cv2.imencode('.jpg', patch)
patch_bytes = encoded.tobytes()

image = Image.open(io.BytesIO(patch_bytes))
result, _ = ocr(image)

output.write(f"Results: {len(result)}\n")
for r in result:
    output.write(f"  '{r[1]}'\n")

target_codes = ["0786", "3695", "0895", "6375", "7530", "4293", "2226", "0892", "4285"]
all_texts = [r[1] for r in result]

output.write("\n=== Found codes ===\n")
for code in target_codes:
    found = any(code in t or t in code for t in all_texts)
    output.write(f"{code}: {'FOUND' if found else 'NOT FOUND'}\n")

output.close()
print("Done!")
