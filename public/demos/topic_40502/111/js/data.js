// ============ 心声树洞 - 种子数据 & 字典 ============
(function(global){
  'use strict';

  const EMOTIONS = {
    anxiety: { key:'anxiety', label:'焦虑', emoji:'😰', color:'#ff6b9d',   cls:'em-anxiety' },
    lonely:  { key:'lonely',  label:'孤独', emoji:'🌙', color:'#9b95ff',   cls:'em-lonely'  },
    anger:   { key:'anger',   label:'愤怒', emoji:'🔥', color:'#ffa856',   cls:'em-anger'   },
    lost:    { key:'lost',   label:'迷茫', emoji:'🌊', color:'#6ee7b7',   cls:'em-lost'    },
    heal:    { key:'heal',   label:'治愈', emoji:'🌱', color:'#ffd866',   cls:'em-heal'    }
  };

  const MOODS = [
    { key:1, label:'很糟糕', emoji:'😞', color:'#ff6b9d', tip:'深呼吸，先别责备自己' },
    { key:2, label:'有点差', emoji:'😕', color:'#ffa856', tip:'情绪起伏是正常的' },
    { key:3, label:'平平',   emoji:'😐', color:'#9b95ff', tip:'保持呼吸，关注当下' },
    { key:4, label:'还不错', emoji:'🙂', color:'#6ee7b7', tip:'谢谢你照顾自己' },
    { key:5, label:'很开心', emoji:'😄', color:'#ffd866', tip:'把这份好情绪记下来吧' }
  ];

  // 初始化种子树洞
  const SEED_HOLES = [
    { emotion:'anxiety', content:'考研倒计时 30 天，每天早上睁开眼都心跳加速。明明已经很努力了，还是怕让爸妈失望。大家也会这样吗？' },
    { emotion:'lonely',  content:'在异地读大学，室友都出去约会了。周末一个人在食堂吃饭，听着周围的笑声，突然很想家。' },
    { emotion:'anger',   content:'明明已经连续加班三个月了，leader 还是在周会上说我"不够主动"。我真的想直接摔门走人。' },
    { emotion:'lost',    content:'毕业三年，同学有的考公有的读博，我还在小公司做着不喜欢的工作。我的人生是不是走偏了？' },
    { emotion:'heal',    content:'今天在阳台种的小多肉冒出了新芽。很小很小，但我盯着它看了好久。原来治愈自己，可以这么简单。' },
    { emotion:'anxiety', content:'暗恋了两年的人官宣了。没有哭，但心里空落落的。树洞真好，没人认识我。' },
    { emotion:'lonely',  content:'i 人真的会谢，团建结束后回家，一晚上没说话，也不想说话。安静就是最好的充电。' },
    { emotion:'heal',   content:'给五年后的自己写了封信。原来那些以为过不去的坎，真的会过去。' },
  ];

  // 故事卡
  const STORY_CARDS = [
    { title:'考研二战那年', body:'我也曾一个人在图书馆熬到闭馆。有一次崩溃到在走廊哭，保洁阿姨递了一张纸，什么都没说就走了。后来我考上了。不是因为我更厉害，而是因为那份无声的善意让我知道——不是一个人。' },
    { title:'裸辞的第 100 天', body:'辞职前我以为自己会解脱，结果反而更焦虑。直到我开始每天去公园散步，看树、看老人打太极。钱少了，但我重新认识了自己。裸辞不是逃离，而是给自己一次重新选择的机会。' },
    { title:'从社恐到能讲课', body:'三年前我连打电话都要做心理建设。现在我在讲台上讲课。不是我变外向了，是我接受了"我就是这样的人"。接纳自己，比强迫自己改变更温柔。' },
    { title:'那个让我心动的陌生人', body:'地铁上一个陌生人主动给我递了张纸巾，只是因为我那天看起来有点难过。我们没说再见，但我后来把这份温柔传递给了更多人。' },
    { title:'失眠的第 200 天', body:'我曾经每天凌晨 3 点才能睡着。后来我不再强迫自己入睡，而是起来看书、画画、发呆。慢慢地，睡眠回来了。越用力越睡不着，这大概就是睡眠的悖论。' },
  ];

  // AI 回复模板（按情绪）
  const AI_REPLIES = {
    greeting: [
      '你好呀，我在这里。想聊点什么？',
      '欢迎回来～今天想从哪里开始？',
      '深呼吸一下，我在听。'
    ],
    anxiety: [
      '能感到你现在很紧绷，我们先做一次 4-7-8 呼吸好吗？吸气 4 秒，屏息 7 秒，呼气 8 秒。',
      '焦虑时的心跳加速是身体在说"我感到不安全"。这不是你的错。',
      '如果把你现在的担心写下来，你觉得最让你害怕的那一条是什么？我们可以慢慢拆。',
      '你已经做得比你以为的更努力了。我们先把"必须完美"放一边，今天的你已经足够。'
    ],
    lonely: [
      '孤独是被看见的渴望没有被回应。我看到你了。',
      '一个人吃饭、一个人散步、一个人扛事，这些时刻都很珍贵，不必急着"合群"。',
      '如果你愿意，我可以陪你聊到你不想聊为止。',
      '你说的每一句话都会被认真对待，这就是树洞的意义。'
    ],
    anger: [
      '愤怒背后常常藏着没被说出口的委屈。你愿意告诉我吗？',
      '你现在想做什么都可以，但先别做会后悔的事。比如写一封信，写完就烧掉。',
      '我听到了你的愤怒，它是合理的。不需要压抑，我们可以把它变成边界。',
      '如果可以，离开那个让你生气的场景，喝一杯温水。'
    ],
    lost: [
      '迷茫不是失败，是在重新寻找自己。',
      '你现在的"不知道要什么"，其实也是一种清晰——你知道自己不想要什么。',
      '如果五年后的你站在面前，你最想对 TA 说什么？',
      '走慢一点没关系，方向比速度重要。而你正在路上。'
    ],
    heal: [
      '很高兴听到你这样说，这份感觉很珍贵。',
      '记得把此刻的美好记下来，以后低落时可以回来取。',
      '谢谢你把这份温柔分享给我。',
      '你正在变好，这本身就是了不起的事。'
    ],
    generic: [
      '我在这里。你可以慢慢说，不急。',
      '谢谢你愿意信任我。',
      '你刚才说的，我听到了。',
      '如果有什么没说出口的，也可以告诉我。',
      '你愿意聊，已经很勇敢了。'
    ]
  };

  // 情绪关键词识别
  const EMOTION_KEYWORDS = {
    anxiety: ['焦虑','紧张','担心','害怕','怕','考试','考研','压力','失眠','睡不着','心跳'],
    lonely:  ['孤独','一个人','没人','寂寞','想家','孤单','没人懂','独处'],
    anger:   ['生气','愤怒','烦','讨厌','恨','不爽','崩溃','气死','可恶'],
    lost:    ['迷茫','不知道','纠结','选择','方向','人生','意义','走偏','困惑'],
    heal:    ['好起来','治愈','快乐','开心','感谢','希望','平静','温柔']
  };

  const LIB = {
    EMOTIONS, MOODS, SEED_HOLES, STORY_CARDS, AI_REPLIES, EMOTION_KEYWORDS,
    detectEmotion(text){
      if (!text) return 'lost';
      const scores = {};
      Object.keys(EMOTION_KEYWORDS).forEach(k => {
        scores[k] = EMOTION_KEYWORDS[k].reduce((acc, w) => acc + (text.includes(w) ? 1 : 0), 0);
      });
      const best = Object.entries(scores).sort((a,b) => b[1]-a[1])[0];
      return best && best[1] > 0 ? best[0] : 'lost';
    },
    randomPick(arr){ return arr[Math.floor(Math.random()*arr.length)]; },
    timeAgo(ts){
      const diff = Date.now() - ts;
      const m = Math.floor(diff/60000);
      if (m < 1) return '刚刚';
      if (m < 60) return m + ' 分钟前';
      const h = Math.floor(m/60);
      if (h < 24) return h + ' 小时前';
      const d = Math.floor(h/24);
      if (d < 7) return d + ' 天前';
      return new Date(ts).toLocaleDateString();
    }
  };

  global.TH = global.TH || {};
  global.TH.Lib = LIB;

})(window);
