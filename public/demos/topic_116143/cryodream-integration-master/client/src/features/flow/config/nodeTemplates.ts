import type { ComponentTemplate, NodeCategory, NodeTemplate, SidebarCategory, TemplateField, TemplateOutput } from '../types'

export const sidebarCategories: SidebarCategory[] = [
  { display_name: '已保存', name: 'saved_components', icon: 'Save' },
  { display_name: '输入/输出', name: 'input_output', icon: 'Cable' },
  { display_name: '数据源', name: 'data_source', icon: 'Database' },
  { display_name: '智能体和模型', name: 'models_and_agents', icon: 'Bot' },
  { display_name: '文件与知识', name: 'files_and_knowledge', icon: 'Layers' },
  { display_name: '数据处理', name: 'processing', icon: 'ListFilter' },
  { display_name: '流程控制', name: 'flow_controls', icon: 'ArrowRightLeft' },
  { display_name: '实用工具', name: 'utilities', icon: 'Wand2' },
  { display_name: '工具', name: 'tools', icon: 'Hammer' },
  { display_name: '向量存储', name: 'vectorstores', icon: 'Layers' },
]

const field = (
  name: string,
  displayName: string,
  type: string,
  inputTypes: string[] = [],
  value: unknown = '',
  required = false,
  options?: Partial<Pick<TemplateField, 'advanced' | 'info' | 'options' | 'placeholder' | 'tool_mode' | 'modelType'>>
): TemplateField => ({
  name,
  display_name: displayName,
  type,
  input_types: inputTypes,
  value,
  required,
  ...options,
})

const output = (name: string, displayName: string, types: string[]): TemplateOutput => ({
  name,
  display_name: displayName,
  types,
})

const component = (
  category: string,
  type: string,
  displayName: string,
  description: string,
  icon: string,
  baseClasses: string[],
  template: Record<string, TemplateField>,
  outputs: TemplateOutput[],
  options?: Pick<ComponentTemplate, 'beta' | 'legacy' | 'source' | 'bundle' | 'mcpServer'>
): NodeTemplate => {
  const node: ComponentTemplate = {
    type,
    display_name: displayName,
    description,
    icon,
    base_classes: baseClasses,
    category,
    template,
    outputs,
    ...options,
  }

  return {
    id: `${category}-${type}`,
    category,
    name: type,
    display_name: displayName,
    description,
    icon,
    beta: options?.beta,
    legacy: options?.legacy,
    source: options?.source ?? (options?.legacy ? 'legacy' : 'core'),
    bundle: options?.bundle,
    mcpServer: options?.mcpServer,
    node,
  }
}

