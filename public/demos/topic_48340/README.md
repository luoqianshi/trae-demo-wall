# 《你好，我的思念》· 初赛 Demo

> 一个让家庭成员"打给爷爷一通电话"的 AI 家庭记忆馆。  
> TRAE AI 创造力大赛 · 初赛提交版 · v0.5

## 怎么打开

### 方式一：双击 `index.html`（最快）
直接双击 `index.html` 即可在浏览器中打开。  
**推荐用 Chrome / Edge / Safari**，所有交互（拨号、通话、动效）均离线运行。

### 方式二：本地服务（推荐）
部分浏览器对 `file://` 协议有字体加载限制，建议用本地服务打开：

```bash
# 进入项目根目录
cd hello-my-longing-demo

# Python 3
python -m http.server 8765

# 或者 Node.js
npx http-server -p 8765
```

然后浏览器访问：<http://127.0.0.1:8765/>

## 项目结构

```
hello-my-longing-demo/
├── index.html              ← 主页（AI 家庭记忆馆入口）
├── page-feed.html          ← 1 / 5  · 家庭流
├── page-translate.html     ← 2 / 5  · 温柔翻译
├── page-past.html          ← 3 / 5  · 过去的今天
├── page-remembrance.html   ← 4 / 5  · 思念复刻（打电话给爷爷）
├── page-ethics.html        ← 5 / 5  · 伦理边界
├── page-card.html          ← 家庭对话卡（温柔翻译的子页）
├── page-record.html        ← 日常记录（家庭流的子页）
├── page-memory.html        ← 思念回忆（家庭时间线）
├── _shared/
│   ├── css/site.css        ← 公共样式（信纸米色 / 搪瓷杯 / Lora 字体）
│   └── fonts/              ← Lora + Instrument Sans 5 个 TTF
└── assets/
    ├── data.js             ← 5 个家庭案例 + 启发式引擎 + localStorage
    ├── ambient.js          ← 动效（fadeUp / stampPulse / bgDrift）
    ├── page-feed.js
    ├── page-translate.js
    ├── page-card.js
    ├── page-record.js
    ├── page-memory.js
    ├── page-past.js
    └── page-remembrance.js ← 打电话状态机（拨号→接通→通话→挂断）
```

## 演示路径建议（5 分钟走完）

1. **主页** index.html → 顶部 5 个 AI 能力总览
2. **家庭流** page-feed.html → 4 条家庭发布（HE 温馨 / BE 思念 风格切换）
3. **温柔翻译** page-translate.html → 选一个家庭场景，点"开始翻译"
4. **过去的今天** page-past.html → 2 张"X 年前的今天"回忆卡
5. **思念复刻** page-remembrance.html → 点击"📞"→ 拨号键盘拨 11 位 → 通话中
6. **伦理边界** page-ethics.html → 7 条原则 + 4 条"我们不做"

## 核心亮点

- **8 个 AI 模块全部带「AI」角标**，让用户清楚知道"什么是 AI 做的、什么是人做的"
- **「打给爷爷的电话」**：把思念复刻设计成真实的电话 UI（拨号键盘 / 通话计时 / 静音 / 免提）
- **4 个对话场景**：日常问候 / 委屈倾诉 / 分享喜悦 / 自由对话
- **委屈倾诉**：当用户和家人关系不好、或受了委屈，AI 复刻的爷爷成为最柔软的出口
- **伦理边界**：7 条原则、4 条"我们不做"、3 条"初赛里我们做到什么程度"
- **完全离线**：零网络依赖，所有 AI 都是本地预设 + 启发式引擎

## 技术栈

- 纯 HTML + CSS + JavaScript（无框架）
- localStorage 跨页数据（hml_card / hml_memory / hml_case）
- CSS Variables + @keyframes + IntersectionObserver
- Lora (serif) + Instrument Sans (sans-serif)
- 信纸米色 #f7efe2 · 搪瓷杯 · 暖色卡片

## 复赛计划

- 微信小程序（uniapp 移植）
- 接入 Coze 智能体（语音合成 + 真实对话）
- 30 秒产品视频
- 真实家庭案例访谈

——  
参赛者：见报名信息 · 联系方式：xinyantao20070803@aliyun.com  
v0.5 · 9 页 HTML · 319 KB · 100% 离线
