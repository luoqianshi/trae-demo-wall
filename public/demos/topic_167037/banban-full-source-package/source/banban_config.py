"""
伴伴 - 统一配置模块
统一管理数据目录和配置路径，支持环境变量覆盖
"""
import os
from pathlib import Path

# 数据根目录 - 支持通过环境变量 BANBAN_DATA_DIR 覆盖
DATA_DIR = os.environ.get("BANBAN_DATA_DIR", str(Path.home() / ".banban"))

# 确保数据目录存在
os.makedirs(DATA_DIR, exist_ok=True)

# 各子目录
SCREENSHOT_DIR = os.path.join(DATA_DIR, "screenshots")
MEMORY_DIR = os.path.join(DATA_DIR, "memory")
TTS_TMP_DIR = os.path.join(DATA_DIR, "tts_tmp")
SHERPA_MODEL_DIR = os.path.join(DATA_DIR, "sherpa_model")

# 数据库路径
DB_PATH = os.path.join(DATA_DIR, "companion.db")

# 配置文件路径
XF_CONFIG_FILE = os.path.join(DATA_DIR, "xf_config.json")
ALIYUN_CONFIG_FILE = os.path.join(DATA_DIR, "aliyun_config.json")
DOUBAO_CONFIG_FILE = os.path.join(DATA_DIR, "doubao_config.json")

# 数据文件路径
YESTERDAY_SUMMARY_FILE = os.path.join(DATA_DIR, "yesterday_summary.json")

# 确保所有目录存在
for d in [SCREENSHOT_DIR, MEMORY_DIR, TTS_TMP_DIR]:
    os.makedirs(d, exist_ok=True)


def get_data_dir() -> str:
    """获取数据目录"""
    return DATA_DIR


def get_db_path() -> str:
    """获取数据库路径"""
    return DB_PATH
