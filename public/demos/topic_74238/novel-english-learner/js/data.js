const NOVEL_DATA = {
  categories: [
    { id: 'student', name: '学生时代', icon: '🎓' },
    { id: 'worker', name: '上班族', icon: '💼' },
    { id: 'classic', name: '名著', icon: '📚' },
    { id: 'custom', name: '自定义', icon: '✨' }
  ],
  levels: [
    { id: 'cet4', name: '四级' },
    { id: 'cet6', name: '六级' },
    { id: 'bec', name: 'BEC' },
    { id: 'toeic', name: '托业' },
    { id: 'ielts', name: '雅思' },
    { id: 'primary', name: '小学' }
  ],
  novels: {
    student: [
      {
        id: 's1',
        title: '重生之我是学霸',
        author: '流星',
        summary: '普通高中生意外重生，凭借前世记忆逆袭成学霸，收获友情与爱情。',
        content: `我叫林浩，一个普通得不能再普通的高中生。
那天放学回家的路上，一道闪电劈中了我。
等我再次睁开眼睛，发现自己回到了高一开学的第一天。
看着镜子里青涩的自己，我激动得差点跳起来。
前世的记忆如潮水般涌来，那些错过的机会、遗憾的事情，我全都要重新来过。
开学第一课上，班主任让大家自我介绍。
我站起来，用流利的英语介绍自己，全班同学都惊呆了。
要知道，前世的我在班上可是个透明人。
坐在我旁边的女生叫苏晴，是班里的学习委员。
她惊讶地看着我，眼中闪过一丝好奇。
我暗暗发誓，这一世，我一定要活出不一样的人生。
接下来的日子里，我开始疯狂学习。
数学课上，老师还没讲完的题，我已经能举一反三。
英语听力对我来说更是小菜一碟。
月考成绩出来，我从年级倒数冲进了前十。
教导主任在升旗仪式上点名表扬了我。
那些曾经看不起我的同学，纷纷过来向我请教问题。
苏晴也主动找我，想和我一起组建学习小组。
就这样，我们渐渐熟悉起来。
每天放学后，我们一起在图书馆自习到很晚。
她教我写作文，我帮她解数学题。
日子一天天过去，期末考试我考到了年级第一。
站在领奖台上，我看着台下的苏晴，心中满是感激。
重生给了我第二次机会，而她让我的青春变得完整。`,
        tags: ['校园', '重生', '励志']
      },
      {
        id: 's2',
        title: '校花的贴身高手',
        author: '鱼人二代',
        summary: '平凡少年获得神秘传承，成为校花贴身保镖，开启传奇人生。',
        content: `楚梦瑶是学校公认的校花，不仅人长得漂亮，家世更是显赫。
而我，林逸，只是一个从大山里走出来的穷小子。
因为一次偶然的机会，我救下了被绑架的楚梦瑶。
楚家老爷子为了感谢我，让我成了楚梦瑶的贴身保镖。
从此，我和这位高高在上的校花有了剪不断的联系。
每天陪着她上学放学，保护她的安全。
起初，楚梦瑶对我爱答不理，觉得我就是个乡巴佬。
直到那次学校运动会上，我在三千米长跑中轻松夺冠。
她才对我刮目相看。
后来，学校里的恶霸找麻烦，我一个人打退了十几个混混。
楚梦瑶看我的眼神彻底变了。
她开始主动和我说话，问我以前的生活是什么样的。
我告诉她，我从小跟着师父在山里练功，那时候的日子简单又快乐。
直到有一天，一群神秘人闯进了学校。
他们来势汹汹，目标直指楚梦瑶。
我挡在她面前，用师父教我的功夫将他们全部击退。
楚梦瑶吓得脸色苍白，紧紧地抓着我的手臂。
从那以后，她对我依赖越来越深。
我们一起上课，一起吃饭，一起回家。
同学们都羡慕地说，我和校花简直是天生一对。
楚梦瑶听到这话，脸上泛起红晕，却没有否认。
我知道，这个曾经高高在上的女孩，已经悄悄走进了我的心里。`,
        tags: ['校园', '异能', '爱情']
      },
      {
        id: 's3',
        title: '高考逆袭日记',
        author: '晨光',
        summary: '高三学渣在最后一年奋起直追，用汗水书写逆袭传奇。',
        content: `高三开学第一天，我看着墙上的高考倒计时，心中五味杂陈。
上次模拟考，我的成绩排在年级倒数。
班主任找我谈话，说如果我再这样下去，连专科都考不上。
回到家，看着父母期待的眼神，我下定决心要改变。
从那天起，我每天五点起床背单词。
课间休息时，别的同学在聊天打闹，我在做数学题。
晚上回家，继续刷题到深夜。
一开始，效果并不明显，周测成绩依然不理想。
有几次，我差点想要放弃。
但每当这个时候，我就会想起父母辛苦工作的背影。
我又咬紧牙关，继续坚持下去。
慢慢地，我发现自己的成绩开始有了起色。
从班级倒数，到中下游，再到中游。
班主任在课堂上表扬了我的进步。
同学们也对我刮目相看。
最让我感到欣慰的是，我的英语从不及格提升到了一百二十分。
那是无数个清晨背单词的成果。
高考前最后一次模拟考，我冲进了班级前十。
高考那天，我平静地走进考场。
当最后一科结束铃声响起，我知道，无论结果如何，我都已经赢了。
因为我战胜了自己。
成绩公布那天，我考上了理想的大学。
回首这一年的努力，我明白了：只要不放弃，什么时候开始都不晚。`,
        tags: ['高考', '励志', '成长']
      }
    ],
    worker: [
      {
        id: 'w1',
        title: '职场新人的逆袭',
        author: '北方',
        summary: '初入职场的新人，凭借实力与智慧，一路披荆斩棘走向成功。',
        content: `刚入职那天，我穿着崭新的西装，信心满满地走进公司大楼。
然而现实很快给了我当头一棒。
我的直属上司是个出了名的严厉人物。
第一天上班，他就扔给我一摞厚厚的文件，让我下班前整理完。
我埋头苦干，连午饭都没吃，终于在最后一刻完成了任务。
但他只是扫了一眼，冷冷地说：格式不对，重做。
那天晚上，我加班到十点。
走在空无一人的街道上，我感到前所未有的挫败。
但我告诉自己，既然选择了这条路，就要坚持到底。
接下来的日子里，我虚心向老同事请教。
每天提前一小时到公司，把当天的工作提前规划好。
慢慢地，我发现自己在不断进步。
一个月后，我独立完成了一份项目策划案。
上司难得地露出一丝笑容，说：做得不错。
那一刻，我觉得所有的辛苦都值得了。
半年后，公司接到了一个重要项目。
上司点名让我参与，这是对我最大的肯定。
项目期间，我和团队成员日夜奋战。
遇到了很多困难，但我们始终没有放弃。
最终，项目圆满完成，客户非常满意。
在庆功会上，总经理亲自给我颁发了优秀员工奖。
站在台上，我想起了入职第一天那个狼狈的自己。
原来，成长就是在一次次跌倒后，依然选择站起来。
如今的我，已经能够独当一面。
而那些曾经的挫折，都成了我人生中最宝贵的财富。`,
        tags: ['职场', '成长', '励志']
      },
      {
        id: 'w2',
        title: '我的霸道总裁上司',
        author: '棉花糖',
        summary: '小职员与冷酷总裁的职场爱情故事，甜蜜与波折并存。',
        content: `第一次见到顾北辰，是在公司的年会上。
他穿着一身黑色西装，气场强大得让人不敢靠近。
作为公司最年轻的总裁，他是所有女员工心中的男神。
而我，只是市场部的一个小职员。
我们的距离，就像地球和月亮那么远。
直到那次部门汇报，我负责讲解PPT。
因为紧张，我在台上结结巴巴，状况百出。
台下的同事窃窃私语，我尴尬得想找个地缝钻进去。
就在这时，顾北辰站了起来。
他走上台，接过我手中的遥控器，帮我完成了剩下的讲解。
他的声音沉稳有力，每一个数据都信手拈来。
汇报结束后，他叫我去办公室。
我忐忑地走进去，准备迎接一顿批评。
没想到他说：你的方案做得不错，就是表达能力需要提升。
从那天起，他开始亲自指导我。
每周一次的汇报练习，他从不缺席。
在他的帮助下，我渐渐变得自信起来。
有一次加班到很晚，办公室里只剩下我们两个人。
他突然问我：你为什么这么努力？
我说：因为我不想一直做一个平凡的人。
他看着我，眼神中闪过一丝温柔。
那一刻，我感觉心跳漏了一拍。
后来我们渐渐熟悉，我发现他并不是表面上那么冷酷。
他只是不善于表达感情。
一个雨夜，他送我到楼下。
临走时，他突然说：其实，我早就注意到你了。
原来，在我还不知道的时候，他就已经默默关注我很久了。`,
        tags: ['职场', '爱情', '甜宠']
      }
    ],
    classic: [
      {
        id: 'c1',
        title: '傲慢与偏见（简写版）',
        author: '简·奥斯汀',
        summary: '伊丽莎白与达西先生从误解到相爱的经典爱情故事。',
        content: `班纳特一家有五个女儿，最大的已经二十七岁了。
一天，一位富有的单身汉搬进了附近的庄园。
班纳特太太兴奋不已，因为这可能是女儿们的好机会。
舞会上，伊丽莎白第一次见到达西先生。
他英俊潇洒，却神情冷漠，给人一种难以接近的感觉。
有人介绍伊丽莎白和他跳舞，他却轻蔑地说：她还行，但还没漂亮到能打动我的程度。
这句话恰好被伊丽莎白听到，她心中对他产生了深深的偏见。
与此同时，一位叫威克姆的军官出现了。
他告诉伊丽莎白，达西先生曾经 unjustly 对待过他。
伊丽莎白对达西的厌恶更加深了一层。
然而，达西却逐渐被伊丽莎白的聪慧和独立所吸引。
他开始改变对她的态度，甚至向她求婚。
但因为他态度傲慢，伊丽莎白毫不犹豫地拒绝了。
达西先生深受打击，他写了一封长信解释一切。
原来，威克姆是个骗子，他说的话全是谎言。
伊丽莎白读完信后，心中开始动摇。
后来，她参观达西的庄园，听到仆人们对他的称赞。
她才发现，自己对他的偏见是如此之深。
正当她开始重新审视这段感情时，妹妹和威克姆私奔了。
达西默默出面，解决了这场丑闻。
伊丽莎白得知后，感动得热泪盈眶。
最终，两人消除了误会，坦诚相对。
达西再次求婚，这次他放下了所有的傲慢。
伊丽莎白也放下了偏见，接受了他的爱。
他们举行了盛大的婚礼，幸福地生活在一起。`,
        tags: ['名著', '爱情', '经典']
      }
    ],
    custom: []
  }
};

