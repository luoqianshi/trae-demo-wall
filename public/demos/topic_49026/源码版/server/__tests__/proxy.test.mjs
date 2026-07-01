import { describe, it } from 'node:test'
import assert from 'node:assert'
import http from 'node:http'
import { spawn } from 'node:child_process'
import { setTimeout } from 'node:timers/promises'

describe('LLM proxy', () => {
  let child

  it('starts and responds 401 when auth required and token missing', async () => {
    child = spawn('node', ['server/index.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: '3101', REQUIRE_AUTH: 'true', API_TOKEN: 'test-token' },
    })
    await setTimeout(800)

    const res = await new Promise((resolve, reject) => {
      const req = http.request({ hostname: 'localhost', port: 3101, path: '/api/chat/completions', method: 'POST' }, resolve)
      req.on('error', reject)
      req.end()
    })
    assert.strictEqual(res.statusCode, 401)
    child.kill()
  })

  it('returns 401 when provider key missing', async () => {
    child = spawn('node', ['server/index.mjs'], {
      cwd: process.cwd(),
      env: { ...process.env, PORT: '3102', DEEPSEEK_API_KEY: '', DOUBAO_API_KEY: '' },
    })
    await setTimeout(800)

    const res = await new Promise((resolve, reject) => {
      const req = http.request({ hostname: 'localhost', port: 3102, path: '/api/chat/completions', method: 'POST', headers: { 'x-provider': 'deepseek' } }, resolve)
      req.on('error', reject)
      req.end()
    })
    assert.strictEqual(res.statusCode, 401)
    child.kill()
  })
})
