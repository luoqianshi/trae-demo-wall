window.actPeople = {
  id: 'people',
  title: '第三幕 · 人',
  subtitle: '记得的温度',
  moodColor: '#FB923C',
  poem: [
    '操场的台阶，吞了半程夕阳',
    '我把自己缩成一团',
    '像没发芽的种子',
    '忘了自己也有过春天',
    '',
    '手机震了震，是哥哥',
    '"今天怎么样？"',
    '打了满屏的委屈，又删掉',
    '只发了个皱眉头的表情包',
    '',
    '他回："我记得你初二',
    '数学考92分的那天',
    '你攥着卷子，笑到眯眼"',
    '',
    '原来有人记得',
    '那个发光的我',
    '没被此刻的笨，盖住'
  ],
  poemBg: [
    'anime style sports bleachers at golden hour, empty seats, sunset sky, peaceful solitude, detailed anime background, warm orange light',
    'anime style phone screen closeup, message from older brother, sunset background, warm glow, emotional moment, detailed anime illustration, golden hour',
    'anime style bedroom at night, phone glowing softly, starry sky through window, distant connection, detailed anime interior, dreamy lighting'
  ],
  scenes: [
    {
      id: 'narrative1',
      type: 'video',
      shots: [
        {
          image: 'anime style school gate after class, students walking out, sunset light, detailed anime background',
          text: '放学了',
          duration: 2200
        },
        {
          image: 'anime style school bleachers at sunset, girl sitting alone, basketball court in distance, golden hour lighting, peaceful yet sad atmosphere, detailed anime background',
          text: '你一个人走到操场的看台上',
          duration: 2800
        },
        {
          image: 'anime style sunset sky, orange and pink clouds, wide shot, peaceful atmosphere, detailed anime background',
          text: '夕阳把天空染成温柔的橙红色',
          duration: 2800
        },
        {
          image: 'anime style basketball court in distance, blurry figures playing, warm sunset, detailed anime background',
          text: '远处篮球场有人在打球',
          duration: 2500
        },
        {
          image: 'anime style wind blowing hair, sunset backlight, peaceful expression, detailed anime character art',
          text: '喊声和笑声飘过来，又被风吹散',
          duration: 3000
        }
      ],
      nextScene: 'narrative2'
    },
    {
      id: 'narrative2',
      type: 'video',
      shots: [
        {
          image: 'anime style girl hugging knees on bleachers, sunset glow, distant laughter blurred, introspective mood, detailed anime character art, warm orange light',
          text: '你抱着膝盖坐在台阶上',
          duration: 2800
        },
        {
          image: 'anime style closeup of face, head buried in arms, sad expression, sunset light, detailed anime character art',
          text: '把头埋进臂弯里',
          duration: 2500
        },
        {
          image: 'anime style math textbook, open page with confused notes, sunset light on page, detailed anime closeup',
          text: '今天的数学课，还是有很多听不懂',
          duration: 2800
        },
        {
          image: 'anime style two students blurred in background, walking together, warm sunset, foreground empty seat, detailed anime scene',
          text: '同桌虽然讲了题',
          duration: 2500
        },
        {
          image: 'anime style girl sitting alone, shadow stretching long, sunset, melancholic mood, detailed anime illustration',
          text: '为什么别人都学得那么轻松呢',
          duration: 3200
        }
      ],
      nextScene: 'choice1'
    },
    {
      id: 'choice1',
      type: 'choice',
      question: '手机在口袋里震了一下，是哥哥发来的消息："今天怎么样？"你盯着屏幕看了很久，你会——',
      bgImage: 'anime style phone screen closeup, message from older brother, sunset background, warm glow, emotional moment, detailed anime illustration, golden hour',
      options: [
        {
          text: '把今天的委屈都告诉他',
          isPositive: true,
          isBrave: true,
          nextScene: 'consequence1_positive'
        },
        {
          text: '回一句"没什么，挺好的"',
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
          image: 'anime style hands typing on phone, sunset background, detailed anime closeup',
          text: '你打了又删，删了又打',
          duration: 2500
        },
        {
          image: 'anime style phone screen with long text message, emotional typing, sunset glow, detailed anime closeup',
          text: '最后终于把今天的事一五一十发了过去',
          duration: 2800
        },
        {
          image: 'anime style phone face down on lap, hands trembling, sunset light, detailed anime closeup',
          text: '发完之后，你把手机扣在腿上',
          duration: 2500
        },
        {
          image: 'anime style girl sitting on bleachers, hand on chest, feeling heartbeat, sunset backlight, detailed anime character art',
          text: '心跳得很快',
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
          image: 'anime style phone vibrating, notification popping up, sunset light, detailed anime closeup',
          text: '过了一会儿，手机震了',
          duration: 2500
        },
        {
          image: 'anime style phone screen with long message from brother, warm glow, emotional moment, detailed anime closeup',
          text: '哥哥回了好长一段话',
          duration: 2500
        },
        {
          image: 'anime style girl reading phone, eyes wide, surprised expression, sunset glow on face, detailed anime character art',
          text: '"我记得你初二那年，数学第一次考了92分"',
          duration: 3000
        },
        {
          image: 'anime style tear drop on phone screen, sunset reflection, emotional moment, detailed anime closeup',
          text: '那件事，连你自己都快忘了',
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
          image: 'anime style hands typing "fine" on phone, fake smile emoji, sunset background, detailed anime closeup',
          text: '你打了"挺好的"三个字',
          duration: 2500
        },
        {
          image: 'anime style finger hovering over send button, hesitant, sunset light, detailed anime closeup',
          text: '又加了一个笑脸',
          duration: 2500
        },
        {
          image: 'anime style phone being put on silent, screen dimming, sunset glow, detailed anime closeup',
          text: '发送之后，你把手机调成静音',
          duration: 2500
        },
        {
          image: 'anime style girl staring at sunset, empty expression, lonely mood, detailed anime character art',
          text: '说了又能怎么样呢，他也帮不上什么忙',
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
          image: 'anime style phone vibrating quietly, sunset light, detailed anime closeup',
          text: '手机安静了一会儿，又震了',
          duration: 2500
        },
        {
          image: 'anime style phone screen showing message: "really? you can talk to me", warm glow, detailed anime closeup',
          text: '"真的吗？心情不好可以跟我说哦"',
          duration: 2800
        },
        {
          image: 'anime style closeup of eyes, tears forming, sunset reflection, detailed anime closeup',
          text: '你看着屏幕',
          duration: 2200
        },
        {
          image: 'anime style girl covering mouth with hand, tears, sunset backlight, emotional moment, detailed anime character art',
          text: '鼻子突然有点酸',
          duration: 3000
        }
      ],
      nextScene: 'choice2'
    },
    {
      id: 'choice2',
      type: 'choice',
      question: '夕阳慢慢沉下去，天边的颜色从橙红变成粉紫。你站起身，拍拍裤子上的灰。你对自己说——',
      bgImage: 'anime style bleachers at dusk, purple and orange sky, girl standing up, silhouette against sunset, moment of decision, detailed anime scene, atmospheric lighting',
      options: [
        {
          text: '慢慢来，我也可以做得很好',
          isPositive: true,
          isThinker: true,
          nextScene: 'consequence2_positive'
        },
        {
          text: '明天再说明天的事吧',
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
          image: 'anime style girl standing up from bleachers, stretching, sunset sky, detailed anime character art',
          text: '你深吸一口气',
          duration: 2200
        },
        {
          image: 'anime style closeup of breath being exhaled, visible in cool air, sunset light, detailed anime closeup',
          text: '又缓缓吐出来',
          duration: 2200
        },
        {
          image: 'anime style hand holding phone, typing "thank you", sunset glow, detailed anime closeup',
          text: '今天确实很难，但也不是完全没有收获',
          duration: 2800
        },
        {
          image: 'anime style girl walking toward sunset, phone in hand, hopeful expression, warm golden light, newfound strength, detailed anime character art',
          text: '至少，你试着开口了',
          duration: 2800
        }
      ],
      nextScene: 'narrative_end_positive'
    },
    {
      id: 'narrative_end_positive',
      type: 'video',
      shots: [
        {
          image: 'anime style hand typing "thank you gege" on phone, sunset background, detailed anime closeup',
          text: '你拿出手机，给哥哥回了一句',
          duration: 2500
        },
        {
          image: 'anime style sunset path, girl walking away from camera, golden light, long shadow, detailed anime scene',
          text: '然后朝着夕阳的方向，慢慢走去',
          duration: 2800
        },
        {
          image: 'anime style closeup of wind blowing hair, gentle smile, sunset backlight, detailed anime character art',
          text: '晚风拂过脸颊',
          duration: 2500
        },
        {
          image: 'anime style small seed sprouting, soft glow, sunset background, hopeful metaphor, detailed anime illustration',
          text: '你好像听到心里有什么东西，正在悄悄发芽',
          duration: 3200
        }
      ],
      nextScene: 'ending'
    },
    {
      id: 'consequence2_negative',
      type: 'video',
      shots: [
        {
          image: 'anime style girl standing up, slinging backpack over shoulder, dusk sky, detailed anime character art',
          text: '你把书包甩到肩上',
          duration: 2500
        },
        {
          image: 'anime style walking toward school gate, dusk sky, tired posture, detailed anime scene',
          text: '往校门口走',
          duration: 2500
        },
        {
          image: 'anime style closeup of hands in pockets, looking down, dusk light, detailed anime closeup',
          text: '算了，不想了',
          duration: 2500
        },
        {
          image: 'anime style girl walking away from school, hands in pockets, dusk sky, tired expression, detailed anime illustration, somber mood',
          text: '明天的事，明天再说',
          duration: 3000
        }
      ],
      nextScene: 'narrative_end_negative'
    },
    {
      id: 'narrative_end_negative',
      type: 'video',
      shots: [
        {
          image: 'anime style school gate at dusk, girl looking back at playground, detailed anime scene',
          text: '你走到校门口',
          duration: 2200
        },
        {
          image: 'anime style view of empty bleachers, last sunlight, peaceful, detailed anime background',
          text: '回头看了一眼操场',
          duration: 2500
        },
        {
          image: 'anime style sunset last light, orange glow on clouds, detailed anime sky',
          text: '夕阳只剩最后一点光',
          duration: 2500
        },
        {
          image: 'anime style girl walking into dusk, silhouette, uncertain future, melancholic mood, detailed anime illustration',
          text: '明天……也许会好一点吧，谁知道呢',
          duration: 3200
        }
      ],
      nextScene: 'ending'
    },
    {
      id: 'ending',
      type: 'reflection',
      text: '你知道吗？\n\n有人记得那个发光的你，即使你自己都快忘了。\n\n那些看似笨拙的时刻，那些说不出口的委屈，都不能定义你是谁。你依然是那个会为了考92分而开心到眯起眼睛的孩子。\n\n成长不是一下子变厉害，而是一边跌跌撞撞，一边慢慢找到属于自己的节奏。慢慢来，你已经很努力了。',
      bgImage: 'anime style beautiful sunrise over mountains, golden light, hope and new beginnings, dreamy atmosphere, soft clouds, warm glow, detailed anime background art',
      nextAct: 'end'
    }
  ]
};