export const nodeTemplates: NodeTemplate[] = [
  component(
    'models_and_agents',
    'ScilWorkflow',
    'SCIL工作流',
    '承接 SCIL 动作迁移后的工作流执行节点，可输出图片或视频。',
    'Workflow',
    ['Action'],
    {
      workflow_id: field('workflow_id', '工作流ID', 'str', [], '', true),
      action_name: field('action_name', '动作名称', 'str', [], ''),
    },
    [output('image', '图片', ['Image']), output('video', '视频', ['Video'])]
  ),

  component('input_output', 'ChatInput', '聊天输入', '获取聊天消息，作为对话流程的入口。', 'MessageSquareText', ['Message'], { input_value: field('input_value', '输入', 'str', [], '你好，请帮我完成任务。') }, [output('message', '消息', ['Message'])]),
  component('input_output', 'VideoOutput', '视频输出', '接收并展示视频类型输出。', 'Video', ['Video'], { input_value: field('input_value', '视频', 'video', ['Video'], '', true) }, []),
  component('input_output', 'ChatOutput', '聊天输出', '显示聊天结果，作为对话流程的最终响应。', 'MessageSquareReply', ['Message'], { input_value: field('input_value', '输出内容', 'str', ['Message', 'Data'], '', true) }, [output('result', '输出', ['Message'])]),
  component('input_output', 'TextInput', '文本输入', '提供一段可复用的文本值。', 'TextCursorInput', ['Text'], { input_value: field('input_value', '文本', 'str', [], '') }, [output('text', '文本', ['Text'])]),
  component('input_output', 'TextOutput', '文本输出', '显示或导出文本结果。', 'Text', ['Text'], { input_value: field('input_value', '输出内容', 'str', ['Text'], '', true) }, [output('result', '输出', ['Text'])]),
  component('input_output', 'Webhook', '网络回调', '从网络回调请求中接收输入数据。', 'Webhook', ['Data'], {}, [output('data', '数据', ['Data'])]),
  component(
    'input_output',
    'ObjectInput',
    '对象输入',
    '解析 JSON 对象输入为独立字段，存入流程变量供下游 PromptTemplate 等节点通过 {{变量名}} 引用。',
    'Braces',
    ['Data'],
    {
      input_value: field('input_value', 'JSON 输入', 'str', ['Text', 'Message'], '', true, { info: 'JSON 对象字符串，解析后各字段存入流程变量', placeholder: '{"key": "value"}' }),
    },
    [output('data', '解析结果', ['Data', 'Text'])]
  ),

  component('data_source', 'URL', '网页地址', '从网页地址读取内容。', 'Globe', ['Data'], { urls: field('urls', '网页地址', 'str', [], '') }, [output('data', '数据', ['Data'])], { source: 'bundle', bundle: 'Web' }),
  component('data_source', 'APIRequest', '接口请求', '向网络接口发起请求并返回数据。', 'Network', ['Data'], { url: field('url', '请求地址', 'str', [], ''), method: field('method', '请求方法', 'str', [], 'GET') }, [output('data', '数据', ['Data'])], { source: 'bundle', bundle: 'Web' }),
  component('data_source', 'Directory', '目录读取', '读取目录中的文件。', 'FolderOpen', ['Data'], { path: field('path', '目录路径', 'str', [], '') }, [output('data', '数据', ['Data'])]),
  component('data_source', 'File', '文件读取', '读取单个文件。', 'File', ['Data'], { path: field('path', '文件路径', 'str', [], '') }, [output('data', '数据', ['Data'])]),
  component('data_source', 'SQLDatabase', '数据库查询', '连接数据库并查询数据。', 'DatabaseZap', ['Data'], { connection: field('connection', '连接配置', 'str', [], ''), query: field('query', '查询语句', 'str', [], '') }, [output('data', '数据', ['Data'])]),

  component(
    'models_and_agents',
    'EmbeddingModel',
    '嵌入模型',
    '从模型配置中选择文本嵌入模型，用于向量化内容。',
    'ScanSearch',
    ['EmbeddingModel'],
    {
      model_config_id: field('model_config_id', '模型配置', 'model_config', [], '', true),
      input_value: field('input_value', '输入', 'str', ['Text', 'Message', 'Data'], '', true),
    },
    [output('embeddings', '嵌入向量', ['Embeddings'])]
  ),
  component(
    'models_and_agents',
    'PromptTemplate',
    '提示模板',
    '编写可复用提示词模板，可连接到模型的系统消息输入。',
    'Braces',
    ['Prompt'],
    {
      template: field('template', '模板', 'str', [], '你是一个专业助手，请根据用户问题给出清晰回答。'),
    },
    [output('prompt', '提示词', ['Prompt', 'Text'])]
  ),
  component(
    'models_and_agents',
    'MessageHistory',
    '消息历史',
    '保存并输出对话历史，供模型或智能体使用。',
    'History',
    ['Memory'],
    {
      session_id: field('session_id', '会话 ID', 'str', [], 'default'),
      input_value: field('input_value', '输入', 'str', ['Message', 'Text'], ''),
    },
    [output('history', '历史消息', ['Memory', 'Message'])]
  ),
  component(
    'models_and_agents',
    'LanguageModel',
    '语言模型',
    '选择模型配置，接收输入和系统消息，输出模型响应。',
    'BrainCog',
    ['LanguageModel'],
    {
      model_config_id: field('model_config_id', '选择模型', 'model_config', [], '', false, { info: '留空时后端自动选择一个已启用的对话模型', modelType: 'chat' }),
      tools: field('tools', '工具 / Skills', 'tools', ['Tool'], [], false, { tool_mode: true }),
      input_value: field('input_value', '输入', 'str', ['Message', 'Text', 'Data'], '', true),
      system_message: field('system_message', '系统消息输入', 'str', ['Prompt', 'Text'], '你是一个有帮助的 AI 助手。'),
      temperature: field('temperature', '温度覆盖', 'float', [], 0.1, false, { advanced: true }),
      max_tokens: field('max_tokens', '最大令牌数覆盖（留空=模型最大）', 'int', [], '', false, { advanced: true }),
    },
    [output('response', '响应内容', ['Message', 'Text']), output('model', '语言模型', ['LanguageModel'])]
  ),
  component(
    'models_and_agents',
    'Agent',
    '智能体',
    '定义智能体指令、可用工具和输入内容。',
    'Bot',
    ['Agent'],
    {
      agent_model_config_id: field('agent_model_config_id', '选择模型', 'model_config', [], '', true),
      tools: field('tools', '工具', 'tools', ['Tool'], [], false, { tool_mode: true }),
      input_value: field('input_value', '输入', 'str', ['Message', 'Text'], '', true),
      system_prompt: field('system_prompt', '智能体指令', 'str', [], '你是一个有帮助的智能体，可以使用工具回答用户问题。'),
      add_current_date_tool: field('add_current_date_tool', '添加当前日期工具', 'bool', [], true),
    },
    [output('response', '响应', ['Message']), output('agent', '智能体', ['Agent'])]
  ),

  component('files_and_knowledge', 'ParseData', '数据解析', '把文本或文件解析为数据。', 'FileSearch', ['Data'], { input_value: field('input_value', '输入', 'str', ['Text', 'File'], '') }, [output('data', '数据', ['Data'])]),
  component('files_and_knowledge', 'KnowledgeBase', '知识库', '连接知识库检索内容。', 'Library', ['Retriever'], { query: field('query', '查询', 'str', ['Text'], '') }, [output('retriever', '检索器', ['Retriever'])]),
  component('files_and_knowledge', 'FileUpload', '文件上传', '上传文件并传入流程。', 'UploadCloud', ['File'], {}, [output('file', '文件', ['File'])]),
  component(
    'files_and_knowledge',
    'DocumentLoader',
    '文档加载器',
    '加载文档并解析为纯文本，支持从知识库选择或手动输入。',
    'Paperclip',
    ['Data'],
    {
      document_id: field('document_id', '选择文档', 'document', [], ''),
      file_path: field('file_path', '文件路径', 'str', ['File'], ''),
      content: field('content', '文本内容', 'str', ['Text'], ''),
      file_type: field('file_type', '文件类型', 'str', [], 'txt'),
    },
    [output('text', '文本', ['Text'])]
  ),
  component(
    'files_and_knowledge',
    'FileLoader',
    '文件解析',
    '读取上传的文件（txt/md/pdf 等），解析为 markdown 正文。是「文件解析入库」工作流的起点，运行时由入库入口注入文件路径，也支持调试时手填路径。',
    'FileText',
    ['Text'],
    {
      file_path: field('file_path', '文件路径', 'str', ['Text'], '', false, { info: '调试时填写本地文件路径；正式入库时由运行时注入' }),
    },
    [output('text', 'markdown 正文', ['Text']), output('success', '是否成功', ['Data']), output('title', '标题', ['Text']), output('fileType', '文件类型', ['Text'])]
  ),
  component(
    'files_and_knowledge',
    'URLInput',
    '网页地址输入',
    '网页工作流的统一入口，输出 url 给下游网页提取方案。正式入库时由运行时注入实际 URL。',
    'Link',
    ['Text'],
    {
      url: field('url', '网页地址', 'str', ['Text'], '', false, { info: '调试时填写目标网页 URL；正式入库时由运行时注入' }),
    },
    [output('url', '网页地址', ['Text'])]
  ),
  component(
    'files_and_knowledge',
    'WebFetchJsoup',
    '网页提取·jsoup',
    '方案一（首选）：本地 jsoup + readability 提取网页正文。免费最快，适合静态/正文规整的网页（博客、文档站、新闻）。成功则后续方案自动短路跳过；失败则降级到下一个。',
    'Globe',
    ['Data'],
    {
      url: field('url', '网页地址', 'str', ['Text'], '', false, { info: '由 URL 输入节点注入；也可单独填写用于调试' }),
      input: field('input', '上游正文', 'str', ['Text'], '', false, { info: '上游提取结果；已合格则短路跳过本级' }),
    },
    [output('text', '正文', ['Text']), output('success', '是否成功', ['Data']), output('title', '标题', ['Text'])]
  ),
  component(
    'files_and_knowledge',
    'WebFetchJina',
    '网页提取·Jina',
    '方案二（降级）：上游成功则短路透传、不调用；上游失败才用 Jina Reader（r.jina.ai）提取，可处理公众号、知乎等 JS 动态渲染页面。',
    'Globe',
    ['Data'],
    {
      url: field('url', '网页地址', 'str', ['Text'], '', false, { info: '由 URL 输入节点注入；也可单独填写用于调试' }),
      input: field('input', '上游正文', 'str', ['Text'], '', false, { info: '上游提取的正文' }),
      upstream_success: field('upstream_success', '上游是否成功', 'str', ['Data'], '', false, { info: '上游提取成功标志；为 true 则短路跳过本级' }),
    },
    [output('text', '正文', ['Text']), output('success', '是否成功', ['Data']), output('title', '标题', ['Text'])]
  ),
  component(
    'files_and_knowledge',
    'WebFetchScrapling',
    '网页提取·Scrapling',
    '方案三（兜底）：上游成功则短路透传、不调用；上游均失败才用 Scrapling 爬虫微服务提取，具备反爬绕过能力，应对 Cloudflare 等强反爬站点。需开启 scrapling 配置。本节点输出即网页工作流最终 markdown 正文。',
    'Globe',
    ['Data'],
    {
      url: field('url', '网页地址', 'str', ['Text'], '', false, { info: '由 URL 输入节点注入；也可单独填写用于调试' }),
      input: field('input', '上游正文', 'str', ['Text'], '', false, { info: '上游提取的正文' }),
      upstream_success: field('upstream_success', '上游是否成功', 'str', ['Data'], '', false, { info: '上游提取成功标志；为 true 则短路跳过本级' }),
    },
    [output('text', 'markdown 正文', ['Text']), output('success', '是否成功', ['Data']), output('title', '标题', ['Text'])]
  ),
  component(
    'files_and_knowledge',
    'DouyinVideoDownloader',
    '抖音链接解析下载',
    '解析抖音分享链接/分享文本，携带服务端配置的 Cookie 请求抖音详情接口，将视频下载到宿主机本地媒体库，并输出本地视频路径。',
    'Link',
    ['Text'],
    {
      url: field('url', '抖音链接/分享文本', 'str', ['Text'], '', false, { info: '正式入库时由上传抽屉注入；调试时可粘贴完整抖音分享文本' }),
      kb_id: field('kb_id', '目标知识库', 'knowledge_base', [], '', false, { info: '正式入库时由运行时注入' }),
    },
    [output('file_path', '本地视频路径', ['Text']), output('relative_path', '媒体库相对路径', ['Text']), output('title', '视频标题', ['Text']), output('metadata', '抖音元数据', ['Data'])]
  ),
  component(
    'files_and_knowledge',
    'VideoAudioTranscriber',
    '视频音频转录',
    '从视频或音频文件中提取语音，使用 FFmpeg Whisper 转录为文字，输出 SRT 字幕和 Markdown 文本。支持 mp4/mkv/avi/wav/mp3 等格式。',
    'Video',
    ['Text'],
    {
      file_path: field('file_path', '文件路径', 'str', ['Text'], '', false, { info: '视频或音频文件的本地路径；正式入库时由运行时注入' }),
      language: field('language', '语言', 'str', [], 'zh', false, { info: 'Whisper 转录语言，zh=中文，en=英文，auto=自动检测', placeholder: 'zh', options: ['zh', 'auto', 'en'] }),
      script: field('script', '中文字形', 'str', [], 'simplified', false, { info: '转录后的中文输出字形：simplified=简体，traditional=繁体，none=不转换', placeholder: 'simplified', options: ['simplified', 'traditional', 'none'] }),
      output_format: field('output_format', '输出格式', 'str', [], 'srt', false, { info: 'Whisper 输出格式：srt（字幕）/ text（纯文本）/ json', placeholder: 'srt', options: ['srt', 'text', 'json'] }),
    },
    [output('text', 'Markdown 正文', ['Text']), output('srt', 'SRT 字幕', ['Data']), output('title', '标题', ['Text']), output('duration', '时长', ['Data'])]
  ),
  component(
    'files_and_knowledge',
    'SaveToKnowledgeBase',
    '存入知识库',
    '把解析得到的 markdown 存为知识库里的一篇文档（status=parsed）。这是「入知识库」而非「入 RAG」——只做文档级存储，不做分块/向量化；分块向量化在点「入库」时走认知级工作流。',
    'Database',
    ['Data'],
    {
      text: field('text', 'markdown 正文', 'str', ['Text'], '', true, { info: '上游提取的网页正文' }),
      kb_id: field('kb_id', '目标知识库', 'knowledge_base', [], '', true, { info: '选择文档存入的目标知识库', placeholder: '请选择知识库' }),
      title: field('title', '文档标题', 'str', ['Text'], '', false, { info: '留空则使用网页标题' }),
    },
    [output('documentId', '文档ID', ['Data']), output('title', '标题', ['Text'])]
  ),
  component(
    'files_and_knowledge',
    'Translate',
    '翻译·非中文转中文',
    '针对非中文网页：本地检测中文占比，已是中文则短路透传、不调大模型；外文且配置了翻译模型才译为中文。放在提取后、存库前，保证存进知识库的正文为中文，便于中文检索。未配置模型时默认不翻、直接透传。',
    'Languages',
    ['Text'],
    {
      input: field('input', '上游正文', 'str', ['Text'], '', false, { info: '上游提取的网页正文' }),
      model_config_id: field('model_config_id', '翻译模型', 'model_config', [], '', false, { info: '选择用于翻译的大模型；留空则不翻译、直接透传', placeholder: '留空则不翻译' }),
      chunk_size: field('chunk_size', '分段长度', 'int', [], 3000, false, { info: '超长正文按此字符数分段翻译再拼接，避免撞模型上下文上限' }),
    },
    [output('text', '中文正文', ['Text']), output('translated', '是否翻译', ['Data'])]
  ),
  component(
    'files_and_knowledge',
    'GlobalMetadataExtractor',
    '全局元数据提取',
    '使用 LLM 提取文档的全局元数据（领域、主题、实体、概念），用于后续 Chunk 的三维背包挂载。',
    'Metadata',
    ['Data'],
    {
      input: field('input', '输入文本', 'str', ['Text'], '', true),
      model_config_id: field('model_config_id', '模型配置', 'model_config', [], '', false),
    },
    [
      output('metadata', '完整元数据', ['Data']),
      output('domain', '领域', ['Text']),
      output('theme', '主题', ['Text']),
      output('entities', '实体列表', ['Data']),
      output('concepts', '概念列表', ['Data']),
    ]
  ),
  component(
    'files_and_knowledge',
    'SemanticChunker',
    '语义分块',
    '按段落逻辑切分文本，支持自定义分块大小和重叠。',
    'Scissors',
    ['Data'],
    {
      input: field('input', '输入文本', 'str', ['Text', 'Data'], '', true),
      chunk_size: field('chunk_size', '分块大小', 'int', [], 500),
      overlap_size: field('overlap_size', '重叠大小', 'int', [], 50),
    },
    [output('chunks', '文本块', ['Data']), output('chunkCount', '块数量', ['Number'])]
  ),
  component(
    'files_and_knowledge',
    'IntelligentSemanticChunker',
    '智能语义分块',
    '使用 LLM 识别语义边界进行分块，避免因果关系断裂。每个块是一个完整的语义单元。',
    'BrainCircuit',
    ['Data'],
    {
      input: field('input', '输入文本', 'str', ['Text', 'Data'], '', true),
      model_config_id: field('model_config_id', '模型配置', 'model_config', [], '', true, { info: '选择 LLM 模型用于语义边界识别' }),
    },
    [output('chunks', '文本块', ['Data']), output('chunkCount', '块数量', ['Number'])]
  ),
  component(
    'files_and_knowledge',
    'MetadataAttacher',
    '元数据附加器',
    '将全局元数据（领域/主题/实体/概念）附加到每个 Chunk，形成「三维背包」结构。',
    'Link2',
    ['Data'],
    {
      chunks: field('chunks', '文本块', 'str', ['Data'], '', true),
      metadata: field('metadata', '全局元数据', 'str', ['Data'], '', true),
      time_stamp: field('time_stamp', '时间戳', 'str', [], '2026-06'),
      claim_type: field('claim_type', '主张类型', 'str', [], '事实陈述', false, { options: ['事实陈述', '观点预测', '情绪发泄', '营销主张'] }),
      source: field('source', '来源', 'str', [], ''),
      confidence: field('confidence', '置信度', 'float', [], 0.8, false, { info: '0.0-1.0，决定最终输出的权重' }),
    },
    [output('enriched_chunks', '带背包的文本块', ['Data']), output('chunkCount', '块数量', ['Number'])]
  ),
  component(
    'files_and_knowledge',
    'KnowledgeBaseWriter',
    '知识库写入',
    '将 Chunk 数据连同「全息元数据背包」一起写入知识库，支持向量化存储。',
    'Save',
    ['Data'],
    {
      chunks: field('chunks', '文本块数据', 'str', ['Data'], '', true),
      kb_id: field('kb_id', '知识库 ID', 'str', [], '', true),
      embedding_model_id: field(
        'embedding_model_id',
        '嵌入模型',
        'model_config',
        [],
        '',
        false,
        { info: '选择已配置的 embedding 类型模型，用于将文本块向量化', placeholder: '请先在「模型设置」中添加嵌入模型', modelType: 'embedding' }
      ),
      metadata_json: field(
        'metadata_json',
        '全息元数据 (JSON)',
        'str',
        [],
        JSON.stringify(
          {
            '1_Domain_Scope': { domain: '', theme: '' },
            '2_Ontology_Routing': { event_id: '', entities: [], concepts: [] },
            '3_Epistemology_Tag': { time_stamp: '', claim_type: '事实陈述', source: '', confidence: 0.8 },
          },
          null,
          2
        ),
        false,
        {
          info: '每个 Chunk 必须背着这个三维背包：领域范围(Domain/Theme) + 本体路由(Entities/Concepts) + 认识论标签(Claim/Confidence)',
          placeholder: '三维元数据 JSON',
        }
      ),
    },
    [output('result', '结果', ['Data'])]
  ),

  component(
    'files_and_knowledge',
    'ThinkingModelWriter',
    '思维模型落库',
    '将标准化工具 JSON 写入 thinking_model 表，完成思维模型入库。',
    'Save',
    ['Data'],
    {
      input: field('input', '工具 JSON', 'str', ['Data', 'Text'], '', true, { info: '上游 FormatValidator 校验后的 JSON 对象' }),
      raw_text: field('raw_text', '原始文本', 'str', [], '', false, { info: '原始输入的文章文本（自动注入）' }),
    },
    [output('result', '入库结果', ['Data'])]
  ),

  component(
    'files_and_knowledge',
    'QueryRewriter',
    '意图重构',
    '使用 LLM 把模糊提问翻译为标准 JSON 查询条件（时间窗口/领域/实体/概念/置信度），缺失项自动补全。',
    'Sparkles',
    ['Data'],
    {
      query: field('query', '检索提问', 'str', ['Text'], '', true),
      model_config_id: field('model_config_id', '模型配置', 'model_config', [], '', false, { info: '选择 LLM 模型用于意图重构，留空自动选用可用模型' }),
    },
    [output('semanticQuery', '语义查询', ['Text']), output('rewrittenQuery', '重构条件', ['Data'])]
  ),
  component(
    'files_and_knowledge',
    'VectorSearch',
    '向量召回',
    '在知识库内按向量余弦相似度召回候选文本块，可接意图重构节点的语义查询。',
    'ScanSearch',
    ['Data'],
    {
      kb_id: field('kb_id', '知识库 ID', 'str', [], '', true),
      query: field('query', '查询文本', 'str', ['Text'], ''),
      candidate_limit: field('candidate_limit', '候选数量', 'int', [], 50, false, { info: '向量召回的候选集大小，后续可由元数据重排截取 TopK' }),
    },
    [output('chunks', '候选文本块', ['Data']), output('chunkCount', '候选数量', ['Number'])]
  ),
  component(
    'files_and_knowledge',
    'MetadataFilter',
    '元数据软加权',
    '对候选文本块按三维背包元数据（时间/置信度/领域/实体/概念）软加权重排，缺失不惩罚，输出 TopK。',
    'SlidersHorizontal',
    ['Data'],
    {
      chunks: field('chunks', '候选文本块', 'str', ['Data'], '', true),
      rewritten_query: field('rewritten_query', '重构条件', 'str', ['Data'], ''),
      top_k: field('top_k', '返回数量', 'int', [], 10),
    },
    [output('chunks', '重排文本块', ['Data']), output('chunkCount', '块数量', ['Number'])]
  ),
  component(
    'files_and_knowledge',
    'HybridRetriever',
    '混合检索',
    '一体化检索：意图重构 + 向量召回 + 元数据软加权融合排序，直接输出可供研判的上下文。',
    'Search',
    ['Data'],
    {
      kb_id: field('kb_id', '知识库 ID', 'str', [], '', true),
      query: field('query', '检索提问', 'str', ['Text'], '', true),
      model_config_id: field('model_config_id', '模型配置', 'model_config', [], '', false, { info: '用于意图重构的 LLM 模型，留空自动选用可用模型' }),
    },
    [output('context', '检索上下文', ['Text']), output('chunks', '文本块', ['Data']), output('chunkCount', '召回数量', ['Number'])]
  ),
  component(
    'files_and_knowledge',
    'IntelligenceAnalyzer',
    '情报分析师',
    '认知级研判：检索召回 + LLM 生成分层研判简报（核心研判/底层逻辑/数据事实/市场叙事/行动建议）+ 真实溯源锚点。',
    'FileSearch',
    ['Data'],
    {
      kb_id: field('kb_id', '知识库 ID', 'str', [], '', true),
      query: field('query', '研判提问', 'str', ['Text'], '', true),
      model_config_id: field('model_config_id', '模型配置', 'model_config', [], '', false, { info: '用于研判生成的 LLM 模型，留空自动选用可用模型' }),
    },
    [output('report', '研判简报', ['Text']), output('citations', '溯源锚点', ['Data'])]
  ),
  component('processing', 'SplitText', '文本切分', '把长文本切分为小片段。', 'Scissors', ['Data'], { text: field('text', '文本', 'str', ['Text', 'Data'], ''), chunk_size: field('chunk_size', '分块大小', 'int', [], 1000) }, [output('chunks', '文本块', ['Data'])]),
  component('processing', 'CombineText', '文本合并', '合并多段文本。', 'Combine', ['Text'], { input_values: field('input_values', '输入列表', 'str', ['Text', 'Data'], '') }, [output('text', '文本', ['Text'])]),
  component('processing', 'FilterData', '数据筛选', '按条件筛选数据。', 'Filter', ['Data'], { data: field('data', '数据', 'data', ['Data'], '', true), condition: field('condition', '条件', 'str', [], '') }, [output('data', '数据', ['Data'])]),
  component('processing', 'TransformData', '数据转换', '转换数据字段。', 'Replace', ['Data'], { data: field('data', '数据', 'data', ['Data'], '', true), expression: field('expression', '表达式', 'str', [], '') }, [output('data', '数据', ['Data'])]),

  component('flow_controls', 'IfElse', '条件分支', '根据条件选择分支。', 'GitBranch', ['Logic'], { condition: field('condition', '条件', 'bool', ['Boolean'], false) }, [output('true_result', '成立', ['Data', 'Text']), output('false_result', '不成立', ['Data', 'Text'])]),
  component('flow_controls', 'Loop', '循环', '循环处理列表项。', 'Repeat2', ['Logic'], { items: field('items', '项目列表', 'list', ['Data'], []) }, [output('item', '当前项', ['Data']), output('done', '完成', ['Data'])]),
  component('flow_controls', 'Pass', '直接传递', '原样传递输入。', 'MoveRight', ['Data'], { input_value: field('input_value', '输入', 'any', ['Data', 'Text', 'Message'], '') }, [output('output', '输出', ['Data', 'Text', 'Message'])]),

  component('utilities', 'Calculator', '计算器', '计算数学表达式。', 'Calculator', ['Tool'], { expression: field('expression', '表达式', 'str', [], '') }, [output('result', '结果', ['Number', 'Text'])]),
  component('utilities', 'PythonFunction', 'Python 函数', '执行自定义 Python 逻辑。', 'FileCode2', ['Tool'], { code: field('code', '代码', 'str', [], 'def run(input):\n    return input') }, [output('result', '结果', ['Data'])]),
  component('utilities', 'JSONCleaner', 'JSON 清理器', '清理并解析 JSON 文本。', 'Braces', ['Data'], { input_value: field('input_value', '输入', 'str', ['Text'], '') }, [output('data', '数据', ['Data'])]),

  component(
    'processing',
    'FormatValidator',
    '格式检验器',
    '修正 LLM 输出为指定格式（JSON 对象/数组/候选列表），自动提取 JSON、过滤无效内容、修复格式问题。',
    'ShieldCheck',
    ['Data'],
    {
      input: field('input', 'LLM 输出', 'str', ['Text', 'Message'], '', true, { info: '语言模型的原始输出文本' }),
      expected_format: field('expected_format', '期望格式', 'str', [], 'json_candidates', true, { info: '指定 LLM 应输出的格式', options: ['json_candidates', 'json_object', 'json_array', 'plain_list'] }),
      max_item_length: field('max_item_length', '候选项最大长度', 'int', [], 0, false, { advanced: true, info: '单项最大字符数，0 表示不限制' }),
      context_text: field('context_text', '上下文原文', 'str', [], '', false, { info: '原文片段，用于过滤回传内容（如选中的歌词）' }),
    },
    [output('result', '校验结果 JSON', ['Data', 'Text']), output('count', '有效项数', ['Number'])]
  ),

  component('tools', 'SearchTool', '搜索工具', '封装搜索能力为工具。', 'Search', ['Tool'], { query: field('query', '查询', 'str', ['Text'], '') }, [output('tool', '工具', ['Tool'])], { source: 'mcp', mcpServer: 'search' }),
  component('tools', 'RetrieverTool', '检索工具', '封装检索器为工具。', 'Archive', ['Tool'], { retriever: field('retriever', '检索器', 'retriever', ['Retriever'], '') }, [output('tool', '工具', ['Tool'])], { source: 'mcp', mcpServer: 'retriever' }),
  component('vectorstores', 'Chroma', 'Chroma 向量库', '连接 Chroma 向量库。', 'Boxes', ['VectorStore'], { collection_name: field('collection_name', '集合名称', 'str', [], '') }, [output('vectorstore', '向量库', ['VectorStore'])]),
  component('vectorstores', 'FAISS', 'FAISS 向量库', '使用 FAISS 向量索引。', 'Layers3', ['VectorStore'], { index_path: field('index_path', '索引路径', 'str', [], '') }, [output('vectorstore', '向量库', ['VectorStore'])]),

  component(
    'files_and_knowledge',
    'ContentClassifier',
    '内容分类器',
    '使用 LLM 分析文档内容，判断主要信息类型（事件密集型/观点密集型/案例型/方法论型/描述型）。',
    'Filter',
    ['Data'],
    {
      input: field('input', '输入文本', 'str', ['Text', 'Data'], '', true),
      model_config_id: field('model_config_id', '模型配置', 'model_config', [], '', false, { info: '选择 LLM 模型用于内容分类', modelType: 'chat' }),
    },
    [output('classification', '分类结果', ['Data']), output('primary_type', '主类型', ['Text'])]
  ),
  component(
    'files_and_knowledge',
    'EntityExtractor',
    '实体提取器',
    '从文档中提取关键实体（人物/组织/产品/地点/概念），包含名称、类型和别名。',
    'Users',
    ['Data'],
    {
      input: field('input', '输入文本', 'str', ['Text', 'Data'], '', true),
      model_config_id: field('model_config_id', '模型配置', 'model_config', [], '', false, { info: '选择 LLM 模型用于实体提取', modelType: 'chat' }),
    },
    [output('entities', '实体列表', ['Data']), output('entityCount', '实体数量', ['Number'])]
  ),
  component(
    'files_and_knowledge',
    'EventExtractor',
    '事件提取器',
    '从文档中提取事件及其因果关系，包含主体、动作、结果和因果链。',
    'Zap',
    ['Data'],
    {
      input: field('input', '输入文本', 'str', ['Text', 'Data'], '', true),
      entities_json: field('entities_json', '实体列表', 'str', ['Data'], '', false, { info: '上游实体提取结果（可选）' }),
      model_config_id: field('model_config_id', '模型配置', 'model_config', [], '', false, { info: '选择 LLM 模型用于事件提取', modelType: 'chat' }),
    },
    [output('events', '事件列表', ['Data']), output('eventCount', '事件数量', ['Number'])]
  ),
  component(
    'files_and_knowledge',
    'RelationBuilder',
    '关系构建器',
    '将提取的实体和事件保存到数据库，构建 Entity-Event 和 Event-Event 因果关系。',
    'GitMerge',
    ['Data'],
    {
      entities_json: field('entities_json', '实体数据', 'str', ['Data'], '', true),
      events_json: field('events_json', '事件数据', 'str', ['Data'], '', true),
    },
    [output('result', '构建结果', ['Data']), output('entityCount', '实体数', ['Number']), output('eventCount', '事件数', ['Number'])]
  ),
  component(
    'files_and_knowledge',
    'Neo4jWriter',
    'Neo4j 图写入',
    '将实体、事件和关系写入 Neo4j 图数据库，支持因果链查询和实体画像。',
    'Network',
    ['Data'],
    {
      entity_ids: field('entity_ids', '实体 ID 列表', 'str', ['Data'], '', true),
    },
    [output('result', '写入结果', ['Data']), output('neo4jNodeCount', '节点数', ['Number']), output('neo4jRelCount', '关系数', ['Number'])]
  ),
  component(
    'files_and_knowledge',
    'ViewpointExtractor',
    '观点提取器',
    '从文档中提取观点和评论，包含认识论标签（事实/观点/预测/营销）。',
    'MessageCircle',
    ['Data'],
    {
      input: field('input', '输入文本', 'str', ['Text', 'Data'], '', true),
      entities_json: field('entities_json', '实体列表', 'str', ['Data'], '', false, { info: '上游实体提取结果（可选）' }),
      model_config_id: field('model_config_id', '模型配置', 'model_config', [], '', false, { info: '选择 LLM 模型用于观点提取', modelType: 'chat' }),
    },
    [output('viewpoints', '观点列表', ['Data']), output('viewpointCount', '观点数量', ['Number'])]
  ),
  component(
    'files_and_knowledge',
    'ViewpointWriter',
    '观点落库',
    '将提取的观点写入 viewpoints 表，支持向量化存储和认识论标签。',
    'Save',
    ['Data'],
    {
      viewpoints_json: field('viewpoints_json', '观点数据', 'str', ['Data'], '', true),
      embedding_model_id: field('embedding_model_id', '嵌入模型', 'model_config', [], '', false, { info: '选择嵌入模型用于观点向量化', modelType: 'embedding' }),
    },
    [output('result', '写入结果', ['Data']), output('viewpointCount', '观点数量', ['Number'])]
  ),
  component(
    'files_and_knowledge',
    'CaseExtractor',
    '案例提取器',
    '从文档中提取完整案例结构（背景/做法/过程/结果/经验/教训）。',
    'Briefcase',
    ['Data'],
    {
      input: field('input', '输入文本', 'str', ['Text', 'Data'], '', true),
      model_config_id: field('model_config_id', '模型配置', 'model_config', [], '', false, { info: '选择 LLM 模型用于案例提取', modelType: 'chat' }),
    },
    [output('cases', '案例列表', ['Data']), output('caseCount', '案例数量', ['Number'])]
  ),
  component(
    'files_and_knowledge',
    'CaseWriter',
    '案例落库',
    '将提取的案例写入 cases 表，支持做法和经验的向量化存储。',
    'Save',
    ['Data'],
    {
      cases_json: field('cases_json', '案例数据', 'str', ['Data'], '', true),
      embedding_model_id: field('embedding_model_id', '嵌入模型', 'model_config', [], '', false, { info: '选择嵌入模型用于案例向量化', modelType: 'embedding' }),
    },
    [output('result', '写入结果', ['Data']), output('caseCount', '案例数量', ['Number'])]
  ),
  component(
    'files_and_knowledge',
    'EntityAligner',
    '实体对齐',
    '从落库的 JSON（events/cases/opinions）中按路径提取实体名，命中 knowledge_entities 则关联，未命中则异步建档。',
    'Network',
    ['Data'],
    {
      input_json: field('input_json', '输入 JSON', 'str', ['Data', 'Text'], '', false, { info: '留空时自动读取上游 Writer 传递的 events_json / cases_json / opinions_json' }),
      items_root: field('items_root', '数据数组字段', 'str', [], 'events', false, { info: 'JSON 中的数组根键，如 events / cases / opinions' }),
      entity_paths: field('entity_paths', '实体路径', 'str', [], '["entities[].name","entities[]"]', false, { info: 'JSON 路径数组字符串，支持 a.b、a.b[]、a.b[].c；[] 表示遍历数组' }),
    },
    [output('aligned', '对齐结果', ['Data'])]
  ),
]

export const nodeCategories: NodeCategory[] = sidebarCategories
  .map((category) => ({
    id: category.name,
    name: category.display_name,
    icon: category.icon,
    nodes: nodeTemplates.filter((node) => node.category === category.name),
  }))
  .filter((category) => category.nodes.length > 0)
