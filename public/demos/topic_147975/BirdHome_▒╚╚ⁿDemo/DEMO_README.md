# BirdHome 智能鸟类监测名录工具 - 比赛演示版

## 🐦 项目简介

BirdHome 是基于12个自主贡献型生物多样性保护地（OECMs）实际需求开发的智能鸟类监测名录工具，通过统一的数据管理平台，实现数据整合、智能分析、报告自动生成。

## 📁 演示文件结构

```
BirdHome_比赛Demo/
├── .streamlit/
│   └── config.toml               # Streamlit配置文件
├── BirdHome_Demo_Showcase.html   # 比赛展示页面（HTML）
├── demo_app.py                   # Streamlit演示应用
├── demo_data.json                # 演示数据
├── DEMO_README.md                # 本说明文档
├── requirements.txt              # Python依赖列表
├── start_demo.bat                # Windows启动脚本（命令行）
└── start_demo.ps1                # Windows启动脚本（PowerShell）
```

## 🚀 快速开始

### 方式一：查看HTML展示页面（推荐用于比赛展示）

1. 直接用浏览器打开 `BirdHome_Demo_Showcase.html`
2. 展示页面包含：项目介绍、核心功能、保护地分布、技术栈等

### 方式二：运行Streamlit演示应用（交互式演示）

#### 环境要求

- Python 3.8+

#### 安装依赖

```bash
pip install -r requirements.txt
```

#### 启动应用（三种方式任选其一）

**方式A：双击启动脚本**
- 双击 `start_demo.bat`（Windows命令行）
- 或双击 `start_demo.ps1`（Windows PowerShell）

**方式B：命令行启动**
```bash
cd "BirdHome_比赛Demo"
streamlit run demo_app.py --server.port 8502
```

**方式C：一键启动（推荐）**
```bash
start_demo.bat
```

#### 访问地址

- 本地：http://localhost:8502
- 网络：http://168.88.88.6:8502

## ✨ 演示功能

### 🏠 首页
- 项目背景介绍
- 核心功能卡片展示
- 实时数据预览

### 📊 数据概览
- 鸟类保护等级分布饼图
- 鸟类发现次数排行榜
- 详细数据表格

### 🏛️ 保护地统计
- 保护地基本信息统计
- 各保护地识别记录数量对比
- 生态类型分布

### 🐦 鸟类查询
- 按中文名/学名搜索
- 按保护等级筛选
- 查看鸟类详细信息

### 📈 趋势分析
- 月度物种数变化趋势
- 月度记录数变化趋势
- 保护等级月度变化

### 📄 报告预览
- 支持日报/周报/月报/季报/年报
- 一键生成监测报告
- 包含保护建议

## 🎨 展示页面特色

`BirdHome_Demo_Showcase.html` 包含：
- 动态树叶飘落动画
- 飞鸟动画效果
- 响应式设计
- 渐变背景
- 数据统计卡片

## 📝 数据说明

演示数据为模拟数据，包含：
- 20种鸟类信息（含国家一级、二级保护物种）
- 12个保护地信息
- 12个月的月度趋势数据

数据文件 `demo_data.json` 已预先生成，开箱即用。

## 🌿 项目亮点

1. **科技赋能保护**：用技术手段提升生物多样性监测效率
2. **数据统一管理**：整合多站点、多设备数据
3. **智能分析**：可视化图表、趋势分析、同比环比
4. **报告自动生成**：一键生成专业报告
5. **离线可用**：本地数据库完整存档

---

🌍 用科技守护自然，让鸟类生息数据清晰可见