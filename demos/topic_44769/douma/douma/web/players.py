"""运行时选手配置层：可写、持久化、加密。

与只读的 douma/config.py 分层解耦：
- config.py：镜像内置的出厂配置（只读），用于首次初始化。
- 本模块：运行时可写的 players.yaml（落 Docker 卷），界面增删选手即改此文件。

安全红线：API key 落盘只存密文（Fernet），明文 key 绝不入文件/日志/前端响应。
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

import yaml

from ..config import AppConfig, ModelConfig, load_config

# 运行时数据目录（容器中挂载为 Docker 卷，保证重启不丢）
RUNTIME_DIR_ENV = "DOUMA_RUNTIME_DIR"
# 加密主密钥的环境变量；缺省时自动在运行时目录生成并持久化
SECRET_ENV = "DOUMA_SECRET"
# 首次初始化的出厂配置文件名（含 5 位默认选手）
DEFAULT_SEED_CONFIG = "config.volc.yaml"


@dataclass
class Player:
    """单个参赛选手（运行时配置）。

    api_key 有两种来源，二选一：
    - api_key_env：从环境变量读取（出厂选手用 ARK_API_KEY，key 永不落盘）。
    - api_key_enc：界面新增选手填入的明文 key 加密后的密文。
    """

    name: str
    adapter: str = "openai"
    base_url: str = ""
    model: str = ""
    api_key_env: str = ""
    api_key_enc: str = ""           # Fernet 密文，绝不外泄
    extra: dict = field(default_factory=dict)


class PlayerStore:
    """选手配置仓库：加载/持久化 players.yaml，并管理加密主密钥。"""

    def __init__(self, root_dir: Path):
        self.root_dir = Path(root_dir)
        self.runtime_dir = Path(
            os.environ.get(RUNTIME_DIR_ENV, self.root_dir / "runtime")
        )
        self.players_path = self.runtime_dir / "players.yaml"
        self._fernet = None  # 延迟初始化，避免无 cryptography 时影响其他功能

    # —— 加密主密钥 ——
    def _get_fernet(self):
        """获取 Fernet 实例：优先环境变量 DOUMA_SECRET，否则用卷内持久化密钥。"""
        if self._fernet is not None:
            return self._fernet
        from cryptography.fernet import Fernet

        secret = os.environ.get(SECRET_ENV, "").strip()
        if not secret:
            secret = self._load_or_create_secret()
        self._fernet = Fernet(secret.encode() if isinstance(secret, str) else secret)
        return self._fernet

    def _load_or_create_secret(self) -> str:
        """从卷内读取主密钥；不存在则生成并持久化（开箱即用，无需手工配密钥）。"""
        from cryptography.fernet import Fernet

        secret_path = self.runtime_dir / ".secret"
        if secret_path.exists():
            return secret_path.read_text(encoding="utf-8").strip()
        self.runtime_dir.mkdir(parents=True, exist_ok=True)
        key = Fernet.generate_key().decode()
        secret_path.write_text(key, encoding="utf-8")
        secret_path.chmod(0o600)
        return key

    def encrypt(self, plaintext: str) -> str:
        """加密明文 key 为可落盘的密文。"""
        return self._get_fernet().encrypt(plaintext.encode()).decode()

    def _decrypt(self, ciphertext: str) -> str:
        """解密密文 key（仅运行期使用，绝不返回前端）。"""
        return self._get_fernet().decrypt(ciphertext.encode()).decode()

    # —— 加载与持久化 ——
    # 出厂自带的两位 mock 选手：开箱即玩，零配置就能跑完整演示流程
    _BUILTIN_MOCK_PLAYERS = [
        Player(name="mock-学霸", adapter="mock",
               extra={"mode": "reference", "latency": 0.3}),
        Player(name="mock-躺平", adapter="mock",
               extra={"mode": "buggy", "latency": 0.2}),
    ]

    def _ensure_seeded(self) -> None:
        """首次启动：players.yaml 不存在则用出厂配置初始化。

        无论是否有 config.volc.yaml，都会预置两位 mock 选手保证开箱即玩；
        生产干净镜像（无 config.volc.yaml）则仅带这两位 mock 选手。
        """
        if self.players_path.exists():
            return
        seed_players: list[Player] = list(self._BUILTIN_MOCK_PLAYERS)
        seed_path = self.root_dir / DEFAULT_SEED_CONFIG
        if seed_path.exists():
            try:
                cfg = load_config(seed_path)
                # 避免和 mock 选手重名
                existing = {p.name for p in seed_players}
                for m in cfg.models:
                    if m.adapter == "mock" or m.name in existing:
                        continue
                    seed_players.append(Player(
                        name=m.name,
                        adapter=m.adapter,
                        base_url=m.base_url,
                        model=m.model,
                        api_key_env=m.api_key_env,
                        extra=dict(m.extra),
                    ))
            except Exception:
                pass
        self._save(seed_players)

    def load(self) -> list[Player]:
        """加载全部选手（首启自动初始化）。"""
        self._ensure_seeded()
        if not self.players_path.exists():
            return []
        raw = yaml.safe_load(self.players_path.read_text(encoding="utf-8")) or {}
        return [
            Player(
                name=p["name"],
                adapter=p.get("adapter", "openai"),
                base_url=p.get("base_url", ""),
                model=p.get("model", ""),
                api_key_env=p.get("api_key_env", ""),
                api_key_enc=p.get("api_key_enc", ""),
                extra=p.get("extra", {}),
            )
            for p in raw.get("players", [])
        ]

    def _save(self, players: list[Player]) -> None:
        """持久化选手列表到 players.yaml（含密文，不含明文）。"""
        self.runtime_dir.mkdir(parents=True, exist_ok=True)
        data = {
            "players": [
                {
                    "name": p.name,
                    "adapter": p.adapter,
                    "base_url": p.base_url,
                    "model": p.model,
                    "api_key_env": p.api_key_env,
                    "api_key_enc": p.api_key_enc,
                    "extra": p.extra,
                }
                for p in players
            ]
        }
        self.players_path.write_text(
            yaml.safe_dump(data, allow_unicode=True, sort_keys=False), encoding="utf-8"
        )

    # —— CRUD ——
    def add(self, name: str, model: str, base_url: str,
            api_key: str = "", adapter: str = "openai", extra: dict | None = None) -> Player:
        """新增选手。api_key 非空则加密落盘。"""
        players = self.load()
        if any(p.name == name for p in players):
            raise ValueError(f"选手已存在：{name}")
        player = Player(
            name=name, adapter=adapter, base_url=base_url, model=model,
            api_key_enc=self.encrypt(api_key) if api_key else "",
            extra=extra or {},
        )
        players.append(player)
        self._save(players)
        return player

    def update(self, name: str, *, model: str | None = None, base_url: str | None = None,
               api_key: str | None = None, extra: dict | None = None) -> Player:
        """修改选手。api_key 为 None 表示不变；非空字符串则重新加密。"""
        players = self.load()
        target = next((p for p in players if p.name == name), None)
        if target is None:
            raise KeyError(f"选手不存在：{name}")
        if model is not None:
            target.model = model
        if base_url is not None:
            target.base_url = base_url
        if extra is not None:
            target.extra = extra
        if api_key:                       # 仅在传入非空 key 时更新密文
            target.api_key_enc = self.encrypt(api_key)
            target.api_key_env = ""       # 改用界面 key 后不再依赖环境变量
        self._save(players)
        return target

    def remove(self, name: str) -> None:
        """删除选手。"""
        players = self.load()
        kept = [p for p in players if p.name != name]
        if len(kept) == len(players):
            raise KeyError(f"选手不存在：{name}")
        self._save(kept)

    def get(self, name: str) -> Player | None:
        return next((p for p in self.load() if p.name == name), None)

    # —— 运行期取 key 与适配 ——
    def resolve_api_key(self, player: Player) -> str:
        """运行期解析选手真实 key：界面密文优先，其次环境变量。"""
        if player.api_key_enc:
            try:
                return self._decrypt(player.api_key_enc)
            except Exception:
                return ""
        if player.api_key_env:
            return os.environ.get(player.api_key_env, "")
        return ""

    def api_key_ready(self, player: Player) -> bool:
        """该选手是否已具备可用 key（不暴露 key 本身）。"""
        return bool(self.resolve_api_key(player))

    def to_app_config(self, names: list[str], base: AppConfig) -> AppConfig:
        """把选中的选手转为评测引擎可用的 AppConfig。

        界面填入的明文 key 通过临时环境变量注入，复用 ModelConfig.api_key 的
        "从环境变量读取" 机制，避免在 ModelConfig 中新增明文字段、守住安全约束。
        """
        players = {p.name: p for p in self.load()}
        models: list[ModelConfig] = []
        for name in names:
            p = players.get(name)
            if p is None:
                continue
            key_env = p.api_key_env
            if p.api_key_enc:
                # 为界面选手分配一个进程内环境变量名，注入解密后的 key
                key_env = f"_DOUMA_KEY_{abs(hash(name)) % (10**8)}"
                os.environ[key_env] = self._decrypt(p.api_key_enc)
            models.append(ModelConfig(
                name=p.name, adapter=p.adapter, base_url=p.base_url,
                api_key_env=key_env, model=p.model, extra=dict(p.extra),
            ))
        cfg = AppConfig(models=models,
                        max_concurrency=base.max_concurrency,
                        agentic_max_rounds=base.agentic_max_rounds)
        return cfg
