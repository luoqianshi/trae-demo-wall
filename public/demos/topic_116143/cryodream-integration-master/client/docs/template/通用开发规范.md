# 通用开发规范

> 基于现有模板系统的标准化开发规范，用于指导新功能和组件的开发
> 
> ⚠️ **重要说明**：本项目有自己的布局系统（主题配置、导航等），通用开发规范提供的是**开发模板和最佳实践**，允许根据实际需求灵活调整。
# 必须参考 八、参考示例（必看）选择合适的布局或组件
---

## 📁 一、文件结构规范

### 1.1 目录结构

```
src/
├── routes/
│   └── _authenticated/
│       └── <module-name>/
│           ├── index.tsx                      # 模块主页
│           ├── <feature-name>.tsx             # 功能路由
│           └── layout/
│               ├── index.tsx                  # 布局列表
│               ├── <layout-name>-layout.tsx   # 具体布局
│               └── ...
│
├── features/
│   └── <module-name>/
│       ├── index.ts                           # 导出文件
│       ├── <feature-name>.tsx                 # 功能组件
│       └── layout/
│           ├── <layout-name>-layout.tsx       # 布局组件
│           └── ...
│
└── components/
    └── layout/
        └── data/
            └── sidebar-data.ts                # 侧边栏配置
```

### 1.2 命名规范

| 类型 | 命名格式 | 示例 |
|------|---------|------|
| 路由文件 | `kebab-case` | `top-nav-layout.tsx` |
| 组件文件 | `kebab-case` | `user-search.tsx` |
| 组件函数名 | `PascalCase` | `UserSearch`, `TopNavLayout` |
| 路由路径 | `kebab-case` | `/templates/layout/top-nav-layout` |
| 国际化键 | `camelCase` | `topNavLayout`, `userSearchExample` |

---

## 🎯 二、开发流程

### 2.1 创建新模块/功能

#### 步骤 1：创建组件文件

```tsx
// features/<module-name>/<feature-name>.tsx
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'

export default function FeatureName() {
  const { t } = useTranslation()

  return (
    <>
      <Header fixed>
        {/* Header 内容 */}
      </Header>

      <Main fixed>
        <div className='flex items-center gap-2'>
          <h1 className='text-2xl font-bold tracking-tight'>
            {t('templates.featureName')}
          </h1>
          <Badge variant='secondary'>Feature</Badge>
        </div>
        <p className='text-muted-foreground'>
          {t('templates.featureNameDesc')}
        </p>
        
        {/* 内容区域 */}
      </Main>
    </>
  )
}
```

#### 步骤 2：创建路由文件

```tsx
// routes/_authenticated/<module-name>/<feature-name>.tsx
import { createFileRoute } from '@tanstack/react-router'
import FeatureName from '../../../../features/<module-name>/<feature-name>'

export const Route = createFileRoute('/_authenticated/<module-name>/<feature-name>')({
  component: FeatureNameRoute,
})

function FeatureNameRoute() {
  return <FeatureName />
}
```

#### 步骤 3：添加国际化

**zh.json**
```json
{
  "templates": {
    "featureName": "功能名称",
    "featureNameDesc": "功能描述"
  }
}
```

**en.json**
```json
{
  "templates": {
    "featureName": "Feature Name",
    "featureNameDesc": "Feature description"
  }
}
```

#### 步骤 4：配置侧边栏

```typescript
// components/layout/data/sidebar-data.ts
{
  title: 'common.moduleName',
  icon: SomeIcon,
  items: [
    {
      title: 'templates.featureName',
      url: '/<module-name>/<feature-name>',
      icon: SomeIcon,
    },
  ],
}
```

---

## 🎨 三、布局规范

### 3.0 布局系统说明

⚠️ **重要**：本项目有自己的布局系统，包括：
- 主题配置（明/暗主题切换）
- 导航系统（侧边栏、顶部导航）
- 用户菜单和配置抽屉

**通用开发规范提供的是开发模板**，允许根据实际需求灵活调整：
- ✅ **Header 内容可以灵活配置**：仪表盘等页面可以不加按钮组，只使用 Search + 主题切换 + 用户菜单
- ✅ **标题区域可以简化**：某些页面可以只有标题，不需要操作按钮
- ✅ **布局模板可以定制**：根据业务需求调整布局结构

