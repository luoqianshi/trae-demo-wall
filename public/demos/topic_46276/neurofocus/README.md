# 脑衡 NeuroFocus

> 脑电耳机式专注疲劳检测、音频反馈与音乐恢复辅助系统
> NeuroFocus: EEG Headphone for Focus Tracking, Adaptive Audio and Music Recovery Demo
> AI 创意比赛 · 硬件交互赛道

---

## 一、项目简介

脑衡 NeuroFocus 是一个面向 AI 创意比赛（硬件交互赛道）的可交互网页 Demo。项目以**脑电耳机**为核心硬件形态，将 EEG 脑电传感、AI 状态识别、**音频反馈**、**自适应降噪（ANC）**和**音乐恢复**结合为一体，让用户在学习、工作和情绪调节中不仅看到脑状态变化，更能通过耳机声音反馈主动调整状态。

**核心创新**：脑衡 NeuroFocus 不是普通脑电设备，而是 **EEG 输入 + 音频输出 + ANC 降噪 + Brain Break 音频引导 + 音乐恢复 + 外部音乐软件接入** 的脑电耳机式智能硬件。它既能采集脑电信号，也能通过声音、降噪、音乐恢复和 Brain Break 音频反馈，帮助用户调整学习工作状态，并通过声音场景与音乐恢复辅助放松与情绪调节。NeuroFocus 不替代用户常用的音乐软件，而是模拟将脑状态反馈接入 Spotify / Apple Music / 网易云音乐 / QQ 音乐，根据专注、疲劳和平静度变化推荐声音场景。核心闭环为：脑电耳机佩戴 → EEG 采集专注/疲劳状态 → AI 判断脑状态 → 耳机输出声音反馈 → 自适应降噪/专注音乐/休息引导 → 音乐恢复模式提供声音场景与恢复引导 → 接入外部音乐软件推荐声音场景 → 生成每日大脑报告与音乐恢复摘要。

**目标用户**：学习工作人群、压力与情绪管理人群、音乐恢复爱好者。

**核心交互链路**：佩戴脑电耳机 → EEG + 音频系统同步启动 → AI 识别专注/疲劳状态 → 耳机动态切换专注音乐/降噪模式 → 疲劳升高时触发 Brain Break 音频引导 → 音乐恢复模式提供声音场景与恢复引导 → 接入外部音乐软件推荐声音场景 → 生成大脑报告与音乐恢复摘要。

**当前说明**：本 Demo 使用模拟 EEG 数据，未接入真实硬件。

---

## 二、核心功能

### 功能模块总览

