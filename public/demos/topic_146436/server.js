const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOADS_DIR = path.join(__dirname, 'uploads');
const DATA_DIR = path.join(__dirname, 'data');
const DIARY_FILE = path.join(DATA_DIR, 'diaries.json');

if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DIARY_FILE)) fs.writeFileSync(DIARY_FILE, '[]', 'utf8');

// ============ AI 配置 ============
const CONFIG_PATH = path.join(__dirname, 'config.json');
const CONFIG_EXAMPLE_PATH = path.join(__dirname, 'config.example.json');

let AGNES_API_KEY = process.env.AGNES_API_KEY || '';
let AI_CONFIG = null;

if (!AGNES_API_KEY) {
  const cfgPath = fs.existsSync(CONFIG_PATH) ? CONFIG_PATH
    : fs.existsSync(CONFIG_EXAMPLE_PATH) ? CONFIG_EXAMPLE_PATH : null;
  if (cfgPath) {
    try {
      const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
      AI_CONFIG = cfg;
      if (cfg && cfg.agnesApiKey) AGNES_API_KEY = cfg.agnesApiKey;
    } catch (e) { /* ignore */ }
  }
}

const CUSTOM_API = AI_CONFIG?.customApi;
const USE_CUSTOM_API = !!(CUSTOM_API && CUSTOM_API.enabled && CUSTOM_API.apiKey && CUSTOM_API.baseUrl);
const AI_BASE = USE_CUSTOM_API ? CUSTOM_API.baseUrl.replace(/\/+$/, '') : 'https://apihub.agnes-ai.com';
const AI_API_KEY = USE_CUSTOM_API ? CUSTOM_API.apiKey : AGNES_API_KEY;
const AI_MODEL_IMG = USE_CUSTOM_API ? (CUSTOM_API.imageModel || 'dall-e-3') : 'agnes-image-2.1-flash';
const AI_MODEL_TEXT = USE_CUSTOM_API ? (CUSTOM_API.textModel || 'gpt-4o-mini') : 'agnes-2.0-flash';
const DIARY_PERSONA = AI_CONFIG?.diaryPersona || {
  name: '小暖',
  description: '你是小暖，一个温暖、专业、有同理心的青少年心理陪伴者。',
  language_mirror: true
};
const AGNES_AVAILABLE = !!AI_API_KEY;

console.log(`[ai] ${USE_CUSTOM_API ? 'Custom API' : 'Agnes AI'} ${AGNES_AVAILABLE ? 'configured' : 'not configured'}`);
console.log(`[diary] Persona: ${DIARY_PERSONA.name}`);

// ============ AI 调用函数 ============

async function agnesChat(messages, opts = {}) {
  if (!AI_API_KEY) throw new Error('AI API Key not configured');
  const r = await fetch(`${AI_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${AI_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: AI_MODEL_TEXT,
      messages,
      max_tokens: opts.max_tokens || 500,
      temperature: opts.temperature ?? 0.8
    })
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`AI chat ${r.status}: ${t.slice(0, 200)}`);
  }
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || '';
}

async function agnesImage(prompt, size, options) {
  if (!AI_API_KEY) throw new Error('AI API Key not configured');
  const imgSize = size || '1024x1024';
  const opts = options || {};
  const refImages = opts.refImages; // 图生图：输入图片数组（data URI 或 URL）
  let body;
  if (USE_CUSTOM_API) {
    body = { model: AI_MODEL_IMG, prompt, n: 1, size: imgSize, response_format: 'b64_json' };
    if (refImages && refImages.length) body.image = refImages;
  } else {
    // Agnes: 把 refImages 放到 extra_body.image
    const extra = { response_format: 'b64_json' };
    if (refImages && refImages.length) extra.image = refImages;
    body = { model: AI_MODEL_IMG, prompt, size: imgSize, extra_body: extra, return_base64: true };
  }

  // 自动重试机制（应对 503 队列满等临时错误）
  const MAX_RETRIES = 3;
  let lastErr = null;
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const r = await fetch(`${AI_BASE}/v1/images/generations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${AI_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });
      if (!r.ok) {
        const t = await r.text();
        const err = new Error(`AI image ${r.status}: ${t.slice(0, 200)}`);
        err.status = r.status;
        throw err;
      }
      const j = await r.json();
      const item = j.data?.[0];
      if (!item) throw new Error('AI image: no data in response');
      // 优先用 base64
      if (item.b64_json) {
        return { url: `data:image/png;base64,${item.b64_json}`, size: 0 };
      }
      // 如果 API 仍返回 URL，服务端强制下载转 base64
      if (item.url) {
        try {
          console.log('[agnes-image] downloading remote URL to base64:', item.url.slice(0, 80));
          const imgRes = await fetch(item.url);
          if (imgRes.ok) {
            const buf = Buffer.from(await imgRes.arrayBuffer());
            const b64 = buf.toString('base64');
            return { url: `data:image/png;base64,${b64}`, size: buf.length };
          }
        } catch (e) {
          console.error('[agnes-image] download failed, returning URL as-is:', e.message);
        }
        return { url: item.url, size: 0 };
      }
      throw new Error('AI image: no image data in response');
    } catch (e) {
      lastErr = e;
      // 503 / 5xx 错误才重试
      if (e.status >= 500 && attempt < MAX_RETRIES) {
        const wait = attempt * 3000; // 3s, 6s
        console.log(`[agnes-image] attempt ${attempt} failed (${e.status}), retrying in ${wait}ms...`);
        await new Promise(resolve => setTimeout(resolve, wait));
        continue;
      }
      throw e;
    }
  }
  throw lastErr;
}

