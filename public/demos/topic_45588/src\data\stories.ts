import { CatStory } from '@/types';

export const initialStories: CatStory[] = [
  {
    id: '1',
    catName: '小白',
    catFeatures: '白色英短，蓝色眼睛',
    lostTime: '2024-01-15',
    lostLocation: '朝阳区望京街道',
    foundTime: '2024-01-16',
    foundLocation: '楼下绿化带',
    distance: 200,
    story: '在楼下的灌木丛里找到的，它吓得不敢出来，用猫粮逗了半天才出来。',
    createdAt: '2024-01-16'
  },
  {
    id: '2',
    catName: '豆豆',
    catFeatures: '橘猫，左耳有缺口',
    lostTime: '2024-02-20',
    lostLocation: '家门口',
    foundTime: '2024-02-21',
    foundLocation: '楼下绿化带',
    distance: 150,
    story: '在小区绿化带里找到的，它躲在树丛里发抖。',
    createdAt: '2024-02-21'
  },
  {
    id: '3',
    catName: '小橘',
    catFeatures: '橘猫，胖胖的',
    lostTime: '2024-03-10',
    lostLocation: '小区门口',
    foundTime: '2024-03-11',
    foundLocation: '附近停车场',
    distance: 300,
    story: '在停车场的车底下找到了它，用了一整夜的时间。',
    createdAt: '2024-03-11'
  },
  {
    id: '4',
    catName: '汤米',
    catFeatures: '狸花猫，尾巴很长',
    lostTime: '2024-04-05',
    lostLocation: '江苏省南京市浦口区',
    foundTime: '2024-04-07',
    foundLocation: '负二层地下室',
    distance: 500,
    story: '找了两天，最后在地下室的角落里发现了它。',
    createdAt: '2024-04-07'
  }
];
