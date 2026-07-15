import { serviceCatalog } from '../../mock/serviceCatalog.js';
import { getPriceEstimate, createRepairOrder } from '../../mock/mockApi.js';
import { validateRepairForm } from '../../utils/order.js';
import { navigateTo, navigateBack, getQueryParam } from '../../router.js';

let appData = {
  services: serviceCatalog,
  serviceNames: serviceCatalog.map(item => item.name),
  serviceIndex: 0,
  form: {
    serviceType: 'pipe_leak',
    issueDescription: '',
    address: '',
    appointment: 'asap',
    contactPhone: '',
    priceConfirmed: false,
    preferredProviderId: ''
  },
  appointmentOptions: [
    { value: 'asap', label: '尽快上门', hint: '预计 30–60 分钟响应' },
    { value: 'today', label: '今天', hint: '当天安排时段' },
    { value: 'tomorrow', label: '明天', hint: '明日优先安排' }
  ],
  priceEstimate: null,
  laborText: '',
  errors: {},
  errorSummary: '',
  preferredProviderName: '',
  preferredProviderTypeLabel: '',
  submitting: false
};

function getServiceIndex(serviceType) {
  const index = serviceCatalog.findIndex(item => item.id === serviceType);
  return index >= 0 ? index : 0;
}

function renderServiceSelect() {
  const select = document.getElementById('service-select');
  if (!select) return;

  select.innerHTML = appData.services.map((item, idx) =>
    `<option value="${item.id}" ${idx === appData.serviceIndex ? 'selected' : ''}>${item.name}</option>`
  ).join('');
}

function updateEstimate(serviceType) {
  const priceEstimate = getPriceEstimate(serviceType);
  const laborText = priceEstimate?.laborMin == null
    ? '检测后报价'
    : `¥${priceEstimate.laborMin}–${priceEstimate.laborMax}`;

  appData.priceEstimate = priceEstimate;
  appData.laborText = laborText;
  renderPrice();
}

function renderPrice() {
  const titleEl = document.getElementById('price-title');
  const visitEl = document.getElementById('visit-fee');
  const laborEl = document.getElementById('labor-text');
  const materialEl = document.getElementById('material-note');

  if (titleEl) titleEl.textContent = appData.services[appData.serviceIndex].name;
  if (visitEl) visitEl.textContent = `¥${appData.priceEstimate.visitFee}`;
  if (laborEl) laborEl.textContent = appData.laborText;
  if (materialEl) materialEl.textContent = appData.priceEstimate.materialNote;
}

function renderPreferred() {
  const card = document.getElementById('preferred-card');
  const nameEl = document.getElementById('preferred-name');
  const noteEl = document.getElementById('preferred-note');

  if (appData.preferredProviderName) {
    if (card) card.style.display = 'flex';
    if (nameEl) nameEl.textContent = appData.preferredProviderName;
    if (noteEl) noteEl.textContent = `${appData.preferredProviderTypeLabel} · 提交时优先锁定`;
  } else {
    if (card) card.style.display = 'none';
  }
}

function renderAppointmentSelected() {
  appData.appointmentOptions.forEach(opt => {
    const el = document.getElementById(`appointment-${opt.value}`);
    if (!el) return;
    if (appData.form.appointment === opt.value) {
      el.classList.add('selected');
      const radio = el.querySelector('input[type="radio"]');
      if (radio) radio.checked = true;
    } else {
      el.classList.remove('selected');
    }
  });
}

function showFieldError(field, message) {
  const errorMap = {
    serviceType: 'service-error',
    issueDescription: 'description-error',
    address: 'address-error',
    appointment: 'appointment-error',
    contactPhone: 'phone-error',
    priceConfirmed: 'confirm-error'
  };

  const errorId = errorMap[field];
  if (!errorId) return;

  const errorEl = document.getElementById(errorId);
  const fieldGroup = document.getElementById(`${field === 'issueDescription' ? 'description' : field === 'contactPhone' ? 'phone' : field}-field`);

  if (errorEl) {
    if (message) {
      errorEl.textContent = `! ${message}`;
      errorEl.style.display = 'block';
    } else {
      errorEl.style.display = 'none';
    }
  }

  if (fieldGroup) {
    if (message) {
      fieldGroup.classList.add('field-error');
    } else {
      fieldGroup.classList.remove('field-error');
    }
  }
}

