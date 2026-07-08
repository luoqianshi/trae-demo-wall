// ===== 常量模块 (Constants) =====
// 物品名 → emoji 映射
window.HomeStash = window.HomeStash || {}
HomeStash.constants = (function () {
  const EMOJI_MAP = {
    '牛奶': '🥛', '雨伞': '🌂', '伞': '🌂', '方便面': '🍜', '泡面': '🍜',
    '生抽': '🧂', '酱油': '🧂', '洗发水': '🧴', '沐浴露': '🧴', '药': '💊',
    '感冒': '🌿', '胶囊': '💊', '卷纸': '🧻', '纸巾': '🧻', '螺丝刀': '🔧',
    '扳手': '🔧', '锤子': '🔨', '创可贴': '🩹', '保鲜膜': '🧊', '苹果': '🍎',
    '香蕉': '🍌', '面包': '🍞', '鸡蛋': '🥚', '牙膏': '🪥', '牙刷': '🪥',
    '电池': '🔋', '可乐': '🥤', '饮料': '🥤', '水': '💧', '盐': '🧂',
    '糖': '🍬', '米': '🍚', '面': '🍜', '油': '🫗', '茶': '🍵', '咖啡': '☕'
  }

  const CATEGORY_EMOJI = { food: '🍎', daily: '🧴', medicine: '💊', tool: '🔧', other: '📦' }

  const CATEGORY_LABELS = { food: '食品', daily: '日用品', medicine: '药品', tool: '工具', other: '其他' }

  const CATEGORIES = [
    { value: 'all', label: '全部', emoji: '📦' },
    { value: 'food', label: '食品', emoji: '🍎' },
    { value: 'daily', label: '日用品', emoji: '🧴' },
    { value: 'medicine', label: '药品', emoji: '💊' },
    { value: 'tool', label: '工具', emoji: '🔧' },
    { value: 'other', label: '其他', emoji: '📦' }
  ]

  // 编辑页 emoji 选择器
  const EMOJI_OPTIONS = ['📦', '🥫', '🧴', '💊', '🔧', '🧻', '🧼', '🧂', '🍚', '🥢', '🧊', '🪣', '🧹', '🗑️', '🛒', '🔋']

  // 成员头像选择
  const AVATAR_OPTIONS = ['😊', '👨', '👩', '👦', '👧', '🧔', '👴', '👵', '🧑', '👶']

  const STORAGE_KEYS = {
    items: 'home_stash_items_v2',
    aiConfig: 'home_stash_ai_config_v2',
    appConfig: 'home_stash_app_config_v2',
    members: 'home_stash_members_v2',
    chatHistory: 'home_stash_chat_history',
    searchHistory: 'search_history'
  }

  const DEFAULT_AI_CONFIG = {
    provider: 'openai',
    apiKey: '',
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    temperature: 0.7,
    topP: 1,
    maxTokens: 1024,
    mockEnabled: true
  }

  const DEFAULT_APP_CONFIG = {
    chatHistory: [],
    persistEnabled: true,
    lowStockThreshold: 2,
    reminder: {
      expiryEnabled: true,
      expiryDays: 7,
      borrowEnabled: true,
      borrowDays: 30
    }
  }

  const AI_SYSTEM_PROMPT = `你是家庭物品管理助手。请根据用户输入返回严格的 JSON 对象:{"action":"add|update|delete|search|chat","payload":{...},"reply":"给用户的自然语言回复"}

action 说明:
- add: 新增物品。payload 字段: name, category, qty, unit, location, expiry, notes, emoji
- update: 修改物品。payload 字段: id 或 name, 以及要修改的字段
- delete: 删除物品。payload 字段: id 或 name
- search: 查询物品。payload 字段: keywords 数组 或 filters 对象
- chat: 普通聊天。payload 为空对象 {}

category 可选值: food/daily/medicine/tool/other
请只返回 JSON,不要添加 markdown 代码块或其他说明。`

  // 12 条预置演示数据生成函数
  function buildDemoItems() {
    const now = new Date()
    const dfn = (n) => { const d = new Date(now); d.setDate(d.getDate() + n); return d.toISOString().split('T')[0] }
    const iso = (daysAgo) => new Date(Date.now() - daysAgo * 86400000).toISOString()
    return [
      { id: 1, name: '牛奶', emoji: '🥛', category: 'food', location: '冰箱 › 冷藏室', qty: 2, unit: '瓶', expiry: dfn(3), favorite: true, borrowed: false, borrower: '', notes: '低脂', tags: ['早餐'], use_count: 5, createdAt: iso(0) },
      { id: 2, name: '面包', emoji: '🍞', category: 'food', location: '餐桌', qty: 1, unit: '个', expiry: dfn(-2), favorite: false, borrowed: false, borrower: '', notes: '', tags: [], use_count: 1, createdAt: iso(1) },
      { id: 3, name: '感冒药', emoji: '💊', category: 'medicine', location: '药箱', qty: 1, unit: '盒', expiry: dfn(180), favorite: false, borrowed: false, borrower: '', notes: '布洛芬', tags: ['常备药'], use_count: 2, createdAt: iso(7) },
      { id: 4, name: '洗发水', emoji: '🧴', category: 'daily', location: '卫生间', qty: 1, unit: '瓶', expiry: null, favorite: false, borrowed: false, borrower: '', notes: '', tags: [], use_count: 3, createdAt: iso(3) },
      { id: 5, name: '卷纸', emoji: '🧻', category: 'daily', location: '储物间', qty: 8, unit: '卷', expiry: null, favorite: false, borrowed: false, borrower: '', notes: '', tags: ['日用品'], use_count: 8, createdAt: iso(10) },
      { id: 6, name: '螺丝刀', emoji: '🔧', category: 'tool', location: '工具箱', qty: 1, unit: '把', expiry: null, favorite: false, borrowed: true, borrower: '爸爸', notes: '', tags: [], use_count: 1, borrowDate: iso(5), createdAt: iso(30) },
      { id: 7, name: '雨伞', emoji: '🌂', category: 'other', location: '玄关', qty: 2, unit: '把', expiry: null, favorite: true, borrowed: false, borrower: '', notes: '', tags: [], use_count: 4, createdAt: iso(15) },
      { id: 8, name: '电池', emoji: '🔋', category: 'tool', location: '抽屉', qty: 4, unit: '节', expiry: null, favorite: false, borrowed: false, borrower: '', notes: '5号电池', tags: [], use_count: 2, createdAt: iso(20) },
      { id: 9, name: '鸡蛋', emoji: '🥚', category: 'food', location: '冰箱', qty: 12, unit: '个', expiry: dfn(7), favorite: false, borrowed: false, borrower: '', notes: '', tags: ['早餐'], use_count: 6, createdAt: iso(2) },
      { id: 10, name: '牙膏', emoji: '🪥', category: 'daily', location: '卫生间', qty: 2, unit: '支', expiry: null, favorite: false, borrowed: false, borrower: '', notes: '', tags: [], use_count: 2, createdAt: iso(5) },
      { id: 11, name: '苹果', emoji: '🍎', category: 'food', location: '冰箱', qty: 6, unit: '个', expiry: dfn(14), favorite: false, borrowed: false, borrower: '', notes: '', tags: ['水果'], use_count: 3, createdAt: iso(1) },
      { id: 12, name: '创可贴', emoji: '🩹', category: 'medicine', location: '药箱', qty: 20, unit: '片', expiry: dfn(365), favorite: false, borrowed: false, borrower: '', notes: '', tags: ['常备药'], use_count: 1, createdAt: iso(60) }
    ]
  }

  function buildDemoMembers() {
    return [{ id: 1, name: '我', role: 'admin', avatar: '😊' }]
  }

  return {
    EMOJI_MAP, CATEGORY_EMOJI, CATEGORY_LABELS, CATEGORIES,
    EMOJI_OPTIONS, AVATAR_OPTIONS, STORAGE_KEYS,
    DEFAULT_AI_CONFIG, DEFAULT_APP_CONFIG, AI_SYSTEM_PROMPT,
    buildDemoItems, buildDemoMembers
  }
})()
