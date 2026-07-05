/**
 * 银发反诈守护人 - 剧情数据文件
 * 包含新手教程 + 4个高频诈骗场景的完整分支剧情
 * 图鉴系统 / 成就系统 / 科普小贴士
 */

const SCENARIOS = {
  tutorial: {
    id: 'tutorial',
    title: '新手教程',
    icon: 'book',
    category: '游戏引导',
    description: '欢迎来到银发反诈守护人！通过这个简短的教程，你将学会如何帮助身边的老人识别和防范各类诈骗。',
    tags: ['新手引导', '玩法介绍', '反诈入门'],
    realCase: {
      title: '关于这款游戏',
      content: '《银发反诈守护人》是一款针对老年群体防诈骗的互动剧情游戏。你将扮演一名"反诈守护人"，在四个真实高发诈骗场景中，通过选择推动剧情发展，帮助老人识破骗局、避免损失。每个场景都有多种结局，你的每一个选择都至关重要！'
    },
    startNode: 'tut_01',
    nodes: {
      tut_01: {
        id: 'tut_01',
        speaker: '系统提示',
        text: '欢迎来到《银发反诈守护人》！如今，针对老年人的诈骗手段层出不穷，保健品骗局、投资理财陷阱、冒充公检法……许多老人因此损失了毕生积蓄。',
        next: 'tut_02',
        autoContinue: true
      },
      tut_02: {
        id: 'tut_02',
        speaker: '系统提示',
        text: '在游戏中，你将扮演一位"反诈守护人"，陪伴老人经历各种诈骗场景。你需要通过对话选择来推动剧情，帮助老人做出正确的决定，避免上当受骗。',
        next: 'tut_03',
        autoContinue: true
      },
      tut_03: {
        id: 'tut_03',
        speaker: '系统提示',
        text: '游戏的核心是"选择"——当出现多个选项时，你需要仔细思考，选择最有利于老人的行动。每个选择都会影响结局：是成功止损、主动举报，还是不幸被骗？让我们来试一个简单的例子：',
        choices: [
          { text: '好的，我想试试看！', next: 'tut_04' },
          { text: '我已经了解了，直接开始吧！', next: 'tut_04' }
        ]
      },
      tut_04: {
        id: 'tut_04',
        speaker: '系统提示',
        text: '很好！你已经掌握了基本玩法。记住：保持警惕、多方核实、及时求助，是防范诈骗的三大法宝。游戏中有4个真实诈骗场景等你挑战，完成场景后还可以解锁图鉴、收集成就。祝你好运，反诈守护人！',
        next: 'tut_04_end',
        autoContinue: true
      },
      tut_04_end: {
        id: 'tut_04_end',
        speaker: '系统提示',
        text: '教程结束。现在请选择一个场景开始你的反诈之旅吧！',
        autoContinue: true
      }
    }
  },

  health_supplement: {
    id: 'health_supplement',
    title: '保健品骗局',
    icon: 'pill',
    category: '健康养生类',
    description: '不法分子利用老年人对健康的关注，通过免费体检、专家讲座等方式，诱导购买高价无效保健品。',
    tags: ['保健品', '健康讲座', '免费体检', '虚假宣传'],
    realCase: {
      title: '真实案例：南京"爱心讲座"骗局',
      content: '2023年，南京警方破获一起特大保健品诈骗案。犯罪团伙以"关爱老人健康"为名，在社区举办免费健康讲座，谎称老人患有各种疾病，推销每套高达9800元的"特效保健品"。经查，这些产品成本仅几十元，受害者超过2000人，涉案金额达2000余万元。'
    },
    startNode: 'hs_01',
    nodes: {
      hs_01: {
        id: 'hs_01',
        speaker: '系统提示',
        text: '张奶奶今年72岁，子女都在外地工作。某天，她接到一个电话，说社区正在举办"关爱老人健康"免费体检活动，邀请她参加。',
        next: 'hs_02',
        autoContinue: true
      },
      hs_02: {
        id: 'hs_02',
        speaker: '张奶奶',
        text: '（犹豫）免费体检？现在还有这么好的事？不过最近确实感觉身体不太舒服，去看看吧。',
        next: 'hs_03',
        autoContinue: true
      },
      hs_03: {
        id: 'hs_03',
        speaker: '系统提示',
        text: '张奶奶来到活动现场，发现有很多同龄老人。一位穿着白大褂的"专家"正在台上激情演讲。',
        next: 'hs_04',
        autoContinue: true
      },
      hs_04: {
        id: 'hs_04',
        speaker: '推销员',
        text: '各位叔叔阿姨，我们这款产品是国家级科研项目，获得了国际专利，能治疗高血压、糖尿病、关节炎，效果立竿见影！今天做活动，原价9800，现在只要4980！',
        choices: [
          { text: '警惕！赶紧提醒张奶奶这是骗局', next: 'hs_05' },
          { text: '先观望，看看其他人怎么说', next: 'hs_06' },
          { text: '觉得价格挺实惠，建议张奶奶买', next: 'hs_07' },
          { text: '拍照取证，收集证据后向监管部门举报', next: 'hs_11' }
        ]
      },
      hs_05: {
        id: 'hs_05',
        speaker: '玩家',
        text: '张奶奶，这肯定是骗局！正规药品不会这样推销，而且价格这么高，您千万别上当。',
        next: 'hs_05a',
        autoContinue: true
      },
      hs_05a: {
        id: 'hs_05a',
        speaker: '张奶奶',
        text: '（将信将疑）你说得对，哪有这么神奇的药……不过他们说得头头是道，还有很多人买呢。',
        choices: [
          { text: '陪张奶奶查询产品资质，用事实说话', next: 'hs_08' },
          { text: '直接带张奶奶离开现场', next: 'hs_09' },
          { text: '建议张奶奶打电话问子女的意见', next: 'hs_10' },
          { text: '帮张奶奶查国家药监局官网核验批号', next: 'hs_12' }
        ]
      },
      hs_06: {
        id: 'hs_06',
        speaker: '玩家',
        text: '先别急着买，看看周围的情况。我发现很多老人都在交钱，但他们的表情似乎有些犹豫。',
        choices: [
          { text: '悄悄和其他老人交流，确认大家的疑虑', next: 'hs_06a' },
          { text: '直接质问推销员产品的具体信息', next: 'hs_06b' },
          { text: '继续观望，等讲座结束再说', next: 'hs_06c' },
          { text: '大声提醒在场老人，揭露骗局套路', next: 'hs_13' }
        ]
      },
      hs_06a: {
        id: 'hs_06a',
        speaker: '其他老人',
        text: '（小声）是啊，我也觉得不太对劲，但是他们说今天不买就没了，我都已经交了定金……',
        next: 'hs_08',
        autoContinue: true
      },
      hs_06b: {
        id: 'hs_06b',
        speaker: '推销员',
        text: '（态度突然变差）这位年轻人，我们这是正规活动，你要是不信可以去查，不要打扰其他叔叔阿姨做决定！',
        choices: [
          { text: '坚持要求查看产品资质和批号', next: 'hs_08' },
          { text: '被驱赶，只能离开', next: 'hs_07' }
        ]
      },
      hs_06c: {
        id: 'hs_06c',
        speaker: '系统提示',
        text: '讲座结束后，推销员开始一对一"攻单"，利用紧迫感逼迫老人现场付款。',
        next: 'hs_07',
        autoContinue: true
      },
      hs_07: {
        id: 'hs_07',
        speaker: '系统提示',
        text: '张奶奶被推销员的说辞打动，花4980元购买了一套"保健品"。回家后子女发现，这些产品只是普通维生素片，根本不值这个价。',
        next: 'hs_07_end',
        autoContinue: true
      },
      hs_07_end: {
        id: 'hs_07_end',
        speaker: '系统提示',
        text: '张奶奶被骗了4980元。子女得知后报警，但追回难度很大。这件事给张奶奶带来了很大的心理打击。',
        ending: 'loss',
        autoContinue: true
      },
      hs_08: {
        id: 'hs_08',
        speaker: '玩家',
        text: '我用手机当场查询了这款产品的批准文号，发现根本不存在！所谓的"国际专利"也是编造的。',
        next: 'hs_08a',
        autoContinue: true
      },
      hs_08a: {
        id: 'hs_08a',
        speaker: '推销员',
        text: '（支支吾吾）这……你们不要乱说！不买就算了，请你们出去！',
        choices: [
          { text: '立即拨打12315举报', next: 'hs_08b' },
          { text: '警告其他老人，带张奶奶离开', next: 'hs_09' }
        ]
      },
      hs_08b: {
        id: 'hs_08b',
        speaker: '系统提示',
        text: '你拨打了12315消费者投诉热线，举报了这个非法销售活动。市场监管部门迅速介入调查。',
        next: 'hs_08b_end',
        autoContinue: true
      },
      hs_08b_end: {
        id: 'hs_08b_end',
        speaker: '系统提示',
        text: '你成功阻止了张奶奶受骗，还举报了这个诈骗团伙！市场监管部门介入后，查封了该团伙，帮助众多老人挽回了损失。你被评为"社区反诈先锋"！',
        ending: 'report',
        autoContinue: true
      },
      hs_09: {
        id: 'hs_09',
        speaker: '系统提示',
        text: '你果断带张奶奶离开了活动现场。虽然推销员在后面大声挽留，但你们没有回头。',
        next: 'hs_09_end',
        autoContinue: true
      },
      hs_09_end: {
        id: 'hs_09_end',
        speaker: '系统提示',
        text: '张奶奶成功避免了被骗。虽然没能阻止其他人受骗，但你保护了张奶奶的财产安全。回去后你给张奶奶普及了保健品诈骗的常见套路。',
        ending: 'success',
        autoContinue: true
      },
      hs_10: {
        id: 'hs_10',
        speaker: '张奶奶',
        text: '（打电话给儿子）喂，儿子，这边有个活动说有一种药特别好，要4980元……',
        next: 'hs_10a',
        autoContinue: true
      },
      hs_10a: {
        id: 'hs_10a',
        speaker: '儿子（电话）',
        text: '妈！千万别买！这就是骗人的！您要买药得去正规医院，让医生开处方。您在哪？我马上过来接您！',
        next: 'hs_10b',
        autoContinue: true
      },
      hs_10b: {
        id: 'hs_10b',
        speaker: '系统提示',
        text: '张奶奶的儿子及时赶到，接走了她。张奶奶没有上当，但她也意识到自己差点就掉进了陷阱。',
        next: 'hs_10b_end',
        autoContinue: true
      },
      hs_10b_end: {
        id: 'hs_10b_end',
        speaker: '系统提示',
        text: '张奶奶成功避免了被骗。这次经历让她明白了：买药要去正规医院和药店，不要轻信所谓的"免费体检"和"专家讲座"。子女们也决定以后多关心母亲的健康。',
        ending: 'success',
        autoContinue: true
      },
      hs_11: {
        id: 'hs_11',
        speaker: '玩家',
        text: '我悄悄拍下了现场照片、产品包装和宣传资料，这些都是重要证据。现在我们就拨打12315举报，不能让更多老人上当！',
        next: 'hs_11a',
        autoContinue: true
      },
      hs_11a: {
        id: 'hs_11a',
        speaker: '系统提示',
        text: '你收集了充分的证据，包括产品照片、宣传单和现场录音，一并提交给了12315。市场监管部门高度重视，表示将立即立案调查。',
        next: 'hs_08b',
        autoContinue: true
      },
      hs_12: {
        id: 'hs_12',
        speaker: '玩家',
        text: '张奶奶，我帮您在国家药监局官网查过了，这个产品根本没有"国药准字"批号，所谓的专利号也是假的，就是三无产品！',
        next: 'hs_08',
        autoContinue: true
      },
      hs_13: {
        id: 'hs_13',
        speaker: '玩家',
        text: '（大声对在场所有人说）各位叔叔阿姨，请大家冷静一下！这个产品没有国家批号，"专家"身份也是假的，这就是典型的保健品诈骗套路！大家不要上当！',
        next: 'hs_13a',
        autoContinue: true
      },
      hs_13a: {
        id: 'hs_13a',
        speaker: '系统提示',
        text: '你的勇敢发声引起了在场老人的注意，不少人开始犹豫。推销员气急败坏，场面一度混乱，但很多老人因此避免了损失。',
        next: 'hs_09',
        autoContinue: true
      }
    }
  },

  investment_scam: {
    id: 'investment_scam',
    title: '养老投资诈骗',
    icon: 'chart',
    category: '金融理财类',
    description: '以"高回报养老项目"为诱饵，诱骗老年人投入毕生积蓄，最终血本无归。',
    tags: ['养老投资', '高回报', '非法集资', '庞氏骗局'],
    realCase: {
      title: '真实案例：上海"以房养老"骗局',
      content: '2022年，上海警方破获一起涉案金额超10亿元的"以房养老"诈骗案。犯罪团伙以"高回报养老理财"为名，诱骗老人将房产抵押贷款后投入所谓的"养老项目"，承诺年化收益率高达15%-20%。实际上这是典型的庞氏骗局，利用新投资人的钱支付老投资人的利息，最终资金链断裂，数百名老人的房产和积蓄化为乌有。'
    },
    startNode: 'is_01',
    nodes: {
      is_01: {
        id: 'is_01',
        speaker: '系统提示',
        text: '王爷爷今年68岁，退休后攒了一笔养老钱。最近，他在社区活动中心认识了一位自称"理财顾问"的小李，对方非常热情。',
        next: 'is_02',
        autoContinue: true
      },
      is_02: {
        id: 'is_02',
        speaker: '小李',
        text: '王爷爷，您这笔钱放银行利息太低了！我这边有个养老投资计划，专门为老年人设计的，年化收益15%，比银行高好几倍，好多退休干部都投了！',
        choices: [
          { text: '提醒王爷爷，高收益意味着高风险', next: 'is_03' },
          { text: '先了解具体是什么项目', next: 'is_04' },
          { text: '觉得机会难得，建议王爷爷试试', next: 'is_05' },
          { text: '上网搜索这家公司的口碑和评价', next: 'is_11' }
        ]
      },
      is_03: {
        id: 'is_03',
        speaker: '玩家',
        text: '王爷爷，收益越高风险越大，正规理财产品的年化收益一般不会超过5%，15%的收益太离谱了。',
        next: 'is_03a',
        autoContinue: true
      },
      is_03a: {
        id: 'is_03a',
        speaker: '王爷爷',
        text: '（犹豫）可是小李说好多人都赚到钱了，还给我看了别人收到的利息截图……',
        choices: [
          { text: '帮王爷爷查这个公司的工商信息', next: 'is_06' },
          { text: '带王爷爷去正规银行咨询', next: 'is_07' },
          { text: '直接劝阻王爷爷不要投', next: 'is_08' },
          { text: '建议王爷爷先和子女商量再做决定', next: 'is_12' }
        ]
      },
      is_04: {
        id: 'is_04',
        speaker: '小李',
        text: '我们公司是做养老地产的，现在在郊区建了一个高端养老社区，现在认购就能享受原始股待遇。等项目建成了，房价翻倍，收益翻倍！',
        choices: [
          { text: '质疑项目真实性，要求看实地照片', next: 'is_06' },
          { text: '觉得项目不错，帮王爷爷分析', next: 'is_04a' },
          { text: '被说服了，建议王爷爷投资', next: 'is_05' },
          { text: '要求实地考察所谓"养老社区"', next: 'is_13' }
        ]
      },
      is_04a: {
        id: 'is_04a',
        speaker: '玩家',
        text: '王爷爷，这听起来像是"画饼"呢。我们得小心，查清楚再说。',
        next: 'is_06',
        autoContinue: true
      },
      is_05: {
        id: 'is_05',
        speaker: '系统提示',
        text: '王爷爷被高收益打动，将30万养老积蓄全部投入了所谓的"养老项目"。',
        next: 'is_05a',
        autoContinue: true
      },
      is_05a: {
        id: 'is_05a',
        speaker: '系统提示',
        text: '三个月后，小李失联了，公司人去楼空。王爷爷的30万养老钱打了水漂。经查，这是一个典型的非法集资骗局，受害者遍布全国。',
        next: 'is_05_end',
        autoContinue: true
      },
      is_05_end: {
        id: 'is_05_end',
        speaker: '系统提示',
        text: '王爷爷失去了30万养老积蓄，这对他的晚年生活造成了巨大影响。他陷入了深深的自责和抑郁。这个故事告诉我们：天上不会掉馅饼，高收益必然伴随高风险。',
        ending: 'loss',
        autoContinue: true
      },
      is_06: {
        id: 'is_06',
        speaker: '玩家',
        text: '我查了一下这家公司的工商信息，发现它注册才半年，而且有多条经营异常记录。这个所谓的"养老项目"根本没有备案！',
        next: 'is_06a',
        autoContinue: true
      },
      is_06a: {
        id: 'is_06a',
        speaker: '王爷爷',
        text: '（震惊）什么？那小李说他同事都投了……我去问问邻居，看有没有人知道这个公司。',
        choices: [
          { text: '建议王爷爷立即报警', next: 'is_09' },
          { text: '在社区群发提醒，防止更多人上当', next: 'is_10' },
          { text: '带王爷爷去银行核实账户安全', next: 'is_07' }
        ]
      },
      is_07: {
        id: 'is_07',
        speaker: '银行工作人员',
        text: '王先生，这个所谓的"养老项目"我们银行从来没有听说过。正规的理财产品都有备案，收益也不会这么高。您千万不要把钱转给对方，这很可能是诈骗！',
        next: 'is_07_end',
        autoContinue: true
      },
      is_07_end: {
        id: 'is_07_end',
        speaker: '系统提示',
        text: '在银行工作人员的帮助下，王爷爷认清了骗局。他保住了自己的养老钱，还对理财有了更清晰的认识。王爷爷决定以后理财一定通过正规渠道。',
        ending: 'success',
        autoContinue: true
      },
      is_08: {
        id: 'is_08',
        speaker: '王爷爷',
        text: '你说得对，我还是把钱存银行放心。虽然利息低点，但至少不会没了。',
        next: 'is_08_end',
        autoContinue: true
      },
      is_08_end: {
        id: 'is_08_end',
        speaker: '系统提示',
        text: '王爷爷避免了上当受骗。虽然没有损失，但小李的甜言蜜语还是让他有些动摇。你帮助王爷爷提高了警惕心。',
        ending: 'success',
        autoContinue: true
      },
      is_09: {
        id: 'is_09',
        speaker: '系统提示',
        text: '王爷爷在你的建议下立即报警。警方迅速介入调查，发现这是一个跨省作案的非法集资团伙。',
        next: 'is_09_end',
        autoContinue: true
      },
      is_09_end: {
        id: 'is_09_end',
        speaker: '系统提示',
        text: '警方成功捣毁了这个非法集资团伙，抓获犯罪嫌疑人15名，冻结涉案资金8000余万元。王爷爷不仅保住了自己的钱，还帮助警方破获了一个大案！',
        ending: 'report',
        autoContinue: true
      },
      is_10: {
        id: 'is_10',
        speaker: '系统提示',
        text: '你在社区群里发布了反诈提醒，揭露了小李公司的骗局。社区里好几位老人看到后，都及时停止了转账。',
        next: 'is_10_end',
        autoContinue: true
      },
      is_10_end: {
        id: 'is_10_end',
        speaker: '系统提示',
        text: '你不仅保护了王爷爷，还帮助了社区其他老人避免了损失。社区居委会对你的行为给予了高度赞扬，并邀请你开展反诈知识讲座。',
        ending: 'report',
        autoContinue: true
      },
      is_11: {
        id: 'is_11',
        speaker: '玩家',
        text: '王爷爷，我帮您在网上搜了一下这家公司，发现已经有好多人在论坛发帖说被骗了，资金取不出来，公司电话也打不通。这就是个彻头彻尾的骗局！',
        next: 'is_11a',
        autoContinue: true
      },
      is_11a: {
        id: 'is_11a',
        speaker: '王爷爷',
        text: '（震惊地看着手机屏幕）这么多人被骗……我差点就成了下一个。还好你帮我查了，不然我这辈子攒的钱就全没了！',
        next: 'is_06',
        autoContinue: true
      },
      is_12: {
        id: 'is_12',
        speaker: '玩家',
        text: '王爷爷，投资这么大的事，您应该先和子女商量一下。我们给您儿子打个电话吧，听听家人的意见再做决定也不迟。',
        next: 'is_08',
        autoContinue: true
      },
      is_13: {
        id: 'is_13',
        speaker: '玩家',
        text: '小李，你说的养老社区在什么地方？具体地址是什么？我们想去实地看看。如果项目这么好，看一看总可以吧？',
        next: 'is_13a',
        autoContinue: true
      },
      is_13a: {
        id: 'is_13a',
        speaker: '小李',
        text: '（支支吾吾）这个……项目还在建设中，现在不方便参观。你们要是不信，那就算了，反正名额有限，别人抢着要呢！',
        next: 'is_06',
        autoContinue: true
      }
    }
  },

  fake_authority: {
    id: 'fake_authority',
    title: '冒充公检法诈骗',
    icon: 'shield',
    category: '身份冒充类',
    description: '诈骗分子冒充公安、检察院、法院等国家机关工作人员，以涉嫌犯罪为由恐吓老年人转账。',
    tags: ['冒充公检法', '安全账户', '通缉令', '恐吓威胁'],
    realCase: {
      title: '真实案例：广州"冒充警察"诈骗案',
      content: '2023年，广州一位70岁的李奶奶接到自称"公安局"的电话，对方称她的身份证被用于洗钱犯罪，要求她将全部存款转入"安全账户"配合调查。李奶奶在对方持续恐吓下，先后转账共计120万元。直到家人发现异常报警，才意识到被骗。警方提醒：公检法机关不会通过电话办案，更不存在所谓的"安全账户"。'
    },
    startNode: 'fa_01',
    nodes: {
      fa_01: {
        id: 'fa_01',
        speaker: '系统提示',
        text: '李奶奶今年70岁，独自居住。一天下午，她接到一个陌生电话，对方自称是"市公安局刑侦支队"的警官。',
        next: 'fa_02',
        autoContinue: true
      },
      fa_02: {
        id: 'fa_02',
        speaker: '假警察（电话）',
        text: '您好，是李XX吗？我是市公安局刑侦支队的王警官，警号035218。您的身份证被冒用，涉嫌一起重大洗钱案，需要您配合调查！',
        choices: [
          { text: '识破骗局，提醒李奶奶这是诈骗', next: 'fa_03' },
          { text: '半信半疑，建议李奶奶先核实对方身份', next: 'fa_04' },
          { text: '慌了，建议李奶奶配合调查', next: 'fa_05' },
          { text: '记下对方警号和单位，打114核实真伪', next: 'fa_09' }
        ]
      },
      fa_03: {
        id: 'fa_03',
        speaker: '玩家',
        text: '李奶奶，这是典型的冒充公检法诈骗！真正的警察不会通过电话办案，更不会让您转账。您直接挂电话就行！',
        next: 'fa_03a',
        autoContinue: true
      },
      fa_03a: {
        id: 'fa_03a',
        speaker: '李奶奶',
        text: '（紧张）可是……他知道我的名字和身份证号，还说如果我不配合就会来抓我。',
        choices: [
          { text: '陪李奶奶去派出所核实', next: 'fa_06' },
          { text: '直接挂电话，帮李奶奶拉黑号码', next: 'fa_07' },
          { text: '让李奶奶打电话给子女确认', next: 'fa_08' },
          { text: '教李奶奶用国家反诈中心APP查这个号码', next: 'fa_10' }
        ]
      },
      fa_04: {
        id: 'fa_04',
        speaker: '玩家',
        text: '李奶奶，先别慌。我们打110核实一下，看看是不是真的有这个王警官。',
        next: 'fa_04a',
        autoContinue: true
      },
      fa_04a: {
        id: 'fa_04a',
        speaker: '假警察（电话）',
        text: '（突然严厉）你旁边有人吗？这个案件涉及国家机密，你千万不要告诉任何人，否则后果自负！现在立刻把钱转到安全账户，不然我们马上来抓你！',
        choices: [
          { text: '识破威胁，直接挂断并报警', next: 'fa_06' },
          { text: '被吓到了，劝李奶奶配合', next: 'fa_05' },
          { text: '记录对方所有信息，立即拨打110', next: 'fa_11' }
        ]
      },
      fa_05: {
        id: 'fa_05',
        speaker: '系统提示',
        text: '李奶奶在恐惧中听从了对方的指示，将银行卡里的45万元转到了所谓的"安全账户"。',
        next: 'fa_05a',
        autoContinue: true
      },
      fa_05a: {
        id: 'fa_05a',
        speaker: '系统提示',
        text: '转账完成后，对方电话再也打不通了。李奶奶这才意识到被骗，瘫坐在地上痛哭。45万是她一辈子的积蓄，如今只剩下空空的银行卡。',
        next: 'fa_05_end',
        autoContinue: true
      },
      fa_05_end: {
        id: 'fa_05_end',
        speaker: '系统提示',
        text: '李奶奶被骗走了45万元的毕生积蓄。这一事件给她造成了巨大的心理创伤。请记住：公检法机关不会通过电话办案，更不会要求转账到"安全账户"！',
        ending: 'loss',
        autoContinue: true
      },
      fa_06: {
        id: 'fa_06',
        speaker: '派出所民警',
        text: '李奶奶，您遇到的是典型的冒充公检法诈骗。我们公安机关办案都有正规程序，绝不会通过电话要求转账。您做得对，来核实是最正确的选择！',
        next: 'fa_06a',
        autoContinue: true
      },
      fa_06a: {
        id: 'fa_06a',
        speaker: '系统提示',
        text: '李奶奶在派出所确认了这是骗局，心有余悸但庆幸没有上当。民警还帮她安装了国家反诈中心APP，教她识别诈骗电话。',
        next: 'fa_06a_end',
        autoContinue: true
      },
      fa_06a_end: {
        id: 'fa_06a_end',
        speaker: '系统提示',
        text: '李奶奶成功识破了骗局，保住了自己的积蓄！她还成为了社区的反诈宣传员，用自己的经历提醒其他老人不要上当。',
        ending: 'report',
        autoContinue: true
      },
      fa_07: {
        id: 'fa_07',
        speaker: '系统提示',
        text: '你帮李奶奶挂断了诈骗电话，并将来电号码加入了黑名单。但李奶奶还是很不安，担心会不会真的有事。',
        next: 'fa_07a',
        autoContinue: true
      },
      fa_07a: {
        id: 'fa_07a',
        speaker: '玩家',
        text: '李奶奶，您放心，这绝对是诈骗。公检法不会电话办案，也不会要求转账。您要是还不放心，我陪您去派出所问问。',
        next: 'fa_07_end',
        autoContinue: true
      },
      fa_07_end: {
        id: 'fa_07_end',
        speaker: '系统提示',
        text: '李奶奶的钱保住了，但她的内心还是有些不安。你帮她下载了反诈APP，并告诉她以后遇到类似情况要先和子女或社区联系。',
        ending: 'success',
        autoContinue: true
      },
      fa_08: {
        id: 'fa_08',
        speaker: '李奶奶',
        text: '（打电话给女儿）闺女，有个警察说我涉嫌洗钱，让我把钱转到安全账户……',
        next: 'fa_08a',
        autoContinue: true
      },
      fa_08a: {
        id: 'fa_08a',
        speaker: '女儿（电话）',
        text: '妈！这是诈骗！您千万别转账！警察不会这样办案的，我马上回来！您先挂电话，什么操作都不要做！',
        next: 'fa_08_end',
        autoContinue: true
      },
      fa_08_end: {
        id: 'fa_08_end',
        speaker: '系统提示',
        text: '女儿及时阻止了李奶奶转账。虽然避免了财产损失，但这次经历也让李奶奶受到了惊吓。女儿决定以后多陪伴母亲，并帮母亲设置了手机防骚扰功能。',
        ending: 'success',
        autoContinue: true
      },
      fa_09: {
        id: 'fa_09',
        speaker: '玩家',
        text: '李奶奶，我们打114查一下市公安局的公开电话，然后打过去问问有没有这个警号的王警官，是真是假一问便知。',
        next: 'fa_09a',
        autoContinue: true
      },
      fa_09a: {
        id: 'fa_09a',
        speaker: '系统提示',
        text: '你帮李奶奶拨打了114，获取了市公安局的官方电话。打过去一问，对方明确表示：没有这个警号，也没有这个案件，这是典型的诈骗电话！',
        next: 'fa_06',
        autoContinue: true
      },
      fa_10: {
        id: 'fa_10',
        speaker: '玩家',
        text: '李奶奶，我帮您下载国家反诈中心APP，这个APP可以自动识别诈骗电话。您看，刚才那个号码已经被标记为"诈骗电话"了，好多人都举报过！',
        next: 'fa_07',
        autoContinue: true
      },
      fa_11: {
        id: 'fa_11',
        speaker: '玩家',
        text: '我一边安抚李奶奶，一边悄悄记下了对方的电话号码、警号和说辞。这些信息对警方破案非常重要。现在立刻拨打110！',
        next: 'fa_11a',
        autoContinue: true
      },
      fa_11a: {
        id: 'fa_11a',
        speaker: '系统提示',
        text: '你详细记录了诈骗分子的所有信息，包括来电号码、自称警号、威胁话术等，并第一时间拨打了110。警方表示这些线索对追踪诈骗团伙非常有价值。',
        next: 'fa_06',
        autoContinue: true
      }
    }
  },

  lottery_sms: {
    id: 'lottery_sms',
    title: '中奖短信诈骗',
    icon: 'gift',
    category: '电信诈骗类',
    description: '通过短信、电话等方式通知中奖，要求先缴纳手续费、税费等，诱骗老年人转账。',
    tags: ['中奖诈骗', '短信诈骗', '手续费', '虚假抽奖'],
    realCase: {
      title: '真实案例：北京"央视抽奖"短信诈骗',
      content: '2023年，北京一位65岁的赵爷爷收到一条短信，称其手机号被央视"星光大道"抽中为幸运观众，获得奖金18万元和笔记本电脑一台。赵爷爷按照短信提示联系"客服"后，对方要求先缴纳个人所得税和保证金共计2.8万元。赵爷爷信以为真，转账后对方失联。警方提醒：正规中奖不会要求先交钱，凡是要求先转账的都是诈骗。'
    },
    startNode: 'ls_01',
    nodes: {
      ls_01: {
        id: 'ls_01',
        speaker: '系统提示',
        text: '赵爷爷今年65岁，平时喜欢用手机看视频。这天，他收到了一条短信，内容让他激动不已。',
        next: 'ls_02',
        autoContinue: true
      },
      ls_02: {
        id: 'ls_02',
        speaker: '赵爷爷',
        text: '（兴奋地拿手机给你看）你看你看！我中奖了！"恭喜您被《星光大道》抽中为幸运观众，获得奖金18万元！"这可是央视的节目，应该不会骗人吧？',
        choices: [
          { text: '明确告诉赵爷爷这是诈骗短信', next: 'ls_03' },
          { text: '陪赵爷爷分析短信的可疑之处', next: 'ls_04' },
          { text: '替赵爷爷高兴，鼓励他联系领奖', next: 'ls_05' },
          { text: '帮赵爷爷分析短信发送号码是否为官方号码', next: 'ls_09' }
        ]
      },
      ls_03: {
        id: 'ls_03',
        speaker: '玩家',
        text: '赵爷爷，这100%是诈骗短信！央视的抽奖活动不会通过短信通知，而且正规中奖也不需要先交钱。',
        next: 'ls_03a',
        autoContinue: true
      },
      ls_03a: {
        id: 'ls_03a',
        speaker: '赵爷爷',
        text: '（不太相信）可是短信上说有公证处公证，还有编号……我这辈子还没中过这么大的奖呢。',
        choices: [
          { text: '帮赵爷爷打官方电话核实', next: 'ls_06' },
          { text: '给赵爷爷看类似诈骗案例', next: 'ls_07' },
          { text: '直接删除短信，不再理会', next: 'ls_08' },
          { text: '搜索网上类似诈骗新闻给赵爷爷看', next: 'ls_10' }
        ]
      },
      ls_04: {
        id: 'ls_04',
        speaker: '玩家',
        text: '赵爷爷，我们来分析一下：第一，您有报名参加这个节目吗？没有报名怎么可能中奖？第二，中奖短信的号码是私人手机号，不是官方号码。',
        next: 'ls_04a',
        autoContinue: true
      },
      ls_04a: {
        id: 'ls_04a',
        speaker: '赵爷爷',
        text: '（开始冷静）你说得对……我确实没报过名。可是他们怎么知道我的手机号呢？',
        choices: [
          { text: '解释诈骗分子通过非法渠道获取信息', next: 'ls_06' },
          { text: '建议赵爷爷先打短信里的电话试探', next: 'ls_04b' }
        ]
      },
      ls_04b: {
        id: 'ls_04b',
        speaker: '假客服（电话）',
        text: '您好！恭喜您中奖！请先缴纳个人所得税2800元到指定账户，我们会在24小时内将18万奖金打入您的账户。',
        choices: [
          { text: '这明显是诈骗，挂电话并报警', next: 'ls_06' },
          { text: '赵爷爷觉得对方态度很好，想转账', next: 'ls_05' }
        ]
      },
      ls_05: {
        id: 'ls_05',
        speaker: '系统提示',
        text: '赵爷爷按照对方要求，将2800元"税费"转到了指定账户。',
        next: 'ls_05a',
        autoContinue: true
      },
      ls_05a: {
        id: 'ls_05a',
        speaker: '系统提示',
        text: '转账后，对方又以"保证金"、"手续费"等名义要求赵爷爷继续转钱。赵爷爷前前后后转了3万多元，直到对方电话再也打不通……',
        next: 'ls_05_end',
        autoContinue: true
      },
      ls_05_end: {
        id: 'ls_05_end',
        speaker: '系统提示',
        text: '赵爷爷被骗了3万多元。虽然金额不算特别大，但这件事让他备受打击，感觉自己的信任被利用了。请记住：天上不会掉馅饼，中奖不会先交钱！',
        ending: 'loss',
        autoContinue: true
      },
      ls_06: {
        id: 'ls_06',
        speaker: '玩家',
        text: '赵爷爷，我帮您打央视的官方电话核实了，他们说根本没有这个抽奖活动。这就是诈骗短信，我们报警吧！',
        next: 'ls_06a',
        autoContinue: true
      },
      ls_06a: {
        id: 'ls_06a',
        speaker: '赵爷爷',
        text: '（恍然大悟）原来是这样！还好有你在，不然我差点就上当了。那我们现在报警吧，不能让这些人继续骗人！',
        next: 'ls_06a_end',
        autoContinue: true
      },
      ls_06a_end: {
        id: 'ls_06a_end',
        speaker: '系统提示',
        text: '你帮赵爷爷识破了骗局，并陪同他一起去派出所报案。警方根据线索展开调查，最终打掉了一个跨境电信诈骗团伙。赵爷爷的警惕性也大大提高了！',
        ending: 'report',
        autoContinue: true
      },
      ls_07: {
        id: 'ls_07',
        speaker: '玩家',
        text: '赵爷爷，您看，这是之前类似的诈骗案例。骗子的套路都是一样的：先说你中奖了，然后让你交各种费用，最后钱一到手就消失。',
        next: 'ls_07a',
        autoContinue: true
      },
      ls_07a: {
        id: 'ls_07a',
        speaker: '赵爷爷',
        text: '（认真看完案例）原来这么多人被骗过……我差点也成了受害者。谢谢你给我看这些，以后我再也不信这种短信了。',
        next: 'ls_07_end',
        autoContinue: true
      },
      ls_07_end: {
        id: 'ls_07_end',
        speaker: '系统提示',
        text: '赵爷爷通过真实案例学到了教训，不仅自己没有上当，还主动在社区里提醒其他老人不要相信中奖短信。',
        ending: 'success',
        autoContinue: true
      },
      ls_08: {
        id: 'ls_08',
        speaker: '系统提示',
        text: '你帮赵爷爷删除了诈骗短信，但赵爷爷心里还是有些遗憾，总想着万一真的是中奖了呢……',
        choices: [
          { text: '继续给赵爷爷科普反诈知识', next: 'ls_07' },
          { text: '到此为止，赵爷爷已经没有损失', next: 'ls_08_end' }
        ]
      },
      ls_08_end: {
        id: 'ls_08_end',
        speaker: '系统提示',
        text: '赵爷爷虽然没有被骗，但对"中奖"这件事还是念念不忘。几天后，他又收到了类似短信，这次他犹豫了……',
        ending: 'partial',
        autoContinue: true
      },
      ls_09: {
        id: 'ls_09',
        speaker: '玩家',
        text: '赵爷爷您看，这个发短信的号码是170开头的虚拟运营商号码，正规电视台、银行不会用这种号码发通知。而且短信里的链接域名也很可疑，明显是钓鱼网站。',
        next: 'ls_09a',
        autoContinue: true
      },
      ls_09a: {
        id: 'ls_09a',
        speaker: '赵爷爷',
        text: '（仔细看号码）还真是……我光顾着高兴了，都没注意这些细节。差点被18万冲昏了头脑！',
        next: 'ls_06',
        autoContinue: true
      },
      ls_10: {
        id: 'ls_10',
        speaker: '玩家',
        text: '赵爷爷，我帮您搜了一下，网上有大量一模一样的"星光大道中奖"诈骗案例。光今年就有上百起，套路完全一样：先发短信说中奖，然后让你交各种费用。',
        next: 'ls_07',
        autoContinue: true
      }
    }
  }
};