const WORD_BANK = {
  cet4: {
    '努力': { en: 'effort', derivatives: ['effortless', 'effortlessly'], phrases: ['make an effort', 'spare no effort'] },
    '成功': { en: 'success', derivatives: ['successful', 'successfully'], phrases: ['achieve success', 'key to success'] },
    '改变': { en: 'change', derivatives: ['changeable', 'unchanged'], phrases: ['make a change', 'change one\'s mind'] },
    '机会': { en: 'opportunity', derivatives: ['opportunist'], phrases: ['seize the opportunity', 'golden opportunity'] },
    '重要': { en: 'important', derivatives: ['importance', 'importantly'], phrases: ['of great importance', 'play an important role'] },
    '学习': { en: 'study', derivatives: ['studious', 'student'], phrases: ['study hard', 'case study'] },
    '学校': { en: 'school', derivatives: ['scholar', 'scholarship'], phrases: ['after school', 'graduate from school'] },
    '老师': { en: 'teacher', derivatives: ['teach', 'teaching'], phrases: ['head teacher', 'private teacher'] },
    '同学': { en: 'classmate', derivatives: [], phrases: ['fellow classmate'] },
    '考试': { en: 'exam', derivatives: ['examination', 'examine'], phrases: ['take an exam', 'final exam'] },
    '成绩': { en: 'grade', derivatives: ['graded'], phrases: ['get good grades', 'passing grade'] },
    '知识': { en: 'knowledge', derivatives: ['knowledgeable'], phrases: ['acquire knowledge', 'common knowledge'] },
    '梦想': { en: 'dream', derivatives: ['dreamer', 'dreamy'], phrases: ['achieve one\'s dream', 'dream come true'] },
    '未来': { en: 'future', derivatives: ['futuristic'], phrases: ['in the future', 'bright future'] },
    '生活': { en: 'life', derivatives: ['lively', 'lifelong'], phrases: ['way of life', 'daily life'] },
    '朋友': { en: 'friend', derivatives: ['friendly', 'friendship'], phrases: ['make friends', 'close friend'] },
    '家庭': { en: 'family', derivatives: ['familiar'], phrases: ['nuclear family', 'family tree'] },
    '工作': { en: 'work', derivatives: ['worker', 'working'], phrases: ['go to work', 'at work'] },
    '公司': { en: 'company', derivatives: ['companion'], phrases: ['keep someone company'] },
    '项目': { en: 'project', derivatives: ['projection'], phrases: ['group project', 'project manager'] },
    '计划': { en: 'plan', derivatives: ['planning', 'planned'], phrases: ['make a plan', 'according to plan'] },
    '目标': { en: 'goal', derivatives: ['goalkeeper'], phrases: ['achieve a goal', 'set a goal'] },
    '困难': { en: 'difficulty', derivatives: ['difficult'], phrases: ['have difficulty in', 'face difficulties'] },
    '问题': { en: 'problem', derivatives: ['problematic'], phrases: ['solve a problem', 'no problem'] },
    '方法': { en: 'method', derivatives: ['methodical'], phrases: ['teaching method', 'scientific method'] },
    '结果': { en: 'result', derivatives: ['resultant'], phrases: ['as a result', 'lead to results'] },
    '原因': { en: 'reason', derivatives: ['reasonable', 'reasoning'], phrases: ['for some reason', 'the reason why'] },
    '时间': { en: 'time', derivatives: ['timely', 'timeless'], phrases: ['on time', 'in time'] },
    '开始': { en: 'start', derivatives: ['starter', 'starting'], phrases: ['start from', 'fresh start'] },
    '结束': { en: 'end', derivatives: ['ending', 'endless'], phrases: ['come to an end', 'in the end'] },
    '喜欢': { en: 'like', derivatives: ['liking', 'alike'], phrases: ['look like', 'feel like'] },
    '感谢': { en: 'gratitude', derivatives: ['grateful'], phrases: ['express gratitude', 'deep gratitude'] },
    '相信': { en: 'believe', derivatives: ['belief', 'believable'], phrases: ['believe in', 'make believe'] }
  },
  cet6: {
    '努力': { en: 'endeavor', derivatives: ['endeavored'], phrases: ['make every endeavor', 'endeavor to do'] },
    '成功': { en: 'achievement', derivatives: ['achieve', 'achievable'], phrases: ['sense of achievement', 'outstanding achievement'] },
    '改变': { en: 'transform', derivatives: ['transformation', 'transformer'], phrases: ['transform into', 'digital transformation'] },
    '机会': { en: 'prospect', derivatives: ['prospective'], phrases: ['career prospects', 'in prospect'] },
    '重要': { en: 'significant', derivatives: ['significance', 'significantly'], phrases: ['highly significant', 'statistical significance'] },
    '学习': { en: 'acquire', derivatives: ['acquisition', 'acquisitive'], phrases: ['acquire knowledge', 'language acquisition'] },
    '学校': { en: 'academy', derivatives: ['academic', 'academician'], phrases: ['academic research', 'military academy'] },
    '老师': { en: 'mentor', derivatives: ['mentorship', 'mentee'], phrases: ['business mentor', 'mentor program'] },
    '同学': { en: 'peer', derivatives: ['peerless'], phrases: ['peer pressure', 'peer review'] },
    '考试': { en: 'assessment', derivatives: ['assess', 'assessor'], phrases: ['risk assessment', 'self-assessment'] },
    '成绩': { en: 'performance', derivatives: ['perform', 'performer'], phrases: ['high performance', 'performance review'] },
    '知识': { en: 'expertise', derivatives: ['expert', 'expertly'], phrases: ['technical expertise', 'area of expertise'] },
    '梦想': { en: 'aspiration', derivatives: ['aspire', 'aspiring'], phrases: ['career aspiration', 'aspiration for'] },
    '未来': { en: 'prospect', derivatives: ['prospective'], phrases: ['future prospects', 'job prospects'] },
    '生活': { en: 'existence', derivatives: ['exist', 'existent'], phrases: ['daily existence', 'coexistence'] },
    '朋友': { en: 'companion', derivatives: ['companionship'], phrases: ['faithful companion', 'travel companion'] },
    '家庭': { en: 'household', derivatives: ['householder'], phrases: ['household name', 'household income'] },
    '工作': { en: 'occupation', derivatives: ['occupy', 'occupant'], phrases: ['main occupation', 'by occupation'] },
    '公司': { en: 'corporation', derivatives: ['corporate'], phrases: ['multinational corporation', 'corporate culture'] },
    '项目': { en: 'venture', derivatives: ['venturesome'], phrases: ['joint venture', 'business venture'] },
    '计划': { en: 'scheme', derivatives: ['schematic'], phrases: ['color scheme', 'pension scheme'] },
    '目标': { en: 'objective', derivatives: ['objectivity'], phrases: ['strategic objective', 'achieve an objective'] },
    '困难': { en: 'adversity', derivatives: ['adverse', 'adversely'], phrases: ['in adversity', 'overcome adversity'] },
    '问题': { en: 'dilemma', derivatives: [], phrases: ['face a dilemma', 'moral dilemma'] },
    '方法': { en: 'approach', derivatives: ['approachable'], phrases: ['approach to', 'new approach'] },
    '结果': { en: 'outcome', derivatives: [], phrases: ['positive outcome', 'desired outcome'] },
    '原因': { en: 'factor', derivatives: [], phrases: ['key factor', 'contributing factor'] },
    '时间': { en: 'duration', derivatives: ['during'], phrases: ['for the duration', 'short duration'] },
    '开始': { en: 'commence', derivatives: ['commencement'], phrases: ['commence with', 'commencement ceremony'] },
    '结束': { en: 'conclude', derivatives: ['conclusion', 'conclusive'], phrases: ['conclude with', 'draw a conclusion'] },
    '喜欢': { en: 'favor', derivatives: ['favorite', 'favorable'], phrases: ['in favor of', 'do someone a favor'] },
    '感谢': { en: 'appreciation', derivatives: ['appreciate', 'appreciative'], phrases: ['show appreciation', 'in appreciation of'] },
    '相信': { en: 'conviction', derivatives: ['convince', 'convincing'], phrases: ['deep conviction', 'carry conviction'] }
  },
  bec: {
    '工作': { en: 'enterprise', derivatives: ['entrepreneur'], phrases: ['private enterprise', 'social enterprise'] },
    '公司': { en: 'enterprise', derivatives: ['entrepreneurial'], phrases: ['business enterprise', 'state-owned enterprise'] },
    '项目': { en: 'undertaking', derivatives: ['undertake'], phrases: ['commercial undertaking', 'joint undertaking'] },
    '计划': { en: 'proposal', derivatives: ['propose', 'proposition'], phrases: ['business proposal', 'make a proposal'] },
    '目标': { en: 'target', derivatives: ['targeted'], phrases: ['sales target', 'target audience'] },
    '困难': { en: 'hindrance', derivatives: ['hinder'], phrases: ['without hindrance', 'obstacle and hindrance'] },
    '问题': { en: 'issue', derivatives: [], phrases: ['raise an issue', 'at issue'] },
    '方法': { en: 'strategy', derivatives: ['strategic', 'strategist'], phrases: ['business strategy', 'marketing strategy'] },
    '结果': { en: 'yield', derivatives: ['yielding'], phrases: ['high yield', 'yield results'] },
    '原因': { en: 'rationale', derivatives: ['rational'], phrases: ['the rationale behind', 'business rationale'] },
    '时间': { en: 'deadline', derivatives: [], phrases: ['meet the deadline', 'tight deadline'] },
    '开始': { en: 'initiate', derivatives: ['initiative', 'initial'], phrases: ['take the initiative', 'initiate contact'] },
    '结束': { en: 'terminate', derivatives: ['termination', 'terminal'], phrases: ['terminate a contract', 'terminate employment'] },
    '成功': { en: 'prosperity', derivatives: ['prosperous', 'prosper'], phrases: ['economic prosperity', 'wish prosperity'] },
    '重要': { en: 'crucial', derivatives: [], phrases: ['crucial moment', 'crucial to'] },
    '机会': { en: 'proposition', derivatives: [], phrases: ['business proposition', 'attractive proposition'] },
    '成绩': { en: 'return', derivatives: ['returnable'], phrases: ['return on investment', 'annual return'] },
    '学习': { en: 'adapt', derivatives: ['adaptation', 'adaptive'], phrases: ['adapt to', 'adapt oneself to'] },
    '知识': { en: 'competence', derivatives: ['competent'], phrases: ['core competence', 'professional competence'] },
    '相信': { en: 'assure', derivatives: ['assurance'], phrases: ['assure someone of', 'quality assurance'] },
    '喜欢': { en: 'prefer', derivatives: ['preference', 'preferable'], phrases: ['prefer to', 'personal preference'] },
    '感谢': { en: 'acknowledge', derivatives: ['acknowledgment'], phrases: ['acknowledge receipt', 'widely acknowledged'] },
    '朋友': { en: 'associate', derivatives: ['association'], phrases: ['business associate', 'in association with'] },
    '努力': { en: 'strive', derivatives: [], phrases: ['strive for', 'strive to do'] },
    '改变': { en: 'modify', derivatives: ['modification'], phrases: ['modify behavior', 'slightly modified'] },
    '未来': { en: 'outlook', derivatives: [], phrases: ['economic outlook', 'positive outlook'] },
    '生活': { en: 'livelihood', derivatives: [], phrases: ['means of livelihood', 'earn one\'s livelihood'] },
    '家庭': { en: 'domestic', derivatives: ['domesticate'], phrases: ['domestic market', 'domestic flight'] },
    '同学': { en: 'colleague', derivatives: [], phrases: ['fellow colleague', 'work colleague'] },
    '老师': { en: 'supervisor', derivatives: ['supervise', 'supervision'], phrases: ['project supervisor', 'under supervision'] },
    '学校': { en: 'institution', derivatives: ['institutional'], phrases: ['financial institution', 'educational institution'] },
    '考试': { en: 'evaluation', derivatives: ['evaluate'], phrases: ['performance evaluation', 'systematic evaluation'] }
  },
  toeic: {
    '公司': { en: 'firm', derivatives: ['firmly'], phrases: ['law firm', 'firm believer'] },
    '工作': { en: 'employment', derivatives: ['employ', 'employee', 'employer'], phrases: ['seek employment', 'full-time employment'] },
    '项目': { en: 'assignment', derivatives: ['assign'], phrases: ['complete an assignment', 'work assignment'] },
    '计划': { en: 'agenda', derivatives: [], phrases: ['hidden agenda', 'on the agenda'] },
    '目标': { en: 'quota', derivatives: [], phrases: ['sales quota', 'meet the quota'] },
    '困难': { en: 'setback', derivatives: [], phrases: ['face a setback', 'temporary setback'] },
    '问题': { en: 'matter', derivatives: [], phrases: ['as a matter of fact', 'subject matter'] },
    '方法': { en: 'procedure', derivatives: ['procedural'], phrases: ['standard procedure', 'safety procedure'] },
    '结果': { en: 'consequence', derivatives: ['consequent'], phrases: ['as a consequence', 'face the consequences'] },
    '原因': { en: 'origin', derivatives: ['original', 'originally'], phrases: ['country of origin', 'trace the origin'] },
    '时间': { en: 'schedule', derivatives: ['scheduled'], phrases: ['on schedule', 'tight schedule'] },
    '开始': { en: 'launch', derivatives: [], phrases: ['product launch', 'launch a campaign'] },
    '结束': { en: 'expire', derivatives: ['expiration', 'expiry'], phrases: ['expire soon', 'date of expiry'] },
    '成功': { en: 'accomplishment', derivatives: ['accomplish'], phrases: ['sense of accomplishment', 'great accomplishment'] },
    '重要': { en: 'essential', derivatives: ['essence'], phrases: ['essential to', 'essential oil'] },
    '机会': { en: 'opening', derivatives: [], phrases: ['job opening', 'rare opening'] },
    '成绩': { en: 'record', derivatives: ['recording'], phrases: ['track record', 'break a record'] },
    '学习': { en: 'train', derivatives: ['training', 'trainee'], phrases: ['on-the-job training', 'training course'] },
    '知识': { en: 'proficiency', derivatives: ['proficient'], phrases: ['language proficiency', 'proficiency test'] },
    '相信': { en: 'rely', derivatives: ['reliable', 'reliance'], phrases: ['rely on', 'reliable source'] },
    '喜欢': { en: 'favor', derivatives: ['favorite', 'favorable'], phrases: ['in favor of', 'favorable condition'] },
    '感谢': { en: 'gratitude', derivatives: ['grateful'], phrases: ['express gratitude', 'deep gratitude'] },
    '朋友': { en: 'contact', derivatives: ['contactable'], phrases: ['make contact', 'lose contact'] },
    '努力': { en: 'attempt', derivatives: ['attempted'], phrases: ['make an attempt', 'attempt to do'] },
    '改变': { en: 'adjust', derivatives: ['adjustment', 'adjustable'], phrases: ['adjust to', 'make adjustments'] },
    '未来': { en: 'upcoming', derivatives: [], phrases: ['upcoming events', 'upcoming meeting'] },
    '生活': { en: 'routine', derivatives: ['routinely'], phrases: ['daily routine', 'break the routine'] },
    '家庭': { en: 'relative', derivatives: ['relatively'], phrases: ['close relative', 'distant relative'] },
    '同学': { en: 'partner', derivatives: ['partnership'], phrases: ['business partner', 'working partner'] },
    '老师': { en: 'instructor', derivatives: ['instruct', 'instruction'], phrases: ['driving instructor', 'flight instructor'] },
    '学校': { en: 'facility', derivatives: ['facilitate'], phrases: ['manufacturing facility', 'medical facility'] },
    '考试': { en: 'qualification', derivatives: ['qualify', 'qualified'], phrases: ['professional qualification', 'qualification requirements'] }
  },
  ielts: {
    '努力': { en: 'strive', derivatives: ['striving'], phrases: ['strive for excellence', 'strive to achieve'] },
    '成功': { en: 'attainment', derivatives: ['attain', 'attainable'], phrases: ['educational attainment', 'attain a goal'] },
    '改变': { en: 'alter', derivatives: ['alteration', 'unaltered'], phrases: ['alter course', 'make alterations'] },
    '机会': { en: 'prospect', derivatives: ['prospective'], phrases: ['job prospects', 'prospective student'] },
    '重要': { en: 'paramount', derivatives: [], phrases: ['of paramount importance', 'paramount concern'] },
    '学习': { en: 'comprehend', derivatives: ['comprehension', 'comprehensive'], phrases: ['reading comprehension', 'comprehensive understanding'] },
    '学校': { en: 'institution', derivatives: ['institutional', 'institutionalize'], phrases: ['academic institution', 'financial institution'] },
    '老师': { en: 'tutor', derivatives: ['tutorial', 'tutee'], phrases: ['private tutor', 'personal tutor'] },
    '同学': { en: 'peer', derivatives: ['peerless'], phrases: ['peer group', 'peer review'] },
    '考试': { en: 'assessment', derivatives: ['assess', 'assessor'], phrases: ['formative assessment', 'continuous assessment'] },
    '成绩': { en: 'attainment', derivatives: ['attain'], phrases: ['academic attainment', 'level of attainment'] },
    '知识': { en: 'cognition', derivatives: ['cognitive', 'recognize'], phrases: ['cognitive ability', 'cognitive science'] },
    '梦想': { en: 'ambition', derivatives: ['ambitious', 'ambitiously'], phrases: ['burning ambition', 'fulfill one\'s ambition'] },
    '未来': { en: 'prospect', derivatives: ['prospective'], phrases: ['future prospect', 'career prospect'] },
    '生活': { en: 'livelihood', derivatives: [], phrases: ['earn a livelihood', 'means of livelihood'] },
    '朋友': { en: 'acquaintance', derivatives: ['acquainted'], phrases: ['casual acquaintance', 'nodding acquaintance'] },
    '家庭': { en: 'household', derivatives: ['householder'], phrases: ['household name', 'household chores'] },
    '工作': { en: 'vocation', derivatives: ['vocational'], phrases: ['sense of vocation', 'vocational training'] },
    '公司': { en: 'corporation', derivatives: ['corporate'], phrases: ['multinational corporation', 'corporate social responsibility'] },
    '项目': { en: 'initiative', derivatives: ['initiate', 'initial'], phrases: ['new initiative', 'take the initiative'] },
    '计划': { en: 'blueprint', derivatives: [], phrases: ['blueprint for', 'economic blueprint'] },
    '目标': { en: 'milestone', derivatives: [], phrases: ['reach a milestone', 'major milestone'] },
    '困难': { en: 'hardship', derivatives: [], phrases: ['economic hardship', 'endure hardship'] },
    '问题': { en: 'predicament', derivatives: [], phrases: ['in a predicament', 'awkward predicament'] },
    '方法': { en: 'methodology', derivatives: ['methodological'], phrases: ['research methodology', 'teaching methodology'] },
    '结果': { en: 'repercussion', derivatives: [], phrases: ['have repercussions', 'serious repercussions'] },
    '原因': { en: 'underlying', derivatives: [], phrases: ['underlying cause', 'underlying principle'] },
    '时间': { en: 'timeframe', derivatives: [], phrases: ['within the timeframe', 'specified timeframe'] },
    '开始': { en: 'inception', derivatives: [], phrases: ['since its inception', 'from inception'] },
    '结束': { en: 'culmination', derivatives: ['culminate'], phrases: ['culmination of', 'culminate in'] },
    '喜欢': { en: 'favor', derivatives: ['favorite', 'favorable'], phrases: ['in favor of', 'favorable outcome'] },
    '感谢': { en: 'gratitude', derivatives: ['grateful'], phrases: ['eternal gratitude', 'debt of gratitude'] },
    '相信': { en: 'conviction', derivatives: ['convince', 'convincing'], phrases: ['carry conviction', 'deeply convicted'] }
  },
  primary: {
    '努力': { en: 'try hard', derivatives: ['try', 'hard'], phrases: ['try one\'s best', 'work hard'] },
    '成功': { en: 'win', derivatives: ['winner', 'winning'], phrases: ['win the game', 'win a prize'] },
    '改变': { en: 'turn', derivatives: ['turning'], phrases: ['turn around', 'turn into'] },
    '机会': { en: 'chance', derivatives: [], phrases: ['have a chance', 'take a chance'] },
    '重要': { en: 'big', derivatives: ['bigger', 'biggest'], phrases: ['big deal', 'big day'] },
    '学习': { en: 'learn', derivatives: ['learner', 'learning'], phrases: ['learn by heart', 'learn from'] },
    '学校': { en: 'school', derivatives: [], phrases: ['go to school', 'after school'] },
    '老师': { en: 'teacher', derivatives: [], phrases: ['class teacher', 'head teacher'] },
    '同学': { en: 'classmate', derivatives: [], phrases: ['my classmate', 'new classmate'] },
    '考试': { en: 'test', derivatives: ['testing'], phrases: ['take a test', 'pass the test'] },
    '成绩': { en: 'mark', derivatives: ['marked'], phrases: ['get good marks', 'full marks'] },
    '知识': { en: 'know', derivatives: ['knowing', 'known'], phrases: ['know about', 'as we know'] },
    '梦想': { en: 'dream', derivatives: ['dreamer'], phrases: ['have a dream', 'dream of'] },
    '未来': { en: 'tomorrow', derivatives: [], phrases: ['tomorrow morning', 'the day after tomorrow'] },
    '生活': { en: 'live', derivatives: ['living', 'lively'], phrases: ['live well', 'live in'] },
    '朋友': { en: 'friend', derivatives: ['friendly'], phrases: ['best friend', 'make friends'] },
    '家庭': { en: 'home', derivatives: ['hometown'], phrases: ['go home', 'at home'] },
    '工作': { en: 'job', derivatives: [], phrases: ['do a good job', 'good job'] },
    '公司': { en: 'office', derivatives: ['officer'], phrases: ['go to the office', 'head office'] },
    '项目': { en: 'task', derivatives: [], phrases: ['do a task', 'finish the task'] },
    '计划': { en: 'idea', derivatives: [], phrases: ['good idea', 'have an idea'] },
    '目标': { en: 'aim', derivatives: [], phrases: ['take aim', 'aim at'] },
    '困难': { en: 'hard', derivatives: ['harder', 'hardest'], phrases: ['too hard', 'work hard'] },
    '问题': { en: 'question', derivatives: ['questioning'], phrases: ['ask a question', 'answer the question'] },
    '方法': { en: 'way', derivatives: [], phrases: ['by the way', 'in this way'] },
    '结果': { en: 'end', derivatives: ['ending'], phrases: ['in the end', 'happy ending'] },
    '原因': { en: 'why', derivatives: [], phrases: ['that is why', 'why not'] },
    '时间': { en: 'clock', derivatives: ['o\'clock'], phrases: ['on the clock', 'around the clock'] },
    '开始': { en: 'begin', derivatives: ['beginning'], phrases: ['begin with', 'to begin with'] },
    '结束': { en: 'finish', derivatives: ['finished'], phrases: ['finish up', 'finish line'] },
    '喜欢': { en: 'love', derivatives: ['lovely'], phrases: ['love to', 'fall in love'] },
    '感谢': { en: 'thank', derivatives: ['thanks', 'thankful'], phrases: ['thank you', 'thanks to'] },
    '相信': { en: 'trust', derivatives: ['trusting'], phrases: ['trust me', 'in trust'] }
  }
};

