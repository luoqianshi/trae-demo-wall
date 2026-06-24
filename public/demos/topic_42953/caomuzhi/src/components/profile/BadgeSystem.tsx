import { Leaf, Award, Star, Crown, Sparkles, TreePine } from 'lucide-react';
import { useStore } from '@/store/useStore';

const badges = [
  {
    id: 'first',
    name: '初识草木',
    description: '完成第一次植物识别',
    icon: Leaf,
    color: 'bg-plant-green',
    unlocked: true
  },
  {
    id: 'collector_10',
    name: '小小收藏家',
    description: '收藏10种草木',
    icon: Star,
    color: 'bg-accent-amber',
    unlocked: false
  },
  {
    id: 'collector_50',
    name: '植物达人',
    description: '收藏50种草木',
    icon: Award,
    color: 'bg-plant-medium',
    unlocked: false
  },
  {
    id: 'collector_100',
    name: '草木大师',
    description: '收藏100种草木',
    icon: Crown,
    color: 'bg-emphasis-coral',
    unlocked: false
  },
  {
    id: 'identifier_10',
    name: '识别新手',
    description: '完成10次识别',
    icon: Sparkles,
    color: 'bg-plant-sage',
    unlocked: false
  },
  {
    id: 'identifier_100',
    name: '识别专家',
    description: '完成100次识别',
    icon: TreePine,
    color: 'bg-plant-dark',
    unlocked: false
  }
];

const BadgeSystem = () => {
  const { collections, history } = useStore();

  const getUnlockedBadges = () => {
    return badges.map((badge) => {
      let unlocked = badge.unlocked;

      switch (badge.id) {
        case 'collector_10':
          unlocked = collections.length >= 10;
          break;
        case 'collector_50':
          unlocked = collections.length >= 50;
          break;
        case 'collector_100':
          unlocked = collections.length >= 100;
          break;
        case 'identifier_10':
          unlocked = history.length >= 10;
          break;
        case 'identifier_100':
          unlocked = history.length >= 100;
          break;
      }

      return { ...badge, unlocked };
    });
  };

  const unlockedBadges = getUnlockedBadges();

  return (
    <div className="glass rounded-card p-6">
      <h3 className="text-xl font-bold text-text-dark mb-4">徽章系统</h3>
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {unlockedBadges.map((badge) => (
          <div
            key={badge.id}
            className={`p-4 rounded-card text-center transition-all duration-300 ${
              badge.unlocked
                ? 'bg-white hover:shadow-md'
                : 'bg-gray-100 opacity-60'
            }`}
          >
            <div
              className={`w-16 h-16 mx-auto mb-3 rounded-full ${badge.color} flex items-center justify-center ${
                badge.unlocked ? 'animate-bounce-once' : 'grayscale'
              }`}
            >
              <badge.icon className="w-8 h-8 text-white" />
            </div>
            <h4 className="font-semibold text-text-dark mb-1">{badge.name}</h4>
            <p className="text-xs text-text-medium">{badge.description}</p>
            {!badge.unlocked && (
              <div className="mt-2 text-xs text-text-light">
                {badge.id.startsWith('collector')
                  ? `${collections.length}/100`
                  : `${history.length}/100`}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default BadgeSystem;
