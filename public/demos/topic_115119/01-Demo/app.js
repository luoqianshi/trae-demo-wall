/* ========== DATA ========== */
const now = new Date('2026-07-03T09:00:00');
const fmtTime = d => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
const fmtDate = d => `${d.getMonth()+1}月${d.getDate()}日`;
const fmtFullDate = d => `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
const ago = min => { const d = new Date(now); d.setMinutes(d.getMinutes()-min); return d; };
const daysAgo = days => { const d = new Date(now); d.setDate(d.getDate()-days); return d; };

const events = [
  { id:1, channel:'tech', tags:['tech'], title:'OpenAI 发布 GPT-5 预览版，推理能力较前代提升 40%', summary:'新一代大语言模型在多步推理和数学解题上显著进步，API 定价维持不变。', source:'科技日报', sourceType:'official', time:ago(12), trust:92, sources:8,
    distill:{ what:'OpenAI 正式发布 GPT-5 预览版，官方称推理能力提升 40%，数学和代码能力大幅增强。', why:'这是大模型竞赛的关键节点，GPT-5 的表现将直接影响 AI 应用落地速度和行业格局。', impact:'开发者生态将迎来新一轮应用爆发，同时加剧与 Anthropic、Google 的竞争。' },
    timeline:[ {time:ago(180),text:'OpenAI CEO 在 X 上发布神秘预告',source:'X / @sama'}, {time:ago(90),text:'Reddit 用户泄露 GPT-5 基准测试截图',source:'Reddit r/LocalLLaMA'}, {time:ago(45),text:'官方博客确认今日发布预览版',source:'OpenAI Blog'}, {time:ago(12),text:'GPT-5 预览版正式上线，开发者可申请',source:'科技日报'} ],
    multiViews:[ {source:'彭博社',text:'GPT-5 的定价策略显示 OpenAI 正从"卖模型"转向"卖平台"，API 调用量或翻倍。'}, {source:'The Verge',text:'实际测试中，GPT-5 在复杂逻辑推理上确实优于 Claude 3.5，但幻觉率仍有待观察。'}, {source:'36氪',text:'国内大模型厂商或将加速追赶，百度、阿里预计两周内跟进发布对标产品。'} ] },
  { id:2, channel:'finance', tags:['finance'], title:'央行宣布降准 0.5 个百分点，释放流动性约 1.2 万亿', summary:'为支持实体经济发展，促进综合融资成本稳中有降，央行决定于 7 月 5 日下调存款准备金率。', source:'中国人民银行', sourceType:'official', time:ago(35), trust:98, sources:15,
    distill:{ what:'央行宣布全面降准 0.5 个百分点，预计释放长期资金约 1.2 万亿元。', why:'当前经济复苏仍需流动性支持，降准可降低银行资金成本，引导贷款利率下行。', impact:'股市短期或受提振，但需关注资金流向是否真正进入实体经济。' },
    timeline:[ {time:ago(480),text:'市场对降准预期升温，国债收益率走低',source:'Wind 金融终端'}, {time:ago(120),text:'国务院常务会提及"适时运用货币政策工具"',source:'新华社'}, {time:ago(35),text:'央行公告：7 月 5 日起降准 0.5 个百分点',source:'中国人民银行官网'} ],
    multiViews:[ {source:'中信证券',text:'此次降准略超市场预期，预计对银行净息差影响中性，利好地产和基建板块。'}, {source:'摩根士丹利',text:'政策信号积极，但需警惕资金空转风险，关注后续信贷数据能否跟上。'}, {source:'财新',text:'降准落地后，市场焦点将转向 7 月 LPR 报价是否跟进下调。'} ] },
  { id:3, channel:'society', tags:['society','climate'], title:'全国高温预警升级，多地气温突破历史极值', summary:'中央气象台发布高温红色预警，华北、黄淮等地最高气温可达 42°C，建议减少户外活动。', source:'中央气象台', sourceType:'official', time:ago(58), trust:95, sources:12,
    distill:{ what:'中央气象台升级高温预警至红色，华北、黄淮等多地气温突破同期历史极值。', why:'副热带高压异常偏强，叠加城市热岛效应，导致极端高温天气持续。', impact:'户外工作者健康风险上升，电力负荷创新高，农业抗旱压力增大。' },
    timeline:[ {time:ago(720),text:'华北多地开始出现 38°C 以上高温',source:'中国天气网'}, {time:ago(360),text:'河北、河南发布高温橙色预警',source:'地方气象台'}, {time:ago(120),text:'北京南郊观象台气温达 41.3°C，破同期纪录',source:'北京日报'}, {time:ago(58),text:'中央气象台发布高温红色预警',source:'中央气象台'} ],
    multiViews:[ {source:'澎湃新闻',text:'极端高温与全球变暖密切相关，今年或成为有记录以来最热年份之一。'}, {source:'第一财经',text:'电力企业满负荷运转，部分地区启动有序用电，工商业用电受限。'}, {source:'健康时报',text:'热射病病例数上升，医生建议高温时段避免户外活动，及时补水。'} ] },
  { id:4, channel:'intl', tags:['intl','law','tech'], title:'欧盟通过《人工智能法案》最终版本，全球首部 AI 综合立法', summary:'该法案按风险等级对 AI 系统分类监管，违规企业最高面临全球年营业额 7% 的罚款。', source:'欧盟委员会', sourceType:'official', time:ago(78), trust:90, sources:10,
    distill:{ what:'欧盟正式通过《人工智能法案》最终文本，这是全球首部综合性的 AI 监管法律。', why:'欧盟希望在 AI 技术爆发期率先建立规则框架，平衡创新与风险。', impact:'全球 AI 企业需重新评估合规成本，该法案可能成为其他国家立法的模板。' },
    timeline:[ {time:ago(2880),text:'欧洲议会一读通过 AI 法案草案',source:'European Parliament'}, {time:ago(1440),text:'欧盟理事会就最终文本达成一致',source:'EU Council'}, {time:ago(78),text:'正式通过，预计 2026 年底开始分阶段实施',source:'欧盟委员会'} ],
    multiViews:[ {source:'Politico',text:'该法案被批评为"过度监管"，可能削弱欧洲 AI 产业的竞争力。'}, {source:'FT',text:'大型科技公司已提前布局合规团队，但中小企业面临更高合规门槛。'}, {source:'南华早报',text:'中国 AI 企业出口欧盟需重新调整产品，合规成本可能上升 15-20%。'} ] },
  { id:5, channel:'tech', tags:['tech'], title:'苹果 Vision Pro 2 曝光：重量减轻 30%，售价降至 2499 美元', summary:'供应链消息显示第二代头显将在 2027 年初发布，采用全新轻量化材料和更先进的显示技术。', source:'快科技', sourceType:'media', time:ago(95), trust:72, sources:4,
    distill:{ what:'Vision Pro 第二代据传重量减轻 30%，起售价降至 2499 美元，预计 2027 年初发布。', why:'初代 Vision Pro 因重量和价格遇冷，苹果急需推出更亲民的版本打开市场。', impact:'若定价属实，MR 设备有望进入主流消费电子市场，挑战 Meta Quest 地位。' },
    timeline:[ {time:ago(480),text:'分析师郭明錤发布 Vision Pro 2 预测报告',source:'X / @mingchikuo'}, {time:ago(240),text:'供应链透露轻量化材料测试进展',source:'DigiTimes'}, {time:ago(95),text:'多家媒体跟进报道价格和发布时间',source:'快科技'} ],
    multiViews:[ {source:'Bloomberg',text:'降价是正确方向，但 2499 美元仍然昂贵，需要杀手级应用支撑销量。'}, {source:'The Information',text:'苹果内部对 Vision Pro 销量不满意，第二代是"最后一次机会"。'}, {source:'虎嗅',text:'国内供应链企业将受益，立讯精密、歌尔股份或成主要供应商。'} ] },
  { id:6, channel:'finance', tags:['finance','tech'], title:'特斯拉 Q2 交付量 46.6 万辆，同比增长 14% 但低于预期', summary:'特斯拉公布第二季度交付数据，虽然同比增长但低于华尔街 48 万辆的预期，盘后股价跌 3%。', source:'Reuters', sourceType:'media', time:ago(110), trust:88, sources:9,
    distill:{ what:'特斯拉 Q2 全球交付 46.6 万辆，同比增长 14%，但低于市场预期的 48 万辆。', why:'中国市场需求疲软和欧洲补贴退坡是主要拖累因素。', impact:'股价盘后下跌 3%，市场关注下季度能否通过新款车型和 FSD 订阅弥补差距。' },
    timeline:[ {time:ago(600),text:'分析师下调特斯拉 Q2 交付预期至 48 万辆',source:'高盛研报'}, {time:ago(180),text:'中国市场乘联会数据显示特斯拉销量环比下滑',source:'乘联会'}, {time:ago(110),text:'特斯拉官方公布 Q2 交付量 46.6 万辆',source:'Reuters'} ],
    multiViews:[ {source:'摩根大通',text:'交付量miss不算严重，关键是毛利率能否守住 18% 底线。'}, {source:'Bernstein',text:'特斯拉的增长故事正在 fading，需要 Robotaxi 来重新点燃叙事。'}, {source:'36氪',text:'比亚迪和理想正在蚕食特斯拉在中国的高端市场份额。'} ] },
  { id:7, channel:'society', tags:['society'], title:'北京地铁新线开通：19 号线二期北段今日试运营', summary:'新线全长 24 公里，设 12 座车站，连接回天地区与中心城区，预计日均客流 30 万人次。', source:'北京市交通委', sourceType:'official', time:ago(140), trust:96, sources:6,
    distill:{ what:'北京地铁 19 号线二期北段今日开通试运营，全长 24 公里，设 12 座车站。', why:'回天地区通勤压力巨大，新线将显著缓解 5 号线和 13 号线的拥挤状况。', impact:'沿线房价或将出现结构性上涨，北七家、天通苑东居民通勤时间缩短 20-30 分钟。' },
    timeline:[ {time:ago(2880),text:'19 号线二期通过竣工验收',source:'北京市住建委'}, {time:ago(720),text:'开通前三天开始空载试运行',source:'北京地铁官方'}, {time:ago(140),text:'今日首班车 6:00 正式对公众开放',source:'北京市交通委'} ],
    multiViews:[ {source:'北京日报',text:'新线采用全自动无人驾驶技术，发车间隔最短可压缩至 3 分钟。'}, {source:'链家',text:'沿线二手房带看量已上涨 25%，业主心态明显走强。'}, {source:'界面新闻',text:'建议市民错峰体验，开通首日客流量预计突破 20 万人次。'} ] },
  { id:8, channel:'intl', tags:['intl','finance'], title:'日本央行宣布加息 15 个基点，结束负利率时代', summary:'这是日本央行自 2007 年以来首次加息，日元兑美元短线升值至 148 关口。', source:'NHK', sourceType:'official', time:ago(165), trust:94, sources:11,
    distill:{ what:'日本央行宣布将基准利率从 -0.1% 上调至 0.05%，正式结束长达 8 年的负利率政策。', why:'日本通胀率已连续 22 个月高于 2% 目标，工资增长出现积极信号。', impact:'全球套利交易平仓压力增大，新兴市场或面临资本外流风险。' },
    timeline:[ {time:ago(1200),text:'日本央行行长植田和男释放加息信号',source:'NHK'}, {time:ago(600),text:'春斗结果显示工资涨幅创 30 年新高',source:'日本经团联'}, {time:ago(165),text:'利率决议公布：加息 15bp',source:'日本央行'} ],
    multiViews:[ {source:'Nikkei',text:'加息步伐将非常缓慢，预计年内不会再加息，市场已充分定价。'}, {source:'CNBC',text:'套息交易 unwind 可能引发全球市场波动，关注 carry trade 敞口。'}, {source:'财新',text:'日元升值利好进口，但对日本出口企业利润构成压力。'} ] },
  { id:9, channel:'tech', tags:['tech'], title:'字节跳动发布视频生成模型 Seedance，支持 1080p 长视频', summary:'该模型可生成最长 60 秒的高质量视频，在人物一致性和物理模拟上表现突出。', source:'机器之心', sourceType:'media', time:ago(200), trust:82, sources:5,
    distill:{ what:'字节跳动发布视频生成模型 Seedance，支持 1080p 分辨率、最长 60 秒视频生成。', why:'Sora 迟迟未向公众开放，国内厂商正在填补这一市场空白。', impact:'短视频创作门槛将进一步降低，广告、影视行业或面临颠覆。' },
    timeline:[ {time:ago(800),text:'字节跳动申请 Seedance 商标',source:'国家知识产权局'}, {time:ago(400),text:'内部测试视频在社交媒体流传',source:'微博'}, {time:ago(200),text:'官方正式发布并开放内测申请',source:'机器之心'} ],
    multiViews:[ {source:'量子位',text:'Seedance 的人物一致性和镜头语言明显优于可灵和即梦。'}, {source:'晚点 LatePost',text:'字节正在与抖音创作者合作测试，计划 Q3 向创作者全面开放。'}, {source:'Ars Technica',text:'中国的视频生成模型正在快速追赶 Sora，质量差距已缩小到 6 个月以内。'} ] },
  { id:10, channel:'finance', tags:['finance'], title:'A股三大指数集体收涨，北向资金净流入 86 亿元', summary:'降准消息刺激下，沪指涨 1.2% 收复 3400 点，科技、券商板块领涨。', source:'证券时报', sourceType:'official', time:ago(240), trust:90, sources:7,
    distill:{ what:'A股三大指数今日集体上涨，沪指涨 1.2% 报 3421 点，北向资金净买入 86 亿元。', why:'央行降准消息释放流动性预期，市场风险偏好明显改善。', impact:'短期或延续反弹，但需关注成交量能否持续放大。' },
    timeline:[ {time:ago(300),text:'早盘高开，券商板块集体涨停',source:'同花顺'}, {time:ago(260),text:'北向资金半小时净流入超 50 亿',source:'东方财富'}, {time:ago(240),text:'收盘：沪指涨 1.2%，深成指涨 1.5%',source:'证券时报'} ],
    multiViews:[ {source:'国泰君安',text:'反弹有望延续至 3450-3480 区间，建议关注 AI 应用和智能驾驶。'}, {source:'瑞银',text:'外资回流是积极信号，但持续性取决于后续政策组合拳。'}, {source:'雪球',text:'散户情绪高涨，需注意追高风险，建议控制仓位。'} ] },
  { id:11, channel:'tech', tags:['tech','aerospace'], title:'SpaceX 星舰第六次试飞成功，实现筷子夹火箭回收', summary:'超重型助推器首次被发射塔机械臂捕获回收，标志着可重复使用火箭技术重大突破。', source:'SpaceX', sourceType:'official', time:daysAgo(1), trust:96, sources:20,
    distill:{ what:'SpaceX 星舰第六次试飞中，超重型助推器首次被发射塔机械臂成功捕获回收。', why:'"筷子夹火箭"是马斯克提出的颠覆性回收方案，成功后可将发射成本降低 90% 以上。', impact:'人类大规模进入太空的成本壁垒被打破，月球基地和火星殖民的时间表可能提前。' },
    timeline:[ {time:daysAgo(1),text:'星舰从德州博卡奇卡发射升空',source:'SpaceX Live'}, {time:daysAgo(1),text:'一级助推器分离并返回发射塔',source:'NASA Spaceflight'}, {time:daysAgo(1),text:'机械臂成功捕获助推器，全球首次',source:'SpaceX'} ],
    multiViews:[ {source:'Ars Technica',text:'这是航天史上的里程碑时刻，比着陆腿回收优雅得多。'}, {source:'航天科技集团',text:'中国也在研发类似的塔架回收技术，预计 2028 年首试。'} ] },
  { id:12, channel:'society', tags:['society','archaeology'], title:'广东发现全新恐龙化石物种，命名「岭南龙」', summary:'中科院古脊椎所宣布在广东河源发现白垩纪晚期恐龙新物种化石，体长约 8 米。', source:'中科院古脊椎所', sourceType:'official', time:daysAgo(2), trust:94, sources:5,
    distill:{ what:'中科院团队在广东河源发现白垩纪晚期恐龙新物种，命名为「岭南龙」。', why:'这是中国南方首次发现大型鸭嘴龙科化石，填补了华南地区恐龙演化的关键空白。', impact:'可能改写东亚恐龙地理分布理论，相关研究将发表于《自然》子刊。' },
    timeline:[ {time:daysAgo(2),text:'野外考察队发现化石露头',source:'中科院古脊椎所'}, {time:daysAgo(2),text:'初步鉴定为鸭嘴龙科新物种',source:'广东地质博物馆'} ],
    multiViews:[ {source:'National Geographic',text:'岭南龙的发现证明了白垩纪晚期华南与北美之间存在物种交流。'} ] }
];

const fieldColors = {
  tech:'#007AFF', finance:'#34C759', society:'#FF9500', intl:'#AF52DE',
  archaeology:'#8E8E93', climate:'#30B0C7', medicine:'#FF2D55', politics:'#5856D6',
  food:'#FFCC00', art:'#FF3B30', law:'#5AC8FA', education:'#FF9500',
  energy:'#4CD964', aerospace:'#007AFF', psychology:'#AF52DE'
};

const fieldNames = {
  tech:'科技', finance:'财经', society:'社会', intl:'国际',
  archaeology:'考古', climate:'气候', medicine:'医药', politics:'政治',
  food:'食品', art:'艺术', law:'法律', education:'教育',
  energy:'能源', aerospace:'航天', psychology:'心理'
};

const fieldNodes = [
  { id:'tech', name:'科技', x:0.5, y:0.3, radius:28, readCount:0, totalCount:3, status:'unexplored', connections:['finance','intl','aerospace','medicine'], color:'#007AFF' },
  { id:'finance', name:'财经', x:0.3, y:0.45, radius:24, readCount:0, totalCount:3, status:'unexplored', connections:['tech','society','intl','law'], color:'#34C759' },
  { id:'society', name:'社会', x:0.7, y:0.45, radius:24, readCount:0, totalCount:3, status:'unexplored', connections:['finance','intl','education','medicine'], color:'#FF9500' },
  { id:'intl', name:'国际', x:0.5, y:0.6, radius:26, readCount:0, totalCount:3, status:'unexplored', connections:['tech','finance','society','politics'], color:'#AF52DE' },
  { id:'archaeology', name:'考古', x:0.15, y:0.25, radius:18, readCount:0, totalCount:1, status:'unexplored', connections:['art','history'], color:'#8E8E93' },
  { id:'climate', name:'气候', x:0.85, y:0.25, radius:20, readCount:0, totalCount:1, status:'unexplored', connections:['energy','society'], color:'#30B0C7' },
  { id:'medicine', name:'医药', x:0.2, y:0.7, radius:20, readCount:0, totalCount:1, status:'unexplored', connections:['tech','society','psychology'], color:'#FF2D55' },
  { id:'politics', name:'政治', x:0.8, y:0.7, radius:20, readCount:0, totalCount:1, status:'unexplored', connections:['intl','law'], color:'#5856D6' },
  { id:'food', name:'食品', x:0.35, y:0.15, radius:16, readCount:0, totalCount:1, status:'unexplored', connections:['medicine','climate'], color:'#FFCC00' },
  { id:'art', name:'艺术', x:0.65, y:0.15, radius:16, readCount:0, totalCount:1, status:'unexplored', connections:['archaeology','tech'], color:'#FF3B30' },
  { id:'law', name:'法律', x:0.1, y:0.5, radius:18, readCount:0, totalCount:1, status:'unexplored', connections:['finance','politics'], color:'#5AC8FA' },
  { id:'education', name:'教育', x:0.9, y:0.5, radius:18, readCount:0, totalCount:1, status:'unexplored', connections:['society','tech'], color:'#FF9500' },
  { id:'energy', name:'能源', x:0.25, y:0.85, radius:18, readCount:0, totalCount:1, status:'unexplored', connections:['climate','finance'], color:'#4CD964' },
  { id:'aerospace', name:'航天', x:0.5, y:0.85, radius:22, readCount:0, totalCount:1, status:'unexplored', connections:['tech','intl'], color:'#007AFF' },
  { id:'psychology', name:'心理', x:0.75, y:0.85, radius:16, readCount:0, totalCount:1, status:'unexplored', connections:['medicine','education'], color:'#AF52DE' }
];

// Pre-seed some read counts for demo
fieldNodes.find(n=>n.id==='tech').readCount = 2;
fieldNodes.find(n=>n.id==='tech').status = 'deep';
fieldNodes.find(n=>n.id==='finance').readCount = 2;
fieldNodes.find(n=>n.id==='finance').status = 'deep';
fieldNodes.find(n=>n.id==='society').readCount = 2;
fieldNodes.find(n=>n.id==='society').status = 'deep';
fieldNodes.find(n=>n.id==='intl').readCount = 2;
fieldNodes.find(n=>n.id==='intl').status = 'deep';
fieldNodes.find(n=>n.id==='aerospace').readCount = 1;
fieldNodes.find(n=>n.id==='aerospace').status = 'touched';

const dailyReports = [
  {
    date: new Date('2026-07-03'), type:'daily',
    headline: 'GPT-5 发布、央行降准、欧盟 AI 法案',
    summary: '今日科技、财经、国际三大领域同时出现重磅事件。OpenAI 发布 GPT-5 预览版，央行降准释放 1.2 万亿流动性，欧盟通过全球首部 AI 综合立法。',
    sections: [
      { level:'S', title:'全局要闻', events:[events[0],events[1],events[3]], count:3 },
      { level:'A', title:'行业影响', events:[events[4],events[5],events[8]], count:3 },
      { level:'B', title:'社会关注', events:[events[2],events[6]], count:2 },
      { level:'C', title:'延伸阅读', events:[events[7]], count:1 }
    ],
    stats: { totalEvents:10, totalSources:87, avgTrust:89, topField:'科技' }
  },
  {
    date: new Date('2026-07-02'), type:'daily',
    headline: 'SpaceX 筷子夹火箭成功、岭南龙化石发现',
    summary: '航天史迎来里程碑时刻，SpaceX 首次实现发射塔机械臂捕获回收。同时广东发现全新恐龙物种「岭南龙」。',
    sections: [
      { level:'S', title:'全局要闻', events:[events[10],events[11]], count:2 },
      { level:'A', title:'行业影响', events:[events[10]], count:1 }
    ],
    stats: { totalEvents:2, totalSources:25, avgTrust:95, topField:'航天' }
  },
  {
    date: new Date('2026-06-29'), type:'weekly',
    headline: '本周回顾：AI 竞赛白热化、全球货币政策转向',
    summary: '本周科技领域密集突破，OpenAI GPT-5 和字节 Seedance 引爆关注。全球货币政策迎来拐点，央行降准配合日本加息，套利交易格局生变。',
    sections: [
      { level:'S', title:'全局要闻', events:[events[0],events[1],events[3],events[10]], count:4 },
      { level:'A', title:'行业影响', events:[events[4],events[5],events[8],events[9]], count:4 },
      { level:'B', title:'社会关注', events:[events[2],events[6],events[7],events[11]], count:4 }
    ],
    stats: { totalEvents:12, totalSources:112, avgTrust:90, topField:'科技' }
  },
  {
    date: new Date('2026-07-01'), type:'monthly',
    headline: '7 月展望：AI 大模型竞赛、经济复苏信号',
    summary: '6 月全球 AI 大模型竞争进入白热化阶段，国内厂商加速追赶。经济层面，降准降息预期升温，市场等待政策落地。极端天气频发，气候议题重回公众视野。',
    sections: [
      { level:'S', title:'全局要闻', events:[events[0],events[1],events[3],events[10]], count:4 },
      { level:'A', title:'行业影响', events:[events[4],events[5],events[8],events[9]], count:4 },
      { level:'B', title:'社会关注', events:[events[2],events[6],events[7],events[11]], count:4 },
      { level:'C', title:'延伸阅读', events:[events[11]], count:1 }
    ],
    stats: { totalEvents:13, totalSources:138, avgTrust:91, topField:'科技' }
  }
];

/* ========== STATE ========== */
let currentScreen = 'timeline';
let screenStack = ['timeline'];
let bookmarks = new Set();
let readFields = new Set(['tech','finance','society','intl','aerospace']);
let readEvents = new Set();
let searchHistory = ['GPT-5','降准','AI 法案'];
let calViewDate = new Date(now);
let selectedDate = null; // null = daily report view
let showingEvents = false; // false = daily report, true = event list
let shareEventId = null;

/* ========== UTILS ========== */
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2000);
}
function getTrustClass(s) { return s>=85?'high':s>=60?'medium':'low'; }
function getTrustLabel(s) { return s>=85?'可信度高':s>=60?'可信度中':'可信度低'; }
function timeAgoLabel(d) {
  const diff = Math.floor((now-d)/60000);
  if (diff<1) return '刚刚';
  if (diff<60) return `${diff}分钟前`;
  if (diff<1440) return `${Math.floor(diff/60)}小时前`;
  return fmtDate(d);
}
function getLevelBadgeClass(l) { return 'level-'+l.toLowerCase(); }

/* ========== TAB NAVIGATION ========== */
let currentTab = 'timeline';
const tabRoots = ['timeline', 'map', 'profile'];

function switchTab(name) {
  currentTab = name;
  // Update tab bar UI
  document.querySelectorAll('.tab-item').forEach(t => {
    t.classList.toggle('active', t.dataset.tab === name);
  });
  // Show corresponding screen, hide others
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('scr-' + name).classList.add('active');
  // Render tab content
  if (name === 'timeline') renderHome();
  if (name === 'map') { setTimeout(renderFieldMap, 50); renderMapStats(); }
  if (name === 'profile') renderProfile();
  // Reset stack to tab root
  screenStack = [name];
  currentScreen = name;
}

/* ========== SCREEN NAVIGATION (for sub-screens: search, detail) ========== */
function openScreen(name) {
  // Prevent duplicate consecutive entries; pop back if target exists in stack
  const idx = screenStack.indexOf(name);
  if (idx !== -1) screenStack.splice(idx, screenStack.length - idx);
  screenStack.push(name);
  currentScreen = name;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('scr-'+name).classList.add('active');
  if (name==='search') { setTimeout(()=>document.getElementById('search-input').focus(), 100); renderSearchHistory(); }
}
function goBack() {
  screenStack.pop();
  const prev = screenStack[screenStack.length-1] || currentTab;
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('scr-'+prev).classList.add('active');
  currentScreen = prev;
  // Update tab bar if returning to a tab root
  if (tabRoots.includes(prev)) {
    currentTab = prev;
    document.querySelectorAll('.tab-item').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === prev);
    });
  }
  if (prev === 'timeline') renderHome();
}

/* ========== HOME (Daily Report First) ========== */
function renderSkeleton() {
  const container = document.getElementById('tl-content');
  let html = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:0 4px">
      <div><div class="skeleton skeleton-text-sm" style="width:100px;margin-bottom:8px"></div><div class="skeleton skeleton-title" style="width:120px"></div></div>
    </div>
    <div class="skeleton" style="height:80px;border-radius:16px;margin-bottom:12px"></div>
    <div style="display:flex;gap:8px;margin-bottom:16px">
      <div class="skeleton" style="height:56px;flex:1;border-radius:16px"></div>
      <div class="skeleton" style="height:56px;flex:1;border-radius:16px"></div>
      <div class="skeleton" style="height:56px;flex:1;border-radius:16px"></div>
    </div>
  `;
  for (let i=0; i<3; i++) {
    html += `<div class="skeleton-card anim-in" style="animation-delay:${i*0.08}s">
      <div class="skeleton skeleton-text-sm"></div>
      <div class="skeleton skeleton-title"></div>
      <div class="skeleton skeleton-text"></div>
    </div>`;
  }
  container.innerHTML = html;
}

