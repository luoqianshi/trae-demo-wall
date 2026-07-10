const MENTOR_CONFIG = [
  {
    mentorId: 'master',
    name: '🧙 传功长老',
    coreTags: ['网文', '大纲', '金手指', '爽点', '毒点', '节奏', '开篇', '人设', '签约', '编辑', '方法论'],
    keywords: ['怎么写', '如何', '技巧', '方法', '教学', '入门', '零基础', '新手', '指南', '技巧', '经验'],
    description: '20年网文金牌编辑，授业解惑，教方法给框架',
    priority: 2
  },
  {
    mentorId: 'deepseek',
    name: '🧠 推理导师',
    coreTags: ['逻辑', '框架', '世界观', '设定', '推演', '结构', '体系', '规则', '势力', '力量'],
    keywords: ['设定', '世界观', '力量体系', '规则', '势力', '推演', '逻辑', '结构'],
    description: '擅长搭建框架骨架、世界观设定、逻辑推演',
    priority: 2
  },
  {
    mentorId: 'kimi',
    name: '📐 框架导师',
    coreTags: ['大纲', '章纲', '细纲', '规划', '结构', '蓝图', '脉络', '章节', '节奏'],
    keywords: ['大纲', '细纲', '章纲', '规划', '结构', '蓝图', '脉络', '章节'],
    description: '擅长查阅上下文资料、整理文献、甄别数据',
    priority: 2
  },
  {
    mentorId: 'gpt4o',
    name: '✍️ 文案导师',
    coreTags: ['文案', '写作', '润色', '对话', '情感', '描写', '文笔', '措辞', '修辞'],
    keywords: ['润色', '修改', '改写', '对话', '描写', '情感', '文笔', '措辞'],
    description: '擅长文字润色、对话生成、情感渲染',
    priority: 2
  },
  {
    mentorId: 'claude',
    name: '🔍 分析导师',
    coreTags: ['分析', '诊断', '毒点', '拆解', '对标', '打分', '问题', '优化', '评估'],
    keywords: ['分析', '诊断', '点评', '毒点', '问题', '优化', '评估', '对标'],
    description: '擅长深度分析、拆解技巧、毒点检测',
    priority: 2
  },
  {
    mentorId: 'qwen',
    name: '🎨 创意导师',
    coreTags: ['创意', '灵感', '脑洞', '桥段', '构思', '想象', '创意', '灵感', '点子'],
    keywords: ['灵感', '脑洞', '创意', '点子', '桥段', '构思', '想象'],
    description: '擅长灵感迸发、桥段构思、脑洞拓展',
    priority: 2
  }
];

function autoMatchMentor(userQuestion) {
  const cleanText = userQuestion
    .toLowerCase()
    .replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s]/g, ' ')
    .trim();
  const wordList = cleanText.split(/\s+/).filter(word => word.length > 0);

  let maxScore = 0;
  let bestMentor = MENTOR_CONFIG[0];

  for (const mentor of MENTOR_CONFIG) {
    let score = 0;

    const coreHitCount = mentor.coreTags.filter(tag => {
      const tagLower = tag.toLowerCase();
      return wordList.some(word => word.includes(tagLower) || tagLower.includes(word));
    }).length;
    score += coreHitCount * 3;

    const keywordHitCount = mentor.keywords.filter(keyword => {
      const kwLower = keyword.toLowerCase();
      return wordList.some(word => word.includes(kwLower) || kwLower.includes(word));
    }).length;
    score += keywordHitCount * 1;

    if (score > maxScore) {
      maxScore = score;
      bestMentor = mentor;
    }
  }

  const MATCH_THRESHOLD = 2;
  if (maxScore < MATCH_THRESHOLD) {
    const defaultMentor = MENTOR_CONFIG.find(m => m.mentorId === 'master') || MENTOR_CONFIG[0];
    return {
      mentorId: defaultMentor.mentorId,
      mentorName: defaultMentor.name,
      score: 0,
      isAuto: true
    };
  }

  return {
    mentorId: bestMentor.mentorId,
    mentorName: bestMentor.name,
    score: maxScore,
    isAuto: true
  };
}