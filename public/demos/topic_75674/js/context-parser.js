/**
 * @fileoverview M2 上下文解析模块
 * @description 负责将用户从微信、QQ 等聊天软件中直接复制粘贴的原始文本，
 *              解析为结构化的消息数组。支持多种常见聊天格式的自动识别。
 * @module context-parser
 * @example
 *   import { ContextParser } from './context-parser.js';
 *   const result = ContextParser.parse(rawText);
 *   if (result.success) {
 *     console.log('发送者:', result.senders);
 *     console.log('消息数:', result.messages.length);
 *   }
 */

// ============================================================
// 正则规则库
// ============================================================

/**
 * 聊天格式的正则表达式规则库
 * @type {Object.<string, RegExp>}
 */
const PATTERNS = {
  /** 微信标准格式：名称 + 空格 + 时间（如 "张三 10:23"） */
  wechat_header: /^(.+?)\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*$/,

  /** 微信带日期格式：日期 + 空格 + 时间（如 "昨天 10:23"） */
  wechat_date_header: /^(昨天|今天|前天|\d{1,2}月\d{1,2}日|\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}(?::\d{2})?)\s*$/,

  /** QQ 格式：[时间] 名称（如 "[10:23:15] 张三"） */
  qq_header: /^\[(\d{2}:\d{2}:\d{2})\]\s*(.+?)\s*$/,

  /** 冒号格式：名称: 内容（如 "张三: 在吗？"） */
  colon_format: /^(.+?)[:：]\s*(.+)$/,

  /** 仅时间行（如 "10:23" 或 "昨天 10:23"） */
  time_only: /^(?:昨天|今天|前天|周一|周二|周三|周四|周五|周六|周日|\d{1,2}月\d{1,2}日)?\s*\d{1,2}:\d{2}(?::\d{2})?\s*$/,

  /** 完整日期时间（如 "2024-01-15 10:23"） */
  datetime: /^(\d{4}-\d{2}-\d{2})\s+(\d{1,2}:\d{2}(?::\d{2})?)/,
};

// ============================================================
// 系统消息与占位符配置
// ============================================================

/**
 * 需要过滤掉的系统消息关键词列表
 * @type {string[]}
 */
const SYSTEM_MESSAGE_KEYWORDS = [
  '对方正在输入',
  '撤回了一条消息',
  '以上是打招呼的内容',
  '你已添加了对方为好友',
  '现在可以开始聊天了',
  '你已经是好友',
  '已添加好友',
  '接入了会话',
  '加入了群聊',
];

/**
 * 图片/语音等占位符关键词
 * @type {string[]}
 */
const MEDIA_PLACEHOLDERS = [
  '[图片]',
  '[表情]',
  '[语音]',
  '[视频]',
  '[文件]',
  '[位置]',
  '[名片]',
  '[链接]',
  '[小程序]',
];

// ============================================================
// 格式检测器
// ============================================================

/**
 * 格式检测结果
 * @typedef {Object} FormatDetectionResult
 * @property {string} format - 检测到的格式类型
 * @property {number} score - 置信度分数（越高越可靠）
 */

/**
 * 检测文本最可能的聊天格式
 * @param {string[]} lines - 预处理后的行数组
 * @returns {FormatDetectionResult} 格式检测结果
 * @private
 */
function _detectFormat(lines) {
  let wechatScore = 0;
  let qqScore = 0;
  let colonScore = 0;

  for (const line of lines) {
    if (PATTERNS.qq_header.test(line)) {
      qqScore += 3; // QQ 格式特征明显，加权
    }
    if (PATTERNS.wechat_header.test(line)) {
      wechatScore += 2;
    }
    if (PATTERNS.wechat_date_header.test(line)) {
      wechatScore += 2;
    }
    if (PATTERNS.colon_format.test(line)) {
      colonScore += 1;
    }
  }

  // 取分数最高的格式
  const candidates = [
    { format: 'qq', score: qqScore },
    { format: 'wechat', score: wechatScore },
    { format: 'dingtalk', score: colonScore },
  ];

  candidates.sort((a, b) => b.score - a.score);

  // 如果最高分太低，判定为未知格式
  if (candidates[0].score === 0) {
    return { format: 'unknown', score: 0 };
  }

  return candidates[0];
}

// ============================================================
// 时间解析辅助函数
// ============================================================

/**
 * 解析时间字符串为今天的时间戳（毫秒）
 * 支持格式：HH:MM、HH:MM:SS
 * 对于"昨天"、"前天"等相对日期，自动偏移
 * @param {string} timeStr - 时间字符串
 * @param {string} [dateHint] - 可选的日期提示（如"昨天"、"前天"、"2024-01-15"）
 * @returns {number|null} 时间戳（毫秒），解析失败返回 null
 * @private
 */
