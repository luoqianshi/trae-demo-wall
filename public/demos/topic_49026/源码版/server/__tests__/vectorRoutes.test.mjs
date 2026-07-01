import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import { spawn } from 'node:child_process'
import { setTimeout } from 'node:timers/promises'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

function request(port, pathname, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        hostname: 'localhost',
        port,
        path: pathname,
        method,
        headers: { 'Content-Type': 'application/json' },
      },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf-8')
          try {
            resolve({ status: res.statusCode, body: text ? JSON.parse(text) : null })
          } catch {
            resolve({ status: res.statusCode, body: text })
          }
        })
      }
    )
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

describe('Vector routes', () => {
  let child
  let tmpDir
  const port = 3103

  before(async () => {
    tmpDir = path.join(os.tmpdir(), `zvec-routes-test-${Date.now()}`)
    fs.mkdirSync(tmpDir, { recursive: true })
    child = spawn('node', ['server/index.mjs'], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        PORT: String(port),
        ZVEC_DATA_DIR: tmpDir,
        ZVEC_EMBEDDING_DIMENSION: '4',
        DEEPSEEK_API_KEY: 'dummy',
      },
    })
    await setTimeout(1000)
  })

  after(() => {
    if (child) child.kill()
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true })
    } catch {}
  })

  it('indexes, counts, and searches documents', async () => {
    let res = await request(port, '/api/vector/index', 'POST', {
      sourceType: 'memory',
      sourceId: 'm1',
      text: 'hello',
      embedding: [1, 0, 0, 0],
      createdAt: Date.now(),
    })
    assert.equal(res.status, 200)
    assert.equal(res.body.ok, true)

    res = await request(port, '/api/vector/count', 'GET')
    assert.equal(res.status, 200)
    assert.equal(res.body.count, 1)

    res = await request(port, '/api/vector/search', 'POST', {
      queryEmbedding: [1, 0, 0, 0],
      limit: 5,
    })
    assert.equal(res.status, 200)
    assert.equal(res.body.results.length, 1)
    assert.equal(res.body.results[0].sourceId, 'm1')
    assert.ok(res.body.results[0].similarity > 0.99)
  })

  it('rebuilds the index', async () => {
    const res = await request(port, '/api/vector/rebuild', 'POST', {
      items: [
        { sourceType: 'memory', sourceId: 'r1', text: 'one', embedding: [1, 0, 0, 0], createdAt: Date.now() },
        { sourceType: 'memory', sourceId: 'r2', text: 'two', embedding: [0, 1, 0, 0], createdAt: Date.now() },
      ],
    })
    assert.equal(res.status, 200)
    assert.equal(res.body.count, 2)
  })

  it('clears the index', async () => {
    let res = await request(port, '/api/vector/clear', 'POST')
    assert.equal(res.status, 200)
    res = await request(port, '/api/vector/count', 'GET')
    assert.equal(res.body.count, 0)
  })
})
