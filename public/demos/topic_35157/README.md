# SlideForge AI Demo Studio

> TRAE AI 创造力大赛 · 学习工作赛道 · 初赛 Demo

一个可交互的 **AI PPT 生产线** Demo：从 PPT 需求 → Markdown 大纲 → HTML PPT → PPTX 文件的完整闭环，每个环节都能与 AI 对话调整。

## 快速开始

### 方式一：一键启动（推荐）

```bash
# 1. 安装依赖（首次运行）
pip install -r requirements.txt
playwright install chromium

# 2. 双击启动
start.bat
```

启动后访问 `http://127.0.0.1:5000`。

### 方式二：手动启动

```bash
conda activate base
cd trae-demo
python app.py
```

### 方式三：仅前端预览（无后端功能）

直接双击 `index.html` 用浏览器打开，可体验 UI 但无法导出 PPTX。

## 核心功能

完整 6 步工作流，每步都支持 AI 对话调整：

| 步骤 | 功能 | 说明 |
|---|---|---|
| 0 | 配置 AI 连接 | 支持 OpenAI/DeepSeek/GLM/MiMo 等兼容接口，Key 仅存浏览器 |
| 1 | 需求输入 | 粘贴 PPT 需求，可上传参考图片和 .pptx 模板 |
| 2 | Markdown 大纲 | AI 深度分析需求，生成含时间/主标题/内容要点/讲述重点/视觉建议的专业大纲（可下载 .md） |
| 3 | HTML 幻灯片 | AI 根据大纲+图片布局生成 16:9 专业 HTML PPT，严格保持页数，可对话修改（可下载 .html） |
| 4 | 演讲稿备注 | AI 逐页生成演讲稿（150-300字/页），可编辑、可对话调整、导出时填入 PPTX 备注（可下载 .md） |
| 5 | 导出 PPTX | 三种导出模式：截图嵌入/原生绘制/模板填充，均支持图片插入和演讲稿备注 |

## 完整流程

```text
用户需求 + 参考图片 + PPT 模板（可选）
  ↓
[Step 2] AI 深度需求分析 → 专业 Markdown 大纲（含时间/视觉建议/版式要求）
  ↓                     ⬇ 可下载 .md
[Step 2→3] AI 视觉模型分析图片 → 图片布局建议（哪页/什么位置，用于 HTML 生成）
  ↓
[Step 3] AI 根据大纲+图片布局 → 专业 HTML 幻灯片（严格保持页数，含 <img>）
  ↓                     ⬇ 可下载 .html
       （可对话修改 HTML，AI 严格遵循大纲页数，不会增减页面）
  ↓
[Step 4] AI 逐页生成演讲稿 → 可编辑、可对话调整
  ↓                     ⬇ 可下载 .md
[Step 5] 导出 PPTX：
  - 无模板：截图嵌入（高保真）或 原生绘制（可编辑+图片）
  - 有模板：模板填充（强制套用模板风格+图片插入）
  - 演讲稿自动填入 PPTX 备注栏
```

## 三种导出模式

| 模式 | 视觉保真 | 可编辑性 | 图片支持 | 适用场景 |
|---|---|---|---|---|
| `screenshot` 截图嵌入 | 高（与 HTML 预览一致） | 不可编辑（整页位图） | HTML 已含图片 | 快速生成视觉完整的 PPTX |
| `native` 原生绘制 | 中（文本+图片） | 可编辑 | 根据 img_layout 插入 | 需要后续编辑的 PPTX |
| `template_fill` 模板填充 | 套用模板风格 | 可编辑 | 根据 img_layout 插入 | 有 .pptx 模板时强制套用 |

## 技术特性

- **前端**：原生 HTML/CSS/JS（单文件），5 步向导式 UI，localStorage 保存配置
- **后端**：Flask（Python），3 个核心接口（模板解析/截图/导出）
- **AI 调用**：OpenAI 兼容 API，前端直调，用户自填 Key
- **PPTX 生成**：python-pptx（原生绘制+模板填充）、playwright（HTML 截图）
- **模板解析**：python-pptx 读取 .pptx 母版/配色/字体/字号
- **图片分析**：AI 视觉模型（vision API）分析图片内容并建议布局
- **图片插入**：支持 PNG/JPG/SVG（SVG 自动转 PNG）/GIF/WEBP，根据布局建议插入对应页面
- **状态管理**：闭包内 state 对象 + window.SlideForgeDebug 调试接口

## 大纲生成规范（参考学术发布会大纲）

AI 生成的大纲遵循以下结构（参考 `examples/draftpaper_loop_ppt_outline.md`）：

