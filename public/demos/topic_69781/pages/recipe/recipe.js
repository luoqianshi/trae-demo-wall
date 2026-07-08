// pages/recipe/recipe.js

// 推荐食谱 - 带网络图片
const recommendedRecipes = [
  {
    id: 'r1',
    name: '香煎鸡胸肉配西兰花',
    category: 'loseFat',
    badgeText: '减脂',
    calories: 350,
    protein: 32,
    carb: 8,
    fat: 12,
    prepTime: '15分钟',
    difficulty: '简单',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=grilled%20chicken%20breast%20with%20broccoli%20on%20white%20plate%2C%20healthy%20fitness%20meal%2C%20food%20photography%2C%20clean%20lighting&image_size=square',
    ingredients: [
      { name: '鸡胸肉', amount: '150g' },
      { name: '西兰花', amount: '100g' },
      { name: '橄榄油', amount: '5ml' },
      { name: '盐', amount: '适量' },
      { name: '黑胡椒', amount: '适量' }
    ],
    steps: [
      { step: 1, description: '鸡胸肉洗净，用盐和黑胡椒腌制10分钟', duration: '10分钟' },
      { step: 2, description: '西兰花焯水备用', duration: '3分钟' },
      { step: 3, description: '平底锅加热，倒入橄榄油', duration: '1分钟' },
      { step: 4, description: '放入鸡胸肉，中火煎至两面金黄', duration: '8分钟' },
      { step: 5, description: '加入西兰花翻炒即可', duration: '2分钟' }
    ],
    tips: '鸡胸肉不要煎过久，否则口感会变柴。腌制时加少许淀粉可以锁住水分。'
  },
  {
    id: 'r2',
    name: '三文鱼糙米增肌餐',
    category: 'gainMuscle',
    badgeText: '增肌',
    calories: 520,
    protein: 40,
    carb: 45,
    fat: 18,
    prepTime: '25分钟',
    difficulty: '中等',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=pan%20seared%20salmon%20with%20brown%20rice%20and%20broccoli%2C%20fitness%20meal%20bowl%2C%20food%20photography&image_size=square',
    ingredients: [
      { name: '三文鱼', amount: '150g' },
      { name: '糙米', amount: '80g' },
      { name: '西兰花', amount: '100g' },
      { name: '柠檬', amount: '半个' },
      { name: '酱油', amount: '1勺' }
    ],
    steps: [
      { step: 1, description: '糙米提前浸泡2小时后蒸熟备用', duration: '25分钟' },
      { step: 2, description: '三文鱼用柠檬汁和酱油腌制15分钟', duration: '15分钟' },
      { step: 3, description: '平底锅煎三文鱼至熟，外皮微焦', duration: '8分钟' },
      { step: 4, description: '西兰花焯水2分钟捞出沥干', duration: '3分钟' },
      { step: 5, description: '将糙米饭盛入碗中，放上三文鱼和西兰花即可', duration: '2分钟' }
    ],
    tips: '三文鱼不要过度煎制，外皮微焦内里粉嫩最佳。'
  },
  {
    id: 'r3',
    name: '虾仁蔬菜沙拉',
    category: 'loseFat',
    badgeText: '减脂',
    calories: 220,
    protein: 18,
    carb: 12,
    fat: 8,
    prepTime: '15分钟',
    difficulty: '简单',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shrimp%20vegetable%20salad%20in%20bowl%2C%20fresh%20healthy%20meal%2C%20food%20photography%2C%20bright%20lighting&image_size=square',
    ingredients: [
      { name: '虾仁', amount: '100g' },
      { name: '生菜', amount: '80g' },
      { name: '小番茄', amount: '50g' },
      { name: '黄瓜', amount: '50g' },
      { name: '柠檬汁', amount: '10ml' },
      { name: '橄榄油', amount: '5ml' }
    ],
    steps: [
      { step: 1, description: '虾仁去虾线，焯水至变色捞出', duration: '3分钟' },
      { step: 2, description: '生菜洗净撕小片，黄瓜切片，小番茄对半切', duration: '5分钟' },
      { step: 3, description: '将蔬菜铺在碗底，虾仁放在上面', duration: '2分钟' },
      { step: 4, description: '淋上柠檬汁和橄榄油，撒少许盐和黑胡椒即可', duration: '1分钟' }
    ],
    tips: '虾仁不要煮太久，变色即可捞出，口感更弹嫩。'
  },
  {
    id: 'r4',
    name: '牛肉土豆增肌餐',
    category: 'gainMuscle',
    badgeText: '增肌',
    calories: 580,
    protein: 45,
    carb: 40,
    fat: 22,
    prepTime: '30分钟',
    difficulty: '中等',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=beef%20steak%20with%20roasted%20potatoes%20and%20broccoli%2C%20fitness%20meal%2C%20food%20photography&image_size=square',
    ingredients: [
      { name: '牛里脊', amount: '200g' },
      { name: '土豆', amount: '150g' },
      { name: '西兰花', amount: '100g' },
      { name: '橄榄油', amount: '5ml' },
      { name: '黑胡椒', amount: '适量' }
    ],
    steps: [
      { step: 1, description: '土豆切块蒸熟备用', duration: '15分钟' },
      { step: 2, description: '牛肉切块，用盐和黑胡椒腌制', duration: '5分钟' },
      { step: 3, description: '平底锅加油，大火煎牛肉至表面焦香', duration: '8分钟' },
      { step: 4, description: '西兰花焯水2分钟', duration: '3分钟' },
      { step: 5, description: '将所有食材装盘即可', duration: '2分钟' }
    ],
    tips: '牛肉大火快煎锁住肉汁，七分熟口感最佳。'
  },
  {
    id: 'r5',
    name: '低GI全麦蔬菜卷',
    category: 'controlSugar',
    badgeText: '控糖',
    calories: 280,
    protein: 12,
    carb: 15,
    fat: 8,
    prepTime: '15分钟',
    difficulty: '简单',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=whole%20wheat%20vegetable%20wrap%20roll%20cut%20in%20half%2C%20healthy%20meal%2C%20food%20photography&image_size=square',
    ingredients: [
      { name: '全麦饼皮', amount: '1张' },
      { name: '生菜', amount: '50g' },
      { name: '黄瓜', amount: '50g' },
      { name: '番茄', amount: '50g' },
      { name: '鸡蛋', amount: '1个' },
      { name: '低脂酸奶', amount: '15g' }
    ],
    steps: [
      { step: 1, description: '鸡蛋煎熟切条备用', duration: '3分钟' },
      { step: 2, description: '黄瓜和番茄切条', duration: '3分钟' },
      { step: 3, description: '全麦饼皮铺平，涂一层低脂酸奶', duration: '1分钟' },
      { step: 4, description: '依次放入生菜、黄瓜条、番茄条和鸡蛋', duration: '2分钟' },
      { step: 5, description: '卷起切段即可享用', duration: '1分钟' }
    ],
    tips: '全麦饼皮GI值远低于白面饼皮，酸奶替代沙拉酱减少糖分。'
  },
  {
    id: 'r6',
    name: '燕麦酸奶杯',
    category: 'controlSugar',
    badgeText: '控糖',
    calories: 180,
    protein: 10,
    carb: 22,
    fat: 4,
    prepTime: '10分钟',
    difficulty: '简单',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=oatmeal%20yogurt%20cup%20with%20blueberries%20and%20chia%20seeds%2C%20healthy%20breakfast%2C%20food%20photography&image_size=square',
    ingredients: [
      { name: '燕麦片', amount: '40g' },
      { name: '无糖酸奶', amount: '150ml' },
      { name: '蓝莓', amount: '30g' },
      { name: '奇亚籽', amount: '5g' },
      { name: '杏仁片', amount: '10g' }
    ],
    steps: [
      { step: 1, description: '燕麦片和奇亚籽放入杯中，加少许水浸泡5分钟', duration: '5分钟' },
      { step: 2, description: '倒入无糖酸奶搅拌均匀', duration: '1分钟' },
      { step: 3, description: '铺上蓝莓和杏仁片', duration: '2分钟' },
      { step: 4, description: '冷藏10分钟后口感更佳', duration: '2分钟' }
    ],
    tips: '选择无糖酸奶控制糖分摄入，奇亚籽富含膳食纤维有助稳定血糖。'
  },
  {
    id: 'r7',
    name: '清蒸鱼配时蔬',
    category: 'loseFat',
    badgeText: '减脂',
    calories: 280,
    protein: 28,
    carb: 6,
    fat: 10,
    prepTime: '20分钟',
    difficulty: '简单',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=steamed%20fish%20with%20vegetables%20on%20plate%2C%20chinese%20cuisine%2C%20healthy%20meal%2C%20food%20photography&image_size=square',
    ingredients: [
      { name: '鲈鱼', amount: '1条(约300g)' },
      { name: '西兰花', amount: '80g' },
      { name: '胡萝卜', amount: '50g' },
      { name: '姜丝', amount: '适量' },
      { name: '葱丝', amount: '适量' },
      { name: '蒸鱼豉油', amount: '15ml' }
    ],
    steps: [
      { step: 1, description: '鱼洗净，两面划刀，放姜丝腌制去腥', duration: '5分钟' },
      { step: 2, description: '西兰花和胡萝卜切好，焯水备用', duration: '3分钟' },
      { step: 3, description: '鱼放入蒸锅，大火蒸8-10分钟', duration: '10分钟' },
      { step: 4, description: '取出倒掉蒸出的汤汁，铺上葱丝', duration: '1分钟' },
      { step: 5, description: '淋上热油和蒸鱼豉油，搭配时蔬上桌', duration: '1分钟' }
    ],
    tips: '蒸鱼时间不宜过长，鱼眼突出即为蒸熟。'
  },
  {
    id: 'r8',
    name: '鸡腿肉意面',
    category: 'gainMuscle',
    badgeText: '增肌',
    calories: 480,
    protein: 35,
    carb: 50,
    fat: 15,
    prepTime: '20分钟',
    difficulty: '简单',
    image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chicken%20thigh%20pasta%20with%20tomato%20sauce%2C%20fitness%20meal%2C%20food%20photography&image_size=square',
    ingredients: [
      { name: '鸡腿肉', amount: '150g' },
      { name: '意面', amount: '80g' },
      { name: '番茄酱', amount: '30g' },
      { name: '洋葱', amount: '半个' },
      { name: '蒜末', amount: '适量' },
      { name: '黑胡椒', amount: '适量' }
    ],
    steps: [
      { step: 1, description: '意面按包装说明煮熟，捞出沥干', duration: '10分钟' },
      { step: 2, description: '鸡腿肉去骨切块，用盐和黑胡椒腌制', duration: '5分钟' },
      { step: 3, description: '锅中加油，炒香洋葱和蒜末', duration: '3分钟' },
      { step: 4, description: '加入鸡腿肉煎至金黄，倒入番茄酱翻炒均匀', duration: '6分钟' },
      { step: 5, description: '将意面加入锅中拌匀，调味出锅', duration: '2分钟' }
    ],
    tips: '意面煮到al dente口感最好，鸡腿肉比鸡胸肉更嫩滑多汁。'
  }
]

