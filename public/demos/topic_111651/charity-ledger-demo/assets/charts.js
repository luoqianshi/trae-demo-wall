(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  var state = {
    income: 12860,
    expense: 7420,
    count: 18,
    goal: 20000,
    activeFilter: 'all',
    rows: [
      { type: 'income', title: '企业公益配捐', amount: 5000, user: '林青', category: '捐赠', receipt: 'bank_0719.jpg' },
      { type: 'expense', title: '采购保暖手套 120 双', amount: 2460, user: '陈敏', category: '采购', receipt: 'receipt_0720.jpg' },
      { type: 'income', title: '爱心人士定向捐赠', amount: 1200, user: '周洋', category: '捐赠', receipt: 'transfer_0720.png' },
      { type: 'expense', title: '仓储与打包材料', amount: 680, user: '林青', category: '物流', receipt: 'invoice_0721.pdf' }
    ],
    series: {
      dates: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
      income: [2200, 1500, 1800, 900, 2600, 2100, 1760],
      expense: [800, 1460, 720, 1180, 940, 1320, 1000]
    }
  };

  var chartEl = document.getElementById('ledgerChart');
  var chart = echarts.init(chartEl, null, { renderer: 'svg' });

  function money(n) {
    return '¥' + Number(n).toLocaleString('zh-CN');
  }

  function renderStats() {
    var progress = Math.min(100, Math.round(state.income / state.goal * 100));
    var score = Math.min(99, Math.round((state.rows.length / Math.max(state.count, 1)) * 100));
    document.getElementById('incomeTotal').textContent = money(state.income);
    document.getElementById('expenseTotal').textContent = money(state.expense);
    document.getElementById('balanceTotal').textContent = money(state.income - state.expense);
    document.getElementById('projectMeta').textContent = '公开透明 · 4 人协作 · ' + state.count + ' 笔记录';
    document.getElementById('progressText').textContent = progress + '% · 目标 ' + money(state.goal);
    document.getElementById('progressFill').style.width = progress + '%';
    document.getElementById('receiptCount').textContent = state.count;
    document.getElementById('transparencyScore').textContent = score + '%';
  }

  function renderLedger() {
    var list = document.getElementById('ledgerList');
    var rows = state.rows.filter(function(row) {
      return state.activeFilter === 'all' || row.type === state.activeFilter;
    });
    list.innerHTML = rows.map(function(row) {
      var prefix = row.type === 'income' ? '+' : '-';
      var label = row.type === 'income' ? '收入' : '支出';
      return '<div class="entry">' +
        '<div><strong>' + row.title + '</strong><p>' + label + ' · ' + row.category + ' · ' + row.user + '记录 · 凭证：' + row.receipt + '</p></div>' +
        '<div class="amount ' + row.type + '">' + prefix + money(row.amount) + '</div>' +
      '</div>';
    }).join('');
    if (!rows.length) {
      list.innerHTML = '<div class="entry"><div><strong>暂无匹配流水</strong><p>切换筛选条件或新增一笔记录</p></div></div>';
    }
  }

  function renderChart() {
    var balance = [];
    var running = 0;
    state.series.dates.forEach(function(_, i) {
      running += state.series.income[i] - state.series.expense[i];
      balance.push(running);
    });
    chart.setOption({
      animation: false,
      color: [accent, accent2, muted],
      tooltip: { trigger: 'axis', appendToBody: true, valueFormatter: money },
      legend: { top: 0, textStyle: { color: muted }, itemWidth: 10, itemHeight: 10 },
      grid: { left: 8, right: 10, bottom: 18, top: 42, containLabel: true },
      xAxis: {
        type: 'category',
        data: state.series.dates,
        axisLine: { lineStyle: { color: rule } },
        axisTick: { show: false },
        axisLabel: { color: muted }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: muted, formatter: function(v) { return v >= 1000 ? v / 1000 + 'k' : v; } },
        splitLine: { lineStyle: { color: rule } }
      },
      series: [
        { name: '收入', type: 'bar', barWidth: 14, data: state.series.income, itemStyle: { borderRadius: [8, 8, 0, 0] } },
        { name: '支出', type: 'bar', barWidth: 14, data: state.series.expense, itemStyle: { borderRadius: [8, 8, 0, 0] } },
        { name: '累计余额', type: 'line', smooth: true, symbolSize: 7, data: balance, lineStyle: { width: 3 }, areaStyle: { color: bg2, opacity: .45 } }
      ]
    });
  }

  function addEntry() {
    var type = document.getElementById('entryType').value;
    var amount = Math.max(1, Number(document.getElementById('entryAmount').value || 1));
    var title = document.getElementById('entryTitle').value.trim() || '未命名账目';
    var category = document.getElementById('entryCategory').value;
    var member = document.getElementById('entryMember').value;
    var receipt = type === 'income' ? 'transfer_new.png' : 'receipt_new.jpg';
    state.rows.unshift({ type: type, title: title, amount: amount, user: member, category: category, receipt: receipt });
    state.count += 1;
    if (type === 'income') {
      state.income += amount;
      state.series.income[state.series.income.length - 1] += amount;
    } else {
      state.expense += amount;
      state.series.expense[state.series.expense.length - 1] += amount;
    }
    document.getElementById('receiptState').textContent = '已上传并同步：' + receipt;
    renderStats();
    renderLedger();
    renderChart();
    showToast('已保存，并同步给协作者');
  }

  function showToast(text) {
    var toast = document.getElementById('toast');
    toast.textContent = text;
    toast.classList.add('show');
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function() {
      toast.classList.remove('show');
    }, 1600);
  }

  function applyTemplate(name) {
    var type = document.getElementById('entryType');
    var amount = document.getElementById('entryAmount');
    var title = document.getElementById('entryTitle');
    var category = document.getElementById('entryCategory');
    if (name === 'donate') {
      type.value = 'income';
      amount.value = 500;
      title.value = '爱心人士线上捐赠';
      category.value = '捐赠';
    }
    if (name === 'purchase') {
      type.value = 'expense';
      amount.value = 860;
      title.value = '采购公益物资';
      category.value = '采购';
    }
    if (name === 'logistics') {
      type.value = 'expense';
      amount.value = 120;
      title.value = '物资运输费用';
      category.value = '物流';
    }
    showToast('已填入模板，可继续修改');
  }

  document.getElementById('addEntry').addEventListener('click', addEntry);
  document.getElementById('createProject').addEventListener('click', function() {
    document.querySelector('.app').scrollIntoView({ behavior: 'smooth', block: 'center' });
    document.getElementById('entryTitle').focus();
  });
  document.getElementById('copyPublic').addEventListener('click', function() {
    var link = document.getElementById('publicLink').textContent;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link);
    }
    this.textContent = '已复制公开链接';
    showToast('公开查账链接已复制');
    var self = this;
    setTimeout(function() { self.textContent = '复制公开查账链接'; }, 1500);
  });
  document.querySelectorAll('.quick').forEach(function(btn) {
    btn.addEventListener('click', function() {
      applyTemplate(this.getAttribute('data-template'));
    });
  });
  document.querySelectorAll('.filter-chip').forEach(function(btn) {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.filter-chip').forEach(function(item) {
        item.classList.remove('active');
      });
      this.classList.add('active');
      state.activeFilter = this.getAttribute('data-filter');
      renderLedger();
    });
  });
  window.addEventListener('resize', function() { chart.resize(); });

  renderStats();
  renderLedger();
  renderChart();
})();
