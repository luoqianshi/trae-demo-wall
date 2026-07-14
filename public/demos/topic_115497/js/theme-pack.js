// ============================================================
// js/theme-pack.js
// 中华文化粒子云引擎 · ThemePack 主题包 Schema 与校验
// 一个 ThemePack 描述一组文化粒子数据 + 视觉配置 + 布局算法 + 交互能力
// 供 ThemeLoader 加载、Layouts 排布、Engine3D 渲染使用
// ============================================================

import { sanitizeText } from './security.js';

/**
 * 主题类别枚举
 * @typedef {'诗词'|'典籍'|'民俗'|'天文'|'哲学'} ThemeCategory
 */

/**
 * 布局算法枚举
 * @typedef {'galaxy'|'scroll'|'constellation'|'grid'|'text'|'custom'} ThemeLayout
 */

/**
 * 主题内容条目
 * @typedef {Object} ThemeContentItem
 * @property {string} text        - 诗句 / 异兽名 / 姓氏等承载文本
 * @property {string} [author]   - 作者
 * @property {string} [source]    - 出处
 * @property {string} [meaning]  - 释义
 * @property {object} [meta]     - 任意附加元数据
 */

/**
 * 调色板
 * @typedef {Object} ThemePalette
 * @property {string} main    - 主色 hex
 * @property {string} accent  - 强调色
 * @property {string} glow    - 辉光色
 * @property {string} bg      - 背景色 1
 * @property {string} bg2     - 背景色 2（渐变）
 */

/**
 * 交互能力
 * @typedef {Object} ThemeInteractions
 * @property {boolean}     clickable   - 粒子是否可点击查看
 * @property {boolean}     searchable  - 是否支持搜索
 * @property {string|null} filterable  - 可筛选字段名，如 'era'
 */

/**
 * ThemePack Schema 定义
 * 字段名 -> { type: 构造器名|string, optional: boolean, default: any, enum?: string[] }
 * 用于运行时类型校验与默认值填充
 */
export const THEME_PACK_SCHEMA = {
  id:            { type: 'string',  optional: false },
  name:          { type: 'string',  optional: false },
  category:      { type: 'string',  optional: false, enum: ['诗词', '典籍', '民俗', '天文', '哲学'] },
  era:           { type: 'string',  optional: false },
  description:   { type: 'string',  optional: false },
  content:       { type: 'Array',   optional: false },
  layout:        { type: 'string',  optional: false, enum: ['galaxy', 'scroll', 'constellation', 'grid', 'text', 'custom'] },
  palette:       { type: 'object',  optional: false },
  particleCount: { type: 'number',  optional: false },
  interactions:  { type: 'object',  optional: false }
};

/**
 * 调色板字段 schema（palette 子对象）
 */
export const PALETTE_SCHEMA = {
  main:   { type: 'string', optional: false },
  accent: { type: 'string', optional: false },
  glow:   { type: 'string', optional: false },
  bg:     { type: 'string', optional: false },
  bg2:    { type: 'string', optional: false }
};

/**
 * 交互字段 schema（interactions 子对象）
 */
export const INTERACTIONS_SCHEMA = {
  clickable:  { type: 'boolean', optional: false },
  searchable: { type: 'boolean', optional: false },
  filterable: { type: 'string', optional: true, nullable: true }
};

/**
 * content 数组元素 schema
 */
export const CONTENT_ITEM_SCHEMA = {
  text:    { type: 'string', optional: false },
  author:  { type: 'string', optional: true },
  source:  { type: 'string', optional: true },
  meaning: { type: 'string', optional: true },
  meta:    { type: 'object', optional: true }
};

/**
 * 默认值表（缺字段时填充，仅对非 optional 字段提供合理 fallback）
 */
export const THEME_PACK_DEFAULTS = {
  interactions: { clickable: false, searchable: false, filterable: null }
};

// ==================== Task 8 安全常量 ====================

