import sys
import io
import cv2
import numpy as np
from PIL import Image

sys.stdout = open('../preprocess5_output.txt', 'w', encoding='utf-8')

try:
    from rapidocr_onnxruntime import RapidOCR
    ocr = RapidOCR()
    
    f = open('../test_shelf_biaozhu.jpg', 'rb')
    img_bytes = f.read()
    f.close()
    
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    preprocess_methods = [
        ('Original', cv2.cvtColor(img, cv2.COLOR_BGR2RGB)),
        ('Gaussian Blur', cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2RGB), (3, 3), 0)),
        ('Bilateral Filter', cv2.bilateralFilter(cv2.cvtColor(img, cv2.COLOR_BGR2RGB), 9, 75, 75)),
    ]
    
    for name, processed_img in preprocess_methods:
        print(f"\n=== {name} ===")
        
        pil_img = Image.fromarray(processed_img)
        result, _ = ocr(pil_img)
        
        print(f"Results: {len(result)}")
        
        for box, text, score in result:
            if len(text) >= 3 and text.replace('-', '').replace('/', '').isalnum():
                print(f"  '{text}' (score: {score:.2f})")
    
    print("\nDone!")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

sys.stdout.close()
