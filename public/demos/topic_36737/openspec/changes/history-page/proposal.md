## Why

需求第4项「点餐历史概览」尚未实现。后端已有 `/api/history` 接口和 `order_history` 表，但小程序前端缺少历史页面，用户无法回顾本次使用中的历次点餐记录。同时现有聊天页面 UI 有优化空间（思考提示文案、底部导航缺失）。

## What Changes

- 新增小程序「历史记录」页面，展示本地/服务端保存的点餐记录列表
- 每条记录显示：时间、用户输入摘要、推荐菜品缩略图+名称、总价
- 点击记录可展开查看完整菜品详情
- 新增底部 TabBar 导航（聊天 / 历史）
- 优化聊天页面视觉细节（与历史页面风格统一）

## Capabilities

### New Capabilities
- `history-list`: 点餐历史记录列表页面，含数据加载、列表渲染、详情展开交互

### Modified Capabilities
- `chat-ui`: 新增底部 TabBar 导航入口，聊天页面与历史页面共享导航结构

## Impact

- 小程序前端：新增 `pages/history/` 页面（wxml/wxss/js/json）
- 修改 `app.json`：添加 tabBar 配置和 history 页面路由
- 修改 `pages/chat/`：适配 tabBar 布局
- 后端无需改动（`/api/history` 已就绪）
- 设计风格需遵循 frontend-design skill 规范，避免 AI slop 美学
