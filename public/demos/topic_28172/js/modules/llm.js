// 主流大模型指令集模块
class LlmModule {
    constructor() {
        this.title = '大模型指令集';
        this.commands = this.initCommands();
    }

    initCommands() {
        return [
            {
                category: '🤖 Claude Code (Anthropic)',
                items: [
                    { name: '启动交互会话', desc: '启动 Claude Code 交互式终端', example: 'claude', syntax: 'claude [选项]', options: '启动后进入 REPL 模式，输入 / 触发斜杠命令' },
                    { name: '单次提问', desc: '非交互式单次提问', example: 'claude "解释下 async/await"', syntax: 'claude "提示内容"', options: '适合脚本调用，结束自动退出' },
                    { name: '管道输入', desc: '从 stdin 接收上下文', example: 'cat error.log | claude "分析这个错误"', syntax: 'cat file | claude "问题"', options: '上下文自动注入' },
                    { name: '--model 指定模型', desc: '切换使用的模型', example: 'claude --model claude-opus-4', syntax: 'claude --model <name>', options: 'claude-sonnet, claude-opus, claude-haiku' },
                    { name: '--resume 恢复会话', desc: '恢复最近一次会话', example: 'claude --resume', syntax: 'claude --resume [session-id]', options: '继续之前上下文' },
                    { name: '--continue 继续', desc: '从最近会话继续', example: 'claude --continue', syntax: 'claude --continue', options: '等同于 --resume 最新会话' },
                    { name: '--print 打印模式', desc: '只输出响应不进入交互', example: 'claude --print "写个快排"', syntax: 'claude --print "提示"', options: '非交互模式，输出到 stdout' },
                    { name: '--add-dir 添加目录', desc: '把目录加入上下文', example: 'claude --add-dir ./src', syntax: 'claude --add-dir <path>', options: '可多次使用' },
                    { name: '--allowedTools 允许工具', desc: '指定允许使用的工具', example: 'claude --allowedTools "Bash,Read,Edit"', syntax: 'claude --allowedTools "工具列表"', options: '逗号分隔: Bash, Read, Edit, Write, Glob, Grep' },
                    { name: '--disallowedTools 禁用工具', desc: '禁止使用特定工具', example: 'claude --disallowedTools "Bash"', syntax: 'claude --disallowedTools "工具列表"', options: '' },
                    { name: '--permission-mode', desc: '权限模式', example: 'claude --permission-mode plan', syntax: 'claude --permission-mode <mode>', options: 'default, acceptEdits, plan, bypassPermissions' },
                    { name: '/help 斜杠命令', desc: '查看帮助', example: '/help', syntax: '/<command>', options: '查看所有斜杠命令' },
                    { name: '/clear 清空', desc: '清空当前上下文', example: '/clear', syntax: '/clear', options: '释放 token 配额' },
                    { name: '/compact 压缩', desc: '压缩上下文历史', example: '/compact', syntax: '/compact', options: '总结历史节省 token' },
                    { name: '/init 初始化', desc: '在项目生成 CLAUDE.md', example: '/init', syntax: '/init', options: '自动生成项目级配置' },
                    { name: '/review 代码评审', desc: '审查当前代码', example: '/review', syntax: '/review', options: '检查代码问题' },
                    { name: '/model 切换模型', desc: '在交互中切换模型', example: '/model opus', syntax: '/model <name>', options: 'opus/sonnet/haiku/claude-3.5-sonnet/claude-3-opus/claude-3-sonnet/claude-3-haiku' },
                    { name: '/tokens 查看用量', desc: '查看当前会话 token 用量', example: '/tokens', syntax: '/tokens', options: '显示输入/输出/总计 token 数' },
                    { name: '/usage 查看使用统计', desc: '查看账号 token 使用情况', example: '/usage', syntax: '/usage', options: '显示本月/今日使用量和限额' },
                    { name: '/sessions 会话管理', desc: '查看和管理会话列表', example: '/sessions', syntax: '/sessions [ls/rm/clear]', options: 'ls 列出, rm 删除, clear 清空所有' },
                    { name: '/session-info 会话详情', desc: '查看当前会话信息', example: '/session-info', syntax: '/session-info', options: '会话ID、创建时间、消息数、token数' },
                    { name: '/new 新建会话', desc: '开启新会话', example: '/new', syntax: '/new', options: '重置上下文，开始新对话' },
                    { name: '/rename 重命名会话', desc: '给当前会话命名', example: '/rename "My Project"', syntax: '/rename "会话名称"', options: '便于后续查找' },
                    { name: '/save 保存会话', desc: '保存当前会话到文件', example: '/save conversation.json', syntax: '/save <file>', options: '导出为 JSON' },
                    { name: '/load 加载会话', desc: '从文件加载会话', example: '/load conversation.json', syntax: '/load <file>', options: '导入之前保存的会话' },
                    { name: '/skills 查看技能', desc: '查看可用技能列表', example: '/skills', syntax: '/skills', options: '列出所有已安装的 skill' },
                    { name: '/skill 技能详情', desc: '查看特定技能详情', example: '/skill websearch', syntax: '/skill <name>', options: '查看技能功能和使用方式' },
                    { name: '/enable-skill 启用技能', desc: '启用指定技能', example: '/enable-skill websearch', syntax: '/enable-skill <name>', options: '' },
                    { name: '/disable-skill 禁用技能', desc: '禁用指定技能', example: '/disable-skill websearch', syntax: '/disable-skill <name>', options: '' },
                    { name: '/tools 查看工具', desc: '查看可用工具列表', example: '/tools', syntax: '/tools', options: 'Bash, Read, Write, Edit, Glob, Grep, Terminal, Browser 等' },
                    { name: '/tool-info 工具详情', desc: '查看工具参数和用法', example: '/tool-info Bash', syntax: '/tool-info <tool>', options: '' },
                    { name: '/config 查看配置', desc: '查看当前配置', example: '/config', syntax: '/config', options: '显示模型、权限、工具等配置' },
                    { name: '/set 配置参数', desc: '设置配置参数', example: '/set temperature 0.7', syntax: '/set <key> <value>', options: '支持: temperature, max_tokens, model' },
                    { name: '/export 导出对话', desc: '导出对话记录', example: '/export --format markdown', syntax: '/export [--format <format>]', options: '支持: json, markdown, txt' },
                    { name: '/share 分享会话', desc: '生成分享链接', example: '/share', syntax: '/share', options: '创建可分享的会话链接' },
                    { name: '/rate 评分', desc: '对回答进行评分', example: '/rate 5', syntax: '/rate <1-5>', options: '1-5 星评分' },
                    { name: '/feedback 反馈', desc: '提交反馈意见', example: '/feedback "建议..."', syntax: '/feedback "内容"', options: '向开发团队提交反馈' },
                    { name: '/agents', desc: '管理 sub-agents', example: '/agents', syntax: '/agents', options: '查看/管理子代理' },
                    { name: '/log 查看日志', desc: '查看系统日志', example: '/log', syntax: '/log', options: '显示最近的操作日志' },
                    { name: '/version 版本', desc: '查看版本信息', example: '/version', syntax: '/version', options: '显示当前 CLI 版本' },
                    { name: '/quit /exit', desc: '退出会话', example: '/quit', syntax: '/quit 或 /exit', options: '退出 Claude Code' }
                ]
            },
            {
                category: '🌊 OpenCode (sst/opencode)',
                items: [
                    { name: '启动 TUI', desc: '打开 OpenCode 终端界面', example: 'opencode', syntax: 'opencode [选项]', options: '类似 Claude Code 的 TUI 体验' },
                    { name: '指定目录', desc: '在指定目录启动', example: 'opencode ./myproject', syntax: 'opencode [path]', options: '默认当前目录' },
                    { name: '单次提示', desc: '非交互式', example: 'opencode "列出当前文件"', syntax: 'opencode "提示"', options: '执行后退出' },
                    { name: '--model', desc: '选择模型', example: 'opencode --model claude-sonnet-4', syntax: 'opencode --model <provider/model>', options: '支持多 provider' },
                    { name: '--provider', desc: '选择 provider', example: 'opencode --provider anthropic', syntax: 'opencode --provider <name>', options: 'anthropic, openai, ollama, bedrock' },
                    { name: '配置文件', desc: 'opencode.json 配置', example: '~/.config/opencode/opencode.json', syntax: 'JSON 配置文件', options: '可配置模型/快捷键/主题' },
                    { name: '斜杠命令', desc: 'TUI 中斜杠命令', example: '/help, /clear, /model', syntax: '/<command>', options: '交互内触发' },
                    { name: '/model 切换模型', desc: '在交互中切换模型', example: '/model claude-sonnet-4', syntax: '/model <name>', options: '支持所有 provider/model' },
                    { name: '/tokens 查看用量', desc: '查看当前会话 token 用量', example: '/tokens', syntax: '/tokens', options: '显示输入/输出/总计' },
                    { name: '/sessions 会话管理', desc: '查看和管理会话', example: '/sessions', syntax: '/sessions', options: '列出/切换/删除会话' },
                    { name: '/skills 查看技能', desc: '查看可用技能', example: '/skills', syntax: '/skills', options: '列出已安装的 skill' },
                    { name: '/tools 查看工具', desc: '查看可用工具', example: '/tools', syntax: '/tools', options: '' },
                    { name: '/config 查看配置', desc: '查看当前配置', example: '/config', syntax: '/config', options: '' },
                    { name: 'Tab 补全', desc: '文件和路径自动补全', example: '输入 @ 触发', syntax: '@<path>', options: '类似 Claude Code 的文件引用' }
                ]
            },
            {
                category: '🧠 Qwen Code (通义千问)',
                items: [
                    { name: '启动', desc: '启动 Qwen Code CLI', example: 'qwen', syntax: 'qwen [选项]', options: '阿里云通义千问 CLI 工具' },
                    { name: '单次提问', desc: '单次对话后退出', example: 'qwen "用 Python 写个 HTTP 服务"', syntax: 'qwen "提示"', options: '非交互模式' },
                    { name: '管道输入', desc: '通过管道传上下文', example: 'git diff | qwen "生成 commit message"', syntax: 'cat file | qwen "问题"', options: '' },
                    { name: '--model', desc: '选择模型', example: 'qwen --model qwen-max', syntax: 'qwen --model <name>', options: 'qwen-max, qwen-plus, qwen-turbo, qwen-coder' },
                    { name: '--api-key', desc: 'API 密钥', example: 'qwen --api-key sk-xxx', syntax: 'qwen --api-key <key>', options: '也可设环境变量 DASHSCOPE_API_KEY' },
                    { name: '环境变量', desc: '配置 API Key', example: 'export DASHSCOPE_API_KEY=sk-xxx', syntax: 'export DASHSCOPE_API_KEY=<key>', options: '放入 ~/.bashrc' },
                    { name: '对话模式', desc: '持续多轮对话', example: 'qwen -i', syntax: 'qwen -i 或 qwen --interactive', options: '进入 REPL' },
                    { name: '代码补全', desc: 'shell 中代码补全', example: '输入代码按 Tab', syntax: '交互内触发', options: '支持主流语言' },
                    { name: '文件上下文', desc: '引用文件', example: 'qwen "@main.py 重构这个"', syntax: '@<file>', options: '类似 Claude Code' },
                    { name: '斜杠命令', desc: '内置命令', example: '/help, /clear, /exit', syntax: '/<command>', options: '' },
                    { name: '/model 切换模型', desc: '在交互中切换模型', example: '/model qwen-max', syntax: '/model <name>', options: 'qwen-max/qwen-plus/qwen-turbo/qwen-coder' },
                    { name: '/tokens 查看用量', desc: '查看当前会话 token 用量', example: '/tokens', syntax: '/tokens', options: '显示输入/输出/总计' },
                    { name: '/sessions 会话管理', desc: '查看和管理会话', example: '/sessions', syntax: '/sessions', options: '列出/切换/删除会话' },
                    { name: '/skills 查看技能', desc: '查看可用技能', example: '/skills', syntax: '/skills', options: '列出已安装的 skill' },
                    { name: '/tools 查看工具', desc: '查看可用工具', example: '/tools', syntax: '/tools', options: '' },
                    { name: '/config 查看配置', desc: '查看当前配置', example: '/config', syntax: '/config', options: '' }
                ]
            },
            {
                category: '⭐ Aider (开源 AI 编码)',
                items: [
                    { name: '启动 Aider', desc: '进入 Aider 交互', example: 'aider', syntax: 'aider [文件...]', options: 'TUI 风格编码助手' },
                    { name: '指定文件', desc: '启动时加载文件', example: 'aider main.py utils.py', syntax: 'aider <file>...', options: '多个文件一起改' },
                    { name: '--model', desc: '选择模型', example: 'aider --model gpt-4o', syntax: 'aider --model <name>', options: 'gpt-4o, claude-3.5-sonnet, deepseek-coder' },
                    { name: '--openai-api-key', desc: 'OpenAI 密钥', example: 'aider --openai-api-key sk-xxx', syntax: 'aider --openai-api-key <key>', options: '' },
                    { name: '--anthropic-api-key', desc: 'Anthropic 密钥', example: 'aider --anthropic-api-key sk-xxx', syntax: 'aider --anthropic-api-key <key>', options: '' },
                    { name: '--message', desc: '单条消息', example: 'aider --message "添加错误处理"', syntax: 'aider --message "提示"', options: '执行后退出' },
                    { name: '--auto-commits', desc: '自动 git commit', example: 'aider --auto-commits', syntax: 'aider --auto-commits', options: '每次修改自动提交' },
                    { name: '--no-auto-commits', desc: '禁用自动提交', example: 'aider --no-auto-commits', syntax: 'aider --no-auto-commits', options: '' },
                    { name: '--git', desc: '启用 git 集成', example: 'aider --git', syntax: 'aider --git', options: '默认开启' },
                    { name: '/add 添加文件', desc: '把文件加入上下文', example: '/add src/*.py', syntax: '/add <pattern>', options: '通配符支持' },
                    { name: '/drop 移除', desc: '从上下文移除文件', example: '/drop main.py', syntax: '/drop <pattern>', options: '' },
                    { name: '/undo 撤销', desc: '撤销最近修改', example: '/undo', syntax: '/undo', options: '回退代码' },
                    { name: '/diff 查看差异', desc: '查看未提交变更', example: '/diff', syntax: '/diff', options: '看 git diff' },
                    { name: '/ls 列出文件', desc: '列出上下文中文件', example: '/ls', syntax: '/ls', options: '' },
                    { name: '/run 执行命令', desc: '运行 shell 命令', example: '/run pytest', syntax: '/run <command>', options: '在 Aider 中跑测试' },
                    { name: '/voice 语音', desc: '启用语音输入', example: '/voice', syntax: '/voice', options: '需要配置' }
                ]
            },
            {
                category: '🧩 Cursor (IDE 集成)',
                items: [
                    { name: 'Cmd+K 编辑', desc: '内联代码编辑', example: 'Cmd+K 然后输入指令', syntax: 'Cmd/Ctrl+K', options: '选中代码后唤起' },
                    { name: 'Cmd+L 聊天', desc: '打开侧边栏聊天', example: 'Cmd+L', syntax: 'Cmd/Ctrl+L', options: '长对话' },
                    { name: 'Cmd+I 打开 Composer', desc: '多文件 AI 编辑', example: 'Cmd+I', syntax: 'Cmd/Ctrl+I', options: 'Agent 模式' },
                    { name: '@file 引用文件', desc: '在聊天中引用文件', example: '@src/main.py', syntax: '@<file>', options: '' },
                    { name: '@codebase 检索', desc: '在整个代码库中搜索', example: '@codebase 错误处理', syntax: '@codebase <查询>', options: 'RAG 检索' },
                    { name: '@web 联网', desc: '联网搜索', example: '@web Next.js 最新版本', syntax: '@web <查询>', options: '' },
                    { name: '@docs 文档', desc: '引用第三方文档', example: '@Docs react', syntax: '@Docs <name>', options: '需配置文档源' },
                    { name: 'Apply 应用', desc: '应用 AI 的代码建议', example: '点击 Apply 按钮', syntax: 'Apply', options: '或 Reject 拒绝' },
                    { name: 'Accept All', desc: '应用所有 diff', example: 'Cmd+Shift+Y', syntax: '快捷键', options: '' }
                ]
            },
            {
                category: '🛠️ Cline (VSCode 扩展)',
                items: [
                    { name: '打开 Cline', desc: '在 VSCode 侧边栏打开 Cline', example: '点击 Cline 图标', syntax: '', options: '需要安装扩展' },
                    { name: '新建任务', desc: '在输入框中提问', example: '输入: 帮我重构这个文件', syntax: '输入任务', options: '' },
                    { name: '@terminal 终端', desc: '在终端中执行命令', example: '点击终端图标', syntax: '', options: '需要授权' },
                    { name: '@file 引用文件', desc: '把文件加入上下文', example: '点击 + 添加文件', syntax: '', options: '' },
                    { name: 'MCP 集成', desc: 'MCP 服务器', example: '配置 .cline/mcp.json', syntax: 'JSON 配置', options: '扩展工具能力' },
                    { name: '/smol 小模型', desc: '切换小模型', example: '在模型下拉切换', syntax: '', options: '节省成本' }
                ]
            },
            {
                category: '🧪 Continue (开源 IDE 助手)',
                items: [
                    { name: 'Cmd+L 聊天', desc: '打开侧边栏', example: 'Cmd+L', syntax: 'Cmd/Ctrl+L', options: '' },
                    { name: 'Cmd+I 编辑', desc: '内联编辑', example: 'Cmd+I', syntax: 'Cmd/Ctrl+I', options: '高亮代码后触发' },
                    { name: 'Tab 自动补全', desc: 'AI 代码补全', example: '输入代码按 Tab', syntax: 'Tab', options: '类 Copilot' },
                    { name: '@codebase 检索', desc: '代码库搜索', example: '@codebase 用户登录', syntax: '@<context>', options: '' },
                    { name: 'config.json', desc: '配置文件', example: '~/.continue/config.json', syntax: 'JSON 配置', options: '配置 provider/model' }
                ]
            },
            {
                category: '🌐 OpenAI / GPT 系列',
                items: [
                    { name: 'Codex CLI', desc: 'OpenAI 官方 CLI', example: 'codex "写个快排"', syntax: 'codex [提示]', options: '实验性 CLI 工具' },
                    { name: 'Codex --model', desc: '指定模型', example: 'codex --model gpt-4o', syntax: 'codex --model <name>', options: '' },
                    { name: 'Codex --quiet', desc: '静默模式', example: 'codex --quiet "提示"', syntax: 'codex --quiet', options: '只输出结果' },
                    { name: 'curl 调用 OpenAI API', desc: 'HTTP API 调用', example: "curl https://api.openai.com/v1/chat/completions -H 'Authorization: Bearer sk-xxx' -d '...'", syntax: 'curl + JSON body', options: '适合脚本集成' },
                    { name: 'python openai 库', desc: 'Python SDK', example: "openai.ChatCompletion.create(model='gpt-4o', messages=[...])", syntax: 'Python', options: '需要 pip install openai' },
                    { name: 'OPENAI_API_KEY', desc: '环境变量配置', example: 'export OPENAI_API_KEY=sk-xxx', syntax: '环境变量', options: '各种工具通用' }
                ]
            },
            {
                category: '🧬 DeepSeek / 国产模型',
                items: [
                    { name: 'DeepSeek API', desc: '调用 DeepSeek', example: "curl https://api.deepseek.com/v1/chat/completions -H 'Authorization: Bearer $DEEPSEEK_API_KEY'", syntax: 'OpenAI 兼容 API', options: '价格低，中文好' },
                    { name: 'DeepSeek-Coder', desc: '代码专用模型', example: 'deepseek-coder:6.7b (本地)', syntax: 'Ollama 拉取', options: '' },
                    { name: 'Kimi (月之暗面)', desc: '长文本模型', example: 'web 端使用', syntax: '', options: '支持 20 万字上下文' },
                    { name: '智谱 GLM', desc: '智谱 AI', example: 'glm-4 / glm-4-plus', syntax: 'API 调用', options: '需申请 API Key' },
                    { name: '文心一言', desc: '百度 ERNIE', example: '千帆平台 API', syntax: 'access_token 鉴权', options: '' },
                    { name: '通义千问 API', desc: 'DashScope SDK', example: "from dashscope import Generation; Generation.call(model='qwen-max', prompt='你好')", syntax: 'Python SDK', options: 'pip install dashscope' }
                ]
            },
            {
                category: '🏠 Ollama (本地模型)',
                items: [
                    { name: 'ollama pull', desc: '拉取模型', example: 'ollama pull llama3.2', syntax: 'ollama pull <model>', options: 'llama3.2, qwen2.5, deepseek-coder, codellama' },
                    { name: 'ollama run', desc: '运行模型对话', example: 'ollama run llama3.2', syntax: 'ollama run <model>', options: '进入 REPL' },
                    { name: 'ollama list', desc: '列出已下载模型', example: 'ollama list', syntax: 'ollama list', options: '' },
                    { name: 'ollama rm', desc: '删除模型', example: 'ollama rm llama3.2', syntax: 'ollama rm <model>', options: '' },
                    { name: 'ollama ps', desc: '查看运行中模型', example: 'ollama ps', syntax: 'ollama ps', options: '' },
                    { name: 'ollama serve', desc: '启动服务', example: 'ollama serve', syntax: 'ollama serve', options: '默认监听 11434' },
                    { name: 'ollama show', desc: '查看模型详情', example: 'ollama show llama3.2', syntax: 'ollama show <model>', options: '' },
                    { name: 'ollama create', desc: '从 Modelfile 创建', example: 'ollama create mymodel -f Modelfile', syntax: 'ollama create <name> -f <file>', options: '' },
                    { name: 'ollama cp', desc: '复制模型', example: 'ollama cp llama3.2 mymodel', syntax: 'ollama cp <src> <dst>', options: '' },
                    { name: 'ollama push', desc: '推送到注册中心', example: 'ollama push myuser/mymodel', syntax: 'ollama push <model>', options: '' },
                    { name: 'ollama API', desc: '本地 HTTP API', example: 'curl http://localhost:11434/api/generate -d \'{"model":"llama3.2","prompt":"hi"}\'', syntax: 'OpenAI 兼容端点 /v1', options: '可被各类工具调用' }
                ]
            },
            {
                category: '🔌 LM Studio (桌面 GUI)',
                items: [
                    { name: '搜索模型', desc: '在 GUI 中搜索', example: 'LM Studio 搜索', syntax: '', options: 'Hugging Face 集成' },
                    { name: '启动本地服务器', desc: '开启 OpenAI 兼容 API', example: 'Developer > Start Server', syntax: '', options: '默认 1234 端口' },
                    { name: '加载模型', desc: '选择并加载 GGUF', example: '点击 Load Model', syntax: '', options: '' },
                    { name: 'Chat 模式', desc: 'GUI 聊天', example: '左侧 Chat 标签', syntax: '', options: '支持 system prompt' },
                    { name: 'lms CLI', desc: '命令行工具', example: 'lms ls, lms load model-id', syntax: 'lms <subcmd>', options: '管理模型' }
                ]
            },
            {
                category: '⚡ vLLM / 高性能推理',
                items: [
                    { name: '启动服务', desc: 'vLLM OpenAI 兼容服务', example: 'vllm serve meta-llama/Llama-3-8B', syntax: 'vllm serve <model>', options: '默认端口 8000' },
                    { name: '--port', desc: '指定端口', example: 'vllm serve model --port 9000', syntax: '--port <n>', options: '' },
                    { name: '--tensor-parallel-size', desc: '多 GPU 并行', example: 'vllm serve model --tensor-parallel-size 2', syntax: '--tensor-parallel-size <n>', options: 'TP 度' },
                    { name: '--gpu-memory-utilization', desc: '显存利用率', example: '--gpu-memory-utilization 0.9', syntax: '--gpu-memory-utilization 0-1', options: '' },
                    { name: '--max-model-len', desc: '最大上下文长度', example: '--max-model-len 32768', syntax: '--max-model-len <n>', options: '' },
                    { name: '--quantization', desc: '量化方式', example: '--quantization awq', syntax: '--quantization <method>', options: 'awq, gptq, bitsandbytes' },
                    { name: 'API 调用', desc: 'OpenAI 客户端调用', example: "from openai import OpenAI; client = OpenAI(base_url='http://localhost:8000/v1', api_key='EMPTY')", syntax: '标准 OpenAI SDK', options: '' }
                ]
            },
            {
                category: '🧰 通用 LLM API 模式',
                items: [
                    { name: 'OpenAI 兼容 URL', desc: '通用 API 端点', example: 'https://api.openai.com/v1/chat/completions', syntax: 'POST /v1/chat/completions', options: '几乎所有工具都兼容' },
                    { name: 'messages 格式', desc: '对话消息体', example: '[{"role":"user","content":"hi"}]', syntax: 'JSON 数组', options: 'role: system/user/assistant' },
                    { name: 'temperature', desc: '温度参数', example: 'temperature: 0.7', syntax: '0-2', options: '0 稳定, 2 创意' },
                    { name: 'max_tokens', desc: '最大输出', example: 'max_tokens: 4096', syntax: '整数', options: '控制成本' },
                    { name: 'stream 流式', desc: '流式输出', example: 'stream: true', syntax: '布尔', options: 'SSE 推送' },
                    { name: 'tools 函数调用', desc: 'Function calling', example: 'tools: [{type:"function", function:{...}}]', syntax: 'JSON Schema', options: 'Agent 工具调用' },
                    { name: 'system prompt', desc: '系统提示', example: '{role:"system", content:"你是..."}', syntax: '第一条消息', options: '定义角色' },
                    { name: 'top_p 采样', desc: '核采样', example: 'top_p: 0.9', syntax: '0-1', options: '与 temperature 二选一' },
                    { name: 'frequency_penalty', desc: '频率惩罚', example: 'frequency_penalty: 0.5', syntax: '-2 到 2', options: '减少重复' },
                    { name: 'presence_penalty', desc: '存在惩罚', example: 'presence_penalty: 0.5', syntax: '-2 到 2', options: '鼓励新话题' },
                    { name: 'stop 停止符', desc: '停止序列', example: 'stop: ["\\n\\n"]', syntax: '字符串或数组', options: '' },
                    { name: 'response_format', desc: '响应格式', example: 'response_format: {type:"json_object"}', syntax: 'json_object/text', options: '强制 JSON 输出' }
                ]
            },
            {
                category: '💡 提示工程技巧',
                items: [
                    { name: '角色设定', desc: '给模型分配角色', example: '"你是一位资深 Python 工程师"', syntax: '在 system prompt 中设定', options: '提升专业度' },
                    { name: 'Few-shot 示例', desc: '给几个示例', example: '"输入->输出 示例1... 示例2... 现在请..."', syntax: 'in-context learning', options: '少样本学习' },
                    { name: '思维链 (CoT)', desc: '让模型一步步思考', example: '"让我们一步步思考: 1... 2... 3... 答案..."', syntax: '追加 step-by-step', options: '提升推理能力' },
                    { name: 'ReAct 框架', desc: '思考-行动-观察循环', example: 'Thought:...\nAction:...\nObservation:...', syntax: 'Agent 经典范式', options: '工具调用' },
                    { name: 'XML 标签结构化', desc: '用标签组织提示', example: '<context>...</context><task>...</task>', syntax: 'XML 标签', options: 'Claude 友好' },
                    { name: '结构化输出', desc: '要求 JSON/Markdown', example: '"请以 JSON 格式输出: {key:value}"', syntax: '格式约束', options: '便于程序解析' },
                    { name: '反向提示', desc: '明确不要什么', example: '"不要使用 emoji, 不要解释代码"', syntax: 'negative constraints', options: '' },
                    { name: '上下文窗口管理', desc: '控制输入长度', example: '长文本先 summarize 再喂', syntax: '节省 token', options: '使用 /compact' },
                    { name: '温度选择', desc: '任务 vs 温度', example: '代码生成: 0-0.3, 创意写作: 0.7-1.2', syntax: '经验值', options: '' },
                    { name: '多轮对话清理', desc: '定期清空上下文', example: '/clear 或新开会话', syntax: '降低 token 成本', options: '' }
                ]
            }
        ];
    }