function renderHome() {
  if (selectedDate || showingEvents) {
    renderEventList();
  } else {
    renderDailyHome();
  }
}

function renderDailyHome() {
  const container = document.getElementById('tl-content');
  const report = dailyReports.find(r => r.type === 'daily');
  let html = '';

  // Date pill
  html += `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:4px 0">
      <div class="date-pill" onclick="openDatePicker()">
        <span style="font-size:13px;font-weight:600">${fmtFullDate(report.date)}</span>
        <span style="font-size:10px;opacity:0.5">&#9662;</span>
      </div>
    </div>
  `;

  // Hero
  html += `
    <div class="report-hero" style="margin-bottom:0">
      <div class="report-date">今日日报</div>
      <div class="report-title">${report.headline}</div>
      <div class="report-summary">${report.summary}</div>
    </div>
  `;

  // AI tool statement
  html += `
    <div style="padding:0 4px;margin-bottom:12px">
      <div style="font-size:12px;color:var(--text-tertiary);line-height:1.5">
        <span style="font-family:var(--font-mono)">AI</span> 根据今日全部资讯自动生成 · 点击下方查看原始时间线
      </div>
    </div>
  `;

  // Stats pills — event count clickable
  const todayFields = new Set();
  report.sections.forEach(s => s.events.forEach(e => (e.tags || [e.channel]).forEach(t => todayFields.add(t))));
  const fieldCount = todayFields.size;
  const todayEventIds = new Set();
  report.sections.forEach(s => s.events.forEach(e => todayEventIds.add(e.id)));
  const unreadCount = [...todayEventIds].filter(id => !readEvents.has(id)).length;
  html += `
    <div class="report-stats">
      <div class="stat-pill" style="cursor:pointer" onclick="showEventList()">
        <div class="stat-value">${report.stats.totalEvents}</div>
        <div class="stat-label">条资讯</div>
      </div>
      <div class="stat-pill">
        <div class="stat-value">${fieldCount}</div>
        <div class="stat-label">个领域</div>
      </div>
      <div class="stat-pill">
        <div class="stat-value">${unreadCount}</div>
        <div class="stat-label">条未读</div>
      </div>
    </div>
  `;

  // S-level (always shown)
  const sSec = report.sections.find(s => s.level === 'S');
  if (sSec) {
    html += `
      <div class="report-section">
        <div class="report-section-header">
          <div class="report-section-title">${sSec.title}<span class="level-badge ${getLevelBadgeClass('S')}">S</span></div>
          <span style="font-size:13px;color:var(--text-tertiary);font-weight:600">${sSec.count} 条</span>
        </div>
    `;
    sSec.events.forEach(e => {
      html += renderCompactCard(e);
    });
    html += `</div>`;
  }

  // A/B/C collapsible
  report.sections.filter(s => s.level !== 'S').forEach(sec => {
    html += `
      <div class="report-section collapsible" style="margin-top:4px">
        <div class="report-section-header" onclick="toggleSection(this)" style="cursor:pointer">
          <div class="report-section-title">${sec.title}<span class="level-badge ${getLevelBadgeClass(sec.level)}">${sec.level}</span></div>
          <span class="section-toggle" data-original="${sec.count} 条">${sec.count} 条 &#8250;</span>
        </div>
        <div class="section-body" style="display:none">
    `;
    sec.events.forEach(e => {
      html += renderCompactCard(e);
    });
    html += `</div></div>`;
  });

  // View all button
  html += `
    <div style="text-align:center;padding:20px 0 40px">
      <button class="date-pill" style="padding:10px 24px" onclick="showEventList()">
        <span style="font-size:14px;font-weight:600">查看全部 ${report.stats.totalEvents} 条事件</span>
        <span style="font-size:12px;opacity:0.5">&#8250;</span>
      </button>
    </div>
  `;

  container.innerHTML = html;
}