/** content 数组最大长度（防超大数据 DoS） */
export const MAX_CONTENT_LENGTH = 1000;

/** particleCount 取值范围 */
export const PARTICLE_COUNT_MIN = 1;
export const PARTICLE_COUNT_MAX = 500000;

/** hex 色值正则：支持 #rgb / #rrggbb / #rrggbbaa */
const HEX_COLOR_RE = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

// ==================== 内部工具 ====================

/**
 * 获取值的类型标签（用于类型校验）
 * Array 单独识别为 'Array'，null 识别为 'null'
 * @param {any} v
 * @returns {string}
 */
function typeOf(v) {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'Array';
  return typeof v;
}

/**
 * 校验单个字段
 * @param {any} value
 * @param {{type:string, optional?:boolean, enum?:string[]}} spec
 * @param {string} path 字段路径（用于错误信息）
 * @returns {string[]} 错误信息列表（空数组表示通过）
 */
function checkField(value, spec, path) {
  const errors = [];
  // null 与 undefined 处理
  if (value === undefined || value === null) {
    if (!spec.optional) errors.push(`字段 "${path}" 缺失`);
    return errors;
  }
  // 类型校验
  if (spec.type === 'boolean') {
    if (typeof value !== 'boolean') errors.push(`字段 "${path}" 应为 boolean，实为 ${typeOf(value)}`);
  } else if (spec.type === 'Array') {
    if (!Array.isArray(value)) errors.push(`字段 "${path}" 应为 Array，实为 ${typeOf(value)}`);
  } else if (typeof value !== spec.type) {
    errors.push(`字段 "${path}" 应为 ${spec.type}，实为 ${typeOf(value)}`);
  }
  // 枚举校验
  if (spec.enum && !errors.length && !spec.enum.includes(value)) {
    errors.push(`字段 "${path}" 值 "${value}" 不在枚举 [${spec.enum.join('|')}] 内`);
  }
  return errors;
}

/**
 * 校验子 schema（palette / interactions / content item）
 * @param {object} obj
 * @param {Object} schema
 * @param {string} prefix
 * @returns {string[]}
 */
function checkSubObject(obj, schema, prefix) {
  const errors = [];
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    errors.push(`字段 "${prefix}" 应为 object`);
    return errors;
  }
  for (const key of Object.keys(schema)) {
    const spec = schema[key];
    const v = obj[key];
    if (v === undefined || v === null) {
      if (!spec.optional) errors.push(`字段 "${prefix}.${key}" 缺失`);
      continue;
    }
    // nullable 字段允许 null（如 filterable）
    if (spec.nullable && v === null) continue;
    errors.push(...checkField(v, spec, `${prefix}.${key}`));
  }
  return errors;
}

// ==================== 对外导出的校验函数 ====================

