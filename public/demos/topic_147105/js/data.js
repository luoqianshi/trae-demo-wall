/**
 * 数据层 - 课程数据 + 单词库 + 成就定义
 * 包含 3 个单元，每单元 5 关，共 60 个单词
 */

// 单词库（含音标、例句、emoji 图标）
const WORDS = {
  // Unit 1: 基础问候
  hello: { word: 'hello', phonetic: '/həˈloʊ/', meaning: '你好', emoji: '👋', example: 'Hello, how are you?' },
  hi: { word: 'hi', phonetic: '/haɪ/', meaning: '嗨', emoji: '🙋', example: 'Hi, nice to meet you!' },
  bye: { word: 'bye', phonetic: '/baɪ/', meaning: '再见', emoji: '👋', example: 'Bye, see you tomorrow.' },
  good: { word: 'good', phonetic: '/ɡʊd/', meaning: '好的', emoji: '👍', example: 'Good morning, teacher.' },
  I: { word: 'I', phonetic: '/aɪ/', meaning: '我', emoji: '🧑', example: 'I am a student.' },
  you: { word: 'you', phonetic: '/juː/', meaning: '你', emoji: '👉', example: 'You are my friend.' },
  am: { word: 'am', phonetic: '/æm/', meaning: '是（我）', emoji: '✅', example: 'I am happy.' },
  are: { word: 'are', phonetic: '/ɑːr/', meaning: '是（你/他们）', emoji: '✅', example: 'You are kind.' },
  name: { word: 'name', phonetic: '/neɪm/', meaning: '名字', emoji: '📛', example: 'My name is Tom.' },
  nice: { word: 'nice', phonetic: '/naɪs/', meaning: '好的/愉快', emoji: '😊', example: 'Nice to meet you.' },
  meet: { word: 'meet', phonetic: '/miːt/', meaning: '遇见', emoji: '🤝', example: 'Glad to meet you.' },
  too: { word: 'too', phonetic: '/tuː/', meaning: '也', emoji: '➕', example: 'Me too.' },
  thanks: { word: 'thanks', phonetic: '/θæŋks/', meaning: '谢谢', emoji: '🙏', example: 'Thanks for your help.' },
  please: { word: 'please', phonetic: '/pliːz/', meaning: '请', emoji: '🥺', example: 'Please sit down.' },
  sorry: { word: 'sorry', phonetic: '/ˈsɑːri/', meaning: '对不起', emoji: '😔', example: 'Sorry, I am late.' },
  yes: { word: 'yes', phonetic: '/jes/', meaning: '是', emoji: '✅', example: 'Yes, I do.' },
  no: { word: 'no', phonetic: '/noʊ/', meaning: '不', emoji: '❌', example: 'No, thank you.' },
  ok: { word: 'ok', phonetic: '/oʊˈkeɪ/', meaning: '好的', emoji: '👌', example: 'OK, let us go.' },
  great: { word: 'great', phonetic: '/ɡreɪt/', meaning: '太好了', emoji: '🎉', example: 'Great job!' },
  fine: { word: 'fine', phonetic: '/faɪn/', meaning: '很好', emoji: '😌', example: 'I am fine, thanks.' },

  // Unit 2: 家庭与人物
  mom: { word: 'mom', phonetic: '/mɑːm/', meaning: '妈妈', emoji: '👩', example: 'Mom cooks dinner.' },
  dad: { word: 'dad', phonetic: '/dæd/', meaning: '爸爸', emoji: '👨', example: 'Dad reads news.' },
  family: { word: 'family', phonetic: '/ˈfæməli/', meaning: '家庭', emoji: '👨‍👩‍👧‍👦', example: 'I love my family.' },
  home: { word: 'home', phonetic: '/hoʊm/', meaning: '家', emoji: '🏠', example: 'Welcome to my home.' },
  brother: { word: 'brother', phonetic: '/ˈbrʌðər/', meaning: '兄弟', emoji: '👦', example: 'My brother is tall.' },
  sister: { word: 'sister', phonetic: '/ˈsɪstər/', meaning: '姐妹', emoji: '👧', example: 'My sister is smart.' },
  friend: { word: 'friend', phonetic: '/frend/', meaning: '朋友', emoji: '🧑‍🤝‍🧑', example: 'She is my best friend.' },
  baby: { word: 'baby', phonetic: '/ˈbeɪbi/', meaning: '婴儿', emoji: '👶', example: 'The baby is sleeping.' },
  man: { word: 'man', phonetic: '/mæn/', meaning: '男人', emoji: '👨', example: 'That man is my teacher.' },
  woman: { word: 'woman', phonetic: '/ˈwʊmən/', meaning: '女人', emoji: '👩', example: 'The woman is a doctor.' },
  boy: { word: 'boy', phonetic: '/bɔɪ/', meaning: '男孩', emoji: '👦', example: 'The boy plays soccer.' },
  girl: { word: 'girl', phonetic: '/ɡɜːrl/', meaning: '女孩', emoji: '👧', example: 'The girl likes reading.' },
  love: { word: 'love', phonetic: '/lʌv/', meaning: '爱', emoji: '❤️', example: 'I love you.' },
  live: { word: 'live', phonetic: '/lɪv/', meaning: '居住', emoji: '🏡', example: 'I live in Beijing.' },
  happy: { word: 'happy', phonetic: '/ˈhæpi/', meaning: '快乐的', emoji: '😄', example: 'I am very happy.' },
  together: { word: 'together', phonetic: '/təˈɡeðər/', meaning: '一起', emoji: '🤝', example: 'We play together.' },

  // Unit 3: 日常食物
  apple: { word: 'apple', phonetic: '/ˈæpəl/', meaning: '苹果', emoji: '🍎', example: 'I eat an apple every day.' },
  banana: { word: 'banana', phonetic: '/bəˈnænə/', meaning: '香蕉', emoji: '🍌', example: 'The banana is yellow.' },
  bread: { word: 'bread', phonetic: '/bred/', meaning: '面包', emoji: '🍞', example: 'I have bread for breakfast.' },
  water: { word: 'water', phonetic: '/ˈwɔːtər/', meaning: '水', emoji: '💧', example: 'Please drink more water.' },
  rice: { word: 'rice', phonetic: '/raɪs/', meaning: '米饭', emoji: '🍚', example: 'I like rice.' },
  noodle: { word: 'noodle', phonetic: '/ˈnuːdəl/', meaning: '面条', emoji: '🍜', example: 'Noodle is delicious.' },
  egg: { word: 'egg', phonetic: '/eɡ/', meaning: '鸡蛋', emoji: '🥚', example: 'I eat an egg every morning.' },
  milk: { word: 'milk', phonetic: '/mɪlk/', meaning: '牛奶', emoji: '🥛', example: 'Milk is good for you.' },
  meat: { word: 'meat', phonetic: '/miːt/', meaning: '肉', emoji: '🥩', example: 'He does not eat meat.' },
  fish: { word: 'fish', phonetic: '/fɪʃ/', meaning: '鱼', emoji: '🐟', example: 'The fish is fresh.' },
  fruit: { word: 'fruit', phonetic: '/fruːt/', meaning: '水果', emoji: '🍇', example: 'Fruit is healthy.' },
  vegetable: { word: 'vegetable', phonetic: '/ˈvedʒtəbəl/', meaning: '蔬菜', emoji: '🥦', example: 'Eat more vegetables.' },
  eat: { word: 'eat', phonetic: '/iːt/', meaning: '吃', emoji: '🍽️', example: 'I eat lunch at noon.' },
  drink: { word: 'drink', phonetic: '/drɪŋk/', meaning: '喝', emoji: '🥤', example: 'Drink some tea.' },
  hungry: { word: 'hungry', phonetic: '/ˈhʌŋɡri/', meaning: '饥饿的', emoji: '😋', example: 'I am very hungry.' },
  full: { word: 'full', phonetic: '/fʊl/', meaning: '饱的', emoji: '🤰', example: 'I am full now.' }
};

