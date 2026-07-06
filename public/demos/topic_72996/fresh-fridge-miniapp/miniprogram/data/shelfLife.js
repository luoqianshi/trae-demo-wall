const shelfLifeTemplates = [
  {
    id: 'seasonal_fruit',
    name: '时令鲜果',
    description: '应季新鲜水果，建议尽快食用',
    daysMin: 3,
    daysMax: 7,
    days: 5,
    temperature: '0-4℃冷藏',
    examples: ['草莓', '樱桃', '葡萄', '桃子', '西瓜', '哈密瓜']
  },
  {
    id: 'cold_chain_cooked',
    name: '冷链真空熟食',
    description: '真空包装的熟食，需冷链保存',
    days: 7,
    temperature: '0-4℃冷藏',
    examples: ['酱牛肉', '烧鸡', '盐水鸭', '卤味', '熟肉制品']
  },
  {
    id: 'room_temp_pastry',
    name: '常温真空糕点',
    description: '真空包装的糕点，常温保存即可',
    days: 30,
    temperature: '15-25℃常温',
    examples: ['饼干', '月饼', '酥饼', '糕点', '烧饼']
  },
  {
    id: 'dried_sausage',
    name: '风干腊味特产',
    description: '风干腊制的肉类特产，保质期较长',
    days: 90,
    temperature: '阴凉干燥处',
    examples: ['腊肠', '腊肉', '火腿', '腊鱼', '风干肉']
  },
  {
    id: 'refrigerator_short',
    name: '冷藏短期',
    description: '需要冷藏保存，保质期较短的食材',
    days: 3,
    temperature: '0-4℃',
    examples: ['绿叶蔬菜', '草莓', '蓝莓', '豆腐', '鲜牛奶', '酸奶', '豆腐脑']
  },
  {
    id: 'refrigerator_medium',
    name: '冷藏中期',
    description: '需要冷藏保存，保质期中等的食材',
    days: 7,
    temperature: '0-4℃',
    examples: ['苹果', '梨', '橙子', '黄瓜', '西红柿', '鸡蛋', '培根']
  },
  {
    id: 'refrigerator_long',
    name: '冷藏长期',
    description: '需要冷藏保存，保质期较长的食材',
    days: 14,
    temperature: '0-4℃',
    examples: ['胡萝卜', '土豆', '洋葱', '卷心菜', '奶酪', '黄油', '速冻饺子']
  },
  {
    id: 'freezer_short',
    name: '冷冻短期',
    description: '需要冷冻保存，保质期较短的食材',
    days: 30,
    temperature: '-18℃以下',
    examples: ['鲜肉', '鲜鱼', '虾仁', '鸡翅', '速冻蔬菜']
  },
  {
    id: 'freezer_medium',
    name: '冷冻中期',
    description: '需要冷冻保存，保质期中等的食材',
    days: 90,
    temperature: '-18℃以下',
    examples: ['冻肉', '冻鱼', '冻虾', '冷冻水饺', '冷冻包子']
  },
  {
    id: 'freezer_long',
    name: '冷冻长期',
    description: '需要冷冻保存，保质期较长的食材',
    days: 180,
    temperature: '-18℃以下',
    examples: ['冻鸡腿', '冻排骨', '冻牛肉', '冻羊肉', '冰淇淋']
  },
  {
    id: 'room_temp_short',
    name: '常温短期',
    description: '常温保存，保质期较短的食材',
    days: 3,
    temperature: '15-25℃',
    examples: ['面包', '蛋糕', '熟食', '切好的水果', '开封后的零食']
  },
  {
    id: 'room_temp_medium',
    name: '常温中期',
    description: '常温保存，保质期中等的食材',
    days: 30,
    temperature: '15-25℃',
    examples: ['饼干', '糖果', '巧克力', '坚果', '罐头', '方便面']
  },
  {
    id: 'room_temp_long',
    name: '常温长期',
    description: '常温保存，保质期较长的食材',
    days: 180,
    temperature: '15-25℃',
    examples: ['大米', '面粉', '食用油', '酱油', '醋', '盐', '糖', '干货']
  },
  {
    id: 'fresh',
    name: '新鲜即食',
    description: '新鲜食材，建议尽快食用',
    days: 1,
    temperature: '0-4℃',
    examples: ['新鲜水果', '新鲜蔬菜', '刚买的鲜肉', '鲜花']
  },
  {
    id: 'canned',
    name: '罐头食品',
    description: '密封罐装食品，保质期较长',
    days: 365,
    temperature: '常温',
    examples: ['罐头水果', '罐头肉类', '罐头蔬菜', '罐装饮料']
  },
  {
    id: 'dried',
    name: '干货',
    description: '脱水干燥食材，保质期很长',
    days: 365,
    temperature: '干燥通风',
    examples: ['木耳', '银耳', '香菇', '红枣', '枸杞', '桂圆', '葡萄干']
  }
]

const getAllTemplates = () => {
  return shelfLifeTemplates
}

const getTemplateById = (id) => {
  return shelfLifeTemplates.find(t => t.id === id)
}

const getTemplateByName = (name) => {
  return shelfLifeTemplates.find(t => t.name === name)
}

const getTemplatesByType = (type) => {
  return shelfLifeTemplates.filter(t => t.id.startsWith(type))
}

const getRefrigeratorTemplates = () => {
  return getTemplatesByType('refrigerator')
}

const getFreezerTemplates = () => {
  return getTemplatesByType('freezer')
}

const getRoomTempTemplates = () => {
  return getTemplatesByType('room_temp')
}

const getRecommendedTemplate = (foodName) => {
  for (const template of shelfLifeTemplates) {
    if (template.examples.some(ex => foodName.includes(ex))) {
      return template
    }
  }
  return shelfLifeTemplates[1]
}

const calculateExpireDate = (templateId, purchaseDate = new Date()) => {
  const template = getTemplateById(templateId)
  if (!template) return null
  
  const date = new Date(purchaseDate)
  date.setDate(date.getDate() + template.days)
  return date
}

const getDaysRemaining = (expireDate) => {
  const today = new Date()
  const expire = new Date(expireDate)
  const diffTime = expire - today
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const getStorageAdvice = (templateId) => {
  const template = getTemplateById(templateId)
  if (!template) return ''
  
  const adviceMap = {
    refrigerator_short: '建议3天内食用完毕，保持密封冷藏',
    refrigerator_medium: '建议1周内食用完毕，注意保鲜',
    refrigerator_long: '可冷藏保存2周，定期检查新鲜度',
    freezer_short: '建议1个月内食用，避免反复解冻',
    freezer_medium: '可冷冻保存3个月，注意密封',
    freezer_long: '可冷冻保存半年，保持低温环境',
    room_temp_short: '建议尽快食用，注意防潮',
    room_temp_medium: '常温保存，避免阳光直射',
    room_temp_long: '密封保存，放在干燥通风处',
    fresh: '请立即食用，新鲜度最佳',
    canned: '开封后需冷藏，尽快食用',
    dried: '密封保存，防潮防虫'
  }
  
  return adviceMap[templateId] || '请妥善保存食材'
}

module.exports = {
  shelfLifeTemplates,
  getAllTemplates,
  getTemplateById,
  getTemplateByName,
  getTemplatesByType,
  getRefrigeratorTemplates,
  getFreezerTemplates,
  getRoomTempTemplates,
  getRecommendedTemplate,
  calculateExpireDate,
  getDaysRemaining,
  getStorageAdvice
}