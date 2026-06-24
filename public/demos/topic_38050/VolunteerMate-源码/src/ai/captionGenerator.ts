import { Task } from '../data/tasks';
import { UserStats } from '../store/useStore';

const GREETING_POOL: Record<string, string[]> = {
  morning: ['清晨', '一早', '美好的早晨', '阳光初上的时刻', '今日伊始'],
  afternoon: ['午后', '忙碌的午后', '充满活力的时刻', '骄阳之下', '日光正好的时分'],
  evening: ['傍晚', '温暖的傍晚', '暮色渐起的时刻', '黄昏时分', '一天即将结束'],
  night: ['深夜', '安静的夜晚', '月色温柔的时刻', '临睡之前', '万籁俱寂'],
};

const VERB_POOL: Record<string, string[]> = {
  '环保': ['守护了一方绿意', '为地球做了一次温柔的呼吸', '让环保成为日常', '践行了绿色生活方式', '为可持续贡献了一份力量'],
  '捐赠': ['让闲置物品重新发光', '让善意在物品之间流动', '把温暖打包送出', '分享了一份自己拥有的', '让价值传递下去'],
  '帮扶': ['点亮了一个陌生人的一天', '让陪伴成为最长情的告白', '送去了一份温柔的关怀', '让温暖在人与人之间流动', '成为了某个人的光'],
  '传播': ['让公益被更多人看见', '把善意的种子播撒出去', '让影响力变成爱的放大器', '分享了一份有温度的力量', '让希望在人群中传递'],
};

const REFLECTION_POOL: string[] = [
  '也许你今天的一点点善意，就是某个人一整天的光。',
  '公益不需要伟大，只需要真实。',
  '每一次微小的行动，都在悄悄改变世界。',
  '你不必做很多，只需多做一点点。',
  '善念如灯，点亮一盏少一盏暗。',
  '最温暖的礼物，是被认真对待。',
  '做公益的人，心里总有一片柔软的阳光。',
  '温柔本身就是一种力量。',
];

const HASHTAG_POOL: string[] = [
  '#公益随手做',
  '#日行一善',
  '#志愿服务',
  '#温暖城市',
  '#绿色生活',
  '#社区共建',
  '#爱的传递',
  '#AI公益助手',
  '#让世界更美好',
];

const getRandomItem = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];
const pickN = <T>(arr: T[], n: number): T[] => {
  const copy = [...arr];
  const out: T[] = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  return out;
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
};

export interface GeneratedCaption {
  short: string;
  full: string;
  hashtags: string[];
  vibe: string;
}

export const generateCaption = (task: Task, stats: UserStats, variant: number = 0): GeneratedCaption => {
  const timeKey = getTimeGreeting();
  const timeWords = GREETING_POOL[timeKey];
  const verbs = VERB_POOL[task.category] || VERB_POOL['环保'];
  const reflection = REFLECTION_POOL[(variant + stats.totalCheckIns) % REFLECTION_POOL.length];
  const today = new Date();
  const dateStr = `${today.getMonth() + 1}月${today.getDate()}日`;

  const timeWord = getRandomItem(timeWords);
  const verb = getRandomItem(verbs);

  const variants: string[] = [
    `${timeWord}完成了「${task.name}」，我${verb}。${reflection}`,
    `今天在 VolunteerMate 上打卡了「${task.name}」。${task.description}，只需${task.duration}分钟，你也可以。`,
    `${dateStr} · 公益打卡第 ${stats.totalCheckIns + 1} 次\n\n完成「${task.name}」\n${task.description}\n\n${reflection}`,
    `${task.duration}分钟，也能做一件${task.category}好事。\n\n今日任务：${task.name}\n推荐给想尝试公益但没时间的你。`,
  ];

  const shortVariants: string[] = [
    `今天做了件${task.category}事：${task.name}。${reflection}`,
    `${task.duration}分钟，一次${task.category}打卡。✨`,
    `「${task.name}」已完成，又一份小小的善意。`,
  ];

  const hashtags = pickN(HASHTAG_POOL, 4);

  const vibes = ['温柔', '力量', '正能量', '治愈', '行动派'];

  return {
    short: shortVariants[variant % shortVariants.length],
    full: variants[variant % variants.length],
    hashtags,
    vibe: vibes[variant % vibes.length],
  };
};

export const generateWeeklySummary = (stats: UserStats): string => {
  const lines = [
    `本周累计投入 ${stats.weekMinutes} 分钟公益时间`,
    `完成 ${stats.totalCheckIns} 次打卡，连续 ${stats.currentStreak} 天在行动`,
    stats.environmentalTasks > 0 ? `在环保领域贡献 ${stats.environmentalTasks} 次` : '',
    stats.donationTasks > 0 ? `完成 ${stats.donationTasks} 次捐赠/分享` : '',
    stats.helpTasks > 0 ? `参与 ${stats.helpTasks} 次帮扶行动` : '',
    stats.spreadTasks > 0 ? `让公益被看见 ${stats.spreadTasks} 次` : '',
  ].filter(Boolean);
  return lines.join('，') + '。继续加油！';
};
