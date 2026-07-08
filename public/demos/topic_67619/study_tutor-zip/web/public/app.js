const API_BASE = '/api'

const state = {
  solution: null,
  questionId: null,
  visibleLevel: 1,
  feedbackSubmitted: false,
  mistakeAdded: false,
  cacheHit: false
}

const TAB_TITLES = { input: '拍照答疑', mistakes: '错题本', profile: '我的' }

// ============ Init ============
async function init() {
  bindExamples()
  await loadModeTag()
}

function bindExamples() {
  document.querySelectorAll('.example-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.getElementById('questionInput').value = btn.dataset.text
      document.getElementById('inputHint').textContent = '已填入示例题，点"让 AI 讲解"'
      document.getElementById('inputHint').classList.remove('error')
    })
  })
}

async function loadModeTag() {
  const tag = document.getElementById('modeTag')
  const aboutProvider = document.getElementById('aboutProvider')
  try {
    const r = await fetch(`${API_BASE}/health`)
    const j = await r.json()
    if (j.llmProvider === 'mock') {
      tag.textContent = 'Mock 模式 · 预置样例'
      tag.classList.add('mock')
      aboutProvider.textContent = `mock（预置 ${j.model || ''}样例，未配置智谱 key）`
    } else {
      tag.textContent = `已接入 ${j.model || 'GLM-4-Plus'}`
      aboutProvider.textContent = `${j.model}（真实 AI）`
    }
  } catch (err) {
    tag.textContent = '后端未连接'
    tag.classList.add('mock')
    aboutProvider.textContent = '后端未连接，请先 npm start'
  }
}

// ============ Tab switching ============
function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab))
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
  const screenMap = { input: 'screen-input', mistakes: 'screen-mistakes', profile: 'screen-profile' }
  const target = document.getElementById(screenMap[tab])
  if (target) target.classList.add('active')
  document.getElementById('navTitle').textContent = TAB_TITLES[tab] || ''
  document.getElementById('screenScroll').scrollTop = 0
  if (tab === 'mistakes') loadMistakes()
  if (tab === 'profile') loadProfile()
}

