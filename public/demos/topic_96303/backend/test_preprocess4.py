import sys
sys.path.insert(0, '.')

import cv2
import numpy as np

f = open('../test_shelf_biaozhu.jpg', 'rb')
img_bytes = f.read()
f.close()

nparr = np.frombuffer(img_bytes, np.uint8)
img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
clahe_img = clahe.apply(gray)

kernel = np.array([[-1, -1, -1], [-1, 9, -1], [-1, -1, -1]])
sharpened = cv2.filter2D(clahe_img, -1, kernel)

_, binary = cv2.threshold(sharpened, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

kernel = np.ones((2, 2), np.uint8)
opened = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel, iterations=1)

output_paths = [
    ('../preprocess_clahe_sharpened.jpg', clahe_img),
    ('../preprocess_binary.jpg', binary),
    ('../preprocess_opened.jpg', opened),
]

for path, img_data in output_paths:
    cv2.imwrite(path, img_data)
    print(f"Saved: {path}")

print("Done!")
