# 研易记 - 完整开发流程

## 一、项目概述

**项目名称**：研易记 - 论文公式提取与复刻助手  
**项目类型**：桌面应用（Electron + Web + Python 后端）  
**核心功能**：利用视觉语言大模型（VLM）自动识别 PDF/Word 文档中的数学公式，输出 LaTeX 代码  
**开发周期**：约 7 轮迭代  
**开发方式**：全程使用 TRAE AI 编程助手辅助开发  

---

## 二、阶段一：项目初始化与架构设计

### 2.1 需求分析

**痛点识别**：
- 学术论文中的数学公式无法直接复制使用
- 现有工具（Mathpix 等）只支持单张图片识别，无法批量处理文档
- Word 原生公式（OMML 格式）无工具支持识别

**核心需求拆分**：
1. 用户上传公式截图 → 调用 VLM 返回 LaTeX 代码
2. 用户上传 PDF/Word 文档 → 自动提取所有公式图片 → 批量识别
3. 识别结果保存到公式库，按文档来源分类管理
4. 桌面端应用，支持拖拽上传、快捷键操作

### 2.2 技术选型

| 维度 | 选择 | 理由 |
|------|------|------|
| 后端框架 | FastAPI | 异步支持好，自动生成 API 文档 |
| 前端框架 | React 18 + TypeScript | 组件化开发，类型安全 |
| 构建工具 | Vite | 开发热更新快，构建速度快 |
| 桌面端 | Electron | 跨平台，Web 技术栈可直接复用 |
| VLM 调用 | OpenAI 兼容 API | 支持多供应商，灵活切换 |
| 文档解析 | PyMuPDF + python-docx | 原生解析能力强 |
| 状态管理 | React Context API | 轻量，无需引入额外依赖 |

### 2.3 项目目录结构

```
yanyiji/
├── backend/              # Python FastAPI 后端
│   ├── app/
│   │   ├── api/          # REST API 路由层
│   │   │   ├── recognize.py    # 公式识别接口
│   │   │   ├── formulas.py     # 公式库 CRUD 接口
│   │   │   └── system.py       # 系统状态接口
│   │   ├── services/     # 核心业务逻辑层
│   │   │   ├── recognizer.py         # VLM 多模态识别器
│   │   │   ├── latex_processor.py    # LaTeX 清理与验证
│   │   │   └── document_parser.py    # PDF/Word 文档解析器
│   │   ├── config.py     # 配置管理
│   │   └── main.py       # FastAPI 应用入口
│   ├── requirements.txt
│   └── .env.example      # 环境变量模板
├── web/                  # React 前端
│   ├── src/
│   │   ├── components/   # 通用组件
│   │   ├── context/      # 全局状态
│   │   ├── pages/        # 页面组件
│   │   └── services/     # API 调用层
│   └── vite.config.ts
└── desktop/              # Electron 壳
    ├── main.js
    └── package.json
```

---

## 三、阶段二：后端核心服务开发

### 3.1 VLM 公式识别器（recognizer.py）

**目标**：封装 OpenAI 兼容 API 调用，实现图片 → LaTeX 的转换。

**实现要点**：
1. 使用 `openai` SDK 调用 `/chat/completions` 接口
2. 图片以 base64 编码传入 `image_url` 字段
3. 使用专用 System Prompt 引导模型输出纯 LaTeX 代码
4. 支持多供应商（OpenAI、DeepSeek、阿里云百炼、智谱）
5. 添加 `validate_api_config()` 函数，在启动时检查 API Key 配置

**关键 System Prompt**：
```
你是一个专业的数学公式识别助手。
请识别图片中的数学公式，并以纯 LaTeX 格式输出。
不要添加任何解释、前缀或后缀，只输出 LaTeX 代码。
```

### 3.2 LaTeX 后处理器（latex_processor.py）

**目标**：验证和清理 VLM 返回的 LaTeX 代码。

**实现要点**：
1. 括号匹配验证（`{` 与 `}`、`\left` 与 `\right`）
2. 常见 LaTeX 语法错误自动修复
3. 格式化输出（标准化空格、换行）

**后续迭代增强**：
- 新增 `LatexOptimizer` 类，处理 VLM 返回的多余内容
- `strip_environment()`：剥离 `\begin{align}` 等 15 种数学环境
- `clean_vlm_output()`：完整清理管线（环境剥离 + 分支拆分 + 文字移除）
- `process_latex_from_vlm()`：返回拆分后的公式列表

