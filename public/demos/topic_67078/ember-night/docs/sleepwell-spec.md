# 晚安角落 (Ember Night) — 完整技术与设计规范

## 1. 项目概述

**晚安角落** 是一款移动端 Web 助眠应用，参加 TRAE AI 创意大赛（生活娱乐赛道）。核心理念：将手机从"高刺激入口"转化为"低刺激、可收纳的陪伴式入睡训练工具"，通过渐进式内容衰减（Progressive Content Decay）引导用户自然入睡。

### 核心特性
- **纯前端单机运行**，无需后端/API
- **PWA 离线可用**
- **渐进式衰减引擎**：画面亮度、色温、音量随使用时间递减
- **多感官协同**：视觉 + 听觉 + 触觉（振动）+ 体感（陀螺仪）
- **无成瘾设计**：内容主动变少，引导用户放下手机

---

## 2. 理论基础

| 理论模型 | 应用方式 |
|---------|---------|
| CBT-I 刺激控制 | 限定使用场景为"床上/睡前"，建立条件反射 |
| ACT-I 接纳疗法 | 不对抗失眠，"没关系"态度贯穿文案 |
| Two-Process 模型 | 配合 Process S（睡眠压力），不抵抗困意 |
| Hyperarousal 模型 | 多通道降低过度激活：视觉降亮度、听觉降音量、认知降复杂度 |
| MBSR 正念 | 呼吸引导模块直接应用 4-7-8 呼吸法 |
| 渐进式肌肉放松 | 通过交互动作（拖拽、长按）替代身体放松 |

---

## 3. 技术架构

```
┌─────────────────────────────────────────────┐
│  App Entry (app.js)                          │
│  ├─ PC Detection → Redirect                 │
│  ├─ AudioEngine.init()                       │
│  ├─ DecayEngine.init()                       │
│  ├─ WakeLockManager.acquire()               │
│  ├─ ServiceWorker.register()                 │
│  └─ StateManager.init() → OPENING           │
├─────────────────────────────────────────────┤
│  StateManager (FSM)                          │
│  OPENING → WINDOW → CHOICE → PIER/ROOM      │
│                              → BREATHING     │
│                              → SILENCE       │
├─────────────────────────────────────────────┤
│  Engines                                     │
│  ├─ AudioEngine (Web Audio API)              │
│  ├─ DecayEngine (calmLevel 0→100)           │
│  ├─ SensorManager (Motion/Orientation)       │
│  └─ WakeLockManager (Screen Wake Lock)       │
└─────────────────────────────────────────────┘
```

### 技术栈
- **纯 Vanilla JS**，无框架依赖
- **CSS3**：变量驱动全局衰减、动画、渐变
- **Canvas 2D**：呼吸光球动画
- **Web Audio API**：音频层叠与淡入淡出
- **DeviceMotion/Orientation API**：检测手机平放/静止
- **Wake Lock API**：防息屏
- **Service Worker**：PWA 离线缓存

---

## 4. 场景流程

### Phase 0 — Opening（开场）
- 纯黑屏幕
- 1.5s 后显示"睡不着吗？"
- 5.5s 后显示"没关系。"
- 8.5s 后提示"轻触屏幕"
- 触摸后：请求传感器权限 + 恢复 AudioContext + 转场

### Phase 1 — Window（窗户）
- 窗框 + 星空粒子动画
- 每 30s 从 15 条文案中随机显示一条
- 长按可触发流星动画
- 环境音：env_night（夜虫）
- 底部左滑提示进入下一场景
- 90s 自动推进到 Choice

### Phase 2 — Choice（选择）
- 两个选项：
  - "想出去走走" → Pier
  - "想直接睡觉" → Room
- 60s 未操作自动进入 Room

### Phase 3A — Pier（码头）
- 海面 + 码头 + 小人 SVG
- 提问"今晚脑子里装着什么？"
- 4 个选项（工作/人/明天/焦虑），各有专属颜色
- 选择后生成对应颜色石子
- 拖拽石子到海面水线以上 → 抛入动画 + 水波纹 + 音效
- 最多 3 次投掷
- 每次投掷后显示治愈文案
- 完成后转场到 Breathing

### Phase 3B — Room（房间整理）
- 5 个可交互物品：
  - 书、杯子、拖鞋（点击归位）
  - 台灯（点击 3 次渐暗直到关闭）
  - 窗帘（点击拉上）
  - 被子（长按 0.8s 铺开）
- 每个物品完成增加 calmLevel
- 全部完成后转场到 Breathing

### Phase 4 — Breathing（呼吸引导）
- Canvas 绘制呼吸光球
- 渐进式节奏：
  - Round 1-3: 吸 4s / 屏 4s / 呼 6s
  - Round 4-6: 吸 4s / 屏 5s / 呼 7s
  - Round 7+: 吸 4s / 屏 7s / 呼 8s
- 文字提示随轮次淡出
- 光球亮度随轮次降低
- 退出条件：12 轮完成 或 calmLevel > 85
- 环境音：env_ocean

### Phase 5 — Silence（寂静）
- 释放 Wake Lock
- 极微光脉冲每 90s 一次
- 5 分钟后自动关闭
- 若传感器检测手机静止 > 1 分钟，提前关闭

---

## 5. DecayEngine 衰减引擎

核心机制：`calmLevel` 从 0 增长到 100，驱动全局视听衰减。

```
calmLevel += baseRate(0.3/s) + sensorBoost(手机平放时额外+0.1/s)
             + interactionBoost(交互完成时一次性加分)

CSS 变量映射：
--global-brightness: 1.0 → 0.3 (随 calmLevel 线性衰减)
--global-warmth: 1.0 → 1.8 (sepia 滤镜增强)
AudioEngine.masterVolume: 1.0 → 0.2
```

