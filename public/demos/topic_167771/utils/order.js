import { findService, materialNote } from "../mock/serviceCatalog.js";

const ORDER_STATUSES = [
  { key: "submitted", label: "已提交" },
  { key: "matched", label: "已匹配" },
  { key: "arriving", label: "待上门" },
  { key: "quoting", label: "待确认报价" },
  { key: "repairing", label: "维修中" },
  { key: "awaiting_acceptance", label: "待验收" }
];

function getPriceEstimate(serviceType) {
  const service = findService(serviceType);
  if (!service) return null;

  return {
    visitFee: service.visitFee,
    laborMin: service.laborMin,
    laborMax: service.laborMax,
    materialNote
  };
}

function validateRepairForm(form = {}) {
  const errors = {};
  const description = String(form.issueDescription || "").trim();
  const address = String(form.address || "").trim();
  const phone = String(form.contactPhone || "").trim();

  if (!findService(form.serviceType)) errors.serviceType = "请选择服务类型";
  if (description.length < 5) errors.issueDescription = "请至少填写 5 个字，说明故障位置和现象";
  if (!address) errors.address = "请填写上门服务地址";
  if (!form.appointment) errors.appointment = "请选择上门时间";
  if (!/^1[3-9]\d{9}$/.test(phone)) errors.contactPhone = "请输入有效的 11 位手机号";
  if (form.priceConfirmed !== true) errors.priceConfirmed = "请先确认透明报价规则";

  return { valid: Object.keys(errors).length === 0, errors };
}

function normalizedKeywords(entity) {
  return (entity.keywords || []).map(item => String(item).toLowerCase());
}

function skillScore(service, entity) {
  const providerKeywords = normalizedKeywords(entity);
  const hits = service.matchKeywords.filter(target => {
    const normalized = target.toLowerCase();
    return providerKeywords.some(keyword => keyword.includes(normalized) || normalized.includes(keyword));
  }).length;
  return Math.min(hits / 3, 1) * 40;
}

function scoreProvider(service, entity) {
  const rating = Math.max(0, Math.min(Number(entity.ratingAvg) || 0, 5)) / 5 * 25;
  const distance = Math.max(0, 1 - (Number(entity.distanceKm) || 10) / 10) * 20;
  const arrival = Math.max(0, 1 - (Number(entity.avgArrivalMin) || 90) / 90) * 15;
  return skillScore(service, entity) + rating + distance + arrival;
}

function matchProvider(form = {}, providers = []) {
  const preferred = providers.find(item => item.id === form.preferredProviderId);
  if (preferred) return preferred;

  const service = findService(form.serviceType);
  if (!service) return null;

  return providers
    .filter(item => item && item.type === "worker")
    .map(item => ({ item, score: scoreProvider(service, item) }))
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if ((b.item.ratingAvg || 0) !== (a.item.ratingAvg || 0)) {
        return (b.item.ratingAvg || 0) - (a.item.ratingAvg || 0);
      }
      return String(a.item.id).localeCompare(String(b.item.id));
    })[0]?.item || null;
}

function inferServiceType(entity = {}) {
  const keywords = (entity.keywords || []).join(" ");
  if (/水管|管道|漏水/.test(keywords)) return "pipe_leak";
  if (/卫浴|厨卫|防水/.test(keywords)) return "bathroom_repair";
  if (/热水器|家电|检修/.test(keywords)) return "appliance_check";
  if (/灯具/.test(keywords)) return "light_install";
  if (/电工|强电|弱电|开关|插座|布线/.test(keywords)) return "circuit_fault";
  if (/安装/.test(keywords)) return "light_install";
  return "other";
}

function pad(value, length = 2) {
  return String(value).padStart(length, "0");
}

function formatDateTime(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function maskPhone(phone) {
  return String(phone).replace(/^(\d{3})\d{4}(\d{4})$/, "$1****$2");
}

function buildRepairOrder(form, provider, options = {}) {
  const now = options.now || new Date();
  const sequence = Math.max(1, Number(options.sequence) || 1);
  const datePart = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;

  return {
    id: `SD${datePart}${pad(sequence, 4)}`,
    serviceType: form.serviceType,
    issueDescription: String(form.issueDescription).trim(),
    address: String(form.address).trim(),
    appointment: form.appointment,
    contactPhone: maskPhone(form.contactPhone),
    providerId: provider.id,
    providerType: provider.type,
    priceEstimate: getPriceEstimate(form.serviceType),
    status: "arriving",
    createdAt: formatDateTime(now)
  };
}

function getOrderTimeline(status) {
  const activeIndex = ORDER_STATUSES.findIndex(item => item.key === status);
  return ORDER_STATUSES.map((item, index) => ({
    ...item,
    state: index < activeIndex ? "done" : index === activeIndex ? "current" : "pending"
  }));
}

export {
  ORDER_STATUSES,
  getPriceEstimate,
  validateRepairForm,
  matchProvider,
  inferServiceType,
  buildRepairOrder,
  getOrderTimeline
};