### 3.3 文档解析器（document_parser.py）

**目标**：从 PDF/Word 文档中提取公式候选。

**PDF 解析**（PyMuPDF）：
1. 逐页渲染为图像
2. 提取页面中的嵌入图片
3. 返回图片列表供 VLM 识别

**Word 解析**（python-docx）：
1. 提取文档中的图片 → VLM 识别
2. **核心突破**：识别 Word 原生 OMML 公式
   - 遍历 XML 中的 `<m:oMath>` 元素
   - OMML 树 → MathML 树转换
   - MathML → LaTeX 字符串转换
   - 支持 13 种数学结构：分数、根号、上下标、求和、积分、矩阵、括号、函数、重音、极限、盒子、分组、文本

**OMML 转换难点与解决**：
| 问题 | 解决方案 |
|------|---------|
| 文本节点混合内容（如 `=I+`） | 开发 `_tokenize_text()` 按运算符边界拆分 |
| MathML 实体 `&ApplyFunction;` 未定义 | 替换为 Unicode `\u2061` |
| 分数 `num/den` 多子元素 | 用单个 `<mrow>` 包裹 |
| 希腊字母无法输出 | 设置 UTF-8 编码 `sys.stdout` |

### 3.4 公式库持久化（formulas.py）

**目标**：实现公式的增删改查，JSON 文件存储。

**实现要点**：
1. `_load_formulas()` / `_save_formulas()`：JSON 文件读写
2. 每条公式记录包含：id、latex、source_paper_title、created_at
3. 支持批量保存（一个文档的多个公式一次性入库）
4. 按 `source_paper_title` 分组查询

---

## 四、阶段三：前端界面开发

### 4.1 首页（HomePage.tsx）

**目标**：项目介绍 + 星空粒子动画背景。

**实现要点**：
1. 使用 Canvas 绘制星空粒子动画（Starfield 组件）
2. 粒子随机运动，鼠标交互产生引力/斥力效果
3. 响应式布局，适配不同屏幕尺寸

### 4.2 上传识别页（UploadPage.tsx）

**目标**：核心功能页面，支持图片/文档上传和识别。

**实现要点**：
1. 拖拽上传区域：支持拖拽和点击上传
2. 文件类型检测：图片（png/jpg/webp）vs 文档（pdf/docx）
3. 识别结果卡片（ResultCard 组件）：
   - 显示 LaTeX 代码（等宽字体 + 语法高亮）
   - 处理时间展示
   - 操作按钮：复制 LaTeX、重新识别、保存到公式库
4. 快捷键支持：`Ctrl+C` 复制最新识别结果
5. 批量保存：一键将当前页所有结果保存到公式库

### 4.3 公式库页（MyLibraryPage.tsx）

**目标**：管理已保存的公式。

**实现要点**：
1. 按 `source_paper_title` 分组显示
2. 可折叠/展开各分组
3. 点击分组标题切换展开状态
4. 每个公式卡片显示 LaTeX 代码，支持复制

### 4.4 全局状态管理（RecognitionContext.tsx）

**目标**：跨页面共享识别任务状态，确保页面切换不中断任务。

**实现要点**：
1. 使用 React Context 创建全局状态
2. 识别任务在 Context 中异步执行
3. 导航栏实时显示任务状态（识别中 / 完成 / 错误）
4. 页面切换时任务继续运行，切换回来可看到最新结果

---

## 五、阶段四：桌面端封装

**目标**：用 Electron 将 Web 前端封装为桌面应用。

**实现**：
1. `main.js`：创建 BrowserWindow，加载前端页面
2. 支持系统托盘、快捷键注册
3. 截图捕获功能（capture.html）

---

## 六、阶段五：迭代修复与优化

### 迭代 1：依赖安装问题
- **问题**：`opencv-python-headless==4.10.0` 找不到匹配版本
- **修复**：改为 `>=4.10.0`，限制 `numpy>=1.26.0,<2.0.0`

### 迭代 2：API 配置问题
- **问题**：用户未配置 API Key 导致 500 错误
- **修复**：添加 `validate_api_config()` 启动检查，给出明确配置提示

### 迭代 3：Word 公式无法识别
- **问题**：Word 原生 OMML 公式被忽略
- **修复**：重写 `document_parser.py`，实现 OMML → MathML → LaTeX 完整转换管线

### 迭代 4：识别结果错误与公式库保存失败
- **问题**：OMML 文本节点混合内容未拆分，公式库接口为占位符
- **修复**：
  - 开发 `_tokenize_text()` 按运算符拆分
  - 实现 JSON 文件持久化 CRUD

