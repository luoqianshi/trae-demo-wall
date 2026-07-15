// ====== App State ======
const state = {
  currentTab: 'home',
  currentBook: null,
  currentChapter: 0,
  selectedDiff: 'hard',
  quizIndex: 0,
  answers: [],
  checkinDone: false,
  checkinStreak: 5,
  checkinHistory: [true, true, true, true, true, false, false], // last 7 days
  lastReadChapter: {}, // { bookId: chapterIndex }
};

// ====== Book Data ======
const books = {
  'the-little-prince': {
    id: 'the-little-prince',
    title: '小王子',
    author: '圣埃克苏佩里',
    cover: '🌹',
    coverBg: 'linear-gradient(135deg,#4a7c59,#6a9c7a)',
    totalChapters: 3,
    chapters: [
      { name: '遇见小王子', unlocked: ['easy', 'hard'], passed: ['easy'], content: '六岁那年，我在一本关于原始森林的书里看到一幅精彩的插图，画的是一条蟒蛇正在吞食一头野兽。书上说："蟒蛇将猎物整个吞下，不加咀嚼。之后它们动弹不得，需要睡上六个月来消化。"\n\n于是我对丛林冒险产生了无限遐想，用彩色铅笔完成了我的第一幅画作。我把我的杰作拿给大人们看，问他们是否害怕。他们回答："一顶帽子有什么好怕的？"\n\n我画的不是帽子，是一条蟒蛇正在消化一头大象。为了让大人们理解，我又画了蟒蛇的内部。大人们劝我把这些画放到一边，专心学习地理、历史、算术和语法。就这样，六岁时我放弃了成为画家的美好前程。\n\n我只好选择另一个职业，学会了开飞机。我飞遍了世界各地。地理知识确实帮了大忙，我一眼就能分辨中国和亚利桑那。在夜间迷航时，这些知识非常有用。\n\n我的一生中，和许多严肃的人打过交道。我在大人们中间生活了很久，近距离观察过他们，但这并没有改变我对他们的看法。\n\n每当我遇到一个看起来头脑还算清楚的大人，我就拿出我一直保存着的第一幅画来测试他。我想知道是否有人能真正理解这幅画。但他们的回答总是："这是一顶帽子。"于是我就不再和他们谈蟒蛇、原始森林或星星了。我会迁就他们，谈论桥牌、高尔夫、政治和领带。大人们会很高兴认识这样一个通情达理的人。' },
      { name: '星球之旅', unlocked: ['easy'], passed: [], content: '我就这样孤独地生活着，没有真正可以交谈的人。直到六年前，我的飞机在撒哈拉沙漠出了故障。发动机里有什么东西坏了。身边没有机械师也没有乘客，我准备独自完成这项艰巨的修理工作。对我来说，这是生死攸关的问题——我带的水只够喝八天。\n\n第一天晚上，我就在远离人烟的沙漠里睡着了，比海上遇难者趴在木筏上还要孤独。所以，当黎明时分一个细小的声音把我唤醒时，你可以想象我有多惊讶。那个声音说："请你……给我画一只羊吧！"\n\n"什么？"\n\n"给我画一只羊……"\n\n我跳了起来，像是被雷击中了一样。我使劲揉了揉眼睛，仔细看了看，看见一个非常奇特的小人儿，正严肃地注视着我。这就是我后来画出的最好的他的肖像。\n\n于是我画了。画了一只羊。他仔细看了看，然后说："不对！这只羊已经病得很重了。再画一只。"我又画了一只。我的朋友温和地笑了："你自己看看……这不是羊，是一只公羊，它有角……"\n\n于是我重新画了一幅，但又被他拒绝了："这只太老了。我想要一只能活很久的羊。"\n\n我不耐烦了，因为我急着修理发动机，就随便画了一个盒子，说："这是箱子，你要的羊就在里面。"\n\n但令我惊讶的是，我的小评判员脸上露出了喜色："这正是我想要的！你觉得这只羊需要很多草吗？"\n\n就这样，我认识了小王子。' },
      { name: '地球与狐狸', unlocked: [], passed: [], content: '小王子穿过沙漠，只遇到了一朵花。那是一朵只有三片花瓣的花，毫不起眼。\n\n"你好。"小王子说。\n\n"你好。"花说。\n\n"人在哪里？"小王子礼貌地问。\n\n这朵花曾经见过一支商队经过。"人？我想是有的，大概六七个吧。几年前我见过他们。但不知道去哪里找他们。风把他们吹走了。他们没有根，这让生活很艰难。"\n\n"再见。"小王子说。\n\n"再见。"花说。\n\n然后小王子来到了地球。他爬上了一座高山，以前他见过的山只有他膝盖那么高——那是三座火山。\n\n"你好。"他试探着说。\n\n"你好……你好……你好……"回声回答。\n\n"你是谁？"小王子说。\n\n"你是谁……你是谁……你是谁……"回声回答。\n\n"做我的朋友吧，我很孤独。"他说。\n\n"我很孤独……我很孤独……我很孤独……"回声回答。\n\n"多么奇怪的星球啊！"他想，"这里干燥、尖锐，完全缺乏想象力。人们只会重复别人说的话……在我的星球上，我有一朵花，她总是第一个开口说话。"\n\n后来，他遇到了一只狐狸。\n\n"你好。"小王子说。\n\n"你好。"狐狸说。\n\n"你是谁？"小王子说，"你真漂亮。"\n\n"我是一只狐狸。"狐狸说。\n\n"来和我一起玩吧，"小王子提议，"我很伤心。"\n\n"我不能和你一起玩，"狐狸说，"我没有被驯服。"\n\n"啊！对不起。"小王子说。但想了一会儿，他又问："什么叫驯服？"\n\n"这不是一个被遗忘的词，"狐狸说，"它意味着建立联系。"\n\n"建立联系？"\n\n"当然。"狐狸说。"对我来说，你只是一个小男孩，和其他成千上万个小男孩没什么两样。我不需要你。你也不需要我。对你来说，我只是一只狐狸，和其他成千上万只狐狸没什么两样。但是，如果你驯服了我，我们就会彼此需要。对我来说，你就是世界上独一无二的。对你来说，我也将是世界上独一无二的。"' },
    ],
    questions: {
      easy: [
        { q: '请简述本章的主要情节。', hint: '回顾故事的核心内容' },
        { q: '本章中出现了哪些关键人物？他们的作用是什么？', hint: '梳理人物关系' },
        { q: '本章最打动你的段落是什么？为什么？', hint: '表达个人感受' },
      ],
      hard: [
        { q: '作者通过本章想表达什么核心观点？请结合具体情节分析。', hint: '分析主题' },
        { q: '本章的结构安排有什么特点？作者是如何推进情节的？', hint: '分析叙事技巧' },
        { q: '本章中的人物对话有什么深意？请选择一段对话进行分析。', hint: '分析对话' },
      ],
      hell: [
        { q: '用一句话反驳本章的核心观点。作者在哪些地方可能存在逻辑漏洞？', hint: '批判性思考' },
        { q: '如果让你改写本章的结局，你会如何改写？为什么？', hint: '创造性输出' },
        { q: '本章的观点在今天的社会中是否仍然适用？请举例说明。', hint: '批判性输出' },
      ],
    },
  },
  'alive': {
    id: 'alive',
    title: '活着',
    author: '余华',
    cover: '📖',
    coverBg: 'linear-gradient(135deg,#c75b3a,#d4856a)',
    totalChapters: 3,
    chapters: [
      { name: '富贵公子', unlocked: ['easy'], passed: ['easy'], content: '我比现在年轻十岁的时候，获得了一个游手好闲的职业——去乡间收集民间歌谣。那一年的整个夏天，我如同一只乱飞的麻雀，游荡在知了和阳光充斥的农村。我喜欢喝农民那种带有苦味的茶水，他们的茶桶就放在田埂的树下，我毫无顾忌地拿起漆满茶垢的茶碗舀水喝，还把自己的水壶灌满，与田里的男人说上几句废话，在姑娘们因我而起的窃窃私笑里扬长而去。\n\n我遇到那位名叫福贵的老人时，是夏天刚刚来到的季节。\n\n那天午后，我走到了一棵有着茂盛树叶的树下，田里的棉花已被收起，几个包着头巾的女人正将棉秆拔出来，她们不时抖动着屁股摔去根须上的泥巴。我摘下草帽，从身后取过毛巾擦起脸上的汗水，身后传来一个沙哑的声音："你在这里干什么？"\n\n我吓了一跳，回过头去，看到一个老人正站在我身后。他穿了一件汗衫，短裤，赤着脚，手里拿着一根竹竿，竹竿的另一头系着一头老牛。\n\n老人黝黑的脸在阳光里笑得十分生动，脸上的皱纹欢乐地游动着，里面镶满了泥土，就如布满田间的小道。\n\n这位老人后来和我一起坐在了那棵茂盛的树下，在那个充满阳光的下午，他向我讲述了自己。' },
      { name: '家道中落', unlocked: ['easy'], passed: [], content: '四十多年前，我爹还活着，我们徐家有一百多亩地，从这里一直到那边工厂的烟囱，都是我家的。我爹年轻的时候，也是个败家子，常去城里嫖妓和赌博，把我爷爷留下的家产输掉了一半。\n\n到了我这一代，我比他更败家。我从小在女人堆里长大，常去青楼，也学会了赌博。我爹知道了，就把我吊起来打，打得我三四天下不了床。可是伤好了，我还是去。\n\n我最后一次赌博，是在龙二那里。龙二是开赌场的，我输了很多钱，欠了他很多债。那天晚上，我把我家的地契也押上了。\n\n龙二问我："你真要押？"\n\n我说："押。"\n\n龙二说："你爹知道了，会打死你的。"\n\n我说："我现在管不了那么多了。"\n\n那天晚上，我把一百多亩地全部输光了。\n\n回到家，我爹气得浑身发抖，他没有打我，而是把我叫到祠堂里，让我跪在祖宗牌位前。他拿着地契，一张一张地烧掉，火光映着他苍老的脸。他什么也没说，只是流泪。\n\n不久后，我爹从粪缸上摔下来，死了。我娘也病倒了。我的妻子家珍被她爹接回了娘家。我抱着我女儿凤霞，站在空荡荡的院子里，终于明白什么是"家破人亡"。' },
      { name: '活着本身', unlocked: [], passed: [], content: '龙二没有把我赶出门，而是让我继续住在我家的老宅里，但要我给他种地。我从一个少爷变成了佃户，从没干过农活的我，每天天不亮就下地，天黑才回来。手心磨出了血泡，又变成老茧。\n\n家珍后来回来了，带着我们的儿子有庆。她说："我不跟你过苦日子，我回来是怕你饿死。"她嘴上这么说，却每天和我一起下地干活。\n\n日子就这样过着。后来，解放了，土地改革了。龙二因为是地主，被枪毙了。我分到了五亩地，那本来就是我家的地。龙二死前对我说："福贵，我是替你去死的。"\n\n我听了这话，心里说不出什么滋味。\n\n后来，饥荒来了。村里饿死了很多人。家珍去城里要饭，把要来的半碗粥端回来给我和有庆吃。她自己啃树皮。\n\n有庆长大了，在学校里跑步第一名。体育老师说他是个好苗子，将来能当运动员。可是有一天，县长老婆生孩子大出血，学校组织学生献血，有庆的血型正好匹配。医生抽了太多的血，有庆就那样死了。\n\n我抱着有庆的尸体，在医院的走廊里走了一夜。我想哭，可是哭不出来。\n\n后来，凤霞嫁了人，生了个儿子。可凤霞生孩子时大出血，也死了。她死的那天，天下着大雨。\n\n再后来，家珍也死了。\n\n我还活着。我买了一头老牛，给它起名叫"福贵"。村里人都说，这头牛活不过两年。可它活了很多年。\n\n我对它说："福贵啊，你要好好活着。"\n\n然后我们两个，一起走在田埂上。' },
    ],
    questions: {
      easy: [
        { q: '请简述本章的主要情节。', hint: '回顾故事的核心内容' },
        { q: '本章中出现了哪些关键人物？他们的作用是什么？', hint: '梳理人物关系' },
        { q: '本章最打动你的段落是什么？为什么？', hint: '表达个人感受' },
      ],
      hard: [
        { q: '作者通过本章想表达什么核心观点？请结合具体情节分析。', hint: '分析主题' },
        { q: '本章的结构安排有什么特点？作者是如何推进情节的？', hint: '分析叙事技巧' },
        { q: '本章中的人物命运转折有什么深意？请选择一段进行分析。', hint: '分析人物命运' },
      ],
      hell: [
        { q: '有人认为本章过于悲观，你同意吗？用具体论据支撑你的观点。', hint: '批判性思考' },
        { q: '如果本章的故事发生在今天，会有什么不同？', hint: '时代批判' },
        { q: '重新设计本章的叙事结构，你会如何改变？', hint: '创造性重构' },
      ],
    },
  },
  'nvc': {
    id: 'nvc',
    title: '非暴力沟通',
    author: '马歇尔·卢森堡',
    cover: '💬',
    coverBg: 'linear-gradient(135deg,#3a6b9c,#5a8bbc)',
    totalChapters: 3,
    chapters: [
      { name: '观察与评论', unlocked: ['easy'], passed: [], content: '非暴力沟通的第一步，是学会区分观察和评论。\n\n印度哲学家克里希那穆提曾说："不带评论的观察，是人类智力的最高形式。"对于大多数人来说，观察他人而不做评判、批判或分析，是极其困难的。\n\n当我们使用"总是"、"从不"、"经常"、"很少"这类词语时，往往是在表达评论而非观察。例如："你总是迟到"——这是一种评论。而观察则是："你这周三次会议都迟到了十分钟。"\n\n让我们看一个例子。一位母亲对儿子说："你是个懒孩子。"这是评论。如果她用观察的方式表达，她会说："你今天没有整理床铺，也没有做作业。"\n\n非暴力沟通并不要求我们完全避免评论，而是鼓励我们区分观察和评论。当我们把观察和评论混为一谈时，人们更倾向于听到批评，从而产生抵触情绪。\n\n马歇尔·卢森堡博士分享了一个案例：一位校长在教师会议上说："你们这些老师太不负责了。"结果老师们集体沉默，会议不欢而散。如果校长说："我注意到这学期有三份教学计划没有按时提交，我想了解是什么原因。"效果会完全不同。\n\n记住：观察是具体的、可测量的、有时间限制的。评论是笼统的、带有评判性的。学会区分这两者，是非暴力沟通的起点。' },
      { name: '感受与需要', unlocked: [], passed: [], content: '在非暴力沟通中，第二步是表达感受，第三步是明确需要。这两者紧密相连——我们的感受，根源于我们的需要是否得到满足。\n\n当我们说"我感到被忽视"，这其实不是感受，而是对他人行为的判断。真正的感受是："我感到孤独"、"我感到失落"、"我感到伤心"。\n\n马歇尔·卢森堡强调，要建立丰富的感受词汇。很多人只会说"我感觉好"或"我感觉不好"，这样无法准确传达内心状态。试试用这些词：兴奋、喜悦、感动、振奋、满足、安心；或者：焦虑、沮丧、疲惫、困惑、孤独、愤怒。\n\n感受的背后是需要。当我们说"我感到愤怒，因为你没有遵守承诺"，这仍然在指责对方。更好的表达是："我感到失望，因为我需要信任和可靠性。"\n\n举个例子：一位妻子对丈夫说："你每天加班到这么晚，我感到很生气。"这会让丈夫感到被指责。如果她说："你这周每天十点后才回家，我感到孤单，因为我需要陪伴和亲密。"丈夫更容易理解她的感受，而不是产生防御心理。\n\n核心公式：我感到（感受），因为我需要（需要）。这比"你让我感到……"更能促进沟通。' },
      { name: '请求与倾听', unlocked: [], passed: [], content: '非暴力沟通的最后一步是提出请求，同时学会倾听他人的感受和需要。\n\n请求不是命令。请求和命令的区别在于：当对方说"不"时，命令会让对方感到被指责或惩罚，而请求尊重对方的自主权。\n\n一个有效的请求需要是具体的、正向的、可操作的。不要说"我希望你更尊重我"，而要说"下次我说话时，你可不可以先让我说完再回应？"\n\n马歇尔·卢森堡举了一个例子：一位妻子对丈夫说："我希望你多陪陪我。"丈夫于是减少了加班，每天晚上在家看电视。妻子感到更加孤独，因为她真正的需要不是物理上的陪伴，而是情感交流。更准确的请求是："我希望我们每周能有三个晚上一起散步或聊天。"\n\n倾听同样重要。当别人对我们说"不"或表达负面情绪时，我们常常急于辩解、给建议、或者安慰。但非暴力沟通鼓励我们先去倾听对方的感受和需要。\n\n比如，当孩子说"我不想做作业"，与其说"你必须做"，不如问："你是不是觉得累了？还是觉得作业太难了？"这样能引导孩子表达真实感受，而不是激起对抗。\n\n记住：先倾听，再回应。用"你感到……因为你需要……"的句式来反馈，让对方感受到被理解。' },
    ],
    questions: {
      easy: [
        { q: '请简述本章的核心概念。', hint: '回顾核心内容' },
        { q: '本章中作者用了什么案例来说明观点？', hint: '梳理案例' },
        { q: '本章对你日常沟通有什么启发？', hint: '联系实际' },
      ],
      hard: [
        { q: '本章的方法相比传统沟通方式有什么优势？请分析。', hint: '对比分析' },
        { q: '作者如何论证本章的核心观点？论证是否充分？', hint: '分析论证结构' },
        { q: '本章的方法在哪些场景下可能不适用？为什么？', hint: '批判性分析' },
      ],
      hell: [
        { q: '设计一个本章方法无法解决的沟通场景，并说明原因。', hint: '批判性思维' },
        { q: '如果你要改进本章提出的方法，你会增加或修改什么？', hint: '创造性重构' },
        { q: '本章的方法在不同文化背景下的适用性如何？请分析。', hint: '跨文化批判' },
      ],
    },
  },
};

