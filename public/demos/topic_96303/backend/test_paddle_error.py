import traceback

try:
    print("1. Importing PaddleOCR...")
    from paddleocr import PaddleOCR
    
    print("2. Creating OCR instance...")
    ocr = PaddleOCR(use_angle_cls=True, lang='ch', show_log=False)
    
    print("3. Loading image...")
    f = open('../test_shelf.jpg', 'rb')
    img_bytes = f.read()
    f.close()
    
    print(f"   Image size: {len(img_bytes)} bytes")
    
    import io
    from PIL import Image
    image = Image.open(io.BytesIO(img_bytes))
    
    print("4. Running OCR...")
    result = ocr.ocr(image, cls=True)
    
    print(f"5. Done! Results: {len(result[0]) if result and len(result) > 0 else 0}")
    
except Exception as e:
    print(f"ERROR: {e}")
    print("Traceback:")
    traceback.print_exc()
