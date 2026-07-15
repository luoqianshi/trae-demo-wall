# ReadMate 技术架构文档

> 文档版本：v1.0 · 最后更新：2026-07-05

## 1. 技术栈

| 层 | 技术 | 选型理由 |
|---|---|---|
| UI 框架 | PyQt6 | 动画/样式支持好，原生 Windows 体验 |
| 全局监听 | pynput | 底层鼠标监听，不抢焦点 |
| 剪贴板 | pyperclip + keybd_event | 跨应用读取选区文本 |
| LLM | OpenAI SDK + MiniMax | 流式输出，国产模型合规 |
| 屏幕记忆 | screenpipe | 事件驱动捕获，提供上下文 |
| 持久化 | SQLite (WAL 模式) | 嵌入式，高并发读，无服务依赖 |
| 测试 | pytest + pytest-cov | 行业标准 |
| CI | GitHub Actions | 多版本矩阵 |

---

## 2. 架构设计

### 2.1 分层架构

ReadMate 采用**六层分离架构**，每层职责单一、依赖单向（上层依赖下层，下层不依赖上层）：

```
┌────────────────────────────────────────────────────┐
│  app.py - 整合层                                    │
│  职责：组装各层，管理生命周期，跨线程桥接            │
├────────────────────────────────────────────────────┤
│  ui/ - UI 层                                        │
│  职责：PyQt6 交互界面，零业务逻辑                   │
│  依赖：services/, core/                             │
├────────────────────────────────────────────────────┤
│  agents/ - Agent 层                                 │
│  职责：智能体编排与决策                             │
│  依赖：tools/, services/, core/                     │
├────────────────────────────────────────────────────┤
│  tools/ - 工具层                                    │
│  职责：可插拔工具系统，Agent 通过工具操作外部世界   │
│  依赖：core/                                        │
├────────────────────────────────────────────────────┤
│  services/ - 服务层                                 │
│  职责：外部能力封装（LLM、网络、IO）                │
│  依赖：core/                                        │
├────────────────────────────────────────────────────┤
│  infra/ - 基础设施层                                │
│  职责：底层能力（选区监听、屏幕记忆、历史存储）     │
│  依赖：core/                                        │
├────────────────────────────────────────────────────┤
│  core/ - 核心层                                     │
│  职责：配置、日志、异常、事件                       │
│  依赖：无（仅标准库）                               │
└────────────────────────────────────────────────────┘
```

### 2.2 依赖方向

```
app.py
  ↓
ui ──────┐
  ↓      ↓
agents → tools
  ↓      ↓
services ┘
  ↓
infra
  ↓
core
```

**关键约束**：core 不依赖任何上层；上层通过依赖注入或工厂获取下层实例；禁止循环依赖。

### 2.3 Agent 抽象

```python
class BaseAgent(ABC):
    @property
    @abstractmethod
    def name(self) -> str: ...

    @abstractmethod
    def run(self, input: Dict[str, Any]) -> str: ...
```

- `SelectionAgent`：处理选中文字提问，调用 LLMService + ToolRegistry
- `Orchestrator`：编排多个 Agent（未来可扩展 ReadingAgent / WritingAgent）

### 2.4 工具系统

```python
class ToolBase(ABC):
    name: str           # 工具名（Agent 调用凭证）
    description: str    # 给 LLM 看的工具说明
    def execute(self, **kwargs) -> str: ...  # 实际执行
    def safe_execute(self, **kwargs) -> str: ...  # 异常兜底

class ToolRegistry:
    def register(self, tool): ...
    def get(self, name) -> Tool: ...
    def list_tools(self) -> List[Dict]: ...
    def execute(self, name, **kwargs) -> str: ...
```

**注册流程**（在 `app.py` 启动时）：
```python
registry = get_tool_registry()
registry.register(MemorySearchTool())
registry.register(ClipboardTool())
```

新增工具只需继承 `ToolBase` 并注册，无需改动 Agent 代码。

---

## 3. 关键设计决策

### 3.1 选区监听：pynput + 模拟 Ctrl+C

**方案对比**：

| 方案 | 优点 | 缺点 | 选择 |
|---|---|---|---|
| UI Automation (uiautomation) | 直接获取选区 | 与 PyQt6 并发冲突，崩溃 | ❌ |
| 全局快捷键 | 简单 | 用户需主动触发 | ❌ |
| pynput + Ctrl+C | 跨应用通用，无侵入 | 需模拟按键 | ✅ |

**实现细节**：
- pynput 监听 `mouse.Button.left` 抬起
- 用 `_checking` 标记防并发（替代时间 debounce，确保取消选择的点击不被吞掉）
- 延迟 200ms 等选区稳定
- `keybd_event` 而非 `SendInput`（在此场景更可靠）
- finally 块强制释放 VK_C / VK_CONTROL，避免 Ctrl 卡住影响 Ctrl+V
- 恢复原剪贴板内容，不留痕迹

### 3.2 跨线程通信：pyqtSignal

**问题**：选区监听和 AI 调用在子线程，UI 操作必须在主线程。

**方案**：`SelectionBridge` 桥接 + `pyqtSignal` 自动切线程：

```python
class SelectionBridge(QObject):
    selection_signal = pyqtSignal(str, int, int)
    deselection_signal = pyqtSignal()

    def emit_selection(self, text, x, y):
        self.selection_signal.emit(text, x, y)  # 子线程调用
        # → 自动切到主线程执行 _handle_selection
```

