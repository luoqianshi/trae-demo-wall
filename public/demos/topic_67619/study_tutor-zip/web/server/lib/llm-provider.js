const axios = require('axios')

const ZHIPU_ENDPOINT = 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
const TIMEOUT_MS = 30000

async function callLLM(messages, options = {}) {
  const apiKey = options.apiKey || process.env.ZHIPU_API_KEY
  if (!apiKey) {
    throw new Error('ZHIPU_API_KEY is not set')
  }

  const model = options.model || process.env.LLM_MODEL || 'glm-4-plus'
  const temperature = options.temperature ?? 0.3

  const body = {
    model,
    messages,
    temperature,
    response_format: { type: 'json_object' }
  }

  const config = {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    timeout: TIMEOUT_MS
  }

  const resp = await axios.post(ZHIPU_ENDPOINT, body, config)
  const content = resp.data.choices[0].message.content
  return {
    content,
    usage: resp.data.usage,
    model
  }
}

module.exports = { callLLM, ZHIPU_ENDPOINT, TIMEOUT_MS }
