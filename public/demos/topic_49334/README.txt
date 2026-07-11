PAi · 编程学习伙伴 — 发布版 v13.0（多语言版）
================================

【文件结构】
  index.html      ← 入口页（打开这个开始使用）
  pai-ide.html    ← 主程序
  _shared/vs/     ← Monaco编辑器（桌面端依赖，手机端不需要）

【使用方法】
  方式1：双击 index.html 用浏览器打开
  方式2：双击 pai-ide.html 直接进入主程序
  方式3：部署到GitHub Pages等静态托管，给评委一个URL

【设备自动适配】
  手机（触屏）→ 自动进入纯聊天演示模式，不加载编辑器
  电脑（鼠标）→ 自动进入完整IDE模式，含代码编辑和运行
  手动切换 → 点击右上角 📱/💻 按钮强制切换

【支持语言（v13新增）】
  Python、JavaScript、TypeScript、Java、C/C++、C#、Go、Rust
  HTML、CSS、SQL、PHP、Ruby、Swift、Kotlin
  共15种主流编程语言，编辑器自动切换语法高亮
  AI回复代码块自动识别语言并高亮
  演示模式QA库支持7种语言主题识别

【功能说明】
  📚 AI对话 — 演示模式无需API Key，内置17个主题问答库
  💻 代码编辑 — 桌面端Monaco编辑器，15种语言语法高亮
  ▶ 代码运行 — 仅Python支持在线运行（Pyodide WASM）
  🏆 成就系统 — 5维度能力追踪 + 10个徽章
  📊 概念图示 — AI回复含概念时自动出现图示按钮
  👤 个人资料 — 点击头像查看成就解锁数和学习时长
  🌐 语言切换 — 编辑器工具栏下拉选择，每个对话独立保存

【配置真实API（可选）】
  1. 连续点击右上角 ⚙ 设置按钮5次解锁
  2. 选择服务商（DeepSeek/OpenAI）
  3. 填入API Key保存
  4. 状态栏从"演示"变为服务商名称

【技术说明】
  手机端：纯前端零本地依赖，跳过Monaco加载，秒开
  桌面端：需 _shared/vs/ 目录，Pyodide从CDN加载
  数据：所有对话和成就存储在浏览器localStorage，不传服务器
  兼容：Chrome/Edge/Firefox/Safari 最新版

【版本】
  v13.0 — 2026/6/28 多语言版正式发布
  对话ID: 6a3934a7b3555834a9dfd93a
  开发工具: TRAE Work CN 0.1.23
