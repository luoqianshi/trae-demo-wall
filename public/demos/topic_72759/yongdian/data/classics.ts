// ====== 古籍知识库 ======
// 精选典籍原文、译文、主题标签、智慧提炼
// 数据源：公共领域古籍，人工校对
import { ClassicPassage } from '@/lib/types';

export const classics: ClassicPassage[] = [
  // ===== 论语 =====
  {
    id: 'lunyu-xueer-1',
    book: '论语',
    chapter: '学而第一',
    originalText: '学而时习之，不亦说乎？有朋自远方来，不亦乐乎？',
    translation: '学了知识后时常温习实践，不是很愉快吗？有志同道合的朋友从远方来访，不是很快乐吗？',
    themes: ['学习', '修身', '交友'],
    wisdom: '学问需在实践中反复印证，同道交流是成长的助力',
    era: '春秋',
  },
  {
    id: 'lunyu-zilu-16',
    book: '论语',
    chapter: '子路第十三',
    originalText: '君子和而不同，小人同而不和。',
    translation: '君子能与他人和谐相处却保持独立见解，小人盲从附和却内心不和谐。',
    themes: ['处世', '人际', '和谐'],
    wisdom: '真正的和谐是尊重差异下的共存，而非盲目附和',
    era: '春秋',
  },
  {
    id: 'lunyu-weilinggong-24',
    book: '论语',
    chapter: '卫灵公第十五',
    originalText: '己所不欲，勿施于人。',
    translation: '自己不愿意承受的事情，也不要强加给别人。',
    themes: ['处世', '人际', '修身'],
    wisdom: '换位思考是人际交往的黄金法则',
    era: '春秋',
  },
  {
    id: 'lunyu-shuer-22',
    book: '论语',
    chapter: '述而第七',
    originalText: '三人行，必有我师焉。择其善者而从之，其不善者而改之。',
    translation: '几个人同行，其中必定有可以做我老师的人。选择他们的优点去学习，看到他们的缺点就反省自己。',
    themes: ['学习', '修身', '处世'],
    wisdom: '向身边每个人学习，以他人为镜照见自己',
    era: '春秋',
  },
  {
    id: 'lunyu-zihan-26',
    book: '论语',
    chapter: '子罕第九',
    originalText: '知者不惑，仁者不忧，勇者不惧。',
    translation: '聪明的人不迷惑，仁德的人不忧愁，勇敢的人不畏惧。',
    themes: ['修身', '心境', '智慧'],
    wisdom: '智慧、仁德、勇气是化解人生困惑的三重力量',
    era: '春秋',
  },
  // ===== 黄帝内经 =====
  {
    id: 'neijing-suwen-1',
    book: '黄帝内经',
    chapter: '素问·上古天真论',
    originalText: '起居有常，不妄作劳，故能形与神俱，而尽终其天年。',
    translation: '作息有规律，不过度操劳，所以能形体与精神俱佳，从而享尽自然寿命。',
    themes: ['养生', '健康', '作息'],
    wisdom: '规律作息和适度劳作是身心健康的根基',
    era: '战国',
  },
  {
    id: 'neijing-suwen-2',
    book: '黄帝内经',
    chapter: '素问·上古天真论',
    originalText: '恬淡虚无，真气从之，精神内守，病安从来。',
    translation: '保持内心恬静淡泊，真气就能顺从运行，精神内敛持守，疾病又从何而来呢？',
    themes: ['养生', '心境', '健康'],
    wisdom: '内心平和是预防疾病的第一道防线',
    era: '战国',
  },
  {
    id: 'neijing-siqi-1',
    book: '黄帝内经',
    chapter: '素问·四气调神大论',
    originalText: '春三月，此谓发陈，天地俱生，万物以荣，夜卧早起，广步于庭。',
    translation: '春季三个月，称为发陈，天地生机勃发，万物繁荣，应当晚睡早起，在庭院中阔步舒展。',
    themes: ['节气', '养生', '时令'],
    wisdom: '春季养生应顺应生发之气，舒展身体早起活动',
    era: '战国',
  },
  {
    id: 'neijing-siqi-2',
    book: '黄帝内经',
    chapter: '素问·四气调神大论',
    originalText: '冬三月，此谓闭藏，水冰地坼，无扰乎阳，早卧晚起，必待日光。',
    translation: '冬季三个月，称为闭藏，水结冰地冻裂，不要扰动阳气，应当早睡晚起，等到日光出来再起床。',
    themes: ['节气', '养生', '时令'],
    wisdom: '冬季养生重在藏养，早睡晚起以待日光温煦',
    era: '战国',
  },
  // ===== 颜氏家训 =====
  {
    id: 'yanshi-jiaozi-1',
    book: '颜氏家训',
    chapter: '教子第二',
    originalText: '教妇初来，教儿婴孩。',
    translation: '教导新妇要在她刚进门时，教导孩子要在婴幼儿时期。',
    themes: ['育儿', '教育', '教子'],
    wisdom: '教育要抓住关键期，趁早施教事半功倍',
    era: '南北朝',
  },
  {
    id: 'yanshi-mianxue-1',
    book: '颜氏家训',
    chapter: '勉学第八',
    originalText: '积财千万，不如薄伎在身。',
    translation: '积累千万财富，不如掌握一门微薄的技艺在身。',
    themes: ['学习', '修身', '事业'],
    wisdom: '自身能力是比物质财富更可靠的立身之本',
    era: '南北朝',
  },
  // ===== 中庸 =====
  {
    id: 'zhongyong-6',
    book: '中庸',
    chapter: '第六章',
    originalText: '执其两端，用其中于民。',
    translation: '把握事物的两个极端，对民众采取中间的适度之道。',
    themes: ['智慧', '决策', '修身'],
    wisdom: '面对两极抉择时，执两用中寻求平衡之道',
    era: '战国',
  },
  // ===== 菜根谭 =====
  {
    id: 'caigen-1',
    book: '菜根谭',
    chapter: '前集',
    originalText: '处世让一步为高，退步即进步的张本。',
    translation: '为人处世退让一步是高明的，退让正是日后进步的根基。',
    themes: ['处世', '人际', '心境'],
    wisdom: '适时的退让不是软弱，而是为未来留出空间',
    era: '明代',
  },
  {
    id: 'caigen-2',
    book: '菜根谭',
    chapter: '前集',
    originalText: '宠辱不惊，闲看庭前花开花落；去留无意，漫随天外云卷云舒。',
    translation: '受宠受辱都不惊慌，悠闲地看着庭院前花开花落；去留都不在意，随意地随着天边云卷云舒。',
    themes: ['心境', '修身', '智慧'],
    wisdom: '以超然心态看待得失起伏，保持内心安宁',
    era: '明代',
  },
  // ===== 道德经 =====
  {
    id: 'daodejing-8',
    book: '道德经',
    chapter: '第八章',
    originalText: '上善若水。水善利万物而不争，处众人之所恶，故几于道。',
    translation: '最高的善就像水一样。水善于滋润万物而不与之争抢，停留在众人厌恶的低下之处，所以最接近道。',
    themes: ['处世', '修身', '智慧'],
    wisdom: '至善之人如水般利他不争，处下谦逊而近于大道',
    era: '春秋',
  },
  {
    id: 'daodejing-64',
    book: '道德经',
    chapter: '第六十四章',
    originalText: '千里之行，始于足下。',
    translation: '千里的远行，从脚下第一步开始。',
    themes: ['事业', '修身', '智慧'],
    wisdom: '伟大的事业始于脚下一步，贵在行动与积累',
    era: '春秋',
  },
  // ===== 孙子兵法 =====
  {
    id: 'sunzi-mougong-3',
    book: '孙子兵法',
    chapter: '谋攻第三',
    originalText: '知己知彼，百战不殆；不知彼而知己，一胜一负；不知彼不知己，每战必殆。',
    translation: '了解自己也了解对手，百战都不会有危险；不了解对手但了解自己，胜负各半；既不了解对手也不了解自己，每战必败。',
    themes: ['事业', '谋略', '决策'],
    wisdom: '决策前必须充分了解自身与外部环境，知己知彼方能成事',
    era: '春秋',
  },
  {
    id: 'sunzi-mougong-1',
    book: '孙子兵法',
    chapter: '谋攻第三',
    originalText: '不战而屈人之兵，善之善者也。',
    translation: '不通过交战就能使敌军屈服，这是高明中最高明的。',
    themes: ['事业', '谋略', '智慧'],
    wisdom: '最高明的策略是以智取胜而非硬碰硬，善用柔性的力量',
    era: '春秋',
  },
  // ===== 孟子 =====
  {
    id: 'mengzi-gaosun-1',
    book: '孟子',
    chapter: '告子下',
    originalText: '天将降大任于斯人也，必先苦其心志，劳其筋骨，饿其体肤，空乏其身。',
    translation: '上天将要把重大责任降临到这个人身上，一定先使他的心志受苦，筋骨劳累，体肤饥饿，身处困乏。',
    themes: ['修身', '心境', '事业'],
    wisdom: '艰难困苦是担当大任前的磨练，逆境是成长的契机',
    era: '战国',
  },
  // ===== 本草纲目 =====
  {
    id: 'bencao-1',
    book: '本草纲目',
    chapter: '序例',
    originalText: '饮食者，人之命脉也，而营卫以之充。',
    translation: '饮食是人的命脉所在，营卫之气由此充盈。',
    themes: ['养生', '饮食', '健康'],
    wisdom: '饮食是健康的根本，合理膳食是养生第一要务',
    era: '明代',
  },
];

/** 按主题标签筛选古籍 */
export function getClassicsByTheme(theme: string): ClassicPassage[] {
  return classics.filter((c) => c.themes.includes(theme));
}

/** 按书名筛选古籍 */
export function getClassicsByBook(book: string): ClassicPassage[] {
  return classics.filter((c) => c.book === book);
}

/** 获取所有主题标签（去重） */
export function getAllThemes(): string[] {
  const themeSet = new Set<string>();
  classics.forEach((c) => c.themes.forEach((t) => themeSet.add(t)));
  return Array.from(themeSet);
}
