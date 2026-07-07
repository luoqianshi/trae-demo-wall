// ===== 状态 =====
const state = {
  selectedPrefs: new Set(),
  currentCity: 'chengdu',
  currentRouteIdx: 0,
  lastInput: null
};

let isGenerating = false;

// ===== 全国省/市数据 (精简为热门城市) =====
const PROVINCES = [
  { name: '北京', cities: ['北京'] },
  { name: '天津', cities: ['天津'] },
  { name: '上海', cities: ['上海'] },
  { name: '重庆', cities: ['重庆'] },
  { name: '广东', cities: ['广州', '深圳', '珠海', '佛山', '东莞', '中山', '惠州'] },
  { name: '四川', cities: ['成都', '绵阳', '乐山', '宜宾', '南充', '泸州', '德阳'] },
  { name: '浙江', cities: ['杭州', '宁波', '温州', '嘉兴', '绍兴', '金华', '台州'] },
  { name: '江苏', cities: ['南京', '苏州', '无锡', '常州', '扬州', '南通', '徐州'] },
  { name: '山东', cities: ['济南', '青岛', '烟台', '潍坊', '临沂', '威海'] },
  { name: '福建', cities: ['福州', '厦门', '泉州', '漳州', '莆田'] },
  { name: '湖南', cities: ['长沙', '株洲', '湘潭', '衡阳', '岳阳', '张家界'] },
  { name: '湖北', cities: ['武汉', '宜昌', '襄阳', '黄石', '十堰', '恩施'] },
  { name: '河南', cities: ['郑州', '洛阳', '开封', '安阳', '南阳', '信阳'] },
  { name: '河北', cities: ['石家庄', '唐山', '保定', '邯郸', '秦皇岛', '承德'] },
  { name: '山西', cities: ['太原', '大同', '运城', '临汾', '晋中', '平遥'] },
  { name: '陕西', cities: ['西安', '咸阳', '宝鸡', '汉中', '渭南', '延安'] },
  { name: '辽宁', cities: ['沈阳', '大连', '鞍山', '抚顺', '本溪', '丹东'] },
  { name: '吉林', cities: ['长春', '吉林市', '延吉', '四平', '通化', '长白山'] },
  { name: '黑龙江', cities: ['哈尔滨', '大庆', '齐齐哈尔', '牡丹江', '佳木斯'] },
  { name: '安徽', cities: ['合肥', '芜湖', '蚌埠', '黄山', '安庆', '宏村'] },
  { name: '江西', cities: ['南昌', '赣州', '九江', '景德镇', '吉安', '婺源'] },
  { name: '云南', cities: ['昆明', '大理', '丽江', '西双版纳', '曲靖', '香格里拉'] },
  { name: '贵州', cities: ['贵阳', '遵义', '六盘水', '安顺', '毕节', '荔波'] },
  { name: '广西', cities: ['南宁', '桂林', '北海', '柳州', '梧州', '阳朔'] },
  { name: '海南', cities: ['海口', '三亚', '儋州', '万宁'] },
  { name: '内蒙古', cities: ['呼和浩特', '包头', '鄂尔多斯', '呼伦贝尔', '锡林浩特'] },
  { name: '新疆', cities: ['乌鲁木齐', '喀什', '吐鲁番', '哈密', '克拉玛依', '伊宁'] },
  { name: '宁夏', cities: ['银川', '石嘴山', '吴忠', '固原', '中卫'] },
  { name: '甘肃', cities: ['兰州', '嘉峪关', '敦煌', '天水', '张掖', '酒泉'] },
  { name: '青海', cities: ['西宁', '格尔木', '德令哈', '玉树', '青海湖'] },
  { name: '西藏', cities: ['拉萨', '日喀则', '昌都', '林芝', '纳木错'] },
  { name: '香港', cities: ['香港'] },
  { name: '澳门', cities: ['澳门'] },
  { name: '台湾', cities: ['台北', '高雄', '台中', '台南', '垦丁'] }
];

// ===== 初始化省/市/地点 select =====
function initCitySelectors() {
  const provSel = document.getElementById('province');
  const citySel = document.getElementById('city');

  PROVINCES.forEach(p => {
    const opt = document.createElement('option');
    opt.value = p.name;
    opt.textContent = p.name;
    provSel.appendChild(opt);
  });

  provSel.addEventListener('change', () => {
    citySel.innerHTML = '<option value="">选择城市</option>';
    const prov = PROVINCES.find(p => p.name === provSel.value);
    if (prov) {
      prov.cities.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        citySel.appendChild(opt);
      });
    }
  });
}

// ===== 匹配本地数据 key =====
function findLocalCityKey(cityName) {
  if (!cityName) return null;
  if (cityName.includes('成都')) return 'chengdu';
  if (cityName.includes('杭州')) return 'hangzhou';
  if (cityName.includes('广州')) return 'guangzhou';
  return null;
}

