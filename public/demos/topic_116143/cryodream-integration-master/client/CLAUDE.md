# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**admin-react-shadcn** is a modern admin dashboard template built with Vite, React 19, TypeScript, and Shadcn UI. Based on [shadcn-admin](https://github.com/satnaing/shadcn-admin) by @satnaing.

## Commands

```bash
pnpm run dev       # Start dev server (port 5180)
pnpm run build     # Build for production (runs tsc -b && vite build)
pnpm run lint      # Run ESLint
pnpm run format    # Format with Prettier
pnip run knip      # Check for unused code
```

## Tech Stack

- **Build**: Vite 7 with React SWC plugin
- **UI**: Shadcn UI (new-york style) + Tailwind CSS 4 + Radix UI
- **Router**: TanStack Router (file-based routing with auto-generated `routeTree.gen.ts`)
- **State**: Zustand (auth-store) + React Context (theme, layout, i18n, direction)
- **Data**: TanStack Query + TanStack Table
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React
- **i18n**: i18next + react-i18next (default: Chinese, supports EN/ZH)

## Architecture

### Directory Structure

```
src/
├── components/           # Reusable components
│   ├── ui/              # Shadcn UI primitives (auto-generated, don't edit)
│   ├── layout/          # Layout components (Header, Main, Sidebar, Nav)
│   │   └── data/       # sidebar-data.ts for navigation config
│   └── data-table/     # Table utilities (pagination, filters, toolbar)
│
├── features/            # Feature modules (business logic)
│   ├── auth/           # Sign-in, sign-up, forgot-password, OTP
│   ├── dashboard/      # Dashboard with tabs (overview, architecture, templates, deps)
│   ├── users/          # User management (table, dialogs, CRUD)
│   ├── tasks/          # Task management (table, dialogs, CRUD)
│   ├── settings/       # Settings pages (profile, account, appearance, etc.)
│   ├── templates/      # Layout templates and component examples
│   └── errors/        # Error pages (401, 403, 404, 500, 503)
│
├── routes/              # TanStack Router file-based routes
│   ├── _authenticated/ # Routes behind auth (dashboard, users, tasks, etc.)
│   ├── (auth)/         # Auth routes (sign-in, sign-up, etc.)
│   └── __root.tsx      # Root layout
│
├── context/            # React Context providers
├── hooks/              # Custom hooks (use-mobile, use-dialog-state)
├── lib/                # Utilities (utils.ts, handle-server-error)
├── stores/             # Zustand stores (auth-store)
├── locales/            # i18n translations (zh.json, en.json)
└── styles/             # Tailwind CSS (index.css, theme.css)
```

### Key Patterns

#### Creating a New Feature

1. **Component**: Create in `src/features/<module>/<feature>.tsx`
2. **Route**: Create in `src/routes/_authenticated/<module>/<feature>.tsx`
3. **i18n**: Add keys to `src/locales/zh.json` and `en.json`
4. **Sidebar**: Add navigation entry in `src/components/layout/data/sidebar-data.ts`

#### Standard Page Layout

Every authenticated page follows the `Header + Main` pattern:

```tsx
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'

export default function Page() {
  return (
    <>
      <Header fixed>
        {/* Search, ThemeSwitch, ConfigDrawer, ProfileDropdown */}
      </Header>
      <Main fixed>
        {/* Title, Separator, Content */}
      </Main>
    </>
  )
}
```

#### Content Area Styling

Use `faded-bottom no-scrollbar overflow-auto pb-16` for scrollable content areas with fade effect at bottom.

#### i18n Namespaces

- `common.*` - Shared vocabulary (create, save, dashboard, etc.)
- `templates.*` - Template-related keys
- `components.*` - Component-specific keys
- Feature-specific namespaces per module

### Layout Templates (Reference)

Located in `src/features/templates/layout/`:
- `standard-layout.tsx` - Standard page with header buttons
- `standard-list-layout.tsx` - List/table page with filters
- `top-nav-layout.tsx` - Page with top navigation tabs
- `tab-layout.tsx` - Page with tab content (tabs sticky, content scrollable)

### Data Table Pattern

Tables use TanStack Table with reusable components in `src/components/data-table/`:
- `pagination.tsx` - Pagination controls
- `column-header.tsx` - Sortable column headers
- `faceted-filter.tsx` - Multi-select filters
- `toolbar.tsx` - Filter bar
- `view-options.tsx` - Column visibility toggle
- `bulk-actions.tsx` - Bulk operation bar

Feature tables define columns and row actions in their respective feature directories.

## Code Conventions

### Import Order (enforced by Prettier)

1. React and hooks
2. Third-party libraries (zod, axios, date-fns)
3. Radix UI components
4. TanStack packages
5. @/assets, @/api, @/stores, @/lib, @/utils
6. @/context, @/hooks
7. @/components (ui, layout, then other)
8. @/features
9. Relative imports

### TypeScript

- Type-only imports enforced (`import type { ... }`)
- Unused vars prefixed with `_` allowed
- Avoid `any`, use proper types

### File Naming

- Route files: `kebab-case.tsx`
- Component files: `kebab-case.tsx`
- Component names: `PascalCase`
- i18n keys: `camelCase`

### Toast Notifications (Sonner)

**Global Toaster** is mounted once in [`src/routes/__root.tsx`](src/routes/__root.tsx). Configuration lives in [`src/components/ui/sonner.tsx`](src/components/ui/sonner.tsx). **Do NOT** mount another `<Toaster />` inside feature modules.

Fixed configuration (do not override): `position='top-right'` + `richColors` + `closeButton` + `expand` + `duration=6000`.

Usage rules:

| Scenario | API | Recommended duration |
|----------|-----|---------------------|
| Simple success | `toast.success(t('...'))` | default 6s |
| Success with warnings | `toast.warning(title, { description, duration: 15000 })` | 15s |
| Business error | `toast.error(title, { description: 'code=X\n...', duration: 10000 })` | 10s |
| Critical error with diagnostics | `toast.error(msg, { duration: 20000 })` | 20s |
| Long-running task | `const id = toast.loading(...)`, then `toast.dismiss(id)` | — |

Additional rules:

1. All text **must** go through `t()` (i18n). Do not hardcode strings.
2. When calling `toast.error()` or `toast.warning()`, also log the full object to console with `[<module>]` prefix (e.g. `console.error('[workspace] failed:', result)`).
3. Put error codes / diagnostics in `description`, not in the title.
4. Never use `alert()` or `window.confirm()` — use `toast.*` or shadcn `<AlertDialog>`.
5. Full spec: [../docs/03-模板中心/templates/frontend-base.md §六](../docs/03-模板中心/templates/frontend-base.md)

## Git Conventions

### Commit Format

```
<type>(<scope>): <subject>
```

Types: `init`, `feat`, `fix`, `perf`, `refactor`, `style`, `test`, `docs`, `chore`, `deps`, `ci`, `build`, `workflow`, `revert`, `release`

### Branch Naming

- `master` - Production
- `develop` - Development trunk
- `feature/<name>` - New features
- `bugfix/<desc>` - Bug fixes
- `hotfix/<desc>` - Urgent production fixes
- `release/vX.Y.Z` - Release preparation

## Configuration Files

- `vite.config.ts` - Vite config (port 5180, alias `@/`)
- `eslint.config.js` - ESLint with TypeScript, React Hooks, TanStack Query
- `knip.config.ts` - Unused code detection (ignores `src/components/ui/**`)
- `.prettierrc` - Import sorting, Tailwind class sorting
- `components.json` - Shadcn UI config (new-york style, lucide icons)
