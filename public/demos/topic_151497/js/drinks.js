const DRINK_CONFIG = {
  base: {
    espresso: { name: '浓缩咖啡', emoji: '☕', color: '#3d2817', description: '醇厚浓烈，是大多数咖啡的基底' },
    milk: { name: '温牛奶', emoji: '🥛', color: '#f5f0e8', description: '柔和顺滑，适合不安的心灵' },
    tea: { name: '清茶', emoji: '🍵', color: '#8a9a5b', description: '淡雅回甘，没有咖啡因的负担' },
    cocoa: { name: '热可可', emoji: '🍫', color: '#6b4423', description: '甜蜜浓郁，像童年的拥抱' }
  },
  temperature: {
    hot: { name: '热', emoji: '🔥', color: '#c44', description: '烫手的温度，能驱散寒冷和疲惫' },
    warm: { name: '温', emoji: '🌡️', color: '#c84', description: '刚刚好的温度，入口舒适' },
    iced: { name: '冰', emoji: '🧊', color: '#48c', description: '冰凉的触感，让人瞬间清醒' }
  },
  sweetness: {
    high: { name: '多糖', emoji: '🍯', color: '#d4a', description: '满满的甜，像被拥抱一样' },
    medium: { name: '半糖', emoji: '🍬', color: '#c8a', description: '适中的甜，刚刚好' },
    low: { name: '无糖', emoji: '🍋', color: '#8a8', description: '淡淡的苦，需要细细品味' }
  },
  topping: {
    milkfoam: { name: '奶泡', emoji: '☁️', color: '#fff8f0', description: '绵密的奶泡，像一朵云' },
    honey: { name: '蜂蜜', emoji: '🍯', color: '#ea4', description: '天然的甜，温暖的滋润' },
    mint: { name: '薄荷', emoji: '🌿', color: '#6a8', description: '清凉的醒神，一扫疲惫' },
    cinnamon: { name: '肉桂', emoji: '🥧', color: '#a65', description: '辛香的温暖，适合秋冬' },
    none: { name: '不加', emoji: '✋', color: '#ccc', description: '保持原本的味道' }
  }
};

const FEEDBACK_MESSAGES = {
  perfect: [
    '顾客的眼睛亮了起来，"这就是我想要的味道...谢谢你。"',
    '"你好像知道我心里在想什么。"顾客露出了久违的笑容。',
    '顾客默默喝了一口，眼眶微红，"好久没有人这么懂我了。"'
  ],
  good: [
    '"还不错，谢谢。"顾客点了点头，表情柔和了许多。',
    '顾客喝了一口，嘴角微微上扬，"这个味道...让我想起一些事情。"',
    '"虽然不是我平时喝的，但意外地很适合今天。"'
  ],
  neutral: [
    '"嗯...还可以吧。"顾客的语气有些犹豫。',
    '顾客礼貌地喝了一口，但没有表现出特别的情绪。',
    '"也许下次我可以试试别的。"'
  ],
  bad: [
    '"这个...好像不是我想要的味道。"顾客皱了皱眉头。',
    '顾客喝了一口就放下了杯子，看起来有些失望。',
    '"对不起，我可能不该来的。"'
  ]
};

