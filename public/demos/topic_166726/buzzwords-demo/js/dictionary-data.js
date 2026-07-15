/**
 * @file 黑话词典数据 - 12个黑话词语的完整词条 + 翻译映射表
 * 供词典搜索、洗白翻译、染黑翻译三个支线功能使用
 */

/**
 * 词典词条数据结构
 * @typedef {Object} DictEntry
 * @property {string} word - 黑话词语
 * @property {string} category - 分类
 * @property {string} plainMeaning - 人话翻译
 * @property {number} toxicity - 浓度评级 1-5
 * @property {string} example - 人间真实例句
 * @property {string} abuse - 滥用场景
 * @property {string[]} synonyms - 同义词/变体
 * @property {string} origin - 来源行业
 * @property {boolean} hasPuzzle - 是否已有解谜关卡
 */

/** 黑话词典 - 全部词条 */
const DICTIONARY = [
  {
    word: '赋能',
    category: '管理类',
    plainMeaning: '给能力/给资源（但实际上什么都没给）',
    toxicity: 4,
    example: '"我们要赋能一线员工，让大家放手去干。"\n\n翻译：你们自己想办法，但锅我替你们背了名义。',
    abuse: '常见于管理层发言和 OKR 文档中，用来美化"给任务但不给资源"的行为。说的人觉得自己在授权，听的人知道自己被放养。',
    synonyms: ['授权', '给予支持', '加持'],
    origin: '互联网',
    hasPuzzle: true
  },
  {
    word: '闭环',
    category: '流程类',
    plainMeaning: '做完一件事检查一遍（其实就是收尾）',
    toxicity: 3,
    example: '"这个项目我们需要形成闭环，确保每个环节都有始有终。"\n\n翻译：出了问题别找我，流程上都转过了。',
    abuse: '常用于项目复盘和流程文档中，将简单的"做完一件事检查一遍"包装成高深的管理概念。实际上大多数"闭环"只是"收尾"的换皮说法。',
    synonyms: ['收尾', '形成回路', '端到端'],
    origin: '互联网',
    hasPuzzle: true
  },
  {
    word: '对齐',
    category: '沟通类',
    plainMeaning: '统一意见（其实就是开个会达成共识）',
    toxicity: 3,
    example: '"我们先对齐一下认知，确保大家在同一频道上。"\n\n翻译：你们没按我的想法来，重新听我说一遍。',
    abuse: '常出现在跨部门沟通和项目启动会中，把简单的"统一意见"包装成军事级的协同操作。实际上"对齐"之后往往什么都没改变。',
    synonyms: ['拉齐', '同步', '统一'],
    origin: '互联网',
    hasPuzzle: true
  },
  {
    word: '抓手',
    category: '执行类',
    plainMeaning: '切入点/方法（其实就是"办法"两个字）',
    toxicity: 4,
    example: '"这个项目我们得先找到抓手，才能往下推。"\n\n翻译：先想个办法，不然没法干。',
    abuse: '几乎所有需要"想办法"的场景都被替换成了"找抓手"。说的人觉得自己很落地，听的人觉得你在拽什么词。',
    synonyms: ['切入点', '着力点', '方法'],
    origin: '互联网',
    hasPuzzle: false
  },
  {
    word: '颗粒度',
    category: '分析类',
    plainMeaning: '细节程度（其实就是"详细不详细"）',
    toxicity: 3,
    example: '"这个方案的颗粒度还不够，需要再细化。"\n\n翻译：写得太粗了，再详细点。',
    abuse: '把"详细程度"包装成一个听起来很专业的度量指标。实际上就是"你写得太笼统了"，但说"颗粒度不够"显得自己更有水平。',
    synonyms: ['精细度', '细化程度', '细节'],
    origin: '互联网',
    hasPuzzle: false
  },
  {
    word: '沉淀',
    category: '知识类',
    plainMeaning: '积累/总结（其实就是"记下来"）',
    toxicity: 3,
    example: '"做完这个项目，我们要把经验沉淀下来。"\n\n翻译：写个文档记一下，以后可能也没人看。',
    abuse: '把"写文档/做总结"包装成一种有重量的知识管理行为。实际上大多数"沉淀"的文档都在文件夹里吃灰。',
    synonyms: ['积累', '总结', '固化'],
    origin: '互联网',
    hasPuzzle: false
  },
  {
    word: '心智',
    category: '品牌类',
    plainMeaning: '用户印象（其实就是"大家怎么想的"）',
    toxicity: 4,
    example: '"我们要占领用户心智，让用户一想到XX就想到我们。"\n\n翻译：多打广告，让用户记住我们。',
    abuse: '把"品牌印象/用户认知"包装成一个听起来像心理学专业的概念。实际上就是"让用户记住你"，但说"占领心智"显得自己更高级。',
    synonyms: ['认知', '印象', '品牌定位'],
    origin: '互联网',
    hasPuzzle: false
  },
  {
    word: '拉齐',
    category: '沟通类',
    plainMeaning: '同步信息（其实就是"告诉一声"）',
    toxicity: 3,
    example: '"我们先把各方信息拉齐，然后再决策。"\n\n翻译：大家先通报一下情况，然后再说。',
    abuse: '"对齐"的同义词变体，用"拉"字增加动感。本质上就是"同步一下信息"，但说"拉齐"显得更有执行力。',
    synonyms: ['对齐', '同步', '通气'],
    origin: '互联网',
    hasPuzzle: false
  },
  {
    word: '打法',
    category: '策略类',
    plainMeaning: '方法/策略（其实就是"怎么干"）',
    toxicity: 3,
    example: '"这个市场的打法跟之前不一样，我们需要调整策略。"\n\n翻译：换种方法试试。',
    abuse: '把"方法/策略"包装成体育竞技术语，显得更有攻击性和战斗感。实际上就是"换个做法"，但说"打法"显得自己在打仗。',
    synonyms: ['策略', '方法', '路子'],
    origin: '互联网',
    hasPuzzle: false
  },
  {
    word: '护城河',
    category: '战略类',
    plainMeaning: '核心竞争力（其实就是"别人学不来的优势"）',
    toxicity: 4,
    example: '"我们需要建立自己的护城河，防止竞争对手入侵。"\n\n翻译：搞点别人抄不走的东西。',
    abuse: '把"竞争优势"包装成中世纪城堡防御概念。听起来很宏大，实际上大多数所谓的"护城河"不过是先发优势或资源垄断。',
    synonyms: ['壁垒', '核心竞争力', '门槛'],
    origin: '互联网',
    hasPuzzle: false
  },
  {
    word: '组合拳',
    category: '执行类',
    plainMeaning: '一系列配合的动作（其实就是"一套方法"）',
    toxicity: 3,
    example: '"这次活动我们要用营销组合拳，线上线下一起发力。"\n\n翻译：线上线下一起搞。',
    abuse: '把"一系列措施"包装成拳击术语，显得更有力量感。实际上就是"多管齐下"，但说"组合拳"显得自己在打比赛。',
    synonyms: ['一套方案', '多管齐下', '系列动作'],
    origin: '互联网',
    hasPuzzle: false
  },
  {
    word: '底层逻辑',
    category: '分析类',
    plainMeaning: '基本原理（其实就是"根本原因"）',
    toxicity: 4,
    example: '"这件事的底层逻辑是供需关系，我们要从这里入手。"\n\n翻译：归根结底就是供需关系。',
    abuse: '把"基本原理/根本原因"包装成一个听起来很有深度的概念。实际上大多数"底层逻辑"不过是常识，但说"底层逻辑"显得自己想得更深。',
    synonyms: ['基本原理', '根本原因', '本质'],
    origin: '互联网',
    hasPuzzle: false
  }
];

