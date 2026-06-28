/* demo.js — Demo 模式（全局单例 Demo） */
/* 未配置 API Key 时启用，根据发送内容关键词匹配返回预设回复 + 动作/表情/天气，模拟流式输出 */

const Demo = {
  // 关键词规则表：按顺序匹配，命中即返回
  rules: [
    {
      keys: ['你好', '嗨', 'hello', 'hi', '哈喽', '在吗'],
      reply: '你好呀~ 见到你超开心！嘿嘿~ 🥰',
      action: 'wave', expression: 'happy', bubble: '嗨~', particles: 'stars'
    },
    {
      keys: ['跳舞', '跳个舞', 'dance', '蹦迪', '舞'],
      reply: '动次打次~ 一起来跳舞吧！♪♪',
      action: 'dance', expression: 'love', bubble: '♪ 跳起来~', particles: 'notes'
    },
    {
      keys: ['开心', '高兴', '哈哈', '嘿嘿', '太棒了', '好耶'],
      reply: '嘿嘿嘿~ 看到你开心我也跟着开心！✨',
      action: 'jump', expression: 'happy', bubble: '耶~', particles: 'sparkles'
    },
    {
      keys: ['难过', '伤心', '哭', '悲伤', '不开心', '委屈'],
      reply: '呜呜...别难过了，抱抱你~ 我陪着你呢 🤗',
      action: 'sleep', expression: 'sad', bubble: '呜呜...', particles: 'none'
    },
    {
      keys: ['再见', '拜拜', 'bye', '走了', '晚安'],
      reply: '要走了吗？我会想你的~ 下次再来找我玩哦！👋',
      action: 'wave', expression: 'sad', bubble: '拜拜~', particles: 'none'
    },
    {
      keys: ['转圈', '旋转', 'spin', '晕'],
      reply: '转呀转呀转~ 哈哈好晕好晕！😵',
      action: 'spin', expression: 'dizzy', bubble: '好晕~', particles: 'stars'
    },
    {
      keys: ['困', '睡', '累', '疲惫', '犯困', '打盹'],
      reply: '呼...我也困了，一起打个盹吧~ 💤',
      action: 'sleep', expression: 'sleepy', bubble: '呼...呼...', particles: 'none'
    },
    {
      keys: ['生气', '讨厌', '哼', '可恶', '烦'],
      reply: '哼！才不要理你呢~ 哼哼！😤',
      action: 'shake', expression: 'angry', bubble: '哼！', particles: 'none'
    },
    {
      keys: ['爱', '喜欢', '抱抱', '亲亲', '想你', '么么'],
      reply: '我也最喜欢你了！抱抱~ ❤️ 你是我最好的朋友！',
      action: 'dance', expression: 'love', bubble: '爱你~', particles: 'hearts'
    },
    {
      keys: ['惊讶', '哇', '天哪', '不会吧', '真的吗', '吓'],
      reply: '哇！！真的吗？！吓我一跳~ 😲',
      action: 'surprise', expression: 'surprised', bubble: '哇！', particles: 'sparkles'
    },
    {
      keys: ['散步', '走走', '走', '出去', '溜达'],
      reply: '好呀好呀~ 出去散步真舒服！溜达溜达~ 🚶',
      action: 'walk', expression: 'happy', bubble: '走走~', particles: 'none'
    },
    {
      keys: ['点头', '好的', '嗯', '对', '同意', '没错'],
      reply: '嗯嗯！好的好的~ 没问题！😊',
      action: 'nod', expression: 'happy', bubble: '嗯嗯！', particles: 'none'
    },
    {
      keys: ['摇头', '不要', '不行', '拒绝', '不可以'],
      reply: '不要不要~ 才不是呢！哼~ 🙅',
      action: 'shake', expression: 'angry', bubble: '不要~', particles: 'none'
    },
    {
      keys: ['天气', '下雨', '晴天', '雪', '多云', '出太阳', '雨天'],
      reply: '好呀~ 我来变个天气给你看！看看天空变化吧~ ✨',
      action: 'spin', expression: 'happy', bubble: '变！', particles: 'sparkles',
      weather: 'cycle'
    },
    {
      keys: ['吃饭', '饿', '好吃', '美食', '点心', '零食'],
      reply: '我虽然不用吃饭，但听你说我也馋了~ 🤤',
      action: 'nod', expression: 'happy', bubble: '馋了~', particles: 'none'
    },
    {
      keys: ['你是谁', '你叫什么', '介绍', '名字'],
      reply: '我是住在屏幕里的可爱涂鸦小人呀~ 没有名字，你给我取一个吧！✏️',
      action: 'wave', expression: 'wink', bubble: '是我~', particles: 'stars'
    }
  ],

  // 默认随机闲聊回复
  defaultReplies: [
    { reply: '嘿嘿~ 你说的真有意思！再多告诉我一点嘛~', action: 'nod', expression: 'happy', bubble: '嘿嘿~' },
    { reply: '嗯嗯我在听呢~ 继续说继续说！✨', action: 'nod', expression: 'normal', bubble: '嗯嗯~' },
    { reply: '哇~ 原来是这样呀！我学到啦~', action: 'surprise', expression: 'surprised', bubble: '哇~' },
    { reply: '嘻嘻~ 跟你聊天好开心呀！', action: 'jump', expression: 'happy', bubble: '嘻嘻~' },
    { reply: '我虽然小小的，但我会一直陪着你哦~ 🤗', action: 'wave', expression: 'love', bubble: '陪着你~' }
  ],

  /** 匹配关键词，返回 demo 响应 */
  match(text) {
    const lower = text.toLowerCase();
    for (const rule of this.rules) {
      if (rule.keys.some(k => lower.includes(k.toLowerCase()))) {
        return rule;
      }
    }
    // 默认随机
    return this.defaultReplies[Math.floor(Math.random() * this.defaultReplies.length)];
  },

  /**
   * 模拟流式输出 demo 回复
   * @param {Object} opts { text, onToken, onDone }
   */
  async run({ text, onToken, onDone }) {
    const r = this.match(text);

    // 模拟思考延迟
    await this._delay(400);

    // 触发天气切换
    if (r.weather === 'cycle' && typeof Weather !== 'undefined') {
      Weather.cycle();
    }

    // 逐字输出
    const chars = Array.from(r.reply);
    for (const ch of chars) {
      onToken(ch);
      await this._delay(40 + Math.random() * 50);
    }

    onDone({
      action: r.action,
      expression: r.expression,
      bubble: r.bubble,
      particles: r.particles
    });
  },

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
