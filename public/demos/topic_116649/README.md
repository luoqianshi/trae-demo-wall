# 心桥 · HeartBridge

> AI 亲子沟通预演与推进工具

心桥让家长和孩子分别在各自的私密空间表达困惑，先为每一端生成可立即使用的建议，再在原文隔离的前提下异步识别双方共同事件并升级分端建议，持续跟进事件是否缓和。

---

## 快速体验

### PowerShell 启动包

双击当前目录的 **`启动心桥.bat`**。脚本会通过 PowerShell 清理端口 `4173`、启动本地静态服务并自动打开默认浏览器。

如果需要完全免环境、无需端口的版本，请使用项目同级目录 **`HeartBridge-Standalone/心桥Demo.html`**，直接双击即可打开，并保留真实 LLM 调用能力。

### 手动开发启动

```bash
cd app
npm install
npm run dev
```

浏览器打开 Vite 输出的本地地址即可。

### 一键演示

无需配置模型，点击界面上的 **"一键演示"** 按钮即可运行完整固定脚本演示，观察家长端与孩子端全流程闭环。

### 配置真实 AI 模型

在 **设置 → AI 模型配置** 中填写：

| 字段 | 说明 |
|---|---|
| API 地址 | 模型服务地址（只填域名也可，系统自动补全路径）|
| API Key | 你的 Key，仅保存在本地浏览器，不上传 |
| 模型名称 | 如 `gpt-4o`、`claude-3-5-sonnet-20241022`、`deepseek-v4-flash` |

支持 **OpenAI 兼容**和 **Anthropic 原生**两种协议，自动识别。

---

## 项目结构

```
idea2-parent-child-bridge/
├── app/                     前端应用（React + Vite）
│   ├── src/
│   │   ├── screens/         各功能页面
│   │   ├── components/      通用组件
│   │   ├── store/           Zustand 状态管理
│   │   └── lib/             AI 调用、事件分类、安全校验
│   └── stress-results/      双端压力测试报告
├── server/                  静态文件托管服务
├── Dockerfile               容器部署配置
├── docker-compose.yml
└── 启动心桥Demo.bat          一键启动脚本
```

---

## 生产部署

**静态部署**

```bash
cd app
npm run build
# 将 app/dist 上传到任意静态托管平台
```

**Docker 部署**

```bash
docker compose up --build
```

---

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | React 19 + Vite |
| 状态管理 | Zustand + persist |
| 样式 | Tailwind CSS |
| 图标 | Lucide React |
| AI 协议 | OpenAI-compatible / Anthropic-compatible |
| 测试 | Vitest |
| Lint | oxlint |

---

## 测试

```bash
cd app

# 全量回归（当前 224 项通过，外部长压测按配置跳过）
npm test

# 真实 LLM 端到端测试
E2E_LLM_BASE_URL=https://... E2E_LLM_API_KEY=sk-... E2E_LLM_MODEL=gpt-4o \
  npx vitest run src/lib/e2eRealLLM.test.js

# 双端压力测试（任一场景，约 100 秒）
E2E_LLM_BASE_URL=https://... E2E_LLM_API_KEY=sk-... E2E_LLM_MODEL=gpt-4o \
  npx vitest run src/lib/e2eDualAsync5xStress.test.js -t '第1次：'
```

---

## 注意事项

- Key 仅保存在浏览器 `localStorage`，不经过心桥服务器
- 浏览器直连需要模型服务允许 CORS
- 共享设备体验后请在"模型配置"中清除本地数据
- 当前版本为 Demo，数据保存在浏览器本地，刷新不丢失，清除浏览器缓存会重置
