# OffDiff Demo 演示

## 快速开始

### 方式一：直接查看示例数据

打开 `index.html`，点击"查看示例"按钮，即可查看解析后的文档结构和样式展示效果。

### 方式二：构建 Wasm 实现真实解析

#### 环境要求
- Rust 工具链（https://rustup.rs/）
- wasm-pack（自动安装）

#### 构建步骤

**Windows 用户**：双击运行 `build-demo.bat`

**手动构建**：
```bash
# 1. 安装 wasm32 target
rustup target add wasm32-unknown-unknown

# 2. 安装 wasm-pack
cargo install wasm-pack

# 3. 构建 Wasm
wasm-pack build --target web --out-dir demo/pkg --release --features wasm

# 4. 启动本地服务器（推荐，避免 CORS 问题）
cd demo
python -m http.server 8080

# 5. 在浏览器中打开 http://localhost:8080
```

## 功能说明

### 可视化预览
- 按顺序展示所有段落
- 标题段落高亮显示（蓝色左边框）
- 实时还原粗体、斜体、下划线等格式
- 显示样式名称、对齐方式、缩进等元信息
- 统计段落数和样式种类

### JSON 数据
- 展示完整的结构化 JSON 输出
- 支持一键复制
- 可直接用于 Git diff 或其他处理

## 文件结构

```
demo/
├── index.html          # 主页面
├── style.css           # 样式文件
├── app.js              # 前端逻辑 + 示例数据
├── sample.docx         # 示例 Word 文档
├── pkg/                # Wasm 构建产物（构建后生成）
│   ├── offdiff.js
│   ├── offdiff_bg.wasm
│   └── ...
└── README.md           # 本文件
```

## 技术栈

- **前端**：原生 HTML/CSS/JavaScript
- **解析引擎**：Rust + WebAssembly
- **核心依赖**：quick-xml、zip、serde、wasm-bindgen

## 关于 OffDiff

OffDiff 是一个跨平台的 Office 文档结构化解析工具，旨在解决 Git 无法有意义地对比 Office 文档的问题。通过将 .docx 文件解析为保留格式信息的 JSON 数据，使格式变更在版本控制中清晰可见。

项目地址：[项目仓库]
