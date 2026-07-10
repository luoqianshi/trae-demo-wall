# 第一周技术实现方案

> 基于头脑风暴确认的设计决策
> 更新日期：2026-05-10

---

## 已确认设计决策

| 模块 | 决策 | 实现来源 |
|------|------|---------|
| 任务卡片完成反馈 | 卡片背景光晕型 + 6时段动态色彩 | `task-snowball-demo-v3.html` |
| 导航栏雪球 | 方案2+4结合（进度胶囊+下拉触发） | `navbar-snowball-v2-demo.html` |
| 任务列表复选框 | 品牌渐变圆点 | `checkbox-demo.html` 方案3 |
| 浮动文字 | `雪球+3% 🎈` + 粉蓝渐变背景 | `float-text-demo.html` |
| 记录卡片雪球渗透 | 方案3（图标装饰型） | `record-card-demo.html` |
| 空状态 | 方案1（当前阶段展示） | `empty-state-v2-demo.html` |
| 故事化 | 方案7+8结合 | `empty-state-v2-demo.html` |

---

## 核心实现要点

### 1. 6时段色彩系统

```typescript
// lib/time-colors.ts
export type TimePeriod = 'dawn' | 'morning' | 'noon' | 'dusk' | 'night' | 'deepnight';

export const TIME_COLORS: Record<TimePeriod, { bg: string; shadow: string }> = {
  dawn:      { bg: 'rgba(135, 206, 235, 0.4)',      shadow: '0 0 40px rgba(135, 206, 235, 0.5)' },
  morning:   { bg: 'linear-gradient(135deg, rgba(135,206,235,0.4), rgba(255,215,0,0.3))', shadow: '0 0 40px rgba(135,206,235,0.4), 0 0 60px rgba(255,215,0,0.2)' },
  noon:      { bg: 'rgba(255, 215, 0, 0.35)',      shadow: '0 0 40px rgba(255, 215, 0, 0.5)' },
  dusk:      { bg: 'linear-gradient(135deg, rgba(255,215,0,0.3), rgba(255,182,193,0.4))', shadow: '0 0 40px rgba(255,182,193,0.4), 0 0 60px rgba(255,215,0,0.2)' },
  night:     { bg: 'rgba(255, 182, 193, 0.4)',     shadow: '0 0 40px rgba(255, 182, 193, 0.5)' },
  deepnight: { bg: 'rgba(26, 26, 94, 0.2)',        shadow: '0 0 40px rgba(26, 26, 94, 0.3)' },
};

export function getCurrentPeriod(): TimePeriod {
  const h = new Date().getHours();
  if (h >= 6 && h < 10) return 'dawn';
  if (h >= 10 && h < 12) return 'morning';
  if (h >= 12 && h < 17) return 'noon';
  if (h >= 17 && h < 19) return 'dusk';
  if (h >= 19) return 'night';
  return 'deepnight';
}
```

---

### 2. 任务卡片光晕动画

**文件位置：** `src/app/components/TaskCardGlow.tsx`

**核心实现：**
- 使用纯色背景（非渐变）实现光晕，避免突兀感
- 6时段色彩通过 `TIME_COLORS` 获取
- 动画使用 CSS keyframes，与 demo 一致

```tsx
// 伪代码结构
interface TaskCardGlowProps {
  isCompleted: boolean;
  onComplete?: () => void;
}

// 动画关键帧（与 demo 一致）
@keyframes cardGlow {
  0% { background: #FAFAFA; }
  30% { 
    background: ${TIME_COLORS[period].bg};
    box-shadow: ${TIME_COLORS[period].shadow};
  }
  100% { background: #FAFAFA; }
}
```

---

### 3. 导航栏雪球组件

**文件位置：** `src/app/components/NavSnowball.tsx`

**核心功能：**
- 进度胶囊展示（方案2）
- 下拉触发完整卡片（方案4）
- 首页/回顾页不显示

**Props：**
```typescript
interface NavSnowballProps {
  todayGrowth: number;      // 今日增长百分比
  totalGrowth: number;      // 总进度百分比
  currentStage: SnowballStage;
  hideOnPages?: string[];   // 默认 ['/', '/review']
}
```

