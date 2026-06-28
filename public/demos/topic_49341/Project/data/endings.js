window.endings = [
  {
    id: 'alone',
    title: '独自承受者',
    subtitle: '你的温柔，藏在倔强里',
    description: `你习惯了独自消化所有情绪，默默扛下迷茫和压力。这不是懦弱，只是你温柔的倔强。\n\n但请记得，那个曾经闪闪发光的自己从未消失，只是暂时迷路。不必事事硬扛，学会开口求助，也是一种勇敢。\n\n人生不是单行道，你随时可以回头，随时可以重新选择。那些说不出口的话，那些藏在心里的委屈，总有一天，你会愿意说给某个人听。`,
    color: '#9CA3AF',
    icon: '🌙'
  },
  {
    id: 'action',
    title: '行动者',
    subtitle: '每一步，都算数',
    description: `你勇敢打破了沉默，愿意开口求助、主动迈步。那些忐忑的尝试、笨拙的主动，都是你成长的证明。\n\n说出困境、拥抱帮助，你正在一点点把自己从内耗中拉出来。也许你还会害怕，还会犹豫，但你已经在路上了。\n\n勇敢不是从不害怕，而是害怕的时候，依然选择往前走。你做到了。`,
    color: '#60A5FA',
    icon: '🌟'
  },
  {
    id: 'planner',
    title: '规划者',
    subtitle: '慢慢来，比较快',
    description: `你学会了梳理混乱的情绪与难题，把无解的迷茫拆成可落地的小事。焦虑源于未知，而规划治愈一切。\n\n你不急于求成，也不轻易放弃。你知道成长是一场马拉松，不是百米冲刺。一步一步走，终会到达想去的地方。\n\n慢慢来，一步一步走，你终会追上自己的节奏。`,
    color: '#34D399',
    icon: '🌱'
  },
  {
    id: 'growth',
    title: '成长者',
    subtitle: '你是自己的光',
    description: `你完成了完整的自我救赎。从不敢开口到主动求助，从自我否定到接纳过往的高光。你没有一蹴而就的天赋，却有永不放弃的韧性。\n\n平凡的坚持，就是最耀眼的成长。\n\n你也许不是最聪明的那个，不是最幸运的那个，但你一定是最勇敢的那个。因为你在一次次跌倒后，还是选择了站起来，继续走。\n\n请记住这个时刻的自己。因为未来的某一天，当你回头看时，会发现，正是这些看似微不足道的选择，成就了后来闪闪发光的你。`,
    color: '#FB923C',
    icon: '🌅'
  }
];

window.calculateEnding = function(choices) {
  let positiveCount = 0;
  let braveCount = 0;
  let thinkerCount = 0;
  
  choices.forEach(choice => {
    if (choice.isPositive) positiveCount++;
    if (choice.isBrave) braveCount++;
    if (choice.isThinker) thinkerCount++;
  });
  
  const totalChoices = choices.length;
  
  if (positiveCount >= totalChoices * 0.8 && braveCount >= 2 && thinkerCount >= 2) {
    return 'growth';
  }
  
  if (braveCount >= 2) {
    return 'action';
  }
  
  if (thinkerCount >= 2) {
    return 'planner';
  }
  
  if (positiveCount <= totalChoices * 0.3) {
    return 'alone';
  }
  
  if (positiveCount >= totalChoices * 0.6) {
    return 'action';
  }
  
  return 'alone';
};

window.globalSupport = {
  title: '温馨提示',
  content: '本结局仅为模拟推演，不定义你的人生。人生永远有重来与选择的机会。',
  hotline: '12355',
  hotlineDesc: '青少年24小时服务热线',
  hotlineDetail: '若情绪低落，可拨打12355青少年24小时服务热线，永远有人愿意接住你的情绪。'
};
