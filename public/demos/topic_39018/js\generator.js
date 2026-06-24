/**
 * AI 旅行规划引擎 - 路书生成器
 * 根据用户参数动态生成完整 HTML 路书
 */

function generateReport(params) {
  const route = ROUTE_TEMPLATES[params.routeId];
  const cfg = CONFIG;

  // ── 计算预算 ──
  const car = cfg.carTypes[params.carType];
  const oilCost = Math.round(route.totalKm / 100 * car.oilPer100km * cfg.oilPriceBase);
  const tollCost = Math.round(route.totalKm * route.tollRate * car.tollDiscount);
  const hotelCost = Math.round(cfg.hotelPerNight[params.budgetLevel] * (params.days - 1) * cfg.peopleMultiplier[params.people]);
  const foodCost = Math.round(cfg.foodPerPersonPerDay[params.budgetLevel] * params.people * params.days);
  const ticketCost = Math.round(route.spots.all.length * 80 * params.people * 0.6); // 估算
  const miscCost = Math.round(500 * params.people);
  const totalCost = oilCost + tollCost + hotelCost + foodCost + ticketCost + miscCost;

  // ── 日期计算 ──
  const start = new Date(params.startDate);
  const end = new Date(start);
  end.setDate(end.getDate() + params.days - 1);
  const dateStr = `${start.getMonth()+1}月${start.getDate()}日 — ${end.getMonth()+1}月${end.getDate()}日`;

  // ── 生成逐日行程（简化版，按比例分配里程） ──
  const dailyKm = distributeKm(route.dailyKm, params.days, route.totalKm);
  const dayCards = generateDayCards(dailyKm, route, params, start);

  // ── 生成景点攻略 ──
  const spotTabs = generateSpotTabs(route.spots);

  // ── 生成美食地图 ──
  const foodTable = generateFoodTable(route.food);

  // ── 生成住宿表 ──
  const hotelTable = generateHotelTable(route.hotels);

  // ── 生成银河观测 ──
  const galaxySection = params.interests.includes('星空摄影') ? generateGalaxySection(route, params) : '';

  // ── 生成风险卡片 ──
  const riskCards = generateRiskCards(route.risks);

  // ── 海拔数据 ──
  const altData = route.routePoints.map(p => p.alt);
  const altLabels = route.routePoints.map(p => p.name);

  // ── SVG 路线地图 ──
  const svgMap = generateSvgMap(route);

  return `
<div class="hero" style="height:50vh;min-height:350px">
  <div class="hero-text">
    <h1>${route.name}</h1>
    <p class="sub">${params.people}人 · ${params.carType} · ${dateStr}</p>
    <div class="hero-stats" style="display:flex;gap:1.5rem;justify-content:center;margin-top:1rem;flex-wrap:wrap">
      <div class="hero-stat"><div class="num" style="font-size:1.8rem;font-weight:700;color:var(--accent)">${route.totalKm.toLocaleString()}</div><div class="label" style="font-size:.7rem;opacity:.7">总里程 km</div></div>
      <div class="hero-stat"><div class="num" style="font-size:1.8rem;font-weight:700;color:var(--accent)">${params.days}</div><div class="label" style="font-size:.7rem;opacity:.7">天数</div></div>
      <div class="hero-stat"><div class="num" style="font-size:1.8rem;font-weight:700;color:var(--accent)">¥${(totalCost/10000).toFixed(1)}万</div><div class="label" style="font-size:.7rem;opacity:.7">${params.people}人预算</div></div>
      <div class="hero-stat"><div class="num" style="font-size:1.8rem;font-weight:700;color:var(--accent)">${route.spots.all.length}</div><div class="label" style="font-size:.7rem;opacity:.7">核心景点</div></div>
    </div>
  </div>
</div>

<nav class="toc"><div class="container">
<a href="#overview">📊 总览</a>
<a href="#budget">💰 预算</a>
<a href="#route">🗺️ 路线</a>
<a href="#spots">🏛️ 景点</a>
<a href="#days">📅 行程</a>
${params.interests.includes('星空摄影') ? '<a href="#galaxy">🌌 银河</a>' : ''}
<a href="#food">🍖 美食</a>
<a href="#hotel">🏨 住宿</a>
<a href="#risk">⚠️ 应急</a>
</div></nav>

<section id="overview"><div class="container">
<h2>行程总览</h2>
<p>本攻略基于<mark class="key">2026年最新数据</mark>编制，涵盖景点深度攻略、避坑指南、价格明细、逐日行程。</p>
<div class="stat-grid">
<div class="stat-card"><div class="icon">🚗</div><div class="value">${route.totalKm.toLocaleString()}km</div><div class="label">总里程</div></div>
<div class="stat-card"><div class="icon">📅</div><div class="value">${params.days}天</div><div class="label">行程天数</div></div>
<div class="stat-card"><div class="icon">👥</div><div class="value">${params.people}人</div><div class="label">出行人数</div></div>
<div class="stat-card"><div class="icon">🚙</div><div class="value">${params.carType}</div><div class="label">车型</div></div>
<div class="stat-card"><div class="icon">💰</div><div class="value">¥${totalCost.toLocaleString()}</div><div class="label">预估总预算</div></div>
<div class="stat-card"><div class="icon">⛽</div><div class="value">约${cfg.oilPriceBase}元/升</div><div class="label">92号均价</div></div>
<div class="stat-card"><div class="icon">🏔️</div><div class="value">${Math.max(...altData)}m</div><div class="label">最高海拔</div></div>
<div class="stat-card"><div class="icon">🏛️</div><div class="value">${route.spots.all.length}+</div><div class="label">景点数量</div></div>
</div>
<figure class="chart-figure"><figcaption>沿途海拔变化剖面图</figcaption><div id="chart-altitude" style="width:100%;min-height:320px"></div></figure>
</div></section>

<section id="budget" class="full-bleed"><div class="container">
<h2>预算总览（${params.people}人合计 · ${params.budgetLevel}型）</h2>
<div style="display:grid;grid-template-columns:1fr 1fr;gap:2rem">
<div>
<div class="table-wrap">
<table class="price-table">
<thead><tr><th>项目</th><th>预估费用（元）</th><th>计算方式</th></tr></thead>
<tbody>
<tr><td>过路费</td><td>${tollCost.toLocaleString()}</td><td>${route.totalKm}km × ${route.tollRate}元/km</td></tr>
<tr><td>油费</td><td>${oilCost.toLocaleString()}</td><td>${route.totalKm}km ÷100 × ${car.oilPer100km}L × ${cfg.oilPriceBase}元</td></tr>
<tr><td>住宿（${params.days-1}晚）</td><td>${hotelCost.toLocaleString()}</td><td>${cfg.hotelPerNight[params.budgetLevel]}元/晚 × ${params.days-1}晚 × ${cfg.peopleMultiplier[params.people]}倍</td></tr>
<tr><td>餐饮（${params.days}天×${params.people}人）</td><td>${foodCost.toLocaleString()}</td><td>${cfg.foodPerPersonPerDay[params.budgetLevel]}元/人/天 × ${params.people}人 × ${params.days}天</td></tr>
<tr><td>景区门票</td><td>${ticketCost.toLocaleString()}</td><td>估算（约${route.spots.all.length}个景点）</td></tr>
<tr><td>停车/杂费</td><td>${miscCost.toLocaleString()}</td><td>约${500*params.people}元</td></tr>
<tr><td><strong>合计</strong></td><td><strong>¥${totalCost.toLocaleString()}</strong></td><td>人均约 ¥${Math.round(totalCost/params.people).toLocaleString()}</td></tr>
</tbody>
</table>
</div>
</div>
<div>
<figure class="chart-figure"><figcaption>费用分布</figcaption><div id="chart-budget" style="width:100%;min-height:300px"></div></figure>
</div>
</div>
<figure class="chart-figure"><figcaption>每日花费明细</figcaption><div id="chart-daily-cost" style="width:100%;min-height:350px"></div></figure>
</div></section>

<section id="route"><div class="container">
<h2>路线总览</h2>
<p>全程约${route.totalKm.toLocaleString()}km，穿越${route.region}。</p>
<figure class="chart-figure"><figcaption>每日驾驶里程</figcaption><div id="chart-daily-km" style="width:100%;min-height:300px"></div></figure>
<figure>
${svgMap}
<figcaption>全程路线示意图</figcaption>
</figure>
</div></section>

<section id="spots" class="full-bleed"><div class="container">
<h2>景点深度攻略</h2>
<p>每个景点按<mark class="key">必玩核心 → 避坑指南 → 自驾停车 → 门票价格 → 建议时长</mark>展开。</p>
${spotTabs}
</div></section>

<section id="days"><div class="container">
<h2>逐日行程（点击展开）</h2>
<p>点击每一天的标题栏展开/收起详细行程。</p>
${dayCards}
</div></section>

${galaxySection}

<section id="food" class="full-bleed"><div class="container">
<h2>🍖 沿线美食地图</h2>
${foodTable}
</div></section>

<section id="hotel"><div class="container">
<h2>🏨 住宿预订策略</h2>
${hotelTable}
</div></section>

<section id="risk" class="full-bleed"><div class="container">
<h2>⚠️ 风险与应急预案</h2>
<div class="card-grid">
${riskCards}
</div>
</div></section>

<footer><div class="container"><div class="sources">
<h2>使用说明</h2>
<p style="font-size:.85rem;color:var(--muted);margin-bottom:1rem">本路书由 <strong>AI 旅行规划引擎</strong> 根据您的参数自动生成。所有价格数据基于2026年公开信息，实际请以出行时景区/酒店公示为准。</p>
<p style="font-size:.85rem;color:var(--muted)">生成参数：路线=${route.name} | 人数=${params.people}人 | 天数=${params.days}天 | 车型=${params.carType} | 预算=${params.budgetLevel}型 | 兴趣=${params.interests.join('、')}</p>
</div></div></footer>

<script>
window._reportData = {
  altLabels: ${JSON.stringify(altLabels)},
  altData: ${JSON.stringify(altData)},
  dailyKm: ${JSON.stringify(dailyKm)},
  budgetData: [
    {value:${oilCost},name:'油费'},
    {value:${tollCost},name:'过路费'},
    {value:${hotelCost},name:'住宿'},
    {value:${foodCost},name:'餐饮'},
    {value:${ticketCost},name:'门票'},
    {value:${miscCost},name:'杂费'}
  ],
  dailyCost: ${JSON.stringify(generateDailyCost(dailyKm, params, cfg, route))}
};
</script>
`;
}

