# 高中数学 AI 答疑 · Web 演示版

为比赛截图与现场演示用的 Web 版本。与小程序版（`../miniprogram/`、`../cloudfunctions/`）并存，复用同一套答疑逻辑（prompt-builder / response-parser / math-verifier）。

## 两个版本

### 1. 功能版（`server/` + `public/`）

可交互的真实 Web 应用。Express 后端 + 前端手机框 UI。

- 默认 **mock LLM**：没有智谱 API key 也能跑、能截图，返回预置的真题讲解 JSON。
- 配置 `ZHIPU_API_KEY` 后切真实智谱 GLM-4-Plus 调用（见下）。

```bash
cd web
npm install
npm start
# 打开 http://localhost:3000
```

切真实 AI：

```bash
cp .env.example .env
# 编辑 .env：填 ZHIPU_API_KEY=xxx，LLM_MODE=zhipu
npm start
```

### 2. 静态演示版（`public/static-demo.html`）

单 HTML 文件，硬编码内容、假加载动画，纯截图用。功能版启动后访问 http://localhost:3000/static-demo.html ，亦可直接双击文件用浏览器打开（无需起服务）。

## 目录

```
web/
├── server/
│   ├── index.js              # Express 入口
│   ├── lib/
│   │   ├── prompt-builder.js   # 复用自 cloudfunctions/fn-solve
│   │   ├── response-parser.js  # 复用
│   │   ├── math-verifier.js    # 复用（mathjs 数值验证）
│   │   ├── content-safety.js   # stub
│   │   ├── cache.js            # 内存版缓存（替代云数据库）
│   │   ├── llm-provider.js     # 智谱 GLM 真实调用
│   │   ├── llm-mock.js         # 关键词匹配的样例 LLM
│   │   └── solver.js           # 编排：安全→缓存→LLM→解析→验证→缓存
│   └── routes/
│       ├── solve.js
│       ├── ocr.js              # mock OCR
│       └── usage.js            # 配额/错题本/反馈（内存存储）
├── public/
│   ├── index.html             # 功能版前端（首页）
│   ├── app.js
│   ├── styles.css
│   └── static-demo.html       # 静态演示版（截图用）
└── .env.example
```

## 与小程序版的关系

| 维度 | 小程序版 | Web 版 |
|---|---|---|
| 正式交付物 | ✅ | 演示/截图辅助 |
| OCR | 腾讯云公式 OCR | mock（前端直接录题） |
| LLM | 智谱 GLM-4-Plus | mock 或智谱（可切） |
| 数据存储 | 微信云数据库 | 内存（重启清空） |
| 配额/支付 | 真实 | 不限 |
| 截图 | 需微信开发者工具 | 浏览器直接截 |
