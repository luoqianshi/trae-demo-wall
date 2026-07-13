# 工作流设计器 client-template 画布迁移计划

## 模块目标

将 `client-template` 中的画布编辑器能力迁移到当前 `client` 的工作流设计器中。迁移目标不是重新设计一个相似页面，而是以 `client-template` 为唯一视觉和交互基准，让当前项目的 `/flow` 页面在画布区域、节点呈现、控制条、侧栏组件库、节点拖拽、连线、便签节点、节点工具栏等方面与 `client-template` 保持一致。

## 当前决策

1. 当前 `client/src/features/flow` 中已有的简化版画布、演示节点、节点面板和属性面板仅作为临时实现保留参考，不作为最终形态。
2. 最终画布以 `client-template/src/pages/FlowPage/components/PageComponent/index.tsx` 为主实现来源。
3. 节点体系以 `client-template/src/pages/FlowPage/consts.ts` 注册结果为准：
   - `genericNode` 使用 `client-template/src/CustomNodes/GenericNode`
   - `noteNode` 使用 `client-template/src/CustomNodes/NoteNode`
   - `default` edge 使用 `client-template/src/CustomEdges/DefaultEdge`
4. “所有节点迁移”指迁移 `client-template` 组件库中由 `useTypesStore` 数据驱动展示和添加的全部组件节点，而不是只迁移当前项目里已有的“文本输入、数字输入、提示词模板、文本输出、图片输出、ComfyUI 节点”等少量演示节点。
5. 画布 UI 要与 `client-template` 一致，包含底部居中的紧凑控制条、顶部右侧 FlowToolbar、左侧组件侧栏、画布 Banner/Badge、节点工具栏、便签节点编辑体验、React Flow 背景与交互行为。

## 迁移范围

### 画布主体

来源文件：

- `client-template/src/pages/FlowPage/components/PageComponent/index.tsx`
- `client-template/src/pages/FlowPage/components/PageComponent/MemoizedComponents.tsx`
- `client-template/src/pages/FlowPage/components/PageComponent/components/CanvasBanner.tsx`
- `client-template/src/pages/FlowPage/components/PageComponent/utils/*`

迁移内容：

- React Flow 主画布布局
- 节点选择、拖拽、连线、复制、删除、组合、撤销/重做相关交互
- 画布空状态、Banner、版本预览提示
- 画布锁定态、选择态、快捷键行为
- React Flow 的 `nodeTypes`、`edgeTypes` 注册方式

### 节点体系

来源文件：

- `client-template/src/pages/FlowPage/consts.ts`
- `client-template/src/CustomNodes/GenericNode/index.tsx`
- `client-template/src/CustomNodes/GenericNode/components/**/*`
- `client-template/src/CustomNodes/GenericNode/hooks/**/*`
- `client-template/src/CustomNodes/GenericNode/helpers/**/*`
- `client-template/src/CustomNodes/GenericNode/utils/**/*`
- `client-template/src/CustomNodes/NoteNode/index.tsx`
- `client-template/src/CustomNodes/NoteNode/**/*`

迁移内容：

- `GenericNode` 完整节点外观
- 节点标题、图标、描述、状态、输入参数、输出端口、隐藏输出、旧版组件提示、更新提示
- `NoteNode` 便签节点
- 便签节点颜色、尺寸调整、内容编辑、工具栏
- 节点内部 Handle 渲染、端口 Tooltip、字段标题、参数排序、字段过滤
- 节点工具栏 `nodeToolbarComponent`

### 连线体系

来源文件：

- `client-template/src/CustomEdges/**/*`
- `client-template/src/utils/reactflowUtils.ts` 中与连线处理相关的方法

迁移内容：

- 默认连线样式
- 连线选中、连接、删除、验证逻辑
- 与节点输入输出类型联动的连线限制

### 画布控制条

来源文件：

- `client-template/src/components/core/canvasControlsComponent/CanvasControls.tsx`
- `client-template/src/components/core/canvasControlsComponent/CanvasControlButton.tsx`
- `client-template/src/components/core/canvasControlsComponent/CanvasControlsDropdown.tsx`
- `client-template/src/components/core/canvasControlsComponent/HelpDropdown.tsx`

迁移内容：

- 底部居中的 `react-flow__controls` 横向控制条
- 缩放、适应画布、帮助菜单、添加便签、检查面板开关
- 按钮尺寸、圆角、hover 状态、背景、间距与 `client-template` 保持一致

### 工具栏和侧栏

来源文件：

