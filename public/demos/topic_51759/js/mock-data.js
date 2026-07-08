/* ============================================================
   TRAE AI 大赛演示版 — 模拟数据
   《吃什么》Eating App Demo Data
   ============================================================ */

// ===== 菜系大师 =====
const cuisineMasters = [
  { code: 'sichuan', name: '川菜大师', icon: '🌶️', desc: '麻辣鲜香，百菜百味', color: '#E53935' },
  { code: 'cantonese', name: '粤菜大师', icon: '🥢', desc: '清鲜淡雅，食在广州', color: '#FB8C00' },
  { code: 'shandong', name: '鲁菜大师', icon: '🍜', desc: '咸鲜醇厚，宫廷遗风', color: '#D84315' },
  { code: 'jiangsu', name: '苏菜大师', icon: '🌸', desc: '精细雅致，文人菜系', color: '#EC407A' },
  { code: 'zhejiang', name: '浙菜大师', icon: '🫖', desc: '清新爽嫩，西湖韵致', color: '#26A69A' },
  { code: 'hunan', name: '湘菜大师', icon: '🔥', desc: '香辣酸爽，潇湘风味', color: '#FF7043' },
  { code: 'fujian', name: '闽菜大师', icon: '🍵', desc: '鲜香清淡，闽南风情', color: '#66BB6A' },
  { code: 'anhui', name: '徽菜大师', icon: '🏔️', desc: '重油重色，山野之味', color: '#8D6E63' },
  { code: 'beijing', name: '京菜大师', icon: '🏯', desc: '宫廷御膳，京城味道', color: '#F44336' },
  { code: 'shanghai', name: '沪菜大师', icon: '🌃', desc: '浓油赤酱，本帮风味', color: '#E91E63' },
  { code: 'dongbei', name: '东北大师', icon: '🥘', desc: '豪放量大，炖菜为王', color: '#FF5722' },
  { code: 'xibei', name: '西北大师', icon: '🐑', desc: '粗犷豪放，面食天下', color: '#795548' },
  { code: 'yungui', name: '云贵大师', icon: '🍄', desc: '酸辣奇异，菌子王国', color: '#7CB342' },
  { code: 'kejia', name: '客家大师', icon: '🏡', desc: '咸香浓郁，酿菜典范', color: '#5D4037' },
  { code: 'qingzhen', name: '清真大师', icon: '🕌', desc: '清真风味，洁净至味', color: '#43A047' },
];

// ===== 食材分类 (5大类合并) =====
const ingredientCategories = [
  { key: 'meat', label: '肉类', icon: '[肉]', apiKeys: ['meat'] },
  { key: 'seafood', label: '海鲜', icon: '[鱼]', apiKeys: ['seafood'] },
  { key: 'veg_fruit', label: '蔬果', icon: '[蔬]', apiKeys: ['vegetable', 'fruit'] },
  { key: 'mush_legume', label: '菌豆', icon: '[菌]', apiKeys: ['mushroom', 'legume', 'nut'] },
  { key: 'egg_dairy', label: '蛋奶', icon: '[蛋]', apiKeys: ['egg', 'dairy'] },
];

// ===== 食材库 (按5大类) =====
const ingredientLibrary = {
  meat: ['猪肉', '五花肉', '排骨', '牛肉', '牛腩', '羊肉', '羊排', '鸡肉', '鸡腿', '鸡胸', '鸭肉', '鹅肉', '腊肉', '香肠', '火腿', '培根', '猪蹄', '猪肚', '牛肚', '鸡翅', '鸡爪'],
  seafood: ['草鱼', '鲤鱼', '鲫鱼', '鲈鱼', '三文鱼', '金枪鱼', '虾', '基围虾', '小龙虾', '螃蟹', '大闸蟹', '扇贝', '蛤蜊', '牡蛎', '鱿鱼', '墨鱼', '海参', '鲍鱼', '带鱼', '黄鱼'],
  veg_fruit: ['白菜', '青菜', '菠菜', '生菜', '油麦菜', '韭菜', '芹菜', '豆芽', '番茄', '黄瓜', '茄子', '土豆', '萝卜', '胡萝卜', '洋葱', '青椒', '玉米', '南瓜', '冬瓜', '苦瓜', '苹果', '香蕉', '橙子', '柠檬', '草莓', '芒果', '西瓜', '葡萄', '蜜桃', '梨'],
  mush_legume: ['香菇', '金针菇', '平菇', '杏鲍菇', '木耳', '银耳', '豆腐', '豆皮', '腐竹', '豆浆', '红豆', '绿豆', '黄豆', '毛豆', '花生', '核桃', '杏仁', '腰果', '松子', '芝麻'],
  egg_dairy: ['鸡蛋', '鸭蛋', '鹌鹑蛋', '皮蛋', '咸蛋', '牛奶', '酸奶', '奶油', '黄油', '奶酪', '芝士', '炼乳', '淡奶油', '椰奶'],
};

