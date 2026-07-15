/**
 * 成长印记 · 模拟 AI 引擎（mockAI.js）
 *
 * 核心理念：Demo 阶段的"AI"不追求技术真实，而追求体验真实。
 * 用户粘贴内容 → 秒级生成有意义卡片 → 恰当地给出温暖回应。
 *
 * 设计说明：路线与标签合并后，不再生成 relations（pathId/crossPathIds 等）。
 *            标签是唯一归类维度，里程碑判断基于标签与关键词分组。
 *
 * 后续可无缝替换为真实 LLM API（仅需替换 processRecord 内部实现）。
 */

'use strict';

// ============================================================
// 关键词库（按内容类型分组，支持正则匹配）
// group 用于 cross_node 里程碑判断：跨 ≥2 个 group 视为跨领域连接
// ============================================================
const KEYWORD_GROUPS = {
  工作: [
    { match: /会议|例会|评审会|讨论会|策略会|复盘会/, category: '会议', priority: 3 },
    { match: /方案|策划|规划|路径|初稿|设计/, category: '方案', priority: 2 },
    { match: /总结|复盘|回顾|述职|月报|周报/, category: '复盘', priority: 2 },
    { match: /增长|获客|留存|裂变|DAU|MAU|下沉市场/, category: '增长策略', priority: 3 },
    { match: /汇报|述职|提案|提案会|路演/, category: '汇报', priority: 2 },
    { match: /优化|改进|提升|改良|完善/, category: '优化', priority: 3 },
    { match: /平台|系统|工具|产品/, category: '平台', priority: 2 }
  ],
  学习: [
    { match: /学习|入门|掌握了|学会了|学到了|基础概念|基础知识|基础入门/, category: '学习', priority: 2 },
    { match: /笔记|看了.*章节|第.*章|看了.*视频|看了.*教程/, category: '笔记', priority: 1 },
    { match: /算法|数据结构|线性代数|特征值|矩阵|微积分/, category: '技术学习', priority: 3 },
    { match: /SQL|JOIN|子查询|窗口函数|数据库|MySQL|SELECT/, category: '数据库', priority: 3 },
    { match: /pandas|python|Python|数据分析|可视化|ECharts|图表/, category: '数据分析', priority: 3 },
    { match: /pandas|python|Python|数据.*清洗|数据.*处理/, category: '数据分析', priority: 3 },
    { match: /React|React Hooks|useState|useEffect|useContext|useReducer|useMemo|useCallback/, category: 'React', priority: 3 },
    { match: /Vue|Vue3|组合式API|Composition API|ref|reactive|computed|watch/, category: 'Vue', priority: 3 },
    { match: /TypeScript|TS|类型|interface|type|泛型/, category: 'TypeScript', priority: 3 },
    { match: /JavaScript|js|JS|前端|后端|接口|API/, category: '编程', priority: 2 },
    { match: /git|github|版本控制|代码提交|提交代码|branch|merge/, category: '工具', priority: 1 },
    { match: /Docker|k8s|容器|部署|项目上线|产品发布|版本发布|上线了.*版本/, category: 'DevOps', priority: 2 },
    { match: /读书|阅读|书籍|看书|本书|章节|读完了|看完了.*书/, category: '阅读', priority: 1 }
  ],
  项目: [
    { match: /项目|产品|需求|迭代|版本|模块/, category: '项目', priority: 2 },
    { match: /完成|交付|上线|发布|交付物|初版|上线了/, category: '交付', priority: 3 },
    { match: /看板|dashboard|数据看板|可视化/, category: '看板', priority: 3 },
    { match: /评审|review|review过了|通过了/, category: '评审', priority: 2 }
  ],
  情绪: [
    { match: /好难|不会|挫败|崩溃|崩了|焦虑|迷茫|压力|头疼|卡住/, category: '困难', priority: 3 },
    { match: /搞不定|做不了|无进展|没进展|没搞定/, category: '困难', priority: 3 },
    { match: /终于|搞定|突破|攻克|想通了|原来如此|成功|完成了.*突破/, category: '突破', priority: 3 },
    { match: /开心|高兴|兴奋|成就感|值得|不错|有收获|有进步/, category: '正向', priority: 2 },
    { match: /太.*了|没想到|居然|竟然|其实|原来/, category: '感叹', priority: 1 }
  ],
  成长: [
    { match: /分享|演讲|技术分享|内部分享|公开分享/, category: '分享', priority: 3 },
    { match: /带新人|mentor|指导|辅导|帮助/, category: '指导', priority: 2 },
    { match: /晋升|答辩|述职|职级|晋升答辩|晋升申请/, category: '晋升', priority: 3 },
    { match: /独立负责|第一次.*负责|自己.*搞定/, category: '独立', priority: 3 },
    { match: /成长|进步|提升|进步了|有成长/, category: '成长感', priority: 2 }
  ]
};

