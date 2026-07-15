# ReadMate Process 文档

> 模块职责、数据流、开发过程记录
> 文档版本：v1.0 · 最后更新：2026-07-05

## 1. 模块职责矩阵

### 1.1 六层架构总览

```
┌─────────────────────────────────────────┐
│  app.py  (应用入口 / 整合层)              │
├─────────────────────────────────────────┤
│  ui/         UI 层  ← PyQt6 交互          │
├─────────────────────────────────────────┤
│  agents/     Agent 层  ← 智能体编排       │
├─────────────────────────────────────────┤
│  services/   服务层  ← 外部能力封装       │
├─────────────────────────────────────────┤
│  tools/      工具层  ← 可插拔工具系统     │
├─────────────────────────────────────────┤
│  infra/      基础设施层  ← 底层能力       │
├─────────────────────────────────────────┤
│  core/       核心层  ← 配置/日志/异常/事件 │
└─────────────────────────────────────────┘
```

### 1.2 各模块职责

#### `core/` 核心层

| 模块 | 职责 | 关键接口 |
|---|---|---|
| `config.py` | 统一配置管理（JSON + 环境变量，单例） | `get_config()`, `Config.get/set/save` |
| `logger.py` | 按天滚动日志，保留 7 天 | `get_logger(name)` |
| `exceptions.py` | 异常分级体系 | `ReadMateError` → `ConfigError/AgentError/ToolError/LLMError/ValidationError` |
| `events.py` | 线程安全事件总线（发布订阅） | `EventBus.publish/subscribe` |

#### `agents/` Agent 层

| 模块 | 职责 | 关键接口 |
|---|---|---|
| `base.py` | BaseAgent 抽象基类 | `name`, `run(input)` |
| `orchestrator.py` | 编排器，协调多个 Agent | `Orchestrator.execute` |
| `selection_agent.py` | 选区 Agent，处理选中文字的提问 | `SelectionAgent.run` |

#### `tools/` 工具层

| 模块 | 职责 | 关键接口 |
|---|---|---|
| `base.py` | ToolBase 抽象基类 + ToolRegistry 注册表 | `ToolRegistry.register/get/list_tools/execute` |
| `memory_search.py` | 屏幕记忆检索工具 | `MemorySearchTool` |
| `clipboard.py` | 剪贴板工具 | `ClipboardTool` |

工具系统设计为可插拔：新工具继承 `ToolBase`，调用 `registry.register()` 即可被 Agent 调用。

#### `services/` 服务层

| 模块 | 职责 | 关键接口 |
|---|---|---|
| `llm.py` | LLM 服务，封装 MiniMax API 流式调用 | `LLMService.ask_stream/ask_custom_stream/ask_followup_stream` |

#### `ui/` UI 层

| 模块 | 职责 | 关键接口 |
|---|---|---|
| `float_button.py` | 浮动按钮（预设动作 + 自定义提问） | `FloatButton.show_at/schedule_close/close_self` |
| `answer_panel.py` | 答案面板（流式输出 + 追问 + 拖动） | `AnswerPanel.start_expand/_force_close` |
| `styles.py` | 集中样式表 | `STYLE_FLOAT_BTN/STYLE_ACTION_BTNS/STYLE_PANEL/STYLE_INPUT` |

#### `infra/` 基础设施层

| 模块 | 职责 | 关键接口 |
|---|---|---|
| `selection.py` | 全局鼠标监听 + 模拟 Ctrl+C 读剪贴板 | `SelectionMonitor.start/stop` |
| `memory.py` | 屏幕记忆（基于 screenpipe） | `ScreenMemory.start/stop/get_latest/get_recent` |
| `history.py` | SQLite WAL 模式历史记录持久化 | `HistoryStore.init_db/add_record/get_recent_records/get_stats/clear_all` |

---

## 2. 数据流

### 2.1 选区提问主流程

```
[infra/selection.py]
  pynput 监听鼠标抬起
        ↓
  _on_click: 检查 _checking 标记（防并发）
        ↓
  _delayed_check (新线程, 200ms 延迟)
        ↓
  _try_clipboard: 模拟 Ctrl+C → 读剪贴板 → 恢复原内容
        ↓
  text 非空? ──┬── 是 → on_selection(text, x, y)
              └── 否 → on_deselection()
        ↓
[app.py SelectionBridge]
  selection_signal / deselection_signal (跨线程到主线程)
        ↓
[app.py ReadMateApp]
  _on_selection: 物理像素 → 逻辑像素 (DPI 适配)
        ↓
  FloatButton(text, app).show_at(x+12, y+18)
        ↓
[ui/float_button.py]
  显示按钮 + 淡入动画 + 启动 5s 超时定时器
```

### 2.2 触发动作流程

```
[ui/float_button.py]
  用户点击预设动作 / 提交自定义问题
        ↓
  _ask(action) / _ask_custom()
        ↓
  记录 self.geometry() 作为 origin_rect
        ↓
  AnswerPanel(text, action, origin_rect, app).start_expand()
        ↓
[ui/answer_panel.py]
  展开动画 (280ms, OutCubic) + 淡入 (220ms)
  同时启动后台线程 _call_ai_stream
        ↓
[services/llm.py]
  LLMService.ask_stream() → OpenAI SDK stream=True
        ↓
  for chunk in stream:
      stream_chunk.emit(chunk)  ← 通过 pyqtSignal 跨线程
        ↓
[ui/answer_panel.py]
  _on_stream_chunk: 追加到 _stream_buffer → setHtml → 滚动到底
        ↓
  流结束 → stream_done.emit(full_answer)
        ↓
[infra/history.py]
  HistoryStore.add_record(...)  ← SQLite WAL 写入
```

