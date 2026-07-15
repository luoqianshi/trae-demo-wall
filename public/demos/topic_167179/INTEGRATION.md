# MVP 集成说明

## 目标

把分散的前端界面、文本识别、渲染模板三个方向的原型，串成一条可演示的链路：

```
文稿输入 → 本地规则识别 → 前端展示/选择 → 后端渲染 → 透明 MOV 导出
```

在此基础上新增**完整包装轨导出**：

```
媒体上传 → 语音识别/字幕上传 → 正式稿对齐时间 → 基于正式稿识别包装点 →
包装点绑定时间 → 完整长度透明 MOV 导出
```

所有代码、文档、输出均放在 `/Users/hutianwei/Documents/trae motion/mvp-integration-agent`，未直接修改其他 agent 的原始文件。

## 复用来源

### 1. 前端界面（Agent A：`ui-engineer-agent-a`）

复用内容：

- 三栏工作台布局：左侧文稿/识别结果、中间预览、右侧时间轴/导出
- CSS 变量体系与主题切换（暗色/浅色、琥珀/蓝色强调色）
- 状态管理 [public/js/state.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/public/js/state.js)
- 各模块脚本：script-input、result-cards、preview-panel、timeline-panel、export-panel、toast

调整点：

- [public/js/api.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/public/js/api.js) 从 Mock 改为真实调用本服务：`/api/analyze`、`/api/render`
- [public/js/result-cards.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/public/js/result-cards.js) 修正容器选择器：原代码查找不存在的 `result-cards-panel`，改为在 `script-input-panel` 内渲染
- [public/index.html](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/public/index.html) 与 [server/index.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/server/index.js) 增加 `Cache-Control` 与版本参数 `?v=mvp1`，避免修改后的静态资源被浏览器缓存
- 模板预览逻辑保留原有 CSS 模拟预览，未接入真实 HTML 模板渲染（后续可替换）

### 2. 文本识别（Agent C：`ai-logic-agent-c`）

复用内容：

- 本地规则引擎 [analyzer/src/analyzer.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/analyzer/src/analyzer.js)
- 四类规则：data-card-rule、quote-rule、timeline-rule、title-card-rule、conclusion-rule
- 工具函数：confidence、dedupe、text-offset、uuid
- 模板匹配器 [analyzer/src/matcher.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/analyzer/src/matcher.js)

调整点：

- 新增 [server/analyze-adapter.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/server/analyze-adapter.js)，统一识别结果字段，补充 `extractedData` 默认值，并把类型映射为带 `_v1` 后缀的 `suggestedTemplate`
- 没有接入真实 LLM API，所有识别完全本地运行，无需 key

### 3. 渲染与模板（Agent B：`render-engineer-env-research`）

复用内容：

- HyperFrames 渲染管线：[renderer/capture-frames.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/renderer/capture-frames.js)、[renderer/encode-prores.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/renderer/encode-prores.js)、[renderer/render-template.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/renderer/render-template.js)、[renderer/verify-output.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/renderer/verify-output.js)
- 4 套模板文件夹：`data_card`、`quote_highlight`、`timeline`、`title_card`，每套包含 `composition.html`、`schema.json`、`sample.json`
- 主题色配置 amber / blue

调整点：

- 新增 [server/render-adapter.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/server/render-adapter.js)，把前端模板 ID（如 `data_card_v1`）映射到模板目录名（如 `data_card`），并把前端请求参数转换为渲染器可识别的 `sampleData` 格式
- [renderer/config.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/renderer/config.js) 中的 `chromePath`、`ffmpegPath`、`ffprobePath` 按本机实际路径配置
- 输出目录统一为 `output/<template>/`

## 数据流转

```
┌─────────────┐      /api/analyze       ┌──────────────────┐
│  前端网页   │ ───────────────────────> │ analyze-adapter  │
│ index.html  │                          │ 本地规则引擎      │
└─────────────┘                          └──────────────────┘
       ^                                          │
       │                                          │ results
       │                                          v
       │                                  ┌──────────────────┐
       │                                  │ 前端状态/选择模板 │
       │                                  └──────────────────┘
       │                                          │
       │      /api/render {templateId, params}    │
       │ <────────────────────────────────────────┘
       │
┌──────────────────────────────────────────────────────────┐
│  render-adapter → renderer/render-template.js → FFmpeg    │
│  生成 output/<template>/<template>_<timestamp>.mov        │
└──────────────────────────────────────────────────────────┘
```