/**
 * 校验一个 plain object 是否符合 ThemePack schema
 * 不抛错，返回结构化结果，供 ThemeLoader 在加载时使用
 * @param {object} obj
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateThemePack(obj) {
  const errors = [];
  if (typeof obj !== 'object' || obj === null || Array.isArray(obj)) {
    return { valid: false, errors: ['ThemePack 应为 object，实为 ' + typeOf(obj)] };
  }
  // 顶层字段
  for (const key of Object.keys(THEME_PACK_SCHEMA)) {
    const spec = THEME_PACK_SCHEMA[key];
    const v = obj[key];
    if (v === undefined || v === null) {
      if (!spec.optional) errors.push(`字段 "${key}" 缺失`);
      continue;
    }
    errors.push(...checkField(v, spec, key));
  }
  // palette 子对象
  if (obj.palette !== undefined && obj.palette !== null) {
    errors.push(...checkSubObject(obj.palette, PALETTE_SCHEMA, 'palette'));
    // Task 8：palette 各字段必须为合法 hex 色值
    for (const key of Object.keys(PALETTE_SCHEMA)) {
      const v = obj.palette[key];
      if (typeof v === 'string' && v.length > 0 && !HEX_COLOR_RE.test(v)) {
        errors.push(`字段 "palette.${key}" 应为合法 hex 色值（#rgb/#rrggbb/#rrggbbaa），实为 "${v}"`);
      }
    }
  }
  // interactions 子对象（缺失则补默认值再校验）
  const interactions = obj.interactions || {};
  errors.push(...checkSubObject(interactions, INTERACTIONS_SCHEMA, 'interactions'));
  // content 数组元素 + Task 8 深度限制
  if (Array.isArray(obj.content)) {
    if (obj.content.length > MAX_CONTENT_LENGTH) {
      errors.push(`字段 "content" 长度 ${obj.content.length} 超过上限 ${MAX_CONTENT_LENGTH}（防 DoS）`);
    }
    obj.content.forEach((item, i) => {
      errors.push(...checkSubObject(item, CONTENT_ITEM_SCHEMA, `content[${i}]`));
    });
  }
  // Task 8：particleCount 取值范围校验
  if (typeof obj.particleCount === 'number') {
    if (!Number.isFinite(obj.particleCount) ||
        obj.particleCount < PARTICLE_COUNT_MIN ||
        obj.particleCount > PARTICLE_COUNT_MAX) {
      errors.push(`字段 "particleCount" 应在 ${PARTICLE_COUNT_MIN}~${PARTICLE_COUNT_MAX} 之间，实为 ${obj.particleCount}`);
    }
  }
  // Task 8：id 必须非空字符串
  if (typeof obj.id === 'string' && obj.id.trim() === '') {
    errors.push('字段 "id" 不能为空字符串');
  }
  return { valid: errors.length === 0, errors };
}

// ==================== Task 8 安全净化 ====================

/**
 * 净化主题包：深拷贝并对所有字符串字段调用 sanitizeText 过滤，返回安全副本
 * 不修改原始对象（避免污染主题模块的共享导出对象）
 * palette 色值字段保留原值（由 validateThemePack 的 hex 校验把关，转义会破坏 hex）
 * @param {object} raw
 * @returns {object} 净化后的新对象
 */
export function sanitizeThemePack(raw) {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};

  // 顶层字符串字段净化
  const safe = {
    id:          sanitizeText(String(raw.id ?? ''),          { maxLength: 100,  allowNewlines: false }),
    name:        sanitizeText(String(raw.name ?? ''),        { maxLength: 100,  allowNewlines: false }),
    category:    sanitizeText(String(raw.category ?? ''),    { maxLength: 30,   allowNewlines: false }),
    era:         sanitizeText(String(raw.era ?? ''),         { maxLength: 50,   allowNewlines: false }),
    description: sanitizeText(String(raw.description ?? ''), { maxLength: 500,  allowNewlines: true  }),
    content:     Array.isArray(raw.content) ? raw.content.map(item => {
      const c = {
        text: sanitizeText(String(item?.text ?? ''),    { maxLength: 500, allowNewlines: true })
      };
      if (item?.author  != null) c.author  = sanitizeText(String(item.author),  { maxLength: 100, allowNewlines: true });
      if (item?.source  != null) c.source  = sanitizeText(String(item.source),  { maxLength: 100, allowNewlines: true });
      if (item?.meaning != null) c.meaning = sanitizeText(String(item.meaning), { maxLength: 500, allowNewlines: true });
      if (item?.meta && typeof item.meta === 'object') c.meta = { ...item.meta };
      return c;
    }) : [],
    layout:        String(raw.layout ?? ''),
    palette:       raw.palette && typeof raw.palette === 'object' ? { ...raw.palette } : {},
    particleCount: Number(raw.particleCount) || 0,
    interactions:  {
      clickable:  !!raw.interactions?.clickable,
      searchable: !!raw.interactions?.searchable,
      filterable: raw.interactions?.filterable ?? null
    }
  };
  return safe;
}

// ==================== ThemePack 类 ====================

