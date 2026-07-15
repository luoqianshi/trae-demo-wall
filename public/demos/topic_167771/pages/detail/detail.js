import { getDetail } from '../../mock/mockApi.js';
import { entities } from '../../mock/mockData.js';
import { inferServiceType } from '../../utils/order.js';
import { navigateTo, navigateBack, getQueryParam } from '../../router.js';

let appData = {
  id: '',
  type: '',
  loading: true,
  errorMsg: '',
  entity: null,
  subtitle: '',
  isWorker: false,
  isEnterprise: false,
  typeLabel: '',
  phoneDisplay: '',
  qualImages: [],
  bizImages: [],
  hasQualImages: false,
  hasBizImages: false,
  ratingAvg: 0,
  ratingCount: 0,
  ratingPercent: 0,
  ratingText: '0.0',
  hasReviews: false,
  reviewsAll: [],
  reviewsShown: [],
  showAllReviews: false,
  hasRecommend: false,
  recommendList: []
};

function buildSubtitle(entity) {
  const d = entity.detail || {};
  if (entity.type === 'worker') {
    const area = d.serviceArea ? d.serviceArea : '';
    const years = typeof d.years === 'number' ? `${d.years}年经验` : '';
    return [area, years].filter(Boolean).join(' · ');
  }
  if (entity.type === 'enterprise') {
    const city = d.city || '';
    const scope = d.scope ? `主营：${d.scope}` : '';
    return [city, scope].filter(Boolean).join(' · ');
  }
  return '';
}

function normalize(str) {
  return String(str || '').toLowerCase().trim();
}

function overlapCount(a = [], b = []) {
  const setB = new Set((b || []).map(normalize));
  let n = 0;
  (a || []).forEach(x => { if (setB.has(normalize(x))) n += 1; });
  return n;
}

function getRecommendations(current, all, limit = 10) {
  const curKeywords = Array.isArray(current.keywords) ? current.keywords : [];
  const scored = (all || [])
    .filter(e => e && e.id !== current.id)
    .map(e => {
      const sameType = e.type === current.type ? 30 : 0;
      const ov = overlapCount(curKeywords, e.keywords || []);
      const score = sameType + ov * 10 + (e.hotScore || 0) * 0.01;
      const ratingAvg = typeof e.ratingAvg === 'number' ? e.ratingAvg : 0;
      const ratingCount = typeof e.ratingCount === 'number' ? e.ratingCount : 0;
      const ratingPercent = Math.max(0, Math.min(5, ratingAvg)) / 5 * 100;
      const ratingText = ratingAvg ? ratingAvg.toFixed(1) : '0.0';
      return { ...e, _recScore: score, ratingAvg, ratingCount, ratingPercent, ratingText };
    });

  scored.sort((a, b) => {
    if (b._recScore !== a._recScore) return b._recScore - a._recScore;
    if ((b.hotScore || 0) !== (a.hotScore || 0)) return (b.hotScore || 0) - (a.hotScore || 0);
    return (b.updatedAt || 0) - (a.updatedAt || 0);
  });

  return scored.slice(0, limit);
}

