/**
 * 医知通 - 智能搜索引擎
 * 三层匹配策略：同义词映射 → 模糊匹配 → 意图识别
 */

const SearchEngine = {

  /**
   * 编辑距离（Levenshtein Distance）
   * 用于模糊匹配，计算两个字符串的差异程度
   */
  levenshtein(str1, str2) {
    const m = str1.length;
    const n = str2.length;
    if (m === 0) return n;
    if (n === 0) return m;

    const dp = [];
    for (let i = 0; i <= m; i++) {
      dp[i] = [i];
    }
    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // 删除
          dp[i][j - 1] + 1,      // 插入
          dp[i - 1][j - 1] + cost // 替换
        );
      }
    }
    return dp[m][n];
  },

  /**
   * 相似度评分（0-1，越高越相似）
   */
  similarity(str1, str2) {
    const maxLen = Math.max(str1.length, str2.length);
    if (maxLen === 0) return 1;
    const dist = this.levenshtein(str1.toLowerCase(), str2.toLowerCase());
    return 1 - dist / maxLen;
  },

  /**
   * 判断字符串是否包含子串（支持部分匹配）
   */
  partialMatch(query, target) {
    query = query.toLowerCase().trim();
    target = target.toLowerCase().trim();
    
    // 完全匹配
    if (target === query) return 1.0;
    // 包含匹配
    if (target.includes(query)) {
      // 越短的目标匹配分数越高（更精确）
      const ratio = query.length / target.length;
      return 0.7 + ratio * 0.2;
    }
    if (query.includes(target)) {
      return 0.65;
    }
    return 0;
  },

  /**
   * 对药品进行搜索评分
   */
  scoreDrug(drug, query) {
    let score = 0;
    const q = query.toLowerCase().trim();

    // 名称精确匹配
    let nameScore = this.partialMatch(q, drug.name);
    if (nameScore > 0) score += nameScore * 100;

    // 别名匹配
    for (const alias of drug.aliases) {
      let aliasScore = this.partialMatch(q, alias);
      if (aliasScore > 0) {
        score += aliasScore * 80;
      }
    }

    // 模糊匹配（处理打错字的情况）
    if (score === 0) {
      const nameSim = this.similarity(q, drug.name);
      if (nameSim > 0.6) score += nameSim * 60;
      
      for (const alias of drug.aliases) {
        const aliasSim = this.similarity(q, alias);
        if (aliasSim > 0.6) {
          score += aliasSim * 50;
        }
      }
    }

    // 分类匹配
    let categoryScore = this.partialMatch(q, drug.category);
    if (categoryScore > 0) score += categoryScore * 30;

    // 标签匹配
    for (const tag of drug.tags) {
      let tagScore = this.partialMatch(q, tag);
      if (tagScore > 0) score += tagScore * 25;
    }

    // 适应症匹配
    if (drug.indication.toLowerCase().includes(q) && q.length >= 2) {
      score += 15;
    }

    // 相互作用中的药品名匹配
    for (const interaction of drug.interactions) {
      let interactScore = this.partialMatch(q, interaction.drug);
      if (interactScore > 0) {
        score += interactScore * 20;
      }
    }

    return score;
  },

  /**
   * 对检验指标进行搜索评分
   */
  scoreLab(lab, query) {
    let score = 0;
    const q = query.toLowerCase().trim();

    // 名称精确匹配
    let nameScore = this.partialMatch(q, lab.name);
    if (nameScore > 0) score += nameScore * 100;

    // 别名匹配
    for (const alias of lab.aliases) {
      let aliasScore = this.partialMatch(q, alias);
      if (aliasScore > 0) {
        score += aliasScore * 80;
      }
    }

    // 模糊匹配
    if (score === 0) {
      const nameSim = this.similarity(q, lab.name);
      if (nameSim > 0.6) score += nameSim * 60;
      
      for (const alias of lab.aliases) {
        const aliasSim = this.similarity(q, alias);
        if (aliasSim > 0.6) {
          score += aliasSim * 50;
        }
      }
    }

    // 分类匹配
    let categoryScore = this.partialMatch(q, lab.category);
    if (categoryScore > 0) score += categoryScore * 30;

    // 标签匹配
    for (const tag of lab.tags) {
      let tagScore = this.partialMatch(q, tag);
      if (tagScore > 0) score += tagScore * 25;
    }

    // 临床意义匹配
    if (lab.clinicalSignificance.toLowerCase().includes(q) && q.length >= 2) {
      score += 15;
    }

    return score;
  },

  /**
   * 意图识别：从自然语言提问中提取关键实体
   * 如 "头孢能喝酒吗" → { drugs: ['头孢曲松钠'], concepts: ['酒精'] }
   */
  extractEntities(query) {
    const entities = {
      drugs: [],
      labs: [],
      concepts: [],
      intentType: null // 'contraindication', 'interaction', 'dosage', 'adverse', 'general'
    };

    const q = query.toLowerCase();

    // 意图关键词识别
    if (/能.*喝|酒|酒精|饮酒/.test(q)) {
      entities.concepts.push('酒精');
      entities.intentType = 'interaction';
    }
    if (/一起|联用|合用|同时/.test(q)) {
      entities.intentType = 'interaction';
    }
    if (/禁忌|不能|禁用|忌/.test(q)) {
      entities.intentType = 'contraindication';
    }
    if (/用法|用量|怎么吃|怎么用|剂量/.test(q)) {
      entities.intentType = 'dosage';
    }
    if (/副作用|不良反应|危害/.test(q)) {
      entities.intentType = 'adverse';
    }

    // 实体识别：在查询中匹配药品和检验指标
    const allDrugs = MEDICAL_DB.drugs;
    const allLabs = MEDICAL_DB.labs;

    for (const drug of allDrugs) {
      // 检查药品名是否出现在查询中
      if (q.includes(drug.name.toLowerCase())) {
        entities.drugs.push(drug.name);
        continue;
      }
      let matched = false;
      // 检查别名是否出现在查询中
      for (const alias of drug.aliases) {
        if (q.includes(alias.toLowerCase()) && alias.length >= 2) {
          entities.drugs.push(drug.name);
          matched = true;
          break;
        }
      }
      if (matched) continue;
      // 反向检查：药品名是否包含查询中的某个片段（如"头孢"匹配"头孢曲松钠"）
      // 提取查询中的中文片段进行匹配
      const chineseSegments = query.match(/[\u4e00-\u9fa5]{2,}/g) || [];
      for (const seg of chineseSegments) {
        if (drug.name.includes(seg) && !entities.drugs.includes(drug.name)) {
          entities.drugs.push(drug.name);
          matched = true;
          break;
        }
        for (const alias of drug.aliases) {
          if (alias.includes(seg) && !entities.drugs.includes(drug.name)) {
            entities.drugs.push(drug.name);
            matched = true;
            break;
          }
        }
        if (matched) break;
      }
    }

    for (const lab of allLabs) {
      if (q.includes(lab.name.toLowerCase())) {
        entities.labs.push(lab.name);
        continue;
      }
      let matched = false;
      for (const alias of lab.aliases) {
        if (q.includes(alias.toLowerCase()) && alias.length >= 2) {
          entities.labs.push(lab.name);
          matched = true;
          break;
        }
      }
      if (matched) continue;
      // 反向检查
      const chineseSegments = query.match(/[\u4e00-\u9fa5]{2,}/g) || [];
      for (const seg of chineseSegments) {
        if (lab.name.includes(seg) && !entities.labs.includes(lab.name)) {
          entities.labs.push(lab.name);
          break;
        }
      }
    }

    return entities;
  },

  /**
   * 智能问答：处理自然语言提问
   * 返回结构化的回答
   */
  smartAnswer(query) {
    const entities = this.extractEntities(query);
    const results = [];

    // 如果识别到了药品
    if (entities.drugs.length > 0) {
      for (const drugName of entities.drugs) {
        const drug = MEDICAL_DB.drugs.find(d => d.name === drugName);
        if (!drug) continue;

        const answer = {
          type: 'drug',
          item: drug,
          intentType: entities.intentType,
          highlights: []
        };

        // 根据意图类型高亮相应信息
        if (entities.intentType === 'interaction') {
          // 查找相关相互作用
          if (entities.concepts.includes('酒精')) {
            const alcoholInteraction = drug.interactions.find(i => 
              i.drug.includes('酒精') || i.drug.includes('酒')
            );
            if (alcoholInteraction) {
              answer.highlights.push({
                type: 'warning',
                title: '酒精相互作用警示',
                content: alcoholInteraction.effect,
                severity: alcoholInteraction.severity
              });
            }
          }
          // 查找与其他识别药品的相互作用
          for (const otherDrug of entities.drugs) {
            if (otherDrug === drugName) continue;
            const interaction = drug.interactions.find(i => 
              i.drug.toLowerCase().includes(otherDrug.toLowerCase()) ||
              otherDrug.toLowerCase().includes(i.drug.toLowerCase())
            );
            if (interaction) {
              answer.highlights.push({
                type: 'warning',
                title: `与${otherDrug}的相互作用`,
                content: interaction.effect,
                severity: interaction.severity
              });
            }
          }
        } else if (entities.intentType === 'contraindication') {
          answer.highlights.push({
            type: 'contraindication',
            title: '禁忌信息',
            content: drug.contraindications.join('；'),
            severity: 'high'
          });
        } else if (entities.intentType === 'dosage') {
          answer.highlights.push({
            type: 'info',
            title: '用法用量',
            content: drug.dosage,
            severity: 'low'
          });
        } else if (entities.intentType === 'adverse') {
          answer.highlights.push({
            type: 'caution',
            title: '不良反应',
            content: drug.adverseReactions.join('；'),
            severity: 'medium'
          });
        }

        results.push(answer);
      }
    }

    // 如果识别到了检验指标
    if (entities.labs.length > 0) {
      for (const labName of entities.labs) {
        const lab = MEDICAL_DB.labs.find(l => l.name === labName);
        if (!lab) continue;

        const answer = {
          type: 'lab',
          item: lab,
          intentType: entities.intentType,
          highlights: []
        };

        // 检查是否询问升高或降低
        if (/高|升高|增多|偏高|增高/.test(query)) {
          answer.highlights.push({
            type: 'warning',
            title: '升高的常见原因',
            content: lab.highCauses.join('；'),
            severity: 'medium'
          });
        } else if (/低|降低|减少|偏低|减低/.test(query)) {
          answer.highlights.push({
            type: 'info',
            title: '降低的常见原因',
            content: lab.lowCauses.join('；'),
            severity: 'medium'
          });
        }

        results.push(answer);
      }
    }

    return { results, entities };
  },

  /**
   * 综合搜索入口
   * @param {string} query - 用户输入
   * @param {object} options - 搜索选项
   * @returns {object} 搜索结果
   */
  search(query, options = {}) {
    if (!query || query.trim().length === 0) {
      return { results: [], type: 'empty' };
    }

    const q = query.trim();
    const limit = options.limit || 20;

    // 常规评分搜索（始终执行，不再被智能问答遮蔽）
    const scoredItems = [];

    // 搜索药品
    for (const drug of MEDICAL_DB.drugs) {
      const score = this.scoreDrug(drug, q);
      if (score > 0) {
        scoredItems.push({ type: 'drug', item: drug, score });
      }
    }

    // 搜索检验指标
    for (const lab of MEDICAL_DB.labs) {
      const score = this.scoreLab(lab, q);
      if (score > 0) {
        scoredItems.push({ type: 'lab', item: lab, score });
      }
    }

    // 按评分排序
    scoredItems.sort((a, b) => b.score - a.score);

    // 截取前 limit 条
    const topResults = scoredItems.slice(0, limit).map(s => ({
      type: s.type,
      item: s.item,
      score: s.score
    }));

    // 尝试智能问答（作为补充高亮，不遮蔽常规搜索）
    const isQuestion = /能.*喝|能.*吃吗|能.*用吗|能.*服用|可以.*一起|联用|合用|同时.*服用|禁忌|不能.*用|副作用|不良反应|怎么.*用|怎么.*吃|用法|用量|剂量|什么.*原因|什么.*意思|偏高|偏低|升高|降低|多少.*算/.test(q);

    let smartHighlights = [];
    let entities = null;

    if (isQuestion && q.length >= 4) {
      const smartResult = this.smartAnswer(q);
      if (smartResult.results.length > 0) {
        smartHighlights = smartResult.results.flatMap(r => r.highlights || []);
        entities = smartResult.entities;
      }
    }

    return {
      results: topResults,
      type: smartHighlights.length > 0 ? 'search_with_smart' : 'search',
      highlights: smartHighlights,
      entities: entities,
      query: q,
      total: scoredItems.length
    };
  },

  /**
   * 获取搜索建议（实时联想）
   */
  getSuggestions(query) {
    if (!query || query.trim().length < 1) {
      return [];
    }

    const q = query.trim();
    const suggestions = [];
    const seen = new Set();

    // 药品名称建议
    for (const drug of MEDICAL_DB.drugs) {
      if (drug.name.includes(q) || q.includes(drug.name)) {
        if (!seen.has(drug.name)) {
          suggestions.push({ text: drug.name, type: 'drug', category: drug.category });
          seen.add(drug.name);
        }
      }
      for (const alias of drug.aliases) {
        if (alias.toLowerCase().includes(q.toLowerCase()) && !seen.has(alias)) {
          suggestions.push({ text: alias, type: 'drug', category: drug.category, redirect: drug.name });
          seen.add(alias);
        }
      }
    }

    // 检验指标建议
    for (const lab of MEDICAL_DB.labs) {
      if (lab.name.includes(q) || q.includes(lab.name)) {
        if (!seen.has(lab.name)) {
          suggestions.push({ text: lab.name, type: 'lab', category: lab.category });
          seen.add(lab.name);
        }
      }
      for (const alias of lab.aliases) {
        if (alias.toLowerCase().includes(q.toLowerCase()) && !seen.has(alias)) {
          suggestions.push({ text: alias, type: 'lab', category: lab.category, redirect: lab.name });
          seen.add(alias);
        }
      }
    }

    return suggestions.slice(0, 8);
  },

  /**
   * 根据ID获取药品详情
   */
  getDrugById(id) {
    return MEDICAL_DB.drugs.find(d => d.id === id);
  },

  /**
   * 根据ID获取检验指标详情
   */
  getLabById(id) {
    return MEDICAL_DB.labs.find(l => l.id === id);
  },

  /**
   * 获取所有分类
   */
  getCategories() {
    const drugCategories = {};
    const labCategories = {};

    for (const drug of MEDICAL_DB.drugs) {
      if (!drugCategories[drug.category]) {
        drugCategories[drug.category] = [];
      }
      drugCategories[drug.category].push(drug);
    }

    for (const lab of MEDICAL_DB.labs) {
      if (!labCategories[lab.category]) {
        labCategories[lab.category] = [];
      }
      labCategories[lab.category].push(lab);
    }

    return { drugCategories, labCategories };
  },

  /**
   * 获取热门推荐
   */
  getHotItems() {
    // 优先展示临床高频用药
    const hotDrugIds = ['d001', 'd002', 'd003', 'd004', 'd007', 'd008'];
    const hotLabIds = ['l001', 'l002', 'l003', 'l004', 'l007', 'l014'];
    const hotDrugs = hotDrugIds.map(id => this.getDrugById(id)).filter(Boolean);
    const hotLabs = hotLabIds.map(id => this.getLabById(id)).filter(Boolean);
    return { hotDrugs, hotLabs };
  },

  /**
   * 构建 AI 上下文：从知识库中提取与查询相关的信息
   */
  buildAIContext(query) {
    const q = query.toLowerCase().trim();
    const contexts = [];

    // 提取相关药品
    for (const drug of MEDICAL_DB.drugs) {
      let relevance = 0;
      // 检查名称/别名匹配
      if (q.includes(drug.name.toLowerCase())) relevance = 3;
      if (relevance === 0) {
        for (const alias of drug.aliases) {
          if (q.includes(alias.toLowerCase()) && alias.length >= 2) {
            relevance = 3;
            break;
          }
        }
      }
      // 检查标签匹配
      if (relevance === 0) {
        for (const tag of drug.tags) {
          if (q.includes(tag.toLowerCase())) {
            relevance = 1;
            break;
          }
        }
      }
      // 检查分类匹配
      if (relevance === 0 && drug.category && q.includes(drug.category.toLowerCase().substring(0, 2))) {
        relevance = 1;
      }

      if (relevance > 0) {
        contexts.push(this.formatDrugContext(drug, relevance));
      }
    }

    // 提取相关检验指标
    for (const lab of MEDICAL_DB.labs) {
      let relevance = 0;
      if (q.includes(lab.name.toLowerCase())) relevance = 3;
      if (relevance === 0) {
        for (const alias of lab.aliases) {
          if (q.includes(alias.toLowerCase()) && alias.length >= 2) {
            relevance = 3;
            break;
          }
        }
      }
      if (relevance === 0) {
        for (const tag of lab.tags) {
          if (q.includes(tag.toLowerCase())) {
            relevance = 1;
            break;
          }
        }
      }

      if (relevance > 0) {
        contexts.push(this.formatLabContext(lab, relevance));
      }
    }

    // 按相关度排序，取前5条
    contexts.sort((a, b) => b.relevance - a.relevance);
    return contexts.slice(0, 5).map(c => c.text).join('\n\n');
  },

  formatDrugContext(drug, relevance) {
    const interactions = drug.interactions.map(i => 
      `  - ${i.drug}（${i.severity === 'high' ? '高风险' : i.severity === 'medium' ? '中风险' : '低风险'}）：${i.effect}`
    ).join('\n');

    return {
      relevance,
      text: `【药品：${drug.name}】
- 类别：${drug.category}
- 适应症：${drug.indication}
- 用法用量：${drug.dosage}
- 禁忌：${drug.contraindications.join('；')}
- 不良反应：${drug.adverseReactions.join('；')}
- 药物相互作用：
${interactions}
- 妊娠分级：${drug.pregnancyCategory}
- 数据来源：${drug.source}`
    };
  },

  formatLabContext(lab, relevance) {
    const refRanges = Object.entries(lab.referenceRange).map(([k, v]) => `${k}: ${v}`).join('， ');
    return {
      relevance,
      text: `【检验指标：${lab.name}】
- 类别：${lab.category}
- 单位：${lab.unit}
- 参考范围：${refRanges}
- 临床意义：${lab.clinicalSignificance}
- 升高原因：${lab.highCauses.join('；')}
- 降低原因：${lab.lowCauses.join('；')}
- 数据来源：${lab.source}`
    };
  },

  /**
   * 多药交互检查：检查多种药品之间的相互作用
   */
  checkMultiDrugInteractions(drugIds) {
    const results = [];
    const drugs = drugIds.map(id => this.getDrugById(id)).filter(Boolean);

    for (let i = 0; i < drugs.length; i++) {
      for (let j = i + 1; j < drugs.length; j++) {
        const drugA = drugs[i];
        const drugB = drugs[j];

        // 检查 A 的相互作用列表中是否有 B（精确匹配名称或别名，不做前缀截断）
        const allNamesB = [drugB.name.toLowerCase(), ...drugB.aliases.map(a => a.toLowerCase())];
        let interaction = drugA.interactions.find(int => {
          const intDrug = int.drug.toLowerCase();
          return allNamesB.some(nb => intDrug.includes(nb) && nb.length >= 2);
        });

        // 反向检查
        if (!interaction) {
          const allNamesA = [drugA.name.toLowerCase(), ...drugA.aliases.map(a => a.toLowerCase())];
          interaction = drugB.interactions.find(int => {
            const intDrug = int.drug.toLowerCase();
            return allNamesA.some(na => intDrug.includes(na) && na.length >= 2);
          });
          if (interaction) {
            interaction = { ...interaction, drug: drugA.name };
          }
        }

        if (interaction) {
          results.push({
            drugA: drugA.name,
            drugB: drugB.name,
            effect: interaction.effect,
            severity: interaction.severity
          });
        }
      }
    }

    return results;
  },

  /**
   * 检验值解读
   */
  interpretLabValue(labId, value, gender = 'adult') {
    const lab = this.getLabById(labId);
    if (!lab) return null;

    const numValue = parseFloat(value);
    if (isNaN(numValue)) return null;

    // 获取参考范围
    let refStr = '';
    let refKey = gender;
    if (lab.referenceRange[gender]) {
      refStr = lab.referenceRange[gender];
    } else if (lab.referenceRange.adult) {
      refStr = lab.referenceRange.adult;
    } else if (lab.referenceRange.normal) {
      refStr = lab.referenceRange.normal;
    } else {
      refStr = Object.values(lab.referenceRange)[0];
    }

    // 解析参考范围（支持 "3.5-9.5", "<5.2", "≥7.0" 等格式）
    let rangeLow = null, rangeHigh = null;
    const rangeMatch = refStr.match(/(\d+\.?\d*)\s*[-–]\s*(\d+\.?\d*)/);
    const lessThanMatch = refStr.match(/[<＜]\s*(\d+\.?\d*)/);
    const greaterThanMatch = refStr.match(/[>＞≥]\s*(\d+\.?\d*)/);

    if (rangeMatch) {
      rangeLow = parseFloat(rangeMatch[1]);
      rangeHigh = parseFloat(rangeMatch[2]);
    } else if (lessThanMatch) {
      rangeHigh = parseFloat(lessThanMatch[1]);
    } else if (greaterThanMatch) {
      rangeLow = parseFloat(greaterThanMatch[1]);
    }

    let status = 'normal';
    let statusText = '正常';
    let severity = 'low';

    if (rangeLow !== null && rangeHigh !== null) {
      if (numValue < rangeLow) {
        status = 'low';
        statusText = '偏低';
        severity = 'medium';
      } else if (numValue > rangeHigh) {
        status = 'high';
        statusText = '偏高';
        severity = 'high';
      }
    } else if (rangeHigh !== null) {
      if (numValue > rangeHigh) {
        status = 'high';
        statusText = '偏高';
        severity = 'high';
      }
    } else if (rangeLow !== null) {
      if (numValue < rangeLow) {
        status = 'low';
        statusText = '偏低';
        severity = 'medium';
      }
    }

    // 严重程度判断
    if (rangeLow !== null && rangeHigh !== null) {
      const range = rangeHigh - rangeLow;
      if (numValue > rangeHigh + range * 2) {
        statusText = '显著偏高';
        severity = 'high';
      } else if (numValue < rangeLow - range * 0.5) {
        statusText = '显著偏低';
        severity = 'high';
      }
    }

    return {
      lab,
      value: numValue,
      unit: lab.unit,
      referenceRange: refStr,
      status,
      statusText,
      severity,
      gender,
      causes: status === 'high' ? lab.highCauses : (status === 'low' ? lab.lowCauses : [])
    };
  }
};

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SearchEngine;
} else {
  window.SearchEngine = SearchEngine;
}
