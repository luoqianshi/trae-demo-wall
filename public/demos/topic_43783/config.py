"""配置文件"""

import os

# 论坛 API 地址
BASE_URL = "https://forum.trae.cn"
DEMO_CATEGORY_URL = f"{BASE_URL}/c/38-category/40-category/40.json"
TOPIC_URL = f"{BASE_URL}/t/{{topic_id}}.json"

# 爬取设置
REQUEST_DELAY_MIN = 1.0  # 最小请求间隔（秒）
REQUEST_DELAY_MAX = 2.0  # 最大请求间隔（秒）
MAX_RETRIES = 3          # 最大重试次数
RETRY_BACKOFF = 2.0      # 重试退避倍数
PAGE_SIZE = 30           # 每页帖子数

# 查询参数
QUERY_PARAMS = {
    "include_related_posts": "false",
    "include_raw": "false",
}

# 本地数据文件
DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data")
DATA_FILE = os.path.join(DATA_DIR, "posts.json")
STATUS_FILE = os.path.join(DATA_DIR, "status.json")
SNAPSHOT_DIR = os.path.join(DATA_DIR, "snapshots")
UPDATE_LOG_FILE = os.path.join(DATA_DIR, "update_log.json")

# 快照设置
SNAPSHOT_MAX_DAYS = 30  # 最多保留快照天数

# 赛事结束日期（超过此日期自动更新暂停）
EVENT_END_DATE = "2026-08-22"

# 定时更新时间（24小时制）
SCHEDULED_UPDATE_HOUR = 20
SCHEDULED_UPDATE_MINUTE = 0

# 查重设置
DUPLICATE_THRESHOLD = 0.85  # 默认相似度阈值

# 赛道标签
TRACK_TAGS = ["生活娱乐", "学习工作", "社会服务", "硬件交互", "社会公益"]

# 官方教程/公告帖 ID（不参与排行榜和分析）
OFFICIAL_POST_IDS = {22549, 21487}

# 词云设置
KEYWORD_TOP_N = 30  # 词频统计取前 N 个

# Flask 设置
FLASK_HOST = "127.0.0.1"
FLASK_PORT = 5000
FLASK_DEBUG = False