| 序号 | 功能模块 | 说明 |
|------|----------|------|
| 1 | **首页产品展示** | 脑电耳机 SVG 产品图、手机 App Mockup、4 个耳机核心卖点（EEG Brain Tracking / Adaptive Focus Audio / Smart Brain Break / Music Recovery）、「为什么选择脑电耳机」说明卡片 |
| 2 | **初赛 Demo 说明** | 赛道标签、Demo 名称、产品形态、目标用户、核心交互链路、当前说明 |
| 3 | **硬件设备状态预览** | Device / Bluetooth / Battery / EEG Channels / Sample Rate / Fit Status / Data Source 等硬件参数展示 |
| 4 | **Audio & ANC Control 音频与降噪控制** | Focus 页面的音频与降噪控制面板，可切换 Focus Music / White Noise / Breath Guide / Calm Ambient 四种声音场景，以及 Adaptive / Max / Awareness / Off 四种 ANC 降噪模式，点击按钮后有 Toast 提示 |
| 5 | **Focus Dashboard 专注疲劳监测** | 实时 Focus Score、Fatigue、Calmness、Cognitive Load、Signal Quality 指标卡片、4 通道 EEG 波形图、脑状态趋势折线图、基线校准流程、场景切换 |
| 6 | **Smart Brain Break 耳机音频引导休息** | 当疲劳升高时，耳机自动切换 ANC 至 Awareness，播放 Breath Guide 呼吸节奏音和低刺激环境音，通过语音提示引导用户进行短休息，结束后显示疲劳恢复效果和平静度提升效果 |
| 7 | **Music Recovery Mode 音乐恢复模式** | 音乐恢复模式卡片，根据专注度/疲劳度/平静度动态推荐声音场景与恢复方案，提供 Focus Music 专注音乐、Calm Ambient 平静环境音、Breath Guide 呼吸引导等恢复引导，并根据脑状态实时更新推荐文案 |
| 8 | **Music App Connectors 外部音乐软件模拟接入** | 模拟接入用户常用音乐软件（Spotify / Apple Music / 网易云音乐 / QQ 音乐），在音乐恢复页面展示已连接的音乐 App。NeuroFocus 不替代音乐软件，而是将脑状态反馈接入用户常用音乐软件，根据脑状态推荐声音场景。本功能为 Demo 模拟，不涉及真实账号授权 |
| 9 | **Sound Scene Recommendation 声音场景推荐** | 根据专注度、疲劳度、平静度变化，推荐 Focus Mix / White Noise / Breath Guide / Calm Ambient 四种声音场景，以推荐逻辑 Pills 形式展示「为什么推荐这个场景」，并随脑状态实时更新推荐 |
| 10 | **Sound Scene 声音场景** | 四种声音场景切换：Focus Music 专注音乐 / White Noise 白噪声 / Breath Guide 呼吸引导 / Calm Ambient 平静环境音，每种场景对应不同的脑状态调节目标，点击切换后耳机输出相应音频反馈 |
| 11 | **Daily Brain Dashboard 大脑每日仪表盘** | 轻量 iOS Health Report：3 张 summary 卡片（认知准备度 / 大脑健康趋势 / 大脑年龄）、今日摘要、大脑趋势、音乐恢复摘要、insight 折叠卡片 |
| 12 | **Music & Recovery Summary 音乐与恢复摘要** | 报告页音乐与恢复摘要模块，展示 Focus Music 使用时长、Brain Break 音频引导次数、ANC 模式切换记录、各声音场景使用时长、疲劳恢复效果、平静度提升效果，并生成动态摘要文案 |
| 13 | **Music & Recovery Summary 音乐与恢复摘要** | 报告页音乐与恢复摘要模块，记录声音场景切换与恢复效果，展示已连接音乐 App 的使用情况、声音场景切换记录、疲劳恢复与平静度提升效果，并生成动态恢复摘要文案 |
| 14 | **Judge Demo Mode 评审快速体验模式** | 右下角悬浮按钮，6 步一键体验完整流程（点击开始实时体验 → 自动连接耳机并进入实时 EEG 趋势监测 → 连接音乐软件 → 查看推荐声音场景 → 触发 Brain Break → 生成每日脑状态报告），每步有 Toast 提示 |
| 15 | **Screenshot Mode 截图模式** | 隐藏悬浮按钮和 Toast 提示，保持页面干净，适合截图发帖，截图完成后点击顶部「退出 Exit」恢复 |
| 16 | **实时体验流程 Realtime Experience** | `startRealtimeExperience()` 高层完整入口（首页 / 报告页），自动完成佩戴检测 → 个人基线 → 实时记录 → 声音推荐 → 报告数据准备，附带进度 checklist；`wearAndMonitor()` 作为专注页低层「模拟戴上耳机」入口 |
| 17 | **iOS 风格交互 iOS-style Interaction** | 统一使用 .ios-card / .ios-pill / .ios-segmented / .ios-bottom-sheet 组件，数值 count-up、文案 dissolve 切换、卡片 stagger reveal 等平滑动画 |
| 18 | **Brain Break Bottom Sheet** | Brain Break 使用 iOS bottom sheet 替代原地展开，带呼吸圆圈动画 |
| 19 | **报告生成动画 Report Generation Animation** | 报告生成中状态 → skeleton 骨架屏 → 逐项 stagger reveal |

### 关于外部音乐软件接入的说明

