# 趣享本地

基于 TRAE 的本地精彩活动发现与规划助手

## 项目简介

趣享本地是一个帮助用户发现和规划本地精彩活动的 Web 应用，提供活动搜索、智能推荐、日程管理等功能。

## 技术栈

- **前端**: HTML5 + CSS3 + JavaScript (ES6+)
- **样式**: 响应式设计，支持移动端、平板端、桌面端
- **路由**: Hash Router（单页面应用）
- **服务器**: Node.js 本地开发服务器
- **UI 风格**: 毛玻璃效果、卡片式布局

## 快速开始

### 环境要求

- Node.js 12+

### 启动项目

```bash
# 进入项目目录
cd liu-wa-zhi-xuan

# 启动本地服务器
node server.js
```

启动后在浏览器访问：`http://localhost:14525`

## 项目结构

```
liu-wa-zhi-xuan/
├── index.html              # 入口 HTML 文件
├── server.js               # Node.js 本地开发服务器
├── README.md               # 项目说明文档
├── css/
│   ├── global.css          # 全局样式
│   └── premium.css         # 高级样式（毛玻璃等效果）
├── js/
│   ├── app.js              # 主应用逻辑
│   ├── router.js           # 路由系统
│   ├── components/         # 组件
│   │   ├── modal.js        # 模态框组件
│   │   └── toast.js        # Toast 提示组件
│   ├── data/
│   │   └── mock-data.js    # 模拟数据
│   └── store/
│       └── storage.js      # 本地存储管理
└── .trae/
    └── specs/              # 项目规格文档
        ├── navigation-fix-optimize/   # 导航栏优化
        ├── comprehensive-audit-fix/   # 全面审核修复
        └── ...                        # 其他规格文档
```

## 功能特性

- 🏠 **首页**: 城市定位、搜索入口、分类导航、AI 推荐、热门活动
- 🔍 **发现**: 活动列表、筛选排序、多视图切换
- 📅 **日程**: 活动日程管理、日历视图
- ❤️ **收藏**: 已收藏活动管理
- 📝 **预约**: 预约记录查看
- 👤 **我的**: 个人中心、设置、订阅管理

## 响应式适配

| 设备类型 | 断点 | 导航方式 |
|---------|------|---------|
| 移动端 | < 1024px | 底部导航栏 |
| 桌面端 | ≥ 1024px | 左侧侧边栏 |

## 开发说明

### 修改样式

主要样式文件在 `css/global.css`，高级效果在 `css/premium.css`。

### 修改逻辑

主要业务逻辑在 `js/app.js`，路由配置在 `js/router.js`。

### 添加页面

1. 在 `js/app.js` 中添加渲染函数
2. 在 `setupRoutes()` 中注册路由
3. 在底部导航栏和侧边栏添加入口

## 端口配置

默认端口为 `14525`，如需修改请编辑 `server.js` 文件。

## 浏览器兼容性

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 注意事项

- 项目使用本地存储（localStorage）保存用户数据
- 当前为模拟数据版本，无后端依赖
- 建议使用现代浏览器以获得最佳体验
