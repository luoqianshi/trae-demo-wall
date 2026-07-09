import sys
import os

sys.path.insert(0, '.')

output = ""

def add(msg):
    global output
    output += msg + "\n"
    print(msg)

try:
    add("Step 1: Loading image")
    image_path = "../test_shelf.jpg"
    with open(image_path, 'rb') as f:
        image_bytes = f.read()
    add(f"OK: Image size={len(image_bytes)} bytes")

    add("\nStep 2: Getting ALL OCR results")
    from app.services.ocr_service import OCRService
    ocr_service = OCRService()

    results, engine, fallback = ocr_service.recognize(image_bytes, fallback=True)
    add(f"OK: Engine={engine}, Results={len(results)}")

    add("\n--- All OCR Results ---")
    for i, result in enumerate(results):
        add(f"[{i+1}] Text: '{result.text}', BBox: {result.bbox}")
        if '078' in result.text or '0786' in result.text or '86' in result.text:
            add(f"   ⚠️  Contains '078' or '86' - POTENTIAL MATCH!")

    add("\n--- Checking for direct matches ---")
    from app.services.code_extractor import CodeExtractor
    
    for result in results:
        text = result.text.strip()
        if CodeExtractor._fuzzy_match(text, "0786"):
            add(f"Fuzzy match: '{text}'")
        if "0786" in text:
            add(f"Direct match: '{text}'")

except Exception as e:
    add(f"CRITICAL ERROR: {e}")
    import traceback
    add(traceback.format_exc())

add("\nDone!")

with open("../ocr_full_output.txt", "w", encoding="utf-8") as f:
    f.write(output)
