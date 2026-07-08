## 1. TabBar 图标资源

- [x] 1.1 生成4张TabBar图标PNG（chat/chat-active/history/history-active），81×81px，风格与现有UI配色一致
- [x] 1.2 将图标放入 miniprogram/assets/ 目录

## 2. TabBar 导航配置

- [x] 2.1 修改 app.json 添加 tabBar 配置（两个tab：聊天、历史）
- [x] 2.2 在 app.json pages 数组中添加 history 页面路由
- [x] 2.3 调整 chat 页面底部间距适配 TabBar

## 3. 历史记录页面

- [x] 3.1 创建 pages/history/ 目录及四个文件（wxml/wxss/js/json）
- [x] 3.2 实现历史数据加载逻辑（调用 /api/history?limit=20）
- [x] 3.3 实现记录卡片列表渲染（时间、输入摘要、菜品缩略图、总价）
- [x] 3.4 实现卡片展开/收起详情交互
- [x] 3.5 实现空状态展示
- [x] 3.6 应用 frontend-design 视觉规范（茶楼菜单质感、排版、动效）

## 4. 验证

- [ ] 4.1 在微信开发者工具中预览，确认 TabBar 切换正常
- [ ] 4.2 确认历史记录加载、展开、空状态均正常
- [ ] 4.3 确认聊天页面消息在 Tab 切换后保持不丢失
- [ ] 4.4 确认两个页面视觉风格统一且有各自辨识度