```markdown
### 需求分析
（深度分析：主题/受众/时长/结构/风格/特殊要求）

### PPT 大纲

## Slide 01. 标题页
时间：0.5 分钟
主标题：精炼有力的标题
内容要点：
- 3-6 个具体 bullet（完整论点，非关键词）
- 每个 bullet 体现深度理解
讲述重点：本页口播要点（1-2 句，用于后续生成演讲稿）
视觉建议：图表/布局/公式/图片建议

## Slide 02. ...
...

## 版式要求
- 每页只保留一个中心观点
- 同级元素字号、颜色、卡片尺寸保持一致
- 段落行距 1.2-1.25
- 图示优先使用流程图、状态图、目录结构图
```

注意：大纲阶段不生成完整演讲稿，只生成「讲述重点」。完整演讲稿在 Step 4 单独生成。

## 演讲稿备注规范（Step 4）

HTML 确认后，AI 逐页生成演讲稿：

- 每页 150-300 字，口语化，适合现场口播
- 严格对应大纲页数，不增减
- 体现大纲的「讲述重点」，自然过渡
- 包含具体数据和论点
- 可直接在文本框中编辑，编辑后自动保存
- 导出 PPTX 时自动填入备注栏

## HTML 幻灯片设计规范（参考专业 PPT HTML 模板）

AI 生成的 HTML 遵循以下设计模式（参考 `examples/` 目录的 3 个 HTML 文件）：

- **CSS 变量系统**：`:root` 定义 `--ink/--blue/--cyan/--green/--paper` 等颜色变量
- **通用组件**：`.topbar`（顶部栏）+ `.ribbon`（渐变色条）+ `.subtitle`（副标题）+ `.footer`（页脚）
- **内容组件**：`.module`（卡片）+ `.num`（编号圈）+ `.tool-list`（列表）+ `.metric-strip`（数据条）+ `.flow-figure`（图片容器）+ `.scenario-item`（场景卡片）+ `.step`（流程步骤）
- **视觉细节**：圆角 8px、阴影、左边框色条、渐变背景
- **页面类型**：标题页/章节页/内容页/数据页/流程页/图片页/结尾页，各用不同版式
- **图片支持**：允许使用 `<img>` 标签插入用户上传的图片（data URI）

## 文件结构

```text
trae-demo/
├── index.html              前端单文件（HTML+CSS+JS 内联）
├── app.py                  后端 Flask 服务（模板解析/截图/导出）
├── start.bat               一键启动脚本
├── requirements.txt        Python 依赖
├── .env.example            环境变量示例
├── README.md               本文件
├── session-evidence.md     Session 证据记录
├── sample_input/           示例需求
│   ├── sample_requirement.txt
│   └── README.md
├── Chenwei_Test/           真实测试用例（天文学学术报告）
│   ├── PPT_requirements.txt
│   └── ppt_upload_package_slimdc_tde_40min_20260618/
└── outputs/                输出目录（PPTX/临时文件）
    └── .gitkeep
```

## 后端 API

| 接口 | 方法 | 功能 |
|---|---|---|
| `/api/health` | GET | 健康检查 |
| `/api/parse_template` | POST | 解析 .pptx 模板（比例/配色/字体/字号） |
| `/api/screenshot` | POST | HTML 截图为 PNG |
| `/api/export_pptx` | POST | 导出 PPTX（三种模式） |

### 导出接口参数

```json
{
  "mode": "screenshot | native | template_fill",
  "slides": [{"title", "bullets[]", "notes", "time", "visual", "html"}],
  "slide_style": "CSS 字符串",
  "template_info": {"width_in", "height_in", "colors[]", "fonts[]", "title_style", "content_style", "template_path"},
  "images": [{"name", "dataUrl", "mime"}],
  "img_layout": [{"imgIndex", "page", "position", "reason"}]
}
```

## 测试

测试用例：`Chenwei_Test/`（真实天文学学术报告需求 + 89MB PPT 模板 + 6 张参考图）

测试报告：`../chenwei_test_report_20260618.md`

## 适用场景

- 学术报告（天文学/物理学/计算机科学等）
- 产品发布会 Deck
- 科研组会汇报
- 课程报告
- 比赛答辩
- 项目路演

## 与主项目关系

本 Demo 是 [SlideForge AI](https://github.com/xiejhhhhhh/slideforge-ai) 的初赛可交互展示版本，完整复现了主项目的 AI PPT 生产线：

```text
需求 → 大纲 → HTML → PPTX
```

主项目提供完整的提示词模板、HTML 模板、渲染脚本和 PPTX 导出工具，本 Demo 则把这些能力浓缩为一个可在浏览器中体验的交互流程。

## 开发过程

本 Demo 完全由 TRAE Work / TRAE IDE 辅助生成，开发过程详见 [session-evidence.md](./session-evidence.md)。

## 协议

MIT License
