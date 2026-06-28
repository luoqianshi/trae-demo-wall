/**
 * Express 服务入口 (WI-0.3 / WI-1.1 / WI-1.3 / WI-1.4 / WI-1.5)
 * 提供方案生成、天气适配、埋点、缓存指标等 API 路由，并托管前端静态资源。
 */
const express = require('express');
const path = require('path');
const config = require('./config');
const { updateLLM, getLLMStatus, isValidApiBase } = require('./config');
const { generatePlans, cache, replaceActivity } = require('./services/orchestrator');
const { getWeather, getSupportedCities, findNearestCity } = require('./services/weatherService');
const analytics = require('./services/analytics');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// --- 安全中间件 ---
// 基础安全头
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// CORS（Demo 阶段允许所有来源，生产环境应收紧）
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,X-Admin-Token');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// 静态资源：前端页面
app.use(express.static(path.join(__dirname, '..', 'public')));

// --- 管理端点认证中间件 ---
// 配置了 ADMIN_TOKEN 时，管理类接口需通过 X-Admin-Token 头认证
function requireAdmin(req, res, next) {
  const token = config.adminToken;
  if (!token) return next(); // 未配置令牌则不强制（本地开发便利）
  const provided = req.headers['x-admin-token'] || req.query.token;
  if (provided !== token) {
    return res.status(401).json({ success: false, error: '未授权：需要管理员令牌' });
  }
  next();
}

// --- 参数校验工具 ---
function isValidCity(city) {
  return getSupportedCities().includes(city);
}

// 健康检查 (WI-1.5: 增强版，含各服务状态)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time: new Date().toISOString(),
    services: {
      llm: !!config.llm.apiKey,
      weather: config.weather.enabled,
      cache: config.cache.enabled,
      analytics: config.analytics.enabled,
      offlineMode: config.demo.offlineMode
    }
  });
});

// === AI 配置管理 (WI-AI-Config) ===
// 获取当前 LLM 配置状态（脱敏）
app.get('/api/config', requireAdmin, (req, res) => {
  res.json({ success: true, data: getLLMStatus() });
});

// 更新 LLM 配置（运行时生效 + 落盘持久化）
app.post('/api/config', requireAdmin, (req, res) => {
  try {
    const { apiKey, apiBase, model } = req.body || {};
    // apiBase SSRF 校验
    if (apiBase && !isValidApiBase(apiBase)) {
      return res.status(400).json({
        success: false,
        error: '无效的 API 地址：仅允许 HTTPS 公网地址，禁止内网/本地地址'
      });
    }
    const status = updateLLM({ apiKey, apiBase, model });
    res.json({ success: true, data: status });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 测试 LLM 连接（发送一个最小请求验证 Key 是否有效）
app.post('/api/config/test', requireAdmin, async (req, res) => {
  const { apiKey, apiBase, model } = req.body || {};
  const testKey = apiKey || config.llm.apiKey;
  const testBase = (apiBase || config.llm.apiBase || '').trim();
  const testModel = model || config.llm.model;

  if (!testKey) {
    return res.status(400).json({ success: false, error: '请先填写 API Key' });
  }

  // SSRF 防护：校验 apiBase
  if (!testBase || !isValidApiBase(testBase)) {
    return res.status(400).json({
      success: false,
      error: '无效的 API 地址：仅允许 HTTPS 公网地址'
    });
  }

  const t0 = Date.now();
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const response = await fetch(`${testBase.replace(/\/+$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testKey}`
      },
      body: JSON.stringify({
        model: testModel,
        messages: [{ role: 'user', content: 'ping' }],
        max_tokens: 5
      }),
      signal: controller.signal
    });
    clearTimeout(timer);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      const code = response.status;
      // 401 不重试提示
      let hint = '';
      if (code === 401) hint = '（API Key 无效或已过期）';
      else if (code === 429) hint = '（请求频率超限，请稍后重试）';
      else if (code === 404) hint = '（模型名或接口路径不正确）';
      return res.status(200).json({
        success: false,
        error: `API 返回 ${code}${hint}`,
        detail: errText.slice(0, 200)
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    res.json({
      success: true,
      latency_ms: Date.now() - t0,
      reply: content.slice(0, 50),
      model: testModel
    });
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    res.status(200).json({
      success: false,
      error: isTimeout ? '连接超时（10秒）' : '连接失败',
      detail: err.message || String(err)
    });
  }
});

// 方案生成接口 (F2) — 支持自动天气适配与缓存跳过
app.post('/api/generate', async (req, res) => {
  const t0 = Date.now();
  try {
    const body = req.body || {};
    const autoWeather = body.autoWeather === true;
    // bypassCache: "换一批"时传 true 跳过缓存
    const bypassCache = body.bypassCache === true;
    const result = await generatePlans(body, { bypassCache, autoWeather });
    res.json({
      success: true,
      data: result.plans,
      meta: {
        source: result.source,
        latency_ms: Date.now() - t0,
        cached: result.cached,
        count: result.plans.length,
        weather: result.weather || null
      }
    });
  } catch (err) {
    console.error('[/api/generate] 生成失败:', err);
    res.status(500).json({
      success: false,
      error: '方案生成失败，请稍后重试'
    });
  }
});

// 替换单个活动接口 (WI-2.1 / F5)
app.post('/api/replace-activity', (req, res) => {
  try {
    const { plan, activityIndex, prefs } = req.body || {};
    if (!plan || !Array.isArray(plan.activities) || activityIndex == null) {
      return res.status(400).json({ success: false, error: '缺少必要参数' });
    }
    // 类型校验：activityIndex 必须是整数
    const idx = Number(activityIndex);
    if (!Number.isInteger(idx) || idx < 0 || idx >= plan.activities.length) {
      return res.status(400).json({ success: false, error: '活动索引无效' });
    }
    const newPlan = replaceActivity(plan, idx, prefs || {});
    res.json({ success: true, data: newPlan });
  } catch (err) {
    console.error('[/api/replace-activity] 替换失败:', err);
    res.status(500).json({ success: false, error: '活动替换失败' });
  }
});

// 天气查询接口 (WI-1.1)
app.get('/api/weather', async (req, res) => {
  try {
    const city = req.query.city || '上海';
    if (!isValidCity(city)) {
      return res.status(400).json({ success: false, error: '不支持的城市' });
    }
    const result = await getWeather(city);
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, error: '天气获取失败' });
  }
});