/**
 * 结局定义
 */
const ENDINGS = {
  loss: {
    id: 'loss',
    type: 'loss',
    title: '被骗损失',
    icon: 'alert',
    color: '#DC2626',
    description: '老人不幸上当受骗，造成了财产损失。',
    message: '可惜，这次没能阻止诈骗。但每一次失败都是教训，让我们记住这些套路，下次一定能做得更好！'
  },
  success: {
    id: 'success',
    type: 'success',
    title: '成功止损',
    icon: 'check',
    color: '#16A34A',
    description: '成功帮助老人识破骗局，避免了财产损失。',
    message: '太好了！你成功帮助老人避免了财产损失。继续保持警惕，守护更多人的财产安全！'
  },
  report: {
    id: 'report',
    type: 'report',
    title: '主动举报',
    icon: 'star',
    color: '#CA8A04',
    description: '不仅保护了老人，还主动举报，帮助警方打击犯罪。',
    message: '了不起！你不仅保护了老人，还主动举报了诈骗团伙，让更多人免受其害。你是真正的反诈英雄！'
  },
  partial: {
    id: 'partial',
    type: 'partial',
    title: '部分成功',
    icon: 'warning',
    color: '#EA580C',
    description: '虽然避免了直接损失，但老人仍心存疑虑，需要持续关注。',
    message: '虽然暂时避免了损失，但老人的防范意识还不够强。反诈教育需要持续进行，不能掉以轻心。'
  }
};