NeuroFocus **不替代**用户常用的音乐软件，而是**连接**到它们。耳机根据专注、疲劳和平静度的变化，将脑状态反馈接入用户已连接的音乐 App（Spotify / Apple Music / 网易云音乐 / QQ 音乐），并推荐 Focus Mix、White Noise、Breath Guide 或 Calm Ambient 声音场景，在报告中记录声音场景切换与恢复效果。

> **重要说明**：本功能为 **Demo 模拟**，仅在前端模拟「连接音乐 App」的交互流程，**不涉及真实账号授权**，也不会读取或控制用户真实的音乐软件账户与播放列表。所有音乐 App 连接状态、推荐场景与恢复数据均为模拟生成，仅用于展示交互流程与产品概念。

---

## 三、运行方式

### 方法一：直接打开

双击 `index.html` 即可在浏览器中打开。

### 方法二：本地服务器（推荐）

```bash
cd neurofocus
python3 -m http.server 8080
# 浏览器访问 http://localhost:8080
```

### 浏览器要求

- Chrome / Edge / Safari 最新版
- 屏幕分辨率建议 1280×800 或更高
- 支持 Canvas 和 ES6 JavaScript

---

## 四、Demo 体验流程

### 方式 A：评审快速体验（推荐）

1. 打开页面后，点击右下角悬浮按钮「评审快速体验 Judge Demo Mode」
2. 在弹出面板中点击「一键体验完整流程 Run All」
3. 系统将自动完成 6 个步骤（约 53 秒）：
   - 连接脑电耳机
   - 开启专注音乐与 ANC
   - 佩戴即实时监测
   - 触发 Brain Break 音频引导
   - 进入音乐恢复模式
   - 生成大脑与音频恢复报告
4. 每一步都有 Toast 提示，无需手动操作

### 方式 B：手动体验

1. **首页**：查看产品介绍、4 个耳机核心卖点（EEG Brain Tracking / Adaptive Focus Audio / Smart Brain Break / Music Recovery）、「为什么选择脑电耳机」卡片、硬件设备状态预览
2. **专注 Focus**：点击「开始实时体验」（首页或报告页）或「模拟戴上耳机」（专注页）→ 自动完成耳机连接、个人基线校准并开始实时监测（`startRealtimeExperience()` 高层入口 / `wearAndMonitor()` 低层入口）→ 体验「Audio & ANC Control」音频与降噪控制面板（切换 Focus Music / White Noise / Breath Guide / Calm Ambient）→ 点击「Brain Break」体验耳机音频引导休息
3. **音乐恢复 Music Recovery**：进入音乐恢复模式 → 查看已连接的外部音乐 App（Spotify / Apple Music / 网易云音乐 / QQ 音乐）→ 查看根据脑状态推荐的声音场景与推荐逻辑 Pills → 切换 Focus Music / White Noise / Breath Guide / Calm Ambient 四种声音场景 → 体验恢复引导文案动态更新 → 完成后点击「生成报告」
4. **报告 Report**：查看轻量 iOS Health Report（3 张 summary 卡片：认知准备度 / 脑健康趋势 / 大脑年龄）→ 查看今日摘要、大脑趋势、音乐恢复摘要、insight 折叠卡片 → 查看**音乐与恢复摘要**（Focus Music 使用时长 / Brain Break 音频引导次数 / ANC 模式切换记录 / 各声音场景使用时长 / 疲劳恢复效果 / 平静度提升效果）

### 方式 C：一键生成示例报告

1. 进入报告 Report 页面
2. 点击「生成示例报告 Generate Sample Report」
3. 即可查看包含完整数据的报告，无需跑完整个流程

### 截图模式

- 点击评审面板中的「截图模式 Screenshot Mode」
- 悬浮按钮、Toast 提示将被隐藏，页面保持干净
- 适合截图发帖
- 截图完成后点击顶部「退出 Exit」恢复

---

## 五、初赛提交方式

1. 将整个 `neurofocus` 文件夹打包为 ZIP
2. 上传至比赛指定平台
3. 在作品帖中填写体验地址（如有部署）或说明使用 HTML Zip 替代
4. 按要求填写 TRAE Session ID（至少 3 个）