// ===== 解析游玩时长 -> 天数 =====
function parseDuration(text) {
  if (!text) return 1;
  const s = String(text).trim();
  const cn = { '一':1, '二':2, '两':2, '三':3, '四':4, '五':5, '六':6, '七':7, '八':8, '九':9, '十':10 };

  const parseNum = str => parseInt(str, 10) || cn[str] || 0;
  const cnToNum = str => {
    if (cn[str] !== undefined) return cn[str];
    if (/^十[一二三四五六七八九]?$/.test(str)) return 10 + (cn[str[1]] || 0);
    if (/^[一二三四五六七八九]十$/.test(str)) return (cn[str[0]] || 0) * 10;
    if (/^[一二三四五六七八九]十[一二三四五六七八九]$/.test(str)) return (cn[str[0]] || 0) * 10 + (cn[str[2]] || 0);
    return 0;
  };

  let days = 0;

  // 1) 阿拉伯数字 + 天
  let m = s.match(/(\d+)\s*天/);
  if (m) days = parseInt(m[1], 10);

  // 2) 中文数字 + 天
  if (!days) {
    m = s.match(/([一二两三四五六七八九十]+)\s*天/);
    if (m) days = cnToNum(m[1]);
  }

  // 3) 周/星期 (一周 = 7天)
  if (!days) {
    m = s.match(/(\d+|[一二两三四五六七八九十]+)\s*个?\s*(?:周|星期)/);
    if (m) days = parseNum(m[1]) * 7;
  }

  // 4) 月 (1月 = 30天)
  if (!days && /月/.test(s)) {
    if (s.includes('半月')) { days = 15; }
    else {
      m = s.match(/(\d+|[一二两三四五六七八九十]+)\s*个?\s*月/);
      if (m) days = parseNum(m[1]) * 30;
    }
  }

  // 5) 半天/半日 -> 1天
  if (!days && /半天|半日/.test(s)) days = 1;

  // 6) 仅小时/晚 -> 1天
  if (!days && /\d+\s*(?:小时|晚|个?小时)/.test(s)) days = 1;

  // 7) 仅"夜"（如"2夜"）按2天算
  if (!days) {
    m = s.match(/(\d+|[一二两三四五六七八九十]+)\s*夜/);
    if (m) days = parseNum(m[1]);
  }

  // 8) 兜底:有"天/日"字但没数字 -> 1天
  if (!days && /天|日/.test(s)) days = 1;

  // 兜底:完全没匹配
  if (!days) days = 1;

  // 上限保护:超过 14 天按 14 天算
  return Math.min(Math.max(days, 1), 14);
}

// ===== 城市中心点 (34 省会/直辖市经纬度, 供 LLM 返越界时降级) =====
const CITY_CENTERS = {
  '北京':[116.4074,39.9042],'天津':[117.1901,39.1255],'上海':[121.4737,31.2304],
  '重庆':[106.5516,29.5630],'广州':[113.2644,23.1291],'深圳':[114.0579,22.5431],
  '成都':[104.0668,30.5728],'杭州':[120.1551,30.2741],'南京':[118.7969,32.0603],
  '武汉':[114.3055,30.5928],'西安':[108.9398,34.3416],'济南':[117.1201,36.6512],
  '沈阳':[123.4315,41.8057],'长春':[125.3245,43.8868],'哈尔滨':[126.5350,45.8023],
  '福州':[119.2965,26.0745],'厦门':[118.0894,24.4798],'郑州':[113.6254,34.7466],
  '长沙':[112.9388,28.2278],'合肥':[117.2272,31.8206],'南昌':[115.8581,28.6832],
  '昆明':[102.8329,24.8801],'贵阳':[106.6302,26.6470],'南宁':[108.3669,22.8170],
  '海口':[110.3294,20.0239],'乌鲁木齐':[87.6168,43.8256],'兰州':[103.8343,36.0611],
  '西宁':[101.7782,36.6232],'银川':[106.2309,38.4872],'呼和浩特':[111.7519,40.8414],
  '拉萨':[91.1322,29.6603],'石家庄':[114.5149,38.0428],'太原':[112.5489,37.8706],
  '香港':[114.1694,22.3193],'澳门':[113.5491,22.1987],'台北':[121.5654,25.0330]
};

// ===== 校验经纬度是否在中国范围内 =====
function validateCoord(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  if (lat < 3 || lat > 54 || lng < 73 || lng > 135) return false;
  return true;
}

// ===== 随机偏移 (避免多个餐厅重叠在同一坐标) =====
function jitterCoord(coord, range) {
  return [
    coord[0] + (Math.random() - 0.5) * range,
    coord[1] + (Math.random() - 0.5) * range
  ];
}

