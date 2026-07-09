import sys
import io
from PIL import Image

try:
    from rapidocr_onnxruntime import RapidOCR
    
    ocr = RapidOCR()
    
    images = [
        ('Original', '../test_shelf_biaozhu.jpg'),
        ('CLAHE+Sharpened', '../preprocess_clahe_sharpened.jpg'),
    ]
    
    out = open('../ocr_rapid_direct.txt', 'w', encoding='utf-8')
    
    for name, path in images:
        out.write(f"\n=== {name} ===\n")
        try:
            f = open(path, 'rb')
            img_bytes = f.read()
            f.close()
            
            image = Image.open(io.BytesIO(img_bytes))
            result, _ = ocr(image)
            
            out.write(f"Results: {len(result)}\n")
            
            for box, text, score in result:
                out.write(f"  '{text}' (score: {score:.2f})\n")
                
        except Exception as e:
            out.write(f"Error: {e}\n")
    
    out.close()
    print("Done!")
    
except Exception as e:
    print(f"RapidOCR import failed: {e}")
