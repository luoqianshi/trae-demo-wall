(function (window) {
  const categories = [
    { id: 'all', name: '全部场景', icon: '✨' },
    { id: 'phone', name: '沉迷手机', icon: '📱' },
    { id: 'academic', name: '学业压力', icon: '📚' },
    { id: 'rebellion', name: '叛逆沟通', icon: '🚪' },
    { id: 'romance', name: '异性交往', icon: '💕' },
    { id: 'weariness', name: '厌学动力', icon: '😔' },
    { id: 'social', name: '人际冲突', icon: '👥' },
    { id: 'identity', name: '自我认同', icon: '💫' },
    { id: 'family', name: '家庭变故', icon: '🏠' }
  ];

  const gradients = {
    phone: 'linear-gradient(135deg, #FF6B4A, #FFB347)',
    academic: 'linear-gradient(135deg, #5B8FF9, #61DDAA)',
    rebellion: 'linear-gradient(135deg, #F6BD16, #E8684A)',
    romance: 'linear-gradient(135deg, #FF7C9C, #FFB3D1)',
    weariness: 'linear-gradient(135deg, #722ED1, #B37FEB)',
    social: 'linear-gradient(135deg, #13C2C2, #87E8DE)',
    identity: 'linear-gradient(135deg, #9254DE, #ADC6FF)',
    family: 'linear-gradient(135deg, #D4380D, #FF7A45)'
  };

  const scenes = [
    {
      id: 'phone-late-night',
      title: '熬夜玩手机',
      category: 'phone',
      icon: '🌙',
      coverGradient: gradients.phone,
      description: '孩子熬夜玩手机到凌晨，第二天起不来影响上学...',
      difficulty: 2,
      estimatedTime: '15-20分钟',
      warning: '不要当场发作、不要没收手机、不要翻聊天记录',
      hasDeepDialog: true,
      situation: '家长凌晨发现孩子房间还亮着光，推门看到孩子在玩手机游戏或刷视频。',
      rounds: [
        {
          step: 1,
          title: '当下不发作',
          parentLine: '太晚了，先睡吧，明天还要上学。',
          childResponse: '知道了知道了，马上就睡...（继续玩）',
          tips: [
            '轻声说，不训斥、不没收手机',
            '当下只做一件事：提醒睡觉',
            '把沟通留到第二天白天，情绪稳定时再聊'
          ],
          whyItWorks: '深夜人都在情绪边缘，当场发作很容易激化矛盾。先让孩子睡觉，第二天清醒时再沟通效果更好。',
          emotion: 'calm'
        },
        {
          step: 2,
          title: '第二天白天沟通',
          parentLine: '昨晚我注意到你睡得很晚，我有点担心你的身体。',
          childResponse: '哎呀我就是睡不着玩一会儿，你别老盯着我行不行。',
          tips: [
            '找单独相处的时间，平静地说',
            '表达担心而不是指责',
            '用"我注意到"代替"你又"'
          ],
          whyItWorks: '用"我信息"表达关心而非"你信息"进行指责，能降低孩子的防御心理，让沟通更容易开展。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '提出方案',
          parentLine: '咱们一起定个晚上手机使用的规则，你觉得几点交手机比较合理？',
          childResponse: '12点吧，12点我肯定睡。',
          tips: [
            '邀请孩子一起制定规则，而不是单方面命令',
            '让孩子先说时间，他会更愿意遵守',
            '给出选择权，让孩子感到被尊重'
          ],
          whyItWorks: '参与式规则制定能提升孩子的遵守意愿。当孩子觉得规则是"我们一起定的"而不是"爸妈强加的"，他们会更有动力去执行。',
          emotion: 'calm'
        },
        {
          step: 4,
          title: '共同执行',
          parentLine: '我会和你一样，睡前半小时也不碰手机，咱们互相监督。',
          childResponse: '真的？你能做到吗？',
          tips: [
            '家长以身作则，不要双重标准',
            '用"互相监督"代替"我监督你"',
            '可以约定一些小惩罚增加趣味性'
          ],
          whyItWorks: '身教重于言传。当家长也遵守同样的规则时，孩子会觉得公平，也更愿意配合。互相监督的模式让孩子感到平等。',
          emotion: 'warm'
        }
      ]
    },
    {
      id: 'phone-dinner',
      title: '吃饭刷手机',
      category: 'phone',
      icon: '🍽️',
      coverGradient: gradients.phone,
      description: '一家人吃饭时，孩子全程低头刷手机，不参与聊天...',
      difficulty: 1,
      estimatedTime: '10-15分钟',
      warning: '不要当场抢手机、不要在饭桌上训斥',
      situation: '一家人吃饭时，孩子全程低头刷手机，不参与聊天，叫几次都不抬头。',
      rounds: [
        {
          step: 1,
          title: '不指责，轻松提醒',
          parentLine: '先吃饭吧，菜凉了胃不舒服。',
          childResponse: '嗯...马上就来...（继续看）',
          tips: [
            '用轻松语气说，不指责',
            '关心身体而不是指责行为',
            '给孩子一点缓冲时间'
          ],
          whyItWorks: '吃饭时本应是温馨的家庭时光，用关心的语气提醒比指责更容易被接受，不会破坏气氛。',
          emotion: 'calm'
        },
        {
          step: 2,
          title: '事后沟通感受',
          parentLine: '吃饭的时候一家人聊聊天，是我挺看重的事情。你觉得咱们吃饭时手机放旁边怎么样？',
          childResponse: '哎呀，吃饭就那点时间，看会儿手机怎么了。',
          tips: [
            '说"我挺看重的"，表达你的需求',
            '不否定孩子的感受',
            '用商量的语气，不是命令'
          ],
          whyItWorks: '表达自己的感受和需求，而不是指责对方的行为，这是非暴力沟通的核心。孩子更容易接受"你的需求"而非"你的命令"。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '共同约定试行',
          parentLine: '要不咱们试一周，吃饭时所有人手机都放客厅，看看感觉如何？',
          childResponse: '一周啊...那行吧，试试就试试。',
          tips: [
            '提议"试行一周"而不是"从此以后"',
            '降低孩子的心理门槛',
            '所有人都要遵守，包括家长'
          ],
          whyItWorks: '试行期让孩子觉得这不是永久性的禁令，而是一次共同实验。当他们体验到无手机的用餐时光，可能会主动接受。',
          emotion: 'calm'
        }
      ]
    },
    {
      id: 'phone-confiscate',
      title: '没收手机后反抗',
      category: 'phone',
      icon: '💢',
      coverGradient: gradients.phone,
      description: '家长没收手机，孩子激烈反抗、摔东西、威胁不写作业...',
      difficulty: 3,
      estimatedTime: '20-30分钟',
      warning: '不要硬碰硬、不要说"我是你爸/妈我说了算"',
      situation: '家长因成绩下滑没收手机，孩子摔东西、大喊大叫、威胁不写作业。',
      rounds: [
        {
          step: 1,
          title: '冷处理，避其锋芒',
          parentLine: '你现在情绪很激动，我们先冷静一下，半小时后再聊。',
          childResponse: '我不要冷静！把手机还给我！',
          tips: [
            '不正面冲突，先撤离现场',
            '给双方冷静的时间',
            '不要被孩子的情绪带着走'
          ],
          whyItWorks: '人在情绪激动时是听不进任何道理的。先冷静下来，等情绪平复后再沟通，才能真正解决问题。',
          emotion: 'calm'
        },
        {
          step: 2,
          title: '先共情',
          parentLine: '我知道手机对你很重要，突然被拿走肯定很难接受。',
          childResponse: '你知道还收！那是我的东西！',
          tips: [
            '先说出孩子的感受，让他觉得被理解',
            '不辩解、不说教',
            '共情不等于同意，是理解感受'
          ],
          whyItWorks: '情绪被看见才能被放下。当孩子觉得"我爸妈懂我为什么生气"，他的攻击性就会降低，才有可能听得进后面的话。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '讲清逻辑',
          parentLine: '我收手机不是因为要惩罚你，是因为我看到你最近每天玩到很晚，成绩也在掉，我担心你。',
          childResponse: '我成绩掉跟手机没关系！是这次考试题太难了！',
          tips: [
            '区分"行为"和"人"，不是针对孩子本人',
            '说你的担心，而不是你的愤怒',
            '用"我看到""我担心"这样的表达'
          ],
          whyItWorks: '把"惩罚"重新定义为"关心"，孩子更容易接受。动机从"爸妈要整我"变成"爸妈担心我"，感受完全不同。',
          emotion: 'warm'
        },
        {
          step: 4,
          title: '给台阶',
          parentLine: '咱们可以重新商量使用规则，但前提是你需要让我看到你能控制自己。',
          childResponse: '...怎么证明？',
          tips: [
            '给孩子一条出路，不要逼到墙角',
            '把决定权交还给孩子',
            '相信孩子有自我管理的能力'
          ],
          whyItWorks: '给孩子希望和路径，比单纯禁止更有效。当孩子知道"怎么做就能拿回手机"，他会更有动力去改变。',
          emotion: 'firm'
        }
      ]
    },
    {
      id: 'phone-comparison',
      title: '"同学都有手机"',
      category: 'phone',
      icon: '👥',
      coverGradient: gradients.phone,
      description: '孩子要求买手机，理由是"全班就我没有，我融入不了"...',
      difficulty: 2,
      estimatedTime: '15-20分钟',
      warning: '不要说"别人跳楼你也跳楼吗"、不要直接拒绝',
      situation: '孩子要求买手机，理由是"全班就我没有，我融入不了他们"。',
      rounds: [
        {
          step: 1,
          title: '接纳情绪',
          parentLine: '我理解，大家都有的东西自己没有，确实会觉得自己格格不入。',
          childResponse: '就是啊！每次他们聊游戏我都插不上话，像个傻子一样。',
          tips: [
            '先认可孩子的感受，不要急着讲道理',
            '让孩子觉得"我爸妈懂这种感受"',
            '不否定孩子的社交需求'
          ],
          whyItWorks: '归属感是人类的基本需求。当孩子的这种需求被认可，他才会愿意继续和你沟通，而不是陷入"你们根本不懂"的对抗。',
          emotion: 'warm'
        },
        {
          step: 2,
          title: '区分需求',
          parentLine: '你是想要一部手机，还是想和朋友有更多共同话题？',
          childResponse: '...都有吧，主要是想跟他们有话聊。',
          tips: [
            '帮孩子理清真正的需求是什么',
            '区分"想要"和"需要"',
            '用提问引导思考，不要直接给答案'
          ],
          whyItWorks: '很多时候孩子自己也没想清楚到底想要什么。帮他们理清需求，才能找到更合适的解决方案，而不是被"手机"这个表面需求困住。',
          emotion: 'calm'
        },
        {
          step: 3,
          title: '给替代方案',
          parentLine: '如果是为了联系，手表或功能机也能解决。如果是为了社交，周末约同学出来玩是不是更好？',
          childResponse: '约出来玩倒是可以...但平时在学校还是没话题啊。',
          tips: [
            '提供多个选项，让孩子选择',
            '不否定手机，但给出其他可能性',
            '把"全有或全无"变成"我们一起想办法"'
          ],
          whyItWorks: '当孩子觉得只有"买手机"这一个选项时，他会死磕这个点。提供替代方案能打开思路，让孩子看到解决问题的方式不止一种。',
          emotion: 'calm'
        },
        {
          step: 4,
          title: '设条件',
          parentLine: '如果你能向我证明你能管理好使用时间，我们可以一起攒钱买，但需要约定规则。',
          childResponse: '真的？怎么证明？',
          tips: [
            '不说"不行"，说"可以，前提是..."',
            '给孩子一个明确的目标',
            '把买手机变成共同努力的目标'
          ],
          whyItWorks: '延迟满足+明确条件，让孩子学会为想要的东西付出努力。同时也给了他希望，不会因为被拒绝而产生强烈的挫败感。',
          emotion: 'firm'
        }
      ]
    },
    {
      id: 'exam-fail',
      title: '考试不及格',
      category: 'academic',
      icon: '📝',
      coverGradient: gradients.academic,
      description: '孩子拿着不及格的试卷回家，沉默不语或把卷子塞给家长...',
      difficulty: 2,
      estimatedTime: '15-20分钟',
      warning: '不要说"我就知道你考不好"、不要翻旧账',
      hasDeepDialog: true,
      situation: '孩子月考/期中成绩出来，分数很难看，回家后沉默不语或直接把卷子塞给家长。',
      rounds: [
        {
          step: 1,
          title: '先接住情绪',
          parentLine: '看起来你自己也很难过，对吧？',
          childResponse: '...嗯。（眼眶红了）',
          tips: [
            '先看孩子的情绪，不先看分数',
            '说出孩子的感受，让他觉得被理解',
            '不急着分析原因、找问题'
          ],
          whyItWorks: '情绪ABC理论告诉我们，引发情绪的不是事件本身，而是对事件的看法。先处理情绪，再处理事情，孩子才能听得进去。',
          emotion: 'warm'
        },
        {
          step: 2,
          title: '不翻旧账',
          parentLine: '这次没考好没关系，咱们一起看看问题在哪。',
          childResponse: '你不会骂我吧？我上次也没考好...',
          tips: [
            '只说这次，不翻旧账',
            '把"考砸"重新定义为"发现问题的机会"',
            '传递"我们一起面对"的态度'
          ],
          whyItWorks: '翻旧账会让孩子觉得"我不管怎么努力都没用，爸妈永远记得我不好的时候"，从而失去信心。聚焦当下，才能向前看。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '聚焦具体',
          parentLine: '你觉得是哪科最吃力？是没听懂还是没时间复习？',
          childResponse: '数学最头疼，上课听懂了，一做题就不会。',
          tips: [
            '帮孩子把问题具体化',
            '不要笼统地说"你要努力"',
            '从大问题拆解成小问题'
          ],
          whyItWorks: '笼统的"我学习不好"会让人感到无力和绝望。把问题具体化——"是数学的某个章节没学好"——问题就变成了可以解决的。',
          emotion: 'calm'
        },
        {
          step: 4,
          title: '给支持',
          parentLine: '需要我帮你找个补习老师，还是咱们一起调整下学习计划？',
          childResponse: '...要不先试试调整学习计划？我不想去补习班。',
          tips: [
            '给具体的帮助选项，不是空泛的"加油"',
            '让孩子选择他能接受的方式',
            '支持不等于包办，要孩子自己也参与'
          ],
          whyItWorks: '孩子需要的不是"你要努力"的口号，而是具体的、可操作的帮助。提供选择让他感到被尊重，也更愿意执行。',
          emotion: 'warm'
        }
      ]
    },
    {
      id: 'exam-anxiety',
      title: '考前焦虑',
      category: 'academic',
      icon: '😰',
      coverGradient: gradients.academic,
      description: '大考前孩子焦虑失眠、发脾气，说"我考不好就别指望了"...',
      difficulty: 2,
      estimatedTime: '15-20分钟',
      warning: '不要说"这有什么好紧张的"、不要给太大压力',
      situation: '大考前一周，孩子明显焦虑，晚上睡不着，动不动就发火，说"我考不好就别指望了"。',
      rounds: [
        {
          step: 1,
          title: '接纳焦虑',
          parentLine: '大考前紧张是正常的，妈妈当年考试前也睡不着。',
          childResponse: '真的？你当年也这样？',
          tips: [
            '正常化焦虑，不是"你怎么这么脆弱"',
            '分享自己的类似经历，拉近距离',
            '让孩子知道"紧张不代表我不行"'
          ],
          whyItWorks: '当孩子觉得"只有我一个人这样"时，会更焦虑。知道"爸妈当年也这样，而且熬过来了"，能给他们信心。',
          emotion: 'warm'
        },
        {
          step: 2,
          title: '降低预期压力',
          parentLine: '不管你考多少分，你都是我的孩子。考试只是检测这段时间学得怎么样，不是判你生死。',
          childResponse: '可是考不好的话，老师会说，同学也会看不起我...',
          tips: [
            '给孩子"无条件的爱"的安全感',
            '把考试的意义还原成"检测"，不是"审判"',
            '不把分数和孩子的价值挂钩'
          ],
          whyItWorks: '很多孩子的焦虑来自"考不好=我不行=爸妈不爱我"的深层恐惧。明确告诉孩子"你本身比分数重要"，能大大缓解焦虑。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '给具体帮助',
          parentLine: '你需要我帮你做点什么？是帮你整理错题，还是帮你找些放松的方法？',
          childResponse: '...放松的方法有哪些？我最近确实老睡不着。',
          tips: [
            '不说空话，给具体的帮助选项',
            '从孩子的需求出发，不是你觉得他需要什么',
            '行动比安慰更有力'
          ],
          whyItWorks: '焦虑的时候，人最需要的是"做点什么"来找回控制感。提供具体的帮助，能让孩子从"我好焦虑"转向"我可以采取行动"。',
          emotion: 'calm'
        },
        {
          step: 4,
          title: '引导行动',
          parentLine: '睡不着的时候可以试试听点轻音乐，或者起来看会儿书，别硬躺。越硬躺越着急，越着急越睡不着。',
          childResponse: '嗯，我试试。',
          tips: [
            '给具体可操作的小方法',
            '不要说"你就是想太多"',
            '接纳睡不着这件事，降低对睡眠的焦虑'
          ],
          whyItWorks: '对失眠的焦虑往往比失眠本身更可怕。告诉孩子"睡不着也没关系，可以做点别的"，反而能让他放松下来，更容易入睡。',
          emotion: 'calm'
        }
      ]
    },
    {
      id: 'school-refusal',
      title: '"不想上学了"',
      category: 'academic',
      icon: '😔',
      coverGradient: gradients.academic,
      description: '孩子反复说不想去学校，找各种理由请假...',
      difficulty: 3,
      estimatedTime: '25-35分钟',
      warning: '不要说"不上学你能干什么"、不要不当回事',
      situation: '某天早上或某段时间，孩子反复说不想去学校，找各种理由请假。',
      rounds: [
        {
          step: 1,
          title: '认真对待',
          parentLine: '你说不想上学，我挺意外的。能告诉我发生了什么吗？',
          childResponse: '没什么...就是不想去。',
          tips: [
            '不否定、不嘲笑孩子的想法',
            '认真对待，哪怕你觉得这只是一时冲动',
            '问"发生了什么"，而不是"你怎么敢"'
          ],
          whyItWorks: '当孩子说"不想上学"时，他可能不是真的想退学，而是在发出求救信号。认真对待这个信号，才能找到背后真正的问题。',
          emotion: 'calm'
        },
        {
          step: 2,
          title: '不急于反驳',
          parentLine: '我不会直接逼你去，但我想知道是学校有什么让你难受的事吗？是学习压力大，还是跟同学/老师有矛盾？',
          childResponse: '...都有一点吧。',
          tips: [
            '不急于说服孩子"上学是对的"',
            '从多个角度帮孩子梳理原因',
            '传递"我不是来逼你的，我是来帮你的"'
          ],
          whyItWorks: '一上来就反驳会让孩子闭嘴。先表示"我理解有原因"，孩子才会愿意说出真正的困扰。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '倾听原因',
          parentLine: '你慢慢说，我听着。',
          childResponse: '（开始倾诉）',
          tips: [
            '闭嘴，认真听，不打断',
            '用点头、"嗯""我明白"回应',
            '不急于给建议、不评判'
          ],
          whyItWorks: '有时候孩子需要的只是一个倾听者。把心里的苦说出来，压力就已经减轻了一半。很多时候说完了，他们自己就知道该怎么办了。',
          emotion: 'warm'
        },
        {
          step: 4,
          title: '一起解决',
          parentLine: '不管是什么原因，我们一起想办法。不上学是最后的选择，我们先试试有没有别的办法。',
          childResponse: '...真的有办法吗？我觉得我熬不下去了。',
          tips: [
            '传递"我们一起面对"的态度',
            '不否定孩子的痛苦',
            '给希望，但不画大饼'
          ],
          whyItWorks: '当孩子说"不想上学"时，他可能已经觉得"我走投无路了"。让他知道"不是只有上学和不上学两个选项，我们还有很多办法可以试"，能给他希望。',
          emotion: 'firm'
        }
      ]
    },
    {
      id: 'teacher-meeting',
      title: '被老师约谈',
      category: 'academic',
      icon: '👨‍🏫',
      coverGradient: gradients.academic,
      description: '老师说孩子上课走神、作业不交、成绩大幅下滑...',
      difficulty: 2,
      estimatedTime: '15-20分钟',
      warning: '不要回家就发作、不要直接转述老师的话',
      situation: '家长被老师叫到学校，说孩子最近上课走神、作业不交、成绩大幅下滑。',
      rounds: [
        {
          step: 1,
          title: '回家后不马上发作',
          parentLine: '今天老师找我了，说了一些你最近的情况。我想听听你怎么看？',
          childResponse: '（紧张）他说我什么了？',
          tips: [
            '先让孩子说，不是先告状',
            '不带情绪、不预设立场',
            '用"你的版本"这样的表达'
          ],
          whyItWorks: '如果一回家就劈头盖脸地骂，孩子只会启动防御模式。先让孩子有机会解释，才能了解完整的真相。',
          emotion: 'calm'
        },
        {
          step: 2,
          title: '不带预设',
          parentLine: '不是要批评你，我是想了解你是不是遇到什么困难了？',
          childResponse: '...也没什么困难，就是最近有点不想学。',
          tips: [
            '相信孩子有他的原因',
            '不直接给孩子贴"懒""态度差"的标签',
            '从"遇到困难"的角度切入'
          ],
          whyItWorks: '行为问题的背后往往有心理原因。把"态度问题"变成"困难问题"，孩子会更愿意敞开心扉，你们才能一起找到真正的解决方案。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '区分"态度"和"能力"',
          parentLine: '是学不会，还是不想学？还是最近有什么事情影响了你的状态？',
          childResponse: '...有几节课确实听不懂，后来就不想听了。',
          tips: [
            '帮孩子梳理原因，不同原因不同解法',
            '不笼统地说"你就是不努力"',
            '区分"不想"和"不能"'
          ],
          whyItWorks: '"不想学"和"学不会"是完全不同的问题，解决方式也完全不同。先搞清楚原因，才能对症下药。',
          emotion: 'calm'
        },
        {
          step: 4,
          title: '一起定计划',
          parentLine: '咱们一起想个办法，看看怎么把状态调整回来。',
          childResponse: '...怎么调？',
          tips: [
            '和孩子一起想办法，不是直接给答案',
            '计划要具体、可执行',
            '给孩子希望，让他相信"可以变好"'
          ],
          whyItWorks: '一起制定的计划，孩子会更有动力执行。而且参与制定的过程本身，就是在培养解决问题的能力。',
          emotion: 'warm'
        }
      ]
    },
    {
      id: 'silent-treatment',
      title: '关门不说话',
      category: 'rebellion',
      icon: '🚪',
      coverGradient: gradients.rebellion,
      description: '孩子回家就关房门，叫吃饭不应，问什么都回"烦不烦"...',
      difficulty: 3,
      estimatedTime: '20-30分钟',
      warning: '不要追着问、不要破门而入、不要偷看手机',
      hasDeepDialog: true,
      situation: '孩子放学回家径直进房间，反锁门，叫吃饭不应，问什么都回"烦不烦"。',
      rounds: [
        {
          step: 1,
          title: '尊重边界',
          parentLine: '（敲门轻声说）饭在桌上，饿了就出来吃。',
          childResponse: '（隔着门）知道了...',
          tips: [
            '不强行闯入孩子的空间',
            '用小事传递关心，不求回应',
            '明确告诉孩子"我不进去"，让他安心'
          ],
          whyItWorks: '青春期孩子的自我边界感强烈，强行突破只会让他们把门关得更紧。尊重边界是建立信任的第一步。',
          emotion: 'calm'
        },
        {
          step: 2,
          title: '不追问',
          parentLine: '我不逼你说话，但你如果想聊，我随时都在。',
          childResponse: '（沉默）',
          tips: [
            '给孩子空间，不追着问"你怎么了"',
            '让孩子知道"我在"，但不强迫',
            '把主动权交给孩子'
          ],
          whyItWorks: '当孩子感到"我说不说都是安全的"，他反而更愿意说。如果一直逼问，他会觉得"我说了反而麻烦，还不如不说"。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '创造安全出口',
          parentLine: '你可以用微信给我发消息，或者写纸条放桌上。',
          childResponse: '...嗯。',
          tips: [
            '提供多种沟通方式，不只"面对面谈话"',
            '有些话文字比口头更容易说出口',
            '降低沟通的门槛'
          ],
          whyItWorks: '青春期的孩子有时候不是不想说，是不知道怎么开口。提供低压力的沟通渠道，能大大增加他们开口的可能性。',
          emotion: 'warm'
        },
        {
          step: 4,
          title: '耐心等待',
          parentLine: '我知道你可能需要一些自己的空间，我尊重你。但我也希望你知道，我一直在。',
          childResponse: '...谢谢妈。',
          tips: [
            '表达你的爱和支持，但不施压',
            '相信孩子会自己走出来',
            '不因为孩子暂时不说话就焦虑不安'
          ],
          whyItWorks: '无条件的陪伴和等待，是最深的爱。当孩子确信"不管我怎么样，爸妈都在"，他才有力量自己面对问题。',
          emotion: 'warm'
        }
      ]
    },
    {
      id: 'dont-bother-me',
      title: '"你别管我"',
      category: 'rebellion',
      icon: '🙉',
      coverGradient: gradients.rebellion,
      description: '家长提醒日常事项，孩子突然爆发"你能不能别管我！"...',
      difficulty: 2,
      estimatedTime: '15-20分钟',
      warning: '不要说"我不管你谁管你"、不要被激怒',
      situation: '家长提醒作业、作息、穿衣等日常事项时，孩子突然爆发"你能不能别管我！"。',
      rounds: [
        {
          step: 1,
          title: '不被激怒',
          parentLine: '好，我先不管，等你冷静下来我们再聊。',
          childResponse: '（摔门进房间）',
          tips: [
            '不被孩子的情绪带着走',
            '先撤，等情绪平复',
            '不说"我还不能管你了？"'
          ],
          whyItWorks: '情绪上头的时候，说什么都是火上浇油。先退一步，等双方都冷静了，沟通才有意义。',
          emotion: 'calm'
        },
        {
          step: 2,
          title: '冷静后表达',
          parentLine: '你说别管我的时候，我挺伤心的。但我也在想，是不是我管得太多让你喘不过气了。',
          childResponse: '...就是觉得你什么都要管，很烦。',
          tips: [
            '说你的感受，不是指责他',
            '表达愿意反思的态度',
            '用"我觉得"代替"你总是"'
          ],
          whyItWorks: '当孩子发现"我爸妈不是来兴师问罪的，他们真的在反思"，他的防御心就会降低，也会愿意反思自己的态度。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '调整边界',
          parentLine: '哪些事你希望我自己管，哪些事可以让我管？你列一下，我们商量。',
          childResponse: '比如我穿什么、吃什么，你就别管了。学习的事...你可以提醒我一下。',
          tips: [
            '和孩子一起划清边界',
            '尊重孩子的自主需求',
            '不是"全管"或"不管"，而是"哪些管、哪些不管"'
          ],
          whyItWorks: '青春期的核心任务是发展自主性。给孩子适当的自主权，他才会发展出自律能力。什么都管，只会培养出要么叛逆要么无能的孩子。',
          emotion: 'calm'
        },
        {
          step: 4,
          title: '给自主权',
          parentLine: '我可以少管一些，但你需要让我看到你有能力管好自己。',
          childResponse: '...行，我试试。',
          tips: [
            '信任是前提，但也要有底线',
            '给孩子证明自己的机会',
            '用行动建立信任，不是用言语要求'
          ],
          whyItWorks: '信任是最好的监督。当孩子感受到被信任，他会更愿意为自己的行为负责，不辜负这份信任。',
          emotion: 'firm'
        }
      ]
    },
    {
      id: 'lying',
      title: '撒谎被拆穿',
      category: 'rebellion',
      icon: '🤥',
      coverGradient: gradients.rebellion,
      description: '发现孩子撒谎，明明去玩却说在补课，考了低分说没出成绩...',
      difficulty: 2,
      estimatedTime: '15-20分钟',
      warning: '不要贴"骗子"标签、不要说"我再也不相信你了"',
      situation: '发现孩子明明去网吧/同学家玩，却说在学校补课；或者明明考了低分，说"还没出成绩"。',
      rounds: [
        {
          step: 1,
          title: '不贴标签',
          parentLine: '我今天了解到一件事，和你之前跟我说的不太一样。你能再跟我说一遍吗？',
          childResponse: '（紧张）什么事...',
          tips: [
            '不直接说"你撒谎"',
            '给孩子坦白的机会',
            '用"了解到""不太一样"这样温和的词'
          ],
          whyItWorks: '直接拆穿并贴标签，会让孩子为了自保而继续撒谎。给个台阶，很多时候孩子会自己坦白。',
          emotion: 'calm'
        },
        {
          step: 2,
          title: '给坦白空间',
          parentLine: '我知道你可能怕我生气才这么说的。我不会骂你，但我想知道真实情况。',
          childResponse: '...对不起，我是怕你骂我才骗你的。',
          tips: [
            '理解孩子撒谎背后的恐惧',
            '承诺不骂，说到做到',
            '让孩子知道"说实话比撒谎更安全"'
          ],
          whyItWorks: '孩子撒谎往往是因为"说实话的代价太大了"。让他知道"说实话不会被骂，撒谎才会让我更失望"，他才会愿意诚实。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '表达失望但不过度',
          parentLine: '我难过的不是你做错了事，而是你没有跟我说实话。',
          childResponse: '我知道错了...以后不会了。',
          tips: [
            '区分"做错事"和"撒谎"',
            '表达失望，但不否定孩子整个人',
            '不说"你就是个骗子"这种话'
          ],
          whyItWorks: '让孩子明白，真正让父母难过的是"不被信任"，而不是事情本身。这样孩子会更重视诚实，而不是只害怕惩罚。',
          emotion: 'warm'
        },
        {
          step: 4,
          title: '重建信任',
          parentLine: '以后不管发生什么，你先跟我说，我们一起面对。',
          childResponse: '嗯...我下次一定说实话。',
          tips: [
            '给孩子重建信任的机会',
            '不说"我再也不相信你了"',
            '传递"我们是一伙的"的态度'
          ],
          whyItWorks: '信任被破坏后需要重建。给孩子机会，而不是一棍子打死，他才会努力赢回信任，而不是破罐子破摔。',
          emotion: 'warm'
        }
      ]
    },
    {
      id: 'disrespect',
      title: '说话态度恶劣',
      category: 'rebellion',
      icon: '😤',
      coverGradient: gradients.rebellion,
      description: '孩子用脏话或极其不尊重的语气对家长说话...',
      difficulty: 2,
      estimatedTime: '15-20分钟',
      warning: '不要用脏话骂回去、不要说"我白养你了"',
      situation: '孩子用脏话或极其不尊重的语气对家长说话，比如"你烦死了""滚"。',
      rounds: [
        {
          step: 1,
          title: '当场制止',
          parentLine: '你这样说话，我没办法继续沟通。',
          childResponse: '（更凶）怎么了？我说错了吗？',
          tips: [
            '明确表示不接受这种说话方式',
            '不跟孩子对骂',
            '不因为生气而说更狠的话'
          ],
          whyItWorks: '必须让孩子知道，有些话是不能说的，有些底线是不能碰的。但制止的同时，自己也要保持冷静。',
          emotion: 'firm'
        },
        {
          step: 2,
          title: '离开现场',
          parentLine: '我先去冷静一下，十分钟后再聊。',
          childResponse: '（摔东西/摔门）',
          tips: [
            '在情绪失控前离开',
            '给双方冷静的时间',
            '不是逃避，是为了更好地沟通'
          ],
          whyItWorks: '情绪上头的时候说的话，只会让矛盾升级。先冷静，再沟通，才能真正解决问题。',
          emotion: 'calm'
        },
        {
          step: 3,
          title: '事后严肃沟通',
          parentLine: '我可以接受你生气，但不能接受你用这样的方式跟我说话。',
          childResponse: '...是你先惹我的。',
          tips: [
            '区分"生气的情绪"和"伤人的行为"',
            '情绪可以被理解，但行为要有底线',
            '不翻旧账，只说这一次'
          ],
          whyItWorks: '让孩子明白"生气是正常的，但用伤人的方式表达是不对的"。情绪没有对错，但行为有边界。',
          emotion: 'firm'
        },
        {
          step: 4,
          title: '立规矩',
          parentLine: '以后如果你觉得情绪上来了，可以说"我现在不想说"，而不是说那些伤人的话。',
          childResponse: '...知道了。',
          tips: [
            '给孩子一个替代的表达方式',
            '不是禁止生气，是教他如何正确表达',
            '和孩子约定好"暂停"的暗号'
          ],
          whyItWorks: '只说"你不能这样"是不够的，还要告诉孩子"你可以怎样"。给孩子一个健康的情绪出口，他才不会用伤人的方式发泄。',
          emotion: 'firm'
        }
      ]
    },
    {
      id: 'puppy-love-sign',
      title: '早恋迹象',
      category: 'romance',
      icon: '💕',
      coverGradient: gradients.romance,
      description: '发现孩子频繁和异性聊天、偷偷约会、成绩有波动...',
      difficulty: 2,
      estimatedTime: '15-20分钟',
      warning: '不要偷看手机、不要直接拆穿、不要找对方家长',
      hasDeepDialog: true,
      situation: '发现孩子手机上频繁和某异性聊天、偷偷约会、成绩有波动。',
      rounds: [
        {
          step: 1,
          title: '不直接拆穿',
          parentLine: '我最近注意到你好像和某位同学走得比较近。',
          childResponse: '（紧张）啊？没有啊...就是普通同学。',
          tips: [
            '用轻松的语气开场',
            '观察变化，但不戳破，给孩子留面子',
            '表达好奇而非指责'
          ],
          whyItWorks: '青春期孩子对"被看穿"特别敏感。直接点破会让他们立刻启动防御机制，反而什么都不说了。',
          emotion: 'warm'
        },
        {
          step: 2,
          title: '正常化',
          parentLine: '对异性有好感是很正常的事情，这个年纪有这种感觉不奇怪。',
          childResponse: '（有点意外）你不反对？',
          tips: [
            '把"早恋"正常化，不是洪水猛兽',
            '让孩子知道这种感情是美好的',
            '消除羞耻感'
          ],
          whyItWorks: '当一件事被正常化、被接纳时，孩子就不需要躲躲藏藏了。消除了羞耻感，沟通的大门才会打开。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '设底线',
          parentLine: '我不反对你交朋友，但有几个底线：不影响学习、不越界、注意安全。',
          childResponse: '...什么叫不越界？',
          tips: [
            '明确底线和边界',
            '不禁止，但也不放任',
            '底线要具体、清楚、可执行'
          ],
          whyItWorks: '完全禁止会激起逆反，完全放任又不负责任。设底线+给自由，是平衡的做法。孩子知道边界在哪里，反而更安全。',
          emotion: 'firm'
        },
        {
          step: 4,
          title: '开放沟通',
          parentLine: '如果你愿意的话，可以跟我说说他/她是什么样的人，我不会评价。',
          childResponse: '...他/她人挺好的，学习也不错。',
          tips: [
            '邀请孩子分享，不强迫',
            '承诺不评价，说到做到',
            '做孩子的"顾问"，不是"法官"'
          ],
          whyItWorks: '当孩子知道"跟爸妈说不会被骂"，他遇到问题才会主动求助。否则他只能自己摸索，更容易走弯路。',
          emotion: 'warm'
        }
      ]
    },
    {
      id: 'heartbreak',
      title: '失恋崩溃',
      category: 'romance',
      icon: '💔',
      coverGradient: gradients.romance,
      description: '孩子分手后哭、不吃不喝、说"活着没意思"...',
      difficulty: 3,
      estimatedTime: '25-35分钟',
      warning: '不要说"这点小事算什么"、不要说"早跟你说过不要谈恋爱"',
      situation: '孩子分手后哭、不吃不喝、说"活着没意思"，情绪极度低落。',
      rounds: [
        {
          step: 1,
          title: '接纳悲伤',
          parentLine: '我知道你现在很难受，想哭就哭吧，我陪着你。',
          childResponse: '（大哭）',
          tips: [
            '不说"别哭了"，哭是情绪的释放',
            '安静陪伴，比说什么都有用',
            '不轻视孩子的痛苦'
          ],
          whyItWorks: '悲伤需要被看见和接纳。压抑悲伤只会让它在心里发酵。允许孩子哭、陪他哭，是最好的安慰。',
          emotion: 'warm'
        },
        {
          step: 2,
          title: '不轻视',
          parentLine: '这个年纪的感情是很认真的，我知道这对你来说非常重要。',
          childResponse: '（抽泣）你真的懂吗...你们大人都觉得我们是小孩子闹着玩。',
          tips: [
            '认真对待孩子的感情',
            '不说"你还小，懂什么叫爱"',
            '承认这份感情的分量'
          ],
          whyItWorks: '对青春期的孩子来说，初恋可能是他们经历过的最强烈的情感体验。被轻视、被否定，只会让他们觉得"没人懂我"，从而更加封闭。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '给时间',
          parentLine: '不需要马上好起来，慢慢来。',
          childResponse: '可是我好难受啊...什么时候才能不疼？',
          tips: [
            '不给"你应该快点好起来"的压力',
            '告诉孩子"时间会治愈一切"',
            '陪他一起度过这段难捱的日子'
          ],
          whyItWorks: '心碎了，需要时间愈合。催孩子"快点好起来"，等于在说"你的痛苦是不应该的"。允许他痛，他才能真正走出来。',
          emotion: 'warm'
        },
        {
          step: 4,
          title: '关注安全',
          parentLine: '我有点担心你的状态，如果你需要，我们可以一起去找心理咨询师聊聊。',
          childResponse: '...有这个必要吗？',
          tips: [
            '密切关注孩子的情绪状态',
            '如果有自伤倾向，立即寻求专业帮助',
            '把"看心理医生"正常化，不是"有病"才去'
          ],
          whyItWorks: '青春期情绪波动大，失恋可能触发严重的心理危机。重视孩子的情绪状态，必要时寻求专业帮助，是对孩子负责。',
          emotion: 'firm'
        }
      ]
    },
    {
      id: 'teacher-report-love',
      title: '老师反映早恋',
      category: 'romance',
      icon: '📞',
      coverGradient: gradients.romance,
      description: '班主任打电话说孩子在学校和异性有亲密行为，成绩下滑...',
      difficulty: 3,
      estimatedTime: '20-30分钟',
      warning: '不要羞辱孩子、不要说"你怎么这么不要脸"',
      situation: '班主任打电话说孩子在学校和异性有亲密行为，且成绩明显下滑。',
      rounds: [
        {
          step: 1,
          title: '不急于质问',
          parentLine: '今天老师跟我说了一些你在学校的情况，我想听听你的版本。',
          childResponse: '（紧张）他说什么了？',
          tips: [
            '先听孩子说，不是先转述老师的话',
            '不带预设立场',
            '相信孩子有他的角度'
          ],
          whyItWorks: '一上来就兴师问罪，孩子只会想怎么辩解。让他先说，才能了解完整的真相和他的真实想法。',
          emotion: 'calm'
        },
        {
          step: 2,
          title: '不羞辱',
          parentLine: '我不认为这是"错事"，但我想知道这段关系对你的影响。',
          childResponse: '...你不觉得我丢人吗？',
          tips: [
            '不把"早恋"说成"丢脸""犯错"',
            '保护孩子的自尊心',
            '区分"行为"和"人品"'
          ],
          whyItWorks: '羞辱是最伤人的武器。被羞辱的孩子不会变好，只会变得自卑或叛逆。保护孩子的自尊，比"教训"他重要得多。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '引导思考',
          parentLine: '你觉得这段感情让你变得更好还是更累了？你的成绩最近有变化，你觉得有关系吗？',
          childResponse: '...可能有点关系吧。最近确实分心了。',
          tips: [
            '用提问引导孩子自己思考',
            '不是直接给结论',
            '相信孩子有判断能力'
          ],
          whyItWorks: '自己想明白的道理，比别人说一百句都管用。引导思考而不是灌输观点，孩子才会真正认同并改变。',
          emotion: 'calm'
        },
        {
          step: 4,
          title: '一起想对策',
          parentLine: '我们不是要拆散你们，但你得自己规划好时间和精力。',
          childResponse: '...我知道了，我会调整的。',
          tips: [
            '不做"拆散者"，做"支持者"',
            '把选择权还给孩子',
            '相信他能做出对自己负责的选择'
          ],
          whyItWorks: '越反对越叛逆，这是罗密欧与朱丽叶效应。与其反对，不如教孩子如何在感情中保护自己、平衡学业。',
          emotion: 'firm'
        }
      ]
    },
    {
      id: 'learning-meaningless',
      title: '"学习有什么用"',
      category: 'weariness',
      icon: '🤔',
      coverGradient: gradients.weariness,
      description: '孩子拿网红举例反驳学习的意义，表现出明显厌学...',
      difficulty: 2,
      estimatedTime: '15-20分钟',
      warning: '不要硬杠、不要说"你跟人家比什么"',
      hasDeepDialog: true,
      situation: '孩子拿个例反驳学习的意义，表现出明显的厌学情绪。',
      rounds: [
        {
          step: 1,
          title: '不反驳',
          parentLine: '你说的那个网红确实挺厉害的，他肯定也有过人之处。',
          childResponse: '是吧！人家初中毕业照样赚大钱，比那些大学生强多了。',
          tips: [
            '先认可部分事实，不直接否定',
            '不急于反驳，先听听孩子怎么说',
            '避免进入"对错之争"'
          ],
          whyItWorks: '一上来就反驳，孩子会觉得你又要讲大道理，根本听不进去。先表示理解和认可，才能继续沟通。',
          emotion: 'calm'
        },
        {
          step: 2,
          title: '不硬杠',
          parentLine: '学习和赚钱确实不是一回事。但你想想，如果有一天网红不红了，他需要什么能力转行？',
          childResponse: '...不知道。可能他做别的也能行吧。',
          tips: [
            '用提问引导思考，不是直接说教',
            '把"学习"和"能力"联系起来',
            '不否定网红，但拓展孩子的视角'
          ],
          whyItWorks: '直接说"不对"会激起逆反，用提问让孩子自己想，他更容易接受。引导思考比灌输答案有效得多。',
          emotion: 'calm'
        },
        {
          step: 3,
          title: '引导思考',
          parentLine: '我不要求你考第一，但你要有一样能养活自己的本事。你觉得什么本事最靠谱？',
          childResponse: '...我也不知道。我就觉得读书没用。',
          tips: [
            '把"学习"的定义拓宽，不只是考试',
            '引导孩子想"以后靠什么生活"',
            '不否定，但拉回现实'
          ],
          whyItWorks: '厌学的孩子往往是对"学习=考试"反感。帮他们拓宽对"学习"和"能力"的理解，可能会找到新的动力。',
          emotion: 'warm'
        },
        {
          step: 4,
          title: '拉回现实',
          parentLine: '在你想清楚做什么之前，先把眼前的事做好，多条路总比一条路好。',
          childResponse: '...知道了。',
          tips: [
            '不要求立刻转变态度',
            '把"先做好眼前事"作为底线',
            '给孩子时间和空间去想'
          ],
          whyItWorks: '改变想法需要时间，不能指望一次谈话就让孩子爱上学习。先守住底线，慢慢引导，比逼他假装学习更重要。',
          emotion: 'firm'
        }
      ]
    },
    {
      id: 'copy-homework',
      title: '抄作业',
      category: 'weariness',
      icon: '📋',
      coverGradient: gradients.weariness,
      description: '发现孩子抄作业、用搜题软件抄答案，作业完全不走心...',
      difficulty: 2,
      estimatedTime: '15-20分钟',
      warning: '不要贴"作弊"标签、不要只骂不帮',
      situation: '发现孩子抄同学作业、用搜题软件直接抄答案，作业完全不走心。',
      rounds: [
        {
          step: 1,
          title: '不贴标签',
          parentLine: '我发现你在抄作业，是作业太多还是不会做？',
          childResponse: '（低下头）...都有吧。',
          tips: [
            '直接说你发现了，但不贴标签',
            '从"遇到困难"的角度切入',
            '不指责人品，只说行为'
          ],
          whyItWorks: '抄作业的孩子往往也知道不对，但他可能有他的难处。先理解原因，再解决问题，比单纯批评有效。',
          emotion: 'calm'
        },
        {
          step: 2,
          title: '找根因',
          parentLine: '如果是不会，那抄了也没用，我们需要解决"不会"的问题。',
          childResponse: '就是不会...又不敢问老师。',
          tips: [
            '区分"态度问题"和"能力问题"',
            '帮孩子面对真正的问题',
            '抄作业只是症状，不是病因'
          ],
          whyItWorks: '抄作业是表面现象，背后可能是"学不会""不敢问""时间管理差"等问题。只骂抄作业，不解决根本问题，下次还会抄。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '给帮助',
          parentLine: '不会的题可以空着，第二天我帮你一起看，或者找老师问。',
          childResponse: '可是老师会说我没完成作业。',
          tips: [
            '给具体的帮助，不是空话',
            '帮孩子想办法应对老师',
            '让孩子知道"你不是一个人面对"'
          ],
          whyItWorks: '很多时候孩子不是不想好好做，是不知道怎么办。给他具体的帮助和支持，他才有能力做出改变。',
          emotion: 'warm'
        },
        {
          step: 4,
          title: '正向激励',
          parentLine: '如果你能独立完成一周作业，周末我们可以做一件你特别想做的事。',
          childResponse: '真的？什么事都可以？',
          tips: [
            '用正向激励代替负向惩罚',
            '奖励要具体、有吸引力',
            '说到做到'
          ],
          whyItWorks: '正向激励比负向惩罚更能激发内在动力。当孩子因为"做好了能得到什么"而努力，比因为"做不好会被罚"更持续。',
          emotion: 'warm'
        }
      ]
    },
    {
      id: 'weak-subject',
      title: '严重偏科',
      category: 'weariness',
      icon: '📊',
      coverGradient: gradients.weariness,
      description: '某一科成绩极差，孩子说"我就是学不会""这科没用"...',
      difficulty: 2,
      estimatedTime: '15-20分钟',
      warning: '不要说"别人怎么能学会"、不要强迫刷题',
      situation: '某一科成绩极差，孩子说"我就是学不会"或"这科没用，我不想学"。',
      rounds: [
        {
          step: 1,
          title: '共情',
          parentLine: '偏科挺正常的，每个人都有自己的强项和弱项。',
          childResponse: '就是嘛，我天生就学不会这科。',
          tips: [
            '先正常化偏科，不是"你笨"',
            '不否定孩子的感受',
            '承认差异，不强求完美'
          ],
          whyItWorks: '当孩子觉得"偏科=我笨"时，他会自我放弃。先告诉他"偏科很正常"，他才会有信心去尝试提高。',
          emotion: 'warm'
        },
        {
          step: 2,
          title: '降低目标',
          parentLine: '我们不要求你考多高，先定个小目标——比上次多考5分。',
          childResponse: '5分？这么少？我还以为你要说多少呢。',
          tips: [
            '把大目标拆解成小目标',
            '小到看起来"很容易"，降低心理门槛',
            '小成功积累大信心'
          ],
          whyItWorks: '当目标看起来"不可能完成"时，人会直接放弃。把目标调小到"好像可以试试"，行动力就来了。',
          emotion: 'calm'
        },
        {
          step: 3,
          title: '找兴趣点',
          parentLine: '这科里有没有你稍微感兴趣一点的章节？我们从那里开始。',
          childResponse: '嗯...有一章讲历史故事的，我还挺喜欢的。',
          tips: [
            '从兴趣点切入，不是从最弱的地方',
            '先建立信心，再逐步扩展',
            '让学习和"快乐"联系起来'
          ],
          whyItWorks: '兴趣是最好的老师。从感兴趣的地方开始，孩子会体验到"学习可以是快乐的"，这种感觉会迁移到其他部分。',
          emotion: 'warm'
        },
        {
          step: 4,
          title: '给支持',
          parentLine: '如果实在跟不上，咱们考虑要不要找个一对一的老师专项补一下？',
          childResponse: '一对一会不会很贵啊...',
          tips: [
            '提供具体的帮助选项',
            '让孩子参与决策',
            '不把"花钱"变成孩子的压力'
          ],
          whyItWorks: '有时候单靠孩子自己确实很难突破。提供专业的帮助，是对孩子负责的表现，也是爱的体现。',
          emotion: 'warm'
        }
      ]
    },
    {
      id: 'bullying',
      title: '被霸凌/孤立',
      category: 'social',
      icon: '😢',
      coverGradient: gradients.social,
      description: '孩子不愿去学校、闷闷不乐，发现被同学排挤嘲笑甚至欺负...',
      difficulty: 3,
      estimatedTime: '25-35分钟',
      warning: '不要说"为什么不欺负别人就欺负你"、不要说"你打回去啊"',
      situation: '孩子最近不愿去学校、闷闷不乐，经过沟通发现被同学排挤、嘲笑甚至欺负。',
      rounds: [
        {
          step: 1,
          title: '认真倾听',
          parentLine: '谢谢你愿意告诉我这些。这不是你的错，你跟我说出来就做得很好。',
          childResponse: '（哭）可是他们都说我坏话...没人愿意跟我玩。',
          tips: [
            '首先肯定孩子说出来的勇气',
            '明确说"这不是你的错"',
            '认真听，不打断、不评判'
          ],
          whyItWorks: '被霸凌的孩子往往会自责，觉得"是不是我哪里不好"。先帮他卸下这个包袱，让他知道"你没有错，错的是欺负人的人"。',
          emotion: 'warm'
        },
        {
          step: 2,
          title: '明确立场',
          parentLine: '我会站在你这边，我们一起面对。',
          childResponse: '真的吗？你不会说"为什么他们只欺负我"吧？',
          tips: [
            '明确表态：我和你是一伙的',
            '不指责受害者',
            '给孩子安全感'
          ],
          whyItWorks: '被霸凌的孩子最害怕的是"连爸妈都不站在我这边"。明确你的立场，给孩子安全感，他才有力量面对这件事。',
          emotion: 'firm'
        },
        {
          step: 3,
          title: '具体行动',
          parentLine: '你觉得需要我出面找老师，还是你先按照咱们商量好的办法应对？',
          childResponse: '...我不想让你去找老师，太丢人了。我先自己试试吧。',
          tips: [
            '尊重孩子的选择',
            '提供选项，不是替他做决定',
            '如果他选择自己应对，教他具体方法'
          ],
          whyItWorks: '被霸凌已经让孩子失去了控制感。让他自己决定怎么应对，能帮他找回掌控感，也能培养他解决问题的能力。',
          emotion: 'warm'
        },
        {
          step: 4,
          title: '持续关注',
          parentLine: '我会每天问你今天在学校的感觉，不用怕，我们随时调整策略。',
          childResponse: '嗯...谢谢你爸/妈。',
          tips: [
            '持续跟进，不是问一次就完了',
            '让孩子知道"你不是一个人在战斗"',
            '情况严重时必须介入'
          ],
          whyItWorks: '霸凌不是一次就能解决的。持续的关注和支持，让孩子知道"不管多难，爸妈都在"，他才能坚持下去。',
          emotion: 'warm'
        }
      ]
    },
    {
      id: 'friend-fight',
      title: '和好朋友闹翻',
      category: 'social',
      icon: '👭',
      coverGradient: gradients.social,
      description: '孩子和最好的朋友绝交，情绪低落，说"再也不相信朋友了"...',
      difficulty: 2,
      estimatedTime: '15-20分钟',
      warning: '不要说"不就是个朋友吗"、不要直接评价谁对谁错',
      situation: '孩子和最好的朋友绝交，情绪低落，说"再也不相信朋友了"。',
      rounds: [
        {
          step: 1,
          title: '接纳情绪',
          parentLine: '失去一个重要的朋友确实非常难受，我懂。',
          childResponse: '（哭）我把她当最好的朋友，她怎么能这样对我...',
          tips: [
            '认真对待孩子的友情',
            '不说"这点小事算什么"',
            '共情他的痛苦'
          ],
          whyItWorks: '对孩子来说，好朋友可能是世界上最重要的人。失去最好的朋友，可能比成年人失恋还痛。被理解，是治愈的第一步。',
          emotion: 'warm'
        },
        {
          step: 2,
          title: '不急着给建议',
          parentLine: '你想说说发生了什么吗？不想说也没关系。',
          childResponse: '（开始讲述）',
          tips: [
            '邀请说，但不强迫',
            '孩子说的时候认真听',
            '不急于评价谁对谁错'
          ],
          whyItWorks: '有时候孩子只是需要一个倾听者。把心里的委屈说出来，情绪就已经好了一大半。急着给建议，反而会打断情绪的流动。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '引导反思',
          parentLine: '你觉得你们的矛盾有没有办法解开？你希望以后怎么处理这件事？',
          childResponse: '...我不知道，我现在不想理她。',
          tips: [
            '用提问引导孩子自己思考',
            '不替孩子做决定',
            '尊重孩子的节奏'
          ],
          whyItWorks: '自己想清楚的决定，才是真正的决定。引导思考而不是给答案，孩子才能从中学到处理人际关系的能力。',
          emotion: 'calm'
        },
        {
          step: 4,
          title: '给空间',
          parentLine: '有时候朋友之间需要一点距离，过段时间可能想法就不一样了。',
          childResponse: '...希望吧。',
          tips: [
            '给时间和空间，不急着"修复"',
            '让孩子知道"这是人生的正常经历"',
            '相信孩子有能力处理'
          ],
          whyItWorks: '友情的分分合合是成长的必经之路。比起"帮孩子解决问题"，更重要的是"陪孩子经历这件事"，让他从中学习和成长。',
          emotion: 'warm'
        }
      ]
    },
    {
      id: 'teacher-conflict',
      title: '和老师冲突',
      category: 'social',
      icon: '🏫',
      coverGradient: gradients.social,
      description: '孩子被老师当众批评后顶撞老师，双方关系紧张...',
      difficulty: 2,
      estimatedTime: '15-20分钟',
      warning: '不要一上来就站在老师那边、不要说"老师都是为你好"',
      situation: '孩子被老师当众批评后顶撞老师，双方关系紧张，孩子不想上该老师的课。',
      rounds: [
        {
          step: 1,
          title: '先听孩子说',
          parentLine: '先告诉我发生了什么，我相信你有你的理由。',
          childResponse: '（开始讲述，越说越激动）',
          tips: [
            '不预设立场，先听孩子的说法',
            '用"你的版本"这样的词，表示你愿意客观了解',
            '不在情绪激动的时候评判对错'
          ],
          whyItWorks: '公正世界信念——每个人都渴望被理解、被公正对待。先听孩子说，让他感受到"我爸妈是讲道理的"，后续的沟通才有效。',
          emotion: 'calm'
        },
        {
          step: 2,
          title: '帮孩子理解老师',
          parentLine: '老师当众批评你确实让你很难堪，不过你觉得老师为什么会那样做？',
          childResponse: '...可能他那天心情也不好吧。',
          tips: [
            '先共情孩子的感受',
            '再引导孩子从老师的角度想',
            '不是"老师没错"，是"老师也有他的立场"'
          ],
          whyItWorks: '观点采择能力——帮助孩子站在他人的角度看问题。这不是让孩子忍气吞声，而是培养他的同理心和解决问题的能力。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '不站队也不指责',
          parentLine: '你的感受是真实的，但跟老师硬碰硬对你自己没好处。',
          childResponse: '那我怎么办？难道就忍着吗？',
          tips: [
            '既不站在老师那边指责孩子',
            '也不纵容孩子的冲动行为',
            '聚焦于"怎么解决"，不是"谁对谁错"'
          ],
          whyItWorks: '问题解决取向——把关注点从"谁对谁错"转移到"怎么解决"。这样既保护了孩子的自尊心，又教会了他应对冲突的能力。',
          emotion: 'calm'
        },
        {
          step: 4,
          title: '给解决方案',
          parentLine: '你希望我出面跟老师聊聊，还是你自己先试着缓一缓？',
          childResponse: '...我自己先试试吧，你去了我更尴尬。',
          tips: [
            '提供选项，让孩子选择',
            '尊重孩子的意愿',
            '如果他选择自己处理，给他具体建议'
          ],
          whyItWorks: '让孩子自己决定怎么处理，能培养他的责任感和解决问题的能力。家长在背后支持，而不是冲在前面替他解决。',
          emotion: 'warm'
        }
      ]
    },
    {
      id: 'body-image',
      title: '过度在意外貌',
      category: 'identity',
      icon: '🪞',
      coverGradient: gradients.identity,
      description: '孩子过度节食、称体重、对镜子挑剔，说"我好胖""我不好看"...',
      difficulty: 3,
      estimatedTime: '20-30分钟',
      warning: '不要说"你一点都不胖"太敷衍、不要评论身材',
      situation: '孩子（尤其是女孩）开始过度节食、称体重、对镜子挑剔，说"我好胖""我不好看"。',
      rounds: [
        {
          step: 1,
          title: '不敷衍',
          parentLine: '我听到你这样说自己，心里很难受。在我眼里你很好看。',
          childResponse: '你是我妈，你当然这么说了。',
          tips: [
            '认真对待孩子的自我否定',
            '不只说"你很好看"，要具体',
            '表达你的感受，不是只讲道理'
          ],
          whyItWorks: '青春期的孩子对自我形象非常敏感。敷衍的"你不胖"会让他们觉得"你根本不懂"。真诚地表达关心，才能让他们听得进去。',
          emotion: 'warm'
        },
        {
          step: 2,
          title: '不评价饮食',
          parentLine: '每顿饭要吃够，身体是本钱。节食把身体搞坏了，后悔都来不及。',
          childResponse: '可是我真的很胖啊...同学都比我瘦。',
          tips: [
            '关注健康，不是体重',
            '不说"你吃太多了"或"你吃太少了"',
            '强调"健康最重要"'
          ],
          whyItWorks: '过度在意外貌的背后，往往是低自尊和对"被接纳"的渴望。关注健康而非身材，能把焦点从"好不好看"转移到"健不健康"。',
          emotion: 'firm'
        },
        {
          step: 3,
          title: '引导健康观',
          parentLine: '健康比瘦重要。如果你想调整体型，咱们可以一起运动，但不靠饿。',
          childResponse: '运动有用吗？我怕越运动越壮。',
          tips: [
            '提供健康的替代方案',
            '不说"你就是懒"',
            '邀请孩子一起，不是命令'
          ],
          whyItWorks: '节食是不健康的体重管理方式。引导孩子用健康的方式管理身材，既能满足他"想变好"的需求，又不会伤害身体。',
          emotion: 'warm'
        },
        {
          step: 4,
          title: '关注深层',
          parentLine: '你最近是不是压力很大？有时候对自己挑剔是因为心里焦虑。',
          childResponse: '...可能吧，最近考试特别多。',
          tips: [
            '身体意象问题往往和情绪有关',
            '帮孩子看到情绪和身体感受的联系',
            '从根源解决问题'
          ],
          whyItWorks: '很多时候，对身体的不满只是表面现象，背后可能是焦虑、压力、低自我价值感。找到根源，才能真正解决问题。',
          emotion: 'warm'
        }
      ]
    },
    {
      id: 'life-meaningless',
      title: '"活着没意义"',
      category: 'identity',
      icon: '💭',
      coverGradient: gradients.identity,
      description: '孩子说出这句话或在社交平台表达悲观消极情绪...',
      difficulty: 3,
      estimatedTime: '30分钟以上',
      warning: '不要说"你小小年纪懂什么"、不要不当回事',
      situation: '孩子说出这句话或在社交媒体上表达类似悲观消极的情绪，情绪持续低落。',
      rounds: [
        {
          step: 1,
          title: '极度重视',
          parentLine: '你这句话让我很担心。你能告诉我你最近在想什么吗？',
          childResponse: '没什么...就是随便说说。',
          tips: [
            '认真对待这句话，不要不当回事',
            '表达你的担心，不是指责',
            '即使孩子说"随便说说"，也要重视'
          ],
          whyItWorks: '说"活着没意义"可能是求救信号。忽视这句话，可能错过最佳干预时机。认真对待，是对孩子负责。',
          emotion: 'warm'
        },
        {
          step: 2,
          title: '不评价不教育',
          parentLine: '谢谢你愿意告诉我，这需要很大的勇气。',
          childResponse: '...我以为你会骂我。',
          tips: [
            '不批评、不说教',
            '肯定孩子说出来的勇气',
            '让孩子知道"说出来是对的"'
          ],
          whyItWorks: '孩子鼓起很大的勇气才说出这句话。如果换来的是批评和说教，他以后再也不会说了。肯定他的勇气，才能继续沟通。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '表达爱与支持',
          parentLine: '你对我非常重要。不管发生什么，我们一起面对。',
          childResponse: '（哭）真的吗？可是我觉得自己什么都做不好...',
          tips: [
            '明确表达爱和重视',
            '让孩子知道"你很重要"',
            '传递"我们一起面对"的态度'
          ],
          whyItWorks: '觉得活着没意义的人，往往是觉得"没人需要我""我不重要"。让他知道"你对我很重要"，可能就能把他从边缘拉回来。',
          emotion: 'warm'
        },
        {
          step: 4,
          title: '立即行动',
          parentLine: '我觉得我们可以找专业的心理咨询师聊一聊，我陪你去。',
          childResponse: '看心理医生？会不会显得我很奇怪？',
          tips: [
            '建议寻求专业帮助',
            '把"看心理医生"正常化',
            '陪孩子一起去，不是"送他去"'
          ],
          whyItWorks: '当孩子出现轻生念头时，专业的心理干预是必须的。家长的支持很重要，但不能替代专业帮助。',
          emotion: 'firm'
        }
      ]
    },
    {
      id: 'label-stigma',
      title: '被贴"没出息"标签',
      category: 'identity',
      icon: '🏷️',
      coverGradient: gradients.identity,
      description: '老师当众说"你就这样了"，或亲戚说"你家孩子成绩不太行"...',
      difficulty: 2,
      estimatedTime: '15-20分钟',
      warning: '不要说"别人也是为你好"、不要附和别人的评价',
      situation: '老师当众说"你就这样了"，或亲戚聚会时说"你家孩子成绩不太行"。',
      rounds: [
        {
          step: 1,
          title: '帮孩子翻译',
          parentLine: '别人怎么说不重要，重要的是你怎么看自己。',
          childResponse: '可是他是老师啊...他都这么说了，是不是我真的不行？',
          tips: [
            '先帮孩子和"评价"拉开距离',
            '不否定别人，但更相信孩子',
            '把评价的解释权还给孩子'
          ],
          whyItWorks: '孩子很容易把权威人物（老师、长辈）的评价当成事实。帮他看到"那只是别人的看法，不是事实"，能保护他的自我价值感。',
          emotion: 'warm'
        },
        {
          step: 2,
          title: '区分评价',
          parentLine: '一次考试、一个老师的看法，不能定义你是谁。',
          childResponse: '可是大家都这么觉得...',
          tips: [
            '区分"一件事"和"整个人"',
            '不因为一件事否定整个人',
            '告诉孩子"你比任何评价都丰富"'
          ],
          whyItWorks: '孩子容易犯"过度概括"的错误——一次考不好=我笨；一个人不喜欢我=没人喜欢我。帮他看到全局，他就不会被某一个评价击垮。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '给肯定',
          parentLine: '我看到的你是善良、有爱心、对朋友特别仗义的人。这些都是比成绩更重要的品质。',
          childResponse: '（有点意外）真的吗？你真的这么觉得？',
          tips: [
            '说出孩子的具体优点',
            '不只说"你很棒"，要说"你哪里棒"',
            '肯定的是品质，不是成绩'
          ],
          whyItWorks: '空泛的"你真棒"孩子听了可能没感觉。具体的、真诚的肯定，才能真正进入孩子心里，帮他建立自信。',
          emotion: 'warm'
        },
        {
          step: 4,
          title: '给力量',
          parentLine: '如果你觉得被看低了，就用行动证明给他们看，但不是为了他们，是为了你自己。',
          childResponse: '...嗯，我知道了。',
          tips: [
            '把"证明给别人看"转化为"为自己而努力"',
            '不鼓励报复性努力',
            '动机从"别人"转向"自己"'
          ],
          whyItWorks: '为了证明给别人看而努力，动力是不稳定的。为了自己的成长而努力，动力才是持久的。帮孩子调整动机，他才能走得更远。',
          emotion: 'firm'
        }
      ]
    },
    {
      id: 'parents-fight',
      title: '父母吵架',
      category: 'family',
      icon: '💔',
      coverGradient: gradients.family,
      description: '夫妻当着孩子面吵架后，孩子变得沉默、回避、焦虑...',
      difficulty: 3,
      estimatedTime: '20-30分钟',
      warning: '不要说"大人的事小孩别管"、不要在孩子面前说对方坏话',
      situation: '夫妻当着孩子面吵架后，孩子变得沉默、回避、焦虑或表现出反常的乖。',
      rounds: [
        {
          step: 1,
          title: '主动道歉',
          parentLine: '刚才爸妈吵架吓到你了吧？对不起，这不是你的错。',
          childResponse: '（低头）...你们会不会离婚？',
          tips: [
            '主动提起这件事，不回避',
            '为"吓到孩子"道歉',
            '明确说"不是你的错"'
          ],
          whyItWorks: '孩子看到父母吵架，第一反应往往是"是不是因为我"。明确告诉他"不是你的错"，能减轻他的自责和焦虑。',
          emotion: 'warm'
        },
        {
          step: 2,
          title: '解释但不甩锅',
          parentLine: '我们是因为意见不同情绪有点激动，不是因为你做了什么。',
          childResponse: '可是我好怕...',
          tips: [
            '简单解释原因，不深入细节',
            '不说"都是你爸/妈的错"',
            '让孩子知道"吵架是大人之间的事"'
          ],
          whyItWorks: '孩子需要一个"合理"的解释来理解发生了什么。但不需要细节，更不能让他站队。让他知道"这是大人的事，和你无关"最重要。',
          emotion: 'warm'
        },
        {
          step: 3,
          title: '给安全感',
          parentLine: '不管我们之间有什么矛盾，我们都爱你，这个不会变。',
          childResponse: '真的吗？你们不会不要我吧？',
          tips: [
            '明确表达对孩子的爱',
            '给孩子确定感',
            '让他知道"爸妈的事是爸妈的，对你的爱不会变"'
          ],
          whyItWorks: '父母吵架对孩子最大的威胁是"安全感的丧失"。重建安全感，告诉孩子"我们对你的爱不会变"，是最重要的事。',
          emotion: 'warm'
        },
        {
          step: 4,
          title: '后续调整',
          parentLine: '以后我们会尽量不在你面前这样，如果你心里还有不舒服，随时可以跟我说。',
          childResponse: '...嗯，知道了。',
          tips: [
            '承诺改进，说到做到',
            '给孩子表达感受的渠道',
            '用行动重建信任'
          ],
          whyItWorks: '道歉和承诺很重要，但更重要的是行动。真的改变，才能让孩子相信"以后不会这样了"。',
          emotion: 'firm'
        }
      ]
    }
  ];

  const deepDialogs = {
    'phone-late-night': [
      {
        id: 'rebellion-1',
        title: '孩子说："我就玩一会儿，你管那么多干嘛！"',
        childOpening: '我就玩一会儿，你管那么多干嘛！',
        rounds: [
          {
            round: 1,
            parentLine: '太晚了，先睡吧，明天还要上学。我不是要管你，是担心你睡眠不够。',
            childNext: '我睡不着才玩的，你又不让我玩，那我干嘛？'
          },
          {
            round: 2,
            parentLine: '睡不着确实很难受。你最近经常这样睡不着吗？还是今晚有什么心事？',
            childNext: '就是睡不着，没有为什么。'
          },
          {
            round: 3,
            parentLine: '好，那今晚不聊了。你先躺下试试，闭着眼睛休息也算休息。明天白天我们再聊聊作息的事，好吗？',
            childNext: '（第二天白天）你又要说手机的事了吧？'
          },
          {
            round: 4,
            parentLine: '不是要说教。我是想了解，你晚上一般几点能睡着？是不是白天压力太大了？',
            childNext: '作业那么多，写完都十一点了，哪有时间玩？我就睡前放松一下。'
          },
          {
            round: 5,
            parentLine: '听你这么说，我理解了。作业确实多，睡前想放松也很正常。我担心的不是"玩手机"本身，是怕你睡太晚影响白天状态。',
            childNext: '我白天精神好得很，不用你操心。'
          },
          {
            round: 6,
            parentLine: '那我换个方式问——如果咱们一起定个规则，比如晚上11点后手机放客厅，你觉得怎么样？这样你也能安心睡。',
            childNext: '凭什么？手机是我的！'
          },
          {
            round: 7,
            parentLine: '你说得对，手机是你的。我只是提个建议，不是命令。你觉得几点交手机比较合理？你来定。',
            childNext: '12点。'
          },
          {
            round: 8,
            parentLine: '12点也可以，但我们先试一周。如果12点睡你白天还是有精神，就按12点来。如果不行，我们再调整。可以吗？',
            childNext: '行吧，试试就试试。'
          },
          {
            round: 9,
            parentLine: '好，那我也和你一样，睡前半小时不碰手机，咱们互相监督。',
            childNext: '你说话算话？'
          },
          {
            round: 10,
            parentLine: '算话。我们一起执行，谁违规谁请客吃早餐，怎么样？',
            childNext: '...那行吧。'
          }
        ]
      },
      {
        id: 'comparison',
        title: '孩子说："同学都玩到两点，我算早的了"',
        childOpening: '同学都玩到两点，我算早的了！',
        rounds: [
          {
            round: 1,
            parentLine: '听起来你觉得跟同学比，自己已经很自律了。但每个家庭规矩不一样，我更关心的是你的身体状态。',
            childNext: '我身体好得很，你又不懂。'
          },
          {
            round: 2,
            parentLine: '可能我确实不完全懂你们年轻人的节奏。但我观察到你这周早上起床很困难，早饭也吃不下——这是我看到的，不是指责。',
            childNext: '那是因为早饭不好吃。'
          },
          {
            round: 3,
            parentLine: '好，那明天早上你想吃什么？我来做。但如果睡太晚，再好吃的早饭也没胃口吃，对吧？',
            childNext: '……那也是。'
          },
          {
            round: 4,
            parentLine: '所以咱们能不能这样——你告诉我你希望几点睡，我们一起定一个对你来说合理、对我来说安心的时间？',
            childNext: '11点半。'
          },
          {
            round: 5,
            parentLine: '11点半可以。那咱们试一周，看看早上状态怎么样。如果11点半睡早上还是困，我们再聊。',
            childNext: '如果我不困呢？'
          },
          {
            round: 6,
            parentLine: '那说明这个时间对你来说合适，就继续。我只是想找到一个对你身体好的方式，不是为了限制你。',
            childNext: '那你不能没收我手机。'
          },
          {
            round: 7,
            parentLine: '我没打算没收。只要你能按约定时间放下手机，手机就是你的。我相信你能做到。',
            childNext: '万一我超时了呢？'
          },
          {
            round: 8,
            parentLine: '超时了我们就聊聊原因——是那天作业特别多，还是有什么特别的事？不惩罚，只调整。',
            childNext: '你说的啊，不惩罚。'
          },
          {
            round: 9,
            parentLine: '我说的。规则是为了帮你，不是为了罚你。你做到了我高兴，你没做到我们一起想办法。',
            childNext: '那好吧，试试。'
          },
          {
            round: 10,
            parentLine: '好，从今晚开始。晚安，明天见。',
            childNext: '晚安。'
          }
        ]
      },
      {
        id: 'double-standard',
        title: '孩子说："你凭什么不玩手机，就管我？"',
        childOpening: '你凭什么不玩手机，就管我？',
        rounds: [
          {
            round: 1,
            parentLine: '你说得对，我也有刷手机到很晚的时候。从今晚开始，我也把手机放客厅，我们一起改。',
            childNext: '你骗人，你根本做不到。'
          },
          {
            round: 2,
            parentLine: '我可能做不到完美，但我会尽力。如果我没做到，你也可以提醒我——我们互相监督，公平吧？',
            childNext: '你是大人，我是小孩，怎么公平？'
          },
          {
            round: 3,
            parentLine: '公平不是年龄一样，是规则一样。我们都约定一个时间放下手机，谁超时谁承担责任。你觉得公平吗？',
            childNext: '那如果你超时了呢？'
          },
          {
            round: 4,
            parentLine: '那我请你吃一顿你想吃的，或者帮你做一件你想让我做的事。你呢？',
            childNext: '我超时了你别唠叨我就行。'
          },
          {
            round: 5,
            parentLine: '好，我不唠叨。但我可能会提醒你一句"时间到了"，可以吗？就一句。',
            childNext: '一句啊，说多了我烦。'
          },
          {
            round: 6,
            parentLine: '就一句。你听到之后自己决定怎么做——我相信你有这个判断力。',
            childNext: '那如果我就是不放下呢？'
          },
          {
            round: 7,
            parentLine: '那我们就坐下来聊聊，是什么让你今天不想放下。是有心事，还是特别累？不惩罚，只了解。',
            childNext: '你这么说我还挺意外的。'
          },
          {
            round: 8,
            parentLine: '因为我是真的想帮你，不是想控制你。你是我孩子，我关心你睡得好不好，仅此而已。',
            childNext: '……那行吧。'
          },
          {
            round: 9,
            parentLine: '谢谢你的信任。今晚开始，我们一起。',
            childNext: '晚安。'
          },
          {
            round: 10,
            parentLine: '晚安，好梦。',
            childNext: ''
          }
        ]
      }
    ],
    'exam-fail': [
      {
        id: 'effort-denied',
        title: '孩子说："你根本不知道我有多努力！"',
        childOpening: '（把卷子扔桌上）你根本不知道我有多努力！',
        rounds: [
          {
            round: 1,
            parentLine: '看起来你自己也很难过，对吧？我知道你为这次考试付出了很多。',
            childNext: '你只知道看分数，从来不看过程！'
          },
          {
            round: 2,
            parentLine: '你说得对，我可能太关注分数了。你能告诉我你这段时间是怎么复习的吗？我想听听过程。',
            childNext: '我每天晚上都复习到很晚，结果还是这样！'
          },
          {
            round: 3,
            parentLine: '每天晚上都复习到很晚——那真的很辛苦。考成这样，你一定特别沮丧。换做是我，也会很难过。',
            childNext: '那你还说我！'
          },
          {
            round: 4,
            parentLine: '我刚才说"这次没考好"的时候，是不是让你觉得我在批评你？对不起，那不是我的本意。我是想说——我们一起看看问题在哪，不是要怪你。',
            childNext: '问题就是题目太难了！'
          },
          {
            round: 5,
            parentLine: '题目难是客观的。你觉得是哪科最吃力？是没听懂还是没时间复习？',
            childNext: '数学，老师讲太快了，我跟不上。'
          },
          {
            round: 6,
            parentLine: '明白了。那我们需要解决的是"跟不上"的问题，不是"你不够努力"的问题。你觉得哪种方式对你有帮助——找个补习老师，还是我帮你一起看错题？',
            childNext: '补习老师又要花钱。'
          },
          {
            round: 7,
            parentLine: '钱的事我来考虑。你先想哪种方式对你最有效。如果补习有用，这个钱花得值。',
            childNext: '那……要不你先帮我看看错题？'
          },
          {
            round: 8,
            parentLine: '好，今晚我们一起看。你不用一个人扛，我陪着你。',
            childNext: '你不会骂我吧？'
          },
          {
            round: 9,
            parentLine: '不会。错题就是用来发现问题的，发现了才能解决。我们一起找方法，不找责任。',
            childNext: '谢谢你。'
          },
          {
            round: 10,
            parentLine: '不用谢。你愿意让我帮忙，我就很高兴了。',
            childNext: ''
          }
        ]
      },
      {
        id: 'self-denial',
        title: '孩子说："考不好就考不好，反正我就是笨"',
        childOpening: '考不好就考不好，反正我就是笨。',
        rounds: [
          {
            round: 1,
            parentLine: '我听到你这样说自己，心里很难受。一次考试不能定义你聪明还是笨——它只说明这次有些知识点没掌握好。',
            childNext: '每次都考不好，不是笨是什么？'
          },
          {
            round: 2,
            parentLine: '每次都考不好——听起来你已经努力了很多次，结果却一直不理想，这一定让你特别挫败。我能理解你为什么会这么想。',
            childNext: '你理解有什么用，分数又不会变。'
          },
          {
            round: 3,
            parentLine: '分数确实不会马上变。但我们可以让下一次的分数变。你觉得咱们从哪一科开始调整比较好？',
            childNext: '都不想调整，反正也没用。'
          },
          {
            round: 4,
            parentLine: '你现在觉得做什么都没用，这种感觉一定很难受。我不逼你现在就做决定——但我想让你知道，不管你考多少分，你都是我的孩子。',
            childNext: '你这么说是不是因为我考太差了？'
          },
          {
            round: 5,
            parentLine: '不是。我这么说是因为这是事实——你是我孩子，这个不会因为分数改变。考试只是检测这段时间学得怎么样，不是判你生死。',
            childNext: '那你还管我学习干嘛？'
          },
          {
            round: 6,
            parentLine: '管你学习是因为我在乎你的未来，不是在乎你的分数。如果你需要帮助，我在这里。如果你暂时不想谈，我也可以等。',
            childNext: '……那我想先自己待会儿。'
          },
          {
            round: 7,
            parentLine: '好。饭在桌上，饿了就出来吃。如果你想聊了，我随时在。',
            childNext: '（过了一会儿出来）其实……数学我真的听不懂。'
          },
          {
            round: 8,
            parentLine: '谢谢你愿意告诉我。听不懂不是你的错——可能是方法不对，也可能是基础没跟上。我们一起来想办法。',
            childNext: '那你能帮我找个补习老师吗？'
          },
          {
            round: 9,
            parentLine: '可以。但我希望你先想清楚——你希望补习老师帮你解决什么问题？是补基础，还是同步跟进度？',
            childNext: '都想要。'
          },
          {
            round: 10,
            parentLine: '好，那我们就找一个能兼顾的老师。你愿意试，我就支持。',
            childNext: ''
          }
        ]
      },
      {
        id: 'parent-comparison',
        title: '孩子说："你当年不也没考多好，凭什么说我？"',
        childOpening: '你当年不也没考多好，凭什么说我？',
        rounds: [
          {
            round: 1,
            parentLine: '你说得对，我当年成绩也一般。正因为我自己经历过，才知道考不好是什么感觉——所以我更想帮你，不是要批评你。',
            childNext: '那你现在不也活得挺好？'
          },
          {
            round: 2,
            parentLine: '我确实活得还行。但我也走过很多弯路——如果能有人在我那时候帮我一把，也许我现在会更好。我不想你走我走过的弯路。',
            childNext: '你又来了，又要说教。'
          },
          {
            round: 3,
            parentLine: '好，不说教。我只是想说——你比我那时候有更多的可能性。我不要求你考第一，只希望你尽力，不后悔。',
            childNext: '那如果我尽力了还是考不好呢？'
          },
          {
            round: 4,
            parentLine: '那我们就接受这个结果，然后找别的路。人生不是只有一条路——但前提是，你真的尽力了。',
            childNext: '你怎么知道我有没有尽力？'
          },
          {
            round: 5,
            parentLine: '我不知道。只有你自己知道。所以我不判断你，你自己判断——这次考试，你尽力了吗？',
            childNext: '……其实没有，我复习的时候老走神。'
          },
          {
            round: 6,
            parentLine: '谢谢你这么诚实。走神说明你压力大或者累了——这不是态度问题，是状态问题。我们怎么调整状态？',
            childNext: '我也不知道。'
          },
          {
            round: 7,
            parentLine: '那我们一起来想——你觉得是休息不够，还是学习方法太枯燥？',
            childNext: '都有吧。'
          },
          {
            round: 8,
            parentLine: '好，那我们先解决休息问题——今晚早点睡。学习方法我们周末再聊，可以吗？',
            childNext: '可以。'
          },
          {
            round: 9,
            parentLine: '好。不急，一步一步来。',
            childNext: '那你别老盯着我。'
          },
          {
            round: 10,
            parentLine: '不盯着。你定计划，我来配合。这是你的事，你主导。',
            childNext: ''
          }
        ]
      }
    ],
    'silent-treatment': [
      {
        id: 'leave-me-alone',
        title: '孩子说："烦不烦！你能不能别管我！"',
        childOpening: '烦不烦！你能不能别管我！',
        rounds: [
          {
            round: 1,
            parentLine: '好，我先不管。饭在桌上，饿了就出来吃。',
            childNext: '（不说话，摔门）'
          },
          {
            round: 2,
            parentLine: '（在门外轻声说）我不逼你说话。但你如果想聊，我随时都在。',
            childNext: '（过了半小时出来倒水）'
          },
          {
            round: 3,
            parentLine: '（不追问，只是说）水壶里有热的。',
            childNext: '（看了家长一眼，没说话）'
          },
          {
            round: 4,
            parentLine: '（微笑）没事，你忙你的。',
            childNext: '（回到房间前停了一下）……我今天心情不好。'
          },
          {
            round: 5,
            parentLine: '谢谢你告诉我。如果你愿意说，我听着。不想说也没关系。',
            childNext: '跟同学吵架了。'
          },
          {
            round: 6,
            parentLine: '跟同学吵架确实很难受。你想说说发生了什么吗？不想说也没关系。',
            childNext: '他把我东西弄坏了还不承认。'
          },
          {
            round: 7,
            parentLine: '东西被弄坏对方还不承认——换做是我也会很生气。你当时是怎么处理的？',
            childNext: '我跟他说了，他说我冤枉他。'
          },
          {
            round: 8,
            parentLine: '那你一定觉得很委屈吧。你希望我怎么帮你？',
            childNext: '不用你帮，我自己能解决。'
          },
          {
            round: 9,
            parentLine: '我相信你能解决。如果你需要我出主意，我随时在。如果你只是想吐槽，我也听着。',
            childNext: '……那你能听我说完吗？'
          },
          {
            round: 10,
            parentLine: '当然。你慢慢说，我听着，不打断。',
            childNext: ''
          }
        ]
      },
      {
        id: 'you-wont-understand',
        title: '孩子说："说了你也不懂"',
        childOpening: '说了你也不懂。',
        rounds: [
          {
            round: 1,
            parentLine: '也许我确实不完全懂。但我愿意听，你愿意说说看吗？',
            childNext: '你们大人根本不懂我们这代人的事。'
          },
          {
            round: 2,
            parentLine: '你说得对，我们成长的环境不一样，有些事我可能真的不懂。但不懂我可以学——你愿意教我吗？',
            childNext: '教你也教不会。'
          },
          {
            round: 3,
            parentLine: '可能我学得慢，但我愿意试。你只要告诉我一件事——你现在需要我做什么？是听你吐槽，给你建议，还是帮你做点什么？',
            childNext: '……听我吐槽吧。'
          },
          {
            round: 4,
            parentLine: '好。那我就只听，不给建议。你说完之前我不打断。',
            childNext: '今天体育课分组没人选我……'
          },
          {
            round: 5,
            parentLine: '（专注倾听，不打断）',
            childNext: '然后我就一个人站在那儿，特别尴尬。'
          },
          {
            round: 6,
            parentLine: '分组没人选你，一个人站在那里——那确实很难堪。换做是我也会很难受。',
            childNext: '后来老师把我分到另一组，但那些人我也不熟。'
          },
          {
            round: 7,
            parentLine: '被分到不熟的组，感觉更不自在了吧？',
            childNext: '嗯，整节课都很尴尬。'
          },
          {
            round: 8,
            parentLine: '谢谢你愿意告诉我这些。说出来有没有好一点？',
            childNext: '好一点了。'
          },
          {
            round: 9,
            parentLine: '那就好。如果你下次遇到类似的事，可以回来跟我说。我不一定能帮你解决，但我会认真听。',
            childNext: '好。'
          },
          {
            round: 10,
            parentLine: '饿不饿？饭还热着。',
            childNext: ''
          }
        ]
      },
      {
        id: 'you-side-with-others',
        title: '孩子说："你总是站在别人那边"',
        childOpening: '你总是站在别人那边！',
        rounds: [
          {
            round: 1,
            parentLine: '我听到你这么说，心里挺难过的。你是不是觉得我没有站在你这边？',
            childNext: '上次老师说我，你就帮老师说话！'
          },
          {
            round: 2,
            parentLine: '上次老师说你的时候，我是不是说了"老师也是为你好"之类的话？',
            childNext: '对！你每次都这样！'
          },
          {
            round: 3,
            parentLine: '我明白了。我说那句话的时候，你听到的是"我站在老师那边"，对吗？那不是我的本意。我的本意是担心你。',
            childNext: '担心什么？担心我给你丢人？'
          },
          {
            round: 4,
            parentLine: '不是。我担心的是——如果你和老师关系不好，受影响最大的是你自己。我不是站在老师那边，我是站在"你过得好"那边。',
            childNext: '那你当时为什么不直接说？'
          },
          {
            round: 5,
            parentLine: '你说得对，我当时应该直接说清楚。对不起，是我没说清楚。',
            childNext: '……那你现在说清楚了。'
          },
          {
            round: 6,
            parentLine: '那我们现在能聊聊吗？不管发生什么，我情感上是站在你这边的。',
            childNext: '其实老师那次也不是全错……'
          },
          {
            round: 7,
            parentLine: '你能这么说，说明你也在客观地想这件事。你觉得老师哪部分说得对，哪部分不对？',
            childNext: '他说我上课说话是对的，但他说我故意捣乱是冤枉的。'
          },
          {
            round: 8,
            parentLine: '明白了——你承认说话这件事，但不接受"故意捣乱"这个标签。这很合理。下次遇到类似情况，你希望我怎么反应？',
            childNext: '你先问我怎么回事，别直接站队。'
          },
          {
            round: 9,
            parentLine: '好，我记住了。以后遇到任何事，我先问你，不站队。',
            childNext: '你说话算话？'
          },
          {
            round: 10,
            parentLine: '算话。你随时可以提醒我。',
            childNext: ''
          }
        ]
      }
    ],
    'puppy-love-sign': [
      {
        id: 'privacy-invasion',
        title: '孩子说："你偷看我手机？！"',
        childOpening: '你偷看我手机？！',
        rounds: [
          {
            round: 1,
            parentLine: '对不起，我看了你的手机，这是我不对。我之所以这么做，是因为我注意到你最近有些变化，我担心你。',
            childNext: '你有什么权利看我隐私！'
          },
          {
            round: 2,
            parentLine: '你说得对，我没有权利。这是你的隐私，我尊重。但作为父母，看到你最近状态不对，我确实很担心——我应该直接问你，而不是偷看。',
            childNext: '那你现在知道了，你想怎么样？'
          },
          {
            round: 3,
            parentLine: '我不想怎么样。我想跟你聊聊——不是为了禁止什么，是想了解你在经历什么。',
            childNext: '没什么好聊的。'
          },
          {
            round: 4,
            parentLine: '好，那今天不聊。但我想让你知道——对异性有好感是很正常的事，这个年纪有这种感觉不奇怪。',
            childNext: '……你不反对？'
          },
          {
            round: 5,
            parentLine: '我不反对你交朋友，但我有几个担心——不影响学习、注意安全、保护好自己。这些你能理解吗？',
            childNext: '你就是想说我成绩下滑是因为谈恋爱。'
          },
          {
            round: 6,
            parentLine: '成绩下滑可能有多种原因——恋爱、压力、睡眠、学习方法……你觉得有关系吗？我们可以一起看看。',
            childNext: '……可能有一点吧。'
          },
          {
            round: 7,
            parentLine: '谢谢你这么诚实。那你自己觉得，这段关系是让你变得更好还是更累了？',
            childNext: '有时候开心，有时候烦。'
          },
          {
            round: 8,
            parentLine: '感情就是这样，有甜有苦。我只想提醒你——不管发生什么，保护好自己，学业也不要完全丢下。',
            childNext: '你不会去找他/她吧？'
          },
          {
            round: 9,
            parentLine: '不会。这是你的事，我不会去干涉。但如果你愿意，可以跟我说说他/她是什么样的人——我不会评价。',
            childNext: '……那我说说？'
          },
          {
            round: 10,
            parentLine: '嗯，我听着。',
            childNext: ''
          }
        ]
      },
      {
        id: 'you-cant-control-me',
        title: '孩子说："我就是喜欢他/她，你管不着！"',
        childOpening: '我就是喜欢他/她，你管不着！',
        rounds: [
          {
            round: 1,
            parentLine: '你说得对，喜欢谁是你的自由，我管不着。我也不打算管你喜欢谁。我关心的是——这段关系对你的影响。',
            childNext: '什么影响？我成绩下降了是吧？你们就知道成绩！'
          },
          {
            round: 2,
            parentLine: '成绩只是一部分。我更关心的是——你在这段关系里开不开心，有没有受到伤害，有没有影响你对未来的规划。',
            childNext: '我很开心，不用你操心。'
          },
          {
            round: 3,
            parentLine: '开心就好。那你能告诉我，你觉得这段关系让你在哪些方面变好了吗？',
            childNext: '……有人陪我聊天。'
          },
          {
            round: 4,
            parentLine: '有人陪伴确实是好事。那除了聊天，你们还会一起做什么？',
            childNext: '一起写作业，周末有时候出去。'
          },
          {
            round: 5,
            parentLine: '听起来挺正常的交往。那我想知道——你们有没有聊过未来？比如学业、目标这些？',
            childNext: '聊那些干嘛，太远了。'
          },
          {
            round: 6,
            parentLine: '不远。你们现在做的事情，会影响你们以后能去哪里。我不是要拆散你们——我是希望你们互相促进，而不是互相消耗。',
            childNext: '我们没有互相消耗！'
          },
          {
            round: 7,
            parentLine: '好，那我相信你们没有。我只是提醒——如果有一天你发现这段关系让你累了、分心了，你可以随时调整。你有这个权利。',
            childNext: '你不会偷偷找他/她吧？'
          },
          {
            round: 8,
            parentLine: '不会。我尊重你的选择。但如果你需要我帮忙——比如遇到不知道怎么处理的情况——我随时在。',
            childNext: '那如果我有一天想分手呢？'
          },
          {
            round: 9,
            parentLine: '那是你的决定。如果你想分手但不知道怎么开口，我可以帮你想想怎么说。如果你不想分，我也不会逼你。',
            childNext: '你这么说，我反而不知道说什么了。'
          },
          {
            round: 10,
            parentLine: '那就什么都不用说。你过得好，我就放心了。',
            childNext: ''
          }
        ]
      },
      {
        id: 'you-dont-understand',
        title: '孩子说："你根本不理解我"',
        childOpening: '你根本不理解我！',
        rounds: [
          {
            round: 1,
            parentLine: '也许我确实不完全理解。但我愿意试着理解——你能告诉我，你喜欢他/她什么吗？',
            childNext: '说了你也不懂，你们那个年代不一样。'
          },
          {
            round: 2,
            parentLine: '我们那个年代确实不一样。但喜欢一个人的感觉，不管什么年代都有些相似的地方——被关注、被重视、被在乎。对吗？',
            childNext: '……对。'
          },
          {
            round: 3,
            parentLine: '那我能理解一部分了。被在乎的感觉确实很好。所以你不是"做错了什么"，你是在经历一件很自然的事。',
            childNext: '那你为什么还要管？'
          },
          {
            round: 4,
            parentLine: '我不是要管你喜欢谁。我是在想——你现在这个年纪，除了感情，还有很多重要的事也在同时发生。你怎么平衡？',
            childNext: '我能平衡。'
          },
          {
            round: 5,
            parentLine: '我相信你能。但如果你发现平衡不了了，你愿意跟我聊聊吗？不是要你放弃什么，是一起想办法。',
            childNext: '那如果我说我平衡不了呢？'
          },
          {
            round: 6,
            parentLine: '那我们就一起看看——是感情占用了太多时间，还是学习方法需要调整。不指责，只解决问题。',
            childNext: '你说话算话？'
          },
          {
            round: 7,
            parentLine: '算话。我唯一的要求是——保护好自己，不管发生什么，安全第一。',
            childNext: '知道了。'
          },
          {
            round: 8,
            parentLine: '好。那我不再多说了。你如果需要我，我在这里。',
            childNext: '其实……我最近确实有点分心。'
          },
          {
            round: 9,
            parentLine: '谢谢你愿意告诉我。分心是很正常的。我们想想怎么调整，好吗？',
            childNext: '好。'
          },
          {
            round: 10,
            parentLine: '慢慢来，不急。',
            childNext: ''
          }
        ]
      }
    ],
    'learning-meaningless': [
      {
        id: 'idols-success',
        title: '孩子说："上学有什么用？XX网红初中毕业一样赚钱"',
        childOpening: '上学有什么用？XX网红初中毕业一样赚钱！',
        rounds: [
          {
            round: 1,
            parentLine: '你说的那个网红确实挺厉害的，他肯定也有过人之处。你关注他多久了？',
            childNext: '很久了，他视频特别有意思。'
          },
          {
            round: 2,
            parentLine: '你觉得他成功的关键是什么？是运气，还是他有什么特别的能力？',
            childNext: '他很有创意，而且特别努力。'
          },
          {
            round: 3,
            parentLine: '创意和努力——这两个品质确实很重要。那如果有一天他不做网红了，他需要什么能力转行？',
            childNext: '……不知道。'
          },
          {
            round: 4,
            parentLine: '学习不一定是为了考试，是为了让你有更多选择。如果有一天你想做别的，你有能力去做——这就是上学的意义。',
            childNext: '那我现在学的东西以后又用不上。'
          },
          {
            round: 5,
            parentLine: '有些知识确实用不上。但学习不只是学知识——还在锻炼你的思考能力、解决问题的能力。这些能力做什么都用得上。',
            childNext: '那我可以不考试吗？'
          },
          {
            round: 6,
            parentLine: '考试是检验学习效果的一种方式，不是目的。如果你不喜欢考试，我们可以一起想——怎么让学习本身变得不那么痛苦。',
            childNext: '不可能不痛苦。'
          },
          {
            round: 7,
            parentLine: '可能确实不会完全不痛苦。但我们可以让痛苦少一点——比如找到你感兴趣的科目，或者换一种学习方法。',
            childNext: '那如果我还是不想学呢？'
          },
          {
            round: 8,
            parentLine: '不想学的时候，我们可以休息一下，但不要彻底放弃。多条路总比一条路好——你现在放弃，以后选择就少了。',
            childNext: '你说的好像有道理……'
          },
          {
            round: 9,
            parentLine: '不是我说得有道理，是事实如此。我不要求你考第一，只希望你给自己留够选择的空间。',
            childNext: '那今天能请假吗？'
          },
          {
            round: 10,
            parentLine: '今天不行。但周末我们可以好好聊聊——你想做什么、喜欢什么、以后想过什么样的生活。我认真听。',
            childNext: ''
          }
        ]
      },
      {
        id: 'teacher-targets-me',
        title: '孩子说："老师针对我，我不想去"',
        childOpening: '老师针对我，我不想去！',
        rounds: [
          {
            round: 1,
            parentLine: '先告诉我发生了什么，我相信你有你的理由。',
            childNext: '今天上课他又点我名，明明那么多人说话，就点我一个！'
          },
          {
            round: 2,
            parentLine: '当众被点名确实很尴尬。你觉得老师是故意针对你，还是恰好看到你了？',
            childNext: '就是故意的！他看我不顺眼！'
          },
          {
            round: 3,
            parentLine: '被针对的感觉一定很难受。你希望我怎么帮你？是去跟老师聊聊，还是我们一起想想怎么应对？',
            childNext: '你别去找老师，更尴尬。'
          },
          {
            round: 4,
            parentLine: '好，我不去。那你觉得怎么处理比较好？是以后上课注意一点，还是有别的办法？',
            childNext: '我不知道。'
          },
          {
            round: 5,
            parentLine: '那我们一起想——如果你上课前稍微预习一下，老师提问的时候你能答上来，他是不是就没理由点你名了？',
            childNext: '那要多花时间预习。'
          },
          {
            round: 6,
            parentLine: '确实要多花时间。但比起被点名尴尬，你觉得哪个更值得？',
            childNext: '……预习吧。'
          },
          {
            round: 7,
            parentLine: '好。那今晚我们一起看看明天要上的课，我陪你预习。',
            childNext: '你不会又要说我学习不努力吧？'
          },
          {
            round: 8,
            parentLine: '不会。我是来帮你的，不是来批评你的。你愿意尝试，我就很高兴了。',
            childNext: '那如果预习了老师还是点我名呢？'
          },
          {
            round: 9,
            parentLine: '那我们就再想办法。可能不是你的问题，是老师的问题——但不管是谁的问题，我们都一起面对。',
            childNext: '好吧，试试。'
          },
          {
            round: 10,
            parentLine: '好。明天放学回来告诉我结果，不管好不好，我都听着。',
            childNext: ''
          }
        ]
      },
      {
        id: 'too-much-homework',
        title: '孩子说："作业太多了，根本写不完"',
        childOpening: '作业太多了，根本写不完！',
        rounds: [
          {
            round: 1,
            parentLine: '作业确实不少。你是每一科都多，还是某几科特别多？',
            childNext: '数学和英语最多，写到半夜都写不完。'
          },
          {
            round: 2,
            parentLine: '写到半夜都写不完——那确实很累。你是不会做所以写得慢，还是纯粹量大？',
            childNext: '量大，而且数学有几道题不会。'
          },
          {
            round: 3,
            parentLine: '量大我们可以想办法——比如先做会的，不会的留着第二天问老师。你觉得这个办法行吗？',
            childNext: '那老师会说我没做完。'
          },
          {
            round: 4,
            parentLine: '如果你提前跟老师说明情况——"这几道题我不会，明天找您请教"——大多数老师都能理解。你愿意试试吗？',
            childNext: '我不敢跟老师说。'
          },
          {
            round: 5,
            parentLine: '那我帮你写个条子？或者我陪你去跟老师说？',
            childNext: '……你陪我去吧。'
          },
          {
            round: 6,
            parentLine: '好。明天我送你到学校，陪你去找老师。你不是一个人面对。',
            childNext: '那如果老师还是批评我呢？'
          },
          {
            round: 7,
            parentLine: '如果老师批评你，我们一起面对。你只是在求助，这不是错事。',
            childNext: '你说的简单。'
          },
          {
            round: 8,
            parentLine: '我知道做起来不简单。但第一步总是最难的——你愿意迈出第一步，就已经很勇敢了。',
            childNext: '那今晚的作业怎么办？'
          },
          {
            round: 9,
            parentLine: '今晚你先做会的，不会的圈出来。做完能做的就去睡，身体要紧。',
            childNext: '好。'
          },
          {
            round: 10,
            parentLine: '辛苦了。我去给你热杯牛奶。',
            childNext: ''
          }
        ]
      }
    ]
  };

  const quickTips = [
    { type: 'aggressive', label: '攻击性反驳', example: '"你凭什么管我"', principle: '不进入权力斗争，先承认对方的部分合理性', keywords: ['"你说得对"', '"我也有做得不好的地方"'] },
    { type: 'defensive', label: '防御性反驳', example: '"你根本不懂"', principle: '承认认知差异，表达学习意愿', keywords: ['"也许我不完全懂，但我愿意听/学"'] },
    { type: 'self-denial', label: '自我否定型', example: '"我就是笨"', principle: '区分"行为"和"人格"，不让孩子给自己贴标签', keywords: ['"一次考试不能定义你是谁"'] },
    { type: 'comparison', label: '比较型反驳', example: '"别人都……"', principle: '不比较，回归到"我们家/你的具体情况"', keywords: ['"别人是别人，我更关心你的状态"'] },
    { type: 'past-mistakes', label: '翻旧账型', example: '"你当年不也……"', principle: '不进入"谁更差"的争论，把焦点拉回当下', keywords: ['"正因为我自己经历过，才更想帮你"'] },
    { type: 'privacy', label: '隐私边界型', example: '"你偷看我……"', principle: '先道歉，再表达关心，不辩解', keywords: ['"对不起，这是我的不对。我担心你"'] }
  ];

  const keywordCategories = {
    phone: ['手机', '玩游戏', '刷视频', '熬夜', '上网', '打游戏', '沉迷', 'ipad', '平板', '电脑', '电竞', '游戏'],
    academic: ['学习', '考试', '成绩', '作业', '上学', '读书', '复习', '考砸', '不及格', '分数', '排名', '补习班', '补课', '月考', '期中', '期末'],
    rebellion: ['不理我', '不说话', '关门', '顶嘴', '叛逆', '烦', '别管我', '沟通', '撒谎', '骗', '态度差', '不尊重', '摔门', '发脾气'],
    romance: ['恋爱', '喜欢', '早恋', '男朋友', '女朋友', '异性', '约会', '分手', '失恋', '对象'],
    weariness: ['不想学', '厌学', '不想上学', '学习没用', '读书有什么用', '网红', '打工', '辍学', '不想读'],
    social: ['同学', '朋友', '吵架', '欺负', '霸凌', '孤立', '排挤', '老师', '师生', '矛盾', '绝交', '闹翻'],
    identity: ['没意义', '活着没意思', '自卑', '不好看', '胖', '外貌', '身材', '没出息', '没用', '自我怀疑', '抑郁', '焦虑'],
    family: ['吵架', '爸妈吵', '离婚', '搬家', '转学', '弟弟', '妹妹', '二胎', '偏心']
  };

  const customDialogTemplates = [
    [
      {
        step: 1,
        title: '先稳住情绪',
        parentLine: '我看到你最近状态不太好，有点担心你。想聊聊吗？不想说也没关系。',
        childResponse: '...没什么好说的。',
        tips: [
          '先表达关心，不追问',
          '给孩子选择权：说不说都可以',
          '用"我注意到""我担心"代替"你怎么了"'
        ],
        whyItWorks: '当孩子感到被接纳而不是被审问时，他反而更愿意开口。先降低压力，沟通的大门才会打开。',
        emotion: 'warm'
      },
      {
        step: 2,
        title: '倾听了解情况',
        parentLine: '能告诉我发生了什么吗？我先不评判，只是想听听你的感受。',
        childResponse: '（开始说一点）',
        tips: [
          '认真听，不打断、不评价',
          '用"嗯""我明白"回应',
          '不急着给建议'
        ],
        whyItWorks: '很多时候孩子需要的不是解决方案，而是一个倾听者。把情绪说出来，问题就已经解决了一半。',
        emotion: 'warm'
      },
      {
        step: 3,
        title: '一起想办法',
        parentLine: '我理解你的感受了。那你觉得我们可以一起做点什么来改善这种情况？',
        childResponse: '...我不知道。',
        tips: [
          '邀请孩子一起想办法，不是单方面给答案',
          '让孩子先说出他的想法',
          '不否定任何可能性'
        ],
        whyItWorks: '当孩子参与决策过程，他会更愿意执行。一起想出来的办法，比家长单方面的命令有效得多。',
        emotion: 'calm'
      },
      {
        step: 4,
        title: '约定支持',
        parentLine: '那我们先试试看这个办法，有什么问题随时调整。我陪着你，不是一个人面对。',
        childResponse: '...好吧。',
        tips: [
          '给孩子支持和底气',
          '强调"我们一起"，不是"你自己搞定"',
          '允许调整，不要求一次完美'
        ],
        whyItWorks: '让孩子知道"我不是一个人在战斗"，能大大增强他面对困难的勇气和信心。',
        emotion: 'warm'
      }
    ],
    [
      {
        step: 1,
        title: '观察与关心',
        parentLine: '最近我发现你有点不一样，是遇到什么事了吗？想说就说，不想说也没事。',
        childResponse: '没什么...就是有点烦。',
        tips: [
          '用"观察到的变化"开场，不是"你又怎么了"',
          '给孩子空间，不逼问',
          '让他知道"你注意到了"'
        ],
        whyItWorks: '孩子很敏感，你有没有真的关心他，他能感觉到。真诚的观察比刻意的质问更有力量。',
        emotion: 'warm'
      },
      {
        step: 2,
        title: '接纳情绪',
        parentLine: '烦是正常的，谁都有心情不好的时候。能说说是什么让你烦吗？',
        childResponse: '...（慢慢说）',
        tips: [
          '先正常化情绪："烦是正常的"',
          '不否定、不轻视',
          '再温和地邀请多说一点'
        ],
        whyItWorks: '情绪被接纳后，孩子才会愿意继续说。如果一上来就说"这有什么好烦的"，他马上就闭嘴了。',
        emotion: 'warm'
      },
      {
        step: 3,
        title: '肯定与探讨',
        parentLine: '换做是我遇到这种事，我也会觉得难受。你有没有想过怎么应对？',
        childResponse: '想过，但不知道行不行...',
        tips: [
          '先肯定感受："换做是我也会"',
          '再问他的想法',
          '不评价想法好不好'
        ],
        whyItWorks: '共情让孩子感到被理解，然后他才会有力量去思考解决方案。先处理情绪，再处理事情。',
        emotion: 'calm'
      },
      {
        step: 4,
        title: '支持与约定',
        parentLine: '听起来你已经在想办法了，这很棒。需要我怎么帮你？我们一起试试。',
        childResponse: '...你能帮我...吗？',
        tips: [
          '先肯定孩子的努力',
          '问"需要我怎么帮你"，不是"你应该..."',
          '把"我帮你"变成"我们一起"'
        ],
        whyItWorks: '被信任和支持的孩子，更有勇气去面对困难。家长的角色是后盾，不是指挥官。',
        emotion: 'warm'
      }
    ],
    [
      {
        step: 1,
        title: '温和切入',
        parentLine: '今天过得怎么样？有没有什么想聊的？',
        childResponse: '还行吧...',
        tips: [
          '用轻松的方式开场',
          '不直接问问题',
          '像朋友一样聊天'
        ],
        whyItWorks: '太正式的谈话会让孩子紧张。像日常闲聊一样切入，孩子的防御心会低很多。',
        emotion: 'calm'
      },
      {
        step: 2,
        title: '深入了解',
        parentLine: '听你这么说，感觉你最近压力挺大的。是这样吗？',
        childResponse: '...嗯，有点。',
        tips: [
          '帮孩子说出他的感受',
          '用"是这样吗"确认，不是肯定',
          '让孩子觉得"你懂我"'
        ],
        whyItWorks: '当孩子发现"爸妈居然能理解我的感受"，他会很惊讶，也会更愿意继续沟通。被理解本身就是疗愈。',
        emotion: 'warm'
      },
      {
        step: 3,
        title: '共同面对',
        parentLine: '原来是这样，难怪你会有这种感觉。我们一起想想，有没有什么办法能让情况好一点？',
        childResponse: '...你有什么建议吗？',
        tips: [
          '先说"难怪"，认可他的感受',
          '再说"我们一起想"',
          '不给答案，一起探索'
        ],
        whyItWorks: '合作式的沟通，比自上而下的说教有效得多。当孩子觉得"我们是一伙的"，他会更愿意接受建议。',
        emotion: 'warm'
      },
      {
        step: 4,
        title: '鼓励与支持',
        parentLine: '办法总比困难多。不管怎么样，我都在你身边。我们慢慢来。',
        childResponse: '...谢谢你。',
        tips: [
          '给希望，但不画大饼',
          '强调"我在你身边"',
          '给时间，不急于求成'
        ],
        whyItWorks: '孩子最需要的，往往不是具体的解决方案，而是"我不是一个人"的确定感。有了这份安全感，他自己就有力量去面对。',
        emotion: 'warm'
      }
    ]
  ];

  const sceneKeywords = {};
  scenes.forEach(function(scene) {
    var words = [];
    words.push(scene.title);
    words.push(scene.description);
    words.push(scene.situation || '');
    if (scene.rounds) {
      scene.rounds.forEach(function(r) {
        words.push(r.title || '');
        words.push(r.childResponse || '');
      });
    }
    sceneKeywords[scene.id] = words.join(' ');
  });

  function calculateSimilarity(text1, text2) {
    var words1 = text1.toLowerCase().split(/[\s，。！？、；：""''（）【】\[\].,!?;:'"()]+/).filter(function(w) { return w.length > 1; });
    var words2 = text2.toLowerCase().split(/[\s，。！？、；：""''（）【】\[\].,!?;:'"()]+/).filter(function(w) { return w.length > 1; });
    var score = 0;
    words1.forEach(function(w1) {
      words2.forEach(function(w2) {
        if (w1 === w2) {
          score += 2;
        } else if (w1.indexOf(w2) >= 0 || w2.indexOf(w1) >= 0) {
          score += 1;
        }
      });
    });
    return score;
  }

  function findSimilarScenes(inputText, limit) {
    limit = limit || 3;
    var results = [];
    scenes.forEach(function(scene) {
      var score = calculateSimilarity(inputText, sceneKeywords[scene.id] || '');
      if (score > 0) {
        results.push({ scene: scene, score: score });
      }
    });
    results.sort(function(a, b) { return b.score - a.score; });
    return results.slice(0, limit).map(function(r) { return r.scene; });
  }

  function detectCategory(inputText) {
    var maxScore = 0;
    var maxCat = 'rebellion';
    for (var catId in keywordCategories) {
      var keywords = keywordCategories[catId];
      var score = 0;
      keywords.forEach(function(kw) {
        if (inputText.indexOf(kw) >= 0) {
          score += 1;
        }
      });
      if (score > maxScore) {
        maxScore = score;
        maxCat = catId;
      }
    }
    return maxCat;
  }

  function generateCustomScene(inputText) {
    var templateIndex = Math.floor(Math.random() * customDialogTemplates.length);
    var template = customDialogTemplates[templateIndex];
    var categoryId = detectCategory(inputText);
    var catInfo = null;
    for (var i = 0; i < categories.length; i++) {
      if (categories[i].id === categoryId) {
        catInfo = categories[i];
        break;
      }
    }

    var shortTitle = inputText.length > 15 ? inputText.substring(0, 15) + '...' : inputText;

    var customRounds = JSON.parse(JSON.stringify(template));

    if (inputText.indexOf('手机') >= 0 || inputText.indexOf('游戏') >= 0 || inputText.indexOf('玩') >= 0) {
      customRounds[0].parentLine = '我注意到你最近花了不少时间在手机上，是有什么好玩的事吗？还是只是想放松一下？';
      customRounds[1].parentLine = '我不是要指责你。我只是有点担心你的眼睛和睡眠。你觉得现在这样的节奏怎么样？';
      customRounds[2].parentLine = '我理解想放松的心情。那我们能不能商量一个双方都能接受的使用时间？你觉得怎么比较合理？';
      customRounds[3].parentLine = '好，那就按你说的来试试。我们互相监督，有问题随时调整。';
    } else if (inputText.indexOf('学习') >= 0 || inputText.indexOf('考试') >= 0 || inputText.indexOf('成绩') >= 0 || inputText.indexOf('作业') >= 0) {
      customRounds[0].parentLine = '最近学习压力大吗？我看你好像有点累的样子。';
      customRounds[1].parentLine = '学习确实不是件容易的事。哪一科最让你头疼？还是整体都觉得吃力？';
      customRounds[2].parentLine = '原来是这样。你觉得怎么做能帮到你？找老师问、找同学讨论、还是我帮你想想别的办法？';
      customRounds[3].parentLine = '没关系，我们一步一步来。不管怎么样，我都相信你在努力。有需要随时说。';
    } else if (inputText.indexOf('不说话') >= 0 || inputText.indexOf('关门') >= 0 || inputText.indexOf('不理') >= 0 || inputText.indexOf('沟通') >= 0) {
      customRounds[0].parentLine = '我感觉你最近好像有心事，想一个人待着。我尊重你的空间，但如果你想聊了，我随时都在。';
      customRounds[1].parentLine = '（不追问，只是默默关心，比如留个便条、放杯热牛奶）';
      customRounds[2].parentLine = '（等孩子主动开口时，认真听，不评价）谢谢你愿意告诉我这些。';
      customRounds[3].parentLine = '你想说的时候我随时都在。不想说也没关系，我陪着你就好。';
    } else if (inputText.indexOf('吵架') >= 0 || inputText.indexOf('顶嘴') >= 0 || inputText.indexOf('发脾气') >= 0) {
      customRounds[0].parentLine = '刚才我情绪也有点激动，先冷静一下再聊好吗？';
      customRounds[1].parentLine = '（冷静后）刚才我说话有点重了，对不起。你现在愿意聊聊吗？';
      customRounds[2].parentLine = '我理解你为什么生气。站在你的角度，确实会觉得不舒服。';
      customRounds[3].parentLine = '我们以后能不能约定一下——生气的时候先说"暂停"，冷静了再聊？这样就不会说伤人的话了。';
    }

    var similarScenes = findSimilarScenes(inputText, 3);

    return {
      id: 'custom-' + Date.now(),
      isCustom: true,
      title: shortTitle,
      inputText: inputText,
      category: categoryId,
      categoryName: catInfo ? catInfo.name : '亲子沟通',
      icon: '🤔',
      coverGradient: gradients[categoryId] || gradients.rebellion,
      description: inputText,
      difficulty: 2,
      estimatedTime: '15-20分钟',
      warning: '每个孩子情况不同，请根据实际情况灵活调整，以上内容仅供参考',
      situation: inputText,
      rounds: customRounds,
      similarScenes: similarScenes
    };
  }

  // ==================== 孩子回应引擎 ====================
  // 按场景分类预置多种孩子回应类型 + 家长对应回应

  var responseTypes = {
    confrontational: {
      label: '对抗型',
      icon: '😤',
      keywords: ['凭什么', '管不着', '不关你事', '你烦不烦', '别管我', '你管太多', '烦死了', '滚', '啰嗦', '你有病', '讨厌', '不想听', '闭嘴', '你走开']
    },
    dismissive: {
      label: '敷衍型',
      icon: '😑',
      keywords: ['知道了', '好吧', '随便', '嗯', '行吧', '马上', '哦', '好的', '行', '可以', '是啊', '对对对', '你说得对', '随便你']
    },
    cooperative: {
      label: '配合型',
      icon: '🙂',
      keywords: ['好', '我试试', '我知道', '我会注意', '好的', '可以', '行', '嗯好', '我会的', '我懂了', '那好吧', '试试看', '我可以']
    },
    emotional: {
      label: '情绪型',
      icon: '😢',
      keywords: ['我好烦', '我好累', '没意思', '不开心', '难受', '压力大', '不想', '烦', '难过', '委屈', '崩溃', '讨厌自己', '想哭', '睡不着', '害怕']
    },
    comparative: {
      label: '比较型',
      icon: '🤔',
      keywords: ['别人都', '同学都', '凭什么他', '人家', '都这样', '别人能', '为什么别人', '别人家', '其他人', '就我没有']
    },
    selfDeprecating: {
      label: '自我否定型',
      icon: '😞',
      keywords: ['我就是笨', '我不行', '没用', '学不会', '我没救了', '我太差了', '我不够好', '我什么都做不好', '我就是烂', '我没用']
    }
  };

  // 按场景分类的孩子回应模板（每轮3-4个选项）
  var childResponseTemplates = {
    phone: [
      [
        { type: 'confrontational', text: '我就玩一会儿，你管那么多干嘛！' },
        { type: 'dismissive', text: '知道了知道了，马上就睡。' },
        { type: 'comparative', text: '同学都玩到两点，我算早的了！' },
        { type: 'emotional', text: '我睡不着才玩的，你又不让我玩，那我干嘛？' }
      ],
      [
        { type: 'confrontational', text: '手机是我的，你凭什么没收？' },
        { type: 'dismissive', text: '行行行，你说什么都对。' },
        { type: 'cooperative', text: '好吧，那你觉得几点该交手机？' },
        { type: 'emotional', text: '我白天压力那么大，就晚上能放松一下。' }
      ],
      [
        { type: 'confrontational', text: '凭什么你能玩手机，就不让我玩？' },
        { type: 'dismissive', text: '随便吧，反正你说了算。' },
        { type: 'cooperative', text: '要不咱们试一周，看看效果怎么样？' },
        { type: 'comparative', text: '别人家爸妈都不管，就你管得最多。' }
      ],
      [
        { type: 'confrontational', text: '你说话算话？别到时候又反悔！' },
        { type: 'dismissive', text: '知道了，我会做的。' },
        { type: 'cooperative', text: '好，那我们一起执行，谁违规谁请客。' },
        { type: 'emotional', text: '你真的能做到不玩手机吗？我不信。' }
      ]
    ],
    academic: [
      [
        { type: 'confrontational', text: '你根本不知道我有多努力！' },
        { type: 'selfDeprecating', text: '考不好就考不好，反正我就是笨。' },
        { type: 'dismissive', text: '知道了，我会看的。' },
        { type: 'emotional', text: '我复习到很晚还是考不好，我好没用。' }
      ],
      [
        { type: 'confrontational', text: '你当年不也没考多好，凭什么说我？' },
        { type: 'selfDeprecating', text: '反正怎么努力都没用，我就是不行。' },
        { type: 'cooperative', text: '那你能帮我看看错题吗？' },
        { type: 'emotional', text: '我真的很害怕下次还考不好。' }
      ],
      [
        { type: 'confrontational', text: '你只会看分数，从来不看过程！' },
        { type: 'dismissive', text: '好好好，你说的都对。' },
        { type: 'cooperative', text: '我想先自己试试调整学习方法。' },
        { type: 'emotional', text: '数学我真的听不懂，上课像听天书。' }
      ],
      [
        { type: 'confrontational', text: '补习又要花钱，你又拿这个说我！' },
        { type: 'selfDeprecating', text: '我就不是读书的料，别浪费钱了。' },
        { type: 'cooperative', text: '好，那我们一起制定个计划吧。' },
        { type: 'emotional', text: '我怕补习了还是考不好，让你失望。' }
      ]
    ],
    rebellion: [
      [
        { type: 'confrontational', text: '烦不烦！你能不能别管我！' },
        { type: 'dismissive', text: '嗯。' },
        { type: 'emotional', text: '我今天心情不好，不想说话。' },
        { type: 'comparative', text: '别人家爸妈都不这样，就你最烦。' }
      ],
      [
        { type: 'confrontational', text: '你总是站在别人那边！' },
        { type: 'dismissive', text: '行，你说什么就是什么。' },
        { type: 'cooperative', text: '那你能先听我说完吗？' },
        { type: 'emotional', text: '你从来不听我的，我说了有什么用。' }
      ],
      [
        { type: 'confrontational', text: '说了你也不懂！' },
        { type: 'dismissive', text: '随便吧，反正你也不理解我。' },
        { type: 'cooperative', text: '好吧，那我试试跟你说说。' },
        { type: 'emotional', text: '你们大人根本不懂我们这代人的事。' }
      ],
      [
        { type: 'confrontational', text: '你管我管得太多了，我喘不过气！' },
        { type: 'dismissive', text: '知道了，我会注意的。' },
        { type: 'cooperative', text: '那哪些事你能少管一点？我们商量一下。' },
        { type: 'emotional', text: '我觉得你不够信任我，什么都要管。' }
      ]
    ],
    romance: [
      [
        { type: 'confrontational', text: '你偷看我手机？！' },
        { type: 'dismissive', text: '没什么好说的。' },
        { type: 'cooperative', text: '其实……我可以跟你说说。' },
        { type: 'emotional', text: '你能不能不要这样质问我，我很难受。' }
      ],
      [
        { type: 'confrontational', text: '我就是喜欢他/她，你管不着！' },
        { type: 'dismissive', text: '随便你怎么想。' },
        { type: 'cooperative', text: '那你不反对我们做朋友吗？' },
        { type: 'emotional', text: '有时候开心，有时候烦，我也说不清楚。' }
      ],
      [
        { type: 'confrontational', text: '你根本不理解我！' },
        { type: 'dismissive', text: '说了你也不懂，你们那个年代不一样。' },
        { type: 'cooperative', text: '那你能听我说说他/她是什么样的吗？' },
        { type: 'emotional', text: '我怕你们知道了会反对，所以一直没说。' }
      ],
      [
        { type: 'confrontational', text: '你不会偷偷去找他/她吧？' },
        { type: 'dismissive', text: '随便吧，你爱怎么想怎么想。' },
        { type: 'cooperative', text: '好，那我以后有什么事先跟你说。' },
        { type: 'emotional', text: '我其实也有些迷茫，不知道该怎么办。' }
      ]
    ],
    weariness: [
      [
        { type: 'confrontational', text: '上学有什么用？XX网红初中毕业一样赚钱！' },
        { type: 'dismissive', text: '知道了，我会去的。' },
        { type: 'comparative', text: '别人不想上学你都不说，就盯着我。' },
        { type: 'emotional', text: '我真的好累，什么都不想做。' }
      ],
      [
        { type: 'confrontational', text: '老师针对我，我不想去！' },
        { type: 'dismissive', text: '行吧，我去就是了。' },
        { type: 'cooperative', text: '那你能帮我跟老师聊聊吗？' },
        { type: 'emotional', text: '我上课回答不上来，全班都在笑我。' }
      ],
      [
        { type: 'confrontational', text: '作业太多了，根本写不完！' },
        { type: 'dismissive', text: '知道了，我会想办法的。' },
        { type: 'cooperative', text: '那你能帮我跟老师说一声吗？' },
        { type: 'emotional', text: '我写到半夜还是写不完，真的好崩溃。' }
      ],
      [
        { type: 'confrontational', text: '学了又有什么用？以后又用不上！' },
        { type: 'selfDeprecating', text: '反正我也学不好，不如不学了。' },
        { type: 'cooperative', text: '好吧，那我试试换个学习方法。' },
        { type: 'emotional', text: '我觉得自己好像什么都做不好。' }
      ]
    ],
    social: [
      [
        { type: 'confrontational', text: '你根本不知道我在学校被怎样对待！' },
        { type: 'dismissive', text: '没什么，我没事。' },
        { type: 'cooperative', text: '其实……我被同学孤立了。' },
        { type: 'emotional', text: '我好难过，没有人愿意跟我玩。' }
      ],
      [
        { type: 'confrontational', text: '你别去找老师，会更尴尬的！' },
        { type: 'dismissive', text: '随便吧，反正说了也没用。' },
        { type: 'cooperative', text: '那你帮我想想该怎么应对？' },
        { type: 'emotional', text: '我好怕明天去学校又要面对他们。' }
      ],
      [
        { type: 'confrontational', text: '跟好朋友闹翻了，你也不懂我多难受！' },
        { type: 'dismissive', text: '没事，过几天就好了。' },
        { type: 'cooperative', text: '我能跟你说说发生了什么吗？' },
        { type: 'emotional', text: '我以为她是我最好的朋友，没想到她会这样。' }
      ],
      [
        { type: 'confrontational', text: '老师当众批评我，我再也不上他的课了！' },
        { type: 'dismissive', text: '知道了，我会忍着的。' },
        { type: 'cooperative', text: '那你觉得我该怎么跟老师沟通？' },
        { type: 'emotional', text: '全班都在笑我，我以后怎么面对他们。' }
      ]
    ],
    identity: [
      [
        { type: 'confrontational', text: '你根本不理解我！我就是觉得自己不好看！' },
        { type: 'dismissive', text: '没什么好说的，你不会懂的。' },
        { type: 'cooperative', text: '那你能听我说说我为什么这么觉得吗？' },
        { type: 'selfDeprecating', text: '我好胖，我好丑，没人会喜欢我。' }
      ],
      [
        { type: 'confrontational', text: '你总是说我矫情，我真的很痛苦！' },
        { type: 'dismissive', text: '知道了，我没事。' },
        { type: 'cooperative', text: '我最近确实有些难受，能跟你聊聊吗？' },
        { type: 'emotional', text: '我觉得活着没什么意思，好累。' }
      ],
      [
        { type: 'confrontational', text: '别人怎么说不重要，你怎么看我才重要！' },
        { type: 'dismissive', text: '随便吧，反正我就是这样了。' },
        { type: 'cooperative', text: '那你能不能告诉我，你看到的我是怎样的？' },
        { type: 'selfDeprecating', text: '老师都说我没出息，也许他说得对。' }
      ],
      [
        { type: 'confrontational', text: '你们吵架关我什么事，为什么要我承受！' },
        { type: 'dismissive', text: '没事，我习惯了。' },
        { type: 'cooperative', text: '那你们能不能答应我以后不在家吵架？' },
        { type: 'emotional', text: '我好害怕你们离婚，是不是我的错。' }
      ]
    ],
    family: [
      [
        { type: 'confrontational', text: '你们吵架吓到我了，别吵了！' },
        { type: 'dismissive', text: '没事，我习惯了。' },
        { type: 'cooperative', text: '那你们能不能答应我以后不在家吵架？' },
        { type: 'emotional', text: '我好害怕你们离婚，是不是我的错。' }
      ],
      [
        { type: 'confrontational', text: '你们总是吵架，这个家我没法待了！' },
        { type: 'dismissive', text: '随你们吧，反正我管不了。' },
        { type: 'cooperative', text: '那你们有什么矛盾能跟我说说吗？' },
        { type: 'emotional', text: '我觉得是我不够好，你们才会吵架。' }
      ],
      [
        { type: 'confrontational', text: '你们能不能别在我面前吵架！' },
        { type: 'dismissive', text: '知道了，我会当没听到的。' },
        { type: 'cooperative', text: '那你们以后有矛盾能不能关起门来说？' },
        { type: 'emotional', text: '我每次听到你们吵架都好害怕，睡不着觉。' }
      ],
      [
        { type: 'confrontational', text: '你们吵架后让我怎么安心学习？' },
        { type: 'dismissive', text: '没事的，我会调整的。' },
        { type: 'cooperative', text: '那我们能不能一起定个规矩，有话好好说？' },
        { type: 'emotional', text: '我好希望我们家能像以前一样开心。' }
      ]
    ]
  };

  // 家长针对不同回应类型的通用话术模板
  var followUpTemplates = {
    confrontational: {
      phone: '你说得对，我可能管得太多了。但我不是要控制你，是担心你身体。咱们能不能一起想个办法？',
      academic: '我知道你可能觉得我只看分数。其实我看到的是你在努力，只是结果不理想。咱们一起看看问题在哪。',
      rebellion: '好，我先不管。但你如果想聊，我随时都在。饭在桌上，饿了就出来吃。',
      romance: '你说得对，喜欢谁是你的自由。我关心的是这段关系对你的影响，不是要管你喜欢谁。',
      weariness: '你说得有道理，学习和赚钱确实不是一回事。但你想想，如果有一天网红不红了，他需要什么能力？',
      social: '你说得对，我可能不完全了解你在学校的情况。但我会站在你这边，我们一起面对。',
      identity: '我听到你这样说自己，心里很难受。在我眼里你很好看，但更重要的是你怎么看自己。',
      family: '你说得对，我们吵架吓到你了。这不是你的错，是我们大人没控制好情绪。对不起。'
    },
    dismissive: {
      phone: '好吧，那今天先这样。但我想让你知道，我随时都愿意跟你聊，不是要管你，是想了解你。',
      academic: '没关系，今天先休息。等你准备好了，我们一起看看怎么调整。你不用一个人扛。',
      rebellion: '好，我不多说了。你知道我一直在就好。想聊的时候随时找我。',
      romance: '好，今天先不聊。但我想让你知道——不管发生什么，你都可以跟我说，我不会评价。',
      weariness: '好，今天先到这。但如果你哪天想聊聊为什么不想上学，我随时在。',
      social: '好，我不追问。但如果你需要我帮忙，随时开口。',
      identity: '好，我不逼你。但我想让你知道，不管你怎么看自己，你对我来说都很重要。',
      family: '好，今天先不说了。但你要记住，不管我们之间有什么矛盾，我们都爱你。'
    },
    cooperative: {
      phone: '太好了，那咱们一起来定个规则。你觉得几点交手机比较合理？你来说，我配合。',
      academic: '谢谢你愿意让我帮忙。那我们先看看错题？不急，一步一步来。你不用一个人扛，我陪着你。',
      rebellion: '谢谢你愿意告诉我。你慢慢说，我听着，不打断。不管是什么原因，我们一起想办法。',
      romance: '谢谢你愿意跟我说。那你能告诉我，你觉得这段关系让你在哪些方面变好了吗？',
      weariness: '好，那我们一起想办法。你觉得是哪科最吃力？我们先从那里开始调整。',
      social: '谢谢你愿意告诉我。这不是你的错。你觉得需要我出面找老师，还是你先按我们商量的办法应对？',
      identity: '谢谢你愿意跟我说这些。你说的每一句话我都会认真听。在我眼里，你有很多优点。',
      family: '谢谢你愿意跟我聊。以后我们尽量不在你面前这样，如果你心里还有不舒服，随时可以跟我说。'
    },
    emotional: {
      phone: '我理解你压力大，睡前想放松也很正常。我担心的不是玩手机本身，是怕你睡太晚影响白天状态。咱们一起找个更好的放松方式？',
      academic: '每天复习到很晚确实辛苦，考成这样你一定特别沮丧。换做是我也会很难过。不管你考多少分，你都是我的孩子。',
      rebellion: '跟同学吵架确实很难受。你想说说发生了什么吗？不想说也没关系，我陪着你。',
      romance: '感情就是这样，有甜有苦。我只想提醒你——不管发生什么，保护好自己，学业也不要完全丢下。',
      weariness: '你真的好累了，我能感觉到。我们先不谈学习的事，你先休息一下。等你有力气了，我们再慢慢聊。',
      social: '分组没人选你，一个人站在那里——那确实很难堪。换做是我也会很难受。说出来有没有好一点？',
      identity: '你这句话让我很担心。你能告诉我你最近在想什么吗？不管发生什么，我们一起面对。',
      family: '我好害怕你们吵架——我听到你这么说我好心疼。这不是你的错，是大人的问题。我们会好好解决的。'
    },
    comparative: {
      phone: '每个家庭规矩不一样，我更关心的是你的身体状态。我不跟别人比，我只在乎你。',
      academic: '你拿自己跟别人比，说明你也在乎。但每个人都有自己的节奏，我们不跟别人比，只跟昨天的自己比。',
      rebellion: '别人家爸妈怎么做是别人的事。我可能确实有些地方做得不好，我们可以一起调整。',
      romance: '别人怎么交往是别人的事，我关心的是你在关系里好不好。你觉得这段关系让你开心吗？',
      weariness: '你说的那个网红确实厉害，但他肯定也有过人之处。学习和赚钱不是一回事，但学习能给你更多选择。',
      social: '别人不理解你是别人的问题。但在我们这里，你永远有倾诉的地方。你不是一个人。',
      identity: '别人怎么说不重要，重要的是你怎么看自己。一次考试、一个老师的看法，不能定义你是谁。',
      family: '每个家庭都有矛盾，但我们家会一起面对。不管怎样，我们都爱你，这个不会变。'
    },
    selfDeprecating: {
      phone: '我不是在说你不好，我是在担心你。你有很多优点，只是现在需要调整一下作息。我们一起来，好吗？',
      academic: '我听到你这样说自己，心里很难受。一次考试不能定义你聪明还是笨——它只说明这次有些知识点没掌握好。',
      rebellion: '你不是没用的，你只是现在很难受。每个人都有低谷的时候，这很正常。我一直在。',
      romance: '你不是没用的，每个人都有迷茫的时候。重要的是你在经历这些时，有人陪着你。我就在。',
      weariness: '你不是不行，你只是还没找到适合自己的方法。我们不要求你考多高，先定个小目标——比上次多考5分。',
      social: '这不是你的错，你跟我说出来就做得很好。你不需要所有人都喜欢你，你只需要做你自己。',
      identity: '你对我非常重要。不管你怎么看自己，你在我眼里都是独一无二的。我看到的你是有很多优点的。',
      family: '这不是你的错，是大人的问题。你不需要承担我们的情绪，你只需要做好你自己。'
    }
  };

  // 通用模板（未匹配到具体分类时使用）
  var genericTemplates = [
    [
      { type: 'confrontational', text: '你根本不理解我！' },
      { type: 'dismissive', text: '知道了，不用你管。' },
      { type: 'cooperative', text: '好吧，那你说说看。' },
      { type: 'emotional', text: '我好烦，什么都不想说。' }
    ],
    [
      { type: 'confrontational', text: '你总是这样，从来不听我说！' },
      { type: 'dismissive', text: '随便吧，反正你说了算。' },
      { type: 'cooperative', text: '那你能先听我说完吗？' },
      { type: 'emotional', text: '我觉得好累，压力好大。' }
    ],
    [
      { type: 'confrontational', text: '你能不能别管我了！' },
      { type: 'dismissive', text: '嗯，知道了。' },
      { type: 'cooperative', text: '好，那我试试你的建议。' },
      { type: 'emotional', text: '我不是不想跟你说，我是不知道怎么开口。' }
    ],
    [
      { type: 'confrontational', text: '你说的我都知道了，别说了！' },
      { type: 'dismissive', text: '行吧，就这样吧。' },
      { type: 'cooperative', text: '好，那我们一起想办法。' },
      { type: 'emotional', text: '谢谢你愿意听我说，我感觉好多了。' }
    ]
  ];

  // 获取孩子回应选项
  function getChildResponseOptions(scene, roundNum) {
    var category = scene.category || 'generic';
    var templates = childResponseTemplates[category] || genericTemplates;
    var roundIndex = Math.min(roundNum - 1, templates.length - 1);
    if (roundIndex < 0) roundIndex = 0;
    var options = templates[roundIndex] || templates[0];

    // 为每个选项生成家长回应
    var result = [];
    for (var i = 0; i < options.length; i++) {
      var opt = options[i];
      var followUp = getFollowUp(opt.type, category);
      result.push({
        type: opt.type,
        icon: responseTypes[opt.type].icon,
        label: responseTypes[opt.type].label,
        text: opt.text,
        parentFollowUp: followUp
      });
    }
    return result;
  }

  // 获取家长回应
  function getFollowUp(type, category) {
    var templates = followUpTemplates[type];
    if (!templates) return '我理解你的感受。不管发生什么，我们一起面对。';
    return templates[category] || templates['generic'] || '我理解你的感受。我们一起想办法，好吗？';
  }

  // 分析自定义输入，返回语义匹配结果
  function analyzeChildResponse(input, scene, roundNum) {
    if (!input || !input.trim()) return null;

    var text = input.trim().toLowerCase();
    var category = scene.category || 'generic';
    var bestMatch = null;
    var bestScore = 0;

    // 遍历所有回应类型，计算关键词匹配得分
    for (var typeKey in responseTypes) {
      var type = responseTypes[typeKey];
      var score = 0;
      for (var i = 0; i < type.keywords.length; i++) {
        var keyword = type.keywords[i].toLowerCase();
        if (text.indexOf(keyword) > -1) {
          score += keyword.length;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestMatch = typeKey;
      }
    }

    // 如果匹配到类型，返回对应回应
    if (bestMatch && bestScore > 0) {
      return {
        type: bestMatch,
        icon: responseTypes[bestMatch].icon,
        label: responseTypes[bestMatch].label,
        text: input.trim(),
        parentFollowUp: getFollowUp(bestMatch, category),
        isCustom: true
      };
    }

    // 未匹配到任何类型，返回通用情感回应
    return {
      type: 'unknown',
      icon: '💬',
      label: '自定义',
      text: input.trim(),
      parentFollowUp: '我听到了你说的。不管你现在的感受是什么，都是真实的、合理的。你能告诉我更多吗？我们一起想办法。',
      isCustom: true
    };
  }

  window.MockData = {
    categories: categories,
    scenes: scenes,
    deepDialogs: deepDialogs,
    quickTips: quickTips,
    generateCustomScene: generateCustomScene,
    findSimilarScenes: findSimilarScenes,
    getChildResponseOptions: getChildResponseOptions,
    analyzeChildResponse: analyzeChildResponse
  };
})(window);
