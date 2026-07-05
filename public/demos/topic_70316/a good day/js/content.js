// 30 天内容数据
// 每日随机抽取一条展示
const dailyContent = [
  {
    day: 1,
    title: "慢慢来",
    audioFile: "day01.mp3",
    morningMessage: "昨天我也差点没起来，但我起来了，今天你也行。"
  },
  {
    day: 2,
    title: "一起吧",
    audioFile: "day02.mp3",
    morningMessage: "不想上班是对的，说明你在做一份正常的工作。先起来再说。"
  },
  {
    day: 3,
    title: "先坐起来",
    audioFile: "day03.mp3",
    morningMessage: "今天降温，出门多穿一件。这是来自陌生人的关心。"
  },
  {
    day: 4,
    title: "不急",
    audioFile: "day04.mp3",
    morningMessage: "我懂，起床很难。但你已经醒了对吧？那已经成功一半了。"
  },
  {
    day: 5,
    title: "你可以",
    audioFile: "day05.mp3",
    morningMessage: "今天可能不会很顺，但至少这个早上，有人和你一样在努力坐起来。"
  },
  {
    day: 6,
    title: "深呼吸",
    audioFile: "day06.mp3",
    morningMessage: "不用想太远，把今天过好就够了。"
  },
  {
    day: 7,
    title: "放松点",
    audioFile: "day07.mp3",
    morningMessage: "你不需要今天就把所有事做完。"
  },
  {
    day: 8,
    title: "第一天",
    audioFile: "day08.mp3",
    morningMessage: "每一个周一都是重新开始的机会。"
  },
  {
    day: 9,
    title: "喝口水",
    audioFile: "day09.mp3",
    morningMessage: "先喝杯水，再处理那些烦心事。"
  },
  {
    day: 10,
    title: "没关系的",
    audioFile: "day10.mp3",
    morningMessage: "昨晚没睡好也没关系，今天会过去的。"
  },
  {
    day: 11,
    title: "休息下",
    audioFile: "day11.mp3",
    morningMessage: "你已经很努力了，今天可以稍微放慢一点。"
  },
  {
    day: 12,
    title: "走一步",
    audioFile: "day12.mp3",
    morningMessage: "不需要一步到位，走一步就是进步。"
  },
  {
    day: 13,
    title: "天亮了",
    audioFile: "day13.mp3",
    morningMessage: "窗外的光已经亮了，你也会亮起来的。"
  },
  {
    day: 14,
    title: "停一下",
    audioFile: "day14.mp3",
    morningMessage: "在开始忙碌之前，先给自己一分钟。"
  },
  {
    day: 15,
    title: "我在呢",
    audioFile: "day15.mp3",
    morningMessage: "今天可能有点孤单，但你并不孤独。"
  },
  {
    day: 16,
    title: "新的一天",
    audioFile: "day16.mp3",
    morningMessage: "不管昨天怎样，今天都是新的。"
  },
  {
    day: 17,
    title: "就现在",
    audioFile: "day17.mp3",
    morningMessage: "别想太多，先坐起来，剩下的慢慢来。"
  },
  {
    day: 18,
    title: "好天气",
    audioFile: "day18.mp3",
    morningMessage: "今天天气不错，适合好好过。"
  },
  {
    day: 19,
    title: "别怕",
    audioFile: "day19.mp3",
    morningMessage: "害怕是正常的，但别让害怕拦住你。"
  },
  {
    day: 20,
    title: "对自己好",
    audioFile: "day20.mp3",
    morningMessage: "今天记得对自己好一点。"
  },
  {
    day: 21,
    title: "慢一点",
    audioFile: "day21.mp3",
    morningMessage: "世界很快，但你可以慢一点。"
  },
  {
    day: 22,
    title: "可以的",
    audioFile: "day22.mp3",
    morningMessage: "你比你自己想象的更能扛。"
  },
  {
    day: 23,
    title: "抬起头",
    audioFile: "day23.mp3",
    morningMessage: "不管今天要面对什么，先抬起头。"
  },
  {
    day: 24,
    title: "简单的",
    audioFile: "day24.mp3",
    morningMessage: "有时候最简单的早晨，就是最好的早晨。"
  },
  {
    day: 25,
    title: "呼吸",
    audioFile: "day25.mp3",
    morningMessage: "吸一口气，呼一口气。你看，你还在。"
  },
  {
    day: 26,
    title: "刚刚好",
    audioFile: "day26.mp3",
    morningMessage: "不需要更好，现在的你就刚刚好。"
  },
  {
    day: 27,
    title: "打开窗",
    audioFile: "day27.mp3",
    morningMessage: "如果觉得闷，就打开窗透透气。"
  },
  {
    day: 28,
    title: "认真活",
    audioFile: "day28.mp3",
    morningMessage: "不用活得很精彩，认真活就够了。"
  },
  {
    day: 29,
    title: "没关系",
    audioFile: "day29.mp3",
    morningMessage: "就算今天什么都没做成，也没关系。"
  },
  {
    day: 30,
    title: "明天见",
    audioFile: "day30.mp3",
    morningMessage: "明天早上我还会在这里等你。"
  }
];

