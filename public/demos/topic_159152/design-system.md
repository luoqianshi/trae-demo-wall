# 晴雨同学设计系统

> 本设计系统为「晴雨同学：AI 情绪天气站」的完整视觉规范。后续所有页面修改、新增组件、扩展功能都必须严格遵循此规范，确保风格统一。

---

## 1. 设计概述

- **风格方向**：可爱温暖风（Cozy / Kawaii）
- **情感调性**：温柔、治愈、无评判、像一本打开的日记本
- **目标用户**：初高中学生
- **视觉隐喻**：天气 = 情绪，四季 = 时间流转

---

## 2. 颜色系统

### 2.1 基础色板（CSS 变量）

| 变量名 | 色值 | 用途 |
|---|---|---|
| `--bg` | `#FFF8F0` | 页面主背景（温暖奶油） |
| `--bg2` | `#FFFFFF` | 卡片/面板背景 |
| `--ink` | `#5C4033` | 主文字（暖棕） |
| `--muted` | `#8B7355` | 次要文字、说明文字 |
| `--rule` | `#F5E6D3` | 边框、分割线 |
| `--accent` | `#FF9F6B` | 主强调色（暖橙） |
| `--accent2` | `#FFD6A5` | 次强调色（浅橙） |
| `--soft` | `#FFF0E0` | 浅色容器背景 |
| `--soft2` | `#FFF8EE` | 更浅容器背景 |
| `--good` | `#7DD3A8` | 成功/积极状态 |
| `--danger` | `#FF8FA3` | 危险/警示状态 |
| `--mint` | `#A8E6CF` | 薄荷绿点缀 |
| `--pink` | `#FFB7C5` | 樱花粉点缀 |
| `--purple` | `#D4A5FF` | 淡紫点缀 |
| `--shadow` | `rgba(255,159,107,0.14)` | 统一阴影色 |

### 2.2 四季主题色（data-season）

| 季节 | 背景 | 主色 | 次色 | 氛围 |
|---|---|---|---|---|
| Spring | `#F5FFF8` | `#5ECB8B` | `#A8E6C8` | 清新春绿+薄荷白，生机勃勃 |
| Summer | `#FFF8F0` | `#FFB347` | `#FFE4A1` | 暖黄+天空蓝，明亮活泼 |
| Autumn | `#FFF5EE` | `#E8873A` | `#FFD6A5` | 暖橙+金黄，温馨舒适 |
| Winter | `#F8F5FF` | `#A5B4FF` | `#D0E0FF` | 柔和冰蓝+雪白，安静不冷 |

### 2.3 阴影规范

所有阴影统一使用暖橙色调，禁止使用冷蓝色阴影：
```css
box-shadow: 0 14px 36px var(--shadow);      /* 卡片默认 */
box-shadow: 0 20px 54px rgba(255,159,107,0.10);  /* 大面板 */
box-shadow: 0 26px 64px rgba(255,159,107,0.13);  /* 悬停增强 */
```

---

## 3. 字体系统

| 层级 | 字体 | 大小 | 字重 | 行高 | 字间距 |
|---|---|---|---|---|---|
| H1 标题 | Instrument Sans | clamp(34px,5.6vw,64px) | 700 | 1.05 | -0.045em |
| H2 章节标题 | Instrument Sans | clamp(26px,3.4vw,42px) | 700 | 1.1 | -0.04em |
| H3 卡片标题 | Instrument Sans | 19px | 700 | 1.35 | - |
| 正文 | Instrument Sans | 17px | 400 | 1.72 | - |
| 说明文字 | Instrument Sans | 14px | 400 | 1.6 | - |
| 标签/徽章 | Instrument Sans | 14px | 700 | 1.4 | - |
| 代码/数据 | DM Mono | 12-13px | 400 | 1.5 | - |

---

## 4. 间距系统

| 元素 | 值 |
|---|---|
| 页面最大宽度 | `min(1160px, calc(100% - 28px))` |
| 页面上下边距 | 44px / 72px |
| Section 间距 | 64px |
| 卡片内边距 | 24px |
| 卡片间隙（grid） | 18px |
| 按钮间隙 | 12px |
| 表单元素间隙 | 10-14px |

---

## 5. 圆角系统

