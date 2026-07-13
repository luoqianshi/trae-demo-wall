# Development Guidelines

> Standardized development specifications based on the existing template system, used to guide the development of new features and components
>
> ⚠️ **Important**: This project has its own layout system (theme configuration, navigation, etc.). The Development Guidelines provide **development templates and best practices**, allowing flexible adjustments according to actual needs.
> # Must refer to VIII. Reference Examples (must-read) to select appropriate layouts or components
---

## 📁 I. File Structure Specifications

### 1.1 Directory Structure

```
src/
├── routes/
│   └── _authenticated/
│       └── <module-name>/
│           ├── index.tsx                      # Module main page
│           ├── <feature-name>.tsx             # Feature route
│           └── layout/
│               ├── index.tsx                  # Layout list
│               ├── <layout-name>-layout.tsx   # Specific layout
│               └── ...
│
├── features/
│   └── <module-name>/
│       ├── index.ts                           # Export file
│       ├── <feature-name>.tsx                 # Feature component
│       └── layout/
│           ├── <layout-name>-layout.tsx       # Layout component
│           └── ...
│
└── components/
    └── layout/
        └── data/
            └── sidebar-data.ts                # Sidebar configuration
```

### 1.2 Naming Conventions

| Type | Naming Format | Example |
|------|---------|------|
| Route files | `kebab-case` | `top-nav-layout.tsx` |
| Component files | `kebab-case` | `user-search.tsx` |
| Component function names | `PascalCase` | `UserSearch`, `TopNavLayout` |
| Route paths | `kebab-case` | `/templates/layout/top-nav-layout` |
| Internationalization keys | `camelCase` | `topNavLayout`, `userSearchExample` |

---

## 🎯 II. Development Process

### 2.1 Creating New Module/Feature

#### Step 1: Create Component File

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
        {/* Header Content */}
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
        
        {/* Content Area */}
      </Main>
    </>
  )
}
```

#### Step 2: Create Route File

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

#### Step 3: Add Internationalization

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

#### Step 4: Configure Sidebar

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

## 🎨 III. Layout Specifications

### 3.0 Layout System Description

⚠️ **Important**: This project has its own layout system, including:
- Theme configuration (light/dark theme switching)
- Navigation system (sidebar, top navigation)
- User menu and configuration drawer

**Development Guidelines provide development templates**, allowing flexible adjustments according to actual needs:
- ✅ **Header content can be flexibly configured**: Dashboard and other pages can omit button groups, keeping only Search + theme switch + user menu
- ✅ **Title area can be simplified**: Some pages can have only titles, no action buttons needed
- ✅ **Layout templates can be customized**: Adjust layout structure according to business needs

### 3.1 Standard Page Structure

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
  {/* Title Area */}
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
    
    {/* Right Action Buttons */}
    <div className='flex gap-2'>
      <Button variant='outline' className='space-x-1'>
        <span>Import</span>
        <Download size={18} />
      </Button>
      <Button className='space-x-1'>
        <span>Create</span>
        <Plus size={18} />
      </Button>
    </div>
  </div>

  <Separator className='my-4 shadow-sm' />

  {/* Content Area */}
  <div className='faded-bottom no-scrollbar grid gap-4 overflow-auto pb-16'>
    {/* Content Components */}
  </div>
</Main>
```

### 3.2 Key Style Specifications

| Element | Class | Description |
|------|-------|------|
| Page title | `text-2xl font-bold tracking-tight` | Standard title style |
| Subtitle | `text-muted-foreground` | Gray description text |
| Badge | `variant='secondary'` | Secondary tag |
| Button group | `flex gap-2` | Button spacing |
| Icon in button | `size={18}` | Icon size |
| Button text spacing | `space-x-1` | Text and icon spacing |
| Separator | `my-4 shadow-sm` | Spacing + shadow |
| Content area | `faded-bottom no-scrollbar overflow-auto pb-16` | Gradient + hidden scrollbar |
| Grid layout | `grid gap-4` | Standard grid spacing |

### 3.3 Layout Flexibility Description

