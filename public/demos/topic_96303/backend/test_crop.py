import sys
import cv2
import numpy as np
sys.path.insert(0, '.')

f = open('../test_shelf.jpg', 'rb')
img_bytes = f.read()
f.close()

nparr = np.frombuffer(img_bytes, np.uint8)
img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

# '500S07F88' BBox: [2023, 1719, 2173, 1766, 2163, 1803, 2010, 1758]
bbox = [2023, 1719, 2173, 1766, 2163, 1803, 2010, 1758]
min_x = min(bbox[0], bbox[2], bbox[4], bbox[6]) - 20
max_x = max(bbox[0], bbox[2], bbox[4], bbox[6]) + 20
min_y = min(bbox[1], bbox[3], bbox[5], bbox[7]) - 20
max_y = max(bbox[1], bbox[3], bbox[5], bbox[7]) + 20

cropped = img[min_y:max_y, min_x:max_x]

success, encoded = cv2.imencode('.jpg', cropped)
cropped_bytes = encoded.tobytes()

f = open('../cropped_code.jpg', 'wb')
f.write(cropped_bytes)
f.close()

from app.services.ocr_service import OCRService
ocr = OCRService()
results, engine, fallback = ocr.recognize(cropped_bytes, fallback=True)

print(f'Engine: {engine}, Results: {len(results)}')
for r in results:
    print(f"  '{r.text}'")
