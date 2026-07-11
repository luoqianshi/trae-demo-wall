"""Web 层配置模块

管理 Web 应用所有路径配置和常量，独立于核心模块的 config.py。
"""
import os

# 项目根目录（fill_in_blank_ppt/）
PROJECT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Web 应用根目录（fill_in_blank_ppt/web/）
WEB_DIR = os.path.dirname(os.path.abspath(__file__))

# 用户上传的文件存储目录
UPLOAD_DIR = os.path.join(PROJECT_DIR, "web_uploads")

# 生成的 PPT 输出目录
OUTPUT_DIR = os.path.join(PROJECT_DIR, "web_outputs")

# 任务运行时的 memory 目录（中间结果）
MEMORY_DIR = os.path.join(PROJECT_DIR, "web_memory")

# 从 PPT 提取的文本输出目录
EXTRACT_DIR = os.path.join(PROJECT_DIR, "web_extracts")

# 允许的文件扩展名
ALLOWED_TEXT_EXT = {".txt", ".md"}
ALLOWED_PPTX_EXT = {".pptx"}

# 最大上传文件大小（10 MB）
MAX_CONTENT_LENGTH = 10 * 1024 * 1024

# 生成任务超时时间（秒，5 分钟）
GENERATE_TIMEOUT = 300

# 提取任务超时时间（秒，30 秒）
EXTRACT_TIMEOUT = 30

# 任务历史记录保留数量
MAX_HISTORY = 50

# 任务日志最大行数
MAX_LOG_LINES = 200


def ensure_dirs():
    """确保所有运行时目录存在"""
    for d in (UPLOAD_DIR, OUTPUT_DIR, MEMORY_DIR, EXTRACT_DIR):
        os.makedirs(d, exist_ok=True)


# 自动创建目录
ensure_dirs()
