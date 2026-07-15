// clock.js - 多时区动态时钟面板
// 性能优化:首次渲染完整结构,后续每秒只更新时分秒文本节点
// Intl.DateTimeFormat 实例按时区缓存,避免每秒重建

const Clock = (() => {
  let timer = null;
  let onTickCallbacks = [];
  // 缓存 DOM 节点引用,避免每秒 querySelector
  let domCache = null;
  // 缓存各时区的 formatter
  const fmtTimeCache = new Map();
  const fmtDateCache = new Map();

  function fmtTime(date, tz) {
    let f = fmtTimeCache.get(tz);
    if (!f) {
      f = new Intl.DateTimeFormat('zh-CN', {
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false, timeZone: tz
      });
      fmtTimeCache.set(tz, f);
    }
    return f.format(date);
  }

  function fmtDate(date, tz) {
    let f = fmtDateCache.get(tz);
    if (!f) {
      f = new Intl.DateTimeFormat('zh-CN', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        weekday: 'short', timeZone: tz
      });
      fmtDateCache.set(tz, f);
    }
    return f.format(date);
  }

  function getNow(date, tz) {
    return {
      time: fmtTime(date, tz),
      date: fmtDate(date, tz),
      shichen: Shichen.getShichen(date, tz),
      tz
    };
  }

  // 一次性构建 DOM 结构(只调用一次)
  function buildPanel(id, label, isForbidden) {
    const el = document.getElementById(id);
    if (!el) return null;
    el.innerHTML =
      '<div class="text-xs ' + (isForbidden ? 'text-yellow-300' : 'text-amber-200/70') + ' tracking-widest mb-1">' + label + '</div>' +
      '<div class="font-kai text-3xl md:text-4xl text-yellow-50 tabular-nums tracking-wider drop-shadow js-time">--:--:--</div>' +
      '<div class="text-xs text-amber-100/60 mt-1 js-date">----</div>' +
      '<div class="mt-2 flex items-center justify-center gap-2">' +
        '<span class="font-kai text-2xl ' + (isForbidden ? 'text-yellow-300' : 'text-amber-100/80') + ' js-shichen">--时</span>' +
        '<span class="text-xs text-amber-200/50 js-alias">--</span>' +
        '<span class="text-xs text-amber-200/40 js-hm">--:--</span>' +
      '</div>';
    return {
      root: el,
      time: el.querySelector('.js-time'),
      date: el.querySelector('.js-date'),
      shichen: el.querySelector('.js-shichen'),
      alias: el.querySelector('.js-alias'),
      hm: el.querySelector('.js-hm')
    };
  }

  function initDomCache() {
    if (domCache) return;
    domCache = {
      local: buildPanel('clock-local', '本地', false),
      forbidden: buildPanel('clock-forbidden', '紫禁城', true)
    };
  }

  // 只更新文本节点(性能优化)
  function updatePanel(ref, data) {
    if (!ref) return;
    ref.time.textContent = data.time;
    ref.date.textContent = data.date;
    ref.shichen.textContent = data.shichen.name + '时';
    ref.alias.textContent = data.shichen.alias;
    ref.hm.textContent = String(data.shichen.hour).padStart(2, '0') + ':' + String(data.shichen.minute).padStart(2, '0');
  }

  // 已添加城市列表(完整重写,但只在城市变化时)
  function renderAddedCities(addedTZList, now) {
    const container = document.getElementById('clock-added-list');
    if (!container) return;
    if (addedTZList.length === 0) {
      container.innerHTML = '<div class="text-xs text-amber-100/40 italic">未添加城市,请在设置中添加</div>';
      return;
    }
    // 用 documentFragment 减少 reflow
    const frag = document.createDocumentFragment();
    addedTZList.forEach(tz => {
      const data = getNow(now, tz);
      const cityName = Cities.findByKey(tz)?.city || tz.split('/').pop();
      const div = document.createElement('div');
      div.className = 'bg-amber-50/10 border border-amber-300/30 rounded px-3 py-2 mb-2 flex items-center justify-between';
      div.innerHTML =
        '<div>' +
          '<div class="font-kai text-amber-100">' + cityName + '</div>' +
          '<div class="text-xs text-amber-200/60 js-add-date">' + data.date + '</div>' +
        '</div>' +
        '<div class="text-right">' +
          '<div class="font-mono text-lg text-yellow-50 tabular-nums js-add-time">' + data.time + '</div>' +
          '<div class="text-xs text-amber-200/70 js-add-shichen">' + data.shichen.name + '时 · ' + data.shichen.alias + '</div>' +
        '</div>';
      frag.appendChild(div);
    });
    container.innerHTML = '';
    container.appendChild(frag);
  }

  // 缓存 localTZ,避免每秒从 storage 读取
  let _cachedLocalTZ = null;
  let _cachedAdded = null;
  let _cachedProfile = null;
  function _readCached() {
    const profile = Storage.get(Storage.KEYS.PROFILE) || {};
    _cachedProfile = profile;
    _cachedLocalTZ = profile.cityKey || Intl.DateTimeFormat().resolvedOptions().timeZone;
    _cachedAdded = Storage.get(Storage.KEYS.ADDED_CITIES, ['Asia/Shanghai']);
  }

  function tick() {
    if (!domCache) initDomCache();
    const now = new Date();
    // 缓存 profile/added cities(只读取一次,直到 add/remove 时刷新)
    if (!_cachedAdded) _readCached();

    // 本地
    updatePanel(domCache.local, getNow(now, _cachedLocalTZ));
    // 紫禁城
    updatePanel(domCache.forbidden, getNow(now, 'Asia/Shanghai'));
    // 已添加城市 - 每秒更新时分秒(轻量)
    const added = _cachedAdded.filter(tz => tz !== _cachedLocalTZ && tz !== 'Asia/Shanghai');
    if (added.length > 0) {
      const container = document.getElementById('clock-added-list');
      if (container) {
        // 仅更新已渲染节点的时间文本(不重建 DOM)
        const items = container.children;
        for (let i = 0; i < added.length && i < items.length; i++) {
          const tz = added[i];
          const data = getNow(now, tz);
          const timeEl = items[i].querySelector('.js-add-time');
          const shichenEl = items[i].querySelector('.js-add-shichen');
          const dateEl = items[i].querySelector('.js-add-date');
          if (timeEl) timeEl.textContent = data.time;
          if (shichenEl) shichenEl.textContent = data.shichen.name + '时 · ' + data.shichen.alias;
          // 日期每项都更新(避免跨日时只有首项正确)
          if (dateEl) dateEl.textContent = data.date;
        }
      }
    }

    // 触发订阅
    onTickCallbacks.forEach(cb => cb(now, getNow(now, _cachedLocalTZ), getNow(now, 'Asia/Shanghai')));
  }

  function addCity(tz) {
    const list = Storage.get(Storage.KEYS.ADDED_CITIES, ['Asia/Shanghai']);
    if (!list.includes(tz)) {
      list.push(tz);
      Storage.set(Storage.KEYS.ADDED_CITIES, list);
      _cachedAdded = list;
      Audio.click();
      // 城市变化:重渲染城市列表
      const now = new Date();
      const added = list.filter(t => t !== _cachedLocalTZ && t !== 'Asia/Shanghai');
      renderAddedCities(added, now);
      return true;
    }
    return false;
  }

  function removeCity(tz) {
    const list = Storage.get(Storage.KEYS.ADDED_CITIES, ['Asia/Shanghai']);
    const idx = list.indexOf(tz);
    if (idx >= 0) {
      list.splice(idx, 1);
      Storage.set(Storage.KEYS.ADDED_CITIES, list);
      _cachedAdded = list;
      const now = new Date();
      const added = list.filter(t => t !== _cachedLocalTZ && t !== 'Asia/Shanghai');
      renderAddedCities(added, now);
    }
  }

  function onTick(cb) { onTickCallbacks.push(cb); }

  function start() {
    initDomCache();
    // 首次读取并缓存 profile/added
    _readCached();
    // 首次渲染:完整构建已添加城市
    const now = new Date();
    const added = _cachedAdded.filter(tz => tz !== _cachedLocalTZ && tz !== 'Asia/Shanghai');
    renderAddedCities(added, now);
    tick();
    if (timer) clearInterval(timer);
    timer = setInterval(tick, 1000);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  return { start, stop, tick, addCity, removeCity, onTick, getNow };
})();
