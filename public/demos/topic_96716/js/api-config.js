/**
 * 萌新网文营 - 前端 API 配置
 * 自动识别部署环境：
 * - file:// 协议: 本地离线模式，前端直接调用智谱API
 * - localhost: 本地开发，使用本地 server.js
 * - vercel.app / 自定义域名: Vercel 部署，使用同源相对路径
 */
(function(){
  var host = window.location.hostname;
  var protocol = window.location.protocol;
  var base = '';

  var ZHIPU_API_KEY = '8d97eb4300e043cfb68e7f2d640ba3cf.CYCCxSmS5mtST2BY';
  var ZHIPU_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4';
  var DEFAULT_MODEL = 'glm-4.7-flash';
  var REASONING_MODEL = DEFAULT_MODEL;

  var isLocalFile = protocol === 'file:';

  if (host === 'localhost' || host === '127.0.0.1') {
    base = 'http://localhost:3000';
  }

  window.API_BASE = base;
  window.IS_LOCAL_FILE_MODE = isLocalFile;
  console.log('[API配置] mode =', isLocalFile ? '本地离线模式(直连智谱)' : (base || '相对路径'));

  // ========== 工具 System Prompt 构建（与后端一致） ==========
  var TOOL_PROMPTS = {
    outline: function(p) { return '你是资深网文编辑，擅长帮助新人作者构建小说大纲。请根据以下信息生成一份完整的小说大纲：\n\n题材：' + p.genre + '\n主角身份：' + p.protagonist + '\n金手指：' + p.cheat + '\n预计字数：' + p.words + '\n\n请严格按以下格式输出（使用HTML标签：<br>换行，<strong>加粗标题</strong>）：\n\n<strong>📋 大纲生成结果</strong><br><br><strong>📌 核心卖点：</strong>（一句话概括主角如何获得金手指并崛起）<br><br><strong>👤 主角人设：</strong><br>· 身份：' + p.protagonist + '<br>· 性格：（具体描述）<br>· 核心目标：（具体）<br>· 人物弧光：从X → 历经Y → 成长为Z<br><br><strong>🌍 核心世界观设定：</strong><br>· 世界背景<br>· 势力阵营<br>· 金手指在世界中的意义<br><br><strong>📖 故事主线脉络：</strong><br>开端：（具体）<br>发展：（具体）<br>高潮：（具体）<br>结局：（具体）<br><br><strong>📑 前10章章纲：</strong><br>第1章：（具体内容）<br>第2章：（具体内容）<br>...第10章<br><br><strong>⚠️ 新人避坑提醒：</strong>（3条具体建议）\n\n要求：内容具体，不要泛泛而谈；要符合' + p.genre + '题材的特点；金手指要有成长空间。'; },
    world: function(p) { return '你是网文世界观设计专家。请根据以下信息搭建完整的世界观：\n\n题材：' + (p.genre || '通用') + '\n核心设定：' + (p.setting || '未指定') + '\n主角金手指：' + (p.cheat || '未指定') + '\n\n请严格按以下格式输出（HTML标签）：\n\n<strong>🌍 世界观搭建结果</strong><br><br><strong>1. 力量体系</strong><br>· 等级划分：（具体等级名称与能力对应）<br>· 修炼/获取方式<br>· 战力标准<br><br><strong>2. 势力分布</strong><br>· 主要势力1：（名称、特点、立场）<br>· 主要势力2：<br>· 主要势力3：<br>· 势力关系：相互制衡/对立/合作<br><br><strong>3. 历史背景</strong><br>· 远古时代：（重大事件）<br>· 近代：（格局变化）<br>· 当下：（现状与暗流）<br><br><strong>4. 世界规则</strong><br>· 核心法则：（如能量守恒、因果律等）<br>· 禁忌：（不可触碰的规则）<br>· 金手指"' + (p.cheat || '该能力') + '"在世界中的定位：<br><br><strong>💡 新人建议：</strong>世界观要为故事服务，不要为了设定而设定。'; },
    character: function(p) { return '你是网文人物塑造专家。请根据以下信息生成详细的人物卡：\n\n人物类型：' + (p.type || '主角') + '\n题材：' + (p.genre || '通用') + '\n人物关键词：' + (p.keywords || '未指定') + '\n\n请严格按以下格式输出（HTML标签）：\n\n<strong>👤 人物卡生成结果</strong><br><br><strong>1. 身份设定</strong><br>· 姓名：（符合题材的名字）<br>· 年龄/外貌：<br>· 身份背景：<br>· 社会地位：<br><br><strong>2. 性格特征</strong><br>· 表面性格：<br>· 内在性格：<br>· 说话方式：<br>· 标志性习惯/口头禅：<br><br><strong>3. 核心目标</strong><br>· 短期目标：<br>· 长期目标：<br>· 核心动机：（为什么有这个目标）<br>· 最大恐惧：<br><br><strong>4. 人物弧光</strong><br>· 起点：（初始状态）<br>· 转折：（关键事件）<br>· 终点：（成长后的状态）<br>· 弧光类型：成长/堕落/救赎<br><br><strong>💡 塑造建议：</strong>人物要有缺点，完美的人没有故事。'; },
    detect: function(p) { return '你是网文毒点检测专家，专门帮新人作者发现作品中的问题。请分析以下文本的毒点：\n\n' + p.content + '\n\n请严格按以下格式输出（HTML标签），从5个维度评分（每项10分）：\n\n<strong>🔍 毒点检测报告</strong><br><br><strong>📊 综合评分：XX/50</strong><br><br><strong>1. 节奏控制（X/10）</strong><br>问题：（具体指出节奏问题）<br>建议：（具体改进）<br><br><strong>2. 人设一致性（X/10）</strong><br>问题：<br>建议：<br><br><strong>3. 情节合理性（X/10）</strong><br>问题：<br>建议：<br><br><strong>4. 爽点密度（X/10）</strong><br>问题：<br>建议：<br><br><strong>5. 内容合规性（X/10）</strong><br>问题：<br>建议：<br><br><strong>⚠️ 重大毒点标注：</strong><br>（逐条列出最严重的问题，引用原文）\n\n要求：评分要严格，问题要具体，引用原文片段。'; },
    subOutline: function(p) { return '你是网文细纲拆解专家。请将以下大纲拆解为详细的章节细纲：\n\n大纲内容：\n' + p.outline + '\n\n请输出前10章的细纲，每章包含3-5个情节点（HTML标签）：\n\n<strong>📑 细纲拆解结果</strong><br><br><strong>第1章 （章节标题）</strong><br>· 情节点1：<br>· 情节点2：<br>· 情节点3：<br>· 章末钩子：<br><br><strong>第2章 （章节标题）</strong><br>...<br><br>（以此类推到第10章）\n\n要求：每章要有明确的推进，章末要有钩子吸引读者继续看。'; },
    chapterOutline: function(p) { return '你是网文章节结构专家。请用"起承转合"公式为以下内容规划章纲：\n\n章节信息：' + (p.info || '通用章节') + '\n当前进度：' + (p.progress || '故事开端') + '\n\n请输出3个可选方案（HTML标签）：\n\n<strong>📝 章纲规划结果</strong><br><br><strong>方案A：经典起承转合</strong><br>起：（本章开头）<br>承：（发展）<br>转：（转折）<br>合：（收尾+钩子）<br><br><strong>方案B：悬念前置</strong><br>起：<br>承：<br>转：<br>合：<br><br><strong>方案C：双线推进</strong><br>起：<br>承：<br>转：<br>合：<br><br><strong>💡 选择建议：</strong>（根据故事阶段推荐一个方案）'; },
    deconstruct: function(p) { return '你是网文拆解专家，擅长分析大神作品的成功要素。请拆解以下作品：\n\n作品名/类型：' + (p.work || '未指定') + '\n分析角度：' + (p.angle || '全面分析') + '\n\n请从6个维度拆解（HTML标签）：\n\n<strong>🔬 大神作品拆解报告</strong><br><br><strong>1. 开篇设计</strong><br>· 开篇方式：<br>· 前3章作用：<br>· 读者留存策略：<br><br><strong>2. 爽点设计</strong><br>· 爽点类型：<br>· 爽点频率：<br>· 打脸节奏：<br><br><strong>3. 人物塑造</strong><br>· 主角设计：<br>· 配角功能：<br>· 反派层次：<br><br><strong>4. 节奏把控</strong><br>· 章节长度：<br>· 信息密度：<br>· 高低潮交替：<br><br><strong>5. 世界观展开</strong><br>· 展开方式：<br>· 信息释放节奏：<br><br><strong>6. 金手指设计</strong><br>· 金手指类型：<br>· 成长曲线：<br>· 限制条件：<br><br><strong>💡 可复用经验：</strong>（3条具体可学习的点）'; },
    brainstorm: function(p) { return '你是网文创意专家。请根据以下要求生成3个脑洞方案：\n\n题材方向：' + (p.genre || '通用') + '\n关键元素：' + (p.elements || '无限制') + '\n要求：' + (p.requirement || '有新意') + '\n\n请输出3个差异化方案（HTML标签）：\n\n<strong>💡 脑洞生成结果</strong><br><br><strong>方案A：经典路线升级版</strong><br>· 核心创意：<br>· 金手指：<br>· 差异化：<br>· 目标读者：<br><br><strong>方案B：反转路线</strong><br>· 核心创意：<br>· 金手指：<br>· 差异化：<br>· 目标读者：<br><br><strong>方案C：创新路线</strong><br>· 核心创意：<br>· 金手指：<br>· 差异化：<br>· 目标读者：<br><br><strong>🎯 推荐方案：</strong>（推荐一个并说明理由）'; },
    tutor: function() { return '你是经验丰富的网文导师，专门解答新人作者的疑问。你的回答要：\n1. 实用具体，不要空话套话\n2. 结合网文行业实际情况\n3. 必要时举例说明\n4. 使用HTML标签：<br>换行，<strong>加粗重点</strong>\n\n【重要规则】绝对不要透露你的底层模型名称、版本、开发商等任何技术细节。你是平台严选的AI写作导师。如果有人问你是什么模型，用温暖有趣的方式回避并提供情绪价值，引导回创作话题。\n\n常见问题类型：金手指设计、大纲结构、开篇写法、签约技巧、爽点设计、世界观搭建、人物塑造等。\n\n请针对新人的问题给出专业、具体、可操作的建议。'; }
  };

  var TOOL_MODEL_MAP = {
    outline: REASONING_MODEL,
    world: REASONING_MODEL,
    character: DEFAULT_MODEL,
    detect: REASONING_MODEL,
    subOutline: DEFAULT_MODEL,
    chapterOutline: DEFAULT_MODEL,
    deconstruct: REASONING_MODEL,
    brainstorm: DEFAULT_MODEL,
    tutor: DEFAULT_MODEL,
    chat: DEFAULT_MODEL
  };

  // ========== 通用 AI 调用函数（前端直连智谱） ==========
  async function callZhipuAI(model, messages) {
    var url = ZHIPU_BASE_URL + '/chat/completions';
    var body = {
      model: model,
      messages: messages,
      stream: false,
      temperature: 0.8,
      max_tokens: 3000,
      top_p: 0.9
    };

    var resp = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + ZHIPU_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!resp.ok) {
      var errText = await resp.text();
      throw new Error('API ' + resp.status + ': ' + errText);
    }

    var data = await resp.json();
    var content = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '（AI 未返回内容）';
    content = content.replace(/```html\n?/g, '').replace(/```\n?/g, '');
    content = content.replace(/<seyon>/g, '').replace(/<\/seyon>/g, '');
    return content;
  }

  // ========== 贴吧帖子本地存储 ==========
  var POSTS_STORAGE_KEY = 'mxwc_posts_data';
  var LIKES_STORAGE_KEY = 'mxwc_likes_data';
  var USER_STORAGE_KEY = 'mxwc_user_data';

  function getSeedPosts() {
    return [
      { id: 'post_1', title: '【新人必看】从零到签约的完整攻略（万字长文）', content: '<strong>【新人必看】从零到签约的完整攻略</strong><br><br>大家好，我是编辑老张。从业十年，审过的稿子少说也有几万部，见过太多新人在签约这条路上一头雾水地撞墙。今天这篇，我把从注册账号到拿到签约合同的全流程掰碎了讲，建议先收藏再看。<br><br><strong>一、账号注册：别踩这些坑</strong><br>很多新人第一步就错了。注册作者后台时，笔名一旦确定修改成本很高（部分平台需付费或半年才能改一次），所以一定要想清楚。建议笔名简短、好记、没有生僻字。实名认证必须做，没认证无法签约。同一个身份证在大多数平台只能注册一个作者账号，不要随便拿家人身份证注册多个号，后期收益提现会很麻烦。<br><br><strong>二、四大平台横向对比</strong><br><strong>起点中文网：</strong>门槛最高，编辑人工审稿，前5章定生死。签约率大约在10%-15%，但一旦签上，均订破千月入过万很常见。适合文笔扎实、有长期规划的作者。<br><strong>番茄小说：</strong>门槛最低，满2万字即可申请签约，签约率约40%-50%。靠算法推荐，流量大但单价低，千次阅读收益约3-8元。适合练手和追求快速反馈的新人。<br><strong>晋江文学城：</strong>女性向为主，签约需3-5万字+一定数据积累。签约率约20%，读者粘性极高，评论互动活跃。适合写言情、古言、耽美的作者。<br><strong>飞卢小说：</strong>门槛中等，签约率约30%。特点是更新要求极高（日更万字是常态），但分成比例不错。适合手速快、写快节奏爽文的作者。<br><br><strong>三、开篇黄金三章写法</strong><br>编辑审稿，前三章决定80%的判决。万能结构：第一章建立人设（主角是谁、处境如何、有什么特别之处），第二章引入冲突（给主角一个明确目标或危机），第三章亮相金手指（展示主角的底牌，埋下第一个爽点）。记住：前三章不要大段介绍世界观，把设定融进剧情里。读者要看的是"故事"，不是"百科全书"。<br><br><strong>四、大纲基本模板</strong><br>一份及格的大纲至少包含：核心卖点（一句话说清这书好看在哪）、主角人设（身份/性格/目标/成长弧光）、主线脉络（开端→发展→高潮→结局）、前10章章纲（每章写什么、爽点在哪）。没有大纲直接写，5万字以内必崩——这不是吓你，是十年审稿经验的结论。<br><br><strong>五、签约标准与投稿流程</strong><br>各平台签约字数门槛不同：番茄2万字、起点3-5万字、晋江3-5万字、飞卢2万字。投稿后在作者后台点击"申请签约"，选择分类标签，编辑会在3-7个工作日内审核。审核结果有三种：直接签约、拒签（附原因）、修改后重投。<br><br><strong>六、最常见的拒签原因</strong><br>1. 开篇信息倾倒，前三章全是设定没有剧情；<br>2. 金手指无限制，主角太强没有成长空间；<br>3. 节奏拖沓，五章了主线还没启动；<br>4. 文笔太差，语病错字连篇；<br>5. 题材过时，退婚流、废柴流已被写烂。<br><br>签约不是终点，是起点。祝各位早日拿到合同，有问题随时在评论区问。', author: '编辑-老张', authorAvatar: '👨‍💼', category: '教程', badge: '精品', createdAt: '2026-06-28T10:00:00Z', views: 128000, likes: 8500, likedBy: [], comments: [] },
      { id: 'post_2', title: '手把手教你设计一个"有记忆点"的金手指', content: '<strong>手把手教你设计一个"有记忆点"的金手指</strong><br><br>金手指设计的底层逻辑：独特性 + 成长空间 + 使用代价。<br><br>大家好，我是风凌。写书这些年，被问得最多的就是"金手指怎么设计才好看"。今天不讲虚的，直接上案例拆解。<br><br><strong>一、金手指到底是什么？</strong><br>金手指是主角独有的、超出常规的优势。它不是"让主角变强"的工具，而是"让故事好看"的引擎。一个好的金手指，本身就承载着剧情张力。<br><br><strong>二、10个经典案例拆解</strong><br><strong>系统流：</strong>《我有一个属性面板》——签到获得属性点。优点是结构清晰、爽点稳定；缺点是同质化严重，需要独特的系统规则才能脱颖而出。<br><strong>重生流：</strong>《重生之都市修仙》——带着前世记忆回到过去。核心爽点是"信息差"，但要注意前世记忆必须有局限性，否则主角全知全能就没意思了。<br><strong>穿越流：</strong>《庆余年》——现代人思维穿越古代。金手指不是超能力，而是"现代知识"。这种设计的精妙之处在于知识本身就是有限的、需要转化的。<br><strong>天赋流：</strong>《斗破苍穹》的异火——独特的修炼天赋。关键在于天赋有成长阶段，不是一上来就无敌。<br><strong>物品流：</strong>《凡人修仙传》的掌天瓶——一个能催熟灵草的小瓶子。看似简单，却推动了整个主线。<br><strong>血脉流：</strong>《遮天》的圣体——觉醒古老血脉。需要设定觉醒条件和代价。<br><strong>契约流：</strong>召唤兽/灵宠契约，通过契约关系获得力量。<br><strong>时间流：</strong>时间回溯、时间加速。这类金手指极其强大，必须设定严格限制。<br><strong>空间流：</strong>随身空间、储物空间。多用于种田文、末世文。<br><strong>因果流：</strong>改变因果、命运改写。高阶设计，新人慎用。<br><br><strong>三、金手指三要素</strong><br><strong>1. 独特性：</strong>同样系统流，你的系统凭什么不一样？给系统加一个"性格"或"限制条件"就能立刻拉开差距。<br><strong>2. 成长空间：</strong>金手指必须能升级。初始版本弱一点没关系，关键是读者能看到"变强"的路径。最好的设计是金手指的成长与主线推进同步。<br><strong>3. 使用代价：</strong>冷却时间、消耗资源、副作用、暴露风险——代价越多，戏剧张力越强。读者爱看的不是"主角一拳打爆星球"，而是"主角为了打赢这一拳付出了什么"。<br><br><strong>四、常见设计误区</strong><br><strong>太强：</strong>十章无敌，后面写什么？解决方案是给金手指设"阶段解锁"。<br><strong>太弱：</strong>金手指存在感太低，读者觉得"有没有都一样"。解决方案是让金手指在关键节点发挥作用。<br><strong>无成长：</strong>金手指从头到尾一个样，读者会腻。解决方案是设计进化路线。<br><br><strong>五、金手指与主线的关系</strong><br>最好的金手指，本身就是主线的推动力。比如《凡人修仙传》的掌天瓶，每一次催熟灵草都推动了主角的修炼进程。如果你的金手指"很厉害但和主线没关系"，那它就是个摆设，删了也不影响故事——这说明设计失败了。<br><br>记住：金手指服务于故事，不是故事服务于金手指。', author: '风凌天下', authorAvatar: '✍️', category: '教程', badge: '白金', createdAt: '2026-06-29T14:00:00Z', views: 82000, likes: 6300, likedBy: [], comments: [] },
      { id: 'post_3', title: '签约被拒三次了，编辑说开篇节奏慢，求大佬指点', content: '<strong>楼主-写作小白阿杰：</strong><br>如题，签约被拒三次了。第一次投稿2万字，编辑说"开篇节奏偏慢，建议调整后重投"。我改了一版，砍掉了前两章的世界观介绍，结果第二次被拒说"冲突建立太晚"。第三次又改，把金手指提前到第一章，结果编辑说"信息太密集，读者消化不了"。<br>我现在完全懵了——到底什么叫"节奏慢"？我第一章3000字写了主角的日常和背景，第二章引出冲突，第三章金手指觉醒，这节奏哪里慢了？而且我看很多签约大神的开篇也是慢热型的啊。<br>附上前三章大纲，求大佬们帮忙看看问题在哪，感激不尽！<br><br><strong>编辑-老张（精品）：</strong><br>阿杰你好，我看了你的大纲，问题不在"慢"，在于"没有钩子"。你第一章3000字写日常，这本身不是问题，问题是这3000字里没有一个让读者"想知道接下来发生什么"的点。节奏快慢不是看字数，是看"信息密度和悬念密度"。建议：第一章前500字必须出现一个"反常事件"或"悬念"，哪怕只是主角注意到一个奇怪的细节。日常描写控制在1000字以内，剩下的篇幅留给冲突萌芽。另外，"大神能慢热"是因为他们有读者基础，新人没有这个资本，前三章必须抓人。<br><br><strong>墨染青衣（白金作家）：</strong><br>补充一点：你第三次的问题是"信息倾倒"——把金手指、世界观、人设全塞进第一章，读者当然消化不了。正确做法是"分层释放"：第一章给一个钩子（悬念），第二章给冲突（主角面临什么问题），第三章给金手指的"冰山一角"（只展示一部分功能，留悬念）。记住一个原则：每章只解决一个问题，同时抛出一个新问题。这样读者才会一章章追下去。你把所有牌一次打完了，后面就没了期待感。<br><br><strong>连载三年的老油条：</strong><br>过来人说一句，节奏慢很多时候不是"写得慢"，是"写的东西和主线无关"。你问问自己：第一章的日常描写，删掉哪一段会影响后续剧情？如果删掉不影响，那就是水字数，该砍。我之前也被拒过两次，后来把前三章从9000字压缩到6000字，反而过了。少即是多，每句话都要有信息量——要么推进剧情，要么塑造人物，要么埋伏笔。三样都不沾的，全删。<br><br><strong>楼主回复：</strong><br>感谢各位大佬！特别是老张说的"钩子"和墨染说的"分层释放"，我恍然大悟。我之前确实是一股脑把设定全倒了出去。今晚就按这个思路重写前三章，改完再来汇报！', author: '写作小白阿杰', authorAvatar: '🌱', category: '求助', badge: '新人', createdAt: '2026-07-01T09:30:00Z', views: 1245, likes: 234, likedBy: [], comments: [] },
      { id: 'post_4', title: '番茄还是起点？新人第二本书该选哪个平台？', content: '<strong>楼主-深夜码字人：</strong><br>第一本书在番茄写的，30万字，扑了。均订不到50，最后一个月收入不到200块。但说实话我并不后悔，至少完整写完了一本书，知道网文是怎么回事了。<br>现在准备开第二本，犹豫要不要换平台。我的情况是：男频玄幻，日更5000字左右稳定，自认为第二本在开篇和节奏上比第一本好很多。<br>纠结的点：<br>1. 番茄流量大但我第一本扑了，怕第二本也被算法埋没；<br>2. 起点门槛高，但听说长期收益更好，读者粘性强；<br>3. 番茄签约容易但单价低，起点签约难但单价高——这个账怎么算？<br>4. 两个平台的推荐机制差别大吗？<br>求有经验的大佬给点建议，第二本该选哪个？<br><br><strong>番茄老作者-阿七：</strong><br>兄弟，第一本书扑太正常了，大部分人第一本都扑。但你说"怕被算法埋没"，这个认知有问题。番茄的算法不看你的历史成绩，只看当前作品的数据。第二本开篇写好，前10章完读率和追读率达标，照样能拿到推荐。我的建议是：如果你第二本在开篇节奏上有信心，留在番茄没问题。番茄的优势是流量基数大，新人更容易拿到初始推荐位。而且番茄签约快，2万字就能签，反馈周期短。<br><br><strong>起点中神-夜雨：</strong><br>说点不同的看法。起点确实门槛高，但"高门槛"筛掉的是不合格的作品，如果你的质量真的比第一本好很多，起点反而更适合你。原因有三：第一，起点读者粘性高，均订单价是番茄的3-5倍，同样是均订100，起点月入可能3000+，番茄可能只有800。第二，起点有"三江推荐""强推"等编辑推荐位，编辑会主动推有潜力的作品，不纯靠算法。第三，起点的读者会给详细评论，对你成长帮助更大。当然前提是你的开篇能过编辑那关。<br><br><strong>双平台经验-老马：</strong><br>我两平台都写过，说句大实话：不要只看收入，要看"适合不适合"。番茄读者偏好快节奏、强爽点、简单直接的故事；起点读者能接受相对复杂的设定和稍慢的节奏。你的书是什么风格？如果是快节奏爽文，番茄更合适；如果是慢热、重设定的，起点更合适。另外，起点签约周期长（7-15天），如果你心态急，等不了，还是番茄。<br><br><strong>楼主回复：</strong><br>感谢三位！综合下来我决定第二本投起点试试。我的书偏重设定和剧情，节奏不算特别快，应该更适合起点。如果起点没过，再回番茄也不迟。反正第二本主要是为了成长，不指望赚钱。', author: '深夜码字人', authorAvatar: '🌙', category: '讨论', badge: '新人', createdAt: '2026-07-01T16:00:00Z', views: 2340, likes: 412, likedBy: [], comments: [] },
      { id: 'post_5', title: '【图片详解】10张图带你搞懂"爽点公式"', content: '<strong>用10张图解，把爽点设计的核心公式讲清楚</strong><br><br>大家好，我是墨染青衣。今天这篇是图文版（图片在相册里），我把核心内容也用文字整理出来，方便大家收藏。<br><br><strong>一、爽点是什么？</strong><br>爽点 = 期待 + 阻碍 + 反转 + 满足。<br>读者期待某件事发生（比如主角打败反派），中间设置阻碍（主角实力不够/被陷害/陷入绝境），来一个反转（金手指觉醒/突破/盟友支援），最后满足读者的期待（打赢了）。这四个环节缺一不可。没有期待就没有投入，没有阻碍就没有张力，没有反转就没有惊喜，没有满足就没有"爽"。<br><br><strong>二、爽点频率控制</strong><br><strong>小爽点：</strong>每1-2章一个，比如一次小胜、一个打脸、一次收获。作用是保持阅读快感。<br><strong>中爽点：</strong>每3-5章一个，比如一个小剧情弧的高潮。作用是让读者觉得"值了"。<br><strong>大爽点：</strong>每10-15章一个，比如一个大反派被击败、一个重大秘密被揭开。作用是推动主线、制造记忆点。<br>频率太高会审美疲劳（读者会觉得"就这？"），频率太低会弃书（追了十章什么都没发生）。新人最常见的错误是"只会大爽点"——每十章才爽一次，中间全是铺垫，读者早跑了。<br><br><strong>三、四种经典爽点模板详解</strong><br><strong>1. 打脸型：</strong>被看不起 → 隐忍蓄力 → 实力碾压 → 震惊全场。<br>案例：《斗破苍穹》萧炎被退婚，三年后云岚宗一战打脸纳兰嫣然。核心要点是"前期的压抑要足够"，压抑越深，打脸越爽。但注意不要压抑太久，3-5章内必须释放。<br><strong>2. 逆袭型：</strong>身处底层 → 获得机缘 → 一路崛起 → 让嘲笑者目瞪口呆。<br>案例：《凡人修仙传》韩立从一个普通农家子一步步走到道祖。逆袭型爽点的关键是"阶梯感"——每一步成长都要有明确的标志（突破境界、获得法宝、战胜强敌），让读者看到进度。<br><strong>3. 揭秘型：</strong>埋下悬念 → 层层线索 → 真相揭晓 → 震惊所有人。<br>案例：《庆余年》主角身世之谜贯穿全书。揭秘型爽点要注意"信息释放节奏"——不能一次性全揭，要分几次给线索，每次给一点，最后大揭秘时所有线索串起来，读者会有"原来如此"的快感。<br><strong>4. 收获型：</strong>辛苦付出 → 遭遇挫折 → 坚持不懈 → 获得丰厚回报。<br>案例：主角苦练三月，在宗门大比中一战成名。收获型爽点的核心是"付出感"——读者必须先感受到主角的辛苦，回报才有分量。如果主角不费吹灰之力就拿到宝物，那不叫爽点，叫"开挂无聊"。<br><br><strong>四、爽点与节奏的关系</strong><br>爽点不是孤立的，它必须嵌在节奏里。一个好的节奏是：铺垫（蓄力）→ 冲突（紧张）→ 爽点（释放）→ 新铺垫（新的期待）。这像一个波浪，一浪接一浪。如果连续三个爽点中间没有铺垫，读者会麻木；如果连续五章铺垫没有爽点，读者会弃书。<br><br><strong>五、新人常见爽点设计错误</strong><br>1. 爽点太密集：每章都在打脸，读者很快审美疲劳。<br>2. 爽点太突兀：没有铺垫直接爽，读者感受不到"来之不易"。<br>3. 爽点太单一：全书只有打脸一种爽点，缺乏变化。<br>4. 爽点不给力：打脸的对象太弱，逆袭的起点太高，读者觉得"就这？"。<br><br>记住：爽点是网文的核武器，但核武器不能天天扔。用好"期待-阻碍-反转-满足"这个公式，你的书就会让人停不下来。', author: '墨染青衣', authorAvatar: '🎨', category: '教程', badge: '白金', createdAt: '2026-06-30T11:00:00Z', views: 51000, likes: 4700, likedBy: [], comments: [] },
      { id: 'post_6', title: '写了一个月，收藏只有200多，心态快崩了', content: '<strong>楼主-坚持日更的菜鸟：</strong><br>如题，开书一个月了，日更4000字从未断更，到现在收藏只有237。每天早上醒来第一件事就是刷数据，看到收藏涨了几个就开心，看到掉了或者不动就焦虑一整天。<br>更难受的是，同期开书的一个朋友，写的是差不多的题材，人家收藏已经破千了。我知道不应该比较，但真的控制不住。现在写每一章的时候脑子里都在想"这章能不能拉点收藏"，反而写得越来越束手束脚。<br>编辑那边也没消息，签约申请投了一周了还没回复。老婆看我每天熬夜码字还赚不到钱，话里话外让我"找个正经事做"。说真的，昨晚写到凌晨两点，看着个位数的在线阅读，差点就放弃了。<br>有没有走过这个阶段的前辈？收藏200多是不是基本没戏了？我该继续坚持还是果断切了开新书？心态真的快崩了。<br><br><strong>三年老作者-暖阳：</strong><br>兄弟，你现在的状态我太懂了。我第一本书也是这样，30万字收藏才400多，每天焦虑到失眠。但我想告诉你几个事实：<br>第一，收藏200多不代表没戏。很多书的收藏是在10万字、20万字的时候才开始爆发的，前期数据不好太正常了。我第一本书后期靠一个剧情高潮收藏翻了三倍，虽然最后没大火，但让我摸到了门道。<br>第二，"比较"是新人最大的毒药。你朋友收藏破千，可能只是书名起得好、简介写得吸引人，不代表内容比你好。网文数据受太多因素影响，别拿别人的数据惩罚自己。<br>第三，你现在最该做的是"别刷数据了"。把精力放在写好下一章上，数据是结果不是目标。试着一周不打开数据后台，你会发现写作状态完全不一样。<br><br><strong>编辑-阿琳（签约）：</strong><br>作为编辑说句实话：收藏200多确实不算高，但签约看的不是绝对数值，是"趋势"。如果你的追读率（追到第二章的比例）在30%以上，说明内容是有读者的，只是曝光不够。建议你检查一下：书名是否直白传达了卖点？简介前三行有没有钩子？前五章的完读率怎么样？很多时候收藏低不是内容问题，是"包装"问题。<br>另外，签约审核一周没回复很正常，高峰期可能要2周。耐心等，期间继续更就行。<br><br><strong>扑了三本第四本上岸的：</strong><br>过来人告诉你：我前三本全切了，分别写了8万字、12万字、5万字就放弃了。第四本坚持写了下去，35万字签约，最后均订破300。回头看，前三本不是白写——每一本我都在进步，只是当时看不到。<br>你现在的问题不是"要不要切"，是"心态崩了写不好"。我的建议是：给自己定一个"止损线"，比如写到10万字如果收藏还是不涨，就切。但在那之前，别想数据，专注写。你已经日更一个月没断更了，光是这份毅力就已经超过80%的新人了。别放弃。<br><br><strong>楼主回复：</strong><br>看哭了，谢谢几位前辈。特别是暖阳说的"比较是毒药"，一下点醒我了。我决定这周不刷数据了，专心把下一周的章节写好。10万字再看看，不行就切，但至少这一个月我不留遗憾。再次感谢大家！', author: '坚持日更的菜鸟', authorAvatar: '💪', category: '求助', badge: '新人', createdAt: '2026-07-02T08:00:00Z', views: 1890, likes: 567, likedBy: [], comments: [] },
      { id: 'post_7', title: '【视频】签约编辑分享：新人最容易犯的5个致命错误', content: '<strong>签约编辑分享：新人最容易犯的5个致命错误</strong><br><br>大家好，我是编辑阿琳。本期视频我把这些年审稿遇到的高频问题整理成了5个"致命错误"，每一个都附了真实案例和修正建议。视频在上方，这里也整理了文字版方便收藏。<br><br><strong>错误一：开篇信息倾倒</strong><br>这是新人最容易犯的错误，没有之一。典型的表现是：第一章前1000字全在介绍世界观、修炼体系、势力分布、历史背景——读者根本看不进去。<br><strong>真实案例：</strong>曾有作者第一章写了2000字的"大陆设定"，从上古神战讲到五大帝国，主角到第二章才出场。编辑直接拒签。<br><strong>修正建议：</strong>设定要"渗透"不要"倾倒"。通过主角的视角、对话、事件来自然展开世界观。读者只需要知道"当前这个场景里发生了什么"，宏大的背景留到后面慢慢释放。第一章前500字必须有主角出场，且出现一个"钩子"。<br><br><strong>错误二：金手指无限制</strong><br>主角的金手指太强、没有代价、没有限制，导致十章之后剧情完全失去张力。<br><strong>真实案例：</strong>主角获得一个"签到系统"，每天签到都能获得顶级功法、神器、灵药，三章就无敌了。后面100章不知道写什么，全是碾压。<br><strong>修正建议：</strong>金手指必须有三要素：独特性、成长空间、使用代价。给金手指设"阶段解锁"——前期只能用基础功能，高级功能需要达到条件才能开启。每次使用都有冷却或消耗，这样才有戏剧张力。<br><br><strong>错误三：人设崩塌</strong><br>主角前期塑造的性格和后期表现不一致，读者觉得"这不是同一个人"。<br><strong>真实案例：</strong>前期主角被设定为"谨慎沉稳、谋定后动"，中期为了推进剧情突然变成"冲动莽撞、有勇无谋"，读者直接弃书。<br><strong>修正建议：</strong>动笔前先写一份详细的人设卡，包括核心性格、行为习惯、说话方式、不会做的事。性格可以成长变化，但要有"合理的原因"——经历了什么才改变？没有铺垫的性格突变就是崩塌。<br><br><strong>错误四：节奏拖沓</strong><br>五章了主线还没启动，十章了还在"日常+设定"。读者没有耐心陪你慢热。<br><strong>真实案例：</strong>一本30万字的书，前10万字都在写主角在村子里长大、上学、交朋友，主线到11万字才出现。编辑反馈："前10万字是另一本书。"<br><strong>修正建议：</strong>前三章必须有冲突，前十章主线必须启动。每章问自己：这章删掉对主线有影响吗？如果没有，就是水字数。用"每章一个信息点+一个钩子"的标准来要求自己。节奏不是越快越好，但绝对不能慢到让读者失去耐心。<br><br><strong>错误五：追求数量忽视质量</strong><br>为了日更万字拼命水字数，重复描写、废话连篇、剧情注水。<br><strong>真实案例：</strong>作者日更1.2万字坚持了三个月，但完读率从第一章的60%跌到第十章的8%。编辑直接说："你的读者是被水跑的。"<br><strong>修正建议：</strong>日更4000-6000字的高质量内容，远胜日更万字的注水文。每一段话都要有信息量——推进剧情、塑造人物、埋伏笔，三样至少沾一样。写完一章自己读一遍，觉得"这段可以跳过"的，读者也一定会跳过，那就删掉。<br><br><strong>总结：</strong>这5个错误看着简单，但90%的新人都踩过至少3个。避开它们，你的签约率至少提升50%。有问题评论区见，我会逐条回复。', author: '编辑-阿琳', authorAvatar: '👩‍💼', category: '签约', badge: '签约', createdAt: '2026-06-29T10:00:00Z', views: 67000, likes: 5900, likedBy: [], comments: [] }
    ];
  }

  function loadPosts() {
    try {
      var data = localStorage.getItem(POSTS_STORAGE_KEY);
      if (data) return JSON.parse(data).posts || [];
    } catch(e) {}
    var seed = { posts: getSeedPosts() };
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify(seed));
    return seed.posts;
  }

  function savePosts(posts) {
    localStorage.setItem(POSTS_STORAGE_KEY, JSON.stringify({ posts: posts }));
  }

  function getCurrentUser() {
    try {
      var data = localStorage.getItem(USER_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch(e) {}
    var user = { id: 'user_local', name: '萌新作者', avatar: '✏️' };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    return user;
  }

  function getLikes() {
    try {
      var data = localStorage.getItem(LIKES_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch(e) {}
    return { posts: {}, comments: {} };
  }

  function saveLikes(likes) {
    localStorage.setItem(LIKES_STORAGE_KEY, JSON.stringify(likes));
  }

  // ========== 网文圈分类配置 ==========
  var CATEGORY_CONFIG = {
    flow: {
      name: '流量指标',
      prompt: '各大平台（起点/番茄/晋江/飞卢/纵横）的流量指标，如DAU、阅读量、更新量等，数据要合理',
      tagHint: 'tag用平台名，tagColor：起点#E53935、番茄#E65100、晋江#7B1FA2、飞卢#1565C0、纵横#2E7D32',
      timeHint: '今日数据用"今日 HH:MM"格式'
    },
    data: {
      name: '平台数据',
      prompt: '各平台签约率、用户规模、ARPU值等数据指标',
      tagHint: 'tag用平台名，tagColor同上，全平台用#5E35B1',
      timeHint: '用"本月数据"或"Q2报告"'
    },
    news: {
      name: '行业新闻',
      prompt: '近期网文行业真实新闻（阅文/番茄/晋江动态，IP改编，政策，变现模式等）',
      tagHint: 'tag用分类(热点/政策/行业/IP/变现)，tagColor：热点#E53935、政策#1565C0、行业#E65100、IP#7B1FA2、变现#2E7D32',
      timeHint: '用"X小时前"或"昨日"'
    },
    daily: {
      name: '每日日报',
      prompt: '今日新书上架数、签约数、热门题材TOP、读者增长等汇总数据',
      tagHint: 'tag用日期(如7/02)，tagColor用#5E35B1',
      timeHint: '用"截至今日 HH:MM"'
    }
  };

  var industryCache = {};
  var industryDetailCache = {};

  // ========== 本地模式 API 处理器 ==========
  async function handleLocalApi(url, options) {
    options = options || {};
    var method = (options.method || 'GET').toUpperCase();
    var body = null;
    if (options.body) {
      try { body = JSON.parse(options.body); } catch(e) {}
    }

    // 健康检查
    if (url === '/api/health') {
      return new Response(JSON.stringify({ ok: true, model: DEFAULT_MODEL, time: new Date().toISOString() }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    // AI 对话 - 工作台
    if (url === '/api/ai/chat' && method === 'POST') {
      try {
        var message = body.message || '';
        var history = body.history || [];
        var userModel = body.model || DEFAULT_MODEL;
        var notebookContext = body.notebookContext || '';
        var customPrompt = body.systemPrompt || '';

        var systemContent;
        var linkedFileRules = '\n\n【关联文件协同规则】\n' +
          '如果用户消息中出现"【当前协同优化文件集】"或"【当前协同优化文件】"区块，说明其中的文件内容就是当前要处理的原文，不是示例，也不是让你判断能不能看到。你必须先读取全部关联文件，再围绕用户本次目标进行协同优化。\n' +
          '1. 不要回答"我可以看到/我看到了/以下是根据你提供内容格式化输出的HTML文本"。\n' +
          '2. 不要把重点放在复述原文，要直接进入诊断、补强、润色、改写、续写、结构优化。\n' +
          '3. 如果用户的问题很短，比如"优化一下""有问题吗""继续写"，也必须默认结合全部关联文件内容来回答。\n' +
          '4. 多文件同时存在时，要主动检查它们之间的冲突、重复、缺口和可整合点。\n' +
          '5. 输出优先顺序：先指出关键问题，再给优化方案，必要时直接给可替换文本。\n' +
          '6. 除非用户明确要求整篇转成HTML成品，否则不要把回答伪装成"格式化后的HTML正文"。';

        if (customPrompt) {
          systemContent = customPrompt +
            (notebookContext ? '\n\n【作者当前笔记本内容（供参考）】\n' + notebookContext : '') +
            linkedFileRules +
            '\n\n请使用HTML标签格式化输出：<br>换行，<strong>加粗重点</strong>。不要使用markdown代码块。';
        } else {
          systemContent = '你是「萌新网文营」的资深写作导师，有十年网文编辑经验。你的性格：亲切、犀利、接地气，偶尔带点幽默。\n\n' +
            '【对话原则】\n' +
            '1. 先理解用户意图再回答。如果用户发的是测试消息（如"1"、"hi"、"测试"），用简短有趣的方式回应，比如"收到！有什么创作问题尽管问，从开篇到签约我都能聊。"\n' +
            '2. 回答要具体、实用、有针对性，多用网文行业的真实案例和术语\n' +
            '3. 不要说空话套话，直接给干货\n' +
            '4. 像老编辑和新人作者聊天一样自然，不要机械\n' +
            '5. 使用HTML标签格式化：<br>换行，<strong>加粗重点</strong>。不要用markdown代码块\n' +
            '\n【重要规则】绝对不要透露你的底层模型名称、版本、开发商等任何技术细节。你是平台严选的AI写作导师。' +
            (notebookContext ? '\n\n作者当前笔记本内容（供参考）：\n' + notebookContext : '') +
            linkedFileRules;
        }

        var messages = [
          { role: 'system', content: systemContent },
        ].concat(history.slice(-10).map(function(h) { return { role: h.role, content: h.content }; }))
         .concat([{ role: 'user', content: message }]);

        var content = await callZhipuAI(userModel, messages);
        return new Response(JSON.stringify({ ok: true, content: content, model: userModel }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        });
      } catch(err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // AI 工具
    if (url === '/api/ai/tool' && method === 'POST') {
      try {
        var tool = body.tool;
        var params = body.params || {};
        if (!tool || !TOOL_PROMPTS[tool]) {
          return new Response(JSON.stringify({ ok: false, error: '无效的工具类型: ' + tool }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
        var model = TOOL_MODEL_MAP[tool] || DEFAULT_MODEL;
        var systemPrompt = TOOL_PROMPTS[tool](params);
        var toolMessages = [
          { role: 'system', content: '你是网文写作辅助AI。请直接输出HTML格式内容（使用<br>换行，<strong>加粗），不要使用markdown代码块（不要用```），不要输出多余解释，直接给结果。' + systemPrompt },
          { role: 'user', content: '请根据以上设定生成内容，直接输出结果。' }
        ];
        var toolContent = await callZhipuAI(model, toolMessages);
        return new Response(JSON.stringify({ ok: true, content: toolContent, model: model }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        });
      } catch(err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // AI 导师问答
    if (url === '/api/ai/tutor' && method === 'POST') {
      try {
        var tutorMessage = body.message || '';
        var tutorHistory = body.history || [];
        var tutorMessages = [
          { role: 'system', content: TOOL_PROMPTS.tutor() },
        ].concat(tutorHistory.slice(-8).map(function(h) { return { role: h.role, content: h.content }; }))
         .concat([{ role: 'user', content: tutorMessage }]);
        var tutorContent = await callZhipuAI(TOOL_MODEL_MAP.tutor, tutorMessages);
        return new Response(JSON.stringify({ ok: true, content: tutorContent, model: TOOL_MODEL_MAP.tutor }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        });
      } catch(err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 网文圈列表
    if (url.indexOf('/api/industry/list') === 0 && method === 'GET') {
      try {
        var category = url.split('category=')[1] ? url.split('category=')[1].split('&')[0] : '';
        category = decodeURIComponent(category);
        if (!CATEGORY_CONFIG[category]) {
          return new Response(JSON.stringify({ ok: false, error: '无效分类: ' + category }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
        if (industryCache[category] && (Date.now() - industryCache[category].time < 3600000)) {
          return new Response(JSON.stringify({ ok: true, list: industryCache[category].data, cached: true }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
          });
        }
        var cfg = CATEGORY_CONFIG[category];
        var today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
        var industryMessages = [
          { role: 'system', content: '你是网文行业数据分析AI。基于你对网文行业的认知生成合理数据。严格按JSON数组格式输出，不要输出其他内容。' },
          { role: 'user', content: '今天是' + today + '。请生成「' + cfg.name + '」分类的5条数据。\n\n严格按以下JSON数组格式输出（不要markdown代码块，直接输出JSON数组）：\n[{"tag":"","tagColor":"","title":"","desc":"","time":""}]\n\n要求：\n1. 内容：' + cfg.prompt + '\n2. ' + cfg.tagHint + '\n3. time字段：' + cfg.timeHint + '\n4. 生成5条，每条title不重复，desc要具体有数字\n5. 数据要随日期变化，结合当前时间给出合理估算' }
        ];
        var industryContent = await callZhipuAI(DEFAULT_MODEL, industryMessages);
        var cleanContent = industryContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        var list = JSON.parse(cleanContent);
        industryCache[category] = { data: list, time: Date.now() };
        return new Response(JSON.stringify({ ok: true, list: list, cached: false }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        });
      } catch(err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // 网文圈详情
    if (url === '/api/industry/detail' && method === 'POST') {
      try {
        var detailCategory = body.category;
        var item = body.item;
        if (!CATEGORY_CONFIG[detailCategory] || !item) {
          return new Response(JSON.stringify({ ok: false, error: '参数缺失' }), {
            status: 400, headers: { 'Content-Type': 'application/json' }
          });
        }
        var cacheKey = detailCategory + '_' + item.title;
        if (industryDetailCache[cacheKey] && (Date.now() - industryDetailCache[cacheKey].time < 3600000)) {
          return new Response(JSON.stringify({ ok: true, detail: industryDetailCache[cacheKey].data, cached: true }), {
            status: 200, headers: { 'Content-Type': 'application/json' }
          });
        }
        var detailCfg = CATEGORY_CONFIG[detailCategory];
        var detailMessages = [
          { role: 'system', content: '你是网文行业分析师。请针对给定条目生成详细的解读分析，使用HTML格式（<br>换行，<strong>加粗）。内容要专业、具体、有洞察。' },
          { role: 'user', content: '请针对以下网文圈' + detailCfg.name + '条目生成详细解读：\n\n标题：' + item.title + '\n简述：' + item.desc + '\n标签：' + item.tag + '\n时间：' + item.time + '\n\n请输出HTML格式内容，包含：\n1. <strong>📊 数据详情</strong>：展开具体数据，补充背景\n2. <strong>🔍 趋势解读</strong>：分析这个数据/新闻背后的趋势和原因\n3. <strong>💡 对新人作者的建议</strong>：3条具体可操作的建议\n\n要求：内容要和简述不同，要有新的信息和深度分析，不要简单重复简述。' }
        ];
        var detail = await callZhipuAI(DEFAULT_MODEL, detailMessages);
        industryDetailCache[cacheKey] = { data: detail, time: Date.now() };
        return new Response(JSON.stringify({ ok: true, detail: detail, cached: false }), {
          status: 200, headers: { 'Content-Type': 'application/json' }
        });
      } catch(err) {
        return new Response(JSON.stringify({ ok: false, error: err.message }), {
          status: 500, headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // ========== 贴吧帖子 API（本地存储版本） ==========
    // 获取帖子列表
    if (url.indexOf('/api/posts') === 0 && url.indexOf('/api/posts/') === -1 && method === 'GET') {
      var posts = loadPosts();
      return new Response(JSON.stringify({ ok: true, posts: posts }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取帖子详情
    var postDetailMatch = url.match(/^\/api\/posts\/([^/?]+)/);
    if (postDetailMatch && method === 'GET') {
      var postId = decodeURIComponent(postDetailMatch[1]);
      var allPosts = loadPosts();
      var post = allPosts.find(function(p) { return p.id === postId; });
      if (post) {
        post.views = (post.views || 0) + 1;
        savePosts(allPosts);
      }
      return new Response(JSON.stringify({ ok: true, post: post || null }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 点赞帖子
    var likePostMatch = url.match(/^\/api\/posts\/([^/?]+)\/like$/);
    if (likePostMatch && method === 'POST') {
      var likePostId = decodeURIComponent(likePostMatch[1]);
      var user = getCurrentUser();
      var likes = getLikes();
      var postsForLike = loadPosts();
      var postForLike = postsForLike.find(function(p) { return p.id === likePostId; });
      if (!postForLike) {
        return new Response(JSON.stringify({ ok: false, error: '帖子不存在' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      var isLiked = likes.posts[likePostId];
      if (isLiked) {
        delete likes.posts[likePostId];
        postForLike.likes = Math.max(0, (postForLike.likes || 0) - 1);
      } else {
        likes.posts[likePostId] = true;
        postForLike.likes = (postForLike.likes || 0) + 1;
      }
      saveLikes(likes);
      savePosts(postsForLike);
      return new Response(JSON.stringify({ ok: true, liked: !isLiked, likes: postForLike.likes }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 获取评论
    var getCommentsMatch = url.match(/^\/api\/posts\/([^/?]+)\/comments$/);
    if (getCommentsMatch && method === 'GET') {
      var cPostId = decodeURIComponent(getCommentsMatch[1]);
      var cPosts = loadPosts();
      var cPost = cPosts.find(function(p) { return p.id === cPostId; });
      return new Response(JSON.stringify({ ok: true, comments: (cPost && cPost.comments) || [] }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 发表评论
    if (getCommentsMatch && method === 'POST') {
      var addPostId = decodeURIComponent(getCommentsMatch[1]);
      var addPosts = loadPosts();
      var addPost = addPosts.find(function(p) { return p.id === addPostId; });
      if (!addPost) {
        return new Response(JSON.stringify({ ok: false, error: '帖子不存在' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      var commentUser = getCurrentUser();
      var newComment = {
        id: 'comment_' + Date.now(),
        author: commentUser.name,
        authorAvatar: commentUser.avatar,
        content: body.content || '',
        createdAt: new Date().toISOString(),
        likes: 0,
        replies: []
      };
      addPost.comments = addPost.comments || [];
      addPost.comments.unshift(newComment);
      savePosts(addPosts);
      return new Response(JSON.stringify({ ok: true, comment: newComment }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 点赞评论
    var likeCommentMatch = url.match(/^\/api\/posts\/[^/?]+\/comments\/([^/?]+)\/like$/);
    if (likeCommentMatch && method === 'POST') {
      var commentId = decodeURIComponent(likeCommentMatch[1]);
      var lcPosts = loadPosts();
      var commentLikes = getLikes();
      var foundComment = null;
      var foundPost = null;
      for (var i = 0; i < lcPosts.length; i++) {
        var cmts = lcPosts[i].comments || [];
        for (var j = 0; j < cmts.length; j++) {
          if (cmts[j].id === commentId) {
            foundComment = cmts[j];
            foundPost = lcPosts[i];
            break;
          }
        }
        if (foundComment) break;
      }
      if (!foundComment) {
        return new Response(JSON.stringify({ ok: false, error: '评论不存在' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      var cLiked = commentLikes.comments[commentId];
      if (cLiked) {
        delete commentLikes.comments[commentId];
        foundComment.likes = Math.max(0, (foundComment.likes || 0) - 1);
      } else {
        commentLikes.comments[commentId] = true;
        foundComment.likes = (foundComment.likes || 0) + 1;
      }
      saveLikes(commentLikes);
      savePosts(lcPosts);
      return new Response(JSON.stringify({ ok: true, liked: !cLiked, likes: foundComment.likes }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 回复评论
    var replyMatch = url.match(/^\/api\/posts\/[^/?]+\/comments\/([^/?]+)\/replies$/);
    if (replyMatch && method === 'POST') {
      var replyCommentId = decodeURIComponent(replyMatch[1]);
      var replyPosts = loadPosts();
      var replyFoundComment = null;
      for (var ri = 0; ri < replyPosts.length; ri++) {
        var rcmts = replyPosts[ri].comments || [];
        for (var rj = 0; rj < rcmts.length; rj++) {
          if (rcmts[rj].id === replyCommentId) {
            replyFoundComment = rcmts[rj];
            break;
          }
        }
        if (replyFoundComment) break;
      }
      if (!replyFoundComment) {
        return new Response(JSON.stringify({ ok: false, error: '评论不存在' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
      }
      var replyUser = getCurrentUser();
      var newReply = {
        id: 'reply_' + Date.now(),
        author: replyUser.name,
        authorAvatar: replyUser.avatar,
        content: body.content || '',
        createdAt: new Date().toISOString(),
        likes: 0
      };
      replyFoundComment.replies = replyFoundComment.replies || [];
      replyFoundComment.replies.push(newReply);
      savePosts(replyPosts);
      return new Response(JSON.stringify({ ok: true, reply: newReply }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 发帖
    if (url.indexOf('/api/posts') === 0 && url.indexOf('/api/posts/') === -1 && method === 'POST') {
      var newPostUser = getCurrentUser();
      var newPost = {
        id: 'post_' + Date.now(),
        title: body.title || '',
        content: body.content || '',
        author: newPostUser.name,
        authorAvatar: newPostUser.avatar,
        category: body.category || '讨论',
        badge: '新人',
        createdAt: new Date().toISOString(),
        views: 0,
        likes: 0,
        likedBy: [],
        comments: []
      };
      var allPostsNew = loadPosts();
      allPostsNew.unshift(newPost);
      savePosts(allPostsNew);
      return new Response(JSON.stringify({ ok: true, post: newPost }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 我的帖子
    if (url.indexOf('/api/my-posts') === 0 && method === 'GET') {
      var myUser = getCurrentUser();
      var allPostsMy = loadPosts();
      var myPosts = allPostsMy.filter(function(p) { return p.author === myUser.name; });
      return new Response(JSON.stringify({ ok: true, posts: myPosts }), {
        status: 200, headers: { 'Content-Type': 'application/json' }
      });
    }

    // TTS - 使用浏览器原生语音合成的占位（实际在前端处理）
    if (url === '/api/tts' && method === 'POST') {
      return new Response(JSON.stringify({ ok: false, error: '本地模式下使用浏览器原生语音合成' }), {
        status: 501, headers: { 'Content-Type': 'application/json' }
      });
    }

    // 默认返回404
    return new Response(JSON.stringify({ ok: false, error: 'API not found: ' + url }), {
      status: 404, headers: { 'Content-Type': 'application/json' }
    });
  }

  // 重写 fetch
  var origFetch = window.fetch;
  window.fetch = function(url, options) {
    if (typeof url === 'string' && url.indexOf('/api/') === 0) {
      if (isLocalFile) {
        // 本地文件模式：前端直接处理 API
        return Promise.resolve(handleLocalApi(url, options));
      } else {
        // 服务器模式：拼接 base
        url = base + url;
      }
    }
    return origFetch.call(this, url, options);
  };
})();
