"""DCGAN-CelebA 生成测试脚本。

用途：
1. 加载本地 DCGAN 权重。
2. 使用固定 seed 生成一张头像。
3. 保存到 backend/outputs/test_dcgan_avatar.png。
4. 输出生成结果路径。
5. 模型权重不存在时给出明确错误，不静默失败。

运行：
    cd backend
    python scripts/test_dcgan_generate.py
    python scripts/test_dcgan_generate.py --seed 42 --text "蓝色科技感头像"
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

# 让 scripts/ 子目录可以导入 backend 包内的模块
BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from config import get_settings, BACKEND_DIR as _BACKEND_DIR  # noqa: E402
from schemas import Analysis  # noqa: E402
from services.dcgan_celeba_generator import (  # noqa: E402
    DCGANCelebAGenerator,
    DCGANWeightsNotFoundError,
    DCGANTorchNotAvailableError,
    PROVIDER_NAME,
    NOTICE,
)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="DCGAN-CelebA 本地生成测试")
    p.add_argument("--seed", type=int, default=12345, help="固定随机种子（默认 12345）")
    p.add_argument(
        "--text", type=str, default="生成一个蓝色科技感头像",
        help="测试用的输入文本（仅用于后处理风格，不影响 DCGAN 生成语义）",
    )
    p.add_argument(
        "--size", type=str, default="512x512",
        help="输出尺寸，如 256x256 / 512x512",
    )
    p.add_argument(
        "--transparent", action="store_true",
        help="生成透明背景的圆形头像",
    )
    return p.parse_args()


def build_analysis(text: str) -> Analysis:
    """根据文本构造一个 Analysis，用于后处理风格判断。"""
    from services import intent_analyzer
    return intent_analyzer.analyze(text)


def main() -> int:
    args = parse_args()
    settings = get_settings()

    print("=" * 60)
    print("DCGAN-CelebA 本地生成测试")
    print("=" * 60)
    print(f"weights path : {settings.dcgan_weights_path}")
    print(f"device       : {settings.dcgan_device}")
    print(f"nz/ngf/nc    : {settings.dcgan_nz}/{settings.dcgan_ngf}/{settings.dcgan_nc}")
    print(f"text         : {args.text}")
    print(f"seed         : {args.seed}")
    print(f"size         : {args.size}")
    print(f"transparent  : {args.transparent}")
    print("-" * 60)

    gen = DCGANCelebAGenerator()

    # 可用性预检
    available, reason = gen.is_available()
    if not available:
        print("[ERROR] DCGAN 不可用：")
        print(f"  {reason}")
        print()
        print("解决方法：")
        print("  1. 安装 torch: pip install torch torchvision")
        print("     CPU 版本: pip install torch torchvision "
              "--index-url https://download.pytorch.org/whl/cpu")
        print("  2. 放置权重: 将 dcgan_generator.pth 放到 "
              "backend/models/dcgan_celeba/")
        print("  3. 训练权重: python scripts/train_dcgan_celeba.py "
              "--data-root /path/to/celeba")
        print("  4. 生成随机权重(仅用于流程验证): "
              "python scripts/download_or_prepare_weights.py")
        return 1

    # 强制使用固定 seed（不走 regenerate，避免扰动）
    # 通过覆盖 text_to_seed 行为：直接用 args.seed
    import services.dcgan_celeba_generator as dcgan_mod
    original_text_to_seed = dcgan_mod.text_to_seed
    dcgan_mod.text_to_seed = lambda text, regenerate=False: args.seed
    # 同时替换实例方法引用（generate 内部调用模块级函数）
    try:
        analysis = build_analysis(args.text)
        prompt = f"dcgan test seed={args.seed}"
        negative_prompt = ""

        print("[INFO] 开始生成...")
        try:
            result = gen.generate(
                prompt=prompt,
                negative_prompt=negative_prompt,
                size=args.size,
                analysis=analysis,
                text=args.text,
                regenerate=False,
                transparent=args.transparent,
            )
        except (DCGANWeightsNotFoundError, DCGANTorchNotAvailableError) as e:
            print(f"[ERROR] 生成被阻断：{e}")
            return 1
    finally:
        dcgan_mod.text_to_seed = original_text_to_seed

    # 固定保存路径（覆盖式，便于自动化检查）
    output_dir = settings.output_path
    output_dir.mkdir(parents=True, exist_ok=True)
    target_path = output_dir / "test_dcgan_avatar.png"

    # result.image_url 形如 /outputs/avatar_dcgan_xxx_seedxxx.png
    src_path = _BACKEND_DIR.parent / result.image_url.lstrip("/")
    if not src_path.exists():
        # 兜底：从 outputs 直接找
        src_path = output_dir / Path(result.image_url).name
    if src_path.exists() and src_path != target_path:
        import shutil
        shutil.copy2(str(src_path), str(target_path))

    print()
    print("[OK] 生成成功！")
    print(f"  provider   : {PROVIDER_NAME}")
    print(f"  seed       : {result.seed}")
    print(f"  size       : {args.size}")
    print(f"  image_url  : {result.image_url}")
    print(f"  saved to   : {target_path}")
    print()
    print(f"  notice     : {NOTICE}")
    print()
    print("提示：该图片是 DCGAN-CelebA 生成的虚拟头像，不代表真实人物。")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
