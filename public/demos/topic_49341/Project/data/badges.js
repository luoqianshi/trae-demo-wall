window.badges = [
  {
    id: 'brave',
    name: '勇敢者',
    description: '首次选择主动求助',
    icon: '🌟',
    color: '#60A5FA',
    condition: function(choices) {
      return choices.some(c => c.isBrave);
    }
  },
  {
    id: 'thinker',
    name: '思考者',
    description: '选择规划与梳理',
    icon: '💡',
    color: '#34D399',
    condition: function(choices) {
      return choices.some(c => c.isThinker);
    }
  },
  {
    id: 'persistent',
    name: '坚持者',
    description: '通关全部三幕',
    icon: '🏅',
    color: '#FBBF24',
    condition: function(choices, completed) {
      return completed;
    }
  },
  {
    id: 'growth',
    name: '成长者',
    description: '多数选择正向成长',
    icon: '🌅',
    color: '#FB923C',
    condition: function(choices) {
      const positiveCount = choices.filter(c => c.isPositive).length;
      return positiveCount >= choices.length * 0.7;
    }
  }
];

window.calculateBadges = function(choices, completed = true) {
  return window.badges.filter(badge => badge.condition(choices, completed));
};