⚠️ **Standard page structure is a reference template, not a mandatory requirement**. Adjust according to actual business needs:

#### ✅ Allowed Adjustments

**1. Header Content Adjustment**
```tsx
// ✅ Standard Header
<Header fixed>
  <Search />
  <div className='ms-auto flex items-center space-x-4'>
    <ThemeSwitch />
    <ConfigDrawer />
    <ProfileDropdown />
  </div>
</Header>
```

**2. Tab Layout (Recommended)**
```tsx
<Main fixed>
  {/* Title Area */}
  <div className='flex items-center justify-between gap-2'>
    <div>
      <h1>Title</h1>
      <p className='text-muted-foreground'>Description</p>
    </div>
  </div>

  <Separator className='my-4 shadow-sm' />

  {/* Tab Layout - Tabs fixed, content scrollable */}
  <div className='faded-bottom no-scrollbar overflow-auto pb-16'>
    <Tabs defaultValue='overview' className='flex h-full flex-col'>
      {/* Tabs List - Fixed at top */}
      <div className='sticky top-0 z-10 bg-background/95 backdrop-blur'>
        <TabsList>
          <TabsTrigger value='tab1'>Tab 1</TabsTrigger>
          <TabsTrigger value='tab2'>Tab 2</TabsTrigger>
        </TabsList>
        <Separator />
      </div>
      
      {/* Tabs Content Area - Scrollable */}
      <div className='flex-1 overflow-auto'>
        <div className='grid gap-4 pt-4'>
          <TabsContent value='tab1'>Content 1</TabsContent>
          <TabsContent value='tab2'>Content 2</TabsContent>
        </div>
      </div>
    </Tabs>
  </div>
</Main>
```

**3. Title Area Adjustment**
```tsx
// ✅ Simplified - Only title and description (like dashboard)
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
  {/* Can have no right button group */}
</div>

// ✅ Full Version - With action buttons (like list page)
<div className='flex items-center justify-between gap-2'>
  <div>
    <div className='flex items-center gap-2'>
      <h1>Title</h1>
      <Badge>List</Badge>
    </div>
    <p className='text-muted-foreground'>Description</p>
  </div>
  <div className='flex gap-2'>
    <Button variant='outline'>Import</Button>
    <Button>Create</Button>
  </div>
</div>
```

**4. Content Area Adjustment**
```tsx
// ✅ Tab Layout (Recommended) - Tabs fixed, content scrollable
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

// ✅ Simple Content Page
<div className='faded-bottom no-scrollbar overflow-auto pb-16'>
  <Card>...</Card>
</div>
```

#### ❌ Not Recommended to Modify

- `fixed` attribute of `Header` and `Main` components (maintain fixed layout)
- Title style `text-2xl font-bold tracking-tight` (maintain visual consistency)
- Use of Badge (enhance readability)
- Content area scroll handling (`overflow-auto pb-16`)

---

## 🧩 IV. Component Usage Specifications

### 4.1 Required Components

| Component | Usage | Import Path |
|------|------|---------|
| `Header` | Page header container | `@/components/layout/header` |
| `Main` | Page main content area | `@/components/layout/main` |
| `Badge` | Tag/badge | `@/components/ui/badge` |
| `Separator` | Separator line | `@/components/ui/separator` |
| `Button` | Button | `@/components/ui/button` |

### 4.2 Optional Components

| Component | Usage | Import Path |
|------|------|---------|
| `Search` | Search box | `@/components/search` |
| `ThemeSwitch` | Theme switch | `@/components/theme-switch` |
| `ConfigDrawer` | Configuration drawer | `@/components/config-drawer` |
| `ProfileDropdown` | User menu | `@/components/profile-dropdown` |
| `Tabs` | Tab page | `@/components/ui/tabs` |
| `Card` | Card container | `@/components/ui/card` |

### 4.3 Icon Usage

```tsx
import { Download, Plus, Search } from 'lucide-react'

// Use in button
<Button>
  <Plus size={18} />
</Button>

// Standalone icon
<Search size={20} />
```

---

## 🌐 V. Internationalization Specifications

### 5.1 Namespaces

