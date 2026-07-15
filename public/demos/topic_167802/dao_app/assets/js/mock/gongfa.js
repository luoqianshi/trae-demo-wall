/* Mock：山 · 功法数据 */
(function (App) {
  'use strict';

  var GONGFA = [
    {
      id: 'baduanjin', name: '八段锦', level: '入门', duration: 8, reward: 15,
      desc: '传统导引养生功法，八式舒展经络、调和气血，适合每日晨练。',
      steps: [
        '两手托天理三焦', '左右开弓似射雕', '调理脾胃须单举',
        '五劳七伤往后瞧', '摇头摆尾去心火', '两手攀足固肾腰',
        '攒拳怒目增气力', '背后七颠百病消'
      ]
    },
    {
      id: 'wuqinxi', name: '五禽戏', level: '进阶', duration: 12, reward: 22, needRealm: 1,
      desc: '模仿虎、鹿、熊、猿、鸟五种动物的导引术，舒筋活络、强健脏腑。',
      steps: ['虎举虎扑', '鹿抵鹿奔', '熊运熊晃', '猿提猿摘', '鸟伸鸟飞']
    },
    {
      id: 'wuxingquan', name: '五行拳', level: '进阶', duration: 15, reward: 26, needRealm: 2,
      desc: '以劈、崩、钻、炮、横对应金木水火土，练意练气，刚柔并济。',
      steps: ['劈拳属金', '崩拳属木', '钻拳属水', '炮拳属火', '横拳属土']
    },
    {
      id: 'liuzijue', name: '六字诀', level: '入门', duration: 6, reward: 12,
      desc: '以嘘、呵、呼、呬、吹、嘻六字吐纳，配合呼吸调理对应脏腑。',
      steps: ['嘘字疏肝', '呵字养心', '呼字健脾', '呬字润肺', '吹字固肾', '嘻字理三焦']
    },
    {
      id: 'yijinjing', name: '易筋经', level: '高阶', duration: 18, reward: 32, needRealm: 3,
      desc: '内壮筋骨、外练形体的经典功法，动作沉稳，重在筋膜伸展与呼吸配合。',
      steps: ['韦驮献杵', '横担降魔杵', '掌托天门', '摘星换斗', '倒拽九牛尾', '出爪亮翅', '九鬼拔马刀', '三盘落地']
    }
  ];

  function getGongfaList() {
    return App.delay().then(function () { return GONGFA.slice(); });
  }
  function getGongfaDetail(id) {
    return App.delay(200).then(function () {
      return GONGFA.filter(function (g) { return g.id === id; })[0] || null;
    });
  }

  App.Mock = App.Mock || {};
  App.Mock.getGongfaList = getGongfaList;
  App.Mock.getGongfaDetail = getGongfaDetail;
  App.Mock.GONGFA = GONGFA;
})(window.App);
