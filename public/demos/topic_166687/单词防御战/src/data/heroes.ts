import { Hero } from '@/types';

export const heroes: Hero[] = [
  {
    id: 'h1',
    name: '火焰战士',
    emoji: '🔥',
    skill: '火焰喷射',
    damage: 20,
    range: 2,
    cost: 1,
    element: 'fire',
    color: '#F97316',
    description: '发射火焰攻击敌人，范围伤害',
  },
  {
    id: 'h2',
    name: '冰霜法师',
    emoji: '❄️',
    skill: '寒冰冻结',
    damage: 15,
    range: 3,
    cost: 1,
    element: 'water',
    color: '#3B82F6',
    description: '远程攻击，减缓敌人速度',
  },
  {
    id: 'h3',
    name: '大地守护者',
    emoji: '🌍',
    skill: '岩石护盾',
    damage: 10,
    range: 1,
    cost: 1,
    element: 'earth',
    color: '#84CC16',
    description: '防御力强，近战攻击',
  },
  {
    id: 'h4',
    name: '风暴使者',
    emoji: '💨',
    skill: '闪电链',
    damage: 25,
    range: 4,
    cost: 2,
    element: 'wind',
    color: '#8B5CF6',
    description: '高伤害，可攻击多个敌人',
  },
  {
    id: 'h5',
    name: '光明天使',
    emoji: '✨',
    skill: '神圣治愈',
    damage: 18,
    range: 2,
    cost: 2,
    element: 'light',
    color: '#EAB308',
    description: '攻击同时恢复基地生命',
  },
  {
    id: 'h6',
    name: '暗影刺客',
    emoji: '🌑',
    skill: '致命一击',
    damage: 40,
    range: 1,
    cost: 3,
    element: 'dark',
    color: '#EC4899',
    description: '超高伤害，秒杀敌人',
  },
];

export const getHeroById = (id: string): Hero | undefined => {
  return heroes.find(h => h.id === id);
};

export const getHeroesByCost = (maxCost: number): Hero[] => {
  return heroes.filter(h => h.cost <= maxCost);
};

export const getInitialUnlockedHeroes = (): string[] => {
  return ['h1', 'h2', 'h3'];
};
