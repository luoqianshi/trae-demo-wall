import sys
sys.path.insert(0, '.')

from app.services.ocr_service import OCRService

ocr_service = OCRService()

images = [
    ('Original', '../test_shelf_biaozhu.jpg'),
    ('CLAHE+Sharpened', '../preprocess_clahe_sharpened.jpg'),
    ('Binary', '../preprocess_binary.jpg'),
    ('Opened', '../preprocess_opened.jpg'),
]

out = open('../ocr_preprocess_output.txt', 'w', encoding='utf-8')

for name, path in images:
    try:
        f = open(path, 'rb')
        img_bytes = f.read()
        f.close()
        
        results, engine, fallback = ocr_service.recognize(img_bytes, fallback=True)
        
        out.write(f"\n=== {name} ===\n")
        out.write(f"Engine: {engine}, Results: {len(results)}\n")
        
        for result in results:
            out.write(f"  '{result.text}'\n")
            
    except Exception as e:
        out.write(f"\n=== {name} ===\n")
        out.write(f"Error: {e}\n")

out.close()
print("Done!")
