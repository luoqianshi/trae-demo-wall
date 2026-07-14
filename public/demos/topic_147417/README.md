# 🏠 HomeWizard 智能家居场景规划器

> **智能家居"购买前体验馆"** — 让用户在花钱之前，先看到"该买什么、花多少钱、买回来怎么用"。

---

## ✨ 产品定位

智能家居"购买前体验馆"——让用户在花钱之前，先看到"该买什么、花多少钱、买回来怎么用"。

填补从"想装智能家居"到"真正购买"之间的决策空白区。

### 目标用户
- 对智能家居感兴趣但零基础的新手用户
- 想局部改造但预算有限的家庭用户
- 需要方案对比和导出的 DIY 玩家

---

## 🎯 核心功能

| 功能模块 | 说明 |
|---------|------|
| 📝 **三步引导** | 选户型 → 描述需求 → 选预算，三步生成方案 |
| 🤖 **智能匹配** | 规则引擎 + AI 增强，多因子综合排序 |
| 📊 **三档方案** | L1 基础智能 / L3 场景智能 / L5 高阶智能 |
| 📐 **户型图展示** | 设备位置可视化，SVG 拓扑图 |
| ⚙️ **设备配置模拟** | WiFi 连接 → 设备搜索 → 逐个配置 → 完成动画 |
| 🎮 **智能联动** | 设备触发动画、一键模式执行、操作日志 |
| 📤 **方案导出** | Excel 清单（含冲突检测）+ CSV + Markdown |
| 🧠 **AI 引擎设置** | 6 种 AI Provider 可切换（DeepSeek/通义/智谱/Kimi/OpenAI/Ollama）|
| 🎯 **演示模式** | 三套预置场景一键加载，路演专用 |

---

## 🎨 设计特色

- **深色毛玻璃主题**：全局渐变背景 + `backdrop-filter: blur(20px)` 卡片
- **金色渐变总价卡片**：突出展示方案总价
- **响应式布局**：桌面 3 列 / 平板 2 列 / 手机 1 列
- **CSS 动画**：页面渐入（fadeInUp）、设备脉冲、配置旋转、联动流光
- **步骤进度可视化**：✅/🔵/⚪ 三态进度点 + 连接线

---

## 🔧 技术架构

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 前端展示 | Streamlit ≥1.28.0 | 纯 Python Web 框架，`st.navigation` 多页 |
| 后端逻辑 | Python 3.10+ | 规则引擎 + 智能路由 + AI Provider 抽象 |
| 数据存储 | JSON 文件 | 设备库(42设备) / 规则库(37规则) / 户型模板(3套) |
| AI 引擎 | 6 种 Provider | DeepSeek/通义千问/智谱/Kimi/OpenAI/Ollama |
| 测试框架 | pytest + AppTest | 67 个测试用例（数据流/规则引擎/AI/导航）|
| 诊断工具 | Python 脚本 | 数据校验 + 性能诊断 + 报告生成 |

### 智能路由链路

```
用户输入 → 关键词提取 → 规则匹配（优先级最高）
                           ↓ 未命中
                      关键词拆解兜底
                           ↓ 置信度 < 60%
                      AI 增强（可选）
                           ↓ AI 失败
                      终极兜底（基础设备）
```

### 综合排序算法（4 因子加权）

- **场景匹配度**：40% — 设备与用户场景的相关程度
- **价格匹配度**：25% — 越接近预算中位数得分越高
- **品类覆盖率**：20% — 方案覆盖品类多样性加分
- **用户热度**：15% — 设备在其他方案中的出现频率

---

## 📁 项目结构

```
smart_home_planner/
├── app.py                         # 主应用入口 + 全局 CSS + 导航
├── config.yaml                    # AI Provider 配置
├── constants.py                   # 常量定义（设备类型/类别/颜色/规则分类）
├── requirements.txt               # 依赖清单
├── .streamlit/
│   ├── config.toml                # Streamlit 主题配置
│   └── secrets.toml               # 密钥文件（gitignore）
├── core/                          # 核心逻辑层
│   ├── router.py                  # 智能路由（关键词提取/方案生成/规则匹配）
│   ├── rule_engine.py             # 规则引擎（规则加载/索引/匹配）
│   ├── ai_providers.py            # AI Provider 抽象（6 种 Provider）
│   └── local_ai.py                # 本地 AI 兜底
├── data/                          # 数据层
│   ├── device_library.json        # 设备库（42 款设备）
│   ├── rule_library.json          # 规则库（37 条联动规则）
│   ├── demo_scenarios.json        # 演示场景（3 套预置）
│   └── floorplan_templates/       # 户型模板
│       ├── one_bedroom.json       # 一室一厅
│       ├── two_bedroom.json       # 两室一厅
│       └── three_bedroom.json     # 三室一厅
├── views/                         # UI 视图层
│   ├── home.py                    # 首页（三步引导 + 演示模式）
│   ├── recommend.py               # 方案详情（核心枢纽页）
│   ├── setup.py                   # 设备配置模拟器（四步流程）
│   ├── floorplan.py               # 户型图（设备位置 + SVG 拓扑）
│   ├── dashboard.py               # 智能联动控制台
│   └── ai_settings.py             # AI 引擎配置页
├── components/                    # 可复用组件
│   ├── navigation.py              # 顶部导航栏 + 返回按钮 + 步骤进度点
│   └── device_card.py             # 设备卡片组件
├── utils/                         # 工具层
│   ├── helpers.py                 # JSON 加载/价格计算/冲突检测/导出格式化
│   ├── export.py                  # Excel/CSV 导出
│   └── ha_client.py               # Home Assistant 客户端（预留）
├── static/
│   └── style.css                  # CSS 动画样式（联动/配置/脉冲）
├── tests/                         # 自动化测试
│   ├── test_data_flow.py          # 数据流测试（19 用例）
│   ├── test_rule_engine.py        # 规则引擎测试（15 用例）
│   ├── test_ai_providers.py       # AI Provider 测试（21 用例）
│   └── test_navigation.py         # 页面跳转测试（12 用例）
├── scripts/                       # 诊断工具
│   ├── diagnostic.py              # 综合诊断（数据/规则/性能/环境/报告）
│   └── validate_data.py           # 数据校验工具
└── REPORTS/                       # 诊断报告输出目录
```

