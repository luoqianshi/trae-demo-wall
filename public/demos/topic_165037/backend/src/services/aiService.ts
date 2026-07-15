import axios from 'axios';

const AI_PROVIDER = process.env.AI_PROVIDER || 'openai';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_BASE_URL = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
const OPENAI_MODEL = process.env.AI_MODEL || 'gpt-4';

const ZPU_API_KEY = process.env.ZPU_API_KEY || '';
const ZPU_BASE_URL = process.env.ZPU_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4';
const ZPU_MODEL = process.env.ZPU_MODEL || 'glm-5.2';

const isAIConfigured = (): boolean => {
  if (AI_PROVIDER === 'zhipu') {
    return !!ZPU_API_KEY && ZPU_API_KEY !== 'your-zpu-api-key';
  }
  return !!OPENAI_API_KEY && OPENAI_API_KEY !== 'your-openai-api-key';
};

const DIFFICULTY_CONFIG: Record<number, { name: string; minWords: number; maxWords: number; description: string }> = {
  1: { name: '中考', minWords: 200, maxWords: 300, description: '初中毕业水平，词汇量1500-2000，句子结构简单' },
  2: { name: '高考', minWords: 300, maxWords: 400, description: '高中毕业水平，词汇量3500-4000，句子结构中等复杂度' },
  3: { name: '四级', minWords: 300, maxWords: 500, description: '大学英语四级水平，词汇量4500-5000，句子结构较复杂' },
  4: { name: '六级', minWords: 400, maxWords: 600, description: '大学英语六级水平，词汇量6000-6500，句子结构复杂' },
  5: { name: '考研', minWords: 400, maxWords: 800, description: '研究生入学考试水平，词汇量8000+，长难句多，学术性强' }
};

export const callAI = async (prompt: string, systemPrompt?: string): Promise<string> => {
  if (!isAIConfigured()) {
    throw new Error('请先配置AI API Key');
  }

  if (AI_PROVIDER === 'zhipu') {
    return callZhipuAI(prompt, systemPrompt);
  }
  return callOpenAI(prompt, systemPrompt);
};