// ====== Tab Navigation ======
function switchTab(tab) {
  const prevTab = state.currentTab;
  state.currentTab = tab;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));

  const page = document.getElementById('page-' + tab);
  if (page) page.classList.add('active');

  const tabBtn = document.querySelector(`.tab-item[data-tab="${tab}"]`);
  if (tabBtn) tabBtn.classList.add('active');

  // Reset QA page to book detail when navigating to it
  if (tab === 'qa') {
    if (!state.currentBook) {
      state.currentBook = 'the-little-prince';
    }
    state.previousTab = prevTab;
    openBook(state.currentBook);
    return;
  }

  // Refresh calendar on profile
  if (tab === 'profile') {
    renderCalendar();
    updateProfileStats();
  }

  // Scroll to top
  document.getElementById('mainContent').scrollTop = 0;
}

// ====== Sub-page Navigation ======
function navigateTo(pageId) {
  state.previousTab = state.currentTab;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  const page = document.getElementById('page-' + pageId);
  if (page) page.classList.add('active');
  document.getElementById('mainContent').scrollTop = 0;
}

function switchRankTab(tab, btn) {
  document.querySelectorAll('#page-ranking .rank-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');

  const rankData = {
    hot: [
      { n:1, c:'🌹', bg:'linear-gradient(135deg,#4a7c59,#6a9c7a)', t:'小王子', d:'圣埃克苏佩里 · 9.8分', tag:'热门', tagCls:'tag-p0', quiz:'the-little-prince' },
      { n:2, c:'📖', bg:'linear-gradient(135deg,#c75b3a,#d4856a)', t:'活着', d:'余华 · 9.5分', tag:'必读', tagCls:'tag-p1', quiz:'alive' },
      { n:3, c:'💬', bg:'linear-gradient(135deg,#3a6b9c,#5a8bbc)', t:'非暴力沟通', d:'马歇尔·卢森堡 · 9.2分', tag:'新书', tagCls:'tag-p2', quiz:'nvc' },
      { n:4, c:'🧠', bg:'linear-gradient(135deg,#7b5ea7,#9b7ec7)', t:'思考，快与慢', d:'丹尼尔·卡尼曼 · 9.0分', tag:'推荐', tagCls:'tag-p0', quiz:'' },
      { n:5, c:'📚', bg:'linear-gradient(135deg,#c75b3a,#e8a040)', t:'百年孤独', d:'马尔克斯 · 8.9分', tag:'经典', tagCls:'tag-p1', quiz:'' },
    ],
    new: [
      { n:1, c:'💬', bg:'linear-gradient(135deg,#3a6b9c,#5a8bbc)', t:'非暴力沟通', d:'马歇尔·卢森堡 · 本周上新', tag:'新书', tagCls:'tag-p2', quiz:'nvc' },
      { n:2, c:'🧠', bg:'linear-gradient(135deg,#7b5ea7,#9b7ec7)', t:'思考，快与慢', d:'丹尼尔·卡尼曼 · 上周上新', tag:'推荐', tagCls:'tag-p0', quiz:'' },
      { n:3, c:'🌹', bg:'linear-gradient(135deg,#4a7c59,#6a9c7a)', t:'小王子', d:'圣埃克苏佩里 · 经典再版', tag:'经典', tagCls:'tag-p1', quiz:'the-little-prince' },
      { n:4, c:'🏛️', bg:'linear-gradient(135deg,#c75b3a,#d4856a)', t:'人类简史', d:'尤瓦尔·赫拉利 · 本月上新', tag:'热门', tagCls:'tag-p0', quiz:'' },
      { n:5, c:'💭', bg:'linear-gradient(135deg,#5a3e2b,#8b6e5a)', t:'存在与时间', d:'海德格尔 · 哲学经典', tag:'深度', tagCls:'tag-p2', quiz:'' },
    ],
    score: [
      { n:1, c:'🌹', bg:'linear-gradient(135deg,#4a7c59,#6a9c7a)', t:'小王子', d:'圣埃克苏佩里 · 9.8分', tag:'神作', tagCls:'tag-p0', quiz:'the-little-prince' },
      { n:2, c:'📖', bg:'linear-gradient(135deg,#c75b3a,#d4856a)', t:'活着', d:'余华 · 9.5分', tag:'必读', tagCls:'tag-p1', quiz:'alive' },
      { n:3, c:'📚', bg:'linear-gradient(135deg,#c75b3a,#e8a040)', t:'百年孤独', d:'马尔克斯 · 9.3分', tag:'经典', tagCls:'tag-p1', quiz:'' },
      { n:4, c:'🧠', bg:'linear-gradient(135deg,#7b5ea7,#9b7ec7)', t:'思考，快与慢', d:'丹尼尔·卡尼曼 · 9.0分', tag:'推荐', tagCls:'tag-p0', quiz:'' },
      { n:5, c:'💬', bg:'linear-gradient(135deg,#3a6b9c,#5a8bbc)', t:'非暴力沟通', d:'马歇尔·卢森堡 · 8.8分', tag:'实用', tagCls:'tag-p2', quiz:'nvc' },
    ],
  };

  const list = rankData[tab] || rankData.hot;
  const colors = ['var(--accent)', 'var(--accent)', 'var(--accent)', 'var(--muted)', 'var(--muted)'];
  let html = '';
  list.forEach((item, i) => {
    const action = item.quiz ? `onclick="openBook('${item.quiz}')"` : `onclick="showToast('敬请期待')"`;
    html += `
      <div class="rank-item" ${action}>
        <span class="rank-num" style="background:${i < 3 ? 'var(--accent)' : 'var(--muted)'}">${item.n}</span>
        <div class="rank-cover" style="background:${item.bg}">${item.c}</div>
        <div class="rank-info">
          <div class="rank-title">${item.t}</div>
          <div class="rank-desc">${item.d}</div>
        </div>
        <span class="rank-tag ${item.tagCls}">${item.tag}</span>
      </div>`;
  });
  document.getElementById('rankList').innerHTML = html;
}

