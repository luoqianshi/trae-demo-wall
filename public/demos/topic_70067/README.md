# AI脸谱工坊 · 初赛 Demo

一个用腾讯混元3D生成戏曲脸谱模型，并支持3D打印的非遗文创小程序 Demo。本作品为 TRAE 创意大赛初赛阶段提交版本，由 TRAE 完成开发。

## 体验方式

### 在线体验

部署后回填公开链接：

- 主链接：`<在 Cloudflare Pages 或 GitHub Pages 部署后回填>`
- 备份链接：`<可选，腾讯云 COS 或 Vercel>`

### 离线体验

1. 解压 `AI脸谱工坊_Demo.zip`。
2. 双击 `index.html`，使用 Chrome、Edge 或微信内置浏览器打开。
3. 选择戏曲角色、主色和纹样，自动生成混元3D提示词。
4. 点击“一键复制提示词”，再点击“前往混元3D生成”体验完整链路。

## 浏览器兼容

- 推荐：Chrome 最新版、Edge 最新版。
- 兼容：微信内置浏览器、移动端 Safari。
- 注意：本地双击 `index.html` 时，部分浏览器会限制 `<model-viewer>` 加载远程脚本和 GLB 文件，页面会自动展示金色占位环。如需看到完整 3D 旋转效果，请使用在线链接体验。

## 3D 模型来源

- 真实 GLB：由腾讯混元3D 根据 Demo 中“一键生成”的提示词生成。
- 兜底素材：当无可用 GLB 时，使用 CSS / SVG 渲染的可旋转脸谱占位预览，保证离线体验不出现破图。

## 文件结构

```
ai-face-mask-workshop/
├── index.html              # Demo 主页
├── README.md               # 本文件
├── sessions.md             # TRAE Session ID 记录
└── assets/
    └── screenshots/        # 发帖用关键步骤截图
```

## 参赛信息

- 赛道：生活娱乐。
- 报名帖链接：`<报名审核通过后回填>`
- Demo 帖链接：`<发帖后回填>`
- 大赛官网：https://www.trae.cn/ai-creativity