---

## 六、打包方式

**重要：必须打包整个项目文件夹，而不是只上传 index.html。**

### 打包命令

```bash
cd /workspace
zip -r neurofocus-demo.zip neurofocus/
```

### 项目必须包含的文件

```
neurofocus/
├── index.html              # 主页面（4 个页面模块 + 评审体验模式）
├── css/
│   └── style.css           # 全局样式（浅色消费级产品风格 + 深色玻璃卡片）
├── js/
│   ├── simulator.js        # EEG 数据模拟引擎 v3.0（含脑健康指标推导）
│   ├── charts.js           # Canvas 渲染引擎 v2.0
│   ├── pages.js            # 音乐恢复与报告逻辑 v4.0（含每日大脑仪表盘 + 音乐 App 接入）
│   └── app.js              # 主控制器 v4.0（含评审体验/截图模式/示例报告）
├── assets/
│   └── neurofocus-headphone.svg  # 脑电耳机 SVG 产品图
├── README.md               # 本文件
├── demo-guide.md           # 截图指南
└── post-template.md        # 初赛作品帖模板
```

**注意**：缺少任何一个文件都可能导致 Demo 无法正常运行。

---

## 七、文件结构

| 文件 | 说明 |
|------|------|
| `index.html` | 主页面，包含首页 / 专注 / 音乐恢复 / 报告四个页面模块，以及评审体验悬浮按钮、截图模式等 |
| `css/style.css` | 全局样式，浅色消费级产品风格 + 深色玻璃质感报告卡片 |
| `js/simulator.js` | EEG 数据模拟引擎，时间序列状态模型，含脑健康指标推导、大脑年龄计算、认知准备度计算 |
| `js/charts.js` | Canvas 渲染引擎，实时折线图、EEG 波形图、声音场景可视化 |
| `js/pages.js` | 音乐恢复逻辑（声音场景推荐 + 音乐 App 接入）、音频恢复引导（恢复文案/场景切换）、报告渲染逻辑（每日大脑仪表盘 + 音乐与恢复摘要） |
| `js/app.js` | 主控制器，页面导航、设备连接、Focus Session、Brain Break 音频引导、Audio & ANC Control、Music App Connectors、评审体验模式（6 步）、截图模式、示例报告生成 |
| `assets/neurofocus-headphone.svg` | 脑电耳机 SVG 产品图，首页 Hero 区域耳机产品视觉素材 |
| `README.md` | 项目说明文档 |
| `demo-guide.md` | 截图指南，列出推荐截图顺序 |
| `post-template.md` | 初赛作品帖模板 |

---

## 八、注意事项

1. **模拟数据**：当前为 Demo 模拟数据，未接入真实脑电硬件。所有 EEG 指标、Brain Age、脑健康趋势均为算法模拟生成。
2. **音乐 App 接入为模拟**：Music App Connectors 功能为 Demo 模拟，仅在前端模拟「连接音乐 App」的交互流程，不涉及真实账号授权，也不会读取或控制用户真实的 Spotify / Apple Music / 网易云音乐 / QQ 音乐账户与播放列表。所有音乐 App 连接状态、推荐场景与恢复数据均为模拟生成。
3. **非医疗用途**：不作为医疗诊断依据，音乐恢复功能仅用于放松与情绪调节辅助展示。
4. **设计参考**：设计灵感参考脑电耳机类产品形态（如 MW75 Neuro LT 的报告设计思路），产品名称为「脑衡 NeuroFocus」。未使用 Neurable 的品牌、Logo、图片和原文，仅学习其脑电报告的产品化表达方式。
5. **浏览器兼容**：建议使用 Chrome / Edge / Safari 最新版，需要支持 Canvas 和 ES6。
6. **打包要求**：必须打包整个项目文件夹，不能只上传 index.html，否则 CSS 和 JS 无法加载。
7. **评审体验**：推荐评审使用右下角「评审快速体验」按钮，一键跑通完整流程。

---

## 九、免责声明