// ====== Check-in ======
function doCheckin(showPopup = true) {
  if (state.checkinDone) return;
  state.checkinDone = true;
  state.checkinStreak++;
  document.getElementById('checkinDays').textContent = state.checkinStreak;
  document.getElementById('checkinBtn').textContent = '已打卡 ✓';
  document.getElementById('checkinBtn').classList.add('done');
  document.getElementById('checkinSub').textContent =
    state.checkinStreak >= 7 ? '🎉 已解锁付费章节！' : `再坚持 ${7 - state.checkinStreak} 天解锁付费章节`;
  document.getElementById('streakDays').textContent = state.checkinStreak;
  showToast('打卡成功！+1 天');

  if (showPopup) {
    showCheckinPopup();
  }
}

// ====== Book & Chapter Navigation ======
function openBook(bookId) {
  state.currentBook = bookId;
  const book = books[bookId];
  if (!book) return;

  document.getElementById('bdCover').style.background = book.coverBg;
  document.getElementById('bdCover').textContent = book.cover;
  document.getElementById('bdBookTitle').textContent = book.title;
  document.getElementById('bdAuthor').textContent = book.author;
  document.getElementById('bdTotal').textContent = book.totalChapters;

  const totalPassed = book.chapters.filter(ch => ch.passed.length > 0).length;
  document.getElementById('bdPassed').textContent = totalPassed;

  // 上次阅读位置
  const lastCh = state.lastReadChapter[bookId];
  const btnContinue = document.getElementById('btnContinueRead');
  btnContinue.textContent = '阅读';
  btnContinue.style.display = 'block';
  btnContinue.onclick = () => openChapter(lastCh !== undefined ? lastCh : 0);

  renderChapterList();
  navigateTo('book-detail');
  document.getElementById('mainContent').scrollTop = 0;
}

