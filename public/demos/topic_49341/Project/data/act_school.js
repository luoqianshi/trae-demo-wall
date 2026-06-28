window.actSchool = {
  id: 'school',
  title: '第二幕 · 校',
  subtitle: '透明的我',
  moodColor: '#60A5FA',
  poem: [
    '粉笔灰覆满黑板公式',
    '落一层化不开的薄雾',
    '同桌笔尖沙沙不停',
    '那条清晰的路，我走不进去',
    '',
    '老师目光扫过整间教室',
    '径直绕开我，像避开一张空课桌',
    '指尖死死掐进掌心',
    '想抬手提问，又满心惶恐',
    '害怕起身之后，连呼吸都显得笨拙',
    '',
    '窗外蝉鸣喧嚣吵闹',
    '我被困在一层透明玻璃里',
    '呐喊无人听见，融合无从谈起',
    '只把那句"我听不懂"',
    '悄悄写在草稿纸褶皱背面'
  ],
  poemBg: [
    'anime style chalkboard with math equations, chalk dust in sunlight beams, classroom morning, nostalgic atmosphere, detailed anime school background, warm lighting',
    'anime style teacher podium, empty classroom, sunlight through windows, quiet contemplation, detailed anime school scene, soft golden hour',
    'anime style school hallway after class, two friends walking away, sunset light streaming in, warm friendship atmosphere, detailed anime background, golden lighting'
  ],
  scenes: [
    {
      id: 'narrative1',
      type: 'video',
      shots: [
        {
          image: 'anime style school building exterior, morning sunlight, cherry blossoms falling, peaceful atmosphere, detailed anime background',
          text: '第二天上午',
          duration: 2500
        },
        {
          image: 'anime style classroom morning, sunlight streaming through windows, chalk dust particles in light, math equations on blackboard, warm golden hour, detailed anime school background',
          text: '数学课，阳光透过窗户照进来',
          duration: 2800
        },
        {
          image: 'anime style chalkboard closeup, math equations written in chalk, chalk dust floating in sunbeam, detailed anime school scene',
          text: '老师写下一道又一道公式',
          duration: 2800
        },
        {
          image: 'anime style student perspective, looking at textbook, eyes unfocused, blurred writing, classroom background, detailed anime POV shot',
          text: '你的笔尖停在课本上',
          duration: 2500
        },
        {
          image: 'anime style closeup of confused expression, furrowed brows, sunlight on face, detailed anime character art',
          text: '一个字都没听懂',
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
          image: 'anime style classmate notebook, neat handwriting, filled pages, detailed anime closeup',
          text: '同桌的笔记本写得工工整整',
          duration: 2500
        },
        {
          image: 'anime style students nodding in class, engaged expressions, sunlight, detailed anime classroom scene',
          text: '旁边的同学频频点头',
          duration: 2500
        },
        {
          image: 'anime style view from back row, empty notebook in foreground, other students blurred, feeling invisible, detailed anime school scene',
          text: '你低头看着自己几乎空白的课本',
          duration: 3000
        },
        {
          image: 'anime style lonely student at desk, surrounded by blurry classmates, feeling invisible, soft sunlight, detailed anime illustration',
          text: '像一个透明人',
          duration: 2800
        },
        {
          image: 'anime style empty classroom feeling, single desk isolated, warm light, lonely atmosphere, detailed anime school background',
          text: '坐在热闹的教室里，却又好像不在这里',
          duration: 3200
        }
      ],
      nextScene: 'choice1'
    },
    {
      id: 'choice1',
      type: 'choice',
      question: '老师转过身，问："这道题还有谁不懂吗？"你抬起了手，又缩了回来。你会——',
      bgImage: 'anime style teacher at front of class, hand raised question, classroom scene, dramatic lighting, detailed anime school illustration, tense moment',
      options: [
        {
          text: '鼓起勇气举手提问',
          isPositive: true,
          isBrave: true,
          nextScene: 'consequence1_positive'
        },
        {
          text: '低下头，假装自己懂了',
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
          image: 'anime style hand slowly raising, trembling slightly, classroom background, detailed anime closeup',
          text: '你深吸一口气',
          duration: 2500
        },
        {
          image: 'anime style student raising hand in class, nervous expression, teacher looking gently, warm sunlight, hopeful moment, detailed anime character art',
          text: '终于把手举了起来',
          duration: 2500
        },
        {
          image: 'anime style closeup of face, blushing, eyes looking down, embarrassed but determined, detailed anime character art',
          text: '脸在发烫',
          duration: 2500
        },
        {
          image: 'anime teacher at blackboard, explaining patiently, chalk in hand, warm expression, detailed anime character art',
          text: '老师点点头，重新讲了一遍',
          duration: 2800
        }
      ],
      nextScene: 'narrative_after1_positive'
    },
    {
      id: 'narrative_after1_positive',
      type: 'video',
      shots: [
        {
          image: 'anime style student sitting down, hand still shaking, small relieved smile, detailed anime character art',
          text: '坐下的时候，手还在微微发抖',
          duration: 2800
        },
        {
          image: 'anime style closeup of notebook, pencil writing down notes, sunlight on paper, detailed anime closeup',
          text: '虽然还是不太懂',
          duration: 2500
        },
        {
          image: 'anime style window view, sunlight, floating dust particles, hopeful atmosphere, detailed anime background',
          text: '但至少，你开口了',
          duration: 2800
        },
        {
          image: 'anime style girl with small determined smile, sunlight on face, classroom background, detailed anime character art',
          text: '原来开口提问，也没有想象中那么可怕',
          duration: 3200
        }
      ],
      nextScene: 'choice2'
    },
    {
      id: 'consequence1_negative',
      type: 'video',
      shots: [
        {
          image: 'anime style head bowing down, hair covering face, classroom background, detailed anime character art',
          text: '你把脸埋得更低了',
          duration: 2500
        },
        {
          image: 'anime style closeup of hands clutching desk, knuckles white, detailed anime closeup',
          text: '心里默念着"别叫我"',
          duration: 2500
        },
        {
          image: 'anime style teacher gaze moving past, blurred student in foreground, feeling invisible, detailed anime classroom scene',
          text: '老师的目光扫过你，移向了别处',
          duration: 2800
        },
        {
          image: 'anime style student looking down, empty expression, classroom background, melancholic mood, detailed anime character art',
          text: '你松了一口气，又觉得心里空落落的',
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
          image: 'anime style blurred chalkboard, out of focus equations, tired eyes perspective, detailed anime POV shot',
          text: '课继续上着',
          duration: 2200
        },
        {
          image: 'anime style closeup of eyes, unfocused gaze, classroom blurred in background, detailed anime closeup',
          text: '黑板上的公式越来越模糊',
          duration: 2800
        },
        {
          image: 'anime style scratch paper with handwritten words "I dont understand", then crossed out, detailed anime closeup',
          text: '你在草稿纸上写下"我听不懂"',
          duration: 2800
        },
        {
          image: 'anime style hand crossing out words aggressively, pencil breaking point, detailed anime closeup',
          text: '又很快划掉了',
          duration: 2800
        }
      ],
      nextScene: 'choice2'
    },
    {
      id: 'choice2',
      type: 'choice',
      question: '下课铃响了，同学们三三两两聚在一起聊天。你一个人坐在座位上，你会——',
      bgImage: 'anime style classroom during break, students chatting in groups, lonely student at desk, contrast of noise and silence, detailed anime school scene, warm afternoon light',
      options: [
        {
          text: '拿出不会的题，去问同桌',
          isPositive: true,
          isThinker: true,
          nextScene: 'consequence2_positive'
        },
        {
          text: '趴在桌上，假装睡觉',
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
          image: 'anime style hands clutching workbook, nervous fingers, classroom background, detailed anime closeup',
          text: '你犹豫了很久',
          duration: 2500
        },
        {
          image: 'anime style student turning to classmate, nervous expression, holding workbook, detailed anime character art',
          text: '终于拿着练习册转向同桌',
          duration: 2500
        },
        {
          image: 'anime style speech bubble with question mark, classroom setting, detailed anime scene',
          text: '"这道题你能给我讲讲吗？"',
          duration: 2800
        },
        {
          image: 'anime two students studying together, sharing textbook, warm sunlight through window, friendship moment, detailed anime character art, gentle mood',
          text: '同桌笑着说："好啊，这题我昨天也想了好久"',
          duration: 3200
        }
      ],
      nextScene: 'narrative_after2_positive'
    },
    {
      id: 'narrative_after2_positive',
      type: 'video',
      shots: [
        {
          image: 'anime style closeup of two heads bent over textbook, pointing at problem, warm sunlight, detailed anime scene',
          text: '同桌讲得很认真',
          duration: 2500
        },
        {
          image: 'anime style notebook page with solved problem, helpful notes, sunlight, detailed anime closeup',
          text: '你发现原来这道题也没有那么难',
          duration: 2800
        },
        {
          image: 'anime style sunlight through window, dust particles floating, warm glow, peaceful classroom, detailed anime background',
          text: '阳光从窗户照进来',
          duration: 2500
        },
        {
          image: 'anime style girl smiling shyly, hopeful expression, classroom sunset light, detailed anime character art',
          text: '明天，也许可以再主动一点',
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
          image: 'anime style arms on desk, head buried, classroom background, detailed anime character art',
          text: '你把脸埋进臂弯里',
          duration: 2500
        },
        {
          image: 'anime style blurred classroom background, students chatting, out of focus, feeling isolated, detailed anime scene',
          text: '周围的笑声好像隔着一层玻璃',
          duration: 2800
        },
        {
          image: 'anime style closeup of eyes peeking through arms, watching classmates, lonely expression, detailed anime closeup',
          text: '你告诉自己，一个人也挺好的',
          duration: 2800
        },
        {
          image: 'anime style single tear drop falling on desk, warm afternoon light, emotional moment, detailed anime closeup',
          text: '可是为什么，心里有点酸呢',
          duration: 3200
        }
      ],
      nextScene: 'narrative_after2_negative'
    },
    {
      id: 'narrative_after2_negative',
      type: 'video',
      shots: [
        {
          image: 'anime style clock on wall, slow ticking, classroom setting, detailed anime closeup',
          text: '课间十分钟像一个世纪那么长',
          duration: 2800
        },
        {
          image: 'anime style closeup of closed eyes, counting silently, detailed anime closeup',
          text: '你数着自己的呼吸',
          duration: 2500
        },
        {
          image: 'anime style empty classroom hallway, quiet, sunset light, detailed anime background',
          text: '等着上课铃响',
          duration: 2500
        },
        {
          image: 'anime style lonely silhouette by window, classroom, sunset, melancholic mood, detailed anime illustration',
          text: '也许，永远都不会有人发现你在难过吧',
          duration: 3200
        }
      ],
      nextScene: 'reflection'
    },
    {
      id: 'reflection',
      type: 'reflection',
      text: '你知道吗？教室里没有透明人。\n\n每一个坐在那里的人，都有困惑的时候，都有听不懂的题，都有想要逃开的瞬间。你不是唯一一个在黑暗里摸索的人。\n\n试着伸出手，也许就会有另一双手，握住你的。',
      bgImage: 'anime style school hallway after class, two friends walking away, sunset light streaming in, warm friendship atmosphere, detailed anime background, golden lighting',
      nextAct: 'people'
    }
  ]
};
