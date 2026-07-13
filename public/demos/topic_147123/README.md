# 情绪识别系统

基于 ResNet18 的面部表情识别系统，支持 6 种情绪分类。

## 项目简介

本项目使用深度学习技术实现面部表情识别，采用 PyTorch 框架构建，基于预训练 ResNet18 模型进行迁移学习，实现高精度的情绪分类。

### 技术亮点

- **预训练模型迁移学习**：使用 ResNet18 预训练权重，加速收敛并提升准确率
- **多重防过拟合策略**：Dropout、权重衰减、标签平滑、早停机制
- **数据增强**：随机裁剪、翻转、旋转、颜色抖动、随机擦除
- **学习率调度**：余弦退火策略自适应调整学习率
- **梯度累积**：在小 Batch Size 下模拟大 Batch 效果
- **可视化分析**：训练曲线、混淆矩阵、分类报告

## 数据集

本项目使用的数据集来自 **Kaggle 平台**，包含 6 种面部表情的裁剪人脸图像。

### 数据来源

- **平台**：Kaggle
- **数据集类型**：面部表情识别数据集
- **图片格式**：PNG / JPEG，RGB 模式
- **预处理方式**：已裁剪对齐的人脸图像
- **下载链接**：https://www.kaggle.com/datasets/sujaykapadnis/emotion-recognition-dataset

### 数据分布

数据集包含 6 个类别，总计 15,453 张图片：

| 类别 | 英文标签 | 样本数量 |
|------|---------|---------|
| 😳 激动 | Ahegao | 1205 |
| 😡 愤怒 | Angry | 1313 |
| 😄 开心 | Happy | 3740 |
| 😐 中性 | Neutral | 4027 |
| 😢 悲伤 | Sad | 3934 |
| 😲 惊讶 | Surprise | 1234 |

**总样本数**：15453  
**数据集划分**：训练集 12362（80%），验证集 3091（20%）

## 模型架构

```
输入: 3×224×224 RGB图像
    │
    ▼
┌───────────────────────────────┐
│     ResNet18 特征提取器       │
│  (预训练权重，18层残差网络)    │
│  → 输出: 512维特征向量        │
└───────────────────────────────┘
    │
    ▼
┌───────────────────────────────┐
│        自定义分类头            │
│  Dropout(0.5)                 │
│       ↓                       │
│  Linear(512 → 256)            │
│       ↓                       │
│  ReLU                         │
│       ↓                       │
│  Dropout(0.3)                 │
│       ↓                       │
│  Linear(256 → 6)              │
│       ↓                       │
│  输出: 6类概率分布             │
└───────────────────────────────┘
```

## 训练参数

| 参数 | 值 |
|------|-----|
| 模型架构 | ResNet18 |
| 优化器 | AdamW |
| 初始学习率 | 0.001 |
| 权重衰减 | 1e-4 |
| 学习率调度 | CosineAnnealingLR |
| 损失函数 | CrossEntropyLoss |
| Label Smoothing | 0.1 |
| Batch Size | 16 |
| Gradient Accumulation | 2 |
| Epochs | 15 |
| 早停耐心值 | 5 |
| Dropout | 0.5, 0.3 |

## 环境要求

```bash
pip install -r requirements.txt
```

## 快速开始

### 运行代码训练模型
**第1步：准备环境**

```bash
pip install -r requirements.txt
```

**第2步：下载数据集**

数据集网址：https://www.kaggle.com/datasets/sujaykapadnis/emotion-recognition-dataset

下载完成后，请确认 `dataset/` 目录下有以下结构（每个类别一个文件夹）：

```
dataset/
├── Ahegao/       # 激动表情图片
├── Angry/        # 愤怒表情图片
├── Happy/        # 开心表情图片
├── Neutral/      # 中性表情图片
├── Sad/          # 悲伤表情图片
└── Surprise/     # 惊讶表情图片
```

**第3步：运行训练脚本**

```bash
python emotion_classifier.py
```

**第4步：等待训练完成**

训练过程会自动：
- 输出每轮训练损失和准确率
- 保存最佳模型到 `emotion_model_best.pth`
- 生成评估可视化文件：
  - `training_curves.png` - 训练/验证 Loss 和准确率曲线
  - `confusion_matrix.png` - 混淆矩阵
  - `validation_samples.png` - 验证集样本可视化

**第5步：启动演示界面**

```bash
python demo.py
```

访问 http://127.0.0.1:7860 即可使用情绪识别功能。

---


## 项目结构

```
├── emotion_classifier.py    # 训练脚本
├── demo.py                  # Gradio演示界面
├── requirements.txt         # 依赖文件
└── dataset/                 # 数据集目录
    ├── Ahegao/
    ├── Angry/
    ├── Happy/
    ├── Neutral/
    ├── Sad/
    └── Surprise/
```

## 评估指标

训练完成后会输出：
- 训练/验证 Loss 曲线
- 训练/验证 准确率曲线
- 分类报告（Precision, Recall, F1-score）
- 混淆矩阵

## 注意事项

1. 首次训练会自动下载 ResNet18 预训练权重，请确保网络连接正常
2. 建议使用 GPU 加速训练，CPU 训练速度较慢
3. 数据集需按 `dataset/类别名/` 结构组织
4. Gradio 演示界面仅支持本地访问（share=False）

## 许可证

MIT License