/* 医 · 养生保健 + 呼吸引导 */
(function (App) {
  'use strict';
  var h = App.h, UI = App.UI, Store = App.Store;

  function render() {
    var wrap = h('div');

    // 节气养生
    var termCard = h('.card', {}, [ UI.spinner('载入养生建议…') ]);
    wrap.appendChild(termCard);
    App.Mock.getHealthTips().then(function (data) {
      App.clear(termCard);
      termCard.appendChild(h('.row.between', {}, [
        h('.card-title', { text: '节气养生' }),
        h('.tag.green', { text: '当前 · ' + data.term })
      ]));
      termCard.appendChild(h('.card-sub', { text: data.advice }));

      wrap.insertBefore(buildTips(data.tips), breathSection);
    });

    // 呼吸引导（先占位，数据回来后 tips 插到它前面）
    var breathSection = buildBreath();
    wrap.appendChild(breathSection);

    wrap.appendChild(h('.disclaimer', { html: '养生内容为<b>生活方式建议</b>，不替代医疗诊断；如有不适请咨询专业医师。' }));
    return wrap;
  }

  function buildTips(tips) {
    var box = h('div');
    box.appendChild(h('.section-title', { text: '今日保健贴士' }));
    tips.forEach(function (t) {
      box.appendChild(h('.list-item', { style: { cursor: 'default' } }, [
        h('.li-ico', { text: t.ico }),
        h('.li-main', {}, [ h('.li-title', { text: t.title }), h('.li-sub', { text: t.body }) ])
      ]));
    });
    return box;
  }

  function buildBreath() {
    var box = h('div');
    box.appendChild(h('.section-title', { text: '呼吸引导 · 静心冥想' }));
    var card = h('.card.center', {});

    var circle = h('div', {
      text: '准备',
      style: {
        width: '9rem', height: '9rem', borderRadius: '50%', margin: '0.6rem auto',
        display: 'grid', placeItems: 'center', fontSize: '1.1rem', fontWeight: '700',
        color: 'var(--ink2)', background: 'radial-gradient(circle, var(--accent2), var(--accent))',
        transition: 'transform 4s ease-in-out', transform: 'scale(0.6)'
      }
    });
    var roundInfo = h('.small.muted', { text: '共 3 轮 · 4-4-6 节律' });
    var btn = h('button.btn.primary.block', { text: '开始呼吸练习', style: { marginTop: '0.6rem' } });

    var running = false;
    var phases = [
      { t: '吸气', scale: 1, dur: 4000 },
      { t: '屏息', scale: 1, dur: 4000 },
      { t: '呼气', scale: 0.6, dur: 6000 }
    ];

    function runRound(round, done) {
      var i = 0;
      function step() {
        if (i >= phases.length) { done(); return; }
        var p = phases[i];
        circle.textContent = p.t + ' · 第 ' + round + ' 轮';
        circle.style.transitionDuration = (p.dur / 1000) + 's';
        circle.style.transform = 'scale(' + p.scale + ')';
        i++;
        setTimeout(step, p.dur);
      }
      step();
    }

    btn.onclick = function () {
      if (running) return;
      running = true; btn.disabled = true; btn.textContent = '练习中…';
      var round = 1;
      function next() {
        if (round > 3) {
          circle.textContent = '完成 ✓'; circle.style.transform = 'scale(0.8)';
          btn.disabled = false; btn.textContent = '再来一次'; running = false;
          var isNew = Store.markTaskDone('task_breath');
          Store.checkIn();
          var up = Store.addCultivation(8);
          UI.toast('冥想完成，修为 +8');
          if (up) setTimeout(function () { UI.celebrate(up); }, 300);
          if (isNew) card.appendChild(h('.quote', { style: { marginTop: '0.6rem' }, text: '「呼吸冥想」每日任务达成，心境更澄明。' }));
          return;
        }
        runRound(round, function () { round++; next(); });
      }
      next();
    };

    card.appendChild(circle);
    card.appendChild(roundInfo);
    card.appendChild(btn);
    box.appendChild(card);
    return box;
  }

  App.Pages = App.Pages || {};
  App.Pages.medicine = { title: '医 · 养生保健', tab: 'medicine', render: render };
})(window.App);
