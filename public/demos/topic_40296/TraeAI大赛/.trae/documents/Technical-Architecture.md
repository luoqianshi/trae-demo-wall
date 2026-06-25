# 心理科普自助网站 - 技术架构文档

## 1. 架构设计

单文件 HTML 应用，前端全栈实现，无需后端服务。

```
┌─────────────────────────────────────┐
│           单文件 HTML                │
│  ┌─────────────────────────────┐    │
│  │      HTML 结构               │    │
│  │  - 顶部导航栏（标签切换）     │    │
│  │  - 主内容区域（5个板块）      │    │
│  │  - 底部免责 + 右下角按钮      │    │
│  ├─────────────────────────────┤    │
│  │      CSS 样式               │    │
│  │  - CSS 变量定义颜色/圆角     │    │
│  │  - 磨砂玻璃效果              │    │
│  │  - 响应式媒体查询            │    │
│  │  - 动画过渡 0.6s            │    │
│  ├─────────────────────────────┤    │
│  │      JavaScript             │    │
│  │  - 标签页切换逻辑            │    │
│  │  - PHQ-9/GAD-7 量表逻辑      │    │
│  │  - 478呼吸法动画             │    │
│  │  - 白噪音播放                │    │
│  │  - LocalStorage 数据存储     │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

## 2. 技术选型

* **前端框架**：原生 HTML5 + CSS3 + JavaScript（ES6）

* **样式方案**：CSS 变量 + Flexbox/Grid 布局

* **动画**：CSS transitions + requestAnimationFrame（用于478呼吸法）

* **音频**：Web Audio API（白噪音 + 呼吸提示音）

* **数据存储**：LocalStorage（量表答题结果）

* **无外部依赖**：纯原生实现，CDN 字体除外

## 3. 页面路由

采用标签切换模式，无需路由：

| 标签索引 | 板块内容 | DOM ID     |
| ---- | ---- | ---------- |
| 0    | 首页   | #home      |
| 1    | 情绪科普 | #awareness |
| 2    | 自我觉察 | #selfcheck |
| 3    | 放松工具 | #relax     |
| 4    | 求助资源 | #resources |

## 4. 功能模块详细设计

### 4.1 标签切换系统

```javascript
// 点击标签 → 隐藏当前板块 → 显示目标板块
// 过渡动画：opacity 0→1, 0.6s ease-out
// 更新标签激活状态
```

### 4.2 PHQ-9 / GAD-7 量表

**数据结构**：

```javascript
const phq9Questions = [
  { id: 1, text: "做事时提不起劲或没有兴趣", options: ["完全没有", "好几天", "一半以上日子", "几乎每天"] },
  // ... 共9题
];

const gad7Questions = [
  { id: 1, text: "感觉紧张、焦虑或不安", options: ["完全没有", "几天", "超过一周", "几乎每天"] },
  // ... 共7题
];
```

**评分逻辑**：

* 选项对应 0-3 分

* PHQ-9：0-4正常/5-9轻度/10-14中度/15-27重度

* GAD-7：0-4正常/5-9轻度/10-14中度/15-21重度

**本地存储**：

```javascript
localStorage.setItem('mentalHealth_results', JSON.stringify({
  phq9: { date: '2024-xx', score: 12, answers: [...] },
  gad7: { date: '2024-xx', score: 8, answers: [...] }
}));
```

### 4.3 478呼吸法

```javascript
// 吸气：4秒，圆形光晕放大
// 屏息：7秒，圆形光晕保持
// 呼气：8秒，圆形光晕缩小
// 使用 CSS animation + JS 控制时序
// 音频：使用 OscillatorNode 生成柔和提示音
```

### 4.4 白噪音播放器

```javascript
// 音频来源：使用免费白噪音音频URL或生成噪音
// Web Audio API: AudioContext + 音频源
// 控制：播放/暂停、音量调节
// 循环：loop = true
```

### 4.5 5-4-3-2-1感官着陆

```javascript
// 分步引导，每步完成点按钮进入下一步
// 记录当前步骤，存储在变量中
// 可返回上一步或重置
```

## 5. CSS 变量定义

```css
:root {
  --bg-primary: #FDF8F3;        /* 奶米白背景 */
  --color-fog-blue: #A8C0D6;    /* 雾蓝 */
  --color-light-purple: #D4C4E3; /* 浅芋紫 */
  --color-text: #5A5A5A;        /* 正文文字 */
  --color-title: #3A3A3A;       /* 标题文字 */
  --radius-lg: 24px;           /* 大圆角 */
  --radius-md: 16px;           /* 中圆角 */
  --radius-sm: 12px;           /* 小圆角 */
  --glass-bg: rgba(255, 255, 255, 0.7);
  --glass-blur: blur(20px);
  --transition-slow: 0.6s ease-out;
  --shadow-soft: 0 8px 32px rgba(168, 192, 214, 0.2);
}
```

## 6. 文件结构

```
c:\Users\ASUS\Desktop\代码\TraeAI大赛\
└── index.html    # 单文件，包含所有 HTML + CSS + JS
```

## 7. 兼容性考虑

* 支持现代浏览器（Chrome、Firefox、Safari、Edge）

* 移动端 Safari 和 Chrome

* 降级处理：对于不支持 Web Audio API 的浏览器，隐藏音频功能

* 响应式断点：768px

