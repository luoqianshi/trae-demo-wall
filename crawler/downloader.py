"""文件下载器"""

import os
import time
import requests

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
}


def download_file(url: str, save_path: str, timeout: int = 60, max_total_time: int = 120) -> str:
    """下载文件到指定路径

    Args:
        url: 下载地址
        save_path: 保存路径
        timeout: 连接/读取超时（秒）
        max_total_time: 总下载时间上限（秒），防止慢速服务器导致无限挂起
    """
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    resp = requests.get(url, headers=HEADERS, timeout=timeout, stream=True)
    resp.raise_for_status()
    deadline = time.monotonic() + max_total_time
    with open(save_path, 'wb') as f:
        for chunk in resp.iter_content(chunk_size=8192):
            if time.monotonic() > deadline:
                raise TimeoutError(f'Download exceeded {max_total_time}s total: {url}')
            f.write(chunk)
    return save_path