// 课程结构：3 个单元，每单元 5 关
const COURSES = [
  {
    id: 1,
    title: 'Unit 1: 基础问候',
    color: '#58CC02',
    lessons: [
      { id: '1-1', unit: 1, title: '打招呼', words: ['hello', 'hi', 'bye', 'good'], type: 'normal' },
      { id: '1-2', unit: 1, title: '人称代词', words: ['I', 'you', 'am', 'are'], type: 'normal' },
      { id: '1-3', unit: 1, title: '自我介绍', words: ['name', 'nice', 'meet', 'too'], type: 'normal' },
      { id: '1-4', unit: 1, title: '礼貌用语', words: ['thanks', 'please', 'sorry', 'yes'], type: 'normal' },
      { id: '1-5', unit: 1, title: '基础复习', words: ['no', 'ok', 'great', 'fine'], type: 'review' }
    ]
  },
  {
    id: 2,
    title: 'Unit 2: 家庭与人物',
    color: '#1CB0F6',
    lessons: [
      { id: '2-1', unit: 2, title: '家庭成员', words: ['mom', 'dad', 'family', 'home'], type: 'normal' },
      { id: '2-2', unit: 2, title: '兄弟姐妹', words: ['brother', 'sister', 'friend', 'baby'], type: 'normal' },
      { id: '2-3', unit: 2, title: '人物称呼', words: ['man', 'woman', 'boy', 'girl'], type: 'normal' },
      { id: '2-4', unit: 2, title: '情感表达', words: ['love', 'live', 'happy', 'together'], type: 'normal' },
      { id: '2-5', unit: 2, title: 'Boss 挑战', words: ['mom', 'dad', 'brother', 'sister', 'man', 'woman', 'love', 'happy'], type: 'boss' }
    ]
  },
  {
    id: 3,
    title: 'Unit 3: 日常食物',
    color: '#FF9600',
    lessons: [
      { id: '3-1', unit: 3, title: '水果饮品', words: ['apple', 'banana', 'bread', 'water'], type: 'normal' },
      { id: '3-2', unit: 3, title: '主食蛋奶', words: ['rice', 'noodle', 'egg', 'milk'], type: 'normal' },
      { id: '3-3', unit: 3, title: '鱼肉蔬果', words: ['meat', 'fish', 'fruit', 'vegetable'], type: 'normal' },
      { id: '3-4', unit: 3, title: '饮食动作', words: ['eat', 'drink', 'hungry', 'full'], type: 'normal' },
      { id: '3-5', unit: 3, title: 'Boss 挑战', words: ['apple', 'banana', 'bread', 'water', 'rice', 'egg', 'fish', 'fruit'], type: 'boss' }
    ]
  }
];

