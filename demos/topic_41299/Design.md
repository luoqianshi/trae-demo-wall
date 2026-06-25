# OC Garden 设计规范 — 「故障花园 · Glitch Garden」

> **版本**：v1.0 Glitch Edition
> **日期**：2026-06-23
> **美学方向**：赛博二次元 · 多巴胺故障 · 霓虹电波
> **技能指导**：frontend-design（大胆美学 · 独特字体 · 鲜明配色 · 非常规布局 · 氛围深度）

---

## 一、美学宣言

OC Garden 是一个**故障的二次元虚拟空间**。数据流在霓虹紫的虚空中撕裂，OC 们是闪烁的电子精灵，在 RGB 通道分离的瞬间显形又消散。多巴胺配色刺激视觉神经，故障效果撕裂现实边界——这不是一座安静的花园，而是一场赛博朋克与二次元的电子狂欢。

每一个像素都在尖叫。粉色是心跳，青色是电流，黄色是警报，绿色是数据流。文字在 RGB 偏移中震颤，卡片在数据撕裂中重组，光标拖着故障的尾迹划过屏幕。造物主在这里不是照料花园，而是黑客般地调试一座属于自己的角色矩阵。

**核心关键词**：多巴胺、故障、赛博、二次元、霓虹、RGB 撕裂、电波

---

## 二、配色系统

### 2.1 主色板（多巴胺高饱和 10 色）

| 角色 | 变量名 | 色值 | 名称 | 使用场景 |
|------|--------|------|------|----------|
| **主色** | `--dopamine-pink` | `#FF2E97` | 多巴胺粉 Dopamine Pink | 按钮、链接、活跃态、主强调 |
| **深色** | `--cyber-black` | `#0D0221` | 赛博黑 Cyber Black | 标题深色、强对比、深背景 |
| **辅色** | `--electric-cyan` | `#00F0FF` | 电光青 Electric Cyan | 边框、描边、RGB 通道 |
| **背景** | `--dark-violet` | `#1A0033` | 深紫 Dark Violet | 主背景、页面底色 |
| **表面** | `--glitch-purple` | `#2D0A4E` | 故障紫 Glitch Purple | 卡片表面、抬升区 |
| **强调1** | `--neon-yellow` | `#FFE600` | 电波黄 Neon Yellow | 警告、徽章、高亮 |
| **强调2** | `--neon-green` | `#00FF88` | 霓虹绿 Neon Green | 成功、数据流、生长 |
| **强调3** | `--orange-flame` | `#FF6B00` | 橙焰 Orange Flame | 能量、警告次、热度 |
| **文本** | `--electric-white` | `#F0F0FF` | 电波白 Electric White | 正文主文本 |
| **危险** | `--blood-red` | `#FF003C` | 血红 Blood Red | 错误、删除、危险操作 |

### 2.2 衍生色板（霓虹色阶）

| 角色 | 变量名 | 色值 | 名称 | 使用场景 |
|------|--------|------|------|----------|
| **粉亮** | `--hot-pink` | `#FF6BB5` | 亮粉 Hot Pink | 粉色高亮、悬停 |
| **紫深** | `--deep-purple` | `#4A0080` | 深紫 Deep Purple | 凹陷区、深表面 |
| **青暗** | `--dark-cyan` | `#0099AA` | 暗青 Dark Cyan | 青色次、边框暗 |
| **文本弱** | `--dim-violet` | `#8B5CF6` | 暗紫 Dim Violet | 次要文本 |
| **文本极弱** | `--gray-purple` | `#6B5B8E` | 灰紫 Gray Purple | 占位符、弱化 |
| **品红** | `--magenta` | `#FF00FF` | 品红 Magenta | RGB 通道、特殊 |
| **蓝电** | `--electric-blue` | `#0066FF` | 电蓝 Electric Blue | 信息、链接次 |
| **白雾** | `--fog-white` | `#B8B8D0` | 雾白 Fog White | 极弱分隔 |

### 2.3 语义映射（兼容原项目变量名）

为保证 JS 零改动，保留原变量名并通过 `var()` 映射到新色：

