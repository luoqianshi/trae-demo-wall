import sys
sys.path.insert(0, '.')

try:
    from paddleocr import PaddleOCR
    
    ocr = PaddleOCR(use_angle_cls=True, lang='ch', show_log=False)
    
    f = open('../test_shelf.jpg', 'rb')
    img_bytes = f.read()
    f.close()
    
    import io
    from PIL import Image
    image = Image.open(io.BytesIO(img_bytes))
    
    result = ocr.ocr(image, cls=True)
    
    out = open('../paddle_results.txt', 'w', encoding='utf-8')
    
    if result and len(result) > 0:
        out.write(f'Results: {len(result[0])}\n')
        for line in result[0]:
            text = line[1][0]
            out.write(f"  '{text}'\n")
    else:
        out.write('No results\n')
    
    out.close()
    print('PaddleOCR success!')
    
except Exception as e:
    print(f'PaddleOCR failed: {e}')
    import traceback
    traceback.print_exc()