### 3.1 标准页面结构

```tsx
<Header fixed>
  <Search />
  <div className='ms-auto flex items-center space-x-4'>
    <ThemeSwitch />
    <ConfigDrawer />
    <ProfileDropdown />
  </div>
</Header>

<Main fixed>
  {/* 标题区域 */}
  <div className='flex items-center justify-between gap-2'>
    <div>
      <div className='flex items-center gap-2'>
        <h1 className='text-2xl font-bold tracking-tight'>
          {t('templates.pageTitle')}
        </h1>
        <Badge variant='secondary'>Layout</Badge>
      </div>
      <p className='text-muted-foreground'>
        {t('templates.pageDescription')}
      </p>
    </div>
    
    {/* 右侧操作按钮 */}
    <div className='flex gap-2'>
      <Button variant='outline' className='space-x-1'>
        <span>导入</span>
        <Download size={18} />
      </Button>
      <Button className='space-x-1'>
        <span>创建</span>
        <Plus size={18} />
      </Button>
    </div>
  </div>

  <Separator className='my-4 shadow-sm' />

  {/* 内容区域 */}
  <div className='faded-bottom no-scrollbar grid gap-4 overflow-auto pb-16'>
    {/* 内容组件 */}
  </div>
</Main>
```

### 3.2 关键样式规范

| 元素 | Class | 说明 |
|------|-------|------|
| 页面标题 | `text-2xl font-bold tracking-tight` | 标准标题样式 |
| 副标题 | `text-muted-foreground` | 灰色描述文字 |
| Badge | `variant='secondary'` | 次要标签 |
| 按钮组 | `flex gap-2` | 按钮间距 |
| 按钮内图标 | `size={18}` | 图标大小 |
| 按钮文字间距 | `space-x-1` | 文字和图标间距 |
| 分隔线 | `my-4 shadow-sm` | 间距 + 阴影 |
| 内容区域 | `faded-bottom no-scrollbar overflow-auto pb-16` | 渐变 + 隐藏滚动条 |
| 网格布局 | `grid gap-4` | 标准网格间距 |

### 3.3 布局灵活性说明

⚠️ **标准页面结构是参考模板，不是强制要求**。根据实际业务需求可以调整：

#### ✅ 允许的调整

**1. Header 内容调整**
```tsx
// ✅ 标准 Header
<Header fixed>
  <Search />
  <div className='ms-auto flex items-center space-x-4'>
    <ThemeSwitch />
    <ConfigDrawer />
    <ProfileDropdown />
  </div>
</Header>
```

**2. 标签页布局（推荐）**
```tsx
<Main fixed>
  {/* 标题区域 */}
  <div className='flex items-center justify-between gap-2'>
    <div>
      <h1>标题</h1>
      <p className='text-muted-foreground'>描述</p>
    </div>
  </div>

  <Separator className='my-4 shadow-sm' />

  {/* 标签页布局 - Tabs 固定，内容滚动 */}
  <div className='faded-bottom no-scrollbar overflow-auto pb-16'>
    <Tabs defaultValue='overview' className='flex h-full flex-col'>
      {/* Tabs 列表 - 固定在顶部 */}
      <div className='sticky top-0 z-10 bg-background/95 backdrop-blur'>
        <TabsList>
          <TabsTrigger value='tab1'>标签 1</TabsTrigger>
          <TabsTrigger value='tab2'>标签 2</TabsTrigger>
        </TabsList>
        <Separator />
      </div>
      
      {/* Tabs 内容区域 - 可滚动 */}
      <div className='flex-1 overflow-auto'>
        <div className='grid gap-4 pt-4'>
          <TabsContent value='tab1'>内容 1</TabsContent>
          <TabsContent value='tab2'>内容 2</TabsContent>
        </div>
      </div>
    </Tabs>
  </div>
</Main>
```