// 预设头像
const AVATARS = ['🦊', '🐼', '🐯', '🦁', '🐸', '🐵', '🐰', '🐨'];

// 成就定义
const ACHIEVEMENTS = [
  { id: 'first_lesson', name: '初次学习', description: '完成第一个关卡', icon: '🎯' },
  { id: 'first_perfect', name: '完美通关', description: '获得 3 星评价', icon: '⭐' },
  { id: 'streak_3', name: '小连胜', description: '连胜 3 天', icon: '🔥' },
  { id: 'streak_7', name: '坚持不懈', description: '连胜 7 天', icon: '🏆' },
  { id: 'word_master', name: '单词达人', description: '掌握 30 个单词', icon: '📚' },
  { id: 'level_5', name: '初露锋芒', description: '达到 5 级', icon: '🎖️' },
  { id: 'combo_5', name: '连击大师', description: '5 连击', icon: '⚡' },
  { id: 'unit_1_done', name: '问候专家', description: '完成 Unit 1', icon: '💬' },
  { id: 'unit_2_done', name: '家庭达人', description: '完成 Unit 2', icon: '👨‍👩‍👧' },
  { id: 'unit_3_done', name: '美食家', description: '完成 Unit 3', icon: '🍎' }
];

// 排行榜模拟数据
const LEADERBOARD = [
  { name: 'Alex', avatar: '🦁', xp: 580, isUser: false },
  { name: 'Emma', avatar: '🐰', xp: 420, isUser: false },
  { name: 'David', avatar: '🐯', xp: 350, isUser: false },
  { name: '你', avatar: '🦊', xp: 0, isUser: true },
  { name: 'Sophia', avatar: '🐼', xp: 280, isUser: false },
  { name: 'James', avatar: '🐵', xp: 220, isUser: false },
  { name: 'Olivia', avatar: '🐸', xp: 180, isUser: false },
  { name: 'Tom', avatar: '🐨', xp: 150, isUser: false }
];

// 商店商品
const SHOP_ITEMS = [
  { id: 'heart', name: '补充生命', desc: '立即恢复 1 颗心', icon: '❤️', price: 30, type: 'heart' },
  { id: 'full_heart', name: '满血复活', desc: '恢复所有生命', icon: '💖', price: 120, type: 'full_heart' },
  { id: 'double_xp', name: '双倍 XP 卡', desc: '下关获得双倍 XP', icon: '⚡', price: 80, type: 'double_xp' },
  { id: 'streak_freeze', name: '连胜冻结', desc: '保护连胜不被打断', icon: '❄️', price: 60, type: 'streak_freeze' },
  { id: 'avatar_9', name: '独角兽头像', desc: '解锁特殊头像', icon: '🦄', price: 200, type: 'avatar', value: '🦄' },
  { id: 'avatar_10', name: '龙头像', desc: '解锁特殊头像', icon: '🐲', price: 250, type: 'avatar', value: '🐲' }
];

// 导出数据
window.APP_DATA = { WORDS, COURSES, AVATARS, ACHIEVEMENTS, LEADERBOARD, SHOP_ITEMS };