// 提取主题词的规则（从关键词附近的文本中提取核心名词短语）
const TOPIC_EXTRACTORS = [
  { pattern: /(?:学习|掌握了?|学了?)?SQL(的?[\w]+)?/, extract: (m) => m[1] ? 'SQL' + m[1] : 'SQL' },
  { pattern: /JOIN(的?[\w]+)?|子查询|窗口函数/, extract: (m) => 'SQL高级查询' },
  { pattern: /pandas|Python.*分析|数据分析/, extract: () => '数据分析' },
  { pattern: /(数据|业务|增长)?看板/, extract: (m) => (m[1] || '') + '看板' },
  { pattern: /特征值|矩阵|线性代数/, extract: () => '线性代数' },
  { pattern: /需求评审|Q[1-4].*需求|增长策略/, extract: () => '需求与增长策略' },
  { pattern: /方案设计|方案初稿|线框图/, extract: () => '方案设计' },
  { pattern: /React Hooks|useState|useEffect|useContext|useReducer|useMemo|useCallback/, extract: () => 'React Hooks' },
  { pattern: /Vue3?|组合式API|Composition API/, extract: () => 'Vue' },
  { pattern: /TypeScript|TS.*类型|interface|泛型/, extract: () => 'TypeScript' },
  { pattern: /(?:学习|掌握了?|学了?)?(?:算法|数据结构)/, extract: (m) => m[1] || '算法与数据结构' },
  { pattern: /(\w+)(平台|系统|工具|产品)(优化|改进|提升)?/, extract: (m) => m[1] + m[2] + (m[3] || '') },
  { pattern: /(\w+)(优化|改进|提升)/, extract: (m) => m[1] + m[2] },
  { pattern: /(\w+)(平台|系统|工具|产品)/, extract: (m) => m[1] + m[2] },
  { pattern: /比对|对比|分析/, extract: () => '比对分析' },
];

// 标题模板
const TITLE_TEMPLATES = {
  '会议': '掌握了"{topic}"的核心要点',
  '学习': '深入学习：{topic}',
  '方案': '完成了"{topic}"的方案设计',
  '交付': '"{topic}"交付完成',
  '看板': '{topic}，完成',
  '突破': '{topic}，终于突破了',
  '困难': '{topic}：遇到了困难',
  '分享': '完成了"{topic}"分享',
  '晋升': '准备{topic}',
  '独立': '第一次独立{topic}',
  '复盘': '复盘{topic}',
  'React': '深入学习：{topic}',
  'Vue': '深入学习：{topic}',
  'TypeScript': '深入学习：{topic}',
  '技术学习': '深入学习：{topic}',
  '数据库': '深入学习：{topic}',
  '数据分析': '深入学习：{topic}',
  '编程': '编程实践：{topic}',
  '正向': '记录：{topic}',
  '优化': '{topic}，优化中',
  '平台': '{topic}平台建设',
  '默认': '记录：{topic}'
};

// 摘要生成：从原文提取含关键词的核心句子
function extractSummary(text, keywords) {
  const sentences = text.split(/[。！？\n]/).filter(s => s.trim().length > 5);
  // 优先选含关键词最多的句子
  const scored = sentences.map(s => {
    const count = keywords.filter(k => s.includes(k)).length;
    return { s: s.trim(), score: count };
  });
  scored.sort((a, b) => b.score - a.score);
  const best = scored.length > 0 ? scored[0].s : text.slice(0, 60);
  return best.slice(0, 80) + (best.length > 80 ? '…' : '');
}

