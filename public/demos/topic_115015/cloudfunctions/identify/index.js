const cloud = require('wx-server-sdk')

cloud.init({
  env: 'cloud1-d4gxb243yd5142c3c'
})

const plantNames = ['绿萝', '多肉', '吊兰', '发财树', '仙人掌', '君子兰', '月季', '龟背竹', '虎皮兰', '绿萝']

const mockResults = [
  {
    status: 'healthy',
    message: '植物状态健康',
    description: '叶片翠绿有光泽，植株生长旺盛',
    suggestion: '您的植物状态非常好！继续保持当前的养护方式。记得定期浇水，让它享受阳光。\n\n「顺木之天，以致其性」——郭橐驼',
    color: '#4CAF50',
    icon: '🌿'
  },
  {
    status: 'water_shortage',
    message: '叶片黄化，疑似缺水',
    description: '叶片边缘干枯发黄，盆土干燥',
    suggestion: '植物可能缺水了，叶片开始发黄。请及时补充水分，但注意不要浇太多。见干见湿是最好的浇水方式。',
    color: '#FF9800',
    icon: '💧'
  },
  {
    status: 'overwater',
    message: '根系可能腐烂，疑似浇水过多',
    description: '叶片发黄变软，盆土长期湿润',
    suggestion: '植物可能浇水过多了，根系容易腐烂。建议停止浇水，疏松土壤，加强通风。如果情况严重，需要换盆检查根系。',
    color: '#2196F3',
    icon: '🌧️'
  },
  {
    status: 'disease',
    message: '叶片出现病斑',
    description: '叶片上有褐色斑点，逐渐扩大',
    suggestion: '发现叶片上有病斑，可能是真菌感染。建议及时摘除病叶，保持通风，可以使用适当的杀菌剂。',
    color: '#F44336',
    icon: '🦠'
  },
  {
    status: 'nutrient_deficiency',
    message: '叶片黄化，疑似缺肥',
    description: '叶片颜色变浅，新叶发黄更明显',
    suggestion: '植物可能缺少营养，叶片颜色变浅。建议施加适量的复合肥，薄肥勤施效果更好。',
    color: '#FF9800',
    icon: '🌾'
  },
  {
    status: 'sunburn',
    message: '叶片灼伤，疑似光照过强',
    description: '叶片出现白色斑点或焦边',
    suggestion: '植物可能被阳光灼伤了。建议移到阴凉通风处，避免强光直射。可以适当喷水降温。',
    color: '#FFEB3B',
    icon: '☀️'
  },
  {
    status: 'shade',
    message: '生长缓慢，疑似光照不足',
    description: '叶片变薄变弱，植株徒长',
    suggestion: '植物可能光照不足，生长缓慢。建议移到光线充足的地方，但避免强光直射。适当修剪促进分枝。',
    color: '#9E9E9E',
    icon: '🌥️'
  },
  {
    status: 'pests',
    message: '发现虫害',
    description: '叶片有咬痕或白色粉末状物质',
    suggestion: '发现虫害迹象！建议仔细检查叶片背面和叶心，及时使用杀虫剂或肥皂水清洗。保持通风可以预防虫害。',
    color: '#E91E63',
    icon: '🐛'
  },
  {
    status: 'withered',
    message: '叶片枯萎',
    description: '叶片大面积枯萎，植株状态较差',
    suggestion: '叶片出现枯萎现象，请检查根系是否健康。如果根部腐烂，需要及时换盆处理。如果只是缺水，及时补充水分。',
    color: '#F44336',
    icon: '🍂'
  },
  {
    status: 'need_trim',
    message: '建议修剪',
    description: '枝叶过于茂盛，需要修剪整理',
    suggestion: '植物生长过于茂盛，建议适当修剪。修剪可以促进分枝，让植株更加健壮。修剪下来的枝条还可以扦插繁殖。',
    color: '#9C27B0',
    icon: '✂️'
  }
]

exports.main = async (event, context) => {
  try {
    const { fileID } = event
    
    const randomIndex = Math.floor(Math.random() * mockResults.length)
    const prediction = mockResults[randomIndex]
    
    const plantName = plantNames[Math.floor(Math.random() * plantNames.length)]
    
    const confidence = (0.7 + Math.random() * 0.25).toFixed(3)
    
    const otherResults = mockResults
      .filter(r => r.status !== prediction.status)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2)
    
    return {
      success: true,
      prediction: {
        ...prediction,
        plant_name: plantName
      },
      all_results: [
        { label: prediction.message, probability: parseFloat((parseFloat(confidence) * 0.8).toFixed(3)) },
        { label: otherResults[0].message, probability: parseFloat((parseFloat(confidence) * 0.12).toFixed(3)) },
        { label: otherResults[1].message, probability: parseFloat((parseFloat(confidence) * 0.08).toFixed(3)) }
      ],
      confidence: parseFloat(confidence)
    }
  } catch (err) {
    console.error('识别失败:', err)
    return {
      success: false,
      error: '识别失败，请重试'
    }
  }
}
