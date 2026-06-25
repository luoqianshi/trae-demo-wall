# 心声树洞 —— 技术架构文档

## 1. 架构设计

纯前端架构，使用 localStorage 模拟后端数据持久化。

- 前端展示层：Vue 3 + TypeScript + TailwindCSS
- 数据层：localStorage（用户、树洞、对话、情绪日记、徽章）
- 模拟服务层：mock AI 回复生成器、白噪音 Web Audio 生成器

## 2. 技术描述

- 前端：Vue 3 + TypeScript + Vite + TailwindCSS 3
- 路由：Vue Router 4
- 状态管理：vue-zustand
- 图标：lucide-vue-next
- 图表：Chart.js 4
- 构建工具：Vite 5

## 3. 路由定义

| 路由 | 用途 |
|-----|-----|
| /login | 匿名登录页 |
| / | 首页：情绪打卡 + 快捷入口 |
| /treehole | 心声树洞列表 |
| /treehole/publish | 发布新树洞 |
| /companion | AI 情感陪伴对话 |
| /first-aid | 情绪急救包 |
| /profile | 我的主页 |
| /profile/weekly | 情绪周报 |

## 4. 数据模型

### 4.1 用户 User

```ts
interface User {
  id: string;
  nickname: string;
  createdAt: number;
  streakDays: number;
  badges: string[];
}
```

### 4.2 树洞 TreeHole

```ts
interface TreeHole {
  id: string;
  content: string;
  emotion: 'anxiety' | 'lonely' | 'anger' | 'lost' | 'heal';
  anonymousName: string;
  hugs: number;
  createdAt: number;
  ownerId?: string;
}
```

### 4.3 对话消息 ChatMessage

```ts
interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  createdAt: number;
}
```

### 4.4 情绪日记 MoodEntry

```ts
interface MoodEntry {
  id: string;
  mood: 1 | 2 | 3 | 4 | 5;
  note: string;
  createdAt: number;
}
```

### 4.5 徽章 Badge

```ts
interface Badge {
  id: string;
  name: string;
  desc: string;
  icon: string;
  unlocked: boolean;
}
```

## 5. 目录结构

```
src/
├── components/       # 通用组件
├── views/            # 页面组件
├── stores/           # Zustand 状态
├── utils/            # 工具函数（白噪音、AI 模拟）
├── router/           # 路由
└── App.vue
```
