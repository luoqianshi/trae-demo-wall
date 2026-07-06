const Cloud = require('../../../utils/cloud.js')

const PAGE_SIZE = 10

const CATEGORIES = [
  { id: 'all', name: '全部' },
  { id: 'seasonal_fruit', name: '时令水果' },
  { id: 'fresh_meat', name: '生鲜肉禽' },
  { id: 'grain_ingredient', name: '米面食材' },
  { id: 'snack_shop', name: '地方小吃' },
  { id: 'seasonal_dish', name: '季节限定菜品' }
]

Page({
  data: {
    categories: CATEGORIES,
    activeCategory: 'all',
    keyword: '',
    list: [],
    page: 1,
    hasMore: true,
    loading: false,
    loadingMore: false,
    isEmpty: false,
    // 编辑/新增弹窗
    showEdit: false,
    editMode: 'create', // create | update
    editingItem: null,
    formData: {
      name: '',
      category: 'seasonal_fruit',
      images: [],
      origin: '',
      description: '',
      priceMin: '',
      priceMax: '',
      priceUnit: '元/斤',
      canMail: false
    },
    editingCategoryIndex: 0,
    processing: false
  },

  onLoad: function () {
    this.loadList(true)
  },

  onPullDownRefresh: function () {
    this.loadList(true).then(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom: function () {
    if (this.data.hasMore && !this.data.loadingMore) {
      this.loadList(false)
    }
  },

  onCategoryChange: function (e) {
    const id = e.currentTarget.dataset.id
    if (id === this.data.activeCategory) return
    this.setData({ activeCategory: id })
    this.loadList(true)
  },

  onSearchInput: function (e) {
    this.setData({ keyword: e.detail.value })
  },

  onSearchConfirm: function () {
    this.loadList(true)
  },

  onClearKeyword: function () {
    this.setData({ keyword: '' })
    this.loadList(true)
  },

  loadList: function (reset) {
    if (this.data.loading) return Promise.resolve()
    const page = reset ? 1 : this.data.page + 1

    if (reset) {
      this.setData({ loading: true, isEmpty: false })
    } else {
      this.setData({ loadingMore: true })
    }

    return Cloud.callFunction('adminManager', {
      action: 'listFoods',
      keyword: this.data.keyword,
      category: this.data.activeCategory,
      page: page,
      pageSize: PAGE_SIZE
    }).then(res => {
      const result = res.data
      if (result && result.success) {
        const newList = result.data.list
        const list = reset ? newList : [...this.data.list, ...newList]
        this.setData({
          list,
          page,
          hasMore: result.data.hasMore,
          loading: false,
          loadingMore: false,
          isEmpty: list.length === 0
        })
      } else {
        this.setData({ loading: false, loadingMore: false, isEmpty: reset })
        wx.showToast({ title: (result && result.message) || '加载失败', icon: 'none' })
      }
    }).catch(() => {
      this.setData({ loading: false, loadingMore: false, isEmpty: reset })
      wx.showToast({ title: '加载失败', icon: 'none' })
    })
  },

  onPreviewImage: function (e) {
    const { urls, current } = e.currentTarget.dataset
    wx.previewImage({ current, urls })
  },

  onShowCreate: function () {
    this.setData({
      showEdit: true,
      editMode: 'create',
      editingItem: null,
      formData: {
        name: '',
        category: 'seasonal_fruit',
        images: [],
        origin: '',
        description: '',
        priceMin: '',
        priceMax: '',
        priceUnit: '元/斤',
        canMail: false
      },
      editingCategoryIndex: 1
    })
  },

  onShowEdit: function (e) {
    const item = e.currentTarget.dataset.item
    const catIdx = CATEGORIES.findIndex(c => c.id === item.category)
    this.setData({
      showEdit: true,
      editMode: 'update',
      editingItem: item,
      formData: {
        name: item.name || '',
        category: item.category || 'seasonal_fruit',
        images: item.images || [],
        origin: item.origin || '',
        description: item.description || item.tips || '',
        priceMin: item.priceMin ? String(item.priceMin) : '',
        priceMax: item.priceMax ? String(item.priceMax) : '',
        priceUnit: item.priceUnit || '元/斤',
        canMail: !!item.canMail
      },
      editingCategoryIndex: catIdx > 0 ? catIdx : 1
    })
  },

  onCloseEdit: function () {
    if (this.data.processing) return
    this.setData({ showEdit: false, editingItem: null })
  },

  onFormInput: function (e) {
    const field = e.currentTarget.dataset.field
    this.setData({ [`formData.${field}`]: e.detail.value })
  },

  onCategoryPickerChange: function (e) {
    const index = Number(e.detail.value)
    this.setData({
      editingCategoryIndex: index,
      'formData.category': CATEGORIES[index].id
    })
  },

  onCanMailChange: function (e) {
    this.setData({ 'formData.canMail': e.detail.value })
  },

  onChooseImage: function () {
    const remaining = 9 - this.data.formData.images.length
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传9张图片', icon: 'none' })
      return
    }
    wx.chooseMedia({
      count: remaining,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFiles = res.tempFiles.map(f => f.tempFilePath)
        this.uploadImages(tempFiles)
      }
    })
  },

  uploadImages: function (filePaths) {
    wx.showLoading({ title: '上传中...', mask: true })
    const uploadPromises = filePaths.map((filePath, index) => {
      const cloudPath = `foods/${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}.jpg`
      return new Promise((resolve, reject) => {
        wx.cloud.uploadFile({
          cloudPath,
          filePath,
          success: (res) => resolve(res.fileID),
          fail: reject
        })
      })
    })

    Promise.all(uploadPromises).then(fileIDs => {
      wx.hideLoading()
      const newImages = [...this.data.formData.images, ...fileIDs]
      this.setData({ 'formData.images': newImages })
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '图片上传失败', icon: 'none' })
    })
  },

  onDeleteFormImage: function (e) {
    const index = e.currentTarget.dataset.index
    const images = [...this.data.formData.images]
    images.splice(index, 1)
    this.setData({ 'formData.images': images })
  },

  onPreviewFormImage: function (e) {
    const index = e.currentTarget.dataset.index
    const images = this.data.formData.images
    wx.previewImage({ current: images[index], urls: images })
  },

  validateForm: function () {
    const d = this.data.formData
    if (!d.name.trim()) {
      wx.showToast({ title: '请输入美食名称', icon: 'none' })
      return false
    }
    if (!d.category) {
      wx.showToast({ title: '请选择品类', icon: 'none' })
      return false
    }
    return true
  },

  onSaveFood: function () {
    if (this.data.processing) return
    if (!this.validateForm()) return

    this.setData({ processing: true })
    wx.showLoading({ title: '保存中...', mask: true })

    const submitData = {
      ...this.data.formData,
      priceMin: parseFloat(this.data.formData.priceMin) || 0,
      priceMax: parseFloat(this.data.formData.priceMax) || 0
    }

    const params = {
      action: 'manageFood',
      op: this.data.editMode === 'create' ? 'create' : 'update',
      data: submitData
    }
    if (this.data.editMode === 'update' && this.data.editingItem) {
      params.foodId = this.data.editingItem._id
    }

    Cloud.callFunction('adminManager', params).then(res => {
      wx.hideLoading()
      const result = res.data
      this.setData({ processing: false })
      if (result && result.success) {
        wx.showToast({ title: result.message || '保存成功', icon: 'success' })
        this.setData({ showEdit: false, editingItem: null })
        this.loadList(true)
      } else {
        wx.showToast({ title: (result && result.message) || '保存失败', icon: 'none' })
      }
    }).catch(() => {
      wx.hideLoading()
      this.setData({ processing: false })
      wx.showToast({ title: '保存失败', icon: 'none' })
    })
  },

  onPin: function (e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: '官方置顶',
      content: `确认将「${item.name}」设为官方置顶？将提升其 hotScore。`,
      confirmColor: '#FF6B35',
      success: (res) => {
        if (res.confirm) {
          this.doPin(item._id, item.name)
        }
      }
    })
  },

  doPin: function (foodId, name) {
    wx.showLoading({ title: '置顶中...', mask: true })
    Cloud.callFunction('adminManager', {
      action: 'manageFood',
      op: 'pin',
      foodId
    }).then(res => {
      wx.hideLoading()
      const result = res.data
      if (result && result.success) {
        wx.showToast({ title: '置顶成功', icon: 'success' })
        this.loadList(true)
      } else {
        wx.showToast({ title: (result && result.message) || '置顶失败', icon: 'none' })
      }
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '置顶失败', icon: 'none' })
    })
  },

  onDelete: function (e) {
    const item = e.currentTarget.dataset.item
    wx.showModal({
      title: '确认删除',
      content: `确认删除「${item.name}」？该操作不可恢复。`,
      confirmColor: '#F44336',
      success: (res) => {
        if (res.confirm) {
          this.doDelete(item._id, item.name)
        }
      }
    })
  },

  doDelete: function (foodId, name) {
    wx.showLoading({ title: '删除中...', mask: true })
    Cloud.callFunction('adminManager', {
      action: 'manageFood',
      op: 'delete',
      foodId
    }).then(res => {
      wx.hideLoading()
      const result = res.data
      if (result && result.success) {
        wx.showToast({ title: '删除成功', icon: 'success' })
        this.loadList(true)
      } else {
        wx.showToast({ title: (result && result.message) || '删除失败', icon: 'none' })
      }
    }).catch(() => {
      wx.hideLoading()
      wx.showToast({ title: '删除失败', icon: 'none' })
    })
  },

  stopPropagation: function () {}
})
