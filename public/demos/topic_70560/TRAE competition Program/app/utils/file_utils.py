import os
import uuid
import shutil
from datetime import datetime


def generate_file_id() -> str:
    return str(uuid.uuid4())[:8]


def get_file_extension(filename: str) -> str:
    return os.path.splitext(filename)[1].lower()


def create_directory_if_not_exists(directory: str):
    if not os.path.exists(directory):
        os.makedirs(directory)


def get_timestamp() -> str:
    return datetime.now().strftime("%Y%m%d_%H%M%S")


def safe_remove_file(file_path: str):
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass


def get_file_size(file_path: str) -> int:
    if os.path.exists(file_path):
        return os.path.getsize(file_path)
    return 0


def format_file_size(size_bytes: int) -> str:
    if size_bytes < 1024:
        return f"{size_bytes} B"
    elif size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} KB"
    elif size_bytes < 1024 * 1024 * 1024:
        return f"{size_bytes / (1024 * 1024):.2f} MB"
    else:
        return f"{size_bytes / (1024 * 1024 * 1024):.2f} GB"


def list_files_in_directory(directory: str, extensions=None):
    files = []
    if os.path.exists(directory):
        for filename in os.listdir(directory):
            filepath = os.path.join(directory, filename)
            if os.path.isfile(filepath):
                if extensions is None or get_file_extension(filename) in extensions:
                    files.append({
                        "name": filename,
                        "path": filepath,
                        "size": get_file_size(filepath),
                        "size_formatted": format_file_size(get_file_size(filepath)),
                        "modified": datetime.fromtimestamp(os.path.getmtime(filepath)).isoformat()
                    })
    return sorted(files, key=lambda x: x["modified"], reverse=True)