# 图幻 3D · 眼动立体卡片

纯前端单页网页工具，用户上传图片并添加文字后，可通过摄像头追踪人眼位置，让卡片跟随视线做 3D 倾斜转动，并带有光泽、阴影效果。所有处理均在本地浏览器完成，无需上传服务器。

## 核心功能

- 🖼️ 本地图片上传（支持拖拽）
- ✍️ 主标题、副标题编辑与样式调整
- 👁️ 摄像头眼动追踪控制卡片倾斜
- 🖱️ 鼠标模拟模式（无摄像头时可用）
- ✨ 3D 倾斜 + 动态光泽 + 投影
- 💾 一键导出 PNG 卡片

## 技术栈

- 原生 HTML5 / CSS3 / JavaScript
- MediaPipe Face Mesh（本地加载，人脸/眼动追踪）
- CSS 3D Transform（perspective / rotateX / rotateY）

## 运行方式

```bash
python start_server.py
```

浏览器访问：http://localhost:8000

## 项目结构

```
├── index.html                  # 首页入口
├── card.html                   # 3D 卡片制作主工具
├── start_server.py             # 本地 HTTP 服务器
├── lib/mediapipe-face-mesh/    # MediaPipe Face Mesh 本地模型与运行库
└── README.md                   # 项目说明
```

## 使用说明

1. 打开首页，点击“开始制作 3D 卡片”
2. 上传一张背景图片
3. 输入主标题、副标题，调整颜色、字号和位置
4. 允许浏览器摄像头权限，移动头部观察卡片 3D 转动
5. 或直接切换到“鼠标模拟”模式，用鼠标控制
6. 点击“导出立体卡片 PNG”保存成品

## 注意事项

- 首次加载 MediaPipe 模型需要几秒钟，请耐心等待。
- 摄像头仅在本地使用，视频流不会上传。
- 推荐使用 Chrome / Edge 浏览器，并确保摄像头可用。
