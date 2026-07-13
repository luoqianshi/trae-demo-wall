"""应用配置，从 .env 读取。"""
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # OpenAI (已弃用，保留配置项兼容)
    openai_api_key: str = ""
    openai_base_url: str = "https://api.openai.com/v1"
    llm_model: str = "gpt-4o"

    # DeepSeek V4 - 文本生成（降级备份，默认使用 Agnes）
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com"
    deepseek_model: str = "deepseek-chat"

    # Agnes AI - 文本 + 图片 + 视频生成
    agnes_api_key: str = ""
    agnes_base_url: str = "https://apihub.agnes-ai.com/v1"
    agnes_text_model: str = "agnes-2.0-flash"
    agnes_image_model: str = "agnes-image-2.1-flash"
    agnes_storyboard_size: str = "2048x1152"  # 2K 16:9
    agnes_asset_size: str = "1024x1024"  # 1K
    agnes_video_model: str = "agnes-video-v2.0"
    agnes_video_num_frames: int = 121
    agnes_video_frame_rate: int = 24
    agnes_video_width: int = 1152
    agnes_video_height: int = 768

    # 频率控制（秒）- Agnes 免费层 RPM 限制
    text_interval: float = 3.0  # 文本 20 RPM
    image_2k_interval: float = 32.0  # 2K 图片 2 RPM
    image_1k_interval: float = 4.0  # 1K 图片 20 RPM
    video_create_interval: float = 60.0  # 视频 20 RPM
    video_poll_interval: float = 10.0  # 视频轮询间隔
    video_poll_timeout: int = 600  # 视频任务超时（秒）

    # 图片生成 API（OpenAI 兼容同步接口，旧配置保留兼容）
    image_base_url: str = "http://localhost:8080/v1"
    image_api_key: str = ""
    image_model: str = "gpt-image-2"
    image_size: str = "2560x1440"

    # lk888 gpt-image-2 - 图片生成（异步任务模式，备用）
    lk888_api_key: str = ""
    lk888_base_url: str = "https://api.lk888.ai/v1"

    # 本地图片公网访问地址（备用）
    public_base_url: str = ""

    # 存储
    storage_dir: Path = Path(__file__).resolve().parent.parent / "storage"
    db_url: str = f"sqlite:///{Path(__file__).resolve().parent.parent / 'app.db'}"

    # 生成参数
    storyboards_per_minute: int = 4  # 1 分钟 = 4 个 15 秒故事板
    asset_concurrency: int = 3  # 资产生成并发上限

    # 图片轮询参数（仅 lk888 异步模式使用）
    image_poll_interval: int = 5  # 轮询间隔（秒）
    image_poll_timeout: int = 300  # 轮询超时（秒）


settings = Settings()
settings.storage_dir.mkdir(parents=True, exist_ok=True)
