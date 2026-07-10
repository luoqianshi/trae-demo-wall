# 设计师代码参考

> 本文档提供关键代码片段，帮助设计师了解技术实现方式

---

## 📦 核心文件结构

```
src/app/components/
├── SnowballAnimation.tsx    # 主组件（需要设计师关注）
└── ...

src/lib/
├── snowball-stage.ts        # 阶段定义（需要设计师关注）
└── ...
```

---

## 🎯 关键代码片段

### 1. 阶段定义 (snowball-stage.ts)

```typescript
// 3个成长阶段的定义
export type SnowballStage = 'snowflake' | 'small_ball' | 'ball';

export interface SnowballStageConfig {
  stage: SnowballStage;      // 阶段名称
  minScore: number;           // 最小分数
  maxScore: number;           // 最大分数
  size: number;               // 显示尺寸（像素）
  label: string;              // 显示标签
}

// 阶段配置数组
export const SNOWBALL_STAGES: SnowballStageConfig[] = [
  { stage: 'snowflake', minScore: 0, maxScore: 49, size: 300, label: '雪粒' },
  { stage: 'small_ball', minScore: 50, maxScore: 199, size: 375, label: '小雪球' },
  { stage: 'ball', minScore: 200, maxScore: Infinity, size: 450, label: '雪球' },
];

// 根据分数获取当前阶段
export function getSnowballStageByScore(score: number): SnowballStageConfig {
  return SNOWBALL_STAGES.find(s => score >= s.minScore && score <= s.maxScore) || SNOWBALL_STAGES[0];
}
```

**设计师需要知道**：
- ✅ 3个阶段是固定的，但名称可以改
- ✅ 分数范围可以调整
- ✅ 尺寸可以调整
- ✅ 标签文字可以改

---

### 2. 组件接口 (SnowballAnimation.tsx)

```typescript
interface SnowballAnimationProps {
  totalRecords?: number;      // 总记录数（决定显示哪个阶段）
  progress?: number;          // 进度百分比（0-100）
  triggerRoll?: number;       // 触发滚动动画
  totalSteps?: number;        // 总步骤数
  completedSteps?: number;    // 已完成步骤数
  
  // 可选的自定义选项
  snowballColor?: 'white' | 'pink' | 'blue' | 'gold' | 'rainbow';
  decoration?: 'none' | 'hat' | 'scarf' | 'glasses' | 'crown';
  backgroundTheme?: 'clear_sky' | 'starry' | 'flower' | 'aurora';
  
  // 交互回调
  onInteract?: (type: 'pet' | 'shake') => void;
}
```

**设计师需要知道**：
- ✅ `totalRecords` 是核心参数，决定显示哪个阶段
- ✅ 颜色、装饰、背景主题可以自定义
- ✅ 支持单击和双击交互

---

### 3. 动画实现示例

#### 使用 Framer Motion（当前方式）

```tsx
import { motion } from 'framer-motion';

// 基础呼吸动画
<motion.div
  animate={{
    scale: [1, 1.02, 1],
    opacity: [0.9, 1, 0.9],
  }}
  transition={{
    duration: 3000,
    repeat: Infinity,
    ease: 'easeInOut',
  }}
>
  {/* 角色内容 */}
</motion.div>

// 眨眼动画
<motion.div
  animate={{
    scaleY: [1, 0.1, 1],
  }}
  transition={{
    duration: 150,
    repeat: Infinity,
    repeatDelay: 2000,
  }}
>
  {/* 眼睛 */}
</motion.div>

// 点击互动
<motion.div
  animate={{
    scale: [1, 1.1, 1],
    rotate: [0, 5, -5, 0],
  }}
  transition={{
    duration: 400,
  }}
>
  {/* 角色内容 */}
</motion.div>
```

#### 使用 Lottie（设计师可选）

```tsx
import Lottie from 'lottie-react';
import animationData from './animation.json';

<Lottie
  animationData={animationData}
  loop={true}
  autoplay={true}
  style={{ width: 200, height: 200 }}
/>
```

---

### 4. 颜色系统示例

```typescript
const COLOR_THEMES = {
  white: {
    body: 'linear-gradient(135deg, #FFFFFF 0%, #F0F8FF 50%, #E6F3FF 100%)',
    shadow: '0 20px 60px rgba(135, 206, 235, 0.3)',
    glow: 'rgba(135, 206, 235, 0.2)',
    cheek: '#FFB6C1',
  },
  pink: {
    body: 'linear-gradient(135deg, #FFF5F7 0%, #FFE4EC 50%, #FFD6E0 100%)',
    shadow: '0 20px 60px rgba(255, 182, 193, 0.35)',
    glow: 'rgba(255, 182, 193, 0.25)',
    cheek: '#FF99AA',
  },
  // ... 其他主题
};
```

**设计师需要知道**：
- ✅ 使用 CSS 渐变定义颜色
- ✅ 可以自定义任何颜色值
- ✅ 需要提供主体色、阴影色、高光色、强调色

---

