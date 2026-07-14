"""图像生成：可替换 Provider 结构。

- LocalFallbackGenerator：本地 SVG 程序化生成，无外部依赖，无 API Key 也能完整演示。
- ExternalImageGenerator：调用外部图像生成 API；未配置 Key 时自动回退到本地。

生成的文件保存到 backend/outputs/，返回可访问的 URL。
日志中绝不输出 API Key。
"""
from __future__ import annotations

import hashlib
import logging
import random
import time
from abc import ABC, abstractmethod

from config import get_settings
from schemas import Analysis, GeneratedImage
from services import intent_analyzer

logger = logging.getLogger("avatar.imagegen")


# ============ Provider 抽象 ============

class ImageGenerator(ABC):
    """图像生成 Provider 抽象基类。"""

    @abstractmethod
    def generate(self, prompt: str, negative_prompt: str, size: str,
                 analysis: Analysis, text: str) -> GeneratedImage:
        ...


# ============ 本地 SVG 兜底生成器 ============

# 与前端概念对齐的色卡：[主色1, 主色2, 暗色/描边, 亮色/高光]
PALETTES: dict[str, list[str]] = {
    "tech":   ["#1cd6ff", "#6d5dfc", "#101327", "#eaf8ff"],
    "cyber":  ["#ff3ca6", "#7c3cff", "#120626", "#29f3ff"],
    "warm":   ["#ffb7c5", "#ffc857", "#7a3b69", "#fff5e6"],
    "mono":   ["#111111", "#444444", "#000000", "#f7f7f7"],
    "pixel":  ["#ff4d6d", "#ffd166", "#118ab2", "#06d6a0"],
    "nature": ["#71d99e", "#2f9c95", "#264653", "#f4f6d7"],
    "anime":  ["#ff8fb3", "#9b5cff", "#3a1a52", "#ffe6ff"],
    "purple": ["#9b5cff", "#24d1ff", "#17162d", "#ffe6ff"],
}


class LocalFallbackGenerator(ImageGenerator):
    """本地 SVG 兜底生成器：按风格派发不同 SVG 模板，无外部依赖。"""

    provider_name = "local-fallback"

    def generate(self, prompt: str, negative_prompt: str, size: str,
                 analysis: Analysis, text: str) -> GeneratedImage:
        palette_key = intent_analyzer.detect_palette(text)
        seed = random.randint(1, 100000)
        variant = (len(text) + seed) % 10
        svg = _build_svg(palette_key, variant)

        # 保存为 .svg 文件
        output_dir = get_settings().output_path
        filename = f"avatar_{int(time.time())}_{seed}.svg"
        file_path = output_dir / filename
        file_path.write_text(svg, encoding="utf-8")

        logger.info("local fallback generated: %s (palette=%s)", filename, palette_key)

        return GeneratedImage(
            image_url=f"/outputs/{filename}",
            prompt=prompt,
            negative_prompt=negative_prompt,
            provider=self.provider_name,
            seed=seed,
            metadata={
                "styles": analysis.styles,
                "colors": analysis.colors,
                "usage": analysis.usages,
                "palette": palette_key,
                "note": "本地 SVG 程序化生成，非真实 AI 图像",
            },
        )


# ============ 外部图像生成器（DiceBear 真实调用 + 自动回退） ============

# DiceBear 公共 API 默认地址（无需 API Key）
DICEBEAR_DEFAULT_BASE = "https://api.dicebear.com/10.x"


