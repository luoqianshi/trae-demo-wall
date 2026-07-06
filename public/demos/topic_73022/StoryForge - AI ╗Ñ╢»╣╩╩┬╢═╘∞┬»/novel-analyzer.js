// 小说AI分析模块 - 分段阅读长篇小说
async function analyzeNovelWithAI(content, filename) {
  const CHUNK_SIZE = 8000;
  const totalLength = content.length;
  
  // 如果小说比较短（少于12000字），直接一次性分析
  if (totalLength <= CHUNK_SIZE * 1.5) {
    return analyzeNovelSinglePass(content, filename);
  }
  
  // 分段阅读：先读每一段，生成总结
  const chunks = [];
  for (let i = 0; i < content.length; i += CHUNK_SIZE) {
    chunks.push(content.substring(i, i + CHUNK_SIZE));
  }
  
  console.log('[Analyze] 小说共', totalLength, '字，分为', chunks.length, '段阅读');
  
  const chunkSummaries = [];
  
  for (let i = 0; i < chunks.length; i++) {
    showToast('AI正在阅读第 ' + (i + 1) + '/' + chunks.length + ' 段...');
    
    const prevSummary = i > 0 ? chunkSummaries[i - 1] : '';
    const summary = await readChunkAndSummarize(chunks[i], i + 1, chunks.length, prevSummary, filename);
    
    if (summary) {
      chunkSummaries.push(summary);
    } else {
      console.error('[Analyze] 第', i + 1, '段阅读失败');
      return null;
    }
  }
  
  // 汇总所有总结，生成最终分析结果
  showToast('AI正在汇总分析全文...');
  return finalizeNovelAnalysis(chunkSummaries, filename, content);
}

// 单段阅读并生成总结
async function readChunkAndSummarize(chunk, chunkIndex, totalChunks, prevSummary, filename) {
  const sysPrompt = '你是一位专业的中文小说分析专家。请仔细阅读提供的小说片段，并结合之前的剧情总结，输出本段的分析总结。\n\n' +
    '输出格式要求：必须是纯JSON格式，不要包含任何markdown标记或额外文字。\n\n' +
    'JSON结构：\n' +
    '{\n' +
    '  "summary": "本段剧情总结（300-500字）",\n' +
    '  "characters": ["角色名1", "角色名2"],\n' +
    '  "keyEvents": ["关键事件1", "关键事件2"],\n' +
    '  "location": "主要场景地点",\n' +
    '  "note": "重要细节或伏笔"\n' +
    '}\n\n' +
    '注意：必须完全基于原文，不要编造；角色名只提取真正的人名；总结要连贯。';
  
  let prevText = '';
  if (prevSummary) {
    prevText = '之前的剧情总结：\n' + (prevSummary.summary || prevSummary) + '\n\n';
  }
  
  const userPrompt = '请阅读小说第 ' + chunkIndex + '/' + totalChunks + ' 段内容，结合之前的剧情总结，生成本段分析。\n\n' +
    prevText +
    '当前段内容：\n' + chunk;
  
  const result = await callAI(userPrompt, sysPrompt);
  if (!result) return null;
  
  try {
    let clean = result.trim();
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const s = clean.indexOf('{');
    const e = clean.lastIndexOf('}');
    if (s !== -1 && e !== -1 && e > s) {
      clean = clean.substring(s, e + 1);
    }
    return JSON.parse(clean);
  } catch (e) {
    console.error('[Analyze] 第', chunkIndex, '段解析失败:', e);
    return null;
  }
}

// 汇总分析，生成最终结果
async function finalizeNovelAnalysis(chunkSummaries, filename, fullContent) {
  const sysPrompt = '你是一位专业的中文小说分析专家。请根据提供的分段剧情总结，对整部小说进行完整的结构化分析。\n\n' +
    '输出格式要求：必须是纯JSON格式，不要包含任何markdown标记、代码块或额外说明文字。\n\n' +
    'JSON结构：\n' +
    '{\n' +
    '  "title": "小说标题",\n' +
    '  "coreSettings": "核心设定（3-5句话）",\n' +
    '  "originalEnding": "原著结局走向",\n' +
    '  "totalPlotPoints": 8,\n' +
    '  "characters": [\n' +
    '    {"name": "角色名", "isMain": true/false}\n' +
    '  ],\n' +
    '  "nodes": [\n' +
    '    {\n' +
    '      "id": 1,\n' +
    '      "position": 1,\n' +
    '      "title": "章节标题",\n' +
    '      "desc": "章节描述",\n' +
    '      "branchPrompt": "如果当时主角做出不同选择会怎样...",\n' +
    '      "originalText": "对应原文大概位置描述"\n' +
    '    }\n' +
    '  ]\n' +
    '}\n\n' +
    '注意：\n' +
    '1. 角色至少提取5个，主要角色标记为true，按重要性排序\n' +
    '2. nodes提取8个，按故事发展顺序排列\n' +
    '3. 所有内容必须基于提供的分段总结，不要编造\n' +
    '4. 角色名必须是真正的人名，不能是句子片段';
  
  const allSummaries = chunkSummaries.map(function(s, i) {
    let chars = '';
    if (s.characters && Array.isArray(s.characters)) {
      chars = s.characters.join('、');
    }
    let events = '';
    if (s.keyEvents && Array.isArray(s.keyEvents)) {
      events = s.keyEvents.join('；');
    }
    let noteText = '';
    if (s.note) {
      noteText = '\n注意：' + s.note;
    }
    return '【第' + (i + 1) + '段】\n总结：' + s.summary + '\n角色：' + chars + '\n关键事件：' + events + noteText;
  }).join('\n\n');
  
  const userPrompt = '请根据以下小说的分段阅读总结，对整部小说进行完整分析。\n\n' +
    '文件名：' + filename + '\n\n' +
    '分段总结：\n' + allSummaries;
  
  const result = await callAI(userPrompt, sysPrompt);
  if (!result) return null;
  
  try {
    let clean = result.trim();
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const s = clean.indexOf('{');
    const e = clean.lastIndexOf('}');
    if (s !== -1 && e !== -1 && e > s) {
      clean = clean.substring(s, e + 1);
    }
    
    const parsed = JSON.parse(clean);
    
    // 为nodes补充原文内容（从fullContent中按比例提取）
    if (parsed.nodes && Array.isArray(parsed.nodes) && fullContent) {
      const totalNodes = parsed.nodes.length;
      const contentLength = fullContent.length;
      
      parsed.nodes.forEach(function(node, idx) {
        const approxPos = Math.floor((idx / totalNodes) * contentLength);
        const start = Math.max(0, approxPos - 300);
        const end = Math.min(contentLength, approxPos + 500);
        let originalText = fullContent.substring(start, end);
        originalText = originalText.replace(/\s+/g, ' ').trim();
        if (originalText.length > 600) {
          originalText = originalText.substring(0, 600) + '...';
        }
        node.originalText = '【原著：' + node.title + '】\n\n' + originalText + '\n\n━━━━━ 节选 ━━━━━';
      });
    }
    
    return parsed;
  } catch (e) {
    console.error('AI汇总分析结果解析失败:', e);
    console.error('原始结果:', result);
    return null;
  }
}