**3. 标题区域调整**
```tsx
// ✅ 简化版 - 只有标题和描述（如仪表盘）
<div className='flex items-center justify-between gap-2'>
  <div>
    <div className='flex items-center gap-2'>
      <h1 className='text-2xl font-bold tracking-tight'>
        {t('common.dashboard')}
      </h1>
      <Badge variant='secondary'>Dashboard</Badge>
    </div>
    <p className='text-muted-foreground'>
      {t('common.dashboardDescription')}
    </p>
  </div>
  {/* 可以没有右侧按钮组 */}
</div>

// ✅ 完整版 - 带操作按钮（如列表页）
<div className='flex items-center justify-between gap-2'>
  <div>
    <div className='flex items-center gap-2'>
      <h1>标题</h1>
      <Badge>列表</Badge>
    </div>
    <p className='text-muted-foreground'>描述</p>
  </div>
  <div className='flex gap-2'>
    <Button variant='outline'>导入</Button>
    <Button>创建</Button>
  </div>
</div>
```

**3. 内容区域调整**
```tsx
// ✅ 标签页布局（推荐）- Tabs 固定，内容滚动
<div className='faded-bottom no-scrollbar overflow-auto pb-16'>
  <Tabs defaultValue='overview' className='flex h-full flex-col'>
    <div className='sticky top-0 z-10 bg-background/95 backdrop-blur'>
      <TabsList>...</TabsList>
      <Separator />
    </div>
    <div className='flex-1 overflow-auto'>
      <div className='grid gap-4 pt-4'>
        <TabsContent>...</TabsContent>
      </div>
    </div>
  </Tabs>
</div>

// ✅ 简单内容页面
<div className='faded-bottom no-scrollbar overflow-auto pb-16'>
  <Card>...</Card>
</div>
```

#### ❌ 不建议修改的部分

- `Header` 和 `Main` 组件的 `fixed` 属性（保持固定布局）
- 标题样式 `text-2xl font-bold tracking-tight`（保持视觉一致性）
- Badge 的使用（增强可读性）
- 内容区域的滚动处理（`overflow-auto pb-16`）

---

## 🧩 四、组件使用规范

### 4.1 必须使用的组件

| 组件 | 用途 | 导入路径 |
|------|------|---------|
| `Header` | 页面头部容器 | `@/components/layout/header` |
| `Main` | 页面主内容区 | `@/components/layout/main` |
| `Badge` | 标签/徽章 | `@/components/ui/badge` |
| `Separator` | 分隔线 | `@/components/ui/separator` |
| `Button` | 按钮 | `@/components/ui/button` |

### 4.2 可选组件

| 组件 | 用途 | 导入路径 |
|------|------|---------|
| `Search` | 搜索框 | `@/components/search` |
| `ThemeSwitch` | 主题切换 | `@/components/theme-switch` |
| `ConfigDrawer` | 配置抽屉 | `@/components/config-drawer` |
| `ProfileDropdown` | 用户菜单 | `@/components/profile-dropdown` |
| `Tabs` | 标签页 | `@/components/ui/tabs` |
| `Card` | 卡片容器 | `@/components/ui/card` |

### 4.3 图标使用

```tsx
import { Download, Plus, Search } from 'lucide-react'

// 在按钮中使用
<Button>
  <Plus size={18} />
</Button>

// 独立图标
<Search size={20} />
```

---

## 🌐 五、国际化规范

### 5.1 命名空间

| 命名空间 | 用途 | 示例 |
|---------|------|------|
| `common.*` | 通用词汇 | `common.create`, `common.save` |
| `templates.*` | 模板相关 | `templates.topNavLayout` |
| `components.*` | 组件特定 | `components.userSearch` |

### 5.2 翻译键命名

```typescript
// 功能名称
templates.featureName          // 中文：功能名称
templates.featureNameDesc      // 中文：功能描述

// 组件示例
components.componentName       // 中文：组件名称
components.componentNameDesc   // 中文：组件描述
```

### 5.3 使用示例

```tsx
import { useTranslation } from 'react-i18next'

export default function Component() {
  const { t } = useTranslation()

  return (
    <div>
      <h1>{t('templates.featureName')}</h1>
      <p>{t('templates.featureNameDesc')}</p>
      <Button>{t('common.create')}</Button>
    </div>
  )
}
```

---

## 📝 六、代码规范

### 6.1 导入顺序

```tsx
// 1. React 和相关 hooks
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// 2. 路由
import { useNavigate } from '@tanstack/react-router'

// 3. Lucide 图标
import { Download, Plus } from 'lucide-react'

// 4. shadcn/ui 组件
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// 5. 布局组件
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'

// 6. 通用组件
import { Search } from '@/components/search'
```

