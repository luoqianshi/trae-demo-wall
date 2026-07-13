# 银发助手 — TRAE AI创造力大赛 参赛作品

## 项目简介

银发助手是一个面向中老年人的AI生活互助平台，以「语音优先、极简交互」为核心，帮助3亿中国老年人跨越数字鸿沟。

## 作品结构

```
silver-life-assistant/
├── index.html              ← 产品原型（可交互演示）
├── style.css               ← 原型样式
├── app.js                  ← 原型交互逻辑
├── pitch.html              ← 参赛方案文档（原 silver-life-assistant.html）
├── assets/                 ← 资源文件
├── _shared/                ← 公共依赖
└── product/                ← 原始原型（已被 index.html 取代）
```

## 核心AI能力

1. **语音交互** — 原生 Web Speech API，无需额外配置即可语音提问
2. **AI智能问答** — 支持接入 DeepSeek API 实现真实对话，无API Key时自动降级为本地匹配
3. **步骤化教程** — AI匹配知识库，分步图文+语音播报
4. **前置条件检测** — 操作前自动检测是否满足必要条件

## 运行方式

直接用浏览器打开 `index.html`，无需任何后端服务。

## 技术栈

- 微信小程序原生框架设计
- 语音识别/合成（Web Speech API / 腾讯云ASR+TTS）
- AI意图匹配（本地规则 + DeepSeek API）
- ECharts 数据可视化