function renderCompactCard(e) {
  const bm = bookmarks.has(e.id);
  const rd = readEvents.has(e.id);
  return `
    <div class="event-card ${rd?'read':''}" onclick="openDetail(${e.id})">
      <div class="card-title">${e.title}</div>
      <div class="card-summary">${e.summary}</div>
      <div class="card-footer">
        <span class="badge badge-${e.sourceType}">${e.source}</span>
        <span class="time-label">${timeAgoLabel(e.time)}</span>
        <div class="trust-dot-wrap">
          <div class="trust-dot ${getTrustClass(e.trust)}"></div>
        </div>
        <button class="bookmark-btn ${bm?'active':''}" onclick="event.stopPropagation();toggleBookmark(${e.id})">${bm?'&#9733;':'&#9734;'}</button>
      </div>
    </div>
  `;
}

function renderEventList() {
  const container = document.getElementById('tl-content');
  let filtered = [...events];
  if (selectedDate) {
    const sd = selectedDate;
    filtered = filtered.filter(e => e.time.getDate()===sd.getDate() && e.time.getMonth()===sd.getMonth() && e.time.getFullYear()===sd.getFullYear());
  }
  const sorted = filtered.sort((a,b) => b.time - a.time);
  let html = '';

  // Top nav
  const dateLabel = selectedDate ? fmtDate(selectedDate) : '全部时间';
  html += `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:4px">
      <div style="display:flex;align-items:center;gap:8px">
        <button class="back-btn" style="width:32px;height:32px;font-size:14px" onclick="backToDaily()">&#8592;</button>
        <div class="date-pill" onclick="openDatePicker()">
          <span style="font-size:13px;font-weight:600">${dateLabel}</span>
          <span style="font-size:10px;opacity:0.5">&#9662;</span>
        </div>
      </div>
      <span style="font-size:12px;color:var(--text-tertiary);font-weight:500">${filtered.length} 条</span>
    </div>
  `;

  if (!sorted.length) {
    html += `<div class="empty-state"><div class="empty-icon" style="font-size:40px;opacity:0.4;background:var(--bg-secondary);width:80px;height:80px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center">&#128198;</div><div class="empty-text">该日暂无资讯</div><div class="empty-sub">试试查看其他日期</div></div>`;
    container.innerHTML = html;
    return;
  }

  let lastDate = '';
  sorted.forEach((e, i) => {
    const dl = fmtDate(e.time);
    if (dl !== lastDate) {
      if (lastDate) html += '</div>';
      html += `<div class="timeline-section"><div class="date-label">${dl}</div>`;
      lastDate = dl;
    }
    html += renderCompactCard(e).replace('class="event-card"', `class="event-card anim-in" style="animation-delay:${i*0.05}s"`);
  });
  if (lastDate) html += '</div>';
  container.innerHTML = html;
}

