import sys
sys.path.insert(0, '.')

from rapidocr_onnxruntime import RapidOCR
import cv2
import numpy as np
import io
from PIL import Image

output_lines = []

output_lines.append("Testing direct patch...")

ocr = RapidOCR()
output_lines.append("OCR init OK")

with open("../test_shelf_biaozhu.jpg", "rb") as f:
    img_bytes = f.read()

nparr = np.frombuffer(img_bytes, np.uint8)
img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
output_lines.append(f"Image: {img.shape}")

patch_size = 1024
step = 512
height, width = img.shape[:2]
output_lines.append(f"Patch size: {patch_size}, step: {step}")

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
                if result:
                    for r in result:
                        text = r[1]
                        all_texts.append(text)
                        output_lines.append(f"Found: '{text}' at ({x},{y})")
            except Exception as e:
                output_lines.append(f"Error at ({x},{y}): {e}")

output_lines.append(f"\nTotal texts: {len(all_texts)}")

target_codes = ["0786", "3695", "0895", "6375", "7530", "4293", "2226", "0892", "4285"]
output_lines.append("\n=== Found codes ===")
for code in target_codes:
    found = any(code in t or t in code for t in all_texts)
    output_lines.append(f"{code}: {'FOUND' if found else 'NOT FOUND'}")

with open("../direct_patch_result.txt", "w", encoding="utf-8") as f:
    for line in output_lines:
        f.write(line + "\n")

print("Done! Results written to direct_patch_result.txt")
