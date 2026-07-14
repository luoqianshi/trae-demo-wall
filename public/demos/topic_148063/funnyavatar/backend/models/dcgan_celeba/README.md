# DCGAN-CelebA 本地生成模型

本目录存放 DCGAN-CelebA 生成器权重与模型定义。

## 文件说明

- `generator.py` — DCGAN Generator 模型定义（nn.Module），标准 5 层反卷积结构
- `dcgan_generator.pth` — 训练好的生成器权重（**需自行训练或放置，不随仓库提交**）

## 权重获取方式

本仓库不提交权重文件（体积大，且 CelebA 数据集有授权条款）。获取权重有三种方式：

### 方式 1：自行训练（推荐）

```bash
cd backend
python scripts/train_dcgan_celeba.py \
  --data-root /path/to/celeba \
  --epochs 25 \
  --batch-size 128 \
  --output models/dcgan_celeba/dcgan_generator.pth
```

训练完成后权重会保存到本目录。CelebA 数据集需自行按其授权获取：
https://mmlab.ie.cuhk.edu.hk/projects/CelebA.html

### 方式 2：运行准备脚本（生成随机初始化权重，仅用于流程验证）

```bash
cd backend
python scripts/download_or_prepare_weights.py
```

这会生成一个随机初始化的权重文件，能跑通整个生成流程，
但生成的是噪声图，**不能用于真实头像生成**。仅用于验证接口与流程。

### 方式 3：放置已有权重

将训练好的 `dcgan_generator.pth` 放到本目录即可。

## 模型配置

| 参数 | 默认值 | 说明 |
|------|--------|------|
| nz | 100 | latent vector 维度 |
| ngf | 64 | 生成器特征通道 |
| nc | 3 | 输出通道（RGB） |
| 输出尺寸 | 64x64 | 后处理放大到 512x512 |

## 重要说明

- DCGAN-CelebA 是**无条件生成模型**，不能严格按文字生成指定风格的人脸。
- 文字描述仅用于：① 生成稳定的随机 seed；② 风格分析；③ Pillow 后处理（色调、对比度等）。
- 生成结果是**虚拟头像**，不代表真实人物。
- CelebA 数据集与权重使用需遵守其原始授权条款，不可直接声明为可商用。
