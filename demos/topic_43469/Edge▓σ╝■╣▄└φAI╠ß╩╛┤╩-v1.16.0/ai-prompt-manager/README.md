# AI Prompt Manager

<p align="center">
  <img src="./icons/icon128.png" alt="AI Prompt Manager Logo" width="80" height="80">
</p>

<p align="center">
  <strong>一个简洁优雅的 AI 提示词管理WEB端插件</strong>
</p>

<p align="center">
  <a href="#功能特性">功能特性</a> •
  <a href="#安装方法">安装方法</a> •
  <a href="#使用指南">使用指南</a> •
  <a href="#配置说明">配置说明</a> •
  <a href="#技术架构">技术架构</a>
</p>

<p align="center">
  <strong>中文</strong> |
  <a href="README-EN.md">English</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/license-CC%20BY--NC%204.0-blue.svg" alt="License">
  <img src="https://img.shields.io/badge/version-1.16.0-green.svg" alt="Version">
  <img src="https://img.shields.io/badge/platform-Edge%20%7C%20Chrome-orange.svg" alt="Platform">
</p>

---

## 📸 界面预览

### 安装完成

<p align="center">
  <img src="./docs/screenshots/installed.png" alt="安装完成" width="800">
  <br>
  <em>安装完成后，扩展图标出现在浏览器工具栏</em>
</p>

### 主界面

<p align="center">
  <img src="./docs/screenshots/main-interface.png" alt="主界面" width="255">
  <br>
  <em>主界面 - 提示词列表，支持搜索和分类筛选</em>
</p>

### 添加/编辑提示词

<p align="center">
  <img src="./docs/screenshots/edit-prompt.png" alt="编辑提示词" width="255">
  <br>
  <em>添加或编辑提示词，支持选择已有分类或创建新分类</em>
</p>

### AI 生成提示词

<p align="center">
  <img src="./docs/screenshots/ai-generate.png" alt="AI 生成提示词" width="255">
  <br>
  <em>调用 AI API 自动生成专业提示词，支持 10+ 家国内外 AI 提供商</em>
</p>

### 设置面板

<p align="center">
  <img src="./docs/screenshots/settings.png" alt="设置面板" width="255">
  <br>
  <em>设置面板 - 管理分类排序和悬浮图标显示的网站</em>
</p>

### 悬浮图标与快速选择

<p align="center">
  <img src="./docs/screenshots/quick-popup.png" alt="悬浮图标与快速选择面板">
  <br>
  <em>悬浮在 AI 网站上的快捷按钮，点击后弹出提示词快速选择面板</em>
</p>

---

## ✨ 功能特性

### 🎯 核心功能

| 功能 | 描述 |
|------|------|
| **提示词管理** | 添加、编辑、删除提示词，支持分类管理 |
| **一键复制** | 点击提示词即可复制到剪贴板，快速粘贴到 AI 对话中 |
| **分类系统** | 自定义分类，支持拖拽排序，方便按场景组织提示词 |
| **搜索筛选** | 支持关键词搜索和按分类筛选，快速定位提示词 |
| **悬浮图标** | 在配置的 AI 网站上显示悬浮按钮，无需打开扩展即可快速使用 |
| **自动填入** | 悬浮窗点击提示词自动填入 AI 网站聊天输入框，支持 15+ 主流网站，兼容 React/Vue 等框架 |
| **AI 生成提示词** | 调用 AI API 自动生成专业提示词，支持自定义模型 |
| **分类同步** | 主界面选择的分类自动同步到悬浮窗，保持一致的筛选状态 |
| **导入导出配置** | 一键导出所有配置备份，支持从备份文件导入迁移数据 |

### 🤖 AI 生成提示词

支持 10+ 家国内外主流 AI 提供商：

**国际**
- OpenAI (GPT-4o, GPT-4o Mini)
- Anthropic (Claude Sonnet 4, Claude 3.5 Sonnet, Claude 3 Haiku)
- DeepSeek (DeepSeek V3, DeepSeek R1)

**国内**
- 通义千问 (Qwen Max, Plus, Turbo, Long)
- 豆包 (Pro 32K, Pro 128K, Lite 32K)
- 智谱 (GLM-4 Plus, Flash, Long)
- Moonshot (V1 128K, 32K, 8K)
- 零一万物 (Yi Lightning, Large, Medium)
- 百川 (百川4, 百川3 Turbo)
- 阶跃星辰 (Step-2 16K, Step-1 Flash)
- MiniMax (MiniMax-Text-01, abab6.5s)

**自定义**
- 支持任意 OpenAI 兼容接口
- 支持自定义模型 ID（如豆包的 Endpoint ID）

### 🎨 设计特色