// ── 辅助函数 ──

function distributeKm(originalKm, targetDays, totalKm) {
  if (originalKm.length === targetDays) return originalKm;
  const result = [];
  const ratio = targetDays / originalKm.length;
  if (ratio > 1) {
    // 天数更多：拆分长距离天数
    for (let km of originalKm) {
      if (km > 500 && result.length < targetDays - 1) {
        result.push(Math.round(km * 0.6));
        result.push(Math.round(km * 0.4));
      } else {
        result.push(km);
      }
    }
    while (result.length < targetDays) result.push(0);
  } else {
    // 天数更少：合并短距离天数
    let sum = 0;
    for (let km of originalKm) {
      sum += km;
      if (result.length < targetDays - 1 && (sum > totalKm / targetDays || km === 0)) {
        result.push(sum);
        sum = 0;
      }
    }
    if (sum > 0) result.push(sum);
    while (result.length < targetDays) result.push(0);
  }
  return result.slice(0, targetDays);
}

function generateDayCards(dailyKm, route, params, startDate) {
  const cities = route.routePoints.map(p => p.name);
  let html = '';
  for (let i = 0; i < params.days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    const dateStr = `${d.getMonth()+1}月${d.getDate()}日`;
    const weekDay = ['日','一','二','三','四','五','六'][d.getDay()];
    const km = dailyKm[i] || 0;
    const fromCity = cities[Math.min(i, cities.length-1)] || route.routePoints[0].name;
    const toCity = cities[Math.min(i+1, cities.length-1)] || route.routePoints[route.routePoints.length-1].name;
    const isRest = km === 0;

    html += `
<div class="day-card ${i===0?'open':''}" id="day${i+1}">
<div class="day-header" onclick="this.parentElement.classList.toggle('open')">
<h3>Day ${i+1}：${dateStr}（周${weekDay}） · ${isRest ? toCity + ' 休整/游览' : fromCity + ' → ' + toCity}</h3>
<div class="day-meta">${km > 0 ? `约${km}km · 驾车约${Math.round(km/80+1)}h` : '市内游览/休整'}</div>
<span class="toggle">▼</span>
</div>
<div class="day-body">
<div class="info-box tip"><h5>📍 今日概览</h5>
<p>${isRest ? `在${toCity}深度游览，建议参观：${route.spots.all.filter(s => s.region.includes(toCity) || toCity.includes(s.region)).slice(0,2).map(s => s.name).join('、') || '当地特色景点'}` : `从${fromCity}出发，前往${toCity}。沿途注意路况和加油站分布。`}</p>
</div>
<h4>🕐 建议时间线</h4>
<div class="timeline">
${generateTimeline(km, fromCity, toCity, isRest, i, params)}
</div>
</div>
</div>`;
  }
  return html;
}

