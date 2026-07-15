# 快讯包装生成器 — UI 工程师 Agent A

## 如何直接打开预览

直接在浏览器中打开 `index.html` 即可，无需任何构建工具或服务器。

```bash
# macOS
open index.html

# 或直接拖入浏览器窗口
```

## 文件结构

```
ui-engineer-agent-a/
├── README.md                          # 本文件
├── index.html                         # 单页应用入口
├── css/
│   ├── variables.css                  # CSS 变量定义（颜色、尺寸、间距 Token）
│   ├── base.css                       # 全局重置、基础样式、工具类
│   ├── layout.css                     # 三栏工作台布局
│   ├── components.css                 # 全部组件样式
│   └── themes.css                     # 主题切换按钮样式
├── js/
│   ├── state.js                       # 全局状态管理（发布/订阅模式）
│   ├── mock-data.js                   # 示例文稿 + Mock 数据 + 模板定义
│   ├── api.js                         # 预留 API 接口（analyzeText / renderTemplate）
│   ├── toast.js                       # Toast 通知系统
│   ├── script-input.js                # 文稿输入区模块
│   ├── result-cards.js                # AI 识别结果卡片列表模块
│   ├── preview-panel.js               # 模板预览区模块
│   ├── timeline-panel.js              # 时间轴/包装点队列模块
│   ├── export-panel.js                # 导出控制台模块
│   └── main.js                        # 应用入口，初始化所有模块
└── docs/
    └── ui-implementation-notes.md     # UI 实现说明
```

## 已完成模块

| 模块 | 功能 | 状态 |
|------|------|------|
| 文稿输入区 | 文本粘贴、一键加载3段示例文稿、字数统计 | 完成 |
| AI 识别 | Mock 实现，返回 2-6 个包装点，模拟 800-2000ms 延迟 | 完成 |
| 识别结果卡片 | 选中、编辑、删除、上移/下移排序、置信度显示 | 完成 |
| 模板预览 | 4 类模板预览渲染、播放/暂停/进度条 | 完成 |
| 模板切换 | 模板选择器，切换当前包装点的模板 | 完成 |
| 时间轴 | 包装点队列展示、总时长计算 | 完成 |
| 导出控制台 | 格式选择（MOV/WebM/PNG）、导出进度、任务列表、下载按钮 | 完成 |
| 主题切换 | 暗色/浅色主题，通过 CSS 变量切换 | 完成 |
| 强调色切换 | 琥珀/蓝色，通过 CSS 变量切换 | 完成 |
| Toast 通知 | success/error/warning/info 四种类型 | 完成 |
| 交互反馈 | hover/active/loading/disabled/selected 状态 | 完成 |

## Mock 数据说明

### 示例文稿（3 段）

- **demo-01**：政策解读类（《数字经济发展三年行动计划》）
- **demo-02**：数据新闻类（一季度经济数据）
- **demo-03**：热点追踪类（AI 芯片发布）

### AI 识别 Mock

调用 `window.analyzeText(text)` 会：
1. 模拟 800-2000ms 网络延迟
2. 基于文稿字数生成 2-6 个包装点结果
3. 每个结果包含：id、text、type（4 种类型轮换）、confidence（75-95%）、suggestedTemplate、extractedData
4. 如果文稿少于 10 个字符，抛出错误

### 渲染 Mock

调用 `window.renderTemplate(payload)` 会：
1. 返回一个 jobId 和 onProgress 回调
2. 模拟 10 步渲染进度（每步 400-1000ms）
3. 约 10% 概率在 70% 进度时模拟失败

## 预留接口说明

### AI 解析接口

```javascript
// 位置：js/api.js
// 当前实现：Mock，返回模拟数据
// 后续对接：替换为 Agent C 的真实实现
window.analyzeText = async function (rawText) {
  // 返回格式：
  // [
  //   {
  //     id: "uuid",
  //     text: "原文片段",
  //     type: "data_card",
  //     confidence: 0.92,
  //     startIndex: 120,
  //     endIndex: 145,
  //     suggestedTemplate: "data_card_v1",
  //     extractedData: { mainText, subText, number }
  //   }
  // ]
};
```

### 渲染服务接口

```javascript
// 位置：js/api.js
// 当前实现：Mock，模拟进度
// 后续对接：替换为 Agent B 的 HTTP POST /api/render
window.renderTemplate = async function (payload) {
  // 请求格式：
  // {
  //   templateId: "data_card_v1",
  //   params: { mainText, subText, number, theme },
  //   settings: { resolution: [1080, 1700], fps: 25, duration: 3, format }
  // }
  //
  // 返回格式：
  // { jobId, onProgress: callback }
  // callback 参数：{ jobId, status, progress, error? }
};
```

## 后续需要对接的地方

### 与 AI-C（Agent C / AI 逻辑工程师）对接

1. 替换 `js/api.js` 中的 `window.analyzeText` 为真实实现
2. 确认返回的 JSON 格式与当前 Mock 结构一致
3. 确认 `type` 枚举值一致：`data_card` / `quote_highlight` / `timeline_node` / `title_card`
4. 确认 `suggestedTemplate` 映射一致

### 与 RENDER-B（Agent B / 渲染工程师）对接

1. 替换 `js/api.js` 中的 `window.renderTemplate` 为真实 HTTP POST /api/render 调用
2. 确认请求 payload 格式与后端 API 契约一致
3. 实现真实的进度轮询（GET /api/render/:jobId/status）
4. 实现真实的下载链接

### 模板对接

当前预览区的 4 个模板渲染函数在 `js/preview-panel.js` 中，是 CSS 内联样式模拟。后续需要替换为 Agent B 提供的真实模板 HTML/CSS 渲染效果。