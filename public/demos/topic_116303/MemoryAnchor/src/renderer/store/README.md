# Zustand 状态管理文档

## 概述

本项目使用 Zustand 进行状态管理，包含 5 个主要 Store，每个 Store 都支持：
- TypeScript 类型定义
- 持久化（persist 中间件）
- 开发工具（devtools 中间件）
- 异步操作和错误处理
- IPC 调用（通过 window.electronAPI）

## Store 列表

### 1. CollectionStore（收藏状态管理）

**文件位置**: `src/renderer/store/collectionStore.ts`

**主要状态**:
- `items`: 收藏列表
- `currentCollection`: 当前查看的收藏详情
- `filter`: 筛选条件（tags、sourceType、isFavorite、isRead等）
- `sort`: 排序条件（sortBy、sortOrder）
- `page` / `pageSize`: 分页状态

**主要操作**:
- `fetchCollections()`: 获取收藏列表
- `createCollection()`: 创建新收藏
- `updateCollection()`: 更新收藏
- `deleteCollection()`: 删除收藏
- `toggleFavorite()`: 切换收藏状态
- `markAsRead()`: 标记为已读
- `setFilter()`: 设置筛选条件
- `setSort()`: 设置排序条件

**使用示例**:
```typescript
import { useCollectionStore } from '@/store';

// 获取收藏列表
const { items, loading, fetchCollections } = useCollectionStore();

// 创建新收藏
const collection = await useCollectionStore.getState().createCollection({
  url: 'https://example.com',
  title: 'Example Page',
});

// 切换收藏状态
await useCollectionStore.getState().toggleFavorite(collectionId);
```

### 2. SearchStore（搜索状态管理）

**文件位置**: `src/renderer/store/searchStore.ts`

**主要状态**:
- `query`: 搜索查询文本
- `results`: 搜索结果列表
- `type`: 搜索类型（fulltext、semantic、hybrid）
- `filter`: 搜索筛选条件
- `history`: 搜索历史记录
- `tagSuggestions`: 标签建议

**主要操作**:
- `search()`: 执行搜索
- `searchMore()`: 加载更多结果
- `addHistory()`: 添加搜索历史
- `clearHistory()`: 清空历史
- `fetchTagSuggestions()`: 获取标签建议
- `setFilter()`: 设置筛选条件

**使用示例**:
```typescript
import { useSearchStore } from '@/store';

// 执行搜索
await useSearchStore.getState().search('keyword');

// 获取搜索结果
const { results, total, isSearching } = useSearchStore();

// 添加搜索历史
useSearchStore.getState().addHistory({
  query: 'keyword',
  type: 'hybrid',
  timestamp: new Date().toISOString(),
  resultCount: 10,
});
```

### 3. ConfigStore（配置状态管理）

**文件位置**: `src/renderer/store/configStore.ts`

**主要状态**:
- `config`: 应用配置（AppConfig）
- `loading`: 加载状态
- `isInitialized`: 是否已初始化

**主要操作**:
- `loadConfig()`: 加载配置
- `updateConfig()`: 更新配置
- `resetConfig()`: 重置配置
- `validateConfig()`: 验证配置
- `updateGeneralConfig()`: 更新通用配置
- `updateAppearanceConfig()`: 更新外观配置
- `updateAIConfig()`: 更新 AI 配置

**使用示例**:
```typescript
import { useConfigStore } from '@/store';

// 加载配置
await useConfigStore.getState().loadConfig();

// 更新外观配置
await useConfigStore.getState().updateAppearanceConfig({
  theme: 'dark',
  fontSize: 'medium',
});

// 获取当前配置
const { config } = useConfigStore();
```

### 4. UIStore（界面状态管理）

**文件位置**: `src/renderer/store/uiStore.ts`

**主要状态**:
- `currentPage`: 当前页面
- `pageParams`: 页面参数
- `navigationHistory`: 导航历史
- `sidebar`: 侧边栏状态（collapsed、width）
- `dialogs`: 对话框状态
- `notifications`: 通知消息

**主要操作**:
- `navigateTo()`: 导航到页面
- `goBack()`: 返回上一页
- `toggleSidebar()`: 切换侧边栏
- `openCreateDialog()`: 打开创建对话框
- `addNotification()`: 添加通知
- `clearNotifications()`: 清空通知