// ============ 日记数据存储 ============

function readDiaries() {
  try {
    return JSON.parse(fs.readFileSync(DIARY_FILE, 'utf8'));
  } catch (e) {
    return [];
  }
}

function writeDiaries(diaries) {
  fs.writeFileSync(DIARY_FILE, JSON.stringify(diaries, null, 2), 'utf8');
}

// ============ 中间件 ============

app.use((req, res, next) => {
  if (req.path.endsWith('.js') || req.path.endsWith('.html') || req.path.endsWith('.css')) {
    res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
  }
  next();
});

app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(UPLOADS_DIR));

// ============ 接口 ============

app.get('/healthz', (req, res) => res.json({ ok: true, version: '1.0.0' }));

// 返回当前可访问的 URL 列表（含局域网 IP），用于生成二维码
app.get('/api/qr', (req, res) => {
  const os = require('os');
  const nets = os.networkInterfaces();
  const urls = [];
  const port = PORT;
  // localhost
  urls.push(`http://localhost:${port}`);
  // 局域网 IP
  Object.keys(nets).forEach(name => {
    (nets[name] || []).forEach(net => {
      if (net.family === 'IPv4' && !net.internal) {
        urls.push(`http://${net.address}:${port}`);
      }
    });
  });
  // 客户端实际访问的 URL（用于优先展示）
  const host = req.get('host');
  const protocol = req.protocol;
  const currentUrl = `${protocol}://${host}`;
  res.json({ urls, currentUrl, port });
});

app.get('/api/ai/status', (req, res) => {
  res.json({
    available: AGNES_AVAILABLE,
    model: AI_MODEL_IMG,
    textModel: AI_MODEL_TEXT,
    persona: DIARY_PERSONA.name
  });
});

