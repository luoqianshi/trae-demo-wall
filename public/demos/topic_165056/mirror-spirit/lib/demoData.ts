export interface DemoDayData {
  day: number;
  title: string;
  description: string;
  discrepancy_score: number;
  prev_score: number;
  total_analyses: number;
  total_chats: number;
  avg_week_score: number;
  avg_month_score: number;
  emotion_dimensions: {
    energy: number;
    anxiety: number;
    happiness: number;
    calmness: number;
    motivation: number;
    confidence: number;
  };
  insight: string;
  strengths: string[];
  growth_areas: string[];
  suggestions: string[];
  trend_scores: number[];
  trend_dates: string[];
  top_locations: { keyword: string; count: number }[];
  sample_diary: string;
  sample_analysis: {
    ideal_self: string;
    actual_self: string;
    suggested_action: string;
    location_keyword: string;
    mirror_insight: string;
    personality_traits: string[];
  };
}

function generateTrend(endScore: number, days: number, volatility: number = 8): number[] {
  const scores: number[] = [];
  let current = Math.min(95, endScore + 15);
  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.7) * volatility;
    current = Math.max(20, Math.min(95, current + change));
    scores.push(Math.round(current));
  }
  scores[scores.length - 1] = endScore;
  return scores;
}

function generateDates(days: number): string[] {
  const dates: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(`${d.getMonth() + 1}/${d.getDate()}`);
  }
  return dates;
}

