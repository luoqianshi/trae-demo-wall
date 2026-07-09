import sys
sys.path.insert(0, '.')

from app.services.ocr_service import OCRService

f = open('../test_shelf.jpg', 'rb')
img = f.read()
f.close()

ocr = OCRService()
results, engine, fallback = ocr.recognize(img, fallback=True)

out = open('../simple_result.txt', 'w', encoding='utf-8')
out.write(f'Engine: {engine}, Results: {len(results)}\n')

for r in results:
    if r.text.isdigit() and len(r.text) >= 3:
        out.write(f"  '{r.text}'\n")
out.close()
