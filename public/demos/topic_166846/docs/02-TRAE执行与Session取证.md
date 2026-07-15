# TRAE 执行与 Session 取证手册

比赛要求的 Session ID 必须来自 TRAE 中真实发生的任务。下面不是“补材料话术”，而是三段可以真实改进作品、产生代码差异和验证证据的 Builder 任务。请在 TRAE IDE 中打开项目根目录，并为每段任务新建独立对话。

## 执行原则

- 每个 Prompt 单独新建一个 Session，不要把三段塞进同一对话；
- 让 TRAE 实际读取文件、修改代码或文档、执行验证，不能只让它复述方案；
- 每段结束前要求 TRAE 总结“修改文件、关键取舍、验证命令、验证结果”；
- 截图要同时看得见 TRAE 对话和相应代码差异/终端结果；
- 双击对应对话复制真实 Session ID，粘贴到作品帖；不要手工编造 ID。

## Session 1｜AIUI 核心链路审计与真实改进

将下面整段复制给 TRAE：

```text
你正在维护一个准备参加 TRAE AI 创造力大赛初赛的 Rokid AIUI 项目“跨语言沟通助手”。请先完整阅读 AGENTS.md、app.json、app.js、pages/index/index.ink、lib/backend-config.js、backend/app/main.py、README.md，不要直接猜测。

目标：审计并加固“中文设置场景 → 持续英文识别 → YOU/STAFF 轮次判断 → 中文翻译 → 刷新下一句建议 → 后端不可达时降级”的真实运行链路。

要求：
1. 先列出状态流、依赖、用户交互门禁和至少 3 个可能失效的边界；
2. 找出至少 1 个能在当前源码中证实的健壮性、错误处理或状态一致性问题，并直接修改源码解决；不要为了制造改动而改文案；
3. 保持 full-screen Interactive InkView、448×352 单绿界面、语音优先、GlobalHook 只控制整段暂停/恢复等约束；
4. 不得把 DashScope API Key 写进前端或日志；不得读取或输出 backend/.env；
5. 运行与你的改动成比例的静态检查或测试；
6. 新建 contest-submission/evidence/trae-sessions/session-01-architecture.md，写清发现、改动文件、关键 diff、执行命令、结果和仍存在的限制。

完成后给我一段适合截屏的简短总结：问题 → 修改 → 验证，不要只说“已完成”。
```

建议截图：TRAE 总结 + 关键 diff + 通过的验证结果。  
记录 Session ID：`.3379245433487736:edbc663799fb5fdd9233903963b380fd_6a577e0c5221f8a253b0a167.6a5785595221f8a253b0a169.6a5785573f7c073714451ea4:Trae CN.T(2026/7/15 21:04:25)`

## Session 2｜单文件评审 Demo 交互与可访问性回归

将下面整段复制给 TRAE：

```text
请聚焦 contest-submission/demo/index.html。这是初赛评审无需眼镜、无需登录、无需 API Key 即可打开的单文件交互 Demo。

目标：用真实浏览器完整走通酒店入住、餐厅过敏、医院挂号三个场景，并修复你实际发现的问题。

必须验证：
1. 三个场景切换后，场景、初始对话、建议、表达目的和轮次都正确重置；
2. 每个场景至少连续推进 3 轮，YOU / STAFF 原文、中文和下一句建议顺序正确；
3. “换一种说法”可循环，“朗读当前建议”在支持/不支持 speechSynthesis 时都不会让页面报错；
4. 自定义英文为空、命中关键词、未命中关键词三种输入都有清楚反馈，Enter 可提交；
5. 1440px、900px 和 390px 宽度下无关键内容遮挡，键盘焦点清楚，控制台无未处理异常；
6. 页面没有外链脚本、字体、图片或运行时网络请求，断网仍可完成核心体验。

发现问题后直接修改 index.html，并重新验证。新建 contest-submission/evidence/trae-sessions/session-02-web-demo.md，记录测试矩阵、实际修复、前后表现和最终结果。不要伪造浏览器结果；如果环境无法执行某项，明确写未验证。

完成后总结最能体现 TRAE 参与的 3 个具体改动和验证证据。
```

建议截图：浏览器 Demo + TRAE 修复说明 + 控制台无错误。  
记录 Session ID：`.3379245433487736:04d1481c51bd5238215c7cf670e0c8c2_6a577e0c5221f8a253b0a167.6a5789d55221f8a253b0a200.6a5789d43f7c073714451ea5:Trae CN.T(2026/7/15 21:23:33)`

## Session 3｜提交事实核对、测试与可复现打包

将下面整段复制给 TRAE：

```text
现在进行初赛提交前的最终审计。请阅读 contest-submission 下所有文档、AIUI 源码、backend 源码和 README.md。

目标：确保作品帖中的每一项功能都有源码或可操作 Demo 支撑，并产出可以复现的最终 ZIP。

要求：
1. 逐项核对 docs/01-初赛Demo作品帖-可直接发布.md 中的产品形态、用户、3 个核心功能、技术架构、降级策略和限制；凡是源码无法证明的表述必须删除或改成准确口径；不得擅自编造链接、Session ID 或截图；
2. 检查 backend/.env、API Key、.venv、缓存文件没有进入任何提交包，也不要在输出中显示密钥值；
3. 运行 backend 单元测试、HTML 静态检查，以及你能完成的浏览器回归；
4. 运行 contest-submission/build-submission.ps1，确认生成的 HTML ZIP 可解压并直接打开 index.html；
5. 新建 contest-submission/evidence/trae-sessions/session-03-release.md，记录最终文件列表、测试结果、ZIP 大小和 SHA-256；
6. 最后给出“可以提交 / 仍缺个人信息”的明确结论和缺项清单。

不要进行公网部署，不要填写虚假报名链接，不要伪造 TRAE Session ID。
```

建议截图：测试全绿 + ZIP 与哈希 + 缺项清单。  
记录 Session ID：`.3379245433487736:87f92ba0cdcdb756302f0a9c5415fb42_6a577e0c5221f8a253b0a167.6a578ca95221f8a253b0a291.6a578ca83f7c073714451ea6:Trae CN.T(2026/7/15 21:35:37)`

## Session ID 填写位置

以上 3 个 ID 已同步填写到：

- `docs/01-初赛Demo作品帖-可直接发布.md` 的 TRAE 实践过程；
- `submission-manifest.json` 的 `traeSessions` 数组；
- 社区最终作品帖正文。

## 三张开发过程截图最低标准

1. `trae-01-架构与核心链路.png`：看到任务要求、代码 diff 和验证结果；
2. `trae-02-交互Demo回归.png`：看到 HTML Demo、修复点和浏览器验证；
3. `trae-03-测试与打包.png`：看到测试通过、生成 ZIP 和 SHA-256。

截图放入 `contest-submission/evidence/trae-sessions/`。若一次 Session 有多个关键画面，可以多放，但不要用三张几乎相同的截图凑数量。
