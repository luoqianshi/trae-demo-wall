# 一句话头像灵感站 —— AI 头像生成与开源头像匹配网站

参赛创意原型（生活娱乐赛道）。用户输入一句话，系统理解风格 / 颜色 / 主体 / 用途，同时给出 **AI 虚拟头像生成** 和 **开源头像匹配** 两类结果。

本项目支持三种头像生成方式：

| Provider | 说明 | 是否需要权重 / Key |
|----------|------|-------------------|
| `dcgan-celeba-local` | **本地 PyTorch DCGAN-CelebA 生成虚拟人脸头像**（不调用任何外部付费 API） | 需放置 `dcgan_generator.pth` |
| `local` | 本地 SVG 兜底生成（无需任何依赖） | 无需 |
| `external` | 外部图像生成 API（需自行接入） | 需 API Key |

## 本地 DCGAN-CelebA 方案说明

### 为什么用 DCGAN-CelebA

DCGAN（Deep Convolutional GAN）是一种经典的无条件生成对抗网络。本项目在其上叠加了一套「文本 → 随机种子 + 风格后处理」的本地映射方案，**完全不依赖 OpenAI / Stable Diffusion / Midjourney 等外部付费图像生成 API**。

模型结构（标准 DCGAN Generator）：

- 输入 latent vector：`nz = 100`
- 输出图片尺寸：`64x64`
- 输出通道：`3`
- 特征通道：`ngf = 64`
- 5 层 `ConvTranspose2d` + `BatchNorm` + `ReLU`，输出层 `Tanh`

### 为什么 DCGAN 不能严格按文字生成

**DCGAN 是无条件生成模型**，不是真正的文本到图像（text-to-image）模型。它只接收一个随机 latent vector，无法理解「蓝色」「科技感」等文本语义。

因此本项目的做法是：

1. **文本 → 随机种子**：用 `SHA256(text)` 生成稳定 seed，同一句话默认生成相同头像；`regenerate=true` 时加入随机扰动换一张。
2. **文本 → 风格后处理**：用 Pillow 对 DCGAN 输出的 64x64 人脸做色调 / 对比度 / 渐变边框 / 像素化等后处理，模拟科技感、赛博朋克、治愈系、极简等风格。
3. **文本 → 元信息**：把识别到的风格 / 颜色 / 用途返回给前端展示。

也就是说，**文本描述只用于 seed 和后处理，不直接控制人脸语义**。生成结果可能与文字描述不完全一致，这是 DCGAN 方案的固有局限。

### 边界与风险

- 生成头像是**虚拟人物**，不代表真实人物。
- DCGAN-CelebA 适合本地 Demo、教学实验和原型验证，**不等同于生产级图像生成系统**。
- CelebA 数据集与权重使用需遵守其原始授权条款，**不要把生成结果直接声明为可商用**，除非权重和数据授权明确允许。
- 不要生成或暗示特定真实人物、名人或用户本人。

## 目录结构

```
funnyavatar/
  avatar_match_ai_demo.html        # 前端（单页，调后端接口，失败回退本地模拟）
  README.md
  backend/
    main.py                        # FastAPI 入口：6 个接口 + 静态文件 + 前端托管
    config.py                      # .env 配置读取
    schemas.py                     # 请求/响应模型
    requirements.txt
    .env.example
    outputs/                       # 生成的头像图片
    models/
      dcgan_celeba/
        generator.py               # DCGAN Generator 模型定义
        dcgan_generator.pth        # DCGAN 权重（需自行训练或放置，不提交到 Git）
        README.md                  # 权重获取说明
    services/
      intent_analyzer.py           # 需求理解：风格/颜色/主体/用途/方向
      prompt_builder.py            # Prompt 构造（英文 + negative）
      image_generator.py           # 图像生成 Provider 工厂（LocalFallback + External）
      dcgan_celeba_generator.py    # DCGAN-CelebA 本地生成 Provider
      avatar_search.py             # 开源头像匹配（DiceBear+Robohash+Multiavatar+Boring Avatars 多源聚合）
      cache.py                     # 文件缓存
    scripts/
      train_dcgan_celeba.py        # DCGAN 训练脚本
      download_or_prepare_weights.py  # 准备权重（随机权重 / 从 checkpoint 恢复）
      test_dcgan_generate.py       # DCGAN 生成测试脚本
```

