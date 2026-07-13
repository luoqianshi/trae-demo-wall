/**
 * 创业选择页：渲染创业方向卡片
 */
(function () {
  'use strict';
  var LP = window.LP;
  if (!LP) return;

  function escapeHTML(s) {
    if (!s) return '';
    return s.replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function renderStartupGrid() {
    var grid = document.getElementById('startup-grid');
    var count = document.getElementById('startup-count');
    if (!grid) return;
    if (count) count.textContent = LP.STARTUPS.length;

    var archive = LP.loadArchive();
    var completedMap = {};
    (archive.sessions || []).forEach(function (s) {
      if (s.type === 'startup') {
        completedMap[s.targetId] = (completedMap[s.targetId] || 0) + 1;
      }
    });

    grid.innerHTML = LP.STARTUPS.map(function (s) {
      var done = completedMap[s.id] || 0;
      return '<a href="experience.html?mode=startup&id=' + s.id + '" ' +
        'class="group block bg-white border border-[var(--border)] rounded-2xl overflow-hidden card-hover reveal" ' +
        'style="box-shadow: var(--shadow-sm);">' +
        '<div class="flex flex-col sm:flex-row">' +
          '<div class="sm:w-44 h-32 sm:h-auto bg-gradient-to-br ' + s.bg + ' flex items-center justify-center relative flex-shrink-0">' +
            '<div class="w-16 h-16 rounded-2xl bg-white/90 flex items-center justify-center shadow-sm">' +
              '<i data-lucide="' + s.icon + '" class="w-8 h-8" style="color: ' + s.color + '"></i>' +
            '</div>' +
            (done > 0 ? '<span class="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">✓ ' + done + ' 次</span>' : '') +
          '</div>' +
          '<div class="p-5 flex-1">' +
            '<div class="flex items-start justify-between gap-2 mb-1">' +
              '<h3 class="text-lg font-bold text-[var(--foreground)]">' + escapeHTML(s.name) + '</h3>' +
              '<span class="text-xs font-semibold text-emerald-600 whitespace-nowrap">起始资金 ' + s.initialFund + 'W</span>' +
            '</div>' +
            '<p class="text-sm text-[var(--muted-foreground)] leading-relaxed mb-3">' + escapeHTML(s.summary) + '</p>' +
            '<div class="space-y-1.5 text-xs text-[var(--muted-foreground)] mb-3">' +
              '<div class="flex items-center gap-1.5"><i data-lucide="package" class="w-3.5 h-3.5"></i><span>产品：' + escapeHTML(s.product) + '</span></div>' +
              '<div class="flex items-center gap-1.5"><i data-lucide="target" class="w-3.5 h-3.5"></i><span>目标市场：' + escapeHTML(s.market) + '</span></div>' +
            '</div>' +
            '<div class="flex items-center justify-between text-sm font-semibold text-[var(--color-primary)]">' +
              '<span>创办公司</span>' +
              '<i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</a>';
    }).join('');

    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();

    setTimeout(function () {
      var obs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            obs.unobserve(e.target);
          }
        });
      }, { threshold: 0.1 });
      grid.querySelectorAll('.reveal').forEach(function (el, i) {
        el.classList.add('reveal-delay-' + ((i % 5) + 1));
        obs.observe(el);
      });
    }, 0);
  }

  document.addEventListener('DOMContentLoaded', renderStartupGrid);
})();
