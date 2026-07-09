import sys
sys.stdout = open('../paddle_direct_output.txt', 'w', encoding='utf-8')

try:
    print("Importing paddleocr...")
    from paddleocr import PaddleOCR
    
    print("Creating PaddleOCR instance...")
    ocr = PaddleOCR(use_angle_cls=True, lang='ch', show_log=False)
    
    print("Loading image...")
    f = open('../test_shelf_biaozhu.jpg', 'rb')
    img_bytes = f.read()
    f.close()
    
    import io
    from PIL import Image
    image = Image.open(io.BytesIO(img_bytes))
    
    print("Running OCR...")
    result = ocr.ocr(image, cls=True)
    
    print(f"Results: {len(result[0]) if result and len(result) > 0 else 0}")
    
    if result and len(result) > 0:
        for line in result[0]:
            text = line[1][0]
            print(f"  '{text}'")
    
    print("\nDone!")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

sys.stdout.close()
