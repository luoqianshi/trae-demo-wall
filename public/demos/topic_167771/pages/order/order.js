import { getOrderDetail } from '../../mock/mockApi.js';
import { findService } from '../../mock/serviceCatalog.js';
import { navigateTo, navigateBack, reLaunch, getQueryParam } from '../../router.js';

const appointmentLabels = {
  asap: '尽快上门',
  today: '今天上门',
  tomorrow: '明天上门'
};

let appData = {
  orderId: '',
  loading: true,
  errorMsg: '',
  order: null,
  provider: null,
  timeline: [],
  serviceName: '',
  appointmentLabel: '',
  providerTypeLabel: '',
  matchedTitle: '',
  providerActionText: '',
  providerSubtitle: '',
  ratingText: '0.0',
  laborText: ''
};

function renderTimeline() {
  const container = document.getElementById('timeline');
  if (!container) return;

  container.innerHTML = appData.timeline.map((item, index) => {
    const stateText = item.state === 'done' ? '已完成' : item.state === 'current' ? '当前状态' : '后续阶段';
    const dotContent = item.state === 'done' ? '✓' : '';
    const showLine = index < appData.timeline.length - 1;

    return `
      <div class="timeline-item ${item.state}">
        <div class="timeline-rail">
          <div class="timeline-dot">${dotContent}</div>
          ${showLine ? '<div class="timeline-line"></div>' : ''}
        </div>
        <div class="timeline-copy">
          <span class="timeline-label">${item.label}</span>
          <span class="timeline-state">${stateText}</span>
        </div>
      </div>
    `;
  }).join('');
}

function updateState() {
  const loadingEl = document.getElementById('loading-state');
  const errorEl = document.getElementById('error-state');
  const contentEl = document.getElementById('content-area');
  const errorMsgEl = document.getElementById('error-message');

  if (loadingEl) loadingEl.style.display = appData.loading ? 'flex' : 'none';
  if (errorEl) errorEl.style.display = appData.errorMsg ? 'flex' : 'none';
  if (contentEl) contentEl.style.display = (!appData.loading && !appData.errorMsg && appData.order && appData.provider) ? 'block' : 'none';
  if (errorMsgEl) errorMsgEl.textContent = appData.errorMsg;

  if (!appData.loading && !appData.errorMsg && appData.order && appData.provider) {
    const order = appData.order;
    const provider = appData.provider;

    document.getElementById('matched-title').textContent = appData.matchedTitle;
    document.getElementById('order-id').textContent = order.id;
    document.getElementById('provider-type').textContent = appData.providerTypeLabel;
    document.getElementById('provider-name').textContent = provider.title;
    document.getElementById('provider-subtitle').textContent = appData.providerSubtitle;
    document.getElementById('rating-text').textContent = appData.ratingText;
    document.getElementById('distance-text').textContent = `${provider.distanceKm} km`;
    document.getElementById('arrival-text').textContent = `约 ${provider.avgArrivalMin} 分钟`;
    document.getElementById('view-provider-btn').textContent = appData.providerActionText;

    document.getElementById('service-name').textContent = appData.serviceName;
    document.getElementById('appointment-label').textContent = appData.appointmentLabel;
    document.getElementById('contact-phone').textContent = order.contactPhone;
    document.getElementById('address').textContent = order.address;
    document.getElementById('issue-box').textContent = order.issueDescription;

    document.getElementById('visit-fee').textContent = `¥${order.priceEstimate.visitFee}`;
    document.getElementById('labor-text').textContent = appData.laborText;
    document.getElementById('material-note').textContent = order.priceEstimate.materialNote;

    renderTimeline();
  }
}

async function loadOrder() {
  if (!appData.orderId) {
    appData.loading = false;
    appData.errorMsg = '订单编号缺失，请返回首页重新报修';
    updateState();
    return;
  }

  appData.loading = true;
  appData.errorMsg = '';
  updateState();

  try {
    const result = await getOrderDetail(appData.orderId);
    const { order, provider, timeline } = result;
    const service = findService(order.serviceType);
    const isWorker = provider.type === 'worker';
    const providerSubtitle = isWorker
      ? `${provider.detail.jobType} · ${provider.detail.years} 年经验`
      : provider.detail.scope;
    const estimate = order.priceEstimate;
    const laborText = estimate.laborMin == null
      ? '检测后报价'
      : `¥${estimate.laborMin}–${estimate.laborMax}`;

    appData = {
      ...appData,
      order,
      provider,
      timeline,
      serviceName: service?.name || '上门维修',
      appointmentLabel: appointmentLabels[order.appointment] || order.appointment,
      providerTypeLabel: isWorker ? '认证师傅' : '服务企业',
      matchedTitle: isWorker ? '师傅已匹配，正在准备上门' : '服务企业已匹配，正在准备上门',
      providerActionText: isWorker ? '查看师傅资质与评价' : '查看企业资质与评价',
      providerSubtitle,
      ratingText: Number(provider.ratingAvg || 0).toFixed(1),
      laborText,
      loading: false
    };

    updateState();
  } catch (error) {
    appData.loading = false;
    appData.errorMsg = error.message || '订单加载失败';
    updateState();
  }
}

function onRetry() {
  loadOrder();
}

function onGoHome() {
  reLaunch('/');
}

function onViewProvider() {
  const provider = appData.provider;
  if (!provider) return;
  navigateTo(`/detail?id=${encodeURIComponent(provider.id)}&type=${encodeURIComponent(provider.type)}`);
}

function onBack() {
  navigateBack(1);
}

window.onRetry = onRetry;
window.onGoHome = onGoHome;
window.onViewProvider = onViewProvider;
window.onBack = onBack;

document.addEventListener('DOMContentLoaded', () => {
  appData.orderId = getQueryParam('id') || '';
  loadOrder();
});
