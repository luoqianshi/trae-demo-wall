# WebMotion 底层重构规格书 (Spec)

> LOOP 方法论 · 规划师阶段 · 2026-07-01

---

## 一、重构目标

从底层重建 WebMotion 的**设计系统**、**渲染架构**和**模块架构**，实现：
1. 所有视觉元素（文字、间距、颜色）通过统一的设计令牌系统管理，消除硬编码
2. 渲染管线与导出管线完全共享，确保"所见即导出"
3. 模块解耦，通过 EventBus 中介者通信
4. 设计规则从纯文档转化为可执行代码
5. 视觉套件 Demo 深度集成到 WebMotion 的模板/预设系统

---

## 二、诊断发现的问题清单

### P0 — 破坏性缺陷

| ID | 问题 | 位置 | 影响 |
|----|------|------|------|
| P0-1 | 默认分辨率不一致 | `visual-editor.js:11` (1280x720) vs `preview.js:7` (1920x1080) | 初始化阶段画布尺寸错乱 |
| P0-2 | 未定义的 CSS 变量 | `index.html:568,572,584` 引用 `--bg-darker`, `--border`, `--text` | 品牌套件弹窗样式异常 |
| P0-3 | 三套独立颜色系统 | `style.css:2-48` / `ai.js:16-51` / `ai.js:11` | 修改颜色需改三处，极易不一致 |

### P1 — 严重缺陷

| ID | 问题 | 位置 | 影响 |
|----|------|------|------|
| P1-1 | 预览与导出路径不共享 | `preview.js` 和 `exporter.js` 各自实现渲染逻辑 | 预览与导出效果可能不一致 |
| P1-2 | 错误渲染代码重复 4 次 | `preview.js:112-246` | 维护成本高，容易遗漏修复 |
| P1-3 | 规则系统纯文档化 | `skills/rules/*.md` | AI 生成代码无法被运行时验证 |
| P1-4 | 27 个脚本阻塞加载 | `index.html:602-648` | 首屏加载缓慢 |
| P1-5 | 全局状态污染 | 20+ 个 IIFE 全局单例 | 模块间隐式依赖，无法测试 |

### P2 — 中等缺陷

| ID | 问题 | 位置 | 影响 |
|----|------|------|------|
| P2-1 | CSS 无间距/字号令牌 | `style.css` 缺少 `--space-*`, `--text-*` | 所有间距/字号硬编码 px |
| P2-2 | 套件多样性无代码执行 | `suites.md:69-71` | AI 可能生成单一套件的单调动画 |
| P2-3 | app.js 过大 (2000+ 行) | `app.js` | 职责过多，难以维护 |
| P2-4 | 画布引用冲突 | `visual-editor.js:26` 和 `preview.js:16` 各自持有 ctx | 两个模块各自维护 width/height |

### P3 — 低优先级

| ID | 问题 | 位置 | 影响 |
|----|------|------|------|
| P3-1 | 规则间矛盾 | 渐变色停数量：color-theory.md vs ai.js | AI 收到矛盾指令 |
| P3-2 | MCP 服务器未集成 | `mcp/server.js` | 独立存在，无法通过 MCP 操作 |
| P3-3 | 内部 JS 版本号不一致 | `index.html` | v7/v8/v9/v11/v5/v1 混杂 |

---

## 三、重构范围

### 包含的重构

1. **设计令牌系统** (Token System) — 新增 `tokens/` 目录，统一颜色/间距/字号/圆角/动画
2. **渲染管线统一** (Render Pipeline) — 合并 `preview.js` + `exporter.js` 的渲染逻辑
3. **模块架构重构** (Architecture) — 引入 EventBus，拆分 `app.js`
4. **设计规则执行** (Rule Engine) — 将 `skills/rules/` 转化为可执行验证
5. **排版系统** (Typography) — 统一 `fontSize()` 函数，消除硬编码字号
6. **安全区系统** (SafeZone) — Title Safe / Action Safe，分辨率自适应
7. **Demo 集成** (Suite Integration) — 将 `suite-demo.html` 的设计系统集成到 WebMotion 模板/预设

### 不包含的重构