function showEventList() {
  showingEvents = true;
  renderEventList();
  document.getElementById('tl-scroll').scrollTop = 0;
}

function backToDaily() {
  selectedDate = null;
  showingEvents = false;
  renderDailyHome();
  document.getElementById('tl-scroll').scrollTop = 0;
}

function toggleSection(header) {
  const body = header.nextElementSibling;
  const arrow = header.querySelector('.section-toggle');
  const isHidden = body.style.display === 'none';
  body.style.display = isHidden ? 'block' : 'none';
  if (arrow) {
    const original = arrow.dataset.original;
    arrow.innerHTML = isHidden ? '收起 &#9662;' : original + ' &#8250;';
  }
}

/* ========== DETAIL ========== */
function openDetail(id) {
  const e = events.find(x => x.id === id);
  if (!e) return;
  // Record event read
  readEvents.add(id);
  // Record field read
  if (fieldNodes.find(n=>n.id===e.channel)) {
    const node = fieldNodes.find(n=>n.id===e.channel);
    node.readCount++;
    if (node.readCount >= 2) node.status = 'deep';
    else if (node.readCount >= 1) node.status = 'touched';
    readFields.add(e.channel);
  }
  document.getElementById('detail-title').textContent = e.title;
  const bm = bookmarks.has(e.id);
  let html = `
    <div style="padding-top:8px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
        <span class="badge badge-${e.sourceType}">${e.source}</span>
        <div style="display:flex;align-items:center;gap:4px;font-size:12px;color:var(--text-tertiary)">
          <div style="width:6px;height:6px;border-radius:50%;background:var(--${getTrustClass(e.trust)==='high'?'success':getTrustClass(e.trust)==='medium'?'warning':'danger'})"></div>
          ${getTrustLabel(e.trust)} · ${e.trust}分
        </div>
        <span style="font-size:12px;color:var(--text-tertiary)">${timeAgoLabel(e.time)}</span>
      </div>
      <h1 style="font-size:22px;font-weight:800;line-height:1.3;letter-spacing:-0.02em;margin-bottom:16px">${e.title}</h1>
      <div class="distill-box">
        <div class="distill-header"><span class="ai-icon">&#129302;</span><span>AI 信息浓缩</span></div>
        <div class="distill-point"><span class="pt-label">发生了什么</span><span class="pt-text">${e.distill.what}</span></div>
        <div class="distill-point"><span class="pt-label">为什么重要</span><span class="pt-text">${e.distill.why}</span></div>
        <div class="distill-point"><span class="pt-label">后续影响</span><span class="pt-text">${e.distill.impact}</span></div>
      </div>
      <div class="ev-timeline">
        <div class="ev-timeline-title">&#128197; 事件脉络</div>
  `;
  e.timeline.forEach((t, i) => {
    html += `
      <div class="ev-tl-item">
        <div class="ev-tl-dot ${i===0?'start':''}"></div>
        <div class="ev-tl-content">
          <div class="tl-time">${fmtDate(t.time)} ${fmtTime(t.time)}</div>
          <div class="tl-text">${t.text}</div>
          <div class="tl-source">${t.source}</div>
        </div>
      </div>
    `;
  });
  html += `</div>`;
  html += `
    <div style="margin-top:20px">
      <div class="ev-timeline-title">&#127760; 多方观点</div>
  `;
  e.multiViews.forEach(v => {
    html += `<div class="view-card"><div class="view-source">${v.source}</div><div class="view-text">${v.text}</div></div>`;
  });
  html += `</div>`;
  html += `
    <div style="display:flex;gap:10px;margin-bottom:40px;margin-top:20px">
      <button class="back-btn" style="flex:1;height:48px;border-radius:14px;font-size:15px;font-weight:600;gap:6px" onclick="toggleBookmark(${e.id});renderDetailBookmark(${e.id})">
        <span id="detail-bm-icon">${bm?'&#9733;':'&#9734;'}</span> <span id="detail-bm-text">${bm?'已收藏':'收藏'}</span>
      </button>
      <button class="back-btn" style="flex:1;height:48px;border-radius:14px;font-size:15px;font-weight:600;gap:6px" onclick="openShare(${e.id})">
        &#8623; 分享
      </button>
    </div>
  </div>`;
  document.getElementById('detail-content').innerHTML = html;
  openScreen('detail');
}
function renderDetailBookmark(id) {
  const bm = bookmarks.has(id);
  const icon = document.getElementById('detail-bm-icon');
  const text = document.getElementById('detail-bm-text');
  if (icon) icon.textContent = bm ? '&#9733;' : '&#9734;';
  if (text) text.textContent = bm ? '已收藏' : '收藏';
}

