const app = getApp()

Page({
  data: {
    pet: {},
    isFavorite: false,
    comments: [],
    commentInput: '',
    replyInput: '',
    replyId: null
  },

  onLoad: function(options) {
    const id = parseInt(options.id)
    const pet = app.globalData.petData.find(p => p.id === id)
    
    if (pet) {
      pet.publisherAvatar = pet.publisher.charAt(0)
      this.setData({
        pet: pet,
        isFavorite: this.isFavorite(id),
        comments: this.getComments(id)
      })
    }
  },

  getComments: function(id) {
    return [
      {
        id: 0,
        avatar: '王',
        name: '王女士',
        time: '10分钟前',
        content: '昨天傍晚好像在望京西园附近见过一只类似的金毛，当时正在垃圾桶旁边找东西吃，您可以去那边看看！',
        likes: 5,
        liked: false,
        replies: [],
        hasReplies: false
      },
      {
        id: 1,
        avatar: '张',
        name: '张先生',
        time: '30分钟前',
        content: '已经转发到我们小区的宠物群了，希望毛毛早日回家！',
        likes: 12,
        liked: false,
        replies: [
          {
            avatar: '李',
            name: '李先生',
            content: '感谢转发！大家的力量是无穷的 🙏',
            time: '20分钟前'
          }
        ],
        hasReplies: true
      },
      {
        id: 2,
        avatar: '刘',
        name: '刘女士',
        time: '1小时前',
        content: '毛毛好可爱！我家就在附近，帮您留意着，有消息第一时间告诉您。',
        likes: 8,
        liked: false,
        replies: [],
        hasReplies: false
      }
    ]
  },

  isFavorite: function(id) {
    try {
      const favorites = wx.getStorageSync('favorites') || []
      return favorites.includes(id)
    } catch (e) {
      return false
    }
  },

  toggleFavorite: function() {
    const id = this.data.pet.id
    let favorites = []
    
    try {
      favorites = wx.getStorageSync('favorites') || []
    } catch (e) {
      favorites = []
    }
    
    if (favorites.includes(id)) {
      favorites = favorites.filter(fid => fid !== id)
      wx.showToast({
        title: '已取消收藏',
        icon: 'none'
      })
    } else {
      favorites.push(id)
      wx.showToast({
        title: '已收藏',
        icon: 'success'
      })
    }
    
    try {
      wx.setStorageSync('favorites', favorites)
    } catch (e) {
      console.error('保存收藏失败', e)
    }
    
    this.setData({
      isFavorite: !this.data.isFavorite
    })
  },

  goBack: function() {
    wx.navigateBack()
  },

  onCommentInput: function(e) {
    this.setData({
      commentInput: e.detail.value
    })
  },

  postComment: function() {
    const text = this.data.commentInput.trim()
    if (!text) {
      wx.showToast({
        title: '请输入留言内容',
        icon: 'none'
      })
      return
    }
    
    const newComment = {
      id: Date.now(),
      avatar: '我',
      name: '我',
      time: '刚刚',
      content: text,
      likes: 0,
      liked: false,
      replies: []
    }
    
    const comments = [newComment, ...this.data.comments]
    this.setData({
      comments: comments,
      commentInput: '',
      pet: {
        ...this.data.pet,
        commentCount: this.data.pet.commentCount + 1
      }
    })
  },

  likeComment: function(e) {
    const id = e.currentTarget.dataset.id
    const comments = this.data.comments
    const comment = comments.find(c => c.id === id)
    
    if (comment) {
      comment.liked = !comment.liked
      comment.likes += comment.liked ? 1 : -1
      this.setData({
        comments: comments
      })
    }
  },

  replyComment: function(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      replyId: this.data.replyId === id ? null : id
    })
  },

  onReplyInput: function(e) {
    this.setData({
      replyInput: e.detail.value
    })
  },

  submitReply: function() {
    const text = this.data.replyInput.trim()
    if (!text || !this.data.replyId) return
    
    const comments = this.data.comments
    const comment = comments.find(c => c.id === this.data.replyId)
    
    if (comment) {
      if (!comment.replies) {
        comment.replies = []
      }
      comment.replies.push({
        avatar: '我',
        name: '我',
        content: text,
        time: '刚刚'
      })
      this.setData({
        comments: comments,
        replyInput: '',
        replyId: null
      })
    }
  },

  contactPublisher: function() {
    wx.showToast({
      title: `正在联系${this.data.pet.publisher}...`,
      icon: 'none'
    })
  },

  sharePet: function() {
    wx.showToast({
      title: '分享功能开发中',
      icon: 'none'
    })
  }
})
