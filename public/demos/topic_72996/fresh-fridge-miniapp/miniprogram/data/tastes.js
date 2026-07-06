const tastes = [
  {
    id: 'sweet',
    name: '甜味',
    emoji: '🍬',
    color: '#FF4081',
    description: '喜欢甜食，如糖果、蛋糕、水果等',
    suitableFoods: ['苹果', '香蕉', '草莓', '蜂蜜', '白糖', '蛋糕', '冰淇淋', '巧克力']
  },
  {
    id: 'sour',
    name: '酸味',
    emoji: '🍋',
    color: '#FF9800',
    description: '喜欢酸味食物，如柠檬、醋、泡菜等',
    suitableFoods: ['柠檬', '醋', '泡菜', '杨梅', '李子', '酸奶', '山楂', '葡萄']
  },
  {
    id: 'salty',
    name: '咸味',
    emoji: '🧂',
    color: '#795548',
    description: '喜欢咸味食物，如咸菜、腊肉、海鲜等',
    suitableFoods: ['咸菜', '腊肉', '咸鱼', '海带', '紫菜', '豆腐乳', '咸鸭蛋']
  },
  {
    id: 'spicy',
    name: '辣味',
    emoji: '🌶️',
    color: '#F44336',
    description: '喜欢辣味食物，如辣椒、花椒、火锅等',
    suitableFoods: ['辣椒', '花椒', '火锅底料', '辣酱', '生姜', '大蒜', '洋葱']
  },
  {
    id: 'bitter',
    name: '苦味',
    emoji: '🍀',
    color: '#4CAF50',
    description: '喜欢苦味食物，如苦瓜、咖啡、茶叶等',
    suitableFoods: ['苦瓜', '咖啡', '茶叶', '莲子心', '蒲公英', '苦菜', '芥蓝']
  },
  {
    id: 'umami',
    name: '鲜味',
    emoji: '🍤',
    color: '#00BCD4',
    description: '喜欢鲜味食物，如海鲜、菌菇、鸡汤等',
    suitableFoods: ['海鲜', '菌菇', '鸡汤', '鱼汤', '蚝油', '味精', '鸡精']
  },
  {
    id: 'sweet_sour',
    name: '酸甜',
    emoji: '🍯',
    color: '#FFC107',
    description: '喜欢酸甜口味，如糖醋排骨、番茄炒蛋等',
    suitableFoods: ['番茄', '菠萝', '山楂', '番茄酱', '糖醋汁', '橙汁', '苹果醋']
  },
  {
    id: 'spicy_sour',
    name: '酸辣',
    emoji: '🥵',
    color: '#E91E63',
    description: '喜欢酸辣口味，如酸辣粉、酸菜鱼等',
    suitableFoods: ['酸辣粉', '酸菜鱼', '酸辣汤', '泡菜', '泡椒', '酸豆角']
  },
  {
    id: 'salty_fresh',
    name: '咸鲜',
    emoji: '🥘',
    color: '#607D8B',
    description: '喜欢咸鲜口味，如红烧肉、清蒸鱼等',
    suitableFoods: ['酱油', '盐', '味精', '海鲜', '肉类', '菌菇', '豆腐']
  },
  {
    id: 'light',
    name: '清淡',
    emoji: '🥬',
    color: '#8BC34A',
    description: '喜欢清淡口味，少油少盐，保持食材原味',
    suitableFoods: ['蔬菜', '豆腐', '鸡蛋', '清汤', '清蒸鱼', '白灼虾', '粥']
  },
  {
    id: 'rich',
    name: '浓郁',
    emoji: '🍲',
    color: '#795548',
    description: '喜欢浓郁口味，如红烧、咖喱、奶油等',
    suitableFoods: ['红烧肉', '咖喱', '奶油', '芝士', '黄油', '浓汤', '酱肉']
  },
  {
    id: 'fragrant',
    name: '清香',
    emoji: '🌸',
    color: '#E1BEE7',
    description: '喜欢清香口味，如薄荷、柠檬草、茉莉花等',
    suitableFoods: ['薄荷', '柠檬草', '茉莉花', '绿茶', '桂花', '香菜', '葱']
  }
]

const getAllTastes = () => {
  return tastes
}

const getTasteById = (id) => {
  return tastes.find(t => t.id === id)
}

const getTasteByName = (name) => {
  return tastes.find(t => t.name === name)
}

const getTasteColors = () => {
  return tastes.map(t => ({ id: t.id, color: t.color, name: t.name }))
}

const getTasteEmojis = () => {
  return tastes.map(t => ({ id: t.id, emoji: t.emoji, name: t.name }))
}

const getRecommendedFoodsByTastes = (tasteIds) => {
  const recommended = []
  tasteIds.forEach(id => {
    const taste = getTasteById(id)
    if (taste) {
      recommended.push(...taste.suitableFoods)
    }
  })
  return [...new Set(recommended)]
}

const searchTastes = (keyword) => {
  return tastes.filter(t => 
    t.name.toLowerCase().includes(keyword.toLowerCase()) ||
    t.description.toLowerCase().includes(keyword.toLowerCase())
  )
}

module.exports = {
  tastes,
  getAllTastes,
  getTasteById,
  getTasteByName,
  getTasteColors,
  getTasteEmojis,
  getRecommendedFoodsByTastes,
  searchTastes
}