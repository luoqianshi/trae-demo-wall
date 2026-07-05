// ColorFlow v5 - Theme + Extract + Save 三系统 + Bridge

// ============================================================
// ========== THEME SYSTEM（设计层） ==========
// ============================================================

const FIVE_COLORS = [
  { name: '极简白', colors: { bg: '#ffffff', text: '#374151', heading: '#111827', button: '#2563eb', accent: '#3b82f6' }},
  { name: '深邃黑', colors: { bg: '#111827', text: '#d1d5db', heading: '#f9fafb', button: '#3b82f6', accent: '#60a5fa' }},
  { name: '暖调橙', colors: { bg: '#fffbeb', text: '#78350f', heading: '#92400e', button: '#f59e0b', accent: '#fbbf24' }},
  { name: '森林绿', colors: { bg: '#f0fdf4', text: '#166534', heading: '#14532d', button: '#22c55e', accent: '#4ade80' }},
  { name: '星空紫', colors: { bg: '#faf5ff', text: '#6b21a8', heading: '#581c87', button: '#a855f7', accent: '#c084fc' }},
  { name: '海洋蓝', colors: { bg: '#eff6ff', text: '#1e40af', heading: '#1e3a8a', button: '#3b82f6', accent: '#60a5fa' }},
  { name: '玫瑰红', colors: { bg: '#fff1f2', text: '#9f1239', heading: '#881337', button: '#f43f5e', accent: '#fb7185' }},
  { name: '莫兰迪', colors: { bg: '#f5f0eb', text: '#57534e', heading: '#44403c', button: '#a8a29e', accent: '#d6d3d1' }}
];

