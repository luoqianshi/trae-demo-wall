import requests

url = "http://localhost:8001/api/locate-code"

with open("../test_shelf_biaozhu.jpg", "rb") as f:
    image_bytes = f.read()

files = {"image": ("test.jpg", image_bytes, "image/jpeg")}
data = {"full_code": "0786", "short_code": "0786"}

response = requests.post(url, files=files, data=data)
print(f"Status: {response.status_code}")
result = response.json()
print(f"Found: {result.get('found', False)}")
print(f"Engine: {result.get('engine', '')}")
print(f"OCR Texts count: {len(result.get('ocr_raw_texts', []))}")
if 'ocr_raw_texts' in result:
    for text in result['ocr_raw_texts'][:10]:
        print(f"  - {text}")
