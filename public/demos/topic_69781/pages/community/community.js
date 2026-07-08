// pages/community/community.js
Page({
  data: {
    currentTab: 0, // 0: 动态, 1: 闲置市场
    posts: [],
    showPublishModal: false,
    newPostContent: '',
    showCommentModal: false,
    currentPostIndex: null,
    newCommentContent: '',
    selectedCategory: '全部',
    goods: [
      { id: 1, name: '二手哑铃套装', price: 150, category: '健身器材', seller: '健身达人', time: '1天前', imgClass: 'sage', condition: '9成新', emoji: '🏋️', description: '哑铃套装，包含2.5kg、5kg、10kg各两个，适合家庭健身使用。购买后仅使用过几次，基本全新。' },
      { id: 2, name: '瑜伽垫', price: 50, category: '运动服饰', seller: '瑜伽爱好者', time: '2天前', imgClass: 'lavender', condition: '全新', emoji: '🧘', description: '全新瑜伽垫，10mm加厚款，防滑耐磨，附带收纳带。因搬家低价转让。' },
      { id: 3, name: '蛋白粉', price: 120, category: '营养补剂', seller: '增肌战士', time: '3天前', imgClass: 'orange', condition: '8成新', emoji: '🥤', description: '乳清蛋白粉，巧克力味，还剩大半罐。原价280，低价出。保质期至年底。' },
      { id: 4, name: '跑步机', price: 800, category: '健身器材', seller: '跑步爱好者', time: '5天前', imgClass: 'rose', condition: '7成新', emoji: '🏃', description: '家用跑步机，可折叠节省空间，带坡度调节和心率监测功能。使用一年，功能完好。' },
      { id: 5, name: '运动水壶', price: 30, category: '其他', seller: '运动小白', time: '1周前', imgClass: 'sage', condition: '全新', emoji: '🍶', description: '大容量运动水壶750ml，带刻度线，BPA免费材质，全新未拆封。' },
      { id: 6, name: '健身手套', price: 45, category: '运动服饰', seller: '举铁达人', time: '2周前', imgClass: 'lavender', condition: '9成新', emoji: '🧤', description: '专业健身手套，带护腕支撑，掌心防滑硅胶垫，透气网面设计。' },
      { id: 7, name: '弹力带套装', price: 35, category: '健身器材', seller: '拉伸达人', time: '3天前', imgClass: 'sage', condition: '全新', emoji: '💪', description: '五根不同阻力弹力带，从轻到重，附带门扣和手柄，适合全身训练。全新未拆封。' },
      { id: 8, name: '运动背包', price: 80, category: '运动服饰', seller: '户外爱好者', time: '4天前', imgClass: 'orange', condition: '8成新', emoji: '🎒', description: '运动背包30L，独立鞋仓和湿物隔层，多口袋设计，透气背板。用过几次，成色很好。' },
      { id: 9, name: '左旋肉碱', price: 60, category: '营养补剂', seller: '减脂小能手', time: '5天前', imgClass: 'lavender', condition: '全新', emoji: '💊', description: '左旋肉碱液体版，蓝莓味，运动前30分钟饮用效果更佳。全新未拆封，保质期充足。' },
      { id: 10, name: '筋膜枪', price: 200, category: '健身器材', seller: '按摩达人', time: '1周前', imgClass: 'rose', condition: '9成新', emoji: '🔫', description: '筋膜枪迷你款，4个按摩头，6档力度调节，Type-C充电，续航持久。' },
      { id: 11, name: '跳绳', price: 25, category: '健身器材', seller: '跳绳爱好者', time: '1周前', imgClass: 'sage', condition: '全新', emoji: '⏭', description: '钢丝轴承跳绳，双轴承设计转动顺滑，可调节长度，附带计数器。全新。' },
      { id: 12, name: '健身腰带', price: 55, category: '运动服饰', seller: '深蹲王者', time: '2周前', imgClass: 'orange', condition: '8成新', emoji: '🎯', description: '专业健身腰带，加厚牛皮材质，双排扣设计，深蹲硬拉必备。用过几次。' }
    ],
    filteredGoods: [],
    // 品牌推荐
    brands: [
      { id: 1, name: 'FitPro专业蛋白粉', desc: '运动营养专家', emoji: '🥤', gradient: 'brand-sage' },
      { id: 2, name: 'IronMaster铁人健身', desc: '专业健身器材', emoji: '🏋️', gradient: 'brand-orange' },
      { id: 3, name: 'YogaLife瑜伽生活', desc: '瑜伽装备精选', emoji: '🧘', gradient: 'brand-lavender' }
    ],
    showBrandModal: false,
    // 图片上传相关
    postImages: [],
    maxImageCount: 9
  },

  onLoad() {
    this.loadPosts()
    this.filterGoods()
  },

  // 切换Tab
  switchTab(e) {
    const tab = e.currentTarget.dataset.tab
    this.setData({ currentTab: tab })
  },

  // 加载动态数据
  loadPosts() {
    const avatarColors = ['#96AD93', '#E3A37D', '#B5B5C1', '#CC858E', '#D49790']
    const mockPosts = [
      {
        id: 1,
        avatarColor: avatarColors[0],
        avatarText: '健',
        nickname: '健身小达人',
        time: '10分钟前',
        content: '今天完成了30分钟HIIT训练！感觉全身都在燃烧，流汗的感觉太爽了！坚持就是胜利，第15天打卡！',
        images: [],
        likes: 128,
        comments: 23,
        isLiked: false,
        commentList: [
          { cid: 1, user: '运动小白', content: '太厉害了！我也要开始', time: '5分钟前' },
          { cid: 2, user: '健康生活家', content: '加油加油', time: '8分钟前' }
        ]
      },
      {
        id: 2,
        avatarColor: avatarColors[1],
        avatarText: '减',
        nickname: '减脂战士',
        time: '1小时前',
        content: '分享今天的健康午餐，鸡胸肉沙拉+糙米饭，总热量只有450kcal！低脂高蛋白，减脂期也能吃得饱饱的～',
        images: [],
        likes: 256,
        comments: 45,
        isLiked: true,
        commentList: [
          { cid: 1, user: '美食爱好者', content: '看起来好好吃！求食谱', time: '50分钟前' },
          { cid: 2, user: '健身教练Amy', content: '搭配得很棒，蛋白质充足', time: '55分钟前' }
        ]
      },
      {
        id: 3,
        avatarColor: avatarColors[2],
        avatarText: '瑜',
        nickname: '瑜伽爱好者Lisa',
        time: '2小时前',
        content: '晨练打卡，今天练习了60分钟流瑜伽，感觉身心都得到了放松。推荐大家尝试一下，特别适合久坐的上班族！',
        images: [],
        likes: 189,
        comments: 34,
        isLiked: false,
        commentList: [
          { cid: 1, user: '办公室小王', content: '确实需要动起来了', time: '1小时前' }
        ]
      },
      {
        id: 4,
        avatarColor: avatarColors[3],
        avatarText: '跑',
        nickname: '跑步达人阿杰',
        time: '3小时前',
        content: '晨跑10公里完成！配速5分30秒，比上周进步了15秒。天气真好，沿途风景美如画。坚持跑步的第100天！',
        images: [],
        likes: 342,
        comments: 67,
        isLiked: true,
        commentList: [
          { cid: 1, user: '跑友联盟', content: '大神！配速太快了', time: '2小时前' },
          { cid: 2, user: '新手跑者', content: '100天太牛了，向你学习', time: '2.5小时前' }
        ]
      },
      {
        id: 5,
        avatarColor: avatarColors[4],
        avatarText: '食',
        nickname: '健康饮食博主',
        time: '5小时前',
        content: '今天做了一道超好吃的三文鱼糙米饭，营养丰富又美味！三文鱼富含Omega-3，对心脏好。做法简单，10分钟就能搞定～',
        images: [],
        likes: 421,
        comments: 89,
        isLiked: false,
        commentList: [
          { cid: 1, user: '厨房新手', content: '求详细做法！', time: '4小时前' },
          { cid: 2, user: '营养师小美', content: 'Omega-3很重要，推荐食用', time: '4.5小时前' }
        ]
      }
    ]

    this.setData({ posts: mockPosts })
  },

  // 选择分类
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({ selectedCategory: category })
    this.filterGoods()
  },

  // 筛选商品
  filterGoods() {
    const { goods, selectedCategory } = this.data
    if (selectedCategory === '全部') {
      this.setData({ filteredGoods: goods })
    } else {
      const filtered = goods.filter(item => item.category === selectedCategory)
      this.setData({ filteredGoods: filtered })
    }
  },

  // 发布打卡
  showPublish() {
    this.setData({ showPublishModal: true, newPostContent: '', postImages: [] })
  },

  onContentInput(e) {
    this.setData({ newPostContent: e.detail.value })
  },

  cancelPublish() {
    this.setData({ showPublishModal: false, newPostContent: '', postImages: [] })
  },

  publishPost() {
    const { newPostContent, posts, postImages } = this.data

    if (!newPostContent.trim()) {
      wx.showToast({ title: '请输入打卡内容', icon: 'none' })
      return
    }

    const newPost = {
      id: Date.now(),
      avatarColor: '#96AD93',
      avatarText: '我',
      nickname: '我',
      time: '刚刚',
      content: newPostContent,
      images: [],
      likes: 0,
      comments: 0,
      isLiked: false,
      commentList: []
    }

    this.setData({
      posts: [newPost, ...posts],
      showPublishModal: false,
      newPostContent: '',
      postImages: []
    })

    wx.showToast({ title: '发布成功', icon: 'success' })
  },

  // 点赞
  toggleLike(e) {
    const index = e.currentTarget.dataset.index
    const posts = this.data.posts
    const post = posts[index]

    post.isLiked = !post.isLiked
    post.likes += post.isLiked ? 1 : -1

    this.setData({ posts })
  },

  // 显示评论
  showComment(e) {
    const index = e.currentTarget.dataset.index
    this.setData({
      showCommentModal: true,
      currentPostIndex: index,
      newCommentContent: ''
    })
  },

  onCommentInput(e) {
    this.setData({ newCommentContent: e.detail.value })
  },

  cancelComment() {
    this.setData({ showCommentModal: false, newCommentContent: '' })
  },

  submitComment() {
    const { newCommentContent, currentPostIndex, posts } = this.data

    if (!newCommentContent.trim()) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }

    const newComment = {
      user: '我',
      content: newCommentContent,
      time: '刚刚'
    }

    posts[currentPostIndex].commentList.push(newComment)
    posts[currentPostIndex].comments += 1

    this.setData({
      posts,
      showCommentModal: false,
      newCommentContent: '',
      currentPostIndex: null
    })

    wx.showToast({ title: '评论成功', icon: 'success' })
  },

  // 发布商品
  publishGoods() {
    wx.navigateTo({
      url: '/pages/market-publish/market-publish'
    })
  },

  // 显示品牌入驻弹窗
  showBrandJoin() {
    this.setData({ showBrandModal: true })
  },

  // 关闭品牌入驻弹窗
  hideBrandModal() {
    this.setData({ showBrandModal: false })
  },

  // 复制联系微信号
  copyBrandWechat() {
    wx.setClipboardData({
      data: 'FitMarket_Brand',
      success: () => {
        wx.showToast({ title: '微信号已复制', icon: 'success' })
      }
    })
  },

  // 跳转商品详情
  goToGoodsDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/goods-detail/goods-detail?id=${id}`
    })
  },

  // 想要商品
  wantItem(e) {
    const id = e.currentTarget.dataset.id
    const goods = this.data.goods
    const item = goods.find(g => g.id === id)
    if (!item) return

    wx.showModal({
      title: '确认购买',
      content: `确认购买 ${item.name}？`,
      confirmText: '确认',
      confirmColor: '#E3A37D',
      success: (res) => {
        if (res.confirm) {
          wx.navigateTo({
            url: `/pages/goods-detail/goods-detail?id=${id}`
          })
        }
      }
    })
  },

  // 选择图片
  chooseImage() {
    const { postImages, maxImageCount } = this.data
    const remaining = maxImageCount - postImages.length
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' })
      return
    }

    wx.chooseImage({
      count: remaining,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const newImages = res.tempFilePaths
        this.setData({
          postImages: [...postImages, ...newImages]
        })
      }
    })
  },

  // 删除已选图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const postImages = this.data.postImages
    postImages.splice(index, 1)
    this.setData({ postImages })
  },

  // 预览已选图片
  previewPostImage(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.postImages[index],
      urls: this.data.postImages
    })
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      urls: [this.data.posts[index].images.join(',')]
    })
  },

  shareAppMessage() {
    return {
      title: '健身打卡社区',
      path: '/pages/community/community'
    }
  }
})