# Chrome扩展开发说明

## 功能
智联招聘页面一键投递表单自动填充

## 技术栈
- Manifest V3
- Vanilla JS
- Chrome Extension API (activeTab, storage, scripting)

## 文件说明
- `manifest.json` - 扩 展配置
- `content-script.js` - 页面注入脚本（DOM识别+表单填充）
- `background.js` - Service Worker（数据存储+逻辑调度）
- `popup/` - 用户配置面板（简历数据管理）