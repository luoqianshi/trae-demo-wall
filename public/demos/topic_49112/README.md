# 云集 MarkMind

网页标记与 AI 阅读助手。选中即标记，想法即对话，知识不再散落。

---

## 特性

### 高亮与标记

选中文本一键标记，6 种颜色可选。标记时可添加想法笔记，支持 Markdown 语法与实时预览。浮动工具栏可拖拽，内置复制 / 粘贴按钮。支持标签管理与 AI 一键生成标签。

所有弹窗支持 8 方向拖拽缩放，4 种位置模式（跟随 / 左侧 / 侧边栏 / 居中）统一边界钳位。知网等流式分块加载页面适配：三级滚动策略（transform 虚拟滚动 / overflow 容器 / 普通网页）+ 双保险工具栏显示（mouseup capture + selectionchange 兜底）。翻译弹窗点击「添加想法」时复用已有翻译结果，避免重复翻译。

iframe 嵌入式页面支持：content script 注入 `all_frames: true` + `match_about_blank_frames: true`，蓝湖 axure 等页面也能标记；右键菜单二选一（仅标记 / 标记并添加想法）通过 `info.frameId` 精准派发到 iframe；URL 取 top frame 地址栏并保留 SPA 路由 hash；popup 跨 frame 挂载到 `window.top.document.body` 并做坐标系转换。

复制标记链接：弹窗和侧边栏详情头部一键复制 `<mark.url>?wm-mark=<mark.id>`，对方打开链接后自动滚动到对应标记。

### 分组与书签

全局分组系统：标记新增 `type`（mark / bookmark）和 `group` 字段，多层路径用 `/` 拼接（如 "开发/前端"），旧记录自动迁移。侧边栏按分组二级筛选，弹窗分组 chip 统一编辑入口。

浏览器书签导入 / 导出：支持 Netscape Bookmark HTML 格式，按分组路径构建树，导入时按 `url||group` 去重。书签→标记转换流程：同 url 命中时复用 pending markId，保留 group / note。URL 规范化去重：去 hash / 末尾斜杠 / trim，同组下相同 url 合并为一条。

### 管理与筛选

侧边栏集中管理所有标记，支持按页面 / 站点 / 颜色 / 分组筛选与站点搜索。分屏模式下左侧列表、右侧详情，分隔条可拖拽。标记列表按页面位置排序（默认开启），点击标记自动滚动 + 脉冲高亮。标记与侧边栏之间有连接线直观定位。

多选后批量删除 / 导出 / 分享 / 设置分组，「更多」hover 上拉菜单收编分享 / 导出 / 设置分组三个操作。隐藏标记颜色模式下 hover 延迟触发显示，适合沉浸阅读。

### AI 助教

基于网页正文和标记文本，AI 解读原文并延伸思考。填写想法后自动评价准确性、指出错误项。支持追问对话，深入探讨。AI 参考面板被四类弹窗共用（标记 / 想法 / 翻译 / 堆叠）。MV3 service worker 心跳保活机制，解决 SW 回收导致 AI 请求中断。

内置多家主流国内外大模型接入，也支持自定义任意 OpenAI 兼容接口。

### 数据与同步

云同步抽象层 WMCloudAdapter 统一封装 GitHub / Gitee Gist API，支持双向云同步与自动定时同步。同步范围可选（marks / AI 配置 / 样式设置 / 标记设置 独立勾选）。Token / Gist ID 输入框内置复制按钮。数据导入支持拖拽文件，导出生成公开链接对方无需 Token 即可导入。自定义确认弹窗替代原生 confirm，编辑态切换 / 关闭时未保存修改检测。

### 界面定制

浅色 / 深色 / 跟随系统三种主题。全局多语言框架支持中文 / 英文 / 日文 / 韩文 / 俄文五种语言。工具栏弹出位置、标记详情弹窗位置均可自定义。侧边栏右上角「更多」按钮 hover 自动展开 + 动画过渡。

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

## 更新日志

完整更新日志见 [CHANGELOG.md](./CHANGELOG.md)。

### 最近版本速览

#### [2.11.0] - 2026-07-01
- 新增 `logger.js` 封装：导出 `wmLog/wmDebug/wmWarn/wmError`，`wmLog/wmDebug` 受开关控制
- 「标记设置」新增「调试日志」开关（默认关），开启后在控制台输出标记恢复与事件处理的详细日志
- content script 下 8 个文件共 90 处 `console.log` 替换为 `wmLog`，默认不再污染用户网页控制台
- 开关走 `markSettings.debugLog` + `MARK_SETTINGS_CHANGED` 广播复用通路，sidebar / content 双上下文实时同步

#### [2.10.0] - 2026-07-01
- 链接内标记交互优化：标记在带 `href` 的 `<a>` 内时点击正常跳转，hover 600ms 后显示标记详情弹窗
- 修复标记了链接文本后弹窗阻止链接跳转的问题

#### [2.9.0] - 2026-06-30
- 标记加载性能优化：`markDB._load()` 加缓存命中 + 严格/宽松双 URL 索引，避免每次 DB 操作重读全量数据
- 新增 `getMarksByRelaxedUrl` 走索引 O(1) 命中，替代 `restoreMarks` / `restoreAndScrollToMark` 全量遍历
- `_tryRestore` 分批异步恢复（每批 50 个 + `requestIdleCallback` 让出主线程），1000+ 标记不再阻塞页面
- `chrome.storage.onChanged` 监听保证 content↔sidebar 缓存一致

更多历史版本请查阅 [CHANGELOG.md](./CHANGELOG.md)。

---

**LINVSCODE** · ISC License