**使用示例**:
```typescript
import { useUIStore } from '@/store';

// 导航到详情页
useUIStore.getState().navigateTo('detail', { id: '123' });

// 打开创建对话框
useUIStore.getState().openCreateDialog('https://example.com');

// 显示通知
useUIStore.getState().addNotification({
  type: 'success',
  message: '操作成功',
  duration: 3000,
});
```

### 5. AIStore（AI 状态管理）

**文件位置**: `src/renderer/store/aiStore.ts`

**主要状态**:
- `tasks`: AI 任务列表
- `currentProvider`: 当前 AI 提供商
- `serviceStatus`: AI 服务状态
- `loading`: 加载状态

**主要操作**:
- `generateSummary()`: 生成摘要
- `generateTags()`: 生成标签
- `generateKeyPoints()`: 生成要点
- `generateEmbedding()`: 生成嵌入向量
- `testConnection()`: 测试连接
- `checkAllServices()`: 检查所有服务状态
- `getTask()`: 获取任务
- `getTasksByCollection()`: 获取指定收藏的任务

**使用示例**:
```typescript
import { useAIStore } from '@/store';

// 生成摘要
const result = await useAIStore.getState().generateSummary({
  content: 'Long text content...',
  maxLength: 200,
});

// 测试 AI 连接
const testResult = await useAIStore.getState().testConnection('openai');

// 获取任务状态
const task = useAIStore.getState().getTask('summary-123');
```

## 中间件配置

### Persist 中间件

所有 Store 都使用 persist 中间件进行状态持久化：

```typescript
persist(
  (set, get) => ({ ... }),
  {
    name: 'store-name',
    partialize: (state) => ({
      // 只持久化必要的状态
      filter: state.filter,
      pageSize: state.pageSize,
    }),
  }
)
```

### DevTools 中间件

在开发环境中，所有 Store 都启用 devtools 中间件：

```typescript
devtools(
  persist(...),
  { name: 'StoreName', enabled: isDev }
)
```

## 类型定义

所有 Store 都有完整的 TypeScript 类型定义：

- **共享类型**: `src/shared/types/`
  - `collection.ts`: 收藏相关类型
  - `search.ts`: 搜索相关类型
  - `config.ts`: 配置相关类型
  - `ai.ts`: AI 相关类型

- **Store 类型**: 每个 Store 文件中定义了对应的状态接口

## IPC 调用

所有异步操作都通过 `window.electronAPI` 调用主进程：

```typescript
// 示例：调用 IPC 获取收藏列表
const response = await window.electronAPI.collection.list(params);

if (response.success && response.data) {
  // 处理成功响应
} else {
  // 处理错误
  setError(response.error || '操作失败');
}
```

## 错误处理

所有异步操作都有统一的错误处理：

1. 设置 loading 状态为 true
2. 清除之前的错误
3. 执行异步操作
4. 根据结果更新状态
5. 设置 loading 状态为 false

## 最佳实践

### 1. 选择性使用状态

使用 Zustand 的选择器避免不必要的重渲染：

```typescript
// 只获取需要的状态
const items = useCollectionStore((state) => state.items);
const loading = useCollectionStore((state) => state.loading);

// 避免这样（会导致每次都重渲染）
const { items, loading, total, ... } = useCollectionStore();
```

### 2. 异步操作处理

```typescript
// 正确的异步操作处理
const handleCreate = async () => {
  const result = await useCollectionStore.getState().createCollection(input);
  if (result) {
    useUIStore.getState().addNotification({
      type: 'success',
      message: '创建成功',
    });
  }
};
```

### 3. 状态重置

```typescript
// 重置单个 Store
useCollectionStore.getState().reset();

// 重置所有 Store（需要自行实现）
resetAllStores();
```

## 验证

运行验证脚本检查所有 Store 是否正确配置：

```typescript
import { verifyAllStores } from '@/store/verification';

// 在开发环境中运行验证
if (process.env.NODE_ENV === 'development') {
  verifyAllStores();
}
```

## 总结

本项目使用 Zustand 实现了完整的状态管理系统，包括：

✅ 5 个主要 Store（Collection、Search、Config、UI、AI）
✅ TypeScript 完整类型定义
✅ Persist 中间件支持（持久化到 localStorage）
✅ DevTools 中间件支持（开发环境调试）
✅ 异步操作和错误处理
✅ IPC 调用集成
✅ 完整的状态操作函数

所有 Store 都遵循统一的设计模式，易于使用和维护。