Page({
  data: {
    searchText: '',
    searching: false,
    searchResults: [],
    recommendedRecipes: recommendedRecipes,
    userRecipes: [],
    showAll: false,
    showShareModal: false,
    // 分享食谱表单
    shareForm: {
      name: '',
      ingredients: '',
      steps: '',
      tips: '',
      category: 'loseFat'
    },
    shareImages: [],
    uploading: false
  },

  onLoad() {
    this.loadUserRecipes()
  },

  onShow() {
    this.loadUserRecipes()
  },

  // 加载用户分享的食谱
  loadUserRecipes() {
    const userRecipes = wx.getStorageSync('userRecipes') || []
    this.setData({ userRecipes })
  },

  // 搜索输入
  onSearchInput(e) {
    this.setData({ searchText: e.detail.value })
  },

  // 确认搜索 - 调用大模型
  onSearch() {
    const { searchText } = this.data
    if (!searchText.trim()) {
      wx.showToast({ title: '请输入食材名称', icon: 'none' })
      return
    }
    this.searchRecipes(searchText.trim())
  },

  // 调用StepFun AI搜索食谱
  searchRecipes(ingredient) {
    this.setData({ searching: true, searchResults: [] })

    const apiKey = '4EWkFZvsxrkjl2GAFK4lpFSMs60vLZctsTGkPNJY35gT2y9VtedI2BkJlj1JvCJ3s'

    wx.request({
      url: 'https://api.stepfun.com/v1/chat/completions',
      method: 'POST',
      header: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      data: {
        model: 'step-1o-turbo-vision',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的健身食谱推荐助手。用户会输入一种食材，你需要推荐3-4个使用该食材的健身食谱，涵盖减脂、增肌、控糖等方向。只返回JSON，不要其他文字。'
          },
          {
            role: 'user',
            content: `请根据食材"${ingredient}"推荐3-4个健身食谱。格式要求：{"recipes":[{"name":"食谱名称","category":"loseFat或gainMuscle或controlSugar","badgeText":"减脂/增肌/控糖","calories":热量kcal整数,"protein":蛋白质g整数,"carb":碳水g整数,"fat":脂肪g整数,"prepTime":"烹饪时间","difficulty":"简单/中等/较难","ingredients":[{"name":"食材名","amount":"用量"}],"steps":[{"step":1,"description":"步骤描述","duration":"时间"}],"tips":"小贴士"}]}。食谱需适合健身人群，营养均衡。只返回JSON。`
          }
        ],
        temperature: 0.7,
        max_tokens: 2048
      },
      success: (res) => {
        if (res.data && res.data.choices && res.data.choices[0]) {
          const content = res.data.choices[0].message.content
          this.parseSearchResult(content, ingredient)
        } else {
          this.setData({ searching: false })
          wx.showToast({ title: '搜索失败，请重试', icon: 'none' })
        }
      },
      fail: () => {
        this.setData({ searching: false })
        wx.showToast({ title: '网络错误，请重试', icon: 'none' })
      }
    })
  },

  // 解析AI搜索结果
  parseSearchResult(content, ingredient) {
    try {
      let jsonStr = content.trim()
      const codeMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeMatch) jsonStr = codeMatch[1].trim()
      const firstBrace = jsonStr.indexOf('{')
      const lastBrace = jsonStr.lastIndexOf('}')
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonStr = jsonStr.substring(firstBrace, lastBrace + 1)
      }
      const result = JSON.parse(jsonStr)

      if (result.recipes && result.recipes.length > 0) {
        const searchResults = result.recipes.map((recipe, index) => ({
          id: 'ai_' + Date.now() + '_' + index,
          name: recipe.name,
          category: recipe.category || 'loseFat',
          badgeText: recipe.badgeText || '推荐',
          calories: Math.round(recipe.calories || 0),
          protein: recipe.protein || 0,
          carb: recipe.carb || 0,
          fat: recipe.fat || 0,
          prepTime: recipe.prepTime || '15分钟',
          difficulty: recipe.difficulty || '简单',
          image: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=' + encodeURIComponent(recipe.name + ', healthy fitness meal, food photography, clean lighting, professional') + '&image_size=square',
          ingredients: recipe.ingredients || [],
          steps: recipe.steps || [],
          tips: recipe.tips || '',
          isAI: true
        }))

        this.setData({ searching: false, searchResults })
      } else {
        this.setData({ searching: false, searchResults: [] })
        wx.showToast({ title: '未找到相关食谱', icon: 'none' })
      }
    } catch (e) {
      console.error('解析食谱结果失败:', e, content)
      this.setData({ searching: false })
      wx.showToast({ title: '解析失败，请重试', icon: 'none' })
    }
  },

  // 清除搜索
  clearSearch() {
    this.setData({ searchText: '', searchResults: [] })
  },

  // 跳转详情页 - 推荐食谱
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    const recipe = this.data.recommendedRecipes.find(r => r.id === id) ||
                   this.data.userRecipes.find(r => r.id === id)
    if (recipe) {
      wx.setStorageSync('currentRecipeDetail', recipe)
      wx.navigateTo({ url: '/pages/recipe-detail/recipe-detail' })
    }
  },

  // 跳转详情页 - 搜索结果
  goToAiDetail(e) {
    const index = e.currentTarget.dataset.index
    const recipe = this.data.searchResults[index]
    if (recipe) {
      wx.setStorageSync('currentRecipeDetail', recipe)
      wx.navigateTo({ url: '/pages/recipe-detail/recipe-detail' })
    }
  },

  // 显示分享食谱弹窗
  showShareRecipeModal() {
    this.setData({
      showShareModal: true,
      shareForm: { name: '', ingredients: '', steps: '', tips: '', category: 'loseFat' },
      shareImages: []
    })
  },

  // 隐藏分享弹窗
  hideShareModal() {
    this.setData({ showShareModal: false })
  },

  // 分享表单输入
  onShareNameInput(e) { this.setData({ 'shareForm.name': e.detail.value }) },
  onShareIngredientsInput(e) { this.setData({ 'shareForm.ingredients': e.detail.value }) },
  onShareStepsInput(e) { this.setData({ 'shareForm.steps': e.detail.value }) },
  onShareTipsInput(e) { this.setData({ 'shareForm.tips': e.detail.value }) },
  onShareCatTap(e) {
    const cat = e.currentTarget.dataset.cat
    this.setData({ 'shareForm.category': cat })
  },

  // 选择图片/视频
  chooseShareMedia() {
    const that = this
    wx.chooseMedia({
      count: 3,
      mediaType: ['image', 'video'],
      sourceType: ['album', 'camera'],
      success(res) {
        const files = res.files.map(f => ({
          type: f.fileType,
          url: f.tempFilePath,
          thumb: f.fileType === 'video' ? f.thumbTempFilePath : f.tempFilePath
        }))
        that.setData({ shareImages: that.data.shareImages.concat(files).slice(0, 3) })
      }
    })
  },

  // 删除图片
  removeShareImage(e) {
    const index = e.currentTarget.dataset.index
    const shareImages = this.data.shareImages
    shareImages.splice(index, 1)
    this.setData({ shareImages })
  },

  // 提交分享食谱
  submitShareRecipe() {
    const { shareForm, shareImages } = this.data
    if (!shareForm.name.trim()) {
      wx.showToast({ title: '请输入食谱名称', icon: 'none' })
      return
    }
    if (!shareForm.ingredients.trim()) {
      wx.showToast({ title: '请输入食材', icon: 'none' })
      return
    }
    if (!shareForm.steps.trim()) {
      wx.showToast({ title: '请输入做法', icon: 'none' })
      return
    }

    const badgeMap = { loseFat: '减脂', gainMuscle: '增肌', controlSugar: '控糖' }

    // 解析食材和步骤
    const ingredients = shareForm.ingredients.split(/[,，\n]/).filter(s => s.trim()).map(s => {
      const parts = s.trim().split(/\s+/)
      return { name: parts[0], amount: parts[1] || '适量' }
    })

    const steps = shareForm.steps.split(/\n/).filter(s => s.trim()).map((s, i) => ({
      step: i + 1,
      description: s.trim().replace(/^\d+[.、)\]]\s*/, ''),
      duration: ''
    }))

    const newRecipe = {
      id: 'user_' + Date.now(),
      name: shareForm.name.trim(),
      category: shareForm.category,
      badgeText: badgeMap[shareForm.category] || '推荐',
      calories: 0,
      protein: 0,
      carb: 0,
      fat: 0,
      prepTime: '自制',
      difficulty: '自定义',
      image: shareImages.length > 0 ? shareImages[0].thumb : '',
      images: shareImages.map(f => f.thumb),
      ingredients: ingredients,
      steps: steps,
      tips: shareForm.tips.trim(),
      isUser: true,
      author: '我',
      time: new Date().toLocaleDateString()
    }

    const userRecipes = wx.getStorageSync('userRecipes') || []
    userRecipes.unshift(newRecipe)
    wx.setStorageSync('userRecipes', userRecipes)

    this.setData({
      showShareModal: false,
      userRecipes: userRecipes,
      shareForm: { name: '', ingredients: '', steps: '', tips: '', category: 'loseFat' },
      shareImages: []
    })

    wx.showToast({ title: '食谱分享成功', icon: 'success' })
  }
})