```css
--bg-void:      var(--dark-violet);      /* 页面底色 */
--bg-deep:      var(--cyber-black);      /* 深背景 */
--bg-surface:   var(--glitch-purple);    /* 卡片表面 */
--bg-elevated:  var(--deep-purple);      /* 抬升表面 */
--bg-glass:     rgba(45,10,78,0.7);      /* 玻璃故障 */

--accent:        var(--dopamine-pink);   /* 主强调 */
--accent-soft:   var(--cyber-black);     /* 深强调 */
--accent-bright: var(--hot-pink);        /* 亮强调 */
--accent-glow:   rgba(255,46,151,0.5);   /* 霓虹辉光 */
--accent-dim:    rgba(255,46,151,0.15);
--accent-line:   rgba(255,46,151,0.6);

--text-primary:   var(--electric-white);
--text-secondary: var(--dim-violet);
--text-muted:     var(--gray-purple);
--text-faint:     var(--fog-white);

--border:        var(--electric-cyan);   /* 电光青边框 */
--border-soft:   rgba(0,240,255,0.3);
--border-strong: var(--dopamine-pink);

--danger:  var(--blood-red);
--success: var(--neon-green);
--warning: var(--neon-yellow);
```

### 2.4 配色使用原则

1. **多巴胺饱和**：所有强调色饱和度 ≥ 85%，刺激视觉神经
2. **禁用低饱和柔色**：不使用莫兰迪、马卡龙等柔色调
3. **禁用纯黑背景**：用 `#0D0221`（赛博黑）或 `#1A0033`（深紫）代替
4. **RGB 三色偏移**：标题与强调文字使用红/青/品红三色 text-shadow 偏移
5. **霓虹辉光**：所有强调元素配 `box-shadow` 多层彩色辉光
6. **70-20-10 法则变体**：70% 深紫黑背景 + 20% 故障紫表面 + 10% 多巴胺粉强调
7. **禁用纯白**：用 `#F0F0FF`（电波白）代替纯白

---

## 三、字体系统

| 角色 | 字体 | 字重 | 用途 |
|------|------|------|------|
| **Display** | `Zen Dots` | 400 | 标题、Logo、大字（赛博几何感） |
| **Body** | `Chakra Petch` | 300/400/500/600/700 | 正文、UI、按钮（赛博泰文风） |
| **日文装饰** | `Zen Kaku Gothic New` | 400/500/700 | 二次元装饰、katakana 标签 |
| **Mono** | `Share Tech Mono` | 400 | 数字、代码、终端、乱码 |

**Google Fonts 链接**：
```
https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@300;400;500;600;700&family=Share+Tech+Mono&family=Zen+Dots&family=Zen+Kaku+Gothic+New:wght@400;500;700&display=swap
```

**字体使用原则**：
- 大标题用 Zen Dots，几何感强，赛博朋克气质
- 正文用 Chakra Petch，字距 0.02em，行高 1.6，赛博可读
- 日文装饰用 Zen Kaku Gothic New，二次元标配，用于 katakana 标签
- 数字代码用 Share Tech Mono，终端感，故障乱码
- **禁用** Inter、Roboto、Arial、Space Grotesk 等通用字体
- **字间距**：Zen Dots 用 `0.05em`；Chakra Petch 用 `0.02em`

---

## 四、故障效果系统（核心特色）

### 4.1 RGB 分离（文字三色偏移）

```css
.glitch-text {
  color: var(--electric-white);
  text-shadow:
    2px 0 0 var(--blood-red),
    -2px 0 0 var(--electric-cyan),
    0 0 8px var(--dopamine-pink);
}
```

红/青/品红三色偏移，模拟显像管色彩通道分离。

### 4.2 数据撕裂（clip-path 切片）

```css
@keyframes tear {
  0%, 100% { clip-path: inset(0 0 0 0); transform: translateX(0); }
  20%      { clip-path: inset(20% 0 30% 0); transform: translateX(-3px); }
  40%      { clip-path: inset(60% 0 10% 0); transform: translateX(3px); }
  60%      { clip-path: inset(10% 0 70% 0); transform: translateX(-2px); }
  80%      { clip-path: inset(40% 0 40% 0); transform: translateX(2px); }
}
```

元素被横向切片并随机位移，模拟视频数据撕裂。

### 4.3 扫描线（动画位移）

```css
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: repeating-linear-gradient(
    0deg,
    rgba(0,240,255,0.03) 0px,
    rgba(0,240,255,0.03) 1px,
    transparent 1px,
    transparent 4px
  );
  pointer-events: none;
  z-index: 100;
  animation: scanMove 8s linear infinite;
}
@keyframes scanMove {
  0%   { background-position: 0 0; }
  100% { background-position: 0 100px; }
}
```

电光青扫描线缓慢下移，模拟 CRT 故障。

### 4.4 噪点 overlay（SVG fractalNoise）

```css
body::after {
  content: '';
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  opacity: 0.08;
  mix-blend-mode: overlay;
  pointer-events: none;
  z-index: 99;
  animation: noiseShift 0.3s steps(3) infinite;
}
```

