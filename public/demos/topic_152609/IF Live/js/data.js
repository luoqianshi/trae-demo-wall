// IF LIFE - 数据层
// 所有游戏数据内联，支持离线运行（双击 index.html 即可）
// 数据来源：events.json / personalities.json / life_stages.json / option_impacts.json / insights.json / key_events.json / portrait_rules.json

const IF_LIFE_DATA = {

  // ===== 5个起点参数定义（来自设计文档第五章）=====
  PARAMS: {
    family: [
      { id: 'stable', label: '小康稳定', icon: '🏡', desc: '普通家庭，父母有稳定收入', effects: { wealth: 0, career: 0 } },
      { id: 'wealthy', label: '富裕托底', icon: '🏙️', desc: '家境优渥，有经济后盾', effects: { wealth: 20, career: 5 } },
      { id: 'humble', label: '寒门自立', icon: '🌾', desc: '家境普通，一切靠自己', effects: { wealth: -15, happiness: 5, career: -5 } }
    ],
    talent: [
      { id: 'academic', label: '学术型', icon: '📚', desc: '擅长学习与研究', effects: { career: 10 } },
      { id: 'artistic', label: '艺术型', icon: '🎨', desc: '感性丰富，有创造力', effects: { happiness: 10, career: -5 } },
      { id: 'business', label: '商业型', icon: '💼', desc: '商业嗅觉敏锐', effects: { wealth: 10, career: 5 } }
    ],
    city: [
      { id: 'tier1', label: '一线城市', icon: '🌆', desc: '机会多但压力大', effects: { career: 15, happiness: -10, wealth: -10 } },
      { id: 'newtier1', label: '新一线', icon: '🏙️', desc: '发展与生活平衡', effects: { career: 5, happiness: 5 } },
      { id: 'tier3', label: '三四线', icon: '🏘️', desc: '安稳舒适，节奏慢', effects: { career: -10, happiness: 10, health: 5 } }
    ],
    personality: [
      { id: 'striver', label: '进取', icon: '🔥', desc: '相信努力能改变命运，事业就是一切', aiPersonality: 'striver' },
      { id: 'guardian', label: '守护', icon: '🛡️', desc: '家人安稳比什么都重要', aiPersonality: 'guardian' },
      { id: 'speculator', label: '投机', icon: '🎲', desc: '人生就是牌局，不敢下注永远赢不了', aiPersonality: 'speculator' },
      { id: 'free', label: '自由', icon: '🎨', desc: '不被定义，每个选择都由自己掌控', aiPersonality: null }
    ],
    risk: [
      { id: 'conservative', label: '稳健型', desc: '偏好确定性，倾向选稳妥选项', biasAdjust: { A: 2 } },
      { id: 'balanced', label: '平衡型', desc: '无特别偏好，因势利导', biasAdjust: {} },
      { id: 'aggressive', label: '激进型', desc: '愿意为可能性付代价', biasAdjust: { D: 2 } }
    ]
  },

  // ===== 3种决策模式 =====
  MODES: [
    { id: 'manual', label: '手动模式', icon: '✋', desc: '每个事件你自己选 A/B/C/D', detail: '显示"如果你选了X，AI会选Y"，可以看到自己和AI的差异' },
    { id: 'auto', label: '自动模式', icon: '🤖', desc: 'AI按性格底色自动决策，你只看不干预', detail: '走完一遍再回看' },
    { id: 'mixed', label: '混合模式 ⭐推荐', icon: '🔀', desc: '6个关键事件你决定，其他AI自动', detail: '兼顾体验节奏和参与感' }
  ],

  // ===== 10个精选事件（按年龄排序）=====
  SELECTED_EVENTS: ['e001', 'e004', 'e007', 'e010', 'e011', 'e015', 'e018', 'e023', 'e027', 'e030'],

  EVENT_AGES: { e001: 23, e004: 26, e007: 27, e010: 28, e011: 32, e015: 35, e018: 37, e023: 45, e027: 55, e030: 58 },

  // ===== 属性配置 =====
  ATTRIBUTES: {
    wealth: { label: '财富', icon: '💰', color: '#C75B12' },
    happiness: { label: '幸福', icon: '😊', color: '#D4A017' },
    health: { label: '健康', icon: '❤️', color: '#A8362E' },
    career: { label: '事业', icon: '💼', color: '#2C4A6B' }
  },

  // ===== 30个人生事件（来源：events.json 的 events 数组）=====
  events: [
    {
      id: 'e001',
      title: '应届offer：铁饭碗还是赌未来',
      life_stage: 'early_career',
      age_range: [22, 25],
      theme: 'career',
      trigger_conditions: { min_age: 22, max_age: 25, requires_status: [] },
      context: '你今年24岁，985硕士应届，手握两个offer让同学羡慕也让你夜夜失眠。一个是大型国企，月薪8k，六险二金齐全，据说进去就稳了，但涨薪慢、论资排辈，十年后可能还是这个价。另一个是深圳互联网公司，月薪18k但996，期权画饼说三年后可能翻倍，也可能一文不值。父母天天打电话催你选国企，说铁饭碗比什么都强，你妈甚至放了狠话说选互联网就别回家。同学群里却一片选互联网的声音。签约截止日期只剩五天，你必须做出决定。',
      options: [
        { id: 'A', label: '选互联网公司', description: '月薪翻倍加期权，拼三年看结果，最差也能攒笔钱' },
        { id: 'B', label: '选国企', description: '稳定有保障，六险二金，父母也安心，慢慢熬资历' },
        { id: 'C', label: '都不选，考研', description: '两条路都不满意，脱产考研两年后再做选择' },
        { id: 'D', label: '选互联网再跳AI创业', description: '先进互联网攒半年经验，然后跳去AI创业公司搏更大的' }
      ],
      outcome_hints: {
        A: '高薪高强度，三年后要么跃迁要么被优化，与父母关系紧张',
        B: '生活稳定但成长慢，三年后薪资差距拉大，父母满意',
        C: '两年后重新择业，学历提升但年龄成本增加',
        D: '频繁跳槽风险大，但若押中AI赛道回报极高'
      },
      personality_bias: {
        striver: { A: 80, B: 15, C: 40, D: 55 },
        guardian: { A: 20, B: 85, C: 50, D: 25 },
        speculator: { A: 50, B: 10, C: 30, D: 80 }
      }
    },
    {
      id: 'e002',
      title: '猎头来敲门：跳还是留',
      life_stage: 'early_career',
      age_range: [25, 28],
      theme: 'career',
      trigger_conditions: { min_age: 25, max_age: 28, requires_status: ['employed'] },
      context: '你在第一家公司干了三年，从新人做到了小组长，薪资从8k涨到15k。猎头突然找到你，开出2倍薪资让你去一家B轮创业公司带团队，另加0.5%期权。你现在的公司刚把你列入主管候选人，但加薪只有15%。老领导私下说留下来年底大概率升主管。创业公司CEO说越早来股份越多，但B轮没过的话半年就可能散伙。你下个月房租要续约，正需要一笔钱。猎头说offer有效期只有一周，你必须尽快答复。',
      options: [
        { id: 'A', label: '去创业公司', description: '2倍薪资加0.5%期权，赌它做大上市' },
        { id: 'B', label: '留下等升职', description: '年底大概率升主管，稳妥为先，不折腾' },
        { id: 'C', label: '用offer谈判', description: '拿创业公司的offer跟现公司谈，争取加薪留任' },
        { id: 'D', label: '辞职做副业', description: '你的自媒体和投资已有起色，全职做可能翻几倍' }
      ],
      outcome_hints: {
        A: '若创业成功则实现阶层跃迁，失败则简历上多一段短经历',
        B: '稳定晋升但薪资天花板低，三年后可能后悔没跳',
        C: '可能两头不讨好，但若谈成则收益最大',
        D: '高风险高回报，收入不稳定但自由度最高'
      },
      personality_bias: {
        striver: { A: 80, B: 25, C: 50, D: 35 },
        guardian: { A: 20, B: 85, C: 55, D: 15 },
        speculator: { A: 35, B: 15, C: 30, D: 75 }
      }
    },
    {
      id: 'e003',
      title: '裁员潮里的落水者',
      life_stage: 'early_career',
      age_range: [25, 30],
      theme: 'career',
      trigger_conditions: { min_age: 25, max_age: 30, requires_status: [] },
      context: '公司业务调整，你所在的业务线整个被砍，好在N+1赔偿拿到了6万块。你今年27，没房贷没孩子，但行业整体在收缩，同类型岗位开出的薪资比之前低20%。猎头说现在不是挑的时候，先上岸再说。你室友说趁这个机会换个赛道试试，他转去做了新能源，收入反而涨了。你爸妈在电话里说先找个班上，别闲着，空窗期长了简历难看。赔偿金到账已经两周了，你的存款在每月开支下只能撑四个月。',
      options: [
        { id: 'A', label: '快速上岸', description: '同行业降薪也先找着，空窗期越长越被动' },
        { id: 'B', label: '转行重来', description: '趁空窗学新方向，用半年换一个上升赛道' },
        { id: 'C', label: '用赔偿金创业', description: '6万加上存款，试一把一直想做的项目' },
        { id: 'D', label: '先休息再说', description: '歇两三个月，边旅行边想清楚下一步' }
      ],
      outcome_hints: {
        A: '快速恢复收入但薪资打折，短期内稳定但天花板降低',
        B: '半年空窗期压力大，但若选对赛道长期回报高',
        C: '失败则人财两空，成功则完全改变人生轨迹',
        D: '心理恢复但经济压力递增，四个月后被迫将就'
      },
      personality_bias: {
        striver: { A: 25, B: 75, C: 40, D: 35 },
        guardian: { A: 85, B: 20, C: 15, D: 40 },
        speculator: { A: 20, B: 30, C: 80, D: 40 }
      }
    },
    {
      id: 'e004',
      title: '异地恋：走还是留',
      life_stage: 'early_career',
      age_range: [24, 28],
      theme: 'relationship',
      trigger_conditions: { min_age: 24, max_age: 28, requires_status: ['in_relationship'] },
      context: '你和恋人在一起两年，感情稳定，已经在谈婚论嫁。对方突然拿到了另一个城市的优质工作机会，月薪是现在的1.8倍，但要求一个月内到岗。你在现在的城市刚站稳脚跟，同事关系不错，领导也在重点培养你。对方说过来的话养你过渡期，但你在那个城市没有任何人脉，万一分手就是彻底的异地孤岛。父母不支持异地，说要么一起去要么趁早分，拖下去对谁都没好处。对方给出的最后期限是本周末必须答复。',
      options: [
        { id: 'A', label: '跟对方走', description: '感情为先，换个城市重新开始，对方说养你过渡' },
        { id: 'B', label: '留下发展', description: '自己的事业刚有起色，让对方自己做选择' },
        { id: 'C', label: '异地恋先扛着', description: '两边都不放弃，先异地看看能撑多久' },
        { id: 'D', label: '趁早止损', description: '重新审视这段关系，未来规划不一致就和平分手' }
      ],
      outcome_hints: {
        A: '感情保住但事业重新归零，若关系生变则损失惨重',
        B: '事业继续上升但感情面临考验，对方可能认为你不够重视',
        C: '短期两全但长期疲惫，异地恋成功率数据不乐观',
        D: '痛苦但干脆，及时止损后可能遇到更匹配的人'
      },
      personality_bias: {
        striver: { A: 20, B: 75, C: 40, D: 35 },
        guardian: { A: 80, B: 15, C: 50, D: 25 },
        speculator: { A: 25, B: 35, C: 30, D: 75 }
      }
    },
    {
      id: 'e005',
      title: '结婚账单：爱与钱的算术',
      life_stage: 'early_career',
      age_range: [26, 30],
      theme: 'relationship',
      trigger_conditions: { min_age: 26, max_age: 30, requires_status: ['in_relationship'] },
      context: '你28岁，在一家成长型公司做到了核心骨干，老板暗示明年给你总监位。但女朋友催婚催得紧，她说在一起三年了，再不结婚她爸妈要问是不是你不认真。她的期望是：彩礼20万、市区婚房首付、婚礼开销——加起来至少60万。你存款25万，如果全投进去就彻底清空，接下来两年都得紧巴巴。女朋友说再拖下去她等不了，她妈已经在给她介绍相亲对象了。你心里清楚，明年升了总监收入会好很多，但那时候人可能已经没了。',
      options: [
        { id: 'A', label: '借钱办婚礼', description: '凑齐60万先把婚结了，家人安心比什么都重要' },
        { id: 'B', label: '先领证后补办', description: '婚礼从简，省下的钱用来投资或创业' },
        { id: 'C', label: '暂缓结婚', description: '先搞事业攒够钱，升了总监再风光办' },
        { id: 'D', label: '坦诚现状共担', description: '跟女友摊牌财务情况，看她愿不愿意一起贷款承担' }
      ],
      outcome_hints: {
        A: '婚姻保住但背债两年，经济压力可能影响婚后关系',
        B: '婚姻成立但女方家庭可能不满，省下的钱有投资空间',
        C: '事业上升但感情可能就此结束，鱼与熊掌不可兼得',
        D: '若女方愿意则关系更稳固，若不愿意则暴露价值观差异'
      },
      personality_bias: {
        striver: { A: 15, B: 40, C: 75, D: 45 },
        guardian: { A: 80, B: 25, C: 30, D: 40 },
        speculator: { A: 30, B: 75, C: 20, D: 50 }
      }
    },
    {
      id: 'e006',
      title: '30万首付：老家还是远方',
      life_stage: 'early_career',
      age_range: [25, 30],
      theme: 'finance',
      trigger_conditions: { min_age: 25, max_age: 30, requires_status: [] },
      context: '你26岁，工作三年攒了30万。老家房价一万出头，首付20%只要20万就能上车；而你所在的一线城市房价六七万，30万连首付的零头都不够。中介天天推老家的投资盘，说买了就涨，再不买连老家都买不起了。你妈说在老家买套，以后回来也有个窝，总比钱放着贬值强。你心里清楚，在老家买了房就等于默认一线留不下来，这笔钱投出去就被锁死了。但如果不买，30万放在银行里年年缩水，而房价从没跌过。',
      options: [
        { id: 'A', label: '在老家买', description: '20万首付上车，以后回来也有个窝，先占位' },
        { id: 'B', label: '死攒等一线', description: '目标就是一线城市的房子，不降标准不退而求其次' },
        { id: 'C', label: '投资理财', description: '不买房，拿这笔钱做投资买基金，让钱生钱' },
        { id: 'D', label: '老家买来出租', description: '在老家买但不住，租出去以租养贷，资产先占着' }
      ],
      outcome_hints: {
        A: '有了退路但锁死资金，一线城市机会窗口关闭',
        B: '资金灵活但一线城市房价上涨可能永远追不上',
        C: '投资可能增值也可能亏损，但保持最大灵活性',
        D: '被动收入但回报率低，管理成本被低估'
      },
      personality_bias: {
        striver: { A: 20, B: 80, C: 30, D: 35 },
        guardian: { A: 80, B: 15, C: 20, D: 45 },
        speculator: { A: 25, B: 35, C: 75, D: 40 }
      }
    },
    {
      id: 'e007',
      title: '副业风口：梭哈还是旁观',
      life_stage: 'early_career',
      age_range: [24, 28],
      theme: 'finance',
      trigger_conditions: { min_age: 24, max_age: 28, requires_status: ['employed'] },
      context: '你在主业之外发现了一个副业机会：一个朋友拉你一起做跨境电商，初期投入5万，他负责供应链你负责运营。按他的测算半年回本、一年月入2到3万。你现在月薪1.5万，还完房租和生活费每月剩4千。5万块几乎是你全部的流动资金，投进去就一分钱应急的钱都没有了。朋友说先到先得，这个窗口最多三个月，隔壁团队已经有两个人加入了，效果确实不错。你的领导最近在观察谁能接下一个重要项目，这时候分心可能错失升职机会。',
      options: [
        { id: 'A', label: '全额投入5万', description: '梭哈副业，全力以赴，半年回本一年翻倍' },
        { id: 'B', label: '先投1万试水', description: '小仓位验证，效果好了再加码' },
        { id: 'C', label: '不投专注主业', description: '升职加薪才是正道，别分心' },
        { id: 'D', label: '技能入股零成本', description: '不出钱但用运营能力入股，零风险参与' }
      ],
      outcome_hints: {
        A: '若成功则月入翻倍，若失败则存款归零且影响主业表现',
        B: '风险可控但收益有限，试水期可能错过最佳窗口',
        C: '专注主业可能升职，但副业窗口关闭不再来',
        D: '零财务风险但话语权弱，分成比例可能被压低'
      },
      personality_bias: {
        striver: { A: 25, B: 35, C: 30, D: 75 },
        guardian: { A: 10, B: 45, C: 80, D: 25 },
        speculator: { A: 80, B: 40, C: 10, D: 35 }
      }
    },
    {
      id: 'e008',
      title: '学历天花板：考研还是硬扛',
      life_stage: 'early_career',
      age_range: [23, 26],
      theme: 'self',
      trigger_conditions: { min_age: 23, max_age: 26, requires_status: [] },
      context: '你本科毕业工作两年，发现公司天花板肉眼可见——硕士同事起薪就比你高30%，晋升也优先考虑学历。你现在24岁，考研的话脱产两年，出来27岁重新开始。存款够支撑一年半的生活费。父母说趁年轻读书是对的，早考早受益，他们可以补贴一部分。但你的直属领导说工作经验比学历值钱，留下来重点培养你，明年给你独立项目带。考研报名截止还剩十天，你之前买的复习资料还没拆封，而岗位JD上那条"硕士优先"刺得你很难受。',
      options: [
        { id: 'A', label: '脱产考研', description: '用两年换一个硕士学历，打开晋升天花板' },
        { id: 'B', label: '在职读研', description: '边工作边读书，学历收入两不误' },
        { id: 'C', label: '不考拼表现', description: '在现有岗位上用业绩证明自己，学历不是唯一出路' },
        { id: 'D', label: '考职业证书', description: '放弃学历路线，考高含金量证书快速变现' }
      ],
      outcome_hints: {
        A: '学历提升但两年无收入，27岁重新竞争压力不小',
        B: '两全但极累，工作学业可能都做不好',
        C: '短期内可用，但学历天花板长期存在',
        D: '投入小周期短，但天花板仍可能撞上'
      },
      personality_bias: {
        striver: { A: 80, B: 40, C: 20, D: 35 },
        guardian: { A: 35, B: 75, C: 40, D: 25 },
        speculator: { A: 25, B: 30, C: 35, D: 75 }
      }
    },
    {
      id: 'e009',
      title: '进修岔路：MBA还是AI',
      life_stage: 'early_career',
      age_range: [26, 30],
      theme: 'self',
      trigger_conditions: { min_age: 26, max_age: 30, requires_status: ['employed'] },
      context: '你在公司已经做到中层，但明显感到行业在变。AI工具正在替代你一部分工作内容，招聘市场上新岗位都要求AI加你专业的复合背景。公司提供两个进修名额：一个是三个月的脱产MBA短期课程，回来可以直接竞聘总监岗；另一个是半年的AI实战训练营，学费自付3万但能拿到行业认证。你今年28，同期进来的同事已经开始往上走了，你不能再等。进修报名截止就在这周，两个名额已经有人开始抢了。',
      options: [
        { id: 'A', label: '选MBA课程', description: '回来竞聘总监，走管理路线，确定性强' },
        { id: 'B', label: '选AI训练营', description: '自费3万赌技术方向，未来风口更大' },
        { id: 'C', label: '两个都报', description: 'MBA保底加AI增值，最保险但最累' },
        { id: 'D', label: '都不选', description: '相信经验不会被轻易替代，省下时间和钱' }
      ],
      outcome_hints: {
        A: '管理层晋升通道打开，但技术转型机会关闭',
        B: '若AI持续火热则回报巨大，若泡沫则3万打水漂',
        C: '两线并进最安全但身心透支，可能两个都学不精',
        D: '短期省事但长期风险最大，行业变化不会等你'
      },
      personality_bias: {
        striver: { A: 80, B: 40, C: 35, D: 15 },
        guardian: { A: 30, B: 25, C: 75, D: 40 },
        speculator: { A: 35, B: 80, C: 25, D: 20 }
      }
    },
    {
      id: 'e010',
      title: '母亲住院：钱和命的算账',
      life_stage: 'early_career',
      age_range: [25, 30],
      theme: 'family',
      trigger_conditions: { min_age: 25, max_age: 30, requires_status: [] },
      context: '母亲查出了需要手术的病，手术费加后续治疗大约15万。你有一个哥哥，但他刚买了房贷款压身，说最多出3万。你的存款有20万，原本打算明年用来付首付。母亲说不治了，别拖累你们，小病扛扛就过去了。父亲在电话那头沉默了很久，只说了句你自己看着办。手术预约排到了三周后，如果不提前交定金排期还会延后。你嫂子在家庭群里发了条消息：哥最近压力也很大，房贷加上孩子开销，真的拿不出更多了。',
      options: [
        { id: 'A', label: '全额出15万', description: '母亲的健康最重要，首付可以再攒，命不能等' },
        { id: 'B', label: '出8万其余想办法', description: '出一半，剩余走医保、找亲戚借，给自己留点' },
        { id: 'C', label: '只出5万均摊', description: '跟哥哥各出5万，剩余走医保和众筹' },
        { id: 'D', label: '先跟哥哥谈判', description: '要求哥哥多出，否则你也不全出，不能一个人扛' }
      ],
      outcome_hints: {
        A: '母亲得到最好治疗但首付计划打乱，至少延后两年',
        B: '母亲能手术但你仍有缓冲，但凑钱过程可能焦虑',
        C: '个人支出最小化但治疗效果可能打折，家庭矛盾隐患',
        D: '可能激化兄弟矛盾，但若谈成则分担更公平'
      },
      personality_bias: {
        striver: { A: 30, B: 70, C: 25, D: 40 },
        guardian: { A: 85, B: 35, C: 15, D: 25 },
        speculator: { A: 20, B: 40, C: 75, D: 35 }
      }
    },
    {
      id: 'e011',
      title: '要不要孩子：两个人的拉锯',
      life_stage: 'family_building',
      age_range: [30, 35],
      theme: 'family',
      trigger_conditions: { min_age: 30, max_age: 35, requires_status: ['married'] },
      context: '你32岁，结婚三年，妻子31岁在互联网公司做运营，你们两人合计月入3.5万，房贷每月1.2万。双方父母都在催生，你妈说再不生生不出来了，丈母娘甚至说可以帮忙带。妻子说如果生，她想辞职全职带两年，因为婆婆身体不好带不了。你算了一笔账：少一个人收入，加上奶粉医疗早教，每月要多支出1.5万，生活质量会断崖式下降。妻子说她的生物钟不等人，再拖两年就是高龄产妇，风险陡增。你的事业刚进上升期，领导暗示年底给你升职，但前提是接下来半年带团队攻坚一个重要项目。妻子说这是最后一个窗口，过了这个月她不再提了。',
      options: [
        { id: 'A', label: '现在就生', description: '妻子辞职全职带，扛住经济压力，家庭完整比事业重要' },
        { id: 'B', label: '再等一年', description: '等你升完职加完薪再要，经济宽裕些更稳妥' },
        { id: 'C', label: '请育儿嫂', description: '妻子继续工作，花钱请育儿嫂，两边都不耽误' },
        { id: 'D', label: '不要孩子', description: '丁克到底，把钱和精力投在自己身上' }
      ],
      outcome_hints: {
        A: '家庭完整但经济压力大，升职机会可能泡汤，妻子离职两年后重返职场困难',
        B: '经济更稳但妻子年龄风险真实存在，若出意外永远无法弥补',
        C: '双收入但育儿嫂不好找且贵，孩子前两年可能得不到足够陪伴',
        D: '自由且宽裕，但双方父母的压力和未来可能的后悔无法预估'
      },
      personality_bias: {
        striver: { A: 20, B: 75, C: 40, D: 30 },
        guardian: { A: 85, B: 35, C: 30, D: 10 },
        speculator: { A: 30, B: 25, C: 40, D: 75 }
      }
    },
    {
      id: 'e012',
      title: '婚姻裂缝：忍还是离',
      life_stage: 'family_building',
      age_range: [32, 38],
      theme: 'family',
      trigger_conditions: { min_age: 32, max_age: 38, requires_status: ['married'] },
      context: '结婚五年，你发现婚姻正在变成一种消耗。你们为钱吵、为孩子吵、为谁做家务吵，已经三个月没有好好说过话。上周末你发现对方手机里有跟同事暧昧的聊天记录，虽然没有实质证据但那些话像针一样扎在心里。对方说是工作压力大随便聊聊，求你别多想。你妈说婚姻就是忍，为了孩子别折腾。你朋友说这种事有第一次就有第二次。孩子刚三岁，正是最需要稳定环境的时候。你一个人坐在车里，抽完了一整包烟，不知道该回家还是该去酒店。房产证上两个人的名字，离婚就是一人一半，但孩子归谁？',
      options: [
        { id: 'A', label: '为了孩子忍', description: '孩子还小需要完整家庭，凑合过比破碎强' },
        { id: 'B', label: '做婚姻咨询', description: '一起去找专业咨询师，最后努力一次' },
        { id: 'C', label: '提出离婚', description: '信任已经破裂，与其互相消耗不如体面结束' },
        { id: 'D', label: '各过各的', description: '形式上维持婚姻，但各自独立生活，互不干涉' }
      ],
      outcome_hints: {
        A: '孩子有家但你在持续消耗中，长期抑郁风险大',
        B: '若愿意修复则有效，若一方心已死则浪费时间',
        C: '痛苦但干脆，财产分割和抚养权是硬仗',
        D: '灰色地带，短期减震但长期不可持续，迟早要摊牌'
      },
      personality_bias: {
        striver: { A: 15, B: 45, C: 35, D: 70 },
        guardian: { A: 80, B: 45, C: 15, D: 30 },
        speculator: { A: 35, B: 20, C: 75, D: 40 }
      }
    },
    {
      id: 'e013',
      title: '二胎来了：接还是不接',
      life_stage: 'family_building',
      age_range: [33, 38],
      theme: 'family',
      trigger_conditions: { min_age: 33, max_age: 38, requires_status: ['married'] },
      context: '大的刚上幼儿园，你跟配偶好不容易喘口气，开始有了一点自己的生活。结果意外怀上了二胎。配偶说既然来了就生，两个孩子以后有个伴。你算了一下：现在的房贷加大的教育支出已经把月结余压到5千以内，再来一个，要么换更大房子要么请更多帮手，怎么算都是每月多出1万的开销。你的部门最近在裁员优化，虽然你暂时安全但说不准。公婆说帮不了，娘家妈说最多帮半年。医生说以配偶的年龄，这次不要以后大概率要不上。配偶很坚决，说这是命里注定的，不要就离婚。',
      options: [
        { id: 'A', label: '生下来', description: '孩子来了就是缘分，挤一挤总能扛过去' },
        { id: 'B', label: '不要了', description: '经济和精力都不允许，现实比感觉更重要' },
        { id: 'C', label: '条件式同意', description: '生可以，但配偶必须全职带两年，你全力赚钱' },
        { id: 'D', label: '延迟决定', description: '先用三个月评估经济状况，再最终决定' }
      ],
      outcome_hints: {
        A: '家庭完整但经济压力极大，你可能被迫接更多活或换更高薪工作',
        B: '经济可控但配偶关系面临危机，医生的话意味着再无选择',
        C: '责任划分清晰但配偶牺牲职业发展，未来可能因此心生怨恨',
        D: '争取缓冲但医学窗口有限，拖到后面风险更大'
      },
      personality_bias: {
        striver: { A: 15, B: 40, C: 80, D: 25 },
        guardian: { A: 85, B: 20, C: 35, D: 30 },
        speculator: { A: 30, B: 75, C: 20, D: 45 }
      }
    },
    {
      id: 'e014',
      title: '管理岗：上还是不上',
      life_stage: 'family_building',
      age_range: [30, 36],
      theme: 'career',
      trigger_conditions: { min_age: 30, max_age: 36, requires_status: ['employed'] },
      context: '你在技术岗做了八年，是团队里最资深的人。老板找你谈话，说想让你带一个新部门，从技术转管理。薪资涨40%，有股权激励，但要求你每周至少参加三个跨部门会议、做季度汇报、背团队KPI。你现在写代码的时间占80%，转管理后只剩20%。你热爱技术，猎头说你这个级别的技术人在市场上非常抢手，跳槽也能涨30%还不丢手感。但老板说错过这次，下一次管理岗的窗口至少两年后。你刚有了孩子，40%的涨薪意味着每月多8千块，够请一个不错的育儿嫂。配偶说你自己决定，但眼神里你看得出来她更希望你加薪。',
      options: [
        { id: 'A', label: '接受管理岗', description: '涨薪40%加股权，为家庭往上走，技术以后还能捡' },
        { id: 'B', label: '跳槽技术岗', description: '涨30%且保持技术路线，长期价值更高' },
        { id: 'C', label: '拒绝留在原位', description: '不走不跳，保持现状，等着下一个更合适的时机' },
        { id: 'D', label: '提条件后再接', description: '要求保留20%技术时间再加远程办公日，谈拢了再上' }
      ],
      outcome_hints: {
        A: '收入大增但技术可能荒废，两年后回不去了',
        B: '技术持续精进但少了管理经验，晋升天花板仍在',
        C: '安全但可能被边缘化，老板给你的机会不会等人',
        D: '若谈成则两全其美，但老板可能认为你不够决断'
      },
      personality_bias: {
        striver: { A: 85, B: 30, C: 10, D: 35 },
        guardian: { A: 30, B: 25, C: 80, D: 40 },
        speculator: { A: 40, B: 75, C: 20, D: 35 }
      }
    },
    {
      id: 'e015',
      title: '晋升瓶颈：出走还是熬',
      life_stage: 'family_building',
      age_range: [33, 38],
      theme: 'career',
      trigger_conditions: { min_age: 33, max_age: 38, requires_status: ['employed'] },
      context: '你在公司干了七年，从基层做到了部门副职，但上面的正职比你大三岁，稳得像钉子一样。猎头给你介绍了两个机会：一个是大厂的同级别岗位，薪资翻倍但996，工作内容螺丝钉化；另一个是一家C轮公司的VP，薪资只多20%但给2%期权，赌它三年后上市。你现在的公司虽然升不上去但965，同事关系融洽，孩子刚上小学正是需要陪伴的时候。配偶说你在外面怎么都行，但别再996了，孩子上次问你为什么总是见不到爸爸的时候她差点哭出来。猎头说C轮公司的窗口期就这周，大厂常年招人。',
      options: [
        { id: 'A', label: '去大厂', description: '薪资翻倍但996螺丝钉，用时间换钱' },
        { id: 'B', label: '去C轮公司', description: '赌三年上市，2%期权可能是你阶级跃迁的门票' },
        { id: 'C', label: '留下继续熬', description: '965不折腾，等正职走了再上，家庭优先' },
        { id: 'D', label: '内部转岗', description: '换个有上升空间的部门，保住稳定又争取突破' }
      ],
      outcome_hints: {
        A: '收入大增但家庭时间归零，身心消耗极快',
        B: '若上市成功则阶层跃迁，若失败则白忙三年',
        C: '家庭安稳但职业天花板确认，正职可能再待五年',
        D: '中间路线但内部政治复杂，可能两头不讨好'
      },
      personality_bias: {
        striver: { A: 25, B: 80, C: 15, D: 40 },
        guardian: { A: 15, B: 20, C: 85, D: 40 },
        speculator: { A: 30, B: 75, C: 10, D: 35 }
      }
    },
    {
      id: 'e016',
      title: '创业邀约：拿家底赌一把',
      life_stage: 'family_building',
      age_range: [32, 38],
      theme: 'career',
      trigger_conditions: { min_age: 32, max_age: 38, requires_status: ['employed'] },
      context: '前同事拉你一起创业做企业服务，他负责销售你负责产品，启动资金各出30万，已经谈好了第一个客户年单80万。你现有存款45万，其中30万是给孩子的教育基金。配偶坚决反对，说你已经不是一个人了，创业失败全家跟着喝西北风。你爸倒是支持，说男人就该搏一把，趁还没老。前同事说天使轮正在谈，如果成了估值立刻翻三倍，但要你一个月内到岗，否则找别人。你在公司的年终奖下个月发，大概8万块。配偶说你要敢动教育基金就别回这个家。',
      options: [
        { id: 'A', label: '出资30万创业', description: '拿全部积蓄赌一把，成了就是自己的老板' },
        { id: 'B', label: '不出钱只出力', description: '以合伙人身份加入但不出资，股份少但零风险' },
        { id: 'C', label: '拒绝创业', description: '家底不能动，稳定收入才是对家庭负责' },
        { id: 'D', label: '等年终奖再决定', description: '先多攒8万，再做决定，但创业窗口可能关闭' }
      ],
      outcome_hints: {
        A: '若成功则改变全家命运，若失败则家庭经济崩溃且婚姻危机',
        B: '参与创业但话语权弱，收益有限且仍有精力投入风险',
        C: '家庭稳定但可能永远错过创业窗口，心里一直惦记',
        D: '风险最低但很可能错过机会，同事不会等你'
      },
      personality_bias: {
        striver: { A: 75, B: 35, C: 10, D: 30 },
        guardian: { A: 5, B: 30, C: 85, D: 45 },
        speculator: { A: 85, B: 20, C: 5, D: 35 }
      }
    },
    {
      id: 'e017',
      title: '换房：改善还是将就',
      life_stage: 'family_building',
      age_range: [32, 38],
      theme: 'finance',
      trigger_conditions: { min_age: 32, max_age: 38, requires_status: [] },
      context: '孩子要上小学了，现在的两居室实在不够——老人来帮忙带孩子得打地铺，孩子写作业只能在餐桌上。同小区有一套三居室在卖，比你的房子大40平，总价多200万。你现在房子卖了能回300万，加上存款80万，凑够首付没问题，但月供从8千涨到1.5万，占你月收入的40%。配偶说教育区的那套学区房虽然更贵但孩子能上好学校，多出80万但月供到1.8万。中介说这套改善房很抢手，已经有三组客户在看，这周末不定就没了。你的房贷还剩15年，再贷30年意味着你要工作到60岁。',
      options: [
        { id: 'A', label: '买改善房', description: '换大三居，家人住得舒服，月供1.5万扛得起' },
        { id: 'B', label: '买学区房', description: '多出80万但孩子能上好学校，教育不能输在起跑线' },
        { id: 'C', label: '不换房了', description: '现在的房子够住，把钱留着投资和应急更实际' },
        { id: 'D', label: '租大房把现房出租', description: '以租养租换大空间，不增加房贷压力' }
      ],
      outcome_hints: {
        A: '居住改善但月供压力增大，抗风险能力下降',
        B: '教育资源最优但经济压力最大，任何意外都可能断供',
        C: '经济最安全但居住拥挤影响家庭幸福感，孩子学区一般',
        D: '灵活但租房不稳定，房东可能随时收回'
      },
      personality_bias: {
        striver: { A: 35, B: 75, C: 20, D: 30 },
        guardian: { A: 40, B: 35, C: 70, D: 25 },
        speculator: { A: 30, B: 25, C: 75, D: 40 }
      }
    },
    {
      id: 'e018',
      title: '50万闲钱怎么投',
      life_stage: 'family_building',
      age_range: [33, 39],
      theme: 'finance',
      trigger_conditions: { min_age: 33, max_age: 39, requires_status: [] },
      context: '年终奖加项目奖金到账50万，这是你人生中最大的一笔闲钱。你现在的房贷稳定、孩子教育基金按月在存、应急资金也够。这笔钱纯粹是多出来的，可以承受一定风险。同事小王去年all in了一只新能源基金，半年翻倍了，现在天天劝你上车。银行理财经理说年化4%的稳健产品刚出了一期，额度有限。你表哥在做一个餐饮加盟项目，说投20万能占15%股份，已经开了一家店月净利3万。配偶说存定期最安全，别听那些人忽悠。',
      options: [
        { id: 'A', label: 'all in新能源基金', description: '跟小王一样梭哈新能源，赌半年翻倍' },
        { id: 'B', label: '买银行理财', description: '年化4%虽少但保本，落袋为安' },
        { id: 'C', label: '投餐饮加盟', description: '20万占15%股份，有实体店可看可管' },
        { id: 'D', label: '分散配置', description: '理财30万+基金15万+应急5万，不把鸡蛋放一个篮子' }
      ],
      outcome_hints: {
        A: '可能翻倍也可能腰斩，完全取决于市场行情',
        B: '年化4%跑不赢通胀，但本金安全睡得着觉',
        C: '若店做起来则月月分红，若选址不好则血本无归',
        D: '风险分散但收益有限，每块都不够多'
      },
      personality_bias: {
        striver: { A: 35, B: 15, C: 55, D: 50 },
        guardian: { A: 10, B: 80, C: 25, D: 50 },
        speculator: { A: 80, B: 5, C: 45, D: 30 }
      }
    },
    {
      id: 'e019',
      title: '父母老了：接还是不接',
      life_stage: 'family_building',
      age_range: [35, 40],
      theme: 'family',
      trigger_conditions: { min_age: 35, max_age: 40, requires_status: [] },
      context: '父亲最近摔了一跤，虽然没有大碍但行动明显不便了。母亲自己也有关节炎，照顾父亲越来越吃力。老家在四线城市，医疗条件一般，最近一次看专科排了两周。你在一线城市有两居室，接父母来住只能睡客厅或打地铺。附近有一家养老社区，月费8千包含医疗护理，但父亲死也不去，说那是等死的地方。配偶说接来住可以，但家里本来就挤，老人来了摩擦会多，你妈跟她观念差太多。你哥说他在老家，每周去看一次，但不可能辞职照顾。父亲说不麻烦你们，他自己能行，但你看到他上楼梯的样子知道他不行了。',
      options: [
        { id: 'A', label: '接来同住', description: '挤一挤也要在一起，身边有人才放心' },
        { id: 'B', label: '送养老社区', description: '专业护理比在家强，8千换来安心' },
        { id: 'C', label: '老家雇护工', description: '每月4千请全职护工，不搬家但有人照顾' },
        { id: 'D', label: '换大房再接', description: '先改善住房条件，再接父母来，一两年内解决' }
      ],
      outcome_hints: {
        A: '父母安心但居住拥挤，婆媳/公媳矛盾风险高',
        B: '医疗有保障但父亲心理抗拒，可能影响寿命',
        C: '折中方案但无法实时监督，护工质量难保证',
        D: '最理想的长期方案但当下父亲等不起'
      },
      personality_bias: {
        striver: { A: 20, B: 35, C: 30, D: 75 },
        guardian: { A: 80, B: 20, C: 40, D: 35 },
        speculator: { A: 15, B: 75, C: 35, D: 40 }
      }
    },
    {
      id: 'e020',
      title: '老友的分岔路',
      life_stage: 'family_building',
      age_range: [33, 39],
      theme: 'relationship',
      trigger_conditions: { min_age: 33, max_age: 39, requires_status: [] },
      context: '你大学最铁的兄弟创业失败欠了80万，找到你借20万周转。他说三个月后还，拿他名下一辆车做抵押。你们从大一就住一个宿舍，他结婚你是伴郎，你结婚他是伴郎。但另一个共同好友私下告诉你，他已经向三四个人借了钱，而且上次借的还没还。你查了一下那辆车，市值大概15万。配偶坚决反对，说你们的存款是给孩子留的，他借了不还你们怎么办。你兄弟说如果连你都不帮他就真的走投无路了，语气里有一种你从没听过的绝望。你心里清楚，一旦借钱，要么失去钱要么失去友谊。',
      options: [
        { id: 'A', label: '借20万', description: '兄弟一场，他真走投无路了，不能见死不救' },
        { id: 'B', label: '借5万不图还', description: '帮一把但设上限，5万就当送他了' },
        { id: 'C', label: '不借但帮找工作', description: '钱不能借但可以帮他想办法，介绍资源' },
        { id: 'D', label: '拒绝并疏远', description: '他已经借了一圈了，这种人不值得继续深交' }
      ],
      outcome_hints: {
        A: '保住友谊但大概率钱收不回来，家庭经济受损',
        B: '情义和止损兼顾，但5万对他来说杯水车薪',
        C: '理性帮忙但对方可能觉得你不够意思',
        D: '止损最彻底但失去一段多年的友谊'
      },
      personality_bias: {
        striver: { A: 15, B: 30, C: 70, D: 40 },
        guardian: { A: 35, B: 80, C: 30, D: 20 },
        speculator: { A: 20, B: 25, C: 35, D: 80 }
      }
    },
    {
      id: 'e021',
      title: '中年裁员：45岁被优化',
      life_stage: 'mid_life',
      age_range: [42, 48],
      theme: 'career',
      trigger_conditions: { min_age: 42, max_age: 48, requires_status: [] },
      context: '公司组织架构调整，你所在的部门被合并，45岁的你拿着N+2的赔偿金走出了大门。赔偿到手35万，看上去不少，但你每月房贷1.2万、孩子高中补课费5千、父母医药费3千，固定支出2万起步。猎头说你的岗位在市场上需求锐减，同级别岗位薪资要砍40%，而且大部分公司更愿意要35岁以下的。你有个前下属在做短视频MCN，说缺个有经验的人来管内容，月薪8千加分成，做起来年入50万也不是不可能。你媳妇说别折腾了，找个安稳的先干着。赔偿金到账三周了，你每天早上还是习惯性六点醒来，然后盯着天花板发呆。',
      options: [
        { id: 'A', label: '降薪入职同行业', description: '薪资砍40%也先上岸，简历不能断，空窗期越长越难' },
        { id: 'B', label: '去MCN公司搏一把', description: '8千底薪加分成，赌新赛道，做起来收入不输以前' },
        { id: 'C', label: '用赔偿金开个店', description: '开家社区便利店或餐饮，自己做老板不受人管' },
        { id: 'D', label: '考个证转行', description: '花半年考注册会计师或心理咨询师，换赛道重来' }
      ],
      outcome_hints: {
        A: '恢复收入但薪资大幅下降，心理落差大且天花板更低',
        B: '新赛道有想象力但不确定性极高，半年无起色就难以为继',
        C: '自主可控但实体店风险大，35万可能半年烧完',
        D: '转型最彻底但半年无收入且考试通过率低'
      },
      personality_bias: {
        striver: { A: 20, B: 75, C: 30, D: 40 },
        guardian: { A: 80, B: 20, C: 25, D: 35 },
        speculator: { A: 15, B: 35, C: 80, D: 25 }
      }
    },
    {
      id: 'e022',
      title: '行业寒冬：船在下沉',
      life_stage: 'mid_life',
      age_range: [40, 48],
      theme: 'career',
      trigger_conditions: { min_age: 40, max_age: 48, requires_status: ['employed'] },
      context: '你在房地产行业做了二十年，从基层做到了区域总监。但行业下行已经是不争的事实：公司连续三个季度亏损，今年已经裁了两轮人，你虽然还没动但明显感到资源在收缩。猎头说现在转行还来得及，新能源和AI领域有管理岗需求，薪资持平但要从零学起。老同事拉你一起去做旧改项目，说政策红利还在，但需要你自带团队和客户资源跳过去，相当于裸辞创业。你妻子说别冲动，万一跳过去水更深呢？留在大公司好歹有N+1兜底。你在行业里的人脉值钱，但行业本身在贬值，每一天都在缩水。',
      options: [
        { id: 'A', label: '留守等赔偿', description: '大公司N+1至少30万，拿到手再找下家' },
        { id: 'B', label: '转行新能源', description: '从零学起但赛道向上，长期有前景' },
        { id: 'C', label: '跟老同事做旧改', description: '用行业人脉搏一把，政策红利还在窗口期' },
        { id: 'D', label: '降维去小公司', description: '去行业里的小公司做一把手，虽然矮子里拔将军但说了算' }
      ],
      outcome_hints: {
        A: '有赔偿兜底但行业继续恶化的话赔偿只是杯水车薪',
        B: '赛道正确但45岁从零开始竞争力弱，适应期漫长',
        C: '人脉变现但政策风险大，裸辞创业没有退路',
        D: '保住行业经验但小公司可能半年倒闭'
      },
      personality_bias: {
        striver: { A: 15, B: 80, C: 35, D: 30 },
        guardian: { A: 85, B: 20, C: 15, D: 40 },
        speculator: { A: 25, B: 30, C: 80, D: 35 }
      }
    },
    {
      id: 'e023',
      title: '父亲倒下了：谁来扛',
      life_stage: 'mid_life',
      age_range: [42, 50],
      theme: 'family',
      trigger_conditions: { min_age: 42, max_age: 50, requires_status: [] },
      context: '父亲突发脑梗住院，抢救后保住了命但半身瘫痪，医生说康复期至少半年，能否恢复行走看运气。住院费加康复费，保守估计30万。母亲70岁了根本照顾不了，请全职护工每月8千。你有个妹妹在外地，她说可以出10万但人过不来。你儿子正在读高中关键期，明年高考。妻子说家里不能没有你的收入，你辞职照顾的话全家喝西北风。父亲在病床上含着泪写字：别管我。母亲打电话来只哭不说话。单位的领导说你可以请两个月事假，但手头那个大项目得交出去，回来后位置不保证。',
      options: [
        { id: 'A', label: '辞职照顾', description: '父亲只有一个，工作可以再找，陪伴不能等' },
        { id: 'B', label: '请护工+远程管理', description: '花钱请专业护工，你周末去看，工作不能丢' },
        { id: 'C', label: '请事假两个月', description: '先扛两个月渡过急性期，后面再想办法' },
        { id: 'D', label: '送康复医院', description: '专业康复机构每月1.5万，治疗最系统但花费最高' }
      ],
      outcome_hints: {
        A: '父亲得到最好陪伴但你失去收入和职位，家庭经济压力大',
        B: '兼顾两头但护工质量参差不齐，父亲可能得不到足够关爱',
        C: '短期折中但两个月后仍面临同样困境，位置可能真没了',
        D: '康复效果最好但月费1.5万加住院费半年就要近20万'
      },
      personality_bias: {
        striver: { A: 10, B: 75, C: 40, D: 30 },
        guardian: { A: 80, B: 25, C: 40, D: 20 },
        speculator: { A: 15, B: 30, C: 35, D: 80 }
      }
    },
    {
      id: 'e024',
      title: '孩子的岔路：鸡还是放',
      life_stage: 'mid_life',
      age_range: [42, 48],
      theme: 'family',
      trigger_conditions: { min_age: 42, max_age: 48, requires_status: [] },
      context: '孩子高二，成绩中等偏上，冲刺一下有望上211，但压力很大。孩子说不想卷了，想走艺考路线学设计，说从小就喜欢画画。艺考培训加集训要花15万，而且录取率更低，毕业后的收入预期也远不如理工科。你查了一下，同水平的理工科毕业生起薪8千，设计类5千。你配偶说既然孩子有兴趣就支持，逼出来的孩子也不快乐。你爸在电话里说学什么画画，那是富人家孩子的事，咱家孩子得学能赚钱的。孩子说如果不同意艺考就不考了，直接去工作。离高考报名截止只剩两周。',
      options: [
        { id: 'A', label: '支持艺考', description: '尊重孩子的选择，15万买个可能性，兴趣是最好的老师' },
        { id: 'B', label: '逼着冲211', description: '现在吃苦以后享福，选能赚钱的路不会错' },
        { id: 'C', label: '折中：设计类工科', description: '报工业设计这种既能画画又能就业的专业' },
        { id: 'D', label: '让孩子自己决定', description: '把利弊分析清楚，选什么自己扛后果' }
      ],
      outcome_hints: {
        A: '孩子可能快乐但15万可能打水漂，毕业收入预期低',
        B: '就业面广但孩子可能逆反厌学，亲子关系受损',
        C: '两头兼顾但学校选择范围窄，可能两头都够不到',
        D: '尊重自主但18岁的孩子未必能做出理性判断'
      },
      personality_bias: {
        striver: { A: 15, B: 80, C: 35, D: 25 },
        guardian: { A: 25, B: 50, C: 75, D: 20 },
        speculator: { A: 75, B: 20, C: 30, D: 50 }
      }
    },
    {
      id: 'e025',
      title: '200万的家底怎么放',
      life_stage: 'mid_life',
      age_range: [43, 50],
      theme: 'finance',
      trigger_conditions: { min_age: 43, max_age: 50, requires_status: [] },
      context: '这些年攒下的积蓄加上卖掉老家一套房，你手头有200万可支配资金。房贷已还清，孩子大学费用另外备着。这200万纯粹是养老和应急的底子。银行理财经理说年化3.5%的大额存单额度有限先到先得，但利息在降，明年可能只有2.5%。做私募的朋友说有个稳健型基金年化8%-12%，他自己的钱也在里面。你配偶的闺蜜炒币赚了一套房，天天在朋友圈晒收益。你心里清楚：这个年纪一旦亏了200万，这辈子就再也攒不回来了。但同时200万放在3.5%的存单里，一年才7万，连通胀都跑不赢。',
      options: [
        { id: 'A', label: '大额存单锁息', description: '年化3.5%虽少但保本，200万每年7万利息' },
        { id: 'B', label: '配稳健型基金', description: '年化8%-12%有吸引力，朋友自己的钱也在里面' },
        { id: 'C', label: '买黄金避险', description: '乱世黄金，买实物金条放保险箱' },
        { id: 'D', label: '三分法配置', description: '存单100万+基金50万+黄金50万，进可攻退可守' }
      ],
      outcome_hints: {
        A: '最安全但收益最低，长期跑不赢通胀',
        B: '收益可观但私募基金流动性差，亏损风险真实存在',
        C: '避险属性强但不产生现金流，金价波动也不小',
        D: '风险分散但每块收益都有限，管理复杂度高'
      },
      personality_bias: {
        striver: { A: 15, B: 80, C: 20, D: 40 },
        guardian: { A: 85, B: 15, C: 30, D: 40 },
        speculator: { A: 10, B: 50, C: 75, D: 30 }
      }
    },
    {
      id: 'e026',
      title: '下半场：转型还是躺平',
      life_stage: 'mid_life',
      age_range: [44, 50],
      theme: 'self',
      trigger_conditions: { min_age: 44, max_age: 50, requires_status: [] },
      context: '你47岁，在公司做到总监级别，年薪60万但每天开会开到想吐。体检报告上红字越来越多，高血压、脂肪肝、颈椎病，医生说再这样下去五十岁前要出大事。一个做心理咨询师培训的朋友说这个方向正在爆发，考个证半年就能接个案，时薪500起步，而且自由。你心里有个声音说：干了二十年别人的人生，该干点自己的了。但另一个人说：60万年薪你舍得扔？房贷虽然还完了但孩子留学一年30万。妻子说你开心最重要，但眼神在说别作。你在深夜搜索了心理咨询师的考试要求，发现这周截止报名。',
      options: [
        { id: 'A', label: '裸辞转型心理咨询', description: '干点有意义的事，时薪500且自由，钱少但命重要' },
        { id: 'B', label: '在职考证先铺垫', description: '先考了证再说，不急着辞职，有退路更安心' },
        { id: 'C', label: '不转保持现状', description: '60万年薪不能丢，谁中年不难？扛着吧' },
        { id: 'D', label: '降薪换轻松岗位', description: '公司内部转个非核心岗位，薪资砍半但按时下班' }
      ],
      outcome_hints: {
        A: '精神自由但收入断崖，心理咨询前两年客源不稳',
        B: '最稳妥但白天上班晚上学习极累，可能半途而废',
        C: '收入稳定但身体和精神的消耗在加速，迟早要崩',
        D: '平衡了收入和健康但职业影响力归零，面子挂不住'
      },
      personality_bias: {
        striver: { A: 75, B: 35, C: 20, D: 30 },
        guardian: { A: 10, B: 75, C: 40, D: 45 },
        speculator: { A: 80, B: 25, C: 15, D: 30 }
      }
    },
    {
      id: 'e027',
      title: '55岁：退还是不退',
      life_stage: 'late_stable',
      age_range: [53, 58],
      theme: 'career',
      trigger_conditions: { min_age: 53, max_age: 58, requires_status: [] },
      context: '你在公司干到了副总级别，但明年的组织架构调整意味着你要么降薪去一个边缘部门，要么拿一笔赔偿主动离开。赔偿金加退休金一次性提取的话有120万，但每月就没有工资了，退休金要60岁才能领，中间这几年全靠积蓄。你查了一下，同行业顾问岗位月薪1.5万但得频繁出差。配偶说孩子已经独立了，咱花不了多少，你身体也不好了，该歇歇了。你妈说你爸当年干到60，男人没工作就废了。你心里也清楚，离开这个位置意味着十几年的行业影响力一夜归零，但留下来可能被架到一个让自己难堪的位置上。',
      options: [
        { id: 'A', label: '拿赔偿走人', description: '120万到手，提前退休享受生活，几年后领退休金' },
        { id: 'B', label: '接受降薪留守', description: '有收入有位置，虽然边缘但还在牌桌上' },
        { id: 'C', label: '转型做顾问', description: '用行业经验换自由，1.5万月薪加自己的时间' },
        { id: 'D', label: '自己开咨询公司', description: '用积累的人脉和资源单干，做得好比打工强' }
      ],
      outcome_hints: {
        A: '生活自由但收入归零，120万撑不了几年，社会身份骤变',
        B: '有收入但自尊心受挫，每天上班可能是煎熬',
        C: '灵活但有出差负担，顾问收入不稳定',
        D: '上限最高但创业风险在55岁格外大，失败则无法重来'
      },
      personality_bias: {
        striver: { A: 20, B: 30, C: 40, D: 75 },
        guardian: { A: 30, B: 80, C: 35, D: 15 },
        speculator: { A: 50, B: 10, C: 30, D: 80 }
      }
    },
    {
      id: 'e028',
      title: '孩子要买房：帮还是不帮',
      life_stage: 'late_stable',
      age_range: [52, 58],
      theme: 'family',
      trigger_conditions: { min_age: 52, max_age: 58, requires_status: [] },
      context: '孩子25岁，在一线城市找到了工作，月薪1.2万，想买个小户型安家。首付需要80万，孩子自己攒了10万，还差70万。你手头有120万存款，其中60万是养老储备，另外60万是应急和日常生活。孩子说不用全出，能帮30万就感激不尽，剩下的自己贷款慢慢还。配偶说帮30万可以，但养老的钱绝对不能动。你算了一笔账：如果出70万，存款只剩50万，往后看病旅游都紧巴巴。如果只出30万，孩子每月房贷1万2，月薪1.2万几乎全还贷，日子会非常苦。孩子说如果实在不行就不买了，继续租房，但你知道他看的那套房明天就截止了。',
      options: [
        { id: 'A', label: '出70万全帮', description: '自己苦点但孩子轻松，50万也够养老' },
        { id: 'B', label: '出30万保底线', description: '帮一把但不动养老钱，孩子自己扛大部分' },
        { id: 'C', label: '不帮让自立', description: '年轻人该自己奋斗，父母的钱要留着养老' },
        { id: 'D', label: '以借款形式出50万', description: '写借条50万，以后慢慢还，既有帮助又有约束' }
      ],
      outcome_hints: {
        A: '孩子压力最小但你养老储备缩水过半，万一有大病不够',
        B: '折中但孩子房贷压力大，每月几乎月光',
        C: '养老无忧但亲子关系可能受影响，孩子心里会记着',
        D: '两全但亲子间写借条尴尬，大概率不会真还'
      },
      personality_bias: {
        striver: { A: 35, B: 20, C: 80, D: 30 },
        guardian: { A: 75, B: 40, C: 15, D: 35 },
        speculator: { A: 30, B: 75, C: 35, D: 40 }
      }
    },
    {
      id: 'e029',
      title: '体检报告上的阴影',
      life_stage: 'late_stable',
      age_range: [50, 58],
      theme: 'health',
      trigger_conditions: { min_age: 50, max_age: 58, requires_status: [] },
      context: '年度体检发现肺部有一个8毫米的结节，医生说大概率良性但有5%的可能是早期肺癌，建议做穿刺活检确认。穿刺费用2万，有1%的并发症风险。如果确认是早期，手术费加治疗大约15万，治愈率90%以上。如果不管它，半年后复查，如果是恶性的可能错过最佳窗口。你现在没有任何症状，身体感觉完全正常。配偶吓哭了，说马上做穿刺。你弟说别自己吓自己，结节太常见了，他也有，好几年了没事。医生说决定在你，但要快，结节不会等你。你坐在医院走廊的塑料椅上，看着来来往往的人，第一次觉得生命是个倒计时。',
      options: [
        { id: 'A', label: '立刻做穿刺', description: '5%的风险也不能赌，早查早安心，2万不算什么' },
        { id: 'B', label: '三个月后复查', description: '大概率良性，观察一段时间再说，避免过度医疗' },
        { id: 'C', label: '直接做手术切除', description: '穿刺也有假阴性，不如一刀切了彻底放心' },
        { id: 'D', label: '去顶级医院复查', description: '换个更好的医院做增强CT，更精确的判断再决定' }
      ],
      outcome_hints: {
        A: '最快确认但穿刺有风险，若良性则白遭罪',
        B: '避免过度医疗但万一恶化，三个月可能就是早期和中期的区别',
        C: '最彻底但手术创伤大，良性也切了一部分肺',
        D: '更精准但费时费钱，顶级医院排队可能要一个月'
      },
      personality_bias: {
        striver: { A: 70, B: 20, C: 40, D: 30 },
        guardian: { A: 85, B: 15, C: 20, D: 40 },
        speculator: { A: 25, B: 75, C: 15, D: 50 }
      }
    },
    {
      id: 'e030',
      title: '最后的安排：钱往哪去',
      life_stage: 'late_stable',
      age_range: [55, 60],
      theme: 'self',
      trigger_conditions: { min_age: 55, max_age: 60, requires_status: [] },
      context: '你58岁，存款加房产折现大约300万。孩子已经独立，配偶身体尚可。去年一个同龄的朋友突然走了，没留遗嘱，家里为财产的事闹得很难看。这件事让你开始认真思考：如果有一天自己也走了，这些钱该怎么安排？律师说立遗嘱最清楚，费用5000元，但得把所有资产列清楚，配偶和孩子都要签字确认，过程可能伤感情。配偶说你想太远了，现在好好活着比什么都强。你妈说你的钱就是孩子的钱，不用搞那么复杂。律师说没有遗嘱的话按法定继承，但你有个不靠谱的弟弟，按法律他可能也能分到一些。你不想自己辛苦攒的钱最后变成家人吵架的导火索。',
      options: [
        { id: 'A', label: '正式立遗嘱', description: '花5000请律师立遗嘱，清清楚楚不留后患' },
        { id: 'B', label: '生前转移资产', description: '趁活着把房产过户给孩子，省事也省税' },
        { id: 'C', label: '买养老保险兜底', description: '拿150万买商业养老保险，每月固定领钱到死，剩余归零' },
        { id: 'D', label: '先不办顺其自然', description: '立遗嘱太晦气，以后再说，现在想这个干嘛' }
      ],
      outcome_hints: {
        A: '最规范但过程可能让家人不舒服，弟弟知道后被排除可能闹',
        B: '简单直接但一旦过户就失去控制权，万一孩子不孝就惨了',
        C: '养老无忧但失去灵活性，大笔资金被锁定',
        D: '回避问题但没有遗嘱的话法定继承可能不符合你的意愿'
      },
      personality_bias: {
        striver: { A: 80, B: 25, C: 15, D: 30 },
        guardian: { A: 50, B: 30, C: 75, D: 15 },
        speculator: { A: 35, B: 75, C: 20, D: 50 }
      }
    }
  ],

  // ===== 3种人格定义（来源：personalities.json 的 personalities 数组）=====
  personalities: [
    {
      id: 'striver',
      name: '进取者',
      one_line: '相信努力能改变命运，事业就是一切',
      core_values: ['事业成就', '金钱回报', '社会认可'],
      decision_heuristics: [
        '面对机会时，本能地问：这能不能让我更上一层？',
        '面对两难时，选那个对职业发展更有利的',
        '能推迟的事（恋爱、买房、休假）一律推迟',
        '别人都在休息的时候，正是我赶超的时候',
        '如果一个选择让我的简历更好看，我就很难拒绝'
      ],
      behavioral_tendencies: {
        risk_tolerance: '中等偏上——不是赌徒，但为了跃迁愿意冒有把握的险',
        time_horizon: '远视型——可以忍耐5-10年，只要终点足够高',
        social_orientation: '功利社交——人脉是资源，朋友要能互相成就'
      },
      speech_patterns: [
        "多用'必须'、'一定要'、'不能停'",
        "形容选择用'值不值'、'划不划算'而不是'想不想'",
        '提到休息时语气带愧疚或轻描淡写',
        '比较对象永远是做得更好的人，从不往下比'
      ],
      typical_regrets: '后悔的不是拼命，而是某个关键节点没抓住机会、犹豫了',
      typical_pride: '从无到有的攀升过程——职级、收入、影响力，这些数字的增长',
      acting_directives: [
        "绝对不要说'我要平衡工作和生活'——这个人不追求平衡",
        "不要在做出进取选择后加'但我知道也有风险'——这是破功",
        '面对家庭和事业冲突时，默认偏向事业，不要\'两者兼顾\'',
        "内心独白里不要出现理性分析，要出现的是'不甘心'、'凭什么'、'再来一年'"
      ],
      visceral_disgust: [
        "听到有人说'差不多就行了'——胃里翻酸水",
        '看到有能力但不上进的人在摸鱼——发自内心的瞧不起',
        "有人劝我'别太拼了，身体重要'——不是感动，是烦躁"
      ]
    },
    {
      id: 'guardian',
      name: '守护者',
      one_line: '家人安稳比什么都重要，日子不求好只求稳',
      core_values: ['家庭安定', '财务安全', '生活可预期'],
      decision_heuristics: [
        '面对机会时，本能地问：这有什么风险？最坏会怎样？',
        '面对两难时，选那个对家人伤害最小的',
        '不确定的事不做，宁可错过也不要出错',
        '存钱和买保险不是选择，是本能',
        '如果一件事让生活轨迹变得不可预测，就拒绝'
      ],
      behavioral_tendencies: {
        risk_tolerance: '极低——风险本身就是伤害，不需要后果多大也尽量回避',
        time_horizon: '中近程——操心的是下个月的房贷、孩子的学费',
        social_orientation: '亲密圈型——几个至亲好友就够，不追求人脉广'
      },
      speech_patterns: [
        "多用'稳妥'、'安全'、'万无一失'",
        "提到风险时语气加重、具体化——'万一呢？'",
        "形容选择用'对家里好不好'而不是'对我好不好'",
        "劝别人时爱说'稳当点没错'、'别折腾了'"
      ],
      typical_regrets: '后悔没能给家人更好的保障——某次该买保险没买，该存钱没存',
      typical_pride: '家里人都好好的、没出事——这是最大的成就',
      acting_directives: [
        "绝对不要说'也许该冒一次险'——这个人不会在决策时这么想",
        "拒绝机会后不要加'但我有点心动'——守护者拒绝时是真心踏实的",
        '面对家庭风险时，反应应该是焦虑而不是理性分析',
        "内心独白里出现的是'万一出事呢'、'不能拿家人的安稳赌'、'日子过得平平安安比什么都强'"
      ],
      visceral_disgust: [
        "听到有人把全部身家投进某个'风口'——不是羡慕，是替他心惊",
        '看到有人为了事业不顾家、孩子扔给老人带——本能地反感',
        "有人轻描淡写说'失败了就从头再来'——你从头再来，你家人呢？"
      ]
    },
    {
      id: 'speculator',
      name: '投机者',
      one_line: '人生就是一场牌局，不敢下注的人永远赢不了',
      core_values: ['金钱暴击', '翻身机会', '赢的快感'],
      decision_heuristics: [
        '面对机会时，本能地问：这能不能赚一大笔？',
        '面对两难时，选那个天花板最高的——输得起就赌',
        '看到别人赚钱比自己亏钱还难受',
        '打工是最慢的赔钱方式，必须找到杠杆',
        '错过机会的痛苦远大于亏钱的痛苦'
      ],
      behavioral_tendencies: {
        risk_tolerance: '极高——不是不怕输，是怕错过，输了可以再来',
        time_horizon: '短视跃迁型——要么一把翻身要么重来，不规划马拉松',
        social_orientation: '圈子型——混各种圈子找信息和机会，朋友是门路'
      },
      speech_patterns: [
        "多用'一把'、'梭哈'、'翻本'、'风口'",
        "形容选择用'赔率'、'天花板'而不是'风险'",
        "提到保守的人语气带轻蔑——'没胆'、'怂'",
        "输了会痛但很快切换——'下一把'是口头禅"
      ],
      typical_regrets: '不是后悔赌了，而是后悔没赌——某次犹豫错过了大机会',
      typical_pride: '某次所有人都说不行，但我干了，结果真赚到了',
      acting_directives: [
        "绝对不要说'我要分散风险'——这个人不分散，他集中火力",
        "做出高风险选择后不要加'我知道这很冒险'——他知道，不需要强调",
        '面对确定性高但收益低的选择时，内心是不屑而不是理性拒绝',
        "内心独白里出现的是'这波不冲等什么'、'别人都赚了就我没动'、'赔率够高就行'",
        '不要在道德困境中突然变正直——投机者在灰色地带不会犹豫太久'
      ],
      visceral_disgust: [
        "听到'知足常乐'——四个字能让他血压升高",
        '看到有人拿着死工资还嘲笑创业的人——笑什么？笑你一辈子买不起房？',
        "有人劝'稳稳当当也挺好'——好个屁，那是你没赢过"
      ]
    }
  ],

  // ===== 4个人生阶段（来源：life_stages.json 的 stages 数组）=====
  lifeStages: [
    {
      id: 'early_career',
      name: '立业期',
      age_range: [22, 30],
      description: '刚入社会到30岁前，主要面对职业选择、恋爱、初步财务积累',
      theme_weights: {
        career: 0.4,
        relationship: 0.2,
        finance: 0.2,
        family: 0.05,
        self: 0.1,
        health: 0.05
      },
      expected_event_count: 10
    },
    {
      id: 'family_building',
      name: '成家期',
      age_range: [30, 40],
      description: '30到40岁，家庭组建与职业深化的关键期，面对婚姻、生育、事业瓶颈多重压力',
      theme_weights: {
        career: 0.25,
        family: 0.3,
        finance: 0.2,
        relationship: 0.1,
        self: 0.05,
        health: 0.1
      },
      expected_event_count: 10
    },
    {
      id: 'mid_life',
      name: '中年期',
      age_range: [40, 50],
      description: '40到50岁，事业天花板、家庭责任加重、健康初现警讯，开始思考人生下半场',
      theme_weights: {
        career: 0.2,
        family: 0.25,
        finance: 0.2,
        health: 0.15,
        self: 0.1,
        relationship: 0.1
      },
      expected_event_count: 6
    },
    {
      id: 'late_stable',
      name: '稳定期',
      age_range: [50, 60],
      description: '50到60岁，退休规划、子女独立、健康管理与人生总结，进入收尾与传承阶段',
      theme_weights: {
        health: 0.25,
        family: 0.2,
        finance: 0.2,
        self: 0.15,
        career: 0.1,
        relationship: 0.1
      },
      expected_event_count: 4
    }
  ],

  // ===== 30事件×4选项的属性影响（来源：option_impacts.json 的 impacts 对象）=====
  // 注：原文件 e029 有重复且首条损坏，此处使用完整的第二条数据
  optionImpacts: {
    e001: {
      A: { wealth: 12, happiness: 5, health: -8, career: 15 },
      B: { wealth: 3, happiness: 8, health: 5, career: 2 },
      C: { wealth: 5, happiness: 0, health: -3, career: 8 },
      D: { wealth: 8, happiness: 10, health: -10, career: 12 }
    },
    e002: {
      A: { wealth: 15, happiness: 5, health: -3, career: 12 },
      B: { wealth: 3, happiness: 6, health: 2, career: 5 },
      C: { wealth: 8, happiness: 3, health: -2, career: 8 },
      D: { wealth: -5, happiness: 12, health: 3, career: -8 }
    },
    e003: {
      A: { wealth: -3, happiness: -5, health: 2, career: -5 },
      B: { wealth: -8, happiness: -3, health: -2, career: 10 },
      C: { wealth: -15, happiness: 10, health: -5, career: -10 },
      D: { wealth: -10, happiness: 5, health: 8, career: -8 }
    },
    e004: {
      A: { wealth: -5, happiness: 8, health: 2, career: -12 },
      B: { wealth: 5, happiness: -10, health: -2, career: 10 },
      C: { wealth: -3, happiness: -5, health: -5, career: -3 },
      D: { wealth: 3, happiness: -12, health: 2, career: 8 }
    },
    e005: {
      A: { wealth: -18, happiness: 10, health: -3, career: -5 },
      B: { wealth: 5, happiness: 3, health: 2, career: 5 },
      C: { wealth: 5, happiness: -15, health: -2, career: 10 },
      D: { wealth: 8, happiness: -12, health: 0, career: 3 }
    },
    e006: {
      A: { wealth: 5, happiness: 8, health: 2, career: -5 },
      B: { wealth: 3, happiness: -2, health: -1, career: 8 },
      C: { wealth: 8, happiness: 5, health: 1, career: 0 },
      D: { wealth: -3, happiness: 0, health: 0, career: 0 }
    },
    e007: {
      A: { wealth: -10, happiness: 8, health: -3, career: -8 },
      B: { wealth: -5, happiness: 3, health: -5, career: -3 },
      C: { wealth: 3, happiness: 2, health: 2, career: 8 },
      D: { wealth: 3, happiness: 5, health: -5, career: 5 }
    },
    e008: {
      A: { wealth: -12, happiness: -3, health: -2, career: 15 },
      B: { wealth: 2, happiness: -2, health: -8, career: 5 },
      C: { wealth: -8, happiness: -5, health: -5, career: 8 },
      D: { wealth: 5, happiness: 3, health: -2, career: 3 }
    },
    e009: {
      A: { wealth: 8, happiness: 3, health: 2, career: 12 },
      B: { wealth: -5, happiness: 8, health: -2, career: 10 },
      C: { wealth: -5, happiness: -5, health: -10, career: 8 },
      D: { wealth: 3, happiness: 0, health: 3, career: -5 }
    },
    e010: {
      A: { wealth: -15, happiness: 3, health: 5, career: -8 },
      B: { wealth: -8, happiness: -3, health: 2, career: -2 },
      C: { wealth: -3, happiness: -8, health: 3, career: -2 },
      D: { wealth: -18, happiness: 5, health: 8, career: -10 }
    },
    e011: {
      A: { wealth: -15, happiness: 10, health: 2, career: -10 },
      B: { wealth: 5, happiness: -8, health: -2, career: 10 },
      C: { wealth: -10, happiness: -3, health: -3, career: -5 },
      D: { wealth: 10, happiness: 5, health: 3, career: 8 }
    },
    e012: {
      A: { wealth: 2, happiness: -15, health: -8, career: 2 },
      B: { wealth: -3, happiness: -8, health: -5, career: 0 },
      C: { wealth: -8, happiness: 3, health: 2, career: 3 },
      D: { wealth: 3, happiness: -10, health: -5, career: 5 }
    },
    e013: {
      A: { wealth: -15, happiness: 5, health: -5, career: -8 },
      B: { wealth: 5, happiness: -15, health: 2, career: 3 },
      C: { wealth: -8, happiness: -3, health: -3, career: 5 },
      D: { wealth: -10, happiness: 0, health: -8, career: -3 }
    },
    e014: {
      A: { wealth: 12, happiness: 3, health: -3, career: 15 },
      B: { wealth: 10, happiness: 5, health: 2, career: 8 },
      C: { wealth: 2, happiness: 8, health: 3, career: -5 },
      D: { wealth: 5, happiness: 5, health: 0, career: 3 }
    },
    e015: {
      A: { wealth: 10, happiness: -5, health: -8, career: 8 },
      B: { wealth: 5, happiness: -3, health: -5, career: 12 },
      C: { wealth: 2, happiness: 8, health: 5, career: -8 },
      D: { wealth: 8, happiness: 3, health: -2, career: 5 }
    },
    e016: {
      A: { wealth: -12, happiness: 8, health: -3, career: 15 },
      B: { wealth: -5, happiness: 3, health: -2, career: 8 },
      C: { wealth: 3, happiness: -5, health: 2, career: 2 },
      D: { wealth: -8, happiness: 5, health: -3, career: 10 }
    },
    e017: {
      A: { wealth: -8, happiness: 8, health: 2, career: 0 },
      B: { wealth: -12, happiness: 5, health: -3, career: 3 },
      C: { wealth: 5, happiness: -3, health: 2, career: 0 },
      D: { wealth: 8, happiness: -3, health: 1, career: 0 }
    },
    e018: {
      A: { wealth: -10, happiness: 10, health: -2, career: 0 },
      B: { wealth: 2, happiness: 5, health: 2, career: 0 },
      C: { wealth: 5, happiness: 5, health: 1, career: 3 },
      D: { wealth: 3, happiness: 3, health: 2, career: 1 }
    },
    e019: {
      A: { wealth: -3, happiness: -5, health: 2, career: -3 },
      B: { wealth: -8, happiness: 5, health: 3, career: 2 },
      C: { wealth: -3, happiness: -3, health: -2, career: -3 },
      D: { wealth: -8, happiness: -3, health: -2, career: 2 }
    },
    e020: {
      A: { wealth: -15, happiness: -5, health: -3, career: -3 },
      B: { wealth: -5, happiness: -2, health: -1, career: 0 },
      C: { wealth: 3, happiness: -3, health: 0, career: 5 },
      D: { wealth: 5, happiness: -10, health: 1, career: 2 }
    },
    e021: {
      A: { wealth: -5, happiness: -10, health: 2, career: -8 },
      B: { wealth: -8, happiness: 8, health: -2, career: 10 },
      C: { wealth: -15, happiness: 10, health: -3, career: -5 },
      D: { wealth: -3, happiness: -8, health: -5, career: -10 }
    },
    e022: {
      A: { wealth: 5, happiness: -3, health: 2, career: -5 },
      B: { wealth: -3, happiness: 3, health: -2, career: 8 },
      C: { wealth: -10, happiness: 5, health: -3, career: 10 },
      D: { wealth: -5, happiness: -5, health: 0, career: -8 }
    },
    e023: {
      A: { wealth: -18, happiness: -3, health: 5, career: -15 },
      B: { wealth: -8, happiness: -8, health: -3, career: 3 },
      C: { wealth: -3, happiness: -12, health: -8, career: 0 },
      D: { wealth: -12, happiness: 3, health: 5, career: 2 }
    },
    e024: {
      A: { wealth: -10, happiness: 10, health: 0, career: -5 },
      B: { wealth: 5, happiness: -12, health: -2, career: 8 },
      C: { wealth: 2, happiness: 3, health: 0, career: 3 },
      D: { wealth: -3, happiness: 5, health: -2, career: 0 }
    },
    e025: {
      A: { wealth: 2, happiness: 5, health: 2, career: 0 },
      B: { wealth: 8, happiness: 3, health: 0, career: 0 },
      C: { wealth: 5, happiness: 5, health: 0, career: 0 },
      D: { wealth: 0, happiness: 3, health: 1, career: 0 }
    },
    e026: {
      A: { wealth: -12, happiness: 15, health: 10, career: -8 },
      B: { wealth: 3, happiness: -5, health: -8, career: 2 },
      C: { wealth: -8, happiness: 8, health: 5, career: -5 },
      D: { wealth: 5, happiness: -8, health: -10, career: 3 }
    },
    e027: {
      A: { wealth: -5, happiness: -8, health: -3, career: 5 },
      B: { wealth: 2, happiness: -10, health: 2, career: -5 },
      C: { wealth: 0, happiness: -3, health: 3, career: -8 },
      D: { wealth: -10, happiness: 12, health: -3, career: 10 }
    },
    e028: {
      A: { wealth: -15, happiness: 8, health: -2, career: 0 },
      B: { wealth: -5, happiness: 2, health: 0, career: 0 },
      C: { wealth: 5, happiness: -8, health: 2, career: 0 },
      D: { wealth: 0, happiness: -3, health: 0, career: 0 }
    },
    e029: {
      A: { wealth: -3, happiness: 5, health: 8, career: -2 },
      B: { wealth: 2, happiness: -3, health: -8, career: 0 },
      C: { wealth: -8, happiness: 3, health: 5, career: -3 },
      D: { wealth: -5, happiness: 2, health: 3, career: -1 }
    },
    e030: {
      A: { wealth: -1, happiness: 5, health: 2, career: 0 },
      B: { wealth: -5, happiness: 3, health: 0, career: 0 },
      C: { wealth: 5, happiness: 8, health: 2, career: 0 },
      D: { wealth: 3, happiness: 5, health: 1, career: 0 }
    }
  },

  // ===== 30事件×4选项的洞察句（来源：insights.json 的 insights 对象）=====
  // 注：原文件 e010→e011、e020→e021 之间缺少逗号，此处已修复
  insights: {
    e001: {
      A: '你选了往上冲。这一步不叫叛逆，叫不甘心。',
      B: '你选了稳。父母的账本上，稳字千金重。',
      C: '你选了机会。你要的从来不是这份工资，是那个跳板。',
      D: '你选了跳板中的跳板。你相信真正的机会还没出现。'
    },
    e002: {
      A: '你选了跃迁。你受不了自己再多等一年。',
      B: '你选了确定性。看得见的升职比看不见的期权可靠。',
      C: '你想两头都占。有人叫这聪明，有人叫这贪心。',
      D: '你选了辞职做自己。打工的天花板是你不能忍的。'
    },
    e003: {
      A: '你选了先活着。空窗期比降薪更让你恐惧。',
      B: '你选了转赛道。你知道再回原地也是慢性死亡。',
      C: '你选了梭哈创业。赔偿金在你手里是子弹，不是安全垫。',
      D: '你选了先停下来。你需要的不是找工作，是喘口气。'
    },
    e004: {
      A: '你选了跟她走。你相信爱情比事业更禁得起从零开始。',
      B: '你选了留下。事业是你唯一能牢牢抓住的东西。',
      C: '你选了异地熬。你以为时间能解决一切，其实时间只会稀释。',
      D: '你选了分手。你比大多数人早明白：不合适就是不合适。'
    },
    e005: {
      A: '你选了借钱把婚结了。人比钱重要，这是你从小听大的。',
      B: '你选了先领证。仪式感在你心里，不在别人的红包里。',
      C: '你选了让她等一年。你以为她真的能等，其实她在数着日子。',
      D: '你选了先分手看看。你比自己以为的更害怕承诺。'
    },
    e006: {
      A: '你选了老家的房。你需要一个能回去的地方，哪怕你不打算回去。',
      B: '你选了继续攒。你还没准备好放弃一线的梦。',
      C: '你选了让钱生钱。你相信自己能跑赢通胀。',
      D: '你选了什么都不动。你在等一个更清晰的信号。'
    },
    e007: {
      A: '你选了梭哈副业。你受不了看着别人赚钱自己不动。',
      B: '你选了主副兼顾。你以为自己能兼顾，其实两边都在打折。',
      C: '你选了专注主业。升职的确定性对你比副业的想象更可靠。',
      D: '你选了零成本参与。你要的是机会，不是风险。'
    },
    e008: {
      A: '你选了脱产读研。你觉得学历这道天花板必须打破。',
      B: '你选了在职读研。你不敢断了收入，也不甘心不进步。',
      C: '你选了不读。你相信经验比文凭更值钱。',
      D: '你选了考证。你要最快能变现的东西。'
    },
    e009: {
      A: '你选了 MBA。你要的是管理层的门票，不是知识本身。',
      B: '你选了 AI 训练营。你相信技术曲线比管理阶梯更陡。',
      C: '你选了两个都报。你不想在任何路径上落后。',
      D: '你选了都不选。你相信经验会替你证明一切。'
    },
    e010: {
      A: '你选了全出。妈妈的病比你的首付重要。',
      B: '你选了折中。你想尽孝，也想留住自己的未来。',
      C: '你选了按份分摊。你在保护自己，虽然这让你有点内疚。',
      D: '你选了主动担大头。你已经默认自己是家里的顶梁柱。'
    },
    e011: {
      A: '你选了现在生。你不想让她背上\'我们本可以\'的遗憾。',
      B: '你选了再等等。你告诉自己是理性，但也许是害怕。',
      C: '你选了不要。你比大多数人更清楚养育的真实成本。',
      D: '你选了外包育儿。你想同时保住事业和家庭，但两边都要付代价。'
    },
    e012: {
      A: '你选了忍。你把孩子放在前面，把自己咽了下去。',
      B: '你选了修复。你相信有些婚姻值得再赌一次。',
      C: '你选了离。你觉得凑合是对自己最深的辜负。',
      D: '你选了各过各的。这不是解决，是延迟。'
    },
    e013: {
      A: '你选了留下这个孩子。你相信办法总比困难多。',
      B: '你选了不要。你在保护你已经拥有的东西。',
      C: '你选了立规矩再生。你需要感觉自己是可控的。',
      D: '你选了赌一把。有些决定你没法真的想清楚，只能先做。'
    },
    e014: {
      A: '你选了升管理。你要的是能俯视一群人的位置。',
      B: '你选了跳槽保技术。你比很多人早明白：技术在手才是真自由。',
      C: '你选了留下陪家人。你已经开始厌倦拼这个字。',
      D: '你选了两边都试。你不想为任何一个选择关上门。'
    },
    e015: {
      A: '你选了大厂 996。你把身体折旧写进了投资回报率。',
      B: '你选了创业公司的 VP。这可能是你最后一次赌大的机会。',
      C: '你选了留下守稳。孩子的一句话比涨薪 40% 更沉。',
      D: '你选了骑驴找马。你在给自己留一个体面的退路。'
    },
    e016: {
      A: '你选了创业。你受不了继续替别人圆梦。',
      B: '你选了观察一年。你想再攒一点勇气，但勇气从来不是攒出来的。',
      C: '你选了拒绝。你比自己以为的更看重家庭的稳定。',
      D: '你选了小额入股。你要参与感，但不要重仓风险。'
    },
    e017: {
      A: '你选了改善房。你要的是当下过得舒服，不是未来的溢价。',
      B: '你选了学区房。你把自己没得到的东西压在了孩子身上。',
      C: '你选了不换。你相信钱在手里比在墙里灵活。',
      D: '你选了曲线上车。你在等一个所有人都还没看到的机会。'
    },
    e018: {
      A: '你选了 all in 新能源。你相信风口比稳健更值得追。',
      B: '你选了银行理财。你要的是睡得着觉，不是跑赢别人。',
      C: '你选了投朋友的店。你相信看得见摸得着的生意。',
      D: '你选了分散配置。你在保护自己，也在保护自己不后悔。'
    },
    e019: {
      A: '你选了接来同住。你需要爸妈在身边你才踏实。',
      B: '你选了养老社区。你相信专业的照顾比亲情的陪伴更靠谱。',
      C: '你选了老家雇护工。你在两难中选了折中，也选了内疚。',
      D: '你选了先换房再接。你在做长远打算，也在推迟决定。'
    },
    e020: {
      A: '你选了借他 20 万。有些兄弟情分你没法用理性算。',
      B: '你选了借 5 万当送。你在划一条线：能帮但不到伤自己。',
      C: '你选了帮他找路。钱不给，力可以出，这是你的方式。',
      D: '你选了拒绝。你比自己以为的更清醒：救不了的人别拉自己下水。'
    },
    e021: {
      A: '你选了降薪上岸。你在自尊和现金流之间选了后者。',
      B: '你选了转 MCN。45 岁的你还愿意搏一次，这本身就是答案。',
      C: '你选了开店。你不想再看任何人脸色。',
      D: '你选了考证转行。你在给自己争取时间，也在延迟真正的决定。'
    },
    e022: {
      A: '你选了等赔偿。你相信兜底比机会更值得等。',
      B: '你选了转新能源。你不甘心被行业一起拖下去。',
      C: '你选了带资源单干。人脉在你手里正在贬值，你要趁早变现。',
      D: '你选了裸辞旅行。你比想象中更累，也更清醒。'
    },
    e023: {
      A: '你选了辞职照顾。父亲的一辈子比你的两年重要。',
      B: '你选了请护工。你在用钱买一个可以继续赚钱的自己。',
      C: '你选了兄妹轮值。你在分担，也在稀释愧疚。',
      D: '你选了送康复医院。你相信专业，也在保护自己不崩溃。'
    },
    e024: {
      A: '你选了支持艺考。你愿意为孩子的天赋赌一次。',
      B: '你选了逼他冲 211。你替他做了他现在做不了的判断。',
      C: '你选了工业设计。你想给他兴趣，也想给他饭碗。',
      D: '你选了让他自己决定。你相信有些路只能他自己走。'
    },
    e025: {
      A: '你选了大额存单。这个年纪，本金不能亏。',
      B: '你选了稳健基金。你要收益，也要睡得着觉。',
      C: '你选了实物黄金。你在为不确定的世界买保险。',
      D: '你选了分散配置。你没有全信任何一种活法。'
    },
    e026: {
      A: '你选了裸辞转型。60 万年薪换来的红字体检报告让你醒了。',
      B: '你选了在职过渡。你还是没舍得放下那份安全绳。',
      C: '你选了拒绝转型。你相信熬过去就是胜利。',
      D: '你选了半退休。你终于允许自己慢下来。'
    },
    e027: {
      A: '你选了主动降职。你把自尊咽下去，换来了继续。',
      B: '你选了拿赔偿走。你要一个体面的告别。',
      C: '你选了做顾问。你想继续被需要，但不想被绑定。',
      D: '你选了开咨询公司。55 岁你决定再赌一次自己。'
    },
    e028: {
      A: '你选了全出 70 万。孩子的月光你比他自己还心疼。',
      B: '你选了出 30 万。你在帮，也在给他留一点必须自己扛的部分。',
      C: '你选了不帮。你相信年轻人吃苦是必修课。',
      D: '你选了借不给。你想帮，也想让他记住这不是白拿的。'
    },
    e029: {
      A: '你选了立刻穿刺。你不想拿 5% 的概率赌全家。',
      B: '你选了三个月复查。你在赌 95%，也在赌自己的判断力。',
      C: '你选了直接手术。你要一劳永逸的答案。',
      D: '你选了顶级医院复查。你相信更多信息能让你更安心。'
    },
    e030: {
      A: '你选了立遗嘱。你要掌控到最后一刻。',
      B: '你选了生前过户。你相信孩子，也在测试自己的信任。',
      C: '你选了商业养老保险。你要每月固定进账的安全感。',
      D: '你选了不做安排。你相信船到桥头自然直，或者你只是不想面对。'
    }
  },

  // ===== 6个关键节点（来源：key_events.json 的 key_events 数组）=====
  keyEvents: [
    { id: 'e001', stage: 'early_career', reason: '人生第一次择业分歧' },
    { id: 'e004', stage: 'early_career', reason: '爱情与事业的首次冲突' },
    { id: 'e011', stage: 'family_building', reason: '生育决策的分水岭' },
    { id: 'e015', stage: 'family_building', reason: '职业跃迁与家庭陪伴的抉择' },
    { id: 'e023', stage: 'mid_life', reason: '父亲重病，责任与现实的冲突' },
    { id: 'e027', stage: 'late_stable', reason: '55岁降职，认命 vs 再搏一次' }
  ],

  // ===== 人生画像生成规则（来源：portrait_rules.json）=====
  // 注：原文件 labels 数组与 insight_rules 之间缺少逗号，此处已修复
  portraitRules: {
    labels: [
      {
        id: 'pure_striver',
        title: '不甘的攀登者',
        condition: { striver_min: 7 },
        core_line: '你的一生，是"再往上一层"的一生。',
        slogan: '你不是不知道停下来会更幸福，\n你只是不甘心。\n这不是贪婪，是一种\n不敢让自己失望的深情。'
      },
      {
        id: 'pure_guardian',
        title: '沉默的守护者',
        condition: { guardian_min: 7 },
        core_line: '你的一生，是"稳稳当当把日子过好"的一生。',
        slogan: '你从没觉得自己在牺牲，\n但每次面对"我 vs 家人"，\n你都下意识选了后者。\n这不是懦弱，是沉默的深情。'
      },
      {
        id: 'pure_speculator',
        title: '追风的赌徒',
        condition: { speculator_min: 7 },
        core_line: '你的一生，是"下一把才是那把"的一生。',
        slogan: '你不是不怕输，\n你是更怕错过。\n每一次别人说你在赌，\n你心里想的都是：\n他们看不懂真正的机会。'
      },
      {
        id: 'striver_guardian',
        title: '温柔的野心家',
        condition: { striver_min: 4, guardian_min: 4 },
        core_line: '你的一生，是"想赢，也想留住"的一生。',
        slogan: '你既想往上冲，又怕失去手里的。\n于是每一次决定都很累，\n但每一次你都没让自己彻底后悔。\n这种平衡，比任何极端都难。'
      },
      {
        id: 'striver_speculator',
        title: '清醒的搏杀者',
        condition: { striver_min: 4, speculator_min: 4 },
        core_line: '你的一生，是"努力也要选对方向"的一生。',
        slogan: '你既相信努力，也相信杠杆。\n你不是纯粹的赌徒，\n也不是老实的攀登者。\n你在两者之间，找到了自己的节奏。'
      },
      {
        id: 'guardian_speculator',
        title: '矛盾的守局人',
        condition: { guardian_min: 4, speculator_min: 4 },
        core_line: '你的一生，是"想搏，又不敢真搏"的一生。',
        slogan: '你身上有两个人在打架：\n一个想稳，一个想赌。\n最后的你，\n可能既没守住最想守的，\n也没赌成最想赌的。\n但这不是失败，这是真实。'
      },
      {
        id: 'balanced_all',
        title: '复杂的现实主义者',
        condition: { striver_min: 3, guardian_min: 3, speculator_min: 3 },
        core_line: '你的一生，是"看情况"的一生。',
        slogan: '你没有主义，只有情境。\n有人叫这没原则，\n你知道这叫成熟。\n你不追求一以贯之的自己，\n你只想在每个当下做对的事。'
      },
      {
        id: 'guardian_lean',
        title: '谨慎的观察者',
        condition: { guardian_min: 5 },
        core_line: '你的一生，是"想清楚再动"的一生。',
        slogan: '你不是不敢，是不肯轻易动。\n你相信时间会替你筛选出真正值得的东西。\n慢一点没关系，\n你活到最后不是最亮的，\n但一定是没有大遗憾的那一个。'
      },
      {
        id: 'striver_lean',
        title: '隐忍的登山者',
        condition: { striver_min: 5 },
        core_line: '你的一生，是"再坚持一下"的一生。',
        slogan: '你不是最狠的那一个，\n但你是最不肯下山的那一个。\n别人说你太累了，\n你只是笑笑——\n他们不知道你为什么爬。'
      },
      {
        id: 'speculator_lean',
        title: '试探的冒险家',
        condition: { speculator_min: 5 },
        core_line: '你的一生，是"总在换赛道"的一生。',
        slogan: '你不是没有耐心，\n你只是相信：\n真正的机会不会等你准备好。\n你可能错过一些稳当，\n但你从没错过自己心动的那些瞬间。'
      }
    ],

    insight_rules: [
      {
        id: 'money_conservative',
        theme: '金钱',
        priority: 1,
        condition: {
          events: ['e006', 'e007', 'e018', 'e025'],
          match_personality: 'guardian',
          min_matches: 3
        },
        template: '关于金钱：你在 {n} 次财务选择中偏向保守。\n你不追求暴富，但害怕失去。'
      },
      {
        id: 'money_aggressive',
        theme: '金钱',
        priority: 1,
        condition: {
          events: ['e006', 'e007', 'e018', 'e025'],
          match_personality: 'speculator',
          min_matches: 3
        },
        template: '关于金钱：你在 {n} 次财务选择中选了搏一把。\n你比大多数人更愿意为可能性付代价。'
      },
      {
        id: 'money_balanced',
        theme: '金钱',
        priority: 1,
        condition: {
          events: ['e006', 'e007', 'e018', 'e025'],
          match_personality: 'striver',
          min_matches: 3
        },
        template: '关于金钱：你在 {n} 次财务选择中追求可控的增长。\n你不梭哈，也不认命。'
      },
      {
        id: 'family_sacrifice',
        theme: '家庭',
        priority: 2,
        condition: {
          events: ['e010', 'e019', 'e020', 'e023', 'e028'],
          match_personality: 'guardian',
          min_matches: 3
        },
        template: '关于家庭：你在 {n} 次家庭议题中把家人放在自己前面。\n你可能从没觉得这是牺牲。'
      },
      {
        id: 'family_boundary',
        theme: '家庭',
        priority: 2,
        condition: {
          events: ['e010', 'e019', 'e020', 'e023', 'e028'],
          match_personality: 'speculator',
          min_matches: 3
        },
        template: '关于家庭：你在 {n} 次家庭议题中划了自己的边界。\n有人会说你冷血，你知道那叫清醒。'
      },
      {
        id: 'family_pragmatic',
        theme: '家庭',
        priority: 2,
        condition: {
          events: ['e010', 'e019', 'e020', 'e023', 'e028'],
          match_personality: 'striver',
          min_matches: 3
        },
        template: '关于家庭：你在 {n} 次家庭议题中选了兼顾。\n你既没放弃家人，也没放弃自己。这比走极端难得多。'
      },
      {
        id: 'career_ambitious',
        theme: '事业',
        priority: 3,
        condition: {
          events: ['e001', 'e002', 'e008', 'e009', 'e014', 'e015', 'e026', 'e027'],
          match_personality: 'striver',
          min_matches: 5
        },
        template: "关于事业：你在 {n} 次职业选择中都选了往上冲。\n你追求的从来不是钱，是那种'再上一层'的感觉。"
      },
      {
        id: 'career_stable',
        theme: '事业',
        priority: 3,
        condition: {
          events: ['e001', 'e002', 'e008', 'e009', 'e014', 'e015', 'e026', 'e027'],
          match_personality: 'guardian',
          min_matches: 5
        },
        template: '关于事业：你在 {n} 次职业选择中都选了稳。\n你不是没有野心，你只是不愿意用今天的确定去换明天的可能。'
      },
      {
        id: 'career_gambler',
        theme: '事业',
        priority: 3,
        condition: {
          events: ['e001', 'e002', 'e008', 'e009', 'e014', 'e015', 'e026', 'e027'],
          match_personality: 'speculator',
          min_matches: 5
        },
        template: '关于事业：你在 {n} 次职业选择中都在找杠杆。\n你相信打工是最慢的赚钱方式。'
      },
      {
        id: 'love_over_career',
        theme: '感情',
        priority: 4,
        condition: {
          events: ['e004', 'e005', 'e012'],
          match_personality: 'guardian',
          min_matches: 2
        },
        template: '关于感情：你在 {n} 次抉择中都选了那个人。\n你相信有些东西一旦失去就再也回不来了。'
      },
      {
        id: 'career_over_love',
        theme: '感情',
        priority: 4,
        condition: {
          events: ['e004', 'e005', 'e012'],
          match_personality: 'striver',
          min_matches: 2
        },
        template: '关于感情：你在 {n} 次抉择中都选了自己的路。\n不是不爱，是你比大多数人早知道：靠不住的感情比孤单更累。'
      },
      {
        id: 'one_rebellion',
        theme: '特殊',
        priority: 5,
        condition: {
          type: 'one_off_speculator',
          description: '整体保守但有 1 次选了 speculator 的选项'
        },
        template: '有一次你选了冒险 —— 那是 {age} 岁的{event_name}。\n那可能是你一生中最压抑的欲望。'
      },
      {
        id: 'one_retreat',
        theme: '特殊',
        priority: 5,
        condition: {
          type: 'one_off_guardian',
          description: '整体激进但有 1 次选了 guardian 的选项'
        },
        template: '有一次你选了退一步 —— 那是 {age} 岁的{event_name}。\n那一刻你不是变怂了，你是终于允许自己休息一下。'
      },
      {
        id: 'default_balanced',
        theme: '综合',
        priority: 99,
        condition: {
          type: 'fallback',
          description: '以上都不匹配时的兜底'
        },
        template: '你不是一种人，你是很多种人。\n每个决定都在因人因时因势变化。\n这不是没有立场，是最真实的活法。'
      }
    ]
  }
};
