from rapidocr_onnxruntime import RapidOCR
import io
from PIL import Image

ocr = RapidOCR()

f = open('../test_shelf_biaozhu.jpg', 'rb')
img_bytes = f.read()
f.close()

img = Image.open(io.BytesIO(img_bytes))
result, _ = ocr(img)

digits_4 = [r[1] for r in result if len(r[1]) == 4 and r[1].isdigit()]

with open('../quick_result.txt', 'w') as f:
    f.write(str(digits_4))
