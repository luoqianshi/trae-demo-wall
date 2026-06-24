import { knowledgeList, Knowledge } from '../data/knowledge';
type KnowledgeItem = Knowledge;
const knowledgeItems = knowledgeList;

export interface QAPair {
  keywords: string[];
  question: string;
  answer: string;
  sourceId?: string;
}

const CUSTOM_QA: QAPair[] = [
  {
    keywords: ['怎么做公益', '怎么开始', '新手', '第一次', '入门', '从零'],
    question: '我是新手，怎么开始做公益？',
    answer:
      '公益没有门槛，只需要你愿意行动。推荐从三件最容易的事开始：\n\n① 做一次完整的垃圾分类（15分钟）\n② 整理家里闲置衣物捐赠（30分钟）\n③ 向身边人分享一次公益理念（5分钟）\n\n从小事开始，让善意成为习惯。不要追求完美，先行动起来最重要。',
  },
  {
    keywords: ['时间', '忙', '没空', '没时间'],
    question: '我很忙，没时间做公益怎么办？',
    answer:
      '公益不需要你专门腾出时间，它可以融入日常生活：\n\n• 上班路上走一段路 = 绿色出行\n• 午饭时按需取餐 = 节约粮食\n• 电梯让给老人 = 一次帮扶\n• 朋友圈转发公益信息 = 一次传播\n\n"公益随手做" 正是这个理念——让每一个日常动作，都可以是一次公益。',
  },
  {
    keywords: ['捐钱', '捐款', '费用', '花钱', '免费'],
    question: '公益一定需要花钱吗？',
    answer:
      '不需要。金钱只是公益的一种形式，还有很多同样重要的方式：\n\n• 你的时间（陪伴、志愿服务）\n• 你的技能（教学、翻译、设计）\n• 你的注意力（传播、倾听）\n• 你的选择（绿色消费、理性购物）\n\n很多时候，你的在场比金钱更有价值。',
  },
  {
    keywords: ['效果', '有用吗', '意义', '价值', '真的'],
    question: '我做的这些小事真的有用吗？',
    answer:
      '有一句公益圈的话："我们无法做伟大的事，只能用伟大的爱去做小事。"\n\n一滴水也许微不足道，但千万滴水可以汇聚成河。你今天花的15分钟，可能：\n\n• 让一位老人感受到被关怀\n• 让一件旧物找到新主人\n• 让一个孩子读到一本好书\n\n你永远不会知道，自己的小小善意，最终会在世界的哪个角落开花。',
  },
  {
    keywords: ['环保', '垃圾', '绿色', '低碳'],
    question: '日常生活中怎么践行环保？',
    answer:
      '环保不是宏大叙事，而是一个个小选择的叠加：\n\n✅ 随身水杯代替瓶装水\n✅ 购物时自备环保袋\n✅ 按需点餐，光盘行动\n✅ 垃圾分类投放\n✅ 选择公共交通或骑行\n✅ 随手关灯关水\n✅ 电器不使用时拔插头\n\n每一件小事，都是对地球的温柔。',
  },
  {
    keywords: ['社区', '邻居', '邻里'],
    question: '怎么在社区做公益？',
    answer:
      '社区是公益最温暖的场域，你可以从这些小事开始：\n\n• 遇见邻居主动问好\n• 电梯里让老人和孩子先上\n• 下雨时多带一把伞分享\n• 帮隔壁独居老人带个快递\n• 清理楼道里的小广告\n• 组织楼栋图书交换\n\n社区的温度，取决于每个居民的善意。',
  },
  {
    keywords: ['孩子', '儿童', '教育', '下一代'],
    question: '怎么培养孩子的公益意识？',
    answer:
      '孩子不是被教出来的，是被带出来的：\n\n① 带孩子一起整理旧玩具捐赠\n② 带孩子参与一次社区清洁\n③ 和孩子一起读公益绘本\n④ 在生活中以身作则做好榜样\n\n孩子会模仿你的选择，而不是记住你说的话。你今天做公益的样子，就是他/她未来的样子。',
  },
  {
    keywords: ['团队', '公司', '企业', '组织', '一起'],
    question: '我们公司/团队想一起做公益？',
    answer:
      '团队公益有很多好形式：\n\n🌳 组织一次植树活动\n👕 发起公司旧物捐赠\n🍚 组织一次公益午餐（为环卫工人提供）\n📚 为山区学校募捐图书\n🏃 参与公益马拉松\n\n团队公益不仅是做好事，更是团队建设的绝佳方式——一起为一件有意义的事努力，团队凝聚力会更强。',
  },
  {
    keywords: ['你好', 'hi', 'hello', '在吗'],
    question: '你好！',
    answer: '你好呀 👋 我是你的 AI 公益小助手。你可以问我任何关于公益的问题，或者告诉我你今天想做什么，我来帮你找到最合适的行动。',
  },
  {
    keywords: ['推荐', '建议', '适合', '应该'],
    question: '你推荐我做什么？',
    answer:
      '我来帮你分析一下。先看看你当前的公益画像：\n\n• 如果是新手 → 从 5-15 分钟的简单任务开始，培养习惯\n• 如果有经验 → 尝试中等难度的任务，扩展公益领域\n• 如果是达人 → 挑战更深度的参与，带动身边人\n\n你可以在首页看到 AI 为你量身推荐的任务列表。',
  },
  {
    keywords: ['成就', '等级', '徽章', '奖励'],
    question: '成就和等级有什么用？',
    answer:
      '成就系统是对你公益旅程的见证：\n\n🎖️ 每一个徽章代表你走过的一步\n📈 等级反映你投入的累计时间\n🔥 连续打卡记录你的坚持\n\n它们不只是数字，而是你用心生活过的证据。当某天你回头看，会发现：原来自己已经做了这么多好事。',
  },
];

