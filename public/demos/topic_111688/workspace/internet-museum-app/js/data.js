/**
 * Internet Museum - Data Layer
 * ==============================
 * Data models:
 *   - Item: a collected piece of content (link, text, screenshot)
 *   - Gallery: a curated collection of items (a "room" in the museum)
 *   - Tag: category label
 *   - Timeline: chronological event grouping
 *   - Persona: user's internet identity portrait
 */

// ===== Demo Data =====
const DEMO_ITEMS = [
  {
    id: 'item-1',
    title: 'ReAct: Synergizing Reasoning and Acting in Language Models',
    url: 'https://arxiv.org/abs/2210.03629',
    type: 'article',
    excerpt: 'A new paradigm that combines reasoning traces and task-specific actions in LLMs...',
    dateAdded: '2024-03-15',
    tags: ['AI', 'LLM', 'Agent'],
    galleryId: 'gallery-ai',
    source: '手动收藏',
    curationReason: '这条内容同时涉及 AI Agent、推理与行动范式，成为你关注智能代理系统的起点。'
  },
  {
    id: 'item-2',
    title: 'LangChain 框架入门指南',
    url: 'https://python.langchain.com/docs/get_started/introduction',
    type: 'article',
    excerpt: 'LangChain 是一个用于开发大语言模型应用的框架，提供了链式调用、代理、记忆等模块...',
    dateAdded: '2024-04-02',
    tags: ['AI', 'LangChain', 'Python'],
    galleryId: 'gallery-ai',
    source: '手动收藏',
    curationReason: '作为构建 LLM 应用的框架，它与你的 Agent 探索轨迹高度相关。'
  },
  {
    id: 'item-3',
    title: '城市漫步：上海梧桐区的街道尺度观察',
    url: 'https://example.com/city-walk-shanghai',
    type: 'article',
    excerpt: '梧桐区的街道宽度、建筑高度与行人体验之间的关系研究...',
    dateAdded: '2024-05-20',
    tags: ['城市', '建筑', '观察'],
    galleryId: 'gallery-city',
    source: '手动收藏',
    curationReason: '对街道尺度和行人体验的关注，标志着你开始用空间视角观察城市。'
  },
  {
    id: 'item-4',
    title: '深度工作：如何有效利用每一点脑力',
    url: 'https://example.com/deep-work',
    type: 'book',
    excerpt: 'Cal Newport 的经典著作，探讨在碎片化的时代如何保持专注...',
    dateAdded: '2024-06-10',
    tags: ['生产力', '阅读', '个人成长'],
    galleryId: 'gallery-study',
    source: '手动收藏',
    curationReason: '这是一本关于学习和专注方法论的书，被归入你的学习与研究轨迹。'
  },
  {
    id: 'item-5',
    title: 'Screenshot: 某项目架构讨论白板',
    url: '',
    type: 'screenshot',
    excerpt: '项目初期的系统架构设计讨论，包含微服务拆分思路...',
    dateAdded: '2024-07-05',
    tags: ['工作', '架构'],
    galleryId: 'gallery-uncategorized',
    source: '截图导入',
    curationReason: '这张截图涉及项目架构，但现有展厅中没有完全匹配的主题，暂入未分类展厅。'
  },
  {
    id: 'item-6',
    title: 'AutoGPT: 一个自主运行的 AI 代理实验',
    url: 'https://github.com/Significant-Gravitas/AutoGPT',
    type: 'project',
    excerpt: '使 GPT-4 能够自主思考、规划并执行任务的实验性项目...',
    dateAdded: '2024-08-12',
    tags: ['AI', 'Agent', '开源'],
    galleryId: 'gallery-ai',
    source: '手动收藏',
    curationReason: 'AutoGPT 是你探索自主 AI Agent 的重要实验，与展厅主题高度一致。'
  },
  {
    id: 'item-7',
    title: '习惯的力量：为什么我们会这样做',
    url: 'https://example.com/power-of-habit',
    type: 'book',
    excerpt: 'Charles Duhigg 探讨习惯形成的神经科学原理...',
    dateAdded: '2024-02-28',
    tags: ['心理学', '阅读', '个人成长'],
    galleryId: 'gallery-study',
    source: '手动收藏',
    curationReason: '关于习惯形成机制的研究，属于你的学习与研究兴趣范畴。'
  },
  {
    id: 'item-8',
    title: '东京的「小尺度」公共空间设计',
    url: 'https://example.com/tokyo-public-space',
    type: 'article',
    excerpt: '在密集的城市肌理中，东京如何通过微小公共空间提升社区活力...',
    dateAdded: '2024-09-03',
    tags: ['城市', '设计', '日本'],
    galleryId: 'gallery-city',
    source: '手动收藏',
    curationReason: '从建筑审美转向对社区营造和公共空间使用的关注。'
  },
  {
    id: 'item-9',
    title: 'Cursor：AI 原生代码编辑器',
    url: 'https://cursor.com',
    type: 'project',
    excerpt: 'Cursor 是一款由 AI 驱动的代码编辑器，正在重新定义开发工作流...',
    dateAdded: '2025-01-10',
    tags: ['AI', '工具', '编程', 'Cursor'],
    galleryId: 'gallery-ai',
    source: '手动收藏',
    curationReason: '你开始关注把 AI 嵌入创作工具本身，而不仅仅是使用 AI 应用。'
  },
  {
    id: 'item-10',
    title: '独立开发者如何找到第一个付费用户',
    url: 'https://example.com/indie-hacker-first-dollar',
    type: 'article',
    excerpt: '从验证想法到获得第一个付费用户的完整路径...',
    dateAdded: '2025-04-15',
    tags: ['创业', '独立开发', '增长', 'SaaS'],
    galleryId: 'gallery-startup',
    source: '手动收藏',
    curationReason: '你收藏的独立开发和获客内容，显示你正在从关注工具转向关注产品价值。'
  },
  {
    id: 'item-11',
    title: 'Vibe Coding：用 AI  vibe 写代码',
    url: 'https://example.com/vibe-coding',
    type: 'article',
    excerpt: '一种新兴的编程方式：描述意图，让 AI 生成并迭代代码...',
    dateAdded: '2025-06-20',
    tags: ['AI', '编程', '创造', 'Vibe Coding'],
    galleryId: 'gallery-ai',
    source: '手动收藏',
    curationReason: 'Vibe Coding 代表了你从使用 AI 到用 AI 创造的转变。'
  }
];

