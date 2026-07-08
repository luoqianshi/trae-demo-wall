/* ============================================
   api.js — AI API 调用封装
   Agnes 2.0 Flash (文本) + Agnes Image 2.1 Flash (图像)
   ============================================ */

const API_KEY = 'sk-YOUR_API_KEY_HERE';

function _combineSignals(externalSignal, timeoutMs) {
  if (!externalSignal) return AbortSignal.timeout(timeoutMs);
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([externalSignal, AbortSignal.timeout(timeoutMs)]);
  }
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  externalSignal.addEventListener('abort', onAbort, { once: true });
  const tid = setTimeout(() => ctrl.abort(), timeoutMs);
  ctrl.signal.addEventListener('abort', () => {
    clearTimeout(tid);
    externalSignal.removeEventListener('abort', onAbort);
  }, { once: true });
  return ctrl.signal;
}

const API = {
  TEXT_ENDPOINT: 'https://apihub.agnes-ai.com/v1/chat/completions',
  IMAGE_ENDPOINT: 'https://apihub.agnes-ai.com/v1/images/generations',
  TEXT_MODEL: 'agnes-2.0-flash',
  IMAGE_MODEL: 'agnes-image-2.1-flash',
  TEXT_TIMEOUT: 60000,
  IMAGE_TIMEOUT: 180000,

  // --- 8 种风格的 System Prompt + Image 提示词 ---
  STYLE_PROMPTS: {
    '武侠': {
      system: '你是一位武侠小说大师，风格融合古龙和金庸。请用短句、富有节奏感的语言，写一段关于这件旧物的虚构武侠故事。注意：要赋予物品一段传奇的江湖前世。200-300字。',
      image: '一张关于"{itemName}"的水墨插画，古风武侠意境，黑白为主点缀朱红，留白构图，毛笔笔触，有宣纸纹理。',
    },
    '科幻': {
      system: '你是一位赛博朋克科幻作家。请用冷峻、充满科技感的语言，写一段关于这件旧物的虚构科幻故事。讲述它在未来世界或异星文明中的前世。200-300字。',
      image: '一张关于"{itemName}"的赛博朋克插画，深蓝紫色基调，发光线条勾勒未来感构图，冷色调，电路纹理效果。',
    },
    '治愈': {
      system: '你是一位温暖细腻的治愈系作家。请用柔软、充满温度的语言，写一段关于这件旧物的治愈故事。讲述它如何承载温情与回忆。200-300字。',
      image: '一张关于"{itemName}"的温暖水彩插画，暖黄与淡粉色晕染，柔和光线，温馨氛围，水彩纸纹理，朦胧美感。',
    },
    '悬疑': {
      system: '你是一位推理悬疑小说家。请用冷静、细腻、充满悬念的语言，写一段关于这件旧物的悬疑故事。留下未解的谜团。200-300字。',
      image: '一张关于"{itemName}"的铅笔素描插画，暗灰色调，明暗对比强烈，阴影浓重，写实细腻的素描线条，犯罪现场记录感。',
    },
    '王家卫风': {
      system: '你是一位模仿王家卫电影风格的作者。请用碎片化的独白、暧昧的情绪、充满画面感的语言，写一段关于这件旧物的故事。像电影旁白一样，带着疏离与深情。200-300字。',
      image: '一张关于"{itemName}"的胶片电影质感插画，复古红与暗绿色调，颗粒感，光影斑驳，广角镜头感，像王家卫电影中的一帧。',
    },
    '童话': {
      system: '你是一位童话作家。请用"从前……"的口吻，写一段关于这件旧物的童话故事。语言要充满童趣和想象力，像给孩子讲的睡前故事。200-300字。',
      image: '一张关于"{itemName}"的童趣水彩插画，色彩斑斓明亮，像儿童绘本插画，彩铅质感，构图天真烂漫，温暖画面。',
    },
    '古风': {
      system: '你是一位精通文言文的古风作家。请用半文半白的语言，写一段关于这件旧物的古风故事。要有古典诗词的意境和韵律。200-300字。',
      image: '一张关于"{itemName}"的中国工笔插画，青绿山水色调，细腻线条勾勒，墨色渲染，古典雅致，绢本质感。',
    },
    '热血动漫': {
      system: '你是一位热血动漫编剧。请用夸张、激昂、充满感叹号的语言，写一段关于这件旧物的热血故事。要有"友情、努力、胜利"的精神！200-300字。',
      image: '一张关于"{itemName}"的日式动漫插画，鲜艳橙红与亮黄色调，动态构图，粗线条勾边，高饱和度色彩，爆炸特效感觉。',
    },
  },

  // --- 构建文本请求 ---
  buildTextRequest(style, itemName, itemDescription) {
    const promptConfig = this.STYLE_PROMPTS[style];
    const desc = itemDescription || '一件普通的旧物';

    // 自定义风格：使用通用 prompt
    const systemPrompt = promptConfig
      ? promptConfig.system
      : `你是一位「${style}」风格的作家。请用富有感染力的语言，写一段关于这件旧物的虚构故事。赋予物品一段传奇的前世。200-300字。`;

    return {
      model: this.TEXT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `物品名称：${itemName}\n物品描述：${desc}` },
      ],
      max_tokens: 800,
      temperature: 0.85,
      stream: false,
    };
  },

  // --- 构建图像请求 ---
  buildImageRequest(style, itemName, itemDescription) {
    const promptConfig = this.STYLE_PROMPTS[style];
    const desc = itemDescription || '一件普通的旧物';

    // 自定义风格：使用通用 image prompt
    const imagePrompt = promptConfig
      ? promptConfig.image.replace('{itemName}', itemName).replace('{itemDescription}', desc)
      : `一张关于"${itemName}"的精美插画，「${style}」风格，富有艺术感，构图精美。`;

    return {
      model: this.IMAGE_MODEL,
      prompt: imagePrompt,
      size: '512x384',
      extra_body: {
        response_format: 'b64_json',
      },
    };
  },

  // --- 调用文本 API ---
  async generateStory(style, itemName, itemDescription, externalSignal) {
    const body = this.buildTextRequest(style, itemName, itemDescription);

    const signal = _combineSignals(externalSignal, this.TEXT_TIMEOUT);

    try {
      const res = await fetch(this.TEXT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error(`[API] 文本生成失败 (${res.status}):`, errText);
        throw new Error(`文本生成失败 (${res.status}): ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (!content) {
        console.warn('[API] 文本生成返回空内容:', JSON.stringify(data).slice(0, 300));
      }
      return content;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('文本生成请求超时，请重试');
      }
      throw err;
    }
  },

  // --- 调用图像 API ---
  async generateImage(style, itemName, itemDescription, externalSignal) {
    const body = this.buildImageRequest(style, itemName, itemDescription);

    const signal = _combineSignals(externalSignal, this.IMAGE_TIMEOUT);

    try {
      const res = await fetch(this.IMAGE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        console.error(`[API] 图像生成失败 (${res.status}):`, errText);
        throw new Error(`图像生成失败 (${res.status}): ${errText.slice(0, 200)}`);
      }

      const data = await res.json();
      const b64 = data.data?.[0]?.b64_json || '';
      if (!b64) {
        console.warn('[API] 图像生成返回空数据:', JSON.stringify(data).slice(0, 300));
      }
      return b64 ? `data:image/png;base64,${b64}` : '';
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('图像生成超时，将仅展示文字故事');
      }
      throw err;
    }
  },

  // --- 同时生成故事和图像 ---
  async generateAll(style, itemName, itemDescription, signal) {
    const [story, imageUrl] = await Promise.all([
      this.generateStory(style, itemName, itemDescription, signal),
      this.generateImage(style, itemName, itemDescription, signal).catch(() => null),
    ]);

    return { text: story, imageUrl, style };
  },

  // --- 续写故事 ---
  async continueStory(style, existingText, externalSignal) {
    const promptConfig = this.STYLE_PROMPTS[style];
    const systemPrompt = promptConfig
      ? `你是一位${style}风格的作家，请保持相同的风格和语气，继续写下面这个故事。200-300字。`
      : `请保持相同的风格和语气，继续写下面这个故事。200-300字。`;

    const body = {
      model: this.TEXT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `请继续写这个故事：\n\n${existingText.slice(-500)}` },
      ],
      max_tokens: 800,
      temperature: 0.85,
      stream: false,
    };

    const signal = _combineSignals(externalSignal, this.TEXT_TIMEOUT);

    try {
      const res = await fetch(this.TEXT_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify(body),
        signal,
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`续写生成失败 (${res.status}): ${errText}`);
      }

      const data = await res.json();
      return data.choices?.[0]?.message?.content || '';
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('续写请求超时，请重试');
      }
      throw err;
    }
  },
};