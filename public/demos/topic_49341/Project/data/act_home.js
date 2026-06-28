window.actHome = {
  id: 'home',
  title: '第一幕 · 家',
  subtitle: '困住的笔尖',
  moodColor: '#9CA3AF',
  poem: [
    '台灯把影子钉在桌上',
    '作业本的空白，比深夜更沉',
    '那道数学题蜷缩着',
    '像一堵没有门的墙',
    '',
    '妈妈的声音隔着门板撞进来',
    '"又玩手机，一点不肯用功"',
    '手机倒扣桌角，早已凉透',
    '我张了张嘴',
    '喉咙卡住一句"我不会"，不敢说出口',
    '',
    '我不是不愿往前追赶',
    '只是前路蒙着厚重白雾',
    '只盼有人停下脚步',
    '轻轻指给我，第一步该怎么走'
  ],
  poemBg: [
    'anime style desk lamp closeup, warm golden light, pencil shadow on paper, late night study, cozy melancholic atmosphere, detailed anime still life, soft focus',
    'anime style bedroom door, shadow of mother under door crack, tense atmosphere, dim warm light, detailed anime interior scene, dramatic lighting',
    'anime style foggy crossroads, single figure silhouette, distant faint light, mysterious hopeful atmosphere, detailed anime background, soft dreamy style'
  ],
  scenes: [
    {
      id: 'narrative1',
      type: 'video',
      shots: [
        {
          image: 'anime style bedroom at night, wide shot, desk lamp warm glow, window with starry sky, cozy melancholic atmosphere, detailed anime background art, soft lighting',
          text: '晚上九点',
          duration: 2500
        },
        {
          image: 'anime style desk closeup, math workbook open, pencil hovering, desk lamp warm light, late night study, detailed anime still life',
          text: '数学作业本摊开在眼前',
          duration: 2800
        },
        {
          image: 'anime style closeup of eyes staring at paper, tired expression, reflection of math equations, warm lamp light, detailed anime character art',
          text: '最后一道大题',
          duration: 2500
        },
        {
          image: 'anime style pencil tip on blank paper, shadow stretching, eraser crumbs nearby, warm desk lamp, detailed anime closeup',
          text: '已经盯了半个小时',
          duration: 2800
        }
      ],
      nextScene: 'narrative2'
    },
    {
      id: 'narrative2',
      type: 'video',
      shots: [
        {
          image: 'anime style bedroom window, night sky with stars, curtain slightly moving, warm indoor light, detailed anime background',
          text: '窗外的夜色越来越深',
          duration: 2500
        },
        {
          image: 'anime style bedroom wall, shadow of TV flickering, distant muffled sound, warm dim light, detailed anime interior',
          text: '隔壁传来电视模糊的声音',
          duration: 2800
        },
        {
          image: 'anime style phone face down on desk corner, dark screen, lamp glow, shadow patterns, late night study scene, detailed anime interior',
          text: '手机倒扣在桌角',
          duration: 2500
        },
        {
          image: 'anime style hand reaching toward phone then pulling back, indecisive, desk lamp warm light, detailed anime closeup',
          text: '只是查了公式，就再没碰过',
          duration: 3000
        }
      ],
      nextScene: 'choice1'
    },
    {
      id: 'choice1',
      type: 'choice',
      question: '门突然被敲响，妈妈的声音从门外传来："还在玩手机？都几点了还不睡！"你会——',
      bgImage: 'anime style bedroom door view, door slightly ajar, warm hallway light seeping in, shadow of mother figure outside, tense atmosphere, detailed anime scene, dramatic lighting',
      options: [
        {
          text: '打开门，试着解释自己在做题',
          isPositive: true,
          isBrave: true,
          nextScene: 'consequence1_positive'
        },
        {
          text: '不出声，装作已经睡了',
          isPositive: false,
          nextScene: 'consequence1_negative'
        }
      ]
    },
    {
      id: 'consequence1_positive',
      type: 'video',
      shots: [
        {
          image: 'anime style hand reaching for door handle, trembling slightly, warm hallway light under door, detailed anime closeup',
          text: '你深吸一口气',
          duration: 2500
        },
        {
          image: 'anime style bedroom door opening, mother standing in hallway, warm light behind her, surprised expression, detailed anime character art',
          text: '打开了房门',
          duration: 2500
        },
        {
          image: 'anime style teenage girl looking down, tears forming in eyes, vulnerable expression, warm lamp light, detailed anime character art',
          text: '"妈，我没有玩手机……"',
          duration: 3000
        },
        {
          image: 'anime style mother and daughter talking by bedside, soft warm lighting, gentle expression, emotional moment, detailed anime character art, intimate scene',
          text: '话刚出口，眼泪就忍不住掉了下来',
          duration: 3000
        }
      ],
      nextScene: 'narrative_after1_positive'
    },
    {
      id: 'narrative_after1_positive',
      type: 'video',
      shots: [
        {
          image: 'anime style mother sitting on bed, hand on daughter shoulder, soft expression, warm bedroom light, detailed anime character art',
          text: '妈妈愣了一下',
          duration: 2500
        },
        {
          image: 'anime style closeup of mother hand patting daughters back, gentle motion, warm light, detailed anime closeup',
          text: '语气软了下来',
          duration: 2500
        },
        {
          image: 'anime style two silhouettes by window, night scene, warm indoor light, peaceful atmosphere, detailed anime background',
          text: '虽然她也不懂数学',
          duration: 2800
        },
        {
          image: 'anime style girl smiling through tears, relieved expression, warm lamp glow, detailed anime character art',
          text: '但心里的石头，轻了一点',
          duration: 3000
        }
      ],
      nextScene: 'choice2'
    },
    {
      id: 'consequence1_negative',
      type: 'video',
      shots: [
        {
          image: 'anime style hand quickly turning off lamp switch, shadow moving fast, dim bedroom, detailed anime closeup',
          text: '你迅速关掉台灯',
          duration: 2200
        },
        {
          image: 'anime style person hiding under blanket, only eyes visible, dark bedroom, moonlight through curtains, detailed anime scene',
          text: '蜷进被子里',
          duration: 2500
        },
        {
          image: 'anime style shadow of feet under door crack, standing still, tense atmosphere, dim warm light, detailed anime interior',
          text: '门外的脚步声停了几秒',
          duration: 2800
        },
        {
          image: 'anime style dark bedroom, person staring at ceiling, shadow of door frame, lonely atmosphere, night scene, detailed anime illustration, melancholic mood',
          text: '那道不会做的题像一块石头',
          duration: 3200
        }
      ],
      nextScene: 'narrative_after1_negative'
    },
    {
      id: 'narrative_after1_negative',
      type: 'video',
      shots: [
        {
          image: 'anime style alarm clock closeup, ticking hands, red digits glowing, dark bedroom, detailed anime closeup',
          text: '闹钟滴答滴答地走',
          duration: 2500
        },
        {
          image: 'anime style person turning in bed, face buried in pillow, messy hair, dim moonlight, detailed anime scene',
          text: '你翻了个身',
          duration: 2500
        },
        {
          image: 'anime style tear drop on pillowcase, dark room, faint moonlight, emotional detail, detailed anime closeup',
          text: '把脸埋进枕头里',
          duration: 2800
        },
        {
          image: 'anime style girl silhouette by window, lonely pose, night scene, starlight, melancholic atmosphere, detailed anime illustration',
          text: '为什么连说一句"我不会"都这么难',
          duration: 3200
        }
      ],
      nextScene: 'choice2'
    },
    {
      id: 'choice2',
      type: 'choice',
      question: '这一夜过得很慢。临睡前，你在心里对自己说——',
      bgImage: 'anime style bedroom at night, girl lying in bed staring at ceiling, moonlight through curtains, peaceful yet troubled atmosphere, detailed anime background, soft blue lighting',
      options: [
        {
          text: '明天去问老师或者同学吧',
          isPositive: true,
          isThinker: true,
          nextScene: 'consequence2_positive'
        },
        {
          text: '算了，反正我也学不会',
          isPositive: false,
          nextScene: 'consequence2_negative'
        }
      ]
    },
    {
      id: 'consequence2_positive',
      type: 'video',
      shots: [
        {
          image: 'anime style hand writing on paper, pencil moving, math problem being copied, warm desk lamp, detailed anime closeup',
          text: '你拿出草稿纸',
          duration: 2500
        },
        {
          image: 'anime style notebook page with handwritten math problems, neat handwriting, desk lamp light, detailed anime closeup',
          text: '把不会的题认真抄下来',
          duration: 2800
        },
        {
          image: 'anime style night window view, soft wind blowing curtains, summer night, gentle moonlight, hopeful atmosphere, detailed anime scene, serene mood',
          text: '虽然还是有点忐忑',
          duration: 2800
        },
        {
          image: 'anime style girl closing eyes with small smile, peaceful expression, moonlight on face, detailed anime character art',
          text: '但心里有了方向',
          duration: 3000
        }
      ],
      nextScene: 'narrative_end_positive'
    },
    {
      id: 'narrative_end_positive',
      type: 'video',
      shots: [
        {
          image: 'anime style curtain gently blowing in wind, summer night, firefly outside window, detailed anime scene',
          text: '夜风从窗帘缝隙钻进来',
          duration: 2500
        },
        {
          image: 'anime style closeup of desk with open book, warm lamp turned off, moonlight, peaceful atmosphere, detailed anime still life',
          text: '带着一点点夏天的味道',
          duration: 2800
        },
        {
          image: 'anime style girl sleeping peacefully, small smile, moonbeam on face, detailed anime character art',
          text: '你闭上眼',
          duration: 2500
        },
        {
          image: 'anime style sunrise through window, soft golden light, bedroom awakening, hopeful atmosphere, detailed anime background',
          text: '明天好像没有那么可怕了',
          duration: 3200
        }
      ],
      nextScene: 'reflection'
    },
    {
      id: 'consequence2_negative',
      type: 'video',
      shots: [
        {
          image: 'anime style hand shoving workbook into school bag, messy desk, dark bedroom, detailed anime closeup',
          text: '你把作业本塞进书包',
          duration: 2500
        },
        {
          image: 'anime style school bag on floor, half-open, workbook peeking out, dim room, detailed anime scene',
          text: '眼不见心不烦',
          duration: 2500
        },
        {
          image: 'anime style person lying in bed, eyes closed, troubled expression, moonlight, detailed anime character art',
          text: '可是闭上眼睛',
          duration: 2800
        },
        {
          image: 'anime style nightmare scene, floating math equations, worried expression, dark bedroom, anxiety dream, detailed anime illustration, tense atmosphere',
          text: '那张空白的纸一直在脑海里飘着',
          duration: 3200
        }
      ],
      nextScene: 'narrative_end_negative'
    },
    {
      id: 'narrative_end_negative',
      type: 'video',
      shots: [
        {
          image: 'anime style clock showing late hour, red digits, dark room, detailed anime closeup',
          text: '夜很深了',
          duration: 2200
        },
        {
          image: 'anime style girl tossing and turning in bed, messy sheets, dim moonlight, detailed anime scene',
          text: '你迷迷糊糊地睡过去',
          duration: 2800
        },
        {
          image: 'anime style dream sequence, floating numbers and equations, dark background, anxious feeling, detailed anime illustration',
          text: '梦里全是解不开的题',
          duration: 3000
        },
        {
          image: 'anime style shadow of disappointed mother, dark hallway, blurred figure, melancholic mood, detailed anime scene',
          text: '还有妈妈失望的眼神',
          duration: 3200
        }
      ],
      nextScene: 'reflection'
    },
    {
      id: 'reflection',
      type: 'reflection',
      text: '其实，说一句"我不会"，真的有那么难吗？\n\n每个人都有不会做的题，每个人都有力不从心的时候。承认自己需要帮助，不是软弱，而是勇敢。\n\n那些看似无法跨越的高墙，也许只要开口问一句，就会有人为你指一扇门。',
      bgImage: 'anime style foggy crossroads, single figure silhouette, distant faint light, mysterious hopeful atmosphere, detailed anime background, soft dreamy style',
      nextAct: 'school'
    }
  ]
};
