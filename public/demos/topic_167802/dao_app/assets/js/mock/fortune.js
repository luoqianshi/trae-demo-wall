/* Mock：今日运势 / 卦辞 */
(function (App) {
  'use strict';

  var FORTUNES = [
    { level: '大吉', luck: '紫气东来', good: ['静修', '早起', '拜访贵人'], bad: ['争执', '熬夜'], word: '云开见月明，诸事皆可为。' },
    { level: '中吉', luck: '风调雨顺', good: ['读书', '锻炼', '整理'], bad: ['冲动消费'], word: '守正而行，稳中有进。' },
    { level: '平', luck: '守常养气', good: ['冥想', '记录'], bad: ['远行', '签约'], word: '不急不躁，静待时机。' },
    { level: '小吉', luck: '柳暗花明', good: ['沟通', '尝试新事'], bad: ['轻信'], word: '柔可克刚，顺势而为。' },
    { level: '宜谨慎', luck: '潜龙勿用', good: ['独处', '休养'], bad: ['决断', '借贷'], word: '藏器于身，待时而动。' }
  ];

  // 每天固定一个运势（按日期种子）
  function getDailyFortune() {
    return App.delay(300).then(function () {
      var rnd = App.seededRandom(App.Store.today() + '|fortune');
      var f = FORTUNES[Math.floor(rnd() * FORTUNES.length)];
      return f;
    });
  }

  App.Mock = App.Mock || {};
  App.Mock.getDailyFortune = getDailyFortune;
})(window.App);