## 快速开始

### 1. 安装依赖

```bash
cd backend
python -m venv .venv
# Windows
.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

> **torch 安装说明**：torch 体积较大。若仅用 CPU 运行，推荐安装 CPU 版本以节省空间：
> ```bash
> pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
> ```
> 若暂不安装 torch，后端仍可启动，`/api/generate/dcgan` 会返回 503 + 清晰提示，其它接口（SVG 生成 / 搜索）正常可用。

### 2. 启动后端

```bash
cp .env.example .env
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 访问前端

浏览器打开：**http://127.0.0.1:8000/**

后端会同时托管前端 HTML，无需单独起前端服务。也可直接双击 `avatar_match_ai_demo.html` 打开，后端不可用时自动回退本地 SVG 模拟。

## 如何放置 DCGAN 模型权重

DCGAN 权重 **不会自动下载**（CelebA 数据集需用户自行按授权获取）。获取权重有三种方式：

### 方式 A：放置已有权重

将训练好的 `dcgan_generator.pth` 放到：

```
backend/models/dcgan_celeba/dcgan_generator.pth
```

权重需匹配 `nz=100, ngf=64, nc=3` 的标准 DCGAN Generator 结构。

### 方式 B：训练自己的 DCGAN-CelebA 权重

```bash
python scripts/train_dcgan_celeba.py \
  --data-root /path/to/celeba \
  --epochs 25 \
  --batch-size 128 \
  --image-size 64 \
  --nz 100 \
  --output backend/models/dcgan_celeba/dcgan_generator.pth
```

- CelebA 数据集需用户自行按授权获取（官方地址：http://mmlab.ie.cuhk.edu.hk/projects/CelebA.html），**脚本不会自动下载违规数据**。
- 训练过程中 sample 图片保存到 `backend/outputs/training_samples/`，checkpoint 保存到 `backend/outputs/checkpoints/`。
- 支持 CPU / GPU 自动识别。

### 方式 C：生成随机权重（仅用于流程验证）

若只想验证后端流程是否通畅（生成的图像是噪声，不能用作真实头像）：

```bash
python scripts/download_or_prepare_weights.py --mode random
```

## 如何测试 DCGAN 生成

```bash
python scripts/test_dcgan_generate.py
# 指定 seed 和文本
python scripts/test_dcgan_generate.py --seed 42 --text "蓝色科技感头像"
```

- 使用固定 seed 生成一张头像。
- 保存到 `backend/outputs/test_dcgan_avatar.png`。
- 权重不存在时给出明确错误，不静默失败。

## 后端接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/health` | 健康检查 |
| POST | `/api/analyze` | 需求分析 |
| POST | `/api/generate` | 图像生成（local / external） |
| POST | `/api/generate/dcgan` | **DCGAN-CelebA 本地头像生成** |
| POST | `/api/search` | 头像搜索 |
| POST | `/api/avatar/recommend` | 一站式推荐（前端主流程，支持 `provider` 参数） |
| GET  | `/` | 前端 HTML |
| GET  | `/outputs/*` | 生成的头像图片 |

API 文档（Swagger）：http://127.0.0.1:8000/docs

### DCGAN 生成接口示例

```http
POST /api/generate/dcgan
{
  "text": "我想要一个蓝色科技感、适合 AI 开发者的头像",
  "size": "512x512",
  "regenerate": false,
  "transparent": false
}
```

返回包含 `image_url` / `provider` / `seed` / `metadata.postprocess` / `metadata.notice`。

