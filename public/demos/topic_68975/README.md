# OffDiff - Office 文档结构化解析工具

## 快速体验（无需构建）

打开 `demo/index.html`，点击 **"查看示例"** 按钮，即可立即查看解析效果。

示例数据展示了：
- 标题样式（Heading1，居中，粗体）
- 段落格式（粗体、斜体、下划线）
- 多种格式混合使用
- 不同字体和字号
- 右对齐段落

## 完整功能（构建 Wasm）

要体验真实的 .docx 文件解析，需要构建 WebAssembly 模块。

### Windows 系统

双击运行 `build-demo.bat`，按提示操作即可。

### 手动构建

```bash
# 1. 安装 Rust (如果没有)
# https://rustup.rs/

# 2. 安装 wasm32 target
rustup target add wasm32-unknown-unknown

# 3. 安装 wasm-pack
cargo install wasm-pack

# 4. 构建 Wasm
wasm-pack build --target web --out-dir demo/pkg --release --features wasm

# 5. 启动本地服务器
cd demo
python -m http.server 8080

# 6. 浏览器访问 http://localhost:8080
```

构建完成后，就可以上传自己的 .docx 文件进行解析了。

## 项目结构

```
offdiff-demo-package/
├── demo/                    # 演示页面
│   ├── index.html           # 主页面
│   ├── style.css            # 样式
│   ├── app.js               # 前端逻辑（含示例数据）
│   ├── sample.docx          # 示例 Word 文档
│   ├── README.md            # Demo 说明
│   └── pkg/                 # Wasm 构建产物（构建后生成）
├── src/                     # Rust 源码
│   ├── main.rs              # CLI 入口
│   ├── lib.rs               # 库入口
│   ├── cli.rs               # CLI 定义
│   ├── error.rs             # 错误类型
│   ├── model.rs             # 数据模型
│   ├── wasm.rs              # Wasm 绑定
│   └── docx/
│       ├── mod.rs
│       ├── parser.rs        # XML 解析器
│       └── reader.rs        # ZIP 读取器
├── examples/
│   └── generate_sample.rs   # 生成示例 docx
├── Cargo.toml               # 项目配置
├── build-demo.bat           # Windows 构建脚本
└── README.md                # 本文件
```

## 功能特性

### 已实现
- ✅ DOCX 文档解析（基于 Office Open XML 标准）
- ✅ 段落级样式提取（样式名、对齐方式、缩进）
- ✅ 运行级样式提取（粗体、斜体、下划线、字号、字体）
- ✅ JSON 结构化输出
- ✅ WebAssembly 浏览器端运行
- ✅ 可视化预览界面
- ✅ 26 个单元测试通过

### 技术栈
- **Rust** - 高性能、内存安全
- **quick-xml** - 流式 XML 解析
- **zip** - ZIP 归档读取
- **serde** - JSON 序列化
- **wasm-bindgen** - Wasm 绑定
- **原生 HTML/CSS/JS** - 零前端依赖

## CLI 使用

```bash
# 构建 CLI
cargo build --release

# 解析 docx 文件
./target/release/offdiff parse input.docx

# 输出到文件
./target/release/offdiff parse input.docx -o output.json
```

## License

MIT License
