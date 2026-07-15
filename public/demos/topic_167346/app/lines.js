/**
 * lines.js · 宠物台词库
 *
 * 严格来自 assets/pet/index.md §1.1~1.4（DS M1a 交付物），APP 不得自造。
 * §1.1 greet: 3+1 彩蛋（10% 概率）
 * §1.2 happy 普通 3 条 / satisfied 专属 2 条
 * §1.3 thirsty 4 条
 * §1.4 idle 4 条（低频出现）
 */

const LINES = {
  greet: {
    normal: [
      '欢迎回来～今天也要多喝水哦！',
      '叮！杯子回来啦。',
      '嗨主人，我等你好久啦。',
    ],
    easter: '你又来啦，摸摸头。',
    easterProb: 0.1,
  },
  happy: [
    '咕嘟咕嘟～舒服！',
    '又靠近目标一点点。',
    '感觉充满了能量！',
  ],
  satisfied: [
    '1500 ml 达成！我是满水小勇士！',
    '今天也是很努力的一天呢。',
  ],
  thirsty: [
    '主人，我口渴……',
    '水……需要水……',
    '杯子空了好久了 QAQ',
    '嘴巴干干的，帮我倒点水吧。',
  ],
  idle: [
    '...',
    '呼～呼～（发呆中）',
    '在这里陪你。',
    '有点无聊呢。',
  ],
};

export function pickLine(group) {
  if (group === 'greet') {
    if (Math.random() < LINES.greet.easterProb) return LINES.greet.easter;
    return pickRandom(LINES.greet.normal);
  }
  const arr = LINES[group];
  if (!Array.isArray(arr) || arr.length === 0) return '';
  return pickRandom(arr);
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
