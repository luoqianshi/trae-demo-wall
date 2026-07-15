import { debounce } from '../../utils/debounce.js';
import { search, getFeaturedProviders } from '../../mock/mockApi.js';
import { BottomNavigation } from '../../components/bottom-navigation.js';
import { navigateTo } from '../../router.js';
import { hotSearchKeywords } from '../../mock/contentData.js';

const STORAGE_KEY = 'SEARCH_HISTORY';
const MAX_HISTORY = 10;

let appData = {
  query: '',
  mode: 'init',
  hotList: hotSearchKeywords,
  historyList: [],
  featuredProviders: [],
  results: [],
  loading: false,
  errorMsg: '',
  page: 1,
  pageSize: 20,
  hasMore: false
};

function renderHistory() {
  const chipsEl = document.getElementById('history-chips');
  const emptyHint = document.getElementById('empty-hint');
  const clearBtn = document.getElementById('clear-history-btn');
  
  if (appData.historyList.length === 0) {
    if (chipsEl) chipsEl.innerHTML = '';
    if (emptyHint) emptyHint.style.display = 'block';
    if (clearBtn) clearBtn.style.display = 'none';
  } else {
    if (emptyHint) emptyHint.style.display = 'none';
    if (clearBtn) clearBtn.style.display = 'block';
    if (chipsEl) {
      chipsEl.innerHTML = appData.historyList.map(kw => `
        <div class="chip">
          <span class="chip-text" onclick="window.onTapSuggest('${kw}')">${kw}</span>
          <span class="chip-del" onclick="window.onDeleteHistoryItem('${kw}')">×</span>
        </div>
      `).join('');
    }
  }
}

function renderHot() {
  const chipsEl = document.getElementById('hot-chips');
  if (!chipsEl) return;
  
  chipsEl.innerHTML = appData.hotList.map(kw => `
    <div class="chip hot">
      <span class="chip-text" onclick="window.onTapSuggest('${kw}')">${kw}</span>
    </div>
  `).join('');
}

function renderFeatured() {
  const state = document.getElementById('featured-state');
  const list = document.getElementById('featured-list');
  if (!state || !list) return;

  state.style.display = appData.featuredProviders.length ? 'none' : 'block';
  list.innerHTML = appData.featuredProviders.map(item => `
    <div class="item" onclick="window.onTapItem('${item.id}', '${item.type}')" aria-label="查看${item.title}详情">
      <div class="avatar ${item.type}"><span>${item.type === 'worker' ? '工' : '企'}</span></div>
      <div class="middle">
        <div class="row"><div class="title">${item.title}</div><div class="tag ${item.type}"><span>${item.type === 'worker' ? '水电工人' : '水电企业'}</span></div></div>
        <div class="snippet"><span>${item.matchedSnippet}</span></div>
        <div class="rating-row"><span class="rating-num">${item.ratingText}</span><div class="stars"><span class="stars-bg">★★★★★</span><span class="stars-fg" style="width: ${item.ratingPercent}%;">★★★★★</span></div><span class="rating-count">(${item.ratingCount})</span><span class="meta">${item.serviceMetaText}</span></div>
      </div>
      <div class="chev"><span>›</span></div>
    </div>
  `).join('');
}

async function loadFeatured() {
  try {
    appData.featuredProviders = await getFeaturedProviders();
    renderFeatured();
  } catch (error) {
    const state = document.getElementById('featured-state');
    if (state) state.textContent = error?.message || '推荐服务方加载失败';
  }
}

function renderResults() {
  const listEl = document.getElementById('result-list');
  if (!listEl) return;
  
  listEl.innerHTML = appData.results.map(item => `
    <div class="item" onclick="window.onTapItem('${item.id}', '${item.type}')" aria-label="查看${item.title}详情">
      <div class="avatar ${item.type}">
        <span>${item.type === 'worker' ? '工' : '企'}</span>
      </div>
      <div class="middle">
        <div class="row">
          <div class="title">
            ${item.highlightedTitleSegments?.map((seg, idx) => 
              `<span class="t ${seg.highlight ? 'hl' : ''}">${seg.text}</span>`
            ).join('') || item.title}
          </div>
          <div class="tag ${item.type}">
            <span>${item.type === 'worker' ? '水电工人' : '水电企业'}</span>
          </div>
        </div>
        ${item.matchedSnippet ? `<div class="snippet"><span>${item.matchedSnippet}</span></div>` : ''}
        <div class="rating-row">
          <span class="rating-num">${item.ratingText}</span>
          <div class="stars">
            <span class="stars-bg">★★★★★</span>
            <span class="stars-fg" style="width: ${item.ratingPercent}%;">★★★★★</span>
          </div>
          <span class="rating-count">(${item.ratingCount})</span>
          ${item.serviceMetaText ? `<span class="meta">${item.serviceMetaText}</span>` : ''}
        </div>
      </div>
      <div class="chev">
        <span>›</span>
      </div>
    </div>
  `).join('');
}

function renderMoreHint() {
  const moreEl = document.getElementById('more-hint');
  if (!moreEl) return;
  
  if (appData.results.length === 0 || appData.errorMsg) {
    moreEl.style.display = 'none';
    return;
  }
  
  moreEl.style.display = 'block';
  if (appData.loading && appData.page > 1) {
    moreEl.innerHTML = '<span>正在加载更多…</span>';
  } else if (appData.hasMore) {
    moreEl.innerHTML = '<span>上拉加载更多</span>';
  } else {
    moreEl.innerHTML = '<span>没有更多了</span>';
  }
}