export interface ChatMessage {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  relatedKnowledge?: KnowledgeItem;
}

export const getAIResponse = (userInput: string): { answer: string; relatedKnowledge?: KnowledgeItem } => {
  const input = userInput.trim().toLowerCase();
  if (!input) {
    return { answer: '请告诉我你想问什么，我来帮你解答 🙂' };
  }

  // Match custom Q&A first
  for (const qa of CUSTOM_QA) {
    const matchCount = qa.keywords.filter((kw) => input.includes(kw)).length;
    if (matchCount > 0) {
      // Find related knowledge
      const related = knowledgeItems.find((k) =>
        qa.keywords.some((kw) => k.title.includes(kw) || k.content.includes(kw))
      );
      return { answer: qa.answer, relatedKnowledge: related };
    }
  }

  // Search knowledge base
  const matchedKnowledge = knowledgeItems.find(
    (k) => input.includes(k.title) || k.content.includes(userInput) || input.split(' ').some((w) => k.content.includes(w))
  );
  if (matchedKnowledge) {
    return {
      answer: `关于「${matchedKnowledge.title}」：\n\n${matchedKnowledge.content}\n\n— 来自公益知识库，希望对你有帮助。`,
      relatedKnowledge: matchedKnowledge,
    };
  }

  // Generic responses
  const genericResponses = [
    '这个问题很有意思。公益没有标准答案，最重要的是你愿意行动。你可以从一个15分钟的小任务开始，试试看会发生什么。',
    '嗯，这是一个值得思考的问题。我建议你先在首页看看 AI 为你推荐的任务，从最容易上手的开始做。行动本身，就是答案。',
    '公益的核心是 "用心" 二字。无论你的问题是什么，只要出发点是想让世界更好一点，就已经走在正确的路上了。',
    '也许我们可以一起探索这个问题。你想从哪方面开始呢？——环保、捐赠、帮扶，还是传播？',
  ];
  return {
    answer: genericResponses[Math.floor(Math.random() * genericResponses.length)],
  };
};

export const getQuickQuestions = (): string[] => [
  '我是新手，怎么开始做公益？',
  '我很忙，没时间做公益怎么办？',
  '做的这些小事真的有用吗？',
  '日常生活中怎么践行环保？',
  '怎么培养孩子的公益意识？',
];