- `client-template/src/components/core/flowToolbarComponent/index.tsx`
- `client-template/src/components/core/flowToolbarComponent/components/**/*`
- `client-template/src/pages/FlowPage/components/flowSidebarComponent/index.tsx`
- `client-template/src/pages/FlowPage/components/flowSidebarComponent/components/**/*`
- `client-template/src/pages/FlowPage/components/flowSidebarComponent/helpers/**/*`

迁移内容：

- 顶部右侧 FlowToolbar
- API、导出、运行/Playground 相关入口按当前项目能力做适配
- 左侧组件库侧栏
- 搜索、分类、Bundle、MCP 分组、Legacy/Beta 过滤逻辑
- 从组件库拖拽或点击添加节点的行为

### 数据和状态

来源文件：

- `client-template/src/stores/flowStore.ts`
- `client-template/src/stores/typesStore.ts`
- `client-template/src/stores/flowsManagerStore.ts`
- `client-template/src/types/flow/index.ts`
- `client-template/src/types/api/index.ts`
- `client-template/src/utils/reactflowUtils.ts`
- `client-template/src/utils/styleUtils.ts`

迁移内容：

- `AllNodeType`、`NodeDataType`、`NoteDataType`、`APITemplateType` 等类型
- 当前 Flow 数据结构
- 组件模板数据结构
- 添加组件节点、从模板生成节点、组合节点、展开组节点、序列化/反序列化
- 节点分类、节点颜色、节点图标、节点 Bundle 数据

## 适配边界

`client-template` 与当前 `client` 的工程结构、store、API 层和 UI 基础组件并不完全一致。迁移时遵循以下边界：

1. 视觉和交互优先保持一致。
2. 对后端 API 强依赖的能力先接入当前项目已有接口；当前没有接口时，用兼容数据层兜底，但组件结构和交互入口保持一致。
3. 与登录、项目管理、远程模板、MCP、Playground 强相关的能力，先保留 UI 入口和状态结构，再按后续后端能力补齐。
4. 不再继续扩展当前简化版 `NodePanel`、`CustomNode`、`PropertyPanel`，避免两套画布体系并存。
5. 迁移过程保留当前 React Flow 内置 `input/output` 默认样式覆盖，直到所有节点类型完全切换为 `genericNode` / `noteNode` 后再评估是否移除。

## 实施步骤

### 阶段一：结构映射

状态：已完成

- 对比 `client-template` 和当前 `client` 的别名、UI 组件、store、路由、样式入口。
- 建立迁移映射表：源文件、目标文件、依赖、是否需要适配。
- 明确哪些文件直接迁移，哪些文件需要改写为当前项目风格。

### 阶段二：类型与基础工具迁移

状态：已完成

- 迁移 `types/flow`、`types/api` 中画布节点所需类型。
- 迁移 `reactflowUtils` 中生成节点、连接处理、分组节点、序列化所需方法。
- 迁移 `styleUtils` 中节点分类、颜色、图标、Bundle 定义。
- 补齐 `lodash`、`fuse.js`、`react-hotkeys-hook` 等依赖，或确认当前项目已安装。

### 阶段三：store 迁移与适配

状态：已完成

- 以 `client-template` 的 `flowStore` 和 `typesStore` 为基准重构当前 `useFlowStore`。
- 支持当前 Flow、节点列表、边列表、选中状态、锁定状态、组件模板数据。
- 建立默认组件模板数据，使侧栏可以展示 `client-template` 中的全部节点分类和节点项。
- 保留当前项目已有保存、导出、运行入口，并接入新的 Flow 数据结构。

### 阶段四：节点和连线迁移

状态：已完成

- 迁移 `GenericNode` 及其子组件、hooks、helpers、utils。
- 迁移 `NoteNode` 及其工具栏、颜色选择、尺寸调整逻辑。
- 迁移 `DefaultEdge`。
- 在当前 `/flow` 中注册 `nodeTypes = { genericNode, noteNode }`、`edgeTypes = { default }`。

### 阶段五：画布 PageComponent 迁移

状态：进行中，已补齐快捷键、基础连接校验、右键菜单、分组节点、节点内联参数编辑、点击连线、历史栈、多选分组和分组子节点联动

- 用 `client-template` 的 PageComponent 替换当前简化版 `FlowCanvas` 主体。
- 迁移 CanvasBanner、MemoizedComponents、画布快捷键和右键/节点操作逻辑。
- 接入当前项目路由布局，确保画布高度、宽度、滚动行为与模板一致。

### 阶段六：侧栏与控制条迁移

状态：已完成基础迁移，已补齐 Bundle/MCP 过滤入口，继续补齐高级菜单

