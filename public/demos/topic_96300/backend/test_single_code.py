import requests

url = "http://localhost:8080/api/locate-code"

with open("../test_shelf_biaozhu.jpg", "rb") as f:
    image_bytes = f.read()

files = {"image": ("test.jpg", image_bytes, "image/jpeg")}
data = {"full_code": "0786", "short_code": "0786"}

response = requests.post(url, files=files, data=data)
print(f"Status: {response.status_code}")

if response.status_code == 200:
    if response.headers.get("X-Found") == "true":
        print(f"FOUND! Target: {response.headers.get('X-Target-Code')}, Matched: {response.headers.get('X-Matched-Text')}")
    else:
        result = response.json()
        print(f"Found: {result.get('found', False)}")
        print(f"Message: {result.get('message', '')}")
        print(f"OCR Texts ({len(result.get('ocr_raw_texts', []))}):")
        for text in result.get('ocr_raw_texts', [])[:20]:
            print(f"  - {text}")
