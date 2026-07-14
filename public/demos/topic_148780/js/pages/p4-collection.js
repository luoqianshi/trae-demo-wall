// ============================================
// P4 种草收藏夹
// ============================================
let p4State = 'list'; // 'list' | 'analyzing' | 'result'

function loadCollections() {
  if (typeof store !== 'undefined') {
    const stored = store.get('collections');
    if (Array.isArray(stored) && stored.length > 0) {
      collections = stored;
    }
  }
}

function onP4Input() {
  const input = document.getElementById('p4-input').value.trim();
  const btn = document.getElementById('p4-analyze-btn');
  if (input.length > 0) {
    btn.classList.add('enabled');
  } else {
    btn.classList.remove('enabled');
  }
}

async function startAnalysis() {
  const input = document.getElementById('p4-input').value.trim();
  if (!input) {
    showMessage('emptyInput', 'warning');
    return;
  }
  
  p4State = 'analyzing';
  const analysisArea = document.getElementById('p4-analysis-area');
  analysisArea.style.display = 'block';
  
  analysisArea.innerHTML = `
    <div class="p4-analysis-loading card">
      <div class="p4-analysis-loading-header">
        <i data-lucide="sparkles" class="h-5 w-5 p4-analysis-loading-icon"></i>
        <span class="p4-analysis-loading-text">搭子正在帮你分析~</span>
      </div>
      <div class="p4-loading-steps">
        <div class="p4-loading-step">
          <div class="p4-loading-dot active" id="p4-step-dot-1"></div>
          <div class="p4-loading-step-text active" id="p4-step-text-1">识别地点中...</div>
        </div>
        <div class="p4-loading-step">
          <div class="p4-loading-dot pending" id="p4-step-dot-2"></div>
          <div class="p4-loading-step-text" id="p4-step-text-2">判断类型中...</div>
        </div>
        <div class="p4-loading-step">
          <div class="p4-loading-dot pending" id="p4-step-dot-3"></div>
          <div class="p4-loading-step-text" id="p4-step-text-3">结合天气评估中...</div>
        </div>
      </div>
      <div class="p4-loading-footnote">搭子帮你看看这个地方适合什么时候去~</div>
    </div>
  `;
  
    refreshIcons();
  
  const stepDuration = 800;
  
  setTimeout(() => {
    const dot1 = document.getElementById('p4-step-dot-1');
    const text1 = document.getElementById('p4-step-text-1');
    if (dot1) { dot1.classList.remove('active'); dot1.classList.add('done'); }
    if (text1) { text1.classList.remove('active'); text1.classList.add('done'); }
    const dot2 = document.getElementById('p4-step-dot-2');
    const text2 = document.getElementById('p4-step-text-2');
    if (dot2) { dot2.classList.remove('pending'); dot2.classList.add('active'); }
    if (text2) text2.classList.add('active');
  }, stepDuration);
  
  setTimeout(() => {
    const dot2 = document.getElementById('p4-step-dot-2');
    const text2 = document.getElementById('p4-step-text-2');
    if (dot2) { dot2.classList.remove('active'); dot2.classList.add('done'); }
    if (text2) { text2.classList.remove('active'); text2.classList.add('done'); }
    const dot3 = document.getElementById('p4-step-dot-3');
    const text3 = document.getElementById('p4-step-text-3');
    if (dot3) { dot3.classList.remove('pending'); dot3.classList.add('active'); }
    if (text3) text3.classList.add('active');
  }, stepDuration * 2);
  
  setTimeout(() => {
    const dot3 = document.getElementById('p4-step-dot-3');
    const text3 = document.getElementById('p4-step-text-3');
    if (dot3) { dot3.classList.remove('active'); dot3.classList.add('done'); }
    if (text3) { text3.classList.remove('active'); text3.classList.add('done'); }
  }, stepDuration * 3);
  
  let aiResult = null;
  if (typeof analyzeCollectionByAI === 'function') {
    try {
      aiResult = await analyzeCollectionByAI(input);
    } catch (err) {
      console.warn('种草分析 AI 调用异常：', err);
    }
  }
  
  const minLoadingTime = stepDuration * 3 + 200;
  const elapsed = Date.now() - (window.p4AnalysisStartTime || Date.now());
  const remainingTime = Math.max(0, minLoadingTime - elapsed);
  
  await new Promise(resolve => setTimeout(resolve, remainingTime));
  
  p4State = 'result';
  renderAnalysisResult(input, aiResult);
}