const DERIVATIVE_DATA = {
  'effort': { derivatives: ['effortless', 'effortlessly'], phrases: ['make an effort', 'spare no effort'] },
  'success': { derivatives: ['successful', 'successfully'], phrases: ['achieve success', 'key to success'] },
  'change': { derivatives: ['changeable', 'unchanged'], phrases: ['make a change', 'change one\'s mind'] },
  'opportunity': { derivatives: ['opportunist'], phrases: ['seize the opportunity', 'golden opportunity'] },
  'important': { derivatives: ['importance', 'importantly'], phrases: ['of great importance', 'play an important role'] },
  'study': { derivatives: ['studious', 'student'], phrases: ['study hard', 'case study'] },
  'school': { derivatives: ['scholar', 'scholarship'], phrases: ['after school', 'graduate from school'] },
  'teacher': { derivatives: ['teach', 'teaching'], phrases: ['head teacher', 'private teacher'] },
  'classmate': { derivatives: [], phrases: ['fellow classmate'] },
  'exam': { derivatives: ['examination', 'examine'], phrases: ['take an exam', 'final exam'] },
  'grade': { derivatives: ['graded'], phrases: ['get good grades', 'passing grade'] },
  'knowledge': { derivatives: ['knowledgeable'], phrases: ['acquire knowledge', 'common knowledge'] },
  'dream': { derivatives: ['dreamer', 'dreamy'], phrases: ['achieve one\'s dream', 'dream come true'] },
  'future': { derivatives: ['futuristic'], phrases: ['in the future', 'bright future'] },
  'life': { derivatives: ['lively', 'lifelong'], phrases: ['way of life', 'daily life'] },
  'friend': { derivatives: ['friendly', 'friendship'], phrases: ['make friends', 'close friend'] },
  'family': { derivatives: ['familiar'], phrases: ['nuclear family', 'family tree'] },
  'work': { derivatives: ['worker', 'working'], phrases: ['go to work', 'at work'] },
  'company': { derivatives: ['companion'], phrases: ['keep someone company'] },
  'project': { derivatives: ['projection'], phrases: ['group project', 'project manager'] },
  'plan': { derivatives: ['planning', 'planned'], phrases: ['make a plan', 'according to plan'] },
  'goal': { derivatives: ['goalkeeper'], phrases: ['achieve a goal', 'set a goal'] },
  'difficulty': { derivatives: ['difficult'], phrases: ['have difficulty in', 'face difficulties'] },
  'problem': { derivatives: ['problematic'], phrases: ['solve a problem', 'no problem'] },
  'method': { derivatives: ['methodical'], phrases: ['teaching method', 'scientific method'] },
  'result': { derivatives: ['resultant'], phrases: ['as a result', 'lead to results'] },
  'reason': { derivatives: ['reasonable', 'reasoning'], phrases: ['for some reason', 'the reason why'] },
  'time': { derivatives: ['timely', 'timeless'], phrases: ['on time', 'in time'] },
  'start': { derivatives: ['starter', 'starting'], phrases: ['start from', 'fresh start'] },
  'end': { derivatives: ['ending', 'endless'], phrases: ['come to an end', 'in the end'] },
  'like': { derivatives: ['liking', 'alike'], phrases: ['look like', 'feel like'] },
  'gratitude': { derivatives: ['grateful'], phrases: ['express gratitude', 'deep gratitude'] },
  'believe': { derivatives: ['belief', 'believable'], phrases: ['believe in', 'make believe'] },
  'endeavor': { derivatives: ['endeavored'], phrases: ['make every endeavor', 'endeavor to do'] },
  'achievement': { derivatives: ['achieve', 'achievable'], phrases: ['sense of achievement', 'outstanding achievement'] },
  'transform': { derivatives: ['transformation', 'transformer'], phrases: ['transform into', 'digital transformation'] },
  'significant': { derivatives: ['significance', 'significantly'], phrases: ['highly significant', 'statistical significance'] },
  'acquire': { derivatives: ['acquisition', 'acquisitive'], phrases: ['acquire knowledge', 'language acquisition'] },
  'academy': { derivatives: ['academic', 'academician'], phrases: ['academic research', 'military academy'] },
  'mentor': { derivatives: ['mentorship', 'mentee'], phrases: ['business mentor', 'mentor program'] },
  'peer': { derivatives: ['peerless'], phrases: ['peer pressure', 'peer review'] },
  'assessment': { derivatives: ['assess', 'assessor'], phrases: ['risk assessment', 'self-assessment'] },
  'performance': { derivatives: ['perform', 'performer'], phrases: ['high performance', 'performance review'] },
  'expertise': { derivatives: ['expert', 'expertly'], phrases: ['technical expertise', 'area of expertise'] },
  'aspiration': { derivatives: ['aspire', 'aspiring'], phrases: ['career aspiration', 'aspiration for'] },
  'existence': { derivatives: ['exist', 'existent'], phrases: ['daily existence', 'coexistence'] },
  'companion': { derivatives: ['companionship'], phrases: ['faithful companion', 'travel companion'] },
  'household': { derivatives: ['householder'], phrases: ['household name', 'household income'] },
  'occupation': { derivatives: ['occupy', 'occupant'], phrases: ['main occupation', 'by occupation'] },
  'corporation': { derivatives: ['corporate'], phrases: ['multinational corporation', 'corporate culture'] },
  'venture': { derivatives: ['venturesome'], phrases: ['joint venture', 'business venture'] },
  'scheme': { derivatives: ['schematic'], phrases: ['color scheme', 'pension scheme'] },
  'objective': { derivatives: ['objectivity'], phrases: ['strategic objective', 'achieve an objective'] },
  'adversity': { derivatives: ['adverse', 'adversely'], phrases: ['in adversity', 'overcome adversity'] },
  'dilemma': { derivatives: [], phrases: ['face a dilemma', 'moral dilemma'] },
  'approach': { derivatives: ['approachable'], phrases: ['approach to', 'new approach'] },
  'outcome': { derivatives: [], phrases: ['positive outcome', 'desired outcome'] },
  'factor': { derivatives: [], phrases: ['key factor', 'contributing factor'] },
  'duration': { derivatives: ['during'], phrases: ['for the duration', 'short duration'] },
  'commence': { derivatives: ['commencement'], phrases: ['commence with', 'commencement ceremony'] },
  'conclude': { derivatives: ['conclusion', 'conclusive'], phrases: ['conclude with', 'draw a conclusion'] },
  'favor': { derivatives: ['favorite', 'favorable'], phrases: ['in favor of', 'do someone a favor'] },
  'appreciation': { derivatives: ['appreciate', 'appreciative'], phrases: ['show appreciation', 'in appreciation of'] },
  'conviction': { derivatives: ['convince', 'convincing'], phrases: ['deep conviction', 'carry conviction'] },
  'enterprise': { derivatives: ['entrepreneur', 'entrepreneurial'], phrases: ['private enterprise', 'business enterprise'] },
  'undertaking': { derivatives: ['undertake'], phrases: ['commercial undertaking', 'joint undertaking'] },
  'proposal': { derivatives: ['propose', 'proposition'], phrases: ['business proposal', 'make a proposal'] },
  'target': { derivatives: ['targeted'], phrases: ['sales target', 'target audience'] },
  'hindrance': { derivatives: ['hinder'], phrases: ['without hindrance', 'obstacle and hindrance'] },
  'issue': { derivatives: [], phrases: ['raise an issue', 'at issue'] },
  'strategy': { derivatives: ['strategic', 'strategist'], phrases: ['business strategy', 'marketing strategy'] },
  'yield': { derivatives: ['yielding'], phrases: ['high yield', 'yield results'] },
  'rationale': { derivatives: ['rational'], phrases: ['the rationale behind', 'business rationale'] },
  'deadline': { derivatives: [], phrases: ['meet the deadline', 'tight deadline'] },
  'initiate': { derivatives: ['initiative', 'initial'], phrases: ['take the initiative', 'initiate contact'] },
  'terminate': { derivatives: ['termination', 'terminal'], phrases: ['terminate a contract', 'terminate employment'] },
  'prosperity': { derivatives: ['prosperous', 'prosper'], phrases: ['economic prosperity', 'wish prosperity'] },
  'crucial': { derivatives: [], phrases: ['crucial moment', 'crucial to'] },
  'proposition': { derivatives: [], phrases: ['business proposition', 'attractive proposition'] },
  'return': { derivatives: ['returnable'], phrases: ['return on investment', 'annual return'] },
  'adapt': { derivatives: ['adaptation', 'adaptive'], phrases: ['adapt to', 'adapt oneself to'] },
  'competence': { derivatives: ['competent'], phrases: ['core competence', 'professional competence'] },
  'assure': { derivatives: ['assurance'], phrases: ['assure someone of', 'quality assurance'] },
  'prefer': { derivatives: ['preference', 'preferable'], phrases: ['prefer to', 'personal preference'] },
  'acknowledge': { derivatives: ['acknowledgment'], phrases: ['acknowledge receipt', 'widely acknowledged'] },
  'associate': { derivatives: ['association'], phrases: ['business associate', 'in association with'] },
  'strive': { derivatives: [], phrases: ['strive for', 'strive to do'] },
  'modify': { derivatives: ['modification'], phrases: ['modify behavior', 'slightly modified'] },
  'outlook': { derivatives: [], phrases: ['economic outlook', 'positive outlook'] },
  'livelihood': { derivatives: [], phrases: ['means of livelihood', 'earn one\'s livelihood'] },
  'domestic': { derivatives: ['domesticate'], phrases: ['domestic market', 'domestic flight'] },
  'colleague': { derivatives: [], phrases: ['fellow colleague', 'work colleague'] },
  'supervisor': { derivatives: ['supervise', 'supervision'], phrases: ['project supervisor', 'under supervision'] },
  'institution': { derivatives: ['institutional'], phrases: ['financial institution', 'educational institution'] },
  'evaluation': { derivatives: ['evaluate'], phrases: ['performance evaluation', 'systematic evaluation'] },
  'firm': { derivatives: ['firmly'], phrases: ['law firm', 'firm believer'] },
  'employment': { derivatives: ['employ', 'employee', 'employer'], phrases: ['seek employment', 'full-time employment'] },
  'assignment': { derivatives: ['assign'], phrases: ['complete an assignment', 'work assignment'] },
  'agenda': { derivatives: [], phrases: ['hidden agenda', 'on the agenda'] },
  'quota': { derivatives: [], phrases: ['sales quota', 'meet the quota'] },
  'setback': { derivatives: [], phrases: ['face a setback', 'temporary setback'] },
  'matter': { derivatives: [], phrases: ['as a matter of fact', 'subject matter'] },
  'procedure': { derivatives: ['procedural'], phrases: ['standard procedure', 'safety procedure'] },
  'consequence': { derivatives: ['consequent'], phrases: ['as a consequence', 'face the consequences'] },
  'origin': { derivatives: ['original', 'originally'], phrases: ['country of origin', 'trace the origin'] },
  'schedule': { derivatives: ['scheduled'], phrases: ['on schedule', 'tight schedule'] },
  'launch': { derivatives: [], phrases: ['product launch', 'launch a campaign'] },
  'expire': { derivatives: ['expiration', 'expiry'], phrases: ['expire soon', 'date of expiry'] },
  'accomplishment': { derivatives: ['accomplish'], phrases: ['sense of accomplishment', 'great accomplishment'] },
  'essential': { derivatives: ['essence'], phrases: ['essential to', 'essential oil'] },
  'opening': { derivatives: [], phrases: ['job opening', 'rare opening'] },
  'record': { derivatives: ['recording'], phrases: ['track record', 'break a record'] },
  'train': { derivatives: ['training', 'trainee'], phrases: ['on-the-job training', 'training course'] },
  'proficiency': { derivatives: ['proficient'], phrases: ['language proficiency', 'proficiency test'] },
  'rely': { derivatives: ['reliable', 'reliance'], phrases: ['rely on', 'reliable source'] },
  'contact': { derivatives: ['contactable'], phrases: ['make contact', 'lose contact'] },
  'attempt': { derivatives: ['attempted'], phrases: ['make an attempt', 'attempt to do'] },
  'adjust': { derivatives: ['adjustment', 'adjustable'], phrases: ['adjust to', 'make adjustments'] },
  'upcoming': { derivatives: [], phrases: ['upcoming events', 'upcoming meeting'] },
  'routine': { derivatives: ['routinely'], phrases: ['daily routine', 'break the routine'] },
  'relative': { derivatives: ['relatively'], phrases: ['close relative', 'distant relative'] },
  'partner': { derivatives: ['partnership'], phrases: ['business partner', 'working partner'] },
  'instructor': { derivatives: ['instruct', 'instruction'], phrases: ['driving instructor', 'flight instructor'] },
  'facility': { derivatives: ['facilitate'], phrases: ['manufacturing facility', 'medical facility'] },
  'qualification': { derivatives: ['qualify', 'qualified'], phrases: ['professional qualification', 'qualification requirements'] },
  'attainment': { derivatives: ['attain', 'attainable'], phrases: ['educational attainment', 'attain a goal'] },
  'alter': { derivatives: ['alteration', 'unaltered'], phrases: ['alter course', 'make alterations'] },
  'paramount': { derivatives: [], phrases: ['of paramount importance', 'paramount concern'] },
  'comprehend': { derivatives: ['comprehension', 'comprehensive'], phrases: ['reading comprehension', 'comprehensive understanding'] },
  'tutorial': { derivatives: ['tutor', 'tutee'], phrases: ['private tutor', 'personal tutor'] },
  'cognition': { derivatives: ['cognitive', 'recognize'], phrases: ['cognitive ability', 'cognitive science'] },
  'ambition': { derivatives: ['ambitious', 'ambitiously'], phrases: ['burning ambition', 'fulfill one\'s ambition'] },
  'acquaintance': { derivatives: ['acquainted'], phrases: ['casual acquaintance', 'nodding acquaintance'] },
  'vocation': { derivatives: ['vocational'], phrases: ['sense of vocation', 'vocational training'] },
  'initiative': { derivatives: ['initiate', 'initial'], phrases: ['new initiative', 'take the initiative'] },
  'blueprint': { derivatives: [], phrases: ['blueprint for', 'economic blueprint'] },
  'milestone': { derivatives: [], phrases: ['reach a milestone', 'major milestone'] },
  'hardship': { derivatives: [], phrases: ['economic hardship', 'endure hardship'] },
  'predicament': { derivatives: [], phrases: ['in a predicament', 'awkward predicament'] },
  'methodology': { derivatives: ['methodological'], phrases: ['research methodology', 'teaching methodology'] },
  'repercussion': { derivatives: [], phrases: ['have repercussions', 'serious repercussions'] },
  'underlying': { derivatives: [], phrases: ['underlying cause', 'underlying principle'] },
  'timeframe': { derivatives: [], phrases: ['within the timeframe', 'specified timeframe'] },
  'inception': { derivatives: [], phrases: ['since its inception', 'from inception'] },
  'culmination': { derivatives: ['culminate'], phrases: ['culmination of', 'culminate in'] },
  'try hard': { derivatives: ['try', 'hard'], phrases: ['try one\'s best', 'work hard'] },
  'win': { derivatives: ['winner', 'winning'], phrases: ['win the game', 'win a prize'] },
  'turn': { derivatives: ['turning'], phrases: ['turn around', 'turn into'] },
  'chance': { derivatives: [], phrases: ['have a chance', 'take a chance'] },
  'big': { derivatives: ['bigger', 'biggest'], phrases: ['big deal', 'big day'] },
  'learn': { derivatives: ['learner', 'learning'], phrases: ['learn by heart', 'learn from'] },
  'test': { derivatives: ['testing'], phrases: ['take a test', 'pass the test'] },
  'mark': { derivatives: ['marked'], phrases: ['get good marks', 'full marks'] },
  'know': { derivatives: ['knowing', 'known'], phrases: ['know about', 'as we know'] },
  'tomorrow': { derivatives: [], phrases: ['tomorrow morning', 'the day after tomorrow'] },
  'live': { derivatives: ['living', 'lively'], phrases: ['live well', 'live in'] },
  'home': { derivatives: ['hometown'], phrases: ['go home', 'at home'] },
  'job': { derivatives: [], phrases: ['do a good job', 'good job'] },
  'office': { derivatives: ['officer'], phrases: ['go to the office', 'head office'] },
  'task': { derivatives: [], phrases: ['do a task', 'finish the task'] },
  'idea': { derivatives: [], phrases: ['good idea', 'have an idea'] },
  'aim': { derivatives: [], phrases: ['take aim', 'aim at'] },
  'hard': { derivatives: ['harder', 'hardest'], phrases: ['too hard', 'work hard'] },
  'question': { derivatives: ['questioning'], phrases: ['ask a question', 'answer the question'] },
  'way': { derivatives: [], phrases: ['by the way', 'in this way'] },
  'why': { derivatives: [], phrases: ['that is why', 'why not'] },
  'clock': { derivatives: ['o\'clock'], phrases: ['on the clock', 'around the clock'] },
  'begin': { derivatives: ['beginning'], phrases: ['begin with', 'to begin with'] },
  'finish': { derivatives: ['finished'], phrases: ['finish up', 'finish line'] },
  'love': { derivatives: ['lovely'], phrases: ['love to', 'fall in love'] },
  'thank': { derivatives: ['thanks', 'thankful'], phrases: ['thank you', 'thanks to'] },
  'trust': { derivatives: ['trusting'], phrases: ['trust me', 'in trust'] }
};
