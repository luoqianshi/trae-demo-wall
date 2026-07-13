import {
  ZVecInitialize,
  ZVecCreateAndOpen,
  ZVecOpen,
  ZVecCollectionSchema,
  ZVecDataType,
  ZVecIndexType,
  ZVecMetricType,
  ZVecCollection,
  ZVecDocInput,
  ZVecQuery,
  isZVecError,
} from '@zvec/zvec';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

export interface VectorSearchOptions {
  k?: number;
  threshold?: number;
  vectorType?: 'title' | 'content' | 'summary';
}

export interface BatchVectorInsertOptions {
  model: string;
  provider: string;
  dimensions: number;
}

export interface VectorSearchResult {
  id: string;
  collectionId: string;
  vectorType: string;
  score: number;
}

export interface ZVecStats {
  totalVectors: number;
  totalCollections: number;
  indexCompleteness: Record<string, number>;
}

// ZVec requires EVERY vector field to be present in EVERY doc (vector fields
// can't be nullable). A per-type/per-chunk doc only has one vector, so we use a
// SINGLE vector field and distinguish rows via the scalar `vector_type`.
const VEC_FIELD = 'vec';

function getVectorDbPath(): string {
  try {
    const userDataPath = app.getPath('userData');
    const dbPath = path.join(userDataPath, 'zvec');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }
    return dbPath;
  } catch {
    return path.join(process.cwd(), '.data', 'zvec');
  }
}

// NOTE: ZVec rejects doc ids containing ':' (invalid character), so the
// separator is '__'. Collection ids are UUIDs (hex + hyphens, never '__') and
// vector types are plain words, so splitting on '__' is unambiguous.
const DOC_ID_SEP = '__';

function buildDocId(collectionId: string, vectorType: string): string {
  return `${collectionId}${DOC_ID_SEP}${vectorType}`;
}

// Content is chunked; each passage is stored as `${id}__content__${index}`.
function buildChunkDocId(collectionId: string, vectorType: string, index: number): string {
  return `${collectionId}${DOC_ID_SEP}${vectorType}${DOC_ID_SEP}${index}`;
}

function parseDocId(docId: string): { collectionId: string; vectorType: string } | null {
  const parts = docId.split(DOC_ID_SEP);
  // Accept both `${id}__${type}` and chunked `${id}__${type}__${index}`.
  if (parts.length < 2) return null;
  return { collectionId: parts[0], vectorType: parts[1] };
}