function analyzeByText(text) {
  const places = window.PLACES || [];
  const cleanText = text.toLowerCase();

  let bestMatch = null;
  let bestScore = 0;

  for (const p of places) {
    let score = 0;

    if (cleanText.includes(p.name.toLowerCase())) {
      score += 100;
    }

    const shortName = p.name.replace(/风景区|公园|博物馆|科技馆|乐园|农场|山庄|生态园|观光园|景区|广场|世界|小镇|森林|动物|野生|游乐|亲子|儿童|室内|户外|南京/g, '');
    if (shortName.length >= 2 && cleanText.includes(shortName.toLowerCase())) {
      score += 60;
    }

    if (p.tags && p.tags.length > 0) {
      for (const tag of p.tags) {
        if (cleanText.includes(tag.toLowerCase())) {
          score += 15;
        }
      }
    }

    if (p.district && cleanText.includes(p.district)) {
      score += 5;
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = p;
    }
  }

  if (bestMatch && bestScore >= 50) {
    const isIndoor = bestMatch.indoors;
    const isClosed = bestMatch.closed;
    const saturdayRainy = (window.weather && window.weather.saturday === 'rainy');
    const thisWeekOK = !isClosed && (isIndoor || !saturdayRainy);

    const typeLabel = getPlaceTypeLabel(bestMatch);
    const ageLabel = bestMatch.ageRange && bestMatch.ageRange.length > 0
      ? bestMatch.ageRange.join('、') + '岁'
      : '全年龄段';

    let reason, note;
    if (isClosed) {
      reason = '该地点目前闭园/装修中，暂不推荐前往';
      note = '建议关注官方通知，开园后我们会提醒你';
    } else if (thisWeekOK) {
      reason = isIndoor
        ? '室内场所不受天气影响，本周可随时前往'
        : '周六天气不错，很适合户外活动';
      note = isIndoor ? '下雨天去也很合适' : '建议上午出发，人少体验好';
    } else {
      reason = '预报周六有雨，户外体验会受影响';
      note = '建议预留到下周晴天时前往';
    }

    return {
      placeName: bestMatch.name,
      placeId: bestMatch.id,
      placeType: typeLabel,
      ageRange: ageLabel,
      isIndoor: isIndoor,
      isClosed: isClosed,
      thisWeekOK: thisWeekOK,
      reason: reason,
      note: note,
      matched: true,
      matchScore: bestScore
    };
  }

  const guessedName = extractPlaceName(text);
  const isIndoor = /室内|商场|博物馆|科技馆|美术馆|游泳馆|室内乐园|室内游乐场/.test(text);
  const saturdayRainy = (window.weather && window.weather.saturday === 'rainy');
  const thisWeekOK = isIndoor || !saturdayRainy;

  let typeLabel = '户外休闲';
  if (/采摘|草莓|农场|果园/.test(text)) typeLabel = '户外采摘农场';
  else if (/公园|游乐场|乐园/.test(text)) typeLabel = '户外公园游乐';
  else if (/博物馆|科技馆|展览馆/.test(text)) typeLabel = '室内科普场馆';
  else if (/商场|购物中心/.test(text)) typeLabel = '室内商场亲子';
  else if (isIndoor) typeLabel = '室内亲子场所';

  let reason, note;
  if (thisWeekOK) {
    reason = isIndoor
      ? '室内场所不受天气影响，本周可随时前往'
      : '周六天气不错，很适合户外活动';
    note = '具体信息以实际为准哦';
  } else {
    reason = '预报周六有雨，户外体验会受影响';
    note = '建议预留到下周晴天时前往';
  }

  return {
    placeName: guessedName || '未识别的地点',
    placeId: null,
    placeType: typeLabel,
    ageRange: '全年龄段',
    isIndoor: isIndoor,
    thisWeekOK: thisWeekOK,
    reason: reason,
    note: note,
    matched: false,
    matchScore: 0
  };
}

