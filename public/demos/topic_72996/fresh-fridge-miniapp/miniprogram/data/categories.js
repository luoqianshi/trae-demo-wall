const categories = [
  {
    id: 'vegetable',
    name: '蔬菜',
    icon: '🥬',
    color: '#4CAF50',
    children: [
      { id: 'leafy', name: '叶菜类', examples: ['菠菜', '生菜', '小白菜', '油麦菜', '芹菜'] },
      { id: 'root', name: '根茎类', examples: ['胡萝卜', '土豆', '红薯', '山药', '莲藕'] },
      { id: 'melon', name: '瓜果类', examples: ['黄瓜', '西红柿', '茄子', '青椒', '冬瓜'] },
      { id: 'mushroom', name: '菌菇类', examples: ['香菇', '金针菇', '杏鲍菇', '木耳', '银耳'] }
    ]
  },
  {
    id: 'fruit',
    name: '水果',
    icon: '🍎',
    color: '#FF5252',
    children: [
      { id: 'apple', name: '苹果类', examples: ['苹果', '梨', '桃子', '李子', '樱桃'] },
      { id: 'citrus', name: '柑橘类', examples: ['橙子', '橘子', '柚子', '柠檬', '葡萄柚'] },
      { id: 'berry', name: '浆果类', examples: ['草莓', '蓝莓', '桑葚', '树莓', '石榴'] },
      { id: 'tropical', name: '热带水果', examples: ['香蕉', '芒果', '菠萝', '榴莲', '椰子'] },
      { id: 'melon_fruit', name: '瓜果类', examples: ['西瓜', '哈密瓜', '甜瓜', '香瓜'] }
    ]
  },
  {
    id: 'meat',
    name: '肉类',
    icon: '🥩',
    color: '#E91E63',
    children: [
      { id: 'pork', name: '猪肉', examples: ['五花肉', '排骨', '瘦肉', '猪蹄', '猪肝'] },
      { id: 'beef', name: '牛肉', examples: ['牛腩', '牛排', '牛腱子', '肥牛', '牛舌'] },
      { id: 'lamb', name: '羊肉', examples: ['羊排', '羊肉卷', '羊腿', '羊肉串'] },
      { id: 'poultry', name: '禽类', examples: ['鸡肉', '鸭肉', '鹅肉', '鸡翅', '鸡腿'] }
    ]
  },
  {
    id: 'seafood',
    name: '海鲜',
    icon: '🦐',
    color: '#00BCD4',
    children: [
      { id: 'fish', name: '鱼类', examples: ['草鱼', '鲈鱼', '三文鱼', '鳕鱼', '带鱼'] },
      { id: 'shrimp', name: '虾类', examples: ['基围虾', '小龙虾', '皮皮虾', '虾仁'] },
      { id: 'crab', name: '蟹类', examples: ['大闸蟹', '梭子蟹', '青蟹', '帝王蟹'] },
      { id: 'shellfish', name: '贝类', examples: ['生蚝', '扇贝', '蛤蜊', '鲍鱼', '海螺'] }
    ]
  },
  {
    id: 'dairy',
    name: '蛋奶',
    icon: '🥛',
    color: '#FFC107',
    children: [
      { id: 'milk', name: '奶类', examples: ['牛奶', '酸奶', '鲜奶', '羊奶', '骆驼奶'] },
      { id: 'cheese', name: '奶酪黄油', examples: ['芝士', '黄油', '奶油', '炼乳'] },
      { id: 'egg', name: '蛋类', examples: ['鸡蛋', '鸭蛋', '鹅蛋', '鹌鹑蛋', '皮蛋'] }
    ]
  },
  {
    id: 'grain',
    name: '粮油',
    icon: '🌾',
    color: '#795548',
    children: [
      { id: 'rice', name: '米面类', examples: ['大米', '小米', '糯米', '面粉', '挂面'] },
      { id: 'oil', name: '油脂类', examples: ['花生油', '大豆油', '菜籽油', '橄榄油', '香油'] },
      { id: 'bean', name: '豆类', examples: ['黄豆', '绿豆', '红豆', '黑豆', '扁豆'] },
      { id: 'noodle', name: '制品类', examples: ['豆腐', '豆浆', '腐竹', '粉条', '年糕'] }
    ]
  },
  {
    id: 'snack',
    name: '零食',
    icon: '🍪',
    color: '#FF9800',
    children: [
      { id: 'biscuit', name: '饼干糕点', examples: ['饼干', '蛋糕', '面包', '月饼', '糕点'] },
      { id: 'candy', name: '糖果巧克力', examples: ['糖果', '巧克力', '果冻', '棒棒糖'] },
      { id: 'nuts', name: '坚果干果', examples: ['核桃', '杏仁', '花生', '瓜子', '葡萄干'] },
      { id: 'instant', name: '膨化食品', examples: ['薯片', '方便面', '辣条', '爆米花'] }
    ]
  },
  {
    id: 'drink',
    name: '饮品',
    icon: '🥤',
    color: '#2196F3',
    children: [
      { id: 'water', name: '水类', examples: ['矿泉水', '纯净水', '苏打水', '气泡水'] },
      { id: 'juice', name: '果汁', examples: ['橙汁', '苹果汁', '葡萄汁', '西瓜汁'] },
      { id: 'tea', name: '茶类', examples: ['绿茶', '红茶', '乌龙茶', '花茶', '奶茶'] },
      { id: 'coffee', name: '咖啡', examples: ['黑咖啡', '拿铁', '美式', '速溶咖啡'] },
      { id: 'alcohol', name: '酒类', examples: ['白酒', '啤酒', '红酒', '黄酒', '米酒'] }
    ]
  },
  {
    id: 'seasoning',
    name: '调味',
    icon: '🧂',
    color: '#9E9E9E',
    children: [
      { id: 'salt', name: '盐糖酱醋', examples: ['食盐', '白糖', '酱油', '醋', '料酒'] },
      { id: 'spice', name: '香料', examples: ['花椒', '八角', '桂皮', '香叶', '辣椒'] },
      { id: 'sauce', name: '酱料', examples: ['豆瓣酱', '番茄酱', '沙拉酱', '蚝油'] },
      { id: 'condiment', name: '调味品', examples: ['味精', '鸡精', '胡椒粉', '孜然粉'] }
    ]
  },
  {
    id: 'frozen',
    name: '冷冻',
    icon: '❄️',
    color: '#8BC34A',
    children: [
      { id: 'frozen_vegetable', name: '冷冻蔬菜', examples: ['速冻水饺', '速冻包子', '冷冻玉米粒', '冷冻豌豆'] },
      { id: 'frozen_meat', name: '冷冻肉类', examples: ['冻肉', '冻虾', '冻鱼', '冻鸡翅'] },
      { id: 'ice_cream', name: '冰淇淋', examples: ['冰淇淋', '雪糕', '冰棍', '冰棒'] }
    ]
  }
]

