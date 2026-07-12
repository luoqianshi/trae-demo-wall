Page({
  data: {
    categories: [
      { id: 'succulent', name: '多肉', icon: '🌿' },
      { id: 'foliage', name: '绿叶', icon: '🌱' },
      { id: 'flower', name: '花卉', icon: '🌸' },
      { id: 'tree', name: '木本', icon: '🌳' },
      { id: 'herb', name: '香草', icon: '🧖' }
    ],
    popularPlants: [
      { id: '1', name: '龟背竹', nameEn: 'Monsteras', image: '/images/龟背竹.jpg' },
      { id: '2', name: '绿萝', nameEn: 'Pothos', image: '/images/绿萝.jpg' },
      { id: '3', name: '白掌', nameEn: 'Peace Lily', image: '/images/白掌.jpg' },
      { id: '4', name: '琴叶榕', nameEn: 'Fiddle Leaf', image: '/images/琴叶榕.jpg' }
    ],
    featuredPlant: {
      name: '天堂鸟',
      subtitle: '向往自由的飞鸟',
      image: '/images/天堂鸟.jpg',
      description: '鹤望兰，又名天堂鸟花，叶片宽大翠绿，花型奇特宛如仙鹤翘首远望。'
    }
  },

  onLoad() {
  },

  searchPlant() {
    wx.showToast({ title: '搜索功能', icon: 'none' })
  },

  goToPlantDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({ url: `/pages/plant-detail/plant-detail?id=${id}` })
  },

  viewMore() {
    wx.showToast({ title: '查看更多', icon: 'none' })
  },

  selectCategory(e) {
    const id = e.currentTarget.dataset.id
    wx.showToast({ title: `分类：${id}`, icon: 'none' })
  }
})