const REALTIME_REACTIONS = {
  base: {
    espresso: {
      espresso: ['"就是这个，咖啡香一出来我就醒了。"', '"浓郁的咖啡味...今晚还能再撑两小时。"'],
      milk: ['"牛奶？我现在可不是来睡觉的..."', '"给熬夜的人端牛奶？你是想让我睡着吗？"'],
      tea: ['"清茶太淡了，撑不住今晚啊。"', '"喝茶提神，等于用牙签撬门——没用的。"'],
      cocoa: ['"热可可太甜了，会让我犯困的。"', '"现在可不是做甜梦的时候啊。"']
    },
    milk: {
      espresso: ['"咖啡太苦了，我今天需要温柔一点。"', '"espresso？我的胃会先抗议的。"'],
      milk: ['"温牛奶就好，像有人陪着一样。"', '"牛奶的柔和，正好安抚今天的累。"'],
      tea: ['"茶有点涩，我还是想要奶香。"', '"现在不想品茶，只想被安慰一下。"'],
      cocoa: ['"可可太甜了，牛奶刚刚好。"', '"像兑了水的安慰，不过也够了。"']
    },
    tea: {
      espresso: ['"espresso太冲了，我这把老骨头受不了。"', '"晚上会睡不着的，年轻人。"'],
      milk: ['"牛奶太腻了，不清爽。"', '"我想喝的是茶，不是奶茶。"'],
      tea: ['"清茶一盏，才是日子的味道。"', '"不浓不淡，刚刚好。"'],
      cocoa: ['"可可太甜，遮住了茶味。"', '"甜的东西，会让我想起不该想的味道。"']
    },
    cocoa: {
      espresso: ['"咖啡太苦了，今天不想那么坚强。"', '"我已经很累了，不想被苦味提醒。"'],
      milk: ['"牛奶太淡了，不够抱抱我。"', '"太轻了，压不住此刻的冷。"'],
      tea: ['"茶太清了，我想要浓郁的。"', '"我现在需要的是甜蜜，不是清醒。"'],
      cocoa: ['"热可可，就是这个拥抱的味道。"', '"甜蜜浓郁，像有人轻轻抱了我一下。"']
    }
  },
  temperature: {
    hot: {
      hot: ['"烫一点好，我手很冷。"', '"热气腾腾的，正是我需要的。"', '"烫烫的，能把寒气都赶出去。"'],
      warm: ['"温的也可以...不过要是再热一点就更好了。"', '"差点火候，像没捂热的手。"'],
      iced: ['"冰的？我现在可不想喝冰的..."', '"你是想让我从里到外都凉透吗？"']
    },
    warm: {
      hot: ['"有点烫...不过没关系。"', '"太热了，得吹半天才能喝。"', '"心意收到了，但舌头有点抗议。"'],
      warm: ['"这个温度刚刚好。"', '"不烫不凉，很温柔。"', '"温温润润的，正合适。"'],
      iced: ['"凉的吗？我还是想喝温的。"', '"冰的会让我更紧张。"']
    },
    iced: {
      hot: ['"太热了，我需要冷静一下。"', '"现在给我热的，是想让我继续烦躁吗？"', '"这么燥的时候，热的可帮不了我。"'],
      warm: ['"温的不够，我想要冰的。"', '"差一点冰凉，清醒不过来。"', '"还差点劲儿，我需要更冷一点。"'],
      iced: ['"冰的正好，清醒多了。"', '"这个冰凉的感觉，很舒服。"', '"一口下去，整个人都精神了。"']
    }
  },
  sweetness: {
    high: {
      high: ['"够甜，我喜欢。"', '"甜一点心里会好受些。"', '"今天的苦终于有人懂了。"'],
      medium: ['"甜是甜的，但还可以再多一点。"', '"再甜一点，我就更有力气了。"'],
      low: ['"太淡了...我今天需要甜。"', '"这点糖，根本盖不住生活的苦。"']
    },
    medium: {
      high: ['"有点太甜了。"', '"糖分超标，我不是来吃蛋糕的。"', '"齁得慌，少一点就好了。"'],
      medium: ['"这个甜度刚好。"', '"不腻，刚刚好。"', '"适中的甜，像今天的心情。"'],
      low: ['"有点苦...不过也还行。"', '"再甜一点就更好了。"']
    },
    low: {
      high: ['"太甜了，我不习惯。"', '"这么甜，会让我忘了原本的味道。"', '"甜得有点过分了。"'],
      medium: ['"还行，但我平时喝更淡的。"', '"再少点糖就更接近我平时喝的了。"'],
      low: ['"淡淡的，很好。"', '"不要太多糖，我喜欢原本的味道。"', '"淡淡的苦，才记得住日子。"']
    }
  },
  topping: {
    milkfoam: {
      milkfoam: ['"奶泡很绵密，像云朵一样。"', '"这层奶泡，温柔得像棉被。"'],
      honey: ['"蜂蜜？我还是喜欢奶泡的口感。"', '"蜂蜜太甜，会压住奶泡的轻盈。"'],
      mint: ['"薄荷太清凉了，不太搭。"', '"薄荷一下去，奶泡的温柔全没了。"'],
      cinnamon: ['"肉桂味有点重..."', '"肉桂太抢戏，奶泡变成配角了。"'],
      none: ['"没有奶泡吗？我喜欢那层绵密的口感。"', '"少了奶泡，总觉得不完整。"']
    },
    honey: {
      milkfoam: ['"奶泡盖住了蜂蜜的味道..."', '"我想尝的是蜂蜜，不是奶泡。"'],
      honey: ['"蜂蜜的甜味很自然。"', '"这个甜味让我想起了小时候。"', '"温暖的甜，刚刚好。"'],
      mint: ['"薄荷和蜂蜜混在一起有点奇怪。"', '"这组合像是牙膏兑糖，不太对。"'],
      cinnamon: ['"肉桂味太抢戏了。"', '"蜂蜜的甜被肉桂盖住了。"'],
      none: ['"我想要点甜味点缀一下。"', '"蜂蜜能给我一点温暖的甜。"']
    },
    mint: {
      milkfoam: ['"奶泡太腻，我想要清爽一点。"', '"加了奶泡，薄荷都透不过气了。"'],
      honey: ['"蜂蜜太甜了，我想清醒一点。"', '"甜和凉在嘴里打架，怪怪的。"'],
      mint: ['"薄荷很提神，谢谢。"', '"清凉的一口，疲惫都被赶走了。"'],
      cinnamon: ['"肉桂不适合我现在的状态。"', '"肉桂太暖，薄荷太凉，它们在吵架。"'],
      none: ['"我想要一点清凉的感觉。"', '"没有薄荷，提神效果差了好多。"']
    },
    cinnamon: {
      milkfoam: ['"奶泡太淡了，我想要更有层次的味道。"', '"奶泡把肉桂的香气都闷住了。"'],
      honey: ['"蜂蜜太甜，我想要辛香一点。"', '"甜和辛香混在一起，有点 confused。"'],
      mint: ['"薄荷太凉，不适合这个天气。"', '"肉桂和薄荷？口味有点前卫了。"'],
      cinnamon: ['"肉桂的香味很温暖。"', '"辛香的温暖，很适合此刻。"'],
      none: ['"我想要一点香料的味道。"', '"没有肉桂，总觉得少了一层暖意。"']
    },
    none: {
      milkfoam: ['"我不需要额外的配料..."', '"简单点就好，配料会让我分心。"'],
      honey: ['"不用加蜂蜜，谢谢。"', '"今天不想太甜。"'],
      mint: ['"不要薄荷。"', '"薄荷太凉了，不适合现在的我。"'],
      cinnamon: ['"肉桂会让我想起一些事，今天不要。"', '"肉桂味太重，我想保持原样。"'],
      none: ['"简单点就好。"', '"原本的味道，就很好。"', '"什么都不加，才最自在。"']
    }
  }
};

