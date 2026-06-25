# Changelog

## v1.3.0 — 2026-06-17

### 新增
- **LocalStorage 数据持久化**（任务 3）
  - 自动保存：卡片生成、拖拽结束、删除、清空时触发保存
  - 防抖保存（400ms）：拖拽过程中避免频繁写入，提升性能
  - 刷新恢复：页面加载时从 LocalStorage 恢复卡片位置与状态
  - 恢复时边界修复：根据当前画布尺寸重新约束越界卡片
  - beforeunload 兜底：页面卸载前强制保存未提交的防抖数据
  - 保存指示器：右下角显示「已保存 + 时间戳」，1.5s 后淡出
  - 存储键名版本化：`ai_cyber_whiteboard_v1_3`，避免与旧版本冲突

### 优化
- **画布边界溢出修复**
  - 拖拽边界约束改为「至少保留 80px 可见」：允许卡片部分拖出画布但防止完全丢失
  - 窗口 resize 监听（200ms 防抖）：窗口尺寸变化时自动重新约束所有卡片位置
  - 越界卡片自动回收到可视区域内

- **拖拽流畅度优化**
  - 引入 `requestAnimationFrame` 合并连续 mousemove/touchmove 事件
  - 拖拽时禁用 CSS transition（`transition: none`），保证跟手无延迟
  - 添加 `will-change: transform, left, top` 性能提示
  - 拖拽时增强阴影反馈（`0 16px 48px`）

- **优雅淡入淡出动画**
  - 卡片入场：`cardIn` 缩放+上浮+淡入（cubic-bezier 弹性曲线，错峰延迟）
  - 卡片退场：新增 `cardOut` 动画类，淡出+缩小+上移（300ms）
  - 画布提示：`canvas-hint` 类支持 opacity + scale 双重过渡
  - 保存指示器：opacity + translateY 滑入滑出
  - Toast 通知：保留原有淡入淡出

### 变更类型
- 新增 + 优化（在 v1.2.0 基础上增加持久化与性能优化）
