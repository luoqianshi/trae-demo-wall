/* 卜 · 易经占卜（摇卦动画 + 卦象 + 问卜日志） */
(function (App) {
  'use strict';
  var h = App.h, UI = App.UI, Store = App.Store;

  function render() {
    var wrap = h('div');
    wrap.appendChild(h('.quote', { text: '卜以决疑，不疑何卜。占卜是换个角度审视问题的启发，非替你决断。' }));

    // 模式选择
    wrap.appendChild(h('.section-title', { text: '起卦方式' }));
    var qInput = h('input.input', { type: 'text', placeholder: '（可选）写下你想问的事，如：近期是否宜转换方向' });
    wrap.appendChild(h('.card', {}, [
      h('.field', {}, [ h('label', { text: '所问之事' }), qInput ]),
      h('.row', { style: { gap: '0.6rem' } }, [
        h('button.btn.primary.block', { text: '🪙 摇卦占卜', onclick: function () { doCast(qInput.value, resultBox); } }),
        h('button.btn.block', { text: '⚡ 快速运势', onclick: function () { doCast('', resultBox); } })
      ])
    ]));

    var resultBox = h('div');
    wrap.appendChild(resultBox);

    // 问卜日志
    var log = Store.get().divinationLog;
    if (log.length) {
      wrap.appendChild(h('.section-title', { text: '问卜日志' }));
      log.slice(0, 5).forEach(function (r) {
        wrap.appendChild(h('.list-item', { onclick: (function (rec) { return function () { UI.modal('卦象回顾', buildResult(rec)); }; })(r) }, [
          h('.li-ico', { text: r.upper.symbol }),
          h('.li-main', {}, [
            h('.li-title', { text: r.name + (r.question ? '（' + r.question + '）' : '') }),
            h('.li-sub', { text: App.fmtTime(r.time) + ' · ' + r.luck })
          ]),
          h('.li-arrow', { text: '›' })
        ]));
      });
    }

    wrap.appendChild(h('.disclaimer', { html: '占卜为<b>启发式文化体验</b>，请勿据此做重大人生决策。' }));
    return wrap;
  }

  function doCast(question, resultBox) {
    App.clear(resultBox);
    var coins = h('.center', { style: { fontSize: '3rem', margin: '1rem 0' } });
    var status = h('.center.muted', { text: '心诚则灵，正在起卦…' });
    resultBox.appendChild(h('.card', {}, [ coins, status ]));

    // 铜钱翻转动画
    var faces = ['🪙', '⊙', '☯', '◉'];
    var n = 0;
    var timer = setInterval(function () {
      coins.textContent = faces[n % faces.length] + ' ' + faces[(n + 1) % faces.length] + ' ' + faces[(n + 2) % faces.length];
      n++;
    }, 120);

    App.Mock.castHexagram(question).then(function (res) {
      clearInterval(timer);
      Store.pushLog('divinationLog', res);
      Store.markTaskDone('task_bu');
      Store.checkIn();
      var up = Store.addCultivation(6);
      App.clear(resultBox);
      resultBox.appendChild(buildResult(res, true));
      UI.toast('起卦完成，修为 +6');
      if (up) setTimeout(function () { UI.celebrate(up); }, 300);
    });
  }

  // 画卦象（六爻）
  function drawHexagram(upper, lower) {
    // 用三条阴阳爻表示每个三卦（简化：用符号 symbol）
    return h('.center', { style: { margin: '0.4rem 0' } }, [
      h('div', { text: upper.symbol, style: { fontSize: '2.6rem', lineHeight: '1' } }),
      h('div', { text: lower.symbol, style: { fontSize: '2.6rem', lineHeight: '1' } })
    ]);
  }

  function buildResult(res, animate) {
    var box = h('div');
    var luckClass = res.luck.indexOf('吉') >= 0 ? 'green' : (res.luck.indexOf('慎') >= 0 ? 'warn' : 'gold');
    box.appendChild(h('.card', {}, [
      h('.row.between', {}, [
        h('.card-title', { text: res.name }),
        h('.tag.' + luckClass, { text: res.luck })
      ]),
      drawHexagram(res.upper, res.lower),
      h('.center.small.muted', { text: '上卦 ' + res.upper.name + '（' + res.upper.nature + '） · 下卦 ' + res.lower.name + '（' + res.lower.nature + '） · 动爻第 ' + res.movingLine + ' 爻' }),
      res.question ? h('.center.small', { style: { marginTop: '0.4rem', color: 'var(--muted)' }, text: '所问：' + res.question }) : null,
      h('.quote', { style: { marginTop: '0.7rem' }, text: '「' + res.word + '」' }),
      h('p', { style: { marginTop: '0.5rem' }, text: res.advice })
    ]));
    if (animate) {
      box.appendChild(h('button.btn.block', { text: '问 AI 详解此卦', onclick: function () { App.Router.go('chat', { hint: 'divination' }); } }));
    }
    return box;
  }

  App.Pages = App.Pages || {};
  App.Pages.divination = { title: '卜 · 易经占卜', tab: 'divination', render: render };
})(window.App);
