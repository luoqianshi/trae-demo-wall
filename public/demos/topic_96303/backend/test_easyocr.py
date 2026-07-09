import sys
sys.path.insert(0, '.')

print("Testing EasyOCR...", flush=True)

try:
    import easyocr
    import io
    from PIL import Image
    import numpy as np
    
    reader = easyocr.Reader(['ch_sim', 'en'], gpu=False)
    print("EasyOCR init OK", flush=True)
    
    with open("../test_shelf_biaozhu.jpg", "rb") as f:
        img_bytes = f.read()
    print(f"Image size: {len(img_bytes)}", flush=True)
    
    image = Image.open(io.BytesIO(img_bytes))
    print(f"Original: {image.size}", flush=True)
    
    max_dim = 1024
    width, height = image.size
    if width > max_dim or height > max_dim:
        ratio = min(max_dim / width, max_dim / height)
        image = image.resize((int(width * ratio), int(height * ratio)), Image.LANCZOS)
    print(f"Resized: {image.size}", flush=True)
    
    img_array = np.array(image)
    
    result = reader.readtext(img_array)
    print(f"Results: {len(result)}", flush=True)
    
    target_codes = ["0786", "3695", "0895", "6375", "7530", "4293", "2226", "0892", "4285"]
    
    all_texts = []
    for detection in result:
        text = detection[1]
        all_texts.append(text)
        print(f"  '{text}'", flush=True)
    
    print("\n=== Found codes ===")
    for code in target_codes:
        found = any(code in t or t in code for t in all_texts)
        print(f"{code}: {'FOUND' if found else 'NOT FOUND'}")
        
except Exception as e:
    print(f"Error: {e}", flush=True)
    import traceback
    traceback.print_exc()