/* ========== BOOKMARKS ========== */
function toggleBookmark(id) {
  if (bookmarks.has(id)) { bookmarks.delete(id); showToast('已取消收藏'); }
  else { bookmarks.add(id); showToast('已收藏'); }
  renderHome();
  if (currentTab==='profile') renderProfile();
}
function renderProfileBookmarks() {
  if (bookmarks.size===0) {
    return `<div class="empty-state" style="padding:40px 20px"><div class="empty-icon" style="width:48px;height:48px;margin:0 auto 12px;opacity:0.3"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg></div><div class="empty-text">暂无收藏</div><div class="empty-sub">浏览资讯时点击星标收藏</div></div>`;
  }
  const list = events.filter(e=>bookmarks.has(e.id)).sort((a,b)=>b.time-a.time);
  const preview = list.slice(0, 3);
  let html = `<div style="padding-top:8px"></div>`;
  preview.forEach((e,i)=>{
    html += renderCompactCard(e).replace('class="event-card"', `class="event-card anim-in" style="animation-delay:${i*0.05}s"`);
  });
  if (list.length > 3) {
    html += `<div style="text-align:center;padding:8px 0 16px"><button class="date-pill" style="padding:8px 20px" onclick="showAllBookmarks()"><span style="font-size:13px;font-weight:600">查看全部 ${list.length} 条收藏</span><span style="font-size:12px;opacity:0.5"> &#8250;</span></button></div>`;
  }
  return html;
}
function showAllBookmarks() {
  const list = events.filter(e=>bookmarks.has(e.id)).sort((a,b)=>b.time-a.time);
  const c = document.getElementById('pf-bookmarks');
  let html = `<div style="padding-top:8px"></div>`;
  list.forEach((e,i)=>{
    html += renderCompactCard(e).replace('class="event-card"', `class="event-card anim-in" style="animation-delay:${i*0.05}s"`);
  });
  html += `<div style="text-align:center;padding:8px 0 16px"><button class="date-pill" style="padding:8px 20px" onclick="renderProfile()"><span style="font-size:13px;font-weight:600">收起</span><span style="font-size:12px;opacity:0.5"> &#9662;</span></button></div>`;
  c.innerHTML = html;
}

