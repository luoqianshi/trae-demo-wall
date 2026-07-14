"""DCGAN Generator 模型定义（CelebA 配置）。

标准 DCGAN 生成器：输入 100 维 latent vector，输出 64x64x3 人脸头像。
参考：Radford et al., "Unsupervised Representation Learning with DCGAN"。

注意：这是无条件生成模型，不支持文本条件控制。
文本描述仅用于 seed 与后处理，不直接控制人脸语义。
"""
from __future__ import annotations


def build_generator(nz: int = 100, ngf: int = 64, nc: int = 3):
    """构建并返回 DCGAN Generator。

    懒导入 torch，避免未安装 torch 时整个后端无法启动。

    参数：
        nz: latent vector 维度，默认 100
        ngf: 生成器特征通道数，默认 64
        nc: 输出图像通道数，默认 3（RGB）
    """
    import torch.nn as nn

    class DCGANGenerator(nn.Module):
        def __init__(self, nz=100, ngf=64, nc=3):
            super().__init__()
            self.main = nn.Sequential(
                # 输入 (nz) x 1 x 1 -> (ngf*8) x 4 x 4
                nn.ConvTranspose2d(nz, ngf * 8, 4, 1, 0, bias=False),
                nn.BatchNorm2d(ngf * 8),
                nn.ReLU(True),
                # (ngf*8) x 4 x 4 -> (ngf*4) x 8 x 8
                nn.ConvTranspose2d(ngf * 8, ngf * 4, 4, 2, 1, bias=False),
                nn.BatchNorm2d(ngf * 4),
                nn.ReLU(True),
                # (ngf*4) x 8 x 8 -> (ngf*2) x 16 x 16
                nn.ConvTranspose2d(ngf * 4, ngf * 2, 4, 2, 1, bias=False),
                nn.BatchNorm2d(ngf * 2),
                nn.ReLU(True),
                # (ngf*2) x 16 x 16 -> (ngf) x 32 x 32
                nn.ConvTranspose2d(ngf * 2, ngf, 4, 2, 1, bias=False),
                nn.BatchNorm2d(ngf),
                nn.ReLU(True),
                # (ngf) x 32 x 32 -> (nc) x 64 x 64
                nn.ConvTranspose2d(ngf, nc, 4, 2, 1, bias=False),
                nn.Tanh(),
            )

        def forward(self, z):
            return self.main(z)

    return DCGANGenerator(nz=nz, ngf=ngf, nc=nc)
