# 前端基础模板

> React 前端开发的目录结构、技术栈与代码规范。

---

## 一、技术栈

| 类别 | 库 | 版本 |
|------|-----|------|
| 框架 | React / React DOM | ^19.2.3 |
| 构建 | Vite + SWC | ^7.3.0 |
| 路由 | TanStack Router | ^1.141.2 |
| 数据 | TanStack Query | ^5.90.12 |
| 表格 | TanStack Table | ^8.21.3 |
| 状态 | Zustand | ^5.0.9 |
| UI | shadcn/ui + Radix UI | — |
| 样式 | Tailwind CSS v4 | ^4.1.18 |
| 表单 | React Hook Form + Zod | — |
| HTTP | axios | ^1.13.2 |
| i18n | i18next | ^25.8.14 |
| 图标 | Lucide React | ^0.561.0 |

---

## 二、目录结构

```
src/
├── components/           # 全局组件
│   ├── ui/              # shadcn/ui 原子组件
│   ├── layout/          # 布局组件（Header/Main/Sidebar）
│   │   └── data/        # sidebar-data.ts 导航配置
│   └── data-table/      # 数据表通用组件
│
├── features/            # 业务模块
│   ├── auth/           # 登录/注册/验证码
│   ├── users/          # 用户管理
│   ├── tasks/          # 任务管理（mock）
│   ├── settings/       # 设置页
│   ├── templates/      # 布局模板示例
│   └── errors/         # 错误页
│
├── routes/              # 文件路由
│   ├── _authenticated/ # 需认证路由
│   └── (auth)/         # 认证路由
│
├── context/            # React Context
├── hooks/              # 自定义 hooks
├── lib/                # 工具库（api/cookies/utils）
├── stores/             # Zustand stores
├── locales/            # i18n 翻译
├── styles/             # 全局样式
└── routeTree.gen.ts    # 【自动生成】
```

---

## 三、代码规范

### 导入顺序（Prettier 强制）

1. React hooks
2. 第三方库
3. Radix UI
4. TanStack 包
5. `@/assets` / `@/api` / `@/stores` / `@/lib`
6. `@/context` / `@/hooks`
7. `@/components`（ui → layout → 其他）
8. `@/features`
9. 相对路径

### TypeScript

- 类型导入：`import type { ... }`
- 未用变量：前缀 `_`
- 避免 `any`
- ID 类型：统一 `string`

### 命名

| 类型 | 格式 |
|------|------|
| 文件 | `kebab-case.tsx` |
| 组件 | `PascalCase` |
| i18n 键 | `camelCase` |

---

## 四、Feature 模块结构

```
features/<module>/
├── index.tsx                          # 页面入口（Provider + Header + Main + Table + Dialogs）
├── api.ts                             # API 函数（QueryParams/AddParams/UpdateParams/DeleteParams）
├── data/
│   ├── schema.ts                     # Zod schema + z.infer 导出类型
│   └── data.ts                       # 静态数据（枚举映射、颜色映射、图标映射）
└── components/
    ├── <module>-table.tsx            # 数据表（useTableUrlState + useQuery + useReactTable）
    ├── <module>-columns.tsx          # 列定义（select/id/字段/操作）
    ├── row-actions.tsx               # 行内操作菜单（编辑/删除）
    ├── <module>-provider.tsx         # Context（open + currentRow）+ use<Module> hook
    ├── <module>-dialogs.tsx          # 弹窗注册中心
    ├── <module>-action-dialog.tsx    # 新增/编辑表单弹窗
    ├── <module>-delete-dialog.tsx    # 删除确认弹窗
    ├── <module>-primary-buttons.tsx  # 顶部主操作按钮
    └── data-table-bulk-actions.tsx   # 批量操作栏
```

---

## 五、标准页面布局（固定表头模式）

