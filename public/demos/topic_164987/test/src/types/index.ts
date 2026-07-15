export type Personality = 'gentle' | 'strict' | 'playful';

export interface Partner {
  id: string;
  name: string;
  personality: Personality;
  nickname: string;
  avatarUrl: string;
}

export interface FlashCard {
  id: string;
  front: string;
  back: string;
  mastered: boolean;
  createdAt: Date;
}

export interface PomodoroSession {
  id: string;
  duration: number;
  completed: boolean;
  startTime: Date;
  endTime?: Date;
}

export interface AppState {
  partner: Partner | null;
  cards: FlashCard[];
  pomodoroSessions: PomodoroSession[];
  currentPomodoroDuration: number;
  notificationEnabled: boolean;
  
  setPartner: (partner: Partner) => void;
  updatePartner: (updates: Partial<Partner>) => void;
  
  addCard: (card: FlashCard) => void;
  addCards: (cards: FlashCard[]) => void;
  toggleMastered: (id: string) => void;
  clearCards: () => void;
  
  addPomodoroSession: (session: PomodoroSession) => void;
  updatePomodoroSession: (id: string, updates: Partial<PomodoroSession>) => void;
  
  setPomodoroDuration: (duration: number) => void;
  toggleNotifications: () => void;
}

export const PERSONALITY_CONFIG: Record<Personality, {
  greeting: string[];
  encouragement: string[];
  focusTips: string[];
  completion: string[];
}> = {
  gentle: {
    greeting: ['开始今天的学习之旅吧！', '准备好了吗？我陪你一起', '慢慢来，我们一起加油', '今天也要温柔地学习哦'],
    encouragement: ['做得很棒！继续保持', '你已经很努力了', '休息一下，别太累了', '慢慢来，不着急'],
    focusTips: ['试试深呼吸三次', '闭上眼睛，想象目标', '喝杯水，放松一下', '先做五分钟，就五分钟'],
    completion: ['太棒了！你做到了', '今天也辛苦了', '为你感到骄傲', '明天继续加油哦'],
  },
  strict: {
    greeting: ['开始学习！别浪费时间', '准备好了就开始', '今天的任务完成了吗？', '专心点，别走神'],
    encouragement: ['还不错，但可以更好', '继续！别停下来', '效率还可以提高', '这才对，保持专注'],
    focusTips: ['立刻回到任务上！', '别磨蹭，时间宝贵', '集中注意力，现在！', '想想你的目标是什么'],
    completion: ['总算完成了', '下次争取更快', '这是基本操作', '继续保持这个节奏'],
  },
  playful: {
    greeting: ['嗨！今天也要元气满满哦～', '学习时间到！冲鸭！', '让我们开始吧，加油加油！', '今天也要开开心心学习'],
    encouragement: ['哇！你好厉害！', '超级棒！继续冲！', '太牛了！给你点赞！', '冲冲冲！你是最棒的！'],
    focusTips: ['来个小舞蹈放松一下～', '喝口水，我们继续！', '休息10秒，马上回来！', '想想完成后的奖励！'],
    completion: ['耶！完成啦！', '太棒了！奖励自己一下！', '你是学习小超人！', '今天也是超棒的一天！'],
  },
};

export const PERSONALITY_LABELS: Record<Personality, string> = {
  gentle: '温柔治愈型',
  strict: '严格监督型',
  playful: '活泼俏皮型',
};