// ===== 菜品数据 =====
const foodRankings = [
  { name: '红烧肉', score: 9.7, tag: '国民硬菜', rank: 1, desc: '肥而不腻，入口即化', image: 'red' },
  { name: '麻婆豆腐', score: 9.5, tag: '下饭神器', rank: 2, desc: '麻辣鲜香嫩烫酥', image: 'orange' },
  { name: '宫保鸡丁', score: 9.4, tag: '国宴名菜', rank: 3, desc: '糊辣荔枝味，中外驰名', image: 'yellow' },
  { name: '糖醋里脊', score: 9.3, tag: '酸甜可口', rank: 4, desc: '外酥里嫩，酸甜适中', image: 'pink' },
  { name: '水煮鱼', score: 9.2, tag: '鲜嫩麻辣', rank: 5, desc: '鱼肉嫩滑，麻辣过瘾', image: 'red' },
  { name: '回锅肉', score: 9.1, tag: '川菜之首', rank: 6, desc: '肥瘦相间，酱香浓郁', image: 'orange' },
  { name: '鱼香肉丝', score: 9.0, tag: '百搭经典', rank: 7, desc: '酸甜微辣，肉丝嫩滑', image: 'yellow' },
  { name: '东坡肉', score: 8.9, tag: '千年传承', rank: 8, desc: '酥烂如腐，色如琥珀', image: 'red' },
];

// ===== 知识库文章 =====
const knowledgeArticles = [
  { id: 1, title: '为什么说"冬吃萝卜夏吃姜"？', category: '饮食养生', readCount: 12800, summary: '中医讲究"春夏养阳，秋冬养阴"。夏天人体阳气外浮，内里反而虚寒，吃点姜可以温暖脾胃...' },
  { id: 2, title: '炒青菜怎样保持翠绿不发黄？', category: '烹饪技巧', readCount: 9500, summary: '关键三步：先焯水加盐和油锁色、大火快炒不过3分钟、出锅前淋少许明油...' },
  { id: 3, title: '味精和鸡精到底哪个更健康？', category: '饮食科普', readCount: 8700, summary: '味精的主要成分是谷氨酸钠，鸡精是在味精基础上加了核苷酸等增鲜物质，两者安全性相当...' },
  { id: 4, title: '如何挑选一颗好西瓜？', category: '食材选购', readCount: 7300, summary: '一看纹路清晰、二听声音清脆、三看瓜蒂新鲜、四摸表皮光滑。熟瓜纹路间距宽...' },
  { id: 5, title: '隔夜菜到底能不能吃？', category: '食品安全', readCount: 6800, summary: '绿叶蔬菜不宜隔夜，肉类密封冷藏后充分加热可行。关键在于存放温度和时间...' },
  { id: 6, title: '八大菜系的灵魂调味料', category: '美食文化', readCount: 6200, summary: '川菜靠豆瓣酱，粤菜靠蚝油，鲁菜靠葱姜蒜，苏菜靠糖醋...每种味道背后都有文化密码。' },
];

// ===== 厨神课堂课程 =====
const classroomCourses = [
  { id: 1, title: '刀工入门：切丝切片基本功', level: '入门', duration: '15分钟', students: 3200, icon: '🔪' },
  { id: 2, title: '火候掌控：从猛火到文火', level: '入门', duration: '20分钟', students: 2800, icon: '🔥' },
  { id: 3, title: '调味艺术：咸甜酸辣麻的平衡', level: '进阶', duration: '25分钟', students: 1900, icon: '🧂' },
  { id: 4, title: '红烧技法：从糖色到收汁', level: '进阶', duration: '30分钟', students: 2100, icon: '🍖' },
  { id: 5, title: '清蒸密码：时间和火候的精确控制', level: '进阶', duration: '18分钟', students: 1500, icon: '🐟' },
  { id: 6, title: '面点基础：从和面到醒面', level: '高级', duration: '40分钟', students: 980, icon: '🥟' },
];