function renderChapterList() {
  const book = books[state.currentBook];
  if (!book) return;
  const list = document.getElementById('chapterList');
  let html = '';
  book.chapters.forEach((ch, i) => {
    const allDone = ch.passed.length >= 3;
    let numCls = 'lock';
    if (allDone) numCls = 'done';
    else if (ch.unlocked.length > 0) numCls = 'cur';

    let dotsHtml = '';
    const diffs = ['easy', 'hard', 'hell'];
    diffs.forEach(d => {
      let dotCls = 'locked';
      if (ch.passed.includes(d)) dotCls = 'passed';
      else if (ch.unlocked.includes(d)) dotCls = 'active';
      dotsHtml += `<span class="ch-dot ${dotCls}" title="${d}"></span>`;
    });

    html += `
      <div class="chapter-item">
        <div class="ch-num ${numCls}">${i + 1}</div>
        <div class="ch-info">
          <div class="ch-name">${ch.name}</div>
          <div class="ch-diff-row">${dotsHtml}</div>
        </div>
        <div class="ch-actions">
          <button class="ch-btn ch-btn-read" onclick="event.stopPropagation();openChapter(${i})">阅读</button>
          <button class="ch-btn ch-btn-quiz" onclick="event.stopPropagation();openChapterQuiz(${i})">答题</button>
        </div>
      </div>`;
  });
  list.innerHTML = html;
}

