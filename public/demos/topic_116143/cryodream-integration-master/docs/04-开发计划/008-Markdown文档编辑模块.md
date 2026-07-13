# 008 - Markdown 文档编辑模块

> 状态：**规划中**
> 创建时间：2026-06-23
> 技术选型：Milkdown v7（WYSIWYG Markdown 编辑器）

---

## 需求概述

在现有项目中增加**文档管理**功能：
- 支持新建文档（默认 Markdown 格式）
- 实时编辑（WYSIWYG 所见即所得，非左右分栏）
- UI 风格与现有项目一致（shadcn/ui + Tailwind CSS）
- 文档列表管理（查看、编辑、删除）

---

## 技术选型：Milkdown v7

### 为什么选 Milkdown

| 维度 | 评估 |
|------|------|
| 编辑模式 | WYSIWYG（Typora 风格），符合"实时编辑"需求 |
| React 支持 | `@milkdown/react` 原生支持 |
| 主题定制 | CSS 变量主题系统，可对接 Tailwind |
| 架构 | 基于 ProseMirror + Remark，插件驱动，按需引入 |
| 活跃度 | 8.5K GitHub Star，周下载 184K，v7.21.2 持续更新 |
| 许可证 | MIT |

### 核心依赖

```bash
npm install @milkdown/kit @milkdown/react @milkdown/theme-nord @milkdown/preset-commonmark @milkdown/preset-gfm
```

---

## 模块拆分

### 模块 1：后端 — 文档数据模型与接口

**涉及文件**：
- 新建 `model/entity/Document.java` — 文档实体
- 新建 `model/dto/document/DocumentAddRequest.java` — 新建请求
- 新建 `model/dto/document/DocumentUpdateRequest.java` — 更新请求
- 新建 `model/dto/document/DocumentQueryRequest.java` — 查询请求
- 新建 `model/vo/DocumentVO.java` — 视图对象
- 新建 `mapper/DocumentMapper.java` — DAO
- 新建 `service/DocumentService.java` + `impl/DocumentServiceImpl.java` — 业务层
- 新建 `controller/DocumentController.java` — 控制器

**数据库表设计**：

```sql
CREATE TABLE document (
  id          VARCHAR(64)  PRIMARY KEY,
  project_id  VARCHAR(64)  NOT NULL,          -- 所属项目
  title       VARCHAR(200) NOT NULL,            -- 文档标题
  content     TEXT,                             -- Markdown 内容
  format      VARCHAR(20) DEFAULT 'markdown',  -- 格式（预留）
  tags        VARCHAR(500),                     -- 标签（逗号分隔）
  status      VARCHAR(20) DEFAULT 'draft',      -- draft/published
  is_delete   INT DEFAULT 0,
  create_time DATETIME DEFAULT CURRENT_TIMESTAMP,
  update_time DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**API 接口**：

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 新建文档 | POST | `/document/add` | 创建空白文档 |
| 更新文档 | POST | `/document/update` | 更新标题/内容 |
| 删除文档 | POST | `/document/delete` | 逻辑删除 |
| 查询文档 | GET | `/document/get` | 获取单个文档（含内容） |
| 分页查询 | POST | `/document/list/page` | 文档列表（不含内容） |

---

### 模块 2：前端 — 文档列表页

**涉及文件**：
- 新建 `features/documents/document-api.ts` — API 调用
- 新建 `features/documents/document-list-page.tsx` — 文档列表页
- 新建 `routes/_authenticated/documents/index.tsx` — 路由
- 修改 `components/layout/data/sidebar-data.ts` — 侧边栏导航

**功能**：
- 标准列表布局（参考知识库列表页风格）
- 搜索、新建、编辑、删除
- 点击文档进入编辑页

---

### 模块 3：前端 — Markdown 编辑器组件

**涉及文件**：
- 新建 `features/documents/editor/milkdown-editor.tsx` — Milkdown 编辑器封装
- 新建 `features/documents/editor/milkdown-theme.ts` — 自定义主题（对接 Tailwind）
- 新建 `features/documents/document-edit-page.tsx` — 文档编辑页
- 新建 `routes/_authenticated/documents/$docId.tsx` — 编辑页路由

**Milkdown 编辑器封装要点**：
- 使用 `@milkdown/react` 的 `useEditor` hook
- 预设插件：commonmark + gfm（表格、删除线、任务列表）
- 自定义主题：覆盖 CSS 变量，匹配 shadcn/ui 风格
- 内容同步：onChange 回调获取 Markdown 源码
- 自动保存：debounce 1s 后自动调用更新接口

**编辑页布局**：
```
┌─────────────────────────────────────┐
│ ← 返回  文档标题（可编辑）   保存状态  │
├─────────────────────────────────────┤
│                                     │
│         Milkdown WYSIWYG 编辑区      │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

---

### 模块 4：前端 — 侧边栏导航与国际化

**涉及文件**：
- 修改 `components/layout/data/sidebar-data.ts` — 添加文档导航项
- 修改 `locales/zh.json` + `locales/en.json` — 国际化文案

---

## 开发顺序

```
模块 1（后端） → 模块 2（列表页） → 模块 3（编辑器） → 模块 4（导航与国际化）
```

预计改动文件数：~15 个（新建 ~10，修改 ~5）

---

## 风险与注意事项

1. **Milkdown 包体积**：按需引入插件，避免全量导入
2. **主题适配**：Milkdown 默认主题（Nord）需覆盖 CSS 变量以匹配 shadcn/ui 风格
3. **自动保存冲突**：debounce 机制避免频繁请求，需处理并发编辑场景
4. **ProseMirror 学习曲线**：Milkdown 基于 ProseMirror，深度定制需了解其架构
