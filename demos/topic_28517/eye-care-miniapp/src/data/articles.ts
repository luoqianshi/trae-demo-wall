export interface Article {
  id: string;
  title: string;
  description: string;
  cover: string;
  category: string;
  readTime: number;
  views: number;
  content: string;
}

export const articlesData: Article[] = [
  {
    id: '1',
    title: '科学用眼的20-20-20法则',
    description: '简单有效的护眼方法，让你远离眼疲劳',
    cover: 'https://picsum.photos/id/1015/750/400',
    category: '护眼技巧',
    readTime: 3,
    views: 1234,
    content: '20-20-20法则是一种简单有效的护眼方法：每使用电子屏幕20分钟，就要看向20英尺（约6米）远的地方，持续20秒。这个法则可以帮助缓解眼部疲劳，预防近视加深。'
  },
  {
    id: '2',
    title: '眼保健操的正确做法',
    description: '每天5分钟，轻松缓解眼部疲劳',
    cover: 'https://picsum.photos/id/1018/750/400',
    category: '眼保健操',
    readTime: 5,
    views: 987,
    content: '眼保健操是一种通过按摩眼部穴位来缓解眼部疲劳的方法。正确的做法包括：按揉太阳穴、轮刮眼眶、按揉睛明穴等。每天坚持5分钟，可以有效缓解眼部疲劳。'
  },
  {
    id: '3',
    title: '蓝光对眼睛的危害',
    description: '了解蓝光，保护眼睛健康',
    cover: 'https://picsum.photos/id/1036/750/400',
    category: '健康知识',
    readTime: 4,
    views: 2345,
    content: '蓝光是电子屏幕发出的一种高能可见光，长期暴露在蓝光下会导致眼部疲劳、干眼症，甚至增加黄斑病变的风险。建议使用防蓝光眼镜，减少蓝光对眼睛的伤害。'
  },
  {
    id: '4',
    title: '如何选择合适的眼药水',
    description: '眼药水不是随便滴的，选对很重要',
    cover: 'https://picsum.photos/id/1039/750/400',
    category: '护眼产品',
    readTime: 6,
    views: 876,
    content: '选择眼药水时要注意：1）选择不含防腐剂的眼药水；2）根据症状选择合适的眼药水；3）不要长期使用同一款眼药水；4）使用前要洗手，避免污染。'
  },
  {
    id: '5',
    title: '儿童护眼的注意事项',
    description: '保护孩子的眼睛，从现在开始',
    cover: 'https://picsum.photos/id/1044/750/400',
    category: '儿童护眼',
    readTime: 5,
    views: 1567,
    content: '儿童护眼的注意事项：1）控制电子屏幕使用时间；2）保持正确的读写姿势；3）保证充足的户外活动时间；4）定期进行眼部检查；5）均衡饮食，补充眼部营养。'
  },
  {
    id: '6',
    title: '办公室护眼小技巧',
    description: '上班族必看的护眼指南',
    cover: 'https://picsum.photos/id/1015/750/400',
    category: '办公护眼',
    readTime: 4,
    views: 2109,
    content: '办公室护眼小技巧：1）调整显示器高度和角度；2）保持适当的阅读距离；3）定期休息眼睛；4）保持室内光线充足；5）多眨眼，保持眼部湿润。'
  },
  {
    id: '7',
    title: '饮食与眼睛健康',
    description: '吃出好视力，这些食物对眼睛有益',
    cover: 'https://picsum.photos/id/1018/750/400',
    category: '饮食健康',
    readTime: 5,
    views: 1432,
    content: '对眼睛有益的食物包括：1）富含维生素A的食物（胡萝卜、菠菜）；2）富含维生素C的食物（柑橘、草莓）；3）富含维生素E的食物（坚果、鳄梨）；4）富含Omega-3的食物（鱼类）。'
  },
  {
    id: '8',
    title: '睡眠与眼睛健康',
    description: '充足睡眠是保护眼睛的重要因素',
    cover: 'https://picsum.photos/id/1036/750/400',
    category: '生活习惯',
    readTime: 3,
    views: 987,
    content: '充足睡眠对眼睛健康至关重要：1）睡眠不足会导致眼部疲劳；2）睡眠时眼睛得到充分休息；3）建议每天保持7-8小时的睡眠；4）保持规律的作息时间。'
  }
];