/**
 * 反诈图鉴数据
 * 每个条目包含：套路分析、诈骗话术、心理弱点、预警信号、处置步骤
 */
const ENCYCLOPEDIA = {
  health_supplement: {
    id: 'health_supplement',
    title: '保健品骗局',
    icon: 'pill',
    content: '常见套路：\n1. 免费体检/讲座吸引老人参与\n2. "专家"夸大病情制造恐慌\n3. 虚假宣传产品功效\n4. 利用从众心理和紧迫感推销\n\n防范要点：\n- 买药去正规医院和药店\n- 不轻信"免费"活动\n- 查产品批准文号（国药准字）\n- 大额消费前与子女商量',
    tips: ['认准"国药准字"批号', '警惕"免费体检"陷阱', '不轻信"特效药"宣传', '购药选择正规渠道'],
    scammerScripts: [
      '这款产品是国家重点科研项目，获得了国际专利！',
      '今天活动最后一天，明天就恢复原价9800了，错过就没有了！',
      '隔壁的张阿姨用了都说好，高血压都降下来了！',
      '我们是正规公司，有营业执照，您放心购买就行！'
    ],
    psychology: '健康焦虑心理、从众心理、贪小便宜心理（免费体检吸引）、权威崇拜心理（信任"专家"白大褂）',
    warningSigns: [
      '宣称产品能"包治百病"，治疗多种不相关的疾病',
      '以"免费体检""免费讲座"为名吸引老人参加',
      '制造紧迫感，声称"限量""最后一天"',
      '产品包装上没有"国药准字"批准文号'
    ],
    preventionSteps: [
      '立即停止支付，保留产品包装和付款凭证作为证据',
      '拨打12315消费者投诉热线举报',
      '陪同老人前往正规医院做体检，消除健康焦虑',
      '向社区和亲友宣传，防止更多人上当'
    ]
  },
  investment_scam: {
    id: 'investment_scam',
    title: '养老投资诈骗',
    icon: 'chart',
    content: '常见套路：\n1. 以高回报为诱饵吸引投资\n2. 伪造项目背景和资质\n3. 利用"熟人"关系获取信任\n4. 庞氏骗局——用新钱还旧账\n\n防范要点：\n- 理财选择正规金融机构\n- 年化收益超过6%需警惕\n- 查询企业工商信息\n- 不轻信"内部渠道"',
    tips: ['选择正规金融机构', '警惕"保本高收益"承诺', '查询企业工商注册信息', '投资前咨询专业人士'],
    scammerScripts: [
      '年化收益15%，比银行高好几倍，好多退休干部都投了！',
      '这个是内部渠道，一般人我不告诉他，名额有限！',
      '您看这是其他投资人收到的利息，每个月准时到账！',
      '钱放银行只会贬值，投资我们的项目才能保值增值！'
    ],
    psychology: '贪小便宜心理（高收益诱惑）、从众心理（"别人都投了"）、信任心理（利用"熟人"关系）、养老焦虑心理',
    warningSigns: [
      '承诺年化收益率远超银行理财（通常超过6%-8%）',
      '项目信息模糊，无法提供实地考察或详细资料',
      '催促尽快决策，制造"错过就没有"的紧迫感',
      '公司注册时间短，工商信息存在经营异常记录'
    ],
    preventionSteps: [
      '立即停止转账，保存所有聊天记录和转账凭证',
      '拨打110报警，同时向银保监会举报',
      '前往正规银行咨询，了解合法理财渠道',
      '在社区群发布提醒，防止其他老人继续受骗'
    ]
  },
  fake_authority: {
    id: 'fake_authority',
    title: '冒充公检法诈骗',
    icon: 'shield',
    content: '常见套路：\n1. 冒充公安/检察院/法院人员\n2. 声称事主涉嫌犯罪\n3. 要求配合调查并保密\n4. 诱导转账至"安全账户"\n\n防范要点：\n- 公检法不会电话办案\n- 不存在"安全账户"\n- 可拨打110核实\n- 安装国家反诈中心APP',
    tips: ['公检法不会电话办案', '不存在"安全账户"', '遇事拨打110核实', '安装反诈APP'],
    scammerScripts: [
      '您好，我是市公安局刑侦支队的，您的身份证涉嫌洗钱犯罪！',
      '这个案件涉及国家机密，你千万不要告诉任何人，否则后果自负！',
      '请立刻把钱转到我们的安全账户配合调查，调查清楚后全额返还！',
      '如果你不配合，我们马上发通缉令，到时候会有人上门抓你！'
    ],
    psychology: '恐惧心理（害怕被逮捕）、权威服从心理（对公检法的敬畏）、信息差利用（老人不了解办案流程）、孤立心理（要求保密不告诉家人）',
    warningSigns: [
      '自称公检法人员，但通过电话/网络办案而非当面',
      '要求将资金转入所谓的"安全账户"',
      '以"保密"为由，禁止与家人或他人沟通',
      '通过微信/QQ发送伪造的"通缉令""逮捕令"'
    ],
    preventionSteps: [
      '立即挂断电话，不要透露任何个人信息',
      '拨打110或前往就近派出所核实情况',
      '下载国家反诈中心APP，开启来电预警功能',
      '告知家人和社区工作人员，寻求帮助和支持'
    ]
  },
  lottery_sms: {
    id: 'lottery_sms',
    title: '中奖短信诈骗',
    icon: 'gift',
    content: '常见套路：\n1. 发送虚假中奖短信/电话\n2. 冒充知名节目或公司\n3. 要求缴纳"税费""手续费"\n4. 收到钱后失联\n\n防范要点：\n- 没参加过的活动不可能中奖\n- 中奖不会要求先交钱\n- 向官方渠道核实\n- 不点击陌生链接',
    tips: ['不轻信中奖信息', '不向陌生人转账', '核实官方渠道', '不点击陌生链接'],
    scammerScripts: [
      '恭喜您被《星光大道》抽中为幸运观众，获得奖金18万元！',
      '请先缴纳个人所得税2800元，奖金会在24小时内到账！',
      '由于您是老年用户，我们特别为您保留了领奖名额！',
      '这是公证处公证过的，有编号可以查询，绝对真实有效！'
    ],
    psychology: '贪小便宜心理（中奖喜悦）、侥幸心理（"万一真中了呢"）、信息盲区（不了解正规中奖流程）、权威信任心理（冒充知名节目）',
    warningSigns: [
      '短信发送号码为私人手机号或虚拟运营商号码',
      '要求先缴纳"税费""手续费""保证金"才能领奖',
      '短信中包含可疑链接，要求点击填写个人信息',
      '没有参加过任何抽奖活动却收到中奖通知'
    ],
    preventionSteps: [
      '不要回复短信，不要点击任何链接',
      '通过官方渠道（如电视台官网、客服电话）核实真伪',
      '将诈骗短信转发至12321网络不良与垃圾信息举报中心',
      '向亲友宣传此类诈骗套路，帮助更多人提高警惕'
    ]
  }
};

