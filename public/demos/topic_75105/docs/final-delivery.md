# CivicMate 办事不跑空 — 最终交付说明

## 项目名称

CivicMate 办事不跑空

## Demo 定位

面向广东省县级政务办事场景的 AI 材料预审与陪办助手 Demo。帮助群众在前往办事窗口前核对材料是否齐备，减少因材料遗漏导致的"跑空"。

## 核心价值

- **减少群众办事材料遗漏**：通过本地规则 + AI 双重预审，提前发现缺失材料。
- **支持广东省县级地区选择**：内置 124 条广东省县级行政区划数据（含 21 个地级市），覆盖全省真实县级单位。
- **三类事项快速演示**：老年补贴申请、居住证办理、医保报销材料整理，对应真实办事场景。
- **本地规则 + 真实 AI 可选增强**：未配置 API Key 时使用本地规则预审；配置后可启用 DeepSeek 文本预审增强与 Ark 豆包视觉识别。
- **图片材料可走 Ark 豆包视觉识别**：上传图片材料后优先调用 Ark 视觉模型识别材料类型，PDF 沿用元信息判断。
- **未配置 Key 时仍可演示本地规则**：评委无需准备 API Key 即可完整体验演示流程。

## 已实现能力清单

### 前端

| 能力 | 说明 |
|------|------|
| 五步流程 | 首页 → 选择事项 → 选择地区 → 填写情况 → 材料登记与结果 |
| 一键演示场景 | 3 个场景（老年补贴/居住证/医保报销），点击自动填充并跳到第 5 步 |
| 县级地区两级联动 | 先选地级市，再选县级单位，数据来自真实行政区划 |
| 材料勾选 + 文件上传 | 支持手动勾选材料 + 可选上传图片/PDF 辅助识别 |
| AI 配置状态徽标 | 显示"预审增强可用/图片识别可用/本地规则仍可演示"，不暴露 Key |
| 后端健康状态 | 首页显示后端在线/离线状态 |
| 办事准备度摘要 | 基于 ready/missing/uncertain 计算，标签为"材料基本齐备/仍有材料缺口/存在需人工确认项" |
| 结果四块展示 | 已具备材料、缺失材料、待确认事项、老人友好清单 |
| 复制清单 | 浏览器 Clipboard API 复制纯文本清单，含免责声明，不含 API Key |
| 打印页面 | `window.print()` 调起打印，打印样式隐藏步骤/导航/上传区/状态徽标 |
| 移动端适配 | 420px 断点优化，按钮堆叠、材料单列、步骤可横向滚动 |

### 后端

| 能力 | 说明 |
|------|------|
| `GET /api/health` | 后端健康检查 |
| `GET /api/ai-status` | AI 配置状态（仅返回 configured/model/baseUrl，**绝不返回 Key**） |
| `POST /api/review` | 材料预审（本地规则 + DeepSeek，AI 失败自动 fallback 到本地） |
| `POST /api/identify-materials` | 材料识别（multipart 上传，Ark 视觉优先 + DeepSeek 文本降级） |
| 本地规则硬约束 | AI 结果中的 ready/missing 必须基于本地 review，不可被 AI 改写 |
| userLabel 保留 | multipart 中文文件名 userLabel 在所有路径正确保留（latin1→UTF-8 转码） |
| 内存存储不落盘 | 上传文件使用 multer memoryStorage，不写入磁盘 |

### 自检脚本

| 脚本 | 断言数 | 说明 |
|------|--------|------|
| `npm run selfcheck` | 21 | mergeAiWithLocal 本地规则硬约束 |
| `npm run identify-selfcheck` | 33 | userLabel 在所有识别路径保留 |
| `npm run identify-http-selfcheck` | 17 | HTTP multipart 全链路 userLabel 保留 |
| `npm run ark-selfcheck` | 30 | Ark 配置/解析/fallback |
| `npm run ai-status-selfcheck` | 19 | AI 状态接口不暴露 Key |
| `npm run demo-flow-selfcheck` | 62 | 演示场景合法性 + 纯函数校验 |
| `npm run live-ai-smoke` | — | 真实 AI 联调冒烟（默认跳过，LIVE_AI_SMOKE=1 触发） |

## 未实现 / 后续增强项

| 项目 | 说明 |
|------|------|
| PDF 内容识别 | 当前仅基于文件名/元信息判断，未做 PDF 文本提取 |
| 真实政务规则库 | 当前使用 Demo 示例规则，未接入官方政务规则 API |
| 用户账号系统 | 无登录/注册，无历史记录持久化 |
| 多语言支持 | 仅中文界面 |
| 真实材料测试 | 自检脚本均使用模拟数据，未用真实材料验证 |
| 移动端原生应用 | 当前为 Web Demo，未做原生 App |

## 本地启动方式

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器（前端 + 后端同时启动）
npm run dev

# 3. 打开浏览器
# 前端：http://localhost:5173
# 后端：http://localhost:3001
```

## 一键演示流程

1. 启动后打开 http://localhost:5173
2. 在首页"一键演示场景"区域点击任一场景
3. 系统自动填充事项/地区/情况/材料并跳到第 5 步
4. 点击"生成预审结果"
5. 查看办事准备度、缺失材料、老人友好清单
6. 点击"复制清单"或"打印页面"

## AI Key 配置说明

复制 `.env.example` 为 `.env` 并填入真实密钥：

```bash
cp .env.example .env
```

需要在 `.env` 中填写：

- `DEEPSEEK_API_KEY`：DeepSeek API Key（用于预审增强/文本 fallback）
- `ARK_API_KEY`：火山方舟 Ark API Key（用于图片视觉识别）

**配置后**：结果页 AI 状态徽标显示"预审增强可用 / 图片识别可用"。
**未配置时**：显示"本地规则仍可演示"，演示主流程不受影响。

`.env.example` 仅含占位符，不含真实 Key。`.env` 已被 `.gitignore` 忽略，不应提交到仓库。

## 安全与隐私说明

- `.env` 文件被 `.gitignore` 忽略，不会提交到仓库。
- `.env.example` 仅含占位符，不含真实 Key。
- `/api/ai-status` 接口只返回 configured/model/baseUrl，**绝不返回 API Key**。
- 上传文件使用内存存储（memoryStorage），不写入磁盘。
- 复制清单文本不含 API Key、模型名、baseUrl 或内部调试信息。
- 自检脚本不依赖真实 API Key，不执行真实联网调用。
- `live-ai-smoke` 默认跳过真实联网，需手动设置 `LIVE_AI_SMOKE=1` 才触发。
- 真实联网测试只使用模拟文本，不使用真实材料。

## 免责声明

本 Demo 由 AI 与本地规则结合生成预审结果，仅供材料准备参考，**不代表官方审核通过**。正式办理请以广东当地办事机关要求为准。

## 自检命令清单

```bash
npm run typecheck
npm run build
npm run selfcheck
npm run identify-selfcheck
npm run identify-http-selfcheck
npm run ark-selfcheck
npm run ai-status-selfcheck
npm run demo-flow-selfcheck
npm run live-ai-smoke
```

## 浏览器验收记录

详见 [docs/local-browser-acceptance.md](local-browser-acceptance.md)。

## 评委快速启动

详见 [docs/judge-quickstart.md](judge-quickstart.md)。