- 3D 渲染管线 (ThreeRenderer) — 保持现有实现
- 导出格式扩展 — 保持现有 PNG/WebM/GIF
- AI 对接协议 — 保持现有 API 调用方式
- MCP 服务器集成 — 延后至下一轮 LOOP

---

## 四、目标架构

### 4.1 设计令牌系统

```
tokens/
├── source.json          # 唯一事实来源 (Single Source of Truth)
├── build.js             # 构建脚本：生成 CSS + JS
├── tokens.css           # 生成：CSS Custom Properties
├── tokens.js            # 生成：JS 模块 (ESM)
└── schema.json          # JSON Schema 验证
```

**令牌结构**：
```json
{
  "color": {
    "bg": { "void": "#06060e", "deep": "#0a0c18", "surface": "#111522" },
    "ink": { "primary": "#f0ece4", "secondary": "rgba(240,236,228,0.6)" },
    "accent": { "gold": "#c9a96e", "teal": "#5eead4", "rose": "#fb7185" }
  },
  "space": { "xs": 8, "sm": 16, "md": 24, "lg": 32, "xl": 48, "xxl": 64 },
  "fontSize": { "hero": 96, "h1": 64, "h2": 48, "h3": 36, "body": 24, "caption": 16, "small": 13 },
  "radius": { "sm": 6, "md": 12, "lg": 20 },
  "motion": { "easeOut": "cubic-bezier(0.16,1,0.3,1)", "easeSpring": "cubic-bezier(0.34,1.56,0.64,1)" }
}
```

### 4.2 模块架构 (EventBus 模式)

```
                         ┌──────────────┐
                         │   EventBus   │  ← 中央事件总线
                         └──────┬───────┘
              ┌─────────────────┼─────────────────┐
              │                 │                 │
        ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
        │SceneCtrl  │    │RenderEng  │    │ UICtrl    │
        │(scene.js) │    │(render.js)│    │(ui.js)    │
        └───────────┘    └───────────┘    └───────────┘
              │                 │                 │
        ┌─────▼─────┐    ┌─────▼─────┐    ┌─────▼─────┐
        │Timeline   │    │RuleEngine │    │TokenSys   │
        │(timeline) │    │(rules.js) │    │(tokens.js)│
        └───────────┘    └───────────┘    └───────────┘
```

**事件命名规范**：
```
scene:changed     → 场景切换
scene:updated     → 场景数据更新
timeline:tick     → 时间轴前进
timeline:state    → 播放/暂停状态变化
render:frame      → 帧渲染完成
export:start      → 开始导出
export:progress   → 导出进度
export:complete   → 导出完成
token:changed     → 设计令牌更新
element:selected  → 元素被选中
element:modified  → 元素被修改
```

### 4.3 渲染管线 (统一路径)

```
RenderEngine.renderFrame(globalTime)
  │
  ├─ 1. 确定当前场景 + 局部时间
  │
  ├─ 2. 绘制背景层 (Background Layer)
  │     ├─ 虚空底色
  │     ├─ 星场 (200 颗)
  │     ├─ 光晕 (3 团)
  │     ├─ 暗角
  │     └─ 胶片颗粒
  │
  ├─ 3. 绘制内容层 (Content Layer)
  │     ├─ 3D 模式 → ThreeRenderer.render(t)
  │     └─ 2D 模式 → compileUserCode() → renderFn(ctx, t, w, h, utils)
  │
  ├─ 4. 绘制叠加层 (Overlay Layer)
  │     ├─ 信息面板 (HUD)
  │     ├─ 进度条
  │     └─ 安全区指示线 (开发模式)
  │
  ├─ 5. RuleEngine.validate() ← 运行时设计规则检查
  │
  └─ 6. EventBus.emit('render:frame', { sceneIndex, localTime })
```

**关键改变**：`exporter.js` 不再独立实现渲染，而是调用 `RenderEngine.renderFrame()`。导出管线变为：
```
exportFrame(t) → RenderEngine.renderFrame(t) → canvas.toBlob() → 收集
```

### 4.4 排版系统