const DEMO_GALLERIES = [
  {
    id: 'gallery-ai',
    name: '机器正在成为同事：AI 工具展',
    description: '关于大语言模型、AI Agent 和自动化工具的探索轨迹。这里记录了人类与机器协作方式的每一次重新定义。',
    theme: 'AI 与工具',
    coverImage: 'assets/hero_1280x720.jpg',
    itemCount: 5,
    tags: ['AI', 'LLM', 'Agent', '开源', 'Cursor', 'Vibe Coding'],
    createdAt: '2024-03-15',
    updatedAt: '2025-06-20',
    curatorNote: '你反复收藏关于 AI Agent 和自动化工作流的内容，说明你正在从使用工具转向思考系统如何替人完成任务。'
  },
  {
    id: 'gallery-city',
    name: '城市如何被看见：空间与生活展',
    description: '城市空间、建筑尺度与社区营造的观察笔记。从建筑审美走向对「人如何生活在城市中」的深层思考。',
    theme: '城市与生活观察',
    coverImage: 'assets/gallery_city_1024x576.jpg',
    itemCount: 2,
    tags: ['城市', '建筑', '设计'],
    createdAt: '2024-05-20',
    updatedAt: '2024-09-03',
    curatorNote: '你对街道尺度和公共空间的持续关注，显示出从审美欣赏转向理解城市生活结构的兴趣迁移。'
  },
  {
    id: 'gallery-study',
    name: '一段学习轨迹：研究与知识展',
    description: '阅读、思考与知识积累的记录。不同时期关注的方法论，折射出认知升级的轨迹。',
    theme: '学习与研究',
    coverImage: 'assets/gallery_growth_1024x576.jpg',
    itemCount: 2,
    tags: ['阅读', '生产力', '心理学'],
    createdAt: '2024-02-28',
    updatedAt: '2024-06-10',
    curatorNote: '你收藏的阅读和思考方法类内容，勾勒出一条持续自我迭代的个人知识路径。'
  },
  {
    id: 'gallery-startup',
    name: '从灵感到产品：创业与增长展',
    description: '从想法到产品的路径上，你收藏的每一篇文章都是一次关于增长、用户和商业模型的思考实验。',
    theme: '创业与产品',
    coverImage: 'assets/hero_1280x720.jpg',
    itemCount: 1,
    tags: ['创业', '独立开发', '增长', 'SaaS'],
    createdAt: '2025-04-15',
    updatedAt: '2025-04-15',
    curatorNote: '你对产品、增长和商业模型的持续关注，显示出一种把想法转化为价值的系统性兴趣。'
  },
  {
    id: 'gallery-uncategorized',
    name: '尚未命名的兴趣：未分类展厅',
    description: '暂时还没有被归入明确主题的内容。它们可能在等待更多同类展品，形成一个新展厅。',
    theme: '未分类',
    coverImage: 'assets/hero_1280x720.jpg',
    itemCount: 1,
    tags: ['未分类'],
    createdAt: '2024-07-05',
    updatedAt: '2024-07-05',
    curatorNote: '这些内容还不够多，无法判断你真正的长期兴趣方向，但它们可能正在酝酿一个新的主题。'
  }
];

