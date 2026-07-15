/* 命 · 八字命理 */
(function (App) {
  'use strict';
  var h = App.h, UI = App.UI, Store = App.Store;

  function render() {
    var wrap = h('div');
    var st = Store.get();

    // 已有记录快捷入口
    if (st.baziRecords.length) {
      wrap.appendChild(h('.section-title', { text: '最近命盘' }));
      var last = st.baziRecords[0];
      wrap.appendChild(h('.card.tap', { onclick: function () { showResult(last); } }, [
        h('.row.between', {}, [
          h('.card-title', { text: last.birth.date + ' ' + last.timeName }),
          h('.tag.gold', { text: '日主 ' + last.dayMaster })
        ]),
        h('.card-sub', { text: '点击查看完整解读' })
      ]));
    }

    wrap.appendChild(h('.section-title', { text: '排盘 · 输入生辰' }));
    var form = h('.card', {});
    var dateInput = h('input.input', { type: 'date', value: '1996-08-15' });
    var hourSel = h('select.input');
    for (var i = 0; i < 24; i++) hourSel.appendChild(h('option', { value: i, text: App.pad(i) + ':00' }));
    hourSel.value = 10;
    var genderSel = h('select.input');
    genderSel.appendChild(h('option', { value: 'male', text: '乾造（男）' }));
    genderSel.appendChild(h('option', { value: 'female', text: '坤造（女）' }));

    form.appendChild(h('.field', {}, [ h('label', { text: '出生日期（公历）' }), dateInput ]));
    form.appendChild(h('.field', {}, [ h('label', { text: '出生时辰' }), hourSel ]));
    form.appendChild(h('.field', {}, [ h('label', { text: '性别' }), genderSel ]));

    var btn = h('button.btn.primary.block', { text: '开始排盘' });
    var resultBox = h('div');

    btn.onclick = function () {
      if (!dateInput.value) { UI.toast('请选择出生日期'); return; }
      App.clear(resultBox);
      resultBox.appendChild(h('.card', {}, [ UI.spinner('正在推演四柱八字…') ]));
      App.Mock.calcBazi({ date: dateInput.value, hour: hourSel.value, gender: genderSel.value }).then(function (res) {
        Store.pushLog('baziRecords', res);
        App.clear(resultBox);
        resultBox.appendChild(buildResult(res));
        Store.addCultivation(5);
      });
    };
    form.appendChild(btn);
    wrap.appendChild(form);
    wrap.appendChild(resultBox);

    wrap.appendChild(h('.disclaimer', { html: '八字排盘为<b>简化演示算法</b>，命理内容属文化体验与启发式参考，请勿据此做重大人生决策。' }));
    return wrap;
  }

  function buildResult(res) {
    var box = h('div');
    // 四柱
    box.appendChild(h('.section-title', { text: '四柱八字' }));
    var pill = h('.grid2', { style: { gridTemplateColumns: 'repeat(4,1fr)', gap: '0.4rem' } });
    res.pillars.forEach(function (p) {
      pill.appendChild(h('.card.center', { style: { margin: 0, padding: '0.7rem 0.2rem' } }, [
        h('.small.muted', { text: p.label }),
        h('div', { text: p.gan, style: { fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' } }),
        h('div', { text: p.zhi, style: { fontSize: '1.5rem', fontWeight: '700' } }),
        h('.small.muted', { text: p.gw + p.zw })
      ]));
    });
    box.appendChild(pill);

    // 五行分布
    box.appendChild(h('.section-title', { text: '五行分布' }));
    var wxBox = h('.card', {});
    var max = Math.max.apply(null, Object.keys(res.wx).map(function (k) { return res.wx[k]; })) || 1;
    ['金', '木', '水', '火', '土'].forEach(function (k) {
      var pct = res.wx[k] / max;
      var bar = h('div', { style: {
        height: '12px', borderRadius: '999px', background: res.wxColor[k],
        width: '0%', transition: 'width .8s'
      } });
      setTimeout(function () { bar.style.width = Math.max(6, pct * 100) + '%'; }, 60);
      wxBox.appendChild(h('.row', { style: { margin: '0.35rem 0', gap: '0.5rem' } }, [
        h('span', { text: k, style: { width: '1.4rem', color: res.wxColor[k], fontWeight: '700' } }),
        h('div', { style: { flex: '1' } }, [ bar ]),
        h('span.small.muted', { text: res.wx[k] + ' 个', style: { width: '2.4rem', textAlign: 'right' } })
      ]));
    });
    box.appendChild(wxBox);

    // 解读
    box.appendChild(h('.section-title', { text: 'AI 白话解读' }));
    box.appendChild(h('.card', {}, [
      h('p', { text: res.reading.summary, style: { marginBottom: '0.5rem' } }),
      h('p', { text: res.reading.strongest, style: { marginBottom: '0.5rem', color: 'var(--muted)' } }),
      h('.quote', { text: res.reading.advice })
    ]));

    box.appendChild(h('.row', { style: { gap: '0.6rem', marginTop: '0.6rem' } }, [
      h('button.btn.block', { text: '问 AI 更多', onclick: function () {
        App.Router.go('chat', { hint: 'bazi' });
      }}),
      h('button.btn.block', { text: '生成分享卡', onclick: function () { shareCard(res); }})
    ]));
    return box;
  }

  function showResult(res) {
    UI.modal('命盘解读', buildResult(res));
  }

  function shareCard(res) {
    var content = h('div', {}, [
      h('.card', { style: { background: 'linear-gradient(135deg, rgba(215,170,67,.15), rgba(15,22,15,.5))', borderColor: 'var(--accent)' } }, [
        h('.center', { style: { fontSize: '1.6rem', fontWeight: '700', color: 'var(--accent)' }, text: '凡人修仙 · 命盘' }),
        h('.center.small.muted', { text: res.birth.date + ' ' + res.timeName }),
        h('.spacer'),
        h('.center', { style: { fontSize: '1.2rem', fontWeight: '700' }, text: res.pillars.map(function(p){return p.gan+p.zhi;}).join('  ') }),
        h('.spacer'),
        h('p.center', { text: res.reading.summary }),
        h('.center.small.muted', { style: { marginTop: '0.6rem' }, text: '日主 ' + res.dayMaster + ' · ' + res.strongest + '气偏旺' })
      ]),
      h('.small.muted.center', { text: '（Demo 分享卡：实际可保存为图片分享）' })
    ]);
    UI.modal('分享卡预览', content);
  }

  App.Pages = App.Pages || {};
  App.Pages.destiny = { title: '命 · 八字命理', tab: 'destiny', render: render };
})(window.App);