---

## 6. 音频系统

| 文件名 | 类型 | 用途 | 时长 |
|--------|------|------|------|
| env_night.mp3 | 环境循环 | 窗户场景夜虫声 | 8s loop |
| env_ocean.mp3 | 环境循环 | 呼吸场景海浪声 | 8s loop |
| env_rain.mp3 | 环境循环 | 备用雨声 | 8s loop |
| sfx_water.mp3 | 一次性 | 石子入水 | 1.2s |
| sfx_wood.mp3 | 一次性 | 物品归位 | 0.5s |
| sfx_cloth.mp3 | 一次性 | 窗帘/被子 | 0.8s |
| sfx_chime.mp3 | 一次性 | 流星/提示 | 2s |

> 当前包含的是占位音频（合成音），正式版建议替换为 Freesound.org 素材：
> - 搜索 "night ambience crickets" → env_night
> - 搜索 "ocean waves gentle" → env_ocean
> - 搜索 "rain soft window" → env_rain
> - 搜索 "water splash stone" → sfx_water
> - 搜索 "wood knock soft" → sfx_wood
> - 搜索 "fabric swoosh" → sfx_cloth
> - 搜索 "wind chime single" → sfx_chime

---

## 7. 视觉设计

### 配色方案
```css
--bg-deep: #1A1614       /* 深夜底色 */
--bg-warm: #2A231F       /* 温暖深色 */
--text-primary: #E8DFD0  /* 主文字色（暖白） */
--text-muted: #A09080    /* 次要文字 */
--light-amber: #F4A261   /* 核心暖光色（光球/灯光） */
--light-warm: #F5E6D3    /* 暖光高光 */
--water-deep: #1A2A3A    /* 深海色 */
--water-surface: #2A3A4A /* 海面色 */
```

### 字体
- 主字体：Noto Serif CJK SC / STSongti-SC / serif
- 设计目标：传统温暖感、可读性好、不刺眼

### 动画原则
- 所有动画 timing 使用 ease-out 或 ease-in-out
- 转场时间 2s
- 文字出现 1.5s fade-in
- 交互反馈 < 300ms

---

## 8. 传感器利用

### DeviceMotion
- 采样：每 200ms 记录加速度
- 静止判断：最近 10 个样本方差 < 0.15
- 用途：Silence 场景检测用户已入睡

### DeviceOrientation
- 平放判断：|beta| < 20° && |gamma| < 20°
- 用途：加速 DecayEngine 衰减速率

### 权限处理
- iOS 13+：需要 `DeviceMotionEvent.requestPermission()`
- 在 Opening 场景首次触摸时请求
- 权限被拒绝不影响核心功能（graceful degradation）

---

## 9. PWA 配置

- **manifest.json**: display: fullscreen, orientation: portrait
- **Service Worker**: 预缓存所有静态资源
- **离线可用**: 首次访问后无需网络
- **安装提示**: 添加到主屏幕后如原生应用

---

## 10. 文件结构

```
ember-night/
├── index.html              # 入口页面
├── manifest.json           # PWA 配置
├── sw.js                   # Service Worker
├── styles/
│   └── main.css            # 完整样式
├── scripts/
│   ├── AudioEngine.js      # 音频引擎
│   ├── SensorManager.js    # 传感器管理
│   ├── DecayEngine.js      # 衰减引擎
│   ├── WakeLockManager.js  # 屏幕锁定
│   ├── texts.js            # 文案数据
│   ├── StateManager.js     # 状态机
│   ├── app.js              # 入口脚本
│   └── scenes/
│       ├── Opening.js      # 开场
│       ├── Window.js       # 窗户
│       ├── Choice.js       # 选择
│       ├── Pier.js         # 码头
│       ├── Room.js         # 房间
│       ├── Breathing.js    # 呼吸
│       └── Silence.js      # 寂静
├── audio/                  # 音频素材
│   ├── env_night.mp3
│   ├── env_ocean.mp3
│   ├── env_rain.mp3
│   ├── sfx_water.mp3
│   ├── sfx_wood.mp3
│   ├── sfx_cloth.mp3
│   └── sfx_chime.mp3
├── icons/                  # PWA 图标
│   ├── icon-192.png
│   └── icon-512.png
├── assets/                 # 概念图/设计稿
│   └── (concept images)
└── docs/
    └── sleepwell-spec.md   # 本文件
```

---

## 11. 部署说明

1. 将整个 `ember-night/` 目录上传至任意静态托管（Vercel/Netlify/GitHub Pages）
2. 确保 HTTPS（PWA 和传感器 API 均要求安全上下文）
3. 手机浏览器访问即可使用
4. 建议添加到主屏幕获得全屏体验

### 本地测试
```bash
# 需要 HTTPS，推荐使用：
npx serve .
# 或
python3 -m http.server 8080
# 然后手机连同一局域网访问
```

---

## 12. 竞赛亮点

1. **反游戏化设计**：内容主动衰减而非增加，颠覆传统应用逻辑
2. **多学科融合**：CBT-I + ACT-I + MBSR + 渐进放松，理论严谨
3. **零后端依赖**：纯前端 PWA，隐私友好，离线可用
4. **感官设计**：利用手机硬件能力（陀螺仪/加速度计）创造独特体验
5. **无障碍**：所有交互都有自动推进兜底，不强制操作

---

## 13. 后续迭代方向

- [ ] 接入 AI 对话（可选后端）：个性化陪伴式对话
- [ ] 睡眠数据追踪：记录使用时长、到达 Silence 的时间
- [ ] 更多场景：森林、天台、图书馆
- [ ] 声景自定义：用户选择环境音组合
- [ ] Apple Watch / 手环联动：心率数据辅助判断入睡
- [ ] 社交功能：匿名"今晚谁也睡不着"广场
