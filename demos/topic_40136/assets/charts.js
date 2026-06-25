// assets/charts.js — 五行生克博弈竞争力评估模型（预设模式 + 自定义模式）
(function() {
  var style = getComputedStyle(document.documentElement);
  var accent = style.getPropertyValue('--accent').trim();
  var accent2 = style.getPropertyValue('--accent2').trim();
  var accent3 = style.getPropertyValue('--accent3').trim();
  var ink = style.getPropertyValue('--ink').trim();
  var ink2 = style.getPropertyValue('--ink2').trim();
  var muted = style.getPropertyValue('--muted').trim();
  var rule = style.getPropertyValue('--rule').trim();
  var bg = style.getPropertyValue('--bg').trim();
  var bg2 = style.getPropertyValue('--bg2').trim();
  var bg3 = style.getPropertyValue('--bg3').trim();
  var green = style.getPropertyValue('--green').trim();
  var red = style.getPropertyValue('--red').trim();
  var wood = style.getPropertyValue('--wood').trim();
  var fire = style.getPropertyValue('--fire').trim();
  var earth = style.getPropertyValue('--earth').trim();
  var metal = style.getPropertyValue('--metal').trim();
  var water = style.getPropertyValue('--water').trim();

  var DIMS = ['wood', 'fire', 'earth', 'metal', 'water'];
  var EL_SYMBOLS = { wood: '木', fire: '火', earth: '土', metal: '金', water: '水' };

  // Preset names
  var PRESET = {
    wood: '用户流量底盘',
    fire: '模型技术实力',
    earth: '隐私公信信任',
    metal: '商业变现健康',
    water: '外部制衡风险'
  };

  // Short labels for weight/breakdown
  var SHORT = {
    wood: '流量', fire: '技术', earth: '公信', metal: '变现', water: '风险'
  };

  // Current mode
  var currentMode = 'preset'; // 'preset' | 'custom'

  // =============================================
  // Get current dimension names
  // =============================================
  function getNames() {
    var names = {};
    DIMS.forEach(function(dim) {
      if (currentMode === 'custom') {
        var input = document.getElementById('custom-' + dim);
        names[dim] = input ? input.value.trim() || PRESET[dim] : PRESET[dim];
      } else {
        names[dim] = PRESET[dim];
      }
    });
    return names;
  }

  function getShortLabels(names) {
    var short = {};
    DIMS.forEach(function(dim) {
      var n = names[dim];
      short[dim] = n.length > 4 ? n.substring(0, 4) : n;
    });
    return short;
  }

  // =============================================
  // Refresh all dynamic labels
  // =============================================
  function refreshAllLabels() {
    var names = getNames();
    var short = getShortLabels(names);

    // 1. Dim labels (scoring section headers)
    DIMS.forEach(function(dim) {
      var el = document.getElementById('label-' + dim);
      if (el) el.textContent = names[dim];
    });

    // 2. Weight labels
    DIMS.forEach(function(dim) {
      var el = document.getElementById('wlabel-' + dim);
      if (el) el.textContent = EL_SYMBOLS[dim] + '\u00B7' + short[dim];
    });

    // 3. Breakdown labels
    var bdIcons = { wood: '\u{1F331}', fire: '\u{1F525}', earth: '\u{1F30D}', metal: '\u{2696}', water: '\u{1F4A7}' };
    DIMS.forEach(function(dim) {
      var el = document.getElementById('bdl-' + dim);
      if (el) el.textContent = bdIcons[dim] + ' ' + EL_SYMBOLS[dim] + '\u00B7' + short[dim];
    });

    // 4. Element card labels (section 1)
    DIMS.forEach(function(dim) {
      var el = document.getElementById('elcard-' + dim);
      if (el) el.textContent = names[dim];
    });

    // 5. Formula box mapping
    DIMS.forEach(function(dim) {
      var el = document.getElementById('fml-' + dim);
      if (el) el.textContent = EL_SYMBOLS[dim] + '=' + names[dim];
    });

    // 6. Mode hint
    var hint = document.getElementById('mode-hint');
    if (hint) {
      if (currentMode === 'preset') {
        hint.textContent = DIMS.map(function(d) { return EL_SYMBOLS[d] + '\u2192' + short[d]; }).join(' \u00B7 ');
      } else {
        hint.textContent = '\u270F \u81EA\u5B9A\u4E49\u6A21\u5F0F\uFF1A\u6BCF\u4E2A\u7EF4\u5EA6\u53EF\u81EA\u7531\u547D\u540D';
      }
    }

    // 7. Sheng card relations
    var shengPairs = [[0,1],[1,2],[2,3],[3,4],[4,0]];
    var shengDims = [0, 1, 2, 3, 4];
    var dimKeys = ['wood','fire','earth','metal','water'];
    shengPairs.forEach(function(pair, i) {
      var el = document.getElementById('sk-sheng-' + i);
      if (el) {
        var fromSym = EL_SYMBOLS[dimKeys[pair[0]]];
        var toSym = EL_SYMBOLS[dimKeys[pair[1]]];
        var fromShort = short[dimKeys[pair[0]]];
        var toShort = short[dimKeys[pair[1]]];
        el.textContent = fromSym + ' \u2192 ' + toSym + ' \u2502 ' + fromShort + '\u517B\u62A4' + toShort;
      }
    });

    // 8. Ke card relations
    var kePairs = [[0,2],[2,4],[4,1],[1,3],[3,0]];
    kePairs.forEach(function(pair, i) {
      var el = document.getElementById('sk-ke-' + i);
      if (el) {
        var fromSym = EL_SYMBOLS[dimKeys[pair[0]]];
        var toSym = EL_SYMBOLS[dimKeys[pair[1]]];
        var fromShort = short[dimKeys[pair[0]]];
        var toShort = short[dimKeys[pair[1]]];
        el.textContent = fromSym + ' \u2716 ' + toSym + ' \u2502 ' + fromShort + '\u514B\u5236' + toShort;
      }
    });

    // 9. Imbalance pattern labels
    var ibEl = document.getElementById('ib-0');
    if (ibEl) ibEl.textContent = '\u4E94\u884C\u5E73\u548C\u5747\u8861';
    var ibEl1 = document.getElementById('ib-1');
    if (ibEl1) ibEl1.textContent = EL_SYMBOLS.wood + '\u65FA' + EL_SYMBOLS.earth + '\u5F31';
    var ibEl2 = document.getElementById('ib-2');
    if (ibEl2) ibEl2.textContent = EL_SYMBOLS.fire + '\u65FA' + EL_SYMBOLS.metal + '\u5F31';
    var ibEl3 = document.getElementById('ib-3');
    if (ibEl3) ibEl3.textContent = EL_SYMBOLS.water + '\u65FA' + EL_SYMBOLS.fire + '\u5F31';

    // 10. Flow node labels (business model section)
    // Keep original - these describe business flow steps, not element dimensions

    // 11. Radar chart - update via re-render
    radarChart.setOption(getRadarOption(getCurrentScores()));

    // 12. Wuxing cycle graph - update tooltip labels
    wuxingChart.setOption(getWuxingOption(names));
  }

  // =============================================
  // Mode Switch
  // =============================================
  window.switchMode = function(mode) {
    currentMode = mode;
    // Update button states
    document.getElementById('mode-preset-btn').className = mode === 'preset' ? 'mode-btn mode-active' : 'mode-btn';
    document.getElementById('mode-custom-btn').className = mode === 'custom' ? 'mode-btn mode-active' : 'mode-btn';
    // Show/hide custom name panel
    document.getElementById('custom-name-panel').style.display = mode === 'custom' ? 'block' : 'none';
    refreshAllLabels();
    updateScore();
  };

  window.onCustomNameChange = function() {
    refreshAllLabels();
    updateScore();
  };

  // =============================================
  // WUXING CYCLE GRAPH
  // =============================================
  var wuxingChart = echarts.init(document.getElementById('chart-wuxing'), null, { renderer: 'svg' });

  var cx = 50, cy = 50, r = 32;
  var angles = [-90, -18, 54, 126, 198];
  var positions = angles.map(function(a) {
    var rad = a * Math.PI / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  });

  var dimKeys = ['wood', 'fire', 'earth', 'metal', 'water'];
  var elColors = { wood: wood, fire: fire, earth: earth, metal: metal, water: water };

  function getWuxingOption(names) {
    var shengPairs = [[0,1],[1,2],[2,3],[3,4],[4,0]];
    var kePairs = [[0,2],[2,4],[4,1],[1,3],[3,0]];

    var nodes = dimKeys.map(function(dim, i) {
      var n = names[dim] || PRESET[dim];
      return {
        id: String(i),
        name: EL_SYMBOLS[dim],
        x: positions[i][0],
        y: positions[i][1],
        symbol: 'circle',
        symbolSize: 58,
        itemStyle: {
          color: bg2,
          borderColor: elColors[dim],
          borderWidth: 3,
          shadowColor: elColors[dim] + '44',
          shadowBlur: 12
        },
        label: {
          show: true,
          fontSize: 22,
          fontWeight: 700,
          color: elColors[dim],
          fontFamily: 'GeistMono, monospace'
        }
      };
    });

    var shengEdges = shengPairs.map(function(pair) {
      return {
        source: String(pair[0]),
        target: String(pair[1]),
        lineStyle: { color: green, width: 2.5, curveness: 0.25, type: 'solid' },
        symbol: ['none', 'arrow'],
        symbolSize: [0, 10]
      };
    });

    var keEdges = kePairs.map(function(pair) {
      return {
        source: String(pair[0]),
        target: String(pair[1]),
        lineStyle: { color: red + '88', width: 1.5, curveness: 0, type: 'dashed' },
        symbol: ['none', 'arrow'],
        symbolSize: [0, 8]
      };
    });

    return {
      animation: false,
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        backgroundColor: bg2,
        borderColor: rule,
        textStyle: { color: ink, fontSize: 12 },
        formatter: function(params) {
          if (params.dataType === 'node') {
            var d = dimKeys[parseInt(params.data.id)];
            return '<b>' + EL_SYMBOLS[d] + '</b> \u00B7 ' + (names[d] || PRESET[d]);
          }
          return '';
        }
      },
      graphic: [
        { type: 'group', left: '5%', top: '5%',
          children: [
            { type: 'line', shape: { x1: 0, y1: 8, x2: 24, y2: 8 }, style: { stroke: green, lineWidth: 2.5 } },
            { type: 'text', style: { text: ' \u76F8\u751F\uFF08\u6B63\u5411\u589E\u76CA\uFF09', x: 28, y: 0, fill: ink2, fontSize: 11 } }
          ]
        },
        { type: 'group', left: '5%', top: '12%',
          children: [
            { type: 'line', shape: { x1: 0, y1: 8, x2: 24, y2: 8 }, style: { stroke: red + '88', lineWidth: 1.5 } },
            { type: 'text', style: { text: ' \u76F8\u514B\uFF08\u53CD\u5411\u5236\u8861\uFF09', x: 28, y: 0, fill: ink2, fontSize: 11 } }
          ]
        },
        { type: 'text', style: { text: '\u4E94\u884C\u751F\u514B', x: cx, y: cy - 3, fill: muted, fontSize: 13, fontWeight: 700, fontFamily: 'GeistMono, monospace', textAlign: 'center' }},
        { type: 'text', style: { text: '\u5FAA\u73AF\u56FE', x: cx, y: cy + 10, fill: muted, fontSize: 11, fontFamily: 'GeistMono, monospace', textAlign: 'center' }}
      ],
      series: [{
        type: 'graph',
        layout: 'none',
        coordinateSystem: undefined,
        data: nodes,
        links: shengEdges.concat(keEdges),
        emphasis: { focus: 'adjacency', lineStyle: { width: 3 } },
        roam: false
      }],
      xAxis: { show: false, min: 0, max: 100 },
      yAxis: { show: false, min: 0, max: 100 },
      grid: { left: 0, right: 0, top: 0, bottom: 0 }
    };
  }

  wuxingChart.setOption(getWuxingOption(PRESET));

  // =============================================
  // RADAR CHART
  // =============================================
  var radarChart = echarts.init(document.getElementById('chart-radar'), null, { renderer: 'svg' });

  function getRadarOption(scores) {
    var names = getNames();
    var indicators = [
      { name: '\u6728\u00B7' + (names.wood || PRESET.wood), max: 100 },
      { name: '\u706B\u00B7' + (names.fire || PRESET.fire), max: 100 },
      { name: '\u571F\u00B7' + (names.earth || PRESET.earth), max: 100 },
      { name: '\u91D1\u00B7' + (names.metal || PRESET.metal), max: 100 },
      { name: '\u6C34\u00B7' + (names.water || PRESET.water), max: 100 }
    ];

    return {
      animation: false,
      tooltip: {
        trigger: 'item',
        appendToBody: true,
        backgroundColor: bg2,
        borderColor: rule,
        textStyle: { color: ink, fontSize: 12 }
      },
      radar: {
        indicator: indicators,
        shape: 'polygon',
        splitNumber: 5,
        radius: '70%',
        axisName: {
          color: ink2,
          fontSize: 10,
          fontWeight: 600,
          formatter: function(name) {
            if (name.length > 6) return name.substring(0, 6) + '\n' + name.substring(6);
            return name;
          }
        },
        splitLine: { lineStyle: { color: rule, width: 1 } },
        splitArea: { show: true, areaStyle: { color: [bg, bg3, bg2, bg3, bg] } },
        axisLine: { lineStyle: { color: rule } }
      },
      series: [{
        type: 'radar',
        symbol: 'circle',
        symbolSize: 8,
        data: [{
          value: scores,
          name: '\u4E94\u884C\u8BC4\u4F30',
          lineStyle: { color: accent, width: 2.5 },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: wood + '33' },
                { offset: 0.25, color: fire + '33' },
                { offset: 0.5, color: earth + '33' },
                { offset: 0.75, color: metal + '33' },
                { offset: 1, color: water + '33' }
              ]
            }
          },
          itemStyle: { color: accent, borderColor: bg, borderWidth: 2 }
        }]
      }]
    };
  }

  // =============================================
  // Helper: get current scores as array
  // =============================================
  function getCurrentScores() {
    return DIMS.map(function(dim) {
      var el = document.getElementById('score-' + dim);
      return el ? parseInt(el.value) : 0;
    });
  }

  // =============================================
  // Toggle sub-indicators
  // =============================================
  window.toggleDim = function(dimId) {
    var subs = document.getElementById('subs-' + dimId);
    var icon = document.getElementById('toggle-' + dimId);
    if (subs.classList.contains('open')) {
      subs.classList.remove('open');
      icon.classList.remove('open');
    } else {
      subs.classList.add('open');
      icon.classList.add('open');
    }
  };

  // =============================================
  // Calculate dimension from sub-indicators
  // =============================================
  window.calcDimFromSubs = function(dimId) {
    var total = 0;
    for (var i = 0; i < 5; i++) {
      var subEl = document.getElementById('sub-' + dimId + '-' + i);
      var valEl = document.getElementById('sub-' + dimId + '-' + i);
      if (subEl && valEl) {
        var v = parseInt(subEl.value);
        valEl.textContent = v;
        total += v;
      }
    }
    var mainSlider = document.getElementById('score-' + dimId);
    var valDisplay = document.getElementById('val-' + dimId);
    if (mainSlider && valDisplay) {
      mainSlider.value = total;
      valDisplay.textContent = total;
    }
    updateScore();
  };

  // =============================================
  // Imbalance Detection
  // =============================================
  function checkImbalance(scores) {
    var max = Math.max.apply(null, scores);
    var min = Math.min.apply(null, scores);
    var warnings = [];
    var names = getNames();
    var keMap = { wood: 'earth', earth: 'water', water: 'fire', fire: 'metal', metal: 'wood' };

    if (max - min > 40) {
      var maxDim = DIMS[scores.indexOf(max)];
      var minDim = DIMS[scores.indexOf(min)];
      warnings.push('\u300C' + EL_SYMBOLS[maxDim] + '\u00B7' + names[maxDim] + '\u300D\u8FC7\u65FA\uFF08' + max + '\u5206\uFF09\u3001\u300C' + EL_SYMBOLS[minDim] + '\u00B7' + names[minDim] + '\u300D\u8FC7\u8870\uFF08' + min + '\u5206\uFF09\uFF0C\u5DEE\u8DDD\u8FBE' + (max - min) + '\u5206\uFF0C\u89E6\u53D1\u5931\u8861\u9884\u8B66\u3002');
    }

    DIMS.forEach(function(dim) {
      var keTarget = keMap[dim];
      if (scores[DIMS.indexOf(dim)] > 80 && scores[DIMS.indexOf(keTarget)] < 30) {
        warnings.push('\u300C' + EL_SYMBOLS[dim] + '\u00B7' + names[dim] + '\u300D\u8FC7\u65FA\u514B\u5236\u300C' + EL_SYMBOLS[keTarget] + '\u00B7' + names[keTarget] + '\u300D\uFF0C\u51FA\u73B0\u76F8\u4E58\u5931\u8861\u98CE\u9669\u3002');
      }
    });

    return warnings;
  }

  // =============================================
  // Main Score Calculation
  // =============================================
  window.updateScore = function() {
    var scores = {};
    var weights = {};
    var names = getNames();
    var short = getShortLabels(names);

    DIMS.forEach(function(dim) {
      scores[dim] = parseInt(document.getElementById('score-' + dim).value);
      weights[dim] = parseInt(document.getElementById('w-' + dim).value) / 100;
      document.getElementById('val-' + dim).textContent = scores[dim];
      document.getElementById('wval-' + dim).textContent = weights[dim].toFixed(2);
    });

    // Positive: wood, fire, earth, metal
    var posTotal = 0;
    ['wood', 'fire', 'earth', 'metal'].forEach(function(dim) {
      var contrib = scores[dim] * weights[dim];
      posTotal += contrib;
      document.getElementById('bd-' + dim).textContent = '+' + contrib.toFixed(1);
    });

    // Negative: water
    var negContrib = scores.water * weights.water;
    document.getElementById('bd-water').textContent = '-' + negContrib.toFixed(1);

    var totalScore = posTotal - negContrib;

    // Imbalance penalty
    var scoreArr = DIMS.map(function(d) { return scores[d]; });
    var imbalances = checkImbalance(scoreArr);
    var penalty = 0;
    if (imbalances.length > 0) {
      penalty = imbalances.length * 5;
      totalScore -= penalty;
    }

    document.getElementById('bd-total').textContent = totalScore.toFixed(1) + (penalty > 0 ? ' (\u542B\u5931\u8861\u6263' + penalty + ')' : '');

    // Warning display
    var warningEl = document.getElementById('imbalance-warning');
    var warningText = document.getElementById('imbalance-text');
    if (imbalances.length > 0) {
      warningEl.classList.add('show');
      warningText.innerHTML = imbalances.join('<br>');
    } else {
      warningEl.classList.remove('show');
    }

    // Grade
    var grade, gradeClass, scoreColor;
    if (totalScore >= 70) {
      grade = 'S \u7EA7 \u2014 \u4E94\u884C\u5E73\u548C\u5747\u8861';
      gradeClass = 'grade-S';
      scoreColor = green;
    } else if (totalScore >= 45) {
      grade = 'A \u7EA7 \u2014 \u751F\u6001\u8F83\u4E3A\u5065\u5EB7';
      gradeClass = 'grade-A';
      scoreColor = accent;
    } else if (totalScore >= 25) {
      grade = 'B \u7EA7 \u2014 \u5B58\u5728\u660E\u663E\u77ED\u677F';
      gradeClass = 'grade-B';
      scoreColor = accent3;
    } else {
      grade = 'C \u7EA7 \u2014 \u4E94\u884C\u4E25\u91CD\u5931\u8861';
      gradeClass = 'grade-C';
      scoreColor = red;
    }

    document.getElementById('total-score').textContent = totalScore.toFixed(1);
    document.getElementById('total-score').style.color = scoreColor;
    var gradeEl = document.getElementById('score-grade');
    gradeEl.textContent = grade;
    gradeEl.className = 'score-grade ' + gradeClass;

    // Update radar
    radarChart.setOption(getRadarOption(scoreArr));
  };

  // Initial render
  updateScore();

  // Resize
  window.addEventListener('resize', function() {
    wuxingChart.resize();
    radarChart.resize();
  });
})();