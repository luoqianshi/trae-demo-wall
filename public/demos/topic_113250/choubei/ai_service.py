import base64
import requests
import time


_access_token = None
_token_expire_time = 0


def get_access_token(api_key, secret_key):
    global _access_token, _token_expire_time
    
    if _access_token and time.time() < _token_expire_time:
        return _access_token
    
    url = "https://aip.baidubce.com/oauth/2.0/token"
    params = {
        "grant_type": "client_credentials",
        "client_id": api_key,
        "client_secret": secret_key
    }
    
    try:
        response = requests.post(url, params=params, timeout=10)
        response.raise_for_status()
        
        result = response.json()
        _access_token = result.get("access_token")
        _token_expire_time = time.time() + result.get("expires_in", 3600) - 60
        
        return _access_token
    except requests.exceptions.RequestException as e:
        raise Exception(f"获取访问令牌失败: {str(e)}")


def recognize_with_baidu(image_path, api_key, secret_key):
    access_token = get_access_token(api_key, secret_key)
    
    with open(image_path, "rb") as f:
        image_data = f.read()
    
    image_base64 = base64.b64encode(image_data).decode("utf-8")
    
    url = f"https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token={access_token}"
    
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    payload = {
        "image": image_base64,
        "language_type": "CHN_ENG"
    }
    
    try:
        response = requests.post(url, headers=headers, data=payload, timeout=30)
        response.raise_for_status()
        
        result = response.json()
        if result.get("words_result"):
            text_lines = [item["words"] for item in result["words_result"]]
            return '\n'.join(text_lines)
        
        return ""
    except requests.exceptions.RequestException as e:
        raise Exception(f"OCR识别失败: {str(e)}")