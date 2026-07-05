// ============ Kimi AI 集成模块 ============
// Kimi API 配置
const KIMI_API_URL = 'https://api.moonshot.cn/v1/chat/completions';
const KIMI_MODEL = 'moonshot-v1-8k';

let kimiLastRequestTime = 0;
const KIMI_MIN_INTERVAL = 2500;

function getKimiApiKey() {
  return localStorage.getItem('kimi_api_key') || '';
}

function getKimiConfig() {
  return {
    apiKey: getKimiApiKey()
  };
}

async function kimiExtractVoiceInfo(text) {
  const messages = [
    {
      role: 'system',
      content: `你是"童书伴读"的语音信息提取助手。从用户的语音记录中提取亲子阅读相关的结构化信息。

请根据语音内容，提取以下字段，返回严格的JSON格式（不要包含任何其他文字、不要markdown代码块）：
{
  "bookTitle": "绘本名称（字符串，没有则返回null）",
  "duration": 数字（阅读时长，分钟，没有则返回null）,
  "rating": 数字（评分1-5，没有则返回null）,
  "highlights": "亲子互动亮点/详细记录（字符串，把语音中关于阅读过程、孩子表现、互动细节的内容整理成通顺的文字）",
  "engagement": "投入程度，只能是以下值之一：非常投入、比较投入、一般投入、不太投入，没有则返回null"
}

注意：
- highlights 字段要尽量详细，把语音中提到的所有阅读相关内容都整理进去
- 如果语音中没有提到某项，该字段返回 null
- 只返回JSON，不要有任何解释文字`
    },
    {
      role: 'user',
      content: `用户语音内容：\n${text}\n\n请提取阅读记录信息，只返回JSON。`
    }
  ];
  
  const result = await callKimiAPI(messages, 0.3);
  if (!result) return null;
  
  try {
    const cleanResult = result.replace(/```json\n?/g, '').replace(/```/g, '').trim();
    return JSON.parse(cleanResult);
  } catch (e) {
    console.error('解析Kimi返回结果失败:', e, result);
    return null;
  }
}

