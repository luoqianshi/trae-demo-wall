"""ZIP 文件解压器"""

import os
import zipfile


def extract_zip(zip_path: str, extract_dir: str) -> str:
    """解压 ZIP 文件到指定目录"""
    os.makedirs(extract_dir, exist_ok=True)
    with zipfile.ZipFile(zip_path, 'r') as zf:
        zf.extractall(extract_dir)
    return extract_dir
