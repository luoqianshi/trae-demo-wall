Page({
  data: {
    plantId: '',
    plant: null
  },

  // 植物百科词条数据库（模拟）
  plantDatabase: {
    '1': {
      name: '龟背竹',
      nameEn: 'Monstera Deliciosa',
      image: '/images/龟背竹.jpg',
      family: '天南星科 · 龟背竹属',
      origin: '中美洲热带雨林',
      description: '龟背竹叶片宽大，成熟后会出现独特的孔洞与裂纹，形似龟背而得名。它是最受欢迎的室内观叶植物之一，能为空间注入热带雨林的氛围。',
      tags: ['观叶', '耐阴', '易养护'],
      care: {
        water: '保持土壤微湿，夏季约5-7天浇水一次，冬季10-15天一次',
        light: '喜散射光，避免强烈直射阳光，耐阴性较强',
        soil: '疏松透气的腐叶土，可混合珍珠岩',
        temperature: '15-30℃，冬季不低于10℃',
        humidity: '喜湿润环境，可定期向叶面喷水',
        fertilizer: '生长季每月施一次稀薄液肥'
      },
      propagation: '扦插繁殖为主，剪取带气生根的茎节，水培或土培均可生根。',
      warning: '汁液有毒，避免误食，家中有宠物或小孩需注意放置位置。'
    },
    '2': {
      name: '绿萝',
      nameEn: 'Epipremnum Aureum',
      image: '/images/绿萝.jpg',
      family: '天南星科 · 喜林芋属',
      origin: '所罗门群岛热带雨林',
      description: '绿萝被誉为"生命之花"，叶片心形翠绿，生长迅速，极易养护。无论是垂吊还是攀爬，都能为室内增添一抹清新的绿意。',
      tags: ['观叶', '耐阴', '净化空气'],
      care: {
        water: '喜湿润，土壤干透浇透，约5-7天一次',
        light: '耐阴性强，散射光或明亮散射处均可',
        soil: '通用营养土，排水良好即可',
        temperature: '10-30℃，适应性极强',
        humidity: '对湿度要求不高，普通室内即可',
        fertilizer: '生长季每月一次稀薄液肥'
      },
      propagation: '极易扦插，剪取带2-3个节点的茎段，水培生根后转土培。',
      warning: '汁液有毒，误食会引起口腔刺激，注意远离宠物。'
    },
    '3': {
      name: '白掌',
      nameEn: 'Spathiphyllum',
      image: '/images/白掌.jpg',
      family: '天南星科 · 白鹤芋属',
      origin: '美洲热带地区',
      description: '白掌又名"和平百合"，叶片深绿亮泽，花朵洁白如帆，优雅清新。它是优秀的空气净化植物，能吸收甲醛等有害气体。',
      tags: ['观花', '净化空气', '耐阴'],
      care: {
        water: '喜湿润，土壤表面干燥即可浇水，约4-6天一次',
        light: '耐阴，散射光即可开花，避免强光直射',
        soil: '富含腐殖质的疏松土壤',
        temperature: '18-28℃，不耐寒',
        humidity: '喜高湿，经常喷雾',
        fertilizer: '生长季每2周施一次薄肥'
      },
      propagation: '分株繁殖为主，春季换盆时分离侧芽。',
      warning: '含草酸钙，误食会引起口腔不适，注意远离儿童宠物。'
    },
    '4': {
      name: '琴叶榕',
      nameEn: 'Ficus Lyrata',
      image: '/images/琴叶榕.jpg',
      family: '桑科 · 榕属',
      origin: '西非热带低地雨林',
      description: '琴叶榕叶片硕大，形似小提琴，叶脉清晰，质感厚实。作为网红植物，它挺拔的身姿是空间中的视觉焦点。',
      tags: ['观叶', '网红植物', '大型'],
      care: {
        water: '土壤干透浇透，约7-10天一次，忌积水',
        light: '喜明亮散射光，每日需4-6小时光照',
        soil: '疏松透气的营养土，可加颗粒土',
        temperature: '18-28℃，怕冷风',
        humidity: '中等湿度，可偶尔擦叶',
        fertilizer: '生长季每月施一次缓释肥'
      },
      propagation: '高压繁殖或扦插，生长较慢，需要耐心。',
      warning: '对环境变化敏感，频繁移动易落叶，应固定位置养护。'
    }
  },

  onLoad(options) {
    const id = options.id || '1'
    const plant = this.plantDatabase[id] || this.plantDatabase['1']
    this.setData({
      plantId: id,
      plant
    })
  },

  collectPlant() {
    wx.showToast({ title: '已收藏', icon: 'success' })
  },

  sharePlant() {
    wx.showToast({ title: '分享功能开发中', icon: 'none' })
  },

  goBack() {
    wx.navigateBack()
  }
})