// ============================================================
// 温暖回应模板
// 变量说明：
//   {tagName} - 新标签名（first_step 用）
//   {days}    - 距离上次困难记录的天数（breakthrough 用）
//   {groupA} {groupB} - 跨领域的两个分组名（cross_node 用）
// ============================================================
const WARM_TEMPLATES = {
  first_step: [
    '万事开头难，你已经迈出去了。{tagName}这个方向上，你正站在起点——但起点本身就是值得被记住的一步。',
    '新的方向开始了，第一步很重要。每一个伟大的旅程，都始于一个小小的开始。',
    '开始了，就是好的。{tagName}这条路，从此有了你的足迹。',
    '第一步总是最需要勇气的，你做到了。{tagName}领域，欢迎你的加入。',
    '在{tagName}这个全新的起点上，你的每一步都值得被记录和庆祝。'
  ],
  breakthrough: [
    '从"好难"到"搞定"，这一步值得被看见。{days}天前你还在为这个问题沮丧，现在你已经站在另一边了。这种感觉，是成长最好的证明。',
    '{days}天前你还在为这个问题卡住，现在已经攻克了！这种跨越的喜悦，我替你记下了。',
    '突破时刻，为你记录。从困惑到清晰，你完成了一次漂亮的成长跃迁。',
    '回看{days}天前的自己，你已经走了很远。这种进步，值得被好好珍藏。',
    '恭喜你突破了这个瓶颈！每一次突破都在为未来的你积蓄力量。'
  ],
  cross_node: [
    '有意思，你这次的记录横跨了{groupA}和{groupB}两个领域。跨领域的连接往往最有价值——你刚刚做了一个。',
    '当一个领域的方法被用到另一个领域，往往是最有价值的时刻。你刚刚做了一个。',
    '{groupA}和{groupB}的碰撞，会产生什么样的火花呢？期待看到你的创新。',
    '跨领域思考是创造力的源泉，你正在实践这一点。',
    '将{groupA}的经验带到{groupB}，这种跨界视角很珍贵。'
  ],
  daily: [
    '记录本身就是一种力量，谢谢你愿意分享。',
    '每一个小小的思考，都是成长的种子。',
    '你的想法很有价值，我替你好好保存着。',
    '今天的记录，明天的回忆。',
    '持续记录，就是持续成长。',
    '你的每一次思考都值得被认真对待。',
    '写下这些文字的你，正在创造属于自己的成长轨迹。',
    '简单的记录，不简单的意义。',
    '这一刻的想法，是未来的线索。',
    '谢谢你让我见证你的成长。'
  ]
};

// 从模板中随机选一条并填充变量
function fillWarmTemplate(type, vars = {}) {
  const templates = WARM_TEMPLATES[type];
  if (!templates || templates.length === 0) return null;
  let tpl = templates[Math.floor(Math.random() * templates.length)];
  tpl = tpl.replace(/\{(\w+)\}/g, (_, key) => vars[key] !== undefined ? vars[key] : '');
  return tpl;
}

