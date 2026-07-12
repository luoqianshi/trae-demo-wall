(function () {
  'use strict';

  /* ─── Task Types & Categories ────────────────────────────── */
  const TASK_CATEGORIES = [
    { label: '基础任务', icon: '📚', types: ['solve', 'write', 'translate', 'code', 'summarize'] },
    { label: '进阶作业', icon: '🎓', types: ['experiment', 'thesis', 'presentation', 'review'] },
    { label: '展示输出', icon: '🎯', types: ['ppt', 'defense', 'teamwork'] }
  ];

  const TASK_TYPES = [
    { code: 'solve',        name: '解题',       icon: '❓', desc: '数理化题目分步解答',   color: '#6366f1', category: 'basic' },
    { code: 'write',        name: '写作',       icon: '✍️', desc: '写作思路与框架指导',   color: '#10b981', category: 'basic' },
    { code: 'translate',    name: '翻译',       icon: '🌐', desc: '中英互译与解析',       color: '#f59e0b', category: 'basic' },
    { code: 'code',         name: '代码',       icon: '💻', desc: '编程问题与代码调试',   color: '#8b5cf6', category: 'basic' },
    { code: 'summarize',    name: '总结',       icon: '📝', desc: '资料总结知识点梳理',   color: '#ec4899', category: 'basic' },
    { code: 'experiment',   name: '实验报告',   icon: '🔬', desc: '实验报告框架生成',     color: '#06b6d4', category: 'advanced' },
    { code: 'thesis',       name: '论文结构',   icon: '📖', desc: '论文结构规划指导',     color: '#84cc16', category: 'advanced' },
    { code: 'presentation', name: '课堂汇报',   icon: '🎤', desc: '课堂汇报准备指导',     color: '#f97316', category: 'advanced' },
    { code: 'review',       name: '复习提纲',   icon: '📋', desc: '复习重点知识梳理',     color: '#14b8a6', category: 'advanced' },
    { code: 'ppt',          name: 'PPT生成',    icon: '📊', desc: '自动生成完整PPT方案',  color: '#ef4444', category: 'output' },
    { code: 'defense',      name: '答辩准备',   icon: '🛡️', desc: '答辩问题与话术准备',   color: '#7c3aed', category: 'output' },
    { code: 'teamwork',     name: '小组分工',   icon: '👥', desc: '小组作业分工方案',     color: '#0ea5e9', category: 'output' },
  ];

  const TASK_MAP = {};
  TASK_TYPES.forEach(t => TASK_MAP[t.code] = t);

  const PLACEHOLDERS = {
    solve:        '请输入作业题目内容，例如数学题、物理题、化学题等。可以直接粘贴题目文字，或上传题目截图。\n\n示例：求函数 f(x)=x³-3x+1 在区间 [0,2] 上的最大值和最小值',
    write:        '请输入写作题目、文体要求、字数限制等信息。\n\n示例：以"人工智能对大学生学习的影响"为题写一篇议论文，不少于800字',
    translate:    '请输入需要翻译的文本内容，支持中英互译。\n\n示例：请将以下英文段落翻译成中文，注意保持学术语气：...',
    code:         '请描述编程需求或遇到的问题，可以粘贴报错信息。\n\n示例：用Python写一个快速排序算法，要求能处理包含重复元素的列表',
    summarize:    '请粘贴需要总结的资料内容，或上传文档。\n\n示例：请总结以下这篇论文的核心观点、研究方法和主要结论：...',
    experiment:   '请输入实验名称、实验目的、实验数据、老师要求，或上传实验资料。\n\n示例：大学物理实验——用单摆测量重力加速度，需要包含误差分析',
    thesis:       '请输入论文题目方向、课程要求、字数、研究对象等信息。\n\n示例：管理学课程论文，方向是企业数字化转型对组织绩效的影响，5000字左右',
    presentation: '请输入汇报主题、课程、时长、听众对象等信息。\n\n示例：毛概课课堂汇报，主题是乡村振兴战略，5分钟，面向全班同学',
    review:       '请输入课程名称、考试范围、需要复习的章节等信息。\n\n示例：高等数学期末复习，范围是前三章（极限、导数、积分）',
    ppt:          '请输入老师的 PPT 要求、主题、页数、课程名称、展示时长等信息。\n\n示例：\n• 请帮我做一个关于人工智能发展的 8 页 PPT\n• 毛概课程，主题是乡村振兴，要求 10 页，适合课堂展示\n• 机器人导论课，做一个关于工业机器人的 PPT，要有案例',
    defense:      '请输入答辩的主题、论文/实验内容、答辩时长、答辩形式等信息。\n\n示例：毕业论文答辩，题目是基于深度学习的图像分类研究，答辩10分钟，提问5分钟',
    teamwork:     '请输入小组作业的主题、人数、作业要求、截止时间等信息。\n\n示例：市场营销小组作业，4人，做一个新产品推广方案，两周后提交，需要PPT和报告',
  };

  const BUTTON_TEXT = {
    solve: '开始解题', write: '开始写作', translate: '开始翻译', code: '生成代码', summarize: '生成总结',
    experiment: '生成实验报告框架', thesis: '生成论文结构', presentation: '生成汇报方案', review: '生成复习提纲',
    ppt: '生成 PPT 方案', defense: '生成答辩准备', teamwork: '生成分工方案',
  };

  /* ─── Workflow Steps Definition ─────────────────────────── */
  const WORKFLOW_STEPS = [
    { id: 0, label: '提交作业要求', icon: '📝' },
    { id: 1, label: '识别作业类型', icon: '🔍' },
    { id: 2, label: '匹配 Prompt', icon: '🧭' },
    { id: 3, label: '生成初稿', icon: '⚡' },
    { id: 4, label: '跟进修改', icon: '🔄' },
    { id: 5, label: '导出成果', icon: '📤' },
  ];

  /* ─── Processing Status Messages ────────────────────────── */
  const PROCESSING_STATES = {
    ppt: [
      { step: 1, text: '正在识别作业要求……', delay: 600 },
      { step: 1, text: '已识别：课堂展示型 PPT', delay: 500 },
      { step: 2, text: '正在匹配课程汇报 Prompt……', delay: 600 },
      { step: 2, text: '已加载：PPT 页面规划与演讲稿模板', delay: 500 },
      { step: 3, text: '正在分析主题、页数、时长约束……', delay: 500 },
      { step: 3, text: '正在生成结构化初稿……', delay: 800 },
      { step: 3, text: '正在撰写每页演讲稿……', delay: 600 },
      { step: 3, text: '初稿 V1 已完成', delay: 400 },
      { step: 4, text: '等待用户继续修改', delay: 0 },
    ],
    experiment: [
      { step: 1, text: '正在识别作业要求……', delay: 500 },
      { step: 1, text: '已识别：实验报告任务', delay: 400 },
      { step: 2, text: '正在匹配实验报告 Prompt……', delay: 500 },
      { step: 2, text: '已加载：实验报告标准结构模板', delay: 400 },
      { step: 3, text: '正在生成实验报告框架……', delay: 700 },
      { step: 3, text: '初稿 V1 已完成', delay: 400 },
      { step: 4, text: '等待用户继续修改', delay: 0 },
    ],
    thesis: [
      { step: 1, text: '正在识别作业要求……', delay: 500 },
      { step: 1, text: '已识别：论文结构规划任务', delay: 400 },
      { step: 2, text: '正在匹配论文结构 Prompt……', delay: 500 },
      { step: 2, text: '已加载：学术论文章节模板', delay: 400 },
      { step: 3, text: '正在规划论文章节结构……', delay: 700 },
      { step: 3, text: '初稿 V1 已完成', delay: 400 },
      { step: 4, text: '等待用户继续修改', delay: 0 },
    ],
    default: [
      { step: 1, text: '正在识别作业要求……', delay: 500 },
      { step: 1, text: '已识别作业类型', delay: 400 },
      { step: 2, text: '正在匹配专业 Prompt……', delay: 500 },
      { step: 2, text: '已加载对应模板', delay: 400 },
      { step: 3, text: '正在生成结构化结果……', delay: 700 },
      { step: 3, text: '初稿 V1 已完成', delay: 400 },
      { step: 4, text: '等待用户继续修改', delay: 0 },
    ],
    followup: [
      { step: 4, text: '正在分析修改要求……', delay: 500 },
      { step: 4, text: '正在应用修改到结构化数据……', delay: 700 },
      { step: 4, text: '正在生成新版本……', delay: 500 },
      { step: 4, text: `新版本已完成`, delay: 300 },
    ],
  };

  /* ─── Prompt Template Service ───────────────────────────── */
  class PromptTemplateService {
    static getTemplate(taskType) {
      const templates = {
        solve: {
          role: '你是一个大学生课程作业解题助手，擅长数理化等学科题目的分步解答。',
          outputFormat: ['题目理解', '已知条件', '解题思路', '分步骤推导', '最终答案', '易错点', '学习建议'],
          followUpSuggestions: ['讲得更简单一点', '补充公式推导', '给我类似例题', '标出易错点'],
          templateName: '分步解题 Prompt V2',
          capabilities: ['分步推导', '易错点标注', '类似题推荐'],
        },
        write: {
          role: '你是一个大学生写作指导助手，擅长帮助学生梳理论文、作文、应用文等文体的写作思路。',
          outputFormat: ['主题分析', '文章结构', '开头建议', '主体段思路', '结尾建议', '素材方向'],
          followUpSuggestions: ['开头改得更吸引人', '增加论据素材', '语言更正式', '压缩字数'],
          templateName: '写作指导 Prompt V1',
          capabilities: ['结构规划', '素材方向', '修改建议'],
        },
        translate: {
          role: '你是一个专业的翻译助手，擅长中英互译。',
          outputFormat: ['原文理解', '翻译结果', '关键词解释', '句式分析'],
          followUpSuggestions: ['更正式一些', '更口语化', '解释这个词组'],
          templateName: '专业翻译 Prompt V1',
          capabilities: ['中英互译', '术语解释', '句式分析'],
        },
        code: {
          role: '你是一个大学生编程辅助助手，擅长帮助理解编程问题、设计算法思路。',
          outputFormat: ['需求理解', '实现思路', '代码示例', '代码解释', '常见错误'],
          followUpSuggestions: ['加详细注释', '优化性能', '解释这段代码', '换一种写法'],
          templateName: '编程辅导 Prompt V1',
          capabilities: ['算法设计', '代码解释', '错误调试'],
        },
        summarize: {
          role: '你是一个学习资料总结助手，擅长从大量资料中提取核心知识点。',
          outputFormat: ['核心观点', '重点列表', '知识框架', '关键概念', '复习建议'],
          followUpSuggestions: ['更详细一点', '做成思维导图形式', '加例题', '标出考试重点'],
          templateName: '知识总结 Prompt V1',
          capabilities: ['要点提取', '框架梳理', '考点标注'],
        },
        experiment: {
          role: '你是一个大学实验报告指导助手，熟悉各类理工科实验报告的标准结构。',
          outputFormat: ['实验名称', '实验目的', '实验原理', '实验器材', '实验步骤', '数据处理', '误差分析', '结论模板'],
          followUpSuggestions: ['补充误差分析', '加实验原理图', '结论更正式', '加数据处理方法'],
          templateName: '实验报告 Prompt V2',
          capabilities: ['标准结构', '误差分析', '数据处理指导'],
        },
        thesis: {
          role: '你是一个大学生论文结构规划助手，擅长帮助学生梳理论文框架。',
          outputFormat: ['题目建议', '摘要思路', '关键词', '引言', '理论基础', '现状分析', '问题与对策', '总结', '参考文献'],
          followUpSuggestions: ['加研究方法', '加参考文献方向', '章节更细分', '选题更具体'],
          templateName: '论文结构 Prompt V2',
          capabilities: ['章节规划', '研究方法', '文献方向'],
        },
        presentation: {
          role: '你是一个大学生课堂汇报指导助手，擅长帮助学生准备课堂展示。',
          outputFormat: ['汇报主题', '听众分析', '内容结构', '时间分配', '开场设计', '演讲要点'],
          followUpSuggestions: ['加互动环节', '压缩到3分钟', '开头更吸引人', '加数据支撑'],
          templateName: '课堂汇报 Prompt V1',
          capabilities: ['结构规划', '时间分配', '演讲技巧'],
        },
        review: {
          role: '你是一个大学生复习规划助手，擅长帮助学生梳理课程重点。',
          outputFormat: ['复习范围', '知识框架', '核心考点', '重点公式', '典型题型', '易错点汇总'],
          followUpSuggestions: ['加典型例题', '按题型整理', '加记忆口诀', '突出考试重点'],
          templateName: '复习提纲 Prompt V1',
          capabilities: ['考点梳理', '题型总结', '记忆技巧'],
        },
        ppt: {
          role: '你是一个大学生PPT生成助手，能根据作业要求自动生成结构化的PPT方案。',
          outputFormat: ['封面', '目录', '背景介绍', '核心概念', '案例分析', '问题与挑战', '发展趋势', '总结/Q&A'],
          followUpSuggestions: ['改成10页', '每页补充演讲稿', '增加真实案例', '压缩到3分钟', '调整为正式学术风', '增加参考资料页'],
          templateName: '大学课程汇报 Prompt V2',
          capabilities: ['每页演讲稿', '配图建议', '设计建议', '答辩问题预判'],
        },
        defense: {
          role: '你是一个答辩准备助手，擅长帮助学生准备课程答辩、毕业论文答辩。',
          outputFormat: ['答辩概述', '自述稿框架', '常见问题', '专业问题预判', '答辩技巧'],
          followUpSuggestions: ['加英文问题', '自述稿更口语化', '加刁钻问题', '缩短到3分钟'],
          templateName: '答辩准备 Prompt V2',
          capabilities: ['自述稿', '问题预判', '回答策略'],
        },
        teamwork: {
          role: '你是一个小组作业分工助手，擅长根据作业类型制定合理的分工方案。',
          outputFormat: ['作业分析', '角色分工', '任务拆解', '时间节点', '协作方式', '交付标准'],
          followUpSuggestions: ['分工更平均', '加时间表', '明确交付物', '考虑个人特长'],
          templateName: '小组分工 Prompt V1',
          capabilities: ['角色分工', '时间规划', '协作建议'],
        },
      };
      return templates[taskType] || templates.solve;
    }
  }

  /* ─── Prompt Router Service ─────────────────────────────── */
  class PromptRouterService {
    static analyzeRequest(request) {
      const text = request.text || '';
      const fileNames = [...(request.imageNames || []), ...(request.fileNames || [])];
      const taskType = request.taskType;

      const topic = this.extractTopic(text);
      const pageCount = this.extractPageCount(text);
      const course = this.extractCourse(text);
      const duration = this.extractDuration(text, pageCount);
      const hasCase = /案例|实例|例子|举例/.test(text);
      const hasNotes = /演讲稿|备注|讲稿/.test(text);
      const hasReferences = /参考文献|引用|资料/.test(text);
      const isFormal = /正式|学术|规范/.test(text);
      const audience = this.detectAudience(text);
      const outputFormat = this.detectOutputFormat(text, taskType);
      const fileName = fileNames.length > 0 ? fileNames[0] : null;

      const template = PromptTemplateService.getTemplate(taskType);

      const constraints = [];
      if (pageCount) constraints.push(`${pageCount}页`);
      if (duration) constraints.push(duration);
      if (course && course !== '课程展示') constraints.push(`适合${course}`);
      if (audience) constraints.push(`受众：${audience}`);
      if (isFormal) constraints.push('正式学术风格');
      if (hasCase) constraints.push('包含案例分析');

      return {
        taskType,
        taskName: TASK_MAP[taskType]?.name || '作业',
        topic,
        pageCount,
        course,
        duration,
        audience,
        fileName,
        hasCase,
        hasNotes,
        hasReferences,
        isFormal,
        outputStructure: template.outputFormat,
        templateName: template.templateName,
        capabilities: template.capabilities,
        constraints,
        requirements: this.countRequirements(text, fileNames),
        strategy: this.buildStrategy(taskType, topic, pageCount, duration, hasCase, hasNotes, course, audience),
      };
    }

    static extractTopic(input) {
      if (!input) return '主题演示';
      const t = input.replace(/\s+/g, ' ').trim();
      const patterns = [
        /主题[是为：:]?\s*["《]?([^""《》\n，,。.；;要求适合课程页分钟个的是了]+)/,
        /关于((?:[^，。,.\n]|的){2,35}?)(?:的)?\s*(?:\d+\s*页|PPT|ppt|演示|汇报|课件|实验|论文)/,
        /做一个(?:关于)?((?:[^，。,.\n\d]|的){2,35}?)(?:的)?\s*(?:\d+\s*页|PPT|ppt|演示|汇报|课件|，|,|$)/,
        /关于([^\n，。,.的]{2,25})的/,
        /([^\n，。,.]{2,20}?)(?:PPT|ppt|演示|汇报|实验|论文)/,
      ];
      for (const p of patterns) {
        const m = t.match(p);
        if (m && m[1] && m[1].length >= 2 && m[1].length <= 40) {
          let topic = m[1].replace(/^关于|^的|^是/, '').trim();
          topic = topic.replace(/[，,。.；;要求适合课程展示课堂分钟个的了是做一个帮我根据请]+$/, '');
          topic = topic.replace(/^(关于|做一个|帮我|请帮我|生成一个)/, '').trim();
          if (topic.length >= 2 && topic.length <= 30) return topic;
        }
      }
      const stopWords = /\d+页|分钟|课程|展示|课堂|老师|要求|帮我|请|做一个|关于|生成|答辩|PPT|ppt|演示|汇报|案例|适合|个|，|,|。|；|;/g;
      let cleaned = t.replace(stopWords, ' ').replace(/\s+/g, ' ').trim();
      cleaned = cleaned.replace(/^[关于的是请帮我做一个根据]+/, '').trim();
      cleaned = cleaned.replace(/[的了是个]+$/, '').trim();
      if (cleaned.length >= 2 && cleaned.length <= 25) return cleaned;
      if (cleaned.length > 25) return cleaned.substring(0, 22);
      return t.length > 20 ? t.substring(0, 18) + '...' : (t || '主题演示');
    }

    static extractPageCount(input) {
      if (!input) return 8;
      const m = input.match(/(\d+)\s*页/);
      if (m) { const n = parseInt(m[1]); if (n >= 4 && n <= 30) return n; }
      return 8;
    }

    static extractCourse(input) {
      if (!input) return '大学课堂';
      const courses = ['毛概', '马原', '思修', '近代史', '高数', '线性代数', '概率论', '大学物理',
        '大学英语', '计算机基础', 'Python', 'C语言', 'Java', '数据结构', '算法', '操作系统',
        '计算机网络', '数据库', '软件工程', '人工智能', '机器学习', '深度学习', '机器人',
        '机器人导论', '经济学', '管理学', '心理学', '社会学', '历史学', '哲学', '传播学',
        '市场营销', '财务管理', '会计', '法学', '医学', '生物学', '化学', '机械'];
      for (const c of courses) { if (input.includes(c)) return c + '课程'; }
      const m = input.match(/([\u4e00-\u9fffA-Za-z]{2,8})(?:课|课程)/);
      if (m) return m[1] + '课程';
      return '大学课堂';
    }

    static extractDuration(input, pageCount) {
      if (input) { const m = input.match(/(\d+)\s*分钟/); if (m) return m[1] + '分钟'; }
      return Math.max(5, Math.round(pageCount * 1.2)) + '分钟';
    }

    static detectAudience(input) {
      if (/答辩|评委|老师/.test(input)) return '答辩评委/课程教师';
      if (/同学|全班|课堂/.test(input)) return '全班同学';
      if (/小组|团队/.test(input)) return '小组成员';
      return '大学课堂师生';
    }

    static detectOutputFormat(input, taskType) {
      const template = PromptTemplateService.getTemplate(taskType);
      return template.outputFormat;
    }

    static countRequirements(text, fileNames) {
      let count = 0;
      if (text) count++;
      if (fileNames && fileNames.length > 0) count += fileNames.length;
      if (/\d+\s*页/.test(text)) count++;
      if (/\d+\s*分钟/.test(text)) count++;
      if (/案例|实例/.test(text)) count++;
      if (/演讲稿|讲稿/.test(text)) count++;
      if (/趋势|展望|未来/.test(text)) count++;
      if (/总结|结论/.test(text)) count++;
      return Math.max(count, 3);
    }

    static buildStrategy(taskType, topic, pageCount, duration, hasCase, hasNotes, course, audience) {
      const strategies = {
        ppt: [
          `1. 主题解析：提取"${topic}"作为核心主题，适配${course}场景`,
          `2. 结构规划：按${pageCount}页规划内容，预估总时长${duration}`,
          `3. 页面设计：每页3-5个要点，配图标+简洁文字，16:9幻灯片比例`,
          `4. 内容填充：${hasCase ? '包含真实案例分析页，' : ''}背景→概念→核心→案例→趋势→总结`,
          `5. 附加输出：每页配图建议+设计建议${hasNotes ? '+完整演讲稿' : ''}`,
          `6. 受众适配：面向${audience}，语言专业但不晦涩`,
          `7. 答辩准备：预判5个可能被问到的问题`,
        ],
        experiment: [
          `1. 主题解析：确定实验名称和目的`,
          `2. 结构规划：按标准实验报告9大模块组织`,
          `3. 重点关注：数据处理方法和误差分析`,
          `4. 附加输出：注意事项和结论模板`,
        ],
        thesis: [
          `1. 主题解析：确定论文方向和选题`,
          `2. 结构规划：五章式标准论文结构`,
          `3. 重点关注：研究方法和文献方向`,
          `4. 附加输出：写作注意事项和参考文献建议`,
        ],
        default: [
          `1. 主题解析：理解作业核心要求`,
          `2. 结构规划：选择适合的输出框架`,
          `3. 内容填充：按模块生成结构化内容`,
          `4. 附加输出：补充学习建议和注意事项`,
        ],
      };
      return strategies[taskType] || strategies.default;
    }
  }

  /* ─── Constants ──────────────────────────────────────────── */
  const STORAGE_KEY = 'study_agent_history';
  const SETTINGS_KEY = 'study_agent_api_settings';
  const MODEL_NAME = 'StudyAgent-Mock-v2.0';

  const API_PROVIDER_PRESETS = {
    'mock':              { name: 'Mock API',            baseUrl: '',                                         defaultModel: 'Mock-StudyAgent' },
    'local':             { name: 'Local Backend',       baseUrl: '/api',                                     defaultModel: 'Local-Proxy' },
    'openai-compatible': { name: 'OpenAI Compatible',   baseUrl: 'https://api.openai.com/v1',                defaultModel: 'gpt-4o-mini' },
    'deepseek':          { name: 'DeepSeek',            baseUrl: 'https://api.deepseek.com/v1',              defaultModel: 'deepseek-chat' },
    'gemini':            { name: 'Gemini',              baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', defaultModel: 'gemini-1.5-flash' },
    'claude':            { name: 'Claude',              baseUrl: 'https://api.anthropic.com/v1',             defaultModel: 'claude-3-haiku-20240307' },
    'ollama':            { name: 'Ollama',              baseUrl: 'http://localhost:11434/v1',                defaultModel: 'llama3' },
    'custom':            { name: 'Custom Backend',      baseUrl: '',                                         defaultModel: '' },
  };

  const IS_LOCAL_SERVER = location.protocol === 'http:' || location.protocol === 'https:';
  const SERVER_PORT = IS_LOCAL_SERVER ? (location.port || '80') : '0';
  const SERVER_ORIGIN = IS_LOCAL_SERVER ? location.origin : '';
  let localBackendStatus = 'unknown';

  /* ─── State ──────────────────────────────────────────────── */
  let currentTaskType = 'solve';
  let uploadedImages = [];
  let uploadedFiles = [];
  let currentResponse = null;
  let currentRequest = null;
  let currentVersions = [];
  let currentVersionIndex = 0;
  let currentStructuredResult = null;
  let isSaved = false;
  let currentDetailId = null;
  let currentPptData = null;
  let currentPromptMatch = null;
  let currentTimeline = [];
  let apiSettings = loadApiSettings();
  let followupHintText = '';
  let changedSlideIndices = new Set();
  let addedSlideIndices = new Set();
  let currentWorkflowStep = -1;
  let demoGuideState = { active: false, step: 0 };
  let window_isDemoRun = false;
  let demoWaitingForFollowup = false;

  /* ─── DOM refs ───────────────────────────────────────────── */
  const $ = (id) => document.getElementById(id);
  const views = {
    home:    $('view-home'),
    result:  $('view-result'),
    history: $('view-history'),
    detail:  $('view-history-detail'),
  };

  /* ─── Init ───────────────────────────────────────────────── */
  function init() {
    renderWorkflowStepper();
    renderTaskTypes();
    bindEvents();
    updateInputPlaceholder();
    updateButtonText();
    hideDemoBannerIfSeen();
    applyRealApiVisibility();
    setWorkflowStep(0);
    showView('home');
    $('btn-guide').addEventListener('click', openDemoGuide);
    $('btn-guide-close').addEventListener('click', closeDemoGuide);
    $('btn-guide-skip').addEventListener('click', closeDemoGuide);
    $('btn-guide-next').addEventListener('click', nextGuideStep);
    $('btn-toggle-prompt-detail').addEventListener('click', togglePromptDetail);

    if (IS_LOCAL_SERVER) {
      checkLocalBackendHealth().then(() => updateApiStatusBar());
    }
    updateApiStatusBar();
  }

  function showView(name) {
    Object.values(views).forEach(v => v.classList.remove('active'));
    views[name].classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /* ─── Workflow Stepper ──────────────────────────────────── */
  function renderWorkflowStepper() {
    const stepsEl = $('stepper-steps');
    stepsEl.innerHTML = WORKFLOW_STEPS.map((s, i) =>
      `<div class="stepper-step" data-step="${i}">
        <div class="stepper-circle">
          <span class="stepper-icon">${s.icon}</span>
          <span class="stepper-num">${i + 1}</span>
        </div>
        <span class="stepper-label">${s.label}</span>
      </div>`
    ).join('');
  }

  function setWorkflowStep(step) {
    currentWorkflowStep = step;
    const progress = $('stepper-progress');
    const pct = step >= 5 ? 100 : (step / 5) * 100;
    progress.style.width = pct + '%';
    document.querySelectorAll('.stepper-step').forEach((el, i) => {
      el.classList.remove('active', 'completed', 'current');
      if (i < step) el.classList.add('completed');
      else if (i === step) el.classList.add('active', 'current');
    });
  }

  function animateWorkflowStep(fromStep, toStep) {
    return new Promise(resolve => {
      let current = fromStep;
      const advance = () => {
        if (current >= toStep) { resolve(); return; }
        current++;
        setWorkflowStep(current);
        setTimeout(advance, 200);
      };
      setWorkflowStep(fromStep);
      setTimeout(advance, 100);
    });
  }

  /* ─── Agent Timeline ────────────────────────────────────── */
  function addTimelineEvent(text, type) {
    const now = new Date();
    currentTimeline.push({ text, type, time: now });
    renderTimeline();
  }

  function resetTimeline() {
    currentTimeline = [];
  }

  function renderTimeline() {
    const el = $('agent-timeline');
    const list = $('timeline-list');
    if (currentTimeline.length === 0) { el.classList.add('hidden'); return; }
    el.classList.remove('hidden');
    list.innerHTML = currentTimeline.map(e =>
      `<div class="timeline-item timeline-${e.type || 'info'}">
        <div class="timeline-dot"></div>
        <div class="timeline-content">
          <span class="timeline-text">${escHtml(e.text)}</span>
          <span class="timeline-time">${pad2(e.time.getHours())}:${pad2(e.time.getMinutes())}</span>
        </div>
      </div>`
    ).join('');
  }

  /* ─── Task Stats ────────────────────────────────────────── */
  function renderTaskStats() {
    const card = $('task-stats-card');
    if (!currentPromptMatch) { card.classList.add('hidden'); return; }
    card.classList.remove('hidden');
    const m = currentPromptMatch;
    const versionCount = currentVersions.length;
    const ppt = currentPptData;
    const notesCount = ppt ? ppt.slides.filter(s => s.speakerNotes && s.speakerNotes.length > 20).length : 0;
    const estimatedTime = m.pageCount ? Math.round(m.pageCount * 2.5 + 5) : 15;
    const stats = [
      { label: '识别到的要求', value: m.requirements + ' 项', icon: '🔍' },
      { label: '使用的Prompt模板', value: m.templateName, icon: '🧭' },
      { label: '生成页数/模块', value: ppt ? ppt.pageCount + ' 页' : (currentStructuredResult?.modules?.length || currentStructuredResult?.chapters?.length || currentStructuredResult?.steps?.length || '-'), icon: '📄' },
      { label: '生成演讲稿', value: notesCount > 0 ? notesCount + ' 段' : '-', icon: '🎤' },
      { label: '完成修改轮数', value: versionCount > 1 ? (versionCount - 1) + ' 轮' : '0 轮', icon: '🔄' },
      { label: '当前版本', value: 'V' + (getCurrentVersion()?.versionNumber || 1), icon: '📌' },
      { label: '预计节省整理时间', value: '约 ' + estimatedTime + ' 分钟*', icon: '⏱️' },
    ];
    $('stats-grid').innerHTML = stats.map(s =>
      `<div class="stat-item">
        <span class="stat-icon">${s.icon}</span>
        <div class="stat-info">
          <span class="stat-value">${escHtml(s.value)}</span>
          <span class="stat-label">${s.label}</span>
        </div>
      </div>`
    ).join('');
  }

  /* ─── Prompt Match Card ─────────────────────────────────── */
  function renderPromptMatch(match) {
    currentPromptMatch = match;
    const card = $('prompt-match-card');
    card.classList.remove('hidden');
    const body = $('prompt-match-body');
    const outputStructure = match.outputStructure.slice(0, 7).map(s => `<span class="struct-tag">${escHtml(s)}</span>`).join('');
    const capabilities = match.capabilities.map(c => `<span class="cap-tag">${escHtml(c)}</span>`).join('');
    body.innerHTML = `
      <div class="match-grid">
        <div class="match-row">
          <span class="match-label">任务识别</span>
          <span class="match-value strong">${match.taskName}${match.topic ? '：' + escHtml(match.topic) : ''}</span>
        </div>
        <div class="match-row">
          <span class="match-label">使用模板</span>
          <span class="match-value">${escHtml(match.templateName)}</span>
        </div>
        <div class="match-row">
          <span class="match-label">输出结构</span>
          <span class="match-value struct-tags">${outputStructure}</span>
        </div>
        <div class="match-row">
          <span class="match-label">附加能力</span>
          <span class="match-value cap-tags">${capabilities}</span>
        </div>
        ${match.constraints.length > 0 ? `
        <div class="match-row">
          <span class="match-label">约束条件</span>
          <span class="match-value">${match.constraints.map(c => `<span class="constraint-tag">${escHtml(c)}</span>`).join('')}</span>
        </div>` : ''}
        ${match.fileName ? `
        <div class="match-row">
          <span class="match-label">参考文件</span>
          <span class="match-value">📎 ${escHtml(match.fileName)}</span>
        </div>` : ''}
      </div>`;
    const detail = $('prompt-match-detail');
    detail.innerHTML = `
      <div class="strategy-section">
        <div class="strategy-title">🧠 本次工作策略拆解</div>
        <ol class="strategy-list">
          ${match.strategy.map(s => `<li>${escHtml(s)}</li>`).join('')}
        </ol>
      </div>`;
    $('btn-toggle-prompt-detail').textContent = '查看工作策略 ▼';
  }

  function togglePromptDetail() {
    const detail = $('prompt-match-detail');
    const btn = $('btn-toggle-prompt-detail');
    if (detail.classList.contains('hidden')) {
      detail.classList.remove('hidden');
      btn.textContent = '收起策略 ▲';
    } else {
      detail.classList.add('hidden');
      btn.textContent = '查看工作策略 ▼';
    }
  }

  /* ─── Version Diff ──────────────────────────────────────── */
  function computeVersionDiff(oldVersion, newVersion, followUpText) {
    const changes = [];
    const oldPpt = oldVersion.pptData;
    const newPpt = newVersion.pptData;
    changedSlideIndices = new Set();
    addedSlideIndices = new Set();

    if (oldPpt && newPpt) {
      if (newPpt.pageCount !== oldPpt.pageCount) {
        const diff = newPpt.pageCount - oldPpt.pageCount;
        changes.push({ type: diff > 0 ? 'add' : 'remove', text: `页数 ${oldPpt.pageCount} → ${newPpt.pageCount}`, icon: diff > 0 ? '📄' : '📄' });
      }
      if (newPpt.duration !== oldPpt.duration) {
        changes.push({ type: 'modify', text: `展示时长 ${oldPpt.duration} → ${newPpt.duration}`, icon: '⏱️' });
      }
      const oldHasNotes = oldPpt.slides.every(s => s.speakerNotes && s.speakerNotes.includes('【演讲稿】'));
      const newHasNotes = newPpt.slides.every(s => s.speakerNotes && s.speakerNotes.includes('【演讲稿】'));
      if (!oldHasNotes && newHasNotes) {
        changes.push({ type: 'add', text: '每页补充了详细演讲稿', icon: '🎤' });
      }
      const oldSlideTitles = oldPpt.slides.map(s => s.title);
      const newSlideTitles = newPpt.slides.map(s => s.title);
      const addedTitles = newSlideTitles.filter(t => !oldSlideTitles.includes(t));
      if (addedTitles.length > 0 && newPpt.pageCount > oldPpt.pageCount) {
        addedTitles.forEach(t => {
          const idx = newSlideTitles.indexOf(t);
          if (idx >= 0) {
            changedSlideIndices.add(idx);
            addedSlideIndices.add(idx);
          }
        });
        changes.push({ type: 'add', text: `新增 ${addedTitles.length} 页：${addedTitles.map(t => escHtml(t)).join('、')}`, icon: '➕' });
      }
      if (newPpt.style !== oldPpt.style && (followUpText && /高级|高端|大气|正式|学术/.test(followUpText))) {
        changes.push({ type: 'modify', text: '视觉风格已调整', icon: '🎨' });
      }
      newPpt.slides.forEach((s, i) => {
        const oldS = oldPpt.slides[i];
        if (oldS && s.title !== oldS.title) {
          changedSlideIndices.add(i);
        }
      });
    }

    if (/案例|实例|例子/.test(followUpText) && (!oldPpt || !oldPpt.slides.some(s => s.pageLabel.includes('案例')))) {
      changes.push({ type: 'add', text: '增加了案例分析页', icon: '📊' });
    }
    if (/参考资料|文献|引用/.test(followUpText)) {
      changes.push({ type: 'add', text: '增加了参考资料建议', icon: '📚' });
    }
    if (/正式|学术|规范/.test(followUpText)) {
      changes.push({ type: 'modify', text: '语言风格调整为正式学术风', icon: '✍️' });
    }

    if (changes.length === 0) {
      changes.push({ type: 'modify', text: '根据反馈优化了内容表达', icon: '✨' });
    }
    return changes;
  }

  function renderVersionDiff(changes, followUpText) {
    const card = $('version-diff-card');
    if (!changes || changes.length === 0) { card.classList.add('hidden'); return; }
    card.classList.remove('hidden');
    const versionNum = getCurrentVersion()?.versionNumber || 2;
    $('diff-title').textContent = `V${versionNum} 修改摘要`;
    $('diff-changes').innerHTML =
      (followUpText ? `<div class="diff-req">修改要求：${escHtml(truncate(followUpText, 80))}</div>` : '') +
      `<div class="diff-summary">本轮完成 ${changes.length} 项修改：</div>` +
      `<div class="diff-list">${changes.map(c =>
        `<div class="diff-item diff-${c.type}">
          <span class="diff-badge diff-badge-${c.type}">${c.type === 'add' ? '新增' : c.type === 'remove' ? '删除' : '已修改'}</span>
          <span class="diff-icon">${c.icon}</span>
          <span class="diff-change-text">${c.text}</span>
        </div>`
      ).join('')}</div>`;
  }

  /* ─── Demo Guide ────────────────────────────────────────── */
  const GUIDE_STEPS = [
    { title: '第 1 步：输入或使用示例作业', desc: '在作业输入框中描述你的作业要求，或点击右上角"一键体验"按钮自动填入示例任务。选择作业类型后，系统会自动匹配对应的专业 Prompt。', highlight: 'input-text' },
    { title: '第 2 步：观察系统匹配作业 Prompt', desc: '提交后，注意观察顶部进度条和处理状态，StudyAgent 会自动识别任务类型、匹配专业 Prompt 模板，并展示本次工作策略。', highlight: 'workflow-stepper' },
    { title: '第 3 步：查看结构化 PPT 初稿', desc: '生成完成后，你会看到 16:9 比例的 PPT 幻灯片预览，每页包含标题、要点、配图建议、设计建议和演讲稿。', highlight: 'ppt-preview-section' },
    { title: '第 4 步：继续修改并比较版本', desc: '使用快捷按钮或输入框继续提出修改要求（如"改成10页"），系统会生成新版本 V2，你可以切换版本、查看差异。', highlight: 'followup-panel' },
  ];

  function openDemoGuide() {
    demoGuideState = { active: true, step: 0 };
    renderGuideStep();
    $('demo-guide-overlay').classList.remove('hidden');
  }

  function closeDemoGuide() {
    demoGuideState = { active: false, step: 0 };
    $('demo-guide-overlay').classList.add('hidden');
    document.querySelectorAll('.guide-highlight').forEach(el => el.classList.remove('guide-highlight'));
  }

  function nextGuideStep() {
    if (demoGuideState.step < GUIDE_STEPS.length - 1) {
      demoGuideState.step++;
      renderGuideStep();
    } else {
      closeDemoGuide();
    }
  }

  function renderGuideStep() {
    const s = GUIDE_STEPS[demoGuideState.step];
    const isLast = demoGuideState.step === GUIDE_STEPS.length - 1;
    $('btn-guide-next').textContent = isLast ? '开始体验 →' : '下一步 →';
    $('guide-steps').innerHTML = `
      <div class="guide-step-indicator">
        ${GUIDE_STEPS.map((_, i) => `<div class="guide-dot${i <= demoGuideState.step ? ' active' : ''}"></div>`).join('')}
      </div>
      <h4 class="guide-step-title">${s.title}</h4>
      <p class="guide-step-desc">${s.desc}</p>
    `;
  }

  /* ─── Task Types UI ─────────────────────────────────────── */
  function renderTaskTypes() {
    const container = $('task-types');
    let html = '';
    TASK_CATEGORIES.forEach(cat => {
      html += `<div class="task-category">
        <div class="task-category-label">
          <span class="task-category-icon">${cat.icon}</span>
          <span>${cat.label}</span>
        </div>
        <div class="task-chips-row">`;
      cat.types.forEach(code => {
        const t = TASK_MAP[code];
        if (!t) return;
        const active = code === currentTaskType ? ' active' : '';
        html += `<div class="task-chip${active}" data-code="${code}" title="${t.desc}">
          <span class="chip-icon">${t.icon}</span>
          <span class="chip-label">${t.name}</span>
        </div>`;
      });
      html += `</div></div>`;
    });
    container.innerHTML = html;
    container.querySelectorAll('.task-chip').forEach(el => {
      el.addEventListener('click', () => {
        currentTaskType = el.dataset.code;
        renderTaskTypes();
        updateInputPlaceholder();
        updateButtonText();
      });
    });
  }

  function updateInputPlaceholder() {
    const ta = $('input-text');
    const label = $('input-label');
    const placeholder = PLACEHOLDERS[currentTaskType] || PLACEHOLDERS.solve;
    ta.placeholder = placeholder;
    label.textContent = '作业要求';
  }

  function updateButtonText() {
    const btn = $('btn-process-text');
    if (btn) btn.textContent = BUTTON_TEXT[currentTaskType] || '开始处理';
  }

  /* ─── File Handling ─────────────────────────────────────── */
  function bindEvents() {
    $('btn-pick-image').addEventListener('click', () => $('file-image').click());
    $('btn-pick-file').addEventListener('click', () => $('file-doc').click());
    $('file-image').addEventListener('change', handleImagePick);
    $('file-doc').addEventListener('change', handleFilePick);

    $('btn-process').addEventListener('click', processTask);
    $('btn-clear').addEventListener('click', clearAll);
    $('btn-back-home').addEventListener('click', () => { showView('home'); setWorkflowStep(0); resetTimeline(); });
    $('btn-copy').addEventListener('click', copyResult);
    $('btn-regenerate').addEventListener('click', regenerate);
    $('btn-save').addEventListener('click', saveToHistory);

    $('btn-followup').addEventListener('click', handleFollowUp);
    $('followup-input').addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleFollowUp();
    });

    $('btn-history').addEventListener('click', () => { renderHistory(); showView('history'); });
    $('btn-history-back').addEventListener('click', () => showView('home'));
    $('btn-clear-all').addEventListener('click', clearAllHistory);
    $('btn-detail-back').addEventListener('click', () => { renderHistory(); showView('history'); });
    $('btn-detail-delete').addEventListener('click', deleteCurrentDetail);

    $('btn-copy-ppt').addEventListener('click', copyPptText);
    $('btn-copy-notes').addEventListener('click', copySpeakerNotes);
    $('btn-download-html').addEventListener('click', downloadPptHtml);
    $('btn-print-ppt').addEventListener('click', printPpt);

    $('btn-demo').addEventListener('click', runOneClickDemo);
    $('btn-demo-large').addEventListener('click', runOneClickDemo);
    $('btn-settings').addEventListener('click', openSettings);
    $('btn-settings-close').addEventListener('click', closeSettings);
    $('settings-backdrop').addEventListener('click', closeSettings);
    $('btn-save-settings').addEventListener('click', saveSettings);
    $('btn-test-connection').addEventListener('click', testConnection);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const modal = $('settings-modal');
        if (modal && !modal.classList.contains('hidden')) closeSettings();
        const guide = $('demo-guide-overlay');
        if (guide && !guide.classList.contains('hidden')) closeDemoGuide();
      }
    });

    document.querySelectorAll('input[name="api-mode"]').forEach(r => {
      r.addEventListener('change', () => {
        const mode = r.value;
        applyRealApiVisibility();
        if (mode === 'local') {
          $('setting-provider').value = 'local';
          $('setting-base-url').value = '/api';
          if (!$('setting-model').value) $('setting-model').value = 'Local-Proxy';
        } else if (mode === 'mock') {
          $('setting-provider').value = 'mock';
          $('setting-base-url').value = '';
          $('setting-model').value = 'Mock-StudyAgent';
        }
      });
    });
    $('setting-provider').addEventListener('change', (e) => {
      const preset = API_PROVIDER_PRESETS[e.target.value];
      if (preset) {
        if (preset.baseUrl) $('setting-base-url').value = preset.baseUrl;
        if (preset.defaultModel) $('setting-model').value = preset.defaultModel;
      }
    });
  }

  function handleImagePick(e) {
    const files = Array.from(e.target.files || []);
    files.forEach(f => uploadedImages.push({ name: f.name, size: f.size, type: f.type }));
    e.target.value = '';
    renderFileList();
  }

  function handleFilePick(e) {
    const files = Array.from(e.target.files || []);
    files.forEach(f => uploadedFiles.push({ name: f.name, size: f.size, type: f.type }));
    e.target.value = '';
    renderFileList();
  }

  function getFileIcon(name) {
    const ext = (name.split('.').pop() || '').toLowerCase();
    const map = { pdf: '📄', doc: '📝', docx: '📝', txt: '📃', md: '📃', ppt: '📊', pptx: '📊',
                  png: '🖼️', jpg: '🖼️', jpeg: '🖼️', gif: '🖼️', bmp: '🖼️', webp: '🖼️' };
    return map[ext] || '📎';
  }

  function renderFileList() {
    const list = $('file-list');
    const items = [
      ...uploadedImages.map((f, i) => ({ ...f, _idx: i, _type: 'image' })),
      ...uploadedFiles.map((f, i) => ({ ...f, _idx: i, _type: 'file' })),
    ];
    if (items.length === 0) { list.innerHTML = ''; return; }
    list.innerHTML = items.map(f =>
      `<div class="file-item">
        <span class="file-icon">${getFileIcon(f.name)}</span>
        <span class="file-name">${escHtml(f.name)}</span>
        <button class="file-remove" data-type="${f._type}" data-idx="${f._idx}" title="移除">✕</button>
      </div>`
    ).join('');
    list.querySelectorAll('.file-remove').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        const idx = parseInt(btn.dataset.idx);
        if (type === 'image') uploadedImages.splice(idx, 1);
        else uploadedFiles.splice(idx, 1);
        renderFileList();
      });
    });
  }

  /* ─── Processing Panel ─────────────────────────────────── */
  async function showProcessingSteps(states, onComplete) {
    const panel = $('processing-panel');
    const stepsContainer = $('processing-steps');
    const titleEl = $('processing-title');
    panel.classList.remove('hidden');
    stepsContainer.innerHTML = '';
    titleEl.textContent = 'Agent 工作中...';
    let maxStep = 0;

    for (let i = 0; i < states.length; i++) {
      const s = states[i];
      if (s.step > maxStep) {
        maxStep = s.step;
        setWorkflowStep(s.step);
      }
      const stepEl = document.createElement('div');
      stepEl.className = 'processing-step processing-active';
      stepEl.innerHTML = `
        <div class="processing-step-spinner"></div>
        <span class="processing-step-text">${escHtml(s.text)}</span>`;
      stepsContainer.appendChild(stepEl);
      stepsContainer.scrollTop = stepsContainer.scrollHeight;

      if (s.delay > 0) await sleep(s.delay);

      stepEl.classList.remove('processing-active');
      stepEl.classList.add('processing-done');
      stepEl.querySelector('.processing-step-spinner').outerHTML = '<span class="processing-step-check">✓</span>';
    }

    panel.classList.add('hidden');
    if (onComplete) onComplete();
  }

  /* ─── Version Management ───────────────────────────────── */
  function createInitialVersion(request, response) {
    currentVersions = [{
      versionId: genId(),
      versionNumber: 1,
      taskType: request.taskType,
      userRequest: request.text,
      followUpText: null,
      resultContent: response.content,
      pptData: response.pptData || null,
      structuredResult: response.structuredResult || null,
      createdAt: new Date(),
    }];
    currentVersionIndex = 0;
    changedSlideIndices = new Set();
    addedSlideIndices = new Set();
  }

  function addVersion(followUpText, response) {
    const oldVersion = getCurrentVersion();
    const newVersion = {
      versionId: genId(),
      versionNumber: currentVersions.length + 1,
      taskType: currentRequest.taskType,
      userRequest: currentRequest.text,
      followUpText: followUpText,
      resultContent: response.content,
      pptData: response.pptData || null,
      structuredResult: response.structuredResult || null,
      createdAt: new Date(),
    };
    currentVersions.push(newVersion);
    currentVersionIndex = currentVersions.length - 1;
    const changes = computeVersionDiff(oldVersion, newVersion, followUpText);
    return { version: newVersion, changes };
  }

  function getCurrentVersion() {
    return currentVersions[currentVersionIndex];
  }

  function renderVersionBar() {
    const bar = $('version-bar');
    if (currentVersions.length <= 1) {
      bar.classList.add('hidden');
      $('version-diff-card').classList.add('hidden');
      return;
    }
    bar.classList.remove('hidden');
    $('version-current').textContent = 'V' + getCurrentVersion().versionNumber;
    $('version-count').textContent = `共 ${currentVersions.length} 个版本`;
    const switcher = $('version-switcher');
    switcher.innerHTML = currentVersions.map((v, i) =>
      `<button class="version-chip${i === currentVersionIndex ? ' active' : ''}" data-idx="${i}" title="${v.followUpText ? '跟进：' + escHtml(v.followUpText) : '初始版本'}">V${v.versionNumber}</button>`
    ).join('');
    switcher.querySelectorAll('.version-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        currentVersionIndex = parseInt(btn.dataset.idx);
        const v = getCurrentVersion();
        currentResponse = {
          success: true,
          content: v.resultContent,
          pptData: v.pptData,
          structuredResult: v.structuredResult,
          modelName: MODEL_NAME,
          createdAt: v.createdAt,
        };
        currentPptData = v.pptData;
        currentStructuredResult = v.structuredResult;
        changedSlideIndices = new Set();
        addedSlideIndices = new Set();
        renderResult(currentRequest, currentResponse);
        renderVersionBar();
        $('version-diff-card').classList.add('hidden');
        renderTaskStats();
      });
    });
  }

  /* ─── Process Task ──────────────────────────────────────── */
  async function processTask() {
    const text = $('input-text').value.trim();
    if (!text && uploadedImages.length === 0 && uploadedFiles.length === 0) {
      showToast('请先输入内容或上传文件/图片。', 'error');
      return;
    }

    $('btn-process').disabled = true;
    resetTimeline();
    addTimelineEvent('创建任务', 'create');

    const request = {
      id: genId(),
      taskType: currentTaskType,
      text: text,
      imageNames: uploadedImages.map(f => f.name),
      fileNames: uploadedFiles.map(f => f.name),
      createdAt: new Date(),
    };

    await setWorkflowStep(0);
    await sleep(200);
    addTimelineEvent('提交作业要求', 'submit');

    const states = PROCESSING_STATES[currentTaskType] || PROCESSING_STATES.default;
    const typeName = TASK_MAP[currentTaskType]?.name || '作业';

    return new Promise(resolve => {
      showProcessingSteps(states, async () => {
        const match = PromptRouterService.analyzeRequest(request);
        currentPromptMatch = match;

        addTimelineEvent(`识别为${typeName}：${match.topic}`, 'identify');
        addTimelineEvent(`匹配${match.templateName}`, 'match');

        let response;
        const useLocalBackend = apiSettings.mode === 'local' && IS_LOCAL_SERVER && localBackendStatus === 'connected';

        if (useLocalBackend) {
          addTimelineEvent('通过本地后端代理请求', 'api');
        }

        response = mockProcessHomeworkTask(request, match);

        currentRequest = request;
        currentResponse = response;
        isSaved = false;
        currentPptData = response.pptData || null;
        currentStructuredResult = response.structuredResult || null;

        createInitialVersion(request, response);

        addTimelineEvent(`生成初稿 V1（${currentPptData ? currentPptData.pageCount + '页' : '结构化结果'}）`, 'generate');
        addTimelineEvent('等待用户继续修改', 'wait');

        setWorkflowStep(4);
        $('btn-process').disabled = false;

        renderPromptMatch(match);
        renderResult(request, response);
        renderVersionBar();
        renderTaskStats();
        renderTimeline();
        showFollowUpPanel();
        showView('result');

        followupHintText = '';
        if (window_isDemoRun) {
          followupHintText = '💡 请点击下方「改成10页」快捷按钮，体验从V1迭代到V2的完整跟进过程！';
          demoWaitingForFollowup = true;
          window_isDemoRun = false;
        }
        renderFollowUpQuickActions();
        resolve();
      });
    });
  }

  /* ─── Mock API: Process Homework Task ───────────────────── */
  function mockProcessHomeworkTask(request, match) {
    const generators = {
      solve:        () => generateProblemSolvingResult(request),
      write:        () => generateWritingResult(request),
      translate:    () => generateTranslateResult(request),
      code:         () => generateCodeResult(request),
      summarize:    () => generateSummarizeResult(request),
      experiment:   () => generateExperimentReportResult(request, match),
      thesis:       () => generatePaperStructureResult(request, match),
      presentation: () => generatePresentationResult(request),
      review:       () => generateReviewOutlineResult(request),
      ppt:          () => generatePptResult(request, match),
      defense:      () => generateDefensePrepResult(request),
      teamwork:     () => generateTeamworkResult(request),
    };
    return (generators[request.taskType] || generators.solve)();
  }

  /* ─── Structured Result Generators ─────────────────────── */

  function extractTopic(input) {
    return PromptRouterService.extractTopic(input);
  }
  function extractPageCount(input) { return PromptRouterService.extractPageCount(input); }
  function extractCourse(input) { return PromptRouterService.extractCourse(input); }
  function extractDuration(input, pageCount) { return PromptRouterService.extractDuration(input, pageCount); }

  function pickStyle(topic) {
    if (/AI|人工智能|智能|机器学习|深度学习|数据|科技|技术|计算机|算法|机器人/.test(topic))
      return '科技蓝紫渐变，简洁现代，深色背景配亮色点缀';
    if (/乡村|振兴|农业|农村|扶贫|民生|社会/.test(topic))
      return '绿色/大地色系，温暖自然，图文结合';
    if (/历史|文化|传统|文学|哲学|艺术/.test(topic))
      return '中国风/文艺米色系，留白充足，字体优雅';
    if (/实验|报告|答辩|研究|论文|学术|调研/.test(topic))
      return '学术蓝白配色，严谨简洁，突出数据和结论';
    if (/经济|金融|管理|商业|市场|营销|创业/.test(topic))
      return '商务蓝灰色调，专业大气，数据图表丰富';
    return '蓝紫渐变现代简约风格，清新明快，适合课堂展示';
  }

  function calcPerPageTime(duration, pageCount) {
    const mins = parseInt(duration) || 5;
    const totalSec = mins * 60;
    const coverEndSec = 30;
    const contentSec = totalSec - 2 * coverEndSec;
    const contentPages = Math.max(1, pageCount - 2);
    return Math.round(contentSec / contentPages / 10) * 10;
  }

  function generatePptSlides(topic, course, pageCount, style, fromFile, hasCase, isDefense, opts) {
    opts = opts || {};
    const enhancedNotes = opts.enhancedNotes || false;
    const hasExtraCase = opts.extraCase || false;
    const premiumStyle = opts.premiumStyle || false;
    const duration = opts.duration || (pageCount + '分钟');
    const perPageSec = calcPerPageTime(duration, pageCount);

    const layouts = getSlideLayout(pageCount, hasExtraCase);
    const slides = [];
    layouts.forEach((layout, idx) => {
      const slide = buildSlideContent(layout, idx, pageCount, topic, course, style, fromFile, hasCase || hasExtraCase, isDefense, { enhancedNotes, premiumStyle, perPageSec });
      slides.push(slide);
    });
    const tocSlide = slides.find(s => s.type === 'toc');
    if (tocSlide) {
      const tocItems = [];
      let num = 1;
      slides.forEach(s => {
        if (s.pageLabel !== '封面' && s.pageLabel !== '目录' && s.pageLabel !== 'Q&A' && s.pageLabel !== '总结与Q&A') {
          const label = s.pageLabel === '不足与展望' ? '总结与展望' : s.pageLabel;
          tocItems.push(`${String(num).padStart(2, '0')}  ${label}`);
          num++;
        }
      });
      tocSlide.tocList = tocItems;
    }
    return slides;
  }

  function getSlideLayout(pageCount, extraCase) {
    const layouts8 = [
      { type: 'cover', key: 'cover' }, { type: 'toc', key: 'toc' },
      { type: 'content', key: 'background' }, { type: 'content', key: 'concepts' },
      { type: 'content', key: 'case' }, { type: 'content', key: 'challenges' },
      { type: 'content', key: 'future' }, { type: 'end', key: 'qa' },
    ];
    const layouts10 = [
      { type: 'cover', key: 'cover' }, { type: 'toc', key: 'toc' },
      { type: 'content', key: 'background' }, { type: 'content', key: 'concepts' },
      { type: 'content', key: 'status' }, { type: 'content', key: 'case' },
      { type: 'content', key: 'challenges' }, { type: 'content', key: 'solutions' },
      { type: 'content', key: 'future' }, { type: 'end', key: 'qa' },
    ];
    if (extraCase && pageCount < 10) {
      const base = [...layouts8];
      base.splice(base.length - 2, 0, { type: 'content', key: 'case2' });
      return base;
    }
    if (pageCount === 10) return layouts10;
    if (pageCount >= 12) {
      const extra = pageCount - 10;
      const extraPages = [];
      const extraTopics = ['data', 'comparison', 'methodology'];
      for (let i = 0; i < extra && i < extraTopics.length; i++) extraPages.push({ type: 'content', key: extraTopics[i] });
      const result = [...layouts10];
      result.splice(result.length - 1, 0, ...extraPages);
      return result;
    }
    if (pageCount <= 6) {
      return [
        { type: 'cover', key: 'cover' }, { type: 'toc', key: 'toc' },
        { type: 'content', key: 'background' }, { type: 'content', key: 'core' },
        { type: 'content', key: 'summary' }, { type: 'end', key: 'qa' },
      ];
    }
    return layouts8;
  }

  const SLIDE_CONTENT = {
    cover: (topic, course, style, fromFile, opts) => ({
      title: topic, bullets: [`课程：${course}`, '汇报人：[你的姓名]', `日期：${formatCnDate(new Date())}`, fromFile ? `资料来源：${fromFile}` : ''].filter(Boolean),
      imageSuggestion: '主题相关的高质量背景图，如科技感场景、抽象渐变、校园场景或主题元素',
      designSuggestion: (opts && opts.premiumStyle ? '高端大气' : '') + style + '；标题居中大字（40-48pt），副标题在标题下方，整体保持对称与留白，建议使用渐变色背景',
      speakerNotes: (opts && opts.enhancedNotes ? '【演讲稿】' : '') + `大家好，今天我将围绕"${topic}"这个主题进行汇报。本次汇报${fromFile ? '基于' + fromFile + '，' : ''}将从背景、核心内容、案例分析、问题与展望几个方面展开，预计用时约5分钟，欢迎大家在结束后提问交流。`,
      estimatedTime: '约30秒',
      isCover: true,
    }),
    toc: (topic) => ({
      title: '目录 / 汇报大纲', bullets: [], tocItems: [],
      imageSuggestion: '简洁的目录图标或小装饰元素，不需要大图',
      designSuggestion: '左对齐排列目录项，使用编号+文字，当前项可用主色高亮；保持排版整齐，行距宽松',
      speakerNotes: '首先我来介绍一下本次汇报的整体框架。本次汇报将按以上几个部分依次展开，大家可以先了解一下整体结构。',
      estimatedTime: '约20秒',
    }),
    background: (topic, course, fromFile, opts) => ({
      title: '背景介绍',
      bullets: [`${topic}是${course}中一个重要的研究方向`, '近年来受到学界和业界的广泛关注', fromFile ? `本次汇报的背景资料来源于${fromFile}` : '了解背景有助于我们理解问题的来龙去脉', '这一领域的发展与时代背景密切相关'],
      imageSuggestion: '时间线图、背景场景图片、相关新闻截图或发展趋势示意图',
      designSuggestion: '左侧文字、右侧配图的经典布局，背景信息不宜过多，突出"为什么要研究这个主题"',
      speakerNotes: (opts?.enhancedNotes ? '【演讲稿】' : '') + '首先我们来看一下背景。任何一个主题的出现都有其时代背景和现实需求。' + topic + '近年来之所以受到广泛关注，与技术发展和社会需求密切相关。了解背景能够帮助我们更好地理解后续内容的意义。',
      estimatedTime: (opts?.perPageSec || 40) + '秒',
    }),
    concepts: (topic, ctx, opts) => ({
      title: ctx.pageCount >= 10 ? '基本概念与定义' : '核心概念与定义',
      bullets: [`什么是${topic}？核心定义是什么`, '相关的关键术语解释', `${topic}的主要特征和分类`, '与其他相关概念的区别和联系'],
      imageSuggestion: '概念关系图、思维导图或定义文字+图标组合',
      designSuggestion: '关键词加粗突出，可用图标配合每个概念；术语定义简洁明了，避免大段文字',
      speakerNotes: (opts?.enhancedNotes ? '【演讲稿】' : '') + `在深入讨论之前，我们需要先明确几个核心概念。首先是"${topic}"的定义，以及与它相关的几个关键术语。理解了这些概念，后面的内容就更容易跟上了。我会尽量用通俗的语言解释，避免过多专业术语。`,
      estimatedTime: (opts?.perPageSec || 40) + '秒',
    }),
    status: (topic, opts) => ({
      title: '发展现状',
      bullets: [`当前${topic}领域的整体发展态势`, '国内外主要发展情况对比', '关键数据和典型现象', '目前已经取得的主要成果'],
      imageSuggestion: '数据图表（柱状图/折线图/饼图）、发展时间线或统计数据可视化',
      designSuggestion: '多用图表展示数据，少用文字；关键数字放大突出，配合简短说明',
      speakerNotes: (opts?.enhancedNotes ? '【演讲稿】' : '') + '接下来看一下发展现状。通过这些数据我们可以看到这个领域近年来的发展趋势和已有的成果，这为后续的分析提供了基础。',
      estimatedTime: (opts?.perPageSec || 40) + '秒',
    }),
    case: (topic, hasCase, opts) => ({
      title: hasCase ? '典型案例分析' : '核心内容分析',
      bullets: hasCase ? [`案例一：${topic}在实际场景中的典型应用`, '案例背景与实施过程', '取得的效果与关键数据', '案例启示：成功因素与经验总结']
        : [`${topic}的核心机制/原理详解`, '关键要素之间的关系分析', '典型场景下的应用方式', '需要注意的关键要点'],
      imageSuggestion: hasCase ? '案例相关图片、流程示意图、前后对比图或成果展示图' : '流程图、结构图、原理图或关系示意图',
      designSuggestion: hasCase ? '案例可用"问题-方案-效果"三段式布局，配图突出场景感' : '使用结构图展示关系，关键步骤编号呈现',
      speakerNotes: (opts?.enhancedNotes ? '【演讲稿】' : '') + (hasCase ? `理论需要结合实际。这里我们来看一个典型案例。通过分析这个案例，我们可以更直观地理解${topic}在实际中是如何应用的，以及取得了什么样的效果。` : `接下来是本次汇报的核心内容。我将从原理层面分析${topic}的关键机制，帮助大家深入理解这个主题的核心要点。`),
      estimatedTime: (opts?.perPageSec || 50) + '秒',
    }),
    case2: (topic, opts) => ({
      title: '补充案例分析',
      bullets: [`另一个${topic}的典型应用案例`, '不同场景下的差异化表现', '案例对比与启示', '可推广的经验总结'],
      imageSuggestion: '第二个案例的场景图片、对比表格或数据图表',
      designSuggestion: '可用双栏对比布局展示两个案例的异同，突出案例间的互补性',
      speakerNotes: (opts?.enhancedNotes ? '【演讲稿】' : '') + '为了让大家有更全面的认识，我再补充一个不同场景下的案例。通过对比不同案例，我们可以发现一些共性的规律和值得借鉴的经验。',
      estimatedTime: (opts?.perPageSec || 40) + '秒',
    }),
    challenges: (topic, ctx, opts) => ({
      title: (ctx.pageCount >= 10 || ctx.isDefense) ? '问题分析' : '问题与挑战',
      bullets: [`当前${topic}面临的主要问题`, '技术/实践层面的难点', (ctx.pageCount >= 10 || ctx.isDefense) ? '问题产生的原因分析' : '社会/伦理层面的争议（如适用）', '未来需要克服的障碍'],
      imageSuggestion: '问题鱼骨图、挑战示意图或对比表格',
      designSuggestion: '可用红色/橙色系突出"问题"感，问题分组呈现，每组2-3条，保持清晰',
      speakerNotes: (opts?.enhancedNotes ? '【演讲稿】' : '') + '在了解现状之后，我们需要客观分析当前存在的问题及其产生的原因。只有找准问题，才能提出有效的解决对策。这也是我们大学生做研究和汇报时需要重点关注的批判性思维部分。',
      estimatedTime: (opts?.perPageSec || 40) + '秒',
    }),
    solutions: (topic, opts) => ({
      title: '解决思路与对策',
      bullets: ['针对上述问题的应对策略', '可操作的具体建议', '国内外可借鉴的经验', '个人/团队可以做的努力'],
      imageSuggestion: '对策矩阵图、路径示意图、方案对比表',
      designSuggestion: '问题与对策可用左右对比布局，或箭头式路径图，突出"从问题到方案"的逻辑',
      speakerNotes: (opts?.enhancedNotes ? '【演讲稿】' : '') + '认识问题是为了解决问题。针对刚才提到的挑战，我梳理了以下几条解决思路，既有宏观层面的建议，也有我们作为大学生可以实际去做的方向。',
      estimatedTime: (opts?.perPageSec || 40) + '秒',
    }),
    future: (topic, ctx, opts) => ({
      title: ctx.pageCount >= 10 ? '总结与展望' : '发展趋势与展望',
      bullets: ctx.pageCount >= 10
        ? [`本次汇报关于${topic}的核心结论`, `${topic}未来的发展方向`, '可能带来的变革与影响', '对我们学习和实践的启示']
        : [`${topic}未来的发展方向`, '可能带来的变革与影响', '值得关注的新技术/新动向', '对我们学习和实践的启示'],
      imageSuggestion: '未来感场景图、趋势箭头图、展望星空/道路意象图',
      designSuggestion: '可使用渐变色或光效元素体现"未来感"，语言积极向上',
      speakerNotes: (opts?.enhancedNotes ? '【演讲稿】' : '') + (ctx.pageCount >= 10
        ? `最后，我对本次汇报做一个简要总结，并展望一下${topic}未来的发展趋势。希望这些内容能对大家的学习和思考有所启发。`
        : '最后来看一下未来的发展趋势。这个领域还有很大的发展空间，值得我们持续关注，也为我们未来的学习和研究方向提供了参考。'),
      estimatedTime: (opts?.perPageSec || 40) + '秒',
    }),
    data: (topic, opts) => ({
      title: '数据与调研分析', bullets: ['核心数据汇总与解读', '关键指标对比分析', '数据反映出的规律', '数据支撑的核心观点'],
      imageSuggestion: '数据看板、多张图表组合、关键数字大字呈现',
      designSuggestion: '以图表为主，文字只用于数据标注，数字醒目，图表配色统一',
      speakerNotes: (opts?.enhancedNotes ? '【演讲稿】' : '') + '数据是最有说服力的。这一页展示了核心数据和调研结果，通过数据我们可以更客观地认识问题。',
      estimatedTime: (opts?.perPageSec || 40) + '秒',
    }),
    comparison: (topic, opts) => ({
      title: '对比分析', bullets: ['不同方案/模式的对比', '国内外差异比较', '优缺点分析', '适用场景总结'],
      imageSuggestion: '对比表格、双栏对比图、雷达图或维恩图',
      designSuggestion: '推荐使用表格或双栏对比，优点用绿色标注，缺点用橙色标注',
      speakerNotes: (opts?.enhancedNotes ? '【演讲稿】' : '') + '为了更全面地认识这个问题，我们来做一个对比分析。',
      estimatedTime: (opts?.perPageSec || 40) + '秒',
    }),
    methodology: (topic, opts) => ({
      title: '研究方法 / 实施方法', bullets: ['采用的研究/分析方法', '方法选择的理由', '具体实施步骤', '方法的优势与局限'],
      imageSuggestion: '方法流程图、步骤示意图、框架模型图',
      designSuggestion: '步骤用编号+箭头串联，清晰展示流程，每个步骤配小图标',
      speakerNotes: (opts?.enhancedNotes ? '【演讲稿】' : '') + '这里简要介绍一下本次汇报/研究采用的方法。',
      estimatedTime: (opts?.perPageSec || 40) + '秒',
    }),
    core: (topic, opts) => ({
      title: '核心内容', bullets: [`${topic}的核心要点一：基本概念与原理`, '核心要点二：关键机制或方法', '核心要点三：实际应用场景', '核心要点四：总结与思考'],
      imageSuggestion: '核心内容结构图、要点图标+文字组合',
      designSuggestion: '四个要点可用四宫格布局，每个要点配图标和简短说明',
      speakerNotes: (opts?.enhancedNotes ? '【演讲稿】' : '') + `由于时间有限，我将${topic}的核心内容浓缩为几个要点。`,
      estimatedTime: (opts?.perPageSec || 50) + '秒',
    }),
    summary: (topic, opts) => ({
      title: '总结', bullets: [`本次汇报围绕${topic}进行了系统梳理`, '核心要点回顾：背景-内容-结论', '主要发现和启示', '感谢大家的聆听！'],
      imageSuggestion: '简洁总结图标、关键词云或呼应封面的背景',
      designSuggestion: '要点简洁有力，可使用"回顾+收获+感谢"三段式',
      speakerNotes: (opts?.enhancedNotes ? '【演讲稿】' : '') + '以上就是本次汇报的全部内容。感谢大家的聆听！',
      estimatedTime: '约30秒',
    }),
    qa: (topic, includeSummary, opts) => ({
      title: includeSummary ? '总结与Q&A' : '谢谢聆听 · 欢迎提问',
      bullets: includeSummary ? [`本次汇报围绕${topic}进行了系统梳理`, '核心要点回顾：背景→概念→案例→趋势', '感谢大家的聆听！', '欢迎提问与交流']
        : ['Q & A', '感谢老师和同学们的聆听', '欢迎批评指正', '联系方式（可选）'],
      imageSuggestion: includeSummary ? '简洁总结图标+关键词云' : '简洁的Q&A文字+装饰元素',
      designSuggestion: '与封面风格呼应，大字居中，简洁大方',
      speakerNotes: (opts?.enhancedNotes ? '【演讲稿】' : '') + (includeSummary ? `以上就是关于${topic}的全部汇报内容。感谢大家的聆听！有什么问题欢迎提问。` : '我的汇报到这里就结束了，谢谢大家！欢迎提问。'),
      estimatedTime: '约30秒',
      isEnd: true,
    }),
  };

  function buildSlideContent(layout, idx, totalPages, topic, course, style, fromFile, hasCase, isDefense, opts) {
    const pageNum = idx + 1;
    const isLast = pageNum === totalPages;
    const ctx = { pageCount: totalPages, isDefense: isDefense };
    const builder = SLIDE_CONTENT[layout.key];
    let data;
    if (layout.key === 'toc') data = builder(topic);
    else if (layout.key === 'cover') data = builder(topic, course, style, fromFile, opts);
    else if (layout.key === 'background') data = builder(topic, course, fromFile, opts);
    else if (layout.key === 'concepts' || layout.key === 'challenges' || layout.key === 'future') data = builder(topic, ctx, opts);
    else if (layout.key === 'qa') data = builder(topic, isLast && totalPages <= 8, opts);
    else if (layout.key === 'case') data = builder(topic, hasCase, opts);
    else data = builder(topic, opts);

    const basePageLabels = {
      cover: '封面', toc: '目录',
      background: isDefense ? '研究背景' : '背景介绍',
      concepts: totalPages >= 10 ? '基本概念' : '核心概念',
      status: '发展现状', case: hasCase ? '典型案例' : '核心内容',
      case2: '补充案例', challenges: (totalPages >= 10 || isDefense) ? '问题分析' : '问题与挑战',
      solutions: '解决思路', future: totalPages >= 10 ? '总结展望' : '发展趋势',
      data: '数据分析', comparison: '对比分析', methodology: '研究方法',
      core: '核心内容', summary: '总结', qa: isLast && totalPages <= 8 ? '总结与Q&A' : 'Q&A',
    };
    let pageLabel = basePageLabels[layout.key] || '内容';

    return {
      pageNumber: pageNum, totalPages: totalPages, pageLabel: pageLabel, type: layout.type,
      title: data.title, bullets: data.bullets || [], tocList: data.tocList || null,
      imageSuggestion: data.imageSuggestion, designSuggestion: data.designSuggestion,
      speakerNotes: data.speakerNotes, estimatedTime: data.estimatedTime || '约40秒',
      isCover: data.isCover || false, isEnd: data.isEnd || false,
    };
  }

  function generatePresentationTips(pageCount, duration, slides) {
    const perPage = Math.round((parseInt(duration) / pageCount) * 10) / 10;
    return [
      `时间分配：总计约${duration}，平均每页${perPage}分钟，封面和Q&A页各30秒，重点内容页可适当多花时间`,
      '重点页面：核心概念、案例分析、总结页是汇报重点，建议重点准备',
      '避免内容过满：每页bullet points控制在3-5条，用关键词代替长句',
      '眼神交流：讲解时面向听众而非盯着屏幕，重点页可适当互动',
      '语速控制：紧张时容易语速过快，刻意放慢；重点处停顿1-2秒',
      '提前演练：至少完整演练2-3遍，熟悉翻页节奏',
      '备用预案：对可能被问到的问题提前准备答案',
    ];
  }

  function generatePossibleQuestions(topic, isDefense) {
    const base = [`你为什么选择"${topic}"这个主题？`, '你的核心观点/结论是什么？', '你参考了哪些资料/文献？'];
    if (isDefense) { base.push('你的研究方法有什么局限性？', '如果继续深入研究，你会从哪些方面改进？'); }
    else { base.push(`你认为${topic}最大的挑战是什么？`, '这个主题对我们大学生有什么实际意义？'); }
    base.push('你能举一个更具体的例子来说明吗？');
    return base;
  }

  function generatePptResult(request, match) {
    const input = request.text || '';
    const totalFiles = request.imageNames.length + request.fileNames.length;
    const fromFileNote = totalFiles > 0
      ? `根据上传的${[...request.fileNames, ...request.imageNames].map(n => `"${n}"`).join('、')}整理` : '';
    const m = match || PromptRouterService.analyzeRequest(request);
    const topic = m.topic;
    const pageCount = m.pageCount;
    const course = m.course;
    const duration = m.duration;
    const style = pickStyle(topic);
    const hasCase = m.hasCase;
    const isDefense = /答辩|实验报告/.test(input);
    const slides = generatePptSlides(topic, course, pageCount, style, fromFileNote, hasCase, isDefense, {
      enhancedNotes: m.hasNotes,
      duration: duration,
      premiumStyle: m.isFormal,
    });
    const tips = generatePresentationTips(pageCount, duration, slides);
    const questions = generatePossibleQuestions(topic, isDefense);

    const pptData = {
      title: topic, course: course, pageCount: pageCount, style: style, duration: duration,
      fromFile: fromFileNote, slides: slides, presentationTips: tips, possibleQuestions: questions,
    };
    const readableText = buildPptReadableText(pptData);
    return { content: readableText, pptData: pptData, structuredResult: { type: 'ppt', data: pptData } };
  }

  function buildPptReadableText(ppt) {
    let text = `## PPT 基本信息\n\n- **PPT 标题**：${ppt.title}\n- **适用课程**：${ppt.course}\n- **建议页数**：${ppt.pageCount} 页\n- **适合展示时长**：${ppt.duration}\n- **推荐风格**：${ppt.style}\n${ppt.fromFile ? `- **资料来源**：${ppt.fromFile}` : ''}\n\n## PPT 页面大纲\n\n`;
    ppt.slides.forEach(s => {
      text += `### 第${s.pageNumber}页：${s.pageLabel} — ${s.title}\n\n`;
      if (s.bullets && s.bullets.length > 0) s.bullets.forEach(b => { if (b) text += `- ${b}\n`; });
      if (s.tocList) s.tocList.forEach(t => { text += `- ${t}\n`; });
      text += '\n';
    });
    text += `## 展示建议\n\n`;
    ppt.presentationTips.forEach(t => { text += `- ${t}\n`; });
    text += '\n## 答辩时可能被问的问题\n\n';
    ppt.possibleQuestions.forEach(q => { text += `- ${q}\n`; });
    return text;
  }

  /* ─── Experiment Report ─────────────────────────────────── */
  function generateExperimentReportResult(request, match) {
    const input = request.text || '';
    const topic = (match && match.topic) || extractTopic(input) || '相关实验';
    const modules = [
      { key: 'name', icon: '📌', title: '实验名称', content: `${topic}实验` },
      { key: 'purpose', icon: '🎯', title: '实验目的', items: [
        '验证/探究相关的理论原理和规律',
        '掌握实验仪器的正确使用方法',
        '培养科学实验素养和数据处理能力',
        '理解实验设计思路和控制变量方法',
      ]},
      { key: 'principle', icon: '📐', title: '实验原理', items: [
        '核心理论：对应章节的基本定律/定理',
        '关键公式：实验数据处理所需的核心公式',
        '物理/化学/生物学机制简述',
        '公式中各物理量的含义和单位',
      ]},
      { key: 'equipment', icon: '🔧', title: '实验器材', items: [
        '主要仪器设备（列出型号和规格）',
        '辅助器材和耗材',
        '注意：使用前检查仪器状态和精度',
      ]},
      { key: 'steps', icon: '📋', title: '实验步骤', items: [
        '1. 实验准备：阅读指导书、检查器材、设计数据记录表格',
        '2. 仪器调试：按要求组装仪器、调零校准',
        '3. 实验操作：按步骤操作，仔细观察现象，如实记录数据',
        '4. 重复测量：改变条件多次测量，保证数据可靠性',
        '5. 整理器材：实验结束后整理仪器，清洁实验台',
      ]},
      { key: 'data', icon: '📊', title: '数据处理思路', items: [
        '设计规范的数据记录表格',
        '多次测量取平均值，减小随机误差',
        '使用作图法或最小二乘法处理数据',
        '计算不确定度，给出结果的完整表达',
        '用图表直观展示数据规律',
      ]},
      { key: 'error', icon: '⚠️', title: '误差分析', items: [
        { label: '系统误差', desc: '仪器未校准、方法近似、环境影响 → 校准仪器、改进方法' },
        { label: '随机误差', desc: '环境波动、人为判断差异 → 多次测量取平均' },
        { label: '过失误差', desc: '操作失误、读错数据 → 规范操作、仔细读数' },
      ], isTable: true },
      { key: 'conclusion', icon: '✅', title: '结论模板', items: [
        '本实验通过___方法，验证/测量了___',
        '实验结果为：___（含不确定度）',
        '与理论值对比，相对误差为___%',
        '实验结果在误差范围内与理论一致/不一致',
        '误差来源主要是___，可以通过___方法改进',
      ]},
      { key: 'notes', icon: '💡', title: '注意事项', items: [
        '严格遵守实验室安全规范',
        '实验数据必须真实记录，严禁编造',
        '仪器操作要轻缓，避免损坏',
        '实验结束后整理器材、清洁桌面',
        '报告要独立完成，数据处理过程要详细',
      ]},
    ];
    const structuredResult = { type: 'experiment', topic, modules };
    const content = buildExperimentReadableText(topic, modules);
    return { content, structuredResult, pptData: null };
  }

  function buildExperimentReadableText(topic, modules) {
    let text = `# ${topic}实验报告框架\n\n`;
    modules.forEach(m => {
      text += `## ${m.icon} ${m.title}\n\n`;
      if (m.content) text += `${m.content}\n\n`;
      if (m.items) {
        if (m.isTable) {
          text += '| 误差类型 | 来源 | 减小方法 |\n|----------|------|----------|\n';
          m.items.forEach(i => { text += `| ${i.label} | ${i.desc.split('→')[0].trim()} | ${i.desc.split('→')[1] ? i.desc.split('→')[1].trim() : ''} |\n`; });
          text += '\n';
        } else {
          m.items.forEach(i => { text += `- ${i}\n`; });
          text += '\n';
        }
      }
    });
    text += '> ⚠️ 以上为实验报告框架模板，请根据实际实验数据独立填写报告。数据必须真实，严禁编造。\n';
    return text;
  }

  /* ─── Thesis/Paper Structure ────────────────────────────── */
  function generatePaperStructureResult(request, match) {
    const input = request.text || '';
    const topic = (match && match.topic) || extractTopic(input) || '选定研究方向';
    const chapters = [
      { key: 'title', icon: '📌', title: '题目建议', items: [
        `${topic}——基于___的研究`,
        `${topic}的影响因素与对策研究`,
        `${topic}现状、问题与优化路径`,
        '选题原则：具体、可行、有价值、有创新',
      ]},
      { key: 'abstract', icon: '📝', title: '摘要思路', items: [
        '研究背景与目的（1-2句）：为什么要研究这个问题？',
        '研究方法（1-2句）：用了什么方法？',
        '主要发现（2-3句）：发现了什么？',
        '研究意义（1句）：有什么价值？',
        '字数控制在300字左右',
      ]},
      { key: 'keywords', icon: '🔑', title: '关键词', items: [
        '3-5个核心关键词',
        '从研究对象、方法、核心变量中选取',
        '按照从大到小的顺序排列',
      ]},
      { key: 'ch1', icon: '📖', title: '第一章：引言', items: [
        '1.1 研究背景：时代背景+现实需求',
        '1.2 研究目的与意义：理论意义+实践意义',
        '1.3 国内外研究现状：文献综述',
        '1.4 研究内容与方法',
        '1.5 论文结构安排',
      ]},
      { key: 'ch2', icon: '📚', title: '第二章：理论基础', items: [
        '2.1 核心概念界定',
        '2.2 相关理论基础',
        '2.3 理论分析框架',
      ]},
      { key: 'ch3', icon: '📊', title: '第三章：现状分析', items: [
        '3.1 发展现状概述',
        '3.2 数据分析/案例分析',
        '3.3 现有成效',
      ]},
      { key: 'ch4', icon: '🔍', title: '第四章：问题与对策', items: [
        '4.1 存在的主要问题',
        '4.2 问题成因分析',
        '4.3 解决对策与建议',
      ]},
      { key: 'ch5', icon: '🎯', title: '第五章：总结', items: [
        '5.1 研究结论',
        '5.2 研究不足',
        '5.3 未来展望',
      ]},
      { key: 'method', icon: '🔬', title: '研究方法建议', items: [
        '文献研究法：查阅相关文献，了解研究现状',
        '问卷调查法：设计问卷收集数据（如适用）',
        '访谈法：对相关人员进行深度访谈（如适用）',
        '案例分析法：选取典型案例深入分析',
        '定量分析法：使用统计软件进行数据分析',
      ]},
      { key: 'refs', icon: '📚', title: '参考文献方向', items: [
        '核心期刊论文（CSSCI/SSCI/SCI等）',
        '权威著作和教材',
        '政府报告和统计数据',
        '近5年文献占比不少于60%',
        '参考文献格式遵循GB/T 7714标准',
      ]},
      { key: 'notes', icon: '⚠️', title: '写作注意事项', items: [
        '论文必须独立完成，严禁抄袭',
        '引用他人观点必须注明出处',
        '逻辑清晰，前后呼应',
        '数据来源要可靠',
        '格式规范，排版整齐',
        '提前规划时间，多与导师沟通',
      ]},
    ];
    const structuredResult = { type: 'thesis', topic, chapters };
    const content = buildThesisReadableText(topic, chapters);
    return { content, structuredResult, pptData: null };
  }

  function buildThesisReadableText(topic, chapters) {
    let text = `# 论文结构规划：${topic}\n\n`;
    chapters.forEach(c => {
      text += `## ${c.icon} ${c.title}\n\n`;
      c.items.forEach(i => { text += `- ${i}\n`; });
      text += '\n';
    });
    text += '> ⚠️ 学术诚信提示：论文必须独立完成，严禁抄袭，引用须注明出处。\n';
    return text;
  }

  /* ─── Problem Solving ───────────────────────────────────── */
  function generateProblemSolvingResult(request) {
    const input = request.text || '';
    const subject = detectSubject(input);
    const steps = [
      { icon: '🤔', title: '题目理解', content: `这是一道${subject}题目。请仔细阅读题目，明确题目要求求解的目标量是什么，给出了哪些已知条件，有哪些约束条件。\n\n**你的输入**：\n> ${truncate(input, 200)}` },
      { icon: '📋', title: '已知条件', items: [
        '题目给出的关键数据和参数',
        '隐含条件（如定义域、边界条件等）',
        '需要用到的常量（如g、π等）',
        '题目中的特殊说明和限制',
      ]},
      { icon: '💡', title: '解题思路', items: [
        '识别题型：判断属于哪一类问题',
        '回忆相关知识点和常用方法',
        '选择合适的解题策略（公式法/数形结合/分类讨论/反证法等）',
        '规划解题步骤：先做什么，后做什么',
      ]},
      { icon: '📝', title: '分步骤推导', items: [
        { step: '第一步', desc: '写出相关公式，代入已知数据' },
        { step: '第二步', desc: '进行数学推导/运算，注意每一步的依据' },
        { step: '第三步', desc: '化简求解，注意单位统一和符号变化' },
        { step: '第四步', desc: '检验中间结果是否合理' },
      ], isSteps: true },
      { icon: '✅', title: '最终答案', content: '最终答案需要结合具体题目数据计算得出。建议你：\n- 对照课堂笔记确认方法正确\n- 检查单位是否正确、有效数字是否合理\n- 将结果代回原题验证' },
      { icon: '⚠️', title: '易错点', items: [
        '单位不统一：计算前务必检查单位一致性',
        '符号错误：正负号容易出错，建议每步检验',
        '漏看条件：括号中的说明和小字注释容易忽略',
        '特殊情况：注意边界条件、零值、分母不为零等',
        '计算失误：简单运算也要仔细，建议验算',
      ]},
      { icon: '📚', title: '学习建议', items: [
        '回归课本：先理解基本概念和公式推导过程',
        '多做练习：从基础题开始，逐步提升难度',
        '建立错题本：记录错题和易错点，定期复习',
        '理解原理：解题不是目的，理解背后的原理才是关键',
        '多种方法：尝试用不同方法解同一道题，拓展思路',
      ]},
    ];
    const structuredResult = { type: 'solve', subject, steps };
    const content = buildSolveReadableText(steps);
    return { content, structuredResult, pptData: null };
  }

  function buildSolveReadableText(steps) {
    let text = '';
    steps.forEach(s => {
      text += `## ${s.icon} ${s.title}\n\n`;
      if (s.content) text += `${s.content}\n\n`;
      if (s.items) {
        if (s.isSteps) {
          s.items.forEach(i => { text += `**${i.step}**：${i.desc}\n\n`; });
        } else {
          s.items.forEach(i => { text += `- ${i}\n`; });
          text += '\n';
        }
      }
    });
    return text;
  }

  /* ─── Other Generators ──────────────────────────────────── */
  function generateWritingResult(request) {
    const input = request.text || '';
    const wType = detectWriteType(input);
    const steps = [
      { icon: '🔍', title: '主题分析', content: `根据你的写作要求，这是一篇${wType}类文章。写作前需明确写作目的、目标读者和文体要求。` },
      { icon: '🏗️', title: '文章结构', items: ['开头：引入主题，亮出观点（10%-15%）', '主体段落1：论点一+论据/事例（20%-25%）', '主体段落2：论点二+论据/事例（20%-25%）', '主体段落3：论点三+论据/事例（可选，20%-25%）', '结尾：总结升华，呼应开头（10%-15%）'] },
      { icon: '✍️', title: '写作建议', items: ['每个主体段遵循"论点→论据→分析→小结"四步法', '事例要新颖贴切，避免老套素材', '语言通顺，避免错别字和语病', '注意段落间的过渡和衔接', '写完后通读修改，注意逻辑连贯'] },
    ];
    const structuredResult = { type: 'steps', title: '写作指导', steps };
    const content = buildStepsReadableText(steps) + '\n> ⚠️ 学术诚信提示：以下仅为写作思路参考，请独立完成写作。';
    return { content, structuredResult, pptData: null };
  }

  function generateTranslateResult(request) {
    const input = request.text || '';
    const isZh = detectLang(input) === 'zh';
    const steps = [
      { icon: '📖', title: '原文理解', content: `文本类型：${isZh ? '中文→英文' : '英文→中文'}\n\n${truncate(input, 300)}` },
      { icon: '🌐', title: '翻译要点', items: ['先通读全文，理解整体含义和语气', '识别关键词汇和固定搭配', '注意中英文句式差异，不要逐字直译', '专业术语要准确，必要时查阅词典', '翻译完成后通读检查流畅度'] },
      { icon: '💡', title: '翻译建议', items: ['正式文本使用规范书面语', '文学文本注意意境和修辞', '学术文本注意术语准确性', '日常文本可更自然流畅'] },
    ];
    const structuredResult = { type: 'steps', title: '翻译指导', steps };
    const content = buildStepsReadableText(steps);
    return { content, structuredResult, pptData: null };
  }

  function generateCodeResult(request) {
    const input = request.text || '';
    const steps = [
      { icon: '🎯', title: '需求理解', content: `根据你的描述"${truncate(input, 100)}"，需要实现一个编程相关任务。` },
      { icon: '🧩', title: '实现思路', items: ['理解问题：把需求拆分成小的子问题', '设计方案：选择合适的数据结构和算法', '编写伪代码：先用自然语言描述逻辑', '逐步实现：按模块编写代码', '调试测试：用多种输入测试边界情况'] },
      { icon: '💻', title: '代码示例', content: '```python\ndef solve(data):\n    if data is None:\n        raise ValueError("输入不能为空")\n    # TODO: 根据实际需求实现核心逻辑\n    result = None\n    return result\n```' },
      { icon: '⚠️', title: '常见错误', items: ['边界条件遗漏：空输入、零值等', '类型不匹配：整数/字符串/列表混淆', '索引越界：数组下标超出范围', '未处理异常：缺少try/except'] },
    ];
    const structuredResult = { type: 'steps', title: '编程指导', steps };
    const content = buildStepsReadableText(steps) + '\n> ⚠️ 代码示例仅供学习参考，请理解后自行编写。';
    return { content, structuredResult, pptData: null };
  }

  function generateSummarizeResult(request) {
    const input = request.text || '';
    const cards = [
      { icon: '🎯', title: '核心观点', items: ['资料阐明了主要讨论对象和背景', '分析了问题产生的原因和影响因素', '提出了解决方案或核心结论', '给出了具体的数据和论据支撑'] },
      { icon: '📋', title: '重点知识', items: ['关键概念的定义和内涵', '重要结论及其推导过程', '核心数据和关键论据', '各部分之间的逻辑关系'] },
      { icon: '🗺️', title: '知识框架', content: '主题\n├── 背景与定义\n├── 核心理论/观点\n├── 方法与步骤\n├── 应用场景/案例\n└── 总结与展望' },
      { icon: '📝', title: '复习建议', items: ['三遍复习法：通读→精读→回忆', '主动回忆：用自己的话复述', '联系已有知识：绘制思维导图', '做笔记：用自己的语言总结要点'] },
    ];
    const structuredResult = { type: 'summary', cards };
    const content = buildSummaryReadableText(cards);
    return { content, structuredResult, pptData: null };
  }

  function buildSummaryReadableText(cards) {
    let text = '';
    cards.forEach(c => {
      text += `## ${c.icon} ${c.title}\n\n`;
      if (c.content) text += '```\n' + c.content + '\n```\n\n';
      if (c.items) { c.items.forEach(i => { text += `- ${i}\n`; }); text += '\n'; }
    });
    return text;
  }

  function buildStepsReadableText(steps) {
    let text = '';
    steps.forEach(s => {
      text += `## ${s.icon} ${s.title}\n\n`;
      if (s.content) text += `${s.content}\n\n`;
      if (s.items) { s.items.forEach(i => { text += `- ${i}\n`; }); text += '\n'; }
    });
    return text;
  }

  function generatePresentationResult(request) {
    const input = request.text || '';
    const topic = extractTopic(input);
    const steps = [
      { icon: '🎤', title: '汇报概述', content: `主题：${topic}\n建议先明确听众（老师/同学/评委）、时长和场合。` },
      { icon: '📊', title: '内容结构', items: ['开场（10%）：自我介绍+主题引入+钩子', '主体（70%）：背景→核心内容→案例→结论', '结尾（20%）：总结+感谢+Q&A'] },
      { icon: '⏱️', title: '时间分配', items: ['开场：30秒-1分钟', '每个要点：1-2分钟', '案例/重点：2-3分钟', '总结：30秒-1分钟', '预留Q&A时间'] },
      { icon: '💡', title: '展示技巧', items: ['开场用问题/故事/数据吸引注意', 'PPT每页一个核心信息', '多与听众眼神交流', '语速适中，重点处停顿', '准备备用方案应对突发情况'] },
    ];
    const structuredResult = { type: 'steps', title: '课堂汇报方案', steps };
    const content = buildStepsReadableText(steps);
    return { content, structuredResult, pptData: null };
  }

  function generateReviewOutlineResult(request) {
    const input = request.text || '';
    const topic = extractTopic(input) || '本课程';
    const cards = [
      { icon: '📋', title: '复习范围', content: truncate(input, 200) || '根据课程要求和老师划的重点确定' },
      { icon: '🗺️', title: '知识框架', items: ['基础概念：核心定义、术语', '重要公式/定理：推导过程+适用条件', '典型方法：各类题型的解题套路', '重点题型：作业和考试中的高频题型'] },
      { icon: '⭐', title: '核心考点', items: ['基本概念的理解与辨析', '公式定理的应用条件', '典型例题的解题方法', '易混淆概念的区分', '综合运用能力'] },
      { icon: '⚠️', title: '易错点', items: ['概念理解不深入导致误用', '公式适用条件忽略', '计算粗心导致低级错误', '审题不清答非所问', '时间分配不合理'] },
      { icon: '📅', title: '复习计划', items: ['第一轮（3-5天）：通读教材和笔记，梳理知识框架', '第二轮（2-3天）：重点突破，做题巩固', '第三轮（1-2天）：模拟练习，查漏补缺', '考前1天：回顾错题，保持状态'] },
    ];
    const structuredResult = { type: 'summary', cards };
    const content = buildSummaryReadableText(cards);
    return { content, structuredResult, pptData: null };
  }

  function generateDefensePrepResult(request) {
    const input = request.text || '';
    const topic = extractTopic(input);
    const steps = [
      { icon: '🎤', title: '答辩概述', content: `主题：${topic}\n答辩核心：展示你的研究/工作，回答评委提问。` },
      { icon: '📝', title: '自述稿框架', items: ['开场白：各位老师好，我是XXX，我的论文题目是...', '研究背景与意义：为什么选这个题目', '研究方法与过程：怎么做的', '主要结论与创新点：做出了什么', '不足与展望：有什么可以改进的', '感谢语：感谢导师和各位老师'] },
      { icon: '❓', title: '常见问题', items: ['你为什么选择这个题目？', '你的创新点是什么？', '你的研究方法有什么局限性？', '这个数据/结论是怎么得出的？', '如果继续研究，你会怎么改进？', '你的研究有什么实际意义？'] },
      { icon: '💡', title: '答辩技巧', items: ['自述控制在规定时间内，不要超时', '回答问题先思考几秒，条理清晰', '不会的问题坦诚说明，不要胡编', '态度诚恳谦虚，不要与评委争辩', '提前演练多遍，熟悉内容和PPT', '着装整洁，语速适中，声音洪亮'] },
    ];
    const structuredResult = { type: 'steps', title: '答辩准备方案', steps };
    const content = buildStepsReadableText(steps);
    return { content, structuredResult, pptData: null };
  }

  function generateTeamworkResult(request) {
    const input = request.text || '';
    const topic = extractTopic(input);
    const steps = [
      { icon: '👥', title: '作业分析', content: `主题：${topic}\n先明确作业要求、评分标准、截止时间和交付物。` },
      { icon: '🎯', title: '角色分工', items: ['组长/协调人：统筹进度、组织讨论、对接老师', '资料搜集：查阅文献、收集数据和素材', '内容撰写：负责各部分内容写作', 'PPT制作：设计制作汇报PPT', '发言人：课堂汇报/答辩（可轮流）'] },
      { icon: '📅', title: '时间节点', items: ['第1-2天：讨论确定主题和分工', '第3-5天：各自完成资料搜集和初稿', '第6-7天：汇总讨论，修改完善', '第8天：制作PPT，准备汇报', '第9天：最终检查，彩排演练'] },
      { icon: '⚠️', title: '协作要点', items: ['建群沟通，定期同步进度', '使用在线文档协作编辑', '明确每个人的交付物和截止时间', '遇到问题及时沟通，不要拖延', '最后集体审核，确保质量'] },
    ];
    const structuredResult = { type: 'steps', title: '小组分工方案', steps };
    const content = buildStepsReadableText(steps) + '\n> ⚠️ 分工仅供参考，请团队成员充分沟通后确定。';
    return { content, structuredResult, pptData: null };
  }

  /* ─── Follow-up Task ────────────────────────────────────── */
  async function handleFollowUp() {
    const input = $('followup-input');
    let text = input.value.trim() || (window._demoQuickAction || '');
    window._demoQuickAction = null;
    if (demoWaitingForFollowup && text === '改成10页') {
      text = '改成10页并补充演讲稿';
    }
    if (!text) { showToast('请输入修改要求', 'error'); return; }

    $('followup-loading').classList.remove('hidden');
    $('btn-followup').disabled = true;

    const states = PROCESSING_STATES.followup.map(s => ({ ...s, text: s.text.replace('新版本', `V${currentVersions.length + 1}`) }));

    await new Promise(resolve => {
      showProcessingSteps(states, () => {
        const response = mockFollowUpTask(getCurrentVersion(), text, currentRequest.taskType);
        const { version: newVersion, changes } = addVersion(text, response);

        currentResponse = response;
        currentPptData = response.pptData || null;
        currentStructuredResult = response.structuredResult || null;
        isSaved = false;

        const timeStr = pad2(newVersion.createdAt.getHours()) + ':' + pad2(newVersion.createdAt.getMinutes());
        addTimelineEvent(`用户要求：${truncate(text, 30)}`, 'user');
        addTimelineEvent(`生成优化稿 V${newVersion.versionNumber}`, 'generate');

        setWorkflowStep(4);
        $('followup-loading').classList.add('hidden');
        $('btn-followup').disabled = false;
        input.value = '';

        renderResult(currentRequest, currentResponse);
        renderVersionBar();
        renderVersionDiff(changes, text);
        renderTaskStats();
        renderTimeline();
        renderFollowUpQuickActions();
        showToast(`已优化为 V${newVersion.versionNumber}`, 'success');

        followupHintText = '';
        $('followup-hint').textContent = '你可以继续提出修改要求，逐步打磨这份作业';
        $('followup-hint').classList.remove('hint-highlight');

        if (demoWaitingForFollowup) {
          demoWaitingForFollowup = false;
          setTimeout(() => {
            showToast('✨ 提示：你可以切换V1/V2查看版本差异，或导出PPT', 'success');
          }, 800);
        }

        $('ppt-preview-section').scrollIntoView({ behavior: 'smooth', block: 'start' });
        resolve();
      });
    });
  }

  function mockFollowUpTask(currentVersion, followUpText, taskType) {
    const text = followUpText;
    const basePpt = currentVersion.pptData;
    const baseStructured = currentVersion.structuredResult;

    const opts = {};
    let newPptData = null;
    let newStructured = baseStructured;
    let newContent = currentVersion.resultContent;

    const isCombo10PagesWithNotes = /10.*页.*演讲稿|演讲稿.*10.*页/.test(text);
    if (/10\s*页/.test(text) && basePpt) {
      const topic = basePpt.title, course = basePpt.course;
      const wantNotes = /演讲稿|备注|讲稿/.test(text) || isCombo10PagesWithNotes || basePpt.slides.some(s => s.speakerNotes && s.speakerNotes.includes('【演讲稿】'));
      const newStyle = /高级|高端|大气|正式|学术/.test(text) ? '学术蓝白配色，严谨简洁，突出数据和结论' : basePpt.style;
      const newDuration = basePpt.duration;
      const newSlides = generatePptSlides(topic, course, 10, newStyle, basePpt.fromFile, true, /答辩/.test(topic), {
        enhancedNotes: wantNotes, premiumStyle: /高级|高端|大气/.test(text), duration: newDuration
      });
      newPptData = { ...basePpt, pageCount: 10, slides: newSlides, duration: newDuration, presentationTips: generatePresentationTips(10, newDuration, newSlides), style: newStyle };
      newContent = buildPptReadableText(newPptData);
      newStructured = { type: 'ppt', data: newPptData };
      const comboMsg = isCombo10PagesWithNotes ? '并为每页补充了详细演讲稿' : '';
      newContent = `## ✅ 已调整为 10 页版本${comboMsg}\n\n根据你的要求，已将PPT扩展为10页，增加了"发展现状"和"解决思路"两页${comboMsg ? '，每页都配备了完整演讲稿' : ''}。\n\n` + newContent;
    } else if (/演讲稿|备注|讲稿/.test(text) && basePpt && !/10\s*页/.test(text)) {
      const enhancedSlides = basePpt.slides.map(s => ({
        ...s,
        speakerNotes: '【演讲稿】' + (s.speakerNotes.startsWith('【演讲稿】') ? s.speakerNotes.replace('【演讲稿】', '') : s.speakerNotes) + '（这页我会重点讲解' + s.title + '，注意控制语速，与听众保持眼神交流，适当停顿。）',
      }));
      newPptData = { ...basePpt, slides: enhancedSlides };
      newContent = buildPptReadableText(newPptData);
      newStructured = { type: 'ppt', data: newPptData };
      newContent = `## ✅ 已增强演讲稿\n\n根据你的要求，已为每页补充了详细的演讲备注，包括讲解要点、语速控制和互动提示。\n\n` + newContent;
    } else if (/案例|实例|例子/.test(text)) {
      if (basePpt) {
        const topic = basePpt.title, course = basePpt.course;
        const newSlides = generatePptSlides(topic, course, basePpt.pageCount, basePpt.style, basePpt.fromFile, true, false, { extraCase: true, enhancedNotes: /演讲稿/.test(text), premiumStyle: /高级|高端|大气/.test(text), duration: basePpt.duration });
        newPptData = { ...basePpt, slides: newSlides };
        newContent = buildPptReadableText(newPptData);
        newStructured = { type: 'ppt', data: newPptData };
        newContent = `## ✅ 已增加案例\n\n根据你的要求，已补充了一个典型案例页。\n\n` + newContent;
      } else {
        newContent = currentVersion.resultContent + `\n\n---\n\n## 📌 已补充案例/实例\n\n根据你的要求，已为你补充相关案例方向。\n`;
      }
    } else if (/高级|高端|大气|好看|美观/.test(text) && basePpt) {
      const premiumStyle = '高端深色系，大量留白，精致排版，大图配小文字，使用金/银/紫等高级色调，配合微动效，参考Apple/科技发布会风格';
      const newSlides = basePpt.slides.map(s => ({
        ...s,
        designSuggestion: '【高级风格】' + premiumStyle + '；' + s.designSuggestion,
      }));
      newPptData = { ...basePpt, style: premiumStyle, slides: newSlides };
      newContent = buildPptReadableText(newPptData);
      newStructured = { type: 'ppt', data: newPptData };
      newContent = `## ✅ 已升级为高级风格\n\n根据你的要求，已将设计风格升级为：${premiumStyle}\n\n` + newContent;
    } else if (/压缩|缩短|\d+\s*分钟/.test(text) && basePpt) {
      const m = text.match(/(\d+)\s*分钟/);
      const targetMin = m ? parseInt(m[1]) : 5;
      const targetPages = Math.max(5, Math.round(targetMin / 1.2));
      const topic = basePpt.title, course = basePpt.course;
      const newSlides = generatePptSlides(topic, course, targetPages, basePpt.style, basePpt.fromFile, /案例/.test(text), false, { duration: targetMin + '分钟' });
      newPptData = { ...basePpt, pageCount: targetPages, duration: targetMin + '分钟', slides: newSlides, presentationTips: generatePresentationTips(targetPages, targetMin + '分钟', newSlides) };
      newContent = buildPptReadableText(newPptData);
      newStructured = { type: 'ppt', data: newPptData };
      newContent = `## ✅ 已压缩为 ${targetMin} 分钟版本（${targetPages}页）\n\n根据你的要求，已精简内容为${targetPages}页。\n\n` + newContent;
    } else if (/正式|规范|书面|学术/.test(text) && basePpt) {
      const formalStyle = '学术蓝白配色，严谨简洁，突出数据和结论，大量使用图表，文字精炼规范';
      const newSlides = basePpt.slides.map(s => ({
        ...s,
        designSuggestion: '【正式学术风】' + formalStyle + '；' + s.designSuggestion,
      }));
      newPptData = { ...basePpt, style: formalStyle, slides: newSlides };
      newContent = buildPptReadableText(newPptData);
      newStructured = { type: 'ppt', data: newPptData };
      newContent = `## ✅ 已调整为正式学术风\n\n根据你的要求，已将视觉风格调整为正式学术风格。\n\n` + newContent;
    } else if (/参考资料|参考文献|文献/.test(text) && basePpt) {
      const refSlide = {
        pageNumber: basePpt.pageCount + 1, totalPages: basePpt.pageCount + 1, pageLabel: '参考资料',
        type: 'content', title: '参考资料推荐',
        bullets: ['核心教材与课堂笔记', '近3年相关领域的学术论文', '权威机构发布的报告/白皮书', '行业典型案例资料', '课程推荐阅读材料'],
        imageSuggestion: '书籍/文献图标组合，简洁学术风',
        designSuggestion: '左对齐列表式排版，文献类型分类呈现',
        speakerNotes: '以上是推荐的参考资料方向，建议大家结合课程教材和老师推荐的文献进行深入学习。',
        estimatedTime: '约20秒', isCover: false, isEnd: false,
      };
      const newSlides = [...basePpt.slides];
      newSlides.splice(newSlides.length - 1, 0, refSlide);
      newSlides.forEach((s, i) => { s.pageNumber = i + 1; s.totalPages = newSlides.length; });
      newPptData = { ...basePpt, pageCount: newSlides.length, slides: newSlides };
      newContent = buildPptReadableText(newPptData);
      newStructured = { type: 'ppt', data: newPptData };
      newContent = `## ✅ 已增加参考资料页\n\n根据你的要求，已在Q&A页前增加参考资料推荐页。\n\n` + newContent;
    } else if (/讲得更简单|简单点|通俗|易懂/.test(text)) {
      newContent = `## ✅ 已用更简单的方式讲解\n\n好的，我用更通俗的方式重新讲解。\n\n---\n\n` + currentVersion.resultContent;
    } else {
      newContent = `## ✅ 已根据你的要求优化："${escHtml(text)}"\n\n已根据你的反馈进行了整体优化。\n\n---\n\n` + currentVersion.resultContent;
    }

    return {
      success: true,
      content: newContent,
      pptData: newPptData,
      structuredResult: newStructured,
      modelName: MODEL_NAME,
      createdAt: new Date(),
    };
  }

  /* ─── Render Result ─────────────────────────────────────── */
  function renderResult(req, res) {
    const typeInfo = TASK_MAP[req.taskType];
    const allFiles = [...req.imageNames.map(n => ({ name: n, icon: getFileIcon(n) })),
                      ...req.fileNames.map(n => ({ name: n, icon: getFileIcon(n) }))];

    $('result-info').innerHTML = `
      <div class="result-info-header">
        <span class="result-type-badge">${typeInfo.icon} ${typeInfo.name}</span>
        <span class="result-time">${formatFull(res.createdAt)}</span>
      </div>
      ${req.text ? `<div class="result-input-text">${escHtml(req.text)}</div>` : ''}
      ${allFiles.length ? `<div class="result-files">${allFiles.map(f => `<span class="result-file-chip">${f.icon} ${escHtml(f.name)}</span>`).join('')}</div>` : ''}
    `;

    const pptSection = $('ppt-preview-section');
    const expSection = $('experiment-section');
    const thesisSection = $('thesis-section');
    const solveSection = $('solve-section');
    const summarySection = $('summary-section');
    const contentCard = $('result-content');

    pptSection.classList.add('hidden');
    expSection.classList.add('hidden');
    thesisSection.classList.add('hidden');
    solveSection.classList.add('hidden');
    summarySection.classList.add('hidden');
    contentCard.classList.add('hidden');

    const sr = res.structuredResult;
    if (res.pptData && req.taskType === 'ppt') {
      pptSection.classList.remove('hidden');
      renderPptSlides(res.pptData);
      renderPptMeta(res.pptData);
    } else if (sr && sr.type === 'experiment') {
      expSection.classList.remove('hidden');
      renderExperimentModules(sr.modules);
    } else if (sr && sr.type === 'thesis') {
      thesisSection.classList.remove('hidden');
      renderThesisChapters(sr.chapters);
    } else if (sr && sr.type === 'solve') {
      solveSection.classList.remove('hidden');
      renderSolveSteps(sr.steps);
    } else if (sr && sr.type === 'summary') {
      summarySection.classList.remove('hidden');
      renderSummaryCards(sr.cards);
    } else if (sr && sr.type === 'steps') {
      contentCard.classList.remove('hidden');
      contentCard.innerHTML = renderMarkdown(res.content);
    } else {
      contentCard.classList.remove('hidden');
      contentCard.innerHTML = renderMarkdown(res.content);
    }

    updateSaveButton();
  }

  function renderExperimentModules(modules) {
    const container = $('experiment-modules');
    container.innerHTML = modules.map(m => {
      let bodyHtml = '';
      if (m.content) bodyHtml = `<div class="module-content">${renderMarkdown(m.content)}</div>`;
      if (m.items) {
        if (m.isTable) {
          bodyHtml = `<div class="module-table"><div class="module-table-header"><span>误差类型</span><span>来源</span><span>减小方法</span></div>${m.items.map(i => `<div class="module-table-row"><span><strong>${escHtml(i.label)}</strong></span><span>${escHtml(i.desc.split('→')[0].trim())}</span><span>${escHtml(i.desc.split('→')[1] ? i.desc.split('→')[1].trim() : '')}</span></div>`).join('')}</div>`;
        } else {
          bodyHtml = `<ul class="module-list">${m.items.map(i => `<li>${escHtml(i)}</li>`).join('')}</ul>`;
        }
      }
      return `<div class="module-card glass"><div class="module-header"><span class="module-icon">${m.icon}</span><span class="module-title">${m.title}</span></div>${bodyHtml}</div>`;
    }).join('');
  }

  function renderThesisChapters(chapters) {
    const container = $('thesis-chapters');
    container.innerHTML = chapters.map((c, i) => {
      let bodyHtml = '';
      if (c.content) bodyHtml = `<div class="chapter-content">${escHtml(c.content)}</div>`;
      if (c.items) bodyHtml = `<ul class="chapter-list">${c.items.map(item => { const isSub = /^\d+\.\d+/.test(item); return `<li class="${isSub ? 'chapter-sub-item' : ''}">${escHtml(item)}</li>`; }).join('')}</ul>`;
      return `<div class="chapter-card glass"><div class="chapter-header"><span class="chapter-num">${String(i + 1).padStart(2, '0')}</span><span class="chapter-icon">${c.icon}</span><span class="chapter-title">${c.title}</span></div>${bodyHtml}</div>`;
    }).join('');
  }

  function renderSolveSteps(steps) {
    const container = $('solve-steps');
    container.innerHTML = steps.map((s) => {
      let bodyHtml = '';
      if (s.content) bodyHtml = `<div class="step-content-text">${renderMarkdown(s.content)}</div>`;
      if (s.items) {
        if (s.isSteps) {
          bodyHtml = `<div class="step-flow">${s.items.map((item, j) => `<div class="step-flow-item"><div class="step-flow-num">${j + 1}</div><div class="step-flow-text"><strong>${escHtml(item.step)}</strong>：${escHtml(item.desc)}</div></div>`).join('')}</div>`;
        } else {
          bodyHtml = `<ul class="step-list">${s.items.map(item => `<li>${escHtml(item)}</li>`).join('')}</ul>`;
        }
      }
      return `<div class="step-card glass"><div class="step-header"><span class="step-icon">${s.icon}</span><span class="step-title">${s.title}</span></div>${bodyHtml}</div>`;
    }).join('');
  }

  function renderSummaryCards(cards) {
    const container = $('summary-cards');
    container.innerHTML = `<div class="knowledge-grid">${cards.map(c => {
      let bodyHtml = '';
      if (c.content) bodyHtml = `<div class="knowledge-content"><pre>${escHtml(c.content)}</pre></div>`;
      if (c.items) bodyHtml = `<ul class="knowledge-list">${c.items.map(i => `<li>${escHtml(i)}</li>`).join('')}</ul>`;
      return `<div class="knowledge-card glass"><div class="knowledge-header"><span class="knowledge-icon">${c.icon}</span><span class="knowledge-title">${c.title}</span></div>${bodyHtml}</div>`;
    }).join('')}</div>`;
  }

  /* ─── PPT Rendering ─────────────────────────────────────── */
  function renderPptSlides(ppt) {
    const container = $('ppt-slides-container');
    container.innerHTML = ppt.slides.map((s, idx) => renderSlideCard(s, changedSlideIndices.has(idx), addedSlideIndices.has(idx))).join('');
  }

  function renderSlideCard(s, isChanged, isAdded) {
    const isPureEnd = s.isEnd && s.pageLabel === 'Q&A';
    const isSummaryEnd = s.isEnd && s.pageLabel === '总结与Q&A';
    const cardClass = s.isCover ? 'ppt-slide-card cover-slide' : isPureEnd ? 'ppt-slide-card end-slide' : 'ppt-slide-card';
    const titleClass = s.isCover ? 'ppt-slide-title cover-title' : 'ppt-slide-title';
    let changeBadge = '';
    if (isAdded) {
      changeBadge = '<span class="slide-change-badge added">新增</span>';
    } else if (isChanged) {
      changeBadge = '<span class="slide-change-badge changed">已修改</span>';
    }

    let bulletsHtml = '';
    if (s.tocList && s.tocList.length > 0) {
      bulletsHtml = '<ul class="ppt-slide-bullets">' +
        s.tocList.map(item => {
          const parts = item.split(/\s{2,}/);
          return `<li><strong>${escHtml(parts[0])}</strong>${parts.length > 1 ? '　' + escHtml(parts.slice(1).join(' ')) : ''}</li>`;
        }).join('') + '</ul>';
    } else if (s.bullets && s.bullets.length > 0) {
      const validBullets = s.bullets.filter(b => b && b.trim());
      if (validBullets.length > 0) {
        bulletsHtml = '<ul class="ppt-slide-bullets">' +
          validBullets.map(b => `<li>${escHtml(b)}</li>`).join('') + '</ul>';
      }
    }

    let subtitleHtml = '';
    if (s.isCover) subtitleHtml = `<div class="ppt-slide-subtitle">点击下方"下载 HTML 版"或"打印/导出 PDF"按钮可获取文件</div>`;
    if (isPureEnd) subtitleHtml = `<div class="ppt-slide-subtitle">Thanks for Your Attention</div>`;

    return `
      <div class="${cardClass}">
        ${changeBadge}
        <div class="ppt-slide-number">${s.pageNumber} / ${s.totalPages || (currentPptData ? currentPptData.pageCount : '?')}</div>
        <div class="ppt-slide-page-label">${escHtml(s.pageLabel)}</div>
        <div class="${titleClass}">${escHtml(s.title)}</div>
        ${subtitleHtml}
        ${bulletsHtml}
        <div class="ppt-slide-meta">
          <div class="ppt-meta-item">
            <span class="ppt-meta-icon">🖼️</span>
            <span><span class="ppt-meta-label">配图建议：</span><span class="ppt-meta-text">${escHtml(s.imageSuggestion)}</span></span>
          </div>
          <div class="ppt-meta-item">
            <span class="ppt-meta-icon">🎨</span>
            <span><span class="ppt-meta-label">设计建议：</span><span class="ppt-meta-text">${escHtml(s.designSuggestion)}</span></span>
          </div>
          <div class="ppt-meta-item">
            <span class="ppt-meta-icon">⏱️</span>
            <span><span class="ppt-meta-label">预计时长：</span><span class="ppt-meta-text">${escHtml(s.estimatedTime)}</span></span>
          </div>
        </div>
        ${s.speakerNotes ? `
        <div class="ppt-slide-notes">
          <div class="ppt-notes-title">🎤 演讲稿 / 备注</div>
          <div class="ppt-notes-content">${escHtml(s.speakerNotes)}</div>
        </div>` : ''}
      </div>`;
  }

  /* ─── PPT Meta Card ─────────────────────────────────────── */
  function renderPptMeta(ppt) {
    const metaCard = $('ppt-meta-card');
    metaCard.classList.remove('hidden');
    metaCard.innerHTML = `
      <div class="ppt-meta-grid">
        <div class="ppt-meta-stat">
          <span class="ppt-meta-stat-label">PPT 标题</span>
          <span class="ppt-meta-stat-value">${escHtml(ppt.title)}</span>
        </div>
        <div class="ppt-meta-stat">
          <span class="ppt-meta-stat-label">课程场景</span>
          <span class="ppt-meta-stat-value">${escHtml(ppt.course)}</span>
        </div>
        <div class="ppt-meta-stat">
          <span class="ppt-meta-stat-label">页数</span>
          <span class="ppt-meta-stat-value">${ppt.pageCount} 页</span>
        </div>
        <div class="ppt-meta-stat">
          <span class="ppt-meta-stat-label">预计展示时长</span>
          <span class="ppt-meta-stat-value">${escHtml(ppt.duration)}</span>
        </div>
        <div class="ppt-meta-stat" style="grid-column: 1 / -1;">
          <span class="ppt-meta-stat-label">整体视觉风格</span>
          <span class="ppt-meta-stat-value" style="font-size:13px;font-weight:500;">${escHtml(ppt.style)}</span>
        </div>
      </div>
      <div class="ppt-tips-section">
        <div class="ppt-tips-title">💡 展示建议</div>
        <ul class="ppt-tips-list">
          ${ppt.presentationTips.map(tip => `<li>${escHtml(tip)}</li>`).join('')}
        </ul>
      </div>
      <div>
        <div class="ppt-questions-title">❓ 答辩时可能被问到的问题</div>
        <ul class="ppt-questions-list">
          ${ppt.possibleQuestions.map(q => `<li>${escHtml(q)}</li>`).join('')}
        </ul>
      </div>`;
  }

  /* ─── Follow-up Panel ──────────────────────────────────── */
  function showFollowUpPanel() {
    const panel = $('followup-panel');
    panel.classList.remove('hidden');
    const hint = $('followup-hint');
    if (followupHintText) {
      hint.textContent = followupHintText;
      hint.classList.add('hint-highlight');
    } else {
      hint.textContent = '你可以继续提出修改要求，逐步打磨这份作业';
      hint.classList.remove('hint-highlight');
    }
    renderFollowUpQuickActions();
  }

  function renderFollowUpQuickActions() {
    const container = $('followup-quick-actions');
    if (!container) return;
    const taskType = currentRequest ? currentRequest.taskType : 'ppt';
    let buttons = [];
    if (taskType === 'ppt') {
      buttons = ['改成10页', '增加真实案例', '每页补充演讲稿', '压缩到3分钟', '调整为正式学术风', '增加参考资料页'];
    } else {
      const template = PromptTemplateService.getTemplate(taskType);
      buttons = template.followUpSuggestions || [];
    }
    container.innerHTML = buttons.map(btn =>
      `<button class="followup-quick-btn" data-text="${escHtml(btn)}">${escHtml(btn)}</button>`
    ).join('');
    container.querySelectorAll('.followup-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        window._demoQuickAction = btn.dataset.text;
        handleFollowUp();
      });
    });
  }

  /* ─── PPT Export Functions ──────────────────────────────── */
  function copyPptText() {
    if (!currentPptData) { showToast('没有PPT数据可复制', 'error'); return; }
    const text = buildPptReadableText(currentPptData);
    navigator.clipboard.writeText(text).then(() => {
      showToast('PPT完整文案已复制到剪贴板', 'success');
    }).catch(() => {
      showToast('复制失败，请手动复制', 'error');
    });
  }

  function copySpeakerNotes() {
    if (!currentPptData) { showToast('没有PPT数据可复制', 'error'); return; }
    let notes = `【${currentPptData.title} - 演讲稿】\n\n`;
    currentPptData.slides.forEach(s => {
      notes += `第${s.pageNumber}页：${s.title}\n`;
      notes += (s.speakerNotes || '无备注') + '\n\n';
    });
    navigator.clipboard.writeText(notes).then(() => {
      showToast('演讲稿已复制到剪贴板', 'success');
    }).catch(() => {
      showToast('复制失败，请手动复制', 'error');
    });
  }

  function buildPptHtml(ppt) {
    const slideHtml = ppt.slides.map(s => {
      const bullets = s.tocList && s.tocList.length > 0
        ? s.tocList.map(item => `<li>${escHtml(item)}</li>`).join('')
        : (s.bullets || []).filter(b => b && b.trim()).map(b => `<li>${escHtml(b)}</li>`).join('');
      return `
      <div class="slide ${s.isCover ? 'cover' : ''} ${s.isEnd ? 'end' : ''}">
        <div class="slide-num">${s.pageNumber} / ${ppt.pageCount}</div>
        <div class="slide-label">${escHtml(s.pageLabel)}</div>
        <h1 class="slide-title">${escHtml(s.title)}</h1>
        ${bullets ? `<ul class="slide-bullets">${bullets}</ul>` : ''}
        ${s.speakerNotes ? `<div class="slide-notes-print"><strong>演讲稿：</strong>${escHtml(s.speakerNotes)}</div>` : ''}
      </div>`;
    }).join('');

    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escHtml(ppt.title)} - PPT</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif; background: #f0f2f5; padding: 20px; }
    .slide {
      width: 960px; height: 540px; margin: 0 auto 30px; padding: 50px 70px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white; border-radius: 12px; position: relative; page-break-after: always;
      box-shadow: 0 10px 40px rgba(0,0,0,0.2);
    }
    .slide.cover { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
    .slide.end { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; }
    .slide-num { position: absolute; top: 20px; right: 30px; font-size: 14px; opacity: 0.8; }
    .slide-label { position: absolute; top: 20px; left: 30px; font-size: 14px; opacity: 0.8; }
    .slide-title { font-size: 36px; margin-bottom: 30px; line-height: 1.3; }
    .slide.cover .slide-title { font-size: 48px; margin-bottom: 20px; }
    .slide-bullets { list-style: none; padding: 0; }
    .slide-bullets li { font-size: 20px; margin-bottom: 15px; padding-left: 25px; position: relative; line-height: 1.6; }
    .slide-bullets li::before { content: '•'; position: absolute; left: 0; color: rgba(255,255,255,0.8); font-size: 24px; }
    .slide-notes-print { margin-top: 20px; padding: 15px; background: rgba(255,255,255,0.15); border-radius: 8px; font-size: 14px; line-height: 1.6; }
    @media print {
      body { padding: 0; background: white; }
      .slide { margin: 0; border-radius: 0; box-shadow: none; page-break-after: always; }
    }
  </style>
</head>
<body>
  ${slideHtml}
</body>
</html>`;
  }

  function downloadPptHtml() {
    if (!currentPptData) { showToast('没有PPT数据可下载', 'error'); return; }
    const html = buildPptHtml(currentPptData);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPptData.title || 'PPT'}_演示版.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('HTML文件已开始下载', 'success');
  }

  function printPpt() {
    if (!currentPptData) { showToast('没有PPT可打印', 'error'); return; }
    const printWindow = window.open('', '_blank');
    if (!printWindow) { showToast('请允许弹出窗口以打印', 'error'); return; }
    printWindow.document.write(buildPptHtml(currentPptData));
    printWindow.document.close();
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
      }, 300);
    };
  }

  /* ─── Result Copy & Save ────────────────────────────────── */
  function copyResult() {
    if (!currentResponse) { showToast('没有内容可复制', 'error'); return; }
    navigator.clipboard.writeText(currentResponse.content).then(() => {
      showToast('内容已复制到剪贴板', 'success');
    }).catch(() => {
      showToast('复制失败，请手动复制', 'error');
    });
  }

  function updateSaveButton() {
    const btn = $('btn-save');
    if (!btn) return;
    if (isSaved) {
      btn.textContent = '✓ 已保存';
      btn.disabled = true;
    } else {
      btn.textContent = '💾 保存到历史';
      btn.disabled = false;
    }
  }

  function saveToHistory() {
    if (!currentResponse || !currentRequest) { showToast('没有内容可保存', 'error'); return; }
    const history = loadHistory();
    const existingIdx = history.findIndex(h => h.id === currentRequest.id);
    const record = {
      id: currentRequest.id,
      taskType: currentRequest.taskType,
      taskTypeName: TASK_MAP[currentRequest.taskType]?.name || '作业',
      userRequest: currentRequest.text,
      fileNames: [...currentRequest.imageNames, ...currentRequest.fileNames],
      versions: currentVersions.map(v => ({
        versionId: v.versionId,
        versionNumber: v.versionNumber,
        followUpText: v.followUpText,
        resultContent: v.resultContent,
        pptData: v.pptData,
        structuredResult: v.structuredResult,
        createdAt: v.createdAt,
      })),
      currentVersionIndex: currentVersionIndex,
      createdAt: currentRequest.createdAt || new Date(),
      updatedAt: new Date(),
    };
    if (existingIdx >= 0) {
      history[existingIdx] = record;
    } else {
      history.unshift(record);
    }
    saveHistory(history);
    isSaved = true;
    updateSaveButton();
    showToast('已保存到历史记录', 'success');
  }

  function regenerate() {
    if (!currentRequest) return;
    isSaved = false;
    updateSaveButton();
    processTask();
  }

  function clearAll() {
    $('input-text').value = '';
    uploadedImages = [];
    uploadedFiles = [];
    renderFileList();
    currentResponse = null;
    currentRequest = null;
    currentVersions = [];
    currentVersionIndex = 0;
    currentStructuredResult = null;
    currentPptData = null;
    currentPromptMatch = null;
    currentTimeline = [];
    isSaved = false;
    followupHintText = '';
    changedSlideIndices = new Set();
    addedSlideIndices = new Set();
    resetTimeline();
    showView('home');
    setWorkflowStep(0);
  }

  /* ─── History Functions ─────────────────────────────────── */
  function loadHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  function saveHistory(history) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      showToast('保存历史失败：存储空间不足', 'error');
    }
  }

  function renderHistory() {
    const history = loadHistory();
    const container = $('history-list');
    const emptyEl = $('history-empty');
    if (history.length === 0) {
      container.innerHTML = '';
      emptyEl.classList.remove('hidden');
      return;
    }
    emptyEl.classList.add('hidden');
    container.innerHTML = history.map(h => {
      const typeInfo = TASK_MAP[h.taskType] || { icon: '📄', name: '作业' };
      const latestVersion = h.versions[h.versions.length - 1];
      return `<div class="history-item glass" data-id="${h.id}">
        <div class="history-item-header">
          <span class="history-type-badge">${typeInfo.icon} ${typeInfo.name}</span>
          <span class="history-time">${formatCnDate(new Date(h.createdAt))}</span>
        </div>
        <div class="history-request">${escHtml(truncate(h.userRequest || '(无输入内容)', 80))}</div>
        <div class="history-meta">
          <span class="history-version-count">📌 共 ${h.versions.length} 个版本</span>
          ${h.fileNames && h.fileNames.length > 0 ? `<span class="history-files">📎 ${h.fileNames.length} 个附件</span>` : ''}
        </div>
      </div>`;
    }).join('');
    container.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', () => renderHistoryDetail(el.dataset.id));
    });
  }

  function renderHistoryDetail(id) {
    const history = loadHistory();
    const record = history.find(h => h.id === id);
    if (!record) { showToast('记录不存在', 'error'); return; }
    currentDetailId = id;
    currentRequest = {
      id: record.id,
      taskType: record.taskType,
      text: record.userRequest,
      imageNames: [],
      fileNames: record.fileNames || [],
      createdAt: new Date(record.createdAt),
    };
    currentVersions = record.versions.map(v => ({
      ...v,
      createdAt: new Date(v.createdAt),
    }));
    currentVersionIndex = record.currentVersionIndex || 0;
    const v = getCurrentVersion();
    currentResponse = {
      success: true,
      content: v.resultContent,
      pptData: v.pptData,
      structuredResult: v.structuredResult,
      modelName: MODEL_NAME,
      createdAt: new Date(v.createdAt),
    };
    currentPptData = v.pptData;
    currentStructuredResult = v.structuredResult;
    isSaved = true;
    changedSlideIndices = new Set();
    addedSlideIndices = new Set();
    renderResult(currentRequest, currentResponse);
    renderVersionBar();
    renderTaskStats();
    showView('detail');
    setWorkflowStep(5);
  }

  function clearAllHistory() {
    if (!confirm('确定要清空所有历史记录吗？此操作不可恢复。')) return;
    saveHistory([]);
    renderHistory();
    showToast('历史记录已清空', 'success');
  }

  function deleteCurrentDetail() {
    if (!currentDetailId) return;
    if (!confirm('确定要删除这条历史记录吗？')) return;
    const history = loadHistory();
    const filtered = history.filter(h => h.id !== currentDetailId);
    saveHistory(filtered);
    currentDetailId = null;
    renderHistory();
    showView('history');
    showToast('记录已删除', 'success');
  }

  /* ─── API Settings ──────────────────────────────────────── */
  function loadApiSettings() {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : {
        mode: 'mock',
        provider: 'mock',
        baseUrl: '',
        apiKey: '',
        model: '',
        rememberKey: false,
      };
    } catch (e) {
      return { mode: 'mock', provider: 'mock', baseUrl: '', apiKey: '', model: '', rememberKey: false };
    }
  }

  function saveSettingsToStorage() {
    try {
      const toSave = { ...apiSettings };
      if (!toSave.rememberKey) toSave.apiKey = '';
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(toSave));
    } catch (e) {
      showToast('保存设置失败', 'error');
    }
  }

  function openSettings() {
    const modal = $('settings-modal');
    modal.classList.remove('hidden');
    const mode = apiSettings.mode || 'mock';
    document.querySelectorAll('input[name="api-mode"]').forEach(r => {
      r.checked = r.value === mode;
    });
    const provider = apiSettings.provider || (mode === 'local' ? 'local' : (mode === 'mock' ? 'mock' : 'openai-compatible'));
    $('setting-provider').value = provider;
    $('setting-base-url').value = apiSettings.baseUrl || (API_PROVIDER_PRESETS[provider]?.baseUrl || '');
    $('setting-api-key').value = apiSettings.apiKey || '';
    $('setting-model').value = apiSettings.model || (API_PROVIDER_PRESETS[provider]?.defaultModel || '');
    $('setting-remember-key').checked = apiSettings.rememberKey || false;
    applyRealApiVisibility();
  }

  function closeSettings() {
    $('settings-modal').classList.add('hidden');
  }

  function saveSettings() {
    const mode = document.querySelector('input[name="api-mode"]:checked')?.value || 'mock';
    let provider = $('setting-provider').value;
    if (mode === 'mock') provider = 'mock';
    if (mode === 'local') provider = 'local';
    const baseUrl = $('setting-base-url').value.trim();
    const apiKey = $('setting-api-key').value.trim();
    const model = $('setting-model').value.trim();
    const rememberKey = $('setting-remember-key').checked;
    apiSettings = { mode, provider, baseUrl, apiKey, model, rememberKey };
    saveSettingsToStorage();
    if (mode === 'local' && IS_LOCAL_SERVER) {
      localBackendStatus = 'checking';
      updateApiStatusBar();
      checkLocalBackendHealth().then(() => updateApiStatusBar());
    }
    updateApiStatusBar();
    closeSettings();
    showToast('设置已保存', 'success');
  }

  function applyRealApiVisibility() {
    const mode = document.querySelector('input[name="api-mode"]:checked')?.value || 'mock';
    const realSection = $('settings-real-api');
    if (realSection) {
      realSection.style.display = (mode === 'real' || mode === 'local') ? 'block' : 'none';
    }
    const localHint = $('local-backend-hint');
    if (localHint) {
      localHint.style.display = mode === 'local' ? 'block' : 'none';
    }
    if (mode === 'local' && !IS_LOCAL_SERVER) {
      showToast('Local Backend 模式需要通过本地服务访问。请双击「一键真实模型.bat」启动服务。', 'error');
    }
  }

  async function checkLocalBackendHealth() {
    if (!IS_LOCAL_SERVER) {
      localBackendStatus = 'unavailable';
      return false;
    }
    try {
      const resp = await fetch('/api/health', { method: 'GET', signal: AbortSignal.timeout(3000) });
      if (resp.ok) {
        localBackendStatus = 'connected';
        return true;
      }
      localBackendStatus = 'error';
      return false;
    } catch (e) {
      localBackendStatus = 'error';
      return false;
    }
  }

  function updateApiStatusBar() {
    const statusEl = $('api-status-bar');
    if (!statusEl) return;

    const mode = apiSettings.mode || 'mock';
    const modeEl = $('api-status-mode');
    const modelEl = $('api-status-model');
    const dotEl = $('api-status-dot');
    const textEl = $('api-status-text');
    const portEl = $('api-status-port');
    const envEl = $('api-status-env');

    if (mode === 'mock') {
      if (modeEl) modeEl.textContent = IS_LOCAL_SERVER ? 'Mock（本地服务托管）' : '离线演示';
      if (modelEl) modelEl.textContent = '本地模拟引擎';
      if (dotEl) { dotEl.className = 'api-status-dot status-mock'; }
      if (textEl) textEl.textContent = IS_LOCAL_SERVER ? 'Mock 引擎就绪' : '离线稳定';
      if (portEl) portEl.textContent = IS_LOCAL_SERVER ? ':' + SERVER_PORT : 'file://';
      if (envEl) envEl.textContent = IS_LOCAL_SERVER ? '本地服务模式：当前使用 Mock 引擎，可在 API 设置中切换到 Local Backend。' : '离线演示模式：当前使用本地 Mock 引擎。';
      statusEl.className = 'api-status-bar status-mock';
    } else if (mode === 'local') {
      if (modeEl) modeEl.textContent = 'Local Backend';
      if (modelEl) modelEl.textContent = apiSettings.model || '本地代理';
      if (portEl) portEl.textContent = ':' + (SERVER_PORT || '8765');
      if (localBackendStatus === 'connected') {
        if (dotEl) { dotEl.className = 'api-status-dot status-local-ok'; }
        if (textEl) textEl.textContent = '连接成功';
        statusEl.className = 'api-status-bar status-local-ok';
      } else if (localBackendStatus === 'checking') {
        if (dotEl) { dotEl.className = 'api-status-dot status-checking'; }
        if (textEl) textEl.textContent = '检测中...';
        statusEl.className = 'api-status-bar status-checking';
      } else {
        if (dotEl) { dotEl.className = 'api-status-dot status-local-err'; }
        if (textEl) textEl.textContent = IS_LOCAL_SERVER ? '后端未启动' : '需本地服务';
        statusEl.className = 'api-status-bar status-local-err';
      }
      if (envEl) envEl.textContent = '本地服务模式：真实模型请求由本地后端代理。API Key 保存在后端，不暴露给浏览器。';
    } else {
      if (modeEl) modeEl.textContent = 'Real API';
      const provider = apiSettings.provider || 'custom';
      const preset = API_PROVIDER_PRESETS[provider];
      if (modelEl) modelEl.textContent = (preset ? preset.name : provider) + (apiSettings.model ? ' · ' + apiSettings.model : '');
      if (dotEl) { dotEl.className = 'api-status-dot status-real'; }
      if (textEl) textEl.textContent = '直接请求（跨域）';
      if (portEl) portEl.textContent = IS_LOCAL_SERVER ? ':' + SERVER_PORT : '直连';
      if (envEl) envEl.textContent = '直连模式：浏览器直接请求模型 API，可能遇到跨域限制。';
      statusEl.className = 'api-status-bar status-real';
    }
  }

  async function callLocalBackendAgent(requestData, onStream) {
    try {
      const resp = await fetch('/api/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      });
      const data = await resp.json();
      if (!resp.ok) {
        return { error: data.error || '请求失败（HTTP ' + resp.status + '）' };
      }
      return data;
    } catch (e) {
      return { error: '本地后端请求失败: ' + e.message + '。请确认后端已启动，或切换到 Mock 模式。' };
    }
  }

  async function testConnection() {
    if (apiSettings.mode === 'mock') {
      showToast('✅ Mock模式连接正常！使用内置模拟数据', 'success');
      updateApiStatusBar();
      return;
    }
    if (apiSettings.mode === 'local') {
      localBackendStatus = 'checking';
      updateApiStatusBar();
      const ok = await checkLocalBackendHealth();
      updateApiStatusBar();
      if (ok) {
        showToast('✅ 本地后端连接成功！', 'success');
      } else {
        showToast('❌ 无法连接本地后端。请双击「一键真实模型.bat」启动服务。', 'error');
      }
      return;
    }
    showToast('⚠️ 直连 Real API 模式需要配置CORS或后端代理，建议使用 Local Backend 模式。', 'info');
  }

  /* ─── One-Click Demo ────────────────────────────────────── */
  async function runOneClickDemo() {
    showToast('🚀 正在启动一键演示...', 'info');
    window_isDemoRun = true;
    demoWaitingForFollowup = false;
    showView('home');
    await sleep(300);
    currentTaskType = 'ppt';
    renderTaskTypes();
    updateInputPlaceholder();
    updateButtonText();
    await sleep(200);
    const demoText = '请生成一份关于人工智能在大学生学习中应用的8页课堂展示PPT，展示时间5分钟，需要案例、趋势和总结。';
    $('input-text').value = demoText;
    uploadedFiles = [{ name: '人工智能课程作业要求.pdf', size: 102400, type: 'application/pdf' }];
    uploadedImages = [];
    renderFileList();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    await sleep(500);
    await processTask();
    await sleep(300);
    const pptSection = $('ppt-preview-section');
    if (pptSection) {
      pptSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    followupHintText = '💡 试试点击快捷按钮"每页补充演讲稿"，或输入"改成10页并补充演讲稿"体验持续跟进修改！';
    renderFollowUpQuickActions();
    showFollowUpPanel();
    showToast('✨ PPT初稿已生成！试试快捷修改按钮体验完整流程', 'success');
  }

  function hideDemoBannerIfSeen() {
    try {
      const seen = localStorage.getItem('study_agent_demo_banner_seen');
      const banner = $('demo-banner');
      if (banner && seen === 'true') {
        banner.style.display = 'none';
      }
      if (banner) {
        const closeBtn = banner.querySelector('.demo-banner-close');
        if (closeBtn) {
          closeBtn.addEventListener('click', () => {
            banner.style.display = 'none';
            localStorage.setItem('study_agent_demo_banner_seen', 'true');
          });
        }
      }
    } catch (e) {}
  }

  /* ─── Utility Functions ─────────────────────────────────── */
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function genId() {
    return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
  }

  function escHtml(s) {
    if (s === null || s === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(s);
    return div.innerHTML;
  }

  function truncate(s, n) {
    if (!s) return '';
    const str = String(s);
    return str.length > n ? str.substring(0, n) + '...' : str;
  }

  function pad2(n) {
    return String(n).padStart(2, '0');
  }

  function formatCnDate(d) {
    const date = new Date(d);
    return `${date.getFullYear()}年${pad2(date.getMonth() + 1)}月${pad2(date.getDate())}日 ${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
  }

  function formatFull(d) {
    const date = new Date(d);
    return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())} ${pad2(date.getHours())}:${pad2(date.getMinutes())}:${pad2(date.getSeconds())}`;
  }

  function detectSubject(text) {
    if (!text) return '综合';
    if (/数学|函数|方程|几何|代数|微积分|导数|积分|极限|概率|矩阵/.test(text)) return '数学';
    if (/物理|力学|电磁|光学|热力学|量子|牛顿|加速度|电压|电流/.test(text)) return '物理';
    if (/化学|元素|分子|原子|反应|化合物|有机|无机|溶液|氧化/.test(text)) return '化学';
    if (/编程|代码|程序|Python|Java|C\+\+|JavaScript|算法|函数|变量/.test(text)) return '编程';
    return '综合';
  }

  function detectWriteType(text) {
    if (!text) return '通用';
    if (/议论|观点|看法|论证/.test(text)) return '议论文';
    if (/说明|介绍|解释|原理/.test(text)) return '说明文';
    if (/记叙|经历|故事|回忆/.test(text)) return '记叙文';
    if (/应用|书信|通知|报告|申请/.test(text)) return '应用文';
    if (/论文|文献|研究|学术/.test(text)) return '学术论文';
    return '通用写作';
  }

  function detectLang(text) {
    if (!text) return 'zh';
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length;
    return chineseChars >= englishChars ? 'zh' : 'en';
  }

  function renderMarkdown(text) {
    if (!text) return '';
    let html = escHtml(text);
    html = html.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
    html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
    html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
    html = html.replace(/^\- (.+)$/gm, '<li>$1</li>');
    html = html.replace(/^\* (.+)$/gm, '<li>$1</li>');
    html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    html = html.split('\n').map(line => {
      if (line.trim() === '') return '<br>';
      if (/^<(h[1-6]|ul|li|pre|blockquote|code|strong|br)/.test(line.trim())) return line;
      return `<p>${line}</p>`;
    }).join('\n');
    html = html.replace(/<\/ul>\s*<ul>/g, '');
    return html;
  }

  function showToast(msg, type) {
    const container = $('toast-container');
    if (!container) {
      alert(msg);
      return;
    }
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + (type || 'info');
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-show');
    }, 10);
    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  /* ─── DOM Ready ─────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);

})();