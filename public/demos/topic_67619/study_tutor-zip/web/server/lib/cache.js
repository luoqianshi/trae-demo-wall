const crypto = require('crypto')

/**
 * Web 演示版缓存：进程内 Map。
 * 替代 cloudfunctions/fn-solve/cache.js 中的云数据库实现。
 * 接口与原版保持一致：computeHash / findByHash / saveQuestion。
 * 重启即清空，仅用于演示。
 */
const store = new Map() // hash -> question doc
const byId = new Map()  // _id -> question doc
let seq = 0

function serializeForHash(text) {
  return String(text || '')
    .replace(/\s+/g, '')
    .toLowerCase()
}

function computeHash(text) {
  const normalized = serializeForHash(text)
  return crypto.createHash('sha1').update(normalized, 'utf8').digest('hex')
}

async function findByHash(db, hash) {
  // db 参数保留以兼容原签名，Web 版忽略
  return store.get(hash) || null
}

async function saveQuestion(db, question) {
  const id = `q_${++seq}`
  const doc = {
    _id: id,
    hash: question.hash,
    rawText: question.rawText || '',
    cleanedText: question.cleanedText,
    latexText: question.latexText || '',
    imageUrl: question.imageUrl || '',
    topic: question.solution.topic,
    difficulty: question.solution.difficulty,
    solution: question.solution,
    createdAt: new Date()
  }
  store.set(question.hash, doc)
  byId.set(id, doc)
  return id
}

async function findById(id) {
  return byId.get(id) || null
}

function clear() {
  store.clear()
  byId.clear()
  seq = 0
}

module.exports = {
  serializeForHash,
  computeHash,
  findByHash,
  saveQuestion,
  findById,
  clear
}
