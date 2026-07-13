import os
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

DATA_DIR = BASE_DIR / 'data'
MISTAKES_JSON = DATA_DIR / 'mistakes.json'
USERS_JSON = DATA_DIR / 'users.json'
CHROMA_PATH = DATA_DIR / 'chroma_db'
IMAGES_DIR = DATA_DIR / 'images'
GRAPHRAG_ROOT = DATA_DIR / 'graphrag'

# 自动创建数据目录
DATA_DIR.mkdir(exist_ok=True)
IMAGES_DIR.mkdir(exist_ok=True)

SECRET_KEY = os.getenv('SECRET_KEY', '错题小助手-dev-secret-key').strip()

OPENAI_API_KEY = os.getenv('OPENAI_API_KEY', '').strip()
GRAPHRAG_ENABLED = bool(OPENAI_API_KEY)

# OCR 后端配置：easyocr / mineru
OCR_BACKEND = os.getenv('OCR_BACKEND', 'easyocr').strip().lower()

# MinerU 官方 API 配置
# 优先使用 MINERU_TOKEN 作为 Bearer Token；
# 若未设置 TOKEN 但设置了 ACCESS_KEY，则尝试用 ACCESS_KEY 作为 TOKEN
MINERU_TOKEN = os.getenv('MINERU_TOKEN', '').strip() or os.getenv('MINERU_ACCESS_KEY', '').strip()
MINERU_SECRET_KEY = os.getenv('MINERU_SECRET_KEY', '').strip()
MINERU_BASE_URL = os.getenv('MINERU_BASE_URL', 'https://mineru.net').strip()

# 默认学生信息（Demo 用）
DEFAULT_STUDENT_ID = 's001'
DEFAULT_STUDENT_NAME = '王小明'
DEFAULT_CLASS_ID = 'c301'
