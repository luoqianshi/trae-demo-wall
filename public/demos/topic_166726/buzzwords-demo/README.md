# 说人话 — 互联网黑话解谜游戏

一款将互联网黑话（赋能、闭环、对齐等）变成多步推理谜题的 H5 创意游戏。玩家通过数字逻辑、符号方程、文字密码、图形变换、谐音拆字、序列推理 6 种玩法逐关拆解黑话词语，通关后获得知识卡了解词语的真实含义和滥用场景。

## 快速启动

### 方式一：直接打开（推荐）

双击 `buzzwords-demo.html`，浏览器即可直接运行，无需启动服务器。

### 方式二：本地服务器（可选）

```bash
python3 -m http.server 8765
```

然后浏览器访问 `http://localhost:8765/buzzwords-demo.html`

## 文件结构

```
buzzwords-demo/
├── buzzwords-demo.html         # 主页面（选关 / 游戏 / 工具箱 / 知识卡 / 通关画面）
├── css/
│   └── style.css               # 全部样式（深色主题 #0f0f11 + 金色强调 #d4a574）
├── js/
│   ├── puzzles-data.js         # 谜题数据（3道题 × 4关的完整推理链定义）
│   ├── dictionary-data.js      # 词典数据（12个黑话词条 + 翻译映射表 + 示例文本）
│   ├── game.js                 # 游戏引擎（状态管理 / 关卡渲染 / 交互处理 / 知识卡）
│   └── tools.js               # 工具箱引擎（词典搜索 / 黑话翻译 / 人话染黑）
└── README.md                   # 本文件
```

## 代码架构与文件关系

### 整体架构

项目是纯原生 HTML/CSS/JS，无框架依赖，无构建步骤，无后端。所有逻辑在前端运行。

```
buzzwords-demo.html
  │
  ├── <link> css/style.css        （样式）
  │
  └── <script> 按顺序加载 4 个 JS 文件：
        │
        ├── 1. js/puzzles-data.js    （数据层：谜题定义）
        ├── 2. js/dictionary-data.js （数据层：词典 + 翻译映射）
        ├── 3. js/game.js            （逻辑层：游戏引擎）
        └── 4. js/tools.js           （逻辑层：工具箱引擎）
```

**加载顺序很重要**：数据文件必须先于逻辑文件加载，因为 `game.js` 和 `tools.js` 直接引用 `puzzles-data.js` 和 `dictionary-data.js` 中定义的全局常量。

### 各文件职责

#### `buzzwords-demo.html` — 页面骨架

定义了 3 个屏幕（screen），通过 CSS `.active` 类切换显示：

| 屏幕 | ID | 说明 |
|------|----|------|
| 选关页面 | `selectScreen` | 展示 3 道谜题卡片 + 工具箱入口 |
| 游戏页面 | `gameScreen` | 进度条 + 谜题操作区 + 输入区 + 反馈区 |
| 工具箱页面 | `toolboxScreen` | 3 个 Tab 面板：词典 / 洗白 / 染黑 |

另有 3 个全屏弹层：
- `demoOverlay`：解题演示弹窗（仅比赛评审展示解题设计，正式游戏中不会出现）
- `knowledgeOverlay`：知识卡（翻转卡片，正面词语+浓度，背面例句+滥用场景）
- `completeOverlay`：通关画面（区分 ★完美通关 / ✓通关）

#### `css/style.css` — 全部样式

深色主题（背景 `#0f0f11`，金色强调 `#d4a574`）。包含：
- 屏幕切换（`.screen` / `.screen.active`）
- 谜题卡片布局（选关页 + 关卡内数字方块/符号等）
- 知识卡 3D 翻转动画（`transform: rotateY(180deg)` + `backface-visibility`）
- 工具箱 Tab 切换 + 词典卡片 + 翻译高亮样式
- 响应式布局（移动端适配 `@media max-width: 768px`）
- 无障碍：颜色仅作辅助，形状/文字/符号可独立推理

#### `js/puzzles-data.js` — 谜题数据层

定义全局常量 `PUZZLES`（数组），包含 3 道完整谜题：

```
PUZZLES: Array<Puzzle>
  ├── id: string              // 谜题标识
  ├── word: string            // 目标黑话词语（赋能/闭环/对齐）
  ├── category: string        // 分类
  ├── toxicity: number        // 浓度评级 1-5
  ├── knowledgeCard: Object   // 知识卡数据（例句 + 滥用场景）
  └── levels: Array<Level>    // 4 个关卡
        ├── type: string              // 玩法类型标识
        ├── typeName: string          // 玩法中文名
        ├── title: string             // 关卡标题
        ├── answer: string            // 中间答案
        ├── answerDisplay: string     // 展示形式
        ├── hint: string              // 提示文字
        └── steps: Array<Step>        // 推理步骤（每关 2-4 步）
              ├── prompt: string           // 步骤提示
              ├── content?: string         // 展示内容标识（如 'sequence-odd'）
              ├── inputType: string       // 'number' | 'text' | 'choice'
              ├── accept: string[]        // 接受的答案
              ├── feedback: string        // 答对反馈
              └── choices?: Array<Object>  // 选择题选项
```

6 种玩法类型：`number-logic`（数字逻辑推理）、`symbol-equation`（符号方程）、`graphic-transform`（图形变换链）、`character-cipher`（文字密码链）、`homophone-maze`（谐音拆字迷宫）、`sequence-reasoning`（序列推理）、`multi-narrow`（多维度缩窄，关 4 专用）。

#### `js/dictionary-data.js` — 词典与翻译数据层

定义 4 个全局常量：

