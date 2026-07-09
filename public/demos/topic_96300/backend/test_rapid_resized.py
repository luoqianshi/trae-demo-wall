import sys
from rapidocr_onnxruntime import RapidOCR
import io
from PIL import Image

print("Testing RapidOCR with resized image...", flush=True)

try:
    ocr = RapidOCR()
    print("OCR init OK", flush=True)
    
    with open("../test_shelf_biaozhu.jpg", "rb") as f:
        img_bytes = f.read()
    print(f"Original image size: {len(img_bytes)}", flush=True)
    
    image = Image.open(io.BytesIO(img_bytes))
    print(f"Original image: {image.size}", flush=True)
    
    max_dim = 1024
    width, height = image.size
    if width > max_dim or height > max_dim:
        ratio = min(max_dim / width, max_dim / height)
        new_width = int(width * ratio)
        new_height = int(height * ratio)
        image = image.resize((new_width, new_height), Image.LANCZOS)
    print(f"Resized image: {image.size}", flush=True)
    
    result, _ = ocr(image)
    print(f"Results: {len(result)}", flush=True)
    for r in result[:20]:
        print(f"  '{r[1]}'", flush=True)
        
except Exception as e:
    print(f"Error: {e}", flush=True)
    import traceback
    traceback.print_exc(file=sys.stdout)