/**
 * 洗白映射表 - 黑话 → 人话
 * 用于扫描文本中的黑话词语并替换为人话翻译
 * @type {Array<{pattern: RegExp, buzzword: string, plain: string}>}
 */
const WASH_MAPPINGS = [
  { pattern: /赋能/g, buzzword: '赋能', plain: '给资源（实际没给）' },
  { pattern: /闭环/g, buzzword: '闭环', plain: '做完检查一遍' },
  { pattern: /对齐/g, buzzword: '对齐', plain: '统一意见' },
  { pattern: /拉齐/g, buzzword: '拉齐', plain: '同步信息' },
  { pattern: /抓手/g, buzzword: '抓手', plain: '办法/切入点' },
  { pattern: /颗粒度/g, buzzword: '颗粒度', plain: '详细程度' },
  { pattern: /沉淀/g, buzzword: '沉淀', plain: '总结记录' },
  { pattern: /心智/g, buzzword: '心智', plain: '用户印象' },
  { pattern: /打法/g, buzzword: '打法', plain: '方法/策略' },
  { pattern: /护城河/g, buzzword: '护城河', plain: '核心竞争力' },
  { pattern: /组合拳/g, buzzword: '组合拳', plain: '一系列措施' },
  { pattern: /底层逻辑/g, buzzword: '底层逻辑', plain: '基本原理' }
];

