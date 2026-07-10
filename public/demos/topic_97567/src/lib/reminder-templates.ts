// 提醒文本模板 - 分层提醒策略

export type ReminderType = 'daily' | 'caring' | 'welcome_back' | 'milestone';

export const REMINDER_TEMPLATES: Record<ReminderType, string[]> = {
  daily: [
    '今天过得怎么样？雪球在这里等你 🤍',
    '有没有一个瞬间让你觉得还不错？❄️',
    '雪球想你了，来记录今天的小成功吧 ✨',
  ],
  caring: [
    '这几天没见到你，希望你一切都好。想记录的时候，随时都在 🌙',
    '雪球一直在等你，不用有压力，想记就记 🤍',
    '好久不见！今天有什么想分享的吗？雪球在听 👂',
  ],
  welcome_back: [
    '雪球想你了！快来看看它长多大了 🎈',
    '欢迎回来！你的雪球一直在等你 🤗',
    '好久不见！雪球已经迫不及待想听你的故事了 ❄️',
  ],
  milestone: [
    '再记录1条就能解锁新成就！加油 🏆',
    '离下一个里程碑只差一点点了！✨',
    '你的雪球马上就要进化了！快来记录 🌟',
  ],
};

export function getReminderText(type: ReminderType): string {
  const templates = REMINDER_TEMPLATES[type];
  return templates[Math.floor(Math.random() * templates.length)];
}