/** Narrow an untyped scalar field value (from @zvec/zvec's `Record<string, any>`) to a string. */
function asFieldString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export class ZVecAdapter {
  // Upper bound on content chunks per collection, used to delete stale chunks
  // by id (kept above VectorService's CHUNK_MAX_COUNT).
  private static readonly MAX_CONTENT_CHUNKS = 128;

  private collection: ZVecCollection | null = null;
  private isInitialized: boolean = false;
  private dimensions: number = 0;
  private dbPath: string;

  constructor(dbPath?: string) {
    this.dbPath = dbPath || getVectorDbPath();
  }

  /** Build the collection schema for a given vector dimension. */
  private buildSchema(dimensions: number): ZVecCollectionSchema {
    const vec = (name: string) => ({
      name,
      dataType: ZVecDataType.VECTOR_FP32,
      dimension: dimensions,
      indexParams: {
        indexType: ZVecIndexType.HNSW,
        metricType: ZVecMetricType.COSINE,
        m: 16,
        efConstruction: 100,
      },
    });
    return new ZVecCollectionSchema({
      name: 'memory_anchor',
      fields: [
        { name: 'collection_id', dataType: ZVecDataType.STRING, indexParams: { indexType: ZVecIndexType.INVERT } },
        { name: 'vector_type', dataType: ZVecDataType.STRING, indexParams: { indexType: ZVecIndexType.INVERT } },
        { name: 'model', dataType: ZVecDataType.STRING, nullable: true },
        { name: 'provider', dataType: ZVecDataType.STRING, nullable: true },
        { name: 'created_at', dataType: ZVecDataType.STRING, nullable: true },
      ],
      vectors: [vec(VEC_FIELD)],
    });
  }

  /**
   * Ensure the store is sized for `dimensions`. The configured dimension is
   * only a guess (custom endpoints vary); the actual embedding size is known at
   * write time. If it differs, rebuild the store to match so upserts succeed.
   */
  private ensureDimension(dimensions: number): void {
    if (!this.collection || dimensions <= 0 || dimensions === this.dimensions) return;
    console.warn(`[ZVec] Rebuilding store for actual embedding dimension ${this.dimensions} -> ${dimensions}`);
    const collectionPath = path.join(this.dbPath, 'memory_anchor');
    try { this.collection.destroySync(); } catch { /* ignore */ }
    try { fs.rmSync(collectionPath, { recursive: true, force: true }); } catch { /* ignore */ }
    this.collection = ZVecCreateAndOpen(collectionPath, this.buildSchema(dimensions));
    this.dimensions = dimensions;
  }

  async initialize(dimensions: number = 1536): Promise<void> {
    if (this.isInitialized) return;

    try {
      ZVecInitialize({
        logLevel: 2,
      });
    } catch (e) {
      if (!isZVecError(e) || e.code !== 'ZVEC_ALREADY_EXISTS') {
        console.warn('ZVec initialization warning:', e);
      }
    }

    this.dimensions = dimensions;
    const collectionPath = path.join(this.dbPath, 'memory_anchor');

    const schema = this.buildSchema(dimensions);

    // Open the store, recovering from a corrupted directory (e.g.
    // "create id map failed") by wiping and recreating it.
    const openOrCreate = (): ZVecCollection => {
      try {
        const c = ZVecCreateAndOpen(collectionPath, schema);
        console.log('[ZVec] Created new collection at:', collectionPath);
        return c;
      } catch (e) {
        const errStr = String(e);
        if ((isZVecError(e) && e.code === 'ZVEC_ALREADY_EXISTS') ||
            errStr.includes('exists') || errStr.includes('lock')) {
          // IMPORTANT: do NOT delete the LOCK file — ZVecOpen REQUIRES it to
          // exist ("Can't open lock file" otherwise). A leftover LOCK from an
          // ungraceful exit is fine to reopen. Deleting it made ZVecOpen fail,
          // and the fallback then wiped the whole store on every restart.
          try {
            const c = ZVecOpen(collectionPath);
            console.log('[ZVec] Opened existing collection at:', collectionPath);
            return c;
          } catch (openErr) {
            console.warn('[ZVec] Failed to open, recreating:', openErr);
            try { fs.rmSync(collectionPath, { recursive: true, force: true }); } catch { /* ignore */ }
            const c = ZVecCreateAndOpen(collectionPath, schema);
            console.log('[ZVec] Recreated collection at:', collectionPath);
            return c;
          }
        }
        // Any other error (corrupted store, e.g. "create id map failed"):
        // wipe the directory and rebuild from scratch.
        console.warn('[ZVec] Store appears corrupted, rebuilding:', errStr);
        try { fs.rmSync(collectionPath, { recursive: true, force: true }); } catch { /* ignore */ }
        const c = ZVecCreateAndOpen(collectionPath, schema);
        console.log('[ZVec] Rebuilt collection at:', collectionPath);
        return c;
      }
    };

    this.collection = openOrCreate();

    // Adopt the EXISTING store's dimension (authoritative — the configured
    // value is only a guess). If the store has an INCOMPATIBLE schema (e.g. the
    // old multi-vector-field layout without `vec`), rebuild it with the current
    // single-field schema. docCount is 0 in that case, so nothing is lost.
    try {
      const existingDim = this.collection.schema.vector(VEC_FIELD).dimension ?? 0;
      if (existingDim > 0) {
        this.dimensions = existingDim;
      }
    } catch {
      console.warn('[ZVec] Incompatible store schema; rebuilding with single-vector-field layout');
      try { this.collection.destroySync(); } catch { /* ignore */ }
      try { fs.rmSync(collectionPath, { recursive: true, force: true }); } catch { /* ignore */ }
      this.collection = ZVecCreateAndOpen(collectionPath, this.buildSchema(dimensions));
      this.dimensions = dimensions;
    }

    this.isInitialized = true;
  }

  /**
   * Rebuild the store for a new embedding dimension (e.g. after the user
   * changes the embedding model without restarting). No-op if unchanged.
   */
  async reinitialize(dimensions: number): Promise<void> {
    if (this.isInitialized && dimensions === this.dimensions) return;
    // Close the current handle before dropping the reference so the store
    // isn't left with a dangling open handle when initialize() reopens it.
    if (this.collection) {
      try { this.collection.closeSync(); } catch { /* ignore */ }
    }
    this.isInitialized = false;
    this.collection = null;
    await this.initialize(dimensions);
  }

  private ensureInitialized(): ZVecCollection {
    if (!this.collection || !this.isInitialized) {
      throw new Error('ZVec not initialized. Call initialize() first.');
    }
    return this.collection;
  }

  addVector(
    collectionId: string,
    vectorType: 'title' | 'content' | 'summary',
    vector: number[],
    model: string,
    provider: string,
    dimensions?: number
  ): { id: string; collectionId: string; vectorType: string } {
    this.ensureInitialized();
    const now = new Date().toISOString();
    const vectorField = VEC_FIELD;
    const docId = buildDocId(collectionId, vectorType);

    // Adapt the store to the real embedding size before writing, so a wrong
    // configured dimension can't silently drop every vector.
    const actualDim = dimensions || vector.length;
    if (actualDim && actualDim !== this.dimensions) {
      this.ensureDimension(actualDim);
    }
    const col = this.ensureInitialized();

    const doc: ZVecDocInput = {
      id: docId,
      vectors: {
        [vectorField]: vector,
      },
      fields: {
        collection_id: collectionId,
        vector_type: vectorType,
        model,
        provider,
        created_at: now,
      },
    };

    const status = col.upsertSync(doc);
    if (!status.ok) {
      throw new Error(`Failed to upsert vector: ${status.message}`);
    }

    return {
      id: docId,
      collectionId,
      vectorType,
    };
  }

  updateVector(
    collectionId: string,
    vectorType: 'title' | 'content' | 'summary',
    vector: number[],
    model?: string
  ): boolean {
    const col = this.ensureInitialized();
    const vectorField = VEC_FIELD;
    const docId = buildDocId(collectionId, vectorType);

    const existing = col.fetchSync({ ids: docId, includeVector: false });
    if (!existing[docId]) {
      return false;
    }

    const updateDoc: ZVecDocInput = {
      id: docId,
      vectors: {
        [vectorField]: vector,
      },
      fields: model ? { model } : undefined,
    };

    const status = col.updateSync(updateDoc);
    return status.ok;
  }

  deleteVector(collectionId: string, vectorType: 'title' | 'content' | 'summary'): boolean {
    const col = this.ensureInitialized();
    const docId = buildDocId(collectionId, vectorType);
    const status = col.deleteSync(docId);
    return status.ok;
  }

  deleteByCollectionId(collectionId: string): number {
    const col = this.ensureInitialized();
    const ids = [
      buildDocId(collectionId, 'title'),
      buildDocId(collectionId, 'summary'),
      buildDocId(collectionId, 'content'), // legacy single-content doc
      ...this.contentChunkIds(collectionId),
    ];
    try {
      const statuses = col.deleteSync(ids);
      const arr = Array.isArray(statuses) ? statuses : [statuses];
      return arr.filter((s) => s.ok).length;
    } catch {
      return 0;
    }
  }

  private contentChunkIds(collectionId: string): string[] {
    return Array.from(
      { length: ZVecAdapter.MAX_CONTENT_CHUNKS },
      (_, i) => buildChunkDocId(collectionId, 'content', i)
    );
  }

  /** Remove only the content chunks for a collection (used before re-chunking). */
  private deleteContentVectors(collectionId: string): void {
    const col = this.ensureInitialized();
    const ids = [buildDocId(collectionId, 'content'), ...this.contentChunkIds(collectionId)];
    try { col.deleteSync(ids); } catch { /* ignore */ }
  }

  /** Whether any content chunk exists for a collection (cheap existence probe). */
  hasContentVectors(collectionId: string): boolean {
    const col = this.ensureInitialized();
    try {
      const id = buildChunkDocId(collectionId, 'content', 0);
      const result = col.fetchSync({ ids: id, includeVector: false });
      return !!result[id];
    } catch {
      return false;
    }
  }

  /**
   * Store the content field as chunks: one vector per passage, id
   * `${collectionId}::content::${i}`. Replaces any existing content chunks.
   */
  addContentChunks(
    collectionId: string,
    vectors: number[][],
    model: string,
    provider: string,
    dimensions?: number
  ): number {
    this.ensureInitialized();
    const actualDim = dimensions || vectors[0]?.length || 0;
    if (actualDim && actualDim !== this.dimensions) {
      this.ensureDimension(actualDim);
    }
    const col = this.ensureInitialized();
    this.deleteContentVectors(collectionId);

    const now = new Date().toISOString();
    const docs: ZVecDocInput[] = vectors.map((vector, i) => ({
      id: buildChunkDocId(collectionId, 'content', i),
      vectors: { [VEC_FIELD]: vector },
      fields: {
        collection_id: collectionId,
        vector_type: 'content',
        model,
        provider,
        created_at: now,
      },
    }));
    if (docs.length === 0) return 0;

    const statuses = col.upsertSync(docs);
    const arr = Array.isArray(statuses) ? statuses : [statuses];
    const ok = arr.filter((s) => s.ok).length;
    if (ok === 0) {
      throw new Error(`Failed to upsert content chunks: ${arr[0]?.message ?? 'unknown'}`);
    }
    return ok;
  }

  getVector(collectionId: string, vectorType: 'title' | 'content' | 'summary'): number[] | null {
    const col = this.ensureInitialized();
    const docId = buildDocId(collectionId, vectorType);
    const vectorField = VEC_FIELD;

    try {
      const result = col.fetchSync({ ids: docId, includeVector: true });
      const doc = result[docId];
      if (!doc || !doc.vectors[vectorField]) return null;

      const vec = doc.vectors[vectorField];
      if (vec instanceof Float32Array) {
        return Array.from(vec);
      }
      if (Array.isArray(vec)) {
        return vec;
      }
      return null;
    } catch {
      return null;
    }
  }

  search(
    queryVector: number[],
    options: VectorSearchOptions = {}
  ): VectorSearchResult[] {
    const col = this.ensureInitialized();
    const { k = 10, threshold = 0.3, vectorType } = options;

    const query: ZVecQuery = {
      fieldName: VEC_FIELD,
      vector: queryVector,
      topk: k * 3,
      outputFields: ['collection_id', 'vector_type'],
      params: {
        indexType: ZVecIndexType.HNSW,
        ef: 100,
      },
    };

    // All vectors share one field; scope by row type via the scalar filter.
    // ZVec's filter grammar uses a single '=' (not '==') and requires a string.
    if (vectorType) {
      query.filter = `vector_type = "${vectorType}"`;
    }

    try {
      const results = col.querySync(query);
      // ZVec's COSINE `score` is a DISTANCE (0 = identical, 1 = orthogonal),
      // not a similarity. Convert to similarity = 1 - distance so downstream
      // code (which treats higher as better) filters/sorts/labels correctly.
      return results
        .map((doc) => ({ doc, similarity: 1 - doc.score }))
        .filter((r) => r.similarity >= threshold)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, k)
        .map(({ doc, similarity }) => {
          const parsed = parseDocId(doc.id);
          return {
            id: doc.id,
            collectionId: parsed?.collectionId || asFieldString(doc.fields.collection_id),
            vectorType: parsed?.vectorType || asFieldString(doc.fields.vector_type),
            score: similarity,
          };
        });
    } catch (error) {
      console.error('[ZVec] Search error:', error);
      return [];
    }
  }

  /**
   * Search by one or more query vectors (in practice just contentVector). All
   * vectors live in a single field, so each is a filtered search by its
   * vector_type; results merge by best score per collection.
   */
  batchSearch(
    queryVectors: {
      titleVector?: number[];
      contentVector?: number[];
      summaryVector?: number[];
    },
    options: VectorSearchOptions & { weights?: { title?: number; content?: number; summary?: number } } = {}
  ): VectorSearchResult[] {
    const runs: Array<{ vt: 'title' | 'content' | 'summary'; vec: number[] }> = [];
    if (queryVectors.contentVector) runs.push({ vt: 'content', vec: queryVectors.contentVector });
    if (queryVectors.titleVector) runs.push({ vt: 'title', vec: queryVectors.titleVector });
    if (queryVectors.summaryVector) runs.push({ vt: 'summary', vec: queryVectors.summaryVector });
    if (runs.length === 0) return [];

    if (runs.length === 1) {
      return this.search(runs[0].vec, { ...options, vectorType: runs[0].vt });
    }

    const best = new Map<string, VectorSearchResult>();
    for (const { vt, vec } of runs) {
      for (const r of this.search(vec, { ...options, vectorType: vt })) {
        const cur = best.get(r.collectionId);
        if (!cur || r.score > cur.score) best.set(r.collectionId, r);
      }
    }
    return Array.from(best.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, options.k ?? 10);
  }

  optimize(): void {
    const col = this.ensureInitialized();
    try {
      col.optimizeSync();
    } catch (error) {
      console.error('[ZVec] Optimize error:', error);
    }
  }

  getStats(): ZVecStats {
    const col = this.ensureInitialized();
    // docCount is the reliable total; compute it independently so a failure in
    // the (optional) collection-count probe can't zero out the whole stat.
    let totalVectors = 0;
    let indexCompleteness: Record<string, number> = {};
    try {
      totalVectors = col.stats.docCount;
      indexCompleteness = col.stats.indexCompleteness;
    } catch { /* ignore */ }

    let totalCollections = 0;
    try {
      totalCollections = new Set(
        Object.values(col.fetchSync({ ids: [], includeVector: false, outputFields: ['collection_id'] }))
          .map((d) => asFieldString(d.fields.collection_id))
      ).size;
    } catch { /* ignore */ }

    return { totalVectors, totalCollections, indexCompleteness };
  }

  close(): void {
    if (this.collection) {
      try {
        this.collection.closeSync();
      } catch (error) {
        console.error('[ZVec] Close error:', error);
      }
      this.collection = null;
      this.isInitialized = false;
    }
  }
}

let zVecInstance: ZVecAdapter | null = null;

export function getZVecAdapter(): ZVecAdapter {
  if (!zVecInstance) {
    zVecInstance = new ZVecAdapter();
  }
  return zVecInstance;
}

export const zVecAdapter = getZVecAdapter();
