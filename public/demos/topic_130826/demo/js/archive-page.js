/**
 * 成长档案页：渲染统计、记录、解锁地图
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

  function renderStats(archive) {
    var jobs = new Set();
    var startups = new Set();
    (archive.sessions || []).forEach(function (s) {
      if (s.type === 'job') jobs.add(s.targetId);
      if (s.type === 'startup') startups.add(s.targetId);
    });

    var counters = document.querySelectorAll('.counter');
    var values = [
      archive.totalXP || 0,
      (archive.sessions || []).length,
      jobs.size,
      startups.size,
    ];
    counters.forEach(function (c, i) {
      if (values[i] !== undefined) c.dataset.target = String(values[i]);
    });
  }

  function renderJobDetails(d) {
    if (!d) return '<p class="text-xs text-[var(--muted-foreground)]">此记录为旧版本体验，暂无详情数据。</p>';
    var html = '';

    // 自我介绍
    if (d.intro) {
      html += '<div class="mb-3">' +
        '<div class="text-xs font-semibold text-[var(--foreground)] mb-1">📝 自我介绍</div>' +
        '<div class="text-xs text-[var(--muted-foreground)] space-y-1">' +
          (d.intro.name ? '<div>名字：' + escapeHTML(d.intro.name) + '</div>' : '') +
          (d.intro.tags && d.intro.tags.length ? '<div>标签：' + d.intro.tags.map(function (t) { return '<span class="px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px]">' + escapeHTML(t) + '</span>'; }).join(' ') + '</div>' : '') +
          (d.intro.motivation ? '<div>动机：' + escapeHTML(d.intro.motivation) + '</div>' : '') +
        '</div>' +
      '</div>';
    }

    // 面试回答
    if (d.interviewAnswers && d.interviewAnswers.length) {
      html += '<div class="mb-3">' +
        '<div class="text-xs font-semibold text-[var(--foreground)] mb-1">💬 AI 面试（' + d.interviewAnswers.length + ' 题）</div>' +
        '<div class="space-y-2">' + d.interviewAnswers.map(function (a, i) {
          return '<div class="bg-amber-50/50 rounded-lg p-2.5 border border-amber-100">' +
            '<div class="text-[11px] text-[var(--muted-foreground)] mb-1">Q' + (i + 1) + '：' + escapeHTML(a.q.substring(0, 40)) + (a.q.length > 40 ? '…' : '') + '</div>' +
            '<div class="text-xs text-[var(--foreground)] leading-relaxed">' + escapeHTML(a.a) + '</div>' +
            '<div class="mt-1 text-[10px] text-emerald-600 font-medium">+' + a.score + ' XP</div>' +
          '</div>';
        }).join('') + '</div>' +
      '</div>';
    }

    // 入职任务
    if (typeof d.onboardDone === 'number') {
      html += '<div class="mb-3">' +
        '<div class="text-xs font-semibold text-[var(--foreground)] mb-1">📋 入职日</div>' +
        '<div class="text-xs text-[var(--muted-foreground)]">完成任务 ' + d.onboardDone + ' / 4 项</div>' +
      '</div>';
    }

    // 工作挑战
    if (d.tasksPicked && d.tasksPicked.length) {
      html += '<div class="mb-1">' +
        '<div class="text-xs font-semibold text-[var(--foreground)] mb-1">🎯 工作挑战</div>' +
        '<div class="space-y-1">' + d.tasksPicked.map(function (t, i) {
          if (!t) return '';
          return '<div class="flex items-center justify-between text-xs bg-white rounded-lg p-2 border border-[var(--border)]">' +
            '<span class="text-[var(--foreground)]">任务 ' + (i + 1) + '：' + escapeHTML(t.label.substring(0, 30)) + (t.label.length > 30 ? '…' : '') + '</span>' +
            '<span class="text-emerald-600 font-medium">+' + t.score + ' XP</span>' +
          '</div>';
        }).join('') + '</div>' +
      '</div>';
    }

    return html;
  }

  function renderStartupDetails(d, stats) {
    if (!d) return '<p class="text-xs text-[var(--muted-foreground)]">此记录为旧版本体验，暂无详情数据。</p>';
    var html = '';

    // 阶段决策
    if (d.stages && d.stages.length) {
      html += '<div class="mb-3">' +
        '<div class="text-xs font-semibold text-[var(--foreground)] mb-1">📍 关键决策</div>' +
        '<div class="space-y-1.5">' + d.stages.map(function (st, i) {
          return '<div class="flex items-center gap-2 text-xs">' +
            '<span class="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold flex-shrink-0">' + (i + 1) + '</span>' +
            '<span class="text-[var(--muted-foreground)]">' + escapeHTML(st.title) + '</span>' +
            '<span class="flex-1 border-b border-dashed border-[var(--border)]"></span>' +
            (st.picked ? '<span class="text-[var(--foreground)] font-medium">' + escapeHTML(st.picked) + '</span>' : '<span class="text-[var(--muted-foreground)]">未选择</span>') +
          '</div>';
        }).join('') + '</div>' +
      '</div>';
    }

    // 最终数据
    if (stats) {
      html += '<div class="mb-1">' +
        '<div class="text-xs font-semibold text-[var(--foreground)] mb-1">📊 最终数据</div>' +
        '<div class="grid grid-cols-2 sm:grid-cols-4 gap-2">' +
          '<div class="bg-white rounded-lg p-2 border border-[var(--border)] text-center">' +
            '<div class="text-sm font-bold text-[var(--foreground)]">' + stats.users.toFixed(1) + 'K</div>' +
            '<div class="text-[10px] text-[var(--muted-foreground)]">用户</div>' +
          '</div>' +
          '<div class="bg-white rounded-lg p-2 border border-[var(--border)] text-center">' +
            '<div class="text-sm font-bold text-[var(--foreground)]">' + stats.fund.toFixed(0) + 'W</div>' +
            '<div class="text-[10px] text-[var(--muted-foreground)]">资金</div>' +
          '</div>' +
          '<div class="bg-white rounded-lg p-2 border border-[var(--border)] text-center">' +
            '<div class="text-sm font-bold text-[var(--foreground)]">' + stats.team + '</div>' +
            '<div class="text-[10px] text-[var(--muted-foreground)]">团队</div>' +
          '</div>' +
          '<div class="bg-white rounded-lg p-2 border border-[var(--border)] text-center">' +
            '<div class="text-sm font-bold text-[var(--foreground)]">' + stats.share.toFixed(1) + '%</div>' +
            '<div class="text-[10px] text-[var(--muted-foreground)]">份额</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    }

    return html;
  }

  function renderSessions(archive) {
    var list = document.getElementById('session-list');
    if (!list) return;
    var sessions = archive.sessions || [];

    if (sessions.length === 0) {
      list.innerHTML = '<div class="bg-white rounded-2xl border border-dashed border-[var(--border)] p-12 text-center">' +
        '<div class="w-16 h-16 mx-auto rounded-full bg-amber-100 flex items-center justify-center text-amber-600 mb-4">' +
          '<i data-lucide="inbox" class="w-8 h-8"></i>' +
        '</div>' +
        '<h3 class="text-lg font-semibold text-[var(--foreground)] mb-2">还没有体验记录</h3>' +
        '<p class="text-sm text-[var(--muted-foreground)] mb-6">去选择一个职业或创业方向开始你的第一次预演吧</p>' +
        '<div class="flex items-center justify-center gap-3">' +
          '<a href="explore.html" class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-[var(--color-primary)] text-white text-sm font-semibold hover:bg-[var(--color-primary-dark)] transition-colors">' +
            '<i data-lucide="briefcase" class="w-4 h-4"></i>' +
            '<span>选择职业</span>' +
          '</a>' +
          '<a href="create.html" class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg border border-[var(--border)] text-sm font-medium text-[var(--foreground)] hover:bg-amber-50 transition-colors">' +
            '<i data-lucide="rocket" class="w-4 h-4"></i>' +
            '<span>创办公司</span>' +
          '</a>' +
        '</div>' +
      '</div>';
      if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
      return;
    }

    list.innerHTML = '<div class="space-y-3">' + sessions.map(function (s, idx) {
      var isJob = s.type === 'job';
      var icon = isJob ? 'briefcase' : 'rocket';
      var tag = isJob ? '就业' : '创业';
      var tagColor = isJob ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700';
      var date = new Date(s.finishedAt);
      var dateStr = isNaN(date.getTime()) ? '未知时间' : (date.getMonth() + 1) + '月' + date.getDate() + '日 ' + date.getHours() + ':' + String(date.getMinutes()).padStart(2, '0');
      var detailId = 'detail-' + idx;

      return '<div class="bg-white rounded-xl border border-[var(--border)] overflow-hidden" style="box-shadow: var(--shadow-sm);">' +
        // 头部（点击展开/收起）
        '<div class="record-header p-4 sm:p-5 flex items-center gap-4 cursor-pointer hover:bg-amber-50/50 transition-colors" data-detail-target="' + detailId + '">' +
          '<div class="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ' + (isJob ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600') + '">' +
            '<i data-lucide="' + icon + '" class="w-6 h-6"></i>' +
          '</div>' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center gap-2 mb-1">' +
              '<span class="px-2 py-0.5 rounded text-[10px] font-bold ' + tagColor + '">' + tag + '</span>' +
              '<span class="text-sm font-semibold text-[var(--foreground)] truncate">' + escapeHTML(s.targetName) + '</span>' +
            '</div>' +
            '<div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--muted-foreground)]">' +
              '<span class="inline-flex items-center gap-1"><i data-lucide="calendar" class="w-3 h-3"></i>' + dateStr + '</span>' +
              '<span class="inline-flex items-center gap-1"><i data-lucide="clock" class="w-3 h-3"></i>' + LP.formatTime(s.duration) + '</span>' +
              '<span class="inline-flex items-center gap-1"><i data-lucide="trophy" class="w-3 h-3"></i>+' + s.xp + ' XP</span>' +
            '</div>' +
          '</div>' +
          '<div class="flex items-center gap-3 flex-shrink-0">' +
            '<div class="text-lg font-bold text-[var(--color-primary)]">' + s.grade + '</div>' +
            '<i data-lucide="chevron-down" class="w-4 h-4 text-[var(--muted-foreground)] record-chevron transition-transform"></i>' +
          '</div>' +
        '</div>' +
        // 详情内容
        '<div id="' + detailId + '" class="hidden border-t border-[var(--border)] bg-[var(--accent)]/40 p-4 sm:p-5">' +
          (isJob ? renderJobDetails(s.details) : renderStartupDetails(s.details, s.stats)) +
        '</div>' +
      '</div>';
    }).join('') + '</div>';

    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();

    // 绑定展开/收起
    list.querySelectorAll('.record-header').forEach(function (header) {
      header.addEventListener('click', function () {
        var targetId = header.dataset.detailTarget;
        var detail = document.getElementById(targetId);
        var chevron = header.querySelector('.record-chevron');
        if (!detail) return;
        var isHidden = detail.classList.contains('hidden');
        if (isHidden) {
          detail.classList.remove('hidden');
          if (chevron) chevron.style.transform = 'rotate(180deg)';
        } else {
          detail.classList.add('hidden');
          if (chevron) chevron.style.transform = 'rotate(0deg)';
        }
      });
    });
  }

  function renderMap(archive) {
    var jobMap = document.getElementById('job-map');
    var startupMap = document.getElementById('startup-map');
    var jobCounts = {};
    var startupCounts = {};
    (archive.sessions || []).forEach(function (s) {
      if (s.type === 'job') jobCounts[s.targetId] = (jobCounts[s.targetId] || 0) + 1;
      if (s.type === 'startup') startupCounts[s.targetId] = (startupCounts[s.targetId] || 0) + 1;
    });

    if (jobMap) {
      jobMap.innerHTML = LP.JOBS.map(function (job) {
        var cnt = jobCounts[job.id] || 0;
        var unlocked = cnt > 0;
        return '<a href="experience.html?mode=job&id=' + job.id + '" class="block bg-white border border-[var(--border)] rounded-xl p-3 text-center transition-all hover:shadow-md ' + (unlocked ? '' : 'opacity-50 grayscale') + '">' +
          '<div class="w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-2" style="background: ' + job.bg + '">' +
            '<i data-lucide="' + job.icon + '" class="w-5 h-5" style="color: ' + job.color + '"></i>' +
          '</div>' +
          '<div class="text-xs font-semibold text-[var(--foreground)] truncate">' + escapeHTML(job.name) + '</div>' +
          '<div class="text-[10px] text-[var(--muted-foreground)] mt-0.5">' + (unlocked ? '✓ 完成 ' + cnt + ' 次' : '🔒 未解锁') + '</div>' +
        '</a>';
      }).join('');
    }

    if (startupMap) {
      startupMap.innerHTML = LP.STARTUPS.map(function (s) {
        var cnt = startupCounts[s.id] || 0;
        var unlocked = cnt > 0;
        return '<a href="experience.html?mode=startup&id=' + s.id + '" class="block bg-white border border-[var(--border)] rounded-xl p-3 text-center transition-all hover:shadow-md ' + (unlocked ? '' : 'opacity-50 grayscale') + '">' +
          '<div class="w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-2" style="background: ' + s.bg + '">' +
            '<i data-lucide="' + s.icon + '" class="w-5 h-5" style="color: ' + s.color + '"></i>' +
          '</div>' +
          '<div class="text-xs font-semibold text-[var(--foreground)] truncate">' + escapeHTML(s.name) + '</div>' +
          '<div class="text-[10px] text-[var(--muted-foreground)] mt-0.5">' + (unlocked ? '✓ 完成 ' + cnt + ' 次' : '🔒 未解锁') + '</div>' +
        '</a>';
      }).join('');
    }

    if (window.lucide && window.lucide.createIcons) window.lucide.createIcons();
  }

  function initCounters() {
    var counters = document.querySelectorAll('.counter');
    if (!counters.length) return;
    if (!window.IntersectionObserver) {
      counters.forEach(function (c) {
        var t = parseFloat(c.dataset.target || '0');
        c.textContent = t;
      });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var el = e.target;
          var target = parseFloat(el.dataset.target || '0');
          var duration = 1000;
          var start = null;
          function step(ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / duration, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.floor(target * eased);
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = target;
          }
          requestAnimationFrame(step);
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (c) { observer.observe(c); });
  }

  function init() {
    var archive = LP.loadArchive();
    renderStats(archive);
    renderSessions(archive);
    renderMap(archive);
    setTimeout(initCounters, 50);

    var clearBtn = document.getElementById('clear-archive');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (confirm('确定要清空所有体验数据吗？此操作不可恢复。')) {
          LP.clearArchive();
          window.location.reload();
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
