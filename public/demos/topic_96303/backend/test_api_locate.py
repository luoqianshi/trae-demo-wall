import requests
import os

image_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'test_shelf_biaozhu.jpg')

with open(image_path, 'rb') as f:
    files = {'image': ('test_shelf.jpg', f, 'image/jpeg')}
    data = {'full_code': '8-1-0786', 'short_code': '0786'}
    
    try:
        response = requests.post('http://localhost:8080/api/locate-code', files=files, data=data, timeout=60)
        
        if response.status_code == 200:
            if response.headers.get('X-Found') == 'true':
                print(f"Found! Target: {response.headers.get('X-Target-Code')}")
                print(f"Matched: {response.headers.get('X-Matched-Text')}")
                print(f"Engine: {response.headers.get('X-OCR-Engine')}")
                
                result_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'api_result.jpg')
                with open(result_path, 'wb') as out:
                    out.write(response.content)
                print(f"Result saved to: {result_path}")
            else:
                print("Found but not unique")
                print(response.json())
        else:
            print(f"Status: {response.status_code}")
            print(response.json())
    except requests.exceptions.RequestException as e:
        print(f"Error: {e}")