function _parseTimestamp(timeStr, dateHint) {
  try {
    const now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();
    let day = now.getDate();

    // 处理日期提示
    if (dateHint === '昨天') {
      day -= 1;
    } else if (dateHint === '前天') {
      day -= 2;
    } else if (dateHint && /^\d{4}-\d{2}-\d{2}$/.test(dateHint)) {
      const parts = dateHint.split('-');
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10) - 1;
      day = parseInt(parts[2], 10);
    } else if (dateHint && /^\d{1,2}月\d{1,2}日$/.test(dateHint)) {
      const match = dateHint.match(/(\d{1,2})月(\d{1,2})日/);
      if (match) {
        month = parseInt(match[1], 10) - 1;
        day = parseInt(match[2], 10);
      }
    }

    // 解析时间部分
    const timeMatch = timeStr.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (!timeMatch) return null;

    const hours = parseInt(timeMatch[1], 10);
    const minutes = parseInt(timeMatch[2], 10);
    const seconds = timeMatch[3] ? parseInt(timeMatch[3], 10) : 0;

    const date = new Date(year, month, day, hours, minutes, seconds);
    return date.getTime();
  } catch {
    return null;
  }
}

// ============================================================
// 系统消息过滤
// ============================================================

/**
 * 判断消息内容是否为系统消息（需要过滤掉）
 * @param {string} content - 消息内容
 * @returns {boolean} 是否为系统消息
 * @private
 */
function _isSystemMessage(content) {
  if (!content) return false;
  const trimmed = content.trim();
  return SYSTEM_MESSAGE_KEYWORDS.some((keyword) => trimmed.includes(keyword));
}

// ============================================================
// 后处理
// ============================================================

/**
 * 对解析结果进行后处理：过滤系统消息、空内容等
 * @param {Object[]} messages - 原始解析消息列表
 * @returns {Object[]} 处理后的消息列表
 * @private
 */
function _postProcess(messages) {
  return messages.filter((msg) => {
    const content = (msg.content || '').trim();

    // 过滤空内容
    if (!content) return false;

    // 过滤系统消息
    if (_isSystemMessage(content)) return false;

    // 过滤纯图片/表情占位符消息（保留包含文字+占位符的混合消息）
    const isOnlyPlaceholder = MEDIA_PLACEHOLDERS.some(
      (p) => content === p
    );
    // 纯占位符消息也保留，因为用户可能需要参考
    // 只过滤系统消息和空内容

    return true;
  }).map((msg) => ({
    ...msg,
    content: (msg.content || '').trim(),
  }));
}

// ============================================================
// 主解析逻辑
// ============================================================

/**
 * 按照检测到的格式逐行解析消息
 * @param {string[]} lines - 预处理后的行数组
 * @param {string} format - 检测到的格式类型
 * @returns {Object} 包含 messages 和 errors 的解析结果
 * @private
 */