const THREE_COLORS = [
  { name: '海青',     colors: { primary: '#438797', bg: '#D8EEF4', text: '#1a3a42' }},
  { name: '薄荷蓝',   colors: { primary: '#006D77', bg: '#EDF6F9', text: '#1a3a3d' }},
  { name: '天空蓝',   colors: { primary: '#A3D5FF', bg: '#D9F0FF', text: '#1a3a5c' }},
  { name: '深海蓝',   colors: { primary: '#064789', bg: '#EBF2FA', text: '#1a2d45' }},
  { name: '紫蓝灰',   colors: { primary: '#A19FDB', bg: '#CEDEF0', text: '#2d2d4a' }},
  { name: '翡翠',     colors: { primary: '#37897B', bg: '#E8F5F2', text: '#1a3530' }},
  { name: '天际蓝',   colors: { primary: '#1E95D4', bg: '#E6F4FB', text: '#0f2e45' }},
  { name: '藏蓝金',   colors: { primary: '#465173', bg: '#E8EAF0', text: '#232940' }},
  { name: '深蓝橙',   colors: { primary: '#FE7F2D', bg: '#F5F0EA', text: '#2d2218' }},
  { name: '三原色',   colors: { primary: '#EDAE49', bg: '#FDF6EC', text: '#3d2e15' }},
  { name: '海蓝红',   colors: { primary: '#084C61', bg: '#EBF2F5', text: '#1a2a30' }},
  { name: '高级暖',   colors: { primary: '#DD6E42', bg: '#F5EEE4', text: '#3d2820' }},
  { name: '梦幻紫',   colors: { primary: '#9381FF', bg: '#F8F7FF', text: '#2d2666' }},
  { name: '蜜桃',     colors: { primary: '#F3B391', bg: '#FEFADC', text: '#4a3020' }},
  { name: '自然绿',   colors: { primary: '#C8D5B9', bg: '#FAF3DD', text: '#2d3320' }},
  { name: '暖棕',     colors: { primary: '#CB997E', bg: '#FFE8D6', text: '#3d2a1e' }},
  { name: '海蓝红2',  colors: { primary: '#DB504A', bg: '#F5EDED', text: '#3d1a18' }},
  { name: '亮红黄',   colors: { primary: '#D00000', bg: '#FFF8E6', text: '#3d0a00' }},
  { name: '红蓝黄',   colors: { primary: '#FE4A49', bg: '#F5FDFE', text: '#3d1215' }},
  { name: '玫红黄',   colors: { primary: '#FE218B', bg: '#FFF0F5', text: '#3d0a28' }},
  { name: '玫红粉',   colors: { primary: '#FA255E', bg: '#FDF0F3', text: '#3d0a1a' }},
  { name: '珊瑚粉',   colors: { primary: '#F38A88', bg: '#FDF0F0', text: '#3d1a1a' }},
  { name: '暖灰棕',   colors: { primary: '#6A5853', bg: '#F5F0EE', text: '#332a28' }},
  { name: '粉绿米',   colors: { primary: '#EDA4C8', bg: '#FDF5F8', text: '#3d2030' }},
  { name: '蓝黄蓝',   colors: { primary: '#9AC1F0', bg: '#F0F5FC', text: '#1a2d5c' }},
  { name: '荧光三色', colors: { primary: '#F0E722', bg: '#FDFDE6', text: '#3d3a0a' }},
  { name: '紫蓝金',   colors: { primary: '#1E3094', bg: '#EAECF8', text: '#0f184a' }},
  { name: '绿红黄',   colors: { primary: '#238F51', bg: '#EAF5EE', text: '#122d1a' }},
  { name: '红蓝橙',   colors: { primary: '#F92843', bg: '#FDF0F0', text: '#3d0a15' }},
  { name: '玫红粉2',  colors: { primary: '#C6979C', bg: '#FDF5F6', text: '#3d2025' }},
  { name: '蓝红金',   colors: { primary: '#0176BB', bg: '#EAF2F8', text: '#0a2a40' }},
  { name: '红橙金',   colors: { primary: '#D9302C', bg: '#FDF0EC', text: '#3d0a08' }},
  { name: '灰蓝红',   colors: { primary: '#314246', bg: '#EDF0F2', text: '#1a2225' }},
  { name: '杏粉蓝',   colors: { primary: '#FBBE85', bg: '#FDF6EE', text: '#3d2a18' }},
  { name: '黄红米',   colors: { primary: '#F4D474', bg: '#FEF8EC', text: '#3d3515' }},
  { name: '杏橙红',   colors: { primary: '#F2BC93', bg: '#FDF6EE', text: '#3d2815' }},
  { name: '橙红金',   colors: { primary: '#FB8022', bg: '#FDF3EC', text: '#3d200a' }},
  { name: '绿金棕',   colors: { primary: '#398D5D', bg: '#EAF2EC', text: '#1a2a18' }},
  { name: '紫粉绿',   colors: { primary: '#64395F', bg: '#F5EDF4', text: '#301a2d' }},
  { name: '金灰棕',   colors: { primary: '#DCCA60', bg: '#FAF7EC', text: '#3d3515' }},
  { name: '黄蓝粉',   colors: { primary: '#F3E49B', bg: '#FDFCEC', text: '#3d3818' }},
  { name: '蓝黄米',   colors: { primary: '#40BACF', bg: '#EBF8FA', text: '#0a3d42' }},
  { name: '橙绿米',   colors: { primary: '#ED7937', bg: '#FDF3EC', text: '#3d1a0a' }},
  { name: '米灰金',   colors: { primary: '#D1B687', bg: '#F5F2EC', text: '#3d3020' }},
  { name: '米粉紫',   colors: { primary: '#E79897', bg: '#FDF0F0', text: '#3d1a1a' }},
  { name: '杏绿米',   colors: { primary: '#EBBBAB', bg: '#FDF6F4', text: '#3d2820' }},
  { name: '粉杏绿',   colors: { primary: '#E8BBC3', bg: '#FDF5F5', text: '#3d2022' }},
  { name: '杏米灰',   colors: { primary: '#EABEB4', bg: '#FDF6F4', text: '#3d2820' }},
  { name: '青深金',   colors: { primary: '#5CDFD8', bg: '#EAFAFA', text: '#0a3d3a' }},
  { name: '蓝青橙',   colors: { primary: '#3D8C95', bg: '#EAF2F4', text: '#0a2a2d' }},
  { name: '绿深绿',   colors: { primary: '#89B56B', bg: '#F2F8EE', text: '#1a2d15' }},
  { name: '杏绿金',   colors: { primary: '#D38166', bg: '#FDF2EE', text: '#3d1a15' }},
  { name: '灰绿金',   colors: { primary: '#8AA899', bg: '#F2F5F2', text: '#1a2d22' }},
  { name: '青黄米',   colors: { primary: '#55B9AB', bg: '#EAFAF8', text: '#0a3d35' }},
  { name: '米灰金2',  colors: { primary: '#D2B88B', bg: '#F5F2EC', text: '#3d3020' }},
  { name: '绿黄橙',   colors: { primary: '#66D47E', bg: '#EAFDF0', text: '#0a3d15' }},
  { name: '蓝青',     colors: { primary: '#38A288', bg: '#EAF5F0', text: '#0a3025' }},
  { name: '深绿',     colors: { primary: '#56642A', bg: '#F0F2E8', text: '#2d330a' }}
];