// ============================================================
// 里程碑判断（基于标签与关键词分组）
//
// 判断优先级：breakthrough > cross_node > first_step
//   - breakthrough: 同标签下 7 天内有"情绪"标签的历史记录，且当前有"学习"标签
//                   体现"从困难到突破"的成长弧线（与 first_step 互斥，因新标签无历史）
//   - cross_node:   关键词跨 ≥2 个 group（工作/学习/项目/情绪/成长），体现跨领域连接
//   - first_step:   记录的任一标签在历史中从未出现，是新脉络的起点
// ============================================================
function checkMilestone(record, hitKeywords, allRecords) {
  if (!record.understanding || !record.understanding.tags || record.understanding.tags.length === 0) {
    return null;
  }
  const tags = record.understanding.tags;
  const now = record.createdAt;

  // breakthrough：同标签下 7 天内有"情绪"标签的历史记录，且当前有"学习"标签
  // 注：主分类已作为第一个标签附加，所以 tags[0] 即为原 insightType
  if (tags.includes('学习')) {
    for (const tag of tags) {
      const prevEmotionInTag = allRecords.find(r => {
        if (!r.understanding) return false;
        const rTags = r.understanding.tags || [];
        if (!rTags.includes('情绪')) return false;
        if (!rTags.includes(tag)) return false;
        if (typeof r.createdAt !== 'number' || isNaN(r.createdAt)) return false;
        const daysDiff = (now - r.createdAt) / (1000 * 60 * 60 * 24);
        return daysDiff >= 0 && daysDiff <= 7;
      });
      if (prevEmotionInTag) {
        return { type: 'breakthrough', refRecord: prevEmotionInTag };
      }
    }
  }

  // cross_node：关键词跨 ≥2 个 group，体现跨领域连接
  if (hitKeywords && hitKeywords.length > 0) {
    const groups = [...new Set(hitKeywords.map(h => h.group))];
    if (groups.length >= 2) {
      return { type: 'cross_node', groupA: groups[0], groupB: groups[1] };
    }
  }

  // first_step：任一标签在历史记录中从未出现，是新脉络的起点
  const allHistoricalTags = new Set();
  allRecords.forEach(r => {
    const rTags = (r.understanding && r.understanding.tags) || [];
    rTags.forEach(t => allHistoricalTags.add(t));
  });
  const newTag = tags.find(t => !allHistoricalTags.has(t));
  if (newTag) {
    return { type: 'first_step', tagName: newTag };
  }

  return null;
}

