# 聚点 - 多人位置推荐小程序

> 多人见面，一键找对地方

## 项目结构

```
judian-miniprogram/
├── app.js                 # 全局应用逻辑
├── app.json               # 全局配置（页面路由、导航栏、TabBar）
├── app.wxss               # 全局样式（玻璃卡片、渐变按钮、输入框等）
├── project.config.json    # 微信开发者工具配置
├── sitemap.json           # 小程序搜索索引配置
├── styles/
│   └── variables.wxss     # CSS 变量定义
├── pages/
│   ├── login/             # 登录页
│   │   ├── login.js
│   │   ├── login.json
│   │   ├── login.wxml
│   │   └── login.wxss
│   ├── register/          # 注册页
│   │   ├── register.js
│   │   ├── register.json
│   │   ├── register.wxml
│   │   └── register.wxss
│   ├── group/             # 组队详情页（首页）
│   │   ├── group.js
│   │   ├── group.json
│   │   ├── group.wxml
│   │   └── group.wxss
│   ├── filter/            # 筛选候选地页
│   │   ├── filter.js
│   │   ├── filter.json
│   │   ├── filter.wxml
│   │   └── filter.wxss
│   ├── vote/              # 投票结果页
│   │   ├── vote.js
│   │   ├── vote.json
│   │   ├── vote.wxml
│   │   └── vote.wxss
│   └── profile/           # 个人中心页
│       ├── profile.js
│       ├── profile.json
│       ├── profile.wxml
│       └── profile.wxss
└── images/                # 图片资源目录
```

## 页面说明

| 页面 | 路径 | 说明 |
|------|------|------|
| 登录 | `pages/login/login` | 手机号密码登录、快捷登录入口 |
| 注册 | `pages/register/register` | 创建账号、验证码、协议勾选 |
| 组队详情 | `pages/group/group` | 地图成员位置、需求状态、发起推荐 |
| 筛选候选地 | `pages/filter/filter` | 多维筛选、场地列表、智能重排 |
| 投票结果 | `pages/vote/vote` | 最佳推荐、Top3 排序、路线导航 |
| 个人中心 | `pages/profile/profile` | 用户资料、统计、菜单、偏好设置 |

## 视觉风格

- **深色主题**：以 `#0f0c29` 为底色，营造沉浸感
- **玻璃拟态**：卡片使用半透明背景 + 模糊效果
- **紫蓝渐变**：主色调为紫色 `#a855f7` 到青色 `#06b6d4` 的渐变
- **圆角设计**：卡片和按钮统一使用 16-30px 圆角

## 开发说明

1. 使用微信开发者工具打开本项目
2. 在 `project.config.json` 中修改 `appid` 为你的真实小程序 AppID
3. 在 `app.js` 中配置 `baseUrl` 为你的后端 API 地址
4. 图片资源使用 Unsplash 在线图片，生产环境建议替换为本地或 CDN 资源
5. 底部 TabBar 需要准备 `images/` 目录下的图标文件

## 技术栈

- 微信小程序原生开发
- 无第三方 UI 框架依赖
- 支持 iOS / Android 双端
