/**
 * 前端应用逻辑
 * 偏好输入表单 (F1) → 调用生成接口 (F2) → 方案卡片展示 (F3) → 加载/异常状态
 * P1: 天气自动适配 (F6) / 埋点 / 缓存跳过
 * P2: 活动替换 (F5) / 方案收藏 (F7) / 历史记录 / 偏好持久化 / 多方案对比
 */
(function () {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const S = window.__storage; // storage.js 模块

  // === DOM ===
  const citySel = $('city');
  const weatherSel = $('weather');
  const weatherBtn = $('weather-btn');
  const locateBtn = $('locate-btn');
  const weatherStatus = $('weather-status');
  const budgetRow = $('budget-row');
  const moodRow = $('mood-row');
  const companionRow = $('companion-row');
  const form = $('pref-form');
  const genBtn = $('generate-btn');
  const loadingPanel = $('loading-panel');
  const loadingText = $('loading-text');
  const errorPanel = $('error-panel');
  const errorText = $('error-text');
  const retryBtn = $('retry-btn');
  const resultsPanel = $('results-panel');
  const resultsMeta = $('results-meta');
  const planTabs = $('plan-tabs');
  const planCards = $('plan-cards');
  const regenerateBtn = $('regenerate-btn');
  const shareBtn = $('share-btn');
  const favBtn = $('fav-btn');
  const favListOverlay = $('fav-list-overlay');
  const favListContainer = $('fav-list-container');
  const favListClose = $('fav-list-close');
  const restoreBtn = $('restore-btn');
  const cancelBtn = $('cancel-btn');
  const historyBtn = $('history-btn');
  const historyOverlay = $('history-overlay');
  const historyContainer = $('history-container');
  const historyClose = $('history-close');
  const clearHistoryBtn = $('clear-history-btn');
  const toastContainer = $('toast-container');

  let currentPlans = [];
  let activePlanIndex = 0;
  let lastPrefs = null;
  let currentSource = '';
  let weatherAutoDetected = false;
  let abortController = null; // 取消生成
  let cardCollapsed = false; // 卡片展开/收起状态

  const LOADING_COPY = [
    '正在为你组合灵感...',
    '翻遍城市的每个角落...',
    '匹配你的心情和预算...',
    '为周末加点新鲜感...',
    'AI 正在构思方案，请稍候...',
    '正在排版你的专属周末...',
    '马上就好，正在生成方案...'
  ];
  let loadingTimer = null;

  // === 埋点 (WI-1.4) ===
  function track(type, props = {}) {
    try {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...props })
      }).catch(() => {});
    } catch (e) {}
  }

  // === Toast 通知 (WI-2.5 体验优化) ===
  function toast(msg, type = 'info') {
    if (!toastContainer) return;
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.textContent = msg;
    toastContainer.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }

  // === 初始化表单选项 ===
  async function initOptions() {
    try {
      const res = await fetch('/api/options');
      const opts = await res.json();
      fillSelect(citySel, opts.cities.map(c => ({ key: c, label: c })));
      fillSelect(weatherSel, opts.weathers);
      buildChips(budgetRow, opts.budgets, false, '100-300');
      buildChips(moodRow, opts.moods, true, ['放松']);
      buildChips(companionRow, opts.companions, false, 'solo');

      // WI-2.4: 页面加载时自动恢复上次偏好
      if (S && S.hasSavedPrefs()) {
        restorePrefs();
        // 显示"恢复上次"按钮，用户可手动再次恢复
        if (restoreBtn) restoreBtn.style.display = '';
      }
    } catch (e) {
      console.error('初始化选项失败', e);
    }
  }

  function fillSelect(sel, items) {
    sel.innerHTML = items.map(i => `<option value="${i.key}">${i.label}</option>`).join('');
  }

  function buildChips(container, items, multi, defaultValue) {
    container.innerHTML = '';
    const state = multi ? new Set([].concat(defaultValue)) : defaultValue;
    items.forEach(item => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = item.label;
      chip.dataset.key = item.key;
      const isActive = multi ? state.has(item.key) : item.key === defaultValue;
      if (isActive) chip.classList.add('active');
      chip.addEventListener('click', () => {
        if (multi) {
          if (chip.classList.contains('active')) {
            if (state.size > 1) { chip.classList.remove('active'); state.delete(item.key); }
          } else { chip.classList.add('active'); state.add(item.key); }
        } else {
          container.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
        }
      });
      container.appendChild(chip);
    });
    container._state = state;
  }

  // === WI-2.4 偏好持久化 ===
  function restorePrefs() {
    if (!S || !S.hasSavedPrefs()) return;
    const saved = S.loadPrefs();
    if (!saved) return;
    // 恢复城市
    if (saved.city) citySel.value = saved.city;
    // 恢复预算
    if (saved.budget) setActiveChip(budgetRow, saved.budget);
    // 恢复天气
    if (saved.weather) weatherSel.value = saved.weather;
    // 恢复心情
    if (Array.isArray(saved.mood)) {
      moodRow.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      moodRow._state.clear();
      saved.mood.forEach(k => {
        const chip = moodRow.querySelector(`.chip[data-key="${k}"]`);
        if (chip) { chip.classList.add('active'); moodRow._state.add(k); }
      });
    }
    // 恢复同行人
    if (saved.companion) setActiveChip(companionRow, saved.companion);
    // 恢复后显示提示
    toast('已恢复上次偏好', 'info');
  }

  function setActiveChip(row, key) {
    row.querySelectorAll('.chip').forEach(c => c.classList.toggle('active', c.dataset.key === key));
  }

  function saveCurrentPrefs() {
    if (!S) return;
    S.savePrefs(collectPrefs());
  }

  // === 天气自动获取 (WI-1.1) ===
  async function fetchWeather(city) {
    weatherStatus.textContent = '查询中...';
    weatherStatus.className = 'weather-status loading';
    try {
      const res = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
      const json = await res.json();
      if (json.success && json.data) {
        const w = json.data;
        weatherSel.value = w.weather;
        weatherAutoDetected = true;
        const rainTag = w.precipProb >= 60 ? ' · 降雨概率高，已优先室内' : '';
        weatherStatus.textContent = `${w.label} · ${w.tempMax}°C · 降雨${w.precipProb}%${rainTag}`;
        weatherStatus.className = 'weather-status ok';
      } else { throw new Error('天气获取失败'); }
    } catch (e) {
      weatherStatus.textContent = '获取失败，可手动选择';
      weatherStatus.className = 'weather-status fail';
    }
  }

  // === 定位：根据用户位置自动选择城市 ===
  async function locateUser() {
    if (!navigator.geolocation) {
      alert('您的浏览器不支持定位功能');
      return;
    }
    locateBtn.disabled = true;
    locateBtn.classList.add('locating');
    locateBtn.textContent = '定位中';

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lon } = position.coords;
        try {
          const res = await fetch(`/api/locate?lat=${lat}&lon=${lon}`);
          const json = await res.json();
          if (json.success && json.data) {
            const { city, distance_km, message } = json.data;
            // 检查城市是否在下拉列表中
            const option = [...citySel.options].find(o => o.value === city || o.textContent === city);
            if (option) {
              citySel.value = option.value;
              // 自动获取该城市天气
              fetchWeather(city);
              // 显示定位结果
              const status = $('weather-status') || weatherStatus;
              if (weatherStatus) {
                weatherStatus.textContent = `📍 ${message}（距离约${distance_km}km）`;
                weatherStatus.className = 'weather-status ok';
              }
            } else {
              alert(`定位到的城市"${city}"暂未支持，已为您选择最近的城市`);
            }
          } else {
            alert(json.error || '定位失败，请手动选择城市');
          }
        } catch (e) {
          alert('定位服务异常，请手动选择城市');
        } finally {
          locateBtn.disabled = false;
          locateBtn.classList.remove('locating');
          locateBtn.textContent = '📍 定位';
        }
      },
      (err) => {
        locateBtn.disabled = false;
        locateBtn.classList.remove('locating');
        locateBtn.textContent = '📍 定位';
        const msgs = { 1: '定位被拒绝，请在浏览器设置中允许定位权限', 2: '位置信息不可用', 3: '定位超时，请重试' };
        alert(msgs[err.code] || '定位失败，请手动选择城市');
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  // === 收集表单偏好 ===
  function collectPrefs() {
    const moodSet = moodRow._state || new Set(['放松']);
    return {
      city: citySel.value,
      budget: getActiveKey(budgetRow),
      weather: weatherSel.value,
      mood: [...moodSet],
      companion: getActiveKey(companionRow)
    };
  }
  function getActiveKey(row) {
    const active = row.querySelector('.chip.active');
    return active ? active.dataset.key : null;
  }

  // === 提交生成 ===
  async function handleSubmit(e) {
    if (e) e.preventDefault();
    const prefs = collectPrefs();
    lastPrefs = prefs;
    saveCurrentPrefs(); // WI-2.4: 保存偏好
    await generate(prefs, { autoWeather: weatherAutoDetected });
  }

  async function generate(prefs, opts = {}) {
    showLoading();
    abortController = new AbortController();
    const t0 = Date.now();
    try {
      const payload = { ...prefs, autoWeather: opts.autoWeather === true, bypassCache: opts.bypassCache === true };
      const res = await fetch('/api/generate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: abortController.signal
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      stopLoading();
      if (!json.success || !json.data || json.data.length === 0) {
        showError(json.error || '未能生成方案，请重试');
        return;
      }
      currentPlans = json.data;
      activePlanIndex = 0;
      currentSource = json.meta.source;
      cardCollapsed = false;
      renderResults(json.meta, prefs);
      // WI-2.3: 记录历史
      if (S) S.addHistory(json.data[0], prefs);
      // 更新收藏按钮状态
      updateFavButton();
      track('generate', { city: prefs.city, plan_count: json.data.length, source: currentSource, latency_ms: Date.now() - t0 });
    } catch (err) {
      stopLoading();
      if (err.name === 'AbortError') { toast('已取消生成', 'info'); return; }
      showError('网络异常，请检查连接后重试');
    }
  }

  // === WI-2.1 活动替换 ===
  async function replaceSingleActivity(activityIndex) {
    const plan = currentPlans[activePlanIndex];
    if (!plan) return;
    // 找到被点击的活动项，显示 loading
    const item = planCards.querySelector(`[data-idx="${activityIndex}"]`);
    if (item) { item.classList.add('replacing'); }

    try {
      const res = await fetch('/api/replace-activity', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, activityIndex, prefs: lastPrefs })
      });
      const json = await res.json();
      if (json.success && json.data) {
        currentPlans[activePlanIndex] = json.data;
        renderPlanCards();
        updateFavButton();
        toast('活动已替换', 'success');
      } else {
        toast('替换失败，请重试', 'error');
      }
    } catch (err) {
      console.error('活动替换失败', err);
      toast('替换失败，请重试', 'error');
    } finally {
      if (item) { item.classList.remove('replacing'); }
    }
  }

  // === 加载状态 ===
  function showLoading() {
    errorPanel.classList.add('hidden');
    resultsPanel.classList.add('hidden');
    loadingPanel.classList.remove('hidden');
    genBtn.disabled = true;
    let i = 0;
    loadingText.textContent = LOADING_COPY[0];
    loadingTimer = setInterval(() => {
      i = (i + 1) % LOADING_COPY.length;
      loadingText.textContent = LOADING_COPY[i];
    }, 1500);
  }
  function stopLoading() {
    if (loadingTimer) clearInterval(loadingTimer);
    loadingPanel.classList.add('hidden');
    genBtn.disabled = false;
  }

  // === 异常状态 ===
  function showError(msg) {
    errorText.textContent = msg;
    errorPanel.classList.remove('hidden');
  }

  // === 渲染方案结果 (F3) ===
  function renderResults(meta, prefs) {
    resultsPanel.classList.remove('hidden');
    // 来源标识：清晰区分 AI 生成 / 本地生成 / 降级 / 缓存
    const sourceMap = {
      'llm': { label: 'AI 生成', cls: 'src-ai' },
      'mock': { label: '本地生成', cls: 'src-local' },
      'mock(fallback)': { label: 'AI 降级 → 本地', cls: 'src-fallback' },
      'template': { label: '模板兜底', cls: 'src-local' },
      'cache': { label: '缓存命中', cls: 'src-cache' },
      '收藏': { label: '收藏回看', cls: 'src-cache' }
    };
    const src = sourceMap[meta.source] || { label: meta.source, cls: 'src-local' };
    const aiDot = meta.source === 'llm' ? '<span class="src-dot ai-on"></span>' : '<span class="src-dot"></span>';
    let metaHtml = `共 ${meta.count} 套方案 · ${meta.latency_ms}ms · <span class="tag source-tag ${src.cls}">${aiDot}${src.label}</span>`;
    if (meta.weather) {
      const w = meta.weather;
      metaHtml += ` · <span class="tag weather-tag">${w.label} ${w.tempMax}°C 降雨${w.precipProb}%</span>`;
    }
    resultsMeta.innerHTML = metaHtml;
    renderPlanTabs();
    renderPlanCards();
    resultsPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // === WI-2.5 多方案切换 ===
  function renderPlanTabs() {
    planTabs.innerHTML = '';
    currentPlans.forEach((plan, idx) => {
      const tab = document.createElement('span');
      tab.className = 'plan-tab' + (idx === activePlanIndex ? ' active' : '');
      // 缩略名：取方案名前6字
      const shortName = (plan.plan_name || '').slice(0, 8);
      tab.textContent = `${String.fromCharCode(65 + idx)} · ${shortName}`;
      tab.addEventListener('click', () => {
        activePlanIndex = idx;
        renderPlanTabs();
        renderPlanCards();
        updateFavButton();
      });
      planTabs.appendChild(tab);
    });
  }

  function renderPlanCards() {
    planCards.innerHTML = '';
    const plan = currentPlans[activePlanIndex];
    if (!plan) return;

    const card = document.createElement('div');
    card.className = 'plan-card' + (cardCollapsed ? ' collapsed' : '');

    const tagClass = (t) => {
      if (/户外|漫步|运动/.test(t)) return 't-outdoor';
      if (/室内|雨天|天气/.test(t)) return 't-indoor';
      if (/低预算|预算/.test(t)) return 't-budget';
      return 't-default';
    };

    card.innerHTML = `
      <div class="plan-card-head">
        <div class="plan-card-name">${escapeHtml(plan.plan_name)}</div>
        <div class="plan-card-tags">
          ${(plan.tags || []).map(t => `<span class="tag ${tagClass(t)}">${escapeHtml(t)}</span>`).join('')}
        </div>
      </div>
      <div class="plan-card-body">
        <div class="timeline">
          ${(plan.activities || []).map((a, idx) => `
            <div class="timeline-item" data-idx="${idx}">
              <div class="timeline-time">${escapeHtml(a.time)}</div>
              <div class="timeline-content">
                <div class="timeline-name">${escapeHtml(a.name)}</div>
                <div class="timeline-detail">
                  ${escapeHtml(a.location || '')}
                  ${a.cost != null ? ` · <span class="timeline-cost">${Number(a.cost) === 0 ? '免费' : '¥' + Number(a.cost) + '/人'}</span>` : ''}
                  ${a.transport ? '<br>' + escapeHtml(a.transport) : ''}${a.note ? ' · ' + escapeHtml(a.note) : ''}
                </div>
              </div>
              <button class="btn-replace" data-idx="${idx}" title="换一个活动">换</button>
            </div>
          `).join('')}
        </div>
      </div>
      <button class="btn-expand" id="btn-expand">${cardCollapsed ? '展开详情 ▾' : '收起详情 ▴'}</button>
      ${plan.backup ? `<div class="plan-backup"><strong>备选建议：</strong>${escapeHtml(plan.backup)}</div>` : ''}
      <div class="plan-card-foot">
        <span class="total">总预算：约 <strong>¥${Number(plan.total_cost) || 0}</strong>/人</span>
        <span style="font-size:0.8rem;color:var(--muted);">${escapeHtml(plan.summary || '')}</span>
      </div>
    `;
    planCards.appendChild(card);

    // 绑定活动替换按钮
    card.querySelectorAll('.btn-replace').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        replaceSingleActivity(idx);
      });
    });

    // 绑定展开/收起按钮 (WI-0.10)
    const expandBtn = card.querySelector('#btn-expand');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        cardCollapsed = !cardCollapsed;
        renderPlanCards();
      });
    }
  }

  function escapeHtml(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  // === WI-2.2 收藏 ===
  function updateFavButton() {
    if (!S || !favBtn) return;
    const plan = currentPlans[activePlanIndex];
    if (!plan) return;
    const isFav = S.isFavorite(plan.plan_name);
    favBtn.textContent = isFav ? '已收藏' : '收藏';
    favBtn.classList.toggle('active', isFav);
  }

  function toggleFavorite() {
    if (!S || !favBtn) return;
    const plan = currentPlans[activePlanIndex];
    if (!plan) return;
    const isFav = S.isFavorite(plan.plan_name);
    if (isFav) {
      // 找到对应收藏项 ID 并移除
      const favs = S.getFavorites();
      const target = favs.find(f => f.plan.plan_name === plan.plan_name);
      if (target) S.removeFavorite(target.id);
      toast('已取消收藏', 'info');
    } else {
      S.addFavorite(plan, lastPrefs);
      toast('已收藏方案', 'success');
    }
    updateFavButton();
    renderFavList();
  }

  function renderFavList() {
    if (!S || !favListContainer) return;
    const favs = S.getFavorites();
    if (favs.length === 0) {
      favListContainer.innerHTML = '<p class="fav-empty">暂无收藏的方案。在方案结果页点击"收藏"按钮即可保存。</p>';
      return;
    }
    favListContainer.innerHTML = favs.map(f => {
      const plan = f.plan;
      const date = new Date(f.ts);
      const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;
      return `
        <div class="fav-item" data-id="${f.id}">
          <div class="fav-item-info">
            <div class="fav-item-name">${escapeHtml(plan.plan_name)}</div>
            <div class="fav-item-meta">${escapeHtml(f.prefs ? f.prefs.city : '')} · ¥${Number(plan.total_cost) || 0} · ${dateStr} · ${plan.activities.length}个活动</div>
          </div>
          <div class="fav-item-actions">
            <button class="fav-view" data-id="${f.id}">查看</button>
            <button class="fav-del" data-id="${f.id}">删除</button>
          </div>
        </div>
      `;
    }).join('');

    // 绑定查看和删除
    favListContainer.querySelectorAll('.fav-view').forEach(btn => {
      btn.addEventListener('click', () => viewFavorite(btn.dataset.id));
    });
    favListContainer.querySelectorAll('.fav-del').forEach(btn => {
      btn.addEventListener('click', () => {
        S.removeFavorite(btn.dataset.id);
        renderFavList();
        updateFavButton();
      });
    });
  }

  function viewFavorite(id) {
    const favs = S.getFavorites();
    const target = favs.find(f => f.id === id);
    if (!target) return;
    // 把收藏的方案设为当前方案展示
    currentPlans = [target.plan];
    activePlanIndex = 0;
    lastPrefs = target.prefs || lastPrefs;
    favListOverlay.classList.add('hidden');
    currentSource = '收藏';
    renderResults({ source: '收藏', count: 1, latency_ms: 0 }, target.prefs || {});
    renderPlanTabs();
    renderPlanCards();
    updateFavButton();
  }

  // === 暴露给分享模块 ===
  window.__weekendApp = {
    getCurrentPlan: () => currentPlans[activePlanIndex],
    getPrefs: () => lastPrefs,
    getCurrentSource: () => currentSource,
    track,
    toast
  };

  // === 事件绑定 ===
  form.addEventListener('submit', handleSubmit);
  retryBtn.addEventListener('click', () => { if (lastPrefs) generate(lastPrefs, { autoWeather: weatherAutoDetected }); });
  regenerateBtn.addEventListener('click', () => {
    if (lastPrefs) generate(lastPrefs, { bypassCache: true, autoWeather: weatherAutoDetected });
  });
  weatherBtn.addEventListener('click', () => fetchWeather(citySel.value));
  // 定位按钮
  if (locateBtn) locateBtn.addEventListener('click', locateUser);
  citySel.addEventListener('change', () => {
    weatherAutoDetected = false;
    weatherStatus.textContent = '';
    weatherStatus.className = 'weather-status';
  });
  shareBtn.addEventListener('click', () => {
    if (window.__shareModule) {
      window.__shareModule.open();
      track('share', { city: lastPrefs ? lastPrefs.city : '' });
    }
  });
  // 收藏
  if (favBtn) favBtn.addEventListener('click', toggleFavorite);
  // 收藏列表
  if (favListOverlay) {
    const favListBtn = $('fav-list-btn');
    if (favListBtn) favListBtn.addEventListener('click', () => {
      renderFavList();
      favListOverlay.classList.remove('hidden');
    });
    if (favListClose) favListClose.addEventListener('click', () => favListOverlay.classList.add('hidden'));
    favListOverlay.addEventListener('mousedown', (e) => {
      if (e.target === favListOverlay) favListOverlay.classList.add('hidden');
    });
  }

  // === WI-2.3 历史记录 ===
  function renderHistoryList() {
    if (!S || !historyContainer) return;
    const history = S.getHistory();
    if (history.length === 0) {
      historyContainer.innerHTML = '<p style="text-align:center;color:var(--ink-mute);padding:2rem 0;">暂无历史记录</p>';
      return;
    }
    historyContainer.innerHTML = history.map(h => {
      const plan = h.plan || h;
      const prefs = h.prefs || {};
      const date = new Date(h.ts || Date.now());
      const dateStr = `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      return `
        <div class="hist-item" data-id="${h.id || ''}">
          <div class="hist-item-info">
            <div class="hist-item-name">${escapeHtml(plan.plan_name || '未命名方案')}</div>
            <div class="hist-item-meta">${escapeHtml(prefs.city || '')} · ¥${Number(plan.total_cost) || 0} · ${dateStr} · ${(plan.activities || []).length}个活动</div>
          </div>
          <span class="hist-arrow" style="color:var(--ink-mute);">→</span>
        </div>
      `;
    }).join('');
    // 点击历史项回看方案
    historyContainer.querySelectorAll('.hist-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = item.dataset.id;
        const history = S.getHistory();
        const target = history.find(h => h.id === id);
        if (target) {
          historyOverlay.classList.add('hidden');
          currentPlans = [target.plan];
          activePlanIndex = 0;
          currentSource = '历史回看';
          cardCollapsed = false;
          renderResults({ source: '历史回看', count: 1, latency_ms: 0 }, target.prefs || {});
          toast('已加载历史方案', 'success');
        }
      });
    });
  }

  // 历史记录按钮事件
  if (historyBtn) historyBtn.addEventListener('click', () => {
    renderHistoryList();
    historyOverlay.classList.remove('hidden');
  });
  if (historyClose) historyClose.addEventListener('click', () => historyOverlay.classList.add('hidden'));
  if (historyOverlay) historyOverlay.addEventListener('mousedown', (e) => {
    if (e.target === historyOverlay) historyOverlay.classList.add('hidden');
  });
  if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', () => {
    if (confirm('确定清空所有历史记录吗？')) {
      S.clearHistory();
      renderHistoryList();
      toast('历史记录已清空', 'info');
    }
  });

  // 取消生成按钮 (WI-0.11)
  if (cancelBtn) cancelBtn.addEventListener('click', () => {
    if (abortController) {
      abortController.abort();
      stopLoading();
      toast('正在取消...', 'info');
    }
  });

  // 恢复偏好按钮
  if (restoreBtn) restoreBtn.addEventListener('click', () => {
    restorePrefs();
  });

  // === 全局弹层管理：ESC 关闭 + 背景滚动锁定 ===
  const overlays = [
    { el: $('share-overlay'), close: () => window.__shareModule && window.__shareModule.close() },
    { el: $('fav-list-overlay'), close: () => $('fav-list-overlay').classList.add('hidden') },
    { el: $('history-overlay'), close: () => $('history-overlay').classList.add('hidden') },
    { el: $('config-overlay'), close: () => $('config-overlay').classList.add('hidden') }
  ].filter(o => o.el);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      // 从后往前关闭第一个可见弹层
      for (let i = overlays.length - 1; i >= 0; i--) {
        if (!overlays[i].el.classList.contains('hidden')) {
          overlays[i].close();
          break;
        }
      }
    }
  });

  // 背景滚动锁定：监控任一弹层可见时锁定 body
  const observer = new MutationObserver(() => {
    const anyOpen = overlays.some(o => !o.el.classList.contains('hidden'));
    document.body.style.overflow = anyOpen ? 'hidden' : '';
  });
  overlays.forEach(o => observer.observe(o.el, { attributes: true, attributeFilter: ['class'] }));

  // 启动
  initOptions();
})();
