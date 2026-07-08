const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

// 加载 .env（轻量手写解析，避免再装 dotenv 依赖）
const envPath = path.join(__dirname, '..', '.env')
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/)
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
}

const solveRoute = require('./routes/solve')
const ocrRoute = require('./routes/ocr')
const usageRoute = require('./routes/usage')

const app = express()
const PORT = parseInt(process.env.PORT || '3000', 10)

app.use(cors())
app.use(express.json({ limit: '1mb' }))

// 静态前端
app.use(express.static(path.join(__dirname, '..', 'public')))

// API
app.use('/api/solve', solveRoute)
app.use('/api/ocr', ocrRoute)
app.use('/api/usage', usageRoute)

// 健康检查
app.get('/api/health', (req, res) => {
  const { pickLLM } = require('./lib/solver')
  const llm = pickLLM()
  res.json({
    ok: true,
    llmProvider: llm.provider,
    hasZhipuKey: !!process.env.ZHIPU_API_KEY,
    model: process.env.LLM_MODEL || 'glm-4-plus',
    time: new Date().toISOString()
  })
})

app.listen(PORT, () => {
  const { pickLLM } = require('./lib/solver')
  const llm = pickLLM()
  console.log(`[web] AI 数学答疑 Web 版启动: http://localhost:${PORT}`)
  console.log(`[web] LLM 后端: ${llm.provider}${llm.provider === 'mock' ? '（未配置 ZHIPU_API_KEY，使用预置样例）' : ''}`)
  console.log(`[web] 静态演示版: http://localhost:${PORT}/static-demo.html`)
})
