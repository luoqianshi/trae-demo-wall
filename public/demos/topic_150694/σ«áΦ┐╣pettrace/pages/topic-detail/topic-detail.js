const app = getApp()

Page({
  data: {
    topic: {},
    joined: false,
    posts: [],
    showCommentsId: null,
    commentInput: ''
  },

  onLoad: function (options) {
    const id = parseInt(options.id)
    const topic = app.globalData.topics.find(t => t.id === id)
    if (topic) {
      this.setData({
        topic: topic
      })
      this.initPosts(id)
    }
  },

  initPosts: function(topicId) {
    const allPosts = [
      [
        {
          id: 0,
          avatar: '李',
          author: '李先生',
          time: '30分钟前',
          content: '终于找到毛毛了！感谢群里各位的帮忙，真的太感动了！😭 大家的力量真的太强大了！',
          images: ['https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=300&h=300&fit=crop'],
          hasImages: true,
          tags: ['寻宠成功', '感谢'],
          likes: 128,
          comments: 45,
          liked: false,
          commentList: [
            { id: 0, avatar: '王', name: '王女士', time: '20分钟前', content: '太好了！恭喜恭喜！' },
            { id: 1, avatar: '张', name: '张先生', time: '15分钟前', content: '毛毛看起来很开心的样子~' }
          ]
        },
        {
          id: 1,
          avatar: '陈',
          author: '陈女士',
          time: '2小时前',
          content: '我家猫咪今天早上在望京西园走丢了，银渐层，3岁，有看到的朋友请联系我！',
          images: [],
          hasImages: false,
          tags: ['寻猫启事', '望京西园'],
          likes: 56,
          comments: 23,
          liked: false,
          commentList: [
            { id: 0, avatar: '刘', name: '刘先生', time: '1小时前', content: '帮你转发了，希望早日找到！' }
          ]
        }
      ],
      [
        {
          id: 0,
          avatar: '王',
          author: '王女士',
          time: '1小时前',
          content: '今天领养了一只小奶猫，好小一只，不知道该怎么照顾，有经验的朋友可以分享一下吗？',
          images: ['https://images.unsplash.com/photo-1595123550457-f518a3845449?w=300&h=300&fit=crop'],
          hasImages: true,
          tags: ['新手养猫', '求助'],
          likes: 89,
          comments: 34,
          liked: false,
          commentList: [
            { id: 0, avatar: '李', name: '李女士', time: '40分钟前', content: '注意保暖，买羊奶粉喂，太小了不能吃猫粮~' }
          ]
        }
      ],
      [
        {
          id: 0,
          avatar: '张',
          author: '张先生',
          time: '3小时前',
          content: '分享一下我家金毛的训练心得：用零食引导效果最好，要有耐心，不能打骂！',
          images: [],
          hasImages: false,
          tags: ['训练技巧', '金毛'],
          likes: 89,
          comments: 15,
          liked: false,
          commentList: [
            { id: 0, avatar: '刘', name: '刘先生', time: '2小时前', content: '学到了，我家那只就是太皮了' }
          ]
        }
      ],
      [
        {
          id: 0,
          avatar: '赵',
          author: '赵医生',
          time: '昨天',
          content: '【科普】夏天到了，宠物容易中暑，大家要注意：1.不要把宠物单独留在车里 2.保证充足饮水 3.避免正午遛狗',
          images: [],
          hasImages: false,
          tags: ['宠物医疗', '夏季防暑'],
          likes: 156,
          comments: 42,
          liked: true,
          commentList: [
            { id: 0, avatar: '陈', name: '陈女士', time: '20小时前', content: '太实用了，收藏了！' }
          ]
        }
      ]
    ]
    
    const index = topicId % allPosts.length
    this.setData({
      posts: allPosts[index] || []
    })
  },

  goBack: function() {
    wx.navigateBack()
  },

  toggleJoin: function() {
    this.setData({
      joined: !this.data.joined
    })
    wx.showToast({
      title: this.data.joined ? '已加入话题' : '已退出话题',
      icon: 'none'
    })
  },

  likePost: function(e) {
    const id = e.currentTarget.dataset.id
    const posts = this.data.posts
    const post = posts.find(p => p.id === id)
    if (post) {
      post.liked = !post.liked
      post.likes += post.liked ? 1 : -1
      this.setData({ posts: posts })
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
      title: this.data.topic.title + ' - 宠迹PetTrace',
      path: '/pages/topic-detail/topic-detail?id=' + this.data.topic.id
    }
  },

  onShareTimeline: function() {
    return {
      title: this.data.topic.title + ' - 宠迹PetTrace'
    }
  }
})