```tsx
// features/<module>/index.tsx
import { getRouteApi } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Separator } from '@/components/ui/separator'
import { ModuleDialogs } from './components/<module>-dialogs'
import { ModulePrimaryButtons } from './components/<module>-primary-buttons'
import { ModuleProvider } from './components/<module>-provider'
import { ModuleTable } from './components/<module>-table'

const route = getRouteApi('/_authenticated/<module>/')

export function Module() {
  const { t } = useTranslation()
  const search = route.useSearch()
  const navigate = route.useNavigate()

  return (
    <ModuleProvider>
      <Header fixed>
        <ModuleSearch />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        {/* 标题区域 - 固定 */}
        <div className='flex items-center justify-between gap-2 pb-4'>
          <div>
            <h1 className='text-2xl font-bold tracking-tight'>{t('<module>.title')}</h1>
            <p className='text-muted-foreground'>{t('<module>.description')}</p>
          </div>
          <ModulePrimaryButtons />
        </div>

        <Separator className='shadow-sm' />

        {/* 表格区域 - 填满剩余空间 */}
        <div className='min-h-0 flex-1 pt-4'>
          <ModuleTable />
        </div>
      </Main>

      <ModuleDialogs />
    </ModuleProvider>
  )
}
```

**布局要点**：

| 区域 | CSS | 说明 |
|------|-----|------|
| `Header fixed` | — | 顶部导航栏固定，搜索在 Header |
| `ModuleSearch` | — | 连接 URL 状态的搜索组件 |
| `Main fixed` | `flex flex-col overflow-hidden` | 内容区 flex 布局 |
| 标题区域 | `pb-4` | 下边距 |
| Separator | `shadow-sm` | 分隔线 |
| 表格容器 | `min-h-0 flex-1 pt-4` | 填满剩余空间，上边距 |
| 表头 | `sticky top-0 bg-background` | 固定表头 |

---

## 六、Toast 通知规范（Sonner）

