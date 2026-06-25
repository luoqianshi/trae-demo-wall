import { Challenge } from '../types/challenge';

export const challengesData: Challenge[] = [
  {
    id: '1',
    level: 1,
    title: '护眼新手',
    description: '完成基础护眼任务，养成良好的用眼习惯',
    tasks: [
      {
        id: '1-1',
        title: '完成3次眼部休息',
        description: '每次休息至少1分钟',
        target: 3,
        current: 0,
        unit: '次',
        completed: false
      },
      {
        id: '1-2',
        title: '累计休息10分钟',
        description: '保护眼睛，从现在开始',
        target: 10,
        current: 0,
        unit: '分钟',
        completed: false
      }
    ],
    reward: {
      points: 100,
      badge: '护眼新手徽章'
    },
    status: 'current',
    progress: 0
  },
  {
    id: '2',
    level: 2,
    title: '护眼达人',
    description: '坚持护眼习惯，提升眼部健康',
    tasks: [
      {
        id: '2-1',
        title: '完成10次眼部休息',
        description: '每次休息至少2分钟',
        target: 10,
        current: 0,
        unit: '次',
        completed: false
      },
      {
        id: '2-2',
        title: '累计休息30分钟',
        description: '让眼睛得到充分休息',
        target: 30,
        current: 0,
        unit: '分钟',
        completed: false
      },
      {
        id: '2-3',
        title: '完成5次眼保健操',
        description: '通过眼保健操缓解眼部疲劳',
        target: 5,
        current: 0,
        unit: '次',
        completed: false
      }
    ],
    reward: {
      points: 300,
      badge: '护眼达人徽章'
    },
    status: 'locked',
    progress: 0
  },
  {
    id: '3',
    level: 3,
    title: '护眼专家',
    description: '成为护眼专家，影响身边更多人',
    tasks: [
      {
        id: '3-1',
        title: '连续7天完成护眼任务',
        description: '养成良好习惯，坚持就是胜利',
        target: 7,
        current: 0,
        unit: '天',
        completed: false
      },
      {
        id: '3-2',
        title: '累计休息100分钟',
        description: '为眼睛健康投资',
        target: 100,
        current: 0,
        unit: '分钟',
        completed: false
      },
      {
        id: '3-3',
        title: '学习10篇护眼知识',
        description: '了解更多护眼知识',
        target: 10,
        current: 0,
        unit: '篇',
        completed: false
      }
    ],
    reward: {
      points: 500,
      badge: '护眼专家徽章'
    },
    status: 'locked',
    progress: 0
  },
  {
    id: '4',
    level: 4,
    title: '护眼大师',
    description: '护眼大师，眼睛健康的守护者',
    tasks: [
      {
        id: '4-1',
        title: '连续30天完成护眼任务',
        description: '一个月的坚持，习惯成自然',
        target: 30,
        current: 0,
        unit: '天',
        completed: false
      },
      {
        id: '4-2',
        title: '累计休息300分钟',
        description: '长期坚持，效果显著',
        target: 300,
        current: 0,
        unit: '分钟',
        completed: false
      },
      {
        id: '4-3',
        title: '完成20次眼保健操',
        description: '专业护眼，从眼保健操开始',
        target: 20,
        current: 0,
        unit: '次',
        completed: false
      }
    ],
    reward: {
      points: 1000,
      badge: '护眼大师徽章'
    },
    status: 'locked',
    progress: 0
  },
  {
    id: '5',
    level: 5,
    title: '护眼传奇',
    description: '护眼传奇，眼睛健康的终极守护者',
    tasks: [
      {
        id: '5-1',
        title: '连续100天完成护眼任务',
        description: '百天坚持，护眼传奇',
        target: 100,
        current: 0,
        unit: '天',
        completed: false
      },
      {
        id: '5-2',
        title: '累计休息1000分钟',
        description: '为眼睛健康投入大量时间',
        target: 1000,
        current: 0,
        unit: '分钟',
        completed: false
      },
      {
        id: '5-3',
        title: '学习50篇护眼知识',
        description: '成为护眼知识专家',
        target: 50,
        current: 0,
        unit: '篇',
        completed: false
      }
    ],
    reward: {
      points: 2000,
      badge: '护眼传奇徽章'
    },
    status: 'locked',
    progress: 0
  }
];