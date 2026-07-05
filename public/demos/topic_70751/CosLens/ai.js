// ai.js — 多模态调用（qwen-vl-max，OpenAI 兼容模式）
//
// 经典脚本版（非 ES Module）。公共 API 挂到 window.CosLens。
//
// 说明：真实 AI 识别为「可选项」。浏览器直连大模型会被 CORS 拦截，且不能在前端
// 暴露 Key，因此真实识别需要配套的本地代理 server.py（读取服务端 api-key.txt）。
// 若未启动服务 / 未配置 Key，主流程 main.js 会自动降级到「示例特征」，不会报错。
(function () {
  'use strict';

  const PROXY_ENDPOINT = './api/analyze';
  const MODEL = 'qwen-vl-max';

  const SYSTEM_PROMPT = `你是美瞳视觉分析师。仔细观察图中二次元角色「眼睛」的镜片视觉特征，只依据画面判断，不要臆测。
必须只返回一个 JSON 对象，不要任何解释文字。每个字段含 value 和 confidence(0~1，表示你的判断把握)。
字段与取值（value 必须严格取给定档位之一）：
- 瞳色主色：眼睛主色调的中文颜色名，只能取其一 —— 蓝 / 青 / 绿 / 紫 / 粉 / 红 / 棕 / 灰 / 金 / 黄 / 橙 / 黑
- 显色度：颜色的浓淡（饱和度+亮度）—— "低"(灰淡/清透自然) / "中" / "高"(鲜艳饱和/浓)
- 直径：瞳孔(虹膜)看起来的放大程度 —— "小"(接近自然) / "中" / "大"(明显放大、占眼球比例高)
- 风格：整体眼神的夸张程度 —— "自然"(素颜感) / "混血"(轮廓感、偏欧美) / "二次元"(高饱和、动漫夸张、cos感)
判断不清的字段，给出最可能值并把 confidence 调低。
输出格式示例：
{"瞳色主色":{"value":"蓝","confidence":0.85},"显色度":{"value":"高","confidence":0.9},"直径":{"value":"大","confidence":0.8},"风格":{"value":"二次元","confidence":0.7}}`;

  const REQUIRED_FIELDS = ['瞳色主色', '显色度', '直径', '风格'];

  function clamp(n) {
    const x = Number(n);
    if (Number.isNaN(x)) return 0.5;
    return Math.min(1, Math.max(0, x));
  }

  // 归一化模型返回，保证 4 字段齐全且结构统一
  function normalizeFeatures(raw) {
    const out = {};
    for (const field of REQUIRED_FIELDS) {
      const v = raw && raw[field];
      if (v && typeof v === 'object') {
        out[field] = { value: v.value ?? null, confidence: clamp(v.confidence) };
      } else if (typeof v === 'string') {
        out[field] = { value: v, confidence: 0.6 };
      } else {
        out[field] = { value: null, confidence: 0 };
      }
    }
    return out;
  }

  // 容错解析：模型偶尔在 JSON 外包裹文字或 ```json 代码块
  function parseJsonLoose(text) {
    try {
      return JSON.parse(text);
    } catch (_) {
      const m = text.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          return JSON.parse(m[0]);
        } catch (_) {
          return null;
        }
      }
      return null;
    }
  }

  // dataUrl: "data:image/png;base64,...."（直接来自 FileReader）
  async function analyzeImage(dataUrl) {
    const body = {
      model: window.COSLENS_MODEL || MODEL,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: dataUrl } },
            { type: 'text', text: '请分析这张二次元角色图中眼睛的美瞳特征，按要求只返回 JSON。' },
          ],
        },
      ],
    };

    const resp = await fetch(PROXY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!resp.ok) {
      const t = await resp.text().catch(() => '');
      throw new Error(`AI 请求失败 (${resp.status}) ${t.slice(0, 200)}`);
    }

    const data = await resp.json();
    const content = (data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
    const parsed = parseJsonLoose(content);
    if (!parsed) throw new Error('AI 返回内容无法解析为 JSON');
    return normalizeFeatures(parsed);
  }

  window.CosLens = window.CosLens || {};
  window.CosLens.analyzeImage = analyzeImage;
})();