const DEMO_TAGS = [
  { id: 'tag-ai', name: 'AI', color: '#b8956a', count: 6 },
  { id: 'tag-agent', name: 'Agent', color: '#b8956a', count: 4 },
  { id: 'tag-llm', name: 'LLM', color: '#b8956a', count: 2 },
  { id: 'tag-city', name: '城市', color: '#8c7352', count: 2 },
  { id: 'tag-startup', name: '创业', color: '#5a8c6f', count: 2 },
  { id: 'tag-study', name: '学习', color: '#5a8c6f', count: 2 },
  { id: 'tag-reading', name: '阅读', color: '#5a8c6f', count: 2 },
  { id: 'tag-productivity', name: '生产力', color: '#5a8c6f', count: 1 },
  { id: 'tag-uncategorized', name: '未分类', color: '#9a9896', count: 1 }
];

const DEMO_TIMELINE = [
  {
    id: 'tl-1',
    title: '开始关注 AI 工具',
    stage: '探索期',
    date: '2024-03',
    type: 'milestone',
    galleryId: 'gallery-ai',
    itemIds: ['item-1', 'item-2'],
    description: '第一次阅读 ReAct 论文，探索 LangChain 框架',
    aiInsight: '你开始关注如何提升个人效率，对让 AI 协助思考产生了浓厚兴趣。'
  },
  {
    id: 'tl-2',
    title: '城市与生活观察',
    stage: '审美期',
    date: '2024-05',
    type: 'milestone',
    galleryId: 'gallery-city',
    itemIds: ['item-3'],
    description: '从街道尺度到公共空间，开始用空间视角理解城市',
    aiInsight: '在关注效率工具的同时，你也在培养自己的审美和空间感知力。'
  },
  {
    id: 'tl-3',
    title: '探索 AI 自主代理',
    stage: '深化期',
    date: '2024-08',
    type: 'event',
    galleryId: 'gallery-ai',
    itemIds: ['item-6'],
    description: '尝试 AutoGPT，探索 AI 自主行动的可能性',
    aiInsight: '你不再满足于让 AI 回答问题，而是开始思考它能否独立完成任务。'
  },
  {
    id: 'tl-4',
    title: 'AI 嵌入创作工具',
    stage: '实践期',
    date: '2025-01',
    type: 'event',
    galleryId: 'gallery-ai',
    itemIds: ['item-9'],
    description: '关注 Cursor 等 AI 原生编辑器',
    aiInsight: '你正在把 AI 从一种对话工具，变成日常创作环境的一部分。'
  },
  {
    id: 'tl-5',
    title: '寻找产品机会',
    stage: '转化期',
    date: '2025-04',
    type: 'milestone',
    galleryId: 'gallery-startup',
    itemIds: ['item-10'],
    description: '从关注工具转向关注如何创造价值',
    aiInsight: '你的兴趣从「用什么工具」转向「做什么产品」，正在形成创造者思维。'
  },
  {
    id: 'tl-6',
    title: '用 AI 创造',
    stage: '创造期',
    date: '2025-06',
    type: 'milestone',
    galleryId: 'gallery-ai',
    itemIds: ['item-11'],
    description: 'Vibe Coding：把想法通过 AI 快速变成现实',
    aiInsight: '你开始尝试把想法直接转化为产品，AI 不再只是助手，而是创作伙伴。'
  }
];

const DEMO_PERSONA = {
  id: 'persona-1',
  title: '探索型创造者',
  summary: '过去一年多，你持续关注 AI 工具、独立产品和设计趋势，正在从工具使用者转向创造者。',
  interests: ['AI Agent', '独立产品', '城市空间', 'Vibe Coding', '设计审美'],
  personalityTraits: ['喜欢探索新工具', '关注未来趋势', '重视创造体验', '兼具审美与系统思维'],
  evolution: '从“收藏 AI 工具”到“用 AI 创造产品”，你的数字足迹勾勒出一条清晰的创造者路径。',
  curatorMessage: '如果把你的互联网收藏看作一本书，那么最近一年，你正在写关于创造力的一章。',
  topThemes: [
    { name: 'AI 与工具', count: 5, score: 100 },
    { name: '城市与生活观察', count: 2, score: 61 },
    { name: '学习与研究', count: 2, score: 61 },
    { name: '创业与产品', count: 1, score: 43 }
  ],
  radar: {
    'AI技术': 92,
    '设计审美': 61,
    '城市探索': 61,
    '创业商业': 43,
    '学习研究': 61
  }
};