```javascript
// 所有字号计算统一通过此函数
const Typography = {
  /**
   * @param {'hero'|'h1'|'h2'|'h3'|'body'|'caption'|'small'} size
   * @param {number} canvasWidth
   * @returns {number} 实际像素值
   */
  fontSize: (size, canvasWidth) => {
    const base = TOKENS.fontSize[size];
    return Math.round(base * (canvasWidth / 1920));
  },

  // 安全区边距
  safeZone: (canvasWidth) => ({
    title: { x: Math.round(canvasWidth * 0.0625), y: Math.round(canvasWidth * 0.052) },
    action: { x: Math.round(canvasWidth * 0.05), y: Math.round(canvasWidth * 0.028) }
  })
};
```

### 4.5 设计规则执行引擎

```javascript
const RuleEngine = {
  // 注册规则
  register(rule) { ... },

  // 运行时验证当前帧
  validate(ctx, elements, canvasW, canvasH) {
    const violations = [];
    for (const rule of this.rules) {
      const result = rule.check(ctx, elements, canvasW, canvasH);
      if (result.violated) violations.push(result);
    }
    return violations;
  },

  // 内置规则
  builtinRules: {
    'safe-zone': { /* 检查关键文字是否在 Title Safe 内 */ },
    'font-size': { /* 检查字号是否来自 TOKENS.fontSize */ },
    'color-palette': { /* 检查颜色是否来自 TOKENS.color */ },
    'particle-limit': { /* 检查粒子数量 <= 200 */ },
    'suite-diversity': { /* 检查套件多样性 */ }
  }
};
```

---

## 五、实施计划

### Phase 1: 令牌系统 (Token System)
- [ ] 创建 `tokens/source.json`
- [ ] 实现 `tokens/build.js` 生成脚本
- [ ] 替换 `style.css` 中所有硬编码值为 `var(--token)`
- [ ] 替换 `ai.js` 中 DESIGN 对象为 import 生成的 tokens
- [ ] 替换 `aesthetics.js` 中硬编码颜色为 tokens

### Phase 2: 渲染管线统一
- [ ] 创建 `js/render-engine.js` (合并 preview + export 渲染逻辑)
- [ ] 提取错误渲染为 `renderErrorOverlay()` 函数
- [ ] 实现三层 Canvas 架构 (背景/内容/叠加)
- [ ] 实现 `Typography.fontSize()` 统一字号计算
- [ ] 实现 SafeZone 计算模块
- [ ] 实现 HUD 绘制函数 (信息面板 + 进度条)
- [ ] 修改 `exporter.js` 调用 RenderEngine 而非自己渲染

### Phase 3: 模块架构重构
- [ ] 创建 `js/event-bus.js` 中央事件总线
- [ ] 拆分 `app.js` → `SceneController` + `UIController` + `PlaybackController`
- [ ] 重构 `VisualEditor` 通过 EventBus 通信
- [ ] 重构 `Timeline` 通过 EventBus 通信
- [ ] 保持 `SceneManager` 作为数据层

### Phase 4: 规则引擎 + Demo 集成
- [ ] 创建 `js/rule-engine.js`
- [ ] 实现 5 个内置规则 (safe-zone, font-size, color-palette, particle-limit, suite-diversity)
- [ ] 将 `suite-demo.html` 的设计系统拆分为可复用组件
- [ ] 集成到 WebMotion 的模板系统 (templates.js)
- [ ] 在 `index.html` 中添加 Demo 场景入口

### Phase 5: 清理与验证
- [ ] 移除所有硬编码值
- [ ] 统一版本号
- [ ] 修复所有 CSS 变量引用
- [ ] 全量回归测试

---

## 六、验收标准

1. **零硬编码**：所有颜色/字号/间距通过 `TOKENS.*` 或 `var(--*)` 引用
2. **渲染一致**：预览与导出的渲染路径完全相同
3. **模块解耦**：模块间通过 EventBus 通信，无直接全局变量引用
4. **规则可执行**：设计规则在运行时产生警告/错误
5. **Demo 可调用**：Demo 场景可作为模板在 WebMotion 中一键加载
6. **分辨率自适应**：切换 1920x1080 ↔ 1080x1920 时，所有元素自动适配