// ============================================================
// 核心函数：处理用户输入
// 返回记录结构：{ originalContent, understanding, warmResponse, milestone }
// ============================================================
function processRecord(input) {
  if (!input || input.trim().length === 0) return null;
  input = input.trim();

  // --- Step 1: 关键词提取 ---
  // keyword 存实际匹配到的词（用于摘要提取），category 存分类标签
  let hitKeywords = [];
  for (const [groupName, rules] of Object.entries(KEYWORD_GROUPS)) {
    for (const rule of rules) {
      const match = rule.match.exec(input);
      if (match) {
        hitKeywords.push({
          keyword: match[0],
          category: rule.category,
          priority: rule.priority,
          group: groupName
        });
      }
    }
  }
  // 去重（按 category 去重，保留 priority 最高的）
  const seenCategory = new Set();
  hitKeywords = hitKeywords.filter(h => {
    if (seenCategory.has(h.category)) return false;
    seenCategory.add(h.category);
    return true;
  });
  hitKeywords.sort((a, b) => b.priority - a.priority);
  const keywordLabels = hitKeywords.slice(0, 4).map(h => h.category);
  const matchedWords = hitKeywords.slice(0, 3).map(h => h.keyword);

  // --- Step 2: 内容类型判断 ---
  // 计算各分组得分：综合考虑优先级总分 + 匹配关键词数量，避免关键词多的组天然占优
  const groupScore = {};
  const groupMatchCount = {}; // 每个组匹配到的关键词数量
  hitKeywords.forEach(h => {
    groupScore[h.group] = (groupScore[h.group] || 0) + h.priority;
    groupMatchCount[h.group] = (groupMatchCount[h.group] || 0) + 1;
  });

  // 计算综合得分：优先级为主，匹配数量为辅（数量越多，说明该主题越明确）
  // 同时加入"组规模修正因子"：关键词多的组（如学习）扣分，避免天然优势
  const groupSizes = {};
  for (const [groupName, rules] of Object.entries(KEYWORD_GROUPS)) {
    groupSizes[groupName] = rules.length;
  }
  const maxGroupSize = Math.max(...Object.values(groupSizes));

  const finalScores = {};
  for (const groupName of Object.keys(groupScore)) {
    const priorityScore = groupScore[groupName];
    const matchCount = groupMatchCount[groupName];
    const groupSize = groupSizes[groupName] || 1;
    // 规模修正：小组关键词少但匹配到了，说明更精准，给予加成
    // 大组（如学习）关键词多，命中概率高，适当降低权重
    const sizeFactor = 1 + (maxGroupSize - groupSize) / maxGroupSize * 0.3;
    // 匹配数量加成：命中多个关键词比只命中一个更有说服力
    const countFactor = 1 + (matchCount - 1) * 0.15;
    finalScores[groupName] = priorityScore * sizeFactor * countFactor;
  }

  const topGroup = Object.entries(finalScores).sort((a, b) => b[1] - a[1])[0];
  const finalInsightType = topGroup ? topGroup[0] : '工作';

  // --- Step 3: 标题生成 ---
  let topic = '';
  for (const extractor of TOPIC_EXTRACTORS) {
    const m = input.match(extractor.pattern);
    if (m) {
      topic = extractor.extract(m);
      break;
    }
  }
  if (!topic) {
    const topKeywords = hitKeywords.slice(0, 2).map(h => h.category);
    if (topKeywords.length > 0) {
      topic = topKeywords.join('、');
    } else {
      topic = input.length > 12 ? input.slice(0, 12) : input;
    }
  }
  if (topic.length > 24) topic = topic.slice(0, 24);

  const topCategory = hitKeywords.length > 0 ? hitKeywords[0].category : '';
  
  // 如果 topic 只是分类名称，改用输入文本前几个字作为主题，避免标题过于抽象
  if (topCategory && topic === topCategory) {
    topic = input.length > 12 ? input.slice(0, 12) : input;
    if (topic.length > 24) topic = topic.slice(0, 24);
  }
  
  let titleTemplate = TITLE_TEMPLATES[topCategory] || TITLE_TEMPLATES[finalInsightType] || TITLE_TEMPLATES['默认'];
  let title = titleTemplate.replace('{topic}', topic);
  if (title.length > 30) {
    title = topic;
  }

  // --- Step 4: 摘要生成 ---
  const summary = extractSummary(input, matchedWords);

  // --- Step 5: 标签生成 ---
  // 将主分类(finalInsightType)作为标签附加到最前面，实现"类型=标签"的合并
  const tags = [finalInsightType, ...new Set(keywordLabels)].slice(0, 5);
  if (tags.length === 0) tags.push('记录');

  // --- Step 6: 里程碑判断 + 温暖回应 ---
  const allRecords = Store ? Store.records : [];
  const mockRecord = {
    id: '#999',
    createdAt: Date.now(),
    originalContent: input,
    understanding: {
      title,
      summary,
      tags
    }
  };
  const milestoneResult = checkMilestone(mockRecord, hitKeywords, allRecords);

  let milestone = null;
  let warmResponse = null;
  if (milestoneResult) {
    milestone = milestoneResult.type;
    const vars = {};
    if (milestone === 'first_step') {
      vars.tagName = milestoneResult.tagName;
    } else if (milestone === 'breakthrough') {
      const ref = milestoneResult.refRecord;
      if (ref && typeof ref.createdAt === 'number') {
        vars.days = Math.round((Date.now() - ref.createdAt) / (1000 * 60 * 60 * 24));
      }
    } else if (milestone === 'cross_node') {
      vars.groupA = milestoneResult.groupA;
      vars.groupB = milestoneResult.groupB;
    }
    warmResponse = fillWarmTemplate(milestone, vars);
  } else {
    if (Math.random() > 0.5) {
      warmResponse = fillWarmTemplate('daily');
    }
  }

  // --- Step 7: 关联计算 ---
  // 基于标签重叠、时间衰减、内容关键词匹配，找到上游关联节点
  const relations = buildRelations(mockRecord, allRecords);

  // --- Step 8: 构建最终记录 ---
  // 标签是唯一归类维度，主分类已作为第一个标签附加
  return {
    originalContent: input,
    understanding: {
      title,
      summary,
      tags
    },
    warmResponse,
    milestone,
    relations
  };
}

// ============================================================
// 辅：基于关键词快速判断是否为困难/突破记录
// ============================================================
function isEmotionBreakthrough(input) {
  const difficultPatterns = /好难|不会|挫败|崩溃|卡住|搞不定|无进展|焦虑|迷茫/;
  const breakthroughPatterns = /终于|搞定|突破|攻克|想通了|成功|完成了.*突破/;
  return {
    isDifficult: difficultPatterns.test(input),
    isBreakthrough: breakthroughPatterns.test(input)
  };
}