- 用 `client-template` 的 `FlowSidebarComponent` 替换当前 `NodePanel`。
- 迁移搜索、分类、Bundle、过滤、添加节点逻辑。
- 用 `client-template` 的 `CanvasControls`、`CanvasControlsDropdown`、`CanvasControlButton`、`HelpDropdown` 替换当前画布控制条。
- 用 `client-template` 的 `FlowToolbar` 替换当前顶部工具栏或迁移到画布 Panel 中。

### 阶段七：样式对齐

状态：待开始

- 对齐 `client-template` 的 Tailwind class、CSS 变量、React Flow 样式覆盖。
- 保持控制条、节点、侧栏、画布背景、Badge、Tooltip、Dropdown 的尺寸和状态一致。
- 检查暗色模式和亮色模式显示。

### 阶段八：验证

状态：待开始

- `npm run build` 通过。
- `/flow` 页面无运行时错误。
- React Flow 容器有正常宽高。
- 侧栏能展示全部迁移节点。
- 点击或拖拽任意节点能在画布生成 `genericNode`。
- 添加便签能生成 `noteNode`，支持编辑、改色、缩放。
- 节点连接、删除、选择、复制、适应画布、缩放等交互正常。
- 与 `client-template` 同一功能点截图对比，视觉误差控制在可接受范围内；按钮尺寸、间距、圆角、布局位置应一致。

## 验收标准

1. 当前 `/flow` 的画布布局、控制条、侧栏、节点外观与 `client-template` 对齐。
2. `client-template` 中的节点类型全部迁移：`genericNode`、`noteNode`。
3. `client-template` 组件库中的节点分类和节点项全部迁移到当前侧栏中。
4. 当前简化演示节点不再作为主节点体系使用。
5. 画布可执行基础编辑：添加节点、添加便签、移动节点、连接节点、删除节点、缩放、适应画布。
6. 构建通过，无 TypeScript 错误。
7. 浏览器控制台无与迁移功能相关的阻断性错误。

## 风险与处理

| 风险 | 影响 | 处理方式 |
|------|------|----------|
| `client-template` 依赖的 store/API 较多 | 直接复制可能无法编译 | 先迁移类型和 store 适配层，再迁移组件 |
| 组件库节点由后端模板数据驱动 | 当前项目可能没有对应接口 | 先内置模板数据，后续再接后端 |
| 图标体系与当前项目不一致 | 节点图标或分类图标缺失 | 迁移 `genericIconComponent` 或建立兼容图标组件 |
| UI 组件实现差异 | className 或 props 不兼容 | 优先沿用当前 shadcn 组件，必要时迁移模板组件 |
| 一次性迁移范围大 | 容易产生大量类型错误 | 按阶段提交，每阶段 build 验证 |

## 当前状态

- 状态：继续对齐 client-template 深层交互，并已开始加入前端实测闭环。
- 进度：85%。
- 已完成：迁移 `genericNode` / `noteNode` 数据结构，建立组件分类与节点模板数据，替换当前演示节点体系；重构 `/flow` 为组件侧栏、React Flow 画布、右侧检查器布局；实现底部紧凑控制条、添加便签、锁定画布、保存、导出、清空；补齐画布缩放下拉、帮助菜单、快捷键、选中节点复制/删除、节点内联工具栏、基础连接类型校验；新增 `groupNode` 分组节点、画布/节点右键菜单、右键添加便签/分组、节点包装为分组/解组、分组属性编辑；左侧组件库补齐 Core/Bundle/MCP 过滤入口和节点来源徽标；节点高度已调整为更舒展的紧凑卡片，节点内部支持直接编辑文本、数字、长文本和下拉选择参数；连接点样式和命中范围已优化，节点可通过端口点击连接并生成连线；新增画布历史栈，支持工具栏撤销/重做和 `Ctrl+Z` / `Ctrl+Y` / `Ctrl+Shift+Z`；支持框选多节点后通过 `Ctrl+G` 或顶部浮层按钮创建分组；新增开发态前端测试桥接，用于在浏览器中直接验证节点、连线、分组、撤销/重做等交互；已实现分组与子节点联动，拖动分组会同步移动组内节点，删除普通节点会清理分组引用，复制分组会生成空白副本以避免误绑定原始子节点；`npm run build` 已通过。
- 前端实测：已启动前端和后端服务，并在 `/flow` 中验证节点生成、节点连线、分组创建、拖动分组联动子节点、撤销/重做恢复分组移动状态；浏览器控制台仍有非阻断的主题工具错误、React Flow 初始容器宽高警告和 HMR/测试过程提示，后续继续收敛。
- 下一步：继续补齐 `client-template` 的高级节点内部子组件、远程组件模板接入、更完整的类型化连接校验、节点运行态/Playground 面板，并继续做真实浏览器交互对照测试。