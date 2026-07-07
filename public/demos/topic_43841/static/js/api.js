/**
 * 恶魔的代价 - API 接口层
 * 与后端 Flask API 通信
 */

/**
 * 获取游戏数据
 * @returns {Promise<Object>} 游戏全部数据
 */
export async function fetchGameData() {
  const res = await fetch('/api/game-data')
  return res.json()
}

/**
 * 验证线索关联
 * @param {string} ev1 - 线索1 ID
 * @param {string} ev2 - 线索2 ID
 * @param {string[]} foundEvidences - 已发现的线索列表
 * @param {Array[]} connections - 已建立的关联列表
 * @returns {Promise<Object>} 验证结果 { valid, message, ... }
 */
export async function validateConnect(ev1, ev2, foundEvidences, connections) {
  const res = await fetch('/api/validate/connect', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ev1, ev2, found_evidences: foundEvidences, connections })
  })
  return res.json()
}

/**
 * 验证指认凶手
 * @param {string} suspectName - 嫌疑人名称
 * @param {string[]} foundEvidences - 已发现的线索列表
 * @param {Array[]} connections - 已建立的关联列表
 * @returns {Promise<Object>} 验证结果 { correct, message, ... }
 */
export async function validateAccuse(suspectName, foundEvidences, connections) {
  const res = await fetch('/api/validate/accuse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suspect_name: suspectName, found_evidences: foundEvidences, connections })
  })
  return res.json()
}
