# AI 摄影助手 - TRAE 创意开发大赛

> 智能取景，即拍对好。AI 摄影助手是一款基于手机摄像头的 AI 实时辅助摄影应用。

## 项目简介

AI 摄影助手通过手机摄像头实时分析拍摄画面，结合 AI 算法提供：
- **6 种专业构图模板**：三分法、黄金分割、对角线、中心构图、对称构图
- **专业参数建议**：ISO、光圈、快门、白平衡、EV 实时推荐
- **人物站位参考**：人像模式下自动显示最佳站位框
- **光线分析**：实时检测环境光线强度
- **AI 智能对话**：上传照片或描述需求获取专业建议
- **独立穿搭分析**：拍照或上传，AI 智能识别风格与搭配

## 快速开始

### 方式一：直接打开
双击 `ai-photo-assistant-app.html` 在浏览器中即可体验。

### 方式二：本地服务器
```bash
# Python 3
python -m http.server 8080

# Node.js
npx serve .
```

然后访问 `http://localhost:8080`

## 在线部署

### Vercel 一键部署

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/ai-photo-assistant)

详细步骤见 [DEPLOY.md](./DEPLOY.md)

## 技术栈

- 纯 HTML5 + CSS3 + 原生 JavaScript（无任何依赖）
- Canvas API 用于照片生成与处理
- MediaDevices API 用于真实摄像头访问
- 完全响应式设计，支持手机与桌面浏览器

## 浏览器兼容性

- iOS Safari 14+
- Android Chrome 90+
- 桌面 Chrome / Edge / Firefox / Safari

## 体验说明

- 推荐在 **手机浏览器** 中体验以获得最佳效果
- 首次使用需授予 **相机权限**，或点击"使用演示模式"无需权限
- DEMO 模式下会生成模拟取景画面，所有功能均可正常体验

## 项目结构

```
.
├── ai-photo-assistant-app.html  # 主应用（单文件）
├── package.json                  # 项目配置
├── vercel.json                   # Vercel 部署配置
├── netlify.toml                  # Netlify 部署配置
├── DEPLOY.md                     # 部署指南
└── README.md                     # 项目说明
```

## 关于

本项目为 **TRAE AI 创意开发大赛** 参赛作品。