// ===== 社区帖子 =====
const communityPosts = [
  { id: 1, user: '吃货小王', avatar: 'W', title: '今天第一次做红烧肉，成功！', content: '跟着大厨学了一下午，终于做出了能看的红烧肉，家人都说好吃！', likes: 238, comments: 45, time: '2小时前', tags: ['新手成长', '红烧肉'] },
  { id: 2, user: '厨房萌新', avatar: '厨', title: '晒晒我的一周便当合集', content: '上班族也能吃好的！一周不重样便当分享～', likes: 156, comments: 32, time: '5小时前', tags: ['便当', '上班族'] },
  { id: 3, user: '料理研究家', avatar: '研', title: '酱料终极指南：30种自制酱汁', content: '整理了30种经典酱汁的配方，从基础到进阶，应有尽有！', likes: 567, comments: 89, time: '昨天', tags: ['酱料', '合集'] },
];

// ===== 场景预设 =====
const scenePresets = ['家庭聚餐', '朋友小聚', '一人食', '浪漫晚餐', '深夜食堂', '减肥餐', '儿童餐', '宴客菜'];
const tastePresets = ['麻辣', '酸甜', '清淡', '浓郁', '微辣', '咸鲜'];

// ===== 一桌菜演示数据 =====
const tableDemoData = {
  dishes: [
    { name: '清蒸鲈鱼', description: '鲜嫩滑爽，原汁原味', category: '主菜', tags: ['粤菜', '清蒸'] },
    { name: '红烧肉', description: '色泽红亮，肥而不腻', category: '主菜', tags: ['本帮菜', '红烧'] },
    { name: '干煸四季豆', description: '干香微辣，下饭好菜', category: '素菜', tags: ['川菜', '干煸'] },
    { name: '番茄蛋花汤', description: '酸甜可口，经典家常', category: '汤品', tags: ['家常', '快手'] },
    { name: '凉拌黄瓜', description: '清脆爽口，开胃小菜', category: '凉菜', tags: ['开胃', '素'] },
    { name: '扬州炒饭', description: '粒粒分明，香气四溢', category: '主食', tags: ['淮扬', '炒饭'] },
  ],
};

// ===== 占卜数据 =====
const fortuneData = [
  { food: '红烧牛肉面', meaning: '今天宜大快朵颐', emoji: '🍜', color: '#E53935' },
  { food: '清蒸鲈鱼', meaning: '如鱼得水，顺风顺水', emoji: '🐟', color: '#1E88E5' },
  { food: '番茄炒蛋', meaning: '红红火火，简简单单就是福', emoji: '🍳', color: '#FB8C00' },
  { food: '抹茶蛋糕', meaning: '甜甜蜜蜜，苦尽甘来', emoji: '🍰', color: '#43A047' },
  { food: '麻辣香锅', meaning: '热情似火，今天宜社交', emoji: '🥘', color: '#E53935' },
  { food: '冰镇绿豆汤', meaning: '清凉一夏，静心养性', emoji: '🥣', color: '#26A69A' },
  { food: '烤鸭卷饼', meaning: '好运卷卷而来', emoji: '🦆', color: '#FF7043' },
  { food: '寿司拼盘', meaning: '精致生活，从每一口开始', emoji: '🍣', color: '#AB47BC' },
];

// ===== 成就列表 =====
const achievements = [
  { id: 1, name: '初次下厨', desc: '完成第一次AI菜谱生成', icon: '🍳', unlocked: true, date: '2026-06-15' },
  { id: 2, name: '百味达人', desc: '尝试过5种不同菜系', icon: '🌍', unlocked: true, date: '2026-06-20' },
  { id: 3, name: '光盘行动', desc: '连续7天记录饮食', icon: '🍽️', unlocked: true, date: '2026-06-25' },
  { id: 4, name: '厨神弟子', desc: '生成20道完整菜谱', icon: '👨‍🍳', unlocked: false, progress: '15/20' },
  { id: 5, name: '酱料大师', desc: '设计5种创意酱汁', icon: '🧪', unlocked: false, progress: '3/5' },
  { id: 6, name: '满汉全席', desc: '设计一桌6道菜以上的宴会菜单', icon: '🏯', unlocked: false },
  { id: 7, name: '知识渊博', desc: '阅读30篇饮食知识文章', icon: '📚', unlocked: false, progress: '18/30' },
  { id: 8, name: '社交达人', desc: '发布10篇社区帖子', icon: '💬', unlocked: false, progress: '4/10' },
];