// ============ Solve ============
async function solveQuestion() {
  const text = document.getElementById('questionInput').value.trim()
  const hint = document.getElementById('inputHint')
  if (!text) {
    hint.textContent = '题目不能为空'
    hint.classList.add('error')
    return
  }
  hint.classList.remove('error')

  showLoading('AI 思考中…')
  setTimeout(() => updateLoading('生成分层提示…'), 700)

  try {
    const r = await fetch(`${API_BASE}/solve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
      body: JSON.stringify({ cleanedText: text })
    })
    const j = await r.json()
    hideLoading()

    if (!j.ok) {
      hint.textContent = '生成失败：' + (j.error || '未知错误')
      hint.classList.add('error')
      return
    }

    state.solution = j.solution
    state.questionId = j.questionId
    state.cacheHit = !!j.cacheHit
    state.visibleLevel = 1
    state.feedbackSubmitted = false
    state.mistakeAdded = false

    renderSolution()
    // 切到 solve 屏幕（仍属 input tab 的子流程，复用 nav 标题）
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
    document.querySelector('.tab[data-tab="input"]').classList.add('active')
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
    document.getElementById('screen-solve').classList.add('active')
    document.getElementById('navTitle').textContent = 'AI 讲解'
    document.getElementById('screenScroll').scrollTop = 0
  } catch (err) {
    hideLoading()
    hint.textContent = '网络错误：' + err.message
    hint.classList.add('error')
  }
}

// ============ Render solution ============
function renderSolution() {
  const sol = state.solution
  if (!sol) return

  const meta = document.getElementById('solveMeta')
  const diffClass = sol.difficulty === '易' ? 'green' : sol.difficulty === '难' ? 'yellow' : ''
  meta.innerHTML = `
    <span class="tag">${escapeHtml(sol.topic)}</span>
    <span class="tag ${diffClass}">${escapeHtml(sol.difficulty)}</span>
    <span class="tag ${sol.confidence >= 4 ? 'green' : 'yellow'}">置信度 ${sol.confidence}/5</span>
    ${state.cacheHit ? '<span class="tag gray">缓存命中</span>' : ''}
  `

  renderSolveBody()
}

function renderSolveBody() {
  const sol = state.solution
  const body = document.getElementById('solveBody')
  const level = state.visibleLevel

  const parts = []

  // 题意理解
  parts.push(`
    <div class="card">
      <div class="card-title">题意理解</div>
      <div class="card-body">${renderFormula(sol.restatement)}</div>
    </div>
  `)

  // 思路提示
  let hintsHtml = `
    <div class="hint-step">
      <span class="step-label">第 1 层</span>
      <div class="step-text">${renderFormula(sol.hint1)}</div>
    </div>
  `
  if (level >= 2) {
    hintsHtml += `
      <div class="hint-step">
        <span class="step-label">第 2 层</span>
        <div class="step-text">${renderFormula(sol.hint2)}</div>
      </div>
    `
  }
  let btnHtml = ''
  if (level === 1) {
    btnHtml = `<button class="ghost-btn" onclick="showHint2()">还是没思路，再细一点</button>`
  } else if (level === 2) {
    btnHtml = `<button class="ghost-btn" onclick="showFull()">直接看完整解析</button>`
  }
  parts.push(`
    <div class="card">
      <div class="card-title">思路提示</div>
      ${hintsHtml}
      ${btnHtml}
    </div>
  `)

  // 完整解析
  if (level >= 3) {
    const stepsHtml = (sol.solution_steps || []).map(s => `
      <div class="solve-step">
        <div class="num">${escapeHtml(String(s.step))}</div>
        <div class="body">
          <div class="content">${renderFormula(s.content)}</div>
          <div class="basis">${escapeHtml(s.basis || '')}</div>
        </div>
      </div>
    `).join('')
    const finalClean = cleanBoxed(sol.final_answer)
    parts.push(`
      <div class="card">
        <div class="card-title">完整解析</div>
        ${stepsHtml}
        <div class="answer-box">
          <div class="label">最终答案</div>
          <div class="value">${renderFormula(finalClean)}</div>
        </div>
        ${sol.confidence < 4 && sol.uncertain_part ? `
          <div class="uncertain">
            <strong>AI 不确定：</strong>${escapeHtml(sol.uncertain_part)}
          </div>
        ` : ''}
      </div>
    `)

    // 反馈 + 加入错题本
    const fbHtml = state.feedbackSubmitted ? `
      <div class="card">
        <div class="card-title">已收到反馈</div>
        <div class="card-body" style="color:var(--gray);">谢谢，我们会用于改进 AI。</div>
      </div>
    ` : `
      <div class="card">
        <div class="card-title">答案对吗？</div>
        <div class="card-body" style="font-size:13px;color:var(--gray);margin-bottom:12px;">🤖 AI 生成 · 最后核对：你</div>
        <div class="feedback-row">
          <button class="fb-btn good" onclick="submitFeedback(true)">👍 对</button>
          <button class="fb-btn bad" onclick="submitFeedback(false)">👎 错</button>
        </div>
      </div>
    `
    parts.push(fbHtml)

    const addBtnClass = state.mistakeAdded ? 'primary-action done' : 'primary-action'
    const addBtnText = state.mistakeAdded ? '✓ 已加入错题本' : '加入错题本'
    parts.push(`<button class="${addBtnClass}" onclick="addToMistakes()" ${state.mistakeAdded ? 'disabled' : ''}>${addBtnText}</button>`)
  }

  body.innerHTML = parts.join('')
}

function showHint2() {
  state.visibleLevel = 2
  renderSolveBody()
}

function showFull() {
  state.visibleLevel = 3
  renderSolveBody()
  document.getElementById('screenScroll').scrollTop = document.getElementById('screenScroll').scrollHeight
}

// ============ Feedback ============
async function submitFeedback(correct) {
  if (state.feedbackSubmitted) return
  try {
    await fetch(`${API_BASE}/usage/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
      body: JSON.stringify({ questionId: state.questionId, correct })
    })
  } catch (err) {
    console.error(err)
  }
  state.feedbackSubmitted = true
  renderSolveBody()
  showToast(correct ? '感谢反馈 ❤' : '已记录，我们会核查')
}

