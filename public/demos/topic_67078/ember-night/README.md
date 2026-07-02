# 晚安角落 (Ember Night)

> 把手机从"高刺激入口"变成"低刺激陪伴式入睡训练工具"

一款基于 CBT-I / ACT-I / MBSR 理论的移动端 Web 助眠应用。通过渐进式内容衰减机制，引导用户自然入睡。

## 快速开始

1. 部署到任意 HTTPS 静态托管（Vercel / Netlify / GitHub Pages）
2. 手机浏览器访问
3. 建议"添加到主屏幕"获得全屏体验

本地测试：
```bash
npx serve .
# 或 python3 -m http.server 8080
```

## 特性

- 纯前端 PWA，无需后端
- 离线可用（Service Worker 缓存）
- 渐进式衰减引擎（画面/音量自动减弱）
- 多场景交互（窗户 → 码头/房间 → 呼吸 → 寂静）
- 利用手机传感器检测姿态辅助判断

## 技术栈

Vanilla JS + CSS3 + Canvas 2D + Web Audio API + PWA

## 文档

详细技术规范见 `docs/sleepwell-spec.md`

## 音频说明

当前包含合成占位音频。正式上线前建议从 Freesound.org 获取高质量素材替换（详见规范文档第 6 章）。

## License

MIT
