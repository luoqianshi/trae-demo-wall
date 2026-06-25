(function () {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var soft = style.getPropertyValue('--soft').trim();

  var samples = {
    math: {
      text: '数学错题：解方程 x² - 5x + 6 = 0 时，我把答案写成 x=1 或 6。老师指出应该先因式分解为 (x-2)(x-3)=0，答案是 2 或 3。我当时没有代回检查。',
      result: [
        ['错误类型', '数学二次方程错题'],
        ['根因基因', '结构识别弱、验算习惯缺失、路径依赖'],
        ['变体任务', '生成 3 道同类但不同数字结构的方程题'],
        ['复测时间', '24 小时、3 天、7 天后自动推送'],
        ['成长建议', '每次解完后增加“代回检查”步骤']
      ],
      toast: '已生成数学错因基因'
    },
    code: {
      text: '代码 bug：React 页面筛选列表后偶尔不刷新。debug 后发现 useEffect 的依赖数组漏了 filter 条件，导致状态变化没有触发重新请求。之前我也在异步状态同步上犯过类似错误。',
      result: [
        ['错误类型', '前端状态同步 bug'],
        ['根因基因', '依赖追踪遗漏、异步状态心智模型不稳'],
        ['变体任务', '生成 2 个 useEffect 依赖与缓存失效的代码场景'],
        ['复测时间', '下次提交相关代码时由 IDE 插件提醒'],
        ['成长建议', '提交前检查“状态来源、触发条件、清理函数”']
      ],
      toast: '已归档代码错因基因'
    },
    work: {
      text: '工作复盘：本周需求评审时，我没有确认“导出数据是否包含历史归档记录”，开发后才发现产品和运营理解不一致，返工半天。根本原因是会议后没有输出确认清单。',
      result: [
        ['错误类型', '需求沟通与确认遗漏'],
        ['根因基因', '隐含假设未外显、会议闭环缺失'],
        ['变体任务', '生成 3 个需求澄清问题和 1 份评审清单'],
        ['复测时间', '下次需求评审前 30 分钟自动弹出'],
        ['成长建议', '每次会议后用“三问清单”确认边界、例外和责任人']
      ],
      toast: '已生成职场复盘基因'
    }
  };

  function showToast(message) {
    var toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(function () {
      toast.classList.remove('show');
    }, 1800);
  }

  function renderResult(items) {
    var box = document.getElementById('analysisResult');
    if (!box) return;
    box.innerHTML = items.map(function (item) {
      return '<div class="result-line"><b>' + item[0] + '</b><span>' + item[1] + '</span></div>';
    }).join('');
  }

  function inferSampleKey(text) {
    if (/React|useEffect|bug|代码|debug|异步/.test(text)) return 'code';
    if (/需求|会议|复盘|运营|产品|返工/.test(text)) return 'work';
    return 'math';
  }

  document.querySelectorAll('[data-sample]').forEach(function (button) {
    button.addEventListener('click', function () {
      var key = button.getAttribute('data-sample');
      var sample = samples[key];
      var input = document.getElementById('mistakeInput');
      if (input) input.value = sample.text;
      renderResult(sample.result);
      showToast(sample.toast);
    });
  });

  var analyzeBtn = document.getElementById('analyzeBtn');
  if (analyzeBtn) {
    analyzeBtn.addEventListener('click', function () {
      var input = document.getElementById('mistakeInput');
      var key = inferSampleKey(input ? input.value : '');
      renderResult(samples[key].result);
      showToast(samples[key].toast);
    });
  }

  document.querySelectorAll('[data-demo-run]').forEach(function (button) {
    button.addEventListener('click', function () {
      var target = document.getElementById('workbench');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      renderResult(samples.math.result);
      showToast('演示模式：AI 已完成一次错因提炼');
    });
  });

  document.querySelectorAll('[data-tab]').forEach(function (button) {
    button.addEventListener('click', function () {
      var tab = button.getAttribute('data-tab');
      document.querySelectorAll('[data-tab]').forEach(function (btn) {
        btn.classList.toggle('active', btn === button);
      });
      document.querySelectorAll('[data-view]').forEach(function (view) {
        view.classList.toggle('active', view.getAttribute('data-view') === tab);
      });
    });
  });

  document.querySelectorAll('[data-flashcard]').forEach(function (card) {
    var flipped = false;
    card.addEventListener('click', function () {
      flipped = !flipped;
      card.classList.toggle('flipped', flipped);
      card.innerHTML = flipped
        ? '<div><small>AI 提示</small><h3>先找两个数：相乘等于 12，相加等于 7。</h3><p>这张卡考察的不是原题，而是同一个“因式分解识别弱”基因。</p></div>'
        : '<div><small>变体挑战 1/3</small><h3>若 y² - 7y + 12 = 0，求 y 的取值。</h3><p>点击卡片查看提示</p></div>';
    });
  });

  function initGeneChart() {
    var el = document.getElementById('chart-gene');
    if (!el || !window.echarts) return null;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      color: [accent, accent2, muted, accent + '99'],
      tooltip: { trigger: 'item', appendToBody: true },
      legend: {
        bottom: 0,
        textStyle: { color: muted }
      },
      series: [{
        name: '错因基因',
        type: 'pie',
        radius: ['42%', '70%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        label: {
          color: ink,
          formatter: '{b}\n{d}%'
        },
        labelLine: { lineStyle: { color: rule } },
        data: [
          { value: 38, name: '知识基因' },
          { value: 27, name: '思维基因' },
          { value: 21, name: '行为基因' },
          { value: 14, name: '工具基因' }
        ]
      }]
    });
    return chart;
  }

  function initProgressChart() {
    var el = document.getElementById('chart-progress');
    if (!el || !window.echarts) return null;
    var chart = echarts.init(el, null, { renderer: 'svg' });
    chart.setOption({
      animation: false,
      color: [accent, accent2],
      tooltip: { trigger: 'axis', appendToBody: true },
      grid: { top: 34, left: 42, right: 18, bottom: 40 },
      xAxis: {
        type: 'category',
        data: ['首次', '24h', '3天', '7天', '14天'],
        axisLabel: { color: muted },
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        min: 40,
        max: 100,
        axisLabel: { color: muted, formatter: '{value}%' },
        splitLine: { lineStyle: { color: rule } }
      },
      series: [{
        name: '变体正确率',
        type: 'line',
        smooth: true,
        symbolSize: 9,
        lineStyle: { width: 4, color: accent },
        itemStyle: { color: accent },
        areaStyle: { color: soft },
        data: [52, 68, 76, 84, 91]
      }]
    });
    return chart;
  }

  var charts = [initGeneChart(), initProgressChart()].filter(Boolean);
  window.addEventListener('resize', function () {
    charts.forEach(function (chart) { chart.resize(); });
  });
})();
