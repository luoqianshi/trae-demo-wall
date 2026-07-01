import {
  ZVecCreateAndOpen,
  ZVecOpen,
  ZVecCollectionSchema,
  ZVecDataType,
  ZVecMetricType,
  ZVecIndexType,
} from '@zvec/zvec'
import path from 'node:path'
import fs from 'node:fs'

const DEFAULT_DIMENSION = 2048
const COLLECTION_NAME = 'hengzhou_rag'

export function createZvecStore(options = {}) {
  const { dataDir, dimension = DEFAULT_DIMENSION } = options
  const collectionPath = path.join(dataDir, COLLECTION_NAME)

  let collection = null

  function getCollection() {
    if (collection) return collection

    // Zvec requires the target directory to not exist when creating.
    // If a previous collection exists, open it; otherwise create it.
    if (fs.existsSync(collectionPath)) {
      collection = ZVecOpen(collectionPath)
    } else {
      const schema = new ZVecCollectionSchema({
        name: COLLECTION_NAME,
        fields: [
          {
            name: 'sourceType',
            dataType: ZVecDataType.STRING,
            indexParams: { indexType: ZVecIndexType.INVERT },
          },
          { name: 'sourceId', dataType: ZVecDataType.STRING },
          { name: 'text', dataType: ZVecDataType.STRING },
          { name: 'createdAt', dataType: ZVecDataType.INT64 },
        ],
        vectors: [
          {
            name: 'embedding',
            dataType: ZVecDataType.VECTOR_FP32,
            dimension,
            indexParams: {
              indexType: ZVecIndexType.HNSW,
              metricType: ZVecMetricType.COSINE,
            },
          },
        ],
      })
      collection = ZVecCreateAndOpen(collectionPath, schema)
    }
    return collection
  }

  function resetCollection() {
    if (collection) {
      try {
        collection.closeSync()
      } catch {}
      collection = null
    }
  }

  function makeDocId(sourceType, sourceId) {
    return `${sourceType}__${sourceId}`
  }

  function parseDocId(docId) {
    const idx = docId.lastIndexOf('__')
    if (idx === -1) return { sourceType: '', sourceId: docId }
    return {
      sourceType: docId.slice(0, idx),
      sourceId: docId.slice(idx + 2),
    }
  }

  function toSearchResult(doc) {
    const { sourceType, sourceId } = parseDocId(doc.id)
    return {
      sourceType,
      sourceId,
      text: doc.fields?.text ?? '',
      createdAt: Number(doc.fields?.createdAt ?? 0),
      similarity: 1 - doc.score,
    }
  }

  function runVectorQuery(queryEmbedding, sourceType, topk) {
    const col = getCollection()
    const query = {
      fieldName: 'embedding',
      vector: queryEmbedding,
      topk,
      outputFields: ['sourceType', 'sourceId', 'text', 'createdAt'],
    }
    if (sourceType) {
      query.filter = `sourceType = '${sourceType}'`
    }
    return col.querySync(query).map(toSearchResult)
  }

  async function indexItem(item) {
    const col = getCollection()
    const { sourceType, sourceId, text, embedding, createdAt } = item
    col.upsertSync({
      id: makeDocId(sourceType, sourceId),
      vectors: { embedding },
      fields: { sourceType, sourceId, text, createdAt: Number(createdAt) },
    })
  }

  async function search({ queryEmbedding, sourceType, limit = 10, minSimilarity = 0 }) {
    const docs = runVectorQuery(queryEmbedding, sourceType, Math.max(limit * 2, 10))
    return docs
      .filter((r) => r.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit)
  }

  async function tieredSearch({
    queryEmbedding,
    sourceType,
    hotLimit = 5,
    warmLimit = 5,
    coldLimit = 3,
    minSimilarity = 0,
    now = Date.now(),
  }) {
    const DAY = 86400000
    const hotCutoff = now - 7 * DAY
    const warmCutoff = now - 90 * DAY

    // Fetch a generous pool so we can split by recency client-side.
    const pool = await search({
      queryEmbedding,
      sourceType,
      limit: Math.max(hotLimit + warmLimit + coldLimit, 20) * 2,
      minSimilarity,
    })

    const hot = pool.filter((r) => r.createdAt >= hotCutoff).slice(0, hotLimit)
    const warm = pool
      .filter((r) => r.createdAt >= warmCutoff && r.createdAt < hotCutoff)
      .slice(0, warmLimit)
    const cold = pool.filter((r) => r.createdAt < warmCutoff).slice(0, coldLimit)

    return {
      hot: hot.map((r) => ({ ...r, tier: 'hot' })),
      warm: warm.map((r) => ({ ...r, tier: 'warm' })),
      cold: cold.map((r) => ({ ...r, tier: 'cold' })),
    }
  }

  async function rebuild(items) {
    const col = getCollection()
    col.destroySync()
    resetCollection()
    const fresh = getCollection()
    if (items.length === 0) return
    fresh.upsertSync(
      items.map((item) => ({
        id: makeDocId(item.sourceType, item.sourceId),
        vectors: { embedding: item.embedding },
        fields: {
          sourceType: item.sourceType,
          sourceId: item.sourceId,
          text: item.text,
          createdAt: Number(item.createdAt),
        },
      }))
    )
    fresh.optimizeSync()
  }

  async function clear() {
    const col = getCollection()
    col.destroySync()
    resetCollection()
  }

  async function count() {
    const col = getCollection()
    return col.stats.docCount
  }

  function close() {
    resetCollection()
  }

  return {
    indexItem,
    search,
    tieredSearch,
    rebuild,
    clear,
    count,
    close,
  }
}
