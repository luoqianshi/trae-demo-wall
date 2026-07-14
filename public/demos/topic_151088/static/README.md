# 静态资源目录

## 目录结构

```
static/
├── tabs/           # 底部Tab栏图标
├── images/         # 通用图片资源
└── icons/          # 图标资源
```

## Tab栏图标说明

由于 uni-app 原生 tabBar 需要真实的图片文件，以下是建议的图标尺寸和格式：

- 尺寸：81px * 81px (2x) / 121px * 121px (3x)
- 格式：PNG
- 命名：
  - home.png / home-active.png
  - goals.png / goals-active.png
  - profile.png / profile-active.png

当前项目使用自定义 TabBar 组件（CustomTabBar.vue），使用 emoji 作为图标占位，
如需使用真实图标，请将图片放入 tabs/ 目录，并修改 pages.json 中的 tabBar 配置。
