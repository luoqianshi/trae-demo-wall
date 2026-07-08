const { callLLM, ZHIPU_ENDPOINT } = require('../llm-provider')

jest.mock('axios', () => ({
  post: jest.fn()
}))

const axios = require('axios')

describe('llm-provider', () => {
  beforeEach(() => axios.post.mockReset())

  test('ZHIPU_ENDPOINT points to glm-4 chat completions', () => {
    expect(ZHIPU_ENDPOINT).toContain('chat/completions')
  })

  test('callLLM sends messages with Authorization header', async () => {
    axios.post.mockResolvedValue({
      data: { choices: [{ message: { content: '{"confidence":5}' } }] }
    })
    const result = await callLLM([{ role: 'user', content: 'hi' }], { apiKey: 'test-key' })
    expect(axios.post).toHaveBeenCalled()
    const [url, body, config] = axios.post.mock.calls[0]
    expect(url).toBe(ZHIPU_ENDPOINT)
    expect(body.messages).toHaveLength(1)
    expect(config.headers.Authorization).toContain('Bearer')
  })

  test('callLLM returns content string from response', async () => {
    axios.post.mockResolvedValue({
      data: { choices: [{ message: { content: 'hello' } }] }
    })
    const result = await callLLM([], { apiKey: 'test-key' })
    expect(result.content).toBe('hello')
  })

  test('callLLM throws on timeout', async () => {
    axios.post.mockRejectedValue(new Error('timeout of 30000ms exceeded'))
    await expect(callLLM([], { apiKey: 'test-key' })).rejects.toThrow('timeout')
  })

  test('callLLM throws on 429 rate limit', async () => {
    const err = new Error('Request failed with status code 429')
    err.response = { status: 429, data: 'rate limited' }
    axios.post.mockRejectedValue(err)
    await expect(callLLM([], { apiKey: 'test-key' })).rejects.toThrow('429')
  })
})