def _pick_dicebear_style(analysis: Analysis) -> str:
    """根据 analysis 推断合适的 DiceBear 风格。

    - 程序员 / 机器人 / 科技风：bottts
    - 像素风 / 游戏风：pixel-art
    - 人物头像：adventurer / lorelei / avataaars
    - 默认兜底：pixel-art
    """
    styles = analysis.styles or []
    subjects = analysis.subjects or []
    joined = " ".join(styles + subjects).lower()

    # 程序员 / 机器人 / 科技感 / 未来感 → bottts
    if any(k in joined for k in ("程序员", "开发者", "机器人", "科技感", "未来感", "职业头像")):
        return "bottts"
    # 像素风 / 游戏风 → pixel-art
    if any(k in joined for k in ("像素", "游戏")):
        return "pixel-art"
    # 二次元 / 动漫 → adventurer
    if any(k in joined for k in ("二次元", "动漫", "anime")):
        return "adventurer"
    # 治愈系 / 温柔 / 可爱 → lorelei
    if any(k in joined for k in ("治愈", "温柔", "可爱")):
        return "lorelei"
    # 明确的人物头像 → avataaars
    if any(k in joined for k in ("人物", "虚拟人物", "动漫角色")):
        return "avataaars"
    # 默认兜底
    return "pixel-art"


def _parse_size(size: str) -> int:
    """解析尺寸字符串为 DiceBear 的 size 参数。

    "78x78" → 78, "128x128" → 128, "512x512" → 512。
    解析失败或非法时默认 128。
    DiceBear png 端点 size 范围 1-1024，这里截断到 256 避免过大。
    """
    try:
        s = str(size or "").strip().lower()
        if "x" in s:
            w = int(s.split("x")[0])
        else:
            w = int(s)
        if w < 1:
            return 128
        return min(w, 256)
    except Exception:
        return 128


def _stable_seed(text: str) -> str:
    """根据文本生成稳定的 DiceBear seed（URL 安全的 hex 串）。

    相同输入 → 相同 seed → 相同头像。
    """
    return hashlib.sha256(text.encode("utf-8")).hexdigest()[:16]


