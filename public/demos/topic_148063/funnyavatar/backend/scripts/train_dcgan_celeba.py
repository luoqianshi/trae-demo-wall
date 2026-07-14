"""DCGAN-CelebA 训练脚本。

使用 PyTorch + torchvision 训练 DCGAN Generator + Discriminator。
支持 CPU / GPU 自动识别，支持命令行参数配置。

用法：
    python scripts/train_dcgan_celeba.py \
        --data-root /path/to/celeba \
        --epochs 25 \
        --batch-size 128 \
        --image-size 64 \
        --nz 100 \
        --output models/dcgan_celeba/dcgan_generator.pth

注意：
- CelebA 数据集需用户自行按其授权获取：https://mmlab.ie.cuhk.edu.hk/projects/CelebA.html
- 本脚本不自动下载 CelebA，避免违规。
- 训练过程保存 sample 图片到 outputs/training_samples/，每 N 个 epoch 保存 checkpoint。
"""
from __future__ import annotations

import argparse
import os
import sys
import time
from pathlib import Path

# 让脚本能从 backend/ 目录直接运行
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


def parse_args():
    p = argparse.ArgumentParser(description="Train DCGAN on CelebA")
    p.add_argument("--data-root", required=True, help="CelebA 数据集根目录（含 img_align_celeba/）")
    p.add_argument("--epochs", type=int, default=25)
    p.add_argument("--batch-size", type=int, default=128)
    p.add_argument("--image-size", type=int, default=64)
    p.add_argument("--nz", type=int, default=100)
    p.add_argument("--ngf", type=int, default=64)
    p.add_argument("--ndf", type=int, default=64)
    p.add_argument("--nc", type=int, default=3)
    p.add_argument("--lr", type=float, default=0.0002)
    p.add_argument("--beta1", type=float, default=0.5)
    p.add_argument("--sample-every", type=int, default=2, help="每 N 个 epoch 保存 sample")
    p.add_argument("--ckpt-every", type=int, default=5, help="每 N 个 epoch 保存 checkpoint")
    p.add_argument("--output", default="models/dcgan_celeba/dcgan_generator.pth",
                   help="生成器权重输出路径")
    return p.parse_args()


def main():
    args = parse_args()

    try:
        import torch
        import torch.nn as nn
        import torch.optim as optim
        import torchvision
        import torchvision.transforms as T
    except ImportError:
        print("ERROR: torch / torchvision 未安装。")
        print("CPU 版本: pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu")
        sys.exit(1)

    from models.dcgan_celeba.generator import build_generator

    # 设备
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"[train] device = {device}")

    # 数据集
    transform = T.Compose([
        T.Resize(args.image_size),
        T.CenterCrop(args.image_size),
        T.ToTensor(),
        T.Normalize((0.5, 0.5, 0.5), (0.5, 0.5, 0.5)),
    ])
    dataset = torchvision.datasets.ImageFolder(root=args.data_root, transform=transform)
    loader = torch.utils.data.DataLoader(dataset, batch_size=args.batch_size, shuffle=True, num_workers=2)
    print(f"[train] dataset size = {len(dataset)}")

    # 模型
    netG = build_generator(nz=args.nz, ngf=args.ngf, nc=args.nc).to(device)

    class Discriminator(nn.Module):
        def __init__(self, ndf=64, nc=3):
            super().__init__()
            self.main = nn.Sequential(
                nn.Conv2d(nc, ndf, 4, 2, 1, bias=False),
                nn.LeakyReLU(0.2, True),
                nn.Conv2d(ndf, ndf * 2, 4, 2, 1, bias=False),
                nn.BatchNorm2d(ndf * 2), nn.LeakyReLU(0.2, True),
                nn.Conv2d(ndf * 2, ndf * 4, 4, 2, 1, bias=False),
                nn.BatchNorm2d(ndf * 4), nn.LeakyReLU(0.2, True),
                nn.Conv2d(ndf * 4, ndf * 8, 4, 2, 1, bias=False),
                nn.BatchNorm2d(ndf * 8), nn.LeakyReLU(0.2, True),
                nn.Conv2d(ndf * 8, 1, 4, 1, 0, bias=False),
                nn.Sigmoid(),
            )

        def forward(self, x):
            return self.main(x).view(-1)

    netD = Discriminator(ndf=args.ndf, nc=args.nc).to(device)

    # 初始化权重
    def weights_init(m):
        classname = m.__class__.__name__
        if classname.find("Conv") != -1:
            nn.init.normal_(m.weight.data, 0.0, 0.02)
        elif classname.find("BatchNorm") != -1:
            nn.init.normal_(m.weight.data, 1.0, 0.02)
            nn.init.constant_(m.bias.data, 0)
    netG.apply(weights_init)
    netD.apply(weights_init)

    # 优化器与损失
    criterion = nn.BCELoss()
    fixed_noise = torch.randn(64, args.nz, 1, 1, device=device)
    optG = optim.Adam(netG.parameters(), lr=args.lr, betas=(args.beta1, 0.999))
    optD = optim.Adam(netD.parameters(), lr=args.lr, betas=(args.beta1, 0.999))

    # 输出目录
    sample_dir = Path("outputs/training_samples")
    sample_dir.mkdir(parents=True, exist_ok=True)
    ckpt_dir = Path("outputs/checkpoints")
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"[train] start training for {args.epochs} epochs")
    for epoch in range(args.epochs):
        t0 = time.time()
        for i, (real, _) in enumerate(loader):
            real = real.to(device)
            bsz = real.size(0)
            label_real = torch.ones(bsz, device=device)
            label_fake = torch.zeros(bsz, device=device)

            # --- 训练 D ---
            netD.zero_grad()
            outD_real = netD(real)
            lossD_real = criterion(outD_real, label_real)
            noise = torch.randn(bsz, args.nz, 1, 1, device=device)
            fake = netG(noise)
            outD_fake = netD(fake.detach())
            lossD_fake = criterion(outD_fake, label_fake)
            lossD = lossD_real + lossD_fake
            lossD.backward()
            optD.step()

            # --- 训练 G ---
            netG.zero_grad()
            outG = netD(fake)
            lossG = criterion(outG, label_real)
            lossG.backward()
            optG.step()

            if i % 50 == 0:
                print(f"[train] epoch {epoch}/{args.epochs} batch {i}/{len(loader)} "
                      f"D={lossD.item():.3f} G={lossG.item():.3f}")

        dt = time.time() - t0
        print(f"[train] epoch {epoch} done in {dt:.1f}s  D={lossD.item():.3f} G={lossG.item():.3f}")

        # 保存 sample
        if (epoch + 1) % args.sample_every == 0 or epoch == args.epochs - 1:
            with torch.no_grad():
                fake_sample = netG(fixed_noise).detach().cpu()
            from torchvision.utils import save_image
            save_image(fake_sample, str(sample_dir / f"sample_epoch_{epoch+1}.png"), normalize=True)
            print(f"[train] saved sample: {sample_dir / f'sample_epoch_{epoch+1}.png'}")

        # 保存 checkpoint
        if (epoch + 1) % args.ckpt_every == 0:
            torch.save(netG.state_dict(), str(ckpt_dir / f"netG_epoch_{epoch+1}.pth"))
            torch.save(netD.state_dict(), str(ckpt_dir / f"netD_epoch_{epoch+1}.pth"))

    # 保存最终生成器权重
    torch.save(netG.state_dict(), str(out_path))
    print(f"[train] generator weights saved to: {out_path}")
    print("[train] done. 请将权重放到 backend/models/dcgan_celeba/dcgan_generator.pth 使用。")


if __name__ == "__main__":
    main()
