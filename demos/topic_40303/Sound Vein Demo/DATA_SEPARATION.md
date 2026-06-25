# 声脉APP 数据分离文档

## 概述

本项目将数据分为两类：
1. **前端静态配置**（`data/` 目录）：UI 布局、菜单、设置项、主题等不依赖后端的配置
2. **后端 Mock 数据**（`mock/` 目录）：用户数据、家族成员、AI 模型、故事等应由后端 API 返回的数据

## 目录结构

```
d:\shengmai\
├── 声脉APP.html          # 主应用页面
├── data-loader.js        # 数据加载器（加载前端配置 + Mock 数据）
├── data/                 # 前端静态配置
│   ├── app-config.json   # 应用配置（tabbar、主题、方言参考等）
│   ├── menus.json        # 操作菜单配置
│   └── settings.json     # 设置页面 UI 配置
└── mock/                 # 后端 Mock 数据
    └── backend-mock.json # 所有后端依赖数据
```

## 数据分类详情

### 前端静态配置（保留在 `data/` 目录）

| 文件 | 内容 | 说明 |
|------|------|------|
| `data/menus.json` | 采集/AI/对话/详情页操作菜单 | UI 动作表配置，纯前端逻辑 |
| `data/settings.json` | 设置页标题、录音质量选项、关于、反馈、协议 | UI 结构和静态文本 |
| `data/app-config.json` | tabbar、方言筛选、方言地图、主题、首页快捷入口、采集标签 | UI 布局和静态参考数据 |

### 后端 Mock 数据（迁移至 `mock/backend-mock.json`）

| 数据项 | 原 JSON 文件 | 新位置 | 对应 API 端点 |
|--------|-------------|--------|---------------|
| `familyMembers` | `data/family-members.json`（已删除） | `mock/backend-mock.json` → `familyMembers` | `GET /api/family-members` |
| `ai.models` | `data/ai-data.json`（已删除） | `mock/backend-mock.json` → `ai.models` | `GET /api/ai/models` |
| `ai.chatHistory` | `data/ai-data.json`（已删除） | `mock/backend-mock.json` → `ai.chatHistory` | `GET /api/ai/chat-history` |
| `ai.recentSummaries` | `data/ai-data.json`（已删除） | `mock/backend-mock.json` → `ai.recentSummaries` | `GET /api/ai/recent-summaries` |
| `ai.replies` | `data/ai-data.json`（已删除） | `mock/backend-mock.json` → `ai.replies` | `GET /api/ai/replies` |
| `stories` | `data/stories.json`（已删除） | `mock/backend-mock.json` → `stories` | `GET /api/stories` |
| `user.profile` | `data/settings.json` → `pages.profile` | `mock/backend-mock.json` → `user.profile` | `GET /api/user/profile` |
| `user.security` | `data/settings.json` → `pages.security` | `mock/backend-mock.json` → `user.security` | `GET /api/user/security` |
| `user.phone` | `data/settings.json` → `pages.phone` | `mock/backend-mock.json` → `user.phone` | `GET /api/user/phone` |
| `user.privacy` | `data/settings.json` → `pages.privacy` | `mock/backend-mock.json` → `user.privacy` | `GET /api/user/privacy` |
| `user.recordingQuality` | `data/settings.json` → `pages.quality`（当前标记） | `mock/backend-mock.json` → `user.recordingQuality` | `GET /api/user/recording-quality` |
| `search.hotWords` | `data/app-config.json` → `searchHotWords` | `mock/backend-mock.json` → `search.hotWords` | `GET /api/search/hot-words` |
| `stats.home` | `data/app-config.json` → `homeStats` | `mock/backend-mock.json` → `stats.home` | `GET /api/stats/home` |

## 数据加载流程

```
页面加载
    ↓
data-loader.js 启动
    ↓
并行 fetch 所有数据源：
  ├── data/menus.json         (前端配置)
  ├── data/settings.json      (前端配置)
  ├── data/app-config.json    (前端配置)
  └── mock/backend-mock.json  (后端 Mock 数据)
    ↓
parseBackendMockData() 解析 Mock 数据：
  ├── 派生 familyMembers, aiModels, chatHistory 等别名
  ├── 合并用户数据到 settings.pages
  └── 派生 searchHotWords, homeStats
    ↓
调用 onAppDataReady() 回调
    ↓
渲染页面
```

## 后端迁移指南

当后端 API 就绪后，按以下步骤迁移：

### 步骤 1：修改 `data-loader.js`

将 `MOCK_SOURCES` 中的单一文件替换为多个 API 端点：

```javascript
// 修改前
var MOCK_SOURCES = {
  backendMock: 'mock/backend-mock.json'
};

// 修改后
var API_SOURCES = {
  familyMembers:  'https://api.example.com/api/family-members',
  aiModels:       'https://api.example.com/api/ai/models',
  chatHistory:    'https://api.example.com/api/ai/chat-history',
  recentSummaries:'https://api.example.com/api/ai/recent-summaries',
  aiReplies:      'https://api.example.com/api/ai/replies',
  stories:        'https://api.example.com/api/stories',
  userProfile:    'https://api.example.com/api/user/profile',
  userSecurity:   'https://api.example.com/api/user/security',
  userPhone:      'https://api.example.com/api/user/phone',
  userPrivacy:    'https://api.example.com/api/user/privacy',
  searchHotWords: 'https://api.example.com/api/search/hot-words',
  homeStats:      'https://api.example.com/api/stats/home'
};
```

### 步骤 2：更新 `parseBackendMockData()` 函数

根据新的数据源结构调整别名派生逻辑。

### 步骤 3：添加认证头（如需要）

在 `fetchJson()` 函数中添加 Authorization 头：

```javascript
fetch(fullUrl, {
  cache: 'no-store',
  headers: {
    'Authorization': 'Bearer ' + getToken()
  }
})
```

### 步骤 4：删除 Mock 文件

确认所有 API 正常工作后，删除 `mock/backend-mock.json`。

## 修改数据指南

### 修改前端 UI 配置
编辑 `data/` 目录下对应的 JSON 文件，刷新页面即可。

### 修改后端 Mock 数据
编辑 `mock/backend-mock.json`，刷新页面即可。

## 运行方式

必须通过 HTTP 服务器访问（不能用 `file://` 直接打开）：

```bash
# 在项目目录下启动
python -m http.server 8080
```

浏览器访问：`http://localhost:8080/声脉APP.html`
