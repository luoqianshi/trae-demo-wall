// pages/recipe-detail/recipe-detail.js

Page({
  data: {
    recipeInfo: null,
    heroGradient: ''
  },

  onLoad(options) {
    // 优先从 storage 读取（AI/用户分享食谱）
    const recipeFromStorage = wx.getStorageSync('currentRecipeDetail')
    if (recipeFromStorage) {
      wx.removeStorageSync('currentRecipeDetail')
      this.buildRecipeInfo(recipeFromStorage)
      return
    }

    // 兼容旧方式：通过 id 参数
    if (options.id) {
      // 旧方式不再支持，跳回食谱页
      wx.navigateBack()
    }
  },

  buildRecipeInfo(recipe) {
    const categoryColors = {
      loseFat: '#96AD93',
      gainMuscle: '#E3A37D',
      controlSugar: '#B5B5C1'
    }
    const heroColor = categoryColors[recipe.category] || '#96AD93'

    const tags = []
    if (recipe.badgeText) tags.push(recipe.badgeText)
    if (recipe.difficulty) tags.push(recipe.difficulty)
    if (recipe.isUser) tags.push('自制')

    const recipeInfo = {
      id: recipe.id,
      name: recipe.name,
      image: recipe.image || '',
      images: recipe.images || [],
      tags: tags,
      nutrition: {
        calories: recipe.calories || 0,
        protein: recipe.protein || 0,
        carbs: recipe.carb || 0,
        fat: recipe.fat || 0
      },
      servings: 1,
      prepTime: parseInt(recipe.prepTime) || 15,
      ingredients: (recipe.ingredients || []).map(ing => ({
        name: ing.name,
        amount: ing.amount,
        note: ''
      })),
      steps: (recipe.steps || []).map(s => ({
        step: s.step || s.stepNumber || 0,
        text: s.description || s.text || '',
        time: parseInt(s.duration) || 0,
        unit: '分钟'
      })),
      tips: recipe.tips || '',
      isCollected: false,
      isAI: recipe.isAI || false,
      isUser: recipe.isUser || false
    }

    const collectedRecipes = wx.getStorageSync('collectedRecipes') || []
    recipeInfo.isCollected = collectedRecipes.includes(recipeInfo.id)

    this.setData({
      recipeInfo,
      heroGradient: heroColor
    })
  },

  toggleCollect() {
    const { recipeInfo } = this.data
    let collectedRecipes = wx.getStorageSync('collectedRecipes') || []

    if (recipeInfo.isCollected) {
      collectedRecipes = collectedRecipes.filter(id => id !== recipeInfo.id)
      wx.showToast({ title: '已取消收藏', icon: 'none' })
    } else {
      collectedRecipes.push(recipeInfo.id)
      wx.showToast({ title: '收藏成功', icon: 'success' })
    }

    wx.setStorageSync('collectedRecipes', collectedRecipes)
    this.setData({ ['recipeInfo.isCollected']: !recipeInfo.isCollected })
  },

  copyIngredients() {
    const { recipeInfo } = this.data
    let text = `【${recipeInfo.name}】配料清单\n`
    text += `份量：${recipeInfo.servings}人份\n\n`

    recipeInfo.ingredients.forEach(item => {
      text += `${item.name} ${item.amount}`
      if (item.note) text += ` (${item.note})`
      text += '\n'
    })

    wx.setClipboardData({
      data: text,
      success: () => {
        wx.showToast({ title: '已复制配料清单', icon: 'success' })
      }
    })
  },

  addToDietRecord() {
    const { recipeInfo } = this.data
    const dietRecord = wx.getStorageSync('recipeDietRecords') || []
    const record = {
      id: Date.now().toString(),
      recipeId: recipeInfo.id,
      name: recipeInfo.name,
      calories: recipeInfo.nutrition.calories,
      protein: recipeInfo.nutrition.protein,
      carb: recipeInfo.nutrition.carbs,
      fat: recipeInfo.nutrition.fat,
      amount: 1,
      time: new Date().toISOString()
    }
    dietRecord.push(record)
    wx.setStorageSync('recipeDietRecords', dietRecord)
    wx.showToast({ title: '已加入饮食记录', icon: 'success' })
  }
})