function updateState() {
  const initView = document.getElementById('init-view');
  const resultView = document.getElementById('result-view');
  const loadingState = document.getElementById('loading-state');
  const errorState = document.getElementById('error-state');
  const emptyState = document.getElementById('empty-state');
  const errorText = document.getElementById('error-text');
  const clearBtn = document.getElementById('clear-btn');
  
  if (initView) initView.style.display = appData.mode === 'init' ? 'block' : 'none';
  if (resultView) resultView.style.display = appData.mode === 'result' ? 'block' : 'none';
  
  if (loadingState) loadingState.style.display = (appData.loading && appData.page === 1) ? 'block' : 'none';
  if (errorState) errorState.style.display = appData.errorMsg ? 'block' : 'none';
  if (emptyState) emptyState.style.display = (!appData.loading && !appData.errorMsg && appData.results.length === 0) ? 'block' : 'none';
  if (errorText) errorText.textContent = appData.errorMsg;
  if (clearBtn) clearBtn.style.display = appData.query ? 'block' : 'none';
  
  if (appData.mode === 'init') {
    renderHistory();
    renderHot();
  } else {
    renderResults();
    renderMoreHint();
  }
}

function loadHistory() {
  try {
    const list = localStorage.getItem(STORAGE_KEY);
    appData.historyList = list ? JSON.parse(list) : [];
    updateState();
  } catch (e) {
    appData.historyList = [];
    updateState();
  }
}

function addHistory(keyword) {
  const kw = String(keyword || '').trim();
  if (!kw) return;
  
  const current = [...appData.historyList];
  const lower = kw.toLowerCase();
  const filtered = current.filter(x => String(x).toLowerCase() !== lower);
  filtered.unshift(kw);
  const next = filtered.slice(0, MAX_HISTORY);
  
  appData.historyList = next;
  updateState();
  
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (e) {}
}

async function doSearch(q, options = { reset: true, writeHistory: false }) {
  const query = String(q || '').trim();
  if (!query) return;
  
  const reset = !!options.reset;
  const nextPage = reset ? 1 : (appData.page + 1);
  
  appData.mode = 'result';
  appData.loading = true;
  appData.errorMsg = '';
  appData.page = nextPage;
  updateState();
  
  try {
    const res = await search({
      q: query,
      page: nextPage,
      pageSize: appData.pageSize
    });
    
    const items = Array.isArray(res.items) ? res.items : [];
    const newResults = reset ? items : [...appData.results, ...items];
    
    appData.results = newResults;
    appData.hasMore = !!res.hasMore;
    appData.loading = false;
    updateState();
    
    if (options.writeHistory) addHistory(query);
  } catch (err) {
    appData.loading = false;
    appData.errorMsg = err?.message || '搜索失败，请重试';
    updateState();
  }
}

let _debouncedSearch;

function onInput(e) {
  const q = (e.target.value || '').trim();
  appData.query = q;
  
  if (!q) {
    appData.mode = 'init';
    appData.results = [];
    appData.loading = false;
    appData.errorMsg = '';
    appData.page = 1;
    appData.hasMore = false;
    updateState();
    return;
  }
  
  appData.mode = 'result';
  appData.errorMsg = '';
  updateState();
  _debouncedSearch(q);
}

function onConfirm() {
  const q = (appData.query || '').trim();
  if (!q) return;
  doSearch(q, { reset: true, writeHistory: true });
}

function onClear() {
  const input = document.getElementById('search-input');
  if (input) input.value = '';
  
  appData.query = '';
  appData.mode = 'init';
  appData.results = [];
  appData.loading = false;
  appData.errorMsg = '';
  appData.page = 1;
  appData.hasMore = false;
  updateState();
}

function onRetry() {
  const q = (appData.query || '').trim();
  if (!q) return;
  doSearch(q, { reset: true, writeHistory: false });
}

function onTapSuggest(kw) {
  if (!kw) return;
  const input = document.getElementById('search-input');
  if (input) input.value = kw;
  
  appData.query = kw;
  appData.mode = 'result';
  updateState();
  doSearch(kw, { reset: true, writeHistory: true });
}

function onTapItem(id, type) {
  if (!id || !type) return;
  
  const q = (appData.query || '').trim();
  if (q) addHistory(q);
  
  navigateTo(`/detail?id=${encodeURIComponent(id)}&type=${encodeURIComponent(type)}`);
}

function onDeleteHistoryItem(kw) {
  if (!kw) return;
  
  const next = appData.historyList.filter(x => x !== kw);
  appData.historyList = next;
  updateState();
  
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (e) {}
}

function onClearHistory() {
  appData.historyList = [];
  updateState();
  
  try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
}

window.onInput = onInput;
window.onConfirm = onConfirm;
window.onClear = onClear;
window.onRetry = onRetry;
window.onTapSuggest = onTapSuggest;
window.onTapItem = onTapItem;
window.onDeleteHistoryItem = onDeleteHistoryItem;
window.onClearHistory = onClearHistory;

document.addEventListener('DOMContentLoaded', () => {
  new BottomNavigation(document.getElementById('bottom-navigation'), 'workers');
  loadHistory();
  loadFeatured();
  
  _debouncedSearch = debounce((q) => {
    doSearch(q, { reset: true, writeHistory: false });
  }, 300);
  
  const input = document.getElementById('search-input');
  if (input) {
    input.addEventListener('input', onInput);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    });
  }
  
  let pageHeight = 0;
  window.addEventListener('scroll', () => {
    if (appData.mode !== 'result') return;
    if (appData.loading) return;
    if (!appData.hasMore) return;
    
    const scrollTop = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    if (scrollTop + windowHeight >= documentHeight - 100) {
      const q = (appData.query || '').trim();
      doSearch(q, { reset: false, writeHistory: false });
    }
  });
});