| 常量 | 类型 | 用途 |
|------|------|------|
| `DICTIONARY` | Array | 12 个黑话词条完整数据（词语/分类/释义/例句/滥用场景/同义词等） |
| `WASH_MAPPINGS` | Array | 洗白翻译映射表（黑话 → 人话，正则匹配） |
| `DARKEN_MAPPINGS` | Array | 染黑翻译映射表（日常短语 → 黑话，正则匹配） |
| `WASH_EXAMPLE` / `DARKEN_EXAMPLE` | String | 示例文本 |

#### `js/game.js` — 游戏引擎（逻辑层）

核心全局状态：

```js
const gameState = {
  currentPuzzleIndex,   // 当前谜题索引
  currentLevelIndex,    // 当前关卡索引（0-3）
  currentStepIndex,     // 当前步骤索引
  hintUsed,             // 是否已使用提示
  puzzleStatus: {},     // 通关记录 { puzzleId: 'cleared' | 'perfect' }
  intermediateAnswers: []  // 当前谜题已解出的中间答案
}
```

核心函数调用链路：

```
renderSelectScreen()          选关页面渲染（读取 PUZZLES 生成卡片）
  └─ startPuzzle(index)        玩家点击"开始挑战"
       └─ renderLevel()        渲染当前关卡
            └─ renderStep()    渲染当前步骤
                 ├─ renderContent(contentType)  渲染谜题可视化内容（6种类型的 switch）
                 └─ renderInput(step)          渲染输入区（文本/数字/选择题）
                      └─ checkAnswer() / checkChoiceAnswer()  验证答案
                           └─ handleCorrectAnswer()  答对处理
                                ├─ 下一步骤 → renderStep()
                                └─ 关卡完成 → completeLevel()
                                     ├─ 记录中间答案到 intermediateAnswers
                                     ├─ 显示答案揭示
                                     └─ 延迟进入下一关 → renderLevel()
                                          └─ 4 关全部完成 → completePuzzle()
                                               ├─ 记录通关状态到 puzzleStatus
                                               └─ showKnowledgeCard(puzzle)
                                                    └─ flipKnowledgeCard()  翻转
                                                         └─ closeKnowledgeCard()
                                                              ├─ completeOverlay 通关画面
                                                              └─ backToSelect() 或 nextPuzzle()
```

其他函数：
- `updateProgress()`：更新顶部进度条（显示已完成关的中间答案）
- `useHint()`：提示系统（每题 1 次，使用后标记为"通关"而非"完美通关"）
- `backToSelect()`：返回选关
- `enterToolbox()`：进入工具箱
- `init()`：初始化（DOM 加载后调用，绑定事件 + 渲染选关页 + 初始化工具箱）

#### `js/tools.js` — 工具箱引擎（逻辑层）

独立于解谜主线，管理 3 个支线功能：

```
initTools()                  初始化（绑定 Tab/搜索/分类/翻译事件）
  ├─ switchToolTab(tabName)  Tab 切换（dictionary / wash / darken）
  │
  ├─ 词典面板
  │    ├─ onDictSearch()       实时搜索（匹配词语/释义/分类/同义词）
  │    ├─ onDictCategoryFilter()  分类筛选
  │    └─ renderDictionary()   渲染词条卡片（读取 DICTIONARY，标记已解锁状态）
  │
  ├─ 洗白面板（黑话→人话）
  │    ├─ doWash()             执行翻译（遍历 WASH_MAPPINGS 正则匹配+替换+高亮）
  │    ├─ fillWashExample()    填入 WASH_EXAMPLE 示例
  │    └─ clearWash()          清空
  │
  └─ 染黑面板（人话→黑话）
       ├─ doDarken()           执行染黑（遍历 DARKEN_MAPPINGS 正则匹配+替换+高亮）
       ├─ fillDarkenExample()  填入 DARKEN_EXAMPLE 示例
       ├─ clearDarken()        清空
       └─ copyDarkenResult()   复制到剪贴板（含降级方案）
```

工具箱与解谜的联动：`renderDictionary()` 读取 `gameState.puzzleStatus` 判断词条是否已解锁，已通关的词语标记"已解锁"徽章。

### 数据流关系图

```
puzzles-data.js                dictionary-data.js
  PUZZLES                         DICTIONARY
     │                            WASH_MAPPINGS
     │                            DARKEN_MAPPINGS
     │                                │
     ▼                                ▼
  game.js                         tools.js
  (读取 PUZZLES)                  (读取 DICTIONARY / WASH / DARKEN)
     │                                │
     │  gameState.puzzleStatus        │
     │────────────────────────────────┘
     │  (tools.js 读取 gameState 判断词条解锁状态)
     ▼
  buzzwords-demo.html (DOM 渲染)
```

## 技术栈

- 纯原生 HTML5 / CSS3 / JavaScript（ES5+）
- 无框架、无构建工具、无 npm 依赖
- 无后端、无数据库、无 API 调用
- 代码注释使用 JSDoc 格式

## 浏览器兼容性

支持现代浏览器（Chrome / Safari / Firefox / Edge 最新版）。移动端响应式适配。双击 `buzzwords-demo.html` 即可直接运行，也可通过本地服务器访问。

## Demo 内容说明

- 3 道完整谜题：赋能（管理类）、闭环（流程类）、对齐（沟通类）
- 每道 4 关，6 种玩法各使用 2 次
- 通关状态仅保存在内存中，刷新页面后重置
- 第 2、3 道谜题需前一道通关后解锁
- 工具箱词典含 12 个黑话词条，翻译/染黑覆盖高频场景
