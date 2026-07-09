import sys
import cv2
import numpy as np
sys.path.insert(0, '.')

from app.services.ocr_service import OCRService

f = open('../test_shelf.jpg', 'rb')
img_bytes = f.read()
f.close()

def process(img_bytes, method_name, process_func):
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    processed = process_func(img)
    success, encoded = cv2.imencode('.jpg', processed)
    processed_bytes = encoded.tobytes()
    
    ocr = OCRService()
    results, engine, fallback = ocr.recognize(processed_bytes, fallback=True)
    
    out = open(f'../preprocess_{method_name}.txt', 'w', encoding='utf-8')
    out.write(f'{method_name} - Engine: {engine}, Results: {len(results)}\n')
    
    for r in results:
        if '078' in r.text or '0786' in r.text or (r.text.isdigit() and len(r.text) >= 3):
            out.write(f"  '{r.text}' - BBox: {r.bbox}\n")
    
    out.close()

nparr = np.frombuffer(img_bytes, np.uint8)
img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(16, 16))
enhanced = clahe.apply(gray)

process(img_bytes, 'original', lambda x: x)
process(img_bytes, 'clahe_only', lambda x: clahe.apply(cv2.cvtColor(x, cv2.COLOR_BGR2GRAY)))

kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
sharpened = cv2.filter2D(enhanced, -1, kernel)
process(img_bytes, 'clahe_sharpen', lambda x: sharpened)

blur = cv2.GaussianBlur(gray, (5, 5), 0)
thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 21, 4)
process(img_bytes, 'adaptive_threshold', lambda x: thresh)

thresh2 = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY_INV, 15, 3)
process(img_bytes, 'adaptive_mean', lambda x: thresh2)

_, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
process(img_bytes, 'otsu', lambda x: otsu)

print('Done!')
