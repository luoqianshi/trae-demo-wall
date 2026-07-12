import { InterestTag } from '../types';

export const interestTags: InterestTag[] = [
  // 运动户外
  { id: 't1', name: '摩托车', icon: '🏍️', category: '运动户外' },
  { id: 't2', name: '骑行', icon: '🚴', category: '运动户外' },
  { id: 't3', name: '跑步', icon: '🏃', category: '运动户外' },
  { id: 't4', name: '健身', icon: '💪', category: '运动户外' },
  { id: 't5', name: '篮球', icon: '🏀', category: '运动户外' },
  { id: 't6', name: '足球', icon: '⚽', category: '运动户外' },
  { id: 't7', name: '游泳', icon: '🏊', category: '运动户外' },
  { id: 't8', name: '瑜伽', icon: '🧘', category: '运动户外' },
  { id: 't9', name: '登山', icon: '🧗', category: '运动户外' },
  { id: 't10', name: '滑雪', icon: '⛷️', category: '运动户外' },

  // 休闲娱乐
  { id: 't11', name: '麻将', icon: '🀄', category: '休闲娱乐' },
  { id: 't12', name: '桌游', icon: '🎲', category: '休闲娱乐' },
  { id: 't13', name: 'K歌', icon: '🎤', category: '休闲娱乐' },
  { id: 't14', name: '跳舞', icon: '💃', category: '休闲娱乐' },
  { id: 't15', name: '钓鱼', icon: '🎣', category: '休闲娱乐' },
  { id: 't16', name: '露营', icon: '⛺', category: '休闲娱乐' },

  // 文化艺术
  { id: 't17', name: '读书', icon: '📚', category: '文化艺术' },
  { id: 't18', name: '电影', icon: '🎬', category: '文化艺术' },
  { id: 't19', name: '摄影', icon: '📷', category: '文化艺术' },
  { id: 't20', name: '绘画', icon: '🎨', category: '文化艺术' },
  { id: 't21', name: '音乐', icon: '🎵', category: '文化艺术' },
  { id: 't22', name: '书法', icon: '✒️', category: '文化艺术' },
  { id: 't23', name: '旅行', icon: '✈️', category: '文化艺术' },

  // 美食生活
  { id: 't24', name: '美食', icon: '🍜', category: '美食生活' },
  { id: 't25', name: '烹饪', icon: '🍳', category: '美食生活' },
  { id: 't26', name: '咖啡', icon: '☕', category: '美食生活' },
  { id: 't27', name: '烘焙', icon: '🧁', category: '美食生活' },
  { id: 't28', name: '宠物', icon: '🐱', category: '美食生活' },
  { id: 't29', name: '园艺', icon: '🌱', category: '美食生活' },

  // 科技数码
  { id: 't30', name: '游戏', icon: '🎮', category: '科技数码' },
  { id: 't31', name: '编程', icon: '💻', category: '科技数码' },
  { id: 't32', name: '动漫', icon: '🎭', category: '科技数码' },
  { id: 't33', name: 'AI科技', icon: '🤖', category: '科技数码' },
];

export const interestTagMap = new Map<string, InterestTag>(
  interestTags.map((t) => [t.id, t])
);

export const categories = [...new Set(interestTags.map((t) => t.category))];
