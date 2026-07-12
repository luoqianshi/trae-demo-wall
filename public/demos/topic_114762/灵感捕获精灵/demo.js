
(function() {
  // ===== i18n System =====
  var i18n = {
    zh: {
      appTitle: '灵感捕获精灵', appSubtitle: '你的专属创意守护者 · AI 灵感管理智能体', demoTag: 'TRAE AI 创造力大赛 Demo',
      langLabel: '🌐 语言', personalMode: '👤 个人版', teamMode: '👥 团队版',
      tabSearch: '🔍 搜索', tabFile: '📎 文件', tabLink: '🔗 链接与图片', tabText: '📝 文字/语音',
      searchPlaceholder: '输入关键词，AI 精灵帮你搜索相关资料...', searchBtn: '🔍 搜索',
      searchScope: '搜索范围：', searchAll: '全部', searchProduct: '产品', searchResearch: '学术', searchBusiness: '商业', searchTech: '技术',
      searchResults: '搜索结果：', searchResultsLive: '🌐 实时搜索结果（OpenSERP）', searchResultsLocal: '📚 本地模拟数据',
      searchResultsEmpty: '未找到相关结果，换个关键词试试？', searchResultsFound: '找到 {n} 条相关结果，点击选择你感兴趣的条目',
      searchFallback: '⚠️ OpenSERP 未连接，已切换到本地搜索。如需联网搜索，请运行 docker run -p 7000:7000 karust/openserp serve', searchSourceLabel: '来源：',
      searchInspHint: '💡 看了这些搜索结果，写下你的灵感或想法（可选）：',
      searchInspPlaceholder: '搜索结果给了你什么启发？比如："看到这么多AI助老产品，我想做一个专门帮独居老人紧急呼救的智能设备"',
      fileUploadText: '点击上传或拖拽文件到此处', fileUploadHint: '支持 TXT、PDF、DOCX、MD 等文档格式',
      fileListLabel: '已上传的文件：', fileQuickLabel: '快速体验示例文件：',
      fileInspHint: '💡 结合这些资料，写下你的灵感或想法（可选）：',
      fileInspPlaceholder: '看了这些资料，你有什么灵感或想法？比如："基于这份报告的AI趋势分析，我想做一个面向中小企业的AI工具推荐平台"',
      linkPlaceholder: '粘贴文章/网页链接，如 https://example.com/article', linkAddBtn: '添加',
      linkListLabel: '已添加的链接：', linkQuickLabel: '快速体验示例链接：',
      imageUploadLabel: '📷 上传图片灵感：', imageUploadText: '点击上传或拖拽图片到此处', imageUploadHint: '支持 PNG、JPG、GIF、WebP 格式',
      linkInspHint: '💡 看了这些链接/图片，写下你的灵感或想法（可选）：',
      linkInspPlaceholder: '这些内容给了你什么启发？比如："这篇文章提到的多模态AI很有意思，我想做一个用AI帮盲人\'看\'世界的应用"',
      textPlaceholder: '描述你刚刚闪现的灵感... 比如："我想做一个能帮大学生自动规划复习计划的AI工具"',
      voiceBtn: '🎙️ 语音输入', voiceRecording: '⏹️ 停止录音', voiceStatusRecording: '正在录音...请说出你的灵感',
      voiceStatusStopped: '录音已停止', voiceStatusError: '录音出错，请重试', voiceStatusComplete: '录音完成，灵感已填入输入框',
      voiceNotSupported: '当前浏览器不支持语音识别，请使用 Chrome',
      quickIdeasLabel: '快速体验示例灵感：',
      quickFile1: '📊 AI行业报告', quickFile2: '📄 产品需求文档', quickFile3: '📑 学术论文',
      quickLink1: '📄 AI 研究论文', quickLink2: '🔧 GitHub Copilot', quickLink3: '📰 AI 行业分析', quickLink4: '🎨 Figma设计工具', quickLink5: '🤖 OpenAI官方博客',
      quickIdea1: '💊 智能用药提醒', quickIdea2: '📝 AI论文大纲', quickIdea3: '🔧 社区共享工具', quickIdea4: '🏛️ AR博物馆导览', quickIdea5: '♻️ 智能垃圾分类', quickIdea6: '💙 情绪陪伴App',
      fileReadyInfo: '文件已准备好，可以结合下方灵感输入进行捕获。', modeToggleTitle: '切换个人/团队模式', aiThinking: '🧠 AI 正在深度思考中...',
      captureBtn: '✨ 捕获灵感', historyBtn: '📚 灵感库', historyBtnClose: '✕ 关闭灵感库',
      processingTitle: 'AI 精灵正在理解你的灵感...',
      stepContent: '内容识别', stepType: '类型分析', stepRelation: '关联挖掘', stepPlan: '方案生成',
      stepParse: '资料解析', stepExtract: '内容提取', stepDeep: '深度分析', stepReport: '综合报告',
      stepSmartSearch: '智能搜索', stepFilter: '结果筛选', stepAnalysis: '综合分析', stepInspire: '灵感生成',
      resultCaptured: '💡 已捕获的灵感', regenerateBtn: '🔄 重新生成', chatApplyBtn: '✅ 采纳建议并更新卡片', chatUpdating: '⏳ 更新中...', optTitle: '✍️ 提示词优化建议',
      optDesc: '在不改变原意的前提下，AI 对灵感输入进行了优化，使其更清晰、更有结构性。',
      optOriginal: '📝 原始输入', optImproved: '✨ 优化建议',
      graphTitle: '🔗 知识关联图谱', swotTitle: '📊 SWOT 分析',
      swotS: '🟢 优势', swotW: '🔴 劣势', swotO: '🔵 机会', swotT: '🟡 威胁',
      actionTitle: '🎯 行动建议', timelineTitle: '📅 执行时间线',
      analysisTitle: '📋 资料系统性分析', analysisSummary: '📝 内容总结',
      analysisHighlights: '💡 核心亮点', analysisKeypoints: '📌 重点提炼',
      analysisSuggestions: '💬 启发与建议', analysisTopics: '🏷️ 涉及主题',
      historyTitle: '📚 灵感库', historySubtitle: '已按类别自动分类',
      historyEmpty: '暂无历史灵感，快去捕获你的第一个灵感吧！',
      historyEmptyTeam: '团队空间暂无共享灵感，快去捕获并分享第一个灵感吧！',
      historyEmptyFilter: '该分类下暂无灵感记录',
      historyPersonal: '👤 我的灵感', historyTeam: '👥 团队共享',
      teamBarTitle: '团队空间', teamBarSlogan: '集思广益 · 灵感共享',
      shareToTeam: '📤 分享到团队空间', shareToTeamDesc: '💡 这个灵感分析很棒？分享到团队空间，让大家一起头脑风暴！',
      transferTitle: '📨 发送资料给团队成员', transferDesc: '选择成员，将当前分析结果或上传的资料发送给对方',
      transferSent: '已发送 ✓', transferSendTo: '发给',
      adminBadge: '总账号', selfBadge: '我',
      manageMembersBtn: '👥 管理成员', memberManageTitle: '👥 团队成员管理',
      memberNamePlaceholder: '输入成员姓名', memberAvatarPlaceholder: '头像 emoji',
      addMemberBtn: '添加', memberTip: '💡 提示：管理员不可删除。点击成员姓名可编辑。',
      noOtherMembers: '暂无其他团队成员', confirmRemoveMember: '确定要删除成员「',
      confirmRemoveMember2: '」吗？',
      toastCaptureSuccess: '灵感捕获成功！', toastCaptureTeam: '灵感捕获成功！已自动同步到团队空间',
      toastShareTeam: '已分享到团队空间！', toastLoadHistory: '已加载历史灵感',
      toastNeedSearch: '请先搜索并选择相关结果', toastNeedFile: '请先上传文件', toastNeedLink: '请先添加链接', toastNeedLinkOrImage: '请添加链接或上传图片',
      toastNeedInput: '请输入你的灵感内容', toastLinkAdded: '链接已添加', toastLinkExists: '该链接已添加',
      toastLinkInvalid: '链接格式不正确', toastFileAdded: '示例文件已添加：',
      toastFileExists: '该文件已添加', toastSentTo: '已发送给',
      toastSwitchedTeam: '已切换到团队版', toastSwitchedPersonal: '已切换到个人版',
      transferMaterial: '资料',
      toastCantEditTeam: '团队共享灵感不能直接编辑，可查看后自行捕获',
      toastNeedCaptureFirst: '请先捕获一个灵感',
      chatTitle: '💬 追问 AI', chatPlaceholder: '对 AI 的分析有疑问？继续追问...', chatSend: '📨 发送', chatReset: '🔄 重置会话',
      chatCollapse: '收起 ▲', chatExpand: '展开 ▼', chatNeedInput: '请输入追问内容', chatNeedCapture: '请先捕获一个灵感',
      chatResetToast: '会话已重置，可开始新的追问',
      fwLabel: '📐 选择分析框架：', fwSwot: '📊 SWOT 分析（默认）', fwLean: '📐 精益画布（商业模式九宫格）', fw4p: '🎯 市场策略（4P 分析）', fwTech: '⚙️ 技术评估（可行性/风险）',
      fwLeanTitle: '📐 精益画布', fw4pTitle: '🎯 市场策略（4P 分析）', fwTechTitle: '⚙️ 技术评估',
      fwLeanCS: '客户细分', fwLeanVP: '价值主张', fwLeanCH: '渠道', fwLeanCR: '客户关系', fwLeanRS: '收入来源', fwLeanKR: '核心资源', fwLeanKA: '关键业务', fwLeanKP: '重要伙伴', fwLeanCS2: '成本结构',
      fw4pProd: '产品（Product）', fw4pPrice: '价格（Price）', fw4pPlace: '渠道（Place）', fw4pPromo: '促销（Promotion）',
      fwTechFeas: '技术可行性', fwTechDiff: '实施难度', fwTechRisk: '潜在风险', fwTechStack: '技术栈建议',
      exportBtn: '📄 导出报告', exportMd: '📥 下载 Markdown', exportPdf: '🖨️ 打印/保存 PDF', exportCopy: '📋 复制为文本', firstCaptureToast: '🎉 恭喜！完成第一次灵感捕获',
      apiSave: '保存', apiTest: '测试连接', apiRetry: '🔄 重试', apiHint: '💡 Ollama: 本地大模型接口 | OpenSERP: 联网搜索接口（无需 API Key）',
      themeLight: '☀️ 浅色模式', themeDark: '🌙 深色模式', themeToggleTitle: '切换浅色/深色主题',
      apiConfigured: '⚙️ 已配置 | Ollama: ', apiOpenSERP: ' | OpenSERP: ',
      apiNeedUrl: '✗ 请填写 Ollama URL',
      apiOllamaChecking: 'Ollama: 检测中...', apiOllamaConnected: 'Ollama 已连接 (', apiOllamaOffline: 'Ollama 未连接',
      apiSerpChecking: 'OpenSERP: 检测中...', apiSerpConnected: 'OpenSERP 已连接', apiSerpOffline: 'OpenSERP 未连接',
      apiCollapse: '🔼 收起设置', apiExpand: '⚙️ 设置 Ollama',
      apiTesting: '正在测试连接...', apiTestSuccess: '✓ 连接成功！可用模型：',
      apiTestModelMissing: '⚠ 当前配置的模型 "', apiTestModelMissing2: '" 不在列表中，请先运行：ollama pull ',
      apiTestFailed: '✗ 连接失败：',
      apiTestCheckList: '💡 请检查：1) Ollama 是否已启动 2) URL 是否正确 3) 如果是浏览器访问，请用以下命令启动 Ollama 以允许跨域：OLLAMA_ORIGINS=* ollama serve',
      apiSaved: 'Ollama 设置已保存',
      typeProduct: '产品', typeResearch: '学术', typeBusiness: '商业', typeTech: '技术',
      searchSearching: '🔍 正在搜索...',
      fileUnsupported: '不支持的文件格式（仅支持 TXT、PDF、DOCX、MD）',
      sourceLocalTemplate: '📋 本地模板（离线）',
      ollamaEmptyFallback: 'Ollama 返回为空，使用本地模板',
      interruptedPartial: '已中断，显示部分结果',
      invalidJsonFallback: '模型未返回标准 JSON，显示原始回答',
      ollamaFailedFallback: 'Ollama 连接失败，使用本地模板',
      streamingNotSupported: '浏览器不支持流式输出，使用非流式模式',
      ollamaConnectionError: '❌ 无法连接到 Ollama，请确保 Ollama 已启动（运行 ollama serve）',
      ollamaModelNotFound: '❌ 模型 ', ollamaModelNotFound2: ' 未找到，请先运行 ollama pull ',
      ollamaErrorFallback: '❌ Ollama 调用失败：', ollamaErrorFallback2: '，已使用本地模板',
      optYourOptimization: '✍️ 你的灵感优化建议',
      priorityHigh: '高优', priorityMedium: '中优', priorityLow: '低优',
      longContentTip: '...（内容较长，建议分点提炼核心创意）',
      longContentTag1: '内容较长', longContentTag2: '建议提炼要点',
      inputModeFile: '文件', inputModeLink: '链接', inputModeSearch: '搜索',
      filterAll: '全部', historyCountUnit: '条灵感',
      historyAutoCompleted: '分析结果已自动补全',
      historyRebuilt: '旧记录已自动重建分析',
      sourceHistory: '📚 历史记录',
      mdGenerated: '生成时间', mdFramework: '分析框架', mdOriginal: '原始灵感', mdType: '灵感类型', mdTags: '关键词',
      mdSwot: 'SWOT 分析', mdSwotS: '优势 (Strengths)', mdSwotW: '劣势 (Weaknesses)', mdSwotO: '机会 (Opportunities)', mdSwotT: '威胁 (Threats)',
      mdLean: '精益画布',
      mdLeanCS: '客户细分', mdLeanVP: '价值主张', mdLeanCH: '渠道', mdLeanCR: '客户关系', mdLeanRS: '收入来源', mdLeanKR: '核心资源', mdLeanKA: '关键业务', mdLeanKP: '重要伙伴', mdLeanCS2: '成本结构',
      md4p: '市场策略（4P）', md4pProd: '产品（Product）', md4pPrice: '价格（Price）', md4pPlace: '渠道（Place）', md4pPromo: '促销（Promotion）',
      mdTech: '技术评估', mdTechFeas: '技术可行性', mdTechDiff: '实施难度', mdTechRisk: '潜在风险', mdTechStack: '技术栈建议',
      mdDaily: '生活决策', mdDailyReason: '推荐理由', mdDailyVibe: '适合场景', mdDailyVerdict: '一句话建议',
      fwDailyTitle: '🧘 生活决策建议',
      mdActionPlan: '行动建议', mdTimeline: '执行时间线',
      mdGeneratedBy: '*由灵感捕获精灵（AI Agent）自动生成*',
      toastNeedCapture: '请先捕获灵感',
      toastMdDownloaded: 'Markdown 报告已下载',
      toastReportCopied: '报告已复制到剪贴板',
      toastCopyFailed: '复制失败，请手动复制',
      aiRawAnswer: 'AI 原始回答：',
      typeProduct: '产品创新', typeResearch: '学术研究', typeArt: '艺术创作', typeBusiness: '商业模式'
    },
    en: {
      appTitle: 'Inspiration Catcher', appSubtitle: 'Your Creative Guardian · AI Inspiration Agent', demoTag: 'TRAE AI Creativity Competition Demo',
      langLabel: '🌐 Language', personalMode: '👤 Personal', teamMode: '👥 Team',
      tabSearch: '🔍 Search', tabFile: '📎 File', tabLink: '🔗 Link & Image', tabText: '📝 Text & Voice',
      searchPlaceholder: 'Enter keywords, AI will search related materials...', searchBtn: '🔍 Search',
      searchScope: 'Scope: ', searchAll: 'All', searchProduct: 'Product', searchResearch: 'Research', searchBusiness: 'Business', searchTech: 'Tech',
      searchResults: 'Results:', searchResultsLive: '🌐 Live Results (OpenSERP)', searchResultsLocal: '📚 Local Mock Data',
      searchResultsEmpty: 'No results found. Try different keywords?', searchResultsFound: 'Found {n} results. Click to select.',
      searchFallback: '⚠️ OpenSERP unreachable, switched to local search. For web search, run: docker run -p 7000:7000 karust/openserp serve', searchSourceLabel: 'Source: ',
      searchInspHint: '💡 Inspired? Write down your idea (optional):',
      searchInspPlaceholder: 'What inspired you? e.g. "I want to build a smart device for elderly emergency calls"',
      fileUploadText: 'Click or drag files here', fileUploadHint: 'Supports TXT, PDF, DOCX, MD',
      fileListLabel: 'Uploaded files:', fileQuickLabel: 'Quick demo files:',
      fileInspHint: '💡 Write your inspiration based on these materials (optional):',
      fileInspPlaceholder: 'Any ideas after reading? e.g. "Based on this AI trend report, I want to build an AI tool recommendation platform"',
      linkPlaceholder: 'Paste article/web link, e.g. https://example.com/article', linkAddBtn: 'Add',
      linkListLabel: 'Added links:', linkQuickLabel: 'Quick demo links:',
      imageUploadLabel: '📷 Upload image inspiration:', imageUploadText: 'Click or drag images here', imageUploadHint: 'Supports PNG, JPG, GIF, WebP',
      linkInspHint: '💡 Write your inspiration based on these links/images (optional):',
      linkInspPlaceholder: 'What inspired you? e.g. "This article about multimodal AI is interesting, I want to build an app to help the blind see"',
      textPlaceholder: 'Describe your flash of inspiration... e.g. "I want to build an AI tool that auto-plans study schedules"',
      voiceBtn: '🎙️ Voice Input', voiceRecording: '⏹️ Stop', voiceStatusRecording: 'Recording... Speak your inspiration',
      voiceStatusStopped: 'Recording stopped', voiceStatusError: 'Recording error, please retry', voiceStatusComplete: 'Recording complete',
      voiceNotSupported: 'Speech recognition not supported, please use Chrome',
      quickIdeasLabel: 'Quick demo inspirations:',
      quickFile1: '📊 AI Industry Report', quickFile2: '📄 Product Requirements Doc', quickFile3: '📑 Academic Paper',
      quickLink1: '📄 AI Research Paper', quickLink2: '🔧 GitHub Copilot', quickLink3: '📰 AI Industry Analysis', quickLink4: '🎨 Figma Design Tool', quickLink5: '🤖 OpenAI Official Blog',
      quickIdea1: '💊 Smart Medication Reminder', quickIdea2: '📝 AI Paper Outline', quickIdea3: '🔧 Community Tool Sharing', quickIdea4: '🏛️ AR Museum Guide', quickIdea5: '♻️ Smart Waste Sorting', quickIdea6: '💙 Emotional Companion App',
      fileReadyInfo: 'File ready. Combine with inspiration input below.', modeToggleTitle: 'Toggle Personal/Team Mode', aiThinking: '🧠 AI is thinking deeply...',
      captureBtn: '✨ Capture', historyBtn: '📚 Library', historyBtnClose: '✕ Close Library',
      processingTitle: 'AI is understanding your inspiration...',
      stepContent: 'Recognition', stepType: 'Type Analysis', stepRelation: 'Association', stepPlan: 'Generation',
      stepParse: 'Parsing', stepExtract: 'Extraction', stepDeep: 'Deep Analysis', stepReport: 'Report',
      stepSmartSearch: 'Search', stepFilter: 'Filtering', stepAnalysis: 'Analysis', stepInspire: 'Inspiration',
      resultCaptured: '💡 Captured Inspiration', regenerateBtn: '🔄 Regenerate', chatApplyBtn: '✅ Apply & Update', chatUpdating: '⏳ Updating...', optTitle: '✍️ Prompt Optimization',
      optDesc: 'AI optimized your input to be clearer and more structured without changing the meaning.',
      optOriginal: '📝 Original', optImproved: '✨ Optimized',
      graphTitle: '🔗 Knowledge Graph', swotTitle: '📊 SWOT Analysis',
      swotS: '🟢 Strengths', swotW: '🔴 Weaknesses', swotO: '🔵 Opportunities', swotT: '🟡 Threats',
      actionTitle: '🎯 Action Plan', timelineTitle: '📅 Timeline',
      analysisTitle: '📋 Material Analysis', analysisSummary: '📝 Summary',
      analysisHighlights: '💡 Highlights', analysisKeypoints: '📌 Key Points',
      analysisSuggestions: '💬 Suggestions', analysisTopics: '🏷️ Topics',
      historyTitle: '📚 Inspiration Library', historySubtitle: 'Auto-categorized',
      historyEmpty: 'No history yet. Capture your first inspiration!',
      historyEmptyTeam: 'Team space is empty. Capture and share your first inspiration!',
      historyEmptyFilter: 'No inspirations in this category',
      historyPersonal: '👤 My Inspirations', historyTeam: '👥 Team Shared',
      teamBarTitle: 'Team Space', teamBarSlogan: 'Brainstorm · Share Ideas',
      shareToTeam: '📤 Share to Team', shareToTeamDesc: '💡 Great analysis? Share it to the team space!',
      transferTitle: '📨 Send to Team Member', transferDesc: 'Select a member to send current analysis or files',
      transferSent: 'Sent ✓', transferSendTo: 'Send to',
      adminBadge: 'Admin', selfBadge: 'Me',
      manageMembersBtn: '👥 Manage Members', memberManageTitle: '👥 Team Member Management',
      memberNamePlaceholder: 'Enter member name', memberAvatarPlaceholder: 'Emoji',
      addMemberBtn: 'Add', memberTip: '💡 Tip: Admin cannot be removed. Click name to edit.',
      noOtherMembers: 'No other team members', confirmRemoveMember: 'Remove member "',
      confirmRemoveMember2: '"?',
      toastCaptureSuccess: 'Inspiration captured!', toastCaptureTeam: 'Captured! Auto-synced to team space',
      toastShareTeam: 'Shared to team space!', toastLoadHistory: 'Loaded history inspiration',
      toastNeedSearch: 'Please search and select results first', toastNeedFile: 'Please upload a file', toastNeedLink: 'Please add links first', toastNeedLinkOrImage: 'Please add a link or upload an image', toastNeedInput: 'Please enter your inspiration',
      toastLinkAdded: 'Link added', toastLinkExists: 'Link already exists',
      toastLinkInvalid: 'Invalid link format', toastFileAdded: 'Demo file added: ',
      toastFileExists: 'File already added', toastSentTo: 'Sent to',
      toastSwitchedTeam: 'Switched to Team Mode', toastSwitchedPersonal: 'Switched to Personal Mode',
      transferMaterial: 'Material',
      toastCantEditTeam: 'Team inspirations cannot be edited directly',
      toastNeedCaptureFirst: 'Please capture an inspiration first',
      chatTitle: '💬 Ask AI', chatPlaceholder: 'Have a follow-up question? Ask away...', chatSend: '📨 Send', chatReset: '🔄 Reset',
      chatCollapse: 'Collapse ▲', chatExpand: 'Expand ▼', chatNeedInput: 'Please enter your question', chatNeedCapture: 'Please capture an inspiration first',
      chatResetToast: 'Session reset. You can start a new chat.',
      fwLabel: '📐 Framework: ', fwSwot: '📊 SWOT (Default)', fwLean: '📐 Lean Canvas', fw4p: '🎯 4P Marketing', fwTech: '⚙️ Tech Assessment',
      fwLeanTitle: '📐 Lean Canvas', fw4pTitle: '🎯 4P Marketing Mix', fwTechTitle: '⚙️ Technical Assessment',
      fwLeanCS: 'Customer Segments', fwLeanVP: 'Value Proposition', fwLeanCH: 'Channels', fwLeanCR: 'Customer Relationships', fwLeanRS: 'Revenue Streams', fwLeanKR: 'Key Resources', fwLeanKA: 'Key Activities', fwLeanKP: 'Key Partners', fwLeanCS2: 'Cost Structure',
      fw4pProd: 'Product', fw4pPrice: 'Price', fw4pPlace: 'Place', fw4pPromo: 'Promotion',
      fwTechFeas: 'Technical Feasibility', fwTechDiff: 'Implementation Difficulty', fwTechRisk: 'Potential Risks', fwTechStack: 'Tech Stack Suggestions',
      exportBtn: '📄 Export Report', exportMd: '📥 Download Markdown', exportPdf: '🖨️ Print / Save PDF', exportCopy: '📋 Copy as Text', firstCaptureToast: '🎉 Congrats! First inspiration captured!',
      apiSave: 'Save', apiTest: 'Test Connection', apiRetry: '🔄 Retry', apiHint: '💡 Ollama: local LLM interface | OpenSERP: web search API (no API key needed)',
      themeLight: '☀️ Light Mode', themeDark: '🌙 Dark Mode', themeToggleTitle: 'Toggle light/dark theme',
      apiConfigured: '⚙️ Configured | Ollama: ', apiOpenSERP: ' | OpenSERP: ',
      apiNeedUrl: '✗ Please enter Ollama URL',
      apiOllamaChecking: 'Ollama: checking...', apiOllamaConnected: 'Ollama connected (', apiOllamaOffline: 'Ollama unreachable',
      apiSerpChecking: 'OpenSERP: checking...', apiSerpConnected: 'OpenSERP connected', apiSerpOffline: 'OpenSERP unreachable',
      apiCollapse: '🔼 Hide Settings', apiExpand: '⚙️ Set Ollama',
      apiTesting: 'Testing connection...', apiTestSuccess: '✓ Connected! Available models: ',
      apiTestModelMissing: '⚠ Configured model "', apiTestModelMissing2: '" not found. Run: ollama pull ',
      apiTestFailed: '✗ Connection failed: ',
      apiTestCheckList: '💡 Please check: 1) Is Ollama running? 2) Is the URL correct? 3) For browser access, start Ollama with: OLLAMA_ORIGINS=* ollama serve',
      apiSaved: 'Ollama settings saved',
      typeProduct: 'Product', typeResearch: 'Research', typeBusiness: 'Business', typeTech: 'Tech',
      searchSearching: '🔍 Searching...',
      fileUnsupported: 'Unsupported format (TXT, PDF, DOCX, MD only)',
      sourceLocalTemplate: '📋 Local Template (Offline)',
      ollamaEmptyFallback: 'Ollama returned empty, using local template',
      interruptedPartial: 'Interrupted, showing partial result',
      invalidJsonFallback: 'Model did not return standard JSON, showing raw response',
      ollamaFailedFallback: 'Ollama connection failed, using local template',
      streamingNotSupported: 'Browser does not support streaming, using non-stream mode',
      ollamaConnectionError: '❌ Cannot connect to Ollama. Make sure Ollama is running (ollama serve)',
      ollamaModelNotFound: '❌ Model ', ollamaModelNotFound2: ' not found. Run: ollama pull ',
      ollamaErrorFallback: '❌ Ollama call failed: ', ollamaErrorFallback2: ', using local template',
      optYourOptimization: '✍️ Your Inspiration Optimization',
      priorityHigh: 'High', priorityMedium: 'Medium', priorityLow: 'Low',
      longContentTip: '... (content is long, suggest extracting key creative points)',
      longContentTag1: 'Long content', longContentTag2: 'Suggest extracting key points',
      inputModeFile: 'File', inputModeLink: 'Link', inputModeSearch: 'Search',
      filterAll: 'All', historyCountUnit: ' items',
      historyAutoCompleted: 'Analysis auto-completed',
      historyRebuilt: 'Legacy record rebuilt',
      sourceHistory: '📚 History',
      mdGenerated: 'Generated', mdFramework: 'Framework', mdOriginal: 'Original Inspiration', mdType: 'Type', mdTags: 'Tags',
      mdSwot: 'SWOT Analysis', mdSwotS: 'Strengths', mdSwotW: 'Weaknesses', mdSwotO: 'Opportunities', mdSwotT: 'Threats',
      mdLean: 'Lean Canvas',
      mdLeanCS: 'Customer Segments', mdLeanVP: 'Value Proposition', mdLeanCH: 'Channels', mdLeanCR: 'Customer Relationships', mdLeanRS: 'Revenue Streams', mdLeanKR: 'Key Resources', mdLeanKA: 'Key Activities', mdLeanKP: 'Key Partners', mdLeanCS2: 'Cost Structure',
      md4p: 'Marketing Mix (4P)', md4pProd: 'Product', md4pPrice: 'Price', md4pPlace: 'Place', md4pPromo: 'Promotion',
      mdTech: 'Technical Assessment', mdTechFeas: 'Technical Feasibility', mdTechDiff: 'Implementation Difficulty', mdTechRisk: 'Potential Risks', mdTechStack: 'Tech Stack Suggestions',
      mdDaily: 'Daily Life Decisions', mdDailyReason: 'Reason', mdDailyVibe: 'Vibe / Scene', mdDailyVerdict: 'Verdict',
      fwDailyTitle: '🧘 Daily Life Suggestions',
      mdActionPlan: 'Action Plan', mdTimeline: 'Timeline',
      mdGeneratedBy: '*Generated by Inspiration Catcher AI Agent*',
      toastNeedCapture: 'Please capture an inspiration first',
      toastMdDownloaded: 'Markdown report downloaded',
      toastReportCopied: 'Report copied to clipboard',
      toastCopyFailed: 'Copy failed, please copy manually',
      aiRawAnswer: 'AI raw answer:',
      typeProduct: 'Product Innovation', typeResearch: 'Academic Research', typeArt: 'Artistic Creation', typeBusiness: 'Business Model'
    },
    ja: {
      appTitle: 'インスピレーションキャッチャー', appSubtitle: 'あなたの創造の守護者 · AIインスピレーションエージェント', demoTag: 'TRAE AI 創造性コンペティション Demo',
      langLabel: '🌐 言語', personalMode: '👤 個人版', teamMode: '👥 チーム版',
      captureBtn: '✨ キャプチャ', historyBtn: '📚 ライブラリ', historyBtnClose: '✕ 閉じる',
      processingTitle: 'AIがインスピレーションを理解しています...',
      resultCaptured: '💡 キャプチャしたインスピレーション', regenerateBtn: '🔄 再生成', chatApplyBtn: '✅ 提案を適用して更新', chatUpdating: '⏳ 更新中...', optTitle: '✍️ プロンプト最適化',
      graphTitle: '🔗 知識グラフ', swotTitle: '📊 SWOT分析',
      actionTitle: '🎯 アクションプラン', timelineTitle: '📅 スケジュール',
      historyTitle: '📚 インスピレーションライブラリ', historySubtitle: '自動分類済み',
      historyEmpty: '履歴はまだありません。最初のインスピレーションをキャプチャしましょう！',
      toastCaptureSuccess: 'インスピレーションをキャプチャしました！',
      toastNeedInput: 'インスピレーションを入力してください',
      toastNeedLink: 'リンクを追加してください',
      toastNeedLinkOrImage: 'リンクを追加するか画像をアップロードしてください',
      toastNeedFile: 'ファイルをアップロードしてください',
      toastNeedSearch: '検索して結果を選択してください',
      searchResults: '検索結果：',
      searchResultsLive: '🌐 リアルタイム検索（OpenSERP）',
      searchResultsLocal: '📚 ローカルモックデータ',
      searchResultsEmpty: '結果が見つかりません。別のキーワードで試してみてください。',
      searchResultsFound: '{n}件の結果が見つかりました。クリックして選択してください',
      searchFallback: 'OpenSERPに接続できません。ローカルデータを使用します',
      searchSourceLabel: '出典：',
      searchInspHint: '💡 これらの検索結果を見て、アイデアを書き留めてください（任意）：',
      searchInspPlaceholder: '検索結果から何かインスピレーションを得ましたか？例：「高齢者向けAI製品が多いので、独居老人の緊急通報スマートデバイスを作りたい」',
      chatTitle: '💬 AIに質問', chatPlaceholder: 'AIの分析に質問がありますか？続けて聞いてみましょう...',
      chatSend: '📨 送信', chatReset: '🔄 会話をリセット',
      chatCollapse: '折りたたむ ▲', chatExpand: '展開する ▼',
      chatNeedInput: '質問を入力してください', chatNeedCapture: '最初にインスピレーションをキャプチャしてください',
      chatResetToast: '会話がリセットされました。新しい質問を始められます',
      fwLabel: '📐 分析フレームワーク：', fwSwot: '📊 SWOT分析（デフォルト）',
      fwLean: '📐 リーンキャンバス（ビジネスモデル9マス）',
      fw4p: '🎯 マーケティング戦略（4P分析）',
      fwTech: '⚙️ 技術評価（実現可能性/リスク）',
      fwLeanTitle: '📐 リーンキャンバス', fw4pTitle: '🎯 マーケティングミックス（4P）', fwTechTitle: '⚙️ 技術評価',
      fwLeanCS: '顧客セグメント', fwLeanVP: '価値提案', fwLeanCH: 'チャネル',
      fwLeanCR: '顧客関係', fwLeanRS: '収益の流れ', fwLeanKR: '主要リソース',
      fwLeanKA: '主要活動', fwLeanKP: '主要パートナー', fwLeanCS2: 'コスト構造',
      fw4pProd: '製品（Product）', fw4pPrice: '価格（Price）',
      fw4pPlace: 'チャネル（Place）', fw4pPromo: 'プロモーション（Promotion）',
      fwTechFeas: '技術的実現可能性', fwTechDiff: '実装の難易度',
      fwTechRisk: '潜在的リスク', fwTechStack: '技術スタックの提案',
      exportBtn: '📄 レポートを出力', exportMd: '📥 Markdownをダウンロード', exportPdf: '🖨️ 印刷/PDFで保存', exportCopy: '📋 テキストとしてコピー', firstCaptureToast: '🎉 おめでとう！初めてのインスピレーションをキャプチャ！',
      apiSave: '保存', apiTest: '接続テスト', apiRetry: '🔄 再試行', apiHint: '💡 Ollama: ローカルLLMインターフェース | OpenSERP: ウェブ検索API（API Key不要）',
      themeLight: '☀️ ライトモード', themeDark: '🌙 ダークモード', themeToggleTitle: 'ライト/ダークテーマ切り替え',
      apiConfigured: '⚙️ 設定済み | Ollama: ', apiOpenSERP: ' | OpenSERP: ',
      apiNeedUrl: '✗ Ollama URLを入力してください',
      apiOllamaChecking: 'Ollama: 確認中...', apiOllamaConnected: 'Ollama 接続済み (', apiOllamaOffline: 'Ollama 接続不可',
      apiSerpChecking: 'OpenSERP: 確認中...', apiSerpConnected: 'OpenSERP 接続済み', apiSerpOffline: 'OpenSERP 接続不可',
      apiCollapse: '🔼 設定を閉じる', apiExpand: '⚙️ Ollama設定',
      apiTesting: '接続テスト中...', apiTestSuccess: '✓ 接続成功！利用可能なモデル：',
      apiTestModelMissing: '⚠ 設定されたモデル "', apiTestModelMissing2: '" が見つかりません。実行してください：ollama pull ',
      apiTestFailed: '✗ 接続失敗：',
      apiTestCheckList: '💡 確認事項：1) Ollamaは起動していますか？ 2) URLは正しいですか？ 3) ブラウザからアクセスする場合は、OLLAMA_ORIGINS=* ollama serve で起動してください',
      apiSaved: 'Ollama設定を保存しました',
      typeProduct: '製品', typeResearch: '研究', typeBusiness: 'ビジネス', typeTech: '技術',
      searchSearching: '🔍 検索中...',
      fileUnsupported: 'サポートされていないファイル形式です（TXT、PDF、DOCX、MDのみ対応）',
      sourceLocalTemplate: '📋 ローカルテンプレート（オフライン）',
      ollamaEmptyFallback: 'Ollamaの応答が空です。ローカルテンプレートを使用します',
      interruptedPartial: '中断されました。部分的な結果を表示します',
      invalidJsonFallback: 'モデルが標準JSONを返しませんでした。生の回答を表示します',
      ollamaFailedFallback: 'Ollama接続に失敗しました。ローカルテンプレートを使用します',
      streamingNotSupported: 'ブラウザがストリーミング出力に対応していません。非ストリーミングモードを使用します',
      ollamaConnectionError: '❌ Ollamaに接続できません。Ollamaが起動していることを確認してください（ollama serve）',
      ollamaModelNotFound: '❌ モデル ', ollamaModelNotFound2: ' が見つかりません。実行してください：ollama pull ',
      ollamaErrorFallback: '❌ Ollama呼び出し失敗：', ollamaErrorFallback2: '、ローカルテンプレートを使用しました',
      optYourOptimization: '✍️ あなたのインスピレーション最適化案',
      priorityHigh: '高優先', priorityMedium: '中優先', priorityLow: '低優先',
      longContentTip: '...（内容が長いです。要点を抽出してアイデアをまとめることをお勧めします）',
      longContentTag1: '内容が長い', longContentTag2: '要点抽出推奨',
      inputModeFile: 'ファイル', inputModeLink: 'リンク', inputModeSearch: '検索',
      filterAll: 'すべて', historyCountUnit: '件のインスピレーション',
      historyAutoCompleted: '分析結果が自動補完されました',
      historyRebuilt: '古いレコードを再分析しました',
      sourceHistory: '📚 履歴',
      mdGenerated: '生成日時', mdFramework: '分析フレームワーク', mdOriginal: '元のインスピレーション', mdType: 'タイプ', mdTags: 'タグ',
      mdSwot: 'SWOT分析', mdSwotS: '強み (Strengths)', mdSwotW: '弱み (Weaknesses)', mdSwotO: '機会 (Opportunities)', mdSwotT: '脅威 (Threats)',
      mdLean: 'リーンキャンバス',
      mdLeanCS: '顧客セグメント', mdLeanVP: '価値提案', mdLeanCH: 'チャネル', mdLeanCR: '顧客関係', mdLeanRS: '収益の流れ', mdLeanKR: '主要リソース', mdLeanKA: '主要活動', mdLeanKP: '主要パートナー', mdLeanCS2: 'コスト構造',
      md4p: 'マーケティング戦略（4P）', md4pProd: '製品（Product）', md4pPrice: '価格（Price）', md4pPlace: 'チャネル（Place）', md4pPromo: 'プロモーション（Promotion）',
      mdTech: '技術評価', mdTechFeas: '技術的実現可能性', mdTechDiff: '実装難易度', mdTechRisk: '潜在的リスク', mdTechStack: '技術スタック提案',
      mdActionPlan: 'アクションプラン', mdTimeline: '実行タイムライン',
      mdGeneratedBy: '*インスピレーションキャッチャー（AIエージェント）によって自動生成*',
      toastNeedCapture: 'まずインスピレーションをキャプチャしてください',
      toastMdDownloaded: 'Markdownレポートをダウンロードしました',
      toastReportCopied: 'レポートをクリップボードにコピーしました',
      toastCopyFailed: 'コピーに失敗しました。手動でコピーしてください',
      aiRawAnswer: 'AIの元の回答：',
      typeProduct: 'プロダクトイノベーション', typeResearch: '学術研究', typeArt: '芸術創作', typeBusiness: 'ビジネスモデル',
      tabSearch: '🔍 検索', tabFile: '📎 ファイル', tabLink: '🔗 リンク＆画像', tabText: '📝 テキスト＆音声',
      searchPlaceholder: 'キーワードを入力すると、AIが関連資料を検索します...', searchBtn: '🔍 検索',
      searchScope: '検索範囲：', searchAll: 'すべて', searchProduct: 'プロダクト', searchResearch: '学術', searchBusiness: 'ビジネス', searchTech: 'テクノロジー',
      fileUploadText: 'クリックまたはファイルをドラッグ＆ドロップ', fileUploadHint: 'TXT、PDF、DOCX、MDに対応',
      fileListLabel: 'アップロード済みファイル：', fileQuickLabel: 'クイック体験サンプル：',
      fileInspHint: '💡 これらの資料からインスピレーションを書き留めてください（任意）：',
      fileInspPlaceholder: '資料を読んで何か思いつきましたか？例：「このAIトレンドレポートから、中小企業向けAIツール推薦プラットフォームを作りたい」',
      linkPlaceholder: '記事/ウェブリンクを貼り付け、例：https://example.com/article', linkAddBtn: '追加',
      linkListLabel: '追加済みリンク：', linkQuickLabel: 'クイック体験リンク：',
      imageUploadLabel: '📷 画像インスピレーションをアップロード：', imageUploadText: 'クリックまたは画像をドラッグ＆ドロップ', imageUploadHint: 'PNG、JPG、GIF、WebPに対応',
      linkInspHint: '💡 これらのリンク/画像からインスピレーションを書き留めてください（任意）：',
      linkInspPlaceholder: 'これらのコンテンツから何かインスピレーションを得ましたか？例：「マルチモーダルAIの記事が面白い、盲人のための視覚支援アプリを作りたい」',
      textPlaceholder: 'ひらめいたインスピレーションを説明してください... 例：「大学生のための自動復習計画AIツールを作りたい」',
      voiceBtn: '🎙️ 音声入力', voiceRecording: '⏹️ 停止', voiceStatusRecording: '録音中...インスピレーションを話してください',
      voiceStatusStopped: '録音停止', voiceStatusError: '録音エラー、再試行してください', voiceStatusComplete: '録音完了',
      voiceNotSupported: '音声認識に対応していません。Chromeを使用してください',
      quickIdeasLabel: 'クイック体験サンプル：',
      quickFile1: '📊 AI産業レポート', quickFile2: '📄 製品要求仕様書', quickFile3: '📑 学術論文',
      quickLink1: '📄 AI研究論文', quickLink2: '🔧 GitHub Copilot', quickLink3: '📰 AI産業分析', quickLink4: '🎨 Figmaデザインツール', quickLink5: '🤖 OpenAI公式ブログ',
      quickIdea1: '💊 スマート服薬リマインダー', quickIdea2: '📝 AI論文アウトライン', quickIdea3: '🔧 コミュニティ工具共有', quickIdea4: '🏛️ AR博物館ガイド', quickIdea5: '♻️ スマートゴミ分別', quickIdea6: '💙 感情コンパニオンアプリ',
      fileReadyInfo: 'ファイルの準備ができました。下のインスピレーション入力と組み合わせてキャプチャできます。', modeToggleTitle: '個人/チームモードを切り替え', aiThinking: '🧠 AIが深く考えています...',
      stepContent: '内容認識', stepType: 'タイプ分析', stepRelation: '関連付け', stepPlan: '方案生成',
      stepParse: '解析中', stepExtract: '抽出中', stepDeep: '深層分析', stepReport: 'レポート',
      stepSmartSearch: '検索', stepFilter: 'フィルタリング', stepAnalysis: '分析', stepInspire: 'インスピレーション',
      optDesc: 'AIが原意を変えずに、入力をより明確で構造的に最適化しました。',
      optOriginal: '📝 元の入力', optImproved: '✨ 最適化案',
      swotS: '🟢 強み', swotW: '🔴 弱み', swotO: '🔵 機会', swotT: '🟡 脅威',
      historyEmptyTeam: 'チームスペースは空です。最初のインスピレーションを共有しましょう！',
      historyEmptyFilter: 'このカテゴリにインスピレーションはありません',
      historyPersonal: '👤 マイインスピレーション', historyTeam: '👥 チーム共有',
      teamBarTitle: 'チームスペース', teamBarSlogan: 'ブレスト · アイデア共有',
      shareToTeam: '📤 チームに共有', shareToTeamDesc: '💡 素晴らしい分析？チームスペースに共有しましょう！',
      transferTitle: '📨 チームメンバーに送信', transferDesc: 'メンバーを選んで、現在の分析結果やファイルを送信します',
      transferSent: '送信済み ✓', transferSendTo: '送信先', adminBadge: '管理者', selfBadge: '自分',
      manageMembersBtn: '👥 メンバー管理', memberManageTitle: '👥 チームメンバー管理',
      memberNamePlaceholder: 'メンバー名を入力', memberAvatarPlaceholder: '絵文字',
      addMemberBtn: '追加', memberTip: '💡 ヒント：管理者は削除できません。名前をクリックして編集。',
      noOtherMembers: '他のメンバーはいません', confirmRemoveMember: 'メンバー「',
      confirmRemoveMember2: '」を削除しますか？',
      toastCaptureTeam: 'キャプチャ完了！チームスペースに自動同期されました',
      toastShareTeam: 'チームに共有しました！', toastLoadHistory: '過去のインスピレーションを読み込みました',
      toastLinkAdded: 'リンクを追加しました', toastLinkExists: 'このリンクは既に存在します',
      toastLinkInvalid: 'リンク形式が正しくありません', toastFileAdded: 'サンプルファイルを追加しました：',
      toastFileExists: 'このファイルは既に存在します', toastSentTo: '送信先：',
      toastSwitchedTeam: 'チーム版に切り替えました', toastSwitchedPersonal: '個人版に切り替えました',
      transferMaterial: '資料',
      toastCantEditTeam: 'チーム共有のインスピレーションは直接編集できません', toastNeedCaptureFirst: '最初にインスピレーションをキャプチャしてください',
      analysisTitle: '📋 資料分析', analysisSummary: '📝 サマリー', analysisHighlights: '💡 ハイライト',
      analysisKeypoints: '📌 要点', analysisSuggestions: '💬 提案', analysisTopics: '🏷️ トピック'
    },
    ko: {
      appTitle: '영감 캡처 요정', appSubtitle: '당신의 전용 창의 수호자 · AI 영감 관리 에이전트', demoTag: 'TRAE AI 창의력 대회 Demo',
      langLabel: '🌐 언어', personalMode: '👤 개인판', teamMode: '👥 팀판',
      captureBtn: '✨ 영감 포착', historyBtn: '📚 영감 라이브러리', historyBtnClose: '✕ 라이브러리 닫기',
      processingTitle: 'AI가 영감을 이해하고 있습니다...',
      resultCaptured: '💡 포착된 영감', regenerateBtn: '🔄 재생성', chatApplyBtn: '✅ 제안 적용 및 업데이트', chatUpdating: '⏳ 업데이트 중...', optTitle: '✍️ 프롬프트 최적화 제안',
      graphTitle: '🔗 지식 연관 그래프', swotTitle: '📊 SWOT 분석',
      actionTitle: '🎯 행동 제안', timelineTitle: '📅 실행 일정',
      historyTitle: '📚 영감 라이브러리', historySubtitle: '자동 분류 완료',
      historyEmpty: '아직 기록이 없습니다. 첫 번째 영감을 포착해보세요!',
      toastCaptureSuccess: '영감이 포착되었습니다!',
      toastNeedInput: '영감 내용을 입력해 주세요',
      toastNeedLink: '링크를 추가해 주세요',
      toastNeedLinkOrImage: '링크를 추가하거나 이미지를 업로드해 주세요',
      toastNeedFile: '파일을 업로드해 주세요',
      toastNeedSearch: '검색하고 결과를 선택해 주세요',
      searchResults: '검색 결과：',
      searchResultsLive: '🌐 실시간 검색 결과（OpenSERP）',
      searchResultsLocal: '📚 로컬 모의 데이터',
      searchResultsEmpty: '결과를 찾지 못했습니다. 다른 키워드로 시도해 보세요.',
      searchResultsFound: '{n}개의 결과를 찾았습니다. 클릭하여 선택하세요',
      searchFallback: 'OpenSERP에 연결할 수 없습니다. 로컬 데이터를 사용합니다',
      searchSourceLabel: '출처：',
      searchInspHint: '💡 검색 결과를 보고 아이디어를 적어보세요（선택 사항）：',
      searchInspPlaceholder: '검색 결과에서 영감을 받으셨나요? 예: "노인용 AI 제품이 많은 걸 보니, 독거노인 응급 호출 스마트 기기를 만들고 싶어요"',
      chatTitle: '💬 AI에게 질문', chatPlaceholder: 'AI 분석에 궁금한 점이 있나요? 계속 질문해 보세요...',
      chatSend: '📨 전송', chatReset: '🔄 대화 재설정',
      chatCollapse: '접기 ▲', chatExpand: '펼치기 ▼',
      chatNeedInput: '질문 내용을 입력해 주세요', chatNeedCapture: '먼저 영감을 포착해 주세요',
      chatResetToast: '대화가 재설정되었습니다. 새로운 질문을 시작할 수 있습니다',
      fwLabel: '📐 분석 프레임워크：', fwSwot: '📊 SWOT 분석（기본）',
      fwLean: '📐 린 캔버스（비즈니스 모델 9칸）',
      fw4p: '🎯 마케팅 전략（4P 분석）',
      fwTech: '⚙️ 기술 평가（실현 가능성/리스크）',
      fwLeanTitle: '📐 린 캔버스', fw4pTitle: '🎯 마케팅 믹스（4P）', fwTechTitle: '⚙️ 기술 평가',
      fwLeanCS: '고객 세분화', fwLeanVP: '가치 제안', fwLeanCH: '채널',
      fwLeanCR: '고객 관계', fwLeanRS: '수익 원천', fwLeanKR: '핵심 자원',
      fwLeanKA: '핵심 활동', fwLeanKP: '핵심 파트너', fwLeanCS2: '비용 구조',
      fw4pProd: '제품（Product）', fw4pPrice: '가격（Price）',
      fw4pPlace: '유통（Place）', fw4pPromo: '프로모션（Promotion）',
      fwTechFeas: '기술적 실현 가능성', fwTechDiff: '구현 난이도',
      fwTechRisk: '잠재적 리스크', fwTechStack: '기술 스택 제안',
      exportBtn: '📄 보고서 내보내기', exportMd: '📥 Markdown 다운로드', exportPdf: '🖨️ 인쇄/PDF로 저장', exportCopy: '📋 텍스트로 복사', firstCaptureToast: '🎉 축하합니다! 첫 영감 캡처 완료!',
      apiSave: '저장', apiTest: '연결 테스트', apiRetry: '🔄 다시 시도', apiHint: '💡 Ollama: 로컬 LLM 인터페이스 | OpenSERP: 웹 검색 API (API 키 불필요)',
      themeLight: '☀️ 라이트 모드', themeDark: '🌙 다크 모드', themeToggleTitle: '라이트/다크 테마 전환',
      apiConfigured: '⚙️ 설정됨 | Ollama: ', apiOpenSERP: ' | OpenSERP: ',
      apiNeedUrl: '✗ Ollama URL을 입력하세요',
      apiOllamaChecking: 'Ollama: 확인 중...', apiOllamaConnected: 'Ollama 연결됨 (', apiOllamaOffline: 'Ollama 연결 불가',
      apiSerpChecking: 'OpenSERP: 확인 중...', apiSerpConnected: 'OpenSERP 연결됨', apiSerpOffline: 'OpenSERP 연결 불가',
      apiCollapse: '🔼 설정 접기', apiExpand: '⚙️ Ollama 설정',
      apiTesting: '연결 테스트 중...', apiTestSuccess: '✓ 연결 성공! 사용 가능한 모델：',
      apiTestModelMissing: '⚠ 설정된 모델 "', apiTestModelMissing2: '"을(를) 찾을 수 없습니다. 실행하세요: ollama pull ',
      apiTestFailed: '✗ 연결 실패：',
      apiTestCheckList: '💡 확인 사항：1) Ollama가 실행 중인가요? 2) URL이 올바른가요? 3) 브라우저에서 접근하려면 OLLAMA_ORIGINS=* ollama serve 로 시작하세요',
      apiSaved: 'Ollama 설정이 저장되었습니다',
      typeProduct: '제품', typeResearch: '연구', typeBusiness: '비즈니스', typeTech: '기술',
      searchSearching: '🔍 검색 중...',
      fileUnsupported: '지원되지 않는 파일 형식입니다 (TXT, PDF, DOCX, MD만 지원)',
      sourceLocalTemplate: '📋 로컬 템플릿 (오프라인)',
      ollamaEmptyFallback: 'Ollama 응답이 비어 있습니다. 로컬 템플릿을 사용합니다',
      interruptedPartial: '중단되었습니다. 일부 결과를 표시합니다',
      invalidJsonFallback: '모델이 표준 JSON을 반환하지 않았습니다. 원본 응답을 표시합니다',
      ollamaFailedFallback: 'Ollama 연결에 실패했습니다. 로컬 템플릿을 사용합니다',
      streamingNotSupported: '브라우저가 스트리밍 출력을 지원하지 않습니다. 비스트리밍 모드를 사용합니다',
      ollamaConnectionError: '❌ Ollama에 연결할 수 없습니다. Ollama가 실행 중인지 확인하세요 (ollama serve)',
      ollamaModelNotFound: '❌ 모델 ', ollamaModelNotFound2: '을(를) 찾을 수 없습니다. 실행하세요: ollama pull ',
      ollamaErrorFallback: '❌ Ollama 호출 실패：', ollamaErrorFallback2: ', 로컬 템플릿을 사용했습니다',
      optYourOptimization: '✍️ 당신의 영감 최적화 제안',
      priorityHigh: '고우선순위', priorityMedium: '중우선순위', priorityLow: '저우선순위',
      longContentTip: '... (내용이 깁니다. 핵심 아이디어를 추출하여 정리하는 것을 추천합니다)',
      longContentTag1: '내용이 김', longContentTag2: '핵심 추출 권장',
      inputModeFile: '파일', inputModeLink: '링크', inputModeSearch: '검색',
      filterAll: '전체', historyCountUnit: '개의 영감',
      historyAutoCompleted: '분석 결과가 자동 완성되었습니다',
      historyRebuilt: '이전 기록이 재분석되었습니다',
      sourceHistory: '📚 기록',
      mdGenerated: '생성 시간', mdFramework: '분석 프레임워크', mdOriginal: '원본 영감', mdType: '유형', mdTags: '태그',
      mdSwot: 'SWOT 분석', mdSwotS: '강점 (Strengths)', mdSwotW: '약점 (Weaknesses)', mdSwotO: '기회 (Opportunities)', mdSwotT: '위협 (Threats)',
      mdLean: '린 캔버스',
      mdLeanCS: '고객 세그먼트', mdLeanVP: '가치 제안', mdLeanCH: '채널', mdLeanCR: '고객 관계', mdLeanRS: '수익 흐름', mdLeanKR: '핵심 자원', mdLeanKA: '핵심 활동', mdLeanKP: '핵심 파트너', mdLeanCS2: '비용 구조',
      md4p: '마케팅 전략 (4P)', md4pProd: '제품 (Product)', md4pPrice: '가격 (Price)', md4pPlace: '채널 (Place)', md4pPromo: '프로모션 (Promotion)',
      mdTech: '기술 평가', mdTechFeas: '기술적 실현 가능성', mdTechDiff: '구현 난이도', mdTechRisk: '잠재적 위험', mdTechStack: '기술 스택 제안',
      mdActionPlan: '액션 플랜', mdTimeline: '실행 타임라인',
      mdGeneratedBy: '*인스피레이션 캐처 (AI 에이전트)가 자동 생성*',
      toastNeedCapture: '먼저 영감을 캡처하세요',
      toastMdDownloaded: '마크다운 보고서가 다운로드되었습니다',
      toastReportCopied: '보고서가 클립보드에 복사되었습니다',
      toastCopyFailed: '복사에 실패했습니다. 수동으로 복사하세요',
      aiRawAnswer: 'AI 원본 답변：',
      typeProduct: '제품 혁신', typeResearch: '학술 연구', typeArt: '예술 창작', typeBusiness: '비즈니스 모델',
      tabSearch: '🔍 검색', tabFile: '📎 파일', tabLink: '🔗 링크＆이미지', tabText: '📝 텍스트＆음성',
      searchPlaceholder: '키워드를 입력하면 AI가 관련 자료를 검색합니다...', searchBtn: '🔍 검색',
      searchScope: '검색 범위：', searchAll: '전체', searchProduct: '제품', searchResearch: '학술', searchBusiness: '비즈니스', searchTech: '기술',
      fileUploadText: '클릭하거나 파일을 드래그＆드롭하세요', fileUploadHint: 'TXT, PDF, DOCX, MD 지원',
      fileListLabel: '업로드된 파일：', fileQuickLabel: '빠른 체험 샘플：',
      fileInspHint: '💡 이 자료들에서 영감을 적어보세요 (선택사항)：',
      fileInspPlaceholder: '자료를 읽고 무슨 아이디어가 떠올랐나요? 예: "이 AI 트렌드 리포트로 중소기업용 AI 툴 추천 플랫폼을 만들고 싶어요"',
      linkPlaceholder: '기사/웹 링크를 붙여넣기, 예: https://example.com/article', linkAddBtn: '추가',
      linkListLabel: '추가된 링크：', linkQuickLabel: '빠른 체험 링크：',
      imageUploadLabel: '📷 이미지 영감 업로드：', imageUploadText: '클릭하거나 이미지를 드래그＆드롭하세요', imageUploadHint: 'PNG, JPG, GIF, WebP 지원',
      linkInspHint: '💡 이 링크/이미지들에서 영감을 적어보세요 (선택사항)：',
      linkInspPlaceholder: '이 콘텐츠에서 무슨 영감을 받았나요? 예: "멀티모달 AI 기사가 재미있어요, 시각장애인용 시각 지원 앱을 만들고 싶어요"',
      textPlaceholder: '떠오른 영감을 설명해주세요... 예: "대학생을 위한 자동 복습 계획 AI 툴을 만들고 싶어요"',
      voiceBtn: '🎙️ 음성 입력', voiceRecording: '⏹️ 중지', voiceStatusRecording: '녹음 중... 영감을 말해주세요',
      voiceStatusStopped: '녹음 중지', voiceStatusError: '녹음 오류, 다시 시도해주세요', voiceStatusComplete: '녹음 완료',
      voiceNotSupported: '음성 인식을 지원하지 않습니다. Chrome을 사용해주세요',
      quickIdeasLabel: '빠른 체험 샘플 영감：',
      quickFile1: '📊 AI 산업 보고서', quickFile2: '📄 제품 요구사항 문서', quickFile3: '📑 학술 논문',
      quickLink1: '📄 AI 연구 논문', quickLink2: '🔧 GitHub Copilot', quickLink3: '📰 AI 산업 분석', quickLink4: '🎨 Figma 디자인 툴', quickLink5: '🤖 OpenAI 공식 블로그',
      quickIdea1: '💊 스마트 복약 알림', quickIdea2: '📝 AI 논문 아웃라인', quickIdea3: '🔧 커뮤니티 도구 공유', quickIdea4: '🏛️ AR 박물관 가이드', quickIdea5: '♻️ 스마트 쓰레기 분류', quickIdea6: '💙 감정 동반자 앱',
      fileReadyInfo: '파일이 준비되었습니다. 아래 영감 입력과 함께 캡처할 수 있습니다.', modeToggleTitle: '개인/팀 모드 전환', aiThinking: '🧠 AI가 깊이 생각하고 있습니다...',
      stepContent: '내용 인식', stepType: '유형 분석', stepRelation: '연관성', stepPlan: '방안 생성',
      stepParse: '분석 중', stepExtract: '추출 중', stepDeep: '심층 분석', stepReport: '리포트',
      stepSmartSearch: '검색', stepFilter: '필터링', stepAnalysis: '분석', stepInspire: '영감',
      optDesc: 'AI가 원래 의미를 바꾸지 않고 입력을 더 명확하고 구조적으로 최적화했습니다.',
      optOriginal: '📝 원본 입력', optImproved: '✨ 최적화안',
      swotS: '🟢 강점', swotW: '🔴 약점', swotO: '🔵 기회', swotT: '🟡 위협',
      historyEmptyTeam: '팀 스페이스가 비어있습니다. 첫 영감을 공유해보세요!',
      historyEmptyFilter: '이 카테고리에 영감이 없습니다',
      historyPersonal: '👤 내 영감', historyTeam: '👥 팀 공유',
      teamBarTitle: '팀 스페이스', teamBarSlogan: '브레스토 · 아이디어 공유',
      shareToTeam: '📤 팀에 공유', shareToTeamDesc: '💡 멋진 분석인가요? 팀 스페이스에 공유해보세요!',
      transferTitle: '📨 팀 멤버에게 전송', transferDesc: '멤버를 선택하여 현재 분석 결과나 파일을 전송합니다',
      transferSent: '전송 완료 ✓', transferSendTo: '전송 대상', adminBadge: '관리자', selfBadge: '나',
      manageMembersBtn: '👥 멤버 관리', memberManageTitle: '👥 팀 멤버 관리',
      memberNamePlaceholder: '멤버 이름 입력', memberAvatarPlaceholder: '아바타 이모지',
      addMemberBtn: '추가', memberTip: '💡 팁: 관리자는 삭제할 수 없습니다. 이름을 클릭하여 편집하세요.',
      noOtherMembers: '다른 팀 멤버가 없습니다', confirmRemoveMember: '멤버 "',
      confirmRemoveMember2: '"을(를) 삭제하시겠습니까?',
      toastCaptureTeam: '캡처 완료! 팀 스페이스에 자동 동기화되었습니다',
      toastShareTeam: '팀에 공유되었습니다!', toastLoadHistory: '과거 영감을 불러왔습니다',
      toastLinkAdded: '링크가 추가되었습니다', toastLinkExists: '이 링크는 이미 존재합니다',
      toastLinkInvalid: '링크 형식이 올바르지 않습니다', toastFileAdded: '샘플 파일이 추가되었습니다：',
      toastFileExists: '이 파일은 이미 존재합니다', toastSentTo: '전송 대상：',
      toastSwitchedTeam: '팀 버전으로 전환되었습니다', toastSwitchedPersonal: '개인 버전으로 전환되었습니다',
      transferMaterial: '자료',
      toastCantEditTeam: '팀 공유 영감은 직접 편집할 수 없습니다', toastNeedCaptureFirst: '먼저 영감을 포착해주세요',
      analysisTitle: '📋 자료 분석', analysisSummary: '📝 요약', analysisHighlights: '💡 하이라이트',
      analysisKeypoints: '📌 요점', analysisSuggestions: '💬 제안', analysisTopics: '🏷️ 토픽'
    },
    fr: {
      appTitle: 'Captureur d\'Inspiration', appSubtitle: 'Votre Gardien Créatif · Agent AI d\'Inspiration', demoTag: 'Démo Concours Créativité TRAE AI',
      langLabel: '🌐 Langue', personalMode: '👤 Personnel', teamMode: '👥 Équipe',
      captureBtn: '✨ Capturer', historyBtn: '📚 Bibliothèque', historyBtnClose: '✕ Fermer',
      processingTitle: 'L\'IA comprend votre inspiration...',
      resultCaptured: '💡 Inspiration Capturée', regenerateBtn: '🔄 Régénérer', chatApplyBtn: '✅ Appliquer & Mettre à jour', chatUpdating: '⏳ Mise à jour...', optTitle: '✍️ Optimisation du Prompt',
      graphTitle: '🔗 Graphe de Connaissances', swotTitle: '📊 Analyse SWOT',
      actionTitle: '🎯 Plan d\'Action', timelineTitle: '📅 Calendrier',
      historyTitle: '📚 Bibliothèque d\'Inspirations', historySubtitle: 'Auto-classées',
      historyEmpty: 'Pas encore d\'historique. Capturez votre première inspiration!',
      toastCaptureSuccess: 'Inspiration capturée !',
      toastNeedInput: 'Veuillez saisir votre inspiration',
      toastNeedLink: 'Veuillez ajouter des liens',
      toastNeedLinkOrImage: 'Veuillez ajouter un lien ou télécharger une image',
      toastNeedFile: 'Veuillez télécharger un fichier',
      toastNeedSearch: 'Veuillez rechercher et sélectionner des résultats',
      searchResults: 'Résultats :',
      searchResultsLive: '🌐 Résultats en direct (OpenSERP)',
      searchResultsLocal: '📚 Données locales simulées',
      searchResultsEmpty: 'Aucun résultat trouvé. Essayez d\'autres mots-clés ?',
      searchResultsFound: '{n} résultats trouvés. Cliquez pour sélectionner',
      searchFallback: 'OpenSERP indisponible, utilisation des données locales',
      searchSourceLabel: 'Source : ',
      searchInspHint: '💡 Inspiré ? Notez votre idée (facultatif) :',
      searchInspPlaceholder: 'Qu\'est-ce qui vous a inspiré ? Par exemple : « Je veux créer un appareil intelligent d\'appel d\'urgence pour les personnes âgées isolées »',
      chatTitle: '💬 Poser une question', chatPlaceholder: 'Une question sur l\'analyse ? Demandez à l\'IA...',
      chatSend: '📨 Envoyer', chatReset: '🔄 Réinitialiser',
      chatCollapse: 'Réduire ▲', chatExpand: 'Développer ▼',
      chatNeedInput: 'Veuillez saisir votre question', chatNeedCapture: 'Capturez d\'abord une inspiration',
      chatResetToast: 'Conversation réinitialisée. Vous pouvez commencer une nouvelle discussion.',
      fwLabel: '📐 Cadre d\'analyse : ', fwSwot: '📊 SWOT (Par défaut)',
      fwLean: '📐 Lean Canvas (Business Model 9 cases)',
      fw4p: '🎯 Stratégie Marketing (4P)',
      fwTech: '⚙️ Évaluation Technique (Faisabilité/Risques)',
      fwLeanTitle: '📐 Lean Canvas', fw4pTitle: '🎯 Mix Marketing (4P)', fwTechTitle: '⚙️ Évaluation Technique',
      fwLeanCS: 'Segments de clientèle', fwLeanVP: 'Proposition de valeur', fwLeanCH: 'Canaux',
      fwLeanCR: 'Relations clients', fwLeanRS: 'Flux de revenus', fwLeanKR: 'Ressources clés',
      fwLeanKA: 'Activités clés', fwLeanKP: 'Partenaires clés', fwLeanCS2: 'Structure des coûts',
      fw4pProd: 'Produit', fw4pPrice: 'Prix',
      fw4pPlace: 'Distribution', fw4pPromo: 'Promotion',
      fwTechFeas: 'Faisabilité technique', fwTechDiff: 'Difficulté de mise en œuvre',
      fwTechRisk: 'Risques potentiels', fwTechStack: 'Suggestions de stack technique',
      exportBtn: '📄 Exporter le rapport', exportMd: '📥 Télécharger Markdown', exportPdf: '🖨️ Imprimer / Sauvegarder en PDF', exportCopy: '📋 Copier en texte', firstCaptureToast: '🎉 Bravo ! Première inspiration capturée !',
      apiSave: 'Enregistrer', apiTest: 'Tester la connexion', apiRetry: '🔄 Réessayer', apiHint: '💡 Ollama : interface LLM locale | OpenSERP : API de recherche web (pas de clé API nécessaire)',
      themeLight: '☀️ Mode clair', themeDark: '🌙 Mode sombre', themeToggleTitle: 'Basculer thème clair/sombre',
      apiConfigured: '⚙️ Configuré | Ollama : ', apiOpenSERP: ' | OpenSERP : ',
      apiNeedUrl: '✗ Veuillez saisir l\'URL Ollama',
      apiOllamaChecking: 'Ollama : vérification...', apiOllamaConnected: 'Ollama connecté (', apiOllamaOffline: 'Ollama inaccessible',
      apiSerpChecking: 'OpenSERP : vérification...', apiSerpConnected: 'OpenSERP connecté', apiSerpOffline: 'OpenSERP inaccessible',
      apiCollapse: '🔼 Réduire les paramètres', apiExpand: '⚙️ Configurer Ollama',
      apiTesting: 'Test de connexion...', apiTestSuccess: '✓ Connecté ! Modèles disponibles : ',
      apiTestModelMissing: '⚠ Modèle configuré "', apiTestModelMissing2: '" introuvable. Exécutez : ollama pull ',
      apiTestFailed: '✗ Échec de connexion : ',
      apiTestCheckList: '💡 Vérifiez : 1) Ollama est-il en cours d\'exécution ? 2) L\'URL est-elle correcte ? 3) Pour un accès navigateur, démarrez Ollama avec : OLLAMA_ORIGINS=* ollama serve',
      apiSaved: 'Paramètres Ollama enregistrés',
      typeProduct: 'Produit', typeResearch: 'Recherche', typeBusiness: 'Business', typeTech: 'Tech',
      searchSearching: '🔍 Recherche en cours...',
      fileUnsupported: 'Format non supporté (TXT, PDF, DOCX, MD uniquement)',
      sourceLocalTemplate: '📋 Modèle local (hors ligne)',
      ollamaEmptyFallback: 'Ollama a retourné une réponse vide, utilisation du modèle local',
      interruptedPartial: 'Interrompu, affichage des résultats partiels',
      invalidJsonFallback: 'Le modèle n\'a pas retourné de JSON standard, affichage de la réponse brute',
      ollamaFailedFallback: 'Échec de la connexion Ollama, utilisation du modèle local',
      streamingNotSupported: 'Le navigateur ne supporte pas le streaming, mode non-streaming utilisé',
      ollamaConnectionError: '❌ Impossible de se connecter à Ollama. Vérifiez qu\'Ollama est en cours d\'exécution (ollama serve)',
      ollamaModelNotFound: '❌ Modèle ', ollamaModelNotFound2: ' introuvable. Exécutez : ollama pull ',
      ollamaErrorFallback: '❌ Échec de l\'appel Ollama : ', ollamaErrorFallback2: ', utilisation du modèle local',
      optYourOptimization: '✍️ Suggestions d\'optimisation de votre inspiration',
      priorityHigh: 'Haute', priorityMedium: 'Moyenne', priorityLow: 'Basse',
      longContentTip: '... (contenu long, suggérez d\'extraire les idées créatives clés)',
      longContentTag1: 'Contenu long', longContentTag2: 'Extraction des points clés recommandée',
      inputModeFile: 'Fichier', inputModeLink: 'Lien', inputModeSearch: 'Recherche',
      filterAll: 'Tout', historyCountUnit: ' inspirations',
      historyAutoCompleted: 'Analyse automatiquement complétée',
      historyRebuilt: 'Ancien enregistrement reconstruit',
      sourceHistory: '📚 Historique',
      mdGenerated: 'Généré le', mdFramework: 'Cadre d\'analyse', mdOriginal: 'Inspiration originale', mdType: 'Type', mdTags: 'Mots-clés',
      mdSwot: 'Analyse SWOT', mdSwotS: 'Forces', mdSwotW: 'Faiblesses', mdSwotO: 'Opportunités', mdSwotT: 'Menaces',
      mdLean: 'Lean Canvas',
      mdLeanCS: 'Segments client', mdLeanVP: 'Proposition de valeur', mdLeanCH: 'Canaux', mdLeanCR: 'Relations client', mdLeanRS: 'Flux de revenus', mdLeanKR: 'Ressources clés', mdLeanKA: 'Activités clés', mdLeanKP: 'Partenaires clés', mdLeanCS2: 'Structure des coûts',
      md4p: 'Mix Marketing (4P)', md4pProd: 'Produit', md4pPrice: 'Prix', md4pPlace: 'Distribution', md4pPromo: 'Promotion',
      mdTech: 'Évaluation technique', mdTechFeas: 'Faisabilité technique', mdTechDiff: 'Difficulté de mise en œuvre', mdTechRisk: 'Risques potentiels', mdTechStack: 'Suggestions de stack technique',
      mdActionPlan: 'Plan d\'action', mdTimeline: 'Calendrier d\'exécution',
      mdGeneratedBy: '*Généré automatiquement par Captureur d\'Inspiration (Agent IA)*',
      toastNeedCapture: 'Veuillez d\'abord capturer une inspiration',
      toastMdDownloaded: 'Rapport Markdown téléchargé',
      toastReportCopied: 'Rapport copié dans le presse-papiers',
      toastCopyFailed: 'Échec de la copie, veuillez copier manuellement',
      aiRawAnswer: 'Réponse brute de l\'IA : ',
      typeProduct: 'Innovation Produit', typeResearch: 'Recherche Académique', typeArt: 'Création Artistique', typeBusiness: 'Modèle d\'Affaires',
      tabSearch: '🔍 Recherche', tabFile: '📎 Fichier', tabLink: '🔗 Lien & Image', tabText: '📝 Texte & Voix',
      searchPlaceholder: 'Entrez des mots-clés, l\'IA recherche du matériel connexe...', searchBtn: '🔍 Rechercher',
      searchScope: 'Portée : ', searchAll: 'Tout', searchProduct: 'Produit', searchResearch: 'Recherche', searchBusiness: 'Business', searchTech: 'Tech',
      fileUploadText: 'Cliquez ou glissez-déposez des fichiers', fileUploadHint: 'Prend en charge TXT, PDF, DOCX, MD',
      fileListLabel: 'Fichiers téléchargés : ', fileQuickLabel: 'Fichiers de démo rapide : ',
      fileInspHint: '💡 Écrivez votre inspiration à partir de ces documents (optionnel) : ',
      fileInspPlaceholder: 'Quelle idée vous vient à l\'esprit ? Ex: \"Je veux créer une plateforme de recommandation d\'outils AI pour PME',
      linkPlaceholder: 'Collez un lien d\'article/web, ex: https://example.com/article', linkAddBtn: 'Ajouter',
      linkListLabel: 'Liens ajoutés : ', linkQuickLabel: 'Liens de démo rapide : ',
      imageUploadLabel: '📷 Télécharger l\'image d\'inspiration : ', imageUploadText: 'Cliquez ou glissez-déposez des images', imageUploadHint: 'Prend en charge PNG, JPG, GIF, WebP',
      linkInspHint: '💡 Écrivez votre inspiration à partir de ces liens/images (optionnel) : ',
      linkInspPlaceholder: 'Quelle inspiration vous vient ? Ex: \"Cet article sur l\'IA multimodale est intéressant, je veux créer une app d\'aide visuelle pour aveugles',
      textPlaceholder: 'Décrivez votre éclair de génie... Ex: \"Je veux créer un outil AI de planification de révision pour étudiants',
      voiceBtn: '🎙️ Saisie vocale', voiceRecording: '⏹️ Arrêter', voiceStatusRecording: 'Enregistrement... Parlez votre inspiration',
      voiceStatusStopped: 'Enregistrement arrêté', voiceStatusError: 'Erreur d\'enregistrement, réessayez', voiceStatusComplete: 'Enregistrement terminé',
      voiceNotSupported: 'Reconnaissance vocale non supportée, utilisez Chrome',
      quickIdeasLabel: 'Inspirations de démo rapide : ',
      quickFile1: '📊 Rapport industrie AI', quickFile2: '📄 Cahier des charges', quickFile3: '📑 Article académique',
      quickLink1: '📄 Article de recherche IA', quickLink2: '🔧 GitHub Copilot', quickLink3: '📰 Analyse industrie IA', quickLink4: '🎨 Outil de design Figma', quickLink5: '🤖 Blog officiel OpenAI',
      quickIdea1: '💊 Rappel médicament intelligent', quickIdea2: '📝 Plan de thèse IA', quickIdea3: '🔧 Partage d\'outils communautaire', quickIdea4: '🏛️ Guide de musée AR', quickIdea5: '♻️ Tri intelligent des déchets', quickIdea6: '💙 App compagnon émotionnel',
      fileReadyInfo: 'Fichier prêt. Combinez avec la saisie d\'inspiration ci-dessous.', modeToggleTitle: 'Basculer mode Personnel/Équipe', aiThinking: '🧠 L\'IA réfléchit profondément...',
      stepContent: 'Reconnaissance', stepType: 'Analyse de type', stepRelation: 'Association', stepPlan: 'Génération',
      stepParse: 'Analyse', stepExtract: 'Extraction', stepDeep: 'Analyse approfondie', stepReport: 'Rapport',
      stepSmartSearch: 'Recherche', stepFilter: 'Filtrage', stepAnalysis: 'Analyse', stepInspire: 'Inspiration',
      optDesc: 'L\'IA a optimisé votre entrée pour plus de clarté et de structure sans changer le sens.',
      optOriginal: '📝 Original', optImproved: '✨ Optimisé',
      swotS: '🟢 Forces', swotW: '🔴 Faiblesses', swotO: '🔵 Opportunités', swotT: '🟡 Menaces',
      historyEmptyTeam: 'L\'espace équipe est vide. Partagez votre première inspiration !',
      historyEmptyFilter: 'Aucune inspiration dans cette catégorie',
      historyPersonal: '👤 Mes inspirations', historyTeam: '👥 Équipe partagée',
      teamBarTitle: 'Espace équipe', teamBarSlogan: 'Brainstorm · Partage d\'idées',
      shareToTeam: '📤 Partager à l\'équipe', shareToTeamDesc: '💡 Excellente analyse ? Partagez-la à l\'espace équipe !',
      transferTitle: '📨 Envoyer à un membre', transferDesc: 'Sélectionnez un membre pour envoyer l\'analyse ou les fichiers actuels',
      transferSent: 'Envoyé ✓', transferSendTo: 'Envoyer à', adminBadge: 'Admin', selfBadge: 'Moi',
      manageMembersBtn: '👥 Gérer les membres', memberManageTitle: '👥 Gestion des membres',
      memberNamePlaceholder: 'Entrer le nom du membre', memberAvatarPlaceholder: 'Emoji avatar',
      addMemberBtn: 'Ajouter', memberTip: '💡 Astuce : L\'admin ne peut pas être supprimé. Cliquez sur le nom pour modifier.',
      noOtherMembers: 'Aucun autre membre de l\'équipe', confirmRemoveMember: 'Supprimer le membre "',
      confirmRemoveMember2: '" ?',
      toastCaptureTeam: 'Capturé ! Synchronisé à l\'espace équipe',
      toastShareTeam: 'Partagé à l\'espace équipe !', toastLoadHistory: 'Inspiration historique chargée',
      toastLinkAdded: 'Lien ajouté', toastLinkExists: 'Ce lien existe déjà',
      toastLinkInvalid: 'Format de lien invalide', toastFileAdded: 'Fichier de démo ajouté : ',
      toastFileExists: 'Ce fichier existe déjà', toastSentTo: 'Envoyé à',
      toastSwitchedTeam: 'Passé en mode équipe', toastSwitchedPersonal: 'Passé en mode personnel',
      transferMaterial: 'Matériel',
      toastCantEditTeam: 'Les inspirations d\'équipe ne peuvent pas être éditées directement', toastNeedCaptureFirst: 'Capturez d\'abord une inspiration',
      analysisTitle: '📋 Analyse du document', analysisSummary: '📝 Résumé', analysisHighlights: '💡 Points forts',
      analysisKeypoints: '📌 Points clés', analysisSuggestions: '💬 Suggestions', analysisTopics: '🏷️ Sujets'
    },
    de: {
      appTitle: 'Inspirationsfänger', appSubtitle: 'Dein Kreativer Wächter · AI Inspirations-Agent', demoTag: 'TRAE AI Kreativitätswettbewerb Demo',
      langLabel: '🌐 Sprache', personalMode: '👤 Persönlich', teamMode: '👥 Team',
      captureBtn: '✨ Erfassen', historyBtn: '📚 Bibliothek', historyBtnClose: '✕ Schließen',
      processingTitle: 'Die KI versteht deine Inspiration...',
      resultCaptured: '💡 Erfasste Inspiration', regenerateBtn: '🔄 Neu generieren', chatApplyBtn: '✅ Anwenden & Aktualisieren', chatUpdating: '⏳ Aktualisierung...', optTitle: '✍️ Prompt-Optimierung',
      graphTitle: '🔗 Wissensgraph', swotTitle: '📊 SWOT-Analyse',
      actionTitle: '🎯 Aktionsplan', timelineTitle: '📅 Zeitplan',
      historyTitle: '📚 Inspirationsbibliothek', historySubtitle: 'Auto-kategorisiert',
      historyEmpty: 'Noch kein Verlauf. Erfasse deine erste Inspiration!',
      toastCaptureSuccess: 'Inspiration erfasst!',
      toastNeedInput: 'Bitte gib deine Inspiration ein',
      toastNeedLink: 'Bitte füge Links hinzu',
      toastNeedLinkOrImage: 'Bitte füge einen Link hinzu oder lade ein Bild hoch',
      toastNeedFile: 'Bitte lade eine Datei hoch',
      toastNeedSearch: 'Bitte suche und wähle Ergebnisse aus',
      searchResults: 'Ergebnisse:',
      searchResultsLive: '🌐 Live-Ergebnisse (OpenSERP)',
      searchResultsLocal: '📚 Lokale Beispieldaten',
      searchResultsEmpty: 'Keine Ergebnisse gefunden. Versuche andere Suchbegriffe?',
      searchResultsFound: '{n} Ergebnisse gefunden. Klicke zum Auswählen',
      searchFallback: 'OpenSERP nicht verfügbar, verwende lokale Daten',
      searchSourceLabel: 'Quelle: ',
      searchInspHint: '💡 Inspiriert? Schreibe deine Idee auf (optional):',
      searchInspPlaceholder: 'Was hat dich inspiriert? Z.B. "Ich möchte ein smartes Notrufgerät für alleinlebende Senioren entwickeln"',
      chatTitle: '💬 KI fragen', chatPlaceholder: 'Fragen zur Analyse? Frag die KI...',
      chatSend: '📨 Senden', chatReset: '🔄 Zurücksetzen',
      chatCollapse: 'Einklappen ▲', chatExpand: 'Ausklappen ▼',
      chatNeedInput: 'Bitte gib deine Frage ein', chatNeedCapture: 'Erfasse zuerst eine Inspiration',
      chatResetToast: 'Konversation zurückgesetzt. Du kannst eine neue Diskussion starten.',
      fwLabel: '📐 Analyse-Rahmen: ', fwSwot: '📊 SWOT (Standard)',
      fwLean: '📐 Lean Canvas (Geschäftsmodell 9 Felder)',
      fw4p: '🎯 Marketing-Strategie (4P)',
      fwTech: '⚙️ Tech-Bewertung (Machbarkeit/Risiken)',
      fwLeanTitle: '📐 Lean Canvas', fw4pTitle: '🎯 Marketing-Mix (4P)', fwTechTitle: '⚙️ Technische Bewertung',
      fwLeanCS: 'Kundensegmente', fwLeanVP: 'Wertversprechen', fwLeanCH: 'Kanäle',
      fwLeanCR: 'Kundenbeziehungen', fwLeanRS: 'Einnahmequellen', fwLeanKR: 'Schlüsselressourcen',
      fwLeanKA: 'Schlüsselaktivitäten', fwLeanKP: 'Schlüsselpartner', fwLeanCS2: 'Kostenstruktur',
      fw4pProd: 'Produkt', fw4pPrice: 'Preis',
      fw4pPlace: 'Vertrieb', fw4pPromo: 'Werbung',
      fwTechFeas: 'Technische Machbarkeit', fwTechDiff: 'Implementierungsaufwand',
      fwTechRisk: 'Potenzielle Risiken', fwTechStack: 'Technologie-Stack-Vorschläge',
      exportBtn: '📄 Bericht exportieren', exportMd: '📥 Markdown herunterladen', exportPdf: '🖨️ Drucken / Als PDF speichern', exportCopy: '📋 Als Text kopieren', firstCaptureToast: '🎉 Glückwunsch! Erste Inspiration eingefangen!',
      apiSave: 'Speichern', apiTest: 'Verbindung testen', apiRetry: '🔄 Erneut versuchen', apiHint: '💡 Ollama: Lokale LLM-Schnittstelle | OpenSERP: Websuche-API (kein API-Schlüssel nötig)',
      themeLight: '☀️ Hellmodus', themeDark: '🌙 Dunkelmodus', themeToggleTitle: 'Hell/Dunkel-Modus wechseln',
      apiConfigured: '⚙️ Konfiguriert | Ollama: ', apiOpenSERP: ' | OpenSERP: ',
      apiNeedUrl: '✗ Bitte Ollama-URL eingeben',
      apiOllamaChecking: 'Ollama: Prüfung...', apiOllamaConnected: 'Ollama verbunden (', apiOllamaOffline: 'Ollama nicht erreichbar',
      apiSerpChecking: 'OpenSERP: Prüfung...', apiSerpConnected: 'OpenSERP verbunden', apiSerpOffline: 'OpenSERP nicht erreichbar',
      apiCollapse: '🔼 Einstellungen einklappen', apiExpand: '⚙️ Ollama einstellen',
      apiTesting: 'Verbindung testet...', apiTestSuccess: '✓ Verbunden! Verfügbare Modelle: ',
      apiTestModelMissing: '⚠ Konfiguriertes Modell "', apiTestModelMissing2: '" nicht gefunden. Führen Sie aus: ollama pull ',
      apiTestFailed: '✗ Verbindungsfehler: ',
      apiTestCheckList: '💡 Bitte prüfen: 1) Läuft Ollama? 2) Ist die URL korrekt? 3) Für Browser-Zugriff starten Sie Ollama mit: OLLAMA_ORIGINS=* ollama serve',
      apiSaved: 'Ollama-Einstellungen gespeichert',
      typeProduct: 'Produkt', typeResearch: 'Forschung', typeBusiness: 'Business', typeTech: 'Technik',
      searchSearching: '🔍 Suche läuft...',
      fileUnsupported: 'Nicht unterstütztes Format (nur TXT, PDF, DOCX, MD)',
      sourceLocalTemplate: '📋 Lokale Vorlage (Offline)',
      ollamaEmptyFallback: 'Ollama hat leere Antwort zurückgegeben, verwende lokale Vorlage',
      interruptedPartial: 'Unterbrochen, zeige teilweise Ergebnisse',
      invalidJsonFallback: 'Modell hat kein Standard-JSON zurückgegeben, zeige Rohantwort',
      ollamaFailedFallback: 'Ollama-Verbindung fehlgeschlagen, verwende lokale Vorlage',
      streamingNotSupported: 'Browser unterstützt kein Streaming, verwende Nicht-Streaming-Modus',
      ollamaConnectionError: '❌ Keine Verbindung zu Ollama möglich. Stellen Sie sicher, dass Ollama läuft (ollama serve)',
      ollamaModelNotFound: '❌ Modell ', ollamaModelNotFound2: ' nicht gefunden. Führen Sie aus: ollama pull ',
      ollamaErrorFallback: '❌ Ollama-Aufruf fehlgeschlagen: ', ollamaErrorFallback2: ', verwende lokale Vorlage',
      optYourOptimization: '✍️ Ihre Inspirationsoptimierung',
      priorityHigh: 'Hoch', priorityMedium: 'Mittel', priorityLow: 'Niedrig',
      longContentTip: '... (Inhalt lang, empfehle Kernideen extrahieren)',
      longContentTag1: 'Langer Inhalt', longContentTag2: 'Kernpunkte extrahieren empfohlen',
      inputModeFile: 'Datei', inputModeLink: 'Link', inputModeSearch: 'Suche',
      filterAll: 'Alle', historyCountUnit: ' Inspirationen',
      historyAutoCompleted: 'Analyse automatisch vervollständigt',
      historyRebuilt: 'Alter Datensatz neu erstellt',
      sourceHistory: '📚 Verlauf',
      mdGenerated: 'Erstellt am', mdFramework: 'Analyse-Framework', mdOriginal: 'Originale Inspiration', mdType: 'Typ', mdTags: 'Stichwörter',
      mdSwot: 'SWOT-Analyse', mdSwotS: 'Stärken', mdSwotW: 'Schwächen', mdSwotO: 'Chancen', mdSwotT: 'Risiken',
      mdLean: 'Lean Canvas',
      mdLeanCS: 'Kundensegmente', mdLeanVP: 'Wertangebot', mdLeanCH: 'Kanäle', mdLeanCR: 'Kundenbeziehungen', mdLeanRS: 'Einnahmequellen', mdLeanKR: 'Schlüsselressourcen', mdLeanKA: 'Schlüsselaktivitäten', mdLeanKP: 'Schlüsselpartner', mdLeanCS2: 'Kostenstruktur',
      md4p: 'Marketing-Mix (4P)', md4pProd: 'Produkt', md4pPrice: 'Preis', md4pPlace: 'Vertrieb', md4pPromo: 'Werbung',
      mdTech: 'Technische Bewertung', mdTechFeas: 'Technische Machbarkeit', mdTechDiff: 'Implementierungsaufwand', mdTechRisk: 'Potenzielle Risiken', mdTechStack: 'Tech-Stack-Vorschläge',
      mdActionPlan: 'Aktionsplan', mdTimeline: 'Zeitplan',
      mdGeneratedBy: '*Automatisch generiert vom Inspirationsfänger (KI-Agent)*',
      toastNeedCapture: 'Bitte zuerst eine Inspiration erfassen',
      toastMdDownloaded: 'Markdown-Bericht heruntergeladen',
      toastReportCopied: 'Bericht in Zwischenablage kopiert',
      toastCopyFailed: 'Kopieren fehlgeschlagen, bitte manuell kopieren',
      aiRawAnswer: 'KI-Rohantwort: ',
      typeProduct: 'Produktinnovation', typeResearch: 'Akademische Forschung', typeArt: 'Künstlerische Schöpfung', typeBusiness: 'Geschäftsmodell',
      tabSearch: '🔍 Suche', tabFile: '📎 Datei', tabLink: '🔗 Link & Bild', tabText: '📝 Text & Stimme',
      searchPlaceholder: 'Geben Sie Suchbegriffe ein, die KI sucht verwandtes Material...', searchBtn: '🔍 Suchen',
      searchScope: 'Bereich: ', searchAll: 'Alle', searchProduct: 'Produkt', searchResearch: 'Forschung', searchBusiness: 'Business', searchTech: 'Technik',
      fileUploadText: 'Klicken oder Dateien per Drag & Drop hierher ziehen', fileUploadHint: 'Unterstützt TXT, PDF, DOCX, MD',
      fileListLabel: 'Hochgeladene Dateien: ', fileQuickLabel: 'Schnelldemo-Dateien: ',
      fileInspHint: '💡 Schreiben Sie Ihre Inspiration aus diesen Materialien (optional): ',
      fileInspPlaceholder: 'Welche Idee fällt Ihnen ein? Z.B. "Ich möchte eine AI-Tool-Empfehlungsplattform für KMUs bauen',
      linkPlaceholder: 'Artikel/Web-Link einfügen, z.B. https://example.com/article', linkAddBtn: 'Hinzufügen',
      linkListLabel: 'Hinzugefügte Links: ', linkQuickLabel: 'Schnelldemo-Links: ',
      imageUploadLabel: '📷 Bildinspiration hochladen: ', imageUploadText: 'Klicken oder Bilder per Drag & Drop hierher ziehen', imageUploadHint: 'Unterstützt PNG, JPG, GIF, WebP',
      linkInspHint: '💡 Schreiben Sie Ihre Inspiration aus diesen Links/Bildern (optional): ',
      linkInspPlaceholder: 'Welche Inspiration bekommen Sie? Z.B. "Dieser Multimodal-AI-Artikel ist interessant, ich möchte eine Sehhilfe-App für Blinde bauen',
      textPlaceholder: 'Beschreiben Sie Ihre Eingebung... Z.B. "Ich möchte ein AI-Tool zur automatischen Lernplanung für Studenten bauen',
      voiceBtn: '🎙️ Spracheingabe', voiceRecording: '⏹️ Stoppen', voiceStatusRecording: 'Aufnahme... Sprechen Sie Ihre Inspiration',
      voiceStatusStopped: 'Aufnahme gestoppt', voiceStatusError: 'Aufnahmefehler, bitte erneut versuchen', voiceStatusComplete: 'Aufnahme abgeschlossen',
      voiceNotSupported: 'Spracherkennung nicht unterstützt, bitte Chrome verwenden',
      quickIdeasLabel: 'Schnelldemo-Inspirationen: ',
      quickFile1: '📊 AI-Branchenbericht', quickFile2: '📄 Produktanforderungsdoku', quickFile3: '📑 Wissenschaftliche Arbeit',
      quickLink1: '📄 AI-Forschungspapier', quickLink2: '🔧 GitHub Copilot', quickLink3: '📰 AI-Branchenanalyse', quickLink4: '🎨 Figma Design-Tool', quickLink5: '🤖 Offizieller OpenAI-Blog',
      quickIdea1: '💊 Intelligente Medikamentenerinnerung', quickIdea2: '📝 AI-Papier-Gliederung', quickIdea3: '🔧 Gemeinschaftswerkzeugteilung', quickIdea4: '🏛️ AR-Museumsführer', quickIdea5: '♻️ Intelligente Mülltrennung', quickIdea6: '💙 Emotionale Begleit-App',
      fileReadyInfo: 'Datei bereit. Kombinieren Sie mit der Inspirationseingabe unten.', modeToggleTitle: 'Persönlich/Team-Modus umschalten', aiThinking: '🧠 Die KI denkt tief nach...',
      stepContent: 'Erkennung', stepType: 'Typanalyse', stepRelation: 'Assoziation', stepPlan: 'Generierung',
      stepParse: 'Analyse', stepExtract: 'Extraktion', stepDeep: 'Tiefenanalyse', stepReport: 'Bericht',
      stepSmartSearch: 'Suche', stepFilter: 'Filterung', stepAnalysis: 'Analyse', stepInspire: 'Inspiration',
      optDesc: 'Die KI hat Ihre Eingabe für mehr Klarheit und Struktur optimiert, ohne den Sinn zu ändern.',
      optOriginal: '📝 Original', optImproved: '✨ Optimiert',
      swotS: '🟢 Stärken', swotW: '🔴 Schwächen', swotO: '🔵 Chancen', swotT: '🟡 Bedrohungen',
      historyEmptyTeam: 'Teamspace ist leer. Teilen Sie Ihre erste Inspiration!',
      historyEmptyFilter: 'Keine Inspirationen in dieser Kategorie',
      historyPersonal: '👤 Meine Inspirationen', historyTeam: '👥 Team geteilt',
      teamBarTitle: 'Teamspace', teamBarSlogan: 'Brainstorm · Ideenaustausch',
      shareToTeam: '📤 Zum Team teilen', shareToTeamDesc: '💡 Große Analyse? Teilen Sie sie im Teamspace!',
      transferTitle: '📨 An Teammitglied senden', transferDesc: 'Wählen Sie ein Mitglied, um die aktuelle Analyse oder Dateien zu senden',
      transferSent: 'Gesendet ✓', transferSendTo: 'Senden an', adminBadge: 'Admin', selfBadge: 'Ich',
      manageMembersBtn: '👥 Mitglieder verwalten', memberManageTitle: '👥 Teammitglieder verwalten',
      memberNamePlaceholder: 'Mitgliedsname eingeben', memberAvatarPlaceholder: 'Avatar-Emoji',
      addMemberBtn: 'Hinzufügen', memberTip: '💡 Tipp: Admin kann nicht entfernt werden. Klicken Sie auf den Namen zum Bearbeiten.',
      noOtherMembers: 'Keine weiteren Teammitglieder', confirmRemoveMember: 'Mitglied "',
      confirmRemoveMember2: '" entfernen?',
      toastCaptureTeam: 'Eingefangen! Mit Teamspace synchronisiert',
      toastShareTeam: 'Zum Team geteilt!', toastLoadHistory: 'Verlaufsinspiration geladen',
      toastLinkAdded: 'Link hinzugefügt', toastLinkExists: 'Dieser Link existiert bereits',
      toastLinkInvalid: 'Ungültiges Link-Format', toastFileAdded: 'Demodatei hinzugefügt: ',
      toastFileExists: 'Diese Datei existiert bereits', toastSentTo: 'Gesendet an',
      toastSwitchedTeam: 'Zum Team-Modus gewechselt', toastSwitchedPersonal: 'Zum Persönlichen Modus gewechselt',
      transferMaterial: 'Material',
      toastCantEditTeam: 'Team-Inspirationen können nicht direkt bearbeitet werden', toastNeedCaptureFirst: 'Fangen Sie zuerst eine Inspiration ein',
      analysisTitle: '📋 Dokumentenanalyse', analysisSummary: '📝 Zusammenfassung', analysisHighlights: '💡 Highlights',
      analysisKeypoints: '📌 Kernpunkte', analysisSuggestions: '💬 Vorschläge', analysisTopics: '🏷️ Themen'
    },
    es: {
      appTitle: 'Capturador de Inspiración', appSubtitle: 'Tu Guardián Creativo · Agente de Inspiración IA', demoTag: 'Demo Concurso Creatividad TRAE AI',
      langLabel: '🌐 Idioma', personalMode: '👤 Personal', teamMode: '👥 Equipo',
      captureBtn: '✨ Capturar', historyBtn: '📚 Biblioteca', historyBtnClose: '✕ Cerrar',
      processingTitle: 'La IA está entendiendo tu inspiración...',
      resultCaptured: '💡 Inspiración Capturada', regenerateBtn: '🔄 Regenerar', chatApplyBtn: '✅ Aplicar y Actualizar', chatUpdating: '⏳ Actualizando...', optTitle: '✍️ Optimización de Prompt',
      graphTitle: '🔗 Grafo de Conocimiento', swotTitle: '📊 Análisis SWOT',
      actionTitle: '🎯 Plan de Acción', timelineTitle: '📅 Cronograma',
      historyTitle: '📚 Biblioteca de Inspiración', historySubtitle: 'Auto-categorizada',
      historyEmpty: 'Aún no hay historial. ¡Captura tu primera inspiración!',
      toastCaptureSuccess: '¡Inspiración capturada!',
      toastNeedInput: 'Por favor ingresa tu inspiración',
      toastNeedLink: 'Por favor agrega enlaces',
      toastNeedLinkOrImage: 'Por favor agrega un enlace o sube una imagen',
      toastNeedFile: 'Por favor sube un archivo',
      toastNeedSearch: 'Por favor busca y selecciona resultados',
      searchResults: 'Resultados:',
      searchResultsLive: '🌐 Resultados en vivo (OpenSERP)',
      searchResultsLocal: '📚 Datos simulados locales',
      searchResultsEmpty: 'Sin resultados. ¿Prueba con otras palabras clave?',
      searchResultsFound: '{n} resultados encontrados. Haz clic para seleccionar',
      searchFallback: 'OpenSERP no disponible, usando datos locales',
      searchSourceLabel: 'Fuente: ',
      searchInspHint: '💡 ¿Inspirado? Escribe tu idea (opcional):',
      searchInspPlaceholder: '¿Qué te inspiró? Ej: "Quiero crear un dispositivo inteligente de llamada de emergencia para ancianos que viven solos"',
      chatTitle: '💬 Preguntar a la IA', chatPlaceholder: '¿Tienes dudas sobre el análisis? Pregunta a la IA...',
      chatSend: '📨 Enviar', chatReset: '🔄 Reiniciar',
      chatCollapse: 'Contraer ▲', chatExpand: 'Expandir ▼',
      chatNeedInput: 'Por favor ingresa tu pregunta', chatNeedCapture: 'Captura una inspiración primero',
      chatResetToast: 'Conversación reiniciada. Puedes empezar una nueva charla.',
      fwLabel: '📐 Marco de análisis: ', fwSwot: '📊 SWOT (Predeterminado)',
      fwLean: '📐 Lean Canvas (Modelo de Negocio 9 cuadros)',
      fw4p: '🎯 Estrategia de Marketing (4P)',
      fwTech: '⚙️ Evaluación Técnica (Viabilidad/Riesgos)',
      fwLeanTitle: '📐 Lean Canvas', fw4pTitle: '🎯 Mix de Marketing (4P)', fwTechTitle: '⚙️ Evaluación Técnica',
      fwLeanCS: 'Segmentos de clientes', fwLeanVP: 'Propuesta de valor', fwLeanCH: 'Canales',
      fwLeanCR: 'Relaciones con clientes', fwLeanRS: 'Flujos de ingresos', fwLeanKR: 'Recursos clave',
      fwLeanKA: 'Actividades clave', fwLeanKP: 'Socios clave', fwLeanCS2: 'Estructura de costos',
      fw4pProd: 'Producto', fw4pPrice: 'Precio',
      fw4pPlace: 'Distribución', fw4pPromo: 'Promoción',
      fwTechFeas: 'Viabilidad técnica', fwTechDiff: 'Dificultad de implementación',
      fwTechRisk: 'Riesgos potenciales', fwTechStack: 'Sugerencias de stack tecnológico',
      exportBtn: '📄 Exportar informe', exportMd: '📥 Descargar Markdown', exportPdf: '🖨️ Imprimir / Guardar como PDF', exportCopy: '📋 Copiar como texto', firstCaptureToast: '🎉 ¡Enhorabuena! ¡Primera inspiración capturada!',
      apiSave: 'Guardar', apiTest: 'Probar conexión', apiRetry: '🔄 Reintentar', apiHint: '💡 Ollama: interfaz LLM local | OpenSERP: API de búsqueda web (no se necesita clave API)',
      themeLight: '☀️ Modo claro', themeDark: '🌙 Modo oscuro', themeToggleTitle: 'Cambiar tema claro/oscuro',
      apiConfigured: '⚙️ Configurado | Ollama: ', apiOpenSERP: ' | OpenSERP: ',
      apiNeedUrl: '✗ Por favor ingresa la URL de Ollama',
      apiOllamaChecking: 'Ollama: comprobando...', apiOllamaConnected: 'Ollama conectado (', apiOllamaOffline: 'Ollama inalcanzable',
      apiSerpChecking: 'OpenSERP: comprobando...', apiSerpConnected: 'OpenSERP conectado', apiSerpOffline: 'OpenSERP inalcanzable',
      apiCollapse: '🔼 Ocultar ajustes', apiExpand: '⚙️ Configurar Ollama',
      apiTesting: 'Probando conexión...', apiTestSuccess: '✓ ¡Conectado! Modelos disponibles: ',
      apiTestModelMissing: '⚠ Modelo configurado "', apiTestModelMissing2: '" no encontrado. Ejecuta: ollama pull ',
      apiTestFailed: '✗ Error de conexión: ',
      apiTestCheckList: '💡 Por favor revisa: 1) ¿Está Ollama en ejecución? 2) ¿Es correcta la URL? 3) Para acceso desde navegador, inicia Ollama con: OLLAMA_ORIGINS=* ollama serve',
      apiSaved: 'Ajustes de Ollama guardados',
      typeProduct: 'Producto', typeResearch: 'Investigación', typeBusiness: 'Negocio', typeTech: 'Tecnología',
      searchSearching: '🔍 Buscando...',
      fileUnsupported: 'Formato no soportado (solo TXT, PDF, DOCX, MD)',
      sourceLocalTemplate: '📋 Plantilla local (sin conexión)',
      ollamaEmptyFallback: 'Ollama devolvió respuesta vacía, usando plantilla local',
      interruptedPartial: 'Interrumpido, mostrando resultados parciales',
      invalidJsonFallback: 'El modelo no devolvió JSON estándar, mostrando respuesta cruda',
      ollamaFailedFallback: 'Conexión a Ollama fallida, usando plantilla local',
      streamingNotSupported: 'El navegador no soporta streaming, usando modo sin streaming',
      ollamaConnectionError: '❌ No se puede conectar a Ollama. Asegúrate de que Ollama esté en ejecución (ollama serve)',
      ollamaModelNotFound: '❌ Modelo ', ollamaModelNotFound2: ' no encontrado. Ejecuta: ollama pull ',
      ollamaErrorFallback: '❌ Fallo en llamada a Ollama: ', ollamaErrorFallback2: ', usando plantilla local',
      optYourOptimization: '✍️ Sugerencias de optimización de tu inspiración',
      priorityHigh: 'Alta', priorityMedium: 'Media', priorityLow: 'Baja',
      longContentTip: '... (contenido largo, se recomienda extraer ideas creativas clave)',
      longContentTag1: 'Contenido largo', longContentTag2: 'Extraer puntos clave recomendado',
      inputModeFile: 'Archivo', inputModeLink: 'Enlace', inputModeSearch: 'Búsqueda',
      filterAll: 'Todo', historyCountUnit: ' inspiraciones',
      historyAutoCompleted: 'Análisis auto-completado',
      historyRebuilt: 'Registro antiguo reconstruido',
      sourceHistory: '📚 Historial',
      mdGenerated: 'Generado el', mdFramework: 'Marco de análisis', mdOriginal: 'Inspiración original', mdType: 'Tipo', mdTags: 'Etiquetas',
      mdSwot: 'Análisis FODA', mdSwotS: 'Fortalezas', mdSwotW: 'Debilidades', mdSwotO: 'Oportunidades', mdSwotT: 'Amenazas',
      mdLean: 'Lean Canvas',
      mdLeanCS: 'Segmentos de clientes', mdLeanVP: 'Propuesta de valor', mdLeanCH: 'Canales', mdLeanCR: 'Relaciones con clientes', mdLeanRS: 'Flujos de ingresos', mdLeanKR: 'Recursos clave', mdLeanKA: 'Actividades clave', mdLeanKP: 'Socios clave', mdLeanCS2: 'Estructura de costos',
      md4p: 'Marketing Mix (4P)', md4pProd: 'Producto', md4pPrice: 'Precio', md4pPlace: 'Distribución', md4pPromo: 'Promoción',
      mdTech: 'Evaluación técnica', mdTechFeas: 'Viabilidad técnica', mdTechDiff: 'Dificultad de implementación', mdTechRisk: 'Riesgos potenciales', mdTechStack: 'Sugerencias de stack tecnológico',
      mdActionPlan: 'Plan de acción', mdTimeline: 'Cronograma de ejecución',
      mdGeneratedBy: '*Generado automáticamente por Capturador de Inspiración (Agente IA)*',
      toastNeedCapture: 'Primero captura una inspiración',
      toastMdDownloaded: 'Informe Markdown descargado',
      toastReportCopied: 'Informe copiado al portapapeles',
      toastCopyFailed: 'Copia fallida, por favor copia manualmente',
      aiRawAnswer: 'Respuesta cruda de la IA: ',
      typeProduct: 'Innovación de Producto', typeResearch: 'Investigación Académica', typeArt: 'Creación Artística', typeBusiness: 'Modelo de Negocio',
      tabSearch: '🔍 Búsqueda', tabFile: '📎 Archivo', tabLink: '🔗 Enlace & Imagen', tabText: '📝 Texto & Voz',
      searchPlaceholder: 'Ingrese palabras clave, la IA busca material relacionado...', searchBtn: '🔍 Buscar',
      searchScope: 'Ámbito: ', searchAll: 'Todo', searchProduct: 'Producto', searchResearch: 'Investigación', searchBusiness: 'Negocio', searchTech: 'Tecnología',
      fileUploadText: 'Haga clic o arrastre archivos aquí', fileUploadHint: 'Soporta TXT, PDF, DOCX, MD',
      fileListLabel: 'Archivos subidos: ', fileQuickLabel: 'Archivos de demo rápida: ',
      fileInspHint: '💡 Escriba su inspiración a partir de estos materiales (opcional): ',
      fileInspPlaceholder: '¿Qué idea se le ocurre? Ej: "Quiero crear una plataforma de recomendación de herramientas IA para PYMEs',
      linkPlaceholder: 'Pegue un enlace de artículo/web, ej: https://example.com/article', linkAddBtn: 'Añadir',
      linkListLabel: 'Enlaces añadidos: ', linkQuickLabel: 'Enlaces de demo rápida: ',
      imageUploadLabel: '📷 Subir imagen de inspiración: ', imageUploadText: 'Haga clic o arrastre imágenes aquí', imageUploadHint: 'Soporta PNG, JPG, GIF, WebP',
      linkInspHint: '💡 Escriba su inspiración a partir de estos enlaces/imágenes (opcional): ',
      linkInspPlaceholder: '¿Qué inspiración obtiene? Ej: "Este artículo de IA multimodal es interesante, quiero crear una app de ayuda visual para ciegos',
      textPlaceholder: 'Describa su destello de inspiración... Ej: "Quiero crear una herramienta IA de planificación de estudio para estudiantes',
      voiceBtn: '🎙️ Entrada de voz', voiceRecording: '⏹️ Detener', voiceStatusRecording: 'Grabando... Hable su inspiración',
      voiceStatusStopped: 'Grabación detenida', voiceStatusError: 'Error de grabación, reintente', voiceStatusComplete: 'Grabación completada',
      voiceNotSupported: 'Reconocimiento de voz no soportado, use Chrome',
      quickIdeasLabel: 'Inspiraciones de demo rápida: ',
      quickFile1: '📊 Informe de la industria IA', quickFile2: '📄 Documento de requisitos', quickFile3: '📑 Artículo académico',
      quickLink1: '📄 Artículo de investigación IA', quickLink2: '🔧 GitHub Copilot', quickLink3: '📰 Análisis industria IA', quickLink4: '🎨 Herramienta de diseño Figma', quickLink5: '🤖 Blog oficial de OpenAI',
      quickIdea1: '💊 Recordatorio de medicación inteligente', quickIdea2: '📝 Esquema de tesis IA', quickIdea3: '🔧 Compartir herramientas comunitarias', quickIdea4: '🏛️ Guía de museo AR', quickIdea5: '♻️ Clasificación inteligente de residuos', quickIdea6: '💙 App de acompañamiento emocional',
      fileReadyInfo: 'Archivo listo. Combine con la entrada de inspiración de abajo.', modeToggleTitle: 'Cambiar modo Personal/Equipo', aiThinking: '🧠 La IA está pensando profundamente...',
      stepContent: 'Reconocimiento', stepType: 'Análisis de tipo', stepRelation: 'Asociación', stepPlan: 'Generación',
      stepParse: 'Análisis', stepExtract: 'Extracción', stepDeep: 'Análisis profundo', stepReport: 'Informe',
      stepSmartSearch: 'Búsqueda', stepFilter: 'Filtrado', stepAnalysis: 'Análisis', stepInspire: 'Inspiración',
      optDesc: 'La IA ha optimizado su entrada para mayor claridad y estructura sin cambiar el significado.',
      optOriginal: '📝 Original', optImproved: '✨ Optimizado',
      swotS: '🟢 Fortalezas', swotW: '🔴 Debilidades', swotO: '🔵 Oportunidades', swotT: '🟡 Amenazas',
      historyEmptyTeam: 'El espacio de equipo está vacío. ¡Comparte tu primera inspiración!',
      historyEmptyFilter: 'No hay inspiraciones en esta categoría',
      historyPersonal: '👤 Mis inspiraciones', historyTeam: '👥 Equipo compartido',
      teamBarTitle: 'Espacio de equipo', teamBarSlogan: 'Lluvia de ideas · Compartir ideas',
      shareToTeam: '📤 Compartir al equipo', shareToTeamDesc: '💡 ¿Gran análisis? ¡Compártelo al espacio de equipo!',
      transferTitle: '📨 Enviar a miembro del equipo', transferDesc: 'Seleccione un miembro para enviar el análisis o archivos actuales',
      transferSent: 'Enviado ✓', transferSendTo: 'Enviar a', adminBadge: 'Admin', selfBadge: 'Yo',
      manageMembersBtn: '👥 Gestionar miembros', memberManageTitle: '👥 Gestión de miembros del equipo',
      memberNamePlaceholder: 'Ingresar nombre del miembro', memberAvatarPlaceholder: 'Emoji de avatar',
      addMemberBtn: 'Añadir', memberTip: '💡 Consejo: El admin no se puede eliminar. Haz clic en el nombre para editar.',
      noOtherMembers: 'No hay otros miembros del equipo', confirmRemoveMember: '¿Eliminar miembro "',
      confirmRemoveMember2: '"?',
      toastCaptureTeam: '¡Capturado! Sincronizado al espacio de equipo',
      toastShareTeam: '¡Compartido al equipo!', toastLoadHistory: 'Inspiración histórica cargada',
      toastLinkAdded: 'Enlace añadido', toastLinkExists: 'Este enlace ya existe',
      toastLinkInvalid: 'Formato de enlace inválido', toastFileAdded: 'Archivo de demo añadido: ',
      toastFileExists: 'Este archivo ya existe', toastSentTo: 'Enviado a',
      toastSwitchedTeam: 'Cambiado al modo equipo', toastSwitchedPersonal: 'Cambiado al modo personal',
      transferMaterial: 'Material',
      toastCantEditTeam: 'Las inspiraciones de equipo no se pueden editar directamente', toastNeedCaptureFirst: 'Capture primero una inspiración',
      analysisTitle: '📋 Análisis de documento', analysisSummary: '📝 Resumen', analysisHighlights: '💡 Destacados',
      analysisKeypoints: '📌 Puntos clave', analysisSuggestions: '💬 Sugerencias', analysisTopics: '🏷️ Temas'
    }
  };

  var currentLang = localStorage.getItem('appLang') || detectLang();
  function detectLang() {
    var nav = navigator.language || navigator.userLanguage || 'zh';
    if (nav.startsWith('zh')) return 'zh';
    if (nav.startsWith('en')) return 'en';
    if (nav.startsWith('ja')) return 'ja';
    if (nav.startsWith('ko')) return 'ko';
    if (nav.startsWith('fr')) return 'fr';
    if (nav.startsWith('de')) return 'de';
    if (nav.startsWith('es')) return 'es';
    return 'zh';
  }
  function t(key, fallback) {
    var dict = i18n[currentLang] || i18n.zh;
    if (dict[key] !== undefined) return dict[key];
    if (fallback !== undefined) return fallback;
    // Fallback order: English → Chinese → key itself (avoids mixed-language UI)
    if (i18n.en && i18n.en[key] !== undefined) return i18n.en[key];
    return i18n.zh[key] || key;
  }
  function applyStaticI18n() {
    document.title = t('appTitle') + ' - Demo';
    var map = {
      '.header h1': 'appTitle', '.header p': 'appSubtitle', '.header .tag': 'demoTag',
      '#langLabel': 'langLabel',
      '[data-tab="search"]': 'tabSearch', '[data-tab="file"]': 'tabFile', '[data-tab="link"]': 'tabLink', '[data-tab="text"]': 'tabText',
      '#searchInput': { attr: 'placeholder', key: 'searchPlaceholder' },
      '#searchBtn': 'searchBtn',
      '#fileUploadArea .text': 'fileUploadText', '#fileUploadArea .hint': 'fileUploadHint',
      '#linkInput': { attr: 'placeholder', key: 'linkPlaceholder' },
      '#linkAddBtn': 'linkAddBtn',
      '#imageUploadArea .text': 'imageUploadText', '#imageUploadArea .hint': 'imageUploadHint',
      '#voiceBtn': 'voiceBtn',
      '#captureBtn': 'captureBtn',
      '#historyBtn': 'historyBtn',
      '#apiSaveBtn': 'apiSave',
      '#apiTestBtn': 'apiTest',
      '#ollamaRetryBtn': 'apiRetry',
      '#serpRetryBtn': 'apiRetry'
    };
    Object.keys(map).forEach(function(sel) {
      var el = document.querySelector(sel);
      if (!el) return;
      var cfg = map[sel];
      if (typeof cfg === 'string') {
        var val = t(cfg);
        if (val && val !== el.textContent) el.textContent = val;
      } else if (cfg && cfg.attr) {
        var v = t(cfg.key);
        if (v) el.setAttribute(cfg.attr, v);
      }
    });
    // Update API settings hint text
    var apiHint = document.getElementById('apiHintText');
    if (apiHint) apiHint.textContent = t('apiHint');
    // Update result card headings via data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
      var key = el.getAttribute('data-i18n');
      if (!key) return;
      var translated = t(key);
      if (!translated) return;
      // Update only the first text node to preserve child elements (sparkle, buttons, etc.)
      if (el.childNodes.length && el.childNodes[0].nodeType === 3) {
        el.childNodes[0].textContent = translated + ' ';
      } else {
        el.textContent = translated;
      }
    });
    // Update placeholder via data-i18n-placeholder attribute
    document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
      var key = el.getAttribute('data-i18n-placeholder');
      if (!key) return;
      var translated = t(key);
      if (translated) el.placeholder = translated;
    });
    // Update processing text
    var procP = document.querySelector('.processing > p');
    if (procP) procP.textContent = t('processingTitle');
    // Update search type chips
    var stLabels = { all: t('searchAll'), product: t('searchProduct'), research: t('searchResearch'), business: t('searchBusiness'), tech: t('searchTech') };
    document.querySelectorAll('.search-type-chip').forEach(function(chip) {
      var key = chip.dataset.st;
      if (stLabels[key]) chip.textContent = stLabels[key];
    });
    var scopeLabel = document.querySelector('.search-type-row span:first-child');
    if (scopeLabel) scopeLabel.textContent = t('searchScope');
    // Update file info
    var fileInfo = document.getElementById('fileInfo');
    if (fileInfo) fileInfo.textContent = t('fileReadyInfo');
    // Update placeholder hints
    var hints = {
      '#pane-search .placeholder-hint': 'searchInspPlaceholder',
      '#pane-file .placeholder-hint': 'fileInspPlaceholder',
      '#pane-link .placeholder-hint': 'linkInspPlaceholder',
      '#pane-text .placeholder-hint': 'textPlaceholder'
    };
    Object.keys(hints).forEach(function(sel) {
      var el = document.querySelector(sel);
      if (el) {
        var v = t(hints[sel]);
        if (v) el.textContent = v;
      }
    });
    // Update stream panel title
    var streamH4 = document.querySelector('.stream-panel-header h4');
    if (streamH4) streamH4.textContent = t('aiThinking');
    // Update chat area i18n
    var chatTitleLabel = document.getElementById('chatTitleLabel');
    if (chatTitleLabel) chatTitleLabel.textContent = t('chatTitle');
    var chatInput = document.getElementById('chatInput');
    if (chatInput) chatInput.placeholder = t('chatPlaceholder');
    var chatSendBtn = document.getElementById('chatSendBtn');
    if (chatSendBtn) chatSendBtn.textContent = t('chatSend');
    var chatResetBtn = document.getElementById('chatResetBtn');
    if (chatResetBtn) chatResetBtn.textContent = t('chatReset');
    var chatApplyBtnI18n = document.getElementById('chatApplyBtn');
    if (chatApplyBtnI18n) chatApplyBtnI18n.textContent = t('chatApplyBtn');
    var chatToggleBtn = document.getElementById('chatToggleBtn');
    if (chatToggleBtn) {
      var chatBody = document.getElementById('chatBody');
      var isCollapsed = chatBody && chatBody.classList.contains('collapsed');
      chatToggleBtn.textContent = isCollapsed ? t('chatExpand') : t('chatCollapse');
      if (!chatToggleBtn._langBound) {
        chatToggleBtn._langBound = true;
        chatToggleBtn.addEventListener('click', function() {
          var body = document.getElementById('chatBody');
          body.classList.toggle('collapsed');
          chatToggleBtn.textContent = body.classList.contains('collapsed') ? t('chatExpand') : t('chatCollapse');
        });
      }
    }
    // Update framework selector i18n
    var fwLabel = document.querySelector('#frameworkSelector label');
    if (fwLabel) fwLabel.textContent = t('fwLabel');
    var fwSelect = document.getElementById('frameworkSelect');
    if (fwSelect) {
      var fwOpts = fwSelect.options;
      if (fwOpts[0]) fwOpts[0].textContent = t('fwSwot');
      if (fwOpts[1]) fwOpts[1].textContent = t('fwLean');
      if (fwOpts[2]) fwOpts[2].textContent = t('fw4p');
      if (fwOpts[3]) fwOpts[3].textContent = t('fwTech');
    }
    // Update export button i18n
    var exportBtn = document.getElementById('exportBtn');
    if (exportBtn) exportBtn.textContent = t('exportBtn');
    var exportMdBtn = document.getElementById('exportMdBtn');
    if (exportMdBtn) exportMdBtn.textContent = t('exportMd');
    var exportPdfBtn = document.getElementById('exportPdfBtn');
    if (exportPdfBtn) exportPdfBtn.textContent = t('exportPdf');
    var exportCopyBtn = document.getElementById('exportCopyBtn');
    if (exportCopyBtn) exportCopyBtn.textContent = t('exportCopy');
    // Update analysis dynamic headings via regeneration if results visible
    // Debug log
    console.log('[i18n] Language applied:', currentLang, '| Total keys in pack:', Object.keys(i18n[currentLang] || {}).length);
  }

  // DOM refs
  const textarea = document.getElementById('inspirationInput');
  const captureBtn = document.getElementById('captureBtn');
  const historyBtn = document.getElementById('historyBtn');
  const processingArea = document.getElementById('processingArea');
  const resultsArea = document.getElementById('resultsArea');
  const historyArea = document.getElementById('historyArea');
  const toast = document.getElementById('toast');

  // ---- Theme Toggle ----
  var THEME_KEY = 'inspiration_theme';

  function applyTheme(theme) {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    var btn = document.getElementById('themeToggleBtn');
    if (btn) {
      btn.textContent = theme === 'light' ? t('themeLight') : t('themeDark');
      btn.title = theme === 'light' ? t('themeToggleTitle') : t('themeToggleTitle');
    }
  }

  function toggleTheme() {
    var isLight = document.body.classList.contains('light-theme');
    var newTheme = isLight ? 'dark' : 'light';
    applyTheme(newTheme);
    try {
      localStorage.setItem(THEME_KEY, newTheme);
    } catch (e) { /* ignore */ }
  }

  // Initialize theme from localStorage or system preference
  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(THEME_KEY); } catch (e) {}
    if (saved) {
      applyTheme(saved);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      applyTheme('light');
    }
    var btn = document.getElementById('themeToggleBtn');
    if (btn) btn.addEventListener('click', toggleTheme);
  })();

  // ---- State ----
  let history = []; // Inspiration history data
  let historyVisible = false;
  let activeTab = 'search';
  let lastResult = null; // Store last result for team sharing
  let conversationHistory = []; // Store chat follow-up history
  let currentFramework = 'swot'; // Current analysis framework

  // ---- Draft Auto-save ----
  var DRAFT_KEY = 'inspiration_draft';

  function saveDraft() {
    try {
      if (textarea && textarea.value) {
        localStorage.setItem(DRAFT_KEY, textarea.value);
      } else {
        localStorage.removeItem(DRAFT_KEY);
      }
    } catch (e) { /* ignore quota errors */ }
  }

  function restoreDraft() {
    try {
      var draft = localStorage.getItem(DRAFT_KEY);
      if (draft && textarea) {
        textarea.value = draft;
      }
    } catch (e) { /* ignore */ }
  }

  function clearDraft() {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch (e) { /* ignore */ }
  }

  // Auto-save on input
  if (textarea) {
    textarea.addEventListener('input', saveDraft);
  }
  // Restore on page load
  restoreDraft();

  // ---- Framework prompt builders ----
  function getFrameworkPrompt(framework) {
    var base = '你是一位拥有10年经验的资深产品战略顾问，擅长将模糊的灵感转化为可落地的商业方案。' +
      '你的分析以"具体、可执行、有数据支撑"著称，绝不说空话套话。\n\n' +
      '【你的工作流程——请按以下步骤思考，确保分析质量】\n' +
      '第1步：仔细研读用户的灵感描述和所有参考资料，抓住核心痛点和机会点\n' +
      '第2步：判断灵感类型（产品/研究/艺术/商业），提取3-5个核心关键词\n' +
      '第3步：构建5个关键关联节点，形成知识图谱\n' +
      '第4步：逐项完成框架分析（SWOT/精益画布/4P/技术评估等），每一条都必须：\n' +
      '   - 包含具体场景、数据、例子或可量化目标\n' +
      '   - 直接关联用户灵感中的具体元素，而非泛泛而谈\n' +
      '   - 能让用户看完立刻知道"下一步该做什么"\n' +
      '第5步：生成行动建议和时间线，确保与前面的分析前后呼应、逻辑自洽\n' +
      '第6步：输出前自查质量（详见底部质量清单）\n\n' +
      '【输入说明】\n' +
      '- 用户可能提供文字灵感、文件内容、链接摘要、搜索结果、图片等多种输入\n' +
      '- 如果有搜索结果，请优先引用其中的数据和信息来支撑你的分析\n' +
      '- 如果有文件/图片内容，请深入分析其中的关键信息，不要只是表面描述\n' +
      '- 所有分析必须基于用户提供的内容，禁止凭空臆造\n\n' +
      '【输出格式要求】\n' +
      '- 严格返回纯 JSON 对象，不要包含 Markdown、代码块、解释文字或其他任何额外内容\n' +
      '- 只返回 JSON，除了 JSON 之外什么都不要\n\n' +
      '【质量自检清单——输出前请逐条核对】\n' +
      '✅ 每一条分析都包含具体内容（场景/数据/例子/数字），不是抽象概念\n' +
      '✅ 每一条都能在用户灵感描述中找到对应依据，不是通用套话\n' +
      '✅ 不同维度的分析内容不重复，各有侧重\n' +
      '✅ 行动建议和时间线与前面的分析结论一致，逻辑闭环\n' +
      '✅ 整体分析有深度，不是任何人都能想到的表面观点\n' +
      '❌ 禁止出现："进行市场调研"、"明确用户需求"、"制定发展战略"、"加强团队建设"等通用套话\n' +
      '❌ 禁止输出任何可以套用到任意项目上的"正确的废话"\n\n' +
      '【反例警告——以下内容绝对禁止出现】\n' +
      '坏的SWOT："优势：技术实力强" → 太空泛\n' +
      '好的SWOT："优势：团队核心成员有3年AI算法经验，曾主导上线2款百万用户的AI产品" → 具体\n' +
      '坏的行动："进行竞品分析" → 套话\n' +
      '好的行动："下载并深度体验5款主流宠物社交APP，输出10页竞品功能对比报告" → 可执行\n\n';
    base += '返回的 JSON 必须包含以下字段：type（值为 product/research/art/business 之一）、tags（3-5个精准标签，字符串数组）、graph（5个关联关键词节点，字符串数组）、';
    if (framework === 'swot') {
      base += 'swot（包含 s/w/o/t 四个数组，每个数组3-4条）、';
    } else if (framework === 'lean') {
      base += 'canvas（对象，包含以下9个字符串数组：customer_segments、value_proposition、channels、customer_relationships、revenue_streams、key_resources、key_activities、key_partners、cost_structure）、';
    } else if (framework === '4p') {
      base += 'marketing4p（对象，包含4个字符串数组：product、price、place、promotion）、';
    } else if (framework === 'tech') {
      base += 'tech（对象，包含4个字符串数组：feasibility、difficulty、risks、tech_stack。技术栈必须具体到语言/框架/工具版本）、';
    } else if (framework === 'daily') {
      // 生活灵感框架：完全独立的提示词
      base = '你是一位懂生活、有品味的生活顾问，像最贴心的朋友一样给人出主意。' +
        '你说的话接地气、有画面感，不说教、不灌鸡汤。\n\n' +
        '【工作方式】\n' +
        '1. 先理解用户的纠结点或灵感来源\n' +
        '2. 从不同角度给出3-4个具体选项，每个选项都要有画面感\n' +
        '3. 最后给出一个带温度的总结建议\n\n' +
        '【输出要求】\n' +
        '- 严格返回纯 JSON 对象，不要 Markdown、不要代码块、不要解释\n' +
        '- 语气亲切自然，像朋友聊天一样\n' +
        '- 多用"口感/氛围/便利性/性价比/治愈感/仪式感"等生活化描述\n' +
        '- 不要用"优势/劣势/战略/定位"等商业词汇\n' +
        '- 每个选项都要具体：不说"吃面条"，而说"暖乎乎的番茄鸡蛋面，酸甜开胃，适合没胃口的阴天"\n\n' +
        '【JSON 字段说明】\n' +
        '- type: 固定为 "daily"\n' +
        '- tags: 3-5个相关的日常标签（字符串数组）\n' +
        '- graph: 5个与主题相关的关键词/想法节点（字符串数组）\n' +
        '- suggestions: 3-4个建议选项（对象数组），每个包含：\n' +
        '   name: 选项名称（简短好记）\n' +
        '   reason: 推荐理由（具体有画面感，让人看完就能想象出那个场景）\n' +
        '   vibe: 适合什么心情/场景（一两个词概括）\n' +
        '- final_verdict: 最终一句话建议（带温度带情绪，像朋友拍板说的话）\n\n' +
        '记住：好的生活建议让人看完会心一笑，觉得"对！就是这个感觉！"';
      return base;
    }
    // actions 和 timeline（daily 框架除外）
    base += 'actions（包含 text 和 priority 字段的对象数组，priority 只能是 high/medium/low，共5-6条）、timeline（包含 time 和 task 字段的对象数组，共4-5个阶段）。';
    // 质量要求
    base += '\n\n【行动建议 actions 质量要求】\n' +
      '- 每条必须包含：具体动作 + 具体对象/数量/目标 + 可验证的产出\n' +
      '- 好例子（宠物社交APP）："注册5个宠物主人社群，发布调研问卷收集100份有效反馈"\n' +
      '- 坏例子（禁止）："进行市场调研，了解用户需求"\n' +
      '- 按优先级排序：high=启动第一天就该做，medium=第一阶段后期，low=远期规划\n' +
      '- 不同领域侧重不同：产品类侧重用户验证，研究类侧重文献和实验，创作类侧重素材和风格探索，商业类侧重市场和盈利\n\n' +
      '【执行时间线 timeline 质量要求】\n' +
      '- 每个阶段的 task 必须具体到"这个项目该做什么"，而不是通用项目管理术语\n' +
      '- 好例子（宠物社交APP）："完成宠物主人用户画像和核心功能列表梳理"\n' +
      '- 坏例子（禁止）："完成需求分析和产品规划"\n' +
      '- 时间安排合理：小型工具按周计，研究按月计，创作按天或周计\n' +
      '- 阶段之间有递进关系，前一阶段的产出是后一阶段的输入\n\n' +
      '最后提醒：你的输出将直接影响用户的决策质量，请认真对待每一条分析。宁可少而精，不可多而空。';
    return base;
  }

  function getFrameworkName(framework) {
    var names = { swot: 'SWOT', lean: 'Lean Canvas', '4p': '4P Marketing', tech: 'Tech Assessment', daily: 'Daily Life' };
    return names[framework] || 'SWOT';
  }

  // ---- API Config ----
  // Language code mapping for speech recognition and other APIs
  var LANG_MAP = {
    zh: 'zh-CN',
    en: 'en-US',
    ja: 'ja-JP',
    ko: 'ko-KR',
    fr: 'fr-FR',
    de: 'de-DE',
    es: 'es-ES'
  };
  let BASE_URL = localStorage.getItem('ollama_base_url') || 'http://localhost:11434';
  let MODEL = localStorage.getItem('ollama_model') || 'phi4-mini:latest';
  let OPENSERP_URL = localStorage.getItem('openserp_url') || 'http://localhost:7000';
  let apiSettingsVisible = false;

  // Uploaded files (name + content)
  let uploadedFiles = [];
  // Added links
  let addedLinks = [];

  // ---- History Storage Key ----
  var HISTORY_KEY = 'inspirationHistory';

  // ---- Load History ----
  try {
    history = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
  } catch (e) { history = []; }

  function saveHistory() {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {}
  }

  // ---- Tab switching ----
  document.querySelectorAll('.input-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.input-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.input-pane').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.dataset.tab;
      document.getElementById('pane-' + activeTab).classList.add('active');
    });
  });

  // API Settings logic
  var apiToggle = document.getElementById('apiToggle');
  var apiSettings = document.getElementById('apiSettings');
  var apiBaseUrlInput = document.getElementById('apiBaseUrl');
  var apiModelInput = document.getElementById('apiModel');
  var apiSaveBtn = document.getElementById('apiSaveBtn');
  var apiStatus = document.getElementById('apiStatus');

  if (apiBaseUrlInput) apiBaseUrlInput.value = BASE_URL;
  if (apiModelInput) apiModelInput.value = MODEL;
  var apiOpenSerpUrlInput = document.getElementById('apiOpenSerpUrl');
  if (apiOpenSerpUrlInput) apiOpenSerpUrlInput.value = OPENSERP_URL;
  var apiCacheTtlInput = document.getElementById('apiCacheTtl');
  if (apiCacheTtlInput) apiCacheTtlInput.value = String(SEARCH_CACHE_TTL);

  function updateApiStatus() {
    if (!apiStatus) return;
    // Show old single-line status (config summary)
    if (BASE_URL) {
      apiStatus.textContent = t('apiConfigured') + MODEL + t('apiOpenSERP') + OPENSERP_URL.replace(/^https?:\/\//, '');
      apiStatus.className = 'api-status';
      apiStatus.style.color = 'var(--muted)';
    } else {
      apiStatus.textContent = t('apiNeedUrl');
      apiStatus.className = 'api-status err';
    }
    // Start async connectivity checks
    checkOllamaStatus();
    checkSerpStatus();
  }

  var apiStatusOllama = null;
  var apiStatusSerp = null;

  function checkOllamaStatus() {
    var row = document.getElementById('apiStatusOllama');
    var indicator = document.getElementById('ollamaIndicator');
    var text = document.getElementById('ollamaStatusText');
    var retryBtn = document.getElementById('ollamaRetryBtn');
    if (!row || !indicator || !text) return;

    row.style.display = 'flex';
    indicator.textContent = '⏳';
    indicator.style.color = 'var(--muted)';
    text.textContent = t('apiOllamaChecking');
    text.style.color = 'var(--muted)';
    if (retryBtn) retryBtn.style.display = 'none';

    fetch(BASE_URL + '/api/tags', { method: 'GET', headers: { 'Accept': 'application/json' } })
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(data) {
        var models = data.models || [];
        var modelName = MODEL;
        // Try to find a matching model to show full name
        var matched = models.find(function(m) { return m.name && m.name.startsWith(MODEL); });
        if (matched) {
          modelName = matched.name;
        } else if (models.length > 0) {
          // Default model not found, auto-select first available model
          MODEL = models[0].name;
          modelName = MODEL;
          localStorage.setItem('ollama_model', MODEL);
        }
        indicator.textContent = '✅';
        indicator.style.color = 'var(--good)';
        text.textContent = t('apiOllamaConnected') + modelName + ')';
        text.style.color = 'var(--good)';
      })
      .catch(function(err) {
        indicator.textContent = '❌';
        indicator.style.color = 'var(--bad)';
        text.textContent = t('apiOllamaOffline');
        text.style.color = 'var(--bad)';
        if (retryBtn) retryBtn.style.display = 'inline-block';
      });
  }

  function checkSerpStatus() {
    var row = document.getElementById('apiStatusSerp');
    var indicator = document.getElementById('serpIndicator');
    var text = document.getElementById('serpStatusText');
    var retryBtn = document.getElementById('serpRetryBtn');
    if (!row || !indicator || !text) return;

    row.style.display = 'flex';
    indicator.textContent = '⏳';
    indicator.style.color = 'var(--muted)';
    text.textContent = t('apiSerpChecking');
    text.style.color = 'var(--muted)';
    if (retryBtn) retryBtn.style.display = 'none';

    fetch(OPENSERP_URL + '/mega/search?engines=duckduckgo&text=test', { method: 'GET', headers: { 'Accept': 'application/json' } })
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(data) {
        indicator.textContent = '✅';
        indicator.style.color = 'var(--good)';
        text.textContent = t('apiSerpConnected');
        text.style.color = 'var(--good)';
      })
      .catch(function(err) {
        indicator.textContent = '❌';
        indicator.style.color = 'var(--bad)';
        text.textContent = t('apiSerpOffline');
        text.style.color = 'var(--bad)';
        if (retryBtn) retryBtn.style.display = 'inline-block';
      });
  }

  if (apiToggle) {
    apiToggle.addEventListener('click', function() {
      apiSettingsVisible = !apiSettingsVisible;
      apiSettings.classList.toggle('active', apiSettingsVisible);
      apiToggle.textContent = apiSettingsVisible ? t('apiCollapse') : t('apiExpand');
    });
  }

  // Test connection button
  var apiTestBtn = document.getElementById('apiTestBtn');
  var apiTestResult = document.getElementById('apiTestResult');

  function showTestResult(text, isErr) {
    if (!apiTestResult) return;
    apiTestResult.style.display = 'block';
    apiTestResult.textContent = text;
    apiTestResult.className = 'api-status ' + (isErr ? 'err' : 'ok');
  }

  if (apiTestBtn) {
    apiTestBtn.addEventListener('click', function() {
      var testUrl = (apiBaseUrlInput.value || 'http://localhost:11434').replace(/\/$/, '');
      showTestResult(t('apiTesting'), false);
      fetch(testUrl + '/api/tags', { method: 'GET' })
        .then(function(res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function(data) {
          var models = data.models || [];
          var modelNames = models.map(function(m) { return m.name; }).join(', ');
          var hasModel = models.some(function(m) { return m.name === MODEL; });
          var msg = t('apiTestSuccess') + modelNames;
          if (!hasModel) msg += '\n' + t('apiTestModelMissing') + MODEL + t('apiTestModelMissing2') + MODEL;
          // gemma3 模型提示
          if (MODEL && MODEL.indexOf('gemma3') !== -1) {
            msg += '\n\n💡 提示：gemma3:4b 模型输出较简略，行动建议和时间线可能不够丰富。\n   推荐切换为 phi4-mini 或 llama3 以获得更详细的分析结果。';
          }
          showTestResult(msg, false);
        })
        .catch(function(err) {
          var msg = t('apiTestFailed') + err.message;
          if (err.message.indexOf('Failed to fetch') !== -1 || err.message.indexOf('NetworkError') !== -1) {
            msg += '\n' + t('apiTestCheckList');
          }
          showTestResult(msg, true);
        });
    });
  }

  if (apiSaveBtn) {
    apiSaveBtn.addEventListener('click', function() {
      BASE_URL = (apiBaseUrlInput.value || 'http://localhost:11434').replace(/\/$/, '');
      MODEL = apiModelInput ? apiModelInput.value : 'phi4-mini:latest';
      OPENSERP_URL = apiOpenSerpUrlInput ? (apiOpenSerpUrlInput.value || 'http://localhost:7000').replace(/\/$/, '') : 'http://localhost:7000';
      var cacheTtlInput = document.getElementById('apiCacheTtl');
      if (cacheTtlInput) {
        SEARCH_CACHE_TTL = parseInt(cacheTtlInput.value);
        if (isNaN(SEARCH_CACHE_TTL)) SEARCH_CACHE_TTL = DEFAULT_SEARCH_CACHE_TTL;
        localStorage.setItem('search_cache_ttl', String(SEARCH_CACHE_TTL));
      }
      localStorage.setItem('ollama_base_url', BASE_URL);
      localStorage.setItem('ollama_model', MODEL);
      localStorage.setItem('openserp_url', OPENSERP_URL);
      updateApiStatus();
      if (apiTestResult) apiTestResult.style.display = 'none';
      showToast(t('apiSaved'));
      apiSettingsVisible = false;
      apiSettings.classList.remove('active');
      apiToggle.textContent = t('apiExpand');
    });
  }
  updateApiStatus();

  // Retry buttons for connectivity status
  var ollamaRetryBtn = document.getElementById('ollamaRetryBtn');
  if (ollamaRetryBtn) {
    ollamaRetryBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      checkOllamaStatus();
    });
  }
  var serpRetryBtn = document.getElementById('serpRetryBtn');
  if (serpRetryBtn) {
    serpRetryBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      checkSerpStatus();
    });
  }

  // Language switcher
  var langSelect = document.getElementById('langSelect');
  if (langSelect) {
    langSelect.value = currentLang;
    langSelect.addEventListener('change', function() {
      currentLang = this.value;
      localStorage.setItem('appLang', currentLang);
      applyStaticI18n();
      showToast(t('langLabel').replace('🌐 ', '') + ' · ' + this.options[this.selectedIndex].text);
      if (historyVisible) renderHistory();
    });
  }
  applyStaticI18n();

  // ---- Voice button (in text pane) ----
  var isRecording = false;
  var recognition = null;
  document.getElementById('voiceBtn').addEventListener('click', function() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      showToast(t('voiceNotSupported'));
      return;
    }
    var voiceStatus = document.getElementById('voiceStatus');
    if (isRecording) {
      recognition.stop();
      isRecording = false;
      document.getElementById('voiceBtn').textContent = t('voiceBtn');
      voiceStatus.textContent = t('voiceStatusStopped');
      return;
    }
    var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = LANG_MAP[currentLang] || 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = function() {
      isRecording = true;
      document.getElementById('voiceBtn').textContent = t('voiceRecording');
      voiceStatus.textContent = t('voiceStatusRecording');
    };
    recognition.onresult = function(e) {
      var transcript = '';
      for (var i = 0; i < e.results.length; i++) {
        transcript += e.results[i][0].transcript;
      }
      textarea.value = transcript;
    };
    recognition.onerror = function() {
      isRecording = false;
      document.getElementById('voiceBtn').textContent = t('voiceBtn');
      voiceStatus.textContent = t('voiceStatusError');
    };
    recognition.onend = function() {
      if (isRecording) {
        recognition.start();
      } else {
        document.getElementById('voiceBtn').textContent = t('voiceBtn');
        voiceStatus.textContent = t('voiceStatusComplete');
      }
    };
    recognition.start();
  });

  // ---- Image upload (in link pane) ----
  var uploadedImages = [];
  var imageInput = document.getElementById('imageInput');
  var imageUploadArea = document.getElementById('imageUploadArea');

  imageUploadArea.addEventListener('click', function() { imageInput.click(); });
  imageUploadArea.addEventListener('dragover', function(e) { e.preventDefault(); imageUploadArea.classList.add('dragover'); });
  imageUploadArea.addEventListener('dragleave', function() { imageUploadArea.classList.remove('dragover'); });
  imageUploadArea.addEventListener('drop', function(e) {
    e.preventDefault(); imageUploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) handleImageFiles(Array.from(e.dataTransfer.files));
  });
  imageInput.addEventListener('change', function(e) { if (e.target.files.length) handleImageFiles(Array.from(e.target.files)); });

  function handleImageFiles(files) {
    var validFiles = files.filter(function(f) {
      return ['png','jpg','jpeg','gif','webp'].includes(f.name.split('.').pop().toLowerCase());
    });
    if (!validFiles.length) { showToast(t('fileUnsupported')); return; }
    validFiles.forEach(function(file) {
      var reader = new FileReader();
      reader.onload = function(e) {
        uploadedImages.push({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', dataUrl: e.target.result });
        renderImageList();
      };
      reader.readAsDataURL(file);
    });
  }

  function renderImageList() {
    var imageList = document.getElementById('imageList');
    var imageItems = document.getElementById('imageItems');
    if (!uploadedImages.length) { imageList.classList.remove('active'); return; }
    imageList.classList.add('active');
    imageItems.innerHTML = uploadedImages.map(function(img, i) {
      return '<div class="file-item"><span>🖼️</span><span class="name">' + img.name + '</span><span class="size">' + img.size + '</span><span class="remove" data-img-index="' + i + '">✕</span></div>';
    }).join('');
    imageItems.querySelectorAll('.remove').forEach(function(el) {
      el.addEventListener('click', function() {
        uploadedImages.splice(parseInt(el.dataset.imgIndex), 1);
        renderImageList();
      });
    });
  }

  // ---- Quick idea buttons (text) ----
  document.querySelectorAll('#pane-text .quick-idea-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      textarea.value = btn.dataset.idea;
    });
  });

  // ---- Smart Search ----
  var searchDB = [
    { title: '2025全球AI产品趋势报告', desc: '分析了2025年最具潜力的AI产品方向，包括AI Agent、多模态交互、个性化推荐等10大趋势。', type: 'product', source: 'Product Hunt', keywords: ['ai','产品','趋势','agent','多模态','推荐'] },
    { title: '大语言模型在科研中的应用综述', desc: '系统总结了LLM在文献综述、实验设计、数据分析、论文写作等科研环节的应用案例和效果评估。', type: 'research', source: 'arXiv', keywords: ['llm','科研','论文','文献','实验','大模型'] },
    { title: 'AI创业必读：从0到1的商业模式设计', desc: '针对AI初创企业的商业模式设计方法论，涵盖定价策略、用户增长、技术壁垒构建等核心要素。', type: 'business', source: '36氪', keywords: ['创业','商业模式','定价','增长','壁垒','盈利'] },
    { title: '前端AI工具链：2025年开发者效率提升指南', desc: '整理了最新的AI辅助开发工具，包括代码生成、自动化测试、智能调试、文档生成等完整工具链。', type: 'tech', source: 'GitHub Blog', keywords: ['前端','开发','代码','测试','调试','工具'] },
    { title: '智能助老产品设计原则与用户研究', desc: '基于500位老年人的深度访谈，总结了智能助老产品的核心设计原则、交互模式和使用场景。', type: 'product', source: 'UX Collective', keywords: ['助老','老年人','设计','交互','用户研究'] },
    { title: '多模态AI：从GPT-4V到Gemini的技术演进', desc: '深度解析多模态大模型的技术架构、训练方法和应用场景，涵盖视觉理解、视频分析、跨模态推理。', type: 'research', source: 'Google Research', keywords: ['多模态','gpt','视觉','视频','推理','大模型'] },
    { title: 'AI+教育：个性化学习路径推荐系统', desc: '介绍基于知识图谱和强化学习的个性化教育推荐系统，已服务超过100万学生，学习效果提升35%。', type: 'product', source: 'EdTech Review', keywords: ['教育','学习','推荐','知识图谱','个性化','学生'] },
    { title: 'AI创业融资指南：2025年投资人关注什么', desc: '汇总了2025年Top 50 AI投资机构的投资偏好，包括估值逻辑、团队要求、技术门槛和退出路径。', type: 'business', source: 'IT桔子', keywords: ['融资','投资','估值','团队','退出','资本'] },
    { title: 'RAG技术实践：构建企业级知识库问答系统', desc: '从向量数据库选型、检索策略、重排序到答案生成的完整RAG系统构建指南，附开源代码和性能对比。', type: 'tech', source: 'Hugging Face', keywords: ['rag','知识库','向量','检索','问答','企业'] },
    { title: 'AI创意工具在视觉设计中的创新应用', desc: '探索Midjourney、Stable Diffusion等AI绘图工具在品牌设计、UI设计、插画创作中的实际案例和创意方法论。', type: 'product', source: 'Behance', keywords: ['设计','视觉','绘图','midjourney','品牌','插画'] },
    { title: '强化学习在自动驾驶决策中的最新突破', desc: '综述了2024-2025年强化学习在自动驾驶场景决策规划中的最新研究成果，包括端到端训练和安全约束。', type: 'research', source: 'IEEE', keywords: ['强化学习','自动驾驶','决策','端到端','安全','规划'] },
    { title: 'AI SaaS产品的北极星指标设计', desc: '分析Notion、Figma、Jasper等AI SaaS产品的核心指标体系，提供可落地的用户增长和留存优化方案。', type: 'business', source: 'Reforge', keywords: ['saas','指标','增长','留存','北极星','用户'] },
    { title: '边缘计算+AI：端侧大模型部署实战', desc: '详细介绍如何在手机、IoT设备上部署和优化大模型，包括量化、剪枝、蒸馏等模型压缩技术。', type: 'tech', source: 'Qualcomm', keywords: ['边缘','端侧','部署','量化','剪枝','蒸馏'] },
    { title: 'AI伦理与可解释性：产品设计的责任边界', desc: '探讨AI产品在隐私保护、算法公平、决策透明方面的设计原则，提供可落地的伦理检查清单。', type: 'product', source: 'MIT Tech Review', keywords: ['伦理','隐私','公平','透明','责任','设计'] },
    { title: '生成式AI在药物发现中的应用：从分子到临床', desc: '系统介绍了GAN、扩散模型等生成式AI在分子设计、靶点预测、临床试验优化中的最新进展。', type: 'research', source: 'Nature', keywords: ['生成式','药物','分子','临床','靶点','医学'] }
  ];

  var selectedSearchResults = [];
  var currentSearchType = 'all';

  // Search type chips
  document.querySelectorAll('.search-type-chip').forEach(function(chip) {
    chip.addEventListener('click', function() {
      document.querySelectorAll('.search-type-chip').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
      currentSearchType = chip.dataset.st;
      // Re-run search if keyword exists
      var kw = document.getElementById('searchInput').value.trim();
      if (kw) doSearch(kw);
    });
  });

  // Search button
  document.getElementById('searchBtn').addEventListener('click', function() {
    var kw = document.getElementById('searchInput').value.trim();
    if (!kw) { showToast(t('toastNeedSearch')); return; }
    doSearch(kw);
  });
  document.getElementById('searchInput').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') document.getElementById('searchBtn').click();
  });

  // ---- Search Cache (configurable TTL, default 5 min) ----
  var SEARCH_CACHE_KEY = 'inspiration_search_cache';
  var DEFAULT_SEARCH_CACHE_TTL = 5 * 60 * 1000; // 5 minutes default
  var SEARCH_CACHE_TTL = parseInt(localStorage.getItem('search_cache_ttl'));
  if (isNaN(SEARCH_CACHE_TTL)) SEARCH_CACHE_TTL = DEFAULT_SEARCH_CACHE_TTL;

  // ---- History configuration ----
  var MAX_HISTORY = 20; // Maximum number of history items to keep

  function getSearchCache(keyword) {
    try {
      var cache = JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) || '{}');
      var entry = cache[keyword.toLowerCase()];
      // TTL 为 0 表示不缓存
      if (SEARCH_CACHE_TTL <= 0) return null;
      if (entry && Date.now() - entry.timestamp < SEARCH_CACHE_TTL) {
        return entry.results;
      }
      return null;
    } catch (e) { return null; }
  }

  function setSearchCache(keyword, results) {
    try {
      var cache = JSON.parse(localStorage.getItem(SEARCH_CACHE_KEY) || '{}');
      // Clean expired entries
      var now = Date.now();
      Object.keys(cache).forEach(function(k) {
        if (now - cache[k].timestamp >= SEARCH_CACHE_TTL) delete cache[k];
      });
      cache[keyword.toLowerCase()] = { timestamp: now, results: results };
      localStorage.setItem(SEARCH_CACHE_KEY, JSON.stringify(cache));
    } catch (e) { /* ignore quota errors */ }
  }

  function doSearch(keyword) {
    selectedSearchResults = [];
    var lowerKw = keyword.toLowerCase();
    var container = document.getElementById('searchResults');
    var itemsContainer = document.getElementById('searchResultItems');
    container.classList.add('active');

    // Check cache first
    var cached = getSearchCache(keyword);
    if (cached && cached.length) {
      renderSearchResults(cached, true);
      // Subtle toast to indicate cache hit
      console.log('[Search] Cache hit for:', keyword);
      return;
    }

    itemsContainer.innerHTML = '<p style="color:var(--muted);text-align:center;padding:1.5rem;">' + t('searchSearching') + '</p>';

    // Try OpenSERP first, fallback to local searchDB
    fetch(OPENSERP_URL + '/mega/search?engines=duckduckgo&text=' + encodeURIComponent(keyword), {
      method: 'GET',
      headers: { 'Accept': 'application/json' }
    })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(function(data) {
      var raw = data.results || data.data || data;
      if (!Array.isArray(raw)) raw = [];
      var mapped = raw.slice(0, 10).map(function(item) {
        var url = item.url || item.link || item.href || '';
        var domain = '';
        try { domain = new URL(url).hostname; } catch(e) { domain = url.replace(/https?:\/\//, '').split('/')[0]; }
        return {
          title: item.title || item.name || item.text || '',
          desc: item.snippet || item.description || item.content || item.text || '',
          source: domain,
          url: url,
          type: currentSearchType === 'all' ? 'product' : currentSearchType
        };
      }).filter(function(r) { return r.title; });

      if (!mapped.length) throw new Error('no_results');
      // Save to cache
      setSearchCache(keyword, mapped);
      renderSearchResults(mapped, true);
    })
    .catch(function(err) {
      console.warn('OpenSERP failed:', err.message);
      if (err.message !== 'no_results') {
        showToast(t('searchFallback'));
      }
      // Fallback to local searchDB
      var kws = lowerKw.split(/\s+/);
      var results = searchDB.map(function(item) {
        var score = 0;
        if (item.title.toLowerCase().includes(lowerKw)) score += 10;
        item.keywords.forEach(function(k) {
          kws.forEach(function(q) {
            if (q.length > 1 && k.includes(q)) score += 5;
          });
        });
        if (item.desc.toLowerCase().includes(lowerKw)) score += 3;
        return { item: item, score: score };
      }).filter(function(r) { return r.score > 0; }).sort(function(a, b) { return b.score - a.score; });

      if (currentSearchType !== 'all') {
        results = results.filter(function(r) { return r.item.type === currentSearchType; });
      }

      var mapped = results.slice(0, 6).map(function(r) {
        return { title: r.item.title, desc: r.item.desc, source: r.item.source, url: '', type: r.item.type };
      });
      // Cache local fallback results too
      if (mapped.length) setSearchCache(keyword, mapped);
      renderSearchResults(mapped, false);
    });
  }

  function renderSearchResults(results, isLive) {
    var container = document.getElementById('searchResults');
    var itemsContainer = document.getElementById('searchResultItems');

    if (!results.length) {
      itemsContainer.innerHTML = '<p style="color:var(--muted);text-align:center;padding:1.5rem;">' + t('searchResultsEmpty') + '</p>';
      container.classList.add('active');
      return;
    }

    // Update source label
    var label = container.querySelector('.quick-ideas-label');
    if (label) label.textContent = isLive ? t('searchResultsLive') : t('searchResultsLocal');

    var typeLabels = { product: t('typeProduct'), research: t('typeResearch'), business: t('typeBusiness'), tech: t('typeTech') };

    itemsContainer.innerHTML = results.map(function(item, i) {
      var sourceHtml = item.url
        ? '<a href="' + item.url + '" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:none;font-size:0.72rem;" title="' + item.url.replace(/"/g, '&quot;') + '">' + item.source + ' ↗</a>'
        : '<span style="font-size:0.72rem;color:var(--muted);">' + item.source + '</span>';
      return '<div class="search-result-item" data-sr-index="' + i + '" data-sr-title="' + item.title.replace(/"/g, '&quot;') + '" data-sr-desc="' + item.desc.replace(/"/g, '&quot;') + '" data-sr-type="' + item.type + '" data-sr-url="' + (item.url || '').replace(/"/g, '&quot;') + '">' +
        '<span class="sr-check">✓</span>' +
        '<div class="sr-body">' +
          '<div class="sr-title">' + item.title + '</div>' +
          '<div class="sr-desc">' + item.desc + '</div>' +
          '<div class="sr-meta">' + t('searchSourceLabel') + sourceHtml + '</div>' +
          '<span class="sr-tag ' + item.type + '">' + (typeLabels[item.type] || item.type) + '</span>' +
        '</div>' +
      '</div>';
    }).join('');

    container.classList.add('active');

    // Bind click to select/deselect
    itemsContainer.querySelectorAll('.search-result-item').forEach(function(el) {
      el.addEventListener('click', function(e) {
        if (e.target.tagName === 'A') return; // Don't toggle when clicking links
        var title = el.dataset.srTitle;
        var desc = el.dataset.srDesc;
        var stype = el.dataset.srType;
        var surl = el.dataset.srUrl || '';

        if (el.classList.contains('selected')) {
          el.classList.remove('selected');
          selectedSearchResults = selectedSearchResults.filter(function(s) { return s.title !== title; });
        } else {
          el.classList.add('selected');
          selectedSearchResults.push({ title: title, desc: desc, type: stype, url: surl });
        }
      });
    });

    showToast(t('searchResultsFound').replace('{n}', results.length));
  }

  // ---- File Upload ----
  const fileInput = document.getElementById('fileInput');
  const fileUploadArea = document.getElementById('fileUploadArea');
  const fileItems = document.getElementById('fileItems');
  const fileList = document.getElementById('fileList');
  const fileInfo = document.getElementById('fileInfo');

  fileUploadArea.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', handleFileSelect);

  // Drag & drop
  fileUploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    fileUploadArea.classList.add('dragover');
  });
  fileUploadArea.addEventListener('dragleave', () => {
    fileUploadArea.classList.remove('dragover');
  });
  fileUploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    fileUploadArea.classList.remove('dragover');
    if (e.dataTransfer.files.length) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  });

  function handleFileSelect(e) {
    if (e.target.files.length) handleFiles(Array.from(e.target.files));
  }

  function handleFiles(files) {
    var validFiles = files.filter(function(f) {
      var ext = f.name.split('.').pop().toLowerCase();
      return ['txt','md','pdf','docx'].includes(ext);
    });
    if (!validFiles.length) { showToast(t('fileUnsupported')); return; }

    var pending = validFiles.length;

    function tryFinish() {
      pending--;
      if (pending === 0) renderFiles();
    }

    validFiles.forEach(function(file) {
      var ext = file.name.split('.').pop().toLowerCase();
      var reader = new FileReader();

      reader.onload = function(e) {
        if (ext === 'pdf') {
          // Parse PDF with pdf.js
          var loadingTask = pdfjsLib.getDocument({ data: e.target.result });
          loadingTask.promise.then(function(pdf) {
            var pagePromises = [];
            for (var i = 1; i <= pdf.numPages; i++) {
              pagePromises.push(pdf.getPage(i).then(function(page) {
                return page.getTextContent().then(function(tc) {
                  return tc.items.map(function(it) { return it.str; }).join(' ');
                });
              }));
            }
            Promise.all(pagePromises).then(function(pages) {
              uploadedFiles.push({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', content: pages.join('\n'), isImage: false });
              tryFinish();
            }).catch(function(err) {
              uploadedFiles.push({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', content: '[PDF parse error: ' + (err.message || 'unknown') + ']', isImage: false });
              tryFinish();
            });
          }).catch(function(err) {
            uploadedFiles.push({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', content: '[PDF parse error: ' + (err.message || 'unknown') + ']', isImage: false });
            tryFinish();
          });
        } else if (ext === 'docx') {
          // Parse DOCX with mammoth.js
          mammoth.extractRawText({ arrayBuffer: e.target.result }).then(function(result) {
            uploadedFiles.push({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', content: result.value, isImage: false });
            tryFinish();
          }).catch(function(err) {
            uploadedFiles.push({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', content: '[DOCX parse error: ' + (err.message || 'unknown') + ']', isImage: false });
            tryFinish();
          });
        } else {
          // TXT / MD
          uploadedFiles.push({ name: file.name, size: (file.size / 1024).toFixed(1) + ' KB', content: e.target.result, isImage: false });
          tryFinish();
        }
      };

      if (ext === 'pdf' || ext === 'docx') {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    });
  }

  function renderFiles() {
    fileList.classList.add('active');
    if (fileInfo) fileInfo.style.display = 'block';
    fileItems.innerHTML = uploadedFiles.map((f, i) => `
      <div class="file-item">
        <span>${f.isImage ? '🖼️' : '📄'}</span>
        <span class="name">${f.name}</span>
        <span class="size">${f.size}</span>
        <span class="remove" data-file-index="${i}">✕</span>
      </div>
    `).join('');
    // Remove handlers
    fileItems.querySelectorAll('.remove').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.fileIndex);
        uploadedFiles.splice(idx, 1);
        renderFiles();
        if (!uploadedFiles.length) { fileList.classList.remove('active'); if (fileInfo) fileInfo.style.display = 'none'; }
      });
    });
  }

  // Quick file buttons
  document.querySelectorAll('#pane-file .quick-idea-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.fileName;
      const content = btn.dataset.fileContent;
      if (name && !uploadedFiles.some(f => f.name === name)) {
        uploadedFiles.push({ name: name, size: '模拟文件', content: content, isImage: false });
        renderFiles();
        showToast(t('toastFileAdded') + name);
      } else if (uploadedFiles.some(f => f.name === name)) {
        showToast(t('toastFileExists'));
      }
    });
  });

  // ---- Link Input ----
  const linkInput = document.getElementById('linkInput');
  const linkAddBtn = document.getElementById('linkAddBtn');
  const linkItems = document.getElementById('linkItems');
  const linkList = document.getElementById('linkList');

  linkAddBtn.addEventListener('click', addLink);
  linkInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addLink(); });

  // Quick link buttons
  document.querySelectorAll('#pane-link .quick-idea-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.link;
      if (url && !addedLinks.some(l => l.url === url)) {
        addedLinks.push({ url: url, title: btn.textContent.trim() });
        renderLinks();
        linkInput.value = '';
      }
    });
  });

  function addLink() {
    let url = linkInput.value.trim();
    if (!url) { showToast(t('toastNeedLink')); return; }
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    if (addedLinks.some(l => l.url === url)) { showToast(t('toastLinkExists')); return; }
    try { new URL(url); } catch(e) { showToast(t('toastLinkInvalid')); return; }
    addedLinks.push({ url: url, title: url.length > 50 ? url.substring(0,50) + '...' : url });
    renderLinks();
    linkInput.value = '';
    showToast(t('toastLinkAdded'));
  }

  function renderLinks() {
    linkList.classList.add('active');
    linkItems.innerHTML = addedLinks.map((l, i) => `
      <div class="link-item">
        <span class="favicon">🔗</span>
        <span class="url" title="${l.url}">${l.title}</span>
        <span class="remove" data-link-index="${i}">✕</span>
      </div>
    `).join('');
    linkItems.querySelectorAll('.remove').forEach(el => {
      el.addEventListener('click', () => {
        const idx = parseInt(el.dataset.linkIndex);
        addedLinks.splice(idx, 1);
        renderLinks();
        if (!addedLinks.length) linkList.classList.remove('active');
      });
    });
  }

  // ---- Keyboard Shortcuts ----
  function initKeyboardShortcuts() {
    // Ctrl+Enter in inspiration textarea → capture
    var inspInput = document.getElementById('inspirationInput');
    if (inspInput) {
      inspInput.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          captureBtn.click();
        }
      });
    }
    // Ctrl+Enter in chat input → send
    var chatInput = document.getElementById('chatInput');
    if (chatInput) {
      chatInput.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') {
          e.preventDefault();
          var sendBtn = document.getElementById('chatSendBtn');
          if (sendBtn) sendBtn.click();
        }
      });
    }
    // Esc → close history panel if open
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        if (historyVisible) {
          historyBtn.click();
        }
      }
    });
    // Enter in search input → search (already exists, keep as-is)
  }
  initKeyboardShortcuts();

  // ---- Capture Logic ----
  captureBtn.addEventListener('click', () => {
    let inputText = '';

    if (activeTab === 'text') {
      inputText = textarea.value.trim();
      if (!inputText) { showToast(t('toastNeedInput')); return; }
    } else if (activeTab === 'search') {
      var searchKw = document.getElementById('searchInput').value.trim();
      if (!searchKw && !selectedSearchResults.length) { showToast(t('toastNeedSearch')); return; }
      inputText = '搜索关键词：' + (searchKw || '未指定') + '\n\n';
      if (selectedSearchResults.length) {
        inputText += '选中的搜索结果：\n' + selectedSearchResults.map(function(s) { return '【' + s.title + '】' + s.desc; }).join('\n---\n') + '\n';
      }
      var searchInsp = (document.getElementById('searchInspirationInput').value || '').trim();
      if (searchInsp) inputText += '\n用户的灵感想法：' + searchInsp;
    } else if (activeTab === 'file') {
      if (!uploadedFiles.length) { showToast(t('toastNeedFile')); return; }
      inputText = '用户上传的文件灵感：\n' + uploadedFiles.map(function(f) { return '[' + f.name + '] ' + f.content; }).join('\n---\n');
      // Append user's own inspiration if provided
      var fileInsp = (document.getElementById('fileInspirationInput').value || '').trim();
      if (fileInsp) inputText += '\n\n用户的灵感想法：' + fileInsp;
    } else if (activeTab === 'link') {
      if (!addedLinks.length && !uploadedImages.length) { showToast(t('toastNeedLinkOrImage')); return; }
      var linkParts = [];
      if (addedLinks.length) {
        linkParts.push('用户分享的链接灵感：\n' + addedLinks.map(function(l) { return '链接: ' + l.url + ' - ' + l.title; }).join('\n'));
      }
      if (uploadedImages.length) {
        linkParts.push('上传的图片（' + uploadedImages.length + '张）：' + uploadedImages.map(function(img) { return '[' + img.name + ']'; }).join(', '));
      }
      inputText = linkParts.join('\n\n');
      // Append user's own inspiration if provided
      var linkInsp = (document.getElementById('linkInspirationInput').value || '').trim();
      if (linkInsp) inputText += '\n\n用户的灵感想法：' + linkInsp;
    } else {
      inputText = textarea.value.trim();
      if (!inputText) { showToast(t('toastNeedInput')); return; }
    }

    captureBtn.disabled = true;
    resultsArea.classList.remove('active');
    historyArea.classList.remove('active');
    processingArea.classList.add('active');

    // Animate steps
    var stepsLabels = [t('stepContent'), t('stepType'), t('stepRelation'), t('stepPlan')];
    if (activeTab === 'file' || activeTab === 'link') {
      stepsLabels = [t('stepParse'), t('stepExtract'), t('stepDeep'), t('stepReport')];
    }
    if (activeTab === 'search') {
      stepsLabels = [t('stepSmartSearch'), t('stepFilter'), t('stepAnalysis'), t('stepInspire')];
    }
    const steps = ['step1', 'step2', 'step3', 'step4'];
    steps.forEach((id, i) => {
      document.getElementById(id).textContent = stepsLabels[i];
      setTimeout(() => {
        document.getElementById(id).classList.add('active');
        if (i > 0) { document.getElementById(steps[i-1]).classList.remove('active'); document.getElementById(steps[i-1]).classList.add('done'); }
      }, i * 800);
    });

    // API call or fallback
    function finalizeCapture(detectedType, apiResult) {
      document.getElementById('step4').classList.remove('active');
      document.getElementById('step4').classList.add('done');
      processingArea.classList.remove('active');
      var sourceEl = document.getElementById('resultSource');
      if (apiResult) {
        // 检查并补全 actions 和 timeline：如果 AI 返回为空或质量太差，用本地模板补充
        var localTemplate = generateByType(inputText, detectedType);
        var needsFallback = false;
        var fallbackFields = [];

        // 检查 actions：为空数组或内容过于通用时补充
        if (!apiResult.actions || !Array.isArray(apiResult.actions) || apiResult.actions.length === 0) {
          apiResult.actions = localTemplate.actions || [];
          needsFallback = true;
          fallbackFields.push('行动建议');
        } else if (apiResult.actions.length < 3) {
          // 少于3条也补充
          apiResult.actions = apiResult.actions.concat(localTemplate.actions || []).slice(0, 6);
          needsFallback = true;
          fallbackFields.push('行动建议');
        }

        // 检查 timeline：为空数组或内容过于通用时补充
        if (!apiResult.timeline || !Array.isArray(apiResult.timeline) || apiResult.timeline.length === 0) {
          apiResult.timeline = localTemplate.timeline || [];
          needsFallback = true;
          fallbackFields.push('执行时间线');
        } else if (apiResult.timeline.length < 3) {
          // 少于3条也补充
          apiResult.timeline = apiResult.timeline.concat(localTemplate.timeline || []).slice(0, 5);
          needsFallback = true;
          fallbackFields.push('执行时间线');
        }

        // 质量检查
        var quality = assessResultQuality(apiResult, currentFramework, inputText);

        renderResultFromData(apiResult, inputText, detectedType);
        if (sourceEl) {
          var qualityLabel = '';
          if (quality.score >= 80) qualityLabel = ' 🌟 优质';
          else if (quality.score >= 60) qualityLabel = ' ✅ 良好';
          else if (quality.score >= 40) qualityLabel = ' ⚠️ 一般';
          else qualityLabel = ' ❌ 偏低';

          if (needsFallback) {
            sourceEl.textContent = '🤖 AI + 📋 本地模板' + qualityLabel;
            sourceEl.style.background = 'rgba(255,217,61,.15)';
            sourceEl.style.color = 'var(--accent3)';
            sourceEl.title = 'AI 生成了主要内容，' + fallbackFields.join('、') + '由本地模板补充。质量分：' + quality.score + '/100。' + (quality.warnings.length ? ' 警告：' + quality.warnings.join('；') : '');
          } else {
            sourceEl.textContent = '🤖 AI 生成 (' + MODEL + ')' + qualityLabel;
            sourceEl.style.background = quality.score >= 70 ? 'rgba(78,205,196,.15)' : 'rgba(255,183,77,.15)';
            sourceEl.style.color = quality.score >= 70 ? 'var(--accent)' : 'var(--warn)';
            sourceEl.title = '质量分：' + quality.score + '/100' + (quality.warnings.length ? '。警告：' + quality.warnings.join('；') : '') + (quality.issues.length ? '。问题：' + quality.issues.join('；') : '');
          }
        }
        lastResult = { text: inputText, type: detectedType, tags: apiResult.tags || [], result: apiResult };

        // 如果触发了 fallback，给出提示
        if (needsFallback) {
          showToast('⚠️ ' + fallbackFields.join('、') + '已用本地模板补充（模型输出不完整）');
          // 如果是 gemma3:4b 模型，额外提示
          if (MODEL && MODEL.indexOf('gemma3') !== -1) {
            setTimeout(function() {
              showToast('💡 提示：gemma3:4b 模型输出较简略，可尝试切换为 phi4-mini 或 llama3 获得更丰富的结果');
            }, 1500);
          }
        }
      } else {
        var localResult = generateByType(inputText, detectedType);
        renderResultFromData(localResult, inputText, detectedType);
        if (sourceEl) {
          if (localResult._contextEnriched && localResult._contextSources && localResult._contextSources.length > 0) {
            sourceEl.textContent = '📋 本地模板 + 📎 上下文增强 ⚠️ 参考级';
            sourceEl.style.background = 'rgba(124,108,240,.15)';
            sourceEl.style.color = 'var(--accent2)';
            sourceEl.title = '基于' + localResult._contextSources.join('、') + '生成的智能模板（非 AI 生成，仅供参考）';
          } else {
            sourceEl.textContent = '📋 本地模板（离线模式） ⚠️ 参考级';
            sourceEl.style.background = 'rgba(255,183,77,.15)';
            sourceEl.style.color = 'var(--warn)';
            sourceEl.title = '未连接 Ollama，使用本地通用模板（内容较通用，仅供参考框架结构）';
          }
        }
        lastResult = { text: inputText, type: detectedType, tags: localResult.tags || [], result: localResult };
      }
      resultsArea.classList.add('active');
      // Sparkle animation on result card title
      var sparkle = document.getElementById('resultSparkle');
      if (sparkle) {
        sparkle.style.display = '';
        sparkle.classList.remove('result-sparkle');
        void sparkle.offsetWidth; // force reflow to restart animation
        sparkle.classList.add('result-sparkle');
        setTimeout(function() {
          sparkle.style.display = 'none';
        }, 1000);
      }
      // First capture celebration toast
      var hasCapturedBefore = localStorage.getItem('hasCapturedBefore');
      if (!hasCapturedBefore) {
        localStorage.setItem('hasCapturedBefore', 'true');
        var toast = document.getElementById('firstCaptureToast');
        if (toast) {
          toast.textContent = t('firstCaptureToast');
          setTimeout(function() {
            toast.classList.add('show');
            setTimeout(function() {
              toast.classList.remove('show');
            }, 5000);
          }, 300);
        }
      }
      var chatCard = document.getElementById('chatCard');
      if (chatCard) chatCard.style.display = '';
      var exportBtn = document.getElementById('exportBtn');
      if (exportBtn) { exportBtn.style.opacity = ''; exportBtn.style.pointerEvents = ''; }
      captureBtn.disabled = false;
      saveToHistory(inputText, detectedType);
      // Clear input and draft after successful capture (text tab only)
      if (activeTab === 'text' && textarea) {
        textarea.value = '';
        clearDraft();
      }
      showToast(t('toastCaptureSuccess'));
    }

    // Build prompt context
    var contextParts = [];
    if (activeTab === 'file' && uploadedFiles.length) {
      contextParts.push('=== 上传文件内容 ===\n' + uploadedFiles.map(function(f) { return '[' + f.name + ']\n' + f.content; }).join('\n---\n'));
    }
    if (activeTab === 'link' && addedLinks.length) {
      contextParts.push('=== 分享链接 ===\n' + addedLinks.map(function(l) { return l.url + ' (' + l.title + ')'; }).join('\n'));
    }
    if (activeTab === 'search' && selectedSearchResults.length) {
      contextParts.push('=== 搜索结果 ===\n' + selectedSearchResults.map(function(s) {
        var line = '【' + s.title + '】' + s.desc;
        if (s.url) line += '\n  链接：' + s.url;
        return line;
      }).join('\n---\n'));
    }
    var userInspiration = '';
    if (activeTab === 'file') userInspiration = (document.getElementById('fileInspirationInput').value || '').trim();
    if (activeTab === 'link') userInspiration = (document.getElementById('linkInspirationInput').value || '').trim();
    if (activeTab === 'search') userInspiration = (document.getElementById('searchInspirationInput').value || '').trim();
    if (activeTab === 'text') userInspiration = textarea.value.trim();

    currentFramework = (document.getElementById('frameworkSelect') || {}).value || 'swot';

    var systemPrompt = getFrameworkPrompt(currentFramework);

    var userPrompt = '【灵感描述】\n' + (userInspiration || inputText) + '\n\n';
    userPrompt += '【输入类型】' + activeTab + '\n\n';
    if (contextParts.length) {
      userPrompt += '【参考资料】\n' + contextParts.join('\n\n') + '\n\n';
      userPrompt += '请重点参考上述资料中的数据和信息，将其融入你的分析中。\n\n';
    }
    userPrompt += '请严格按照系统提示中的要求，生成高质量的 JSON 分析结果。记住：宁可少而精，不可多而空。';

    // Build messages array
    var messages = [
      { role: 'system', content: systemPrompt }
    ];
    var userMessage = { role: 'user', content: userPrompt };
    if (uploadedImages.length) {
      userMessage.images = uploadedImages.map(function(img) {
        return img.dataUrl.split(',')[1]; // Extract pure base64 without data URI prefix
      });
    }
    messages.push(userMessage);

    // Stream output helpers
    function updateStreamContent(text) {
      if (!streamContent) return;
      var escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
      // Highlight think-like sentences
      escaped = escaped.replace(
        /(让我|我来|首先|思考一下|分析如下|考虑|接下来|步骤\s*\d+|Step\s*\d+)[^\n]*?([。\n]|$)/gi,
        function(match) { return '<span class="stream-think">' + match + '</span>'; }
      );
      streamContent.innerHTML = escaped + '<span class="cursor"></span>';
      streamContent.scrollTop = streamContent.scrollHeight;
    }

    function showReasoningSteps(result) {
      if (!streamContent) return;
      var typeInfo = getTypeInfo(result.type);
      var steps = [];
      steps.push('步骤 1：识别灵感类型 → ' + (typeInfo.label || result.type));
      if (result.tags && result.tags.length) steps.push('步骤 2：提取关键词 → ' + result.tags.slice(0, 3).join('、'));
      else steps.push('步骤 2：提取关键词');
      if (result.graph && result.graph.length) steps.push('步骤 3：构建知识图谱 → ' + result.graph.length + ' 个关联节点');
      else steps.push('步骤 3：构建知识图谱');
      if (result.swot) steps.push('步骤 4：SWOT 分析 → 四维度评估');
      else steps.push('步骤 4：SWOT 分析');
      if (result.actions && result.actions.length) steps.push('步骤 5：生成行动建议 → ' + result.actions.length + ' 项任务');
      else steps.push('步骤 5：生成行动建议');
      if (result.timeline && result.timeline.length) steps.push('步骤 6：制定时间线 → ' + result.timeline.length + ' 个阶段');
      else steps.push('步骤 6：制定时间线');
      var html = '<div class="stream-reasoning" style="margin-top:0.8rem;padding-top:0.6rem;border-top:1px solid var(--rule);font-size:0.78rem;color:var(--muted);">';
      html += '<div style="font-weight:700;color:var(--accent);margin-bottom:0.3rem;">🧠 AI 推理过程</div>';
      html += '<div>' + steps.join(' → ') + '</div>';
      html += '</div>';
      var existing = streamContent.parentNode.querySelector('.stream-reasoning');
      if (existing) existing.remove();
      streamContent.insertAdjacentHTML('afterend', html);
    }

    function handleStreamComplete(fullText, wasAborted, tokenStats) {
      if (streamStopBtn) streamStopBtn.style.display = 'none';
      if (tokenStatsEl) tokenStatsEl.classList.add('active');
      if (!wasAborted) {
        // Auto-hide stream panel after a delay when completed normally
        setTimeout(function() { streamPanel.classList.remove('active'); }, 800);
      }

      if (!fullText) {
        showToast(t('ollamaEmptyFallback'));
        finalizeCapture(detectType(inputText), null);
        return;
      }

      if (wasAborted) {
        showToast(t('interruptedPartial'));
      }

      // Update token stats if provided
      if (tokenStats && tokenStats.prompt !== undefined) {
        if (tkPrompt) tkPrompt.textContent = tokenStats.prompt;
        if (tkCompletion) tkCompletion.textContent = tokenStats.completion;
        if (tkTotal) tkTotal.textContent = tokenStats.prompt + tokenStats.completion;
      }

      // Try to extract JSON from response
      var apiResult = extractJson(fullText);

      if (apiResult && apiResult.type) {
        showReasoningSteps(apiResult);
        finalizeCapture(apiResult.type || detectType(inputText), apiResult);
      } else {
        showToast(t('invalidJsonFallback'));
        var fallbackType = detectType(inputText);
        var rawResult = generateByType(inputText, fallbackType);
        rawResult.swot = { s: [t('aiRawAnswer')], w: [fullText.substring(0, 500)], o: [], t: [] };
        finalizeCapture(fallbackType, rawResult);
      }
    }

    function doNonStreamRequest() {
      fetch(BASE_URL + '/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, messages: messages, stream: false, options: { temperature: 0.4, num_predict: 2048 } })
      })
      .then(function(res) {
        if (!res.ok) throw new Error('HTTP ' + res.status);
        return res.json();
      })
      .then(function(data) {
        streamPanel.classList.remove('active');
        var content = data.message && data.message.content || '';
        // Token stats for non-stream mode
        if (data.prompt_eval_count !== undefined) {
          if (tkPrompt) tkPrompt.textContent = data.prompt_eval_count || 0;
          if (tkCompletion) tkCompletion.textContent = data.eval_count || 0;
          if (tkTotal) tkTotal.textContent = (data.prompt_eval_count || 0) + (data.eval_count || 0);
          if (tokenStatsEl) tokenStatsEl.classList.add('active');
        }
        if (!content) {
          showToast(t('ollamaEmptyFallback'));
          finalizeCapture(detectType(inputText), null);
          return;
        }
        var apiResult = extractJson(content);
        if (apiResult && apiResult.type) {
          showReasoningSteps(apiResult);
          finalizeCapture(apiResult.type || detectType(inputText), apiResult);
        } else {
          var fbType = detectType(inputText);
          var rawR = generateByType(inputText, fbType);
          rawR.swot = { s: [t('aiRawAnswer')], w: [content.substring(0, 500)], o: [], t: [] };
          finalizeCapture(fbType, rawR);
        }
      })
      .catch(function(err) {
        console.error('API Error:', err);
        streamPanel.classList.remove('active');
        var isNet = err.message.indexOf('Failed to fetch') !== -1 || err.message.indexOf('NetworkError') !== -1;
        var is404 = err.message.indexOf('HTTP 404') !== -1;
        if (isNet) {
          showToast(t('ollamaConnectionError'));
        } else if (is404) {
          showToast(t('ollamaModelNotFound') + MODEL + t('ollamaModelNotFound2') + MODEL);
        } else {
          showToast(t('ollamaFailedFallback'));
        }
        finalizeCapture(detectType(inputText), null);
      });
    }

    // Setup stream UI
    var streamPanel = document.getElementById('streamPanel');
    var streamContent = document.getElementById('streamContent');
    var tokenStatsEl = document.getElementById('tokenStats');
    var tkPrompt = document.getElementById('tkPrompt');
    var tkCompletion = document.getElementById('tkCompletion');
    var tkTotal = document.getElementById('tkTotal');
    var streamStopBtn = document.getElementById('streamStopBtn');
    var currentReader = null;
    var streamAborted = false;

    streamPanel.classList.add('active');
    processingArea.classList.remove('active');
    if (streamContent) streamContent.innerHTML = '<span class="cursor"></span>';
    var oldReasoning = streamPanel.querySelector('.stream-reasoning');
    if (oldReasoning) oldReasoning.remove();
    if (tokenStatsEl) tokenStatsEl.classList.remove('active');
    if (tkPrompt) tkPrompt.textContent = '0';
    if (tkCompletion) tkCompletion.textContent = '0';
    if (tkTotal) tkTotal.textContent = '0';

    // Browser compatibility check
    if (typeof ReadableStream === 'undefined' || typeof fetch === 'undefined') {
      showToast(t('streamingNotSupported'));
      doNonStreamRequest();
      return;
    }

    streamAborted = false;
    if (streamStopBtn) {
      streamStopBtn.style.display = '';
      streamStopBtn.onclick = function() {
        streamAborted = true;
        if (currentReader) {
          currentReader.cancel().catch(function() {});
        }
      };
    }

    fetch(BASE_URL + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        stream: true,
        options: { temperature: 0.4, num_predict: 2048 }
      })
    })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);

      // Fallback if response body doesn't support streaming
      if (!res.body || !res.body.getReader) {
        return res.json().then(function(data) {
          streamPanel.classList.remove('active');
          var ts = {};
          if (data.prompt_eval_count !== undefined) {
            ts.prompt = data.prompt_eval_count || 0;
            ts.completion = data.eval_count || 0;
          }
          handleStreamComplete(data.message && data.message.content || '', false, ts);
        });
      }

      currentReader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';
      var fullText = '';
      var tokenStats = { prompt: 0, completion: 0 };

      function readChunk() {
        return currentReader.read().then(function(result) {
          if (result.done) {
            // Process remaining buffer before completing
            if (buffer.trim()) {
              try {
                var lastData = JSON.parse(buffer.trim());
                if (lastData.done && lastData.prompt_eval_count !== undefined) {
                  tokenStats.prompt = lastData.prompt_eval_count || 0;
                  tokenStats.completion = lastData.eval_count || 0;
                }
              } catch(e) {}
            }
            handleStreamComplete(fullText, streamAborted, tokenStats);
            return;
          }

          var chunk = decoder.decode(result.value, { stream: true });
          buffer += chunk;

          // Parse NDJSON lines
          var lines = buffer.split('\n');
          buffer = lines.pop(); // Keep incomplete line in buffer

          lines.forEach(function(line) {
            line = line.trim();
            if (!line) return;
            try {
              var data = JSON.parse(line);
              var content = data.message && data.message.content || '';
              if (content) {
                fullText += content;
                updateStreamContent(fullText);
              }
              // Token stats on final chunk
              if (data.done) {
                if (data.prompt_eval_count !== undefined) {
                  tokenStats.prompt = data.prompt_eval_count || 0;
                  tokenStats.completion = data.eval_count || 0;
                }
              }
            } catch(e) {
              // Ignore parse errors for individual lines
            }
          });

          return readChunk();
        }).catch(function(err) {
          // Handle read errors (e.g., connection dropped)
          console.error('Stream read error:', err);
          handleStreamComplete(fullText, streamAborted, tokenStats);
        });
      }

      return readChunk();
    })
    .catch(function(err) {
      console.error('API Error:', err);
      if (streamStopBtn) streamStopBtn.style.display = 'none';
      var isNetworkErr = err.message.indexOf('Failed to fetch') !== -1 || err.message.indexOf('NetworkError') !== -1;
      var is404Err = err.message.indexOf('HTTP 404') !== -1;
      var msg = '';
      if (isNetworkErr) {
        msg = currentLang === 'zh'
          ? '❌ 无法连接到 Ollama，请确保 Ollama 已启动（运行 ollama serve）'
          : '❌ Cannot connect to Ollama. Make sure it is running (run: ollama serve)';
      } else if (is404Err) {
        msg = currentLang === 'zh'
          ? '❌ 模型 ' + MODEL + ' 未找到，请先运行 ollama pull ' + MODEL
          : '❌ Model ' + MODEL + ' not found. Run: ollama pull ' + MODEL;
      } else {
        msg = currentLang === 'zh'
          ? '❌ Ollama 调用失败：' + err.message + '，已使用本地模板'
          : '❌ Ollama call failed: ' + err.message + ', using local template';
      }
      showToast(msg);
      streamPanel.classList.remove('active');
      finalizeCapture(detectType(inputText), null);
    });
  });

  // ---- Regenerate Button ----
  var regenerateBtn = document.getElementById('regenerateBtn');
  var isRegenerating = false;

  function setRegenerateLoading(loading) {
    if (!regenerateBtn) return;
    isRegenerating = loading;
    var textSpan = regenerateBtn.querySelector('.regenerate-text');
    if (loading) {
      regenerateBtn.disabled = true;
      regenerateBtn.classList.add('loading');
      if (textSpan) textSpan.textContent = currentLang === 'zh' ? '重新生成中...' : 'Regenerating...';
    } else {
      regenerateBtn.disabled = false;
      regenerateBtn.classList.remove('loading');
      if (textSpan) textSpan.textContent = t('regenerateBtn') || '重新生成';
    }
  }

  function doRegenerate() {
    if (isRegenerating) return;
    if (!lastResult || !lastResult.text) {
      showToast(currentLang === 'zh' ? '没有可重新生成的内容' : 'No content to regenerate');
      return;
    }

    setRegenerateLoading(true);

    var originalText = lastResult.text;
    var detectedType = lastResult.type || detectType(originalText);
    var framework = (document.getElementById('frameworkSelect') || {}).value || 'swot';

    var systemPrompt = getFrameworkPrompt(framework);
    var userPrompt = '【灵感描述】\n' + originalText + '\n\n';
    userPrompt += '【输入类型】text\n\n';
    userPrompt += '【重要提示】这是第 2 次生成，请务必：\n';
    userPrompt += '1. 从全新的角度切入分析，不要重复上一次的思路和表述\n';
    userPrompt += '2. 分析深度比上一次更深入，给出更多具体细节、数据和案例\n';
    userPrompt += '3. 如果上次的分析有不足或遗漏，请在这次补充完整\n';
    userPrompt += '4. 严格遵循系统提示中的质量要求，宁可少而精，不可多而空\n\n';
    userPrompt += '请生成高质量的 JSON 分析结果。';

    var messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    var fullText = '';
    var wasAborted = false;

    fetch(BASE_URL + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: messages,
        stream: true,
        options: { temperature: 0.9, num_predict: 2048 }
      })
    }).then(function(response) {
      if (!response.ok) {
        throw new Error('HTTP ' + response.status);
      }
      var reader = response.body.getReader();
      var decoder = new TextDecoder();
      function read() {
        reader.read().then(function(result) {
          if (result.done) {
            // Stream complete
            var parsed = extractJson(fullText);

            if (parsed) {
              // 检查并补全 actions 和 timeline
              var localTemplate = generateByType(originalText, detectedType);
              var needsFallback = false;
              var fallbackFields = [];

              if (!parsed.actions || !Array.isArray(parsed.actions) || parsed.actions.length === 0) {
                parsed.actions = localTemplate.actions || [];
                needsFallback = true;
                fallbackFields.push('行动建议');
              } else if (parsed.actions.length < 3) {
                parsed.actions = parsed.actions.concat(localTemplate.actions || []).slice(0, 6);
                needsFallback = true;
                fallbackFields.push('行动建议');
              }

              if (!parsed.timeline || !Array.isArray(parsed.timeline) || parsed.timeline.length === 0) {
                parsed.timeline = localTemplate.timeline || [];
                needsFallback = true;
                fallbackFields.push('执行时间线');
              } else if (parsed.timeline.length < 3) {
                parsed.timeline = parsed.timeline.concat(localTemplate.timeline || []).slice(0, 5);
                needsFallback = true;
                fallbackFields.push('执行时间线');
              }

              lastResult = { text: originalText, type: detectedType, tags: parsed.tags || [], result: parsed };
              renderResultFromData(parsed, originalText, detectedType);

              var sourceEl = document.getElementById('resultSource');
              if (sourceEl) {
                if (needsFallback) {
                  sourceEl.textContent = '🤖 AI + 📋 本地模板（部分字段）';
                  sourceEl.style.background = 'rgba(255,217,61,.15)';
                  sourceEl.style.color = 'var(--accent3)';
                  sourceEl.title = 'AI 生成了主要内容，' + fallbackFields.join('、') + '由本地模板补充';
                } else {
                  sourceEl.textContent = '🤖 AI 真实生成 (' + MODEL + ')';
                  sourceEl.style.background = 'rgba(78,205,196,.15)';
                  sourceEl.style.color = 'var(--accent)';
                  sourceEl.title = '所有分析内容均由 AI 实时生成';
                }
              }

              // 更新历史记录（不新增，更新现有条目）
              saveToHistory(originalText, detectedType, true);

              showToast(currentLang === 'zh' ? '✨ 重新生成成功' : '✨ Regenerated successfully');

              // gemma3 模型提示
              if (needsFallback && MODEL && MODEL.indexOf('gemma3') !== -1) {
                setTimeout(function() {
                  showToast('💡 提示：gemma3:4b 模型输出较简略，可尝试切换为 phi4-mini 或 llama3 获得更丰富的结果');
                }, 1500);
              }
            } else {
              // 解析失败，回退到本地模板
              var fallbackResult = generateByType(originalText, detectedType);
              lastResult = { text: originalText, type: detectedType, tags: fallbackResult.tags || [], result: fallbackResult };
              renderResultFromData(fallbackResult, originalText, detectedType);
              var srcEl = document.getElementById('resultSource');
              if (srcEl) {
                srcEl.textContent = '📋 本地模板（解析失败）';
                srcEl.style.background = 'rgba(255,183,77,.15)';
                srcEl.style.color = 'var(--warn)';
              }
              saveToHistory(originalText, detectedType, true);
              showToast(currentLang === 'zh' ? '⚠️ AI 返回格式异常，已使用本地模板' : '⚠️ AI format error, using local template');
            }

            setRegenerateLoading(false);
            return;
          }

          var chunk = decoder.decode(result.value, { stream: true });
          var lines = chunk.split('\n');
          lines.forEach(function(line) {
            line = line.trim();
            if (!line || line.indexOf('data:') !== 0) return;
            var data = line.substring(5).trim();
            if (data === '[DONE]') return;
            try {
              var json = JSON.parse(data);
              if (json.message && json.message.content) {
                fullText += json.message.content;
              }
            } catch (e) {}
          });

          read();
        }).catch(function(err) {
          console.error('Stream read error:', err);
          setRegenerateLoading(false);
          // 出错也回退到本地模板
          var fbResult = generateByType(originalText, detectedType);
          lastResult = { text: originalText, type: detectedType, tags: fbResult.tags || [], result: fbResult };
          renderResultFromData(fbResult, originalText, detectedType);
          saveToHistory(originalText, detectedType, true);
          showToast(currentLang === 'zh' ? '❌ 连接失败，已使用本地模板' : '❌ Connection failed, using local template');
        });
      }
      read();
    }).catch(function(err) {
      console.error('Fetch error:', err);
      setRegenerateLoading(false);
      // 连接失败，回退到本地模板
      var fbResult2 = generateByType(originalText, detectedType);
      lastResult = { text: originalText, type: detectedType, tags: fbResult2.tags || [], result: fbResult2 };
      renderResultFromData(fbResult2, originalText, detectedType);
      var srcEl2 = document.getElementById('resultSource');
      if (srcEl2) {
        srcEl2.textContent = '📋 本地模板（离线模式）';
        srcEl2.style.background = 'rgba(255,183,77,.15)';
        srcEl2.style.color = 'var(--warn)';
      }
      saveToHistory(originalText, detectedType, true);
      showToast(currentLang === 'zh' ? '❌ 无法连接 Ollama，已使用本地模板' : '❌ Cannot connect to Ollama, using local template');
    });
  }

  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', doRegenerate);
  }

  // ---- History toggle ----
  historyBtn.addEventListener('click', () => {
    historyVisible = !historyVisible;
    if (historyVisible) {
      resultsArea.classList.remove('active');
      processingArea.classList.remove('active');
      historyArea.classList.add('active');
      renderHistory();
      historyBtn.textContent = t('historyBtnClose');
    } else {
      historyArea.classList.remove('active');
      historyBtn.textContent = t('historyBtn');
    }
  });

  // ---- Result rendering (shared by API and local fallback) ----
  function renderResultFromData(result, text, type) {
    type = type || detectType(text);
    var typeInfo = getTypeInfo(type);

    // Store for team sharing and history persistence
    var existingResult = lastResult && lastResult.result ? lastResult.result : null;
    lastResult = { text: text, type: type, tags: result.tags || [] };
    if (existingResult) lastResult.result = existingResult;

    document.getElementById('resultContent').textContent = text;
    document.getElementById('resultTags').innerHTML =
      '<span class="tag-pill type">' + typeInfo.label + '</span>' +
      (result.tags || []).map(function(t) { return '<span class="tag-pill">' + t + '</span>'; }).join('');

    // Show regenerate button when result is rendered
    var regenBtn = document.getElementById('regenerateBtn');
    if (regenBtn) {
      regenBtn.style.display = '';
    }

    // Prompt optimization
    var opt = generatePromptOptimization(text, type, result);
    document.getElementById('optOriginal').textContent = text;
    document.getElementById('optImproved').textContent = opt.improved;
    document.getElementById('optTags').innerHTML = (opt.tags || []).map(function(t) {
      return '<span class="tag">' + t + '</span>';
    }).join('');

    // Material analysis for file/link/search inputs
    var analysisContainer = document.getElementById('analysisContainer');
    if (activeTab === 'file' || activeTab === 'link' || activeTab === 'search') {
      var userInsp = '';
      if (activeTab === 'file') userInsp = (document.getElementById('fileInspirationInput').value || '').trim();
      if (activeTab === 'link') userInsp = (document.getElementById('linkInspirationInput').value || '').trim();
      if (activeTab === 'search') userInsp = (document.getElementById('searchInspirationInput').value || '').trim();

      var analysisMode = activeTab === 'search' ? 'search' : activeTab;
      var analysis = generateMaterialAnalysis(text, analysisMode, userInsp);
      analysisContainer.innerHTML = analysis;

      if (userInsp) {
        var opt2 = generatePromptOptimization(userInsp, type, result);
        document.getElementById('optOriginal').textContent = userInsp;
        document.getElementById('optImproved').textContent = opt2.improved;
        document.getElementById('optTags').innerHTML = (opt2.tags || []).map(function(t) { return '<span class="tag">' + t + '</span>'; }).join('');
        document.getElementById('optimizeCard').style.display = '';
        document.getElementById('optimizeCard').querySelector('h3').textContent = t('optYourOptimization');
      } else {
        document.getElementById('optimizeCard').style.display = 'none';
      }
    } else {
      analysisContainer.innerHTML = '';
      document.getElementById('optimizeCard').style.display = '';
      document.getElementById('optimizeCard').querySelector('h3').textContent = t('optTitle');
    }

    document.getElementById('graphArea').innerHTML = (result.graph || []).map(function(item, i) {
      return i === 0
        ? '<span class="graph-node main">' + item + '</span>'
        : '<span class="graph-arrow">→</span><span class="graph-node related">' + item + '</span>';
    }).join('');

    // Framework-aware card visibility and rendering
    var swotCard = document.getElementById('swotCard');
    var actionCard = document.getElementById('actionCard');
    var timelineCard = document.getElementById('timelineCard');
    var dynCard = document.getElementById('dynamicFrameworkCard');
    var dynTitle = document.getElementById('dynamicFrameworkTitle');
    var dynContent = document.getElementById('dynamicFrameworkContent');

    // Hide all framework-specific cards first
    if (swotCard) swotCard.style.display = 'none';
    if (actionCard) actionCard.style.display = 'none';
    if (timelineCard) timelineCard.style.display = 'none';
    if (dynCard) dynCard.style.display = 'none';

    if (currentFramework === 'swot') {
      if (swotCard) swotCard.style.display = '';
      if (actionCard) actionCard.style.display = '';
      if (timelineCard) timelineCard.style.display = '';
      document.getElementById('swotArea').innerHTML =
        '<div class="swot-item s"><h4>' + t('swotS') + '</h4><ul>' + (result.swot && result.swot.s ? result.swot.s : []).map(function(x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
        '<div class="swot-item w"><h4>' + t('swotW') + '</h4><ul>' + (result.swot && result.swot.w ? result.swot.w : []).map(function(x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
        '<div class="swot-item o"><h4>' + t('swotO') + '</h4><ul>' + (result.swot && result.swot.o ? result.swot.o : []).map(function(x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
        '<div class="swot-item t"><h4>' + t('swotT') + '</h4><ul>' + (result.swot && result.swot.t ? result.swot.t : []).map(function(x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>';
      document.getElementById('actionList').innerHTML = (result.actions || []).map(function(a) {
        var isZ = currentLang === 'zh';
        var pLabel = a.priority === 'high' ? (isZ ? '高优' : 'High') : (a.priority === 'medium' ? (isZ ? '中优' : 'Med') : (isZ ? '低优' : 'Low'));
        return '<li><span class="check" onclick="this.classList.toggle(\'checked\')">✓</span><span class="text">' + a.text + '</span><span class="priority ' + a.priority + '">' + pLabel + '</span></li>';
      }).join('');
      document.getElementById('timelineArea').innerHTML = (result.timeline || []).map(function(t) {
        return '<div class="timeline-item"><div class="time">' + t.time + '</div><div class="task">' + t.task + '</div></div>';
      }).join('');
    } else if (currentFramework === 'lean') {
      if (dynCard) dynCard.style.display = '';
      if (dynTitle) dynTitle.textContent = t('fwLeanTitle');
      var canvas = (result.canvas || {});
      var leanKeys = ['customer_segments','value_proposition','channels','customer_relationships','revenue_streams','key_resources','key_activities','key_partners','cost_structure'];
      var leanLabels = [t('fwLeanCS'),t('fwLeanVP'),t('fwLeanCH'),t('fwLeanCR'),t('fwLeanRS'),t('fwLeanKR'),t('fwLeanKA'),t('fwLeanKP'),t('fwLeanCS2')];
      var html = '<div class="fw-grid fw-grid-3x3">';
      leanKeys.forEach(function(key, i) {
        var items = canvas[key] || [];
        html += '<div class="fw-cell"><h5>' + leanLabels[i] + '</h5><ul>' + items.map(function(x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>';
      });
      html += '</div>';
      if (dynContent) dynContent.innerHTML = html;
    } else if (currentFramework === '4p') {
      if (dynCard) dynCard.style.display = '';
      if (actionCard) actionCard.style.display = '';
      if (timelineCard) timelineCard.style.display = '';
      if (dynTitle) dynTitle.textContent = t('fw4pTitle');
      var m4p = (result.marketing4p || {});
      var pKeys = ['product','price','place','promotion'];
      var pLabels = [t('fw4pProd'),t('fw4pPrice'),t('fw4pPlace'),t('fw4pPromo')];
      var html2 = '<div class="fw-grid fw-grid-2x2">';
      pKeys.forEach(function(key, i) {
        var items = m4p[key] || [];
        html2 += '<div class="fw-cell"><h5>' + pLabels[i] + '</h5><ul>' + items.map(function(x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>';
      });
      html2 += '</div>';
      if (dynContent) dynContent.innerHTML = html2;
      document.getElementById('actionList').innerHTML = (result.actions || []).map(function(a) {
        var isZ = currentLang === 'zh';
        var pLabel = a.priority === 'high' ? (isZ ? '高优' : 'High') : (a.priority === 'medium' ? (isZ ? '中优' : 'Med') : (isZ ? '低优' : 'Low'));
        return '<li><span class="check" onclick="this.classList.toggle(\'checked\')">✓</span><span class="text">' + a.text + '</span><span class="priority ' + a.priority + '">' + pLabel + '</span></li>';
      }).join('');
      document.getElementById('timelineArea').innerHTML = (result.timeline || []).map(function(t) {
        return '<div class="timeline-item"><div class="time">' + t.time + '</div><div class="task">' + t.task + '</div></div>';
      }).join('');
    } else if (currentFramework === 'tech') {
      if (dynCard) dynCard.style.display = '';
      if (actionCard) actionCard.style.display = '';
      if (timelineCard) timelineCard.style.display = '';
      if (dynTitle) dynTitle.textContent = t('fwTechTitle');
      var tech = (result.tech || {});
      var tKeys = ['feasibility','difficulty','risks','tech_stack'];
      var tLabels = [t('fwTechFeas'),t('fwTechDiff'),t('fwTechRisk'),t('fwTechStack')];
      var html3 = '';
      tKeys.forEach(function(key, i) {
        var items = tech[key] || [];
        html3 += '<div class="fw-section"><h4>' + tLabels[i] + '</h4><ul>' + items.map(function(x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>';
      });
      if (dynContent) dynContent.innerHTML = html3;
      document.getElementById('actionList').innerHTML = (result.actions || []).map(function(a) {
        var isZ = currentLang === 'zh';
        var pLabel = a.priority === 'high' ? (isZ ? '高优' : 'High') : (a.priority === 'medium' ? (isZ ? '中优' : 'Med') : (isZ ? '低优' : 'Low'));
        return '<li><span class="check" onclick="this.classList.toggle(\'checked\')">✓</span><span class="text">' + a.text + '</span><span class="priority ' + a.priority + '">' + pLabel + '</span></li>';
      }).join('');
      document.getElementById('timelineArea').innerHTML = (result.timeline || []).map(function(t) {
        return '<div class="timeline-item"><div class="time">' + t.time + '</div><div class="task">' + t.task + '</div></div>';
      }).join('');
    } else if (currentFramework === 'daily') {
      if (dynCard) dynCard.style.display = '';
      if (dynTitle) dynTitle.textContent = t('fwDailyTitle');
      var suggestions = (result.suggestions || []);
      // 如果没有 suggestions，生成本地 fallback
      if (suggestions.length === 0) {
        suggestions = generateDailyFallback(text);
      }
      var finalVerdict = result.final_verdict || (suggestions.length > 0 ? suggestions[0].reason : '');
      var vibeEmojis = ['🌿', '✨', '🌙', '☀️', '🍃', '🎯', '💝', '🌈'];
      var dailyHtml = '<div class="daily-suggestions">';
      suggestions.forEach(function(s, i) {
        var emoji = vibeEmojis[i % vibeEmojis.length];
        dailyHtml += '<div class="daily-suggestion-card">' +
          '<div class="daily-suggestion-header">' +
            '<span class="daily-suggestion-emoji">' + emoji + '</span>' +
            '<span class="daily-suggestion-name">' + escapeHtml(s.name || '选项' + (i+1)) + '</span>' +
          '</div>' +
          '<div class="daily-suggestion-reason">' + escapeHtml(s.reason || '') + '</div>' +
          (s.vibe ? '<div class="daily-suggestion-vibe">💫 ' + escapeHtml(s.vibe) + '</div>' : '') +
        '</div>';
      });
      dailyHtml += '</div>';
      // 最终建议高亮框
      dailyHtml += '<div class="daily-verdict">' +
        '<div class="daily-verdict-label">💡 一句话建议</div>' +
        '<div class="daily-verdict-text">' + escapeHtml(finalVerdict) + '</div>' +
      '</div>';
      if (dynContent) dynContent.innerHTML = dailyHtml;
    }
  }

  function detectType(text) {
    var lower = text.toLowerCase();
    if (lower.includes('app') || lower.includes('应用') || lower.includes('小程序') || lower.includes('平台') || lower.includes('产品')) return 'product';
    if (lower.includes('论文') || lower.includes('研究') || lower.includes('学术') || lower.includes('实验') || lower.includes('科研')) return 'research';
    if (lower.includes('设计') || lower.includes('艺术') || lower.includes('创作') || lower.includes('画') || lower.includes('设计')) return 'art';
    if (lower.includes('商业') || lower.includes('创业') || lower.includes('赚钱') || lower.includes('模式') || lower.includes('市场')) return 'business';
    return 'product';
  }

  function getTypeInfo(type) {
    var map = {
      product: { icon: '🚀', label: t('typeProduct') },
      research: { icon: '🔬', label: t('typeResearch') },
      art: { icon: '🎨', label: t('typeArt') },
      business: { icon: '💼', label: t('typeBusiness') }
    };
    return map[type] || map.product;
  }

  function generatePromptOptimization(text, type, result) {
    var isZ = currentLang === 'zh';
    // Don't optimize very long texts (file/link inputs)
    if (text.length > 300) {
      return {
        improved: text.substring(0, 200) + (isZ ? '...（内容较长，建议分点提炼核心创意）' : '... (Content is long, consider extracting key points)'),
        tags: isZ ? ['内容较长', '建议提炼要点'] : ['Long content', 'Extract key points']
      };
    }

    // Extract core idea from text by removing fluff
    var cleaned = text.trim();
    // Remove common conversational fillers
    if (isZ) {
      cleaned = cleaned.replace(/^(我想|我想要|我想做|打算|计划|考虑|觉得|感觉|有个想法：?)/, '');
    } else {
      cleaned = cleaned.replace(/^(I think|I want|I would like|I'm considering|I feel|I have an idea:?)/i, '');
    }

    var typeInfo = getTypeInfo(type);
    var improved = '';
    var tags = [];

    // Build improved version based on type
    if (type === 'product') {
      improved = isZ
        ? '设计一款 ' + cleaned + '，目标用户为【请补充目标用户】，解决【请补充核心问题】痛点，通过【请补充差异化方式】实现产品价值。'
        : 'Design a ' + cleaned + '. Target users: [please specify], Core problem: [please specify], Differentiation: [please specify].';
      tags = isZ ? ['建议补充目标用户', '建议明确核心功能', '建议定义差异化'] : ['Add target users', 'Clarify core features', 'Define differentiation'];
    } else if (type === 'research') {
      improved = isZ
        ? '研究课题：' + cleaned + '。研究目标：【请补充研究假设】，研究方法：【请补充方法论】，预期成果：【请补充产出形式】。'
        : 'Research topic: ' + cleaned + '. Goal: [please specify hypothesis], Method: [please specify], Expected output: [please specify].';
      tags = isZ ? ['建议明确研究假设', '建议补充方法论', '建议定义预期产出'] : ['Clarify hypothesis', 'Add methodology', 'Define expected output'];
    } else if (type === 'art') {
      improved = isZ
        ? '创作方向：' + cleaned + '。风格定位：【请补充风格参考】，目标受众：【请补充受众】，传播渠道：【请补充发布平台】。'
        : 'Creative direction: ' + cleaned + '. Style: [please specify], Audience: [please specify], Channel: [please specify].';
      tags = isZ ? ['建议补充风格参考', '建议明确目标受众', '建议规划传播渠道'] : ['Add style reference', 'Clarify audience', 'Plan distribution channel'];
    } else if (type === 'business') {
      improved = isZ
        ? '商业构想：' + cleaned + '。目标市场：【请补充市场规模】，盈利模式：【请补充收入来源】，竞争优势：【请补充核心竞争力】。'
        : 'Business idea: ' + cleaned + '. Market: [please specify], Revenue: [please specify], Advantage: [please specify].';
      tags = isZ ? ['建议补充市场分析', '建议明确盈利模式', '建议分析竞争优势'] : ['Add market analysis', 'Clarify revenue model', 'Analyze competitive advantage'];
    } else {
      improved = cleaned;
      tags = isZ ? ['已保持原意', '建议补充更多上下文'] : ['Original meaning kept', 'Add more context'];
    }

    return { improved: improved, tags: tags };
  }

  function generateMaterialAnalysis(text, inputMode, userInsp) {
    var sentences = text.split(/[。！？\n。!?\n]+/).filter(function(s) { return s.trim().length > 5; });
    var wordCount = text.replace(/\s+/g, '').length;
    var lineCount = text.split('\n').length;
    var isZh = currentLang === 'zh';
    var labelMap = { file: isZh ? '文件' : 'File', link: isZh ? '链接' : 'Link', search: isZh ? '搜索' : 'Search' };
    var iconMap = { file: '📎', link: '🔗', search: '🔍' };
    var inputLabel = labelMap[inputMode] || (isZh ? '资料' : 'Material');
    var inputIcon = iconMap[inputMode] || '📄';

    // Detect topics from content
    var topicKeywords = isZh ? {
      'AI/机器学习': ['ai', '人工智能', '机器学习', '深度学习', 'llm', 'gpt', '模型', '算法', 'neural'],
      '产品设计': ['产品', '设计', '用户', '体验', '交互', '界面', 'ux', 'ui', '原型'],
      '科研学术': ['论文', '研究', '实验', '数据', '分析', '假设', '方法', '文献', '引用'],
      '商业模式': ['商业', '市场', '用户', '盈利', '收入', '竞争', '融资', '创业', '增长'],
      '技术开发': ['开发', '代码', '技术', '架构', 'api', '前端', '后端', '部署', '框架'],
      '社会公益': ['社会', '公益', '助老', '健康', '教育', '环保', '可持续', '社区'],
      '创意艺术': ['创意', '创作', '艺术', '视觉', '内容', '媒体', '品牌', '传播']
    } : {
      'AI/Machine Learning': ['ai', 'artificial intelligence', 'machine learning', 'deep learning', 'llm', 'gpt', 'model', 'algorithm', 'neural'],
      'Product Design': ['product', 'design', 'user', 'experience', 'interaction', 'interface', 'ux', 'ui', 'prototype'],
      'Academic Research': ['paper', 'research', 'experiment', 'data', 'analysis', 'hypothesis', 'method', 'literature'],
      'Business Model': ['business', 'market', 'user', 'profit', 'revenue', 'competition', 'funding', 'startup', 'growth'],
      'Technology': ['development', 'code', 'technology', 'architecture', 'api', 'frontend', 'backend', 'deployment', 'framework'],
      'Social Impact': ['social', 'public welfare', 'elderly care', 'health', 'education', 'environment', 'sustainable', 'community'],
      'Creative Arts': ['creative', 'creation', 'art', 'visual', 'content', 'media', 'brand', 'communication']
    };

    var detectedTopics = [];
    var lower = text.toLowerCase();
    for (var topic in topicKeywords) {
      var keywords = topicKeywords[topic];
      var matchCount = 0;
      keywords.forEach(function(kw) {
        if (lower.includes(kw)) matchCount++;
      });
      if (matchCount >= 1) detectedTopics.push({ name: topic, score: matchCount });
    }
    detectedTopics.sort(function(a, b) { return b.score - a.score; });
    var topTopics = detectedTopics.slice(0, 4);

    // Generate highlights from content
    var highlights = [];
    sentences.forEach(function(s) {
      s = s.trim();
      if (s.length > 15 && s.length < 200 && highlights.length < 4) {
        highlights.push(s);
      }
    });
    if (!highlights.length) {
      highlights.push(text.substring(0, 150) + (text.length > 150 ? '...' : ''));
    }

    // Generate keypoints
    var keypoints = [];
    if (topTopics.length) keypoints.push((isZh ? '资料核心主题涵盖：' : 'Core topics: ') + topTopics.map(function(t) { return t.name; }).join(isZh ? '、' : ', '));
    keypoints.push((isZh ? '资料规模：约 ' : 'Size: approx. ') + wordCount + (isZh ? ' 字，' : ' chars, ') + lineCount + (isZh ? ' 个段落' : ' paragraphs'));
    if (sentences.length > 3) keypoints.push((isZh ? '内容结构较为完整，包含 ' : 'Well-structured content with ') + sentences.length + (isZh ? ' 个独立语义段落' : ' semantic sections'));
    if (topTopics.some(function(t) { return t.name.indexOf('AI') >= 0; })) keypoints.push(isZh ? '涉及 AI 相关技术概念，建议关注技术可行性' : 'Covers AI concepts, consider technical feasibility');
    if (topTopics.some(function(t) { return t.name.indexOf(isZh ? '商业' : 'Business') >= 0; })) keypoints.push(isZh ? '包含商业维度信息，可结合市场数据深化分析' : 'Contains business insights, deepen with market data');
    if (topTopics.some(function(t) { return t.name.indexOf(isZh ? '设计' : 'Design') >= 0 || t.name.indexOf(isZh ? '创意' : 'Creative') >= 0; })) keypoints.push(isZh ? '创意方向明确，建议结合目标用户画像进一步细化' : 'Creative direction is clear, refine with user personas');

    // Generate suggestions
    var suggestions = isZh ? [
      { label: '行动', cls: 'action', text: '将资料中的核心观点提炼为 3-5 个关键论点，形成结构化的创意笔记，方便后续检索和关联。' },
      { label: '思考', cls: 'think', text: '思考这份资料与你的现有灵感库中哪些条目存在关联——交叉点往往是最有价值的创新方向。' },
      { label: '探索', cls: 'explore', text: '基于资料中提到的主题，尝试发散思考：如果将其应用到不同领域或场景，会产生什么新的可能性？' }
    ] : [
      { label: 'Action', cls: 'action', text: 'Extract 3-5 core arguments from the material into structured creative notes for future retrieval and association.' },
      { label: 'Think', cls: 'think', text: 'Consider how this material connects with entries in your inspiration library — intersections often reveal the most valuable innovations.' },
      { label: 'Explore', cls: 'explore', text: 'Try divergent thinking based on the themes mentioned: what new possibilities arise if applied to different fields or scenarios?' }
    ];

    // Build HTML
    var html = '';
    var hSummary = t('analysisSummary');
    var hHighlights = t('analysisHighlights');
    var hKeypoints = t('analysisKeypoints');
    var hSuggestions = t('analysisSuggestions');
    var hTopics = t('analysisTopics');
    var hYourInsp = isZh ? '💡 你的灵感想法' : '💡 Your Inspiration';
    var hReport = isZh ? '资料分析报告' : ' Material Analysis';
    var lblWords = isZh ? '总字数' : 'Words';
    var lblSections = isZh ? '核心段落' : 'Sections';
    var lblTopics = isZh ? '主题领域' : 'Topics';
    var aiNote = isZh ? 'AI 已将你的灵感与上述资料内容进行综合分析，并结合你的想法生成了下方的行动建议和执行时间线。' : 'AI has comprehensively analyzed your inspiration with the above material and generated action suggestions and timelines below.';

    // Stats bar
    html += '<div class="analysis-card">';
    html += '<h3>' + inputIcon + ' ' + inputLabel + hReport + '</h3>';
    html += '<div class="analysis-stats">';
    html += '<div class="analysis-stat"><div class="val">' + wordCount + '</div><div class="lbl">' + lblWords + '</div></div>';
    html += '<div class="analysis-stat"><div class="val">' + sentences.length + '</div><div class="lbl">' + lblSections + '</div></div>';
    html += '<div class="analysis-stat"><div class="val">' + topTopics.length + '</div><div class="lbl">' + lblTopics + '</div></div>';
    html += '</div>';

    // Summary
    html += '<div class="analysis-section">';
    html += '<h4>' + hSummary + '</h4>';
    html += '<p>' + (isZh ? '该' : 'This ') + inputLabel + (isZh ? '资料共约 ' : ' contains approx. ') + wordCount + (isZh ? ' 字，主要涉及' : ' chars, mainly covering') + (topTopics.length ? ' <strong style="color:var(--accent)">' + topTopics.map(function(t) { return t.name; }).join(isZh ? '、' : ', ') + '</strong> ' : (isZh ? '多个主题领域' : ' multiple topics')) + '。';
    if (sentences.length > 2) {
      html += (isZh ? '内容结构清晰，包含 ' : 'Clear structure with ') + sentences.length + (isZh ? ' 个独立语义段落，覆盖面较广。' : ' semantic sections, covering a wide range.');
    }
    html += '</p></div>';

    // Highlights
    html += '<div class="analysis-section">';
    html += '<h4>' + hHighlights + '</h4>';
    highlights.forEach(function(h, i) {
      var cls = i === 0 ? ' gold' : (i === 1 ? ' purple' : '');
      html += '<div class="highlight-item' + cls + '">' + h + '</div>';
    });
    html += '</div>';

    // Key points
    html += '<div class="analysis-section">';
    html += '<h4>' + hKeypoints + '</h4>';
    keypoints.forEach(function(kp, i) {
      html += '<div class="keypoint-item"><span class="kp-num">' + (i + 1) + '</span><span>' + kp + '</span></div>';
    });
    html += '</div>';

    // Suggestions
    html += '<div class="analysis-section">';
    html += '<h4>' + hSuggestions + '</h4>';
    suggestions.forEach(function(sg) {
      html += '<div class="suggestion-item"><span class="sg-label ' + sg.cls + '">' + sg.label + '</span>' + sg.text + '</div>';
    });
    html += '</div>';

    // Topic tags
    if (topTopics.length) {
      html += '<div style="margin-top:1rem;display:flex;flex-wrap:wrap;gap:0.4rem;">';
      topTopics.forEach(function(t) {
        html += '<span class="tag-pill">' + t.name + '</span>';
      });
      html += '</div>';
    }

    // If user also wrote their own inspiration, highlight it
    if (userInsp) {
      html += '<div class="analysis-section" style="margin-top:1.2rem;">';
      html += '<h4>' + hYourInsp + '</h4>';
      html += '<div class="highlight-item gold" style="font-size:0.92rem;line-height:1.7;">' + userInsp + '</div>';
      html += '<p style="margin-top:0.6rem;font-size:0.82rem;color:var(--muted);">' + aiNote + '</p>';
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function generateByType(text, type) {
    var zhTemplates = {
      product: {
        typeName: t('typeProduct'), tags: ['互联网产品', '用户体验', 'AI赋能'],
        graph: ['灵感输入', '需求分析', '竞品调研', '原型设计', '开发迭代'],
        swot: { s: ['切中真实痛点', 'AI技术加持', '多端可扩展'], w: ['初期用户获取难', '需要持续迭代'], o: ['AI工具市场快速增长', '远程协作需求旺盛'], t: ['大厂同类产品竞争', '用户习惯培养周期'] },
        actions: [
          { text: '明确核心用户画像，锁定首批种子用户', priority: 'high' },
          { text: '制作低保真原型，进行5-10人用户访谈', priority: 'high' },
          { text: '调研3-5款竞品，分析差异化优势', priority: 'high' },
          { text: '确定技术栈，搭建MVP最小可行产品', priority: 'medium' },
          { text: '制定产品路线图，规划V1.0功能清单', priority: 'medium' },
          { text: '设计早期用户增长策略和冷启动方案', priority: 'low' }
        ],
        timeline: [
          { time: '第1周', task: '完成用户调研和竞品分析' },
          { time: '第2-3周', task: '设计产品原型和交互流程' },
          { time: '第4-6周', task: '开发MVP核心功能' },
          { time: '第7周', task: '内部测试和快速迭代' },
          { time: '第8周', task: '小范围内测，收集反馈' }
        ]
      },
      research: {
        typeName: t('typeResearch'), tags: ['科研方法', '学术创新', '知识管理'],
        graph: ['灵感输入', '文献检索', '假设构建', '实验设计', '论文撰写'],
        swot: { s: ['选题新颖有创新性', '研究方法成熟', '导师资源丰富'], w: ['实验周期较长', '数据收集难度大'], o: ['AI辅助科研工具兴起', '跨学科合作机会多'], t: ['同类研究竞争激烈', '期刊审稿周期长'] },
        actions: [
          { text: '系统检索相关文献，撰写文献综述', priority: 'high' },
          { text: '明确研究假设和创新点', priority: 'high' },
          { text: '设计实验方案，确定数据来源', priority: 'high' },
          { text: '联系潜在合作者和导师讨论', priority: 'medium' },
          { text: '制定论文写作计划和时间表', priority: 'medium' },
          { text: '准备开题报告和答辩材料', priority: 'low' }
        ],
        timeline: [
          { time: '第1-2周', task: '文献调研和综述撰写' },
          { time: '第3周', task: '确定研究假设和方法论' },
          { time: '第4-8周', task: '数据收集和实验开展' },
          { time: '第9-10周', task: '数据分析与结果整理' },
          { time: '第11-12周', task: '论文撰写和修改' }
        ]
      },
      art: {
        typeName: t('typeArt'), tags: ['视觉设计', '创意表达', '用户体验'],
        graph: ['灵感输入', '风格探索', '草图创作', '视觉呈现', '作品发布'],
        swot: { s: ['独特的创意视角', '技术实现能力强', '作品风格鲜明'], w: ['创作周期不可控', '审美主观性强'], o: ['社交媒体传播渠道多', '数字艺术市场兴起'], t: ['版权保护困难', '同质化作品泛滥'] },
        actions: [
          { text: '创建情绪板，收集参考素材', priority: 'high' },
          { text: '绘制3-5个草图方案，确定方向', priority: 'high' },
          { text: '确定配色方案和视觉风格', priority: 'high' },
          { text: '制作高保真设计稿', priority: 'medium' },
          { text: '收集反馈并迭代优化', priority: 'medium' },
          { text: '选择合适的平台和时机发布', priority: 'low' }
        ],
        timeline: [
          { time: '第1周', task: '灵感收集和风格定位' },
          { time: '第2周', task: '草图创作和方案筛选' },
          { time: '第3-4周', task: '视觉设计和细节打磨' },
          { time: '第5周', task: '用户测试和反馈收集' },
          { time: '第6周', task: '最终修改和作品发布' }
        ]
      },
      business: {
        typeName: t('typeBusiness'), tags: ['商业创新', '市场机会', '可行性分析'],
        graph: ['灵感输入', '市场调研', '商业模式', '财务预测', '落地执行'],
        swot: { s: ['市场需求明确', '团队执行力强', '资源整合能力好'], w: ['初期资金有限', '品牌知名度低'], o: ['政策扶持创业', '行业数字化转型加速'], t: ['市场竞争激烈', '经济环境不确定性'] },
        actions: [
          { text: '完成市场规模和竞品分析', priority: 'high' },
          { text: '明确核心商业模式和盈利方式', priority: 'high' },
          { text: '制作商业计划书（BP）', priority: 'high' },
          { text: '寻找潜在合作伙伴或投资人', priority: 'medium' },
          { text: '搭建最小可行产品验证市场', priority: 'medium' },
          { text: '制定3个月运营和增长计划', priority: 'low' }
        ],
        timeline: [
          { time: '第1-2周', task: '市场调研和商业模式设计' },
          { time: '第3周', task: '完成商业计划书初稿' },
          { time: '第4-5周', task: '寻求导师/投资人反馈' },
          { time: '第6-8周', task: 'MVP开发和早期验证' },
          { time: '第9-10周', task: '迭代优化和正式推广' }
        ]
      }
    };
    var enTemplates = {
      product: {
        typeName: t('typeProduct'), tags: ['Internet Product', 'User Experience', 'AI Powered'],
        graph: ['Idea Input', 'Needs Analysis', 'Competitor Research', 'Prototyping', 'Development'],
        swot: { s: ['Solves real pain points', 'AI-enhanced', 'Cross-platform scalable'], w: ['Hard to acquire early users', 'Requires continuous iteration'], o: ['Rapid growth of AI tools market', 'Strong demand for remote collaboration'], t: ['Competition from big tech', 'User habit formation takes time'] },
        actions: [
          { text: 'Define core user persona and lock in first seed users', priority: 'high' },
          { text: 'Create low-fidelity prototype and conduct 5-10 user interviews', priority: 'high' },
          { text: 'Research 3-5 competitors and analyze differentiation', priority: 'high' },
          { text: 'Choose tech stack and build MVP', priority: 'medium' },
          { text: 'Create product roadmap and plan V1.0 features', priority: 'medium' },
          { text: 'Design early user growth strategy and cold-start plan', priority: 'low' }
        ],
        timeline: [
          { time: 'Week 1', task: 'Complete user research and competitor analysis' },
          { time: 'Week 2-3', task: 'Design product prototype and interaction flow' },
          { time: 'Week 4-6', task: 'Develop MVP core features' },
          { time: 'Week 7', task: 'Internal testing and rapid iteration' },
          { time: 'Week 8', task: 'Closed beta and feedback collection' }
        ]
      },
      research: {
        typeName: t('typeResearch'), tags: ['Research Method', 'Academic Innovation', 'Knowledge Management'],
        graph: ['Idea Input', 'Literature Review', 'Hypothesis', 'Experiment Design', 'Paper Writing'],
        swot: { s: ['Novel and innovative topic', 'Mature research methods', 'Rich mentor resources'], w: ['Long experiment cycles', 'Difficult data collection'], o: ['Rise of AI-assisted research tools', 'Opportunities for interdisciplinary collaboration'], t: ['Intense competition in similar research', 'Long journal review cycles'] },
        actions: [
          { text: 'Systematically review literature and write literature review', priority: 'high' },
          { text: 'Clarify research hypothesis and innovation points', priority: 'high' },
          { text: 'Design experiment scheme and determine data sources', priority: 'high' },
          { text: 'Contact potential collaborators and mentors for discussion', priority: 'medium' },
          { text: 'Create paper writing plan and schedule', priority: 'medium' },
          { text: 'Prepare proposal report and defense materials', priority: 'low' }
        ],
        timeline: [
          { time: 'Week 1-2', task: 'Literature review and writing' },
          { time: 'Week 3', task: 'Finalize research hypothesis and methodology' },
          { time: 'Week 4-8', task: 'Data collection and experiments' },
          { time: 'Week 9-10', task: 'Data analysis and result organization' },
          { time: 'Week 11-12', task: 'Paper writing and revision' }
        ]
      },
      art: {
        typeName: t('typeArt'), tags: ['Visual Design', 'Creative Expression', 'User Experience'],
        graph: ['Idea Input', 'Style Exploration', 'Sketching', 'Visual Design', 'Release'],
        swot: { s: ['Unique creative perspective', 'Strong technical skills', 'Distinctive style'], w: ['Unpredictable creation cycles', 'Subjective aesthetics'], o: ['Many social media channels', 'Rising digital art market'], t: ['Difficult copyright protection', 'Homogenized works flooding market'] },
        actions: [
          { text: 'Create mood board and collect reference materials', priority: 'high' },
          { text: 'Draw 3-5 sketch proposals and determine direction', priority: 'high' },
          { text: 'Determine color scheme and visual style', priority: 'high' },
          { text: 'Create high-fidelity design drafts', priority: 'medium' },
          { text: 'Collect feedback and iterate', priority: 'medium' },
          { text: 'Choose appropriate platform and timing for release', priority: 'low' }
        ],
        timeline: [
          { time: 'Week 1', task: 'Inspiration collection and style positioning' },
          { time: 'Week 2', task: 'Sketch creation and proposal screening' },
          { time: 'Week 3-4', task: 'Visual design and detail polishing' },
          { time: 'Week 5', task: 'User testing and feedback collection' },
          { time: 'Week 6', task: 'Final revision and work release' }
        ]
      },
      business: {
        typeName: t('typeBusiness'), tags: ['Business Innovation', 'Market Opportunity', 'Feasibility'],
        graph: ['Idea Input', 'Market Research', 'Business Model', 'Financial Forecast', 'Execution'],
        swot: { s: ['Clear market demand', 'Strong team execution', 'Good resource integration'], w: ['Limited initial capital', 'Low brand awareness'], o: ['Policy support for entrepreneurship', 'Accelerating industry digital transformation'], t: ['Intense market competition', 'Economic uncertainty'] },
        actions: [
          { text: 'Complete market size and competitor analysis', priority: 'high' },
          { text: 'Clarify core business model and revenue streams', priority: 'high' },
          { text: 'Create business plan (BP)', priority: 'high' },
          { text: 'Find potential partners or investors', priority: 'medium' },
          { text: 'Build MVP to validate market', priority: 'medium' },
          { text: 'Create 3-month operations and growth plan', priority: 'low' }
        ],
        timeline: [
          { time: 'Week 1-2', task: 'Market research and business model design' },
          { time: 'Week 3', task: 'Complete first draft of business plan' },
          { time: 'Week 4-5', task: 'Seek mentor/investor feedback' },
          { time: 'Week 6-8', task: 'MVP development and early validation' },
          { time: 'Week 9-10', task: 'Iteration and official promotion' }
        ]
      }
    };
    var useEn = currentLang !== 'zh' && i18n[currentLang] && i18n[currentLang].typeProduct;
    var templates = useEn ? enTemplates : zhTemplates;
    var result = JSON.parse(JSON.stringify(templates[type] || templates.product));

    // 收集上下文信息用于增强 fallback 模板
    var contextInfo = collectContextInfo(text, type);

    // 动态差异化：根据用户输入的关键词，个性化注入到 actions 和 timeline
    try {
      var keywords = extractKeywords(text, type);
      if (keywords && keywords.length > 0) {
        var mainKeyword = keywords[0];
        var secondKeyword = keywords[1] || mainKeyword;

        // 个性化 actions：将前 2-3 条替换为包含关键词的定制化建议
        if (result.actions && result.actions.length > 0) {
          var customActions = generateCustomActions(mainKeyword, secondKeyword, type, useEn);
          // 替换前 2 条为定制化内容
          for (var i = 0; i < Math.min(customActions.length, 2); i++) {
            if (result.actions[i]) {
              result.actions[i].text = customActions[i].text;
              result.actions[i].priority = customActions[i].priority;
            }
          }
        }

        // 个性化 timeline：将第 1-2 个阶段替换为包含关键词的定制化描述
        if (result.timeline && result.timeline.length > 0) {
          var customTimeline = generateCustomTimeline(mainKeyword, type, useEn);
          for (var j = 0; j < Math.min(customTimeline.length, 2); j++) {
            if (result.timeline[j]) {
              result.timeline[j].task = customTimeline[j].task;
            }
          }
        }

        // 个性化 tags：注入关键词相关的标签
        if (result.tags && result.tags.length > 0) {
          result.tags.unshift(mainKeyword);
          if (result.tags.length > 5) result.tags = result.tags.slice(0, 5);
        }

        // 个性化 SWOT：将每条的前 1 条替换为包含关键词的定制化内容
        if (result.swot && result.swot.s && result.swot.s.length > 0) {
          var customSwot = generateCustomSwot(mainKeyword, type, useEn);
          if (customSwot.s && result.swot.s[0]) result.swot.s[0] = customSwot.s;
          if (customSwot.w && result.swot.w[0]) result.swot.w[0] = customSwot.w;
          if (customSwot.o && result.swot.o[0]) result.swot.o[0] = customSwot.o;
          if (customSwot.t && result.swot.t[0]) result.swot.t[0] = customSwot.t;
        }

        // 个性化 graph：替换前 2 个节点为关键词相关内容
        if (result.graph && result.graph.length > 0) {
          var customGraph = generateCustomGraph(mainKeyword, secondKeyword, type, useEn);
          for (var g = 0; g < Math.min(customGraph.length, 2); g++) {
            if (result.graph[g]) result.graph[g] = customGraph[g];
          }
        }
      }
    } catch (e) {
      // 出错则静默失败，回退到原始模板
    }

    // 增强版：基于上下文信息（搜索结果/文件/历史）进一步差异化
    try {
      enrichWithContext(result, contextInfo, type, useEn);
    } catch (e) {
      // 静默失败
    }

    return result;
  }

  // 收集上下文信息（搜索结果、文件内容、历史记录）
  function collectContextInfo(text, type) {
    var info = { searchResults: [], fileContents: [], relatedHistory: [], keywords: [] };

    // 1. 搜索结果（仅 search tab 下有选中时）
    try {
      if (typeof selectedSearchResults !== 'undefined' && selectedSearchResults && selectedSearchResults.length > 0) {
        info.searchResults = selectedSearchResults.slice(0, 3).map(function(r) {
          return { title: r.title, desc: r.desc, type: r.type };
        });
      }
    } catch (e) {}

    // 2. 上传文件内容（仅 file tab 下有上传时）
    try {
      if (typeof uploadedFiles !== 'undefined' && uploadedFiles && uploadedFiles.length > 0) {
        info.fileContents = uploadedFiles.slice(0, 2).map(function(f) {
          return { name: f.name, content: (f.content || '').substring(0, 500) };
        });
      }
    } catch (e) {}

    // 3. 相关历史记录（语义相近的）
    try {
      if (typeof history !== 'undefined' && history && history.length > 0) {
        var currentKws = extractSimpleKeywords(text);
        info.keywords = currentKws;
        var scored = history.map(function(item, idx) {
          if (item.full === text) return { idx: idx, score: -1 };
          var itemKws = extractSimpleKeywords(item.full);
          var overlap = currentKws.filter(function(kw) {
            return itemKws.some(function(ikw) {
              return ikw === kw || ikw.includes(kw) || kw.includes(ikw);
            });
          }).length;
          return { idx: idx, score: overlap / Math.max(currentKws.length, 1) };
        }).filter(function(x) { return x.score > 0.15; })
          .sort(function(a, b) { return b.score - a.score; })
          .slice(0, 2);

        info.relatedHistory = scored.map(function(s) {
          return { text: history[s.idx].text, full: history[s.idx].full, type: history[s.idx].type };
        });
      }
    } catch (e) {}

    return info;
  }

  // 基于上下文信息增强模板内容
  function enrichWithContext(result, context, type, useEn) {
    var hasContext = context.searchResults.length > 0 || context.fileContents.length > 0 || context.relatedHistory.length > 0;
    if (!hasContext) return;

    var isZh = !useEn;

    // 从搜索结果中提取关键词注入 tags
    if (context.searchResults.length > 0 && result.tags) {
      context.searchResults.forEach(function(sr) {
        var srKws = extractSimpleKeywords(sr.title + ' ' + sr.desc);
        srKws.slice(0, 2).forEach(function(kw) {
          if (result.tags.indexOf(kw) === -1 && kw.length >= 2) {
            result.tags.push(kw);
          }
        });
      });
      if (result.tags.length > 6) result.tags = result.tags.slice(0, 6);
    }

    // 从文件内容增强 SWOT 分析
    if (context.fileContents.length > 0 && result.swot) {
      var fileKw = [];
      context.fileContents.forEach(function(f) {
        var kws = extractSimpleKeywords(f.content);
        fileKw = fileKw.concat(kws.slice(0, 3));
      });
      fileKw = [...new Set(fileKw)].slice(0, 3);

      if (fileKw.length > 0) {
        var kwStr = fileKw.join('、');
        if (result.swot.s && result.swot.s.length > 0) {
          result.swot.s[0] = isZh
            ? ('基于【' + context.fileContents[0].name + '】的' + kwStr + '领域深度积累')
            : ('Deep expertise in ' + kwStr + ' based on [' + context.fileContents[0].name + ']');
        }
        if (result.swot.o && result.swot.o.length > 0) {
          result.swot.o[0] = isZh
            ? ('文件资料中提及的' + kwStr + '方向存在市场空白')
            : ('Market gap in ' + kwStr + ' direction mentioned in materials');
        }
      }
    }

    // 从相关历史记录增强行动建议
    if (context.relatedHistory.length > 0 && result.actions) {
      var relatedText = context.relatedHistory[0].text;
      if (result.actions.length >= 3) {
        // 在第3条位置插入参考历史灵感的建议
        var referenceAction = isZh
          ? { text: '参考历史灵感「' + relatedText.substring(0, 20) + '」的经验教训', priority: 'medium' }
          : { text: 'Learn from historical inspiration: "' + relatedText.substring(0, 30) + '"', priority: 'medium' };
        result.actions.splice(2, 0, referenceAction);
        if (result.actions.length > 6) result.actions = result.actions.slice(0, 6);
      }
    }

    // 从搜索结果增强知识图谱
    if (context.searchResults.length > 0 && result.graph && result.graph.length >= 3) {
      // 在图谱中间插入搜索相关的节点
      var searchKws = [];
      context.searchResults.forEach(function(sr) {
        var kws = extractSimpleKeywords(sr.title);
        searchKws = searchKws.concat(kws.slice(0, 1));
      });
      searchKws = [...new Set(searchKws)].slice(0, 2);
      if (searchKws.length > 0) {
        // 替换图谱中的中间节点
        for (var i = 1; i < Math.min(result.graph.length - 1, 1 + searchKws.length); i++) {
          if (searchKws[i - 1]) {
            result.graph[i] = searchKws[i - 1];
          }
        }
      }
    }

    // 标记为上下文增强
    result._contextEnriched = true;
    result._contextSources = [];
    if (context.searchResults.length > 0) result._contextSources.push(isZh ? '搜索结果' : 'Search');
    if (context.fileContents.length > 0) result._contextSources.push(isZh ? '文件资料' : 'Files');
    if (context.relatedHistory.length > 0) result._contextSources.push(isZh ? '历史灵感' : 'History');
  }

  // 从用户输入中提取核心关键词
  function extractKeywords(text, type) {
    if (!text) return [];
    var cleaned = text.trim();
    if (!cleaned) return [];

    // 简单的关键词提取：
    // 1. 移除常见停用词，取有意义的词
    var stopWords = ['的', '了', '和', '是', '在', '我', '有', '和', '与', '及', '等', '也', '都', '就', '一个', '一种', '可以', '能够', '做', '想', '要', '会', '能', 'this', 'the', 'a', 'an', 'is', 'are', 'to', 'of', 'and', 'or', 'for', 'with', 'on', 'in', 'at', 'by', 'from', 'to'];
    var words = [];

    // 中文：按常见分隔符拆分，取较长的片段
    var segments = cleaned.split(/[，。！？、；：""''（）\s,.!?;:"'()\[\]【】]+/).filter(function(s) { return s.length >= 2; });

    // 优先取包含领域相关的词
    var domainKeywords = [];
    var domainHints = {
      product: ['APP', '应用', '产品', '平台', '工具', '软件', '小程序', '网站', '系统', '平台'],
      research: ['研究', '论文', '实验', '算法', '模型', '方法', '分析', '数据'],
      art: ['设计', '艺术', '插画', 'UI', '视觉', '创意', '品牌', '海报'],
      business: ['创业', '商业', '项目', '市场', '品牌', '盈利', '融资', 'BP']
    };

    for (var i = 0; i < segments.length; i++) {
      var seg = segments[i];
      if (stopWords.indexOf(seg.toLowerCase()) === -1 && seg.length >= 2) {
        words.push(seg);
      }
    }

    // 如果没有提取到，取前 10 个字符作为关键词
    if (words.length === 0) {
      words.push(cleaned.substring(0, 10));
    }

    // 返回前 2 个关键词
    return words.slice(0, 2);
  }

  // 根据关键词生成定制化行动建议
  function generateCustomActions(keyword, keyword2, type, useEn) {
    var kw = keyword || '灵感主题';
    if (useEn) {
      // 英文模板
      var enMap = {
        product: [
          { text: 'Conduct user interviews with 10+ potential users of ' + kw + ' to validate demand', priority: 'high' },
          { text: 'Research 3-5 direct competitors in the ' + kw + ' space and map out key differences', priority: 'high' },
          { text: 'Define core feature list for ' + kw + ' MVP and prioritize by user value', priority: 'high' }
        ],
        research: [
          { text: 'Search and review 20+ papers on ' + kw + ' to identify research gaps', priority: 'high' },
          { text: 'Formulate clear research questions and hypotheses about ' + kw, priority: 'high' },
          { text: 'Design experimental framework for ' + kw + ' study with measurable indicators', priority: 'high' }
        ],
        art: [
          { text: 'Collect 50+ reference images related to ' + kw + ' and build a mood board', priority: 'high' },
          { text: 'Sketch 3 different style directions for ' + kw + ' theme', priority: 'high' },
          { text: 'Define color palette and typography for ' + kw + ' visual identity', priority: 'high' }
        ],
        business: [
          { text: 'Research market size and growth trends of ' + kw + ' industry', priority: 'high' },
          { text: 'Identify target customer segments for ' + kw + ' and estimate willingness to pay', priority: 'high' },
          { text: 'Design core business model canvas for ' + kw + ' venture', priority: 'high' }
        ]
      };
      return enMap[type] || enMap.product;
    } else {
      // 中文模板
      var zhMap = {
        product: [
          { text: '访谈10位以上' + kw + '的潜在用户，验证需求真实性', priority: 'high' },
          { text: '调研3-5款' + kw + '领域的直接竞品，梳理差异化优势', priority: 'high' },
          { text: '梳理' + kw + '的核心功能列表，按用户价值排序', priority: 'high' }
        ],
        research: [
          { text: '检索并阅读20篇以上' + kw + '相关文献，找出研究空白', priority: 'high' },
          { text: '明确' + kw + '的研究问题和核心假设', priority: 'high' },
          { text: '设计' + kw + '研究的实验方案和可量化指标', priority: 'high' }
        ],
        art: [
          { text: '收集50张以上' + kw + '相关参考图，建立情绪板', priority: 'high' },
          { text: '绘制3种不同风格的' + kw + '主题草图', priority: 'high' },
          { text: '确定' + kw + '视觉风格的配色方案和字体选择', priority: 'high' }
        ],
        business: [
          { text: '调研' + kw + '行业的市场规模和增长趋势', priority: 'high' },
          { text: '明确' + kw + '的目标客户群体和付费意愿分析', priority: 'high' },
          { text: '设计' + kw + '项目的核心商业模式画布', priority: 'high' }
        ]
      };
      return zhMap[type] || zhMap.product;
    }
  }

  // 根据关键词生成定制化时间线
  function generateCustomTimeline(keyword, type, useEn) {
    var kw = keyword || '灵感主题';
    if (useEn) {
      var enMap = {
        product: [
          { time: 'Week 1', task: 'User research and needs validation for ' + kw },
          { time: 'Week 2-3', task: 'Define ' + kw + ' product positioning and core features' }
        ],
        research: [
          { time: 'Week 1-2', task: 'Literature review on ' + kw + ' and problem definition' },
          { time: 'Week 3', task: 'Research design for ' + kw + ' study' }
        ],
        art: [
          { time: 'Day 1-3', task: kw + ' theme research and style exploration' },
          { time: 'Day 4-7', task: kw + ' sketch creation and direction finalization' }
        ],
        business: [
          { time: 'Week 1-2', task: kw + ' market research and opportunity analysis' },
          { time: 'Week 3', task: 'Business model design for ' + kw + ' venture' }
        ]
      };
      return enMap[type] || enMap.product;
    } else {
      var zhMap = {
        product: [
          { time: '第1周', task: kw + '用户调研与需求验证' },
          { time: '第2-3周', task: kw + '产品定位与核心功能定义' }
        ],
        research: [
          { time: '第1-2周', task: kw + '相关文献综述与问题定义' },
          { time: '第3周', task: kw + '研究方案设计与方法论确定' }
        ],
        art: [
          { time: '第1-3天', task: kw + '主题调研与风格探索' },
          { time: '第4-7天', task: kw + '草图创作与方向确定' }
        ],
        business: [
          { time: '第1-2周', task: kw + '市场调研与机会分析' },
          { time: '第3周', task: kw + '商业模式设计与验证思路' }
        ]
      };
      return zhMap[type] || zhMap.product;
    }
  }

  // 根据关键词生成定制化 SWOT（每条维度的第 1 条）
  function generateCustomSwot(keyword, type, useEn) {
    var kw = keyword || '灵感主题';
    if (useEn) {
      var enMap = {
        product: {
          s: kw + ' concept addresses a clear user need with unique positioning',
          w: 'Initial ' + kw + ' MVP may lack depth and require rapid iteration',
          o: kw + ' market is growing rapidly with rising user expectations',
          t: 'Existing players may enter ' + kw + ' space with stronger resources'
        },
        research: {
          s: kw + ' research topic has clear academic value and novelty',
          w: 'Current understanding of ' + kw + ' may be insufficient for breakthrough',
          o: kw + ' field is trending with increasing funding and publications',
          t: 'Multiple research groups may be competing on similar ' + kw + ' topics'
        },
        art: {
          s: kw + ' theme has strong visual appeal and emotional resonance',
          w: 'Initial ' + kw + ' style may need refinement to stand out',
          o: kw + ' aesthetic is gaining popularity across platforms',
          t: 'Many creators are exploring similar ' + kw + ' visual directions'
        },
        business: {
          s: kw + ' business idea targets a large and underserved market',
          w: kw + ' business model needs validation before scaling',
          o: kw + ' industry is experiencing strong growth and investor interest',
          t: 'Established companies may expand into ' + kw + ' market'
        }
      };
      return enMap[type] || enMap.product;
    } else {
      var zhMap = {
        product: {
          s: kw + '概念切中了明确的用户需求，定位独特',
          w: kw + '初期 MVP 功能深度可能不足，需要快速迭代完善',
          o: kw + '市场处于快速增长期，用户需求持续升级',
          t: kw + '领域已有玩家可能凭借资源优势快速跟进'
        },
        research: {
          s: kw + '研究选题具有明确的学术价值和创新性',
          w: '目前对' + kw + '的理解深度可能不足以支撑突破性进展',
          o: kw + '领域研究热度持续上升，经费和论文产出增长快',
          t: '多个研究团队可能在' + kw + '方向上存在竞争关系'
        },
        art: {
          s: kw + '主题视觉表现力强，容易引发情感共鸣',
          w: kw + '初期风格定位需要进一步打磨才能形成记忆点',
          o: kw + '风格在各平台热度持续上升，受众接受度高',
          t: kw + '方向已有大量创作者探索，差异化难度增加'
        },
        business: {
          s: kw + '商业模式瞄准了规模大且未被充分满足的市场',
          w: kw + '商业模式尚未经过充分验证，规模化前需要验证',
          o: kw + '行业处于高速增长期，资本关注度高',
          t: kw + '市场可能吸引成熟企业跨界进入竞争'
        }
      };
      return zhMap[type] || zhMap.product;
    }
  }

  // 根据关键词生成定制化知识图谱节点
  function generateCustomGraph(keyword, keyword2, type, useEn) {
    var kw = keyword || '灵感主题';
    var kw2 = keyword2 || kw;
    if (useEn) {
      var enMap = {
        product: [kw, kw2 + ' MVP', 'User Validation', 'Growth Strategy', 'Monetization'],
        research: [kw, 'Literature Review', 'Hypothesis Design', 'Experiments', 'Publication'],
        art: [kw, 'Style Exploration', 'Sketch Drafts', 'Color Palette', 'Final Work'],
        business: [kw, 'Market Analysis', 'Business Model', 'Team Building', 'Funding']
      };
      return enMap[type] || enMap.product;
    } else {
      var zhMap = {
        product: [kw, kw2 + ' MVP', '用户验证', '增长策略', '商业化'],
        research: [kw, '文献综述', '假设设计', '实验验证', '论文发表'],
        art: [kw, '风格探索', '草图创作', '配色方案', '成品输出'],
        business: [kw, '市场分析', '商业模式', '团队搭建', '融资规划']
      };
      return zhMap[type] || zhMap.product;
    }
  }

  // History management
  var historyFilter = 'all';

  function saveToHistory(text, type, updateLast) {
    type = type || detectType(text);
    var typeInfo = getTypeInfo(type);
    var entry = {
      text: text.substring(0, 80) + (text.length > 80 ? '...' : ''),
      time: new Date().toLocaleString('zh-CN'),
      full: text,
      type: type,
      typeIcon: typeInfo.icon,
      typeName: typeInfo.label
    };
    // Save full analysis result if available
    if (lastResult && lastResult.result) {
      var r = lastResult.result;
      // Ensure result has all required fields; otherwise regenerate
      var hasGraph = r.graph && r.graph.length;
      var hasSwot = r.swot && r.swot.s && r.swot.s.length && r.swot.w && r.swot.w.length;
      var hasActions = r.actions && r.actions.length;
      var hasTimeline = r.timeline && r.timeline.length;
      if (hasGraph && hasSwot && hasActions && hasTimeline) {
        entry.result = r;
      } else {
        entry.result = generateByType(text, type);
      }
    }

    // updateLast 模式：更新最新一条历史记录而非新增
    if (updateLast && history.length > 0) {
      // 找到最近一条匹配的记录（full 文本相同）并更新
      var updated = false;
      for (var i = 0; i < history.length; i++) {
        if (history[i].full === text) {
          history[i].result = entry.result;
          history[i].time = entry.time;
          history[i].type = entry.type;
          history[i].typeIcon = entry.typeIcon;
          history[i].typeName = entry.typeName;
          updated = true;
          break;
        }
      }
      // 如果没找到匹配的，还是新增
      if (!updated) {
        history.unshift(entry);
      }
    } else {
      // 正常模式：新增一条
      history.unshift(entry);
    }

    if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
    saveHistory();
  }

  // ---- Daily Framework Fallback Generator ----
  function generateDailyFallback(text) {
    var lower = text.toLowerCase();
    var isZh = currentLang === 'zh';
    var suggestions = [];

    // 美食相关
    if (lower.includes('吃') || lower.includes('饭') || lower.includes('餐') || lower.includes('美食') || lower.includes('eat') || lower.includes('food')) {
      if (isZh) {
        suggestions = [
          { name: '暖胃汤面', reason: '热腾腾的汤面，吸溜一口从喉咙暖到胃里，适合阴天或没胃口的时候', vibe: '治愈系 / 暖胃' },
          { name: '清爽沙拉', reason: '轻食无负担，搭配牛油果和鸡胸肉，吃完下午不犯困', vibe: '清爽 / 低卡' },
          { name: '麻辣香锅', reason: '重口味爱好者首选，荤素搭配一锅端，配冰饮绝了', vibe: '过瘾 / 聚餐' },
          { name: '家常炒饭', reason: '简单快手，剩饭变宝，加个煎蛋就是完美一餐', vibe: '便利 / 怀旧' }
        ];
      } else {
        suggestions = [
          { name: 'Warm Soup Noodles', reason: 'Hot, steamy noodles that warm you from throat to stomach, perfect for cloudy days', vibe: 'Comforting / Cozy' },
          { name: 'Fresh Salad', reason: 'Light and clean, with avocado and chicken, no afternoon slump', vibe: 'Fresh / Low-cal' },
          { name: 'Spicy Stir-fry', reason: 'Bold flavors, meat and veggies in one pot, pair with iced drink', vibe: 'Satisfying / Social' },
          { name: 'Homemade Fried Rice', reason: 'Quick and easy, turn leftovers into a meal with a fried egg on top', vibe: 'Convenient / Nostalgic' }
        ];
      }
    }
    // 玩乐/出行相关
    else if (lower.includes('玩') || lower.includes('去') || lower.includes('逛') || lower.includes('公园') || lower.includes('展览') || lower.includes('play') || lower.includes('go') || lower.includes('park')) {
      if (isZh) {
        suggestions = [
          { name: '城市公园散步', reason: '免费又治愈，树影斑驳的小路走一圈，烦恼全没了', vibe: '放松 / 自然' },
          { name: '艺术展览', reason: '沉浸式看展，拍照打卡还能涨见识，一下午很快就过', vibe: '文艺 / 出片' },
          { name: '咖啡馆办公', reason: '换个环境效率翻倍，咖啡香里灵感特别多', vibe: '惬意 / 专注' },
          { name: '书店发呆', reason: '窝在角落翻书，时间慢下来的感觉特别好', vibe: '安静 / 充电' }
        ];
      } else {
        suggestions = [
          { name: 'City Park Walk', reason: 'Free and healing, a walk under tree shadows melts all stress away', vibe: 'Relaxing / Nature' },
          { name: 'Art Exhibition', reason: 'Immersive viewing, great photos and new perspectives, time flies', vibe: 'Artsy / Instagrammable' },
          { name: 'Cafe Work Session', reason: 'New environment doubles productivity, so many ideas with coffee aroma', vibe: 'Cozy / Focused' },
          { name: 'Bookstore Escape', reason: 'Curled up in a corner with books, time slows down beautifully', vibe: 'Quiet / Recharging' }
        ];
      }
    }
    // 购物/穿搭相关
    else if (lower.includes('买') || lower.includes('穿') || lower.includes('衣服') || lower.includes('购物') || lower.includes('buy') || lower.includes('wear') || lower.includes('shop')) {
      if (isZh) {
        suggestions = [
          { name: '基础款升级', reason: '买质感好的白T/衬衫，百搭不出错，利用率最高', vibe: '实用 / 百搭' },
          { name: '亮色小物点亮', reason: '不用买大件，一条丝巾/一对耳环就能让整体造型活起来', vibe: '小心机 / 性价比' },
          { name: '运动休闲风', reason: '舒适又好看，出门逛街通勤都能穿，不累脚', vibe: '舒适 / 日常' },
          { name: '二手古着淘货', reason: '独一无二不撞款，寻宝过程本身就很有趣', vibe: '个性 / 环保' }
        ];
      } else {
        suggestions = [
          { name: 'Upgrade Basics', reason: 'Invest in quality tees/shirts, versatile and highest wear rate', vibe: 'Practical / Versatile' },
          { name: 'Bright Accessories', reason: 'No need for big pieces, a scarf or earrings instantly elevate your look', vibe: 'Subtle / Great value' },
          { name: 'Athleisure Style', reason: 'Comfortable and stylish, great for shopping or commuting, no sore feet', vibe: 'Comfy / Everyday' },
          { name: 'Thrift/Vintage Hunting', reason: 'One-of-a-kind pieces, the treasure hunt itself is fun', vibe: 'Unique / Sustainable' }
        ];
      }
    }
    // 通用日常建议
    else {
      if (isZh) {
        suggestions = [
          { name: '先从小事做起', reason: '不用想太多，迈出第一步就成功了一半，先做15分钟看看', vibe: '低门槛 / 启动' },
          { name: '列个清单捋一捋', reason: '把想法都写下来，轻重缓急一目了然，焦虑少一半', vibe: '清晰 / 有条理' },
          { name: '先休息再出发', reason: '累了就别硬撑，睡一觉起来思路可能就通了', vibe: '照顾自己 / 慢慢来' },
          { name: '找朋友聊聊', reason: '说出来就没那么纠结了，旁观者清说不定有新思路', vibe: '温暖 / 连接' }
        ];
      } else {
        suggestions = [
          { name: 'Start Small', reason: 'Don\'t overthink it, taking the first step is half the battle. Try 15 minutes first.', vibe: 'Low barrier / Starter' },
          { name: 'Make a List', reason: 'Write everything down, priorities become clear and anxiety drops', vibe: 'Clear / Organized' },
          { name: 'Rest First', reason: 'Don\'t push through when tired. Sleep on it, clarity might come tomorrow.', vibe: 'Self-care / Take it slow' },
          { name: 'Talk to a Friend', reason: 'Saying it out loud reduces overthinking, outside perspective helps', vibe: 'Warm / Connected' }
        ];
      }
    }

    return suggestions;
  }

  function renderHistory() {
    var list = document.getElementById('historyList');
    var tabsContainer = document.getElementById('historyCatTabs');
    if (!list || !tabsContainer) return;

    if (!history.length) {
      tabsContainer.innerHTML = '';
      list.innerHTML = '<p style="color:var(--muted);text-align:center;padding:2rem;">' + t('historyEmpty') + '</p>';
      return;
    }

    try {
      // Build category data
      var cats = {};
      var catOrder = ['product', 'research', 'art', 'business'];
      var catMeta = { product: { icon: '🚀', name: t('typeProduct') }, research: { icon: '🔬', name: t('typeResearch') }, art: { icon: '🎨', name: t('typeArt') }, business: { icon: '💼', name: t('typeBusiness') } };

      history.forEach(function(item) {
        var itemType = item.type || 'product';
        if (!cats[itemType]) cats[itemType] = [];
        cats[itemType].push(item);
      });

      // Render filter tabs
      var totalCount = history.length;
      var allLabel = t('filterAll');
      var tabsHTML = '<span class="history-cat-tab' + (historyFilter === 'all' ? ' active' : '') + '" data-cat="all">' + allLabel + '（' + totalCount + '）</span>';
      catOrder.forEach(function(c) {
        if (cats[c] && cats[c].length) {
          tabsHTML += '<span class="history-cat-tab' + (historyFilter === c ? ' active' : '') + '" data-cat="' + c + '">' + catMeta[c].icon + ' ' + catMeta[c].name + '（' + cats[c].length + '）</span>';
        }
      });
      tabsContainer.innerHTML = tabsHTML;

      // Bind tab click
      tabsContainer.querySelectorAll('.history-cat-tab').forEach(function(tab) {
        tab.addEventListener('click', function() {
          historyFilter = this.dataset.cat;
          renderHistory();
        });
      });

      // Render items grouped by category
      var html = '';
      catOrder.forEach(function(c) {
        if (!cats[c] || !cats[c].length) return;
        if (historyFilter !== 'all' && historyFilter !== c) return;
        var items = cats[c];
        html += '<div class="cat-section">';
        var itemUnit = t('historyCountUnit');
        html += '<div class="cat-section-header"><span class="cat-icon">' + catMeta[c].icon + '</span><span class="cat-name">' + catMeta[c].name + '</span><span class="cat-count">' + items.length + itemUnit + '</span></div>';
        items.forEach(function(h, idx) {
          var realIdx = history.indexOf(h);
          html += '<div class="history-item" onclick="window.loadHistory(' + realIdx + ')"><div class="title">' + h.text + '</div><div class="meta">' + h.time + '</div></div>';
        });
        html += '</div>';
      });

      if (!html) {
        html = '<p style="color:var(--muted);text-align:center;padding:2rem;">' + t('historyEmptyFilter') + '</p>';
      }

      list.innerHTML = html;
    } catch(err) {
      console.error('renderHistory error:', err);
      list.innerHTML = '<p style="color:var(--bad);text-align:center;padding:2rem;">渲染历史记录出错：' + err.message + '<br>请打开浏览器控制台查看详情</p>';
    }
  }

  window.loadHistory = function(index) {
    var item = history[index];
    if (!item) return;
    textarea.value = item.full;
    document.querySelectorAll('.input-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.input-pane').forEach(function(p) { p.classList.remove('active'); });
    document.querySelector('[data-tab="text"]').classList.add('active');
    document.getElementById('pane-text').classList.add('active');
    activeTab = 'text';
    historyArea.classList.remove('active');
    historyVisible = false;
    historyBtn.textContent = t('historyBtn');
    // Restore analysis result
    var resultToRender = null;
    if (item.result) {
      // Check completeness: graph, swot, actions, timeline must all exist and be non-empty
      var hasGraph = item.result.graph && item.result.graph.length;
      var hasSwot = item.result.swot && item.result.swot.s && item.result.swot.s.length && item.result.swot.w && item.result.swot.w.length;
      var hasActions = item.result.actions && item.result.actions.length;
      var hasTimeline = item.result.timeline && item.result.timeline.length;
      if (hasGraph && hasSwot && hasActions && hasTimeline) {
        resultToRender = item.result;
      } else {
        // Incomplete result: auto-regenerate
        resultToRender = generateByType(item.full, item.type || detectType(item.full));
        item.result = resultToRender;
        localStorage.setItem('inspirationHistory', JSON.stringify(history));
        showToast(t('historyAutoCompleted'));
      }
    } else {
      // Legacy data without result: auto-regenerate
      resultToRender = generateByType(item.full, item.type || detectType(item.full));
      item.result = resultToRender;
      localStorage.setItem('inspirationHistory', JSON.stringify(history));
      showToast(t('historyRebuilt'));
    }

    lastResult = { result: resultToRender };
    renderResultFromData(resultToRender, item.full, item.type || detectType(item.full));
    var sourceEl = document.getElementById('resultSource');
    if (sourceEl) {
      sourceEl.textContent = t('sourceHistory');
      sourceEl.style.background = 'rgba(78,205,196,.1)';
      sourceEl.style.color = 'var(--accent)';
    }
    resultsArea.classList.add('active');
  };

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(function() { toast.classList.remove('show'); }, 2500);
  }

  function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // 从 AI 响应文本中提取 JSON 对象（支持代码块包裹、嵌套 JSON）
  function extractJson(text) {
    if (!text) return null;
    // 1. 直接尝试解析
    try { return JSON.parse(text); } catch(e) {}
    // 2. 尝试从 ```json 或 ``` 代码块中提取
    var codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch) {
      try { return JSON.parse(codeBlockMatch[1].trim()); } catch(e) {}
    }
    // 3. 用括号计数法找到最外层的 JSON 对象
    var start = text.indexOf('{');
    if (start === -1) return null;
    var depth = 0;
    var inString = false;
    var escape = false;
    for (var i = start; i < text.length; i++) {
      var ch = text[i];
      if (escape) { escape = false; continue; }
      if (ch === '\\') { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) {
          try { return JSON.parse(text.substring(start, i + 1)); } catch(e) { return null; }
        }
      }
    }
    return null;
  }

  // ---- 内容质量检查 ----
  // 通用套话模式（中文）
  var CLICHE_PATTERNS_ZH = [
    /进行市场调研/, /明确用户需求/, /制定发展战略/, /加强团队建设/,
    /提升用户体验/, /优化产品功能/, /扩大市场份额/, /提高竞争力/,
    /加强品牌建设/, /完善运营体系/, /推动业务增长/, /实现可持续发展/,
    /打造核心竞争力/, /构建生态系统/, /探索商业模式/, /验证市场需求/,
    /完成需求分析/, /制定产品规划/, /进行竞品分析/, /明确产品定位/
  ];
  var CLICHE_PATTERNS_EN = [
    /conduct market research/i, /define user needs/i, /develop strategy/i,
    /improve user experience/i, /optimize features/i, /increase market share/i,
    /enhance competitiveness/i, /build brand/i, /drive growth/i,
    /achieve sustainable development/i, /create core competitiveness/i,
    /build ecosystem/i, /explore business model/i, /validate market/i,
    /complete requirements analysis/i, /product planning/i, /competitive analysis/i
  ];

  // 检查文本是否为套话（返回 0-1 的分数，越高越像套话）
  function checkClicheScore(text) {
    if (!text || typeof text !== 'string') return 0;
    var patterns = currentLang === 'zh' ? CLICHE_PATTERNS_ZH : CLICHE_PATTERNS_EN;
    var matches = 0;
    patterns.forEach(function(p) {
      if (p.test(text)) matches++;
    });
    return Math.min(matches / 3, 1); // 命中3个以上就算高套话
  }

  // 检查文本长度是否达标（中文至少8个字才算有内容）
  function checkContentLength(text, minLen) {
    if (!text || typeof text !== 'string') return false;
    var clean = text.replace(/\s/g, '');
    minLen = minLen || (currentLang === 'zh' ? 8 : 20);
    return clean.length >= minLen;
  }

  // 从灵感文本中提取核心关键词（用于相关性检查）
  function extractCoreKeywords(text) {
    if (!text) return [];
    // 简单提取：去掉常见停用词，取长度>=2的词
    var stopWords = ['的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好', '自己', '这', '那', '什么', '怎么', '为什么', '可以', '想', '做', '用', '对', '中', '大', '来', '还', '个', '下', '得', '多', '然', '而', '但', '如', '若', '因', '所', '其', '之', '与', '及', '或', '以', '为', '被', '把', '让', '使', '从', '向', '往', '由', '自', '跟', '同', '比', '靠', '通过', '经过', '根据', '按照', '关于', '对于', '由于', '除了', '之外', '以前', '以后', '以上', '以下'];
    var words = text.split(/[\s,，。！？、；：""''（）\[\]【】《》…—\-_.\/\\|`~!@#$%^&*()+=<>?]/).filter(function(w) {
      return w.length >= 2 && stopWords.indexOf(w) === -1;
    });
    // 去重并取前10个
    var unique = [];
    words.forEach(function(w) {
      if (unique.indexOf(w) === -1) unique.push(w);
    });
    return unique.slice(0, 10);
  }

  // 检查内容与灵感主题的相关性（返回 0-1 的分数）
  function checkRelevance(text, keywords) {
    if (!text || !keywords || keywords.length === 0) return 0.5; // 无法判断时给中等分
    var matches = 0;
    keywords.forEach(function(kw) {
      if (text.indexOf(kw) !== -1) matches++;
    });
    return Math.min(matches / Math.min(keywords.length, 3), 1);
  }

  // 综合质量评估函数
  function assessResultQuality(result, framework, inspirationText) {
    var issues = [];
    var warnings = [];
    var keywords = extractCoreKeywords(inspirationText);

    // 1. 检查必填字段
    if (!result || typeof result !== 'object') {
      issues.push('结果不是有效对象');
      return { pass: false, issues: issues, warnings: warnings, score: 0 };
    }
    if (!result.type) issues.push('缺少 type 字段');
    if (!result.tags || !Array.isArray(result.tags) || result.tags.length === 0) issues.push('缺少 tags 字段或为空');
    if (!result.graph || !Array.isArray(result.graph) || result.graph.length < 3) warnings.push('graph 节点少于3个');

    // 2. 根据框架检查特定字段
    if (framework === 'swot') {
      if (!result.swot || typeof result.swot !== 'object') issues.push('缺少 swot 字段');
      else {
        ['s', 'w', 'o', 't'].forEach(function(dim) {
          if (!result.swot[dim] || !Array.isArray(result.swot[dim]) || result.swot[dim].length === 0) {
            issues.push('SWOT 缺少 ' + dim + ' 维度');
          }
        });
      }
    } else if (framework === 'lean') {
      if (!result.canvas || typeof result.canvas !== 'object') issues.push('缺少 canvas 字段');
    } else if (framework === '4p') {
      if (!result.marketing4p || typeof result.marketing4p !== 'object') issues.push('缺少 marketing4p 字段');
    } else if (framework === 'tech') {
      if (!result.tech || typeof result.tech !== 'object') issues.push('缺少 tech 字段');
    } else if (framework === 'daily') {
      if (!result.suggestions || !Array.isArray(result.suggestions) || result.suggestions.length < 2) {
        issues.push('缺少 suggestions 或少于2条');
      }
      if (!result.final_verdict) warnings.push('缺少 final_verdict');
    }

    // 3. 检查 actions 质量（仅非 daily 框架）
    if (framework !== 'daily' && result.actions && Array.isArray(result.actions)) {
      var clicheActions = 0;
      var shortActions = 0;
      result.actions.forEach(function(a) {
        var txt = a.text || '';
        if (checkClicheScore(txt) > 0.5) clicheActions++;
        if (!checkContentLength(txt, currentLang === 'zh' ? 10 : 25)) shortActions++;
      });
      if (clicheActions >= 3) warnings.push('行动建议中有 ' + clicheActions + ' 条疑似通用套话');
      if (shortActions >= 2) warnings.push('行动建议中有 ' + shortActions + ' 条内容过短');
    }

    // 4. 检查 SWOT 内容质量
    if (framework === 'swot' && result.swot) {
      var swotShort = 0;
      ['s', 'w', 'o', 't'].forEach(function(dim) {
        (result.swot[dim] || []).forEach(function(item) {
          if (!checkContentLength(item, currentLang === 'zh' ? 6 : 15)) swotShort++;
        });
      });
      if (swotShort >= 4) warnings.push('SWOT 分析中有 ' + swotShort + ' 条内容过短，可能不够深入');
    }

    // 5. 整体相关性检查（抽查几个字段的内容）
    if (keywords.length > 0) {
      var totalChecks = 0;
      var relevantCount = 0;
      if (result.tags) {
        result.tags.forEach(function(t) { totalChecks++; if (checkRelevance(t, keywords) > 0) relevantCount++; });
      }
      if (framework === 'swot' && result.swot) {
        ['s', 'w', 'o', 't'].forEach(function(dim) {
          (result.swot[dim] || []).forEach(function(item) { totalChecks++; if (checkRelevance(item, keywords) > 0) relevantCount++; });
        });
      }
      if (totalChecks > 0 && relevantCount / totalChecks < 0.3) {
        warnings.push('分析内容与灵感主题相关性偏低');
      }
    }

    // 计算综合质量分（0-100）
    var score = 100;
    score -= issues.length * 15;
    score -= warnings.length * 8;
    score = Math.max(0, Math.min(100, score));

    return {
      pass: issues.length === 0,
      issues: issues,
      warnings: warnings,
      score: score,
      keywords: keywords
    };
  }

  // ---- Export Report (功能三) ----
  function generateMarkdownReport() {
    if (!lastResult) return '';
    var now = new Date();
    var dateStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0') + ' ' + String(now.getHours()).padStart(2,'0') + ':' + String(now.getMinutes()).padStart(2,'0');
    var fwName = getFrameworkName(currentFramework);
    var r = lastResult.result || {};
    var md = '# ' + t('appTitle') + '\n';
    md += '**' + t('mdGenerated') + '**：' + dateStr + '\n';
    md += '**' + t('mdFramework') + '**：' + fwName + '\n\n';
    md += '---\n\n';
    md += '## ' + t('mdOriginal') + '\n\n';
    md += lastResult.text + '\n\n';
    md += '## ' + t('mdType') + '\n\n';
    var ti = getTypeInfo(lastResult.type);
    md += ti.icon + ' ' + ti.label + '\n\n';
    md += '## ' + t('mdTags') + '\n\n';
    md += (r.tags || []).join('、') + '\n\n';
    md += '---\n\n';

    if (currentFramework === 'swot') {
      md += '## ' + t('mdSwot') + '\n\n';
      md += '### ' + t('mdSwotS') + '\n\n';
      md += (r.swot && r.swot.s || []).map(function(x) { return '- ' + x; }).join('\n') + '\n\n';
      md += '### ' + t('mdSwotW') + '\n\n';
      md += (r.swot && r.swot.w || []).map(function(x) { return '- ' + x; }).join('\n') + '\n\n';
      md += '### ' + t('mdSwotO') + '\n\n';
      md += (r.swot && r.swot.o || []).map(function(x) { return '- ' + x; }).join('\n') + '\n\n';
      md += '### ' + t('mdSwotT') + '\n\n';
      md += (r.swot && r.swot.t || []).map(function(x) { return '- ' + x; }).join('\n') + '\n\n';
    } else if (currentFramework === 'lean') {
      md += '## ' + t('mdLean') + '\n\n';
      var canvas = r.canvas || {};
      var leanMap = [
        ['customer_segments', t('mdLeanCS')],
        ['value_proposition', t('mdLeanVP')],
        ['channels', t('mdLeanCH')],
        ['customer_relationships', t('mdLeanCR')],
        ['revenue_streams', t('mdLeanRS')],
        ['key_resources', t('mdLeanKR')],
        ['key_activities', t('mdLeanKA')],
        ['key_partners', t('mdLeanKP')],
        ['cost_structure', t('mdLeanCS2')]
      ];
      leanMap.forEach(function(pair) {
        md += '### ' + pair[1] + '\n\n';
        md += (canvas[pair[0]] || []).map(function(x) { return '- ' + x; }).join('\n') + '\n\n';
      });
    } else if (currentFramework === '4p') {
      md += '## ' + t('md4p') + '\n\n';
      var m4p = r.marketing4p || {};
      var pMap = [
        ['product', t('md4pProd')],
        ['price', t('md4pPrice')],
        ['place', t('md4pPlace')],
        ['promotion', t('md4pPromo')]
      ];
      pMap.forEach(function(pair) {
        md += '### ' + pair[1] + '\n\n';
        md += (m4p[pair[0]] || []).map(function(x) { return '- ' + x; }).join('\n') + '\n\n';
      });
    } else if (currentFramework === 'tech') {
      md += '## ' + t('mdTech') + '\n\n';
      var tech = r.tech || {};
      var tMap = [
        ['feasibility', t('mdTechFeas')],
        ['difficulty', t('mdTechDiff')],
        ['risks', t('mdTechRisk')],
        ['tech_stack', t('mdTechStack')]
      ];
      tMap.forEach(function(pair) {
        md += '### ' + pair[1] + '\n\n';
        md += (tech[pair[0]] || []).map(function(x) { return '- ' + x; }).join('\n') + '\n\n';
      });
    } else if (currentFramework === 'daily') {
      md += '## 🧘 生活决策建议\n\n';
      var suggestions = r.suggestions || [];
      if (suggestions.length === 0) {
        suggestions = generateDailyFallback(lastResult.text || '');
      }
      suggestions.forEach(function(s, i) {
        md += '### ' + (i+1) + '. ' + (s.name || '选项') + '\n\n';
        md += '- ' + t('mdDailyReason') + ': ' + (s.reason || '') + '\n';
        if (s.vibe) md += '- ' + t('mdDailyVibe') + ': ' + s.vibe + '\n';
        md += '\n';
      });
      if (r.final_verdict) {
        md += '### 💡 ' + t('mdDailyVerdict') + '\n\n';
        md += r.final_verdict + '\n\n';
      }
    }

    if (r.actions && r.actions.length) {
      md += '## ' + t('mdActionPlan') + '\n\n';
      r.actions.forEach(function(a, i) { md += (i+1) + '. ' + a.text + '\n'; });
      md += '\n';
    }
    if (r.timeline && r.timeline.length) {
      md += '## ' + t('mdTimeline') + '\n\n';
      r.timeline.forEach(function(t) { md += '- **' + t.time + '**：' + t.task + '\n'; });
      md += '\n';
    }

    md += '---\n\n';
    md += t('mdGeneratedBy') + '\n';
    return md;
  }

  (function() {
    var exportBtn = document.getElementById('exportBtn');
    if (!exportBtn) return;
    var dropdown = document.createElement('div');
    dropdown.className = 'export-dropdown';
    dropdown.innerHTML = '<button id="exportMdBtn">' + t('exportMd') + '</button><button id="exportPdfBtn">' + t('exportPdf') + '</button><button id="exportCopyBtn">' + t('exportCopy') + '</button>';
    var wrap = document.createElement('span');
    wrap.className = 'export-wrap';
    exportBtn.parentNode.replaceChild(wrap, exportBtn);
    wrap.appendChild(exportBtn);
    wrap.appendChild(dropdown);
    exportBtn.style.position = 'relative';

    exportBtn.addEventListener('click', function(e) {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });
    document.addEventListener('click', function() { dropdown.classList.remove('show'); });

    document.getElementById('exportMdBtn').addEventListener('click', function() {
      dropdown.classList.remove('show');
      if (!lastResult) { showToast(t('toastNeedCapture')); return; }
      var md = generateMarkdownReport();
      var blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'inspiration-report-' + Date.now() + '.md';
      a.click();
      URL.revokeObjectURL(url);
      showToast(t('toastMdDownloaded'));
    });

    document.getElementById('exportPdfBtn').addEventListener('click', function() {
      dropdown.classList.remove('show');
      if (!lastResult) { showToast(t('toastNeedCapture')); return; }
      window.print();
    });

    document.getElementById('exportCopyBtn').addEventListener('click', function() {
      dropdown.classList.remove('show');
      if (!lastResult) { showToast(t('toastNeedCapture')); return; }
      var md = generateMarkdownReport();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(md).then(function() {
          showToast(t('toastReportCopied'));
        }).catch(function(err) {
          console.error('Copy failed:', err);
          fallbackCopy(md);
        });
      } else {
        fallbackCopy(md);
      }
      function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.select();
        try {
          document.execCommand('copy');
          showToast(t('toastReportCopied'));
        } catch (e) {
          showToast(t('toastCopyFailed'));
        }
        document.body.removeChild(ta);
      }
    });
  })();

  // Generic streaming chat helper for follow-up questions
  function streamOllamaChat(messages, options) {
    options = options || {};
    var onChunk = options.onChunk || function() {};
    var onComplete = options.onComplete || function() {};
    var onError = options.onError || function() {};

    fetch(BASE_URL + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages: messages, stream: true, options: { temperature: 0.6, num_predict: 1024 } })
    })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      if (!res.body || !res.body.getReader) {
        return res.json().then(function(data) {
          onComplete(data.message && data.message.content || '', {});
        });
      }
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';
      var fullText = '';
      var tokenStats = { prompt: 0, completion: 0 };

      function read() {
        return reader.read().then(function(result) {
          if (result.done) {
            if (buffer.trim()) {
              try {
                var lastData = JSON.parse(buffer.trim());
                if (lastData.done && lastData.prompt_eval_count !== undefined) {
                  tokenStats.prompt = lastData.prompt_eval_count || 0;
                  tokenStats.completion = lastData.eval_count || 0;
                }
              } catch(e) {}
            }
            onComplete(fullText, tokenStats);
            return;
          }
          var chunk = decoder.decode(result.value, { stream: true });
          buffer += chunk;
          var lines = buffer.split('\n');
          buffer = lines.pop();
          lines.forEach(function(line) {
            line = line.trim();
            if (!line) return;
            try {
              var data = JSON.parse(line);
              var content = data.message && data.message.content || '';
              if (content) {
                fullText += content;
                onChunk(fullText);
              }
              if (data.done && data.prompt_eval_count !== undefined) {
                tokenStats.prompt = data.prompt_eval_count || 0;
                tokenStats.completion = data.eval_count || 0;
              }
            } catch(e) {}
          });
          return read();
        }).catch(function(err) {
          console.error('Chat stream error:', err);
          onError(err, fullText);
        });
      }
      return read();
    })
    .catch(function(err) {
      console.error('Chat API error:', err);
      onError(err, '');
    });
  }

  // ---- Chat / Follow-up bindings ----
  (function() {
    var chatSendBtn = document.getElementById('chatSendBtn');
    var chatInput = document.getElementById('chatInput');
    var chatMessages = document.getElementById('chatMessages');
    var chatStreamPanel = document.getElementById('chatStreamPanel');
    var chatStreamContent = document.getElementById('chatStreamContent');
    var chatResetBtn = document.getElementById('chatResetBtn');

    if (!chatSendBtn || !chatInput || !chatMessages) return;

    chatSendBtn.addEventListener('click', function() {
      var question = chatInput.value.trim();
      if (!question) { showToast(t('chatNeedInput')); return; }
      if (!lastResult) { showToast(t('chatNeedCapture')); return; }

      // Add user message to UI
      var userMsgHTML = '<div class="chat-msg chat-msg-user"><div class="chat-msg-avatar">🧑‍💻</div><div class="chat-msg-bubble">' + escapeHtml(question) + '</div></div>';
      chatMessages.insertAdjacentHTML('beforeend', userMsgHTML);
      chatInput.value = '';
      chatMessages.scrollTop = chatMessages.scrollHeight;

      // Build context messages
      var chatSysPrompt = '';
      if (currentLang === 'zh') {
        chatSysPrompt = '你是一位顶级的创意策略顾问。以下是用户最初的灵感分析和之前的对话记录。请基于这些信息，用中文简洁地回答用户的追问。';
      } else if (currentLang === 'en') {
        chatSysPrompt = 'You are a top creative strategy consultant. Below is the user\'s initial inspiration analysis and previous conversation history. Please answer the user\'s follow-up questions concisely in English based on this information.';
      } else if (currentLang === 'ja') {
        chatSysPrompt = 'あなたはトップクリエイティブ戦略コンサルタントです。以下はユーザーの最初のインスピレーション分析と過去の会話履歴です。これらの情報に基づいて、ユーザーの質問に簡潔に日本語で答えてください。';
      } else if (currentLang === 'ko') {
        chatSysPrompt = '당신은 최고의 크리에이티브 전략 컨설턴트입니다. 다음은 사용자의 초기 영감 분석과 이전 대화 기록입니다. 이 정보를 바탕으로 사용자의 후속 질문에 한국어로 간결하게 답변해 주세요.';
      } else if (currentLang === 'fr') {
        chatSysPrompt = 'Vous êtes un consultant en stratégie créative de premier plan. Voici l\'analyse d\'inspiration initiale de l\'utilisateur et l\'historique des conversations précédentes. Veuillez répondre de manière concise en français aux questions de suivi de l\'utilisateur sur la base de ces informations.';
      } else if (currentLang === 'de') {
        chatSysPrompt = 'Sie sind ein Top-Berater für kreative Strategie. Unten finden Sie die erste Inspirationsanalyse des Benutzers und den vorherigen Gesprächsverlauf. Bitte beantworten Sie die Folgefragen des Benutzers prägnant auf Deutsch basierend auf diesen Informationen.';
      } else if (currentLang === 'es') {
        chatSysPrompt = 'Eres un consultor de estrategia creativa de primer nivel. A continuación se muestra el análisis de inspiración inicial del usuario y el historial de conversaciones anteriores. Responde de forma concisa en español a las preguntas de seguimiento del usuario basándote en esta información.';
      } else {
        chatSysPrompt = 'You are a top creative strategy consultant. Below is the user\'s initial inspiration analysis and previous conversation history. Please answer the user\'s follow-up questions concisely in English based on this information.';
      }
      var contextMessages = [
        { role: 'system', content: chatSysPrompt }
      ];
      contextMessages.push({ role: 'user', content: '【原始灵感】\n' + lastResult.text });
      if (lastResult.result) {
        contextMessages.push({ role: 'assistant', content: '【分析结果】\n' + JSON.stringify(lastResult.result, null, 2) });
      }
      conversationHistory.forEach(function(entry) {
        contextMessages.push({ role: 'user', content: entry.question });
        contextMessages.push({ role: 'assistant', content: entry.answer });
      });
      contextMessages.push({ role: 'user', content: question });

      // Show streaming panel
      chatStreamPanel.style.display = 'block';
      chatStreamContent.innerHTML = '<span class="cursor"></span>';

      var currentFullText = '';
      streamOllamaChat(contextMessages, {
        onChunk: function(text) {
          currentFullText = text;
          chatStreamContent.innerHTML = escapeHtml(text).replace(/\n/g, '<br>') + '<span class="cursor"></span>';
          chatStreamContent.scrollTop = chatStreamContent.scrollHeight;
        },
        onComplete: function(fullText, stats) {
          chatStreamPanel.style.display = 'none';
          var aiMsgHTML = '<div class="chat-msg chat-msg-ai"><div class="chat-msg-avatar">🤖</div><div class="chat-msg-bubble">' + escapeHtml(fullText).replace(/\n/g, '<br>') + '</div></div>';
          chatMessages.insertAdjacentHTML('beforeend', aiMsgHTML);
          chatMessages.scrollTop = chatMessages.scrollHeight;
          conversationHistory.push({ question: question, answer: fullText });
        },
        onError: function(err, partialText) {
          chatStreamPanel.style.display = 'none';
          var displayText = partialText || '（生成出错）';
          var aiMsgHTML = '<div class="chat-msg chat-msg-ai"><div class="chat-msg-avatar">🤖</div><div class="chat-msg-bubble">' + escapeHtml(displayText).replace(/\n/g, '<br>') + '</div></div>';
          chatMessages.insertAdjacentHTML('beforeend', aiMsgHTML);
          chatMessages.scrollTop = chatMessages.scrollHeight;
          if (partialText) {
            conversationHistory.push({ question: question, answer: partialText });
          }
        }
      });
    });

    if (chatResetBtn) {
      chatResetBtn.addEventListener('click', function() {
        conversationHistory = [];
        chatMessages.innerHTML = '';
        chatStreamPanel.style.display = 'none';
        var applyBtn = document.getElementById('chatApplyBtn');
        if (applyBtn) applyBtn.style.display = 'none';
        showToast(t('chatResetToast'));
      });
    }

    // ---- Apply chat suggestions to main analysis ----
    var chatApplyBtn = document.getElementById('chatApplyBtn');
    var isApplying = false;

    // 当有对话记录时显示采纳按钮
    function updateApplyBtnVisibility() {
      if (!chatApplyBtn) return;
      if (conversationHistory && conversationHistory.length > 0) {
        chatApplyBtn.style.display = '';
      } else {
        chatApplyBtn.style.display = 'none';
      }
    }

    // 在每次对话完成后显示按钮
    var origOnComplete = null; // 我们直接在现有逻辑中调用

    if (chatApplyBtn) {
      chatApplyBtn.addEventListener('click', function() {
        if (isApplying) return;
        if (!lastResult || !lastResult.result) {
          showToast(currentLang === 'zh' ? '请先捕获灵感再采纳建议' : 'Please capture inspiration first');
          return;
        }
        if (!conversationHistory || conversationHistory.length === 0) {
          showToast(currentLang === 'zh' ? '还没有追问内容可以采纳' : 'No follow-up content to apply');
          return;
        }

        isApplying = true;
        chatApplyBtn.disabled = true;
        chatApplyBtn.classList.add('loading');
        var origText = chatApplyBtn.textContent;
        chatApplyBtn.textContent = t('chatUpdating');

        var originalText = lastResult.text;
        var detectedType = lastResult.type || detectType(originalText);
        var framework = (document.getElementById('frameworkSelect') || {}).value || 'swot';
        var currentResult = lastResult.result || {};

        // 构建追问对话历史
        var chatHistoryText = '';
        conversationHistory.forEach(function(entry, idx) {
          chatHistoryText += '追问 ' + (idx + 1) + '：\n';
          chatHistoryText += '用户：' + entry.question + '\n';
          chatHistoryText += 'AI：' + entry.answer + '\n\n';
        });

        var systemPrompt = getFrameworkPrompt(framework) +
          '\n\n【重要任务】用户已经获得了一份初步分析结果，并且进行了多轮追问。' +
          '现在请你根据原始灵感 + 当前分析结果 + 追问对话历史，生成一份更新后的完整分析结果。' +
          '你必须将追问中的关键建议和修改意见融入到新的分析结果中，使分析更加完善、更加深入。' +
          '返回格式必须与原始分析结果完全一致（相同的 JSON 字段结构），以便直接替换原有卡片内容。';

        var userPrompt = '【原始灵感】\n' + originalText + '\n\n';
        userPrompt += '【当前分析结果（JSON）】\n' + JSON.stringify(currentResult, null, 2) + '\n\n';
        userPrompt += '【追问对话历史】\n' + chatHistoryText + '\n';
        userPrompt += '【任务】请基于以上所有信息，生成一份更新版的完整分析结果（JSON 格式）。' +
          '将追问中的有价值建议融入到各个分析维度中，使结果更加完善和深入。' +
          '保持与原始分析相同的 JSON 字段结构，确保可以直接替换原有卡片内容。';

        var messages = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ];

        var fullText = '';

        fetch(BASE_URL + '/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: MODEL,
            messages: messages,
            stream: true,
            options: { temperature: 0.4, num_predict: 2048 }
          })
        }).then(function(response) {
          if (!response.ok) throw new Error('HTTP ' + response.status);
          var reader = response.body.getReader();
          var decoder = new TextDecoder();
          function read() {
            reader.read().then(function(result) {
              if (result.done) {
                // 解析结果
                var parsed = null;
                try {
                  var jsonStr = fullText.replace(/```json/gi, '').replace(/```/g, '').trim();
                  parsed = JSON.parse(jsonStr);
                } catch (e) {
                  try {
                    var match = fullText.match(/\{[\s\S]*\}/);
                    if (match) parsed = JSON.parse(match[0]);
                  } catch (e2) {}
                }

                if (parsed && (parsed.actions || parsed.swot || parsed.graph)) {
                  // 成功解析，更新主卡片
                  lastResult = { text: originalText, type: detectedType, tags: parsed.tags || currentResult.tags || [], result: parsed };
                  renderResultFromData(parsed, originalText, detectedType);

                  var sourceEl = document.getElementById('resultSource');
                  if (sourceEl) {
                    sourceEl.textContent = '🤖 AI 追问更新版 (' + MODEL + ')';
                    sourceEl.style.background = 'rgba(124,108,240,.15)';
                    sourceEl.style.color = 'var(--accent2)';
                    sourceEl.title = '基于追问对话更新的分析结果';
                  }

                  // 更新历史记录
                  saveToHistory(originalText, detectedType, true);

                  showToast(currentLang === 'zh' ? '✨ 已根据追问更新分析结果' : '✨ Analysis updated from follow-up');

                  // 清空追问对话
                  conversationHistory = [];
                  chatMessages.innerHTML = '';
                  updateApplyBtnVisibility();
                } else {
                  showToast(currentLang === 'zh' ? '⚠️ 更新失败，AI 返回格式异常' : '⚠️ Update failed, invalid AI response format');
                }

                isApplying = false;
                chatApplyBtn.disabled = false;
                chatApplyBtn.classList.remove('loading');
                chatApplyBtn.textContent = origText;
                return;
              }

              var chunk = decoder.decode(result.value, { stream: true });
              var lines = chunk.split('\n');
              lines.forEach(function(line) {
                line = line.trim();
                if (!line || line.indexOf('data:') !== 0) return;
                var data = line.substring(5).trim();
                if (data === '[DONE]') return;
                try {
                  var json = JSON.parse(data);
                  if (json.message && json.message.content) {
                    fullText += json.message.content;
                  }
                } catch (e) {}
              });

              read();
            }).catch(function(err) {
              console.error('Stream read error:', err);
              isApplying = false;
              chatApplyBtn.disabled = false;
              chatApplyBtn.classList.remove('loading');
              chatApplyBtn.textContent = origText;
              showToast(currentLang === 'zh' ? '❌ 更新失败：连接中断' : '❌ Update failed: connection lost');
            });
          }
          read();
        }).catch(function(err) {
          console.error('Fetch error:', err);
          isApplying = false;
          chatApplyBtn.disabled = false;
          chatApplyBtn.classList.remove('loading');
          chatApplyBtn.textContent = origText;
          showToast(currentLang === 'zh' ? '❌ 无法连接 Ollama，更新失败' : '❌ Cannot connect to Ollama, update failed');
        });
      });
    }

    // 重写发送按钮逻辑，在完成后更新按钮可见性
    // （由于原来的绑定已经存在，我们用 MutationObserver 监听消息列表变化来更新按钮）
    var chatObserver = new MutationObserver(function() {
      updateApplyBtnVisibility();
    });
    if (chatMessages) {
      chatObserver.observe(chatMessages, { childList: true });
    }
  })();

  // ============================================================
  // Feature 1: Inline Editing (Notion-style double-click edit)
  // ============================================================
  var inlineEditing = false;

  function initInlineEdit() {
    var resultContent = document.getElementById('resultContent');
    if (!resultContent) return;

    resultContent.style.cursor = 'text';
    resultContent.title = currentLang === 'zh' ? '双击编辑' : 'Double-click to edit';

    resultContent.addEventListener('dblclick', function() {
      if (inlineEditing) return;
      startInlineEdit();
    });
  }

  function startInlineEdit() {
    var resultContent = document.getElementById('resultContent');
    if (!resultContent || inlineEditing) return;

    inlineEditing = true;
    var originalText = resultContent.textContent;

    // Create editing state
    resultContent.contentEditable = 'true';
    resultContent.classList.add('inline-editing');
    resultContent.focus();

    // Move cursor to end
    var range = document.createRange();
    range.selectNodeContents(resultContent);
    range.collapse(false);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    // Show editing status hint
    showEditStatus(true);

    // Handle Enter to save, Shift+Enter for newline, Esc to cancel
    var handleKeydown = function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        saveInlineEdit();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelInlineEdit(originalText);
      }
    };

    // Handle click outside to save
    var handleClickOutside = function(e) {
      if (!resultContent.contains(e.target)) {
        saveInlineEdit();
      }
    };

    resultContent.addEventListener('keydown', handleKeydown);
    setTimeout(function() {
      document.addEventListener('click', handleClickOutside);
    }, 10);

    // Store cleanup function
    resultContent._cleanupInlineEdit = function() {
      resultContent.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('click', handleClickOutside);
    };
  }

  function saveInlineEdit() {
    var resultContent = document.getElementById('resultContent');
    if (!resultContent || !inlineEditing) return;

    var newText = resultContent.textContent.trim();
    if (!newText) {
      cancelInlineEdit(resultContent.textContent);
      return;
    }

    // Exit editing mode
    resultContent.contentEditable = 'false';
    resultContent.classList.remove('inline-editing');
    inlineEditing = false;
    showEditStatus(false);

    // Cleanup
    if (resultContent._cleanupInlineEdit) {
      resultContent._cleanupInlineEdit();
      resultContent._cleanupInlineEdit = null;
    }

    // Update lastResult
    if (lastResult) {
      lastResult.text = newText;
    }

    // Re-detect type and update tags
    var newType = detectType(newText);
    var typeInfo = getTypeInfo(newType);
    var newResult = generateByType(newText, newType);

    // Update result content and tags
    document.getElementById('resultTags').innerHTML =
      '<span class="tag-pill type">' + typeInfo.label + '</span>' +
      (newResult.tags || []).map(function(t) { return '<span class="tag-pill">' + t + '</span>'; }).join('');

    // Update graph
    document.getElementById('graphArea').innerHTML = (newResult.graph || []).map(function(item, i) {
      return i === 0
        ? '<span class="graph-node main">' + item + '</span>'
        : '<span class="graph-arrow">→</span><span class="graph-node related">' + item + '</span>';
    }).join('');

    // Update SWOT if visible
    var swotCard = document.getElementById('swotCard');
    if (swotCard && swotCard.style.display !== 'none') {
      document.getElementById('swotArea').innerHTML =
        '<div class="swot-item s"><h4>' + t('swotS') + '</h4><ul>' + (newResult.swot && newResult.swot.s ? newResult.swot.s : []).map(function(x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
        '<div class="swot-item w"><h4>' + t('swotW') + '</h4><ul>' + (newResult.swot && newResult.swot.w ? newResult.swot.w : []).map(function(x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
        '<div class="swot-item o"><h4>' + t('swotO') + '</h4><ul>' + (newResult.swot && newResult.swot.o ? newResult.swot.o : []).map(function(x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>' +
        '<div class="swot-item t"><h4>' + t('swotT') + '</h4><ul>' + (newResult.swot && newResult.swot.t ? newResult.swot.t : []).map(function(x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>';
      document.getElementById('actionList').innerHTML = (newResult.actions || []).map(function(a) {
        var isZ = currentLang === 'zh';
        var pLabel = a.priority === 'high' ? (isZ ? '高优' : 'High') : (a.priority === 'medium' ? (isZ ? '中优' : 'Med') : (isZ ? '低优' : 'Low'));
        return '<li><span class="check" onclick="this.classList.toggle(\'checked\')">✓</span><span class="text">' + a.text + '</span><span class="priority ' + a.priority + '">' + pLabel + '</span></li>';
      }).join('');
      document.getElementById('timelineArea').innerHTML = (newResult.timeline || []).map(function(t) {
        return '<div class="timeline-item"><div class="time">' + t.time + '</div><div class="task">' + t.task + '</div></div>';
      }).join('');
    }

    // Update optimization card
    var opt = generatePromptOptimization(newText, newType, newResult);
    document.getElementById('optOriginal').textContent = newText;
    document.getElementById('optImproved').textContent = opt.improved;
    document.getElementById('optTags').innerHTML = (opt.tags || []).map(function(t) {
      return '<span class="tag">' + t + '</span>';
    }).join('');

    // Update lastResult with new result
    if (lastResult) {
      lastResult.result = newResult;
      lastResult.type = newType;
      lastResult.tags = newResult.tags || [];
    }

    // Update history: find and update the matching entry
    var oldText = resultContent._originalText || '';
    for (var i = 0; i < history.length; i++) {
      if (history[i].full === oldText) {
        history[i].full = newText;
        history[i].text = newText.substring(0, 80) + (newText.length > 80 ? '...' : '');
        history[i].type = newType;
        history[i].typeIcon = typeInfo.icon;
        history[i].typeName = typeInfo.label;
        history[i].result = newResult;
        history[i].time = new Date().toLocaleString('zh-CN');
        break;
      }
    }
    saveHistory();
    renderHistory();

    // Update related inspirations
    renderRelatedInspirations(newText);

    showToast(currentLang === 'zh' ? '✅ 已保存' : '✅ Saved');
  }

  function cancelInlineEdit(originalText) {
    var resultContent = document.getElementById('resultContent');
    if (!resultContent) return;

    resultContent.textContent = originalText;
    resultContent.contentEditable = 'false';
    resultContent.classList.remove('inline-editing');
    inlineEditing = false;
    showEditStatus(false);

    if (resultContent._cleanupInlineEdit) {
      resultContent._cleanupInlineEdit();
      resultContent._cleanupInlineEdit = null;
    }
  }

  function showEditStatus(show) {
    var card = document.querySelector('.inspiration-card');
    if (!card) return;

    if (show) {
      var status = document.createElement('div');
      status.className = 'edit-status-hint';
      status.id = 'editStatusHint';
      status.textContent = currentLang === 'zh' ? '✏️ 编辑中... 按 Enter 保存，Esc 取消' : '✏️ Editing... Enter to save, Esc to cancel';
      card.insertBefore(status, card.firstChild);
    } else {
      var hint = document.getElementById('editStatusHint');
      if (hint) hint.remove();
    }
  }

  // Store original text when rendering results (for history matching)
  var _origRenderResult = renderResultFromData;
  // We'll hook into render via a simpler approach: track last rendered text
  var lastRenderedText = '';

  // Override render to store original text for inline editing
  var _oldRender = renderResultFromData;
  renderResultFromData = function(result, text, type) {
    lastRenderedText = text;
    _oldRender(result, text, type);
    // Store original text on the element for history matching after edit
    var resultContent = document.getElementById('resultContent');
    if (resultContent) {
      resultContent._originalText = text;
    }
    // Re-init inline edit after render
    initInlineEdit();
    // Render related inspirations
    renderRelatedInspirations(text);
  };

  // ============================================================
  // Feature 2: Command Palette (Cmd+K / Ctrl+K)
  // ============================================================
  var cmdPaletteOpen = false;

  function initCommandPalette() {
    // Create palette HTML
    var palette = document.createElement('div');
    palette.id = 'cmdPalette';
    palette.className = 'cmd-palette';
    palette.innerHTML = '<div class="cmd-palette-overlay"></div>' +
      '<div class="cmd-palette-panel">' +
        '<div class="cmd-palette-input-wrap">' +
          '<span class="cmd-palette-icon">⌕</span>' +
          '<input type="text" id="cmdPaletteInput" placeholder="' + (currentLang === 'zh' ? '搜索或输入命令...' : 'Search or type a command...') + '" autocomplete="off">' +
          '<span class="cmd-palette-kbd">ESC</span>' +
        '</div>' +
        '<div class="cmd-palette-results" id="cmdPaletteResults"></div>' +
      '</div>';
    document.body.appendChild(palette);

    // Keyboard shortcut
    document.addEventListener('keydown', function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCmdPalette();
      } else if (e.key === 'Escape' && cmdPaletteOpen) {
        e.preventDefault();
        closeCmdPalette();
      }
    });

    // Click overlay to close
    palette.querySelector('.cmd-palette-overlay').addEventListener('click', closeCmdPalette);

    // Input handling
    var input = document.getElementById('cmdPaletteInput');
    var selectedIndex = -1;

    input.addEventListener('input', function() {
      filterCmdPalette(this.value);
      selectedIndex = -1;
    });

    input.addEventListener('keydown', function(e) {
      var items = document.querySelectorAll('#cmdPaletteResults .cmd-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateCmdSelection(items, selectedIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        updateCmdSelection(items, selectedIndex);
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
        e.preventDefault();
        items[selectedIndex].click();
      }
    });
  }

  function toggleCmdPalette() {
    if (cmdPaletteOpen) {
      closeCmdPalette();
    } else {
      openCmdPalette();
    }
  }

  function openCmdPalette() {
    var palette = document.getElementById('cmdPalette');
    if (!palette) return;
    cmdPaletteOpen = true;
    palette.classList.add('open');
    var input = document.getElementById('cmdPaletteInput');
    input.value = '';
    setTimeout(function() { input.focus(); }, 50);
    filterCmdPalette('');
  }

  function closeCmdPalette() {
    var palette = document.getElementById('cmdPalette');
    if (!palette) return;
    cmdPaletteOpen = false;
    palette.classList.remove('open');
  }

  function updateCmdSelection(items, index) {
    items.forEach(function(item, i) {
      item.classList.toggle('selected', i === index);
    });
    if (items[index]) {
      items[index].scrollIntoView({ block: 'nearest' });
    }
  }

  function filterCmdPalette(query) {
    var results = document.getElementById('cmdPaletteResults');
    if (!results) return;
    query = query.toLowerCase().trim();

    var items = getCmdItems();
    var filtered = items.filter(function(item) {
      if (!query) return true;
      return item.keywords.some(function(kw) { return kw.toLowerCase().includes(query); }) ||
             item.title.toLowerCase().includes(query);
    });

    if (filtered.length === 0) {
      results.innerHTML = '<div class="cmd-empty">' + (currentLang === 'zh' ? '没有找到匹配项' : 'No matches found') + '</div>';
      return;
    }

    // Group by category
    var groups = {};
    filtered.forEach(function(item) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    });

    var html = '';
    var catLabels = {
      nav: currentLang === 'zh' ? '🏠 导航' : '🏠 Navigation',
      action: currentLang === 'zh' ? '⚡ 快捷操作' : '⚡ Quick Actions',
      history: currentLang === 'zh' ? '📚 灵感历史' : '📚 History'
    };

    Object.keys(groups).forEach(function(cat) {
      html += '<div class="cmd-group-label">' + (catLabels[cat] || cat) + '</div>';
      groups[cat].forEach(function(item) {
        html += '<div class="cmd-item" data-cmd="' + item.id + '">' +
          '<span class="cmd-item-icon">' + item.icon + '</span>' +
          '<span class="cmd-item-title">' + item.title + '</span>' +
          '<span class="cmd-item-shortcut">' + (item.shortcut || '') + '</span>' +
        '</div>';
      });
    });

    results.innerHTML = html;

    // Bind clicks
    results.querySelectorAll('.cmd-item').forEach(function(el) {
      el.addEventListener('click', function() {
        executeCmd(this.dataset.cmd);
      });
    });
  }

  function getCmdItems() {
    var items = [
      // Navigation
      { id: 'tab-text', category: 'nav', icon: '📝', title: currentLang === 'zh' ? '切换到文字输入' : 'Switch to Text Input', keywords: ['text', '文字', '输入'], shortcut: '' },
      { id: 'tab-file', category: 'nav', icon: '📁', title: currentLang === 'zh' ? '切换到文件上传' : 'Switch to File Upload', keywords: ['file', '文件', '上传'], shortcut: '' },
      { id: 'tab-link', category: 'nav', icon: '🔗', title: currentLang === 'zh' ? '切换到链接输入' : 'Switch to Link Input', keywords: ['link', '链接', 'url'], shortcut: '' },
      { id: 'tab-search', category: 'nav', icon: '🔍', title: currentLang === 'zh' ? '切换到搜索' : 'Switch to Search', keywords: ['search', '搜索'], shortcut: '' },
      { id: 'open-history', category: 'nav', icon: '📚', title: currentLang === 'zh' ? '打开灵感库' : 'Open Inspiration Library', keywords: ['history', 'library', '灵感库', '历史'], shortcut: '' },
      // Actions
      { id: 'capture', category: 'action', icon: '💡', title: currentLang === 'zh' ? '捕获灵感' : 'Capture Inspiration', keywords: ['capture', 'generate', '捕获', '生成'], shortcut: '⏎' },
      { id: 'regenerate', category: 'action', icon: '🔄', title: currentLang === 'zh' ? '重新生成' : 'Regenerate', keywords: ['regenerate', '重新生成', '刷新'], shortcut: '' },
      { id: 'settings', category: 'action', icon: '⚙️', title: currentLang === 'zh' ? '打开设置' : 'Open Settings', keywords: ['settings', 'api', '设置', '配置'], shortcut: '' },
      { id: 'theme', category: 'action', icon: '🎨', title: currentLang === 'zh' ? '切换主题' : 'Toggle Theme', keywords: ['theme', 'dark', 'light', '主题', '深色', '浅色'], shortcut: '' },
    ];

    // Add history items
    history.slice(0, 8).forEach(function(item, idx) {
      items.push({
        id: 'history-' + idx,
        category: 'history',
        icon: item.typeIcon || '💡',
        title: item.text,
        keywords: [item.full, item.typeName || ''],
        shortcut: '',
        _historyIndex: idx
      });
    });

    return items;
  }

  function executeCmd(cmdId) {
    closeCmdPalette();

    switch (cmdId) {
      case 'tab-text':
        switchTab('text');
        break;
      case 'tab-file':
        switchTab('file');
        break;
      case 'tab-link':
        switchTab('link');
        break;
      case 'tab-search':
        switchTab('search');
        break;
      case 'open-history':
        toggleHistory();
        break;
      case 'capture':
        var btn = document.getElementById('captureBtn');
        if (btn) btn.click();
        break;
      case 'regenerate':
        var regenBtn = document.getElementById('regenerateBtn');
        if (regenBtn && regenBtn.style.display !== 'none') regenBtn.click();
        break;
      case 'settings':
        var apiToggle = document.getElementById('apiToggle');
        if (apiToggle) apiToggle.click();
        break;
      case 'theme':
        var themeBtn = document.querySelector('.theme-toggle-btn');
        if (themeBtn) themeBtn.click();
        break;
      default:
        if (cmdId.startsWith('history-')) {
          var idx = parseInt(cmdId.replace('history-', ''));
          if (!isNaN(idx) && history[idx]) {
            loadHistoryItem(idx);
          }
        }
    }
  }

  function switchTab(tabName) {
    document.querySelectorAll('.input-tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.input-pane').forEach(function(p) { p.classList.remove('active'); });
    var tab = document.querySelector('[data-tab="' + tabName + '"]');
    if (tab) tab.classList.add('active');
    var pane = document.getElementById('pane-' + tabName);
    if (pane) pane.classList.add('active');
    activeTab = tabName;
  }

  function toggleHistory() {
    var btn = document.getElementById('historyBtn');
    if (btn) btn.click();
  }

  function loadHistoryItem(idx) {
    var item = history[idx];
    if (!item) return;
    var textarea = document.getElementById('inspirationInput');
    if (textarea) textarea.value = item.full;
    switchTab('text');
    var historyArea = document.getElementById('historyArea');
    if (historyArea) historyArea.classList.remove('active');
    var historyBtn = document.getElementById('historyBtn');
    if (historyBtn && t) historyBtn.textContent = t('historyBtn');
    // Render result
    var resultToRender = null;
    if (item.result) {
      var hasGraph = item.result.graph && item.result.graph.length;
      var hasSwot = item.result.swot && item.result.swot.s && item.result.swot.s.length && item.result.swot.w && item.result.swot.w.length;
      var hasActions = item.result.actions && item.result.actions.length;
      var hasTimeline = item.result.timeline && item.result.timeline.length;
      if (hasGraph && hasSwot && hasActions && hasTimeline) {
        resultToRender = item.result;
      }
    }
    if (!resultToRender) {
      resultToRender = generateByType(item.full, item.type || detectType(item.full));
    }
    if (typeof renderResultFromData === 'function') {
      renderResultFromData(resultToRender, item.full, item.type || detectType(item.full));
    }
    // Scroll to results
    var results = document.querySelector('.results');
    if (results) results.classList.add('active');
    window.scrollTo({ top: document.querySelector('.results').offsetTop - 20, behavior: 'smooth' });
  }

  // ============================================================
  // Feature 3: Related Inspirations (bottom of result)
  // ============================================================
  function initRelatedInspirations() {
    // Create container after the inspiration card
    var inspCard = document.querySelector('.inspiration-card');
    if (!inspCard) return;

    var relatedDiv = document.createElement('div');
    relatedDiv.id = 'relatedInspirations';
    relatedDiv.className = 'related-inspirations';
    relatedDiv.style.display = 'none';
    relatedDiv.innerHTML =
      '<div class="related-title">' + (currentLang === 'zh' ? '📎 相关灵感' : '📎 Related Inspirations') + '</div>' +
      '<div class="related-list" id="relatedList"></div>';

    // Insert after the inspiration card's parent result-card
    var resultCard = inspCard.closest('.result-card');
    if (resultCard && resultCard.nextSibling) {
      resultCard.parentNode.insertBefore(relatedDiv, resultCard.nextSibling);
    } else if (resultCard) {
      resultCard.parentNode.appendChild(relatedDiv);
    }
  }

  function renderRelatedInspirations(currentText) {
    var container = document.getElementById('relatedInspirations');
    var list = document.getElementById('relatedList');
    if (!container || !list || !currentText || !history || history.length === 0) {
      if (container) container.style.display = 'none';
      return;
    }

    // Extract keywords from current text
    var currentKeywords = extractSimpleKeywords(currentText);
    if (currentKeywords.length === 0) {
      container.style.display = 'none';
      return;
    }

    // Calculate similarity for each history item
    var scored = history.map(function(item, idx) {
      if (item.full === currentText) return { item: item, idx: idx, score: -1 }; // skip self
      var itemKeywords = extractSimpleKeywords(item.full);
      var overlap = currentKeywords.filter(function(kw) {
        return itemKeywords.some(function(ikw) {
          return ikw === kw || ikw.includes(kw) || kw.includes(ikw);
        });
      }).length;
      // Normalize by keyword count
      var score = overlap / Math.max(currentKeywords.length, 1);
      return { item: item, idx: idx, score: score };
    }).filter(function(x) { return x.score > 0.1; }) // threshold
      .sort(function(a, b) { return b.score - a.score; })
      .slice(0, 3);

    if (scored.length === 0) {
      container.style.display = 'none';
      return;
    }

    list.innerHTML = scored.map(function(s) {
      return '<div class="related-item" data-idx="' + s.idx + '">' +
        '<span class="related-icon">' + (s.item.typeIcon || '💡') + '</span>' +
        '<span class="related-text">' + escapeHtml(s.item.text) + '</span>' +
        '<span class="related-score">' + Math.round(s.score * 100) + '%</span>' +
      '</div>';
    }).join('');

    // Bind clicks
    list.querySelectorAll('.related-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var idx = parseInt(this.dataset.idx);
        if (!isNaN(idx)) loadHistoryItem(idx);
      });
    });

    container.style.display = 'block';
  }

  function extractSimpleKeywords(text) {
    if (!text) return [];
    // Simple keyword extraction: split by common delimiters, filter short words
    var words = text.toLowerCase()
      .replace(/[^\w\u4e00-\u9fa5\s]/g, ' ')
      .split(/\s+/)
      .filter(function(w) { return w.length >= 2; });

    // For Chinese, also extract 2-4 char substrings
    var chineseWords = [];
    var chineseRegex = /[\u4e00-\u9fa5]{2,4}/g;
    var match;
    while ((match = chineseRegex.exec(text)) !== null) {
      chineseWords.push(match[0]);
    }

    return [...new Set([...words, ...chineseWords])].slice(0, 20);
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ============================================================
  // Feature 4: AI Polish (AI 润色灵感)
  // ============================================================
  var isPolishing = false;
  var polishAbortController = null;

  function initPolishFeature() {
    var polishBtn = document.getElementById('polishBtn');
    if (!polishBtn) return;

    // Check if Ollama is available to decide whether to show the button
    if (!BASE_URL || !MODEL) {
      polishBtn.style.display = 'none';
      return;
    }

    polishBtn.addEventListener('click', handlePolishClick);
  }

  function handlePolishClick() {
    if (isPolishing) {
      // Cancel if already polishing
      cancelPolish();
      return;
    }

    var textarea = document.getElementById('inspirationInput');
    if (!textarea) return;

    var text = textarea.value.trim();
    if (!text) {
      showToast(currentLang === 'zh' ? '请先输入灵感内容' : 'Please enter your idea first');
      textarea.focus();
      return;
    }

    if (text.length < 5) {
      showToast(currentLang === 'zh' ? '内容太短，不需要润色' : 'Content is too short to polish');
      return;
    }

    startPolish(text);
  }

  function startPolish(text) {
    var polishBtn = document.getElementById('polishBtn');
    var textarea = document.getElementById('inspirationInput');
    if (!polishBtn || !textarea) return;

    isPolishing = true;
    polishBtn.textContent = currentLang === 'zh' ? '⏹ 停止润色' : '⏹ Stop';
    polishBtn.style.borderColor = 'var(--bad)';
    polishBtn.style.color = 'var(--bad)';

    // Store original text for potential revert
    textarea._originalText = text;

    // Prepare prompt
    var isZh = currentLang === 'zh';
    var systemPrompt = isZh
      ? '你是一个创意写作助手。请将用户的灵感想法润色得更清晰、更有条理、更有说服力，保持原意不变，用更精炼的语言表达。直接输出润色后的文本，不要解释，不要加引号。'
      : 'You are a creative writing assistant. Polish the user\'s idea to make it clearer, more structured, and more compelling. Keep the original meaning, use more refined language. Directly output the polished text, no explanation, no quotes.';

    var userPrompt = isZh
      ? '请润色以下灵感想法：\n\n' + text + '\n\n润色后的版本：'
      : 'Please polish the following idea:\n\n' + text + '\n\nPolished version:';

    var messages = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    // Create AbortController for cancellation
    if (typeof AbortController !== 'undefined') {
      polishAbortController = new AbortController();
    }

    var fullText = '';
    var started = false;

    fetch(BASE_URL + '/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: MODEL, messages: messages, stream: true, options: { temperature: 0.85, num_predict: 1024 } }),
      signal: polishAbortController ? polishAbortController.signal : undefined
    })
    .then(function(res) {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      if (!res.body) throw new Error('No stream support');

      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = '';

      function read() {
        reader.read().then(function(_ref) {
          var done = _ref.done;
          var value = _ref.value;

          if (done) {
            finishPolish(fullText);
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          var lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line || line.indexOf('data:') !== 0) continue;
            var data = line.substring(5).trim();
            if (!data || data === '[DONE]') continue;
            try {
              var json = JSON.parse(data);
              if (json.message && json.message.content) {
                fullText += json.message.content;
                if (!started && fullText.trim()) {
                  started = true;
                }
                // Update textarea in real-time (append mode)
                if (started) {
                  textarea.value = fullText;
                  textarea.scrollTop = textarea.scrollHeight;
                }
              }
            } catch (e) {}
          }

          read();
        }).catch(function(err) {
          if (err.name === 'AbortError') {
            // User cancelled
            finishPolish(fullText, true);
          } else {
            console.error('Polish stream error:', err);
            finishPolish(fullText);
          }
        });
      }

      read();
    })
    .catch(function(err) {
      console.error('Polish API error:', err);
      // Graceful degradation: hide button and show toast
      var polishBtn = document.getElementById('polishBtn');
      if (polishBtn) polishBtn.style.display = 'none';
      showToast(currentLang === 'zh' ? '⚠️ AI 润色不可用，已隐藏按钮' : '⚠️ AI polish unavailable, button hidden');
      isPolishing = false;
    });
  }

  function cancelPolish() {
    if (polishAbortController) {
      polishAbortController.abort();
      polishAbortController = null;
    }
    isPolishing = false;
    resetPolishButton();
  }

  function finishPolish(text, cancelled) {
    isPolishing = false;
    resetPolishButton();

    if (cancelled) {
      showToast(currentLang === 'zh' ? '已停止润色' : 'Polishing stopped');
      return;
    }

    if (!text || !text.trim()) {
      showToast(currentLang === 'zh' ? '润色失败：未生成内容' : 'Polish failed: no content generated');
      return;
    }

    var textarea = document.getElementById('inspirationInput');
    if (textarea) {
      textarea.value = text.trim();
    }

    showToast(currentLang === 'zh' ? '✨ 润色完成！' : '✨ Polished!');
  }

  function resetPolishButton() {
    var polishBtn = document.getElementById('polishBtn');
    if (!polishBtn) return;
    polishBtn.textContent = currentLang === 'zh' ? '✨ 润色' : '✨ Polish';
    polishBtn.style.borderColor = '';
    polishBtn.style.color = '';
  }

  // ============================================================
  // Feature 5: Ollama Interaction Logs
  // ============================================================
  var ollamaLogs = [];
  var MAX_LOGS = 100;
  var logSeq = 0;

  // Log type constants
  var LOG_TYPE = {
    REQUEST: 'request',
    RESPONSE: 'response',
    ERROR: 'error',
    INFO: 'info'
  };

  // Add a log entry
  function addOllamaLog(type, endpoint, data, extra) {
    logSeq++;
    var entry = {
      id: logSeq,
      timestamp: new Date().toISOString(),
      type: type,
      endpoint: endpoint,
      model: MODEL || 'unknown',
      data: data,
      extra: extra || {}
    };
    ollamaLogs.unshift(entry);
    if (ollamaLogs.length > MAX_LOGS) {
      ollamaLogs = ollamaLogs.slice(0, MAX_LOGS);
    }
    // Also log to console for debugging
    console.log('[Ollama Log]', type, endpoint, extra || '');
  }

  // Wrap fetch calls to log them
  var _origFetch = window.fetch;
  window.fetch = function(url, options) {
    var isOllama = typeof url === 'string' && url.indexOf(BASE_URL) === 0;
    var isChat = isOllama && url.indexOf('/api/chat') !== -1;
    var isTags = isOllama && url.indexOf('/api/tags') !== -1;
    var isGenerate = isOllama && url.indexOf('/api/generate') !== -1;

    if (!isOllama) {
      return _origFetch.apply(this, arguments);
    }

    var endpoint = url.replace(BASE_URL, '');
    var startTime = Date.now();
    var requestBody = null;

    // Log request
    try {
      if (options && options.body) {
        requestBody = JSON.parse(options.body);
        // Don't store full system prompt to save space
        if (requestBody.messages && requestBody.messages.length > 2) {
          requestBody.messageCount = requestBody.messages.length;
        }
      }
    } catch (e) {}

    addOllamaLog(LOG_TYPE.REQUEST, endpoint, requestBody, {
      method: options ? options.method : 'GET'
    });

    return _origFetch.apply(this, arguments).then(function(response) {
      // Clone response so we can read it without consuming the original
      var cloned = response.clone();
      var status = response.status;
      var duration = Date.now() - startTime;

      // For stream responses, we can't easily log full response body,
      // so we log status and timing
      if (isChat || isGenerate) {
        addOllamaLog(LOG_TYPE.RESPONSE, endpoint, null, {
          status: status,
          durationMs: duration,
          streaming: true
        });
      } else {
        // For non-stream endpoints, try to log the response body
        cloned.json().then(function(data) {
          addOllamaLog(LOG_TYPE.RESPONSE, endpoint, data, {
            status: status,
            durationMs: duration
          });
        }).catch(function() {
          addOllamaLog(LOG_TYPE.RESPONSE, endpoint, null, {
            status: status,
            durationMs: duration
          });
        });
      }

      return response;
    }).catch(function(error) {
      var duration = Date.now() - startTime;
      addOllamaLog(LOG_TYPE.ERROR, endpoint, null, {
        error: error.message || String(error),
        durationMs: duration
      });
      throw error;
    });
  };

  // Log viewer initialization
  function initLogViewer() {
    var logBtn = document.getElementById('apiLogBtn');
    if (!logBtn) return;

    logBtn.addEventListener('click', openLogViewer);

    // Create log panel HTML
    var panel = document.createElement('div');
    panel.id = 'logViewerPanel';
    panel.className = 'log-viewer-overlay';
    panel.innerHTML =
      '<div class="log-viewer-modal">' +
        '<div class="log-viewer-header">' +
          '<h3>📋 Ollama 交互日志</h3>' +
          '<div class="log-viewer-actions">' +
            '<select id="logFilterSelect" class="log-filter-select">' +
              '<option value="all">全部</option>' +
              '<option value="request">请求</option>' +
              '<option value="response">响应</option>' +
              '<option value="error">错误</option>' +
            '</select>' +
            '<button id="logRefreshBtn" class="log-btn" title="刷新">🔄</button>' +
            '<button id="logExportBtn" class="log-btn" title="导出JSON">⬇️</button>' +
            '<button id="logClearBtn" class="log-btn log-btn-danger" title="清空">🗑️</button>' +
            '<button id="logCloseBtn" class="log-btn" title="关闭">✕</button>' +
          '</div>' +
        '</div>' +
        '<div class="log-viewer-stats" id="logStats"></div>' +
        '<div class="log-viewer-list" id="logList"></div>' +
      '</div>';
    document.body.appendChild(panel);

    // Bind events
    panel.querySelector('.log-viewer-overlay, #logCloseBtn').addEventListener ? null : null;
    panel.addEventListener('click', function(e) {
      if (e.target === panel || e.target.classList.contains('log-viewer-overlay')) {
        closeLogViewer();
      }
    });
    document.getElementById('logCloseBtn').addEventListener('click', closeLogViewer);
    document.getElementById('logClearBtn').addEventListener('click', clearLogs);
    document.getElementById('logExportBtn').addEventListener('click', exportLogs);
    document.getElementById('logRefreshBtn').addEventListener('click', renderLogList);
    document.getElementById('logFilterSelect').addEventListener('change', renderLogList);
  }

  function openLogViewer() {
    var panel = document.getElementById('logViewerPanel');
    if (!panel) return;
    panel.classList.add('open');
    renderLogList();
    // Lock body scroll
    document.body.style.overflow = 'hidden';
  }

  function closeLogViewer() {
    var panel = document.getElementById('logViewerPanel');
    if (!panel) return;
    panel.classList.remove('open');
    document.body.style.overflow = '';
  }

  function clearLogs() {
    if (!confirm(currentLang === 'zh' ? '确定要清空所有日志吗？' : 'Clear all logs?')) return;
    ollamaLogs = [];
    logSeq = 0;
    renderLogList();
    showToast(currentLang === 'zh' ? '日志已清空' : 'Logs cleared');
  }

  function exportLogs() {
    if (ollamaLogs.length === 0) {
      showToast(currentLang === 'zh' ? '没有可导出的日志' : 'No logs to export');
      return;
    }
    var dataStr = JSON.stringify(ollamaLogs, null, 2);
    var blob = new Blob([dataStr], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ollama-logs-' + new Date().toISOString().replace(/[:.]/g, '-') + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(currentLang === 'zh' ? '日志已导出' : 'Logs exported');
  }

  function renderLogList() {
    var listEl = document.getElementById('logList');
    var statsEl = document.getElementById('logStats');
    var filter = document.getElementById('logFilterSelect').value;

    if (!listEl || !statsEl) return;

    var filtered = filter === 'all'
      ? ollamaLogs
      : ollamaLogs.filter(function(l) { return l.type === filter; });

    // Stats
    var total = ollamaLogs.length;
    var errors = ollamaLogs.filter(function(l) { return l.type === LOG_TYPE.ERROR; }).length;
    var requests = ollamaLogs.filter(function(l) { return l.type === LOG_TYPE.REQUEST; }).length;
    var responses = ollamaLogs.filter(function(l) { return l.type === LOG_TYPE.RESPONSE; }).length;

    statsEl.innerHTML =
      '<span class="log-stat"><span class="log-stat-label">总记录</span><span class="log-stat-val">' + total + '</span></span>' +
      '<span class="log-stat"><span class="log-stat-label">请求</span><span class="log-stat-val">' + requests + '</span></span>' +
      '<span class="log-stat"><span class="log-stat-label">响应</span><span class="log-stat-val">' + responses + '</span></span>' +
      '<span class="log-stat log-stat-error"><span class="log-stat-label">错误</span><span class="log-stat-val">' + errors + '</span></span>';

    if (filtered.length === 0) {
      listEl.innerHTML = '<div class="log-empty">' + (currentLang === 'zh' ? '暂无日志记录' : 'No log entries') + '</div>';
      return;
    }

    var typeLabels = {
      request: { icon: '📤', label: currentLang === 'zh' ? '请求' : 'Request', cls: 'log-type-request' },
      response: { icon: '📥', label: currentLang === 'zh' ? '响应' : 'Response', cls: 'log-type-response' },
      error: { icon: '❌', label: currentLang === 'zh' ? '错误' : 'Error', cls: 'log-type-error' },
      info: { icon: 'ℹ️', label: currentLang === 'zh' ? '信息' : 'Info', cls: 'log-type-info' }
    };

    listEl.innerHTML = filtered.map(function(log) {
      var t = typeLabels[log.type] || typeLabels.info;
      var time = new Date(log.timestamp).toLocaleTimeString('zh-CN', { hour12: false });
      var duration = log.extra && log.extra.durationMs ? ' (' + log.extra.durationMs + 'ms)' : '';
      var status = log.extra && log.extra.status ? ' [HTTP ' + log.extra.status + ']' : '';
      var model = log.model ? ' [' + log.model + ']' : '';
      var summary = '';

      if (log.type === LOG_TYPE.REQUEST && log.data) {
        if (log.data.messages) {
          var lastMsg = log.data.messages[log.data.messages.length - 1];
          if (lastMsg && lastMsg.content) {
            summary = lastMsg.content.substring(0, 100) + (lastMsg.content.length > 100 ? '...' : '');
          }
        } else if (log.data.prompt) {
          summary = (log.data.prompt + '').substring(0, 100);
        }
      } else if (log.type === LOG_TYPE.ERROR && log.extra && log.extra.error) {
        summary = log.extra.error;
      } else if (log.type === LOG_TYPE.RESPONSE && log.data) {
        if (log.data.models) {
          summary = currentLang === 'zh' ? (log.data.models.length + ' 个模型') : (log.data.models.length + ' models');
        } else if (log.data.message && log.data.message.content) {
          summary = log.data.message.content.substring(0, 100);
        } else if (log.data.response) {
          summary = log.data.response.substring(0, 100);
        }
      }

      return '<div class="log-item ' + t.cls + '" data-log-id="' + log.id + '">' +
        '<div class="log-item-header">' +
          '<span class="log-type-badge">' + t.icon + ' ' + t.label + '</span>' +
          '<span class="log-endpoint">' + log.endpoint + '</span>' +
          '<span class="log-time">' + time + duration + status + model + '</span>' +
        '</div>' +
        (summary ? '<div class="log-item-summary">' + escapeHtml(summary) + '</div>' : '') +
        '<div class="log-item-detail" style="display:none;">' +
          '<pre>' + escapeHtml(JSON.stringify(log.data || log.extra, null, 2)) + '</pre>' +
        '</div>' +
      '</div>';
    }).join('');

    // Bind expand/collapse
    listEl.querySelectorAll('.log-item').forEach(function(item) {
      item.addEventListener('click', function() {
        var detail = this.querySelector('.log-item-detail');
        if (detail) {
          detail.style.display = detail.style.display === 'none' ? 'block' : 'none';
        }
      });
    });
  }

  // Initialize all new features after DOM ready
  function initNewFeatures() {
    initCommandPalette();
    initInlineEdit();
    initRelatedInspirations();
    initPolishFeature();
    initLogViewer();
  }

  // Auto-init when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewFeatures);
  } else {
    initNewFeatures();
  }
})();

// ============================================================
//  🩹 历史灵感润色功能修复补丁（2026-07-12）
//  直接追加到 demo.js 最底部
// ============================================================
(function fixHistoryPolish() {
  // 工具：从任意元素提取纯文本（去除所有 HTML 标签）
  function getPureText(el) {
    if (!el) return '';
    if (typeof el === 'string') return el;
    return el.textContent || el.innerText || '';
  }

  // 核心润色请求（带超时 + 降级）
  async function requestPolish(text) {
    if (!text || text.trim().length === 0) throw new Error('内容为空');
    const trimmed = text.slice(0, 2000);
    const baseUrl = document.getElementById('apiBaseUrl')?.value || 'http://localhost:11434';
    const model = document.getElementById('apiModel')?.value || 'llama3';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      const resp = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: model,
          prompt: `请将以下中文文本润色得更通顺、更有逻辑性，保持原意不变，只输出润色后的结果：\n\n${trimmed}`,
          stream: false,
          temperature: 0.85,
          num_predict: 1024
        })
      });
      clearTimeout(timeoutId);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      return data.response || null;
    } catch (err) {
      clearTimeout(timeoutId);
      console.warn('Ollama请求失败，使用本地降级:', err);
      // 本地降级：补标点、去多余空格
      let fallback = trimmed.trim();
      if (!/[。！？.!?]$/.test(fallback)) fallback += '。';
      fallback = fallback.replace(/，。/g, '。');
      return fallback;
    }
  }

  // 事件委托：拦截所有润色按钮点击
  document.addEventListener('click', async function(e) {
    const btn = e.target.closest('.polish-btn, #polishBtn, [data-action="polish"]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();

    // 1. 提取待润色的纯文本（按优先级）
    let sourceText = '';
    const container = btn.closest('.history-item, .inspiration-card, .result-card');
    if (container) {
      // 优先从 data-text 取（如果历史条目有存储）
      sourceText = container.dataset.text || '';
      if (!sourceText) {
        const contentEl = container.querySelector('.content');
        if (contentEl) sourceText = getPureText(contentEl);
      }
      if (!sourceText) sourceText = getPureText(container);
    }
    // 若未找到，从当前输入框取
    if (!sourceText) {
      const input = document.getElementById('inspirationInput');
      if (input) sourceText = input.value.trim();
    }
    // 最后从其他灵感输入框取
    if (!sourceText) {
      const others = document.querySelectorAll('#searchInspirationInput, #fileInspirationInput, #linkInspirationInput');
      for (let ta of others) {
        if (ta.value.trim()) { sourceText = ta.value.trim(); break; }
      }
    }
    if (!sourceText) {
      alert('💡 没有找到可润色的内容，请先输入灵感或选中一条历史记录。');
      return;
    }

    // 2. 执行润色
    const origText = btn.textContent;
    btn.textContent = '⏳ 润色中...';
    btn.disabled = true;
    try {
      const polished = await requestPolish(sourceText);
      // 显示结果
      const optOrig = document.getElementById('optOriginal');
      const optImp = document.getElementById('optImproved');
      const optCard = document.getElementById('optimizeCard');
      if (optOrig && optImp && optCard) {
        optOrig.textContent = sourceText;
        optImp.textContent = polished;
        optCard.style.display = 'block';
        optCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        showToast('✨ 润色完成！');
      } else {
        alert(`✨ 润色结果：\n\n${polished}`);
      }
    } catch (err) {
      console.error(err);
      alert(`⚠️ 润色失败：${err.message}，请检查 Ollama 是否运行。`);
    } finally {
      btn.textContent = origText || '✨ 润色';
      btn.disabled = false;
    }
  });

  // 复用已有的 Toast
  function showToast(msg) {
    const t = document.getElementById('toast');
    if (t) {
      t.textContent = msg;
      t.classList.add('show');
      clearTimeout(t._timer);
      t._timer = setTimeout(() => t.classList.remove('show'), 3000);
    } else console.log('Toast:', msg);
  }

  console.log('✅ 历史润色补丁已生效');
})();

