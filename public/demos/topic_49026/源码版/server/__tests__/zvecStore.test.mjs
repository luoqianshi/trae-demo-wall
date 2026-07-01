import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'

const tmpRoot = path.join(os.tmpdir(), `zvec-store-test-${Date.now()}`)

describe('zvecStore', () => {
  let zvecStore

  before(async () => {
    fs.mkdirSync(tmpRoot, { recursive: true })
    const module = await import('../zvecStore.mjs')
    zvecStore = module.createZvecStore({ dataDir: tmpRoot, dimension: 4 })
  })

  after(() => {
    try {
      zvecStore?.close?.()
    } catch {}
    fs.rmSync(tmpRoot, { recursive: true, force: true })
  })

  it('indexes and retrieves a document by vector similarity', async () => {
    await zvecStore.indexItem({
      sourceType: 'memory',
      sourceId: 'm1',
      text: 'hello world',
      embedding: [1, 0, 0, 0],
      createdAt: Date.now(),
    })

    const results = await zvecStore.search({
      queryEmbedding: [1, 0, 0, 0],
      limit: 5,
    })

    assert.equal(results.length, 1)
    assert.equal(results[0].sourceType, 'memory')
    assert.equal(results[0].sourceId, 'm1')
    assert.equal(results[0].text, 'hello world')
    assert.ok(results[0].similarity > 0.99)
  })

  it('filters by sourceType', async () => {
    await zvecStore.indexItem({
      sourceType: 'diary',
      sourceId: 'd1',
      text: 'diary entry',
      embedding: [0, 1, 0, 0],
      createdAt: Date.now(),
    })

    const results = await zvecStore.search({
      queryEmbedding: [0, 1, 0, 0],
      sourceType: 'diary',
      limit: 5,
    })

    assert.equal(results.length, 1)
    assert.equal(results[0].sourceType, 'diary')
    assert.equal(results[0].sourceId, 'd1')
  })

  it('returns tiered results by createdAt', async () => {
    const now = Date.now()
    await zvecStore.clear()
    await zvecStore.indexItem({
      sourceType: 'memory',
      sourceId: 'hot',
      text: 'recent',
      embedding: [1, 0, 0, 0],
      createdAt: now - 86400000,
    })
    await zvecStore.indexItem({
      sourceType: 'memory',
      sourceId: 'cold',
      text: 'old',
      embedding: [1, 0, 0, 0],
      createdAt: now - 180 * 86400000,
    })

    const tiers = await zvecStore.tieredSearch({
      queryEmbedding: [1, 0, 0, 0],
      sourceType: 'memory',
      hotLimit: 5,
      warmLimit: 5,
      coldLimit: 5,
      now,
    })

    assert.equal(tiers.hot.length, 1)
    assert.equal(tiers.hot[0].sourceId, 'hot')
    assert.equal(tiers.cold.length, 1)
    assert.equal(tiers.cold[0].sourceId, 'cold')
    assert.equal(tiers.warm.length, 0)
  })

  it('rebuilds the index from a batch of items', async () => {
    await zvecStore.rebuild([
      { sourceType: 'memory', sourceId: 'r1', text: 'one', embedding: [1, 0, 0, 0], createdAt: Date.now() },
      { sourceType: 'memory', sourceId: 'r2', text: 'two', embedding: [0, 1, 0, 0], createdAt: Date.now() },
    ])

    const count = await zvecStore.count()
    assert.equal(count, 2)

    const results = await zvecStore.search({ queryEmbedding: [1, 0, 0, 0], limit: 5 })
    assert.equal(results.length, 2)
    assert.equal(results[0].sourceId, 'r1')
  })

  it('clears all documents', async () => {
    await zvecStore.clear()
    assert.equal(await zvecStore.count(), 0)
  })
})
