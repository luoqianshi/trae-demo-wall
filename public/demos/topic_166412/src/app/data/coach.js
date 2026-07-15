(function () {
  const data = window.MiniFishData = window.MiniFishData || {};

  // 封面图生成函数 - 使用picsum.photos随机图片
  const cover = (seed, w=320, h=180) => `https://picsum.photos/seed/${seed}/${w}/${h}`;

  const allCases = [
    // ===== 优秀成效 (6个) =====
    {
      id:'e1', category:'excellent', type:'video',
      title:'ChatGPT 写Prompt的12个神技巧',
      platform:'B站', views:'28.6w', likes:'3.2w', favorites:'4.8w', comments:'1.2k',
      duration:'08:32', engagementRate:'27.9%',
      tags:['AI教程','Prompt','收藏向'],
      cover: cover('prompt12'),
      summary:'以"对比演示"为核心结构，每个技巧配前后效果截图，评论区自发整理笔记。',
      scores:{play:85,like:82,save:95,interact:78,match:90},
      diagnosis:{
        verdict:'"对比演示+数量标题"是B站教程类爆款公式，收藏率16.8%远超均值，用户把这条当工具手册存。',
        hook:{label:'标题钩子',text:'"12个神技巧"用具体数字制造信息量预期，"神"字拉高好奇心阈值，B站用户对"数量+形容词"组合点击率极高。'},
        open:{label:'开头3秒',text:'直接展示Prompt前后效果对比画面，0废话开场，3秒内让用户看到"学了有用"的证据。'},
        structure:{label:'内容节奏',text:'每个技巧独立成段（约40秒），"说技巧→演示→对比结果"三段式循环，信息密度均匀不拖沓。'},
        ending:{label:'结尾引导',text:'结尾说"评论区留你最想学的方向"引导互动，但收藏转化主要靠内容本身的工具属性。'},
        formula:{label:'可复制公式',text:'N个[领域]神技巧｜对比演示+数量标题+分段独立结构+工具手册感'},
        bars:[{dim:'选题匹配',val:90,avg:68},{dim:'播放量',val:85,avg:62},{dim:'赞藏比',val:82,avg:58},{dim:'完播率',val:95,avg:55},{dim:'互动率',val:78,avg:52}],
        actions:['复用"N个技巧+对比演示"结构做同系列（如"12个Cursor神技巧"）','评论区整理笔记的用户可私信送资料包，沉淀私域']
      }
    },
    {
      id:'e2', category:'excellent', type:'image',
      title:'普通人靠AI副业月入5000｜全流程拆解',
      platform:'小红书', views:'15.2w', likes:'2.1w', favorites:'3.6w', comments:'890',
      duration:'图文', engagementRate:'37.5%',
      tags:['副业','AI变现','干货'],
      cover: cover('sidejob'),
      summary:'用真实收入截图建立信任，分步骤给出可复制SOP，账号收藏率最高的图文。',
      scores:{play:88,like:90,save:96,interact:72,match:92},
      diagnosis:{
        verdict:'"收入截图+SOP拆解"是小红书变现类的黄金组合，赞藏比171%说明用户先藏再做，变现号召力极强。',
        hook:{label:'标题钩子',text:'"普通人"降门槛+具体金额"5000"给目标+｜全流程拆解"承诺可复制，三重钩子叠加击穿点击。'},
        open:{label:'封面首图',text:'首图直接放真实收入截图（打码但数字清晰），小红书用户对"钱"的视觉敏感度极高。'},
        structure:{label:'内容节奏',text:'图文8张：收入证明→准备工作→3个具体步骤→避坑提醒→工具清单，每页信息不超载，滑动节奏好。'},
        ending:{label:'结尾引导',text:'最后一张放"评论区扣1发详细SOP"，引导评论的同时筛选高意向用户。'},
        formula:{label:'可复制公式',text:'普通人靠[方法]赚[金额]｜全流程拆解 → 收入截图做封面+步骤化图文+评论区引流'},
        bars:[{dim:'选题匹配',val:92,avg:68},{dim:'播放量',val:88,avg:62},{dim:'赞藏比',val:90,avg:58},{dim:'完播率',val:96,avg:55},{dim:'互动率',val:72,avg:52}],
        actions:['按同一模板做月入3000/8000/1w系列，形成矩阵','建"AI副业"收藏夹合集，增加账号内循环']
      }
    },
    {
      id:'e3', category:'excellent', type:'video',
      title:'3个免费AI工具｜替代付费软件',
      platform:'抖音', views:'42.3w', likes:'5.8w', favorites:'2.1w', comments:'2.4k',
      duration:'01:28', engagementRate:'18.7%',
      tags:['AI工具','免费','效率'],
      cover: cover('aitools'),
      summary:'"免费替代"是强钩子，每个工具3句话讲清价值，完播率高达68%。',
      scores:{play:95,like:88,save:72,interact:82,match:85},
      diagnosis:{
        verdict:'"免费替代付费"击中抖音用户省钱心理，88秒短视频+3个工具的节奏控制是完播率68%的核心。',
        hook:{label:'标题钩子',text:'"免费"是抖音第一流量词，"替代付费"制造省了钱的获得感，数字"3"降低认知负担。'},
        open:{label:'开头3秒',text:'开头直接亮出付费软件价格（"这个软件年费3000"），立刻制造痛点，再展示免费替代的效果。'},
        structure:{label:'内容节奏',text:'每个工具约28秒：报名字→展示替代什么→演示核心功能，快节奏不拖沓，88秒刚好3个。'},
        ending:{label:'结尾引导',text:'结尾"你还知道哪些免费替代？评论区说"激发用户补充和争论，评论区2.4k条就是证明。'},
        formula:{label:'可复制公式',text:'N个免费[AI工具]｜替代[付费类型] → 痛点价格开场+每个工具<30秒+结尾提问引战'},
        bars:[{dim:'选题匹配',val:85,avg:68},{dim:'播放量',val:95,avg:62},{dim:'赞藏比',val:88,avg:58},{dim:'完播率',val:72,avg:55},{dim:'互动率',val:82,avg:52}],
        actions:['做"替代XX付费工具"系列，每期对标一个知名付费产品','评论区高赞工具可做下期选题，形成内容闭环']
      }
    },
    {
      id:'e4', category:'excellent', type:'video',
      title:'我用AI做PPT，老板以为我加班到凌晨',
      platform:'抖音', views:'35.8w', likes:'4.6w', favorites:'3.9w', comments:'1.8k',
      duration:'00:58', engagementRate:'23.4%',
      tags:['AI办公','PPT','职场'],
      cover: cover('pptai'),
      summary:'职场场景+效果对比，开头3秒直接展示AI生成PPT全过程，收藏转化极高。',
      scores:{play:92,like:85,save:88,interact:75,match:88},
      diagnosis:{
        verdict:'"职场故事+AI炫技"双钩子，58秒极限短时长+强场景代入，赞藏比84%说明职场人"先藏后学"心态明显。',
        hook:{label:'标题钩子',text:'第一人称"我"建立代入感，"老板以为加班"制造戏剧性反差，职场用户一秒共情。'},
        open:{label:'开头3秒',text:'3秒内展示AI生成PPT的动画过程（空页→精美排版），视觉冲击直接锁住注意力。'},
        structure:{label:'内容节奏',text:'58秒极短视频：开场3秒炫技→15秒讲操作步骤→20秒展示成品→10秒给提示词模板→结尾引导。'},
        ending:{label:'结尾引导',text:'结尾"需要提示词的评论区扣PPT"，直接用资料换互动，评论区1.8k条多为求资料。'},
        formula:{label:'可复制公式',text:'我用AI做[X]，[戏剧性结果]｜第一人称故事+3秒炫技开场+给模板结尾'},
        bars:[{dim:'选题匹配',val:88,avg:68},{dim:'播放量',val:92,avg:62},{dim:'赞藏比',val:85,avg:58},{dim:'完播率',val:88,avg:55},{dim:'互动率',val:75,avg:52}],
        actions:['复制到Excel/Word/邮件等职场场景做系列','把提示词做成合集图，引导关注后私信领取']
      }
    },
    {
      id:'e5', category:'excellent', type:'image',
      title:'AI绘画关键词词典｜建议收藏',
      platform:'小红书', views:'18.9w', likes:'2.8w', favorites:'5.2w', comments:'620',
      duration:'图文', engagementRate:'42.3%',
      tags:['AI绘画','关键词','素材'],
      cover: cover('aipaint'),
      summary:'分类整理200+高频关键词，配效果对比图，是账号被收藏最多的干货图文。',
      scores:{play:82,like:80,save:98,interact:60,match:86},
      diagnosis:{
        verdict:'纯工具词典类内容，收藏率27.5%是账号最高，用户把它当书签存——这是小红书"收藏天花板"类型。',
        hook:{label:'标题钩子',text:'"词典"暗示系统性和完备性，"建议收藏"直接指挥用户行动，小红书用户对"收藏向"标题点击率极高。'},
        open:{label:'封面首图',text:'封面用九宫格展示9种风格的AI绘画效果对比，视觉丰富度直接拉满，让人想滑进去看更多。'},
        structure:{label:'内容节奏',text:'按风格分类（写实/动漫/插画/国风等），每页一类关键词+效果示例，查找方便。'},
        ending:{label:'结尾引导',text:'最后一张"持续更新建议收藏"暗示系列内容，鼓励用户先收藏等更新。'},
        formula:{label:'可复制公式',text:'[领域]关键词词典｜建议收藏 → 分类整理+效果示例+持续更新暗示'},
        bars:[{dim:'选题匹配',val:86,avg:68},{dim:'播放量',val:82,avg:62},{dim:'赞藏比',val:80,avg:58},{dim:'完播率',val:98,avg:55},{dim:'互动率',val:60,avg:52}],
        actions:['做进阶版词典（光影/构图/镜头角度等维度）','建"AI绘画"收藏合集，引导用户系列消费']
      }
    },
    {
      id:'e6', category:'excellent', type:'video',
      title:'Cursor写代码效率提升10倍｜实测',
      platform:'B站', views:'22.1w', likes:'2.5w', favorites:'3.1w', comments:'1.5k',
      duration:'10:15', engagementRate:'25.3%',
      tags:['Cursor','编程','效率工具'],
      cover: cover('cursor'),
      summary:'真实编程场景录制，边写边讲解，程序员群体转发率极高。',
      scores:{play:80,like:84,save:90,interact:80,match:94},
      diagnosis:{
        verdict:'垂直人群精准打击，"实测"二字在程序员群体中有极高信任度，10分钟长视频完播率高说明内容干货密度够。',
        hook:{label:'标题钩子',text:'"效率提升10倍"数字冲击+"实测"承诺真实性，精准打击程序员"提效"刚需。'},
        open:{label:'开头3秒',text:'开头直接展示用Cursor写代码的对比速度（手动写vs AI辅助），程序员一看就懂，3秒建立信任。'},
        structure:{label:'内容节奏',text:'真实编程场景全程录屏，边写边讲解每个快捷键/功能，节奏不快但每段都有干货，程序员愿意倍速看完。'},
        ending:{label:'结尾引导',text:'结尾分享自己的Cursor配置文件和常用快捷键，程序员群体对配置文件有收藏本能。'},
        formula:{label:'可复制公式',text:'[工具][动作]效率提升N倍｜实测 → 真实场景录屏+边操作边讲解+结尾送配置/资源'},
        bars:[{dim:'选题匹配',val:94,avg:68},{dim:'播放量',val:80,avg:62},{dim:'赞藏比',val:84,avg:58},{dim:'完播率',val:90,avg:55},{dim:'互动率',val:80,avg:52}],
        actions:['做"Cursor快捷键大全""Cursor写项目实战"系列','配置文件放网盘链接，引导评论区留邮箱沉淀私域']
      }
    },

    // ===== 一般成效 (8个) =====
    {
      id:'a1', category:'average', type:'video',
      title:'Notion搭建个人知识库教程',
      platform:'B站', views:'4.8w', likes:'420', favorites:'680', comments:'86',
      duration:'12:15', engagementRate:'2.3%',
      tags:['Notion','知识库','教程'],
      cover: cover('notion'),
      summary:'内容扎实但时长过长，前30秒没有抓住痛点，导致大量观众在前2分钟流失。',
      scores:{play:48,like:38,save:45,interact:28,match:72},
      diagnosis:{
        verdict:'内容质量没问题，但犯了B站教程最常见的错：开头没钩子+时长过长。4.8w播放说明选题有人看，但2.3%互动率说明大量人中途走了。',
        bottlenecks:[
          {label:'开头拖沓',text:'前30秒在讲Notion是什么、为什么好，没有直接展示最终效果，B站用户耐心只有3秒。'},
          {label:'时长失控',text:'12分15秒讲"搭建知识库"，这个话题7分钟足够，大量操作镜头可以倍速或跳过。'},
          {label:'缺乏爽点',text:'全程平铺直叙没有"哇"的瞬间，对比你的爆款"Cursor实测"开头就炫效果，差距明显。'},
          {label:'标题太平',text:'"搭建教程"四个字像说明书，没有承诺结果（如"效率提升X倍""一学就会"）。'}
        ],
        suggestions:[
          {label:'标题改写',text:'改为"我用Notion搭了个第二大脑，效率翻3倍｜从零搭建全流程"，加结果承诺+数字冲击。'},
          {label:'开头重剪',text:'前5秒直接展示成品知识库的炫酷效果（数据库联动/模板跳转），再回来说"今天教你搭"。'},
          {label:'时长压缩',text:'剪掉所有等待加载、重复操作的镜头，控制在7分钟以内，或拆成上下两集。'}
        ],
        bars:[{dim:'选题匹配',val:72,avg:70},{dim:'播放量',val:48,avg:62},{dim:'赞藏比',val:38,avg:58},{dim:'完播率',val:28,avg:55},{dim:'互动率',val:45,avg:52}],
        actions:['重剪开头+压缩时长后重发，标题加数字和结果承诺','同类工具教程统一用"效果开场→教学→送模板"三段式']
      }
    },
    {
      id:'a2', category:'average', type:'image',
      title:'我的AI工作流分享｜每天省2小时',
      platform:'小红书', views:'2.3w', likes:'380', favorites:'520', comments:'62',
      duration:'图文', engagementRate:'3.9%',
      tags:['工作流','效率','分享'],
      cover: cover('workflow'),
      summary:'内容有用但首图吸引力不足，标题太个人化，缺乏受众指向性。',
      scores:{play:35,like:42,save:52,interact:35,match:55},
      diagnosis:{
        verdict:'内容是好内容，但"我的"视角在小红书是减分项——用户不关心你的工作流，关心的是"我能不能用"。收藏率尚可但点击率不够。',
        bottlenecks:[
          {label:'标题太个人',text:'"我的AI工作流"像朋友圈分享，没有对受众喊话，小红书用户扫到不会觉得是给自己看的。'},
          {label:'首图缺乏钩子',text:'首图如果是桌面截图或流程图，没有数字冲击或对比效果，在小红书中信息流里不够跳。'},
          {label:'痛点不明确',text:'"每天省2小时"太虚，没有具体说省在什么场景（写方案？回邮件？做PPT？）。'},
          {label:'收藏后无动作',text:'收藏率还行但关注转化率低，因为看完觉得"不错"但没有理由关注你。'}
        ],
        suggestions:[
          {label:'标题改写',text:'改为"打工人必备AI工作流｜每天下班早2小时（附模板）"，加人群标签+结果+资源承诺。'},
          {label:'首图重做',text:'首图放"Before vs After"对比：左边传统流程（列一堆app图标），右边AI流程（3个工具搞定），视觉冲击一目了然。'},
          {label:'加关注钩子',text:'最后一张"我整理了工作流模板，关注后私信发你"，用资源换关注。'}
        ],
        bars:[{dim:'选题匹配',val:55,avg:68},{dim:'播放量',val:35,avg:62},{dim:'赞藏比',val:42,avg:58},{dim:'完播率',val:52,avg:55},{dim:'互动率',val:35,avg:52}],
        actions:['所有"我的XX分享"类标题改为"[人群]必备XX"，去掉第一人称','统一首图用Before/After对比或大字数字']
      }
    },
    {
      id:'a3', category:'average', type:'video',
      title:'AI绘画入门｜Midjourney基础操作',
      platform:'抖音', views:'6.7w', likes:'890', favorites:'320', comments:'145',
      duration:'03:45', engagementRate:'1.8%',
      tags:['AI绘画','Midjourney','入门'],
      cover: cover('mdbegin'),
      summary:'入门教程竞争激烈，内容同质化严重，缺乏个人特色和独特观点。',
      scores:{play:55,like:40,save:22,interact:25,match:48},
      diagnosis:{
        verdict:'"AI绘画入门"是抖音红海，6.7w播放说明选题有流量但1.8%互动率说明留不住人——用户点进来发现"又是这个"，3秒划走。',
        bottlenecks:[
          {label:'选题红海',text:'搜"Midjourney入门"有几百万条视频，你的视频没有差异化角度，算法不推。'},
          {label:'开头无差异',text:'开头是标准的"大家好今天教大家Midjourney"，和其他入门视频一模一样。'},
          {label:'收藏率极低',text:'22的收藏率说明用户觉得"网上到处都是"，不需要存你这版。'},
          {label:'缺乏人设',text:'没有个人风格和独特观点，看完记不住你是谁。'}
        ],
        suggestions:[
          {label:'切细分角度',text:'不要做"大而全入门"，改做"用Midjourney画小红书配图"这种垂直场景，竞争小10倍。'},
          {label:'标题差异化',text:'改为"别再看那些Midjourney入门了，这3个技巧没人教过你"，用"反常识"钩子突围。'},
          {label:'加个人标签',text:'开头先说"我用AI画了300张图赚了X元，今天分享最容易踩的3个坑"，用结果+踩坑建立人设。'}
        ],
        bars:[{dim:'选题匹配',val:48,avg:68},{dim:'播放量',val:55,avg:62},{dim:'赞藏比',val:40,avg:58},{dim:'完播率',val:22,avg:55},{dim:'互动率',val:25,avg:52}],
        actions:['入门教程类内容一律切垂直场景，不做大全','所有教程开头3秒必须有"我是谁+我做成了什么+今天给你什么"']
      }
    },
    {
      id:'a4', category:'average', type:'image',
      title:'一周复盘｜我的内容数据变化',
      platform:'小红书', views:'1.8w', likes:'210', favorites:'280', comments:'45',
      duration:'图文', engagementRate:'2.7%',
      tags:['复盘','数据','成长'],
      cover: cover('review'),
      summary:'复盘类内容受众较窄，缺乏具体方法论输出，更多是个人记录性质。',
      scores:{play:28,like:32,save:42,interact:22,match:42},
      diagnosis:{
        verdict:'复盘是"给自己看的内容"，小红书用户看复盘是为了"学到方法"，不是看你这周数据涨了多少。纯记录没有方法论就没有传播价值。',
        bottlenecks:[
          {label:'自嗨视角',text:'内容围绕"我这周做了什么"展开，用户看完不知道"我能学到什么"。'},
          {label:'缺乏方法论',text:'只有数据变化展示，没有提炼"做对了什么导致涨""做错了什么导致跌"。'},
          {label:'受众模糊',text:'"一周复盘"没有明确受众标签，算法不知道推给谁。'},
          {label:'标题弱',text:'没有承诺价值，"数据变化"四个字太中性，没有好/坏/经验/教训的暗示。'}
        ],
        suggestions:[
          {label:'标题改写',text:'改为"做小红书第30天，我踩了这5个坑（数据从0到1w复盘）"，加时间+数字+价值承诺。'},
          {label:'内容结构调整',text:'每张图遵循"数据→做了什么→结论/方法论"三段式，不要只放截图。'},
          {label:'加人群标签',text:'明确是"给新手看的复盘"还是"给XX赛道看的复盘"，帮算法找到受众。'}
        ],
        bars:[{dim:'选题匹配',val:42,avg:68},{dim:'播放量',val:28,avg:62},{dim:'赞藏比',val:32,avg:58},{dim:'完播率',val:42,avg:55},{dim:'互动率',val:22,avg:52}],
        actions:['复盘类内容必须提炼方法论，不做纯记录','标题模板：做XX第N天+核心结论+数字']
      }
    },
    {
      id:'a5', category:'average', type:'video',
      title:'5个Chrome插件推荐｜效率翻倍',
      platform:'B站', views:'7.2w', likes:'680', favorites:'920', comments:'132',
      duration:'06:22', engagementRate:'2.2%',
      tags:['Chrome','插件','效率'],
      cover: cover('chrome'),
      summary:'插件推荐类内容太多，选品不够独特，但实用性尚可，有一定收藏。',
      scores:{play:58,like:42,save:50,interact:30,match:62},
      diagnosis:{
        verdict:'7.2w播放说明选题OK，但插件推荐是B站常青赛道也是红海中的红海，选品不够独特就只能拿基础流量。',
        bottlenecks:[
          {label:'选品太常见',text:'推荐的插件可能是其他视频也推荐过的（如AdBlock、Tampermonkey），用户觉得"早就知道了"。'},
          {label:'没有场景感',text:'只是逐个介绍功能，没有说"什么人在什么场景下用这个最爽"，缺乏代入。'},
          {label:'节奏偏慢',text:'6分22秒讲5个插件，每个插件1分多钟，B站用户期望更紧凑的节奏。'},
          {label:'结尾无互动设计',text:'没有引导评论"你用过哪个""还有什么好插件"，评论区没热度影响二次推荐。'}
        ],
        suggestions:[
          {label:'选品要偏门',text:'找别人没推荐过的小众神插件（去Chrome商店按评分排序找冷门），"冷门神插件"比"常见插件"有吸引力。'},
          {label:'场景化展示',text:'每个插件先说"如果你经常遇到XX问题"，再展示插件怎么解决，痛点→方案结构。'},
          {label:'加互动钩子',text:'结尾"第5个插件99%的人不知道"或"你还有什么私藏插件评论区说"。'}
        ],
        bars:[{dim:'选题匹配',val:62,avg:68},{dim:'播放量',val:58,avg:62},{dim:'赞藏比',val:42,avg:58},{dim:'完播率',val:30,avg:55},{dim:'互动率',val:50,avg:52}],
        actions:['工具/插件推荐一律找冷门/新出/小众的，不推荐大路货','每个推荐必带场景痛点开场']
      }
    },
    {
      id:'a6', category:'average', type:'image',
      title:'AI工具盘点｜2026年6月更新',
      platform:'小红书', views:'3.5w', likes:'520', favorites:'780', comments:'95',
      duration:'图文', engagementRate:'3.7%',
      tags:['AI工具','盘点','月度'],
      cover: cover('toolsmonth'),
      summary:'月度盘点类内容时效性强，但缺乏深度测评，看完即走，关注转化低。',
      scores:{play:42,like:45,save:55,interact:32,match:58},
      diagnosis:{
        verdict:'月度盘点类内容是"流量型内容"不是"沉淀型内容"，3.5w播放还行但关注转化低——用户存了图不会关注你，因为下个月搜别人的也行。',
        bottlenecks:[
          {label:'时效性陷阱',text:'"6月更新"意味着7月就过期，用户不需要关注你等更新，搜新的就行。'},
          {label:'只有列表没有评测',text:'只列名字和一句话介绍，没有"哪个最好用""适合什么人"的判断，用户看完还要自己去试。'},
          {label:'同质化',text:'每月AI工具盘点的笔记太多，首图没有差异化就很难跳出来。'},
          {label:'没有关注理由',text:'没有说"关注我每月更新"或"下期评测XX工具"，用户没有关注动机。'}
        ],
        suggestions:[
          {label:'加评测维度',text:'不要只列名字，给每个工具打分（好用度/免费额度/学习成本），做"红黑榜"比"清单"传播力强。'},
          {label:'首图做榜单',text:'首图放"本月Top3必装"大字+图标，比"AI工具盘点"这种泛标题点击率高3倍。'},
          {label:'加系列感',text:'标题改为"6月AI工具红黑榜｜这3个必装，这2个别下载"，加判断+系列标签。'}
        ],
        bars:[{dim:'选题匹配',val:58,avg:68},{dim:'播放量',val:42,avg:62},{dim:'赞藏比',val:45,avg:58},{dim:'完播率',val:55,avg:55},{dim:'互动率',val:32,avg:52}],
        actions:['盘点类内容一律做"红黑榜"或"Top N"，不做纯清单','结尾必说"关注我每月更新"给关注理由']
      }
    },
    {
      id:'a7', category:'average', type:'video',
      title:'飞书多维表格入门教程',
      platform:'抖音', views:'2.8w', likes:'340', favorites:'450', comments:'68',
      duration:'04:18', engagementRate:'2.8%',
      tags:['飞书','表格','教程'],
      cover: cover('feishu'),
      summary:'飞书用户群体相对小众，但教程质量不错，粉丝精准度高。',
      scores:{play:32,like:40,save:48,interact:28,match:75},
      diagnosis:{
        verdict:'选题匹配度75分说明粉丝精准，但2.8w播放被小众天花板限制。内容质量过关，问题是选题盘子太小且包装不够吸引人。',
        bottlenecks:[
          {label:'受众太小',text:'飞书用户以互联网公司为主，在抖音不是大众话题，2.8w已经是这类内容的天花板附近。'},
          {label:'标题没有场景',text:'"入门教程"像说明书，没有说"学会了能干嘛"（管理项目？做CRM？跟踪任务？）。'},
          {label:'开头慢',text:'开头讲飞书是什么，但点进来的人已经知道飞书了，浪费前3秒。'},
          {label:'没有对比优势',text:'没有说"为什么用多维表格而不是Excel"，对非飞书用户没有说服力。'}
        ],
        suggestions:[
          {label:'标题加场景',text:'改为"用飞书多维表格做项目管理，比Excel好用10倍"，加对比+场景，吸引Excel用户点击。'},
          {label:'开头直接秀结果',text:'开头3秒展示一个成品（自动化项目看板），再说"今天教你搭"。'},
          {label:'做系列矩阵',text:'飞书教程虽然小众但精准，做"飞书100个技巧"系列，沉淀精准粉丝。'}
        ],
        bars:[{dim:'选题匹配',val:75,avg:68},{dim:'播放量',val:32,avg:62},{dim:'赞藏比',val:40,avg:58},{dim:'完播率',val:48,avg:55},{dim:'互动率',val:28,avg:52}],
        actions:['小众工具教程加"对比大众工具"的角度破圈','做系列内容沉淀精准粉，不追求单条爆款']
      }
    },
    {
      id:'a8', category:'average', type:'video',
      title:'ChatGPT联网功能实测',
      platform:'B站', views:'5.1w', likes:'560', favorites:'420', comments:'108',
      duration:'05:30', engagementRate:'1.9%',
      tags:['ChatGPT','联网','测评'],
      cover: cover('gptnet'),
      summary:'功能测评类内容时效性强，发布时机稍晚，流量被头部账号分流。',
      scores:{play:50,like:38,save:28,interact:32,match:52},
      diagnosis:{
        verdict:'追热点但追晚了——ChatGPT联网功能发布后头部账号24小时内就出了视频，你发的时候热度已经过了。时效性内容的核心就是速度。',
        bottlenecks:[
          {label:'发布时机晚',text:'功能发布后48小时内是黄金窗口，你发布时头部内容已经占据搜索位了。'},
          {label:'没有差异化角度',text:'其他视频是"功能演示"，你也是"功能演示"，用户看完头部的就不需要看你的。'},
          {label:'收藏率低',text:'功能操作类内容看完就会了，不需要收藏，不像工具类有复看价值。'},
          {label:'时效性过期快',text:'这类内容7天后就没人搜了，长尾流量几乎为零。'}
        ],
        suggestions:[
          {label:'追热点要快',text:'建立热点内容SOP，新功能发布24小时内出视频，先发再迭代。'},
          {label:'切差异角度',text:'如果赶不上首发，就做"深度评测"或"隐藏玩法"或"和其他联网方案对比"，不做重复演示。'},
          {label:'选题平衡',text:'时效性内容做流量，常青内容（教程/方法论）做沉淀，比例建议3:7。'}
        ],
        bars:[{dim:'选题匹配',val:52,avg:68},{dim:'播放量',val:50,avg:62},{dim:'赞藏比',val:38,avg:58},{dim:'完播率',val:28,avg:55},{dim:'互动率',val:32,avg:52}],
        actions:['热点内容24h内出，晚了就换角度不做重复演示','内容配比：30%热点引流+70%常青内容沉淀粉丝']
      }
    },

    // ===== 失败成效 (6个) =====
    {
      id:'f1', category:'failed', type:'video',
      title:'周末vlog｜咖啡店探店日常',
      platform:'抖音', views:'3200', likes:'28', favorites:'5', comments:'8',
      duration:'02:15', engagementRate:'1.0%',
      tags:['vlog','探店','日常'],
      cover: cover('coffeevlog'),
      summary:'完全偏离账号AI/效率定位，受众不匹配，点赞粉丝重合度仅12%。',
      scores:{play:12,like:8,save:5,interact:10,match:15},
      diagnosis:{
        verdict:'这是典型的"定位偏移"内容——粉丝关注你是为了学AI/效率，你发咖啡店vlog，3200播放中88%来自非粉丝，算法判定你的账号标签混乱，后续推荐权重下降。',
        pitfalls:[
          {label:'定位严重偏离',text:'vlog/探店内容和AI效率主题完全无关，粉丝不买单，非粉丝来了也不关注，双输。'},
          {label:'标签污染',text:'发这类内容会让算法给你的账号打上"生活/vlog"标签，影响后续AI内容的精准推荐。'},
          {label:'无信息增量',text:'咖啡店探店在抖音是极度红海内容，没有独特拍摄手法或人设根本无法突围。'}
        ],
        warnings:[
          '非账号定位相关内容一律不发，哪怕你觉得"很有意思"',
          '如果实在想发生活内容，建小号或用故事形式，不要发纯vlog',
          '生活类内容要和AI/效率挂钩（如"AI帮我规划探店路线"）才可以发'
        ],
        bars:[{dim:'选题匹配',val:15,avg:68},{dim:'播放量',val:12,avg:62},{dim:'赞藏比',val:8,avg:58},{dim:'完播率',val:5,avg:55},{dim:'互动率',val:10,avg:52}],
        actions:['立即停发非定位内容，连续发5-8条高质量AI内容修复账号标签','如果想展示个人生活，用"AI+生活"的结合点切入']
      }
    },
    {
      id:'f2', category:'failed', type:'video',
      title:'挑战一天不看手机｜实验记录',
      platform:'B站', views:'5600', likes:'45', favorites:'12', comments:'23',
      duration:'06:42', engagementRate:'1.0%',
      tags:['挑战','实验','生活'],
      cover: cover('nophone'),
      summary:'追热点但缺乏个人视角，同类内容已有大量头部创作者，没有差异化。',
      scores:{play:18,like:12,save:8,interact:18,match:22},
      diagnosis:{
        verdict:'"挑战类"内容在B站已经被头部UP主做烂了，你没有独特的挑战设计或个人魅力，5600播放就是这类内容的天花板。更重要的是这和你的账号定位无关。',
        pitfalls:[
          {label:'选题跟风无差异',text:'"一天不看手机"是几年前的老梗，B站上同类视频几百条，你没有新角度。'},
          {label:'和账号定位割裂',text:'粉丝来看你是学AI工具和效率方法，不是看你做生活挑战，粉丝播放占比极低。'},
          {label:'无传播钩子',text:'挑战结果不意外（"没看手机感觉很好"毫无悬念），没有话题性，评论区23条大多是"我也试过"。'}
        ],
        warnings:[
          '挑战类/社会实验类内容不适合知识工具类账号',
          '追热点必须和你的赛道结合（如"挑战用AI工具一天完成一周工作"）',
          '不要做"别人做过的挑战"，要做"只有你能做的挑战"'
        ],
        bars:[{dim:'选题匹配',val:22,avg:68},{dim:'播放量',val:18,avg:62},{dim:'赞藏比',val:12,avg:58},{dim:'完播率',val:8,avg:55},{dim:'互动率',val:18,avg:52}],
        actions:['热点+AI/效率结合才是你的追热点公式','纯生活类挑战直接放弃，投入产出比极低']
      }
    },
    {
      id:'f3', category:'failed', type:'image',
      title:'读了100本书后的人生感悟',
      platform:'小红书', views:'1800', likes:'15', favorites:'8', comments:'3',
      duration:'图文', engagementRate:'1.3%',
      tags:['读书','感悟','成长'],
      cover: cover('books100'),
      summary:'纯感悟类内容空洞，没有具体书单和方法论，用户看完没有获得感。',
      scores:{play:8,like:10,save:12,interact:5,match:18},
      diagnosis:{
        verdict:'"人生感悟"类内容在小红书是流量黑洞——除非你是百万粉KOL否则没人看。1800播放基本是初始流量池都没过，1.3%互动率说明算法判定内容质量低。',
        pitfalls:[
          {label:'纯感悟无干货',text:'没有书单、没有方法论、没有具体收获，用户看完觉得"说得对但没用"，不赞不藏不评。'},
          {label:'人设不支撑',text:'感悟类内容需要强人设背书（行业大佬/知名作家），你目前的粉丝量级撑不起这类内容。'},
          {label:'标题太空',text:'"人生感悟"四个字没有具体承诺，用户不知道点进来能获得什么。'}
        ],
        warnings:[
          '粉丝<10万不发纯感悟/鸡汤类内容',
          '读书类内容要给具体书单、读书笔记模板、AI辅助阅读方法',
          '任何内容必须让用户"有获得感"——要么学到东西，要么拿到资源'
        ],
        bars:[{dim:'选题匹配',val:18,avg:68},{dim:'播放量',val:8,avg:62},{dim:'赞藏比',val:10,avg:58},{dim:'完播率',val:12,avg:55},{dim:'互动率',val:5,avg:52}],
        actions:['读书内容转型：做"AI帮你10分钟读完一本书"这类教程型内容','"感悟"包装成"方法论"——"读100本书后，我总结了3个AI学习方法"']
      }
    },
    {
      id:'f4', category:'failed', type:'video',
      title:'今天天气真好｜随手拍',
      platform:'抖音', views:'890', likes:'6', favorites:'1', comments:'2',
      duration:'00:45', engagementRate:'0.8%',
      tags:['日常','风景','随手拍'],
      cover: cover('sunnyday'),
      summary:'无信息增量的随手拍，完全不符合账号内容定位，几乎无推荐。',
      scores:{play:5,like:3,save:2,interact:5,match:5},
      diagnosis:{
        verdict:'这是本数据最差的内容，890播放说明连初始流量池都没推出去。1个收藏、0.8%互动率是严重的负面信号，算法可能因此降低你后续内容的初始推荐量。',
        pitfalls:[
          {label:'零信息增量',text:'随手拍天空没有任何价值，既不娱乐也不教学也不种草，用户划走速度极快。'},
          {label:'严重伤害账号标签',text:'这是最危险的内容类型——算法会困惑"这个账号到底发什么"，直接影响后续内容推荐。'},
          {label:'完播率极低',text:'45秒的风景视频用户3秒就划走，完播率数据极差，拉低账号整体权重。'}
        ],
        warnings:[
          '永远不要发"随手拍"类内容，这是账号杀手',
          '如果想发风景/日常，必须结合AI（如"用AI把风景照变成动漫风格"）',
          '每条内容发布前问自己：用户看完能得到什么？答不上来就不发'
        ],
        bars:[{dim:'选题匹配',val:5,avg:68},{dim:'播放量',val:5,avg:62},{dim:'赞藏比',val:3,avg:58},{dim:'完播率',val:2,avg:55},{dim:'互动率',val:5,avg:52}],
        actions:['删除这条内容，避免继续拉低账号数据','发布前做"3秒测试"：前3秒能不能让用户停下来？不能就重剪']
      }
    },
    {
      id:'f5', category:'failed', type:'image',
      title:'我的书桌布置分享',
      platform:'小红书', views:'2400', likes:'32', favorites:'18', comments:'12',
      duration:'图文', engagementRate:'2.1%',
      tags:['书桌','布置','家居'],
      cover: cover('desksetup'),
      summary:'书桌布置类内容与AI/效率主题有一定关联，但缺乏产品链接和方法论。',
      scores:{play:15,like:18,save:22,interact:15,match:35},
      diagnosis:{
        verdict:'2400播放不算极差，但和账号定位只有35%匹配度说明这是"边缘内容"。书桌布置在小红书是热门赛道，但你没有用家居博主的方式做（无产品链接、无布置过程、无清单），两边不讨好。',
        pitfalls:[
          {label:'半吊子定位',text:'既不是纯AI效率内容，也不是合格的家居布置笔记，两边受众都不满意。'},
          {label:'缺产品清单',text:'小红书书桌笔记的标配是产品链接/清单，没有清单用户收藏了也买不到，收藏率上不去。'},
          {label:'没有AI结合点',text:'既然是你的账号，应该展示"AI效率工作者的桌面"——AI设备、效率工具、数码产品，而不是普通书桌。'}
        ],
        warnings:[
          '边缘内容（弱关联）要比核心内容做得更好才能发',
          '书桌/桌面类内容必须突出你的特色：AI工具+效率设备',
          '所有种草类内容必须有：产品清单+购买理由+使用场景'
        ],
        bars:[{dim:'选题匹配',val:35,avg:68},{dim:'播放量',val:15,avg:62},{dim:'赞藏比',val:18,avg:58},{dim:'完播率',val:22,avg:55},{dim:'互动率',val:15,avg:52}],
        actions:['书桌内容转型为"AI效率博主的桌面装备"，突出AI设备和工具','加产品清单/购买链接，符合小红书种草笔记的标准格式']
      }
    },
    {
      id:'f6', category:'failed', type:'video',
      title:'开箱最新款iPhone',
      platform:'B站', views:'4200', likes:'38', favorites:'8', comments:'25',
      duration:'08:20', engagementRate:'1.1%',
      tags:['开箱','iPhone','数码'],
      cover: cover('iphone'),
      summary:'数码开箱领域竞争极其激烈，没有独特测评角度，无法脱颖而出。',
      scores:{play:15,like:10,save:5,interact:12,match:20},
      diagnosis:{
        verdict:'iPhone开箱是B站数码区的"死亡赛道"——头部UP主（何同学/影视飓风等）占据99%流量，4200播放说明你完全没有竞争力。8个收藏说明用户看完就忘。',
        pitfalls:[
          {label:'红海中的红海',text:'iPhone开箱视频在B站每天有几百条，没有百万粉基础根本没有流量。'},
          {label:'无差异化角度',text:'你的开箱就是标准的"拆包装→看外观→试相机"，和别人一模一样。'},
          {label:'和账号无关',text:'数码开箱和AI效率工具的关联度很低，粉丝来看你不是为了看iPhone开箱。'},
          {label:'时长过长',text:'8分20秒的开箱视频，3秒没亮点用户就走了，完播率极低。'}
        ],
        warnings:[
          '不做大众数码产品开箱（手机/电脑等），竞争太激烈',
          '如果要做数码，做"AI设备开箱"（AI硬件、效率工具硬件）这类蓝海',
          '开箱视频必须有独特角度，不能只做"拆包装展示"'
        ],
        bars:[{dim:'选题匹配',val:20,avg:68},{dim:'播放量',val:15,avg:62},{dim:'赞藏比',val:10,avg:58},{dim:'完播率',val:5,avg:55},{dim:'互动率',val:12,avg:52}],
        actions:['数码开箱只做AI硬件/效率工具类，避开大众3C红海','如果做开箱，角度必须是"AI创作者的生产力工具评测"而非纯开箱']
      }
    }
  ];

  // 按分类整理
  const excellentCases = allCases.filter(c => c.category === 'excellent');
  const averageCases = allCases.filter(c => c.category === 'average');
  const failedCases = allCases.filter(c => c.category === 'failed');

  data.coach = {
    coachTab: '能力画像',
    coachTabs: ['能力画像', '路线规划', '案例复盘'],
    activeCaseFilter: 'all', // all / excellent / average / failed
    caseSummary: {
      totalCases: allCases.length,
      bestViews: '42.3w',
      avgEngagement: '9.3%',
      totalViews: '200+w',
      excellentRate: '30%'
    },
    // 五维评估维度（统一标准）
    caseDimensions: [
      { key: 'views', name: '播放量', desc: '流量规模' },
      { key: 'engage', name: '赞藏比', desc: '内容价值认可度' },
      { key: 'complete', name: '完播率', desc: '内容吸引力/节奏' },
      { key: 'interact', name: '互动率', desc: '观众参与度' },
      { key: 'match', name: '选题匹配', desc: '与账号定位契合度' }
    ],
    allCases: allCases,
    // 各分类统一五维评估 + AI洞察内容
    caseChartData: {
      all: {
        title: '内容成效全景',
        chip: '全部 20 条',
        desc: '统一五维标准下三类内容的能力结构对比',
        color: '#c8b896',
        scores: {
          excellent: [82, 88, 68, 72, 85],
          average:   [48, 35, 42, 38, 55],
          failed:    [18, 12, 25, 15, 20],
          baseline:  [52, 48, 46, 44, 56]
        },
        heroStats: [
          { value: allCases.length, label: '总案例' },
          { value: '42.3w', label: '最高播放' },
          { value: '9.3%', label: '平均互动' },
          { value: '30%', label: '优秀率' }
        ],
        insight: {
          judgment: '账号呈现典型"方法型创作者"特征：赞藏比均值远高于行业，但完播率和互动率是普遍短板。30%优秀率说明方法论类内容已跑通，核心问题是一般内容（40%）的价值感表达不够、失败内容（30%）偏离定位。',
          strengths: ['AI工具/效率选题赛道匹配度高，收藏率是均值2倍', '结构化表达能力突出，干货内容长尾流量稳定', '已有6条10w+爆款验证，方法论可复制性强'],
          weaknesses: ['前3秒钩子设计弱，完播率在三类内容中均拖后腿', '约30%内容偏离AI/效率定位，浪费推荐流量', '评论区互动引导不足，爆款后粉丝转化率偏低'],
          direction: '优先收缩选题范围到AI效率赛道，把优秀内容的"结果前置+分点拆解"结构标准化，砍掉偏离定位的生活/vlog类内容。'
        },
        features: {
          title: '内容分级共性规律',
          groups: [
            { label: '优秀内容共性', color: '#c9a14f', items: ['标题含具体数字或对比（"3个免费""提升10倍"）', '开头3秒直接展示结果/效果', '内容为"问题→方案→截图验证"三段式', '结尾有"收藏备用""评论区领资料"引导'] },
            { label: '一般内容共性', color: '#6b95bf', items: ['标题偏教程/盘点，缺乏数字钩子', '开头铺垫过长，2分钟后才进入核心', '有实用信息但结构散，重点不突出', '结尾无明确引导，看完即走'] },
            { label: '失败内容共性', color: '#c96b6b', items: ['标题与AI/效率定位无关（vlog/开箱/感悟）', '开头无钩子，30秒内无信息增量', '内容空洞或纯个人记录，无方法论', '无结尾引导，完全无互动设计'] }
          ]
        },
        gap: {
          title: '账号整体差距诊断',
          summary: '你的优秀内容和一般内容之间的核心差距不是选题方向，而是"开头3秒钩子"和"价值密度表达方式"。失败内容则完全是选题定位问题。',
          items: [
            { dim: '开头钩子', excellent: '结果/对比直接展示', you: '铺垫过长，痛点前置不足', gap: '完播率差26个百分点', action: '每条视频开头必须有"数字+结果"钩子' },
            { dim: '价值表达', excellent: '每30秒一个截图/案例', you: '口播多、实证少', gap: '赞藏比差53个百分点', action: '增加效果对比截图，强化"有用感"' },
            { dim: '选题聚焦', excellent: '100% AI效率赛道', you: '约30%内容偏离赛道', gap: '匹配度差30个百分点', action: '暂停生活/vlog/数码开箱类内容' }
          ]
        },
        template: {
          title: '从优秀内容提炼的可复用框架',
          sections: [
            { label: '标题模板', color: '#c9a14f', items: ['"N个免费AI工具｜替代付费软件"——数字+免费+替代', '"我用AI做XX，老板以为我加班"——场景+反差结果', '"XX关键词词典｜建议收藏"——干货+收藏暗示'] },
            { label: '脚本结构', color: '#6b95bf', items: ['0-3秒：展示最终效果/对比图（强钩子）', '3-30秒：痛点提问+你将得到什么', '30秒-80%：分点讲解，每个点配截图', '最后10%：总结+收藏/关注引导'] },
            { label: '封面建议', color: '#c8b896', items: ['深色背景+亮色大字标题', '包含工具界面截图或效果对比图', '右上角加小标签（"免费""收藏向"）'] },
            { label: '结尾引导', color: '#7ba989', items: ['"觉得有用先收藏，下次用到好找"', '"评论区打XX，发你整理好的资料包"', '"关注我，每周分享AI效率工具"'] }
          ]
        }
      },
      excellent: {
        title: '优秀案例深度拆解',
        chip: '6 条优秀',
        desc: '播放量与赞藏比双高，选题定位精准，完播率是主要提升空间',
        scores: [82, 88, 68, 72, 85],
        baseline: [52, 48, 46, 44, 56],
        color: '#c9a14f',
        heroStats: [
          { value: excellentCases.length, label: '案例数' },
          { value: '27.2w', label: '平均播放' },
          { value: '29.2%', label: '平均赞藏比' },
          { value: '3.8%', label: '平均互动率' }
        ],
        insight: {
          judgment: '6条优秀内容全部命中AI效率赛道，平均播放27.2w、赞藏比29.2%，是账号均值的3倍以上。核心成功因素是"选题精准+价值可视化"，但完播率（68分）说明开头钩子还有提升空间。',
          strengths: ['选题全部聚焦AI工具/效率，受众匹配度极高', '内容配有真实截图和效果对比，"有用感"强', '收藏率远超点赞率，长尾搜索流量稳定'],
          weaknesses: ['前3秒跳出率仍偏高，3条视频开头铺垫超过8秒', '评论区互动较少，用户提问回复不及时', '封面风格不统一，缺乏栏目识别度'],
          direction: '把优秀内容的标题公式和开头结构标准化为SOP，所有新内容先套模板再创作。重点优化前3秒，将完播率从68%提升至75%以上。'
        },
        features: {
          title: '优秀案例共同特征',
          groups: [
            { label: '标题规律', color: '#c9a14f', items: ['含具体数字："3个""12个""10倍"——降低决策成本', '含替代/对比："替代付费""以为我加班"——制造好奇', '含强行动词："建议收藏""实测"——明确价值'] },
            { label: '开头设计', color: '#c9a14f', items: ['"免费替代"系列：直接展示工具效果对比画面', '职场AI系列：开头3秒展示AI生成结果', '教程系列："今天分享12个Prompt"直接列清单'] },
            { label: '内容结构', color: '#c9a14f', items: ['"痛点→工具名→效果截图→操作步骤"四段式', '每30秒一个工具/技巧，节奏紧凑不拖沓', '关键步骤配截图或录屏，降低理解成本'] },
            { label: '结尾引导', color: '#c9a14f', items: ['"建议先收藏"——直接触发收藏行为', '"评论区打XX"——用资料包引导互动', '"关注我"——系列内容引导关注'] }
          ]
        },
        gap: {
          title: '你与优秀内容的差距',
          summary: '对比6条优秀案例和你的8条一般案例，差距集中在三个环节：开头钩子、价值可视化、结尾引导。选题方向基本正确，不需要换赛道。',
          items: [
            { dim: '开头3秒', excellent: '直接展示结果/对比', you: '铺垫5-10秒才进入主题', gap: '前3秒留存差25%', action: '开头必须放"最震撼的画面/数字"' },
            { dim: '价值表达', excellent: '每个点配截图/案例', you: '口播为主，截图偏少', gap: '收藏率差15个百分点', action: '每讲一个点配一张效果截图' },
            { dim: '结尾引导', excellent: '明确"收藏+评论"双引导', you: '自然结束，无引导', gap: '互动率差2.3个百分点', action: '每条结尾必须加1句引导语' }
          ]
        },
        template: {
          title: '可直接复用的模板',
          sections: [
            { label: '标题公式', color: '#c9a14f', items: ['数字+免费/替代："N个免费AI工具｜替代XX"', '场景+反差："我用AI做XX，XX以为我XX"', '干货+收藏暗示："XX词典/清单｜建议收藏"'] },
            { label: '黄金脚本', color: '#6b95bf', items: ['0-3s：结果画面+数字钩子（"这3个工具帮我省了2000块"）', '3-15s：痛点共鸣（"你是不是也遇到过XX问题"）', '15s-80%：分点讲解（每点15-30秒，配截图）', '最后20%：总结+引导（"先收藏，评论区领XX"）'] },
            { label: '封面规范', color: '#c8b896', items: ['深色背景（与账号风格统一）', '左侧大字标题（黄色/白色），右侧工具截图', '统一加角标："免费""实测""收藏向"'] },
            { label: '互动引导', color: '#7ba989', items: ['收藏引导："先收藏，用的时候找不到"', '评论引导："需要资料包评论区打1"', '关注引导："每周四更新AI效率工具"'] }
          ]
        }
      },
      average: {
        title: '一般案例诊断分析',
        chip: '8 条一般',
        desc: '选题方向正确但钩子弱、价值密度不足，有提升空间',
        scores: [48, 35, 42, 38, 55],
        baseline: [52, 48, 46, 44, 56],
        color: '#6b95bf',
        heroStats: [
          { value: averageCases.length, label: '案例数' },
          { value: '4.3w', label: '平均播放' },
          { value: '2.7%', label: '平均赞藏比' },
          { value: '1.5%', label: '平均互动率' }
        ],
        insight: {
          judgment: '8条一般内容选题方向基本正确（AI工具/教程类），但平均播放仅4.3w、赞藏比2.7%，远低于优秀内容。核心问题不是选题错了，而是"开头没钩子+价值表达不够直观"，导致好内容被划走。',
          strengths: ['选题方向基本匹配AI效率赛道，没有跑偏', '内容质量尚可，有一定实用价值', '部分内容（Chrome插件、飞书教程）有精准受众'],
          weaknesses: ['标题缺乏数字和反差，吸引力不足', '开头铺垫过长，前30秒无核心信息', '内容结构松散，缺乏截图和效果对比', '无结尾引导，看完即走不收藏'],
          direction: '一般内容距离优秀只差"包装"——同样的选题，换一个数字标题、加一个3秒结果开头、每点配一张截图，播放量有望提升2-3倍。不需要换方向，需要练表达。'
        },
        features: {
          title: '一般内容典型特征',
          groups: [
            { label: '标题问题', color: '#6b95bf', items: ['过于平淡："入门教程""工作流分享"——无数字无反差', '太个人化："我的XX分享""一周复盘"——受众指向弱', '太泛："AI工具盘点"——缺乏时效性和独特性'] },
            { label: '开头问题', color: '#6b95bf', items: ['Notion教程：前2分钟在讲Notion是什么', 'Midjourney入门：开头在展示软件界面而非作品', '工作流分享：先讲个人经历再讲方法'] },
            { label: '结构问题', color: '#6b95bf', items: ['口播多、演示少，"听了但没看到"', '知识点罗列但没有对比和验证', '重点不突出，观众不知道哪里该截图保存'] },
            { label: '引导缺失', color: '#6b95bf', items: ['自然结束，没有"收藏"提示', '无评论区互动话题', '无系列化预告，无法引导关注'] }
          ]
        },
        gap: {
          title: '从一般到优秀的关键差距',
          summary: '一般内容和优秀内容的选题方向一致，差距完全在"表达方式"上。用优秀内容的模板改造一般内容，不需要增加制作成本，重点改标题、开头和配图。',
          items: [
            { dim: '标题优化', excellent: '"3个免费AI工具｜替代付费"', you: '"AI工具盘点｜2026年6月"', gap: '点击率预计差2-3倍', action: '每个标题必须包含具体数字' },
            { dim: '开头重构', excellent: '0秒直接展示结果', you: '平均45秒铺垫', gap: '完播率差26个百分点', action: '删掉前30秒铺垫，从结果开始' },
            { dim: '增加实证', excellent: '每点配截图', you: '口播为主', gap: '收藏率差8个百分点', action: '每讲一个点配一张效果对比图' }
          ]
        },
        template: {
          title: '一般内容改造方案',
          sections: [
            { label: '标题改写示例', color: '#c9a14f', items: ['"Notion知识库教程" → "3步用Notion搭建个人知识库｜省2000块"', '"我的AI工作流分享" → "每天省2小时的AI工作流｜全流程拆解"', '"AI工具月度盘点" → "6月我最推荐的3个AI工具｜第2个必用"'] },
            { label: '开头速改', color: '#6b95bf', items: ['删除所有"大家好今天给大家分享"类开场白', '第一句话必须包含数字和结果', '第一个画面必须是效果展示，不是软件界面'] },
            { label: '内容补图', color: '#c8b896', items: ['每个知识点配一张截图或录屏GIF', '增加"使用前vs使用后"对比图', '关键步骤加高亮框/箭头指引'] },
            { label: '结尾加引导', color: '#7ba989', items: ['每条加一句"觉得有用先收藏"', '结尾提一个问题引导评论："你最常用哪个工具？"', '系列内容加"下期预告"'] }
          ]
        }
      },
      failed: {
        title: '失败案例避坑分析',
        chip: '6 条失败',
        desc: '选题偏离定位是主因，各维度全面低于基准线',
        scores: [18, 12, 25, 15, 20],
        baseline: [52, 48, 46, 44, 56],
        color: '#c96b6b',
        heroStats: [
          { value: failedCases.length, label: '案例数' },
          { value: '0.3w', label: '平均播放' },
          { value: '1.2%', label: '平均赞藏比' },
          { value: '0.5%', label: '平均互动率' }
        ],
        insight: {
          judgment: '6条失败内容平均播放仅0.3w，核心原因是选题严重偏离AI/效率定位（vlog、开箱、读书感悟、随手拍），平台无法将内容推送给目标受众。不是内容质量差，而是发错了赛道、对错了人群。',
          strengths: ['视频基本制作能力具备（画面/剪辑无硬伤）', '生活类内容制作门槛低、出片快', '书桌布置等内容与效率主题有弱关联'],
          weaknesses: ['与账号AI/效率定位完全不符，粉丝重合度<15%', '无信息增量，纯记录/感悟类内容无收藏价值', '追热点但无个人视角，被头部创作者分流'],
          direction: '立即停止生活vlog/数码开箱/纯感悟类内容。书桌布置类可改造为"效率桌面搭建"角度切入，其他类型建议直接砍掉或发到小号。'
        },
        features: {
          title: '失败案例典型问题',
          groups: [
            { label: '选题偏离', color: '#c96b6b', items: ['咖啡店vlog/日常随手拍——完全无关', 'iPhone开箱——数码红海，无独特角度', '"一天不看手机"挑战——追热点无个人视角'] },
            { label: '价值空洞', color: '#c96b6b', items: ['"读了100本书的感悟"——无书单无方法论', '"今天天气真好"——零信息增量', '"书桌布置分享"——无产品链接无改造逻辑'] },
            { label: '结构问题', color: '#c96b6b', items: ['无钩子设计，开头就是日常画面', '无明确主题，流水账式记录', '无结尾，直接结束'] },
            { label: '定位冲突', color: '#c96b6b', items: ['娱乐类内容打乱账号AI标签', '粉丝看到不相关内容会取关', '平台算法无法准确推荐给目标人群'] }
          ]
        },
        gap: {
          title: '失败内容的根因诊断',
          summary: '失败内容和优秀内容的差距是"从0到1"的问题——不是做得不够好，而是方向错了。不需要优化表达，需要从选题源头调整。',
          items: [
            { dim: '选题匹配', excellent: '100% AI效率赛道', you: '0%匹配，全部偏题', gap: '根本问题', action: '建立选题前检查：这内容和AI/效率有关吗？' },
            { dim: '价值主张', excellent: '看完能直接用', you: '看完无获得感', gap: '赞藏比差28个百分点', action: '每条内容必须回答"观众能学到什么"' },
            { dim: '受众意识', excellent: '精准指向创作者/职场人', you: '无明确受众', gap: '互动率差3.3个百分点', action: '写标题时想清楚"给谁看"' }
          ]
        },
        template: {
          title: '避坑指南与选题红线',
          sections: [
            { label: '❌ 选题红线', color: '#c96b6b', items: ['纯日常vlog/探店/随手拍——无信息增量', '数码开箱/手机测评——红海无优势', '纯感悟/鸡汤/读书心得——无方法论', '热点挑战类——无个人视角不做'] },
            { label: '✅ 改造思路', color: '#7ba989', items: ['书桌布置 → "我的效率桌面搭建｜3个提升专注力的布置细节"', '咖啡店探店 → "适合远程工作的5类咖啡馆｜实测测评"', '读书分享 → "这3本书改变了我的工作方式｜效率类书单"'] },
            { label: '选题前自检', color: '#c9a14f', items: ['这内容和AI/效率/创作者成长有关吗？', '观众看完能学到一个具体方法/工具吗？', '标题里能放一个具体数字吗？', '如果不是我的粉丝，会点进来吗？'] },
            { label: '止损建议', color: '#6b95bf', items: ['已发布的失败内容无需删除，隐藏即可', '未来新内容发布前先过自检清单', '番外内容最多1条/月，且必须与效率弱关联'] }
          ]
        }
      }
    },
    creatorProfile: {
      id:'creator-mobai',
      name:'墨白工作室',
      domains:['AI效率','内容增长','知识拆解'],
      styleTags:['理性拆解','轻量实操','案例驱动','温和表达'],
      audienceTags:['独立创作者','小微团队','效率工具用户'],
      contentHistorySummary:'近 90 天高表现内容集中在 AI 工具、效率流程、创作者成长复盘。收藏率显著高于点赞率，说明观众更看重可复用方法。',
      contentCount:'42',
      bestContent:'42.3w 播放',
      avgFavRate:'6.8%',
      fanGrowth:'+23% / 月'
    },
    // 能力维度 - 更贴近内容创作者（含基准均值与维度解读）
    skillScores: [
      { name:'结构化表达', value:92, avg:65, tag:'核心长板', level:'high', note:'教程/方法论类内容的核心竞争力，逻辑清晰、分层明确' },
      { name:'情绪连接', value:78, avg:60, tag:'潜力维度', level:'mid', note:'有基础共鸣能力，但评论区互动转化不足，缺人格化表达' },
      { name:'信息增量', value:88, avg:62, tag:'核心长板', level:'high', note:'内容干货密度高，收藏率远超同类，用户当工具手册保存' },
      { name:'表现节奏', value:64, avg:58, tag:'最大瓶颈', level:'low', note:'前3秒钩子弱、铺垫过长，直接拖垮完播率和推荐流量' },
      { name:'承接能力', value:71, avg:60, tag:'待补强', level:'mid', note:'爆款后粉丝沉淀率低，系列化栏目和私域承接尚未建立' }
    ],
    skillBaseline: [65, 60, 62, 58, 60],
    // 账号体检结论
    profileDiagnosis: {
      stage:'成长期 · 方法型创作者',
      stageDesc:'你的内容能力处于"单篇爆款稳定，但系列化不足"的阶段。结构化表达和信息增量是核心长板，适合深耕知识拆解类内容。',
      strengths: ['结构化表达能力强，教程/方法论内容完读率高', '信息增量足，收藏率高于同类账号30%', '素材积累扎实，工具类选题可快速产出'],
      weaknesses: ['表现节奏偏慢，前3秒钩子不够强', '情绪连接较弱，评论区互动转化率待提升', '承接能力不足，爆款后粉丝沉淀率不高'],
      direction: '优先补强"表现节奏"，用系列化栏目承接流量，不要急于拓展新赛道'
    },
    // 雷达图AI解释
    radarNarrative: {
      summary: '能力结构呈"知识型创作者"典型特征：两项知识能力（结构化、信息增量）突出，表达和节奏是瓶颈。',
      pattern: '典型的"教程/方法论型"创作者能力画像',
      implications: [
        '适合做"可复用方法"类内容，收藏率会持续高于点赞率',
        '纯娱乐/情绪类内容匹配度低，投入产出比不高',
        '节奏和情绪补强后，播放量天花板可提升40%以上'
      ]
    },
    // 底部三张诊断卡：核心资产、主要瓶颈、优先动作
    diagnosticCards: {
      asset: {
        label: '核心资产',
        status: 'green',
        icon: '◆',
        title: '结构化表达 + 高信息密度',
        evidence: '近20条内容平均完读率68%，收藏率6.8%，高于同类账号均值30%。"ChatGPT Prompt技巧"单条收藏4.8w，"AI副业全流程"收藏3.6w。',
        impact: '这两项能力让你的内容有明确的"保存价值"，适合做长尾流量和搜索流量，粉丝粘性高。',
        fix: '持续放大：把已验证的方法做成系列化模板（如"每周AI工作流"），建立"有用"的账号心智。',
        tags: ['教程类', '方法论', '长尾流量', '高收藏']
      },
      bottleneck: {
        label: '主要瓶颈',
        status: 'yellow',
        icon: '▽',
        title: '表现节奏拖慢流量天花板',
        evidence: '视频类内容前3秒跳出率达52%，而优秀账号普遍在30%以内。"Notion知识库教程"因前2分钟无痛点展示，播放量仅4.8w，同类爆款可达15w+。',
        impact: '内容本身有价值，但观众还没等到核心内容就划走了，导致好内容拿不到大流量。',
        fix: '每条视频前3秒必须放"结果对比/痛点提问/数字钩子"，把最震撼的效果前置。本周刻意练习3条"强开头"脚本。',
        tags: ['前3秒', '钩子设计', '剪辑节奏', '开头优化']
      },
      action: {
        label: '优先动作',
        status: 'blue',
        icon: '→',
        title: '启动"每周AI工作流"系列栏目',
        evidence: 'AI效率赛道匹配度94分，已有3条10w+爆款验证，素材库存可支撑至少8期内容。',
        impact: '系列化能让观众形成追更预期，单条爆款带来的粉丝沉淀率可从当前的0.8%提升至2%以上。',
        fix: '本周完成3件事：①设计固定片头/封面模板 ②写好第1期脚本（用"一天省2小时"做钩子）③周四首发，连发3期看数据反馈。',
        tags: ['本周启动', '固定周四更新', '封面模板', '首期脚本']
      }
    },
    // AI路线导航总结
    routeSummary: {
      currentRoute: 'AI效率工具深耕线',
      currentPosition: '第一阶段：系列化启动',
      progress: 15,
      distance: '距离稳定变现约 4 周',
      coreJudgment: '你已完成方向验证，现在需要把单篇爆款能力升级为系列化栏目，建立稳定的内容辨识度，这是从"偶尔出爆款"到"稳定涨粉"的关键跃迁。',
      marketSignal: '数据情报显示：AI工具类内容本周增长率342%，Prompt类增长率620%，"免费替代"和"对比演示"钩子已被多平台验证，当前路线与市场风向高度吻合。',
      nextMilestone: '第1期系列栏目发布',
      nextMilestoneDistance: '3天',
      strengths: ['方向已验证（3条10w+）', '素材库存充足（可支撑8期）', '收藏率高于均值30%'],
      warnings: ['避免同时开多条线', '前3秒钩子需要刻意练习', '番外数据差不要轻易放弃备选']
    },
    // 路线选择
    routes: [
      { 
        id:'r-main', name:'AI效率工具深耕线', score:94, 
        reason:'能力、素材、受众三项匹配度最高，是当前确定性最强的路线',
        status:'primary',
        tag:'主路线',
        color:'#5ea87a',
        progress: 15,
        currentStage: '系列化启动',
        stages: [
          { name:'方向验证', status:'done', kpi:'3条10w+爆款' },
          { name:'系列化启动', status:'now', kpi:'固定栏目+3期连发' },
          { name:'节奏稳定', status:'next', kpi:'平均播放≥6w' },
          { name:'变现验证', status:'later', kpi:'首个商单/转化' }
        ],
        highlights:['工具测评需求旺盛', '教程类门槛适中', '受众付费意愿强'],
        risks:['工具迭代快需持续更新', '同质化竞争加剧'],
        matchDetails: { ability:96, audience:92, content:94, monetization:88 },
        entryAdvice: '从"免费替代"和"效率对比"切入，建立固定栏目感',
        switchCondition: null
      },
      { 
        id:'r-alt', name:'AI+职场交叉线', score:86, 
        reason:'共情表达能力可复用，是主路线成熟后的最佳并线选择',
        status:'alternative',
        tag:'备选·并线',
        color:'#6b8cb8',
        progress: 0,
        currentStage: '待切入',
        stages: [
          { name:'番外测试', status:'pending', kpi:'2条番外测试数据' },
          { name:'交叉选题', status:'pending', kpi:'职场AI选题系列' },
          { name:'分线运营', status:'pending', kpi:'双栏目稳定更新' }
        ],
        highlights:['共情表达可复用', '职场人群消费力强', '内容生命周期长'],
        risks:['需要真实职场经历', '案例积累周期较长'],
        matchDetails: { ability:82, audience:88, content:85, monetization:90 },
        entryAdvice: '以番外形式穿插测试，不要一开始就独立成线',
        switchCondition: '主路线连续5期平均播放≥6w后，可开始每周1条番外测试'
      },
      { 
        id:'r-wait', name:'生活方式延伸线', score:58, 
        reason:'热度稳定，但与现有账号资产关联弱，需要重新积累',
        status:'observe',
        tag:'观察·远期',
        color:'#c4943a',
        progress: 0,
        currentStage: '暂不切入',
        stages: [
          { name:'单条测试', status:'pending', kpi:'1-2条测试内容' }
        ],
        highlights:['流量稳定', '适合做个人IP延伸'],
        risks:['现有受众重合度低', '需要重新积累素材'],
        matchDetails: { ability:52, audience:48, content:65, monetization:70 },
        entryAdvice: '主路线粉丝破5w后再考虑小范围测试',
        switchCondition: '粉丝破5w + 主路线变现稳定后，可用1-2条内容测试受众反应'
      },
      { 
        id:'r-avoid', name:'娱乐热点追更线', score:24, 
        reason:'短期热度高，但与账号定位偏差大，长期沉淀价值极低',
        status:'avoid',
        tag:'禁行',
        color:'#c75a5a',
        progress: 0,
        currentStage: '不建议',
        stages: [],
        highlights:['短期流量大'],
        risks:['与账号定位偏差大', '粉丝质量低', '无长期沉淀价值'],
        matchDetails: { ability:20, audience:15, content:30, monetization:25 },
        entryAdvice: '完全不建议投入，会打乱账号标签',
        switchCondition: null,
        forbiddenReason: '粉丝重合度<15%，娱乐流量无法转化为你的核心受众，还可能打乱平台标签'
      }
    ],
    // 导航行动卡
    navActions: {
      go: {
        label: '导航动作',
        status: 'green',
        icon: '➤',
        title: '本周：启动"每周AI工作流"栏目',
        desc: '把单篇爆款的工具测评能力系列化，固定周四更新，让观众形成追更预期。第一期从"免费替代付费工具"切入，复用已验证的爆款钩子。',
        tags: ['3天内完成脚本', '周四首发', '固定片头/封面'],
        metric: '下一站：3天后 · 第1期发布'
      },
      supply: {
        label: '补给站',
        status: 'blue',
        icon: '⚡',
        title: '补强：前3秒钩子设计',
        desc: '当前视频前3秒跳出率52%（优秀值<30%），这是拖慢流量天花板的核心瓶颈。每条视频开头必须放"结果对比/痛点提问/数字钩子"，本周刻意练习3条强开头脚本。',
        tags: ['结果对比前置', '数字钩子', '痛点提问'],
        metric: '目标：跳出率降至40%以内'
      },
      forbidden: {
        label: '禁行提醒',
        status: 'yellow',
        icon: '⛔',
        title: '不要同时开多条路线',
        desc: '主路线还在启动阶段，不要急于切入职场或生活方式内容。精力分散会导致每条线都做不深，内容稳定性下降。备选路线要等主路线稳定后再并线。',
        tags: ['单路线推进', '不追短期热点', '番外最多1条/周'],
        metric: '风险：多线作战成功率<20%'
      }
    },
    // 路线进度说明（替代原趋势图叙事）
    routeProgress: {
      summary: '过去6周你完成了方向探索，匹配度从62分提升至92分，现在从"找方向"阶段进入"建壁垒"阶段。系列化是这个阶段的核心任务。',
      milestones: [
        { week:'当前', label:'系列化启动', value:92, desc:'方向已验证，开始建立栏目心智，这是涨粉加速的起点' },
        { week:'第3周', label:'方向收窄', value:76, desc:'放弃多线尝试，聚焦AI效率后数据开始明显上升' },
        { week:'第1周', label:'探索起步', value:62, desc:'多个方向同时测试，内容不稳定，数据波动大' }
      ]
    },
    // 30天成长路径
    growthPath: {
      summary: '基于当前94分的AI效率工具赛道匹配度，建议按"系列化打底→跨赛道测试→稳定变现"三阶段推进，30天内将内容稳定性从82分提升至90分。',
      phases: [
        {
          phase:'第1周', label:'系列化启动', status:'now',
          goal:'建立栏目心智',
          tasks:['完成"每周AI工作流"首期脚本','设计固定片头/封面模板','发布第1期并收集评论反馈'],
          kpi:'首条播放≥8w · 收藏率≥5%'
        },
        {
          phase:'第2-3周', label:'节奏稳定', status:'next',
          goal:'形成更新预期',
          tasks:['固定周四更新，连发3期','测试1条"职场+AI"番外','复盘高完播片段优化剪辑节奏'],
          kpi:'平均播放≥6w · 粉丝增长≥15%'
        },
        {
          phase:'第4周', label:'变现验证', status:'later',
          goal:'测试商业闭环',
          tasks:['尝试1次工具类合作/推广','整理AI工具资料包作为粉丝福利','根据番外数据决定是否开第二条线'],
          kpi:'商单意向≥1 · 番外播放≥3w'
        }
      ],
      risks:[
        { level:'high', text:'避免同时开3个以上方向，精力分散会拉低内容稳定性' },
        { level:'mid', text:'番外篇数据可能低于主栏目，不要因单条数据差就放弃备选赛道' }
      ]
    },
    caseCategories: [
      {
        key:'excellent',
        label:'优秀案例',
        subtitle:'10w+ 播放 · 赞藏 ≥ 播放 1/100',
        icon:'★',
        color:'#c9a14f',
        count: excellentCases.length,
        benchmark:'≥10w 播放 · 赞藏比 ≥1%',
        gaugePct: Math.round(excellentCases.length / allCases.length * 100),
        desc:'选题精准命中用户痛点，标题钩子强，内容有可复用价值，互动率远超基准线。',
        cases: excellentCases
      },
      {
        key:'average',
        label:'一般案例',
        subtitle:'1w-10w 播放 · 赞藏比 1/1000 ~ 1/100',
        icon:'◐',
        color:'#6b95bf',
        count: averageCases.length,
        benchmark:'1w-10w 播放 · 赞藏比 0.1%-1%',
        gaugePct: Math.round(averageCases.length / allCases.length * 100),
        desc:'选题方向基本正确但缺乏强钩子，内容有价值但呈现方式偏平，互动率处于行业中位。',
        cases: averageCases
      },
      {
        key:'failed',
        label:'失败案例',
        subtitle:'全平台 < 1w 播放 · 赞藏比 ≈ 1/1000',
        icon:'×',
        color:'#c96b6b',
        count: failedCases.length,
        benchmark:'<1w 播放 · 赞藏比 ≈0.1%',
        gaugePct: Math.round(failedCases.length / allCases.length * 100),
        desc:'选题偏离受众画像或追热点失败，内容缺乏明确价值主张，播放和互动都远低于基准。',
        cases: failedCases
      }
    ]
  };
})();
