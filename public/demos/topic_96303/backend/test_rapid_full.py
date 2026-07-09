print("Testing RapidOCR full pipeline...")
try:
    from rapidocr_onnxruntime import RapidOCR
    import io
    from PIL import Image
    print("Imports OK")
    
    ocr = RapidOCR()
    print("OCR init OK")
    
    with open("../test_shelf_biaozhu.jpg", "rb") as f:
        image_bytes = f.read()
    print(f"Image loaded: {len(image_bytes)} bytes")
    
    image = Image.open(io.BytesIO(image_bytes))
    print(f"Image opened: {image.size}")
    
    result, _ = ocr(image)
    print(f"OCR done: {len(result)} results")
    
    for line in result[:10]:
        print(f"  '{line[1]}'")
        
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
