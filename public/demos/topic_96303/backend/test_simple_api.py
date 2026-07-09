import requests

url = "http://localhost:8080/api/locate-code"

with open("../test_shelf_biaozhu.jpg", "rb") as f:
    image_bytes = f.read()

files = {"image": ("test.jpg", image_bytes, "image/jpeg")}
data = {"full_code": "4293", "short_code": "4293"}

response = requests.post(url, files=files, data=data)
print("Status:", response.status_code)

if response.status_code == 200:
    if response.headers.get("X-Found") == "true":
        print("FOUND!")
        print("Target:", response.headers.get("X-Target-Code"))
        print("Matched:", response.headers.get("X-Matched-Text"))
    else:
        result = response.json()
        print("Found:", result.get("found"))
        print("Message:", result.get("message"))
        print("OCR Texts:", len(result.get("ocr_raw_texts", [])))