### 2.3 自动消失流程

```
[infra/selection.py]
  检测到空选区 → on_deselection()
        ↓
[app.py]
  _on_deselection → _current_float.schedule_close(1000)
        ↓
[ui/float_button.py]
  schedule_close: 检查 _destroyed / _actions_shown
        ↓
  未展开动作行 → 启动 QTimer 1000ms
        ↓
  定时器触发 → close_self() → hide() + deleteLater()
```

### 2.4 追问流程

```
[ui/answer_panel.py]
  用户在底部输入框输入问题 → 回车 / 点「发送」
        ↓
  _on_submit_question: 检查 _streaming 标记
        ↓
  追加到 _stream_buffer 显示「> 📝 问题」
        ↓
  后台线程 _call_followup_stream
        ↓
[services/llm.py]
  ask_followup_stream(conversation_history, followup_question)
        ↓
  流式输出 → 追加到 _stream_buffer
```

---

## 3. 跨线程通信

ReadMate 涉及 3 类线程：

| 线程 | 模块 | 通信方式 |
|---|---|---|
| **主线程** (Qt UI) | `app.py`, `ui/*` | PyQt6 事件循环 |
| **选区监听线程** | `infra/selection.py` | pynput Listener 内部线程 |
| **检测子线程** | `infra/selection.py` `_delayed_check` | threading.Thread |
| **AI 调用线程** | `ui/answer_panel.py` `_call_ai_stream` | threading.Thread |

跨线程到主线程：**必须用 pyqtSignal**，不可直接操作 UI。

`SelectionBridge` 是核心桥接：
- 监听线程调用 `bridge.emit_selection(text, x, y)`
- `selection_signal` 自动切到主线程触发 `_handle_selection → _on_selection`

---

## 4. 开发过程记录

### 4.1 阶段一：MVP 原型

**目标**：验证"选中即问"可行性。

- 使用 pynput 监听全局鼠标
- 模拟 Ctrl+C 读剪贴板获取选区
- PyQt6 浮动按钮 + 答案面板
- MiniMax API 调用

**关键决策**：
- 选用 pynput 而非 pyautogui（更底层、不抢焦点）
- 选用 PyQt6 而非 Tkinter（动画/样式支持更好）

### 4.2 阶段二：体验优化

**修复的典型 Bug**：

| Bug | 根因 | 修复 |
|---|---|---|
| 字体乱码 "KFDIMAF" | Qt CSS 不支持 letter-spacing | 移除该属性 |
| "chunk" 字面量泄露 | 展开动画期间错误显示内部变量 | 用 `_stream_buffer` 统一管理 |
| 面板超大尺寸 | `setFixedSize` 与动画冲突 | 用 QRect 控制尺寸变化 |
| 无法关闭面板 | 关闭按钮事件被拦截 | 添加 `_force_close` 显式 hide + deleteLater |
| Ctrl+V 失效 | 模拟 Ctrl+C 后按键卡住 | finally 块强制释放 VK_C / VK_CONTROL |
| 干扰原应用打字 | `activateWindow()` 抢焦点 | `WA_ShowWithoutActivating` + 移除 activateWindow |
| 输入框无法输入 | 面板设了 NoFocus | 移除 NoFocus，点击输入框时才激活 |
| 自动消失失效 | debounce 0.6s 吞掉取消点击 | 改用 `_checking` 标记替代时间 debounce |

### 4.3 阶段三：工程化重构

**目标**：从"能跑的脚本"升级为"GitHub 标准 Agent 项目"。

**改造内容**：
1. 拆分六层架构：core / agents / tools / services / ui / infra
2. 引入 Agent 抽象：BaseAgent + Orchestrator + SelectionAgent
3. 引入工具系统：ToolBase + ToolRegistry 可插拔
4. 引入事件总线：EventBus 线程安全发布订阅
5. 异常分级体系：ReadMateError → 5 个子类
6. SQLite WAL 模式历史记录
7. 单元测试 17 个（配置/历史/工具/Agent）
8. GitHub Actions CI（Python 3.10/3.11/3.12 矩阵）

### 4.4 阶段四：文档与清理（当前）

- 删除 8 个旧文件（popup/ai/main/history/selection/logger/config/memory）
- 修复 set_key.py 适配新 config API
- 更新 README 反映新架构
- 编写 PRD / Process / TechnicalArchitecture 三份文档

---

## 5. 关键工程约定

### 5.1 跨线程铁律

- 任何 UI 操作必须在主线程
- 后台线程通过 `pyqtSignal` 通知主线程
- `SelectionBridge` 是唯一允许的跨线程桥接点

### 5.2 资源管理

- `QPropertyAnimation` 必须显式持有引用（`self._animations.append(anim)`），否则 GC 会导致崩溃
- `AnswerPanel._all_panels` 类变量持有所有面板引用，避免 GC
- `_force_close` 必须先 `hide()` 再 `deleteLater()`

### 5.3 COM 初始化

- 任何子线程操作 UI 相关 COM 对象前必须 `pythoncom.CoInitialize()`
- 退出前 `pythoncom.CoUninitialize()`

### 5.4 焦点管理

- 顶层窗口必须设 `WA_ShowWithoutActivating`，避免抢焦点
- 只有输入框被点击时才 `activateWindow() + setFocus()`
- 模拟 Ctrl+C 后必须 finally 释放按键，避免 Ctrl 卡住

### 5.5 DPI 适配

- pynput 返回物理像素
- Qt 使用逻辑像素
- 转换公式：`logical = physical / devicePixelRatio`
- `_physical_to_logical` 方法处理此转换
