const CHAPTERS = [
  {
    id: 1,
    title: '第一章：初春的暖意',
    subtitle: '咖啡馆重新开张的第一天',
    description: '你推开了那扇吱呀作响的木门，灰尘在午后的阳光里跳舞。第一位顾客即将推门而入...',
    unlockRequirement: null,
    characters: ['xiaolin', 'ajie', 'xiaoyu'],
    bgm: 'warm-afternoon',
    weather: 'sunny'
  },
  {
    id: 2,
    title: '第二章：雨季的低语',
    subtitle: '窗外的雨已经下了三天',
    description: '雨天会有躲雨的流浪猫和失恋的人。咖啡馆里的故事，在雨声中变得更加清晰...',
    unlockRequirement: { chapter: 1, minStories: 2 },
    characters: ['laoli', 'xiaomei', 'liayi'],
    bgm: 'rainy-evening',
    weather: 'rainy'
  },
  {
    id: 3,
    title: '第三章：深夜的灯火',
    subtitle: '凌晨时分的特别访客',
    description: '当城市的喧嚣归于平静，那些白天不敢面对的心事，在深夜的咖啡香中慢慢浮现...',
    unlockRequirement: { chapter: 2, minStories: 2 },
    characters: [],
    bgm: 'midnight-jazz',
    weather: 'night'
  }
];

const WEATHER_EFFECTS = {
  sunny: {
    name: '晴朗',
    emoji: '☀️',
    description: '阳光透过窗户洒进咖啡馆，一切都显得温暖而明亮',
    modifier: '顾客的心情会稍微好一些'
  },
  rainy: {
    name: '下雨',
    emoji: '🌧️',
    description: '雨声滴答，窗外的世界变得模糊而安静',
    modifier: '顾客更愿意倾诉心事'
  },
  night: {
    name: '深夜',
    emoji: '🌙',
    description: '月光柔和地照亮了咖啡馆的一角',
    modifier: '深夜的顾客有特别的故事'
  }
};
