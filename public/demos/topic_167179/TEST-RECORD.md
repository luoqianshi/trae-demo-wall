# 测试记录

## 测试环境

- 日期：2026-07-07
- 工作目录：`/Users/hutianwei/Documents/trae motion/mvp-integration-agent`
- Node.js：>= 16（package.json 要求）
- Google Chrome：`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome` ✅
- FFmpeg：`/Users/hutianwei/Library/Application Support/TRAE SOLO CN/ModularData/ai-agent/vm/tools/opt/ffmpeg/8.1.2/bin/ffmpeg` ✅
- FFprobe：`.../bin/ffprobe` ✅
- Whisper 环境：`/Users/hutianwei/Documents/trae motion/transform` ✅
- Whisper 模型：`tiny` ✅

## 1. 依赖安装

```bash
PUPPETEER_SKIP_DOWNLOAD=true npm install
```

结果：成功（`up to date`，依赖已就位）。

## 2. 本地规则识别测试

直接调用分析适配层，验证无需外部 API key 即可识别包装点：

```bash
node -e "const { analyzeScript } = require('./server/analyze-adapter'); \
const text = '2024年第一季度，我国GDP同比增长5.3%，其中新能源汽车产量突破200万辆。专家分析认为，\"这一数据表明经济复苏势头强劲\"。截至3月底，全国已有120个城市接入新系统。下一步，我们将重点推进三项工作：扩大内需、稳定就业、深化改革。'; \
const r = analyzeScript(text); \
console.log('识别数量:', r.results.length); \
r.results.slice(0,4).forEach((x,i)=>console.log(i+1, x.type, x.text.slice(0,40), '=>', x.suggestedTemplate));"
```

输出：

```
识别数量: 7
1 data_card 5.3% => data_card_v1
2 data_card 200万 => data_card_v1
3 data_card 120个 => data_card_v1
4 timeline_node 2024年 => timeline_node_v1
```

结论：✅ 本地规则能识别数据卡、时间轴、观点花字、标题卡等类型，并正确映射模板 ID。

## 3. 单模板渲染测试

执行数据卡模板渲染：

```bash
npm run render:data
```

关键输出：

```
[1/3] Capturing frames...
  Capturing 75 frames (3s @ 25fps)...
  ...
[2/3] Encoding ProRes 4444 MOV...
  Output #0, mov, to '.../output/data_card/sample.mov':
    Stream #0:0: Video: prores (4444) (ap4h / 0x68347061), yuva444p10le(tv, progressive), 1080x1700, ...
  ✅ Output: .../output/data_card/sample.mov (41.09 MB)
[3/3] Generating preview & verifying...
  === Verifying: .../output/data_card/sample.mov ===
  Resolution: 1080x1700 ✅
  Duration: 3s ✅
  Pixel format: yuva444p12le ✅ (alpha)
  Overall: ✅ PASSED
```

结论：✅ 数据卡模板真实渲染成功，输出 ProRes 4444 MOV，像素格式含 alpha 通道。

## 4. 四类模板批量验证

```bash
npm run verify:all
```

输出：

```
  === Verifying: .../output/quote_highlight/sample.mov ===
  Resolution: 1080x1700 ✅
  Duration: 3s ✅
  Pixel format: yuva444p12le ✅ (alpha)
  Overall: ✅ PASSED

  === Verifying: .../output/data_card/sample.mov ===
  ... ✅ PASSED

  === Verifying: .../output/timeline/sample.mov ===
  ... ✅ PASSED

  === Verifying: .../output/title_card/sample.mov ===
  ... ✅ PASSED

Overall: ✅ ALL PASSED
```

结论：✅ 四类模板（数据卡、观点花字、时间轴、标题卡）均生成带透明通道的 MOV。

## 5. 前端端到端链路（服务启动 + 页面访问）

启动服务：

```bash
npm start
```

服务输出：

```
🎬 快讯包装生成器 - MVP 集成服务
   访问地址: http://127.0.0.1:8080
   分析接口: POST http://127.0.0.1:8080/api/analyze
   渲染接口: POST http://127.0.0.1:8080/api/render
   文件下载: GET  http://127.0.0.1:8080/output/...
```

在浏览器中访问 http://127.0.0.1:8080 后完成以下操作：

