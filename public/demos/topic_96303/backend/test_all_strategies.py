import sys
sys.path.insert(0, '.')

from app.services.ocr_service import OCRService
from app.services.image_service import ImageService

print("Loading image...", flush=True)
with open("../test_shelf_biaozhu.jpg", "rb") as f:
    image_bytes = f.read()

print("Creating OCR service...", flush=True)
ocr_service = OCRService()

target_codes = ["0786", "3695", "0895", "6375", "7530", "4293", "2226", "0892", "4285"]

strategies = [
    ("original", lambda: image_bytes),
    ("clahe_sharpen", ImageService._preprocess_clahe_sharpen),
    ("high_contrast", ImageService._preprocess_high_contrast),
    ("adaptive", ImageService._preprocess_adaptive),
    ("upscale", ImageService._preprocess_upscale),
    ("median_denoise", ImageService._preprocess_median_denoise),
    ("gamma_correction", ImageService._preprocess_gamma_correction),
    ("unsharp_masking", ImageService._preprocess_unsharp_masking),
    ("morphological", ImageService._preprocess_morphological),
    ("lab_enhance", ImageService._preprocess_lab_enhance),
    ("comprehensive", ImageService._preprocess_comprehensive),
]

all_results = {}

for name, preprocess_func in strategies:
    print(f"\nTesting {name}...", flush=True)
    try:
        processed_bytes = preprocess_func(image_bytes)
        results, engine = ocr_service.recognize(processed_bytes)
        texts = [r.text for r in results]
        all_results[name] = texts
        print(f"  Results: {len(texts)} texts", flush=True)
        for t in texts[:15]:
            print(f"    '{t}'", flush=True)
    except Exception as e:
        print(f"  Error: {e}", flush=True)

print("\n\n=== Summary ===", flush=True)
for code in target_codes:
    found_in = []
    for name, texts in all_results.items():
        for text in texts:
            if code in text or text in code:
                found_in.append(name)
                break
    status = "✅" if found_in else "❌"
    print(f"{status} {code}: {' | '.join(found_in) if found_in else 'NOT FOUND'}")
