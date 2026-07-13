# MusicStage - 沉浸式音乐舞台

一款以粒子视觉、歌词舞台和电影级动态效果为核心的沉浸式音乐播放器。

## 核心特性

- **WebGL 粒子舞台**：四种视觉预设（默认、银河、波浪、萤火），动态粒子特效随音乐节奏变化
- **歌词舞台**：实时歌词同步，多层渲染效果
- **电影级视觉系统**：基于Three.js的3D粒子场景，支持音频实时分析
- **SVG玻璃质感**：精致的控制面板玻璃效果
- **天气电台**：根据天气推荐音乐
- **搜索播放**：支持网易云音乐搜索
- **3D歌单架**：右键唤起歌单管理
- **桌面歌词**：独立歌词窗口
- **壁纸模式**：银河星空待机壁纸

## 技术栈

- **前端**: HTML5 + CSS3 + JavaScript (ES6+)
- **3D引擎**: Three.js r128
- **动画**: GSAP
- **桌面框架**: Electron
- **音频分析**: Web Audio API + mpg123-decoder
- **音乐API**: NeteaseCloudMusicApi

## 开发运行

```bash
npm install
npm start
```

## 构建

```bash
npm run build:win
```

生成 Windows NSIS 安装包，产物位于 `dist/`。

## 项目结构

```
MusicStage/
├── public/
│   ├── index.html          # 主UI、CSS、歌词、粒子舞台
│   ├── wallpaper.html       # 壁纸模式
│   ├── desktop-lyrics.html  # 桌面歌词
│   └── vendor/              # 第三方依赖
├── desktop/                 # Electron主进程
│   ├── main.js
│   ├── preload.js
│   └── overlay-preload.js
├── build/                   # 构建资源
├── server.js                # 本地API服务
├── dj-analyzer.js           # 节奏分析
└── package.json
```

## 第三方音乐平台说明

MusicStage 不是网易云音乐或任何音乐平台的官方客户端。

项目中的第三方平台接入仅用于个人学习、本地客户端体验和用户自有账号的播放辅助。请遵守对应平台的用户协议和版权规则。

## 快捷键

| 按键 | 功能 |
|------|------|
| 空格 | 播放/暂停 |
| ← → | 上一首/下一首 |
| S | 搜索 |
| F | 全屏 |
| ESC | 关闭面板 |
| 右键 | 打开歌单架 |

## 授权

MIT License
