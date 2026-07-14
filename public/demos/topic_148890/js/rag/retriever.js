/**
 * 暖归 RAG 检索引擎 - 简易 TF-IDF 实现
 * 比赛 Demo 用：零依赖、可在浏览器直接跑、可视化检索过程
 * 生产环境建议替换为：Embedding + 向量数据库（Chroma/Milvus/pgvector）
 */

(function() {
  'use strict';

  const STOP_WORDS = new Set([
    '的', '了', '和', '是', '在', '我', '有', '不', '这', '也', '就', '都',
    '而', '及', '与', '或', '但', '如果', '因为', '所以', '可以', '应该',
    '怎么', '如何', '什么', '哪些', '是否', '需要', '我们', '你', '他', '她',
    '它', '一个', '一些', '这个', '那个', '没有', '可能', '会', '要', '想',
    '到', '从', '为', '以', '对', '把', '让', '使', '被', '由', '所'
  ]);

  /**
   * 中文简易分词（按字符 + 二元组，模拟分词效果）
   * 生产环境建议用 jieba-node / nodejieba / 哈工大 LTP
   */
  function tokenize(text) {
    if (!text) return [];
    const cleaned = text.toLowerCase().replace(/[，。！？、；：""''《》【】()（）\[\]\d\.\,!?;:\(\)\s]+/g, ' ');
    const tokens = [];

    for (let i = 0; i < cleaned.length; i++) {
      const c = cleaned[i];
      if (c.trim() && !STOP_WORDS.has(c)) {
        tokens.push(c);
      }
    }

    for (let i = 0; i < cleaned.length - 1; i++) {
      const c1 = cleaned[i], c2 = cleaned[i + 1];
      if (c1.trim() && c2.trim() && !STOP_WORDS.has(c1 + c2)) {
        tokens.push(c1 + c2);
      }
    }

    return tokens;
  }

  /**
   * 计算词频
   */
  function termFrequency(tokens) {
    const tf = {};
    tokens.forEach(t => { tf[t] = (tf[t] || 0) + 1; });
    const total = tokens.length || 1;
    Object.keys(tf).forEach(k => { tf[k] = tf[k] / total; });
    return tf;
  }

  /**
   * 构建倒排索引
   */
  function buildIndex(docs) {
    const df = {}; // 文档频率
    const docTokens = docs.map(doc => {
      const fullText = (doc.title + ' ' + doc.content + ' ' + (doc.tags || []).join(' ') + ' ' + doc.category).toLowerCase();
      const tokens = tokenize(fullText);
      const uniqueTokens = new Set(tokens);
      uniqueTokens.forEach(t => { df[t] = (df[t] || 0) + 1; });
      return { doc, tokens, tf: termFrequency(tokens) };
    });

    return { docTokens, df, totalDocs: docs.length };
  }

  /**
   * 计算 TF-IDF 相似度
   */
  function search(index, query, topK = 5) {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) return [];

    const queryTf = termFrequency(queryTokens);
    const scores = [];

    index.docTokens.forEach(({ doc, tokens, tf }) => {
      let score = 0;
      Object.keys(queryTf).forEach(term => {
        if (tf[term]) {
          const idf = Math.log(index.totalDocs / (index.df[term] || 1) + 1);
          score += queryTf[term] * tf[term] * idf;
        }
      });

      // 标题命中加权（大幅提高权重）
      const titleLower = doc.title.toLowerCase();
      queryTokens.forEach(qt => {
        if (titleLower.includes(qt)) score += 2.0;
      });

      // 标签命中加权
      if (doc.tags) {
        doc.tags.forEach(tag => {
          if (queryTokens.some(qt => tag.toLowerCase().includes(qt))) score += 0.5;
        });
      }

      // 分类命中加权
      const catLower = doc.category.toLowerCase();
      queryTokens.forEach(qt => {
        if (catLower.includes(qt)) score += 0.3;
      });

      if (score > 0) {
        scores.push({ doc, score });
      }
    });

    scores.sort((a, b) => b.score - a.score);
    return scores.slice(0, topK).map(s => ({
      ...s.doc,
      relevanceScore: s.score
    }));
  }

  // 暴露到全局
  window.NuanguiRetriever = {
    tokenize,
    buildIndex,
    search
  };
})();
