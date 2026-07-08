// pages/food-detail/food-detail.js
Page({
  data: {
    foodInfo: {
      id: 1,
      name: '鸡胸肉',
      category: '肉类蛋白',
      icon: '🍗',
      nutritionPer100g: {
        calories: 165,
        protein: 31,
        carbs: 0,
        fat: 3.6
      },
      giValue: 0,
      giLevel: '无GI值（纯蛋白质）',
      weightConversion: [
        { unit: '1块（约手掌大小）', weight: 150 },
        { unit: '1份', weight: 100 }
      ],
      description: '鸡胸肉是优质的蛋白质来源，脂肪含量低，富含维生素B族和磷、硒等矿物质。适合健身人群作为主要蛋白质来源，有助于肌肉修复和增长。烹饪方式建议蒸、煮或烤，避免油炸以保持低脂特性。',
      benefits: [
        '高蛋白低脂肪，适合减脂期食用',
        '富含B族维生素，促进新陈代谢',
        '易于消化吸收，生物价高',
        '性价比高，容易购买和储存'
      ],
      tips: '建议每餐摄入100-150g，搭配蔬菜和优质碳水。避免过度烹饪导致肉质变老。'
    }
  },

  onLoad(options) {
    if (options.id) {
      this.loadFoodDetail(options.id)
    }
  },

  loadFoodDetail(id) {
    const foodDatabase = {
      '1': {
        name: '鸡胸肉',
        category: '肉类蛋白',
        icon: '🍗',
        nutritionPer100g: { calories: 165, protein: 31, carbs: 0, fat: 3.6 },
        giValue: 0,
        giLevel: '无GI值（纯蛋白质）',
        weightConversion: [{ unit: '1块（约手掌大小）', weight: 150 }, { unit: '1份', weight: 100 }],
        description: '鸡胸肉是优质的蛋白质来源，脂肪含量低，富含维生素B族和磷、硒等矿物质。适合健身人群作为主要蛋白质来源，有助于肌肉修复和增长。',
        benefits: ['高蛋白低脂肪，适合减脂期食用', '富含B族维生素，促进新陈代谢', '易于消化吸收，生物价高', '性价比高，容易购买和储存'],
        tips: '建议每餐摄入100-150g，搭配蔬菜和优质碳水。'
      },
      '2': {
        name: '糙米',
        category: '全谷物',
        icon: '🌾',
        nutritionPer100g: { calories: 111, protein: 2.6, carbs: 23, fat: 0.9 },
        giValue: 56,
        giLevel: '中等GI',
        weightConversion: [{ unit: '1小碗（熟）', weight: 150 }, { unit: '1份（生）', weight: 50 }],
        description: '糙米保留了稻谷的胚芽和糠层，相比精白米含有更多的膳食纤维、维生素和矿物质。升糖指数适中，是理想的主食选择。',
        benefits: ['富含膳食纤维，增加饱腹感', 'B族维生素含量丰富', '血糖反应平缓，适合控糖', '提供持久能量释放'],
        tips: '建议提前浸泡2小时以上再烹煮，口感更佳。可替代白米作为日常主食。'
      },
      '3': {
        name: '三文鱼',
        category: '海鲜鱼类',
        icon: '🐟',
        nutritionPer100g: { calories: 208, protein: 20, carbs: 0, fat: 13 },
        giValue: 0,
        giLevel: '无GI值（纯蛋白质+脂肪）',
        weightConversion: [{ unit: '1块（约巴掌大小）', weight: 120 }, { unit: '1份', weight: 100 }],
        description: '三文鱼富含Omega-3脂肪酸（EPA和DHA），对心血管健康极有益处。同时提供优质蛋白质和多种维生素。',
        benefits: ['Omega-3脂肪酸保护心脏健康', '优质完全蛋白质来源', '富含维生素D和硒', '抗炎作用，利于运动恢复'],
        tips: '建议每周食用2-3次。生食需确保新鲜度，熟食更安全。避免过度煎炸。'
      },
      '4': {
        name: '西兰花',
        category: '蔬菜',
        icon: '🥦',
        nutritionPer100g: { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 },
        giValue: 15,
        giLevel: '低GI',
        weightConversion: [{ unit: '1朵（中）', weight: 30 }, { unit: '1碗（熟）', weight: 150 }],
        description: '西兰花被誉为"超级食物"，富含维生素C、K和叶酸，以及强效抗氧化物质硫代葡萄糖苷。热量极低但营养密度高。',
        benefits: ['维生素C含量极高，增强免疫力', '抗癌化合物丰富', '膳食纤维促进肠道健康', '热量低，适合大量食用'],
        tips: '不要过度烹煮，以保留营养素。清蒸或快炒5-7分钟最佳。可搭配橄榄油提升营养吸收率。'
      },
      '5': {
        name: '牛油果',
        category: '水果',
        icon: '🥑',
        nutritionPer100g: { calories: 160, protein: 2, carbs: 9, fat: 15 },
        giValue: 15,
        giLevel: '低GI',
        weightConversion: [{ unit: '1个（中等）', weight: 150 }, { unit: '半个', weight: 75 }],
        description: '牛油果含有健康的单不饱和脂肪酸，有助于降低坏胆固醇。同时富含钾、纤维和叶酸，是营养价值极高的水果。',
        benefits: ['健康脂肪有益心血管', '富含钾元素，平衡电解质', '纤维含量高，促进消化', '增加饱腹感，减少食欲'],
        tips: '成熟后食用口感最佳。可制作奶昔、沙拉或涂抹面包。每天半个到1个为宜。'
      }
    }

    if (foodDatabase[id]) {
      this.setData({ foodInfo: foodDatabase[id] })
    }
  },

  addToDiet() {
    wx.showModal({
      title: '添加到饮食记录',
      content: `是否将${this.data.foodInfo.name}添加到今日饮食记录？`,
      confirmText: '添加',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '已添加',
            icon: 'success'
          })
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        }
      }
    })
  },

  copyNutrition() {
    const { foodInfo } = this.data
    const text = `${foodInfo.name}营养成分（每100g）：\n热量：${foodInfo.nutritionPer100g.calories}kcal\n蛋白质：${foodInfo.nutritionPer100g.protein}g\n碳水：${foodInfo.nutritionPer100g.carbs}g\n脂肪：${foodInfo.nutritionPer100g.fat}g`

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制', icon: 'success' })
      }
    })
  },

  shareAppMessage() {
    return {
      title: `${this.data.foodInfo.name} - 营养详情`,
      path: `/pages/food-detail/food-detail?id=${this.data.foodInfo.id}`
    }
  }
})
