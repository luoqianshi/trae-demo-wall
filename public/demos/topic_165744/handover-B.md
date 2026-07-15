# 朝花夕拾 · 页面 B 开发交接

## 一、项目结构

```
d:\Code\ZHXS\zhaohua-demo\
├── index.html           ← 开场动画（已完成）
├── main.html            ← 主界面（当前阶段，继续开发中）
├── B.html               ← 【你在此处新建】页面 B
├── taohua_reference.html ← 桃花 SVG 参考
├── philosophy.md        ← 算法哲学文档
└── handover-B.md        ← 本交接文档
```

## 二、导航流程

```
index.html（开场动画）
    ↓ 点击"开始" → 桃花飘落 → 跳转
main.html（主界面：侧边栏 + 卡片堆）
    ↓ 点击某个交互入口 → 跳转
B.html（你开发的页面——具体内容待定，不是卡片详情页）
```

## 三、必须遵守的设计系统（严格遵循，不可更改）

### 3.1 设计 Token

```css
:root {
  --ink:      #141413;   /* 主文字色 */
  --bg:       #faf9f5;   /* 主背景 */
  --bg2:      #f2f0ea;   /* 次级背景 */
  --bg3:      #e8e6dc;   /* 三级背景 / 边框 */
  --muted:    #b0aea5;   /* 辅助文字 */
  --accent:   #d97757;   /* 强调色：按钮、链接 */
  --accent2:  #6a9bcc;   /* 蓝色强调 */
  --green:    #788c5d;   /* 绿色强调 */
  --orange-soft: #f5e6dc;
  --blue-soft:  #dfe9f2;
  --green-soft: #e5ece0;
  --radius:   6px;
  --font-serif: 'Noto Serif SC', 'Georgia', 'Songti SC', serif;
  --font-sans:  'Noto Sans SC', sans-serif;
}
```

### 3.2 字体

- **标题 / 正文**：`Noto Serif SC`（Google Fonts 引入，字重 400/600/700）
- **UI 辅助文字**：`Noto Sans SC`（字重 400/500/600）
- 禁止使用 Arial、Inter、Roboto、系统字体等通用字体

### 3.3 视觉语言

- 东方美学、柔和、诗意、纸质质感
- 低饱和度配色，米白色（#faf9f5）底色
- 衬线体为主，制造文化张力与阅读呼吸感
- 页面跳转动画：使用 blur + opacity 过渡（参考 index.html 的"文字模糊渐显"效果）
- 禁止高饱和度色彩、禁止紫色渐变等 AI 通用风格

## 四、关键约束

### 4.1 技术栈

- 纯 HTML/CSS/JS 单文件（B.html）
- 不允许引入外部框架（React/Vue 等）
- 不允许引入外部 CSS 库
- 允许使用 Google Fonts CDN
- 允许使用 p5.js 动效（CDN: `https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.7.0/p5.min.js`）

### 4.2 文件规范

- 输出文件：`d:\Code\ZHXS\zhaohua-demo\B.html`
- 纯 HTML 单文件，所有样式和脚本内嵌
- 不需要额外资源文件

### 4.3 响应式

- 适配 768px 以下移动端
- 使用 rem / 相对单位

### 4.4 用户偏好

- 用户偏好"叠加"而非"修改"：新内容在旧内容之上叠加
- 用户偏好树 + 堆叠的复合结构组织内容

## 五、页面 B 的范围定义

### 5.1 页面 B 是什么

- 从 main.html 点击跳转到的**新页面**
- 独立页面，不包含侧边栏（与 main.html 不同）
- 具体内容未定，由下一阶段开发决定

### 5.2 页面 B 不是什么

- ❌ 不是卡片详情页
- ❌ 不是卡片堆展开页
- ❌ 不是设置页
- ❌ 不是弹窗 / 浮层

### 5.3 跳转到 B 的入口

在 main.html 中添加跳转入口（如某个按钮或卡片交互），目前 main.html 中尚无跳转至 B 的代码，**下一阶段需同步修改 main.html 添加跳转逻辑**。

推荐跳转方式：
```javascript
// 页面跳转时添加过渡
document.body.style.opacity = '0';
document.body.style.transition = 'opacity 0.4s';
setTimeout(() => { window.location.href = 'B.html'; }, 400);
```

## 六、参考文件

- `d:\Code\ZHXS\zhaohua-demo\main.html` — 主界面完整代码，包含设计系统、配色、字体引入方式
- `d:\Code\ZHXS\zhaohua-demo\index.html` — 开场动画，包含电影级转场和 p5.js 动效示例
- `d:\Code\ZHXS\zhaohua-demo\taohua_reference.html` — 桃花 SVG 设计参考