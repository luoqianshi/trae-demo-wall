import os

# ═══════════════════════════════════════════════════════════
#  LLM 配置 — 全部使用国内服务，不需要翻墙
# ═══════════════════════════════════════════════════════════
# 可选值: "bailian" | "volcengine" | "ollama" | "deepseek" | "openai"
#
#   bailian     → ⭐ 推荐！阿里云百炼，Qwen 模型
#                 新用户免费 7000万 token，有效期 90 天
#                 注册: https://bailian.console.aliyun.com/
#   volcengine  → 火山引擎豆包，每天 200万 token 免费
#   ollama      → 完全离线本地运行，零成本
#   deepseek    → 需要 API Key，付费
#   openai      → 需要 API Key，付费，需要翻墙
# ═══════════════════════════════════════════════════════════
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "bailian")

# ─── 阿里云百炼（⭐ 推荐：国内免费最强）───
# 获取 Key: https://bailian.console.aliyun.com/ → API-KEY 管理 → 创建 API Key
# 免费额度: 新用户 7000万 token（90天有效）
# Base URL 兼容 OpenAI 格式
BAILIAN_API_KEY = os.getenv("BAILIAN_API_KEY", "sk-ws-H.EMMRHMH.hgP7.MEUCIQDpMRxM6QmqVscEz2ReawxGrNz7QwEnozS2nd5SrfChUgIgDKUSkTvKzyHKNPTjZQgzGDGcoVsljqr8XwtIMwSBnsk")
BAILIAN_BASE_URL = os.getenv("BAILIAN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1")
BAILIAN_MODEL = os.getenv("BAILIAN_MODEL", "qwen-plus")
# 可选模型:
#   "qwen-turbo"       — 快速，免费额度内可用
#   "qwen-plus"         — 均衡，推荐（适合检索答案生成）
#   "qwen-max"          — 最强推理（适合复杂对比分析）
#   "qwen-long"         — 超长上下文（100万token）

# ─── 火山引擎 / 豆包（每天 200万 token 免费）───
VOLCENGINE_API_KEY = os.getenv("VOLCENGINE_API_KEY", "")
VOLCENGINE_BASE_URL = os.getenv("VOLCENGINE_BASE_URL", "https://ark.cn-beijing.volces.com/api/v3")
VOLCENGINE_MODEL = os.getenv("VOLCENGINE_MODEL", "doubao-pro-32k")

# ─── Ollama（本地免费，完全离线）───
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434/v1")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "qwen2.5:7b")

# ─── DeepSeek（需要 API Key）───
DEEPSEEK_API_KEY = os.getenv("DEEPSEEK_API_KEY", "")
DEEPSEEK_BASE_URL = os.getenv("DEEPSEEK_BASE_URL", "https://api.deepseek.com")
DEEPSEEK_MODEL = "deepseek-chat"

# ─── OpenAI（付费，需要翻墙）───
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
OPENAI_MODEL = "gpt-4o"

# ─── Embedding 配置 ───
# 改用阿里云百炼 API Embedding，不需要下载模型，不占本地内存
EMBEDDING_PROVIDER = os.getenv("EMBEDDING_PROVIDER", "bailian")
EMBEDDING_MODEL = "text-embedding-v3"
# API Embedding Key（复用百炼 Key，免费额度内）
EMBEDDING_API_KEY = BAILIAN_API_KEY
EMBEDDING_BASE_URL = BAILIAN_BASE_URL

# ─── 分块参数 ───
CHUNK_SIZE = 800
CHUNK_OVERLAP = 150

# ─── 检索参数 ───
TOP_K = 5

# ─── 本地存储路径 ───
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "uploads")
CHROMA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "data", "chroma_db")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(CHROMA_DIR, exist_ok=True)
