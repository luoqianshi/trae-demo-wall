"""前端配置"""
import os

# 优先从 服务器IP设置.txt 读取服务器地址
_CONFIG_FILE = os.path.join(os.path.dirname(__file__), "服务器IP设置.txt")
_SERVER_IP = "127.0.0.1"
try:
    with open(_CONFIG_FILE, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#"):
                _SERVER_IP = line
                break
except Exception:
    pass

API_BASE_URL = f"http://{_SERVER_IP}:8000"
WS_URL = f"ws://{_SERVER_IP}:8000/ws"

APP_TITLE = "Chat Platform"
WINDOW_WIDTH = 1000
WINDOW_HEIGHT = 650

# 背景图片存储目录
BG_IMAGE_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "bg_images")
os.makedirs(BG_IMAGE_DIR, exist_ok=True)
