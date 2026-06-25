import { Achievement } from '../types/challenge';

export const achievementsData: Achievement[] = [
  {
    id: 'first-rest',
    title: '初次休息',
    description: '完成第一次眼部休息',
    icon: '🎯',
    unlocked: false
  },
  {
    id: 'three-day-streak',
    title: '三天坚持',
    description: '连续3天完成护眼任务',
    icon: '🔥',
    unlocked: false
  },
  {
    id: 'week-warrior',
    title: '周冠军',
    description: '连续7天完成护眼任务',
    icon: '🏆',
    unlocked: false
  },
  {
    id: 'knowledge-seeker',
    title: '知识探索者',
    description: '学习10篇护眼知识',
    icon: '📚',
    unlocked: false
  },
  {
    id: 'exercise-master',
    title: '运动达人',
    description: '完成20次眼保健操',
    icon: '💪',
    unlocked: false
  },
  {
    id: 'time-investor',
    title: '时间投资者',
    description: '累计休息100分钟',
    icon: '⏰',
    unlocked: false
  },
  {
    id: 'morning-person',
    title: '早起鸟',
    description: '在早上8点前完成护眼任务',
    icon: '🌅',
    unlocked: false
  },
  {
    id: 'night-owl',
    title: '夜猫子',
    description: '在晚上10点后完成护眼任务',
    icon: '🦉',
    unlocked: false
  }
];