// ============ Add to mistakes ============
async function addToMistakes() {
  if (state.mistakeAdded || !state.questionId) return
  try {
    const r = await fetch(`${API_BASE}/usage/mistakes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-user-id': 'demo-user' },
      body: JSON.stringify({ questionId: state.questionId })
    })
    const j = await r.json()
    state.mistakeAdded = true
    renderSolveBody()
    showToast(j.duplicated ? '已在错题本中' : '已加入错题本 ✓')
  } catch (err) {
    showToast('保存失败')
  }
}

// ============ Mistakes list ============
async function loadMistakes() {
  const list = document.getElementById('mistakesList')
  const count = document.getElementById('mistakesCount')
  list.innerHTML = '<div class="empty-state">加载中…</div>'
  try {
    const r = await fetch(`${API_BASE}/usage/mistakes`, { headers: { 'x-user-id': 'demo-user' } })
    const j = await r.json()
    if (!j.ok || j.items.length === 0) {
      list.innerHTML = '<div class="empty-state">还没有错题，先去拍一道题试试</div>'
      count.textContent = '0 道'
      return
    }
    count.textContent = `${j.items.length} 道`
    list.innerHTML = j.items.map(m => {
      const q = m.question
      if (!q) return ''
      const diffClass = q.difficulty === '易' ? 'green' : q.difficulty === '难' ? 'yellow' : ''
      return `
        <div class="mistake-card" onclick="openMistake('${m.questionId}')">
          <div class="mistake-meta">
            <span class="tag">${escapeHtml(q.topic)}</span>
            <span class="tag ${diffClass}">${escapeHtml(q.difficulty)}</span>
          </div>
          <div class="mistake-text">${escapeHtml(q.cleanedText)}</div>
          <div class="mistake-footer">
            <span>${formatTime(m.addedAt)}</span>
            <span class="status">待复习</span>
          </div>
        </div>
      `
    }).join('')
  } catch (err) {
    list.innerHTML = '<div class="empty-state">加载失败</div>'
  }
}

function openMistake(questionId) {
  // 直接从 mistakes list 的 item 拿 question 数据需要重新请求；这里复用 cache findById
  fetch(`${API_BASE}/usage/mistakes`, { headers: { 'x-user-id': 'demo-user' } })
    .then(r => r.json())
    .then(j => {
      const item = j.items.find(m => m.questionId === questionId)
      if (!item || !item.question) return
      state.solution = item.question.solution
      state.questionId = item.questionId
      state.cacheHit = true
      state.visibleLevel = 1
      state.feedbackSubmitted = false
      state.mistakeAdded = true
      renderSolution()
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'))
      document.querySelector('.tab[data-tab="input"]').classList.add('active')
      document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'))
      document.getElementById('screen-solve').classList.add('active')
      document.getElementById('navTitle').textContent = 'AI 讲解'
      document.getElementById('screenScroll').scrollTop = 0
    })
}

// ============ Profile ============
async function loadProfile() {
  const quota = document.getElementById('profileQuota')
  const stats = document.getElementById('profileStats')
  quota.innerHTML = '加载中…'
  stats.innerHTML = '加载中…'
  try {
    const [qRes, sRes] = await Promise.all([
      fetch(`${API_BASE}/usage/check`, { headers: { 'x-user-id': 'demo-user' } }).then(r => r.json()),
      fetch(`${API_BASE}/usage/stats`, { headers: { 'x-user-id': 'demo-user' } }).then(r => r.json())
    ])
    quota.innerHTML = `
      <div class="stat-row"><span class="label">当前方案</span><span class="value">${qRes.plan === 'pro' ? '订阅会员' : '免费版'}</span></div>
      <div class="stat-row"><span class="label">今日已用</span><span class="value">${qRes.dailyUsed} / ${qRes.dailyLimit ?? '∞'}</span></div>
      <div class="stat-row"><span class="label">剩余</span><span class="value highlight">${qRes.remaining === Infinity ? '无限' : qRes.remaining + ' 次'}</span></div>
    `
    const hitRate = (sRes.cacheHitRate * 100).toFixed(0)
    stats.innerHTML = `
      <div class="stat-row"><span class="label">累计答疑</span><span class="value">${sRes.totalCalls} 次</span></div>
      <div class="stat-row"><span class="label">缓存命中</span><span class="value">${sRes.cacheHits} 次（${hitRate}%）</span></div>
      <div class="stat-row"><span class="label">累计 token</span><span class="value">${sRes.totalTokens}</span></div>
      <div class="stat-row"><span class="label">累计成本</span><span class="value highlight">¥${sRes.totalCostYuan}</span></div>
      <div class="stat-row"><span class="label">错题本</span><span class="value">${sRes.mistakeCount} 道</span></div>
      <div class="stat-row"><span class="label">反馈数</span><span class="value">${sRes.feedbackCount} 条</span></div>
    `
  } catch (err) {
    quota.innerHTML = '<div style="color:var(--error)">加载失败</div>'
    stats.innerHTML = '<div style="color:var(--error)">加载失败</div>'
  }
}

// ============ Helpers ============
function showLoading(text) {
  const o = document.getElementById('loading')
  document.getElementById('loadingText').textContent = text
  o.classList.add('show')
}
function updateLoading(text) {
  document.getElementById('loadingText').textContent = text
}
function hideLoading() {
  document.getElementById('loading').classList.remove('show')
}

let toastTimer
function showToast(msg) {
  const t = document.getElementById('toast')
  t.textContent = msg
  t.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => t.classList.remove('show'), 2200)
}

function escapeHtml(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * 轻量 LaTeX → 纯文本渲染（无 CDN 依赖，适合截图）。
 * 基于括号深度匹配，正确处理 \boxed{\dfrac{4}{5}} 这类嵌套花括号。
 * - \boxed{X} / \text{X} → X（递归处理内部）
 * - \dfrac{a}{b} / \frac{a}{b} → a/b
 * - \sqrt{x} → √(x)
 * - \alpha \pi \cdot \leq ... → 对应符号
 * - \\ → 换行（\n，由调用方决定是否转 <br>）
 * - 其余 \command → command（剥离反斜杠）
 */
const LATEX_SYMBOLS = {
  alpha: 'α', beta: 'β', gamma: 'γ', delta: 'δ', epsilon: 'ε', theta: 'θ',
  lambda: 'λ', mu: 'μ', nu: 'ν', pi: 'π', rho: 'ρ', sigma: 'σ', phi: 'φ',
  omega: 'Ω', infty: '∞', cdot: '·', times: '×', div: '÷', pm: '±', mp: '∓',
  leq: '≤', geq: '≥', neq: '≠', approx: '≈', equiv: '≡', propto: '∝',
  in: '∈', notin: '∉', subset: '⊂', subseteq: '⊆', cup: '∪', cap: '∩',
  forall: '∀', exists: '∃', rightarrow: '→', leftarrow: '←', Rightarrow: '⇒',
  sin: 'sin', cos: 'cos', tan: 'tan', cot: 'cot', log: 'log', ln: 'ln',
  deg: '°', quad: ' ', qquad: '  '
}

/** 给定 s[start] === '{'，返回匹配 '}' 的索引；不匹配返回 -1 */
function findBalanced(s, start) {
  if (s[start] !== '{') return -1
  let depth = 0
  for (let i = start; i < s.length; i++) {
    if (s[i] === '{') depth++
    else if (s[i] === '}') {
      depth--
      if (depth === 0) return i
    }
  }
  return -1
}

/** 递归剥离 LaTeX 命令为纯文本 */
function stripLatex(text) {
  if (!text) return ''
  const s = String(text)
  let out = ''
  let i = 0
  while (i < s.length) {
    const ch = s[i]
    if (ch !== '\\') {
      out += ch
      i++
      continue
    }
    // 反斜杠命令：\\ 或 \[a-zA-Z]+
    if (s[i + 1] === '\\') {
      out += '\n'
      i += 2
      continue
    }
    const m = /^\\([A-Za-z]+)/.exec(s.slice(i))
    if (!m) {
      // 孤立反斜杠，保留
      out += ch
      i++
      continue
    }
    const cmd = m[1]
    i += m[0].length
    // 取一个 {...} 参数（若有）
    let inner1 = null
    if (s[i] === '{') {
      const end = findBalanced(s, i)
      if (end !== -1) {
        inner1 = s.slice(i + 1, end)
        i = end + 1
      }
    }
    switch (cmd) {
      case 'boxed':
      case 'text':
      case 'mathrm':
      case 'mathit':
      case 'textbf':
        out += inner1 != null ? stripLatex(inner1) : ''
        break
      case 'dfrac':
      case 'frac':
      case 'tfrac': {
        let inner2 = null
        if (s[i] === '{') {
          const end2 = findBalanced(s, i)
          if (end2 !== -1) {
            inner2 = s.slice(i + 1, end2)
            i = end2 + 1
          }
        }
        out += (inner1 != null ? stripLatex(inner1) : '') + (inner2 != null ? '/' + stripLatex(inner2) : '')
        break
      }
      case 'sqrt':
        out += '√(' + (inner1 != null ? stripLatex(inner1) : '') + ')'
        break
      case 'left':
      case 'right':
        // \left( \right) 等仅去除标记，保留后续符号
        break
      default:
        if (inner1 != null) {
          // 未知命令带参数：保留参数内容
          out += stripLatex(inner1)
        } else if (LATEX_SYMBOLS[cmd] !== undefined) {
          out += LATEX_SYMBOLS[cmd]
        } else {
          out += cmd
        }
    }
  }
  return out
}

/** LaTeX → HTML，用于页面渲染 */
function renderFormula(text) {
  if (!text) return ''
  return escapeHtml(stripLatex(text)).replace(/\n/g, '<br>')
}

/** 去掉 \boxed{} 等包装，返回纯文本答案 */
function cleanBoxed(s) {
  if (!s) return ''
  return stripLatex(s)
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (isNaN(d.getTime())) return ''
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前'
  if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前'
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

// Keyboard nav: ArrowRight/Left on input screen cycles example
document.addEventListener('keydown', e => {
  if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return
  // no-op for now
})

init()