function _parseLines(lines, format) {
  /** @type {Object[]} 解析后的消息列表 */
  const messages = [];

  /** @type {Object|null} 当前正在构建的消息 */
  let currentMessage = null;

  /** @type {string|null} 上一个发送者（用于时间行场景） */
  let lastSender = null;

  /** @type {string|null} 上一个日期提示（用于微信带日期格式） */
  let lastDateHint = null;

  /** @type {Object[]} 解析错误列表 */
  const errors = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    // 跳过纯空行
    if (!line.trim()) {
      continue;
    }

    // ---- QQ 格式解析 ----
    if (format === 'qq') {
      const qqMatch = PATTERNS.qq_header.exec(line);
      if (qqMatch) {
        // 保存上一条消息
        if (currentMessage && currentMessage.content.trim()) {
          messages.push(currentMessage);
        }
        const time = qqMatch[1];
        const sender = qqMatch[2].trim();
        currentMessage = {
          sender,
          content: '',
          timestamp: _parseTimestamp(time),
          rawLine: line,
          lineNumber,
        };
        lastSender = sender;
        continue;
      }
    }

    // ---- 微信标准格式 / 钉钉飞书格式解析 ----
    if (format === 'wechat' || format === 'dingtalk') {
      // 先检查是否为微信带日期行（如 "昨天 10:23"）
      const dateHeaderMatch = PATTERNS.wechat_date_header.exec(line);
      if (dateHeaderMatch) {
        // 保存上一条消息
        if (currentMessage && currentMessage.content.trim()) {
          messages.push(currentMessage);
        }
        lastDateHint = dateHeaderMatch[1];
        const time = dateHeaderMatch[2];
        // 日期行可能后面跟 "名称: 内容" 格式
        currentMessage = {
          sender: lastSender || '未知',
          content: '',
          timestamp: _parseTimestamp(time, lastDateHint),
          rawLine: line,
          lineNumber,
        };
        continue;
      }

      // 检查微信标准 header（名称 + 时间）
      const wechatMatch = PATTERNS.wechat_header.exec(line);
      if (wechatMatch) {
        // 保存上一条消息
        if (currentMessage && currentMessage.content.trim()) {
          messages.push(currentMessage);
        }
        const sender = wechatMatch[1].trim();
        const time = wechatMatch[2];
        currentMessage = {
          sender,
          content: '',
          timestamp: _parseTimestamp(time, lastDateHint),
          rawLine: line,
          lineNumber,
        };
        lastSender = sender;
        lastDateHint = null; // 重置日期提示
        continue;
      }

      // 检查冒号格式（名称: 内容）
      const colonMatch = PATTERNS.colon_format.exec(line);
      if (colonMatch) {
        // 保存上一条消息
        if (currentMessage && currentMessage.content.trim()) {
          messages.push(currentMessage);
        }
        const sender = colonMatch[1].trim();
        const content = colonMatch[2].trim();
        currentMessage = {
          sender,
          content,
          timestamp: undefined,
          rawLine: line,
          lineNumber,
        };
        lastSender = sender;
        messages.push(currentMessage);
        currentMessage = null;
        continue;
      }

      // 检查时间独立行
      if (PATTERNS.time_only.test(line)) {
        if (currentMessage && currentMessage.content.trim()) {
          messages.push(currentMessage);
        }
        currentMessage = {
          sender: lastSender || '未知',
          content: '',
          timestamp: _parseTimestamp(line.trim()),
          rawLine: line,
          lineNumber,
        };
        continue;
      }
    }

    // ---- 未知格式降级解析 ----
    if (format === 'unknown') {
      // 尝试冒号格式
      const colonMatch = PATTERNS.colon_format.exec(line);
      if (colonMatch) {
        if (currentMessage && currentMessage.content.trim()) {
          messages.push(currentMessage);
        }
        currentMessage = {
          sender: colonMatch[1].trim(),
          content: colonMatch[2].trim(),
          timestamp: undefined,
          rawLine: line,
          lineNumber,
        };
        lastSender = currentMessage.sender;
        messages.push(currentMessage);
        currentMessage = null;
        continue;
      }
    }

    // ---- 通用：当前行是消息内容（非 header 行） ----
    if (currentMessage) {
      // 追加到当前消息内容
      currentMessage.content += (currentMessage.content ? '\n' : '') + line.trim();
    } else {
      // 没有当前消息上下文，作为未知发送者的独立消息
      errors.push({
        line: lineNumber,
        type: 'unrecognized_sender',
        raw: line,
      });
      currentMessage = {
        sender: '未知',
        content: line.trim(),
        timestamp: undefined,
        rawLine: line,
        lineNumber,
      };
    }
  }

  // 保存最后一条消息
  if (currentMessage && currentMessage.content.trim()) {
    messages.push(currentMessage);
  }

  return { messages, errors };
}

// ============================================================
// ContextParser 公共 API
// ============================================================

/**
 * 上下文解析器
 * @namespace ContextParser
 */
