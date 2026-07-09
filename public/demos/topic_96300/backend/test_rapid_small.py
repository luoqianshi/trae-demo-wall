import sys
from rapidocr_onnxruntime import RapidOCR
import cv2
import numpy as np

print("Testing RapidOCR with small image...", flush=True)

try:
    ocr = RapidOCR()
    print("OCR init OK", flush=True)
    
    small_img = np.zeros((100, 100, 3), dtype=np.uint8)
    cv2.putText(small_img, "Hello 123", (10, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), 2)
    
    import io
    success, encoded = cv2.imencode('.jpg', small_img)
    img_bytes = encoded.tobytes()
    
    from PIL import Image
    image = Image.open(io.BytesIO(img_bytes))
    print(f"Image: {image.size}", flush=True)
    
    result, _ = ocr(image)
    print(f"Results: {len(result)}", flush=True)
    for r in result:
        print(f"  '{r[1]}'", flush=True)
        
except Exception as e:
    print(f"Error: {e}", flush=True)
    import traceback
    traceback.print_exc(file=sys.stdout)
