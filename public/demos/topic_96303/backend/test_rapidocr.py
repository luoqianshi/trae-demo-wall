from rapidocr_onnxruntime import RapidOCR
import io
from PIL import Image

print("Creating OCR instance...")
ocr = RapidOCR()
print("Loading image...")
with open("../test_shelf_biaozhu.jpg", "rb") as f:
    image_bytes = f.read()
image = Image.open(io.BytesIO(image_bytes))
print("Running OCR...")
result, _ = ocr(image)
print(f"Results: {len(result)}")
for line in result[:5]:
    print(f"  '{line[1]}'")
