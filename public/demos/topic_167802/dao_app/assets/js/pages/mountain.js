/* 山 · 身体修炼（功法列表 + 功法详情） */
(function (App) {
  'use strict';
  var h = App.h, UI = App.UI, Store = App.Store;

  // 山 · 功法列表
  function renderList() {
    var go = App.Router.go;
    var wrap = h('div');
    wrap.appendChild(h('.quote', { text: '身为修行之基。每日一功，积跬步以至千里。' }));
    var listBox = h('div', { style: { marginTop: '0.8rem' } }, [ UI.spinner('载入功法…') ]);
    wrap.appendChild(listBox);

    App.Mock.getGongfaList().then(function (list) {
      App.clear(listBox);
      list.forEach(function (g) {
        var unlocked = Store.isGongfaUnlocked(g.id) || !g.needRealm || Store.currentRealm().index >= g.needRealm;
        var item = h('.list-item', {}, [
          h('.li-ico', { text: unlocked ? '⛰' : '🔒' }),
          h('.li-main', {}, [
            h('.li-title', { text: g.name }),
            h('.li-sub', { text: g.level + ' · ' + g.duration + ' 分钟 · 修为 +' + g.reward })
          ]),
          h('.li-arrow', { text: unlocked ? '›' : '未解锁' })
        ]);
        item.onclick = function () {
          if (!unlocked) { UI.toast('需境界提升后解锁'); return; }
          go('gongfa', { id: g.id });
        };
        listBox.appendChild(item);
      });
    });
    return wrap;
  }

  // 功法详情 + 跟练计时
  function renderDetail(params) {
    var wrap = h('div', {}, [ UI.spinner('载入功法…') ]);
    App.Mock.getGongfaDetail(params.id).then(function (g) {
      App.clear(wrap);
      if (!g) { wrap.appendChild(h('.empty', {}, [h('.em-ico', {text:'∅'}), h('div',{text:'功法不存在'})])); return; }

      wrap.appendChild(h('.card', {}, [
        h('.row.between', {}, [ h('.card-title', { text: g.name }), h('.tag.gold', { text: g.level }) ]),
        h('.card-sub', { text: g.desc }),
        h('.row.wrap', { style: { marginTop: '0.6rem', gap: '0.4rem' } }, [
          h('span.tag', { text: '⏱ ' + g.duration + ' 分钟' }),
          h('span.tag.green', { text: '修为 +' + g.reward })
        ])
      ]));

      wrap.appendChild(h('.section-title', { text: '功法要诀' }));
      var steps = h('div');
      g.steps.forEach(function (s, i) {
        steps.appendChild(h('.list-item', { style: { cursor: 'default' } }, [
          h('.li-ico', { text: String(i + 1) }),
          h('.li-main', {}, [ h('.li-title', { text: s }) ])
        ]));
      });
      wrap.appendChild(steps);

      // 跟练区域
      wrap.appendChild(buildPractice(g));
    });
    return wrap;
  }

  function buildPractice(g) {
    var box = h('.card', {});
    var seconds = g.duration; // Demo：把「分钟」压缩为「秒」以便快速体验
    var running = false, timer = null, remain = seconds;

    var display = h('div', {
      text: fmt(remain),
      style: { fontSize: '2.4rem', fontWeight: '700', textAlign: 'center', color: 'var(--accent)', margin: '0.4rem 0' }
    });
    var hint = h('.small.muted.center', { text: '（Demo 已将时长压缩为 ' + seconds + ' 秒便于体验）' });
    var btn = h('button.btn.primary.block', { text: '开始跟练', style: { marginTop: '0.8rem' } });

    function fmt(s) { return App.pad(Math.floor(s / 60)) + ':' + App.pad(s % 60); }

    function finish() {
      running = false; clearInterval(timer);
      btn.textContent = '已完成 ✓'; btn.disabled = true;
      var isNew = Store.markTaskDone('task_gongfa');
      Store.checkIn();
      var up = Store.addCultivation(g.reward);
      Store.unlockGongfa(g.id);
      UI.toast('修行完成，修为 +' + g.reward);
      if (up) setTimeout(function () { UI.celebrate(up); }, 400);
      // 完成后展示结果卡
      box.appendChild(h('.quote', { style: { marginTop: '0.8rem' }, text:
        '恭喜完成《' + g.name + '》跟练。' + (isNew ? '「每日修行」任务达成，' : '') + '修为 +' + g.reward + '。' }));
    }

    btn.onclick = function () {
      if (running) return;
      running = true; btn.textContent = '跟练中…';
      timer = setInterval(function () {
        remain--; display.textContent = fmt(remain);
        if (remain <= 0) finish();
      }, 1000);
    };

    box.appendChild(h('.section-title', { text: '开始跟练' }));
    box.appendChild(display);
    box.appendChild(hint);
    box.appendChild(btn);
    return box;
  }

  App.Pages = App.Pages || {};
  App.Pages.mountain = { title: '山 · 身体修炼', tab: 'mountain', render: renderList };
  App.Pages.gongfa = { title: '功法详情', tab: 'mountain', back: 'mountain', render: renderDetail };
})(window.App);
