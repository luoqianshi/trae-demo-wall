"""DCGAN-CelebA 本地头像生成 Provider。

特点：
- 完全本地运行，不调用任何外部付费图像生成 API。
- 懒加载 torch：未安装 torch 时返回明确错误，不崩溃。
- 权重缺失时返回明确错误，不静默生成错误图片。
- 文本→seed 映射：同一句话生成稳定结果，regenerate 时加入扰动。
- Pillow 风格后处理：模拟科技感/赛博朋克/治愈系/极简等色调。

重要边界：DCGAN 是无条件生成模型，文本不直接控制人脸语义，
仅用于 seed 与后处理。生成结果为虚拟头像，不代表真实人物。
"""
from __future__ import annotations

import hashlib
import logging
import random
import time
from pathlib import Path

from config import get_settings, BACKEND_DIR
from schemas import Analysis, GeneratedImage
from services import intent_analyzer

logger = logging.getLogger("avatar.dcgan")

PROVIDER_NAME = "dcgan-celeba-local"
NOTICE = "This is a virtual avatar generated locally by DCGAN-CelebA. It is not a real person."


class DCGANWeightsNotFoundError(Exception):
    """权重文件未找到。"""


class DCGANTorchNotAvailableError(Exception):
    """torch 未安装。"""


def text_to_seed(text: str, regenerate: bool = False) -> int:
    """根据文本生成稳定的随机种子。

    同一句话默认生成相同 seed；regenerate=True 时加入随机扰动。
    """
    base = int(hashlib.sha256(text.encode("utf-8")).hexdigest()[:8], 16)
    if regenerate:
        # 加入时间与随机扰动，确保换一张时 seed 不同
        base = (base + random.randint(1, 10_000_000) + int(time.time())) % (2**31)
    return base % (2**31)