// 获取当日随机内容
function getTodayContent() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const index = seed % dailyContent.length;
  return dailyContent[index];
}

// 陌生人信件池（预写内容，每日随机一封）
const strangerLetters = [
  "今天早上我也没有起来。\n闹钟响了三次，按掉，又响了三次。\n但最后还是坐起来了。\n你能读到这封信，说明你也坐起来了。\n……那我们就都挺好的。",
  "不知道你今天要面对什么。\n面试、汇报、还是只是一个普通到让人发慌的周三。\n没关系。\n先呼吸，把这一口吸满，再慢慢呼出去。\n你可以的。",
  "我最近学会一件事：\n不用把每一天都过好。\n一天里能有一个小时是好的，就已经很了不起了。\n希望你今天也有这样的一小时。",
  "如果你现在觉得很累，\n那就再躺一分钟。\n不着急。\n这个世界不会因为你晚起一分钟就崩塌的。\n……我试过。",
  "昨天我也不太开心。\n但今天早上醒过来的时候，\n阳光刚好从窗帘缝里照进来。\n就那么一小条，\n突然觉得，好像也没那么糟。",
  "我猜你可能在犹豫什么。\n要不要去？要不要说？要不要做？\n我的建议是：\n如果你在犹豫，那就去。\n犹豫本身就是答案。",
  "你好。\n我不认识你，你也不认识我。\n但在这个早上，我们都在努力坐起来。\n这让我觉得，\n这个世界还不是那么糟糕。",
  "今天可能会很忙，\n可能会接到不想接的电话，\n可能会遇到不想见的人。\n但至少这个早上，\n你有一个完全属于你的30秒。",
  "我有时候会想，\n如果每天早上的第一件事不是看手机，\n而是像这样安静地待一会儿，\n会不会一天都不一样。\n……今天试试？",
  "给你讲个秘密：\n我每天早上起来的第一句话是——\n'行了，够了，起来吧。'\n对自己要温柔，但也要坚定。\n这句话送给你。",
  "你有没有那种感觉：\n明明什么都没做，却觉得很累。\n如果有的话，\n今天允许自己做一个没用的人。\n发发呆，也是正经事。",
  "窗外有人在遛狗，\n有人在买早餐，\n有人和你一样刚刚醒过来。\n你看，这个城市里，\n有很多人和你一起在开始这一天。",
  "今天可能不会事事顺利。\n但你在读这封信的这一刻，\n一切安好。\n这一刻是你的。\n这就够了。",
  "我经常想，\n陌生人的善意为什么特别温暖？\n大概因为彼此没有期待，\n所以每一份善意都是惊喜。\n希望这封信是你的惊喜。",
  "如果今天遇到困难，\n记得对自己说：\n'我已经醒过来了，\n最难的部分已经过去了。'\n剩下的，真的没那么难。",
  "不知道说什么的时候，\n就说'早安'。\n不知道做什么的时候，\n就先做最小的一件事。\n早安。\n以及，去做那件最小的事吧。",
  "今天天气预报说会下雨。\n但如果你心里是晴天，\n那就不算坏天气。\n……如果心里也是阴天，\n那就等一等，天总会晴的。",
  "我看到过一句话：\n'每天早上都是一次小型出生。'\n你从梦里回到了这个世界。\n欢迎回来。\n今天也请多关照。",
  "我今天要做的事：\n1. 喝一杯水\n2. 做一件让自己开心的事\n3. 不对自己太苛刻\n\n你要不要也列一个？\n三条就够了。",
  "别怕。\n不管今天要面对什么，\n你已经不是第一次面对了。\n你之前都扛过来了。\n这次也一样。"
];

// 获取今日陌生人信件
function getStrangerLetter() {
  const today = new Date();
  // 用日期做种子，但加个偏移量让它和每日内容不同
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate() + 999;
  const index = seed % strangerLetters.length;
  return strangerLetters[index];
}