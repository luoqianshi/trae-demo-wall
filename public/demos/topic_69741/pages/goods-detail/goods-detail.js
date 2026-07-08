// pages/goods-detail/goods-detail.js

// 商品数据库
const goodsDatabase = {
  '1': {
    id: 1, name: '二手哑铃套装', price: 150, category: '健身器材',
    seller: { avatar: '', nickname: '健身达人', wechat: 'fitness_master' },
    condition: '9成新', time: '1天前', imgClass: 'sage', emoji: '🏋️',
    description: '哑铃套装，包含2.5kg、5kg、10kg各两个，适合家庭健身使用。\n\n购买后仅使用过几次，基本全新。包胶材质，不伤地板，静音设计。可以自由组合不同重量，满足从入门到进阶的训练需求。\n\n适合人群：家庭健身、办公室锻炼、康复训练',
    isCollected: false
  },
  '2': {
    id: 2, name: '瑜伽垫', price: 50, category: '运动服饰',
    seller: { avatar: '', nickname: '瑜伽爱好者', wechat: 'yoga_lover' },
    condition: '全新', time: '2天前', imgClass: 'lavender', emoji: '🧘',
    description: '全新瑜伽垫，10mm加厚款，防滑耐磨，附带收纳带。\n\n因搬家低价转让，原价89元。TPE环保材质，双面防滑纹理，回弹性好，保护关节。自带收纳绑带，方便携带。\n\n适合人群：瑜伽、普拉提、居家健身',
    isCollected: false
  },
  '3': {
    id: 3, name: '蛋白粉', price: 120, category: '营养补剂',
    seller: { avatar: '', nickname: '增肌战士', wechat: 'muscle_warrior' },
    condition: '8成新', time: '3天前', imgClass: 'orange', emoji: '🥤',
    description: '乳清蛋白粉，巧克力味，还剩大半罐。原价280，低价出。保质期至年底。\n\n每份含25g蛋白质，低糖低脂配方，添加BCAA支链氨基酸，促进肌肉恢复。口感顺滑，易冲泡不结块。\n\n适合人群：健身增肌、运动后恢复',
    isCollected: false
  },
  '4': {
    id: 4, name: '跑步机', price: 800, category: '健身器材',
    seller: { avatar: '', nickname: '跑步爱好者', wechat: 'run_master' },
    condition: '7成新', time: '5天前', imgClass: 'rose', emoji: '🏃',
    description: '家用跑步机，可折叠节省空间，带坡度调节和心率监测功能。使用一年，功能完好。\n\n跑带宽度45cm，最高速度12km/h，3档坡度调节。内置多种运动模式，LCD显示速度/时间/距离/卡路里。承重120kg，静音马达。\n\n适合人群：居家有氧运动、减脂训练',
    isCollected: false
  },
  '5': {
    id: 5, name: '运动水壶', price: 30, category: '其他',
    seller: { avatar: '', nickname: '运动小白', wechat: 'sports_newbie' },
    condition: '全新', time: '1周前', imgClass: 'sage', emoji: '🍶',
    description: '大容量运动水壶750ml，带刻度线，BPA免费材质，全新未拆封。\n\nTritan材质安全无异味，单手开盖弹盖设计，运动时方便饮用。宽口径方便加冰块和清洗，带提手和背带环。\n\n适合人群：运动补水、户外出行',
    isCollected: false
  },
  '6': {
    id: 6, name: '健身手套', price: 45, category: '运动服饰',
    seller: { avatar: '', nickname: '举铁达人', wechat: 'iron_master' },
    condition: '9成新', time: '2周前', imgClass: 'lavender', emoji: '🧤',
    description: '专业健身手套，带护腕支撑，掌心防滑硅胶垫，透气网面设计。\n\n半指设计，不影响手指灵活性。魔术贴可调节松紧，护腕支撑减少腕关节压力。使用过几次，成色很新。\n\n适合人群：举铁、引体向上、器械训练',
    isCollected: false
  },
  '7': {
    id: 7, name: '弹力带套装', price: 35, category: '健身器材',
    seller: { avatar: '', nickname: '拉伸达人', wechat: 'stretch_pro' },
    condition: '全新', time: '3天前', imgClass: 'sage', emoji: '💪',
    description: '五根不同阻力弹力带，从轻到重，附带门扣和手柄，适合全身训练。全新未拆封。\n\n天然乳胶材质，弹性好不易断裂。5种阻力等级（5-50磅），适合不同训练阶段。附送收纳袋、门扣和泡沫手柄。\n\n适合人群：居家训练、拉伸康复、瑜伽辅助',
    isCollected: false
  },
  '8': {
    id: 8, name: '运动背包', price: 80, category: '运动服饰',
    seller: { avatar: '', nickname: '户外爱好者', wechat: 'outdoor_fan' },
    condition: '8成新', time: '4天前', imgClass: 'orange', emoji: '🎒',
    description: '运动背包30L，独立鞋仓和湿物隔层，多口袋设计，透气背板。用过几次，成色很好。\n\n防泼水面料，独立鞋仓隔离异味，湿物隔层放毛巾/泳衣。侧袋放水壶，前袋放小件。人体工学背板，透气减压。\n\n适合人群：健身通勤、户外运动、游泳',
    isCollected: false
  },
  '9': {
    id: 9, name: '左旋肉碱', price: 60, category: '营养补剂',
    seller: { avatar: '', nickname: '减脂小能手', wechat: 'fat_burner' },
    condition: '全新', time: '5天前', imgClass: 'lavender', emoji: '💊',
    description: '左旋肉碱液体版，蓝莓味，运动前30分钟饮用效果更佳。全新未拆封，保质期充足。\n\n液体剂型吸收更快，每支含1000mg左旋肉碱。配合有氧运动，帮助脂肪代谢转化为能量。便携小瓶装，随时饮用。\n\n适合人群：减脂期、有氧运动、体重管理',
    isCollected: false
  },
  '10': {
    id: 10, name: '筋膜枪', price: 200, category: '健身器材',
    seller: { avatar: '', nickname: '按摩达人', wechat: 'massage_pro' },
    condition: '9成新', time: '1周前', imgClass: 'rose', emoji: '🔫',
    description: '筋膜枪迷你款，4个按摩头，6档力度调节，Type-C充电，续航持久。\n\n无刷电机噪音低，4种按摩头适配不同部位。转速2400-3600rpm，6档力度满足不同需求。Type-C快充，满电续航6小时。仅使用过几次。\n\n适合人群：运动恢复、日常放松、缓解酸痛',
    isCollected: false
  },
  '11': {
    id: 11, name: '跳绳', price: 25, category: '健身器材',
    seller: { avatar: '', nickname: '跳绳爱好者', wechat: 'rope_skipper' },
    condition: '全新', time: '1周前', imgClass: 'sage', emoji: '⏭',
    description: '钢丝轴承跳绳，双轴承设计转动顺滑，可调节长度，附带计数器。全新。\n\n内芯钢丝绳+PVC外层，耐磨不断绳。双轴承360度旋转不绕绳。泡棉手柄吸汗防滑，长度可调2.1-3m。附带机械计数器。\n\n适合人群：HIIT训练、减脂有氧、拳击训练',
    isCollected: false
  },
  '12': {
    id: 12, name: '健身腰带', price: 55, category: '运动服饰',
    seller: { avatar: '', nickname: '深蹲王者', wechat: 'squat_king' },
    condition: '8成新', time: '2周前', imgClass: 'orange', emoji: '🎯',
    description: '专业健身腰带，加厚牛皮材质，双排扣设计，深蹲硬拉必备。用过几次。\n\n10mm厚度牛皮，支撑力强。双排扣稳固不易松脱。宽度10cm，腰部支撑面积大，有效保护腰椎。适合腰围70-95cm。\n\n适合人群：深蹲、硬拉、举重训练',
    isCollected: false
  }
}

