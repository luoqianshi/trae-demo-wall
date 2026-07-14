// Mock data: simulated Codex sessions parsed from JSONL
// Each session contains: id, project, startTime, endTime, messages

const MOCK_DATA = {
  projects: [
    { name: 'codex-session-viewer', path: '~/projects/codex-session-viewer', count: 3 },
    { name: 'ai-doc-assistant', path: '~/projects/ai-doc-assistant', count: 4 },
    { name: 'side-blog', path: '~/projects/side-blog', count: 2 }
  ],

  sessions: [
    // ===== Project 1: codex-session-viewer =====
    {
      id: 'sess_01HMX3KQ9F',
      project: 'codex-session-viewer',
      projectPath: '~/projects/codex-session-viewer',
      startTime: '2026-07-05 14:23',
      endTime: '2026-07-05 15:47',
      messageCount: 12,
      toolCallCount: 5,
      fileChangeCount: 3,
      preview: '帮我写一个解析 ~/.codex/sessions/ 下 JSONL 的脚本',
      messages: [
        { role: 'user', type: 'text', content: '帮我写一个解析 ~/.codex/sessions/ 下所有 JSONL 文件的脚本，按项目分组输出结构化数据。' },
        { role: 'assistant', type: 'text', content: '好的，我来帮你实现。首先用 Node.js 的 fs 模块递归扫描目录，然后用 readline 逐行解析 JSONL：' },
        { role: 'assistant', type: 'code', lang: 'javascript', content: 'const fs = require("fs");\nconst path = require("path");\nconst readline = require("readline");\n\nasync function parseSession(filePath) {\n  const events = [];\n  const stream = fs.createReadStream(filePath);\n  const rl = readline.createInterface({ input: stream });\n  for await (const line of rl) {\n    if (line.trim()) events.push(JSON.parse(line));\n  }\n  return events;\n}\n\nasync function scanSessions(dir) {\n  const files = fs.readdirSync(dir).filter(f => f.endsWith(".jsonl"));\n  const results = await Promise.all(\n    files.map(f => parseSession(path.join(dir, f)))\n  );\n  return results;\n}' },
        { role: 'user', type: 'text', content: '嗯，然后我要按 project_path 字段分组，方便后续按项目展示。' },
        { role: 'assistant', type: 'text', content: '明白。我加一个 groupBy 函数：' },
        { role: 'assistant', type: 'code', lang: 'javascript', content: 'function groupByProject(sessions) {\n  const groups = {};\n  for (const session of sessions) {\n    const project = session[0]?.project_path || "unknown";\n    if (!groups[project]) groups[project] = [];\n    groups[project].push(session);\n  }\n  return groups;\n}' },
        { role: 'assistant', type: 'tool_call', tool: 'write_file', input: 'src/parser.js' },
        { role: 'assistant', type: 'tool_call', tool: 'write_file', input: 'src/grouping.js' },
        { role: 'assistant', type: 'tool_call', tool: 'run_command', input: 'node test-parser.js' },
        { role: 'user', type: 'text', content: '不错。前端怎么接？' },
        { role: 'assistant', type: 'text', content: '前端我建议用纯静态方案，把解析后的数据内嵌到 HTML 里。这样 Demo 部署最简单：' },
        { role: 'assistant', type: 'code', lang: 'html', content: '<script src="data.js"></script>\n<script src="app.js"></script>' }
      ]
    },
    {
      id: 'sess_01HMX3LWR2',
      project: 'codex-session-viewer',
      projectPath: '~/projects/codex-session-viewer',
      startTime: '2026-07-04 09:11',
      endTime: '2026-07-04 10:32',
      messageCount: 8,
      toolCallCount: 3,
      fileChangeCount: 2,
      preview: '搜索框要支持 debounce，不然每次输入都触发会很卡',
      messages: [
        { role: 'user', type: 'text', content: '搜索框要支持 debounce，不然每次输入都触发会很卡。' },
        { role: 'assistant', type: 'text', content: '对，我加个 300ms 的 debounce：' },
        { role: 'assistant', type: 'code', lang: 'javascript', content: 'function debounce(fn, delay = 300) {\n  let timer = null;\n  return function(...args) {\n    clearTimeout(timer);\n    timer = setTimeout(() => fn.apply(this, args), delay);\n  };\n}\n\nconst handleSearch = debounce((query) => {\n  filterSessions(query);\n}, 300);\n\nsearchInput.addEventListener("input", e => handleSearch(e.target.value));' },
        { role: 'user', type: 'text', content: '搜索结果关键词要高亮。' },
        { role: 'assistant', type: 'text', content: '用一个简单的正则替换就行：' },
        { role: 'assistant', type: 'code', lang: 'javascript', content: 'function highlight(text, query) {\n  if (!query) return text;\n  const regex = new RegExp(`(${escapeRegex(query)})`, "gi");\n  return text.replace(regex, "<mark>$1</mark>");\n}' },
        { role: 'assistant', type: 'file_change', file: 'assets/app.js', diff: '+ highlight(text, query)\n+ escapeRegex(s)\n~ renderSessionList' },
        { role: 'user', type: 'text', content: '完美。再加个 Esc 清除搜索。' },
        { role: 'assistant', type: 'text', content: '好：' },
        { role: 'assistant', type: 'code', lang: 'javascript', content: 'searchInput.addEventListener("keydown", e => {\n  if (e.key === "Escape") {\n    searchInput.value = "";\n    filterSessions("");\n  }\n});' }
      ]
    },
    {
      id: 'sess_01HMX3MA8P',
      project: 'codex-session-viewer',
      projectPath: '~/projects/codex-session-viewer',
      startTime: '2026-07-03 16:45',
      endTime: '2026-07-03 17:30',
      messageCount: 6,
      toolCallCount: 2,
      fileChangeCount: 4,
      preview: '视觉风格我想要深色科技风，参考 VSCode 的配色',
      messages: [
        { role: 'user', type: 'text', content: '视觉风格我想要深色科技风，参考 VSCode 的配色。' },
        { role: 'assistant', type: 'text', content: '好的，我用一套深色配色变量：' },
        { role: 'assistant', type: 'code', lang: 'css', content: ':root {\n  --bg: #0f1117;\n  --bg2: #181b24;\n  --accent: #4f8ef7;\n  --accent2: #7c5cfc;\n  --ink: #e8eaf0;\n  --muted: #8b90a0;\n}' },
        { role: 'user', type: 'text', content: '三栏布局怎么分？' },
        { role: 'assistant', type: 'text', content: '推荐 240 + 360 + 1fr，左侧项目、中间 session 列表、右侧详情：' },
        { role: 'assistant', type: 'code', lang: 'css', content: '.main {\n  display: grid;\n  grid-template-columns: 240px 360px 1fr;\n  height: 100%;\n}' },
        { role: 'assistant', type: 'file_change', file: 'codex-session-demo.html', diff: '+ .main grid layout\n+ .sidebar .sessions .detail\n~ :root colors' }
      ]
    },

    // ===== Project 2: ai-doc-assistant =====
    {
      id: 'sess_01HMX3NB3X',
      project: 'ai-doc-assistant',
      projectPath: '~/projects/ai-doc-assistant',
      startTime: '2026-07-06 11:02',
      endTime: '2026-07-06 12:18',
      messageCount: 15,
      toolCallCount: 7,
      fileChangeCount: 5,
      preview: '我想做一个 AI 文档助手，能根据代码自动生成 API 文档',
      messages: [
        { role: 'user', type: 'text', content: '我想做一个 AI 文档助手，能根据代码自动生成 API 文档。' },
        { role: 'assistant', type: 'text', content: '好的思路。技术栈我建议用：\n1. AST 解析（用 tree-sitter 提取函数签名）\n2. LLM 总结（用 GPT-4 生成自然语言说明）\n3. Markdown 输出\n\n先做最小可用版本。' },
        { role: 'user', type: 'text', content: 'tree-sitter 怎么集成到 Node.js？' },
        { role: 'assistant', type: 'text', content: '用 tree-sitter-cli 或者 wasm 版本：' },
        { role: 'assistant', type: 'code', lang: 'javascript', content: 'const Parser = require("tree-sitter");\nconst JavaScript = require("tree-sitter-javascript");\n\nconst parser = new Parser();\nparser.setLanguage(JavaScript);\n\nconst tree = parser.parse(sourceCode);\n// 遍历 tree.rootNode 找 function_declaration 节点' },
        { role: 'assistant', type: 'tool_call', tool: 'write_file', input: 'src/ast-extractor.js' },
        { role: 'assistant', type: 'tool_call', tool: 'run_command', input: 'npm install tree-sitter tree-sitter-javascript' },
        { role: 'user', type: 'text', content: '好，然后调 LLM 怎么设计 prompt？' },
        { role: 'assistant', type: 'text', content: '给 LLM 函数签名和上下文，让它生成说明：' },
        { role: 'assistant', type: 'code', lang: 'javascript', content: 'const prompt = `\n你是一个技术文档专家。请基于以下函数签名生成 Markdown 文档：\n\n函数名: ${funcName}\n参数: ${JSON.stringify(params)}\n返回类型: ${returnType}\n\n要求：\n- 简明描述（1-2 句话）\n- 参数说明\n- 返回值说明\n- 一个使用示例\n`;\n\nconst doc = await llm.complete(prompt);' },
        { role: 'user', type: 'text', content: '嗯，先这样。' },
        { role: 'assistant', type: 'file_change', file: 'src/doc-generator.js', diff: '+ prompt template\n+ llm.complete wrapper\n~ error handling' }
      ]
    },
    {
      id: 'sess_01HMX3NKTQ',
      project: 'ai-doc-assistant',
      projectPath: '~/projects/ai-doc-assistant',
      startTime: '2026-07-04 13:55',
      endTime: '2026-07-04 14:40',
      messageCount: 9,
      toolCallCount: 3,
      fileChangeCount: 2,
      preview: '处理 TypeScript 的时候要小心泛型语法，AST 会更复杂',
      messages: [
        { role: 'user', type: 'text', content: '处理 TypeScript 的时候要小心泛型语法，AST 会更复杂吧？' },
        { role: 'assistant', type: 'text', content: '是的。TypeScript 的 type_parameters 节点需要特殊处理。' },
        { role: 'assistant', type: 'code', lang: 'javascript', content: 'function extractTypeParams(node) {\n  const typeParams = node.childForFieldName("type_parameters");\n  if (!typeParams) return "";\n  return typeParams.text; // "<T extends Comparable>"' },
        { role: 'user', type: 'text', content: '那装饰器呢？NestJS 那种' },
        { role: 'assistant', type: 'text', content: '装饰器在 TypeScript AST 里是 decorator 节点，但和函数声明是同级，不是 child。遍历时要注意：' },
        { role: 'assistant', type: 'code', lang: 'javascript', content: 'function extractDecorators(parent) {\n  return parent.children\n    .filter(c => c.type === "decorator")\n    .map(d => "@" + d.text);\n}' },
        { role: 'assistant', type: 'file_change', file: 'src/ast-extractor.js', diff: '+ extractTypeParams\n+ extractDecorators\n~ traverse function' }
      ]
    },
    {
      id: 'sess_01HMX3P2VR',
      project: 'ai-doc-assistant',
      projectPath: '~/projects/ai-doc-assistant',
      startTime: '2026-07-02 10:20',
      endTime: '2026-07-02 11:05',
      messageCount: 11,
      toolCallCount: 4,
      fileChangeCount: 3,
      preview: '测试一下生成的文档质量，看 GPT-4 vs Claude 哪个更好',
      messages: [
        { role: 'user', type: 'text', content: '测试一下生成的文档质量，看 GPT-4 vs Claude 哪个更好。' },
        { role: 'assistant', type: 'text', content: '好。先准备 20 个测试用例，涵盖简单函数、类、复杂泛型。' },
        { role: 'assistant', type: 'tool_call', tool: 'write_file', input: 'tests/fixtures/' },
        { role: 'user', type: 'text', content: '用什么维度评估？' },
        { role: 'assistant', type: 'text', content: '建议四个维度：\n1. 准确性（信息是否正确）\n2. 完整性（是否漏掉关键信息）\n3. 可读性（自然语言流畅度）\n4. 示例质量（使用示例是否合理）' },
        { role: 'assistant', type: 'code', lang: 'markdown', content: '## 评估报告\n\n| 函数 | 模型 | 准确性 | 完整性 | 可读性 | 示例 |\n|---|---|---|---|---|---|\n| debounce | GPT-4 | 5/5 | 4/5 | 5/5 | 4/5 |\n| debounce | Claude | 5/5 | 5/5 | 4/5 | 5/5 |\n| ... | ... | ... | ... | ... | ... |' },
        { role: 'user', type: 'text', content: '结论？' },
        { role: 'assistant', type: 'text', content: '两者差不多，Claude 在示例上略胜，GPT-4 在描述简洁性上略胜。可以双模型调用让用户选。' }
      ]
    },
    {
      id: 'sess_01HMX3PCYW',
      project: 'ai-doc-assistant',
      projectPath: '~/projects/ai-doc-assistant',
      startTime: '2026-06-30 15:00',
      endTime: '2026-06-30 16:20',
      messageCount: 7,
      toolCallCount: 2,
      fileChangeCount: 2,
      preview: '要不要支持增量更新？文件改了就重新生成',
      messages: [
        { role: 'user', type: 'text', content: '要不要支持增量更新？文件改了就重新生成。' },
        { role: 'assistant', type: 'text', content: '必须支持。用 chokidar 监听文件变化：' },
        { role: 'assistant', type: 'code', lang: 'javascript', content: 'const chokidar = require("chokidar");\n\nconst watcher = chokidar.watch("./src", {\n  ignoreInitial: true,\n  ignored: /node_modules/\n});\n\nwatcher.on("change", async (path) => {\n  console.log(`File changed: ${path}`);\n  await regenerateDoc(path);\n});' },
        { role: 'assistant', type: 'file_change', file: 'src/watcher.js', diff: '+ chokidar integration\n+ regenerateDoc function\n~ error handling' },
        { role: 'user', type: 'text', content: '好。' }
      ]
    },

    // ===== Project 3: side-blog =====
    {
      id: 'sess_01HMX3Q8ZE',
      project: 'side-blog',
      projectPath: '~/projects/side-blog',
      startTime: '2026-07-05 20:15',
      endTime: '2026-07-05 21:30',
      messageCount: 10,
      toolCallCount: 4,
      fileChangeCount: 3,
      preview: '博客想加个评论系统，有什么轻量方案？',
      messages: [
        { role: 'user', type: 'text', content: '博客想加个评论系统，有什么轻量方案？' },
        { role: 'assistant', type: 'text', content: '几个选择：\n1. Giscus（基于 GitHub Discussions，免费）\n2. Cusdis（自托管，轻量）\n3. Twikoo（云函数部署）\n\n推荐 Giscus，零运维。' },
        { role: 'user', type: 'text', content: 'Giscus 怎么集成？' },
        { role: 'assistant', type: 'text', content: '去 giscus.app 配置一下，拿到 script 标签，贴到博客模板：' },
        { role: 'assistant', type: 'code', lang: 'html', content: '<!-- 放在文章底部 -->\n<script src="https://giscus.app/client.js"\n        data-repo="[你的仓库]"\n        data-repo-id="[id]"\n        data-category="Comments"\n        data-category-id="[id]"\n        data-mapping="pathname"\n        data-strict="0"\n        data-reactions-enabled="1"\n        data-emit-metadata="0"\n        data-input-position="bottom"\n        data-theme="preferred_color_scheme"\n        data-lang="zh-CN"\n        crossorigin="anonymous"\n        async>\n</script>' },
        { role: 'assistant', type: 'file_change', file: 'themes/default/layouts/post.html', diff: '+ giscus script block' },
        { role: 'user', type: 'text', content: '好。' }
      ]
    },
    {
      id: 'sess_01HMX3QNGD',
      project: 'side-blog',
      projectPath: '~/projects/side-blog',
      startTime: '2026-07-01 09:30',
      endTime: '2026-07-01 10:15',
      messageCount: 8,
      toolCallCount: 3,
      fileChangeCount: 2,
      preview: 'RSS feed 输出不对，文章日期格式有问题',
      messages: [
        { role: 'user', type: 'text', content: 'RSS feed 输出不对，文章日期格式有问题。' },
        { role: 'assistant', type: 'text', content: '我看看你的 feed 模板：' },
        { role: 'assistant', type: 'code', lang: 'xml', content: '<item>\n  <title>{{ .Title }}</title>\n  <link>{{ .Permalink }}</link>\n  <pubDate>{{ .Date }}</pubDate> <!-- 这里要 RFC822 格式 -->\n</item>' },
        { role: 'user', type: 'text', content: '对，要 RFC822。' },
        { role: 'assistant', type: 'text', content: '改一下：' },
        { role: 'assistant', type: 'code', lang: 'html', content: '<pubDate>{{ .Date.Format "Mon, 02 Jan 2006 15:04:05 -0700" }}</pubDate>' },
        { role: 'assistant', type: 'file_change', file: 'layouts/rss.xml', diff: '- <pubDate>{{ .Date }}</pubDate>\n+ <pubDate>{{ .Date.Format "Mon, 02 Jan 2006 15:04:05 -0700" }}</pubDate>' }
      ]
    }
  ]
};
