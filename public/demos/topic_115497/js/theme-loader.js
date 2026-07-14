// ============================================================
// js/theme-loader.js
// 中华文化粒子云引擎 · 主题加载器
// 基于 theme-registry.js 的显式注册表，提供 list / load / loadAll / search 方法
// load 时动态 import 模块 -> validateThemePack 校验 -> 构造 ThemePack 实例
// ============================================================

import { THEME_REGISTRY } from './theme-registry.js';
import { ThemePack, validateThemePack } from './theme-pack.js';

export class ThemeLoader {
  constructor() {
    /** @type {Map<string, {id:string, module:()=>Promise, namedExport?:string}>} */
    this._registry = new Map();
    /** @type {Map<string, ThemePack>} 已加载的主题缓存 */
    this._cache = new Map();
    /** @type {Map<string, object>} 已加载的元信息缓存（不含 content） */
    this._metaCache = new Map();

    // 注册表登记
    for (const entry of THEME_REGISTRY) {
      this._registry.set(entry.id, entry);
    }
  }

  /**
   * 列出所有已注册主题的元信息（不含 content）
   * 仅返回 id/name/category/era/description（需先 load 一次才能拿到完整 meta，未加载的返回最小元信息）
   * @returns {Array<{id:string, name?:string, category?:string, era?:string, description?:string, loaded:boolean}>}
   */
  list() {
    const result = [];
    for (const [id, entry] of this._registry) {
      const cached = this._metaCache.get(id);
      if (cached) {
        result.push({ ...cached, loaded: true });
      } else {
        // 未加载，仅返回 id
        result.push({ id, loaded: false });
      }
    }
    return result;
  }

  /**
   * 加载指定主题
   * @param {string} id 主题 id
   * @returns {Promise<ThemePack>}
   * @throws {Error} 主题未注册 / 模块加载失败 / 校验失败（均为友好错误，不含原始堆栈）
   */
  async load(id) {
    // 命中缓存
    const cached = this._cache.get(id);
    if (cached) return cached;

    const entry = this._registry.get(id);
    if (!entry) {
      throw new Error(`主题未注册：${id}`);
    }

    // 动态 import 模块
    let mod;
    try {
      mod = await entry.module();
    } catch (err) {
      // Task 8：模块文件缺失等场景，返回友好错误，剥离可能的文件路径 / 堆栈
      throw new Error(`主题 "${id}" 模块加载失败：${this._friendlyErr(err)}`);
    }

    // 取导出对象：优先命名导出，否则 default
    let raw = entry.namedExport ? mod[entry.namedExport] : mod.default;
    if (!raw) {
      // 兜底：尝试把整个 mod 当作主题对象（剔除 __esModule 等内部字段）
      raw = { ...mod };
      delete raw.__esModule;
      delete raw.default;
    }
    if (!raw || typeof raw !== 'object') {
      throw new Error(`主题 "${id}" 模块未导出有效的主题对象`);
    }

    // 校验（ThemePack 构造函数内部会先 sanitizeThemePack 净化，再校验，再赋值）
    const { valid, errors } = validateThemePack(raw);
    if (!valid) {
      throw new Error(`主题 "${id}" 校验失败：${errors.join('; ')}`);
    }

    // 构造 ThemePack 实例（构造内会先净化再严格校验，类型不符抛 TypeError）
    let pack;
    try {
      pack = new ThemePack(raw);
    } catch (err) {
      // Task 8：捕获构造异常（缺字段 / 类型错误），返回友好错误不泄漏堆栈
      throw new Error(`主题 "${id}" 数据无效：${this._friendlyErr(err)}`);
    }

    // 缓存
    this._cache.set(id, pack);
    this._metaCache.set(id, {
      id:            pack.id,
      name:          pack.name,
      category:      pack.category,
      era:           pack.era,
      description:   pack.description,
      layout:        pack.layout,
      particleCount: pack.particleCount
    });

    return pack;
  }

  /**
   * 把异常转换为友好错误字符串，剥离文件路径 / 堆栈 / 行号等敏感信息
   * @param {Error|*} err
   * @returns {string}
   * @private
   */
  _friendlyErr(err) {
    if (!err) return '未知错误';
    let msg = (err && err.message) ? String(err.message) : String(err);
    // 剥离常见堆栈标记与文件路径（如 "at file:///...:line:col" / "(...:line:col)"）
    msg = msg.split('\n')[0];
    msg = msg.replace(/at\s+https?:\/\/\S+/g, '');
    msg = msg.replace(/\(https?:\/\/[^)]*\)/g, '');
    msg = msg.replace(/file:\/\/\/\S+/g, '');
    msg = msg.replace(/:\d+:\d+/g, '');
    msg = msg.trim();
    if (!msg) msg = '数据格式不符合要求';
    // 限制错误信息长度，防止超长错误信息造成 UI 溢出
    if (msg.length > 200) msg = msg.slice(0, 200) + '…';
    return msg;
  }

  /**
   * 并行加载所有已注册主题
   * 单个主题失败不影响其他，返回结果数组（含 error 字段的主题标记 failed）
   * @returns {Promise<Array<{id:string, pack?:ThemePack, error?:string}>>}
   */
  async loadAll() {
    const ids = Array.from(this._registry.keys());
    const results = await Promise.all(
      ids.map(async (id) => {
        try {
          const pack = await this.load(id);
          return { id, pack };
        } catch (err) {
          return { id, error: err.message };
        }
      })
    );
    return results;
  }

  /**
   * 按 keyword 模糊匹配主题（匹配 name / description / era / category）
   * 仅在已加载的元信息中匹配；未加载的主题会先尝试 load
   * @param {string} keyword
   * @returns {Promise<string[]>} 匹配的主题 id 列表
   */
  async search(keyword) {
    if (!keyword) return [];
    const kw = keyword.toLowerCase().trim();
    const matched = [];
    for (const [id] of this._registry) {
      let meta = this._metaCache.get(id);
      if (!meta) {
        // 未加载，尝试加载（失败则跳过）
        try {
          await this.load(id);
          meta = this._metaCache.get(id);
        } catch {
          continue;
        }
      }
      if (!meta) continue;
      const hay = [
        meta.name, meta.description, meta.era, meta.category, meta.id
      ].filter(Boolean).join(' ').toLowerCase();
      if (hay.includes(kw)) {
        matched.push(id);
      }
    }
    return matched;
  }

  /**
   * 清空缓存（调试用）
   */
  clearCache() {
    this._cache.clear();
    this._metaCache.clear();
  }
}

// 功能描述：中华文化粒子云引擎的主题加载器。基于 theme-registry.js 的显式注册表，导出 ThemeLoader 类。提供 list()（返回所有已注册主题元信息，未加载的仅返回 id）、load(id)（动态 import 模块 -> validateThemePack 校验 -> 构造 ThemePack 实例，结果缓存）、loadAll()（Promise.all 并行加载，单主题失败不阻断其他）、search(keyword)（在 name/description/era/category 模糊匹配，未加载的主题会先尝试 load）、clearCache() 方法。load 时区分命名导出（namedExport）与默认导出，模块文件缺失或校验失败时抛出友好 Error。
// Task 8 安全加固增强：load() 中 1) 模块 import 失败时调用 _friendlyErr(err) 剥离文件路径 / 堆栈 / 行号等敏感信息后返回友好错误；2) ThemePack 构造异常（缺字段 / 类型错误 / hex / 范围）也 try/catch 包装为友好 Error，不泄漏原始堆栈；3) 新增 _friendlyErr(err) 私有方法，截取首行、移除 at/file:///:(line:col) 等堆栈标记、限制长度 200 字符。