function extractPlaceName(text) {
  let cleanText = text.replace(/https?:\/\/[^\s]+/g, '').replace(/[a-zA-Z0-9_-]{10,}/g, '').trim();
  cleanText = cleanText.replace(/^[0-9]+/, '').trim();
  cleanText = cleanText.replace(/^【[^】]*】/, '').trim();

  const placeLikeMatch = cleanText.match(/(?:南京|江苏|江宁|玄武|鼓楼|建邺|秦淮|雨花|栖霞|浦口|六合|溧水|高淳)?([\u4e00-\u9fa5]{2,10}(山|湖|沟|园|馆|场|村|庄|谷|湾|滩|寺|塔|桥|门|街|巷|路|大道|广场|中心|世界|小镇|度假村|生态园|风景区|森林公园|动物园|博物馆|科技馆|植物园|公园|农场|山庄|峡谷|瀑布|溶洞|温泉|老街|古镇|乐园))/);
  if (placeLikeMatch && placeLikeMatch[1]) {
    return placeLikeMatch[1];
  }

  const lines = cleanText.split(/\n|，|。|、|｜|\|/).map(l => l.trim()).filter(l => l.length > 0);

  const noisePatterns = [
    /亲子|遛娃|宝宝|孩子|小朋友|周末|假期|一日游|半日游|打卡|推荐|必去|攻略|游记|分享|记录|vlog|day|周末去哪儿|遛娃好去处/,
    /的|了|是|有|在|和|与|及|或|等|之|不|也|就|都|还|很|最|更|非常|特别|超级|真的|太好/,
    /零难度|轻松|好玩|推荐|必打卡|一定要|超|巨|绝|小红书/,
  ];

  let candidates = [];
  for (const line of lines) {
    if (line.length < 2 || line.length > 25) continue;
    let isNoise = false;
    for (const pat of noisePatterns) {
      if (pat.test(line) && line.length > 10) { isNoise = true; break; }
    }
    if (isNoise) continue;
    if (/^[a-zA-Z0-9]+$/.test(line)) continue;
    if (/http|www\.|xiaohongshu|xhslink|source=|xhsshare|xsec_/.test(line)) continue;

    let name = line.replace(/^【[^】]*】/, '').replace(/^[0-9]+/, '').trim();
    name = name.replace(/[0-9]+(km|公里|小时|分钟|岁|m|元)/g, '').trim();
    name = name.replace(/^(南京|江苏|江宁|玄武|鼓楼|建邺|秦淮|雨花|栖霞|浦口|六合|溧水|高淳)/, '').trim();
    if (name.length < 2) continue;

    let score = 0;
    if (/山|湖|沟|园|馆|场|村|庄|谷|湾|滩|寺|塔|桥|门|街|巷|路|大道|广场|中心|世界|小镇|度假村|生态园|风景区|森林公园|动物园|博物馆|科技馆|植物园|公园|农场|山庄/.test(name)) score += 20;
    if (name.length <= 8) score += 10;
    if (name.length <= 5) score += 5;
    if (lines.indexOf(line) < 3) score += 5;

    candidates.push({ name, score });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.length > 0 ? candidates[0].name : null;
}

function getPlaceTypeLabel(place) {
  const types = place.types || [];
  if (types.includes('farm')) return '户外采摘农场';
  if (types.includes('museum') || types.includes('science') || types.includes('culture')) {
    return place.indoors ? '室内科普场馆' : '户外科普场馆';
  }
  if (types.includes('zoo')) return '户外动物园';
  if (types.includes('playground') || types.includes('water')) return place.indoors ? '室内游乐' : '户外游乐';
  if (types.includes('mall')) return '室内商场亲子';
  if (types.includes('park') || types.includes('nature')) return '户外公园自然';
  return '亲子好去处';
}

function convertAIResult(aiResult) {
  const typeLabelMap = {
    '公园': '户外公园自然',
    '博物馆': '室内科普场馆',
    '自然': '户外公园自然',
    '动物园': '户外动物园',
    '游乐场': '户外游乐',
    '商场': '室内商场亲子',
    '农场': '户外采摘农场',
    '科技馆': '室内科普场馆',
    '文化': '室内科普场馆',
    '水乐园': '户外游乐'
  };
  
  const isIndoor = aiResult.indoors === true;
  const suggestion = aiResult.suggestion || 'this_week';
  
  return {
    placeName: aiResult.placeName || '未识别的地点',
    placeId: null,
    placeType: typeLabelMap[aiResult.type] || aiResult.type || '亲子好去处',
    ageRange: '全年龄段',
    isIndoor: isIndoor,
    isClosed: false,
    thisWeekOK: suggestion === 'this_week',
    reason: aiResult.suggestionReason || (isIndoor ? '室内场所不受天气影响，本周可随时前往' : '周六天气不错，很适合户外活动'),
    note: aiResult.analysis || '具体信息以实际为准哦',
    matched: aiResult.matched || false,
    matchScore: aiResult.matched ? 80 : 0,
    aiAnalysis: aiResult.analysis
  };
}

function renderAnalysisResult(text, aiResult) {
  const analysisArea = document.getElementById('p4-analysis-area');
  
  let r;
  if (aiResult && aiResult.placeName) {
    r = convertAIResult(aiResult);
  } else {
    r = analyzeByText(text);
  }
  // 保存到全局，供按钮回调使用
  window.currentAnalysis = r;

  const reserveHtml = r.thisWeekOK ? '' : `
    <div class="p4-analysis-reserve">
      <span class="p4-analysis-reserve-title"><i data-lucide="bookmark-check" class="h-4 w-4"></i> 已为你预留到下周</span>
      <span class="p4-analysis-reserve-sub">下周晴天时优先展示</span>
    </div>
  `;

  const statusCls = r.thisWeekOK ? 'recommend' : 'not-recommend';
  const statusIcon = r.thisWeekOK ? 'check-circle' : 'alert-triangle';
  const statusTitle = r.thisWeekOK
    ? '本周建议：适合本周前往，已加入候选'
    : '本周建议：暂不推荐';
  const statusEmoji = r.thisWeekOK ? '✅' : '⚠️';

  const primaryBtn = r.thisWeekOK
    ? `<button class="btn btn-primary" onclick="goThisWeek()">加入本周候选</button>`
    : `<button class="btn btn-primary" onclick="confirmReserve()">确认预留</button>`;
  const secondaryBtn = r.thisWeekOK
    ? `<button class="btn btn-secondary" onclick="confirmReserve()">预留到下周</button>`
    : `<button class="btn btn-secondary" onclick="goThisWeek()">本周仍要去</button>`;

  const matchBadge = r.matched
    ? `<span class="tag tag-success"><i data-lucide="check" class="h-3 w-3"></i> 地点库已收录</span>`
    : `<span class="tag tag-warning"><i data-lucide="alert-circle" class="h-3 w-3"></i> 未在地点库找到</span>`;
  
  const closedBadge = r.isClosed
    ? `<span class="tag tag-danger"><i data-lucide="lock" class="h-3 w-3"></i> 闭园/装修中</span>`
    : '';

  const analysisHtml = r.aiAnalysis ? `
      <div class="p4-result-analysis">
        <div class="p4-result-analysis-title"><i data-lucide="sparkles" class="h-4 w-4"></i> 搭子分析</div>
        <div class="p4-result-analysis-content">${escapeHtml(r.aiAnalysis)}</div>
      </div>
    ` : '';

  analysisArea.innerHTML = `
    <div class="p4-analysis-result card">
      <div class="p4-result-header">
        <i data-lucide="map-pin" class="h-5 w-5 p4-result-icon"></i>
        <div>
          <div class="p4-result-label">AI 识别地点</div>
          <div class="p4-result-name">${escapeHtml(r.placeName)}</div>
          <div class="p4-result-tags">
            <span class="tag tag-teal">${escapeHtml(r.placeType)}</span>
            <span class="tag tag-purple"><i data-lucide="baby" class="h-3 w-3"></i> ${escapeHtml(r.ageRange)}</span>
            ${matchBadge}
            ${closedBadge}
          </div>
        </div>
      </div>

      <div class="p4-result-status ${statusCls}">
        <i data-lucide="${statusIcon}" class="h-5 w-5 p4-result-status-icon"></i>
        <div>
          <div class="p4-result-status-title">${statusEmoji} ${statusTitle}</div>
          <div class="p4-result-status-desc">原因：${escapeHtml(r.reason)}</div>
        </div>
      </div>

      ${analysisHtml}

      ${reserveHtml}

      <div class="p4-result-actions">
        ${secondaryBtn}
        ${primaryBtn}
      </div>
    </div>
  `;

    refreshIcons();
}

function confirmReserve() {
  const r = window.currentAnalysis;
  if (!r) return;
  addToCollection(r.placeName, r.placeType, 'next-week', '⏳ 预留至下周', r.note);
  fadeOutAnalysis();
}

function goThisWeek() {
  const r = window.currentAnalysis;
  if (!r) return;
  addToCollection(r.placeName, r.placeType, 'this-week', '✅ 本周可去', r.note);
  fadeOutAnalysis();
}

function fadeOutAnalysis() {
  const analysisArea = document.getElementById('p4-analysis-area');
  if (!analysisArea) return;
  const card = analysisArea.querySelector('.p4-analysis-result');
  if (card) {
    card.style.transition = 'opacity 0.3s ease';
    card.style.opacity = '0';
    setTimeout(() => {
      p4State = 'list';
      analysisArea.style.display = 'none';
      analysisArea.innerHTML = '';
      document.getElementById('p4-input').value = '';
      onP4Input();
    }, 300);
  } else {
    p4State = 'list';
    analysisArea.style.display = 'none';
    analysisArea.innerHTML = '';
    document.getElementById('p4-input').value = '';
    onP4Input();
  }
}

function closeAnalysis() {
  p4State = 'list';
  document.getElementById('p4-analysis-area').style.display = 'none';
  document.getElementById('p4-input').value = '';
  onP4Input();
}

function addToCollection(placeName, placeType, barColor, statusLabel, note) {
  const exists = collections.some(c => c.placeName === placeName);
  if (exists) {
    showMessage('exists', 'info');
    return;
  }

  const statusMap = {
    'next-week': 'nextWeek',
    'this-week': 'thisWeek',
    'this-month': 'thisMonth'
  };

  collections.unshift({
    id: Date.now(),
    placeName: placeName,
    status: statusMap[barColor] || 'thisWeek',
    statusLabel: statusLabel,
    barColor: barColor,
    types: [placeType],
    note: note
  });

  updateCollectionCount();
  renderCollectionList();
  if (typeof store !== 'undefined' && store.set) {
    store.set('collections', collections);
  }
  showMessage('added', 'success');
}

// 列表项依次淡入
function triggerListFadeIn(el) {
  if (!el) return;
  el.classList.remove('list-fade-in');
  void el.offsetWidth;
  el.classList.add('list-fade-in');
}

function updateCollectionCount() {
  const countEl = document.getElementById('p4-collection-count');
  if (countEl) {
    countEl.textContent = `${collections.length} 个地点`;
  }
}

function renderCollectionList() {
  const listEl = document.getElementById('p4-collection-list');
  if (!listEl) return;
  
  if (collections.length === 0) {
    listEl.innerHTML = `
      <div class="p4-empty-state">
        <div class="p4-empty-icon empty-state-icon"><i data-lucide="inbox" class="h-12 w-12"></i></div>
        <div class="p4-empty-text">还没有收藏哦</div>
        <div class="p4-empty-hint">看到好地方，粘贴到上面让搭子帮你分析~</div>
      </div>
    `;
      refreshIcons();
    return;
  }
  
  listEl.innerHTML = collections.map(item => `
    <div class="p4-collection-card">
      <div class="p4-collection-bar ${item.barColor}"></div>
      <div class="p4-collection-body">
        <div class="p4-collection-top">
          <div class="p4-collection-name">${escapeHtml(item.placeName)}</div>
          <div class="p4-collection-status">${escapeHtml(item.statusLabel)}</div>
        </div>
        <div class="p4-collection-tags">
          ${item.types.map(t => `<span class="tag tag-gray">${escapeHtml(t)}</span>`).join('')}
        </div>
        ${item.note ? `<div class="p4-collection-note"><i data-lucide="file-text" class="h-3.5 w-3.5"></i> ${escapeHtml(item.note)}</div>` : ''}
      </div>
    </div>
  `).join('');

  // 列表项依次淡入
  triggerListFadeIn(listEl);

  refreshIcons();
}