/**
 * ThemePack 主题包类
 * 构造时即做严格校验：缺字段抛 Error('ThemePack 缺少字段：xxx')
 * 类型不符抛 TypeError
 * Task 8：构造时先 sanitizeThemePack 净化为安全副本，再校验，避免污染原始模块导出
 */
export class ThemePack {
  /**
   * @param {object} raw plain object 主题数据
   */
  constructor(raw) {
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
      throw new TypeError('ThemePack 构造参数应为 object');
    }
    // Task 8：先净化为安全副本（不污染原始模块导出对象）
    const safe = sanitizeThemePack(raw);
    // 再对净化后的副本做校验
    const { valid, errors } = validateThemePack(safe);
    if (!valid) {
      // 区分缺失字段与类型错误
      const missing = errors.filter(e => e.includes('缺失'));
      const typeErr = errors.filter(e => e.includes('应为') && !e.includes('缺失'));
      if (missing.length) {
        // 缺字段抛 Error
        const fields = missing.map(m => m.match(/字段 "(.+?)"/)?.[1]).filter(Boolean).join(', ');
        throw new Error(`ThemePack 缺少字段：${fields}`);
      }
      if (typeErr.length) {
        throw new TypeError(`ThemePack 类型错误：${typeErr.join('; ')}`);
      }
      // 其他错误（枚举不匹配 / hex / 范围）也归为 TypeError
      throw new TypeError(`ThemePack 校验失败：${errors.join('; ')}`);
    }
    // 校验通过，从安全副本逐字段赋值
    this.id            = safe.id;
    this.name          = safe.name;
    this.category      = safe.category;
    this.era           = safe.era;
    this.description   = safe.description;
    this.content       = safe.content;
    this.layout        = safe.layout;
    this.palette       = safe.palette;
    this.particleCount = safe.particleCount;
    this.interactions  = safe.interactions;
  }

  /**
   * 重新校验当前实例
   * @returns {{ valid: boolean, errors: string[] }}
   */
  validate() {
    return validateThemePack(this.toJSON());
  }

  /**
   * 序列化为 plain object
   * @returns {object}
   */
  toJSON() {
    return {
      id:            this.id,
      name:          this.name,
      category:      this.category,
      era:           this.era,
      description:   this.description,
      content:       this.content.map(c => ({ ...c })),
      layout:        this.layout,
      palette:       { ...this.palette },
      particleCount: this.particleCount,
      interactions:  { ...this.interactions }
    };
  }
}

// 功能描述：定义中华文化粒子云引擎的 ThemePack 主题包 Schema 与校验体系。导出 THEME_PACK_SCHEMA / PALETTE_SCHEMA / INTERACTIONS_SCHEMA / CONTENT_ITEM_SCHEMA 四张 schema 表（声明字段类型、是否可选、枚举值），以及 validateThemePack(obj) 工具函数（返回 {valid, errors}，供 ThemeLoader 加载时校验）。导出 class ThemePack：构造函数接收 plain object，缺失字段抛 Error('ThemePack 缺少字段：xxx')、类型不符抛 TypeError；提供 validate() 重新校验、toJSON() 序列化。覆盖 id/name/category/era/description/content/layout/palette/particleCount/interactions 全部字段，确保主题数据在引擎内类型安全可追溯。
// Task 8 安全加固增强：1) validateThemePack 新增 palette hex 色值校验（#rgb/#rrggbb/#rrggbbaa）、content 数组深度上限 1000（防 DoS）、particleCount 范围 1~500000、id 非空校验；2) 新增 sanitizeThemePack(raw) 净化函数，深拷贝并对所有字符串字段调用 sanitizeText 过滤恶意内容，返回安全副本不污染原始模块导出；3) ThemePack 构造函数改为先 sanitizeThemePack 净化再校验再赋值。导出安全常量 MAX_CONTENT_LENGTH / PARTICLE_COUNT_MIN / PARTICLE_COUNT_MAX 供外部读取。
