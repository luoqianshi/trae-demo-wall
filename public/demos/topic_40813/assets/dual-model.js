(function() {
  'use strict';

  // ========== Fixed Coefficients ==========
  var K1 = 2, M1 = 4, K2 = 1.25, KW = 0.5;

  // ========== Tolerance Threshold ==========
  var TOL_PASS = 0.10;    // 10% 校验通过阈值

  // ========== Mode State ==========
  var currentMode = 'eco';

  // ========== Mode Switching ==========
  window.switchMode = function(mode) {
    currentMode = mode;
    document.querySelectorAll('.mode-btn').forEach(function(b) {
      b.classList.toggle('active', b.getAttribute('data-mode') === mode);
    });
    document.getElementById('mode-eco').classList.toggle('hidden', mode !== 'eco');
    document.getElementById('mode-ai').classList.toggle('hidden', mode !== 'ai');

    if (mode === 'eco') {
      document.getElementById('nmS').textContent = '草 S';
      document.getElementById('nmY').textContent = '羊 Y';
      document.getElementById('nmW').textContent = '狼 W';
      document.getElementById('lblSY').textContent = 'S 生 Y';
      document.getElementById('lblYW').textContent = 'Y 生 W';
      document.getElementById('lblWY').textContent = 'W 克 Y';
      document.getElementById('lblYS').textContent = 'Y 克 S';
    } else {
      document.getElementById('nmS').textContent = '社会资源 S';
      document.getElementById('nmY').textContent = '就业岗位 Y';
      document.getElementById('nmW').textContent = 'AI规模 W';
      document.getElementById('lblSY').textContent = '资源孕育岗位';
      document.getElementById('lblYW').textContent = '岗位催生AI';
      document.getElementById('lblWY').textContent = 'AI挤压岗位';
      document.getElementById('lblYS').textContent = '岗位消耗资源';
    }
  };

  window.toggleDesign = function() {
    var el = document.getElementById('designContent');
    var btn = document.getElementById('toggleDesign');
    var open = el.classList.toggle('open');
    btn.textContent = open ? '收起设计价值说明 ▲' : '展开设计价值说明 ▼';
  };

  window.toggleTolerance = function() {
    var el = document.getElementById('toleranceContent');
    var btn = document.getElementById('toggleTolerance');
    var open = el.classList.toggle('open');
    btn.textContent = open ? '收起容错校验规则说明 ▲' : '展开容错校验规则说明 ▼';
  };

  // ========== Ring Node Sizing ==========
  function updateRingNodes(S, Y, W) {
    var maxVal = Math.max(S, Y, W, 1);
    var minSize = 60, maxSize = 140;
    function sz(v) { return Math.round(minSize + (v / maxVal) * (maxSize - minSize)); }
    var nS = document.getElementById('nodeS');
    var nY = document.getElementById('nodeY');
    var nW = document.getElementById('nodeW');
    nS.style.width = sz(S) + 'px'; nS.style.height = sz(S) + 'px';
    nY.style.width = sz(Y) + 'px'; nY.style.height = sz(Y) + 'px';
    nW.style.width = sz(W) + 'px'; nW.style.height = sz(W) + 'px';
    document.getElementById('valS').textContent = S.toFixed(1);
    document.getElementById('valY').textContent = Y.toFixed(1);
    document.getElementById('valW').textContent = W.toFixed(1);
  }

  // ========== Tolerance Check Helpers ==========
  function calcErrorRate(S, W) {
    var lhs = K1 * S, rhs = M1 * W;
    var maxV = Math.max(Math.abs(lhs), Math.abs(rhs), 0.001);
    return Math.abs(lhs - rhs) / maxV;
  }

  function checkEquilibrium(S, W) {
    var lhs = K1 * S, rhs = M1 * W;
    var err = calcErrorRate(S, W);
    var pass = err <= TOL_PASS;
    return { lhs: lhs, rhs: rhs, err: err, pass: pass };
  }

  function checkGrassMatch(S, Y) {
    var expected = K2 * Y;
    var diff = Math.abs(S - expected);
    var maxV = Math.max(Math.abs(S), Math.abs(expected), 0.001);
    var err = diff / maxV;
    var pass = err <= TOL_PASS;
    return { expected: expected, diff: diff, err: err, pass: pass };
  }

  // ========== Result Builders ==========
  function buildEcoResult(resultVal, valClass, stepHtml, eq, gm, wLabel, yLabel, sLabel) {
    var html = '<div>最优' + sLabel + ' = <span class="rv ' + valClass + '">' + resultVal.toFixed(2) + '</span></div>';
    html += stepHtml;

    var statusHtml = '';
    var summaryHtml = '';

    if (eq.pass) {
      statusHtml = '<div class="status-ok">&#10004; 稳态校验通过：整体误差 ' + (eq.err*100).toFixed(1) + '%，在10%容错区间以内，系统处于动态平衡</div>';
      summaryHtml = '<div class="summary">计算完成！已知参数：' + wLabel + '=' + (eq.rhs/M1).toFixed(0) + '，' + yLabel + '（输入值）<br>全局最优均衡' + sLabel + ' = ' + resultVal.toFixed(2) + '<br>当前三组变量处于动态平衡状态，微小偏差不会破坏系统循环，相生收益与相克损耗基本抵消，系统可以长期稳定运行。</div>';
    } else {
      statusHtml = '<div class="status-warn">&#9888; 稳态校验未通过：误差 ' + (eq.err*100).toFixed(1) + '% 超出10%阈值，当前输入参数无法达成全局均衡</div>';
      summaryHtml = '<div class="summary">计算完成，理论最优数值：' + resultVal.toFixed(2) + '<br>稳态校验未通过：当前输入参数无法达成全局均衡<br>提示：当前组合会造成系统失衡，长期运行会出现物种数量剧烈震荡，建议调整输入数值，匹配均衡配比。</div>';
    }

    html += statusHtml + summaryHtml;
    return html;
  }

  function buildAiResult(resultVal, valClass, stepHtml, eq, gm, wLabel, yLabel, sLabel) {
    var html = '<div>最优' + sLabel + ' = <span class="rv ' + valClass + '">' + resultVal.toFixed(2) + '</span></div>';
    html += stepHtml;

    var statusHtml = '';
    var summaryHtml = '';

    if (eq.pass) {
      statusHtml = '<div class="status-ok">&#10004; 稳态校验通过：整体误差 ' + (eq.err*100).toFixed(1) + '%，在10%容错区间以内，系统处于动态平衡</div>';
      summaryHtml = '<div class="summary">计算完成！已知参数：' + wLabel + '=' + (eq.rhs/M1).toFixed(0) + '，' + yLabel + '（输入值）<br>全局均衡' + sLabel + ' = ' + resultVal.toFixed(2) + '<br>当前三者处于动态经济平衡：资源供给可以稳定承载现有岗位体量，岗位规模匹配当前AI应用水平；AI替代力度合理，不会过度冲击就业，整套社会经济系统可以长期稳定运转。</div>';
    } else {
      statusHtml = '<div class="status-warn">&#9888; 稳态校验未通过：误差 ' + (eq.err*100).toFixed(1) + '% 超出10%阈值，当前输入参数无法达成全局经济均衡</div>';
      summaryHtml = '<div class="summary">计算完成，理论最优数值：' + resultVal.toFixed(2) + '<br>稳态校验未通过：当前输入参数无法达成全局经济均衡<br>风险提示：当前配比会造成经济系统失衡。<br>情况1：AI规模偏大，会大幅挤压中间就业岗位，居民收入收缩，消费能力下滑，最终社会资源整体萎缩；<br>情况2：AI规模偏小，缺少上层制衡，低效岗位泛滥，持续透支社会资源，经济增长会快速触顶。<br>建议调整数值，匹配均衡配比。</div>';
    }

    html += statusHtml + summaryHtml;
    return html;
  }

  // ========== ECO MODE CALCULATORS ==========
  window.calcEcoS = function() {
    var W = parseFloat(document.getElementById('eco-c1-w').value) || 0;
    var Y = parseFloat(document.getElementById('eco-c1-y').value) || 0;
    var S_base = K2 * Y;
    var S_eq = (M1 / K1) * W;
    var S_final = S_base;
    var eq = checkEquilibrium(S_final, W);

    var stepHtml = '<div class="step">Step 1: S_base = k₂ × Y = ' + K2 + ' × ' + Y + ' = ' + S_base.toFixed(2) + '</div>';
    stepHtml += '<div class="step">Step 2: S_eq = (m₁/k₁) × W = (' + M1 + '/' + K1 + ') × ' + W + ' = ' + S_eq.toFixed(2) + '</div>';

    var box = document.getElementById('eco-res1');
    box.innerHTML = buildEcoResult(S_final, 'green', stepHtml, eq, null, '狼W', '羊Y', '草 S');
    updateRingNodes(S_final, Y, W);
  };

  window.calcEcoY = function() {
    var W = parseFloat(document.getElementById('eco-c2-w').value) || 0;
    var S = parseFloat(document.getElementById('eco-c2-s').value) || 0;
    var Y_final = S / K2;
    var eq = checkEquilibrium(S, W);

    var stepHtml = '<div class="step">Step 1: Y = S / k₂ = ' + S + ' / ' + K2 + ' = ' + Y_final.toFixed(2) + '</div>';
    stepHtml += '<div class="step">Step 2: 制衡稳态校验 → k₁·S = ' + (K1*S).toFixed(2) + '，m₁·W = ' + (M1*W).toFixed(2) + '</div>';

    var box = document.getElementById('eco-res2');
    box.innerHTML = buildEcoResult(Y_final, 'yellow', stepHtml, eq, null, '狼W', '草S', '羊 Y');
    updateRingNodes(S, Y_final, W);
  };

  window.calcEcoW = function() {
    var Y = parseFloat(document.getElementById('eco-c3-y').value) || 0;
    var S = parseFloat(document.getElementById('eco-c3-s').value) || 0;
    var W_final = (K1 / M1) * S;
    var gm = checkGrassMatch(S, Y);

    var stepHtml = '<div class="step">Step 1: W = (k₁/m₁) × S = (' + K1 + '/' + M1 + ') × ' + S + ' = ' + W_final.toFixed(2) + '</div>';
    stepHtml += '<div class="step">Step 2: 粮草匹配校验 → S = ' + S + '，k₂·Y = ' + gm.expected.toFixed(2) + '（误差 ' + (gm.err*100).toFixed(1) + '%）</div>';

    // For scene 3 (solve W), the equilibrium check should use the computed W vs input S/Y relationship
    // The key check is: does S match k2*Y (grass match)? And does k1*S ≈ m1*W?
    // We already computed W from S, so k1*S = m1*W is automatically satisfied.
    // The real check is whether the input S/Y pair is consistent.
    var box = document.getElementById('eco-res3');
    var html = '<div>最优狼 W = <span class="rv red">' + W_final.toFixed(2) + '</span></div>';
    html += stepHtml;

    if (gm.pass) {
      html += '<div class="status-ok">&#10004; 稳态校验通过：粮草匹配误差 ' + (gm.err*100).toFixed(1) + '%，在10%容错区间以内，系统处于动态平衡</div>';
      html += '<div class="summary">计算完成！已知参数：羊Y=' + Y + '，草S=' + S + '<br>全局最优均衡狼量 W = ' + W_final.toFixed(2) + '<br>当前三组变量处于动态平衡状态，微小偏差不会破坏系统循环，相生收益与相克损耗基本抵消，系统可以长期稳定运行。</div>';
    } else {
      html += '<div class="status-warn">&#9888; 稳态校验未通过：粮草匹配误差 ' + (gm.err*100).toFixed(1) + '% 超出10%阈值，当前输入参数无法达成全局均衡</div>';
      html += '<div class="summary">计算完成，理论最优数值：' + W_final.toFixed(2) + '<br>稳态校验未通过：当前输入参数无法达成全局均衡<br>提示：当前组合会造成系统失衡，长期运行会出现物种数量剧烈震荡，建议调整输入数值，匹配均衡配比。</div>';
    }

    box.innerHTML = html;
    updateRingNodes(S, Y, W_final);
  };

  // ========== AI MODE CALCULATORS ==========
  window.calcAiS = function() {
    var W = parseFloat(document.getElementById('ai-c1-w').value) || 0;
    var Y = parseFloat(document.getElementById('ai-c1-y').value) || 0;
    var S_base = K2 * Y;
    var S_eq = (M1 / K1) * W;
    var S_final = S_base;
    var eq = checkEquilibrium(S_final, W);

    var stepHtml = '<div class="step">Step 1: 粮草匹配式 → S = k₂ × Y = ' + K2 + ' × ' + Y + ' = ' + S_base.toFixed(2) + '</div>';
    stepHtml += '<div class="step">Step 2: 制衡稳态式 → S = (m₁/k₁) × W = (' + M1 + '/' + K1 + ') × ' + W + ' = ' + S_eq.toFixed(2) + '</div>';

    var box = document.getElementById('ai-res1');
    box.innerHTML = buildAiResult(S_final, 'green', stepHtml, eq, null, 'AI规模W', '就业岗位Y', '社会资源 S');
    updateRingNodes(S_final, Y, W);
  };

  window.calcAiY = function() {
    var W = parseFloat(document.getElementById('ai-c2-w').value) || 0;
    var S = parseFloat(document.getElementById('ai-c2-s').value) || 0;
    var Y_final = S / K2;
    var eq = checkEquilibrium(S, W);

    var stepHtml = '<div class="step">Step 1: 粮草匹配式变形 → Y = S / k₂ = ' + S + ' / ' + K2 + ' = ' + Y_final.toFixed(2) + '</div>';
    stepHtml += '<div class="step">Step 2: 制衡稳态校验 → k₁·S = ' + (K1*S).toFixed(2) + '，m₁·W = ' + (M1*W).toFixed(2) + '</div>';

    var box = document.getElementById('ai-res2');
    box.innerHTML = buildAiResult(Y_final, 'yellow', stepHtml, eq, null, 'AI规模W', '社会资源S', '就业岗位 Y');
    updateRingNodes(S, Y_final, W);
  };

  window.calcAiW = function() {
    var Y = parseFloat(document.getElementById('ai-c3-y').value) || 0;
    var S = parseFloat(document.getElementById('ai-c3-s').value) || 0;
    var W_final = (K1 / M1) * S;
    var gm = checkGrassMatch(S, Y);

    var stepHtml = '<div class="step">Step 1: 制衡稳态式变形 → W = (k₁/m₁) × S = (' + K1 + '/' + M1 + ') × ' + S + ' = ' + W_final.toFixed(2) + '</div>';
    stepHtml += '<div class="step">Step 2: 粮草匹配校验 → S = ' + S + '，k₂·Y = ' + gm.expected.toFixed(2) + '（误差 ' + (gm.err*100).toFixed(1) + '%）</div>';

    // For scene C (solve W), W is computed from S so k1*S = m1*W is automatically satisfied.
    // The real check is whether the input S/Y pair is consistent.
    var box = document.getElementById('ai-res3');
    var html = '<div>合理AI规模 W = <span class="rv red">' + W_final.toFixed(2) + '</span></div>';
    html += stepHtml;

    if (gm.pass) {
      html += '<div class="status-ok">&#10004; 稳态校验通过：粮草匹配误差 ' + (gm.err*100).toFixed(1) + '%，在10%容错区间以内，系统处于动态平衡</div>';
      html += '<div class="summary">计算完成！已知参数：就业岗位Y=' + Y + '，社会资源S=' + S + '<br>全局均衡AI应用规模 W = ' + W_final.toFixed(2) + '<br>当前三者处于动态经济平衡：资源供给可以稳定承载现有岗位体量，岗位规模匹配当前AI应用水平；AI替代力度合理，不会过度冲击就业，整套社会经济系统可以长期稳定运转。</div>';
    } else {
      html += '<div class="status-warn">&#9888; 稳态校验未通过：粮草匹配误差 ' + (gm.err*100).toFixed(1) + '% 超出10%阈值，当前输入参数无法达成全局经济均衡</div>';
      html += '<div class="summary">计算完成，理论最优数值：' + W_final.toFixed(2) + '<br>稳态校验未通过：当前输入参数无法达成全局经济均衡<br>风险提示：当前配比会造成经济系统失衡。<br>情况1：AI规模偏大，会大幅挤压中间就业岗位，居民收入收缩，消费能力下滑，最终社会资源整体萎缩；<br>情况2：AI规模偏小，缺少上层制衡，低效岗位泛滥，持续透支社会资源，经济增长会快速触顶。<br>建议调整数值，匹配均衡配比。</div>';
    }

    box.innerHTML = html;
    updateRingNodes(S, Y, W_final);
  };

  // ========== SIMULATION ENGINE ==========
  function createSim(chartId) {
    var chart = echarts.init(document.getElementById(chartId), null, { renderer: 'svg' });
    window.addEventListener('resize', function() { chart.resize(); });
    var timer = null;

    function init() {
      chart.setOption({
        animation: false,
        tooltip: { trigger: 'axis', appendToBody: true },
        legend: { data: ['草/资源 S', '羊/岗位 Y', '狼/AI W', '均衡线 S*', '均衡线 Y*', '均衡线 W*'], textStyle: { color: '#7b8ba5', fontSize: 11 }, top: 0 },
        grid: { left: 55, right: 20, top: 40, bottom: 30 },
        xAxis: { type: 'category', data: [], axisLine: { lineStyle: { color: '#2a3654' } }, axisLabel: { color: '#7b8ba5', fontSize: 11 } },
        yAxis: { type: 'value', axisLine: { lineStyle: { color: '#2a3654' } }, splitLine: { lineStyle: { color: '#1a2540' } }, axisLabel: { color: '#7b8ba5', fontSize: 11 } },
        series: [
          { name: '草/资源 S', type: 'line', data: [], smooth: true, showSymbol: false, lineStyle: { width: 2.5, color: '#22c55e' }, itemStyle: { color: '#22c55e' } },
          { name: '羊/岗位 Y', type: 'line', data: [], smooth: true, showSymbol: false, lineStyle: { width: 2.5, color: '#f59e0b' }, itemStyle: { color: '#f59e0b' } },
          { name: '狼/AI W', type: 'line', data: [], smooth: true, showSymbol: false, lineStyle: { width: 2.5, color: '#ef4444' }, itemStyle: { color: '#ef4444' } },
          { name: '均衡线 S*', type: 'line', data: [], smooth: false, showSymbol: false, lineStyle: { width: 1.5, color: '#22c55e', type: 'dashed' }, itemStyle: { color: '#22c55e' } },
          { name: '均衡线 Y*', type: 'line', data: [], smooth: false, showSymbol: false, lineStyle: { width: 1.5, color: '#f59e0b', type: 'dashed' }, itemStyle: { color: '#f59e0b' } },
          { name: '均衡线 W*', type: 'line', data: [], smooth: false, showSymbol: false, lineStyle: { width: 1.5, color: '#ef4444', type: 'dashed' }, itemStyle: { color: '#ef4444' } }
        ]
      });
    }
    init();

    function run(s0, y0, w0) {
      if (timer) { clearInterval(timer); timer = null; }
      var Y_eq = y0;
      var S_eq = K2 * Y_eq;
      var W_eq = (K1 / M1) * S_eq;
      var st = { S: s0, Y: y0, W: w0 };
      var hist = { t: [], S: [], Y: [], W: [], Se: [], Ye: [], We: [] };
      var dt = 0.06, time = 0, step = 0, maxSteps = 600;

      // Compute error rate to determine simulation intensity
      var err = calcErrorRate(s0, w0);
      // Scale factor: within tolerance = gentle waves, beyond = violent oscillation
      var scale = err <= TOL_PASS ? 0.00015 : 0.0008;

      timer = setInterval(function() {
        var S = st.S, Y = st.Y, W = st.W;
        var dS = -K2 * S * Y * scale;
        var dY = (K1 * S * Y - M1 * W * Y) * scale;
        var dW = KW * W * Y * scale;
        st.S = Math.max(0.5, S + dS * dt);
        st.Y = Math.max(0.5, Y + dY * dt);
        st.W = Math.max(0.5, W + dW * dt);
        time += dt; step++;
        hist.t.push(time.toFixed(1));
        hist.S.push(+st.S.toFixed(2));
        hist.Y.push(+st.Y.toFixed(2));
        hist.W.push(+st.W.toFixed(2));
        hist.Se.push(+S_eq.toFixed(2));
        hist.Ye.push(+Y_eq.toFixed(2));
        hist.We.push(+W_eq.toFixed(2));
        chart.setOption({
          xAxis: { data: hist.t },
          series: [
            { data: hist.S }, { data: hist.Y }, { data: hist.W },
            { data: hist.Se }, { data: hist.Ye }, { data: hist.We }
          ]
        });
        updateRingNodes(st.S, st.Y, st.W);
        if (step >= maxSteps) { clearInterval(timer); timer = null; }
      }, 40);
    }

    function reset() {
      if (timer) { clearInterval(timer); timer = null; }
      init();
      updateRingNodes(100, 80, 40);
    }

    return { run: run, reset: reset };
  }

  var ecoSim = createSim('ecoSimChart');
  var aiSim = createSim('aiSimChart');

  window.runEcoSim = function() {
    var S = parseFloat(document.getElementById('eco-sim-s').value) || 100;
    var Y = parseFloat(document.getElementById('eco-sim-y').value) || 80;
    var W = parseFloat(document.getElementById('eco-sim-w').value) || 40;
    ecoSim.run(S, Y, W);
  };
  window.resetEcoSim = ecoSim.reset;

  window.runAiSim = function() {
    var S = parseFloat(document.getElementById('ai-sim-s').value) || 100;
    var Y = parseFloat(document.getElementById('ai-sim-y').value) || 80;
    var W = parseFloat(document.getElementById('ai-sim-w').value) || 50;
    aiSim.run(S, Y, W);
  };
  window.resetAiSim = aiSim.reset;

  // ========== Init ==========
  updateRingNodes(100, 80, 40);

})();