const ContextParser = {

  /**
   * 解析原始聊天文本为结构化消息数组
   *
   * @param {string} rawText - 用户粘贴的原始聊天文本
   * @returns {Object} 解析结果对象
   * @returns {boolean} result.success - 解析是否成功（至少解析出 1 条有效消息）
   * @returns {Object[]} result.messages - 解析出的消息列表
   * @returns {string[]} result.senders - 检测到的所有发送者名称（去重，保持首次出现顺序）
   * @returns {string} result.format - 检测到的格式类型：'wechat' | 'qq' | 'dingtalk' | 'unknown'
   * @returns {Object[]} result.errors - 解析过程中的错误/警告列表
   *
   * @example
   * const result = ContextParser.parse(`张三 10:23\n在吗？\n\n李四 10:24\n在的`);
   * // result = {
   * //   success: true,
   * //   messages: [
   * //     { sender: '张三', content: '在吗？', timestamp: ..., rawLine: '张三 10:23', lineNumber: 1 },
   * //     { sender: '李四', content: '在的', timestamp: ..., rawLine: '李四 10:24', lineNumber: 4 }
   * //   ],
   * //   senders: ['张三', '李四'],
   * //   format: 'wechat',
   * //   errors: []
   * // }
   */
  parse(rawText) {
    try {
      // ---- 1. 预处理 ----
      if (typeof rawText !== 'string' || rawText.trim().length === 0) {
        return {
          success: false,
          messages: [],
          senders: [],
          format: 'unknown',
          errors: [{ line: 0, type: 'empty_content', raw: '' }],
        };
      }

      // 统一换行符，按行分割，过滤纯空行
      const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const lines = text.split('\n').filter((line) => line.trim().length > 0);

      if (lines.length === 0) {
        return {
          success: false,
          messages: [],
          senders: [],
          format: 'unknown',
          errors: [{ line: 0, type: 'empty_content', raw: '' }],
        };
      }

      // ---- 2. 格式检测 ----
      const { format } = _detectFormat(lines);

      // ---- 3. 逐行解析 ----
      const { messages, errors } = _parseLines(lines, format);

      // ---- 4. 后处理 ----
      const filteredMessages = _postProcess(messages);

      // ---- 5. 提取去重的发送者列表（保持首次出现顺序） ----
      const senderSet = new Set();
      const senders = [];
      for (const msg of filteredMessages) {
        if (!senderSet.has(msg.sender)) {
          senderSet.add(msg.sender);
          senders.push(msg.sender);
        }
      }

      // ---- 6. 判定解析是否成功 ----
      const success = filteredMessages.length > 0;

      return {
        success,
        messages: filteredMessages,
        senders,
        format,
        errors: success ? [] : errors,
      };
    } catch (error) {
      // 解析过程中发生异常，不抛出，返回失败结果
      console.error('ContextParser.parse: 解析异常', error);
      return {
        success: false,
        messages: [],
        senders: [],
        format: 'unknown',
        errors: [{ line: 0, type: 'empty_content', raw: String(error.message) }],
      };
    }
  },

  /**
   * 检测文本的聊天格式类型（不执行完整解析，仅检测格式）
   *
   * @param {string} rawText - 原始聊天文本
   * @returns {string} 格式类型：'wechat' | 'qq' | 'dingtalk' | 'unknown'
   *
   * @example
   * const format = ContextParser.detectFormat('[10:23:15] 张三\n在吗？');
   * // format = 'qq'
   */
  detectFormat(rawText) {
    if (typeof rawText !== 'string' || rawText.trim().length === 0) {
      return 'unknown';
    }

    const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = text.split('\n').filter((line) => line.trim().length > 0);
    const { format } = _detectFormat(lines);
    return format;
  },

  /**
   * 手动解析单行消息（高级用法）
   * 使用指定的正则模式解析单行文本，提取发送者和内容。
   * 适用于需要自定义解析逻辑的场景。
   *
   * @param {string} line - 单行文本
   * @param {RegExp} pattern - 用于匹配的正则表达式
   * @returns {Object|null} 解析结果对象（包含 sender、content、timestamp 等），
   *                        匹配失败时返回 null
   *
   * @example
   * const result = ContextParser.parseLine('张三 10:23', PATTERNS.wechat_header);
   * // result = { sender: '张三', time: '10:23' }
   */
  parseLine(line, pattern) {
    if (!line || !pattern) return null;

    const match = pattern.exec(line);
    if (!match) return null;

    // 根据不同的模式返回不同的解析结果
    if (pattern === PATTERNS.wechat_header) {
      return {
        sender: (match[1] || '').trim(),
        time: match[2] || null,
        content: null,
      };
    }

    if (pattern === PATTERNS.qq_header) {
      return {
        time: match[1] || null,
        sender: (match[2] || '').trim(),
        content: null,
      };
    }

    if (pattern === PATTERNS.colon_format) {
      return {
        sender: (match[1] || '').trim(),
        content: (match[2] || '').trim(),
        time: null,
      };
    }

    // 通用模式：返回所有捕获组
    return {
      groups: match.slice(1),
      fullMatch: match[0],
    };
  },

  /**
   * 获取当前支持的正则规则库（用于调试和测试）
   * @returns {Object.<string, RegExp>} 正则表达式规则库的副本
   */
  getPatterns() {
    return { ...PATTERNS };
  },

  /**
   * 获取当前配置的系统消息关键词列表（用于调试和测试）
   * @returns {string[]} 系统消息关键词数组的副本
   */
  getSystemKeywords() {
    return [...SYSTEM_MESSAGE_KEYWORDS];
  },

  /**
   * 获取当前配置的媒体占位符列表（用于调试和测试）
   * @returns {string[]} 媒体占位符数组的副本
   */
  getMediaPlaceholders() {
    return [...MEDIA_PLACEHOLDERS];
  },
};

export { ContextParser };