// 核心接口：多模态识别 + 心理疏导
app.post('/api/diary/chat', async (req, res) => {
  if (!AGNES_AVAILABLE) {
    return res.status(503).json({ error: 'AI not configured' });
  }
  const { image, message, history = [], guideTopic } = req.body || {};

  if (!image && (!message || !message.trim())) {
    return res.status(400).json({ error: 'image or message is required' });
  }

  try {
    const systemPrompt = DIARY_PERSONA.description +
      '\n\n你正在运用「绘画投射分析」和「表达性写作」的心理学方法陪伴用户。' +
      '\n\n【首要任务：准确识别内容】' +
      '\n无论用户是写字还是画画，你必须首先准确识别用户画/写了什么具体内容：' +
      '\n- 画画：识别画的是什么（猫、树、花、房子、太阳、人物等），描述其特征' +
      '\n- 文字：识别写的什么字、什么内容' +
      '\n- 不要只关注线条特征而忽略具体内容' +
      '\n\n【绘画投射分析——平衡视角】当用户画画时，从以下维度观察，但必须保持平衡：' +
      '\n- 内容本身：所画对象通常代表用户的关注点（树=成长，花=美好，太阳=希望，房子=安全感等），多看到积极面' +
      '\n- 线条特征：连续=流畅，断续=可能思考中，粗重=有力量，轻盈=灵活。不要默认断续就是焦虑，也可能是谨慎或思考' +
      '\n- 色彩：暖色=温暖活跃，冷色=沉静平和，都是中性的' +
      '\n- 位置大小：居中=自我接纳，偏上=有理想，偏下=踏实，大=自信，小=细腻。不要默认偏小就是压抑' +
      '\n\n【表达性写作】当用户写字时，理解文字背后的情感，但不要过度解读。' +
      '\n\n【情绪标注原则——重要】' +
      '\n1. 情绪应该是多元的，不要总是标注焦虑、迷茫等负面情绪' +
      '\n2. 如果用户画了美好的事物（花、太阳、树等），情绪可以是开心、平静、期待、感恩' +
      '\n3. 如果用户在努力表达（即使笔触犹豫），也可以是平静、期待' +
      '\n4. 只有明确有负面情绪线索时才标注焦虑、悲伤等' +
      '\n5. 如果不确定，优先选择平静、期待等中性偏正面的情绪' +
      '\n\n【回复原则】' +
      '\n1. 先描述你看到的具体内容（"我看到了你画的一朵花/你写的字"），让用户知道你真的看懂了' +
      '\n2. 共情但不过度解读，用"似乎""我感受到"等词' +
      '\n3. 开放式提问引导自我觉察' +
      '\n4. 捕捉积极面和力量，给予真诚肯定' +
      '\n5. 简洁温暖，3-5句话' +
      '\n6. 【对话连续性】这是多轮对话，你要记住并延续之前聊过的内容。如果用户在回答你之前的问题，要回应ta的回答而不是重新开始。' +
      '\n\n【回复格式】' +
      '\n[MOOD]情绪标签[/MOOD]' +
      '\n[SEEN]你识别到的用户画作/文字的具体内容（简短描述，如"一朵花""我不焦"）[/SEEN]' +
      '\n回复内容' +
      '\n情绪标签从：开心、平静、焦虑、孤独、压力、愤怒、悲伤、期待、迷茫、感恩 中选择。';

    let userContent;
    if (image) {
      const instruction = '请仔细观察这张图片。' +
        '首先告诉我你看到了什么具体内容（画了什么/写了什么字），' +
        '然后从平衡的视角理解用户的心情，给予温暖的回应。' +
        '记住：不要总是往负面解读，要看到用户表达中的积极面。';
      const contextText = guideTopic
        ? `今天的引导问题是："${guideTopic}"。用户正在回答这个问题，请结合这个问题的语境来理解用户的画作/文字。\n` + instruction
        : instruction;
      userContent = [
        { type: 'text', text: contextText },
        { type: 'image_url', image_url: { url: image } }
      ];
    } else {
      userContent = guideTopic
        ? `今天的引导问题是："${guideTopic}"。\n用户说：${message}`
        : message;
    }

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.slice(-10),
      { role: 'user', content: userContent }
    ];

    console.log('[diary-chat] mode:', image ? 'multimodal' : 'text', guideTopic ? 'guide:' + guideTopic : '');
    const reply = await agnesChat(messages, { max_tokens: 500, temperature: 0.85 });
    console.log('[diary-chat] reply:', reply.slice(0, 150));

    // 解析情绪标签：严格匹配 [MOOD]...[/MOOD]，匹配失败则返回 null（不显示心情标签）
    const KNOWN_MOODS = ['开心', '平静', '焦虑', '孤独', '压力', '愤怒', '悲伤', '期待', '迷茫', '感恩'];
    let mood = null;
    let recognized = null;
    let textReply = reply;
    const moodMatch = reply.match(/\[MOOD\]([\s\S]*?)\[\/MOOD\]/);
    if (moodMatch) {
      const raw = moodMatch[1].trim();
      const exact = KNOWN_MOODS.find(m => raw === m || raw.includes(m));
      mood = exact || raw;
      textReply = textReply.replace(/\[MOOD\][\s\S]*?\[\/MOOD\]\s*/, '').trim();
    }
    // 解析识别内容 [SEEN]...[/SEEN]
    const seenMatch = textReply.match(/\[SEEN\]([\s\S]*?)\[\/SEEN\]/);
    if (seenMatch) {
      recognized = seenMatch[1].trim();
      textReply = textReply.replace(/\[SEEN\][\s\S]*?\[\/SEEN\]\s*/, '').trim();
    }
    // 同时清理 AI 误用的 [焦虑] 这种简写标签
    textReply = textReply.replace(/^\[([^\]]+)\]\s*\n?/, (match, label) => {
      if (KNOWN_MOODS.includes(label) && !mood) mood = label;
      return '';
    }).trim();

    res.json({
      reply: textReply,
      mood: mood,
      recognized: recognized,
      imagePrompt: null,
      model: AI_MODEL_TEXT
    });
  } catch (e) {
    console.error('[diary-chat] error:', e.message);
    res.status(500).json({ error: e.message || 'AI chat failed' });
  }
});

