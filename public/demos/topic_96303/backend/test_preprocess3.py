import sys
import cv2
import numpy as np
sys.path.insert(0, '.')

from app.services.ocr_service import OCRService

f = open('../test_shelf.jpg', 'rb')
img_bytes = f.read()
f.close()

ocr = OCRService()

nparr = np.frombuffer(img_bytes, np.uint8)
img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

methods = []

methods.append(('Original', img))

clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(16, 16))
clahe_img = clahe.apply(gray)
methods.append(('CLAHE', clahe_img))

kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
sharpened = cv2.filter2D(clahe_img, -1, kernel)
methods.append(('CLAHE+Sharpen', sharpened))

blur = cv2.GaussianBlur(gray, (5, 5), 0)
thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 21, 4)
methods.append(('Adaptive_Gaussian', thresh))

thresh2 = cv2.adaptiveThreshold(gray, 255, cv2.ADAPTIVE_THRESH_MEAN_C, cv2.THRESH_BINARY_INV, 15, 3)
methods.append(('Adaptive_Mean', thresh2))

_, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
methods.append(('Otsu', otsu))

out_file = open('../preprocess_results.txt', 'w', encoding='utf-8')

for name, processed_img in methods:
    success, encoded = cv2.imencode('.jpg', processed_img)
    processed_bytes = encoded.tobytes()
    
    results, engine, fallback = ocr.recognize(processed_bytes, fallback=True)
    
    out_file.write(f'\n=== {name} ===\n')
    out_file.write(f'Engine: {engine}, Results: {len(results)}\n')
    
    for r in results:
        text = r.text.strip()
        if '078' in text or '0786' in text or (text.isdigit() and len(text) >= 3):
            out_file.write(f"  '{text}'\n")

out_file.close()
print('Done!')
