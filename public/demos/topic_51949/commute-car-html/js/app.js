var COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#f43f5e', '#84cc16', '#64748b'];

function iconSvg(name, cls) {
  return '<svg class="icon-svg ' + (cls || '') + '"><use href="#i-' + name + '"/></svg>';
}

// 加载车型数据（当前版本暂未使用，可后续用于车型选择/自动填参）
fetch('data/cars.json')
  .then(function (res) { return res.json(); })
  .then(function (data) {
    window.carData = data;
    console.log('[车型数据] 已加载', data.length, '条');
  })
  .catch(function (err) {
    console.warn('[车型数据] 加载失败', err);
  });

    function switchRiskTab(carType) {
      // 切换 Tab 按钮状态
      document.querySelectorAll('.risk-tab').forEach(function (tab) {
        tab.classList.toggle('active', tab.dataset.car === carType);
      });
      // 切换 Tab 内容
      document.querySelectorAll('.risk-tab-content').forEach(function (content) {
        content.classList.toggle('active', content.dataset.car === carType);
      });
    }

    function toggleSel(btn) {
      var dd = btn.nextElementSibling;
      document.querySelectorAll('.sel-dd').forEach(function (d) {
        if (d !== dd) d.classList.remove('show');
      });
      dd.classList.toggle('show');
    }

    function selectOpt(opt) {
      var val = opt.dataset.val;
      var id = opt.dataset.id;
      document.getElementById(id).value = val;

      var dd = opt.parentNode;
      var btn = dd.previousElementSibling;
      btn.querySelector('.sel-val').textContent = opt.textContent;

      dd.querySelectorAll('.opt').forEach(function (o) { o.classList.remove('active'); });
      opt.classList.add('active');

      dd.classList.remove('show');

      if (id === 'cartype' && typeof switchRiskTab === 'function') {
        switchRiskTab(val);
      }

      if (typeof calcAll === 'function') calcAll();
    }

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.sel-dd') && !e.target.closest('.sel')) {
        document.querySelectorAll('.sel-dd').forEach(function (d) { d.classList.remove('show'); });
      }
    });

    document.querySelectorAll('.opt').forEach(function (opt) {
      opt.onclick = function () { selectOpt(this); };
    });

    function v(id) {
      var e = document.getElementById(id);
      if (!e) return 0;
      var n = parseFloat(e.value);
      return isFinite(n) ? n : 0;
    }
    function fmt(n) { return '¥' + Math.round(Math.max(0, n || 0)).toLocaleString('zh-CN'); }
    function fmt0(n) { return Math.round(Math.max(0, n || 0)).toLocaleString('zh-CN'); }
    function fmt1(n) { return '¥' + (Math.max(0, n || 0)).toFixed(1); }

    var _numState = {};
    function animNum(elId, targetVal, formatter, duration) {
      var el = document.getElementById(elId);
      if (!el) return;
      duration = duration || 600;
      var key = elId;
      var startVal = _numState[key] !== undefined ? _numState[key] : 0;
      _numState[key] = targetVal;
      var start = performance.now();
      function tick(now) {
        var elapsed = now - start;
        var t = Math.min(elapsed / duration, 1);
        var ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        var val = startVal + (targetVal - startVal) * ease;
        el.textContent = formatter(val);
        if (t < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }

    // ======== 智谱AI API ========
    var ZHIPU_API_KEY = 'd4060e5b940649aa8f559068c679fed7.IbhZw8ogiYQqPcyB';
    var _aiAbort = null;
    var _aiStreaming = false;

    async function callZhipuAI(messages, onChunk) {
      if (_aiAbort) _aiAbort.abort();
      _aiAbort = new AbortController();

      try {
        var response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + ZHIPU_API_KEY
          },
          body: JSON.stringify({
            model: 'glm-4-flash',
            messages: messages,
            stream: true,
            max_tokens: 2048,
            temperature: 0.7
          }),
          signal: _aiAbort.signal
        });

        if (!response.ok) throw new Error('API请求失败: ' + response.status);

        var reader = response.body.getReader();
        var decoder = new TextDecoder();
        var fullText = '';

        while (true) {
          var result = await reader.read();
          if (result.done) break;
          var chunk = decoder.decode(result.value);
          var lines = chunk.split('\n');
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (line.startsWith('data:')) {
              var data = line.slice(5).trim();
              if (data && data !== '[DONE]') {
                try {
                  var json = JSON.parse(data);
                  var content = json.choices && json.choices[0] && json.choices[0].delta && json.choices[0].delta.content;
                  if (content) {
                    fullText += content;
                    if (onChunk) onChunk(fullText);
                  }
                } catch (e) { }
              }
            }
          }
        }
        return fullText;
      } catch (err) {
        if (err.name === 'AbortError') return null;
        throw err;
      }
    }

    function buildAIPrompt(result, rGas, rEv, useYears, ct, ctName, accGas, accEv) {
      var km = result.annualKm;
      var cpkm = (result.annualTotal / Math.max(km, 1)).toFixed(2);
      var total = (result.annualTotal - result.interest) * useYears + result.interestTotal;
      var totalGas = (rGas.annualTotal - rGas.interest) * useYears + rGas.interestTotal;
      var totalEv = (rEv.annualTotal - rEv.interest) * useYears + rEv.interestTotal;

      var isNewDriver = (accGas + accEv) / 2 > 0.5;
      var isHighKm = km >= 15000;
      var isLowKm = km < 8000;

      var gasEnergy = (rGas.energyCost / 10000).toFixed(1);
      var evEnergy = (rEv.energyCost / 10000).toFixed(1);

      var gapGasEv = Math.abs(totalGas - totalEv);
      var gapPct = Math.max(totalGas, totalEv) > 0 ? (gapGasEv / Math.max(totalGas, totalEv) * 100).toFixed(1) : 0;
      var cheaperEv = totalEv < totalGas;

      return '你是一个数据驱动的购车顾问。用户提供了非常详细的数据，请**务必用具体数字说话**。用Markdown格式输出，控制在700字以内：\n\n' +
        '【用户核心数据】\n' +
        '- 年通勤里程：**' + km.toLocaleString() + ' km**（' + (km >= 50000 ? '极高' : km >= 20000 ? '高频' : km >= 10000 ? '中频' : '低频') + '）\n' +
        '- 当前选择：' + ctName + '\n' +
        '- ' + useYears + '年总成本：¥' + Math.round(total).toLocaleString() + '\n' +
        '- 年均出险次数：' + accGas + '次（燃油）/ ' + accEv + '次（纯电）\n\n' +
        '【两种车型' + useYears + '年总成本对比】\n' +
        '| 车型 | 10年总成本 | 年能源费 | 年折旧 | 年保险 | 年保养 |\n' +
        '|------|-----------|---------|-------|-------|-------|\n' +
        '| 燃油车 | ¥' + Math.round(totalGas).toLocaleString() + ' | ¥' + (rGas.energyCost).toLocaleString() + ' | ¥' + (rGas.depreciation).toLocaleString() + ' | ¥' + (rGas.insurance).toLocaleString() + ' | ¥' + (rGas.maintenance).toLocaleString() + ' |\n' +
        '| 纯电车 | ¥' + Math.round(totalEv).toLocaleString() + ' | ¥' + (rEv.energyCost).toLocaleString() + ' | ¥' + (rEv.depreciation).toLocaleString() + ' | ¥' + (rEv.insurance).toLocaleString() + ' | ¥' + (rEv.maintenance).toLocaleString() + ' |\n\n' +
        '【关键差异】\n' +
        '- 燃油车 vs 纯电车：差**¥' + Math.round(gapGasEv).toLocaleString() + '**（' + gapPct + '%），折合每月差**¥' + Math.round(gapGasEv / useYears / 12).toLocaleString() + '**\n' +
        '- 年能源费差距：油车¥' + (rGas.energyCost).toLocaleString() + ' vs 电车¥' + (rEv.energyCost).toLocaleString() + '，电车每年省**¥' + (rGas.energyCost - rEv.energyCost).toLocaleString() + '**\n\n' +
        '【输出结构 - 严格按照这个框架】\n\n' +
        '## 一句话结论\n' +
        '直接说燃油车和纯电车二选一，给出明确建议（如果差距<10%说"看你偏好"，如果≥10%说谁更划算）。\n\n' +
        '## 两种车的驾驶风格（用数据说话）\n' +
        '### 燃油车 - 适合追求机械质感的用户\n' +
        '结合数据说明：年能源费¥' + (rGas.energyCost).toLocaleString() + '，10年油费¥' + (rGas.energyCost * useYears).toLocaleString() + '；优点是发动机声浪、机械感、补能5分钟；缺点是每公里成本高、保养频繁。\n' +
        '适合场景：长途自驾、喜欢驾驶操控、对充电桩不放心的人。\n\n' +
        '### 纯电车 - 适合追求舒适科技的通勤用户\n' +
        '结合数据说明：年能源费¥' + (rEv.energyCost).toLocaleString() + '，10年电费¥' + (rEv.energyCost * useYears).toLocaleString() + '，比油车省¥' + (rGas.energyCost * useYears - rEv.energyCost * useYears).toLocaleString() + '；优点是安静平顺、加速快、智能化高；缺点是依赖充电桩、出险维修贵。\n' +
        '适合场景：城市通勤、有家充桩、每天开' + Math.round(km / 365) + 'km的人。\n\n' +
        '## 风险提示\n' +
        '针对用户的具体情况（年里程' + km.toLocaleString() + 'km、出险' + accGas + '次/年）说明：\n' +
        '- 如果年里程高且有家充桩：电车是明显更优解\n' +
        '- 如果经常长途或充电不便：油车更省心\n' +
        '- 如果是新手+出险率高：电车维修贵，慎重考虑\n\n' +
        '【要求】\n' +
        '1. 不要再输出数据表格（用户已经在前面看到了），直接给结论和风格分析\n' +
        '2. 每句话都要有数据支撑，用具体数字\n' +
        '3. 语气直接、真实、不啰嗦，像懂车的老朋友';
    }

    function escapeHtml(s) {
      return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function renderMarkdown(md) {
      if (!md) return '';
      var html = '';
      var lines = md.split('\n');
      var inList = false;
      var inOrderedList = false;
      var inTable = false;
      var tableRows = [];

      function flushList() {
        if (inList) { html += '</ul>'; inList = false; }
        if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
      }

      function flushTable() {
        if (inTable && tableRows.length) {
          html += '<table class="md-table">';
          for (var r = 0; r < tableRows.length; r++) {
            var cells = tableRows[r].split('|').map(function (c) { return c.trim(); }).filter(function (c) { return c !== ''; });
            if (r === 1 && cells.every(function (c) { return /^[-:]+$/.test(c); })) continue;
            var tag = r === 0 ? 'th' : 'td';
            html += '<tr>' + cells.map(function (c) { return '<' + tag + '>' + inline(c) + '</' + tag + '>'; }).join('') + '</tr>';
          }
          html += '</table>';
          tableRows = [];
          inTable = false;
        }
      }

      function inline(s) {
        s = escapeHtml(s);
        s = s.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
        s = s.replace(/__(.+?)__/g, '<b>$1</b>');
        s = s.replace(/\*(.+?)\*/g, '<i>$1</i>');
        s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
        s = s.replace(/\$([^$]+)\$/g, '<span class="md-num">¥$1</span>');
        return s;
      }

      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var trimmed = line.trim();

        if (!trimmed) {
          flushList(); flushTable();
          html += '<br/>';
          continue;
        }

        if (/^\|.*\|$/.test(trimmed)) {
          flushList();
          inTable = true;
          tableRows.push(trimmed);
          continue;
        } else {
          flushTable();
        }

        if (/^###\s+/.test(trimmed)) {
          flushList();
          html += '<h4 class="md-h4">' + inline(trimmed.replace(/^###\s+/, '')) + '</h4>';
          continue;
        }
        if (/^##\s+/.test(trimmed)) {
          flushList();
          html += '<h3 class="md-h3">' + inline(trimmed.replace(/^##\s+/, '')) + '</h3>';
          continue;
        }
        if (/^#\s+/.test(trimmed)) {
          flushList();
          html += '<h2 class="md-h2">' + inline(trimmed.replace(/^#\s+/, '')) + '</h2>';
          continue;
        }

        if (/^[-*]\s+/.test(trimmed)) {
          if (inOrderedList) { html += '</ol>'; inOrderedList = false; }
          if (!inList) { html += '<ul class="md-list">'; inList = true; }
          html += '<li>' + inline(trimmed.replace(/^[-*]\s+/, '')) + '</li>';
          continue;
        }

        if (/^\d+\.\s+/.test(trimmed)) {
          if (inList) { html += '</ul>'; inList = false; }
          if (!inOrderedList) { html += '<ol class="md-list">'; inOrderedList = true; }
          html += '<li>' + inline(trimmed.replace(/^\d+\.\s+/, '')) + '</li>';
          continue;
        }

        flushList();
        html += '<p class="md-p">' + inline(trimmed) + '</p>';
      }
      flushList(); flushTable();
      return html;
    }

    function switchTab(btn, id) {
      var tabs = document.querySelectorAll('.tab');
      for (var i = 0; i < tabs.length; i++) tabs[i].classList.remove('active');
      var bodies = document.querySelectorAll('.tab-body');
      for (var i = 0; i < bodies.length; i++) bodies[i].classList.remove('active');
      if (btn) btn.classList.add('active');
      var body = document.getElementById(id);
      if (body) body.classList.add('active');
    }

    function switchTopTab(tabName) {
      // 切换标签按钮 active 状态
      document.querySelectorAll('.top-tab').forEach(function (tab) {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
      });
      // 切换视图显示
      document.querySelectorAll('.view-section').forEach(function (view) {
        view.classList.toggle('active', view.id === 'view-' + tabName);
      });
      // 切换到历史时重新渲染
      if (tabName === 'history') renderHistoryCards();
      // 切换回决策中心时滚动到顶部
      if (tabName === 'decision') window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function scrollToCalc() { document.getElementById('calc').scrollIntoView({ behavior: 'smooth' }); }
    function scrollToAI() { document.getElementById('ai').scrollIntoView({ behavior: 'smooth' }); }

    function compute(carType) {
      var dist = v('distance'), days = v('days'), extra = v('extra');
      var annualKm = dist * 2 * days * 12 + extra;
      var useYears = v('useYears') || 10;
      var totalKm = annualKm * useYears;

      var price = v('price') * 10000, down = v('down') / 100, years = v('years'), rate = v('rate') / 100;
      var residual = v('residual_' + carType) / 100;

      var gasP = v('gasprice'), elecP = v('elecprice'), gasC = v('gascons'), evC = v('evcons');

      var park = v('park1') + v('park2') + v('park3'), toll = v('toll'), wash = v('wash'), tax = v('tax');

      // 根据车型读取各自参数
      var insLvlEl = document.getElementById('ins_' + carType);
      var insLvl = insLvlEl ? insLvlEl.value : 'std';
      var insBase = v('insbase_' + carType), acc = v('acc_' + carType), repair = v('repair_' + carType), maint = v('maint_' + carType), maintCost = v('maintcost_' + carType);

      // ====== 能源费用 ======
      var energyCost = 0;
      if (carType === 'gas') energyCost = (annualKm / 100) * gasC * gasP;
      else if (carType === 'ev') energyCost = (annualKm / 100) * evC * elecP;

      // ====== 保险费用（根据用户填写的保险等级 + 基础保费）======
      // 用户填的 insbase_xxx 已经是各车型的实际基础保费（油车便宜、电车贵）
      var insMult = insLvl === 'basic' ? 0.75 : insLvl === 'full' ? 1.5 : 1;
      var insurance = insBase * insMult;

      // ====== 保养费用（根据车型类型差异化）======
      // 油车：保养项目最多（机油机滤、火花塞、变速箱油等），费用最高
      // 电车：保养最简单（基本就是检查+空调滤芯），费用最低
      var maintenance = maint * maintCost;
      if (carType === 'ev') {
        maintenance += 600;
      }

      // ====== 维修费用（根据车型类型差异化）======
      // 用户填的 repair_xxx 已经是各车型的基础维修价
      // 电车维修只能去4S店，基础维修价格已经反映了这个差异
      var accidentCost = acc * repair;

      // ====== 折旧（使用用户为各车型填写的残值率）======
      var depTotal = price * (1 - residual);
      var depreciation = depTotal / useYears;

      var parking = park * 12;
      var tolls = toll * 12;
      var washing = wash * 12;

      var loanAmt = price * (1 - down);
      var interestTotal = 0;
      if (years > 0 && rate >= 0 && loanAmt > 0) {
        var m = rate / 12, n = years * 12;
        var monthly = m === 0 ? loanAmt / n : loanAmt * m / (1 - Math.pow(1 + m, -n));
        interestTotal = monthly * n - loanAmt;
      }
      var interestAnnual = years > 0 ? interestTotal / years : 0;

      var items = {
        '能源': energyCost, '折旧': depreciation, '保养': maintenance, '保险': insurance,
        '停车': parking, '过路': tolls, '事故维修': accidentCost, '税费': tax,
        '贷款利息': interestAnnual, '其他': washing
      };
      var annualTotal = 0;
      for (var k in items) annualTotal += items[k];

      return {
        annualKm: annualKm, totalKm: totalKm, useYears: useYears, price: price, annualTotal: annualTotal, items: items,
        energyCost: energyCost, depreciation: depreciation, maintenance: maintenance,
        insurance: insurance, parking: parking, tolls: tolls, accidentCost: accidentCost,
        tax: tax, interest: interestAnnual, washing: washing,
        interestTotal: interestTotal, loanAmt: loanAmt, depTotal: depTotal, residual: residual
      };
    }

    // ECharts 实例
    var chartCostBar = null;
    var chartCostStack = null;
    var chartCostDonut = null;

    function initCharts() {
      if (typeof echarts === 'undefined') return;
      chartCostBar = echarts.init(document.getElementById('costBarChart'));
      chartCostStack = echarts.init(document.getElementById('costStackChart'));
      chartCostDonut = echarts.init(document.getElementById('costDonutChart'));

      window.addEventListener('resize', function () {
        chartCostBar && chartCostBar.resize();
        chartCostStack && chartCostStack.resize();
        chartCostDonut && chartCostDonut.resize();
      });
    }

    function updateCostBarChart(items) {
      if (!chartCostBar) return;
      var arr = Object.entries(items).filter(function (d) { return d[1] > 0; }).sort(function (a, b) { return b[1] - a[1]; });
      var names = arr.map(function (d) { return d[0]; });
      var values = arr.map(function (d) { return d[1]; });
      var colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#f43f5e', '#84cc16', '#64748b'];

      chartCostBar.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          formatter: function (params) {
            var p = params[0];
            return p.name + '<br/>' + p.marker + ' ¥' + Math.round(p.value).toLocaleString('zh-CN') + '/年';
          },
          backgroundColor: 'rgba(10,10,26,.95)',
          borderColor: 'rgba(139,92,246,.3)',
          textStyle: { color: '#e8e8f0' }
        },
        grid: { left: '3%', right: 80, bottom: '3%', top: '3%', containLabel: true },
        xAxis: {
          type: 'value',
          axisLabel: { color: '#a8a8d0', formatter: function (v) { return '¥' + (v / 10000).toFixed(1) + '万'; }, interval: 'auto' },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,.06)' } },
          splitNumber: 4
        },
        yAxis: {
          type: 'category',
          data: names,
          axisLabel: { color: '#e8e8f0' },
          axisLine: { show: false },
          axisTick: { show: false }
        },
        series: [{
          type: 'bar',
          data: values.map(function (v, i) {
            return { value: v, itemStyle: { color: colors[i % colors.length], borderRadius: [0, 6, 6, 0] } };
          }),
          barWidth: 16,
          label: {
            show: true,
            position: 'right',
            color: '#fff',
            fontSize: 11,
            formatter: function (p) { return '¥' + Math.round(p.value).toLocaleString('zh-CN'); }
          }
        }]
      });
    }

    function updateCostStackChart(items, useYears, loanYears) {
      if (!chartCostStack) return;
      var arr = Object.entries(items).filter(function (d) { return d[1] > 0; }).sort(function (a, b) { return b[1] - a[1]; });
      var names = arr.map(function (d) { return d[0]; });
      var years = [];
      var seriesData = {};
      names.forEach(function (name) { seriesData[name] = []; });
      for (var y = 1; y <= useYears; y++) {
        years.push('第' + y + '年');
        var factor = 1 + (y - 1) * 0.015;
        arr.forEach(function (d) {
          var name = d[0], value = d[1];
          var val = value * factor;
          if (name === '贷款利息' && y > loanYears) val = 0;
          seriesData[name].push(Math.round(val));
        });
      }
      var colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#f43f5e', '#84cc16', '#64748b'];
      var series = names.map(function (name, i) {
        return {
          name: name,
          type: 'bar',
          stack: 'total',
          emphasis: { focus: 'series' },
          itemStyle: { color: colors[i % colors.length], borderRadius: i === 0 ? [4, 4, 0, 0] : [0, 0, 0, 0] },
          data: seriesData[name]
        };
      });

      chartCostStack.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: 'rgba(10,10,26,.95)',
          borderColor: 'rgba(139,92,246,.3)',
          textStyle: { color: '#e8e8f0' },
          formatter: function (params) {
            var year = params[0].axisValue;
            var html = '<div style="font-weight:700;margin-bottom:4px">' + year + '</div>';
            var sum = 0;
            params.forEach(function (p) {
              if (p.value > 0) { sum += p.value; html += '<div>' + p.marker + ' ' + p.name + ': ¥' + Math.round(p.value).toLocaleString('zh-CN') + '</div>'; }
            });
            html += '<div style="margin-top:4px;border-top:1px solid rgba(255,255,255,.1);padding-top:4px">合计: ¥' + Math.round(sum).toLocaleString('zh-CN') + '</div>';
            return html;
          }
        },
        legend: {
          bottom: 0,
          left: 'center',
          textStyle: { color: '#a8a8d0', fontSize: 11 },
          itemWidth: 10,
          itemHeight: 10,
          itemGap: 8
        },
        grid: { left: '3%', right: '3%', bottom: '18%', top: '8%', containLabel: true },
        xAxis: {
          type: 'category',
          data: years,
          axisLabel: { color: '#a8a8d0', fontSize: 10, interval: 0, rotate: useYears > 8 ? 45 : 0 },
          axisLine: { lineStyle: { color: 'rgba(255,255,255,.1)' } }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#a8a8d0', formatter: function (v) { return '¥' + (v / 10000).toFixed(1) + '万'; } },
          splitLine: { lineStyle: { color: 'rgba(255,255,255,.06)' } }
        },
        series: series
      });
    }

    function updateCostDonutChart(items, total) {
      if (!chartCostDonut) return;
      var arr = Object.entries(items).filter(function (d) { return d[1] > 0; }).sort(function (a, b) { return b[1] - a[1]; });
      var colors = ['#6366f1', '#a855f7', '#ec4899', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#f43f5e', '#84cc16', '#64748b'];
      var data = arr.map(function (d, i) {
        return { name: d[0], value: Math.round(d[1]), itemStyle: { color: colors[i % colors.length] } };
      });

      chartCostDonut.setOption({
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          formatter: function (p) {
            return p.name + '<br/>' + p.marker + ' ¥' + Math.round(p.value).toLocaleString('zh-CN') + ' (' + p.percent + '%)';
          },
          backgroundColor: 'rgba(10,10,26,.95)',
          borderColor: 'rgba(139,92,246,.3)',
          textStyle: { color: '#e8e8f0' }
        },
        legend: {
          bottom: 0,
          left: 'center',
          textStyle: { color: '#a8a8d0', fontSize: 11 },
          itemWidth: 10,
          itemHeight: 10,
          itemGap: 8
        },
        series: [{
          type: 'pie',
          radius: ['45%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 6, borderColor: '#0a0a1a', borderWidth: 2 },
          label: { show: false },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold', color: '#fff', formatter: '{b}\n{d}%' }
          },
          labelLine: { show: false },
          data: data
        }],
        title: {
          text: '¥' + Math.round(total).toLocaleString('zh-CN'),
          subtext: '年度总成本',
          left: 'center',
          top: '38%',
          textStyle: { color: '#fff', fontSize: 22, fontWeight: 800 },
          subtextStyle: { color: '#a8a8d0', fontSize: 12 }
        }
      });
    }

    function renderCompare(rGas, rEv, useYears) {
      var el = document.getElementById('compare3');
      if (!el) return;
      useYears = useYears || 10;
      var cars = [
        { name: '燃油车', em: iconSvg('gas', 'icon-small'), result: rGas, tags: ['保养便宜', '可选维修厂', '折旧慢', '油价波动'] },
        { name: '纯电动', em: iconSvg('bolt', 'icon-small'), result: rEv, tags: ['电费最低', '保养简单', '必须4S店', '折旧最快'] }
      ];
      var minTotal = 99999999;
      var totals = [];
      for (var i = 0; i < cars.length; i++) {
        var c = cars[i];
        var t = (c.result.annualTotal - c.result.interest) * useYears + c.result.interestTotal;
        totals.push(t);
        if (t < minTotal) minTotal = t;
      }
      var html = '';
      for (var i = 0; i < cars.length; i++) {
        var c = cars[i];
        var t = totals[i];
        var isBest = t === minTotal && minTotal > 0;
        html += '<div class="car-card ' + (isBest ? 'best' : '') + '">' +
          '<div class="car-title">' + c.em + ' ' + c.name + '</div><div class="car-sub">' + useYears + '年全周期 · 含折旧利息</div>' +
          '<div class="car-tags">' + c.tags.map(function (tag) { return '<span class="car-tag">' + tag + '</span>'; }).join('') + '</div>' +
          '<div class="car-total">' + fmt(t) + '</div>' +
          '<div class="car-rows">' +
          '<div class="car-row"><span>年能源费</span><span class="' + (c.result.energyCost === Math.min(rGas.energyCost, rEv.energyCost) ? 'green' : '') + '">' + fmt(c.result.energyCost) + '</span></div>' +
          '<div class="car-row"><span>年保险</span><span class="' + (c.result.insurance === Math.min(rGas.insurance, rEv.insurance) ? 'green' : '') + '">' + fmt(c.result.insurance) + '</span></div>' +
          '<div class="car-row"><span>年停车+过路</span><span>' + fmt(c.result.parking + c.result.tolls) + '</span></div>' +
          '<div class="car-row"><span>年保养</span><span class="' + (c.result.maintenance === Math.min(rGas.maintenance, rEv.maintenance) ? 'green' : '') + '">' + fmt(c.result.maintenance) + '</span></div>' +
          '<div class="car-row"><span>年维修</span><span class="' + (c.result.accidentCost === Math.min(rGas.accidentCost, rEv.accidentCost) ? 'green' : '') + '">' + fmt(c.result.accidentCost) + '</span></div>' +
          '<div class="car-row"><span>年折旧</span><span class="' + (c.result.depreciation === Math.min(rGas.depreciation, rEv.depreciation) ? 'green' : '') + '">' + fmt(c.result.depreciation) + '</span></div>' +
          '<div class="car-row"><span>年均利息</span><span>' + fmt(c.result.interest) + '</span></div>' +
          '<div class="car-row"><span>年里程</span><span>' + fmt0(c.result.annualKm) + ' km</span></div>' +
          '</div></div>';
      }
      el.innerHTML = html;
    }

    function renderChips(result, useYears) {
      var el = document.getElementById('chips');
      if (!el) return;
      useYears = useYears || 10;
      var cartypeEl = document.getElementById('cartype');
      var ct = cartypeEl ? cartypeEl.value : 'gas';
      if (ct !== 'gas' && ct !== 'ev') ct = 'gas';
      var ctName = ct === 'gas' ? '燃油' : '纯电';
      var data = [
        { em: iconSvg('gas', 'icon-small'), t: '燃油费', v: fmt(result.energyCost) + '/年' },
        { em: iconSvg('linechart', 'icon-small'), t: '年折旧', v: fmt(result.depreciation) + '/年' },
        { em: iconSvg('wrench', 'icon-small'), t: '保养费', v: fmt(result.maintenance) + '/年' },
        { em: iconSvg('shield', 'icon-small'), t: '保险', v: fmt(result.insurance) + '/年' },
        { em: iconSvg('parking', 'icon-small'), t: '停车费', v: fmt(result.parking) + '/年' },
        { em: iconSvg('road', 'icon-small'), t: '过路费', v: fmt(result.tolls) + '/年' },
        { em: iconSvg('warning', 'icon-small'), t: '事故维修', v: fmt(result.accidentCost) + '/年' },
        { em: iconSvg('money', 'icon-small'), t: '购置税/税费', v: fmt(result.tax) + '/年' },
        { em: iconSvg('bank', 'icon-small'), t: '贷款利息', v: fmt(result.interest) + '/年' },
        { em: iconSvg('pin', 'icon-small'), t: '单程里程', v: fmt0(v('distance')) + 'km' },
        { em: iconSvg('calendar', 'icon-small'), t: '通勤日数', v: fmt0(v('days')) + '天/月' },
        { em: iconSvg('rocket', 'icon-small'), t: '年总里程', v: fmt0(result.annualKm) + 'km' },
        { em: iconSvg('car', 'icon-small'), t: '当前车型', v: ctName },
        { em: iconSvg('clock', 'icon-small'), t: '使用年限', v: fmt0(useYears) + '年' },
        { em: iconSvg('target', 'icon-small'), t: '首付比例', v: v('down') + '%' },
        { em: iconSvg('bank', 'icon-small'), t: '贷款年限', v: fmt0(v('years')) + '年' },
        { em: iconSvg('chart', 'icon-small'), t: '残值率', v: v('residual_' + ct) + '%' },
        { em: iconSvg('wallet', 'icon-small'), t: '购车价', v: fmt(v('price') * 10000) },
        { em: iconSvg('gas', 'icon-small'), t: '油价', v: v('gasprice') + '元/L' },
        { em: iconSvg('battery', 'icon-small'), t: '电价', v: v('elecprice') + '元/度' },
      ];
      var html = '';
      for (var i = 0; i < data.length; i++) {
        var d = data[i];
        html += '<div class="chip"><div class="chip-em">' + d.em + '</div><div class="chip-t">' + d.t + '</div><div class="chip-v">' + d.v + '</div></div>';
      }
      el.innerHTML = html;
    }

    function renderAI(result, rGas, rEv, useYears) {
      var txt = document.getElementById('aiText'), tags = document.getElementById('aiTags');
      if (!txt || !tags) return;
      useYears = useYears || 10;
      var km = result.annualKm;
      var cpkm = result.annualTotal / Math.max(km, 1);
      var cartypeEl = document.getElementById('cartype');
      var ct = cartypeEl ? cartypeEl.value : 'gas';
      if (ct !== 'gas' && ct !== 'ev') ct = 'gas';
      var ctName = ct === 'gas' ? '燃油车' : '纯电车';
      var downP = v('down'), loanY = v('years'), acc = v('acc_' + ct);

      var tagList = [];
      var advice = [];

      if (km >= 20000) {
        tagList.push({ t: '高频通勤', cls: 'good' });
        var evSave = (rGas.annualTotal - rEv.annualTotal) * useYears;
        advice.push('您的年里程达 <b>' + fmt0(km) + ' 公里</b>，强烈建议考虑新能源。<br>• 纯电' + useYears + '年可省 <b>' + fmt(evSave) + '</b>');
      }
      else if (km >= 10000) {
        tagList.push({ t: '中频通勤', cls: '' });
        advice.push('年里程 <b>' + fmt0(km) + ' 公里</b>，请结合充电条件与保值率综合选择燃油或纯电。');
      }
      else {
        tagList.push({ t: '低频通勤', cls: 'warn' });
        advice.push('年里程仅 <b>' + fmt0(km) + ' 公里</b>，折旧占比高。电车折旧快，建议优先考虑油车或打车方案。');
      }

      if (downP < 20) { tagList.push({ t: '首付偏低', cls: 'bad' }); advice.push('首付比例仅 <b>' + downP + '%</b>，利息负担较重，建议增加首付至 30% 以上。'); }
      else if (downP >= 50) { tagList.push({ t: '首付充裕', cls: 'good' }); advice.push('首付比例 <b>' + downP + '%</b>，财务杠杆合理，利息压力小。'); }

      if (loanY > 5) { tagList.push({ t: '贷款年限过长', cls: 'warn' }); advice.push('贷款年限 <b>' + loanY + ' 年</b>，利息成本偏高，建议缩短至 3 年内。'); }

      if (cpkm > 2) { tagList.push({ t: '每km成本偏高', cls: 'bad' }); advice.push('当前方案每公里成本 <b>' + fmt(cpkm) + '</b>，高于城市平均水平。'); }
      else if (cpkm < 1) { tagList.push({ t: '成本优秀', cls: 'good' }); advice.push('每公里成本仅 <b>' + fmt(cpkm) + '</b>，经济性优秀。'); }

      if (acc > 1) { tagList.push({ t: '事故风险偏高', cls: 'bad' }); advice.push('年均出险 <b>' + acc + ' 次</b>。注意：电车出险维修费用比油车贵1.5-2倍，建议升级全保。'); }
      else if (acc <= 0.3) { tagList.push({ t: '驾驶习惯良好', cls: 'good' }); }

      // ========== 核心对比：电车 vs 油车 ==========
      var accGas = v('acc_gas'), accEv = v('acc_ev');
      var isNewDriver = acc > 0.5;
      var isHighKm = km >= 15000;
      var isLowKm = km < 8000;

      var costGas = (rGas.annualTotal - rGas.interest) * useYears + rGas.interestTotal;
      var costEv = (rEv.annualTotal - rEv.interest) * useYears + rEv.interestTotal;

      // 电车 vs 油车 差距
      var evGasGap = Math.abs(costEv - costGas);
      var evGasGapPct = Math.max(costEv, costGas) > 0 ? evGasGap / Math.max(costEv, costGas) : 0;
      var evCheaper = costEv < costGas;

      // ========== 生成推荐 ==========
      if (evGasGapPct < 0.10) {
        // 电车和油车差距 <10%：给出场景化建议
        tagList.push({ t: '电车/油车各有优势', cls: '' });

        if (isNewDriver) {
          advice.push('作为新手，<b>燃油车</b>的维修体系更成熟，磕碰不心疼，保费也更友好。电车出险维修费用普遍贵1.5-2倍，这点要考虑清楚。');
        }

        if (isHighKm) {
          advice.push('年里程 <b>' + fmt0(km) + 'km</b> 算高频通勤了。如果你有家充桩或公司能充电，<b>纯电车</b>每公里成本只要几分钱，' + useYears + '年能省下 <b>' + fmt(costGas - costEv) + '</b>。');
        } else if (isLowKm) {
          advice.push('年里程 <b>' + fmt0(km) + 'km</b> 不算高，电车折旧快的劣势会暴露出来。<b>燃油车</b>反而更保值，卖车时少亏点。');
        }

        // 最终建议
        if (isNewDriver && isHighKm) {
          advice.push('综合来看：新手+高频通勤，建议 <b>燃油车先开2年</b>，等技术熟练、充电条件具备再换电车。');
        } else if (isNewDriver) {
          advice.push('综合来看：新手建议 <b>燃油车起步</b>，磕碰不心疼，等驾驶习惯稳定后再考虑换电车。');
        } else if (isHighKm) {
          advice.push('综合来看：高频通勤+有充电条件 → <b>电车更省</b>；充电不方便 → <b>油车省心</b>。');
        } else {
          advice.push('综合来看：年里程不高，<b>燃油车</b>更省心保值；如果你有家充桩且打算长期开，<b>电车</b>体验更好。');
        }

      } else {
        // 电车和油车差距 ≥10%：直接推荐便宜的
        var cheaper = evCheaper ? '纯电车' : '燃油车';
        var cheaperCost = evCheaper ? costEv : costGas;
        var expensiveCost = evCheaper ? costGas : costEv;
        var saved = expensiveCost - cheaperCost;

        tagList.push({ t: cheaper + '更划算', cls: 'good' });
        advice.push('<b>' + cheaper + '</b>比另一种方案省 <b>' + fmt(saved) + '</b>（' + useYears + '年总成本差距 <b>' + (evGasGapPct * 100).toFixed(1) + '%</b>），价格差距明显，建议优先考虑。');

        if (evCheaper) {
          if (isNewDriver) {
            advice.push('不过你是新手，电车出险维修贵2倍，保费也会上浮。如果担心磕碰，可以先买个 <b>燃油二手车</b> 练手，开2年再换电车。');
          }
          if (isLowKm) {
            advice.push('年里程不高的话，电车折旧快的劣势会抵消一部分省下的油费。建议确认有家充桩、打算长期开再选电车。');
          }
        } else {
          if (isHighKm) {
            advice.push('年里程高的话，油费确实不便宜。如果你有家充桩，可以重新算一下电车方案，长期可能更省。');
          }
        }
      }

      if (_aiAbort && _aiAbort.signal && !_aiAbort.signal.aborted && _aiStreaming) {
        if (_aiAbort) _aiAbort.abort();
      }

      var tagHtml = '';
      for (var i = 0; i < tagList.length; i++) {
        var t = tagList[i];
        tagHtml += '<span class="tag ' + t.cls + '">' + t.t + '</span>';
      }
      tags.innerHTML = tagHtml + '<button class="tag ai-btn" onclick="requestAIAnalysis()">' + iconSvg('robot', 'icon-tiny') + ' 智能分析</button>';

      var introHtml = '<div class="ai-intro"><p style="margin:0 0 8px 0;color:#cbd5e1">根据您提供的数据，我们分析如下：</p>';
      for (var i = 0; i < advice.length; i++) {
        introHtml += '<p style="margin:0 0 6px 0;color:#e8e8f0">建议 ' + (i + 1) + '：' + advice[i] + '</p>';
      }
      txt.innerHTML = introHtml;
    }

    function requestAIAnalysis() {
      var txt = document.getElementById('aiText');
      if (!txt) return;
      if (_aiStreaming) return;

      var cartypeEl = document.getElementById('cartype');
      var sel = cartypeEl ? cartypeEl.value : 'gas';
      if (sel !== 'gas' && sel !== 'ev') sel = 'gas';
      var useYears = v('useYears') || 10;
      var rGas = compute('gas');
      var rEv = compute('ev');
      var current = sel === 'gas' ? rGas : rEv;
      var ctName = sel === 'gas' ? '燃油车' : '纯电车';
      var accGas = v('acc_gas') || 0, accEv = v('acc_ev') || 0;

      txt.innerHTML = '<div class="ai-loading"><span class="ai-dot"></span><span class="ai-dot"></span><span class="ai-dot"></span> 智能分析正在深度分析您的数据...</div>';

      var prompt = buildAIPrompt(current, rGas, rEv, useYears, sel, ctName, accGas, accEv);
      var messages = [{ role: 'user', content: prompt }];

      _aiStreaming = true;

      var resultDiv = null;
      var pendingText = '';
      var flushTimer = null;
      function flushChunk() {
        if (flushTimer) return;
        flushTimer = setTimeout(function () {
          flushTimer = null;
          if (!resultDiv) {
            txt.innerHTML = '<div class="ai-result"></div>';
            resultDiv = txt.querySelector('.ai-result');
          }
          if (pendingText) {
            resultDiv.innerHTML = renderMarkdown(pendingText) + '<span class="ai-cursor">▌</span>';
          }
        }, 50);
      }

      callZhipuAI(messages, function (chunk) {
        pendingText = chunk;
        flushChunk();
      }).then(function (fullText) {
        _aiStreaming = false;
        if (fullText && resultDiv) {
          resultDiv.innerHTML = renderMarkdown(fullText);
        } else if (fullText) {
          txt.innerHTML = '<div class="ai-result">' + renderMarkdown(fullText) + '</div>';
        }
      }).catch(function (err) {
        _aiStreaming = false;
        if (err && err.name === 'AbortError') return;
        txt.innerHTML = '<div class="ai-error">智能分析暂时不可用，请检查网络连接<br><small>' + (err.message || err) + '</small><br><br><button class="tag ai-btn" onclick="requestAIAnalysis()">' + iconSvg('refresh', 'icon-tiny') + ' 重试</button></div>';
      });
    }

    /* ========== 测算历史记录 ========== */
    var HISTORY_KEY = 'commute_calc_history';
    var HISTORY_PAGE_SIZE = 5;
    var historyDisplayCount = HISTORY_PAGE_SIZE;

    /* 自定义确认弹框 */
    function showConfirm(title, msg, onOk) {
      var overlay = document.getElementById('confirmModal');
      var titleEl = document.getElementById('confirmModalTitle');
      var msgEl = document.getElementById('confirmModalMsg');
      var okBtn = document.getElementById('confirmModalOk');
      var cancelBtn = document.getElementById('confirmModalCancel');
      if (!overlay || !titleEl || !msgEl || !okBtn || !cancelBtn) {
        if (confirm(msg)) onOk();
        return;
      }
      titleEl.textContent = title || '提示';
      msgEl.textContent = msg || '确定要执行此操作吗？';
      overlay.style.display = 'flex';
      // 强制重排以触发过渡动画
      void overlay.offsetWidth;
      overlay.classList.add('show');

      function close() {
        overlay.classList.remove('show');
        setTimeout(function () { overlay.style.display = 'none'; }, 250);
        okBtn.onclick = null;
        cancelBtn.onclick = null;
        overlay.onclick = null;
      }

      okBtn.onclick = function () { close(); onOk(); };
      cancelBtn.onclick = close;
      overlay.onclick = function (e) { if (e.target === overlay) close(); };
    }

    function getInputIds() {
      return ['distance', 'days', 'hw', 'city', 'sub', 'extra', 'cartype', 'price', 'down', 'years', 'rate', 'useYears',
        'gasprice', 'elecprice', 'gascons', 'evcons', 'park1', 'park2', 'park3', 'toll', 'wash', 'tax',
        'ins_gas', 'insbase_gas', 'acc_gas', 'repair_gas', 'maint_gas', 'maintcost_gas', 'residual_gas',
        'ins_ev', 'insbase_ev', 'acc_ev', 'repair_ev', 'maint_ev', 'maintcost_ev', 'residual_ev'];
    }

    function collectInputs() {
      var inputs = {};
      var ids = getInputIds();
      for (var i = 0; i < ids.length; i++) {
        var el = document.getElementById(ids[i]);
        inputs[ids[i]] = el ? el.value : '';
      }
      return inputs;
    }

    function setInputValue(id, value) {
      var el = document.getElementById(id);
      if (!el) return;
      el.value = value;
      // 同步自定义下拉显示
      if (el.tagName === 'INPUT' && el.type === 'hidden') {
        var dd = el.parentNode.querySelector('.sel-dd');
        var btn = el.parentNode.querySelector('.sel');
        if (dd && btn) {
          var opts = dd.querySelectorAll('.opt');
          for (var i = 0; i < opts.length; i++) {
            opts[i].classList.remove('active');
            if (opts[i].dataset.val === value) {
              opts[i].classList.add('active');
              btn.querySelector('.sel-val').textContent = opts[i].textContent;
            }
          }
        }
        if (id === 'cartype' && typeof switchRiskTab === 'function') {
          switchRiskTab(value);
        }
      }
    }

    function getHistory() {
      try {
        var raw = localStorage.getItem(HISTORY_KEY);
        if (!raw) return [];
        var parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch (e) {
        return [];
      }
    }

    function saveHistory(list) {
      try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
      } catch (e) {
        alert('保存失败：本地存储空间不足或浏览器禁止写入');
      }
    }

    function generateShortAdvice(rGas, rEv, useYears) {
      var km = rGas.annualKm;
      var gasTotal = (rGas.annualTotal - rGas.interest) * useYears + rGas.interestTotal;
      var evTotal = (rEv.annualTotal - rEv.interest) * useYears + rEv.interestTotal;
      if (evTotal < gasTotal) {
        if (km >= 15000) return '年里程较高，纯电车型能源成本优势明显，长期更省。';
        return '纯电车型总成本更低，适合有家充桩或充电便利的通勤场景。';
      }
      if (km < 8000) return '年里程较低，燃油车折旧更慢、保值率更高，综合更省。';
      return '当前参数下燃油车综合成本更低，长途或充电不便时更省心。';
    }

    function saveCurrentHistory() {
      var list = getHistory();
      var useYears = v('useYears') || 10;
      var rGas = compute('gas');
      var rEv = compute('ev');
      var gasTotal = (rGas.annualTotal - rGas.interest) * useYears + rGas.interestTotal;
      var evTotal = (rEv.annualTotal - rEv.interest) * useYears + rEv.interestTotal;
      var cartypeEl = document.getElementById('cartype');
      var ct = cartypeEl ? cartypeEl.value : 'gas';
      if (ct !== 'gas' && ct !== 'ev') ct = 'gas';
      var current = ct === 'gas' ? rGas : rEv;
      var total = (current.annualTotal - current.interest) * useYears + current.interestTotal;
      var perKm = total / Math.max(current.totalKm, 1);
      var bestTypeName = evTotal < gasTotal ? '纯电车型' : '燃油车型';
      var advice = generateShortAdvice(rGas, rEv, useYears);

      var item = {
        id: Date.now(),
        savedAt: new Date().toISOString(),
        carType: ct,
        carTypeName: ct === 'gas' ? '燃油车' : '纯电车',
        price: v('price'),
        useYears: useYears,
        totalCost: total,
        perKmCost: perKm,
        gasTotal: gasTotal,
        evTotal: evTotal,
        bestTypeName: bestTypeName,
        advice: advice,
        inputs: collectInputs()
      };
      list.unshift(item);
      saveHistory(list);
      historyDisplayCount = HISTORY_PAGE_SIZE;
      updateHistoryBadge();
      renderHistoryCards();
    }

    function updateHistoryBadge() {
      var list = getHistory();
      var badge = document.getElementById('historyBadge');
      if (badge) badge.textContent = list.length;
    }

    function clearAllHistory() {
      showConfirm('清空历史记录', '确定要清空所有历史记录吗？清空后将无法恢复。', function () {
        saveHistory([]);
        historyDisplayCount = HISTORY_PAGE_SIZE;
        renderHistoryCards();
        updateHistoryBadge();
      });
    }

    function ensureItemTotals(item) {
      // 如果已经保存了有效 TCO，直接返回
      if (item && typeof item.gasTotal === 'number' && typeof item.evTotal === 'number' &&
          isFinite(item.gasTotal) && isFinite(item.evTotal) && item.gasTotal > 0 && item.evTotal > 0) {
        return item;
      }
      if (!item || !item.inputs) return item;

      // 临时用历史记录的输入值重新计算油/电 TCO
      var currentInputs = collectInputs();
      var ids = getInputIds();
      for (var i = 0; i < ids.length; i++) {
        if (item.inputs[ids[i]] !== undefined) {
          setInputValue(ids[i], item.inputs[ids[i]]);
        }
      }
      var useYears = v('useYears') || 10;
      var rGas = compute('gas');
      var rEv = compute('ev');
      var gasTotal = (rGas.annualTotal - rGas.interest) * useYears + rGas.interestTotal;
      var evTotal = (rEv.annualTotal - rEv.interest) * useYears + rEv.interestTotal;
      var ct = item.carType || 'gas';
      if (ct !== 'gas' && ct !== 'ev') ct = 'gas';
      var current = ct === 'gas' ? rGas : rEv;
      var total = (current.annualTotal - current.interest) * useYears + current.interestTotal;
      // 恢复当前表单
      for (var j = 0; j < ids.length; j++) {
        if (currentInputs[ids[j]] !== undefined) {
          setInputValue(ids[j], currentInputs[ids[j]]);
        }
      }
      // 回填并补全字段
      item.gasTotal = gasTotal;
      item.evTotal = evTotal;
      item.totalCost = total;
      item.perKmCost = total / Math.max(current.totalKm, 1);
      item.bestTypeName = evTotal < gasTotal ? '纯电车型' : '燃油车型';
      item.advice = generateShortAdvice(rGas, rEv, useYears);
      return item;
    }

    function renderHistoryCards() {
      var el = document.getElementById('historyCardList');
      var loadMoreEl = document.getElementById('historyLoadMore');
      if (!el) return;
      var list = getHistory();
      if (!list.length) {
        el.innerHTML = '<div class="history-empty-card">暂无历史记录，去决策中心保存您的第一条测算方案吧</div>';
        if (loadMoreEl) loadMoreEl.innerHTML = '';
        updateHistoryBadge();
        return;
      }

      // 分页：每次显示 historyDisplayCount 条
      var total = list.length;
      var showCount = Math.min(historyDisplayCount, total);
      var hasMore = showCount < total;

      var html = '';
      for (var i = 0; i < showCount; i++) {
        var item = ensureItemTotals(list[i]);
        var date = new Date(item.savedAt);
        var timeStr = isNaN(date.getTime()) ? item.savedAt : date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
        var advice = item.advice || '基于当前参数测算的全生命周期成本对比。';
        var best = item.bestTypeName || (item.carType === 'ev' ? '纯电车型' : '燃油车型');
        html += '<div class="history-record-card">' +
          '<div class="history-record-main">' +
          '<div class="history-record-head">' +
          '<span class="history-record-time">' + timeStr + ' 保存</span>' +
          '<span class="history-record-title">单程 ' + (item.inputs && item.inputs.distance || '-') + 'km / 月度 ' + (item.inputs && item.inputs.days || '-') + ' 天</span>' +
          '</div>' +
          '<div class="history-record-advice">' +
          '<b>数据建议：</b>' + advice +
          '</div>' +
          '<div class="history-record-metrics">' +
          '<span>燃油 TCO：' + fmt(item.gasTotal || 0) + '</span>' +
          '<span>纯电 TCO：' + fmt(item.evTotal || 0) + '</span>' +
          '</div>' +
          '</div>' +
          '<div class="history-record-side">' +
          '<div class="history-record-best">' +
          '<div class="history-record-best-label">最优推荐</div>' +
          '<div class="history-record-best-value">' + best + '</div>' +
          '</div>' +
          '<div class="history-record-btns">' +
          '<button class="btn btn-primary" style="padding:8px 16px;font-size:13px" onclick="restoreHistory(' + i + ');switchTopTab(\'decision\');">载入方案</button>' +
          '<button class="btn btn-ghost history-delete-btn" style="padding:8px 14px;font-size:13px" onclick="deleteHistory(' + i + ')">' + iconSvg('trash', 'icon-tiny') + '</button>' +
          '</div>' +
          '</div>' +
          '</div>';
      }
      el.innerHTML = html;

      // 加载更多按钮或完成提示
      if (loadMoreEl) {
        if (hasMore) {
          var remain = total - showCount;
          loadMoreEl.innerHTML = '<button class="btn btn-ghost" onclick="loadMoreHistory()">加载更多（还剩 ' + remain + ' 条）</button>';
        } else {
          loadMoreEl.innerHTML = '<div class="history-load-done">所有历史记录已经加载完毕</div>';
        }
      }

      // 把补全后的数据写回 localStorage（对旧数据做一次迁移）
      saveHistory(list);
      updateHistoryBadge();
    }

    function loadMoreHistory() {
      historyDisplayCount += HISTORY_PAGE_SIZE;
      renderHistoryCards();
    }

    function restoreHistory(index) {
      var list = getHistory();
      if (index < 0 || index >= list.length) return;
      var item = list[index];
      if (!item || !item.inputs) return;
      var ids = getInputIds();
      for (var i = 0; i < ids.length; i++) {
        if (item.inputs[ids[i]] !== undefined) {
          setInputValue(ids[i], item.inputs[ids[i]]);
        }
      }
      // 兼容旧数据：若车型为已移除的 hybrid，则重置为燃油车
      var cartypeEl = document.getElementById('cartype');
      if (cartypeEl && cartypeEl.value !== 'gas' && cartypeEl.value !== 'ev') {
        setInputValue('cartype', 'gas');
      }
      calcAll();
    }

    function deleteHistory(index) {
      var list = getHistory();
      if (index < 0 || index >= list.length) return;
      showConfirm('删除历史记录', '确定要删除这条历史记录吗？删除后将无法恢复。', function () {
        list.splice(index, 1);
        saveHistory(list);
        renderHistoryCards();
        updateHistoryBadge();
      });
    }

    function exportHistory() {
      var list = getHistory();
      var blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'commute_calc_history_' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function importHistoryFile(file) {
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var imported = JSON.parse(e.target.result);
          if (!Array.isArray(imported)) {
            alert('导入失败：文件内容必须是数组');
            return;
          }
          var requiredFields = ['id', 'savedAt', 'carType', 'price', 'useYears', 'totalCost', 'perKmCost', 'inputs'];
          var valid = [];
          for (var i = 0; i < imported.length; i++) {
            var item = imported[i];
            var ok = item && typeof item === 'object';
            for (var j = 0; j < requiredFields.length && ok; j++) {
              if (item[requiredFields[j]] === undefined) ok = false;
            }
            if (ok) valid.push(item);
          }
          if (!valid.length) {
            alert('导入失败：未找到有效的历史记录条目');
            return;
          }
          var list = getHistory();
          list = valid.concat(list);
          saveHistory(list);
          renderHistoryCards();
          updateHistoryBadge();
          alert('成功导入 ' + valid.length + ' 条历史记录');
        } catch (err) {
          alert('导入失败：文件解析错误，请检查是否为有效的 JSON');
        }
      };
      reader.onerror = function () {
        alert('导入失败：无法读取文件');
      };
      reader.readAsText(file);
    }

    /* ========== Scroll Reveal 观察者 ========== */
    (function () {
      if (!('IntersectionObserver' in window)) {
        var reveals = document.querySelectorAll('.reveal');
        for (var i = 0; i < reveals.length; i++) reveals[i].classList.add('revealed');
        return;
      }
      var observer = new IntersectionObserver(function (entries) {
        var needResize = false;
        for (var i = 0; i < entries.length; i++) {
          var entry = entries[i];
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
            needResize = true;
          }
        }
        // 卡片浮现后触发图表 resize，避免 ECharts 在隐藏容器初始化后尺寸异常
        if (needResize) {
          setTimeout(function () { window.dispatchEvent(new Event('resize')); }, 50);
        }
      }, { threshold: 0.05, rootMargin: '0px 0px -30px 0px' });
      var reveals = document.querySelectorAll('.reveal');
      for (var j = 0; j < reveals.length; j++) observer.observe(reveals[j]);

      // 页面加载时，已处于视口内的元素直接显示，避免首屏下方关键内容空白
      setTimeout(function () {
        for (var k = 0; k < reveals.length; k++) {
          var rect = reveals[k].getBoundingClientRect();
          if (rect.top < window.innerHeight && rect.bottom > 0) {
            reveals[k].classList.add('revealed');
            observer.unobserve(reveals[k]);
          }
        }
      }, 100);
    })();

    function calcAll() {
      try {
        var cartypeEl = document.getElementById('cartype');
        var sel = cartypeEl ? cartypeEl.value : 'gas';
        if (sel !== 'gas' && sel !== 'ev') sel = 'gas';
        var useYears = v('useYears') || 10;
        var rGas = compute('gas');
        var rEv = compute('ev');
        var current = sel === 'gas' ? rGas : rEv;

        var total = (current.annualTotal - current.interest) * useYears + current.interestTotal;
        var totalLbl = document.getElementById('totalYearsLbl');
        if (totalLbl) totalLbl.textContent = useYears;
        animNum('totalOut', total, function (v) { return '¥' + Math.round(v).toLocaleString('zh-CN'); });
        animNum('perkm', total / Math.max(current.totalKm, 1), function (v) { return '¥' + v.toFixed(1) + '/km'; });
        animNum('perday', total / (useYears * 365), function (v) { return '¥' + Math.round(v).toLocaleString('zh-CN') + '/天'; });
        animNum('permonth', total / (useYears * 12), function (v) { return '¥' + Math.round(v).toLocaleString('zh-CN') + '/月'; });

        var costItems = {
          '能源': current.energyCost,
          '折旧': current.depreciation,
          '保养': current.maintenance,
          '保险': current.insurance,
          '停车': current.parking,
          '过路': current.tolls,
          '事故维修': current.accidentCost,
          '税费': current.tax,
          '贷款利息': current.interest,
          '其他': current.washing
        };
        var loanYears = v('years');
        updateCostBarChart(costItems);
        updateCostStackChart(costItems, useYears, loanYears);
        updateCostDonutChart(costItems, current.annualTotal);
        renderCompare(rGas, rEv, useYears);
        renderChips(current, useYears);
        renderAI(current, rGas, rEv, useYears);
      } catch (err) { console.error('[calc error]', err); }
    }

    function initHero3D() {
      if (typeof THREE === 'undefined') return;
      var container = document.getElementById('hero-3d');
      if (!container) return;
      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 1000);
      camera.position.z = 30;
      var renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(renderer.domElement);

      // 创建一个发光的科技感圆环/粒子（透明度降低，让星空更突出）
      var geometry = new THREE.TorusGeometry(6, 0.5, 16, 100);
      var material = new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.25 });
      var torus = new THREE.Mesh(geometry, material);
      scene.add(torus);

      var geo2 = new THREE.TorusGeometry(10, 0.35, 16, 100);
      var mat2 = new THREE.MeshBasicMaterial({ color: 0xa855f7, wireframe: true, transparent: true, opacity: 0.18 });
      var torus2 = new THREE.Mesh(geo2, mat2);
      torus2.rotation.x = Math.PI / 4;
      scene.add(torus2);

      // 内部线框球体
      var geo3 = new THREE.IcosahedronGeometry(3, 1);
      var mat3 = new THREE.MeshBasicMaterial({ color: 0x6366f1, wireframe: true, transparent: true, opacity: 0.12 });
      var ico = new THREE.Mesh(geo3, mat3);
      scene.add(ico);

      // 粒子星空（移动端降低数量保证性能）
      var particlesGeo = new THREE.BufferGeometry();
      var count = window.innerWidth < 768 ? 400 : 800;
      var positions = new Float32Array(count * 3);
      var colors = new Float32Array(count * 3);
      var particlePalette = [
        new THREE.Color(0x6366f1),
        new THREE.Color(0xa855f7),
        new THREE.Color(0x06b6d4),
        new THREE.Color(0xec4899),
        new THREE.Color(0xf59e0b),
        new THREE.Color(0xffffff)
      ];
      for (var i = 0; i < count; i++) {
        positions[i * 3] = (Math.random() - 0.5) * 80;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 80;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 80;
        var c = particlePalette[Math.floor(Math.random() * particlePalette.length)];
        colors[i * 3] = c.r;
        colors[i * 3 + 1] = c.g;
        colors[i * 3 + 2] = c.b;
      }
      particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      var particlesMat = new THREE.PointsMaterial({ size: 0.15, transparent: true, opacity: 0.75, vertexColors: true, sizeAttenuation: true });
      var particles = new THREE.Points(particlesGeo, particlesMat);
      scene.add(particles);

      function animate() {
        requestAnimationFrame(animate);
        torus.rotation.x += 0.0021;
        torus.rotation.y += 0.0035;
        torus2.rotation.x += 0.0014;
        torus2.rotation.y -= 0.0028;
        ico.rotation.x += 0.002;
        ico.rotation.y += 0.003;
        particles.rotation.y += 0.0007;
        // 整体轻微呼吸效果：透明度 + 缩放
        var time = Date.now() * 0.0005;
        var s = 1 + Math.sin(time) * 0.02;
        particles.scale.set(s, s, s);
        particlesMat.opacity = 0.7 + Math.sin(time * 1.3) * 0.05;
        renderer.render(scene, camera);
      }
      animate();

      window.addEventListener('resize', function () {
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
      });
    }

    window.addEventListener('scroll', function () {
      var scrollY = window.scrollY || window.pageYOffset;
      document.body.style.setProperty('--scroll-y', scrollY + 'px');
    });

    function init() {
      initHero3D();
      initCharts();
      calcAll();
      updateHistoryBadge();
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
