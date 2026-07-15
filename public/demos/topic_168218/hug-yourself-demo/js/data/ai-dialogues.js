/**
 * AI对话脚本数据与模拟对话引擎
 *
 * 提供完整的对话流定义（DIALOGUE_FLOWS）和模拟对话引擎类（AIChatEngine），
 * 用于在前端模拟AI聊天的完整交互流程，无需真实后端服务。
 *
 * 对话流设计：
 * - greeting: 开场问候，引导用户表达
 * - analyzing: 分析中过渡提示
 * - typeA_response: 反复思考型 → 建议CBT三栏法
 * - typeB_response: 人际关系型 → 建议课题分离
 * - typeC_response: 自我攻击型 → 建议CBT三栏法
 * - typeD_response: 情绪过载型 → 建议抱抱自己呼吸
 */
'use strict';

// ============================================================
// 1. 对话流定义
// ============================================================

const DIALOGUE_FLOWS = {
  /**
   * 开场问候
   * 用户首次进入对话时的欢迎消息序列。
   */
  greeting: {
    messages: [
      {
        id: 'greeting-1',
        text: '嗨，我是抱抱自己助手。感觉你今天好像有些心事？',
        delay: 0
      },
      {
        id: 'greeting-2',
        text: '你可以随时和我聊聊，不用有压力。不管是什么事情，说出来都会好一些。',
        delay: 1500
      },
      {
        id: 'greeting-3',
        text: '你愿意告诉我，今天发生了什么吗？',
        delay: 2000,
        action: 'show-input'
      }
    ]
  },

  /**
   * 分析中提示
   * 在用户输入后、AI正式回应前显示，营造等待感。
   */
  analyzing: {
    messages: [
      {
        id: 'analyzing-1',
        text: '让我想想…',
        delay: 300
      },
      {
        id: 'analyzing-2',
        text: '我好像感觉到了一些东西。',
        delay: 1000
      },
      {
        id: 'analyzing-3',
        text: '嗯，是这种感觉吗？',
        delay: 1200,
        action: 'emotion-reveal'
      }
    ]
  },

  /**
   * 反复思考型（typeA）响应
   * 用户反复沉浸在某件事情中无法自拔 → 建议CBT三栏法记录。
   */
  typeA_response: {
    messages: [
      {
        id: 'typeA-1',
        text: '听起来，你的脑海里一直在反复播放这件事，对吗？',
        delay: 600
      },
      {
        id: 'typeA-2',
        text: '这种"反复思考"其实很消耗能量，就像大脑卡在了一个循环里。',
        delay: 1800
      },
      {
        id: 'typeA-3',
        text: '我们可以试试用CBT三栏法来打破这个循环，把想法写下来，换个角度看。',
        delay: 2200
      },
      {
        id: 'typeA-4',
        text: '要不要一起试试看？写下来之后，你会发现自己还有别的选择。',
        delay: 2000,
        action: 'open-cbt-form'
      }
    ]
  },

  /**
   * 人际关系型（typeB）响应
   * 用户对他人评价敏感、害怕拒绝 → 建议课题分离练习。
   */
  typeB_response: {
    messages: [
      {
        id: 'typeB-1',
        text: '听上去，你很在意别人对你的看法，也害怕让对方失望，对吗？',
        delay: 600
      },
      {
        id: 'typeB-2',
        text: '其实，你有这样的感受是很正常的。我们总是希望被喜欢、被接纳。',
        delay: 1800
      },
      {
        id: 'typeB-3',
        text: '不过，有一件事很重要——别人的情绪和反应，是他们的课题，不是你的。',
        delay: 2000
      },
      {
        id: 'typeB-4',
        text: '我们可以做一个"课题分离"的小练习，帮你区分什么是你的事，什么是别人的事。',
        delay: 2200,
        action: 'open-boundary-scissors'
      }
    ]
  },

  /**
   * 自我攻击型（typeC）响应
   * 用户自我否定、过度自责 → 建议CBT三栏法。
   */
  typeC_response: {
    messages: [
      {
        id: 'typeC-1',
        text: '我听到你说了一些很严厉的话——那些话是对自己说的，对吗？',
        delay: 600
      },
      {
        id: 'typeC-2',
        text: '当我们在低落的时候，内心那个"批评者"就会变得特别大声。',
        delay: 1800
      },
      {
        id: 'typeC-3',
        text: '但那些声音未必是真实的。我们可以用CBT三栏法，试着把这些想法拿出来看一看。',
        delay: 2000
      },
      {
        id: 'typeC-4',
        text: '一起写下来好吗？你值得对自己温柔一点。',
        delay: 2000,
        action: 'open-cbt-form'
      }
    ]
  },

  /**
   * 情绪过载型（typeD）响应
   * 用户情绪强烈、接近崩溃 → 建议先做呼吸练习，安抚情绪。
   */
  typeD_response: {
    messages: [
      {
        id: 'typeD-1',
        text: '听起来你现在很难受，情绪像潮水一样涌上来，对吗？',
        delay: 600
      },
      {
        id: 'typeD-2',
        text: '没关系的，你先深呼吸一下——我在这里陪着你。',
        delay: 1600
      },
      {
        id: 'typeD-3',
        text: '现在，我们先不急着分析问题。先让情绪平复下来，好吗？',
        delay: 2000
      },
      {
        id: 'typeD-4',
        text: '来，我们一起做一个呼吸练习，让自己慢慢回到当下。',
        delay: 1800,
        action: 'open-breathing'
      }
    ]
  }
};

