import random
from datetime import datetime, timedelta, timezone


class VerificationCodeService:
    """本地验证码服务：当前用于开发/单实例运行，后续可替换为 Redis 或短信/邮箱服务商。"""

    _codes: dict[tuple[str, str], dict] = {}
    CODE_TTL_SECONDS = 300

    @classmethod
    def generate_email_code(cls, email: str, scene: str) -> dict:
        cls._clear_expired()
        normalized_email = email.strip().lower()
        code = f"{random.randint(0, 999999):06d}"
        expires_at = datetime.now(timezone.utc) + timedelta(seconds=cls.CODE_TTL_SECONDS)

        cls._codes[(normalized_email, scene)] = {
            "code": code,
            "expires_at": expires_at,
        }

        return {
            "email": normalized_email,
            "scene": scene,
            "code": code,
            "expires_in": cls.CODE_TTL_SECONDS,
            "message": "验证码已生成，请在5分钟内完成验证",
        }

    @classmethod
    def verify_email_code(cls, email: str, scene: str, code: str) -> None:
        cls._clear_expired()
        normalized_email = email.strip().lower()
        cache_key = (normalized_email, scene)
        cached = cls._codes.get(cache_key)

        if not cached:
            raise ValueError("验证码不存在或已过期，请重新获取")

        if cached["code"] != code.strip():
            raise ValueError("验证码错误")

        cls._codes.pop(cache_key, None)

    @classmethod
    def _clear_expired(cls) -> None:
        now = datetime.now(timezone.utc)
        expired_keys = [
            key for key, value in cls._codes.items()
            if value["expires_at"] <= now
        ]
        for key in expired_keys:
            cls._codes.pop(key, None)
