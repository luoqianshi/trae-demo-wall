/* ============================================================
 * Vector - 向量计算与语义搜索
 * 对标 Reference-php includes/memory/Vector.php
 * 提供：余弦相似度、topK 检索、TF-IDF 降级方案
 * ============================================================ */

const Vector = {

  // ===== 基础向量运算 =====

  // 余弦相似度
  // 为什么用余弦而非欧氏距离：文本向量维度高且稀疏，余弦对幅度不敏感
  cosine(a, b){
    if(!a || !b || a.length !== b.length) return 0;
    let dot = 0, normA = 0, normB = 0;
    for(let i = 0; i < a.length; i++){
      dot += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dot / denom;
  },

  // 从向量数组中取最相似的 K 个
  topK(vectors, queryVec, k = 5){
    if(!vectors || vectors.length === 0) return [];
    const scored = vectors.map((v, idx) => ({
      idx,
      similarity: this.cosine(queryVec, v.vector || v),
      data: v,
    }));
    scored.sort((a, b) => b.similarity - a.similarity);
    return scored.slice(0, k);
  },

  // ===== TF-IDF 降级方案 =====
  // 当 AI API 不支持 embedding 时，使用 TF-IDF 关键词向量
  // 为什么用 TF-IDF：无需外部 API，纯本地计算，对中文文本有合理的语义区分度

  // 中文分词（简易版：按 2-4 字滑窗提取词组）
  // 为什么不用 jieba：CDN 架构无构建步骤，无法引入分词库
  tokenize(text){
    if(!text) return [];
    const tokens = [];
    // 清洗：移除标点和空白
    const clean = text.replace(/[^\u4e00-\u9fa5a-zA-Z0-9]/g, ' ');
    // 2-gram 和 3-gram 滑窗
    const chars = clean.replace(/\s+/g, '');
    for(let len = 2; len <= 4; len++){
      for(let i = 0; i <= chars.length - len; i++){
        tokens.push(chars.substr(i, len));
      }
    }
    return tokens;
  },

  // 构建词汇表
  buildVocab(texts){
    const vocab = new Set();
    for(const text of texts){
      const tokens = this.tokenize(text);
      for(const t of tokens) vocab.add(t);
    }
    return Array.from(vocab);
  },

  // 计算单个文本的 TF 向量
  computeTF(text, vocab){
    const tokens = this.tokenize(text);
    const tfMap = {};
    for(const t of tokens){
      tfMap[t] = (tfMap[t] || 0) + 1;
    }
    // 归一化
    const total = tokens.length || 1;
    const vector = new Array(vocab.length).fill(0);
    for(let i = 0; i < vocab.length; i++){
      const count = tfMap[vocab[i]] || 0;
      vector[i] = count / total;
    }
    return vector;
  },

  // 计算 IDF（逆文档频率）
  computeIDF(texts, vocab){
    const idf = new Array(vocab.length).fill(0);
    const N = texts.length || 1;
    for(let i = 0; i < vocab.length; i++){
      let df = 0;
      for(const text of texts){
        if(text.includes(vocab[i])) df++;
      }
      // IDF = log(N / (df + 1))，加 1 平滑
      idf[i] = Math.log((N + 1) / (df + 1)) + 1;
    }
    return idf;
  },

  // 计算 TF-IDF 向量
  computeTFIDF(text, vocab, idf){
    const tf = this.computeTF(text, vocab);
    const vector = new Array(vocab.length).fill(0);
    for(let i = 0; i < vocab.length; i++){
      vector[i] = tf[i] * idf[i];
    }
    return vector;
  },

  // 批量计算 TF-IDF 向量
  computeBatchTFIDF(texts, vocab, idf){
    return texts.map(text => this.computeTFIDF(text, vocab, idf));
  },

  // ===== 向量压缩/解压（节省存储空间）=====
  // 将浮点数组压缩为 base64 字符串
  pack(vector){
    if(!vector || vector.length === 0) return '';
    try{
      // 量化到 0-255 范围（损失精度但节省 75% 空间）
      const max = Math.max(...vector.map(Math.abs));
      const scale = max > 0 ? 127 / max : 1;
      const bytes = new Uint8Array(vector.length);
      for(let i = 0; i < vector.length; i++){
        bytes[i] = Math.round(vector[i] * scale + 128);
      }
      // 转为 base64
      let binary = '';
      for(let i = 0; i < bytes.length; i++){
        binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
    }catch(e){
      // 降级：JSON 字符串
      return JSON.stringify(vector);
    }
  },

  unpack(packed){
    if(!packed) return [];
    try{
      if(packed.startsWith('[')){
        // JSON 降级格式
        return JSON.parse(packed);
      }
      // base64 解码
      const binary = atob(packed);
      const bytes = new Uint8Array(binary.length);
      for(let i = 0; i < binary.length; i++){
        bytes[i] = binary.charCodeAt(i);
      }
      // 反量化
      const vector = new Array(bytes.length);
      for(let i = 0; i < bytes.length; i++){
        vector[i] = (bytes[i] - 128) / 127;
      }
      return vector;
    }catch(e){
      console.warn('Vector.unpack 失败', e);
      return [];
    }
  },

  // ===== EmbeddingProvider — 对标 Reference-php EmbeddingProvider.php =====
  // 优先调用 AI API 获取 embedding，降级到 TF-IDF
};

// ============================================================
// EmbeddingProvider - 嵌入向量提供者
// 对标 Reference-php includes/memory/EmbeddingProvider.php
// ============================================================
const EmbeddingProvider = {

  // API embedding 调用（如果 API 支持）
  async embed(text){
    if(store.mode !== 'api') return null;
    if(!store.config?.base || !store.config?.key) return null;

    try{
      const { base, key, model } = store.config;
      const res = await fetch(base.replace(/\/$/,'') + '/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model: 'text-embedding-3-small',
          input: text.slice(0, 8000), // 限制输入长度
        }),
      });

      if(!res.ok) return null;
      const json = await res.json();
      const embedding = json.data?.[0]?.embedding;
      if(!embedding || !Array.isArray(embedding)) return null;

      return {
        vector: embedding,
        source: 'api',
        dim: embedding.length,
      };
    }catch(e){
      console.info('[EmbeddingProvider] API embedding 不可用，降级到 TF-IDF');
      return null;
    }
  },

  // 批量嵌入
  async embedBatch(texts){
    const results = [];
    for(const text of texts){
      const result = await this.embed(text);
      results.push(result);
    }
    return results;
  },

  // TF-IDF 降级方案
  // 当 API 不支持 embedding 时，使用 TF-IDF 构建语义向量
  embedTFIDF(text, vocab, idf){
    return {
      vector: Vector.computeTFIDF(text, vocab, idf),
      source: 'tfidf',
      dim: vocab.length,
    };
  },

  // 检查 API 是否支持 embedding
  async checkSupport(){
    const test = await this.embed('测试');
    return test !== null;
  },
};

window.Vector = Vector;
window.EmbeddingProvider = EmbeddingProvider;
