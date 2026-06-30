import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
DB_PATH = os.path.join(DATA_DIR, "valueledger.db")

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY", "sk-***")
DEEPSEEK_API_URL = os.environ.get("DEEPSEEK_API_URL", "https://api.deepseek.com/v1/chat/completions")
DEEPSEEK_MODEL = os.environ.get("DEEPSEEK_MODEL", "deepseek-chat")

SERVER_HOST = os.environ.get("SERVER_HOST", "0.0.0.0")
SERVER_PORT = int(os.environ.get("SERVER_PORT", "8765"))

DEFAULT_SERVER_URL = os.environ.get("DEFAULT_SERVER_URL", f"http://127.0.0.1:{SERVER_PORT}")