// ===== AI Curator Config =====
const GALLERY_THEMES = [
  {
    id: 'gallery-ai',
    keywords: ['ai', 'agent', 'llm', 'chatgpt', 'gemini', 'claude', 'copilot', 'cursor', '自动化', '工具', 'workflow', 'productivity', 'gpt', 'openai', 'langchain', 'autogpt', 'vibe coding', '编程', '代码'],
    name: '机器正在成为同事：AI 工具展',
    theme: 'AI 与工具',
    description: '关于大语言模型、AI Agent 和自动化工具的探索轨迹。这里记录了人类与机器协作方式的每一次重新定义。',
    curatorNote: '你反复收藏关于 AI Agent 和自动化工作流的内容，说明你正在从使用工具转向思考系统如何替人完成任务。',
    coverImage: 'assets/hero_1280x720.jpg'
  },
  {
    id: 'gallery-startup',
    keywords: ['创业', '产品', '增长', '商业', 'saas', '用户', 'pmf', 'mvp', 'startup', 'marketing', '商业模式', '运营', '独立开发', '付费用户'],
    name: '从灵感到产品：创业与增长展',
    theme: '创业与产品',
    description: '从想法到产品的路径上，你收藏的每一篇文章都是一次关于增长、用户和商业模型的思考实验。',
    curatorNote: '你对产品、增长和商业模型的持续关注，显示出一种把想法转化为价值的系统性兴趣。',
    coverImage: 'assets/hero_1280x720.jpg'
  },
  {
    id: 'gallery-design',
    keywords: ['设计', 'ui', 'ux', '视觉', '审美', '摄影', '图像', '艺术', '交互', 'interface', 'typography', 'color', '品牌'],
    name: '被保存的审美瞬间：设计与视觉展',
    theme: '设计与审美',
    description: '那些被保留的视觉片段、界面细节和审美判断，共同构成你对「好设计」的不断校准。',
    curatorNote: '你对视觉、界面和审美细节的关注，暗示着你正在形成一套关于「什么是好设计」的个人标准。',
    coverImage: 'assets/gallery_city_1024x576.jpg'
  },
  {
    id: 'gallery-city',
    keywords: ['城市', '建筑', '街道', '生活', '空间', '社区', 'city', 'urban', 'architecture', '公共空间'],
    name: '城市如何被看见：空间与生活展',
    theme: '城市与生活观察',
    description: '城市空间、建筑尺度与社区营造的观察笔记。从建筑审美走向对「人如何生活在城市中」的深层思考。',
    curatorNote: '你对街道尺度和公共空间的持续关注，显示出从审美欣赏转向理解城市生活结构的兴趣迁移。',
    coverImage: 'assets/gallery_city_1024x576.jpg'
  },
  {
    id: 'gallery-study',
    keywords: ['论文', '学习', '课程', '研究', '笔记', 'paper', 'research', 'study', 'education', '读书', '阅读', '知识', '心理学', '专注'],
    name: '一段学习轨迹：研究与知识展',
    theme: '学习与研究',
    description: '阅读、思考与知识积累的记录。不同时期关注的方法论，折射出认知升级的轨迹。',
    curatorNote: '你收藏的阅读和思考方法类内容，勾勒出一条持续自我迭代的个人知识路径。',
    coverImage: 'assets/gallery_growth_1024x576.jpg'
  }
];

const UNCATEGORIZED_GALLERY = {
  id: 'gallery-uncategorized',
  name: '尚未命名的兴趣：未分类展厅',
  theme: '未分类',
  description: '暂时还没有被归入明确主题的内容。它们可能在等待更多同类展品，形成一个新展厅。',
  curatorNote: '这些内容还不够多，无法判断你真正的长期兴趣方向，但它们可能正在酝酿一个新的主题。',
  coverImage: 'assets/hero_1280x720.jpg'
};

// ===== Trait & Persona Templates =====
const PERSONA_TITLES = {
  ai_high: '探索型创造者',
  design_high: '审美型观察者',
  startup_high: '机会型 builder',
  city_high: '城市漫游者',
  study_high: '终身学习者',
  balanced: '跨界连接者',
  default: '好奇的探索者'
};