全屏噪点 + 步进位移，模拟信号干扰。

### 4.5 赛博网格背景

```css
.cyber-grid {
  background-image:
    linear-gradient(rgba(255,46,151,0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0,240,255,0.08) 1px, transparent 1px);
  background-size: 40px 40px;
  perspective: 500px;
  transform: perspective(500px) rotateX(60deg);
  animation: gridScroll 4s linear infinite;
}
@keyframes gridScroll {
  0%   { background-position: 0 0; }
  100% { background-position: 0 40px; }
}
```

透视赛博网格滚动，模拟无限延伸的电子空间。

### 4.6 字符乱码（JS 随机替换）

```js
// katakana + 数字随机替换
const chars = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉ0123456789@#$%&';
function glitchText(el) {
  const original = el.dataset.text;
  let interval = setInterval(() => {
    el.textContent = original.split('').map(c =>
      Math.random() > 0.85 ? chars[Math.floor(Math.random()*chars.length)] : c
    ).join('');
  }, 50);
  setTimeout(() => {
    clearInterval(interval);
    el.textContent = original;
  }, 500);
}
```

悬停时文字随机变为 katakana 乱码，松开恢复。

---

## 五、质感与纹理

### 5.1 霓虹辉光

```css
.neon-glow {
  box-shadow:
    0 0 5px var(--dopamine-pink),
    0 0 15px var(--dopamine-pink),
    0 0 30px rgba(255,46,151,0.5),
    inset 0 0 10px rgba(255,46,151,0.2);
}
```

多层彩色辉光，模拟霓虹灯管。

### 5.2 玻璃故障

```css
.glitch-glass {
  background: rgba(45,10,78,0.6);
  backdrop-filter: blur(8px);
  border: 1px solid var(--electric-cyan);
  box-shadow:
    0 0 0 1px var(--dopamine-pink),
    0 0 20px rgba(0,240,255,0.3);
}
```

半透明故障紫 + 模糊 + RGB 双色边框。

### 5.3 圆角系统

| 变量 | 值 | 用途 |
|------|----|------|
| `--radius-sm` | `2px` | 小元素、徽章（近硬边） |
| `--radius` | `4px` | 按钮、输入框 |
| `--radius-lg` | `8px` | 卡片、模态框 |
| `--radius-xl` | `16px` | 特殊容器 |

**原则**：圆角克制，保持赛博硬朗感，不超 16px。

### 5.4 阴影系统

| 变量 | 值 | 用途 |
|------|----|------|
| `--shadow-soft` | `0 0 10px rgba(255,46,151,0.3)` | 卡片常态（霓虹辉光） |
| `--shadow-elevated` | `0 0 20px rgba(255,46,151,0.5), 0 0 40px rgba(0,240,255,0.2)` | 悬停、模态 |
| `--shadow-glow` | `0 0 5px var(--dopamine-pink), 0 0 15px var(--dopamine-pink), 0 0 30px rgba(255,46,151,0.5)` | 聚焦、活跃 |
| `--shadow-cyan` | `0 0 10px var(--electric-cyan), 0 0 20px rgba(0,240,255,0.4)` | 青色辉光 |

### 5.5 滚动条

- thumb：多巴胺粉 `#FF2E97`，圆角 0，带霓虹辉光
- track：赛博黑 `#0D0221`
- 选区：`rgba(255,46,151,0.4)`

---

## 六、组件规范

### 6.1 按钮

```css
.btn {
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 12px 24px;
  border: 1px solid var(--dopamine-pink);
  cursor: pointer;
  position: relative;
  background: transparent;
  color: var(--electric-white);
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: all 0.2s;
  box-shadow: 0 0 10px rgba(255,46,151,0.3);
}
.btn-primary {
  background: var(--dopamine-pink);
  color: var(--cyber-black);
}
.btn-primary:hover {
  box-shadow:
    0 0 5px var(--dopamine-pink),
    0 0 15px var(--dopamine-pink),
    0 0 30px rgba(255,46,151,0.6);
  animation: glitchShake 0.3s steps(2) 2;
}
@keyframes glitchShake {
  0%, 100% { transform: translate(0); }
  25% { transform: translate(-2px, 1px); text-shadow: 2px 0 var(--blood-red), -2px 0 var(--electric-cyan); }
  50% { transform: translate(2px, -1px); text-shadow: -2px 0 var(--blood-red), 2px 0 var(--electric-cyan); }
  75% { transform: translate(-1px, 2px); }
}
```

