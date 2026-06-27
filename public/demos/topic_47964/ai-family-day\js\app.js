/**
 * AI家庭日 v2.1 — 全局状态管理模块
 * v2.1新增：积分防刷、上下文记忆、积分明细、数据重置、首次访问引导、更多社区帖子
 */
const App = (() => {

  // ============================================================
  //  常量数据
  // ============================================================

  /** 10个可选角色 */
  const CHARACTERS = {
    doraemon: { id: 'doraemon', name: '哆啦A梦', emoji: '🤖', color: 'amber', image: '../assets/char-doraemon.jpg', personality: 'curious', description: '来自未来的蓝色猫型机器人，陪你探索科学奥秘', greeting: '你好呀！我是哆啦A梦！我的四次元口袋里装满了科学秘密，今天想探索什么？' },
    transformers: { id: 'transformers', name: '变形金刚', emoji: '🚗', color: 'sky', image: '../assets/char-transformers.jpg', personality: 'brave', description: '汽车人的世界，学习勇气与团队合作', greeting: '汽车人，出发！我是变形金刚，准备好和我一起学习科技的力量了吗？' },
    frozen: { id: 'frozen', name: '冰雪奇缘', emoji: '❄️', color: 'sky', image: '../assets/char-frozen.jpg', personality: 'gentle', description: '艾莎的冰雪王国，感受爱与勇气', greeting: '你好呀！欢迎来到冰雪王国！我是艾莎，让我们一起探索大自然的奥秘吧！' },
    nemo: { id: 'nemo', name: '海底总动员', emoji: '🐠', color: 'mint', image: '../assets/char-nemo.jpg', personality: 'adventurous', description: '马林的海洋冒险，认识奇妙的海洋生物', greeting: '嗨！我是尼莫！大海里有好多神奇的朋友，你想认识它们吗？' },
    harry: { id: 'harry', name: '哈利波特', emoji: '⚡', color: 'amber', image: '../assets/char-harry.jpg', personality: 'magical', description: '霍格沃茨魔法学校，探索魔法世界', greeting: '欢迎来到霍格沃茨！我是哈利波特，挥动魔杖，让我们一起探索魔法和科学的奥秘吧！' },
    delta: { id: 'delta', name: '三角洲行动', emoji: '🎖️', color: 'mint', image: '../assets/char-delta.jpg', personality: 'strategic', description: '化身精锐特种部队干员，学习战术策略与团队协作', greeting: '干员就位！我是三角洲行动的特种兵，准备好执行今天的战术任务了吗？' },
    ittakes: { id: 'ittakes', name: '双人成行', emoji: '👫', color: 'rose', image: '../assets/char-ittakes.jpg', personality: 'cooperative', description: '奇妙冒险，在合作中学会信任与沟通', greeting: '嘿！我们是双人成行伙伴！一个人走得快，两个人走得远，一起来冒险吧！' },
    minecraft: { id: 'minecraft', name: '我的世界', emoji: '⛏️', color: 'amber', image: '../assets/char-minecraft.jpg', personality: 'creative', description: '用方块创造无限可能，激发空间想象力', greeting: '你好！欢迎来到我的世界！在这里，我们可以用创造力建造任何东西！' },
    mario: { id: 'mario', name: '超级冒险家', emoji: '🍄', color: 'rose', image: '../assets/char-mario.jpg', personality: 'energetic', description: '充满金币的冒险王国，培养毅力和乐观', greeting: 'It\'s-a me! 马里奥！准备好了吗？今天我们要去哪里冒险？' },
    eggy: { id: 'eggy', name: '蛋仔派对', emoji: '🥚', color: 'sky', image: '../assets/char-eggy.jpg', personality: 'playful', description: '蛋仔闯关冒险，享受欢乐竞技', greeting: '咕噜咕噜~ 我是蛋仔！今天想玩什么？闯关还是学新东西？' }
  };

  /** 7个每日任务 */
  const DAILY_TASKS = [
    { id: 'chat_once', title: '和AI伙伴聊一次天', type: 'chat', target: 1, icon: '💬', points: 10 },
    { id: 'chat_three', title: '和AI伙伴聊3次', type: 'chat', target: 3, icon: '🗣️', points: 20 },
    { id: 'create_comic', title: '创作一幅漫画', type: 'comic', target: 1, icon: '🎨', points: 30 },
    { id: 'visit_3d', title: '逛逛3D工坊', type: 'model', target: 1, icon: '🧊', points: 15 },
    { id: 'print_3d', title: '完成一次3D打印', type: 'print', target: 1, icon: '🖨️', points: 25 },
    { id: 'visit_community', title: '逛逛社区看看别人', type: 'community', target: 1, icon: '👨‍👩‍👧', points: 10 },
    { id: 'share_work', title: '分享一个作品到社区', type: 'share', target: 1, icon: '📤', points: 20 }
  ];

  /** 30条每日一问 */
  const DAILY_QUESTIONS = [
    '你知道为什么天空是蓝色的吗？',
    '如果地球是一个苹果，那地壳有多厚？',
    '蜜蜂跳舞是在说什么？',
    '为什么我们能看到彩虹？',
    '一只蜗牛能睡多久？',
    '闪电的温度有多高？',
    '海马是爸爸生孩子还是妈妈？',
    '为什么猫喜欢纸箱子？',
    '一滴水里有多少个微生物？',
    '月球上能听到声音吗？',
    '章鱼有几颗心脏？',
    '为什么树叶到秋天会变色？',
    '世界上最深的海洋有多深？',
    '恐龙的智商有多高？',
    '为什么我们会做梦？',
    '太阳还能燃烧多久？',
    '蚂蚁能举起比自己重多少倍的东西？',
    '为什么火烈鸟是粉红色的？',
    '世界上有多少种语言？',
    '宇航员在太空怎么洗澡？',
    '鲸鱼的心跳有多慢？',
    '为什么冰会浮在水面上？',
    '蝴蝶用什么尝味道？',
    '世界上最小的动物是什么？',
    '为什么星星会闪烁？',
    '人的大脑有多重？',
    '北极熊的皮肤是什么颜色？',
    '光速有多快？',
    '竹子一天能长多高？',
    '世界上最长的蛇有多长？'
  ];

  /** 12枚勋章 */
  const BADGES = [
    { id: 'first_chat', name: '初次对话', emoji: '💬', condition: (s) => s.chatCount >= 1, progress: (s) => Math.min(100, Math.round(s.chatCount / 1 * 100)), progressText: (s) => `${s.chatCount}/1` },
    { id: 'comic_master', name: '漫画大师', emoji: '🎨', condition: (s) => s.comicCount >= 3, progress: (s) => Math.min(100, Math.round(s.comicCount / 3 * 100)), progressText: (s) => `${s.comicCount}/3` },
    { id: '3d_maker', name: '3D创客', emoji: '🧊', condition: (s) => s.modelCount >= 2, progress: (s) => Math.min(100, Math.round(s.modelCount / 2 * 100)), progressText: (s) => `${s.modelCount}/2` },
    { id: 'learner', name: '学习达人', emoji: '📚', condition: (s) => s.scores.learning >= 500, progress: (s) => Math.min(100, Math.round(s.scores.learning / 500 * 100)), progressText: (s) => `${s.scores.learning}/500` },
    { id: 'streak_7', name: '连续7天', emoji: '🔥', condition: (s) => s.streak >= 7, progress: (s) => Math.min(100, Math.round(s.streak / 7 * 100)), progressText: (s) => `${s.streak}/7天` },
    { id: 'creative_star', name: '创意之星', emoji: '✨', condition: (s) => s.scores.creative >= 300, progress: (s) => Math.min(100, Math.round(s.scores.creative / 300 * 100)), progressText: (s) => `${s.scores.creative}/300` },
    { id: 'explorer', name: '知识探险', emoji: '🔍', condition: (s) => s.chatCount >= 10, progress: (s) => Math.min(100, Math.round(s.chatCount / 10 * 100)), progressText: (s) => `${s.chatCount}/10` },
    { id: 'family_team', name: '家庭协作', emoji: '👨‍👩‍👧', condition: (s) => s.scores.learning + s.scores.creative >= 1000, progress: (s) => Math.min(100, Math.round((s.scores.learning + s.scores.creative) / 1000 * 100)), progressText: (s) => `${s.scores.learning + s.scores.creative}/1000` },
    { id: 'ai_buddy', name: 'AI伙伴', emoji: '🤖', condition: (s) => s.chatCount >= 20, progress: (s) => Math.min(100, Math.round(s.chatCount / 20 * 100)), progressText: (s) => `${s.chatCount}/20` },
    { id: 'scholar', name: '满级学者', emoji: '🏆', condition: (s) => s.scores.learning >= 2000, progress: (s) => Math.min(100, Math.round(s.scores.learning / 2000 * 100)), progressText: (s) => `${s.scores.learning}/2000` },
    { id: 'super_creator', name: '超级创作者', emoji: '🎭', condition: (s) => s.scores.creative >= 1000, progress: (s) => Math.min(100, Math.round(s.scores.creative / 1000 * 100)), progressText: (s) => `${s.scores.creative}/1000` },
    { id: 'legend', name: '传奇家庭', emoji: '👑', condition: (s) => s.scores.learning >= 2000 && s.scores.creative >= 1000 && s.streak >= 7, progress: (s) => { const p1 = Math.min(100, s.scores.learning / 2000 * 100); const p2 = Math.min(100, s.scores.creative / 1000 * 100); const p3 = Math.min(100, s.streak / 7 * 100); return Math.round((p1 + p2 + p3) / 3); }, progressText: (s) => `学习${Math.round(s.scores.learning / 2000 * 100)}% 创作${Math.round(s.scores.creative / 1000 * 100)}%` },
    { id: 'video_creator', name: '视频创作者', emoji: '🎬', condition: (s) => s.videoCount >= 3, progress: (s) => Math.min(100, Math.round((s.videoCount||0) / 3 * 100)), progressText: (s) => `${s.videoCount||0}/3` },
    { id: 'ppt_master', name: 'PPT达人', emoji: '📊', condition: (s) => s.pptCount >= 5, progress: (s) => Math.min(100, Math.round((s.pptCount||0) / 5 * 100)), progressText: (s) => `${s.pptCount||0}/5` },
    { id: 'photo_editor', name: '照片美化师', emoji: '📷', condition: (s) => s.photoCount >= 5, progress: (s) => Math.min(100, Math.round((s.photoCount||0) / 5 * 100)), progressText: (s) => `${s.photoCount||0}/5` },
    { id: 'challenge_master', name: '挑战达人', emoji: '💪', condition: (s) => s.challengeCount >= 5, progress: (s) => Math.min(100, Math.round((s.challengeCount||0) / 5 * 100)), progressText: (s) => `${s.challengeCount||0}/5` },
    { id: 'knowledge_explorer', name: '知识探险家', emoji: '🗺️', condition: (s) => s.exploreCount >= 20, progress: (s) => Math.min(100, Math.round((s.exploreCount||0) / 20 * 100)), progressText: (s) => `${s.exploreCount||0}/20` },
    { id: 'community_star', name: '社区之星', emoji: '⭐', condition: (s) => s.communityLikes >= 50, progress: (s) => Math.min(100, Math.round((s.communityLikes||0) / 50 * 100)), progressText: (s) => `${s.communityLikes||0}/50` },
    { id: 'weekly_champion', name: '家庭周冠军', emoji: '🥇', condition: (s) => s.weekChampion >= 1, progress: (s) => Math.min(100, Math.round((s.weekChampion||0) * 100)), progressText: (s) => `${s.weekChampion||0}/1` },
    { id: 'streak_30', name: '连续30天', emoji: '🔥', condition: (s) => s.streak >= 30, progress: (s) => Math.min(100, Math.round(s.streak / 30 * 100)), progressText: (s) => `${s.streak}/30天` }
  ];

  /** 30+ 话题组（含各personality变体回复） */
  const CHAT_TOPICS = [
    // ---- science（科学）----
    {
      category: 'science',
      keywords: ['科学', '实验', '发现', '发明'],
      replies: {
        default: '科学就是探索世界为什么是这样的！每一个"为什么"的背后都藏着一个有趣的科学秘密。你想从哪个"为什么"开始探索呢？',
        curious: '哇，你也对科学感兴趣？太棒了！我最喜欢做实验了，通过观察和动手我们能发现好多神奇的事情。要不要一起来试试看？',
        magical: '你知道吗，科学其实和魔法很像！只不过科学需要我们用实验来"证明"咒语（规律）是真的。我爸爸说真正的魔法藏在科学里！',
        brave: '科学探索就像一次冒险任务！每做一个实验就像闯一关，失败了也不怕，重新再来就是了。你敢不敢接受挑战？',
        playful: '嘿嘿，科学其实超好玩的！就像玩闯关游戏一样，每个实验都是一个小关卡。来吧，我带你一起"玩"科学！',
        energetic: '太好了，来搞科学吧！我最喜欢动来动去做实验了！先把材料准备好，然后一步步按照步骤来，你会发现奇迹就在眼前！',
        cooperative: '科学探索最适合团队合作了！一个人做实验可能不够，两个人一起观察、讨论，能发现更多的秘密呢！',
        gentle: '科学是了解大自然最温柔的方式。当我们用心去观察一朵花、一只蝴蝶，就能发现很多生命的小秘密。你想从哪里开始呢？',
        strategic: '科学实验需要周密的计划！先提出问题，再设计实验步骤，最后分析结果。这就是科学家的思维方法，我们一起来试试吧！',
        adventurous: '科学是通向未知世界的船票！每次实验都是一次探险，你永远不知道会发现什么惊喜。准备好了吗？出发！',
        creative: '科学实验和艺术创作一样有趣！有时候不按常规来操作，反而能发现意想不到的结果。发挥你的创造力来探索吧！'
      }
    },
    // ---- space（太空）----
    {
      category: 'space',
      keywords: ['太空', '星球', '宇宙', '火箭', '太阳系', '黑洞', '星系', '月球', '火星', '宇航'],
      replies: {
        default: '太空真是太奇妙了！宇宙里有无数颗星星，还有神秘的黑洞和美丽的星云。你对太空的哪个秘密最感兴趣呢？',
        curious: '太空里有好多未解之谜呢！你知道太阳比地球大130万倍吗？而且光从太阳到地球要8分钟！还有更多有趣的事实等你来发现！',
        magical: '如果有一个能让人飞到太空的魔法就好了……不过火箭已经能做到啦！宇航员在太空里就像魔法师一样，可以飘在空中！',
        brave: '去太空旅行可是终极冒险任务！宇航员要经过严格训练才能上天。他们的勇气和毅力值得我们学习！你以后想当宇航员吗？',
        playful: '太空就像一个超级大的游乐场！在那里你可以飘来飘去，吃东西都是飘着的！你想不想去太空玩一圈？',
        energetic: '太空探险太刺激了！3-2-1，发射！火箭冲上太空的那一刻超震撼！你知道吗？火箭的速度能达到每秒7.9公里呢！',
        cooperative: '去太空可不容易，需要好多好多人的团队合作！科学家、工程师、医生都在一起努力。这告诉我们，大目标需要大团队！',
        gentle: '在太空中看地球，就像一颗蓝色的玻璃球，那么美丽又那么脆弱。宇航员说从太空中看到的地球让他们更加热爱这颗星球。',
        strategic: '去太空需要精确的计算和周密的计划！每一个细节都不能出错，一个小失误就可能造成大问题。这就是为什么太空探索需要最聪明的头脑。',
        adventurous: '宇宙是人类最后的边疆！从月球到火星，再到更远的星系，每一步都是人类勇气的证明。你准备好开启太空冒险了吗？',
        creative: '想象一下，如果在火星上建一座城市会是什么样？红色的沙漠、蓝色的穹顶、还有能在火星上生长的植物……发挥你的想象力吧！'
      }
    },
    // ---- dinosaur（恐龙）----
    {
      category: 'dinosaur',
      keywords: ['恐龙', '霸王龙', '三角龙', '翼龙', '侏罗纪', '化石'],
      replies: {
        default: '恐龙是地球上最有趣的古代动物之一！它们统治了地球1.6亿年，最后因为一颗小行星撞击地球而灭绝了。',
        curious: '你知道吗，霸王龙的头骨有一米多长，牙齿有香蕉那么大！但它的小短手只能举起大概200斤重的东西。恐龙还有好多有趣的事实呢！',
        magical: '恐龙就像魔法故事里的巨龙一样！不过它们是真实存在的！科学家通过化石还原了它们的样子，就像用魔法让时间倒流一样。',
        brave: '霸王龙是恐龙中的王者，但三角龙也不怕它，头上的角就是最好的武器！每种恐龙都有自己的"战斗方式"，这就是大自然的法则。',
        playful: '如果恐龙还在就好了，我们可以骑着恐龙上学！不过……霸王龙可能不太适合当坐骑，它的手臂太短了，抱不住你！',
        energetic: '恐龙时代一定超刺激！巨大的蜥脚龙能长到30米长，比5层楼还高！想想看，和它们站在一起是什么感觉？',
        cooperative: '科学家们通过团队合作才拼出了恐龙的完整故事！古生物学家、地质学家、化学家一起研究化石，才让我们了解到这么多恐龙的知识。',
        gentle: '有些恐龙其实很温柔哦，比如三角龙是吃植物的，它们像现在的大象一样温和。大自然里有温柔的巨人，也有凶猛的猎手。',
        strategic: '恐龙灭绝给了我们重要的启示——物种需要适应环境变化。小行星撞击后，食物链断裂，不能适应的恐龙就消失了。生存需要策略！',
        adventurous: '恐龙化石的发现就像一场探险！科学家在沙漠、极地、山地到处寻找化石的踪迹。每一次发现都可能改写我们对恐龙的认知！',
        creative: '如果让你设计一只恐龙，你会怎么设计？大的还是小的？吃肉还是吃素？有翅膀还是有铠甲？发挥想象力，创造属于你的恐龙吧！'
      }
    },
    // ---- animal（动物）----
    {
      category: 'animal',
      keywords: ['动物', '海洋', '鱼', '宠物', '猫', '狗', '鸟', '昆虫', '蝴蝶', '蚂蚁'],
      replies: {
        default: '动物世界真是神奇！从最小的蚂蚁到最大的蓝鲸，每一种动物都有自己独特的能力。你最喜欢什么动物呢？',
        curious: '我最喜欢了解动物的秘密了！比如你知道章鱼有三颗心脏、九个大脑吗？还有变色龙的眼球可以独立转动，太酷了！',
        magical: '有些动物简直就像有魔法一样！比如水母可以发光，壁虎可以再生尾巴，飞鱼可以在水面上滑翔。大自然就是最好的魔法师！',
        brave: '在动物界，勇气很重要！蜜獾是"最无所畏惧的动物"，连毒蛇都不怕。当然，勇气也要和智慧结合起来才能生存下去。',
        playful: '动物们也会玩耍呢！海獭睡觉时会手牵手防止被水流冲散，海豚喜欢冲浪，乌鸦还会滑雪！它们比我们想象的更会玩！',
        energetic: '动物界有好多"运动冠军"！猎豹每小时能跑112公里，跳蚤能跳自己身高200倍的高度，旗鱼游泳时速110公里！你想知道更多吗？',
        cooperative: '动物之间的合作令人惊叹！蚂蚁分工合作建造复杂的巢穴，狼群一起狩猎，海豚会帮助受伤的同伴。团结就是力量！',
        gentle: '每种动物都是大自然的宝贝。即使是小小的蝴蝶，它的翅膀上也有精致的图案，像一幅美丽的画。让我们一起爱护它们吧。',
        strategic: '动物为了生存发展出了很多策略！比如伪装术——变色龙能变颜色融入环境，枯叶蝶看起来就像一片枯叶。生存需要智慧！',
        adventurous: '地球上还有很多动物没有被人类发现！科学家估计地球上有约870万种动物，我们只认识了一小部分。探索永不止步！',
        creative: '如果动物们有一个超级英雄联盟，你觉得谁会是队长？大象的力量、海豚的智慧、猎豹的速度、鸟类的飞翔能力……组合起来太强大了！'
      }
    },
    // ---- math（数学）----
    {
      category: 'math',
      keywords: ['数学', '数字', '加减', '乘除', '几何', '分数', '算术'],
      replies: {
        default: '数学是科学的语言，也是我们理解世界的重要工具！从数数到复杂的方程，数学帮助我们解决生活中的各种问题。',
        curious: '数学里有好多有趣的东西呢！你知道圆周率π永远不会结束吗？人们已经算出了几十万亿位数字，但还是没有尽头！数学充满了惊喜！',
        magical: '数学有时候就像魔法！你看，一个简单的公式就能预测行星的轨道，一条对称线就能画出美丽的图案。数学是宇宙的魔法语言！',
        brave: '数学难题就像boss战！一步一步分析，找到方法，就能打败它。每次解出一道难题，你都会变得更强大！敢来挑战吗？',
        playful: '数学也可以很好玩哦！用骰子玩游戏就是在学概率，搭积木就是在学几何，分蛋糕就是在学分数。数学就在我们身边！',
        energetic: '来！我们来做一个数学挑战！比如，算一算如果你每天存1块钱，一年能存多少？365块！数学让我们更清楚地看世界！',
        cooperative: '数学问题有时候一个人想不出来，但几个人一起讨论就豁然开朗了！这就是为什么课堂上要小组讨论数学题的原因。',
        gentle: '数学不需要着急，慢慢来。就像搭积木一样，一块一块稳稳地放上去，就能建成漂亮的高楼。每个数字都有它的位置。',
        strategic: '数学最重要的就是逻辑思维！遇到复杂问题时，把它拆成小问题，一个个解决。这种分而治之的策略，在数学和生活中都很有用。',
        adventurous: '数学是一片等待探索的大陆！从基础的加减法到神奇的几何，每往前走一步都有新的风景。让我们一起踏上数学探险之旅吧！',
        creative: '数学和艺术其实很亲近！用数学可以画出美丽的分形图案，用几何可以设计建筑，音乐中也藏着数学的节奏。数学就是创造力的基石！'
      }
    },
    // ---- history（历史）----
    {
      category: 'history',
      keywords: ['历史', '古代', '朝代', '皇帝', '战争', '长城', '金字塔'],
      replies: {
        default: '历史就像一个巨大的故事书，里面记录了人类几千年来的喜怒哀乐。从古代文明到现代社会，每一段历史都值得了解。',
        curious: '你知道吗，中国的长城如果连起来，总长度超过2万公里！它不是一次建成的，而是从春秋战国开始，历经多个朝代修建的。',
        magical: '古埃及的金字塔充满了神秘色彩！最大的胡夫金字塔用了大约230万块石头，每块石头重约2.5吨，古代人是怎么做到的？至今还是谜！',
        brave: '历史上有很多勇敢的人！比如郑和七次下西洋，带领船队航行到非洲，比哥伦布发现美洲早了近100年。勇气改变历史！',
        playful: '如果可以穿越时空，你想去哪个朝代看看？唐朝可以吃好吃的，宋朝可以逛夜市，明朝可以看长城……不过别忘了带手机充电器！',
        energetic: '历史一点也不无聊！想想看，几千年前的人们没有手机、没有电，但他们建造了金字塔、发明了造纸术和火药。人类的创造力真是无穷！',
        cooperative: '历史上很多伟大的成就都是团队合作的结果！长城的修建、金字塔的建造、丝绸之路的开辟，都需要成千上万的人一起努力。',
        gentle: '读历史让我们更理解今天的世界。每个朝代的兴起和衰落都有原因，每场战争背后都有普通人的故事。了解过去，珍惜现在。',
        strategic: '历史告诉我们很多策略和智慧！比如孙子兵法至今还被用在商业和体育中。学习历史，就是学习前人的智慧结晶。',
        adventurous: '考古就像是一场寻宝冒险！考古学家在地下挖掘，每一次发现都可能揭示一段被遗忘的历史。也许有一天你也能参与考古！',
        creative: '如果让你当一天皇帝，你会做什么？颁布什么法令？建造什么建筑？想象一下，用你的创意去治理一个古代帝国！'
      }
    },
    // ---- craft（手工）----
    {
      category: 'craft',
      keywords: ['手工', '做', '折纸', '画画', 'DIY', '制作', '涂色', '剪纸'],
      replies: {
        default: '手工创作是锻炼创造力和动手能力的好方法！不管是折纸、画画还是做模型，每一件作品都独一无二。',
        curious: '你知道吗，折纸不仅仅是玩！科学家用折纸的原理来设计太阳能板和太空望远镜的展开结构。手工和科学也能完美结合！',
        magical: '每次做手工就像施展一次小小的魔法！一张平平的纸，经过你的手，就能变成一只会飞的纸鹤，这难道不神奇吗？',
        brave: '做手工需要勇气！尤其是第一次尝试新东西的时候，可能会做得不完美。但没关系，大胆去做，每一步都在进步！',
        playful: '做手工最好玩的地方就是可以发挥想象力！你想做一个什么？超级英雄？外星人？还是一座糖果城堡？一起动手吧！',
        energetic: '来，做一个超酷的手工吧！先准备好材料，然后跟着步骤一步步来。你会发现自己比想象中更有创意！',
        cooperative: '合作做手工特别有意思！一个人负责画，一个人负责剪，一个人负责组装。分工合作，做出来的东西更棒！',
        gentle: '做手工是一件让人静下心来的事情。慢慢折、慢慢画，享受创作的每一刻。不用着急，每一笔都是独一无二的。',
        strategic: '做手工之前最好先做个计划！想想用什么材料、按什么步骤、最终要做成什么样。好的计划能让作品更加精美。',
        adventurous: '手工创作是一场小小的冒险！你永远不知道最后做出来会是什么样子。有时候"意外"反而会创造出最独特的作品！',
        creative: '手工没有标准答案！你可以自由发挥，用任何材料、任何方法来创作。打破常规，做一件从来没有人做过的作品吧！'
      }
    },
    // ---- music（音乐）----
    {
      category: 'music',
      keywords: ['音乐', '唱歌', '乐器', '钢琴', '吉他', '跳舞', '舞蹈'],
      replies: {
        default: '音乐是一种全世界通用的语言！不管是唱歌、弹琴还是跳舞，音乐都能表达我们的情感，传递快乐。',
        curious: '你知道吗，音乐和数学有很大关系！一个八度音程中，频率的比例正好是2:1。难怪有人说数学家和音乐家有很多相似之处！',
        magical: '音乐就像魔法咒语一样！一段旋律可以让你开心，也可以让你感动。闭上眼睛听音乐，就像进入了一个魔法世界！',
        brave: '上台表演需要很大的勇气！如果你愿意在人前唱歌或演奏，你就是一个勇敢的音乐家。每一次表演都让你更自信！',
        playful: '来来来，我们一起唱歌吧！不需要唱得完美，开心就好！你想唱什么歌？我可以陪你一起唱！🎵',
        energetic: '音乐和运动是最佳搭档！跟着音乐跳舞、跑步，会让你更有力量！科学研究也证明，音乐能提升运动表现！',
        cooperative: '合唱和乐队就是最好的团队合作例子！每个人都唱自己的声部，合在一起就变成了美妙的和弦。这就是协作的力量！',
        gentle: '轻柔的音乐能让人感到平静和安心。在忙碌的学习之后，听一首舒缓的曲子，就像给自己一个温暖的拥抱。',
        strategic: '学习乐器需要策略和耐心！每天练习一点点，比一次练很久效果更好。制定一个小计划，你一定可以进步！',
        adventurous: '世界上有好多不同风格的音乐！中国的古琴、非洲的鼓、巴西的桑巴……每一种都有独特的魅力。想去"旅行"听一听吗？',
        creative: '你可以自己创作一首歌！不需要多复杂，把你想说的话编成歌词，配上简单的旋律，就是一首属于你的原创歌曲！'
      }
    },
    // ---- sports（体育）----
    {
      category: 'sports',
      keywords: ['体育', '运动', '足球', '篮球', '游泳', '跑步', '奥运', '比赛'],
      replies: {
        default: '运动不仅能让我们身体更健康，还能培养坚持不懈的精神。你最喜欢什么运动呢？',
        curious: '你知道吗？篮球刚发明的时候是用装桃子的篮子当球筐的，每次进球还要用人爬上去把球取下来！运动的历史也很有趣呢！',
        magical: '奥运会的火炬传递就像一次魔法旅程！火焰从一个城市到另一个城市，最终照亮整个体育场，这就是团结的魔法！',
        brave: '运动员的精神就是永不放弃！不管比赛领先还是落后，都要拼到最后一刻。这种精神在学习和生活中也同样重要！',
        playful: '运动就像一场大型真人游戏！跑步是追逐赛，篮球是团队副本，游泳是水下冒险……你想玩哪个"游戏"？',
        energetic: '运动太棒了！打一场篮球、跑几圈操场，出汗的感觉超爽！运动完头脑更清醒，学习效率也更高！来动起来吧！',
        cooperative: '团队运动教会我们最重要的东西——信任队友！足球场上的传球、篮球场上的助攻，都是因为信任才能完成。',
        gentle: '运动不一定要很激烈，散步、瑜伽、拉伸都很棒。重要的是坚持，每天动一动，身体会感谢你的。',
        strategic: '团队运动充满了策略！足球的阵型、篮球的战术、排球的轮转……运动和下棋一样，都需要动脑筋！',
        adventurous: '世界上有好多超酷的运动！攀岩、冲浪、跳伞……虽然我们现在可能还不能做，但总有一天可以尝试！',
        creative: '你可以发明一种新的运动！比如把足球和躲避球结合起来，或者用气球代替网球。谁知道呢，也许你会创造下一个热门运动！'
      }
    },
    // ---- earth（地球环保）----
    {
      category: 'earth',
      keywords: ['地球', '环保', '回收', '垃圾', '污染', '气候', '绿色'],
      replies: {
        default: '地球是我们唯一的家园！保护环境是每个人的责任。哪怕是很小的行动，比如垃圾分类、节约用水，都是在保护地球。',
        curious: '你知道塑料袋在自然中需要400年才能分解吗？而一个玻璃瓶需要200万年！回收利用真的太重要了，每一个小行动都很有意义。',
        magical: '大自然有自己的"治愈魔法"！如果我们减少污染，大自然会慢慢恢复生机——河流变清、森林变绿、动物回来。我们只需要给她时间。',
        brave: '保护环境需要勇气！有时候需要做出改变，比如减少使用一次性塑料、选择环保出行方式。这些改变虽然小，但影响很大！',
        playful: '环保也可以很好玩！比如用废旧的瓶子和罐子做手工艺品，既环保又有创意。来一起做"废物利用大变身"吧！',
        energetic: '来！从今天开始做一个"环保小卫士"！随手关灯、节约用水、少用塑料袋，这些都是我们可以做到的小事，但合在一起就是大力量！',
        cooperative: '保护地球需要全世界的人一起努力！一个人做的可能有限，但70亿人一起行动，就能改变整个世界。团结就是力量！',
        gentle: '地球就像我们的妈妈，她默默地养育着所有的生命。爱护地球，就是爱护我们自己和我们爱的人。让我们的家园更美丽吧。',
        strategic: '环保需要长远的策略！不能只想着今天方便，要想想明天会怎样。可持续发展就是为未来做打算，让地球保持健康。',
        adventurous: '探索自然本身就是一种冒险！走进森林、观察海洋、攀登高山……当你亲眼看到大自然的美丽，就会更想要保护她！',
        creative: '你可以用创意来帮助地球！设计一个环保发明，画一幅环保主题的画，或者写一个关于地球的故事。用你的方式传播环保理念！'
      }
    },
    // ---- plant（植物）----
    {
      category: 'plant',
      keywords: ['植物', '花', '树', '种子', '花园', '种植', '水果', '蔬菜'],
      replies: {
        default: '植物是大自然的艺术家！它们不仅能美化环境，还能净化空气、提供食物。你有没有尝试过种一盆小植物呢？',
        curious: '你知道吗？向日葵会跟着太阳转方向，这叫做"向光性"！还有含羞草，碰到它叶子就会合起来，就像害羞了一样！植物的秘密可多了！',
        magical: '一颗小小的种子，只要有水和阳光，就能长成一棵大树。这不就是最厉害的魔法吗？种子的力量超乎想象！',
        brave: '植物虽然没有脚，但它们也有自己的"冒险精神"！藤蔓能爬上高楼，种子能随风飘到很远的地方。生命的力量令人敬佩！',
        playful: '种东西超好玩的！就像玩养成游戏一样，你给它浇水、晒太阳，看着它一天天长大。如果种西红柿，最后还能吃呢！',
        energetic: '春天来了，万物都在生长！竹子一天能长将近1米，是世界上生长最快的植物！这种蓬勃的生命力太让人振奋了！',
        cooperative: '植物和周围的环境互相合作！花和蜜蜂合作授粉，树根和真菌合作吸收营养。大自然的合作之道值得我们学习。',
        gentle: '照顾植物是一件温柔的事情。每天给它浇浇水、说说话，它就会用最美丽的花朵回报你。用心浇灌，静待花开。',
        strategic: '种植需要策略！不同植物需要不同的光照、水分和土壤。了解每种植物的需求，制定合适的种植计划，才能种得好。',
        adventurous: '世界上有很多奇特的植物！比如捕蝇草会"吃"虫子，大王花是世界上最大的花，直径能达到1米！大自然真神奇！',
        creative: '你可以设计一个梦想花园！种上你最喜欢的花和蔬菜，搭一个小凉亭，铺一条石子路。用你的创意打造一个绿色的小天地！'
      }
    },
    // ---- weather（天气）----
    {
      category: 'weather',
      keywords: ['天气', '下雨', '彩虹', '打雷', '闪电', '云', '风', '雪'],
      replies: {
        default: '天气是大气层里最神奇的现象之一！晴天、雨天、雪天、彩虹……每种天气都有科学原理。你想了解哪种天气的秘密？',
        curious: '你知道彩虹其实是一个完整的圆环吗？我们从地面上只能看到半圆，但如果从飞机上看，就能看到完整的圆形彩虹！太神奇了！',
        magical: '闪电就像是天空中的魔法！一次闪电的温度可以达到太阳表面温度的5倍！而且闪电的形状每次都不一样，每一条都是独一无二的。',
        brave: '暴风雨来临的时候不要害怕！那只是大自然在"做运动"。了解天气变化的规律，你就能提前做好准备，做一个勇敢的"天气预报员"。',
        playful: '你知道怎么计算离雷暴有多远吗？看到闪电后数秒数，除以3就是大约的公里数！下次下雨的时候可以试试这个小游戏！',
        energetic: '大风天虽然有点可怕，但也很有趣！风筝就是在风天放的最好！还有风力发电，利用风的力量给我们供电，太厉害了！',
        cooperative: '天气预报需要全世界气象站的合作！各地观测数据汇总到一起，才能准确预测天气。这又是合作力量的体现！',
        gentle: '下雨的时候，听听雨声，是很治愈的事情。每一滴雨水都是大自然的音符，组成一首美妙的交响曲。闭上眼睛感受一下吧。',
        strategic: '了解天气规律对农民伯伯来说很重要！什么时候播种、什么时候收割，都要看天气。掌握天气知识，就是掌握了农业的策略。',
        adventurous: '龙卷风是地球上最猛烈的风暴！风速可达每小时500公里！虽然很危险，但了解它的形成过程就像一场科学探险！',
        creative: '如果可以控制天气，你会做什么？让沙漠下雪？给干旱的地方下雨？想象一下，你可以设计一个"天气控制器"！'
      }
    },
    // ---- greeting（问候）----
    {
      category: 'greeting',
      keywords: ['你好', '嗨', '早上好', '下午好', '晚上好', '在吗', 'hello', 'hi'],
      replies: {
        default: '你好呀！很高兴见到你！今天想聊些什么？不管什么话题我都愿意陪你聊！',
        curious: '你好！太好了，又有人来找我了！今天我满脑子都是问题想和你一起探讨，你有什么好奇的事情吗？',
        magical: '你好！欢迎来到奇妙世界！今天我们要施展什么"魔法"呢？每个话题都是一次奇妙的旅程！',
        brave: '你好！精神满满地准备出发！今天有什么新挑战等着我们？一起来吧！',
        playful: '嗨嗨嗨！你来啦！太好了，我正等着有人陪我玩呢！今天想聊什么？聊什么我都开心！',
        energetic: '你好呀！充满能量的一天开始了！今天我们做什么都行，只要够精彩！来吧来吧！',
        cooperative: '你好！两个人一起聊天总能聊出更有趣的内容。你有什么想法？我们一起来讨论吧！',
        gentle: '你好呀，真高兴见到你。今天过得怎么样？如果有什么想分享的，我随时都在这里哦。',
        strategic: '你好！有什么新计划吗？今天我们可以制定一个有趣的学习计划，一起高效地完成它！',
        adventurous: '嗨！准备好今天的冒险了吗？每次聊天都是一次新探索，让我们开始吧！',
        creative: '你好！今天你的小脑袋里有什么好点子？让我们一起来碰撞出创意的火花吧！'
      }
    },
    // ---- thanks（感谢）----
    {
      category: 'thanks',
      keywords: ['谢谢', '感谢', '太好了', '厉害', '棒', '赞'],
      replies: {
        default: '不客气！能帮到你我很开心！如果你还有其他问题，随时来找我聊天哦！',
        curious: '谢谢你！你的鼓励让我更有动力去探索更多有趣的知识！还有什么想了解的吗？',
        magical: '哎呀，被夸了感觉好开心！就像施展了一个快乐魔法！你的笑容就是最好的奖励！',
        brave: '哈哈，谢谢！你的认可给了我继续前进的力量！我们继续加油吧！',
        playful: '嘻嘻，被夸的感觉真好！你也是超棒的！我们两个都是最厉害的！还有想聊的吗？',
        energetic: '谢谢！有你这样的伙伴一起学习，感觉更有力量了！冲啊！继续探索！',
        cooperative: '能和你一起学习我也很开心！互相鼓励，一起进步，这就是最好的合作方式！',
        gentle: '谢谢你的感谢，让我觉得做的事情都有意义。能帮到你是我最大的快乐。',
        strategic: '收到你的反馈！这让我知道哪些方面做得不错，哪些可以改进。互相学习，一起成长！',
        adventurous: '谢谢！每次收到你的鼓励，就像探险路上补给了一箱宝藏！继续前行！',
        creative: '谢谢！你的鼓励就像一束灵感的光！让我们一起创造更多有趣的东西吧！'
      }
    },
    // ---- goodbye（再见）----
    {
      category: 'goodbye',
      keywords: ['再见', '拜拜', '下次见', 'bye'],
      replies: {
        default: '再见！和你聊天真开心！记得明天再来找我，每天都有新知识等你来探索哦！',
        curious: '拜拜！今天学到了好多新东西，但我还有更多好奇的问题！明天见，我们继续探索！',
        magical: '再见了！今天的"魔法课堂"结束啦，但魔法的秘密还在等着你下次来发现哦！',
        brave: '再见！今天的任务圆满完成！好好休息，明天有新的冒险在等着我们！',
        playful: '拜拜拜拜！今天玩得超开心！记得明天再来找我玩哦！',
        energetic: '再见！今天能量满满！回去好好休息补充能量，明天继续出发！',
        cooperative: '再见！和你一起度过的时光很棒！期待下次见面，我们继续合作！',
        gentle: '再见呀，期待下次再见到你。记得照顾好自己，做个好梦哦。',
        strategic: '再见！今天的计划完成得不错。回去好好想想明天的计划，我们下次继续！',
        adventurous: '拜拜！今天的探险告一段落，但冒险永远不会结束！期待下次出发！',
        creative: '再见！今天创作的灵感已经种下了。好好休息，下次来让灵感继续绽放！'
      }
    },
    // ---- magic（魔法）----
    {
      category: 'magic',
      keywords: ['魔法', '咒语', '巫师', '哈利', '霍格沃茨', '魔杖'],
      replies: {
        default: '魔法世界真让人着迷！虽然现实中的魔法不存在，但科学有时候比魔法更神奇。你想了解哪个"魔法秘密"？',
        curious: '说到魔法，你知道吗？激光看起来就像真的魔法光束，但其实它是一种特殊的光！全息影像也很像魔法，但背后是光学原理！',
        magical: ' Lumos！（点亮魔杖！）在现实世界中，电灯就是我们的"Lumos"！而"Accio"召唤术？其实GPS和快递就做到了！',
        brave: '在魔法故事中，最强大的魔法不是咒语，而是勇气和友谊。哈利波特之所以能打败伏地魔，不是因为他最强大，而是因为他有朋友和勇气。',
        playful: '如果你有魔杖，你最想施展什么魔法？飞上天？让作业消失？还是变出吃不完的冰淇淋？哈哈，想一想就觉得好玩！',
        energetic: '霍格沃茨有四大学院，你觉得你会被分到哪个？格兰芬多的勇敢？斯莱特林的精明？拉文克劳的智慧？还是赫奇帕奇的忠诚？',
        cooperative: '哈利波特的成功离不开朋友们的帮助！罗恩的忠诚、赫敏的智慧、纳威的勇气。这些故事告诉我们团队合作有多重要。',
        gentle: '魔法故事最感人的部分不是咒语的威力，而是爱与善良的力量。莉莉的爱保护了哈利，这个主题贯穿了整个故事。',
        strategic: '下巫师棋需要很强的策略！就像国际象棋一样，每一步都要想好几步之后的结果。哈利在巫师棋中学会了牺牲和策略。',
        adventurous: '魔法世界充满了冒险！禁林中的秘密、密室里的谜题、魔法部的迷宫……每一个角落都有未知的挑战等着你！',
        creative: '如果让你设计一个魔法咒语，你会怎么设计？咒语叫什么名字？有什么效果？让我听听你的创意！'
      }
    },
    // ---- game（游戏）----
    {
      category: 'game',
      keywords: ['游戏', '玩', '闯关', '挑战', '关卡', '升级'],
      replies: {
        default: '游戏是一种很好的学习方式！很多游戏能锻炼我们的反应力、策略思维和创造力。你最喜欢玩什么游戏？',
        curious: '你知道吗？很多游戏的原理都和数学有关！比如俄罗斯方块用了几何和空间思维，消消乐用了模式识别。玩游戏其实在锻炼大脑！',
        magical: '游戏世界就像一个魔法王国！在里面你可以成为任何人——勇士、法师、建筑师……游戏的魅力就在于无限的可能性！',
        brave: '游戏中的闯关精神和现实中的学习精神是一样的！不放弃、多尝试、找方法，最终一定能过关！',
        playful: '来玩个思维游戏吧！我出题你来答，答对了得积分！准备好了吗？Let\'s go！',
        energetic: '玩游戏就是要全力以赴！不过也要注意休息，别玩太久哦。适度游戏有益，过度游戏伤身！',
        cooperative: '多人游戏最能体现团队合作了！和队友配合、制定战术、分工协作，这些能力和学习、工作都息息相关！',
        gentle: '玩游戏最重要的是开心。赢了固然好，输了也不必沮丧。享受游戏的过程，比结果更重要。',
        strategic: '策略游戏的魅力在于让你学会思考！资源管理、时间规划、风险评估……这些思维方法在生活中也很有用。',
        adventurous: '开放世界游戏就像一场自由探险！你可以去任何地方、做任何事情。就像学习一样，你永远不知道下一步会发现什么惊喜。',
        creative: '沙盒游戏（比如方块世界）最能发挥创造力了！你可以建造任何你能想到的东西。用方块建一座城堡，还是一座城市？'
      }
    },
    // ---- food（食物）----
    {
      category: 'food',
      keywords: ['食物', '吃', '做饭', '菜', '水果', '营养', '厨房'],
      replies: {
        default: '好吃的食物让人心情愉悦！了解食物和营养知识，能帮助我们吃得更健康。你有什么喜欢的食物吗？',
        curious: '你知道吗？香蕉其实是一种"浆果"，而草莓不是！在植物学中，浆果的定义和我们想象的不一样！食物的科学可有趣了！',
        magical: '厨房就像一个魔法实验室！把面粉、鸡蛋和糖混在一起，放进烤箱，出来就是一个蛋糕！这不就是魔法吗？',
        brave: '尝试新食物也是一种冒险精神！你可能发现一个新大陆——比如第一次吃榴莲，第一次尝试辣味料理。勇敢地尝一尝吧！',
        playful: '做饭超好玩的！就像玩"材料合成"游戏，把不同的食材组合在一起，看看能创造出什么美味！你最喜欢做什么菜？',
        energetic: '吃得好才能有充足的能量！均衡饮食很重要——蛋白质给你力量，维生素给你免疫力，碳水化合物给你活力！',
        cooperative: '一起做饭是最棒的家庭活动！一个人洗菜，一个人切菜，一个人掌勺。做出来的饭菜特别香，因为是"爱的味道"！',
        gentle: '用心做的食物最美味。不一定要做复杂的菜，简单的番茄炒蛋，加上满满的心意，就是世界上最好吃的菜。',
        strategic: '健康饮食需要策略！彩虹饮食法——每天吃不同颜色的水果和蔬菜，就能获得均衡的营养。这就是饮食的策略！',
        adventurous: '世界各地有好多奇特的美食！日本的纳豆、墨西哥的虫子玉米饼、法国的蜗牛……你想不想来一场"美食冒险"？',
        creative: '你可以发明一道新菜！选3-5种你喜欢的食材，想想怎么搭配。也许你会创造出下一个"网红美食"！'
      }
    },
    // ---- tech（科技AI）----
    {
      category: 'tech',
      keywords: ['机器人', 'AI', '人工智能', '编程', '代码', '计算机'],
      replies: {
        default: 'AI（人工智能）正在改变我们的世界！从语音助手到自动驾驶，AI已经融入生活的方方面面。你想了解AI的什么知识？',
        curious: '你知道AI是怎么"学习"的吗？就像你通过做练习题来学习一样，AI通过看大量的"例子"来学习规律。看得越多，就越"聪明"！',
        magical: 'AI就像现代的魔法！你说一句话，手机就能听懂并回答你。它背后没有魔法师，只有聪明的算法和大量的数据！',
        brave: '学习AI需要勇气面对复杂的概念！但不用怕，我们可以从简单的地方开始。用生活中的例子来理解AI，就不那么难了！',
        playful: '你知道吗？你其实已经在用AI了！智能推荐、人脸识别、语音助手……AI就在你身边，像一个小助手一样默默工作！',
        energetic: 'AI的发展速度超快！从几十年前只能做简单计算，到现在能画画、写文章、下棋……而且越来越厉害！这真是太让人兴奋了！',
        cooperative: 'AI是人类的好帮手，不是竞争对手！人和AI合作能做出很多了不起的事情。医生用AI辅助诊断，科学家用AI加速发现。',
        gentle: 'AI虽然很聪明，但它没有感情和创意——至少目前还没有。真正温暖和有创意的，永远是我们人类自己。',
        strategic: '学习编程就像学习一门新语言！它教会我们如何用逻辑来解决问题。学编程最重要的不是用什么语言，而是思维方式。',
        adventurous: 'AI的未来充满了无限可能！也许有一天，AI能帮我们解决气候变化问题，或者帮助人类探索外太空。冒险才刚刚开始！',
        creative: 'AI是创作者的新工具！用AI可以辅助画画、写故事、做音乐。虽然AI能帮忙，但最核心的创意还是来自你自己的想象力！'
      }
    },
    // ---- body（人体）----
    {
      category: 'body',
      keywords: ['人体', '身体', '大脑', '眼睛', '心脏', '骨骼', '肌肉'],
      replies: {
        default: '我们的身体是世界上最精密的"机器"！从大脑到脚趾，每一个部分都有不可思议的功能。你想了解身体的哪个秘密？',
        curious: '你知道吗？你的大脑大约有860亿个神经元，它们之间的连接比银河系的星星还多！大脑每秒钟能处理上百万条信息！太不可思议了！',
        magical: '人体的自我修复能力就像魔法一样！皮肤被割破了会自动愈合，骨折了骨头会长回去。这就是生命最神奇的"魔法"！',
        brave: '你知道吗？人体有206块骨头！最强壮的骨头是大腿骨，它的硬度堪比混凝土！但就算再强壮的骨头，也需要好好保护。',
        playful: '来数一数你的骨头吧！不用真的数，我告诉你答案——206块！而且刚出生的婴儿有300块骨头，后来有些长在一起了！',
        energetic: '运动能让你的肌肉越来越强壮！肌肉就像橡皮筋，越用越有弹性。但别忘了休息，休息时肌肉才会真正生长！',
        cooperative: '人体的各个器官就像一支默契的团队！心脏负责供血，肺负责供氧，大脑负责指挥。缺了谁都不行！完美的团队合作！',
        gentle: '好好照顾你的身体吧！按时吃饭、保证睡眠、多运动。你的身体会一直陪伴你，值得你温柔地对待它。',
        strategic: '了解身体的结构和功能，就像了解一台精密仪器的说明书。掌握了"人体说明书"，你就能更好地使用和保护自己。',
        adventurous: '微观的人体世界就像一个宇宙！血液中的红细胞就像小宇宙飞船，在血管"星际高速公路"上高速飞驰，运送氧气到全身！',
        creative: '如果让你设计一个"超级身体"，你会怎么改进？超级视力？超强记忆力？还是能像鸟一样飞翔？发挥想象力吧！'
      }
    },
    // ---- water（水）----
    {
      category: 'water',
      keywords: ['水', '冰', '河流', '海洋', '游泳', '潜水'],
      replies: {
        default: '水是生命之源！地球上71%的面积都被水覆盖，但我们能直接饮用的淡水只占1%左右。水资源真的很珍贵呢！',
        curious: '你知道吗？地球上所有的水如果做成一个球，直径大约只有1385公里——比月球还小！但就是这点水养育了所有的生命。',
        magical: '水有一种超神奇的特性：它是少数几种固态（冰）比液态（水）密度小的物质之一！所以冰能浮在水面上，保护水里的生物度过冬天。',
        brave: '深海潜水是最勇敢的探险之一！海底一万多米的地方有生命存在，虽然那里又黑又冷，压力极大。生命的力量令人敬畏！',
        playful: '水可以变成好多形态！液态的水可以喝，固态的冰可以做冰棒，气态的水蒸气能形成云朵。水是世界上最会"变身"的东西！',
        energetic: '游泳是全身运动，能锻炼到每一块肌肉！而且在水里运动对关节更友好，不容易受伤。夏天到游泳池畅快地游一场吧！',
        cooperative: '水循环是自然界最完美的"循环系统"！水从海洋蒸发成云，变成雨降落大地，流经河流回到海洋。大自然的设计真巧妙！',
        gentle: '水的力量可以很温柔，也可以很强大。小溪潺潺流淌，滋润大地上的花草树木。让我们珍惜每一滴水吧。',
        strategic: '地球上有很多"水危机"——有些地方缺水，有些地方水被污染。我们需要制定聪明的策略来管理和保护水资源。',
        adventurous: '海洋是地球上最后的未知领域之一！人类对月球表面的了解比对海洋深处的了解还要多。海洋探险还有太多等着我们去发现！',
        creative: '水的表面张力可以让水黾（一种小虫子）在水面上行走！如果你仔细观察，水滴在叶子上是圆球形的。水充满了让人惊叹的"小魔法"！'
      }
    }
  ];

  /** 默认回复（当无话题匹配时使用） */
  const defaultReplies = {
    default: '嗯嗯，我听到了！你能说得再多一些吗？我很好奇你想聊什么话题呢？',
    curious: '有意思！这让我想到了好多问题。你能再多告诉我一些吗？我越听越好奇了！',
    magical: '每一个话题都有它独特的魔力。告诉我更多吧，让我们一起揭开这个话题的"魔法面纱"！',
    brave: '不管是什么话题，我都准备好了！说吧，我们一起面对，一起学习！',
    playful: '哈哈，这个话题听起来很有趣！来来来，多说一点，我想知道更多！',
    energetic: '嗯！继续说！你说的每一句话都让我更有动力去了解！来吧，接着聊！',
    cooperative: '你说得很好！让我们一起深入讨论这个话题吧。两个人思考总比一个人强！',
    gentle: '谢谢你跟我分享。不管聊什么，我都愿意认真地听你说。慢慢来，不着急。',
    strategic: '这个话题值得好好分析一下。你能再详细说说你的想法吗？我们一起理清思路。',
    adventurous: '又一个新的话题！太好了，让我带你一起探索！告诉我更多吧！',
    creative: '哇，你提到的话题让我想到了好多创意！展开说说看，说不定我们能碰撞出有趣的火花！'
  };

  /** 12个3D模型 */
  const MODELS_3D = {
    car: { emoji: '🚗', name: '小汽车' },
    robot: { emoji: '🤖', name: '机器人' },
    castle: { emoji: '🏰', name: '城堡' },
    dino: { emoji: '🦕', name: '恐龙' },
    rocket: { emoji: '🚀', name: '火箭' },
    boat: { emoji: '⛵', name: '帆船' },
    house: { emoji: '🏠', name: '小房子' },
    tree: { emoji: '🌳', name: '大树' },
    star: { emoji: '⭐', name: '星星' },
    heart: { emoji: '❤️', name: '爱心' },
    diamond: { emoji: '💎', name: '钻石' },
    crown: { emoji: '👑', name: '皇冠' }
  };

  /** 4个AI学习类别，每类8个活动 */
  const ACTIVITY_POOL = {
    ai_knowledge: { label: 'AI知识学习', icon: '🤖', color: '#3d8aaa', activities: [
      { title: '认识人工智能', desc: '了解什么是AI，AI能做什么不能做什么', duration: '30分钟', difficulty: '入门' },
      { title: 'AI的历史故事', desc: '从图灵测试到ChatGPT，了解AI的发展历程', duration: '30分钟', difficulty: '入门' },
      { title: '机器怎么学习？', desc: '用生活中的例子理解机器学习的基本原理', duration: '45分钟', difficulty: '基础' },
      { title: 'AI能看见什么', desc: '探索计算机视觉，了解AI如何识别图像', duration: '30分钟', difficulty: '基础' },
      { title: 'AI能听懂我们说话吗', desc: '了解语音识别和自然语言处理', duration: '30分钟', difficulty: '基础' },
      { title: 'AI和大数据', desc: '理解数据如何让AI变得更聪明', duration: '40分钟', difficulty: '进阶' },
      { title: 'AI伦理讨论', desc: '讨论AI应该做什么、不应该做什么', duration: '45分钟', difficulty: '进阶' },
      { title: '未来AI世界', desc: '想象和讨论未来AI可能带来的变化', duration: '30分钟', difficulty: '进阶' }
    ]},
    ai_practice: { label: 'AI动手实践', icon: '🛠️', color: '#c0505a', activities: [
      { title: '体验AI对话', desc: '和AI助手聊天，学会提出好问题', duration: '20分钟', difficulty: '入门' },
      { title: 'AI画画挑战', desc: '用AI工具创作一幅画，比较不同提示词的效果', duration: '30分钟', difficulty: '基础' },
      { title: 'AI写作小助手', desc: '让AI帮忙写一个小故事，然后一起修改完善', duration: '30分钟', difficulty: '基础' },
      { title: '用AI查资料', desc: '学习如何用AI搜索和整理信息', duration: '30分钟', difficulty: '基础' },
      { title: 'AI翻译官', desc: '体验AI翻译，了解不同语言的有趣差异', duration: '20分钟', difficulty: '入门' },
      { title: '制作AI漫画', desc: '用AI漫画工坊创作一个AI主题的漫画故事', duration: '45分钟', difficulty: '进阶' },
      { title: 'AI音乐创作', desc: '尝试用AI生成一段音乐或歌词', duration: '30分钟', difficulty: '进阶' },
      { title: '3D建模体验', desc: '在3D工坊中体验AI辅助的设计过程', duration: '40分钟', difficulty: '进阶' }
    ]},
    ai_thinking: { label: 'AI思维训练', icon: '🧠', color: '#4a9a5a', activities: [
      { title: '算法思维入门', desc: '用"做三明治"学习什么是算法', duration: '30分钟', difficulty: '入门' },
      { title: '数据分类游戏', desc: '像AI一样对物品进行分类，理解分类算法', duration: '25分钟', difficulty: '基础' },
      { title: 'AI决策模拟', desc: '模拟AI做决策的过程，理解条件判断', duration: '35分钟', difficulty: '基础' },
      { title: '训练一个"AI"', desc: '通过猜游戏让AI（家长扮演）学习识别图案', duration: '40分钟', difficulty: '进阶' },
      { title: '逻辑思维挑战', desc: '解决和AI相关的逻辑谜题', duration: '30分钟', difficulty: '基础' },
      { title: 'AI偏见讨论', desc: '讨论为什么AI可能会有偏见，如何避免', duration: '45分钟', difficulty: '进阶' },
      { title: '设计思维导图', desc: '围绕一个AI主题绘制知识思维导图', duration: '35分钟', difficulty: '基础' },
      { title: '编程思维启蒙', desc: '不用电脑学习编程的基本逻辑', duration: '40分钟', difficulty: '进阶' }
    ]},
    ai_creative: { label: 'AI创造展示', icon: '🌟', color: '#d48820', activities: [
      { title: '设计我的AI助手', desc: '画出你心目中理想的AI助手是什么样的', duration: '30分钟', difficulty: '入门' },
      { title: 'AI主题漫画创作', desc: '创作一幅"未来的AI家庭"主题漫画', duration: '45分钟', difficulty: '基础' },
      { title: '写一个AI故事', desc: '创作一个关于AI的短篇故事或剧本', duration: '40分钟', difficulty: '基础' },
      { title: '制作AI知识海报', desc: '把学到的AI知识做成一张漂亮的海报', duration: '45分钟', difficulty: '进阶' },
      { title: '录制AI小课堂', desc: '像小老师一样讲解一个AI知识（可录视频）', duration: '40分钟', difficulty: '进阶' },
      { title: 'AI发明设计', desc: '设计一个能解决生活中问题的AI发明', duration: '45分钟', difficulty: '进阶' },
      { title: '家庭AI作品集', desc: '整理家庭所有AI学习成果，制作作品集', duration: '50分钟', difficulty: '进阶' },
      { title: 'AI知识展示会', desc: '准备一个小型展示，向家人朋友分享AI学习成果', duration: '60分钟', difficulty: '高级' }
    ]}
  };

  /** 4个阶段主题 */
  const WEEK_THEMES = [
    { label: 'AI启蒙周', emoji: '🌱', desc: '认识AI的基本概念，激发好奇心' },
    { label: 'AI实践周', emoji: '🛠️', desc: '动手体验AI工具，在实践中学习' },
    { label: 'AI思维周', emoji: '🧠', desc: '培养AI思维，理解AI的工作原理' },
    { label: 'AI创造周', emoji: '🌟', desc: '发挥创造力，展示AI学习成果' }
  ];

  /** 每周推荐课程 */
  const WEEKLY_COURSES = [
    // Week 1-3: AI启蒙周
    { week: 0, phase: 'AI启蒙周', courses: [
      { type: 'video', title: '什么是人工智能？', duration: '5分钟', desc: '用动画告诉你AI到底是什么', source: 'AI家庭日', icon: '🎥' },
      { type: 'article', title: '5分钟读懂AI：从科幻到现实', readTime: '3分钟', desc: '简单介绍AI的发展历史和日常应用', source: 'AI家庭日', icon: '📖' },
      { type: 'video', title: 'AI就在你身边', duration: '4分钟', desc: '发现家里有哪些AI正在工作', source: 'AI家庭日', icon: '🎥' }
    ]},
    // Week 2
    { week: 1, phase: 'AI启蒙周', courses: [
      { type: 'video', title: '小明的AI伙伴', duration: '6分钟', desc: '跟着小明认识他的AI助手小智', source: 'AI家庭日', icon: '🎥' },
      { type: 'article', title: 'AI能做什么和不能做什么', readTime: '4分钟', desc: '了解AI的边界和能力范围', source: 'AI家庭日', icon: '📖' },
      { type: 'video', title: '和AI玩猜谜游戏', duration: '5分钟', desc: '体验AI如何通过学习变得聪明', source: 'AI家庭日', icon: '🎥' }
    ]},
    // Week 3
    { week: 2, phase: 'AI启蒙周', courses: [
      { type: 'article', title: 'AI安全小课堂：保护你的隐私', readTime: '5分钟', desc: '学习如何安全地使用AI产品', source: 'AI家庭日', icon: '📖' },
      { type: 'video', title: '给孩子讲的AI伦理故事', duration: '7分钟', desc: '通过故事讨论AI对错问题', source: 'AI家庭日', icon: '🎥' },
      { type: 'article', title: '家庭AI使用公约', readTime: '3分钟', desc: '全家一起制定AI使用规则', source: 'AI家庭日', icon: '📖' }
    ]},
    // Week 4-6: AI实践周
    { week: 3, phase: 'AI实践周', courses: [
      { type: 'video', title: '第一次用AI画一幅画', duration: '8分钟', desc: '手把手教你用AI绘画工具创作', source: 'AI家庭日', icon: '🎥' },
      { type: 'article', title: 'AI绘画入门指南', readTime: '5分钟', desc: '了解AI如何理解图像并生成画作', source: 'AI家庭日', icon: '📖' },
      { type: 'video', title: '用AI给全家做漫画', duration: '6分钟', desc: '创作属于你们家庭的AI漫画故事', source: 'AI家庭日', icon: '🎥' }
    ]},
    { week: 4, phase: 'AI实践周', courses: [
      { type: 'video', title: '和AI伙伴聊天的技巧', duration: '5分钟', desc: '学会向AI提问的3个好方法', source: 'AI家庭日', icon: '🎥' },
      { type: 'article', title: 'AI语音助手使用手册', readTime: '4分钟', desc: '教你用语音和AI进行自然对话', source: 'AI家庭日', icon: '📖' },
      { type: 'video', title: '3D模型工坊体验', duration: '7分钟', desc: '亲手设计一个3D模型并预览效果', source: 'AI家庭日', icon: '🎥' }
    ]},
    { week: 5, phase: 'AI实践周', courses: [
      { type: 'article', title: 'AI照片工坊：美化家庭照片', readTime: '4分钟', desc: '用AI让老照片焕发新生', source: 'AI家庭日', icon: '📖' },
      { type: 'video', title: 'AI视频创作入门', duration: '6分钟', desc: '把一张照片变成有趣的AI视频', source: 'AI家庭日', icon: '🎥' },
      { type: 'article', title: '创意灵感：AI可以这样玩', readTime: '3分钟', desc: '10个家庭AI创意玩法合集', source: 'AI家庭日', icon: '📖' }
    ]},
    // Week 7-9: AI思维周
    { week: 6, phase: 'AI思维周', courses: [
      { type: 'video', title: 'AI是怎么学习的？', duration: '8分钟', desc: '用孩子能懂的方式解释机器学习', source: 'AI家庭日', icon: '🎥' },
      { type: 'article', title: '训练一个"AI"小游戏', readTime: '5分钟', desc: '通过游戏体验AI训练过程', source: 'AI家庭日', icon: '📖' },
      { type: 'video', title: '算法原来这么简单', duration: '5分钟', desc: '用做三明治解释什么是算法', source: 'AI家庭日', icon: '🎥' }
    ]},
    { week: 7, phase: 'AI思维周', courses: [
      { type: 'article', title: '数据是什么？为什么AI需要数据', readTime: '4分钟', desc: '了解AI学习的"食物"——数据', source: 'AI家庭日', icon: '📖' },
      { type: 'video', title: 'AI如何识别一只猫', duration: '6分钟', desc: '图像识别背后的原理', source: 'AI家庭日', icon: '🎥' },
      { type: 'article', title: '计算思维培养指南', readTime: '6分钟', desc: '用5个游戏培养孩子的计算思维', source: 'AI家庭日', icon: '📖' }
    ]},
    { week: 8, phase: 'AI思维周', courses: [
      { type: 'video', title: '和AI下棋：AI如何做决策', duration: '7分钟', desc: '体验AI的策略思维能力', source: 'AI家庭日', icon: '🎥' },
      { type: 'article', title: '逻辑推理小游戏合集', readTime: '4分钟', desc: '5个锻炼逻辑思维的亲子游戏', source: 'AI家庭日', icon: '📖' },
      { type: 'video', title: '问题分解：AI解决问题的方法', duration: '5分钟', desc: '学会像AI一样拆解复杂问题', source: 'AI家庭日', icon: '🎥' }
    ]},
    // Week 10-12: AI创造周
    { week: 9, phase: 'AI创造周', courses: [
      { type: 'video', title: '设计你的AI未来城市', duration: '8分钟', desc: '用AI工具设计理想的未来城市', source: 'AI家庭日', icon: '🎥' },
      { type: 'article', title: 'AI创意项目：家庭故事书', readTime: '5分钟', desc: '用AI创作一本家庭专属故事书', source: 'AI家庭日', icon: '📖' },
      { type: 'video', title: 'AI音乐创作体验', duration: '6分钟', desc: '让AI为你的家庭创作一首歌', source: 'AI家庭日', icon: '🎥' }
    ]},
    { week: 10, phase: 'AI创造周', courses: [
      { type: 'article', title: 'AI项目展示指南', readTime: '5分钟', desc: '如何准备一场家庭AI成果展示会', source: 'AI家庭日', icon: '📖' },
      { type: 'video', title: '优秀家庭AI作品欣赏', duration: '5分钟', desc: '看看其他家庭用AI创作了什么', source: 'AI家庭日', icon: '🎥' },
      { type: 'article', title: '从学习者到创造者', readTime: '4分钟', desc: '回顾12周的成长之旅', source: 'AI家庭日', icon: '📖' }
    ]},
    { week: 11, phase: 'AI创造周', courses: [
      { type: 'video', title: 'AI家庭毕业典礼', duration: '6分钟', desc: '庆祝完成12周学习计划的成就', source: 'AI家庭日', icon: '🎥' },
      { type: 'article', title: '持续学习路线图', readTime: '5分钟', desc: '12周之后还能学什么AI知识', source: 'AI家庭日', icon: '📖' },
      { type: 'video', title: 'AI的未来：和孩子一起畅想', duration: '7分钟', desc: '讨论AI未来10年可能带来的变化', source: 'AI家庭日', icon: '🎥' }
    ]}
  ];

  /** 12条社区预设帖子 */
  const COMMUNITY_POSTS = [
    { id: 1, author: '小明家庭', avatar: '👨‍👩‍👦', content: '今天和孩子一起了解了什么是人工智能，孩子说"原来Siri就是AI！"。通过AI家庭日，我们全家第一次认真讨论了这个话题。', likes: 15, comments: 1, time: '2小时前', tags: ['AI启蒙'] },
    { id: 2, author: '朵朵家', avatar: '👩‍👧', content: '用AI漫画工坊创作了"未来的AI家庭"主题漫画，孩子画了一个会做饭的AI机器人，太有想象力了！', likes: 22, comments: 1, time: '3小时前', tags: ['AI创作'] },
    { id: 3, author: '星星探险队', avatar: '👨‍👩‍👧‍👦', content: '坚持AI家庭学习第8周了！孩子现在能分清机器学习和深度学习的区别，还能给爷爷奶奶解释什么是算法。', likes: 31, comments: 2, time: '5小时前', tags: ['学习打卡'] },
    { id: 4, author: '悠悠妈', avatar: '👩‍👦', content: '和孩子讨论了"AI该不该做某些事"的话题，孩子的观点让大人很意外——"AI不能代替妈妈讲故事"❤️', likes: 28, comments: 0, time: '6小时前', tags: ['AI伦理'] },
    { id: 5, author: 'AI小达人', avatar: '👦', content: '今天的每日一问："AI能看见什么？"孩子认真想了想，然后跑去找家里的智能摄像头说"原来你也是AI的眼睛！"', likes: 19, comments: 1, time: '8小时前', tags: ['AI探索'] },
    { id: 6, author: '未来工程师', avatar: '👨‍👧', content: '用AI助手讨论了未来会被AI改变的职业，孩子说以后要当"AI训练师"，专门教AI变得更聪明！', likes: 14, comments: 1, time: '10小时前', tags: ['AI未来'] },
    { id: 7, author: '智慧家庭', avatar: '👨‍👩‍👧', content: '全家做了一个"AI和人类的区别"的思维导图，贴在了学习墙上。每周都会更新一次，看着知识树越来越茂盛很有成就感！', likes: 25, comments: 1, time: '12小时前', tags: ['学习方法'] },
    { id: 8, author: '乐乐家', avatar: '👩‍👧‍👦', content: '学习了AI安全和隐私后，孩子主动要求把智能音箱从卧室移到客厅，说"AI不应该一直听着我们睡觉"。', likes: 35, comments: 2, time: '1天前', tags: ['AI安全'] },
    { id: 9, author: '小老师家庭', avatar: '👧‍👦', content: '孩子当了回"小老师"，把AI如何学习的原理用画画的方式教给了爷爷奶奶，老人家听得津津有味。', likes: 20, comments: 1, time: '1天前', tags: ['家庭互动'] },
    { id: 10, author: '探索者号', avatar: '👨‍👦', content: '用流程图画出了"AI如何识别一只猫"的过程，孩子说"原来AI是看好多好多猫的照片才学会认猫的！"', likes: 18, comments: 1, time: '2天前', tags: ['AI原理'] },
    { id: 11, author: '创意家庭', avatar: '👩‍👦', content: '今天和孩子用简单的语言理解了"算法"——就是"告诉电脑一步一步该怎么做"。然后我们一起写了"做三明治的算法"！', likes: 23, comments: 1, time: '2天前', tags: ['算法启蒙'] },
    { id: 12, author: 'AI冠军队', avatar: '👨‍👩‍👧‍👦', content: '完成12周AI家庭学习计划了！从"什么是AI"到能独立讨论AI伦理，孩子的成长超出了我们的预期。感谢AI家庭日！', likes: 42, comments: 3, time: '3天前', tags: ['里程碑'] }
  ];

  /** 30条家庭AI新闻 */
  const AI_NEWS = [
    { title: 'AI学会了做菜！', content: 'Google的AI看了100万个菜谱视频，现在可以根据一张食物照片告诉你怎么做。和孩子一起讨论：你希望AI帮你做什么菜？', discussion: '你希望AI帮你做什么菜？', icon: '🍳' },
    { title: 'AI画家拿了艺术比赛冠军', content: '一幅AI生成的画作在艺术比赛中获得了一等奖，评委们不知道这是AI画的。讨论：AI的作品算不算真正的艺术？', discussion: 'AI的作品算不算真正的艺术？', icon: '🎨' },
    { title: 'AI可以预测地震了', content: '科学家用AI分析了上万次地震数据，现在可以提前几小时预测小地震。讨论：AI还能预测什么？', discussion: 'AI还能预测什么？', icon: '🌍' },
    { title: 'AI学会了写作业？', content: '一个新的AI可以帮你检查数学作业的对错，还能告诉你哪里算错了。讨论：用AI检查作业算不算作弊？', discussion: '用AI检查作业算不算作弊？', icon: '📝' },
    { title: 'AI机器人会做手术了', content: '一台AI手术机器人成功完成了1000台手术，比人类医生更精确。讨论：你敢让AI机器人给你做手术吗？', discussion: '你敢让AI机器人给你做手术吗？', icon: '🏥' },
    { title: 'AI能读懂你的表情了', content: '新的AI可以通过摄像头识别你的情绪是开心还是难过。讨论：你希望AI知道你的心情吗？', discussion: '你希望AI知道你的心情吗？', icon: '😊' },
    { title: 'AI翻译官打破语言 barrier', content: 'AI翻译现在可以实时翻译100多种语言，准确率超过90%。讨论：如果你能和世界上任何人说话，你想和谁聊天？', discussion: '你想和世界上谁聊天？', icon: '🌐' },
    { title: 'AI在太空帮宇航员干活', content: '国际空间站上的AI助手"CIMON"可以帮宇航员做实验、拍照、甚至聊天。讨论：如果你去太空，你希望AI助手帮你做什么？', discussion: '去太空你希望AI帮你做什么？', icon: '🚀' },
    { title: 'AI学会了开车', content: '无人驾驶汽车已经可以在一些城市上路了，AI开车比人类更安全吗？讨论：你愿意坐AI开的车吗？', discussion: '你愿意坐AI开的车吗？', icon: '🚗' },
    { title: 'AI能帮你选衣服了', content: '电商平台用AI推荐你可能喜欢的衣服，准确率越来越高。讨论：你觉得AI了解你的品味吗？', discussion: '你觉得AI了解你的品味吗？', icon: '👗' },
    { title: 'AI作曲家写了新歌', content: 'AI学习了50万首歌后，可以创作出好听的新旋律。讨论：AI创作的音乐和人类创作的有什么不同？', discussion: 'AI音乐和人类音乐有什么不同？', icon: '🎵' },
    { title: 'AI保护大熊猫', content: '科学家用AI分析无人机拍的照片，能更快找到野生大熊猫。讨论：AI还能帮助保护哪些动物？', discussion: 'AI还能保护哪些动物？', icon: '🐼' },
    { title: 'AI能写故事了', content: '你给AI一个开头，它可以帮你写出一个完整的故事。讨论：让AI帮你写一个什么主题的故事？', discussion: '让AI写什么主题的故事？', icon: '📖' },
    { title: 'AI识别植物比专家还快', content: '用手机拍一张植物照片，AI就能告诉你它是什么植物、怎么养护。讨论：你家有什么植物？', discussion: '你家有什么植物？', icon: '🌱' },
    { title: 'AI教练教运动员训练', content: '很多运动员用AI分析自己的动作，找到可以改进的地方。讨论：AI如果当你的体育教练，你想学什么运动？', discussion: 'AI当教练你想学什么？', icon: '🏅' },
    { title: 'AI发现了新药', content: 'AI用一周时间发现了一种新的抗生素，人类科学家可能需要好几年。讨论：AI还能帮助医学做什么？', discussion: 'AI还能帮助医学做什么？', icon: '💊' },
    { title: 'AI可以做天气预报了', content: 'AI天气预报比传统方法更准确，能精确到每个街区。讨论：天气预报对你家有什么用？', discussion: '天气预报对你家有什么用？', icon: '☀️' },
    { title: 'AI认识你的笔迹', content: 'AI可以识别你写的字，即使写得很潦草也能看懂。讨论：你写的字AI能看懂吗？', discussion: '你写的字AI能看懂吗？', icon: '✍️' },
    { title: 'AI帮你整理房间', content: '新的AI扫地机器人可以自己规划路线，还会自动回去充电。讨论：你希望AI机器人帮你做什么家务？', discussion: '希望AI帮你做什么家务？', icon: '🏠' },
    { title: 'AI当老师上数学课', content: '有些学校用AI来帮助学生学数学，AI可以根据每个学生的水平出不同的题目。讨论：AI老师好不好？', discussion: 'AI老师好不好？', icon: '📐' },
    { title: 'AI会做面包了', content: '日本一家面包店用AI配方做出了超级好吃的面包。讨论：你最想吃什么AI做的食物？', discussion: '最想吃什么AI做的食物？', icon: '🍞' },
    { title: 'AI帮你拍照更好看', content: '手机拍照时AI会自动帮你调整光线和颜色，让照片更漂亮。讨论：你拍的照片AI帮你优化了吗？', discussion: '你拍的照片AI优化了吗？', icon: '📸' },
    { title: 'AI能预测你的购物偏好', content: 'AI比你更早知道你想要什么，在你搜索之前就推荐给你了。讨论：你觉得这样方便还是有点可怕？', discussion: '方便还是有点可怕？', icon: '🛒' },
    { title: 'AI监测森林火灾', content: 'AI通过卫星图片可以及时发现森林火灾，比人工巡查看快100倍。讨论：还有什么地方需要AI来保护？', discussion: '还有什么地方需要AI保护？', icon: '🔥' },
    { title: 'AI帮你做旅行计划', content: '告诉AI你想去哪里玩，它可以帮你安排路线、订酒店、推荐美食。讨论：你最想去哪里旅行？', discussion: '最想去哪里旅行？', icon: '✈️' },
    { title: 'AI学会了下围棋', content: 'AI AlphaGo打败了世界围棋冠军，这说明AI在棋类游戏中已经超越了人类。讨论：AI在什么方面还比不过人类？', discussion: 'AI在什么方面还比不过人类？', icon: '♟️' },
    { title: 'AI认识你家里的猫', content: 'AI可以识别不同猫的脸，帮主人确认猫咪的身份。讨论：你家宠物AI能认出来吗？', discussion: '你家宠物AI能认出来吗？', icon: '🐱' },
    { title: 'AI帮你回收垃圾', content: '一些城市用AI摄像头来检查垃圾分类是否正确，还会提醒你放错了。讨论：你家垃圾分类做的好吗？', discussion: '你家垃圾分类做的好吗？', icon: '♻️' },
    { title: 'AI可以模仿你的声音', content: '新的AI只需要听你几句话，就能模仿你的声音说话。讨论：你觉得这很酷还是很可怕？', discussion: '这很酷还是很可怕？', icon: '🗣️' },
    { title: 'AI设计出了新房子', content: '建筑师用AI设计了一种可以自己旋转的房子，让每个房间都能晒到太阳。讨论：你想要什么样的智能房子？', discussion: '你想要什么样的智能房子？', icon: '🏡' }
  ];

  /** 6个生活AI场景 */
  const AI_LIFE_SCENES = [
    { id: 'home', title: '家里的AI', emoji: '🏠', color: '#d48820', knowledge: [
      { title: '智能音箱', desc: '你叫"小爱同学"或"天猫精灵"，它能听懂你的话，是因为AI语音识别技术。', activity: '和孩子一起测试：问智能音箱3个不同的问题，看它怎么回答' },
      { title: '扫地机器人', desc: '扫地机器人能自己规划路线，不撞到家具，是因为AI建图和导航技术。', activity: '跟着扫地机器人走一圈，画一张它"看到"的地图' },
      { title: '人脸识别门锁', desc: '门锁能认出你的脸，是因为AI把你的脸变成了很多数字，像密码一样。', activity: '用手机相机拍照，看看AI能不能识别出谁是谁' },
      { title: '智能冰箱', desc: '智能冰箱能提醒你牛奶快过期了，是因为AI记住了每样东西放进去的时间。', activity: '和孩子一起整理冰箱，给食物标注"保鲜日期"' }
    ]},
    { id: 'school', title: '学校里的AI', emoji: '🏫', color: '#3d8aaa', knowledge: [
      { title: 'AI批改作业', desc: '老师用AI批改选择题和填空题，AI能在几秒内看完全班50份作业。', activity: '讨论：如果AI批改你的作业，你能接受吗？' },
      { title: 'AI英语口语评测', desc: '英语App能给你的发音打分，是因为AI语音技术可以比较你说的和标准发音的区别。', activity: '用英语App录一段话，看看AI给你打几分' },
      { title: 'AI推荐阅读', desc: '阅读App推荐你可能喜欢的书，是因为AI分析了你之前读过的书。', activity: '列出你最喜欢的3本书，猜猜AI会推荐什么' }
    ]},
    { id: 'outdoor', title: '外出时的AI', emoji: '🗺️', color: '#4a9a5a', knowledge: [
      { title: '导航路线规划', desc: '手机导航能告诉你最快的路线，是因为AI在分析每条路的拥堵情况。', activity: '打开手机地图，看看AI推荐的路线是什么' },
      { title: '外卖推荐', desc: '外卖App推荐你喜欢的餐厅，是因为AI学习了你的点餐习惯。', activity: '讨论：你上次点的外卖，AI推荐对了吗？' },
      { title: '停车场识别车牌', desc: '停车场自动识别车牌开闸，是因为AI计算机视觉技术。', activity: '下次路过停车场，观察车牌是怎么被识别的' },
      { title: '拍照识物', desc: '手机拍照可以识别花草鸟虫，是因为AI图像识别模型。', activity: '拍一张植物照片，让AI告诉你它是什么' }
    ]},
    { id: 'parents', title: '爸爸妈妈的AI', emoji: '💼', color: '#c0505a', knowledge: [
      { title: 'AI办公助手', desc: '爸爸妈妈公司用AI自动写会议记录、安排日程，提高工作效率。', activity: '让爸爸妈妈展示一下他们工作中用的AI工具' },
      { title: 'AI写邮件', desc: 'AI可以帮你写邮件，你只需要告诉它你想说什么。', activity: '一起用AI帮妈妈/爸爸写一封邮件' },
      { title: 'AI做PPT', desc: 'AI可以根据你的主题自动生成PPT大纲和排版。', activity: '用AI帮爸爸妈妈做一个工作PPT（我们也有AI文档助手！）' }
    ]},
    { id: 'hospital', title: '医院里的AI', emoji: '🏥', color: '#9b59b6', knowledge: [
      { title: 'AI辅助诊断', desc: 'AI看X光片比有些医生还快，能帮助发现早期的疾病。', activity: '讨论：你去看病时遇到过AI吗？' },
      { title: 'AI智能分诊', desc: '医院用AI来判断你的症状应该挂什么科，减少等待时间。', activity: '下次去医院观察自助挂号机是怎么工作的' },
      { title: 'AI药物研发', desc: 'AI用超级快的速度筛选可能有效的新药，帮科学家节省好几年时间。', activity: '讨论：AI发明的新药，你觉得可靠吗？' }
    ]},
    { id: 'supermarket', title: '超市里的AI', emoji: '🛒', color: '#e67e22', knowledge: [
      { title: '自动收银', desc: '超市的自动收银机能识别商品，是因为AI计算机视觉技术。', activity: '下次去超市体验一下自助收银' },
      { title: '货架补货预测', desc: 'AI可以预测哪些商品快卖完了，提前通知员工补货。', activity: '观察超市里哪些货架是满的、哪些是空的' },
      { title: '商品推荐', desc: '超市App推荐你可能需要买的东西，是基于AI对你的购物习惯分析。', activity: '看看超市App推荐了什么，猜猜AI为什么推荐这些' }
    ]}
  ];

  /** 5个每周挑战 */
  const AI_CHALLENGES = [
    { id: 1, title: '找到家里的AI设备', desc: '找到家里3个使用了AI的设备，画出来并解释它是怎么用AI的', points: 50, icon: '🔍', tag: '发现' },
    { id: 2, title: 'AI小厨师', desc: '和AI助手对话，让它帮你设计一道菜的菜谱，然后按菜谱做出来', points: 50, icon: '🍳', tag: '实践' },
    { id: 3, title: 'AI漫画家', desc: '用AI漫画工坊创作一幅"AI改变我们生活"的漫画', points: 50, icon: '🎨', tag: '创作' },
    { id: 4, title: 'AI小记者', desc: '采访爷爷奶奶，问他们觉得什么是AI，整理成一篇小报道', points: 50, icon: '🎤', tag: '交流' },
    { id: 5, title: '设计AI好帮手', desc: '设计一个"AI好帮手"——如果你有一个AI机器人，你希望它能帮你做什么？画出你的设计', points: 50, icon: '✏️', tag: '创意' }
  ];

  /** 8个AI知识节点 */
  const AI_KNOWLEDGE_MAP = [
    { id: 'basics', title: 'AI基础概念', emoji: '🤖', desc: '什么是人工智能', unlocked: false, chatKeywords: ['AI','人工智能','机器人'] },
    { id: 'ml', title: '机器学习', emoji: '📊', desc: 'AI怎么从数据中学习', unlocked: false, chatKeywords: ['机器学习','数据','学习'] },
    { id: 'nlp', title: '自然语言处理', emoji: '💬', desc: 'AI怎么理解人类语言', unlocked: false, chatKeywords: ['语言','语音','翻译','自然语言'] },
    { id: 'cv', title: '计算机视觉', emoji: '👁️', desc: 'AI怎么"看"东西', unlocked: false, chatKeywords: ['识别','看','视觉','图像','照片'] },
    { id: 'ethics', title: 'AI伦理', emoji: '⚖️', desc: 'AI应该做什么、不应该做什么', unlocked: false, chatKeywords: ['伦理','道德','隐私','安全','公平'] },
    { id: 'creative', title: 'AI创意应用', emoji: '🎨', desc: 'AI画画、写作、作曲', unlocked: false, chatKeywords: ['画画','写作','音乐','创作','漫画'] },
    { id: 'safety', title: 'AI安全', emoji: '🔒', desc: '如何安全地使用AI', unlocked: false, chatKeywords: ['安全','保护','密码','危险'] },
    { id: 'future', title: '未来AI', emoji: '🚀', desc: 'AI未来的发展方向', unlocked: false, chatKeywords: ['未来','发展','改变','明天'] }
  ];

  /** 社区分组类型 */
  const GROUP_TYPES = {
    school: { label: '学校小组', emoji: '🏫', icon: '🏫', description: '和同校家庭一起学AI' },
    neighborhood: { label: '小区小组', emoji: '🏘️', icon: '🏘️', description: '和邻居家庭一起探索' },
    company: { label: '公司小组', emoji: '🏢', icon: '🏢', description: '和同事家庭一起交流' }
  };

  /** 预设小组数据 */
  const EXAMPLE_GROUPS = [
    { id: 'school_1', name: '阳光小学AI学习小组', type: 'school', members: 23, posts: 45 },
    { id: 'neighborhood_1', name: '阳光花园小区家庭AI社', type: 'neighborhood', members: 15, posts: 28 },
    { id: 'company_1', name: 'XX科技公司家庭日', type: 'company', members: 12, posts: 19 }
  ];

  // ============================================================
  //  localStorage 工具函数
  // ============================================================

  function load(key, fallback) {
    try { var v = localStorage.getItem('ai_family_' + key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }

  function save(key, val) {
    try { localStorage.setItem('ai_family_' + key, JSON.stringify(val)); } catch (e) {}
  }

  // ============================================================
  //  全局状态
  // ============================================================

  var state = load('state', {
    character: null,
    scores: { learning: 0, creative: 0 },
    streak: 0,
    lastDate: '',
    chatCount: 0,
    comicCount: 0,
    modelCount: 0,
    printCount: 0,
    communityCount: 0,
    shareCount: 0,
    chatPointsToday: 0,
    chatPointsDate: '',
    checkinDates: [],
    gallery: [],
    pointsLog: [],
    videoCount: 0,
    pptCount: 0,
    photoCount: 0,
    challengeCount: 0,
    exploreCount: 0,
    communityLikes: 0,
    weekChampion: 0,
    user: null  // null means not registered; object when registered
  });

  // ============================================================
  //  工具函数
  // ============================================================

  /** 获取今天的日期字符串 YYYY-MM-DD */
  function getToday() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  /** 简易伪随机（可种子化，用于每日问题选取） */
  function seededIndex(seed, len) {
    var x = Math.sin(seed) * 10000;
    return Math.floor((x - Math.floor(x)) * len);
  }

  // ============================================================
  //  核心函数
  // ============================================================

  /**
   * 获取状态，同时检查日期更新streak
   */
  function getState() {
    var today = getToday();
    // 如果日期变了，重置每日聊天积分计数
    if (state.chatPointsDate !== today) {
      state.chatPointsDate = today;
      state.chatPointsToday = 0;
    }
    save('state', state);
    return state;
  }

  /**
   * 根据时间返回问候语
   */
  function getGreeting() {
    var h = new Date().getHours();
    if (h < 12) return '早上好';
    if (h < 18) return '下午好';
    return '晚上好';
  }

  /**
   * 返回当前选中角色
   */
  function getSelectedCharacter() {
    return state.character ? CHARACTERS[state.character] : null;
  }

  /**
   * 选择角色
   */
  function selectCharacter(id) {
    state.character = id;
    save('state', state);
  }

  /**
   * 添加积分（learning 或 creative），记录到积分明细
   */
  function addPoints(type, amount, reason) {
    if (type !== 'learning' && type !== 'creative') return;
    state.scores[type] = (state.scores[type] || 0) + amount;
    state.pointsLog.push({
      type: type,
      amount: amount,
      reason: reason || '',
      time: Date.now()
    });
    save('state', state);
    // 触发积分动画
    showPointsAnimation(amount, type);
    // 检查勋章
    checkBadges();
  }

  /**
   * 获取积分明细
   */
  function getPointsLog() {
    return state.pointsLog || [];
  }

  /**
   * 每天最多5次聊天获得积分（积分防刷）
   */
  function canEarnChatPoints() {
    var today = getToday();
    if (state.chatPointsDate !== today) return true;
    return state.chatPointsToday < 5;
  }

  /**
   * 每日任务完成状态
   */
  function getDailyTasksStatus() {
    return DAILY_TASKS.map(function (task) {
      var current = 0;
      switch (task.type) {
        case 'chat': current = state.chatCount; break;
        case 'comic': current = state.comicCount; break;
        case 'model': current = state.modelCount; break;
        case 'print': current = state.printCount; break;
        case 'community': current = state.communityCount; break;
        case 'share': current = state.shareCount; break;
        default: current = 0;
      }
      // 每日任务以当天计数为准（简化处理：使用总计数，由页面层按日期重置）
      var done = current >= task.target;
      var percent = Math.min(100, Math.round(current / task.target * 100));
      return Object.assign({}, task, { done: done, percent: percent, current: current });
    });
  }

  /**
   * 根据日期获取每日一问
   */
  function getDailyQuestion() {
    var today = getToday();
    var seed = 0;
    for (var i = 0; i < today.length; i++) {
      seed += today.charCodeAt(i) * (i + 1);
    }
    return DAILY_QUESTIONS[seed % DAILY_QUESTIONS.length];
  }

  /**
   * 获取最近14天的签到日历数据
   */
  function getCheckinCalendar() {
    var dates = [];
    var today = new Date();
    for (var i = 13; i >= 0; i--) {
      var d = new Date(today);
      d.setDate(d.getDate() - i);
      dates.push(
        d.getFullYear() + '-' +
        String(d.getMonth() + 1).padStart(2, '0') + '-' +
        String(d.getDate()).padStart(2, '0')
      );
    }
    return dates;
  }

  /**
   * 签到
   */
  function checkin() {
    var today = getToday();
    if (state.checkinDates.indexOf(today) === -1) {
      state.checkinDates.push(today);
    }
    // 更新streak
    var yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    var yStr = yesterday.getFullYear() + '-' +
      String(yesterday.getMonth() + 1).padStart(2, '0') + '-' +
      String(yesterday.getDate()).padStart(2, '0');
    if (state.lastDate === yStr) {
      state.streak = (state.streak || 0) + 1;
    } else if (state.lastDate !== today) {
      state.streak = 1;
    }
    state.lastDate = today;
    addPoints('learning', 5, '每日签到');
    save('state', state);
  }

  /**
   * 关键词匹配聊天引擎（支持上下文记忆）
   */
  function getAIResponse(message, recentMessages) {
    var msg = (message || '').toLowerCase();
    var matchedTopic = null;

    // 遍历话题查找匹配
    for (var i = 0; i < CHAT_TOPICS.length; i++) {
      var topic = CHAT_TOPICS[i];
      for (var j = 0; j < topic.keywords.length; j++) {
        if (msg.indexOf(topic.keywords[j]) !== -1) {
          matchedTopic = topic;
          break;
        }
      }
      if (matchedTopic) break;
    }

    var personality = 'default';
    var char = getSelectedCharacter();
    if (char && char.personality) {
      personality = char.personality;
    }

    // 有匹配话题
    if (matchedTopic) {
      var replies = matchedTopic.replies;
      if (replies[personality]) {
        return replies[personality];
      }
      if (replies['default']) {
        return replies['default'];
      }
    }

    // 无话题匹配时，参考上下文记忆
    if (recentMessages && recentMessages.length > 0) {
      for (var k = recentMessages.length - 1; k >= 0; k--) {
        var prev = (recentMessages[k] || '').toLowerCase();
        for (var m = 0; m < CHAT_TOPICS.length; m++) {
          for (var n = 0; n < CHAT_TOPICS[m].keywords.length; n++) {
            if (prev.indexOf(CHAT_TOPICS[m].keywords[n]) !== -1) {
              var ctxReplies = CHAT_TOPICS[m].replies;
              if (ctxReplies[personality]) {
                return ctxReplies[personality];
              }
              if (ctxReplies['default']) {
                return ctxReplies['default'];
              }
            }
          }
        }
      }
    }

    // 完全无匹配，返回默认回复
    if (defaultReplies[personality]) {
      return defaultReplies[personality];
    }
    return defaultReplies['default'];
  }

  /**
   * 添加作品到gallery
   */
  function addToGallery(item) {
    state.gallery = state.gallery || [];
    state.gallery.unshift({
      type: item.type,
      title: item.title,
      data: item.data,
      time: Date.now()
    });
    save('state', state);
  }

  /**
   * 获取gallery
   */
  function getGallery() {
    return state.gallery || [];
  }

  /**
   * 检查是否首次访问
   */
  function isFirstVisit() {
    return !localStorage.getItem('ai_family_visited');
  }

  /**
   * 标记已访问
   */
  function markVisited() {
    localStorage.setItem('ai_family_visited', 'true');
  }

  /**
   * 重置所有数据
   */
  function resetAllData() {
    var keysToRemove = [];
    for (var i = 0; i < localStorage.length; i++) {
      var key = localStorage.key(i);
      if (key && key.indexOf('ai_family_') === 0) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(function (k) { localStorage.removeItem(k); });
    state = {
      character: null,
      scores: { learning: 0, creative: 0 },
      streak: 0,
      lastDate: '',
      chatCount: 0,
      comicCount: 0,
      modelCount: 0,
      printCount: 0,
      communityCount: 0,
      shareCount: 0,
      chatPointsToday: 0,
      chatPointsDate: '',
      checkinDates: [],
      gallery: [],
      pointsLog: [],
      videoCount: 0,
      pptCount: 0,
      photoCount: 0,
      challengeCount: 0,
      exploreCount: 0,
      communityLikes: 0,
      weekChampion: 0,
      user: null
    };
  }

  /**
   * 检查并弹出勋章
   */
  function checkBadges() {
    if (typeof BADGES === 'undefined') return;
    var earned = load('badges', []);
    for (var i = 0; i < BADGES.length; i++) {
      var badge = BADGES[i];
      if (earned.indexOf(badge.id) === -1 && badge.condition(state)) {
        earned.push(badge.id);
        save('badges', earned);
        showBadgePopup(badge);
      }
    }
  }

  // ============================================================
  //  V3 新增函数
  // ============================================================

  // ============================================================
  //  计划相关函数
  // ============================================================

  /**
   * 根据评估数据生成12周学习计划
   */
  function generatePlan(assessment) {
    var plan = { created: Date.now(), weeks: [] };
    var poolKeys = Object.keys(ACTIVITY_POOL);
    // 将 hyphen 格式的兴趣转为 underscore 格式
    var interestsMap = {};
    if (assessment.interests) {
      assessment.interests.forEach(function (interest) {
        interestsMap[interest.replace(/-/g, '_')] = true;
      });
    }

    for (var week = 0; week < 12; week++) {
      var phaseIdx = Math.floor(week / 3) % WEEK_THEMES.length;
      var theme = WEEK_THEMES[phaseIdx];
      var weekData = {
        week: week,
        theme: theme,
        sessions: []
      };

      // 每周选2个活动，根据interests加权
      // 优先选择兴趣方向对应的类别，其次是当前阶段主题对应的类别
      var selectedKeys = [];
      // 第一轮：从兴趣类别中选
      poolKeys.forEach(function (k) {
        if (interestsMap[k] && selectedKeys.indexOf(k) === -1) {
          selectedKeys.push(k);
        }
      });
      // 第二轮：补充未选到的类别
      poolKeys.forEach(function (k) {
        if (selectedKeys.indexOf(k) === -1) {
          selectedKeys.push(k);
        }
      });

      // 每周从2个不同类别各选1个活动
      var cat1Idx = week % selectedKeys.length;
      var cat2Idx = (week + 2) % selectedKeys.length;
      if (cat1Idx === cat2Idx) cat2Idx = (cat2Idx + 1) % selectedKeys.length;

      var pool1 = ACTIVITY_POOL[selectedKeys[cat1Idx]];
      var pool2 = ACTIVITY_POOL[selectedKeys[cat2Idx]];

      var act1Idx = week % pool1.activities.length;
      var act2Idx = (week + 3) % pool2.activities.length;

      weekData.sessions.push({
        category: selectedKeys[cat1Idx],
        categoryLabel: pool1.label,
        activity: pool1.activities[act1Idx],
        done: false
      });
      weekData.sessions.push({
        category: selectedKeys[cat2Idx],
        categoryLabel: pool2.label,
        activity: pool2.activities[act2Idx],
        done: false
      });

      plan.weeks.push(weekData);
    }

    save('plan', plan);
    return plan;
  }

  /**
   * 获取已保存的计划
   */
  function getPlan() {
    return load('plan', null);
  }

  /**
   * 获取当前是第几周（0-11）
   */
  function getCurrentWeekIndex() {
    var plan = getPlan();
    if (!plan || !plan.created) return 0;
    var created = new Date(plan.created);
    var now = new Date();
    var diffMs = now.getTime() - created.getTime();
    var diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    var weekIdx = Math.floor(diffDays / 7);
    return Math.min(11, Math.max(0, weekIdx));
  }

  /**
   * 标记某周某个活动为已完成
   */
  function completeSession(weekIndex, sessionIndex) {
    var plan = getPlan();
    if (!plan || !plan.weeks[weekIndex]) return;
    if (plan.weeks[weekIndex].sessions[sessionIndex]) {
      plan.weeks[weekIndex].sessions[sessionIndex].done = true;
      save('plan', plan);
    }
  }

  /**
   * 检查某周某个活动是否已完成
   */
  function isSessionDone(weekIndex, sessionIndex) {
    var plan = getPlan();
    if (!plan || !plan.weeks[weekIndex]) return false;
    if (plan.weeks[weekIndex].sessions[sessionIndex]) {
      return plan.weeks[weekIndex].sessions[sessionIndex].done === true;
    }
    return false;
  }

  /**
   * 保存评估数据
   */
  function saveAssessment(data) {
    save('assessment', data);
  }

  /**
   * 获取评估数据
   */
  function getAssessment() {
    return load('assessment', null);
  }

  // ============================================================
  //  V3 新增：积分消耗系统
  // ============================================================

  /**
   * 消耗积分（先扣learning，不够扣creative）
   * @param {number} amount 消耗数量
   * @param {string} reason 消耗原因
   * @returns {boolean} 成功返回true，积分不足返回false
   */
  function spendPoints(amount, reason) {
    var total = state.scores.learning + state.scores.creative;
    if (total < amount) return false;

    var remaining = amount;
    if (state.scores.learning >= remaining) {
      state.scores.learning -= remaining;
      remaining = 0;
    } else {
      remaining -= state.scores.learning;
      state.scores.learning = 0;
      state.scores.creative -= remaining;
    }

    state.pointsLog.push({
      type: 'spend',
      amount: amount,
      reason: reason || '',
      time: Date.now()
    });
    save('state', state);
    return true;
  }

  /**
   * 获取总积分
   */
  function getTotalPoints() {
    return state.scores.learning + state.scores.creative;
  }

  /**
   * 获取最后活跃日期
   */
  function getLastActiveDate() {
    return state.lastDate;
  }

  // ============================================================
  //  V3 新增：探索中心函数
  // ============================================================

  /**
   * 根据聊天关键词解锁知识节点
   * @param {string} chatKeywords 逗号分隔的关键词字符串
   */
  function exploreKnowledge(chatKeywords) {
    var keywords = (chatKeywords || '').split(/[,，\s]+/);
    for (var i = 0; i < AI_KNOWLEDGE_MAP.length; i++) {
      var node = AI_KNOWLEDGE_MAP[i];
      for (var j = 0; j < node.chatKeywords.length; j++) {
        for (var k = 0; k < keywords.length; k++) {
          if (keywords[k] && node.chatKeywords[j].indexOf(keywords[k]) !== -1) {
            node.unlocked = true;
          }
        }
      }
    }
    save('knowledge_map', AI_KNOWLEDGE_MAP.map(function (n) { return { id: n.id, unlocked: n.unlocked }; }));
  }

  /**
   * 获取知识地图（合并已解锁状态）
   */
  function getKnowledgeMap() {
    var saved = load('knowledge_map', []);
    return AI_KNOWLEDGE_MAP.map(function (node) {
      for (var i = 0; i < saved.length; i++) {
        if (saved[i].id === node.id) {
          return Object.assign({}, node, { unlocked: saved[i].unlocked });
        }
      }
      return Object.assign({}, node);
    });
  }

  /**
   * 完成挑战
   * @param {number} challengeId 挑战ID
   */
  function completeChallenge(challengeId) {
    var completed = load('completed_challenges', []);
    if (completed.indexOf(challengeId) === -1) {
      completed.push(challengeId);
      save('completed_challenges', completed);
      addPoints('learning', 50, '完成AI挑战赛');
    }
  }

  /**
   * 获取已完成的挑战列表
   */
  function getCompletedChallenges() {
    return load('completed_challenges', []);
  }

  // ============================================================
  //  V3 新增：社区分组函数
  // ============================================================

  /**
   * 加入小组
   * @param {string} groupId 小组ID
   */
  function joinGroup(groupId) {
    var groups = load('groups', []);
    if (groups.indexOf(groupId) === -1) {
      groups.push(groupId);
      save('groups', groups);
    }
  }

  /**
   * 获取已加入的小组列表
   */
  function getUserGroups() {
    return load('groups', []);
  }

  /**
   * 退出小组
   * @param {string} groupId 小组ID
   */
  function leaveGroup(groupId) {
    var groups = load('groups', []);
    var idx = groups.indexOf(groupId);
    if (idx !== -1) {
      groups.splice(idx, 1);
      save('groups', groups);
    }
  }

  // ============================================================
  //  UI 辅助函数
  // ============================================================

  /**
   * 显示底部toast提示
   */
  function showToast(message, duration) {
    duration = duration || 3000;
    var existing = document.querySelector('.app-toast');
    if (existing) existing.remove();

    var toast = document.createElement('div');
    toast.className = 'app-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // fade in
    requestAnimationFrame(function () {
      toast.style.opacity = '1';
    });

    setTimeout(function () {
      toast.style.opacity = '0';
      setTimeout(function () { toast.remove(); }, 300);
    }, duration);
  }

  /**
   * 显示勋章解锁弹窗
   */
  function showBadgePopup(badge) {
    var overlay = document.createElement('div');
    overlay.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;' +
      'display:flex;align-items:center;justify-content:center;' +
      'z-index:10000;background:rgba(0,0,0,0.3);';

    var popup = document.createElement('div');
    popup.style.cssText =
      'background:#fff;border-radius:20px;padding:32px 48px;text-align:center;' +
      'box-shadow:0 8px 40px rgba(0,0,0,0.2);transform:scale(0);' +
      'transition:transform 0.4s cubic-bezier(0.34,1.56,0.64,1);';
    popup.innerHTML =
      '<div style="font-size:48px;margin-bottom:8px;">' + badge.emoji + '</div>' +
      '<div style="font-size:18px;font-weight:700;color:#333;margin-bottom:4px;">勋章解锁</div>' +
      '<div style="font-size:16px;color:#666;">' + badge.name + '</div>';

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // 弹出动画
    requestAnimationFrame(function () {
      popup.style.transform = 'scale(1)';
    });

    // 创建彩纸效果
    createConfetti();

    // 3秒后消失
    setTimeout(function () {
      popup.style.transform = 'scale(0)';
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease';
      setTimeout(function () { overlay.remove(); }, 300);
    }, 3000);
  }

  /**
   * 显示积分获得动画
   */
  function showPointsAnimation(amount, type) {
    var el = document.createElement('div');
    el.textContent = '+' + amount + ' 积分';
    el.style.cssText =
      'position:fixed;top:70px;right:20px;font-size:18px;font-weight:700;' +
      'color:' + (type === 'learning' ? '#3d8aaa' : '#d48820') + ';' +
      'z-index:9999;pointer-events:none;' +
      'animation:pointsFloat 1.5s ease-out forwards;';
    document.body.appendChild(el);

    // 注入动画关键帧（仅一次）
    if (!document.getElementById('app-points-anim')) {
      var style = document.createElement('style');
      style.id = 'app-points-anim';
      style.textContent =
        '@keyframes pointsFloat{' +
        '0%{opacity:1;transform:translateY(0)}' +
        '100%{opacity:0;transform:translateY(-60px)}' +
        '}';
      document.head.appendChild(style);
    }

    setTimeout(function () { el.remove(); }, 1500);
  }

  /**
   * 彩纸粒子效果
   */
  function createConfetti() {
    var colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6eb4', '#a66cff'];
    for (var i = 0; i < 30; i++) {
      (function (idx) {
        var particle = document.createElement('div');
        var size = Math.random() * 8 + 4;
        var left = Math.random() * 100;
        var color = colors[Math.floor(Math.random() * colors.length)];
        var drift = (Math.random() - 0.5) * 200;
        var rotation = Math.random() * 360;
        particle.style.cssText =
          'position:fixed;top:-10px;left:' + left + '%;width:' + size + 'px;height:' + size + 'px;' +
          'background:' + color + ';z-index:10001;pointer-events:none;border-radius:2px;' +
          'opacity:0.9;';
        document.body.appendChild(particle);

        var startTime = Date.now();
        var duration = 2000;
        function animate() {
          var elapsed = Date.now() - startTime;
          var progress = elapsed / duration;
          if (progress > 1) {
            particle.remove();
            return;
          }
          var y = progress * window.innerHeight;
          var x = Math.sin(progress * 3) * drift;
          particle.style.transform = 'translateX(' + x + 'px) translateY(' + y + 'px) rotate(' + (rotation + progress * 720) + 'deg)';
          particle.style.opacity = String(1 - progress);
          requestAnimationFrame(animate);
        }
        requestAnimationFrame(animate);
      })(i);
    }
  }

  // ============================================================
  //  渲染函数
  // ============================================================

  /**
   * 渲染顶部导航栏
   */
  function renderNav(activePage) {
    var links = [
      { label: '首页', href: 'home.html', id: 'home', icon: 'home' },
      { label: '家庭计划', href: 'plan-view.html', id: 'plan', icon: 'calendar' },
      { label: '探索', href: 'explore.html', id: 'explore', icon: 'compass' },
      { label: '创作', href: 'create.html', id: 'create', icon: 'palette' },
      { label: '成就', href: 'rewards.html', id: 'rewards', icon: 'trophy' },
      { label: '社区', href: 'community.html', id: 'community', icon: 'users' }
    ];
    var linksHtml = links.map(function(link) {
      var isActive = activePage === link.id;
      return '<a href="' + link.href + '" class="app-nav-link' + (isActive ? ' app-nav-link--active' : '') + '">' + link.label + '</a>';
    }).join('');
    return '<nav class="app-nav">' +
      '<a href="home.html" class="app-nav-logo">' +
      '<img src="../assets/logo-icon.jpg" alt="AI家庭日">' +
      '<div class="app-nav-logo-text">' +
      '<span class="app-nav-logo-main">AI<span>家庭日</span></span>' +
      '<span class="app-nav-logo-sub">Family AI Day</span>' +
      '</div></a>' +
      '<div class="app-nav-links">' + linksHtml + '</div>' +
      renderUserNav() +
      '</nav>';
  }

  /**
   * 渲染移动端底部tab栏（768px以下显示）
   */
  function renderBottomTab(activePage) {
    var tabs = [
      { label: '首页', href: 'home.html', id: 'home', icon: 'home' },
      { label: '计划', href: 'plan-view.html', id: 'plan', icon: 'calendar' },
      { label: '探索', href: 'explore.html', id: 'explore', icon: 'compass' },
      { label: '创作', href: 'create.html', id: 'create', icon: 'palette' },
      { label: '社区', href: 'community.html', id: 'community', icon: 'users' }
    ];
    var tabsHtml = tabs.map(function(tab) {
      var isActive = activePage === tab.id;
      var iconSvg = (typeof Icons !== 'undefined' && Icons[tab.icon]) ? Icons[tab.icon]() : '<span style="font-size:20px;">•</span>';
      return '<a href="' + tab.href + '" class="app-tab-item' + (isActive ? ' app-tab-item--active' : '') + '">' +
        '<span class="app-tab-icon">' + iconSvg + '</span>' +
        '<span class="app-tab-label">' + tab.label + '</span></a>';
    }).join('');
    return '<div class="app-bottom-tab">' + tabsHtml + '</div>';
  }

  /**
   * 渲染页脚
   */
  function renderFooter() {
    return '<footer class="app-footer">' +
      '<p>AI家庭日 — 让AI学习成为全家共享的创造之旅</p>' +
      '<p>麦子家庭队 · TRAE AI创造力大赛</p>' +
      '<p>© 2026 AI家庭日 All rights reserved</p>' +
      '</footer>';
  }

  // ============================================================
  //  用户认证系统 (V6)
  // ============================================================

  /**
   * Check if user is registered
   */
  function isRegistered() {
    return state.user !== null;
  }

  /**
   * Register with phone number
   * phone: string like '13812345678'
   * nickname: optional display name
   * Returns: { success: true, user: userObject } or { success: false, error: '已注册' }
   */
  function registerWithPhone(phone, nickname) {
    if (state.user) return { success: false, error: '已经注册过了' };
    if (!phone || phone.length < 11) return { success: false, error: '请输入正确的手机号' };

    var maskedPhone = phone.substring(0, 3) + '****' + phone.substring(7);
    var user = {
      id: 'usr_' + Date.now(),
      phone: maskedPhone,
      rawPhone: phone,
      wechatOpenid: '',
      nickname: nickname || 'AI家庭用户',
      avatar: '',
      registerDate: getToday(),
      lastLoginDate: getToday(),
      isNewUser: true
    };
    state.user = user;
    save('state', state);
    // V6: 新用户注册赠送50初始积分，可立即体验创作功能
    addPoints('creative', 30, '新用户注册奖励');
    addPoints('learning', 20, '新用户注册奖励');
    return { success: true, user: user };
  }

  /**
   * Register with WeChat (simulated)
   * nickname: display name
   * Returns: { success: true, user: userObject }
   */
  function registerWithWechat(nickname) {
    if (state.user) return { success: false, error: '已经注册过了' };

    var user = {
      id: 'usr_' + Date.now(),
      phone: '',
      rawPhone: '',
      wechatOpenid: 'wx_sim_' + Date.now(),
      nickname: nickname || '微信用户',
      avatar: '',
      registerDate: getToday(),
      lastLoginDate: getToday(),
      isNewUser: true
    };
    state.user = user;
    save('state', state);
    // V6: 新用户注册赠送50初始积分
    addPoints('creative', 30, '新用户注册奖励');
    addPoints('learning', 20, '新用户注册奖励');
    return { success: true, user: user };
  }

  /**
   * Login (auto-login if already registered)
   * Returns: user object or null
   */
  function login() {
    if (state.user) {
      state.user.lastLoginDate = getToday();
      save('state', state);
    }
    return state.user;
  }

  /**
   * Get current user info
   */
  function getUser() {
    return state.user;
  }

  /**
   * Update user profile
   */
  function updateUserProfile(updates) {
    if (!state.user) return false;
    Object.keys(updates).forEach(function(key) {
      if (key !== 'id' && key !== 'registerDate') {
        state.user[key] = updates[key];
      }
    });
    save('state', state);
    return state.user;
  }

  /**
   * Mark user as completed onboarding (no longer new user)
   */
  function completeOnboarding() {
    if (state.user) {
      state.user.isNewUser = false;
      save('state', state);
    }
    // Also mark as visited to prevent old welcome modal
    markVisited();
  }

  /**
   * Logout and clear user data (keep state data like points/badges)
   */
  function logout() {
    state.user = null;
    save('state', state);
  }

  /**
   * Render user info in nav (replaces part of logo area)
   * Returns HTML string for user avatar/name in nav
   */
  function renderUserNav() {
    var user = state.user;
    if (!user) return '';
    var avatar = user.avatar ?
      '<img src="' + user.avatar + '" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">' :
      '<div style="width:26px;height:26px;border-radius:50%;background:var(--color-primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;">' + (user.nickname.charAt(0) || 'U') + '</div>';
    return '<div class="app-nav-user" style="display:flex;align-items:center;gap:6px;margin-left:12px;flex-shrink:0;cursor:pointer;" onclick="App.showUserMenu()">' +
      avatar +
      '<span style="font-size:13px;color:var(--color-warm-cream);font-weight:500;max-width:80px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + user.nickname + '</span></div>';
  }

  /**
   * Show user menu dropdown (simple implementation)
   */
  function showUserMenu() {
    var existing = document.getElementById('user-menu-dropdown');
    if (existing) { existing.remove(); return; }

    var user = state.user;
    if (!user) return;

    var menu = document.createElement('div');
    menu.id = 'user-menu-dropdown';
    menu.style.cssText = 'position:fixed;top:48px;right:24px;background:#fff;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.15);padding:8px 0;z-index:2000;min-width:180px;';

    var items = [
      { label: user.phone || '微信用户', desc: user.nickname, icon: '👤', action: '' },
      { label: '我的积分', desc: getTotalPoints() + ' 积分', icon: '⭐', action: "location.href='rewards.html'" },
      { label: '我的作品', desc: (state.gallery || []).length + ' 件作品', icon: '🎨', action: "location.href='rewards.html'" },
      { label: '退出登录', desc: '', icon: '🚪', action: 'App.logout();location.reload()' }
    ];

    var html = '';
    items.forEach(function(item) {
      if (item.action) {
        html += '<div style="padding:10px 16px;cursor:pointer;display:flex;align-items:center;gap:10px;font-size:14px;color:var(--color-warm-cream);" onclick="' + item.action + ';document.getElementById(\'user-menu-dropdown\').remove();" onmouseover="this.style.background=\'rgba(0,0,0,0.04)\'" onmouseout="this.style.background=\'transparent\'">' +
          '<span style="font-size:18px;">' + item.icon + '</span>' +
          '<div><div style="font-weight:500;">' + item.label + '</div>' +
          (item.desc ? '<div style="font-size:12px;color:var(--color-grey-brown);">' + item.desc + '</div>' : '') +
          '</div></div>';
      } else {
        html += '<div style="padding:10px 16px;display:flex;align-items:center;gap:10px;border-bottom:1px solid rgba(0,0,0,0.06);">' +
          '<span style="font-size:18px;">' + item.icon + '</span>' +
          '<div><div style="font-weight:600;">' + item.label + '</div>' +
          (item.desc ? '<div style="font-size:12px;color:var(--color-grey-brown);">' + item.desc + '</div>' : '') +
          '</div></div>';
      }
    });

    menu.innerHTML = html;
    document.body.appendChild(menu);

    // Close on click outside
    setTimeout(function() {
      document.addEventListener('click', function handler(e) {
        if (!menu.contains(e.target) && !e.target.closest('.app-nav-user')) {
          menu.remove();
          document.removeEventListener('click', handler);
        }
      });
    }, 100);
  }

  /**
   * Check if user should see onboarding flow
   */
  function shouldShowOnboarding() {
    return state.user && state.user.isNewUser;
  }

  /**
   * Render registration/login page HTML
   * This returns a full page overlay for registration
   */
  function renderAuthPage() {
    return '<div id="auth-overlay" style="position:fixed;inset:0;background:var(--surface-canvas);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;">' +
      '<div style="background:#fff;border-radius:20px;padding:40px 32px;max-width:420px;width:100%;box-shadow:0 20px 60px rgba(44,24,16,0.15);text-align:center;">' +
      '<div style="margin-bottom:24px;">' +
      '<img src="../assets/logo-icon.jpg" style="width:64px;height:64px;border-radius:16px;margin:0 auto 12px;display:block;">' +
      '<h1 style="font-family:var(--font-display);font-size:28px;font-weight:800;color:var(--color-warm-cream);margin:0;">AI<span style="color:var(--color-primary);">家庭日</span></h1>' +
      '<p style="color:var(--color-grey-brown);margin:8px 0 0;font-size:14px;">让AI学习成为全家共享的创造之旅</p>' +
      '</div>' +
      '<div id="auth-form">' +
      '<h2 style="font-size:18px;margin:0 0 16px;color:var(--color-warm-cream);">选择注册方式</h2>' +
      '<div style="display:flex;flex-direction:column;gap:12px;">' +
      '<button onclick="App.showPhoneRegister()" style="display:flex;align-items:center;gap:12px;padding:14px 20px;border:2px solid var(--color-sky-soft);border-radius:12px;background:#fff;cursor:pointer;font-size:15px;color:var(--color-warm-cream);font-weight:500;transition:all 0.2s;" onmouseover="this.style.borderColor=\'var(--color-primary)\'" onmouseout="this.style.borderColor=\'var(--color-sky-soft)\'">' +
      '<span style="font-size:24px;">📱</span><span>手机号注册</span></button>' +
      '<button onclick="App.registerWechat()" style="display:flex;align-items:center;gap:12px;padding:14px 20px;border:2px solid #07c160;border-radius:12px;background:#fff;cursor:pointer;font-size:15px;color:#07c160;font-weight:500;transition:all 0.2s;" onmouseover="this.style.background=\'#07c16010\'" onmouseout="this.style.background=\'#fff\'">' +
      '<span style="font-size:24px;">💬</span><span>微信一键登录</span></button>' +
      '</div>' +
      '<p style="color:var(--color-grey-brown);font-size:12px;margin-top:16px;">注册即代表同意《AI家庭日用户协议》</p>' +
      '</div>' +
      '<div id="auth-phone-form" style="display:none;">' +
      '<h2 style="font-size:18px;margin:0 0 16px;color:var(--color-warm-cream);">📱 手机号注册</h2>' +
      '<input type="tel" id="auth-phone-input" maxlength="11" placeholder="请输入手机号" style="width:100%;padding:12px 16px;border:2px solid rgba(196,181,164,0.4);border-radius:10px;font-size:15px;outline:none;box-sizing:border-box;margin-bottom:8px;" onfocus="this.style.borderColor=\'var(--color-primary)\'" onblur="this.style.borderColor=\'rgba(196,181,164,0.4)\'">' +
      '<input type="text" id="auth-nickname-input" placeholder="给自己起个昵称（选填）" style="width:100%;padding:12px 16px;border:2px solid rgba(196,181,164,0.4);border-radius:10px;font-size:15px;outline:none;box-sizing:border-box;margin-bottom:8px;" onfocus="this.style.borderColor=\'var(--color-primary)\'" onblur="this.style.borderColor=\'rgba(196,181,164,0.4)\'">' +
      '<button onclick="App.doPhoneRegister()" style="width:100%;padding:12px;border:none;border-radius:10px;background:var(--color-primary);color:#fff;font-size:15px;font-weight:600;cursor:pointer;box-shadow:0 4px 12px rgba(200,68,0,0.3);margin-top:8px;">注册并开始</button>' +
      '<p id="auth-error" style="color:#e53e3e;font-size:13px;margin-top:8px;display:none;"></p>' +
      '<button onclick="document.getElementById(\'auth-form\').style.display=\'block\';document.getElementById(\'auth-phone-form\').style.display=\'none\';" style="background:none;border:none;color:var(--color-grey-brown);cursor:pointer;font-size:14px;margin-top:12px;">← 返回</button>' +
      '</div>' +
      '</div></div>';
  }

  function showPhoneRegister() {
    document.getElementById('auth-form').style.display = 'none';
    document.getElementById('auth-phone-form').style.display = 'block';
    setTimeout(function() { document.getElementById('auth-phone-input').focus(); }, 100);
  }

  function doPhoneRegister() {
    var phone = document.getElementById('auth-phone-input').value.trim();
    var nickname = document.getElementById('auth-nickname-input').value.trim();
    var result = registerWithPhone(phone, nickname);
    if (!result.success) {
      var errEl = document.getElementById('auth-error');
      errEl.textContent = result.error;
      errEl.style.display = 'block';
      return;
    }
    // Registration successful, remove overlay
    var overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.remove();
    showToast('欢迎加入AI家庭日！', 'success');
    // Trigger onboarding check
    if (typeof window.onAuthSuccess === 'function') window.onAuthSuccess();
  }

  function registerWechat() {
    var result = registerWithWechat('微信用户');
    if (!result.success) return;
    var overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.remove();
    showToast('微信登录成功！', 'success');
    if (typeof window.onAuthSuccess === 'function') window.onAuthSuccess();
  }

  // ============================================================
  //  导出
  // ============================================================

  /**
   * Share a work to community
   * type: 'COMIC', 'VIDEO', 'MODEL', 'PPT', 'PHOTO'
   */
  function shareToCommunity(type) {
    var typeNames = { COMIC: '漫画', VIDEO: '视频', MODEL: '3D模型', PPT: '文档', PHOTO: '照片' };
    var typeName = typeNames[type] || '作品';
    
    // Create community post
    var post = {
      id: 'post_' + Date.now(),
      author: state.user ? state.user.nickname : '匿名用户',
      avatar: state.user && state.user.avatar ? state.user.avatar : '',
      type: type,
      title: '我的' + typeName + '创作',
      content: '刚刚用AI家庭日创作了一幅' + typeName + '！一起来体验AI创作的乐趣吧！',
      date: getToday(),
      likes: 0,
      comments: []
    };
    
    // Add to community posts in localStorage
    var posts = load('community_posts', []);
    posts.unshift(post);
    if (posts.length > 50) posts = posts.slice(0, 50);
    save('community_posts', posts);
    
    // Add points for sharing
    addPoints('creative', 20, '分享' + typeName + '到社区');
    state.shareCount = (state.shareCount || 0) + 1;
    save('state', state);
    
    showToast('分享成功！+20积分', 'success');
    createConfetti();
  }

  /**
   * Share to WeChat Moments (simulated - shows share card)
   */
  function shareToWechat(type) {
    var typeNames = { COMIC: '漫画', VIDEO: '视频', MODEL: '3D模型', PPT: '文档', PHOTO: '照片' };
    var typeName = typeNames[type] || '作品';
    var user = state.user;
    var nick = user ? user.nickname : '我';
    
    var card = document.createElement('div');
    card.id = 'wechat-share-card';
    card.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9000;display:flex;align-items:center;justify-content:center;padding:20px;';
    card.innerHTML = '<div style="background:#fff;border-radius:16px;padding:28px;max-width:340px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.3);">' +
      '<div style="font-size:40px;margin-bottom:12px;">💬</div>' +
      '<h3 style="font-size:18px;color:#07c160;margin:0 0 8px;">分享到微信朋友圈</h3>' +
      '<div style="background:#f7f7f7;border-radius:10px;padding:14px;margin:16px 0;text-align:left;">' +
      '<p style="font-size:14px;color:#333;margin:0 0 6px;font-weight:600;">' + nick + ' 在AI家庭日创作了' + typeName + '</p>' +
      '<p style="font-size:12px;color:#666;margin:0;">快来AI家庭日，让AI学习成为全家共享的创造之旅！</p>' +
      '</div>' +
      '<div style="display:flex;gap:10px;justify-content:center;">' +
      '<button onclick="document.getElementById(\'wechat-share-card\').remove();App.showToast(\'已保存到相册，去微信发送吧！\',\'success\')" style="padding:10px 24px;border:none;border-radius:20px;background:#07c160;color:#fff;font-size:14px;font-weight:600;cursor:pointer;">保存图片</button>' +
      '<button onclick="document.getElementById(\'wechat-share-card\').remove()" style="padding:10px 24px;border:1px solid #ddd;border-radius:20px;background:#fff;color:#666;font-size:14px;cursor:pointer;">取消</button>' +
      '</div></div>';
    
    document.body.appendChild(card);
    card.addEventListener('click', function(e) {
      if (e.target === card) card.remove();
    });
  }

  return {
    getState: getState,
    getGreeting: getGreeting,
    getSelectedCharacter: getSelectedCharacter,
    selectCharacter: selectCharacter,
    addPoints: addPoints,
    getPointsLog: getPointsLog,
    canEarnChatPoints: canEarnChatPoints,
    getDailyTasksStatus: getDailyTasksStatus,
    getDailyQuestion: getDailyQuestion,
    getCheckinCalendar: getCheckinCalendar,
    checkin: checkin,
    getAIResponse: getAIResponse,
    addToGallery: addToGallery,
    getGallery: getGallery,
    isFirstVisit: isFirstVisit,
    markVisited: markVisited,
    resetAllData: resetAllData,
    generatePlan: generatePlan,
    getPlan: getPlan,
    getCurrentWeekIndex: getCurrentWeekIndex,
    completeSession: completeSession,
    isSessionDone: isSessionDone,
    saveAssessment: saveAssessment,
    getAssessment: getAssessment,
    showToast: showToast,
    showBadgePopup: showBadgePopup,
    checkBadgeUnlocks: checkBadges,
    showPointsAnimation: showPointsAnimation,
    createConfetti: createConfetti,
    renderNav: renderNav,
    renderBottomTab: renderBottomTab,
    renderFooter: renderFooter,
    spendPoints: spendPoints,
    getTotalPoints: getTotalPoints,
    getLastActiveDate: getLastActiveDate,
    AI_NEWS: AI_NEWS,
    AI_LIFE_SCENES: AI_LIFE_SCENES,
    AI_CHALLENGES: AI_CHALLENGES,
    AI_KNOWLEDGE_MAP: AI_KNOWLEDGE_MAP,
    exploreKnowledge: exploreKnowledge,
    getKnowledgeMap: getKnowledgeMap,
    completeChallenge: completeChallenge,
    getCompletedChallenges: getCompletedChallenges,
    GROUP_TYPES: GROUP_TYPES,
    EXAMPLE_GROUPS: EXAMPLE_GROUPS,
    joinGroup: joinGroup,
    getUserGroups: getUserGroups,
    leaveGroup: leaveGroup,
    CHARACTERS: CHARACTERS,
    MODELS_3D: MODELS_3D,
    BADGES: BADGES,
    DAILY_TASKS: DAILY_TASKS,
    ACTIVITY_POOL: ACTIVITY_POOL,
    WEEK_THEMES: WEEK_THEMES,
    WEEKLY_COURSES: WEEKLY_COURSES,
    COMMUNITY_POSTS: COMMUNITY_POSTS,
    // V6 User Auth System
    isRegistered: isRegistered,
    registerWithPhone: registerWithPhone,
    registerWechat: registerWechat,
    login: login,
    getUser: getUser,
    updateUserProfile: updateUserProfile,
    completeOnboarding: completeOnboarding,
    logout: logout,
    renderUserNav: renderUserNav,
    showUserMenu: showUserMenu,
    shouldShowOnboarding: shouldShowOnboarding,
    renderAuthPage: renderAuthPage,
    showPhoneRegister: showPhoneRegister,
    doPhoneRegister: doPhoneRegister,
    shareToCommunity: shareToCommunity,
    shareToWechat: shareToWechat
  };

})();