function openChapter(chapterIndex) {
  const book = books[state.currentBook];
  const ch = book.chapters[chapterIndex];

  state.currentChapter = chapterIndex;
  state.selectedDiff = ch.unlocked[ch.unlocked.length - 1] || 'easy';
  state.quizIndex = 0;
  state.answers = [];

  // 记录阅读位置
  state.lastReadChapter[state.currentBook] = chapterIndex;

  // 显示全屏阅读浮层
  document.getElementById('readScreen').style.display = 'flex';
  document.getElementById('readTopBar').classList.remove('visible');

  // 渲染阅读内容
  const readContent = document.getElementById('readContent');
  const paragraphs = ch.content.split('\n\n');
  let html = paragraphs.map(p => `<p>${p}</p>`).join('');

  // 下一章
  const nextCh = book.chapters[chapterIndex + 1];
  if (nextCh) {
    html += `
      <div class="read-next-chapter">
        <div class="next-label">— 下一章 —</div>
        <button class="next-btn" onclick="event.stopPropagation();openChapter(${chapterIndex + 1})">${nextCh.name} →</button>
      </div>`;
  }

  readContent.innerHTML = html;
  readContent.scrollTop = 0;
}

function showCheckinPopup() {
  const quotes = [
    '阅读是一座随身携带的避难所。',
    '一本书就像一艘船，带领我们从狭隘的地方驶向无限广阔的生活海洋。',
    '我们读书，因为我们孤单；我们读书，然后就不孤单了。',
    '读书是在别人思想的帮助下，建立起自己的思想。',
    '世界上任何书籍都不能带给你好运，但它们能让你悄悄成为你自己。',
    '吹灭读书灯，一身都是月。',
    '读书不是为了雄辩和驳斥，而是为了思考和权衡。',
    '书卷多情似故人，晨昏忧乐每相亲。',
  ];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];

  const overlay = document.createElement('div');
  overlay.className = 'reading-popup-overlay';
  overlay.innerHTML = `
    <div class="reading-popup">
      <div class="rp-cover rp-checkin-icon">📖</div>
      <div class="rp-title">今日已打卡</div>
      <div class="rp-author">连续 ${state.checkinStreak} 天</div>
      <div class="rp-divider"></div>
      <div class="rp-quote">"${quote}"</div>
    </div>`;

  document.getElementById('app').appendChild(overlay);

  setTimeout(() => {
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 500);
  }, 2000);
}

