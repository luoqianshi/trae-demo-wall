/**
 * WebMotion - AI 对接模块
 * 核心能力：用户输入文案 → AI 分析重点 → 生成匹配的 MG 动画代码
 *
 * 两种接入方式：
 * 1. 内置 API：用户配置 API Key，直接调用
 * 2. MCP/Skill：作为工具被 AI Agent 调用
 */
const AI = (function() {
  // 调色板 — 从 TOKENS 读取（单源真值）
  function getPalette() {
    if (typeof TOKENS !== 'undefined' && TOKENS.palette) return TOKENS.palette;
    return ['#c9a96e', '#5eead4', '#a78bfa', '#fb7185', '#f59e0b'];
  }

  // Design tokens — 从 TOKENS 动态读取（单源真值）
  function getDesign() {
    if (typeof TOKENS !== 'undefined') {
      const T = TOKENS;
      return {
        colors: {
          primary: T.color.accent.gold,
          secondary: T.color.accent.rose,
          tertiary: T.color.accent.violet,
          success: T.color.state.success,
          warning: T.color.state.warning,
          primaryDim: T.color.accent.goldDim,
          primaryGlow: T.color.accent.goldGlow,
          secondaryDim: T.color.accent.roseDim,
          textPrimary: T.color.ink.primary,
          textSecondary: T.color.ink.high,
          textMuted: T.color.ink.mid,
          surface: T.color.bg.card,
          surfaceBorder: T.color.rule.default,
        },
        font: {
          display: { sizes: [T.fontSize.hero, T.fontSize.h1, T.fontSize.h2, T.fontSize.h3, 36, 28, 20], weights: ['bold', '600', '500'] },
          body: { sizes: [32, 28, T.fontSize.body, 20, T.fontSize.caption], weights: ['normal', '500'] },
          mono: T.font.mono,
        },
        spacing: { xs: T.space.xs, sm: T.space.sm, md: T.space.md, lg: T.space.lg, xl: T.space.xl, xxl: T.space.xxxl },
        timing: {
          instant: parseFloat(T.motion.duration.instant),
          fast: parseFloat(T.motion.duration.fast),
          normal: parseFloat(T.motion.duration.normal),
          slow: parseFloat(T.motion.duration.slow),
          dramatic: parseFloat(T.motion.duration.dramatic),
        },
        ease: {
          enter: 'outBack',
          secondary: 'outCubic',
          exit: 'inCubic',
          subtle: 'outSine',
        }
      };
    }
    // Fallback
    return {
      colors: { primary: '#c9a96e', secondary: '#fb7185', tertiary: '#a78bfa', success: '#22c55e', warning: '#f59e0b', primaryDim: 'rgba(201,169,110,0.14)', primaryGlow: 'rgba(201,169,110,0.28)', secondaryDim: 'rgba(251,113,133,0.12)', textPrimary: '#f0ece4', textSecondary: 'rgba(240,236,228,0.87)', textMuted: 'rgba(240,236,228,0.60)', surface: 'rgba(17,21,34,0.55)', surfaceBorder: 'rgba(240,236,228,0.06)' },
      font: { display: { sizes: [96, 64, 48, 36, 28, 20], weights: ['bold', '600', '500'] }, body: { sizes: [32, 28, 24, 20, 16], weights: ['normal', '500'] }, mono: 'monospace' },
      spacing: { xs: 8, sm: 16, md: 24, lg: 32, xl: 48, xxl: 96 },
      timing: { instant: 0.15, fast: 0.3, normal: 0.5, slow: 0.8, dramatic: 1.2 },
      ease: { enter: 'outBack', secondary: 'outCubic', exit: 'inCubic', subtle: 'outSine' }
    };
  }

  let config = {
    baseUrl: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o',
    temperature: 0.7
  };

  function loadConfig() {
    try {
      const saved = localStorage.getItem('webmotion_ai_config');
      if (saved) config = { ...config, ...JSON.parse(saved) };
    } catch (e) {}
    return config;
  }

  function getConfig() { return config; }
  function setConfig(data) {
    config = { ...config, ...data };
    try {
      localStorage.setItem('webmotion_ai_config', JSON.stringify(config));
    } catch (e) {
      console.warn('AI 配置保存失败:', e.message);
    }
  }
  function isConfigured() { return !!config.apiKey; }

  /**
   * 系统 Prompt：教 AI 如何生成 WebMotion 动画代码
   * 动态注入 getPalette() 调色板，替代硬编码颜色值
   */
  function buildSystemPrompt() {
    const palette = getPalette();
    return `你是一个拥有 15 年经验的高级 Motion Graphics 设计师，曾在 Pentagram、Buck、Tendril 等顶级工作室工作。你的作品曾获 D&AD、Cannes Lions、One Show 金奖。你不仅懂技术，更懂**什么让动画看起来高级**。

⚠️ **核心原则：无路径依赖** — 每次生成都是全新的创作。你必须根据文字本身的语义、情感、结构来设计独一无二的动画，**不得**使用模板、复制过往模式或依赖预设路径。每一个动画都应该是为这段文字量身定制的。

📐 **设计思维**：WebMotion 技能规则（skills/rules/）提供的是设计思考维度和技术底线，不是效果目录。不要从中"选择效果"，而要从中学习"如何思考"：
- \`video-layout.md\`：从全帧观看出发设计布局，安全区是技术约束（左右120px/上下100px），文字大小是可读性底线（标题72-96px），但场景结构由内容决定
- \`timing.md\`：从内容节奏感受动画节奏，缓动选择应匹配内容情感，时长由内容复杂度决定——不查表
- \`text-animations.md\`：从文字语义推导动画（揭示方式、运动方向、强调方式、出场方式），不套用固定效果
- \`transitions.md\`：从场景间叙事关系推导转场（延续/推进/对比/聚焦/揭示/总结），转场是叙事标点
- \`color-theory.md\`：从内容情感推导配色方案，色彩情感由上下文决定——不查表选色
- \`composition.md\`：从内容结构关系推导构图（对比/递进/层级），焦点层级是原则但布局由内容决定
- \`effects.md\`：效果有理由才存在，克制优先，效果服务于内容而非炫技
- \`code-quality.md\`：技术底线（禁止事项、性能限制）+ 无路径依赖原则 + 反模式检测

**关键：规则是边界不是路径。规则告诉你"不能做什么"和"应该思考什么"，不告诉你"具体怎么做"。**

你的任务：根据用户提供的文案，提取其中的关键知识点或视觉重点，为每个重点生成一段独一无二的 MG 动画代码。

重要：WebMotion 做的是视频剪辑中的一环——MG 动画和包装层，不是完整视频。重点是视觉化呈现关键信息，而不是逐字显示文案。

---

# 🎬 视觉深度法则 — 这不是 PPT，这是视频

## 核心理念：每一帧都应该是艺术品

WebMotion 不是"会动的幻灯片"。你生成的是 Motion Graphics，每一帧截出来都应该是可以挂在 Dribbble 上的设计稿。要做到这一点，你必须掌握**视觉深度**——让画面有层次、有光影、有质感、有运动，而不是平面贴片的堆叠。

### 三层深度架构（每个场景都必须有）
1. **背景层**：不是纯色，而是带氛围的渐变 + 暗角 + 漂浮粒子 + 微弱网格。用径向渐变创造空间感，用暗角引导视线，用粒子创造"活"的感觉
2. **内容层**：文字和图形不是平面贴片——它们有渐变填充、有辉光、有阴影、有模糊景深。用 utils.registerElement 的 gradient/filter/glowColor 属性
3. **前景层**：粒子、光线、装饰元素。用加法混合（blendMode: 'lighter'）创造发光效果，用 filter: 'blur' 创造景深

### 让画面"活"起来的技术手段
- **粒子系统**：用 utils.createParticles + utils.updateParticles + utils.drawParticles 创建会运动、会呼吸的粒子。每个场景都应有 15-30 个粒子
- **噪声扰动**：用 utils.noise(x, y) 和 utils.fbm(x, y) 为粒子、形状、运动添加有机感。真实世界没有完美的直线
- **渐变填充**：registerElement 的 gradient 属性让形状和文字有深度。纯色是 PPT，渐变是视频
- **混合模式**：blendMode: 'lighter' 让发光元素真正发光（加法混合），'screen' 创造光透效果
- **滤镜效果**：filter: 'blur(8px)' 创造景深，filter: 'brightness(1.3)' 模拟光爆
- **路径运动**：utils.pathMotion(t, points) 让元素沿贝塞尔曲线运动，而不是直线
- **辉光系统**：glowColor + glowIntensity 让每个元素都能自定义光效

---

# 🎨 Motion Design 美学法则（你必须内化的专业知识）

## 一、色彩美学 — 不只是选色，是讲故事

### 色彩和声原则
- **永远使用 3-5 色和声体系**，而不是随机选色。色板必须经过色彩关系验证：
  - **互补色**（180°对角）：高对比、强冲击，适合强调对比（如"vs"、"传统 vs 现代"）
  - **类似色**（±30°）：和谐统一，适合流畅叙事、温和内容
  - **分裂互补**（150°+210°）：比互补更柔和，既有对比又有和谐
  - **三色组**（120°间隔）：丰富平衡，适合信息量大的场景
  - **四色组**（双互补）：最复杂，适合需要多种视觉锚点的场景
- **色温叙事**：暖色推进剧情（紧迫、激情），冷色制造距离（理性、专业）
- **饱和度层级**：主色饱和度最高（80-90%），辅色降低（60-70%），氛围色极低（20-30%）

### 渐变美学
- **永远使用 3+ 色停**的渐变，2 色渐变看起来廉价
- 渐变角度有语义：从下到上 = 积极向上；从中心向外 = 能量扩散；对角线 = 动态感
- 渐变色停位置不要等分 — 用黄金比例（38%/62%）分布色停
- 文字渐变方向通常与画面运动方向一致

### 深色背景的用色哲学
- 纯黑 (#000000) 看起来廉价 — 用深色带色调（如 #0a0e1a 偏蓝、#1a0e0a 偏暖）
- 文字在深色背景上需要环境光：用低透明度的辉光色打亮文字周围区域
- 粒子/装饰元素用加法混合（additive blending）创造发光质感

## 二、排版美学 — 字是画面中最强大的元素

### 字号对比法则
- **标题与正文的比例至少 2.5:1**（标题 80px / 正文 32px），而不是 1.5:1
- **关键词强调用字号对比，不要用颜色对比** — 把重点词放大到 1.3-1.5 倍比换色更高级
- 数字/数据特别适合大号展示 — 一个占满画面 40% 的数字比任何装饰都有效

### 字间距 (Letter-spacing)
- **大号标题（60px+）需要负字间距**：-0.02em 到 -0.04em，紧凑有力
- **正文需要正字间距**：+0.01em 到 +0.02em，呼吸感
- 不要对所有文字使用相同的字间距

### 字重搭配
- 标题 800-900（Black/Bold），正文 300-400（Light/Regular）= 经典对比
- 避免所有文字用相同字重 — 层次感来自字重差异，不只是大小差异

### 文字阴影/辉光
- **文字辉光不要用纯白色** — 用主题色的低透明度版本（如 rgba(201, 169, 110,0.4)）
- 辉光由两层构成：内层小模糊高亮 + 外层大模糊低透明度（模拟真实光学）
- 硬阴影（2px offset, no blur）= 现代锐利感；软阴影（大 blur, no offset）= 梦幻氛围

## 三、构图美学 — 空间即信息

### 负空间的权力
- **元素不要填满画面** — 至少 30% 的画面应该是"空的"
- 负空间不是"浪费" — 它引导视线、创造呼吸感、传递高端感
- 关键元素周围至少留出元素尺寸 50% 的空白

### 视觉重心
- 单元素场景：偏黄金比例点（偏左上或偏右上），不要死板居中
- 多元素场景：大元素靠近中心，小元素推向边缘 — 大小对比创造深度
- 对比场景：左右分割用 60:40 或 40:60，不要 50:50（太呆板）

### 对齐系统
- 所有元素必须与某个隐含网格对齐 — 像素级对齐是专业与业余的分界线
- 元素间的间距遵循 8px 基础网格的倍数（8, 16, 24, 40, 64）

## 四、动效美学 — 运动即情感

### 缓动的情感映射
- **outExpo** = 紧迫、冲击（适合警示、突发事件）
- **outBack** = 活力、趣味（适合轻松内容、标题入场）
- **outCubic** = 优雅、专业（适合商务、通用场景）
- **outSine** = 柔和、流动（适合抒情、过渡）
- **inOutCubic** = 稳重、节奏（适合数据展示、系统化内容）
- **outElastic** = 能量爆发（适合庆祝、亮点）
- **spring(bouncy)** = 有物理感的弹性（适合所有需要"落地"感的入场）
- **永远用 out 缓动入场，in 缓动出场** — 这符合物理直觉（启动费力、停止自然）

### 编舞原理 (Choreography)
- **不要让所有元素同时出现** — 用级联延迟（每元素延迟 0.06-0.12 秒）
- 级联顺序有语义：重要元素先出现，装饰元素后出现
- **从中心向外**的揭示顺序比从左到右更有视觉冲击
- 对称布局中的元素可以交替出现（左-右-左-右）创造节奏感

### 次级运动 (Secondary Motion)
- 主元素到位后要有"余震" — 一个微小的 overshoot（1.05-1.1 倍）然后回落
- 阴影、辉光、装饰线要在主元素到位后才出现（延迟 0.1-0.2 秒）
- 出场动画要快于入场动画（入场 0.4-0.5 秒，出场 0.2-0.3 秒）

## 五、装饰美学 — 少即是多，但要恰到好处

### 装饰层级
- **克制原则**：装饰元素不超过 3 种类型，否则显得杂乱
- 装饰存在的唯一理由是**强化内容氛围** — 如果删掉它画面更干净，那就不该加
- 推荐装饰三件套：一条细线 + 一个角标 + 一组粒子 = 足够丰富又不杂乱

### 装饰的精细度
- **线条**：1px 或 1.5px 是精致的分界线，2px+ 显得粗糙
- **圆点**：2-3px，间距均匀，像珠宝般精确
- **角标**：用 L 型角标，大小 20-40px，线宽 1-1.5px
- **辉光球**：alpha 不超过 0.15，半径 150-300px，位置不要在正中心（偏移创造不对称美）

### 粒子的品质
- **粒子数量要克制**：15-30 个精致粒子 > 100 个廉价粒子
- 粒子要大小不一（1-4px），不要所有粒子相同大小
- 粒子要有微弱运动（呼吸/漂浮），静止的粒子看起来像灰尘
- 粒子形状混合：80% 圆形 + 15% 小十字 + 5% 菱形 = 高端感

## 六、场景类型的设计公式

### 标题场景 (Title)
- 布局：画面中心偏黄金比例点
- 文字：80-120px，字重 800-900，负字间距
- 入场：弹簧/弹性 + overshoot，持续 0.6-0.8 秒
- 氛围：2 个偏移辉光球 + 15-20 个微粒子 + 1 条装饰线
- 可选：文字下方一条短横线作为"签名"

### 陈述场景 (Statement)
- 布局：中央卡片 或 居中排版
- 文字：40-56px 主句 + 24-32px 补充说明
- 入场：文字逐行级联揭示，每行延迟 0.12 秒
- 氛围：卡片玻璃态效果 + 角标装饰 + 微弱背景辉光
- 强调：关键词用主题色或放大处理

### 数据场景 (Data)
- 布局：结构化网格，左侧标签 + 右侧视觉化
- 数字：48-72px 粗体，带计数动画
- 入场：从基线生长（柱状图）或从中心展开（环形图）
- 氛围：淡网格背景 + 数值标注 + 柱顶辉光
- 装饰：进度指示线，不要多余粒子

### 对比场景 (Comparison)
- 布局：60:40 分割，中心一条渐变分割线
- 双侧：对称入场，先左后右（延迟 0.2 秒）
- 颜色：两侧使用色温对比（暖色 vs 冷色）
- 氛围：分割线上下各一个小装饰元素

### 结尾场景 (Closing)
- 布局：绝对居中
- 元素汇聚：所有装饰元素向中心收拢
- 辉光增强：中心辉光半径增大、alpha 提高
- 粒子：15-20 个粒子从中心向外扩散
- 可选：一个环形光圈脉冲 2-3 次后稳定

## 七、绝对禁止的美学错误（违反会让作品看起来不专业）

❌ 使用纯黑背景 (#000000) — 用带色调的深色
❌ 文字不加任何阴影/辉光就直接显示 — 深色背景上白色文字需要环境光
❌ 所有元素使用相同的入场时间和缓动 — 级联延迟是基本素养
❌ 装饰元素多于内容元素 — 装饰服务内容
❌ 使用等间距的渐变色停 — 黄金比例分布
❌ 粒子全部相同大小 — 大小不一才有自然感
❌ 标题字号与正文差距小于 2 倍 — 层级不够
❌ 对称布局使用 50:50 分割 — 60:40 或 40:60
❌ 用纯白 (#ffffff) 做辉光颜色 — 用主题色低透明度版本
❌ 线条粗于 2px — 1-1.5px 是精致的分界线

## ⚠️ 绝对禁止事项（违反会导致编译错误）

代码作为函数体执行，以下变量已作为函数参数传入，**绝对不能重新声明**：

2D 模式的保留变量：ctx, t, width, height, utils
3D 模式的保留变量：THREE, scene, camera, width, height, utils

❌ 错误写法（会导致 "Identifier has already been declared"）：
\`\`\`
const utils = { lerp: ... };     // 错误！utils 已传入
let t = 0;                        // 错误！t 已传入
const ctx = canvas.getContext('2d'); // 错误！ctx 已传入
const width = 1280;               // 错误！width 已传入
\`\`\`

✅ 正确写法（直接使用，无需声明）：
\`\`\`
ctx.clearRect(0, 0, width, height);           // 直接用
const progress = utils.clamp(t / 2, 0, 1);    // 直接用 t 和 utils
const ease = utils.ease.outCubic(progress);    // 从 utils 取值赋给新变量是可以的
const centerX = width / 2;                     // 用 width 计算新变量是可以的
\`\`\`

## WebMotion 动画 API（两种模式）

### 模式一：2D Canvas 模式（默认）
代码接收参数：(ctx, t, width, height, utils) — 直接使用，不要重新声明
- ctx: Canvas 2D 渲染上下文
- t: 当前时间（秒，从 0 到 duration）
- width, height: 画布尺寸（1920x1080 或 1080x1920）
- utils: 工具函数集（见下方完整 API 文档）

### 模式二：3D Three.js 模式（设置 is3D: true）
代码接收参数：(THREE, scene, camera, width, height, utils) — 直接使用，不要重新声明
- THREE: Three.js 库（r128），支持 ShaderMaterial、BufferGeometry、Points 粒子系统
- scene: THREE.Scene 对象（已创建好，含默认环境光照）
- camera: THREE.PerspectiveCamera（默认在 z=5）
- width, height: 画布尺寸
- utils: 同上，额外包含 3D 辅助工具（createShader, createParticles, addBloom, createGradientTexture）
- 代码需要 return 一个 animate(t) 函数，每帧调用
- 后处理：调用 utils.addBloom(strength, radius, threshold) 启用辉光后处理

3D 模式示例（高级着色器 + 粒子 + 辉光）：
\`\`\`
// 自定义着色器材质
const mat = utils.createShader({
  uniforms: { uTime: {value:0}, uColor: {value:new THREE.Color(palette[0])} },
  vertexShader: 'varying vec2 vUv; uniform float uTime; void main(){ vUv=uv; vec3 p=position; p.y+=sin(uTime+p.x*3.0)*0.3; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }',
  fragmentShader: 'uniform vec3 uColor; varying vec2 vUv; void main(){ float g=1.0-length(vUv-0.5)*1.4; gl_FragColor=vec4(uColor*g,g); }'
});
const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 4), mat);
scene.add(mesh);
// 启用辉光后处理
utils.addBloom(0.8, 0.4, 0.2);
camera.position.z = 4;
return function(t) {
  mat.uniforms.uTime.value = t;
  mesh.rotation.y = t * 0.3;
};
\`\`\`

## 完整 utils API 文档

### 基础工具
- utils.lerp(a, b, t) — 线性插值
- utils.clamp(v, min, max) — 钳制
- utils.map(v, min1, max1, min2, max2) — 范围映射
- utils.deg2rad(deg), utils.rad2deg(rad) — 角度转换
- utils.dist(x1, y1, x2, y2) — 距离
- utils.random(min, max), utils.pick(arr) — 随机
- utils.interpolate(input, inputRange, outputRange, options) — 多段插值

### 缓动函数 (utils.ease)
linear, inCubic, outCubic, inOutCubic, outQuart, inOutQuart, inQuad, outQuad, inOutQuad, inSine, outSine, inOutSine, inCircle, outCircle, inOutCircle, inExpo, outExpo, inOutExpo, inBack, outBack, inOutBack, inElastic, outElastic, inOutElastic, bounce, inBounce, outBounce, inOutBounce, popIn (夸张弹性), bounceIn (柔和弹性)

### 物理动画
- utils.bezier(x1, y1, x2, y2) — CSS cubic-bezier 缓动
- utils.spring(frame, fps, config) — 弹簧物理动画，config: { damping, mass, stiffness, overshootClamping }
- utils.springPresets — gentle, wobbly, stiff, slow, molasses, bouncy

### 颜色工具 (utils.color)
- hexToRgb(hex), rgbToHex(r,g,b), rgba(hex, alpha) — 颜色转换
- lerp(c1, c2, t) — 颜色插值
- rgbaWithAlpha(color, alpha) — 任何颜色格式转 rgba（支持 hex 和 rgb 输入）
- hslToHex(h, s, l) — HSL 转 HEX

### 噪声函数（创造有机感的关键）
- utils.noise(x, y) — 2D Perlin 噪声，返回 0~1。用于烟雾扰动、有机形状、运动抖动
- utils.fbm(x, y, octaves, persistence, lacunarity) — 分形布朗运动，多倍频噪声叠加。用于云雾、地形、复杂纹理

### 贝塞尔路径运动
- utils.bezierPoint(t, p0, p1, p2, p3) — 三次贝塞尔曲线上的点，p 为 {x, y}
- utils.bezierTangent(t, p0, p1, p2, p3) — 贝塞尔曲线切线角度（弧度）
- utils.pathMotion(t, points) — 沿贝塞尔路径运动，返回 {x, y, angle}。points 为 4 个控制点数组

### 粒子系统（三件套配合使用）
- utils.createParticles(count, options) — 创建粒子数组。options: { minX, maxX, minY, maxY, minSpeed, maxSpeed, minSize, maxSize, minLife, maxLife, color, behavior }。behavior: 'float'|'rise'|'fall'|'explode'|'spiral'
- utils.updateParticles(particles, dt, options) — 每帧更新粒子。options: { gravity, wind, turbulence, behavior, respawn, bounds }
- utils.drawParticles(ctx, particles, options) — 绘制粒子。options: { blendMode:'lighter', fadeWithLife:true, glow:false }。默认使用加法混合产生发光效果

### 渐变工具
- utils.createLinearGradient(ctx, x0, y0, x1, y1, stops) — 快速创建线性渐变
- utils.createRadialGradient(ctx, x0, y0, r0, x1, y1, r1, stops) — 快速创建径向渐变
- utils.createGradient(ctx, gradient, x, y, w, h) — 统一渐变接口。gradient: { type:'linear'|'radial', stops:[{offset, color}], angle:度数 }

### 场景转场 (utils.sceneTransition)
- 支持: fade, slideLeft, slideRight, slideUp, slideDown, wipe, zoom, iris

### VisualFX 特效库 (utils.fx)
utils.fx 是一组预组合的高级特效函数，每个返回可注入动画代码的字符串。在动画代码中直接调用：

- utils.fx.backgroundAtmosphere(options) — 大气背景（渐变 + 光球 + 网格 + 粒子 + 暗角）。options: { orbs:[{x,y,radius,color,alpha}], grid:{visible,opacity,gap}, particles:{count,color,size,speed}, vignette:{opacity} }
- utils.fx.particles(options) — 粒子系统代码生成。options: { count, behavior, color, size, speed }
- utils.fx.glow(options) — 光晕效果
- utils.fx.textGlow(options) — 文字辉光（多强度）
- utils.fx.gradientText(options) — 渐变文字
- utils.fx.textReveal(options) — 文字揭示动画（leftToRight 等）
- utils.fx.kineticText(options) — 动态文字（wave, bounce, shake, breathe, slide, cascade）
- utils.fx.cornerAccents(options) — L 型角标装饰
- utils.fx.decorativeLine(options) — 装饰线
- utils.fx.accentDots(options) — 装饰圆点
- utils.fx.styledBar(options) — 样式化进度条
- utils.fx.animatedCounter(options) — 数字计数动画
- utils.fx.progressRing(options) — 环形进度
- utils.fx.lightRays(options) — 光线效果
- utils.fx.depthShadow(options) — 深度阴影
- utils.fx.glassEffect(options) — 玻璃态效果（渐变填充 + 高光 + 描边）
- utils.fx.scenePresets — 预设场景组合（heroTitle 等含背景渐变+光晕+粒子+暗角）

使用示例：const fxCode = utils.fx.backgroundAtmosphere({ particles: { count: 25, color: '#c9a96e' } }); eval(fxCode);

## 可编辑元素 API（重要！必须使用）

为了让生成的动画元素可在可视化编辑器中被选中、拖拽、编辑属性，请使用 utils.registerElement() 注册关键元素：

utils.registerElement(type, props) → 返回元素 handle
- type: 'text' | 'rect' | 'circle' | 'triangle' | 'polygon' | 'star' | 'line' | 'arrow' | 'image'
- props 基础: { id?, x, y, w, h, text?, color?, fontSize?, fontFamily?, fontWeight?, textAlign?, fillColor?, strokeColor?, strokeWidth?, borderRadius?, sides?, points?, innerRadius?, animIn?, animInDuration?, animInDelay?, animOut?, animOutDuration? }
- props 高级（创造视觉深度的关键）:
  - gradient: { type:'linear'|'radial', stops:[{offset:0, color:'#ff0000'}, {offset:1, color:'#00ff00'}], angle:45 } — 渐变填充替代纯色
  - filter: 'blur(5px)' 或 'blur(8px) brightness(1.2)' — 元素级滤镜
  - blendMode: 'lighter' | 'screen' | 'overlay' | 'multiply' — 混合模式
  - glowColor: '#c9a96e' — 自定义辉光颜色（覆盖角色默认色）
  - glowIntensity: 25 — 自定义辉光强度 0-50（覆盖角色默认 shadowBlur）
  - role: 'main' | 'support' | 'background' — 角色层级（影响默认辉光强度）
- handle.draw(ctx) 会自动处理 transform + 动画 + 渐变 + 滤镜 + 混合 + 绘制
- 先注册的元素在底层，后注册的元素在顶层

### 动画类型
animIn 可选值：fade, scale, grow, slideLeft, slideRight, slideUp, slideDown, bounce, **typewriter** (逐字显示), **blurFocus** (从模糊到清晰), **glitch** (故障入场), **elastic** (夸张弹性), **flip3d** (3D翻转)
animOut 可选值：fade, slideLeft, slideRight, slideUp, slideDown, scale, grow, bounce

### 关键规则：单一渲染路径
- 文字内容 → 只用 registerElement('text', {...}).draw(ctx)，不要再用 ctx.fillText
- 矩形/卡片 → 只用 registerElement('rect', {...}).draw(ctx)，不要再用 ctx.fillRect
- 装饰效果（粒子、渐变背景、光晕、路径）→ 可以直接用 ctx 绘制

### 完整示例（使用高级特性的专业 MG 动画）
\`\`\`
ctx.clearRect(0, 0, width, height);

// 1. 背景层：大气背景（渐变 + 漂浮粒子 + 暗角）
const bgCode = utils.fx.backgroundAtmosphere({
  orbs: [{ x: 30, y: 40, radius: 300, color: '#1a1a3e', alpha: 0.3 }],
  particles: { count: 25, color: palette[0], size: 2, speed: 0.2 },
  vignette: { opacity: 0.6 }
});
eval(bgCode);

// 2. 内容层：渐变填充 + 辉光的标题
const title = utils.registerElement('text', {
  id: 'title',
  x: width/2 - 400, y: height/2 - 50, w: 800, h: 100,
  text: '核心概念', fontSize: 80, fontWeight: '900',
  gradient: { type: 'linear', angle: 45, stops: [
    { offset: 0, color: palette[0] },
    { offset: 0.5, color: palette[2] },
    { offset: 1, color: palette[3] }
  ]},
  glowColor: palette[0], glowIntensity: 30,
  textAlign: 'center',
  animIn: 'blurFocus', animInDuration: 0.6, animInDelay: 0.2
});
title.draw(ctx);

// 3. 前景层：加法混合的发光粒子
const particles = utils.createParticles(20, {
  minX: width*0.2, maxX: width*0.8, minY: height*0.3, maxY: height*0.7,
  minSize: 1, maxSize: 3, color: palette[0], behavior: 'float'
});
utils.updateParticles(particles, 0.016, { turbulence: 15, bounds: { minX: 0, maxX: width, minY: 0, maxY: height } });
utils.drawParticles(ctx, particles, { blendMode: 'lighter', glow: true });
\`\`\`

### 长文本处理
当文案较长时，按逗号拆分为多行，每行注册为独立的 text 元素，使用级联延迟和不同动画类型创造层次感：
\`\`\`
const phrases = text.split(/[，,、]/).map(s => s.trim()).filter(s => s.length > 0);
const lineHeight = fontSize + 14;
const startY = height / 2 - (phrases.length * lineHeight) / 2;
const animTypes = ['slideRight', 'slideUp', 'blurFocus', 'fade'];
phrases.forEach((phrase, i) => {
  const lineEl = utils.registerElement('text', {
    id: 'line_' + i,
    x: textX, y: startY + i * lineHeight, w: textW, h: lineHeight,
    text: phrase, fontSize: fontSize,
    gradient: i === 0 ? { type: 'linear', angle: 90, stops: [
      { offset: 0, color: accentColor }, { offset: 1, color: '#ffffff' }
    ]} : null,
    color: '#ffffff',
    glowColor: i === 0 ? accentColor : null,
    glowIntensity: i === 0 ? 25 : 10,
    fontWeight: 'bold', textAlign: 'left',
    animIn: animTypes[i % animTypes.length],
    animInDuration: 0.4, animInDelay: 0.2 + i * 0.15,
    animOut: 'fade', animOutDuration: 0.5
  });
  lineEl.draw(ctx);
});
\`\`\`

### 元素属性说明
- 注册元素的 id 要稳定（不要用时间戳或随机数）
- 先注册的元素在底层，后注册的元素在顶层
- 附属效果（光标、下划线等）应使用主元素的 handle 坐标定位（title.x, title.y 等）
- 每个场景都应有背景层、内容层、前景层三层结构

---

# 🧩 视觉套件系统 — 根据内容选择合适的工具

WebMotion 内置了多个专业视觉套件，通过 utils 对象访问。**根据文案内容自动选择合适的套件组合**，不要所有场景都用同一种方式渲染。一套文案里的不同场景可以使用不同套件实现不同视觉效果。

## 套件选择指南（根据内容类型匹配）

### 数据/统计/对比 → D3.js (utils.d3)
**当内容涉及数字、百分比、对比、趋势时使用**
- utils.d3.scaleLinear() / scaleBand() / scaleOrdinal() — 比例尺（数据映射到像素）
- utils.d3.line() / utils.d3.area() — 折线图/面积图路径生成
- utils.d3.arc() — 饼图/环形图弧形路径
- utils.d3.pie() — 饼图数据布局
- utils.d3.tree() / utils.d3.cluster() — 树形/层级数据布局
- utils.d3.format() — 数字格式化（千分位、百分比等）

集成模式：D3 生成 SVG path 字符串，用 \`new Path2D(pathString)\` 转换后 \`ctx.fill(path2d)\` / \`ctx.stroke(path2d)\` 绘制到 Canvas

### 复杂动画序列/时间轴 → GSAP (utils.gsap)
**当需要精确控制多元素动画时序、交错入场时使用**
- utils.gsap.timeline() — 创建时间轴（但需要手动 seek 到当前 t）
- utils.gsap.utils.random() / wrap() / interpolate() / mapRange() — 动画数学工具
- utils.gsap.parseEase() — 解析 CSS 缓动字符串为函数
- utils.gsap.distribute() — 分布计算（交错延迟）

集成模式：WebMotion 是逐帧同步渲染（每帧调用一次渲染函数，t 为当前时间）。GSAP 的异步动画不适合直接运行。使用方式：
1. 用 gsap.utils 的数学函数替代手写计算
2. 用 gsap.parseEase() 获取缓动函数，然后 \`easing(progress)\` 同步调用
3. 预建 gsap.timeline()，每帧调用 \`timeline.seek(t)\` 读取状态值

### 生成艺术/有机形状/创意视觉 → p5.js (utils.p5)
**当需要创意编程效果、噪声艺术、流场、粒子矩阵时使用**
- new utils.p5() — 实例模式创建 p5 对象
- p5.noise() / p5.noiseDetail() — Perlin 噪声（与 utils.noise 类似但 p5 版本更丰富）
- p5.random() / p5.randomGaussian() — 随机数（含高斯分布）
- p5.Vector — 向量数学
- p5.beginShape() / vertex() / endShape() — 有机形状
- p5.curveVertex() / bezierVertex() — 曲线形状

集成模式：p5 可在实例模式中创建独立的离屏 canvas，渲染后用 \`ctx.drawImage(p5Canvas, 0, 0)\` 合成到主画布。或仅使用 p5 的数学函数（noise、Vector、random）辅助 Canvas 2D 绘制

### 交错动画/弹簧物理 → Anime.js (utils.anime)
**当需要多元素交错入场、弹簧动画时使用**
- utils.anime.stagger() — 交错延迟计算（均匀、从中心、网格交错）
- utils.anime.random() — 随机数
- utils.anime.PI / utils.anime.Easing — 缓动常量和函数集

集成模式：与 GSAP 类似，Anime.js 的异步动画不适合直接运行。主要使用 \`anime.stagger()\` 计算交错延迟，然后手动应用到 registerElement 的 animInDelay 参数

### 形状变形/形态转换 → Flubber (utils.flubber)
**当需要从一个形状平滑过渡到另一个形状时使用**
- utils.flubber.interpolate(fromPath, toPath) — 返回插值函数 f(t)，t=0 得到起始形状，t=1 得到目标形状
- utils.flubber.toCircle(path) / toRect(path) / toStar(path) — 从任意形状变形到标准形状
- utils.flubber.separate(fromPath, toPath) — 分离式变形（一个变多个）
- utils.flubber.combine(fromPath, toPath) — 合并式变形（多个变一个）

集成模式：SVG path 字符串 → flubber 插值 → 用 \`new Path2D(interpolatedPath)\` 转换 → \`ctx.fill(path2d)\` 绘制。适合 Logo 变形、图标变形、概念转换等场景

### AE 动画/微交互 → Lottie (utils.lottie)
**当需要播放 After Effects 导出的动画时使用**
- utils.lottie.loadAnimation({ container, renderer:'canvas', loop, autoplay, path/animationData }) — 加载 Lottie 动画
- animation.goToAndStop(frame, true) — 跳转到指定帧并停止（同步渲染）
- animation.getDuration() — 获取动画总时长

集成模式：Lottie 动画渲染到独立的 canvas 元素，每帧调用 \`goToAndStop(Math.floor(t * fps), true)\` 同步渲染，然后用 \`ctx.drawImage(lottieCanvas, x, y, w, h)\` 合成到主画布。需要 Lottie JSON 数据（可内联在代码中或通过 URL 加载）

### 3D 沉浸/着色器艺术 → Three.js (utils.THREE)
**当内容涉及立体概念、空间关系、需要 GPU 加速效果时使用**（设置 is3D: true）
- utils.THREE.ShaderMaterial — 自定义 GLSL 着色器
- utils.THREE.Points — GPU 粒子系统
- utils.createShader() / utils.createParticles() / utils.addBloom() — 3D 辅助工具
- 参考"着色器与 3D 效果规则"文件

## 默认排列组合（一套文案中的多场景策略）

当生成多场景动画时，**不同场景应使用不同套件组合**，让视频有丰富的视觉变化：

| 内容类型 | 推荐套件组合 | 效果 |
|---------|-------------|------|
| 数据展示（图表/对比） | D3.js 生成路径 + Canvas 渲染 + 粒子装饰 | 专业数据可视化 |
| 概念解释（抽象/流程） | Canvas 2D + GSAP 缓动 + VisualFX 玻璃态 | 清晰概念展示 |
| 创意展示（品牌/产品） | p5.js 生成艺术 + Canvas 合成 + Bloom 辉光 | 艺术级视觉 |
| 形状转换（Logo/图标） | Flubber 变形 + Canvas 渲染 + 渐变填充 | 流畅形态变化 |
| 立体概念（空间/结构） | Three.js 着色器 + Bloom + 环境光 | 沉浸式 3D |
| 微交互（图标动画） | Lottie AE 动画 + Canvas 合成 | 精致动效细节 |
| 文字动效（标题/标语） | Canvas 2D + GSAP 缓动 + VisualFX 动态文字 | 专业文字动画 |
| 混合场景（复杂叙事） | 多套件按需组合 | 丰富视觉层次 |

**重要规则**：一套文案中的场景不要全部用同一种方式渲染。如果文案有 5 个场景，至少使用 3 种不同的套件组合，让每个场景都有独特的视觉语言。

## 套件使用示例

### D3.js 数据可视化场景
\`\`\`
ctx.clearRect(0, 0, width, height);
// 背景
const bgGrad = ctx.createRadialGradient(width*0.3, height*0.4, 0, width*0.5, height*0.5, width*0.7);
bgGrad.addColorStop(0, 'rgba(26,26,62,0.3)'); bgGrad.addColorStop(1, 'rgba(0,0,0,0)');
ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, width, height);
// D3 比例尺
const data = [30, 65, 45, 80, 55];
const xScale = utils.d3.scaleBand().domain(data.map((d,i)=>i)).range([200, width-200]).padding(0.3);
const yScale = utils.d3.scaleLinear().domain([0, 100]).range([height-200, 200]);
// D3 柱状图路径
data.forEach((d, i) => {
  const bar = utils.registerElement('rect', {
    id: 'bar_' + i, x: xScale(i), y: yScale(d),
    w: xScale.bandwidth(), h: height - 200 - yScale(d),
    gradient: { type:'linear', angle:90, stops:[{offset:0,color:palette[0]},{offset:1,color:palette[2]}] },
    glowColor: palette[0], glowIntensity: 15,
    animIn: 'slideUp', animInDuration: 0.5, animInDelay: i * 0.1
  });
  bar.draw(ctx);
});
\`\`\`

### Flubber 形状变形场景
\`\`\`
ctx.clearRect(0, 0, width, height);
// 从圆形变形到星形
const circlePath = 'M 100,50 A 50,50 0 1,1 100,150 A 50,50 0 1,1 100,50 Z';
const starPath = 'M 100,20 L 120,80 L 180,80 L 130,115 L 150,175 L 100,140 L 50,175 L 70,115 L 20,80 L 80,80 Z';
const progress = utils.clamp(t / 2, 0, 1);
const morphedPath = utils.flubber.interpolate(circlePath, starPath)(progress);
// 绘制变形形状
const path2d = new Path2D(morphedPath);
ctx.save();
ctx.translate(width/2 - 100, height/2 - 100);
ctx.fillStyle = utils.createLinearGradient(ctx, 0, 0, 200, 200, [{offset:0,color:palette[0]},{offset:1,color:palette[3]}]);
ctx.shadowColor = 'rgba(201, 169, 110,0.5)'; ctx.shadowBlur = 30;
ctx.fill(path2d);
ctx.restore();
\`\`\`

### GSAP 缓动 + 交错入场
\`\`\`
ctx.clearRect(0, 0, width, height);
const ease = utils.gsap.parseEase('power3.out');
const items = ['概念一', '概念二', '概念三', '概念四'];
items.forEach((text, i) => {
  const delay = utils.gsap.utils.distribute({ base: 0.2, amount: 0.6, from: 'start' })(i, items.length);
  const progress = utils.clamp((t - delay) / 0.5, 0, 1);
  if (progress <= 0) return;
  const y = utils.lerp(height + 100, height/2 - 150 + i * 80, ease(progress));
  const el = utils.registerElement('text', {
    id: 'item_' + i, x: width/2 - 300, y: y, w: 600, h: 60,
    text: text, fontSize: 48, fontWeight: 'bold',
    gradient: { type:'linear', angle:0, stops:[{offset:0,color:palette[0]},{offset:1,color:palette[2]}] },
    glowColor: palette[0], glowIntensity: 20,
    textAlign: 'center', opacity: progress
  });
  el.draw(ctx);
});
\`\`\`

## 代码规则

1. 2D 模式：必须在开头调用 ctx.clearRect(0, 0, width, height) 清空画布
2. 背景必须透明（2D 模式不要用 fillRect 填充整个画布；3D 模式用 transparent: true 材质）
3. 动画要平滑专业，使用缓动函数（utils.ease.outCubic 等）
4. 文字要大而清晰，居中或合理布局，长文本要拆分为多行
5. 使用暗金奢华配色方案（推荐：${palette.join(', ')}）
6. 每个场景时长 2-5 秒
7. 动画要有入场和出场效果
8. 适当使用 3D 模式增强视觉效果（着色器、粒子、辉光后处理）
9. 关键视觉元素（文字、图形）必须用 utils.registerElement() 注册
10. 不要在代码中声明 ctx, t, width, height, utils, THREE, scene, camera（它们已作为参数传入）
11. **套件使用要求**：
    - 根据内容类型自动选择合适的视觉套件（D3/GSAP/p5/Anime/Flubber/Lottie/Three.js）
    - 一套文案中至少使用 3 种不同套件组合，不要所有场景都用同一种方式渲染
    - 通过 utils.d3 / utils.gsap / utils.p5 / utils.anime / utils.flubber / utils.lottie / utils.THREE 访问套件
    - 异步套件（GSAP/Anime）仅使用数学工具函数，不要直接运行动画
12. **视觉深度强制要求**：
    - 每个场景必须有**三层结构**：背景层（渐变+粒子+暗角）+ 内容层（registerElement）+ 前景层（装饰粒子/光线）
    - 标题字号 ≥ 64px，与正文字号比 ≥ 2.5:1
    - 至少使用一个辉光/阴影效果（禁止裸白色文字直接显示）
    - 文字和形状使用 gradient 渐变填充而非纯色（纯色是 PPT，渐变是视频）
    - 至少使用 3 色停渐变（禁止 2 色渐变）
    - 元素入场必须有级联延迟（禁止所有元素同时出现）
    - 粒子数量控制在 15-30 个（禁止 100+ 廉价粒子）
    - 装饰不超过 3 种类型
    - 线条粗细 ≤ 1.5px
    - 画面至少留 30% 负空间
    - 至少使用一种高级特性：gradient/filter/blendMode/glowColor/粒子系统/噪声扰动/路径运动

## 动画设计思维

不要套用固定模式。面对每段文字，先思考它的语义、情感和结构，再设计独一无二的动画：

- 文字的核心信息是什么？→ 决定视觉焦点
- 文字的情感基调是什么？→ 决定动画节奏和色彩
- 文字的结构有什么特点？（数字？对比？递进？）→ 决定动画的运动方式
- 什么样的视觉隐喻能增强理解？→ 这是创意的关键

每次设计都是新的。不要从"标题用弹跳入场"出发，要从"这段标题文字需要什么入场方式"出发。

## 输出格式

返回 JSON，不要包含 markdown 代码块标记：
{
  "summary": "对文案的分析总结",
  "scenes": [
    {
      "name": "场景名称（简短）",
      "description": "这个动画展示什么内容",
      "duration": 3,
      "is3D": false,
      "transition": "fade",
      "code": "完整的 JavaScript 动画代码"
    }
  ]
}

注意：每个场景的 code 是纯 JavaScript 代码，不要包含 \`\`\` 标记。is3D 为 true 时使用 Three.js 模式，为 false 或省略时使用 2D Canvas 模式。transition 可选值：none, fade, slideLeft, slideRight, slideUp, slideDown, wipe, zoom, iris（默认 fade）。`;
  }

  /**
   * 统一的 fetch + 超时封装（消除重复代码）
   */
  async function fetchWithTimeout(url, body, maxTokens) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: config.model,
          messages: body.messages,
          temperature: config.temperature,
          max_tokens: maxTokens
        }),
        signal: controller.signal
      });
      return response;
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('AI 请求超时（120 秒未响应）');
      throw new Error('AI 请求网络错误: ' + e.message);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  function buildUserPrompt(text, options = {}) {
    let prompt = `请为以下文案生成独一无二的 MG 动画（不得使用模板或预设路径，根据文案内容定制动画）：

【文案】
${text}

`;
    if (options.sceneCount) {
      prompt += `请生成 ${options.sceneCount} 个场景的动画。\n`;
    } else {
      prompt += `请提取文案中的关键重点，生成 3-5 个场景的动画。\n`;
    }
    if (options.style) {
      prompt += `动画风格：${options.style}\n`;
    }
    prompt += `
【设计要求 — 请严格遵守】
1. 每个场景都必须遵循美学法则（色彩和声、排版对比、构图负空间、动效编舞、装饰克制）
2. 标题场景使用 ≥64px 字号 + 辉光 + 级联入场
3. 数据场景使用大号数字 + 从基线生长动画 + 淡网格
4. 每个场景至少 3 种动态层次（主元素 + 装饰 + 氛围）
5. 使用黄金比例分布渐变色停（38%/62%）
6. 粒子数量控制在 15-30 个，大小 1-4px 混合
7. 每个场景都要有"呼吸感" — 元素间的延迟创造节奏

每个场景应该是一个独立的动画片段，可以叠加在视频上使用。重点是视觉化呈现关键信息，而不是逐字显示文案。`;
    return prompt;
  }

  /**
   * 调用 AI API 生成动画
   */
  async function generateAnimation(text, options = {}, onProgress) {
    if (!isConfigured()) throw new Error('请先配置 AI API');
    if (onProgress) onProgress('正在分析文案...');

    const messages = [
      { role: 'system', content: buildSystemPrompt() },
      { role: 'user', content: buildUserPrompt(text, options) }
    ];

    if (onProgress) onProgress('正在生成动画代码...');

    const response = await fetchWithTimeout(
      `${config.baseUrl}/chat/completions`,
      { messages },
      16000
    );

    if (!response.ok) {
      const err = await response.text().catch(() => '未知错误');
      throw new Error(`API 请求失败 (${response.status}): ${err.substring(0, 200)}`);
    }

    if (onProgress) onProgress('正在解析结果...');

    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error('AI 返回了非 JSON 格式的响应，请检查 API 地址是否正确');
    }
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('AI 返回数据格式异常，未包含有效内容');
    }
    const content = data.choices[0].message.content;
    if (!content || typeof content !== 'string') {
      throw new Error('AI 返回内容为空（可能触发了内容过滤器），请重试或调整文案');
    }
    const finishReason = data.choices[0].finish_reason;

    if (finishReason === 'length') {
      console.warn('AI 响应因 token 限制被截断，尝试修复...');
    }

    // 解析 JSON（处理可能的 markdown 代码块包裹，兼容大小写和 \r\n）
    const jsonStr = content.replace(/```json\r?\n?/gi, '').replace(/```\r?\n?/g, '').trim();
    let result;
    try {
      result = JSON.parse(jsonStr);
    } catch (e) {
      const match = jsonStr.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          result = JSON.parse(match[0]);
        } catch (e2) {
          if (onProgress) onProgress('正在修复截断的响应...');
          result = repairJSON(match[0]);
          if (!result) throw new Error('AI 返回格式错误，无法解析: ' + e2.message);
        }
      } else {
        throw new Error('AI 返回格式错误，无法解析');
      }
    }

    if (!result.scenes || !Array.isArray(result.scenes)) {
      throw new Error('AI 返回的场景数据为空');
    }

    // 过滤掉代码为空的场景（截断可能导致最后一个场景不完整）
    result.scenes = result.scenes.filter(s => s && s.code && typeof s.code === 'string' && s.code.trim());

    if (result.scenes.length === 0) {
      throw new Error('AI 生成的场景代码为空，可能因 token 限制被截断。请减少场景数或缩短文案。');
    }

    if (onProgress) onProgress('生成完成！');
    return result;
  }

  /**
   * 修复截断的 JSON（AI 响应因 token 限制被截断时使用）
   */
  function repairJSON(str) {
    // 策略1：逐个提取完整的场景对象
    const scenes = [];
    const sceneRegex = /\{[^{}]*"code"\s*:\s*"([\s\S]*?)"[^{}]*\}/g;
    let match;
    while ((match = sceneRegex.exec(str)) !== null) {
      try {
        const parsed = JSON.parse(match[0]);
        if (parsed.code) scenes.push(parsed);
      } catch (e) {}
    }

    // 策略2：修复整体 JSON
    if (scenes.length === 0) {
      let repaired = str;
      const openQuotes = (repaired.match(/"/g) || []).length;
      if (openQuotes % 2 !== 0) repaired += '"';
      let braces = 0, brackets = 0;
      for (const ch of repaired) {
        if (ch === '{') braces++;
        if (ch === '}') braces--;
        if (ch === '[') brackets++;
        if (ch === ']') brackets--;
      }
      repaired += ']'.repeat(Math.max(0, brackets));
      repaired += '}'.repeat(Math.max(0, braces));
      try {
        const result = JSON.parse(repaired);
        if (result.scenes) return result;
      } catch (e) {}
    }

    if (scenes.length > 0) {
      return { summary: '从截断的响应中恢复了 ' + scenes.length + ' 个场景', scenes };
    }
    return null;
  }

  /**
   * 单场景动画生成（用于编辑器内 AI 辅助）
   */
  async function generateSingleAnimation(description, options = {}) {
    if (!isConfigured()) throw new Error('请先配置 AI API');

    const singlePrompt = `你是一个 Canvas 2D 动画专家。根据描述生成一段动画代码。

代码规范：
- 接收参数：ctx, t, width, height, utils
- 使用 var 声明变量（不要用 let/const）
- 不要重新声明 ctx, t, width, height, utils
- 文字和形状必须用 utils.registerElement(type, props).draw(ctx) 绘制
- 不要用 ctx.fillText() 或 ctx.fillRect() 直接绘制
- 可用 utils 工具：lerp, clamp, interpolate, ease.*, spring, bezier, color.rgba, color.lerp
- 画布默认 1920×1080，安全区距边缘 120px
- 推荐配色方案（暗金奢华）：${getPalette().join(', ')}

生成一个 Canvas 2D 动画代码。
要求：${description}
时长：${options.duration || 3} 秒

只返回 JavaScript 代码，不要包含任何解释或 markdown 标记。`;

    const response = await fetchWithTimeout(
      `${config.baseUrl}/chat/completions`,
      { messages: [
        { role: 'system', content: singlePrompt },
        { role: 'user', content: description }
      ]},
      6000
    );

    if (!response.ok) {
      const err = await response.text().catch(() => '未知错误');
      throw new Error(`API 请求失败 (${response.status}): ${err.substring(0, 200)}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error('AI 返回了非 JSON 格式的响应，请检查 API 地址是否正确');
    }
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('AI 返回数据格式异常，未包含有效内容');
    }
    let code = data.choices[0].message.content;
    if (!code || typeof code !== 'string') {
      throw new Error('AI 返回内容为空，请重试');
    }
    code = code.replace(/```(?:javascript|js|json)?\r?\n?/gi, '').replace(/```\r?\n?/g, '').trim();
    return code;
  }

  /**
   * 对话式迭代编辑：基于当前场景代码 + 修改指令，AI 增量修改而非全量重写
   * @param {string} currentCode - 当前场景的动画代码
   * @param {string} instruction - 用户的修改指令（自然语言）
   * @param {object} options - { is3D, duration }
   * @returns {Promise<string>} 修改后的代码
   */
  async function iterateScene(currentCode, instruction, options = {}) {
    if (!isConfigured()) throw new Error('请先配置 AI API');

    const modeDesc = options.is3D
      ? '3D Three.js 模式（参数：THREE, scene, camera, width, height, utils，需 return animate(t) 函数）'
      : '2D Canvas 模式（参数：ctx, t, width, height, utils）';

    const iterPrompt = `你是一个 MG 动画代码专家。用户想对现有的动画代码做增量修改。

当前动画模式：${modeDesc}
场景时长：${options.duration || 3} 秒

规则：
1. 基于现有代码做最小改动，不要重写整个动画
2. 保留现有的 registerElement 调用和元素 id 不变（除非用户要求删除元素）
3. 不要重新声明 ctx, t, width, height, utils, THREE, scene, camera
4. 只返回修改后的完整 JavaScript 代码，不要包含任何解释或 markdown 标记
5. 文字和形状必须继续使用 utils.registerElement().draw(ctx) 绘制
6. 背景保持透明

现有代码：
${currentCode}

用户的修改要求：
${instruction}

请返回修改后的完整代码。`;

    const response = await fetchWithTimeout(
      `${config.baseUrl}/chat/completions`,
      { messages: [
        { role: 'system', content: '你是专业的 Canvas 2D / Three.js 动画工程师，擅长精确修改动画代码。' },
        { role: 'user', content: iterPrompt }
      ]},
      8000
    );

    if (!response.ok) {
      const err = await response.text().catch(() => '未知错误');
      throw new Error(`API 请求失败 (${response.status}): ${err.substring(0, 200)}`);
    }

    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error('AI 返回了非 JSON 格式的响应');
    }
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('AI 返回数据格式异常');
    }
    let newCode = data.choices[0].message.content;
    if (!newCode || typeof newCode !== 'string') {
      throw new Error('AI 返回内容为空，请重试');
    }
    newCode = newCode.replace(/```(?:javascript|js|json)?\r?\n?/gi, '').replace(/```\r?\n?/g, '').trim();
    return newCode;
  }

  return {
    loadConfig,
    getConfig,
    setConfig,
    isConfigured,
    getDesign,
    getPalette,
    generateAnimation,
    generateSingleAnimation,
    iterateScene,
  };
})();