- **Apple 风格设计** - 简洁优雅的界面，符合 macOS 设计规范
- **紧凑布局** - 小尺寸弹窗，不占用过多屏幕空间
- **流畅动画** - 精心调校的过渡动画，提升使用体验
- **智能定位** - 悬浮图标弹窗智能定位，始终保持在可视区域

### 🌐 支持的 AI 网站

内置 15 个国内外主流 AI 网站支持，点击提示词自动填入聊天输入框：

**国内主流（10 个）**
- DeepSeek、Kimi、文心一言、通义千问、讯飞星火
- 豆包、智谱清言、天工AI、腾讯元宝、Poe

**国际主流（5 个）**
- ChatGPT、Claude、Gemini、Copilot、Perplexity

> **自动填入功能**：在支持的 AI 网站上，点击悬浮窗中的提示词即可自动填入聊天输入框。支持 textarea、contenteditable 等多种输入框类型，兼容 React、Vue、ProseMirror 等前端框架。未匹配到的网站会降级为复制到剪贴板。
>
> 如需支持更多网站，可编辑 `config/input-selectors.json` 添加自定义选择器。

---

## 📦 安装方法

### 方式一：Edge 商店安装（推荐）

> 待上架，敬请期待

### 方式二：手动加载（开发者模式）

1. 下载本仓库代码并解压
2. 打开 Edge 浏览器，访问 `edge://extensions/`
3. 开启右上角的「开发人员模式」
4. 点击「加载解压缩的扩展」
5. 选择解压后的 `ai-prompt-manager` 文件夹
6. 扩展图标将出现在工具栏，点击即可使用

### 方式三：Chrome 浏览器

Chrome 安装步骤与 Edge 相同，访问 `chrome://extensions/` 即可

---

## 📖 使用指南

### 基础使用

1. **添加提示词**
   - 点击右上角 `+` 按钮
   - 填写标题、选择/创建分类、输入提示词内容
   - 点击保存

2. **使用提示词**
   - 点击提示词卡片即可复制内容到剪贴板
   - 或点击 📋 复制按钮

3. **编辑/删除**
   - 点击 ✏️ 编辑提示词
   - 点击 🗑️ 删除提示词

### AI 生成提示词

1. 点击主界面顶部的 AI 生成按钮
2. 首次使用需配置 API：
   - 选择 AI 提供商和模型
   - 填写 Base URL（自动填充，可修改）
   - 填写 API Key
   - 点击「保存配置」，系统自动检测 API 连通性
3. 在「描述你的需求」中输入你想要的提示词描述
4. 点击「生成提示词」等待 AI 生成
5. 对结果满意后点击「使用此提示词」保存到提示词库

### 分类管理

1. 点击顶部 ⚙️ 设置按钮
2. 在「分类管理」区域：
   - **添加**：输入分类名称，点击添加
   - **删除**：点击分类右侧的删除按钮
   - **排序**：拖拽左侧的 `⠿` 手柄调整顺序

### 悬浮图标设置

1. 在设置面板中找到「悬浮图标显示网站」
2. 添加或删除需要显示悬浮图标的网站域名
3. 访问对应网站时，右下角会出现悬浮按钮
4. 点击悬浮按钮即可快速选择提示词
5. 点击提示词后自动填入聊天输入框（失败时复制到剪贴板）
6. 悬浮窗会同步主界面的分类筛选状态

---

## ⚙️ 配置说明

### 配置文件

项目使用 JSON 配置文件管理默认数据，方便自定义：

```
config/
├── prompts.json          # 默认提示词和分类
├── sites.json            # 默认支持的 AI 网站（15 个）
├── generator.json        # AI 生成提示词配置（模型、提供商、系统提示词）
└── input-selectors.json  # AI 网站聊天输入框选择器配置
```

#### prompts.json 结构

```json
{
  "categories": ["编程开发", "学习辅助", "阅读论文", "职场办公", "翻译语言", "内容创作", "数据分析", "生活助手"],
  "prompts": [
    {
      "id": "1",
      "title": "代码审查",
      "content": "请审查以下代码...",
      "category": "编程开发"
    }
  ]
}
```

#### sites.json 结构

```json
{
  "sites": [
    {
      "name": "ChatGPT",
      "domain": "chatgpt.com",
      "category": "国际主流"
    }
  ]
}
```

#### generator.json 结构

```json
{
  "systemPrompt": "你是一位专业的 AI 提示词工程师...",
  "defaultModel": "gpt-4o-mini",
  "supportedModels": [...],
  "providerEndpoints": {
    "openai": { "baseUrl": "https://api.openai.com/v1" },
    "deepseek": { "baseUrl": "https://api.deepseek.com/v1" }
  }
}
```

