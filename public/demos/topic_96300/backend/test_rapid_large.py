import sys
from rapidocr_onnxruntime import RapidOCR
import io
from PIL import Image

print("Testing RapidOCR with large image...", flush=True)

try:
    ocr = RapidOCR()
    print("OCR init OK", flush=True)
    
    with open("../test_shelf_biaozhu.jpg", "rb") as f:
        img_bytes = f.read()
    print(f"Image size: {len(img_bytes)}", flush=True)
    
    image = Image.open(io.BytesIO(img_bytes))
    print(f"Image: {image.size}", flush=True)
    
    result, _ = ocr(image)
    print(f"Results: {len(result)}", flush=True)
    for r in result[:20]:
        print(f"  '{r[1]}'", flush=True)
        
except Exception as e:
    print(f"Error: {e}", flush=True)
    import traceback
    traceback.print_exc(file=sys.stdout)