function calculateMatch(playerDrink, preferredDrink) {
  let score = 0;
  const details = {};
  
  ['base', 'temperature', 'sweetness', 'topping'].forEach(key => {
    const match = playerDrink[key] === preferredDrink[key];
    details[key] = match;
    if (match) score += 1;
  });
  
  let level;
  if (score === 4) level = 'perfect';
  else if (score >= 2) level = 'good';
  else if (score >= 1) level = 'neutral';
  else level = 'bad';
  
  return { level, score, details };
}

function getRandomFeedback(level) {
  const messages = FEEDBACK_MESSAGES[level];
  return messages[Math.floor(Math.random() * messages.length)];
}

function getRealtimeReaction(key, preferred, chosen) {
  const reactions = REALTIME_REACTIONS[key]?.[preferred]?.[chosen];
  if (!reactions || reactions.length === 0) return null;
  return reactions[Math.floor(Math.random() * reactions.length)];
}

function getDrinkName(drink) {
  if (!drink.base) return '还未开始调制';
  const base = DRINK_CONFIG.base[drink.base];
  const temp = drink.temperature ? DRINK_CONFIG.temperature[drink.temperature] : null;
  const sweet = drink.sweetness ? DRINK_CONFIG.sweetness[drink.sweetness] : null;
  const topping = drink.topping ? DRINK_CONFIG.topping[drink.topping] : null;
  
  let name = base.name;
  if (temp) name = temp.name + name;
  if (sweet && sweet.name !== '无糖') name += sweet.name;
  if (topping && topping.name !== '不加') name += '·' + topping.name;
  
  return name;
}

