// ============================================================
// js/security.js
// 中华文化粒子云引擎 · 安全工具模块（Task 8）
// 提供输入净化、显示净化、输入校验、信息卡安全渲染等纯函数工具
// 供 Task 5（信息卡）、Task 6（用户输入转粒子云）及引擎内部调用
// 所有函数均为纯函数（renderInfoCard/renderMultilineText 仅操作传入 DOM，无副作用外溢）
// ============================================================

// ==================== 内部常量 ====================

/** 危险脚本关键字正则（全局 + 大小写不敏感） */
const DANGEROUS_KEYWORDS_RE = [
  /javascript:/gi,            // javascript: 伪协议
  /vbscript:/gi,              // vbscript: 伪协议
  /data:text\/html/gi,        // data:text/html 内联 HTML
  /on\w+\s*=\s*/gi,           // onXxx= 事件处理器（onclick= / onerror= 等）
  /<\s*script/gi,             // <script 标签
  /<\s*iframe/gi,             // <iframe 标签
  /<\s*object/gi,             // <object 标签
  /<\s*embed/gi,              // <embed 标签
  /<\s*link/gi,               // <link 标签
  /<\s*meta/gi,               // <meta 标签
  /<\s*style/gi,              // <style 标签（防 CSS 注入）
  /<\s*base/gi,               // <base 标签（防改 base URL）
  /expression\s*\(/gi        // CSS expression() 表达式
];

/** HTML 标签正则：<...> 整体匹配 */
const HTML_TAG_RE = /<[^>]*>/g;

// ==================== 通用净化 ====================

/**
 * 文本净化：移除 HTML 标签 + 危险关键字 + 转义关键字符 + 长度限制
 * 适用于需安全塞入 innerHTML 的场景（已转义，浏览器不会再解析为标签）
 * @param {string|*} input 任意输入，会先 String() 转字符串
 * @param {{maxLength?:number, allowNewlines?:boolean, allowedTags?:string[]}} [options]
 *   - maxLength：最大长度，默认 1000（先截断再做后续处理，防超长输入 DoS）
 *   - allowNewlines：是否保留换行，默认 false（换行替换为空格）
 *   - allowedTags：保留标签白名单（当前实现仅作 API 预留，统一剥离所有标签）
 * @returns {string} 净化后的安全字符串
 */
export function sanitizeText(input, options = {}) {
  if (input === null || input === undefined) return '';
  const {
    maxLength = 1000,
    allowNewlines = false,
    allowedTags = []
  } = options;

  let str = String(input);

  // 1. 长度限制：先截断，避免超长字符串触发后续正则回溯 DoS
  if (str.length > maxLength) {
    str = str.slice(0, maxLength);
  }

  // 2. 处理换行：不允许换行时把 \r\n 替换为单空格
  if (!allowNewlines) {
    str = str.replace(/[\r\n]+/g, ' ');
  }

  // 3. 移除 HTML 标签（整体剥离，无视 allowedTags 白名单以策安全）
  str = str.replace(HTML_TAG_RE, '');

  // 4. 移除危险脚本关键字 / 事件处理器 / 危险标签
  for (const re of DANGEROUS_KEYWORDS_RE) {
    str = str.replace(re, '');
  }

  // 5. 转义关键字符（顺序：& 必须最先，避免把已转义实体再转义）
  str = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  // 忽略 allowedTags（统一剥离），仅为 API 兼容保留参数
  void allowedTags;

  return str;
}

/**
 * 显示净化：返回可安全塞入 textContent 的字符串
 * 与 sanitizeText 的区别：不进行 HTML 实体转义（textContent 本身不解析实体，
 * 若转义会导致浏览器显示 "&lt;" 字面量而非 "<"），仅剥离标签与危险关键字
 * @param {string|*} str
 * @returns {string}
 */
export function sanitizeForDisplay(str) {
  if (str === null || str === undefined) return '';
  let s = String(str);

  // 1. 移除 HTML 标签
  s = s.replace(HTML_TAG_RE, '');

  // 2. 移除危险关键字
  for (const re of DANGEROUS_KEYWORDS_RE) {
    s = s.replace(re, '');
  }

  // 3. 规范化控制字符：去除 NUL / 制表符等不可见控制字符
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');

  return s;
}

// ==================== 输入校验 ====================

/**
 * 按类型校验用户输入
 * @param {string|*} input
 * @param {'poem'|'keyword'|'themeName'} type
 * @returns {{valid:boolean, value?:string, error?:string}}
 */
export function validateInput(input, type) {
  if (input === null || input === undefined) input = '';
  const str = String(input);

  switch (type) {
    case 'poem': {
      // 诗句：允许汉字 / 中英文标点 / 字母数字 / 空格换行，长度 ≤ 200
      if (str.length === 0) {
        return { valid: false, error: '诗句不能为空' };
      }
      if (str.length > 200) {
        return { valid: false, error: '诗句长度不能超过 200 字符' };
      }
      // 允许：汉字 \u4e00-\u9fff、CJK 标点 \u3000-\u303f、全角 \uff00-\uffef、
      //       字母数字下划线 \w、空格换行、常见中英文标点
      const allowed = /^[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef\w\s.,;:!?'"，。；：！？、（）《》【】「」『』·\-—…]+$/
;
      if (!allowed.test(str)) {
        return { valid: false, error: '诗句含非法字符' };
      }
      return { valid: true, value: str };
    }
    case 'keyword': {
      // 关键词：长度 1-30，允许汉字 / 字母数字 / 空格 / 中文标点
      if (str.length === 0) {
        return { valid: false, error: '关键词不能为空' };
      }
      if (str.length > 30) {
        return { valid: false, error: '关键词长度不能超过 30 字符' };
      }
      const allowed = /^[\u4e00-\u9fff\w\s，。、·]+$/;
      if (!allowed.test(str)) {
        return { valid: false, error: '关键词含非法字符' };
      }
      return { valid: true, value: str };
    }
    case 'themeName': {
      // 主题名：长度 1-20，允许汉字 / 字母数字 / 空格
      if (str.length === 0) {
        return { valid: false, error: '主题名不能为空' };
      }
      if (str.length > 20) {
        return { valid: false, error: '主题名长度不能超过 20 字符' };
      }
      const allowed = /^[\u4e00-\u9fff\w\s·]+$/;
      if (!allowed.test(str)) {
        return { valid: false, error: '主题名含非法字符' };
      }
      return { valid: true, value: str };
    }
    default:
      return { valid: false, error: `未知的校验类型：${type}` };
  }
}

// ==================== DOM 安全渲染 ====================

/**
 * 多行文本安全渲染：把含 \n 的文本渲染为「文本<br>文本」结构
 * 用 DOM API（createElement + createTextNode）替代 innerHTML，杜绝 XSS
 * @param {HTMLElement} element 目标容器
 * @param {string} text 含换行符的文本
 */
export function renderMultilineText(element, text) {
  if (!element) return;
  // 先安全清空（textContent = '' 不触发解析，比 innerHTML='' 更安全且更快）
  element.textContent = '';
  if (text === null || text === undefined) return;

  const lines = String(text).split(/\r?\n/);
  lines.forEach((line, i) => {
    if (i > 0) {
      element.appendChild(document.createElement('br'));
    }
    // createTextNode 自动处理所有特殊字符，浏览器不会将其解析为标签
    element.appendChild(document.createTextNode(line));
  });
}

/**
 * 信息卡安全渲染：用 textContent 渲染诗句 / 作者 / 出处 / 释义
 * 供 Task 5 信息卡组件调用，避免 innerHTML 注入用户数据
 * @param {HTMLElement} container 信息卡容器
 * @param {{title?:string, author?:string, source?:string, meaning?:string, text?:string}} data 主题内容数据
 */
export function renderInfoCard(container, data) {
  if (!container) return;
  // 安全清空
  container.textContent = '';
  if (!data || typeof data !== 'object') return;

  const fields = [
    { cls: 'info-title',   text: data.title   ?? data.text },
    { cls: 'info-author',  text: data.author  },
    { cls: 'info-source',  text: data.source  },
    { cls: 'info-meaning', text: data.meaning }
  ];

  for (const f of fields) {
    if (f.text === undefined || f.text === null || f.text === '') continue;
    const el = document.createElement('div');
    el.className = f.cls;
    // textContent 自动转义，sanitizeForDisplay 再剥离残留标签 / 危险关键字
    el.textContent = sanitizeForDisplay(String(f.text));
    container.appendChild(el);
  }
}

// 功能描述：中华文化粒子云引擎的安全工具模块（Task 8 安全加固）。导出五个纯函数工具：
// 1) sanitizeText(input, options)：通用文本净化，先按 maxLength（默认 1000）截断防 DoS，
//    再剥离 HTML 标签、移除危险脚本关键字（javascript:/vbscript:/onXxx=/<script>/<iframe>/
//    <object>/<embed>/<link>/<meta>/<style>/<base>/expression()/data:text/html），
//    最后转义 & < > " ' 五个关键字符为 HTML 实体，allowNewlines 控制是否保留换行，
//    适用于需安全塞入 innerHTML 的场景；
// 2) sanitizeForDisplay(str)：显示净化，仅剥离标签与危险关键字、去除不可见控制字符，
//    不做 HTML 实体转义（因 textContent 不解析实体，转义会导致显示 "&lt;" 字面量），
//    适用于 textContent 渲染场景；
// 3) validateInput(input, type)：按类型校验用户输入，type ∈ {poem|keyword|themeName}，
//    poem 允许汉字/标点/字母数字/换行长度≤200，keyword 长度≤30，themeName 长度≤20，
//    返回 {valid, value?, error?}；
// 4) renderMultilineText(element, text)：用 createElement+createTextNode 替代 innerHTML
//    渲染含换行的多行文本（文本<br>文本），杜绝 XSS；
// 5) renderInfoCard(container, data)：用 textContent 渲染信息卡的诗句/作者/出处/释义字段，
//    供 Task 5 信息卡组件调用。所有函数均为纯函数（DOM 渲染函数仅操作传入容器，无副作用外溢）。
