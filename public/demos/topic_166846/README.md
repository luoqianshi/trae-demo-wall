# 跨语言沟通助手

面向 Rokid AI 眼镜的 AIUI 前端 Demo。它把翻译从“给出一句译文”升级为现场沟通副驾驶：用户自己开口，AI 负责理解场景、跟踪双方上下文，并持续推荐下一句自然英文。

## 初赛提交包

`contest-submission/` 已包含无需眼镜、账号或 API Key 的单文件交互评审版、可直接发布的 Demo 作品帖、TRAE Session 取证任务、演示视频脚本、部署指南和自动打包脚本。提交前从 `contest-submission/README-先看.md` 开始。

## Demo 体验

- 左侧 `AI SUGGESTS`：根据中文场景和双方上下文持续推荐下一句英文回答。
- 右侧 `LIVE DIALOGUE`：自动显示 YOU / STAFF 的英文原文与中文翻译。
- 唤醒词：开始中文语音识别，可直接描述场景或说控制指令。
- “开始同传”或 `GlobalHook` 镜腿键：完成一次麦克风交互授权并开启持续同传。
- 同传开启后，双方每句话都自动识别，不需要逐句按键。
- 即使眼镜暂时无法访问实时后端，也会进入 `HOST LIVE` 连续识别：每次识别结束后自动续听，并继续调用宿主 AI 翻译和生成建议。
- 中文场景识别完成后会直接开始监听，不再要求先按镜腿键。为了兼容不同眼镜固件，每句话结束后都会销毁当前识别会话并自动建立下一轮，而不是依赖容易卡死的长连接识别会话。
- AI 自动把对方回复翻译成中文，并在每次 STAFF 回复后刷新左侧下一句建议。
- 主流程不需要进入按钮导航模式。

## 项目结构

```text
cross-language-communication-assistant/
├── AGENTS.md
├── app.js
├── app.json
├── backend/              # DashScope/Qwen 安全代理，不打包进眼镜端
├── lib/
│   └── backend-config.js # 眼镜端只配置代理地址，不保存 API Key
└── pages/
    └── index/
        └── index.ink
```

## 接入文档 API

不要把百炼 / DashScope API Key 写进 AIUI 前端，也不要把后端代理打包进眼镜应用。正确链路是：

```text
Rokid AIUI 前端
  -> 你的 backend 代理
    -> Qwen3.6 Flash 文本模型：生成左侧下一句建议
    -> Qwen3.5 LiveTranslate Realtime：生成右侧实时同传
```

本项目已经预留了这个代理：

- `backend/`：FastAPI 代理服务。
- `backend/.env.example`：填写 `DASHSCOPE_API_KEY` 的模板。
- `lib/backend-config.js`：眼镜端配置代理地址。

本地接入步骤：

1. 启动代理：

   ```powershell
   cd backend
   py -3.10 -m venv .venv
   .\.venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   Copy-Item .env.example .env
   notepad .env
   python run.py
   ```

2. 只在 `backend/.env` 里填写真实 Key：

   ```dotenv
   DASHSCOPE_API_KEY=sk-你的真实Key
   ```

3. 打开 `http://127.0.0.1:8787/health`，看到 `text_configured: true` 和 `realtime_configured: true` 即可。

4. 在电脑运行 `ipconfig` 找到局域网 IPv4，例如 `192.168.1.20`，然后改 `lib/backend-config.js`：

   ```js
   export const BACKEND_HTTP_URL = 'http://192.168.1.20:8787';
   ```

5. 重新打包 / 部署 AIUI 前端。眼镜和电脑必须在同一 Wi-Fi 或同一局域网内。

如果眼镜打不开 `http://192.168.0.102:8787/health`，请用“管理员 PowerShell”运行下面这一条。它只允许本地子网访问本机 8787 端口：

```powershell
netsh advfirewall firewall add rule name="Rokid AIUI Backend 8787" dir=in action=allow protocol=TCP localport=8787 remoteip=LocalSubnet profile=private,public
```