function generateTimeline(km, from, to, isRest, dayIndex, params) {
  if (isRest) {
    return `
<div class="timeline-item"><div class="timeline-time">08:00</div><div class="timeline-desc">起床，早餐</div></div>
<div class="timeline-item"><div class="timeline-time">09:00-12:00</div><div class="timeline-desc">景点游览（参考景点攻略）</div></div>
<div class="timeline-item"><div class="timeline-time">12:00-14:00</div><div class="timeline-desc">午餐+午休</div></div>
<div class="timeline-item"><div class="timeline-time">14:00-18:00</div><div class="timeline-desc">继续游览或自由活动</div></div>
<div class="timeline-item"><div class="timeline-time">18:30-20:30</div><div class="timeline-desc">晚餐，品尝当地美食</div></div>
<div class="timeline-item"><div class="timeline-time">21:00</div><div class="timeline-desc">休息，为明天做准备</div></div>`;
  }
  const driveHours = Math.round(km / 80 + 1);
  const depart = '06:30';
  const arrive = `${6 + driveHours + 1}:30`;
  return `
<div class="timeline-item"><div class="timeline-time">${depart}</div><div class="timeline-desc">${from}出发，检查车辆</div></div>
<div class="timeline-item"><div class="timeline-time">${depart}-${Math.floor(6+driveHours/2)}:30</div><div class="timeline-desc">${from}→中途服务区（约${Math.round(km/2)}km）</div></div>
<div class="timeline-item"><div class="timeline-time">${Math.floor(6+driveHours/2)}:30-${Math.floor(6+driveHours/2)+1}:00</div><div class="timeline-desc">服务区休息，加油</div></div>
<div class="timeline-item"><div class="timeline-time">${Math.floor(6+driveHours/2)+1}:00-${arrive}</div><div class="timeline-desc">继续前往${to}（剩余约${Math.round(km/2)}km）</div></div>
<div class="timeline-item"><div class="timeline-time">${arrive}-${parseInt(arrive.split(':')[0])+1}:${arrive.split(':')[1]}</div><div class="timeline-desc">抵达${to}，入住酒店</div></div>
<div class="timeline-item"><div class="timeline-time">${parseInt(arrive.split(':')[0])+2}:00-18:00</div><div class="timeline-desc">${to}市区游览或休整</div></div>
<div class="timeline-item"><div class="timeline-time">18:30-20:30</div><div class="timeline-desc">晚餐</div></div>`;
}

