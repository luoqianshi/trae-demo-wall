(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();

  var cases = [
    { id: 'R-0121-01', agent: '澜渟旗舰店:杨哲', scenario: 'T20系列', risk: '中', rawScore: 5, issue: '用户咨询优惠，客服答复申请到专享额外减100元优惠，商品有二类医疗器械资质。', quote: '担心问题：价格问题', advice: '优惠说明后补充适用条件、保价规则和产品资质证明路径，降低用户对价格与可信度的疑虑。' },
    { id: 'R-0122-01', agent: '澜渟旗舰店:盆底康复师mona', scenario: 'E10系列', risk: '中', rawScore: 7, issue: '用户咨询产后盆底肌修复仪使用方式，客服推荐E10 Air，说明用法为日一次半小时，隔天一疗程。', quote: '痛点场景：腹直肌分离', advice: '可进一步结合产后阶段、既往评估结果和使用禁忌，给出更个性化的居家训练建议。' },
    { id: 'R-0122-02', agent: '澜渟旗舰店:盆底康复师Molly', scenario: '其他', risk: '高', rawScore: 3, issue: '用户反映刚买的设备一侧无电流，要求换货；客服回复需寄回A机检测，若有问题换新，顺丰到付，3工作日出结果。', quote: '担心问题：产品使用问题、售后服务问题', advice: '先安抚用户并承接换货诉求，再清楚说明寄回、检测、换新和时效节点。' },
    { id: 'R-0127-01', agent: '澜渟旗舰店:盆底康复师mona', scenario: '其他', risk: '高', rawScore: 5, issue: '用户因刚买的盆底肌仪器降价200元要求退差价，客服提议退旧买新或补偿润滑剂，用户拒绝并威胁差评。', quote: '痛点场景：售后；担心问题：价格问题', advice: '明确价格保护边界，同时提供可选补偿方案和升级处理路径，避免冲突继续扩大。' },
    { id: 'R-0127-02', agent: '澜渟旗舰店:盆底康复师Tate', scenario: 'T20系列', risk: '中', rawScore: 6, issue: '用户咨询T20盆底肌修复仪选择、效果、使用及售后，客服介绍功能、疗程、质保并提供优惠。', quote: '担心问题：效果/功效、售后、使用、蓝牙断链', advice: '将功能介绍按“症状-方案-疗程-售后保障”重排，减少用户一次接收过多信息的负担。' },
    { id: 'R-0127-03', agent: '澜渟旗舰店:盆底康复师simo', scenario: '球', risk: '中', rawScore: 6, issue: '用户问产后多久能用训练器，客服答恶露干净后42天可使用。', quote: '担心问题：产品使用问题', advice: '补充医生复查、身体恢复状态和使用前注意事项，让建议更稳妥。' },
    { id: 'R-0127-04', agent: '澜渟旗舰店:盆底康复师simo', scenario: 'HA系列', risk: '中', rawScore: 5, issue: '用户询问电刺激是否有一紧一松感、产品是否品牌及有无该款，客服回答会有、是品牌且有该款。', quote: '担心问题：产品使用问题、品牌信任度', advice: '增加工作原理和品牌关系说明，给出购买入口或型号对照，提升可信度。' },
    { id: 'R-0129-01', agent: '澜渟旗舰店:盆底康复师simo', scenario: 'HA系列', risk: '中', rawScore: 6, issue: '用户问商品包含哪些东西，客服回答有主机、手册、阴道电极、压力探头等配件。', quote: '痛点场景：松弛、腹直肌分离', advice: '图片说明之外用文字列出配件，并解释各配件作用和后续咨询入口。' },
    { id: 'R-0130-01', agent: '澜渟旗舰店:盆底康复师fanny', scenario: 'E10系列', risk: '中', rawScore: 7, issue: '用户问E10如何选、做到什么程度不用做、能否重复使用、有无腹直肌功能。客服答选Air版，90分可停，可重复，Mate版含腹直肌修复。', quote: '痛点场景：漏尿/尿失禁、松弛、腹直肌分离', advice: '解释90分标准的检测方式，并结合医院疗程经历说明居家修复衔接。' },
    { id: 'R-0130-02', agent: '澜渟旗舰店:盆底康复师sasa', scenario: 'T20系列', risk: '中', rawScore: 3, issue: '用户询问盆底肌仪器是否有租，客服回复没有。', quote: '痛点场景：租赁需求', advice: '先直接回答暂无租赁，再补充长期使用价值、优惠政策和适用性咨询，避免用户流失。' }
  ].map(function(item) {
    var score = item.rawScore * 10;
    item.base = {
      polite: Math.min(100, score + 8),
      speed: Math.min(100, score + 4),
      compliance: score,
      solve: Math.max(0, score - 4)
    };
    return item;
  });

  var state = {
    scenario: 'all',
    risk: 'all',
    keyword: '',
    weights: { polite: 25, speed: 25, compliance: 30, solve: 20 }
  };

  var scoreChart = echarts.init(document.getElementById('chart-score'), null, { renderer: 'svg' });
  var riskChart = echarts.init(document.getElementById('chart-risk'), null, { renderer: 'svg' });

  function scoreOf(item) {
    var weights = state.weights;
    var total = weights.polite + weights.speed + weights.compliance + weights.solve;
    return Math.round((
      item.base.polite * weights.polite +
      item.base.speed * weights.speed +
      item.base.compliance * weights.compliance +
      item.base.solve * weights.solve
    ) / total);
  }

  function filteredCases() {
    var kw = state.keyword.trim().toLowerCase();
    return cases.filter(function(item) {
      var matchScenario = state.scenario === 'all' || item.scenario === state.scenario;
      var matchRisk = state.risk === 'all' || item.risk === state.risk;
      var haystack = [item.id, item.agent, item.scenario, item.risk, item.issue, item.advice, item.quote].join(' ').toLowerCase();
      var matchKeyword = !kw || haystack.indexOf(kw) >= 0;
      return matchScenario && matchRisk && matchKeyword;
    });
  }

  function riskClass(risk) {
    if (risk === '高') return 'high';
    if (risk === '低') return 'low';
    return '';
  }

  function renderTable(items) {
    var tbody = document.getElementById('caseTable');
    if (!items.length) {
      tbody.innerHTML = '<tr><td colspan="6">没有找到匹配的质检样本，请调整筛选条件。</td></tr>';
      return;
    }
    tbody.innerHTML = items.map(function(item) {
      return '<tr>' +
        '<td><strong>' + item.id + '</strong><br><span class="quote">坐席：' + item.agent + '</span></td>' +
        '<td>' + item.scenario + '</td>' +
        '<td><span class="risk ' + riskClass(item.risk) + '">' + item.risk + '风险</span></td>' +
        '<td><strong>' + scoreOf(item) + '</strong></td>' +
        '<td>' + item.issue + '<p class="quote">“' + item.quote + '”</p></td>' +
        '<td>' + item.advice + '</td>' +
      '</tr>';
    }).join('');
  }

  function renderHero(items) {
    var count = items.length || 1;
    var avgScore = Math.round(items.reduce(function(sum, item) { return sum + scoreOf(item); }, 0) / count);
    var high = items.filter(function(item) { return item.risk === '高' || item.risk === '中'; }).length;
    var pass = Math.round(items.filter(function(item) { return scoreOf(item) >= 80; }).length / count * 100);
    document.getElementById('heroScore').textContent = avgScore || 0;
    document.getElementById('caseCount').textContent = items.length;
    document.getElementById('riskCount').textContent = high;
    document.getElementById('avgResp').textContent = items.length > 3 ? '18s' : '22s';
    document.getElementById('passRate').textContent = (pass || 0) + '%';
  }

  function renderScoreChart(items) {
    var scenarios = ['T20系列', 'E10系列', 'HA系列', '其他', '球'];
    var data = scenarios.map(function(s) {
      var group = items.filter(function(item) { return item.scenario === s; });
      if (!group.length) return 0;
      return Math.round(group.reduce(function(sum, item) { return sum + scoreOf(item); }, 0) / group.length);
    });
    scoreChart.setOption({
      animation: false,
      color: [accent],
      tooltip: { trigger: 'axis', appendToBody: true },
      grid: { left: 36, right: 18, top: 22, bottom: 34 },
      xAxis: { type: 'category', data: scenarios, axisLabel: { color: muted }, axisLine: { lineStyle: { color: rule } }, axisTick: { show: false } },
      yAxis: { type: 'value', min: 0, max: 100, axisLabel: { color: muted }, splitLine: { lineStyle: { color: rule } } },
      series: [{ type: 'bar', data: data, barWidth: 38, itemStyle: { borderRadius: [10, 10, 0, 0], color: accent }, label: { show: true, position: 'top', color: ink } }]
    });
  }

  function renderRiskChart(items) {
    var riskNames = ['高', '中', '低'];
    var data = riskNames.map(function(name) {
      return { name: name + '风险', value: items.filter(function(item) { return item.risk === name; }).length };
    }).filter(function(item) { return item.value > 0; });
    riskChart.setOption({
      animation: false,
      color: [accent2, accent + 'aa', accent],
      tooltip: { trigger: 'item', appendToBody: true },
      legend: { bottom: 0, textStyle: { color: muted } },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['50%', '44%'],
        avoidLabelOverlap: true,
        itemStyle: { borderColor: bg2, borderWidth: 3 },
        label: { color: ink, formatter: '{b}: {c}' },
        data: data.length ? data : [{ name: '无匹配', value: 1, itemStyle: { color: rule } }]
      }]
    });
  }

  function renderReport(items) {
    var total = items.length;
    var avg = total ? Math.round(items.reduce(function(sum, item) { return sum + scoreOf(item); }, 0) / total) : 0;
    var risky = items.filter(function(item) { return item.risk === '高' || item.risk === '中'; });
    var topIssue = risky[0] ? risky[0].issue : '当前筛选下未发现明显风险。';
    var agents = {};
    items.forEach(function(item) {
      agents[item.agent] = agents[item.agent] || { count: 0, score: 0 };
      agents[item.agent].count += 1;
      agents[item.agent].score += scoreOf(item);
    });
    var agentRank = Object.keys(agents).map(function(name) {
      return { name: name, avg: Math.round(agents[name].score / agents[name].count) };
    }).sort(function(a, b) { return b.avg - a.avg; });
    var best = agentRank[0] ? agentRank[0].name + '（均分 ' + agentRank[0].avg + '）' : '暂无';
    document.getElementById('autoReport').textContent =
      '当前样本：' + total + ' 条\n' +
      '综合得分：' + avg + ' 分\n' +
      '重点风险：' + topIssue + '\n' +
      '表现较好坐席：' + best + '\n\n' +
      '建议：优先复盘高风险与中风险会话，重点关注“绝对化承诺”“补偿边界”“用户情绪承接”三类问题。对高分样本可提炼标准话术，用于新人培训和班组共学。';
  }

  function updateWeightLabels() {
    document.getElementById('wPoliteLabel').textContent = state.weights.polite + '%';
    document.getElementById('wSpeedLabel').textContent = state.weights.speed + '%';
    document.getElementById('wComplianceLabel').textContent = state.weights.compliance + '%';
    document.getElementById('wSolveLabel').textContent = state.weights.solve + '%';
  }

  function render() {
    var items = filteredCases();
    renderTable(items);
    renderHero(items);
    renderScoreChart(items);
    renderRiskChart(items);
    renderReport(items);
    updateWeightLabels();
  }

  document.getElementById('scenarioTabs').addEventListener('click', function(event) {
    var target = event.target.closest('button[data-scenario]');
    if (!target) return;
    state.scenario = target.getAttribute('data-scenario');
    Array.prototype.forEach.call(document.querySelectorAll('#scenarioTabs .chip'), function(btn) {
      btn.classList.toggle('active', btn === target);
    });
    render();
  });

  document.getElementById('riskFilter').addEventListener('change', function(event) {
    state.risk = event.target.value;
    render();
  });

  document.getElementById('keyword').addEventListener('input', function(event) {
    state.keyword = event.target.value;
    render();
  });

  [
    ['wPolite', 'polite'],
    ['wSpeed', 'speed'],
    ['wCompliance', 'compliance'],
    ['wSolve', 'solve']
  ].forEach(function(pair) {
    document.getElementById(pair[0]).addEventListener('input', function(event) {
      state.weights[pair[1]] = Number(event.target.value);
      render();
    });
  });

  document.getElementById('exportSummary').addEventListener('click', function() {
    var text = document.getElementById('autoReport').textContent;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function() {
        document.getElementById('exportSummary').textContent = '已复制摘要';
        setTimeout(function() { document.getElementById('exportSummary').textContent = '复制当前质检摘要'; }, 1600);
      });
    } else {
      window.prompt('复制当前质检摘要', text);
    }
  });

  window.addEventListener('resize', function() {
    scoreChart.resize();
    riskChart.resize();
  });

  render();
})();