如果电脑启用了 Clash、VPN 或系统代理，请把 `192.168.0.0/24` 加入直连 / 绕过代理列表。

生产环境建议把 `backend/` 部署到 HTTPS/WSS 域名，并设置 `PROXY_ACCESS_TOKEN`，前端只保存这个受限 token。

## 运行说明

将本目录作为 AIUI 应用导入支持 `.ink` 单文件页面的 Rokid AIUI 开发环境。首页路由已在 `app.json` 中注册为 `pages/index/index`。

本项目必须作为 **full-screen interactive page / Interactive InkView** 打开。conversation-flow card 只能展示，无法触发按钮、硬件键事件和需要交互门禁的麦克风能力。

眼镜端操作顺序：

1. 从聊天卡片进入全屏 Interactive InkView。
2. 说唤醒词，然后用中文描述场景和沟通目标。
3. AI 理解场景后，左侧给出第一句英文建议。
4. 说“开始同传”；如果当前宿主没有把控制短语传给页面，按一次 `GlobalHook` 镜腿键。这个动作只在开启或恢复整段会话时需要。
5. 右上状态变成 `AUTO LIVE` 后，照着左侧建议对对方说，右侧自动记录 YOU 的英文和中文。
6. 对方回答时，右侧自动记录 STAFF 的英文和中文。
7. 每次 STAFF 回复完成后，左侧自动刷新下一句英文回答建议。
8. 再按一次 `GlobalHook` 可暂停；恢复时再按一次即可。

说话方判定规则：场景设置后的第一句优先视为 `YOU`；与左侧建议相似的句子固定视为 `YOU`；下一轮回复视为 `STAFF`。每次 `STAFF` 说完后都会刷新左侧建议。眼镜只有一个麦克风，无法提供声纹级身份识别，因此双方应尽量一人一句并在换人时短暂停顿。

唤醒后还可以直接说：

- “换一句”：生成另一种英文表达。
- “读一下”：播放当前英文建议。
- “切换场景”：切换预置场景。
- “下一轮”：推进预置演示。
- “开始同传”：开启或恢复持续实时同传。
- “暂停同传”：结束当前持续同传。

项目会探测宿主 `LanguageModel` 能力：

- 可用时，`换一句` 会依据当前中文场景生成上下文建议。
- 不可用时，界面继续使用内置建议和完整 Demo 对话，不影响展示。

语音识别通过宿主 `SpeechRecognition` 的结果事件回填，TTS 使用 `wx.speech.playTTS`，需要宿主提供麦克风与音频权限。若语言模型不可用，真实语音仍会写入对话记录，但中文翻译和上下文建议会显示降级提示；`下一轮`预置演示不受影响。

## 交互排查

- 能看到页面但唤醒词和镜腿键无响应：当前仍是 conversation-flow card，请切换为全屏 Interactive InkView。
- 语音无法开始：确认 InkView 仍处于 interactive 状态，并已授予麦克风权限。
- 状态停在 `READY`：实时服务已经准备好，但录音尚未通过交互门禁；说“开始同传”或在全屏页按一次镜腿键。
- 状态停在 `STARTING`：检查是否已授予麦克风权限；若底部显示交互授权失败，确认不是聊天卡片，再按一次镜腿键。
- 自动同传没有启动：确认电脑后端 `/health` 可从眼镜所在局域网访问。
- 显示 `HOST LIVE`：后端未连通，但连续识别、轮次区分、翻译与建议仍会工作；修复网络后重新打开页面即可恢复 Qwen 流式同传。
- 对方英文识别不准：请让双方尽量一人一句、说完稍作停顿；单麦克风无法做到硬件级声纹分离。

## 视觉约束

- 固定 448 × 352 画布。
- 黑色背景、单一绿色透明度层级。
- 用描边与半透明表面表达层级，不使用阴影和第二种色相。
- 内容超出时由右侧 `scroll-view` 承载。
- UI 文案不使用 emoji。