---

## 🚀 快速开始

### 环境要求
- Python 3.10+
- pip

### 安装依赖
```bash
pip install -r requirements.txt
```

### 运行项目
```bash
streamlit run app.py --server.port 8501
```

### 访问地址
打开浏览器访问：`http://localhost:8501`

### 演示模式
在左侧侧边栏开启「🎯 演示模式」，点击预置场景卡片即可一键加载。

---

## 🧪 运行测试

```bash
# 运行全部测试
python3 -m pytest tests/ -v

# 运行单个测试文件
python3 -m pytest tests/test_rule_engine.py -v
```

### 测试覆盖
| 测试文件 | 用例数 | 覆盖范围 |
|---------|-------|---------|
| test_data_flow.py | 19 | 设备库/规则库/户型模板/配置文件完整性 |
| test_rule_engine.py | 15 | 关键词提取/规则匹配/方案生成/兜底逻辑 |
| test_ai_providers.py | 21 | Provider 工厂/Prompt 构建/响应解析/降级 |
| test_navigation.py | 12 | 主路径/分支路径/无数据处理/状态保持 |

---

## 🔍 诊断工具

```bash
# 综合诊断（生成 REPORTS/DIAGNOSTIC_REPORT.md）
python3 scripts/diagnostic.py

# 数据校验
python3 scripts/validate_data.py
```

---

## 📱 用户旅程

```
首页（三步引导）
  │ 1. 选户型（一室/两室/三室）
  │ 2. 描述需求（自然语言 + 场景模板）
  │ 3. 选预算（L1/L3/L5）
  │
  ▼ 生成方案
方案详情（核心枢纽）
  ├── 📋 设备清单（按房间分组 + 聚合卡片）
  ├── 🔗 联动规则（Top 5 匹配规则）
  ├── 📊 方案分析（生成摘要 + 生态兼容性 + 场景叙事）
  ├── 📤 导出清单（Excel + CSV）
  ├── 🚀 开始配置 → 设备配置模拟器
  ├── 📐 查看户型 → 户型图页
  └── 🎮 进入控制台 → 智能联动
```

---

## 🧠 AI 引擎配置

支持 6 种 AI Provider，可在「AI 引擎设置」页面切换：

| Provider | 协议 | 需要 API Key |
|----------|------|-------------|
| DeepSeek | OpenAI 兼容 | ✅ |
| 通义千问 | DashScope | ✅ |
| 智谱 GLM | OpenAI 兼容 | ✅ |
| Kimi | OpenAI 兼容 | ✅ |
| OpenAI | OpenAI | ✅ |
| Ollama | 本地 | ❌（检查服务状态）|

AI 模式：
- `local`：仅使用本地规则
- `ai`：仅使用 AI（失败降级本地）
- `auto`：先本地，置信度 < 60% 时 AI 增强

---

## 📊 项目统计

| 指标 | 数值 |
|------|------|
| 设备库 | 42 款设备 |
| 规则库 | 37 条联动规则 |
| 户型模板 | 3 套（一室/两室/三室）|
| AI Provider | 6 种 |
| 测试用例 | 67 个 |
| 页面数 | 6 个（首页/方案/配置/户型/控制台/AI设置）|
| 方案档位 | 3 档（L1/L3/L5）|

---

## 🔒 隐私保护

- ✅ 纯本地运行，数据不出用户电脑
- ✅ 无需登录，无需注册
- ✅ 所有数据存储在本地 JSON 文件
- ✅ AI 调用可选（默认本地规则模式）

---

## 📄 许可证

本项目仅供学习和演示使用。

---

**🏠 HomeWizard v2.0.0** · 智能家居场景规划器
