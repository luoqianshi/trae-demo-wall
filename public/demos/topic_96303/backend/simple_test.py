import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

output = ""

def add(msg):
    global output
    output += msg + "\n"

add("Step 1: Loading image")
image_path = "../test_shelf_biaozhu.jpg"
with open(image_path, 'rb') as f:
    image_bytes = f.read()
add(f"OK: Image size={len(image_bytes)} bytes")

add("\nStep 2: Testing OCR")
from app.services.ocr_service import OCRService
ocr_service = OCRService()

results, engine, fallback = ocr_service.recognize(image_bytes, fallback=True)
add(f"OK: Engine={engine}, Results={len(results)}")

add("\nStep 3: Testing CodeExtractor.find_matching_result")
from app.services.code_extractor import CodeExtractor

target_codes = ["0786", "3695", "0895", "6375", "7530", "4293", "2226", "0892", "4285"]

for code in target_codes:
    matches, is_unique = CodeExtractor.find_matching_result(results, code)
    if matches:
        matched_texts = [m.text for m in matches]
        add(f"  Code '{code}' - MATCHED ({is_unique}): {matched_texts}")
    else:
        add(f"  Code '{code}' - NOT FOUND")

add("\nDone!")

with open("../simple_output.txt", "w", encoding="utf-8") as f:
    f.write(output)
