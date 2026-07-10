# 图匠 TuCraft - 全能网页图片处理工具

【学习工作赛道】报名作品，纯前端实现的图片处理工具，所有操作均在浏览器本地完成，不上传服务器。

## 功能概览

- 图片裁剪（自由裁剪 / 按比例裁剪，支持拖拽移动与手柄缩放）
- 调整大小（支持重置）
- 压缩（质量滑块控制）
- 旋转翻转（90°/180°/270° 快捷按钮 + 自定义角度滑块 -180°~180°）
- 滤镜调色（亮度、对比度、饱和度、模糊、色相 + 预设滤镜）
- 格式转换（JPG / PNG / WebP）
- 文字水印（实时预览、画布内拖拽调整位置）
- 证件照生成（AI 人像分割 + 一键换背景色）
- 批量处理（压缩、调整大小、格式转换）

## 环境要求

- [Node.js](https://nodejs.org/) 12+

## 启动方法

在项目根目录执行：

```bash
node server.js
```

服务启动后，在浏览器中访问：

```
http://localhost:3001
```

按 `Ctrl+C` 停止服务。

## 目录结构

```
tucraft-image-tool/
├── tucraft-image-tool.html    # 主页面
├── server.js                  # Node.js 静态服务
├── README.md                  # 本文件
└── _shared/
    ├── fonts/                 # 自定义字体文件
    └── js/                    # MediaPipe 模型文件（本地加载用）
```

## 技术栈

- HTML5 Canvas 2D API
- Vanilla JavaScript（零框架依赖）
- MediaPipe Selfie Segmentation（AI 人像分割）
- CSS3（渐变、动画、响应式布局）

## 注意事项

- 证件照功能的 AI 模型文件较大（约 250KB），首次使用时会从本地 `_shared/js/` 目录加载。
- 如果直接双击打开 `tucraft-image-tool.html`（`file://` 协议），模型文件可能因浏览器 CORS 策略无法加载，请务必通过 `server.js` 启动后访问。