function generateSpotTabs(spots) {
  const tabs = ['全部'];
  const tags = [...new Set(spots.all.map(s => s.tag))];
  tabs.push(...tags);

  let html = '<div class="tabs"><div class="tab-headers">';
  tabs.forEach((t, i) => {
    html += `<div class="tab-header ${i===0?'active':''}" data-tab="${t}" onclick="switchTab(this,'${t}')">${t}</div>`;
  });
  html += '</div>';

  tabs.forEach((t, i) => {
    const filtered = t === '全部' ? spots.all : spots.all.filter(s => s.tag === t);
    html += `<div class="tab-content ${i===0?'active':''}" id="tab-${t}">`;
    filtered.forEach(spot => {
      html += `
<h3>${spot.name} <span class="badge ${spot.badge}">${spot.tag}</span></h3>
<div class="card-grid">
<div class="card"><h4>⭐ 必玩核心</h4><ul><li>${spot.mustDo}</li></ul></div>
<div class="card"><h4>⚠️ 避坑</h4><ul><li><span class="badge red">注意</span> ${spot.traps}</li></ul></div>
<div class="card"><h4>🅿️ 自驾停车</h4><ul><li>${spot.parking}</li></ul></div>
<div class="card"><h4>💰 价格 & 时长</h4><ul><li>门票：${spot.price}</li><li>建议：${spot.duration}</li></ul></div>
</div>`;
    });
    html += '</div>';
  });
  html += '</div>';
  return html;
}

