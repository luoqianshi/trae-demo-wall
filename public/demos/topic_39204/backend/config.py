from __future__ import annotations

from dataclasses import dataclass, field
from os import getenv
from pathlib import Path

from dotenv import load_dotenv


load_dotenv(Path(__file__).resolve().parent / ".env")


@dataclass(slots=True)
class Settings:
    host: str = getenv("QN_BACKEND_HOST", "127.0.0.1")
    port: int = int(getenv("QN_BACKEND_PORT", "8000"))
    heartbeat_interval: float = float(getenv("QN_HEARTBEAT_INTERVAL", "10"))
    mock_interval: float = float(getenv("QN_MOCK_INTERVAL", "1.5"))
    mock_chunk_interval: float = float(getenv("QN_MOCK_CHUNK_INTERVAL", "0.45"))
    tencent_app_id: str = getenv("TENCENTCLOUD_APP_ID", "")
    tencent_secret_id: str = getenv("TENCENTCLOUD_SECRET_ID", "")
    tencent_secret_key: str = getenv("TENCENTCLOUD_SECRET_KEY", "")
    tencent_asr_region: str = getenv("TENCENTCLOUD_ASR_REGION", "ap-shanghai")
    deepseek_api_key: str = getenv("QN_DEEPSEEK_API_KEY", "")
    deepseek_base_url: str = getenv("QN_DEEPSEEK_BASE_URL", "https://api.deepseek.com")
    deepseek_model: str = getenv("QN_DEEPSEEK_MODEL", "deepseek-v4-flash")
    deepseek_timeout: float = float(getenv("QN_DEEPSEEK_TIMEOUT", "30"))
    admin_token: str = getenv("QN_ADMIN_TOKEN", "")
    supported_pairs: list[tuple[str, str]] = field(
        default_factory=lambda: [
            ("zh", "en"),
            ("en", "zh"),
            ("zh", "ja"),
            ("ja", "zh"),
            ("zh", "ar"),
            ("ar", "zh"),
        ]
    )
    mock_scripts: dict[str, list[dict[str, str]]] = field(
        default_factory=lambda: {
            "zh|en": [
                {
                    "source": "欢迎使用实时同声传译。",
                    "target": "Welcome to real-time simultaneous interpretation.",
                },
                {
                    "source": "请把手机靠近发言人，以获得更稳定的收音效果。",
                    "target": "Keep the phone close to the speaker for more stable voice capture.",
                },
                {
                    "source": "翻译结果会实时显示在屏幕中央。",
                    "target": "Translation results will appear in the center of the screen in real time.",
                },
            ],
            "en|zh": [
                {
                    "source": "Welcome to real-time simultaneous interpretation.",
                    "target": "欢迎使用实时同声传译。",
                },
                {
                    "source": "Keep the phone close to the speaker for more stable voice capture.",
                    "target": "请把手机靠近发言人，以获得更稳定的收音效果。",
                },
                {
                    "source": "Translation results will appear in the center of the screen in real time.",
                    "target": "翻译结果会实时显示在屏幕中央。",
                },
            ],
            "zh|ja": [
                {
                    "source": "欢迎使用实时同声传译。",
                    "target": "リアルタイム同時通訳へようこそ。",
                },
                {
                    "source": "请把手机靠近发言人，以获得更稳定的收音效果。",
                    "target": "より安定した集音のため、スマートフォンを話者に近づけてください。",
                },
                {
                    "source": "翻译结果会实时显示在屏幕中央。",
                    "target": "翻訳結果は画面中央にリアルタイムで表示されます。",
                },
            ],
            "ja|zh": [
                {
                    "source": "リアルタイム同時通訳へようこそ。",
                    "target": "欢迎使用实时同声传译。",
                },
                {
                    "source": "より安定した集音のため、スマートフォンを話者に近づけてください。",
                    "target": "请把手机靠近发言人，以获得更稳定的收音效果。",
                },
                {
                    "source": "翻訳結果は画面中央にリアルタイムで表示されます。",
                    "target": "翻译结果会实时显示在屏幕中央。",
                },
            ],
            "zh|ar": [
                {
                    "source": "欢迎使用实时同声传译。",
                    "target": "مرحبًا بك في الترجمة الفورية المباشرة.",
                },
                {
                    "source": "请把手机靠近发言人，以获得更稳定的收音效果。",
                    "target": "قرّب الهاتف من المتحدث للحصول على التقاط صوت أكثر استقرارًا.",
                },
                {
                    "source": "翻译结果会实时显示在屏幕中央。",
                    "target": "ستظهر نتائج الترجمة في منتصف الشاشة بشكل فوري.",
                },
            ],
            "ar|zh": [
                {
                    "source": "مرحبًا بك في الترجمة الفورية المباشرة.",
                    "target": "欢迎使用实时同声传译。",
                },
                {
                    "source": "قرّب الهاتف من المتحدث للحصول على التقاط صوت أكثر استقرارًا.",
                    "target": "请把手机靠近发言人，以获得更稳定的收音效果。",
                },
                {
                    "source": "ستظهر نتائج الترجمة في منتصف الشاشة بشكل فوري.",
                    "target": "翻译结果会实时显示在屏幕中央。",
                },
            ],
        }
    )


settings = Settings()