    render(container) {
        container.innerHTML = `
            <div style="display:grid;gap:16px;">
                <div style="padding:12px;background:var(--bg-card);border-radius:8px;">
                    <input type="text" id="llm-search" placeholder="🔍 搜索大模型指令（如: claude、ollama、temperature）..." style="width:100%;padding:10px 14px;background:var(--bg-sidebar);border:1px solid var(--border);border-radius:6px;color:var(--text-primary);font-size:14px;">
                </div>
                <div id="llm-list" style="display:grid;gap:16px;"></div>
            </div>
        `;

        setTimeout(() => {
            this.renderList('');
            const searchEl = document.getElementById('llm-search');
            if (searchEl) {
                searchEl.addEventListener('input', (e) => {
                    this.renderList(e.target.value.toLowerCase());
                });
                searchEl.focus();
            }
        }, 100);
    }

    renderList(keyword) {
        const listEl = document.getElementById('llm-list');
        if (!listEl) return;

        let html = '';
        let totalMatch = 0;

        this.commands.forEach((cat, catIdx) => {
            const matched = cat.items.filter(item => {
                if (!keyword) return true;
                return item.name.toLowerCase().includes(keyword) ||
                       item.desc.toLowerCase().includes(keyword) ||
                       item.example.toLowerCase().includes(keyword) ||
                       cat.category.toLowerCase().includes(keyword);
            });

            if (matched.length === 0) return;
            totalMatch += matched.length;

            html += `
                <div style="padding:14px 16px;background:var(--bg-card);border-radius:8px;">
                    <div style="font-size:14px;font-weight:600;color:var(--accent);margin-bottom:12px;padding-bottom:8px;border-bottom:1px solid var(--border);">
                        ${cat.category} <span style="font-size:11px;color:var(--text-secondary);font-weight:400;">(${matched.length})</span>
                    </div>
                    <div style="display:grid;gap:8px;">
                        ${matched.map((item, idx) => this.renderItem(item, catIdx, idx)).join('')}
                    </div>
                </div>
            `;
        });

        if (totalMatch === 0) {
            html = '<div style="padding:30px;text-align:center;color:var(--text-secondary);font-size:13px;">未找到匹配的命令，请尝试其他关键词</div>';
        }

        listEl.innerHTML = html;
    }