// 短篇小说：一次性分析
async function analyzeNovelSinglePass(content, filename) {
  const systemPrompt = '你是一位专业的中文小说分析专家，擅长深度阅读理解和结构化提取。请仔细阅读提供的小说文本，完全基于原文内容进行分析，不要编造任何信息。\n\n' +
    '输出格式要求：必须是纯JSON格式，不要包含任何markdown标记、代码块或额外说明文字。\n\n' +
    'JSON结构：\n' +
    '{\n' +
    '  "title": "小说标题（从内容中推断或使用文件名）",\n' +
    '  "coreSettings": "小说核心设定（用3-5句话概括小说中必须遵守的关键设定：人物关系、世界观、关键事件起因，不可违背的规则）",\n' +
    '  "originalEnding": "原著结局走向（如果小说有明确结局则详细描述，否则填\'开放式结局，可自行设计\'）",\n' +
    '  "totalPlotPoints": 总情节点数量（整数，从故事开端到结局一共有多少个关键情节转折点，例如：8）,\n' +
    '  "characters": [\n' +
    '    {"name": "角色名（必须是完整的人名，如\'翠翠\'、\'爷爷\'，不要提取\'见翠翠\'、\'翠翠就\'这种句子片段）", "isMain": true/false}\n' +
    '  ],\n' +
    '  "nodes": [\n' +
    '    {\n' +
    '      "id": 1,\n' +
    '      "position": 1,\n' +
    '      "title": "章节标题（简洁概括该阶段核心事件）",\n' +
    '      "desc": "章节描述（用一句话概括该阶段的主要内容）",\n' +
    '      "branchPrompt": "如果当时主角做出不同选择会怎样...（基于该章节的关键转折点设计）",\n' +
    '      "originalText": "章节原文节选（500-800字，直接从原文摘录，保持原文风格和细节）"\n' +
    '    }\n' +
    '  ]\n' +
    '}\n\n' +
    '重要注意事项：\n' +
    '1. 角色提取必须极其严格：\n' +
    '   - 只提取真正的人名或明确的角色称谓（如爷爷、父亲、老师等）\n' +
    '   - 绝对不能把句子片段当成人名（如\'见翠翠\'、\'翠翠就\'、\'不知\'等都是错误的）\n' +
    '   - 从对话提示词（XX说、XX道、XX问）中识别角色最准确\n' +
    '   - 从重复出现的专有名词中识别角色\n' +
    '   - 至少提取5个角色，主要角色标记为true\n' +
    '2. nodes提取6-8个，按故事发展顺序排列\n' +
    '3. originalText必须直接从原文中摘录，不要改写\n' +
    '4. branchPrompt要基于该章节的关键转折点设计，能引发读者对不同选择的思考\n' +
    '5. 核心设定要准确，不要添加原文没有的内容\n' +
    '6. totalPlotPoints是全书总情节点数估算，不是nodes的数量';
  
  const prompt = '请深度阅读理解以下小说文本，准确提取角色和故事节点。注意：必须完全基于原文，不要编造！\n\n' +
    '文件名：' + filename + '\n\n' +
    '文本内容：\n' + content;
  
  const result = await callAI(prompt, systemPrompt);
  
  if (!result) {
    return null;
  }
  
  try {
    let cleanResult = result.trim();
    cleanResult = cleanResult.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
    const jsonStart = cleanResult.indexOf('{');
    const jsonEnd = cleanResult.lastIndexOf('}');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      cleanResult = cleanResult.substring(jsonStart, jsonEnd + 1);
    }
    
    const parsed = JSON.parse(cleanResult);
    return parsed;
  } catch (e) {
    console.error('AI分析结果解析失败:', e);
    console.error('原始结果:', result);
    return null;
  }
}