/* ========== FIELD GRID ========== */
function renderMapStats() {
  const explored = fieldNodes.filter(n=>n.status!=='unexplored').length;
  const deep = fieldNodes.filter(n=>n.status==='deep').length;
  document.getElementById('map-stats').innerHTML = `
    <div class="map-stat"><div class="ms-val">${explored}</div><div class="ms-label">已探索</div></div>
    <div class="map-stat"><div class="ms-val">${deep}</div><div class="ms-label">已深入</div></div>
    <div class="map-stat"><div class="ms-val">${fieldNodes.length}</div><div class="ms-label">总领域</div></div>
  `;
}

function renderFieldMap() {
  const container = document.getElementById('field-grid');
  if (!container) return;
  const unexplored = fieldNodes.filter(n => n.status === 'unexplored');
  const blindNames = unexplored.slice(0, 3).map(n => n.name).join('、');
  let html = '';
  if (blindNames) {
    html += `<div class="map-guide">认知盲区：${blindNames} 等 ${unexplored.length} 个领域尚未探索</div>`;
  }
  html += '<div class="field-grid">';
  fieldNodes.forEach(node => {
    const pct = node.totalCount > 0 ? Math.round(node.readCount / node.totalCount * 100) : 0;
    html += `
      <div class="field-cell ${node.status}" onclick="showFieldReadList('${node.id}')">
        <div class="field-cell-name">${node.name}</div>
        <div class="field-cell-count">${node.readCount}/${node.totalCount}</div>
        <div class="field-cell-bar">
          <div class="field-cell-fill" style="width:${pct}%;background:${node.color}"></div>
        </div>
      </div>
    `;
  });
  html += '</div>';
  container.innerHTML = html;
}

