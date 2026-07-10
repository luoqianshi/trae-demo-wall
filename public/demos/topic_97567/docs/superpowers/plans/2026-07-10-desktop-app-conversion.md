# 雪球日记桌面应用改造 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 Next.js 16 Web 应用改造为独立可执行的 Windows 桌面应用，用户双击图标即可启动，无需任何命令行操作。

**Architecture:** 采用 Electron + Next.js standalone 构建方案。Electron 主进程作为壳层，启动 Next.js standalone 服务器（子进程），并通过 BrowserWindow 加载本地 HTTP 端口呈现界面。数据文件迁移到用户数据目录（`app.getPath('userData')`）保证可写。最终通过 electron-builder 打包为 NSIS 安装包和便携版 exe。

**Tech Stack:** Next.js 16.2.4 (standalone output), Electron 33+, electron-builder 25+, TypeScript 5, Windows 平台

---

## 背景与决策

### 为什么选 Electron + Next.js standalone？

雪球日记是 Next.js 全栈应用，**大量使用服务端 API 路由**（auth、tasks、records、ai、challenges 等共 30+ 个路由），且依赖文件系统读写 `data/local-db.json`。这意味着：

- **不能**用 `next export` 静态导出（会丢失所有 API 路由）
- **不能**用 Tauri（不原生运行 Node.js 服务器）
- **必须**保留一个 Node.js 运行时来执行 API 路由

Electron 方案的核心优势：
1. Electron 自带 Node.js 运行时，可直接启动 Next.js standalone 服务器
2. BrowserWindow 提供原生窗口体验（标题栏、最小化、关闭按钮）
3. electron-builder 可打包为单一 exe 安装包，用户双击即装即用
4. 文件系统访问天然支持，`local-db.json` 可正常读写
5. Windows 平台支持成熟，无需 Rust 工具链

### 数据存储路径处理

当前 `src/lib/repositories/base.ts:11` 已支持 `LOCAL_DB_FILE` 环境变量：
```typescript
const DATA_FILE = process.env.LOCAL_DB_FILE || `${process.cwd()}/data/local-db.json`;
```

打包后应用目录是只读的（asar 归档），所以必须将数据文件指向用户数据目录。Electron 主进程在启动服务器前设置 `LOCAL_DB_FILE` 环境变量即可，**无需修改任何业务代码**。

### AI 功能降级

AI 路由（如 `src/app/api/ai/emotion/route.ts`）已实现关键词 fallback，没有 `ZHIPU_API_KEY` 时自动降级为本地关键词分析。桌面应用默认不带 API Key，AI 功能降级运行，核心功能不受影响。

---

## 文件结构

### 新增文件

```
snowball-diary-new/
├── electron/
│   ├── main.ts                # Electron 主进程入口
│   ├── preload.ts             # 预加载脚本（最小化，仅基础桥接）
│   ├── server-manager.ts      # Next.js 服务器生命周期管理
│   ├── port-manager.ts        # 动态端口分配
│   └── icons/
│       └── icon.ico           # Windows 应用图标（256x256）
├── electron-builder.yml       # electron-builder 配置
└── scripts/
    └── copy-standalone.js     # 构建后复制 standalone 产物到 electron 目录
```

### 修改文件

```
snowball-diary-new/
├── next.config.ts             # 添加 output: 'standalone'
├── package.json               # 添加 electron 依赖和脚本
└── .gitignore                 # 忽略 electron 构建产物
```

### 不修改的文件

- `src/lib/repositories/base.ts` - 已支持 `LOCAL_DB_FILE` 环境变量，无需改动
- 所有 API 路由 - 业务逻辑保持不变
- 所有前端组件 - UI 保持不变
- `src/lib/api-auth.ts` - 认证逻辑保持不变

---

## Task 1: 配置 Next.js standalone 构建

**Files:**
- Modify: `snowball-diary-new/next.config.ts`

- [ ] **Step 1: 修改 next.config.ts 添加 standalone 输出**

将 `next.config.ts` 修改为：

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // 输出独立可运行的服务器包，供 Electron 启动
  output: "standalone",
};