// ============================================================
// ========== 状态 ==========
// ============================================================
let currentMode = 'five';
let activeIdx = 0;
let currentColors = {};
let lastExtractResult = null;

// ============================================================
// ========== 初始化 ==========
// ============================================================
document.addEventListener('DOMContentLoaded', async () => {
  await restoreState();
  bindTabs();
  bindThemePanel();
  bindExtractPanel();
  renderThemes();
  renderColors();
  checkAppliedStatus();
  renderSavedList();
});

// ============================================================
// ========== 标签导航 ==========
// ============================================================
function bindTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('panel' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1)).classList.add('active');
    });
  });
}

// ============================================================
// ========== 持久化 ==========
// ============================================================
async function restoreState() {
  return new Promise(resolve => {
    chrome.storage.local.get(['cfMode', 'cfIdx', 'cfColors'], data => {
      if (data.cfMode) currentMode = data.cfMode;
      if (typeof data.cfIdx === 'number') activeIdx = data.cfIdx;
      if (data.cfColors) currentColors = data.cfColors;
      updateModeUI();
      resolve();
    });
  });
}

function persistState() {
  chrome.storage.local.set({ cfMode: currentMode, cfIdx: activeIdx, cfColors: currentColors });
}

// ============================================================
// ========== Theme System ==========
// ============================================================
function getThemeList() { return currentMode === 'three' ? THREE_COLORS : FIVE_COLORS; }

function mapThreeToFive(c) {
  return { bg: c.bg, text: c.text, heading: c.primary, button: c.primary, accent: c.primary };
}

function setMode(mode) {
  if (currentMode === mode) return;
  currentMode = mode;
  activeIdx = 0;
  const list = getThemeList();
  currentColors = mode === 'three' ? mapThreeToFive(list[0].colors) : { ...list[0].colors };
  persistState();
  updateModeUI();
  renderThemes();
  renderColors();
}

function updateModeUI() {
  document.querySelectorAll('.mode-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === currentMode);
  });
}

function applyThemeManual(colors) {
  currentColors = colors;
  persistState();
  sendMsg({ type: 'APPLY_COLORS', colors }, '已应用', '已应用到当前网站');
}

function bindThemePanel() {
  document.getElementById('modeThree').addEventListener('click', () => setMode('three'));
  document.getElementById('modeFive').addEventListener('click', () => setMode('five'));

  document.getElementById('themes').addEventListener('click', e => {
    const item = e.target.closest('.theme-item');
    if (!item) return;
    activeIdx = +item.dataset.idx;
    const t = getThemeList()[activeIdx];
    currentColors = currentMode === 'three' ? mapThreeToFive(t.colors) : { ...t.colors };
    persistState();
    renderThemes();
    renderColors();
  });

  document.getElementById('colors').addEventListener('click', e => {
    const item = e.target.closest('.color-item');
    if (!item) return;
    copyText(currentColors[item.dataset.key]);
    showToast('已复制');
  });

  document.getElementById('btnRandom').addEventListener('click', () => {
    const rand = () => '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    if (currentMode === 'three') currentColors = mapThreeToFive({ primary: rand(), bg: rand(), text: rand() });
    else currentColors = { bg: rand(), text: rand(), heading: rand(), button: rand(), accent: rand() };
    activeIdx = -1;
    persistState(); renderThemes(); renderColors();
  });

  document.getElementById('btnCopy').addEventListener('click', () => {
    copyText(Object.entries(currentColors).map(([k, v]) => `${k}: ${v}`).join('\n'));
    showToast('已复制全部');
  });

  document.getElementById('btnApply').addEventListener('click', () => {
    persistState();
    sendMsg({ type: 'APPLY_COLORS', colors: currentColors }, '已应用', '已应用到当前网站');
  });

  document.getElementById('btnRevert').addEventListener('click', () => {
    sendMsg({ type: 'REVERT_COLORS' }, '已撤销', null, true);
  });

  // Bridge: 从提取生成主题
  document.getElementById('btnFromExtract').addEventListener('click', () => {
    if (!lastExtractResult) {
      showToast('请先在「提取」面板执行提取');
      return;
    }
    generateThemeFromExtract(lastExtractResult);
  });
}

// ============================================================
// ========== Extract System（数据采集） ==========
// ============================================================
function bindExtractPanel() {
  document.getElementById('btnExtract').addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { type: 'EXTRACT_PAGE' }, response => {
        if (chrome.runtime.lastError || !response || !response.result) {
          showToast('提取失败');
          return;
        }
        lastExtractResult = response.result;
        renderExtractResult(response.result);
      });
    });
  });

  document.getElementById('btnGenTheme').addEventListener('click', () => {
    if (!lastExtractResult) return;
    generateThemeFromExtract(lastExtractResult);
  });

  document.getElementById('btnSaveExtract').addEventListener('click', () => {
    if (!lastExtractResult) return;
    saveExtract(lastExtractResult);
    showToast('已保存到「我的」');
  });
}

