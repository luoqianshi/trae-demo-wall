import requests

url = "http://localhost:8080/api/locate-code"

with open("../test_shelf_biaozhu.jpg", "rb") as f:
    image_bytes = f.read()

target_codes = ["0786", "3695", "0895", "6375", "7530", "4293", "2226", "0892", "4285"]

for code in target_codes:
    files = {"image": ("test.jpg", image_bytes, "image/jpeg")}
    data = {"full_code": code, "short_code": code}
    
    response = requests.post(url, files=files, data=data)
    print(f"\n=== Testing {code} ===")
    print(f"Status: {response.status_code}")
    
    if response.status_code == 200:
        if response.headers.get("X-Found") == "true":
            print(f"FOUND! Matched: {response.headers.get('X-Matched-Text')}")
        else:
            result = response.json()
            print(f"Found: {result.get('found', False)}")
            print(f"OCR Texts count: {len(result.get('ocr_raw_texts', []))}")
            if 'ocr_raw_texts' in result:
                for text in result['ocr_raw_texts'][:5]:
                    print(f"  - {text}")
