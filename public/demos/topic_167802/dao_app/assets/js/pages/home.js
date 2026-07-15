/* 首页 · 洞天（核心总览面板） */
(function (App) {
  'use strict';
  var h = App.h, UI = App.UI, Store = App.Store, go = null;

  function render() {
    go = App.Router.go;
    var st = Store.get();
    var rp = Store.realmProgress();
    var wrap = h('div');

    // 修行者卡（境界总览）
    wrap.appendChild(h('.cultivator', {}, [
      h('.row.between', {}, [
        h('div', {}, [
          h('.name', { text: st.name }),
          h('.realm', { text: '当前境界：' + rp.cur.name + ' · ' + rp.cur.sub })
        ]),
        h('.tag.gold', { text: '连续修行 ' + st.streak + ' 天' })
      ]),
      UI.progress(rp.pct),
      h('.row.between', { style: { marginTop: '0.4rem' } }, [
        h('span.small.muted', { text: '修为 ' + st.cultivation }),
        h('span.small.muted', { text: rp.next ? ('距 ' + rp.next.name + rp.next.sub + ' 还需 ' + rp.remain) : '已臻圆满' })
      ])
    ]));

    // 修行概况（四项统计，一眼看清排面）
    wrap.appendChild(h('.grid2', { style: { gridTemplateColumns: 'repeat(4,1fr)', gap: '0.5rem' } }, [
      stat('修为', st.cultivation),
      stat('功法', st.unlockedGongfa.length),
      stat('问卜', st.divinationLog.length),
      stat('命盘', st.baziRecords.length)
    ]));

    // 今日运势
    var fortuneCard = h('.card', {}, [ UI.spinner('正在为你推演今日运势…') ]);
    wrap.appendChild(fortuneCard);
    App.Mock.getDailyFortune().then(function (f) {
      App.clear(fortuneCard);
      fortuneCard.appendChild(h('.row.between', {}, [
        h('.card-title', { text: '今日运势' }),
        h('.tag.gold', { text: f.level })
      ]));
      fortuneCard.appendChild(h('.quote', { text: '「' + f.word + '」' }));
      fortuneCard.appendChild(h('.row.wrap', { style: { marginTop: '0.6rem', gap: '0.4rem' } }, [
        h('span.tag.green', { text: '宜 ' + f.good.join(' / ') }),
        h('span.tag.warn', { text: '忌 ' + f.bad.join(' / ') })
      ]));
    });

    // 问道 · AI 修行助手入口
    wrap.appendChild(h('.card.tap.ai-entry', { onclick: function () { go('chat'); } }, [
      h('.row', { style: { gap: '0.8rem' } }, [
        h('.ai-orb', { text: '龍' }),
        h('.li-main', {}, [
          h('.card-title', { text: '问道 · AI 修行助手' }),
          h('.card-sub', { text: '讲解五术、答疑解惑，陪你日常修行' })
        ]),
        h('.li-arrow', { text: '›' })
      ])
    ]));

    // 每日修行任务
    wrap.appendChild(h('.section-title', { text: '每日修行' }));
    var tasks = [
      { id: 'task_gongfa', ico: '⛰', title: '功法跟练一次', sub: '前往「山」完成任意功法', route: 'mountain' },
      { id: 'task_breath', ico: '🫁', title: '呼吸冥想 1 分钟', sub: '前往「医」进行呼吸引导', route: 'medicine' },
      { id: 'task_bu', ico: '☯', title: '每日一卜', sub: '前往「卜」摇一卦', route: 'divination' }
    ];
    tasks.forEach(function (t) {
      var done = Store.isTaskDone(t.id);
      wrap.appendChild(h('.list-item', { onclick: function () { go(t.route); } }, [
        h('.li-ico', { text: done ? '✓' : t.ico }),
        h('.li-main', {}, [
          h('.li-title', { text: t.title }),
          h('.li-sub', { text: done ? '今日已完成' : t.sub })
        ]),
        h('.li-arrow', { text: done ? '已完成' : '›' })
      ]));
    });

    wrap.appendChild(h('.disclaimer', { html: '本页内容为传统文化体验 Demo，运势、命理、占卜均为<b>启发式参考</b>，请勿据此做重大决策。' }));

    return wrap;
  }

  function stat(label, val) {
    return h('.card.center', { style: { margin: 0, padding: '0.7rem 0.2rem' } }, [
      h('div', { text: String(val), style: { fontSize: '1.2rem', fontWeight: '700', color: 'var(--accent)' } }),
      h('.small.muted', { text: label })
    ]);
  }

  App.Pages = App.Pages || {};
  App.Pages.home = { title: '洞天', tab: 'home', render: render };
})(window.App);
