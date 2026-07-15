/* Mock：医 · 养生保健 */
(function (App) {
  'use strict';

  // 24 节气（简化：按月份粗略映射当前节气）
  var TERMS = [
    '小寒', '大寒', '立春', '雨水', '惊蛰', '春分', '清明', '谷雨',
    '立夏', '小满', '芒种', '夏至', '小暑', '大暑', '立秋', '处暑',
    '白露', '秋分', '寒露', '霜降', '立冬', '小雪', '大雪', '冬至'
  ];

  var TERM_ADVICE = {
    '立春': '阳气初生，宜舒展肝气，早睡早起，多食甘味少食酸。',
    '夏至': '阳气至盛，宜养心静气，午间小憩，忌贪凉冷饮。',
    '立秋': '暑气渐消，宜润肺防燥，多饮温水，early to bed。',
    '冬至': '阴极阳生，宜藏精养肾，早卧晚起，温补为要。',
    '_default': '顺应节气，起居有常，饮食有节，情志平和。'
  };

  var TIPS = [
    { ico: '🍵', title: '晨起一杯温水', body: '唤醒脾胃，促进循环，胜过刚起床就饮冰。' },
    { ico: '🌙', title: '子时前入睡', body: '23 点前入睡有助养肝血，修复一日消耗。' },
    { ico: '🖐', title: '按揉合谷穴', body: '拇指食指之间，按压 1–2 分钟可缓解头面部不适。' },
    { ico: '🌿', title: '饭后百步走', body: '缓步 10 分钟助消化，忌饭后立即久坐。' },
    { ico: '☀️', title: '晒背养阳', body: '上午阳光晒背 15 分钟，温煦督脉、提振阳气。' },
    { ico: '🫁', title: '深长腹式呼吸', body: '吸气入腹、缓缓呼出，安神定志、降低焦躁。' }
  ];

  function currentTerm() {
    var m = new Date().getMonth(); // 0..11
    // 每月约对应两个节气，取当月第一个
    return TERMS[(m * 2) % 24];
  }

  function getHealthTips() {
    return App.delay().then(function () {
      var term = currentTerm();
      var advice = TERM_ADVICE[term] || TERM_ADVICE._default;
      // 每天固定 4 条贴士
      var rnd = App.seededRandom(App.Store.today() + '|tips');
      var pool = TIPS.slice();
      var out = [];
      while (out.length < 4 && pool.length) {
        out.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
      }
      return { term: term, advice: advice, tips: out };
    });
  }

  App.Mock = App.Mock || {};
  App.Mock.getHealthTips = getHealthTips;
})(window.App);