class ExternalImageGenerator(ImageGenerator):
    """外部图像生成 Provider（DiceBear）。

    - 若未配置 API Key，自动回退到 LocalFallbackGenerator（保持现有兼容逻辑）。
    - 配置了 Key 后，调用 DiceBear 公共 API 生成头像。
      DiceBear 本身不需要 Key，但现有配置结构以 _has_key 作为「是否启用外部调用」的开关，
      故保留该判断：只有配置了任意非空 Key 才走真实外部调用。
    - 任何失败（网络异常 / 非 2xx / 空响应 / 非图片内容）都安全回退到本地。
    日志只输出是否配置了 Key，绝不输出 Key 本身或完整请求头。
    """

    provider_name = "external"

    def __init__(self) -> None:
        self.settings = get_settings()
        self._fallback = LocalFallbackGenerator()
        self._has_key = self.settings.has_external_image_key()
        if self._has_key:
            logger.info("external image provider configured: base_url=%s model=%s (key hidden)",
                        self.settings.image_api_base_url or "(empty)",
                        self.settings.image_model or "(empty)")
        else:
            # 明确说明为什么走 local：IMAGE_PROVIDER=external 但 IMAGE_API_KEY 为空
            logger.warning(
                "IMAGE_PROVIDER=external but IMAGE_API_KEY is empty; "
                "falling back to local-fallback. "
                "Set IMAGE_API_KEY to any non-empty value to enable DiceBear."
            )

    def _resolve_base_url(self) -> str:
        """解析 DiceBear API 基础地址，未配置时使用默认值。"""
        base = (self.settings.image_api_base_url or "").strip()
        if not base:
            return DICEBEAR_DEFAULT_BASE
        return base.rstrip("/")

    def generate(self, prompt: str, negative_prompt: str, size: str,
                 analysis: Analysis, text: str) -> GeneratedImage:
        # 保持现有兼容逻辑：无 Key 时回退到本地
        if not self._has_key:
            return self._fallback.generate(prompt, negative_prompt, size, analysis, text)

        try:
            return self._call_dicebear(prompt, negative_prompt, size, analysis, text)
        except Exception as e:
            # 任何异常都安全回退，绝不抛给调用方
            logger.error("external image generation failed: %s; falling back to local", e)
            return self._fallback.generate(prompt, negative_prompt, size, analysis, text)

    def _call_dicebear(self, prompt: str, negative_prompt: str, size: str,
                       analysis: Analysis, text: str) -> GeneratedImage:
        """真实调用 DiceBear API 生成头像。

        使用 PNG 端点（支持 size 参数），下载图片字节保存到 outputs/。
        日志中只出现 style / size / seed 前缀，绝不出现 Key 或完整请求头。
        """
        import httpx

        style = _pick_dicebear_style(analysis)
        seed = _stable_seed(text or prompt)
        px = _parse_size(size)
        base = self._resolve_base_url()
        # DiceBear png 端点：GET {base}/{style}/png?seed={seed}&size={px}
        url = f"{base}/{style}/png?seed={seed}&size={px}"

        # 日志只记录非敏感信息：style / size / seed 前缀，绝不记录 Key 或 headers
        logger.info("dicebear request: style=%s size=%d seed_prefix=%s",
                    style, px, seed[:4])

        # httpx 同步调用（本方法在 asyncio.to_thread 中运行）
        timeout = httpx.Timeout(10.0, connect=5.0)
        with httpx.Client(timeout=timeout, follow_redirects=True) as client:
            resp = client.get(url)

        # 非 2xx → 回退
        if resp.status_code < 200 or resp.status_code >= 300:
            logger.warning("dicebear non-2xx status=%d, falling back to local", resp.status_code)
            return self._fallback.generate(prompt, negative_prompt, size, analysis, text)

        content = resp.content
        # 空响应 → 回退
        if not content:
            logger.warning("dicebear empty content, falling back to local")
            return self._fallback.generate(prompt, negative_prompt, size, analysis, text)

        # 校验是否为 PNG 图片（PNG 文件头：\x89PNG\r\n\x1a\n）
        if not content.startswith(b"\x89PNG\r\n\x1a\n"):
            logger.warning("dicebear content not png, falling back to local")
            return self._fallback.generate(prompt, negative_prompt, size, analysis, text)

        # 保存到 outputs/
        output_dir = self.settings.output_path
        ts = int(time.time())
        filename = f"avatar_dicebear_{ts}_seed{seed}.png"
        file_path = output_dir / filename
        file_path.write_bytes(content)

        # 用 seed 派生一个数字 seed 字段（保持与其它 Provider 一致的返回结构）
        numeric_seed = int(seed, 16) % (2**31)

        logger.info("dicebear generated: %s (style=%s size=%d)", filename, style, px)

        return GeneratedImage(
            image_url=f"/outputs/{filename}",
            prompt=prompt,
            negative_prompt=negative_prompt,
            provider=self.provider_name,
            seed=numeric_seed,
            metadata={
                "styles": analysis.styles,
                "colors": analysis.colors,
                "usage": analysis.usages,
                "dicebear_style": style,
                "dicebear_seed": seed,
                "size_px": px,
                "source": "DiceBear",
                "license": "CC0 / MIT (DiceBear)",
                "note": "由 DiceBear 公共 API 生成的开源头像",
            },
        )


# ============ 工厂 ============

_generator: ImageGenerator | None = None


def get_generator(provider: str | None = None) -> ImageGenerator:
    """根据配置或指定 provider 返回生成器。

    provider 解析规则（大小写不敏感，去除首尾空格）：
      - None / "" / "auto"  → 读 .env 的 IMAGE_PROVIDER 配置
      - "dcgan-celeba-local" → 走 DCGAN Provider
      - "external"           → 走 DiceBear 外部 Provider
      - "local"              → 走本地 SVG 兜底

    provider 参数优先于配置文件，但 provider="auto" 时会回退到配置文件，
    这样前端不强制指定 provider 就能让后端按 .env 配置走。
    """
    settings = get_settings()
    raw = (provider or "").strip().lower()
    # auto / 空 → 读 .env 配置
    if raw in ("", "auto"):
        raw = (settings.image_provider or "local").strip().lower()
        logger.info("provider=auto, using .env IMAGE_PROVIDER=%s", raw)

    if raw == "dcgan-celeba-local":
        # 懒导入，避免未装 torch 时 import 报错
        from services.dcgan_celeba_generator import get_dcgan_generator
        return get_dcgan_generator()
    if raw == "external":
        return ExternalImageGenerator()
    return LocalFallbackGenerator()