### 迭代 5：PDF 识别结果含多余内容
- **问题**：VLM 返回包含 `\begin{align}`、`\tag{}`、`\text{中文}` 等
- **修复**：开发 `clean_vlm_output()` 完整清理管线

### 迭代 6：公式库分类整合
- **问题**：公式列表平铺，无法按文档来源查看
- **修复**：前端按 `source_paper_title` 分组，实现可折叠分组视图

### 迭代 7：新增重新识别功能
- **需求**：对识别不满意的结果可以重新识别
- **实现**：
  - 后端新增 `POST /api/v1/recognize/rerender` 接口
  - 前端每个 ResultCard 添加「重新识别」按钮
  - 文档识别结果中附带原始图片 base64

### 迭代 8：取消置信度显示
- **需求**：简化卡片头部信息
- **实现**：移除 ResultCard 中的置信度 badge

### 迭代 9：公式文字清理
- **问题**：识别结果中仍残留 `\text{姿态指数映射}` 等中文描述
- **修复**：`clean_vlm_output()` 中 `\text{}` 替换为空字符串（不再保留文本）

### 迭代 10：单图识别未走清理管线
- **问题**：单图识别用 `process_latex()` 而非 `process_latex_from_vlm()`
- **修复**：统一所有识别入口使用 VLM 清理管线

### 迭代 11：环境嵌入中间位置未处理
- **问题**：`\begin{align}` 出现在字符串中间（如 `文字 \begin{align} ... \end{align}`）时未剥离
- **修复**：`strip_environment()` 增加正则匹配中间环境的情况

---

## 七、阶段六：项目打包

### 7.1 交互式 Demo 打包

```bash
cd yanyiji/web
npm install
npx vite build
# 修复 index.html 中的绝对路径为相对路径
# 打包为 yanyiji-demo.zip
```

### 7.2 源码打包

```bash
# 排除以下内容：
# - node_modules、__pycache__、dist、build、uploads
# - .env（敏感信息）、*.pyc、*.db、*.sqlite3
# - 调试脚本（debug_omml.py、test_clean.py）
```

---

## 八、开发总结

### 技术亮点

| 亮点 | 说明 |
|------|------|
| OMML 公式解析 | 从零实现 Word 原生公式的 XML 解析与 LaTeX 转换，覆盖 13 种数学结构 |
| VLM 输出清理 | 多层次的 LaTeX 后处理管线，确保输出干净可用 |
| 跨页面状态保持 | React Context 实现识别任务全局管理，页面切换不中断 |
| 文档批量处理 | 一条龙：上传 → 解析 → 提取图片 → VLM 识别 → 清理 → 入库 |

### 关键文件清单

| 文件 | 行数 | 说明 |
|------|------|------|
| `backend/app/services/recognizer.py` | ~120 | VLM 识别器 |
| `backend/app/services/latex_processor.py` | ~250 | LaTeX 清理与验证 |
| `backend/app/services/document_parser.py` | ~400 | PDF/Word 文档解析 |
| `backend/app/api/recognize.py` | ~150 | 识别 API 路由 |
| `backend/app/api/formulas.py` | ~120 | 公式库 API |
| `web/src/pages/UploadPage.tsx` | ~300 | 上传识别页面 |
| `web/src/pages/MyLibraryPage.tsx` | ~200 | 公式库页面 |
| `web/src/context/RecognitionContext.tsx` | ~150 | 全局状态管理 |
| `web/src/components/ResultCard.tsx` | ~100 | 识别结果卡片 |

### TRAE 使用心得

整个项目从架构设计到每一行代码，都是通过和 TRAE 对话完成的：

1. **需求拆解**：把模糊的想法（"提取论文公式"）讲给 TRAE，它帮我把需求拆解成可执行的技术方案
2. **代码生成**：描述每个模块的功能，TRAE 生成完整代码，我只需 review 和测试
3. **调试修复**：遇到报错直接把错误信息贴给 TRAE，它能快速定位问题并给出修复方案
4. **迭代优化**：每次提出新需求（"把公式按文档分类"、"加个重新识别按钮"），TRAE 都能准确理解并在现有代码基础上扩展
5. **最难的部分**：OMML 公式解析。这个涉及 Office MathML 的 XML 树结构，我完全不懂，但 TRAE 帮我从零实现了整条转换管线，通过反复对话逐步修复了各种边界情况