export const demoData: Record<number, DemoDayData> = {
  1: {
    day: 1,
    title: "初识之镜",
    description: "第一次见面，AI还在慢慢认识你",
    discrepancy_score: 72,
    prev_score: 75,
    total_analyses: 1,
    total_chats: 2,
    avg_week_score: 72,
    avg_month_score: 72,
    emotion_dimensions: {
      energy: 55,
      anxiety: 60,
      happiness: 45,
      calmness: 40,
      motivation: 50,
      confidence: 48,
    },
    insight: "你似乎最近有些焦虑，对自己的期待很高，但实际行动还没跟上。这很正常，我们慢慢来。",
    strengths: ["有自我觉察意识", "愿意主动反思"],
    growth_areas: ["情绪稳定性", "行动力转化"],
    suggestions: ["试着每天写三句话", "从最小的行动开始", "别着急，我们慢慢来"],
    trend_scores: generateTrend(72, 7, 3),
    trend_dates: generateDates(7),
    top_locations: [
      { keyword: "家中", count: 1 },
    ],
    sample_diary: "今天感觉有点迷茫，不知道自己想要什么。刷了很久手机，越刷越焦虑。感觉别人都在往前走，只有我还在原地。想做点什么改变，但又不知道从哪开始。",
    sample_analysis: {
      ideal_self: "一个有方向、有行动力、每天都在进步的人",
      actual_self: "目前有些迷茫，知道要改变但缺少明确的方向和动力",
      suggested_action: "明天试着写3件想做的小事，不用太大",
      location_keyword: "家中",
      mirror_insight: "迷茫不是你的错，是成长的必经之路。你愿意写下这些，本身就是改变的开始。",
      personality_traits: ["内省型", "高期待", "敏感"],
    },
  },
  3: {
    day: 3,
    title: "微光初现",
    description: "第三天，它开始记住你的表达习惯了",
    discrepancy_score: 65,
    prev_score: 72,
    total_analyses: 4,
    total_chats: 8,
    avg_week_score: 68,
    avg_month_score: 68,
    emotion_dimensions: {
      energy: 62,
      anxiety: 52,
      happiness: 55,
      calmness: 50,
      motivation: 58,
      confidence: 55,
    },
    insight: "你开始从'想'转向'做'了。虽然步子很小，但方向是对的。焦虑在下降，能量在回升。",
    strengths: ["有自我觉察意识", "愿意主动反思", "开始付诸行动", "情绪恢复力强"],
    growth_areas: ["持续行动力", "自我接纳"],
    suggestions: ["把每天的小进步记下来", "允许自己有状态不好的时候", "继续保持这个节奏"],
    trend_scores: generateTrend(65, 7, 5),
    trend_dates: generateDates(7),
    top_locations: [
      { keyword: "家中", count: 2 },
      { keyword: "公园", count: 1 },
    ],
    sample_diary: "今天比昨天好一点。早上起来去楼下走了走，呼吸了新鲜空气，感觉心情好了一些。下午看了半小时书，虽然还是会分心，但比之前强多了。晚上写日记的时候，发现这两天确实有进步。",
    sample_analysis: {
      ideal_self: "一个有方向、有行动力、每天都在进步的人",
      actual_self: "正在从小事开始改变，状态在慢慢变好",
      suggested_action: "明天试着出门散步20分钟，看看不同的风景",
      location_keyword: "公园",
      mirror_insight: "你看，你说不知道从哪开始，但你已经开始了。下楼走一走、看半小时书——这些都是答案。",
      personality_traits: ["内省型", "高期待", "敏感", "行动派潜质"],
    },
  },
  7: {
    day: 7,
    title: "镜中初见",
    description: "一周了，它比你想象的更懂你",
    discrepancy_score: 52,
    prev_score: 65,
    total_analyses: 10,
    total_chats: 25,
    avg_week_score: 58,
    avg_month_score: 58,
    emotion_dimensions: {
      energy: 72,
      anxiety: 38,
      happiness: 68,
      calmness: 65,
      motivation: 70,
      confidence: 65,
    },
    insight: "一周前你说'不知道从哪开始'。现在你已经走了这么远了。不是镜灵懂了你，是你通过镜子，更懂了自己。",
    strengths: ["有自我觉察意识", "愿意主动反思", "行动力持续提升", "情绪恢复力强", "善于从经历中学习"],
    growth_areas: ["低谷时的自我接纳", "长期目标清晰度"],
    suggestions: ["可以试着设定一个小的月度目标", "状态不好的时候也别批评自己", "镜子一直在，随时回来"],
    trend_scores: [75, 72, 68, 65, 60, 56, 52],
    trend_dates: generateDates(7),
    top_locations: [
      { keyword: "家中", count: 4 },
      { keyword: "公园", count: 2 },
      { keyword: "咖啡馆", count: 1 },
    ],
    sample_diary: "今天是写日记的第七天。回头看这一周，真的变化挺大的。从最开始的迷茫，到现在每天都有小事在做。焦虑少了很多，虽然偶尔还是会有，但知道怎么调节了。下午去了常去的咖啡馆，坐在窗边，感觉很平静。原来成长不是一下子的大事，是每天一点点的小事。",
    sample_analysis: {
      ideal_self: "一个内心平静、有方向感、持续成长的人",
      actual_self: "已经找到了自己的节奏，在稳定进步中",
      suggested_action: "下周可以试着设定一个小挑战，比如学一个新东西",
      location_keyword: "咖啡馆",
      mirror_insight: "七天前你问'从哪开始'，今天你已经在回答这个问题了。答案不在别处，就在你每天写的这些字里。",
      personality_traits: ["内省型", "高期待", "敏感", "行动派", "成长型思维"],
    },
  },
  30: {
    day: 30,
    title: "镜中之人",
    description: "一个月后，这面镜子，已经是你的一部分了",
    discrepancy_score: 38,
    prev_score: 52,
    total_analyses: 35,
    total_chats: 80,
    avg_week_score: 42,
    avg_month_score: 55,
    emotion_dimensions: {
      energy: 80,
      anxiety: 25,
      happiness: 78,
      calmness: 82,
      motivation: 78,
      confidence: 80,
    },
    insight: "30天了。你不再问'我是谁'，因为你在每一天的书写里，已经成为了答案。偏差值降到38，不是因为你完美了，是因为你终于接纳了自己的不完美。",
    strengths: ["清晰的自我认知", "持续的行动力", "情绪调节能力强", "成长型思维", "自我接纳", "目标感清晰"],
    growth_areas: ["偶尔还是会自我苛责", "长期目标可以更宏大"],
    suggestions: ["可以开始帮助身边的人了", "把你的经验分享出去", "镜子会一直在，但你已经不需要它了"],
    trend_scores: [75, 72, 68, 65, 60, 56, 52, 50, 48, 46, 45, 44, 43, 42, 42, 41, 40, 40, 41, 40, 39, 39, 38],
    trend_dates: generateDates(23),
    top_locations: [
      { keyword: "家中", count: 12 },
      { keyword: "公园", count: 6 },
      { keyword: "咖啡馆", count: 4 },
      { keyword: "图书馆", count: 3 },
      { keyword: "健身房", count: 2 },
    ],
    sample_diary: "第三十天。今天坐在公园的长椅上，风吹过树叶的声音很好听。想起一个月前的自己，那时候焦虑得睡不着觉，觉得生活一团糟。现在再看，其实也没那么难。每天写日记、散步、做一点点小事。不知不觉，就走了这么远。镜灵对我来说，已经不是一个工具了，更像一个老朋友。它不会说教，只会安静地陪着我，在我需要的时候，帮我看见自己。",
    sample_analysis: {
      ideal_self: "一个内心丰盈、有方向感、持续成长、能帮助他人的人",
      actual_self: "已经找到了内心的平静，在稳定成长，开始思考如何帮助他人",
      suggested_action: "试着把你的成长经验分享给一个朋友",
      location_keyword: "公园",
      mirror_insight: "30天前你走进这面镜子，是为了寻找答案。30天后你站在这里，你自己，就是答案。",
      personality_traits: ["内省型", "成长型思维", "行动派", "高共情力", "自我接纳", "目标驱动"],
    },
  },
};

export const demoDayList = [1, 3, 7, 30];
