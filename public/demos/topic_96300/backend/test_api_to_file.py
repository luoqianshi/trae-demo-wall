import requests

url = "http://localhost:8080/api/locate-code"

with open("../test_shelf_biaozhu.jpg", "rb") as f:
    image_bytes = f.read()

target_codes = ["0786", "3695", "0895", "6375", "7530", "4293", "2226", "0892", "4285"]

output_file = open("../api_test_results.txt", "w", encoding="utf-8")

for code in target_codes:
    files = {"image": ("test.jpg", image_bytes, "image/jpeg")}
    data = {"full_code": code, "short_code": code}
    
    response = requests.post(url, files=files, data=data)
    output_file.write(f"\n=== Testing {code} ===\n")
    output_file.write(f"Status: {response.status_code}\n")
    
    if response.status_code == 200:
        if response.headers.get("X-Found") == "true":
            output_file.write(f"FOUND! Target: {response.headers.get('X-Target-Code')}, Matched: {response.headers.get('X-Matched-Text')}\n")
        else:
            result = response.json()
            output_file.write(f"Found: {result.get('found', False)}\n")
            output_file.write(f"Message: {result.get('message', '')}\n")
            output_file.write(f"OCR Texts ({len(result.get('ocr_raw_texts', []))}):\n")
            for text in result.get('ocr_raw_texts', [])[:20]:
                output_file.write(f"  - {text}\n")

output_file.close()
print("Done! Results written to api_test_results.txt")
