import cv2
import numpy as np
import io
from PIL import Image
from rapidocr_onnxruntime import RapidOCR

f = open('../test_shelf_biaozhu.jpg', 'rb')
img_bytes = f.read()
f.close()

nparr = np.frombuffer(img_bytes, np.uint8)
img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

print(f"Image size: {img.shape}")

ocr = RapidOCR()

target_codes = ["0786", "3695", "0895", "6375", "7530", "4293", "2226", "0892", "4285"]

result, _ = ocr(Image.fromarray(cv2.cvtColor(img, cv2.COLOR_BGR2RGB)))

out = open('../find_codes_output.txt', 'w', encoding='utf-8')

for box, text, score in result:
    out.write(f"'{text}' (score: {score:.2f}) - box: {box}\n")

out.close()
