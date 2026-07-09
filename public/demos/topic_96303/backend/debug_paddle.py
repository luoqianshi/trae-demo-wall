import sys

print("Step 1: Importing paddleocr...", file=sys.stderr)
try:
    from paddleocr import PaddleOCR
    print("SUCCESS: paddleocr imported", file=sys.stderr)
except Exception as e:
    print(f"FAILED: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)

print("\nStep 2: Creating OCR instance...", file=sys.stderr)
try:
    ocr = PaddleOCR(use_angle_cls=True, lang='ch', show_log=False)
    print("SUCCESS: OCR instance created", file=sys.stderr)
except Exception as e:
    print(f"FAILED: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)

print("\nStep 3: Loading image...", file=sys.stderr)
try:
    f = open('../test_shelf_biaozhu.jpg', 'rb')
    img_bytes = f.read()
    f.close()
    print(f"SUCCESS: Image loaded, size={len(img_bytes)} bytes", file=sys.stderr)
except Exception as e:
    print(f"FAILED: {e}", file=sys.stderr)
    sys.exit(1)

print("\nStep 4: Running OCR...", file=sys.stderr)
try:
    import io
    from PIL import Image
    image = Image.open(io.BytesIO(img_bytes))
    result = ocr.ocr(image, cls=True)
    if result and len(result) > 0:
        print(f"SUCCESS: OCR completed, results={len(result[0])}", file=sys.stderr)
        for line in result[0][:5]:
            print(f"  '{line[1][0]}'", file=sys.stderr)
    else:
        print("SUCCESS: OCR completed, but no results", file=sys.stderr)
except Exception as e:
    print(f"FAILED: {e}", file=sys.stderr)
    import traceback
    traceback.print_exc(file=sys.stderr)
    sys.exit(1)

print("\nAll steps completed successfully!", file=sys.stderr)