### recommend 接口支持 provider

```http
POST /api/avatar/recommend
{
  "text": "我想要一个赛博朋克风格、适合程序员的头像，紫色和蓝色。",
  "generate": true,
  "search": true,
  "provider": "dcgan-celeba-local",
  "regenerate": false,
  "limit": 6
}
```

DCGAN 不可用（未装 torch / 无权重）时，`generated` 返回 `null`，`generation_error` 字段给出可读原因，搜索结果照常返回。

## 配置说明

编辑 `backend/.env`：

| 变量 | 说明 |
|------|------|
| `APP_HOST` / `APP_PORT` | 监听地址 / 端口 |
| `OUTPUT_DIR` | 生成图片输出目录 |
| `IMAGE_PROVIDER` | `local` / `external` / `dcgan-celeba-local` |
| `IMAGE_API_KEY` | 外部图像生成 API Key（留空自动回退 local） |
| `ENABLE_EXTERNAL_SEARCH` | `true` 启用外部开源头像源（DiceBear/Robohash/Multiavatar/Boring Avatars） |
| `DCGAN_WEIGHTS_PATH` | DCGAN 权重路径，默认 `backend/models/dcgan_celeba/dcgan_generator.pth` |
| `DCGAN_NZ` / `DCGAN_NGF` / `DCGAN_NC` | DCGAN 模型参数，默认 `100 / 64 / 3` |
| `DCGAN_DEVICE` | `cpu`（默认）/ `cuda`（不可用时自动回退 cpu 并 warning） |

后端日志只输出配置是否就绪（如 `image_api_key_configured: False`），**绝不输出 Key 本身或敏感路径细节**。

## 开源头像匹配

### 数据来源

头像匹配聚合了 4 个真实开源头像源（全部免费、无需 API Key、授权明确）：

