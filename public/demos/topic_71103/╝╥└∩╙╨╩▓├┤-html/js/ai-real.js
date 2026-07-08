// ===== 真实 AI 调用模块 (一次性 + 流式 SSE + 图片识别 + 测试连接) =====
window.HomeStash = window.HomeStash || {}
HomeStash.aiReal = (function () {
  const { AI_SYSTEM_PROMPT } = HomeStash.constants
  const { guessCategory, guessEmoji } = HomeStash.helpers

  // 构建物品摘要
  function buildItemsSummary(items) {
    return items.map(i => ({
      id: i.id, name: i.name, category: i.category, location: i.location,
      qty: i.qty, unit: i.unit, expiry: i.expiry, borrowed: i.borrowed
    }))
  }

  // 解析 AI 返回内容为 JSON
  function parseAIContent(content) {
    if (!content) return { action: 'chat', payload: {}, reply: '已处理' }
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      return jsonMatch ? JSON.parse(jsonMatch[0]) : { action: 'chat', payload: {}, reply: content }
    } catch (e) {
      return { action: 'chat', payload: {}, reply: content }
    }
  }

  // 一次性 fetch 调用
  async function callRealAI(text, items, aiConfig) {
    const messages = [
      { role: 'system', content: AI_SYSTEM_PROMPT + '\n\n当前物品列表:\n' + JSON.stringify(buildItemsSummary(items)) },
      { role: 'user', content: text }
    ]
    const res = await fetch(aiConfig.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + aiConfig.apiKey },
      body: JSON.stringify({
        model: aiConfig.model, messages, temperature: aiConfig.temperature, max_tokens: aiConfig.maxTokens
      })
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = await res.json()
    const content = data.choices[0].message.content
    return parseAIContent(content)
  }

  // 流式 SSE 调用（逐 token 回调）
  async function callRealAIStream(text, items, aiConfig, onToken, onDone, onError) {
    const messages = [
      { role: 'system', content: AI_SYSTEM_PROMPT + '\n\n当前物品列表:\n' + JSON.stringify(buildItemsSummary(items)) },
      { role: 'user', content: text }
    ]
    try {
      const res = await fetch(aiConfig.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + aiConfig.apiKey },
        body: JSON.stringify({
          model: aiConfig.model, messages,
          temperature: aiConfig.temperature, max_tokens: aiConfig.maxTokens,
          stream: true
        })
      })
      if (!res.ok) throw new Error('HTTP ' + res.status)

      // 兼容性检查：不支持 ReadableStream 时降级
      if (!res.body || !res.body.getReader) {
        const data = await res.json()
        const content = data.choices[0].message.content
        const result = parseAIContent(content)
        if (onToken) onToken(content)
        if (onDone) onDone(result)
        return result
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let buffer = ''
      let fullContent = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // 保留最后不完整的行
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const data = trimmed.slice(5).trim()
          if (data === '[DONE]') continue
          try {
            const json = JSON.parse(data)
            const token = (json.choices[0] && json.choices[0].delta && json.choices[0].delta.content) || ''
            if (token) {
              fullContent += token
              if (onToken) onToken(token)
            }
          } catch (e) { /* 跳过解析失败的行 */ }
        }
      }

      const result = parseAIContent(fullContent)
      if (onDone) onDone(result)
      return result
    } catch (err) {
      if (onError) onError(err)
      throw err
    }
  }

  // 图片识别（vision 多模态）
  async function recognizeImage(base64, aiConfig) {
    const res = await fetch(aiConfig.baseUrl + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + aiConfig.apiKey },
      body: JSON.stringify({
        model: aiConfig.model,
        messages: [
          { role: 'system', content: '识别图片中的物品,返回 JSON: {"name":"","category":"food|daily|medicine|tool|other","qty":1,"unit":"个","emoji":"📦","location":"未分类"}' },
          { role: 'user', content: [
            { type: 'text', text: '请识别这个物品' },
            { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,' + base64 } }
          ] }
        ]
      })
    })
    if (!res.ok) throw new Error('HTTP ' + res.status)
    const data = await res.json()
    const content = data.choices[0].message.content
    const jsonMatch = content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const preset = JSON.parse(jsonMatch[0])
      return {
        name: preset.name || '未识别物品',
        emoji: preset.emoji || guessEmoji(preset.name || '', preset.category || 'other'),
        category: preset.category || 'other',
        location: preset.location || '未分类',
        qty: parseInt(preset.qty) || 1,
        unit: preset.unit || '个'
      }
    }
    return null
  }

  // 测试连接
  async function testAIConnection(aiConfig) {
    try {
      const res = await fetch(aiConfig.baseUrl + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + aiConfig.apiKey },
        body: JSON.stringify({
          model: aiConfig.model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 5
        })
      })
      if (res.status === 401) return { ok: false, message: 'API Key 无效 (401)' }
      if (res.status === 404) return { ok: false, message: '接口路径错误或模型不存在 (404)' }
      if (res.status === 429) return { ok: false, message: '请求频率超限 (429)' }
      if (!res.ok) return { ok: false, message: 'HTTP ' + res.status }
      const data = await res.json()
      return { ok: true, message: '✅ 连接成功，模型: ' + aiConfig.model }
    } catch (e) {
      return { ok: false, message: '❌ 连接失败: ' + e.message }
    }
  }

  return { callRealAI, callRealAIStream, recognizeImage, testAIConnection }
})()
