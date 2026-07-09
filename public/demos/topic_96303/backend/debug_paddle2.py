import sys

log_file = open('../paddle_debug_log.txt', 'w', encoding='utf-8')

def log(msg):
    log_file.write(msg + '\n')
    log_file.flush()

log("Step 1: Importing paddleocr...")
try:
    from paddleocr import PaddleOCR
    log("SUCCESS: paddleocr imported")
except Exception as e:
    log(f"FAILED: {e}")
    import traceback
    traceback.print_exc(file=log_file)
    log_file.close()
    sys.exit(1)

log("\nStep 2: Creating OCR instance...")
try:
    ocr = PaddleOCR(use_angle_cls=True, lang='ch', show_log=False)
    log("SUCCESS: OCR instance created")
except Exception as e:
    log(f"FAILED: {e}")
    import traceback
    traceback.print_exc(file=log_file)
    log_file.close()
    sys.exit(1)

log("\nStep 3: Loading image...")
try:
    f = open('../test_shelf_biaozhu.jpg', 'rb')
    img_bytes = f.read()
    f.close()
    log(f"SUCCESS: Image loaded, size={len(img_bytes)} bytes")
except Exception as e:
    log(f"FAILED: {e}")
    log_file.close()
    sys.exit(1)

log("\nStep 4: Running OCR...")
try:
    import io
    from PIL import Image
    image = Image.open(io.BytesIO(img_bytes))
    result = ocr.ocr(image, cls=True)
    if result and len(result) > 0:
        log(f"SUCCESS: OCR completed, results={len(result[0])}")
        for line in result[0][:5]:
            log(f"  '{line[1][0]}'")
    else:
        log("SUCCESS: OCR completed, but no results")
except Exception as e:
    log(f"FAILED: {e}")
    import traceback
    traceback.print_exc(file=log_file)
    log_file.close()
    sys.exit(1)

log("\nAll steps completed successfully!")
log_file.close()