function showFieldReadList(fieldId) {
  const node = fieldNodes.find(n=>n.id===fieldId);
  if (!node) return;
  const fieldEvents = events.filter(e => e.tags && e.tags.includes(fieldId));
  let html = `<div style="padding-top:16px"><div style="font-size:22px;font-weight:800;margin-bottom:16px;padding:0 4px">${node.name}领域</div></div>`;
  if (node.status === 'unexplored' && fieldEvents.length > 0) {
    html += `<div style="padding:0 4px 12px;font-size:13px;color:var(--text-tertiary)">你尚未探索该领域，推荐阅读第一条</div>`;
  }
  if (fieldEvents.length===0) {
    html += `<div class="empty-state"><div class="empty-text">该领域暂无资讯</div></div>`;
  } else {
    fieldEvents.forEach((e,i)=>{
      html += `
        <div class="event-card anim-in" style="animation-delay:${i*0.05}s" onclick="openDetail(${e.id})">
          <div class="card-title">${e.title}</div>
          <div class="card-summary">${e.summary}</div>
          <div class="card-footer">
            <span class="badge badge-${e.sourceType}">${e.source}</span>
            <span class="time-label">${timeAgoLabel(e.time)}</span>
            <div class="trust-dot-wrap"><div class="trust-dot ${getTrustClass(e.trust)}"></div></div>
          </div>
        </div>`;
    });
  }
  document.getElementById('map-read-list').innerHTML = html;
  document.getElementById('map-read-list').scrollIntoView({behavior:'smooth'});
}

/* ========== SEARCH ========== */
function renderSearchHistory() {
  const c = document.getElementById('search-content');
  if (!searchHistory.length) { c.innerHTML = ''; return; }
  let html = `<div class="search-history"><div class="search-history-title">最近搜索</div>`;
  searchHistory.forEach(q => {
    html += `<span class="history-chip" onclick="setSearch('${q}')">${q}</span>`;
  });
  html += `</div>`;
  c.innerHTML = html;
}
function setSearch(q) {
  const input = document.getElementById('search-input');
  input.value = q; doSearch(q);
}
function doSearch(query) {
  const c = document.getElementById('search-content');
  if (!query.trim()) { renderSearchHistory(); return; }
  const q = query.toLowerCase();
  const results = events.filter(e =>
    e.title.toLowerCase().includes(q) ||
    e.summary.toLowerCase().includes(q) ||
    e.source.toLowerCase().includes(q) ||
    e.distill.what.toLowerCase().includes(q)
  );
  if (!results.length) {
    c.innerHTML = `<div class="empty-state"><div class="empty-icon">&#128269;</div><div class="empty-text">未找到相关结果</div><div class="empty-sub">试试其他关键词</div></div>`;
    return;
  }
  let html = `<div style="padding-top:8px"><div style="font-size:13px;color:var(--text-tertiary);margin-bottom:12px;padding:0 4px">找到 ${results.length} 条结果</div></div>`;
  results.forEach((e,i)=>{
    const hlTitle = e.title.replace(new RegExp(q,'gi'), m=>`<mark style="background:var(--accent-soft);color:var(--accent);border-radius:2px;padding:0 2px">${m}</mark>`);
    html += `
      <div class="event-card anim-in" style="animation-delay:${i*0.05}s" onclick="openDetail(${e.id})">
        <div class="card-title">${hlTitle}</div>
        <div class="card-summary">${e.summary}</div>
        <div class="card-footer">
          <span class="badge badge-${e.sourceType}">${e.source}</span>
          <span class="time-label">${timeAgoLabel(e.time)}</span>
          <div class="trust-dot-wrap"><div class="trust-dot ${getTrustClass(e.trust)}"></div></div>
        </div>
      </div>`;
  });
  c.innerHTML = html;
}