- **Primary**：多巴胺粉底 + 赛博黑字 + 霓虹辉光，悬停触发故障抖动
- **Ghost**：透明底 + 电光青边框 + 电光青字，悬停青色辉光
- **Danger**：血红边框 + 血红字 + 红色辉光
- **故障 hover**：悬停时 RGB 分离 + 位移抖动

### 6.2 卡片

```css
.card {
  background: var(--glitch-purple);
  border: 1px solid var(--electric-cyan);
  border-radius: 8px;
  padding: 24px;
  position: relative;
  box-shadow:
    0 0 0 1px var(--dopamine-pink),
    0 0 20px rgba(0,240,255,0.2);
  transition: all 0.3s;
}
.card:hover {
  box-shadow:
    0 0 0 1px var(--dopamine-pink),
    0 0 30px rgba(255,46,151,0.4),
    0 0 50px rgba(0,240,255,0.3);
  animation: cardTear 0.4s steps(4);
}
```

- 故障紫底 + 电光青边框 + 多巴胺粉外环
- 悬停：霓虹辉光加深 + 数据撕裂动画
- 圆角 8px

### 6.3 模态框

- 故障紫底 + 电光青 1px 边框 + 多巴胺粉外环
- 遮罩 `rgba(13,2,33,0.85)`（赛博黑半透）+ 模糊
- 顶部 RGB 三色条（红/青/品红各 2px）
- 圆角 16px + 霓虹辉光

### 6.4 导航

- 赛博黑半透底 + `backdrop-filter: blur(12px)` + 电光青底边
- Logo：Zen Dots + RGB 分离 + katakana 装饰「故障」
- 链接：暗紫常态，悬停多巴胺粉 + RGB 分离，活跃多巴胺粉 + 底边

### 6.5 Tab

```css
.tab {
  padding: 10px 18px;
  font-family: 'Chakra Petch', sans-serif;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--dim-violet);
  border-bottom: 2px solid transparent;
  background: transparent;
  cursor: pointer;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  transition: all 0.2s;
}
.tab.active {
  color: var(--dopamine-pink);
  border-bottom-color: var(--dopamine-pink);
  text-shadow: 0 0 8px rgba(255,46,151,0.6);
}
```

- 活跃态：多巴胺粉文字 + 多巴胺粉下划线 + 粉色辉光
- 非活跃：暗紫文字

### 6.6 Toast

- 故障紫底 + 电光青左边框（4px）+ 霓虹辉光
- Chakra Petch 字体
- 从顶部数据撕裂出现（clip-path 动画）

### 6.7 输入框

```css
.input {
  width: 100%;
  background: rgba(13,2,33,0.6);
  color: var(--electric-white);
  font-family: 'Chakra Petch', sans-serif;
  font-size: 1rem;
  padding: 12px 16px;
  border: 1px solid var(--electric-cyan);
  border-radius: 4px;
  letter-spacing: 0.05em;
  backdrop-filter: blur(4px);
}
.input:focus {
  outline: none;
  border-color: var(--dopamine-pink);
  box-shadow:
    0 0 0 1px var(--dopamine-pink),
    0 0 15px rgba(255,46,151,0.4);
}
.input::placeholder {
  color: var(--gray-purple);
}
```

- 赛博黑半透底 + 电光青边框 + 多巴胺粉聚焦环
- 占位符用 katakana 乱码风格

### 6.8 徽章/Tag

```css
.badge {
  font-family: 'Share Tech Mono', monospace;
  font-size: 0.75rem;
  padding: 3px 10px;
  border: 1px solid currentColor;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  border-radius: 2px;
}
.badge-pink {
  color: var(--dopamine-pink);
  background: rgba(255,46,151,0.1);
  box-shadow: 0 0 8px rgba(255,46,151,0.3);
}
```

- 透明底 + 彩色边框 + 彩色字 + 微辉光
- Share Tech Mono 字体，katakana 风格

---

## 七、动效规范（frontend-design：高冲击）

### 7.1 入场故障（RGB 分离 → 聚合）

```css
@keyframes glitchIn {
  0%   { opacity: 0; transform: translateX(-20px); text-shadow: 8px 0 var(--blood-red), -8px 0 var(--electric-cyan); }
  30%  { opacity: 1; transform: translateX(5px); text-shadow: 4px 0 var(--blood-red), -4px 0 var(--electric-cyan); }
  50%  { transform: translateX(-3px); text-shadow: 2px 0 var(--blood-red), -2px 0 var(--electric-cyan); }
  70%  { transform: translateX(1px); text-shadow: 1px 0 var(--blood-red), -1px 0 var(--electric-cyan); }
  100% { opacity: 1; transform: translateX(0); text-shadow: 0 0 8px var(--dopamine-pink); }
}
```