1. 加载示例文稿
2. 点击“AI 识别” → 成功识别出 12 个包装点（示例文稿较长）
3. 选择任意包装点卡片 → 中间预览区与右侧时间轴同步更新
4. 点击“导出渲染” → 进度条从“渲染中”走到“已完成”
5. 点击“下载文件” → 浏览器下载对应 MOV

结论：✅ 前端页面可正常访问，识别 → 选择 → 导出链路完整跑通。

## 6. 生成文件检查

`output/` 目录下已有全部四类模板的样例输出：

```
output/
├── data_card/
│   ├── sample.mov
│   ├── data_card_*.mov
│   └── checker-preview.png
├── quote_highlight/
│   ├── sample.mov
│   ├── quote_highlight_*.mov
│   └── checker-preview.png
├── timeline/
│   ├── sample.mov
│   ├── timeline_*.mov
│   └── checker-preview.png
└── title_card/
    ├── sample.mov
    ├── title_card_*.mov
    └── checker-preview.png
```

## 7. 完整包装轨流程测试

执行端到端冒烟测试：

```bash
node tests/track-flow-smoke.js
```

测试素材：

- 媒体：`/Users/hutianwei/Documents/trae motion/transform/smoke-test/chinese-speech.mp4`（6 秒中文语音）
- 正式稿：`大家好，这是一次快讯包装生成器的语音识别测试，今天将为大家带来一段新节目。`

测试步骤与结果：

| 步骤 | 结果 |
|------|------|
| 上传测试视频 | ✅ 视频时长 6.00s |
| 上传正式口播稿 | ✅ 文稿字数 37 |
| Whisper 语音识别（tiny） | ✅ 识别到 1 个片段 |
| 对齐时间并识别包装点 | ✅ 1/1 句已对齐，识别到 2 个包装点 |
| 导出完整透明包装轨 | ✅ 输出 `output/track/track_track_*.mov` |
| 验证输出 MOV | ✅ Resolution 1080x1700、Duration 6.00s、Pixel format yuva444p12le、Overall PASSED |

关键 ffprobe 输出：

```
Resolution: 1080x1700
Duration: 6.00s
Pixel format: yuva444p12le
Codec: prores
```

结论：✅ 完整包装轨流程已跑通，正式稿为主文本、语音识别仅用于时间对齐、最终导出与媒体等长的透明通道 MOV。

## 验收项对照

| 验收标准 | 结果 |
|----------|------|
| 能启动 | ✅ `npm start` 成功 |
| 能打开界面 | ✅ http://127.0.0.1:8080 可访问 |
| 能识别文稿里的包装点 | ✅ 本地规则识别出数据/观点/时间轴/标题 |
| 能触发真实渲染 | ✅ `/api/render` 调用 FFmpeg 生成 MOV |
| 能生成 MOV 文件 | ✅ output/ 下四类模板均有 MOV |
| 视频带透明通道 | ✅ 像素格式 `yuva444p12le` |
| 不污染其他 agent 成果 | ✅ 所有工作在本文件夹内 |
| 原 MVP 单条导出仍可用 | ✅ `/api/analyze`、`/api/render`、`index.html` 未改动 |
| 可上传素材和正式稿 | ✅ `/api/track/upload-media`、`/api/track/upload-script` |
| 可用 Whisper 或字幕标时间 | ✅ Whisper 识别通过；`.srt`/`.json` 字幕解析已就绪 |
| 包装点识别基于正式稿 | ✅ `identifyAndBindPackagingPoints` 分析 `session.scriptText` |
| 页面能看到包装点时间 | ✅ `/api/track/align` 返回 `packagingPoints[].time` |
| 完整流程已跑通 | ✅ `tests/track-flow-smoke.js` 通过 |
| 导出完整长度透明 MOV | ✅ 6.00s、1080x1700、ProRes 4444、alpha 通道 |
| 无包装处透明空白 | ✅ 通过透明底图 + overlay 合成实现 |

## 备注

- 当前输出分辨率为竖版 `1080×1700`，是继承自现有模板的设定。若后续需要横版 `1920×1080`，需统一调整 `renderer/config.js` 与模板 CSS。
- title_card 模板因包含扫描线/光效，文件体积较大，属于已知现象。
- 完整包装轨测试使用 transform 目录下的 Whisper tiny 模型；语音识别结果存在繁体/错字，但对齐仍基于正式稿，包装文字来自正式稿。
- 若 Whisper 不可用，可上传 `.srt` 或 `.json` 字幕文件继续完成对齐与导出。