// ============================================================
// 2. AIChatEngine 模拟对话引擎
// ============================================================

class AIChatEngine {
  /**
   * @param {Object} [options] - 配置项
   * @param {number} [options.typingSpeed=40] - 打字机速度（毫秒/字符）
   * @param {number} [options.minTypingDelay=500] - 最小打字延迟（毫秒）
   * @param {number} [options.maxTypingDelay=3000] - 最大打字延迟（毫秒）
   */
  constructor(options = {}) {
    this.typingSpeed = options.typingSpeed || 40;       // 每字符耗时
    this.minTypingDelay = options.minTypingDelay || 500; // 最小等待
    this.maxTypingDelay = options.maxTypingDelay || 3000; // 最大等待
    this.emotionPatterns = null;  // 由外部注入 EMOTION_PATTERNS
    this.onMessage = null;        // 回调: (message) => void
    this.onAction = null;         // 回调: (action) => void
    this.onTyping = null;         // 回调: (char, index, total) => void
    this._stopFlag = false;      // 停止标记
  }

  /**
   * 注入情绪模式数据
   * @param {Object} patterns - EMOTION_PATTERNS 对象
   */
  setEmotionPatterns(patterns) {
    this.emotionPatterns = patterns;
  }

  /**
   * 设置消息回调
   * @param {Function} onMessage - 收到完整消息时触发
   * @param {Function} [onAction] - 收到动作指令时触发
   * @param {Function} [onTyping] - 打字机逐字输出时触发
   */
  setCallbacks(onMessage, onAction, onTyping) {
    this.onMessage = onMessage;
    this.onAction = onAction;
    this.onTyping = onTyping;
  }

  // ----------------------------------------------------------
  // 2.1 情绪检测
  // ----------------------------------------------------------

  /**
   * 通过关键词匹配检测用户输入的情绪类型
   * @param {string} text - 用户输入文本
   * @returns {string|null} - 匹配到的情绪类型键名，如 'typeA'；未匹配返回 null
   */
  detectEmotion(text) {
    if (!this.emotionPatterns || !text) return null;

    const normalized = text.toLowerCase();

    for (const [type, pattern] of Object.entries(this.emotionPatterns)) {
      for (const keyword of pattern.keywords) {
        if (normalized.includes(keyword.toLowerCase())) {
          return type;
        }
      }
    }

    return null;
  }

  /**
   * 分析用户输入，返回匹配的情绪类型（含权重信息）
   * @param {string} text - 用户输入文本
   * @returns {Object} - { type: string|null, matchedKeywords: string[], pattern: Object|null }
   */
  analyzeUserInput(text) {
    if (!this.emotionPatterns || !text) {
      return { type: null, matchedKeywords: [], pattern: null };
    }

    const normalized = text.toLowerCase();
    const results = [];

    for (const [type, pattern] of Object.entries(this.emotionPatterns)) {
      const matched = pattern.keywords.filter(kw => normalized.includes(kw.toLowerCase()));
      if (matched.length > 0) {
        results.push({ type, matchedKeywords: matched, pattern, score: matched.length });
      }
    }

    // 按匹配关键词数量降序排列，取最匹配的
    results.sort((a, b) => b.score - a.score);

    if (results.length > 0) {
      return {
        type: results[0].type,
        matchedKeywords: results[0].matchedKeywords,
        pattern: results[0].pattern,
        allMatches: results
      };
    }

    return { type: null, matchedKeywords: [], pattern: null, allMatches: [] };
  }

