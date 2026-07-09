import sys
import os
sys.path.insert(0, '.')

result_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dedup_result.txt')

from rapidocr_onnxruntime import RapidOCR
import cv2
import numpy as np
import io
from PIL import Image

def calculate_iou(bbox1, bbox2):
    x1_min, y1_min = min(bbox1[0], bbox1[2], bbox1[4], bbox1[6]), min(bbox1[1], bbox1[3], bbox1[5], bbox1[7])
    x1_max, y1_max = max(bbox1[0], bbox1[2], bbox1[4], bbox1[6]), max(bbox1[1], bbox1[3], bbox1[5], bbox1[7])
    x2_min, y2_min = min(bbox2[0], bbox2[2], bbox2[4], bbox2[6]), min(bbox2[1], bbox2[3], bbox2[5], bbox2[7])
    x2_max, y2_max = max(bbox2[0], bbox2[2], bbox2[4], bbox2[6]), max(bbox2[1], bbox2[3], bbox2[5], bbox2[7])

    inter_x_min = max(x1_min, x2_min)
    inter_y_min = max(y1_min, y2_min)
    inter_x_max = min(x1_max, x2_max)
    inter_y_max = min(y1_max, y2_max)

    inter_area = max(0, inter_x_max - inter_x_min) * max(0, inter_y_max - inter_y_min)
    area1 = (x1_max - x1_min) * (y1_max - y1_min)
    area2 = (x2_max - x2_min) * (y2_max - y2_min)
    union_area = area1 + area2 - inter_area

    return inter_area / union_area if union_area > 0 else 0.0

def deduplicate_results(results):
    if len(results) <= 1:
        return results

    deduped = []
    for result in results:
        is_duplicate = False
        for existing in deduped:
            if result[1] == existing[1]:
                bbox1 = [int(p[0]) for p in result[0][0]] + [int(p[1]) for p in result[0][0]]
                bbox2 = [int(p[0]) for p in existing[0][0]] + [int(p[1]) for p in existing[0][0]]
                bbox1_flat = []
                for point in result[0]:
                    bbox1_flat.extend([int(point[0]), int(point[1])])
                bbox2_flat = []
                for point in existing[0]:
                    bbox2_flat.extend([int(point[0]), int(point[1])])
                iou = calculate_iou(bbox1_flat, bbox2_flat)
                if iou > 0.5:
                    is_duplicate = True
                    break
        if not is_duplicate:
            deduped.append(result)

    return deduped

try:
    ocr = RapidOCR()
    
    image_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'test_shelf_biaozhu.jpg')
    with open(image_path, "rb") as f:
        img_bytes = f.read()
    
    nparr = np.frombuffer(img_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    patch_size = 1024
    step = 512
    height, width = img.shape[:2]
    
    all_results = []
    
    for y in range(0, height - patch_size + 1, step):
        for x in range(0, width - patch_size + 1, step):
            patch = img[y:y+patch_size, x:x+patch_size]
            success, encoded = cv2.imencode('.jpg', patch)
            if success:
                patch_bytes = encoded.tobytes()
                image = Image.open(io.BytesIO(patch_bytes))
                try:
                    result, _ = ocr(image)
                    if result is not None:
                        for line in result:
                            text = line[1]
                            bbox = line[0]
                            adjusted_bbox = []
                            for point in bbox:
                                adjusted_bbox.append([int(point[0]) + x, int(point[1]) + y])
                            all_results.append((adjusted_bbox, text))
                except Exception:
                    continue
    
    deduped = deduplicate_results(all_results)
    
    target_code = "0786"
    
    before_count = sum(1 for r in all_results if target_code in r[1])
    after_count = sum(1 for r in deduped if target_code in r[1])
    
    with open(result_path, "w", encoding="utf-8") as f:
        f.write(f"Total results before dedup: {len(all_results)}\n")
        f.write(f"Total results after dedup: {len(deduped)}\n")
        f.write(f"Target '{target_code}' occurrences before: {before_count}\n")
        f.write(f"Target '{target_code}' occurrences after: {after_count}\n")
    
    print(f"Before: {before_count} occurrences of {target_code}")
    print(f"After: {after_count} occurrences of {target_code}")
except Exception as e:
    with open(result_path, "w", encoding="utf-8") as f:
        f.write(f"Error: {e}\n")
    print(f"Error: {e}")