| Namespace | Usage | Example |
|---------|------|------|
| `common.*` | Common vocabulary | `common.create`, `common.save` |
| `templates.*` | Template related | `templates.topNavLayout` |
| `components.*` | Component specific | `components.userSearch` |

### 5.2 Translation Key Naming

```typescript
// Feature name
templates.featureName          // Chinese: 功能名称
templates.featureNameDesc      // Chinese: 功能描述

// Component example
components.componentName       // Chinese: 组件名称
components.componentNameDesc   // Chinese: 组件描述
```

### 5.3 Usage Example

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

## 📝 VI. Code Specifications

### 6.1 Import Order

```tsx
// 1. React and related hooks
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

// 2. Router
import { useNavigate } from '@tanstack/react-router'

// 3. Lucide icons
import { Download, Plus } from 'lucide-react'

// 4. shadcn/ui components
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

// 5. Layout components
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'

// 6. Common components
import { Search } from '@/components/search'
```

### 6.2 Component Structure

```tsx
// Default export
export default function ComponentName() {
  const { t } = useTranslation()

  // 1. Hooks
  const navigate = useNavigate()
  const [state, setState] = useState()

  // 2. Event handlers
  const handleClick = () => {
    // logic
  }

  // 3. Render
  return (
    <>
      {/* Content */}
    </>
  )
}
```

### 6.3 Comment Specifications

```tsx
// ===== Section Separator =====
{/* ===== Top Heading ===== */}
<Header fixed>
  {/* Header Content */}
</Header>

{/* ===== Main Content ===== */}
<Main fixed>
  {/* Content Area */}
</Main>
```

---

## 🔧 VII. Checklists

### 7.1 Development Completion Checklist

- [ ] Component file created (`features/`)
- [ ] Route file created (`routes/`)
- [ ] Internationalization added (`zh.json` + `en.json`)
- [ ] Sidebar configuration updated
- [ ] Badge tag added
- [ ] Title and description use internationalization
- [ ] Layout follows specifications (Header + Main)
- [ ] Content area uses `faded-bottom no-scrollbar overflow-auto`
- [ ] Button icon size is `size={18}`
- [ ] Code passes TypeScript check

### 7.2 Code Quality Checklist

- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Import order correct
- [ ] Component naming convention (PascalCase)
- [ ] File naming convention (kebab-case)
- [ ] No unused imports

---

## 📚 VIII. Reference Examples (Must-Read)

### 8.1 Layout Component Examples

- **Standard Layout**: `features/templates/layout/standard-layout.tsx`
- **Standard List Layout**: `features/templates/layout/standard-list-layout.tsx`
- **Top Navigation Layout**: `features/templates/layout/top-nav-layout.tsx`
- **Tab Layout**: `features/templates/layout/tab-layout.tsx`

### 8.2 Feature Component Examples

- **User Search**: `features/templates/components/user-search.tsx`
- **Basic Components**: `features/templates/components/basic-components.tsx`

### 8.3 Route Examples

- **Layout Routes**: `routes/_authenticated/templates/layout/`
- **Component Routes**: `routes/_authenticated/templates/components/`

---

## 📊 IX. Quick Start Template

### 9.1 New Layout Component Template

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
          {/* Content */}
        </div>
      </Main>
    </>
  )
}
```

### 9.2 Route File Template

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

## 📊 X. Common Issues

### Q1: Why doesn't internationalization work?

**A:** Ensure:
1. Translation keys added to `zh.json` and `en.json`
2. Use `t()` function to wrap key names
3. If arrays are defined outside components, need to move them inside

### Q2: Scrollbar not hidden?

**A:** Ensure content area uses:
```tsx
<div className='faded-bottom no-scrollbar overflow-auto'>
```

### Q3: Badge tag position incorrect?

**A:** Badge should follow immediately after `h1` title, in the same `flex` container:
```tsx
<div className='flex items-center gap-2'>
  <h1>Title</h1>
  <Badge>Tag</Badge>
</div>
```

---

**Last Updated**: March 29, 2026  
**Version**: v1.0  
**Status**: ✅ Enabled
