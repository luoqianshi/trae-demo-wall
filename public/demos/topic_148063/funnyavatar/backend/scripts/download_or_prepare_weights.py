"""准备 DCGAN-CelebA 权重脚本。

用途：
- DCGAN 权重无法自动下载（CelebA 数据集需用户自行按授权获取），
  本脚本提供两种方式生成权重文件，便于流程验证：

  1. --mode random    生成随机初始化的 Generator 权重（仅用于流程验证，
                      生成的图像是噪声，不能用作真实头像）。
  2. --mode from-checkpoint <path>  从训练 checkpoint 恢复 Generator 权重。

注意：
- 随机权重生成的图像没有任何语义价值，仅用于验证后端流程是否通畅。
- 如需可用的 DCGAN-CelebA 权重，请运行 scripts/train_dcgan_celeba.py
  在 CelebA 数据集上训练（数据集需用户自行按授权获取）。
- 本脚本不会从互联网下载任何受版权保护的数据或权重。

运行：
    cd backend
    python scripts/download_or_prepare_weights.py                  # 默认 random
    python scripts/download_or_prepare_weights.py --mode random
    python scripts/download_or_prepare_weights.py --mode from-checkpoint \\
        --checkpoint outputs/checkpoints/dcgan_epoch_25.pt
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from config import get_settings  # noqa: E402


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description="准备 DCGAN-CelebA 权重")
    p.add_argument(
        "--mode", choices=["random", "from-checkpoint"], default="random",
        help="random: 生成随机初始化权重（仅用于流程验证）；"
             "from-checkpoint: 从训练 checkpoint 恢复 Generator 权重",
    )
    p.add_argument(
        "--checkpoint", type=str, default=None,
        help="from-checkpoint 模式下的 checkpoint 文件路径",
    )
    p.add_argument(
        "--output", type=str, default=None,
        help="输出权重路径（默认使用配置中的 DCGAN_WEIGHTS_PATH）",
    )
    return p.parse_args()


def ensure_torch():
    try:
        import torch  # noqa: F401
        return torch
    except ImportError:
        print("[ERROR] torch 未安装。请运行:")
        print("  pip install torch torchvision")
        print("  CPU 版本: pip install torch torchvision "
              "--index-url https://download.pytorch.org/whl/cpu")
        return None


def build_random_weights(torch, output_path: Path, nz: int, ngf: int, nc: int) -> bool:
    """生成随机初始化的 Generator 权重。"""
    from models.dcgan_celeba.generator import build_generator
    model = build_generator(nz=nz, ngf=ngf, nc=nc)
    model.eval()
    state_dict = model.state_dict()
    output_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(state_dict, str(output_path))
    print(f"[OK] 随机权重已保存到: {output_path}")
    print(f"     nz={nz} ngf={ngf} nc={nc}")
    print()
    print("⚠ 警告：这是随机初始化的权重，生成的图像是噪声，")
    print("  仅用于验证后端流程是否通畅，不能用作真实头像。")
    print("  如需可用权重，请运行:")
    print("    python scripts/train_dcgan_celeba.py --data-root /path/to/celeba")
    return True


def build_from_checkpoint(torch, output_path: Path, checkpoint_path: Path) -> bool:
    """从训练 checkpoint 恢复 Generator 权重。"""
    if checkpoint_path is None or not Path(checkpoint_path).exists():
        print(f"[ERROR] checkpoint 文件不存在: {checkpoint_path}")
        return False
    print(f"[INFO] 加载 checkpoint: {checkpoint_path}")
    try:
        ckpt = torch.load(str(checkpoint_path), map_location="cpu", weights_only=False)
    except TypeError:
        ckpt = torch.load(str(checkpoint_path), map_location="cpu")

    # 兼容两种 checkpoint 格式：直接 state_dict 或 {'generator': state_dict, ...}
    if isinstance(ckpt, dict) and "generator" in ckpt:
        state_dict = ckpt["generator"]
    elif isinstance(ckpt, dict) and all(isinstance(v, torch.Tensor) for v in ckpt.values()):
        state_dict = ckpt
    else:
        print("[ERROR] 无法识别的 checkpoint 格式。")
        print("  支持的格式：")
        print("    1. 直接的 Generator state_dict")
        print("    2. 包含 'generator' 键的字典")
        return False

    output_path.parent.mkdir(parents=True, exist_ok=True)
    torch.save(state_dict, str(output_path))
    print(f"[OK] Generator 权重已从 checkpoint 恢复并保存到: {output_path}")
    return True


def main() -> int:
    args = parse_args()
    settings = get_settings()

    # 解析输出路径
    if args.output:
        output_path = Path(args.output)
    else:
        output_path = Path(settings.dcgan_weights_path)
        if not output_path.is_absolute():
            # backend/models/dcgan_celeba/dcgan_generator.pth
            output_path = BACKEND_DIR.parent / output_path if str(output_path).startswith("backend/") else BACKEND_DIR.parent / output_path

    print("=" * 60)
    print("准备 DCGAN-CelebA 权重")
    print("=" * 60)
    print(f"mode         : {args.mode}")
    print(f"output       : {output_path}")
    print(f"nz/ngf/nc    : {settings.dcgan_nz}/{settings.dcgan_ngf}/{settings.dcgan_nc}")
    print("-" * 60)

    torch = ensure_torch()
    if torch is None:
        return 1

    if args.mode == "random":
        ok = build_random_weights(
            torch, output_path,
            nz=settings.dcgan_nz, ngf=settings.dcgan_ngf, nc=settings.dcgan_nc,
        )
    else:
        ok = build_from_checkpoint(torch, output_path, args.checkpoint)

    if not ok:
        return 1

    print()
    print("下一步：")
    print("  1. 启动后端: uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    print("  2. 测试生成: python scripts/test_dcgan_generate.py")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
