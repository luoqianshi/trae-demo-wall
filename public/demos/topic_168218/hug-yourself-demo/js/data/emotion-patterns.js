/**
 * 情绪识别关键词映射
 * 
 * 定义四种核心情绪类型的识别关键词、对应建议工具和主题色。
 * 用于匹配用户输入文本，自动识别用户当前情绪类型并提供针对性回应。
 */
'use strict';

const EMOTION_PATTERNS = {
  typeA: {
    name: '反复思考型',
    keywords: ['一直想', '停不下来', '反复', '循环', '纠结', '忘不了', '脑海中', '不断', '重播'],
    followUp: 'cbt-form',
    color: '#E8A87C'
  },
  typeB: {
    name: '人际关系型',
    keywords: ['别人怎么看', '不敢拒绝', '讨好', '害怕评价', '社交', '关系', '同事', '朋友', '不喜欢我', '忽视', '不回复'],
    followUp: 'boundary-scissors',
    color: '#A8D5BA'
  },
  typeC: {
    name: '自我攻击型',
    keywords: ['我很差', '我不够好', '都是我的错', '废物', '讨厌自己', '自责', '内疚', '没用', '失败'],
    followUp: 'cbt-form',
    color: '#C38D94'
  },
  typeD: {
    name: '情绪过载型',
    keywords: ['崩溃', '受不了', '愤怒', '焦虑', '发抖', '喘不过气', '无法控制', '爆炸', '恐慌', '绝望'],
    followUp: 'breathing',
    color: '#D4A5A5'
  }
};

// 导出（兼容 ESM 和全局）
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EMOTION_PATTERNS };
}