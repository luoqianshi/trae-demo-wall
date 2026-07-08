// ===== State 模块 (reactive state + 默认值 + 演示数据加载) =====
window.HomeStash = window.HomeStash || {}
HomeStash.state = (function () {
  const { reactive } = Vue
  const {
    DEFAULT_AI_CONFIG, DEFAULT_APP_CONFIG,
    buildDemoItems, buildDemoMembers
  } = HomeStash.constants
  const storage = HomeStash.storage

  function createInitialState() {
    return reactive({
      // 当前 Tab
      currentPage: 'home',

      // 数据
      items: [],
      members: [],
      customCategories: [],   // 自定义分类（与物品 category 字段独立）
      customLocations: [],    // 自定义位置

      // 配置
      aiConfig: { ...DEFAULT_AI_CONFIG },
      appConfig: {
        ...DEFAULT_APP_CONFIG,
        reminder: { ...DEFAULT_APP_CONFIG.reminder }
      },
      chatHistory: [],

      // Overlay 页面：detail/edit/aiSettings/borrowRecords/family/memberEdit/categories/locations/reminder/shopping/about
      overlayPage: null,
      detailItemId: null,

      // 编辑页
      editMode: 'add', // add/edit
      editForm: {},
      tagInput: '',

      // 成员编辑
      memberEditMode: 'add',
      memberEditIndex: -1,
      memberEditForm: { name: '', role: 'member', avatar: '😊' },

      // 分类/位置管理输入
      categoryInput: { emoji: '📦', name: '' },
      locationInput: '',

      // AI 抽屉
      aiDrawerVisible: false,
      aiInput: '',
      aiMessages: [],
      aiThinking: false,
      aiTestResult: '',
      isRecording: false,

      // 提醒
      reminderPanelVisible: false,
      notifiedItemIds: new Set(), // 60秒去重

      // UI 组件
      toast: { visible: false, text: '', icon: '' },
      modal: { visible: false, title: '', content: '', onConfirm: null },
      actionSheet: { visible: false, items: [] },
      borrowDialog: { visible: false, item: null, borrower: '' },

      // 清单页筛选
      listSearchKeyword: '',
      showSearchHistory: false,
      searchHistory: [],
      filterCategory: 'all',
      filterTag: '',
      listViewMode: 'category', // category/location
      reminderFilter: '',

      // 借出筛选
      borrowFilter: 'all',

      // 统计日期范围
      statsDateRange: { start: '', end: '' }
    })
  }

  // 首次启动填充演示数据；后续从 localStorage 加载
  function loadDemoData(state) {
    // 物品
    const storedItems = storage.loadItems()
    if (storedItems && storedItems.length > 0) {
      state.items = storedItems
    } else {
      state.items = buildDemoItems()
      storage.saveItems(state.items)
    }

    // 成员
    const storedMembers = storage.loadMembers()
    if (storedMembers && storedMembers.length > 0) {
      state.members = storedMembers
    } else {
      state.members = buildDemoMembers()
      storage.saveMembers(state.members)
    }

    // AI 配置（合并默认值）
    state.aiConfig = storage.loadAIConfig()

    // 应用配置
    state.appConfig = storage.loadAppConfig()

    // 聊天历史
    state.chatHistory = storage.loadChatHistory()
    state.aiMessages = state.chatHistory.slice()

    // 搜索历史
    state.searchHistory = storage.loadSearchHistory()

    // 自定义分类/位置（独立存储 key）
    try {
      state.customCategories = JSON.parse(localStorage.getItem('home_stash_custom_categories') || '[]')
      state.customLocations = JSON.parse(localStorage.getItem('home_stash_custom_locations') || '[]')
    } catch (e) {
      state.customCategories = []
      state.customLocations = []
    }
  }

  return { createInitialState, loadDemoData }
})()