// ============================================================
// 关联算法：智能关联 / 自动成链
// 基于标签重叠度 + 时间衰减 + 内容关键词匹配，计算记录间的关联关系
// ============================================================

// 中文停用词集合，用于核心词提取时过滤
const STOP_WORDS = new Set([
  '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一',
  '一个', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着',
  '没有', '看', '好', '自己', '这', '那', '她', '他', '它', '们',
  '什么', '怎么', '如何', '今天', '明天', '昨天', '感觉', '觉得',
  '可以', '已经', '还是', '然后', '因为', '所以', '但是', '不过',
  '之前', '之后', '一下', '一些', '这个', '那个', '比较', '其实',
  '发现', '做了', '完成', '开始', '用了',
  '通过', '从', '对', '把', '被', '让', '给', '向',
  '做', '用', '能', '想', '来', '知道',
  '但', '而', '或', '如果', '虽然', '只', '才', '更', '最', '比',
  '多', '少', '大', '小', '新', '老', '第一', '第二', '第三'
]);

/**
 * 从文本中提取核心词组（2-4字 n-gram，过滤停用词）
 * 用于内容层面的关联匹配
 * @param {string} text - 输入文本
 * @returns {Set<string>} 核心词组集合
 */
function extractCorePhrases(text) {
  if (!text || text.length < 2) return new Set();
  const phrases = new Set();
  // 2-gram
  for (let i = 0; i < text.length - 1; i++) {
    const bigram = text.substring(i, i + 2);
    // 过滤纯标点/空白
    if (/^[\s\p{P}]+$/u.test(bigram)) continue;
    // 过滤含停用词的词组
    if (STOP_WORDS.has(bigram)) continue;
    // 过滤第一个字是停用词的
    if (STOP_WORDS.has(bigram[0])) continue;
    phrases.add(bigram);
  }
  // 3-gram
  for (let i = 0; i < text.length - 2; i++) {
    const trigram = text.substring(i, i + 3);
    if (/^[\s\p{P}]+$/u.test(trigram)) continue;
    if (STOP_WORDS.has(trigram[0]) || STOP_WORDS.has(trigram[1])) continue;
    phrases.add(trigram);
  }
  // 4-gram
  for (let i = 0; i < text.length - 3; i++) {
    const fourgram = text.substring(i, i + 4);
    if (/^[\s\p{P}]+$/u.test(fourgram)) continue;
    if (STOP_WORDS.has(fourgram[0]) || STOP_WORDS.has(fourgram[1])) continue;
    phrases.add(fourgram);
  }
  return phrases;
}

// 关联类型的用户可见名称映射
const RELATION_TYPE_LABELS = {
  same_topic_deepen: '深入探索',
  method_transfer: '方法迁移',
  cause_effect: '前因后果',
  emotion_arc: '从困到破'
};

/**
 * 根据标签重叠、内容特征判断关联类型
 * @param {object} params - 评分参数
 * @returns {string} 关联类型标识
 */