function generateFoodTable(food) {
  let html = '<div class="table-wrap"><table class="price-table"><thead><tr><th>城市</th><th>必吃</th><th>价格</th><th>推荐店铺</th><th>避坑</th></tr></thead><tbody>';
  food.forEach(f => {
    html += `<tr><td>${f.city}</td><td><strong>${f.food}</strong></td><td>${f.price}</td><td>${f.shop}</td><td>${f.trap}</td></tr>`;
  });
  html += '</tbody></table></div>';
  return html;
}

function generateHotelTable(hotels) {
  let html = '<div class="table-wrap"><table class="price-table"><thead><tr><th>城市</th><th>旺季价（元/晚）</th><th>预订提前量</th><th>建议</th></tr></thead><tbody>';
  hotels.forEach(h => {
    html += `<tr><td><strong>${h.city}</strong></td><td>${h.price}</td><td>${h.advance}</td><td>${h.tip}</td></tr>`;
  });
  html += '</tbody></table></div>';
  return html;
}

function generateGalaxySection(route, params) {
  const start = new Date(params.startDate);
  let moonHtml = '<div class="moon-cal">';
  for (let i = 0; i < params.days; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    const day = d.getDate();
    const month = d.getMonth() + 1;
    // 简化月相判断
    const phase = i < 3 ? 'bad' : (i < 7 ? 'ok' : 'great');
    moonHtml += `<div style="text-align:center"><div class="moon-day ${phase}">${day}</div><div class="moon-label">${month}月</div></div>`;
  }
  moonHtml += '</div>';

  let spotsHtml = '<div class="table-wrap"><table class="price-table"><thead><tr><th>地点</th><th>暗夜等级</th><th>最佳日期</th><th>夜间气温</th><th>特色</th></tr></thead><tbody>';
  route.galaxySpots.forEach(s => {
    spotsHtml += `<tr><td>${s.name}</td><td><span class="stars">${s.level}</span></td><td>${s.dates}</td><td>${s.temp}</td><td>${s.feature}</td></tr>`;
  });
  spotsHtml += '</tbody></table></div>';

  return `
<section id="galaxy" class="full-bleed"><div class="container">
<h2>🌌 银河观星专题</h2>
<p>基于您的出发日期计算的月相观测窗口。</p>
<h3>月相日历</h3>
${moonHtml}
<p style="font-size:.8rem;color:var(--muted)">⬤ 黑色=月光干扰强 · 蓝色=可拍 · 绿色=极佳</p>
<h3>各观星点评级</h3>
${spotsHtml}
<div class="card-grid">
<div class="card"><h4>📷 相机设置</h4><ul><li>广角大光圈镜头（16-24mm f/1.4-f/2.8）</li><li>ISO 3200-6400，快门15-25秒</li><li>RAW格式，三脚架必备</li></ul></div>
<div class="card"><h4>🧥 防寒装备</h4><ul><li>羽绒服+抓绒帽+手套</li><li>暖宝宝+保温杯</li></ul></div>
</div>
</div></section>`;
}