- 本 Demo 使用模拟 EEG 数据，未接入真实脑电硬件。
- 所有 EEG 指标、Brain Age、脑健康趋势和音乐恢复建议均为算法模拟生成。
- Music App Connectors 外部音乐软件接入功能为 Demo 模拟，不涉及真实账号授权，不会读取或控制用户真实的音乐软件账户与播放列表。
- 不作为医疗诊断依据，音乐恢复功能仅用于放松与情绪调节辅助展示。
- 设计灵感参考脑电耳机类产品形态，未使用任何第三方品牌、Logo、图片和原文。
- 本项目仅用于 AI 创意比赛展示目的。

---

## 功能介绍结构

NeuroFocus 首页按以下顺序组织功能介绍（v29 高端产品官网节奏）：

1. Hero 产品大视觉（耳机 + App mockup + 浮动 widget）
2. 四个短能力入口（Daily Brain Insights / Focus & Brain Breaks / Adaptive Music Recovery / Auto Sleep Insight）
3. 今日脑状态概览
4. 为什么需要 NeuroFocus
5. 一天如何使用（时间线）
6. 专注能力预览
7. 音乐恢复预览
8. 自动睡眠洞察预览
9. 科学信任机制
10. 产品能力详情 Product Details（8 项）
11. Demo Quick Facts（4 张数字卡）
12. 场景反馈假设
13. 参数
14. FAQ

---

## 功能介绍逻辑

NeuroFocus 的功能按照脑健康耳机的用户旅程组织：

1. 每日大脑洞察 Daily Brain Insights
2. 专注与短休息 Focus & Brain Breaks
3. 自适应音乐恢复 Adaptive Music Recovery
4. 科学解释层 Science Layer
5. 每日大脑报告 Daily Brain Report
6. 产品规格与常见问题 Specs & FAQ

## 科学边界

本 Demo 使用模拟 EEG 数据，不做医学诊断。所有指标均为趋势估计。Signal Quality、Artifact Risk 和 Confidence Level 用于提醒用户：脑电数据容易受到伪迹和佩戴接触影响，不能把单个分数当作确定结论。

---

## 交互体验

NeuroFocus v29 在 v28 基础上完成页面切换状态机重构和整体视觉系统升级，核心要点：

- **实时体验入口**：`startRealtimeExperience()` 高层完整入口（首页 / 报告页），自动完成佩戴检测 → 个人基线 → 实时记录 → 声音推荐 → 报告数据准备；`wearAndMonitor()` 作为专注页低层「模拟戴上耳机」入口；`prepareExperienceAfterBaseline()` 负责基线完成后的体验补全逻辑
- **单容器叠层页面切换**：`.page-stage` + `.page-scroll` 统一系统，所有页面 `position: absolute` 叠层，active 页面内部独立滚动，彻底消除页面残留和抖动
- **清晰状态机**：`navigate()` 使用 `_navLock` 防重入，离场页先移除 `is-active` 再加 `is-leaving`，340ms 后彻底清理，`requestIdleCallback` 延迟 hydrate
- **报告 dirty flag**：`reportDirty` 标记控制报告渲染，切页时不再强制 `renderReport`，避免卡顿和残留
- **高端产品官网视觉**：Hero 产品发布页风格、Product Details + Quick Facts 模块、专注页深蓝渐变 hero 卡、音乐恢复页青蓝渐变推荐卡、报告页紫色渐变总览卡
- **高质量睡眠可视化**：深色渐变睡眠评分卡（月亮图标 + 大数字）、不同高度睡眠阶段时间线（Deep/Light/REM-like/Awake 四色）、conic-gradient 睡眠结构环图、睡眠解读 insight 卡
- **场景符号动画**：Focus Mix 波形线 / White Noise 噪声点 / Breath Guide 呼吸圆环 / Calm Ambient 柔和光斑
- **EEG 线条绘制动画**：专注页 hero 卡内 EEG 波形从左到右绘制
- **呼吸圆圈动画**：音乐恢复页推荐卡内呼吸引导动画
- **性能优化**：切页仅用 opacity + translate3d，不用 filter blur；inactive 页面暂停所有动画；支持 prefers-reduced-motion；移动端禁用 parallax
- **科学边界**：所有 EEG / 睡眠判断均为趋势估计、Demo 模拟、相对个人基线

