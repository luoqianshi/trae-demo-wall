# 快讯包装生成器 - MVP 集成版

一个可实际运行的最小可用版本：输入新闻口播稿 → 本地规则识别包装点 → 选择包装点 → 渲染生成带透明通道的 ProRes 4444 MOV。

## 交付物位置

所有工作都在本文件夹内，未修改其他 agent 的成果：

- 网页入口：[public/index.html](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/public/index.html)
- 本地服务：[server/index.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/server/index.js)
- 文稿识别：[analyzer/src/analyzer.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/analyzer/src/analyzer.js)
- 渲染管线：[renderer/render-template.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/renderer/render-template.js)
- 适配层：[server/analyze-adapter.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/server/analyze-adapter.js)、[server/render-adapter.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/server/render-adapter.js)
- 导出结果：`output/`
- 集成说明：[INTEGRATION.md](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/INTEGRATION.md)
- 测试记录：[TEST-RECORD.md](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/TEST-RECORD.md)
- 完整包装轨页面：[public/track.html](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/public/track.html)
- 完整包装轨接口：[server/track-controller.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/server/track-controller.js)

## 环境要求

- macOS（当前 Demo 主要在 macOS 上验证）
- Node.js >= 16
- Google Chrome（用于 Puppeteer 截帧）
- FFmpeg + FFprobe（需支持 `prores_ks` 编码器）

> FFmpeg 会依次读取 `FFMPEG_PATH` / `FFPROBE_PATH` 环境变量、系统 PATH 和本机 TRAE 环境兜底路径。Google Chrome 默认读取 macOS 标准安装位置；其他系统可使用 Puppeteer 正常下载的 Chromium。

## 安装

```bash
npm install
```

如果 Puppeteer 下载 Chromium 失败，并且本机已经安装 Google Chrome，可跳过下载并复用系统 Chrome：

```bash
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

如 FFmpeg 没有加入系统 PATH，可在启动或渲染前指定路径：

```bash
export FFMPEG_PATH=/你的路径/ffmpeg
export FFPROBE_PATH=/你的路径/ffprobe
```

## 启动

```bash
npm start
```

服务默认运行在 http://127.0.0.1:8080

## 演示流程

1. 打开浏览器访问 http://127.0.0.1:8080
2. 在左侧“文稿输入”区粘贴一段口播稿，或点击示例文稿按钮加载测试文本
3. 点击“AI 识别”，左侧会列出识别出的包装点（数据卡、观点花字、时间轴、标题卡）
4. 点击任意包装点卡片，中间预览区会显示对应模板效果；右侧面板会显示时间轴队列
5. 在右侧“导出控制台”选择输出格式（默认 MOV ProRes 4444），点击“导出渲染”
6. 等待进度条完成，点击“下载文件”保存 MOV，或在 `output/<模板名>/` 目录下找到文件

## 完整包装轨导出流程（新增）

在首页顶部工具栏切换为“完整包装轨”模式：

1. **导入媒体素材**：上传完整视频或音频文件（如 `.mp4`、`.mp3`、`.wav`）
2. **导入正式口播稿**：粘贴或上传 `.txt` 正式稿
3. **获取时间信息**（二选一）：
   - 点击“用 Whisper 识别语音”调用本地 Whisper（优先复用 `/Users/hutianwei/Documents/trae motion/transform` 下的环境）
   - 或直接上传已有的 `.srt` / `.json` 字幕文件作为兜底
4. **对齐与识别**：点击“开始对齐”，系统会把正式稿里的句子与语音时间对齐，并基于正式稿识别需要包装的内容
5. **查看结果**：页面会展示每句话的对齐时间、识别到的包装点及其出现时间、未成功对齐的内容
6. **导出完整轨**：点击“导出完整包装轨”，生成一条与媒体等长的透明通道 MOV，没有包装的地方保持透明空白

> **产品逻辑重点**：用户导入的**正式口播稿才是主文本**。语音识别或字幕只用来找时间，最终显示在包装里的文字一定来自正式稿。

> `track.html` 仍作为独立备用入口保留，但推荐使用统一的 `index.html` 进行模式切换。

## 可用命令

```bash
# 启动本地服务
npm start

# 单独渲染某一类模板
npm run render:data
npm run render:quote
npm run render:timeline
npm run render:title

# 渲染全部四类模板
npm run render:all

# 验证 output 下所有 MOV 是否满足分辨率/时长/透明通道
npm run verify:all

# 完整包装轨端到端冒烟测试（上传媒体 + Whisper + 对齐 + 渲染）
node tests/track-flow-smoke.js
```

## 项目结构

```
mvp-integration-agent/
├── analyzer/           # 本地规则识别引擎（复用 Agent C）
├── public/             # 前端统一工作台（单条导出 + 完整包装轨两种模式）
│   ├── index.html      # 统一入口，顶部切换「单条导出 / 完整包装轨」
│   ├── track.html      # 完整包装轨独立备用入口
│   ├── js/
│   │   ├── main.js     # 应用入口与模式切换
│   │   └── track-panel.js  # 完整包装轨面板逻辑
│   └── css/
│       └── track.css   # 完整包装轨面板样式
├── renderer/           # HyperFrames 渲染管线（复用 Agent B）
├── server/             # MVP 集成服务、适配层与完整包装轨 API
├── templates/          # 4 类模板：data_card / quote_highlight / timeline / title_card
├── tests/              # 冒烟测试与流程验证
├── uploads/            # 用户上传的媒体、文稿、字幕（运行时生成）
├── output/             # 生成的 MOV / 预览图
├── package.json
├── README.md           # 本文件
├── INTEGRATION.md      # 集成说明
└── TEST-RECORD.md      # 测试记录
```

## 已知边界与临时方案

- **AI 识别**：使用本地规则（正则 + 关键词），不调用远程 Kimi / DeepSeek API，无需 key。
- **分辨率**：当前模板输出为竖版 `1080×1700`，如需横版 `1920×1080`，需同步调整 [renderer/config.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/renderer/config.js) 与模板 CSS。
- **队列与并发**：渲染为同步执行，单次请求阻塞约 3-8 秒；未实现复杂队列或云渲染。
- **进度反馈**：后端实际是同步渲染，前端在 `api.js` 中模拟了排队/处理中的进度动画。
- **无登录、无数据库**：所有状态保存在前端内存，刷新页面后识别结果会清空。
- **完整包装轨的文本对齐**：使用 LCS 相似度匹配正式稿句子与语音识别/字幕文本。若口播稿与语音差异过大，可能出现对齐失败或时间偏差。
- **语音识别兜底**：Whisper 识别失败时，可上传 `.srt` 或 `.json` 字幕文件继续完成后续流程，不会因识别失败导致功能不可用。
- **完整轨分辨率**：与单条包装一致，当前为竖版 `1080×1700`；后续如需 `1920×1080`，需同步调整 [renderer/config.js](file:///Users/hutianwei/Documents/trae%20motion/mvp-integration-agent/renderer/config.js) 与模板 CSS。
- **单条包装未被破坏**：原有 `/api/analyze`、`/api/render` 与首页 `/index.html` 保持原逻辑与交互不变。

## 主题色

- 琥珀色：`#f59e0b`
- 蓝色：`#3b82f6`