export default nextConfig;
```

- [ ] **Step 2: 验证 standalone 构建正常**

Run: `cd snowball-diary-new && npm run build`
Expected: 构建成功，`.next/standalone/` 目录存在，内含 `server.js` 和精简的 `node_modules`

- [ ] **Step 3: 验证 standalone 服务器可独立运行**

Run: `cd snowball-diary-new/.next/standalone && node server.js`
Expected: 服务器启动，监听 3000 端口。浏览器访问 `http://localhost:3000` 能正常加载页面（静态资源可能 404，因为还未复制 `.next/static` 和 `public`，此步骤仅验证服务器可启动）

- [ ] **Step 4: Commit**

```bash
cd snowball-diary-new
git add next.config.ts
git commit -m "feat: 启用 Next.js standalone 输出为桌面应用做准备"
```

---

## Task 2: 创建端口管理模块

**Files:**
- Create: `snowball-diary-new/electron/port-manager.ts`

桌面应用启动时需要为 Next.js 服务器分配一个可用端口，避免与其他应用冲突。

- [ ] **Step 1: 创建端口管理模块**

创建 `electron/port-manager.ts`：

```typescript
import * as net from 'net';

/**
 * 查找一个可用的 TCP 端口。
 * 从 3000 开始尝试，最多尝试 50 个端口。
 * 如果全部占用则抛出错误。
 */
export async function findAvailablePort(startPort = 3000, maxAttempts = 50): Promise<number> {
  return new Promise((resolve, reject) => {
    let currentPort = startPort;
    let attempts = 0;

    const tryPort = (port: number) => {
      const server = net.createServer();
      server.unref();
      server.on('error', () => {
        attempts++;
        if (attempts >= maxAttempts) {
          reject(new Error(`无法找到可用端口（尝试了 ${maxAttempts} 次）`));
          return;
        }
        currentPort++;
        tryPort(currentPort);
      });
      server.listen(port, '127.0.0.1', () => {
        server.close(() => resolve(port));
      });
    };

    tryPort(currentPort);
  });
}
```

- [ ] **Step 2: Commit**

```bash
cd snowball-diary-new
git add electron/port-manager.ts
git commit -m "feat: 添加端口管理模块用于动态分配服务器端口"
```

---

## Task 3: 创建服务器生命周期管理模块

**Files:**
- Create: `snowball-diary-new/electron/server-manager.ts`

此模块负责启动 Next.js standalone 服务器子进程，并等待其就绪。

- [ ] **Step 1: 创建服务器管理模块**

创建 `electron/server-manager.ts`：

