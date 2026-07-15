【标签】学习工作

【标题】学习工作 + AI FileManager —— 会思考的文件管家

【正文】

---

## 一、Demo 简介

**是什么：** AI FileManager 是一个跨平台桌面应用（Tauri + Rust + Yew WASM），为文件管理注入"思考能力"——自动识别重复文件、AI 智能分类、虚拟目录归纳、安全删除追踪，让 AI 替你管文件。

**面向谁：**
- 普通办公族：电脑里文档、图片、下载文件堆积如山，整理无从下手
- 开发者 / 设计师：项目文件、设计素材散落各处，重复文件多
- 多硬盘 / 多设备用户：本地磁盘、移动硬盘、网盘文件缺乏统一索引

**主要功能：**
1. **文件指纹 + 重复检测**：自动计算 MD5 + SHA256 双重哈希，建立全局指纹库，精准识别重复文件
2. **虚拟目录管理**：物理文件不动，只存引用关系，一个文件可属于多个目录，零拷贝整理
3. **安全删除追踪**：删除先入队列 → 记录永久保存 → 物理删除需二次确认，全链路可追溯

![仪表盘](file:///d:\Development\Independent_Projects\AI_FileManager\screenshots\dashboard-2026-07-15T15-36-15-685Z.png)

*仪表盘：概览文件统计信息*

![文件扫描](file:///d:\Development\Independent_Projects\AI_FileManager\screenshots\scanner-2026-07-15T15-36-25-367Z.png)

*文件扫描：分批扫描目录并实时上报进度*

![重复文件](file:///d:\Development\Independent_Projects\AI_FileManager\screenshots\duplicates-2026-07-15T15-36-31-919Z.png)

*重复文件检测：MD5+SHA256 双重哈希对比*

![虚拟目录](file:///d:\Development\Independent_Projects\AI_FileManager\screenshots\virtual_dirs-2026-07-15T15-37-11-829Z.png)

*虚拟目录管理：物理文件不动，引用式整理*

![删除记录](file:///d:\Development\Independent_Projects\AI_FileManager\screenshots\deletion-2026-07-15T15-37-19-877Z.png)

*删除审计：全链路可追溯，杜绝误删*

![智能分类](file:///d:\Development\Independent_Projects\AI_FileManager\screenshots\classification-2026-07-15T15-37-24-975Z.png)

*AI 智能分类：TF-IDF + DBSCAN 聚类自动分类*

![文件搜索](file:///d:\Development\Independent_Projects\AI_FileManager\screenshots\search-2026-07-15T15-37-37-865Z.png)

*高级搜索：支持关键字、扩展名、大小范围、哈希值组合搜索*

![文件标签](file:///d:\Development\Independent_Projects\AI_FileManager\screenshots\tags-2026-07-15T15-37-47-364Z.png)

*文件标签系统：创建标签、颜色标识、关联文件*

![最近文件](file:///d:\Development\Independent_Projects\AI_FileManager\screenshots\recent_files-2026-07-15T15-37-52-357Z.png)

*最近文件：记录文件访问行为，快速回溯*

![批量操作](file:///d:\Development\Independent_Projects\AI_FileManager\screenshots\batch_ops-2026-07-15T15-37-58-653Z.png)

*批量操作：多选 + 批量删除/移动，分页浏览*

![排序过滤](file:///d:\Development\Independent_Projects\AI_FileManager\screenshots\sort_filter-2026-07-15T15-38-03-983Z.png)

*排序过滤：按名称/大小/时间排序，扩展名和大小范围过滤*

![文件操作](file:///d:\Development\Independent_Projects\AI_FileManager\screenshots\file_ops-2026-07-15T15-38-09-133Z.png)

*文件操作增强：重命名、复制、新建文件/目录*

![数据导入导出](file:///d:\Development\Independent_Projects\AI_FileManager\screenshots\data_io-2026-07-15T15-38-16-703Z.png)

*数据导入导出：CSV/JSON 格式导出，从 CSV 导入*

![系统集成](file:///d:\Development\Independent_Projects\AI_FileManager\screenshots\integration-2026-07-15T15-37-30-523Z.png)

*系统集成：Windows Shell Extension + Linux Nautilus + macOS Finder*

![设置](file:///d:\Development\Independent_Projects\AI_FileManager\screenshots\settings-2026-07-15T15-38-23-841Z.png)

*设置页面：数据库路径查看*

---

## 二、Demo 创作思路

**灵感来源：**
自己有好几个硬盘和网盘，文件散落各处，手动整理几次都放弃了。后来发现很多文件其实重复了——同样的照片、文档在不同目录下存了多份，但靠人工根本找不全。于是想：为什么不让 AI 来管文件？

**想解决的问题：**
- 重复文件排查困难：全靠手动，工作量大还容易遗漏
- 整理耗时：分类只能手动建文件夹，移动大文件更慢
- 删除不可逆：没有审计机制，删了就找不回来
- 跨设备无统一管理：多个硬盘 / 网盘各自为政

**为什么做这个方向：**
市面上的文件管理器只会"增删改查"，不会"思考判断"。我们希望做一个能自动识别重复、智能分类、安全删除追踪的"会思考的文件管家"。技术上选择 Tauri + Rust 来实现高性能的跨平台方案，前端用 Yew WASM 保证响应式体验，Python AI 做智能分类。这样一套组合既能保证底层性能（Rust 文件哈希、监控），又能提供灵活的前端交互，还能接入 AI 能力。

---

## 三、Demo 体验地址

> 目前为桌面应用，暂未部署公开在线体验地址。可通过以下方式本地构建运行：

```bash
# 克隆仓库
git clone https://github.com/your-repo/AI_FileManager.git

# 安装依赖（需要 Rust、Node.js、Trunk）
cd src/AI_FileManager
pnpm install

# 构建并运行
cargo tauri dev
```

**构建产物：**
- Windows 可执行文件：`target/release/ai_filemanager.exe`
- MSI 安装包：`target/release/bundle/msi/ai_filemanager_0.1.0_x64_en-US.msi`
- NSIS 安装包：`target/release/bundle/nsis/ai_filemanager_0.1.0_x64-setup.exe`

---

## 四、TRAE 实践过程

AI FileManager 从零到一完全使用 TRAE IDE 开发完成，以下是关键开发步骤：

### 阶段一：项目初始化与核心后端

1. 在 TRAE 中新建 Rust + Tauri 项目，配置 Yew WASM 前端
2. 实现文件哈希计算模块（MD5 + SHA256 双重哈希）
3. 实现 SQLite 数据库模块（文件元数据、虚拟目录、删除记录）
4. 完成文件系统监控（跨平台：Windows ReadDirectoryChangesW / Linux inotify）
5. 添加分批扫描 + 进度上报 + 取消支持

**关键步骤截图：**

![TRAE 开发后端数据库模块](file:///d:\Development\Independent_Projects\AI_FileManager\screenshots\scanner-2026-07-15T15-36-25-367Z.png)

### 阶段二：前端 UI + 功能扩展

1. 使用 Yew WASM 实现 15 个功能页面（仪表盘、扫描、重复文件、虚拟目录、删除管理、智能分类、系统集成、搜索、标签、最近文件、批量操作、排序过滤、文件操作、数据导入导出、设置）
2. 实现深色主题 UI，响应式布局
3. 添加文件标签系统、最近文件、批量操作、排序过滤等功能
4. 实现文件搜索增强（高级搜索面板）
5. 实现分页/虚拟滚动
6. 实现系统托盘集成

### 阶段三：系统集成与部署

1. Windows Shell Extension DLL（COM 接口实现右键菜单）
2. Linux Nautilus 右键菜单插件（Python）
3. macOS Finder 右键菜单集成（Automator/AppleScript/Swift 三种方案）
4. Docker 编译环境配置
5. `cargo tauri build` 完整构建测试通过

### TRAE 关键能力体现

在 TRAE 中完成的所有开发工作，体现了以下核心能力：

- **完整的项目脚手架搭建**：Tauri + Rust 后端 + Yew WASM 前端 + Python AI 的完整项目结构生成
- **智能代码补全与重构**：在实现 15 个前端页面时，TRAE 的代码补全和快速重构大幅提升效率
- **编译错误自动修复**：在 Shell Extension DLL 开发中，TRAE 自动诊断并修复了十余个 COM 接口编译错误（`_Impl` trait 实现方式、类型转换、可变性等）
- **多文件协同编辑**：在添加新功能（如分页、搜索增强）时，TRAE 同时修改后端命令、数据库查询、前端组件、回调函数等多个文件
- **跨技术栈开发**：同时处理 Rust 后端、Yew WASM 前端、Python 脚本、COM 接口等多种技术栈

### 关键 Session ID

以下 Session ID 记录了 TRAE 开发 AI FileManager 的完整过程：

| Session ID | 描述 |
|---|---|
| `6a56261e5284367ca9ff9164` | 横跨 7 月 14 日 - 7 月 15 日的完整开发会话，包含所有功能开发、系统集成、编译测试 |

### 技术栈总结

```
前端：Yew WASM (Rust → WebAssembly) + HTML/CSS 深色主题
后端：Rust (Tauri v2) + SQLite
AI 层：Python (TF-IDF + DBSCAN 聚类)
系统集成：Windows Shell Extension (COM) + Linux Nautilus (Python) + macOS Finder
构建工具：Trunk (WASM) + Cargo (Rust) + Docker
```

---

## 五、开发心得与总结

使用 TRAE IDE 开发 AI FileManager 是一次非常高效的体验。从最初的项目构思到最终的可执行文件、安装包生成，全程在 TRAE 中完成。TRAE 的智能代码补全、多文件协同编辑、错误诊断和修复建议，让开发效率提升了一个量级。

最让我印象深刻的是：
1. **跨技术栈无缝切换**：Rust 后端、Yew 前端、Python AI、COM 接口，TRAE 都能流畅处理
2. **编译错误智能修复**：Shell Extension DLL 开发中遇到的复杂 COM 接口编译错误，TRAE 能快速定位根因并给出正确修复方案
3. **多轮对话持续开发**：一次复杂任务可以分多轮对话逐步完成，TRAE 能准确记住上下文和进度

AI FileManager 目前已完成全部核心功能开发，后续将重点打磨 AI 智能分类的准确率，并完善跨平台系统集成体验。