/**
 * 成就系统
 */
const ACHIEVEMENTS = {
  first_play: {
    id: 'first_play',
    title: '初次体验',
    icon: 'play',
    color: '#3B82F6',
    description: '完成任意一个诈骗场景',
    condition: '完成任意场景即可解锁',
    hint: '选择一个场景开始你的反诈之旅吧！'
  },
  all_scenarios: {
    id: 'all_scenarios',
    title: '全部通关',
    icon: 'trophy',
    color: '#CA8A04',
    description: '完成全部4个诈骗场景',
    condition: '完成health_supplement、investment_scam、fake_authority、lottery_sms四个场景',
    hint: '每个场景都有不同的诈骗套路，全部通关成为反诈专家！'
  },
  all_endings: {
    id: 'all_endings',
    title: '结局收集者',
    icon: 'collection',
    color: '#7C3AED',
    description: '解锁所有4种结局类型',
    condition: '至少获得过loss、success、report、partial各一次',
    hint: '尝试不同的选择路径，解锁所有结局！'
  },
  perfect_guardian: {
    id: 'perfect_guardian',
    title: '完美守护者',
    icon: 'crown',
    color: '#F59E0B',
    description: '所有场景都获得"主动举报"结局',
    condition: '在4个场景中都达到report结局',
    hint: '不仅要保护老人，还要主动举报诈骗团伙！'
  },
  encyclopedia_master: {
    id: 'encyclopedia_master',
    title: '图鉴大师',
    icon: 'book-open',
    color: '#10B981',
    description: '解锁全部反诈图鉴',
    condition: '解锁health_supplement、investment_scam、fake_authority、lottery_sms全部4个图鉴条目',
    hint: '完成场景即可解锁对应的图鉴，学习更多反诈知识！'
  },
  no_loss: {
    id: 'no_loss',
    title: '零损失',
    icon: 'shield-check',
    color: '#06B6D4',
    description: '从未获得过"被骗损失"结局',
    condition: '在完成的所有场景中，没有一次获得loss结局',
    hint: '每一次选择都要谨慎，保护好老人的每一分钱！'
  },
  quick_thinker: {
    id: 'quick_thinker',
    title: '快速反应',
    icon: 'zap',
    color: '#EF4444',
    description: '在任意场景中第一次选择就正确',
    condition: '在任意场景的第一次关键选择中，选择了导向success或report结局的选项',
    hint: '直觉有时也很重要，相信你的判断力！'
  }
};