function openChapterQuiz(chapterIndex) {
  const book = books[state.currentBook];
  const ch = book.chapters[chapterIndex];

  state.currentChapter = chapterIndex;
  state.selectedDiff = ch.unlocked[ch.unlocked.length - 1] || 'easy';
  state.quizIndex = 0;
  state.answers = [];

  // 直接进入难度选择
  state.currentTab = 'qa';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  const page = document.getElementById('page-qa');
  if (page) page.classList.add('active');
  const tabBtn = document.querySelector('.tab-item[data-tab="qa"]');
  if (tabBtn) tabBtn.classList.add('active');
  document.getElementById('mainContent').scrollTop = 0;

  document.getElementById('readScreen').style.display = 'none';
  document.getElementById('qaSelectScreen').style.display = 'block';
  document.getElementById('quizScreen').style.display = 'none';
  document.getElementById('resultScreen').style.display = 'none';

  updateQABookUI();
  updateDiffSelector();
}

function goToQuiz() {
  document.getElementById('readScreen').style.display = 'none';

  // 进入难度选择
  state.currentTab = 'qa';
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.tab-item').forEach(t => t.classList.remove('active'));
  const page = document.getElementById('page-qa');
  if (page) page.classList.add('active');
  const tabBtn = document.querySelector('.tab-item[data-tab="qa"]');
  if (tabBtn) tabBtn.classList.add('active');
  document.getElementById('mainContent').scrollTop = 0;

  document.getElementById('readScreen').style.display = 'none';
  document.getElementById('qaSelectScreen').style.display = 'block';
  document.getElementById('quizScreen').style.display = 'none';
  document.getElementById('resultScreen').style.display = 'none';

  updateQABookUI();
  updateDiffSelector();
}

function backToBookDetail() {
  document.getElementById('readScreen').style.display = 'none';
  openBook(state.currentBook);
}

function toggleReadBar() {
  document.getElementById('readTopBar').classList.toggle('visible');
}

function goBackFromBook() {
  switchTab(state.previousTab || 'home');
}

// ====== Q&A Flow ======
function updateQABookUI() {
  const book = books[state.currentBook];
  const ch = book.chapters[state.currentChapter];
  if (!book) return;
  document.getElementById('qaCover').style.background = book.coverBg;
  document.getElementById('qaCover').textContent = book.cover;
  document.getElementById('qaBookTitle').textContent = `${book.title} · ${ch.name}`;
  document.getElementById('qaBookAuthor').textContent = book.author;
}

function selectDiff(diff) {
  const book = books[state.currentBook];
  const ch = book.chapters[state.currentChapter];
  if (!ch.unlocked.includes(diff)) {
    showToast('请先通关前置难度');
    return;
  }
  state.selectedDiff = diff;
  updateDiffSelector();
}

function updateDiffSelector() {
  const book = books[state.currentBook];
  const ch = book.chapters[state.currentChapter];
  document.querySelectorAll('#diffSelector .diff-card').forEach(card => {
    const diff = card.dataset.diff;
    card.classList.remove('selected', 'locked');
    if (diff === state.selectedDiff) card.classList.add('selected');
    if (!ch.unlocked.includes(diff)) card.classList.add('locked');

    const statusEl = card.querySelector('.diff-status');
    if (ch.passed.includes(diff)) {
      statusEl.textContent = '已通关 ✓';
      statusEl.className = 'diff-status passed';
    } else if (!ch.unlocked.includes(diff)) {
      statusEl.textContent = '🔒 未解锁';
      statusEl.className = 'diff-status locked-text';
    } else if (diff === state.selectedDiff) {
      statusEl.textContent = '当前挑战';
      statusEl.className = 'diff-status';
      statusEl.style.color = 'var(--accent)';
    }
  });
}

function beginQuiz() {
  state.quizIndex = 0;
  state.answers = [];
  document.getElementById('qaSelectScreen').style.display = 'none';
  document.getElementById('quizScreen').style.display = 'block';
  document.getElementById('resultScreen').style.display = 'none';
  showQuestion();
}

function showQuestion() {
  const book = books[state.currentBook];
  const questions = book.questions[state.selectedDiff];
  const q = questions[state.quizIndex];
  const total = questions.length;

  document.getElementById('progressFill').style.width = ((state.quizIndex) / total * 100) + '%';
  document.getElementById('progressText').textContent = `${state.quizIndex + 1}/${total}`;
  document.getElementById('qLabel').textContent = `问题 ${state.quizIndex + 1}`;
  document.getElementById('qText').textContent = q.q;
  document.getElementById('answerInput').value = '';
  document.getElementById('answerInput').focus();
}

function submitAnswer() {
  const answer = document.getElementById('answerInput').value.trim();
  if (!answer) {
    showToast('请输入你的回答');
    return;
  }

  state.answers.push(answer);
  const book = books[state.currentBook];
  const questions = book.questions[state.selectedDiff];
  const total = questions.length;

  if (state.quizIndex < total - 1) {
    state.quizIndex++;
    showQuestion();
    document.getElementById('progressFill').style.width = ((state.quizIndex) / total * 100) + '%';
  } else {
    // All questions answered, show result
    showResult();
  }
}