const PERSONA_MESSAGES = {
  ai_high: '如果把你的互联网收藏看作一本书，那么最近一年，你正在写关于创造力的一章。',
  design_high: '你保存的不仅是图像和界面，更是对「什么是美好」的不断追问。',
  startup_high: '你的收藏里没有停留在想法的内容，你始终在寻找把想法变成现实的路径。',
  city_high: '你透过街道、建筑和公共空间，持续观察人与环境如何相处。',
  study_high: '你的数字足迹像一本不断翻开的笔记本，记录着你对世界的好奇。',
  balanced: '你似乎不愿意被单一领域定义，而是在不同主题之间寻找连接。',
  default: '你的互联网足迹正在形成一幅独特的画像，每一次收藏都在让它更清晰。'
};

const RADAR_AXES = [
  { key: 'AI技术', theme: 'AI 与工具', keywords: ['ai', 'agent', 'llm', 'chatgpt', 'claude', 'cursor', 'vibe coding', '编程', '自动化'] },
  { key: '设计审美', theme: '设计与审美', keywords: ['设计', '审美', 'ui', 'ux', '视觉', '摄影', '艺术', '品牌'] },
  { key: '城市探索', theme: '城市与生活观察', keywords: ['城市', '建筑', '街道', '公共空间', '社区', 'urban'] },
  { key: '创业商业', theme: '创业与产品', keywords: ['创业', '产品', '增长', 'saas', '商业', '独立开发', '付费用户'] },
  { key: '学习研究', theme: '学习与研究', keywords: ['学习', '研究', '阅读', '论文', '心理学', '知识', '专注'] }
];

