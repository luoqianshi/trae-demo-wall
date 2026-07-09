import sys
import os
import cv2
import numpy as np

sys.path.insert(0, '.')

def preprocess_v1(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=1.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    success, encoded = cv2.imencode('.jpg', enhanced)
    return encoded.tobytes()

def preprocess_v2(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(16, 16))
    enhanced = clahe.apply(gray)
    kernel = np.array([[-1,-1,-1], [-1,9,-1], [-1,-1,-1]])
    sharpened = cv2.filter2D(enhanced, -1, kernel)
    success, encoded = cv2.imencode('.jpg', sharpened)
    return encoded.tobytes()

def preprocess_v3(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (3, 3), 0)
    thresh = cv2.adaptiveThreshold(blur, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY_INV, 11, 2)
    success, encoded = cv2.imencode('.jpg', thresh)
    return encoded.tobytes()

def preprocess_v4(image_bytes):
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=3.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)
    success, encoded = cv2.imencode('.jpg', enhanced)
    return encoded.tobytes()

try:
    print("Step 1: Loading image")
    image_path = "../test_shelf.jpg"
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
    print(f"OK: Image size={len(image_bytes)} bytes")

    from app.services.ocr_service import OCRService
    ocr_service = OCRService()

    preprocessors = [
        ("Original", None),
        ("CLAHE 1.0/8x8", preprocess_v1),
        ("CLAHE 2.0/16x16 + Sharpen", preprocess_v2),
        ("Gaussian + Adaptive Threshold", preprocess_v3),
        ("CLAHE 3.0/8x8", preprocess_v4),
    ]

    for name, preprocessor in preprocessors:
        print(f"\n--- {name} ---")
        try:
            if preprocessor:
                processed = preprocessor(image_bytes)
                results, engine, fallback = ocr_service.recognize(processed)
            else:
                results, engine, fallback = ocr_service.recognize(image_bytes)
            
            print(f"Results: {len(results)}")
            
            for result in results:
                text = result.text.strip()
                if '078' in text or '0786' in text or '86' in text or (text.isdigit() and len(text) >= 3):
                    print(f"  Found: '{text}'")
                    
        except Exception as e:
            print(f"  ERROR: {e}")

except Exception as e:
    print(f"CRITICAL ERROR: {e}")
    import traceback
    traceback.print_exc()

print("\nDone!")