async function callKimiAPI(messages, temperature = 0.7, retries = 2) {
  const apiKey = getKimiApiKey();
  if (!apiKey) {
    console.error('Kimi API Key 未配置');
    return null;
  }

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const now = Date.now();
      const waitTime = KIMI_MIN_INTERVAL - (now - kimiLastRequestTime);
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      kimiLastRequestTime = Date.now();

      const response = await fetch(KIMI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: KIMI_MODEL,
          messages: messages,
          temperature: temperature,
          max_tokens: 1000
        })
      });

      if (response.status === 429) {
        if (attempt < retries) {
          const delay = 5000 * Math.pow(2, attempt);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw new Error('API调用失败: 429 (请求过于频繁)');
      }

      if (!response.ok) {
        throw new Error(`API调用失败: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error) {
      if (attempt === retries) {
        console.error('Kimi API 调用失败:', error);
        return null;
      }
    }
  }
  return null;
}

// Kimi AI 对话历史
let kimiConversationHistory = [];

// 初始化对话上下文（绘本讲解场景）
function initKimiContext(book) {
  const bookInfo = book ? `
绘本信息：
- 书名：${book.title}
- 作者：${book.author || '未知'}
- 简介：${book.description || '暂无简介'}
- 适读年龄：${book.ageRange || '3-6'}岁
- 能力培养：${book.abilities ? Object.entries(book.abilities).filter(([k,v]) => v > 3).map(([k]) => k).join('、') : '综合能力'}
` : '';

  kimiConversationHistory = [
    {
      role: 'system',
      content: `你是"童书伴读"的AI助手，一个专为3-6岁儿童和家长设计的绘本科普讲解专家。你应该：
1. 用温暖、童趣的语言讲解绘本故事
2. 回答孩子的问题时要简单易懂
3. 适当提问引导孩子思考
4. 鼓励亲子互动
5. 每次回答控制在100字以内
6. 使用emoji增加趣味性`
    },
    {
      role: 'user',
      content: `以下是绘本的背景信息：
${bookInfo}
请用一段话介绍这个绘本，吸引孩子和家长想读这本书。`
    }
  ];
}

// Kimi AI 绘本科普问答
async function kimiBookQA(book, question) {
  const bookInfo = book ? `
绘本：《${book.title}》
作者：${book.author || '未知'}
简介：${book.description || '暂无简介'}
适读年龄：${book.ageRange || '3-6'}岁
` : '';

  const messages = [
    ...kimiConversationHistory,
    {
      role: 'user',
      content: `${bookInfo}
孩子问：${question}
请用适合3-6岁孩子理解的方式回答，保持温暖有趣的风格，控制在80字以内。`
    }
  ];

  const answer = await callKimiAPI(messages);
  
  if (answer) {
    // 更新对话历史
    kimiConversationHistory.push({ role: 'user', content: question });
    kimiConversationHistory.push({ role: 'assistant', content: answer });
    
    // 保持对话历史不超过10轮
    if (kimiConversationHistory.length > 20) {
      kimiConversationHistory = kimiConversationHistory.slice(-20);
    }
  }
  
  return answer;
}

// Kimi AI 故事讲解
async function kimiTellStory(book) {
  const messages = [
    {
      role: 'system',
      content: `你是"童书伴读"的AI故事讲解员，为3-6岁孩子讲故事。要求：
1. 用生动有趣的语言讲述
2. 适当加入角色对话
3. 穿插提问引导思考
4. 每个故事控制在300字以内
5. 结尾要有寓意或互动引导`
    },
    {
      role: 'user',
      content: `请为绘本《${book.title}》${book.author ? `（作者：${book.author}）` : ''}讲一个适合3-6岁孩子的精彩故事片段。如果你不完全了解这本书，请根据书名和类型发挥想象，创作一个有趣的故事。`
    }
  ];

  return await callKimiAPI(messages, 0.8);
}

// Kimi AI 生成亲子问答
async function kimiGenerateQuestions(book, ageRange = '4-5') {
  const messages = [
    {
      role: 'system',
      content: `你是"童书伴读"的亲子问答专家，根据绘本内容生成适合孩子年龄的问题。要求：
1. 生成3个问题
2. 问题要符合孩子认知水平
3. 包含理解性问题和开放性问题
4. 用孩子能理解的语言
5. 格式简洁，每行一个问题`
    },
    {
      role: 'user',
      content: `请为绘本《${book.title}》生成3个亲子问答题目，适合${ageRange}岁孩子。
要求：
1. 第1个问题：关于故事内容的（感知记忆）
2. 第2个问题：需要理解的（理解应用）
3. 第3个问题：开放性思考（创造评价）
只输出问题，每行一个问题，不要编号。`
    }
  ];

  return await callKimiAPI(messages, 0.7);
}

// Kimi AI 生成推荐理由
async function kimiGenerateReason(book, childProfile) {
  const profileInfo = childProfile ? `
孩子画像：
- 年龄：${childProfile.age || '未知'}岁
- 兴趣：${childProfile.interests ? childProfile.interests.slice(0, 3).join('、') : '阅读'}
- 能力优势：${childProfile.abilities ? Object.entries(childProfile.abilities).sort((a,b) => b[1]-a[1]).slice(0, 2).map(([k]) => k).join('、') : '综合'}
- 需要加强：${childProfile.weakAbilities ? childProfile.weakAbilities.join('、') : '综合能力'}
` : '';

  const messages = [
    {
      role: 'system',
      content: `你是"童书伴读"的智能推荐专家，为家长生成个性化的绘本推荐理由。要求：
1. 推荐理由要贴合孩子特点
2. 突出绘本与孩子需求的匹配点
3. 语言温暖专业
4. 控制在60字以内
5. 要有说服力，让人想读这本书`
    },
    {
      role: 'user',
      content: `绘本：《${book.title}》
作者：${book.author || '未知'}
${profileInfo}

请生成一段吸引家长的推荐理由，说明为什么这本书适合这个孩子。`
    }
  ];

  return await callKimiAPI(messages, 0.6);
}

// Kimi AI 阅读分析
async function kimiAnalyzeReading(records, profile) {
  const recentBooks = records.slice(0, 10).map(r => r.bookTitle).join('、');
  const ageInfo = profile?.age ? `${profile.age}岁` : '4-5岁';
  const totalBooks = new Set(records.map(r => r.bookTitle)).size;
  const totalMinutes = records.reduce((sum, r) => sum + (r.duration || 0), 0);
  
  const messages = [
    {
      role: 'system',
      content: `你是"童书伴读"的阅读成长分析师，基于阅读记录为家长提供专业分析。
要求：
1. 返回严格的JSON格式，不要包含任何其他文字
2. JSON包含4个字段：preference（阅读偏好，50字内）、ability（能力发展，50字内）、suggestion（阅读建议，50字内）、expand（拓展推荐，50字内）
3. 语言温暖专业，有洞察力
4. 要有数据支撑，不要空泛`
    },
    {
      role: 'user',
      content: `孩子信息：${ageInfo}
共阅读 ${totalBooks} 本书，总时长 ${totalMinutes} 分钟
最近阅读的绘本：${recentBooks}

请分析并返回JSON：
{
  "preference": "孩子的阅读偏好分析",
  "ability": "能力发展情况",
  "suggestion": "具体的阅读建议",
  "expand": "可以从哪些方面拓展"
}`
    }
  ];

  const result = await callKimiAPI(messages, 0.5);
  if (!result) return null;
  
  try {
    const jsonStr = result.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(jsonStr);
  } catch (e) {
    return {
      preference: result.slice(0, 60),
      ability: '语言理解和想象力表现积极，继续保持',
      suggestion: '增加科普类书籍拓宽知识面',
      expand: '科普知识、传统文化、情感教育'
    };
  }
}

// ============ API Key 管理 ============
function getKimiApiKey() {
  return localStorage.getItem('kimi_api_key') || '';
}

function setKimiApiKey(key) {
  localStorage.setItem('kimi_api_key', key);
}

function openApiKeyModal() {
  document.getElementById('api-key-input').value = getKimiApiKey();
  document.getElementById('api-key-modal').classList.add('show');
}

function closeApiKeyModal() {
  document.getElementById('api-key-modal').classList.remove('show');
}

function saveApiKey() {
  const key = document.getElementById('api-key-input').value.trim();
  if (key && !key.startsWith('sk-')) {
    showToast('API Key 格式不正确，应以 sk- 开头');
    return;
  }
  setKimiApiKey(key);
  updateApiKeyStatus();
  closeApiKeyModal();
  showToast(key ? 'API Key 保存成功 ✨' : 'API Key 已清除');
}

function updateApiKeyStatus() {
  const key = getKimiApiKey();
  const statusEl = document.getElementById('api-key-status');
  if (statusEl) {
    if (key) {
      statusEl.textContent = '已配置 · ' + key.slice(0, 6) + '...' + key.slice(-4);
      statusEl.style.color = '#7BC67E';
    } else {
      statusEl.textContent = '点击配置 Kimi AI API Key';
      statusEl.style.color = '';
    }
  }
}