> 全局 Toast 使用 [`sonner`](https://sonner.emilkowal.ski/)，通过 [`components/ui/sonner.tsx`](../../../client/src/components/ui/sonner.tsx) 统一注册。所有业务模块必须遵守下列规范，禁止绕过统一封装自建通知。

### 6.1 全局配置（不要修改）

Toaster 在 [`routes/__root.tsx`](../../../client/src/routes/__root.tsx) 挂载一次，禁止在业务模块里再次挂载。默认配置固定为：

| 配置 | 值 | 说明 |
|------|-----|------|
| `position` | `top-right` | **统一右上角**，不允许改到其它位置 |
| `richColors` | `true` | 用颜色区分严重程度（绿/黄/红/蓝） |
| `closeButton` | `true` | 每条通知右上角可手动关闭 |
| `expand` | `true` | 多条通知展开显示（而不是堆叠） |
| `duration` | `6000ms` | 默认时长（业务可覆盖，见 6.3） |

```tsx
// components/ui/sonner.tsx —— 只维护这一份
<Sonner
  theme={theme}
  position='top-right'
  richColors
  closeButton
  expand
  duration={6000}
  className='toaster group [&_div[data-content]]:w-full'
  style={{
    '--normal-bg': 'var(--popover)',
    '--normal-text': 'var(--popover-foreground)',
    '--normal-border': 'var(--border)',
  } as React.CSSProperties}
  {...props}
/>
```

### 6.2 四种严重程度的用法

| 场景 | API | 颜色 | 何时使用 |
|------|-----|------|---------|
| 操作成功 | `toast.success()` | 绿 | 保存成功、创建成功、上传成功等确定性完成动作 |
| 操作失败（业务错误） | `toast.error()` | 红 | API 返回错误、校验失败、权限不足等**用户需要处理**的问题 |
| 有条件通过 | `toast.warning()` | 黄 | 主流程完成但有 warning（例如权限校验通过但 icacls 有 warning） |
| 中性提示 | `toast.info()` / `toast.message()` | 蓝/灰 | 纯提示、无操作反馈的说明 |
| 异步加载 | `toast.loading()` | — | 需要等待的操作，返回 id 后 `toast.dismiss(id)` |

### 6.3 时长（duration）规范

**规则：越需要用户处理的，时长越长。**

| 类型 | 建议 duration | 原因 |
|------|---------------|------|
| 简单 success | `不传`（用默认 6s） | 用户看一眼就够 |
| success + description | `6000` | 需要读完副标题 |
| warning | `10000 ~ 15000` | 用户可能需要采取行动 |
| error（普通业务错误） | `10000` | 至少让用户读完错误文案 |
| error（含错误码 / 诊断信息） | `15000 ~ 20000` | 需要复制 code / 截图 |
| 关键性阻断错误 | `Infinity` + `closeButton` | 例如"无法连接后端"，等用户手动关闭 |

### 6.4 结构化 Toast（推荐模式）

**Toast 的正文只写"发生了什么"，`description` 写"具体原因/建议"。** 需要展示错误码/异常堆栈时放在 description 里换行。

```tsx
// ❌ 反例：一堆信息挤在标题里
toast.error(`保存失败: code=EACCES 权限不足 请检查目录 D:\OPC\canvas 的 ACL`)

// ✅ 正例：分层展示
toast.error('保存失败', {
  description: 'code=EACCES\n权限不足，请检查目录 D:\\OPC\\canvas 的 ACL',
  duration: 15000,
})
```

### 6.5 完整示例：带 loading + 结果 + 结构化错误

```tsx
import { toast } from 'sonner'

async function handleVerifyPermissions() {
  const verify = window.electron?.workspace.verifyPermissions
  if (!verify) return

  // 1. 长任务：先弹 loading，拿到 id
  const tId = toast.loading(t('settings.workspace.verifying'))

  try {
    const result = await verify()
    toast.dismiss(tId)
    console.log('[workspace] verifyPermissions:', result)

    if (result.ok) {
      const warnings = result.warnings ?? []
      // 2a. 完全成功 → success + 简短 description
      if (warnings.length === 0) {
        toast.success(t('settings.workspace.verifyOk'), {
          description: t('settings.workspace.verifyOkDesc'),
          duration: 6000,
        })
      } else {
        // 2b. 通过但有 warning → warning + 展开警告详情
        console.warn('[workspace] 授权 warning:', warnings)
        toast.warning(t('settings.workspace.verifyOk'), {
          description: warnings.join('\n'),
          duration: 15000,
        })
      }
    } else {
      // 2c. 业务错误 → error + code + details
      console.error('[workspace] 权限校验失败:', result)
      toast.error(result.message, {
        description: `code=${result.code}${result.details ? '\n' + result.details : ''}`,
        duration: 20000,
      })
    }
  } catch (err) {
    // 3. 异常兜底 → error + 完整 message
    toast.dismiss(tId)
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[workspace] verifyPermissions 抛出异常:', err)
    toast.error(msg, { duration: 15000 })
  }
}
```

### 6.6 与 i18n 集成

**所有 toast 文案都必须走 `t()`，不允许硬编码中文/英文字符串。**

```tsx
// ❌
toast.success('保存成功')

// ✅
toast.success(t('common.saveSuccess'))

// ✅ 带插值
toast.success(t('settings.workspace.selected', { name: ws.name }))
```

翻译文件按业务模块组织，建议约定：

```json
{
  "common": {
    "saveSuccess": "保存成功",
    "saveFailed": "保存失败",
    "networkError": "网络异常，请稍后重试"
  },
  "<module>": {
    "createOk": "创建成功",
    "createFailed": "创建失败"
  }
}
```

### 6.7 与 console 日志联动

**规则：只要向 toast 抛 error 或 warning，同时用相同前缀写到 console。**

原因：Electron 主进程的 stdout 不一定被采集；toast 时长有限；开发者调试问题时需要在 F12 Console 拿到原始对象。

```tsx
console.error('[workspace] 权限校验失败:', result)   // ← 完整对象给开发者
toast.error(result.message, { description: ... })    // ← 精简版给用户
```

前缀约定：`[<模块名>]`，比如 `[workspace]`、`[comfyui]`、`[knowledge]`。

### 6.8 反模式清单（禁止）

| ❌ 不要这样 | ✅ 应该这样 |
|-----------|-----------|
| `alert('保存成功')` | `toast.success(t('common.saveSuccess'))` |
| `window.confirm(...)` | 用 shadcn `<AlertDialog>` |
| `<Toaster />` 在业务模块里 | 只在 `__root.tsx` 一处挂载 |
| toast 里塞 JSX 大段内容 | 用 `description` 或改成 Dialog |
| `duration: 1000`（太短） | 最少 `duration: 6000`，读得完才行 |
| `toast.error(err)` 直接扔 Error | 先 `err instanceof Error ? err.message : String(err)` |
| 每次操作都弹 toast（骚扰） | 只在结果**不明显**时提示，如列表刷新不需要 toast |

### 6.9 Sonner 相关文件

| 文件 | 作用 |
|------|------|
| [`client/src/components/ui/sonner.tsx`](../../../client/src/components/ui/sonner.tsx) | Toaster 封装，全局唯一 |
| [`client/src/routes/__root.tsx`](../../../client/src/routes/__root.tsx) | Toaster 挂载点 |
| 各 feature 里的 `toast.xxx()` | 业务调用点 |