/**
 * 染黑映射表 - 人话 → 黑话
 * 用于扫描日常文本并将其替换为黑话版本
 * @type {Array<{pattern: RegExp, plain: string, buzzword: string}>}
 */
const DARKEN_MAPPINGS = [
  { pattern: /给(?:.*?)?资源/g, plain: '给资源', buzzword: '赋能' },
  { pattern: /提供(?:.*?)?支持/g, plain: '提供支持', buzzword: '赋能' },
  { pattern: /做完(?:.*?)(?:检查|确认)(?:一遍)?/g, plain: '做完检查一遍', buzzword: '形成闭环' },
  { pattern: /有始有终/g, plain: '有始有终', buzzword: '形成闭环' },
  { pattern: /统一(?:意见|想法|认知)/g, plain: '统一意见', buzzword: '对齐' },
  { pattern: /达成共识/g, plain: '达成共识', buzzword: '对齐' },
  { pattern: /同步(?:一下)?(?:信息|情况)/g, plain: '同步信息', buzzword: '拉齐' },
  { pattern: /通气/g, plain: '通气', buzzword: '拉齐' },
  { pattern: /想(?:个)?办法/g, plain: '想办法', buzzword: '找抓手' },
  { pattern: /切入点/g, plain: '切入点', buzzword: '抓手' },
  { pattern: /(?:太)?(?:粗(?:略)?|笼统)(?:了)?/g, plain: '太粗略', buzzword: '颗粒度不够' },
  { pattern: /(?:再)?详细(?:一点|些)/g, plain: '详细一点', buzzword: '细化颗粒度' },
  { pattern: /总结/g, plain: '总结', buzzword: '沉淀' },
  { pattern: /积累/g, plain: '积累', buzzword: '沉淀' },
  { pattern: /品牌印象/g, plain: '品牌印象', buzzword: '用户心智' },
  { pattern: /让用户记住/g, plain: '让用户记住', buzzword: '占领用户心智' },
  { pattern: /换(?:个)?方法/g, plain: '换个方法', buzzword: '调整打法' },
  { pattern: /策略(?:调整|改变)/g, plain: '调整策略', buzzword: '调整打法' },
  { pattern: /核心(?:竞争力|优势)/g, plain: '核心竞争力', buzzword: '护城河' },
  { pattern: /门槛/g, plain: '门槛', buzzword: '护城河' },
  { pattern: /一套(?:方案|方法|措施)/g, plain: '一套方案', buzzword: '组合拳' },
  { pattern: /多管齐下/g, plain: '多管齐下', buzzword: '组合拳' },
  { pattern: /基本原理/g, plain: '基本原理', buzzword: '底层逻辑' },
  { pattern: /根本原因/g, plain: '根本原因', buzzword: '底层逻辑' },
  { pattern: /本质(?:上|来说)?/g, plain: '本质', buzzword: '底层逻辑' }
];

/**
 * 染黑示例文本 - 供用户快速体验
 * @type {string}
 */
const DARKEN_EXAMPLE = '我们需要想办法，把方案再详细一点，总结一下经验，确保核心竞争力，然后用一套方案来统一意见。';

/**
 * 洗白示例文本 - 供用户快速体验
 * @type {string}
 */
const WASH_EXAMPLE = '我们需要赋能一线团队，找到合适的抓手，把颗粒度做细，形成闭环，占领用户心智，建立护城河，这套打法的底层逻辑就是组合拳。';