// ===== AI Curator =====
const AICurator = {
  /**
   * Analyze text and return matched gallery theme id + matched keywords
   */
  classify(text) {
    const lower = (text || '').toLowerCase();
    let bestMatch = null;
    let bestScore = 0;

    for (const theme of GALLERY_THEMES) {
      const matched = theme.keywords.filter(k => lower.includes(k.toLowerCase()));
      if (matched.length > bestScore) {
        bestScore = matched.length;
        bestMatch = { theme, matched };
      }
    }

    if (bestScore === 0) {
      return { theme: UNCATEGORIZED_GALLERY, matched: [] };
    }
    return bestMatch;
  },

  /**
   * Generate a human-readable curation reason
   */
  generateReason(item, theme, matched) {
    const source = item.url ? '链接' : (item.type === 'note' || item.type === 'text' ? '文本' : '内容');
    const themeName = theme.theme;
    const keywordText = matched.slice(0, 3).join('、') || theme.keywords.slice(0, 3).join('、');

    const templates = [
      `这条${source}被归入本展厅，是因为它同时提到了 ${keywordText}，与「${themeName}」的主题高度契合。`,
      `AI 策展人注意到这条${source}包含 ${keywordText} 等关键词，因此将其放入「${themeName}」展厅。`,
      `这属于你对「${themeName}」的探索轨迹，关键词 ${keywordText} 是归类依据。`,
      `这条${source}中的 ${keywordText} 让它成为「${themeName}」展厅的合适展品。`
    ];

    return templates[Math.floor(Math.random() * templates.length)];
  },

  /**
   * Main curation function
   * @param {Array} items - items to curate
   * @returns {Array} galleries - curated galleries with items assigned
   */
  aiCurateItems(items) {
    const groups = {};

    items.forEach(item => {
      const text = `${item.title || ''} ${item.excerpt || ''} ${item.content || ''} ${item.url || ''}`;
      const { theme, matched } = this.classify(text);

      // Enhance item with curation metadata
      item.galleryId = theme.id;
      item.tags = Array.from(new Set([...(item.tags || []), ...matched, theme.theme]));
      item.curationReason = this.generateReason(item, theme, matched);

      if (!groups[theme.id]) {
        groups[theme.id] = {
          gallery: { ...theme },
          items: []
        };
      }
      groups[theme.id].items.push(item);
    });

    return Object.values(groups).map(group => {
      const gallery = group.gallery;
      gallery.items = group.items;
      gallery.itemCount = group.items.length;
      gallery.tags = Array.from(new Set(group.items.flatMap(i => i.tags || [])))
        .filter(t => t !== gallery.theme && t !== '未分类')
        .slice(0, 6);
      gallery.createdAt = gallery.createdAt || new Date().toISOString().split('T')[0];
      gallery.updatedAt = new Date().toISOString().split('T')[0];
      return gallery;
    });
  },

  /**
   * Generate user persona from all items and galleries
   */
  generatePersona(items, galleries) {
    if (!items || items.length === 0) {
      return {
        id: 'persona-default',
        title: PERSONA_TITLES.default,
        summary: '你的博物馆刚刚建立，AI 还在等待更多足迹来认识你。',
        interests: [],
        personalityTraits: ['好奇心强', '正在探索'],
        evolution: '故事刚刚开始。',
        curatorMessage: PERSONA_MESSAGES.default,
        topThemes: [],
        radar: {}
      };
    }

    // Count theme distribution, ignore uncategorized
    const themeCounts = {};
    items.forEach(item => {
      const gallery = galleries.find(g => g.id === item.galleryId);
      const themeName = gallery ? gallery.theme : '未分类';
      if (themeName === '未分类') return;
      themeCounts[themeName] = (themeCounts[themeName] || 0) + 1;
    });

    const sortedThemes = Object.entries(themeCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));

    const topTheme = sortedThemes[0]?.name;
    const total = items.length;

    // Determine dominant persona type
    let title = PERSONA_TITLES.default;
    let message = PERSONA_MESSAGES.default;
    const topRatio = sortedThemes[0]?.count / total;

    if (topTheme === 'AI 与工具' && topRatio >= 0.3) {
      title = PERSONA_TITLES.ai_high;
      message = PERSONA_MESSAGES.ai_high;
    } else if (topTheme === '设计与审美' && topRatio >= 0.3) {
      title = PERSONA_TITLES.design_high;
      message = PERSONA_MESSAGES.design_high;
    } else if (topTheme === '创业与产品' && topRatio >= 0.3) {
      title = PERSONA_TITLES.startup_high;
      message = PERSONA_MESSAGES.startup_high;
    } else if (topTheme === '城市与生活观察' && topRatio >= 0.3) {
      title = PERSONA_TITLES.city_high;
      message = PERSONA_MESSAGES.city_high;
    } else if (topTheme === '学习与研究' && topRatio >= 0.3) {
      title = PERSONA_TITLES.study_high;
      message = PERSONA_MESSAGES.study_high;
    } else if (sortedThemes.length >= 3 && topRatio < 0.35) {
      title = PERSONA_TITLES.balanced;
      message = PERSONA_MESSAGES.balanced;
    }

    // Interests from top tags
    const tagCounts = {};
    items.forEach(item => {
      (item.tags || []).forEach(tag => {
        // Skip generic tags
        if (!['未分类', 'AI', '学习', '城市'].includes(tag)) {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        }
      });
    });

    const interests = Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name]) => name);

    // Personality traits based on patterns
    const traits = [];
    if (items.some(i => (i.tags || []).includes('Agent') || (i.title || '').includes('Agent'))) {
      traits.push('关注自动化与未来工具');
    }
    if (items.some(i => (i.tags || []).includes('设计') || (i.tags || []).includes('UI'))) {
      traits.push('在意视觉与体验细节');
    }
    if (items.some(i => (i.tags || []).includes('创业') || (i.tags || []).includes('SaaS'))) {
      traits.push('有产品化思维');
    }
    if (items.some(i => (i.tags || []).includes('城市') || (i.tags || []).includes('建筑'))) {
      traits.push('喜欢观察人与空间');
    }
    if (items.some(i => (i.tags || []).includes('Vibe Coding') || (i.title || '').includes('Vibe'))) {
      traits.push('拥抱新的创造方式');
    }
    if (traits.length === 0) {
      traits.push('持续探索新领域', '善于收集与整理信息');
    }

    // Evolution summary
    const dates = items.map(i => i.dateAdded).filter(Boolean).sort();
    const firstDate = dates[0] || '';
    const lastDate = dates[dates.length - 1] || '';
    const evolution = `从 ${firstDate.slice(0, 7) || '开始'} 到 ${lastDate.slice(0, 7) || '现在'}，你的关注从「${sortedThemes[sortedThemes.length - 1]?.name || '探索'}」逐渐演进到「${topTheme}」。`;

    // Top themes with score
    const maxCount = Math.max(1, sortedThemes[0]?.count || 1);
    const topThemes = sortedThemes.slice(0, 5).map(t => ({
      name: t.name,
      count: t.count,
      score: Math.min(100, Math.round((t.count / maxCount) * 100))
    }));

    // Radar scores (gallery theme + related tags/keywords)
    const radar = {};
    RADAR_AXES.forEach(axis => {
      const axisKeywords = (axis.keywords || []).map(k => k.toLowerCase());
      const count = items.filter(item => {
        const gallery = galleries.find(g => g.id === item.galleryId);
        if (gallery && gallery.theme === axis.theme) return true;
        const text = `${(item.tags || []).join(' ')} ${item.title || ''} ${item.excerpt || ''}`.toLowerCase();
        return axisKeywords.some(k => text.includes(k));
      }).length;
      radar[axis.key] = count > 0
        ? Math.min(100, Math.round(25 + 75 * (1 - Math.exp(-0.6 * count))))
        : 0;
    });

    return {
      id: 'persona-' + Date.now(),
      title,
      summary: `过去一段时间，你持续关注 ${sortedThemes.slice(0, 3).map(t => t.name).join('、')}，最突出的是 ${topTheme}。${title} 这个标签，很适合描述你。`,
      interests,
      personalityTraits: traits,
      evolution,
      curatorMessage: message,
      topThemes,
      radar
    };
  },

  /**
   * Generate or regenerate timeline from items
   */
  generateTimeline(items, galleries) {
    // Group items by month
    const groups = {};
    items.forEach(item => {
      if (!item.dateAdded) return;
      const month = item.dateAdded.slice(0, 7);
      if (!groups[month]) groups[month] = [];
      groups[month].push(item);
    });

    const sortedMonths = Object.keys(groups).sort();
    const stages = ['探索期', '深化期', '实践期', '转化期', '创造期'];

    return sortedMonths.map((month, index) => {
      const monthItems = groups[month];
      // Find dominant theme for this month
      const themeCounts = {};
      monthItems.forEach(item => {
        const gallery = galleries.find(g => g.id === item.galleryId);
        const theme = gallery ? gallery.theme : '未分类';
        themeCounts[theme] = (themeCounts[theme] || 0) + 1;
      });
      const topTheme = Object.entries(themeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '探索';
      const stage = stages[Math.min(index, stages.length - 1)];

      const insightMap = {
        'AI 与工具': '你开始把 AI 视为创作伙伴，而不只是效率工具。',
        '创业与产品': '你的关注点从产品功能转向用户价值和商业模式。',
        '设计与审美': '你在训练自己对美的判断力，并把审美融入创作。',
        '城市与生活观察': '你透过空间观察生活，审美正在成为理解世界的方式。',
        '学习与研究': '你在系统性地积累知识，为下一步创造做准备。',
        '未分类': '你还在探索中，这些零散痕迹可能孕育着下一个主题。'
      };

      return {
        id: 'tl-' + month,
        title: `${topTheme} · ${monthItems.length} 件收藏`,
        stage,
        date: month,
        type: index === sortedMonths.length - 1 ? 'milestone' : 'event',
        galleryId: monthItems[0]?.galleryId,
        itemIds: monthItems.map(i => i.id),
        description: monthItems.map(i => i.title.split(/[:：]/)[0]).slice(0, 3).join('、') + (monthItems.length > 3 ? ' 等' : ''),
        aiInsight: insightMap[topTheme] || '你的兴趣正在悄然发生变化。'
      };
    });
  }
};