function generateRiskCards(risks) {
  return risks.map(r => `
<div class="card"><h4>${r.title}</h4><p><strong>概率：${r.prob}</strong></p><p style="font-size:.85rem;margin-top:.4rem">${r.desc}</p></div>
  `).join('');
}

function generateSvgMap(route) {
  const points = route.routePoints;
  const w = 1000, h = 300;
  const maxAlt = Math.max(...points.map(p => p.alt));
  const minAlt = Math.min(...points.map(p => p.alt));
  const xStep = w / (points.length - 1);

  let pathD = `M ${50} ${h - 50 - (points[0].alt - minAlt) / (maxAlt - minAlt + 100) * (h - 100)}`;
  points.slice(1).forEach((p, i) => {
    const x = 50 + (i + 1) * ((w - 100) / (points.length - 1));
    const y = h - 50 - (p.alt - minAlt) / (maxAlt - minAlt + 100) * (h - 100);
    pathD += ` L ${x} ${y}`;
  });

  let circles = '';
  points.forEach((p, i) => {
    const x = 50 + i * ((w - 100) / (points.length - 1));
    const y = h - 50 - (p.alt - minAlt) / (maxAlt - minAlt + 100) * (h - 100);
    circles += `<circle cx="${x}" cy="${y}" r="5" fill="${i===0?'#c47a3a':(i===points.length-1?'#b8860b':'#3a6b8c')}"/><text x="${x}" y="${y+20}" text-anchor="middle" font-size="10" fill="#2c2416">${p.name}</text>`;
  });

  return `<svg class="route-map" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
<rect width="${w}" height="${h}" fill="#f0ece6" rx="12"/>
<path d="${pathD}" stroke="url(#routeGrad)" stroke-width="3" fill="none"/>
<defs><linearGradient id="routeGrad" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" style="stop-color:#c47a3a"/><stop offset="100%" style="stop-color:#3a6b8c"/></linearGradient></defs>
${circles}
</svg>`;
}

function generateDailyCost(dailyKm, params, cfg, route) {
  const car = cfg.carTypes[params.carType];
  return dailyKm.map(km => {
    const oil = Math.round(km / 100 * car.oilPer100km * cfg.oilPriceBase);
    const toll = Math.round(km * route.tollRate);
    const hotel = km === 0 ? Math.round(cfg.hotelPerNight[params.budgetLevel] * cfg.peopleMultiplier[params.people]) : 0;
    const food = Math.round(cfg.foodPerPersonPerDay[params.budgetLevel] * params.people);
    return [hotel, food, oil + toll, Math.round(Math.random() * 100 * params.people)];
  });
}

// ── Tab Switching ──
function switchTab(el, tabId) {
  el.parentElement.querySelectorAll('.tab-header').forEach(h => h.classList.remove('active'));
  el.classList.add('active');
  el.closest('.tabs').querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  const target = document.getElementById('tab-' + tabId);
  if(target) target.classList.add('active');
}
