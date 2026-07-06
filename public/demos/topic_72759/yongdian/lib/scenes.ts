import { SceneConfig } from './types';

/**
 * 六大场景配置
 * 对应 SceneType: health | social | parenting | career | season | wisdom
 */
export const scenes: SceneConfig[] = [
  {
    type: 'health',
    name: '养生问道',
    icon: '🍵',
    description: '以中医经典为本，调和身心，顺应四时',
    examples: [
      '最近总是失眠多梦，古人有什么助眠的方法？',
      '夏天湿气重，该怎么饮食调理？',
      '如何根据体质选择适合自己的运动方式？',
    ],
    color: '#5C8D89',
  },
  {
    type: 'social',
    name: '人际往来',
    icon: '🤝',
    description: '以礼待人，以诚交友，处好人生百态',
    examples: [
      '同事总把工作推给我，该怎么优雅拒绝？',
      '和好朋友发生了矛盾，该如何化解？',
      '如何在社交场合既不讨好也不冷场？',
    ],
    color: '#8B7355',
  },
  {
    type: 'parenting',
    name: '教子有方',
    icon: '📖',
    description: '汲取古人教子智慧，因材施教不焦虑',
    examples: [
      '孩子沉迷手机不爱学习，怎么办？',
      '如何培养孩子的自律品格？',
      '孩子性格内向，该不该逼他社交？',
    ],
    color: '#C8442A',
  },
  {
    type: 'career',
    name: '职场进退',
    icon: '⚖️',
    description: '审时度势，知进知退，处好职场之道',
    examples: [
      '想跳槽又怕风险，该如何抉择？',
      '领导不认可我的工作，该怎么沟通？',
      '刚升职管理团队，有什么智慧可以借鉴？',
    ],
    color: '#2C2C2C',
  },
  {
    type: 'season',
    name: '四时雅趣',
    icon: '🌸',
    description: '顺应节气，品味古人四时生活美学',
    examples: [
      '大暑时节，古人怎么消暑度夏？',
      '秋天适合做什么有仪式感的事？',
      '冬至除了吃饺子，还有什么传统？',
    ],
    color: '#5C8D89',
  },
  {
    type: 'wisdom',
    name: '处世明心',
    icon: '🏮',
    description: '困惑迷茫时，借古哲之光照亮前路',
    examples: [
      '最近感觉很焦虑迷茫，古人怎么调心？',
      '三十岁一事无成，该如何面对？',
      '如何在这个快节奏时代保持内心的平静？',
    ],
    color: '#8B7355',
  },
];
