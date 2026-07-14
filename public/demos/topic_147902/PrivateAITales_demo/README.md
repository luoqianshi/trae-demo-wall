# 私塾绘本 (PrivateAITales) Demo

## 快速体验

1. 打开 `index.html`（推荐 Chrome/Edge）
2. 点击 **"▶ 自动演示"** 观看 13 步完整功能演示
3. 或手动切换左侧面板浏览各页面

**演示内容：**
- 开场介绍（3 段）：产品背景、核心功能概述
- 家长端（5 步）：锁定教育导向 → 孔先生对话 → 创作绘本 → 书柜 → 书店
- 孩子端（4 步）：首页 → 小安陪读 → 绘本阅读 → 我的书柜
- 收尾（1 段）

## 目录结构

```
PrivateAITales_demo/
├── index.html              # 主入口：双端展示 + 自动演示
├── favicon.svg             # 图标
├── html/                   # 子页面（13 个）
│   ├── parent_*.html       # 家长端：on_boarding, chat, create, home
│   ├── child_*.html        # 孩子端：home, chat, reader
│   ├── library.html        # 书柜（家长/孩子共用，按来源切换导航）
│   ├── bookstore.html      # 书店
│   ├── book_reader_full.html  # 全屏绘本阅读
│   ├── shared_study.html   # 共享书房
│   ├── me.html             # 个人中心（家长/孩子共用，按来源切换导航）
│   └── start.html          # 导航页
├── shared/                 # 共享资源
│   ├── css/                # 样式（3 个）：variables, base, components
│   └── js/                 # 脚本（6 个）：mock-data, navigation, state, tts, child_nav, parent_nav
├── audio/                  # 预生成配音文件（13 个 WAV，约 10 MB）
│   ├── intro_part1~3.wav   # 开场介绍（3 段）
│   ├── parent/             # 家长端 5 步（p01~p05）
│   ├── child/              # 孩子端 4 步（c06~c09）
│   └── closing.wav         # 收尾
├── assets/
│   ├── images/
│   │   ├── covers/         # 绘本封面 SVG（7 本，本地生成，含主题色渐变 + emoji + 书名）
│   │   └── pages/          # 绘本内页 SVG（book-001 的 6 页，含场景化插图）
│   └── screenshots/        # 产品截图（6 张 PNG，用于投稿文档）
├── scripts/                # 工具脚本
│   └── generate_tts_audio.py  # TTS 配音生成
└── README.md
```

## 关键设计说明

### 双端布局

- **家长端**：手机竖屏（9:19.5），分隔比例 左2 : 右1
- **孩子端**：Pad 横屏（16:10），分隔比例 左1 : 右3
- 中间分隔线可拖拽，自由调整左右面板大小
- 设备尺寸：手机 520px × 95vh，Pad 1600px × 95vh

### 角色头像

- **孔先生**：橙色渐变背景 + "孔" 字（家长端各页面）
- **小安**：橙色渐变背景 + "安" 字（孩子端各页面：child_home、child_chat、child_reader）

### 绘本点击交互

点击任意绘本图标时，弹出居中 toast 提示："Demo 暂不提供绘本内容，正式产品将包含完整绘本阅读体验"，2 秒后自动消失。该行为由 `navigation.js` 的 `showBookDemoToast()` 统一处理，家长端通过 `openBookReader()` 调用，孩子端通过 `ChildNav.openReader()` 调用。

### 绘本数据

共 7 本绘本（book-001 ~ book-007），每本包含：
- 封面 SVG（本地生成，含主题色渐变 + emoji + 书名）
- 内页：book-001 含 6 页场景化 SVG 插图；book-002 ~ book-007 内页以 emoji 展示（点击绘本只显示 toast，不进入阅读器）
- 价值观标签、安全等级（绿/黄/红）、适龄标注

### 主菜单结构

- **家长端**：AI私塾 / 书房 / 创作 / 我
- **孩子端**：推荐 / 小安 / 我的书 / 我
- 书店与书柜合并为"书房"；孩子端"阅读"替换为"我"

## 配音说明

- 统一使用 **Serena**（温柔女性）音色
- 通过 Qwen3-TTS API 预生成，`http://localhost:26880/api/v1/custom-voice`
- 演示时不依赖任何实时 TTS 调用
- 13 个 WAV 文件总计约 10 MB

## 重新生成配音

```bash
cd docs/competition/PrivateAITales_demo
python scripts/generate_tts_audio.py --server http://localhost:26880
```

## 打包发布

打包 ZIP 时排除 `scripts/`、`screenshots/`、`README.md`，仅保留可运行文件。
