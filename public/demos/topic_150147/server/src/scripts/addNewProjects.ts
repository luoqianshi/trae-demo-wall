import fs from 'fs';
import path from 'path';

const dataPath = path.join(__dirname, '..', 'data', 'tasks_v3.json');
const existing = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

const newProjects = [
  // ========== 语文素养 (chinese) ==========
  {
    title: '成语故事小剧场', category: 'chinese', difficulty: 'beginner', grade_level: '1-3', estimated_time: '40分钟',
    description: '选一个你最喜欢的成语故事（如守株待兔、画蛇添足），用四格漫画或小剧场表演的形式把它展现出来。通过这个项目，你不仅能理解成语的意思，还能锻炼表达能力和创造力。',
    requirements: '1. 选一个成语，查字典了解它的出处和意思\n2. 画出四格漫画或用积木/纸偶表演成语故事\n3. 用一段话写下这个成语的意思和用法\n4. 给家人讲一讲这个成语故事',
    reference_materials: '1. 《成语故事》绘本\n2. 推荐搜索"成语故事 动画"\n3. 成语词典',
    visual_prompt: 'Four-panel comic strip showing a Chinese idiom story, bright colors, educational illustration style, no people no characters',
    steps: [{ step: 1, title: '选成语', content: '从成语词典里选一个你喜欢的成语，查清楚它的意思和出处', image_prompt: '' }, { step: 2, title: '编故事', content: '把成语故事用自己的话写下来，注意要有开头、中间、结尾', image_prompt: '' }, { step: 3, title: '画漫画', content: '用四格漫画画出成语故事的关键情节', image_prompt: '' }, { step: 4, title: '分享展示', content: '把你的漫画展示给同学和家人，讲讲这个成语故事', image_prompt: '' }]
  },
  {
    title: '古诗配画创作', category: 'chinese', difficulty: 'beginner', grade_level: '2-5', estimated_time: '45分钟',
    description: '选一首你喜欢的古诗，用心感受诗中的画面和意境，然后为这首诗配上一幅画。通过画画，你能更深刻地理解古诗的意境，发现文字背后的美丽画面。',
    requirements: '1. 选一首古诗（如《静夜思》《咏鹅》《望庐山瀑布》）\n2. 大声朗读三遍，理解每句话的意思\n3. 在脑海中想象诗中的画面\n4. 用画笔把你想象的画面画出来\n5. 在画旁边抄写这首诗',
    reference_materials: '1. 《小学生必背古诗词75首》\n2. 推荐搜索"古诗配画 小学生"\n3. 搜索古诗朗诵音频，感受韵律',
    visual_prompt: 'A beautiful Chinese ink painting illustration of a classical poem scene, mountain landscape with moon, traditional Chinese art style, no people',
    steps: [{ step: 1, title: '选诗朗读', content: '选一首古诗，大声朗读三遍，感受节奏和韵律', image_prompt: '' }, { step: 2, title: '理解诗意', content: '查找每个字的意思，理解整首诗讲了什么', image_prompt: '' }, { step: 3, title: '想象画面', content: '闭上眼睛，想象诗中的画面——有什么颜色、什么景物', image_prompt: '' }, { step: 4, title: '动手画画', content: '用彩笔或水彩把你想象的画面画出来', image_prompt: '' }, { step: 5, title: '配诗展示', content: '在画旁抄写古诗，把作品展示出来', image_prompt: '' }]
  },
  {
    title: '汉字寻根之旅', category: 'chinese', difficulty: 'intermediate', grade_level: '3-6', estimated_time: '1小时',
    description: '你知道吗？每个汉字都有一个小故事！选一个你感兴趣的汉字，追溯它从甲骨文到现代汉字的演变过程。你会发现，汉字就像一幅幅小画，藏着祖先的智慧。',
    requirements: '1. 选一个汉字（如日、月、山、水、人、马）\n2. 查找这个字从甲骨文→金文→篆书→隶书→楷书的变化\n3. 画出每个阶段的样子\n4. 写下这个字的含义和你的发现\n5. 做成一张"汉字演变海报"',
    reference_materials: '1. 《汉字的故事》绘本\n2. 搜索"甲骨文 对照表"\n3. 推荐《汉字宫》动画片',
    visual_prompt: 'Chinese character evolution chart from oracle bone script to modern, educational poster design, clean layout, no people',
    steps: [{ step: 1, title: '选字', content: '选一个你觉得有趣的汉字，比如"日""月""山""水"', image_prompt: '' }, { step: 2, title: '查演变', content: '在书上或网上查找这个字从甲骨文到现在的变化', image_prompt: '' }, { step: 3, title: '画演变', content: '用笔画出每个阶段的字形，注意变化规律', image_prompt: '' }, { step: 4, title: '做海报', content: '把画好的演变过程贴在纸上，做成一张海报', image_prompt: '' }]
  },
  {
    title: '寓言故事新编', category: 'chinese', difficulty: 'intermediate', grade_level: '2-5', estimated_time: '50分钟',
    description: '龟兔赛跑、乌鸦喝水、狐假虎威……这些寓言故事你都听过吗？如果让你改编一个结局，会是什么样子呢？发挥你的想象力，给一个经典寓言故事写一个新的结局！',
    requirements: '1. 选一个你熟悉的寓言故事\n2. 读一遍原故事，理解寓言的道理\n3. 发挥想象，改写一个不同的结局\n4. 为你的新故事画插图\n5. 给你的新故事起一个有趣的标题',
    reference_materials: '1. 《伊索寓言》《中国古代寓言》\n2. 寓言故事动画片\n3. 思考：原故事想告诉我们什么道理？',
    visual_prompt: 'Colorful illustration of a fable story scene, open book with animals, whimsical style, no people',
    steps: [{ step: 1, title: '选寓言', content: '选一个你熟悉的寓言故事，再仔细读一遍', image_prompt: '' }, { step: 2, title: '想新结局', content: '如果故事里的角色做了不同的选择，会发生什么？', image_prompt: '' }, { step: 3, title: '写新故事', content: '用300-500字写出你的新版本寓言', image_prompt: '' }, { step: 4, title: '配插画', content: '为你的新故事画2-3幅插图', image_prompt: '' }]
  },
  {
    title: '小小书法家', category: 'chinese', difficulty: 'beginner', grade_level: '1-3', estimated_time: '40分钟',
    description: '拿起毛笔，蘸上墨汁，在宣纸上写下一个漂亮的汉字。书法是中国传统文化中最美的艺术之一，每一笔都充满了力量与美感。从最简单的"一"字开始，开启你的书法之旅。',
    requirements: '1. 准备毛笔、墨汁、宣纸（或毛边纸）\n2. 学习正确的握笔姿势（五指执笔法）\n3. 练习基本笔画：横、竖、撇、捺、点\n4. 临摹一个简单的字，如"大""人""山"\n5. 选出最满意的一幅，请家人点评',
    reference_materials: '1. 书法入门教程视频\n2. 推荐搜索"毛笔字入门 基本笔画"\n3. 字帖推荐：《颜真卿多宝塔碑》',
    visual_prompt: 'Chinese calligraphy tools on a wooden desk, brush, ink stone, rice paper, traditional art supplies, clean composition, no people',
    steps: [{ step: 1, title: '准备工具', content: '准备毛笔、墨汁、宣纸、砚台、毛毡', image_prompt: '' }, { step: 2, title: '学握笔', content: '学习正确的握笔姿势，手指自然放松', image_prompt: '' }, { step: 3, title: '练笔画', content: '练习横、竖、撇、捺、点五个基本笔画', image_prompt: '' }, { step: 4, title: '写作品', content: '选一个简单的字临摹，反复练习', image_prompt: '' }]
  },
  {
    title: '我的第一本日记', category: 'chinese', difficulty: 'beginner', grade_level: '1-3', estimated_time: '每天10分钟×7天',
    description: '日记是记录生活最好的方式。从今天开始，连续一周每天写一篇日记，记录你的所见所闻、所思所想。你会发现，写作就像和朋友聊天一样自然。',
    requirements: '1. 准备一个笔记本作为日记本\n2. 每天写一篇日记，记录发生了什么有趣的事\n3. 每篇日记至少写3句话\n4. 可以配上简单的图画\n5. 一周后回顾，看看自己记录了哪些美好瞬间',
    reference_materials: '1. 《蚯蚓的日记》绘本\n2. 日记格式：日期、天气、正文\n3. 可以写：今天做了什么、吃了什么、和谁玩了',
    visual_prompt: 'A colorful notebook with handwritten diary entries, small doodles, pen and pencil, warm cozy desk setting, no people',
    steps: [{ step: 1, title: '准备日记本', content: '找一个漂亮的笔记本，在第一页写上你的名字', image_prompt: '' }, { step: 2, title: '学格式', content: '每篇日记要写日期、天气，然后写正文', image_prompt: '' }, { step: 3, title: '写日记', content: '每天写一篇，记录今天发生的趣事', image_prompt: '' }, { step: 4, title: '回顾', content: '一周后读一读自己的日记，选出最满意的一篇', image_prompt: '' }]
  },
  {
    title: '绕口令大挑战', category: 'chinese', difficulty: 'beginner', grade_level: '1-3', estimated_time: '30分钟',
    description: '"四是四，十是十，十四是十四，四十是四十"——你能说清楚吗？绕口令不仅好玩，还能锻炼你的口齿伶俐度。选几个绕口令，练习到流利说出来，然后录下来听听自己有多厉害！',
    requirements: '1. 收集3-5个绕口令（如吃葡萄不吐葡萄皮）\n2. 先慢慢读，再逐渐加快速度\n3. 练习到能流利说出\n4. 用手机录下来，听听自己说得怎么样\n5. 挑战家人朋友，看谁说得更快更准',
    reference_materials: '1. 搜索"儿童绕口令大全"\n2. 推荐绕口令：吃葡萄不吐葡萄皮、四是四、八百标兵\n3. 绕口令比赛视频',
    visual_prompt: 'Colorful speech bubbles with Chinese tongue twisters text, playful typography design, bright colors, no people',
    steps: [{ step: 1, title: '收集', content: '收集3-5个有趣的绕口令，抄写下来', image_prompt: '' }, { step: 2, title: '慢读', content: '先一个字一个字慢慢读清楚', image_prompt: '' }, { step: 3, title: '加速', content: '逐渐加快速度，直到能流利说出', image_prompt: '' }, { step: 4, title: '录制', content: '用手机录下你说的绕口令，听听效果', image_prompt: '' }]
  },
  {
    title: '童谣创编小达人', category: 'chinese', difficulty: 'beginner', grade_level: '1-3', estimated_time: '35分钟',
    description: '童谣是童年最美的声音。你听过"小老鼠，上灯台"吗？现在轮到你创作一首属于自己的童谣了！选择你喜欢的主题，用简单押韵的句子，创编一首童谣。',
    requirements: '1. 选一个主题：动物、食物、玩具、家人、大自然\n2. 写4-6句押韵的句子\n3. 每句的字数尽量相似\n4. 配上简单的图画\n5. 大声朗读你的童谣，感受韵律',
    reference_materials: '1. 《中国童谣》绘本\n2. 经典童谣：小老鼠上灯台、小白兔白又白\n3. 押韵技巧：末尾字音相同或相似',
    visual_prompt: 'Colorful nursery rhyme illustration with musical notes, playful animals, bright pastel colors, cheerful design, no people',
    steps: [{ step: 1, title: '听童谣', content: '听几首经典童谣，感受节奏和韵律', image_prompt: '' }, { step: 2, title: '选主题', content: '选一个你想写的主题，比如动物、食物', image_prompt: '' }, { step: 3, title: '写句子', content: '写4-6句押韵的句子，每句字数差不多', image_prompt: '' }, { step: 4, title: '配图朗读', content: '为童谣配画，大声朗读出来', image_prompt: '' }]
  },

  // ========== 数学思维 (math) ==========
  {
    title: '生活中的对称图形', category: 'math', difficulty: 'beginner', grade_level: '1-3', estimated_time: '30分钟',
    description: '对称是数学中一个重要的概念，它就在我们身边：蝴蝶的翅膀、树叶的形状、建筑物的窗户……用你的手机或相机，去发现和拍摄生活中的对称图形吧！',
    requirements: '1. 了解什么是对称（对折后两边完全重合）\n2. 在家或学校寻找10个对称的物品\n3. 拍照或画下来\n4. 标注出对称轴（中间那条线）\n5. 做成一张"对称图形大发现"海报',
    reference_materials: '1. 搜索"生活中的对称图形"\n2. 对称剪纸教程\n3. 镜子实验：用镜子观察对称',
    visual_prompt: 'Collection of symmetrical objects in nature and daily life, butterfly wings, leaves, geometric shapes, educational poster, no people',
    steps: [{ step: 1, title: '学对称', content: '用纸对折理解对称的概念，找到对称轴', image_prompt: '' }, { step: 2, title: '找对称', content: '在生活中寻找10个对称的物品并拍照', image_prompt: '' }, { step: 3, title: '标对称轴', content: '在每张照片上画出对称轴', image_prompt: '' }, { step: 4, title: '做海报', content: '把照片整理成一张"对称图形大发现"海报', image_prompt: '' }]
  },
  {
    title: '趣味七巧板挑战', category: 'math', difficulty: 'beginner', grade_level: '1-3', estimated_time: '40分钟',
    description: '七巧板是中国古老的益智玩具，用7块板你可以拼出成百上千种图案——动物、人物、房子、数字……发挥你的空间想象力，挑战拼出最多的图案！',
    requirements: '1. 准备一副七巧板（或自己用硬纸板剪）\n2. 认识七巧板的7块板：5个三角形、1个正方形、1个平行四边形\n3. 尝试拼出10种不同的图案\n4. 拍照记录每个图案\n5. 挑战最难的一个：拼出所有7块组成的正方形',
    reference_materials: '1. 搜索"七巧板图案大全"\n2. 七巧板拼图技巧\n3. 七巧板在线游戏',
    visual_prompt: 'Colorful tangram puzzle pieces arranged in various shapes, animals and objects made from geometric shapes, educational toy, no people',
    steps: [{ step: 1, title: '做七巧板', content: '用硬纸板剪出7块七巧板', image_prompt: '' }, { step: 2, title: '认板', content: '认识5个三角形、1个正方形、1个平行四边形', image_prompt: '' }, { step: 3, title: '拼图案', content: '尝试拼出10种不同的图案并拍照', image_prompt: '' }, { step: 4, title: '终极挑战', content: '挑战把7块板拼回一个正方形', image_prompt: '' }]
  },
  {
    title: '统计调查小能手', category: 'math', difficulty: 'intermediate', grade_level: '2-5', estimated_time: '1小时',
    description: '你知道班上同学最喜欢什么颜色吗？最喜欢什么水果？做一个统计调查，收集数据，然后画成好看的统计图（柱状图、饼图），你就是一个小小统计学家！',
    requirements: '1. 设计一个调查问题（如：你最喜欢什么颜色？）\n2. 调查至少10个人并记录数据\n3. 统计数据，制作统计表\n4. 画出柱状图或饼图\n5. 写出你的发现——哪个最多？哪个最少？',
    reference_materials: '1. 搜索"小学生统计图 制作"\n2. 统计三要素：调查问题、收集数据、分析结果\n3. 柱状图 vs 饼图的选择',
    visual_prompt: 'Colorful bar chart and pie chart on paper, survey data visualization, educational math illustration, clean design, no people',
    steps: [{ step: 1, title: '设计问题', content: '想一个有趣的调查问题，比如"你最喜欢什么水果？"', image_prompt: '' }, { step: 2, title: '调查', content: '至少调查10个人，记录他们的回答', image_prompt: '' }, { step: 3, title: '统计', content: '数一数每种答案有多少人，做成统计表', image_prompt: '' }, { step: 4, title: '画图', content: '画出柱状图或饼图来展示你的数据', image_prompt: '' }, { step: 5, title: '写结论', content: '发现了什么？哪种最多？哪种最少？', image_prompt: '' }]
  },
  {
    title: '测量身边的世界', category: 'math', difficulty: 'beginner', grade_level: '1-3', estimated_time: '30分钟',
    description: '你的课桌有多长？书本有多宽？铅笔有多长？拿起尺子，测量你身边的各种物品，记录它们的长度、宽度、高度，制作一张"测量记录表"。',
    requirements: '1. 准备一把尺子（厘米刻度）\n2. 测量10件物品的长、宽、高\n3. 记录测量结果（单位：厘米）\n4. 按长度从短到长排序\n5. 比较：最长的物品和最短的相差多少？',
    reference_materials: '1. 认识长度单位：毫米、厘米、米\n2. 尺子的正确使用方法\n3. 估计与实测的对比',
    visual_prompt: 'Ruler and measuring tape next to various school supplies, notebook with measurement records, educational setting, no people',
    steps: [{ step: 1, title: '认识尺子', content: '认识厘米和毫米，学会正确使用尺子', image_prompt: '' }, { step: 2, title: '测量', content: '测量10件物品的长、宽、高并记录', image_prompt: '' }, { step: 3, title: '排序', content: '把测量的物品按长度从短到长排列', image_prompt: '' }, { step: 4, title: '比较', content: '计算最长和最短的物品差多少', image_prompt: '' }]
  },
  {
    title: '分数披萨店', category: 'math', difficulty: 'intermediate', grade_level: '2-5', estimated_time: '40分钟',
    description: '分数是什么意思？1/2、1/4、3/4……这些数字怎么理解？用圆形纸片当做"披萨"，切一切、分一分，把抽象的分数变成看得见摸得着的东西。',
    requirements: '1. 准备3张圆形纸片（当披萨）\n2. 把第一个圆对折一次，得到1/2\n3. 把第二个圆对折两次，得到1/4\n4. 把第三个圆分成8等份，理解1/8、3/8等\n5. 用分数表示：你吃了披萨的几分之几？',
    reference_materials: '1. 搜索"分数启蒙 披萨"\n2. 分数绘本推荐：《分数真好玩》\n3. 分子、分母的含义',
    visual_prompt: 'Colorful paper pizza divided into fractional slices, 1/2 1/4 1/8 visual demonstration, educational math toy, no people',
    steps: [{ step: 1, title: '做披萨', content: '用3张圆形纸片当做披萨，涂上颜色', image_prompt: '' }, { step: 2, title: '认识1/2', content: '把第一个圆对折成两半，理解1/2', image_prompt: '' }, { step: 3, title: '认识1/4', content: '把第二个圆对折两次成四等份', image_prompt: '' }, { step: 4, title: '认识1/8', content: '把第三个圆分成8等份，理解更多分数', image_prompt: '' }]
  },
  {
    title: '购物小达人', category: 'math', difficulty: 'beginner', grade_level: '1-3', estimated_time: '30分钟',
    description: '如果你有10元钱，去超市能买什么？在这个模拟购物游戏中，学习计算总价、找零和预算管理。数学就在我们的日常生活中！',
    requirements: '1. 准备一些物品标签（写上价格）\n2. 你有10元预算，选择想买的物品\n3. 计算总价：把所有选中的物品价格加起来\n4. 计算找零：10元减去总价\n5. 试试不同的组合，看最多能买几样东西',
    reference_materials: '1. 认识人民币面额：1元、5元、10元、20元\n2. 加法在实际生活中的应用\n3. 预算的概念',
    visual_prompt: 'Toy cash register with play money and price tags, shopping cart with items, educational math game, no people',
    steps: [{ step: 1, title: '准备物品', content: '准备5-10件物品，贴上价格标签', image_prompt: '' }, { step: 2, title: '规划预算', content: '你有10元预算，选择想买的物品', image_prompt: '' }, { step: 3, title: '计算总价', content: '把选中物品的价格加起来', image_prompt: '' }, { step: 4, title: '算找零', content: '10元减去总价，算出找零', image_prompt: '' }]
  },
  {
    title: '时间管理员', category: 'math', difficulty: 'beginner', grade_level: '1-3', estimated_time: '每天5分钟×3天',
    description: '一天24小时，你是怎么度过的？睡觉、吃饭、上学、玩耍各用了多少时间？记录你一天的时间安排，画成时间饼图，看看你的时间都去哪儿了。',
    requirements: '1. 记录一天中每个活动的时间（小时）\n2. 分类：睡觉、学习、吃饭、玩耍、其他\n3. 计算每个类别占24小时的几分之几\n4. 画一个圆形时间饼图\n5. 思考：你的时间分配合理吗？',
    reference_materials: '1. 认识钟表：时针、分针\n2. 24小时制\n3. 时间管理的重要性',
    visual_prompt: 'Colorful 24-hour clock pie chart divided into sleep study play eat sections, time management illustration, educational, no people',
    steps: [{ step: 1, title: '记录', content: '记录一天中每个活动用了多少小时', image_prompt: '' }, { step: 2, title: '分类', content: '把活动分成睡觉、学习、吃饭、玩耍等类别', image_prompt: '' }, { step: 3, title: '计算', content: '计算每个类别占24小时的几分之几', image_prompt: '' }, { step: 4, title: '画饼图', content: '画一个圆形时间饼图展示你的时间分配', image_prompt: '' }]
  },
  {
    title: '趣味数独挑战', category: 'math', difficulty: 'intermediate', grade_level: '3-6', estimated_time: '40分钟',
    description: '数独是一种风靡全球的逻辑填数游戏。在9×9的格子中，每行、每列、每个小九宫格中都要填入1-9，不能重复。从简单的4×4数独开始，逐步挑战更难的！',
    requirements: '1. 了解数独规则\n2. 完成3个4×4的简单数独\n3. 挑战1个6×6的中等数独\n4. 尝试1个9×9的标准数独\n5. 自己设计一个4×4数独给朋友挑战',
    reference_materials: '1. 搜索"儿童数独入门"\n2. 数独技巧：唯一法、排除法\n3. 可打印的数独题目',
    visual_prompt: 'Sudoku puzzle grid with numbers, pencil and eraser, logic puzzle game, educational math illustration, no people',
    steps: [{ step: 1, title: '学规则', content: '学习数独的基本规则：每行每列每个宫不重复', image_prompt: '' }, { step: 2, title: '练4×4', content: '完成3个4×4的简单数独', image_prompt: '' }, { step: 3, title: '挑战6×6', content: '挑战1个6×6的中等难度数独', image_prompt: '' }, { step: 4, title: '冲击9×9', content: '尝试1个标准9×9数独', image_prompt: '' }]
  },

  // ========== 英语启蒙 (english) ==========
  {
    title: '英语绘本小读者', category: 'english', difficulty: 'beginner', grade_level: '1-3', estimated_time: '30分钟',
    description: '翻开一本英语绘本，走进一个充满色彩和故事的世界。即使有些单词不认识也没关系，图画会帮你理解故事。读完绘本后，画出你最喜欢的情节。',
    requirements: '1. 选一本英语绘本（如Brown Bear、The Very Hungry Caterpillar）\n2. 先看图画，猜猜故事在讲什么\n3. 读文字，遇到不认识的词可以猜或查字典\n4. 画出你最喜欢的一页\n5. 用英语说出3个你学到的新单词',
    reference_materials: '1. 推荐英语绘本：Brown Bear, Brown Bear, What Do You See?\n2. The Very Hungry Caterpillar\n3. 英语绘本朗读视频',
    visual_prompt: 'Colorful English picture book open on a desk, bright illustrations, children book with animals, cozy reading nook, no people',
    steps: [{ step: 1, title: '选绘本', content: '选一本英语绘本，先看图画猜故事', image_prompt: '' }, { step: 2, title: '读故事', content: '读文字，遇到生词试着猜或查字典', image_prompt: '' }, { step: 3, title: '画情节', content: '画出你最喜欢的一页', image_prompt: '' }, { step: 4, title: '学单词', content: '写下3个新学到的英语单词和它们的意思', image_prompt: '' }]
  },
  {
    title: '字母创意画', category: 'english', difficulty: 'beginner', grade_level: '1-3', estimated_time: '40分钟',
    description: 'A is for Apple, B is for Ball……每个字母都代表一个单词。发挥你的创意，把26个字母变成有趣的图画：A变成苹果，B变成蝴蝶，C变成猫……让字母学习变得好玩！',
    requirements: '1. 选5个你最喜欢的字母\n2. 每个字母想一个以它开头的英语单词\n3. 把字母"变"成那个单词的图画\n4. 在画旁边写上字母和单词\n5. 做一个字母创意画展示',
    reference_materials: '1. 英语字母表（26个字母大小写）\n2. 搜索"字母创意画"\n3. 单词参考：A-Apple, B-Bee, C-Cat, D-Dog, E-Egg',
    visual_prompt: 'Creative alphabet letter art, letter A shaped like an apple, letter B like a butterfly, colorful educational illustration, no people',
    steps: [{ step: 1, title: '选字母', content: '选5个你最喜欢的字母', image_prompt: '' }, { step: 2, title: '想单词', content: '每个字母想一个以它开头的英语单词', image_prompt: '' }, { step: 3, title: '创意画', content: '把每个字母画成对应单词的图形', image_prompt: '' }, { step: 4, title: '展示', content: '标注字母和单词，做成展示板', image_prompt: '' }]
  },
  {
    title: '英语歌曲小歌手', category: 'english', difficulty: 'beginner', grade_level: '1-3', estimated_time: '30分钟',
    description: '学英语最好的方式之一就是唱英语歌！选一首简单的英语儿歌，跟着音乐一起唱，在快乐的旋律中自然学会英语单词和句子。',
    requirements: '1. 选一首英语儿歌（如Twinkle Twinkle Little Star）\n2. 听3遍，跟着哼唱\n3. 查找歌词中的生词意思\n4. 练习到能完整唱出来\n5. 录下你的演唱，或给家人表演',
    reference_materials: '1. 推荐歌曲：Twinkle Twinkle Little Star\n2. ABC Song, Old MacDonald Had a Farm\n3. 搜索"英语儿歌 带歌词"',
    visual_prompt: 'Colorful musical notes and English song lyrics, microphone and headphones, music education illustration, no people',
    steps: [{ step: 1, title: '选歌', content: '选一首简单的英语儿歌', image_prompt: '' }, { step: 2, title: '听歌', content: '听3遍，跟着音乐哼唱', image_prompt: '' }, { step: 3, title: '学歌词', content: '查歌词里的生词，理解意思', image_prompt: '' }, { step: 4, title: '表演', content: '完整唱出来并录音或表演给家人看', image_prompt: '' }]
  },
  {
    title: '我的英语自我介绍', category: 'english', difficulty: 'beginner', grade_level: '2-5', estimated_time: '35分钟',
    description: '用英语介绍自己——这是你走向世界的第一步！学会用简单的英语句子说你的名字、年龄、爱好和喜欢的食物。录一段视频，看看你的英语有多棒！',
    requirements: '1. 学习自我介绍句型：My name is... I am... years old. I like...\n2. 写一段5-8句的英文自我介绍\n3. 练习朗读，注意发音\n4. 录制一段自我介绍视频\n5. 看视频，找出可以改进的地方',
    reference_materials: '1. 自我介绍句型模板\n2. 搜索"English self introduction for kids"\n3. 发音练习工具',
    visual_prompt: 'Speech bubble with English self introduction text, Hello my name is, colorful name tag design, no people',
    steps: [{ step: 1, title: '学句型', content: '学习自我介绍的基本句型', image_prompt: '' }, { step: 2, title: '写稿', content: '写一段5-8句的英文自我介绍', image_prompt: '' }, { step: 3, title: '练习', content: '反复练习朗读，注意发音和流利度', image_prompt: '' }, { step: 4, title: '录制', content: '录一段自我介绍视频，看看效果如何', image_prompt: '' }]
  },
  {
    title: '英语单词卡片DIY', category: 'english', difficulty: 'beginner', grade_level: '1-3', estimated_time: '40分钟',
    description: '制作50张英语单词卡片（flashcards），一面写英文，一面画图或写中文意思。每天抽几张复习，你会发现英语单词越记越牢！',
    requirements: '1. 准备50张小卡片（硬纸板或便签纸）\n2. 选50个常用英语单词（如颜色、动物、食物）\n3. 正面写英文单词，背面画图或写中文\n4. 每天抽10张复习\n5. 和同学玩"看单词说意思"的游戏',
    reference_materials: '1. 小学英语常用词汇表\n2. 单词分类：颜色、动物、食物、身体、数字\n3. 闪卡记忆法',
    visual_prompt: 'Stack of colorful English vocabulary flashcards, apple cat dog words with drawings, educational learning tool, no people',
    steps: [{ step: 1, title: '准备卡片', content: '准备50张小卡片', image_prompt: '' }, { step: 2, title: '选单词', content: '选50个常用英语单词，分5个类别', image_prompt: '' }, { step: 3, title: '制作', content: '正面写英文，背面画图或写中文', image_prompt: '' }, { step: 4, title: '复习', content: '每天随机抽10张复习，用闪卡记忆法', image_prompt: '' }]
  },
  {
    title: '英语情景对话', category: 'english', difficulty: 'intermediate', grade_level: '3-6', estimated_time: '40分钟',
    description: '在餐厅怎么点餐？在商店怎么买东西？在街上怎么问路？和同学一起模拟这些真实场景，练习英语对话。生活会话是学英语最实用的部分！',
    requirements: '1. 选一个场景：餐厅点餐、商店购物、问路\n2. 编写一段3-4轮的英语对话\n3. 和同学分配角色\n4. 练习对话，注意语调和表情\n5. 表演给全班同学看',
    reference_materials: '1. 搜索"English conversation for kids"\n2. 餐厅用语：Can I have...? How much is...?\n3. 问路用语：Excuse me, where is...?',
    visual_prompt: 'Restaurant menu and shopping scene with English dialogue bubbles, role play props, educational, no people',
    steps: [{ step: 1, title: '选场景', content: '选一个场景：餐厅、商店、问路', image_prompt: '' }, { step: 2, title: '写对话', content: '编写3-4轮英语对话', image_prompt: '' }, { step: 3, title: '分角色', content: '和同学分配角色，练习对话', image_prompt: '' }, { step: 4, title: '表演', content: '在同学面前表演你的英语对话', image_prompt: '' }]
  },
  {
    title: '英语国家文化探索', category: 'english', difficulty: 'intermediate', grade_level: '3-6', estimated_time: '1小时',
    description: '英语不只是语言，还是了解世界的窗口。选一个英语国家（英国、美国、澳大利亚、加拿大），研究它的国旗、传统食物、著名节日和有趣的文化习俗。',
    requirements: '1. 选一个英语国家\n2. 研究：国旗、首都、传统食物、著名节日\n3. 用英语写5个关于这个国家的句子\n4. 画一幅这个国家的特色画\n5. 做成一张"英语国家文化海报"',
    reference_materials: '1. 搜索引擎查资料\n2. 英语国家：UK, USA, Australia, Canada, New Zealand\n3. 关键词：flag, capital, food, festival, famous place',
    visual_prompt: 'World map highlighting English speaking countries, flags of UK USA Australia, cultural symbols, educational poster, no people',
    steps: [{ step: 1, title: '选国家', content: '选一个英语国家', image_prompt: '' }, { step: 2, title: '研究', content: '研究国旗、首都、食物、节日', image_prompt: '' }, { step: 3, title: '写英语', content: '用英语写5个关于这个国家的句子', image_prompt: '' }, { step: 4, title: '做海报', content: '画一幅画，做成文化海报', image_prompt: '' }]
  },

  // ========== 历史探秘 (history) ==========
  {
    title: '恐龙时代探秘', category: 'history', difficulty: 'beginner', grade_level: '1-3', estimated_time: '45分钟',
    description: '在很久很久以前，地球上生活着巨大的恐龙！它们长什么样？吃什么？为什么会灭绝？通过研究恐龙，了解地球遥远的历史。',
    requirements: '1. 认识5种恐龙：霸王龙、三角龙、剑龙、翼龙、腕龙\n2. 了解它们吃什么（肉食/草食）\n3. 研究恐龙灭绝的原因\n4. 画一幅恐龙时代场景画\n5. 做一个恐龙档案卡',
    reference_materials: '1. 《恐龙百科全书》\n2. 搜索"恐龙种类"\n3. 恐龙灭绝假说：陨石撞击说',
    visual_prompt: 'Various dinosaur species in prehistoric landscape, T-Rex triceratops stegosaurus, educational natural history illustration, no people',
    steps: [{ step: 1, title: '认恐龙', content: '认识5种恐龙，了解它们的特征', image_prompt: '' }, { step: 2, title: '分食性', content: '区分肉食和草食恐龙', image_prompt: '' }, { step: 3, title: '探灭绝', content: '研究恐龙灭绝的原因', image_prompt: '' }, { step: 4, title: '画场景', content: '画一幅恐龙时代场景画', image_prompt: '' }]
  },
  {
    title: '秦始皇兵马俑', category: 'history', difficulty: 'intermediate', grade_level: '3-6', estimated_time: '1小时',
    description: '中国第一个皇帝秦始皇，在地下埋藏了一支庞大的军队——兵马俑。每个兵马俑的面孔都不同！了解秦始皇和兵马俑的故事，制作一个"兵马俑档案"。',
    requirements: '1. 了解秦始皇是谁，他统一了什么\n2. 研究兵马俑的发现过程\n3. 了解兵马俑的制作工艺\n4. 画一个兵马俑的画像\n5. 写一段参观兵马俑的"导游词"',
    reference_materials: '1. 《秦始皇兵马俑》纪录片\n2. 搜索"兵马俑 小学生"\n3. 秦始皇统一：文字、货币、度量衡',
    visual_prompt: 'Terracotta warriors in rows, ancient Chinese army statues, historical archaeological site, museum display, no people',
    steps: [{ step: 1, title: '知秦始皇', content: '了解秦始皇和他的统一功绩', image_prompt: '' }, { step: 2, title: '探兵马俑', content: '研究兵马俑的发现和规模', image_prompt: '' }, { step: 3, title: '画兵马俑', content: '画一个兵马俑的画像', image_prompt: '' }, { step: 4, title: '写导游词', content: '写一段兵马俑的导游介绍词', image_prompt: '' }]
  },
  {
    title: '长城的故事', category: 'history', difficulty: 'intermediate', grade_level: '3-6', estimated_time: '1小时',
    description: '长城是世界上最长的建筑，在太空中都能看到它！但长城是谁建的？为什么要建？建了多久？探索长城的历史，了解这座伟大建筑背后的故事。',
    requirements: '1. 了解长城的总长度和历史（2000多年）\n2. 研究秦始皇为什么修长城\n3. 了解长城的主要关隘：山海关、居庸关、嘉峪关\n4. 用积木或纸板制作一段长城模型\n5. 写一段"假如我站在长城上"的感想',
    reference_materials: '1. 《长城》纪录片\n2. 搜索"长城 历史 小学生"\n3. 孟姜女哭长城的故事',
    visual_prompt: 'The Great Wall of China winding across mountain ridges, ancient stone fortification, historical landmark, no people',
    steps: [{ step: 1, title: '知长城', content: '了解长城的长度和历史', image_prompt: '' }, { step: 2, title: '探原因', content: '研究秦始皇为什么修长城', image_prompt: '' }, { step: 3, title: '做模型', content: '用积木或纸板做一段长城模型', image_prompt: '' }, { step: 4, title: '写感想', content: '写一段"假如我站在长城上"', image_prompt: '' }]
  },
  {
    title: '历史名人小传', category: 'history', difficulty: 'intermediate', grade_level: '3-6', estimated_time: '1小时',
    description: '中国历史上有许多伟大的人物：孔子、诸葛亮、岳飞、郑成功……选一位你感兴趣的历史名人，研究他的生平事迹，制作一张"历史名人海报"。',
    requirements: '1. 选一位中国历史名人\n2. 研究他的生平：出生、重要事迹、成就\n3. 写一篇200字的人物小传\n4. 画出他的肖像或代表场景\n5. 总结：他为什么值得被记住？',
    reference_materials: '1. 《中华历史名人故事》\n2. 推荐人物：孔子、诸葛亮、岳飞、李白、郑和\n3. 搜索"历史名人 小学生"',
    visual_prompt: 'Chinese historical figure portrait in traditional ink painting style, ancient scholar with scroll, historical illustration, no people visible face',
    steps: [{ step: 1, title: '选人物', content: '选一位中国历史名人', image_prompt: '' }, { step: 2, title: '查生平', content: '研究他的出生、重要事迹和成就', image_prompt: '' }, { step: 3, title: '写小传', content: '写一篇200字的人物小传', image_prompt: '' }, { step: 4, title: '做海报', content: '画肖像，制作人物海报', image_prompt: '' }]
  },
  {
    title: '郑和下西洋', category: 'history', difficulty: 'intermediate', grade_level: '3-6', estimated_time: '1小时',
    description: '600多年前，中国航海家郑和率领庞大的船队七次远航，到达了东南亚、印度、非洲东海岸！比哥伦布发现新大陆还早近100年。画出郑和的航海路线，了解这段伟大的航海历史。',
    requirements: '1. 了解郑和是谁，他为什么下西洋\n2. 了解郑和宝船的规模（比足球场还大）\n3. 在地图上画出郑和的航海路线\n4. 研究郑和带去了什么、带回了什么\n5. 制作一张"郑和航海图"',
    reference_materials: '1. 《郑和下西洋》纪录片\n2. 搜索"郑和航海路线图"\n3. 郑和宝船：长约125米，宽约50米',
    visual_prompt: 'Ancient Chinese treasure ship sailing on ocean, Ming dynasty fleet, historical maritime illustration, map background, no people',
    steps: [{ step: 1, title: '知郑和', content: '了解郑和和七下西洋的背景', image_prompt: '' }, { step: 2, title: '探宝船', content: '了解郑和宝船的惊人规模', image_prompt: '' }, { step: 3, title: '画路线', content: '在地图上画出郑和的航海路线', image_prompt: '' }, { step: 4, title: '做航海图', content: '制作一张"郑和航海图"', image_prompt: '' }]
  },
  {
    title: '古代兵器大观', category: 'history', difficulty: 'beginner', grade_level: '2-5', estimated_time: '45分钟',
    description: '从石器时代的石斧，到青铜时代的戈矛，再到铁器时代的刀剑——武器的发展见证了人类文明的进步。研究古代兵器的发展历史，了解不同时代的科技水平。',
    requirements: '1. 了解兵器发展的四个阶段：石器→青铜→铁器→火药\n2. 认识3种古代兵器：矛、弓、剑\n3. 画一个兵器发展时间轴\n4. 用纸板制作一个古代兵器模型\n5. 写一段"兵器与和平"的感想',
    reference_materials: '1. 《武器发展史》\n2. 中国四大发明之一：火药\n3. 搜索"古代兵器 种类"',
    visual_prompt: 'Ancient weapons evolution timeline, stone axe bronze sword iron spear, historical artifacts, museum display style, no people',
    steps: [{ step: 1, title: '知阶段', content: '了解兵器发展的四个阶段', image_prompt: '' }, { step: 2, title: '认兵器', content: '认识3种古代兵器：矛、弓、剑', image_prompt: '' }, { step: 3, title: '画时间轴', content: '画一个兵器发展时间轴', image_prompt: '' }, { step: 4, title: '做模型', content: '用纸板做一个古代兵器模型', image_prompt: '' }]
  },

  // ========== 地理世界 (geography) ==========
  {
    title: '认识地球仪', category: 'geography', difficulty: 'beginner', grade_level: '1-3', estimated_time: '35分钟',
    description: '地球是圆的！在地球仪上找到七大洲、四大洋，找到中国在哪里。了解经纬度是什么，为什么有白天和黑夜。地球仪是你认识世界的第一扇窗。',
    requirements: '1. 在地球仪上找到七大洲和四大洋\n2. 找到中国的位置\n3. 了解赤道、北极、南极\n4. 认识经纬度（经线、纬线）\n5. 画一个简化的地球图，标注大洲大洋',
    reference_materials: '1. 地球仪（或在线3D地球仪）\n2. 七大洲：亚洲、非洲、北美洲、南美洲、南极洲、欧洲、大洋洲\n3. 四大洋：太平洋、大西洋、印度洋、北冰洋',
    visual_prompt: 'Colorful globe with continents and oceans clearly visible, educational geography tool, world map illustration, no people',
    steps: [{ step: 1, title: '识地球', content: '在地球仪上找到七大洲四大洋', image_prompt: '' }, { step: 2, title: '找中国', content: '找到中国在哪里，它在哪个洲', image_prompt: '' }, { step: 3, title: '识经纬', content: '了解赤道、北极、南极、经纬度', image_prompt: '' }, { step: 4, title: '画地球', content: '画一个简化的地球，标注大洲大洋', image_prompt: '' }]
  },
  {
    title: '世界著名建筑', category: 'geography', difficulty: 'beginner', grade_level: '2-5', estimated_time: '45分钟',
    description: '埃菲尔铁塔、金字塔、自由女神像、悉尼歌剧院……世界上有太多令人惊叹的建筑！选3个世界著名建筑，在地图上找到它们的位置，了解它们的故事。',
    requirements: '1. 选3个世界著名建筑\n2. 在世界地图上标出它们的位置\n3. 研究每个建筑的：建造时间、用途、有趣的事实\n4. 画出或拼出你最喜欢的一个建筑\n5. 制作一张"世界建筑之旅"海报',
    reference_materials: '1. 《世界建筑奇迹》绘本\n2. 推荐建筑：埃菲尔铁塔、金字塔、长城、泰姬陵\n3. 搜索"world famous buildings for kids"',
    visual_prompt: 'World map with famous landmark icons, Eiffel Tower pyramids Sydney Opera House, travel poster style, no people',
    steps: [{ step: 1, title: '选建筑', content: '选3个世界著名建筑', image_prompt: '' }, { step: 2, title: '定位', content: '在世界地图上标出建筑的位置', image_prompt: '' }, { step: 3, title: '研究', content: '研究每个建筑的建造时间和有趣事实', image_prompt: '' }, { step: 4, title: '做海报', content: '画或拼出你最喜欢的建筑，做成海报', image_prompt: '' }]
  },
  {
    title: '火山与地震', category: 'geography', difficulty: 'beginner', grade_level: '2-5', estimated_time: '40分钟',
    description: '地球并不是一个安静的球——它内部有炽热的岩浆，地壳也在不断运动。了解火山为什么会喷发，地震是怎么发生的，以及我们如何保护自己。',
    requirements: '1. 了解地球的内部结构：地壳、地幔、地核\n2. 研究火山喷发的原因和过程\n3. 了解地震的原因\n4. 制作一个火山模型（用黏土或纸浆）\n5. 学习地震时的自我保护方法',
    reference_materials: '1. 《火山与地震》科普绘本\n2. 搜索"火山喷发原理 动画"\n3. 地震逃生口诀：蹲下、掩护、抓牢',
    visual_prompt: 'Volcano cross section showing magma chamber, erupting volcano model, earth layers diagram, educational science illustration, no people',
    steps: [{ step: 1, title: '探地球', content: '了解地球内部结构：地壳、地幔、地核', image_prompt: '' }, { step: 2, title: '知火山', content: '研究火山喷发的原因和过程', image_prompt: '' }, { step: 3, title: '做模型', content: '用黏土制作一个火山模型', image_prompt: '' }, { step: 4, title: '学逃生', content: '学习地震时的自我保护方法', image_prompt: '' }]
  },
  {
    title: '家乡地形调查', category: 'geography', difficulty: 'beginner', grade_level: '1-3', estimated_time: '40分钟',
    description: '你的家乡是平原、丘陵还是山地？附近有河流吗？气候怎么样？做一个家乡地理调查，了解你生活的地方是什么样的地形和气候。',
    requirements: '1. 了解你家乡的地形：平原、丘陵、山地、盆地\n2. 找出家乡附近的一条河流或湖泊\n3. 记录家乡的气候特点：夏天热吗？冬天冷吗？\n4. 画一幅家乡地形简图\n5. 写一段"我的家乡"介绍',
    reference_materials: '1. 中国地形图\n2. 搜索"你家乡+地形"\n3. 五种地形：平原、丘陵、山地、高原、盆地',
    visual_prompt: 'Chinese landscape terrain map, mountains rivers plains, geographical illustration, topographical style, no people',
    steps: [{ step: 1, title: '识地形', content: '了解家乡的地形类型', image_prompt: '' }, { step: 2, title: '找河流', content: '找出家乡附近的一条河流或湖泊', image_prompt: '' }, { step: 3, title: '记气候', content: '记录家乡的气候特点', image_prompt: '' }, { step: 4, title: '画地图', content: '画一幅家乡地形简图', image_prompt: '' }]
  },
  {
    title: '河流与文明', category: 'geography', difficulty: 'intermediate', grade_level: '3-6', estimated_time: '1小时',
    description: '为什么古代文明都诞生在河流边？黄河孕育了中华文明，尼罗河养育了古埃及，恒河浇灌了古印度……研究河流与人类文明的关系，理解"水是生命之源"。',
    requirements: '1. 认识四大文明古国：中国、古埃及、古印度、古巴比伦\n2. 在地图上找到对应的河流：黄河、尼罗河、恒河、两河流域\n3. 研究河流为什么重要：灌溉、交通、饮用水\n4. 画一幅"河流与文明"关系图\n5. 思考：现代城市为什么也建在河流边？',
    reference_materials: '1. 《四大文明古国》\n2. 搜索"河流与文明"\n3. 文明发源地：黄河-中华文明、尼罗河-古埃及',
    visual_prompt: 'Ancient civilization map with major rivers, Nile Yellow River Tigris Euphrates, historical geography illustration, no people',
    steps: [{ step: 1, title: '识文明', content: '认识四大文明古国', image_prompt: '' }, { step: 2, title: '找河流', content: '在地图上找到对应的河流', image_prompt: '' }, { step: 3, title: '析关系', content: '研究河流为什么重要', image_prompt: '' }, { step: 4, title: '画关系图', content: '画一幅"河流与文明"关系图', image_prompt: '' }]
  },
  {
    title: '气候与四季', category: 'geography', difficulty: 'beginner', grade_level: '1-3', estimated_time: '35分钟',
    description: '为什么有的地方一年四季如春，有的地方常年冰天雪地？地球上的气候千差万别。了解热带、温带、寒带，以及四季变化的原因。',
    requirements: '1. 了解地球的五带：热带、北温带、南温带、北寒带、南寒带\n2. 了解四季变化的原因（地球倾斜自转）\n3. 画出你所在地区的四季变化\n4. 比较：赤道和北极的气候有什么不同\n5. 制作一个"世界气候带"图',
    reference_materials: '1. 搜索"地球五带 小学生"\n2. 四季成因：地球倾斜23.5度\n3. 气候带和动植物分布的关系',
    visual_prompt: 'Climate zones of earth diagram, tropical temperate polar regions, four seasons illustration, educational geography, no people',
    steps: [{ step: 1, title: '识五带', content: '了解地球的五带', image_prompt: '' }, { step: 2, title: '知四季', content: '了解四季变化的原因', image_prompt: '' }, { step: 3, title: '画四季', content: '画出你所在地区的四季变化', image_prompt: '' }, { step: 4, title: '做气候图', content: '制作一个"世界气候带"图', image_prompt: '' }]
  },

  // ========== 道德法治 (politics) ==========
  {
    title: '认识国旗国徽', category: 'politics', difficulty: 'beginner', grade_level: '1-3', estimated_time: '30分钟',
    description: '五星红旗是中国的国旗，上面的五颗星星代表什么？国徽上的天安门、齿轮、麦穗有什么含义？了解国旗国徽的故事，做一个爱国的小公民。',
    requirements: '1. 了解国旗的寓意：红色代表革命，大星代表中国共产党，四颗小星代表各族人民\n2. 了解国徽的组成部分和含义\n3. 画一面国旗\n4. 学唱国歌《义勇军进行曲》\n5. 了解升国旗的礼仪',
    reference_materials: '1. 《国旗法》《国徽法》\n2. 国旗设计者：曾联松\n3. 国歌创作背景',
    visual_prompt: 'Chinese national flag five-star red flag waving, national emblem, patriotic educational illustration, no people',
    steps: [{ step: 1, title: '知国旗', content: '了解国旗的寓意和设计故事', image_prompt: '' }, { step: 2, title: '知国徽', content: '了解国徽的组成部分和含义', image_prompt: '' }, { step: 3, title: '画国旗', content: '画一面五星红旗', image_prompt: '' }, { step: 4, title: '唱国歌', content: '学唱国歌，了解升旗礼仪', image_prompt: '' }]
  },
  {
    title: '我是环保小卫士', category: 'politics', difficulty: 'beginner', grade_level: '1-3', estimated_time: '40分钟',
    description: '地球是我们唯一的家园，保护环境是每个人的责任。制定一个环保行动计划，从身边的小事做起：节约用水、垃圾分类、减少塑料使用……',
    requirements: '1. 了解当前的环境问题：垃圾污染、水污染、空气污染\n2. 列出10件你能做的环保小事\n3. 制定一个为期一周的环保行动计划\n4. 执行计划并记录每天做了什么\n5. 写一篇"环保小卫士"感想',
    reference_materials: '1. 搜索"小学生环保行动"\n2. 垃圾分类指南\n3. 环保口号：减少、重复使用、回收',
    visual_prompt: 'Environmental protection illustration, recycling bins, green earth, clean nature, eco-friendly concept, no people',
    steps: [{ step: 1, title: '知问题', content: '了解当前的环境问题', image_prompt: '' }, { step: 2, title: '列行动', content: '列出10件你能做的环保小事', image_prompt: '' }, { step: 3, title: '定计划', content: '制定一周环保行动计划', image_prompt: '' }, { step: 4, title: '执行', content: '每天执行并记录，写感想', image_prompt: '' }]
  },
  {
    title: '诚信小故事', category: 'politics', difficulty: 'beginner', grade_level: '1-3', estimated_time: '30分钟',
    description: '诚信是做人最重要的品质之一。狼来了的故事告诉我们说谎的后果，曾子杀猪的故事告诉我们言出必行。收集诚信故事，做一个诚实守信的好孩子。',
    requirements: '1. 收集3个关于诚信的故事\n2. 理解每个故事的道理\n3. 写一个你自己经历过的诚信小故事\n4. 画一幅关于诚信的画\n5. 和同学分享：诚信为什么重要？',
    reference_materials: '1. 《狼来了》《曾子杀猪》《华盛顿与樱桃树》\n2. 诚信名言：言必信，行必果\n3. 讨论：如果你做错了事，应该怎么办？',
    visual_prompt: 'Honesty and integrity concept illustration, open book with moral stories, warm colors, educational, no people',
    steps: [{ step: 1, title: '收集', content: '收集3个关于诚信的故事', image_prompt: '' }, { step: 2, title: '理解', content: '理解每个故事告诉我们的道理', image_prompt: '' }, { step: 3, title: '写故事', content: '写一个你自己经历过的诚信故事', image_prompt: '' }, { step: 4, title: '分享', content: '画一幅画，和同学分享讨论', image_prompt: '' }]
  },
  {
    title: '团结合作的力量', category: 'politics', difficulty: 'beginner', grade_level: '1-3', estimated_time: '35分钟',
    description: '一根筷子容易折断，一把筷子就很难折断。这就是团结的力量！和同学们一起完成一个团队任务，体验合作的重要性。',
    requirements: '1. 理解团结合作的意义\n2. 和3-5个同学组成一个团队\n3. 共同完成一个任务（如搭积木塔、拼图比赛）\n4. 记录：每个人做了什么？\n5. 总结：团队合作比一个人做有什么优势？',
    reference_materials: '1. 故事：《三个和尚》《折筷子》\n2. 合作技巧：分工、沟通、相互帮助\n3. 团队角色：队长、执行者、记录者',
    visual_prompt: 'Teamwork concept illustration, puzzle pieces coming together, building blocks forming a structure, collaboration, no people',
    steps: [{ step: 1, title: '学合作', content: '读团结故事，理解合作的意义', image_prompt: '' }, { step: 2, title: '组团队', content: '和3-5个同学组成团队', image_prompt: '' }, { step: 3, title: '做任务', content: '共同完成一个团队任务', image_prompt: '' }, { step: 4, title: '总结', content: '总结团队合作的好处', image_prompt: '' }]
  },
  {
    title: '校园文明公约', category: 'politics', difficulty: 'beginner', grade_level: '1-3', estimated_time: '30分钟',
    description: '一个好的班级需要大家共同维护。和同学们一起讨论，制定一份班级文明公约，让每个人都参与进来，成为班级的小主人。',
    requirements: '1. 讨论：班级里有哪些需要改进的地方？\n2. 每人提出2-3条建议\n3. 全班投票选出最重要的10条\n4. 把公约写在大纸上，装饰美化\n5. 贴在教室里，互相监督执行',
    reference_materials: '1. 《小学生日常行为规范》\n2. 公约内容参考：上课认真听讲、保持教室整洁、同学互相帮助\n3. 民主讨论的方法',
    visual_prompt: 'Classroom rules poster with colorful text, school supplies, decorated bulletin board, educational, no people',
    steps: [{ step: 1, title: '讨论', content: '讨论班级需要改进的地方', image_prompt: '' }, { step: 2, title: '提议', content: '每人提出2-3条建议', image_prompt: '' }, { step: 3, title: '投票', content: '全班投票选出最重要的10条', image_prompt: '' }, { step: 4, title: '制作', content: '把公约写在大纸上美化张贴', image_prompt: '' }]
  },
  {
    title: '小小志愿者', category: 'politics', difficulty: 'intermediate', grade_level: '3-6', estimated_time: '2小时',
    description: '帮助他人是一件快乐的事。参与一次社区志愿服务，可以是捡垃圾、帮助老人、给小朋友讲故事……体会"赠人玫瑰，手有余香"的感觉。',
    requirements: '1. 了解什么是志愿服务\n2. 找一个可以做的志愿服务（社区清洁、帮助邻居老人等）\n3. 完成至少1小时的志愿服务\n4. 记录你的服务内容和感受\n5. 写一篇"我是小小志愿者"的作文',
    reference_materials: '1. 搜索"小学生志愿服务"\n2. 志愿者精神：奉献、友爱、互助、进步\n3. 志愿服务类型：环保、助老、助学',
    visual_prompt: 'Community service concept illustration, helping hands, clean park, donation box, volunteer spirit, warm colors, no people',
    steps: [{ step: 1, title: '知志愿', content: '了解什么是志愿服务', image_prompt: '' }, { step: 2, title: '找服务', content: '找一个可以做的志愿服务', image_prompt: '' }, { step: 3, title: '行动', content: '完成至少1小时志愿服务', image_prompt: '' }, { step: 4, title: '写感想', content: '记录服务内容和感受', image_prompt: '' }]
  },

  // ========== 物理探秘 (physics) ==========
  {
    title: '纸飞机飞行大赛', category: 'physics', difficulty: 'beginner', grade_level: '1-3', estimated_time: '40分钟',
    description: '纸飞机为什么能飞？不同的折法会影响飞行距离吗？通过纸飞机大赛，探索空气动力学的基本原理：升力、阻力、重心。',
    requirements: '1. 折3种不同形状的纸飞机\n2. 在相同条件下测试飞行距离\n3. 记录每种纸飞机的飞行距离\n4. 分析：哪种飞得最远？为什么？\n5. 改进你的纸飞机设计',
    reference_materials: '1. 搜索"纸飞机折法大全"\n2. 飞行原理：升力、阻力、重心\n3. 世界纸飞机大赛记录',
    visual_prompt: 'Various paper airplanes folded in different designs, flight test with measuring tape, physics experiment, no people',
    steps: [{ step: 1, title: '折飞机', content: '折3种不同形状的纸飞机', image_prompt: '' }, { step: 2, title: '飞行测试', content: '在相同条件下测试飞行距离', image_prompt: '' }, { step: 3, title: '记录', content: '记录每种纸飞机的飞行距离', image_prompt: '' }, { step: 4, title: '分析', content: '分析哪种飞得最远，为什么', image_prompt: '' }]
  },
  {
    title: '自制弹簧秤', category: 'physics', difficulty: 'intermediate', grade_level: '3-6', estimated_time: '45分钟',
    description: '弹簧被拉长后会弹回去，这是因为弹力。利用弹簧（或橡皮筋）的弹力，自己动手制作一个简易弹簧秤，用它来称一称身边小物品的重量。',
    requirements: '1. 了解弹力的概念\n2. 准备材料：弹簧（或橡皮筋）、硬纸板、回形针、小钩子\n3. 制作弹簧秤\n4. 用已知重量的物品校准刻度\n5. 用自制的弹簧秤称5件物品的重量',
    reference_materials: '1. 搜索"自制弹簧秤 小学生"\n2. 弹力原理：在弹性限度内，拉力与伸长量成正比\n3. 重量的单位：克(g)、千克(kg)',
    visual_prompt: 'DIY spring scale made of cardboard and rubber band, physics experiment, measuring weights, educational, no people',
    steps: [{ step: 1, title: '学弹力', content: '了解弹力的概念', image_prompt: '' }, { step: 2, title: '做弹簧秤', content: '用弹簧和纸板制作弹簧秤', image_prompt: '' }, { step: 3, title: '校准', content: '用已知重量的物品校准刻度', image_prompt: '' }, { step: 4, title: '称重', content: '用自制弹簧秤称5件物品', image_prompt: '' }]
  },
  {
    title: '静电魔法实验', category: 'physics', difficulty: 'beginner', grade_level: '1-3', estimated_time: '25分钟',
    description: '冬天脱毛衣时噼里啪啦的响声，梳头时头发竖起来——这都是静电！用气球摩擦头发，看看静电能让纸屑跳舞，让水流弯曲。',
    requirements: '1. 了解什么是静电\n2. 用气球摩擦头发或毛衣，产生静电\n3. 实验1：用带电气球吸引纸屑\n4. 实验2：用带电气球让细水流弯曲\n5. 记录实验现象，写下你的发现',
    reference_materials: '1. 搜索"静电实验 小学生"\n2. 静电原理：摩擦起电，电荷转移\n3. 正电荷和负电荷的概念',
    visual_prompt: 'Static electricity experiment with balloon attracting paper pieces, physics demonstration, educational, no people',
    steps: [{ step: 1, title: '知静电', content: '了解什么是静电', image_prompt: '' }, { step: 2, title: '生静电', content: '用气球摩擦头发产生静电', image_prompt: '' }, { step: 3, title: '做实验', content: '用带电气球吸引纸屑、弯曲水流', image_prompt: '' }, { step: 4, title: '记录', content: '记录实验现象，写下你的发现', image_prompt: '' }]
  },
  {
    title: '回声探秘', category: 'physics', difficulty: 'beginner', grade_level: '1-3', estimated_time: '25分钟',
    description: '你在山谷里大喊一声，会听到自己的声音反弹回来——这就是回声！声音是怎么传播的？为什么会产生回声？通过实验了解声音的奥秘。',
    requirements: '1. 了解声音是怎么传播的（振动→空气→耳朵）\n2. 了解回声的原理（声音遇到障碍物反弹）\n3. 找一个能产生回声的地方（如走廊、楼梯间）\n4. 记录回声的延迟时间\n5. 思考：为什么小房间里听不到回声？',
    reference_materials: '1. 搜索"声音传播 回声 小学生"\n2. 声音传播速度：约340米/秒\n3. 回声条件：距离大于17米',
    visual_prompt: 'Sound wave echo diagram, sound bouncing off wall, physics illustration, educational, no people',
    steps: [{ step: 1, title: '知声音', content: '了解声音是怎么传播的', image_prompt: '' }, { step: 2, title: '知回声', content: '了解回声的原理', image_prompt: '' }, { step: 3, title: '找回声', content: '找一个能产生回声的地方测试', image_prompt: '' }, { step: 4, title: '思考', content: '记录回声延迟，思考回声的条件', image_prompt: '' }]
  },
  {
    title: '斜面与省力', category: 'physics', difficulty: 'beginner', grade_level: '2-5', estimated_time: '30分钟',
    description: '为什么搬重物上楼梯比直接提上去更省力？这就是斜面原理！通过实验，比较不同坡度的斜面，看看斜面怎么帮我们省力。',
    requirements: '1. 了解斜面的概念\n2. 用木板和书本搭建不同坡度的斜面\n3. 用橡皮筋或弹簧秤测量拉力\n4. 比较：坡度越缓越省力，但距离越长\n5. 寻找生活中的斜面：楼梯、坡道、螺丝钉',
    reference_materials: '1. 搜索"斜面原理 小学生"\n2. 简单机械：斜面、杠杆、滑轮、轮轴\n3. 功的原理：省力不省功',
    visual_prompt: 'Inclined plane physics experiment with wooden board and books, measuring force, simple machine demonstration, no people',
    steps: [{ step: 1, title: '知斜面', content: '了解斜面的概念', image_prompt: '' }, { step: 2, title: '搭斜面', content: '用木板和书本搭建不同坡度的斜面', image_prompt: '' }, { step: 3, title: '测力', content: '用弹簧秤测量不同坡度下的拉力', image_prompt: '' }, { step: 4, title: '找应用', content: '寻找生活中的斜面应用', image_prompt: '' }]
  },
  {
    title: '热胀冷缩实验', category: 'physics', difficulty: 'beginner', grade_level: '1-3', estimated_time: '25分钟',
    description: '物体受热会膨胀，受冷会收缩——这就是热胀冷缩。用气球套在瓶口上，把瓶子放进热水和冷水里，看看气球会有什么变化。',
    requirements: '1. 了解热胀冷缩的概念\n2. 准备一个空瓶子和一个气球\n3. 把气球套在瓶口上\n4. 把瓶子放入热水中，观察气球的变化\n5. 再把瓶子放入冷水中，观察气球的变化',
    reference_materials: '1. 搜索"热胀冷缩实验 小学生"\n2. 热胀冷缩的应用：温度计、铁轨缝隙\n3. 气体热胀冷缩最明显',
    visual_prompt: 'Thermal expansion experiment with bottle and balloon, hot water and cold water, physics demonstration, educational, no people',
    steps: [{ step: 1, title: '知原理', content: '了解热胀冷缩的概念', image_prompt: '' }, { step: 2, title: '准备', content: '把气球套在空瓶口上', image_prompt: '' }, { step: 3, title: '热水实验', content: '把瓶子放入热水中观察气球', image_prompt: '' }, { step: 4, title: '冷水实验', content: '把瓶子放入冷水中观察气球', image_prompt: '' }]
  },

  // ========== 化学魔法 (chemistry) ==========
  {
    title: '自制肥皂', category: 'chemistry', difficulty: 'intermediate', grade_level: '4-7', estimated_time: '1.5小时',
    description: '肥皂是怎么做出来的？用油脂和氢氧化钠反应，就能制作出肥皂！这个反应叫做"皂化反应"。在大人指导下，自己动手做一块独一无二的肥皂吧。',
    requirements: '1. 了解皂化反应的原理\n2. 准备材料：植物油、氢氧化钠（需大人协助）、水、模具\n3. 在大人指导下安全操作\n4. 混合材料并搅拌至粘稠\n5. 倒入模具，等待凝固（约24小时）',
    reference_materials: '1. 搜索"自制肥皂 教程"\n2. 皂化反应：油脂+碱→肥皂+甘油\n3. 安全提醒：氢氧化钠有腐蚀性，需戴手套',
    visual_prompt: 'Homemade soap making process, oil and lye mixture, soap molds, chemistry experiment, clean laboratory setup, no people',
    steps: [{ step: 1, title: '知原理', content: '了解皂化反应的原理', image_prompt: '' }, { step: 2, title: '备材料', content: '在大人指导下准备材料', image_prompt: '' }, { step: 3, title: '制作', content: '混合材料搅拌至粘稠，倒入模具', image_prompt: '' }, { step: 4, title: '等待', content: '等待24小时凝固，取出成品', image_prompt: '' }]
  },
  {
    title: '隐形墨水', category: 'chemistry', difficulty: 'beginner', grade_level: '1-3', estimated_time: '25分钟',
    description: '用柠檬汁写一封信，字迹干了之后就"消失"了！但用火烤一烤（或靠近灯泡），字迹又会神奇地出现。这就是隐形墨水的秘密。',
    requirements: '1. 准备柠檬汁、棉签、白纸\n2. 用棉签蘸柠檬汁在纸上写字或画画\n3. 等字迹完全干透（变透明）\n4. 靠近灯泡或蜡烛加热（需大人协助）\n5. 观察字迹重新出现的神奇现象',
    reference_materials: '1. 搜索"隐形墨水实验"\n2. 原理：柠檬汁中的有机物加热后氧化变焦\n3. 其他隐形墨水：牛奶、白醋、小苏打溶液',
    visual_prompt: 'Invisible ink experiment, lemon juice and paper, secret message revealed by heat, chemistry magic, educational, no people',
    steps: [{ step: 1, title: '写密信', content: '用棉签蘸柠檬汁在纸上写字', image_prompt: '' }, { step: 2, title: '等干', content: '等字迹完全干透变透明', image_prompt: '' }, { step: 3, title: '加热', content: '在大人协助下靠近热源加热', image_prompt: '' }, { step: 4, title: '观察', content: '观察字迹重新出现的现象', image_prompt: '' }]
  },
  {
    title: '金属生锈实验', category: 'chemistry', difficulty: 'beginner', grade_level: '2-5', estimated_time: '3天观察',
    description: '铁会生锈，但为什么有些铁不生锈？通过对比实验，研究铁钉在不同环境（水、盐水、空气、油）中的生锈速度，了解氧化反应和防锈方法。',
    requirements: '1. 准备4根铁钉和4个杯子\n2. 杯子1：干燥空气；杯子2：自来水；杯子3：盐水；杯子4：油\n3. 每天观察并拍照记录铁钉的变化\n4. 比较：哪种环境下铁钉生锈最快？\n5. 总结防锈的方法',
    reference_materials: '1. 搜索"铁生锈实验 小学生"\n2. 生锈条件：铁+水+氧气\n3. 防锈方法：涂油、刷漆、镀锌',
    visual_prompt: 'Iron rust experiment with nails in different liquids, water salt water oil, chemistry comparison, educational, no people',
    steps: [{ step: 1, title: '准备', content: '准备4根铁钉和4个杯子，设置不同环境', image_prompt: '' }, { step: 2, title: '观察', content: '每天观察并拍照记录铁钉的变化', image_prompt: '' }, { step: 3, title: '比较', content: '比较哪种环境下铁钉生锈最快', image_prompt: '' }, { step: 4, title: '总结', content: '总结防锈的方法', image_prompt: '' }]
  },
  {
    title: '碘酒检测淀粉', category: 'chemistry', difficulty: 'beginner', grade_level: '2-5', estimated_time: '30分钟',
    description: '碘酒遇到淀粉会变成蓝紫色！用这个神奇的化学反应，检测你身边的食物哪些含有淀粉。米饭、土豆、面包、苹果……你猜哪些会变色？',
    requirements: '1. 了解碘酒遇淀粉变蓝紫色的原理\n2. 准备碘酒（稀释后使用）和各种食物\n3. 在每种食物上滴一滴碘酒\n4. 观察并记录哪些食物变色了\n5. 总结：哪些食物富含淀粉？',
    reference_materials: '1. 搜索"碘酒 淀粉 实验"\n2. 原理：碘分子进入淀粉螺旋结构形成络合物\n3. 富含淀粉的食物：米饭、土豆、面包、玉米',
    visual_prompt: 'Iodine starch test experiment, food samples turning blue-purple, chemistry lab, educational, no people',
    steps: [{ step: 1, title: '知原理', content: '了解碘酒遇淀粉变色的原理', image_prompt: '' }, { step: 2, title: '准备', content: '准备碘酒和各种食物样品', image_prompt: '' }, { step: 3, title: '测试', content: '在每种食物上滴碘酒观察变色', image_prompt: '' }, { step: 4, title: '总结', content: '总结哪些食物富含淀粉', image_prompt: '' }]
  },
  {
    title: '蛋壳与酸反应', category: 'chemistry', difficulty: 'beginner', grade_level: '1-3', estimated_time: '2天观察',
    description: '把鸡蛋放进醋里，会发生什么？蛋壳会慢慢冒泡、变软，最后变成一颗"弹力蛋"！这是因为醋里的酸和蛋壳里的碳酸钙发生了化学反应。',
    requirements: '1. 把一颗生鸡蛋放入杯中，倒入白醋完全浸泡\n2. 观察蛋壳表面冒出的气泡\n3. 24小时后换一次醋\n4. 48小时后取出鸡蛋，轻轻冲洗\n5. 观察：蛋壳去哪了？鸡蛋变得怎么样了？',
    reference_materials: '1. 搜索"醋泡鸡蛋实验"\n2. 原理：醋酸+碳酸钙→二氧化碳+醋酸钙+水\n3. 蛋壳成分：碳酸钙',
    visual_prompt: 'Egg in vinegar experiment, eggshell dissolving, bubbles forming, chemistry reaction, educational, no people',
    steps: [{ step: 1, title: '浸泡', content: '把鸡蛋放入醋中完全浸泡', image_prompt: '' }, { step: 2, title: '观察', content: '观察蛋壳表面冒出的气泡', image_prompt: '' }, { step: 3, title: '换醋', content: '24小时后换一次醋', image_prompt: '' }, { step: 4, title: '取出', content: '48小时后取出，观察变化', image_prompt: '' }]
  },
  {
    title: '自制汽水', category: 'chemistry', difficulty: 'beginner', grade_level: '2-5', estimated_time: '20分钟',
    description: '汽水里的气泡是什么？是二氧化碳！用柠檬汁和小苏打，自己动手制作一杯会冒泡的"汽水"。喝一口，酸酸甜甜还带气！',
    requirements: '1. 了解原理：酸（柠檬汁）+碱（小苏打）→二氧化碳+水\n2. 准备材料：柠檬汁、小苏打、糖、水\n3. 在杯中加入柠檬汁、糖和水，搅拌均匀\n4. 加入一小勺小苏打，快速搅拌\n5. 观察气泡产生，立即饮用',
    reference_materials: '1. 搜索"自制汽水 小苏打"\n2. 碳酸饮料的原理\n3. 酸碱中和反应',
    visual_prompt: 'Homemade soda with lemon juice and baking soda, bubbling drink, chemistry experiment, refreshing, no people',
    steps: [{ step: 1, title: '知原理', content: '了解酸和碱反应产生二氧化碳', image_prompt: '' }, { step: 2, title: '混合', content: '将柠檬汁、糖和水混合', image_prompt: '' }, { step: 3, title: '加小苏打', content: '加入小苏打快速搅拌', image_prompt: '' }, { step: 4, title: '饮用', content: '观察气泡，立即饮用', image_prompt: '' }]
  },

  // ========== 生物世界 (biology) ==========
  {
    title: '认识人体骨骼', category: 'biology', difficulty: 'beginner', grade_level: '1-3', estimated_time: '40分钟',
    description: '你身体里有206块骨头！它们支撑着你的身体，保护着你的内脏。认识人体主要骨骼：头骨、脊椎、肋骨、四肢骨，做一个骨骼模型。',
    requirements: '1. 了解人体有206块骨头\n2. 认识主要骨骼：头骨、脊椎、肋骨、肱骨、股骨\n3. 了解骨骼的功能：支撑、保护、运动\n4. 用棉签或吸管制作一个人体骨骼模型\n5. 标注各部位骨骼名称',
    reference_materials: '1. 搜索"人体骨骼 小学生"\n2. 人体骨骼图\n3. 骨骼和关节的关系',
    visual_prompt: 'Human skeleton educational diagram, bone structure illustration, anatomy for kids, no people',
    steps: [{ step: 1, title: '知骨骼', content: '了解人体有206块骨头', image_prompt: '' }, { step: 2, title: '认骨头', content: '认识主要骨骼和它们的功能', image_prompt: '' }, { step: 3, title: '做模型', content: '用棉签或吸管制作骨骼模型', image_prompt: '' }, { step: 4, title: '标注', content: '在模型上标注骨骼名称', image_prompt: '' }]
  },
  {
    title: '光合作用实验', category: 'biology', difficulty: 'intermediate', grade_level: '3-6', estimated_time: '2天观察',
    description: '植物是怎么"吃饭"的？它们用阳光、水和二氧化碳制造自己的食物，同时释放氧气——这就是光合作用。通过实验观察植物在光照下产生氧气。',
    requirements: '1. 了解光合作用的基本概念\n2. 把水草放入装了水的透明杯中\n3. 把杯子放在阳光下\n4. 观察水草上冒出的气泡\n5. 记录：气泡是什么？为什么有气泡？',
    reference_materials: '1. 搜索"光合作用实验 小学生"\n2. 光合作用公式：CO₂+H₂O+光→葡萄糖+O₂\n3. 光合作用的重要性',
    visual_prompt: 'Photosynthesis experiment with aquatic plant in glass, oxygen bubbles visible, sunlight, biology illustration, no people',
    steps: [{ step: 1, title: '知原理', content: '了解光合作用的概念', image_prompt: '' }, { step: 2, title: '准备', content: '把水草放入透明杯中加水', image_prompt: '' }, { step: 3, title: '光照', content: '放在阳光下观察气泡产生', image_prompt: '' }, { step: 4, title: '记录', content: '记录气泡是什么，为什么产生', image_prompt: '' }]
  },
  {
    title: '昆虫标本制作', category: 'biology', difficulty: 'intermediate', grade_level: '3-6', estimated_time: '1小时',
    description: '蝴蝶、甲虫、蜻蜓……昆虫世界丰富多彩。学习制作昆虫标本，观察昆虫的身体结构：头、胸、腹、六条腿、翅膀……了解昆虫的形态特征。',
    requirements: '1. 收集一只完整的昆虫（已死亡的蝴蝶或甲虫）\n2. 了解昆虫的基本结构\n3. 准备昆虫针、泡沫板、展示盒\n4. 用昆虫针固定昆虫，调整姿态\n5. 放入展示盒，标注名称和采集信息',
    reference_materials: '1. 搜索"昆虫标本制作 小学生"\n2. 昆虫特征：头、胸、腹、三对足、两对翅\n3. 常见的昆虫：蝴蝶、蜻蜓、甲虫、蜜蜂',
    visual_prompt: 'Insect specimen collection, butterfly and beetle pinned in display box, entomology, natural history, no people',
    steps: [{ step: 1, title: '收集', content: '收集一只完整的昆虫', image_prompt: '' }, { step: 2, title: '识结构', content: '了解昆虫的基本结构', image_prompt: '' }, { step: 3, title: '制作', content: '用昆虫针固定昆虫并调整姿态', image_prompt: '' }, { step: 4, title: '展示', content: '放入展示盒标注名称和信息', image_prompt: '' }]
  },
  {
    title: '细胞观察', category: 'biology', difficulty: 'intermediate', grade_level: '4-7', estimated_time: '45分钟',
    description: '用显微镜看看洋葱表皮细胞——它们排列得像砖墙一样整齐！你还能看到细胞核、细胞壁。第一次看到微观世界，一定会让你惊叹不已！',
    requirements: '1. 准备显微镜和洋葱\n2. 撕取洋葱内表皮，制作临时装片\n3. 用碘液染色\n4. 在显微镜下观察，找到细胞壁、细胞核\n5. 画出你看到的细胞结构图',
    reference_materials: '1. 搜索"洋葱表皮细胞观察"\n2. 植物细胞结构：细胞壁、细胞膜、细胞核、液泡\n3. 显微镜的使用方法',
    visual_prompt: 'Onion cell under microscope, plant cell structure, cell wall and nucleus visible, biology lab, educational, no people',
    steps: [{ step: 1, title: '准备', content: '准备显微镜和洋葱', image_prompt: '' }, { step: 2, title: '制片', content: '撕取洋葱内表皮，制作装片', image_prompt: '' }, { step: 3, title: '观察', content: '在显微镜下观察细胞结构', image_prompt: '' }, { step: 4, title: '绘图', content: '画出你看到的细胞结构图', image_prompt: '' }]
  },
  {
    title: '遗传小实验', category: 'biology', difficulty: 'intermediate', grade_level: '3-6', estimated_time: '30分钟',
    description: '为什么你长得像爸爸妈妈？这就是遗传！观察你的家人：你有没有双眼皮？会不会卷舌头？耳朵有没有耳垂？研究这些特征在家族中的分布。',
    requirements: '1. 了解遗传的基本概念\n2. 观察自己的3个特征：双眼皮/单眼皮、卷舌/不卷舌、有耳垂/无耳垂\n3. 调查爸爸妈妈、爷爷奶奶的同样特征\n4. 制作一张"家族遗传特征表"\n5. 分析：你哪些特征像爸爸？哪些像妈妈？',
    reference_materials: '1. 搜索"遗传小实验"\n2. 遗传概念：性状从父母传递给子女\n3. 显性性状：双眼皮、卷舌、有耳垂',
    visual_prompt: 'Family genetic traits chart, dominant recessive traits illustration, biology education, inheritance diagram, no people',
    steps: [{ step: 1, title: '知遗传', content: '了解遗传的基本概念', image_prompt: '' }, { step: 2, title: '观自己', content: '观察自己的3个特征', image_prompt: '' }, { step: 3, title: '查家人', content: '调查家人的同样特征', image_prompt: '' }, { step: 4, title: '制表', content: '制作家族遗传特征分析表', image_prompt: '' }]
  },
  {
    title: '蘑菇种植日记', category: 'biology', difficulty: 'beginner', grade_level: '1-3', estimated_time: '2周观察',
    description: '蘑菇不是植物，它们属于真菌！买一个蘑菇种植包，每天观察蘑菇的生长过程。从菌丝到冒出小蘑菇，再到长大成熟——记录这神奇的生命过程。',
    requirements: '1. 准备一个蘑菇种植包\n2. 放在阴凉潮湿的地方\n3. 每天喷水保持湿润\n4. 每天拍照记录蘑菇的生长变化\n5. 写一篇"蘑菇生长观察日记"',
    reference_materials: '1. 搜索"蘑菇种植 小学生"\n2. 真菌和植物的区别\n3. 蘑菇的生长条件：潮湿、阴暗、温暖',
    visual_prompt: 'Mushroom growing kit, oyster mushrooms sprouting from substrate, growth stages, biology experiment, no people',
    steps: [{ step: 1, title: '准备', content: '准备蘑菇种植包', image_prompt: '' }, { step: 2, title: '放置', content: '放在阴凉潮湿处，每天喷水', image_prompt: '' }, { step: 3, title: '观察', content: '每天拍照记录蘑菇生长', image_prompt: '' }, { step: 4, title: '写日记', content: '写一篇蘑菇生长观察日记', image_prompt: '' }]
  },

  // ========== 计算机基础 (computer) ==========
  {
    title: '认识计算机硬件', category: 'computer', difficulty: 'beginner', grade_level: '2-5', estimated_time: '35分钟',
    description: '计算机里面有什么？CPU像大脑，内存像书桌，硬盘像书包。了解计算机的五大部件：CPU、内存、硬盘、主板、显示器，认识它们的功能。',
    requirements: '1. 认识计算机五大部件\n2. 了解每个部件的功能\n3. 画一张计算机内部结构图\n4. 标注各部件名称和功能\n5. 做一个"计算机硬件小百科"卡片',
    reference_materials: '1. 搜索"计算机硬件 小学生"\n2. CPU=中央处理器，内存=运行程序的地方\n3. 硬盘=存储文件的地方',
    visual_prompt: 'Computer hardware components, CPU motherboard RAM hard drive, educational technology diagram, no people',
    steps: [{ step: 1, title: '认部件', content: '认识计算机五大部件', image_prompt: '' }, { step: 2, title: '知功能', content: '了解每个部件的功能', image_prompt: '' }, { step: 3, title: '画结构', content: '画计算机内部结构图', image_prompt: '' }, { step: 4, title: '做卡片', content: '制作计算机硬件小百科卡片', image_prompt: '' }]
  },
  {
    title: '文件管理小能手', category: 'computer', difficulty: 'beginner', grade_level: '2-5', estimated_time: '30分钟',
    description: '你的电脑桌面是不是乱七八糟？学会用文件夹分类管理文件，就像把玩具分类放进不同的抽屉一样。养成良好的文件管理习惯，让你的电脑井井有条。',
    requirements: '1. 了解文件夹的概念（目录）\n2. 创建5个分类文件夹：学习、图片、音乐、视频、其他\n3. 把电脑里的文件分类移动到对应文件夹\n4. 学习文件命名规范\n5. 清理不需要的文件，释放空间',
    reference_materials: '1. 搜索"文件管理技巧"\n2. 文件夹=目录，文件=文档\n3. 文件路径的概念',
    visual_prompt: 'Organized computer folders with labels, file management system, clean desktop, educational technology, no people',
    steps: [{ step: 1, title: '知概念', content: '了解文件夹和文件的概念', image_prompt: '' }, { step: 2, title: '建文件夹', content: '创建5个分类文件夹', image_prompt: '' }, { step: 3, title: '整理', content: '把文件分类移动到对应文件夹', image_prompt: '' }, { step: 4, title: '清理', content: '清理不需要的文件，学命名规范', image_prompt: '' }]
  },
  {
    title: '搜索引擎大比拼', category: 'computer', difficulty: 'beginner', grade_level: '2-5', estimated_time: '30分钟',
    description: '遇到不懂的问题，你会用搜索引擎查吗？学习高效的搜索技巧：用关键词、加引号精确搜索、用减号排除……让你的搜索更精准、更快速。',
    requirements: '1. 了解什么是搜索引擎\n2. 学习搜索技巧：选关键词、加引号、用减号\n3. 用不同关键词搜索同一个问题，比较结果\n4. 评估搜索结果的可信度\n5. 实践：搜索一个你感兴趣的话题，整理资料',
    reference_materials: '1. 搜索"搜索技巧 小学生"\n2. 常用搜索引擎：百度、必应\n3. 搜索语法：""精确搜索、-排除词',
    visual_prompt: 'Search engine interface with magnifying glass, search results, computer screen, educational technology, no people',
    steps: [{ step: 1, title: '知搜索', content: '了解什么是搜索引擎', image_prompt: '' }, { step: 2, title: '学技巧', content: '学习搜索技巧', image_prompt: '' }, { step: 3, title: '比较', content: '用不同关键词搜索同一问题比较结果', image_prompt: '' }, { step: 4, title: '实践', content: '搜索一个感兴趣的话题并整理资料', image_prompt: '' }]
  },
  {
    title: '演示文稿制作', category: 'computer', difficulty: 'beginner', grade_level: '2-5', estimated_time: '1小时',
    description: '学习用PPT或WPS制作一个演示文稿，介绍一个你喜欢的主题。学会插入文字、图片、动画，让你的展示生动有趣！',
    requirements: '1. 选一个主题（如：我的宠物、最喜欢的书、一次旅行）\n2. 做6-8页幻灯片\n3. 每页有标题和内容\n4. 插入至少3张图片\n5. 添加简单的动画效果\n6. 给家人或同学做一次展示',
    reference_materials: '1. 搜索"PPT制作 小学生"\n2. 幻灯片结构：封面、目录、内容页、总结\n3. 演示技巧：少文字、多图片、大声讲',
    visual_prompt: 'Presentation slides on computer screen, colorful slide design, educational technology, no people',
    steps: [{ step: 1, title: '选主题', content: '选一个想介绍的主题', image_prompt: '' }, { step: 2, title: '做内容', content: '做6-8页幻灯片，每页有标题和内容', image_prompt: '' }, { step: 3, title: '加效果', content: '插入图片和动画效果', image_prompt: '' }, { step: 4, title: '展示', content: '给家人或同学做一次演示', image_prompt: '' }]
  },

  // ========== AI初体验 (ai) ==========
  {
    title: '什么是人工智能', category: 'ai', difficulty: 'beginner', grade_level: '2-5', estimated_time: '35分钟',
    description: '手机能听懂你说的话，游戏里的对手会自己思考——这些都是人工智能（AI）！了解AI是什么，它怎么"学习"，以及它在我们生活中的应用。',
    requirements: '1. 了解AI的定义：让计算机像人一样思考\n2. 举例生活中的AI：语音助手、人脸识别、推荐系统\n3. 了解AI怎么"学习"：数据训练\n4. 画出AI在你生活中的应用场景\n5. 写一段"我眼中的AI"',
    reference_materials: '1. 搜索"人工智能 小学生"\n2. AI的三种类型：弱AI、强AI、超AI\n3. AI应用：Siri、刷脸支付、抖音推荐',
    visual_prompt: 'Artificial intelligence concept illustration, robot brain, circuit board, futuristic technology, educational, no people',
    steps: [{ step: 1, title: '知AI', content: '了解AI的定义和基本概念', image_prompt: '' }, { step: 2, title: '找AI', content: '举例生活中的AI应用', image_prompt: '' }, { step: 3, title: '画AI', content: '画出AI在你生活中的应用场景', image_prompt: '' }, { step: 4, title: '写感想', content: '写一段"我眼中的AI"', image_prompt: '' }]
  },
  {
    title: 'AI绘画体验', category: 'ai', difficulty: 'beginner', grade_level: '2-5', estimated_time: '30分钟',
    description: '用文字描述一幅画，AI就能帮你画出来！试试用AI绘画工具，输入你的创意描述，看看AI能画出什么。你会发现，想象力就是最好的画笔。',
    requirements: '1. 了解AI绘画的原理\n2. 使用一个AI绘画工具（需大人在旁指导）\n3. 输入3个不同的描述，生成3幅画\n4. 比较：哪幅画最符合你的想象？\n5. 总结：AI绘画的优缺点',
    reference_materials: '1. 搜索"AI绘画 儿童"\n2. AI绘画原理：学习大量图片后生成新图片\n3. 提示词技巧：描述越详细，结果越好',
    visual_prompt: 'AI art generation interface, colorful digital artwork created by artificial intelligence, creative technology, no people',
    steps: [{ step: 1, title: '知原理', content: '了解AI绘画的原理', image_prompt: '' }, { step: 2, title: '体验', content: '在大人指导下使用AI绘画工具', image_prompt: '' }, { step: 3, title: '对比', content: '生成3幅画，比较效果', image_prompt: '' }, { step: 4, title: '总结', content: '总结AI绘画的优缺点', image_prompt: '' }]
  },
  {
    title: '语音助手初体验', category: 'ai', difficulty: 'beginner', grade_level: '1-3', estimated_time: '25分钟',
    description: '"你好，Siri！""小度小度！"——语音助手是怎么听懂你说的话的？了解语音识别技术，试试和语音助手对话，看看它能帮你做什么。',
    requirements: '1. 了解语音识别的基本原理\n2. 试试用语音助手完成3个任务：查天气、定闹钟、问问题\n3. 记录语音助手的回答\n4. 测试：说方言或口齿不清时，它能听懂吗？\n5. 总结语音助手的优点和局限',
    reference_materials: '1. 搜索"语音识别 原理"\n2. 语音助手：Siri、小爱同学、小度\n3. 语音识别过程：声音→文字→理解→回答',
    visual_prompt: 'Smart speaker and voice assistant concept, sound waves, AI technology, futuristic, no people',
    steps: [{ step: 1, title: '知原理', content: '了解语音识别的基本原理', image_prompt: '' }, { step: 2, title: '用助手', content: '用语音助手完成3个任务', image_prompt: '' }, { step: 3, title: '测试', content: '测试方言和口齿不清的情况', image_prompt: '' }, { step: 4, title: '总结', content: '总结语音助手的优点和局限', image_prompt: '' }]
  },
  {
    title: 'AI与生活', category: 'ai', difficulty: 'beginner', grade_level: '2-5', estimated_time: '30分钟',
    description: '从早到晚，AI无处不在：手机解锁（人脸识别）、购物推荐、地图导航、自动翻译……找一找生活中的10个AI应用场景，了解AI如何改变我们的生活。',
    requirements: '1. 从早上起床到晚上睡觉，找一找用到AI的场景\n2. 列出至少10个AI应用\n3. 分类：哪些帮我们省时间？哪些让我们更安全？\n4. 画一张"AI在我身边"的海报\n5. 思考：AI会取代人类吗？',
    reference_materials: '1. 搜索"AI在日常生活中的应用"\n2. AI应用：人脸识别、推荐算法、自动驾驶、医疗诊断\n3. AI的伦理问题',
    visual_prompt: 'AI in daily life illustration, smart home devices, facial recognition, navigation, various AI applications, no people',
    steps: [{ step: 1, title: '找AI', content: '从早到晚找生活中使用AI的场景', image_prompt: '' }, { step: 2, title: '列清单', content: '列出至少10个AI应用', image_prompt: '' }, { step: 3, title: '画海报', content: '画一张"AI在我身边"海报', image_prompt: '' }, { step: 4, title: '思考', content: '思考AI会取代人类吗', image_prompt: '' }]
  }
];

// 合并
const allProjects = [...existing, ...newProjects];
fs.writeFileSync(dataPath, JSON.stringify(allProjects, null, 2), 'utf-8');
console.log(`项目总数: ${allProjects.length}（新增 ${newProjects.length} 个）`);
console.log('新增分类统计:');
const cats = {} as Record<string, number>;
newProjects.forEach((p: any) => { cats[p.category] = (cats[p.category] || 0) + 1; });
Object.entries(cats).forEach(([k, v]) => console.log(`  ${k}: ${v}个`));