---

### 4. 任务列表复选框

**文件位置：** `src/app/components/DotCheckbox.tsx`

**核心实现：**
- 圆形复选框，完成时填充品牌渐变色
- 与任务卡片光晕动画联动

```tsx
// 伪代码
interface DotCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
}

// 样式（与 demo 方案3一致）
// 未选中：border: 2px solid #ddd; border-radius: 50%;
// 选中：background: linear-gradient(135deg, #FFB6C1, #87CEEB);
```

---

### 5. 浮动文字组件

**文件位置：** `src/app/components/GrowthFloatText.tsx`

**核心实现：**
- 文字：`雪球+3% 🎈`
- 背景：粉蓝渐变
- 动画：从卡片中心上浮消失

---

### 6. 记录卡片雪球装饰

**修改文件：** `src/app/components/RecordCard.tsx`

**新增内容：**
- 右上角迷你雪球图标
- 显示增长数字（如 `+3%`）
- 使用实际雪球图片缩小版

---

### 7. 空状态组件

**文件位置：** `src/app/components/EmptyStateSnowball.tsx`

**核心实现：**
- 展示当前雪球阶段图片
- 呼吸动画
- 文案："还没有记录，开始记录你的第一个小成功吧"

---

## 文件修改清单

### 新增文件
| 文件路径 | 用途 |
|---------|------|
| `src/lib/time-colors.ts` | 6时段色彩配置 |
| `src/app/components/TaskCardGlow.tsx` | 任务卡片光晕效果 |
| `src/app/components/NavSnowball.tsx` | 导航栏雪球组件 |
| `src/app/components/DotCheckbox.tsx` | 品牌渐变圆点复选框 |
| `src/app/components/GrowthFloatText.tsx` | 浮动文字组件 |
| `src/app/components/EmptyStateSnowball.tsx` | 雪球空状态 |

### 修改文件
| 文件路径 | 修改内容 |
|---------|---------|
| `src/app/components/Navbar.tsx` | 集成 NavSnowball |
| `src/app/components/RecordCard.tsx` | 添加右上角雪球装饰 |
| `src/app/tasks/page.tsx` | 替换复选框为 DotCheckbox，添加光晕效果 |

---

## 渐变色过渡优化方案

**问题：** 渐变色出现/消失突兀

**解决方案：**
使用纯色背景替代渐变背景实现光晕效果：

```css
/* 不推荐 - 渐变突兀 */
@keyframes cardGlowBad {
  30% { background: linear-gradient(...); } /* 突兀 */
}

/* 推荐 - 纯色平滑 */
@keyframes cardGlowGood {
  0% { background: #FAFAFA; }
  30% { background: rgba(255, 182, 193, 0.4); } /* 纯色，平滑 */
  100% { background: #FAFAFA; }
}
```

对于需要渐变的时段（morning/dusk），使用 **伪元素 + 透明度动画**：

```css
.task-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(135,206,235,0.4), rgba(255,215,0,0.3));
  opacity: 0;
  transition: opacity 0.3s;
}

.task-card.glow::before {
  opacity: 1;
}
```

---

## 实际图片使用规范

| 场景 | 图片路径 | 尺寸 |
|------|---------|------|
| 空状态展示 | `/images/snowball-stages/stage-{1-3}.webp` | 100-120px |
| 导航栏迷你雪球 | `/images/snowball-stages/stage-{1-3}.webp` | 32-40px |
| 记录卡片装饰 | `/images/snowball-stages/stage-{1-3}.webp` | 32px |

**注意：** big_ball 和 snowman 阶段暂时复用 stage-3.webp

---

## 验收标准

- [ ] 任务完成时触发光晕动画（6时段色彩正确）
- [ ] 导航栏显示进度胶囊，点击下拉展示完整卡片
- [ ] 任务列表复选框为品牌渐变圆点
- [ ] 浮动文字显示 `雪球+X% 🎈` 并正确上浮消失
- [ ] 记录卡片右上角显示迷你雪球+增长数字
- [ ] 空状态展示当前阶段雪球图片+呼吸动画
- [ ] 渐变色过渡平滑自然

---

*本文档基于头脑风暴确认的设计决策编写*