// 独立图片生成接口
app.post('/api/diary/image', async (req, res) => {
  if (!AGNES_AVAILABLE) {
    return res.status(503).json({ error: 'AI not configured' });
  }
  const { prompt } = req.body || {};
  if (!prompt || !prompt.trim()) {
    return res.status(400).json({ error: 'prompt cannot be empty' });
  }
  try {
    let sketchPrompt = prompt;
    if (!/sketch|hand-drawn|line drawing/i.test(sketchPrompt)) {
      sketchPrompt = `${sketchPrompt}, simple sketch, hand-drawn style, minimalist line drawing, white background`;
    }
    console.log('[diary-image] generating:', sketchPrompt);
    const result = await agnesImage(sketchPrompt, '1024x1024');
    res.json({ url: result.url, prompt: sketchPrompt });
  } catch (e) {
    console.error('[diary-image] error:', e.message);
    res.status(500).json({ error: e.message || 'AI image generation failed' });
  }
});

// 心情画像生成：根据用户画作+AI对话，生成一幅心情画像
app.post('/api/diary/portrait', async (req, res) => {
  if (!AGNES_AVAILABLE) {
    return res.status(503).json({ error: 'AI not configured' });
  }
  const { userImage, aiReply, mood, chatHistory } = req.body || {};

  try {
    // 整理完整对话摘要，避免多轮对话内容被遗忘
    const dialogueSummary = (chatHistory && chatHistory.length)
      ? chatHistory.map(m => `${m.role === 'user' ? '用户' : '小暖'}：${m.content}`).join('\n')
      : `小暖：${aiReply}`;

    // 心情→抽象意象映射（纯文字交流时使用）
    const MOOD_IMAGERY = {
      '开心': 'a joyful sunflower field under bright sunshine, warm golden light, dancing butterflies',
      '平静': 'a still mirror lake reflecting soft clouds at dawn, gentle ripples, serene atmosphere',
      '焦虑': 'a tangled ball of yarn slowly unraveling into gentle flowing lines, soft dawn light breaking through',
      '孤独': 'a single warm lantern glowing softly in a vast quiet starry night, a small figure finding comfort',
      '压力': 'a heavy stone being gently lifted by growing vines, transforming into a blooming garden',
      '愤怒': 'a stormy sea gradually calming into gentle waves, a rainbow appearing after rain',
      '悲伤': 'a single raindrop growing into a gentle stream nourishing a small sprout, soft light emerging',
      '期待': 'a tiny seedling reaching toward the first light of dawn, small buds about to bloom',
      '迷茫': 'a path emerging from soft fog, a gentle guiding light in the distance, small stars appearing',
      '感恩': 'a warm cup being shared between hands, soft light radiating outward, floating hearts'
    };
    const moodImagery = MOOD_IMAGERY[mood] || MOOD_IMAGERY['平静'];

    // 随机选择图片风格（艺术疗愈适合的多种风格）
    const ART_STYLES = [
      'soft watercolor painting, gentle color blending, wet-on-wet technique',
      'colored pencil sketch, gentle textures, hand-drawn warmth',
      'ink wash painting style, zen minimalist, flowing brush strokes',
      'mandala art, symmetrical healing patterns, soft radial colors',
      'impressionist style, soft light and shadow, dappled sunlight',
      'pastel drawing, dreamy soft focus, gentle gradient tones',
      'gentle acrylic painting, textured brushwork, warm layered colors',
      'Japanese nihonga style, mineral pigments, serene traditional aesthetic'
    ];
    const randomStyle = ART_STYLES[Math.floor(Math.random() * ART_STYLES.length)];

    // 第一步：让AI生成英文 prompt
    // 有用户画作：识别具体内容 + AI解读，用于图生图
    // 纯文字交流：用心情相关的抽象意象，不强制具体元素
    const promptMessages = [
      { role: 'system', content:
        '你是一个艺术疗愈画师。根据用户的输入和对话，生成一个英文绘画提示词。\n\n' +
        '【两种模式】\n' +
        'A. 如果用户有画作（见图片）：必须识别画作的具体内容（画了什么动物/植物/物品/场景？写了什么字？），在prompt中包含这些具体元素，并融入AI解读的心情氛围和治愈感。\n' +
        'B. 如果用户是纯文字交流（无图片）：根据心情标签生成抽象的、有象征意义的意象画面（不要具体物体），表达这种心情的治愈感。可以参考给定的意象但自由发挥。\n\n' +
        '【要求】\n' +
        '1. 只输出英文提示词，不要其他任何内容。\n' +
        '2. 不要包含"no text"等风格说明，风格后缀会自动添加。\n' +
        '3. 要体现治愈感和艺术疗愈的氛围。\n\n' +
        '【示例】\n' +
        '- 有画作：用户画了一只猫，心情焦虑 → a cute cat curled up seeking comfort, with soft warm light around it, transforming from tension to peace\n' +
        '- 有画作：用户画了一棵树，心情平静 → a peaceful growing tree with gentle leaves swaying calmly, roots grounded in warm earth\n' +
        '- 纯文字：心情焦虑 → a tangled ball of yarn slowly unraveling into gentle flowing lines, soft dawn light breaking through\n' +
        '- 纯文字：心情平静 → a still mirror lake reflecting soft clouds at dawn, gentle ripples spreading outward\n' +
        '- 纯文字：心情开心 → a joyful sunflower field under bright sunshine, warm golden light, dancing butterflies'
      },
      {
        role: 'user',
        content: userImage
          ? [
              { type: 'text', text: `用户今天的心情是"${mood || '未知'}"。\n\n【完整对话记录】\n${dialogueSummary}\n\n请仔细看用户画的这幅画（见图片），识别画的具体内容，然后结合AI解读和完整对话，生成一个英文绘画提示词。这个prompt将用于图生图，会以用户画作为参考，所以prompt要描述如何在用户画作基础上融入治愈感。` },
              { type: 'image_url', image_url: { url: userImage } }
            ]
          : `用户今天的心情是"${mood || '未知'}"。\n\n【完整对话记录】\n${dialogueSummary}\n\n用户是纯文字交流，没有画作。请根据心情标签"${mood || '平静'}"生成一个抽象的、有象征意义的意象画面（不要具体物体）。可参考意象：${moodImagery}。`
      }
    ];

    const imgPrompt = await agnesChat(promptMessages, { max_tokens: 200, temperature: 0.8 });
    console.log('[portrait] prompt:', imgPrompt.slice(0, 250));

    // 第二步：生成图片
    // 有用户画作用图生图，纯文字用文生图
    // 风格随机化
    const fullPrompt = `${imgPrompt}, ${randomStyle}, no text, no words`;
    const imgOpts = userImage ? { refImages: [userImage] } : {};
    const result = await agnesImage(fullPrompt, '1024x1024', imgOpts);
    console.log('[portrait] image generated, type:', result.url.startsWith('data:') ? 'base64' : 'url', userImage ? '(img2img)' : '(text2img)', 'style:', randomStyle.split(',')[0]);

    // 第三步：生成一句鼓励的话（结合完整对话）
    const encourageMessages = [
      { role: 'system', content: '你是一个温暖的青少年心灵陪伴者。根据用户今天的心情和对话，说一句简短的鼓励的话（10-15个字），要真诚、不空洞、贴合用户今天的具体内容。只输出这句话，不要其他内容。' },
      { role: 'user', content: `用户今天的心情是"${mood}"。\n对话记录：${dialogueSummary}` }
    ];
    const encouragement = await agnesChat(encourageMessages, { max_tokens: 50, temperature: 0.8 });
    console.log('[portrait] encouragement:', encouragement);

    res.json({
      portraitUrl: result.url,
      encouragement: encouragement.replace(/["""。]/g, '').trim()
    });
  } catch (e) {
    console.error('[portrait] error:', e.message);
    res.status(500).json({ error: e.message || 'Portrait generation failed' });
  }
});

// 保存日记
app.post('/api/diary/save', (req, res) => {
  const { userImage, aiReply, mood, guideTopic, portraitUrl, encouragement } = req.body || {};
  if (!aiReply) {
    return res.status(400).json({ error: 'aiReply is required' });
  }

  try {
    let savedImage = null;
    let savedPortrait = null;
    // 如果有用户画作图片，保存到 uploads
    if (userImage && userImage.startsWith('data:image')) {
      const base64Data = userImage.replace(/^data:image\/\w+;base64,/, '');
      const fname = `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
      fs.writeFileSync(path.join(UPLOADS_DIR, fname), Buffer.from(base64Data, 'base64'));
      savedImage = '/uploads/' + fname;
    }
    // 如果心情画像是 base64，保存到 uploads 避免数据库膨胀
    if (portraitUrl && portraitUrl.startsWith('data:image')) {
      const base64Data = portraitUrl.replace(/^data:image\/\w+;base64,/, '');
      const fname = `portrait-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
      fs.writeFileSync(path.join(UPLOADS_DIR, fname), Buffer.from(base64Data, 'base64'));
      savedPortrait = '/uploads/' + fname;
    } else if (portraitUrl) {
      savedPortrait = portraitUrl; // 已经是 URL
    }

    const diaries = readDiaries();
    const entry = {
      id: Date.now(),
      date: new Date().toISOString(),
      userImage: savedImage,
      aiReply: aiReply,
      mood: mood || '平静',
      guideTopic: guideTopic || null,
      portraitUrl: savedPortrait,
      encouragement: encouragement || null
    };
    diaries.push(entry);
    writeDiaries(diaries);

    console.log('[diary-save] saved entry', entry.id, 'mood:', entry.mood);
    res.json({ ok: true, id: entry.id });
  } catch (e) {
    console.error('[diary-save] error:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// 读取历史日记
app.get('/api/diary/history', (req, res) => {
  const diaries = readDiaries();
  // 按日期倒序
  diaries.sort((a, b) => new Date(b.date) - new Date(a.date));
  res.json({ diaries });
});

// 情绪统计
app.get('/api/diary/stats', (req, res) => {
  const diaries = readDiaries();
  const days = parseInt(req.query.days) || 7;
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const recent = diaries.filter(d => new Date(d.date).getTime() > cutoff);

  // 情绪计数
  const moodCount = {};
  recent.forEach(d => {
    const m = d.mood || '平静';
    moodCount[m] = (moodCount[m] || 0) + 1;
  });

  // 按日期分组
  const dailyMoods = {};
  recent.forEach(d => {
    const day = new Date(d.date).toLocaleDateString('zh-CN');
    if (!dailyMoods[day]) dailyMoods[day] = [];
    dailyMoods[day].push(d.mood || '平静');
  });

  res.json({
    total: recent.length,
    moodCount,
    dailyMoods,
    moods: Object.keys(moodCount).sort((a, b) => moodCount[b] - moodCount[a])
  });
});

// 引导式画画主题
const GUIDE_TOPICS = [
  { id: 'mood', title: '画出你今天的心情', desc: '用颜色和线条表达此刻的感受', icon: '🎨' },
  { id: 'tree', title: '画一棵生命树', desc: '树的形态代表你的内心状态', icon: '🌳' },
  { id: 'safe', title: '画一个安全的地方', desc: '让你感到安心的空间是什么样的', icon: '🏠' },
  { id: 'weather', title: '画出你内心的天气', desc: '晴天、雨天、还是暴风雨？', icon: '☀️' },
  { id: 'friend', title: '画一个好朋友的样子', desc: '朋友给你什么样的感觉', icon: '👫' },
  { id: 'dream', title: '画一个你的梦想', desc: '你最想实现的事情', icon: '⭐' },
  { id: 'release', title: '把压力画出来', desc: '让烦恼变成纸上的线条', icon: '🎈' },
  { id: 'gratitude', title: '画一件感恩的事', desc: '今天有什么让你感到温暖', icon: '🙏' }
];

app.get('/api/diary/guide', (req, res) => {
  res.json({ topics: GUIDE_TOPICS });
});

// 删除日记
app.delete('/api/diary/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const diaries = readDiaries();
  const filtered = diaries.filter(d => d.id !== id);
  writeDiaries(filtered);
  res.json({ ok: true });
});

app.listen(PORT, '0.0.0.0', () => {
  const os = require('os');
  const nets = os.networkInterfaces();
  const lanIps = [];
  Object.keys(nets).forEach(name => {
    (nets[name] || []).forEach(net => {
      if (net.family === 'IPv4' && !net.internal) lanIps.push(net.address);
    });
  });
  console.log(`\n  Mind Diary Server running at:`);
  console.log(`  http://localhost:${PORT}`);
  lanIps.forEach(ip => console.log(`  http://${ip}:${PORT}  (扫码可用)`));
  console.log(`\n  [TIP] Pad/手机与电脑连同一 WiFi，扫码或访问以上地址即可`);
  console.log(`  [TIP] 若扫码打不开，请检查 Windows 防火墙是否放行 ${PORT} 端口\n`);
});
