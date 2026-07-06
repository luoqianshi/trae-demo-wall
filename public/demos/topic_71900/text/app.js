App({
  onLaunch: function () {
    console.log('家居人格测试小程序启动')
  },
  globalData: {
    surveys: [
      {
        id: 1,
        title: '家居人格测试',
        description: '通过直觉选择探索您的生活方式与空间性格',
        cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20minimalist%20home%20interior%20design%20with%20plants%20and%20natural%20light%20cozy%20atmosphere&image_size=landscape_16_9',
        questions: [
          {
            id: 1,
            type: 'radio',
            title: '你更向往的清晨是',
            options: ['安静有光线慢慢流动的空间', '可以放松不需要马上思考的状态', '有明确计划事情一步步完成的开始', '充满变化可能会发生新事情的早晨']
          },
          {
            id: 2,
            type: 'radio',
            title: '如果让你独处一整天你更可能',
            options: ['整理环境思考让一切变得有序', '躺着休息发呆随心切换状态', '做一些具体事情让时间被充分利用', '做一些有趣尝试甚至临时改变计划']
          },
          {
            id: 3,
            type: 'radio',
            title: '在一个陌生空间里你第一反应是',
            options: ['观察结构与秩序', '找一个舒服的位置待下来', '了解功能如何使用', '探索哪里可以被改变或利用']
          },
          {
            id: 4,
            type: 'radio',
            title: '你最不能接受的一种状态是',
            options: ['混乱无序没有规则感', '不舒服没有安全感', '没有效率事情拖延', '一成不变缺乏变化']
          },
          {
            id: 5,
            type: 'radio',
            title: '你理想中的生活状态更像',
            options: ['清晰有边界有秩序', '温和放松可以停下来', '稳定推进事情不断完成', '自由流动不断有新体验']
          },
          {
            id: 6,
            type: 'radio',
            title: '你在人群中的状态更接近',
            options: ['观察者倾向保持距离', '亲和但不主动中心参与', '组织者或执行者角色', '活跃者或带动变化的人']
          },
          {
            id: 7,
            type: 'radio',
            title: '面对一个复杂问题你通常',
            options: ['先梳理结构与逻辑', '先感受整体状态再决定', '直接拆解成步骤解决', '尝试不同方式边做边调整']
          },
          {
            id: 8,
            type: 'radio',
            title: '你更喜欢的空间氛围是',
            options: ['干净有秩序留白多', '温暖柔和可以放松', '清晰实用功能明确', '灵活多变有创造感']
          },
          {
            id: 9,
            type: 'radio',
            title: '你更倾向于如何度过周末',
            options: ['整理阅读独处恢复', '休息放空慢节奏生活', '做计划完成事情', '社交探索尝试新事物']
          }
        ]
      }
    ],
    personalityTypes: {
      A: {
        name: '秩序型人格',
        animal: '丹顶鹤',
        icon: '🦩',
        color: '#1E88E5',
        description: '您追求秩序与美感，喜欢简洁有条理的空间。注重细节和品质，善于创造和谐舒适的居住环境。',
        traits: ['注重细节', '追求完美', '喜欢整洁', '善于规划'],
        strengths: ['审美感强', '逻辑清晰', '执行力强', '善于规划'],
        weaknesses: ['过于追求完美', '对变化敏感', '决策偏保守'],
        interiorStyle: '现代简约风格',
        colorScheme: '黑白灰为主，搭配低饱和度色系',
        spaceTips: ['保持空间整洁有序', '注重收纳系统设计', '留白是最好的装饰', '选择质感好的材质'],
        lifeStyle: '喜欢规律的生活节奏，注重生活品质，善于规划时间和空间，追求内心的平静与和谐。',
        careerFit: '设计师、策划师、建筑师、会计师等需要细致和规划能力的职业',
        relationshipStyle: '在关系中注重边界感，喜欢有秩序的相处模式，是可靠的朋友和伴侣'
      },
      B: {
        name: '舒适型人格',
        animal: '猫',
        icon: '🐱',
        color: '#FF9800',
        description: '您追求舒适与安全感，喜欢温暖惬意的空间。注重生活品质，善于营造温馨放松的居住氛围。',
        traits: ['注重感受', '追求舒适', '喜欢温暖', '善于享受'],
        strengths: ['同理心强', '善于倾听', '亲和力好', '注重细节'],
        weaknesses: ['决策偏感性', '有时过于依赖', '对冲突敏感'],
        interiorStyle: '北欧风/日式简约风格',
        colorScheme: '暖色调为主，米色、浅棕色、奶油色',
        spaceTips: ['营造温暖的灯光氛围', '选择柔软舒适的家具', '加入绿植增添生机', '摆放有意义的装饰品'],
        lifeStyle: '喜欢慢节奏的生活，注重身心放松，善于享受生活中的小确幸，追求内心的安全感。',
        careerFit: '心理咨询师、教师、护理人员、室内设计师等与人打交道的职业',
        relationshipStyle: '在关系中注重情感连接，善于营造温馨的氛围，是温暖的朋友和伴侣'
      },
      C: {
        name: '功能型人格',
        animal: '狗',
        icon: '🐶',
        color: '#4CAF50',
        description: '您追求实用与效率，喜欢功能明确的空间。注重实用性和功能性，善于利用空间创造价值。',
        traits: ['注重实用', '追求效率', '喜欢条理', '善于执行'],
        strengths: ['目标明确', '行动力强', '善于解决问题', '责任心强'],
        weaknesses: ['过于理性', '缺乏耐心', '对细节不够敏感'],
        interiorStyle: '工业风/极简风格',
        colorScheme: '中性色调，灰色、棕色、金属色',
        spaceTips: ['注重空间利用率', '选择多功能家具', '保持动线流畅', '强调实用性优先'],
        lifeStyle: '喜欢有目标的生活，注重效率和成果，善于规划和执行，追求成就感和价值实现。',
        careerFit: '工程师、项目经理、创业者、管理者等需要执行力的职业',
        relationshipStyle: '在关系中注重承诺和责任，善于提供实际帮助，是可靠的朋友和伴侣'
      },
      D: {
        name: '探索型人格',
        animal: '鹿',
        icon: '🦌',
        color: '#9C27B0',
        description: '您追求变化与创意，喜欢灵活多变的空间。注重创新和探索，善于创造充满活力的居住体验。',
        traits: ['注重创新', '追求变化', '喜欢探索', '善于创造'],
        strengths: ['富有创意', '敢于尝试', '适应力强', '思维活跃'],
        weaknesses: ['缺乏耐心', '容易分心', '难以坚持'],
        interiorStyle: '混搭风格/波西米亚风格',
        colorScheme: '丰富的色彩搭配，撞色设计',
        spaceTips: ['保持空间的灵活性', '加入个性化元素', '允许空间随时间变化', '展示旅行收藏品'],
        lifeStyle: '喜欢充满变化的生活，注重新鲜感和体验，善于发现新事物，追求自由和自我实现。',
        careerFit: '艺术家、创意工作者、创业者、旅行家等需要创造力的职业',
        relationshipStyle: '在关系中注重新鲜感和刺激，善于带来惊喜，是有趣的朋友和伴侣'
      }
    }
  },
  calculatePersonality: function(answers) {
    const counts = { A: 0, B: 0, C: 0, D: 0 }
    const optionLabels = ['A', 'B', 'C', 'D']
    
    answers.forEach((selectedIndex) => {
      const personality = optionLabels[selectedIndex]
      if (personality) {
        counts[personality]++
      }
    })
    
    const sorted = Object.entries(counts)
      .map(([key, value]) => ({ type: key, count: value }))
      .sort((a, b) => b.count - a.count)
    
    let mainType = sorted[0].type
    let subType = sorted[1].type
    
    if (sorted[0].count === sorted[1].count) {
      const lastAnswer = answers[answers.length - 1]
      mainType = optionLabels[lastAnswer]
      subType = sorted.find(s => s.type !== mainType).type
    }
    
    return {
      mainType,
      subType,
      counts,
      details: sorted
    }
  }
})