/**
 * 反诈科普小贴士
 * 在游戏间隙随机展示
 */
const TIPS = [
  {
    id: 'tip_01',
    text: '凡是自称公检法要求汇款的，都是诈骗！公检法机关不会通过电话办案，更不存在"安全账户"。'
  },
  {
    id: 'tip_02',
    text: '凡是通知中奖、领取补贴要你先交钱的，都是诈骗！正规中奖不需要提前缴纳任何费用。'
  },
  {
    id: 'tip_03',
    text: '凡是声称"特效药""包治百病"的保健品宣传，都是骗局！买药请认准"国药准字"批号，去正规医院和药店。'
  },
  {
    id: 'tip_04',
    text: '年化收益超过6%就要警惕，超过8%就很危险，超过10%就要做好损失全部本金的准备。理财请选择正规金融机构。'
  },
  {
    id: 'tip_05',
    text: '不要轻易点击短信中的陌生链接，不要向陌生人透露银行卡号、密码和验证码。验证码是资金安全的最后一道防线！'
  },
  {
    id: 'tip_06',
    text: '国家反诈中心APP可以有效识别和拦截诈骗电话、短信，建议为家中老人安装并教会使用。'
  },
  {
    id: 'tip_07',
    text: '遇到可疑情况，多与子女、亲友商量，或拨打全国反诈热线96110咨询。不要独自做决定！'
  },
  {
    id: 'tip_08',
    text: '诈骗分子经常利用老年人对健康和养老的焦虑心理下手。多关心陪伴老人，是最好的防骗"疫苗"。'
  },
  {
    id: 'tip_09',
    text: '接到陌生电话要求"保密""不要告诉家人"的，一定是诈骗！真正的工作人员不会阻止你与家人沟通。'
  },
  {
    id: 'tip_10',
    text: '如果不幸被骗，请第一时间拨打110报警，并保存好转账记录、聊天记录等证据。越快报警，追回资金的可能性越大！'
  }
];

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { SCENARIOS, ENDINGS, ENCYCLOPEDIA, ACHIEVEMENTS, TIPS };
}