元素从大幅 RGB 分离状态聚合到正常，伴随位移抖动。

### 7.2 悬停撕裂（RGB 通道分离）

```css
@keyframes hoverGlitch {
  0%, 100% { transform: translate(0); text-shadow: 0 0 8px var(--dopamine-pink); }
  20% { transform: translate(-2px, 1px); text-shadow: 3px 0 var(--blood-red), -3px 0 var(--electric-cyan); }
  40% { transform: translate(2px, -1px); text-shadow: -3px 0 var(--blood-red), 3px 0 var(--electric-cyan); }
  60% { transform: translate(-1px, 2px); text-shadow: 2px 0 var(--blood-red), -2px 0 var(--electric-cyan); }
  80% { transform: translate(1px, -2px); text-shadow: -2px 0 var(--blood-red), 2px 0 var(--electric-cyan); }
}
```

悬停时元素 RGB 三色分离 + 位移抖动。

### 7.3 持续动效

- **网格滚动**：赛博网格 4s 线性循环
- **噪点呼吸**：噪点 overlay 0.3s 步进循环
- **扫描线下移**：扫描线 8s 线性循环

### 7.4 鼠标跟随（故障光标）

```js
// 自定义故障光标 + 拖尾
const cursor = document.querySelector('.glitch-cursor');
document.addEventListener('mousemove', e => {
  cursor.style.left = e.clientX + 'px';
  cursor.style.top = e.clientY + 'px';
  // 随机 RGB 偏移
  const ox = (Math.random()-0.5) * 6;
  const oy = (Math.random()-0.5) * 6;
  cursor.style.transform = `translate(${ox}px, ${oy}px)`;
});
```

自定义光标 + 随机 RGB 偏移拖尾。

### 7.5 动效原则

- **高冲击**：动效明显可见，非微妙
- **故障感**：所有动效带 RGB 分离或位移抖动
- **步进与线性结合**：故障用 `steps()`，滚动用 `linear`
- **持续氛围**：背景动效永不停止（网格、噪点、扫描线）

---

## 八、禁用项

1. ❌ 低饱和柔色（莫兰迪、马卡龙）
2. ❌ 纯白 `#FFFFFF` 背景（用 `#F0F0FF`）
3. ❌ 纯黑 `#000000` 背景（用 `#0D0221`）
4. ❌ 大圆角（> 16px）
5. ❌ 通用字体 Inter / Roboto / Arial / Space Grotesk
6. ❌ 平滑无故障的过渡（必须有 RGB 或撕裂感）
7. ❌ 紫色系 `#c084fc`（原项目主色，用多巴胺粉替代）
8. ❌ 克制留白（故障风需要密度与冲击）
9. ❌ 单色无辉光（强调元素必须有霓虹辉光）
10. ❌ 静态背景（必须有网格/噪点/扫描线动效）

---

## 九、与原项目变量兼容性

所有原 CSS 变量名保留并通过 `var()` 映射，确保 15 个 JS 文件零改动：

| 原变量 | 原值（暗紫） | 新值（故障） |
|--------|--------------|--------------|
| `--bg-void` | `#06060f` | `var(--dark-violet)` `#1A0033` |
| `--accent` | `#c084fc` | `var(--dopamine-pink)` `#FF2E97` |
| `--text-primary` | `#f5f5ff` | `var(--electric-white)` `#F0F0FF` |
| `--border` | `rgba(192,132,252,0.12)` | `var(--electric-cyan)` `#00F0FF` |
| `--shadow-soft` | `0 2px 16px rgba(0,0,0,0.25)` | `0 0 10px rgba(255,46,151,0.3)` |

---

## 十、frontend-design 原则核对

- [x] **大胆美学方向**：赛博二次元故障，极端视觉冲击
- [x] **独特字体**：Zen Dots + Chakra Petch + Zen Kaku Gothic，非通用
- [x] **鲜明配色**：多巴胺高饱和 10 色，主导色 + 锐利强调
- [x] **氛围深度**：噪点 + 赛博网格 + 霓虹辉光多层叠加
- [x] **非常规布局**：故障撕裂 + RGB 偏移 + 数据切片
- [x] **CSS 变量一致性**：所有色值通过变量管理
- [x] **高冲击动效**：入场故障 + 悬停撕裂 + 持续氛围
- [x] **背景非纯色**：深紫 + 网格 + 噪点 + 扫描线
- [x] **不收敛通用选择**：避开 Space Grotesk、紫色渐变白底等 AI slop

---

> **文档结束** | OC Garden Glitch Garden Design Spec v1.0 | 2026-06-23