const getAllCategories = () => {
  return categories
}

const getCategoryById = (id) => {
  return categories.find(cat => cat.id === id)
}

const getCategoryByName = (name) => {
  return categories.find(cat => cat.name === name)
}

const getAllSubCategories = () => {
  const subCategories = []
  categories.forEach(cat => {
    cat.children.forEach(sub => {
      subCategories.push({
        ...sub,
        parentId: cat.id,
        parentName: cat.name,
        parentIcon: cat.icon,
        parentColor: cat.color
      })
    })
  })
  return subCategories
}

const getSubCategoryById = (id) => {
  for (const cat of categories) {
    const sub = cat.children.find(s => s.id === id)
    if (sub) {
      return {
        ...sub,
        parentId: cat.id,
        parentName: cat.name,
        parentIcon: cat.icon,
        parentColor: cat.color
      }
    }
  }
  return null
}

const getSubCategoriesByParentId = (parentId) => {
  const cat = categories.find(c => c.id === parentId)
  if (!cat) return []
  return cat.children.map(sub => ({
    ...sub,
    parentId: cat.id,
    parentName: cat.name,
    parentIcon: cat.icon,
    parentColor: cat.color
  }))
}

const searchCategories = (keyword) => {
  const results = []
  keyword = keyword.toLowerCase()
  
  categories.forEach(cat => {
    if (cat.name.toLowerCase().includes(keyword)) {
      results.push({ ...cat, type: 'category' })
    }
    
    cat.children.forEach(sub => {
      if (sub.name.toLowerCase().includes(keyword)) {
        results.push({
          ...sub,
          parentId: cat.id,
          parentName: cat.name,
          type: 'subcategory'
        })
      }
      
      sub.examples.forEach(example => {
        if (example.toLowerCase().includes(keyword)) {
          results.push({
            id: example,
            name: example,
            parentId: sub.id,
            parentName: sub.name,
            grandParentId: cat.id,
            grandParentName: cat.name,
            type: 'example'
          })
        }
      })
    })
  })
  
  return results
}

module.exports = {
  categories,
  getAllCategories,
  getCategoryById,
  getCategoryByName,
  getAllSubCategories,
  getSubCategoryById,
  getSubCategoriesByParentId,
  searchCategories
}