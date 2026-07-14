const app = getApp()

Page({
  data: {
    groups: [],
    topics: [],
    posts: [],
    showCommentsId: null,
    commentInput: ''
  },

  onLoad: function () {
    this.initData()
  },

  initData: function() {
    this.setData({
      groups: [
        {
          id: 0,
          icon: '🐕',
          name: '朝阳区·望京宠物互助群',
          desc: '望京地区宠物主人互助交流群，定期组织线下遛狗聚会',
          members: 2341,
          location: '朝阳区',
          joined: false
        },
        {
          id: 1,
          icon: '🐱',
          name: '北京猫咪领养群',
          desc: '流浪猫救助、领养信息发布，帮助毛孩子找到温暖的家',
          members: 1567,
          location: '北京市',
          joined: true
        },
        {
          id: 2,
          icon: '🐩',
          name: '西城·德胜门宠物群',
          desc: '西城地区宠物主人交流，分享养宠经验',
          members: 892,
          location: '西城区',
          joined: false
        }
      ],
      topics: app.globalData.topics,
      posts: [
        {
          id: 0,
          avatar: '李',
          author: '李先生',
          time: '30分钟前',
          content: '终于找到毛毛了！感谢群里各位的帮忙，真的太感动了！😭',
          images: ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=300&fit=crop'],
          hasImages: true,
          tags: ['#寻宠成功#', '#感谢#'],
          likes: 128,
          comments: 45,
          liked: false,
          commentList: [
            { id: 0, avatar: '王', name: '王女士', time: '20分钟前', content: '太好了！恭喜恭喜！' },
            { id: 1, avatar: '张', name: '张先生', time: '15分钟前', content: '毛毛看起来很开心的样子~' },
            { id: 2, avatar: '刘', name: '刘女士', time: '10分钟前', content: '太棒了！希望所有毛孩子都能回家' }
          ]
        },
        {
          id: 1,
          avatar: '王',
          author: '王女士',
          time: '1小时前',
          content: '今天在软件园发现一只流浪橘猫，看起来很饿，有没有附近的朋友愿意帮忙照顾一下？',
          images: ['https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=300&h=300&fit=crop'],
          hasImages: true,
          tags: ['#流浪猫#', '#求助#'],
          likes: 67,
          comments: 23,
          liked: true,
          commentList: [
            { id: 0, avatar: '李', name: '李先生', time: '50分钟前', content: '我在附近，我可以先带回家照顾' },
            { id: 1, avatar: '陈', name: '陈女士', time: '40分钟前', content: '已经转发了，希望能找到主人' }
          ]
        },
        {
          id: 2,
          avatar: '张',
          author: '张先生',
          time: '2小时前',
          content: '分享一下我家金毛的训练心得，希望对新手家长有帮助！',
          images: [],
          hasImages: false,
          tags: ['#训练技巧#', '#金毛#'],
          likes: 89,
          comments: 15,
          liked: false,
          commentList: [
            { id: 0, avatar: '赵', name: '赵先生', time: '1小时前', content: '学到了！我家那只就是太皮了' }
          ]
        }
      ]
    })
  },

  toggleJoin: function(e) {
    const id = e.currentTarget.dataset.id
    const groups = this.data.groups
    const group = groups.find(g => g.id === id)
    
    if (group) {
      group.joined = !group.joined
      this.setData({
        groups: groups
      })
      
      wx.showToast({
        title: group.joined ? '已加入群聊' : '已退出群聊',
        icon: 'none'
      })
    }
  },

  goToTopic: function(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/topic-detail/topic-detail?id=${id}`
    })
  },

  likePost: function(e) {
    const id = e.currentTarget.dataset.id
    const posts = this.data.posts
    const post = posts.find(p => p.id === id)
    
    if (post) {
      post.liked = !post.liked
      post.likes += post.liked ? 1 : -1
      this.setData({
        posts: posts
      })
    }
  },

  toggleComments: function(e) {
    const id = e.currentTarget.dataset.id
    this.setData({
      showCommentsId: this.data.showCommentsId === id ? null : id,
      commentInput: ''
    })
  },

  onCommentInput: function(e) {
    this.setData({
      commentInput: e.detail.value
    })
  },

  postComment: function(e) {
    if (!this.data.commentInput.trim()) {
      wx.showToast({ title: '请输入评论内容', icon: 'none' })
      return
    }
    const id = e.currentTarget.dataset.id
    const posts = this.data.posts
    const post = posts.find(p => p.id === id)
    if (post) {
      const newComment = {
        id: post.commentList.length,
        avatar: '我',
        name: '我',
        time: '刚刚',
        content: this.data.commentInput
      }
      post.commentList.unshift(newComment)
      post.comments += 1
      this.setData({
        posts: posts,
        commentInput: ''
      })
      wx.showToast({ title: '评论成功', icon: 'success' })
    }
  },

  sharePost: function(e) {
    const id = e.currentTarget.dataset.id
    const post = this.data.posts.find(p => p.id === id)
    wx.showActionSheet({
      itemList: ['微信好友', '朋友圈', 'QQ', '微博', '复制链接'],
      success: (res) => {
        if (res.tapIndex === 0) {
          wx.showToast({ title: '分享给微信好友', icon: 'none' })
        } else if (res.tapIndex === 1) {
          wx.showToast({ title: '分享到朋友圈', icon: 'none' })
        } else if (res.tapIndex === 2) {
          wx.showToast({ title: '分享到QQ', icon: 'none' })
        } else if (res.tapIndex === 3) {
          wx.showToast({ title: '分享到微博', icon: 'none' })
        } else if (res.tapIndex === 4) {
          wx.setClipboardData({
            data: `宠迹PetTrace - ${post.content}`,
            success: () => {
              wx.showToast({ title: '链接已复制', icon: 'success' })
            }
          })
        }
      }
    })
  },

  onShareAppMessage: function() {
    return {
      title: '宠迹PetTrace - 与同城爱宠人士互助交流',
      path: '/pages/community/community'
    }
  },

  onShareTimeline: function() {
    return {
      title: '宠迹PetTrace - 与同城爱宠人士互助交流'
    }
  }
})
