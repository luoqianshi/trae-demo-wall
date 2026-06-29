// CodeInsight Demo · 纯前端模拟对拍流程
(function () {
  var problems = {
    stones: {
      id: 'P1880',
      name: '石子合并',
      title: '石子合并（区间 DP）',
      desc: '在一条直线上有 N 堆石子，每堆有若干个石子。每次只能合并相邻两堆，合并代价为两堆石子数之和。求把所有石子合并成一堆的最小总代价。',
      spec: 'spec: n ∈ [1, 300], a_i ∈ [1, 1000]',
      failRound: 37,
      failMeta: 'n=4',
      input: '4\n3 1 4 1',
      userOutput: '17',
      stdOutput: '15',
      reason: '状态遗漏',
      main: [
        '// 区间 DP · 用户解法（演示：少处理某个转移边界）',
        '#include <bits/stdc++.h>',
        'using namespace std;',
        'int main() {',
        '    int n; cin >> n;',
        '    vector<int> a(n+1), s(n+1);',
        '    for (int i = 1; i <= n; i++) {',
        '        cin >> a[i];',
        '        s[i] = s[i-1] + a[i];',
        '    }',
        '    vector<vector<int>> dp(n+1, vector<int>(n+1, 0));',
        '    for (int len = 2; len <= n; len++) {',
        '        for (int i = 1; i + len - 1 <= n; i++) {',
        '            int j = i + len - 1;',
        '            dp[i][j] = INT_MAX;',
        '            for (int k = i; k < j; k++)',
        '                dp[i][j] = min(dp[i][j], dp[i][k] + dp[k+1][j] + s[j] - s[i-1]);',
        '        }',
        '    }',
        '    cout << dp[1][n] << endl;',
        '    return 0;',
        '}'
      ].join('\n'),
      brute: [
        '// 区间 DP · 暴力对照解',
        '#include <bits/stdc++.h>',
        'using namespace std;',
        'int solve(vector<int> a) {',
        '    if (a.size() == 1) return 0;',
        '    int best = INT_MAX;',
        '    for (int i = 0; i + 1 < (int)a.size(); i++) {',
        '        vector<int> b;',
        '        for (int j = 0; j < (int)a.size(); j++) {',
        '            if (j == i) b.push_back(a[j] + a[j+1]), j++;',
        '            else b.push_back(a[j]);',
        '        }',
        '        best = min(best, a[i] + a[i+1] + solve(b));',
        '    }',
        '    return best;',
        '}',
        'int main() {',
        '    int n; cin >> n;',
        '    vector<int> a(n);',
        '    for (int &x : a) cin >> x;',
        '    cout << solve(a) << endl;',
        '}'
      ].join('\n')
    },
    shortest: {
      id: 'P3371',
      name: '单源最短路径',
      title: '单源最短路径（图论）',
      desc: '给定一个有向带权图和起点 s，求从 s 到每个点的最短路径。图中可能存在重边和无法到达的点，需要正确处理大权值与松弛顺序。',
      spec: 'spec: n ∈ [1, 10^5], m ∈ [0, 2×10^5], w ∈ [0, 10^9]',
      failRound: 58,
      failMeta: 'n=3, m=2',
      input: '3 2 1\n1 2 1000000000\n2 3 1000000000',
      userOutput: '0 1000000000 -294967296',
      stdOutput: '0 1000000000 2000000000',
      reason: '数值溢出',
      main: [
        '// Dijkstra · 用户解法（演示：int 溢出）',
        '#include <bits/stdc++.h>',
        'using namespace std;',
        'int main() {',
        '    int n, m, s; cin >> n >> m >> s;',
        '    vector<vector<pair<int,int>>> g(n+1);',
        '    for (int i = 0; i < m; i++) {',
        '        int u, v, w; cin >> u >> v >> w;',
        '        g[u].push_back({v, w});',
        '    }',
        '    vector<int> dist(n+1, INT_MAX);',
        '    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<pair<int,int>>> pq;',
        '    dist[s] = 0; pq.push({0, s});',
        '    while (!pq.empty()) {',
        '        auto [d, u] = pq.top(); pq.pop();',
        '        if (d != dist[u]) continue;',
        '        for (auto [v, w] : g[u]) {',
        '            if (dist[v] > d + w) {',
        '                dist[v] = d + w;',
        '                pq.push({dist[v], v});',
        '            }',
        '        }',
        '    }',
        '    for (int i = 1; i <= n; i++) cout << dist[i] << \" \";',
        '}'
      ].join('\n'),
      brute: [
        '// Bellman-Ford · 暴力对照解',
        '#include <bits/stdc++.h>',
        'using namespace std;',
        'int main() {',
        '    int n, m, s; cin >> n >> m >> s;',
        '    vector<tuple<int,int,long long>> e;',
        '    for (int i = 0; i < m; i++) {',
        '        int u, v; long long w; cin >> u >> v >> w;',
        '        e.push_back({u, v, w});',
        '    }',
        '    const long long INF = 4e18;',
        '    vector<long long> d(n+1, INF);',
        '    d[s] = 0;',
        '    for (int t = 1; t < n; t++)',
        '        for (auto [u,v,w] : e)',
        '            if (d[u] < INF) d[v] = min(d[v], d[u] + w);',
        '    for (int i = 1; i <= n; i++) cout << d[i] << \" \";',
        '}'
      ].join('\n')
    },
    knapsack: {
      id: 'P1048',
      name: '采药（01 背包）',
      title: '采药（01 背包）',
      desc: '给定总时间 T 和 M 株草药，每株草药有采摘时间与价值。每株草药只能采一次，求在总时间内能获得的最大价值。',
      spec: 'spec: T ∈ [1, 1000], M ∈ [1, 100], time_i/value_i ∈ [1, 1000]',
      failRound: 22,
      failMeta: 'T=5, M=2',
      input: '5 2\n5 10\n4 8',
      userOutput: '18',
      stdOutput: '10',
      reason: '状态遗漏',
      main: [
        '// 01 背包 · 用户解法（演示：循环方向错误，变成完全背包）',
        '#include <bits/stdc++.h>',
        'using namespace std;',
        'int main() {',
        '    int T, M; cin >> T >> M;',
        '    vector<int> dp(T+1);',
        '    for (int i = 1; i <= M; i++) {',
        '        int cost, val; cin >> cost >> val;',
        '        for (int j = cost; j <= T; j++) {',
        '            dp[j] = max(dp[j], dp[j-cost] + val);',
        '        }',
        '    }',
        '    cout << dp[T] << endl;',
        '}'
      ].join('\n'),
      brute: [
        '// 枚举子集 · 暴力对照解',
        '#include <bits/stdc++.h>',
        'using namespace std;',
        'int main() {',
        '    int T, M; cin >> T >> M;',
        '    vector<int> c(M), v(M);',
        '    for (int i = 0; i < M; i++) cin >> c[i] >> v[i];',
        '    int ans = 0;',
        '    for (int mask = 0; mask < (1<<M); mask++) {',
        '        int cost = 0, val = 0;',
        '        for (int i = 0; i < M; i++) if (mask >> i & 1) cost += c[i], val += v[i];',
        '        if (cost <= T) ans = max(ans, val);',
        '    }',
        '    cout << ans << endl;',
        '}'
      ].join('\n')
    }
  };

  var state = {
    current: 'stones',
    tab: 'main',
    running: false,
    hasResult: false,
    counts: {
      '边界条件': 0,
      '数值溢出': 0,
      '状态遗漏': 0,
      '复杂度退化': 0,
      '输入解析': 0
    }
  };

  var $ = function (selector) { return document.querySelector(selector); };
  var $$ = function (selector) { return Array.prototype.slice.call(document.querySelectorAll(selector)); };

  var dom = {
    cards: $$('.problem-card'),
    desc: $('#problem-desc'),
    spec: $('#problem-spec'),
    tabs: $$('.editor-tabs .tab'),
    editor: $('#code-editor'),
    runBtn: $('#run-btn'),
    rounds: $('#round-select'),
    strategy: $('#strategy-select'),
    progressText: $('#progress-text'),
    progressCount: $('#progress-count'),
    progressFill: $('#progress-fill'),
    empty: $('#result-empty'),
    panel: $('#result-panel'),
    failTitle: $('#fail-title'),
    failInput: $('#fail-input'),
    userOutput: $('#user-output'),
    stdOutput: $('#std-output'),
    archiveTip: $('#archive-tip'),
    picks: $$('#tag-picker .pick'),
    totalCases: $('#total-cases'),
    weekCases: $('#week-cases'),
    mainWeakness: $('#main-weakness'),
    caseList: $('#case-list')
  };

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function highlight(code) {
    var html = escapeHtml(code);
    html = html.replace(/(\/\/.*)$/gm, '<span class="com">$1</span>');
    html = html.replace(/(#include)/g, '<span class="kw">$1</span>');
    html = html.replace(/\b(using|namespace|return|if|else|for|while|const|auto|continue)\b/g, '<span class="kw">$1</span>');
    html = html.replace(/\b(int|long long|vector|pair|tuple|string|priority_queue)\b/g, '<span class="ty">$1</span>');
    html = html.replace(/\b(\d+)\b/g, '<span class="num">$1</span>');
    html = html.replace(/(&quot;.*?&quot;)/g, '<span class="str">$1</span>');
    return html;
  }

  function activeProblem() {
    return problems[state.current];
  }

  function renderProblem() {
    var p = activeProblem();
    dom.desc.textContent = p.desc;
    dom.spec.textContent = p.spec;
    dom.cards.forEach(function (card) {
      card.classList.toggle('active', card.dataset.problem === state.current);
    });
    renderEditor();
    resetRunState();
  }

  function renderEditor() {
    var p = activeProblem();
    dom.editor.innerHTML = highlight(state.tab === 'main' ? p.main : p.brute);
    dom.tabs.forEach(function (tab) {
      tab.classList.toggle('active', tab.dataset.codeTab === state.tab);
    });
  }

  function resetRunState() {
    state.hasResult = false;
    dom.empty.style.display = 'block';
    dom.panel.classList.remove('show');
    dom.progressText.textContent = '就绪 · 等待启动';
    dom.progressCount.textContent = '0 / ' + dom.rounds.value;
    dom.progressFill.style.width = '0%';
    dom.runBtn.textContent = '开始对拍';
    dom.runBtn.classList.remove('running', 'done');
    dom.archiveTip.textContent = '待归档';
    dom.archiveTip.style.color = 'var(--muted)';
    dom.picks.forEach(function (pick) { pick.classList.remove('active'); });
  }

  function renderResult() {
    var p = activeProblem();
    dom.empty.style.display = 'none';
    dom.panel.classList.add('show');
    dom.failTitle.innerHTML = 'FAIL · case #' + p.failRound + ' <span style="color:var(--muted)">' + p.failMeta + '</span>';
    dom.failInput.textContent = p.input;
    dom.userOutput.textContent = p.userOutput;
    dom.stdOutput.textContent = p.stdOutput;
    dom.archiveTip.textContent = '推荐：' + p.reason;
    dom.archiveTip.style.color = 'var(--accent)';
    dom.picks.forEach(function (pick) {
      pick.classList.toggle('active', pick.dataset.reason === p.reason);
    });
  }

  function runStress() {
    if (state.running) return;
    state.running = true;
    state.hasResult = false;
    dom.runBtn.textContent = '对拍中';
    dom.runBtn.classList.add('running');
    dom.runBtn.classList.remove('done');
    dom.empty.style.display = 'block';
    dom.panel.classList.remove('show');
    dom.archiveTip.textContent = '待归档';
    dom.picks.forEach(function (pick) { pick.classList.remove('active'); });

    var total = parseInt(dom.rounds.value, 10) || 500;
    var tick = 0;
    var duration = 1900;
    var start = Date.now();
    var timer = setInterval(function () {
      var elapsed = Date.now() - start;
      var t = Math.min(elapsed / duration, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      tick = Math.floor(eased * total);
      dom.progressFill.style.width = Math.min(100, eased * 100) + '%';
      dom.progressCount.textContent = tick + ' / ' + total;
      dom.progressText.textContent = '生成数据 · 编译运行 · diff 比对中';

      if (t >= 1) {
        clearInterval(timer);
        state.running = false;
        state.hasResult = true;
        dom.progressText.textContent = '命中差异 · Diff @ round #' + activeProblem().failRound;
        dom.progressCount.textContent = activeProblem().failRound + ' / ' + total;
        dom.progressFill.style.width = '100%';
        dom.runBtn.textContent = '重新对拍';
        dom.runBtn.classList.remove('running');
        dom.runBtn.classList.add('done');
        renderResult();
      }
    }, 40);
  }

  function addCase(reason) {
    var p = activeProblem();
    state.counts[reason] = (state.counts[reason] || 0) + 1;
    dom.picks.forEach(function (pick) {
      pick.classList.toggle('active', pick.dataset.reason === reason);
    });
    dom.archiveTip.textContent = '已归档';
    dom.archiveTip.style.color = 'var(--success)';

    var li = document.createElement('li');
    var reasonClass = reason === '边界条件' ? 'b' : reason === '数值溢出' ? 'o' : reason === '复杂度退化' ? 'c' : 'b';
    li.innerHTML =
      '<span>' + escapeHtml(p.title) + ' · ' + escapeHtml(reason) + '</span>' +
      '<span class="when">刚刚</span>' +
      '<span class="why ' + reasonClass + '">' + escapeHtml(reason.slice(0, 2)) + '</span>';
    dom.caseList.insertBefore(li, dom.caseList.firstChild);
    renderStats();
    renderCharts();
  }

  function renderStats() {
    var entries = Object.entries(state.counts);
    var total = entries.reduce(function (sum, item) { return sum + item[1]; }, 0);
    var main = entries.slice().sort(function (a, b) { return b[1] - a[1]; })[0];
    dom.totalCases.textContent = total;
    dom.weekCases.textContent = total;
    dom.mainWeakness.textContent = total ? main[0] : '--';
  }

  var reasonChart = null;
  var radarChart = null;

  function chartVars() {
    var style = getComputedStyle(document.documentElement);
    return {
      accent: style.getPropertyValue('--accent').trim(),
      accent2: style.getPropertyValue('--accent2').trim(),
      warn: style.getPropertyValue('--warn').trim(),
      danger: style.getPropertyValue('--danger').trim(),
      ink: style.getPropertyValue('--ink').trim(),
      muted: style.getPropertyValue('--muted').trim(),
      rule: style.getPropertyValue('--rule').trim(),
      bg2: style.getPropertyValue('--bg2').trim()
    };
  }

  function renderCharts() {
    if (!window.echarts) return;
    var v = chartVars();
    var data = Object.keys(state.counts).map(function (key) {
      return { name: key, value: state.counts[key] };
    });
    var total = data.reduce(function (sum, item) { return sum + item.value; }, 0);
    if (!total) {
      data = [
        { name: '边界条件', value: 1 },
        { name: '数值溢出', value: 1 },
        { name: '状态遗漏', value: 1 },
        { name: '复杂度退化', value: 1 },
        { name: '输入解析', value: 1 }
      ];
    }

    if (!reasonChart) {
      reasonChart = echarts.init(document.getElementById('reason-chart'), null, { renderer: 'svg' });
    }
    reasonChart.setOption({
      animation: false,
      color: [v.accent, v.accent2, v.warn, v.danger, v.muted],
      tooltip: { trigger: 'item', appendToBody: true, backgroundColor: v.bg2, borderColor: v.rule, textStyle: { color: v.ink } },
      legend: { bottom: 0, textStyle: { color: v.muted, fontFamily: 'JetMono, monospace', fontSize: 10 } },
      series: [{
        name: '错因分布',
        type: 'pie',
        radius: ['46%', '70%'],
        center: ['50%', '43%'],
        itemStyle: { borderColor: v.bg2, borderWidth: 2 },
        label: { color: v.ink, fontFamily: 'JetMono, monospace', fontSize: 11, formatter: '{b}\n{d}%' },
        data: data
      }]
    });

    if (!radarChart) {
      radarChart = echarts.init(document.getElementById('radar-chart'), null, { renderer: 'svg' });
    }
    radarChart.setOption({
      animation: false,
      tooltip: { appendToBody: true, backgroundColor: v.bg2, borderColor: v.rule, textStyle: { color: v.ink } },
      radar: {
        indicator: [
          { name: '边界', max: 5 },
          { name: '溢出', max: 5 },
          { name: '状态', max: 5 },
          { name: '复杂度', max: 5 },
          { name: '输入', max: 5 }
        ],
        radius: '62%',
        axisName: { color: v.ink, fontFamily: 'JetMono, monospace', fontSize: 11 },
        splitLine: { lineStyle: { color: v.rule } },
        splitArea: { areaStyle: { color: ['transparent', v.bg2] } },
        axisLine: { lineStyle: { color: v.rule } }
      },
      series: [{
        type: 'radar',
        symbol: 'circle',
        symbolSize: 5,
        data: [{
          value: [
            state.counts['边界条件'],
            state.counts['数值溢出'],
            state.counts['状态遗漏'],
            state.counts['复杂度退化'],
            state.counts['输入解析']
          ].map(function (x) { return Math.max(x, total ? x : 1); }),
          name: '当前弱点',
          lineStyle: { color: v.accent, width: 2 },
          itemStyle: { color: v.accent },
          areaStyle: { color: v.accent + '33' }
        }]
      }]
    });
  }

  function bindEvents() {
    dom.cards.forEach(function (card) {
      card.addEventListener('click', function () {
        state.current = card.dataset.problem;
        state.tab = 'main';
        renderProblem();
      });
    });

    dom.tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        state.tab = tab.dataset.codeTab;
        renderEditor();
      });
    });

    dom.rounds.addEventListener('change', function () {
      if (!state.running) resetRunState();
    });

    dom.strategy.addEventListener('change', function () {
      if (!state.running) resetRunState();
    });

    dom.runBtn.addEventListener('click', runStress);

    dom.picks.forEach(function (pick) {
      pick.addEventListener('click', function () {
        if (!state.hasResult) return;
        addCase(pick.dataset.reason);
      });
    });

    window.addEventListener('resize', function () {
      if (reasonChart) reasonChart.resize();
      if (radarChart) radarChart.resize();
    });
  }

  bindEvents();
  renderProblem();
  renderStats();
  renderCharts();
})();