    renderItem(item, catIdx, itemIdx) {
        const id = `llm-${catIdx}-${itemIdx}`;
        return `
            <div style="padding:10px 12px;background:var(--bg-sidebar);border-radius:6px;cursor:pointer;" onclick="(function(){var d=document.getElementById('${id}-detail');d.style.display=d.style.display==='none'?'block':'none';})()">
                <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;">
                    <div style="display:flex;align-items:center;gap:10px;flex:1;min-width:0;">
                        <code style="color:var(--success);font-size:14px;font-weight:600;white-space:nowrap;">${item.name}</code>
                        <span style="color:var(--text-secondary);font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${item.desc}</span>
                    </div>
                    <button class="btn btn-secondary" onclick="event.stopPropagation();app.modules.llm.copy('${item.example.replace(/'/g, "\\'")}')" style="padding:3px 10px;font-size:11px;">复制示例</button>
                </div>
                <div id="${id}-detail" style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--border);display:none;">
                    <div style="display:grid;gap:6px;font-size:12px;line-height:1.7;">
                        ${item.syntax ? `<div><span style="color:var(--text-secondary);">📖 语法:</span> <code style="color:var(--text-primary);">${item.syntax}</code></div>` : ''}
                        <div><span style="color:var(--text-secondary);">💡 示例:</span> <code style="color:var(--text-primary);">${item.example}</code></div>
                        ${item.options ? `<div><span style="color:var(--text-secondary);">⚙️ 说明:</span> <span style="color:var(--text-primary);">${item.options}</span></div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }

    copy(text) {
        app.copyText(text);
    }
}