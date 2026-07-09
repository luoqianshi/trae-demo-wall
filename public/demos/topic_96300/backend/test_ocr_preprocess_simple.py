import sys
sys.path.insert(0, '.')

from app.services.ocr_service import OCRService

ocr_service = OCRService()

images = [
    ('Original', '../test_shelf_biaozhu.jpg'),
    ('CLAHE+Sharpened', '../preprocess_clahe_sharpened.jpg'),
]

out = open('../ocr_preprocess_simple.txt', 'w', encoding='utf-8')

for name, path in images:
    out.write(f"\n=== {name} ===\n")
    try:
        f = open(path, 'rb')
        img_bytes = f.read()
        f.close()
        
        results, engine, fallback = ocr_service.recognize(img_bytes, fallback=True)
        
        out.write(f"Engine: {engine}, Results: {len(results)}\n")
        
        for result in results:
            out.write(f"  '{result.text}'\n")
            
    except Exception as e:
        out.write(f"Error: {e}\n")
        import traceback
        out.write(traceback.format_exc())

out.close()
print("Done!")
