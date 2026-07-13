/**
 * 职业选择页：渲染职业卡片
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

  function renderJobGrid() {
    var grid = document.getElementById('job-grid');
    var count = document.getElementById('job-count');
    if (!grid) return;
    if (count) count.textContent = LP.JOBS.length;

    var archive = LP.loadArchive();
    var completedMap = {};
    (archive.sessions || []).forEach(function (s) {
      if (s.type === 'job') {
        completedMap[s.targetId] = (completedMap[s.targetId] || 0) + 1;
      }
    });

    grid.innerHTML = LP.JOBS.map(function (job) {
      var done = completedMap[job.id] || 0;
      return '<a href="experience.html?mode=job&id=' + job.id + '" ' +
        'class="group block bg-white border border-[var(--border)] rounded-2xl overflow-hidden card-hover reveal" ' +
        'style="box-shadow: var(--shadow-sm);">' +
        '<div class="h-28 bg-gradient-to-br ' + job.bg + ' flex items-center justify-center relative">' +
          '<div class="w-14 h-14 rounded-2xl bg-white/90 flex items-center justify-center text-2xl shadow-sm">' +
            '<i data-lucide="' + job.icon + '" class="w-7 h-7" style="color: ' + job.color + '"></i>' +
          '</div>' +
          (job.hot ? '<span class="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold">🔥 热门</span>' : '') +
          (done > 0 ? '<span class="absolute top-3 left-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-bold">✓ 已完成 ' + done + ' 次</span>' : '') +
        '</div>' +
        '<div class="p-5">' +
          '<div class="flex items-start justify-between gap-2 mb-1">' +
            '<h3 class="text-base font-bold text-[var(--foreground)]">' + escapeHTML(job.name) + '</h3>' +
            '<span class="text-xs font-semibold text-amber-600 whitespace-nowrap">' + escapeHTML(job.salary) + '</span>' +
          '</div>' +
          '<p class="text-xs text-[var(--muted-foreground)] leading-relaxed mb-3">' + escapeHTML(job.summary) + '</p>' +
          '<div class="flex items-center gap-1.5 text-[11px] text-[var(--muted-foreground)] mb-3">' +
            '<i data-lucide="building" class="w-3 h-3"></i>' +
            '<span>' + escapeHTML(job.company) + '</span>' +
            '<span class="opacity-50">·</span>' +
            '<span>' + escapeHTML(job.industry) + '</span>' +
          '</div>' +
          '<div class="flex flex-wrap gap-1 mb-4">' +
            job.skills.slice(0, 3).map(function (sk) {
              return '<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700">' + escapeHTML(sk) + '</span>';
            }).join('') +
          '</div>' +
          '<div class="flex items-center justify-between text-sm font-semibold text-[var(--color-primary)] group-hover:gap-2 transition-all">' +
            '<span>开始体验</span>' +
            '<i data-lucide="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i>' +
          '</div>' +
        '</div>' +
      '</a>';
    }).join('');

    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();

    // 滚动揭示
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

  document.addEventListener('DOMContentLoaded', renderJobGrid);
})();