// ===== 饮食记录演示 =====
const dietRecords = [
  { date: '2026-06-29', meals: [
    { type: '早餐', foods: ['牛奶燕麦', '水煮蛋', '香蕉'], calories: 420 },
    { type: '午餐', foods: ['清蒸鲈鱼', '蒜蓉西兰花', '米饭'], calories: 580 },
    { type: '晚餐', foods: ['番茄蛋花汤', '凉拌黄瓜', '杂粮饭'], calories: 350 },
  ]},
  { date: '2026-06-28', meals: [
    { type: '早餐', foods: ['豆浆', '包子x3', '苹果'], calories: 480 },
    { type: '午餐', foods: ['红烧肉', '炒青菜', '米饭'], calories: 650 },
    { type: '晚餐', foods: ['蔬菜沙拉', '鸡胸肉', '玉米'], calories: 320 },
  ]},
];

// ===== 酱料数据 =====
const saucePresets = [
  { name: '万能凉拌汁', base: '酱油', tags: ['凉拌', '万能'], desc: '生抽+醋+蒜末+香油+糖+辣椒油' },
  { name: '经典红烧汁', base: '酱油', tags: ['红烧', '经典'], desc: '老抽+生抽+冰糖+料酒+八角+桂皮' },
  { name: '蒜蓉辣椒酱', base: '辣椒', tags: ['蘸料', '川味'], desc: '蒜蓉+小米辣+生抽+醋+花椒油' },
  { name: '蜜汁烤肉酱', base: '蜂蜜', tags: ['烧烤', '甜味'], desc: '蜂蜜+生抽+蚝油+蒜末+黑胡椒' },
  { name: '日式照烧汁', base: '味醂', tags: ['日式', '照烧'], desc: '酱油+味醂+清酒+白糖+姜片' },
  { name: '泰式酸辣酱', base: '鱼露', tags: ['泰式', '酸辣'], desc: '鱼露+柠檬汁+糖+蒜+小米辣+香菜' },
];

// ===== 用户收藏 =====
const userFavorites = [
  { id: 1, type: '菜谱', name: '红烧肉经典做法', chef: '沪菜大师', time: '2026-06-20' },
  { id: 2, type: '菜谱', name: '麻婆豆腐川味正宗', chef: '川菜大师', time: '2026-06-18' },
  { id: 3, type: '文章', name: '炒青菜怎样保持翠绿？', chef: '', time: '2026-06-15' },
  { id: 4, type: '菜谱', name: '清蒸鲈鱼粤式做法', chef: '粤菜大师', time: '2026-06-12' },
  { id: 5, type: '菜谱', name: '宫保鸡丁正宗做法', chef: '川菜大师', time: '2026-06-10' },
];

// ===== 冰箱演示食材 =====
const fridgeIngredients = {
  meat: [
    { name: '五花肉', amount: '300g', date: '2026-06-28' },
    { name: '鸡胸肉', amount: '2块', date: '2026-06-27' },
  ],
  seafood: [
    { name: '虾仁', amount: '200g', date: '2026-06-26' },
  ],
  veg_fruit: [
    { name: '番茄', amount: '3个', date: '2026-06-29' },
    { name: '黄瓜', amount: '2根', date: '2026-06-28' },
    { name: '菠菜', amount: '一把', date: '2026-06-27' },
  ],
  mush_legume: [
    { name: '豆腐', amount: '1块', date: '2026-06-29' },
    { name: '香菇', amount: '5朵', date: '2026-06-28' },
  ],
  egg_dairy: [
    { name: '鸡蛋', amount: '6个', date: '2026-06-25' },
    { name: '牛奶', amount: '1L', date: '2026-06-28' },
    { name: '芝士', amount: '100g', date: '2026-06-20' },
  ],
};

// 导出到window供demo使用
if (typeof window !== 'undefined') {
  Object.assign(window, {
    cuisineMasters, ingredientCategories, ingredientLibrary,
    foodRankings, knowledgeArticles, classroomCourses, communityPosts,
    scenePresets, tastePresets, tableDemoData, fortuneData, achievements,
    dietRecords, saucePresets, userFavorites, fridgeIngredients
  });
}