function renderErrors() {
  const fields = ['serviceType', 'issueDescription', 'address', 'appointment', 'contactPhone', 'priceConfirmed'];
  fields.forEach(field => {
    const msg = appData.errors[field] || '';
    showFieldError(field, msg);
  });

  const confirmGroup = document.getElementById('confirm-group');
  if (confirmGroup) {
    if (appData.errors.priceConfirmed) {
      confirmGroup.classList.add('confirm-error');
    } else {
      confirmGroup.classList.remove('confirm-error');
    }
  }

  const summaryEl = document.getElementById('error-summary');
  if (summaryEl) {
    if (appData.errorSummary) {
      summaryEl.textContent = appData.errorSummary;
      summaryEl.style.display = 'block';
    } else {
      summaryEl.style.display = 'none';
    }
  }
}

function renderSubmit() {
  const btn = document.getElementById('submit-btn');
  if (!btn) return;
  btn.textContent = appData.submitting ? '正在匹配师傅…' : '确认提交报修';
  btn.disabled = appData.submitting;
}

function clearError(field) {
  if (!appData.errors[field] && !appData.errorSummary) return;
  appData.errors[field] = '';
  appData.errorSummary = '';
  renderErrors();
}

function onServiceChange(event) {
  const serviceIndex = event.target.selectedIndex;
  const serviceType = serviceCatalog[serviceIndex].id;
  appData.serviceIndex = serviceIndex;
  appData.form.serviceType = serviceType;
  clearError('serviceType');
  updateEstimate(serviceType);
}

function onFieldInput(event) {
  const field = event.target.id === 'issue-description' ? 'issueDescription'
    : event.target.id === 'contact-phone' ? 'contactPhone'
    : event.target.id;
  appData.form[field] = event.target.value;
  clearError(field);
}

function onFieldBlur(event) {
  const field = event.target.id === 'issue-description' ? 'issueDescription'
    : event.target.id === 'contact-phone' ? 'contactPhone'
    : event.target.id;
  const value = event.target.value;
  const validation = validateRepairForm({ ...appData.form, [field]: value });
  if (validation.errors[field]) {
    appData.errors[field] = validation.errors[field];
    renderErrors();
  }
}

function onAppointmentChange(value) {
  appData.form.appointment = value;
  renderAppointmentSelected();
  clearError('appointment');
}

function onConfirmChange(event) {
  appData.form.priceConfirmed = event.target.checked;
  if (appData.form.priceConfirmed) clearError('priceConfirmed');
}

async function onSubmit() {
  if (appData.submitting) return;

  const validation = validateRepairForm(appData.form);
  if (!validation.valid) {
    const count = Object.keys(validation.errors).length;
    appData.errors = validation.errors;
    appData.errorSummary = `还有 ${count} 项信息需要完善，请查看字段下方提示。`;
    renderErrors();
    return;
  }

  appData.submitting = true;
  appData.errorSummary = '';
  renderSubmit();
  renderErrors();

  try {
    const result = await createRepairOrder(appData.form);
    navigateTo(`/order?id=${encodeURIComponent(result.order.id)}`);
  } catch (error) {
    if (error.fieldErrors) {
      appData.errors = error.fieldErrors;
    }
    appData.errorSummary = error.message || '提交失败，请稍后重试';
    appData.submitting = false;
    renderSubmit();
    renderErrors();
  }
}

function onBack() {
  navigateBack(1);
}

window.onBack = onBack;
window.onServiceChange = onServiceChange;
window.onFieldInput = onFieldInput;
window.onFieldBlur = onFieldBlur;
window.onAppointmentChange = onAppointmentChange;
window.onConfirmChange = onConfirmChange;
window.onSubmit = onSubmit;

document.addEventListener('DOMContentLoaded', () => {
  const serviceType = getQueryParam('serviceType');
  const providerId = getQueryParam('providerId');
  const providerName = getQueryParam('providerName');
  const providerType = getQueryParam('providerType');

  const serviceIndex = getServiceIndex(serviceType || 'pipe_leak');
  const resolvedServiceType = serviceCatalog[serviceIndex].id;

  appData.serviceIndex = serviceIndex;
  appData.form.serviceType = resolvedServiceType;
  appData.form.preferredProviderId = providerId || '';
  appData.preferredProviderName = providerName || '';
  appData.preferredProviderTypeLabel = providerType === 'enterprise' ? '服务企业' : '认证师傅';

  renderServiceSelect();
  renderPreferred();
  renderAppointmentSelected();
  updateEstimate(resolvedServiceType);
  renderSubmit();
});
