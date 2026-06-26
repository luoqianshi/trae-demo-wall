// ============================================================
// api.js — 同路 AA 网络请求封装
// 包含：Nominatim 地理编码、OSRM 路线规划、Open-Meteo 天气、AI 文案
// ============================================================

const API = {

  // 中国常见地点坐标后备数据库（当 Open-Meteo 地理编码找不到时使用）
  FALLBACK_COORDS: {
    '吐鲁沟': { lat: 36.75, lon: 103.0, displayName: '吐鲁沟, 甘肃' },
    '吐鲁沟国家森林公园': { lat: 36.75, lon: 103.0, displayName: '吐鲁沟国家森林公园, 甘肃' },
    '兰州': { lat: 36.0611, lon: 103.8343, displayName: '兰州, 甘肃' },
    '兰州工业学院': { lat: 36.0489, lon: 103.8343, displayName: '兰州工业学院, 甘肃' },
    '北京': { lat: 39.9042, lon: 116.4074, displayName: '北京' },
    '上海': { lat: 31.2304, lon: 121.4737, displayName: '上海' },
    '西安': { lat: 34.3416, lon: 108.9398, displayName: '西安, 陕西' },
    '成都': { lat: 30.5728, lon: 104.0668, displayName: '成都, 四川' },
    '敦煌': { lat: 40.1421, lon: 94.6619, displayName: '敦煌, 甘肃' },
    '张掖': { lat: 38.9262, lon: 100.4495, displayName: '张掖, 甘肃' },
    '嘉峪关': { lat: 39.7729, lon: 98.2894, displayName: '嘉峪关, 甘肃' },
    '青海湖': { lat: 36.8863, lon: 100.1865, displayName: '青海湖, 青海' },
    '西宁': { lat: 36.6171, lon: 101.7782, displayName: '西宁, 青海' },
    '银川': { lat: 38.4872, lon: 106.2309, displayName: '银川, 宁夏' },
  },

  // 检查后备坐标
  _checkFallback(address) {
    // 精确匹配
    if (this.FALLBACK_COORDS[address]) return this.FALLBACK_COORDS[address];
    // 模糊匹配（地址包含关键词）
    for (const [key, val] of Object.entries(this.FALLBACK_COORDS)) {
      if (address.includes(key) || key.includes(address)) return val;
    }
    return null;
  },

  // ===== 1. 地理编码：地址 → 坐标 (Open-Meteo Geocoding API，支持 CORS) =====
  async geocode(address) {
    if (!address || !address.trim()) {
      throw new Error('地址不能为空');
    }
    const keywords = this._extractKeywords(address);

    for (const keyword of keywords) {
      const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(keyword)}&count=1&language=zh&format=json`;
      try {
        const res = await Utils.fetchWithTimeout(url, {
          headers: { 'Accept': 'application/json' },
        }, CONFIG.GEOCODE.TIMEOUT_MS);

        if (res.ok) {
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            return {
              lat: data.results[0].latitude,
              lon: data.results[0].longitude,
              displayName: data.results[0].name + (data.results[0].admin1 ? ', ' + data.results[0].admin1 : ''),
              source: 'open-meteo-geocoding',
              updatedAt: Date.now(),
            };
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') {
          throw new Error('地址解析超时，请检查网络后重试');
        }
        // 继续尝试下一个关键词
      }
    }

    // API 查找失败，检查后备坐标数据库
    const fallback = this._checkFallback(address);
    if (fallback) {
      return { ...fallback, source: 'local-fallback', updatedAt: Date.now() };
    }

    throw new Error(`地址"${address}"未找到，请尝试输入城市名（如：兰州、北京）`);
  },

  // 从地址中提取搜索关键词（逐步缩短）
  _extractKeywords(address) {
    const keywords = [address];
    // 尝试去掉括号内容
    const noParens = address.replace(/（.*?）/g, '').replace(/\(.*?\)/g, '').trim();
    if (noParens && noParens !== address) keywords.push(noParens);
    // 尝试提取城市名（前2-4个字）
    if (address.length > 4) {
      keywords.push(address.substring(0, 4));
      keywords.push(address.substring(0, 3));
      keywords.push(address.substring(0, 2));
    }
    // 去重
    return [...new Set(keywords)];
  },

  // ===== 2. 路线规划：真实距离 & 时间 & 路径 (OSRM) =====
  async getRoute(originCoords, destCoords) {
    const url = `${CONFIG.OSRM.BASE_URL}/${originCoords.lon},${originCoords.lat};${destCoords.lon},${destCoords.lat}?overview=full&geometries=geojson`;
    try {
      const res = await Utils.fetchWithTimeout(url, {}, CONFIG.OSRM.TIMEOUT_MS);

      if (res.status === 429) {
        // OSRM 限流，尝试 ORS 备选
        return await this._getRouteORS(originCoords, destCoords);
      }
      if (!res.ok) throw new Error(`路线服务返回 ${res.status}`);

      const data = await res.json();
      if (!data.routes || data.routes.length === 0) {
        throw new Error('未找到可行路线，请检查两地是否可驾车到达');
      }

      const route = data.routes[0];
      return {
        distance: route.distance,  // 米
        duration: route.duration,  // 秒
        distanceKm: parseFloat((route.distance / 1000).toFixed(1)),
        durationText: Utils.formatDuration(route.duration),
        geometry: route.geometry,  // GeoJSON LineString
        source: 'osrm',
        updatedAt: Date.now(),
      };
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('路线查询超时，请稍后重试');
      }
      // 尝试 ORS 备选
      if (CONFIG.ORS.API_KEY) {
        return await this._getRouteORS(originCoords, destCoords);
      }
      throw new Error('路线服务暂时不可用，将使用直线距离估算');
    }
  },

  // ORS 备选路线规划
  async _getRouteORS(originCoords, destCoords) {
    if (!CONFIG.ORS.API_KEY) {
      throw new Error('路线服务繁忙');
    }
    const url = `${CONFIG.ORS.BASE_URL}?api_key=${CONFIG.ORS.API_KEY}&start=${originCoords.lon},${originCoords.lat}&end=${destCoords.lon},${destCoords.lat}`;
    const res = await Utils.fetchWithTimeout(url, {}, CONFIG.OSRM.TIMEOUT_MS);
    if (!res.ok) throw new Error(`ORS 路线服务返回 ${res.status}`);
    const data = await res.json();
    if (!data.features || data.features.length === 0) {
      throw new Error('ORS 未找到可行路线');
    }
    const feature = data.features[0];
    const seg = feature.properties.segments[0];
    return {
      distance: seg.distance,
      duration: seg.duration,
      distanceKm: parseFloat((seg.distance / 1000).toFixed(1)),
      durationText: Utils.formatDuration(seg.duration),
      geometry: feature.geometry,
      source: 'ors',
      updatedAt: Date.now(),
    };
  },

  // 本地 fallback 路线估算（直线距离 + 经验系数）
  getFallbackRoute(originCoords, destCoords) {
    const R = 6371000;
    const toRad = d => d * Math.PI / 180;
    const dLat = toRad(destCoords.lat - originCoords.lat);
    const dLon = toRad(destCoords.lon - originCoords.lon);
    const a = Math.sin(dLat/2)**2 + Math.cos(toRad(originCoords.lat)) * Math.cos(toRad(destCoords.lat)) * Math.sin(dLon/2)**2;
    const distM = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    // 道路弯曲系数 1.3
    const roadDist = distM * 1.3;
    // 平均速度 60km/h
    const durationS = roadDist / (60 * 1000 / 3600);
    // 生成直线几何
    const geometry = {
      type: 'LineString',
      coordinates: [
        [originCoords.lon, originCoords.lat],
        [(originCoords.lon + destCoords.lon) / 2, (originCoords.lat + destCoords.lat) / 2],
        [destCoords.lon, destCoords.lat],
      ],
    };
    return {
      distance: roadDist,
      duration: durationS,
      distanceKm: parseFloat((roadDist / 1000).toFixed(1)),
      durationText: Utils.formatDuration(durationS),
      geometry,
      source: 'local-estimate',
      updatedAt: Date.now(),
    };
  },

  // ===== 3. 天气预报 (Open-Meteo，完全免费) =====
  async getWeather(lat, lon) {
    const url = `${CONFIG.WEATHER.BASE_URL}?latitude=${lat}&longitude=${lon}` +
      `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code,wind_speed_10m_max` +
      `&timezone=auto&forecast_days=${CONFIG.WEATHER.FORECAST_DAYS}`;

    const res = await Utils.fetchWithTimeout(url, {}, CONFIG.WEATHER.TIMEOUT_MS || 10000);
    if (!res.ok) throw new Error(`天气服务返回 ${res.status}`);
    const data = await res.json();
    if (!data.daily) throw new Error('未获取到天气数据');

    const daily = data.daily.time.map((date, i) => {
      const wmo = data.daily.weather_code[i];
      const wInfo = Utils.getWeatherInfo(wmo);
      return {
        date: date,
        dateStr: Utils.formatDate(date),
        icon: wInfo.icon,
        desc: wInfo.desc,
        tempMax: Math.round(data.daily.temperature_2m_max[i]),
        tempMin: Math.round(data.daily.temperature_2m_min[i]),
        precip: data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[i] : 0,
        wind: Math.round(data.daily.wind_speed_10m_max[i]),
        code: wmo,
      };
    });

    const current = data.current ? {
      temp: Math.round(data.current.temperature_2m),
      humidity: data.current.relative_humidity_2m,
      code: data.current.weather_code,
      windSpeed: Math.round(data.current.wind_speed_10m),
      desc: Utils.getWeatherInfo(data.current.weather_code).desc,
      icon: Utils.getWeatherInfo(data.current.weather_code).icon,
    } : null;

    return { daily, current, source: 'open-meteo', updatedAt: Date.now() };
  },

  // 本地 fallback 天气（通用模板）
  getFallbackWeather() {
    const today = new Date().toISOString().split('T')[0];
    return {
      daily: [{
        date: today,
        dateStr: Utils.formatDate(today),
        icon: '🌤',
        desc: '天气数据暂不可用',
        tempMax: 25,
        tempMin: 10,
        precip: 0,
        wind: 5,
        code: 2,
      }],
      current: { temp: 20, humidity: 50, code: 2, windSpeed: 5, desc: '天气数据暂不可用', icon: '🌤' },
      source: 'local-fallback',
      updatedAt: Date.now(),
    };
  },

  // ===== 4. AI 文案生成 (MiMo / OpenAI 兼容) =====
  async callAI(messages) {
    if (!CONFIG.AI.ENABLED || !CONFIG.AI.API_KEY) {
      throw new Error('AI 功能未配置（API Key 为空）');
    }
    const body = {
      model: CONFIG.AI.MODEL,
      messages: messages,
      max_completion_tokens: 2048,
      temperature: 0.3,
    };
    // 禁用思维链（MiMo 模型默认开启 thinking，导致 content 为空、reasoning_content 占满 token）
    if (CONFIG.AI.THINKING_DISABLED) {
      body.thinking = { type: 'disabled' };
    }
    try {
      const res = await Utils.fetchWithTimeout(CONFIG.AI.BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.AI.API_KEY}`,
        },
        body: JSON.stringify(body),
      }, CONFIG.AI.TIMEOUT_MS || 15000);
      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`AI 服务返回 ${res.status}: ${errText.substring(0, 200)}`);
      }
      const data = await res.json();
      if (!data.choices || !data.choices[0]) {
        throw new Error('AI 返回数据格式异常: ' + JSON.stringify(data).substring(0, 200));
      }
      const msg = data.choices[0].message;
      // MiMo 模型可能将内容放在 content 或 reasoning_content 中
      let content = msg.content || '';
      if (!content && msg.reasoning_content) {
        content = msg.reasoning_content;
      }
      if (!content) {
        throw new Error('AI 返回空内容（可能思维链未正确禁用）');
      }
      // 去除 markdown 格式标记
      content = content.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`{1,3}/g, '').trim();
      return content;
    } catch (err) {
      // 统一处理网络错误（file:// 协议、CORS、断网等）
      const errStr = String(err.message || err);
      if (/Failed to fetch|NetworkError|ERR_|Load failed|network/i.test(errStr)) {
        throw new Error('网络请求失败，请通过本地服务器访问（运行 start.bat 或 start.sh）');
      }
      throw err;
    }
  },

  // 从 AI 响应中提取 JSON 数组（处理 markdown 代码块包裹）
  _extractJsonArray(content) {
    if (!content) return null;
    // 1. 尝试从 ```json ... ``` 代码块中提取
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      try {
        const parsed = JSON.parse(codeBlockMatch[1].trim());
        if (Array.isArray(parsed)) return parsed;
        if (parsed.data && Array.isArray(parsed.data)) return parsed.data;
        if (parsed.items && Array.isArray(parsed.items)) return parsed.items;
      } catch (e) { /* 继续尝试其他方法 */ }
    }
    // 2. 尝试直接匹配 JSON 数组
    const arrayMatch = content.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch (e) { /* 继续尝试 */ }
    }
    // 3. 尝试从对象中提取数组
    const objMatch = content.match(/\{[\s\S]*\}/);
    if (objMatch) {
      try {
        const obj = JSON.parse(objMatch[0]);
        for (const key of ['data', 'items', 'risks', 'foods', 'list', 'results']) {
          if (obj[key] && Array.isArray(obj[key])) return obj[key];
        }
      } catch (e) { /* 解析失败 */ }
    }
    return null;
  },

  // 生成路线描述
  async generateRouteDesc(origin, dest, routeData, weatherInfo) {
    const weatherStr = weatherInfo
      ? `当前天气：${weatherInfo.desc}，${weatherInfo.tempMin}°~${weatherInfo.tempMax}°C，降水概率${weatherInfo.precip}%`
      : '天气数据暂不可用';

    try {
      const result = await this.callAI([
        { role: 'system', content: '你是同路AA的AI助手，专门为大学生出游提供路线规划建议。请简洁回答，不超过100字。' },
        { role: 'user', content: `从${origin}到${dest}，实际距离${routeData.distanceKm}km，预计车程${routeData.durationText}。${weatherStr}。请简要描述路线特点和注意事项。` },
      ]);
      console.log('[AI RouteDesc] Response length:', result.length, 'Preview:', result.substring(0, 100));
      return { text: result, source: 'ai-mimo', updatedAt: Date.now() };
    } catch (err) {
      console.error('[AI RouteDesc] Full error:', err.message, err.stack);
      return {
        text: `从${origin}出发前往${dest}，实际距离约${routeData.distanceKm}公里，预计车程${routeData.durationText}。${weatherStr}。建议提前检查车况，规划好休息点。（注：AI 服务暂不可用，以上为通用建议）`,
        source: 'local-template',
        updatedAt: Date.now(),
        error: err.message,
      };
    }
  },

  // 生成风险提示
  async generateRisks(origin, dest, routeData, weatherInfo, people, carModel) {
    const weatherStr = weatherInfo
      ? `天气：${weatherInfo.desc}，${weatherInfo.tempMin}°~${weatherInfo.tempMax}°C，降水${weatherInfo.precip}%，风速${weatherInfo.wind}m/s`
      : '天气数据暂不可用';

    try {
      const content = await this.callAI([
        { role: 'system', content: '你是同路AA的安全顾问。请根据出行信息生成3-5条安全风险提示，用JSON数组格式返回，每项包含type(warn/danger/info/safe)、icon(emoji)、title、desc字段。只返回JSON数组，不要markdown代码块，不要其他文字。' },
        { role: 'user', content: `出行：${origin}→${dest}，${people}人，车型${carModel}，距离${routeData.distanceKm}km，车程${routeData.durationText}。${weatherStr}。` },
      ]);
      console.log('[AI Risks] Raw response:', content.substring(0, 300));
      const parsed = this._extractJsonArray(content);
      if (parsed && parsed.length > 0) {
        console.log('[AI Risks] Parsed successfully:', parsed.length, 'items');
        return { items: parsed, source: 'ai-mimo', updatedAt: Date.now() };
      }
      console.warn('[AI Risks] JSON extraction failed, using local fallback');
      throw new Error('AI 返回格式异常');
    } catch (err) {
      console.error('[AI Risks] Full error:', err.message, err.stack);
      // 本地模板生成风险（数据真实）
      return { items: this._localRisks(origin, dest, routeData, weatherInfo, people), source: 'local-template', updatedAt: Date.now(), error: err.message };
    }
  },

  // 本地风险模板（仅在 AI 失败时使用，数据来自真实 API）
  _localRisks(origin, dest, routeData, weatherInfo, people) {
    const risks = [];
    // 天气风险
    if (weatherInfo) {
      if (Utils.isBadWeather(weatherInfo.code)) {
        risks.push({ type: 'danger', icon: '⛈️', title: '出行日天气恶劣', desc: `${dest}今日${weatherInfo.desc}，建议改期或做好防雨准备。降水概率${weatherInfo.precip}%。` });
      } else if (Utils.isModerateWeather(weatherInfo.code)) {
        risks.push({ type: 'warn', icon: '🌧️', title: '天气需注意', desc: `${dest}今日${weatherInfo.desc}，降水概率${weatherInfo.precip}%。建议携带雨具。` });
      }
    }
    // 疲劳驾驶
    const hours = routeData.duration / 3600;
    risks.push({ type: 'warn', icon: '🚗', title: '疲劳驾驶警示', desc: `单程${routeData.distanceKm}km约${routeData.durationText}，往返约${(routeData.distanceKm * 2).toFixed(0)}km。建议每1.5小时休息一次。` });
    // 信号
    risks.push({ type: 'info', icon: '📶', title: '部分区域信号弱', desc: '部分路段手机信号不稳定。提前下载离线地图，约定集合时间和地点。' });
    // 人数
    if (people === 1) {
      risks.push({ type: 'danger', icon: '⚠️', title: '单人出行风险', desc: '建议至少2人同行，互相照应。单人长途驾驶疲劳风险更高。' });
    }
    return risks;
  },

  // 生成美食推荐
  async generateFoods(dest, routeData) {
    try {
      const content = await this.callAI([
        { role: 'system', content: '你是同路AA的美食推荐助手。请根据目的地推荐4家沿途或目的地餐饮，用JSON数组格式返回，每项包含name、rating(1-5)、price(人均元)、location、desc字段。只返回JSON数组，不要markdown代码块，不要其他文字。' },
        { role: 'user', content: `目的地：${dest}，距离${routeData.distanceKm}km。推荐适合大学生聚餐的性价比餐饮。` },
      ]);
      console.log('[AI Foods] Raw response:', content.substring(0, 300));
      const parsed = this._extractJsonArray(content);
      if (parsed && parsed.length > 0) {
        console.log('[AI Foods] Parsed successfully:', parsed.length, 'items');
        return { items: parsed, source: 'ai-mimo', updatedAt: Date.now() };
      }
      console.warn('[AI Foods] JSON extraction failed, using local fallback');
      throw new Error('AI 返回格式异常');
    } catch (err) {
      console.error('[AI Foods] Full error:', err.message, err.stack);
      // 本地默认美食（标注为通用推荐）
      return {
        items: [
          { name: '当地特色餐馆', rating: 4.0, price: 40, location: dest + '附近', desc: '到达目的地后搜索附近评价较好的当地特色餐馆。' },
          { name: '高速服务区餐厅', rating: 3.5, price: 25, location: '途中服务区', desc: '适合途中快速补给，不建议久停影响行程。' },
          { name: '沿途小镇餐馆', rating: 4.0, price: 35, location: '途经城镇', desc: '途经城镇可寻找本地人推荐的小餐馆，性价比高。' },
          { name: '自带野餐（推荐备选）', rating: 0, price: 15, location: '景区休息区', desc: '出发前超市采购面包、火腿、水果、零食。省钱又有野餐乐趣。' },
        ],
        source: 'local-template',
        updatedAt: Date.now(),
        error: err.message,
      };
    }
  },

  // 生成结构化游玩攻略
  async generateGuide(origin, dest, routeData, weatherInfo, people, carModel, days, budgetSummary) {
    const weatherStr = weatherInfo
      ? `${weatherInfo.desc}，${weatherInfo.tempMin}°~${weatherInfo.tempMax}°C，降水概率${weatherInfo.precip}%`
      : '天气数据暂不可用';

    // 调试日志：打印请求参数
    console.log('[AI Guide] Request params:', {
      origin, dest, distance: routeData.distanceKm, duration: routeData.durationText,
      people, carModel, days, weather: weatherStr,
      perPerson: Math.round(budgetSummary.perPerson), total: Math.round(budgetSummary.total),
    });

    console.log('[AI Guide] 开始调用 MiMo API...', { origin, dest, distance: routeData.distanceKm });

    try {
      const content = await this.callAI([
        { role: 'system', content: '你是同路AA的旅行攻略专家。请根据出行信息生成一份大学生出游攻略，用JSON对象返回，字段：routeOverview(路线总览)、howToPlay(怎么玩)、howToEat(怎么吃)、howToSave(怎么省钱)、notices(注意事项)。每个字段是200字以内的字符串，可包含换行。只返回JSON对象，不要markdown代码块，不要其他文字。' },
        { role: 'user', content: `从${origin}到${dest}，${people}人，${days}天，车型${carModel}，单程${routeData.distanceKm}km，预计车程${routeData.durationText}。天气：${weatherStr}。人均预算约¥${Math.round(budgetSummary.perPerson)}，总预算¥${Math.round(budgetSummary.total)}。请生成攻略。` },
      ]);
      console.log('[AI Guide] API 调用成功，返回内容长度:', content.length);
      console.log('[AI Guide] Response (first 200 chars):', content.substring(0, 200));
      // 尝试提取 JSON 对象
      let parsed = null;
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        try { parsed = JSON.parse(codeBlockMatch[1].trim()); } catch (e) {}
      }
      if (!parsed) {
        const objMatch = content.match(/\{[\s\S]*\}/);
        if (objMatch) {
          try { parsed = JSON.parse(objMatch[0]); } catch (e) {}
        }
      }
      if (parsed && parsed.routeOverview) {
        console.log('[AI Guide] Parsed successfully');
        // 字段完整性校验：确保5个字段都存在且非空
        const local = this._localGuide(origin, dest, routeData, weatherInfo, people, carModel, days, budgetSummary);
        const requiredFields = ['routeOverview', 'howToPlay', 'howToEat', 'howToSave', 'notices'];
        requiredFields.forEach(f => {
          if (!parsed[f] || !String(parsed[f]).trim()) {
            console.warn(`[AI Guide] Field "${f}" missing, patching with local template`);
            parsed[f] = local[f];
          }
        });
        return { ...parsed, source: 'ai-mimo', updatedAt: Date.now() };
      }
      throw new Error('AI 返回格式异常');
    } catch (err) {
      console.error('[AI Guide] Full error:', err.message, err.stack);
      return { ...this._localGuide(origin, dest, routeData, weatherInfo, people, carModel, days, budgetSummary), source: 'local-template', updatedAt: Date.now(), error: err.message };
    }
  },

  // 本地攻略模板（数据真实）
  _localGuide(origin, dest, routeData, weatherInfo, people, carModel, days, budgetSummary) {
    const weatherText = weatherInfo ? `${weatherInfo.desc}，${weatherInfo.tempMin}°~${weatherInfo.tempMax}°C` : '天气待查';
    return {
      routeOverview: `从${origin}出发前往${dest}，单程约${routeData.distanceKm}公里，预计车程${routeData.durationText}。建议提前通过导航软件确认实时路况，选择高速优先方案可节省时间。`,
      howToPlay: `${days}天行程建议：第1天上午出发，中午前抵达${dest}；下午游览核心景点并拍照打卡；晚上如多日游可住宿当地。行程不要安排过满，留出休息和堵车缓冲时间。`,
      howToEat: `推荐在${dest}附近寻找当地特色餐馆，人均约¥40；也可自带干粮和零食野餐，既省钱又有趣。途中服务区餐饮价格偏高，建议提前准备。`,
      howToSave: `选择${carModel}出行，油费+高速费约¥${Math.round((budgetSummary.oil || 0) + (budgetSummary.toll || 0))}。门票使用学生证半价，多人同行可平摊油费。自带饮用水和零食可进一步降低人均开支。`,
      notices: `天气${weatherText}，请携带合适衣物和雨具。单程${routeData.durationText}注意避免疲劳驾驶，建议每1.5小时休息一次。提前检查车况，保持手机电量充足。`,
    };
  },

  // AI 自由问答（用户向 AI 提问）
  async askAI(question, context) {
    const ctx = context || {};
    const contextStr = [
      ctx.origin ? `出发地：${ctx.origin}` : '',
      ctx.dest ? `目的地：${ctx.dest}` : '',
      ctx.distance ? `距离：${ctx.distance}km` : '',
      ctx.weather ? `天气：${ctx.weather}` : '',
      ctx.people ? `人数：${ctx.people}人` : '',
    ].filter(Boolean).join('，');

    console.log('[AI Ask] Question:', question, '| Context:', contextStr);
    try {
      const content = await this.callAI([
        { role: 'system', content: '你是同路AA的旅行助手，为大学生出游提供实用建议。请简洁回答，不超过200字。' },
        { role: 'user', content: `背景信息：${contextStr}。用户提问：${question}` },
      ]);
      console.log('[AI Ask] Response (first 200 chars):', content.substring(0, 200));
      return { text: content, source: 'ai-mimo', updatedAt: Date.now() };
    } catch (err) {
      console.error('[AI Ask] Full error:', err.message, err.stack);
      return { text: '抱歉，AI 助手暂时不可用。请稍后重试，或查看上方攻略获取参考信息。', source: 'local-template', error: err.message };
    }
  },
};

window.API = API;