function renderExtractResult(result) {
  document.getElementById('extractResult').style.display = 'block';

  // 颜色分类展示
  const colorHTML = result.colors.slice(0, 10).map(c => `
    <div class="color-entry">
      <div class="color-swatch-sm" style="background:${c.value}"></div>
      <div class="color-info">
        <span class="color-type">${typeLabel(c.type)}</span>
        <span class="color-hex">${c.value}</span>
      </div>
      <span class="color-weight">${c.weight.toFixed(2)}</span>
    </div>
  `).join('');
  document.getElementById('colorEntries').innerHTML = colorHTML || '<div style="font-size:11px;color:#888;padding:4px">未检测到颜色</div>';

  // 图标分类展示
  const iconHTML = result.icons.slice(0, 8).map(ic => `
    <div class="icon-entry">
      <span class="icon-type">${ic.type}</span>
      <span class="icon-source">${ic.source}</span>
      <span class="icon-value" title="${escapeHtml(ic.value)}">${escapeHtml(ic.value)}</span>
    </div>
  `).join('');
  document.getElementById('iconEntries').innerHTML = iconHTML || '<div style="font-size:11px;color:#888;padding:4px">未检测到图标</div>';
}

function typeLabel(t) {
  return { background: '背景', text: '文字', accent: '强调', border: '边框', primary: '主色' }[t] || t;
}

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ============================================================
// ========== Bridge：ExtractResult → Theme ==========
// ============================================================
function generateThemeFromExtract(result) {
  if (!result || !result.colors || result.colors.length === 0) {
    showToast('无提取数据');
    return;
  }

  const byType = {};
  result.colors.forEach(c => {
    if (!byType[c.type]) byType[c.type] = [];
    byType[c.type].push(c);
  });

  const getBest = type => byType[type]?.sort((a, b) => b.weight - a.weight)[0]?.value;

  const bg = getBest('background') || '#ffffff';
  const text = getBest('text') || '#333333';
  const accent = getBest('accent') || getBest('border') || '#3b82f6';
  const heading = darkenHex(text, 30);
  const button = accent;

  currentColors = { bg, text, heading, button, accent };
  currentMode = 'five';
  activeIdx = -1;
  persistState();
  updateModeUI();
  renderThemes();
  renderColors();
  sendMsg({ type: 'APPLY_COLORS', colors: currentColors }, '已生成并应用', null);
}

function darkenHex(hex, pct) {
  if (!hex || hex.length < 7) return hex;
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);
  r = Math.max(0, Math.round(r * (1 - pct / 100)));
  g = Math.max(0, Math.round(g * (1 - pct / 100)));
  b = Math.max(0, Math.round(b * (1 - pct / 100)));
  return '#' + [r, g, b].map(c => c.toString(16).padStart(2, '0')).join('');
}

// ============================================================
// ========== Save System（存储层，按 domain 维度） ==========
// ============================================================
function normalizeDomain(url) {
  try {
    const u = new URL(url);
    let host = u.hostname;
    // 归一化：www. / m. / 子域统一
    host = host.replace(/^(www\.|m\.|mobile\.)/, '');
    return host;
  } catch { return 'unknown'; }
}

async function saveExtract(extractResult) {
  const domain = normalizeDomain(extractResult.url);
  const saved = await getSavedExtracts();
  saved[domain] = {
    url: extractResult.url,
    domain,
    colors: extractResult.colors,
    icons: extractResult.icons,
    timestamp: extractResult.timestamp,
    savedAt: Date.now()
  };
  chrome.storage.local.set({ cfSavedExtracts: saved });
  renderSavedList();
}

function getSavedExtracts() {
  return new Promise(resolve => {
    chrome.storage.local.get(['cfSavedExtracts'], data => resolve(data.cfSavedExtracts || {}));
  });
}

async function deleteExtract(domain) {
  const saved = await getSavedExtracts();
  delete saved[domain];
  chrome.storage.local.set({ cfSavedExtracts: saved });
  renderSavedList();
}