function classifyRelation(params) {
  const { sharedTags, newTags, refTags, newContent, refContent, newRecord, refRecord } = params;

  const newTagSet = new Set(newTags);
  const refTagSet = new Set(refTags);
  const sharedSet = new Set(sharedTags);
  const onlyNew = [...newTagSet].filter(t => !sharedSet.has(t));
  const onlyRef = [...refTagSet].filter(t => !sharedSet.has(t));

  // emotion_arc：同标签下"困难"→"突破"的成长弧
  // 检查候选记录是否有困难/挫折关键词，新记录是否有突破关键词
  const refIsDifficult = /好难|不会|挫败|崩溃|卡住|搞不定|无进展|焦虑|迷茫/.test(refContent);
  const newIsBreakthrough = /终于|搞定|突破|攻克|想通了|成功/.test(newContent);
  if (refIsDifficult && newIsBreakthrough && sharedTags.length > 0) {
    return 'emotion_arc';
  }

  // cause_effect / method_transfer：共享标签 + 标签部分重叠（跨领域）
  // 若有呼应关键词（评审→交付等）则为因果关系，否则降级为方法迁移
  const timeDiff = (newRecord.createdAt - refRecord.createdAt) / (1000 * 60 * 60 * 24);
  if (sharedTags.length > 0 && onlyNew.length > 0 && onlyRef.length > 0) {
    const causeKeywords = /需求|方案|设计|评审|规划|计划|开始|决定/;
    const effectKeywords = /交付|完成|上线|发布|通过|搞定|突破|成功/;
    if (timeDiff <= 14 && causeKeywords.test(refContent) && effectKeywords.test(newContent)) {
      return 'cause_effect';
    }
    return 'method_transfer';
  }

  // same_topic_deepen：默认，在同一主题上进一步探索
  return 'same_topic_deepen';
}

/**
 * 生成用户可读的关联原因描述
 * @param {string} type - 关联类型
 * @param {string[]} sharedTags - 共享标签列表
 * @param {object} newRecord - 新记录
 * @param {object} refRecord - 候选记录
 * @returns {string} 原因描述
 */
function describeRelation(type, sharedTags, newRecord, refRecord) {
  // 取最有意义的共享标签（优先非主分类标签）
  const meaningfulTag = sharedTags.find(t => !['工作', '学习', '项目', '情绪', '成长'].includes(t)) || sharedTags[0] || '';
  const newTitle = (newRecord.understanding && newRecord.understanding.title) || '';
  const refTitle = (refRecord.understanding && refRecord.understanding.title) || '';

  switch (type) {
    case 'same_topic_deepen':
      return meaningfulTag ? `同样在探索「${meaningfulTag}」` : '同一主题的持续探索';
    case 'method_transfer':
      return meaningfulTag ? `将「${meaningfulTag}」的方法迁移到新领域` : '跨领域方法迁移';
    case 'cause_effect':
      return `从「${refTitle.slice(0, 12)}」到「${newTitle.slice(0, 12)}」`;
    case 'emotion_arc':
      return `从「${refTitle.slice(0, 12)}」到突破`;
    default:
      return '相关记录';
  }
}

/**
 * 计算新记录与已有记录之间的关联关系
 * 基于：标签重叠度(40分) + 时间衰减(20分) + 内容关键词匹配(40分)
 *
 * @param {object} newRecord - 新记录（需有 understanding.tags 和 originalContent）
 * @param {object[]} allRecords - 所有已有记录（不含新记录本身）
 * @returns {{ upstream: Array, crossLinks: Array }}
 */