```typescript
import { spawn, ChildProcess } from 'child_process';
import * as path from 'path';
import * as http from 'http';

export interface ServerHandle {
  process: ChildProcess;
  port: number;
  url: string;
}

/**
 * 等待服务器在指定端口就绪。
 * 每 200ms 轮询一次，最多等待 30 秒。
 */
async function waitForServer(port: number, timeoutMs = 30000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const ready = await checkPort(port);
    if (ready) return;
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`服务器在 ${timeoutMs}ms 内未就绪（端口 ${port}）`);
}

function checkPort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/`, (res) => {
      res.resume();
      resolve(res.statusCode !== undefined && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

/**
 * 启动 Next.js standalone 服务器。
 *
 * 生产环境：从打包资源中启动 server.js
 * 开发环境：直接运行 `next dev`
 *
 * @param port 服务器监听端口
 * @param dataFile 本地数据文件路径（通过 LOCAL_DB_FILE 环境变量传递）
 * @param isDev 是否为开发模式
 */
export async function startServer(
  port: number,
  dataFile: string,
  isDev = false,
): Promise<ServerHandle> {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PORT: String(port),
    LOCAL_DB_FILE: dataFile,
    NODE_ENV: isDev ? 'development' : 'production',
  };

  let child: ChildProcess;

  if (isDev) {
    // 开发模式：使用 next dev（需要项目根目录）
    child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'dev', '-p', String(port)], {
      env,
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } else {
    // 生产模式：启动 standalone 服务器
    const serverPath = path.join(process.resourcesPath, 'app', '.next', 'standalone', 'server.js');
    child = spawn(process.execPath, [serverPath], {
      env,
      cwd: path.dirname(serverPath),
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  // 转发服务器日志到主进程 stdout/stderr，便于调试
  child.stdout?.on('data', (data) => {
    console.log(`[next-server] ${data.toString().trim()}`);
  });
  child.stderr?.on('data', (data) => {
    console.error(`[next-server] ${data.toString().trim()}`);
  });

  child.on('exit', (code) => {
    console.log(`[next-server] 进程退出，退出码 ${code}`);
  });

  await waitForServer(port);

  return {
    process: child,
    port,
    url: `http://127.0.0.1:${port}`,
  };
}

/**
 * 停止 Next.js 服务器。
 */
export function stopServer(server: ServerHandle | null): void {
  if (!server) return;
  try {
    if (!server.process.killed) {
      server.process.kill('SIGTERM');
      // 强制兜底：1 秒后若仍未退出则 SIGKILL
      setTimeout(() => {
        try {
          if (!server.process.killed) {
            server.process.kill('SIGKILL');
          }
        } catch {
          // 进程可能已退出，忽略
        }
      }, 1000);
    }
  } catch (e) {
    console.error('[server-manager] 停止服务器失败:', e);
  }
}
```

- [ ] **Step 2: Commit**

```bash
cd snowball-diary-new
git add electron/server-manager.ts
git commit -m "feat: 添加 Next.js 服务器生命周期管理模块"
```

---

## Task 4: 创建 Electron 主进程

**Files:**
- Create: `snowball-diary-new/electron/main.ts`
- Create: `snowball-diary-new/electron/preload.ts`

主进程负责：单实例锁、创建窗口、启动服务器、加载 URL、处理退出。

- [ ] **Step 1: 创建预加载脚本**

创建 `electron/preload.ts`：

```typescript
// 预加载脚本：当前应用不需要 Node.js API 暴露到渲染进程，
// 但保留此文件作为 Electron 安全规范的占位，便于后续扩展。
export {};
```

- [ ] **Step 2: 创建主进程入口**

创建 `electron/main.ts`：

```typescript
import { app, BrowserWindow, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { findAvailablePort } from './port-manager';
import { startServer, stopServer, type ServerHandle } from './server-manager';

// 是否为开发模式（通过环境变量 ELECTRON_IS_DEV 判断）
const isDev = process.env.ELECTRON_IS_DEV === '1' || !app.isPackaged;

let mainWindow: BrowserWindow | null = null;
let server: ServerHandle | null = null;

/**
 * 获取数据文件路径。
 * 生产环境存放在用户数据目录，开发环境使用项目 data 目录。
 */
function getDataFilePath(): string {
  if (isDev) {
    return path.join(process.cwd(), 'data', 'local-db.json');
  }
  const userDataDir = app.getPath('userData');
  const dataDir = path.join(userDataDir, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  return path.join(dataDir, 'local-db.json');
}

/**
 * 创建主窗口。
 */
function createWindow(url: string): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    title: '雪球日记',
    icon: path.join(__dirname, 'icons', 'icon.ico'),
    autoHideMenuBar: true,
    backgroundColor: '#FFF8F0',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  mainWindow.loadURL(url);

  // 外部链接在系统默认浏览器打开，应用内链接在窗口内导航
  mainWindow.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (targetUrl.startsWith('http://127.0.0.1') || targetUrl.startsWith('http://localhost')) {
      return { action: 'allow' };
    }
    shell.openExternal(targetUrl);
    return { action: 'deny' };
  });

  // 开发模式打开开发者工具
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * 应用初始化：启动服务器并创建窗口。
 */
async function bootstrap(): Promise<void> {
  try {
    const port = await findAvailablePort();
    const dataFile = getDataFilePath();

    console.log(`[main] 数据文件路径: ${dataFile}`);
    console.log(`[main] 启动 Next.js 服务器于端口 ${port}...`);

    server = await startServer(port, dataFile, isDev);

    console.log(`[main] 服务器就绪: ${server.url}`);
    createWindow(server.url);
  } catch (e) {
    console.error('[main] 启动失败:', e);
    // 给用户一个错误提示后退出
    const { dialog } = require('electron');
    dialog.showErrorBox(
      '雪球日记启动失败',
      `应用启动时发生错误：\n\n${(e as Error).message}\n\n请截图此错误并联系开发者。`,
    );
    app.quit();
  }
}

// 单实例锁：防止多个实例同时运行
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });

  app.whenReady().then(bootstrap);

  app.on('window-all-closed', () => {
    // macOS 上应用通常不退出，其他平台退出
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // macOS: 点击 dock 图标时重新创建窗口
    if (mainWindow === null && server) {
      createWindow(server.url);
    }
  });

  // 应用退出前停止服务器
  app.on('before-quit', () => {
    stopServer(server);
    server = null;
  });
}
```

- [ ] **Step 3: Commit**

```bash
cd snowball-diary-new
git add electron/main.ts electron/preload.ts
git commit -m "feat: 添加 Electron 主进程和预加载脚本"
```

---

## Task 5: 生成应用图标

**Files:**
- Create: `snowball-diary-new/electron/icons/icon.ico`

需要一个 Windows 格式的 `.ico` 图标文件。使用项目已有的雪球图片作为基础。

- [ ] **Step 1: 检查是否有可用的图标源文件**

Run: `ls snowball-diary-new/public/images/snowball-stages/`
Expected: 列出 stage-1~5 的图片文件

- [ ] **Step 2: 生成 ICO 图标文件**

使用 Node.js 脚本将 PNG 转换为 ICO（如果 stage-5.png 是合适尺寸）。如果没有合适的工具，可以下载一个通用的雪花图标作为占位。

创建临时脚本 `scripts/generate-icon.js`：

```javascript
// 此脚本使用 png-to-ico 将 PNG 转换为 ICO
// 运行方式：node scripts/generate-icon.js
const fs = require('fs');
const path = require('path');

async function main() {
  const pngToIco = require('png-to-ico');
  const sourcePng = path.join(__dirname, '..', 'public', 'images', 'snowball-stages', 'stage-5.png');
  const targetIco = path.join(__dirname, '..', 'electron', 'icons', 'icon.ico');

  if (!fs.existsSync(sourcePng)) {
    console.error('源 PNG 文件不存在:', sourcePng);
    process.exit(1);
  }

  // 确保目标目录存在
  fs.mkdirSync(path.dirname(targetIco), { recursive: true });

  const buf = await pngToIco(fs.readFileSync(sourcePng));
  fs.writeFileSync(targetIco, buf);
  console.log('图标已生成:', targetIco);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
```

Run: `cd snowball-diary-new && npm install --save-dev png-to-ico && node scripts/generate-icon.js`
Expected: `electron/icons/icon.ico` 文件已生成

- [ ] **Step 3: 清理临时脚本**

删除 `scripts/generate-icon.js`（图标已生成，脚本不再需要）。

Run: `rm snowball-diary-new/scripts/generate-icon.js`

- [ ] **Step 4: Commit**

```bash
cd snowball-diary-new
git add electron/icons/icon.ico
git commit -m "feat: 添加 Windows 应用图标"
```

---

## Task 6: 配置 package.json 添加 Electron 依赖和脚本

**Files:**
- Modify: `snowball-diary-new/package.json`

- [ ] **Step 1: 更新 package.json**

将 `package.json` 修改为以下内容（保留原有依赖，添加 Electron 相关）：

```json
{
  "name": "snowball-diary",
  "version": "1.0.0",
  "private": true,
  "main": "electron/main.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:gap": "tsx src/test-gap-analyzer/index.ts",
    "test:gap:report": "tsx src/test-gap-analyzer/index.ts --output test-gap-report.md",
    "test:gap:dry": "tsx src/test-gap-analyzer/index.ts --dry-run",
    "electron:dev": "concurrently \"npm run dev\" \"wait-on http://localhost:3000 && cross-env ELECTRON_IS_DEV=1 electron .\"",
    "electron:build": "npm run build && node scripts/copy-standalone.js && electron-builder",
    "electron:build:win": "npm run build && node scripts/copy-standalone.js && electron-builder --win"
  },
  "dependencies": {
    "framer-motion": "^12.38.0",
    "next": "16.2.4",
    "pdf-parse": "^2.4.5",
    "pdfkit": "^0.18.0",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "recharts": "^3.8.1"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "^16.3.2",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "@vitejs/plugin-react": "^6.0.1",
    "concurrently": "^9.1.0",
    "cross-env": "^7.0.3",
    "electron": "^33.0.0",
    "electron-builder": "^25.1.0",
    "eslint": "^9",
    "eslint-config-next": "16.2.4",
    "html2ppt": "^1.0.5",
    "jsdom": "^29.0.2",
    "png-to-ico": "^2.1.8",
    "pptxgenjs": "^4.0.1",
    "puppeteer": "^25.1.0",
    "tailwindcss": "^4",
    "tsx": "^4.22.3",
    "typescript": "^5",
    "vitest": "^4.1.5",
    "wait-on": "^8.0.0"
  },
  "build": {
    "appId": "com.snowball.diary",
    "productName": "雪球日记",
    "directories": {
      "output": "release"
    },
    "files": [
      "electron/**/*",
      "!electron/**/*.ts"
    ],
    "extraResources": [
      {
        "from": ".next/standalone",
        "to": "app/.next/standalone"
      },
      {
        "from": ".next/static",
        "to": "app/.next/standalone/.next/static"
      },
      {
        "from": "public",
        "to": "app/.next/standalone/public"
      }
    ],
    "win": {
      "icon": "electron/icons/icon.ico",
      "target": [
        {
          "target": "nsis",
          "arch": ["x64"]
        },
        {
          "target": "portable",
          "arch": ["x64"]
        }
      ]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true,
      "shortcutName": "雪球日记"
    }
  }
}
```

说明：
- `main` 字段指向 Electron 入口（编译后的 `electron/main.js`）
- `electron:dev` 脚本同时启动 Next.js dev 和 Electron
- `electron:build` 脚本先构建 Next.js，再复制 standalone 产物，最后用 electron-builder 打包
- `build` 配置中的 `extraResources` 将 standalone 服务器作为外部资源打包（不放入 asar，因为含可执行脚本）
- `files` 只包含 electron 目录的编译产物（不含 .ts 源码）

- [ ] **Step 2: 安装新依赖**

Run: `cd snowball-diary-new && npm install`
Expected: 依赖安装成功，无错误

- [ ] **Step 3: Commit**

```bash
cd snowball-diary-new
git add package.json package-lock.json
git commit -m "feat: 添加 Electron 和 electron-builder 依赖及打包脚本"
```

---

## Task 7: 创建 standalone 产物复制脚本

**Files:**
- Create: `snowball-diary-new/scripts/copy-standalone.js`

Next.js standalone 输出不包含 `.next/static` 和 `public` 目录，需要手动复制。

- [ ] **Step 1: 创建复制脚本**

创建 `scripts/copy-standalone.js`：

```javascript
// 复制 Next.js standalone 构建所需的额外资源到 standalone 目录。
// standalone 输出本身不包含 static 和 public，需要手动补充。
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STANDALONE_DIR = path.join(ROOT, '.next', 'standalone');

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`源目录不存在，跳过: ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function main() {
  if (!fs.existsSync(STANDALONE_DIR)) {
    console.error('standalone 目录不存在，请先运行 npm run build');
    process.exit(1);
  }

  // 1. 复制 .next/static -> standalone/.next/static
  const staticSrc = path.join(ROOT, '.next', 'static');
  const staticDest = path.join(STANDALONE_DIR, '.next', 'static');
  console.log('复制 static 资源...');
  copyDir(staticSrc, staticDest);

  // 2. 复制 public -> standalone/public
  const publicSrc = path.join(ROOT, 'public');
  const publicDest = path.join(STANDALONE_DIR, 'public');
  console.log('复制 public 目录...');
  copyDir(publicSrc, publicDest);

  console.log('standalone 资源复制完成');
}

main();
```

- [ ] **Step 2: 验证脚本可执行**

Run: `cd snowball-diary-new && npm run build && node scripts/copy-standalone.js`
Expected: 脚本输出"standalone 资源复制完成"，`.next/standalone/.next/static` 和 `.next/standalone/public` 目录存在

- [ ] **Step 3: Commit**

```bash
cd snowball-diary-new
git add scripts/copy-standalone.js
git commit -m "feat: 添加 standalone 产物复制脚本"
```

---

## Task 8: 配置 TypeScript 编译 Electron 代码

**Files:**
- Create: `snowball-diary-new/electron/tsconfig.json`
- Modify: `snowball-diary-new/package.json`（添加编译脚本）

Electron 主进程代码用 TypeScript 编写，需要编译为 JS 后才能运行。

- [ ] **Step 1: 创建 electron 目录的 tsconfig.json**

创建 `electron/tsconfig.json`：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "CommonJS",
    "moduleResolution": "node",
    "lib": ["ES2022"],
    "outDir": ".",
    "rootDir": ".",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": false,
    "types": ["node"]
  },
  "include": ["./**/*.ts"],
  "exclude": []
}
```

说明：`outDir` 设为 `.` 表示输出到同目录（.ts 编译为 .js），配合 `package.json` 的 `files` 配置中 `!electron/**/*.ts` 排除源码。

- [ ] **Step 2: 在 package.json 的 scripts 中添加编译命令**

在 `package.json` 的 `scripts` 中添加：

```json
"electron:compile": "tsc -p electron/tsconfig.json",
"electron:clean": "node -e \"const fs=require('fs');const g=require('path');function del(p){if(!fs.existsSync(p))return;if(fs.lstatSync(p).isDirectory()){for(const f of fs.readdirSync(p))del(g.join(p,f));fs.rmdirSync(p)}else fs.unlinkSync(p)}['main.js','preload.js','port-manager.js','server-manager.js'].forEach(f=>del(g.join('electron',f)))\""
```

并更新 `electron:dev` 和 `electron:build` 脚本，在运行 Electron 前先编译：

```json
"electron:dev": "npm run electron:compile && concurrently \"npm run dev\" \"wait-on http://localhost:3000 && cross-env ELECTRON_IS_DEV=1 electron .\"",
"electron:build": "npm run build && node scripts/copy-standalone.js && npm run electron:compile && electron-builder",
"electron:build:win": "npm run build && node scripts/copy-standalone.js && npm run electron:compile && electron-builder --win"
```

- [ ] **Step 3: 添加 electron 的类型依赖**

Run: `cd snowball-diary-new && npm install --save-dev @types/electron`

- [ ] **Step 4: 验证 TypeScript 编译通过**

Run: `cd snowball-diary-new && npm run electron:compile`
Expected: 无错误，`electron/` 目录下生成 `main.js`、`preload.js`、`port-manager.js`、`server-manager.js`

- [ ] **Step 5: 更新 .gitignore**

在 `.gitignore` 中添加：

```
# Electron 编译产物
electron/*.js
electron/*.js.map
!electron/preload.ts

# Electron 打包输出
release/
```

- [ ] **Step 6: Commit**

```bash
cd snowball-diary-new
git add electron/tsconfig.json package.json package-lock.json .gitignore
git commit -m "feat: 配置 TypeScript 编译 Electron 主进程代码"
```

---

## Task 9: 验证开发模式可运行

**Files:** 无（仅测试）

- [ ] **Step 1: 编译 Electron 代码**

Run: `cd snowball-diary-new && npm run electron:compile`
Expected: 编译成功，生成 .js 文件

- [ ] **Step 2: 启动 Electron 开发模式**

Run: `cd snowball-diary-new && npm run electron:dev`
Expected:
- Next.js dev 服务器在 3000 端口启动
- Electron 窗口自动打开，显示雪球日记首页
- 窗口标题为"雪球日记"
- 数据文件在 `snowball-diary-new/data/local-db.json`（开发模式）

- [ ] **Step 3: 验证核心功能**

在 Electron 窗口中操作：
1. 创建一个任务并完成它，验证雪球分数变化
2. 添加一条记录，验证数据持久化（刷新页面后仍在）
3. 切换不同页面（任务、记录、成就、个人中心），验证路由正常

Expected: 所有功能正常工作，无控制台错误

- [ ] **Step 4: 验证数据持久化路径正确**

关闭 Electron 窗口后，检查 `data/local-db.json` 是否有数据更新。
Expected: 文件存在且包含最新数据

- [ ] **Step 5: 无需 commit（仅验证）**

---

## Task 10: 验证生产模式打包

**Files:** 无（仅测试）

- [ ] **Step 1: 执行完整打包**

Run: `cd snowball-diary-new && npm run electron:build:win`
Expected:
- Next.js 构建成功
- standalone 资源复制成功
- TypeScript 编译成功
- electron-builder 打包成功
- `release/` 目录下生成 `雪球日记 Setup 1.0.0.exe` 和 `雪球日记 1.0.0.exe`（便携版）

- [ ] **Step 2: 测试便携版**

双击运行 `release/雪球日记 1.0.0.exe`
Expected:
- 雪球日记窗口打开
- 首页正常显示
- 数据文件创建在 `%APPDATA%/雪球日记/data/local-db.json`

- [ ] **Step 3: 测试数据持久化**

在便携版中创建任务、添加记录，关闭应用后重新打开。
Expected: 数据正常保存，重新打开后数据仍在

- [ ] **Step 4: 测试安装版**

运行 `release/雪球日记 Setup 1.0.0.exe`
Expected:
- 安装向导正常显示
- 可选择安装目录
- 安装完成后桌面和开始菜单出现"雪球日记"快捷方式
- 双击快捷方式可启动应用

- [ ] **Step 5: 测试单实例锁**

启动应用后，再次双击图标。
Expected: 不会启动第二个实例，已有窗口被聚焦

- [ ] **Step 6: 无需 commit（仅验证）**

---

## Task 11: 更新文档

**Files:**
- Modify: `snowball-diary-new/README.md`

- [ ] **Step 1: 在 README.md 中添加桌面应用使用说明**

在 `## 快速开始` 章节后添加 `## 桌面应用` 章节：

```markdown
## 桌面应用

雪球日记可打包为独立桌面应用，用户双击图标即可使用，无需安装 Node.js 或执行命令。

### 下载使用

1. 获取 `雪球日记 Setup.exe` 安装包
2. 双击安装，按向导完成安装
3. 桌面双击"雪球日记"图标启动应用

也提供便携版 `雪球日记.exe`，无需安装，双击即用。

### 数据存储位置

桌面应用的数据文件存储在用户数据目录：
- Windows: `%APPDATA%/雪球日记/data/local-db.json`

### 开发者：从源码打包

```bash
# 开发模式运行
npm run electron:dev

# 打包 Windows 安装包和便携版
npm run electron:build:win
```

打包产物输出到 `release/` 目录。
```

- [ ] **Step 2: Commit**

```bash
cd snowball-diary-new
git add README.md
git commit -m "docs: 添加桌面应用使用和打包说明"
```

---

## 风险与注意事项

### 1. Next.js 16 兼容性

Next.js 16.2.4 是较新版本，standalone 输出已稳定支持。若 standalone 服务器启动异常，备选方案是改用 `next start` 作为子进程（需要完整 node_modules 而非 standalone）。

### 2. 端口冲突

使用动态端口分配（从 3000 开始尝试 50 个端口）规避冲突。若极端情况下全部占用，会提示错误。

### 3. 杀毒软件误报

electron-builder 打包的 exe 可能被部分杀毒软件误报。这是 Electron 应用的通病，可通过数字签名解决（需要购买代码签名证书，成本较高，本项目暂不考虑）。

### 4. 应用体积

Electron 应用体积较大（约 150-200MB），因为包含完整的 Chromium 和 Node.js 运行时。这是 Electron 方案的固有代价。便携版体积更大（不压缩），安装版通过 NSIS 压缩可减小约 30%。

### 5. AI 功能降级

桌面应用默认不包含 `ZHIPU_API_KEY`，AI 相关功能（情绪分析、智能反馈、任务分解等）会自动降级为关键词匹配或模板回复。核心功能（任务管理、记录、成就、雪球成长）不受影响。

### 6. 数据迁移

如果用户之前使用过 Web 版（数据在 `snowball-diary-new/data/local-db.json`），桌面应用不会自动迁移数据。用户需要手动复制旧数据文件到 `%APPDATA%/雪球日记/data/local-db.json`。这是有意设计——桌面应用面向新用户，自动迁移可能造成数据混淆。