// 定位接口：根据经纬度找最近的支持城市
app.get('/api/locate', (req, res) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    if (isNaN(lat) || isNaN(lon)) {
      return res.status(400).json({ success: false, error: '缺少有效的 lat/lon 参数' });
    }
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
      return res.status(400).json({ success: false, error: '经纬度超出有效范围' });
    }
    const result = findNearestCity(lat, lon);
    if (!result) {
      return res.status(404).json({ success: false, error: '未能找到附近城市' });
    }
    res.json({
      success: true,
      data: {
        city: result.city,
        distance_km: result.distance,
        message: result.distance > 500
          ? `最近的城市是${result.city}（距离约${result.distance}公里，可能不在您附近）`
          : `您附近的城市是${result.city}`
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: '定位失败' });
  }
});

// 埋点上报接口 (WI-1.4)
app.post('/api/track', (req, res) => {
  try {
    if (!config.analytics.enabled) return res.json({ success: true, skipped: true });
    const { type, ...props } = req.body || {};
    if (!type || typeof type !== 'string') {
      return res.status(400).json({ success: false, error: '缺少事件类型' });
    }
    // 只允许白名单内的事件类型，防止伪造
    const allowedTypes = ['generate', 'adopt', 'share', 'replace', 'favorite', 'unfavorite'];
    if (!allowedTypes.includes(type)) {
      return res.status(400).json({ success: false, error: '不支持的事件类型' });
    }
    analytics.track(type, props);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: '埋点记录失败' });
  }
});

// 指标查询接口 (WI-1.4) — 需管理员认证
app.get('/api/metrics', requireAdmin, (req, res) => {
  try {
    res.json({ success: true, data: analytics.getMetrics() });
  } catch (err) {
    res.status(500).json({ success: false, error: '指标查询失败' });
  }
});

// 缓存统计接口 (WI-1.3) — 需管理员认证
app.get('/api/cache/stats', requireAdmin, (req, res) => {
  try {
    res.json({ success: true, data: cache.getStats() });
  } catch (err) {
    res.status(500).json({ success: false, error: '缓存统计查询失败' });
  }
});

// 缓存清除接口 (WI-1.3) — 需管理员认证
app.delete('/api/cache', requireAdmin, (req, res) => {
  try {
    const cleared = cache.clear();
    res.json({ success: true, cleared });
  } catch (err) {
    res.status(500).json({ success: false, error: '缓存清除失败' });
  }
});

// 可用城市与选项枚举（供前端初始化下拉）
app.get('/api/options', (req, res) => {
  res.json({
    cities: getSupportedCities(),
    budgets: [
      { key: '0-100', label: '0-100 元/人' },
      { key: '100-300', label: '100-300 元/人' },
      { key: '300-500', label: '300-500 元/人' },
      { key: '500+', label: '500+ 元/人' }
    ],
    moods: [
      { key: '放松', label: '放松' },
      { key: '探索', label: '探索' },
      { key: '社交', label: '社交' },
      { key: '运动', label: '运动' },
      { key: '文艺', label: '文艺' }
    ],
    companions: [
      { key: 'solo', label: '独自出行' },
      { key: 'couple', label: '情侣约会' },
      { key: 'family', label: '亲子家庭' },
      { key: 'friends', label: '朋友结伴' }
    ],
    weathers: [
      { key: 'sunny', label: '晴天' },
      { key: 'rainy', label: '雨天' },
      { key: 'cloudy', label: '多云' },
      { key: 'hot', label: '高温' },
      { key: 'cold', label: '低温' }
    ]
  });
});

// --- 全局错误处理中间件 ---
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  if (res.headersSent) return next(err);
  res.status(500).json({ success: false, error: '服务器内部错误' });
});

// --- 优雅关闭 ---
function gracefulShutdown(signal) {
  console.log(`\n  收到 ${signal}，正在优雅关闭...`);
  try {
    // 强制 flush 埋点数据
    analytics.flush && analytics.flush();
  } catch (e) { /* ignore */ }
  server.close(() => {
    console.log('  服务已关闭');
    process.exit(0);
  });
  // 强制退出超时
  setTimeout(() => process.exit(1), 5000);
}
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

const server = app.listen(config.port, () => {
  console.log(`\n  周末灵感生成器已启动`);
  console.log(`  → 应用: http://localhost:${config.port}`);
  console.log(`  → 大模型: ${config.llm.apiKey ? '已启用 (' + config.llm.model + ')' : '未配置 Key，使用规则生成器（可体验完整 Demo）'}`);
  console.log(`  → 天气适配: ${config.weather.enabled ? '已启用 (Open-Meteo)' : '未启用'}`);
  console.log(`  → 离线模式: ${config.demo.offlineMode ? '开启' : '关闭'}`);
  console.log(`  → 管理令牌: ${config.adminToken ? '已配置' : '未配置（管理端点公开访问）'}\n`);
});

module.exports = app;
