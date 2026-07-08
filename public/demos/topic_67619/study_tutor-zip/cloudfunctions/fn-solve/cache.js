const crypto = require('crypto')

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
  const res = await db.collection('questions').where({ hash }).limit(1).get()
  return res.data.length > 0 ? res.data[0] : null
}

async function saveQuestion(db, question) {
  const now = new Date()
  const doc = {
    hash: question.hash,
    rawText: question.rawText || '',
    cleanedText: question.cleanedText,
    latexText: question.latexText || '',
    imageUrl: question.imageUrl || '',
    topic: question.solution.topic,
    difficulty: question.solution.difficulty,
    solution: question.solution,
    createdAt: now
  }
  const res = await db.collection('questions').add({ data: doc })
  return res._id
}

module.exports = {
  serializeForHash,
  computeHash,
  findByHash,
  saveQuestion
}