答案面板的流式输出同样用 `stream_chunk = pyqtSignal(str)` 跨线程传递。

### 3.3 焦点管理：零干扰原则

**目标**：浮动按钮和答案面板出现时，不打扰用户在原应用的操作。

**实现**：
- 所有顶层窗口设 `WA_ShowWithoutActivating`
- 不调用 `activateWindow()`（除了输入框点击时）
- 浮动按钮设 `NoFocus` 焦点策略
- 答案面板**不**设 `NoFocus`（否则输入框无法获得焦点），改为点击输入框时条件激活

```python
def _on_input_click(self, event):
    if isinstance(event, QMouseEvent):
        self.activateWindow()  # 仅此时激活
        self._input.setFocus()
    QLineEdit.mousePressEvent(self._input, event)
```

### 3.4 自动消失：标记 + 定时器

**问题**：用户取消选择后浮动按钮应自动消失。

**方案**：
- `SelectionMonitor` 检测到空选区 → 调用 `on_deselection()`
- `app.py` 调用 `FloatButton.schedule_close(1000)`
- `FloatButton` 用 `QTimer.singleShot` 延迟 1 秒关闭
- 若用户已展开动作行（`_actions_shown`）或已销毁（`_destroyed`），不自动关闭

**关键修复**：原用时间 debounce（0.6s）防并发，但会吞掉快速取消选择的点击。改用 `_checking` 标记，检测期间（~0.4s）跳过新点击，检测完成立即放行。

### 3.5 流式输出：reasoning_split 过滤思考过程

**问题**：MiniMax-M3 等推理模型会输出 `<think>...</think>` 思考内容，不应展示。

**方案**：
- 调用 API 时启用 `reasoning_split=True`，思考内容走 `reasoning_content` 字段
- UI 只读取 `content` 字段
- 兜底过滤 `</think>` 标签（防模型不规范输出）

### 3.6 历史记录：SQLite WAL 模式

**问题**：UI 线程读、AI 线程写，并发访问历史库。

**方案**：
- SQLite WAL（Write-Ahead Logging）模式：读不阻塞写，写不阻塞读
- 所有操作加锁保护
- 限制最大记录数（默认 1000），自动清理旧记录

### 3.7 DPI 适配

**问题**：pynput 返回物理像素，Qt 使用逻辑像素，高 DPI 下坐标偏差。

**方案**：
```python
def _physical_to_logical(self, x, y):
    screen = self.app.screenAt(QPoint(int(x), int(y)))
    dpr = screen.devicePixelRatio()
    return int(x / dpr), int(y / dpr)
```

---

## 4. 异常体系

```
ReadMateError (基类)
├── ConfigError       # 配置缺失/格式错误
├── AgentError        # Agent 编排失败
├── ToolError         # 工具执行失败
├── LLMError          # LLM 调用失败（API Key/网络/超时）
└── ValidationError   # 输入校验失败
```

**处理策略**：
- `LLMError`：UI 显示错误提示，不崩溃
- `ConfigError`：启动时警告，引导用户配置
- `ToolError`：Agent 兜底，返回错误信息给 LLM
- 全局 `sys.excepthook` 兜底未捕获异常，记日志不崩溃

---

## 5. 测试策略

### 5.1 单元测试（17 个）

| 测试文件 | 覆盖模块 | 用例数 |
|---|---|---|
| `test_config.py` | core/config | 4 |
| `test_history.py` | infra/history | 5 |
| `test_tools.py` | tools/base + 具体 | 5 |
| `test_agents.py` | agents/selection_agent | 3 |

### 5.2 CI 矩阵

GitHub Actions 在 Python 3.10 / 3.11 / 3.12 三个版本上运行 `pytest`，确保跨版本兼容。

### 5.3 待补测试（P1）

- UI 层测试（QTest）
- 选区监听集成测试
- LLM Service mock 测试
- 端到端流程测试

---

## 6. 部署与运维

### 6.1 启动方式

```bash
python run.py           # 开发模式
pythonw run.py          # 后台运行（无控制台）
```

### 6.2 打包

```bash
pip install pyinstaller
python build.py
# 产物：dist/ReadMate.exe（单文件）
```

### 6.3 日志

- 路径：`~/.readmate/logs/readmate_YYYYMMDD.log`
- 按天滚动，保留 7 天
- 级别：DEBUG（开发）/ INFO（生产）

### 6.4 配置

- 路径：`~/.readmate/config.json`
- 优先级：环境变量 > 配置文件 > 默认值
- 环境变量前缀：`READMATE_`（如 `READMATE_MINIMAX_API_KEY`）

---

## 7. 演进路线

### 7.1 已完成

- ✅ MVP 原型（选中即问 + 流式回答）
- ✅ 体验优化（动画、拖动、关闭、自动消失）
- ✅ 工程化重构（六层架构 + 测试 + CI）
- ✅ 文档体系（PRD / Process / TechnicalArchitecture）

### 7.2 规划中

- [ ] 多模型支持（GPT-4o / Claude / Gemini）
- [ ] Markdown 渲染 + 代码高亮
- [ ] 截图问答（OCR）
- [ ] 快捷键触发
- [ ] 历史记录搜索与导出
- [ ] macOS 支持（需重写选区监听）

### 7.3 技术债

- 旧文件已清理，但部分模块单元测试覆盖率不足
- 端到端测试缺失，依赖人工验证
- 屏幕记忆模块对 screenpipe 依赖较强，缺 mock