function showResult() {
  document.getElementById('quizScreen').style.display = 'none';
  document.getElementById('resultScreen').style.display = 'block';

  const book = books[state.currentBook];
  const questions = book.questions[state.selectedDiff];

  // Demo: 随机评分 30-95
  const score = 30 + Math.floor(Math.random() * 66);

  const passed = score >= 60;
  const threshold = state.selectedDiff === 'hell' ? 50 : 60;

  // Update score circle
  const circle = document.getElementById('scoreCircle');
  circle.className = 'result-score-circle ' + (passed ? 'pass' : 'fail');
  document.getElementById('scoreNum').textContent = score;

  if (passed) {
    document.getElementById('resultTitle').textContent = '恭喜通关！🎉';
    document.getElementById('resultMsg').textContent =
      `你在「${state.selectedDiff === 'easy' ? '简单' : state.selectedDiff === 'hard' ? '困难' : '地狱'}」模式中表现出色，阅读理解能力扎实。`;

    // Unlock next difficulty for current chapter
    const ch = book.chapters[state.currentChapter];
    const diffs = ['easy', 'hard', 'hell'];
    const currentIdx = diffs.indexOf(state.selectedDiff);
    if (!ch.passed.includes(state.selectedDiff)) {
      ch.passed.push(state.selectedDiff);
    }
    if (currentIdx < diffs.length - 1 && !ch.unlocked.includes(diffs[currentIdx + 1])) {
      ch.unlocked.push(diffs[currentIdx + 1]);
    }

    // If chapter fully passed (all 3 difficulties), unlock next chapter's first difficulty
    if (ch.passed.length >= 3) {
      const nextCh = book.chapters[state.currentChapter + 1];
      if (nextCh && nextCh.unlocked.length === 0) {
        nextCh.unlocked.push('easy');
      }
    }

    document.getElementById('btnNext').textContent =
      state.selectedDiff === 'hell' ? '查看专属总结卡' : '挑战下一难度';
    document.getElementById('btnNext').style.display = 'block';
    document.getElementById('btnReread').style.display = 'none';

    // Celebration particles
    spawnParticles();
  } else {
    document.getElementById('resultTitle').textContent = '建议回读';
    document.getElementById('resultMsg').textContent =
      `评分 ${score} 分（阈值 ${threshold}），部分内容可能遗忘。遗忘不是失败，而是深度阅读的触发器。`;

    document.getElementById('btnNext').textContent = '重新答题';
    document.getElementById('btnNext').style.display = 'block';
    document.getElementById('btnReread').style.display = 'block';
  }

  // Show per-question feedback
  let feedbackHtml = '';
  state.answers.forEach((ans, i) => {
    const qScore = 40 + Math.floor(Math.random() * 55); // 40-94
    const qPassed = qScore >= 60;
    feedbackHtml += `
      <div class="fb-item">
        <strong>${questions[i].q.substring(0, 20)}...</strong><br>
        <span style="font-size:0.75rem;color:var(--muted);">提交成功</span>
        <span class="fb-score" style="color:${qPassed ? 'var(--accent2)' : 'var(--accent)'}"> — ${qScore}分 ${qPassed ? '✓' : '!'}</span>
      </div>`;
  });
  document.getElementById('resultFeedback').innerHTML = feedbackHtml;

  // Auto check-in after quiz
  if (!state.checkinDone) {
    doCheckin(false);
  }
}

function handleResultAction() {
  const book = books[state.currentBook];
  const ch = book.chapters[state.currentChapter];
  const diffs = ['easy', 'hard', 'hell'];
  const currentIdx = diffs.indexOf(state.selectedDiff);

  if (currentIdx < diffs.length - 1 && ch.unlocked.includes(diffs[currentIdx + 1])) {
    // Go to next difficulty
    state.selectedDiff = diffs[currentIdx + 1];
    state.quizIndex = 0;
    state.answers = [];
    document.getElementById('resultScreen').style.display = 'none';
    document.getElementById('qaSelectScreen').style.display = 'block';
    updateDiffSelector();
    document.getElementById('celebration').innerHTML = '';
  } else {
    // Go back to select
    backToSelect();
  }
}

function backToSelect() {
  document.getElementById('readScreen').style.display = 'none';
  document.getElementById('quizScreen').style.display = 'none';
  document.getElementById('resultScreen').style.display = 'none';
  document.getElementById('qaSelectScreen').style.display = 'block';
  document.getElementById('celebration').innerHTML = '';
  updateDiffSelector();
  state.quizIndex = 0;
  state.answers = [];
}

function rereadChapter() {
  document.getElementById('readScreen').style.display = 'none';
  document.getElementById('quizScreen').style.display = 'none';
  document.getElementById('resultScreen').style.display = 'none';
  document.getElementById('qaSelectScreen').style.display = 'none';
  document.getElementById('celebration').innerHTML = '';
  state.quizIndex = 0;
  state.answers = [];
  // 直接打开阅读
  openChapter(state.currentChapter);
}

// ====== Celebration Particles ======
function spawnParticles() {
  const container = document.getElementById('celebration');
  container.innerHTML = '';
  const colors = ['#c75b3a', '#4a7c59', '#f5c842', '#e8755a', '#3a9bca', '#d4856a'];

  for (let i = 0; i < 30; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.top = -(Math.random() * 100) + 'px';
    particle.style.background = colors[Math.floor(Math.random() * colors.length)];
    particle.style.width = (4 + Math.random() * 8) + 'px';
    particle.style.height = particle.style.width;
    particle.style.animationDelay = Math.random() * 0.5 + 's';
    particle.style.animationDuration = (1 + Math.random() * 1.5) + 's';
    container.appendChild(particle);
  }

  setTimeout(() => { container.innerHTML = ''; }, 2500);
}

// ====== Calendar ======
function renderCalendar() {
  const grid = document.getElementById('calendarGrid');
  if (!grid) return;

  const dayLabels = ['日', '一', '二', '三', '四', '五', '六'];
  let html = dayLabels.map(d => `<div class="calendar-day-label">${d}</div>`).join('');

  const startDay = 3;
  const daysInMonth = 31;
  const today = 10;

  for (let i = 0; i < startDay; i++) {
    html += '<div class="calendar-day" style="visibility:hidden;"></div>';
  }

  for (let d = 1; d <= daysInMonth; d++) {
    let cls = 'calendar-day';
    let clickAttr = '';
    if (d < today) {
      if (d <= 5 || d === 8 || d === 9) {
        cls += ' checked';
        clickAttr = `onclick="showDayDetail(${d})"`;
      }
    }
    if (d === today) cls += ' today';
    html += `<div class="${cls}" ${clickAttr}>${d}</div>`;
  }

  grid.innerHTML = html;
}