function renderWorkerSection() {
  const section = document.getElementById('worker-section');
  if (!section || !appData.isWorker || !appData.entity) return;
  
  const d = appData.entity.detail;
  const q = d.qualification;
  
  section.innerHTML = `
    <div class="card">
      <div class="card-title">基本信息</div>
      <div class="kv"><span class="k">姓名</span><span class="v">${d.name}</span></div>
      <div class="kv"><span class="k">工种</span><span class="v">${d.jobType}</span></div>
      <div class="kv"><span class="k">从业年限</span><span class="v">${d.years} 年</span></div>
      <div class="kv"><span class="k">服务范围</span><span class="v">${d.serviceArea}</span></div>
    </div>
    <div class="card">
      <div class="card-title">从业资格证信息</div>
      <div class="kv"><span class="k">证书名称</span><span class="v">${q.certName}</span></div>
      <div class="kv"><span class="k">证书编号</span><span class="v">${q.certNo}</span></div>
      <div class="kv"><span class="k">发证机构</span><span class="v">${q.issuer}</span></div>
      <div class="kv"><span class="k">有效期</span><span class="v">${q.validFrom} ~ ${q.validTo}</span></div>
      ${appData.hasQualImages ? `
        <div class="img-list">
          ${appData.qualImages.map((img, idx) => `
            <div class="img-item">
              <img class="img" src="${img}" alt="资质证书图片" />
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="verify-empty"><span>✓ 证书编号已留档核验（Demo 展示）</span></div>
      `}
    </div>
  `;
}

function renderEnterpriseSection() {
  const section = document.getElementById('enterprise-section');
  if (!section || !appData.isEnterprise || !appData.entity) return;
  
  const d = appData.entity.detail;
  const b = d.bizLicense;
  
  section.innerHTML = `
    <div class="card">
      <div class="card-title">企业信息</div>
      <div class="kv"><span class="k">企业名称</span><span class="v">${d.companyName}</span></div>
      <div class="kv"><span class="k">所在城市</span><span class="v">${d.city}</span></div>
      <div class="kv"><span class="k">地址</span><span class="v">${d.address}</span></div>
      <div class="kv"><span class="k">经营范围</span><span class="v">${d.scope}</span></div>
      ${d.website ? `<div class="kv"><span class="k">官网</span><span class="v">${d.website}</span></div>` : ''}
    </div>
    <div class="card">
      <div class="card-title">经营许可证信息</div>
      <div class="kv"><span class="k">许可证名称</span><span class="v">${b.licenseName}</span></div>
      <div class="kv"><span class="k">许可证号</span><span class="v">${b.licenseNo}</span></div>
      <div class="kv"><span class="k">发证机构</span><span class="v">${b.issuer}</span></div>
      <div class="kv"><span class="k">有效期</span><span class="v">${b.validFrom} ~ ${b.validTo}</span></div>
      ${appData.hasBizImages ? `
        <div class="img-list">
          ${appData.bizImages.map((img, idx) => `
            <div class="img-item">
              <img class="img" src="${img}" alt="企业许可证图片" />
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="verify-empty"><span>✓ 许可证编号已留档核验（Demo 展示）</span></div>
      `}
    </div>
  `;
}

function renderReviews() {
  const list = document.getElementById('review-list');
  const toggleBtn = document.getElementById('toggle-reviews-btn');
  
  if (!list) return;
  
  if (!appData.hasReviews) {
    list.innerHTML = '<div class="img-empty"><span>暂无评价</span></div>';
    if (toggleBtn) toggleBtn.style.display = 'none';
    return;
  }
  
  list.innerHTML = appData.reviewsShown.map(item => `
    <div class="review-item">
      <div class="review-head">
        <span class="review-user">${item.userName}</span>
        <span class="review-score">${item.score} 分</span>
        <span class="review-date">${item.createdAt}</span>
      </div>
      <div class="review-content"><span>${item.content}</span></div>
    </div>
  `).join('');
  
  if (toggleBtn) {
    toggleBtn.style.display = appData.reviewsAll.length > 3 ? 'block' : 'none';
    toggleBtn.textContent = appData.showAllReviews ? '收起评价' : '查看更多评价';
  }
}

function renderRecommendations() {
  const list = document.getElementById('recommend-list');
  if (!list) return;
  
  if (!appData.hasRecommend) {
    list.innerHTML = '<div class="img-empty"><span>暂无推荐</span></div>';
    return;
  }
  
  list.innerHTML = appData.recommendList.map(item => `
    <div class="rec-item" onclick="window.onTapRecommend('${item.id}', '${item.type}')" aria-label="查看推荐服务者${item.title}">
      <div class="rec-main">
        <span class="rec-title">${item.title}</span>
        <div class="tag ${item.type}">
          <span>${item.type === 'worker' ? '水电工人' : '水电企业'}</span>
        </div>
      </div>
      <div class="rec-sub">
        <span class="rating-num small">${item.ratingText}</span>
        <div class="stars small">
          <span class="stars-bg">★★★★★</span>
          <span class="stars-fg" style="width: ${item.ratingPercent}%;">★★★★★</span>
        </div>
        <span class="rating-count small">(${item.ratingCount})</span>
      </div>
    </div>
  `).join('');
}

function updateState() {
  const loadingEl = document.getElementById('loading-state');
  const errorEl = document.getElementById('error-state');
  const contentEl = document.getElementById('content-area');
  const errorText = document.getElementById('error-text');
  const navTitle = document.getElementById('nav-title');
  
  if (loadingEl) loadingEl.style.display = appData.loading ? 'block' : 'none';
  if (errorEl) errorEl.style.display = appData.errorMsg ? 'block' : 'none';
  if (contentEl) contentEl.style.display = (!appData.loading && !appData.errorMsg) ? 'block' : 'none';
  if (errorText) errorText.textContent = appData.errorMsg;
  
  if (!appData.loading && !appData.errorMsg && appData.entity) {
    const entity = appData.entity;
    
    if (navTitle) navTitle.textContent = appData.isWorker ? '工人详情' : '企业详情';
    
    document.getElementById('entity-name').textContent = entity.title;
    document.getElementById('entity-tag').className = `tag ${entity.type}`;
    document.getElementById('entity-tag').innerHTML = `<span>${appData.typeLabel}</span>`;
    document.getElementById('entity-subtitle').textContent = appData.subtitle;
    
    document.getElementById('rating-num').textContent = appData.ratingText;
    document.getElementById('stars-fg').style.width = `${appData.ratingPercent}%`;
    document.getElementById('rating-count').textContent = `共 ${appData.ratingCount} 条`;
    
    document.getElementById('phone-display').textContent = appData.phoneDisplay;
    
    const bookBtn = document.getElementById('book-btn');
    if (bookBtn) bookBtn.textContent = `预约${appData.isWorker ? '该师傅' : '该企业'}`;
    
    renderWorkerSection();
    renderEnterpriseSection();
    renderReviews();
    renderRecommendations();
  }
}

async function fetchDetail() {
  const { id, type } = appData;
  
  appData.loading = true;
  appData.errorMsg = '';
  appData.entity = null;
  appData.subtitle = '';
  appData.isWorker = false;
  appData.isEnterprise = false;
  appData.typeLabel = '';
  appData.phoneDisplay = '';
  appData.qualImages = [];
  appData.bizImages = [];
  appData.hasQualImages = false;
  appData.hasBizImages = false;
  appData.ratingAvg = 0;
  appData.ratingCount = 0;
  appData.ratingPercent = 0;
  appData.ratingText = '0.0';
  appData.hasReviews = false;
  appData.reviewsAll = [];
  appData.reviewsShown = [];
  appData.showAllReviews = false;
  appData.hasRecommend = false;
  appData.recommendList = [];
  updateState();
  
  try {
    const entity = await getDetail({ id, type });
    
    const isWorker = entity.type === 'worker';
    const isEnterprise = entity.type === 'enterprise';
    const typeLabel = isWorker ? '水电工人' : '水电企业';
    
    const phoneDisplay = isWorker ? (entity.detail?.phone || '') : (entity.detail?.servicePhone || '');
    
    let qualImages = [];
    if (isWorker && entity.detail && entity.detail.qualification && Array.isArray(entity.detail.qualification.images)) {
      qualImages = entity.detail.qualification.images;
    }
    
    let bizImages = [];
    if (isEnterprise && entity.detail && entity.detail.bizLicense && Array.isArray(entity.detail.bizLicense.images)) {
      bizImages = entity.detail.bizLicense.images;
    }
    
    const ratingAvg = typeof entity.ratingAvg === 'number' ? entity.ratingAvg : 0;
    const ratingCount = typeof entity.ratingCount === 'number' ? entity.ratingCount : 0;
    const ratingPercent = Math.max(0, Math.min(5, ratingAvg)) / 5 * 100;
    const ratingText = ratingAvg ? ratingAvg.toFixed(1) : '0.0';
    
    const reviewsAll = Array.isArray(entity.reviews) ? entity.reviews : [];
    const hasReviews = reviewsAll.length > 0;
    const showAllReviews = false;
    const reviewsShown = hasReviews ? reviewsAll.slice(0, 3) : [];
    
    const recommendList = getRecommendations(entity, entities, 10);
    const hasRecommend = recommendList.length > 0;
    
    appData = {
      ...appData,
      entity,
      subtitle: buildSubtitle(entity),
      isWorker,
      isEnterprise,
      typeLabel,
      phoneDisplay,
      qualImages,
      bizImages,
      hasQualImages: qualImages.length > 0,
      hasBizImages: bizImages.length > 0,
      ratingAvg,
      ratingCount,
      ratingPercent,
      ratingText,
      reviewsAll,
      hasReviews,
      showAllReviews,
      reviewsShown,
      recommendList,
      hasRecommend,
      loading: false
    };
    
    updateState();
  } catch (err) {
    appData.loading = false;
    appData.errorMsg = err?.message || '加载失败';
    updateState();
  }
}

function onBack() {
  navigateBack(1);
}

function onRetry() {
  fetchDetail();
}

function onCall() {
  const phone = appData.phoneDisplay;
  if (!phone) {
    alert('暂无电话信息');
    return;
  }
  window.location.href = `tel:${phone}`;
}

function onBook() {
  const entity = appData.entity;
  if (!entity) return;
  const serviceType = inferServiceType(entity);
  navigateTo(`/repair?serviceType=${encodeURIComponent(serviceType)}&providerId=${encodeURIComponent(entity.id)}&providerType=${encodeURIComponent(entity.type)}&providerName=${encodeURIComponent(entity.title)}`);
}

function onToggleReviews() {
  const showAll = !appData.showAllReviews;
  const all = appData.reviewsAll || [];
  appData.showAllReviews = showAll;
  appData.reviewsShown = showAll ? all : all.slice(0, 3);
  updateState();
}

function onTapRecommend(id, type) {
  if (!id || !type) return;
  navigateTo(`/detail?id=${encodeURIComponent(id)}&type=${encodeURIComponent(type)}`);
}

window.onBack = onBack;
window.onRetry = onRetry;
window.onCall = onCall;
window.onBook = onBook;
window.onToggleReviews = onToggleReviews;
window.onTapRecommend = onTapRecommend;

document.addEventListener('DOMContentLoaded', () => {
  appData.id = getQueryParam('id') || '';
  appData.type = getQueryParam('type') || '';
  fetchDetail();
});