### 6.2 组件结构

```tsx
// 默认导出
export default function ComponentName() {
  const { t } = useTranslation()

  // 1. Hooks
  const navigate = useNavigate()
  const [state, setState] = useState()

  // 2. 事件处理函数
  const handleClick = () => {
    // logic
  }

  // 3. 渲染
  return (
    <>
      {/* 内容 */}
    </>
  )
}
```

### 6.3 注释规范

```tsx
// ===== 区域分隔 =====
{/* ===== Top Heading ===== */}
<Header fixed>
  {/* 头部内容 */}
</Header>

{/* ===== Main Content ===== */}
<Main fixed>
  {/* 内容区域 */}
</Main>
```

---

## 🔧 七、检查清单

### 7.1 开发完成检查

- [ ] 组件文件已创建（`features/`）
- [ ] 路由文件已创建（`routes/`）
- [ ] 国际化已添加（`zh.json` + `en.json`）
- [ ] 侧边栏配置已更新
- [ ] Badge 标签已添加
- [ ] 标题和描述使用国际化
- [ ] 布局符合规范（Header + Main）
- [ ] 内容区域使用 `faded-bottom no-scrollbar overflow-auto`
- [ ] 按钮图标大小为 `size={18}`
- [ ] 代码通过 TypeScript 检查

### 7.2 代码质量检查

- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告
- [ ] 导入顺序正确
- [ ] 组件命名规范（PascalCase）
- [ ] 文件命名规范（kebab-case）
- [ ] 无未使用的导入

---

## 📚 八、参考示例（必看）

### 8.1 布局组件示例

- **标准布局**: `features/templates/layout/standard-layout.tsx`
- **标准列表布局**: `features/templates/layout/standard-list-layout.tsx`
- **顶部导航布局**: `features/templates/layout/top-nav-layout.tsx`
- **标签页布局**: `features/templates/layout/tab-layout.tsx`

### 8.2 功能组件示例

- **用户搜索**: `features/templates/components/user-search.tsx`
- **基础组件**: `features/templates/components/basic-components.tsx`

### 8.3 路由示例

- **布局路由**: `routes/_authenticated/templates/layout/`
- **组件路由**: `routes/_authenticated/templates/components/`

---

## 🎯 九、快速开始模板

### 9.1 新布局组件模板

```tsx
import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'

export default function NewLayout() {
  const { t } = useTranslation()

  return (
    <>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='flex items-center gap-2'>
          <h1 className='text-2xl font-bold tracking-tight'>
            {t('templates.newLayout')}
          </h1>
          <Badge variant='secondary'>Layout</Badge>
        </div>
        <p className='text-muted-foreground'>
          {t('templates.newLayoutDesc')}
        </p>
        
        <Separator className='my-4 shadow-sm' />

        <div className='faded-bottom no-scrollbar grid gap-4 overflow-auto pb-16'>
          {/* 内容 */}
        </div>
      </Main>
    </>
  )
}
```

### 9.2 路由文件模板

```tsx
import { createFileRoute } from '@tanstack/react-router'
import NewLayout from '../../../../features/templates/layout/new-layout'

export const Route = createFileRoute('/_authenticated/templates/layout/new-layout')({
  component: NewLayoutRoute,
})

function NewLayoutRoute() {
  return <NewLayout />
}
```

---

## 📊 十、常见问题

### Q1: 为什么国际化不生效？

**A:** 确保：
1. 翻译键已添加到 `zh.json` 和 `en.json`
2. 使用 `t()` 函数包裹键名
3. 如果是在组件外部定义的数组，需要移到组件内部

### Q2: 滚动条没有隐藏？

**A:** 确保内容区域使用了：
```tsx
<div className='faded-bottom no-scrollbar overflow-auto'>
```

### Q3: Badge 标签位置不对？

**A:** Badge 应该紧跟在 `h1` 标题后面，在同一 `flex` 容器内：
```tsx
<div className='flex items-center gap-2'>
  <h1>标题</h1>
  <Badge>标签</Badge>
</div>
```

---

**最后更新**：2026 年 3 月 29 日  
**版本**：v1.0  
**状态**：✅ 已启用