async function renderSavedList() {
  const saved = await getSavedExtracts();
  const domains = Object.keys(saved);
  const el = document.getElementById('savedList');
  if (domains.length === 0) {
    el.innerHTML = '<div class="empty-state">暂无保存的提取结果<br><span class="hint">在「提取」面板中保存网站配色</span></div>';
    return;
  }
  el.innerHTML = domains.map(domain => {
    const entry = saved[domain];
    const topColors = entry.colors.slice(0, 3);
    const dots = topColors.map(c => `<div class="saved-dot" style="background:${c.value}"></div>`).join('');
    const colorCount = entry.colors.length;
    const iconCount = entry.icons?.length || 0;
    return `
      <div class="saved-item">
        <div class="saved-dots">${dots}</div>
        <div class="saved-info">
          <div class="saved-domain">${domain}</div>
          <div class="saved-meta">${colorCount} 色 · ${iconCount} 图标</div>
        </div>
        <div class="saved-actions">
          <button class="saved-btn apply" data-domain="${domain}" title="应用">▶</button>
          <button class="saved-btn del" data-domain="${domain}" title="删除">✕</button>
        </div>
      </div>`;
  }).join('');

  el.querySelectorAll('.saved-btn.apply').forEach(btn => {
    btn.addEventListener('click', async () => {
      const d = btn.dataset.domain;
      const saved = await getSavedExtracts();
      if (!saved[d]) return;
      lastExtractResult = saved[d];
      generateThemeFromExtract(saved[d]);
    });
  });

  el.querySelectorAll('.saved-btn.del').forEach(btn => {
    btn.addEventListener('click', async () => {
      await deleteExtract(btn.dataset.domain);
      showToast('已删除');
    });
  });
}

// ============================================================
// ========== 渲染 ==========
// ============================================================
function renderThemes() {
  const list = getThemeList();
  document.getElementById('themes').innerHTML = list.map((t, i) => {
    const dots = currentMode === 'three'
      ? `<div class="theme-dot" style="background:${t.colors.primary}"></div>
         <div class="theme-dot" style="background:${t.colors.bg};border:1px solid #3a3a3a"></div>
         <div class="theme-dot" style="background:${t.colors.text}"></div>`
      : `<div class="theme-dot" style="background:${t.colors.bg};border:1px solid #3a3a3a"></div>
         <div class="theme-dot" style="background:${t.colors.heading}"></div>
         <div class="theme-dot" style="background:${t.colors.button}"></div>`;
    return `
      <div class="theme-item ${i === activeIdx ? 'active' : ''}" data-idx="${i}">
        <div class="theme-dots">${dots}</div>
        <span class="theme-name">${t.name}</span>
        <span class="theme-check">✓</span>
      </div>`;
  }).join('');
}

function renderColors() {
  const labels = { bg: '背景', text: '正文', heading: '标题', button: '按钮', accent: '强调' };
  document.getElementById('colors').innerHTML = Object.entries(currentColors).map(([k, v]) => `
    <div class="color-item" data-key="${k}">
      <div class="color-swatch" style="background:${v}"></div>
      <div class="color-label">${labels[k] || k}</div>
      <div class="color-value">${v}</div>
    </div>`).join('');
}

// ============================================================
// ========== 消息通信 ==========
// ============================================================
function sendMsg(payload, okMsg, statusMsg, isRevert) {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, payload, resp => {
      if (chrome.runtime.lastError) {
        chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, files: ['content.js'] })
          .then(() => chrome.tabs.sendMessage(tabs[0].id, payload, r2 => {
            if (r2?.success) { showToast(okMsg); if (statusMsg) showStatus(statusMsg); if (isRevert) hideStatus(); }
          }))
          .catch(() => showToast('操作失败'));
      } else if (resp?.success) {
        showToast(okMsg); if (statusMsg) showStatus(statusMsg); if (isRevert) hideStatus();
      }
    });
  });
}

function checkAppliedStatus() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    if (!tabs[0]) return;
    chrome.tabs.sendMessage(tabs[0].id, { type: 'GET_STATUS' }, resp => {
      if (resp?.hasAppliedColors) showStatus('当前网站已应用配色');
    });
  });
}

// ============================================================
// ========== 工具 ==========
// ============================================================
function copyText(t) {
  navigator.clipboard.writeText(t).catch(() => {
    const ta = document.createElement('textarea'); ta.value = t;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta);
  });
}
function showToast(m) { const t = document.getElementById('toast'); t.textContent = m; t.classList.add('show'); setTimeout(() => t.classList.remove('show'), 1500); }
function showStatus(m) { const b = document.getElementById('statusBar'); b.textContent = m; b.classList.add('show'); }
function hideStatus() { document.getElementById('statusBar').classList.remove('show'); }
