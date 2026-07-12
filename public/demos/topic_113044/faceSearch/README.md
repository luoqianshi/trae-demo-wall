# FaceSearch - 人脸表情与手势匹配系统

基于 Vue 3 + TypeScript + Vite 构建的实时人脸表情与手势识别匹配系统。

## 功能特性

- 📷 **实时摄像头捕捉**：开启/关闭摄像头，实时获取视频流
- 🔍 **人脸关键点检测**：使用 MediaPipe FaceMesh 提取 468 个面部关键点
- 🤸 **姿态估计**：使用 MediaPipe Pose 提取上半身骨架关键点
- ✋ **手势识别**：使用 MediaPipe Hands 识别手指张开/闭合状态
- 🎨 **实时绘制**：Canvas 叠加绘制面部轮廓、姿态骨架和手部骨架
- 📁 **本地表情库**：上传/管理本地表情图片，支持 jpg/png/gif
- 💾 **持久化存储**：使用 IndexedDB 保存表情数据
- 🎯 **特征匹配**：基于余弦相似度的表情匹配算法
- 🐛 **调试面板**：实时显示特征向量和匹配日志

## 技术栈

- **Vue 3** - 渐进式 JavaScript 框架（组合式 API）
- **TypeScript** - 类型安全的 JavaScript 超集
- **Vite** - 下一代前端构建工具
- **Pinia** - Vue 状态管理库
- **Tailwind CSS** - 原子化 CSS 框架
- **MediaPipe** - Google 开源的机器学习管道
  - `@mediapipe/face_mesh` - 人脸关键点检测
  - `@mediapipe/pose` - 人体姿态估计
  - `@mediapipe/hands` - 手部关键点检测

## 环境要求

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd faceSearch
```

### 2. 安装依赖

```bash
npm install
```

### 3. 启动开发服务器

```bash
npm run dev
```

开发服务器启动后，访问 http://localhost:5173 即可使用。

### 4. 构建生产版本

```bash
npm run build
```

构建产物将输出到 `dist/` 目录。

### 5. 预览生产版本

```bash
npm run preview
```

## 使用指南

### 开启摄像头

1. 点击页面顶部的「开启摄像头」按钮
2. 浏览器会弹出权限请求，点击「允许」
3. 等待模型加载完成（约 5-10 秒）
4. 模型加载完成后，摄像头画面会显示在左侧区域，并叠加关键点

### 上传表情

1. 确保摄像头已开启且正在检测
2. 做出想要匹配的表情/手势
3. 点击右下角的「+」悬浮按钮
4. 选择要上传的图片文件（支持 jpg/png/gif，可多选）
5. 图片会自动存储到本地表情库，并保存当前的特征向量

### 删除表情

1. 在底部表情列表中，找到要删除的表情
2. 点击表情右上角的红色「×」按钮
3. 表情会从列表和 IndexedDB 中移除

### Debug 模式

1. 点击左下角调试面板中的「Debug 模式」开关
2. 开启后，控制台会打印详细的匹配日志
3. 调试面板会实时显示当前特征向量的数值

## 特征向量说明

系统提取 11 维特征向量用于表情匹配：

| 特征 | 说明 | 范围 | 权重 |
|------|------|------|------|
| smile | 微笑程度 | 0-1 | 2.0 |
| mouthOpen | 嘴巴张开度 | 0-1 | 2.0 |
| leftBrow | 左眉高度 | 0-1 | 1.0 |
| rightBrow | 右眉高度 | 0-1 | 1.0 |
| headTilt | 头部倾斜角 | -1~1 | 1.0 |
| bodyTilt | 身体倾斜 | -1~1 | 1.0 |
| thumb | 拇指张开度 | 0-1 | 1.5 |
| indexFinger | 食指张开度 | 0-1 | 1.5 |
| middleFinger | 中指张开度 | 0-1 | 1.5 |
| ringFinger | 无名指张开度 | 0-1 | 1.5 |
| pinkyFinger | 小指张开度 | 0-1 | 1.5 |

## 项目结构

```
src/
├── components/
│   ├── CameraView.vue      # 摄像头视图组件
│   ├── DebugPanel.vue      # 调试面板组件
│   ├── EmojiList.vue       # 表情列表组件
│   └── ResultPanel.vue     # 结果展示面板
├── composables/
│   ├── useDrawer.ts        # Canvas 绘制逻辑
│   └── useMediaPipe.ts     # MediaPipe 推理逻辑
├── stores/
│   └── emojiStore.ts       # Pinia 状态管理
├── utils/
│   └── db.ts               # IndexedDB 数据库工具
├── App.vue                 # 主应用组件
├── main.ts                 # 应用入口
└── style.css               # 全局样式
```

## 注意事项

1. **模型加载**：首次访问时，MediaPipe 模型会从 CDN 下载，可能需要几秒时间
2. **摄像头权限**：浏览器需要摄像头权限才能正常使用
3. **性能要求**：建议使用现代浏览器（Chrome/Firefox/Edge），旧浏览器可能无法运行 WASM
4. **GIF 支持**：上传的 GIF 图片会自动循环播放
5. **数据存储**：表情数据存储在浏览器的 IndexedDB 中，清除浏览器数据会导致表情丢失

## License

MIT