class DCGANCelebAGenerator:
    """DCGAN-CelebA 本地生成 Provider。"""

    provider_name = PROVIDER_NAME

    def __init__(self) -> None:
        self.settings = get_settings()
        self._model = None  # 懒加载
        self._device = None
        self._torch = None
        self._weights_path = self._resolve_weights_path()

    def _resolve_weights_path(self) -> Path:
        """从配置读取权重路径，解析为绝对路径。"""
        p = Path(self.settings.dcgan_weights_path)
        if not p.is_absolute():
            p = BACKEND_DIR.parent / p if str(p).startswith("backend/") else BACKEND_DIR.parent / p
        return p

    def _ensure_torch(self):
        """懒加载 torch，未安装时抛 DCGANTorchNotAvailableError。"""
        if self._torch is not None:
            return self._torch
        try:
            import torch  # noqa: F401
            self._torch = torch
            return torch
        except ImportError as e:
            raise DCGANTorchNotAvailableError(
                "torch 未安装。请运行: pip install torch torchvision "
                "（CPU 版本: pip install torch torchvision --index-url "
                "https://download.pytorch.org/whl/cpu）"
            ) from e

    def _resolve_device(self, torch):
        """解析运行设备：配置 CUDA 但不可用时自动回退 CPU。"""
        configured = self.settings.dcgan_device.lower()
        if configured == "cuda" and not torch.cuda.is_available():
            logger.warning("configured DCGAN_DEVICE=cuda but CUDA unavailable, fallback to cpu")
            return torch.device("cpu")
        if configured == "cuda":
            return torch.device("cuda")
        return torch.device("cpu")

    def _load_model(self):
        """加载模型与权重（懒加载，首次生成时执行）。"""
        if self._model is not None:
            return self._model

        torch = self._ensure_torch()
        from models.dcgan_celeba.generator import build_generator

        # 权重检查
        if not self._weights_path.exists():
            raise DCGANWeightsNotFoundError(self._weights_path)

        device = self._resolve_device(torch)
        model = build_generator(
            nz=self.settings.dcgan_nz,
            ngf=self.settings.dcgan_ngf,
            nc=self.settings.dcgan_nc,
        )
        # weights_only=False 兼容旧版 torch；新版可设 True
        try:
            state_dict = torch.load(str(self._weights_path), map_location=device, weights_only=True)
        except TypeError:
            # 旧版 torch 无 weights_only 参数
            state_dict = torch.load(str(self._weights_path), map_location=device)

        model.load_state_dict(state_dict)
        model.to(device)
        model.eval()
        self._model = model
        self._device = device
        logger.info("DCGAN model loaded: weights=%s device=%s", self._weights_path.name, device)
        return model

    def is_available(self) -> tuple[bool, str]:
        """检查 Provider 是否可用（torch 已装 + 权重存在）。

        返回 (available, reason)。reason 在不可用时给出人类可读原因。
        """
        try:
            self._ensure_torch()
        except DCGANTorchNotAvailableError as e:
            return False, str(e)
        if not self._weights_path.exists():
            return False, (
                f"DCGAN 模型权重未找到：{self._weights_path}。"
                "请放置 dcgan_generator.pth 到 backend/models/dcgan_celeba/，"
                "或运行 scripts/train_dcgan_celeba.py 训练，"
                "或运行 scripts/download_or_prepare_weights.py 生成随机权重用于流程验证。"
            )
        return True, ""

    def generate(self, prompt: str, negative_prompt: str, size: str,
                 analysis: Analysis, text: str,
                 regenerate: bool = False, transparent: bool = False) -> GeneratedImage:
        """生成头像。

        参数：
            prompt / negative_prompt: 优化后的提示词（DCGAN 不直接使用，仅记录）
            size: 输出尺寸，如 "512x512"
            analysis: 需求分析结果（用于后处理风格）
            text: 原始用户输入（用于 seed）
            regenerate: 是否换一张（加入随机扰动）
            transparent: 是否生成透明背景的圆形头像
        """
        torch = self._ensure_torch()
        model = self._load_model()

        seed = text_to_seed(text, regenerate=regenerate)
        torch.manual_seed(seed)

        # 生成 latent vector
        nz = self.settings.dcgan_nz
        with torch.no_grad():
            z = torch.randn(1, nz, 1, 1, device=self._device)
            out = model(z)  # (1, 3, 64, 64)，Tanh 归一化到 [-1, 1]

        # 转为 PIL Image
        img = self._tensor_to_pil(out, torch)

        # 后处理：风格化 + 放大 + 可选圆形
        img = self._postprocess(img, analysis, size, transparent)

        # 保存
        output_dir = self.settings.output_path
        ts = time.strftime("%Y%m%d_%H%M%S")
        filename = f"avatar_dcgan_{ts}_seed{seed}.png"
        file_path = output_dir / filename
        save_format = "PNG"
        if transparent:
            img.save(str(file_path), save_format)
        else:
            img.convert("RGB").save(str(file_path), save_format)

        logger.info("DCGAN generated: %s (seed=%s size=%s)", filename, seed, size)

        # 后处理元信息
        postprocess = self._postprocess_meta(analysis)

        return GeneratedImage(
            image_url=f"/outputs/{filename}",
            prompt=prompt,
            negative_prompt=negative_prompt,
            provider=PROVIDER_NAME,
            seed=seed,
            metadata={
                "styles": analysis.styles,
                "colors": analysis.colors,
                "usage": analysis.usages,
                "size": size,
                "transparent": transparent,
                "postprocess": postprocess,
                "notice": NOTICE,
            },
        )

    def _tensor_to_pil(self, tensor, torch):
        """把 DCGAN 输出张量转为 PIL Image（64x64）。"""
        from PIL import Image
        import numpy as np
        # (1,3,64,64) -> (64,64,3)，[-1,1] -> [0,255]
        arr = tensor[0].cpu().numpy()
        arr = np.transpose(arr, (1, 2, 0))  # HWC
        arr = ((arr + 1) / 2 * 255).clip(0, 255).astype("uint8")
        return Image.fromarray(arr, mode="RGB")

    def _postprocess(self, img, analysis: Analysis, size: str, transparent: bool):
        """风格后处理：色调 / 对比度 / 背景渐变 / 放大 / 可选圆形。"""
        from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

        # 解析目标尺寸
        try:
            w, h = (int(x) for x in size.lower().split("x"))
        except Exception:
            w, h = 512, 512

        styles = analysis.styles
        colors = analysis.colors
        palette = intent_analyzer.detect_palette(" ".join(analysis.styles) + " " + " ".join(colors))

        # 1. 色调 / 对比度 后处理
        if "赛博朋克" in styles:
            # 高对比度 + 紫蓝偏色
            img = ImageEnhance.Contrast(img).enhance(1.35)
            img = self._color_tint(img, (255, 60, 180), strength=0.18)  # 紫红
            img = self._color_tint(img, (60, 120, 255), strength=0.12)  # 蓝
        elif "科技感" in styles or "未来感" in styles:
            # 冷色调 + 轻微锐化
            img = self._color_tint(img, (80, 150, 255), strength=0.15)
            img = img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=120))
        elif "治愈系" in styles or "温柔" in styles or "可爱" in styles:
            # 降低对比度 + 暖色/粉色滤镜
            img = ImageEnhance.Contrast(img).enhance(0.88)
            img = ImageEnhance.Color(img).enhance(1.08)
            img = self._color_tint(img, (255, 200, 210), strength=0.18)
        elif "极简" in styles or "黑白" in styles:
            # 转灰度 / 低饱和
            img = img.convert("L").convert("RGB")
            img = ImageEnhance.Color(img).enhance(0.2)
        elif "二次元" in styles:
            # 提饱和 + 粉色
            img = ImageEnhance.Color(img).enhance(1.35)
            img = self._color_tint(img, (255, 150, 200), strength=0.15)
        elif "像素风" in styles:
            # 像素化
            small = img.resize((32, 32), Image.NEAREST)
            img = small.resize((64, 64), Image.NEAREST)
        elif "自然" in styles or "清新" in styles:
            img = self._color_tint(img, (180, 230, 180), strength=0.15)

        # 2. 背景渐变（为头像增加风格化背景边框感）
        img = self._add_gradient_border(img, palette)

        # 3. 放大到目标尺寸
        img = img.resize((w, h), Image.LANCZOS)

        # 4. 可选：圆形透明头像
        if transparent:
            img = self._to_circular(img)

        return img

    def _color_tint(self, img, rgb, strength=0.15):
        """给图像叠加一层颜色滤镜。"""
        from PIL import Image
        overlay = Image.new("RGB", img.size, rgb)
        return Image.blend(img, overlay, strength)

    def _add_gradient_border(self, img, palette):
        """给 64x64 头像加一圈风格化渐变边框。"""
        from PIL import Image, ImageDraw
        gradient_colors = {
            "tech": ((30, 60, 180), (120, 80, 255)),
            "cyber": ((120, 30, 200), (40, 200, 255)),
            "warm": ((255, 180, 200), (255, 220, 150)),
            "mono": ((60, 60, 60), (200, 200, 200)),
            "pixel": ((255, 80, 100), (100, 200, 220)),
            "nature": ((100, 200, 140), (60, 160, 150)),
            "anime": ((255, 140, 180), (180, 100, 255)),
            "purple": ((150, 90, 255), (90, 200, 255)),
        }.get(palette, ((150, 90, 255), (90, 200, 255)))

        w, h = img.size
        canvas = Image.new("RGB", (w + 8, h + 8), gradient_colors[1])
        draw = ImageDraw.Draw(canvas)
        for i in range(4):
            r, g, b = gradient_colors[0]
            r2, g2, b2 = gradient_colors[1]
            ratio = i / 4
            color = (int(r + (r2 - r) * ratio), int(g + (g2 - g) * ratio), int(b + (b2 - b) * ratio))
            draw.rectangle([i, i, w + 8 - i, h + 8 - i], outline=color)
        canvas.paste(img, (4, 4))
        return canvas

    def _to_circular(self, img):
        """把方形头像裁成圆形透明 PNG。"""
        from PIL import Image, ImageDraw
        w, h = img.size
        mask = Image.new("L", (w, h), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse([0, 0, w, h], fill=255)
        result = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        result.paste(img, (0, 0), mask)
        return result

    def _postprocess_meta(self, analysis: Analysis) -> dict:
        """构造后处理元信息（返回给前端展示）。"""
        styles = analysis.styles
        palette = intent_analyzer.detect_palette(" ".join(analysis.styles) + " " + " ".join(analysis.colors))

        if "赛博朋克" in styles:
            return {"tone": "neon", "background": "purple-blue-gradient",
                    "effects": ["high-contrast", "neon-border"]}
        if "科技感" in styles or "未来感" in styles:
            return {"tone": "cool", "background": "blue-purple-gradient",
                    "effects": ["sharpen", "neon-border"]}
        if "治愈系" in styles or "温柔" in styles or "可爱" in styles:
            return {"tone": "warm", "background": "pink-soft",
                    "effects": ["low-contrast", "warm-tint"]}
        if "极简" in styles or "黑白" in styles:
            return {"tone": "mono", "background": "minimal",
                    "effects": ["grayscale", "low-saturation"]}
        if "二次元" in styles:
            return {"tone": "vivid", "background": "pink-purple",
                    "effects": ["high-saturation", "pink-tint"]}
        if "像素风" in styles:
            return {"tone": "retro", "background": "pixel",
                    "effects": ["pixelate"]}
        return {"tone": "neutral", "background": palette + "-gradient", "effects": []}


# 单例
_dcgan_generator: DCGANCelebAGenerator | None = None


def get_dcgan_generator() -> DCGANCelebAGenerator:
    global _dcgan_generator
    if _dcgan_generator is None:
        _dcgan_generator = DCGANCelebAGenerator()
    return _dcgan_generator
