import { getHomeData, getOrderList } from '../../mock/mockApi.js';
import { NavigationBar } from '../../components/navigation-bar.js';
import { BottomNavigation } from '../../components/bottom-navigation.js';
import { navigateTo } from '../../router.js';
import { escapeHtml } from '../../utils/escapeHtml.js';

function formatPrice(estimate = {}) {
  return estimate.laborMin == null ? '检测后报价' : `¥${estimate.laborMin}–${estimate.laborMax}`;
}

function renderGuarantees(guarantees) {
  document.getElementById('guarantee-list').innerHTML = guarantees.map(item => `
    <div class="guarantee-item">
      <span class="guarantee-mark" aria-hidden="true"><i></i></span>
      <span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.description)}</small></span>
    </div>
  `).join('');
}

function renderServices(services) {
  const list = document.getElementById('service-list');
  list.innerHTML = services.map(item => `
    <button class="service-card" data-service-id="${escapeHtml(item.id)}" aria-label="报修：${escapeHtml(item.name)}">
      <span class="service-icon" aria-hidden="true">${escapeHtml(item.icon)}</span>
      <span><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.summary)}</small></span>
    </button>
  `).join('');
  list.querySelectorAll('.service-card').forEach(card => card.addEventListener('click', () => {
    navigateTo(`/repair?serviceType=${encodeURIComponent(card.dataset.serviceId)}`);
  }));
}

function renderProviders(providers) {
  const list = document.getElementById('provider-list');
  list.innerHTML = providers.map(item => `
    <button class="provider-card" data-provider-id="${escapeHtml(item.id)}" data-provider-type="${escapeHtml(item.type)}" aria-label="查看${escapeHtml(item.title)}详情">
      <span class="provider-avatar" aria-hidden="true">${escapeHtml(item.avatarText)}</span>
      <span class="provider-copy"><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail?.jobType || '认证维修师傅')}</small><em>${escapeHtml(item.ratingAvg.toFixed(1))} 分 · ${escapeHtml(item.distanceKm.toFixed(1))}km</em></span>
    </button>
  `).join('');
  list.querySelectorAll('.provider-card').forEach(card => card.addEventListener('click', () => {
    navigateTo(`/detail?id=${encodeURIComponent(card.dataset.providerId)}&type=${encodeURIComponent(card.dataset.providerType)}`);
  }));
}

function renderRecentOrder(item) {
  const container = document.getElementById('recent-order');
  const allOrders = document.getElementById('all-orders');
  if (!item) {
    allOrders.hidden = true;
    container.innerHTML = `
      <div class="empty-order"><span class="empty-symbol" aria-hidden="true"><i></i></span><strong>还没有报修订单</strong><small>选择故障类型，先查看透明预估价。</small><button id="go-services">立即报修</button></div>
    `;
    document.getElementById('go-services').addEventListener('click', () => navigateTo('/services'));
    return;
  }
  allOrders.hidden = false;
  const serviceName = escapeHtml(item.service.name);
  const statusLabel = escapeHtml(item.statusLabel);
  container.innerHTML = `
    <button class="recent-order" aria-label="查看${serviceName}订单，当前${statusLabel}">
      <span class="order-topline"><strong>${serviceName}</strong><em>${statusLabel}</em></span>
      <span class="provider-name">${escapeHtml(item.provider ? item.provider.title : '平台匹配中')}</span>
      <span class="order-meta"><small>${escapeHtml(item.order.createdAt)}</small><strong>${escapeHtml(formatPrice(item.order.priceEstimate))}</strong></span>
    </button>
  `;
  container.querySelector('.recent-order').addEventListener('click', () => navigateTo(`/order?id=${encodeURIComponent(item.order.id)}`));
}

async function loadHome() {
  const state = document.getElementById('home-state');
  const content = document.getElementById('home-content');
  try {
    const [home, orders] = await Promise.all([getHomeData(), getOrderList()]);
    renderServices(home.services);
    renderProviders(home.recommendedProviders);
    renderGuarantees(home.guarantees);
    renderRecentOrder(orders[0]);
    state.hidden = true;
    content.hidden = false;
  } catch (error) {
    state.textContent = error.message || '首页加载失败，请刷新重试';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new NavigationBar(document.getElementById('navigation-bar'), { title: '水电到家', back: false, background: '#FFFDF9' });
  new BottomNavigation(document.getElementById('bottom-navigation'), 'home');
  document.getElementById('emergency-card').addEventListener('click', () => navigateTo('/repair?serviceType=pipe_leak'));
  document.getElementById('all-services').addEventListener('click', () => navigateTo('/services'));
  document.getElementById('all-providers').addEventListener('click', () => navigateTo('/search'));
  document.getElementById('all-orders').addEventListener('click', () => navigateTo('/orders'));
  loadHome();
});
