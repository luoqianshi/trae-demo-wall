import { IDBFactory, IDBKeyRange } from 'fake-indexeddb';
import { readFileSync } from 'fs';
import { join } from 'path';
import { JSDOM } from 'jsdom';

// 读取 index.html 内容
const htmlPath = join(process.cwd(), 'index.html');
const htmlContent = readFileSync(htmlPath, 'utf-8');

// Mock requestAnimationFrame
globalThis.requestAnimationFrame = (cb) => setTimeout(cb, 0);
globalThis.cancelAnimationFrame = (id) => clearTimeout(id);

// Mock scrollIntoView
Element.prototype.scrollIntoView = () => {};

// Mock matchMedia
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = () => ({
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
  });
}

/**
 * 创建一个全新的 jsdom 环境并加载 index.html
 * 每次调用都会注入一个全新的 IDBFactory 实例，确保测试间状态完全隔离
 */
export function createDemoEnv() {
  const dom = new JSDOM(htmlContent, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost/',
    beforeParse(window) {
      // 关键：为每个测试注入全新的 fake-indexeddb 实例，避免状态污染
      window.indexedDB = new IDBFactory();
      window.IDBKeyRange = IDBKeyRange;
      // 以下构造函数直接挂载即可（实例 instanceof 检查由 fake-indexeddb 内部处理）
      window.IDBTransaction = globalThis.IDBTransaction;
      window.IDBDatabase = globalThis.IDBDatabase;
      window.IDBObjectStore = globalThis.IDBObjectStore;
      window.IDBRequest = globalThis.IDBRequest;
      window.IDBOpenDBRequest = globalThis.IDBOpenDBRequest;
      window.IDBCursor = globalThis.IDBCursor;
      window.IDBIndex = globalThis.IDBIndex;

      // Mock 浏览器 API
      window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
      window.cancelAnimationFrame = (id) => clearTimeout(id);
      window.Element.prototype.scrollIntoView = () => {};
      window.confirm = () => true;
      window.prompt = () => 'test';
      window.alert = () => {};

      // matchMedia mock（部分代码可能用到）
      if (!window.matchMedia) {
        window.matchMedia = () => ({
          matches: false,
          addEventListener: () => {},
          removeEventListener: () => {},
        });
      }
    },
  });

  const { window } = dom;
  return { window, dom };
}

/**
 * 获取内部 state 对象（通过 index.html 末尾的 testability hook 访问）
 */
export function getState(window) {
  return window.__gitvision__?.state;
}

/**
 * 获取内部 API 函数集合
 */
export function getApi(window) {
  return window.__gitvision__?.api || {};
}

/**
 * 等待异步初始化完成
 */
export function waitForInit(ms = 500) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

globalThis.createDemoEnv = createDemoEnv;
globalThis.waitForInit = waitForInit;
globalThis.getState = getState;
globalThis.getApi = getApi;
