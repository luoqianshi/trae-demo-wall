import sys
import io
from PIL import Image

sys.stdout = open('../ocr_final_output.txt', 'w', encoding='utf-8')

try:
    from rapidocr_onnxruntime import RapidOCR
    
    print("Initializing RapidOCR...")
    ocr = RapidOCR()
    
    print("Loading image...")
    f = open('../test_shelf_biaozhu.jpg', 'rb')
    img_bytes = f.read()
    f.close()
    
    print(f"Image size: {len(img_bytes)} bytes")
    
    image = Image.open(io.BytesIO(img_bytes))
    print(f"Image mode: {image.mode}, size: {image.size}")
    
    print("\nRunning OCR...")
    result, _ = ocr(image)
    
    print(f"\nResults: {len(result)}")
    
    for i, (box, text, score) in enumerate(result):
        print(f"{i+1}. '{text}' (score: {score:.2f}) - box: {box[0][0]:.0f},{box[0][1]:.0f}")
    
    print("\nDone!")
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()

sys.stdout.close()
