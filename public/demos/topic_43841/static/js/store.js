/**
 * 恶魔的代价 - 响应式状态管理
 * 使用 Vue 3 reactive/ref 管理游戏状态
 */
import { reactive, ref } from 'vue'

// --- 游戏运行时状态 ---
export const gameState = reactive({
  currentView: 'title',       // title | intro | game | ending
  currentScene: 'crime_scene',
  foundEvidences: [],          // 已发现的线索ID列表
  connections: [],              // 已建立的关联 [[ev1, ev2], ...]
  usedDialogs: {},             // "suspectId_topic" -> true
  currentSuspect: null,        // 当前选中的嫌疑人ID
  message: '',                 // 消息显示区文本
  gameOver: false,
  introPage: 0,                // 介绍页当前页码
  endingPage: 0,               // 结局页当前页码
  hasSave: false,              // 是否存在存档
  showSaveModal: false,        // 是否显示存档弹窗
})

// --- 游戏数据（由API填充） ---
export const gameData = reactive({
  evidences: {},               // 线索数据 { id: { name, description, location } }
  suspects: {},                // 嫌疑人数据 { id: { name, role, description, dialogs } }
  connectionResults: {},       // 关联结果
  scenes: {},                  // 场景数据
  introPages: [],              // 介绍页面文本
  endingPages: [],              // 结局页面文本
  accuseRequirements: {},      // 指认要求
  loaded: false,               // 数据是否已加载
})

/**
 * 调查线索
 * @param {string} evId - 线索ID
 */
export function investigateEvidence(evId) {
  if (!gameState.foundEvidences.includes(evId)) {
    gameState.foundEvidences.push(evId)
    gameState.message = `【发现线索】${gameData.evidences[evId].name}: ${gameData.evidences[evId].description}`
  } else {
    gameState.message = `你已经调查过${gameData.evidences[evId].name}了。`
  }
}

/**
 * 使用对话
 * @param {string} suspectId - 嫌疑人ID
 * @param {string} topic - 话题名称
 */
export function useDialog(suspectId, topic) {
  const key = `${suspectId}_${topic}`
  gameState.usedDialogs[key] = true
  const dialog = gameData.suspects[suspectId].dialogs[topic]
  gameState.message = dialog.content
}

/**
 * 检查话题是否可用
 * @param {string} suspectId - 嫌疑人ID
 * @param {string} topic - 话题名称
 * @returns {string} 'available' | 'locked' | 'used'
 */
export function isTopicAvailable(suspectId, topic) {
  const key = `${suspectId}_${topic}`
  // 已使用过
  if (gameState.usedDialogs[key]) return 'used'
  const dialog = gameData.suspects[suspectId].dialogs[topic]
  const unlock = dialog.unlock
  // 无解锁条件
  if (unlock === null) return 'available'
  // 数组条件：全部满足才解锁
  if (Array.isArray(unlock)) {
    return unlock.every(e => gameState.foundEvidences.includes(e)) ? 'available' : 'locked'
  }
  // 单个条件
  return gameState.foundEvidences.includes(unlock) ? 'available' : 'locked'
}

/**
 * 保存游戏到 localStorage
 */
export function saveGame() {
  const data = {
    foundEvidences: [...gameState.foundEvidences],
    connections: gameState.connections.map(c => [...c]),
    usedDialogs: { ...gameState.usedDialogs },
    currentScene: gameState.currentScene,
    gameOver: gameState.gameOver,
    timestamp: Date.now()
  }
  localStorage.setItem('demon_cost_save', JSON.stringify(data))
  gameState.hasSave = true
  gameState.showSaveModal = false
  gameState.message = '游戏已保存。'
}

/**
 * 从 localStorage 加载存档
 * @returns {boolean} 是否成功加载
 */
export function loadGame() {
  const raw = localStorage.getItem('demon_cost_save')
  if (!raw) return false
  const data = JSON.parse(raw)
  gameState.foundEvidences = data.foundEvidences || []
  gameState.connections = data.connections || []
  gameState.usedDialogs = data.usedDialogs || {}
  gameState.currentScene = data.currentScene || 'crime_scene'
  gameState.gameOver = data.gameOver || false
  gameState.hasSave = true
  gameState.showSaveModal = false
  return true
}

/**
 * 删除存档
 */
export function deleteSave() {
  localStorage.removeItem('demon_cost_save')
  gameState.hasSave = false
  gameState.showSaveModal = false
}

/**
 * 重置游戏状态
 */
export function resetGame() {
  gameState.currentView = 'title'
  gameState.currentScene = 'crime_scene'
  gameState.foundEvidences = []
  gameState.connections = []
  gameState.usedDialogs = {}
  gameState.currentSuspect = null
  gameState.message = ''
  gameState.gameOver = false
  gameState.introPage = 0
  gameState.endingPage = 0
}

/**
 * 检查是否存在存档
 */
export function checkSaveExists() {
  gameState.hasSave = !!localStorage.getItem('demon_cost_save')
}