修改配置文件后，需要在扩展管理页面重新加载扩展生效。

---

## 🏗️ 技术架构

### 技术栈

- **Manifest V3** - Chrome/Edge 扩展最新规范
- **原生 JavaScript** - 无框架依赖，轻量高效
- **CSS Variables** - 主题色系统，易于定制
- **Chrome Storage API** - 本地数据持久化

### 文件结构

```
ai-prompt-manager/
├── manifest.json           # 扩展配置
├── popup.html              # 主界面 HTML
├── popup.css               # 主界面样式
├── popup.js                # 主界面逻辑
├── content-script.js       # 页面注入脚本（悬浮图标）
├── floating-button.css     # 悬浮按钮样式
├── background.js           # 后台服务脚本
├── config/
│   ├── prompts.json        # 默认提示词配置
│   ├── sites.json          # 默认网站配置（15 个）
│   ├── generator.json      # AI 生成提示词配置
│   └── input-selectors.json # 聊天输入框选择器配置
├── icons/                  # 扩展图标
│   ├── icon16.png
│   ├── icon32.png
│   ├── icon48.png
│   └── icon128.png
├── CHANGELOG.md            # 版本更新记录
└── README.md               # 本文件
```

### 核心功能实现

| 功能模块 | 实现方式 |
|---------|---------|
| 数据存储 | `chrome.storage.local` API |
| 悬浮图标 | Content Script + CSS 注入 |
| 自动填入 | 站点选择器匹配 + native setter + InputEvent 触发框架响应 |
| 拖拽排序 | HTML5 Drag & Drop API |
| 剪贴板操作 | Clipboard API + 降级方案 |
| 界面动画 | CSS Transition + Keyframes |
| AI 生成 | OpenAI/Anthropic 兼容 API 调用 |
| API 检测 | 最小化请求测试连通性 |

---

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

### 开发流程

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feature/amazing-feature`
3. 提交更改：`git commit -m 'Add amazing feature'`
4. 推送分支：`git push origin feature/amazing-feature`
5. 提交 Pull Request

### 提交规范

- 使用清晰的提交信息
- 确保代码通过基本功能测试
- 更新相关文档

---

## 📄 开源协议

本项目采用 [CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) 协议。

**✅ 允许：**
- 个人学习和研究
- 非营利教育用途
- 修改和创建衍生作品（需以相同协议发布）
- 分享和传播（需署名）

**❌ 禁止：**
- 商业使用（未经许可）
- 去除版权声明
- 以不同协议分发修改版本

**💼 商业许可：**
如需将本软件用于商业目的，请联系 hetaoist@outlook.com 获取授权。

---

## ⭐ Star 趋势

<p align="center">
  <img src="https://starchart.cc/hetaoist/ai-prompt-manager.svg" alt="Star History Chart" width="600">
</p>

> Star 历史趋势图表

---

## 💖 支持项目

<p align="center">
  <table>
    <tr>
      <td align="center" width="50%">
        <strong>⭐️ Star 支持</strong>
        <br><br>
        如果这个项目对你有帮助，请点个 Star ⭐️
        <br>
        这是对我最大的鼓励！
      </td>
      <td align="center" width="50%">
        <strong>🧧 自愿赞赏</strong>
        <br><br>
        如果你觉得项目有帮助，可自愿微信赞赏
        <br>
        <img src="./docs/images/wechat-reward.png" alt="微信赞赏码" width="150">
        <br>
        <em>**个人自愿赠与，非付费/购买**</em>
      </td>
    </tr>
  </table>
</p>

> ⚠️ 法律声明：赞赏为个人自愿赠与行为，不构成任何形式的付费购买、服务交易或商业对价。赞赏者不因此获得任何商品、服务或权利。本项目为免费开源软件（CC BY-NC 4.0 协议），赞赏仅用于表达对开发者的支持和鼓励。

> 图片说明：请将你的微信赞赏二维码保存为 `./docs/images/wechat-reward.png`

---

## 📜 法律信息

- **[隐私政策 / Privacy Policy](./PRIVACY.md)** - 数据收集、存储和使用说明
- **[用户服务协议 / Terms of Service](./TERMS.md)** - 使用条款和责任边界
- **[免责声明 / Disclaimer](./DISCLAIMER.md)** - 第三方服务关联声明和责任限制

---

## 📮 联系我们

- **GitHub Issues**: [提交问题或建议](https://github.com/hetaoist/ai-prompt-manager/issues)
- **Email**: hetaoist@outlook.com

---

<p align="center">
  Made with ❤️ by hetao
</p>

<p align="center">
  <a href="#top">⬆️ 回到顶部</a>
</p>