function showDayDetail(day) {
  const existing = document.querySelector('.day-modal-overlay');
  if (existing) existing.remove();

  // Generate mock quiz data for the day
  const booksList = [
    { icon: '🌹', title: '小王子', bg: 'linear-gradient(135deg,#4a7c59,#6a9c7a)' },
    { icon: '📖', title: '活着', bg: 'linear-gradient(135deg,#c75b3a,#d4856a)' },
    { icon: '💬', title: '非暴力沟通', bg: 'linear-gradient(135deg,#3a6b9c,#5a8bbc)' },
  ];
  const diffs = ['简单', '困难'];
  const count = day <= 3 ? 2 : (day <= 5 ? 1 : 3);

  let recordsHtml = '';
  for (let i = 0; i < count; i++) {
    const item = booksList[i % booksList.length];
    const diff = diffs[i % diffs.length];
    const score = 55 + Math.floor(Math.random() * 40);
    const scoreCls = score >= 60 ? 'good' : 'ok';
    recordsHtml += `
      <div class="day-record">
        <div class="dr-icon">${item.icon}</div>
        <div class="dr-info">
          <div class="dr-title">${item.title}</div>
          <div class="dr-detail">${diff}模式 · 3题</div>
        </div>
        <div class="dr-score ${scoreCls}">${score}分</div>
      </div>`;
  }

  const overlay = document.createElement('div');
  overlay.className = 'day-modal-overlay';
  overlay.onclick = function(e) {
    if (e.target === overlay) overlay.remove();
  };
  overlay.innerHTML = `
    <div class="day-modal">
      <div class="day-modal-title">7月${day}日</div>
      <div class="day-modal-sub">完成 ${count} 次答题</div>
      ${recordsHtml}
      <button class="day-modal-close" onclick="this.closest('.day-modal-overlay').remove()">关闭</button>
    </div>`;
  document.getElementById('app').appendChild(overlay);
}

function updateProfileStats() {
  document.getElementById('totalQuizzes').textContent = state.checkinDone ? 48 : 47;
  document.getElementById('totalPassed').textContent = state.checkinDone ? 9 : 8;
  document.getElementById('streakDays').textContent = state.checkinStreak;
}

// ====== Toast ======
function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.getElementById('app').appendChild(toast);

  setTimeout(() => toast.remove(), 2000);
}

// ====== Upload Book Modal ======
let uploadedCount = 0;

function addParsingBook(fileName) {
  uploadedCount++;
  const grid = document.getElementById('bookGrid');
  const card = document.createElement('div');
  card.className = 'book-card parsing';
  card.innerHTML = `
    <div class="book-cover-sm parsing-cover">📄</div>
    <div class="book-title">${fileName}</div>
    <div class="book-author parsing-status">解析中...</div>
    <div class="difficulty-tags">
      <span class="diff-tag locked">等待解析</span>
    </div>`;
  grid.appendChild(card);

  // 更新计数
  const totalBooks = 3 + uploadedCount;
  document.getElementById('bookCount').textContent = totalBooks;
}

function showUploadModal() {
  const existing = document.querySelector('.upload-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.className = 'upload-overlay';
  overlay.onclick = function(e) {
    if (e.target === overlay) overlay.remove();
  };
  overlay.innerHTML = `
    <div class="upload-modal">
      <div class="upload-modal-title">上传书籍</div>
      <div class="upload-modal-desc">支持 EPUB、PDF、TXT 格式</div>
      <div class="upload-area" id="uploadArea">
        <div class="upload-icon">📂</div>
        <div class="upload-text">点击选择文件</div>
        <div class="upload-hint">或拖拽文件到此处</div>
      </div>
      <div class="upload-progress" id="uploadProgress" style="display:none;">
        <div class="upload-progress-bar"><div class="upload-progress-fill" id="uploadProgressFill"></div></div>
        <div class="upload-progress-text" id="uploadProgressText">上传中...</div>
      </div>
      <input type="file" id="uploadFileInput" accept=".epub,.pdf,.txt" style="display:none;">
      <div class="upload-success" id="uploadSuccess" style="display:none;">
        <div class="upload-success-icon">✅</div>
        <div class="upload-success-text">上传成功！</div>
        <div class="upload-success-file" id="uploadFileName"></div>
      </div>
      <button class="upload-close-btn" onclick="this.closest('.upload-overlay').remove()">关闭</button>
    </div>`;

  document.getElementById('app').appendChild(overlay);

  const uploadArea = overlay.querySelector('#uploadArea');
  const fileInput = overlay.querySelector('#uploadFileInput');
  const progressEl = overlay.querySelector('#uploadProgress');
  const successEl = overlay.querySelector('#uploadSuccess');
  const progressFill = overlay.querySelector('#uploadProgressFill');
  const progressText = overlay.querySelector('#uploadProgressText');
  const fileNameEl = overlay.querySelector('#uploadFileName');

  uploadArea.onclick = () => fileInput.click();

  fileInput.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    uploadArea.style.display = 'none';
    progressEl.style.display = 'block';
    fileNameEl.textContent = file.name;

    // 模拟上传进度
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        progressFill.style.width = '100%';
        progressText.textContent = '处理中...';
        setTimeout(() => {
          progressEl.style.display = 'none';
          successEl.style.display = 'block';
          // 添加解析中卡片到书架
          addParsingBook(file.name);
        }, 500);
      } else {
        progressFill.style.width = progress + '%';
        progressText.textContent = `上传中 ${Math.floor(progress)}%`;
      }
    }, 300);
  };
}

// ====== Init ======
function init() {
  renderCalendar();
  enableDragScroll();
}

// ====== Mouse Drag Scroll ======
function enableDragScroll() {
  document.querySelectorAll('.h-scroll').forEach(el => {
    let isDown = false, startX, scrollLeft;

    el.addEventListener('mousedown', (e) => {
      isDown = true;
      el.style.cursor = 'grabbing';
      startX = e.pageX - el.offsetLeft;
      scrollLeft = el.scrollLeft;
    });

    el.addEventListener('mouseleave', () => {
      isDown = false;
      el.style.cursor = 'grab';
    });

    el.addEventListener('mouseup', () => {
      isDown = false;
      el.style.cursor = 'grab';
    });

    el.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - el.offsetLeft;
      const walk = (x - startX) * 1.5;
      el.scrollLeft = scrollLeft - walk;
    });
  });
}

init();