// ===== Storage Manager =====
const Storage = {
  KEY: 'internet_museum_data',

  init() {
    if (!localStorage.getItem(this.KEY)) {
      this.save({
        items: DEMO_ITEMS,
        galleries: DEMO_GALLERIES,
        tags: DEMO_TAGS,
        timeline: DEMO_TIMELINE,
        persona: DEMO_PERSONA
      });
    }
  },

  load() {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return { items: [], galleries: [], tags: [], timeline: [], persona: null };
    const data = JSON.parse(raw);
    if (this.migrate(data)) this.save(data);
    return data;
  },

  save(data) {
    localStorage.setItem(this.KEY, JSON.stringify(data));
  },

  /**
   * Migrate legacy stored data to current schema/path format
   */
  migrate(data) {
    let changed = false;
    // Fix old gallery cover image paths
    (data.galleries || []).forEach(g => {
      if (g.coverImage && g.coverImage.startsWith('../assets/')) {
        g.coverImage = g.coverImage.replace(/^\.\.\//, '');
        changed = true;
      }
    });
    // Backfill persona fields added in STEP 3
    if (data.persona && (!data.persona.radar || !data.persona.topThemes)) {
      const refreshed = AICurator.generatePersona(data.items || [], data.galleries || []);
      data.persona.radar = refreshed.radar;
      data.persona.topThemes = refreshed.topThemes;
      changed = true;
    }
    return changed;
  },

  getItems() { return this.load().items; },
  getGalleries() { return this.load().galleries; },
  getTags() { return this.load().tags; },
  getTimeline() { return this.load().timeline; },
  getPersona() { return this.load().persona; },

  /**
   * Refresh persona and timeline based on current items/galleries
   */
  refreshPersonaAndTimeline() {
    const data = this.load();
    data.persona = AICurator.generatePersona(data.items, data.galleries);
    data.timeline = AICurator.generateTimeline(data.items, data.galleries);
    this.save(data);
    return { persona: data.persona, timeline: data.timeline };
  },

  /**
   * Add a single item, run AI curation, merge into storage, refresh persona
   */
  addItemWithCuration(item) {
    const data = this.load();
    item.id = 'item-' + Date.now();
    item.dateAdded = new Date().toISOString().split('T')[0];
    item.source = item.source || '手动添加';

    const curatedGalleries = AICurator.aiCurateItems([item]);
    this.mergeCuratedGalleries(data, curatedGalleries);
    data.items.unshift(item);

    this.save(data);
    this.rebuildTags(data);
    const { persona, timeline } = this.refreshPersonaAndTimeline();
    return { item, galleries: curatedGalleries, persona, timeline };
  },

  /**
   * Add multiple items, run AI curation, merge into storage, refresh persona
   */
  addItemsWithCuration(items) {
    const data = this.load();
    const curatedGalleries = AICurator.aiCurateItems(items);

    items.forEach(item => {
      item.id = 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
      item.dateAdded = new Date().toISOString().split('T')[0];
      item.source = item.source || '批量导入';
      data.items.unshift(item);
    });

    this.mergeCuratedGalleries(data, curatedGalleries);
    this.save(data);
    this.rebuildTags(data);
    const { persona, timeline } = this.refreshPersonaAndTimeline();
    return { items, galleries: curatedGalleries, persona, timeline };
  },

  /**
   * Merge AI curated galleries into existing data
   */
  mergeCuratedGalleries(data, curatedGalleries) {
    curatedGalleries.forEach(curated => {
      const existing = data.galleries.find(g => g.id === curated.id);
      if (existing) {
        existing.itemCount = data.items.filter(i => i.galleryId === curated.id).length
          + curated.items.filter(i => !data.items.find(di => di.id === i.id)).length;
        existing.updatedAt = curated.updatedAt;
        existing.tags = Array.from(new Set([...(existing.tags || []), ...curated.tags])).slice(0, 8);
        if (existing.id !== 'gallery-uncategorized') {
          existing.curatorNote = curated.curatorNote;
        }
      } else {
        data.galleries.push(curated);
      }
    });
  },

  /**
   * Rebuild global tags list from all items
   */
  rebuildTags(data) {
    const tagCounts = {};
    data.items.forEach(item => {
      (item.tags || []).forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    data.tags = Object.entries(tagCounts).map(([name, count], index) => ({
      id: 'tag-' + index,
      name,
      color: '#b8956a',
      count
    }));
  },

  /**
   * Legacy addItem for backwards compatibility
   */
  addItem(item) {
    return this.addItemWithCuration(item);
  },

  addGallery(gallery) {
    const data = this.load();
    gallery.id = 'gallery-' + Date.now();
    gallery.createdAt = new Date().toISOString().split('T')[0];
    gallery.updatedAt = gallery.createdAt;
    gallery.itemCount = 0;
    data.galleries.push(gallery);
    this.save(data);
    return gallery;
  },

  assignItemToGallery(itemId, galleryId) {
    const data = this.load();
    const item = data.items.find(i => i.id === itemId);
    if (item) {
      item.galleryId = galleryId;
      const gallery = data.galleries.find(g => g.id === galleryId);
      if (gallery) {
        gallery.itemCount = data.items.filter(i => i.galleryId === galleryId).length;
        gallery.updatedAt = new Date().toISOString().split('T')[0];
      }
      this.save(data);
    }
  },

  reset() {
    localStorage.removeItem(this.KEY);
    this.init();
  }
};

// ===== Utils =====
const Utils = {
  formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}`;
  },

  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  getTypeIcon(type) {
    const map = {
      article: '&#128196;',
      book: '&#128214;',
      screenshot: '&#128247;',
      project: '&#128187;',
      video: '&#127909;',
      note: '&#128221;',
      text: '&#128220;'
    };
    return map[type] || '&#128196;';
  },

  getTypeLabel(type) {
    const map = {
      article: '文章', book: '书籍', screenshot: '截图',
      project: '项目', video: '视频', note: '笔记', text: '文本'
    };
    return map[type] || type;
  },

  getSourceLabel(item) {
    if (item.url) return 'URL';
    if (item.type === 'screenshot') return '截图描述';
    if (item.type === 'note' || item.type === 'text') return '文本';
    return '内容';
  },

  showToast(message, duration = 3000) {
    let toast = document.querySelector('.toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), duration);
  },

  debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
};

// ===== Navigation Helper =====
function initNav() {
  const path = window.location.pathname;
  const page = path.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(link => {
    if (link.getAttribute('href') === page) {
      link.classList.add('active');
    }
  });
}

// Init on load
document.addEventListener('DOMContentLoaded', () => {
  Storage.init();
  initNav();
});