function buildRelations(newRecord, allRecords) {
  const result = { upstream: [], crossLinks: [] };

  if (!newRecord || !newRecord.understanding || !Array.isArray(newRecord.understanding.tags)) {
    return result;
  }
  if (!allRecords || allRecords.length === 0) {
    return result;
  }

  const newTags = newRecord.understanding.tags;
  const newContent = (newRecord.originalContent || '').toLowerCase();
  const newPhrases = extractCorePhrases(newContent);

  // 只查找时间早于新记录的上游节点
  const candidates = allRecords.filter(r =>
    r && r.understanding && typeof r.createdAt === 'number' &&
    r.createdAt < newRecord.createdAt
  );

  if (candidates.length === 0) return result;

  // 评分并分类
  const scored = candidates.map(ref => {
    const refTags = (ref.understanding.tags || []);
    const refContent = (ref.originalContent || '').toLowerCase();
    const refPhrases = extractCorePhrases(refContent);

    // 1. 标签重叠度（40分）
    const sharedTags = newTags.filter(t => refTags.includes(t));
    const minTagCount = Math.min(newTags.length, refTags.length) || 1;
    let tagScore = (sharedTags.length / minTagCount) * 40;
    // 共享主分类标签（第一个标签）额外加 10 分
    if (newTags.length > 0 && refTags.length > 0 && newTags[0] === refTags[0]) {
      tagScore = Math.min(tagScore + 10, 50); // 标签维度上限 50
    }

    // 2. 时间衰减（20分）
    const daysDiff = (newRecord.createdAt - ref.createdAt) / (1000 * 60 * 60 * 24);
    let timeScore = 0;
    if (daysDiff <= 3) timeScore = 20;
    else if (daysDiff <= 7) timeScore = 15;
    else if (daysDiff <= 14) timeScore = 10;
    else if (daysDiff <= 30) timeScore = 5;

    // 3. 内容关键词呼应（40分）
    // 避免 double-counting：同一位置只计入最长匹配的 n-gram
    let contentScore = 0;
    if (newPhrases.size > 0 && refPhrases.size > 0) {
      // newContent 已在函数开头 lowercased，直接复用
      const newContentLower = newContent;
      const usedPositions = new Set(); // 已被较长 n-gram 占用的位置

      // 按长度降序处理：先匹配 4-gram，再 3-gram，最后 2-gram
      // 每个位置只计入首次匹配的最长 n-gram，避免子串重复计分
      const phraseLengths = [4, 3, 2];
      for (const len of phraseLengths) {
        for (let i = 0; i <= newContentLower.length - len; i++) {
          if (usedPositions.has(i)) continue; // 该位置已被更长匹配占用
          const phrase = newContentLower.substring(i, i + len);
          if (refPhrases.has(phrase)) {
            const bonus = len >= 4 ? 18 : len >= 3 ? 15 : 10;
            contentScore += bonus;
            // 标记该位置及后续 len-1 个位置为已使用
            for (let j = i; j < i + len; j++) usedPositions.add(j);
          }
        }
      }
      contentScore = Math.min(contentScore, 40);
    }

    const totalScore = Math.round(tagScore + timeScore + contentScore);

    return {
      recordId: ref.id,
      refRecord: ref,
      score: totalScore,
      sharedTags,
      tagScore,
      timeScore,
      contentScore
    };
  });

  // 筛选有关联的（>=30 分）
  const linked = scored.filter(s => s.score >= 30).sort((a, b) => b.score - a.score);

  // 按关联类型分组，每类只保留最高分的一条
  const typeBest = {};
  for (const item of linked) {
    // 判断关联类型
    const type = classifyRelation({
      sharedTags: item.sharedTags,
      newTags,
      refTags: item.refRecord.understanding.tags,
      newContent: newRecord.originalContent,
      refContent: item.refRecord.originalContent,
      newRecord,
      refRecord: item.refRecord
    });
    const key = type;
    if (!typeBest[key] || item.score > typeBest[key].score) {
      typeBest[key] = { ...item, type };
    }
  }

  // upstream 最多 2 条，按分数排序
  result.upstream = Object.values(typeBest)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(item => ({
      recordId: item.recordId,
      type: item.type,
      reason: describeRelation(item.type, item.sharedTags, newRecord, item.refRecord)
    }));

  // crossLinks：新记录标签 T1 与候选标签 T2 不同，但内容有关键词重叠
  // 即候选记录有新记录没有的标签，但内容有关联
  const crossCandidates = scored
    .filter(s => s.score >= 20 && s.sharedTags.length > 0 && s.contentScore > 0)
    .sort((a, b) => b.score - a.score);

  for (const item of crossCandidates.slice(0, 3)) {
    const refTags = item.refRecord.understanding.tags || [];
    // 找到候选有但新记录没有的标签（排除主分类）
    const otherTags = refTags.filter(t => !newTags.includes(t));
    // 取第一个非主分类的独有标签
    const otherTag = otherTags.find(t => !['工作', '学习', '项目', '情绪', '成长'].includes(t)) || otherTags[0];
    if (otherTag) {
      // 找一个共享标签（排除主分类）
      const sharedNonMain = item.sharedTags.find(t => !['工作', '学习', '项目', '情绪', '成长'].includes(t)) || item.sharedTags[0];
      result.crossLinks.push({
        recordId: item.recordId,
        sharedTag: sharedNonMain || item.sharedTags[0],
        otherTag: otherTag
      });
      if (result.crossLinks.length >= 2) break;
    }
  }

  return result;
}
