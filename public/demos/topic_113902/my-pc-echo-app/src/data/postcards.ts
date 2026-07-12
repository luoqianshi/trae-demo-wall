/**
 * Postcard message template system
 *
 * Each character has a pool of message fragments (openings, bodies, closings)
 * that are randomly combined to produce unique daily messages.
 */

export interface PostcardTemplate {
  /** characterId references Character.id */
  characterId: string;
  /** greeting styles */
  greetings: string[];
  /** message body fragments — each is a self-contained 1-2 sentence observation */
  bodies: string[];
  /** sign-off lines */
  closings: string[];
  /** locations the character might "send from" */
  locations: string[];
  /** weather the character might mention */
  weathers: string[];
  /** mood tag for visual theming */
  moods: ('warm' | 'nostalgic' | 'cheerful' | 'romantic')[];
  /** scene description for illustration prompt */
  scenes: string[];
  /** festival-specific messages (optional, keyed by date range) */
  festivals?: FestivalMessage[];
}

export interface FestivalMessage {
  name: string;
  /** month-day range, e.g. "02-01~02-07" for spring festival */
  dateRange: string;
  greeting: string;
  body: string;
  closing: string;
  location: string;
}

export const postcardTemplates: PostcardTemplate[] = [
  {
    characterId: 'char-1', // 艾尔文 — 原神
    greetings: ['致远方的朋友：', '嗨，', '亲爱的旅行者：', '展信佳：'],
    bodies: [
      '今天风起地的蒲公英飞得很高，我追着它们跑了一下午，不知道你那边风大不大。',
      '路过星落湖的时候，看到了一条好大的鱼跳出来，差点溅我一身水。',
      '在风神像下面发了一会儿呆，风铃的声音很好听，像是谁在唱歌。',
      '今天摘了好多野草莓，留了一颗最好的，可惜寄不过去。',
      '爬上了摘星崖的顶端，整个蒙德都在脚下，突然觉得世界很大。',
      '去了趟千风神殿，那里的风一直在转，我跟着转了好久，差点摔倒。',
    ],
    closings: ['有空来蒙德吹风吧', '想你了', '下次一起看日落', '风里见', '——艾尔文'],
    locations: ['蒙德·风起地', '蒙德·星落湖', '蒙德·摘星崖', '蒙德·千风神殿', '蒙德·风龙废墟'],
    weathers: ['晴', '多云', '微风'],
    moods: ['warm', 'cheerful'],
    scenes: [
      '少年站在风起地的巨大橡树下，银发随风飘动，手中握着一根蒲公英',
      '星落湖畔的黄昏，水面映着橙红色的天空，远处有风车在转动',
    ],
    festivals: [
      {
        name: '风花节',
        dateRange: '03-20~03-26',
        greeting: '风花节快乐！',
        body: '今天蒙德到处都是鲜花和风筝，我在广场上给你放了一只特别大的。不知道你看到了没有。',
        closing: '——你的追风少年',
        location: '蒙德·风神广场',
      },
    ],
  },
  {
    characterId: 'char-2', // 绫人 — 原神
    greetings: ['好久不见：', '闲来无事，', '展信如晤：', '亲爱的朋友：'],
    bodies: [
      '今日在茶室里与三奉行开了一下午的会，突然很想找个安静的地方下棋。',
      '路过祭典街，看到小孩子们在玩追人游戏，想起了从前的事。',
      '樱花开得正盛，我让人在庭院里摆了壶好茶，可惜对面空着。',
      '今天处理了一件棘手的公务，不过总算圆满解决了。喝杯茶庆祝一下。',
      '夜里沿着花见坂散步，灯笼的光映在石板路上，特别安静。',
      '读了一本很有趣的棋谱，发现了一招从未想过的开局，下次对弈时试试。',
    ],
    closings: ['期待下次对弈', '茶已备好', '愿你也安好', '——绫人', '棋局未完'],
    locations: ['稻妻·祭典街', '稻妻·花见坂', '稻妻·天守阁', '稻妻·影向山', '稻妻·海祇岛'],
    weathers: ['晴', '阴', '微风'],
    moods: ['nostalgic', 'warm'],
    scenes: [
      '青年端坐在茶室中，樱花从窗外飘落，桌上摆着一副棋盘',
      '花见坂的夜晚，灯笼点缀的小路尽头，月色下的天守阁',
    ],
    festivals: [
      {
        name: '海灯节',
        dateRange: '08-20~08-27',
        greeting: '海灯节到了：',
        body: '今年放了好多灯，每一盏都写了愿望。其中一盏是给你的——希望它真的能飘到你那里。',
        closing: '——绫人',
        location: '稻妻·离岛海岸',
      },
    ],
  },
  {
    characterId: 'char-3', // 星野 — 崩坏：星穹铁道
    greetings: ['你好呀！', '嘿，', '来自列车的问候：', '亲爱的：'],
    bodies: [
      '列车今天停靠在一个没见过的星球，到处都是发光的水晶，漂亮极了。',
      '在观景车厢里泡了杯咖啡，看着窗外飞速掠过的星海，想和你分享这一刻。',
      '帕姆做了新的料理，味道嘛……意外的还可以。留了一份给你，下次给你。',
      '空间站里遇到一个迷路的小孩，帮他找到了回家的路，他送了我一颗糖。',
      '在星核猎手的追击下逃了一整天，现在终于安全了，累但开心。',
      '今天在模拟宇宙里打到很高的层数，差点以为出不来了哈哈。',
    ],
    closings: ['下一站见', '列车永远在', '想你的时候就看星空', '——星野', '✦'],
    locations: ['空间站·黑塔', '雅利洛·贝洛伯格', '仙舟·罗浮', '列车·观景车厢', '匹诺康尼'],
    weathers: ['晴', '星辉', '未知'],
    moods: ['cheerful', 'warm'],
    scenes: [
      '星穹列车停靠在外星球，少女靠在车窗边，窗外是绚烂的星河',
      '空间站全景窗外，蓝色地球般的星球在远处缓缓旋转',
    ],
    festivals: [
      {
        name: '星际和平日',
        dateRange: '10-01~10-07',
        greeting: '节日快乐！',
        body: '今天列车上特别热闹，大家都在庆祝。我在观景舱里放了烟花，是在太空放的哦！',
        closing: '——星野 ✦',
        location: '星穹列车·甲板',
      },
    ],
  },
  {
    characterId: 'char-4', // 阿兰 — 幻塔
    greetings: ['嘿朋友：', '今天怎么样：', '好久没联系了：', '致：'],
    bodies: [
      '今天在海边捡到了一枚很好看的贝壳，粉色的，有珍珠一样的光泽。',
      '又去了一趟镜都，那边的赛博灯光映在水面上，特别好看。',
      '克拉瑞尔教会今天很安静，我在长椅上坐了一下午，想了好多事。',
      '带了一瓶新的饮料，等下次见面请你喝。味道很特别，像是薄荷和柠檬。',
      '在海沃德山上看日出，云海翻涌的样子像梦境一样。',
      '今天帮暗塔做了些修复工作，手有点酸，但是看到它重新亮起来很有成就感。',
    ],
    closings: ['下次海边见', '照顾好自己', '——阿兰', '记得看日落', '在想你的海边等你'],
    locations: ['沃伦海滩', '镜都', '克拉瑞尔', '海沃德', '纳维亚', '暗塔遗址'],
    weathers: ['晴', '海风', '多云'],
    moods: ['warm', 'romantic'],
    scenes: [
      '少年站在海边的悬崖上，海风吹动衣角，远处夕阳正落入海平线',
      '镜都夜景，霓虹灯倒映在湿漉漉的街道上，雨后的城市格外明亮',
    ],
  },
  {
    characterId: 'char-5', // 空月 — 明日方舟
    greetings: ['罗德岛通讯：', '你好：', '收到请回复：', '日志记录：'],
    bodies: [
      '今天在甲板上晒了会儿太阳，阿米娅说我的睡姿很奇怪。',
      '去食堂的路上看到好几只猫在晒太阳，忍不住停下来摸了好久。',
      '博士又布置了新任务，不过这次好像没那么紧急。终于可以休息一下了。',
      '切城的风沙很大，执行任务的时候差点被吹跑了。凯尔希医生说这不算工伤。',
      '宿舍的窗户对着后山的森林，晚上偶尔能看到萤火虫。很安静。',
      '今天训练的时候把一个障碍物踢飞了，教官说很有"气势"。',
    ],
    closings: ['随时待命', '注意安全', '——空月', '罗德岛永远是家', '晚安'],
    locations: ['罗德岛本舰·甲板', '龙门', '切城废墟', '切尔诺伯格', '罗德岛·宿舍'],
    weathers: ['晴', '风沙', '阴'],
    moods: ['warm', 'nostalgic'],
    scenes: [
      '罗德岛舰船在云海中航行，少女靠在甲板栏杆上，远处是落日与群山',
      '龙门夜景，高楼间穿梭的霓虹飞行器，楼顶有一只孤独的猫',
    ],
  },
  {
    characterId: 'char-6', // 黎安 — 鸣潮
    greetings: ['听潮音：', '嗨：', '来自海岸的信：', '亲爱的：'],
    bodies: [
      '今天在海岸边听到了很好听的潮声，像是大海在唱歌。录了一段，但录音设备好像坏了。',
      '索诺拉的花开了一大片，紫色的花海一直延伸到山脚下，太美了。',
      '今天和共鸣物对战的时候，突然领悟了一个新的共鸣技能。虽然还不太熟练。',
      '去了一趟皇龙遗迹，那里已经被植物覆盖了，阳光从树缝里漏下来，像另一个世界。',
      '今天帮村里的老奶奶修了屋顶，她请我吃了顿饭，味道像是妈妈做的。',
      '在溪边钓鱼钓了一下午，一条都没上钩。但是很开心。',
    ],
    closings: ['潮声不息', '等你回音', '——黎安', '下次一起去海边', '想听潮声吗'],
    locations: ['索诺拉海岸', '皇龙城', '黑海岸', '北落野', '隐山'],
    weathers: ['晴', '海风', '多云'],
    moods: ['warm', 'cheerful'],
    scenes: [
      '少年站在海岸礁石上，脚下是蔚蓝的大海，身后是索诺拉的紫色花海',
      '皇龙遗迹的丛林深处，阳光透过古树冠层洒下金色光斑',
    ],
    festivals: [
      {
        name: '鸣潮祭',
        dateRange: '05-01~05-07',
        greeting: '鸣潮祭快乐：',
        body: '今天海岸边特别热闹，大家在沙滩上堆了好多东西。我堆了一座城堡，虽然被浪冲走了。',
        closing: '——黎安',
        location: '索诺拉海滩',
      },
    ],
  },
];

/**
 * Generate a random postcard message for a character
 */
export function generatePostcardMessage(characterId: string): {
  greeting: string;
  body: string;
  closing: string;
  location: string;
  weather: string;
  mood: string;
  scene: string;
} {
  const template = postcardTemplates.find((t) => t.characterId === characterId);
  if (!template) {
    return {
      greeting: '致你：',
      body: '今天天气很好。',
      closing: '——???',
      location: '未知',
      weather: '晴',
      mood: 'warm',
      scene: '一片安静的风景',
    };
  }

  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  return {
    greeting: pick(template.greetings),
    body: pick(template.bodies),
    closing: pick(template.closings),
    location: pick(template.locations),
    weather: pick(template.weathers),
    mood: pick(template.moods),
    scene: pick(template.scenes),
  };
}

/**
 * Check if today falls within a festival date range
 */
export function getFestivalMessage(characterId: string): FestivalMessage | null {
  const template = postcardTemplates.find((t) => t.characterId === characterId);
  if (!template?.festivals?.length) return null;

  const now = new Date();
  const todayStr = `${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  for (const festival of template.festivals) {
    const [start, end] = festival.dateRange.split('~');
    if (todayStr >= start && todayStr <= end) {
      return festival;
    }
  }
  return null;
}
