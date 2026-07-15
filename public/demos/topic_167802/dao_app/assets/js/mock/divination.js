/* Mock：卜 · 易经占卜（数字卦 + 卦辞建议） */
(function (App) {
  'use strict';

  // 八卦
  var BAGUA = {
    '111': { name: '乾', symbol: '☰', nature: '天' },
    '011': { name: '兑', symbol: '☱', nature: '泽' },
    '101': { name: '离', symbol: '☲', nature: '火' },
    '001': { name: '震', symbol: '☳', nature: '雷' },
    '110': { name: '巽', symbol: '☴', nature: '风' },
    '010': { name: '坎', symbol: '☵', nature: '水' },
    '100': { name: '艮', symbol: '☶', nature: '山' },
    '000': { name: '坤', symbol: '☷', nature: '地' }
  };

  // 部分常见卦象的启发式判词（Demo 取样）
  var JUDGE = [
    { key: '乾乾', name: '乾为天', word: '天行健，君子以自强不息。', advice: '时机刚健，宜进取，但需守正防亢。', luck: '吉' },
    { key: '坤坤', name: '坤为地', word: '地势坤，君子以厚德载物。', advice: '宜柔顺承载，积累而后发，不宜争先。', luck: '吉' },
    { key: '坎坎', name: '坎为水', word: '水洊至，习坎。', advice: '前路有险，宜谨慎守信，稳中求进。', luck: '慎' },
    { key: '离离', name: '离为火', word: '明两作，离。', advice: '宜借势而明，附丽正道，防急躁。', luck: '中吉' },
    { key: '震震', name: '震为雷', word: '洊雷，震。', advice: '事有惊动，处变不惊者得安。', luck: '中' },
    { key: '艮艮', name: '艮为山', word: '兼山，艮。', advice: '宜止则止，知止而后有定。', luck: '平' },
    { key: '巽巽', name: '巽为风', word: '随风，巽。', advice: '宜顺势渐进，谦逊则通达。', luck: '中吉' },
    { key: '兑兑', name: '兑为泽', word: '丽泽，兑。', advice: '宜和悦沟通，喜中防轻信。', luck: '吉' }
  ];

  var GENERIC = [
    { word: '否极泰来，静候转机。', advice: '当下宜守，蓄力待时，转机将至。', luck: '中' },
    { word: '水到渠成，顺势而为。', advice: '条件渐熟，宜顺势推进，不必强求。', luck: '吉' },
    { word: '慎始敬终，防微杜渐。', advice: '细节决定成败，谨慎处理眼前小事。', luck: '慎' },
    { word: '厚积薄发，稳中求进。', advice: '积累尚未足，宜沉潜精进而非冒进。', luck: '平' },
    { word: '和光同尘，以退为进。', advice: '不争之争，退一步反得回旋余地。', luck: '中吉' }
  ];

  function trigram(rnd) {
    var b = '';
    for (var i = 0; i < 3; i++) b += (rnd() > 0.5 ? '1' : '0');
    return BAGUA[b];
  }

  // question 可空（快速卜）
  function castHexagram(question) {
    return App.delay(900).then(function () {
      var seed = Date.now() + '|' + (question || 'quick') + '|' + Math.random();
      var rnd = App.seededRandom(seed);
      var upper = trigram(rnd);
      var lower = trigram(rnd);
      var key = upper.name + lower.name;
      var judge = null;
      for (var i = 0; i < JUDGE.length; i++) { if (JUDGE[i].key === key) { judge = JUDGE[i]; break; } }
      if (!judge) {
        var g = GENERIC[Math.floor(rnd() * GENERIC.length)];
        judge = { name: upper.nature + lower.nature + '之象', word: g.word, advice: g.advice, luck: g.luck };
      }
      // 动爻
      var movingLine = 1 + Math.floor(rnd() * 6);
      return {
        question: question || '',
        upper: upper, lower: lower,
        name: judge.name,
        word: judge.word,
        advice: judge.advice,
        luck: judge.luck,
        movingLine: movingLine,
        time: Date.now()
      };
    });
  }

  App.Mock = App.Mock || {};
  App.Mock.castHexagram = castHexagram;
})(window.App);