// ===== 解析餐厅坐标 (优先 LLM, 降级到城市中心) =====
function resolveCoord(stop) {
  // 1) LLM 返回的有效坐标
  if (validateCoord(stop.lat, stop.lng)) {
    return [stop.lat, stop.lng];
  }
  // 2) 城市名匹配本地中心
  const candidates = [
    stop.city,
    state.lastInput?.city,
    state.lastInput?.province
  ].filter(Boolean);
  for (const name of candidates) {
    if (CITY_CENTERS[name]) {
      return jitterCoord(CITY_CENTERS[name], 0.015); // 1.5km 范围抖动
    }
  }
  return null;
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  bindChips();
  bindGenerate();
  initCitySelectors();
  // 首次进入直接生成一次,让用户立刻看到效果
  setTimeout(generate, 300);
});

// ===== Chips 多选 =====
function bindChips() {
  document.querySelectorAll('#prefChips .chip').forEach(chip => {
    chip.addEventListener('click', () => {
      chip.classList.toggle('active');
      const pref = chip.dataset.pref;
      if (state.selectedPrefs.has(pref)) {
        state.selectedPrefs.delete(pref);
      } else {
        state.selectedPrefs.add(pref);
      }
    });
  });
}

// ===== 核心:根据输入匹配最佳路线 =====
function pickBestRoute(cityData) {
  if (state.selectedPrefs.size === 0) {
    return cityData.routes[0];
  }
  // 评分:路线 matchTags 与用户选择的重合数
  const scored = cityData.routes.map(route => {
    const match = route.matchTags.filter(t => state.selectedPrefs.has(t)).length;
    return { route, score: match };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored[0].route;
}

// ===== 生成 =====
function bindGenerate() {
  document.getElementById('generateBtn').addEventListener('click', generate);
}

async function generate() {
  if (isGenerating) return;
  isGenerating = true;

  const btn = document.getElementById('generateBtn');
  const statusEl = document.getElementById('apiStatus');
  btn.classList.add('loading');
  btn.disabled = true;

  const input = collectUserInput();

  // 校验:必须选了省或市
  if (!input.province && !input.city) {
    showToast('请先选择目的地省份/城市');
    btn.classList.remove('loading');
    btn.disabled = false;
    isGenerating = false;
    return;
  }

  state.lastInput = input;
  const cityKey = findLocalCityKey(input.fullCity);
  const cityData = cityKey ? ROUTE_DB[cityKey] : null;

  try {
    statusEl.textContent = '🤔 准备中...';
    statusEl.className = 'api-status thinking';
    await new Promise(r => setTimeout(r, 50));

    const days = input.days || 1;
    const expected = days * 4 + '~' + days * 5;
    statusEl.textContent = `🤖 AI 思考中 (预计 ${expected} 餐)...`;
    statusEl.className = 'api-status thinking';
    await new Promise(r => setTimeout(r, 50));

    const prompt = buildPrompt(input);
    const raw = await callLLM(prompt);

    statusEl.textContent = '🧩 解析数据中...';
    await new Promise(r => setTimeout(r, 30));
    const stops = parseLLMResponse(raw);

    statusEl.textContent = '🗺️ 优化路径中...';
    await new Promise(r => setTimeout(r, 30));

    // 校验餐厅数量
    const expectedMin = days * 4;
    const expectedMax = days * 5;
    if (stops.length < expectedMin || stops.length > expectedMax) {
      console.warn(`餐厅数量 ${stops.length} 与预期 ${expectedMin}-${expectedMax} 偏差`);
      showToast(`⚠️ AI 返回 ${stops.length} 站，与 ${days} 天的预期 ${expectedMin}-${expectedMax} 站不符`, 3500);
    }

    const route = {
      id: 'ai-' + Date.now(),
      theme: 'AI 智能推荐',
      emoji: '🤖',
      desc: '由大模型实时生成，基于你的需求量身定制',
      stops,
    };

    statusEl.textContent = `✅ 规划完成 (${stops.length} 站)`;
    statusEl.className = 'api-status ai';
    renderRoute(input.fullCity, route, input);
    showToast(`✅ AI 实时生成完成 - ${stops.length} 站 / ${days} 天`);

  } catch (err) {
    console.warn('LLM 调用失败:', err.message);
    if (cityData) {
      // 有本地数据 -> 降级
      statusEl.textContent = '💾 本地模式';
      statusEl.className = 'api-status local';
      const route = pickBestRoute(cityData);
      renderRoute(input.fullCity || cityData.name, route, input);
      if (err.message === 'NO_API_KEY') {
        showToast('💡 未配置 API Key，已使用本地示例数据');
      } else {
        showToast('⚠️ AI 调用失败，已降级为本地数据');
      }
    } else {
      // 无本地数据
      statusEl.className = 'api-status local';
      btn.classList.remove('loading');
      btn.disabled = false;
      isGenerating = false;
      if (err.message === 'NO_API_KEY') {
        statusEl.textContent = '❌ 需配置';
        showToast('❌ 该城市无本地数据,请先在 ⚙️ AI 配置 中填入 API Key', 5000);
      } else {
        statusEl.textContent = '❌ 调用失败';
        showToast('❌ AI 调用失败:' + err.message, 6000);
      }
      return;
    }
  }

  btn.classList.remove('loading');
  btn.disabled = false;
  isGenerating = false;
}

// ===== 渲染路线卡片 =====
function renderRoute(cityName, route, input) {
  // 0) 路径优化: 按经纬度优化顺序,保持早中晚时间顺序
  route.stops = optimizeRouteOrder(route.stops);

  // 0.1) 本地数据补 lat/lng (LLM 路径自带 lat/lng,不需要)
  if (!route.id || !route.id.startsWith('ai-')) {
    route.stops = enrichLocalCoords(route.stops, cityName);
  }

  // 1. 顶部信息
  const stops = route.stops;
  const totalPrice = stops.reduce((sum, s) => sum + (s.price || 0), 0);
  const totalDistance = stops.reduce((sum, s) => sum + (s.distance || 0), 0) / 1000;

  // 提取人数 (从 "2 大 1 小" / "5 人" 提取第一个数字)
  const peopleText = (input && input.people) || document.getElementById('people').value || '1';
  const peopleNum = parseInt(String(peopleText).match(/\d+/)?.[0] || '1') || 1;
  const totalBudget = totalPrice * peopleNum;
  const durationText = (input && input.duration) || document.getElementById('duration').value;
  // 多日天数
  const days = input?.days || 1;
  const isMultiDay = days > 1;

  document.getElementById('routeMeta').innerHTML = `
    <span>📍 ${cityName || '未指定'}</span>
    <span>👥 ${peopleText}</span>
    ${durationText ? `<span>🕐 ${durationText}</span>` : ''}
    <span>🍽️ ${stops.length} 餐</span>
  `;
  document.getElementById('routeTitle').textContent =
    `${cityName || '你的路书'} · ${route.theme}`;
  document.getElementById('routeSubtitle').textContent =
    `${route.desc} · 偏好匹配度 ${getMatchScore(route)}%`;

  document.getElementById('routeStats').innerHTML = `
    <div class="route-stat"><div class="v">${stops.length}</div><div class="l">餐厅</div></div>
    <div class="route-stat"><div class="v">${isMultiDay ? days + ' 天' : (stops.length * 2.5).toFixed(1) + 'h'}</div><div class="l">行程</div></div>
    <div class="route-stat"><div class="v">¥${totalBudget}</div><div class="l">总预算${peopleNum > 1 ? '·' + peopleNum + '人' : ''}</div></div>
    <div class="route-stat"><div class="v">¥${Math.round(totalPrice / stops.length)}</div><div class="l">人均/餐</div></div>
  `;

  // 2. SVG 地图
  renderMap(stops);

  // 3. 时间轴
  renderTimeline(stops);

  // 4. 方案切换 tabs
  renderThemeTabs(cityName, route);
}

function getMatchScore(route) {
  if (state.selectedPrefs.size === 0) return 100;
  const match = route.matchTags.filter(t => state.selectedPrefs.has(t)).length;
  return Math.round((match / route.matchTags.length) * 100);
}

// ===== 真实地图 (Leaflet + OpenStreetMap) =====
function renderMap(stops) {
  // 1) 销毁旧地图实例
  if (window._leafletMap) {
    window._leafletMap.remove();
    window._leafletMap = null;
  }
  const container = document.getElementById('map');
  if (!container) return;
  container.innerHTML = '';

  // 2) 解析所有点 (LLM 优先 → 城市中心降级)
  const points = stops.map(s => ({
    stop: s,
    coord: resolveCoord(s)
  })).filter(p => p.coord);

  if (points.length === 0) {
    container.innerHTML = '<div style="padding:80px 20px;text-align:center;color:#999;font-size:14px">暂无有效坐标</div>';
    return;
  }

  // 3) 初始化地图 (默认中心 = 所有点的中心)
  const avgLng = points.reduce((sum, p) => sum + p.coord[0], 0) / points.length;
  const avgLat = points.reduce((sum, p) => sum + p.coord[1], 0) / points.length;
  const map = L.map('map', { zoomControl: true, scrollWheelZoom: true }).setView([avgLat, avgLng], 12);

  // 4) OSM 瓦片层 (免费,无需 Key)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 19
  }).addTo(map);

  // 5) 添加标记 + 弹窗 (标记按 day 染色)
  const latLngs = [];
  points.forEach((p, i) => {
    const day = dayIndexOf(p.stop);
    const color = colorOfDay(day);
    const icon = L.divIcon({
      className: 'map-marker',
      html: `<div class="marker-inner" style="background:${color}">${i + 1}</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const s = p.stop;
    const popupHtml = `
      <b>${i + 1}. ${s.name || '餐厅'}</b>
      ${s.meal ? `<div>🍽️ ${s.time || ''} · ${s.meal}${day > 0 ? ' · 📅第' + (day+1) + '天' : ''}</div>` : ''}
      ${s.address ? `<div>📍 ${s.address}</div>` : ''}
      ${s.rating ? `<div>⭐ ${s.rating}</div>` : ''}
      ${s.price ? `<div>💰 ¥${s.price}/人</div>` : ''}
      ${s.desc ? `<div style="margin-top:6px;color:#666">${s.desc}</div>` : ''}
    `;
    L.marker(p.coord, { icon, title: s.name })
      .addTo(map)
      .bindPopup(popupHtml);
    latLngs.push(p.coord);
  });

  // 6) 按 day 分段连线 (每段独立颜色 + tooltip 显示距离/步行时间)
  for (let i = 0; i < latLngs.length - 1; i++) {
    const day = dayIndexOf(points[i].stop);
    const color = colorOfDay(day);
    const seg = [latLngs[i], latLngs[i + 1]];
    const dist = haversine({ lat: seg[0][1], lng: seg[0][0] }, { lat: seg[1][1], lng: seg[1][0] });
    L.polyline(seg, {
      color,
      weight: 4,
      opacity: 0.75,
      smoothFactor: 1.5
    }).addTo(map).bindTooltip(
      `📏 ${formatDistance(dist)} · 🚶 ${formatWalkTime(dist)}`,
      { sticky: true, direction: 'top' }
    );
  }

  // 7) 自适应视野 (留 20% padding)
  map.fitBounds(L.latLngBounds(latLngs), { padding: [40, 40] });

  window._leafletMap = map;
}

// ===== 辅助函数: 距离/时间/天数/坐标库 =====

// 距离格式化: 850m → "850m", 1.2km → "1.2km"
function formatDistance(m) {
  if (!m || m < 1) return '0m';
  if (m < 1000) return Math.round(m) + 'm';
  return (m / 1000).toFixed(1) + 'km';
}

// 步行时间估算 (按 5km/h = 12min/km)
function formatWalkTime(m) {
  if (!m) return '';
  const min = Math.round(m / 1000 * 12);
  if (min < 1) return '<1分钟';
  if (min >= 60) return Math.floor(min / 60) + '小时' + (min % 60 ? (min % 60) + '分' : '');
  return min + '分钟';
}

// 计算 stop 是第几天 (0-indexed)
function dayIndexOf(stop) {
  const t = parseTimeStr(stop.time);
  return Math.floor(t / 1440);
}

// 7 套每日配色 (循环使用)
const DAY_COLORS = ['#ff6b35', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
function colorOfDay(d) { return DAY_COLORS[d % DAY_COLORS.length]; }

// 本地坐标库 (按地址关键词匹配 → 补 lat/lng)
const LOCAL_COORDS = {
  '成都': {
    '青石桥': [104.080, 30.658], '青华路': [104.061, 30.658], '玉林': [104.064, 30.628],
    '奎星楼': [104.080, 30.668], '春熙路': [104.080, 30.658], '太古里': [104.080, 30.654],
    '锦里': [104.045, 30.642], '望平街': [104.085, 30.668], '宽窄巷子': [104.044, 30.661]
  },
  '杭州': {
    '仁和路': [120.146, 30.246], '马塍路': [120.131, 30.270], '满觉陇': [120.105, 30.243],
    '钱江新城': [120.207, 30.247], '湖滨': [120.155, 30.246], '灵隐路': [120.099, 30.243],
    '南山路': [120.143, 30.243], '中山北路': [120.156, 30.276], '复兴路': [120.179, 30.221],
    '河坊街': [120.144, 30.236], '北山路': [120.149, 30.262]
  },
  '广州': {
    '上下九': [113.118, 23.117], '第十甫路': [113.118, 23.117], '长寿路': [113.117, 23.117],
    '海印桥': [113.276, 23.115], '天河城': [113.325, 23.135], '珠江新城': [113.323, 23.119],
    '北京路': [113.270, 23.121], '芳村': [113.241, 23.083], '东山口': [113.295, 23.124],
    '文明路': [113.272, 23.124], '宝华路': [113.117, 23.117]
  }
};

// 为本地 stop 补 lat/lng (LLM 路径不走这里,LLM 自己提供)
function enrichLocalCoords(stops, cityName) {
  const dict = LOCAL_COORDS[cityName];
  if (!dict) return stops;
  return stops.map(s => {
    if (s.lat && s.lng) return s;
    if (!s.address) return s;
    for (const [kw, [lng, lat]] of Object.entries(dict)) {
      if (s.address.includes(kw)) return { ...s, lat, lng };
    }
    return s;
  });
}

// ===== 路径规划: 按经纬度优化顺序 (保持早中晚时间顺序) =====

// 解析 "08:30" -> 510 分钟
function parseTimeStr(t) {
  const m = String(t || '0:0').match(/(\d{1,2}):(\d{2})/);
  return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 0;
}

// Haversine 球面距离 (单位: 米)
function haversine(a, b) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// 检查 stops 是否严格时间递增
function isTimeOrdered(stops) {
  for (let i = 0; i < stops.length - 1; i++) {
    if (parseTimeStr(stops[i].time) > parseTimeStr(stops[i + 1].time)) return false;
  }
  return true;
}

// 总路径距离 (米)
function totalPathDist(stops) {
  let d = 0;
  for (let i = 0; i < stops.length - 1; i++) {
    const c1 = resolveCoord(stops[i]);
    const c2 = resolveCoord(stops[i + 1]);
    if (c1 && c2) d += haversine({ lat: c1[1], lng: c1[0] }, { lat: c2[1], lng: c2[0] });
  }
  return d;
}

// 2-opt 路径优化: 反转 [i..j] 段, 要求反转后仍时间递增且距离更短
function optimizeRouteOrder(stops) {
  if (stops.length < 3) return stops;

  // 1) 先按 time 排序 (保证时间顺序)
  const sorted = [...stops].sort((a, b) => parseTimeStr(a.time) - parseTimeStr(b.time));

  // 2) 2-opt 局部优化 (保留时间顺序, 减少总路程)
  let best = sorted;
  let bestDist = totalPathDist(best);
  const MAX_ITER = 15;
  for (let iter = 0; iter < MAX_ITER; iter++) {
    let improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const cand = [...best];
        const seg = cand.slice(i, j + 1).reverse();
        cand.splice(i, j + 1 - i, ...seg);
        // 约束: 反转后必须仍时间递增
        if (!isTimeOrdered(cand)) continue;
        const d = totalPathDist(cand);
        // 至少减少 2% 才接受
        if (d < bestDist * 0.98) {
          best = cand;
          bestDist = d;
          improved = true;
        }
      }
    }
    if (!improved) break;
  }

  if (bestDist > 0 && best !== sorted) {
    console.log(`🗺️ 路径优化: 原始 ${(totalPathDist(sorted)/1000).toFixed(2)}km → 优化后 ${(bestDist/1000).toFixed(2)}km (节省 ${((1-bestDist/totalPathDist(sorted))*100).toFixed(1)}%)`);
  }
  return best;
}

// ===== 时间轴 =====
function renderTimeline(stops) {
  const tl = document.getElementById('timeline');
  tl.innerHTML = stops.map((s, i) => {
    const day = dayIndexOf(s);
    const color = colorOfDay(day);
    // 距上一站的距离+步行时间
    let distHtml = '';
    if (i > 0) {
      const c1 = resolveCoord(stops[i - 1]);
      const c2 = resolveCoord(s);
      if (c1 && c2) {
        const d = haversine({ lat: c1[1], lng: c1[0] }, { lat: c2[1], lng: c2[0] });
        distHtml = `<div class="stop-walk">↓ ${formatDistance(d)} · 🚶 ${formatWalkTime(d)}</div>`;
      }
    }
    // 跨天分割标签
    const dayLabel = day > 0 ? `<div class="day-divider" style="background:${color}22;color:${color};border-color:${color}">📅 第 ${day + 1} 天</div>` : '';
    const dayBorder = day > 0 ? `style="border-left:4px solid ${color}"` : '';
    return `
      <div class="stop" data-idx="${i}" ${dayBorder}>
        <div class="stop-dot" style="background:${color}">${i + 1}</div>
        <div class="stop-time">${s.time} · ${s.meal}</div>
        <div class="stop-name">${s.name}<span class="tag">${s.tag}</span></div>
        <p class="stop-desc">${s.desc}</p>
        <div class="stop-meta">
          <span class="rating">⭐ ${s.rating}</span>
          <span>📍 ${s.address}</span>
          <span>💰 ¥${s.price}/人</span>
        </div>
        <div class="ai-reason">🤖 ${s.reason}</div>
        ${distHtml}
        ${dayLabel}
      </div>
    `;
  }).join('');

  // 点击展开 AI 解释
  tl.querySelectorAll('.stop').forEach(el => {
    el.addEventListener('click', () => el.classList.toggle('open'));
  });
}

// ===== 方案切换 Tabs =====
function renderThemeTabs(cityName, currentRoute) {
  const tabs = document.getElementById('themeTabs');
  const isAiRoute = currentRoute.id && currentRoute.id.startsWith('ai-');

  if (isAiRoute) {
    tabs.innerHTML = `<div class="theme-tab active" data-route-id="${currentRoute.id}">🤖 AI 实时生成</div>`;
    return;
  }

  // 本地路线:查找 ROUTE_DB
  const cityKey = findLocalCityKey(cityName);
  const cityData = cityKey ? ROUTE_DB[cityKey] : null;
  if (!cityData) { tabs.innerHTML = ''; return; }

  tabs.innerHTML = cityData.routes.map(r => `
    <div class="theme-tab ${r.id === currentRoute.id ? 'active' : ''}" data-route-id="${r.id}">
      ${r.emoji} ${r.theme}
    </div>
  `).join('');

  tabs.querySelectorAll('.theme-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const routeId = tab.dataset.routeId;
      const route = cityData.routes.find(r => r.id === routeId);
      if (route) renderRoute(cityName, route, state.lastInput);
    });
  });
}

// ===== LLM: 收集用户输入 =====
function collectUserInput() {
  const province = document.getElementById('province').value;
  const city = document.getElementById('city').value;
  const area = document.getElementById('area').value.trim();
  const people = document.getElementById('people').value.trim();
  const duration = document.getElementById('duration').value.trim();
  const days = parseDuration(duration);
  const prefs = [...state.selectedPrefs].map(p => {
    const map = { local:'本地特色', spicy:'川菜/重口', snack:'小吃', hotpot:'火锅', dessert:'甜品', cafe:'咖啡馆', kid:'亲子友好', light:'清淡' };
    return map[p] || p;
  });
  const note = document.getElementById('note').value.trim();

  const fullCity = [province, city, area].filter(Boolean).join(' ');
  return { province, city, area, fullCity, people, duration, days, prefs, note };
}

// ===== LLM: 构建 Prompt =====
function buildPrompt(input) {
  const days = input.days || 1;
  const minStops = days * 4;
  const maxStops = days * 5;

  return `你是美食路线规划专家。请根据用户需求生成一条完整的美食路书。

【用户需求】
- 目的地：${input.fullCity || '（未指定）'}
- 游玩时长：${days} 天（用户原始表述：${input.duration || '未指定'}）
${input.people ? `- 人数：${input.people}` : '- 人数：未指定'}
${input.prefs.length ? `- 饮食偏好：${input.prefs.join('、')}` : ''}
${input.note ? `- 特别需求：${input.note}` : ''}

【硬性要求 - 必须严格遵守】
1. 游玩时长精确等于 ${days} 天
2. 每天安排 4-5 餐:早+午+下午茶+晚(+可选夜宵)
3. 返回的餐厅总数必须在 [${minStops}, ${maxStops}] 之间
4. 最后一天最后一站 distance = 0
5. 如果是 1 天:返回 4-5 个; 2 天:返回 8-10 个; 3 天:12-15 个; 7 天:28-30 个; 依此类推

【输出格式】
请只返回纯JSON数组，不要markdown代码块、不要任何解释文字。每个餐厅一个对象：
{"time":"08:30","meal":"早餐","name":"餐厅名","tag":"简短标签","desc":"一句话推荐","rating":4.5,"address":"具体地址","lat":30.5728,"lng":104.0668,"price":人均价格数字,"distance":到下一站步行米数(最后一站为0),"reason":"为什么推荐(结合用户需求说明)"}

【关键 - 经纬度必须填】
lat/lng 必须是该餐厅的真实经纬度(中国范围内):
- 纬度 lat 范围: 3 ~ 54
- 经度 lng 范围: 73 ~ 135
- 必须真实可信,不可填 0/0 或默认值
- 可以参考真实地图坐标(不是随手编造)

【选店原则】
1. 优先本地人常去的老店、本地论坛推荐店，避开游客打卡店
2. 必须是真实存在、用户可能知道的餐厅
3. 严格遵循用户饮食偏好和特别需求
4. 同一片区内餐厅之间距离合理(尽量<2公里)
5. 餐厅需要按时间顺序排列:早上→中午→下午→晚上

【最终要求】
只输出JSON数组，数组长度必须介于 ${minStops} 到 ${maxStops} 之间(包含两端)。不要任何解释文字。`;
}

// ===== LLM: API 调用 (砝基流动 OpenAI 兼容) =====
async function callLLM(prompt) {
  const apiKey = document.getElementById('apiKey').value.trim();
  if (!apiKey) throw new Error('NO_API_KEY');

  const endpoint = document.getElementById('apiEndpoint').value.trim();
  const model = document.getElementById('apiModel').value.trim();

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: '你是美食路线助手，只返回JSON数组，不要markdown代码块、不要解释、不要思考过程。' },
        { role: 'user', content: prompt }
      ],
      stream: false,
      // 适配 Qwen3.5 等思维链模型：关思考，节省 token
      enable_thinking: false,
      temperature: 0.7,
      max_tokens: 32768,
    }),
  });

  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`API ${res.status} (model=${model}): ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  if (!data.choices || !data.choices[0] || !data.choices[0].message) {
    throw new Error('API 响应格式异常: ' + JSON.stringify(data).slice(0, 200));
  }
  return data.choices[0].message.content;
}

// ===== LLM: 解析响应 JSON (鲁棒版) =====
function parseLLMResponse(raw) {
  // 0) 清理 BOM/零宽/全角空格
  let json = raw.trim().replace(/[\uFEFF\u200B-\u200D\u2060\u3000]/g, '');

  // 1-3) 提取代码块或 JSON 数组
  const jsonBlock = json.match(/```json\s*([\s\S]*?)```/i);
  if (jsonBlock) json = jsonBlock[1].trim();
  else {
    const codeBlock = json.match(/```\s*([\s\S]*?)```/);
    if (codeBlock) json = codeBlock[1].trim();
    else { const arr = json.match(/\[[\s\S]*?\]/); if (arr) json = arr[0]; }
  }

  // 4) 清理 + 规则 A/B
  json = json.replace(/,(\s*[\]}])/g, '$1');
  json = json.replace(/^\s*\/\/.*$/gm, '');
  json = json.replace(/(-?\d+\.?\d*)"(\s*,\s*")(\w+)"(\s*:)/g, '$1$2$3"$4');
  json = json.replace(/"(\w+)"\s*:\s*"(-?\d+\.?\d*)"/g, '"$1":$2');

  // 5) 多层 fallback 解析
  let stops;
  try {
    stops = JSON.parse(json);
  } catch (e1) {
    // 5a) 二次: 激进修复 (检查每个 "key":"value", 纯数字去引号)
    try {
      const j2 = json.replace(/"(\w+)"\s*:\s*"([^"]*?)"/g, (m, k, v) =>
        /^-?\d+\.?\d*$/.test(v.trim()) ? `"${k}":${v}` : m);
      stops = JSON.parse(j2);
      console.warn('⚠️ 二次解析成功(激进修复)');
    } catch (e2) {
      // 5b) 三次: 截断到最后一个完整 }, }] 位置
      try {
        const t = truncateToLastCompleteObject(json);
        if (t && t !== json) {
          stops = JSON.parse(t);
          console.warn('⚠️ 三次解析成功(截断尾部不完整 JSON)');
        } else throw e2;
      } catch (e3) {
        // 5c) 四次: 正则逐个提取餐厅
        stops = extractStopsByRegex(json);
        if (!stops.length) throw new Error('JSON 解析失败: ' + e1.message + ' | raw前200字符: ' + raw.slice(0, 200));
        console.warn('⚠️ 四次解析成功(正则 fallback,' + stops.length + '个餐厅)');
      }
    }
  }

  if (!Array.isArray(stops) || stops.length === 0) throw new Error('返回数据为空或不是数组');
  return autoAssignCoords(stops);
}