---

## v30 交互审计 + 产品逻辑清理

### 统一入口：实时体验流程
- `App.startRealtimeExperience()` 作为高层完整入口，首页和报告页的「开始实时体验」按钮统一调用，自动完成佩戴检测 → 个人基线 → 实时记录 → 声音推荐 → 报告数据准备
- `App.wearAndMonitor()` 作为专注页低层「模拟戴上耳机」入口，专注页设备卡按钮单独调用
- `App.prepareExperienceAfterBaseline()` 负责基线完成后的体验补全逻辑（刷新声音推荐、准备报告数据）
- `App.generateReportData()` 负责报告数据整理
- 点击「开始实时体验」后，系统会模拟佩戴脑电耳机，自动检测佩戴状态、建立个人基线、启动实时脑状态记录，并准备音乐恢复与日报数据

### 统一 data-action 事件派发
- 所有 inline `onclick` 改为 `data-action` 属性
- `App.handleAction(action, target, event)` 统一处理所有按钮
- `App._initActionDispatcher()` 在 DOMContentLoaded 时初始化事件委托
- `App.feedback(message, type)` 统一按钮反馈

### 交互审计工具
- `App.auditInteractions()` 开发调试函数
- 扫描所有 `[data-action]` 和可点击元素
- 输出 `missingHandlers` / `deprecatedHandlers` / `disabledWithoutReason`

### 产品逻辑清理
- 清理旧流程文案，统一为「模拟戴上耳机 → 自动实时记录 → 本地声音场景预览 → 连接音乐软件 → 发送 Demo 指令 → 每日报告自动整合睡眠洞察」
- 专注页：未佩戴 → 检测佩戴中 → 建立基线中 → 实时记录中
- 音乐恢复页：自动推荐声音场景，无手动会话控制按钮
- 报告页空状态：「开始一次实时体验」+「生成示例报告」+「返回首页」
- Judge Panel 6 步更新为：模拟戴上耳机 → 自动建立基线 → 查看 EEG → 连接音乐 → 推荐场景 + Brain Break → 生成报告

### 按钮反馈
- 每个按钮点击后 100ms 内有 toast 反馈
- disabled 按钮有 title 提示原因
- 发送 Demo 切换指令在未连接音乐软件时 disabled + 提示

### 页面覆盖修复
- `.page` `pointer-events: none` + `visibility: hidden` + `z-index: 0`
- `.page.is-active` `pointer-events: auto` + `z-index: 2`
- `.page.is-leaving` `pointer-events: none` + `z-index: 1`
- `.page.is-entering` `pointer-events: none` + `z-index: 2`
- 切换结束后清理所有非 active 页面的 class 和 style

---

## v29 页面切换重构 + 高端视觉系统

### 页面切换状态机重构
- 删除所有重复 `.page` CSS 规则（v9/v20/v28 三套互相覆盖），合并为单套统一规则
- 新增 `.page-stage` 单容器 + `.page-scroll` 内部滚动系统
- 所有页面 `position: absolute` 叠层，active 页面 `z-index: 2`，leaving 页面 `z-index: 1`
- `navigate()` 重写为清晰状态机：`_navLock` 防重入 → prepare target → `requestAnimationFrame` → remove `is-active` + add `is-leaving` → 340ms 后清理 → `requestIdleCallback` hydrate
- 报告页 `reportDirty` flag：切页时不强制 `renderReport`，仅数据变化时渲染
- 离场页先移除 `is-active` 再加 `is-leaving`，确保 `is-leaving` 的 `opacity: 0 !important` 生效

