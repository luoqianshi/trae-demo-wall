/* Mock：命 · 八字排盘（简化算法 + 白话解读） */
(function (App) {
  'use strict';

  var GAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
  var ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  // 天干五行
  var GAN_WX = ['木', '木', '火', '火', '土', '土', '金', '金', '水', '水'];
  var ZHI_WX = ['水', '土', '木', '木', '土', '火', '火', '土', '金', '金', '土', '水'];
  var WX_COLOR = { '金': '#d7aa43', '木': '#80b477', '水': '#5a9bd4', '火': '#bb6c45', '土': '#b59a5a' };

  var TIME_ZHI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

  // 简化排盘：以公历日期粗略推演（Demo 用，非严谨命理）
  function calcBazi(birth) {
    // birth: { date: 'yyyy-mm-dd', hour: 0..23, gender: 'male'|'female' }
    return App.delay(700).then(function () {
      var parts = birth.date.split('-');
      var y = parseInt(parts[0], 10), m = parseInt(parts[1], 10), d = parseInt(parts[2], 10);
      var hour = parseInt(birth.hour, 10) || 0;

      // 年柱：以 1984 甲子为基准
      var yGanIdx = ((y - 1984) % 10 + 10) % 10;
      var yZhiIdx = ((y - 1984) % 12 + 12) % 12;
      // 月柱、日柱：简化推导（保证同一输入稳定）
      var mGanIdx = (yGanIdx * 2 + m) % 10;
      var mZhiIdx = (m + 1) % 12;
      var days = Math.floor(new Date(y, m - 1, d).getTime() / 86400000);
      var dGanIdx = ((days + 9) % 10 + 10) % 10;
      var dZhiIdx = ((days + 1) % 12 + 12) % 12;
      // 时柱
      var hZhiIdx = Math.floor(((hour + 1) % 24) / 2) % 12;
      var hGanIdx = (dGanIdx * 2 + hZhiIdx) % 10;

      var pillars = [
        { label: '年柱', gan: GAN[yGanIdx], zhi: ZHI[yZhiIdx], gw: GAN_WX[yGanIdx], zw: ZHI_WX[yZhiIdx] },
        { label: '月柱', gan: GAN[mGanIdx], zhi: ZHI[mZhiIdx], gw: GAN_WX[mGanIdx], zw: ZHI_WX[mZhiIdx] },
        { label: '日柱', gan: GAN[dGanIdx], zhi: ZHI[dZhiIdx], gw: GAN_WX[dGanIdx], zw: ZHI_WX[dZhiIdx] },
        { label: '时柱', gan: GAN[hGanIdx], zhi: ZHI[hZhiIdx], gw: GAN_WX[hGanIdx], zw: ZHI_WX[hZhiIdx] }
      ];

      // 五行统计
      var wx = { '金': 0, '木': 0, '水': 0, '火': 0, '土': 0 };
      pillars.forEach(function (p) { wx[p.gw]++; wx[p.zw]++; });

      // 日主 + 缺失五行
      var dayMaster = GAN[dGanIdx] + '（' + GAN_WX[dGanIdx] + '）';
      var lacking = Object.keys(wx).filter(function (k) { return wx[k] === 0; });
      var strongest = Object.keys(wx).sort(function (a, b) { return wx[b] - wx[a]; })[0];

      var reading = buildReading(GAN_WX[dGanIdx], strongest, lacking, birth.gender);

      return {
        birth: birth,
        pillars: pillars,
        wx: wx,
        wxColor: WX_COLOR,
        dayMaster: dayMaster,
        strongest: strongest,
        lacking: lacking,
        reading: reading,
        timeName: TIME_ZHI[hZhiIdx] + '时'
      };
    });
  }

  function buildReading(dayWx, strongest, lacking, gender) {
    var traits = {
      '金': '果断、重情义，行事有原则，宜守亦宜攻。',
      '木': '仁厚、有生发之气，富创造力，宜舒展不宜压抑。',
      '水': '灵动、善思变通，智谋见长，宜静养以蓄势。',
      '火': '热情、行动力强，感染力佳，宜收敛急躁。',
      '土': '沉稳、重承诺，包容务实，宜灵活不失原则。'
    };
    var advice = lacking.length
      ? '命盘中' + lacking.join('、') + '偏弱，日常可在起居、饮食、色彩与作息上适当补益，取其平衡。'
      : '五行分布较为均衡，宜顺其自然、稳步精进。';
    var addr = gender === 'female' ? '此女命' : (gender === 'male' ? '此男命' : '此命');
    return {
      summary: addr + '日主为' + dayWx + '，' + traits[dayWx],
      strongest: '命盘中' + strongest + '气偏旺，做事带有' + strongest + '之性，注意过犹不及。',
      advice: advice
    };
  }

  App.Mock = App.Mock || {};
  App.Mock.calcBazi = calcBazi;
})(window.App);
