import { NavigationBar } from '../../components/navigation-bar.js';
import { BottomNavigation } from '../../components/bottom-navigation.js';
import { getOrderList } from '../../mock/mockApi.js';
import { navigateTo } from '../../router.js';
import { escapeHtml } from '../../utils/escapeHtml.js';

function priceText(estimate = {}) {
  return estimate.laborMin == null ? '检测后报价' : `¥${estimate.laborMin}–${estimate.laborMax}`;
}

async function loadOrders() {
  const state = document.getElementById('orders-state');
  const list = document.getElementById('order-list');
  state.hidden = false;
  state.textContent = '正在读取本地订单…';
  try {
    const items = await getOrderList();
    if (!items.length) {
      state.innerHTML = `<div class="empty-receipt" aria-hidden="true"><i></i><i></i></div><strong>还没有报修记录</strong><span>完成一次模拟报修后，订单进度会保存在这里。</span><button id="go-repair">去报修</button>`;
      document.getElementById('go-repair').addEventListener('click', () => navigateTo('/services'));
      list.innerHTML = '';
      return;
    }
    state.hidden = true;
    list.innerHTML = items.map(item => {
      const serviceName = escapeHtml(item.service.name);
      const statusLabel = escapeHtml(item.statusLabel);
      const orderId = escapeHtml(item.order.id);
      const providerName = escapeHtml(item.provider ? item.provider.title : '平台匹配中');
      return `
        <button class="order-card" data-id="${orderId}" aria-label="查看${serviceName}订单，当前${statusLabel}">
          <span class="order-topline"><span><strong>${serviceName}</strong><small>${orderId}</small></span><em>${statusLabel}</em></span>
          <span class="order-issue">${escapeHtml(item.order.issueDescription)}</span>
          <span class="provider-line"><small>服务师傅</small><strong>${providerName}</strong></span>
          <span class="order-bottom"><small>${escapeHtml(item.order.createdAt)}</small><strong>${escapeHtml(priceText(item.order.priceEstimate))}</strong></span>
        </button>
      `;
    }).join('');
    list.querySelectorAll('.order-card').forEach(card => card.addEventListener('click', () => navigateTo(`/order?id=${encodeURIComponent(card.dataset.id)}`)));
  } catch (error) {
    state.textContent = error.message || '订单加载失败，请刷新重试';
    list.innerHTML = '';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new NavigationBar(document.getElementById('navigation-bar'), { title: '我的订单', back: false, background: '#FFFDF9' });
  new BottomNavigation(document.getElementById('bottom-navigation'), 'orders');
  loadOrders();
});
