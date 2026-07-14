# 项目规范

## 技术栈

- 框架：Vite + React 18 + TypeScript
- 样式：Tailwind CSS + shadcn/ui
- 状态管理：Zustand
- 图标：Lucide React

## 文件结构

```
src/
├── engine/           # 核心引擎
│   ├── types.ts          # TypeScript 类型定义
│   ├── templates.ts      # 场景模板库
│   ├── defaultDevices.ts # 默认设备名称库
│   ├── templateParser.ts # 模板解析器（自然语言解析、参数填充）
│   └── ruleGenerator.ts  # 规则生成器（涂鸦规则转换、校验）
├── stores/           # 状态管理
│   └── useAppStore.ts    # 应用全局状态
├── components/       # UI 组件
│   ├── ui/               # shadcn/ui 基础组件
│   ├── template/         # 模板相关组件
│   ├── input/            # 输入相关组件
│   ├── output/           # 输出展示组件
│   └── layout/           # 布局组件
├── lib/              # 工具函数
├── App.tsx           # 主应用组件
├── main.tsx          # 应用入口
└── index.css         # 全局样式
```

## 命名规范

- 类型定义文件名：`types.ts`
- 状态管理文件名：`useXXXStore.ts`（使用 Zustand 的 `create` 函数）
- 组件文件名：`PascalCase.tsx`
- 函数/变量名：`camelCase`
- 常量名：`CONSTANT_CASE`

## 类型系统

### DeviceType

```typescript
type DeviceType = "light" | "switch" | "curtain" | "tv" | "ac" | "sensor" | "lock" | "speaker" | "camera" | "fan" | "heater" | "purifier" | "robot"
```

### ParamDef

```typescript
interface ParamDef {
  key: string
  label: string
  type: ParamType
  required: boolean
  defaultValue?: string | number | boolean
  deviceType?: DeviceType
  defaultName?: string
}
```

### SceneTemplate

```typescript
interface SceneTemplate {
  id: string
  name: string
  description: string
  keywords: string[]
  params: ParamDef[]
  triggers: Omit<Trigger, "id">[]
  conditions?: Omit<Condition, "id">[]
  actions: Omit<Action, "id">[]
}
```

### SceneRule

```typescript
interface SceneRule {
  id: string
  name: string
  description?: string
  triggers: Trigger[]
  conditions?: Condition[]
  actions: Action[]
  enabled: boolean
  createdAt: number
  updatedAt: number
  platform: string
}
```

## 状态管理规范

### useAppStore

必须包含以下状态字段：
- `mode: 'template' | 'natural'` - 当前模式，默认 `'template'`
- `platformStatus: 'disconnected' | 'connected'` - 平台连接状态
- `selectedTemplateId: string | null` - 选中的模板 ID
- `selectedTemplateParams: Record<string, string>` - 模板参数
- `generatedRule: object | null` - 生成的规则
- `templates: SceneTemplate[]` - 模板列表

必须包含以下方法：
- `setMode(mode)` - 设置模式
- `setPlatformStatus(status)` - 设置平台状态
- `setSelectedTemplateId(id)` - 设置选中模板
- `setSelectedTemplateParams(params)` - 设置所有参数
- `updateParam(key, value)` - 更新单个参数
- `generateRule()` - 生成规则（调用 fillTemplate 和 generateTuyaRule）

## 模板解析器规范

### templateParser.ts

- `parseNaturalLanguage(input: string): string | null` - 解析自然语言，返回匹配的 templateId
- `fillTemplate(templateId: string, params: Record<string, string>): SceneRule` - 填充模板参数，返回完整规则

## 规则生成器规范

### ruleGenerator.ts

- `generateTuyaRule(sceneRule: SceneRule): object` - 将内部规则转为涂鸦规则格式
- `validateRule(rule: object): { valid: boolean, errors: string[] }` - 校验规则完整性

## 代码风格

- 使用 TypeScript 严格模式
- 使用 `@/` 路径别名
- 组件使用函数式组件 + Hooks
- 状态管理使用 Zustand
- CSS 使用 Tailwind CSS + shadcn/ui
- 不使用默认导出，统一使用命名导出

## 运行命令

```bash
npm run dev       # 启动开发服务器
npm run build     # 构建生产版本
npm run lint      # 代码检查
npm run preview   # 预览生产版本
```