const FAILURE_ROASTS = {
  base: {
    espresso: {
      espresso: ['"就是这个！浓郁的咖啡香，今晚又能多撑两小时。"'],
      milk: ['"给熬夜的人端牛奶？你是想让我睡着吗？"', '"我现在需要的是燃料，不是摇篮曲。"'],
      tea: ['"清茶？这点咖啡因连我的眼皮都抬不起来。"', '"喝茶提神，等于用牙签撬门——没用的。"'],
      cocoa: ['"热可可太甜了，喝完我只会想钻进被窝。"', '"现在可不是做甜梦的时候啊。"']
    },
    milk: {
      espresso: ['"咖啡太苦了，我今天的生活已经够苦了。"', '"espresso？我的胃会先抗议的。"'],
      milk: ['"温牛奶就好，像有人轻轻拍了拍我的背。"'],
      tea: ['"茶有点涩，我想要更温柔的口感。"', '"现在不想品茶，只想被安慰一下。"'],
      cocoa: ['"可可太甜了，像是把烦恼都糊住了。"', '"牛奶刚刚好，不用那么隆重。"']
    },
    tea: {
      espresso: ['"espresso太冲了，我这把年纪可经不起折腾。"', '"晚上会睡不着的，年轻人。"'],
      milk: ['"牛奶太腻了，不清爽。"', '"我想喝的是茶，不是奶茶。"'],
      tea: ['"清茶一盏，才是日子的味道。"'],
      cocoa: ['"可可太甜，把茶的回甘都遮住了。"', '"甜的东西，会让我想起不该想的味道。"']
    },
    cocoa: {
      espresso: ['"咖啡太苦了，今天不想那么坚强。"', '"我已经很累了，不想被苦味提醒。"'],
      milk: ['"牛奶太淡了，不够抱抱我。"', '"像兑了水的安慰，不够啊。"'],
      tea: ['"茶太清了，撑不住此刻的冷。"', '"我现在需要的是甜蜜，不是清醒。"'],
      cocoa: ['"热可可...就是这个拥抱的味道。"']
    }
  },
  temperature: {
    hot: {
      hot: ['"烫一点好，热气能把寒气都赶出去。"'],
      warm: ['"温的也行，但要是再热点就更好了。"', '"差点火候，像没捂热的手。"'],
      iced: ['"冰的？我现在可不想喝冰的..."', '"你是想让我从里到外都凉透吗？"']
    },
    warm: {
      hot: ['"有点烫...不过心意我领了。"', '"太热了，得吹半天才能喝。"'],
      warm: ['"这个温度刚刚好，不烫不凉。"'],
      iced: ['"凉的吗？我想喝温温润润的。"', '"冰的会让我更紧张。"']
    },
    iced: {
      hot: ['"太热了，我需要冷静一下。"', '"现在给我热的，是想让我继续烦躁吗？"'],
      warm: ['"温的不够，我想要冰的。"', '"差一点冰凉，清醒不过来。"'],
      iced: ['"冰的正好，清醒多了。"']
    }
  },
  sweetness: {
    high: {
      high: ['"够甜，今天的苦终于有人懂了。"'],
      medium: ['"甜是甜的，但还可以再多一点。"', '"再甜一点，我就更有力气了。"'],
      low: ['"太淡了...我今天真的需要甜。"', '"这点糖，根本盖不住生活的苦。"']
    },
    medium: {
      high: ['"有点太甜了，齁得慌。"', '"糖分超标，我不是来吃蛋糕的。"'],
      medium: ['"这个甜度刚好，不腻。"'],
      low: ['"有点苦...不过也还行。"', '"再甜一点就更好了。"']
    },
    low: {
      high: ['"太甜了，我不习惯。"', '"这么甜，会让我忘了原本的味道。"'],
      medium: ['"还行，但我平时喝更淡的。"', '"再少点糖就更接近我平时喝的了。"'],
      low: ['"淡淡的，很好。"', '"不要太多糖，我喜欢原本的味道。"']
    }
  },
  topping: {
    milkfoam: {
      milkfoam: ['"奶泡很绵密，像云朵一样。"'],
      honey: ['"蜂蜜？我还是喜欢奶泡的口感。"', '"蜂蜜太甜，会压住奶泡的轻盈。"'],
      mint: ['"薄荷太清凉了，不太搭。"', '"薄荷一下去，奶泡的温柔全没了。"'],
      cinnamon: ['"肉桂味有点重..."', '"肉桂太抢戏，奶泡变成配角了。"'],
      none: ['"没有奶泡吗？我喜欢那层绵密的口感。"', '"少了奶泡，总觉得不完整。"']
    },
    honey: {
      milkfoam: ['"奶泡盖住了蜂蜜的味道..."', '"我想尝的是蜂蜜，不是奶泡。"'],
      honey: ['"蜂蜜的甜味很自然。"'],
      mint: ['"薄荷和蜂蜜混在一起有点奇怪。"', '"这组合像是牙膏兑糖，不太对。"'],
      cinnamon: ['"肉桂味太抢戏了。"', '"蜂蜜的甜被肉桂盖住了。"'],
      none: ['"我想要点甜味点缀一下。"', '"蜂蜜能给我一点温暖的甜。"']
    },
    mint: {
      milkfoam: ['"奶泡太腻，我想要清爽一点。"', '"加了奶泡，薄荷都透不过气了。"'],
      honey: ['"蜂蜜太甜了，我想清醒一点。"', '"甜和凉在嘴里打架，怪怪的。"'],
      mint: ['"薄荷很提神，谢谢。"'],
      cinnamon: ['"肉桂不适合我现在的状态。"', '"肉桂太暖，薄荷太凉，它们在吵架。"'],
      none: ['"我想要一点清凉的感觉。"', '"没有薄荷，提神效果差了好多。"']
    },
    cinnamon: {
      milkfoam: ['"奶泡太淡了，我想要更有层次的味道。"', '"奶泡把肉桂的香气都闷住了。"'],
      honey: ['"蜂蜜太甜，我想要辛香一点。"', '"甜和辛香混在一起，有点 confused。"'],
      mint: ['"薄荷太凉，不适合这个天气。"', '"肉桂和薄荷？口味有点前卫了。"'],
      cinnamon: ['"肉桂的香味很温暖。"'],
      none: ['"我想要一点香料的味道。"', '"没有肉桂，总觉得少了一层暖意。"']
    },
    none: {
      milkfoam: ['"我不需要额外的配料..."', '"简单点就好，配料会让我分心。"'],
      honey: ['"不用加蜂蜜，谢谢。"', '"今天不想太甜。"'],
      mint: ['"不要薄荷。"', '"薄荷太凉了，不适合现在的我。"'],
      cinnamon: ['"肉桂会让我想起一些事，今天不要。"', '"肉桂味太重，我想保持原样。"'],
      none: ['"简单点就好。"', '"原本的味道，就很好。"']
    }
  }
};

function getFailureRoast(key, preferred, chosen) {
  const roasts = FAILURE_ROASTS[key]?.[preferred]?.[chosen];
  if (!roasts || roasts.length === 0) return null;
  return roasts[Math.floor(Math.random() * roasts.length)];
}
