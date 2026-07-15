import { entities } from "./mockData.js";
import { serviceCatalog, findService } from "./serviceCatalog.js";
import { guarantees } from "./contentData.js";
import { createDemoOrders } from "./demoOrders.js";
import { searchEntities, getFeaturedEntities } from "../utils/searchRank.js";
import {
  getPriceEstimate,
  validateRepairForm,
  matchProvider,
  buildRepairOrder,
  getOrderTimeline,
  ORDER_STATUSES
} from "../utils/order.js";

const USE_MOCK = true;
const MOCK_ERROR_RATE = 0;
const ORDER_STORAGE_KEY = "REPAIR_ORDERS";
const ORDER_SEQUENCE_KEY = "REPAIR_ORDER_SEQUENCE";
const DEMO_DATA_VERSION_KEY = "MOCK_DATA_VERSION";
const DEMO_DATA_VERSION = "2026-07-cross-platform-v1";

function randomDelay(min = 200, max = 500) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function maybeReject() {
  return Math.random() < MOCK_ERROR_RATE;
}

function search(params) {
  const { q, page = 1, pageSize = 20 } = params || {};

  if (!USE_MOCK) {
    return request({ url: "/api/search", method: "GET", data: { q, page, pageSize } });
  }

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (maybeReject()) return reject(new Error("网络开小差了，请稍后重试"));

      const all = searchEntities(q, entities);
      const total = all.length;
      const start = (page - 1) * pageSize;
      const end = start + pageSize;

      resolve({
        items: all.slice(start, end),
        total,
        page,
        pageSize,
        hasMore: end < total
      });
    }, randomDelay());
  });
}

function getDetail(params) {
  const { id, type } = params || {};

  if (!USE_MOCK) {
    return request({ url: "/api/detail", method: "GET", data: { id, type } });
  }

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (maybeReject()) return reject(new Error("加载失败，请检查网络后重试"));

      const entity = entities.find(e => e.id === id && e.type === type);
      if (!entity) return reject(new Error("未找到该条目"));

      resolve(entity);
    }, randomDelay());
  });
}

function getFeaturedProviders() {
  return Promise.resolve(getFeaturedEntities(entities, 20));
}

function getHomeData() {
  const recommendedProviders = entities
    .filter(item => item.type === "worker")
    .slice()
    .sort((a, b) => {
      if ((b.ratingAvg || 0) !== (a.ratingAvg || 0)) return (b.ratingAvg || 0) - (a.ratingAvg || 0);
      return (a.distanceKm || 99) - (b.distanceKm || 99);
    })
    .slice(0, 10)
    .map(item => ({ ...item, avatarText: item.title.slice(0, 1) }));

  return Promise.resolve({
    services: serviceCatalog,
    guarantees,
    recommendedProviders
  });
}

function readOrders() {
  try {
    const value = localStorage.getItem(ORDER_STORAGE_KEY);
    const version = localStorage.getItem(DEMO_DATA_VERSION_KEY);
    if (value !== null) {
      const orders = JSON.parse(value);
      if (Array.isArray(orders) && (orders.length > 0 || version === DEMO_DATA_VERSION)) {
        if (version !== DEMO_DATA_VERSION) localStorage.setItem(DEMO_DATA_VERSION_KEY, DEMO_DATA_VERSION);
        return orders;
      }
    }
    const demoOrders = createDemoOrders(entities);
    writeOrders(demoOrders);
    return demoOrders;
  } catch (error) {
    return createDemoOrders(entities);
  }
}

function writeOrders(orders) {
  localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(orders.slice(0, 10)));
  localStorage.setItem(DEMO_DATA_VERSION_KEY, DEMO_DATA_VERSION);
}

function nextOrderSequence(now) {
  const dateKey = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("");
  let stored = null;
  try {
    stored = localStorage.getItem(ORDER_SEQUENCE_KEY);
    stored = stored ? JSON.parse(stored) : null;
  } catch (error) {}
  const value = stored?.dateKey === dateKey ? Number(stored.value || 0) + 1 : 1;
  localStorage.setItem(ORDER_SEQUENCE_KEY, JSON.stringify({ dateKey, value }));
  return value;
}

function createValidationError(fieldErrors) {
  const error = new Error("请检查报修信息后再提交");
  error.code = "VALIDATION_ERROR";
  error.fieldErrors = fieldErrors;
  return error;
}

function createRepairOrder(form) {
  const validation = validateRepairForm(form);
  if (!validation.valid) return Promise.reject(createValidationError(validation.errors));

  const provider = matchProvider(form, entities);
  if (!provider) return Promise.reject(new Error("暂无可匹配的服务者"));

  const orders = readOrders();
  const now = new Date();
  const order = buildRepairOrder(form, provider, { now, sequence: nextOrderSequence(now) });
  writeOrders([order, ...orders.filter(item => item.id !== order.id)]);

  return Promise.resolve({
    order,
    provider,
    timeline: getOrderTimeline(order.status)
  });
}

function getOrderDetail(orderId) {
  const order = readOrders().find(item => item.id === orderId);
  if (!order) {
    const error = new Error("未找到该订单，请返回首页重新报修");
    error.code = "ORDER_NOT_FOUND";
    return Promise.reject(error);
  }

  const provider = entities.find(item => item.id === order.providerId && item.type === order.providerType);
  if (!provider) return Promise.reject(new Error("订单服务者信息暂不可用"));

  return Promise.resolve({
    order,
    provider,
    timeline: getOrderTimeline(order.status)
  });
}

function getOrderList() {
  const statusLabels = new Map(ORDER_STATUSES.map(item => [item.key, item.label]));
  return Promise.resolve(readOrders().map(order => ({
    order,
    service: findService(order.serviceType) || { id: order.serviceType, name: "其他服务" },
    provider: entities.find(item => (
      item.id === order.providerId && item.type === order.providerType
    )) || null,
    statusLabel: statusLabels.get(order.status) || "处理中"
  })));
}

function clearRepairOrders() {
  writeOrders([]);
  return Promise.resolve();
}

function request({ url, method = "GET", data = {} }) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const queryString = Object.keys(data)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join("&");

    const fullUrl = method === "GET" && queryString ? `${url}?${queryString}` : url;
    xhr.open(method, fullUrl, true);
    xhr.timeout = 8000;
    xhr.setRequestHeader("Content-Type", "application/json");

    xhr.onload = function() {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText));
        } catch (e) {
          resolve(xhr.responseText);
        }
      } else {
        reject(new Error("请求失败"));
      }
    };

    xhr.onerror = function() {
      reject(new Error("网络请求失败"));
    };

    xhr.ontimeout = function() {
      reject(new Error("请求超时"));
    };

    if (method === "POST") {
      xhr.send(JSON.stringify(data));
    } else {
      xhr.send();
    }
  });
}

export {
  USE_MOCK,
  MOCK_ERROR_RATE,
  search,
  getDetail,
  getFeaturedProviders,
  getHomeData,
  getPriceEstimate,
  createRepairOrder,
  getOrderDetail,
  getOrderList,
  clearRepairOrders
};
