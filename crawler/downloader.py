"""文件下载器"""

import os
import requests

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
}


def download_file(url: str, save_path: str, timeout: int = 60) -> str:
    """下载文件到指定路径"""
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    resp = requests.get(url, headers=HEADERS, timeout=timeout, stream=True)
    resp.raise_for_status()
    with open(save_path, 'wb') as f:
        for chunk in resp.iter_content(chunk_size=8192):
            f.write(chunk)
    return save_path
