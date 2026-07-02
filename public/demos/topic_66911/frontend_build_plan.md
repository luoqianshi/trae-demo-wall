# 彩笺寄 - 前端风格文档

## 一、项目概述

**项目名称**：彩笺寄 - 学术智能写作助手
**项目定位**：以墨香古韵，助学术耕耘
**技术栈**：Next.js 14 + React 18 + TypeScript + Tailwind CSS 3

---

## 二、设计主题

### 2.1 整体风格

| 维度 | 描述 |
|------|------|
| **风格定位** | 中国古风 + 现代简约 |
| **设计理念** | 将传统文人墨客的雅致美学与现代学术工具相结合 |
| **视觉关键词** | 宣纸、墨香、印章、竹简、水墨、祥云 |
| **配色灵感** | 传统书画配色：赭石、朱砂、石青、竹绿、泥金 |

### 2.2 多主题支持

项目支持四种视觉主题切换：

| 主题名称 | 主题标识 | 主色调 | 适用场景 |
|----------|----------|--------|----------|
| 经典赭石 | `theme-classic` | 赭石棕 (#8B4513) | 默认主题，学术氛围浓厚 |
| 墨竹青绿 | `theme-green` | 竹叶绿 (#2D5A3D) | 清新自然，适合阅读 |
| 海天青蓝 | `theme-navy` | 海天蓝 (#1E3A5F) | 专业商务，科技感 |
| 默认暖色 | 默认 | 赭石棕 (#8B4513) | 与经典主题一致 |

---

## 三、颜色系统

### 3.1 核心色彩变量

```css
/* 宣纸系列 - 背景色 */
--color-paper: #F7F3EB;           /* 宣纸白 */
--color-paper-dark: #EDE6D8;       /* 浅茶色 */
--color-paper-darker: #E5DDCF;     /* 深茶色 */

/* 赭石系列 - 主色调 */
--color-ochre: #8B4513;            /* 赭石棕 */
--color-ochre-light: #C4A265;      /* 浅赭石 */
--color-ochre-lighter: #F0E6D3;    /* 淡赭石 */
--color-ochre-dark: #5C2E0A;       /* 深赭石 */

/* 石青系列 - 辅助色 */
--color-indigo: #3D5A80;           /* 石青 */
--color-indigo-light: #7B9CB5;     /* 浅石青 */

/* 朱砂系列 - 强调色 */
--color-cinnabar: #C23B22;         /* 朱砂红 */
--color-cinnabar-light: #D95545;   /* 浅朱砂 */

/* 墨色系列 - 文字色 */
--color-ink: #2C2420;              /* 墨黑 */
--color-ink-light: #6B5E55;        /* 浅墨 */
--color-ink-muted: #A89B91;        /* 淡墨 */

/* 边框色 */
--color-border: #D4C5B0;           /* 边框 */
--color-border-light: #E8DDD0;     /* 浅边框 */

/* 特殊色 */
--color-gold: #D4AF37;             /* 泥金 */
--color-bamboo: #5C8A5E;           /* 竹绿 */
--color-water: #4A7C9B;            /* 水色 */
--color-cloud: #C4A265;            /* 云色 */
--color-scroll: #8B4513;           /* 卷轴色 */
--color-seal: #C23B22;             /* 印泥色 */
```

### 3.2 色彩语义映射

| 用途 | 颜色变量 | 说明 |
|------|----------|------|
| 主背景 | `--color-paper` | 模拟宣纸质感 |
| 卡片背景 | `--color-paper-dark` | 层次区分 |
| 主文字 | `--color-ink` | 正文阅读 |
| 辅助文字 | `--color-ink-light` | 说明文字 |
| 提示文字 | `--color-ink-muted` | 占位符、辅助说明 |
| 主按钮 | `--color-ochre` | 主要操作入口 |
| 强调/警告 | `--color-cinnabar` | 危险操作、错误提示 |
| 边框分隔 | `--color-border` | 卡片、输入框边框 |

---

## 四、字体系统

### 4.1 字体配置

```css
/* 展示字体 - 用于标题、装饰文字 */
--font-display: 'Ma Shan Zheng', '华文行楷', '楷体', 'STKaiti', cursive;

/* 正文字体 - 用于正文、内容 */
--font-body: 'Noto Serif SC', '思源宋体', '宋体', 'SimSun', sans-serif;

/* 等宽字体 - 用于代码、数字 */
--font-mono: 'Geist Mono', monospace;
```

### 4.2 字体使用规范

| 场景 | 字体家族 | 字号建议 | 适用元素 |
|------|----------|----------|----------|
| 页面标题 | `font-display` | 2rem+ | H1、品牌名 |
| 区块标题 | `font-display` | 1.5rem | H2、卡片标题 |
| 正文内容 | `font-body` | 1rem | P、正文段落 |
| 辅助文字 | `font-body` | 0.875rem | 说明、标签 |
| 数字/代码 | `font-mono` | 0.875-1rem | 统计数据、代码块 |
| 印章文字 | `font-display` | 14-20px | 印章装饰元素 |

---

## 五、组件风格

### 5.1 按钮组件 (`Button.tsx`)

| 变体 | 样式特征 | 适用场景 |
|------|----------|----------|
| `default` | 渐变背景、阴影、悬停上浮 | 主要操作按钮 |
| `destructive` | 朱砂红色背景 | 危险操作按钮 |
| `outline` | 边框样式、透明背景 | 次要操作按钮 |
| `secondary` | 浅背景、深色文字 | 辅助操作按钮 |
| `ghost` | 透明、悬停显示背景 | 轻量级操作 |
| `link` | 下划线链接样式 | 文字链接 |

**自定义古风按钮样式**：

```css
.btn-ancient {
  background: linear-gradient(135deg, var(--color-ochre) 0%, var(--color-ochre-dark) 100%);
  color: var(--color-paper);
  box-shadow:
    0 4px 15px rgba(139, 69, 19, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.25);
  border-radius: var(--radius-ancient-md);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
```

### 5.2 卡片组件 (`Card.tsx`)

**基础卡片样式**：

| 类型 | 样式特征 | 适用场景 |
|------|----------|----------|
| `card-ancient` | 渐变背景、多层阴影、悬停上浮 | 通用卡片 |
| `card-scroll` | 卷轴样式、两端装饰 | 重要内容卡片 |
| `card-corner` | 四角装饰 | 装饰性卡片 |
| `card-seal` | 印章装饰 | 认证、标签类卡片 |

**卷轴卡片示例**：

```css
.card-scroll {
  background: linear-gradient(180deg,
      var(--color-paper) 0%,
      var(--color-paper-dark) 2%,
      var(--color-paper) 5%,
      var(--color-paper) 95%,
      var(--color-paper-dark) 98%,
      var(--color-paper) 100%);
  border: 2px solid var(--color-scroll);
  box-shadow:
    0 8px 30px rgba(139, 69, 19, 0.18),
    inset 0 0 80px rgba(139, 69, 19, 0.04);
}
```

### 5.3 输入组件

```css
input, textarea {
  background: var(--color-paper);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-ancient-md);
  transition: all 0.3s ease;
}

input:focus, textarea:focus {
  border-color: var(--color-ochre);
  box-shadow: 0 0 0 3px rgba(139, 69, 19, 0.1);
  outline: none;
}
```

---

## 六、装饰元素

### 6.1 印章装饰

**圆形印章**：

```css
.seal-stamp {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 2px solid var(--color-seal);
  font-family: var(--font-display);
  color: var(--color-seal);
  background: radial-gradient(circle, rgba(194, 59, 34, 0.06) 0%, transparent 70%);
}
```

**方形印章**：

```css
.seal-stamp-square {
  width: 48px;
  height: 48px;
  border: 2px solid var(--color-seal);
  font-family: var(--font-display);
  color: var(--color-seal);
  transform: rotate(-6deg);
}
```

### 6.2 分隔线装饰

```css
.ancient-divider {
  height: 1px;
  background: linear-gradient(to right,
      transparent,
      var(--color-ochre-light) 15%,
      var(--color-ochre) 50%,
      var(--color-ochre-light) 85%,
      transparent);
}
```

### 6.3 毛笔下划线

```css
.brush-underline::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  height: 5px;
  background: linear-gradient(90deg,
      var(--color-cinnabar),
      var(--color-ochre) 35%,
      var(--color-ochre-light) 70%,
      transparent);
  clip-path: polygon(0 0, 98% 0, 100% 30%, 100% 70%, 98% 100%, 0 100%, 2% 70%, 2% 30%);
}
```

---

## 七、动画效果

### 7.1 核心动画定义

| 动画名称 | 效果描述 | 时长 | 应用场景 |
|----------|----------|------|----------|
| `fade-in` | 淡入 + 上移 | 0.5s | 页面元素入场 |
| `slide-up` | 上滑进入 | 0.6s | 卡片、列表项 |
| `float` | 悬浮浮动 | 5s | 背景装饰元素 |
| `float-slow` | 慢速悬浮 | 12s | 大型背景装饰 |
| `ink-drop` | 墨滴扩散 | 0.9s | 点击反馈 |
| `seal-stamp` | 印章盖下 | 2.5s | 印章动画 |
| `brush-stroke` | 毛笔书写 | 1.4s | 下划线动画 |
| `shimmer` | 光泽流动 | 2.5s | 文字光泽效果 |
| `cloud-drift` | 云朵漂移 | 45s | 背景云朵 |
| `bamboo-sway` | 竹林摇曳 | 18s | 竹元素装饰 |

### 7.2 悬停交互

| 交互类 | 效果描述 |
|--------|----------|
| `hover-lift` | 悬停上浮 + 阴影加深 |
| `ink-hover` | 墨滴扩散效果 |
| `animate-spin-hover` | 悬停旋转 |
| `animate-bounce-hover` | 悬停弹跳 |
| `animate-scale-hover` | 悬停放大 |

---

## 八、背景装饰系统

### 8.1 多层背景结构

```
┌─────────────────────────────────────────────────────────┐
│ Layer 1: SVG 装饰元素（云朵、印章、竹林、山水等）       │ z-index: -2
├─────────────────────────────────────────────────────────┤
│ Layer 2: 渐变遮罩层                                    │ z-index: -1
├─────────────────────────────────────────────────────────┤
│ Layer 3: 纹理背景（宣纸质感）                           │ body::before
├─────────────────────────────────────────────────────────┤
│ Layer 4: 顶部光晕效果                                  │ body::after
└─────────────────────────────────────────────────────────┘
```

### 8.2 装饰元素清单

| 元素类型 | SVG 特征 | 动画效果 | 位置分布 |
|----------|----------|----------|----------|
| 祥云 | 云朵路径 | `cloudDrift` | 顶部左右、中部 |
| 印章 | 圆形边框 + 文字 | 静态/浮动 | 中部偏右 |
| 竹林 | 竹竿 + 竹叶椭圆 | `bambooSway` | 左侧边缘 |
| 山水 | 抽象山峦路径 | `floatSlow` | 底部 |
| 太极/圆纹 | 同心圆 + 对称图案 | `floatCloud` | 中部 |
| 花瓣/星形 | 几何多边形 | 静态 | 点缀 |
| 波浪/曲线 | 贝塞尔曲线 | 静态 | 底部装饰 |

---

## 九、布局规范

### 9.1 容器与间距

```css
/* 容器配置 */
.container {
  center: true;
  padding: '2rem';
  screens: { '2xl': '1400px' };
}

/* 阴影层级 */
--shadow-ancient-sm: 0 2px 8px rgba(139, 69, 19, 0.08);
--shadow-ancient-md: 0 4px 16px rgba(139, 69, 19, 0.12);
--shadow-ancient-lg: 0 8px 32px rgba(139, 69, 19, 0.16);
--shadow-ancient-xl: 0 16px 48px rgba(139, 69, 19, 0.2);

/* 圆角配置 */
--radius-ancient-sm: 4px;
--radius-ancient-md: 8px;
--radius-ancient-lg: 16px;
--radius-ancient-xl: 24px;
```

### 9.2 响应式断点

| 断点 | 尺寸 | 布局调整 |
|------|------|----------|
| `sm` | 640px | 移动端基础布局 |
| `md` | 768px | 平板布局，导航栏调整 |
| `lg` | 1024px | 桌面布局 |
| `xl` | 1280px | 大屏布局 |
| `2xl` | 1400px | 超大屏，容器最大宽度 |

---

## 十、视觉层次

### 10.1 颜色对比度

| 组合 | 前景色 | 背景色 | 对比度 | 适用场景 |
|------|--------|--------|--------|----------|
| 正文 | `ink` | `paper` | 高对比 | 主要内容 |
| 辅助 | `ink-light` | `paper` | 中对比 | 次要信息 |
| 提示 | `ink-muted` | `paper` | 低对比 | 辅助说明 |
| 按钮 | `paper` | `ochre` | 高对比 | 操作入口 |

### 10.2 交互反馈

| 状态 | 视觉反馈 |
|------|----------|
| 默认 | 基础样式 |
| 悬停 | 上浮 + 阴影加深 + 光泽效果 |
| 点击 | 下压 + 阴影收缩 |
| 聚焦 | 边框高亮 + 光晕 |
| 禁用 | 透明度降低 |

---

## 十一、设计原则总结

1. **文化传承**：融入中国传统书画元素（印章、宣纸、墨色、祥云）
2. **现代体验**：平滑动画、响应式布局、清晰的交互反馈
3. **学术氛围**：典雅的配色方案，适合长时间阅读
4. **主题切换**：支持多种主题满足不同用户偏好
5. **视觉层次**：通过阴影、色彩、间距建立清晰的信息层级