Page({
  data: {
    goodsDetail: null,
    similarGoods: []
  },

  onLoad(options) {
    if (options.id) {
      this.loadGoodsDetail(options.id)
    }
  },

  loadGoodsDetail(id) {
    const goods = goodsDatabase[id]
    if (!goods) return

    // 查找同类商品（排除当前商品）
    const allGoods = Object.values(goodsDatabase)
    const similar = allGoods
      .filter(g => g.category === goods.category && g.id !== goods.id)
      .slice(0, 3)

    this.setData({
      goodsDetail: goods,
      similarGoods: similar
    })
  },

  // 我想要 - 购买确认
  wantToBuy() {
    const { goodsDetail } = this.data
    wx.showModal({
      title: '确认购买',
      content: `确认购买 ${goodsDetail.name}？`,
      confirmText: '确认',
      confirmColor: '#E3A37D',
      success: (res) => {
        if (res.confirm) {
          wx.setClipboardData({
            data: goodsDetail.seller.wechat,
            success: () => {
              wx.showToast({
                title: '微信号已复制，联系卖家完成交易',
                icon: 'none',
                duration: 2500
              })
            }
          })
        }
      }
    })
  },

  // 联系卖家
  contactSeller() {
    const { seller } = this.data.goodsDetail
    wx.setClipboardData({
      data: seller.wechat,
      success: () => {
        wx.showToast({
          title: '微信号已复制',
          icon: 'success'
        })
      }
    })
  },

  // 收藏商品
  toggleCollect() {
    const { isCollected } = this.data.goodsDetail
    this.setData({
      'goodsDetail.isCollected': !isCollected
    })
    wx.showToast({
      title: isCollected ? '已取消收藏' : '收藏成功',
      icon: 'success'
    })
  },

  // 跳转同类商品详情
  goToSimilarDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.redirectTo({
      url: `/pages/goods-detail/goods-detail?id=${id}`
    })
  },

  // 返回上一页
  goBack() {
    wx.navigateBack()
  },

  // 分享
  onShareAppMessage() {
    const { goodsDetail } = this.data
    return {
      title: `${goodsDetail.name} - ¥${goodsDetail.price}`,
      path: `/pages/goods-detail/goods-detail?id=${goodsDetail.id}`
    }
  }
})
