import sys
sys.path.insert(0, '.')

from app.services.ocr_service import OCRService

print("Loading image...", flush=True)
with open("../test_shelf_biaozhu.jpg", "rb") as f:
    image_bytes = f.read()

print("Creating OCR service...", flush=True)
ocr_service = OCRService()

print("Running sliding window OCR...", flush=True)
try:
    results, engine = ocr_service.recognize_with_sliding_window(image_bytes)
    print(f"Engine: {engine}", flush=True)
    print(f"Results count: {len(results)}", flush=True)
    
    all_texts = []
    for r in results:
        text = r.text
        all_texts.append(text)
        print(f"  '{text}'", flush=True)
    
    target_codes = ["0786", "3695", "0895", "6375", "7530", "4293", "2226", "0892", "4285"]
    
    print("\n=== Found codes ===", flush=True)
    for code in target_codes:
        found = any(code in t or t in code for t in all_texts)
        print(f"{code}: {'FOUND' if found else 'NOT FOUND'}", flush=True)
        
except Exception as e:
    print(f"Error: {e}", flush=True)
    import traceback
    traceback.print_exc(file=sys.stdout)
