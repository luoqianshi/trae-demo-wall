import sys
sys.path.insert(0, '.')

from app.services.ocr_service import OCRService

print("Creating OCR service...", flush=True)
ocr_service = OCRService()
print("Loading image...", flush=True)
with open("../test_shelf_biaozhu.jpg", "rb") as f:
    image_bytes = f.read()
print(f"Image size: {len(image_bytes)}", flush=True)

print("Running OCR...", flush=True)
results, engine = ocr_service.recognize(image_bytes)
print(f"Results: {len(results)}", flush=True)
for r in results[:20]:
    print(f"  '{r.text}'", flush=True)