  /**
   * 处理用户输入（综合入口）
   * @param {string} text - 用户输入文本
   * @returns {Object} - { emotionType: string|null, analysis: Object, flow: Object|null }
   */
  processUserInput(text) {
    const analysis = this.analyzeUserInput(text);
    const flow = this.getResponseFlow(analysis.type);
    return {
      emotionType: analysis.type,
      analysis: analysis,
      flow: flow
    };
  }

  // ----------------------------------------------------------
  // 2.2 响应流获取
  // ----------------------------------------------------------

  /**
   * 获取情绪类型对应的响应对话流
   * @param {string} emotionType - 情绪类型键名（如 'typeA'）
   * @returns {Object|null} - 对话流对象，未匹配时返回 null
   */
  getResponseFlow(emotionType) {
    if (!emotionType) return null;

    const flowKey = emotionType + '_response';
    return DIALOGUE_FLOWS[flowKey] || null;
  }

  // ----------------------------------------------------------
  // 2.3 打字机效果
  // ----------------------------------------------------------

  /**
   * 计算文本打字机输出所需的总延迟（毫秒）
   * @param {string} text - 要输出的文本
   * @returns {number} - 总延迟毫秒数
   */
  _calculateTypingDuration(text) {
    const charTime = text.length * this.typingSpeed;
    return Math.min(Math.max(charTime, this.minTypingDelay), this.maxTypingDelay);
  }

  /**
   * 以打字机效果逐字输出一条消息
   * @param {Object} message - 消息对象 { id, text, delay, action }
   * @param {Function} [onTick] - 每输出一个字符的回调
   * @returns {Promise<void>}
   */
  async typeMessage(message, onTick) {
    if (this._stopFlag) return;

    const { text, delay: preDelay = 0, action } = message;

    // 消息前的等待延迟
    if (preDelay > 0) {
      await this._sleep(preDelay);
    }

    if (this._stopFlag) return;

    // 打字机逐字输出
    const chars = text.split('');
    let typed = '';

    for (let i = 0; i < chars.length; i++) {
      if (this._stopFlag) return;

      typed += chars[i];
      const progress = { char: chars[i], index: i, total: chars.length, typed };

      // 触发逐字回调
      if (typeof this.onTyping === 'function') {
        this.onTyping(progress);
      }
      if (typeof onTick === 'function') {
        onTick(progress);
      }

      // 标点符号后稍作停顿，模拟自然停顿
      const isPunctuation = /[，。！？、；：」』」]\s*$/.test(typed);
      const pause = isPunctuation ? this.typingSpeed * 4 : this.typingSpeed;
      await this._sleep(pause);
    }

    if (this._stopFlag) return;

    // 整句输出完成后，额外停顿
    await this._sleep(300);

    // 触发完整消息回调
    if (typeof this.onMessage === 'function') {
      this.onMessage({ ...message, typed });
    }

    // 如果有动作指令，触发动作回调
    if (action && typeof this.onAction === 'function') {
      this.onAction(action);
    }
  }

  /**
   * 播放整个对话流
   * @param {string} flowKey - 对话流键名（如 'greeting', 'typeA_response'）
   * @param {Object} [options]
   * @param {Function} [options.onTick] - 每字符回调
   * @returns {Promise<boolean>} - 是否成功完成
   */
  async playFlow(flowKey, options = {}) {
    const flow = DIALOGUE_FLOWS[flowKey];
    if (!flow) {
      console.warn(`[AIChatEngine] 未找到对话流: ${flowKey}`);
      return false;
    }

    this._stopFlag = false;

    for (const msg of flow.messages) {
      if (this._stopFlag) break;
      await this.typeMessage(msg, options.onTick);
    }

    return !this._stopFlag;
  }

  /**
   * 停止当前播放
   */
  stop() {
    this._stopFlag = true;
  }

  /**
   * 重置停止标记，允许重新播放
   */
  reset() {
    this._stopFlag = false;
  }

  // ----------------------------------------------------------
  // 2.4 工具方法
  // ----------------------------------------------------------

  /**
   * Promise 形式的延迟
   * @param {number} ms - 毫秒
   * @returns {Promise<void>}
   */
  _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// 导出（兼容 ESM 和全局）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { DIALOGUE_FLOWS, AIChatEngine };
}