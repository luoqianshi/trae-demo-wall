(function () {
  const data = window.MiniFishData = window.MiniFishData || {};
  const matPlatforms = [
    { name:'全部', color:'#888' },
    { name:'抖音', color:'#737373' },
    { name:'小红书', color:'#FF2442' },
    { name:'B站', color:'#FB7299' }
  ];
  data.intelligence = {
    matPlatforms,
    intelligenceTabs: ['实时热点', '上升榜', '总榜', '素材库'],
    intelligenceTab: '实时热点',
    intelligencePlatform: '全部',
    intelligenceSort: 'opportunity',
    matPlatform: '全部',
    topicDraft: '',
    topicEvaluation: {
      opportunityScore: 0,
      burstPotential: 0,
      competitionLevel: '待评估',
      angle: ''
    },
    candidatePool: [],
    trendItems: [
      {
        id:'t-ai-tool', platform:'抖音', listType:'hot', title:'AI工具深度测评·效率翻倍指南',
        tags:['AI','效率','测评'], heat:'98.7w', heatScore:98, growthRate:342,
        category:'科技', source:'抖音热榜', riskLevel:'low',
        lifecycle:'成长期', competition:'中', competitionScore:55,
        whyHot:'AI工具迭代加速，用户焦虑被替代→迫切需要效率提升方案；"免费替代付费"类内容收藏率比纯测评高3倍',
        bestPlatforms:[{name:'抖音',fit:95},{name:'B站',fit:82},{name:'小红书',fit:68}],
        commonAngles:['免费替代付费工具','真实工作流对比','工具组合使用套路','避坑红黑榜'],
        materialReady:85, materialNote:'教程素材和屏幕录制模板充足，封面模板已有验证',
        opportunityScore:82,
        whyOpportunity:'热度98.7w+增长率342%+竞争度中等+成长期，是近期确定性较强的效率类机会，工具测评类内容素材复用率高'
      },
      {
        id:'t-sidejob', platform:'小红书', listType:'hot', title:'普通人的副业选择·2026实测',
        tags:['职场','副业','实测'], heat:'87.2w', heatScore:87, growthRate:128,
        category:'职场', source:'小红书热门', riskLevel:'mid',
        lifecycle:'成熟期', competition:'高', competitionScore:82,
        whyHot:'经济预期不稳，年轻人求第二收入；"实测""真实收入"类内容信任感强，评论区互动高',
        bestPlatforms:[{name:'小红书',fit:96},{name:'抖音',fit:62}],
        commonAngles:['月入过万真实记录','零门槛副业清单','副业避坑血泪史','技能变现路径'],
        materialReady:62, materialNote:'需要真实案例支撑，纯清单内容同质化严重',
        opportunityScore:58,
        whyOpportunity:'热度高但进入成熟期，竞争度极高，需要强个人背书才能突围，纯新人慎入'
      },
      {
        id:'t-prompt', platform:'B站', listType:'rising', title:'AI写Prompt技巧大全',
        tags:['AI','教程','效率'], heat:'65.8w', heatScore:66, growthRate:620,
        category:'科技', source:'B站上升榜', riskLevel:'low',
        lifecycle:'爆发期', competition:'低', competitionScore:32,
        whyHot:'AI使用门槛降低但Prompt质量参差不齐，"一句话出好图/好文"类内容病毒式传播；教程类完播率高',
        bestPlatforms:[{name:'B站',fit:98},{name:'抖音',fit:85},{name:'小红书',fit:75}],
        commonAngles:['改写前后对比','万能句式模板','行业专用Prompt','常见错误纠正'],
        materialReady:90, materialNote:'屏幕录制+对比展示即可，素材制作成本低',
        opportunityScore:81,
        whyOpportunity:'增长率620%为本周最高，B站爆发期+竞争度低，Prompt类自带工具属性收藏率高，屏幕录制即可生产'
      },
      {
        id:'t-citywalk', platform:'小红书', listType:'rising', title:'城市漫步Citywalk路线',
        tags:['旅行','生活'], heat:'54.2w', heatScore:54, growthRate:430,
        category:'生活', source:'小红书上升榜', riskLevel:'mid',
        lifecycle:'上升期', competition:'高', competitionScore:78,
        whyHot:'年轻人追求低成本出行和在地文化体验；高颜值图片+路线攻略是小红书流量密码',
        bestPlatforms:[{name:'小红书',fit:98},{name:'抖音',fit:65},{name:'B站',fit:45}],
        commonAngles:['本地人私藏路线','一日游攻略','拍照打卡机位','城市故事'],
        materialReady:25, materialNote:'需要本地实地拍摄，你现有素材库几乎没有',
        opportunityScore:52,
        whyOpportunity:'增长率高但竞争度高，且素材可用性极低需实地拍摄，本地创作者更有优势'
      },
      {
        id:'t-dance', platform:'抖音', listType:'hot', title:'女团舞蹈挑战·教学分解',
        tags:['舞蹈','娱乐'], heat:'92.1w', heatScore:92, growthRate:512,
        category:'娱乐', source:'抖音热榜', riskLevel:'high',
        lifecycle:'爆发期', competition:'极高', competitionScore:95,
        whyHot:'偶像回归带火挑战，跟拍参与成本低；但流量窗口极短，7天内热度消退快',
        bestPlatforms:[{name:'抖音',fit:99},{name:'快手',fit:80}],
        commonAngles:['慢速教学','换装挑战','明星同款','合拍互动'],
        materialReady:10, materialNote:'需要舞蹈能力和出镜表现力，与当前账号定位偏差大',
        opportunityScore:62,
        whyOpportunity:'热度极高增长极快，但生命周期极短（7天窗口）、竞争极高，非娱乐垂类账号蹭热点收益低'
      },
      {
        id:'t-food', platform:'小红书', listType:'total', title:'一人食·10分钟快手菜',
        tags:['美食','生活'], heat:'65.3w', heatScore:65, growthRate:56,
        category:'美食', source:'小红书总榜', riskLevel:'mid',
        lifecycle:'稳定期', competition:'极高', competitionScore:90,
        whyHot:'独居人群扩大，快手菜是刚需；但赛道极度内卷，头部博主已占据流量',
        bestPlatforms:[{name:'小红书',fit:95},{name:'抖音',fit:80},{name:'B站',fit:60}],
        commonAngles:['三步搞定','5元成本','宿舍可做','减脂版'],
        materialReady:30, materialNote:'需要厨房场景和食物拍摄经验',
        opportunityScore:32,
        whyOpportunity:'刚需赛道但已极度内卷，头部垄断明显，新人突破难度大'
      }
    ],
    marketPicks: [
      {
        trendId:'t-prompt',
        opportunityScore:81,
        marketReasons:['增长率620%为本周最高','B站视频教程类完播率优势明显','Prompt类内容自带工具属性收藏率高','竞争度低目前入局窗口好'],
        anglePool:['改写前后对比','万能句式模板','行业专用Prompt','常见错误纠正'],
        entryBarrier:'低——屏幕录制+对比演示即可，无需真人出镜'
      },
      {
        trendId:'t-ai-tool',
        opportunityScore:82,
        marketReasons:['抖音/B站双平台热度持续走高','"免费替代"钩子已被反复验证','素材模板已有成熟参考','成长期还有持续发酵空间'],
        anglePool:['免费替代付费工具','真实工作流对比','工具组合使用套路','避坑红黑榜'],
        entryBarrier:'低——工具测评类内容结构化程度高，可复用屏幕录制流程'
      }
    ],
    materials: [
      {
        id: 1,
        type: 'image',
        typeLabel: '图文',
        platform: '小红书',
        title: '夏日水蜜桃气泡水｜3步搞定高颜值饮品',
        author: '甜品研究所',
        heat: '48.2K',
        height: 280,
        tags: ['饮品', '夏日', '高颜值'],
        coverBg: 'linear-gradient(135deg,rgba(255,224,230,.15) 0%,rgba(255,179,193,.15) 40%,rgba(255,143,163,.15) 100%)',
        coverIcon: '🍑',
        coverTitle: '夏日限定',
        coverSubtitle: '水蜜桃气泡水'
      },
      {
        id: 2,
        type: 'video',
        typeLabel: '视频',
        platform: '抖音',
        title: 'AI工具效率翻倍｜普通人一天省2小时',
        author: '效率拆解师',
        heat: '56.7K',
        duration: '02:15',
        height: 320,
        tags: ['AI', '效率', '教程'],
        coverBg: 'linear-gradient(135deg,rgba(26,26,46,.6) 0%,rgba(22,33,62,.6) 50%,rgba(15,52,96,.6) 100%)',
        coverIcon: '🤖',
        coverTitle: 'AI效率神器',
        coverSubtitle: '一天省2小时'
      }
    ]
  };
})();
