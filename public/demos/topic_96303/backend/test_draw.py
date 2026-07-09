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

    add("\nStep 2: Getting OCR results")
    from app.services.ocr_service import OCRService
    ocr_service = OCRService()

    results, engine, fallback = ocr_service.recognize(image_bytes, fallback=True)
    add(f"OK: Engine={engine}, Results={len(results)}")

    add("\nStep 3: Finding 0786 match")
    from app.services.code_extractor import CodeExtractor
    matches, is_unique = CodeExtractor.find_matching_result(results, "0786")

    if matches:
        add(f"OK: Found {len(matches)} matches")
        for m in matches:
            add(f"  Text: '{m.text}', BBox: {m.bbox}, Length: {len(m.bbox)}")
            
            add("\nStep 4: Testing draw_bbox with target_code='0786'")
            from app.services.image_service import ImageService
            
            try:
                annotated = ImageService.draw_bbox(image_bytes, matches, "0786")
                add(f"OK: Annotated image size={len(annotated)} bytes")
                
                output_path = "../test_annotated.jpg"
                with open(output_path, 'wb') as f:
                    f.write(annotated)
                add(f"OK: Saved to {output_path}")
            except Exception as e:
                add(f"ERROR: {e}")
                import traceback
                add(traceback.format_exc())
    else:
        add("ERROR: No matches found")

except Exception as e:
    add(f"CRITICAL ERROR: {e}")
    import traceback
    add(traceback.format_exc())

add("\nDone!")

with open("../draw_output.txt", "w", encoding="utf-8") as f:
    f.write(output)
