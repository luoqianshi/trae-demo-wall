import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.ocr_service import OCRService
from app.services.image_service import ImageService
from app.services.code_extractor import CodeExtractor

def test_ocr_on_image(image_path):
    if not os.path.exists(image_path):
        print(f"错误: 文件不存在 - {image_path}")
        return

    with open(image_path, 'rb') as f:
        image_bytes = f.read()

    print(f"图片大小: {len(image_bytes)} bytes")

    ocr_service = OCRService()

    all_results = []

    print("\n=== 1. 原始图像 + PaddleOCR ===")
    try:
        results, engine, fallback = ocr_service.recognize(image_bytes)
        print(f"使用引擎: {engine}")
        print(f"识别到 {len(results)} 个文本区域:")
        for i, r in enumerate(results):
            print(f"  [{i}] '{r.text}' - 置信度: {r.confidence:.2f}")
        all_results.append(('paddle_original', results))
    except Exception as e:
        print(f"失败: {e}")

    print("\n=== 2. 原始图像 + RapidOCR ===")
    try:
        results, engine, fallback = ocr_service.recognize(image_bytes, fallback=True)
        print(f"使用引擎: {engine}")
        print(f"识别到 {len(results)} 个文本区域:")
        for i, r in enumerate(results):
            print(f"  [{i}] '{r.text}' - 置信度: {r.confidence:.2f}")
        all_results.append(('rapid_original', results))
    except Exception as e:
        print(f"失败: {e}")

    print("\n=== 3. 预处理图像 + PaddleOCR ===")
    try:
        results, engine, fallback = ocr_service.recognize_with_preprocessing(image_bytes)
        print(f"使用引擎: {engine}")
        print(f"识别到 {len(results)} 个文本区域:")
        for i, r in enumerate(results):
            print(f"  [{i}] '{r.text}' - 置信度: {r.confidence:.2f}")
        all_results.append(('paddle_preprocessed', results))
    except Exception as e:
        print(f"失败: {e}")

    print("\n=== 目标码匹配测试 ===")
    target_codes = ["0786", "3695", "0895", "6375", "7530", "4293", "2226", "0892", "4285"]
    
    for code in target_codes:
        found = False
        for name, results in all_results:
            matches, is_unique = CodeExtractor.find_matching_result(results, code)
            if matches:
                print(f"  码 '{code}' - {name} 匹配成功: {[m.text for m in matches]}")
                found = True
                break
        if not found:
            print(f"  码 '{code}' - 所有引擎均未匹配到")

    return all_results

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("用法: python test_ocr.py <图片路径>")
        print("示例: python test_ocr.py shelf_photo.jpg")
        sys.exit(1)
    
    image_path = sys.argv[1]
    test_ocr_on_image(image_path)