### 高端产品官网视觉
- **Hero 产品发布页**：左侧标题「听见你的大脑节奏」+ 副标题 + 3 条短卖点 + 2 个按钮；右侧耳机视觉 + App mockup + 浮动 widget + EEG 波形 + mesh gradient
- **Product Details 模块**：8 项产品能力详情（Simulated EEG / Real-time Biofeedback / Brain Breaks / Daily Reports / Adaptive Music / Auto Sleep / Signal Quality / Demo Boundary）
- **Demo Quick Facts 模块**：4 张数字卡（1 次点击 / 6 步闭环 / 3 类报告 / 5 类科学边界）
- **专注页 hero 卡**：深蓝渐变背景（#0a2a4a → #0d3b66 → #114b80）+ 白色文字 + EEG 线条绘制 + 渐变分数
- **音乐恢复推荐卡**：青蓝渐变背景（#e0f7fa → #e8f5e9 → #e3f2fd）+ 呼吸圆圈动画 + 渐变标题
- **报告页总览卡**：紫色渐变背景（#667eea → #764ba2）+ 白色文字 + 三列分数

### 高质量睡眠可视化
- **睡眠评分卡**：深色渐变背景 + 月亮图标 + 大数字 + Demo Trend 标签
- **长睡眠卡**：8 小时 13 分 + 入睡/醒来时间 + 渐变进度条
- **睡眠阶段时间线**：不同高度条（Deep 60% / REM 90% / Light 45% / Awake 25%）+ 四色图例 + stagger reveal 动画
- **睡眠结构环图**：conic-gradient 环 + 中心总时长 + 对齐图例
- **睡眠解读 insight 卡**：建议文案 + Demo Trend / Not clinical sleep staging / Not medical diagnosis 标签

### 首页视觉节奏
1. Hero 产品大视觉 → 2. 四个短能力入口 → 3. 今日脑状态概览 → 4. 为什么需要 NeuroFocus → 5. 一天如何使用 → 6. 专注能力预览 → 7. 音乐恢复预览 → 8. 自动睡眠洞察预览 → 9. 科学信任机制 → 10. 产品能力详情 → 11. Demo Quick Facts → 12. 场景反馈假设 → 13. 参数 → 14. FAQ

### 动效系统
- 允许：Hero parallax / 耳机浮动 / widget stagger reveal / count-up / EEG line drawing / waveform 动画 / 睡眠时间线 reveal / 环图填充 / bottom sheet / segmented control / card hover
- 禁止：大面积黑色赛博风 / 霓虹乱闪 / 大量粒子 / 过度 3D / filter blur 切页 / heavy backdrop-filter
- 支持 `prefers-reduced-motion`，移动端禁用 parallax 和复杂动画

---

## 科学依据

- NeuroFocus 使用模拟 EEG 数据展示脑电耳机的交互逻辑。
- 项目参考 EEG 常见频段分析思路，将 Alpha (8-13 Hz)、Theta (4-8 Hz)、Beta (13-30 Hz) 等频段变化转化为专注趋势 (Focus Trend)、疲劳负荷 (Fatigue Load) 和平静度估计 (Calmness Estimate)。
- 由于 EEG 易受眨眼、眼动、肌电、佩戴接触等影响，Demo 中加入 Signal Quality（信号质量）、Artifact Risk（伪迹风险）和 Confidence Level（判断置信度），避免把噪声误判为脑状态变化。
- 指标基于个人基线 (Personal Baseline) 的相对变化，而非固定阈值。
- 声音场景推荐基于模拟 EEG 特征趋势，附带推荐理由和置信度，而非黑箱判断。

---

## 睡眠脑状态监测

每日脑状态报告会自动整合模拟夜间睡眠脑状态趋势，展示入睡过渡、睡眠稳定度、深睡趋势参考、夜间信号质量和睡眠声音场景建议。该功能为自动生成，无需用户手动启动，仅用于展示脑电耳机在夜间场景中的交互可能性，不作为医学睡眠分期或睡眠疾病诊断。