| 元素 | 圆角 |
|---|---|
| 页面/首屏大卡片 | 38-40px |
| 功能卡片 | 32px |
| 面板/手机卡片 | 32-40px |
| 按钮（主要） | 999px（完全圆角） |
| 按钮（季节切换） | 18px |
| 输入框 | 20px |
| 标签/徽章 | 999px |
| 小卡片/记录项 | 14-16px |
| 图标容器 | 17px |

---

## 6. 动画系统

### 6.1 过渡时间

| 场景 | 时长 | Easing |
|---|---|---|
| 颜色/背景过渡 | 0.55s | ease |
| 按钮悬停 | 0.18s | ease |
| 卡片悬停 | 0.3s | cubic-bezier(0.34,1.56,0.64,1) |
| 天气切换 | 0.42-0.58s | ease |
| Toast 进出 | 0.35-0.4s | cubic-bezier(0.34,1.56,0.64,1) |

### 6.2 关键动画

- **弹性悬停**：`cubic-bezier(0.34, 1.56, 0.64, 1)` — 用于卡片、按钮、图标
- **呼吸动画**：`sunBreath` 3.6s 循环
- **漂浮动画**：`bob` 5.4s 循环，用于装饰元素
- **加载旋转**：`btnSpin` 0.7s 线性无限

---

## 7. 组件规范

### 7.1 主按钮（Primary Button）

```css
border: 1px solid rgba(255,255,255,0.52);
background:
  linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0) 38%),
  linear-gradient(135deg, var(--accent), var(--purple));
box-shadow:
  inset 0 1px 0 rgba(255,255,255,0.82),
  inset 0 -9px 16px rgba(92,60,40,0.14),
  0 8px 0 rgba(92,60,40,0.12),
  0 18px 28px rgba(255,159,107,0.18);
border-radius: 999px;
color: #fff;
font-weight: 700;
```

**悬停**：上浮 3px + 亮度微增
**按下**：下沉 5px + 内阴影增强
**加载**：显示旋转 spinner，文字隐藏

### 7.2 卡片（Card）

```css
padding: 24px;
border: 1px solid var(--rule);
border-radius: 32px;
background: var(--bg2);
box-shadow: 0 14px 36px var(--shadow);
transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
```

**悬停**：`translateY(-5px) scale(1.015)` + 阴影加深

### 7.3 标签/徽章（Pill）

```css
padding: 8px 12px;
border: 1px solid var(--rule);
border-radius: 999px;
background: var(--bg2);
color: var(--muted);
font-size: 14px;
```

**悬停**：变为主色背景 + 白色文字 + 微上浮

### 7.4 输入框（Textarea）

```css
width: 100%;
padding: 16px;
border: 2px solid var(--rule);
border-radius: 20px;
background: rgba(255,255,255,0.86);
font: inherit;
```

**聚焦**：边框变 accent + 外发光 `0 0 0 4px var(--soft)`

### 7.5 Toast 提示

```css
padding: 14px 22px;
border-radius: 20px;
background: var(--bg2);
border: 1px solid var(--rule);
box-shadow: 0 12px 36px var(--shadow);
backdrop-filter: blur(12px);
```

- 成功：边框 `--good`，绿色圆点指示
- 错误：边框 `--danger`，红色圆点指示

---

## 8. 响应式断点

| 断点 | 行为 |
|---|---|
| `max-width: 900px` | 所有 grid 变单列，卡片内边距缩小 |
| `max-width: 520px` | 字体微调（15px），圆角缩小（22px），间距压缩 |

---

## 9. 禁用规范

以下元素/风格**禁止**在本项目中使用：

- 冷蓝色调（#5c7cff 等）作为主色
- 直角/小圆角（< 14px 的卡片圆角）
- 锐利、科技感强的线条和边框
- 深色/暗色主题背景
- 无动画或生硬动画（不使用 ease-in-out 以外的默认过渡）
- 无阴影的扁平设计
- 小于 14px 的正文字号

---

## 10. 使用说明

1. 每次修改或新增页面时，先读取本设计系统
2. 所有颜色必须使用 CSS 变量，禁止硬编码色值
3. 所有阴影必须使用 `--shadow` 或基于 `rgba(255,159,107, ...)` 的变体
4. 所有圆角遵循第 5 节规范
5. 所有动画使用第 6 节指定的 easing 函数
6. 四季主题切换功能必须保留，配色遵循第 2.2 节