# ============ SVG 模板（与前端风格对齐，简化版） ============

def _build_svg(palette_key: str, variant: int) -> str:
    p = PALETTES.get(palette_key, PALETTES["purple"])
    c1, c2, c3, c4 = p
    key = palette_key

    if key == "tech":
        return _tech_svg(c1, c2, c3, c4)
    if key == "cyber":
        return _cyber_svg(c1, c2, c3, c4, variant)
    if key == "warm":
        return _cat_svg(c1, c2, c3, c4, variant)
    if key == "mono":
        return _mono_svg(c1, c2, c3, c4, variant)
    if key == "pixel":
        return _pixel_svg(c1, c2, c3, c4)
    if key == "nature":
        return _nature_svg(c1, c2, c3, c4)
    if key == "anime":
        return _anime_svg(c1, c2, c3, c4)
    return _default_svg(c1, c2, c3, c4, variant)


def _tech_svg(c1, c2, c3, c4):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 260 260">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>
      <circle cx="130" cy="130" r="124" fill="url(#bg)"/>
      <g stroke="{c4}" stroke-opacity=".22" stroke-width="1.2" fill="none"><path d="M30 80 H96 V120"/><path d="M230 60 H164 V100"/></g>
      <rect x="76" y="84" width="108" height="104" rx="28" fill="{c4}"/>
      <rect x="76" y="84" width="108" height="104" rx="28" fill="none" stroke="{c2}" stroke-width="2"/>
      <line x1="130" y1="84" x2="130" y2="58" stroke="{c4}" stroke-width="4"/><circle cx="130" cy="52" r="7" fill="{c1}"/>
      <rect x="90" y="116" width="80" height="24" rx="12" fill="{c3}"/>
      <rect x="98" y="122" width="28" height="12" rx="6" fill="{c1}"/><rect x="134" y="122" width="28" height="12" rx="6" fill="{c1}"/>
      <rect x="108" y="158" width="44" height="7" rx="3.5" fill="{c2}" opacity=".85"/>
    </svg>'''


def _cyber_svg(c1, c2, c3, c4, variant):
    glitch = '<rect x="70" y="150" width="120" height="3" fill="' + c4 + '" opacity=".7"/>' if variant % 2 else ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 260 260">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c2}"/><stop offset="1" stop-color="{c3}"/></linearGradient></defs>
      <circle cx="130" cy="130" r="124" fill="url(#bg)"/>
      <path d="M60 230 C50 170, 70 110, 130 92 C190 110, 210 170, 200 230 Z" fill="{c3}"/>
      <ellipse cx="130" cy="138" rx="52" ry="58" fill="{c4}" opacity=".95"/>
      <rect x="88" y="128" width="84" height="14" rx="7" fill="{c3}"/>
      <rect x="92" y="131" width="34" height="8" rx="4" fill="{c4}"/><rect x="134" y="131" width="34" height="8" rx="4" fill="{c4}"/>
      {glitch}
    </svg>'''


