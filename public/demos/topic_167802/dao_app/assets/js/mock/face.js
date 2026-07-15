/* Mock：相 · 面相观察（模拟扫描分析） */
(function (App) {
  'use strict';

  var QISE = ['红润有神', '明润', '略显疲态', '清朗', '沉静'];
  var STATES = [
    { part: '印堂', good: '开阔明亮，近期心境舒展', warn: '略显紧锁，或近日思虑偏多' },
    { part: '气色', good: '面色红润，精神饱满', warn: '气色偏淡，注意休息与补水' },
    { part: '眼神', good: '目光清亮，专注有神', warn: '眼神略疲，建议减少熬夜用眼' },
    { part: '三庭', good: '比例匀称，气度平和', warn: '略失均衡，可通过作息调养' }
  ];
  var ADVICE = [
    '近期宜早睡，晨起可做深呼吸，助气色回升。',
    '多接触自然光，保持心境舒朗，气色自佳。',
    '注意饮水与用眼节律，避免长时间屏幕疲劳。',
    '保持规律作息，情志平和，面相之气随心而转。'
  ];

  function analyzeFace(imageDataUrl) {
    // imageDataUrl 仅用于本地演示（真实实现会上传分析）；Demo 不做真实识别
    var hasImage = !!imageDataUrl;
    // 模拟较长的扫描分析
    return App.delay(1800).then(function () {
      var seed = App.Store.today() + '|' + (App.Store.get().faceRecords.length) + '|' + (hasImage ? '1' : '0');
      var rnd = App.seededRandom(seed);
      var score = 60 + Math.floor(rnd() * 38); // 60..97 状态分
      var items = STATES.map(function (s) {
        var isGood = rnd() > 0.4;
        return { part: s.part, text: isGood ? s.good : s.warn, good: isGood };
      });
      return {
        score: score,
        qise: QISE[Math.floor(rnd() * QISE.length)],
        items: items,
        advice: ADVICE[Math.floor(rnd() * ADVICE.length)],
        time: Date.now()
      };
    });
  }

  App.Mock = App.Mock || {};
  App.Mock.analyzeFace = analyzeFace;
})(window.App);
