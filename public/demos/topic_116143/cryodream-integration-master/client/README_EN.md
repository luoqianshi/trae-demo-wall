<div align="center">
    <h1>❄️ admin-react-shadcn</h1>
</div>

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/license/mit/) [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/) [![Vite](https://img.shields.io/badge/Vite-7.3-646cff.svg)](https://vitejs.dev/)

</div>

<div align="center">

[中文](README_ZH.md) • [English](README_EN.md)

</div>

---

## 📖 Introduction

**admin-react-shadcn** is a modern admin dashboard template built with Vite, React, TypeScript, and Shadcn UI.

> Based on the excellent work of [shadcn-admin](https://github.com/satnaing/shadcn-admin) by [@satnaing](https://github.com/satnaing)

## ✨ Features

- 🌓 Dark/Light mode
- 📱 Fully responsive
- ♿ Accessible (WCAG compliant)
- 🌐 RTL support
- 🧩 50+ components
- 🔍 Global search
- 🎯 TypeScript support
- ⚡ Fast development with Vite

## 🛠️ Tech Stack

- **UI:** [Shadcn UI](https://ui.shadcn.com) (TailwindCSS + RadixUI)
- **Build:** [Vite](https://vitejs.dev/)
- **Routing:** [TanStack Router](https://tanstack.com/router/latest)
- **TypeScript:** [TypeScript](https://www.typescriptlang.org/)
- **Icons:** [Lucide Icons](https://lucide.dev/icons/)

## 📦 Installation

```bash
# Clone the repo (public)
git clone https://github.com/ice-deep-dream/admin-react-shadcn.git

# Navigate to project directory
cd admin-react-shadcn

# Install dependencies
pnpm install

# Start dev server
pnpm run dev
```

## 🚀 Commands

```bash
pnpm run dev      # Start development server
pnpm run build    # Build for production
pnpm run lint     # Run ESLint
pnpm run typecheck # Run TypeScript check
```

## 📁 Project Structure

### Core Directories

```
admin-react-shadcn/
├── src/
│   ├── components/        # Reusable components
│   │   ├── ui/           # Shadcn UI base components (customized RTL support)
│   │   ├── layout/       # Layout components (Header, Main, Sidebar, etc.)
│   │   └── ...           # Other common components
│   ├── features/          # Feature modules (organized by business logic)
│   │   ├── dashboard/    # Dashboard (4 tabs: Overview/Architecture/Templates/Dependencies)
│   │   ├── tasks/        # Task management
│   │   └── templates/    # Development templates & examples (core)
│   │       ├── layout/   # 4 layout templates
│   │       │   ├── standard-layout.tsx         # Standard layout
│   │       │   ├── standard-list-layout.tsx    # Standard list layout
│   │       │   ├── top-nav-layout.tsx          # Top navigation layout
│   │       │   └── tab-layout.tsx              # Tab layout
│   │       └── components/ # Example components
│   │           ├── user-search.tsx             # User search example
│   │           └── basic-components.tsx        # Basic components example
│   ├── routes/            # Route definitions (file-based routing)
│   │   └── _authenticated/ # Authenticated routes
│   │       ├── dashboard/  # Dashboard routes
│   │       ├── tasks/      # Task routes
│   │       └── templates/  # Template routes (dev spec examples)
│   ├── lib/              # Utilities and configurations
│   ├── locales/          # i18n files (zh.json, en.json)
│   └── hooks/            # Custom React Hooks
├── docs/                 # Project documentation
│   └── template/         # Development specs
│       └── DEVELOPMENT-GUIDELINES.md  # Development spec (English)
├── public/               # Static assets
└── package.json          # Dependencies
```

### Key Features

#### 1️⃣ **Modular File Organization**
- ✅ **`features/` by business module**: Each feature is independent, easy to maintain and extend
- ✅ **`routes/` file-based routing**: TanStack Router auto-routing with type safety
- ✅ **`components/` layered management**: Base components vs business components separation

#### 2️⃣ **Development Template System** (Core Advantage)
- ✅ **4 standard layout templates**: Cover common admin dashboard scenarios
  - Standard Layout: For forms, data entry pages
  - Standard List Layout: For lists, table pages
  - Top Navigation Layout: For multi-level navigation scenarios
  - Tab Layout: For multi-tab switching scenarios (like dashboard)
- ✅ **Example components reference**: User search, basic components and other practical examples
- ✅ **Development spec documentation**: Detailed [Development Spec](docs/template/DEVELOPMENT-GUIDELINES.md), including:
  - File structure conventions
  - Development workflow (4-step quick start)
  - Layout conventions (fixed Header + Main)
  - Component usage standards
  - Internationalization standards
  - Code standards
  - Checklists

#### 3️⃣ **Flexible Layout System**
- ✅ **Project's own layout system**: Theme configuration, navigation, user menu integration
- ✅ **Flexible Header configuration**: Can omit button groups, keep only core functions
- ✅ **Customizable title area**: Simplified or full version based on business needs
- ✅ **Unified content area handling**: `faded-bottom no-scrollbar overflow-auto` scroll optimization

#### 4️⃣ **Best Practices Integration**
- ✅ **Full TypeScript support**: Type safety, reduce runtime errors
- ✅ **Internationalization support**: i18n multi-language, RTL support
- ✅ **Responsive design**: Mobile-first, adapt to all devices
- ✅ **Accessibility support**: WCAG standards, ARIA labels
- ✅ **Theme switching**: One-click dark/light mode toggle

### Quick Start Path

1. **Read development spec**: [docs/template/DEVELOPMENT-GUIDELINES.md](docs/template/DEVELOPMENT-GUIDELINES.md)
2. **Reference layout templates**: [src/features/templates/layout/](src/features/templates/layout/)
3. **View example components**: [src/features/templates/components/](src/features/templates/components/)
4. **Copy template code**: Use quick start templates from the spec

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

This project is based on [shadcn-admin](https://github.com/satnaing/shadcn-admin) by [Sat Naing](https://github.com/satnaing). Special thanks for the excellent foundation!

---

<div align="center">

**Made with ❤️**

</div>
