# CivicMate 办事不跑空

AI 材料预审与陪办助手 Demo（广东省办事场景）。

## 交付文档入口

- 最终交付说明：[docs/final-delivery.md](docs/final-delivery.md)
- 评委快速启动：[docs/judge-quickstart.md](docs/judge-quickstart.md)
- 浏览器验收记录：[docs/local-browser-acceptance.md](docs/local-browser-acceptance.md)

## 模型职责边界

| 模型 | 用途 | 接入方式 |
|------|------|----------|
| **DeepSeek** | 政务规则解释 / 材料审查 / 文本 fallback | `server/deepseek.ts`，Node 原生 fetch |
| **Ark 豆包视觉模型** | 图片材料识别（视觉理解） | `server/doubao.ts`，火山方舟 Responses API |

- DeepSeek 用于 `/api/review` 预审 + `/api/identify-materials` 文本降级。
- Ark 视觉模型用于 `/api/identify-materials` 图片识别优先路径。
- PDF 不走视觉模型，沿用元信息/文件名逻辑。
- 前端不直接调用任一模型，统一走后端接口。

## 环境变量配置

复制 `.env.example` 为 `.env` 并填入真实密钥：

```
cp .env.example .env
```

需要在 `.env` 中填写：

- `DEEPSEEK_API_KEY`：DeepSeek API Key（用于预审/文本 fallback）
- `ARK_API_KEY`：火山方舟 Ark API Key（用于图片视觉识别）

`.env.example` 仅含占位符，不含真实 key。`.env` 已被 `.gitignore` 忽略，不应提交到仓库。

### 当前默认 Ark 模型

- `ARK_MODEL=doubao-seed-2-1-pro-260628`
- `ARK_BASE_URL=https://ark.cn-beijing.volces.com/api/v3`

## 接口说明

| 接口 | 用途 |
|------|------|
| `GET /api/health` | 后端健康检查 |
| `GET /api/ai-status` | AI 配置状态（仅展示是否配置/模型名/baseUrl，**不返回 key**） |
| `POST /api/review` | 材料预审（本地规则 + DeepSeek） |
| `POST /api/identify-materials` | 材料类型辅助识别（multipart 上传，Ark 视觉优先 + DeepSeek 文本降级） |

## 演示闭环（第 7 轮）

首页提供 3 个一键演示场景，点击后自动填充事项/地区/情况/材料并跳到第 5 步，仍需点击"生成预审结果"触发 `/api/review`，不绕过正常流程。

| 演示场景 | serviceCode | 县级地区 | 办理人类型 |
|----------|-------------|----------|------------|
| 老年补贴申请（家属代办） | `elderly-subsidy` | 广州市 越秀区（440104） | 家属代办 |
| 居住证办理（本人办理） | `residence-permit` | 深圳市 南山区（440305） | 本人办理 |
| 医保报销材料整理（本人办理） | `medical-reimburse` | 珠海市 香洲区（440402） | 本人办理 |

结果页提供：

- **办事准备度摘要**：基于 ready/missing/uncertain 计算，标签为"材料基本齐备 / 仍有材料缺口 / 存在需人工确认项"，不出现"审核通过"字样。
- **复制清单**：使用浏览器 Clipboard API 复制纯文本清单（含事项/地区/办理人/已具备/缺失/待确认/老人友好清单/风险提示/免责声明），不含 API Key 或内部调试信息；剪贴板不可用时给出页面内提示。
- **打印页面**：调用 `window.print()`，不新增 PDF 依赖；打印样式隐藏步骤指示器/导航/上传区。

## 本地演示验收流程

无需真实 API Key、无需真实材料，未配置 Key 时仍可演示本地规则预审。

1. 运行 `npm run dev`（同时启动前端与后端）。
2. 打开浏览器访问前端地址（默认 `http://localhost:5173`）。
3. 在首页"一键演示场景"区域点击任一场景（老年补贴 / 居住证 / 医保报销），系统将自动填充事项、地区、情况、材料并跳到第 5 步。
4. 点击"生成预审结果"按钮触发 `/api/review`（本地规则预审，未配置 Key 时仍返回结果）。
5. 查看结果页的"办事准备度"摘要、已具备材料、缺失材料、待确认事项、老人友好清单。
6. 点击"复制清单"按钮，将纯文本清单复制到剪贴板（含免责声明，不含 API Key）。
7. 点击"打印页面"按钮，调用浏览器打印对话框（步骤指示器/导航/上传区已隐藏）。

> 说明：评委如需体验真实 AI 增强，可在 `.env` 中配置 `DEEPSEEK_API_KEY` 与 `ARK_API_KEY` 后重启服务，结果页 AI 状态徽标会显示"预审增强可用 / 图片识别可用"。未配置时显示"本地规则仍可演示"，演示主流程不受影响。

## 参赛演示脚本（评委讲解顺序）

1. **打开项目**：运行 `npm run dev`，浏览器访问 `http://localhost:5173`，首页展示后端状态与 AI 配置状态徽标（不暴露 Key）。
2. **选择一键演示场景**：点击首页"一键演示场景"中任一入口（老年补贴 / 居住证 / 医保报销），系统自动填充事项、地区、情况、材料并跳到第 5 步。
3. **生成预审结果**：点击"生成预审结果"按钮，触发 `/api/review`（本地规则预审，未配置 Key 时仍返回结果）。
4. **展示缺失材料与老人友好清单**：在结果页指出"办事准备度"摘要（材料基本齐备 / 仍有材料缺口 / 存在需人工确认项），逐一展示已具备材料、缺失材料、待确认事项、老人友好清单。
5. **展示复制清单 / 打印页面**：点击"复制清单"按钮，页面内显示绿色"已复制到剪贴板"提示；点击"打印页面"按钮调起浏览器打印对话框（步骤指示器/导航/上传区已隐藏）。
6. **说明真实 AI 可配置**：指出 AI 状态徽标，说明配置 `DEEPSEEK_API_KEY` 与 `ARK_API_KEY` 后可启用真实 AI 预审增强与图片识别，未配置时本地规则仍可演示。
7. **说明结果不代表官方审核通过**：指向结果页底部免责声明，强调"仅供材料准备参考，不代表官方审核通过，正式办理请以办事机关要求为准"。

## 验证命令

```
npm run typecheck
npm run build
npm run selfcheck
npm run identify-selfcheck
npm run identify-http-selfcheck
npm run ark-selfcheck
npm run ai-status-selfcheck
npm run live-ai-smoke
npm run demo-flow-selfcheck
```

### live-ai-smoke 真实联调说明

`npm run live-ai-smoke` **默认不会联网**，仅输出跳过说明并以 0 退出，保护安全并避免意外计费。

如需手动执行真实联网测试：

```
$env:LIVE_AI_SMOKE="1"; npm run live-ai-smoke
```

- 真实联网测试只使用**模拟文本**（如"老年补贴申请"模拟输入、Ark `input: "hello"`），**不使用真实材料**。
- 脚本只输出调用是否成功、模型名、响应前 80 字非敏感摘要，不输出 API Key、请求头、完整响应原文。