/* ========== DATE PICKER ========== */
function openDatePicker() {
  renderCalendar();
  document.getElementById('sheet-overlay').classList.add('open');
  document.getElementById('date-sheet').classList.add('open');
}
function closeDatePicker() {
  document.getElementById('sheet-overlay').classList.remove('open');
  document.getElementById('date-sheet').classList.remove('open');
}
function changeMonth(delta) {
  calViewDate.setMonth(calViewDate.getMonth() + delta);
  renderCalendar();
}
function renderCalendar() {
  const year = calViewDate.getFullYear(), month = calViewDate.getMonth();
  document.getElementById('cal-month').textContent = `${year}年${month+1}月`;
  const grid = document.getElementById('cal-grid');
  let html = '';
  ['日','一','二','三','四','五','六'].forEach(d => html += `<div class="cal-header">${d}</div>`);
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month+1, 0).getDate();
  for (let i=0; i<firstDay; i++) html += `<div></div>`;
  for (let d=1; d<=daysInMonth; d++) {
    const date = new Date(year, month, d);
    const hasEvent = events.some(e => e.time.getDate()===d && e.time.getMonth()===month);
    const isSelected = date.toDateString()===now.toDateString();
    html += `<div class="cal-day ${isSelected?'selected':''}" onclick="selectDate(${year},${month},${d})">${d}${hasEvent?'<div class="day-dot"></div>':''}</div>`;
  }
  grid.innerHTML = html;
}
function selectDate(y,m,d) {
  closeDatePicker();
  selectedDate = new Date(y, m, d);
  showingEvents = true;
  renderEventList();
  document.getElementById('tl-scroll').scrollTop = 0;
  showToast(`${y}年${m+1}月${d}日 · ${events.filter(e=>e.time.getDate()===d && e.time.getMonth()===m && e.time.getFullYear()===y).length} 条资讯`);
}
function changeViewDate(delta) {
  const base = selectedDate || now;
  const nd = new Date(base);
  nd.setDate(nd.getDate() + delta);
  selectedDate = (nd.toDateString() === now.toDateString()) ? null : nd;
  showingEvents = true;
  renderEventList();
  document.getElementById('tl-scroll').scrollTop = 0;
}

/* ========== SHARE ========== */
function openShare(id) {
  shareEventId = id;
  document.getElementById('share-overlay').classList.add('open');
  document.getElementById('share-sheet').classList.add('open');
}
function closeShare() {
  document.getElementById('share-overlay').classList.remove('open');
  document.getElementById('share-sheet').classList.remove('open');
}
function shareCopy() {
  const text = shareEventId ? `信号 · ${events.find(e=>e.id===shareEventId)?.title || ''}\nhttps://xinhao.app/event/${shareEventId}` : 'https://xinhao.app';
  if (navigator.clipboard) navigator.clipboard.writeText(text);
  showToast('链接已复制'); closeShare();
}
function shareText() {
  const ev = shareEventId ? events.find(e=>e.id===shareEventId) : null;
  const text = ev ? `${ev.title}\n来源：${ev.source} · 可信度 ${ev.trust}分\n${ev.summary}` : '信号 · 接收真实信号，跳出算法茧房';
  if (navigator.clipboard) navigator.clipboard.writeText(text);
  showToast('文本已复制'); closeShare();
}
function shareImage() { showToast('图片卡片生成中（演示模式）'); closeShare(); }
function shareMore() { showToast('更多分享选项'); closeShare(); }

/* ========== PROFILE ========== */
function renderProfile() {
  const c = document.getElementById('pf-content');
  const explored = fieldNodes.filter(n=>n.status!=='unexplored').length;
  const deep = fieldNodes.filter(n=>n.status==='deep').length;
  c.innerHTML = `
    <div style="padding-top: max(12px, env(safe-area-inset-top))"></div>
    <!-- Profile Header -->
    <div style="padding: 20px 16px 16px; text-align: center">
      <div style="width: 64px; height: 64px; border-radius: 50%; background: var(--accent-soft); display: inline-flex; align-items: center; justify-content: center; margin-bottom: 12px">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      </div>
      <div style="font-size: 20px; font-weight: 700">信号用户</div>
      <div style="font-size: 13px; color: var(--text-tertiary); margin-top: 4px">接收真实信号，跳出算法茧房</div>
    </div>

    <!-- Reading Stats -->
    <div style="display: flex; gap: 10px; padding: 0 16px; margin-bottom: 20px">
      <div class="stat-pill">
        <div class="stat-value">${readEvents.size}</div>
        <div class="stat-label">已读</div>
      </div>
      <div class="stat-pill">
        <div class="stat-value">${bookmarks.size}</div>
        <div class="stat-label">收藏</div>
      </div>
      <div class="stat-pill">
        <div class="stat-value">${explored}</div>
        <div class="stat-label">领域</div>
      </div>
    </div>

    <!-- Bookmarks Section -->
    <div style="padding: 0 16px 8px; display: flex; align-items: center; justify-content: space-between">
      <div style="font-size: 18px; font-weight: 700">我的收藏</div>
      <span style="font-size: 13px; color: var(--text-tertiary)">${bookmarks.size} 条</span>
    </div>
    <div id="pf-bookmarks">${renderProfileBookmarks()}</div>

    <!-- Settings Section -->
    <div style="padding: 24px 16px 8px">
      <div style="font-size: 18px; font-weight: 700; margin-bottom: 12px">设置</div>
      <div class="settings-group" style="margin-bottom: 16px">
        <div class="settings-cell"><div class="settings-cell-info"><div class="sci-title">每日早报</div><div class="sci-sub">每天 8:00 推送精选日报</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
        <div class="settings-cell"><div class="settings-cell-info"><div class="sci-title">每周精选</div><div class="sci-sub">每周日推送周报</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
        <div class="settings-cell"><div class="settings-cell-info"><div class="sci-title">AI 信息浓缩</div><div class="sci-sub">自动生成事件三要素摘要</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
      </div>
      <div class="settings-group" style="margin-bottom: 16px">
        <div class="settings-cell"><div class="settings-cell-info"><div class="sci-title">可信度标签</div><div class="sci-sub">显示信息来源评级</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
        <div class="settings-cell"><div class="settings-cell-info"><div class="sci-title">领域探索记录</div><div class="sci-sub">阅读后记录领域探索进度</div></div><div class="toggle on" onclick="this.classList.toggle('on')"></div></div>
      </div>
      <div class="settings-group">
        <div class="settings-cell"><div class="settings-cell-info"><div class="sci-title">关于</div><div class="sci-sub">信号 v1.0 · 接收真实信号，跳出算法茧房</div></div></div>
      </div>
    </div>
    <div style="height: 40px"></div>
  `;
}

/* ========== INIT ========== */
document.addEventListener('DOMContentLoaded', () => {
  renderSkeleton();
  setTimeout(() => renderHome(), 800);
});