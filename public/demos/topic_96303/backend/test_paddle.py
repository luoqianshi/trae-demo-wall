import sys
sys.path.insert(0, '.')

from app.services.ocr_service import OCRService

f = open('../test_shelf.jpg', 'rb')
img = f.read()
f.close()

ocr = OCRService()

out = open('../paddle_result.txt', 'w', encoding='utf-8')

try:
    results, engine, fallback = ocr.recognize(img)
    out.write(f'Engine: {engine}, Fallback: {fallback}, Results: {len(results)}\n')
    for r in results:
        out.write(f"  '{r.text}'\n")
except Exception as e:
    out.write(f'ERROR: {e}\n')
    import traceback
    out.write(traceback.format_exc())

out.close()
