/**
 * 易道 App - 八卦数据
 * 包含完整的八卦详细信息
 */

const TRIGRAMS = {
  '乾': {
    name: '乾',
    symbol: '☰',
    lines: ['yang', 'yang', 'yang'],
    nature: '乾为天',
    element: '金',
    natureSymbol: '天',
    person: '父、君、君子',
    direction: '西北',
    season: '秋冬之交',
    trait: '刚健、进取、领导',
    virtue: '乾卦象征天道运行，刚健不息。君子应当效法天道，自强不息，厚德载物。在事业上宜积极进取，但需注意刚柔并济，不可过于刚硬。',
    family: '父',
    body: '首',
    animal: '马',
    color: '大赤',
    number: 1,
    hexagrams: [1, 5, 6, 10, 13, 14, 26, 33, 34, 43, 58, 61]
  },
  
  '坤': {
    name: '坤',
    symbol: '☷',
    lines: ['yin', 'yin', 'yin'],
    nature: '坤为地',
    element: '土',
    natureSymbol: '地',
    person: '母、臣、众人',
    direction: '西南',
    season: '夏秋之交',
    trait: '柔顺、包容、承载',
    virtue: '坤卦象征大地之德，厚德载物。君子应当效法大地，以柔顺包容之道行事，不争不竞，顺势而为，方能成就大事。',
    family: '母',
    body: '腹',
    animal: '牛',
    color: '黄',
    number: 2,
    hexagrams: [2, 7, 12, 15, 16, 19, 20, 23, 24, 35, 36, 46]
  },
  
  '震': {
    name: '震',
    symbol: '☳',
    lines: ['yang', 'yin', 'yin'],
    nature: '震为雷',
    element: '木',
    natureSymbol: '雷',
    person: '长男、诸侯',
    direction: '东',
    season: '春',
    trait: '震动、奋起、开创',
    virtue: '震卦象征雷动万物，惊醒沉睡。君子当把握时机，积极行动，但需谨慎行事，不可盲目冲动，动而有节方能成功。',
    family: '长男',
    body: '足',
    animal: '龙',
    color: '玄',
    number: 3,
    hexagrams: [3, 16, 21, 25, 27, 34, 40, 51, 54, 55, 62]
  },
  
  '巽': {
    name: '巽',
    symbol: '☴',
    lines: ['yin', 'yang', 'yang'],
    nature: '巽为风',
    element: '木',
    natureSymbol: '风',
    person: '长女、商人',
    direction: '东南',
    season: '春夏之交',
    trait: '柔顺、深入、传播',
    virtue: '巽卦象征风之柔顺深入，无孔不入。君子应当以柔顺之道行事，顺势而为，深入渗透，不强硬而能达成目的。',
    family: '长女',
    body: '股',
    animal: '鸡',
    color: '白',
    number: 4,
    hexagrams: [9, 18, 20, 28, 37, 42, 44, 46, 48, 50, 57, 59, 61]
  },
  
  '坎': {
    name: '坎',
    symbol: '☵',
    lines: ['yin', 'yang', 'yin'],
    nature: '坎为水',
    element: '水',
    natureSymbol: '水、雨',
    person: '中男、智者',
    direction: '北',
    season: '冬',
    trait: '险陷、流动、智慧',
    virtue: '坎卦象征水流险陷，行险而不失信。君子当在困境中保持信念，以智慧应对险难，水流不止终能突破阻碍。',
    family: '中男',
    body: '耳',
    animal: '豕',
    color: '玄',
    number: 5,
    hexagrams: [3, 5, 6, 7, 8, 13, 29, 39, 47, 48, 59, 60, 63]
  },
  
  '离': {
    name: '离',
    symbol: '☲',
    lines: ['yang', 'yin', 'yang'],
    nature: '离为火',
    element: '火',
    natureSymbol: '火、日',
    person: '中女、文人',
    direction: '南',
    season: '夏',
    trait: '光明、热情、文明',
    virtue: '离卦象征火之光明照耀。君子应当内心光明，外显文明，以热情温暖他人，但需注意火需依附方能长明，不可孤立。',
    family: '中女',
    body: '目',
    animal: '雉',
    color: '红',
    number: 6,
    hexagrams: [13, 14, 21, 22, 30, 35, 36, 37, 38, 49, 50, 55, 56]
  },
  
  '艮': {
    name: '艮',
    symbol: '☶',
    lines: ['yang', 'yin', 'yin'],
    nature: '艮为山',
    element: '土',
    natureSymbol: '山',
    person: '少男、隐士',
    direction: '东北',
    season: '冬春之交',
    trait: '静止、稳重、阻挡',
    virtue: '艮卦象征山之稳重静止。君子当知止而后有定，适可而止，不可强进。静止积蓄，等待时机，方能行稳致远。',
    family: '少男',
    body: '手',
    animal: '狗',
    color: '白',
    number: 7,
    hexagrams: [4, 18, 22, 26, 27, 31, 33, 39, 52, 53, 56, 62]
  },
  
  '兑': {
    name: '兑',
    symbol: '☱',
    lines: ['yin', 'yang', 'yang'],
    nature: '兑为泽',
    element: '金',
    natureSymbol: '泽、湖泊',
    person: '少女、歌者',
    direction: '西',
    season: '秋',
    trait: '喜悦、和谐、沟通',
    virtue: '兑卦象征泽水之和悦。君子应当以喜悦和谐之道与人交往，善于沟通，增进感情，但需注意和而不同，不可一味迎合。',
    family: '少女',
    body: '口',
    animal: '羊',
    color: '白',
    number: 8,
    hexagrams: [10, 17, 28, 31, 41, 43, 45, 47, 49, 58, 60, 61]
  }
};

// 八卦名称数组（顺序）
const TRIGRAM_NAMES = ['乾', '坤', '震', '巽', '坎', '离', '艮', '兑'];

// 导出数据
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { TRIGRAMS, TRIGRAM_NAMES };
}