// 找到最后一个完整 } 位置,丢掉尾部不完整 JSON (如 token 超限被截断)
function truncateToLastCompleteObject(text) {
  const matches = [...text.matchAll(/\}\s*([,\]]|$)/g)];
  if (!matches.length) return null;
  const last = matches[matches.length - 1];
  const after = text.slice(last.index + 1).trim();
  // 补一个 ] 闭合数组
  return text.slice(0, last.index + 1) + (after.startsWith(']') ? ']' : after.startsWith(',') ? ',' : '');
}

// 正则逐个提取 {...} 块中的 key-value (最后兏底,能处理 LLM 输出残缺)
function extractStopsByRegex(text) {
  const blocks = [...text.matchAll(/\{[^{}]*\}/g)].map(m => m[0]);
  return blocks.map(b => {
    const obj = {};
    b.replace(/"(\w+)"\s*:\s*"((?:[^"\\]|\\.)*)"/g, (_, k, v) => { obj[k] = v; });
    b.replace(/"(\w+)"\s*:\s*(-?\d+(?:\.\d+)?)/g, (_, k, v) => { obj[k] = parseFloat(v); });
    return obj;
  }).filter(o => o.name);
}

// ===== LLM: 不再分配 SVG 坐标, 改用真实地图 lat/lng =====
function autoAssignCoords(stops) {
  // 真实地图不需要预分配 x/y, 坐标由 LLM 返回 + resolveCoord 降级
  return stops;
}

// ===== Toast 提示 =====
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._tid);
  el._tid = setTimeout(() => el.classList.remove('show'), 3000);
}

// ===== API 配置面板交互 =====
document.getElementById('apiToggle').addEventListener('click', () => {
  const body = document.getElementById('apiBody');
  const arrow = document.querySelector('#apiToggle .arrow');
  body.classList.toggle('collapsed');
  arrow.textContent = body.classList.contains('collapsed') ? '▸' : '▾';
});

document.getElementById('apiProvider').addEventListener('change', e => {
  const v = e.target.value;
  const cfg = {
    siliconflow: { endpoint: 'https://api.siliconflow.cn/v1/chat/completions',         model: 'Qwen/Qwen3.5-9B' },
    deepseek:    { endpoint: 'https://api.deepseek.com/v1/chat/completions',         model: 'deepseek-chat' },
    openai:      { endpoint: 'https://api.openai.com/v1/chat/completions',           model: 'gpt-4o-mini' },
    custom:      { endpoint: '', model: '' },
  };
  document.getElementById('apiEndpoint').value = cfg[v].endpoint;
  document.getElementById('apiModel').value = cfg[v].model;
});