| 来源 | 风格 | License | 适用场景 |
|------|------|---------|----------|
| **DiceBear** (https://api.dicebear.com) | bottts / pixel-art / adventurer / lorelei / cats / initials / shapes / fun-emoji / avataaars 等 | CC0 / MIT | 多风格 SVG，覆盖科技/像素/动漫/治愈/极简 |
| **Robohash** (https://robohash.org) | set1/set3 机器人/像素机器人 | CC BY 4.0 | 程序员/科技/游戏场景 |
| **Multiavatar** (https://api.multiavatar.com) | 多元人物 | MIT | 通用人物头像 |
| **Boring Avatars** (https://boring-avatars-api.vercel.app) | 几何色块 marble | MIT | 极简/几何风格 |

### 匹配逻辑

1. **关键词解析**：`intent_analyzer` 从用户输入识别风格（科技感/像素风/二次元等）、主体（猫猫/机器人/程序员等）、调色板
2. **源/风格选择**：根据调色板从 `PALETTE_MATCHES` 选择最匹配的「源 + 风格」组合，每个组合附带 `match_reason` 说明为什么匹配
3. **稳定 seed**：用 `SHA256(text)` 生成稳定 seed，相同输入 → 相同头像；不同输入 → 不同头像
4. **匹配分数**：基于风格命中度和调色板命中计算（非随机），范围 0.70-0.99
5. **多源聚合**：每个调色板对应 3+ 个候选源，结果至少包含 2 个不同来源

### 每条结果包含的字段

```
title          头像名称
thumbnail_url  头像图片 URL
source         来源名称（DiceBear / Robohash / Multiavatar / Boring Avatars / Local Generated）
source_url     来源主页
license        授权信息（CC0 / MIT / CC BY 4.0）
license_url    授权链接
match_score    匹配分数（0-1）
match_reason   匹配原因（说明为什么这个头像匹配用户描述）
tags           风格标签
safe_to_use    是否可安全使用
```

### 降级方案

- 外部源被禁用（`ENABLE_EXTERNAL_SEARCH=false`）或全部不可达时，走**本地程序化生成**（非 Demo 占位）
- 本地生成按用户输入的调色板实时生成 SVG，标注 `source: Local Generated`，`safe_to_use=true`
- 不再使用固定 Demo 占位数据

### 环境变量配置

```env
ENABLE_EXTERNAL_SEARCH=true        # 是否启用外部开源头像源
SEARCH_TIMEOUT=8                    # 外部源请求超时（秒）
SEARCH_ENABLE_DICEBEAR=true         # DiceBear 开关
SEARCH_ENABLE_ROBOHASH=true         # Robohash 开关
SEARCH_ENABLE_MULTIAVATAR=true      # Multiavatar 开关
SEARCH_ENABLE_BORING=true           # Boring Avatars 开关
```

### 测试

```bash
cd backend
python -m pytest tests/test_avatar_search.py tests/test_search_api.py -v
```

覆盖：关键词解析、风格匹配、稳定 seed、结果排序、match_reason、多源聚合、移除 Demo 占位、本地降级、源开关、接口返回真实数据。

## 常见问题

### 没有 `dcgan_generator.pth` 怎么办？

前端选择「本地 DCGAN-CelebA」生成时会展示错误提示与放置指引，不会静默生成错误图片。可：
1. 按「如何放置 DCGAN 模型权重」一节放置 / 训练权重；
2. 或运行 `python scripts/download_or_prepare_weights.py --mode random` 生成随机权重（仅验证流程）；
3. 或切换前端「生成方式」为「本地 SVG 兜底」继续体验。

### CPU 生成慢怎么办？

DCGAN 在 CPU 上生成单张头像通常需要数秒。建议：
- 减小请求 `size`（如 `256x256`）；
- 安装 CUDA 版 torch 并将 `.env` 中 `DCGAN_DEVICE=cuda`；
- `GENERATE_TIMEOUT` 已默认放宽到 60s。

### 为什么生成结果不完全符合文字描述？

DCGAN 是无条件生成模型，文本仅用于随机种子与风格后处理，不直接控制人脸语义。详见上文「为什么 DCGAN 不能严格按文字生成」。

### CelebA 数据集能否商用？

CelebA 数据集仅供非商业研究用途。本项目生成的头像**不应直接声明为可商用**，除非权重与数据授权明确允许。商用请使用授权明确的数据集重新训练。

### 如何切换到其他生成模型？

在 `services/image_generator.py` 的 `get_generator(provider)` 工厂中新增分支，实现 `generate()` 返回 `GeneratedImage` 即可。前端在 `providerSelect` 中新增对应选项。

### 如何让头像更像二次元或卡通？

DCGAN-CelebA 基于真人脸数据训练，生成结果偏真实人脸。二次元 / 卡通风格建议：
- 接入 StyleGAN / Stable Diffusion 等更强模型；
- 或在 AnimeFace / Danbooru 等二次元数据集上重新训练 DCGAN；
- 或加强 Pillow 后处理（当前已有「二次元」风格的提饱和 + 粉色滤镜模拟）。

## 边界说明

- 仅本地演示，无登录 / 无支付 / 无数据库后台
- 输入限 500 字
- 生成接口有超时控制（DCGAN 默认 60s）
- 后端日志不输出 API Key
- 收藏 / 换一组等前端交互为模拟，无持久化
- DCGAN 权重文件不提交到 Git，需自行放置或训练

## 后续可升级方向

- 改成 **Conditional GAN**（cGAN），让文本条件直接参与生成
- 接入 **StyleGAN**，提升人脸质量与多样性
- 接入 **Stable Diffusion**（本地推理），实现真正的文本到图像
- 增加 **CLIP 文本匹配**，从生成候选中挑选最贴合文本的一张
- 增加头像质量评分（如美学评分 / 人脸检测置信度）
- 增加开源头像检索库（如多源聚合 + 向量检索）