def _cat_svg(c1, c2, c3, c4, variant):
    eyes = (f'<circle cx="110" cy="132" r="9" fill="{c3}"/><circle cx="150" cy="132" r="9" fill="{c3}"/>'
            if variant % 3 else
            f'<path d="M100 132 q10 -6 20 0" stroke="{c3}" stroke-width="4" fill="none"/><path d="M140 132 q10 -6 20 0" stroke="{c3}" stroke-width="4" fill="none"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 260 260">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>
      <circle cx="130" cy="130" r="124" fill="url(#bg)"/>
      <path d="M70 96 L86 48 L120 88 Z" fill="{c4}"/><path d="M190 96 L174 48 L140 88 Z" fill="{c4}"/>
      <ellipse cx="130" cy="142" rx="74" ry="66" fill="{c4}"/>
      {eyes}
      <path d="M124 156 q6 6 12 0" stroke="{c3}" stroke-width="3.5" fill="{c1}"/>
      <circle cx="96" cy="156" r="9" fill="{c1}" opacity=".55"/><circle cx="164" cy="156" r="9" fill="{c1}" opacity=".55"/>
    </svg>'''


def _mono_svg(c1, c2, c3, c4, variant):
    letters = "ABCDEFGHXZ"
    letter = letters[(variant) % len(letters)]
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 260 260">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c4}"/><stop offset="1" stop-color="#dcdcdc"/></linearGradient></defs>
      <circle cx="130" cy="130" r="124" fill="url(#bg)"/>
      <circle cx="130" cy="130" r="98" fill="{c1}"/>
      <text x="130" y="170" font-family="Georgia, serif" font-size="120" font-weight="700" fill="{c4}" text-anchor="middle">{letter}</text>
    </svg>'''


def _pixel_svg(c1, c2, c3, c4):
    r = lambda x, y, w, h, f: f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{f}"/>'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 260 260">
      <rect x="0" y="0" width="260" height="260" fill="{c3}"/>
      {r(78,70,104,16,c4)}{r(98,86,64,120,c4)}
      {r(98,118,16,16,c1)}{r(146,118,16,16,c1)}
      {r(114,150,32,12,c1)}{r(98,174,64,16,c1)}
    </svg>'''


def _nature_svg(c1, c2, c3, c4):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 260 260">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c4}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>
      <circle cx="130" cy="130" r="124" fill="url(#bg)"/>
      <path d="M130 220 V120" stroke="{c3}" stroke-width="6"/>
      <path d="M130 180 C100 170, 80 140, 80 110 C110 110, 130 130, 130 170 Z" fill="{c1}"/>
      <path d="M130 160 C160 150, 180 120, 180 90 C150 90, 130 120, 130 150 Z" fill="{c2}"/>
    </svg>'''


def _anime_svg(c1, c2, c3, c4):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 260 260">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c2}"/><stop offset="1" stop-color="{c3}"/></linearGradient></defs>
      <circle cx="130" cy="130" r="124" fill="url(#bg)"/>
      <path d="M64 124 C60 70, 90 50, 130 50 C170 50, 200 72, 196 124 Z" fill="{c2}"/>
      <ellipse cx="130" cy="138" rx="62" ry="68" fill="{c4}"/>
      <circle cx="100" cy="142" r="9" fill="#fff"/><circle cx="160" cy="142" r="9" fill="#fff"/>
      <circle cx="103" cy="145" r="6" fill="{c3}"/><circle cx="163" cy="145" r="6" fill="{c3}"/>
      <path d="M118 168 q12 10 24 0" stroke="{c3}" stroke-width="3" fill="{c1}"/>
    </svg>'''


def _default_svg(c1, c2, c3, c4, variant):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 260 260">
      <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{c1}"/><stop offset="1" stop-color="{c2}"/></linearGradient></defs>
      <circle cx="130" cy="130" r="124" fill="url(#bg)"/>
      <ellipse cx="130" cy="134" rx="70" ry="76" fill="{c4}"/>
      <circle cx="105" cy="116" r="9" fill="{c3}"/><circle cx="155" cy="116" r="9" fill="{c3}"/>
      <path d="M108 155 Q130 174 152 155" fill="none" stroke="{c3}" stroke-width="8" stroke-linecap="round"/>
    </svg>'''
