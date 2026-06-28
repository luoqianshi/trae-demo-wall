# 云集 MarkMind

网页标记与 AI 阅读助手。选中即标记，想法即对话，知识不再散落。

---

## 特性

### 高亮与标记

选中文本一键标记，6 种颜色可选。标记时可添加想法笔记，支持 Markdown 语法与实时预览。浮动工具栏可拖拽，内置复制 / 粘贴按钮。支持标签管理与 AI 一键生成标签。

### 管理与筛选

侧边栏集中管理所有标记，支持按页面 / 站点 / 颜色筛选与站点搜索。分屏模式下左侧列表、右侧详情，分隔条可拖拽。多选后批量删除 / 导出 / 分享。标记与侧边栏之间有连接线直观定位。

### AI 助教

基于网页正文和标记文本，AI 解读原文并延伸思考。填写想法后自动评价准确性、指出错误项。支持追问对话，深入探讨。

内置 9 家大模型：DeepSeek / 智谱 GLM / Moonshot Kimi / 通义千问 / 字节豆包 / 百度文心 / 腾讯混元 / OpenAI / Anthropic Claude，也支持自定义 OpenAI 兼容接口。

### 数据与同步

支持 GitHub Gist / Gitee Gist 双向云同步，可设置自动定时同步，按需勾选同步范围。数据导入支持拖拽文件，导出生成公开链接对方无需 Token 即可导入。

### 界面定制

浅色 / 深色 / 跟随系统三种主题。支持中文 / 英文 / 日文 / 韩文 / 俄文五种语言。工具栏弹出位置、标记详情弹窗位置均可自定义。隐藏标记颜色模式适合沉浸阅读。

---

## 安装

```bash
npm install          # 安装依赖
npm run build        # 构建到 dist/
npm run watch        # 监听变化自动构建
npm run pack         # 打包发布 zip
```

Chrome 加载：`chrome://extensions/` → 开发者模式 → 加载已解压的扩展程序 → 选择 `dist/`

---

## 技术栈

Chrome Extension Manifest V3 · 原生 JS (ES6+) · IndexedDB · CSS 自定义属性 · esbuild

---

**LINVSCODE** · ISC License