## 完整包装轨数据流

完整包装轨面板已嵌入 [public/index.html](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/public/index.html)，通过顶部工具栏的「单条导出 / 完整包装轨」按钮切换。`track.html` 仍保留为独立备用入口。

```
┌─────────────────────────────────────────────────────────────────────┐
│                         public/index.html                            │
│  ┌─────────────┐      /api/track/upload-media      ┌─────────────┐  │
│  │  index.html  │ ───────────────────────────────> │ track-controller│ │
│  │  完整包装轨面板│                                  │ (内存 session) │  │
│  └─────────────┘                                  └─────────────┘  │
│         │                                                  │        │
│         │      /api/track/upload-script                    │        │
│         │ ────────────────────────────────────────────────>│        │
│         │                                                  v        │
│         │      /api/track/transcribe 或 /api/track/upload-subtitle   │
│         │ ────────────────────────────────────────────────>│ 调用 Whisper │
│         │                                                  │ 或解析字幕   │
│         │      /api/track/align                            │        │
│         │ ────────────────────────────────────────────────>│ 对齐 + 识别  │
│         │                                                  │        │
│         │      /api/track/render                           v        │
│         │ ────────────────────────────────────────────────>│ renderTrack │
│         │                                                  │        │
│         │ <────────────────────────────────────────────────│ 完整 MOV  │
│         └──────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

### 核心模块

| 文件 | 职责 |
|------|------|
| [server/track-controller.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/server/track-controller.js) | `/api/track/*` 接口、session 管理、调用媒体处理与渲染 |
| [server/media-utils.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/server/media-utils.js) | 获取媒体时长、调用 Whisper、解析 SRT/JSON、文本对齐、包装点绑定 |
| [renderer/render-track.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/renderer/render-track.js) | 渲染每个包装点片段，并叠加到完整长度的透明底轨 |
| [public/index.html](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/public/index.html) + [public/js/track-panel.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/public/js/track-panel.js) | 统一入口页面与完整包装轨面板交互 |
| [public/track.html](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/public/track.html) | 完整包装轨独立备用入口 |

### 复用 transform 目录的 Whisper

[server/media-utils.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/server/media-utils.js) 中的 `runWhisper`：

- 使用 `/Users/hutianwei/Documents/trae motion/transform/venv/bin/python`
- 调用 `/Users/hutianwei/Documents/trae motion/transform/transcribe.py`
- 自动将本机 ffmpeg 目录 `/Users/hutianwei/Library/Application Support/TRAE SOLO CN/ModularData/ai-agent/vm/tools/opt/ffmpeg/8.1.2/bin` 加入 `PATH`，无需用户手动配置
- 默认使用 `tiny` 模型、`zh` 语言、输出 `json`

### 字幕文件兜底

当 Whisper 临时失败时，用户可上传：

- `.srt` 文件：按标准 SRT 格式解析时间轴与文本
- `.json` 文件：支持 Whisper 完整结果（含 `segments`）或直接 `segments` 数组

解析后的片段结构与 Whisper 输出一致，后续对齐与渲染流程完全相同。

### 文本对齐与包装点绑定

1. **分句**：把正式口播稿按 `。！？；\n` 切分为句子。
2. **相似度计算**：对每句正式稿与每个语音片段做最长公共子序列（LCS）匹配，忽略标点、空格、大小写。
3. **时间绑定**：相似度超过阈值（默认 `0.4`）的句子，取对应语音片段的 `start` 时间；若多个连续句子命中同一段语音，则按句子长度在段内均分时间。
4. **包装点识别**：使用原有本地规则引擎 [analyzer/src/analyzer.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/analyzer/src/analyzer.js) 分析**正式稿全文**，而不是语音识别文本。
5. **绑定时间**：根据每个包装点在正式稿中的字符偏移，找到包含它的已对齐句子，把该句子的时间赋给包装点。

## 接口契约

### POST /api/analyze

请求：

```json
{
  "text": "口播稿文本",
  "maxResults": 12
}
```

响应：

```json
{
  "status": "ok",
  "results": [
    {
      "id": "uuid",
      "type": "data_card",
      "text": "原文片段",
      "confidence": 0.92,
      "startIndex": 120,
      "endIndex": 145,
      "suggestedTemplate": "data_card_v1",
      "extractedData": { "mainText": "...", "number": "...", "unit": "..." }
    }
  ],
  "renderPayloads": []
}
```

### POST /api/render

请求：

```json
{
  "templateId": "data_card_v1",
  "params": { "mainText": "...", "number": "...", "theme": "amber" },
  "settings": { "resolution": [1080, 1700], "fps": 25, "duration": 3, "format": "mov-prores4444" }
}
```

响应：

```json
{
  "jobId": "data_card_1783433972429",
  "status": "done",
  "progress": 1,
  "downloadUrl": "/output/data_card/data_card_1783433972429.mov",
  "outputPath": "...",
  "verify": { "passed": true, "checks": { "alpha": true } }
}
```

### 完整包装轨接口

所有接口都通过 `multipart/form-data` 提交，除 `/api/track/align`、`/api/track/render`、`/api/track/transcribe` 外，均需要在上传媒体后使用返回的 `X-Session-Id` 请求头。

#### POST /api/track/upload-media

上传视频或音频文件，返回 `sessionId` 与媒体时长。

响应：

```json
{
  "status": "ok",
  "sessionId": "uuid",
  "filename": "news.mp4",
  "duration": 6.00
}
```

#### POST /api/track/upload-script

上传正式口播稿（字段 `scriptText`）或 `.txt` 文件（字段 `scriptFile`）。

响应：

```json
{
  "status": "ok",
  "sessionId": "uuid",
  "wordCount": 120
}
```

#### POST /api/track/upload-subtitle

上传 `.srt` 或 `.json` 字幕文件（字段 `subtitleFile`），作为 Whisper 的兜底方案。

响应：

```json
{
  "status": "ok",
  "sessionId": "uuid",
  "segments": [{ "start": 0.0, "end": 2.5, "text": "大家好" }],
  "source": "subtitle"
}
```

#### POST /api/track/transcribe

调用本地 Whisper 识别已上传媒体的语音。若失败，响应会附带 `hint` 提示用户可改用字幕文件。

响应：

```json
{
  "status": "ok",
  "sessionId": "uuid",
  "segments": [{ "start": 0.0, "end": 2.5, "text": "大家好" }],
  "source": "whisper"
}
```

#### POST /api/track/align

对正式稿做分句、与语音/字幕片段对齐、识别包装点、绑定时间。

响应：

```json
{
  "status": "ok",
  "sessionId": "uuid",
  "duration": 6.00,
  "aligned": [
    {
      "sentence": "大家好，今天...",
      "start": 0.0,
      "end": 2.5,
      "score": 0.85,
      "aligned": true
    }
  ],
  "packagingPoints": [
    {
      "id": "uuid",
      "type": "title_card",
      "text": "大家好，今天...",
      "suggestedTemplate": "title_card_v1",
      "time": 0.0,
      "aligned": true,
      "confidence": 0.9
    }
  ],
  "unaligned": {
    "sentences": ["未对齐的句子..."],
    "packagingPoints": ["未对齐的包装点..."]
  }
}
```

#### POST /api/track/render

渲染完整长度的透明包装轨。

响应：

```json
{
  "status": "ok",
  "sessionId": "uuid",
  "trackId": "track_1783521187562",
  "downloadUrl": "/output/track/track_track_1783521187562.mov",
  "outputPath": "...",
  "verify": {
    "passed": true,
    "checks": { "resolution": true, "duration": true, "alpha": true }
  }
}
```

## 当前限制

- **分辨率竖版**：模板与配置当前输出 `1080×1700`。若项目后续要求 `1920×1080`，需统一调整 `renderer/config.js` 与四套模板 CSS。
- **同步渲染**：`/api/render` 为同步阻塞接口，大模板（如 title_card）渲染约 5-8 秒。
- **本地依赖**：FFmpeg 与 Chrome 路径硬编码在 `renderer/config.js` 中，换机器需重新配置。
- **无持久化**：刷新页面识别结果与导出任务均丢失。
- **完整轨时间对齐**：基于 LCS 相似度，对齐质量取决于正式稿与语音/字幕文本的相似度。若口播稿与语音差异大（如大量即兴发挥），可能出现未对齐或时间偏移。
- **完整轨片段时长**：每个包装点默认展示 3 秒；若相邻包装点重叠，后者会覆盖前者，未做自动避让。
- **完整轨无在线编辑**：不提供多轨、裁剪、手动调整时间点等剪辑功能。
- **单条包装功能保留**：原有 `/api/analyze`、`/api/render` 与 `index.html` 未受影响。