### 5. SVG 绘制示例

```tsx
// 使用 SVG 绘制角色
<svg width={size} height={size} viewBox="0 0 100 100">
  {/* 身体 */}
  <circle cx="50" cy="50" r="45" fill="url(#bodyGradient)" />
  
  {/* 眼睛 */}
  <circle cx="35" cy="40" r="5" fill="#374151" />
  <circle cx="65" cy="40" r="5" fill="#374151" />
  
  {/* 高光 */}
  <circle cx="37" cy="38" r="2" fill="white" />
  <circle cx="67" cy="38" r="2" fill="white" />
  
  {/* 腮红 */}
  <ellipse cx="25" cy="55" rx="8" ry="5" fill="#FFB6C1" opacity="0.6" />
  <ellipse cx="75" cy="55" rx="8" ry="5" fill="#FFB6C1" opacity="0.6" />
  
  {/* 渐变定义 */}
  <defs>
    <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FFFFFF" />
      <stop offset="50%" stopColor="#F0F8FF" />
      <stop offset="100%" stopColor="#E6F3FF" />
    </linearGradient>
  </defs>
</svg>
```

---

## 🎨 设计师可以做什么

### 方式1：提供 SVG 文件

设计师交付：
```
stage-1.webp  (雪粒阶段)
stage-2.webp  (小雪球阶段)
stage-3.webp  (雪球阶段 - 最终形态)
```

开发者集成：
```tsx
import Stage1SVG from './stage-1.svg';

<div dangerouslySetInnerHTML={{ __html: Stage1SVG }} />
```

### 方式2：提供 Lottie 动画

设计师交付：
```
stage-1-animation.json
stage-2-animation.json
stage-3-animation.json
stage-4-animation.json
stage-5-animation.json
```

开发者集成：
```tsx
import Lottie from 'lottie-react';
import stage1Animation from './stage-1-animation.json';

<Lottie animationData={stage1Animation} />
```

### 方式3：提供设计参数

设计师交付：
```
color-specification.md     # 颜色规范
animation-parameters.md    # 动画参数
design-assets/            # 设计资源
```

开发者根据参数实现：
```tsx
// 根据设计师提供的参数实现
<motion.div
  animate={{
    scale: [1, 1.05, 1],  // 设计师提供
  }}
  transition={{
    duration: 3000,        // 设计师提供
    ease: 'easeInOut',     // 设计师提供
  }}
/>
```

---

## 📝 设计师需要提供的代码相关信息

### 必需信息

1. **SVG 路径数据**（如果使用 SVG）
   - 每个阶段的完整 SVG 代码
   - 或导出的 .svg 文件

2. **颜色值**
   - 每个主题的 HEX/RGB 值
   - 渐变定义（起点、终点、颜色节点）

3. **动画参数**
   - 动画类型（scale/rotate/translate/opacity）
   - 数值范围（from/to）
   - 时长（duration）
   - 缓动函数（easing）
   - 重复方式（repeat）

### 可选信息

1. **Lottie JSON 文件**（如果使用 Lottie）
   - 每个阶段的动画文件
   - 包含所有动画效果

2. **交互状态**
   - 点击时的动画参数
   - 双击时的动画参数
   - 悬停时的动画参数

---

## 🔧 集成流程

### 设计师交付后

1. **接收文件**
   ```
   /design-delivery/
   ├── svg/
   │   ├── stage-1.svg
   │   ├── stage-2.svg
   │   └── ...
   ├── lottie/
   │   ├── stage-1.json
   │   └── ...
   └── docs/
       ├── color-spec.md
       └── animation-guide.md
   ```

2. **集成到代码**
   - 将 SVG/Lottie 文件放入 `public/` 或 `src/assets/` 目录
   - 修改 `SnowballAnimation.tsx` 引用新资源
   - 根据颜色规范更新 `COLOR_THEMES`
   - 根据动画参数更新动画配置

3. **测试验证**
   - 在预览模式中测试所有阶段
   - 测试交互动画
   - 测试颜色主题切换
   - 性能测试

---

## 💡 给设计师的建议

### 技术限制

- ✅ SVG 路径尽量简化（减少节点数量）
- ✅ 避免使用过多的滤镜效果（影响性能）
- ✅ 动画时长建议 1-5 秒（太短看不清，太长影响体验）
- ✅ 颜色数量适中（每个阶段 3-5 种颜色即可）

### 优化建议

- 使用 CSS 渐变代替图片（体积更小）
- 复用相同的形状（减少代码量）
- 动画参数使用标准值（方便维护）
- 提供不同尺寸的版本（适配不同设备）

---

## 📞 技术支持

如果设计师在实现过程中遇到技术问题，可以：

1. **查看当前代码**：参考 `SnowballAnimation.tsx` 的实现
2. **测试动画效果**：使用预览模式实时查看
3. **咨询开发团队**：随时沟通技术可行性

---

**文档版本**：v1.0
**更新日期**：2026-05-02
**备注**：本文档为设计师提供代码参考，帮助理解技术实现方式