报告中包含：
- 夜间记录窗口（自动模拟记录）
- 入睡过渡时间（Demo Estimate）
- 睡眠稳定度
- 深睡趋势参考和 REM-like 趋势参考
- 夜间信号质量、伪迹风险和置信度
- 推荐睡眠声音场景
- 睡眠状态时间线（Demo Trend）
- 夜间 EEG 频段趋势（Delta / Theta / Alpha / Beta）

## 睡眠科学边界

真实临床睡眠分期通常需要 EEG、EOG、EMG 等多模态信号和专业评分标准。当前 Demo 仅使用模拟 EEG 趋势，因此不能诊断失眠、睡眠呼吸暂停、REM 行为障碍或其他睡眠疾病。

---

## 评分表对应说明

### 创新性（30%）

- **真实需求**：长期学习、办公场景中用户不知道何时疲劳，普通音乐软件不能理解用户状态
- **解决思路**：用模拟 EEG 趋势估计专注、疲劳和平静度，转化为 Brain Break 和声音场景推荐
- **技术创新**：从音乐播放到脑状态反馈、从单个分数到趋势判断、从脑电监测到闭环反馈、从概念展示到硬件交互路径
- **脑电不确定性也被纳入交互设计**：信号质量、伪迹风险、置信度一起设计进交互流程

### 实用性（30%）

- **学习备考**：疲劳负荷连续升高时推荐 Brain Break
- **办公专注**：根据状态推荐 Focus Mix 或 White Noise
- **科研创作**：记录专注波动和恢复效果，生成报告辅助复盘
- **音乐恢复**：推荐 Calm Ambient 或 Breath Guide（声音场景建议，非医学治疗）
- **Demo 验证了核心价值**：连接 → 监测 → 基线 → 音乐推荐 → 恢复报告 完整链路

### 完成度（20%）

- **实时体验**：点击"开始实时体验"自动完成佩戴检测、基线建立、实时记录和报告数据准备
- **实时 EEG 趋势**：专注趋势、疲劳负荷、信号质量、伪迹风险、置信度
- **音乐软件接入**：Spotify / Apple Music / 网易云音乐 / QQ 音乐 Demo Connector
- **Brain Break**：iOS bottom sheet 短呼吸引导
- **每日报告**：音乐恢复摘要、推荐理由、科学边界
- **科学解释**：个人基线、信号质量、伪迹风险、置信度
- **评审 60 秒路径**：6 步完整体验

### 美观度 / 设计体验（20%）

- **高端产品官网视觉**：Hero 产品发布页、Product Details + Quick Facts 模块、深蓝/青蓝/紫色渐变卡片
- **单容器叠层页面切换**：`.page-stage` + `.page-scroll`，无残留、无抖动、无图标闪烁
- **高质量睡眠可视化**：深色渐变评分卡 + 不同高度时间线 + conic-gradient 环图 + insight 卡
- **iOS 风格**：统一组件库（ios-card, ios-pill, ios-segmented, ios-bottom-sheet）
- **Neurable 风格产品叙事**：Hero → 核心能力 → 仪表盘 → 专注 → 音乐 → 科学 → 规格
- **卡片视觉多样性**：深蓝渐变 hero / 青蓝渐变推荐 / 紫色渐变总览 / 深色渐变睡眠 / 浅色 insight
- **场景符号动画**：波形线 / 噪声点 / 呼吸圆环 / 柔和光斑
- **bottom sheet**：Brain Break 使用底部弹层
- **smooth transition**：仅 opacity + translate3d，stagger reveal，count-up
- **科学解释折叠卡**：默认不铺满页面，点击展开
- **prefers-reduced-motion**：支持降低动效偏好

---

## 局限性

- 当前未接入真实 EEG 硬件，所有 EEG 数据均为模拟生成。
- 指标只表示趋势估计，不代表医学诊断或心理状态判断。
- 音乐推荐为声音场景建议，不代表医学治疗。
- Alpha/Theta/Beta 频段映射为简化模型，真实 EEG 分析需要更复杂的信号处理和个体校准。
- 真实系统需要经过受试者实验、伦理审批、模型验证和硬件校准。
- Recovery Index 公式仅用于 Demo 可视化，不代表临床恢复评估。