const callZhipuAI = async (prompt: string, systemPrompt?: string): Promise<string> => {
  const messages: { role: string; content: string }[] = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  try {
    const startTime = Date.now();
    const response = await axios.post(
      `${ZPU_BASE_URL}/chat/completions`,
      {
        model: ZPU_MODEL,
        messages,
        stream: false,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${ZPU_API_KEY}`
        },
        timeout: 120000
      }
    );

    const elapsed = Date.now() - startTime;
    console.log(`  [智谱AI] 调用成功 (${elapsed}ms, ${ZPU_MODEL})`);
    return response.data.choices[0].message.content;
  } catch (error: any) {
    const status = error.response?.status;
    const data = error.response?.data;
    console.error(`[智谱AI] 调用失败: status=${status}, error=${JSON.stringify(data?.error || data)}`);
    throw error;
  }
};

const callOpenAI = async (prompt: string, systemPrompt?: string): Promise<string> => {
  const messages: { role: string; content: string }[] = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await axios.post(
      `${OPENAI_BASE_URL}/chat/completions`,
      {
        model: OPENAI_MODEL,
        messages,
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        timeout: 60000
      }
    );

    return response.data.choices[0].message.content;
  } catch (error: any) {
    console.error('OpenAI调用失败:', error.message);
    throw error;
  }
};

const decodeHtml = (html: string): string => {
  return html
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#039;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8216;/g, "'")
    .replace(/&#8220;/g, '"')
    .replace(/&#8221;/g, '"')
    .replace(/&#8212;/g, '—')
    .replace(/&#8230;/g, '...')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
};

const safeJsonParse = (text: string): any => {
  let cleaned = text
    .replace(/```json\s*/gi, '')
    .replace(/```\s*$/g, '')
    .trim();
  
  try {
    return JSON.parse(cleaned);
  } catch (e) {}
  
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    try {
      return JSON.parse(cleaned.substring(firstBrace, lastBrace + 1));
    } catch (e2) {}
  }
  if (firstBracket >= 0 && lastBracket > firstBracket) {
    try {
      return JSON.parse(cleaned.substring(firstBracket, lastBracket + 1));
    } catch (e2) {}
  }
  
  try {
    let fixed = cleaned
      .replace(/,\s*([}\]])/g, '$1')
      .replace(/([{,])\s*(\w+)\s*:/g, '$1"$2":');
    return JSON.parse(fixed);
  } catch (e3) {}
  
  try {
    const extractJson = (str: string): string | null => {
      let depth = 0;
      let start = -1;
      for (let i = 0; i < str.length; i++) {
        if (str[i] === '{' || str[i] === '[') {
          if (depth === 0) start = i;
          depth++;
        } else if (str[i] === '}' || str[i] === ']') {
          depth--;
          if (depth === 0 && start >= 0) {
            return str.substring(start, i + 1);
          }
        }
      }
      return null;
    };
    
    const jsonStr = extractJson(cleaned);
    if (jsonStr) {
      try {
        return JSON.parse(jsonStr);
      } catch (e4) {
        let repaired = jsonStr
          .replace(/\\n/g, '\\n')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '')
          .replace(/\t/g, '\\t');
        try {
          return JSON.parse(repaired);
        } catch (e5) {}
      }
    }
  } catch (e4) {}
  
  try {
    const englishMatch = cleaned.match(/"english"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
    const chineseMatch = cleaned.match(/"chinese"\s*:\s*"((?:[^"\\]|\\.)*)"/s);
    
    if (englishMatch) {
      return {
        english: englishMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"'),
        chinese: chineseMatch ? chineseMatch[1].replace(/\\n/g, '\n').replace(/\\"/g, '"') : ''
      };
    }
  } catch (e5) {}
  
  throw new Error('无法解析JSON');
};

const countWords = (text: string): number => {
  return text.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(w => w.length > 0).length;
};

const countParagraphs = (text: string): number => {
  return text.split(/\n\n+/).filter(p => p.trim().length > 20).length;
};

export const rewriteArticle = async (
  originalContent: string,
  difficultyLevel: number
): Promise<{ content: string; translatedContent: string }> => {
  const config = DIFFICULTY_CONFIG[difficultyLevel];
  const cleanContent = decodeHtml(originalContent);
  
  const systemPrompt = `你是一位资深的英语考试命题专家，精通中考、高考、四六级、考研英语的阅读理解材料命题规律。
你擅长将各种素材改写为符合考试标准的阅读材料，确保字数精准达标、段落分明、难度适宜。
你必须严格遵守字数要求，不能过多也不能过少。段落结构必须清晰，3-4个自然段。`;

  const buildPrompt = (retryHint: string = '') => `请将以下英文素材改写为一篇完整的${config.name}英语阅读理解文章。

【核心要求 - 必须严格遵守，违者重罚】
1. **字数要求**：严格控制在 ${config.minWords}-${config.maxWords} 词之间！
   - 最低不能少于 ${config.minWords} 词
   - 最高不能超过 ${config.maxWords} 词
   - 目标字数：${Math.floor((config.minWords + config.maxWords) / 2)} 词左右最佳
   - 如果原文太短，基于主题合理拓展补充背景、细节、例子
   - 如果原文太长，提炼核心内容，精简表达

2. **段落要求**：必须分为 3-4 个自然段！绝对不能少于3段！
   - 第一段：引入话题，介绍背景（约占全文25%）
   - 第二段：展开论述，详细说明（约占全文40%）
   - 第三段：进一步分析或举例（约占全文25%）
   - 第四段（可选）：总结升华，展望未来（约占全文10%）
   - 段落之间必须用空行分隔（用\\n\\n表示）

3. **难度水平**：${config.description}

4. **内容要求**：保留原文核心信息和主要观点，结构完整，逻辑清晰。

5. **语言风格**：地道纯正的英语，符合${config.name}真题阅读材料风格。

【输出格式 - 只返回JSON，不要有任何其他文字】
{
  "english": "改写后的英文文章，段落间用\\n\\n分隔",
  "chinese": "对应的中文翻译，同样分段，段落间用\\n\\n分隔"
}

【重要 - JSON格式要求】
- 字符串中的双引号必须转义为 \\"
- 字符串中的换行必须用 \\n 表示
- 确保是标准合法的JSON格式
- 不要有任何多余的文字说明

${retryHint}
原文素材：
${cleanContent.substring(0, 3000)}

请直接返回JSON：`;

  try {
    let result = await callAI(buildPrompt(), systemPrompt);
    let parsed = safeJsonParse(result);
    
    let english = decodeHtml(parsed.english || parsed.content || result).trim();
    let chinese = decodeHtml(parsed.chinese || parsed.translation || '').trim();
    let wordCount = countWords(english);
    let paraCount = countParagraphs(english);
    
    for (let retry = 0; retry < 3; retry++) {
      const wordCountOk = wordCount >= config.minWords && wordCount <= config.maxWords;
      const paraCountOk = paraCount >= 3;
      
      if (wordCountOk && paraCountOk) break;
      
      let hints: string[] = [];
      
      if (wordCount < config.minWords) {
        hints.push(`字数不足：只有 ${wordCount} 词，最低要求 ${config.minWords} 词。请大幅扩充内容，增加细节、背景、例子和论述，务必达到 ${config.minWords}-${config.maxWords} 词！`);
      } else if (wordCount > config.maxWords) {
        hints.push(`字数超标：有 ${wordCount} 词，最高限制 ${config.maxWords} 词。请精简内容，保留核心信息，压缩到 ${config.minWords}-${config.maxWords} 词范围内！`);
      }
      
      if (paraCount < 3) {
        hints.push(`段落不足：只有 ${paraCount} 段，要求至少 3-4 段。请将文章拆分为 3-4 个自然段，段落之间用空行分隔！第一段引入话题，第二段展开论述，第三段总结。`);
      }
      
      console.log(`  第${retry + 1}次重试: ${hints.join('; ')}`);
      const hint = `【重要提示 - 上次生成不符合要求】\n${hints.join('\n')}\n\n请严格按照要求重新生成！`;
      
      result = await callAI(buildPrompt(hint), systemPrompt);
      parsed = safeJsonParse(result);
      english = decodeHtml(parsed.english || parsed.content || result).trim();
      chinese = decodeHtml(parsed.chinese || parsed.translation || '').trim();
      wordCount = countWords(english);
      paraCount = countParagraphs(english);
    }
    
    console.log(`  最终: ${wordCount}词, ${paraCount}段`);
    return { content: english, translatedContent: chinese };
  } catch (error: any) {
    console.error(`生成难度${difficultyLevel}文章失败:`, error.message);
    throw error;
  }
};

export const generateQuizQuestions = async (
  articleContent: string,
  difficultyLevel: number,
  questionCount: number = 5
): Promise<any[]> => {
  const config = DIFFICULTY_CONFIG[difficultyLevel];
  
  const questionTypes: Record<number, string[]> = {
    1: ['细节理解题'],
    2: ['细节理解题', '推理判断题', '主旨大意题'],
    3: ['细节理解题', '推理判断题', '词义猜测题', '主旨大意题'],
    4: ['推理判断题', '词义猜测题', '作者态度题', '主旨大意题'],
    5: ['推理判断题', '作者态度题', '篇章结构题', '主旨大意题', '词义猜测题']
  };

  const types = questionTypes[difficultyLevel] || questionTypes[3];
  const cleanContent = decodeHtml(articleContent);
  
  const buildPrompt = (retryHint: string = '') => `请根据以下英文文章，出 ${questionCount} 道 ${config.name} 英语阅读理解选择题。

【要求 - 必须严格遵守】
1. 共 ${questionCount} 道题，题型从以下类型中选择，尽量覆盖不同类型：${types.join('、')}
2. 每道题 4 个选项（A、B、C、D），只有一个正确答案
3. 干扰项要有迷惑性，不能太简单
4. 提供详细的答案解析，说明为什么选这个答案
5. 词义猜测题要根据上下文语境设计
6. 所有题目和选项必须是完整的英文句子

【输出格式 - 只返回JSON数组】
[
  {
    "question": "题目内容",
    "optionA": "选项A",
    "optionB": "选项B",
    "optionC": "选项C",
    "optionD": "选项D",
    "correctAnswer": "A",
    "explanation": "答案解析",
    "questionType": "细节理解题"
  }
]

${retryHint}
文章内容：
${cleanContent.substring(0, 4000)}

请只返回JSON数组，不要有其他解释文字。`;

  const systemPrompt = '你是一位资深的英语考试命题专家，精通中考、高考、四六级、考研英语的阅读理解命题规律。你出的题目质量高、干扰项有迷惑性、解析详尽。';

  const validateQuestion = (q: any): boolean => {
    return !!(q.question && q.optionA && q.optionB && q.optionC && q.optionD && 
      q.correctAnswer && q.explanation &&
      ['A', 'B', 'C', 'D'].includes(q.correctAnswer.toUpperCase().trim()));
  };

  try {
    let result = await callAI(buildPrompt(), systemPrompt);
    let questions = safeJsonParse(result);
    
    for (let retry = 0; retry < 2; retry++) {
      if (!Array.isArray(questions)) {
        console.log(`  题目格式错误，第${retry + 1}次重试...`);
        result = await callAI(buildPrompt(`【重要提示】上次返回的不是有效的JSON数组格式，请严格按照要求返回数组格式！`), systemPrompt);
        questions = safeJsonParse(result);
        continue;
      }
      
      const validQuestions = questions.filter(validateQuestion);
      if (validQuestions.length >= questionCount) {
        questions = validQuestions;
        break;
      }
      
      console.log(`  有效题目不足(${validQuestions.length}/${questionCount})，第${retry + 1}次重试...`);
      result = await callAI(buildPrompt(`【重要提示】上次只生成了 ${validQuestions.length} 道有效题目，要求 ${questionCount} 道。请补充完整，确保每道题都有 question、optionA-D、correctAnswer、explanation、questionType 字段，且 correctAnswer 为 A/B/C/D 中的一个！`), systemPrompt);
      questions = safeJsonParse(result);
    }
    
    if (!Array.isArray(questions)) return [];
    
    const validQuestions = questions
      .filter(validateQuestion)
      .slice(0, questionCount)
      .map((q: any) => ({
        question: decodeHtml(q.question || ''),
        optionA: decodeHtml(q.optionA || ''),
        optionB: decodeHtml(q.optionB || ''),
        optionC: decodeHtml(q.optionC || ''),
        optionD: decodeHtml(q.optionD || ''),
        correctAnswer: (q.correctAnswer || '').toUpperCase().trim(),
        explanation: decodeHtml(q.explanation || ''),
        questionType: q.questionType || '细节理解题'
      }));
    
    console.log(`  题目: ${validQuestions.length}道`);
    return validQuestions;
  } catch (error: any) {
    console.error('生成题目失败:', error.message);
    return [];
  }
};

const SIMPLE_WORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has',
  'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might',
  'can', 'shall', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'it', 'its', 'this', 'that', 'these', 'those', 'and', 'or', 'but', 'not',
  'no', 'so', 'if', 'than', 'then', 'he', 'she', 'they', 'we', 'you', 'i',
  'me', 'him', 'her', 'us', 'them', 'his', 'her', 'their', 'our', 'my',
  'what', 'which', 'who', 'when', 'where', 'why', 'how', 'all', 'each',
  'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just',
  'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with',
  'about', 'against', 'between', 'into', 'through', 'during', 'before',
  'after', 'above', 'below', 'up', 'down', 'out', 'off', 'over', 'under',
  'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where',
  'why', 'how', 'both', 'also',
]);

const simplifySentence = (sentence: string, level: number): string => {
  if (level >= 4) return sentence;
  
  const words = sentence.split(/\s+/);
  const simplified: string[] = [];
  
  for (const word of words) {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '').toLowerCase();
    
    if (level <= 1) {
      if (SIMPLE_WORDS.has(cleanWord) || cleanWord.length <= 5) {
        simplified.push(word);
      }
    } else if (level === 2) {
      if (SIMPLE_WORDS.has(cleanWord) || cleanWord.length <= 7) {
        simplified.push(word);
      }
    } else if (level === 3) {
      if (SIMPLE_WORDS.has(cleanWord) || cleanWord.length <= 9) {
        simplified.push(word);
      }
    }
  }
  
  const result = simplified.join(' ').replace(/\s+/g, ' ').trim();
  return result.length > 20 ? result : sentence;
};

const splitSentences = (text: string): string[] => {
  const sentences: string[] = [];
  let current = '';
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    current += char;
    
    if ((char === '.' || char === '!' || char === '?') && 
        (i === text.length - 1 || text[i + 1] === ' ' || text[i + 1] === '\n')) {
      if (current.trim().length > 10) {
        sentences.push(current.trim());
      }
      current = '';
    }
  }
  
  if (current.trim().length > 10) {
    sentences.push(current.trim());
  }
  
  return sentences;
};

const generateFallbackArticle = (
  originalContent: string,
  difficultyLevel: number
): { content: string; translatedContent: string } => {
  const config = DIFFICULTY_CONFIG[difficultyLevel];
  const sentences = splitSentences(originalContent);
  
  if (sentences.length === 0) {
    return {
      content: originalContent,
      translatedContent: '（注：配置AI后可生成中文翻译）'
    };
  }
  
  const targetWords = Math.floor((config.minWords + config.maxWords) / 2);
  let selectedSentences: string[] = [];
  let totalWords = 0;
  
  if (difficultyLevel <= 2) {
    for (const sentence of sentences) {
      const simplified = simplifySentence(sentence, difficultyLevel);
      const words = countWords(simplified);
      if (totalWords + words <= targetWords + 80) {
        selectedSentences.push(simplified);
        totalWords += words;
      }
      if (totalWords >= targetWords) break;
    }
  } else if (difficultyLevel === 3) {
    for (const sentence of sentences) {
      const words = countWords(sentence);
      if (totalWords + words <= targetWords + 80) {
        selectedSentences.push(sentence);
        totalWords += words;
      }
      if (totalWords >= targetWords) break;
    }
  } else {
    for (const sentence of sentences) {
      const words = countWords(sentence);
      if (totalWords + words <= targetWords + 100) {
        selectedSentences.push(sentence);
        totalWords += words;
      }
      if (totalWords >= targetWords) break;
    }
  }
  
  if (selectedSentences.length === 0) {
    selectedSentences = sentences.slice(0, Math.min(3, sentences.length));
  }
  
  const content = selectedSentences.join(' ').trim();
  
  let translatedHint = '';
  if (difficultyLevel <= 2) {
    translatedHint = '（基础难度版：简化了词汇和句子结构，配置AI后可生成精准翻译）';
  } else if (difficultyLevel === 3) {
    translatedHint = '（中级难度版：保留大部分原文内容，配置AI后可生成精准翻译）';
  } else {
    translatedHint = '（高级难度版：接近原文难度，配置AI后可生成精准翻译）';
  }
  
  return {
    content,
    translatedContent: translatedHint
  };
};

const generateFallbackQuestions = (
  articleContent: string,
  difficultyLevel: number
): any[] => {
  const sentences = splitSentences(articleContent);
  const questions: any[] = [];
  
  if (sentences.length < 2) return questions;
  
  const questionCount = difficultyLevel >= 4 ? 5 : 4;
  const words = articleContent.replace(/[^a-zA-Z\s]/g, ' ').split(/\s+/).filter(w => w.length > 4);
  const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];
  
  const detailSentences = sentences.filter(s => s.length > 30);
  
  if (detailSentences.length >= 2) {
    for (let i = 0; i < Math.min(2, detailSentences.length); i++) {
      const sentence = detailSentences[i];
      const sentenceWords = sentence.split(/\s+/).filter(w => w.length > 3);
      
      if (sentenceWords.length >= 5) {
        const keyWord = sentenceWords[Math.floor(sentenceWords.length / 2)];
        const cleanKeyWord = keyWord.replace(/[^a-zA-Z]/g, '');
        
        if (cleanKeyWord.length >= 4) {
          const wrongOptions = uniqueWords
            .filter(w => w.toLowerCase() !== cleanKeyWord.toLowerCase())
            .sort(() => Math.random() - 0.5)
            .slice(0, 3);
          
          while (wrongOptions.length < 3) {
            wrongOptions.push(`choice${wrongOptions.length + 1}`);
          }
          
          const allOptions = [cleanKeyWord, ...wrongOptions].sort(() => Math.random() - 0.5);
          const correctIndex = allOptions.findIndex(o => o.toLowerCase() === cleanKeyWord.toLowerCase());
          const correctLetter = String.fromCharCode(65 + correctIndex);
          
          questions.push({
            question: `According to the passage, which word appears in the sentence about "${sentence.substring(0, 40)}..."?`,
            optionA: allOptions[0],
            optionB: allOptions[1],
            optionC: allOptions[2],
            optionD: allOptions[3],
            correctAnswer: correctLetter,
            explanation: `The sentence reads: "${sentence.substring(0, 100)}..."`,
            questionType: '细节理解题'
          });
        }
      }
    }
  }
  
  if (uniqueWords.length >= 5 && questions.length < questionCount) {
    const longWords = uniqueWords.filter(w => w.length >= 6).slice(0, 10);
    
    if (longWords.length >= 4) {
      const targetWord = longWords[Math.floor(Math.random() * longWords.length)];
      const otherWords = longWords.filter(w => w !== targetWord).sort(() => Math.random() - 0.5).slice(0, 3);
      
      const allOptions = [targetWord, ...otherWords].sort(() => Math.random() - 0.5);
      const correctIndex = allOptions.indexOf(targetWord);
      const correctLetter = String.fromCharCode(65 + correctIndex);
      
      questions.push({
        question: `Which of the following words is mentioned in the article?`,
        optionA: allOptions[0],
        optionB: allOptions[1],
        optionC: allOptions[2],
        optionD: allOptions[3],
        correctAnswer: correctLetter,
        explanation: `"${targetWord}" appears in the article text.`,
        questionType: '细节理解题'
      });
    }
  }
  
  if (sentences.length >= 3 && questions.length < questionCount) {
    const firstSentence = sentences[0];
    const lastSentence = sentences[sentences.length - 1];
    
    questions.push({
      question: 'What can we learn from the first sentence of the article?',
      optionA: 'The article is about sports events',
      optionB: 'The article introduces a topic or event',
      optionC: 'The article is about cooking recipes',
      optionD: 'The article is about travel tips',
      correctAnswer: 'B',
      explanation: `The first sentence says: "${firstSentence.substring(0, 80)}..."`,
      questionType: '推理判断题'
    });
  }
  
  if (questions.length < questionCount && sentences.length > 0) {
    questions.push({
      question: 'What is the main topic of this article?',
      optionA: 'Entertainment and celebrity news',
      optionB: 'Science and technology related content',
      optionC: 'The subject discussed in the text',
      optionD: 'Sports and fitness',
      correctAnswer: 'C',
      explanation: `The article discusses: "${sentences[0].substring(0, 60)}..."`,
      questionType: '主旨大意题'
    });
  }
  
  if (uniqueWords.length >= 8 && questions.length < questionCount) {
    const hardWords = uniqueWords.filter(w => w.length >= 8).slice(0, 6);
    
    if (hardWords.length >= 4) {
      const targetWord = hardWords[0];
      const others = hardWords.slice(1, 4);
      const allOptions = [targetWord, ...others].sort(() => Math.random() - 0.5);
      const correctIndex = allOptions.indexOf(targetWord);
      const correctLetter = String.fromCharCode(65 + correctIndex);
      
      questions.push({
        question: `Which word is used in the passage to describe a key concept?`,
        optionA: allOptions[0],
        optionB: allOptions[1],
        optionC: allOptions[2],
        optionD: allOptions[3],
        correctAnswer: correctLetter,
        explanation: `"${targetWord}" is an important word in this article.`,
        questionType: '词义猜测题'
      });
    }
  }
  
  return questions.slice(0, questionCount);
};

export const processNewArticle = async (
  articleId: string,
  originalContent: string
): Promise<void> => {
  const { PrismaClient } = await import('@prisma/client');
  const prisma = new PrismaClient();

  try {
    console.log(`开始处理文章 ${articleId}...`);

    const hasAI = isAIConfigured();

    for (let level = 1; level <= 5; level++) {
      console.log(`  生成难度 ${level} 版本...`);
      
      try {
        let content: string;
        let translatedContent: string;
        
        if (hasAI) {
          const result = await rewriteArticle(originalContent, level);
          content = result.content;
          translatedContent = result.translatedContent;
        } else {
          const result = generateFallbackArticle(originalContent, level);
          content = result.content;
          translatedContent = result.translatedContent;
        }
        
        const wordCount = content.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(Boolean).length;
        
        const variant = await prisma.articleVariant.create({
          data: {
            articleId,
            difficultyLevel: level,
            content,
            translatedContent,
            wordCount
          }
        });

        console.log(`    生成 ${wordCount} 词`);

        let questions: any[] = [];
        if (hasAI) {
          questions = await generateQuizQuestions(content, level, level >= 4 ? 5 : 4);
        } else {
          questions = generateFallbackQuestions(content, level);
        }
        
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          await prisma.quizQuestion.create({
            data: {
              articleVariantId: variant.id,
              question: q.question,
              optionA: q.optionA,
              optionB: q.optionB,
              optionC: q.optionC,
              optionD: q.optionD,
              correctAnswer: q.correctAnswer,
              explanation: q.explanation,
              questionType: q.questionType,
              orderNum: i + 1
            }
          });
        }
        
        console.log(`    生成 ${questions.length} 道题目`);
      } catch (err: any) {
        console.error(`    难度${level}生成失败:`, err.message);
      }
    }

    console.log(`文章 ${articleId} 处理完成!`);
  } finally {
    await prisma.$disconnect();
  }
};
